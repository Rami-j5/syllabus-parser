# google_sync.py — Creates Google Calendar events and Tasks from parsed syllabus items

import os
import re
from datetime import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# Scopes define what permissions we request from the user's Google account.
# We only request what we actually need — asking for too much erodes user trust.
SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/tasks"
]


def get_google_credentials():
    """
    Handles the full OAuth flow.
    - First run: opens browser for Google login, saves token.json
    - Subsequent runs: loads token.json, refreshes if expired
    """
    creds = None

    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

    return creds


def parse_date_and_time(item):
    """
    Validates the item's date and extracts a specific time from the description if present.
    Returns (valid_date, time_str, description) where:
    - valid_date is YYYY-MM-DD or None if the date wasn't a real date
    - time_str is "HH:MM" in 24hr format if found, otherwise None
    - description is cleaned up (time phrase removed, edge cases noted)
    """
    date_str = item.get("date")
    description = item.get("description") or ""
    time_str = None
    valid_date = None
    time_match = None

    if date_str:
        # Handle comma-separated dates like "2026-03-03, 2026-03-04"
        # For a single date this just produces a list of one, so it works both ways
        possible_dates = [d.strip() for d in date_str.split(",")]

        for possible in possible_dates:
            try:
                datetime.strptime(possible, "%Y-%m-%d")
                valid_date = possible
                break
            except ValueError:
                continue

        if not valid_date:
            # Date was something like "Ongoing" or "Final Exam Period"
            # Move it into the description so the info isn't lost
            if date_str not in description:
                description = f"Date: {date_str}. {description}".strip()

        elif len(possible_dates) > 1:
            # Multiple dates found — note all of them rather than guessing which one
            all_dates = ", ".join(possible_dates)
            if all_dates not in description:
                description = f"Possible dates: {all_dates}. {description}".strip()

    if valid_date and description:
        # Look for time patterns like "5:00PM", "5:00 PM"
        time_match = re.search(r"(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?", description)

    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2))
        period = time_match.group(3)

        # Convert to 24hr format
        if period and period.upper() == "PM" and hour != 12:
            hour += 12
        elif period and period.upper() == "AM" and hour == 12:
            hour = 0

        time_str = f"{hour:02d}:{minute:02d}"

        # Remove the "Due by X:XXPM" phrase since we're storing the time properly
        description = re.sub(
            r"[Dd]ue\s+by\s+\d{1,2}:\d{2}\s*(AM|PM|am|pm)?\.?",
            "",
            description
        ).strip()

    return valid_date, time_str, description


def get_color_for_type(item_type):
    # Maps assignment types to Google Calendar color IDs
    color_map = {
        "assignment": "2",    # Green
        "exam": "5",          # Yellow
        "quiz": "3",          # Grape
        "project": "4",       # Flamingo
        "midterm": "11",      # Red
        "test": "6",          # Tangerine
        "homework": "7",      # Peacock
        "participation": "8", # Graphite
        "presentation": "9",  # Blueberry
        "other": "10"         # Basil
    }
    return color_map.get(item_type.lower(), "10")


def create_calendar_event(service, item):
    """Creates a Google Calendar event for a single assignment item."""
    title = item["title"]
    if item.get("weight"):
        title += f" ({item['weight']})"

    valid_date, time_str, clean_description = parse_date_and_time(item)

    if not valid_date:
        print(f"  Skipping calendar event for '{item['title']}' — no valid date")
        return None

    description = clean_description or None

    # Use dateTime for timed events, date for all-day events
    if time_str:
        start = {"dateTime": f"{valid_date}T{time_str}:00", "timeZone": "America/Toronto"}
        end = {"dateTime": f"{valid_date}T{time_str}:00", "timeZone": "America/Toronto"}
    else:
        start = {"date": valid_date, "timeZone": "America/Toronto"}
        end = {"date": valid_date, "timeZone": "America/Toronto"}

    event_body = {
        "summary": title,
        "description": description,
        "start": start,
        "end": end,
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 24 * 60},
                {"method": "popup", "minutes": 60}
            ]
        },
        "colorId": get_color_for_type(item.get("type", "other"))
    }

    event = service.events().insert(calendarId="primary", body=event_body).execute()

    time_info = f"at {time_str}" if time_str else "(all-day)"
    print(f"  Created calendar event: {title} on {valid_date} {time_info}")
    return event


def create_task(service, item, tasklist_id):
    """Creates a Google Task for a single assignment item."""
    title = item["title"]
    if item.get("weight"):
        title += f" ({item['weight']})"

    # Call parse_date_and_time once and reuse results for both notes and due date
    valid_date, time_str, clean_description = parse_date_and_time(item)

    task_body = {
        "title": title,
        "notes": clean_description or None
    }

    if valid_date:
        if time_str:
            task_body["due"] = f"{valid_date}T{time_str}:00.000Z"
        else:
            # No specific time found — omit time rather than defaulting to midnight
            # which would be misleading
            task_body["due"] = f"{valid_date}T00:00:00.000Z"

    task = service.tasks().insert(tasklist=tasklist_id, body=task_body).execute()
    print(f"  Created task: {title}")
    return task


def sync_to_google(items, course_name="My Course"):
    """
    Main entry point called by app.py.
    Creates a dedicated task list for the course, then syncs all items
    to both Google Calendar and Google Tasks.
    """
    print("Authenticating with Google...")
    creds = get_google_credentials()

    calendar_service = build("calendar", "v3", credentials=creds)
    tasks_service = build("tasks", "v1", credentials=creds)

    # Create a dedicated task list for this course so assignments don't
    # mix with the user's other tasks
    print(f"Creating task list for: {course_name}")
    task_list = tasks_service.tasklists().insert(body={"title": course_name}).execute()
    tasklist_id = task_list["id"]

    created_events = []
    created_tasks = []
    skipped = []

    for item in items:
        print(f"\nProcessing: {item['title']}")

        try:
            event = create_calendar_event(calendar_service, item)
            if event:
                created_events.append(event)
        except Exception as e:
            print(f"  Failed to create calendar event: {e}")
            skipped.append(item["title"])

        try:
            task = create_task(tasks_service, item, tasklist_id)
            if task:
                created_tasks.append(task)
        except Exception as e:
            print(f"  Failed to create task: {e}")

    return {
        "course_name": course_name,
        "calendar_events_created": len(created_events),
        "tasks_created": len(created_tasks),
        "skipped_items": skipped,
        "total_items": len(items)
    }
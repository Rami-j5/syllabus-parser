# parser.py — Extracts and parses syllabus content
# Step 1: Docling extracts raw text from the PDF
# Step 2: Groq (Llama 3.3 70B) interprets the text and returns structured assignment data

import os
import re
import json
from groq import Groq
from docling.document_converter import DocumentConverter
from dotenv import load_dotenv

load_dotenv()

# Truncate text before sending to Groq to protect against huge PDFs
# 50,000 chars (~12,500 tokens) is well above any real syllabus
MAX_CHARACTERS = 50000

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def extract_text_from_pdf(pdf_path):
    """
    Converts a PDF to markdown-formatted text using Docling.
    Markdown is preferred over plain text because it preserves
    tables and headers, which helps Groq understand syllabus structure.
    """
    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    return result.document.export_to_markdown()


def parse_syllabus_with_groq(raw_text):
    """
    Sends extracted syllabus text to Groq and returns structured data.
    Returns a dict with "course_name" and "items" (list of assignments).
    """
    if len(raw_text) > MAX_CHARACTERS:
        print(f"Warning: text truncated from {len(raw_text)} to {MAX_CHARACTERS} chars")
        raw_text = raw_text[:MAX_CHARACTERS]

    prompt = f"""You are a helpful assistant that extracts assignment and exam information from university course syllabi.

Extract ALL assignments, exams, quizzes, projects, and deadlines from the syllabus below.
Also extract the course name and course code if present (e.g. "CS101 - Introduction to Computer Science").

Return ONLY a JSON object with no extra text, explanation, or markdown formatting.
The object must have exactly two keys:
- "course_name": the full course name and code as a string, or "My Course" if not found
- "items": an array of assignment objects

Each item in the items array must have exactly these fields:
- "title": the name of the assignment or exam (string)
- "date": the due date in YYYY-MM-DD format. If no year is mentioned, assume 2026. If no date exists, use null
- "type": one of "assignment", "exam", "quiz", "project", or "other"
- "weight": the grade percentage if mentioned like "20%", otherwise null
- "description": any extra details like topics covered or due time, otherwise null

Example of the format I want:
{{
  "course_name": "CS101 - Introduction to Computer Science",
  "items": [
    {{
      "title": "Midterm Exam",
      "date": "2026-10-15",
      "type": "exam",
      "weight": "20%",
      "description": "Covers chapters 1-6"
    }}
  ]
}}

Here is the syllabus text:

{raw_text}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        # Low temperature = consistent, deterministic output
        # Important for structured JSON extraction
    )

    response_text = response.choices[0].message.content

    # Strip markdown code fences if Groq wraps the JSON in them
    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1])

    try:
        parsed = json.loads(cleaned)
        return {
            "course_name": parsed.get("course_name", "My Course"),
            "items": parsed.get("items", [])
        }
    except json.JSONDecodeError:
        # Fallback: try to find a JSON object anywhere in the response
        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
            return {
                "course_name": parsed.get("course_name", "My Course"),
                "items": parsed.get("items", [])
            }
        raise ValueError(f"Groq returned something we couldn't parse: {response_text}")


def parse_syllabus(file_path):
    """
    Main entry point called by app.py.
    Takes a PDF file path, returns dict with course_name and items.
    """
    print(f"Extracting text from PDF at {file_path}...")
    raw_text = extract_text_from_pdf(file_path)
    print(f"Extracted {len(raw_text)} characters")

    print("Sending to Groq for parsing...")
    result = parse_syllabus_with_groq(raw_text)

    print(f"Course: {result['course_name']}")
    print(f"Found {len(result['items'])} items")

    return result
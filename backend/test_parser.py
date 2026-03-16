# this is just a quick test to make sure parsing works
# alwats test pieces in isolation before integrating into the app   

from parser import parse_syllabus
import json

result = parse_syllabus("sample_syllabus.pdf") # this is a sample syllabus I found online, you can replace it with any pdf to test

print(f"Course: {result['course_name']}")
print(json.dumps(result, indent=2))
# makes the output pretty and easy to read in the console, we can see the structure of the parsed items and check if it looks correct
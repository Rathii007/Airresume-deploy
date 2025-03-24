import sys
import os

print(f"Current working directory: {os.getcwd()}")
print(f"Python path: {sys.path}")

try:
    from app.resume_templates import templates
    print("Successfully imported resume_templates!")
    print(templates)
except Exception as e:
    print(f"Failed to import resume_templates: {str(e)}")
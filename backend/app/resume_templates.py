from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def modern_template(file_path, data):
    """Generate a modern resume PDF using ReportLab."""
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, data.get("name", "Anonymous"))
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, f"{data.get('email', 'N/A')} | {data.get('phone', 'N/A')}")
    
    y = height - 100
    sections = ["Education", "Experience", "Skills"]
    for section in sections:
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, section)
        y -= 20
        c.setFont("Helvetica", 12)
        c.drawString(50, y, data.get(section.lower(), "N/A"))
        y -= 30
    
    c.save()

def classic_template(file_path, data):
    """Generate a classic resume with Times-Roman font."""
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    
    c.setFont("Times-Bold", 18)
    c.drawString(50, height - 50, data.get("name", "Anonymous"))
    c.setFont("Times-Roman", 12)
    c.drawString(50, height - 70, f"{data.get('email', 'N/A')} | {data.get('phone', 'N/A')}")
    
    y = height - 100
    sections = ["Education", "Experience", "Skills"]
    for section in sections:
        c.setFont("Times-Bold", 14)
        c.drawString(50, y, section)
        y -= 20
        c.setFont("Times-Roman", 12)
        c.drawString(50, y, data.get(section.lower(), "N/A"))
        y -= 30
    
    c.save()

def creative_template(file_path, data):
    """Generate a creative resume with unique font sizes and styles."""
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, data.get("name", "Anonymous"))
    c.setFont("Helvetica-Oblique", 12)
    c.drawString(50, height - 70, f"{data.get('email', 'N/A')} | {data.get('phone', 'N/A')}")
    
    y = height - 100
    sections = ["Education", "Experience", "Skills"]
    for section in sections:
        c.setFont("Helvetica-Bold", 16)
        c.setFillColorRGB(0.2, 0.4, 0.8)
        c.drawString(50, y, section)
        y -= 20
        c.setFont("Helvetica", 12)
        c.setFillColorRGB(0, 0, 0)
        c.drawString(50, y, data.get(section.lower(), "N/A"))
        y -= 30
    
    c.save()

def executive_template(file_path, data):
    """Generate an executive-style resume with a clean, formal look."""
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 22)
    c.drawString(50, height - 50, data.get("name", "Anonymous"))
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, f"{data.get('email', 'N/A')} | {data.get('phone', 'N/A')}")
    
    y = height - 100
    sections = ["Education", "Experience", "Skills", "Certifications", "Achievements"]
    for section in sections:
        if section.lower() in data:
            c.setFont("Helvetica-Bold", 16)
            c.drawString(50, y, section)
            y -= 20
            c.setFont("Helvetica", 12)
            c.drawString(50, y, data.get(section.lower(), "N/A"))
            y -= 30
    
    c.save()

def minimalist_template(file_path, data):
    """Generate a minimalist resume with structured formatting."""
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, data.get("name", "Anonymous"))
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, f"{data.get('email', 'N/A')} | {data.get('phone', 'N/A')}")
    
    y = height - 100
    sections = ["Education", "Experience", "Skills"]
    for section in sections:
        c.setFont("Helvetica", 14)
        c.setFillGray(0.2)
        c.drawString(50, y, section)
        y -= 20
        c.setFont("Helvetica", 12)
        c.setFillGray(0)
        c.drawString(50, y, data.get(section.lower(), "N/A"))
        y -= 30
    
    c.save()

templates = {
    "modern": modern_template,
    "classic": classic_template,
    "creative": creative_template,
    "executive": executive_template,
    "minimalist": minimalist_template,
}

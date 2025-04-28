from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
import logging
import os

# Logging Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Professional Color Scheme (Google-Inspired)
WHITE = colors.white  # Background
BLACK = colors.black  # Text
GOOGLE_BLUE = colors.Color(0.251, 0.522, 0.957)  # #4285F4 for headers

# Alternative MNC-Inspired Color Schemes (commented out; swap as needed)
# Microsoft: GOOGLE_BLUE -> MICROSOFT_BLUE = colors.Color(0.0, 0.471, 0.831)  # #0078D4
# IBM: GOOGLE_BLUE -> IBM_BLUE = colors.Color(0.0, 0.4, 0.6)  # #006699
# Deloitte: GOOGLE_BLUE -> DELOITTE_GREEN = colors.Color(0.525, 0.737, 0.145)  # #86BC25

def draw_background(c, width, height):
    """Add a clean white background."""
    c.setFillColor(WHITE)
    c.rect(0, 0, width, height, fill=1)

def wrap_text(c, text, x, y, max_width, font_size):
    """Wrap text to fit within page width and return new y position."""
    c.setFont("Helvetica", font_size)
    lines = []
    current_line = ""
    for word in text.split():
        if c.stringWidth(current_line + word, "Helvetica", font_size) < max_width:
            current_line += word + " "
        else:
            lines.append(current_line.strip())
            current_line = word + " "
    if current_line:
        lines.append(current_line.strip())
    
    for line in lines:
        c.drawString(x, y, line)
        y -= font_size + 2
    return y

def modern_template(file_path, data):
    """Generate a modern resume PDF with a professional theme."""
    try:
        c = canvas.Canvas(file_path, pagesize=letter)
        width, height = letter
        draw_background(c, width, height)

        c.setFillColor(BLACK)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(50, height - 50, data.get("name", "Anonymous"))
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 70, f"{data.get('email', 'N/A')} | {data.get('phone', 'N/A')}")

        y = height - 100
        sections = ["Education", "Experience", "Skills"]
        for section in sections:
            c.setFillColor(GOOGLE_BLUE)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y, section)
            y -= 20
            c.setFillColor(BLACK)
            y = wrap_text(c, data.get(section.lower(), "N/A"), 50, y, width - 100, 12)
            y -= 10
            if y < 50:  # Prevent overflow
                break

        c.showPage()
        c.save()
        logger.info(f"Generated modern resume at {file_path}")
    except Exception as e:
        logger.error(f"Failed to generate modern resume: {str(e)}")
        raise

def classic_template(file_path, data):
    """Generate a classic resume with a professional theme."""
    try:
        c = canvas.Canvas(file_path, pagesize=letter)
        width, height = letter
        draw_background(c, width, height)

        c.setFillColor(BLACK)
        c.setFont("Times-Bold", 18)
        c.drawString(50, height - 50, data.get("name", "Anonymous"))
        c.setFont("Times-Roman", 12)
        c.drawString(50, height - 70, f"{data.get('email', 'N/A')} | {data.get('phone', 'N/A')}")

        y = height - 100
        sections = ["Education", "Experience", "Skills"]
        for section in sections:
            c.setFillColor(GOOGLE_BLUE)
            c.setFont("Times-Bold", 14)
            c.drawString(50, y, section)
            y -= 20
            c.setFillColor(BLACK)
            y = wrap_text(c, data.get(section.lower(), "N/A"), 50, y, width - 100, 12)
            y -= 10
            if y < 50:
                break

        c.showPage()
        c.save()
        logger.info(f"Generated classic resume at {file_path}")
    except Exception as e:
        logger.error(f"Failed to generate classic resume: {str(e)}")
        raise

def creative_template(file_path, data):
    """Generate a creative resume with a professional theme."""
    try:
        c = canvas.Canvas(file_path, pagesize=letter)
        width, height = letter
        draw_background(c, width, height)

        c.setFillColor(GOOGLE_BLUE)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(50, height - 50, data.get("name", "Anonymous"))
        c.setFillColor(BLACK)
        c.setFont("Helvetica-Oblique", 12)
        c.drawString(50, height - 70, f"{data.get('email', 'N/A')} | {data.get('phone', 'N/A')}")

        y = height - 100
        sections = ["Education", "Experience", "Skills"]
        for section in sections:
            c.setFillColor(GOOGLE_BLUE)
            c.setFont("Helvetica-Bold", 16)
            c.drawString(50, y, section)
            y -= 20
            c.setFillColor(BLACK)
            y = wrap_text(c, data.get(section.lower(), "N/A"), 50, y, width - 100, 12)
            y -= 10
            if y < 50:
                break

        c.showPage()
        c.save()
        logger.info(f"Generated creative resume at {file_path}")
    except Exception as e:
        logger.error(f"Failed to generate creative resume: {str(e)}")
        raise

def executive_template(file_path, data):
    """Generate an executive resume with a professional theme."""
    try:
        c = canvas.Canvas(file_path, pagesize=letter)
        width, height = letter
        draw_background(c, width, height)

        c.setFillColor(BLACK)
        c.setFont("Helvetica-Bold", 22)
        c.drawString(50, height - 50, data.get("name", "Anonymous"))
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 70, f"{data.get('email', 'N/A')} | {data.get('phone', 'N/A')}")

        y = height - 100
        sections = ["Education", "Experience", "Skills", "Certifications", "Achievements"]
        for section in sections:
            if section.lower() in data:
                c.setFillColor(GOOGLE_BLUE)
                c.setFont("Helvetica-Bold", 16)
                c.drawString(50, y, section)
                y -= 20
                c.setFillColor(BLACK)
                y = wrap_text(c, data.get(section.lower(), "N/A"), 50, y, width - 100, 12)
                y -= 10
                if y < 50:
                    break

        c.showPage()
        c.save()
        logger.info(f"Generated executive resume at {file_path}")
    except Exception as e:
        logger.error(f"Failed to generate executive resume: {str(e)}")
        raise

def minimalist_template(file_path, data):
    """Generate a minimalist resume with a professional theme."""
    try:
        c = canvas.Canvas(file_path, pagesize=letter)
        width, height = letter
        draw_background(c, width, height)

        c.setFillColor(BLACK)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(50, height - 50, data.get("name", "Anonymous"))
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 70, f"{data.get('email', 'N/A')} | {data.get('phone', 'N/A')}")

        y = height - 100
        sections = ["Education", "Experience", "Skills"]
        for section in sections:
            c.setFillColor(GOOGLE_BLUE)
            c.setFont("Helvetica", 14)
            c.drawString(50, y, section)
            y -= 20
            c.setFillColor(BLACK)
            y = wrap_text(c, data.get(section.lower(), "N/A"), 50, y, width - 100, 12)
            y -= 10
            if y < 50:
                break

        c.showPage()
        c.save()
        logger.info(f"Generated minimalist resume at {file_path}")
    except Exception as e:
        logger.error(f"Failed to generate minimalist resume: {str(e)}")
        raise

templates = {
    "modern": modern_template,
    "classic": classic_template,
    "creative": creative_template,
    "executive": executive_template,
    "minimalist": minimalist_template,
}
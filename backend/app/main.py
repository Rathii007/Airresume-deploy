from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import spacy
import PyPDF2
import pytesseract
from PIL import Image
import redis.asyncio as redis
import openai
import os
import logging
import time
from io import BytesIO
from dotenv import load_dotenv
from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pathlib import Path
from pdf2image import convert_from_bytes
from app.resume_templates import templates
import docx

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# Load Groq API Key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("⚠️ GROQ_API_KEY is missing! Set it in your .env file.")

# Configure OpenAI API for Groq
openai.api_key = GROQ_API_KEY
openai.api_base = "https://api.groq.com/openai/v1"

# Redis Connection
REDIS_URL = "redis://localhost:6379"

# Initialize FastAPI
app = FastAPI()

# Enable CORS (open for development; restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis and Rate Limiting
async def startup_event():
    redis_client = await redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(redis_client)

app.add_event_handler("startup", startup_event)

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# Logging Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper Functions
def ai_suggestions(prompt_text):
    max_retries = 3
    retry_delay = 15
    for attempt in range(max_retries):
        try:
            logger.info("Calling Groq API with prompt: %s", prompt_text[:50] + "...")
            response = openai.ChatCompletion.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": "You are an expert resume assistant."},
                    {"role": "user", "content": prompt_text},
                ]
            )
            logger.info("Groq API response received successfully")
            return response["choices"][0]["message"]["content"].strip()
        except openai.error.RateLimitError as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                return "Rate limit exceeded."
        except Exception as e:
            logger.error("AI Suggestion Error: %s", str(e))
            return "Error generating suggestion."

def extract_text_from_pdf(file_bytes):
    try:
        pdf_reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
            else:
                images = convert_from_bytes(file_bytes, first_page=page_num + 1, last_page=page_num + 1)
                if images:
                    text += pytesseract.image_to_string(images[0]) + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {str(e)}")
        return ""

def analyze_structure(text):
    """Check for key resume sections."""
    doc = nlp(text)
    sections = {"experience": False, "education": False, "skills": False}
    for token in doc:
        if token.text.lower() in sections:
            sections[token.text.lower()] = True
    missing_sections = [k for k, v in sections.items() if not v]
    return missing_sections

def readability_metrics(text):
    """Calculate readability metrics."""
    doc = nlp(text)
    sentences = list(doc.sents)
    avg_sentence_length = sum(len(sent) for sent in sentences) / len(sentences) if sentences else 0
    return {"avg_sentence_length": avg_sentence_length}

def calculate_ats_score(resume_text):
    """Simulate an ATS score based on resume quality."""
    doc = nlp(resume_text)
    common_keywords = {"python", "java", "sql", "team", "project", "management", "skills", "experience", "education", "certified"}
    resume_words = set([token.text.lower() for token in doc if token.is_alpha])
    keyword_hits = len(common_keywords.intersection(resume_words))
    keyword_score = min((keyword_hits / 10) * 100, 100)
    missing_sections = analyze_structure(resume_text)
    structure_score = 100 - (len(missing_sections) * 33)
    metrics = readability_metrics(resume_text)
    readability_score = 100 if metrics['avg_sentence_length'] < 20 else max(0, 100 - (metrics['avg_sentence_length'] - 20) * 5)
    word_count = len(resume_words)
    length_score = 100 if 150 <= word_count <= 500 else 50 if 100 <= word_count < 150 or 500 < word_count <= 700 else 25
    ats_score = (0.3 * keyword_score) + (0.3 * structure_score) + (0.2 * readability_score) + (0.2 * length_score)
    return round(ats_score, 2)

def sanitize_text(text):
    """Remove control characters and ensure XML compatibility."""
    if not isinstance(text, str):
        return ""
    return ''.join(c for c in text if ord(c) >= 32 or c in '\n\r\t')

# Pydantic Models
class SuggestionRequest(BaseModel):
    jobTitle: str
    yearsExperience: str

class EnhanceRequest(BaseModel):
    section: str
    content: str
    jobTitle: Optional[str] = None

class ResumeData(BaseModel):
    name: str
    email: str
    phone: str
    education: str
    experience: str
    skills: str
    template: str

# Improved Resume Extraction
def improved_extract_resume(file_bytes):
    text = extract_text_from_pdf(file_bytes)
    if not text:
        return {"name": "", "email": "", "phone": "", "education": "", "experience": "", "skills": ""}
    
    doc = nlp(text)
    data = {"name": "", "email": "", "phone": "", "education": "", "experience": "", "skills": ""}
    
    lines = text.split("\n")
    for i, line in enumerate(lines):
        line = line.strip()
        if not data["name"] and line and "@" not in line and not any(c.isdigit() for c in line):
            data["name"] = line
        if "@" in line and not data["email"]:
            data["email"] = line
        if any(c.isdigit() for c in line) and 8 <= len(line.replace(" ", "").replace("-", "")) <= 15 and not data["phone"]:
            data["phone"] = line
        if "education" in line.lower():
            data["education"] = "\n".join(lines[i+1:i+4]).strip() if i+1 < len(lines) else line
        if "experience" in line.lower() or "work" in line.lower():
            data["experience"] = "\n".join(lines[i+1:i+6]).strip() if i+1 < len(lines) else line
        if "skills" in line.lower():
            data["skills"] = "\n".join(lines[i+1:i+4]).strip() if i+1 < len(lines) else line
    
    return {k: sanitize_text(v) for k, v in data.items()}

# Endpoints
@app.post("/extract-resume/")
async def extract_resume(resume: UploadFile = File(...)):
    resume_bytes = await resume.read()
    return improved_extract_resume(resume_bytes)

@app.post("/suggest-content/")
async def suggest_content(data: SuggestionRequest):
    prompt = (
        f"Generate a resume for a {data.jobTitle} with {data.yearsExperience} years of experience. "
        "Return in this format:\n"
        "- Education: [One concise entry]\n"
        "- Experience: [3 bullet points]\n"
        "- Skills: [5 concise skills]"
    )
    response = ai_suggestions(prompt)
    data = {"education": "", "experience": "", "skills": ""}
    for line in response.split("\n"):
        if line.startswith("- Education:"):
            data["education"] = sanitize_text(line.replace("- Education:", "").strip())
        elif line.startswith("- Experience:"):
            data["experience"] = sanitize_text("\n".join([l.strip() for l in response.split("\n") if l.startswith("- ") and "Experience" not in l][:3]))
        elif line.startswith("- Skills:"):
            data["skills"] = sanitize_text("\n".join([l.strip() for l in response.split("\n") if l.startswith("- ") and "Skills" not in l][:5]))
    return data

@app.post("/enhance-section/")
async def enhance_section(data: EnhanceRequest):
    context = f" for a {data.jobTitle}" if data.jobTitle else ""
    prompt = (
        f"Rewrite this {data.section} section{context} to be concise, professional, and ATS-friendly:\n"
        f"{data.content}\n"
        f"Return the enhanced version only, no extra text."
    )
    enhanced = ai_suggestions(prompt)
    return {"enhanced": sanitize_text(enhanced)}

@app.post("/ats-preview/")
async def ats_preview(data: ResumeData):
    resume_text = f"{data.name}\n{data.email}\n{data.phone}\n{data.education}\n{data.experience}\n{data.skills}"
    ats_score = calculate_ats_score(resume_text)
    return {"ats_score": ats_score}

@app.post("/generate-resume/")
async def generate_resume(data: dict):
    try:
        file_path = f"generated_resume_{int(time.time())}"
        format = data.get("format", "pdf")
        if "format" in data:
            del data["format"]
        if data["template"] not in templates:
            raise HTTPException(status_code=400, detail=f"Template '{data['template']}' not found. Available templates: {list(templates.keys())}")
        
        # Sanitize all data values
        sanitized_data = {k: sanitize_text(v) for k, v in data.items()}
        templates[sanitized_data["template"]](f"{file_path}.pdf", sanitized_data)
        
        if format == "pdf":
            with open(f"{file_path}.pdf", "rb") as f:
                content = f.read()
            os.remove(f"{file_path}.pdf")
            return Response(content=content, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=resume.pdf"})
        elif format == "docx":
            doc = docx.Document()
            for key, value in sanitized_data.items():
                if key != "template" and value:
                    doc.add_heading(key.capitalize(), level=1)
                    doc.add_paragraph(value)
            doc.save(f"{file_path}.docx")
            with open(f"{file_path}.docx", "rb") as f:
                content = f.read()
            os.remove(f"{file_path}.docx")
            return Response(content=content, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": "attachment; filename=resume.docx"})
    except Exception as e:
        logger.error(f"Generate resume failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate resume: {str(e)}")

@app.post("/match-resume/")
async def match_resume(
    resume: UploadFile = File(...),
    job_description: Optional[str] = Form(default=None)
):
    logger.info(f"Received request: resume={resume.filename}, job_description={job_description}")
    try:
        resume_content = await resume.read()
        logger.info(f"Resume content length: {len(resume_content)} bytes")
        resume_text = extract_text_from_pdf(resume_content)
        logger.info(f"Extracted resume text: {resume_text[:100]}...")
        if not resume_text:
            raise HTTPException(status_code=400, detail="No text found in the resume PDF")

        missing_sections = analyze_structure(resume_text)
        structure_score = max(0, 100 - len(missing_sections) * 20)
        structure_prompt = (
            f"Analyze the structure of this resume:\n{resume_text}\n"
            "Comment on missing sections like Experience, Education, or Skills in 1-2 concise sentences. "
            "Then, provide 5-7 actionable suggestions as bullet points starting with '- '."
        ) if job_description else (
            f"Analyze the structure of this resume:\n{resume_text}\n"
            "Comment on missing sections like Experience, Education, or Skills in 2-3 concise sentences. "
            "Then, provide 3-5 actionable suggestions as bullet points starting with '- '."
        )
        structure_feedback = ai_suggestions(structure_prompt)
        logger.info(f"Structure feedback: {structure_feedback[:100]}...")

        metrics = readability_metrics(resume_text)
        readability_score = min(100, max(0, 100 - (metrics["avg_sentence_length"] - 15) * 5))
        readability_prompt = (
            f"Analyze the readability of this resume:\n{resume_text}\n"
            f"Average sentence length is {metrics['avg_sentence_length']:.1f} words. "
            "Provide feedback on clarity and sentence structure in 1-2 concise sentences. "
            "Then, provide 5-7 actionable suggestions as bullet points starting with '- '."
        ) if job_description else (
            f"Analyze the readability of this resume:\n{resume_text}\n"
            f"Average sentence length is {metrics['avg_sentence_length']:.1f} words. "
            "Provide feedback on clarity and sentence structure in 2-3 concise sentences. "
            "Then, provide 3-5 actionable suggestions as bullet points starting with '- '."
        )
        readability_feedback = ai_suggestions(readability_prompt)
        logger.info(f"Readability feedback: {readability_feedback[:100]}...")

        word_count = len(resume_text.split())
        length_score = min(100, max(0, 100 - abs(word_count - 500) * 0.2))

        if job_description:
            logger.info("Processing with job description...")
            def preprocess(text):
                doc = nlp(text.lower())
                return " ".join([token.lemma_ for token in doc if not token.is_stop and token.is_alpha])

            processed_resume = preprocess(resume_text)
            processed_job_desc = preprocess(job_description)
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform([processed_resume, processed_job_desc])
            match_score = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0] * 100
            job_keywords = set(processed_job_desc.split())
            resume_keywords = set(processed_resume.split())
            missing_keywords = list(job_keywords - resume_keywords)
            keyword_score = min(100, len(resume_keywords.intersection(job_keywords)) * 10)
            logger.info(f"Match score: {match_score:.2f}%, Missing keywords: {missing_keywords[:5]}")

            overall_match_score = int(
                (keyword_score * 0.4) +
                (structure_score * 0.3) +
                (readability_score * 0.2) +
                (length_score * 0.1)
            )

            ai_prompt = (
                f"You are an expert resume reviewer. Compare this resume:\n{resume_text}\n"
                f"with this job description:\n{job_description}. "
                "Provide feedback in the following format:\n"
                "**Match Quality and Suggestions for Improvement:**\n[Explain the match quality in 1-2 concise sentences. Then, provide 5-7 actionable suggestions as bullet points starting with '- '.]\n"
                "**Overall Quality, Clarity, and Structure:**\n[Analyze the resume’s overall quality, clarity, and structure in 1-2 concise sentences.]"
            )
            ai_feedback = ai_suggestions(ai_prompt)
            logger.info(f"AI feedback (with job description): {ai_feedback[:200]}...")

            strengths = "No strengths identified."
            overall_quality = "No overall quality feedback provided."
            if "**Match Quality and Suggestions for Improvement:**" in ai_feedback:
                feedback_parts = ai_feedback.split("**Match Quality and Suggestions for Improvement:**")
                if len(feedback_parts) > 1:
                    strengths_part = feedback_parts[1]
                    if "**Overall Quality, Clarity, and Structure:**" in strengths_part:
                        strengths = strengths_part.split("**Overall Quality, Clarity, and Structure:**")[0].strip()
                        overall_quality_parts = ai_feedback.split("**Overall Quality, Clarity, and Structure:**")
                        if len(overall_quality_parts) > 1:
                            overall_quality = overall_quality_parts[1].strip()
                    else:
                        strengths = strengths_part.strip()

            return {
                "match_score": overall_match_score,
                "match_score_raw": f"{match_score:.2f}%",
                "missing_keywords": missing_keywords[:10],
                "explanation": ai_feedback.split('.')[0] + "." if ai_feedback else "No explanation provided.",
                "structure_feedback": structure_feedback,
                "readability_feedback": readability_feedback,
                "metrics": {
                    "keyword_score": keyword_score,
                    "structure_score": structure_score,
                    "readability_score": readability_score,
                    "length_score": length_score,
                    "avg_sentence_length": metrics["avg_sentence_length"],
                },
                "ai_feedback": {
                    "strengths": strengths,
                    "overall_quality": overall_quality,
                }
            }
        else:
            logger.info("Processing without job description...")
            ats_score = calculate_ats_score(resume_text)
            keyword_score = 50
            overall_ats_score = int(
                (keyword_score * 0.4) +
                (structure_score * 0.3) +
                (readability_score * 0.2) +
                (length_score * 0.1)
            )

            ai_prompt = (
                f"You are an expert resume reviewer. Analyze this resume:\n{resume_text}\n"
                "for ATS compatibility and overall quality. Provide feedback in the following format:\n"
                "**ATS Readiness:**\n[Explain the ATS compatibility in 2-3 concise sentences.]\n"
                "**Suggestions:**\n[Provide 3-5 actionable suggestions to improve structure, keyword usage, and readability as bullet points starting with '- '.]"
            )
            ai_feedback = ai_suggestions(ai_prompt)
            logger.info(f"AI feedback (without job description): {ai_feedback[:200]}...")

            suggestions = "No specific suggestions provided."
            ats_readiness = "No ATS readiness feedback provided."
            if "**ATS Readiness:**" in ai_feedback:
                ats_parts = ai_feedback.split("**ATS Readiness:**")
                if len(ats_parts) > 1:
                    ats_readiness_part = ats_parts[1]
                    if "**Suggestions:**" in ats_readiness_part:
                        ats_readiness = ats_readiness_part.split("**Suggestions:**")[0].strip()
                        suggestions_parts = ai_feedback.split("**Suggestions:**")
                        if len(suggestions_parts) > 1:
                            suggestions = suggestions_parts[1].strip()
                    else:
                        ats_readiness = ats_readiness_part.strip()

            return {
                "ats_score": overall_ats_score,
                "ats_score_raw": f"{ats_score}%",
                "explanation": ai_feedback.split('.')[0] + "." if ai_feedback else "No explanation provided.",
                "structure_feedback": structure_feedback,
                "readability_feedback": readability_feedback,
                "metrics": {
                    "keyword_score": keyword_score,
                    "structure_score": structure_score,
                    "readability_score": readability_score,
                    "length_score": length_score,
                    "avg_sentence_length": metrics["avg_sentence_length"],
                },
                "ai_feedback": {
                    "ats_readiness": ats_readiness,
                    "suggestions": suggestions,
                }
            }
    except Exception as e:
        logger.error(f"Job matching failed: {str(e)}")
        return {"error": f"Failed to process resume. Details: {str(e)}"}

@app.post("/resume-roast/")
async def resume_roast(
    file: UploadFile = File(...),
    roast_level: Optional[str] = Form(default="spicy")
):
    try:
        resume_text = extract_text_from_pdf(await file.read())
        if not resume_text:
            return {"roast": "A blank resume? Wow, you’re really letting your *nothingness* shine!"}
        missing_sections = analyze_structure(resume_text)
        metrics = readability_metrics(resume_text)

        tone_instruction = {
            "mild": "Provide a gentle, lighthearted roast that’s encouraging but still funny.",
            "spicy": "Provide a moderately sarcastic roast that’s humorous but not too harsh.",
            "burnt": "Provide a savage, no-holds-barred roast that’s still funny but very critical."
        }.get(roast_level.lower(), "Provide a moderately sarcastic roast that’s humorous but not too harsh.")

        ai_prompt = (
            f"You’re a stand-up comedian roasting this resume:\n{resume_text}\n"
            f"Missing sections: {', '.join(missing_sections) if missing_sections else 'None'}.\n"
            f"Average sentence length is {metrics['avg_sentence_length']:.1f} words.\n"
            f"{tone_instruction}\n"
            "Provide a concise roast in EXACTLY the following format (use the exact section headers and prefixes):\n"
            "- **Structure**: Roast the layout, formatting, and missing sections in 2-3 sentences.\n"
            "- **Readability**: Roast the clarity, jargon, and verbosity in 2-3 sentences.\n"
            "- **Projects**: Roast the projects section in 2-3 sentences.\n"
            "- **Skills**: Roast the technical skills in 2-3 sentences.\n"
            "- **Overall Vibe**: Summarize the overall impression sarcastically in 2-3 sentences.\n"
            "Ensure each section is short and punchy. Do not deviate from the specified format, even if a section is missing in the resume."
        )
        ai_roast = ai_suggestions(ai_prompt)
        logger.info(f"Raw roast response (Level: {roast_level}): {ai_roast}")
        return {"roast": sanitize_text(ai_roast)}
    except Exception as e:
        logger.error(f"Resume roast failed: {str(e)}")
        return {"roast": "This resume broke me—guess it’s *that* tragic!"}

@app.get("/", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def root():
    return {"message": "FastAPI Resume API is running!"}
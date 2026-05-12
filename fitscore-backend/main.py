from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, uuid

from parser import extract_text_from_pdf
from matcher import calculate_score

app = FastAPI()

# React frontend ko allow karo
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fit-score-beta.vercel.app",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "FitScore Python API Running!"}

@app.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    jd: str = Form(...)
):
    # PDF save karo temporarily
    temp_path = f"temp_{uuid.uuid4()}.pdf"
    
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(resume.file, f)
    
    try:
        # Text nikalo
        resume_text = extract_text_from_pdf(temp_path)
        
        # Score calculate karo
        result = calculate_score(resume_text, jd)
        
        return {
            "success": True,
            "data": result
        }
    
    finally:
        # Temp file delete karo
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/parse")
async def parse_resume(resume: UploadFile = File(...)):
    temp_path = f"temp_{uuid.uuid4()}.pdf"
    
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(resume.file, f)
    
    try:
        text = extract_text_from_pdf(temp_path)
        from parser import extract_skills
        skills = extract_skills(text)
        
        return {
            "success": True,
            "skills": skills,
            "text_length": len(text)
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
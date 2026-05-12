from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, uuid
import json

from parser import extract_text_from_pdf, extract_skills
from matcher import calculate_score

app = FastAPI()

# CORS Configuration
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
    return {"status": "FitScore Python API Running!", "version": "2.0"}

@app.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    jd: str = Form(...)
):
    print("\n🚀 Starting resume analysis...")
    print(f"📄 Resume file: {resume.filename}")
    print(f"📝 JD provided: {len(jd)} chars")
    
    temp_path = f"temp_{uuid.uuid4()}.pdf"
    
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(resume.file, f)
    
    try:
        print("📥 Extracting text from PDF...")
        resume_text = extract_text_from_pdf(temp_path)
        print(f"✅ Extracted {len(resume_text)} characters from resume")
        
        if not resume_text:
            return {
                "success": False,
                "error": "Could not extract text from resume PDF"
            }
        
        # Extract skills to debug
        resume_skills = extract_skills(resume_text)
        jd_skills = extract_skills(jd)
        print(f"✅ Resume skills: {resume_skills}")
        print(f"✅ JD skills: {jd_skills}")
        
        print("🔍 Calculating match score...")
        result = calculate_score(resume_text, jd)
        
        print(f"✅ Analysis complete: Score={result.get('score')}, Matched={len(result.get('matched_skills', []))}")
        
        return {
            "success": True,
            "data": result
        }
    
    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": f"Analysis failed: {str(e)}"
        }
    
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print(f"🧹 Cleaned up temp file")

@app.post("/parse")
async def parse_resume(resume: UploadFile = File(...)):
    print(f"\n📄 Parsing resume: {resume.filename}")
    
    temp_path = f"temp_{uuid.uuid4()}.pdf"
    
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(resume.file, f)
    
    try:
        print("📥 Extracting text...")
        text = extract_text_from_pdf(temp_path)
        from parser import extract_skills
        skills = extract_skills(text)
        
        print(f"✅ Extracted {len(text)} chars, found {len(skills)} skills")
        
        return {
            "success": True,
            "skills": skills,
            "text_length": len(text)
        }
    
    except Exception as e:
        print(f"❌ Parse error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }
    
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
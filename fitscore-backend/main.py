from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, uuid
import json

from parser import extract_text_from_pdf, extract_skills, extract_keywords, extract_skills_with_fallback
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
    print(f"🔍 Resume content-type: {resume.content_type}")
    print(f"🔍 JD first 200 chars: {jd[:200]}")
    
    temp_path = f"temp_{uuid.uuid4()}.pdf"
    
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(resume.file, f)
    
    try:
        print("📥 Extracting text from PDF...")
        resume_text = extract_text_from_pdf(temp_path)
        print(f"✅ Extracted {len(resume_text)} characters from resume")
        print(f"🪪 Resume text preview: {resume_text[:500]}")

        if len(resume_text) < 50:
            print("❌ Resume text extraction failed: too little text extracted")
            return {
                "success": False,
                "error": "Resume text extraction failed",
                "extractedTextLength": len(resume_text),
                "extractedSkills": [],
                "jdKeywords": [],
                "matchedSkills": [],
            }

        # Extract skills/keywords to debug and provide fallback
        try:
            resume_skills = extract_skills_with_fallback(resume_text)
            jd_skills = extract_skills_with_fallback(jd)
        except Exception:
            resume_skills = extract_skills(resume_text)
            jd_skills = extract_skills(jd)

        print(f"✅ Resume skills: {resume_skills}")
        print(f"✅ JD skills: {jd_skills}")
        resume_keywords = extract_keywords(resume_text)
        jd_keywords = extract_keywords(jd)
        print(f"🔑 Resume keywords: {resume_keywords}")
        print(f"🔑 JD keywords: {jd_keywords}")

        print("🔍 Calculating match score...")
        result = calculate_score(resume_text, jd)

        matched_skills = result.get("matchedSkills") or result.get("matched_skills") or []
        extracted_keywords = result.get("keywords") or []
        print(f"🎯 Matched skills from score pipeline: {matched_skills}")
        print(f"📚 Keywords from score pipeline: {extracted_keywords}")

        # Attach extracted fields for observability
        result["extractedTextLength"] = len(resume_text)
        result["extracted_text"] = (resume_text[:2000] + '...') if len(resume_text) > 2000 else resume_text
        result["jd_text"] = (jd[:2000] + '...') if len(jd) > 2000 else jd
        result["extracted_skills"] = {
            "resume": resume_skills,
            "jd": jd_skills
        }
        result["extractedSkills"] = resume_skills
        result["jdKeywords"] = jd_keywords
        result["matchedSkills"] = matched_skills

        if not result.get("radarData"):
            result["radarData"] = [
                {"subject": "Skills", "A": result.get("skillsScore", 0)},
                {"subject": "Experience", "A": result.get("experienceScore", 0)},
                {"subject": "Education", "A": result.get("educationScore", 0)},
                {"subject": "Keywords", "A": min(len(extracted_keywords) * 8, 100)},
                {"subject": "ATS", "A": result.get("score", 0)},
            ]

        print(f"✅ Analysis complete: Score={result.get('score')}, Matched={len(result.get('matchedSkills') or result.get('matched_skills') or [])}")
        print(f"📊 Final skills score: {result.get('skillsScore')}" )
        print(f"📊 Final experience score: {result.get('experienceScore')}" )
        print(f"📊 Final education score: {result.get('educationScore')}" )
        print(f"📊 Final radarData: {result.get('radarData')}")
        print("📤 Final response payload:", json.dumps(result)[:2000])

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
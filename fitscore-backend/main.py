from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from rag_service import generate_rag_explanation

import shutil
import os
import uuid
import json
import requests

from dotenv import load_dotenv

load_dotenv()

from job_ranker import rank_jobs
from adzuna_service import search_adzuna_jobs

from parser import (
    extract_text_from_pdf,
    extract_skills,
    extract_keywords,
    extract_skills_with_fallback,
)

from matcher import calculate_score
from llm_service import generate_llm_explanation


app = FastAPI()


# ==================================================
# CORS CONFIGURATION
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fit-score-beta.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# HOME
# ==================================================

@app.get("/")
def home():
    return {
        "status": "FitScore Python API Running!",
        "version": "2.0",
    }


# ==================================================
# ANALYZE RESUME
# ==================================================

@app.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    jd: str = Form(...),
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

        # ==================================================
        # 1. EXTRACT RESUME TEXT
        # ==================================================

        print("📥 Extracting text from PDF...")

        resume_text = extract_text_from_pdf(temp_path)

        print(
            f"✅ Extracted {len(resume_text)} characters from resume"
        )

        print(
            f"🪪 Resume text preview: {resume_text[:500]}"
        )

        if len(resume_text) < 50:
            print(
                "❌ Resume text extraction failed: "
                "too little text extracted"
            )

            return {
                "success": False,
                "error": "Resume text extraction failed",
                "extractedTextLength": len(resume_text),
                "extractedSkills": [],
                "jdKeywords": [],
                "matchedSkills": [],
            }


        # ==================================================
        # 2. EXTRACT SKILLS AND KEYWORDS
        # ==================================================

        try:

            resume_skills = extract_skills_with_fallback(
                resume_text
            )

            jd_skills = extract_skills_with_fallback(
                jd
            )

        except Exception:

            resume_skills = extract_skills(
                resume_text
            )

            jd_skills = extract_skills(
                jd
            )


        print(
            f"✅ Resume skills: {resume_skills}"
        )

        print(
            f"✅ JD skills: {jd_skills}"
        )


        resume_keywords = extract_keywords(
            resume_text
        )

        jd_keywords = extract_keywords(
            jd
        )


        print(
            f"🔑 Resume keywords: {resume_keywords}"
        )

        print(
            f"🔑 JD keywords: {jd_keywords}"
        )


        # ==================================================
        # 3. CALCULATE FIT SCORE
        # ==================================================

        print("🔍 Calculating match score...")

        result = calculate_score(
            resume_text,
            jd
        )


        # ==================================================
        # 4. LLM EXPLANATION
        # ==================================================

        print("🤖 Generating LLM explanation...")

        llm_explanation = generate_llm_explanation(
            resume_text,
            jd,
            result
        )

        result["llm_explanation"] = llm_explanation


        # ==================================================
        # 5. RAG EXPLANATION
        # ==================================================

        rag_explanation = generate_rag_explanation(
            resume_text=resume_text,
            jd_text=jd,
            top_k=3,
        )

        result["rag_explanation"] = rag_explanation

        print(
            "✅ LLM explanation generated"
        )


        # ==================================================
        # 6. MATCHED SKILLS / KEYWORDS
        # ==================================================

        matched_skills = (
            result.get("matchedSkills")
            or result.get("matched_skills")
            or []
        )

        extracted_keywords = (
            result.get("keywords")
            or []
        )


        print(
            f"🎯 Matched skills from score pipeline: "
            f"{matched_skills}"
        )

        print(
            f"📚 Keywords from score pipeline: "
            f"{extracted_keywords}"
        )


        # ==================================================
        # 7. ATTACH EXTRACTED FIELDS
        # ==================================================

        result["extractedTextLength"] = len(
            resume_text
        )

        result["extracted_text"] = (
            resume_text[:2000] + "..."
            if len(resume_text) > 2000
            else resume_text
        )

        result["jd_text"] = (
            jd[:2000] + "..."
            if len(jd) > 2000
            else jd
        )

        result["extracted_skills"] = {
            "resume": resume_skills,
            "jd": jd_skills,
        }

        result["extractedSkills"] = resume_skills

        result["jdKeywords"] = jd_keywords

        result["matchedSkills"] = matched_skills


        # ==================================================
        # 8. RADAR DATA
        # ==================================================

        if not result.get("radarData"):

            result["radarData"] = [
                {
                    "subject": "Skills",
                    "A": result.get(
                        "skillsScore",
                        0
                    ),
                },
                {
                    "subject": "Experience",
                    "A": result.get(
                        "experienceScore",
                        0
                    ),
                },
                {
                    "subject": "Education",
                    "A": result.get(
                        "educationScore",
                        0
                    ),
                },
                {
                    "subject": "Keywords",
                    "A": min(
                        len(extracted_keywords) * 8,
                        100,
                    ),
                },
                {
                    "subject": "ATS",
                    "A": result.get(
                        "score",
                        0
                    ),
                },
            ]


        # ==================================================
        # 9. ADZUNA JOB SEARCH
        # ==================================================

        ranked_jobs = []

        try:

            print(
                "\n🔎 Searching Adzuna jobs..."
            )

            adzuna_jobs = search_adzuna_jobs()

            print(
                f"✅ Adzuna returned "
                f"{len(adzuna_jobs)} jobs"
            )


            # ==================================================
            # 10. RANK ADZUNA JOBS
            # ==================================================

            if adzuna_jobs:

                print(
                    "🧠 Ranking Adzuna jobs..."
                )

                ranked_jobs = rank_jobs(
                    resume_text,
                    adzuna_jobs,
                )

                print(
                    f"🏆 Ranked "
                    f"{len(ranked_jobs)} jobs"
                )


            else:

                print(
                    "⚠️ No Adzuna jobs found"
                )

                ranked_jobs = []


        except Exception as job_error:

            print(
                f"❌ Job recommendation error: "
                f"{str(job_error)}"
            )

            import traceback

            traceback.print_exc()

            ranked_jobs = []


        # ==================================================
        # 11. ADD JOBS TO RESULT
        # ==================================================

        result["jobs"] = ranked_jobs


        # ==================================================
        # 12. FINAL LOGS
        # ==================================================

        print(
            f"✅ Analysis complete: "
            f"Score={result.get('score')}, "
            f"Matched="
            f"{len(result.get('matchedSkills') or [])}"
        )

        print(
            f"📊 Final skills score: "
            f"{result.get('skillsScore')}"
        )

        print(
            f"📊 Final experience score: "
            f"{result.get('experienceScore')}"
        )

        print(
            f"📊 Final education score: "
            f"{result.get('educationScore')}"
        )

        print(
            f"📊 Final radarData: "
            f"{result.get('radarData')}"
        )

        print(
            f"🎯 Final job count: "
            f"{len(ranked_jobs)}"
        )

        print(
            "📤 Final response payload:",
            json.dumps(result)[:3000],
        )


        # ==================================================
        # 13. RETURN ANALYSIS
        # ==================================================

        return {
            "success": True,
            "data": result,
        }


    except Exception as e:

        print(
            f"❌ Analysis error: {str(e)}"
        )

        import traceback

        traceback.print_exc()

        return {
            "success": False,
            "error": f"Analysis failed: {str(e)}",
        }


    finally:

        if os.path.exists(temp_path):

            os.remove(temp_path)

            print(
                "🧹 Cleaned up temp file"
            )


# ==================================================
# RANK JOBS ENDPOINT
# ==================================================

@app.post("/rank-jobs")
async def rank_resume_jobs(
    resume: UploadFile = File(...),
    jobs: str = Form(...),
):

    print(
        "\n🚀 Starting job ranking..."
    )

    temp_path = f"temp_{uuid.uuid4()}.pdf"

    with open(temp_path, "wb") as f:

        shutil.copyfileobj(
            resume.file,
            f
        )

    try:

        # ==================================================
        # 1. EXTRACT RESUME TEXT
        # ==================================================

        print(
            "📥 Extracting resume text..."
        )

        resume_text = extract_text_from_pdf(
            temp_path
        )

        if len(resume_text) < 50:

            return {
                "success": False,
                "error": "Resume text extraction failed",
            }


        print(
            f"✅ Resume extracted: "
            f"{len(resume_text)} characters"
        )


        # ==================================================
        # 2. PARSE JOB JSON
        # ==================================================

        try:

            jobs_data = json.loads(
                jobs
            )

        except json.JSONDecodeError:

            return {
                "success": False,
                "error": "Invalid jobs JSON format",
            }


        if not isinstance(
            jobs_data,
            list
        ):

            return {
                "success": False,
                "error": "Jobs must be a list",
            }


        print(
            f"📋 Jobs received: "
            f"{len(jobs_data)}"
        )


        # ==================================================
        # 3. RANK JOBS
        # ==================================================

        print(
            "🧠 Calculating job rankings..."
        )

        ranked_jobs = rank_jobs(
            resume_text,
            jobs_data
        )


        print(
            f"🏆 Ranking complete: "
            f"{len(ranked_jobs)} jobs ranked"
        )


        # ==================================================
        # 4. RETURN
        # ==================================================

        return {
            "success": True,
            "total_jobs": len(ranked_jobs),
            "ranked_jobs": ranked_jobs,
        }


    except Exception as e:

        print(
            f"❌ Job ranking error: "
            f"{str(e)}"
        )

        import traceback

        traceback.print_exc()

        return {
            "success": False,
            "error": f"Job ranking failed: {str(e)}",
        }


    finally:

        if os.path.exists(temp_path):

            os.remove(temp_path)

            print(
                "🧹 Cleaned up temp file"
            )


# ==================================================
# PARSE RESUME
# ==================================================

@app.post("/parse")
async def parse_resume(
    resume: UploadFile = File(...)
):

    print(
        f"\n📄 Parsing resume: "
        f"{resume.filename}"
    )

    temp_path = f"temp_{uuid.uuid4()}.pdf"

    with open(temp_path, "wb") as f:

        shutil.copyfileobj(
            resume.file,
            f
        )

    try:

        print(
            "📥 Extracting text..."
        )

        text = extract_text_from_pdf(
            temp_path
        )

        skills = extract_skills(
            text
        )


        print(
            f"✅ Extracted "
            f"{len(text)} chars, "
            f"found {len(skills)} skills"
        )


        return {
            "success": True,
            "skills": skills,
            "text_length": len(text),
        }


    except Exception as e:

        print(
            f"❌ Parse error: "
            f"{str(e)}"
        )

        return {
            "success": False,
            "error": str(e),
        }


    finally:

        if os.path.exists(temp_path):

            os.remove(temp_path)
import os
import json
import time

from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in .env")

client = genai.Client(
    api_key=GEMINI_API_KEY
)


def generate_llm_explanation(
    resume_text: str,
    jd_text: str,
    score_result: dict,
    retrieved_jobs: list[dict] | None = None
) -> dict:

    if retrieved_jobs is None:
        retrieved_jobs = []

    # ---------------------------------------------------------
    # Prepare RAG context
    # ---------------------------------------------------------

    rag_jobs = []

    for job in retrieved_jobs:
        rag_jobs.append({
            "title": job.get("title", ""),
            "company": job.get("company", ""),
            "description": job.get("description", ""),
            "skills": job.get("skills", []),
            "vector_similarity": job.get("score", 0)
        })

    retrieved_jobs_context = json.dumps(
        rag_jobs,
        indent=2,
        ensure_ascii=False
    )

    # ---------------------------------------------------------
    # Gemini Prompt
    # ---------------------------------------------------------

    prompt = f"""
You are an AI resume analysis assistant inside a RAG-based
resume and job matching system.

Your task is to explain an already-calculated FitScore and use
retrieved jobs as additional context.

IMPORTANT RULES:

1. DO NOT calculate or change the FitScore.

2. DO NOT invent skills, experience, projects, certifications,
   education, achievements, technologies, companies, or jobs.

3. Use ONLY information provided in:
   - Resume
   - Job Description
   - Calculated FitScore data
   - Retrieved job context

4. Retrieved jobs are context retrieved from a vector database.
   They are NOT evidence that the candidate worked at those
   companies.

5. NEVER claim that the candidate has a skill just because
   that skill appears in a retrieved job.

6. Candidate skills must come ONLY from the resume and
   calculated FitScore data.

7. Clearly distinguish candidate information from job
   requirements and retrieved job information.

8. DO NOT modify or recalculate the FitScore.

9. Resume improvement suggestions must be truthful.

10. Do not invent additional job recommendations.

11. Missing skills must remain consistent with the calculated
    FitScore data.

12. Keep the explanation concise and useful.

---------------------------------------------------------
CALCULATED FITSCORE DATA
---------------------------------------------------------

{json.dumps(score_result, indent=2)}

---------------------------------------------------------
RESUME
---------------------------------------------------------

{resume_text[:12000]}

---------------------------------------------------------
TARGET JOB DESCRIPTION
---------------------------------------------------------

{jd_text[:12000]}

---------------------------------------------------------
RETRIEVED JOBS FROM VECTOR DATABASE
---------------------------------------------------------

{retrieved_jobs_context}

---------------------------------------------------------
TASK
---------------------------------------------------------

Explain:

1. Why the candidate matches the target job.
2. Candidate strengths.
3. Missing skills from the calculated FitScore.
4. Truthful resume improvements.
5. Why the retrieved jobs are relevant.
6. Matching skills and skill gaps for each retrieved job.

Return ONLY valid JSON with exactly these fields:

{{
    "why_fit": [
        "reason 1",
        "reason 2"
    ],

    "strengths": [
        "strength 1",
        "strength 2"
    ],

    "missing_skills": [
        "skill 1",
        "skill 2"
    ],

    "resume_improvements": [
        "improvement 1",
        "improvement 2"
    ],

    "job_recommendations": [
        {{
            "title": "retrieved job title",
            "company": "retrieved company",
            "why_relevant": "why this job is relevant",
            "matching_skills": [
                "skill 1"
            ],
            "skill_gaps": [
                "skill 1"
            ]
        }}
    ],

    "overall_explanation": "short overall explanation"
}}
"""

    # ---------------------------------------------------------
    # Gemini API with retry
    # ---------------------------------------------------------

    max_retries = 3

    for attempt in range(1, max_retries + 1):

        try:

            print(
                f"\n🤖 Gemini API attempt "
                f"{attempt}/{max_retries}..."
            )

            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt
            )

            output_text = response.text.strip()

            # Remove markdown code fences
            if output_text.startswith("```"):
                output_text = output_text.replace(
                    "```json", ""
                )
                output_text = output_text.replace(
                    "```", ""
                )
                output_text = output_text.strip()

            result = json.loads(output_text)

            # -------------------------------------------------
            # Validate missing skills
            # -------------------------------------------------

            allowed_missing = set(
                score_result.get("missingSkills")
                or score_result.get("missing_skills")
                or []
            )

            llm_missing = result.get(
                "missing_skills",
                []
            )

            allowed_missing_lower = {
                skill.lower()
                for skill in allowed_missing
            }

            result["missing_skills"] = [
                skill
                for skill in llm_missing
                if skill.lower()
                in allowed_missing_lower
            ]

            existing_missing_lower = {
                skill.lower()
                for skill in result["missing_skills"]
            }

            for skill in allowed_missing:
                if skill.lower() not in existing_missing_lower:
                    result["missing_skills"].append(skill)

            # -------------------------------------------------
            # Validate retrieved jobs
            # -------------------------------------------------

            retrieved_job_keys = {
                (
                    job.get("title", "").strip().lower(),
                    job.get("company", "").strip().lower()
                )
                for job in retrieved_jobs
            }

            validated_recommendations = []

            for recommendation in result.get(
                "job_recommendations",
                []
            ):

                title = recommendation.get(
                    "title", ""
                ).strip()

                company = recommendation.get(
                    "company", ""
                ).strip()

                key = (
                    title.lower(),
                    company.lower()
                )

                if key in retrieved_job_keys:
                    validated_recommendations.append(
                        recommendation
                    )

            result["job_recommendations"] = (
                validated_recommendations
            )

            print("✅ Gemini response received")

            return result

        except Exception as e:

            error_message = str(e)

            print(
                f"❌ Gemini attempt {attempt} failed:"
                f" {error_message}"
            )

            # Retry only if attempts remain
            if attempt < max_retries:

                wait_time = 2 ** attempt

                print(
                    f"⏳ Retrying in "
                    f"{wait_time} seconds..."
                )

                time.sleep(wait_time)

            else:

                print(
                    "❌ Gemini failed after "
                    f"{max_retries} attempts."
                )

    # ---------------------------------------------------------
    # Final fallback
    # ---------------------------------------------------------

    return {
        "why_fit": [],
        "strengths": [],
        "missing_skills": [],
        "resume_improvements": [],
        "job_recommendations": [],
        "overall_explanation":
            "LLM explanation could not be generated "
            "after multiple attempts."
    }
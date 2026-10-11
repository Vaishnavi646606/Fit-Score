
import json
import os
import time

from dotenv import load_dotenv
from google import genai

from vector_service import search_similar_jobs


# -----------------------------------------
# Load environment
# -----------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)


# -----------------------------------------
# Gemini Client
# -----------------------------------------

_gemini_client = None


def get_gemini_client():
    global _gemini_client

    if _gemini_client is None:
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        _gemini_client = genai.Client(api_key=api_key)

    return _gemini_client


# -----------------------------------------
# RAG Explanation
# -----------------------------------------

def generate_rag_explanation(
    resume_text: str,
    jd_text: str,
    top_k: int = 3
) -> dict:

    request_start = time.perf_counter()

    # -----------------------------------------
    # 1. Retrieve relevant jobs
    # -----------------------------------------

    step_start = time.perf_counter()

    query_text = (
        f"Resume:\n{resume_text[:5000]}\n\n"
        f"Job Description:\n{jd_text[:5000]}"
    )

    retrieved_jobs = search_similar_jobs(
        query_text,
        limit=top_k
    )

    print(
        f"⏱️ RAG vector search took "
        f"{time.perf_counter() - step_start:.2f} seconds"
    )

    print(
        f"🔎 Retrieved {len(retrieved_jobs)} relevant jobs"
    )

    # -----------------------------------------
    # 2. Build compact retrieved context
    # -----------------------------------------

    context_parts = []

    for i, job in enumerate(retrieved_jobs, start=1):
        description = str(job.get("description", ""))[:700]

        context_parts.append(
            f"Job {i}:\n"
            f"Title: {job.get('title', '')}\n"
            f"Company: {job.get('company', '')}\n"
            f"Skills: {job.get('skills', [])}\n"
            f"Description: {description}\n"
            f"Similarity: {job.get('score', 0)}"
        )

    retrieved_context = "\n\n".join(context_parts)

    # -----------------------------------------
    # 3. Build a smaller Gemini prompt
    # -----------------------------------------

    prompt = f"""
You are an AI resume analysis assistant.

Analyze the resume and job context truthfully.

Rules:
- Never invent candidate skills or experience.
- Only claim candidate skills supported by the resume.
- Do not calculate or change the FitScore.
- Use retrieved jobs only as supporting context.
- Do not force irrelevant retrieved jobs into recommendations.
- Return only valid JSON without Markdown fences.

RESUME:
{resume_text[:5000]}

CURRENT JOB DESCRIPTION:
{jd_text[:5000]}

RETRIEVED JOB CONTEXT:
{retrieved_context}

Return this JSON structure:
{{
  "retrieved_jobs": [
    {{
      "title": "job title",
      "company": "company",
      "similarity": 0.0
    }}
  ],
  "context_summary": "brief summary",
  "recommendations": [
    "truthful recommendation"
  ]
}}

Use the retrieved jobs above for retrieved_jobs.
Keep the summary brief and return at most 3 recommendations.
"""

    # -----------------------------------------
    # 4. Generate Gemini response
    # -----------------------------------------

    try:
        step_start = time.perf_counter()

        print("🤖 Generating RAG explanation with Gemini...")

        response = get_gemini_client().models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )

        print(
            f"⏱️ RAG Gemini request took "
            f"{time.perf_counter() - step_start:.2f} seconds"
        )

        output_text = (response.text or "").strip()

        if output_text.startswith("```"):
            output_text = (
                output_text
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

        result = json.loads(output_text)

        # Keep a reliable fallback for retrieved jobs if Gemini
        # returns an empty retrieved_jobs list.
        returned_jobs = result.get("retrieved_jobs") or [
            {
                "title": job.get("title", ""),
                "company": job.get("company", ""),
                "similarity": job.get("score", 0)
            }
            for job in retrieved_jobs
        ]

        print(
            f"⏱️ TOTAL RAG TIME: "
            f"{time.perf_counter() - request_start:.2f} seconds"
        )

        return {
            "retrieved_jobs": returned_jobs,
            "context_summary": result.get("context_summary", ""),
            "recommendations": result.get("recommendations", [])[:3]
        }

    except Exception as e:
        print(f"❌ RAG Gemini generation failed: {str(e)}")

        print(
            f"⏱️ TOTAL RAG TIME (fallback): "
            f"{time.perf_counter() - request_start:.2f} seconds"
        )

        return {
            "retrieved_jobs": [
                {
                    "title": job.get("title", ""),
                    "company": job.get("company", ""),
                    "similarity": job.get("score", 0)
                }
                for job in retrieved_jobs
            ],
            "context_summary": (
                "Relevant jobs were retrieved from MongoDB Vector Search, "
                "but the Gemini explanation could not be generated."
            ),
            "recommendations": []
        }

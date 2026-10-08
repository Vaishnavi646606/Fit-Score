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

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# -----------------------------------------
# RAG Explanation
# -----------------------------------------

def generate_rag_explanation(
    resume_text: str,
    jd_text: str,
    top_k: int = 3
) -> dict:

    # -----------------------------------------
    # 1. Retrieve relevant jobs
    # -----------------------------------------

    query_text = f"""
    Resume:
    {resume_text[:8000]}

    Job Description:
    {jd_text[:8000]}
    """

    retrieved_jobs = search_similar_jobs(
        query_text,
        limit=top_k
    )

    print(
        f"🔎 Retrieved {len(retrieved_jobs)} relevant jobs"
    )


    # -----------------------------------------
    # 2. Build retrieved context
    # -----------------------------------------

    context_parts = []

    for i, job in enumerate(
        retrieved_jobs,
        start=1
    ):

        context_parts.append(
            f"""
            Job {i}

            Title:
            {job.get("title", "")}

            Company:
            {job.get("company", "")}

            Skills:
            {job.get("skills", [])}

            Description:
            {job.get("description", "")}

            Vector Similarity:
            {job.get("score", 0)}
            """
        )

    retrieved_context = "\n".join(
        context_parts
    )


    # -----------------------------------------
    # 3. Send retrieved context to Gemini
    # -----------------------------------------

    prompt = f"""
You are an AI resume analysis assistant.

Use the retrieved job information below as
supporting context.

IMPORTANT RULES:

1. Do not invent skills or experience.
2. Do not claim the candidate has a skill unless
   it appears in the resume.
3. Do not change or calculate the FitScore.
4. Use the retrieved jobs only as contextual information.
5. Clearly distinguish the candidate's actual
   experience from requirements found in jobs.
6. If the retrieved context is not relevant,
   do not force it into the explanation.

RESUME:
{resume_text[:10000]}

CURRENT JOB DESCRIPTION:
{jd_text[:10000]}

RETRIEVED JOB CONTEXT:
{retrieved_context}

Return ONLY valid JSON:

{{
    "retrieved_jobs": [
        {{
            "title": "job title",
            "company": "company",
            "similarity": 0.0
        }}
    ],
    "context_summary": "short summary of relevant retrieved context",
    "recommendations": [
        "truthful recommendation 1",
        "truthful recommendation 2"
    ]
}}
"""

    try:
        response = None

        for attempt in range(3):
            try:
                print(f"🤖 Gemini attempt {attempt + 1}/3")

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )

                break

            except Exception as e:
                print(f"⚠️ Gemini attempt {attempt + 1} failed: {str(e)}")

                if attempt < 2:
                    wait_time = 2 ** (attempt + 1)
                    print(f"⏳ Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise e

        output_text = response.text.strip()

        if output_text.startswith("```"):
            output_text = (
                output_text
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

        result = json.loads(output_text)

        return {
            "retrieved_jobs": result.get("retrieved_jobs", []),
            "context_summary": result.get("context_summary", ""),
            "recommendations": result.get("recommendations", [])
        }

    except Exception as e:
        print(f"❌ Gemini generation failed after retries: {str(e)}")

        return {
            "retrieved_jobs": [
                {
                    "title": job.get("title", ""),
                    "company": job.get("company", ""),
                    "similarity": job.get("score", 0)
                }
                for job in retrieved_jobs
            ],
            "context_summary": "Relevant jobs were successfully retrieved from MongoDB Vector Search, but Gemini was temporarily unavailable.",
            "recommendations": []
        }
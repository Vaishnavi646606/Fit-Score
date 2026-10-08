from matcher import calculate_score


def rank_jobs(resume_text: str, jobs: list) -> list:
    """
    Match one resume against multiple jobs
    and return jobs ranked by FitScore.
    """

    ranked_jobs = []

    for job in jobs:

        job_description = job.get("description", "")

        if not job_description:
            continue

        result = calculate_score(
            resume_text,
            job_description
        )

        ranked_jobs.append({
            "job_id": job.get("job_id"),
            "title": job.get("title"),
            "company": job.get("company"),
            "score": result["score"],

            "score_breakdown": {
                "skills_match": result["skills_match"],
                "semantic_similarity": result["semantic_similarity"],
                "tfidf_similarity": result["tfidf_similarity"],
                "experience_match": result["experience_match"],
                "education_match": result["education_match"]
            },

            "matched_skills": result["matched_skills"],
            "related_skills": result["related_skills"],
            "missing_skills": result["missing_skills"],

            "why_this_score": result["why_this_score"]
        })

    # Highest FitScore first
    ranked_jobs.sort(
        key=lambda job: job["score"],
        reverse=True
    )

    # Add rank
    for index, job in enumerate(ranked_jobs, start=1):
        job["rank"] = index

    return ranked_jobs
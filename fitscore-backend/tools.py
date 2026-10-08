from typing import Any

from langchain_core.tools import tool

from matcher import calculate_score
from vector_service import search_similar_jobs


# ============================================================
# TOOL 1 — CALCULATE FITSCORE
# ============================================================

@tool
def calculate_fit_score_tool(
    resume_text: str,
    job_description: str
) -> dict[str, Any]:
    """
    Calculate the real FitScore using matcher.py.
    """

    print("\n🔧 TOOL: calculate_fit_score")

    result = calculate_score(
        resume_text,
        job_description
    )

    print(
        f"✅ Tool FitScore: "
        f"{result.get('score', 0)}/100"
    )

    return result


# ============================================================
# TOOL 2 — ANALYZE SKILL GAP
# ============================================================

@tool
def analyze_skill_gap_tool(
    fit_score_result: dict[str, Any]
) -> dict[str, Any]:
    """
    Analyze matched and missing skills from FitScore.
    """

    print("\n🔧 TOOL: analyze_skill_gap")

    matched_skills = (
        fit_score_result.get("matched_skills")
        or fit_score_result.get("matchedSkills")
        or []
    )

    missing_skills = (
        fit_score_result.get("missing_skills")
        or fit_score_result.get("missingSkills")
        or []
    )

    skill_gap = fit_score_result.get(
        "skill_gap",
        {}
    )

    result = {
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "skill_gap": skill_gap
    }

    print(
        f"✅ Matched: {matched_skills}"
    )

    print(
        f"❌ Missing: {missing_skills}"
    )

    return result


# ============================================================
# TOOL 3 — SEARCH SIMILAR JOBS
# ============================================================

@tool
def search_similar_jobs_tool(
    resume_text: str,
    limit: int = 3
) -> list[dict[str, Any]]:
    """
    Search MongoDB Atlas Vector Search for relevant jobs.
    """

    print("\n🔧 TOOL: search_similar_jobs")

    jobs = search_similar_jobs(
        resume_text,
        limit=limit
    )

    print(
        f"✅ Tool found "
        f"{len(jobs)} relevant jobs"
    )

    return jobs


# ============================================================
# TOOL 4 — RANK JOBS
# ============================================================

@tool
def rank_jobs_tool(
    jobs: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """
    Rank retrieved jobs by vector similarity.
    """

    print("\n🔧 TOOL: rank_jobs")

    ranked_jobs = sorted(
        jobs,
        key=lambda job: job.get(
            "score",
            0
        ),
        reverse=True
    )

    for index, job in enumerate(
        ranked_jobs,
        start=1
    ):
        job["rank"] = index

    print(
        f"✅ Ranked "
        f"{len(ranked_jobs)} jobs"
    )

    return ranked_jobs


# ============================================================
# TOOL LIST FOR LANGGRAPH
# ============================================================

FIT_SCORE_TOOLS = [
    calculate_fit_score_tool,
    analyze_skill_gap_tool,
    search_similar_jobs_tool,
    rank_jobs_tool
]
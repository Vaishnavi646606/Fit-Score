from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from embedding_service import calculate_semantic_similarity
from parser import (
    extract_skills,
    extract_experience_years,
    extract_keywords,
    extract_skills_with_fallback
)


def calculate_score(resume_text: str, jd_text: str) -> dict:

    print(f"\n📋 ANALYZING RESUME (length: {len(resume_text)} chars)")
    print(f"📋 JOB DESCRIPTION (length: {len(jd_text)} chars)")

    # --------------------------------------------------
    # 1. EXTRACT SKILLS & KEYWORDS
    # --------------------------------------------------

    resume_skills = set(
        extract_skills_with_fallback(resume_text)
    )

    jd_skills = set(
        extract_skills_with_fallback(jd_text)
    )

    resume_keywords = extract_keywords(resume_text)
    jd_keywords = extract_keywords(jd_text)

    print(f"✅ Resume skills extracted: {sorted(resume_skills)}")
    print(f"✅ JD skills required: {sorted(jd_skills)}")

    # --------------------------------------------------
    # 2. EXACT SKILL MATCHING
    # --------------------------------------------------

    exact_matched = resume_skills & jd_skills

    print(f"🎯 Exact matched skills: {sorted(exact_matched)}")

    # --------------------------------------------------
    # 3. RELATED SKILLS
    # --------------------------------------------------

    related_map = {
        "django": ["python", "fastapi", "flask"],
        "flask": ["python", "fastapi", "django"],
        "postgresql": ["mysql", "mongodb"],
        "react": ["javascript", "html", "css"],
        "angular": ["javascript", "typescript"],
        "vue": ["javascript", "html"],
        "spring": ["java"],
        "tensorflow": ["python", "scikit-learn"],
        "pytorch": ["python", "tensorflow", "scikit-learn"],
        "kubernetes": ["docker"],
        "typescript": ["javascript"],
        "next.js": ["react", "javascript"],
        "express": ["node.js", "javascript"],
        "fastapi": ["python", "flask", "django"],
        "machine learning": ["python", "scikit-learn", "tensorflow"],
        "deep learning": ["tensorflow", "pytorch"],
        "nlp": ["python", "spacy", "nltk"],
    }

    related_skills = []

    for jd_skill in jd_skills:

        # Already exactly matched
        if jd_skill in exact_matched:
            continue

        related = related_map.get(jd_skill, [])

        matched_related = [
            skill
            for skill in related
            if skill in resume_skills
        ]

        if matched_related:
            related_skills.append({
                "required_skill": jd_skill,
                "related_resume_skills": matched_related
            })

    print(f"🔗 Related skills: {related_skills}")

    # --------------------------------------------------
    # 4. MISSING SKILLS
    # --------------------------------------------------

    related_required_skills = {
        item["required_skill"]
        for item in related_skills
    }

    # A skill is still a gap if it is not explicitly
    # present in the resume, even when a related skill
    # was detected.
    missing_skills = sorted(
        jd_skills - exact_matched
    )

    print(f"❌ Truly missing skills: {missing_skills}")

    # --------------------------------------------------
    # 5. SKILLS SCORE
    # --------------------------------------------------

    exact_count = len(exact_matched)
    related_count = len(related_required_skills)

    total_required = max(len(jd_skills), 1)

    # Exact skills = full credit
    # Related skills = 50% credit
    skills_score = min(
        int(
            (
                exact_count +
                related_count * 0.5
            )
            / total_required
            * 100
        ),
        100
    )

    print(f"📈 Skills match: {skills_score}%")

    # --------------------------------------------------
    # 6. TF-IDF
    # --------------------------------------------------

    try:

        vectorizer = TfidfVectorizer(
            stop_words="english"
        )

        tfidf_matrix = vectorizer.fit_transform(
            [resume_text, jd_text]
        )

        similarity = cosine_similarity(
            tfidf_matrix[0:1],
            tfidf_matrix[1:2]
        )

        tfidf_score = round(
            float(similarity[0][0]) * 100,
            1
        )

    except Exception as e:

        tfidf_score = 0

        print(
            f"⚠️ TF-IDF calculation failed: {e}"
        )

    print(f"📈 TF-IDF similarity: {tfidf_score}%")

    # --------------------------------------------------
    # 7. SEMANTIC SIMILARITY
    # --------------------------------------------------

    try:

        semantic_score = calculate_semantic_similarity(
            resume_text,
            jd_text
        )

    except Exception as e:

        semantic_score = 0

        print(
            f"⚠️ Semantic similarity failed: {e}"
        )

    print(
        f"🧠 Semantic similarity: {semantic_score}%"
    )

    # --------------------------------------------------
    # 8. FINAL FITSCORE
    # --------------------------------------------------

    final_score = min(
        int(
            skills_score * 0.50 +
            semantic_score * 0.35 +
            tfidf_score * 0.15
        ),
        98
    )

    print(
        f"🏆 FINAL FITSCORE: {final_score}/100"
    )

    # --------------------------------------------------
    # 9. EXPERIENCE
    # --------------------------------------------------

    resume_exp = extract_experience_years(
        resume_text
    )

    jd_exp = extract_experience_years(
        jd_text
    )

    if jd_exp > 0:

        exp_match = min(
            int(resume_exp / jd_exp * 100),
            100
        )

    else:

        exp_match = (
            75
            if resume_exp > 0
            else 50
        )

    # --------------------------------------------------
    # 10. EDUCATION
    # --------------------------------------------------

    edu_keywords = [
        "bachelor",
        "master",
        "phd",
        "degree",
        "b.tech",
        "m.tech",
        "bca",
        "mca"
    ]

    has_education = any(
        keyword in resume_text.lower()
        for keyword in edu_keywords
    )

    edu_match = (
        85
        if has_education
        else 60
    )

    print(
        f"👤 Resume experience: {resume_exp} years, "
        f"JD requires: {jd_exp} years"
    )

    print(
        f"📚 Education match: {edu_match}%, "
        f"Experience match: {exp_match}%"
    )

    # --------------------------------------------------
    # 11. SKILL GAP CATEGORIES
    # --------------------------------------------------

    skill_gap = {
        "core_technical": [],
        "frameworks_tools": [],
        "databases": [],
        "cloud_devops": [],
        "other": []
    }

    database_skills = {
        "mysql",
        "mongodb",
        "postgresql",
        "sql",
        "sqlite",
        "oracle"
    }

    cloud_devops_skills = {
        "aws",
        "azure",
        "gcp",
        "docker",
        "kubernetes",
        "jenkins",
        "terraform"
    }

    framework_tool_skills = {
        "react",
        "angular",
        "vue",
        "django",
        "flask",
        "fastapi",
        "express",
        "tensorflow",
        "pytorch",
        "scikit-learn",
        "langchain"
    }

    for skill in missing_skills:

        if skill in database_skills:

            skill_gap["databases"].append(skill)

        elif skill in cloud_devops_skills:

            skill_gap["cloud_devops"].append(skill)

        elif skill in framework_tool_skills:

            skill_gap["frameworks_tools"].append(skill)

        else:

            skill_gap["core_technical"].append(skill)

    # --------------------------------------------------
    # 12. TRUTHFUL RESUME SUGGESTIONS
    # --------------------------------------------------

    suggestions = []

    for skill in missing_skills[:4]:

        suggestions.append(
            f"If you have hands-on experience with '{skill}', "
            f"consider highlighting it in your resume. "
            f"Otherwise, consider learning '{skill}'."
        )

    # --------------------------------------------------
    # 13. WHY THIS SCORE?
    # --------------------------------------------------

    why_this_score = (
        f"Your FitScore is {final_score}/100. "
        f"Your resume has a {skills_score}% skills match, "
        f"{semantic_score}% semantic similarity, "
        f"and {tfidf_score}% TF-IDF similarity."
    )

    if exact_matched:

        why_this_score += (
            f" Strong matches include: "
            f"{', '.join(sorted(exact_matched)[:5])}."
        )

    if related_skills:

        related_names = [
            item["required_skill"]
            for item in related_skills
        ]

        why_this_score += (
            f" Related skills were detected for: "
            f"{', '.join(related_names[:5])}."
        )

    if missing_skills:

        why_this_score += (
            f" Skill gaps include: "
            f"{', '.join(missing_skills[:5])}."
        )

    if not missing_skills:

        why_this_score += (
            " No major skill gaps were detected."
        )

    # --------------------------------------------------
    # 14. KEYWORDS
    # --------------------------------------------------

    combined_keywords = sorted(
        set(
            [
                *resume_keywords,
                *jd_keywords,
                *list(jd_skills)
            ]
        )
    )[:12]

    # --------------------------------------------------
    # 15. RADAR DATA
    # --------------------------------------------------

    radar_data = [
        {
            "subject": "Skills",
            "A": skills_score
        },
        {
            "subject": "Experience",
            "A": exp_match
        },
        {
            "subject": "Education",
            "A": edu_match
        },
        {
            "subject": "Keywords",
            "A": min(
                len(combined_keywords) * 8,
                100
            )
        },
        {
            "subject": "ATS",
            "A": final_score
        }
    ]

    # --------------------------------------------------
    # 16. FINAL API RESPONSE
    # --------------------------------------------------

    return {

        # Main score
        "score": final_score,

        # Explainable score breakdown
        "score_breakdown": {

            "skills_match": skills_score,

            "semantic_similarity": semantic_score,

            "tfidf_similarity": tfidf_score,

            "weights": {
                "skills": 50,
                "semantic": 35,
                "tfidf": 15
            }
        },

        # Skills
        "matchedSkills": sorted(exact_matched),

        "matched_skills": sorted(exact_matched),

        "relatedSkills": related_skills,

        "related_skills": related_skills,

        "missingSkills": missing_skills,

        "missing_skills": missing_skills,

        # Skill gap
        "skill_gap": skill_gap,

        # Explanation
        "why_this_score": why_this_score,

        # Suggestions
        "suggestions": suggestions,

        # Experience / education
        "educationScore": edu_match,

        "education_match": edu_match,

        "experienceScore": exp_match,

        "experience_match": exp_match,

        "resume_experience_years": resume_exp,

        "required_experience_years": jd_exp,

        # Other metrics
        "skillsScore": skills_score,

        "skills_match": skills_score,

        "keywords": combined_keywords,

        "radarData": radar_data,

        "tfidf_similarity": tfidf_score,

        "semantic_similarity": semantic_score
    }
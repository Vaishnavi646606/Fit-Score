from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from parser import extract_skills, extract_experience_years, extract_keywords

def calculate_score(resume_text: str, jd_text: str) -> dict:
    
    print(f"\n📋 ANALYZING RESUME (length: {len(resume_text)} chars)")
    print(f"📋 JOB DESCRIPTION (length: {len(jd_text)} chars)")
    
    resume_skills = set(extract_skills(resume_text))
    jd_skills = set(extract_skills(jd_text))
    resume_keywords = extract_keywords(resume_text)
    jd_keywords = extract_keywords(jd_text)
    
    print(f"✅ Resume skills extracted: {sorted(list(resume_skills))}")
    print(f"✅ JD skills required: {sorted(list(jd_skills))}")
    print(f"🔑 Resume keywords: {resume_keywords}")
    print(f"🔑 JD keywords: {jd_keywords}")
    
    # Exact matches
    matched = list(resume_skills & jd_skills)
    print(f"🎯 Exact matched skills: {matched}")

    # Related skills mapping
    related_map = {
        'django': ['python', 'fastapi', 'flask'],
        'flask': ['python', 'fastapi', 'django'],
        'postgresql': ['mysql', 'mongodb'],
        'react': ['javascript', 'html', 'css'],
        'angular': ['javascript', 'typescript'],
        'vue': ['javascript', 'html'],
        'spring': ['java'],
        'tensorflow': ['python', 'scikit-learn'],
        'pytorch': ['python', 'tensorflow', 'scikit-learn'],
        'kubernetes': ['docker'],
        'typescript': ['javascript'],
        'next.js': ['react', 'javascript'],
        'express': ['node.js', 'javascript'],
        'fastapi': ['python', 'flask', 'django'],
        'machine learning': ['python', 'scikit-learn', 'tensorflow'],
        'deep learning': ['tensorflow', 'pytorch'],
        'nlp': ['python', 'spacy', 'nltk'],
    }

    partial_matched = []
    for jd_skill in jd_skills:
        if jd_skill not in resume_skills:
            related = related_map.get(jd_skill, [])
            if any(r in resume_skills for r in related):
                partial_matched.append(jd_skill)

    print(f"🔗 Partial matched (related skills): {partial_matched}")
    
    all_matched = list(set(matched + partial_matched))
    missing = list(jd_skills - resume_skills)  # exact missing only
    matched = all_matched

    print(f"📊 Final matched skills: {matched}")
    print(f"❌ Missing skills: {missing}")
    
    # Skills based score (60% weightage)
    skills_score = min(int(len(matched) / max(len(jd_skills), 1) * 100), 100)
    print(f"📈 Skills match %: {skills_score}%")
    
    # TF-IDF score (40% weightage)
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        tfidf_score = round(float(similarity[0][0]) * 100, 1)
        print(f"📈 TF-IDF similarity %: {tfidf_score}%")
    except:
        tfidf_score = 0
        print(f"⚠️  TF-IDF calculation failed")

    final_score = min(int(skills_score * 0.6 + tfidf_score * 0.4), 98)
    print(f"🏆 FINAL SCORE: {final_score}%")

    # Suggestions
    suggestions = []
    for skill in missing[:4]:
        suggestions.append(
            f"Add '{skill}' to your resume — it appears in the job description."
        )
    
    # Extract experience years
    resume_exp = extract_experience_years(resume_text)
    jd_exp = extract_experience_years(jd_text)
    
    # Experience match (compare years)
    if jd_exp > 0:
        exp_match = min(int(resume_exp / jd_exp * 100), 100)
    else:
        exp_match = 75 if resume_exp > 0 else 50
    
    # Education heuristic (if degree keywords found)
    edu_keywords = ['bachelor', 'master', 'phd', 'degree', 'b.tech', 'm.tech', 'bca', 'mca']
    has_education = any(keyword in resume_text.lower() for keyword in edu_keywords)
    edu_match = 85 if has_education else 60
    
    print(f"👤 Resume experience: {resume_exp} years, JD requires: {jd_exp} years")
    print(f"📚 Education match: {edu_match}%, Experience match: {exp_match}%")

    combined_keywords = sorted(set([*resume_keywords, *jd_keywords, *list(jd_skills)]))[:12]
    radar_data = [
        {"subject": "Skills", "A": skills_score},
        {"subject": "Experience", "A": exp_match},
        {"subject": "Education", "A": edu_match},
        {"subject": "Keywords", "A": min(len(combined_keywords) * 8, 100)},
        {"subject": "ATS", "A": final_score},
    ]
    
    return {
        "score": final_score,
        "matchedSkills": matched,
        "missingSkills": missing,
        "suggestions": suggestions,
        "educationScore": edu_match,
        "experienceScore": exp_match,
        "skillsScore": skills_score,
        "keywords": combined_keywords,
        "radarData": radar_data,
        "matched_skills": matched,
        "missing_skills": missing,
        "skills_match": skills_score,
        "experience_match": exp_match,
        "education_match": edu_match,
        "resume_experience_years": resume_exp,
        "required_experience_years": jd_exp,
    }
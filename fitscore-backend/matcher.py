from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from parser import extract_skills

def calculate_score(resume_text: str, jd_text: str) -> dict:
    
    # Skills nikalo
    resume_skills = set(extract_skills(resume_text))
    jd_skills = set(extract_skills(jd_text))
    
    # Exact matches
    matched = list(resume_skills & jd_skills)

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

    # Partial matched dikhao matched mein but missing mein bhi rakhho
    all_matched = list(set(matched + partial_matched))
    # Missing = sirf exact missing, partial wale bhi missing mein dikhenge
    missing = list(jd_skills - resume_skills)  # exact missing only
    matched = all_matched

    # Skills based score (60% weightage)
    skills_score = min(int(len(matched) / max(len(jd_skills), 1) * 100), 100)
    
    # TF-IDF score (40% weightage)
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        tfidf_score = round(float(similarity[0][0]) * 100, 1)
    except:
        tfidf_score = 0

    # Combined score — skills matter more than raw text similarity
    final_score = min(int(skills_score * 0.6 + tfidf_score * 0.4), 98)

    # Suggestions
    suggestions = []
    for skill in missing[:4]:
        suggestions.append(
            f"Add '{skill}' to your resume — it appears in the job description."
        )

    # Exact matches
    return {
        "score": final_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "suggestions": suggestions,
        "skills_match": skills_score,
        "experience_match": min(final_score + 7, 98),
        "education_match": 90
    }
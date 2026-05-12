#!/usr/bin/env python3
"""
Sanity checks for resume-screener Python backend
- Test 1: calculate_score with sample resume/JD
- Test 2: extract_skills_with_fallback with noisy text
"""
import sys
from parser import extract_skills_with_fallback
from matcher import calculate_score

print("=" * 70)
print("🧪 RESUME SCREENER SANITY CHECKS")
print("=" * 70)

# TEST 1: calculate_score with short resume and JD
print("\n📋 TEST 1: calculate_score() with sample data")
print("-" * 70)

sample_resume = """
John Doe
Senior Software Engineer
5 years of professional experience

SKILLS:
- Python, JavaScript, React, Django
- PostgreSQL, MongoDB, AWS
- Docker, Kubernetes, CI/CD

EXPERIENCE:
Senior Developer at Tech Corp (2 years)
- Built microservices using FastAPI and PostgreSQL
- Deployed services on Kubernetes

Software Engineer at StartupXYZ (3 years)
- Developed React frontend applications
- Implemented REST APIs with Django
"""

sample_jd = """
Job Title: Full Stack Engineer
Required Skills: React, Python, PostgreSQL, Docker, AWS
Experience: 5 years
Education: Bachelor's degree in Computer Science

We are looking for a Full Stack Engineer with:
- Strong React and JavaScript skills
- Backend experience with Python (Django/FastAPI)
- Database design with PostgreSQL
- Docker containerization experience
- AWS cloud deployment knowledge
- Experience with CI/CD pipelines
"""

try:
    result = calculate_score(sample_resume, sample_jd)
    assert result is not None, "Result is None"
    assert "score" in result, "Missing 'score' field"
    assert "matchedSkills" in result or "matched_skills" in result, "Missing 'matchedSkills'"
    assert "radarData" in result, "Missing 'radarData'"

    matched = result.get("matchedSkills") or result.get("matched_skills") or []
    radar = result.get("radarData") or []

    assert len(matched) > 0, f"No matched skills found. Got: {matched}"
    assert len(radar) > 0, f"No radar data found. Got: {radar}"

    print(f"✅ PASS: calculate_score executed successfully")
    print(f"   Score: {result.get('score')}%")
    print(f"   Matched Skills ({len(matched)}): {matched[:5]}")
    print(f"   Radar Data Points: {len(radar)}")
    for item in radar:
        print(f"      - {item['subject']}: {item['A']}%")

except Exception as e:
    print(f"❌ FAIL: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# TEST 2: extract_skills_with_fallback with noisy input
print("\n\n🔧 TEST 2: extract_skills_with_fallback() with noisy text")
print("-" * 70)

noisy_sample = """
skls: pyton, javaScript, rct
exp: DjangO, FstAPI, postgre
cloud: dckr, k8s, AWS
"""

try:
    fallback_skills = extract_skills_with_fallback(noisy_sample)
    assert fallback_skills, "Fallback returned empty list"
    print(f"✅ PASS: extract_skills_with_fallback() extracted {len(fallback_skills)} skills")
    print(f"   Extracted: {fallback_skills}")

    expected_keywords = ['python', 'javascript', 'react', 'docker', 'aws']
    found_expected = [s for s in fallback_skills if any(e in s.lower() for e in expected_keywords)]
    print(f"   Expected matches found: {found_expected}")

except Exception as e:
    print(f"❌ FAIL: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 70)
print("✅ ALL SANITY CHECKS COMPLETED")
print("=" * 70)

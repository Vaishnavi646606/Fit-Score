import pdfplumber
import spacy

nlp = spacy.load("en_core_web_sm")

# Common skills database
SKILLS_DB = [
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#",
    "php", "ruby", "swift", "kotlin", "go", "rust",
    
    # Frontend
    "react", "vue", "angular", "html", "css", "tailwind",
    "bootstrap", "next.js", "redux",
    
    # Backend
    "node.js", "express", "fastapi", "django", "flask",
    "spring boot", "laravel",
    
    # Database
    "mongodb", "mysql", "postgresql", "redis", "firebase",
    
    # DevOps / Cloud
    "docker", "kubernetes", "aws", "azure", "gcp",
    "linux", "nginx", "git", "github", "ci/cd",
    
    # AI/ML
    "machine learning", "deep learning", "nlp", "tensorflow",
    "pytorch", "scikit-learn", "pandas", "numpy",
    
    # Other
    "rest api", "graphql", "agile", "scrum", "figma"
]

def extract_text_from_pdf(file_path: str) -> str:
    """PDF se pure text nikalo"""
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.lower()

def extract_skills(text: str) -> list:
    """Text se skills nikalo"""
    text_lower = text.lower()
    found_skills = []
    
    for skill in SKILLS_DB:
        if skill.lower() in text_lower:
            found_skills.append(skill)
    
    return list(set(found_skills))  # duplicates remove
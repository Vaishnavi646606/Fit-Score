import pdfplumber
import spacy
import re

nlp = spacy.load("en_core_web_sm")

# Comprehensive skills database
SKILLS_DB = [
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#",
    "php", "ruby", "swift", "kotlin", "go", "rust", "scala", "r",
    "perl", "groovy", "shell", "bash",
    
    # Frontend
    "react", "vue", "angular", "html", "css", "tailwind",
    "bootstrap", "next.js", "redux", "svelte", "flutter", "react native",
    
    # Backend
    "node.js", "express", "fastapi", "django", "flask",
    "spring boot", "laravel", "asp.net", "grpc", "graphql", "rest api",
    
    # Database
    "mongodb", "mysql", "postgresql", "redis", "firebase", "cassandra",
    "dynamodb", "elasticsearch", "oracle", "sqlserver", "mariadb",
    
    # DevOps / Cloud
    "docker", "kubernetes", "aws", "azure", "gcp", "heroku",
    "linux", "ubuntu", "nginx", "apache", "git", "github", "gitlab",
    "ci/cd", "jenkins", "gitlab ci", "github actions", "travis ci",
    
    # AI/ML
    "machine learning", "deep learning", "nlp", "tensorflow",
    "pytorch", "scikit-learn", "pandas", "numpy", "keras", "spacy",
    
    # Other
    "agile", "scrum", "kanban", "jira", "figma", "sketch", "xd",
    "soap", "xml", "json", "yaml", "toml", "html5", "es6", "es7",
    "microservices", "serverless", "lambda", "api gateway",
    "websocket", "realtime", "socket.io", "mqtt"
]

def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from PDF"""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"❌ PDF extraction error: {str(e)}")
        return ""
    
    return text.lower()

def extract_skills(text: str) -> list:
    """Extract skills from text using keyword matching"""
    text_lower = text.lower()
    found_skills = []
    
    for skill in SKILLS_DB:
        # Use word boundaries to avoid partial matches
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            found_skills.append(skill)
    
    return list(set(found_skills))  # Remove duplicates

def extract_keywords(text: str) -> list:
    """Extract important keywords using spaCy NER"""
    doc = nlp(text[:2000])  # Limit to first 2000 chars for performance
    keywords = set()
    
    for ent in doc.ents:
        if ent.label_ in ["PERSON", "ORG", "GPE"]:
            keywords.add(ent.text.lower())
    
    # Also extract noun chunks
    for chunk in doc.noun_chunks:
        if len(chunk.text.split()) <= 3:
            keywords.add(chunk.text.lower())
    
    return list(keywords)[:10]  # Top 10 keywords

def extract_experience_years(text: str) -> int:
    """Extract years of experience from text"""
    patterns = [
        r'(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience',
        r'(?:total|overall)\s+(?:of\s+)?(\d+)\s*\+?\s*years?',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1))
    
    return 0
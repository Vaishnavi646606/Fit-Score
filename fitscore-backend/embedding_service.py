from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


# Load embedding model once when the application starts
model = SentenceTransformer("all-MiniLM-L6-v2")


def get_embedding(text: str):
    """
    Convert text into a numerical vector (embedding).
    """
    return model.encode(text)


def calculate_semantic_similarity(
    resume_text: str,
    jd_text: str
) -> float:
    """
    Calculate semantic similarity between resume and job description.
    Returns a score between 0 and 100.
    """

    resume_embedding = get_embedding(resume_text)
    jd_embedding = get_embedding(jd_text)

    similarity = cosine_similarity(
        [resume_embedding],
        [jd_embedding]
    )[0][0]

    return round(float(similarity) * 100, 2)
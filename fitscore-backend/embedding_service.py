from memory_utils import log_memory  # purane imports kaam karte rahein

_first_embedding_logged = False
_model = None


def get_model():
    """Load the embedding model only when semantic matching is needed."""
    global _model

    if _model is None:
        from sentence_transformers import SentenceTransformer  # lazy import

        log_memory("before_sentence_transformer_load", model="all-MiniLM-L6-v2")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        log_memory("after_sentence_transformer_load", model="all-MiniLM-L6-v2")

    return _model


def get_embedding(text: str):
    global _first_embedding_logged

    model = get_model()

    if not _first_embedding_logged:
        log_memory("before_first_embedding_encode", text_chars=len(text))

    embedding = model.encode(text)

    if not _first_embedding_logged:
        _first_embedding_logged = True
        log_memory("after_first_embedding_encode", embedding_dims=len(embedding))

    return embedding


def calculate_semantic_similarity(resume_text: str, jd_text: str) -> float:
    from sklearn.metrics.pairwise import cosine_similarity  # lazy import

    resume_embedding = get_embedding(resume_text)
    jd_embedding = get_embedding(jd_text)

    similarity = cosine_similarity([resume_embedding], [jd_embedding])[0][0]

    return round(float(similarity) * 100, 2)
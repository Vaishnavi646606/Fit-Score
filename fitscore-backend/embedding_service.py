from datetime import datetime, timezone
import os
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


_first_embedding_logged = False
_model = None


def log_memory(phase: str, **details) -> None:
    """Log process RSS for temporary deployment diagnostics."""
    rss_bytes = None

    try:
        with open("/proc/self/status", encoding="utf-8") as status_file:
            for line in status_file:
                if line.startswith("VmRSS:"):
                    rss_bytes = int(line.split()[1]) * 1024
                    break
    except (FileNotFoundError, OSError, ValueError):
        pass

    rss_mib = (
        f"{rss_bytes / (1024 * 1024):.2f}"
        if rss_bytes is not None
        else "unavailable"
    )
    detail_text = " ".join(
        f"{key}={value}"
        for key, value in details.items()
    )
    suffix = f" {detail_text}" if detail_text else ""

    print(
        f"[MEMORY] phase={phase} pid={os.getpid()} "
        f"rss_mib={rss_mib} "
        f"timestamp={datetime.now(timezone.utc).isoformat()}{suffix}"
    )


def get_model():
    """Load the embedding model only when semantic matching is needed."""
    global _model

    if _model is None:
        log_memory(
            "before_sentence_transformer_load",
            model="all-MiniLM-L6-v2",
        )
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        log_memory(
            "after_sentence_transformer_load",
            model="all-MiniLM-L6-v2",
        )

    return _model


def get_embedding(text: str):
    """
    Convert text into a numerical vector (embedding).
    """
    global _first_embedding_logged

    model = get_model()

    if not _first_embedding_logged:
        log_memory(
            "before_first_embedding_encode",
            text_chars=len(text),
        )

    embedding = model.encode(text)

    if not _first_embedding_logged:
        _first_embedding_logged = True
        log_memory(
            "after_first_embedding_encode",
            embedding_dims=len(embedding),
        )

    return embedding


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

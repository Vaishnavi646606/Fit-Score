import os
from functools import lru_cache

import numpy as np
from google import genai
from google.genai import types

_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured")
        _client = genai.Client(api_key=api_key)
    return _client


@lru_cache(maxsize=64)
def get_embedding(text: str):
    """384-dim normalized embedding. Cached, so the resume is embedded only once per request."""
    result = _get_client().models.embed_content(
        model="gemini-embedding-001",
        contents=text[:6000],
        config=types.EmbedContentConfig(output_dimensionality=384),
    )
    vec = np.array(result.embeddings[0].values, dtype=float)
    return vec / np.linalg.norm(vec)


def calculate_semantic_similarity(resume_text: str, jd_text: str) -> float:
    a = get_embedding(resume_text)
    b = get_embedding(jd_text)
    return round(float(np.dot(a, b)) * 100, 2)
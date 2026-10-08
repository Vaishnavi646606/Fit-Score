import os

from dotenv import load_dotenv
from pymongo import MongoClient

from embedding_service import get_embedding


# ==================================================
# LOAD ENVIRONMENT VARIABLES
# ==================================================

load_dotenv()


# ==================================================
# MONGODB CONNECTION
# ==================================================

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise ValueError(
        "MONGODB_URI is not set in .env"
    )


client = MongoClient(MONGODB_URI)

db = client["fitscore"]

jobs_collection = db["jobs"]


# ==================================================
# VECTOR SEARCH CONFIGURATION
# ==================================================

VECTOR_INDEX_NAME = "job_vector_index"

EMBEDDING_DIMENSION = 384


# ==================================================
# CREATE JOB EMBEDDING
# ==================================================

def create_job_embedding(job_text: str):
    """
    Convert job description into a
    384-dimensional embedding using
    the existing MiniLM model.
    """

    if not job_text or not job_text.strip():
        raise ValueError(
            "Job text cannot be empty"
        )

    embedding = get_embedding(job_text)

    return embedding.tolist()


# ==================================================
# STORE JOB IN MONGODB
# ==================================================

def add_job(
    title: str,
    company: str,
    description: str,
    skills: list
):
    """
    Create an embedding for a job and store
    the job + embedding in MongoDB Atlas.
    """

    if not title:
        raise ValueError(
            "Job title cannot be empty"
        )

    if not company:
        raise ValueError(
            "Company cannot be empty"
        )

    if not description:
        raise ValueError(
            "Job description cannot be empty"
        )

    # ----------------------------------------------
    # Generate embedding
    # ----------------------------------------------

    embedding = create_job_embedding(
        description
    )

    # ----------------------------------------------
    # Validate embedding
    # ----------------------------------------------

    if len(embedding) != EMBEDDING_DIMENSION:
        raise ValueError(
            f"Expected {EMBEDDING_DIMENSION}-dimensional "
            f"embedding, got {len(embedding)}"
        )

    # ----------------------------------------------
    # Create MongoDB document
    # ----------------------------------------------

    job_document = {

        "title": title,

        "company": company,

        "description": description,

        "skills": skills,

        "embedding": embedding
    }

    # ----------------------------------------------
    # Insert document
    # ----------------------------------------------

    result = jobs_collection.insert_one(
        job_document
    )

    print(
        f"✅ Job stored in MongoDB: "
        f"{result.inserted_id}"
    )

    return str(result.inserted_id)


# ==================================================
# VECTOR SEARCH
# ==================================================

def search_similar_jobs(
    query_text: str,
    limit: int = 3
):
    """
    Find semantically similar jobs using
    MongoDB Atlas Vector Search.

    Flow:

        Query text
            ↓
        MiniLM embedding
            ↓
        MongoDB Atlas Vector Search
            ↓
        Top matching jobs
    """

    if not query_text or not query_text.strip():
        raise ValueError(
            "Query text cannot be empty"
        )

    if limit <= 0:
        raise ValueError(
            "limit must be greater than 0"
        )

    # ----------------------------------------------
    # Create query embedding
    # ----------------------------------------------

    query_embedding = create_job_embedding(
        query_text
    )

    # ----------------------------------------------
    # MongoDB Vector Search Pipeline
    # ----------------------------------------------

    pipeline = [

        {
            "$vectorSearch": {

                "index": VECTOR_INDEX_NAME,

                "path": "embedding",

                "queryVector": query_embedding,

                "numCandidates": max(
                    limit * 10,
                    20
                ),

                "limit": limit
            }
        },

        {
            "$project": {

                "_id": 0,

                "title": 1,

                "company": 1,

                "description": 1,

                "skills": 1,

                "score": {
                    "$meta": "vectorSearchScore"
                }
            }
        }
    ]

    # ----------------------------------------------
    # Execute Vector Search
    # ----------------------------------------------

    results = list(
        jobs_collection.aggregate(
            pipeline
        )
    )

    # ----------------------------------------------
    # Display results
    # ----------------------------------------------

    print(
        f"\n🔎 Vector Search Results: "
        f"{len(results)} jobs found"
    )

    for index, job in enumerate(
        results,
        start=1
    ):

        print(
            f"\n{index}. "
            f"{job.get('title', 'Unknown')} "
            f"- "
            f"{job.get('company', 'Unknown')}"
        )

        print(
            f"   Vector Score: "
            f"{job.get('score', 0)}"
        )

    return results


# ==================================================
# TEST VECTOR SEARCH
# ==================================================

if __name__ == "__main__":

    print(
        "\n🚀 Testing MongoDB Atlas Vector Search..."
    )

    test_query = """
    Python developer with experience in
    FastAPI, machine learning, SQL,
    MongoDB and React.
    """

    results = search_similar_jobs(
        test_query,
        limit=3
    )

    print(
        "\n✅ Vector Search Test Completed"
    )

    print(
        f"Total jobs returned: {len(results)}"
    )
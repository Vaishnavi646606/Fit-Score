import time
from vector_service import get_jobs_collection, create_job_embedding

col = get_jobs_collection()

for job in col.find({}, {"description": 1, "title": 1}):
    emb = create_job_embedding(job["description"])
    col.update_one({"_id": job["_id"]}, {"$set": {"embedding": emb}})
    print("✅ updated:", job.get("title"))
    time.sleep(1)  # rate limit se bachne ke liye

print("Done")
import os
import requests
from dotenv import load_dotenv

load_dotenv()



def search_adzuna_jobs():
    app_id = os.getenv("ADZUNA_APP_ID")
    api_key = os.getenv("ADZUNA_API_KEY")

    if not app_id or not api_key:
        print("⚠️ Adzuna credentials missing")
        return []

    search_queries = [
        "AI Engineer",
        "Machine Learning Engineer",
        "Python Developer",
        "Software Developer",
    ]

    for query in search_queries:
        try:
            print(f'🔎 Adzuna search: "{query}"')

            response = requests.get(
                "https://api.adzuna.com/v1/api/jobs/in/search/1",
                params={
                    "app_id": app_id,
                    "app_key": api_key,
                    "results_per_page": 10,
                    "what": query,
                    "where": "india",
                    "sort_by": "relevance",
                },
                timeout=10,
            )

            response.raise_for_status()

            results = response.json().get("results", [])

            print(f"📊 Found {len(results)} jobs")

            if results:
                jobs = []

                for index, job in enumerate(results[:10]):
                    jobs.append({
                        "job_id": f"ADZUNA_{job.get('id', index + 1)}",
                        "title": job.get("title", "Unknown"),
                        "company": job.get("company", {}).get(
                            "display_name",
                            "Unknown"
                        ),
                        "location": job.get("location", {}).get(
                            "display_name",
                            "India"
                        ),
                        "redirect_url": job.get("redirect_url", ""),
                        "applyUrl": job.get("redirect_url", ""),
                        "description": job.get("description", ""),
                        "created": job.get("created"),
                    })

                return jobs

        except Exception as e:
            print(f"❌ Adzuna error for '{query}': {e}")

    return []
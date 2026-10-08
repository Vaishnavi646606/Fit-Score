from typing import TypedDict, Any, Annotated
from langchain_google_genai import ChatGoogleGenerativeAI
import json

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from langchain_core.messages import (
    AIMessage,
    BaseMessage
)

from matcher import calculate_score
from llm_service import generate_llm_explanation

from tools import (
    calculate_fit_score_tool,
    analyze_skill_gap_tool,
    search_similar_jobs_tool,
    rank_jobs_tool,
    FIT_SCORE_TOOLS
)
# ============================================================
# DAY 7 — GEMINI TOOL-CALLING LLM
# ============================================================

tool_calling_llm = ChatGoogleGenerativeAI(
    model="gemini-3.7-flash",
    temperature=0
)

tool_calling_llm = tool_calling_llm.bind_tools(
    FIT_SCORE_TOOLS
)


# ============================================================
# STATE
# ============================================================

class FitScoreState(TypedDict):
    resume_text: str
    job_description: str

    score: float
    fit_score_result: dict[str, Any]

    skill_gap: dict[str, Any]

    relevant_jobs: list[dict[str, Any]]
    ranked_jobs: list[dict[str, Any]]

    llm_explanation: dict[str, Any]

    decision: str

    messages: Annotated[
        list[BaseMessage],
        add_messages
    ]

    result: str


# ============================================================
# NODE 1 — ANALYZE RESUME
# ============================================================

def analyze_resume(state: FitScoreState):

    print("\n🔍 Analyzing resume...")

    resume_text = state["resume_text"]

    print(
        f"📄 Resume length: "
        f"{len(resume_text)} characters"
    )

    return {
        "result": "Resume analysis completed"
    }


# ============================================================
# NODE 2 — CALCULATE REAL FITSCORE
# ============================================================

def calculate_fit_score(state: FitScoreState):

    print("\n📊 Calculating REAL FitScore...")

    resume_text = state["resume_text"]
    job_description = state["job_description"]

    # Existing matcher.py is the single source of truth.
    fit_score = calculate_score(
        resume_text,
        job_description
    )

    print(
        f"\n🏆 FitScore: "
        f"{fit_score['score']}/100"
    )

    print(
        f"📈 Skills Match: "
        f"{fit_score['score_breakdown']['skills_match']}%"
    )

    print(
        f"🧠 Semantic Similarity: "
        f"{fit_score['score_breakdown']['semantic_similarity']}%"
    )

    print(
        f"📝 TF-IDF Similarity: "
        f"{fit_score['score_breakdown']['tfidf_similarity']}%"
    )

    return {
        "score": fit_score["score"],
        "fit_score_result": fit_score
    }


# ============================================================
# NODE 3 — ANALYZE SKILL GAP
# ============================================================

def analyze_skill_gap(state: FitScoreState):

    print("\n🎯 Analyzing skill gap...")

    fit_score = state["fit_score_result"]

    matched_skills = (
        fit_score.get("matched_skills")
        or fit_score.get("matchedSkills")
        or []
    )

    missing_skills = (
        fit_score.get("missing_skills")
        or fit_score.get("missingSkills")
        or []
    )

    skill_gap = fit_score.get(
        "skill_gap",
        {}
    )

    print(
        f"✅ Matched skills: "
        f"{matched_skills}"
    )

    print(
        f"❌ Missing skills: "
        f"{missing_skills}"
    )

    print(
        f"📂 Skill gap categories: "
        f"{skill_gap}"
    )

    return {
        "skill_gap": skill_gap
    }


# ============================================================
# NODE 4 — AGENT DECISION
# ============================================================

def decide_next_step(state: FitScoreState):

    print("\n🧠 Agent Decision...")

    fit_score = state["fit_score_result"]

    missing_skills = (
        fit_score.get("missing_skills")
        or fit_score.get("missingSkills")
        or []
    )

    score = state["score"]

    print(
        f"📊 Current FitScore: "
        f"{score}/100"
    )

    print(
        f"❌ Missing skills: "
        f"{missing_skills}"
    )

    if missing_skills:

        print(
            "➡️ Decision: "
            "Search relevant jobs"
        )

        return {
            "decision": "search_jobs"
        }

    print(
        "➡️ Decision: "
        "Continue final analysis"
    )

    return {
        "decision": "continue"
    }


# ============================================================
# ROUTER 1
# ============================================================

def route_after_decision(
    state: FitScoreState
):

    if state["decision"] == "search_jobs":

        return "prepare_search_tool"

    return "generate_llm_explanation"


# ============================================================
# NODE 5 — PREPARE SEARCH TOOL CALL
# ============================================================

def prepare_search_tool_call(
    state: FitScoreState
):

    print(
        "\n🤖 Agent preparing search tool..."
    )

    tool_call = {
        "name": "search_similar_jobs_tool",

        "args": {
            "resume_text":
                state["resume_text"],

            "limit": 3
        },

        "id": "search_jobs_001"
    }

    print(
        "🔧 Tool selected: "
        "search_similar_jobs_tool"
    )

    return {
        "messages": [
            AIMessage(
                content="",
                tool_calls=[
                    tool_call
                ]
            )
        ]
    }


# ============================================================
# SEARCH TOOL NODE
# ============================================================

# IMPORTANT:
# This ToolNode contains ONLY the search tool.
search_tool_node = ToolNode(
    [
        search_similar_jobs_tool
    ]
)


# ============================================================
# NODE 6 — PROCESS SEARCH RESULT
# ============================================================

def process_search_result(
    state: FitScoreState
):

    print(
        "\n📦 Processing search ToolNode result..."
    )

    messages = state.get(
        "messages",
        []
    )

    if not messages:

        print(
            "⚠️ No tool messages found."
        )

        return {
            "relevant_jobs": []
        }

    tool_message = messages[-1]

    print(
        f"📨 Tool response type: "
        f"{type(tool_message).__name__}"
    )

    content = tool_message.content

    try:

        if isinstance(content, str):

            jobs = json.loads(content)

        else:

            jobs = content

    except Exception as e:

        print(
            f"⚠️ Could not parse search result: "
            f"{e}"
        )

        jobs = []

    if not isinstance(jobs, list):

        jobs = []

    print(
        f"✅ Search tool returned "
        f"{len(jobs)} jobs"
    )

    for index, job in enumerate(
        jobs,
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

        print(
            f"   Skills: "
            f"{job.get('skills', [])}"
        )

    return {
        "relevant_jobs": jobs
    }


# ============================================================
# NODE 7 — SECOND AGENT DECISION
# ============================================================

def decide_after_search(
    state: FitScoreState
):

    print(
        "\n🧠 Agent evaluating retrieved jobs..."
    )

    jobs = state.get(
        "relevant_jobs",
        []
    )

    print(
        f"📦 Retrieved jobs: "
        f"{len(jobs)}"
    )

    if jobs:

        print(
            "➡️ Decision: "
            "Rank retrieved jobs"
        )

        return {
            "decision": "rank_jobs"
        }

    print(
        "➡️ Decision: "
        "No jobs available"
    )

    return {
        "decision": "continue"
    }


# ============================================================
# ROUTER 2
# ============================================================

def route_after_search(
    state: FitScoreState
):

    if state["decision"] == "rank_jobs":

        return "prepare_rank_tool"

    return "generate_llm_explanation"


# ============================================================
# NODE 8 — PREPARE RANK TOOL CALL
# ============================================================

def prepare_rank_tool_call(
    state: FitScoreState
):

    print(
        "\n🤖 Agent preparing rank tool..."
    )

    jobs = state.get(
        "relevant_jobs",
        []
    )

    tool_call = {
        "name": "rank_jobs_tool",

        "args": {
            "jobs": jobs
        },

        "id": "rank_jobs_001"
    }

    print(
        "🔧 Tool selected: "
        "rank_jobs_tool"
    )

    return {
        "messages": [
            AIMessage(
                content="",
                tool_calls=[
                    tool_call
                ]
            )
        ]
    }


# ============================================================
# RANK TOOL NODE
# ============================================================

# IMPORTANT:
# Separate ToolNode prevents the search and rank
# processing branches from running simultaneously.
rank_tool_node = ToolNode(
    [
        rank_jobs_tool
    ]
)


# ============================================================
# NODE 9 — PROCESS RANK RESULT
# ============================================================

def process_rank_result(
    state: FitScoreState
):

    print(
        "\n📦 Processing rank ToolNode result..."
    )

    messages = state.get(
        "messages",
        []
    )

    if not messages:

        print(
            "⚠️ No rank tool message found."
        )

        return {
            "ranked_jobs": [],
            "relevant_jobs": []
        }

    tool_message = messages[-1]

    print(
        f"📨 Tool response type: "
        f"{type(tool_message).__name__}"
    )

    content = tool_message.content

    try:

        if isinstance(content, str):

            ranked_jobs = json.loads(
                content
            )

        else:

            ranked_jobs = content

    except Exception as e:

        print(
            f"⚠️ Could not parse rank result: "
            f"{e}"
        )

        ranked_jobs = []

    if not isinstance(
        ranked_jobs,
        list
    ):

        ranked_jobs = []

    print(
        f"✅ Rank tool returned "
        f"{len(ranked_jobs)} jobs"
    )

    print(
        "\n🏆 Ranked Jobs:"
    )

    for index, job in enumerate(
        ranked_jobs,
        start=1
    ):

        print(
            f"{index}. "
            f"{job.get('title', 'Unknown')} "
            f"- "
            f"{job.get('company', 'Unknown')}"
        )

        print(
            f"   Rank: "
            f"{job.get('rank', index)}"
        )

        print(
            f"   Vector Score: "
            f"{job.get('score', 0)}"
        )

    return {
        "ranked_jobs": ranked_jobs,

        # Use ranked jobs as the final
        # RAG context.
        "relevant_jobs": ranked_jobs
    }


# ============================================================
# NODE 10 — GEMINI / RAG
# ============================================================

def generate_llm_explanation_node(
    state: FitScoreState
):

    print(
        "\n🤖 Generating Gemini "
        "RAG explanation..."
    )

    explanation = generate_llm_explanation(
        state["resume_text"],
        state["job_description"],
        state["fit_score_result"],
        state["relevant_jobs"]
    )

    print(
        "\n✅ Gemini RAG explanation generated"
    )

    print(
        "\n💡 Why you're a fit:"
    )

    for reason in explanation.get(
        "why_fit",
        []
    ):

        print(
            f"   • {reason}"
        )

    print(
        "\n💪 Strengths:"
    )

    for strength in explanation.get(
        "strengths",
        []
    ):

        print(
            f"   • {strength}"
        )

    print(
        "\n❌ Missing Skills:"
    )

    for skill in explanation.get(
        "missing_skills",
        []
    ):

        print(
            f"   • {skill}"
        )

    print(
        "\n📝 Resume Improvements:"
    )

    for improvement in explanation.get(
        "resume_improvements",
        []
    ):

        print(
            f"   • {improvement}"
        )

    print(
        "\n🔎 RAG Job Recommendations:"
    )

    for index, job in enumerate(
        explanation.get(
            "job_recommendations",
            []
        ),
        start=1
    ):

        print(
            f"\n   {index}. "
            f"{job.get('title', 'Unknown')}"
        )

        print(
            f"      Company: "
            f"{job.get('company', 'Unknown')}"
        )

        print(
            f"      Why Relevant: "
            f"{job.get('why_relevant', '')}"
        )

        print(
            f"      Matching Skills: "
            f"{job.get('matching_skills', [])}"
        )

        print(
            f"      Skill Gaps: "
            f"{job.get('skill_gaps', [])}"
        )

    print(
        "\n📋 Overall Explanation:"
    )

    print(
        explanation.get(
            "overall_explanation",
            ""
        )
    )

    return {
        "llm_explanation": explanation
    }


# ============================================================
# NODE 11 — FINAL RESULT
# ============================================================

def generate_result(
    state: FitScoreState
):

    print(
        "\n🚀 Generating final agent result..."
    )

    score = state["score"]

    jobs = state.get(
        "ranked_jobs",
        []
    )

    return {
        "result": (
            f"FitScore analysis completed: "
            f"{score}/100. "
            f"{len(jobs)} relevant jobs retrieved "
            f"and ranked."
        )
    }


# ============================================================
# BUILD GRAPH
# ============================================================

graph = StateGraph(
    FitScoreState
)


# ============================================================
# ADD NODES
# ============================================================

graph.add_node(
    "analyze_resume",
    analyze_resume
)

graph.add_node(
    "calculate_fit_score",
    calculate_fit_score
)

graph.add_node(
    "analyze_skill_gap",
    analyze_skill_gap
)

graph.add_node(
    "decide_next_step",
    decide_next_step
)

graph.add_node(
    "prepare_search_tool",
    prepare_search_tool_call
)

graph.add_node(
    "search_tool_node",
    search_tool_node
)

graph.add_node(
    "process_search_result",
    process_search_result
)

graph.add_node(
    "decide_after_search",
    decide_after_search
)

graph.add_node(
    "prepare_rank_tool",
    prepare_rank_tool_call
)

graph.add_node(
    "rank_tool_node",
    rank_tool_node
)

graph.add_node(
    "process_rank_result",
    process_rank_result
)

graph.add_node(
    "generate_llm_explanation",
    generate_llm_explanation_node
)

graph.add_node(
    "generate_result",
    generate_result
)


# ============================================================
# INITIAL FLOW
# ============================================================

graph.add_edge(
    START,
    "analyze_resume"
)

graph.add_edge(
    "analyze_resume",
    "calculate_fit_score"
)

graph.add_edge(
    "calculate_fit_score",
    "analyze_skill_gap"
)

graph.add_edge(
    "analyze_skill_gap",
    "decide_next_step"
)


# ============================================================
# DECISION 1
# ============================================================

graph.add_conditional_edges(
    "decide_next_step",
    route_after_decision,
    {
        "prepare_search_tool":
            "prepare_search_tool",

        "generate_llm_explanation":
            "generate_llm_explanation"
    }
)


# ============================================================
# SEARCH FLOW
# ============================================================

graph.add_edge(
    "prepare_search_tool",
    "search_tool_node"
)

graph.add_edge(
    "search_tool_node",
    "process_search_result"
)

graph.add_edge(
    "process_search_result",
    "decide_after_search"
)


# ============================================================
# DECISION 2
# ============================================================

graph.add_conditional_edges(
    "decide_after_search",
    route_after_search,
    {
        "prepare_rank_tool":
            "prepare_rank_tool",

        "generate_llm_explanation":
            "generate_llm_explanation"
    }
)


# ============================================================
# RANK FLOW
# ============================================================

graph.add_edge(
    "prepare_rank_tool",
    "rank_tool_node"
)

graph.add_edge(
    "rank_tool_node",
    "process_rank_result"
)

graph.add_edge(
    "process_rank_result",
    "generate_llm_explanation"
)


# ============================================================
# FINAL FLOW
# ============================================================

graph.add_edge(
    "generate_llm_explanation",
    "generate_result"
)

graph.add_edge(
    "generate_result",
    END
)


# ============================================================
# COMPILE
# ============================================================

app = graph.compile()


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    resume = """
    Python developer with experience in FastAPI,
    machine learning, SQL, MongoDB and React.
    """

    # Missing NLP + Kubernetes intentionally
    # so the complete dynamic path is tested.

    job_description = """
    Looking for a Python developer with experience
    in FastAPI, machine learning, SQL, MongoDB,
    NLP and Kubernetes.
    """

    result = app.invoke({

        "resume_text":
            resume,

        "job_description":
            job_description,

        "score":
            0,

        "fit_score_result":
            {},

        "skill_gap":
            {},

        "relevant_jobs":
            [],

        "ranked_jobs":
            [],

        "llm_explanation":
            {},

        "decision":
            "",

        "messages":
            [],

        "result":
            ""
    })


    # ========================================================
    # FINAL OUTPUT
    # ========================================================

    print(
        "\n\n"
        "============================================================"
    )

    print(
        "\n✅ FINAL LANGGRAPH RESULT"
    )

    print(
        "\n============================================================"
    )

    print(
        f"\n🏆 FitScore: "
        f"{result['score']}/100"
    )

    print(
        "\n📊 Score Breakdown:"
    )

    print(
        result["fit_score_result"].get(
            "score_breakdown",
            {}
        )
    )

    print(
        "\n✅ Matched Skills:"
    )

    print(
        result["fit_score_result"].get(
            "matched_skills",
            []
        )
    )

    print(
        "\n❌ Missing Skills:"
    )

    print(
        result["fit_score_result"].get(
            "missing_skills",
            []
        )
    )

    print(
        "\n🎯 Skill Gap:"
    )

    print(
        result.get(
            "skill_gap",
            {}
        )
    )

    print(
        "\n🧠 Agent Decision:"
    )

    print(
        result.get(
            "decision",
            ""
        )
    )

    print(
        "\n🔎 Ranked Jobs:"
    )

    for index, job in enumerate(
        result.get(
            "ranked_jobs",
            []
        ),
        start=1
    ):

        print(
            f"\n{index}. "
            f"{job.get('title', 'Unknown')}"
        )

        print(
            f"   Company: "
            f"{job.get('company', 'Unknown')}"
        )

        print(
            f"   Rank: "
            f"{job.get('rank', index)}"
        )

        print(
            f"   Vector Score: "
            f"{job.get('score', 0)}"
        )

        print(
            f"   Skills: "
            f"{job.get('skills', [])}"
        )

    print(
        "\n🚀 Final Result:"
    )

    print(
        result.get(
            "result",
            ""
        )
    )

    print(
        "\n============================================================"
    )

    # ============================================================
# DAY 7 — TASK 1 TOOL CALLING TEST
# ============================================================

if __name__ == "__main__":

    test_response = tool_calling_llm.invoke(
        """
        The candidate has missing skills.
        Search for 3 relevant jobs based on the candidate resume.

        Candidate resume:
        Python developer with FastAPI, machine learning,
        SQL, MongoDB and React.
        """
    )

    print("\n========================================")
    print("🧪 DAY 7 TOOL CALLING TEST")
    print("========================================")

    print("\n📨 AI Response:")
    print(test_response)

    print("\n🔧 Tool Calls:")

    for tool_call in test_response.tool_calls:
        print(tool_call)
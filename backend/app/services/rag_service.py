import json
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings
from app.models.job import Job
from app.models.candidate import CandidateProfile

SYSTEM_PROMPT = """You are a professional AI Career Advisor and recruiter.
Your task is to review a candidate's resume/profile and compare it against the top 5 semantically similar job listings retrieved from our database.
You must analyze the match and output a single, valid JSON object containing your evaluation.

Do NOT include any code block formatting (like ```json ... ```), markdown wrappers, or leading/trailing text. Output ONLY the raw JSON string.

The JSON object must follow this exact structure:
{
  "best_matching_job": {
    "title": "Job Title",
    "company": "Company Name"
  },
  "match_percentage": 85,
  "why_job_matches": "A concise paragraph explaining why this job matches the candidate's profile.",
  "matching_skills": ["Skill1", "Skill2"],
  "missing_skills": ["SkillA", "SkillB"],
  "resume_improvement_suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ],
  "learning_roadmap": [
    "Step 1: Learn X...",
    "Step 2: Practice Y..."
  ],
  "interview_preparation_tips": [
    "Tip 1...",
    "Tip 2..."
  ]
}
"""

def build_user_prompt(candidate_text: str, jobs: List[Job]) -> str:
    """Format candidate text and job descriptions into a cohesive prompt."""
    jobs_text = ""
    for i, job in enumerate(jobs):
        jobs_text += f"\n--- JOB {i+1} ---\n"
        jobs_text += f"ID: {job.id}\n"
        jobs_text += f"Title: {job.title}\n"
        jobs_text += f"Company: {job.company}\n"
        jobs_text += f"Location: {job.location or 'Remote'}\n"
        jobs_text += f"Salary: {job.salary or 'Competitive'}\n"
        jobs_text += f"Required Skills: {job.required_skills}\n"
        jobs_text += f"Description: {job.description}\n"
        
    return f"""Candidate Profile details extracted from resume:
==================================
{candidate_text}
==================================

Top 5 Semantically Similar Jobs:
==================================
{jobs_text}
==================================

Based on the candidate details and the list of jobs, perform your evaluation and return the JSON response now. Remember to output ONLY the raw JSON object, with no markdown styling.
"""

def call_gemini(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Query Google Gemini API."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        # Combine system and user prompt for Gemini's structure
        full_text = f"{system_prompt}\n\n{user_prompt}"
        payload = {
            "contents": [{"parts": [{"text": full_text}]}],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        response = httpx.post(url, headers=headers, json=payload, timeout=20.0)
        if response.status_code == 200:
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print(f"[RAG Gemini] API returned status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"[RAG Gemini] Error: {e}")
        return None

def call_openai(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Query OpenAI API."""
    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2
        }
        response = httpx.post(url, headers=headers, json=payload, timeout=25.0)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            print(f"[RAG OpenAI] API returned status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"[RAG OpenAI] Error: {e}")
        return None

def call_groq(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Query Groq Cloud API."""
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2
        }
        response = httpx.post(url, headers=headers, json=payload, timeout=25.0)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            # Try fallback model if llama-3.3-70b fails
            print(f"[RAG Groq] Model Llama-3.3 failed, trying fallback llama3-8b-8192...")
            payload["model"] = "llama3-8b-8192"
            response = httpx.post(url, headers=headers, json=payload, timeout=20.0)
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            print(f"[RAG Groq] API returned status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"[RAG Groq] Error: {e}")
        return None

def call_ollama(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Query local Ollama instance."""
    try:
        url = f"{settings.OLLAMA_URL}/api/chat"
        headers = {"Content-Type": "application/json"}
        payload = {
            "model": "llama3",
            "format": "json",
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "options": {
                "temperature": 0.2
            }
        }
        response = httpx.post(url, headers=headers, json=payload, timeout=40.0)
        if response.status_code == 200:
            data = response.json()
            return data["message"]["content"]
        else:
            print(f"[RAG Ollama] API returned status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"[RAG Ollama] Error: {e}")
        return None

def generate_rag_recommendations(candidate_text: str, jobs: List[Job]) -> Dict[str, Any]:
    """
    Perform Retrieval-Augmented Generation (RAG) using the best available LLM provider.
    """
    if not jobs:
        return {
            "error": "No semantically similar jobs were found in the database. Please make sure jobs are seeded."
        }
        
    user_prompt = build_user_prompt(candidate_text, jobs)
    
    # Determine the LLM provider based on config or key presence
    provider = settings.LLM_PROVIDER.lower().strip() if settings.LLM_PROVIDER else ""
    
    if not provider:
        if settings.GEMINI_API_KEY:
            provider = "gemini"
        elif settings.OPENAI_API_KEY:
            provider = "openai"
        elif settings.GROQ_API_KEY:
            provider = "groq"
        else:
            provider = "ollama"
            
    print(f"[RAG Service] Using provider: {provider}")
    
    raw_response = None
    if provider == "gemini":
        raw_response = call_gemini(SYSTEM_PROMPT, user_prompt)
    elif provider == "openai":
        raw_response = call_openai(SYSTEM_PROMPT, user_prompt)
    elif provider == "groq":
        raw_response = call_groq(SYSTEM_PROMPT, user_prompt)
    elif provider == "ollama":
        raw_response = call_ollama(SYSTEM_PROMPT, user_prompt)
        
    # If chosen provider failed, try Groq or Ollama as automatic fallbacks
    if not raw_response:
        print("[RAG Service] Primary provider failed, attempting Groq fallback...")
        if settings.GROQ_API_KEY and provider != "groq":
            raw_response = call_groq(SYSTEM_PROMPT, user_prompt)
            
    if not raw_response:
        print("[RAG Service] Fallback failed. Returning offline fallback template.")
        return get_offline_fallback(candidate_text, jobs)

    # Clean and parse the response
    try:
        # Clean potential markdown block wraps
        clean_text = raw_response.strip()
        if clean_text.startswith("```"):
            # Remove leading ```json or ```
            lines = clean_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_text = "\n".join(lines).strip()
            
        data = json.loads(clean_text)
        return data
    except Exception as parse_err:
        print(f"[RAG Service] JSON parsing failed for raw response: {raw_response}. Error: {parse_err}")
        return get_offline_fallback(candidate_text, jobs, raw_text_fallback=raw_response)

def get_offline_fallback(candidate_text: str, jobs: List[Job], raw_text_fallback: str = None) -> Dict[str, Any]:
    """Provide a graceful local/offline default output if LLM APIs fail."""
    best_job = jobs[0]
    return {
        "best_matching_job": {
            "title": best_job.title,
            "company": best_job.company
        },
        "match_percentage": 75,
        "why_job_matches": f"Offline Fallback: The candidate has strong overlapping keywords with the {best_job.title} role at {best_job.company}.",
        "matching_skills": [s.strip() for s in best_job.required_skills.split(",") if s.strip()][:3],
        "missing_skills": ["Advanced Cloud/DevOps", "System Design"],
        "resume_improvement_suggestions": [
            "Quantify your accomplishments under the experience section.",
            "Tailor your profile description to explicitly highlight core skills: " + best_job.required_skills
        ],
        "learning_roadmap": [
            "Step 1: Strengthen core skills in: " + best_job.required_skills,
            "Step 2: Build a personal portfolio project demonstrating these technologies."
        ],
        "interview_preparation_tips": [
            "Review conceptual questions regarding: " + best_job.required_skills,
            "Prepare STAR format stories for your engineering projects."
        ],
        "system_notice": "Offline fallback due to LLM provider error.",
        "raw_response_preview": raw_text_fallback[:200] if raw_text_fallback else None
    }

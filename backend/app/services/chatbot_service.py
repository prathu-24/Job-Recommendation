import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.candidate import CandidateProfile
from app.models.job import Job
from app.models.recommendation import Recommendation
from app.services.qdrant_service import search_similar_jobs, is_available as qdrant_available
from app.services.gap_analyzer import analyze_gap  # We'll create this service next
from app.core.config import settings
from typing import Optional
import httpx

# Pre-defined career/resume suggestions and course listings
TECH_COURSES = {
    "python": [
        {"title": "Python for Everybody Specialization", "platform": "Coursera", "url": "https://www.coursera.org/specializations/python"},
        {"title": "Complete Python Bootcamp From Zero to Hero", "platform": "Udemy", "url": "https://www.udemy.com/course/complete-python-bootcamp/"}
    ],
    "sql": [
        {"title": "SQL for Data Science", "platform": "Coursera", "url": "https://www.coursera.org/learn/sql-for-data-science"},
        {"title": "The Ultimate MySQL Bootcamp", "platform": "Udemy", "url": "https://www.udemy.com/course/the-ultimate-mysql-bootcamp-go-from-sql-beginner-to-expert/"}
    ],
    "react": [
        {"title": "Front-End Web Development with React", "platform": "Coursera", "url": "https://www.coursera.org/learn/react"},
        {"title": "React - The Complete Guide (incl Hooks, React Router, Redux)", "platform": "Udemy", "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/"}
    ],
    "javascript": [
        {"title": "JavaScript: The Definitive Guide", "platform": "O'Reilly", "url": "https://www.oreilly.com/library/view/javascript-the-definitive/9781491952016/"},
        {"title": "The Complete JavaScript Course 2026: From Zero to Expert!", "platform": "Udemy", "url": "https://www.udemy.com/course/the-complete-javascript-course-for-beginners/"}
    ],
    "typescript": [
        {"title": "Understanding TypeScript", "platform": "Udemy", "url": "https://www.udemy.com/course/understanding-typescript/"}
    ],
    "docker": [
        {"title": "Docker Technologies for DevOps and Developers", "platform": "Udemy", "url": "https://www.udemy.com/course/docker-technologies-for-devops-and-developers/"}
    ],
    "kubernetes": [
        {"title": "Certified Kubernetes Administrator (CKA) with Practice Tests", "platform": "Udemy", "url": "https://www.udemy.com/course/certified-kubernetes-administrator/"}
    ],
    "aws": [
        {"title": "AWS Certified Cloud Practitioner Ultimate Exam Training", "platform": "Udemy", "url": "https://www.udemy.com/course/aws-certified-cloud-practitioner-training-course/"}
    ],
    "machine learning": [
        {"title": "Machine Learning Specialization by Andrew Ng", "platform": "Coursera", "url": "https://www.coursera.org/specializations/machine-learning-introduction"},
        {"title": "Python for Data Science and Machine Learning Bootcamp", "platform": "Udemy", "url": "https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/"}
    ],
    "deep learning": [
        {"title": "Deep Learning Specialization", "platform": "Coursera", "url": "https://www.coursera.org/specializations/deep-learning"}
    ]
}

DEFAULT_COURSES = [
    {"title": "Career Success Specialization", "platform": "Coursera", "url": "https://www.coursera.org/specializations/career-success"},
    {"title": "Technical Writing & Interviewing Skills", "platform": "Udemy", "url": "https://www.udemy.com/"}
]

def query_groq_api(messages: List[Dict[str, str]], api_key: str) -> Optional[str]:
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama3-8b-8192",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1024
        }
        response = httpx.post(url, headers=headers, json=payload, timeout=12.0)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            print(f"[Groq AI] API returned status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"[Groq AI] Error connecting to Groq: {e}")
        return None

def generate_chatbot_response(user_message: str, current_user: User, db: Session) -> str:
    """
    Generate an intelligent conversational response based on user message and their profile details.
    """
    # Try using Groq if API key is provided
    if settings.GROQ_API_KEY:
        try:
            from app.models.chatbot import ChatMessage
            
            # Build system prompt context
            system_content = (
                "You are Jobify AI, a helpful, intelligent, and polite career assistant on the Jobify platform. "
                "Your goal is to help users with resume writing tips, career roadmaps, learning suggestions, and job matching.\n\n"
                f"Current User Name: {current_user.name}\n"
                f"Current User Role: {current_user.role}\n"
            )
            
            if current_user.role == "candidate":
                profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
                if profile:
                    system_content += (
                        f"Candidate Profile Details:\n"
                        f"- Current skills: {profile.skills or 'None set'}\n"
                        f"- Experience: {profile.experience or 'None set'}\n"
                        f"- Education: {profile.education or 'None set'}\n"
                        f"- Extracted Projects: {profile.projects or 'None set'}\n"
                        f"- Certifications: {profile.certifications or 'None'}\n"
                    )
            
            # Fetch up to 5 recent job openings to give the LLM job context if candidate asks
            try:
                jobs = db.query(Job).order_by(Job.created_at.desc()).limit(5).all()
                if jobs:
                    jobs_summary = "\nAvailable Job Openings on Jobify:\n"
                    for j in jobs:
                        jobs_summary += f"- {j.title} at {j.company} in {j.location or 'Remote'} (Requires: {j.required_skills})\n"
                    system_content += jobs_summary
            except Exception:
                pass
                
            system_content += (
                "\nGuidelines for your response:\n"
                "1. Be concise, professional, and action-oriented.\n"
                "2. Keep responses suitable for a chat window (around 2-3 paragraphs max, use bullet points where helpful).\n"
                "3. Format your responses with Markdown for readability (bolding, lists, code blocks, etc.).\n"
                "4. Suggest specific online courses when the user lacks skills for a job."
            )
            
            # Load last 8 messages for memory
            history_msgs = db.query(ChatMessage).filter(
                ChatMessage.user_id == current_user.id
            ).order_by(ChatMessage.created_at.desc()).limit(8).all()
            
            history_msgs = list(reversed(history_msgs))
            
            payload_messages = [{"role": "system", "content": system_content}]
            for m in history_msgs:
                payload_messages.append({"role": m.role, "content": m.content})
                
            # If the current message isn't the last one in the database, append it
            if not payload_messages or payload_messages[-1]["content"] != user_message:
                payload_messages.append({"role": "user", "content": user_message})
                
            groq_response = query_groq_api(payload_messages, settings.GROQ_API_KEY)
            if groq_response:
                return groq_response
        except Exception as e:
            print(f"[Chatbot Service] Failed to use Groq: {e}")

    # Fallback: Rule-based intent-matching
    msg = user_message.lower().strip()
    
    # 1. Fetch Candidate Profile (if applicable)
    profile = None
    if current_user.role == "candidate":
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    
    # Intent 1: Greetings
    if any(greet in msg for greet in ["hello", "hi", "hey", "greetings", "good morning", "good afternoon"]):
        name = current_user.name.split()[0] if current_user.name else "there"
        role_info = ""
        if current_user.role == "candidate":
            role_info = " Ask me about recommended jobs, resume tips, or how to improve your skills for a specific job!"
        elif current_user.role == "recruiter":
            role_info = " I can help you find match analytics, review job descriptions, or locate top candidates."
        else:
            role_info = " Let me know if you need system statistics or user management tips."
            
        return f"Hi {name}! 👋 Welcome to Jobify's AI Career Assistant. How can I help you today?{role_info}"
        
    # Intent 2: About / Who are you
    if any(keyword in msg for keyword in ["who are you", "what is this", "what do you do", "help me"]):
        return (
            "I am the Jobify AI Career Assistant. 🤖\n\n"
            "I'm designed to help you:\n"
            "• **Find Jobs**: Type 'find python jobs' or 'recommend jobs' to search available postings.\n"
            "• **Analyze Skill Gaps**: Ask 'what skills do I need for Software Engineer at Google?' to see missing skills and course recommendations.\n"
            "• **Get Resume Advice**: Ask 'how do I format my projects section?' or 'give me resume tips'.\n"
            "• **Improve Skills**: Let me know what technology you want to learn and I'll suggest courses."
        )

    # Intent 3: Resume Advice & Tips
    if "resume" in msg or "cv " in msg or "formatting" in msg:
        if "tip" in msg or "help" in msg or "format" in msg or "improve" in msg:
            return (
                "Here are 4 tips to make your resume stand out to Jobify's parser and recruiters:\n\n"
                "1. **Use Action Verbs**: Start bullet points with words like *Developed, Optimized, Led, Architected*.\n"
                "2. **Quantify Impact**: Instead of 'Fixed bugs', say 'Resolved 50+ critical software bugs, improving client satisfaction by 12%'.\n"
                "3. **Match Keywords**: Ensure skills mentioned in job descriptions (e.g., 'Docker', 'Next.js') appear naturally in your text.\n"
                "4. **Keep Sections Clean**: Use standard headings like *Education, Experience, Projects, Certifications* so our parser can accurately extract data.\n\n"
                "💡 *Tip: Try uploading a fresh PDF/DOCX on the Upload page to see immediate parser updates.*"
            )

    # Intent 4: Job Recommendation Queries (Only for Candidates)
    if current_user.role == "candidate" and any(keyword in msg for keyword in ["job", "recommend", "match", "find", "search", "positions"]):
        if profile and profile.resume_path:
            # Let's search database recommendations first
            recs = db.query(Recommendation).filter(Recommendation.candidate_id == profile.id).order_by(Recommendation.similarity_score.desc()).limit(3).all()
            if recs:
                res_msg = f"Based on your parsed resume, here are your top Jobify matches:\n\n"
                for r in recs:
                    res_msg += f"• **{r.job.title}** at *{r.job.company}* ({r.similarity_score}% Match) - {r.job.location or 'Remote'}\n"
                res_msg += "\nWould you like me to analyze your skill gaps for any of these jobs? Just ask 'what am I missing for [Job Title]?'"
                return res_msg
        
        # Fallback/Direct Query searching
        # Extract potential query keywords from message
        query_match = re.search(r'(?:for|in|about)\s+([a-zA-Z0-9\s\+\#\-\.]+)', msg)
        query_text = query_match.group(1).strip() if query_match else msg.replace("find", "").replace("search", "").replace("jobs", "").replace("job", "").strip()
        
        if len(query_text) > 2:
            if qdrant_available():
                hits = search_similar_jobs(query_text, top_k=3)
                if hits:
                    res_msg = f"I searched Jobify using vector similarity for '{query_text}':\n\n"
                    for hit in hits:
                        job = db.query(Job).filter(Job.id == hit["job_id"]).first()
                        if job:
                            res_msg += f"• **{job.title}** at *{job.company}* - {job.location or 'Remote'} (Similarity: {int(hit['score']*100)}%)\n"
                    return res_msg
            
            # DB Keyword Search fallback
            jobs = db.query(Job).filter(
                (Job.title.like(f"%{query_text}%")) | 
                (Job.required_skills.like(f"%{query_text}%")) |
                (Job.description.like(f"%{query_text}%"))
            ).limit(3).all()
            if jobs:
                res_msg = f"I found these postings matching '{query_text}':\n\n"
                for job in jobs:
                    res_msg += f"• **{job.title}** at *{job.company}* - {job.location or 'Remote'} (Requires: {job.required_skills})\n"
                return res_msg
            
        return "I couldn't find any specific jobs matching that query. Try typing something like 'find React Developer positions' or 'jobs requiring Python'."

    # Intent 5: Gap Analysis / Course Suggestions / Skill Requirements (Critical requirement!)
    # Match: "what skills do I need for...", "suggest courses for...", "gap analysis for...", "what am I missing for..."
    job_target = None
    if current_user.role == "candidate" and profile:
        # Extract job title or company from the message
        # E.g. "what skills do I need for python engineer", "what am I missing for Google"
        job_pattern = re.search(r'(?:missing for|need for|require for|gap for|analysis for|courses for|get)\s+([a-zA-Z0-9\s\+\#\-\.\,\:]+)', msg)
        if job_pattern:
            job_name = job_pattern.group(1).strip()
            # Try to find a matching job in the database
            matched_job = db.query(Job).filter(
                (Job.title.like(f"%{job_name}%")) | 
                (Job.company.like(f"%{job_name}%"))
            ).first()
            if matched_job:
                job_target = matched_job

    if job_target and profile:
        # Perform gap analysis
        gap_results = analyze_gap(profile.skills or "", job_target.required_skills, job_target.description)
        missing = gap_results["missing_skills"]
        courses = gap_results["suggested_courses"]
        readiness = gap_results["readiness_level"]
        
        res_msg = f"📊 **Gap Analysis for '{job_target.title}' at {job_target.company}**\n"
        res_msg += f"Your Readiness: **{readiness}**\n\n"
        
        if not missing:
            res_msg += "🎉 **Excellent!** You have all the skills explicitly listed for this role. You are a strong candidate to apply instantly!"
        else:
            res_msg += "🔑 **Missing/Gap Skills Identified:**\n"
            res_msg += ", ".join([f"*{m}*" for m in missing]) + "\n\n"
            
            res_msg += "📚 **Recommended Courses to bridge the gap:**\n"
            for c in courses[:4]:  # Show top 4
                res_msg += f"• [{c['title']}]({c['url']}) ({c['platform']})\n"
                
            res_msg += f"\n💡 **Pro Tip:** {gap_results['improvement_tips'][0]}"
        return res_msg

    # Intent 6: Course suggestions for arbitrary technology (e.g. "suggest courses for aws")
    tech_match = re.search(r'(?:learn|course|suggest courses?|how to learn|study|improve my skills)[\s\w]*?(?:for|in|about)?\s+([a-zA-Z0-9\s\+\#\-\.]+)', msg)
    if tech_match:
        tech = tech_match.group(1).strip()
        matched_courses = []
        for key, courses in TECH_COURSES.items():
            if key in tech:
                matched_courses.extend(courses)
        
        if matched_courses:
            res_msg = f"Here are the top-rated courses to learn **{tech.title()}**:\n\n"
            for c in matched_courses:
                res_msg += f"• **[{c['title']}]({c['url']})** on *{c['platform']}*\n"
            return res_msg
    
    # Also match "suggest courses" without a specific tech
    if any(keyword in msg for keyword in ["suggest course", "course suggestion", "improve my skills", "skill improvement", "better job"]):
        name = current_user.name.split()[0] if current_user.name else "there"
        skills_text = ""
        if profile and profile.skills:
            skills_text = f"\n\nBased on your current skills (*{profile.skills}*), here are areas you could strengthen:\n"
        
        res_msg = f"Great initiative, {name}! 📚 Here are top courses to boost your career:\n"
        if skills_text:
            res_msg += skills_text
        res_msg += (
            "\n**🐍 Python & Data Science:**\n"
            "• [Python for Everybody](https://www.coursera.org/specializations/python) — Coursera\n"
            "• [Data Science Bootcamp](https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/) — Udemy\n\n"
            "**⚛️ Web Development:**\n"
            "• [React - The Complete Guide](https://www.udemy.com/course/react-the-complete-guide-incl-redux/) — Udemy\n"
            "• [The Complete JavaScript Course](https://www.udemy.com/course/the-complete-javascript-course-for-beginners/) — Udemy\n\n"
            "**☁️ Cloud & DevOps:**\n"
            "• [AWS Certified Cloud Practitioner](https://www.udemy.com/course/aws-certified-cloud-practitioner-training-course/) — Udemy\n"
            "• [Docker for DevOps](https://www.udemy.com/course/docker-technologies-for-devops-and-developers/) — Udemy\n\n"
            "💡 *Tell me a specific skill (e.g., 'suggest courses for React') for more targeted suggestions!*"
        )
        return res_msg

    # Intent 7: Interview Preparation
    if any(keyword in msg for keyword in ["interview", "prepare for", "preparation", "crack", "ace the"]):
        name = current_user.name.split()[0] if current_user.name else "there"
        skills_info = ""
        if profile and profile.skills:
            skills_info = f"\n\n📋 Based on your skills (*{profile.skills}*), focus your prep on these areas specifically.\n"
        
        return (
            f"Great question, {name}! 🎯 Here's a complete interview preparation guide:\n\n"
            "**📝 Resume & Application Phase:**\n"
            "• Tailor your resume for each job — match keywords from the job description\n"
            "• Prepare a 60-second elevator pitch about yourself\n"
            "• Research the company's products, culture, and recent news\n\n"
            "**💻 Technical Interview:**\n"
            "• Practice data structures & algorithms on **LeetCode** or **HackerRank**\n"
            "• Review system design concepts (scalability, databases, APIs)\n"
            "• Be ready to code on a whiteboard — practice thinking out loud\n"
            "• Know your projects inside-out — expect deep-dive questions\n\n"
            "**🗣️ Behavioral Interview (STAR Method):**\n"
            "• **S**ituation — Describe the context\n"
            "• **T**ask — Explain what you needed to do\n"
            "• **A**ction — Detail the steps you took\n"
            "• **R**esult — Share the outcome and impact\n\n"
            "**🔑 Common Questions to Prepare:**\n"
            "• 'Tell me about a challenging project you worked on'\n"
            "• 'How do you handle tight deadlines?'\n"
            "• 'Why do you want to work at this company?'\n"
            "• 'Where do you see yourself in 5 years?'\n\n"
            "**📚 Recommended Resources:**\n"
            "• [Cracking the Coding Interview](https://www.crackingthecodinginterview.com/) — Book\n"
            "• [LeetCode](https://leetcode.com/) — Practice Problems\n"
            "• [Pramp](https://www.pramp.com/) — Free Mock Interviews\n"
            f"{skills_info}"
            "\n💡 *Tip: Practice mock interviews with a friend and time yourself!*"
        )

    # Intent 8: Career Roadmap
    if any(keyword in msg for keyword in ["roadmap", "career path", "career roadmap", "career plan", "career guide", "growth plan", "what should i learn"]):
        name = current_user.name.split()[0] if current_user.name else "there"
        skills_info = ""
        if profile and profile.skills:
            skills_info = f"\n📋 Your current skills: *{profile.skills}*\n"
        
        return (
            f"Here's a career roadmap for you, {name}! 🗺️\n\n"
            f"{skills_info}"
            "\n**🟢 Stage 1: Foundation (0-1 Years)**\n"
            "• Master a primary language (Python, JavaScript, or Java)\n"
            "• Learn Git, Linux basics, and command line\n"
            "• Build 2-3 personal projects with real-world use cases\n"
            "• Create a strong resume and LinkedIn profile\n\n"
            "**🔵 Stage 2: Specialization (1-2 Years)**\n"
            "• Choose a domain: Web Dev, Data Science, DevOps, or Mobile\n"
            "• Learn frameworks (React, Django, TensorFlow, etc.)\n"
            "• Contribute to open-source projects on GitHub\n"
            "• Get an internship or freelance experience\n\n"
            "**🟣 Stage 3: Professional Growth (2-4 Years)**\n"
            "• Learn system design and architecture patterns\n"
            "• Get cloud certifications (AWS, GCP, or Azure)\n"
            "• Build leadership and communication skills\n"
            "• Start mentoring junior developers\n\n"
            "**🟡 Stage 4: Senior / Leadership (4+ Years)**\n"
            "• Specialize in architecture or management track\n"
            "• Lead cross-functional projects\n"
            "• Develop expertise in emerging tech (AI/ML, Blockchain, etc.)\n\n"
            "**🔗 Useful Roadmap Resources:**\n"
            "• [roadmap.sh](https://roadmap.sh/) — Interactive developer roadmaps\n"
            "• [freeCodeCamp](https://www.freecodecamp.org/) — Free coding curriculum\n"
            "• [The Odin Project](https://www.theodinproject.com/) — Full-stack path\n\n"
            "💡 *Tell me your target role (e.g., 'roadmap for data scientist') for a more personalized plan!*"
        )

    # Intent 9: Company-specific job search
    company_match = re.search(r'(?:jobs?\s+(?:at|in|for)|(?:at|in|for)\s+\w+\s+jobs?|work\s+(?:at|for|in))\s+([a-zA-Z0-9\s\&\-\.]+)', msg)
    if company_match:
        company_name = company_match.group(1).strip()
        jobs = db.query(Job).filter(
            Job.company.ilike(f"%{company_name}%")
        ).limit(5).all()
        
        if jobs:
            res_msg = f"🏢 Found **{len(jobs)} job(s)** at **{company_name.title()}**:\n\n"
            for job in jobs:
                res_msg += f"• **{job.title}** — {job.location or 'Remote'} (Requires: {job.required_skills})\n"
            res_msg += "\n💡 *Ask 'what skills do I need for [Job Title]?' for a gap analysis!*"
            return res_msg
        else:
            return (
                f"I couldn't find any open jobs at **{company_name.title()}** on Jobify right now. 😕\n\n"
                "Here's what you can do:\n"
                "• Check the **Jobs** page for all current openings\n"
                "• Try a broader search like 'find Python jobs' or 'find React positions'\n"
                f"• Visit {company_name.title()}'s career page directly for their latest postings"
            )

    # Intent 10: Default Fallback
    name = current_user.name.split()[0] if current_user.name else "candidate"
    return (
        f"I'm here to help, {name}! 😊 Here are the things I can assist you with:\n\n"
        "🚀 **Job Search** — *'What recommended jobs do I have?'* or *'Find Python jobs'*\n"
        "📝 **Resume Tips** — *'Give me tips to improve my resume'*\n"
        "🔍 **Skill Gap Analysis** — *'What skills do I need for [Job Title]?'*\n"
        "🏢 **Company Jobs** — *'Find jobs at Google'*\n"
        "📚 **Course Suggestions** — *'Suggest courses for React'* or *'Suggest courses for AWS'*\n"
        "🎯 **Interview Prep** — *'How should I prepare for a technical interview?'*\n"
        "🗺️ **Career Roadmap** — *'What career roadmap should I follow?'*\n\n"
        "Just pick any topic above and ask away! 💬"
    )


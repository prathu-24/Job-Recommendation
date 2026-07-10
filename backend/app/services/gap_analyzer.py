from typing import List, Dict, Any

# Map of tech skills to online courses
SKILL_COURSES_DB = {
    "python": [
        {"title": "Python for Everybody Specialization", "platform": "Coursera", "url": "https://www.coursera.org/specializations/python"},
        {"title": "Complete Python Bootcamp From Zero to Hero", "platform": "Udemy", "url": "https://www.udemy.com/course/complete-python-bootcamp/"}
    ],
    "sql": [
        {"title": "SQL for Data Science", "platform": "Coursera", "url": "https://www.coursera.org/learn/sql-for-data-science"},
        {"title": "The Ultimate MySQL Bootcamp", "platform": "Udemy", "url": "https://www.udemy.com/course/the-ultimate-mysql-bootcamp-go-from-sql-beginner-to-expert/"}
    ],
    "postgresql": [
        {"title": "SQL for Data Science (PostgreSQL Focus)", "platform": "Coursera", "url": "https://www.coursera.org/learn/sql-for-data-science"}
    ],
    "mysql": [
        {"title": "The Ultimate MySQL Bootcamp", "platform": "Udemy", "url": "https://www.udemy.com/course/the-ultimate-mysql-bootcamp-go-from-sql-beginner-to-expert/"}
    ],
    "react": [
        {"title": "Front-End Web Development with React", "platform": "Coursera", "url": "https://www.coursera.org/learn/react"},
        {"title": "React - The Complete Guide (incl Hooks, React Router, Redux)", "platform": "Udemy", "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/"}
    ],
    "javascript": [
        {"title": "The Complete JavaScript Course 2026: From Zero to Expert!", "platform": "Udemy", "url": "https://www.udemy.com/course/the-complete-javascript-course-for-beginners/"}
    ],
    "typescript": [
        {"title": "Understanding TypeScript", "platform": "Udemy", "url": "https://www.udemy.com/course/understanding-typescript/"}
    ],
    "node.js": [
        {"title": "Node.js, Express, MongoDB & More: The Complete Bootcamp", "platform": "Udemy", "url": "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/"}
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
    "azure": [
        {"title": "Microsoft Azure Fundamentals AZ-900 Exam Prep", "platform": "Udemy", "url": "https://www.udemy.com/course/az900-azure/"}
    ],
    "gcp": [
        {"title": "Google Cloud Associate Cloud Engineer Course", "platform": "Udemy", "url": "https://www.udemy.com/course/google-cloud-associate-cloud-engineer-course/"}
    ],
    "git": [
        {"title": "Git & GitHub Complete Guide", "platform": "Udemy", "url": "https://www.udemy.com/course/git-github-practical-guide/"}
    ],
    "github": [
        {"title": "Git & GitHub Complete Guide", "platform": "Udemy", "url": "https://www.udemy.com/course/git-github-practical-guide/"}
    ],
    "tailwind css": [
        {"title": "Tailwind CSS From Scratch with Projects", "platform": "Udemy", "url": "https://www.udemy.com/course/tailwind-from-scratch/"}
    ],
    "machine learning": [
        {"title": "Machine Learning Specialization by Andrew Ng", "platform": "Coursera", "url": "https://www.coursera.org/specializations/machine-learning-introduction"},
        {"title": "Python for Data Science and Machine Learning Bootcamp", "platform": "Udemy", "url": "https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/"}
    ],
    "deep learning": [
        {"title": "Deep Learning Specialization", "platform": "Coursera", "url": "https://www.coursera.org/specializations/deep-learning"}
    ],
    "pytorch": [
        {"title": "PyTorch for Deep Learning Bootcamp", "platform": "Udemy", "url": "https://www.udemy.com/course/pytorch-for-deep-learning-bootcamp/"}
    ],
    "tensorflow": [
        {"title": "TensorFlow Developer Certificate Bootcamp", "platform": "Udemy", "url": "https://www.udemy.com/course/tensorflow-developer-certificate-bootcamp/"}
    ],
    "fastapi": [
        {"title": "FastAPI - The Complete Course", "platform": "Udemy", "url": "https://www.udemy.com/course/fastapi-the-complete-course/"}
    ],
    "django": [
        {"title": "Python Django - The Practical Guide", "platform": "Udemy", "url": "https://www.udemy.com/course/django-python/"}
    ],
    "project management": [
        {"title": "Google Project Management Professional Certificate", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/google-project-management"}
    ]
}

DEFAULT_COURSES = [
    {"title": "Career Success Specialization", "platform": "Coursera", "url": "https://www.coursera.org/specializations/career-success"},
    {"title": "Technical Writing & Interviewing Skills", "platform": "Udemy", "url": "https://www.udemy.com/"}
]

def analyze_gap(candidate_skills: str, job_required_skills: str, job_description: str) -> Dict[str, Any]:
    """
    Compares candidate skills against job required skills.
    Detects gaps, maps suggested online courses, and creates readiness tips.
    """
    # Parse candidate skills
    cand_set = {s.strip().lower() for s in candidate_skills.split(",") if s.strip()}
    
    # Parse job required skills
    job_req_set = {s.strip().lower() for s in job_required_skills.split(",") if s.strip()}
    
    # Find matching and missing skills
    matching_skills = cand_set.intersection(job_req_set)
    missing_skills = job_req_set - cand_set
    
    # Soft check for matches in job description text that aren't in required list
    # E.g. If job description mentions Kubernetes, Docker, Linux etc.
    potential_implicit_skills = []
    desc_lower = job_description.lower()
    
    for skill_name in SKILL_COURSES_DB.keys():
        if skill_name not in job_req_set and skill_name not in cand_set:
            # Word boundary check
            import re
            pattern = r'\b' + re.escape(skill_name) + r'\b'
            if re.search(pattern, desc_lower):
                potential_implicit_skills.append(skill_name)
    
    # Capitalize matched skills based on our DB keys or title case
    def clean_skill_name(s: str) -> str:
        # map to tidy cases
        tidy = {
            "python": "Python", "sql": "SQL", "postgresql": "PostgreSQL",
            "mysql": "MySQL", "react": "React", "javascript": "JavaScript",
            "typescript": "TypeScript", "node.js": "Node.js", "docker": "Docker",
            "kubernetes": "Kubernetes", "aws": "AWS", "azure": "Azure",
            "gcp": "GCP", "git": "Git", "github": "GitHub", "tailwind css": "Tailwind CSS",
            "machine learning": "Machine Learning", "deep learning": "Deep Learning",
            "pytorch": "PyTorch", "tensorflow": "TensorFlow", "fastapi": "FastAPI",
            "django": "Django", "project management": "Project Management"
        }
        return tidy.get(s, s.title())

    matching_clean = [clean_skill_name(s) for s in matching_skills]
    missing_clean = [clean_skill_name(s) for s in missing_skills]
    implicit_clean = [clean_skill_name(s) for s in potential_implicit_skills]
    
    # Get suggested courses
    suggested_courses = []
    seen_courses = set()
    
    # First get courses for explicitly missing skills
    for skill in missing_skills:
        courses = SKILL_COURSES_DB.get(skill, [])
        for c in courses:
            if c["title"] not in seen_courses:
                suggested_courses.append(c)
                seen_courses.add(c["title"])
                
    # Next get courses for implicit description skills
    for skill in potential_implicit_skills:
        courses = SKILL_COURSES_DB.get(skill, [])
        for c in courses:
            if c["title"] not in seen_courses:
                suggested_courses.append(c)
                seen_courses.add(c["title"])
                
    # Fallback to general career success course if nothing found
    if not suggested_courses:
        suggested_courses = DEFAULT_COURSES
        
    # Calculate Readiness Level
    total_req = len(job_req_set)
    if total_req == 0:
        readiness_score = 100.0
    else:
        readiness_score = (len(matching_skills) / total_req) * 100
        
    if readiness_score >= 85:
        readiness_level = "Ready (Highly Matched)"
    elif readiness_score >= 60:
        readiness_level = "Almost Ready (Few Gaps)"
    elif readiness_score >= 30:
        readiness_level = "Needs Development"
    else:
        readiness_level = "Significant Gap"
        
    # Actionable Improvement Roadmaps/Tips
    improvement_tips = []
    if missing_skills:
        major_missing = list(missing_clean)[:2]
        improvement_tips.append(
            f"Prioritize building a basic project using {' and '.join(major_missing)} to prove hands-on familiarity on your resume."
        )
    else:
        improvement_tips.append(
            "You match all core skill criteria! Highlight achievements using these skills in your experience descriptions."
        )
        
    if implicit_clean:
        improvement_tips.append(
            f"The job description hints at {', '.join(implicit_clean[:2])}. Mentioning these could give you a competitive edge."
        )
        
    improvement_tips.append(
        "Try updating your Jobify profile skills list with any new certifications or project experience you have acquired."
    )
    
    return {
        "matching_skills": matching_clean,
        "missing_skills": missing_clean,
        "implicit_skills": implicit_clean,
        "suggested_courses": suggested_courses,
        "readiness_level": readiness_level,
        "readiness_score": round(readiness_score, 1),
        "improvement_tips": improvement_tips
    }

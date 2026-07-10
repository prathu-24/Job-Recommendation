from app.services.matcher import (
    calculate_skill_match,
    calculate_experience_match,
    calculate_education_match,
    calculate_keyword_similarity
)

def test_calculate_skill_match():
    candidate_skills = "Python, JavaScript, SQL, React"
    job_skills = "Python, SQL, Docker"
    
    score = calculate_skill_match(candidate_skills, job_skills)
    # Python, SQL match out of Python, SQL, Docker (2/3 matches = ~66.67%)
    assert 60.0 < score < 70.0

def test_calculate_experience_match():
    # Job requires 3 years
    # 1. Candidate has "5 years of experience in coding..."
    score_1 = calculate_experience_match("5 years of experience in coding...", 3)
    assert score_1 == 100.0
    
    # 2. Candidate has "1 year of experience"
    score_2 = calculate_experience_match("1 year of experience", 3)
    assert score_2 == (1.0 / 3.0) * 100.0

def test_calculate_education_match():
    # Job description requires Master's
    job_desc = "We are seeking a senior software engineer with a Master's degree in Computer Science."
    
    # Candidate profile has Bachelor's degree
    score_1 = calculate_education_match("Bachelor of Science in CS", job_desc)
    assert score_1 == (3 / 4) * 100.0 # 75%
    
    # Candidate profile has PhD
    score_2 = calculate_education_match("PhD in Machine Learning", job_desc)
    assert score_2 == 100.0

def test_calculate_keyword_similarity():
    cand_text = "I am a frontend developer specialized in React, HTML, CSS, JavaScript."
    job_text = "Looking for a React developer with knowledge of JavaScript and CSS."
    
    # Cosine similarity should be high
    score = calculate_keyword_similarity(cand_text, job_text)
    assert score > 30.0 # significant similarity score

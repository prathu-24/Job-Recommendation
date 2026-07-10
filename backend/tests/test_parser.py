from app.services.parser import clean_text, parse_email, parse_phone, extract_skills, parse_name

def test_clean_text():
    raw = "Hello   World! \x00 This is a \n clean text."
    cleaned = clean_text(raw)
    assert "  " not in cleaned
    assert "\x00" not in cleaned
    assert cleaned.startswith("Hello World!")

def test_parse_email():
    text = "Candidate Name\nEmail: test.candidate@example.com\nPhone: 123-456-7890"
    email = parse_email(text)
    assert email == "test.candidate@example.com"

def test_parse_phone():
    text = "Candidate Name\nEmail: test.candidate@example.com\nPhone: (123) 456-7890"
    phone = parse_phone(text)
    assert phone == "(123) 456-7890"

def test_parse_name():
    text = "John Doe\nSoftware Engineer\nEmail: john@gmail.com\nPhone: 555-555-5555"
    name = parse_name(text, "john@gmail.com", "555-555-5555")
    assert name == "John Doe"

def test_extract_skills():
    text = "Proficient in Python, Javascript, React, SQL, and Docker. Familiar with TensorFlow."
    skills = extract_skills(text)
    # Check that Python, JavaScript, React, SQL, Docker are extracted
    assert "Python" in skills
    assert "JavaScript" in skills
    assert "React" in skills
    assert "SQL" in skills
    assert "Docker" in skills

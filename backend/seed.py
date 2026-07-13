import os
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.candidate import CandidateProfile
from app.core import security

def seed_database():
    print("Connecting to database to seed sample data...")
    db = SessionLocal()
    try:
        # Check if database is already seeded
        existing_user = db.query(User).filter(User.email == "candidate@example.com").first()
        if existing_user:
            from app.models.application import Application
            existing_app = db.query(Application).first()
            if not existing_app:
                print("Seeding sample application for existing user...")
                cand_profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == existing_user.id).first()
                job = db.query(Job).first()
                if cand_profile and job:
                    sample_app = Application(
                        candidate_id=cand_profile.id,
                        job_id=job.id,
                        application_status="applied"
                    )
                    db.add(sample_app)
                    db.commit()
                    print("Sample application seeded successfully!")
                else:
                    print("Could not seed application: profile or job not found.")
            else:
                print("Database already contains seed data. Skipping seeding.")
            return

        # 1. Create Sample Users
        print("Creating sample users...")
        candidate_pwd = security.get_password_hash("password123")
        recruiter_pwd = security.get_password_hash("password123")
        admin_pwd = security.get_password_hash("password123")
        
        cand = db.query(User).filter(User.email == "candidate@example.com").first()
        if not cand:
            cand = User(
                name="John Doe",
                email="candidate@example.com",
                password=candidate_pwd,
                role=UserRole.CANDIDATE
            )
            db.add(cand)
            db.commit()
            db.refresh(cand)

        rec = db.query(User).filter(User.email == "recruiter@example.com").first()
        if not rec:
            rec = User(
                name="Alice Smith",
                email="recruiter@example.com",
                password=recruiter_pwd,
                role=UserRole.RECRUITER
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)

        adm = db.query(User).filter(User.email == "admin@jobify.com").first()
        if not adm:
            adm = User(
                name="Super Admin",
                email="admin@jobify.com",
                password=admin_pwd,
                role=UserRole.ADMIN
            )
            db.add(adm)
            db.commit()
            db.refresh(adm)

        # Create Profile for John Doe
        cand_profile = CandidateProfile(
            user_id=cand.id,
            skills="Python, SQL, React, JavaScript, Git",
            experience="2 years as Junior Software Developer at startup.",
            education="Bachelor of Science in Computer Science, University of Washington",
            phone="123-456-7890",
            email_extracted="john.doe@gmail.com",
            name_extracted="John Doe",
            projects="Built a personal portfolio website in React. Created a web scraper in Python.",
            certifications="AWS Certified Cloud Practitioner",
            languages="English, Spanish"
        )
        db.add(cand_profile)
        db.commit()

        # 2. Create Sample Jobs
        print("Creating sample jobs...")
        jobs = [
            Job(
                company="Google",
                title="Software Engineer - Python/SQL",
                description="We are seeking a Software Engineer to work on our backend data pipelines. You will write clean Python scripts and query structured databases.",
                required_skills="Python, SQL, Docker, Linux",
                location="Mountain View, CA",
                salary="$140,000 - $180,000",
                experience_required=3
            ),
            Job(
                company="Meta",
                title="Frontend React Developer",
                description="Looking for an expert Frontend Developer specialized in React.js, JavaScript, and Tailwind CSS to build high performance web interfaces.",
                required_skills="React, JavaScript, Tailwind CSS, HTML, CSS",
                location="Menlo Park, CA (Hybrid)",
                salary="$130,000 - $160,000",
                experience_required=2
            ),
            Job(
                company="OpenAI",
                title="Machine Learning Engineer",
                description="Help us develop large scale language models. Required strong math foundation and deep knowledge of PyTorch/TensorFlow.",
                required_skills="Python, PyTorch, TensorFlow, Machine Learning, Git",
                location="San Francisco, CA",
                salary="$180,000 - $240,000",
                experience_required=4
            ),
            Job(
                company="Microsoft",
                title="Full Stack Developer",
                description="Develop end-to-end cloud platforms. Experience with backend SQL databases and frontend TypeScript frameworks is needed.",
                required_skills="TypeScript, React, Node.js, SQL, Azure",
                location="Redmond, WA",
                salary="$150,000 - $190,000",
                experience_required=3
            )
        ]
        
        db.add_all(jobs)
        db.commit()

        # 3. Trigger Recommendations for John Doe
        print("Calculating initial recommendations...")
        from app.services.matcher import generate_recommendations_for_candidate
        generate_recommendations_for_candidate(db, cand_profile.id)
        
        # 4. Create Sample Application
        print("Creating sample job application...")
        from app.models.application import Application
        sample_app = Application(
            candidate_id=cand_profile.id,
            job_id=jobs[0].id,
            application_status="applied"
        )
        db.add(sample_app)
        db.commit()
        
        print("Seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error during database seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

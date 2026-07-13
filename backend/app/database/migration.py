import psycopg2
import sqlite3
from app.core.config import settings
from app.database.session import PGVECTOR_SUPPORTED, clean_db_url

def run_migrations():
    """
    Run migrations to ensure the 'embedding' column exists in both
    'jobs' and 'candidate_profiles' tables.
    """
    db_url = settings.DATABASE_URL
    print(f"[Migration] Checking database schema on {db_url}")

    if db_url.startswith("sqlite"):
        try:
            # SQLite path is e.g. sqlite:///./job_recommendation.db
            db_path = db_url.replace("sqlite:///", "")
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check jobs table
            cursor.execute("PRAGMA table_info(jobs);")
            columns = [col[1] for col in cursor.fetchall()]
            if 'embedding' not in columns:
                cursor.execute("ALTER TABLE jobs ADD COLUMN embedding TEXT;")
                print("[Migration] Added 'embedding' column to SQLite 'jobs' table.")
            else:
                print("[Migration] 'embedding' column already exists in SQLite 'jobs' table.")
                
            # Check candidate_profiles table
            cursor.execute("PRAGMA table_info(candidate_profiles);")
            columns = [col[1] for col in cursor.fetchall()]
            if 'embedding' not in columns:
                cursor.execute("ALTER TABLE candidate_profiles ADD COLUMN embedding TEXT;")
                print("[Migration] Added 'embedding' column to SQLite 'candidate_profiles' table.")
            else:
                print("[Migration] 'embedding' column already exists in SQLite 'candidate_profiles' table.")
                
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[Migration] SQLite migration failed: {e}")
            
    elif db_url.startswith("postgresql") or db_url.startswith("postgres://"):
        try:
            dsn = clean_db_url(db_url)
            conn = psycopg2.connect(dsn)
            cursor = conn.cursor()
            
            # Determine correct PostgreSQL column type
            if PGVECTOR_SUPPORTED:
                col_type = "vector(384)"
                print("[Migration] pgvector is supported. Using type 'vector(384)'.")
            else:
                col_type = "real[]"
                print("[Migration] pgvector is NOT supported. Using fallback type 'real[]'.")
                
            # 1. Migrate jobs table
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='jobs' AND column_name='embedding';
            """)
            if not cursor.fetchone():
                cursor.execute(f"ALTER TABLE jobs ADD COLUMN embedding {col_type};")
                print(f"[Migration] Added 'embedding' column ({col_type}) to PostgreSQL 'jobs' table.")
            else:
                print("[Migration] 'embedding' column already exists in PostgreSQL 'jobs' table.")
                
            # 2. Migrate candidate_profiles table
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='candidate_profiles' AND column_name='embedding';
            """)
            if not cursor.fetchone():
                cursor.execute(f"ALTER TABLE candidate_profiles ADD COLUMN embedding {col_type};")
                print(f"[Migration] Added 'embedding' column ({col_type}) to PostgreSQL 'candidate_profiles' table.")
            else:
                print("[Migration] 'embedding' column already exists in PostgreSQL 'candidate_profiles' table.")
                
            conn.commit()
            conn.close()
            print("[Migration] PostgreSQL schema migration completed successfully.")
        except Exception as e:
            print(f"[Migration] PostgreSQL migration failed: {e}")
            raise e
            
    else:
        print(f"[Migration] Unsupported database engine in URL: {db_url}")

if __name__ == "__main__":
    run_migrations()

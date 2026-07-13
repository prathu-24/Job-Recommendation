from sqlalchemy import create_engine, Text, Float
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator
from app.core.config import settings
import psycopg2

# Adjust sqlite settings if using SQLite
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

from urllib.parse import urlsplit, parse_qsl, urlencode, urlunsplit

def clean_db_url(url: str) -> str:
    """Normalize URL scheme and remove unsupported query parameters like 'supa'."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    try:
        parts = urlsplit(url)
        if parts.query:
            # Keep only standard/supported parameters
            allowed_params = {
                'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'connect_timeout',
                'application_name', 'keepalives', 'keepalives_idle'
            }
            filtered_query = [
                (k, v) for k, v in parse_qsl(parts.query)
                if k.lower() in allowed_params
            ]
            parts = parts._replace(query=urlencode(filtered_query))
            return urlunsplit(parts)
    except Exception:
        pass
    return url

db_url = clean_db_url(settings.DATABASE_URL)

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def check_pgvector():
    if not settings.DATABASE_URL.startswith("postgresql") and not settings.DATABASE_URL.startswith("postgres"):
        return False
    try:
        dsn = clean_db_url(settings.DATABASE_URL)
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        try:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            conn.commit()
            print("[Database] pgvector extension successfully verified/created.")
            supported = True
        except Exception as ext_err:
            conn.rollback()
            print(f"[Database] pgvector extension not available on this server: {ext_err}. Using ARRAY(Float) fallback.")
            supported = False
        conn.close()
        return supported
    except Exception as conn_err:
        print(f"[Database] Could not connect to PostgreSQL to check pgvector: {conn_err}. Using fallback.")
        return False

PGVECTOR_SUPPORTED = check_pgvector()

def get_vector_type(dim: int):
    if settings.DATABASE_URL.startswith("sqlite"):
        return Text
    elif PGVECTOR_SUPPORTED:
        try:
            from pgvector.sqlalchemy import Vector
            return Vector(dim)
        except ImportError:
            from sqlalchemy.dialects.postgresql import ARRAY
            return ARRAY(Float)
    else:
        from sqlalchemy.dialects.postgresql import ARRAY
        return ARRAY(Float)

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

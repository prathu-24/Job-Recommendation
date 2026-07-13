from sqlalchemy import create_engine, Text, Float
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.dialects.postgresql import ARRAY
from typing import Generator
from app.core.config import settings
import psycopg2

# SQLite support
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# SQLAlchemy Engine
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)

# Session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class
Base = declarative_base()


def check_pgvector():
    """Check whether pgvector extension exists."""
    if not settings.DATABASE_URL.startswith("postgresql"):
        return False

    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        cur = conn.cursor()

        try:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            conn.commit()
            print("[Database] pgvector enabled.")
            supported = True
        except Exception as e:
            conn.rollback()
            print(f"[Database] pgvector unavailable: {e}")
            supported = False

        cur.close()
        conn.close()
        return supported

    except Exception as e:
        print(f"[Database] Connection failed: {e}")
        return False


PGVECTOR_SUPPORTED = check_pgvector()


def get_vector_type(dim: int):
    if settings.DATABASE_URL.startswith("sqlite"):
        return Text

    if PGVECTOR_SUPPORTED:
        try:
            from pgvector.sqlalchemy import Vector
            return Vector(dim)
        except ImportError:
            return ARRAY(Float)

    return ARRAY(Float)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
from sqlalchemy import create_engine, Text, Float
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator
from app.core.config import settings
import psycopg2

# Adjust sqlite settings if using SQLite
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def check_pgvector():
    if not settings.DATABASE_URL.startswith("postgresql"):
        return False
    try:
        dsn = settings.DATABASE_URL
        if dsn.startswith("postgres://"):
            dsn = dsn.replace("postgres://", "postgresql://", 1)
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

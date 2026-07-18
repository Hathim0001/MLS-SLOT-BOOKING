import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./slot_booking.db")

# Normalise postgres:// -> postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    # For PostgreSQL (including Supabase pooler on Vercel):
    # - Strip sslmode from the URL so psycopg2 doesn't get confused
    # - Pass SSL requirement via connect_args instead
    # - Use NullPool: serverless functions must not hold persistent connections
    import re
    clean_url = re.sub(r"[?&]sslmode=[^&]*", "", DATABASE_URL)
    clean_url = re.sub(r"\?$", "", clean_url)  # remove trailing ? if nothing left
    engine = create_engine(
        clean_url,
        connect_args={"sslmode": "require"},
        poolclass=NullPool,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()



import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zoom_clone.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    import models  # noqa: F401 — ensure all ORM tables are registered
    Base.metadata.create_all(bind=engine)
    # Ensure indexes are created on existing database and clean up future start_times for ended/live meetings
    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_meetings_start_time ON meetings (start_time DESC)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_meetings_status ON meetings (status)"))
            # Correct any ended or live meetings where start_time is in the future
            conn.execute(text("UPDATE meetings SET start_time = updated_at WHERE status = 'ended' AND start_time > updated_at"))
            conn.execute(text("UPDATE meetings SET start_time = updated_at WHERE status = 'live' AND start_time > updated_at"))
            conn.commit()
        except Exception:
            pass

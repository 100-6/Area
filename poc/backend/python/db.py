from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from typing import Generator

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_session() -> Generator[SessionLocal, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally: 
        session.close()

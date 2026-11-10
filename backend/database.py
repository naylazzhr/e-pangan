import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Memuat konfigurasi dari file .env (jalur absolut ke folder backend)
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

# URL Koneksi Database (Default ke SQLite lokal jika tidak disetel)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./epangan.db")

# Pengaturan engine khusus jika menggunakan SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency untuk mendapatkan instance database di setiap request FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

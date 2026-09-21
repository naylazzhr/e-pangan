from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class Komoditas(Base):
    __tablename__ = "komoditas"

    id = Column(Integer, primary_key=True, index=True)
    nama_bahan = Column(String(100), nullable=False)
    kategori = Column(String(50), nullable=True)  # contoh: Sembako, Sayur, Daging
    harga = Column(Float, nullable=False)
    satuan = Column(String(20), default="kg")
    lokasi = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
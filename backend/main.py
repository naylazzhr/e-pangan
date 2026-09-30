from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware

# Membuat tabel otomatis jika belum ada
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="E-Pangan API",
    description="API Pemantauan Harga Komoditas Pangan",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Mengizinkan semua origin/frontend mengakses API
    allow_credentials=True,
    allow_methods=["*"],  # Mengizinkan semua method (GET, POST, PUT, DELETE)
    allow_headers=["*"],
)

# --- PYDANTIC SCHEMAS ---
class KomoditasCreate(BaseModel):
    nama_bahan: str
    kategori: Optional[str] = None
    harga: float
    satuan: str = "kg"
    lokasi: Optional[str] = None

class KomoditasUpdate(BaseModel):
    nama_bahan: Optional[str] = None
    kategori: Optional[str] = None
    harga: Optional[float] = None
    satuan: Optional[str] = None
    lokasi: Optional[str] = None


# --- ENDPOINTS ---

@app.get("/", tags=["Root"])
def root():
    return {"message": "API E-Pangan Berhasil Berjalan!"}

# 1. READ ALL (dengan fitur Pencarian Nama & Filter Kategori)
@app.get("/komoditas", tags=["Komoditas"])
def get_semua_komoditas(
    search: Optional[str] = Query(None, description="Cari nama komoditas, misal: Beras"),
    kategori: Optional[str] = Query(None, description="Filter kategori, misal: Sembako"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Komoditas)
    
    if search:
        query = query.filter(models.Komoditas.nama_bahan.ilike(f"%{search}%"))
    if kategori:
        query = query.filter(models.Komoditas.kategori == kategori)
        
    data = query.all()
    return {"status": "success", "total_data": len(data), "data": data}

# 2. READ ONE (Ambil detail komoditas berdasarkan ID)
@app.get("/komoditas/{id_komoditas}", tags=["Komoditas"])
def get_komoditas_by_id(id_komoditas: int, db: Session = Depends(get_db)):
    data = db.query(models.Komoditas).filter(models.Komoditas.id == id_komoditas).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data komoditas tidak ditemukan")
    return {"status": "success", "data": data}

# 3. CREATE (Tambah Komoditas Baru)
@app.post("/komoditas", tags=["Komoditas"])
def tambah_komoditas(item: KomoditasCreate, db: Session = Depends(get_db)):
    data_baru = models.Komoditas(**item.model_dump())
    db.add(data_baru)
    db.commit()
    db.refresh(data_baru)
    return {"status": "success", "message": "Data berhasil ditambahkan!", "data": data_baru}

# 4. UPDATE (Perbarui Data Komoditas berdasarkan ID)
@app.put("/komoditas/{id_komoditas}", tags=["Komoditas"])
def update_komoditas(id_komoditas: int, item: KomoditasUpdate, db: Session = Depends(get_db)):
    data = db.query(models.Komoditas).filter(models.Komoditas.id == id_komoditas).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data komoditas tidak ditemukan")
    
    # Update field yang diisi saja (ignore None)
    update_data = item.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(data, key, value)
        
    db.commit()
    db.refresh(data)
    return {"status": "success", "message": "Data berhasil diperbarui!", "data": data}

# 5. DELETE (Hapus Data Komoditas berdasarkan ID)
@app.delete("/komoditas/{id_komoditas}", tags=["Komoditas"])
def hapus_komoditas(id_komoditas: int, db: Session = Depends(get_db)):
    data = db.query(models.Komoditas).filter(models.Komoditas.id == id_komoditas).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data komoditas tidak ditemukan")
    
    db.delete(data)
    db.commit()
    return {"status": "success", "message": f"Data komoditas ID {id_komoditas} berhasil dihapus"}
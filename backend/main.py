import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import models
from database import engine

# Import modular routers
from routers import (
    auth,
    kios,
    search,
    pasar,
    budgeting,
    admin,
    nlp,
    satgas
)

# Membuat tabel otomatis di database jika belum ada
models.Base.metadata.create_all(bind=engine)

# Inisialisasi data awal (seeding) otomatis jika database masih kosong (misal di Vercel / server baru)
try:
    from database import SessionLocal
    with SessionLocal() as _db_init:
        _komoditas_count = _db_init.query(models.Komoditas).count()
        _pasar_count = _db_init.query(models.Pasar).count()
        if _komoditas_count == 0 or _pasar_count == 0:
            import epangan_db
            epangan_db.init_db()
except Exception as _e_init:
    print(f"[AUTO-SEED NOTICE] {_e_init}")

# Inisialisasi FastAPI Aplikasi
app = FastAPI(
    title="E-Pangan API Kabupaten Lamongan",
    description="Portal Khusus Petugas Lapangan, Enumerator, dan Operator Pasar DKPP Kabupaten Lamongan",
    version="2.0.0"
)

# Konfigurasi CORS agar frontend (React/Vite) dapat mengakses API secara aman
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Direktori Upload untuk Foto Komoditas & Asset Dinamis
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
KOMODITAS_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "komoditas")
os.makedirs(KOMODITAS_UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="api_uploads")


# ==============================================================================
# ROOT ENDPOINT
# ==============================================================================

@app.get("/", tags=["Root"])
@app.get("/api", tags=["Root"])
def root():
    return {
        "status": "success",
        "system": "E-Pangan Kabupaten Lamongan API v2.0",
        "module": "Portal Khusus Petugas Lapangan & Operator Pasar",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }


# ==============================================================================
# PENDAFTARAN MODULAR ROUTERS
# ==============================================================================

routers = [
    auth.router,        # [6, 7] Login Admin & Akses Portal Admin
    kios.router,        # [1, 5] Dashboard User/Penjual & Detail Kios
    search.router,      # [2] Cari Harga (Smart Search)
    pasar.router,       # [3] Perbandingan Antar Pasar
    budgeting.router,   # [4] Smart Budgeting
    admin.router,       # [8, 12] Dashboard Admin & Manajemen Kios
    nlp.router,         # [9] Input Suara (Voice Upload NLP)
    satgas.router,      # [10, 11] Validasi Lapangan & Laporan Satgas
]

for r in routers:
    app.include_router(r)
    app.include_router(r, prefix="/api")


# ==============================================================================
# ENTRY POINT
# ==============================================================================

if __name__ == "__main__":
    import uvicorn
    print("Memulai server E-Pangan API Kabupaten Lamongan...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
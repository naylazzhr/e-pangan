from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# ROOT ENDPOINT
# ==============================================================================

@app.get("/", tags=["Root"])
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

app.include_router(auth.router)        # [6, 7] Login Admin & Akses Portal Admin
app.include_router(kios.router)        # [1, 5] Dashboard User/Penjual & Detail Kios
app.include_router(search.router)      # [2] Cari Harga (Smart Search)
app.include_router(pasar.router)       # [3] Perbandingan Antar Pasar
app.include_router(budgeting.router)   # [4] Smart Budgeting
app.include_router(admin.router)       # [8, 12] Dashboard Admin & Manajemen Kios
app.include_router(nlp.router)         # [9] Input Suara (Voice Upload NLP)
app.include_router(satgas.router)      # [10, 11] Validasi Lapangan & Laporan Satgas


# ==============================================================================
# ENTRY POINT
# ==============================================================================

if __name__ == "__main__":
    import uvicorn
    print("Memulai server E-Pangan API Kabupaten Lamongan...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
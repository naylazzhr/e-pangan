from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
from database import get_db
from schemas import SurveiHargaCreate, SurveiHargaUpdate
from routers.auth import get_admin_sekarang

router = APIRouter(tags=["Survei Harga Harian & Satgas"])


# ==============================================================================
# ENDPOINT SURVEI HARGA HARIAN & VALIDASI SATGAS
# ==============================================================================

@router.get("/survei-harga")
def get_semua_survei_harga(
    search: Optional[str] = Query(None, description="Cari nama komoditas atau kios atau pasar"),
    status_verifikasi: Optional[str] = Query(None, description="Filter status: 'Menunggu Cek' / 'Terverifikasi' / 'Pending Saja'"),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    """
    Mengambil data survei harga harian dengan filter pencarian dan status validasi satgas.
    """
    query = db.query(models.SurveiHarga)

    if search:
        query = query.filter(
            or_(
                models.SurveiHarga.nama_komoditas.ilike(f"%{search}%"),
                models.SurveiHarga.nama_kios.ilike(f"%{search}%"),
                models.SurveiHarga.lokasi_pasar.ilike(f"%{search}%"),
                models.SurveiHarga.kualitas_mutu.ilike(f"%{search}%")
            )
        )

    if status_verifikasi:
        if status_verifikasi.lower() in ["pending", "pending saja", "menunggu cek"]:
            query = query.filter(models.SurveiHarga.status_verifikasi == "Menunggu Cek")
        elif status_verifikasi.lower() in ["terverifikasi"]:
            query = query.filter(models.SurveiHarga.status_verifikasi == "Terverifikasi")

    total_records = query.count()
    items = query.order_by(models.SurveiHarga.id.asc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "status": "success",
        "total_data": total_records,
        "page": page,
        "limit": limit,
        "total_halaman": (total_records + limit - 1) // limit,
        "data": items
    }


@router.post("/survei-harga", status_code=status.HTTP_201_CREATED)
def tambah_survei_harga(
    item: SurveiHargaCreate,
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Input survei harga baru oleh Petugas/Satgas."""
    data_dict = item.model_dump()
    if not data_dict.get("waktu_survei"):
        data_dict["waktu_survei"] = datetime.now().strftime("%H:%M WIB")
    data_dict["petugas_nama"] = current_admin.nama_lengkap or current_admin.username

    baru = models.SurveiHarga(**data_dict)
    db.add(baru)
    db.commit()
    db.refresh(baru)
    return {
        "status": "success",
        "message": "Data survei harga komoditas berhasil ditambahkan!",
        "data": baru
    }


@router.put("/survei-harga/{id_survei}/validasi")
def validasi_survei_harga(
    id_survei: int,
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Verifikasi / validasi cepat data survei lapangan oleh Satgas DKPP."""
    data = db.query(models.SurveiHarga).filter(models.SurveiHarga.id == id_survei).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data survei tidak ditemukan")

    data.status_verifikasi = "Terverifikasi"
    data.catatan = f"Divalidasi oleh {current_admin.nama_lengkap or current_admin.username} pada {datetime.now().strftime('%H:%M WIB')}"
    db.commit()
    db.refresh(data)
    return {
        "status": "success",
        "message": f"Data '{data.nama_komoditas}' di {data.nama_kios} berhasil divalidasi!",
        "data": data
    }


@router.put("/survei-harga/{id_survei}")
def update_survei_harga(
    id_survei: int,
    item: SurveiHargaUpdate,
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Update data entri survei oleh enumerator/admin."""
    data = db.query(models.SurveiHarga).filter(models.SurveiHarga.id == id_survei).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data survei tidak ditemukan")

    for k, v in item.model_dump(exclude_unset=True).items():
        setattr(data, k, v)

    db.commit()
    db.refresh(data)
    return {
        "status": "success",
        "message": "Data survei berhasil diperbarui",
        "data": data
    }


@router.delete("/survei-harga/{id_survei}")
def hapus_survei_harga(
    id_survei: int,
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Hapus data entri survei lapangan."""
    data = db.query(models.SurveiHarga).filter(models.SurveiHarga.id == id_survei).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data survei tidak ditemukan")

    db.delete(data)
    db.commit()
    return {
        "status": "success",
        "message": f"Catatan survei ID {id_survei} ({data.nama_komoditas}) berhasil dihapus."
    }


@router.get("/survei-harga/ekspor")
def ekspor_laporan_harian(
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Ekspor laporan rekapitulasi harga pangan harian untuk Satgas DKPP."""
    records = db.query(models.SurveiHarga).all()
    return {
        "status": "success",
        "judul_laporan": "Laporan Rekapitulasi Survei Harga Pangan Harian Kabupaten Lamongan",
        "tanggal_cetak": datetime.now().strftime("%d %B %Y, %H:%M WIB"),
        "enumerator": current_admin.nama_lengkap or "Hendra Setiawan",
        "nip": current_admin.nip or "19850412 201001 1 014",
        "total_entri": len(records),
        "data": [
            {
                "komoditas": r.nama_komoditas,
                "kualitas": r.kualitas_mutu,
                "kios": r.nama_kios,
                "pasar": r.lokasi_pasar,
                "blok": r.blok_stan,
                "harga": r.harga,
                "satuan": r.satuan,
                "status_het": r.status_het,
                "waktu": r.waktu_survei,
                "metode": r.metode_input,
                "status": r.status_verifikasi
            }
            for r in records
        ]
    }

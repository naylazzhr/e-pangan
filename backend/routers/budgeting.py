from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from database import get_db
from schemas import BudgetingRequest

router = APIRouter(tags=["Smart Budgeting"])


# ==============================================================================
# ENDPOINT SMART BUDGETING
# ==============================================================================

@router.post("/smart-budgeting")
def kalkulasi_smart_budgeting(req: BudgetingRequest, db: Session = Depends(get_db)):
    """
    Fitur Smart Budgeting:
    Menghitung rekomendasi alokasi belanja optimal dari nominal budget yang diinputkan pengguna.
    """
    query = db.query(models.Komoditas)
    if req.lokasi_pasar:
        query = query.filter(models.Komoditas.lokasi.ilike(f"%{req.lokasi_pasar}%"))
    semua_komoditas = query.all()
    if not semua_komoditas:
        raise HTTPException(status_code=404, detail="Data komoditas pangan tidak ditemukan")

    komoditas_terurut = sorted(semua_komoditas, key=lambda x: x.harga)
    rekomendasi = []
    total = 0.0
    sisa = req.budget

    for item in komoditas_terurut:
        if item.harga <= sisa:
            rekomendasi.append({
                "id": item.id,
                "nama_bahan": item.nama_bahan,
                "kategori": item.kategori,
                "harga": item.harga,
                "satuan": item.satuan,
                "lokasi": item.lokasi
            })
            total += item.harga
            sisa -= item.harga

    return {
        "status": "success",
        "input_budget": req.budget,
        "total_belanja": total,
        "sisa_budget": sisa,
        "jumlah_item": len(rekomendasi),
        "rekomendasi_paket": rekomendasi
    }

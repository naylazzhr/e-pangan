from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import models
from database import get_db

router = APIRouter(tags=["Perbandingan Antar Pasar"])


# ==============================================================================
# ENDPOINT MASTER PASAR
# ==============================================================================

@router.get("/pasar")
def get_semua_pasar(db: Session = Depends(get_db)):
    """Daftar 5 Titik Wilayah Pantau Resmi Pasar Kabupaten Lamongan."""
    data = db.query(models.Pasar).all()
    return {"status": "success", "total_data": len(data), "data": data}


# ==============================================================================
# ENDPOINT PERBANDINGAN HARGA ANTAR PASAR
# ==============================================================================

@router.get("/cari-harga/perbandingan-pasar")
def perbandingan_harga_antar_pasar(
    komoditas: str = Query(..., description="Nama komoditas, misal: 'Beras Medium'"),
    varietas: Optional[str] = Query(None, description="Filter varietas tertentu"),
    db: Session = Depends(get_db)
):
    """
    Perbandingan Harga Antar Pasar:
    Digunakan untuk panel 'Sebaran Harga per Pasar' dan 'Buka Komparasi Pasar'.
    Mengembalikan harga rata-rata, terendah, tertinggi per pasar beserta jumlah kios pantau.
    """
    query = db.query(models.KiosHarga).filter(
        models.KiosHarga.nama_komoditas.ilike(f"%{komoditas}%")
    )
    if varietas:
        query = query.filter(models.KiosHarga.varietas.ilike(f"%{varietas}%"))

    semua = query.all()

    # Ambil dari survei_harga sebagai fallback
    survei = db.query(models.SurveiHarga).filter(
        models.SurveiHarga.nama_komoditas.ilike(f"%{komoditas}%")
    ).all()

    pasar_data: dict = {}

    for k in semua:
        p = k.nama_pasar
        if p not in pasar_data:
            pasar_data[p] = {"harga_list": [], "kios": [], "het": k.harga_het}
        pasar_data[p]["harga_list"].append(k.harga_terkini)
        pasar_data[p]["kios"].append({
            "id": k.id,
            "nama_kios": k.nama_kios,
            "harga": k.harga_terkini,
            "varietas": k.varietas,
            "is_binaan_dkpp": k.is_binaan_dkpp,
            "latitude": k.latitude,
            "longitude": k.longitude,
        })

    # Survei fallback jika KiosHarga belum memiliki data komoditas ini
    if not pasar_data:
        for s in survei:
            p = s.lokasi_pasar
            if p not in pasar_data:
                pasar_data[p] = {"harga_list": [], "kios": [], "het": None}
            pasar_data[p]["harga_list"].append(s.harga)
            pasar_data[p]["kios"].append({
                "id": s.id,
                "nama_kios": s.nama_kios,
                "harga": s.harga,
                "varietas": s.kualitas_mutu,
                "is_binaan_dkpp": False,
                "latitude": None,
                "longitude": None,
            })

    # HET referensi dari HETNasional
    het_ref_row = db.query(models.HETNasional).filter(
        models.HETNasional.nama_komoditas.ilike(f"%{komoditas}%"),
        models.HETNasional.is_aktif == True
    ).first()
    het_ref = het_ref_row.harga_het if het_ref_row else None

    hasil_pasar = []
    for nama_pasar, v in pasar_data.items():
        harga_list = v["harga_list"]
        avg = round(sum(harga_list) / len(harga_list), 0)
        min_h = min(harga_list)
        max_h = max(harga_list)
        het = het_ref or v.get("het")

        status_warna = "abu"
        if het:
            if avg <= het:
                status_warna = "hijau"
            elif avg <= het * 1.05:
                status_warna = "kuning"
            else:
                status_warna = "merah"

        hasil_pasar.append({
            "nama_pasar": nama_pasar,
            "harga_rata_rata": avg,
            "harga_terendah": min_h,
            "harga_tertinggi": max_h,
            "jumlah_kios_pantau": len(harga_list),
            "het_nasional": het,
            "status_warna": status_warna,
            "kios": v["kios"],
        })

    # Urutkan dari harga rata-rata termurah
    hasil_pasar.sort(key=lambda x: x["harga_rata_rata"])

    semua_harga = [h for p in hasil_pasar for h in [p["harga_terendah"]]]
    harga_global_terendah = min(semua_harga) if semua_harga else None
    harga_global_tertinggi = max(p["harga_tertinggi"] for p in hasil_pasar) if hasil_pasar else None

    return {
        "status": "success",
        "komoditas": komoditas,
        "varietas_filter": varietas,
        "het_nasional": het_ref,
        "het_sumber": het_ref_row.sumber if het_ref_row else None,
        "total_pasar": len(hasil_pasar),
        "harga_global_terendah": harga_global_terendah,
        "harga_global_tertinggi": harga_global_tertinggi,
        "perbandingan_pasar": hasil_pasar,
    }

import urllib.parse
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
from database import get_db
from schemas import (
    KiosCreate,
    KiosUpdate,
    KatalogKomoditasCreate,
    KatalogKomoditasUpdate
)

router = APIRouter(tags=["Kios"])


# ==============================================================================
# ENDPOINT DIREKTORI & DETAIL KIOS
# ==============================================================================

@router.get("/kios")
def get_semua_kios(
    lokasi: Optional[str] = Query(None, description="Filter lokasi pasar, misal: 'Pasar Babat'"),
    search: Optional[str] = Query(None, description="Cari nama kios atau pemilik"),
    db: Session = Depends(get_db)
):
    """
    Daftar Direktori Seluruh Kios Mitra Terdaftar di Pasar Lamongan:
    Menampilkan info kios, alamat lengkap terhubung ke pasar, jam operasional, dan jumlah komoditas di katalog.
    """
    query = db.query(models.Kios)
    if lokasi:
        query = query.filter(models.Kios.lokasi_pasar.ilike(f"%{lokasi}%"))
    if search:
        query = query.filter(
            or_(
                models.Kios.nama_kios.ilike(f"%{search}%"),
                models.Kios.pemilik.ilike(f"%{search}%")
            )
        )
    data = query.all()

    result = []
    for k in data:
        katalog_cnt = db.query(models.Komoditas).filter(models.Komoditas.kios_id == k.id).count()
        alamat = k.alamat_lengkap or f"{k.lokasi_pasar}, {k.blok_stan or 'Stan Pasar'}, Lamongan"
        result.append({
            "id": k.id,
            "nama_kios": k.nama_kios,
            "pemilik": k.pemilik or "Pedagang Binaan",
            "lokasi_pasar": k.lokasi_pasar,
            "blok": k.blok_stan,
            "blok_stan": k.blok_stan,
            "alamat_lengkap": alamat,
            "jam_buka": k.jam_buka or "06:00 - 16:30 WIB",
            "status_buka_sekarang": True if (k.jam_buka and k.is_active) else False,
            "no_telepon": k.no_telepon or "-",
            "status_izin": k.status_izin or "100% Berizin Pemkab",
            "total_katalog": katalog_cnt,
            "is_active": k.is_active
        })

    return {"status": "success", "total_data": len(result), "data": result}


@router.get("/kios/{kios_id}")
def get_detail_kios(
    kios_id: int = Path(..., title="ID Kios yang ingin dicari"),
    db: Session = Depends(get_db)
):
    """
    Mengambil data Detail Kios beserta Katalog Komoditas lengkap:
    - Profil kios (nama, pemilik, lokasi pasar, blok stan, no telepon, status izin)
    - Alamat kios lengkap (tersambung ke pasar di Lamongan)
    - Status buka sekarang & jam operasional
    - Katalog Komoditas: Nama komoditas, Harga satuan/kg, Status, Mutu, Stok fisik
    """
    kios = db.query(models.Kios).filter(models.Kios.id == kios_id).first()
    if not kios:
        raise HTTPException(status_code=404, detail="Data Kios tidak ditemukan")

    daftar_komoditas = db.query(models.Komoditas).filter(models.Komoditas.kios_id == kios_id).all()

    katalog_list = []
    for item in daftar_komoditas:
        katalog_list.append({
            "id_komoditas": item.id,
            "nama_bahan": item.nama_bahan,
            "varian_keterangan": item.varian_keterangan or item.kualitas_mutu or "Standar Pasar",
            "harga": item.harga,
            "satuan": item.satuan or "kg",
            "stok_fisik": item.stok_fisik or "Tersedia",
            "status_label": item.status_label or "Stabil",
            "kategori": item.kategori or "Kebutuhan Pokok"
        })

    pasar_obj = db.query(models.Pasar).filter(models.Pasar.nama_pasar == kios.lokasi_pasar).first()
    alamat = kios.alamat_lengkap
    if not alamat:
        if pasar_obj and pasar_obj.alamat:
            alamat = f"{kios.lokasi_pasar}, {pasar_obj.alamat}, {kios.blok_stan or 'Stan Pedagang'}"
        else:
            alamat = f"{kios.lokasi_pasar}, {kios.blok_stan or 'Stan Pasar'}, Lamongan"

    if pasar_obj and pasar_obj.latitude and pasar_obj.longitude:
        gmaps_url = f"https://www.google.com/maps/search/?api=1&query={pasar_obj.latitude},{pasar_obj.longitude}"
    else:
        gmaps_url = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(kios.lokasi_pasar + ' Lamongan')}"

    status_buka = True if (kios.jam_buka and kios.is_active) else False

    return {
        "status": "success",
        "id_kios": kios.id,
        "nama_kios": kios.nama_kios,
        "pemilik": kios.pemilik or "Pedagang Binaan",
        "lokasi_pasar": kios.lokasi_pasar,
        "blok": kios.blok_stan,
        "blok_stan": kios.blok_stan,
        "alamat_lengkap": alamat,
        "jam_buka": kios.jam_buka or "06:00 - 16:30 WIB",
        "status_buka_sekarang": status_buka,
        "no_telepon": kios.no_telepon or "-",
        "status_izin": kios.status_izin or "100% Berizin Pemkab",
        "jarak_km": 0.8,
        "google_maps_url": gmaps_url,
        "waktu_update_terakhir": (kios.updated_at or datetime.now()).strftime("Hari Ini, %H:%M WIB"),
        "total_komoditas": len(katalog_list),
        "katalog": katalog_list
    }


@router.put("/kios/{kios_id}")
def update_detail_kios(
    kios_id: int = Path(..., title="ID Kios yang ingin diperbarui"),
    data: KiosUpdate = ...,
    db: Session = Depends(get_db)
):
    """
    Update data profil Detail Kios (Nama Kios, Pemilik, Alamat Lengkap, Lokasi Pasar, Blok, Jam Buka, No Telepon).
    """
    kios = db.query(models.Kios).filter(models.Kios.id == kios_id).first()
    if not kios:
        raise HTTPException(status_code=404, detail="Data Kios tidak ditemukan")

    if data.nama_kios is not None:
        kios.nama_kios = data.nama_kios.strip()
    if data.pemilik is not None:
        kios.pemilik = data.pemilik.strip()
    if data.lokasi_pasar is not None:
        kios.lokasi_pasar = data.lokasi_pasar.strip()
    if data.blok_stan is not None:
        kios.blok_stan = data.blok_stan.strip()
    elif data.blok is not None:
        kios.blok_stan = data.blok.strip()
    if data.alamat_lengkap is not None:
        kios.alamat_lengkap = data.alamat_lengkap.strip()
    if data.jam_buka is not None:
        kios.jam_buka = data.jam_buka.strip()
    if data.no_telepon is not None:
        kios.no_telepon = data.no_telepon.strip()
    if data.status_izin is not None:
        kios.status_izin = data.status_izin.strip()
    if data.is_active is not None:
        kios.is_active = data.is_active

    kios.updated_at = datetime.now()
    db.commit()
    db.refresh(kios)

    return {
        "status": "success",
        "message": f"Data Kios '{kios.nama_kios}' berhasil diperbarui",
        "data": {
            "id": kios.id,
            "nama_kios": kios.nama_kios,
            "pemilik": kios.pemilik,
            "lokasi_pasar": kios.lokasi_pasar,
            "blok_stan": kios.blok_stan,
            "alamat_lengkap": kios.alamat_lengkap,
            "jam_buka": kios.jam_buka,
            "no_telepon": kios.no_telepon,
            "status_izin": kios.status_izin,
            "waktu_update": kios.updated_at.strftime("%d/%m/%Y %H:%M WIB")
        }
    }


# ==============================================================================
# ENDPOINT KATALOG KOMODITAS KIOS
# ==============================================================================

@router.post("/kios/{kios_id}/komoditas")
def tambah_komoditas_katalog(
    kios_id: int = Path(..., title="ID Kios tujuan"),
    item: KatalogKomoditasCreate = ...,
    db: Session = Depends(get_db)
):
    """Menambahkan komoditas baru ke Katalog Kios tertentu."""
    kios = db.query(models.Kios).filter(models.Kios.id == kios_id).first()
    if not kios:
        raise HTTPException(status_code=404, detail="Data Kios tidak ditemukan")

    new_komoditas = models.Komoditas(
        kios_id=kios_id,
        nama_bahan=item.nama_bahan.strip(),
        harga=item.harga,
        satuan=item.satuan.strip() if item.satuan else "kg",
        status_label=item.status_label.strip() if item.status_label else "Stabil",
        varian_keterangan=item.varian_keterangan.strip() if item.varian_keterangan else "-",
        stok_fisik=item.stok_fisik.strip() if item.stok_fisik else "Tersedia",
        kategori=item.kategori.strip() if item.kategori else "Kebutuhan Pokok",
        lokasi=kios.lokasi_pasar,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db.add(new_komoditas)
    kios.updated_at = datetime.now()
    db.commit()
    db.refresh(new_komoditas)

    return {
        "status": "success",
        "message": f"Komoditas '{new_komoditas.nama_bahan}' berhasil ditambahkan ke Katalog {kios.nama_kios}",
        "data": {
            "id_komoditas": new_komoditas.id,
            "kios_id": new_komoditas.kios_id,
            "nama_bahan": new_komoditas.nama_bahan,
            "harga": new_komoditas.harga,
            "satuan": new_komoditas.satuan,
            "status_label": new_komoditas.status_label,
            "varian_keterangan": new_komoditas.varian_keterangan,
            "stok_fisik": new_komoditas.stok_fisik,
            "kategori": new_komoditas.kategori
        }
    }


@router.put("/kios/{kios_id}/komoditas/{komoditas_id}")
def update_komoditas_katalog(
    kios_id: int = Path(..., title="ID Kios"),
    komoditas_id: int = Path(..., title="ID Komoditas yang akan diupdate"),
    item: KatalogKomoditasUpdate = ...,
    db: Session = Depends(get_db)
):
    """Update data komoditas dalam Katalog Kios."""
    kios = db.query(models.Kios).filter(models.Kios.id == kios_id).first()
    if not kios:
        raise HTTPException(status_code=404, detail="Data Kios tidak ditemukan")

    komoditas = db.query(models.Komoditas).filter(
        models.Komoditas.id == komoditas_id,
        models.Komoditas.kios_id == kios_id
    ).first()

    if not komoditas:
        raise HTTPException(status_code=404, detail="Komoditas tidak ditemukan di katalog Kios ini")

    if item.nama_bahan is not None:
        komoditas.nama_bahan = item.nama_bahan.strip()
    if item.harga is not None:
        komoditas.harga = item.harga
    if item.satuan is not None:
        komoditas.satuan = item.satuan.strip()
    if item.status_label is not None:
        komoditas.status_label = item.status_label.strip()
    if item.varian_keterangan is not None:
        komoditas.varian_keterangan = item.varian_keterangan.strip()
    if item.stok_fisik is not None:
        komoditas.stok_fisik = item.stok_fisik.strip()
    if item.kategori is not None:
        komoditas.kategori = item.kategori.strip()

    komoditas.updated_at = datetime.now()
    kios.updated_at = datetime.now()
    db.commit()
    db.refresh(komoditas)

    return {
        "status": "success",
        "message": f"Komoditas '{komoditas.nama_bahan}' di Katalog {kios.nama_kios} berhasil diperbarui",
        "data": {
            "id_komoditas": komoditas.id,
            "kios_id": komoditas.kios_id,
            "nama_bahan": komoditas.nama_bahan,
            "harga": komoditas.harga,
            "satuan": komoditas.satuan,
            "status_label": komoditas.status_label,
            "varian_keterangan": komoditas.varian_keterangan,
            "stok_fisik": komoditas.stok_fisik,
            "kategori": komoditas.kategori
        }
    }


@router.delete("/kios/{kios_id}/komoditas/{komoditas_id}")
def hapus_komoditas_katalog(
    kios_id: int = Path(..., title="ID Kios"),
    komoditas_id: int = Path(..., title="ID Komoditas yang akan dihapus"),
    db: Session = Depends(get_db)
):
    """Menghapus komoditas dari Katalog Kios tertentu."""
    kios = db.query(models.Kios).filter(models.Kios.id == kios_id).first()
    if not kios:
        raise HTTPException(status_code=404, detail="Data Kios tidak ditemukan")

    komoditas = db.query(models.Komoditas).filter(
        models.Komoditas.id == komoditas_id,
        models.Komoditas.kios_id == kios_id
    ).first()

    if not komoditas:
        raise HTTPException(status_code=404, detail="Komoditas tidak ditemukan di katalog Kios ini")

    nama = komoditas.nama_bahan
    db.delete(komoditas)
    kios.updated_at = datetime.now()
    db.commit()

    return {
        "status": "success",
        "message": f"Komoditas '{nama}' berhasil dihapus dari Katalog Kios {kios.nama_kios}"
    }

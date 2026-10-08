import math
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
from database import get_db
from schemas import HETNasionalCreate
from routers.auth import get_admin_sekarang

router = APIRouter(tags=["Cari Harga (Publik)"])


# ==============================================================================
# FUNGSI PEMBANTU (DISTANCE & HET LABEL)
# ==============================================================================

def _hitung_jarak_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Hitung jarak antara dua titik koordinat menggunakan rumus Haversine.
    Mengembalikan jarak dalam kilometer.
    """
    R = 6371  # Jari-jari bumi dalam km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _label_selisih_het(harga: float, het: float) -> dict:
    """Hitung selisih terhadap HET dan tentukan label status."""
    selisih = harga - het
    if selisih < 0:
        return {"selisih_het": selisih, "status_het_label": f"Rp{abs(int(selisih)):,} di bawah HET".replace(",", ".")}
    elif selisih == 0:
        return {"selisih_het": 0.0, "status_het_label": "Sesuai HET"}
    else:
        return {"selisih_het": selisih, "status_het_label": f"Rp{int(selisih):,} di atas HET".replace(",", ".")}


# ==============================================================================
# ENDPOINT CARI HARGA (PUBLIK - WARGA)
# ==============================================================================

@router.get("/cari-harga")
def cari_harga_kios(
    komoditas: Optional[str] = Query(None, description="Nama komoditas, misal: 'Beras Medium'"),
    pasar: Optional[str] = Query(None, description="Filter berdasarkan nama pasar, misal: 'Pasar Babat'"),
    varietas: Optional[List[str]] = Query(None, description="Filter varietas, misal: ['Medium IR 64', 'Premium Mentik Wangi']"),
    urutkan: Optional[str] = Query("harga_termurah", description="Urutan: 'harga_termurah', 'terdekat', 'terlengkap'"),
    radius_km: Optional[float] = Query(None, description="Filter radius dari GPS user (km). Gunakan bersama lat/lon"),
    lat: Optional[float] = Query(None, description="Latitude GPS user saat ini"),
    lon: Optional[float] = Query(None, description="Longitude GPS user saat ini"),
    hanya_binaan_dkpp: Optional[bool] = Query(False, description="Tampilkan hanya kios Binaan DKPP"),
    hanya_buka: Optional[bool] = Query(False, description="Tampilkan hanya kios yang sedang buka"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Endpoint Utama Fitur Cari Harga (Publik - Warga):
    Mencari kios terdaftar yang menjual komoditas tertentu, dengan opsi:
    - Filter pasar, varietas, radius GPS, kios Binaan DKPP
    - Urutkan: harga termurah, terdekat, atau terlengkap
    - Kalkulasi jarak real-time jika koordinat user disertakan
    - Mengembalikan banner 'Peluang Hemat Warga' & statistik harga
    """
    query = db.query(models.KiosHarga)
    if komoditas:
        query = query.filter(models.KiosHarga.nama_komoditas.ilike(f"%{komoditas}%"))

    if pasar and pasar != "Semua Pasar":
        query = query.filter(models.KiosHarga.nama_pasar.ilike(f"%{pasar}%"))
    if varietas:
        or_conditions = [models.KiosHarga.varietas.ilike(f"%{v}%") for v in varietas]
        query = query.filter(or_(*or_conditions))
    if hanya_binaan_dkpp:
        query = query.filter(models.KiosHarga.is_binaan_dkpp == True)
    if hanya_buka:
        query = query.filter(models.KiosHarga.is_buka_sekarang == True)

    semua_data = query.all()
    if not semua_data:
        # Fallback ke data survei_harga jika KiosHarga kosong
        survei_fallback = db.query(models.SurveiHarga)
        if komoditas:
            survei_fallback = survei_fallback.filter(
                models.SurveiHarga.nama_komoditas.ilike(f"%{komoditas}%")
            )
        if pasar and pasar != "Semua Pasar":
            survei_fallback = survei_fallback.filter(
                models.SurveiHarga.lokasi_pasar.ilike(f"%{pasar}%")
            )
        survei_list = survei_fallback.order_by(models.SurveiHarga.harga.asc()).all()
        return {
            "status": "success",
            "sumber_data": "survei_harga",
            "total_kios": len(survei_list),
            "komoditas_dicari": komoditas or "Semua Komoditas",
            "pasar_filter": pasar,
            "data": [
                {
                    "id": s.id,
                    "nama_kios": s.nama_kios,
                    "nama_pasar": s.lokasi_pasar,
                    "blok_stan": s.blok_stan,
                    "nama_komoditas": s.nama_komoditas,
                    "varietas": s.kualitas_mutu,
                    "harga_terkini": s.harga,
                    "satuan": s.satuan,
                    "jam_buka": "-",
                    "is_binaan_dkpp": False,
                    "jarak_km": None,
                    "google_maps_url": None,
                }
                for s in survei_list
            ],
            "banner_hemat": None,
            "sebaran_harga_pasar": []
        }

    hasil = []
    for k in semua_data:
        item = {
            "id": k.id,
            "nama_kios": k.nama_kios,
            "nama_pasar": k.nama_pasar,
            "kecamatan": k.kecamatan,
            "blok_stan": k.blok_stan,
            "latitude": k.latitude,
            "longitude": k.longitude,
            "nama_komoditas": k.nama_komoditas,
            "varietas": k.varietas,
            "kemasan": k.kemasan,
            "harga_terkini": k.harga_terkini,
            "satuan": k.satuan,
            "harga_het": k.harga_het,
            "selisih_het": k.selisih_het,
            "status_het_label": k.status_het_label,
            "is_binaan_dkpp": k.is_binaan_dkpp,
            "badge_label": k.badge_label,
            "badge_warna": k.badge_warna,
            "jam_buka": k.jam_buka,
            "is_buka_sekarang": k.is_buka_sekarang,
            "estimasi_tempuh_menit": k.estimasi_tempuh_menit,
            "metode_tempuh": k.metode_tempuh,
            "google_maps_url": k.google_maps_url,
            "osm_url": k.osm_url,
            "jarak_km": None,
        }

        if lat is not None and lon is not None and k.latitude and k.longitude:
            jarak = _hitung_jarak_km(lat, lon, k.latitude, k.longitude)
            item["jarak_km"] = round(jarak, 2)
            item["estimasi_tempuh_menit"] = max(1, int(jarak / 0.08))
        else:
            item["jarak_km"] = k.jarak_km

        hasil.append(item)

    if radius_km is not None and lat is not None and lon is not None:
        hasil = [h for h in hasil if h["jarak_km"] is not None and h["jarak_km"] <= radius_km]

    if urutkan == "harga_termurah":
        hasil.sort(key=lambda x: x["harga_terkini"])
    elif urutkan == "terdekat":
        hasil.sort(key=lambda x: (x["jarak_km"] is None, x["jarak_km"] or 9999))
    elif urutkan == "terlengkap":
        hasil.sort(key=lambda x: (not x["is_binaan_dkpp"], x["harga_terkini"]))

    if hasil:
        hasil[0]["badge_label"] = hasil[0].get("badge_label") or (
            "HARGA TERMURAH" if urutkan == "harga_termurah" else
            "PALING DEKAT" if urutkan == "terdekat" else None
        )

    total_kios = len(hasil)
    total_halaman = max(1, (total_kios + limit - 1) // limit)
    offset = (page - 1) * limit
    halaman_ini = hasil[offset: offset + limit]

    banner_hemat = None
    if hasil:
        harga_termurah = hasil[0]["harga_terkini"]
        harga_tertinggi = max(h["harga_terkini"] for h in hasil)
        het_ref = hasil[0].get("harga_het")
        if het_ref and harga_termurah < het_ref:
            hemat_per_kg = het_ref - harga_termurah
            hemat_per_sak = hemat_per_kg * 25
            kios_termurah = hasil[0]
            banner_hemat = {
                "aktif": True,
                "zona": kios_termurah["kecamatan"] or kios_termurah["nama_pasar"],
                "komoditas": komoditas,
                "kios_termurah": kios_termurah["nama_kios"],
                "kios_tertinggi": hasil[-1]["nama_kios"] if len(hasil) > 1 else None,
                "harga_termurah": harga_termurah,
                "harga_tertinggi": harga_tertinggi,
                "rata_rata_zona": round(sum(h["harga_terkini"] for h in hasil) / len(hasil), 0),
                "het_nasional": het_ref,
                "hemat_per_kg": hemat_per_kg,
                "estimasi_hemat_1_sak": hemat_per_sak,
                "pesan": f"Hemat hingga Rp{int(hemat_per_kg):,}/kg jika belanja di {kios_termurah['nama_pasar']}".replace(",", ".")
            }

    pasar_map: dict = {}
    for h in hasil:
        p = h["nama_pasar"]
        if p not in pasar_map:
            pasar_map[p] = {"harga_list": [], "kios_count": 0}
        pasar_map[p]["harga_list"].append(h["harga_terkini"])
        pasar_map[p]["kios_count"] += 1

    sebaran_harga_pasar = [
        {
            "nama_pasar": p,
            "harga_rata_rata": round(sum(v["harga_list"]) / len(v["harga_list"]), 0),
            "harga_terendah": min(v["harga_list"]),
            "harga_tertinggi": max(v["harga_list"]),
            "jumlah_kios": v["kios_count"],
            "status_warna": (
                "hijau" if min(v["harga_list"]) <= (hasil[0].get("harga_het") or 9999999)
                else "merah"
            )
        }
        for p, v in sorted(pasar_map.items(), key=lambda x: min(x[1]["harga_list"]))
    ]

    return {
        "status": "success",
        "sumber_data": "kios_harga",
        "komoditas_dicari": komoditas,
        "pasar_filter": pasar,
        "urutkan": urutkan,
        "total_kios": total_kios,
        "total_halaman": total_halaman,
        "page": page,
        "limit": limit,
        "data": halaman_ini,
        "banner_hemat": banner_hemat,
        "sebaran_harga_pasar": sebaran_harga_pasar,
    }


@router.get("/cari-harga/peta-sebaran")
def peta_sebaran_kios(
    komoditas: Optional[str] = Query(None, description="Filter komoditas untuk peta, misal: 'Beras Medium'"),
    pasar: Optional[str] = Query(None, description="Filter pasar tertentu"),
    lat: Optional[float] = Query(None, description="Latitude GPS user untuk kalkulasi jarak"),
    lon: Optional[float] = Query(None, description="Longitude GPS user"),
    db: Session = Depends(get_db)
):
    """Data Peta Sebaran Kios (Live GPS)."""
    query = db.query(models.KiosHarga)
    if komoditas:
        query = query.filter(models.KiosHarga.nama_komoditas.ilike(f"%{komoditas}%"))
    if pasar:
        query = query.filter(models.KiosHarga.nama_pasar.ilike(f"%{pasar}%"))

    kios_list = query.filter(
        models.KiosHarga.latitude.isnot(None),
        models.KiosHarga.longitude.isnot(None)
    ).all()

    pasar_master = db.query(models.Pasar).filter(
        models.Pasar.latitude.isnot(None),
        models.Pasar.longitude.isnot(None)
    ).all()

    markers_kios = []
    for k in kios_list:
        jarak = None
        if lat and lon and k.latitude and k.longitude:
            jarak = round(_hitung_jarak_km(lat, lon, k.latitude, k.longitude), 2)
        markers_kios.append({
            "id": k.id,
            "type": "kios",
            "nama": k.nama_kios,
            "nama_pasar": k.nama_pasar,
            "kecamatan": k.kecamatan,
            "blok_stan": k.blok_stan,
            "lat": k.latitude,
            "lon": k.longitude,
            "harga_terkini": k.harga_terkini,
            "satuan": k.satuan,
            "varietas": k.varietas,
            "is_binaan_dkpp": k.is_binaan_dkpp,
            "badge_label": k.badge_label,
            "jam_buka": k.jam_buka,
            "is_buka_sekarang": k.is_buka_sekarang,
            "jarak_km": jarak,
            "google_maps_url": k.google_maps_url,
        })

    markers_kios.sort(key=lambda x: (x["jarak_km"] is None, x["jarak_km"] or 9999))

    markers_pasar = [
        {
            "id": p.id,
            "type": "pasar",
            "nama": p.nama_pasar,
            "kecamatan": p.kecamatan,
            "alamat": p.alamat,
            "lat": p.latitude,
            "lon": p.longitude,
            "jam_operasional": p.jam_operasional,
        }
        for p in pasar_master
    ]

    rute_tercepat = None
    if markers_kios and lat and lon:
        terdekat = markers_kios[0]
        if terdekat["jarak_km"] is not None:
            rute_tercepat = {
                "kios_tujuan": terdekat["nama"],
                "pasar_tujuan": terdekat["nama_pasar"],
                "jarak_km": terdekat["jarak_km"],
                "estimasi_menit": max(1, int(terdekat["jarak_km"] / 0.08)),
                "google_maps_directions": (
                    f"https://www.google.com/maps/dir/{lat},{lon}/{terdekat['lat']},{terdekat['lon']}"
                    if terdekat.get("lat") and terdekat.get("lon") else None
                ),
                "osm_directions": (
                    f"https://www.openstreetmap.org/directions?from={lat},{lon}&to={terdekat['lat']},{terdekat['lon']}"
                    if terdekat.get("lat") and terdekat.get("lon") else None
                ),
            }

    return {
        "status": "success",
        "total_kios_aktif": len(markers_kios),
        "total_pasar": len(markers_pasar),
        "komoditas_filter": komoditas,
        "user_location": {"lat": lat, "lon": lon} if lat and lon else None,
        "markers_kios": markers_kios,
        "markers_pasar": markers_pasar,
        "rute_tercepat": rute_tercepat,
    }


@router.get("/cari-harga/detail/{kios_id}")
def detail_kios_harga(
    kios_id: int,
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """Detail Lengkap Kios + Info Navigasi & Riwayat Harga."""
    kios = db.query(models.KiosHarga).filter(models.KiosHarga.id == kios_id).first()
    if not kios:
        raise HTTPException(status_code=404, detail=f"Kios ID {kios_id} tidak ditemukan")

    jarak = None
    if lat and lon and kios.latitude and kios.longitude:
        jarak = round(_hitung_jarak_km(lat, lon, kios.latitude, kios.longitude), 2)

    gmaps_url = kios.google_maps_url
    if not gmaps_url and kios.latitude and kios.longitude:
        if lat and lon:
            gmaps_url = f"https://www.google.com/maps/dir/{lat},{lon}/{kios.latitude},{kios.longitude}"
        else:
            gmaps_url = f"https://www.google.com/maps/search/?api=1&query={kios.latitude},{kios.longitude}"

    osm_url = kios.osm_url
    if not osm_url and kios.latitude and kios.longitude:
        if lat and lon:
            osm_url = f"https://www.openstreetmap.org/directions?from={lat},{lon}&to={kios.latitude},{kios.longitude}"
        else:
            osm_url = f"https://www.openstreetmap.org/?mlat={kios.latitude}&mlon={kios.longitude}#map=17/{kios.latitude}/{kios.longitude}"

    riwayat = db.query(models.SurveiHarga).filter(
        models.SurveiHarga.nama_kios.ilike(f"%{kios.nama_kios}%"),
        models.SurveiHarga.nama_komoditas.ilike(f"%{kios.nama_komoditas}%")
    ).order_by(models.SurveiHarga.created_at.desc()).limit(10).all()

    kios_pasar_lain = db.query(models.KiosHarga).filter(
        models.KiosHarga.nama_pasar == kios.nama_pasar,
        models.KiosHarga.nama_komoditas.ilike(f"%{kios.nama_komoditas}%"),
        models.KiosHarga.id != kios_id
    ).order_by(models.KiosHarga.harga_terkini.asc()).limit(5).all()

    return {
        "status": "success",
        "data": {
            "id": kios.id,
            "nama_kios": kios.nama_kios,
            "nama_pasar": kios.nama_pasar,
            "kecamatan": kios.kecamatan,
            "blok_stan": kios.blok_stan,
            "latitude": kios.latitude,
            "longitude": kios.longitude,
            "jarak_km": jarak,
            "estimasi_tempuh_menit": (
                max(1, int(jarak / 0.08)) if jarak else kios.estimasi_tempuh_menit
            ),
            "metode_tempuh": kios.metode_tempuh,
            "nama_komoditas": kios.nama_komoditas,
            "varietas": kios.varietas,
            "kemasan": kios.kemasan,
            "harga_terkini": kios.harga_terkini,
            "satuan": kios.satuan,
            "harga_het": kios.harga_het,
            "selisih_het": kios.selisih_het,
            "status_het_label": kios.status_het_label,
            "is_binaan_dkpp": kios.is_binaan_dkpp,
            "badge_label": kios.badge_label,
            "jam_buka": kios.jam_buka,
            "is_buka_sekarang": kios.is_buka_sekarang,
            "google_maps_url": gmaps_url,
            "osm_url": osm_url,
            "updated_at": kios.updated_at,
        },
        "riwayat_harga": [
            {
                "harga": r.harga,
                "satuan": r.satuan,
                "waktu_survei": r.waktu_survei,
                "tanggal": r.created_at.strftime("%d %b %Y") if r.created_at else None,
                "status_het": r.status_het,
                "petugas": r.petugas_nama,
            }
            for r in riwayat
        ],
        "kios_lain_di_pasar": [
            {
                "id": k.id,
                "nama_kios": k.nama_kios,
                "blok_stan": k.blok_stan,
                "harga_terkini": k.harga_terkini,
                "is_binaan_dkpp": k.is_binaan_dkpp,
                "jam_buka": k.jam_buka,
            }
            for k in kios_pasar_lain
        ]
    }


@router.get("/cari-harga/varietas-filter")
def get_varietas_komoditas(
    komoditas: str = Query(..., description="Nama komoditas, misal: 'Beras'"),
    db: Session = Depends(get_db)
):
    """Daftar Varietas Tersedia untuk Filter Presisi."""
    rows = db.query(models.KiosHarga).filter(
        models.KiosHarga.nama_komoditas.ilike(f"%{komoditas}%"),
        models.KiosHarga.varietas.isnot(None)
    ).all()

    varietas_map: dict = {}
    for r in rows:
        v = r.varietas
        if v not in varietas_map:
            varietas_map[v] = {"harga_list": [], "kios_count": 0}
        varietas_map[v]["harga_list"].append(r.harga_terkini)
        varietas_map[v]["kios_count"] += 1

    return {
        "status": "success",
        "komoditas": komoditas,
        "varietas": [
            {
                "nama_varietas": v,
                "jumlah_kios": data["kios_count"],
                "harga_rata_rata": round(sum(data["harga_list"]) / len(data["harga_list"]), 0),
            }
            for v, data in sorted(varietas_map.items(), key=lambda x: x[1]["kios_count"], reverse=True)
        ]
    }


# ==============================================================================
# ENDPOINT HET NASIONAL
# ==============================================================================

@router.get("/het-nasional", tags=["HET Nasional"])
def get_semua_het(
    komoditas: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Daftar semua HET Nasional yang aktif. Bisa difilter per komoditas."""
    query = db.query(models.HETNasional).filter(models.HETNasional.is_aktif == True)
    if komoditas:
        query = query.filter(models.HETNasional.nama_komoditas.ilike(f"%{komoditas}%"))
    data = query.all()
    return {"status": "success", "total": len(data), "data": data}


@router.post("/het-nasional", tags=["HET Nasional"], status_code=status.HTTP_201_CREATED)
def tambah_het(
    item: HETNasionalCreate,
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Tambah/perbarui data HET Nasional (hanya Admin/Petugas)."""
    existing = db.query(models.HETNasional).filter(
        models.HETNasional.nama_komoditas.ilike(item.nama_komoditas),
        models.HETNasional.varietas == item.varietas
    ).first()
    if existing:
        existing.harga_het = item.harga_het
        existing.sumber = item.sumber
        existing.berlaku_mulai = item.berlaku_mulai
        existing.zona = item.zona
        existing.is_aktif = True
        db.commit()
        db.refresh(existing)
        return {"status": "success", "message": "HET berhasil diperbarui", "data": existing}

    baru = models.HETNasional(**item.model_dump())
    db.add(baru)
    db.commit()
    db.refresh(baru)
    return {"status": "success", "message": "HET berhasil ditambahkan", "data": baru}

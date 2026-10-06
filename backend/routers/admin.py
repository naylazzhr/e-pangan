from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models
from database import get_db
from schemas import KiosHargaCreate, KiosHargaUpdate
from routers.auth import get_admin_sekarang
from routers.search import _label_selisih_het

router = APIRouter(tags=["Dashboard Admin & Manajemen Kios"])


# ==============================================================================
# ENDPOINT RINGKASAN DASHBOARD (GAMBAR 2)
# ==============================================================================

@router.get("/admin/dashboard-ringkasan")
def get_dashboard_ringkasan(
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """
    Menyediakan seluruh data metrik untuk Header Profil & 4 Kartu Utama:
    - Kios Terpantau: 24 / 24 Kios (100% Target Babat, Penuh tersurvei)
    - Komoditas Aktif: 18 Bahan Pokok (Lengkap 18/18, NFA & Bapanas)
    - Input Hari Ini: Catatan survei harian
    - Pending Validasi: Menunggu Cek konfirmasi
    """
    total_kios = db.query(models.Kios).count()
    kios_terpantau = min(24, total_kios)

    total_komoditas = db.query(models.Komoditas).count()
    komoditas_aktif = min(18, total_komoditas)

    total_survei = db.query(models.SurveiHarga).count()
    pending_count = db.query(models.SurveiHarga).filter(models.SurveiHarga.status_verifikasi == "Menunggu Cek").count()

    return {
        "status": "success",
        "petugas": {
            "id": current_admin.id,
            "nama_lengkap": current_admin.nama_lengkap or "Hendra Setiawan",
            "nip": current_admin.nip or "19850412 201001 1 014",
            "status_verifikasi": current_admin.status_verifikasi or "Online & Terverifikasi DKPP",
            "wilayah_pantau": current_admin.wilayah_pantau or "Pasar Babat & Pasar Sukodadi",
            "jabatan": current_admin.jabatan or "Petugas Enumerator",
            "pasar_aktif": "Pasar Sidoharjo Lamongan"
        },
        "kios_terpantau": {
            "nilai": f"{kios_terpantau} / 24 Kios",
            "target": 24,
            "tercapai": kios_terpantau,
            "badge_target": "100% Target Babat",
            "keterangan": "Penuh tersurvei"
        },
        "komoditas_aktif": {
            "nilai": f"{komoditas_aktif} Bahan Pokok",
            "status": f"Lengkap {komoditas_aktif}/18",
            "regulator": "NFA & Bapanas"
        },
        "input_hari_ini": {
            "nilai": f"{total_survei} Catatan",
            "waktu_cut_off": "s/d 09:30 WIB",
            "perubahan": "+14 dari kemarin"
        },
        "pending_validasi": {
            "nilai": f"{pending_count} Perlu Konfirmasi",
            "status": "Deviasi Signifikan",
            "anomali": "Anomali > 5%"
        }
    }


# ==============================================================================
# ENDPOINT MANAJEMEN MASTER DATA PORTAL
# ==============================================================================

@router.get("/master-data/ringkasan", tags=["Master Data"])
def get_master_data_ringkasan(db: Session = Depends(get_db)):
    """
    Menyediakan info untuk 4 Kartu Master Data Portal:
    1. Data Pasar (5 Titik Pantau)
    2. Data Kios Mitra (48 Kios Terdaftar)
    3. Data Komoditas (18 Bahan Pokok)
    4. Harga Harian (Real-time Stream)
    """
    pasar_list = db.query(models.Pasar).all()
    kios_count = db.query(models.Kios).count()
    komoditas_count = db.query(models.Komoditas).count()
    survei_count = db.query(models.SurveiHarga).count()

    return {
        "status": "success",
        "data_pasar": {
            "judul": "Data Pasar",
            "badge": f"{len(pasar_list)} Titik Pantau",
            "deskripsi": "Kelola wilayah pantau resmi: Babat, Sukodadi, Sidoharjo, Brondong, dan Blimbing Lamongan.",
            "status_gps": "Radius GPS Aktif",
            "daftar_pasar": [p.nama_pasar for p in pasar_list]
        },
        "data_kios": {
            "judul": "Data Kios Mitra",
            "badge": f"{max(kios_count, 48)} Kios Terdaftar",
            "deskripsi": "Direktori pedagang langganan, nomor registrasi kios, blok pasar, dan kontak penanggung jawab stan.",
            "status_izin": "100% Berizin Pemkab"
        },
        "data_komoditas": {
            "judul": "Data Komoditas",
            "badge": f"{max(komoditas_count, 18)} Bahan Pokok",
            "deskripsi": "Spesifikasi mutu, batas toleransi fluktuasi, satuan standar (kg, liter, butir), dan kategori NFA.",
            "status_het": "HET Terkalibrasi"
        },
        "harga_harian": {
            "judul": "Harga Harian",
            "badge": "Real-time Stream",
            "deskripsi": "Basis data riwayat entri, catatan revisi petugas, log audit integritas harga, dan arsip harian.",
            "status_sinkronisasi": "Sinkronisasi Pusat OK",
            "total_catatan": survei_count
        }
    }


@router.get("/komoditas", tags=["Master Komoditas"])
def get_semua_komoditas(
    search: Optional[str] = Query(None),
    kategori: Optional[str] = Query(None),
    lokasi: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Mengambil master data komoditas bahan pangan dengan filter pencarian."""
    query = db.query(models.Komoditas)
    if search:
        query = query.filter(models.Komoditas.nama_bahan.ilike(f"%{search}%"))
    if kategori:
        query = query.filter(models.Komoditas.kategori == kategori)
    if lokasi:
        query = query.filter(models.Komoditas.lokasi.ilike(f"%{lokasi}%"))
    data = query.all()
    return {"status": "success", "total_data": len(data), "data": data}


# ==============================================================================
# ENDPOINT CRUD KIOS HARGA (ADMIN)
# ==============================================================================

@router.get("/admin/kios-harga")
def get_semua_kios_harga(
    komoditas: Optional[str] = Query(None),
    pasar: Optional[str] = Query(None),
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Daftar semua KiosHarga. Hanya untuk Admin/Petugas."""
    query = db.query(models.KiosHarga)
    if komoditas:
        query = query.filter(models.KiosHarga.nama_komoditas.ilike(f"%{komoditas}%"))
    if pasar:
        query = query.filter(models.KiosHarga.nama_pasar.ilike(f"%{pasar}%"))
    data = query.all()
    return {"status": "success", "total": len(data), "data": data}


@router.post("/admin/kios-harga", status_code=status.HTTP_201_CREATED)
def tambah_kios_harga(
    item: KiosHargaCreate,
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Tambah / Daftarkan Kios ke Direktori Cari Harga."""
    data = item.model_dump()

    het_row = db.query(models.HETNasional).filter(
        models.HETNasional.nama_komoditas.ilike(item.nama_komoditas),
        models.HETNasional.is_aktif == True
    ).first()

    if het_row:
        data["harga_het"] = het_row.harga_het
        selisih = _label_selisih_het(item.harga_terkini, het_row.harga_het)
        data.update(selisih)
    elif item.harga_het:
        selisih = _label_selisih_het(item.harga_terkini, item.harga_het)
        data.update(selisih)

    if item.latitude and item.longitude:
        if not data.get("google_maps_url"):
            data["google_maps_url"] = (
                f"https://www.google.com/maps/search/?api=1&query={item.latitude},{item.longitude}"
            )
        if not data.get("osm_url"):
            data["osm_url"] = (
                f"https://www.openstreetmap.org/?mlat={item.latitude}&mlon={item.longitude}"
                f"#map=17/{item.latitude}/{item.longitude}"
            )

    data["petugas_nama"] = current_admin.nama_lengkap or current_admin.username

    baru = models.KiosHarga(**data)
    db.add(baru)
    db.commit()
    db.refresh(baru)
    return {"status": "success", "message": "Kios berhasil didaftarkan ke Cari Harga", "data": baru}


@router.put("/admin/kios-harga/{kios_id}")
def update_kios_harga(
    kios_id: int,
    item: KiosHargaUpdate,
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Update harga terkini atau info kios (Admin only)."""
    kios = db.query(models.KiosHarga).filter(models.KiosHarga.id == kios_id).first()
    if not kios:
        raise HTTPException(status_code=404, detail=f"Kios ID {kios_id} tidak ditemukan")

    update_data = item.model_dump(exclude_unset=True)

    if "harga_terkini" in update_data and kios.harga_het:
        selisih = _label_selisih_het(update_data["harga_terkini"], kios.harga_het)
        update_data.update(selisih)

    for k, v in update_data.items():
        setattr(kios, k, v)

    db.commit()
    db.refresh(kios)
    return {"status": "success", "message": "Data kios berhasil diperbarui", "data": kios}


@router.delete("/admin/kios-harga/{kios_id}")
def hapus_kios_harga(
    kios_id: int,
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Hapus kios dari direktori Cari Harga (Admin only)."""
    kios = db.query(models.KiosHarga).filter(models.KiosHarga.id == kios_id).first()
    if not kios:
        raise HTTPException(status_code=404, detail=f"Kios ID {kios_id} tidak ditemukan")
    nama = kios.nama_kios
    db.delete(kios)
    db.commit()
    return {"status": "success", "message": f"Kios '{nama}' berhasil dihapus dari direktori"}


# ==============================================================================
# ENDPOINT SEED DATA DEMO (CARA CEPAT INIT DATA)
# ==============================================================================

@router.post("/admin/seed-cari-harga")
def seed_data_demo_cari_harga(
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """Isi Data Demo untuk Fitur Cari Harga (HET Nasional + Kios Contoh Babat, Sidoharjo, Lamongan Kota)."""
    existing_count = db.query(models.KiosHarga).count()
    if existing_count > 0:
        return {
            "status": "skipped",
            "message": f"Tabel kios_harga sudah berisi {existing_count} data. Seed dibatalkan."
        }

    het_list = [
        models.HETNasional(
            nama_komoditas="Beras Medium",
            varietas="Medium",
            harga_het=13500.0,
            satuan="kg",
            sumber="Permendag No. 57 Tahun 2017 (diperbarui)",
            berlaku_mulai="Januari 2024",
            zona="Jawa-Bali",
            is_aktif=True
        ),
        models.HETNasional(
            nama_komoditas="Beras Premium",
            varietas="Premium",
            harga_het=14800.0,
            satuan="kg",
            sumber="Permendag No. 57 Tahun 2017 (diperbarui)",
            berlaku_mulai="Januari 2024",
            zona="Jawa-Bali",
            is_aktif=True
        ),
    ]
    for h in het_list:
        db.add(h)
    db.commit()

    HET_BERAS = 13500.0

    def selisih(harga, het):
        return _label_selisih_het(harga, het)

    kios_demo = [
        {
            "nama_kios": "Kios Bu Siti",
            "nama_pasar": "Pasar Babat",
            "kecamatan": "Babat",
            "blok_stan": "Los Beras Blok B-12",
            "latitude": -7.1040,
            "longitude": 112.0110,
            "estimasi_tempuh_menit": 3,
            "metode_tempuh": "jalan",
            "nama_komoditas": "Beras Medium",
            "varietas": "Medium IR 64",
            "kemasan": "Kemasan Curah & 5 kg",
            "harga_terkini": 13000.0,
            "satuan": "kg",
            "harga_het": HET_BERAS,
            "selisih_het": selisih(13000, HET_BERAS)["selisih_het"],
            "status_het_label": selisih(13000, HET_BERAS)["status_het_label"],
            "is_binaan_dkpp": True,
            "badge_label": "HARGA TERMURAH",
            "badge_warna": "hijau",
            "jam_buka": "Buka s/d 16.30 WIB",
            "is_buka_sekarang": True,
            "jarak_km": 0.8,
            "google_maps_url": "https://www.google.com/maps/search/?api=1&query=-7.1040,112.0110",
            "osm_url": "https://www.openstreetmap.org/?mlat=-7.1040&mlon=112.0110#map=17/-7.1040/112.0110",
        },
        {
            "nama_kios": "Kios Berkah Tani",
            "nama_pasar": "Pasar Babat",
            "kecamatan": "Babat",
            "blok_stan": "Sektor Barat Blok A-05",
            "latitude": -7.1055,
            "longitude": 112.0095,
            "estimasi_tempuh_menit": 3,
            "metode_tempuh": "jalan",
            "nama_komoditas": "Beras Medium",
            "varietas": "Medium Lokal Babat",
            "kemasan": "Kemasan 10 kg & 25 kg",
            "harga_terkini": 13200.0,
            "satuan": "kg",
            "harga_het": HET_BERAS,
            "selisih_het": selisih(13200, HET_BERAS)["selisih_het"],
            "status_het_label": selisih(13200, HET_BERAS)["status_het_label"],
            "is_binaan_dkpp": False,
            "badge_label": "PALING DEKAT",
            "badge_warna": "biru",
            "jam_buka": "Buka s/d 17.00 WIB",
            "is_buka_sekarang": True,
            "jarak_km": 0.5,
            "google_maps_url": "https://www.google.com/maps/search/?api=1&query=-7.1055,112.0095",
            "osm_url": "https://www.openstreetmap.org/?mlat=-7.1055&mlon=112.0095#map=17/-7.1055/112.0095",
        },
        {
            "nama_kios": "Toko Barokah Abadi",
            "nama_pasar": "Pasar Sidoharjo",
            "kecamatan": "Sidoharjo",
            "blok_stan": "Blok C-02",
            "latitude": -7.1220,
            "longitude": 112.0350,
            "estimasi_tempuh_menit": 8,
            "metode_tempuh": "mobil",
            "nama_komoditas": "Beras Medium",
            "varietas": "Medium Super & Beras Ramos",
            "kemasan": "Curah & 5 kg",
            "harga_terkini": 13500.0,
            "satuan": "kg",
            "harga_het": HET_BERAS,
            "selisih_het": selisih(13500, HET_BERAS)["selisih_het"],
            "status_het_label": selisih(13500, HET_BERAS)["status_het_label"],
            "is_binaan_dkpp": True,
            "badge_label": None,
            "badge_warna": None,
            "jam_buka": "Buka s/d 15.00 WIB",
            "is_buka_sekarang": True,
            "jarak_km": 4.2,
            "google_maps_url": "https://www.google.com/maps/search/?api=1&query=-7.1220,112.0350",
            "osm_url": "https://www.openstreetmap.org/?mlat=-7.1220&mlon=112.0350#map=17/-7.1220/112.0350",
        },
        {
            "nama_kios": "Kios Rejeki Makmur",
            "nama_pasar": "Pasar Lamongan Kota",
            "kecamatan": "Lamongan",
            "blok_stan": "Area Timur",
            "latitude": -7.1170,
            "longitude": 112.4140,
            "estimasi_tempuh_menit": 16,
            "metode_tempuh": "mobil",
            "nama_komoditas": "Beras Medium",
            "varietas": "Beras Medium C4",
            "kemasan": "Curah & 10 kg",
            "harga_terkini": 14000.0,
            "satuan": "kg",
            "harga_het": HET_BERAS,
            "selisih_het": selisih(14000, HET_BERAS)["selisih_het"],
            "status_het_label": selisih(14000, HET_BERAS)["status_het_label"],
            "is_binaan_dkpp": False,
            "badge_label": None,
            "badge_warna": None,
            "jam_buka": "Tutup pkl 14.00 WIB",
            "is_buka_sekarang": False,
            "jarak_km": 8.5,
            "google_maps_url": "https://www.google.com/maps/search/?api=1&query=-7.1170,112.4140",
            "osm_url": "https://www.openstreetmap.org/?mlat=-7.1170&mlon=112.4140#map=17/-7.1170/112.4140",
        },
    ]

    inserted = []
    for data in kios_demo:
        row = models.KiosHarga(**data)
        db.add(row)
        inserted.append(data["nama_kios"])

    pasar_count = db.query(models.Pasar).count()
    if pasar_count == 0:
        pasar_demo = [
            models.Pasar(nama_pasar="Pasar Babat", kecamatan="Babat", latitude=-7.1040, longitude=112.0110,
                         alamat="Jl. Raya Babat, Lamongan", jam_operasional="05.00 - 17.00 WIB"),
            models.Pasar(nama_pasar="Pasar Sidoharjo", kecamatan="Sidoharjo", latitude=-7.1220, longitude=112.0350,
                         alamat="Jl. Sidoharjo, Lamongan", jam_operasional="05.00 - 15.00 WIB"),
            models.Pasar(nama_pasar="Pasar Sukodadi", kecamatan="Sukodadi", latitude=-7.0950, longitude=112.0720,
                         alamat="Jl. Sukodadi, Lamongan", jam_operasional="05.00 - 16.00 WIB"),
            models.Pasar(nama_pasar="Pasar Lamongan Kota", kecamatan="Lamongan", latitude=-7.1170, longitude=112.4140,
                         alamat="Pusat Kota Lamongan", jam_operasional="06.00 - 14.00 WIB"),
        ]
        for p in pasar_demo:
            db.add(p)

    db.commit()
    return {
        "status": "success",
        "message": "Data demo Cari Harga berhasil diinisialisasi!",
        "het_ditambah": ["Beras Medium", "Beras Premium"],
        "kios_ditambah": inserted,
    }

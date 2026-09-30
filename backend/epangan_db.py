import sqlite3
from datetime import datetime
import bcrypt
import models
from database import engine, SessionLocal


def migrate_sqlite_columns():
    """Menambahkan kolom baru ke tabel SQLite jika belum ada tanpa merusak data lama."""
    conn = sqlite3.connect("epangan.db")
    cursor = conn.cursor()

    def add_col_if_missing(table, col_name, col_type):
        cursor.execute(f"PRAGMA table_info({table});")
        columns = [c[1] for c in cursor.fetchall()]
        if col_name not in columns:
            try:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type};")
                print(f"[MIGRATION] Menambahkan kolom '{col_name}' ke tabel '{table}'.")
            except Exception as e:
                print(f"[MIGRATION WARNING] {table}.{col_name}: {e}")

    # Kolom untuk tabel admins
    add_col_if_missing("admins", "email", "VARCHAR(100)")
    add_col_if_missing("admins", "nip", "VARCHAR(50)")
    add_col_if_missing("admins", "nama_lengkap", "VARCHAR(100) DEFAULT 'Hendra Setiawan'")
    add_col_if_missing("admins", "jabatan", "VARCHAR(100) DEFAULT 'Petugas Enumerator'")
    add_col_if_missing("admins", "wilayah_pantau", "VARCHAR(150) DEFAULT 'Pasar Babat & Pasar Sukodadi'")
    add_col_if_missing("admins", "status_verifikasi", "VARCHAR(50) DEFAULT 'Online & Terverifikasi DKPP'")
    add_col_if_missing("admins", "avatar", "VARCHAR(255)")
    add_col_if_missing("admins", "created_at", "DATETIME")

    # Kolom untuk tabel komoditas
    add_col_if_missing("komoditas", "kualitas_mutu", "VARCHAR(100)")
    add_col_if_missing("komoditas", "het", "FLOAT")
    add_col_if_missing("komoditas", "toleransi_fluktuasi", "FLOAT DEFAULT 5.0")
    add_col_if_missing("komoditas", "is_active", "BOOLEAN DEFAULT 1")

    # Kolom untuk tabel pasar
    add_col_if_missing("pasar", "radius_gps_aktif", "BOOLEAN DEFAULT 1")

    # Kolom untuk tabel kios
    add_col_if_missing("kios", "blok_stan", "VARCHAR(50)")
    add_col_if_missing("kios", "status_izin", "VARCHAR(50) DEFAULT '100% Berizin Pemkab'")
    add_col_if_missing("kios", "is_active", "BOOLEAN DEFAULT 1")

    conn.commit()
    conn.close()


def hash_pw(pw: str) -> str:
    pwd_bytes = pw.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def init_db():
    print(f"Menghubungkan ke database: {engine.url}")

    # 1. Migrasi kolom SQLite
    migrate_sqlite_columns()

    # 2. Buat seluruh tabel baru (termasuk survei_harga)
    models.Base.metadata.create_all(bind=engine)
    print("Tabel database berhasil diverifikasi/dibuat.")

    db = SessionLocal()
    try:
        # A. SEEDING / PEMBARUAN 2 AKUN ADMIN / PETUGAS
        admin_data_list = [
            {
                "username": "intan_permatasari",
                "email": "petugas.babat@lamongankab.go.id",
                "nip": "19850412 201001 1014",
                "nama_lengkap": "Intan Permatasari",
                "jabatan": "Petugas Enumerator",
                "wilayah_pantau": "Pasar Babat & Pasar Sukodadi",
                "status_verifikasi": "Online & Terverifikasi DKPP",
                "password": "admin123"
            },
            {
                "username": "admin_epangan",
                "email": "hendra.setiawan@lamongankab.go.id",
                "nip": "19820516 200801 1 009",
                "nama_lengkap": "Hendra Setiawan",
                "jabatan": "Surveyor Supervisor / Admin DKPP",
                "wilayah_pantau": "Pasar Sidoharjo & Pasar Babat",
                "status_verifikasi": "Online & Terverifikasi DKPP",
                "password": "admin123"
            }
        ]

        for adm in admin_data_list:
            hashed_pw = hash_pw(adm["password"])
            admin_obj = db.query(models.Admin).filter(
                (models.Admin.username == adm["username"]) |
                (models.Admin.email == adm["email"]) |
                (models.Admin.nip == adm["nip"])
            ).first()

            if not admin_obj:
                admin_obj = models.Admin(
                    username=adm["username"],
                    email=adm["email"],
                    nip=adm["nip"],
                    nama_lengkap=adm["nama_lengkap"],
                    jabatan=adm["jabatan"],
                    wilayah_pantau=adm["wilayah_pantau"],
                    status_verifikasi=adm["status_verifikasi"],
                    hashed_password=hashed_pw
                )
                db.add(admin_obj)
            else:
                admin_obj.username = adm["username"]
                admin_obj.email = adm["email"]
                admin_obj.nip = adm["nip"]
                admin_obj.nama_lengkap = adm["nama_lengkap"]
                admin_obj.jabatan = adm["jabatan"]
                admin_obj.wilayah_pantau = adm["wilayah_pantau"]
                admin_obj.status_verifikasi = adm["status_verifikasi"]
                admin_obj.hashed_password = hashed_pw

        db.commit()
        print("2 Akun Admin Resmi (Intan Permatasari & Hendra Setiawan) berhasil disinkronisasi.")

        # B. SEEDING MASTER DATA PASAR (5 Titik Pantau Resmi: Babat, Sukodadi, Sidoharjo, Brondong, Blimbing)
        pasar_count = db.query(models.Pasar).count()
        if pasar_count < 5:
            pasar_list = [
                models.Pasar(
                    nama_pasar="Pasar Babat",
                    alamat="Jl. Raya Babat No. 12, Babat",
                    kecamatan="Babat",
                    latitude=-7.1126,
                    longitude=112.1634,
                    kontak="0812-3456-7801",
                    jam_operasional="04:00 - 15:00 WIB",
                    deskripsi="Pasar sentral perdagangan wilayah barat Lamongan",
                    radius_gps_aktif=True
                ),
                models.Pasar(
                    nama_pasar="Pasar Sukodadi",
                    alamat="Jl. Raya Sukodadi No. 8, Sukodadi",
                    kecamatan="Sukodadi",
                    latitude=-7.1082,
                    longitude=112.3354,
                    kontak="0812-3456-7807",
                    jam_operasional="05:00 - 13:00 WIB",
                    deskripsi="Pasar tradisional terpadu Lamongan tengah",
                    radius_gps_aktif=True
                ),
                models.Pasar(
                    nama_pasar="Pasar Sidoharjo",
                    alamat="Jl. Pahlawan, Sidoharjo",
                    kecamatan="Lamongan",
                    latitude=-7.1205,
                    longitude=112.4152,
                    kontak="0812-3456-7802",
                    jam_operasional="05:00 - 17:00 WIB",
                    deskripsi="Pasar induk pusat kota Kabupaten Lamongan",
                    radius_gps_aktif=True
                ),
                models.Pasar(
                    nama_pasar="Pasar Brondong",
                    alamat="Jl. Raya Brondong - Tuban, Brondong",
                    kecamatan="Brondong",
                    latitude=-6.8924,
                    longitude=112.2856,
                    kontak="0812-3456-7806",
                    jam_operasional="04:00 - 14:00 WIB",
                    deskripsi="Pasar komoditas kelautan, ikan segar, dan bahan pokok pantura",
                    radius_gps_aktif=True
                ),
                models.Pasar(
                    nama_pasar="Pasar Blimbing",
                    alamat="Jl. Raya Daendels, Paciran",
                    kecamatan="Paciran",
                    latitude=-6.8781,
                    longitude=112.3524,
                    kontak="0812-3456-7808",
                    jam_operasional="05:00 - 14:00 WIB",
                    deskripsi="Pasar pesisir utara sentra logistik perikanan dan sembako",
                    radius_gps_aktif=True
                ),
            ]
            for p in pasar_list:
                exist = db.query(models.Pasar).filter(models.Pasar.nama_pasar == p.nama_pasar).first()
                if not exist:
                    db.add(p)
            db.commit()
            print("Master data 5 Titik Pantau Pasar Lamongan siap.")

        # C. SEEDING 18 BAHAN POKOK (18 Bahan Pokok NFA & Bapanas)
        komoditas_count = db.query(models.Komoditas).count()
        if komoditas_count < 18:
            komoditas_18 = [
                models.Komoditas(nama_bahan="Beras Medium (IR 64)", kategori="KEBUTUHAN POKOK", harga=13000.0, satuan="kg", lokasi="Pasar Babat", kualitas_mutu="Kualitas Bulog Premium", het=13000.0),
                models.Komoditas(nama_bahan="Beras Premium Pandan Wangi", kategori="KEBUTUHAN POKOK", harga=15500.0, satuan="kg", lokasi="Pasar Sidoharjo", kualitas_mutu="Grade A Bulir Utuh", het=15000.0),
                models.Komoditas(nama_bahan="Gula Pasir Curah", kategori="BAHAN BAKU", harga=18000.0, satuan="kg", lokasi="Pasar Sukodadi", kualitas_mutu="Tebu Kristal Putih", het=17500.0),
                models.Komoditas(nama_bahan="Gula Pasir Kristal", kategori="BAHAN BAKU", harga=17500.0, satuan="kg", lokasi="Pasar Sidoharjo", kualitas_mutu="Kemasan Pabrikasi", het=17500.0),
                models.Komoditas(nama_bahan="Minyak Goreng Sawit", kategori="MINYAK GORENG", harga=17500.0, satuan="liter", lokasi="Pasar Babat", kualitas_mutu="Minyakita Kemasan 1L", het=15700.0),
                models.Komoditas(nama_bahan="Minyak Goreng Curah", kategori="MINYAK GORENG", harga=15200.0, satuan="liter", lokasi="Pasar Sidoharjo", kualitas_mutu="Curah Higienis", het=15500.0),
                models.Komoditas(nama_bahan="Cabai Rawit Merah", kategori="BUMBU DAPUR", harga=42000.0, satuan="kg", lokasi="Pasar Babat", kualitas_mutu="Kualitas Grade Super", het=45000.0),
                models.Komoditas(nama_bahan="Cabai Merah Keriting", kategori="BUMBU DAPUR", harga=48000.0, satuan="kg", lokasi="Pasar Sukodadi", kualitas_mutu="Segar Petik", het=42000.0),
                models.Komoditas(nama_bahan="Bawang Merah Allium", kategori="BUMBU DAPUR", harga=28000.0, satuan="kg", lokasi="Pasar Babat", kualitas_mutu="Varietas Super Lokal", het=28000.0),
                models.Komoditas(nama_bahan="Bawang Putih Honan", kategori="BUMBU DAPUR", harga=36000.0, satuan="kg", lokasi="Pasar Sidoharjo", kualitas_mutu="Kering Bersih", het=36000.0),
                models.Komoditas(nama_bahan="Daging Ayam Broiler", kategori="PROTEIN HEWANI", harga=34000.0, satuan="kg", lokasi="Pasar Brondong", kualitas_mutu="Karkas Segar", het=34000.0),
                models.Komoditas(nama_bahan="Daging Sapi Murni", kategori="PROTEIN HEWANI", harga=120000.0, satuan="kg", lokasi="Pasar Sidoharjo", kualitas_mutu="Paha Belakang Super", het=120000.0),
                models.Komoditas(nama_bahan="Telur Ayam Ras", kategori="PROTEIN HEWANI", harga=28500.0, satuan="kg", lokasi="Pasar Sukodadi", kualitas_mutu="Grade A Bersih", het=28500.0),
                models.Komoditas(nama_bahan="Tepung Terigu Segitiga", kategori="BAHAN BAKU", harga=11500.0, satuan="kg", lokasi="Pasar Babat", kualitas_mutu="Protein Sedang", het=11500.0),
                models.Komoditas(nama_bahan="Kedelai Impor Kuning", kategori="BAHAN BAKU", harga=12800.0, satuan="kg", lokasi="Pasar Blimbing", kualitas_mutu="Grade Pembuat Tahu", het=12500.0),
                models.Komoditas(nama_bahan="Jagung Pipil Kering", kategori="BAHAN BAKU", harga=7500.0, satuan="kg", lokasi="Pasar Babat", kualitas_mutu="Kadar Air 14%", het=7500.0),
                models.Komoditas(nama_bahan="Ikan Bandeng Segar", kategori="PROTEIN HEWANI", harga=32000.0, satuan="kg", lokasi="Pasar Brondong", kualitas_mutu="Tambak Lamongan", het=32000.0),
                models.Komoditas(nama_bahan="Ikan Tongkol Segar", kategori="PROTEIN HEWANI", harga=31000.0, satuan="kg", lokasi="Pasar Blimbing", kualitas_mutu="Hasil Tangkap Nelayan", het=30000.0),
            ]
            for k in komoditas_18:
                exist = db.query(models.Komoditas).filter(models.Komoditas.nama_bahan == k.nama_bahan).first()
                if not exist:
                    db.add(k)
            db.commit()
            print("Master data 18 Komoditas Pangan NFA & Bapanas siap.")

        # D. SEEDING KIOS MITRA (Minimal 24 kios untuk target survei 24/24 Babat & Sukodadi)
        kios_count = db.query(models.Kios).count()
        if kios_count < 24:
            kios_samples = [
                models.Kios(nama_kios="Kios Bu Siti", pemilik="Siti Fatimah", lokasi_pasar="Pasar Babat", blok_stan="Blok A-12", no_telepon="0812-3344-5501", status_izin="100% Berizin Pemkab"),
                models.Kios(nama_kios="Kios Barokah", pemilik="H. Mahmud", lokasi_pasar="Pasar Sukodadi", blok_stan="Kav. B-04", no_telepon="0812-3344-5502", status_izin="100% Berizin Pemkab"),
                models.Kios(nama_kios="Kios Makmur", pemilik="Budi Santoso", lokasi_pasar="Pasar Babat", blok_stan="Stan Sayur 3", no_telepon="0812-3344-5503", status_izin="100% Berizin Pemkab"),
                models.Kios(nama_kios="Kios Sumber Rejeki", pemilik="Hj. Aminah", lokasi_pasar="Pasar Babat", blok_stan="Blok C-01", no_telepon="0812-3344-5504", status_izin="100% Berizin Pemkab"),
                models.Kios(nama_kios="Kios Podomoro", pemilik="Supardi", lokasi_pasar="Pasar Sukodadi", blok_stan="Blok A-05", no_telepon="0812-3344-5505", status_izin="100% Berizin Pemkab"),
                models.Kios(nama_kios="Kios Beras Jaya", pemilik="Rahmat Hidayat", lokasi_pasar="Pasar Babat", blok_stan="Blok D-08", no_telepon="0812-3344-5506", status_izin="100% Berizin Pemkab"),
                models.Kios(nama_kios="Kios Berkah Tani", pemilik="Kasman", lokasi_pasar="Pasar Sukodadi", blok_stan="Blok B-11", no_telepon="0812-3344-5507", status_izin="100% Berizin Pemkab"),
                models.Kios(nama_kios="Kios Sembako Lestari", pemilik="Sri Wahyuni", lokasi_pasar="Pasar Babat", blok_stan="Stan Sembako 2", no_telepon="0812-3344-5508", status_izin="100% Berizin Pemkab"),
            ]
            for i in range(len(kios_samples) + 1, 25):
                kios_samples.append(models.Kios(
                    nama_kios=f"Kios Pangan Mitra {i}",
                    pemilik=f"Pedagang Binaan {i}",
                    lokasi_pasar="Pasar Babat" if i % 2 == 0 else "Pasar Sukodadi",
                    blok_stan=f"Blok {chr(65 + (i % 4))}-{i:02d}",
                    no_telepon=f"0812-9900-{i:04d}",
                    status_izin="100% Berizin Pemkab"
                ))
            db.add_all(kios_samples)
            db.commit()
            print("Data 24 Kios Mitra Binaan siap.")

        # E. SEEDING PEMBARUAN TERKINI DATA HARGA PASAR (Tabel Gambar 2 & Total 42 Catatan Hari Ini)
        survei_count = db.query(models.SurveiHarga).count()
        if survei_count == 0:
            # 4 Baris utama persis seperti yang ada pada Gambar 2:
            items_gambar = [
                models.SurveiHarga(
                    nama_komoditas="Beras Medium (IR 64)",
                    kualitas_mutu="Kualitas Bulog Premium",
                    kategori="KEBUTUHAN POKOK",
                    nama_kios="Kios Bu Siti",
                    lokasi_pasar="Pasar Babat",
                    blok_stan="Blok A-12",
                    harga=13000.0,
                    satuan="kg",
                    status_het="Sesuai HET",
                    waktu_survei="08:45 WIB",
                    metode_input="Input Langsung",
                    status_verifikasi="Terverifikasi",
                    petugas_nama="Hendra Setiawan"
                ),
                models.SurveiHarga(
                    nama_komoditas="Gula Pasir Curah",
                    kualitas_mutu="Tebu Kristal Putih",
                    kategori="BAHAN BAKU",
                    nama_kios="Kios Barokah",
                    lokasi_pasar="Pasar Sukodadi",
                    blok_stan="Kav. B-04",
                    harga=18000.0,
                    satuan="kg",
                    status_het="Stabil",
                    waktu_survei="09:12 WIB",
                    metode_input="Modul NLP",
                    status_verifikasi="Terverifikasi",
                    petugas_nama="Hendra Setiawan"
                ),
                models.SurveiHarga(
                    nama_komoditas="Minyak Goreng Sawit",
                    kualitas_mutu="Minyakita Kemasan 1L",
                    kategori="MINYAK GORENG",
                    nama_kios="Kios Makmur",
                    lokasi_pasar="Pasar Babat",
                    blok_stan="Stan Sayur 3",
                    harga=17500.0,
                    satuan="liter",
                    status_het="+12% di atas HET",
                    waktu_survei="09:28 WIB",
                    metode_input="Modul NLP",
                    status_verifikasi="Menunggu Cek",  # 1 dari 3 pending validasi
                    petugas_nama="Hendra Setiawan"
                ),
                models.SurveiHarga(
                    nama_komoditas="Cabai Rawit Merah",
                    kualitas_mutu="Kualitas Grade Super",
                    kategori="BUMBU DAPUR",
                    nama_kios="Kios Sumber Rejeki",
                    lokasi_pasar="Pasar Babat",
                    blok_stan="Blok C-01",
                    harga=42000.0,
                    satuan="kg",
                    status_het="Turun Rp2.000",
                    waktu_survei="07:50 WIB",
                    metode_input="Input Langsung",
                    status_verifikasi="Terverifikasi",
                    petugas_nama="Hendra Setiawan"
                ),
                # 2 Catatan tambahan Menunggu Cek agar total Pending Validasi = 3 (sesuai Gambar 2)
                models.SurveiHarga(
                    nama_komoditas="Cabai Merah Keriting",
                    kualitas_mutu="Segar Petik",
                    kategori="BUMBU DAPUR",
                    nama_kios="Kios Berkah Tani",
                    lokasi_pasar="Pasar Sukodadi",
                    blok_stan="Blok B-11",
                    harga=48500.0,
                    satuan="kg",
                    status_het="+15% di atas HET",
                    waktu_survei="09:15 WIB",
                    metode_input="Modul NLP",
                    status_verifikasi="Menunggu Cek",
                    petugas_nama="Hendra Setiawan"
                ),
                models.SurveiHarga(
                    nama_komoditas="Daging Ayam Broiler",
                    kualitas_mutu="Karkas Segar",
                    kategori="PROTEIN HEWANI",
                    nama_kios="Kios Podomoro",
                    lokasi_pasar="Pasar Sukodadi",
                    blok_stan="Blok A-05",
                    harga=39000.0,
                    satuan="kg",
                    status_het="+14% di atas HET",
                    waktu_survei="09:25 WIB",
                    metode_input="Input Langsung",
                    status_verifikasi="Menunggu Cek",
                    petugas_nama="Hendra Setiawan"
                ),
            ]

            # Tambahkan catatan survei hingga total 42 catatan (sesuai metrik '42 Catatan')
            for i in range(len(items_gambar) + 1, 43):
                jam = f"0{7 + (i // 15)}:{(i * 7) % 60:02d} WIB"
                items_gambar.append(models.SurveiHarga(
                    nama_komoditas="Bawang Merah Allium" if i % 3 == 0 else ("Telur Ayam Ras" if i % 3 == 1 else "Beras Medium (IR 64)"),
                    kualitas_mutu="Grade Standar Pemkab",
                    kategori="BUMBU DAPUR" if i % 3 == 0 else "PROTEIN HEWANI",
                    nama_kios=f"Kios Pangan Mitra {(i % 24) + 1}",
                    lokasi_pasar="Pasar Babat" if i % 2 == 0 else "Pasar Sukodadi",
                    blok_stan=f"Blok {chr(65 + (i % 4))}-{(i % 20) + 1:02d}",
                    harga=28000.0 if i % 3 == 0 else (28500.0 if i % 3 == 1 else 13000.0),
                    satuan="kg",
                    status_het="Sesuai HET",
                    waktu_survei=jam,
                    metode_input="Modul NLP" if i % 2 == 0 else "Input Langsung",
                    status_verifikasi="Terverifikasi",
                    petugas_nama="Hendra Setiawan"
                ))

            db.add_all(items_gambar)
            db.commit()
            print(f"BERHASIL! Ditambahkan {len(items_gambar)} catatan survei harga harian.")
        else:
            print(f"Database sudah memiliki {survei_count} catatan survei harga.")

    finally:
        db.close()


if __name__ == "__main__":
    init_db()
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from database import Base

class Admin(Base):
    """
    Model Akun Petugas / Administrator DKPP Lamongan.
    Mendukung login menggunakan Username, Email, atau NIP.
    """
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    nip = Column(String(50), unique=True, nullable=True, index=True)
    nama_lengkap = Column(String(100), default="Hendra Setiawan")
    jabatan = Column(String(100), default="Petugas Enumerator")
    wilayah_pantau = Column(String(150), default="Pasar Babat & Pasar Sukodadi")
    status_verifikasi = Column(String(50), default="Online & Terverifikasi DKPP")
    avatar = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.now)


class Komoditas(Base):
    """
    Master Data 18 Bahan Pokok Standar NFA & Bapanas serta Katalog Komoditas Kios.
    """
    __tablename__ = "komoditas"

    id = Column(Integer, primary_key=True, index=True)
    nama_bahan = Column(String(100), nullable=False, index=True)
    kategori = Column(String(50), nullable=True)  # Kebutuhan Pokok, Bumbu Dapur, Protein Hewani, dll
    harga = Column(Float, nullable=False)
    satuan = Column(String(20), default="kg")
    lokasi = Column(String(100), nullable=True)
    kualitas_mutu = Column(String(100), nullable=True)  # misal: Kualitas Bulog Premium
    het = Column(Float, nullable=True)  # Harga Eceran Tertinggi
    toleransi_fluktuasi = Column(Float, default=5.0)  # Toleransi deviasi harga (%)
    is_active = Column(Boolean, default=True)

    # Relasi / Atribut Katalog Kios
    kios_id = Column(Integer, ForeignKey("kios.id"), nullable=True, index=True)
    varian_keterangan = Column(String(100), nullable=True)  # Keterangan spesifik (cth: Grade A, Kemasan 1L)
    stok_fisik = Column(String(50), default="Tersedia")      # Status Stok Fisik
    status_label = Column(String(50), default="Stabil")      # Label Status (Sesuai HET, Stabil, Tersedia, dll)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Pasar(Base):
    """
    Master Data 5 Titik Wilayah Pantau Resmi Kabupaten Lamongan:
    Babat, Sukodadi, Sidoharjo, Brondong, Blimbing.
    """
    __tablename__ = "pasar"

    id = Column(Integer, primary_key=True, index=True)
    nama_pasar = Column(String(100), nullable=False, index=True)
    alamat = Column(String(255), nullable=True)
    kecamatan = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    kontak = Column(String(50), nullable=True)
    jam_operasional = Column(String(50), nullable=True)
    deskripsi = Column(String(255), nullable=True)
    radius_gps_aktif = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)


class Kios(Base):
    """
    Data Kios Mitra Resmi (Direktori 48 Kios Terdaftar di Lamongan).
    """
    __tablename__ = "kios"

    id = Column(Integer, primary_key=True, index=True)
    nama_kios = Column(String(100), nullable=False)
    pemilik = Column(String(100), nullable=True)
    lokasi_pasar = Column(String(100), nullable=False)
    blok_stan = Column(String(50), nullable=True)  # misal: Blok A-12, Stan Sayur 3
    alamat_lengkap = Column(String(255), nullable=True)  # Alamat tersambung pasar
    jam_buka = Column(String(50), default="06:00 - 16:00 WIB")
    no_telepon = Column(String(20), nullable=True)
    status_izin = Column(String(50), default="100% Berizin Pemkab")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    @property
    def blok(self):
        """Getter kompatibilitas kios.blok -> blok_stan"""
        return self.blok_stan

    @blok.setter
    def blok(self, val):
        self.blok_stan = val


class SurveiHarga(Base):
    """
    Pembaruan Terkini Data Harga Pasar:
    Catatan survei lapangan harian oleh enumerator / petugas dari kios mitra.
    """
    __tablename__ = "survei_harga"

    id = Column(Integer, primary_key=True, index=True)
    nama_komoditas = Column(String(100), nullable=False, index=True)
    kualitas_mutu = Column(String(100), nullable=True)   # misal: Kualitas Bulog Premium, Minyakita Kemasan 1L
    kategori = Column(String(50), nullable=True)
    nama_kios = Column(String(100), nullable=False)        # misal: Kios Bu Siti, Kios Makmur
    lokasi_pasar = Column(String(100), nullable=False)     # misal: Pasar Babat, Pasar Sukodadi
    blok_stan = Column(String(50), nullable=True)          # misal: Blok A-12, Stan Sayur 3
    harga = Column(Float, nullable=False)                  # Harga terinput
    satuan = Column(String(20), default="kg")              # /kg, /liter
    status_het = Column(String(50), default="Sesuai HET")  # Sesuai HET, Stabil, +12% di atas HET, Turun Rp2.000
    waktu_survei = Column(String(50), nullable=True)       # misal: 08:45 WIB
    metode_input = Column(String(50), default="Input Langsung")  # "Input Langsung" atau "Modul NLP"
    status_verifikasi = Column(String(50), default="Terverifikasi")  # "Terverifikasi", "Menunggu Cek", "Ditolak"
    catatan = Column(String(255), nullable=True)
    petugas_nama = Column(String(100), default="Hendra Setiawan")
    created_at = Column(DateTime, default=datetime.now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    detail = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.now)


class KiosHarga(Base):
    """
    Data Kios Terdekat untuk fitur 'Cari Harga' Publik.
    Berisi harga komoditas terkini, info GPS, dan status kios.
    """
    __tablename__ = "kios_harga"

    id = Column(Integer, primary_key=True, index=True)
    nama_kios = Column(String(100), nullable=False, index=True)
    nama_pasar = Column(String(100), nullable=False, index=True)
    kecamatan = Column(String(100), nullable=True)             # misal: Babat, Sidoharjo
    blok_stan = Column(String(50), nullable=True)              # misal: Los Beras Blok B-12
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    jarak_km = Column(Float, nullable=True)                    # Jarak dari titik GPS user (dinamis)
    estimasi_tempuh_menit = Column(Integer, nullable=True)     # Estimasi waktu tempuh (menit)
    metode_tempuh = Column(String(20), default="jalan")        # "jalan", "mobil"

    # Komoditas & Harga
    nama_komoditas = Column(String(100), nullable=False, index=True)
    varietas = Column(String(100), nullable=True)              # misal: Medium IR 64, Premium Mentik Wangi
    kemasan = Column(String(100), nullable=True)               # misal: Kemasan Curah & 5 kg
    harga_terkini = Column(Float, nullable=False)
    satuan = Column(String(20), default="kg")
    harga_het = Column(Float, nullable=True)                   # HET Nasional referensi
    selisih_het = Column(Float, nullable=True)                 # Selisih terhadap HET (+/- Rp)
    status_het_label = Column(String(50), nullable=True)       # "di bawah HET", "Sesuai HET", "di atas HET"

    # Status & Sertifikasi
    is_binaan_dkpp = Column(Boolean, default=False)            # Binaan DKPP resmi
    badge_label = Column(String(50), nullable=True)            # "HARGA TERMURAH", "PALING DEKAT", dll
    badge_warna = Column(String(20), nullable=True)            # "hijau", "biru", "merah"
    jam_buka = Column(String(50), nullable=True)               # misal: "Buka s/d 16.30 WIB"
    is_buka_sekarang = Column(Boolean, default=True)

    # Navigasi & Rute
    google_maps_url = Column(Text, nullable=True)              # Link navigasi Google Maps
    osm_url = Column(Text, nullable=True)                      # Alternatif OSM / OpenStreetMap

    # Metadata
    petugas_nama = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    created_at = Column(DateTime, default=datetime.now)


class HETNasional(Base):
    """
    Harga Eceran Tertinggi (HET) Nasional per komoditas.
    Digunakan sebagai referensi perbandingan harga kios.
    """
    __tablename__ = "het_nasional"

    id = Column(Integer, primary_key=True, index=True)
    nama_komoditas = Column(String(100), nullable=False, index=True)
    varietas = Column(String(100), nullable=True)              # misal: Medium, Premium
    harga_het = Column(Float, nullable=False)                  # HET dalam Rupiah / kg
    satuan = Column(String(20), default="kg")
    sumber = Column(String(100), nullable=True)                # misal: "Permendag 2024", "Bapanas"
    berlaku_mulai = Column(String(50), nullable=True)          # misal: "Januari 2024"
    zona = Column(String(50), default="Nasional")              # "Nasional", "Jawa-Bali"
    is_aktif = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
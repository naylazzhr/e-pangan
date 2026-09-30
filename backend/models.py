from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
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
    Master Data 18 Bahan Pokok Standar NFA & Bapanas.
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
    created_at = Column(DateTime, default=datetime.now)


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
    no_telepon = Column(String(20), nullable=True)
    status_izin = Column(String(50), default="100% Berizin Pemkab")
    is_active = Column(Boolean, default=True)


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
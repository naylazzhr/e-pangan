from typing import Optional, List, Dict
from pydantic import BaseModel, Field


# ==============================================================================
# SKEMA AUTENTIKASI PETUGAS & ADMIN
# ==============================================================================

class LoginPetugasRequest(BaseModel):
    # Mendukung input Email, NIP, atau Username
    identifier: Optional[str] = Field(None, example="petugas.babat@lamongankab.go.id")
    username: Optional[str] = None  # Alternatif field
    password: str = Field(..., example="admin123")
    remember_me: Optional[bool] = False


class PetugasResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    nip: Optional[str] = None
    nama_lengkap: Optional[str] = None
    jabatan: Optional[str] = None
    wilayah_pantau: Optional[str] = None
    status_verifikasi: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: PetugasResponse


# ==============================================================================
# SKEMA SURVEI HARGA HARIAN & VALIDASI SATGAS
# ==============================================================================

class SurveiHargaCreate(BaseModel):
    nama_komoditas: str = Field(..., example="Beras Medium (IR 64)")
    kualitas_mutu: Optional[str] = Field(None, example="Kualitas Bulog Premium")
    kategori: Optional[str] = Field("KEBUTUHAN POKOK", example="KEBUTUHAN POKOK")
    nama_kios: str = Field(..., example="Kios Bu Siti")
    lokasi_pasar: str = Field(..., example="Pasar Babat")
    blok_stan: Optional[str] = Field(None, example="Blok A-12")
    harga: float = Field(..., gt=0, example=13000.0)
    satuan: str = Field("kg", example="kg")
    status_het: Optional[str] = Field("Sesuai HET", example="Sesuai HET")
    waktu_survei: Optional[str] = Field(None, example="08:45 WIB")
    metode_input: Optional[str] = Field("Input Langsung", example="Input Langsung")
    status_verifikasi: Optional[str] = Field("Terverifikasi", example="Terverifikasi")
    catatan: Optional[str] = None


class SurveiHargaUpdate(BaseModel):
    harga: Optional[float] = None
    status_het: Optional[str] = None
    status_verifikasi: Optional[str] = None
    catatan: Optional[str] = None


# ==============================================================================
# SKEMA KIOS & KATALOG KOMODITAS
# ==============================================================================

class KiosCreate(BaseModel):
    nama_kios: str
    pemilik: Optional[str] = None
    lokasi_pasar: str
    blok_stan: Optional[str] = None
    alamat_lengkap: Optional[str] = None
    jam_buka: Optional[str] = "06:00 - 16:30 WIB"
    no_telepon: Optional[str] = None


class KiosUpdate(BaseModel):
    nama_kios: Optional[str] = None
    pemilik: Optional[str] = None
    lokasi_pasar: Optional[str] = None
    blok_stan: Optional[str] = None
    blok: Optional[str] = None
    alamat_lengkap: Optional[str] = None
    jam_buka: Optional[str] = None
    no_telepon: Optional[str] = None
    status_izin: Optional[str] = None
    is_active: Optional[bool] = None


class KatalogKomoditasCreate(BaseModel):
    nama_bahan: str = Field(..., description="Nama komoditas/bahan pangan")
    harga: float = Field(..., gt=0, description="Harga satuan dalam Rupiah")
    satuan: str = Field("kg", description="Satuan ukuran, misal: kg, liter, butir")
    status_label: str = Field("Tersedia", description="Status ketersediaan / status HET (Stabil, Sesuai HET, Tersedia, Stok Terbatas)")
    varian_keterangan: Optional[str] = Field(None, description="Keterangan mutu/varian produk (cth: Kualitas Bulog Premium, Grade A)")
    stok_fisik: Optional[str] = Field("Tersedia", description="Keterangan stok fisik (cth: Tersedia, Melimpah, Stok Terbatas)")
    kategori: Optional[str] = Field("Kebutuhan Pokok", description="Kategori komoditas")


class KatalogKomoditasUpdate(BaseModel):
    nama_bahan: Optional[str] = None
    harga: Optional[float] = Field(None, gt=0)
    satuan: Optional[str] = None
    status_label: Optional[str] = None
    varian_keterangan: Optional[str] = None
    stok_fisik: Optional[str] = None
    kategori: Optional[str] = None


# ==============================================================================
# SKEMA CARI HARGA & KIOS HARGA PUBLIK
# ==============================================================================

class KiosInfo(BaseModel):
    id: int
    nama_kios: str
    lokasi_pasar: str
    is_binaan_resmi: bool
    jarak_km: Optional[float] = None


class HasilPencarian(BaseModel):
    id_komoditas: int
    nama_bahan: str
    harga: float
    satuan: str
    kios: KiosInfo
    selisih_het: float


class RingkasanHarga(BaseModel):
    harga_terendah: float
    harga_tertinggi: float
    rata_rata: float
    het_nasional: float
    peluang_hemat: float


class SmartSearchResponse(BaseModel):
    ringkasan: RingkasanHarga
    sebaran_pasar: Dict[str, float]
    total_hasil: int
    data: List[HasilPencarian]


class KiosHargaCreate(BaseModel):
    nama_kios: str
    nama_pasar: str
    kecamatan: Optional[str] = None
    blok_stan: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    estimasi_tempuh_menit: Optional[int] = None
    metode_tempuh: Optional[str] = "jalan"
    nama_komoditas: str
    varietas: Optional[str] = None
    kemasan: Optional[str] = None
    harga_terkini: float = Field(..., gt=0)
    satuan: str = "kg"
    harga_het: Optional[float] = None
    is_binaan_dkpp: bool = False
    badge_label: Optional[str] = None
    badge_warna: Optional[str] = None
    jam_buka: Optional[str] = None
    is_buka_sekarang: bool = True
    google_maps_url: Optional[str] = None
    osm_url: Optional[str] = None


class KiosHargaUpdate(BaseModel):
    harga_terkini: Optional[float] = None
    jam_buka: Optional[str] = None
    is_buka_sekarang: Optional[bool] = None
    kemasan: Optional[str] = None
    is_binaan_dkpp: Optional[bool] = None
    badge_label: Optional[str] = None
    badge_warna: Optional[str] = None
    google_maps_url: Optional[str] = None
    osm_url: Optional[str] = None


class HETNasionalCreate(BaseModel):
    nama_komoditas: str
    varietas: Optional[str] = None
    harga_het: float = Field(..., gt=0)
    satuan: str = "kg"
    sumber: Optional[str] = "Bapanas"
    berlaku_mulai: Optional[str] = None
    zona: str = "Nasional"


# ==============================================================================
# SKEMA MASTER KOMODITAS & PASAR
# ==============================================================================

class KomoditasCreate(BaseModel):
    nama_bahan: str
    kategori: Optional[str] = None
    harga: float
    satuan: str = "kg"
    lokasi: Optional[str] = None
    kualitas_mutu: Optional[str] = None
    het: Optional[float] = None
    toleransi_fluktuasi: Optional[float] = 5.0


class PasarCreate(BaseModel):
    nama_pasar: str
    alamat: Optional[str] = None
    kecamatan: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    kontak: Optional[str] = None
    jam_operasional: Optional[str] = None
    deskripsi: Optional[str] = None


# ==============================================================================
# SKEMA SMART BUDGETING
# ==============================================================================

class BudgetingRequest(BaseModel):
    budget: float = Field(..., gt=0)
    lokasi_pasar: Optional[str] = None
    kategori_pilihan: Optional[List[str]] = None


# ==============================================================================
# SKEMA MODUL SUARA NLP
# ==============================================================================

class NLPParseRequest(BaseModel):
    transcript: str = Field(
        ...,
        example="Pasar Babat Kios Makmur, Miyak Goreng limolas ewu sak liter, Beras IR Enam puluh empat Telulas ewu sak kilo"
    )


class NLPSubmitRequest(BaseModel):
    transcript: str
    simpan_langsung: bool = True


class WhisperTranscriptResponse(BaseModel):
    status: str
    nama_file: str
    durasi_detik: Optional[float] = None
    bahasa_terdeteksi: Optional[str] = None
    transkrip: str
    akurasi_nlp: float
    pasar: str
    kios: str
    items: List[dict]
    harga_terdeteksi: List[str]

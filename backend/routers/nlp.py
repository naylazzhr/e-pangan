import os
import tempfile
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

import models
from database import get_db
import nlp_parser
from schemas import NLPParseRequest, NLPSubmitRequest
from routers.auth import get_admin_sekarang

router = APIRouter(tags=["Modul Suara NLP"])

# ==============================================================================
# INISIALISASI WHISPER MODEL (LAZY LOAD - dimuat saat pertama kali digunakan)
# ==============================================================================
_whisper_model = None

def get_whisper_model():
    """Lazy-load Whisper model 'small' agar server tidak lambat saat startup."""
    global _whisper_model
    if _whisper_model is None:
        try:
            # pyrefly: ignore [missing-import]
            import whisper
            _whisper_model = whisper.load_model("small")
        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="Modul Whisper belum terinstal. Jalankan: pip install openai-whisper"
            )
    return _whisper_model

ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a", ".webm", ".flac", ".mp4", ".mpeg"}
ALLOWED_AUDIO_CONTENT_TYPES = {
    "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
    "audio/x-m4a", "audio/webm", "audio/flac", "video/webm",
    "video/mp4", "application/octet-stream"
}


# ==============================================================================
# ENDPOINT MODUL INPUT CEPAT SUARA (NLP ENUMERATOR)
# ==============================================================================

@router.post("/nlp/parse-suara")
def parse_suara_lapangan(req: NLPParseRequest):
    """
    Fitur Inovasi DKPP: Model Bahasa Daerah Jawa Timur / Lamongan.
    Menerima transkrip kalimat percakapan tawar-menawar pasar biasa dan memetakan
    nama komoditas, pedagang/kios, pasar rujukan, serta estimasi harga.
    """
    result = nlp_parser.parse_suara_lapangan(req.transcript)
    return result


@router.post("/nlp/submit-suara")
def submit_suara_lapangan(
    req: NLPSubmitRequest,
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """
    Mengurai transkrip suara sekaligus langsung menyimpannya ke tabel survei harian
    dengan label metode_input='Modul NLP'.
    """
    parsed = nlp_parser.parse_suara_lapangan(req.transcript)
    saved_records = []

    now_str = datetime.now().strftime("%H:%M WIB")

    for item in parsed.get("items", []):
        entry = models.SurveiHarga(
            nama_komoditas=item["nama_komoditas"],
            kualitas_mutu=item.get("kualitas_mutu"),
            kategori=item.get("kategori"),
            nama_kios=parsed.get("kios", "Kios Makmur"),
            lokasi_pasar=parsed.get("pasar", "Pasar Babat"),
            blok_stan="Stan Sayur",
            harga=item["harga"],
            satuan=item["satuan"],
            status_het=item.get("status_het", "Sesuai HET"),
            waktu_survei=now_str,
            metode_input="Modul NLP",
            status_verifikasi="Terverifikasi",
            petugas_nama=current_admin.nama_lengkap or "Hendra Setiawan"
        )
        db.add(entry)
        saved_records.append(entry)

    db.commit()

    return {
        "status": "success",
        "message": f"Berhasil memproses {len(saved_records)} entri komoditas via Modul Suara NLP!",
        "akurasi": parsed.get("akurasi", 98.4),
        "data_tersimpan": [
            {
                "nama_komoditas": s.nama_komoditas,
                "harga": s.harga,
                "satuan": s.satuan,
                "pasar": s.lokasi_pasar,
                "kios": s.nama_kios
            }
            for s in saved_records
        ]
    }


# ==============================================================================
# ENDPOINT VOICE UPLOAD (SPEECH-TO-TEXT via OpenAI Whisper)
# ==============================================================================

@router.post("/nlp/upload-suara")
async def upload_suara_lapangan(
    file: UploadFile = File(..., description="File rekaman suara (MP3, WAV, OGG, M4A, WEBM)"),
):
    """
    Endpoint Upload Rekaman Suara Lapangan (Speech-to-Text):
    1. Validasi format file audio
    2. Transkripsi otomatis via OpenAI Whisper
    3. Parsing NLP untuk mengekstrak: Pasar, Kios, Komoditas, Harga, Satuan, Status HET
    """
    filename = file.filename or "rekaman.wav"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format file tidak didukung: '{ext}'. Format yang diterima: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"
        )

    MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Ukuran file terlalu besar. Maksimum 50 MB."
        )
    if len(audio_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="File audio kosong / tidak valid."
        )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        model = get_whisper_model()
        result = model.transcribe(
            tmp_path,
            language="id",
            task="transcribe",
            fp16=False,
            verbose=False
        )

        transkrip = result.get("text", "").strip()
        bahasa_terdeteksi = result.get("language", "id")

        segments = result.get("segments", [])
        durasi = round(segments[-1]["end"], 2) if segments else None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal memproses file audio: {str(e)}. Pastikan FFmpeg sudah terinstal."
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    if not transkrip:
        return {
            "status": "warning",
            "nama_file": filename,
            "durasi_detik": durasi,
            "bahasa_terdeteksi": bahasa_terdeteksi,
            "transkrip": "",
            "pesan": "Tidak ada teks yang berhasil diekstrak dari rekaman. Pastikan kualitas audio cukup jelas.",
            "akurasi_nlp": 0.0,
            "pasar": "-",
            "kios": "-",
            "items": [],
            "harga_terdeteksi": []
        }

    parsed = nlp_parser.parse_suara_lapangan(transkrip)

    return {
        "status": "success",
        "nama_file": filename,
        "durasi_detik": durasi,
        "bahasa_terdeteksi": bahasa_terdeteksi,
        "transkrip": transkrip,
        "akurasi_nlp": parsed.get("akurasi", 82.0),
        "pasar": parsed.get("pasar", "-"),
        "kios": parsed.get("kios", "-"),
        "items": parsed.get("items", []),
        "harga_terdeteksi": parsed.get("harga_terdeteksi", [])
    }


@router.post("/nlp/upload-submit-suara")
async def upload_dan_submit_suara(
    file: UploadFile = File(..., description="File rekaman suara (MP3, WAV, OGG, M4A, WEBM)"),
    current_admin: models.Admin = Depends(get_admin_sekarang),
    db: Session = Depends(get_db)
):
    """
    Endpoint Upload + Simpan Rekaman Suara Lapangan:
    1. Upload & transkripsi audio via Whisper
    2. Parsing NLP (komoditas, harga, pasar, kios)
    3. Simpan otomatis ke tabel survei_harga dengan metode_input='Voice Upload NLP'
    """
    filename = file.filename or "rekaman.wav"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format file tidak didukung: '{ext}'. Format: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"
        )

    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="File audio kosong / tidak valid.")
    if len(audio_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Ukuran file terlalu besar. Maksimum 50 MB.")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        model = get_whisper_model()
        result = model.transcribe(
            tmp_path,
            language="id",
            task="transcribe",
            fp16=False,
            verbose=False
        )
        transkrip = result.get("text", "").strip()
        bahasa_terdeteksi = result.get("language", "id")
        segments = result.get("segments", [])
        durasi = round(segments[-1]["end"], 2) if segments else None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal memproses file audio: {str(e)}. Pastikan FFmpeg sudah terinstal."
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    if not transkrip:
        raise HTTPException(
            status_code=422,
            detail="Tidak ada teks yang berhasil diekstrak dari rekaman. Pastikan kualitas audio cukup jelas."
        )

    parsed = nlp_parser.parse_suara_lapangan(transkrip)
    saved_records = []
    now_str = datetime.now().strftime("%H:%M WIB")

    for item in parsed.get("items", []):
        entry = models.SurveiHarga(
            nama_komoditas=item["nama_komoditas"],
            kualitas_mutu=item.get("kualitas_mutu"),
            kategori=item.get("kategori"),
            nama_kios=parsed.get("kios", "Kios Makmur"),
            lokasi_pasar=parsed.get("pasar", "Pasar Babat"),
            blok_stan="Stan Sayur",
            harga=item["harga"],
            satuan=item["satuan"],
            status_het=item.get("status_het", "Sesuai HET"),
            waktu_survei=now_str,
            metode_input="Voice Upload NLP",
            status_verifikasi="Terverifikasi",
            petugas_nama=current_admin.nama_lengkap or current_admin.username,
            catatan=f"Transkripsi Whisper ({bahasa_terdeteksi}): {transkrip[:200]}"
        )
        db.add(entry)
        saved_records.append(entry)

    db.commit()

    return {
        "status": "success",
        "message": f"Berhasil memproses & menyimpan {len(saved_records)} entri komoditas dari rekaman suara!",
        "nama_file": filename,
        "durasi_detik": durasi,
        "bahasa_terdeteksi": bahasa_terdeteksi,
        "transkrip": transkrip,
        "akurasi_nlp": parsed.get("akurasi", 82.0),
        "pasar": parsed.get("pasar", "-"),
        "kios": parsed.get("kios", "-"),
        "harga_terdeteksi": parsed.get("harga_terdeteksi", []),
        "data_tersimpan": [
            {
                "nama_komoditas": s.nama_komoditas,
                "harga": s.harga,
                "satuan": s.satuan,
                "pasar": s.lokasi_pasar,
                "kios": s.nama_kios,
                "status_het": s.status_het
            }
            for s in saved_records
        ]
    }

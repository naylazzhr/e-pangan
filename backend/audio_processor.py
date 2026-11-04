import os
import shutil
import subprocess
import tempfile
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("audio_processor")


def is_ffmpeg_available() -> bool:
    """Mengecek ketersediaan binary FFmpeg pada environment sistem."""
    return shutil.which("ffmpeg") is not None


def reduce_noise_and_enhance_audio(
    input_file: str,
    output_file: Optional[str] = None
) -> Dict[str, Any]:
    """
    Modul Reduksi Derau Audio (Noise Reduction) & Speech Enhancement untuk Suasana Pasar Ramai.
    
    Rangkaian Filter Audio DSP (FFmpeg):
    1. High-Pass Filter (f=180Hz): Menghilangkan gemuruh frekuensi rendah, gesekan mikrofon,
       getaran lantai pasar, dan suara knalpot/kendaraan.
    2. Low-Pass Filter (f=3800Hz): Menghilangkan desis frekuensi tinggi, bunyi gesekan logam/pisau,
       dan pantulan gema akustik luar pita suara manusia.
    3. Adaptive FFT De-Noiser (afftdn): Meredam kebisingan latar statis dan desau keramaian pasar
       (crowd murmur/ambient chatter) hingga 18-20 dB.
    4. Dynamic Audio Normalizer (dynaudnorm): Menyeimbangkan dinamika vokal sehingga suara manusia
       yang diucapkan pelan atau berjarak tetap terdengar jernih dan tegas tanpa distorsi.
    5. Standarisasi Format Whisper: Di-resample ke 16.000 Hz, mono channel, 16-bit PCM WAV.
    """
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"File audio input tidak ditemukan: {input_file}")

    if not output_file:
        tmp_clean = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        output_file = tmp_clean.name
        tmp_clean.close()

    if not is_ffmpeg_available():
        logger.warning("FFmpeg tidak ditemukan di sistem. Melewati proses reduksi derau audio.")
        return {
            "success": False,
            "clean_audio_path": input_file,
            "noise_reduction_applied": False,
            "message": "FFmpeg tidak tersedia, menggunakan audio asli tanpa reduksi derau.",
            "filters": "None"
        }

    # Audio Filter Chain optimal untuk percakapan di area bising/pasar tradisional
    # - highpass=f=180: potong rumble frekuensi rendah
    # - lowpass=f=3800: potong desis frekuensi tinggi
    # - afftdn=nr=18:nf=-25:tn=1: reduksi derau FFT adaptif
    # - dynaudnorm=f=120:g=15:m=10.0: penguatan suara manusia dinamis
    filter_chain = (
        "highpass=f=180,"
        "lowpass=f=3800,"
        "afftdn=nr=18:nf=-25:tn=1,"
        "dynaudnorm=f=120:g=15:m=10.0"
    )

    cmd = [
        "ffmpeg",
        "-y",                   # Overwrite output jika sudah ada
        "-i", input_file,       # Input audio
        "-af", filter_chain,    # Audio filter chain
        "-ar", "16000",         # 16 kHz sample rate (standar OpenAI Whisper)
        "-ac", "1",             # Mono channel
        "-c:a", "pcm_s16le",    # 16-bit PCM WAV
        output_file
    ]

    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=45
        )
        if proc.returncode == 0 and os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            return {
                "success": True,
                "clean_audio_path": output_file,
                "noise_reduction_applied": True,
                "filters": "Highpass (180Hz) + Lowpass (3800Hz) + FFT De-Noise (afftdn) + Dynamic Speech Normalizer (dynaudnorm)",
                "sample_rate": 16000,
                "channels": 1,
                "file_size_bytes": os.path.getsize(output_file),
                "message": "Reduksi derau audio berhasil diterapkan. Suara manusia diisolasi dan diperjelas."
            }
        else:
            logger.warning(f"FFmpeg error ({proc.returncode}): {proc.stderr[:200]}")
            return {
                "success": False,
                "clean_audio_path": input_file,
                "noise_reduction_applied": False,
                "message": f"Gagal memproses filter audio: {proc.stderr[:100]}",
                "filters": "None"
            }
    except Exception as e:
        logger.error(f"Eksepsi saat eksekusi reduksi derau audio: {str(e)}")
        return {
            "success": False,
            "clean_audio_path": input_file,
            "noise_reduction_applied": False,
            "message": f"Terjadi kesalahan: {str(e)}",
            "filters": "None"
        }


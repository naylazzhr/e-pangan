import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
from database import get_db
from schemas import LoginPetugasRequest, PetugasResponse, TokenResponse

router = APIRouter(tags=["Autentikasi"])

# ==============================================================================
# KONFIGURASI KEAMANAN & AUTENTIKASI (JWT + BCRYPT)
# ==============================================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "kunci_rahasia_epangan_super_aman_lamongan_2025_secure_key_123456789"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Sesi aktif 24 jam

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def hash_password(password: str) -> str:
    """Meng-hash password menggunakan library bcrypt langsung."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Memverifikasi kecocokan password teks biasa dengan hash di database."""
    pwd_bytes = plain_password.encode("utf-8")[:72]
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Membuat JWT token dengan masa kedaluwarsa."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_admin_sekarang(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.Admin:
    """
    Fungsi 'Satpam' Otorisasi:
    Memverifikasi token JWT dan memastikan identitas petugas/admin terdaftar di database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Akses ditolak: Token tidak valid atau sesi login telah berakhir.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesi login telah kedaluwarsa, silakan login ulang.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exception

    admin = db.query(models.Admin).filter(models.Admin.username == username).first()
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akun admin/petugas tidak ditemukan atau telah dihapus.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return admin


# ==============================================================================
# ENDPOINT AUTENTIKASI PETUGAS & ADMIN
# ==============================================================================

@router.post("/auth/login", response_model=TokenResponse)
def login_petugas(creds: LoginPetugasRequest, db: Session = Depends(get_db)):
    """
    Pintu Masuk Akun Petugas Lapangan:
    Menerima Email / NIP / Username dan Kata Sandi.
    Contoh: petugas.babat@lamongankab.go.id / admin123
    """
    ident = (creds.identifier or creds.username or "").strip()
    if not ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email, NIP, atau Username wajib diisi!"
        )

    # Bersihkan spasi NIP untuk pencocokan fleksibel
    clean_ident_nip = re.sub(r"\s+", "", ident)

    # Cari petugas berdasarkan username, email, atau NIP
    admin = db.query(models.Admin).filter(
        or_(
            models.Admin.username == ident,
            models.Admin.email == ident,
            models.Admin.nip == ident,
            models.Admin.nip == clean_ident_nip
        )
    ).first()

    # Jika pencarian tepat belum menemukan, cari NIP tanpa spasi di database
    if not admin:
        all_admins = db.query(models.Admin).all()
        for a in all_admins:
            if a.nip and re.sub(r"\s+", "", a.nip) == clean_ident_nip:
                admin = a
                break

    if not admin or not verify_password(creds.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/NIP/Username atau Password salah! Akses ditolak karena akun tidak terdaftar.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": admin.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": admin.id,
            "username": admin.username,
            "email": admin.email or "petugas.babat@lamongankab.go.id",
            "nip": admin.nip or "19850412 201001 1 014",
            "nama_lengkap": admin.nama_lengkap or "Hendra Setiawan",
            "jabatan": admin.jabatan or "Petugas Enumerator",
            "wilayah_pantau": admin.wilayah_pantau or "Pasar Babat & Pasar Sukodadi",
            "status_verifikasi": admin.status_verifikasi or "Online & Terverifikasi DKPP"
        }
    }


@router.post("/login", response_model=TokenResponse)
def login_petugas_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login via Form (OAuth2PasswordRequestForm) untuk dokumentasi Swagger UI (/docs)."""
    ident = form_data.username.strip()
    admin = db.query(models.Admin).filter(
        or_(
            models.Admin.username == ident,
            models.Admin.email == ident,
            models.Admin.nip == ident
        )
    ).first()

    if not admin or not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kredensial login petugas tidak valid!",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": admin.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": admin.id,
            "username": admin.username,
            "email": admin.email,
            "nip": admin.nip,
            "nama_lengkap": admin.nama_lengkap,
            "jabatan": admin.jabatan,
            "wilayah_pantau": admin.wilayah_pantau,
            "status_verifikasi": admin.status_verifikasi
        }
    }


@router.get("/auth/me", response_model=PetugasResponse)
def get_profil_petugas(current_admin: models.Admin = Depends(get_admin_sekarang)):
    """Mengambil data profil petugas/admin yang sedang login."""
    return current_admin

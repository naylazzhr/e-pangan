import bcrypt
from database import SessionLocal, engine
import models

# Pastikan tabel sudah dibuat di database
models.Base.metadata.create_all(bind=engine)

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

# ==============================================================================
# DAFTAR 2 AKUN ADMIN / PETUGAS RESMI E-PANGAN LAMONGAN
# ==============================================================================
DAFTAR_ADMIN = [
    {
        "nama_lengkap": "Intan Permatasari",
        "username": "intan_permatasari",
        "email": "petugas.babat@lamongankab.go.id",
        "nip": "19850412 201001 1014",
        "jabatan": "Petugas Enumerator",
        "wilayah_pantau": "Pasar Babat & Pasar Sukodadi",
        "status_verifikasi": "Online & Terverifikasi DKPP",
        "password": "admin123"
    },
    {
        "nama_lengkap": "Hendra Setiawan",
        "username": "nayla_santika",
        "email": "nayla.santika@lamongankab.go.id",
        "nip": "19820516 200801 1 009",
        "jabatan": "Surveyor Supervisor / Admin DKPP",
        "wilayah_pantau": "Pasar Sidoharjo & Pasar Lamongan",
        "status_verifikasi": "Online & Terverifikasi DKPP",
        "password": "admin123"
    }
]

def sinkronisasi_2_admin():
    db = SessionLocal()
    try:
        print("==================================================")
        print("SINKRONISASI 2 AKUN ADMIN / PETUGAS RESMI")
        print("Sistem E-Pangan Dinas Ketahanan Pangan Lamongan")
        print("==================================================")

        for adm in DAFTAR_ADMIN:
            hashed_pw = hash_password(adm["password"])

            # Cek apakah akun dengan username, email, atau NIP sudah ada
            existing = db.query(models.Admin).filter(
                (models.Admin.username == adm["username"]) |
                (models.Admin.email == adm["email"]) |
                (models.Admin.nip == adm["nip"])
            ).first()

            if existing:
                existing.username = adm["username"]
                existing.email = adm["email"]
                existing.nip = adm["nip"]
                existing.nama_lengkap = adm["nama_lengkap"]
                existing.jabatan = adm["jabatan"]
                existing.wilayah_pantau = adm["wilayah_pantau"]
                existing.status_verifikasi = adm["status_verifikasi"]
                existing.hashed_password = hashed_pw
                db.commit()
                db.refresh(existing)
                print(f"[STATUS: TERPERBARUI] Admin ID {existing.id}: {existing.nama_lengkap}")
            else:
                admin_baru = models.Admin(
                    username=adm["username"],
                    email=adm["email"],
                    nip=adm["nip"],
                    nama_lengkap=adm["nama_lengkap"],
                    jabatan=adm["jabatan"],
                    wilayah_pantau=adm["wilayah_pantau"],
                    status_verifikasi=adm["status_verifikasi"],
                    hashed_password=hashed_pw
                )
                db.add(admin_baru)
                db.commit()
                db.refresh(admin_baru)
                print(f"[STATUS: DIBUAT] Admin Baru ID {admin_baru.id}: {admin_baru.nama_lengkap}")

            print(f"  • Nama Lengkap   : {adm['nama_lengkap']}")
            print(f"  • Username       : {adm['username']}")
            print(f"  • Email          : {adm['email']}")
            print(f"  • NIP            : {adm['nip']}")
            print(f"  • Jabatan        : {adm['jabatan']}")
            print(f"  • Password       : {adm['password']}")
            print("--------------------------------------------------")

        total = db.query(models.Admin).count()
        print(f"TOTAL AKUN ADMIN TERDAFTAR: {total} Akun.")
        print("Kedua admin dapat login dengan Email, NIP, atau Username.")
        print("==================================================")
    finally:
        db.close()

if __name__ == "__main__":
    sinkronisasi_2_admin()
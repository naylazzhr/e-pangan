import models
from database import engine, SessionLocal

def init_db():
    print(f"Menghubungkan ke database: {engine.url}")
    # Membuat seluruh tabel jika belum ada
    models.Base.metadata.create_all(bind=engine)
    print("Tabel database berhasil diverifikasi/dibuat.")

    db = SessionLocal()
    try:
        # Cek apakah tabel masih kosong, jika kosong tambahkan data sampel
        count = db.query(models.Komoditas).count()
        if count == 0:
            sample_data = [
                models.Komoditas(nama_bahan="Beras Medium", kategori="Sembako", harga=14000.0, satuan="kg", lokasi="Pasar Induk"),
                models.Komoditas(nama_bahan="Minyak Goreng Curah", kategori="Sembako", harga=16500.0, satuan="liter", lokasi="Pasar Tradisional"),
                models.Komoditas(nama_bahan="Cabai Merah Keriting", kategori="Sayuran", harga=45000.0, satuan="kg", lokasi="Pasar Kramat Jati"),
                models.Komoditas(nama_bahan="Daging Ayam Broiler", kategori="Daging", harga=38000.0, satuan="kg", lokasi="Pasar Minggu"),
                models.Komoditas(nama_bahan="Telur Ayam Ras", kategori="Peternakan", harga=29000.0, satuan="kg", lokasi="Pasar Senen"),
            ]
            db.add_all(sample_data)
            db.commit()
            print(f"BERHASIL! Ditambahkan {len(sample_data)} data sampel komoditas awal.")
        else:
            print(f"Database sudah memiliki {count} data komoditas.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
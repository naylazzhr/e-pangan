# 🌾 E-Pangan API

**E-Pangan API** adalah layanan backend berbasis RESTful API yang dirancang untuk mencatat, mengelola, dan memantau fluktuasi harga komoditas pangan pokok (seperti sembako, sayuran, daging, telur, dan minyak) di berbagai pasar atau wilayah.

Aplikasi ini dibangun menggunakan framework modern berkinerja tinggi **FastAPI** dan **SQLAlchemy ORM**. Database dikonfigurasi secara mandiri dan fleksibel (default menggunakan **SQLite** bawaan Python, sehingga **tidak memerlukan instalasi XAMPP/MySQL lokal**).

---

## 🚀 Fitur Utama

- **Operasi CRUD Lengkap**: Tambah, lihat, ubah, dan hapus data harga komoditas.
- **Pencarian & Filter**: 
  - Cari nama bahan pangan secara fleksibel (`?search=Beras`).
  - Filter berdasarkan kategori komoditas (`?kategori=Sembako`).
- **Validasi Data Otomatis**: Memanfaatkan **Pydantic** untuk validasi skema data dan tipe data yang aman.
- **Dokumentasi Interaktif Bawaan**: Swagger UI (`/docs`) dan ReDoc (`/redoc`) otomatis aktif.
- **Bebas XAMPP**: Menggunakan database SQLite lokal (`epangan.db`) secara default atau konfigurasi database cloud melalui variabel lingkungan (`.env`).

---

## 📁 Struktur Direktori

```text
epangan/
├── .env                  # Konfigurasi variabel lingkungan lokal (URL Database)
├── .env.example          # Template konfigurasi environment
├── database.py           # Inisialisasi engine SQLAlchemy, session, dan dependency get_db
├── epangan_db.py         # Skrip inisialisasi tabel dan seeding data awal
├── main.py               # Definisi aplikasi FastAPI, skema Pydantic, dan router endpoint
├── models.py             # Definisi model ORM SQLAlchemy (Tabel komoditas)
├── requirements.txt      # Daftar dependensi pustaka Python
└── README.md             # Dokumentasi proyek
```

---

## 🛠️ Persyaratan Sistem

- **Python**: Versi 3.9 atau yang lebih baru
- **OS**: Windows, macOS, atau Linux
- **Tanpa XAMPP**: Tidak memerlukan Apache maupun MySQL XAMPP untuk berjalan.

---

## 📦 Panduan Instalasi & Menjalankan Aplikasi

### 1. Masuk ke Direktori Proyek
Buka terminal (Command Prompt / PowerShell / Bash) di folder proyek:
```bash
cd d:/epangan
```

### 2. Pasang Dependensi
Instal paket-paket Python yang dibutuhkan:
```bash
python -m pip install -r requirements.txt
```

### 3. Konfigurasi Lingkungan (`.env`)
Pastikan berkas `.env` sudah ada. Secara default sudah diarahkan ke SQLite:
```env
DATABASE_URL=sqlite:///./epangan.db
```
*(Opsional: Jika kelak ingin menghubungkan ke database MySQL eksternal atau PostgreSQL cloud seperti Supabase/Neon, Anda hanya perlu mengganti URL di atas).*

### 4. Inisialisasi Database & Data Sampel
Jalankan skrip berikut untuk membuat tabel dan mengisi beberapa data komoditas awal:
```bash
python epangan_db.py
```

### 5. Jalankan Server API
Jalankan server pengembangan menggunakan Uvicorn:
```bash
uvicorn main:app --reload
```
Aplikasi akan aktif di alamat: `http://127.0.0.1:8000`

---

## 📖 Dokumentasi Endpoint API

| Method | Endpoint | Deskripsi | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Cek status server API | - |
| `GET` | `/komoditas` | Menampilkan seluruh data komoditas | `search`, `kategori` |
| `GET` | `/komoditas/{id}` | Mengambil detail komoditas tertentu | - |
| `POST` | `/komoditas` | Menambahkan komoditas baru | - |
| `PUT` | `/komoditas/{id}` | Memperbarui data komoditas tertentu | - |
| `DELETE` | `/komoditas/{id}` | Menghapus komoditas tertentu | - |

---

### Contoh Payload Request

#### 1. Menambah Komoditas Baru (`POST /komoditas`)
**Request Body (JSON):**
```json
{
  "nama_bahan": "Beras Pandan Wangi",
  "kategori": "Sembako",
  "harga": 18000.0,
  "satuan": "kg",
  "lokasi": "Pasar Cikini"
}
```

#### 2. Memperbarui Komoditas (`PUT /komoditas/1`)
**Request Body (JSON):**
```json
{
  "harga": 14500.0
}
```

---

## 🧪 Dokumentasi Interaktif (Swagger UI)

Buka peramban (browser) dan akses:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

Di halaman Swagger UI, Anda dapat langsung menguji setiap endpoint secara visual tanpa memerlukan aplikasi pihak ketiga seperti Postman.

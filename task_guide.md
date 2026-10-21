# 🌾 E-Pangan Lamongan — Task Guide: Perbaikan NLP & Frontend

> **Proyek:** E-Pangan Kabupaten Lamongan (DKPP)
> **Stack:** FastAPI (Python) + React/Vite (JSX)
> **Terakhir diperbarui:** Oktober 2026

---

## 📁 Struktur Proyek

```
e-pangan/
├── backend/
│   ├── main.py                  # Entry point FastAPI
│   ├── models.py                # SQLAlchemy ORM Models
│   ├── schemas.py               # Pydantic Schemas
│   ├── database.py              # Koneksi DB (SQLite)
│   ├── nlp_parser.py            # ⭐ Engine NLP Utama (rule-based)
│   └── routers/
│       ├── nlp.py               # ⭐ Endpoint NLP & Whisper STT
│       ├── search.py            # Cari Harga (publik)
│       ├── pasar.py             # Komparasi Pasar
│       ├── kios.py              # Detail Kios
│       ├── budgeting.py         # Smart Budgeting
│       ├── admin.py             # Dashboard Admin
│       ├── auth.py              # Login/JWT
│       └── satgas.py            # Validasi Satgas
└── frontend/src/
    ├── App.jsx                  # ⭐ Halaman utama & state global
    ├── AdminDashboard.jsx       # ⭐ Dashboard Admin (ada panel NLP)
    ├── CariHarga.jsx            # Cari Harga publik
    ├── KomparasiPasar.jsx       # Perbandingan antar pasar
    ├── SmartBudgetting.jsx      # Smart Budgeting
    ├── DetailKios.jsx           # Detail kios
    ├── api.js                   # Axios/fetch wrapper
    └── App.css                  # Global styles
```

---

## 🧠 Arsitektur NLP Saat Ini

### `nlp_parser.py` — Rule-Based Parser

| Komponen | Mekanisme | Keterbatasan |
|---|---|---|
| **Deteksi Pasar** | `if pasar.lower() in lower_text` | Default ke "Pasar Babat" jika tidak ditemukan |
| **Deteksi Kios** | Regex `kios\s+[a-zA-Z0-9\s]+` | Hanya ambil 2-3 kata, mudah gagal jika format beda |
| **Komoditas** | Keyword matching dari `KOMODITAS_KEYWORDS` | Hanya 8 komoditas, belum cover semua bahan pokok |
| **Harga** | Kamus frasa Jawa (`ANGKA_JAWA_MAP`) + regex digit | Kamus terbatas, tidak support typo/variasi ejaan |
| **Satuan** | Keyword `liter`, `kg`, `kilo`, dll | Tidak fleksibel untuk satuan non-standar |
| **Akurasi NLP** | Hard-coded: `98.4` jika ada item, `82.0` jika tidak | **Tidak mencerminkan akurasi sesungguhnya!** |

### `routers/nlp.py` — Endpoint

| Endpoint | Fungsi |
|---|---|
| `POST /nlp/parse-suara` | Parse teks transkrip → ekstrak data |
| `POST /nlp/submit-suara` | Parse + simpan ke DB (butuh auth admin) |
| `POST /nlp/upload-suara` | Upload audio → Whisper STT → parse NLP |
| `POST /nlp/upload-submit-suara` | Upload + parse + simpan DB (auth required) |

---

## 🎯 TASK LIST: Perbaikan NLP (Backend)

### FASE 1 — Perbaikan Kamus & Komoditas

- [ ] **T1.1** — Tambah komoditas yang hilang ke `KOMODITAS_KEYWORDS` di `nlp_parser.py`
  - Komoditas yang perlu ditambah: Tepung Terigu, Kedelai, Jagung, Bawang Putih, Cabe Merah Keriting, Garam, Ikan Laut (bandeng, lele, nila), Santan
  - File: `backend/nlp_parser.py` baris 74–145
  - Referensi: 18 bahan pokok NFA/Bapanas sesuai model `Komoditas` di `models.py`

- [ ] **T1.2** — Perluas `ANGKA_JAWA_MAP` & `ANGKA_INDO_MAP` untuk angka lebih besar (di atas 50 ribu)
  - Tambah: `enam puluh ribu`, `tujuh puluh ribu`, `delapan puluh ribu`, `seratus ribu`, dst
  - Perluas untuk satuan **per ons**, **per ½ kg**, **per ikat**

- [ ] **T1.3** — Tambah `ANGKA_SINGKAT_MAP` untuk ekspresi singkat seperti `15rb`, `20k`, `Rp13rb`
  ```python
  # Contoh pattern yang perlu di-handle
  "15rb" -> 15000
  "20k"  -> 20000
  "Rp13rb" -> 13000
  ```

---

### FASE 2 — Peningkatan Logika Parsing

- [ ] **T2.1** — Perbaiki deteksi kios agar lebih robust
  - Masalah: `detected_kios` default ke `"Kios Makmur"` yang tidak realistis
  - Solusi: Jika tidak ada pola `kios/stan`, set `detected_kios = None` dan biarkan frontend minta input manual
  - File: `backend/nlp_parser.py` baris 200–211

- [ ] **T2.2** — Perbaiki logika segmentasi kalimat
  - Masalah saat ini: hanya split by koma/titik koma
  - Perlu tambah: split by `"dan"`, `"sama"`, `"terus"`, `"juga"` (kata hubung Jawa/Indonesia)
  ```python
  # Contoh input yang harus bisa di-parse:
  "beras 13000 sama minyak 15000"
  "telur terus bawang merah"
  ```
  - File: `backend/nlp_parser.py` baris 213–214

- [ ] **T2.3** — Hitung akurasi NLP secara dinamis (bukan hard-coded)
  - Formula akurasi bisa berdasarkan: jumlah field yang berhasil terisi / total field yang diharapkan
  - Minimal: pasar ✓, kios ✓, ≥1 komoditas ✓, harga ≥1 terdeteksi ✓
  - File: `backend/nlp_parser.py` baris 280

- [ ] **T2.4** — Tambah confidence score per item
  - Tiap item di `items[]` perlu tambah field `confidence: float` (0.0–1.0)
  - High confidence: keyword exact match + harga terdeteksi
  - Low confidence: keyword partial match / harga fallback ke HET

- [ ] **T2.5** — Handle multi-komoditas dalam satu segmen
  - Contoh: `"minyak sama gula 15000"` → 2 komoditas berbeda namun satu harga
  - Strategi: deteksi komoditas terakhir sebelum harga, atau beri flag `harga_ambigu: true`

---

### FASE 3 — Perbaikan Endpoint NLP

- [ ] **T3.1** — Tambah field `blok_stan` yang dinamis
  - Saat ini hard-coded `"Stan Sayur"` di endpoint `submit-suara` dan `upload-submit-suara`
  - File: `backend/routers/nlp.py` baris 81, 283
  - Solusi: tambah field opsional di `NLPSubmitRequest` schema di `schemas.py`

- [ ] **T3.2** — Endpoint preview sebelum simpan
  - Tambah endpoint `POST /nlp/preview-suara` yang hanya parse tanpa menyimpan ke DB
  - Berguna untuk frontend: user bisa koreksi hasil parse sebelum submit

- [ ] **T3.3** — Tambah support Bahasa Jawa Ngoko lebih luas
  - Identifikasi variasi ejaan yang umum muncul dari Whisper: `"miyak"`, `"mberas"`, `"endog"`, `"brambang"`
  - Tambahkan ke `keywords` masing-masing komoditas

- [ ] **T3.4** — Validasi response schema yang konsisten
  - Endpoint `/upload-suara` dan `/parse-suara` harus return format yang sama
  - Perlu homogenisasi struktur response → gunakan `WhisperTranscriptResponse` schema di `schemas.py`

---

### FASE 4 — Opsional / Future Enhancement

- [ ] **T4.1** *(Advanced)* — Integrasi model ML ringan (IndoBERT/IndoNLP)
  - Pertimbangkan `indobert-lite` untuk NER (Named Entity Recognition) komoditas
  - Bisa jadi fallback jika rule-based gagal deteksi komoditas
  - Dependency: `transformers`, `torch` (cek kompatibilitas server)

- [ ] **T4.2** — Logging transkrip yang gagal diparse
  - Simpan transkrip dengan `items = []` ke tabel tersendiri / AuditLog
  - Berguna untuk melatih kamus baru
  - Gunakan model `AuditLog` di `models.py`

- [ ] **T4.3** — Rate limiting pada endpoint upload suara
  - Endpoint `/nlp/upload-suara` berat (Whisper model)
  - Tambah `slowapi` atau simple counter per IP

---

## 🖥️ TASK LIST: Penyesuaian Frontend

### FASE 1 — Panel NLP di Admin Dashboard

- [ ] **F1.1** — Tampilkan hasil parse NLP dengan state editable
  - Setelah NLP parse, user harus bisa **mengedit** nama kios, pasar, dan harga sebelum submit
  - File: `frontend/src/AdminDashboard.jsx`
  - Komponen: form inline edit per item komoditas

- [ ] **F1.2** — Tampilkan confidence indicator per item
  - Jika backend sudah return `confidence` (T2.4), tampilkan badge warna:
    - 🟢 Tinggi (>0.85): hijau
    - 🟡 Sedang (0.6–0.85): kuning
    - 🔴 Rendah (<0.6): merah dengan peringatan

- [ ] **F1.3** — Perbaiki UI saat kios tidak terdeteksi
  - Jika `kios === null` atau default, tampilkan input teks "Nama Kios" yang wajib diisi
  - Jangan auto-fill dengan `"Kios Makmur"` yang menyesatkan

- [ ] **F1.4** — Loading state saat proses Whisper berjalan
  - Whisper bisa memakan waktu 5–30 detik
  - Tambah skeleton loader / progress bar animasi
  - Tambah pesan: `"Memproses rekaman suara... (estimasi 10-15 detik)"`

---

### FASE 2 — Penyesuaian Halaman Publik

- [ ] **F2.1** — Sinkronisasi `INITIAL_PRODUCTS` di `App.jsx` dengan data DB
  - Data di `frontend/src/App.jsx` baris 43–80 masih **hard-coded**
  - Perlu fetch dari API `/komoditas` atau `/cari-harga` saat load

- [ ] **F2.2** — Tambah indikator "Data dari Survei NLP" pada kartu komoditas
  - Jika `metode_input === "Modul NLP"` atau `"Voice Upload NLP"`, tampilkan badge khusus 🎙️

- [ ] **F2.3** — Tambah feedback visual untuk status HET
  - Gunakan warna yang konsisten dengan `status_het`:
    - `"Sesuai HET"` → hijau
    - `"+X% di atas HET"` → merah/oranye
    - `"Turun RpX"` → biru

---

### FASE 3 — API Layer (`api.js`)

- [ ] **F3.1** — Tambah fungsi API untuk endpoint NLP baru
  - `parseTranscript(transcript)` → `POST /nlp/parse-suara`
  - `submitTranscript(transcript, token)` → `POST /nlp/submit-suara`
  - `uploadAudio(file)` → `POST /nlp/upload-suara`
  - `uploadAndSubmitAudio(file, token)` → `POST /nlp/upload-submit-suara`
  - File: `frontend/src/api.js`

- [ ] **F3.2** — Error handling untuk kegagalan Whisper
  - Handle HTTP 503 (Whisper belum terinstal)
  - Handle HTTP 422 (audio tidak bisa diekstrak)
  - Tampilkan pesan error yang user-friendly dalam Bahasa Indonesia

---

## 🗂️ Urutan Pengerjaan yang Disarankan

```
PRIORITAS TINGGI (core functionality)
─────────────────────────────────────
T1.1 → Tambah komoditas missing
T2.1 → Fix deteksi kios (hapus default misleading)
T2.2 → Perluas segmentasi kalimat
T3.1 → Fix blok_stan hard-coded
F1.3 → UI fix kios tidak terdeteksi
F3.1 → Tambah fungsi API di api.js

PRIORITAS SEDANG (quality improvement)
───────────────────────────────────────
T1.2 → Perluas kamus angka
T1.3 → Support format "15rb", "20k"
T2.3 → Akurasi dinamis
T2.4 → Confidence score per item
T3.2 → Endpoint preview sebelum simpan
F1.1 → Form editable hasil NLP
F1.2 → Confidence indicator UI
F1.4 → Loading state Whisper

PRIORITAS RENDAH (enhancement)
────────────────────────────────
T3.3 → Perluas kosakata Jawa Ngoko
T3.4 → Homogenisasi response schema
T2.5 → Multi-komoditas satu segmen
F2.1 → Sinkronisasi data publik ke DB
F2.2 → Badge sumber data NLP
F2.3 → Warna indikator HET konsisten

FUTURE / OPSIONAL
──────────────────
T4.1 → IndoBERT NER integration
T4.2 → Logging transkrip gagal
T4.3 → Rate limiting upload
```

---

## ⚠️ Catatan Penting

### Hard-coded values yang harus segera diperbaiki:
- `detected_kios = "Kios Makmur"` (nlp_parser.py:201) → set ke `None`, minta input manual
- `blok_stan = "Stan Sayur"` (routers/nlp.py:81, 283) → jadikan field opsional di request body
- `accuracy = 98.4` (nlp_parser.py:280) → hitung secara dinamis

### Peringatan Whisper:
- Whisper model hanya load saat pertama kali digunakan (lazy load)
- Endpoint `/nlp/upload-suara` bisa timeout pada request pertama
- Pertimbangkan pre-warm model saat startup untuk production

### Database:
- SQLite (`epangan.db`) — cocok untuk dev/demo
- Jika traffic naik, pertimbangkan migrasi ke PostgreSQL
- Model yang paling sering diakses NLP: `SurveiHarga`, `AuditLog`

---

## 📋 Format Data NLP (Referensi)

### Input ke `parse_suara_lapangan()`
```
"Pasar Babat Kios Makmur, Miyak Goreng limolas ewu sak liter, Beras IR 13000 sak kilo"
```

### Output saat ini
```json
{
  "status": "success",
  "akurasi": 98.4,
  "transkrip_asli": "...",
  "pasar": "Pasar Babat",
  "kios": "Kios Makmur",
  "items": [
    {
      "nama_komoditas": "Minyak Goreng Sawit",
      "kategori": "MINYAK GORENG",
      "kualitas_mutu": "Minyakita Kemasan 1L",
      "harga": 15000.0,
      "satuan": "liter",
      "status_het": "Sesuai HET",
      "raw_text": "Miyak Goreng limolas ewu sak liter"
    }
  ],
  "harga_terdeteksi": ["Rp 15.000"]
}
```

### Output target setelah perbaikan
```json
{
  "status": "success",
  "akurasi": 87.5,
  "transkrip_asli": "...",
  "pasar": "Pasar Babat",
  "kios": null,
  "items": [
    {
      "nama_komoditas": "Minyak Goreng Sawit",
      "kategori": "MINYAK GORENG",
      "kualitas_mutu": "Minyakita Kemasan 1L",
      "harga": 15000.0,
      "satuan": "liter",
      "status_het": "Sesuai HET",
      "confidence": 0.92,
      "raw_text": "Miyak Goreng limolas ewu sak liter"
    }
  ],
  "harga_terdeteksi": ["Rp 15.000"]
}
```

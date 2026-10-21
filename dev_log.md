# 📓 Dev Log & Panduan Pengembangan — E-Pangan Lamongan

> **File ini** adalah catatan harian pengembangan sekaligus panduan bertahap.
> Update terus setiap kali kamu selesai mengerjakan sesuatu!
> Simpan dengan commit: `git add dev_log.md && git commit -m "update dev log"`

---

## 🕐 Riwayat Commit (Rekap Otomatis dari Git)

| # | Tanggal | Commit | Yang Dikerjakan |
|---|---------|--------|-----------------|
| 1 | 21 Sep 2026 | `f980341` setup pertama | Inisialisasi project, struktur folder, models dasar, frontend awal |
| 2 | 30 Sep 2026 | `8568cfb` perubahan 1 | Bangun NLP parser, epangan_db seed data, App.jsx & App.css besar-besaran |
| 3 | 30 Sep 2026 | `c45ef20` integrasi | Hubungkan frontend → backend: buat `api.js`, proxy Vite, AdminDashboard & AdminLogin |
| 4 | 30 Sep 2026 | `e62a3a6` merge frontend1 | Merge branch frontend1 ke main, AdminDashboard + komponen |
| 5 | 6 Okt 2026 | `ba40db3` backend 2 | **Refactor besar:** Pisah router ke folder `routers/`, buat semua endpoint (auth, kios, search, pasar, nlp, satgas, admin, budgeting), schemas.py, DetailKios.jsx, SmartBudgetting.jsx |
| 6 | 8 Okt 2026 | `a6cc3a1` backend 3 | Tambah `epangan_db.py` seed data baru (219 baris), perkuat `pasar.py` (187 baris), perbaiki search.py, update CariHarga.jsx, DetailKios.jsx, SmartBudgetting.jsx, api.js |
| 7 | 14 Okt 2026 | `f2cf9f7` update backend 4 | Perkuat `pasar.py` (175 baris tambahan → total 498 baris): endpoint komparasi pasar lengkap, tren harga realtime dari DB. Update App.jsx besar-besaran (1165 baris!), App.css, api.js |

---

## ✅ Yang Sudah Selesai Dikerjakan (Backend)

### 🏗️ Infrastruktur & Arsitektur
- [x] Setup FastAPI dengan SQLite (`epangan.db`)
- [x] SQLAlchemy ORM — semua model: `Admin`, `Komoditas`, `Pasar`, `Kios`, `SurveiHarga`, `KiosHarga`, `HETNasional`, `AuditLog`
- [x] Refactor: dari satu file `main.py` monolitik → folder `routers/` modular
- [x] Konfigurasi CORS untuk frontend React/Vite
- [x] Script seed database (`epangan_db.py`, `create_admin.py`)
- [x] Pydantic schemas lengkap di `schemas.py`

### 🔐 Auth
- [x] `POST /auth/login` — login dengan username/email/NIP
- [x] JWT token generation & validation
- [x] `get_admin_sekarang()` dependency untuk proteksi endpoint

### 🏪 Kios
- [x] `GET /kios` — daftar kios dengan filter lokasi & search
- [x] `GET /kios/{id}` — detail kios + katalog komoditas
- [x] `POST /kios` — tambah kios baru (admin)
- [x] `PUT /kios/{id}` — update kios (admin)
- [x] `DELETE /kios/{id}` — hapus kios (admin)

### 🔍 Cari Harga (Publik)
- [x] `GET /cari-harga` — smart search dengan filter komoditas, pasar, varietas, radius GPS, sorting
- [x] `GET /cari-harga/peta-sebaran` — data peta sebaran kios
- [x] Haversine distance calculation untuk fitur "Terdekat"
- [x] HET comparison & label otomatis

### 📊 Komparasi & Tren Pasar
- [x] `GET /pasar` — daftar semua pasar
- [x] `GET /komparasi-pasar` — matriks harga komoditas antar pasar
- [x] `GET /cari-harga/perbandingan-pasar` — perbandingan detail per pasar
- [x] `GET /tren-harga` — tren fluktuasi harga dengan data dari DB + simulasi gelombang

### 💰 Smart Budgeting
- [x] `POST /smart-budgeting` — kalkulasi belanja optimal berdasarkan budget

### 🎙️ Modul NLP Suara
- [x] `nlp_parser.py` — rule-based NLP: deteksi pasar, kios, komoditas (8 jenis), harga (Jawa + Indo + digit), satuan
- [x] `POST /nlp/parse-suara` — parse teks transkrip
- [x] `POST /nlp/submit-suara` — parse + simpan DB
- [x] `POST /nlp/upload-suara` — upload audio → Whisper STT → NLP parse
- [x] `POST /nlp/upload-submit-suara` — upload + parse + simpan DB
- [x] Lazy load Whisper model (tidak memperlambat startup)

### 📋 Admin & Survei
- [x] `GET /admin/dashboard-ringkasan` — statistik dashboard admin
- [x] `GET/POST /survei-harga` — CRUD survei harga harian
- [x] `GET/POST /kios-harga` — CRUD data kios harga publik
- [x] `GET/POST /het-nasional` — master data HET nasional
- [x] Satgas: validasi lapangan, laporan

---

## ✅ Yang Sudah Selesai Dikerjakan (Frontend)

### 🏠 App.jsx (Halaman Utama)
- [x] Routing sederhana antar halaman (state-based)
- [x] Fetch data komoditas, pasar, komparasi, tren dari API
- [x] Kartu komoditas dengan harga & badge
- [x] Filter kategori komoditas
- [x] Modal detail harga per pasar
- [x] Integrasi komponen `SmartBudgetting`, `CariHarga`, `KomparasiPasar`, `DetailKios`

### 🔐 AdminLogin & AdminDashboard
- [x] Form login petugas (username/email/NIP + password)
- [x] JWT token disimpan di localStorage
- [x] Dashboard ringkasan statistik (fetch dari API)
- [x] Panel input survei harga manual
- [x] Panel Modul Suara NLP (text input)

### 🔍 CariHarga.jsx
- [x] Smart search dengan debounce
- [x] Filter pasar & sorting
- [x] Kartu hasil pencarian + info HET
- [x] Integrasi `getCariHarga()` dari api.js

### 🏪 DetailKios.jsx
- [x] Halaman detail kios dari API
- [x] Katalog komoditas kios
- [x] Info jam buka, lokasi, status

### 💰 SmartBudgetting.jsx
- [x] Form input budget + pilihan pasar
- [x] Hasil kalkulasi dari API
- [x] Tampilan rekomendasi belanja

### 📊 KomparasiPasar.jsx
- [x] Tabel matriks harga antar pasar
- [x] Filter kategori

### 🔌 api.js
- [x] `loginPetugas()`, `logoutPetugas()`, `getCurrentUser()`, `isLoggedIn()`
- [x] `getDashboardRingkasan()`
- [x] `getSurveiHarga()`, `tambahSurveiHarga()`, `updateSurveiHarga()`, `hapusSurveiHarga()`
- [x] `getKomoditas()`
- [x] `parseNLPSuara()`, `submitNLPSuara()`
- [x] `getKomparasiPasar()`, `getPasar()`, `getTrenHarga()`
- [x] `getCariHarga()`, `getPetaSebaran()`
- [x] `getKiosList()`, `getDetailKios()`
- [x] `kalkulasiSmartBudgeting()`

---

## 🚧 Kondisi Saat Ini (Status Per 14 Okt 2026)

### Yang Berfungsi dengan Baik ✅
- Semua endpoint backend sudah ada dan merespons
- Frontend sudah terhubung ke backend via proxy Vite
- Login admin berfungsi
- Komparasi pasar & tren harga mengambil data dari DB
- NLP parser bisa parse teks sederhana

### Yang Perlu Diperbaiki ⚠️
- **NLP terlalu terbatas:** hanya 8 komoditas, akurasi hard-coded 98.4
- **Tren harga masih simulasi:** grafik pakai math.sin() bukan data historis nyata
- **Data publik (App.jsx) masih ada INITIAL_PRODUCTS hard-coded** sebagai fallback
- **NLP endpoint tidak konsisten:** format response antara /upload-suara dan /parse-suara berbeda
- **Kios default "Kios Makmur"** dan blok_stan "Stan Sayur" masih hard-coded di NLP

---

## 📅 Catatan Harian (Isi Sendiri Setiap Sesi Kerja)

### Sesi: _____________ (tanggal)
**Yang dikerjakan:**
- [ ] ...

**Masalah yang ditemukan:**
- ...

**Solusi / keputusan:**
- ...

**Commit message:**
```
...
```

---
*(Salin blok di atas setiap mulai sesi baru)*

---

## 🎯 RENCANA KERJA SELANJUTNYA

### 🔴 PRIORITAS 1 — NLP Backend (Kerjakan Ini Dulu!)

> Fokus ke `backend/nlp_parser.py` dan `backend/routers/nlp.py`

#### Langkah 1: Perluas Kamus Komoditas
**File:** `backend/nlp_parser.py` — Tambah ke list `KOMODITAS_KEYWORDS`

Komoditas yang belum ada (dari 18 bahan pokok NFA):
```
Tepung Terigu    → keywords: ["tepung terigu", "terigu", "tepung"]
Bawang Putih     → keywords: ["bawang putih", "bawang bodas", "brambang putih"]
Cabai Merah      → keywords: ["cabai merah", "lombok merah", "cabai merah keriting"]
Garam            → keywords: ["garam", "uyah", "garam dapur"]
Kedelai/Tempe    → keywords: ["kedelai", "dele", "tempe", "tahu"]
Ikan Bandeng     → keywords: ["ikan bandeng", "bandeng", "iwak bandeng"]
Ikan Lele        → keywords: ["ikan lele", "lele", "iwak lele"]
Santan           → keywords: ["santan", "santen", "kelapa parut"]
```

#### Langkah 2: Fix Hard-Coded yang Menyesatkan
**File:** `backend/nlp_parser.py`
- Baris 201: Ganti `detected_kios = "Kios Makmur"` → `detected_kios = None`
- Baris 280: Hitung akurasi dinamis, bukan `98.4`

**File:** `backend/routers/nlp.py`
- Baris 81 & 283: Ganti `blok_stan = "Stan Sayur"` → ambil dari request body atau biarkan `None`

#### Langkah 3: Perluas Segmentasi Kalimat
**File:** `backend/nlp_parser.py` — baris 213–214
```python
# Sekarang: hanya split by koma/titik koma
# Tambah: split by kata hubung Jawa/Indonesia
kata_hubung = r"[,;]|\bdan\b|\bsama\b|\bterus\b|\bjuga\b|\bkaro\b|\blan\b"
segments = [s.strip() for s in re.split(kata_hubung, cleaned_text, flags=re.IGNORECASE) if s.strip()]
```

#### Langkah 4: Tambah Format Angka Singkat
**File:** `backend/nlp_parser.py` — di fungsi `extract_price()`
```python
# Tambah sebelum regex digit:
# Pattern: 15rb, 20k, Rp13rb, 13.5rb
match_singkat = re.search(r"Rp\s*(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b", text_segment, re.IGNORECASE)
if match_singkat:
    return float(match_singkat.group(1).replace(",", ".")) * 1000
```

#### Langkah 5: Tambah Confidence Score
**File:** `backend/nlp_parser.py` — di bagian pembangunan `items[]`
- Tambah field `"confidence"` per item (0.0 – 1.0)
- High: exact keyword + harga terdeteksi
- Med: partial match / harga dari HET
- Low: fallback

---

### 🟡 PRIORITAS 2 — Frontend Menyesuaikan NLP

> Setelah backend diperbaiki, sesuaikan tampilan di frontend

#### F1: Panel NLP di AdminDashboard — Hasil Editable
**File:** `frontend/src/AdminDashboard.jsx`

Alur yang diinginkan:
```
User input teks/rekaman
  → Tekan "Parse"
  → Backend return hasil parse
  → Tampilkan tabel hasil (EDITABLE):
      | Komoditas | Harga | Satuan | Pasar | Kios | Confidence |
      | --------- | ----- | ------ | ----- | ---- | ---------- |
      | Beras IR  | 13000 | kg     | Babat | ___  | 🟢 Tinggi  |
  → User koreksi jika ada yang salah
  → Tekan "Simpan ke DB"
```

Komponen yang perlu dibuat:
- `<NLPResultRow>` — baris per item, dengan input editable
- Field kios: jika `kios === null`, tampilkan input wajib isi
- Badge confidence: 🟢/🟡/🔴 berdasarkan nilai

#### F2: Loading State Whisper
**File:** `frontend/src/AdminDashboard.jsx`
```jsx
// Tambah state:
const [isProcessingAudio, setIsProcessingAudio] = useState(false);

// Saat upload:
setIsProcessingAudio(true);
// ... await upload ...
setIsProcessingAudio(false);

// UI:
{isProcessingAudio && (
  <div className="nlp-loading">
    <span className="spinner" />
    <p>Memproses rekaman suara... (estimasi 10–30 detik)</p>
  </div>
)}
```

#### F3: Tambah Fungsi API untuk Upload Audio
**File:** `frontend/src/api.js` — tambah di bagian NLP SUARA:
```js
export async function uploadAudioNLP(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/nlp/upload-suara`, {
    method: "POST",
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: form,
  });
  return handleResponse(res);
}

export async function uploadDanSubmitAudioNLP(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/nlp/upload-submit-suara`, {
    method: "POST",
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: form,
  });
  return handleResponse(res);
}
```

#### F4: Badge "Data dari Survei NLP" di Kartu Komoditas
**File:** `frontend/src/App.jsx`
- Jika data komoditas punya `metode_input === "Modul NLP"` atau `"Voice Upload NLP"`, tambahkan ikon 🎙️ kecil di pojok kartu

#### F5: Warna Indikator HET yang Konsisten
**File:** `frontend/src/App.jsx`, `CariHarga.jsx`, `KomparasiPasar.jsx`
- Buat fungsi helper:
```js
function getHETColor(status_het) {
  if (!status_het) return "gray";
  if (status_het.includes("di atas HET")) return "red";
  if (status_het.includes("Sesuai HET")) return "green";
  if (status_het.includes("Turun") || status_het.includes("bawah")) return "blue";
  return "gray";
}
```

---

### 🟢 PRIORITAS 3 — Data Historis & Enhancement

#### Backend: Endpoint Tren Harga Berbasis Data Nyata
**File:** `backend/routers/pasar.py` — fungsi `get_tren_harga()`
- Saat ini: simulasi `math.sin()` + data dari survei terbaru saja
- Target: buat tabel `HistoriHarga` atau gunakan `SurveiHarga.created_at` untuk data riwayat

#### Backend: Endpoint Preview NLP (tanpa simpan)
- Tambah `POST /nlp/preview-suara` yang sama dengan `/parse-suara` tapi nama lebih eksplisit
- Tujuan: frontend bisa parse dulu → user edit → baru submit

#### Frontend: Sinkronisasi INITIAL_PRODUCTS → Data DB
**File:** `frontend/src/App.jsx` baris 43–80
- Data hard-coded masih ada sebagai fallback
- Idealnya fetch dari `/komoditas` atau `/cari-harga` saat pertama load, baru fallback ke static jika gagal

---

## 📝 Template Checklist Per Sesi

Copy checklist ini setiap mulai sesi coding:

```
### Sesi: [tanggal] — [fokus hari ini]

Backend:
- [ ] T1.1 Tambah komoditas ke KOMODITAS_KEYWORDS
- [ ] T1.2 Perluas ANGKA_JAWA_MAP (di atas 50rb)
- [ ] T1.3 Tambah deteksi "15rb", "20k"
- [ ] T2.1 Fix detected_kios → None jika tidak terdeteksi
- [ ] T2.2 Perluas segmentasi: tambah "dan", "sama", "terus"
- [ ] T2.3 Akurasi NLP dinamis
- [ ] T2.4 Confidence score per item
- [ ] T3.1 Fix blok_stan hard-coded
- [ ] T3.2 Homogenisasi format response NLP endpoint

Frontend:
- [ ] F1 Panel NLP editable di AdminDashboard
- [ ] F2 Loading state Whisper
- [ ] F3 uploadAudioNLP() & uploadDanSubmitAudioNLP() di api.js
- [ ] F4 Badge NLP di kartu komoditas
- [ ] F5 Warna HET konsisten
```

---

## ⚡ Quick Reference

### Menjalankan Project
```bash
# Backend
cd backend
uvicorn main:app --reload --port 8000

# Frontend (terminal terpisah)
cd frontend
npm run dev
```

### URL Penting
| Layanan | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

### File Paling Sering Diubah
| File | Fungsi |
|---|---|
| `backend/nlp_parser.py` | Engine NLP utama |
| `backend/routers/nlp.py` | Endpoint NLP & Whisper |
| `backend/routers/pasar.py` | Komparasi & tren harga |
| `frontend/src/AdminDashboard.jsx` | Panel admin + NLP UI |
| `frontend/src/api.js` | Semua fungsi API call |
| `frontend/src/App.jsx` | Halaman utama & routing |

### Git Workflow
```bash
# Sebelum mulai kerja
git pull

# Setelah selesai
git add -A
git commit -m "deskripsi singkat: apa yang dikerjakan"
git push
```

# 🛡️ Panduan Git Kolaborasi — E-Pangan (Backend + Frontend)

> **Untuk:** Nayla (Backend) & Teman (Frontend)
> **Masalah yang pernah terjadi:** Crash/conflict saat pull karena keduanya push ke `main`
> **Solusi:** Pakai **branch terpisah** dan alur kerja yang jelas

---

## 🔍 Kenapa Terjadi Crash? (Penjelasan Sederhana)

Bayangkan kalian berdua mengedit **dokumen Word yang sama secara bersamaan** tanpa koordinasi:

```
Nayla push → main:  [...backend kode baru...]
Teman pull → OK ✅

Teman push → main:  [...frontend kode baru...]
Nayla pull  → OK ✅

Nayla push lagi → main: [...backend kode baru lagi, TERMASUK file frontend yang LAMA...]
Teman pull      → ❌ CRASH! File frontend teman ditimpa versi lama milik Nayla!
```

**Akar masalahnya:** Nayla push file-file frontend (`App.jsx`, `App.css`, dll) ikut terbawa di commit backend, padahal teman sudah update file itu. Git tidak tahu mana yang "benar", jadi terjadi **merge conflict** — dan karena tidak dihandle dengan benar, hasilnya kode teman **tertimpa/hilang**.

---

## 🌿 Solusi: Pakai Branch Terpisah (WAJIB!)

Mulai sekarang, kalian **TIDAK BOLEH** langsung push ke `main`. Setiap orang punya branch sendiri.

### Struktur Branch yang Benar (Standar Git Flow)

```
main          ← Versi FINAL / STABIL / DEMO. Hanya di-merge dari development.
  │
  └── development   ← Tempat INTEGRASI & UJI COBA bersama (apakah API & UI sudah nyambung)
        │
        ├── backend    ← KHUSUS Nayla (ngoding harian backend)
        └── frontend   ← KHUSUS Teman (ngoding harian frontend)
```

### Aturan Emas 🔑
| Branch | Siapa yang boleh push? | Isi yang boleh diubah |
|--------|----------------------|-----------------------|
| `backend` | **Nayla saja** | Hanya folder `backend/` |
| `frontend` | **Teman saja** | Hanya folder `frontend/` |
| `development` | **Hasil merge gabungan** | Tempat uji coba integrasi backend + frontend |
| `main` | **Tidak ada yang langsung push** | Hasil rilis dari `development` yang sudah 100% aman |

---

## 🚀 Setup Awal (Lakukan Sekali Saja)

### Di Laptop Nayla (Backend)

```bash
# 1. Pastikan di main dulu dan update
git checkout main
git pull origin main

# 2. Buat branch backend (jika belum ada secara lokal)
git checkout backend
git push -u origin backend

# 3. Sekarang Nayla selalu kerja di branch backend
git branch   # Pastikan ada tanda * di depan "backend"
```

### Di Laptop Teman (Frontend)

```bash
# 1. Clone atau pull dulu
git pull origin main

# 2. Checkout ke branch frontend
git checkout frontend
git push -u origin frontend

# 3. Sekarang teman selalu kerja di branch frontend
git branch   # Pastikan ada tanda * di depan "frontend"
```

---

## 📋 SOP Kerja Harian (IKUTI SELALU!)

### 🔵 Nayla — Backend (setiap sesi kerja)

```bash
# ===== SEBELUM MULAI KERJA =====
git checkout backend          # Pastikan di branch backend
git pull origin backend       # Ambil update terbaru dari branch backend

# ===== SAAT KERJA =====
# Edit hanya file di folder backend/
# JANGAN ubah file di frontend/ dari laptop Nayla!

# ===== SELESAI KERJA / MAU SIMPAN =====
git status                    # Cek file apa yang berubah
git add backend/              # Add HANYA folder backend (jangan git add -A!)
git commit -m "backend: [deskripsi singkat]"
git push origin backend

# ===== CONTOH COMMIT MESSAGE =====
# "backend: tambah komoditas tepung & bawang putih ke nlp_parser"
# "backend: fix deteksi kios default dari Kios Makmur ke null"
# "backend: tambah endpoint GET /nlp/preview-suara"
```

### 🟠 Teman — Frontend (setiap sesi kerja)

```bash
# ===== SEBELUM MULAI KERJA =====
git checkout frontend         # Pastikan di branch frontend
git pull origin frontend      # Ambil update terbaru dari branch frontend

# ===== SAAT KERJA =====
# Edit hanya file di folder frontend/
# JANGAN ubah file di backend/ dari laptop teman!

# ===== SELESAI KERJA / MAU SIMPAN =====
git status
git add frontend/             # Add HANYA folder frontend
git commit -m "frontend: [deskripsi singkat]"
git push origin frontend

# ===== CONTOH COMMIT MESSAGE =====
# "frontend: tambah loading state di panel NLP AdminDashboard"
# "frontend: perbaiki warna badge HET di CariHarga"
# "frontend: update tampilan kartu komoditas di App.jsx"
```

---

## 🔄 Alur Integrasi: Dari Branch Kerja ke Development, lalu ke Main

Dengan adanya branch `development`, kalian tidak langsung me-merge ke `main`. Alurnya menjadi 3 tahap:

```text
[backend] & [frontend]  ──(Tahap 1)──>  [development]  ──(Tahap 2: Tes Bersama)──>  [main]
```

---

### 🔹 TAHAP 1: Gabungkan ke `development` (Untuk Uji Coba Integrasi)

Lakukan ini saat backend dan frontend ingin mencoba menghubungkan fitur baru bersama-sama:

```bash
# ===== Dilakukan oleh Nayla atau Teman (cukup 1 orang yang handle) =====

# 1. Pastikan kedua branch kerja sudah di-push ke remote masing-masing
#    (Nayla sudah push 'backend', Teman sudah push 'frontend')

# 2. Pindah ke branch development dan ambil versi terbaru
git checkout development
git pull origin development

# 3. Gabungkan kode backend terbaru
git merge backend --no-ff -m "merge: integrasikan backend ke development"
# (Jika ada conflict, selesaikan dulu)

# 4. Ambil dan gabungkan kode frontend terbaru
git fetch origin frontend
git merge origin/frontend --no-ff -m "merge: integrasikan frontend ke development"
# (Jika ada conflict, selesaikan dulu)

# 5. Push hasil gabungan ke development
git push origin development
```

---

### 🔹 TAHAP 2: Tes Bersama & Sinkronkan Branch Kerja

Setelah ada di `development`:

1. **Jalankan & Tes Aplikasi:**
   - Jalankan backend (`uvicorn main:app --reload`)
   - Jalankan frontend (`npm run dev`)
   - Cek apakah fitur baru berjalan lancar dan API terhubung tanpa error.
   - *Jika ada bug:* perbaiki di branch masing-masing (`backend` / `frontend`), push, lalu merge ulang ke `development`.

2. **Sinkronkan Update ke Laptop Masing-Masing:**
   Agar kode teman masuk ke laptop kalian tanpa merusak branch kerja:
   - **Nayla (di branch backend):**
     ```bash
     git checkout backend
     git pull origin development
     ```
   - **Teman (di branch frontend):**
     ```bash
     git checkout frontend
     git pull origin development
     ```

---

### 🔹 TAHAP 3: Merge `development` ke `main` (Saat Siap Demo / Final)

Lakukan ini **HANYA JIKA** semua fitur di branch `development` sudah dites dan terbukti 100% stabil:

```bash
# 1. Pindah ke main dan pastikan up-to-date
git checkout main
git pull origin main

# 2. Merge development yang sudah teruji ke main
git merge development --no-ff -m "release: update versi stabil dari development"

# 3. Push ke main
git push origin main

# 4. Beritahu teman bahwa main sudah ter-update
```

---

## ⚠️ Cara Atasi Conflict (Kalau Terjadi)

Conflict biasanya muncul jika ada **satu file yang diubah keduanya** (misal: `api.js`).

```bash
# Saat merge dan muncul pesan conflict:
# CONFLICT (content): Merge conflict in frontend/src/api.js

# 1. Buka file yang conflict
# Di dalam file akan ada tanda seperti ini:

<<<<<<< HEAD
// kode dari branch saat ini (misal: main/backend)
export function lama() { ... }
=======
// kode dari branch yang di-merge (misal: frontend)
export function baru() { ... }
>>>>>>> frontend

# 2. Edit file itu MANUAL:
#    - Hapus baris <<<, ===, >>>
#    - Pilih kode yang BENAR, atau gabungkan keduanya

# 3. Setelah selesai edit:
git add frontend/src/api.js     # Mark sebagai resolved
git commit -m "resolve conflict: api.js - gabungkan fungsi backend dan frontend"
```

---

## 🛑 Hal yang JANGAN DILAKUKAN (Blacklist)

| ❌ Jangan | ✅ Gantinya |
|-----------|------------|
| `git add -A` atau `git add .` di branch backend | `git add backend/` |
| `git add -A` atau `git add .` di branch frontend | `git add frontend/` |
| Push langsung ke `main` | Push ke branch masing-masing, lalu merge |
| Edit file frontend dari laptop backend | Koordinasi via WhatsApp/chat dulu |
| Edit file backend dari laptop frontend | Koordinasi via WhatsApp/chat dulu |
| `git push --force` (kecuali tahu betul apa yang dilakukan) | Jangan pernah force push ke main |

---

## 📁 Pembagian File yang Jelas

### 🔵 Nayla (Backend) — File yang Boleh Diubah
```
backend/
├── main.py
├── models.py
├── schemas.py
├── database.py
├── nlp_parser.py          ← fokus perbaikan NLP
├── epangan_db.py
├── create_admin.py
├── requirements.txt
└── routers/
    ├── nlp.py             ← fokus perbaikan NLP
    ├── pasar.py
    ├── search.py
    ├── kios.py
    ├── admin.py
    ├── auth.py
    ├── budgeting.py
    └── satgas.py
```

### 🟠 Teman (Frontend) — File yang Boleh Diubah
```
frontend/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── App.jsx            ← halaman utama
    ├── App.css
    ├── AdminDashboard.jsx ← panel NLP UI
    ├── AdminLogin.jsx
    ├── CariHarga.jsx
    ├── KomparasiPasar.jsx
    ├── SmartBudgetting.jsx
    ├── DetailKios.jsx
    ├── Navbar.jsx
    ├── api.js             ← ⚠️ FILE BERSAMA (lihat aturan khusus)
    ├── index.css
    └── main.jsx
```

### ⚠️ File Bersama (Koordinasi Dulu Sebelum Edit!)
```
frontend/src/api.js        ← Nayla bisa tambah fungsi NLP, teman bisa tambah fungsi UI
                              TAPI harus koordinasi dulu agar tidak bentrok
```

**Aturan untuk `api.js`:**
- Nayla: tambah fungsi di bagian `// NLP SUARA` dan jangan hapus/ubah fungsi lain
- Teman: tambah fungsi di bagian lain dan jangan hapus/ubah fungsi NLP
- Kalau mau ubah fungsi yang sudah ada: **WhatsApp dulu, sepakati bersama**

---

## 💬 Protokol Komunikasi (Anti Crash)

Sebelum mulai kerja, kirim pesan ke teman (atau sebaliknya):

> **"Hei, aku mau kerja sekarang di [backend/frontend]. File yang aku sentuh: [list file]. Kamu lagi kerja nggak?"**

Tanda kalian aman untuk push:
- ✅ Teman sudah push pekerjaannya dan tidak sedang kerja
- ✅ Kalian tidak mengubah file yang sama

---

## 🔧 Cara Recover Situasi Saat Ini (Laptop Teman)

Jika pekerjaan teman sudah **tertimpa/hilang** karena konflik tadi, coba ini dari **laptop teman**:

```bash
# Lihat semua commit, termasuk yang sudah "hilang"
git reflog

# Output contoh:
# abc1234 HEAD@{0}: pull: Fast-forward   ← ini yang overwrite
# def5678 HEAD@{1}: commit: perbaikan tampilan frontend  ← ini commit teman yang hilang!

# Kembalikan ke commit teman yang hilang:
git checkout def5678 -- frontend/src/   # Ambil state folder frontend dari commit lama

# Atau buat branch recovery:
git checkout -b recovery-frontend def5678
# Lalu cherry-pick atau copy manual file yang hilang
```

> Jika tidak tahu hash commit yang hilang, hubungi Nayla dan lihat `git reflog` bersama-sama.

---

## 📊 Diagram Alur Lengkap

```text
NAYLA (Backend)                           TEMAN (Frontend)
───────────────────────────────────────────────────────────────────

[Mulai sesi]                              [Mulai sesi]
    │                                         │
git checkout backend                      git checkout frontend
git pull origin backend                   git pull origin frontend
    │                                         │
[Edit backend/ saja]                      [Edit frontend/ saja]
    │                                         │
git add backend/                          git add frontend/
git commit -m "backend: ..."              git commit -m "frontend: ..."
git push origin backend                   git push origin frontend
    │                                         │
    └────────────────── KOORDINASI ───────────┘
                         │
             [Tahap 1: Merge ke development]
                         │
               git checkout development
               git pull origin development
               git merge backend
               git merge origin/frontend
               git push origin development
                         │
             [Tahap 2: Tes Bareng & Sync]
               - Uvicorn & Vite running
               - Tes API & integrasi
               - Masing-masing sync:
                 git pull origin development
                         │
          (Jika sudah 100% aman & siap demo)
                         │
             [Tahap 3: Rilis ke main]
                         │
               git checkout main
               git pull origin main
               git merge development
               git push origin main
```

---

## 🎓 Tips Tambahan untuk Pemula

1. **`git status` adalah temanmu** — jalankan ini sebelum `git add` untuk tahu file apa yang berubah
2. **Commit sering, push teratur** — lebih baik commit kecil-kecil daripada satu commit raksasa yang susah di-debug
3. **Tulis pesan commit yang jelas** — `"backend: fix nlp kios null"` jauh lebih berguna dari `"fix bug"`
4. **Jangan kerja di main** — anggap `main` seperti "produksi", tidak boleh sembarangan diubah
5. **Pull sebelum push** — selalu `git pull` dulu sebelum mulai kerja untuk dapat update terbaru
6. **Kalau ragu, tanya dulu** — lebih baik 5 menit chat daripada 2 jam resolve conflict

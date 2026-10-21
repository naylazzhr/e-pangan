# 🚀 PANDUAN KOLABORASI GIT & LOG PEKERJAAN FRONTEND (E-PANGAN)

> **Repositori:** `naylazzhr/e-pangan`  
> **Peran:** Frontend Developer  
> **Tujuan Dokumen:**  
> 1. Standar operasional prosedur (SOP) Git untuk kolaborasi mulus antara **Frontend** dan **Backend**.  
> 2. Papan rekam jejak (*live changelog & progress tracker*) agar tim Backend selalu mengetahui fitur apa yang sudah dibuat, komponen yang diperbarui, serta kebutuhan integrasi API.

---

## 📌 DAFTAR ISI
1. [Struktur Branch & Peran](#1-struktur-branch--peran)
2. [Format Standar Pesan Commit (Conventional Commits)](#2-format-standar-pesan-commit-conventional-commits)
3. [Alur Kerja Harian (Daily Git Workflow)](#3-alur-kerja-harian-daily-git-workflow)
4. [Penanganan Masalah Git (Stash, Conflict & Revert)](#4-penanganan-masalah-git-stash-conflict--revert)
5. [📋 LOG PEKERJAAN FRONTEND (Work Log & API Sync)](#5--log-pekerjaan-frontend-work-log--api-sync)
6. [🔌 KONTRAK & PERMINTAAN API KE BACKEND (API Request List)](#6--kontrak--permintaan-api-ke-backend-api-request-list)
7. [Cheatsheet Perintah Git Praktis](#7-cheatsheet-perintah-git-praktis)

---

## 1. STRUKTUR BRANCH & PERAN

Untuk menghindari tabrakan kode (*merge conflicts*) antara Frontend dan Backend:

| Branch | Fungsi & Kepemilikan | Aturan Akses |
|---|---|---|
| `main` | Production-ready code (kode stabil yang siap rilis). | Hanya di-merge setelah dites bersama. Jangan push langsung tanpa konfirmasi! |
| `development` | Integrasi gabungan Frontend & Backend untuk pengujian lokal. | Branch tempat berkumpulnya perubahan kedua sisi. |
| `frontend` / `frontend/<fitur>` | **Area Kerja Frontend** (Tempat Anda mengembangkan UI/UX & komponen React). | Push bebas oleh Frontend. |
| `backend` / `backend/<fitur>` | Area Kerja Backend (API FastAPI, database, model data). | Dikelola oleh Backend Developer. |

---

## 2. FORMAT STANDAR PESAN COMMIT (CONVENTIONAL COMMITS)

Gantikan pesan commit generik seperti `update frontend 3` atau `save pekerjaan` dengan format standar berikut agar Backend langsung paham file dan fitur yang disentuh:

```text
<tipe>(<cakupan>): <deskripsi singkat dalam bahasa indonesia/inggris>
```

### Daftar Tipe Commit:
- **`feat(fe)`** : Fitur antarmuka baru (contoh: `feat(fe): tambah komponen filter harga di CariHarga.jsx`).
- **`fix(fe)`** : Perbaikan bug UI / integrasi API (contoh: `fix(fe): perbaiki parsing response data kios pada DetailKios.jsx`).
- **`style(fe)`** : Perubahan styling, CSS, ikon, atau layout tanpa mengubah logika (contoh: `style(fe): perbaiki responsive grid kartu pasar di App.css`).
- **`refactor(fe)`** : Perapihan kode tanpa menambah fitur baru (contoh: `refactor(fe): pecah fungsi api call di api.js`).
- **`docs(fe)`** : Pembaruan dokumentasi atau log (contoh: `docs(fe): update log pekerjaan di git_guide.md`).

---

## 3. ALUR KERJA HARIAN (DAILY GIT WORKFLOW)

### Langkah 1: Sebelum Memulai Koding (Tarik Pembaruan Backend)
Selalu ambil pembaruan terbaru agar tidak tertinggal perubahan endpoint backend:
```powershell
# Pastikan berada di branch frontend
git checkout frontend

# Ambil pembaruan dari remote
git fetch origin

# Tarik perubahan terbaru dari development atau main ke branch frontend Anda
git merge origin/development
# (atau: git pull origin development)
```

### Langkah 2: Koding & Uji Coba Lokal
- Jalankan frontend: `npm run dev` di folder `frontend/`.
- Jalankan backend: `uvicorn main:app --reload` di folder `backend/` (dengan virtual environment aktif).

### Langkah 3: Catat Pekerjaan & Commit
1. Perbarui tabel [LOG PEKERJAAN FRONTEND](#5--log-pekerjaan-frontend-work-log--api-sync) di file ini (`git_guide.md`).
2. Jalankan perintah commit:
```powershell
# Cek file mana saja yang berubah
git status

# Tambahkan file yang sudah selesai
git add frontend/ git_guide.md

# Berikan commit message yang jelas
git commit -m "feat(fe): integrasikan modul pencarian harga dengan endpoint /api/search"
```

### Langkah 4: Push ke Remote Repository
```powershell
# Push ke branch kerja frontend
git push origin frontend
```

### Langkah 5: Koordinasi & Merge ke Development
Beri tahu Backend:
> *"Halo Backend, fitur X di frontend sudah saya push ke branch `frontend`. Silakan cek atau merge ke branch `development` jika ingin uji coba terintegrasi."*

---

## 4. PENANGANAN MASALAH GIT (STASH, CONFLICT & REVERT)

### A. Simpan Sementara Perubahan Tanpa Commit (`git stash`)
Gunakan jika Anda sedang mengedit kode tetapi harus segera pindah branch atau menarik kode baru:
```powershell
# Simpan pekerjaan yang belum selesai
git stash push -m "sementara: perbaikan UI CariHarga"

# Pindah branch atau lakukan pull
git checkout main
git pull origin main

# Kembali ke branch frontend dan pulihkan kerjaan
git checkout frontend
git stash pop
```

### B. Menyelesaikan Konflik (*Merge Conflict*)
Jika muncul pesan `CONFLICT (content): Merge conflict in ...`:
1. Buka file yang berkonflik di VS Code / Antigravity IDE.
2. Cari penanda konflik:
   ```text
   <<<<<<< HEAD (Kode Anda saat ini)
   fetch('/api/v1/harga')
   =======
   fetch('/api/v2/harga-pasar')
   >>>>>>> origin/development (Kode baru dari Backend)
   ```
3. Pilih opsi di atas kode: **Accept Current Change**, **Accept Incoming Change**, atau **Accept Both**.
4. Simpan file, lalu:
   ```powershell
   git add <nama_file_yang_dibersihkan>
   git commit -m "fix(merge): selesaikan konflik merge frontend dengan branch development"
   git push origin frontend
   ```

---

## 5. 📋 LOG PEKERJAAN FRONTEND (WORK LOG & API SYNC)

> **Catatan untuk Frontend:** Setiap kali Anda menyelesaikan/mengubah file frontend, tambahkan satu baris di tabel ini lalu commit bersamaan dengan kode Anda. Ini menjadi papan informasi resmi bagi tim Backend.

### 🟢 Status Integrasi:
- `[DONE]` : UI selesai & API backend sudah terhubung normal.
- `[IN PROGRESS]` : Masih dalam pengerjaan di sisi frontend.
- `[NEED BACKEND]` : UI sudah siap, menunggu penyediaan/perbaikan endpoint dari Backend.
- `[BLOCKED]` : Terkendala bug atau perubahan skema data tak terduga.

---

### TABEL REKAM JEJAK PEKERJAAN

| No | Tanggal & Waktu | File / Modul | Deskripsi Pekerjaan yang Dilakukan | Status | Endpoint Backend Terkait | Catatan untuk Backend |
|---|---|---|---|---|---|---|
| 1 | 2026-10-14 21:30 | [CariHarga.jsx](file:///d:/epangan/frontend/src/CariHarga.jsx) | Merestore & merapikan halaman pencarian harga komoditas pangan dari stash | `[DONE]` | `GET /api/search` | Butuh filter multi-pasar dan sort termurah |
| 2 | 2026-10-14 21:30 | [DetailKios.jsx](file:///d:/epangan/frontend/src/DetailKios.jsx) | Merestore & memperbaiki detail kios, daftar harga barang di kios | `[DONE]` | `GET /api/kios/{id}` | Pastikan response mengembalikan array `barang` lengkap dengan status stok |
| 3 | 2026-10-15 08:00 | [AdminDashboard.jsx](file:///d:/epangan/frontend/src/AdminDashboard.jsx) | Audit bug runtime `handleToggleRecord is not defined` & mismatch data NLP suara | `[IN PROGRESS]` | `POST /api/nlp/parse`<br>`POST /api/survei` | Backend mengembalikan multi-item `items: [...]`. Frontend sedang menyesuaikan rendering kartu hasil parsing |
| 4 | 2026-10-15 08:15 | [api.js](file:///d:/epangan/frontend/src/api.js) | Standarisasi token Authorization header di localStorage (`epangan_token`) | `[DONE]` | `POST /api/auth/login`<br>`GET /api/admin/dashboard-ringkasan` | Token JWT diteruskan via header `Authorization: Bearer <token>` |
| 5 | 2026-10-15 08:30 | [git_guide.md](file:///d:/epangan/git_guide.md) | Pembuatan SOP Git Kolaborasi & Live Work Log Tracker | `[DONE]` | - | Dibuat agar koordinasi FE & BE transparan dan tercatat rapi |

*(Tambahkan baris baru di bawah baris terakhir setiap kali Anda mengerjakan tugas baru)*

---

## 6. 🔌 KONTRAK & PERMINTAAN API KE BACKEND (API REQUEST LIST)

Daftar endpoint baru atau modifikasi yang dibutuhkan oleh Frontend dari tim Backend:

| ID Req | Fitur Frontend | Method & Endpoint yang Diminta | Request Payload (FE kirim) | Response yang Diharapkan (FE terima) | Status Backend |
|---|---|---|---|---|---|
| **REQ-01** | Parsing Suara NLP Multi-Item | `POST /api/nlp/parse` | `{ "text": "Pasar Babat Kios Makmur telur 28 ewu cabe 30 ewu" }` | `{ "status": "success", "pasar": "Pasar Babat", "kios": "Kios Makmur", "items": [{"komoditas": "...", "harga": 28000}, ...] }` | ✅ Ready di backend |
| **REQ-02** | Simpan Batch Hasil NLP ke Survei | `POST /api/survei/batch` | `{ "id_pasar": 1, "id_kios": 2, "tanggal": "2026-10-15", "items": [...] }` | `{ "status": "success", "total_inserted": 2 }` | 🟡 Perlu sinkronisasi endpoint |
| **REQ-03** | Auto-suggest Nama Komoditas di Pencarian | `GET /api/komoditas/suggest?q=ber` | Parameter query: `q` | `[{"id": 1, "nama": "Beras Premium"}, {"id": 2, "nama": "Beras Medium"}]` | ⏳ Pending Backend |

---

## 7. CHEATSHEET PERINTAH GIT PRAKTIS

### Cek Status & Riwayat
```powershell
# Cek file yang berubah/belum di-stage
git status

# Lihat 5 commit terakhir dalam format 1 baris ringkas
git log --oneline -n 5

# Lihat perbedaan isi kode yang Anda ubah
git diff
```

### Menyimpan Kode & Kirim ke GitHub
```powershell
# Tambahkan semua perubahan di folder frontend
git add frontend/
git add git_guide.md

# Commit dengan pesan yang informatif
git commit -m "feat(fe): deskripsi perubahan yang Anda lakukan"

# Kirim perubahan ke branch frontend di remote
git push origin frontend
```

### Berpindah & Sinkronisasi Branch
```powershell
# Berpindah ke branch frontend
git checkout frontend

# Menyamakan branch frontend dengan remote terbaru
git pull origin frontend

# Mengambil perubahan terbaru dari branch development milik tim
git pull origin development
```

### Mengabaikan / Membatalkan Perubahan Lokal
```powershell
# Batalkan perubahan pada satu file yang belum di-commit
git checkout -- frontend/src/NamaFile.jsx

# Bersihkan file baru yang belum ditrack (untracked)
git clean -fd
```

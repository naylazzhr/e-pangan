// ================================================================
// api.js — Konfigurasi Terpusat API E-Pangan
// Semua request ke backend melewati file ini.
// ================================================================

const BASE_URL = "/api"; // Proxy Vite ke http://localhost:8000

// Helper: ambil token dari localStorage
const getToken = () => localStorage.getItem("epangan_token");

// Helper: buat header dengan Authorization
const authHeaders = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

// Helper: tangani response & error
async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Server error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ----------------------------------------------------------------
// AUTH
// ----------------------------------------------------------------

/** Login petugas → simpan token ke localStorage */
export async function loginPetugas(identifier, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await handleResponse(res);
  localStorage.setItem("epangan_token", data.access_token);
  localStorage.setItem("epangan_user", JSON.stringify(data.user));
  return data;
}

/** Logout — hapus token */
export function logoutPetugas() {
  localStorage.removeItem("epangan_token");
  localStorage.removeItem("epangan_user");
}

/** Ambil data user dari localStorage */
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("epangan_user"));
  } catch {
    return null;
  }
}

/** Cek apakah user sudah login */
export function isLoggedIn() {
  return !!getToken();
}

// ----------------------------------------------------------------
// DASHBOARD RINGKASAN
// ----------------------------------------------------------------

export async function getDashboardRingkasan() {
  const res = await fetch(`${BASE_URL}/admin/dashboard-ringkasan`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ----------------------------------------------------------------
// SURVEI HARGA HARIAN
// ----------------------------------------------------------------

export async function getSurveiHarga({ search = "", status_verifikasi = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status_verifikasi) params.append("status_verifikasi", status_verifikasi);
  params.append("page", page);
  params.append("limit", limit);

  const res = await fetch(`${BASE_URL}/survei-harga?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function tambahSurveiHarga(data) {
  const res = await fetch(`${BASE_URL}/survei-harga`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateSurveiHarga(id, data) {
  const res = await fetch(`${BASE_URL}/survei-harga/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function hapusSurveiHarga(id) {
  const res = await fetch(`${BASE_URL}/survei-harga/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ----------------------------------------------------------------
// KOMODITAS (Data Harga Publik)
// ----------------------------------------------------------------

export async function getKomoditas({ search = "", kategori = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (kategori) params.append("kategori", kategori);

  const res = await fetch(`${BASE_URL}/komoditas?${params}`);
  return handleResponse(res);
}

// ----------------------------------------------------------------
// NLP SUARA
// ----------------------------------------------------------------

export async function parseNLPSuara(transcript) {
  const res = await fetch(`${BASE_URL}/nlp/parse-suara`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ transcript }),
  });
  return handleResponse(res);
}

// Alias untuk kompatibilitas AdminDashboard
export const prosesSuaraNLP = parseNLPSuara;

export async function submitNLPSuara(transcript, simpan_langsung = true) {
  const res = await fetch(`${BASE_URL}/nlp/submit-suara`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ transcript, simpan_langsung }),
  });
  return handleResponse(res);
}

// ----------------------------------------------------------------
// KOMPARASI HARGA ANTAR PASAR
// ----------------------------------------------------------------

export async function getKomparasiPasar({ search = "", kategori = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (kategori && kategori !== "Semua") params.append("kategori", kategori);

  const res = await fetch(`${BASE_URL}/komparasi-pasar?${params}`);
  return handleResponse(res);
}


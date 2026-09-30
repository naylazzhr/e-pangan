import { useMemo, useState, useEffect } from "react";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const CATEGORIES = [
  { label: "Semua Komoditas", icon: "" },
  { label: "Beras & Padi", icon: "🌾" },
  { label: "Bumbu Dapur & Cabai", icon: "🌶️" },
  { label: "Minyak Goreng & Mentega", icon: "🧈" },
  { label: "Daging, Unggas & Telur", icon: "🍗" },
  { label: "Gula & Tepung Terigu", icon: "🌿" },
];

const CATEGORY_MAP = {
  "Beras & Padi": ["KEBUTUHAN POKOK", "SEMBAKO"],
  "Bumbu Dapur & Cabai": ["BUMBU DAPUR"],
  "Minyak Goreng & Mentega": ["MINYAK GORENG"],
  "Daging, Unggas & Telur": ["PROTEIN HEWANI"],
  "Gula & Tepung Terigu": ["BAHAN BAKU"],
};

const INITIAL_PRODUCTS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600",
    badge: "Harga Stabil",
    badgeType: "stable",
    category: "KEBUTUHAN POKOK",
    name: "Beras Medium IR-64",
    market: "Pasar Babat & Sidoharjo",
    price: "Rp 13.000",
    unit: "/kg",
    delta: "Stabil (0.0%)",
    deltaType: "flat",
  },
  {
    id: 2,
    image: "/cabaimerah.jpeg",
    badge: "Fluktuatif",
    badgeType: "volatile",
    category: "BUMBU DAPUR",
    name: "Cabai Rawit Merah",
    market: "Pasar Mantup & Blawi",
    price: "Rp 48.500",
    unit: "/kg",
    delta: "+Rp 1.500 (+3.1%)",
    deltaType: "up",
  },
  {
    id: 3,
    image: "/minyakgoreng.jpg",
    badge: "Harga Stabil",
    badgeType: "stable",
    category: "MINYAK GORENG",
    name: "Minyak Goreng Sawit",
    market: "Pasar Babat & Sidoharjo",
    price: "Rp 15.700",
    unit: "/ltr",
    delta: "-Rp 300 (-1.8%)",
    deltaType: "down",
  },
];

const FAMILY_OPTIONS = [
  { label: "2 Anggota", size: 2, perOrang: 360000 },
  { label: "4 Anggota", size: 4, perOrang: 362500 },
  { label: "6 Anggota", size: 6, perOrang: 355000 },
];

function formatRupiah(num) {
  if (typeof num !== "number") return num;
  return "Rp " + num.toLocaleString("id-ID");
}

/* ==============================================================================
   KOMPONEN MODAL LOGIN ADMIN
   ============================================================================== */
function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Gagal login. Kredensial tidak valid.");
      }

      // Simpan kredensial & token JWT ke localStorage
      localStorage.setItem("epangan_admin_token", data.access_token);
      localStorage.setItem("epangan_admin_user", JSON.stringify(data.user));

      onLoginSuccess(data.access_token, data.user);
      setUsername("");
      setPassword("");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔐 Login Administrator E-Pangan</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div className="modal-alert">
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 0, marginBottom: 18 }}>
              Hanya petugas/admin terdaftar Dinas Ketahanan Pangan Lamongan yang memiliki akses ke dashboard ini.
            </p>

            <div className="form-field">
              <label>Username Admin</label>
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan username admin..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Memverifikasi..." : "Masuk ke Dashboard ➔"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==============================================================================
   KOMPONEN MODAL TAMBAH KOMODITAS (ADMIN ONLY)
   ============================================================================== */
function TambahKomoditasModal({ isOpen, onClose, token, onSuccess, onNeedToast }) {
  const [namaBahan, setNamaBahan] = useState("");
  const [kategori, setKategori] = useState("KEBUTUHAN POKOK");
  const [harga, setHarga] = useState("");
  const [satuan, setSatuan] = useState("kg");
  const [lokasi, setLokasi] = useState("Pasar Babat");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/komoditas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama_bahan: namaBahan,
          kategori: kategori,
          harga: parseFloat(harga),
          satuan: satuan,
          lokasi: lokasi,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Gagal menambahkan komoditas");
      }

      onNeedToast("Berhasil! Data komoditas baru telah ditambahkan.");
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🌾 Tambah Komoditas Pangan</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Nama Bahan Pokok</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Beras Rojo Lele Super"
                value={namaBahan}
                onChange={(e) => setNamaBahan(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Kategori</label>
              <select
                className="form-input"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
              >
                <option value="KEBUTUHAN POKOK">KEBUTUHAN POKOK</option>
                <option value="BUMBU DAPUR">BUMBU DAPUR</option>
                <option value="PROTEIN HEWANI">PROTEIN HEWANI</option>
                <option value="MINYAK GORENG">MINYAK GORENG</option>
                <option value="BAHAN BAKU">BAHAN BAKU</option>
              </select>
            </div>

            <div className="form-field">
              <label>Harga (Rupiah)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Contoh: 14500"
                value={harga}
                onChange={(e) => setHarga(e.target.value)}
                required
                min="1"
              />
            </div>

            <div className="form-field">
              <label>Satuan (kg, liter, ikat, dll)</label>
              <input
                type="text"
                className="form-input"
                placeholder="kg"
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Lokasi Pasar</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Pasar Sidoharjo Lamongan"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==============================================================================
   KOMPONEN DASHBOARD ADMIN (PROTECTED VIEW)
   ============================================================================== */
function AdminDashboard({
  token,
  adminUser,
  onLogout,
  onViewPublic,
  onNeedToast,
}) {
  const [stats, setStats] = useState({ total_komoditas: 0, total_pasar: 0, total_kios: 0 });
  const [komoditasList, setKomoditasList] = useState([]);
  const [pasarList, setPasarList] = useState([]);
  const [activeTab, setActiveTab] = useState("komoditas");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchAdmin, setSearchAdmin] = useState("");

  const fetchDashboardData = () => {
    // 1. Ambil statistik dashboard
    fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          onLogout();
          throw new Error("Sesi login berakhir. Silakan login kembali.");
        }
        return res.json();
      })
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .catch((err) => console.error("Error fetch stats:", err));

    // 2. Ambil data komoditas
    fetch(`${API_BASE_URL}/komoditas`)
      .then((res) => res.json())
      .then((resData) => {
        setKomoditasList(resData.data || []);
      })
      .catch((err) => console.error("Error fetch komoditas:", err));

    // 3. Ambil data pasar
    fetch(`${API_BASE_URL}/pasar`)
      .then((res) => res.json())
      .then((resData) => {
        setPasarList(resData.data || []);
      })
      .catch((err) => console.error("Error fetch pasar:", err));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleHapusKomoditas = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus komoditas "${nama}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/komoditas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus data dari server");
      }

      onNeedToast(`Komoditas "${nama}" berhasil dihapus.`);
      fetchDashboardData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleHapusPasar = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus data pasar "${nama}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/pasar/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus pasar dari server");
      }

      onNeedToast(`Pasar "${nama}" berhasil dihapus.`);
      fetchDashboardData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filteredKomoditas = useMemo(() => {
    return komoditasList.filter((k) =>
      k.nama_bahan.toLowerCase().includes(searchAdmin.toLowerCase()) ||
      (k.lokasi && k.lokasi.toLowerCase().includes(searchAdmin.toLowerCase()))
    );
  }, [komoditasList, searchAdmin]);

  return (
    <div className="admin-view-wrap">
      {/* Top Banner Dashboard */}
      <div className="admin-top-banner">
        <div className="admin-banner-info">
          <h2>🛡️ Dashboard Administrator E-Pangan</h2>
          <p>
            Portal Pengelolaan Data Pangan & Pasar Terpadu — Dinas Ketahanan Pangan dan Pertanian Kab. Lamongan
          </p>
        </div>

        <div className="admin-banner-actions">
          <div className="badge-admin-user">
            👤 Petugas: <b>{adminUser?.username || "Admin"}</b>
          </div>
          <button className="btn-public-portal" onClick={onViewPublic}>
            🌐 Buka Portal Publik
          </button>
          <button className="btn-logout" onClick={onLogout}>
            Keluar (Logout) ➔
          </button>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">🌾</div>
          <div className="admin-stat-text">
            <div className="num">{stats.total_komoditas}</div>
            <div className="lbl">Total Komoditas Terdaftar</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🏬</div>
          <div className="admin-stat-text">
            <div className="num">{stats.total_pasar}</div>
            <div className="lbl">Titik Pasar Rakyat Aktif</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🔒</div>
          <div className="admin-stat-text">
            <div className="num" style={{ fontSize: 18, color: "var(--green-700)" }}>
              <span className="badge-secure-status">● Terotentikasi</span>
            </div>
            <div className="lbl">JWT Bearer &amp; Bcrypt Enkripsi</div>
          </div>
        </div>
      </div>

      {/* Navigasi Tab Manajemen */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === "komoditas" ? "active" : ""}`}
          onClick={() => setActiveTab("komoditas")}
        >
          🌾 Manajemen Komoditas ({komoditasList.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "pasar" ? "active" : ""}`}
          onClick={() => setActiveTab("pasar")}
        >
          🏬 Manajemen Pasar ({pasarList.length})
        </button>
      </div>

      {/* Konten Tab Komoditas */}
      {activeTab === "komoditas" && (
        <div className="admin-content-box">
          <div className="admin-toolbar">
            <h3>Daftar Data Komoditas Pangan</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                className="form-input"
                style={{ width: 240, padding: "8px 14px" }}
                placeholder="Cari komoditas/pasar..."
                value={searchAdmin}
                onChange={(e) => setSearchAdmin(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                + Tambah Komoditas
              </button>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Bahan Pokok</th>
                  <th>Kategori</th>
                  <th>Harga Saat Ini</th>
                  <th>Satuan</th>
                  <th>Lokasi Pasar</th>
                  <th>Aksi Aman</th>
                </tr>
              </thead>
              <tbody>
                {filteredKomoditas.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: 24, color: "var(--ink-soft)" }}>
                      Belum ada data komoditas pangan yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredKomoditas.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td><b>{item.nama_bahan}</b></td>
                      <td><span className="badge-pill">{item.kategori || "-"}</span></td>
                      <td style={{ fontWeight: 700, color: "var(--green-800)" }}>
                        {formatRupiah(item.harga)}
                      </td>
                      <td>/{item.satuan}</td>
                      <td>📍 {item.lokasi || "Semua Pasar"}</td>
                      <td>
                        <button
                          className="btn-action-delete"
                          onClick={() => handleHapusKomoditas(item.id, item.nama_bahan)}
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Konten Tab Pasar */}
      {activeTab === "pasar" && (
        <div className="admin-content-box">
          <div className="admin-toolbar">
            <h3>Daftar Pasar Rakyat Kabupaten Lamongan</h3>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Pasar</th>
                  <th>Kecamatan</th>
                  <th>Alamat</th>
                  <th>Jam Operasional</th>
                  <th>Aksi Aman</th>
                </tr>
              </thead>
              <tbody>
                {pasarList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 24, color: "var(--ink-soft)" }}>
                      Belum ada data pasar tercatat.
                    </td>
                  </tr>
                ) : (
                  pasarList.map((p, idx) => (
                    <tr key={p.id}>
                      <td>{idx + 1}</td>
                      <td><b>{p.nama_pasar}</b></td>
                      <td>{p.kecamatan || "-"}</td>
                      <td>{p.alamat || "-"}</td>
                      <td>{p.jam_operasional || "-"}</td>
                      <td>
                        <button
                          className="btn-action-delete"
                          onClick={() => handleHapusPasar(p.id, p.nama_pasar)}
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah Komoditas */}
      <TambahKomoditasModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        token={token}
        onSuccess={fetchDashboardData}
        onNeedToast={onNeedToast}
      />
    </div>
  );
}

/* ==============================================================================
   KOMPONEN NAVBAR
   ============================================================================== */
function Navbar({
  onOpenLogin,
  isLoggedIn,
  adminUser,
  onGoToDashboard,
  onGoToPublic,
  currentView,
  onLogout,
}) {
  return (
    <header className="topbar">
      <div className="brand" style={{ cursor: "pointer" }} onClick={onGoToPublic}>
        <div className="logo">🌾</div>
        <div className="name">
          E-Pangan
          <small>KAB. LAMONGAN</small>
        </div>
      </div>

      <nav className="mainnav">
        <a
          href="#"
          className={currentView === "public" ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            onGoToPublic();
          }}
        >
          Beranda
        </a>
        <a href="#catalog-panel">Cari Harga</a>
        <a href="#catalog-panel">Perbandingan Pasar</a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (isLoggedIn) {
              onGoToDashboard();
            } else {
              onOpenLogin();
            }
          }}
        >
          🛡️ Portal Admin {isLoggedIn ? "(Aktif)" : ""}
        </a>
      </nav>

      <div className="topbar-right">
        {isLoggedIn ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn-login"
              style={{ background: "var(--green-900)" }}
              onClick={onGoToDashboard}
            >
              🛡️ Dashboard Admin ({adminUser?.username})
            </button>
            <button
              className="btn-logout"
              style={{ padding: "8px 12px", fontSize: 12.5 }}
              onClick={onLogout}
              title="Keluar dari akun admin"
            >
              Keluar
            </button>
          </div>
        ) : (
          <button className="btn-login" onClick={onOpenLogin}>
            👤 Login Admin
          </button>
        )}
      </div>
    </header>
  );
}

/* ==============================================================================
   KOMPONEN HERO & LANDING PAGE
   ============================================================================== */
function Hero({ searchTerm, setSearchTerm, activeCategory, setActiveCategory }) {
  return (
    <section className="hero">
      <h1>Pantau Harga Bahan Pokok Terkini di Pasar Kabupaten Lamongan</h1>
      <p className="sub">
        Cari dan bandingkan harga komoditas dari berbagai pasar di Lamongan secara real-time
      </p>

      <div className="search-panel">
        <div className="search-row">
          <input
            className="search-input"
            type="text"
            placeholder="Ketik komoditas (contoh: Cabai Rawit Merah, Minyakita, Beras Premium...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="btn-solid"
            type="button"
            onClick={() =>
              document.getElementById("catalog-panel")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            🔎 Cek Komoditas
          </button>
        </div>

        <div className="chip-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              type="button"
              className={`chip${activeCategory === cat.label ? " active" : ""}`}
              onClick={() => setActiveCategory(cat.label)}
            >
              {cat.icon ? `${cat.icon} ` : ""}
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrendPanel() {
  return (
    <div className="panel">
      <div className="eyebrow">RANGKUMAN 7 HARI TERAKHIR</div>
      <div className="trend-head">
        <h2>Analisis Tren Fluktuasi Harga</h2>
        <div className="select-commodity">🔍 Beras Medium IR-64 ▾</div>
      </div>

      <div className="price-today">
        Harga Hari Ini: <b>Rp 13.000</b> per kilogram
      </div>

      <div className="chart-legend">
        <span>
          <span className="dot"></span>Kurva Dinamis 4 Titik Pantau Enumerator
        </span>
        <span>Skala Rupiah (IDR)</span>
      </div>

      <div className="chart-wrap">
        <svg viewBox="0 0 760 220" width="100%" height="220" preserveAspectRatio="none">
          <defs>
            <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a8a4e" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#1a8a4e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points="40,150 280,115 520,60 720,55 720,210 40,210" fill="url(#fillArea)" />
          <polyline
            points="40,150 280,115 520,60 720,55"
            fill="none"
            stroke="#1a8a4e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="150" r="6" fill="#fff" stroke="#1a8a4e" strokeWidth="3" />
          <circle cx="280" cy="115" r="6" fill="#fff" stroke="#1a8a4e" strokeWidth="3" />
          <circle cx="520" cy="60" r="6" fill="#fff" stroke="#1a8a4e" strokeWidth="3" />
          <circle cx="720" cy="55" r="7" fill="#1a8a4e" stroke="#fff" strokeWidth="3" />

          <text x="40" y="135" fontSize="13" fontWeight="700" fill="#14231a" textAnchor="middle">Rp 12.800</text>
          <text x="280" y="100" fontSize="13" fontWeight="700" fill="#14231a" textAnchor="middle">Rp 12.900</text>
          <text x="520" y="45" fontSize="13" fontWeight="700" fill="#14231a" textAnchor="middle">Rp 13.000</text>
          <text x="700" y="38" fontSize="13" fontWeight="700" fill="#14231a" textAnchor="end">Rp 13.000</text>
        </svg>
      </div>

      <div className="chart-labels">
        <span>Senin</span>
        <span>Rabu</span>
        <span>Jumat</span>
        <span className="now">Hari Ini</span>
      </div>
    </div>
  );
}

function ProductCard({ product, onCompare }) {
  return (
    <div className="food-card">
      <div className="thumb" style={{ backgroundImage: `url('${product.image}')` }}>
        <span className={`badge ${product.badgeType}`}>{product.badge}</span>
      </div>
      <div className="body">
        <div className="cat-label">{product.category}</div>
        <div className="food-name">{product.name}</div>
        <div className="market">📍 {product.market}</div>
        <div className="price-row">
          <span className="amt">{product.price}</span>
          <span className="unit">{product.unit}</span>
          <span className={`delta ${product.deltaType}`}>{product.delta}</span>
        </div>
        <button className="btn-compare" type="button" onClick={() => onCompare(product)}>
          ↗ Bandingkan Harga
        </button>
      </div>
    </div>
  );
}

function CatalogPanel({ products, onCompare }) {
  return (
    <div className="panel" id="catalog-panel" style={{ marginTop: 26 }}>
      <div className="catalog-head">
        <h2 style={{ marginBottom: 0 }}>Katalog Komoditas Pangan Populer</h2>
        <a className="see-all" href="#catalog-panel">
          Lihat Seluruh Komoditas →
        </a>
      </div>
      <p className="catalog-sub">
        Diperbarui berdasarkan rata-rata sampling enumerator di pasar wilayah Lamongan.
      </p>

      {products.length === 0 ? (
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
          Tidak ada komoditas yang cocok dengan pencarian/kategori ini.
        </p>
      ) : (
        <div className="grid-cards">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onCompare={onCompare} />
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetCard({ familyIndex, setFamilyIndex, onOpenCalculator }) {
  const selected = FAMILY_OPTIONS[familyIndex];
  const estimate = selected.size * selected.perOrang;

  return (
    <div className="budget-card">
      <span className="tag-new">FITUR DKPP LAMONGAN</span>
      <h3>Smart Budgeting Pangan Bulanan</h3>
      <p>
        Rencanakan pengeluaran belanja bahan dapur keluarga Anda dengan rekomendasi cerdas anggaran pangan.
      </p>

      <div className="sim-box">
        <div className="sim-label">SIMULASI CEPAT ANGGARAN:</div>
        <div className="family-toggle">
          {FAMILY_OPTIONS.map((opt, idx) => (
            <button
              key={opt.label}
              type="button"
              className={`family-btn${idx === familyIndex ? " active" : ""}`}
              onClick={() => setFamilyIndex(idx)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="sim-values">
          <span>Keluarga ({selected.label})</span>
          <span>~ {formatRupiah(estimate)}/bln</span>
        </div>
      </div>

      <button className="btn-cta" type="button" onClick={onOpenCalculator}>
        Buka Kalkulator Belanja →
      </button>
    </div>
  );
}

function MapCard({ onNeedBackend }) {
  return (
    <button
      className="map-card"
      type="button"
      onClick={() => onNeedBackend("Peta geospasial menampilkan titik sebaran pasar di Lamongan.")}
    >
      <div className="icon">📍</div>
      <div className="txt">
        <b>Peta Geospasial Pasar</b>
        <span>Cek radius terdekat dari lokasi Anda</span>
      </div>
      <div className="arrow">→</div>
    </button>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="brand">
            <div className="logo">🌾</div>
            <div className="name">
              E-Pangan
              <small>KAB. LAMONGAN</small>
            </div>
          </div>
          <p>
            Sistem Informasi Terpadu Pemantauan dan Stabilitas Harga Komoditas
            Pangan Pokok Dinas Ketahanan Pangan dan Pertanian (DKPP) Kabupaten Lamongan.
          </p>
          <span className="ppid">PPID KABUPATEN LAMONGAN</span>
        </div>

        <div>
          <h4>LAYANAN PUBLIK</h4>
          <ul>
            <li>Katalog Harga Harian</li>
            <li>Peta Distribusi Pasar Rakyat</li>
            <li>Simulasi Belanja Keluarga</li>
            <li>Daftar Kios Binaan</li>
          </ul>
        </div>

        <div>
          <h4>HOTLINE SATGAS PANGAN</h4>
          <div className="hotline-item">
            📞 <span>Call Center Siaga:<br />0800-1-PANGAN-LA (0800-1-726426)</span>
          </div>
          <div className="hotline-item" style={{ marginTop: 10 }}>
            💬 <span>WhatsApp Pelaporan:<br />+62 812-3456-7890 (24 Jam)</span>
          </div>
        </div>

        <div>
          <h4>INFORMASI PEMBARUAN</h4>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
            Data komoditas disinkronkan langsung dengan database pusat DKPP Lamongan.
          </p>
          <div className="status-box">
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-soft)" }}>
              Status Keamanan Server:
            </div>
            <div className="status-live">
              <span className="status-dot"></span>JWT Protected &amp; Active
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © 2025 Pemerintah Kabupaten Lamongan — Dinas Ketahanan Pangan dan Pertanian.
        </span>
        <div className="links">
          <a href="#">Kebijakan Privasi</a>
          <a href="#">Ketentuan Layanan</a>
        </div>
      </div>
    </footer>
  );
}

/* ==============================================================================
   KOMPONEN UTAMA (APP)
   ============================================================================== */
export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua Komoditas");
  const [familyIndex, setFamilyIndex] = useState(1);
  const [toastMsg, setToastMsg] = useState("");

  // Navigasi Tampilan ("public" atau "admin")
  const [currentView, setCurrentView] = useState("public");

  // State Autentikasi Admin
  const [token, setToken] = useState(() => localStorage.getItem("epangan_admin_token"));
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem("epangan_admin_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Data Produk untuk Publik
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  const showToast = (msg) => {
    setToastMsg(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToastMsg(""), 3500);
  };

  // Validasi keaslian token admin saat aplikasi pertama kali dimuat
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            // Token kedaluwarsa atau tidak sah
            handleLogout();
          }
        })
        .catch(() => {
          // Jika server backend offline
        });
    }
  }, [token]);

  // Mengambil data komoditas publik dari backend
  const fetchPublicProducts = () => {
    fetch(`${API_BASE_URL}/komoditas`)
      .then((res) => res.json())
      .then((result) => {
        const rawData = result.data || result;
        if (Array.isArray(rawData) && rawData.length > 0) {
          const mappedData = rawData.map((item) => ({
            id: item.id,
            name: item.nama_bahan,
            category: item.kategori || "KEBUTUHAN POKOK",
            price: typeof item.harga === "number" ? formatRupiah(item.harga) : item.harga,
            unit: item.satuan ? (item.satuan.startsWith("/") ? item.satuan : `/${item.satuan}`) : "/kg",
            market: item.lokasi || "Pasar Lamongan",
            badge: "Harga Stabil",
            badgeType: "stable",
            delta: "Stabil (0.0%)",
            deltaType: "flat",
            image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500",
          }));
          setProducts(mappedData);
        }
      })
      .catch((err) => console.error("Error fetching public data:", err));
  };

  useEffect(() => {
    fetchPublicProducts();
  }, []);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setAdminUser(newUser);
    setIsLoginModalOpen(false);
    setCurrentView("admin");
    showToast(`Selamat datang kembali, ${newUser.username}! Anda berhasil masuk.`);
  };

  const handleLogout = () => {
    localStorage.removeItem("epangan_admin_token");
    localStorage.removeItem("epangan_admin_user");
    setToken(null);
    setAdminUser(null);
    setCurrentView("public");
    showToast("Anda telah keluar dari akun admin.");
  };

  // Proteksi Akses Dashboard: Hanya jika memiliki token sah
  const handleOpenDashboard = () => {
    if (!token) {
      showToast("Akses Ditolak: Anda harus login sebagai admin terlebih dahulu!");
      setIsLoginModalOpen(true);
      return;
    }
    setCurrentView("admin");
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (activeCategory === "Semua Komoditas") return true;
      const allowed = CATEGORY_MAP[activeCategory] || [];
      return allowed.includes(p.category);
    });
  }, [searchTerm, activeCategory, products]);

  return (
    <div className="app">
      <Toast message={toastMsg} />

      <Navbar
        onOpenLogin={() => setIsLoginModalOpen(true)}
        isLoggedIn={!!token}
        adminUser={adminUser}
        onGoToDashboard={handleOpenDashboard}
        onGoToPublic={() => setCurrentView("public")}
        currentView={currentView}
        onLogout={handleLogout}
      />

      {/* JIKA CURRENT VIEW = ADMIN (DAN SUDAH TERVERIFIKASI LOGIN) */}
      {currentView === "admin" && token ? (
        <AdminDashboard
          token={token}
          adminUser={adminUser}
          onLogout={handleLogout}
          onViewPublic={() => {
            setCurrentView("public");
            fetchPublicProducts();
          }}
          onNeedToast={showToast}
        />
      ) : (
        /* TAMPILAN BERANDA PUBLIK (WARGA / MASYARAKAT UMUM) */
        <>
          <Hero
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />

          <div className="content">
            <div>
              <TrendPanel />
              <CatalogPanel
                products={filteredProducts}
                onCompare={(product) =>
                  showToast(`Perbandingan harga "${product.name}" antar pasar sedang dimuat...`)
                }
              />
            </div>

            <div className="side-stack">
              <BudgetCard
                familyIndex={familyIndex}
                setFamilyIndex={setFamilyIndex}
                onOpenCalculator={() =>
                  showToast("Kalkulator Smart Budgeting siap digunakan.")
                }
              />
              <MapCard onNeedBackend={showToast} />
            </div>
          </div>
        </>
      )}

      <Footer />

      {/* Modal Dialog Login Admin */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
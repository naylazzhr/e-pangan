import { useMemo, useState, useEffect } from "react";
import "./App.css";

const CATEGORIES = [
  { label: "Semua Komoditas", icon: "" },
  { label: "Beras & Padi", icon: "🌾" },
  { label: "Bumbu Dapur & Cabai", icon: "🌶️" },
  { label: "Minyak Goreng & Mentega", icon: "🧈" },
  { label: "Daging, Unggas & Telur", icon: "🍗" },
  { label: "Gula & Tepung Terigu", icon: "🌿" },
];

const CATEGORY_MAP = {
  "Beras & Padi": ["KEBUTUHAN POKOK"],
  "Bumbu Dapur & Cabai": ["BUMBU DAPUR"],
  "Minyak Goreng & Mentega": ["MINYAK GORENG"],
  "Daging, Unggas & Telur": ["PROTEIN HEWANI"],
  "Gula & Tepung Terigu": ["BAHAN BAKU"],
};

// Data Cadangan (Fallback) jika Backend belum/tidak dinyalakan
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
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=600",
    badge: "Harga Stabil",
    badgeType: "stable",
    category: "PROTEIN HEWANI",
    name: "Daging Ayam Broiler",
    market: "Pasar Brondong & Sidoharjo",
    price: "Rp 34.000",
    unit: "/kg",
    delta: "Stabil (0.0%)",
    deltaType: "flat",
  },
  {
    id: 5,
    image: "bawangmerah.jpeg",
    badge: "Harga Stabil",
    badgeType: "stable",
    category: "PRODUKSI DAERAH",
    name: "Bawang Merah Allium",
    market: "Pasar Agrobis Babat",
    price: "Rp 27.500",
    unit: "/kg",
    delta: "-Rp 500 (-1.7%)",
    deltaType: "down",
  },
  {
    id: 6,
    image: "gula.jpeg",
    badge: "Harga Stabil",
    badgeType: "stable",
    category: "BAHAN BAKU",
    name: "Gula Pasir Kristal",
    market: "Pasar Sidoharjo & Blawi",
    price: "Rp 17.500",
    unit: "/kg",
    delta: "Stabil (0.0%)",
    deltaType: "flat",
  },
];

const FAMILY_OPTIONS = [
  { label: "2 Anggota", size: 2, perOrang: 360000 },
  { label: "4 Anggota", size: 4, perOrang: 362500 },
  { label: "6 Anggota", size: 6, perOrang: 355000 },
];

function formatRupiah(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

function Navbar({ onNeedBackend }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo">🌾</div>
        <div className="name">
          E-Pangan
          <small>KAB. LAMONGAN</small>
        </div>
      </div>

      <nav className="mainnav">
        <a className="active">Beranda</a>
        <a href="#">Cari Harga</a>
        <a href="#">Perbandingan Antar Pasar</a>
        <a href="#">Smart Budgeting</a>
        <a href="#">Detail Kios</a>
        <a href="#">Portal Admin</a>
      </nav>

      <div className="topbar-right">
        <div className="search-mini">🔍 Cari komoditas (Cabai, Beras...)</div>
        <button
          className="btn-login"
          onClick={() => onNeedBackend("Login Petugas butuh autentikasi dari backend Python.")}
        >
          👤 Login Petugas
        </button>
        <div className="avatar">👤</div>
      </div>
    </header>
  );
}

function Hero({ searchTerm, setSearchTerm, activeCategory, setActiveCategory }) {
  return (
    <section className="hero">
      <h1>Pantau Harga Bahan Pokok Terkini di Pasar Kabupaten Lamongan</h1>
      <p className="sub">
        Cari dan bandingkan harga komoditas dari berbagai pasar di Lamongan
        secara real-time
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
          <button className="btn-outline" type="button">
            ☰ Pilih Pasar
          </button>
          <button
            className="btn-solid"
            type="button"
            onClick={() =>
              document
                .getElementById("catalog-panel")
                ?.scrollIntoView({ behavior: "smooth" })
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
        <span>Senin (10 Feb)</span>
        <span>Rabu (12 Feb)</span>
        <span>Jumat (14 Feb)</span>
        <span className="now">Minggu (Hari Ini)</span>
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
        <a className="see-all" href="#">
          Lihat Seluruh Komoditas →
        </a>
      </div>
      <p className="catalog-sub">
        Diperbarui berdasarkan rata-rata sampling pedagang los basah &amp; kering
        Lamongan.
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
      <span className="tag-new">FITUR BARU DKPP</span>
      <h3>Smart Budgeting Pangan Bulanan</h3>
      <p>
        Rencanakan pengeluaran belanja bahan dapur keluarga Anda. Dapatkan
        rekomendasi kombinasi pasar termurah untuk menghemat hingga 25%
        pengeluaran.
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
      onClick={() => onNeedBackend("Peta geospasial akan diisi dari data lokasi pasar di backend.")}
    >
      <div className="icon">📍</div>
      <div className="txt">
        <b>Peta Geospasial Pasar</b>
        <span>Cek radius terdekat dari tempat tinggal Anda</span>
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
            Pangan Pokok Dinas Ketahanan Pangan dan Pertanian (DKPP) Kabupaten
            Lamongan.
          </p>
          <span className="ppid">PPID KABUPATEN LAMONGAN</span>
        </div>

        <div>
          <h4>LAYANAN PUBLIK</h4>
          <ul>
            <li>Katalog Harga Harian</li>
            <li>Peta Distribusi Pasar Rakyat</li>
            <li>Simulasi Belanja Keluarga</li>
            <li>Daftar Kios dan Pedagang Binaan</li>
          </ul>
        </div>

        <div>
          <h4>HOTLINE SATGAS PANGAN</h4>
          <div className="hotline-item">
            📞{" "}
            <span>
              Call Center Siaga:
              <br />
              0800-1-PANGAN-LA (0800-1-726426)
            </span>
          </div>
          <div className="hotline-item" style={{ marginTop: 10 }}>
            💬{" "}
            <span>
              WhatsApp Pelaporan Spekulasi:
              <br />
              +62 812-3456-7890 (24 Jam)
            </span>
          </div>
          <div className="hotline-item" style={{ marginTop: 10 }}>
            📍{" "}
            <span>Jl. Panglima Sudirman No. 1, Kabupaten Lamongan, Jawa Timur</span>
          </div>
        </div>

        <div>
          <h4>INFORMASI PEMBARUAN</h4>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
            Data diperbarui serentak setiap pukul 08:00 WIB dan 13:00 WIB oleh
            enumerator resmi di Pasar Babat, Pasar Sidoharjo, Pasar Agrobis
            Babat, dan 14 pasar daerah lainnya.
          </p>
          <div className="status-box">
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-soft)" }}>
              Status Server:
            </div>
            <div className="status-live">
              <span className="status-dot"></span>Sinkronisasi Realtime Aktif
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © 2025 Pemerintah Kabupaten Lamongan — Dinas Ketahanan Pangan dan
          Pertanian (DKPP). Hak Cipta Dilindungi Undang-Undang.
        </span>
        <div className="links">
          <a href="#">Kebijakan Privasi</a>
          <a href="#">Ketentuan Layanan</a>
          <a href="#">Portal Satu Data Lamongan</a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua Komoditas");
  const [familyIndex, setFamilyIndex] = useState(1); // default: 4 Anggota
  const [toastMsg, setToastMsg] = useState("");

  // State produk untuk menampung data dari Backend FastAPI
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  const showToast = (msg) => {
    setToastMsg(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    fetch("http://127.0.0.1:8000/komoditas")
      .then((res) => res.json())
      .then((result) => {
        // Ambil array dari response backend (misal: result.data)
        const rawData = result.data || result;

        // Ubah nama field dari API ke nama field yang dipakai UI
        const mappedData = rawData.map((item) => ({
          id: item.id,
          name: item.nama_bahan,        // nama_bahan dari DB -> name di UI
          category: item.kategori,      // kategori dari DB -> category di UI
          price: item.harga,            // harga dari DB -> price di UI
          unit: item.satuan,            // satuan dari DB -> unit di UI
          market: item.lokasi,          // lokasi dari DB -> market di UI
          // Gambar cadangan jika backend belum menyediakan URL gambar
          image: item.gambar || "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500"
        }));

        // Simpan data yang sudah disesuaikan ke state
        setKomoditas(mappedData);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

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

      <Navbar onNeedBackend={showToast} />
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
              showToast(`Perbandingan harga "${product.name}" antar pasar akan diambil dari backend.`)
            }
          />
        </div>

        <div className="side-stack">
          <BudgetCard
            familyIndex={familyIndex}
            setFamilyIndex={setFamilyIndex}
            onOpenCalculator={() =>
              showToast("Kalkulator belanja lengkap akan dibuka setelah backend siap.")
            }
          />
          <MapCard onNeedBackend={showToast} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
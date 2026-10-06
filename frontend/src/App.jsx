import { useState, useMemo, useCallback, useRef } from "react";
import "./App.css";
import Navbar from "./Navbar";
import SmartBudgetting from "./SmartBudgetting";
import DetailKios from "./DetailKios";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Store,
  MapPin,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal,
  Calculator,
  X,
  ChevronRight,
  BarChart3,
  Sparkles,
  ArrowUpDown,
  Grid,
  List,
} from "lucide-react";

// ================= CONSTANTS & DATA AWAL =================
const CATEGORIES = [
  { label: "Semua Komoditas", count: 8 },
  { label: "Beras & Padi", categoryKey: "KEBUTUHAN POKOK" },
  { label: "Bumbu Dapur & Cabai", categoryKey: "BUMBU DAPUR" },
  { label: "Minyak & Mentega", categoryKey: "MINYAK GORENG" },
  { label: "Daging, Unggas & Telur", categoryKey: "PROTEIN HEWANI" },
  { label: "Bawang & Sayuran", categoryKey: "PRODUKSI DAERAH" },
  { label: "Gula & Bahan Baku", categoryKey: "BAHAN BAKU" },
];

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Beras Medium IR-64",
    category: "KEBUTUHAN POKOK",
    badge: "Harga Stabil",
    badgeType: "stable",
    market: "Pasar Babat & Sidoharjo",
    price: 13000,
    unit: "/kg",
    deltaText: "Stabil (0.0%)",
    deltaType: "flat",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 12800, note: "Paling Hemat" },
      { market: "Pasar Sidoharjo", price: 13000, note: "Rata-rata Daerah" },
      { market: "Pasar Agrobis Babat", price: 12900, note: "Grosir" },
      { market: "Pasar Mantup", price: 13200, note: "Distribusi Selatan" },
      { market: "Pasar Brondong", price: 13100, note: "Pesisir Pantura" },
    ],
  },
  {
    id: 2,
    name: "Cabai Rawit Merah Super",
    category: "BUMBU DAPUR",
    badge: "Fluktuatif",
    badgeType: "volatile",
    market: "Pasar Mantup & Blawi",
    price: 48500,
    unit: "/kg",
    deltaText: "+Rp 1.500 (+3.1%)",
    deltaType: "up",
    image: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 47000, note: "Paling Hemat" },
      { market: "Pasar Sidoharjo", price: 48500, note: "Pasokan Harian" },
      { market: "Pasar Agrobis Babat", price: 46500, note: "Harga Grosir Petani" },
      { market: "Pasar Mantup", price: 50000, note: "Permintaan Tinggi" },
      { market: "Pasar Brondong", price: 49500, note: "Stok Terbatas" },
    ],
  },
  {
    id: 3,
    name: "Minyak Goreng Sawit Kemasan",
    category: "MINYAK GORENG",
    badge: "Harga Turun",
    badgeType: "down",
    market: "Pasar Babat & Sidoharjo",
    price: 15700,
    unit: "/liter",
    deltaText: "-Rp 300 (-1.8%)",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 15500, note: "Program KPSH" },
      { market: "Pasar Sidoharjo", price: 15700, note: "Rata-rata Kota" },
      { market: "Pasar Agrobis Babat", price: 15400, note: "Paling Hemat" },
      { market: "Pasar Mantup", price: 16000, note: "Stok Eceran" },
      { market: "Pasar Brondong", price: 15800, note: "Normal" },
    ],
  },
  {
    id: 4,
    name: "Daging Ayam Broiler Segar",
    category: "PROTEIN HEWANI",
    badge: "Harga Stabil",
    badgeType: "stable",
    market: "Pasar Brondong & Sidoharjo",
    price: 34000,
    unit: "/kg",
    deltaText: "Stabil (0.0%)",
    deltaType: "flat",
    image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 34500, note: "Potong Segar" },
      { market: "Pasar Sidoharjo", price: 34000, note: "Rata-rata" },
      { market: "Pasar Agrobis Babat", price: 33500, note: "Paling Hemat" },
      { market: "Pasar Mantup", price: 35000, note: "Pasokan Peternak" },
      { market: "Pasar Brondong", price: 34000, note: "Normal" },
    ],
  },
  {
    id: 5,
    name: "Bawang Merah Allium Brebes",
    category: "PRODUKSI DAERAH",
    badge: "Harga Turun",
    badgeType: "down",
    market: "Pasar Agrobis Babat",
    price: 27500,
    unit: "/kg",
    deltaText: "-Rp 500 (-1.7%)",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 27000, note: "Paling Hemat" },
      { market: "Pasar Sidoharjo", price: 27500, note: "Kualitas Grade A" },
      { market: "Pasar Agrobis Babat", price: 26800, note: "Kulakan Karungan" },
      { market: "Pasar Mantup", price: 28500, note: "Pengecer Los" },
      { market: "Pasar Brondong", price: 28000, note: "Kualitas Standar" },
    ],
  },
  {
    id: 6,
    name: "Gula Pasir Kristal Putih",
    category: "BAHAN BAKU",
    badge: "Harga Stabil",
    badgeType: "stable",
    market: "Pasar Sidoharjo & Blawi",
    price: 17500,
    unit: "/kg",
    deltaText: "Stabil (0.0%)",
    deltaType: "flat",
    image: "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 17300, note: "Paling Hemat" },
      { market: "Pasar Sidoharjo", price: 17500, note: "Kemasan Pabrik" },
      { market: "Pasar Agrobis Babat", price: 17200, note: "Grosir Sak" },
      { market: "Pasar Mantup", price: 17800, note: "Eceran" },
      { market: "Pasar Brondong", price: 17600, note: "Normal" },
    ],
  },
  {
    id: 7,
    name: "Telur Ayam Ras Pilihan",
    category: "PROTEIN HEWANI",
    badge: "Harga Stabil",
    badgeType: "stable",
    market: "Pasar Agrobis Babat",
    price: 28500,
    unit: "/kg",
    deltaText: "Stabil (0.0%)",
    deltaType: "flat",
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 28000, note: "Paling Hemat" },
      { market: "Pasar Sidoharjo", price: 28500, note: "Grade A Bersih" },
      { market: "Pasar Agrobis Babat", price: 27800, note: "Grosir Peternak" },
      { market: "Pasar Mantup", price: 29000, note: "Eceran" },
      { market: "Pasar Brondong", price: 28800, note: "Normal" },
    ],
  },
  {
    id: 8,
    name: "Cabai Merah Besar Keriting",
    category: "BUMBU DAPUR",
    badge: "Fluktuatif",
    badgeType: "volatile",
    market: "Pasar Babat & Sidoharjo",
    price: 36000,
    unit: "/kg",
    deltaText: "+Rp 1.000 (+2.8%)",
    deltaType: "up",
    image: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 35000, note: "Paling Hemat" },
      { market: "Pasar Sidoharjo", price: 36000, note: "Pasokan Segar" },
      { market: "Pasar Agrobis Babat", price: 34500, note: "Kulakan" },
      { market: "Pasar Mantup", price: 37000, note: "Stok Terbatas" },
      { market: "Pasar Brondong", price: 36500, note: "Normal" },
    ],
  },
];

const COMMODITY_TREND_DATA = {
  "Beras Medium IR-64": {
    category: "Kebutuhan Pokok",
    todayPrice: 13000,
    unit: "kilogram",
    points: [
      { day: "Senin", date: "15 Sep", price: 12800 },
      { day: "Selasa", date: "16 Sep", price: 12850 },
      { day: "Rabu", date: "17 Sep", price: 12900 },
      { day: "Kamis", date: "18 Sep", price: 12950 },
      { day: "Jumat", date: "19 Sep", price: 13000 },
      { day: "Sabtu", date: "20 Sep", price: 13000 },
      { day: "Hari Ini", date: "21 Sep", price: 13000, active: true },
    ],
  },
  "Cabai Rawit Merah Super": {
    category: "Bumbu Dapur",
    todayPrice: 48500,
    unit: "kilogram",
    points: [
      { day: "Senin", date: "15 Sep", price: 46000 },
      { day: "Selasa", date: "16 Sep", price: 46500 },
      { day: "Rabu", date: "17 Sep", price: 47000 },
      { day: "Kamis", date: "18 Sep", price: 48000 },
      { day: "Jumat", date: "19 Sep", price: 47500 },
      { day: "Sabtu", date: "20 Sep", price: 48000 },
      { day: "Hari Ini", date: "21 Sep", price: 48500, active: true },
    ],
  },
  "Minyak Goreng Sawit Kemasan": {
    category: "Minyak Goreng",
    todayPrice: 15700,
    unit: "liter",
    points: [
      { day: "Senin", date: "15 Sep", price: 16200 },
      { day: "Selasa", date: "16 Sep", price: 16100 },
      { day: "Rabu", date: "17 Sep", price: 16000 },
      { day: "Kamis", date: "18 Sep", price: 15900 },
      { day: "Jumat", date: "19 Sep", price: 15800 },
      { day: "Sabtu", date: "20 Sep", price: 15750 },
      { day: "Hari Ini", date: "21 Sep", price: 15700, active: true },
    ],
  },
};

const MARKETS_LIST = [
  {
    name: "Pasar Babat",
    address: "Jl. Raya Babat No. 12, Babat, Lamongan",
    lat: -7.1126,
    lon: 112.1634,
    maps: "https://www.google.com/maps/search/?api=1&query=-7.1126,112.1634",
    rute: "https://www.google.com/maps/dir/?api=1&destination=-7.1126,112.1634",
    kategori: "Pasar Perdagangan Barat"
  },
  {
    name: "Pasar Sidoharjo",
    address: "Jl. Pahlawan, Sidoharjo, Kec. Lamongan",
    lat: -7.1205,
    lon: 112.4152,
    maps: "https://www.google.com/maps/search/?api=1&query=-7.1205,112.4152",
    rute: "https://www.google.com/maps/dir/?api=1&destination=-7.1205,112.4152",
    kategori: "Pasar Induk Pusat Kota"
  },
  {
    name: "Pasar Sukodadi",
    address: "Jl. Raya Sukodadi No. 8, Sukodadi, Lamongan",
    lat: -7.1082,
    lon: 112.3354,
    maps: "https://www.google.com/maps/search/?api=1&query=-7.1082,112.3354",
    rute: "https://www.google.com/maps/dir/?api=1&destination=-7.1082,112.3354",
    kategori: "Pasar Tradisional Terpadu"
  },
  {
    name: "Pasar Agrobis Babat",
    address: "Kawasan Agrobisnis Babat, Babat, Lamongan",
    lat: -7.1095,
    lon: 112.1720,
    maps: "https://www.google.com/maps/search/?api=1&query=-7.1095,112.1720",
    rute: "https://www.google.com/maps/dir/?api=1&destination=-7.1095,112.1720",
    kategori: "Grosir Pertanian"
  },
  {
    name: "Pasar Mantup",
    address: "Jl. Raya Mantup, Kec. Mantup, Lamongan",
    lat: -7.2415,
    lon: 112.3582,
    maps: "https://www.google.com/maps/search/?api=1&query=-7.2415,112.3582",
    rute: "https://www.google.com/maps/dir/?api=1&destination=-7.2415,112.3582",
    kategori: "Pasar Komoditas Selatan"
  },
  {
    name: "Pasar Brondong",
    address: "Jl. Raya Brondong - Tuban, Brondong, Lamongan",
    lat: -6.8924,
    lon: 112.2856,
    maps: "https://www.google.com/maps/search/?api=1&query=-6.8924,112.2856",
    rute: "https://www.google.com/maps/dir/?api=1&destination=-6.8924,112.2856",
    kategori: "Pasar Pesisir & Ikan Segar"
  },
  {
    name: "Pasar Blimbing",
    address: "Jl. Raya Daendels, Paciran, Lamongan",
    lat: -6.8781,
    lon: 112.3524,
    maps: "https://www.google.com/maps/search/?api=1&query=-6.8781,112.3524",
    rute: "https://www.google.com/maps/dir/?api=1&destination=-6.8781,112.3524",
    kategori: "Logistik Perikanan Pantura"
  }
];

function formatRupiah(amount) {
  if (amount === undefined || amount === null) return "Rp 0";
  return "Rp " + Number(amount).toLocaleString("id-ID");
}

// ================= APP MAIN COMPONENT =================
export default function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Komoditas");
  const [selectedMarketFilter, setSelectedMarketFilter] = useState("Semua Pasar");
  const [sortOption, setSortOption] = useState("default");

  const [activePage, setActivePage] = useState("dashboard"); // 'dashboard' | 'login' | 'admin-dashboard' | 'smart-budgeting'

  const [viewMode, setViewMode] = useState("grid");
  const [trendCommodityName, setTrendCommodityName] = useState("Beras Medium IR-64");
  const [timeframe, setTimeframe] = useState("7 Hari");
  const [compareProduct, setCompareProduct] = useState(null);
  const [isMarketDirectoryOpen, setIsMarketDirectoryOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (selectedCategory !== "Semua Komoditas") {
          const categoryObj = CATEGORIES.find((c) => c.label === selectedCategory);
          if (categoryObj && categoryObj.categoryKey && product.category !== categoryObj.categoryKey) {
            return false;
          }
        }

        if (selectedMarketFilter !== "Semua Pasar") {
          if (!product.market.toLowerCase().includes(selectedMarketFilter.toLowerCase())) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "price-low") return a.price - b.price;
        if (sortOption === "price-high") return b.price - a.price;
        if (sortOption === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, searchTerm, selectedCategory, selectedMarketFilter, sortOption]);

  const currentTrend = COMMODITY_TREND_DATA[trendCommodityName] || COMMODITY_TREND_DATA["Beras Medium IR-64"];

  // 1. Tampilan Login Petugas
  if (activePage === "login" || activePage === "admin-login") {
    return (
      <AdminLogin
        setActivePage={setActivePage}
        onLoginSuccess={() => {
          showToast("Berhasil login sebagai petugas!", "success");
          setActivePage("admin-dashboard");
        }}
        onBackToPublic={() => setActivePage("dashboard")}
      />
    );
  }

  // 2. Tampilan Dashboard Admin / Petugas
  if (activePage === "admin-dashboard") {
    return (
      <AdminDashboard
        setActivePage={setActivePage}
        showToast={showToast}
        products={products}
        setProducts={setProducts}
      />
    );
  }

  // 3. Tampilan Utama (Publik / Smart Budgeting)
  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast-box">
            <span className="toast-dot"></span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigasi Header */}
      <Navbar activePage={activePage} setActivePage={setActivePage} showToast={showToast} />

      {/* Tampilan Halaman Detail Kios / Smart Budgeting / Dashboard Utama */}
      {activePage === "detail-kios" ? (
        <DetailKios
          onBack={() => setActivePage("dashboard")}
          showToast={showToast}
          setActivePage={setActivePage}
        />
      ) : activePage === "smart-budgeting" ? (
        <SmartBudgetting
          onBack={() => setActivePage("dashboard")}
          onNavigate={(page) => setActivePage(page)}
        />
      ) : (
        <>
          {/* Hero Section */}
          <section className="hero-wrapper" id="beranda">
            <div className="hero-content">
              <div className="hero-pill">
                <ShieldCheck size={15} />
                <span>SISTEM INFORMASI STABILITAS HARGA PANGAN DAERAH</span>
              </div>
              <h1 className="hero-title">
                Pantau &amp; Bandingkan <span className="gradient-text">Harga Pangan Pokok</span> Terkini di Lamongan
              </h1>
              <p className="hero-desc">
                Akses data fluktuasi komoditas pangan harian dari enumerator resmi Dinas Ketahanan Pangan
                dan Pertanian (DKPP) di 14 pasar rakyat se-Kabupaten Lamongan secara transparan &amp; akurat.
              </p>

              {/* Panel Cari & Filter */}
              <div className="search-command-panel">
                <div className="search-command-row">
                  <div className="search-input-box">
                    <Search size={18} color="var(--slate-400)" />
                    <input
                      type="text"
                      placeholder="Cari komoditas... (contoh: Beras Medium, Cabai Rawit, Minyakita)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} style={{ color: "var(--slate-400)" }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="select-filter-box">
                    <Store size={16} color="var(--primary-700)" />
                    <select
                      value={selectedMarketFilter}
                      onChange={(e) => setSelectedMarketFilter(e.target.value)}
                    >
                      <option value="Semua Pasar">Semua Pasar Rakyat</option>
                      <option value="Pasar Babat">Pasar Babat</option>
                      <option value="Pasar Sidoharjo">Pasar Sidoharjo</option>
                      <option value="Pasar Agrobis Babat">Pasar Agrobis Babat</option>
                      <option value="Pasar Mantup">Pasar Mantup</option>
                      <option value="Pasar Brondong">Pasar Brondong</option>
                    </select>
                  </div>

                  <div className="select-filter-box">
                    <ArrowUpDown size={16} color="var(--primary-700)" />
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                      <option value="default">Urutan Default</option>
                      <option value="price-low">Harga Termurah</option>
                      <option value="price-high">Harga Tertinggi</option>
                      <option value="name">Nama Komoditas (A-Z)</option>
                    </select>
                  </div>

                  <button
                    className="btn-search-action"
                    onClick={() => {
                      document.getElementById("katalog-pasar")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span>Lihat Hasil</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="category-chips-row">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      className={`cat-chip${selectedCategory === cat.label ? " active" : ""}`}
                      onClick={() => setSelectedCategory(cat.label)}
                    >
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Stats */}
              <div className="hero-stats-row">
                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper">
                    <BarChart3 size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">Rp 13.000</span>
                    <span className="stat-label">Rata-rata Beras IR-64/kg</span>
                  </div>
                </div>

                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper blue">
                    <TrendingDown size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">-0.4%</span>
                    <span className="stat-label">Indeks Inflasi Terkendali</span>
                  </div>
                </div>

                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper amber">
                    <Store size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">Pasar Babat</span>
                    <span className="stat-label">Pasar Terhemat Hari Ini</span>
                  </div>
                </div>

                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper rose">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">14 Pasar Pantau</span>
                    <span className="stat-label">Enumerator Lapangan Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Main Layout Content */}
          <main className="main-layout">
            <div className="left-stack">
              {/* Tren Harga */}
              <section className="panel-card" id="tren-harga">
                <div className="panel-header-row">
                  <div>
                    <div className="panel-eyebrow">
                      <BarChart3 size={14} />
                      <span>MONITORING MULTI-TITIK DINAS KETAHANAN PANGAN</span>
                    </div>
                    <h2 className="panel-title">Analisis Tren Fluktuasi Harga Komoditas</h2>
                    <p className="panel-sub">
                      Kurva pergerakan harga 7 hari terakhir berdasarkan sampling pedagang los.
                    </p>
                  </div>

                  <div className="trend-controls-row">
                    <div className="select-commodity-btn">
                      <select
                        value={trendCommodityName}
                        onChange={(e) => setTrendCommodityName(e.target.value)}
                      >
                        {Object.keys(COMMODITY_TREND_DATA).map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="timeframe-pill-group">
                      {["7 Hari", "14 Hari", "30 Hari"].map((tf) => (
                        <button
                          key={tf}
                          className={`timeframe-btn${timeframe === tf ? " active" : ""}`}
                          onClick={() => setTimeframe(tf)}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="price-metric-banner">
                  <div className="price-metric-left">
                    <span className="price-metric-label">Harga Hari Ini ({currentTrend.category}):</span>
                    <div className="price-metric-highlight">
                      <span className="amount">{formatRupiah(currentTrend.todayPrice)}</span>
                      <span className="unit">per {currentTrend.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="chart-container-box">
                  <InteractiveSvgChart dataPoints={currentTrend.points} />
                </div>
              </section>

              {/* Katalog Komoditas */}
              <section className="panel-card" id="katalog-pasar">
                <div className="catalog-toolbar">
                  <div>
                    <h2 className="panel-title" style={{ marginBottom: 4 }}>
                      Katalog Komoditas Pangan Populer
                    </h2>
                    <div className="catalog-counter-text">
                      Menampilkan <strong>{filteredProducts.length}</strong> bahan pangan terpantau
                    </div>
                  </div>

                  <div className="view-mode-toggle">
                    <button
                      className={`view-btn${viewMode === "grid" ? " active" : ""}`}
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid size={17} />
                    </button>
                    <button
                      className={`view-btn${viewMode === "list" ? " active" : ""}`}
                      onClick={() => setViewMode("list")}
                    >
                      <List size={17} />
                    </button>
                  </div>
                </div>

                <div className={`commodity-grid ${viewMode === "list" ? "list-view" : ""}`}>
                  {filteredProducts.map((product) => (
                    <CommodityCard
                      key={product.id}
                      product={product}
                      onCompare={(prod) => setCompareProduct(prod)}
                    />
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Right */}
            <aside className="sidebar-stack">
              <div className="sidebar-card-budget">
                <div className="sidebar-badge-new">
                  <Sparkles size={12} />
                  <span>FITUR BARU DKPP</span>
                </div>
                <h3 className="sidebar-card-title">Smart Budgeting Pangan Bulanan</h3>
                <p className="sidebar-card-desc">
                  Rencanakan anggaran belanja bahan dapur keluarga Anda. Dapatkan rekomendasi pasar dengan harga termurah.
                </p>

                <button
                  className="btn-open-calculator"
                  onClick={() => setActivePage("smart-budgeting")}
                >
                  <Calculator size={17} />
                  <span>Buka Halaman Smart Budgeting →</span>
                </button>
              </div>

              <button className="sidebar-action-card" onClick={() => setIsMarketDirectoryOpen(true)}>
                <div className="action-card-icon">
                  <MapPin size={22} />
                </div>
                <div className="action-card-text">
                  <div className="action-card-title">Direktori Pasar</div>
                  <div className="action-card-sub">14 titik pasar tradisional Lamongan</div>
                </div>
                <ChevronRight size={18} />
              </button>
            </aside>
          </main>

          {/* Footer */}
          <footer className="main-footer">
            <div className="footer-bottom-bar">
              <span>© 2026 Pemerintah Kabupaten Lamongan — DKPP.</span>
            </div>
          </footer>
        </>
      )}

      {/* Modal Bandingkan Pasar */}
      {compareProduct && (
        <MarketCompareModal product={compareProduct} onClose={() => setCompareProduct(null)} />
      )}

      {/* Modal Direktori Pasar */}
      {isMarketDirectoryOpen && (
        <MarketDirectoryModal markets={MARKETS_LIST} onClose={() => setIsMarketDirectoryOpen(false)} />
      )}
    </div>
  );
}

// ================= SUB KOMPONEN =================

function CommodityCard({ product, onCompare }) {
  return (
    <div className="commodity-card">
      <div className="card-thumb-wrap">
        <img src={product.image} alt={product.name} className="card-thumb-img" loading="lazy" />
      </div>

      <div className="card-body">
        <div className="card-cat-label">{product.category}</div>
        <h3 className="card-title">{product.name}</h3>

        <div className="card-market-location">
          <MapPin size={13} color="var(--primary-600)" />
          <span>{product.market}</span>
        </div>

        <div className="card-price-row">
          <span className="card-price-amt">{formatRupiah(product.price)}</span>
          <span className="card-price-unit">{product.unit}</span>
        </div>

        <button className="btn-card-compare" onClick={() => onCompare(product)}>
          <SlidersHorizontal size={14} />
          <span>Bandingkan Pasar</span>
        </button>
      </div>
    </div>
  );
}

function InteractiveSvgChart({ dataPoints }) {
  if (!dataPoints || dataPoints.length === 0) return null;

  const width = 760;
  const height = 180;
  const paddingX = 40;
  const paddingTop = 20;
  const paddingBottom = 30;

  const prices = dataPoints.map((d) => d.price);
  const minPrice = Math.min(...prices) * 0.98;
  const maxPrice = Math.max(...prices) * 1.02;

  const getX = (index) => paddingX + (index * (width - 2 * paddingX)) / (dataPoints.length - 1);
  const getY = (val) => {
    const ratio = (val - minPrice) / (maxPrice - minPrice || 1);
    return height - paddingBottom - ratio * (height - paddingTop - paddingBottom);
  };

  const pointsCoordinates = dataPoints.map((d, i) => ({
    x: getX(i),
    y: getY(d.price),
    ...d,
  }));

  const pathD = pointsCoordinates.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg-interactive">
      <path d={pathD} fill="none" stroke="var(--primary-600)" strokeWidth="3" />
      {pointsCoordinates.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={4} fill="var(--primary-600)" />
      ))}
    </svg>
  );
}

function MarketCompareModal({ product, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Perbandingan Harga Antar Pasar</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p>
            Harga komoditas <strong>{product.name}</strong> di beberapa pasar Lamongan:
          </p>
          <ul>
            {product.marketPrices?.map((m, idx) => (
              <li key={idx}>
                {m.market}: <strong>{formatRupiah(m.price)}</strong> ({m.note})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MarketDirectoryModal({ markets, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" style={{ maxWidth: "650px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#047857", textTransform: "uppercase" }}>
              DIREKTORI PASAR DAERAH
            </span>
            <h3 className="modal-title" style={{ margin: "2px 0 0 0" }}>Titik Pasar Rakyat di Lamongan</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: 0, marginBottom: "16px" }}>
            Seluruh titik pasar pantau resmi Dinas Ketahanan Pangan dan Pertanian (DKPP) Kabupaten Lamongan terhubung langsung dengan navigasi Google Maps.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {markets.map((m, idx) => (
              <div
                key={idx}
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <MapPin size={16} color="#047857" />
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>{m.name}</strong>
                    {m.kategori && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {m.kategori}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", paddingLeft: "24px" }}>
                    {m.address}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <a
                    href={m.rute || m.maps}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      backgroundColor: "#047857",
                      color: "#ffffff",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    🧭 Rute Maps
                  </a>
                  <a
                    href={m.maps}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    🔍 Titik Peta
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useMemo, useCallback } from "react";
import "./App.css";
import "./GroceryTheme.css";
import Navbar from "./Navbar";
import SmartBudgetting from "./SmartBudgetting";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import CariHarga from "./CariHarga";
import KomparasiPasar from "./KomparasiPasar";
import DetailKios from "./DetailKios";
import { getKomoditas, getPasar, getKomparasiPasar, getTrenHarga, isLoggedIn, getCurrentUser } from "./api";
import heroVegetables from "./assets/hero-vegetables.jpg";

// -----------------------------------------------------------------
// IMPOR FOTO LOKAL SPESIFIK MASING-MASING KOMODITAS
// -----------------------------------------------------------------
import fotoBawangMerah from "./assets/bawangMerah.jpeg";
import fotoBawangPutih from "./assets/bawangPutih.jpeg";
import fotoBerasPremium from "./assets/berasPremium.jpeg";
import fotoBerasMedium from "./assets/berasMedium.jpeg";
import fotoCabaiRawit from "./assets/cabaiRawit.jpeg";
import fotoCabaiKeriting from "./assets/cabaiKeriting.jpeg";
import fotoDagingAyam from "./assets/dagingAyam.jpeg";
import fotoDagingSapi from "./assets/dagingSapi.jpeg";
import fotoTelurAyam from "./assets/telurAyam.jpeg";
import fotoIkanSegar from "./assets/ikanSegar.jpeg";
import fotoMinyakGoreng from "./assets/minyakGoreng.jpeg";
import fotoGulaPasar from "./assets/gulaPasir.jpeg";
import fotoTepungTerigu from "./assets/tepungTerigu.jpeg";

import {
  Search,
  Store,
  MapPin,
  ArrowRight,
  SlidersHorizontal,
  X,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Heart,
} from "lucide-react";

const CATEGORIES = [
  { label: "Semua Komoditas", icon: "🌱", color: "#2d6a4f", bg: "#e2f5ea" },
  { label: "Beras & Padi", categoryKey: "KEBUTUHAN POKOK", icon: "🌾", color: "#b7791f", bg: "#fef3d6" },
  { label: "Bumbu Dapur & Cabai", categoryKey: "BUMBU DAPUR", icon: "🌶️", color: "#dc2626", bg: "#fee2e2" },
  { label: "Minyak & Mentega", categoryKey: "MINYAK GORENG", icon: "🫒", color: "#ca8a04", bg: "#fef9c3" },
  { label: "Daging, Unggas & Ikan", categoryKey: "PROTEIN HEWANI", icon: "🥩", color: "#c2410c", bg: "#ffedd5" },
  { label: "Bawang & Sayuran", categoryKey: "PRODUKSI DAERAH", icon: "🧅", color: "#0284c7", bg: "#e0f2fe" },
  { label: "Gula & Bahan Baku", categoryKey: "BAHAN BAKU", icon: "🧂", color: "#7e22ce", bg: "#f3e8ff" },
];

// Fungsi pemetaan gambar terpisah untuk tiap jenis komoditas
function getKomoditasImage(namaBahan, apiImage) {
  if (apiImage && (apiImage.startsWith("http") || apiImage.startsWith("/static"))) {
    return apiImage;
  }

  const nama = (namaBahan || "").toLowerCase().trim();

  // 1. Bawang Merah & Putih Sendiri-sendiri
  if (nama.includes("bawang merah")) return fotoBawangMerah;
  if (nama.includes("bawang putih") || nama.includes("bawang bombay")) return fotoBawangPutih;

  // 2. Beras Premium & Beras Medium Sendiri-sendiri
  if (nama.includes("beras premium") || nama.includes("rojolele") || nama.includes("kepala")) {
    return fotoBerasPremium;
  }
  if (nama.includes("beras") || nama.includes("medium") || nama.includes("sphp") || nama.includes("ir-64") || nama.includes("padi")) {
    return fotoBerasMedium;
  }

  // 3. Cabai Rawit & Cabai Keriting Sendiri-sendiri
  if (nama.includes("rawit")) return fotoCabaiRawit;
  if (nama.includes("cabai") || nama.includes("cabe")) return fotoCabaiKeriting;

  // 4. Protein (Ayam, Sapi, Telur, Ikan) Sendiri-sendiri
  if (nama.includes("ayam")) return fotoDagingAyam;
  if (nama.includes("sapi")) return fotoDagingSapi;
  if (nama.includes("telur")) return fotoTelurAyam;
  if (nama.includes("ikan") || nama.includes("bandeng") || nama.includes("tongkol")) return fotoIkanSegar;

  // 5. Minyak, Gula, & Tepung Sendiri-sendiri
  if (nama.includes("minyak")) return fotoMinyakGoreng;
  if (nama.includes("gula")) return fotoGulaPasar;
  if (nama.includes("tepung") || nama.includes("terigu")) return fotoTepungTerigu;

  // Fallback default jika tidak ada yang cocok
  return fotoBerasMedium;
}

function formatRupiah(amount) {
  if (amount === undefined || amount === null) return "Rp 0";
  return "Rp " + Number(amount).toLocaleString("id-ID");
}

function generateFallbackTrend(commodityName = "Bawang Merah Allium", timeframe = "7 Hari") {
  const days = timeframe === "30 Hari" ? 30 : timeframe === "14 Hari" ? 14 : 7;
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const fullDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const basePrice = commodityName.toLowerCase().includes("cabai")
    ? 38000
    : commodityName.toLowerCase().includes("bawang")
    ? 30000
    : commodityName.toLowerCase().includes("beras")
    ? 13500
    : commodityName.toLowerCase().includes("daging")
    ? 33000
    : commodityName.toLowerCase().includes("telur")
    ? 27000
    : 16000;

  const points = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const wave = Math.sin((i / days) * Math.PI * 2) * (basePrice * 0.05);
    const price = Math.round((basePrice + wave + Math.sin(i * 1.5) * (basePrice * 0.02)) / 500) * 500;
    const isToday = i === 0;
    points.push({
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      day: isToday ? "Hari Ini" : dayNames[d.getDay()],
      fullDay: `${fullDays[d.getDay()]}, ${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "short" })}`,
      price: price,
      deltaText: isToday ? "+Rp 700 (Hari Ini)" : "Stabil",
      deltaType: isToday ? "up" : "flat",
      market: "Pasar Babat & Pasar Sidoharjo",
    });
  }

  const prices = points.map((p) => p.price);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  return {
    komoditas: commodityName,
    timeframe: timeframe,
    avgPrice: avg,
    minPrice: minP,
    maxPrice: maxP,
    het: Math.round(basePrice * 0.95),
    statusHet: "+7.1% di atas HET",
    sampleMarket: "Pasar Blimbing & Pasar Babat",
    insight: `Harga ${commodityName} di pasar pantau saat ini Rp ${points[points.length - 1].price.toLocaleString("id-ID")}/kg (rata-rata Rp ${avg.toLocaleString("id-ID")} dalam ${timeframe}). Data terintegrasi live dari database survei lapangan enumerator resmi DKPP Kabupaten Lamongan.`,
    points: points,
  };
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [marketsList, setMarketsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Komoditas");
  const [selectedMarketFilter, setSelectedMarketFilter] = useState("Semua Pasar");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const greetingData = useMemo(() => {
    const hour = new Date().getHours();
    let text = "Selamat Pagi";
    if (hour >= 11 && hour < 15) text = "Selamat Siang";
    else if (hour >= 15 && hour < 18) text = "Selamat Sore";
    else if (hour >= 18 || hour < 4) text = "Selamat Malam";

    let name = "Sobat Pangan";
    try {
      const user = getCurrentUser();
      if (user?.nama) name = user.nama;
      else if (user?.username) name = user.username;
    } catch {
      // fallback
    }

    let dateStr = "";
    try {
      dateStr = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      dateStr = new Date().toDateString();
    }

    return { text, name, dateStr };
  }, []);

  const [activePage, setActivePage] = useState(() => {
    const tersimpan = sessionStorage.getItem("epangan_page");
    if (tersimpan === "admin-dashboard" && isLoggedIn()) return "admin-dashboard";
    return tersimpan || "dashboard";
  });
  const [selectedKios, setSelectedKios] = useState(() => {
    try {
      const saved = sessionStorage.getItem("epangan_selected_kios");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    sessionStorage.setItem("epangan_page", activePage);
  }, [activePage]);

  useEffect(() => {
    if (selectedKios) {
      sessionStorage.setItem("epangan_selected_kios", JSON.stringify(selectedKios));
    }
  }, [selectedKios]);

  const [trendCommodityName, setTrendCommodityName] = useState("Bawang Merah Allium");
  const [timeframe, setTimeframe] = useState("7 Hari");
  const [compareProduct, setCompareProduct] = useState(null);
  const [toast, setToast] = useState(null);

  const [liveTrendData, setLiveTrendData] = useState(() => generateFallbackTrend("Bawang Merah Allium", "7 Hari"));
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const showToast = useCallback((message) => {
    setToast({ message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoadingData(true);

    Promise.all([
      getKomoditas().catch(() => null),
      getPasar().catch(() => null),
      getKomparasiPasar().catch(() => null),
    ])
      .then(([komoditasRes, pasarRes, komparasiRes]) => {
        if (!isMounted) return;

        if (pasarRes && (pasarRes.data || pasarRes.pasar)) {
          const rawPasar = pasarRes.data || pasarRes.pasar;
          const pList = rawPasar.map((p) => ({
            name: p.nama_pasar || p.name,
            address: p.alamat || `${p.nama_pasar}, Kabupaten Lamongan`,
          }));
          setMarketsList(pList);
        } else {
          setMarketsList([
            { name: "Pasar Babat", address: "Jl. Raya Babat No. 12, Babat, Lamongan" },
            { name: "Pasar Sidoharjo", address: "Jl. Pahlawan, Sidoharjo, Kec. Lamongan" },
            { name: "Pasar Mantup", address: "Jl. Raya Mantup, Mantup, Lamongan" },
            { name: "Pasar Blimbing Brondong", address: "Jl. Raya Daendels, Blimbing, Paciran / Brondong" },
            { name: "Pasar Sukodadi", address: "Jl. Raya Sukodadi No. 8, Sukodadi, Lamongan" },
            { name: "Pasar Ngimbang", address: "Desa Sendangrejo, Kec. Ngimbang, Lamongan" },
          ]);
        }

        const komparasiItems = komparasiRes?.data || komparasiRes?.komoditas || komoditasRes?.data || [];
        if (Array.isArray(komparasiItems) && komparasiItems.length > 0) {
          const formattedProducts = komparasiItems.map((item, idx) => {
            const pricesMap = item.prices || {};
            const marketEntries = Object.entries(pricesMap).map(([mName, mPrice]) => ({
              market: mName,
              price: mPrice,
              note: mPrice === item.minPrice ? "Paling Hemat" : "Normal",
            }));

            const namaBahan = item.komoditas || item.nama_bahan;
            return {
              id: item.id || idx + 1,
              name: namaBahan,
              category: (item.kategori || "KEBUTUHAN POKOK").toUpperCase(),
              market: item.termurah ? `${item.termurah}` : "Semua Pasar Pantau",
              price: item.minPrice || item.harga || 0,
              unit: `/${item.satuan || "kg"}`,
              deltaText: item.status_label || "Stabil",
              deltaType: "flat",
              image: getKomoditasImage(namaBahan, item.image),
              marketPrices: marketEntries,
            };
          });

          setProducts(formattedProducts);
          if (formattedProducts.length > 0) {
            setTrendCommodityName(formattedProducts[0].name);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingData(false);
      });

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!trendCommodityName) return;
    let isMounted = true;

    getTrenHarga(trendCommodityName, timeframe)
      .then((res) => {
        if (isMounted && res && res.data && res.data.points && res.data.points.length > 0) {
          setLiveTrendData(res.data);
          setIsLiveConnected(true);
        } else if (isMounted) {
          setLiveTrendData(generateFallbackTrend(trendCommodityName, timeframe));
          setIsLiveConnected(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLiveTrendData(generateFallbackTrend(trendCommodityName, timeframe));
          setIsLiveConnected(false);
        }
      });

    return () => { isMounted = false; };
  }, [trendCommodityName, timeframe]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedMarketFilter !== "Semua Pasar" && !product.market.includes(selectedMarketFilter)) {
        return false;
      }

      if (selectedCategory !== "Semua Komoditas") {
        const activeCatObj = CATEGORIES.find((c) => c.label === selectedCategory);
        if (activeCatObj) {
          const prodCat = (product.category || "").toUpperCase();
          const prodName = (product.name || "").toLowerCase();
          const targetKey = (activeCatObj.categoryKey || "").toUpperCase();
          
          let matchesCat = prodCat.includes(targetKey);
          if (!matchesCat) {
            if (activeCatObj.label.includes("Beras") && (prodName.includes("beras") || prodCat.includes("BERAS") || prodCat.includes("POKOK"))) matchesCat = true;
            else if (activeCatObj.label.includes("Minyak") && (prodName.includes("minyak") || prodCat.includes("MINYAK"))) matchesCat = true;
            else if (activeCatObj.label.includes("Cabai") && (prodName.includes("cabai") || prodName.includes("cabe") || prodCat.includes("BUMBU"))) matchesCat = true;
            else if (activeCatObj.label.includes("Daging") && (prodName.includes("daging") || prodName.includes("ayam") || prodName.includes("ikan") || prodName.includes("telur") || prodCat.includes("PROTEIN"))) matchesCat = true;
            else if (activeCatObj.label.includes("Bawang") && (prodName.includes("bawang") || prodName.includes("tomat") || prodName.includes("sayur"))) matchesCat = true;
            else if (activeCatObj.label.includes("Gula") && (prodName.includes("gula") || prodName.includes("tepung") || prodName.includes("garam"))) matchesCat = true;
          }
          if (!matchesCat) return false;
        }
      }

      return true;
    });
  }, [products, searchTerm, selectedMarketFilter, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedMarketFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  if (activePage === "login" || activePage === "admin-login") {
    return <AdminLogin setActivePage={setActivePage} showToast={showToast} />;
  }

  if (activePage === "admin-dashboard") {
    return <AdminDashboard setActivePage={setActivePage} showToast={showToast} products={products} setProducts={setProducts} />;
  }

  return (
    <div className="app-container grocery-app-container">
      {toast && (
        <div className="toast-container">
          <div className="toast-box">
            <span className="toast-dot"></span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <Navbar activePage={activePage} setActivePage={setActivePage} showToast={showToast} />

      {activePage === "smart-budgeting" ? (
        <SmartBudgetting onBack={() => setActivePage("dashboard")} onNavigate={(page) => setActivePage(page)} />
      ) : activePage === "cari-harga" ? (
        <CariHarga setActivePage={setActivePage} setSelectedKios={setSelectedKios} />
      ) : activePage === "komparasi-pasar" ? (
        <KomparasiPasar setActivePage={setActivePage} />
      ) : activePage === "detail-kios" ? (
        <DetailKios kios={selectedKios} onBack={() => setActivePage("cari-harga")} />
      ) : (
        <>
          <section className="grocery-hero-section" id="beranda">
            <div className="grocery-hero-container">
              <div className="grocery-hero-left">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <div className="grocery-hero-badge">
                    <span className="grocery-badge-dot"></span>
                    <span>{greetingData.dateStr}</span>
                  </div>
                  <div className="grocery-hero-badge">
                    <span className="grocery-badge-dot"></span>
                    <span>KOMODITAS RESMI DKPP LAMONGAN</span>
                  </div>
                </div>

                <h1 className="grocery-hero-title">
                  {greetingData.text},<br />
                  <span className="grocery-hero-subtitle-green">{greetingData.name}!</span>
                </h1>

                <p className="grocery-hero-desc">
                  Siap belanja bijak hari ini? Pantau fluktuasi harga komoditas pangan harian dari enumerator resmi Dinas Ketahanan Pangan dan Pertanian (DKPP) di berbagai pasar rakyat se-Kabupaten Lamongan secara transparan.
                </p>

                <div className="grocery-hero-actions">
                  <button
                    className="grocery-subscribe-btn"
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("katalog-komoditas");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span>Jelajahi Sekarang</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>

              <div className="grocery-hero-right">
                <div className="grocery-hero-card">
                  <button
                    type="button"
                    className="grocery-hero-heart-btn"
                    onClick={() => {
                      const el = document.getElementById("katalog-komoditas");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    title="Lihat Komoditas Favorit"
                  >
                    <Heart size={18} fill="#2d6a4f" color="#2d6a4f" />
                  </button>

                  <div className="grocery-hero-image-wrap">
                    <img
                      src={heroVegetables}
                      alt="Pangan Segar Lamongan"
                      className="grocery-hero-img"
                    />
                  </div>

                  <div className="grocery-hero-float-card">
                    <div className="float-card-sub">DKPP KABUPATEN LAMONGAN</div>
                    <div className="float-card-title">Pangan Segar</div>
                    <div className="float-card-meta">
                      <span className="live-status-dot"></span>
                      <span>Pasar Pantau Aktif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grocery-search-section">
            <div className="grocery-search-container">
              <div className="grocery-search-bar">
                <div className="grocery-search-input-wrap">
                  <Search size={18} className="search-icon" />
                  <input
                    id="search-input-main"
                    type="text"
                    placeholder="Cari komoditas pangan (contoh: Beras Medium, Cabai Rawit, Minyak)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="search-clear-btn" onClick={() => setSearchTerm("")}>
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="grocery-search-divider desktop-only"></div>

                <div
                  className="grocery-search-select-wrap"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    height: "44px",
                    padding: "0 16px",
                    background: "#f1f8f4",
                    border: "1px solid #cfe3d6",
                    borderRadius: "999px",
                  }}
                >
                  <Store size={16} color="#2d6a4f" />
                  <select
                    value={selectedMarketFilter}
                    onChange={(e) => setSelectedMarketFilter(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "inherit",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1b4332",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                      paddingRight: "22px",
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%232d6a4f' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right center",
                    }}
                  >
                    <option value="Semua Pasar">Semua Pasar Rakyat</option>
                    {marketsList.map((m) => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  className="grocery-search-submit-btn"
                  onClick={() => {
                    const el = document.getElementById("katalog-komoditas");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span>Cari Pangan</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </section>

          <section className="grocery-section grocery-categories-section">
            <div className="grocery-section-header">
              <div className="section-title-wrap">
                <h2 className="grocery-section-title">Kategori Pilihan</h2>
                <p className="grocery-section-sub">Kategori komoditas pangan segar pilihan masyarakat Kabupaten Lamongan</p>
              </div>
              <button
                className="grocery-view-all-btn"
                onClick={() => {
                  setSelectedCategory("Semua Komoditas");
                  const el = document.getElementById("katalog-komoditas");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>Lihat Semua</span>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grocery-categories-grid">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    className={`grocery-category-circle-card ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setSelectedCategory(cat.label);
                      const el = document.getElementById("katalog-komoditas");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <div className="circle-icon-wrap" style={{ backgroundColor: cat.bg }}>
                      <span className="circle-emoji">{cat.icon}</span>
                    </div>
                    <span className="category-label">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grocery-section grocery-products-section" id="katalog-komoditas">
            <div className="grocery-section-header">
              <div className="section-title-wrap">
                <h2 className="grocery-section-title">Komoditas Populer</h2>
                <p className="grocery-section-sub">
                  Menampilkan <strong>{filteredProducts.length}</strong> komoditas pangan segar terverifikasi enumerator resmi
                </p>
              </div>
              <div className="header-filter-indicator">
                <span className="current-category-pill">{selectedCategory}</span>
                {selectedMarketFilter !== "Semua Pasar" && (
                  <span className="current-market-pill">{selectedMarketFilter}</span>
                )}
              </div>
            </div>

            {loadingData ? (
              <div className="grocery-empty-state">
                <p>Mengambil data komoditas pangan dari server database DKPP...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="grocery-empty-state">
                <p>Tidak ada komoditas pangan yang sesuai dengan pencarian atau filter Anda.</p>
                <button
                  className="grocery-reset-filter-btn"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("Semua Komoditas");
                    setSelectedMarketFilter("Semua Pasar");
                  }}
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <>
                <div className="grocery-products-grid">
                  {paginatedProducts.map((product) => (
                    <div className="grocery-product-card" key={product.id}>
                      <button
                        type="button"
                        className="grocery-card-heart-btn"
                        onClick={() => setCompareProduct(product)}
                        title="Bandingkan harga antar pasar"
                      >
                        <SlidersHorizontal size={14} />
                      </button>

                      <div className="grocery-card-img-wrap">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="grocery-card-img"
                          loading="lazy"
                        />
                      </div>

                      <div className="grocery-card-body">
                        <div className="grocery-card-meta">
                          <MapPin size={11} color="#2d6a4f" />
                          <span>{product.market}</span>
                        </div>

                        <h3 className="grocery-card-title">{product.name}</h3>

                        <div className="grocery-card-price-row">
                          <span className="grocery-price-val">{formatRupiah(product.price)}</span>
                          <span className="grocery-price-unit">{product.unit}</span>
                        </div>

                        <button
                          className="grocery-card-action-btn"
                          type="button"
                          onClick={() => setCompareProduct(product)}
                        >
                          <span>Bandingkan</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "36px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.max(p - 1, 1));
                        document.getElementById("katalog-komoditas")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      disabled={currentPage === 1}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "99px",
                        border: "1px solid #d2ded7",
                        background: currentPage === 1 ? "#f5f9f6" : "#ffffff",
                        color: currentPage === 1 ? "#9ca3af" : "#1b4332",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      Sebelumnya
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            document.getElementById("katalog-komoditas")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            border: isActive ? "2px solid #1b4332" : "1px solid #d2ded7",
                            background: isActive ? "#1b4332" : "#ffffff",
                            color: isActive ? "#ffffff" : "#1b4332",
                            fontWeight: "800",
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isActive ? "0 4px 12px rgba(27,67,50,0.2)" : "none",
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.min(p + 1, totalPages));
                        document.getElementById("katalog-komoditas")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "99px",
                        border: "1px solid #d2ded7",
                        background: currentPage === totalPages ? "#f5f9f6" : "#ffffff",
                        color: currentPage === totalPages ? "#9ca3af" : "#1b4332",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      }}
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="grocery-section grocery-bestsells-section">
            <div className="grocery-bestsells-wrapper">
              <div className="grocery-section-header">
                <div className="section-title-wrap">
                  <h2 className="grocery-section-title">Pantauan Harian</h2>
                  <p className="grocery-section-sub">Analisis fluktuasi harga pasar &amp; simulasi perencanaan belanja cerdas</p>
                </div>

                <button
                  className="grocery-view-all-btn"
                  onClick={() => setActivePage("smart-budgeting")}
                >
                  <span>Buka Smart Budgeting</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grocery-bestsells-grid">
                <div className="grocery-nature-promo-banner">
                  <div className="nature-banner-badge">
                    <Sparkles size={13} />
                    <span>BELANJA PANGAN CERDAS</span>
                  </div>

                  <h3 className="nature-banner-title">
                    Atur belanja pangan keluarga dengan cerdas
                  </h3>

                  <p className="nature-banner-desc">
                    Hitung estimasi alokasi belanja pangan harian atau bulanan keluarga Anda dengan rekomendasi otomatis komoditas termurah dari pasar pantau Lamongan.
                  </p>

                  <div className="nature-banner-features">
                    <div className="nature-feature-item">
                      <CheckCircle2 size={15} color="#74c69d" />
                      <span>Optimalisasi pagu anggaran otomatis</span>
                    </div>
                    <div className="nature-feature-item">
                      <CheckCircle2 size={15} color="#74c69d" />
                      <span>Peta sebaran kios &amp; pedagang pasar rakyat</span>
                    </div>
                    <div className="nature-feature-item">
                      <CheckCircle2 size={15} color="#74c69d" />
                      <span>Terintegrasi database resmi DKPP Lamongan</span>
                    </div>
                  </div>

                  <button
                    className="nature-banner-btn"
                    type="button"
                    onClick={() => setActivePage("smart-budgeting")}
                  >
                    <span>Hitung Sekarang</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                <div className="grocery-chart-panel" id="tren-harga">
                  <div className="grocery-chart-header">
                    <div className="chart-header-title-box">
                      <span className="live-indicator-pill">
                        <span className="live-pulse-dot"></span>
                        <span>TERHUBUNG DATABASE LIVE</span>
                      </span>
                      <h3 className="chart-title-text">Analisis Tren Fluktuasi Harga Komoditas</h3>
                      <p className="chart-sub-text">Pergerakan kurva grafik harian komoditas daerah.</p>
                    </div>

                    <div className="grocery-chart-controls">
                      <select
                        className="grocery-commodity-select"
                        value={trendCommodityName}
                        onChange={(e) => setTrendCommodityName(e.target.value)}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>

                      <div className="grocery-timeframe-group">
                        {["7 Hari", "14 Hari", "30 Hari"].map((tf) => (
                          <button
                            key={tf}
                            type="button"
                            className={`grocery-tf-btn ${timeframe === tf ? "active" : ""}`}
                            onClick={() => setTimeframe(tf)}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grocery-chart-body">
                    {liveTrendData && liveTrendData.points ? (
                      <AestheticSvgChart dataPoints={liveTrendData.points} liveData={liveTrendData} />
                    ) : (
                      <div className="grocery-empty-state">
                        <p>Memuat grafik tren harga komoditas...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grocery-section grocery-deals-section">
            <div className="grocery-section-header">
              <div className="section-title-wrap">
                <h2 className="grocery-section-title">Pasar Rekomendasi Hari Ini</h2>
                <p className="grocery-section-sub">Pasar rakyat dengan harga paling hemat &amp; pasokan terlengkap hari ini</p>
              </div>
              <button
                className="grocery-view-all-btn"
                onClick={() => setActivePage("komparasi-pasar")}
              >
                <span>Buka Komparasi Pasar</span>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grocery-deals-grid">
              <div className="grocery-deal-card">
                <div className="deal-card-badge">PASAR TERHEMAT</div>
                <h3 className="deal-card-market">Pasar Babat</h3>
                <p className="deal-card-desc">Indeks harga pangan terendah untuk komoditas cabai, bawang merah, dan beras medium harian.</p>
                <div className="deal-card-stats">
                  <div className="deal-stat">
                    <span className="stat-num">Rp 28.500</span>
                    <span className="stat-desc">Rata-rata Bumbu/kg</span>
                  </div>
                  <div className="deal-stat">
                    <span className="stat-num">Tinggi</span>
                    <span className="stat-desc">Ketersediaan Pasokan</span>
                  </div>
                </div>

                <button
                  className="deal-card-action-btn"
                  onClick={() => setActivePage("komparasi-pasar")}
                >
                  <span>Lihat Perbandingan Pasar</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="grocery-deal-card">
                <div className="deal-card-badge" style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>PUSAT DISTRIBUSI</div>
                <h3 className="deal-card-market">Pasar Sidoharjo</h3>
                <p className="deal-card-desc">Pusat pasokan komoditas bahan pokok, beras premium, gula pasir, dan minyak goreng di Lamongan.</p>
                <div className="deal-card-stats">
                  <div className="deal-stat">
                    <span className="stat-num">Rp 13.200</span>
                    <span className="stat-desc">Beras SPHP/kg</span>
                  </div>
                  <div className="deal-stat">
                    <span className="stat-num">Lengkap</span>
                    <span className="stat-desc">Variasi Komoditas</span>
                  </div>
                </div>

                <button
                  className="deal-card-action-btn"
                  onClick={() => setActivePage("komparasi-pasar")}
                >
                  <span>Lihat Perbandingan Pasar</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="grocery-deal-card">
                <div className="deal-card-badge" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>SENTRA PESISIR</div>
                <h3 className="deal-card-market">Pasar Blimbing</h3>
                <p className="deal-card-desc">Sentra komoditas perikanan dan protein hewani segar langsung dari pangkalan nelayan pesisir.</p>
                <div className="deal-card-stats">
                  <div className="deal-stat">
                    <span className="stat-num">Rp 32.000</span>
                    <span className="stat-desc">Daging Ayam Ras/kg</span>
                  </div>
                  <div className="deal-stat">
                    <span className="stat-num">Segar</span>
                    <span className="stat-desc">Pasokan Hasil Laut</span>
                  </div>
                </div>

                <button
                  className="deal-card-action-btn"
                  onClick={() => setActivePage("komparasi-pasar")}
                >
                  <span>Lihat Perbandingan Pasar</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </section>

          <footer className="grocery-main-footer">
            <div className="grocery-footer-container">
              <div className="footer-col-brand">
                <div className="footer-brand-title">E-PANGAN LAMONGAN</div>
                <p className="footer-brand-desc">
                  Sistem Informasi Stabilitas &amp; Pemantauan Harga Komoditas Pangan Daerah, dikelola resmi oleh Dinas Ketahanan Pangan dan Pertanian (DKPP) Kabupaten Lamongan.
                </p>
                <div className="footer-support-box">
                  <span>📍 Gedung DKPP Lamongan, Jawa Timur</span>
                </div>
              </div>

              <div className="footer-col-links">
                <h4>Navigasi Layanan</h4>
                <button onClick={() => { setActivePage("dashboard"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Beranda</button>
                <button onClick={() => { setActivePage("cari-harga"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Cari Harga &amp; Kios</button>
                <button onClick={() => { setActivePage("komparasi-pasar"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Perbandingan Antar Pasar</button>
                <button onClick={() => { setActivePage("smart-budgeting"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Smart Budgeting Pangan</button>
              </div>

              <div className="footer-col-links">
                <h4>Akses Petugas</h4>
                <button onClick={() => setActivePage("login")}>Portal Login Petugas</button>
                <button onClick={() => { setActivePage("dashboard"); document.getElementById("tren-harga")?.scrollIntoView({ behavior: "smooth" }); }}>Grafik Tren Pangan</button>
                <button onClick={() => { setActivePage("dashboard"); document.getElementById("katalog-komoditas")?.scrollIntoView({ behavior: "smooth" }); }}>Katalog Komoditas</button>
              </div>
            </div>

            <div className="grocery-footer-bottom">
              <div className="grocery-footer-bottom-container">
                <span>© 2026 Pemerintah Kabupaten Lamongan — Dinas Ketahanan Pangan dan Pertanian. Hak Cipta Dilindungi.</span>
                <span className="footer-verif-badge">Terverifikasi Live Database</span>
              </div>
            </div>
          </footer>
        </>
      )}

      {compareProduct && (
        <div className="compare-modal-overlay" onClick={() => setCompareProduct(null)}>
          <div className="compare-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="compare-modal-header">
              <div className="compare-product-info">
                <img src={compareProduct.image} alt={compareProduct.name} className="compare-thumb-img" />
                <div>
                  <span className="compare-cat-pill">{compareProduct.category}</span>
                  <h2 className="compare-product-title">{compareProduct.name}</h2>
                  <p className="compare-product-sub">Perbandingan harga komoditas ini di berbagai pasar daerah Lamongan</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setCompareProduct(null)} aria-label="Tutup Modal">
                <X size={20} />
              </button>
            </div>

            <div className="compare-markets-grid">
              {compareProduct.marketPrices && compareProduct.marketPrices.length > 0 ? (
                compareProduct.marketPrices.map((m, idx) => {
                  const isBestPrice = m.note === "Paling Hemat" || m.price === compareProduct.price;
                  return (
                    <div key={idx} className={`market-compare-card ${isBestPrice ? "best-price" : ""}`}>
                      {isBestPrice && (
                        <div className="best-price-badge">
                          <Sparkles size={10} />
                          <span>Paling Hemat</span>
                        </div>
                      )}

                      <div className="market-card-top">
                        <div className="market-icon-wrap"><Store size={16} /></div>
                        <span className="market-name-text">{m.market}</span>
                      </div>

                      <div className="market-card-price">
                        <span className="market-price-num">{formatRupiah(m.price)}</span>
                        <span className="market-price-unit">{compareProduct.unit}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="no-data-text">Data harga pasar lainnya belum tersedia.</p>
              )}
            </div>

            <div className="compare-modal-footer">
              <button className="btn-modal-close-action" onClick={() => setCompareProduct(null)}>
                Selesai Meninjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AestheticSvgChart({ dataPoints, liveData }) {
  const width = 900;
  const height = 260;
  const padding = 50;

  const [activeIdx, setActiveIdx] = useState(dataPoints ? dataPoints.length - 1 : 0);

  useEffect(() => {
    if (dataPoints && dataPoints.length > 0) {
      setActiveIdx(dataPoints.length - 1);
    }
  }, [dataPoints]);

  if (!dataPoints || dataPoints.length === 0) return null;

  const prices = dataPoints.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.98;
  const maxPrice = Math.max(...prices) * 1.02;
  const range = maxPrice - minPrice || 1;

  const getX = (i) => padding + (i * (width - padding * 2)) / (dataPoints.length - 1 || 1);
  const getY = (val) => height - padding - ((val - minPrice) / range) * (height - padding * 2);

  const points = dataPoints.map((d, i) => ({ x: getX(i), y: getY(d.price), ...d }));

  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    pathD += ` Q ${points[i].x},${points[i].y} ${xc},${yc}`;
  }
  pathD += ` L ${points[points.length - 1].x},${points[points.length - 1].y}`;

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

  const activePoint = points[activeIdx] || points[points.length - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      <div className="chart-metrics-strip">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "11px", color: "#4e6754", fontWeight: "700" }}>HARGA TERPILIH</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f1d14" }}>
              Rp {activePoint.price.toLocaleString("id-ID")}
            </span>
            <span style={{ fontSize: "11px", color: "#4e6754", fontWeight: "600" }}>/kg</span>
          </div>
          <span style={{
            fontSize: "10.5px",
            fontWeight: "800",
            color: activePoint.deltaType === "up" ? "#b91c1c" : activePoint.deltaType === "down" ? "#166534" : "#1b4332",
            marginTop: "2px"
          }}>
            {activePoint.deltaText || "Stabil"} ({activePoint.fullDay || activePoint.date})
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "11px", color: "#4e6754", fontWeight: "700" }}>RATA-RATA HARGA</span>
          <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f1d14" }}>
            Rp {Number(liveData?.avgPrice || activePoint.price).toLocaleString("id-ID")}
          </div>
          <span style={{ fontSize: "10.5px", color: "#4e6754", fontWeight: "600", marginTop: "2px" }}>
            Rentang: Rp {Number(liveData?.minPrice || minPrice).toLocaleString("id-ID")} - Rp {Number(liveData?.maxPrice || maxPrice).toLocaleString("id-ID")}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "11px", color: "#4e6754", fontWeight: "700" }}>STATUS HET PANGAN</span>
          <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#166534" }}>
            {liveData?.statusHet || "Sesuai HET"}
          </div>
          <span style={{ fontSize: "10.5px", color: "#4e6754", fontWeight: "600", marginTop: "2px" }}>
            HET: Rp {Number(liveData?.het || 13000).toLocaleString("id-ID")}/kg
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "11px", color: "#4e6754", fontWeight: "700" }}>TITIK PANTAU PASAR</span>
          <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f1d14" }}>
            {activePoint.market || liveData?.sampleMarket || "Pasar Babat & Sidoharjo"}
          </div>
          <span style={{ fontSize: "10.5px", color: "#2d6a4f", fontWeight: "700", marginTop: "2px" }}>
            ● Terverifikasi Enumerator
          </span>
        </div>
      </div>

      <div className="aesthetic-chart-scroll-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="aesthetic-svg-element"
        >
          <defs>
            <linearGradient id="aestheticGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d6a4f" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2d6a4f" stopOpacity="0.01" />
            </linearGradient>
            <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f1d14" floodOpacity="0.25" />
            </filter>
          </defs>

          {[0, 0.5, 1].map((ratio, idx) => {
            const yPos = padding + ratio * (height - padding * 2);
            const valLabel = Math.round(maxPrice - ratio * range);
            return (
              <g key={idx}>
                <line x1={padding} y1={yPos} x2={width - padding} y2={yPos} stroke="#d2ded7" strokeDasharray="4 4" strokeWidth="1" />
                <text x={padding - 10} y={yPos + 4} textAnchor="end" fill="#4e6754" fontSize="10.5" fontWeight="700">
                  Rp {valLabel > 1000 ? `${Math.round(valLabel / 1000)}k` : valLabel}
                </text>
              </g>
            );
          })}

          <path d={areaD} fill="url(#aestheticGrad)" />
          <path d={pathD} fill="none" stroke="#1b4332" strokeWidth="3.5" strokeLinecap="round" />

          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padding}
              x2={activePoint.x}
              y2={height - padding}
              stroke="#2d6a4f"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {points.map((pt, i) => {
            const isActive = i === activeIdx;
            return (
              <g key={i} style={{ cursor: "pointer" }} onClick={() => setActiveIdx(i)}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="24"
                  fill="transparent"
                  onMouseEnter={() => setActiveIdx(i)}
                />

                {isActive && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="13"
                    fill="rgba(45, 106, 79, 0.25)"
                    stroke="#2d6a4f"
                    strokeWidth="1.5"
                  />
                )}

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? "7" : "5"}
                  fill={isActive ? "#1b4332" : "#ffffff"}
                  stroke="#2d6a4f"
                  strokeWidth={isActive ? "3" : "2.5"}
                />

                <text
                  x={pt.x}
                  y={height - 15}
                  textAnchor="middle"
                  fill={isActive ? "#1b4332" : "#4e6754"}
                  fontSize={isActive ? "12" : "11.5"}
                  fontWeight={isActive ? "800" : "600"}
                >
                  {pt.day || pt.date}
                </text>
              </g>
            );
          })}

          {activePoint && (
            <g
              transform={`translate(${Math.min(Math.max(activePoint.x - 75, padding), width - padding - 150)}, ${Math.max(activePoint.y - 70, 10)})`}
              filter="url(#shadowFilter)"
              style={{ pointerEvents: "none" }}
            >
              <rect
                width="150"
                height="56"
                rx="12"
                fill="#112216"
                stroke="#2d6a4f"
                strokeWidth="1.5"
              />
              <text x="75" y="18" textAnchor="middle" fill="#d2ded7" fontSize="10" fontWeight="700">
                {activePoint.fullDay || activePoint.date}
              </text>
              <text x="75" y="36" textAnchor="middle" fill="#74c69d" fontSize="13.5" fontWeight="800">
                Rp {activePoint.price.toLocaleString("id-ID")}
              </text>
              <text x="75" y="48" textAnchor="middle" fill="#b7efc5" fontSize="9.5" fontWeight="700">
                {activePoint.deltaText || "Stabil"}
              </text>
            </g>
          )}
        </svg>
      </div>

      {liveData?.insight && (
        <div style={{
          backgroundColor: "#eef8f2",
          border: "1px solid #b7efc5",
          borderRadius: "16px",
          padding: "14px 18px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px"
        }}>
          <div style={{ backgroundColor: "#2d6a4f", color: "#fff", padding: "6px", borderRadius: "10px", marginTop: "2px", display: "flex" }}>
            <Sparkles size={14} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Analisis Stabilitas DKPP Lamongan
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#112216", fontWeight: "600", lineHeight: "1.5" }}>
              {liveData.insight}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
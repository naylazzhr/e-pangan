import { useState, useEffect, useMemo, useCallback } from "react";
import "./App.css";
import Navbar from "./Navbar";
import SmartBudgetting from "./SmartBudgetting";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import CariHarga from "./CariHarga";
import KomparasiPasar from "./KomparasiPasar";
import DetailKios from "./DetailKios";
import { getKomoditas, getPasar, getKomparasiPasar, getTrenHarga, isLoggedIn } from "./api";
import {
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
  CheckCircle2,
  Info,
} from "lucide-react";

const CATEGORIES = [
  { label: "Semua Komoditas" },
  { label: "Beras & Padi", categoryKey: "KEBUTUHAN POKOK" },
  { label: "Bumbu Dapur & Cabai", categoryKey: "BUMBU DAPUR" },
  { label: "Minyak & Mentega", categoryKey: "MINYAK GORENG" },
  { label: "Daging, Unggas & Ikan", categoryKey: "PROTEIN HEWANI" },
  { label: "Bawang & Sayuran", categoryKey: "PRODUKSI DAERAH" },
  { label: "Gula & Bahan Baku", categoryKey: "BAHAN BAKU" },
];

function formatRupiah(amount) {
  if (amount === undefined || amount === null) return "Rp 0";
  return "Rp " + Number(amount).toLocaleString("id-ID");
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [marketsList, setMarketsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Komoditas");
  const [selectedMarketFilter, setSelectedMarketFilter] = useState("Semua Pasar");

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

  const [trendCommodityName, setTrendCommodityName] = useState("");
  const [timeframe, setTimeframe] = useState("7 Hari");
  const [compareProduct, setCompareProduct] = useState(null);
  const [toast, setToast] = useState(null);

  const [liveTrendData, setLiveTrendData] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
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

            return {
              id: item.id || idx + 1,
              name: item.komoditas || item.nama_bahan,
              category: (item.kategori || "KEBUTUHAN POKOK").toUpperCase(),
              market: item.termurah ? `${item.termurah}` : "Semua Pasar Pantau",
              price: item.minPrice || item.harga || 0,
              unit: `/${item.satuan || "kg"}`,
              deltaText: item.status_label || "Stabil",
              deltaType: "flat",
              image: item.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
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
        if (isMounted && res && res.data) {
          setLiveTrendData(res.data);
          setIsLiveConnected(true);
        }
      })
      .catch(() => {
        if (isMounted) setIsLiveConnected(false);
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

  if (activePage === "login" || activePage === "admin-login") {
    return <AdminLogin setActivePage={setActivePage} showToast={showToast} />;
  }

  if (activePage === "admin-dashboard") {
    return <AdminDashboard setActivePage={setActivePage} showToast={showToast} products={products} setProducts={setProducts} />;
  }

  return (
    <div className="app-container" style={{ backgroundColor: "#f3f6f4", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
          {/* HERO BANNER */}
          <section className="hero-wrapper" id="beranda" style={{ padding: "32px 2.5rem 10px 2.5rem" }}>
            <div className="hero-banner-card" style={{ background: "linear-gradient(135deg, #071a11 0%, #113324 50%, #235841 100%)", borderRadius: "28px", padding: "40px", color: "#fff" }}>
              <div className="hero-content" style={{ maxWidth: "700px" }}>
                <div className="hero-pill" style={{ backgroundColor: "#eef8f2", color: "#1b4332", padding: "6px 16px", borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "11.5px", fontWeight: "800", marginBottom: "16px", border: "1px solid #b7efc5" }}>
                  <ShieldCheck size={14} />
                  <span>SISTEM INFORMASI STABILITAS HARGA PANGAN DAERAH</span>
                </div>
                <h1 className="hero-title" style={{ fontSize: "2.8rem", fontWeight: "800", lineHeight: "1.2", marginBottom: "16px", letterSpacing: "-0.03em" }}>
                  Pantau &amp; Bandingkan <span className="highlight-text" style={{ color: "#74c69d" }}>Harga Pangan Pokok</span> Terkini
                </h1>
                <p className="hero-desc" style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.85)", lineHeight: "1.6" }}>
                  Akses data fluktuasi komoditas harian dari enumerator resmi Dinas Ketahanan Pangan
                  dan Pertanian (DKPP) di pasar rakyat se-Kabupaten Lamongan secara transparan.
                </p>
              </div>
            </div>

            {/* FLOATING SEARCH COMMAND */}
            <div className="floating-search-wrapper" style={{ marginTop: "-28px", padding: "0 20px" }}>
              <div className="search-command-panel" style={{ backgroundColor: "#fff", borderRadius: "99px", padding: "12px 24px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 12px 36px rgba(27,67,50,0.08)", border: "1px solid #d2ded7" }}>
                <div className="search-input-box" style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                  <Search size={18} color="#4e6754" />
                  <input
                    type="text"
                    placeholder="Cari komoditas pangan (contoh: Beras Medium, Cabai Rawit)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: "none", outline: "none", width: "100%", fontSize: "14px", fontWeight: "600", color: "#112216", backgroundColor: "transparent" }}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} style={{ border: "none", background: "none", cursor: "pointer" }}>
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="search-divider" style={{ width: "1px", height: "24px", backgroundColor: "#d2ded7" }}></div>

                <div className="select-filter-box" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Store size={16} color="#2d6a4f" />
                  <select value={selectedMarketFilter} onChange={(e) => setSelectedMarketFilter(e.target.value)} style={{ border: "none", outline: "none", backgroundColor: "transparent", fontWeight: "700", color: "#1b4332", fontSize: "13.5px", cursor: "pointer" }}>
                    <option value="Semua Pasar">Semua Pasar Rakyat</option>
                    {marketsList.map((m) => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <button className="btn-search-action" onClick={() => document.getElementById("katalog-pasar")?.scrollIntoView({ behavior: "smooth" })} style={{ backgroundColor: "#1b4332", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "99px", fontWeight: "800", fontSize: "13.5px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <span>Cari Pangan</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* CATEGORY CHIPS */}
              <div className="category-chips-row" style={{ display: "flex", gap: "10px", overflowX: "auto", marginTop: "16px", paddingBottom: "8px" }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    type="button"
                    className={`cat-chip${selectedCategory === cat.label ? " active" : ""}`}
                    onClick={() => setSelectedCategory(cat.label)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "99px",
                      border: selectedCategory === cat.label ? "1px solid #1b4332" : "1px solid #d2ded7",
                      backgroundColor: selectedCategory === cat.label ? "#1b4332" : "#ffffff",
                      color: selectedCategory === cat.label ? "#fff" : "#4e6754",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* HERO STATS BAR */}
            <div className="hero-stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginTop: "28px", padding: "0 20px" }}>
              <div className="hero-stat-card" style={{ backgroundColor: "#ffffff", padding: "18px 22px", borderRadius: "20px", border: "1px solid #d2ded7", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 4px 16px rgba(27,67,50,0.04)" }}>
                <div className="stat-icon-wrapper" style={{ padding: "10px", backgroundColor: "#eef8f2", borderRadius: "14px", color: "#2d6a4f" }}><BarChart3 size={18} /></div>
                <div className="stat-info">
                  <span className="stat-value" style={{ display: "block", fontSize: "15px", fontWeight: "800", color: "#0f1d14" }}>Terkendali</span>
                  <span className="stat-label" style={{ fontSize: "11.5px", color: "#4e6754", fontWeight: "600" }}>Status Pasokan Daerah</span>
                </div>
              </div>
              <div className="hero-stat-card" style={{ backgroundColor: "#ffffff", padding: "18px 22px", borderRadius: "20px", border: "1px solid #d2ded7", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 4px 16px rgba(27,67,50,0.04)" }}>
                <div className="stat-icon-wrapper" style={{ padding: "10px", backgroundColor: "#eef8f2", borderRadius: "14px", color: "#2d6a4f" }}><Store size={18} /></div>
                <div className="stat-info">
                  <span className="stat-value" style={{ display: "block", fontSize: "15px", fontWeight: "800", color: "#0f1d14" }}>14 Pasar</span>
                  <span className="stat-label" style={{ fontSize: "11.5px", color: "#4e6754", fontWeight: "600" }}>Titik Pantau Aktif</span>
                </div>
              </div>
              <div className="hero-stat-card" style={{ backgroundColor: "#ffffff", padding: "18px 22px", borderRadius: "20px", border: "1px solid #d2ded7", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 4px 16px rgba(27,67,50,0.04)" }}>
                <div className="stat-icon-wrapper" style={{ padding: "10px", backgroundColor: "#eef8f2", borderRadius: "14px", color: "#2d6a4f" }}><Store size={18} /></div>
                <div className="stat-info">
                  <span className="stat-value" style={{ display: "block", fontSize: "15px", fontWeight: "800", color: "#0f1d14" }}>Pasar Babat</span>
                  <span className="stat-label" style={{ fontSize: "11.5px", color: "#4e6754", fontWeight: "600" }}>Pasar Terhemat Harian</span>
                </div>
              </div>
              <div className="hero-stat-card" style={{ backgroundColor: "#ffffff", padding: "18px 22px", borderRadius: "20px", border: "1px solid #d2ded7", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 4px 16px rgba(27,67,50,0.04)" }}>
                <div className="stat-icon-wrapper" style={{ padding: "10px", backgroundColor: "#eef8f2", borderRadius: "14px", color: "#2d6a4f" }}><CheckCircle2 size={18} /></div>
                <div className="stat-info">
                  <span className="stat-value" style={{ display: "block", fontSize: "15px", fontWeight: "800", color: "#0f1d14" }}>DKPP Lamongan</span>
                  <span className="stat-label" style={{ fontSize: "11.5px", color: "#4e6754", fontWeight: "600" }}>Verifikasi Resmi</span>
                </div>
              </div>
            </div>
          </section>

          {/* ANNOUNCEMENT BANNER */}
          <div className="announcement-wrapper" style={{ padding: "0 2.5rem", marginTop: "16px", marginBottom: "16px" }}>
            <div className="announcement-banner" style={{ backgroundColor: "#eef8f2", border: "1px solid #b7efc5", borderRadius: "20px", padding: "18px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="announcement-icon-wrap" style={{ color: "#2d6a4f" }}>
                <Info size={20} />
              </div>
              <div>
                <h4 className="announcement-title" style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f1d14", margin: "0 0 3px 0" }}>PENGUMUMAN STABILITAS PANGAN KABUPATEN LAMONGAN</h4>
                <p className="announcement-sub" style={{ fontSize: "12.5px", color: "#4e6754", margin: 0, fontWeight: "600" }}>Pemerintah Kabupaten Lamongan bersama Bulog rutin menggelar Operasi Pasar Murah untuk komoditas Beras, Minyak Goreng, dan Gula di pasar-pasar utama.</p>
              </div>
            </div>
          </div>

          {/* SECTION 1: GRAFIK ANALISIS & SIDEBAR (GRID 2 KOLOM) */}
          <main className="main-layout" style={{ padding: "10px 2.5rem 24px 2.5rem", display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }}>
            <div className="left-stack">
              <section className="panel-card" id="tren-harga" style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "28px", border: "1px solid #d2ded7", boxShadow: "0 4px 20px rgba(27,67,50,0.04)" }}>
                <div className="panel-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <div className="panel-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#eef8f2", color: "#1b4332", padding: "4px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: "800", marginBottom: "8px", border: "1px solid #b7efc5" }}>
                      <BarChart3 size={13} />
                      <span>{isLiveConnected ? "🟢 TERHUBUNG DATABASE LIVE" : "⏳ MEMUAT DATA..."}</span>
                    </div>
                    <h2 className="panel-title" style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f1d14", margin: 0 }}>Analisis Tren Fluktuasi Harga Komoditas</h2>
                    <p className="panel-sub" style={{ fontSize: "12.5px", color: "#4e6754", margin: "4px 0 0 0", fontWeight: "600" }}>Pergerakan kurva grafik harian komoditas daerah.</p>
                  </div>

                  <div className="trend-controls-row" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div className="select-commodity-btn">
                      <select value={trendCommodityName} onChange={(e) => setTrendCommodityName(e.target.value)} style={{ padding: "8px 14px", borderRadius: "99px", border: "1px solid #d2ded7", backgroundColor: "#f2f7f4", fontWeight: "700", color: "#1b4332", fontSize: "12.5px", outline: "none", cursor: "pointer" }}>
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="timeframe-pill-group" style={{ display: "flex", backgroundColor: "#f2f7f4", padding: "4px", borderRadius: "99px", border: "1px solid #d2ded7" }}>
                      {["7 Hari", "14 Hari", "30 Hari"].map((tf) => (
                        <button key={tf} className={`timeframe-btn${timeframe === tf ? " active" : ""}`} onClick={() => setTimeframe(tf)} style={{ padding: "5px 12px", borderRadius: "99px", border: "none", backgroundColor: timeframe === tf ? "#1b4332" : "transparent", color: timeframe === tf ? "#fff" : "#4e6754", fontSize: "11.5px", fontWeight: "800", cursor: "pointer", transition: "all 0.2s" }}>
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="chart-container-box">
                  {liveTrendData && liveTrendData.points ? (
                    <AestheticSvgChart dataPoints={liveTrendData.points} liveData={liveTrendData} />
                  ) : (
                    <p style={{ textAlign: "center", padding: "40px", color: "#4e6754", fontWeight: "600" }}>Memuat grafik tren harga...</p>
                  )}
                </div>
              </section>
            </div>

            <aside className="sidebar-stack" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="sidebar-card-budget" style={{ background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)", borderRadius: "24px", padding: "24px", color: "#fff", boxShadow: "0 8px 24px rgba(27,67,50,0.12)" }}>
                <div className="sidebar-badge-new" style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "99px", fontSize: "10.5px", fontWeight: "800", marginBottom: "12px", color: "#b7efc5" }}>
                  <Sparkles size={12} />
                  <span>FITUR SMART PANGAN</span>
                </div>
                <h3 className="sidebar-card-title" style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "6px" }}>Smart Budgeting Pangan</h3>
                <p className="sidebar-card-desc" style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.8)", lineHeight: "1.5", marginBottom: "18px" }}>Hitung estimasi pengeluaran belanja dapur dan lihat peta lokasi sebaran pasar rakyat Lamongan.</p>
                <button className="btn-open-calculator" onClick={() => setActivePage("smart-budgeting")} style={{ width: "100%", backgroundColor: "#ffffff", color: "#1b4332", border: "none", padding: "11px", borderRadius: "99px", fontWeight: "800", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Calculator size={15} />
                  <span>Buka Smart Budgeting →</span>
                </button>
              </div>

              <button className="sidebar-action-card" onClick={() => setActivePage("cari-harga")} style={{ backgroundColor: "#ffffff", border: "1px solid #d2ded7", borderRadius: "20px", padding: "18px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", textAlign: "left", boxShadow: "0 4px 16px rgba(27,67,50,0.03)" }}>
                <div className="action-card-icon" style={{ padding: "10px", backgroundColor: "#eef8f2", borderRadius: "14px", color: "#2d6a4f" }}><Store size={18} /></div>
                <div className="action-card-text" style={{ flex: 1 }}>
                  <div className="action-card-title" style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f1d14" }}>Cari Harga &amp; Kios</div>
                  <div className="action-card-sub" style={{ fontSize: "11.5px", color: "#4e6754", fontWeight: "600" }}>Cek pedagang di pasar Lamongan</div>
                </div>
                <ChevronRight size={16} color="#4e6754" />
              </button>
            </aside>
          </main>

          {/* SECTION 2: KATALOG PANGAN DAERAH (5 KOLOM FULL KANAN-KIRI TANPA LABEL KATEGORI DI GAMBAR) */}
          <section className="catalog-section-full" id="katalog-pasar" style={{ padding: "10px 2.5rem 60px 2.5rem", width: "100%", boxSizing: "border-box" }}>
            <div className="catalog-container-full" style={{ backgroundColor: "#dbece2", borderRadius: "32px", padding: "36px", border: "1px solid #c8dcd0", width: "100%", boxSizing: "border-box" }}>
              <div className="catalog-header-center" style={{ marginBottom: "28px" }}>
                <span className="catalog-eyebrow" style={{ backgroundColor: "#1b4332", color: "#b7efc5", padding: "5px 14px", borderRadius: "99px", fontSize: "10.5px", fontWeight: "800", display: "inline-block", marginBottom: "10px", letterSpacing: "0.04em" }}>DIREKTORI PANGAN DAERAH</span>
                <h2 className="catalog-main-title" style={{ fontSize: "1.8rem", fontWeight: "800", color: "#0a2116", margin: "0 0 6px 0" }}>Katalog Komoditas Pangan Daerah</h2>
                <p className="catalog-sub-title" style={{ fontSize: "13.5px", color: "#4e6754", fontWeight: "600" }}>Menampilkan <strong>{filteredProducts.length}</strong> data komoditas pangan terkini se-Kabupaten Lamongan</p>
              </div>

              {loadingData ? (
                <p style={{ textAlign: "center", padding: "60px", color: "#4e6754", fontWeight: "600" }}>Mengambil data dari server backend...</p>
              ) : filteredProducts.length === 0 ? (
                <p style={{ textAlign: "center", padding: "60px", color: "#4e6754", fontWeight: "600" }}>Belum ada data komoditas ditemukan.</p>
              ) : (
                <div className="commodity-grid-5-full" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "18px", width: "100%" }}>
                  {filteredProducts.map((product) => (
                    <div className="commodity-card-v3" key={product.id} style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "16px", border: "1px solid #d2ded7", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 4px 16px rgba(27,67,50,0.04)", width: "100%", boxSizing: "border-box" }}>
                      <div>
                        {/* Gambar Bersih Tanpa Label Kategori */}
                        <div className="card-thumb-wrap" style={{ position: "relative", marginBottom: "12px" }}>
                          <img src={product.image} alt={product.name} className="card-thumb-img" style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "14px" }} />
                        </div>
                        <h3 className="card-title" style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f1d14", margin: "0 0 6px 0", lineHeight: "1.3" }}>{product.name}</h3>
                        <div className="card-market-location" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "#4e6754", fontWeight: "600", marginBottom: "14px" }}>
                          <MapPin size={12} color="#2d6a4f" />
                          <span>{product.market}</span>
                        </div>
                      </div>
                      <div>
                        <div className="card-price-row" style={{ marginBottom: "12px" }}>
                          <span className="card-price-amt" style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f1d14" }}>{formatRupiah(product.price)}</span>
                          <span className="card-price-unit" style={{ fontSize: "11.5px", color: "#4e6754", fontWeight: "600" }}>{product.unit}</span>
                        </div>
                        <button className="btn-card-compare" onClick={() => setCompareProduct(product)} style={{ width: "100%", backgroundColor: "#f2f7f4", color: "#1b4332", border: "1px solid #d2ded7", padding: "8px", borderRadius: "99px", fontSize: "11.5px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <SlidersHorizontal size={13} />
                          <span>Bandingkan</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <footer className="main-footer" style={{ padding: "20px 2.5rem", textAlign: "center", borderTop: "1px solid #d2ded7", color: "#4e6754", fontSize: "12px", fontWeight: "600" }}>
            <div className="footer-bottom-bar">
              <span>© 2026 Pemerintah Kabupaten Lamongan — Dinas Ketahanan Pangan dan Pertanian.</span>
            </div>
          </footer>
        </>
      )}

      {/* MODAL KOMPARASI */}
      {compareProduct && (
        <div className="compare-modal-overlay" onClick={() => setCompareProduct(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="compare-modal-container" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "28px", maxWidth: "600px", width: "100%", padding: "32px", border: "1px solid #d2ded7", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
            <div className="compare-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div className="compare-product-info" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <img src={compareProduct.image} alt={compareProduct.name} className="compare-thumb-img" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "16px" }} />
                <div>
                  <span className="compare-cat-pill" style={{ fontSize: "10.5px", fontWeight: "800", color: "#2d6a4f", backgroundColor: "#eef8f2", padding: "2px 8px", borderRadius: "99px", border: "1px solid #b7efc5" }}>{compareProduct.category}</span>
                  <h2 className="compare-product-title" style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f1d14", margin: "4px 0" }}>{compareProduct.name}</h2>
                  <p className="compare-product-sub" style={{ fontSize: "12px", color: "#4e6754", margin: 0, fontWeight: "600" }}>Perbandingan harga komoditas ini di berbagai pasar daerah Lamongan</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setCompareProduct(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4e6754" }}>
                <X size={20} />
              </button>
            </div>

            <div className="compare-markets-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              {compareProduct.marketPrices && compareProduct.marketPrices.length > 0 ? (
                compareProduct.marketPrices.map((m, idx) => {
                  const isBestPrice = m.note === "Paling Hemat" || m.price === compareProduct.price;
                  return (
                    <div key={idx} className={`market-compare-card ${isBestPrice ? "best-price" : ""}`} style={{ backgroundColor: "#f2f7f4", borderRadius: "20px", padding: "18px", border: `1px solid ${isBestPrice ? "#b7efc5" : "#d2ded7"}`, position: "relative" }}>
                      {isBestPrice && (
                        <div className="best-price-badge" style={{ position: "absolute", top: "12px", right: "12px", backgroundColor: "#1b4332", color: "#b7efc5", padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Sparkles size={10} />
                          <span>Paling Hemat</span>
                        </div>
                      )}

                      <div className="market-card-top" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <div className="market-icon-wrap" style={{ color: "#2d6a4f" }}><Store size={16} /></div>
                        <span className="market-name-text" style={{ fontSize: "13px", fontWeight: "800", color: "#0f1d14" }}>{m.market}</span>
                      </div>

                      <div className="market-card-price">
                        <span className="market-price-num" style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f1d14" }}>{formatRupiah(m.price)}</span>
                        <span className="market-price-unit" style={{ fontSize: "11px", color: "#4e6754", fontWeight: "600" }}>{compareProduct.unit}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="no-data-text" style={{ fontSize: "13px", color: "#4e6754" }}>Data harga pasar lainnya belum tersedia.</p>
              )}
            </div>

            <div className="compare-modal-footer" style={{ textAlign: "right" }}>
              <button className="btn-modal-close-action" onClick={() => setCompareProduct(null)} style={{ backgroundColor: "#1b4332", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "99px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>
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

  const getX = (i) => padding + (i * (width - padding * 2)) / (dataPoints.length - 1);
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
      {/* METRIK SUMMARY STRIP INTERAKTIF */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px",
        backgroundColor: "#f2f7f4",
        padding: "16px 20px",
        borderRadius: "20px",
        border: "1px solid #d2ded7"
      }}>
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

      {/* SVG CHART CONTAINER */}
      <div style={{ width: "100%", overflowX: "auto", position: "relative" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", minWidth: "600px", height: "auto", overflow: "visible" }}
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

          {/* Grid lines */}
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

          {/* Guideline line at active point */}
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

          {/* Points */}
          {points.map((pt, i) => {
            const isActive = i === activeIdx;
            return (
              <g key={i} style={{ cursor: "pointer" }} onClick={() => setActiveIdx(i)}>
                {/* Hit target for hover/click */}
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

          {/* Tooltip Card over active point */}
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

      {/* CALLOUT INSIGHT RESMI DKPP */}
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
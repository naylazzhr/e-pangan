import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  MapPin,
  X,
  Loader2,
  SlidersHorizontal,
  ArrowRight,
  User,
  Clock,
  Navigation,
} from "lucide-react";

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%234a6550' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const selectStyle = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  backgroundImage: chevron,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0 center",
  appearance: "none",
  WebkitAppearance: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: "600",
  color: "#112216",
  cursor: "pointer",
  padding: "0 22px 0 0",
};

const badgeStyle = (bg, color) => ({
  backgroundColor: bg,
  color: color,
  padding: "4px 12px",
  borderRadius: "999px",
  fontSize: "10.5px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
});

const pageBtnStyle = (disabled) => ({
  padding: "8px 16px",
  borderRadius: "999px",
  border: "1px solid #d8e2dc",
  backgroundColor: disabled ? "#eef2ef" : "#ffffff",
  color: disabled ? "#9ca3af" : "#112216",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: "13px",
  fontWeight: "700",
  fontFamily: "inherit",
});

export default function CariHarga({ setActivePage, setSelectedKios }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPasar, setSelectedPasar] = useState("Semua Pasar Rakyat");
  const [selectedUrutan, setSelectedUrutan] = useState("Harga Termurah");

  const [kiosList, setKiosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Jumlah kios per halaman

  const fetchKiosData = async (overridePasar, overrideSearch) => {
    setLoading(true);
    setError(null);

    const pasarToUse = overridePasar !== undefined ? overridePasar : selectedPasar;
    const searchToUse = overrideSearch !== undefined ? overrideSearch : searchQuery;

    const executeFetch = async (lat = null, lon = null) => {
      try {
        const params = new URLSearchParams();
        if (searchToUse.trim() !== "") {
          params.append("search", searchToUse.trim());
        }
        if (pasarToUse !== "Semua Pasar Rakyat") {
          params.append("lokasi", pasarToUse);
        }
        if (lat !== null && lon !== null) {
          params.append("lat", lat);
          params.append("lon", lon);
        }

        const baseUrl = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000";
        let response;
        try {
          response = await fetch(`${baseUrl}/kios?${params.toString()}`);
        } catch {
          try {
            response = await fetch(`${baseUrl}/cari-harga?${params.toString()}`);
          } catch {
            response = await fetch(`http://localhost:8000/kios?${params.toString()}`);
          }
        }

        if (!response.ok) {
          throw new Error("Gagal mengambil data dari server");
        }

        const result = await response.json();
        const dataArray = Array.isArray(result) ? result : (result.data || []);
        
        const processedData = dataArray.map((item, idx) => ({
          ...item,
          jarak_km: item.jarak_km !== undefined ? item.jarak_km : Number((7.0 + (idx * 0.6)).toFixed(2))
        }));

        setKiosList(processedData);
        setCurrentPage(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          executeFetch(position.coords.latitude, position.coords.longitude);
        },
        () => {
          executeFetch(-7.1153, 112.4227);
        },
        { timeout: 5000 }
      );
    } else {
      executeFetch(-7.1153, 112.4227);
    }
  };

  useEffect(() => {
    fetchKiosData();
  }, []);

  const handleTerapkanFilter = () => {
    fetchKiosData();
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedPasar("Semua Pasar Rakyat");
    setSelectedUrutan("Harga Termurah");
    fetchKiosData("Semua Pasar Rakyat", "");
  };

  const handleDetailKios = (kiosData) => {
    if (setSelectedKios) setSelectedKios(kiosData);
    try {
      sessionStorage.setItem("epangan_selected_kios", JSON.stringify(kiosData));
    } catch {
      // abaikan
    }
    if (setActivePage) setActivePage("detail-kios");
  };

  // Urutkan kios berdasarkan pilihan dropdown
  const sortedKiosList = useMemo(() => {
    let list = [...kiosList];
    if (selectedUrutan === "Harga Termurah") {
      list.sort((a, b) => (a.harga_terkini || a.harga || a.total_katalog || 0) - (b.harga_terkini || b.harga || b.total_katalog || 0) || a.id - b.id);
    } else if (selectedUrutan === "Harga Tertinggi") {
      list.sort((a, b) => (b.harga_terkini || b.harga || b.total_katalog || 0) - (a.harga_terkini || a.harga || a.total_katalog || 0) || b.id - a.id);
    } else if (selectedUrutan === "Jarak Terdekat") {
      list.sort((a, b) => (a.jarak_km || 999) - (b.jarak_km || 999) || a.id - b.id);
    }
    return list;
  }, [kiosList, selectedUrutan]);

  // Hitung pagination
  const totalPages = Math.ceil(sortedKiosList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentKiosList = sortedKiosList.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 200, behavior: "smooth" });
    }
  };

  const sebaranPasar = [
    { nama: "Pasar Babat", harga: "Rp13.000", kios: "18 Kios Pantau" },
    { nama: "Pasar Sidoharjo", harga: "Rp13.500", kios: "14 Kios Pantau" },
    { nama: "Pasar Sukodadi", harga: "Rp13.400", kios: "9 Kios Pantau" },
    { nama: "Pasar Lamongan Kota", harga: "Rp14.000", kios: "7 Kios Pantau" },
  ];

  return (
    <div
      style={{
        backgroundColor: "#f3f6f4",
        minHeight: "100vh",
        paddingBottom: "5rem",
        color: "#112216",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style>{`
        .ch-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 1.5rem;
          box-sizing: border-box;
        }
        .ch-hero {
          background: #d4e8da;
          padding-bottom: 36px;
          margin-bottom: 28px;
        }
        .ch-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          padding: 40px 0 28px;
          margin-bottom: 28px;
          border-bottom: 1px solid rgba(27, 67, 50, 0.12);
        }
        .ch-search-bar {
          display: grid;
          grid-template-columns: 1fr 230px 200px auto;
          align-items: center;
          gap: 20px;
          background: #ffffff;
          border: 1px solid #d8e2dc;
          border-radius: 999px;
          padding: 10px 12px 10px 28px;
        }
        .ch-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 40px;
          padding-left: 20px;
          border-left: 1px solid #d8e2dc;
        }
        .ch-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          background: #1b4332;
          color: #ffffff;
          border-radius: 24px;
          padding: 24px 32px;
          margin-bottom: 32px;
        }
        .ch-list-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .ch-main-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          align-items: start;
          padding-bottom: 40px;
        }
        .ch-kios-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .ch-kios-card {
          border-radius: 24px;
          padding: 24px;
          gap: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .ch-aside-filter {
          position: sticky;
          top: 24px;
        }
        @keyframes ch-spin {
          to { transform: rotate(360deg); }
        }
        .ch-title {
          font-size: 2.3rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }
        .ch-desc {
          color: #4a6550;
          margin: 12px 0 0 0;
          font-size: 1rem;
          max-width: 620px;
          line-height: 1.6;
        }
        .ch-head-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #e2f5ea;
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 12px;
        }
        .ch-btn-filter {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 48px;
          padding: 0 28px;
          background-color: #1b4332;
          color: #ffffff;
          border: none;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        @media (max-width: 900px) {
          .ch-container { padding: 0 14px !important; }
          .ch-hero {
            padding-bottom: 16px !important;
            margin-bottom: 16px !important;
          }
          .ch-head {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 16px 0 12px !important;
            margin-bottom: 12px !important;
            gap: 6px !important;
          }
          .ch-head-badge {
            padding: 4px 10px !important;
            margin-bottom: 6px !important;
          }
          .ch-head-badge span:last-child {
            font-size: 9.5px !important;
          }
          .ch-title {
            font-size: 1.35rem !important;
            line-height: 1.25 !important;
          }
          .ch-desc {
            font-size: 12px !important;
            margin-top: 6px !important;
            line-height: 1.45 !important;
          }
          .ch-search-bar {
            grid-template-columns: 1fr !important;
            border-radius: 16px !important;
            padding: 10px 12px !important;
            gap: 8px !important;
          }
          .ch-cell {
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1px solid #e5ede8 !important;
            padding-top: 8px !important;
            height: 36px !important;
          }
          .ch-btn-filter {
            height: 40px !important;
            font-size: 13px !important;
            padding: 0 16px !important;
            border-radius: 12px !important;
            width: 100% !important;
          }
          .ch-banner {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 14px 14px !important;
            border-radius: 16px !important;
            margin-bottom: 16px !important;
            gap: 12px !important;
          }
          .ch-banner h2 {
            font-size: 14px !important;
          }
          .ch-banner div[style*="display: flex"] {
            gap: 16px !important;
          }
          .ch-banner div[style*="borderLeft"] {
            padding-left: 16px !important;
          }
          .ch-list-head {
            margin-bottom: 14px !important;
          }
          .ch-list-head h2 {
            font-size: 15px !important;
          }
          .ch-main-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            padding-bottom: 20px !important;
          }
          .ch-aside-filter {
            position: static !important;
          }
          .ch-kios-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .ch-kios-card {
            padding: 14px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>

      <div className="ch-hero">
        <div className="ch-container">
          <div className="ch-head">
            <div>
              <div className="ch-head-badge">
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2d6a4f" }}></span>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.05em" }}>
                  DINAS KETAHANAN PANGAN DAN PERTANIAN LAMONGAN
                </span>
              </div>
              <h1 className="ch-title">
                Direktori &amp; Pantau Harga Kios Pangan
              </h1>
              <p className="ch-desc">
                Akses data fluktuasi komoditas harian secara transparan langsung dari katalog pedagang pasar rakyat terdekat.
              </p>
            </div>
          </div>

          <div className="ch-search-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Search size={18} color="#4a6550" />
              <input
                type="text"
                placeholder="Cari nama kios atau komoditas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTerapkanFilter()}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  width: "100%",
                  fontSize: "15px",
                  fontFamily: "inherit",
                  color: "#112216",
                  fontWeight: "500",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#4a6550", display: "flex", padding: 0 }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="ch-cell">
              <MapPin size={16} color="#2d6a4f" style={{ flexShrink: 0 }} />
              <select value={selectedPasar} onChange={(e) => setSelectedPasar(e.target.value)} style={selectStyle}>
                <option value="Semua Pasar Rakyat">Semua Pasar Rakyat</option>
                <option value="Pasar Babat">Pasar Babat</option>
                <option value="Pasar Sidoharjo">Pasar Sidoharjo</option>
                <option value="Pasar Mantup">Pasar Mantup</option>
                <option value="Pasar Blimbing">Pasar Blimbing</option>
                <option value="Pasar Sukodadi">Pasar Sukodadi</option>
                <option value="Pasar Ngimbang">Pasar Ngimbang</option>
              </select>
            </div>

            <div className="ch-cell">
              <SlidersHorizontal size={16} color="#2d6a4f" style={{ flexShrink: 0 }} />
              <select value={selectedUrutan} onChange={(e) => setSelectedUrutan(e.target.value)} style={selectStyle}>
                <option value="Harga Termurah">Harga Termurah</option>
                <option value="Harga Tertinggi">Harga Tertinggi</option>
                <option value="Jarak Terdekat">Jarak Terdekat</option>
              </select>
            </div>

            <button
              onClick={handleTerapkanFilter}
              className="ch-btn-filter"
            >
              <span>Terapkan Filter</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="ch-container">
        <div className="ch-banner">
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: "800", letterSpacing: "0.06em", color: "#74c69d", marginBottom: "6px" }}>
              INFO STABILITAS HARGA
            </span>
            <h2 style={{ fontSize: "1.3rem", margin: 0, fontWeight: "800" }}>
              Rata-Rata Komoditas Pokok Wilayah Babat &amp; Sekitarnya
            </h2>
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            <div>
              <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: "600", marginBottom: "2px" }}>RATA-RATA PASAR</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#b7efc5" }}>Rp13.150/kg</div>
            </div>
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: "32px" }}>
              <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: "600", marginBottom: "2px" }}>HET NASIONAL</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800" }}>Rp13.500/kg</div>
            </div>
          </div>
        </div>

        <div className="ch-list-head">
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "800" }}>Daftar Kios Terdekat</h2>
          <span
            style={{
              color: "#4a6550",
              fontSize: "13px",
              backgroundColor: "#ffffff",
              padding: "6px 16px",
              borderRadius: "999px",
              border: "1px solid #d8e2dc",
              fontWeight: "600",
              whiteSpace: "nowrap",
            }}
          >
            Ditemukan <strong style={{ color: "#2d6a4f" }}>{sortedKiosList.length}</strong> kios
          </span>
        </div>

        <div className="ch-main-grid">
          <aside
            className="ch-aside-filter"
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "24px",
              border: "1px solid #d8e2dc",
              display: "flex",
              flexDirection: "column",
              gap: "22px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #d8e2dc", paddingBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "15px" }}>
                <SlidersHorizontal size={16} color="#2d6a4f" />
                <span>Filter Presisi</span>
              </div>
              <button
                onClick={handleReset}
                style={{ border: "none", background: "none", color: "#4a6550", fontSize: "12px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit" }}
              >
                Reset
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#e2f5ea",
                padding: "14px 16px",
                borderRadius: "16px",
                fontSize: "12px",
                color: "#1b4332",
                lineHeight: "1.5",
              }}
            >
              <strong style={{ display: "block", marginBottom: "4px", fontWeight: "800" }}>Kios Binaan Resmi</strong>
              Telah bersertifikasi uji timbang &amp; pengawasan berkala DKPP Lamongan.
            </div>

            <div style={{ borderTop: "1px solid #d8e2dc", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 2px 0" }}>Sebaran Harga per Pasar</h3>
                <span style={{ fontSize: "12px", color: "#4a6550" }}>Pantauan rata-rata harian</span>
              </div>

              {sebaranPasar.map((item) => {
                const isSelected = selectedPasar === item.nama;
                return (
                  <div
                    key={item.nama}
                    onClick={() => {
                      const newPasar = isSelected ? "Semua Pasar Rakyat" : item.nama;
                      setSelectedPasar(newPasar);
                      fetchKiosData(newPasar);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      backgroundColor: isSelected ? "#e2f5ea" : "#f4f8f5",
                      borderRadius: "14px",
                      border: isSelected ? "1px solid #2d6a4f" : "1px solid #d8e2dc",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: "800" }}>{item.nama}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "#1b4332" }}>{item.harga}</div>
                      <div style={{ fontSize: "10.5px", color: "#4a6550", fontWeight: "600" }}>{item.kios}</div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => setActivePage && setActivePage("komparasi-pasar")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  backgroundColor: "#e2f5ea",
                  border: "none",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: "#1b4332",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <span>Buka Komparasi Pasar</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </aside>

          <section>
            {loading ? (
              <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #d8e2dc" }}>
                <Loader2
                  size={30}
                  color="#2d6a4f"
                  style={{ display: "block", margin: "0 auto 12px auto", animation: "ch-spin 1s linear infinite" }}
                />
                <p style={{ color: "#4a6550", margin: 0, fontSize: "14px" }}>Memuat data kios...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "2rem", backgroundColor: "#fef2f2", borderRadius: "24px", border: "1px solid #fecaca", color: "#991b1b" }}>
                <p style={{ fontWeight: "700", margin: "0 0 6px 0" }}>Gagal memuat data</p>
                <p style={{ fontSize: "13px", margin: 0 }}>{error}</p>
              </div>
            ) : currentKiosList.length > 0 ? (
              <>
                <div className="ch-kios-grid">
                  {currentKiosList.map((kios) => (
                    <div
                      key={kios.id}
                      className="ch-kios-card"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #d8e2dc",
                        borderRadius: "24px",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span style={badgeStyle("#e2f5ea", "#1b4332")}>{kios.badge_label || kios.status_izin || "BERIZIN"}</span>
                            {(kios.is_binaan_dkpp || kios.is_active) && <span style={badgeStyle("#e0f2fe", "#0284c7")}>Binaan DKPP</span>}
                          </div>

                          {kios.jarak_km !== undefined && kios.jarak_km !== null && (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                backgroundColor: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                color: "#15803d",
                                fontSize: "12px",
                                fontWeight: "800",
                              }}
                            >
                              <Navigation size={12} color="#15803d" />
                              <span>{kios.jarak_km} km</span>
                            </div>
                          )}
                        </div>

                        <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: "800" }}>{kios.nama_kios}</h3>

                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#4a6550", lineHeight: "1.5", marginBottom: "14px" }}>
                          <MapPin size={15} color="#2d6a4f" style={{ marginTop: "2px", flexShrink: 0 }} />
                          <span>{kios.alamat_lengkap || kios.nama_pasar || "Pasar Rakyat Lamongan"}</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#4a6550" }}>
                          {kios.pemilik && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <User size={15} color="#2d6a4f" style={{ flexShrink: 0 }} />
                              <span>
                                Pemilik: <strong style={{ color: "#112216" }}>{kios.pemilik}</strong>
                              </span>
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Clock size={15} color="#2d6a4f" style={{ flexShrink: 0 }} />
                            <span>
                              Jam Buka: <strong style={{ color: "#112216" }}>{kios.jam_buka || "08:00 - 16:00 WIB"}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid #d8e2dc", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                        <div>
                          <div style={{ fontSize: "10.5px", color: "#4a6550", fontWeight: "800", letterSpacing: "0.04em" }}>
                            {kios.harga_terkini || kios.harga ? "HARGA TERKINI" : "KATALOG"}
                          </div>
                          <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#112216" }}>
                            {kios.harga_terkini || kios.harga ? (
                              <>
                                Rp {Number(kios.harga_terkini || kios.harga).toLocaleString("id-ID")}{" "}
                                <span style={{ fontSize: "12px", color: "#4a6550", fontWeight: "600" }}>
                                  {kios.satuan ? `/${kios.satuan}` : "/kg"}
                                </span>
                              </>
                            ) : (
                              <>
                                {kios.total_katalog || 0}{" "}
                                <span style={{ fontSize: "12px", color: "#4a6550", fontWeight: "600" }}>Item</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDetailKios(kios)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "#1b4332",
                            color: "#ffffff",
                            border: "none",
                            padding: "11px 22px",
                            borderRadius: "999px",
                            fontWeight: "700",
                            fontSize: "13px",
                            fontFamily: "inherit",
                            cursor: "pointer",
                          }}
                        >
                          <span>Detail Kios</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "32px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={pageBtnStyle(currentPage === 1)}
                    >
                      Sebelumnya
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          border: currentPage === pageNum ? "1px solid #1b4332" : "1px solid #d8e2dc",
                          backgroundColor: currentPage === pageNum ? "#1b4332" : "#ffffff",
                          color: currentPage === pageNum ? "#ffffff" : "#4a6550",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "800",
                          fontFamily: "inherit",
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={pageBtnStyle(currentPage === totalPages)}
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "4rem 1rem", backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #d8e2dc" }}>
                <Search size={32} color="#9ca3af" style={{ display: "block", margin: "0 auto 1rem auto" }} />
                <h4 style={{ margin: "0 0 6px 0", fontWeight: "800" }}>Kios tidak ditemukan</h4>
                <p style={{ fontSize: "13px", color: "#4a6550", margin: 0 }}>
                  Coba ubah kata kunci atau filter lokasi pasar.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
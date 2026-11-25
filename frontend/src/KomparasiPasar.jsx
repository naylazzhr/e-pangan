import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeftRight,
  Store,
  Download,
  Info,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Search,
  Award,
  X,
  Check,
} from "lucide-react";
import { getKomparasiPasar } from "./api";

function formatRp(v) {
  if (v == null || isNaN(v)) return "—";
  return "Rp " + Number(v).toLocaleString("id-ID");
}

function PriceBar({ value, min, max, isLow, isHigh }) {
  if (!value || min === max) return null;
  const pct = Math.round(((value - min) / (max - min)) * 100);
  const color = isLow ? "#2d6a4f" : isHigh ? "#e11d48" : "#74c69d";

  return (
    <div style={{ height: 4, borderRadius: 99, backgroundColor: "#d8e2dc", marginTop: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(12, pct)}%`, height: "100%", backgroundColor: color, borderRadius: 99 }} />
    </div>
  );
}

const labelStyle = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#4a6550",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  margin: "0 0 6px",
};

const formatCategoryName = (c) => {
  if (!c) return "";
  const lower = c.trim().toLowerCase();
  if (lower === "semua") return "Semua";
  if (lower === "kebutuhan pokok" || lower === "sembako") return "Kebutuhan Pokok";
  if (lower === "bahan baku") return "Bahan Baku";
  if (lower === "bumbu dapur") return "Bumbu Dapur";
  if (lower === "minyak goreng") return "Minyak Goreng";
  if (lower === "protein hewani") return "Protein Hewani";
  if (lower === "produksi daerah") return "Produksi Daerah";
  if (lower.includes("sayur") || lower.includes("jamur")) return "Sayuran";
  return c.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
};

export default function KomparasiPasar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedKat, setSelectedKat] = useState("Semua");
  const [selectedPasar, setSelectedPasar] = useState([]);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const [data, setData] = useState([]);
  const [pasarList, setPasarList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getKomparasiPasar({ search: debouncedSearch, kategori: selectedKat });
      const rawData = Array.isArray(res) ? res : (res?.data || res?.komoditas || []);
      const filteredData = rawData.filter(item => {
        const n = (item.komoditas || item.nama_bahan || "").toLowerCase();
        return !n.includes("kulat") && !n.includes("jamur");
      });
      const rawPasar = res?.daftar_pasar || (filteredData.length > 0 && filteredData[0]?.prices ? Object.keys(filteredData[0].prices) : []);
      const rawKategori = res?.kategori_list || Array.from(new Set(filteredData.map((i) => i.kategori).filter(Boolean)));

      setData(filteredData);
      setPasarList(rawPasar);
      if (selectedPasar.length === 0 && rawPasar.length > 0) setSelectedPasar(rawPasar);

      const cleanCatsMap = new Map();
      rawKategori.forEach(c => {
        const titleName = formatCategoryName(c);
        if (titleName && !cleanCatsMap.has(titleName.toLowerCase())) {
          cleanCatsMap.set(titleName.toLowerCase(), titleName);
        }
      });
      const uniqueCats = Array.from(cleanCatsMap.values());

      setKategoriList(prev => {
        if (prev && prev.length > 3 && uniqueCats.length < 3) {
          return prev;
        }
        const merged = new Map();
        ["Semua", ...prev.filter(x => x !== "Semua"), ...uniqueCats].forEach(c => {
          const formatted = formatCategoryName(c);
          if (formatted && !merged.has(formatted.toLowerCase())) {
            merged.set(formatted.toLowerCase(), formatted);
          }
        });
        return Array.from(merged.values());
      });

      setSummary(res?.summary || null);
    } catch (e) {
      console.error("Fetch Komparasi Error:", e);
      setError(e?.message || "Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedKat]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePasarFilter = (p) => {
    if (selectedPasar.includes(p)) {
      if (selectedPasar.length <= 1) return;
      setSelectedPasar((prev) => prev.filter((item) => item !== p));
    } else {
      setSelectedPasar((prev) => [...prev, p]);
    }
  };

  const displayData = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    if (sortCol === "selisih") return sortDir === "asc" ? a.selisih - b.selisih : b.selisih - a.selisih;
    const pa = a.prices?.[sortCol] ?? Infinity;
    const pb = b.prices?.[sortCol] ?? Infinity;
    return sortDir === "asc" ? pa - pb : pb - pa;
  });

  const toggleSort = (colKey) => {
    if (sortCol === colKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(colKey);
      setSortDir("asc");
    }
  };

  const handleExport = () => {
    if (!data.length) return;
    const visiblePasar = pasarList.filter((p) => selectedPasar.includes(p));
    const headers = ["Komoditas", "Kategori", "Satuan", ...visiblePasar, "Termurah", "Selisih Hemat (Rp)"];
    const rows = data.map((r) => [
      `"${r.komoditas}"`,
      `"${r.kategori}"`,
      r.satuan,
      ...visiblePasar.map((p) => r.prices?.[p] ?? ""),
      `"${r.termurah}"`,
      r.selisih,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `komparasi-harga-lamongan.csv`;
    a.click();
  };

  const activePasarList = pasarList.filter((p) => selectedPasar.includes(p));
  const colCount = activePasarList.length + 2;

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
        .kp-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 1.5rem 3rem;
          box-sizing: border-box;
        }
        .kp-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          padding: 40px 0 28px;
          margin-bottom: 28px;
          border-bottom: 1px solid #d8e2dc;
        }
        .kp-title {
          font-size: 2.3rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }
        .kp-desc {
          color: #4a6550;
          margin: 0;
          font-size: 1rem;
          max-width: 460px;
          line-height: 1.6;
        }
        .kp-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .kp-card {
          background: #ffffff;
          border: 1px solid #d8e2dc;
          border-radius: 24px;
          padding: 22px;
        }
        .kp-card-dark {
          background: #1b4332;
          border: 1px solid #1b4332;
          color: #ffffff;
        }
        .kp-icon-bubble {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e2f5ea;
          color: #2d6a4f;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kp-card-dark .kp-icon-bubble {
          background: rgba(255, 255, 255, 0.14);
          color: #b7efc5;
        }
        .kp-filter-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .kp-filter-label {
          width: 70px;
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 800;
          color: #4a6550;
          letter-spacing: 0.04em;
        }
        .kp-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .kp-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          border: 1px solid #d8e2dc;
          background: #ffffff;
          color: #4a6550;
        }
        .kp-chip.active-dark {
          background: #1b4332;
          border-color: #1b4332;
          color: #ffffff;
        }
        .kp-chip.active-light {
          background: #e2f5ea;
          border-color: #2d6a4f;
          color: #1b4332;
        }
        .kp-table th,
        .kp-table td {
          padding: 14px 18px;
        }
        .kp-table th {
          background: #f4f8f5;
          font-size: 11px;
          font-weight: 800;
          color: #4a6550;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #d8e2dc;
          white-space: nowrap !important;
        }
        .kp-table td {
          border-bottom: 1px solid #e6eee9;
          white-space: nowrap !important;
        }
        .kp-row:last-child td {
          border-bottom: none;
        }
        .kp-row:hover td {
          background: #f4f8f5;
        }
        .kp-row td.kp-low {
          background: #e2f5ea;
        }
        .kp-row td.kp-high {
          background: #fef2f2;
        }
        .kp-sticky {
          position: sticky;
          left: 0;
          z-index: 2;
          background: #ffffff !important;
          border-right: 2px solid #d8e2dc;
          min-width: 190px;
          max-width: 190px;
          white-space: normal !important;
          overflow-wrap: break-word;
          box-shadow: 2px 0 6px -2px rgba(27,67,50,0.10);
        }
        .kp-table th.kp-sticky {
          background: #f4f8f5 !important;
          border-right: 2px solid #d8e2dc;
          z-index: 3;
          box-shadow: 2px 0 6px -2px rgba(27,67,50,0.10);
        }
        .kp-row:hover td.kp-sticky {
          background: #f4f8f5 !important;
        }
        .kp-col-pasar {
          min-width: 125px !important;
          white-space: nowrap !important;
          text-align: right;
        }
        .kp-col-rekomendasi {
          min-width: 135px !important;
          white-space: nowrap !important;
          text-align: center;
        }
        .kp-scroll-hint {
          display: none;
        }
        .kp-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 1100px) {
          .kp-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .kp-container { padding: 0 10px; }
          .kp-sticky {
            position: sticky !important;
            left: 0 !important;
            z-index: 2 !important;
            background: #ffffff !important;
            border-right: 2px solid #d8e2dc !important;
            min-width: 158px !important;
            max-width: 158px !important;
            white-space: normal !important;
            overflow-wrap: break-word !important;
            box-shadow: 2px 0 6px -2px rgba(27,67,50,0.12) !important;
          }
          .kp-table th.kp-sticky {
            background: #f4f8f5 !important;
            z-index: 3 !important;
          }
          .kp-row:hover td.kp-sticky {
            background: #f4f8f5 !important;
          }
          .kp-row td.kp-low.kp-sticky {
            background: #e2f5ea !important;
          }
          .kp-row td.kp-high.kp-sticky {
            background: #fef2f2 !important;
          }
          .kp-export-btn {
            height: 34px !important;
            padding: 0 12px !important;
            font-size: 11.5px !important;
            gap: 5px !important;
          }
          .kp-export-btn svg {
            width: 13px !important;
            height: 13px !important;
          }
          .kp-col-pasar {
            min-width: 115px !important;
            width: auto !important;
            font-size: 11px !important;
            white-space: nowrap !important;
          }
          .kp-col-rekomendasi {
            min-width: 125px !important;
            width: auto !important;
            font-size: 11px !important;
            white-space: nowrap !important;
          }
          .kp-head {
            flex-direction: column;
            align-items: flex-start;
            padding: 14px 0 10px;
            gap: 6px;
          }
          .kp-title {
            font-size: 1.35rem !important;
            line-height: 1.25 !important;
          }
          .kp-head p {
            font-size: 11px !important;
            margin-top: 4px !important;
          }
          .kp-summary-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 14px !important;
          }
          .kp-card {
            padding: 12px !important;
            border-radius: 16px !important;
          }
          .kp-card h3 {
            font-size: 1rem !important;
          }
          .kp-filter-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .kp-chips {
            gap: 5px;
          }
          .kp-chip {
            padding: 5px 10px;
            font-size: 10.5px;
          }
          .kp-table th,
          .kp-table td {
            padding: 10px 12px !important;
            font-size: 11px !important;
          }
          .kp-scroll-hint {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            font-size: 10.5px;
            font-weight: 700;
            color: #1b4332;
            background: #e2f5ea;
            border-bottom: 1px solid #c2e3cd;
          }
          .kp-icon-bubble {
            width: 32px;
            height: 32px;
          }
        }
        @media (max-width: 480px) {
          .kp-summary-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .kp-card {
            padding: 12px 10px !important;
          }
          .kp-card h3 {
            font-size: 1rem !important;
          }
        }
      `}</style>

      <div className="kp-container">
        {/* JUDUL HALAMAN */}
        <div className="kp-head">
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#e2f5ea",
                padding: "6px 16px",
                borderRadius: "999px",
                marginBottom: "14px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2d6a4f" }}></span>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.05em" }}>
                MONITORING HARGA PANGAN LAMONGAN
              </span>
            </div>
            <h1 className="kp-title">
              Perbandingan Harga <span style={{ color: "#2d6a4f" }}>Antar Pasar</span>
            </h1>
          </div>
        </div>

        {/* RINGKASAN */}
        <div className="kp-summary-grid">
          <div className="kp-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <p style={labelStyle}>Pasar Termurah</p>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0 }}>
                  {loading ? "..." : summary?.pasar_paling_kompetitif || "—"}
                </h3>
              </div>
              <div className="kp-icon-bubble"><Award size={20} /></div>
            </div>
            <span
              style={{
                display: "inline-block",
                marginTop: 14,
                background: "#e2f5ea",
                color: "#1b4332",
                padding: "4px 12px",
                borderRadius: 99,
                fontSize: "11px",
                fontWeight: "800",
              }}
            >
              {loading ? "..." : `${summary?.pct_komoditas_termurah ?? 0}% Komoditas Termurah`}
            </span>
          </div>

          <div className="kp-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <p style={labelStyle}>Rata-Rata Selisih</p>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0 }}>
                  {loading ? "..." : formatRp(summary?.rata_rata_selisih)}
                </h3>
              </div>
              <div className="kp-icon-bubble"><ArrowLeftRight size={20} /></div>
            </div>
            <p style={{ margin: "14px 0 0", fontSize: "12px", color: "#4a6550", fontWeight: "600" }}>
              Selisih tertinggi vs terendah
            </p>
          </div>

          <div className="kp-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <p style={labelStyle}>Komoditas Dipantau</p>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0 }}>
                  {loading ? "..." : `${data.length} Komoditas`}
                </h3>
              </div>
              <div className="kp-icon-bubble"><Store size={20} /></div>
            </div>
            <p style={{ margin: "14px 0 0", fontSize: "12px", color: "#4a6550", fontWeight: "600" }}>
              {pasarList.length} pasar terhubung
            </p>
          </div>


        </div>

        {/* FILTER */}
        <div className="kp-card" style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#f4f8f5",
                border: "1px solid #d8e2dc",
                padding: "0 12px",
                height: 38,
                borderRadius: 99,
                flex: "1 1 200px",
                minWidth: 0,
              }}
            >
              <Search size={14} color="#4a6550" />
              <input
                type="text"
                placeholder="Cari komoditas (misal: Cabai, Beras)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  width: "100%",
                  fontSize: "12px",
                  fontWeight: "500",
                  fontFamily: "inherit",
                  color: "#112216",
                  minWidth: 0,
                }}
              />
              {searchQuery && (
                <X size={14} color="#4a6550" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setSearchQuery("")} />
              )}
            </div>

            <button
              onClick={fetchData}
              title="Muat ulang data"
              style={{
                width: 38,
                height: 38,
                border: "1px solid #d8e2dc",
                borderRadius: "50%",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <RefreshCw size={14} color="#4a6550" />
            </button>

            <button
              onClick={handleExport}
              disabled={!data.length}
              className="kp-export-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 44,
                padding: "0 24px",
                borderRadius: 99,
                border: "none",
                background: "#1b4332",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "13.5px",
                fontFamily: "inherit",
                cursor: data.length ? "pointer" : "not-allowed",
                opacity: data.length ? 1 : 0.5,
              }}
            >
              <Download size={15} /> Export CSV
            </button>
          </div>

          <div className="kp-filter-row">
            <span className="kp-filter-label">KATEGORI</span>
            <div className="kp-chips">
              {kategoriList.map((cat) => {
                const isActive = (selectedKat || "Semua").trim().toLowerCase() === cat.trim().toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`kp-chip ${isActive ? "active-dark" : ""}`}
                    onClick={() => setSelectedKat(cat)}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {pasarList.length > 0 && (
            <div className="kp-filter-row">
              <span className="kp-filter-label">PASAR</span>
              <div className="kp-chips">
                {pasarList.map((p) => {
                  const active = selectedPasar.includes(p);
                  return (
                    <button
                      key={p}
                      className={`kp-chip ${active ? "active-light" : ""}`}
                      onClick={() => togglePasarFilter(p)}
                    >
                      {active && <Check size={13} />}
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* TABEL */}
        <div className="kp-card" style={{ padding: 0, overflow: "hidden" }}>
          {error && (
            <div style={{ padding: 40, textAlign: "center", color: "#e11d48" }}>
              <AlertCircle size={36} style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: "800", margin: "0 0 4px" }}>Gagal Memuat Data</p>
              <p style={{ fontSize: "13px", color: "#4a6550", margin: 0 }}>{error}</p>
            </div>
          )}

          {!error && (
            <>
              <div className="kp-scroll-hint">
                <Info size={14} />
                <span>Geser tabel ke samping untuk melihat semua komoditas &amp; harga tiap pasar</span>
              </div>

              <div
                className="kp-table-scroll"
                style={{
                  overflowX: "auto",
                  overflowY: "visible",
                  WebkitOverflowScrolling: "touch",
                  width: "100%",
                  touchAction: "pan-x pan-y",
                }}
              >
                <table
                  className="kp-table"
                  style={{
                    width: "max-content",
                    minWidth: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    tableLayout: "auto",
                  }}
                >
                  <thead>
                    <tr>
                      <th className="kp-sticky">Komoditas</th>
                      {activePasarList.map((p) => (
                        <th
                          key={p}
                          className="kp-col-pasar"
                          onClick={() => toggleSort(p)}
                          style={{ cursor: "pointer" }}
                        >
                          {p} {sortCol === p && (sortDir === "asc" ? "↑" : "↓")}
                        </th>
                      ))}
                      <th className="kp-col-rekomendasi">Rekomendasi</th>
                    </tr>
                  </thead>

                  <tbody style={{ fontSize: "14px" }}>
                    {loading && (
                      <tr>
                        <td colSpan={colCount || 3} style={{ padding: 40, textAlign: "center", color: "#4a6550", fontWeight: "600" }}>
                          Memuat data komparasi...
                        </td>
                      </tr>
                    )}

                    {!loading && displayData.length === 0 && (
                      <tr>
                        <td colSpan={colCount || 3} style={{ padding: 50, textAlign: "center", color: "#4a6550", fontWeight: "600" }}>
                          Data komoditas tidak ditemukan untuk filter ini.
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      displayData.map((row) => {
                        const prices = row.prices || {};
                        const visibleVals = activePasarList.map((p) => prices[p]).filter((v) => v != null);
                        const minVal = visibleVals.length ? Math.min(...visibleVals) : 0;
                        const maxVal = visibleVals.length ? Math.max(...visibleVals) : 0;

                        return (
                          <tr key={row.id} className="kp-row">
                            <td className="kp-sticky">
                              <div>
                                <div style={{ fontWeight: "800", fontSize: "11.5px", lineHeight: "1.3" }}>{row.komoditas}</div>
                                <div style={{ fontSize: "9.5px", color: "#4a6550", fontWeight: "600", marginTop: 2 }}>
                                  {row.kategori} · per {row.satuan}
                                </div>
                              </div>
                            </td>

                            {activePasarList.map((p) => {
                              const price = prices[p];
                              const isLow = row.termurah === p;
                              const isHigh = row.termahal === p;
                              return (
                                <td
                                  key={p}
                                  className={`kp-col-pasar ${isLow ? "kp-low" : isHigh ? "kp-high" : ""}`}
                                  style={{
                                    fontWeight: isLow ? "800" : "600",
                                    color: isLow ? "#1b4332" : isHigh ? "#e11d48" : "#112216",
                                  }}
                                >
                                  {price == null ? (
                                    "—"
                                  ) : (
                                    <>
                                      <div>{formatRp(price)}</div>
                                      <PriceBar value={price} min={minVal} max={maxVal} isLow={isLow} isHigh={isHigh} />
                                      {isLow && (
                                        <span style={{ fontSize: "10px", color: "#2d6a4f", fontWeight: "800", letterSpacing: "0.04em" }}>
                                          TERMURAH
                                        </span>
                                      )}
                                    </>
                                  )}
                                </td>
                              );
                            })}

                            <td className="kp-col-rekomendasi">
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  background: "#e2f5ea",
                                  color: "#1b4332",
                                  padding: "4px 8px",
                                  borderRadius: 99,
                                  fontSize: "10.5px",
                                  fontWeight: "800",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <CheckCircle2 size={13} color="#2d6a4f" /> {row.termurah || "—"}
                              </span>
                              {row.selisih > 0 && (
                                <div style={{ fontSize: "10.5px", color: "#2d6a4f", marginTop: 3, fontWeight: "700" }}>
                                  Hemat {formatRp(row.selisih)}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div
            style={{
              padding: "14px 24px",
              background: "#f4f8f5",
              borderTop: "1px solid #d8e2dc",
              fontSize: "12.5px",
              color: "#4a6550",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px 20px",
              fontWeight: "600",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "#e2f5ea", border: "1px solid #2d6a4f" }} />
              Termurah
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "#fef2f2", border: "1px solid #e11d48" }} />
              Termahal
            </span>
            <span>Data berdasarkan pemantauan terverifikasi enumerator DKPP.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
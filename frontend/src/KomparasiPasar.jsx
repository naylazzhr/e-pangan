import React, { useState, useEffect, useCallback } from "react";
import {
    ArrowLeftRight, Store, Filter, Download, Info, CheckCircle2,
    RefreshCw, AlertCircle, Search, Zap, BarChart3, MapPin, Award, X, Check
} from "lucide-react";
import { getKomparasiPasar } from "./api";

function formatRp(v) {
    if (v == null || isNaN(v)) return "—";
    return "Rp " + Number(v).toLocaleString("id-ID");
}

function PriceBar({ value, min, max, isLow, isHigh }) {
    if (!value || min === max) return null;
    const pct = Math.round(((value - min) / (max - min)) * 100);
    const color = isLow ? "#10b981" : isHigh ? "#f43f5e" : "#0d9488";

    return (
        <div style={{ height: 5, borderRadius: 99, backgroundColor: "#e2e8f0", marginTop: 6, overflow: "hidden" }}>
            <div style={{ width: `${Math.max(12, pct)}%`, height: "100%", backgroundColor: color, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
    );
}

export default function KomparasiPasar() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedKat, setSelectedKat] = useState("Semua");
    const [selectedPasar, setSelectedPasar] = useState([]);
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState("asc");
    const [savedItems, setSavedItems] = useState([]);

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
            const rawPasar = res?.daftar_pasar || (rawData.length > 0 && rawData[0]?.prices ? Object.keys(rawData[0].prices) : []);
            const rawKategori = res?.kategori_list || Array.from(new Set(rawData.map(i => i.kategori).filter(Boolean)));

            setData(rawData);
            setPasarList(rawPasar);
            if (selectedPasar.length === 0 && rawPasar.length > 0) setSelectedPasar(rawPasar);
            setKategoriList(["Semua", ...rawKategori]);
            setSummary(res?.summary || null);
        } catch (e) {
            console.error("Fetch Komparasi Error:", e);
            setError(e?.message || "Gagal mengambil data dari server.");
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, selectedKat]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const togglePasarFilter = (p) => {
        if (selectedPasar.includes(p)) {
            if (selectedPasar.length <= 1) return;
            setSelectedPasar(prev => prev.filter(item => item !== p));
        } else {
            setSelectedPasar(prev => [...prev, p]);
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
        if (sortCol === colKey) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortCol(colKey); setSortDir("asc"); }
    };

    const toggleSimulasiItem = (id) => {
        setSavedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleExport = () => {
        if (!data.length) return;
        const visiblePasar = pasarList.filter(p => selectedPasar.includes(p));
        const headers = ["Komoditas", "Kategori", "Satuan", ...visiblePasar, "Termurah", "Selisih Hemat (Rp)"];
        const rows = data.map(r => [
            `"${r.komoditas}"`, `"${r.kategori}"`, r.satuan,
            ...visiblePasar.map(p => r.prices?.[p] ?? ""),
            `"${r.termurah}"`, r.selisih,
        ]);
        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
        a.download = `komparasi-harga-lamongan.csv`;
        a.click();
    };

    const activePasarList = pasarList.filter(p => selectedPasar.includes(p));
    const colCount = activePasarList.length + 3;
    const totalSimulasiHemat = data.filter(r => savedItems.includes(r.id)).reduce((acc, r) => acc + (r.selisih || 0), 0);

    return (
        <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", width: "100%", overflow: "visible", position: "relative", fontFamily: "'Inter', sans-serif", color: "#1e293b", paddingBottom: 60 }}>
            <style>{`
                .kp-btn-cat { border:none; border-radius:10px; padding:7px 14px; font-size:0.8rem; font-weight:700; cursor:pointer; transition:all .2s; }
                .kp-btn-cat:hover { filter:brightness(.95); }
                .kp-table-row:hover td { background-color: #f1f5f9 !important; }
            `}</style>

            {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
            <div style={{ background: "linear-gradient(135deg, #065f46 0%, #047857 50%, #0f766e 100%)", padding: "48px 24px 80px", color: "#fff", width: "100%", boxSizing: "border-box" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: 30, fontSize: "0.8rem", fontWeight: "700", marginBottom: 16 }}>
                        <BarChart3 size={15} color="#6ee7b7" /> MONITORING HARGA PANGAN LAMONGAN
                    </div>
                    <div>
                        <h1 style={{ fontSize: "2.2rem", fontWeight: "800", margin: "0 0 10px", lineHeight: 1.2 }}>
                            Perbandingan Harga <span style={{ color: "#6ee7b7" }}>Antar Pasar</span>
                        </h1>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", maxWidth: 600 }}>
                            Bandingkan harga komoditas pokok real-time di seluruh pasar rakyat Lamongan untuk mendapatkan lokasi belanja hemat.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── CONTENT CONTAINER ────────────────────────────────────────── */}
            <div style={{ maxWidth: 1200, margin: "-50px auto 0", padding: "0 20px", position: "relative", zIndex: 10 }}>

                {/* ── CARDS SUMMARY ───────────────────────────────────────────── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>

                    <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "0.72rem", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", margin: "0 0 4px" }}>Pasar Termurah</p>
                                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                                    {loading ? "..." : (summary?.pasar_paling_kompetitif || "—")}
                                </h3>
                            </div>
                            <div style={{ padding: 8, background: "#dcfce7", borderRadius: 10, color: "#16a34a" }}><Award size={20} /></div>
                        </div>
                        <span style={{ display: "inline-block", marginTop: 12, background: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: "700" }}>
                            {loading ? "..." : `${summary?.pct_komoditas_termurah ?? 0}% Komoditas Termurah`}
                        </span>
                    </div>

                    <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "0.72rem", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", margin: "0 0 4px" }}>Rata-Rata Selisih</p>
                                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                                    {loading ? "..." : formatRp(summary?.rata_rata_selisih)}
                                </h3>
                            </div>
                            <div style={{ padding: 8, background: "#ccfbf1", borderRadius: 10, color: "#0d9488" }}><ArrowLeftRight size={20} /></div>
                        </div>
                        <p style={{ margin: "12px 0 0", fontSize: "0.75rem", color: "#64748b" }}>Selisih tertinggi vs terendah</p>
                    </div>

                    <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "0.72rem", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", margin: "0 0 4px" }}>Komoditas Dipantau</p>
                                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                                    {loading ? "..." : `${data.length} Komoditas`}
                                </h3>
                            </div>
                            <div style={{ padding: 8, background: "#e0f2fe", borderRadius: 10, color: "#0369a1" }}><Store size={20} /></div>
                        </div>
                        <p style={{ margin: "12px 0 0", fontSize: "0.75rem", color: "#64748b" }}>{pasarList.length} pasar terhubung</p>
                    </div>

                    <div style={{ background: "linear-gradient(135deg, #059669, #0d9488)", padding: 20, borderRadius: 16, color: "#fff", boxShadow: "0 10px 25px -5px rgba(5,150,105,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "0.72rem", fontWeight: "800", color: "#a7f3d0", textTransform: "uppercase", margin: "0 0 4px" }}>Simulasi Hemat Saya</p>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0 }}>{formatRp(totalSimulasiHemat)}</h3>
                            </div>
                            <div style={{ padding: 8, background: "rgba(255,255,255,0.2)", borderRadius: 10, color: "#fef08a" }}><Zap size={20} /></div>
                        </div>
                        <p style={{ margin: "12px 0 0", fontSize: "0.75rem", color: "#d1fae5" }}>
                            {savedItems.length === 0 ? "Centang item di tabel untuk hitung hemat" : `${savedItems.length} barang dipilih`}
                        </p>
                    </div>
                </div>

                {/* ── PASAR SELECTOR ─────────────────────────────────────────── */}
                {pasarList.length > 0 && (
                    <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 14, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#475569", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                            <MapPin size={15} color="#059669" /> PILIH PASAR YANG INGIN DIBANDINGKAN:
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {pasarList.map(p => {
                                const active = selectedPasar.includes(p);
                                return (
                                    <button key={p} onClick={() => togglePasarFilter(p)} style={{
                                        padding: "6px 14px", borderRadius: 20, fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                                        background: active ? "#ecfdf5" : "#f8fafc", border: active ? "1px solid #a7f3d0" : "1px solid #cbd5e1", color: active ? "#065f46" : "#64748b"
                                    }}>
                                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? "#10b981" : "#cbd5e1" }} />
                                        {p} {active && <Check size={13} color="#059669" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── TOOLBAR ─────────────────────────────────────────────────── */}
                <div style={{ background: "#fff", padding: 16, borderRadius: 14, border: "1px solid #e2e8f0", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #cbd5e1", padding: "8px 14px", borderRadius: 10, flex: "1 1 240px" }}>
                        <Search size={16} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Cari komoditas (misal: Cabai, Beras)..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.85rem" }}
                        />
                        {searchQuery && <X size={15} color="#94a3b8" style={{ cursor: "pointer" }} onClick={() => setSearchQuery("")} />}
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <Filter size={15} color="#94a3b8" />
                        {kategoriList.map(cat => (
                            <button key={cat} className="kp-btn-cat" onClick={() => setSelectedKat(cat)} style={{
                                background: selectedKat === cat ? "#059669" : "#f1f5f9",
                                color: selectedKat === cat ? "#fff" : "#475569",
                            }}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={fetchData} style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 10, background: "#f8fafc", cursor: "pointer" }}>
                            <RefreshCw size={15} color="#475569" />
                        </button>
                        <button onClick={handleExport} disabled={!data.length} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "none", background: "#047857", color: "#fff", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer" }}>
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* ── TABEL MATRIKS ───────────────────────────────────────────── */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
                    {error && (
                        <div style={{ padding: 40, textAlign: "center", color: "#e11d48" }}>
                            <AlertCircle size={36} style={{ marginBottom: 8 }} />
                            <p style={{ fontWeight: "700" }}>Gagal Memuat Data</p>
                            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>{error}</p>
                        </div>
                    )}

                    {!error && (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase" }}>
                                        <th style={{ padding: "14px 16px", textAlign: "center" }}>Pilih</th>
                                        <th style={{ padding: "14px 16px" }}>Komoditas</th>
                                        {activePasarList.map(p => (
                                            <th key={p} onClick={() => toggleSort(p)} style={{ padding: "14px 16px", textAlign: "right", cursor: "pointer" }}>
                                                {p} {sortCol === p && (sortDir === "asc" ? "↑" : "↓")}
                                            </th>
                                        ))}
                                        <th style={{ padding: "14px 16px", textAlign: "center" }}>Rekomendasi</th>
                                    </tr>
                                </thead>

                                <tbody style={{ fontSize: "0.88rem" }}>
                                    {loading && (
                                        <tr>
                                            <td colSpan={colCount || 4} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>
                                                Memuat data komparasi...
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && displayData.length === 0 && (
                                        <tr>
                                            <td colSpan={colCount || 4} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                                                Data komoditas tidak ditemukan untuk filter ini.
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && displayData.map((row) => {
                                        const prices = row.prices || {};
                                        const visibleVals = activePasarList.map(p => prices[p]).filter(v => v != null);
                                        const minVal = visibleVals.length ? Math.min(...visibleVals) : 0;
                                        const maxVal = visibleVals.length ? Math.max(...visibleVals) : 0;
                                        const isSaved = savedItems.includes(row.id);

                                        return (
                                            <tr key={row.id} className="kp-table-row" style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSaved}
                                                        onChange={() => toggleSimulasiItem(row.id)}
                                                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#059669" }}
                                                    />
                                                </td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <div style={{ fontWeight: "700", color: "#0f172a" }}>{row.komoditas}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{row.kategori} · per {row.satuan}</div>
                                                </td>

                                                {activePasarList.map(p => {
                                                    const price = prices[p];
                                                    const isLow = row.termurah === p;
                                                    const isHigh = row.termahal === p;
                                                    return (
                                                        <td key={p} style={{
                                                            padding: "12px 16px", textAlign: "right",
                                                            backgroundColor: isLow ? "#f0fdf4" : isHigh ? "#fff1f2" : "transparent",
                                                            fontWeight: isLow ? "800" : "500", color: isLow ? "#15803d" : isHigh ? "#be123c" : "#334155"
                                                        }}>
                                                            {price == null ? "—" : (
                                                                <>
                                                                    <div>{formatRp(price)}</div>
                                                                    <PriceBar value={price} min={minVal} max={maxVal} isLow={isLow} isHigh={isHigh} />
                                                                    {isLow && <span style={{ fontSize: "0.65rem", color: "#16a34a", fontWeight: "800" }}>TERMURAH</span>}
                                                                </>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#dcfce7", color: "#15803d", padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: "800" }}>
                                                        <CheckCircle2 size={13} /> {row.termurah || "—"}
                                                    </span>
                                                    {row.selisih > 0 && (
                                                        <div style={{ fontSize: "0.72rem", color: "#059669", marginTop: 2, fontWeight: "700" }}>
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
                    )}

                    <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", fontSize: "0.78rem", color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                        <Info size={14} color="#059669" />
                        <span><strong>Hijau</strong> = Termurah · <strong>Merah</strong> = Termahal. Data berdasarkan pemantauan terverifikasi.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
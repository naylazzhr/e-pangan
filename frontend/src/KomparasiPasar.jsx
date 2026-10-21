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
    const color = isLow ? "#2d6a4f" : isHigh ? "#e11d48" : "#52b788";

    return (
        <div style={{ height: 5, borderRadius: 99, backgroundColor: "#d8e2dc", marginTop: 6, overflow: "hidden" }}>
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
        <div style={{ backgroundColor: "#f3f6f4", minHeight: "100vh", width: "100%", overflow: "visible", position: "relative", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#112216", paddingBottom: 60 }}>
            <style>{`
                .kp-btn-cat { border:none; border-radius:99px; padding:8px 18px; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; }
                .kp-btn-cat:hover { filter:brightness(.95); transform: translateY(-1px); }
                .kp-table-row:hover td { background-color: #e8f5e9 !important; }
            `}</style>

            {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
            <div style={{ background: "linear-gradient(135deg, #071a11 0%, #113324 50%, #235841 100%)", padding: "48px 3rem 80px", color: "#fff", width: "100%", boxSizing: "border-box" }}>
                <div style={{ maxWidth: 1750, margin: "0 auto" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.22)", padding: "6px 16px", borderRadius: 99, fontSize: "12px", fontWeight: "800", marginBottom: 16, color: "#b7efc5" }}>
                        <BarChart3 size={15} color="#b7efc5" /> MONITORING HARGA PANGAN LAMONGAN
                    </div>
                    <div>
                        <h1 style={{ fontSize: "2.8rem", fontWeight: "800", margin: "0 0 10px", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
                            Perbandingan Harga <span style={{ color: "#74c69d" }}>Antar Pasar</span>
                        </h1>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.88)", fontSize: "1.05rem", maxWidth: 650, lineHeight: "1.6" }}>
                            Bandingkan harga komoditas pokok real-time di seluruh pasar rakyat Lamongan untuk mendapatkan lokasi belanja hemat.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── CONTENT CONTAINER (DENGAN BACKGROUND SAGE SEPERTI KATALOG) ────── */}
            <div style={{ maxWidth: 1750, margin: "-50px auto 0", padding: "0 3rem", position: "relative", zIndex: 10 }}>

                {/* ── CARDS SUMMARY ───────────────────────────────────────────── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 24 }}>

                    <div style={{ background: "#fff", padding: 24, borderRadius: 28, border: "1px solid #d2ded7", boxShadow: "0 4px 20px rgba(27, 67, 50, 0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "11px", fontWeight: "800", color: "#4e6754", textTransform: "uppercase", margin: "0 0 6px", letterSpacing: "0.04em" }}>Pasar Termurah</p>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0, color: "#112216" }}>
                                    {loading ? "..." : (summary?.pasar_paling_kompetitif || "—")}
                                </h3>
                            </div>
                            <div style={{ padding: 10, background: "#eef8f2", borderRadius: 16, color: "#2d6a4f" }}><Award size={22} /></div>
                        </div>
                        <span style={{ display: "inline-block", marginTop: 14, background: "#eef8f2", color: "#1b4332", padding: "4px 12px", borderRadius: 99, fontSize: "11px", fontWeight: "800", border: "1px solid #b7efc5" }}>
                            {loading ? "..." : `${summary?.pct_komoditas_termurah ?? 0}% Komoditas Termurah`}
                        </span>
                    </div>

                    <div style={{ background: "#fff", padding: 24, borderRadius: 28, border: "1px solid #d2ded7", boxShadow: "0 4px 20px rgba(27, 67, 50, 0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "11px", fontWeight: "800", color: "#4e6754", textTransform: "uppercase", margin: "0 0 6px", letterSpacing: "0.04em" }}>Rata-Rata Selisih</p>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0, color: "#112216" }}>
                                    {loading ? "..." : formatRp(summary?.rata_rata_selisih)}
                                </h3>
                            </div>
                            <div style={{ padding: 10, background: "#eef8f2", borderRadius: 16, color: "#2d6a4f" }}><ArrowLeftRight size={22} /></div>
                        </div>
                        <p style={{ margin: "14px 0 0", fontSize: "12px", color: "#4e6754", fontWeight: "600" }}>Selisih tertinggi vs terendah</p>
                    </div>

                    <div style={{ background: "#fff", padding: 24, borderRadius: 28, border: "1px solid #d2ded7", boxShadow: "0 4px 20px rgba(27, 67, 50, 0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "11px", fontWeight: "800", color: "#4e6754", textTransform: "uppercase", margin: "0 0 6px", letterSpacing: "0.04em" }}>Komoditas Dipantau</p>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0, color: "#112216" }}>
                                    {loading ? "..." : `${data.length} Komoditas`}
                                </h3>
                            </div>
                            <div style={{ padding: 10, background: "#eef8f2", borderRadius: 16, color: "#2d6a4f" }}><Store size={22} /></div>
                        </div>
                        <p style={{ margin: "14px 0 0", fontSize: "12px", color: "#4e6754", fontWeight: "600" }}>{pasarList.length} pasar terhubung</p>
                    </div>

                    <div style={{ background: "linear-gradient(135deg, #113324 0%, #235841 100%)", padding: 24, borderRadius: 28, color: "#fff", boxShadow: "0 12px 32px rgba(27, 67, 50, 0.15)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "11px", fontWeight: "800", color: "#b7efc5", textTransform: "uppercase", margin: "0 0 6px", letterSpacing: "0.04em" }}>Simulasi Hemat Saya</p>
                                <h3 style={{ fontSize: "1.35rem", fontWeight: "800", margin: 0 }}>{formatRp(totalSimulasiHemat)}</h3>
                            </div>
                            <div style={{ padding: 10, background: "rgba(255,255,255,0.15)", borderRadius: 16, color: "#b7efc5" }}><Zap size={22} /></div>
                        </div>
                        <p style={{ margin: "14px 0 0", fontSize: "12px", color: "#d8f3dc", fontWeight: "600" }}>
                            {savedItems.length === 0 ? "Centang item di tabel untuk hitung hemat" : `${savedItems.length} barang dipilih`}
                        </p>
                    </div>
                </div>

                {/* ── KONTAINER UTAMA DENGAN BACKGROUND SAGE (`#dbece2`) ──────────── */}
                <div style={{
                    background: "#dbece2", // Warna kontainer sage yang sama persis seperti katalog komoditas
                    borderRadius: 36,
                    padding: "40px 44px",
                    border: "1px solid #c8dcd0",
                    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)",
                    marginTop: 24
                }}>

                    {/* ── PASAR SELECTOR ─────────────────────────────────────────── */}
                    {pasarList.length > 0 && (
                        <div style={{ background: "#fff", padding: "20px 24px", borderRadius: 24, border: "1px solid #d2ded7", marginBottom: 20, boxShadow: "0 4px 20px rgba(27, 67, 50, 0.04)" }}>
                            <div style={{ fontSize: "12px", fontWeight: "800", color: "#112216", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.04em" }}>
                                <MapPin size={16} color="#2d6a4f" /> PILIH PASAR YANG INGIN DIBANDINGKAN:
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {pasarList.map(p => {
                                    const active = selectedPasar.includes(p);
                                    return (
                                        <button key={p} onClick={() => togglePasarFilter(p)} style={{
                                            padding: "8px 16px", borderRadius: 99, fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                                            background: active ? "#eef8f2" : "#f4f6f5", border: active ? "1px solid #52b788" : "1px solid #d2ded7", color: active ? "#1b4332" : "#4a6550",
                                            boxShadow: active ? "0 2px 8px rgba(82, 183, 136, 0.2)" : "none", transition: "all 0.2s"
                                        }}>
                                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? "#2d6a4f" : "#cbd5e1" }} />
                                            {p} {active && <Check size={14} color="#2d6a4f" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── TOOLBAR ─────────────────────────────────────────────────── */}
                    <div style={{ background: "#fff", padding: 20, borderRadius: 24, border: "1px solid #d2ded7", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(27, 67, 50, 0.04)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f4f6f5", border: "1px solid #d2ded7", padding: "10px 18px", borderRadius: 99, flex: "1 1 280px" }}>
                            <Search size={16} color="#4a6550" />
                            <input
                                type="text"
                                placeholder="Cari komoditas (misal: Cabai, Beras)..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "14px", fontWeight: "600", color: "#112216" }}
                            />
                            {searchQuery && <X size={16} color="#4a6550" style={{ cursor: "pointer" }} onClick={() => setSearchQuery("")} />}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <Filter size={16} color="#4a6550" />
                            {kategoriList.map(cat => (
                                <button key={cat} className="kp-btn-cat" onClick={() => setSelectedKat(cat)} style={{
                                    background: selectedKat === cat ? "#1b4332" : "#f4f6f5",
                                    color: selectedKat === cat ? "#fff" : "#4a6550",
                                    border: selectedKat === cat ? "1px solid #1b4332" : "1px solid #d2ded7"
                                }}>
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={fetchData} style={{ padding: "10px 14px", border: "1px solid #d2ded7", borderRadius: 14, background: "#f4f6f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <RefreshCw size={16} color="#4a6550" />
                            </button>
                            <button onClick={handleExport} disabled={!data.length} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 99, border: "none", background: "linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)", color: "#fff", fontWeight: "700", fontSize: "13.5px", cursor: "pointer", boxShadow: "0 4px 14px rgba(27, 67, 50, 0.2)" }}>
                                <Download size={15} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* ── TABEL MATRIKS (KARTU PUTIH BERSIH) ──────────────────────── */}
                    <div style={{ background: "#fff", borderRadius: 28, border: "1px solid #d2ded7", overflow: "hidden", boxShadow: "0 12px 36px rgba(27, 67, 50, 0.06)" }}>
                        {error && (
                            <div style={{ padding: 40, textAlign: "center", color: "#e11d48" }}>
                                <AlertCircle size={36} style={{ marginBottom: 8 }} />
                                <p style={{ fontWeight: "800" }}>Gagal Memuat Data</p>
                                <p style={{ fontSize: "13px", color: "#4a6550" }}>{error}</p>
                            </div>
                        )}

                        {!error && (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
                                    <thead>
                                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #d2ded7", fontSize: "11px", color: "#4e6754", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "800" }}>
                                            <th style={{ padding: "16px 20px", textAlign: "center" }}>Pilih</th>
                                            <th style={{ padding: "16px 20px" }}>Komoditas</th>
                                            {activePasarList.map(p => (
                                                <th key={p} onClick={() => toggleSort(p)} style={{ padding: "16px 20px", textAlign: "right", cursor: "pointer" }}>
                                                    {p} {sortCol === p && (sortDir === "asc" ? "↑" : "↓")}
                                                </th>
                                            ))}
                                            <th style={{ padding: "16px 20px", textAlign: "center" }}>Rekomendasi</th>
                                        </tr>
                                    </thead>

                                    <tbody style={{ fontSize: "14px" }}>
                                        {loading && (
                                            <tr>
                                                <td colSpan={colCount || 4} style={{ padding: 40, textAlign: "center", color: "#4a6550", fontWeight: "600" }}>
                                                    Memuat data komparasi...
                                                </td>
                                            </tr>
                                        )}

                                        {!loading && displayData.length === 0 && (
                                            <tr>
                                                <td colSpan={colCount || 4} style={{ padding: 50, textAlign: "center", color: "#4a6550", fontWeight: "600" }}>
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
                                                <tr key={row.id} className="kp-table-row" style={{ borderBottom: "1px solid #d2ded7", transition: "background 0.2s" }}>
                                                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSaved}
                                                            onChange={() => toggleSimulasiItem(row.id)}
                                                            style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#2d6a4f" }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "16px 20px" }}>
                                                        <div style={{ fontWeight: "800", color: "#112216" }}>{row.komoditas}</div>
                                                        <div style={{ fontSize: "12px", color: "#4a6550", fontWeight: "600" }}>{row.kategori} · per {row.satuan}</div>
                                                    </td>

                                                    {activePasarList.map(p => {
                                                        const price = prices[p];
                                                        const isLow = row.termurah === p;
                                                        const isHigh = row.termahal === p;
                                                        return (
                                                            <td key={p} style={{
                                                                padding: "16px 20px", textAlign: "right",
                                                                backgroundColor: isLow ? "#eef8f2" : isHigh ? "#fef2f2" : "transparent",
                                                                fontWeight: isLow ? "800" : "600", color: isLow ? "#1b4332" : isHigh ? "#e11d48" : "#112216"
                                                            }}>
                                                                {price == null ? "—" : (
                                                                    <>
                                                                        <div>{formatRp(price)}</div>
                                                                        <PriceBar value={price} min={minVal} max={maxVal} isLow={isLow} isHigh={isHigh} />
                                                                        {isLow && <span style={{ fontSize: "10px", color: "#2d6a4f", fontWeight: "800", letterSpacing: "0.04em" }}>TERMURAH</span>}
                                                                    </>
                                                                )}
                                                            </td>
                                                        );
                                                    })}

                                                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eef8f2", color: "#1b4332", padding: "6px 14px", borderRadius: 99, fontSize: "12.5px", fontWeight: "800", border: "1px solid #b7efc5" }}>
                                                            <CheckCircle2 size={14} color="#2d6a4f" /> {row.termurah || "—"}
                                                        </span>
                                                        {row.selisih > 0 && (
                                                            <div style={{ fontSize: "11px", color: "#2d6a4f", marginTop: 4, fontWeight: "700" }}>
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

                        <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #d2ded7", fontSize: "12.5px", color: "#4e6754", display: "flex", alignItems: "center", gap: 8, fontWeight: "600" }}>
                            <Info size={16} color="#2d6a4f" />
                            <span><strong>Hijau</strong> = Termurah · <strong>Merah</strong> = Termahal. Data berdasarkan pemantauan terverifikasi.</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
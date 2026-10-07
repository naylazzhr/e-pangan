import React, { useState, useEffect, useCallback } from "react";
import {
    ArrowLeftRight,
    Store,
    TrendingDown,
    TrendingUp,
    Filter,
    Download,
    Info,
    CheckCircle2,
    RefreshCw,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { getKomparasiPasar } from "./api";

function formatRupiah(val) {
    if (val == null || isNaN(val)) return "-";
    return "Rp " + Number(val).toLocaleString("id-ID");
}

function SkeletonRow({ cols }) {
    return (
        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} style={{ padding: "16px 20px" }}>
                    <div
                        style={{
                            height: "16px",
                            borderRadius: "6px",
                            backgroundColor: "#e2e8f0",
                            animation: "pulse 1.5s ease-in-out infinite",
                            width: i === 0 ? "70%" : "60%",
                        }}
                    />
                </td>
            ))}
        </tr>
    );
}

export default function KomparasiPasar() {
    const [selectedCategory, setSelectedCategory] = useState("Semua");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [data, setData] = useState([]);
    const [pasarList, setPasarList] = useState([]);
    const [kategoriList, setKategoriList] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Debounce search input 400ms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getKomparasiPasar({
                search: debouncedSearch,
                kategori: selectedCategory,
            });
            setData(res.data || []);
            setPasarList(res.daftar_pasar || []);
            setKategoriList(["Semua", ...(res.kategori_list || [])]);
            setSummary(res.summary || null);
        } catch (err) {
            setError(err.message || "Gagal memuat data komparasi pasar.");
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, selectedCategory]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExport = () => {
        if (!data.length || !pasarList.length) return;

        const headers = ["Komoditas", "Kategori", "Satuan", ...pasarList, "Termurah", "Termahal", "Selisih"];
        const rows = data.map((row) => [
            `"${row.komoditas}"`,
            `"${row.kategori}"`,
            row.satuan,
            ...pasarList.map((p) => (row.prices[p] != null ? row.prices[p] : "-")),
            `"${row.termurah}"`,
            `"${row.termahal}"`,
            row.selisih,
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `komparasi-pasar-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const colCount = pasarList.length + 2;

    return (
        <div style={{ backgroundColor: "#f4f6f9", minHeight: "100vh", padding: "28px 20px" }}>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .komparasi-row:hover { background-color: #f8fafc !important; }
                .cat-btn:hover { opacity: 0.85; }
            `}</style>
            <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

                {/* HEADER */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "16px",
                        backgroundColor: "#ffffff",
                        padding: "24px 28px",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                        marginBottom: "24px",
                        borderLeft: "6px solid #0d6efd",
                        animation: "fadeIn 0.4s ease",
                    }}
                >
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <div
                                style={{
                                    backgroundColor: "#e7f1ff",
                                    color: "#0d6efd",
                                    padding: "8px",
                                    borderRadius: "10px",
                                    display: "flex",
                                }}
                            >
                                <ArrowLeftRight size={22} />
                            </div>
                            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1e293b", fontWeight: 700 }}>
                                Matriks Perbandingan Harga Pasar
                            </h2>
                        </div>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
                            Perbandingan selisih harga komoditas antar pasar pantauan utama Kabupaten Lamongan — data real-time dari survei lapangan.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            type="button"
                            onClick={fetchData}
                            title="Refresh data"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                backgroundColor: "#f1f5f9",
                                color: "#334155",
                                border: "none",
                                padding: "10px 14px",
                                borderRadius: "10px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={!data.length}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                backgroundColor: data.length ? "#0d6efd" : "#e2e8f0",
                                color: data.length ? "#ffffff" : "#94a3b8",
                                border: "none",
                                padding: "10px 16px",
                                borderRadius: "10px",
                                fontWeight: 600,
                                cursor: data.length ? "pointer" : "not-allowed",
                                transition: "background-color 0.2s",
                            }}
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* SUMMARY CARDS */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "18px",
                        marginBottom: "24px",
                        animation: "fadeIn 0.5s ease",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            padding: "20px",
                            borderRadius: "14px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>
                                Pasar Paling Kompetitif
                            </span>
                            <div style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "6px", borderRadius: "8px" }}>
                                <TrendingDown size={18} />
                            </div>
                        </div>
                        <h3 style={{ margin: "12px 0 4px 0", fontSize: "1.2rem", color: "#0f172a", minHeight: "29px" }}>
                            {loading ? (
                                <div style={{ height: "22px", width: "70%", borderRadius: "6px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
                            ) : summary ? summary.pasar_paling_kompetitif : "—"}
                        </h3>
                        <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 600 }}>
                            {summary ? `${summary.pct_komoditas_termurah}% Komoditas Termurah` : "—"}
                        </span>
                    </div>

                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            padding: "20px",
                            borderRadius: "14px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>
                                Rata-Rata Selisih Harga
                            </span>
                            <div style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "6px", borderRadius: "8px" }}>
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <h3 style={{ margin: "12px 0 4px 0", fontSize: "1.2rem", color: "#0f172a", minHeight: "29px" }}>
                            {loading ? (
                                <div style={{ height: "22px", width: "60%", borderRadius: "6px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
                            ) : summary ? formatRupiah(summary.rata_rata_selisih) : "—"}
                        </h3>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Antar pasar termahal & termurah</span>
                    </div>

                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            padding: "20px",
                            borderRadius: "14px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>
                                Total Komoditas Dipantau
                            </span>
                            <div style={{ backgroundColor: "#e0f2fe", color: "#075985", padding: "6px", borderRadius: "8px" }}>
                                <Store size={18} />
                            </div>
                        </div>
                        <h3 style={{ margin: "12px 0 4px 0", fontSize: "1.2rem", color: "#0f172a", minHeight: "29px" }}>
                            {loading ? (
                                <div style={{ height: "22px", width: "50%", borderRadius: "6px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
                            ) : `${summary?.total_komoditas ?? 0} Komoditas`}
                        </h3>
                        <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 600 }}>
                            {pasarList.length} Pasar Pantauan • Update Harian
                        </span>
                    </div>
                </div>

                {/* FILTER BAR */}
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        padding: "16px 20px",
                        borderRadius: "14px",
                        border: "1px solid #e2e8f0",
                        marginBottom: "20px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "14px",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: "1 1 300px" }}>
                        <Filter size={18} color="#64748b" />
                        <input
                            type="text"
                            placeholder="Cari nama komoditas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                outline: "none",
                                fontSize: "0.9rem",
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
                        {loading && kategoriList.length === 0
                            ? ["Semua", "..."].map((k) => (
                                <div
                                    key={k}
                                    style={{
                                        padding: "8px 20px",
                                        borderRadius: "20px",
                                        backgroundColor: "#e2e8f0",
                                        animation: "pulse 1.5s ease-in-out infinite",
                                        minWidth: "70px",
                                        height: "34px",
                                    }}
                                />
                            ))
                            : kategoriList.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className="cat-btn"
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: "20px",
                                        border: "none",
                                        backgroundColor: selectedCategory === cat ? "#0d6efd" : "#f1f5f9",
                                        color: selectedCategory === cat ? "#ffffff" : "#475569",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        transition: "background-color 0.2s, color 0.2s",
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                    </div>
                </div>

                {/* TABEL KOMPARASI */}
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                        overflow: "hidden",
                        animation: "fadeIn 0.5s ease",
                    }}
                >
                    {error && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "60px 20px",
                                gap: "12px",
                                color: "#dc2626",
                            }}
                        >
                            <AlertCircle size={40} />
                            <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
                            <button
                                onClick={fetchData}
                                style={{
                                    padding: "8px 20px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: "#fee2e2",
                                    color: "#dc2626",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Coba Lagi
                            </button>
                        </div>
                    )}

                    {!error && (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textWrap: "nowrap" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                        <th style={{ padding: "16px 20px", textAlign: "left", color: "#334155", fontWeight: 700, minWidth: "200px" }}>
                                            Komoditas
                                        </th>
                                        {pasarList.map((m) => (
                                            <th
                                                key={m}
                                                style={{ padding: "16px 20px", textAlign: "right", color: "#334155", fontWeight: 700 }}
                                            >
                                                {m}
                                            </th>
                                        ))}
                                        {loading && pasarList.length === 0 &&
                                            ["Pasar A", "Pasar B", "Pasar C"].map((p) => (
                                                <th key={p} style={{ padding: "16px 20px", textAlign: "right", color: "#334155", fontWeight: 700 }}>
                                                    <div style={{ height: "14px", width: "80px", borderRadius: "4px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
                                                </th>
                                            ))
                                        }
                                        <th style={{ padding: "16px 20px", textAlign: "center", color: "#334155", fontWeight: 700 }}>
                                            Rekomendasi Termurah
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading &&
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <SkeletonRow key={i} cols={colCount || 5} />
                                        ))}

                                    {!loading && data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={(pasarList.length || 3) + 2}
                                                style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}
                                            >
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                                    <Loader2 size={36} style={{ opacity: 0.3 }} />
                                                    <p style={{ margin: 0, fontWeight: 600 }}>
                                                        Belum ada data komparasi harga
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "0.85rem" }}>
                                                        Data muncul setelah petugas menginput survei harga yang diverifikasi dari beberapa pasar.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {!loading &&
                                        data.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="komparasi-row"
                                                style={{
                                                    borderBottom: "1px solid #f1f5f9",
                                                    transition: "background-color 0.15s",
                                                }}
                                            >
                                                <td style={{ padding: "16px 20px" }}>
                                                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{row.komoditas}</div>
                                                    <small style={{ color: "#94a3b8" }}>
                                                        {row.kategori} • per {row.satuan}
                                                    </small>
                                                </td>

                                                {pasarList.map((m) => {
                                                    const price = row.prices[m];
                                                    const isLowest = row.termurah === m;
                                                    const isHighest = row.termahal === m;
                                                    const noData = price == null;

                                                    return (
                                                        <td
                                                            key={m}
                                                            style={{
                                                                padding: "16px 20px",
                                                                textAlign: "right",
                                                                fontWeight: isLowest || isHighest ? "700" : "500",
                                                                backgroundColor: noData
                                                                    ? "transparent"
                                                                    : isLowest
                                                                    ? "#f0fdf4"
                                                                    : isHighest
                                                                    ? "#fef2f2"
                                                                    : "transparent",
                                                                color: noData
                                                                    ? "#cbd5e1"
                                                                    : isLowest
                                                                    ? "#15803d"
                                                                    : isHighest
                                                                    ? "#dc2626"
                                                                    : "#334155",
                                                            }}
                                                        >
                                                            {noData ? "—" : formatRupiah(price)}
                                                            {isLowest && !noData && (
                                                                <span
                                                                    style={{
                                                                        display: "block",
                                                                        fontSize: "0.7rem",
                                                                        color: "#16a34a",
                                                                        fontWeight: "600",
                                                                    }}
                                                                >
                                                                    Termurah
                                                                </span>
                                                            )}
                                                            {isHighest && !noData && (
                                                                <span
                                                                    style={{
                                                                        display: "block",
                                                                        fontSize: "0.7rem",
                                                                        color: "#dc2626",
                                                                        fontWeight: "600",
                                                                    }}
                                                                >
                                                                    Termahal
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            backgroundColor: "#dcfce7",
                                                            color: "#15803d",
                                                            padding: "6px 12px",
                                                            borderRadius: "20px",
                                                            fontSize: "0.825rem",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        {row.termurah}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div
                        style={{
                            padding: "14px 20px",
                            backgroundColor: "#f8fafc",
                            borderTop: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#64748b",
                            fontSize: "0.85rem",
                            flexWrap: "wrap",
                        }}
                    >
                        <Info size={16} />
                        <span>
                            Warna <strong style={{ color: "#16a34a" }}>Hijau</strong> = harga termurah,{" "}
                            <strong style={{ color: "#dc2626" }}>Merah</strong> = harga tertinggi.{" "}
                            Harga merupakan rata-rata dari data survei lapangan yang telah diverifikasi.
                            {!loading && data.length > 0 && (
                                <> Menampilkan <strong>{data.length}</strong> komoditas dari <strong>{pasarList.length}</strong> pasar.</>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
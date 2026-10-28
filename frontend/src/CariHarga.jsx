import React, { useState, useEffect } from "react";
import {
    Search,
    MapPin,
    X,
    ChevronDown,
    Circle,
    Loader2,
    SlidersHorizontal,
    ArrowRight
} from "lucide-react";

export default function CariHarga({ setActivePage, setSelectedKios }) {
    // State Filter & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPasar, setSelectedPasar] = useState("Semua Pasar Rakyat");
    const [selectedUrutan, setSelectedUrutan] = useState("Harga Termurah");
    const [selectedRadius, setSelectedRadius] = useState("< 1 km");

    // State Data Backend
    const [kiosList, setKiosList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Fungsi Fetch Data dari FastAPI Backend
    const fetchKiosData = async (overridePasar) => {
        setLoading(true);
        setError(null);
        try {
            const pasarToUse = overridePasar !== undefined ? overridePasar : selectedPasar;
            const params = new URLSearchParams();
            if (searchQuery.trim() !== "") {
                params.append("search", searchQuery.trim());
            }
            if (pasarToUse !== "Semua Pasar Rakyat") {
                params.append("lokasi", pasarToUse);
            }

            const baseUrl = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000";
            let response;
            try {
                response = await fetch(`${baseUrl}/kios?${params.toString()}`);
            } catch {
                response = await fetch(`http://localhost:8000/kios?${params.toString()}`);
            }

            if (!response.ok) {
                throw new Error("Gagal mengambil data dari server");
            }

            const result = await response.json();
            setKiosList(result.data || []);
            setCurrentPage(1);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKiosData();
    }, []);

    const handleTerapkanFilter = () => {
        fetchKiosData();
    };

    const handleDetailKios = (kiosData) => {
        if (setSelectedKios) setSelectedKios(kiosData);
        try {
            sessionStorage.setItem("epangan_selected_kios", JSON.stringify(kiosData));
        } catch {}
        if (setActivePage) setActivePage("detail-kios");
    };

    // Filter dan Urutkan Kios
    const sortedKiosList = React.useMemo(() => {
        let list = [...kiosList];
        if (selectedUrutan === "Harga Termurah") {
            list.sort((a, b) => (a.total_katalog || 0) - (b.total_katalog || 0) || a.id - b.id);
        } else if (selectedUrutan === "Harga Tertinggi") {
            list.sort((a, b) => (b.total_katalog || 0) - (a.total_katalog || 0) || b.id - a.id);
        } else if (selectedUrutan === "Jarak Terdekat") {
            list.sort((a, b) => a.id - b.id);
        }
        return list;
    }, [kiosList, selectedUrutan]);

    // Hitung Pagination
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

    return (
        <div style={{
            backgroundColor: "#f3f6f4",
            minHeight: "100vh",
            paddingBottom: "5rem",
            color: "#112216",
            fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
            {/* CONTAINER FULL WIDTH */}
            <div style={{ width: "100%", maxWidth: "1750px", margin: "0 auto", padding: "0 3rem", boxSizing: "border-box" }}>

                {/* HERO BANNER SECTION */}
                <div style={{ paddingTop: "2.5rem", paddingBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem", borderBottom: "1px solid #d8e2dc", marginBottom: "2rem" }}>
                    <div>
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "#e8f5e9",
                            padding: "6px 16px",
                            borderRadius: "99px",
                            marginBottom: "1rem",
                            border: "1px solid #b7efc5"
                        }}>
                            <Circle size={6} fill="#2d6a4f" color="#2d6a4f" />
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                DINAS KETAHANAN PANGAN DAN PERTANIAN LAMONGAN
                            </span>
                        </div>
                        <h1 style={{
                            fontSize: "2.6rem",
                            fontWeight: "800",
                            color: "#112216",
                            margin: 0,
                            letterSpacing: "-0.03em"
                        }}>
                            Direktori &amp; Pantau Harga Kios Pangan
                        </h1>
                    </div>
                    <p style={{ color: "#4a6550", margin: 0, fontSize: "1.05rem", maxWidth: "480px", lineHeight: "1.6" }}>
                        Akses data fluktuasi komoditas harian secara transparan langsung dari katalog pedagang pasar rakyat terdekat.
                    </p>
                </div>

                {/* SEARCH BAR & FILTER SECTION */}
                <div style={{
                    backgroundColor: "#ffffff",
                    padding: "16px 20px 16px 28px",
                    borderRadius: "9999px",
                    boxShadow: "0 12px 36px rgba(27, 67, 50, 0.09)",
                    display: "grid",
                    gridTemplateColumns: "1fr 240px 220px auto",
                    gap: "16px",
                    marginBottom: "2rem",
                    border: "1px solid #d8e2dc",
                    alignItems: "center"
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        paddingLeft: "8px"
                    }}>
                        <Search size={18} color="#4a6550" />
                        <input
                            type="text"
                            placeholder="Cari nama kios atau pemilik..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleTerapkanFilter()}
                            style={{
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                width: "100%",
                                fontSize: "15px",
                                color: "#112216",
                                fontWeight: "500"
                            }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#4a6550", display: "flex", padding: 0 }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div style={{ position: "relative", borderLeft: "1px solid #d8e2dc", paddingLeft: "16px" }}>
                        <select
                            value={selectedPasar}
                            onChange={(e) => setSelectedPasar(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 24px 8px 8px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: "transparent",
                                appearance: "none",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#112216",
                                outline: "none",
                                cursor: "pointer"
                            }}
                        >
                            <option value="Semua Pasar Rakyat">Semua Pasar Rakyat</option>
                            <option value="Pasar Babat">Pasar Babat</option>
                            <option value="Pasar Sidoharjo">Pasar Sidoharjo</option>
                            <option value="Pasar Mantup">Pasar Mantup</option>
                            <option value="Pasar Blimbing Brondong">Pasar Blimbing Brondong</option>
                            <option value="Pasar Sukodadi">Pasar Sukodadi</option>
                            <option value="Pasar Ngimbang">Pasar Ngimbang</option>
                        </select>
                        <ChevronDown size={16} color="#4a6550" style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>

                    <div style={{ position: "relative", borderLeft: "1px solid #d8e2dc", paddingLeft: "16px" }}>
                        <select
                            value={selectedUrutan}
                            onChange={(e) => setSelectedUrutan(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 24px 8px 8px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: "transparent",
                                appearance: "none",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#112216",
                                outline: "none",
                                cursor: "pointer"
                            }}
                        >
                            <option>Harga Termurah</option>
                            <option>Harga Tertinggi</option>
                            <option>Jarak Terdekat</option>
                        </select>
                        <ChevronDown size={16} color="#4a6550" style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>

                    <button
                        onClick={handleTerapkanFilter}
                        style={{
                            background: "linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)",
                            color: "white",
                            border: "none",
                            padding: "14px 30px",
                            borderRadius: "9999px",
                            fontWeight: "700",
                            cursor: "pointer",
                            fontSize: "14px",
                            whiteSpace: "nowrap",
                            boxShadow: "0 6px 16px rgba(45, 106, 79, 0.3)"
                        }}
                    >
                        Terapkan Filter
                    </button>
                </div>

                {/* BANNER STATS INFORMASI */}
                <div style={{
                    background: "linear-gradient(135deg, #0f2c1d 0%, #1b4332 50%, #2d6a4f 100%)",
                    color: "#ffffff",
                    padding: "24px 32px",
                    borderRadius: "28px",
                    marginBottom: "2.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1.5rem",
                    boxShadow: "0 12px 36px rgba(27, 67, 50, 0.15)"
                }}>
                    <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.06em", color: "#74c69d", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                            INFO STABILITAS HARGA
                        </span>
                        <h2 style={{ fontSize: "1.3rem", margin: 0, fontWeight: "800" }}>
                            Rata-Rata Komoditas Pokok Wilayah Babat &amp; Sekitarnya
                        </h2>
                    </div>
                    <div style={{ display: "flex", gap: "2rem" }}>
                        <div>
                            <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: "600" }}>RATA-RATA PASAR</div>
                            <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#b7efc5" }}>Rp13.150/kg</div>
                        </div>
                        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: "2rem" }}>
                            <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: "600" }}>HET NASIONAL</div>
                            <div style={{ fontSize: "1.2rem", fontWeight: "800" }}>Rp13.500/kg</div>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT GRID (SIDEBAR KIRI + LIST KIOS KANAN) */}
                <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "32px", alignItems: "start" }}>

                    {/* SIDEBAR FILTER KIRI */}
                    <aside style={{
                        backgroundColor: "#ffffff",
                        padding: "24px",
                        borderRadius: "28px",
                        border: "1px solid #d8e2dc",
                        boxShadow: "0 4px 20px rgba(27, 67, 50, 0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px"
                    }}>
                        {/* HEADER FILTER */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #d8e2dc", paddingBottom: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "15px", color: "#112216" }}>
                                <SlidersHorizontal size={16} color="#2d6a4f" />
                                <span>Filter Presisi</span>
                            </div>
                            <button
                                onClick={() => { setSearchQuery(""); setSelectedPasar("Semua Pasar Rakyat"); fetchKiosData(); }}
                                style={{ border: "none", background: "none", color: "#4a6550", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}
                            >
                                Reset
                            </button>
                        </div>

                        {/* RADIUS JARAK */}
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#4a6550", marginBottom: "10px", letterSpacing: "0.04em" }}>RADIUS JARAK</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                {["< 1 km", "3 km", "5 km", "> 10 km"].map((radius) => (
                                    <button
                                        key={radius}
                                        onClick={() => setSelectedRadius(radius)}
                                        style={{
                                            padding: "8px",
                                            borderRadius: "99px",
                                            border: selectedRadius === radius ? "1px solid #52b788" : "1px solid #d8e2dc",
                                            backgroundColor: selectedRadius === radius ? "#e8f5e9" : "#ffffff",
                                            color: selectedRadius === radius ? "#1b4332" : "#4a6550",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: selectedRadius === radius ? "800" : "600",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {radius}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* KIOS BINAAN RESMI */}
                        <div style={{
                            backgroundColor: "#e8f5e9",
                            border: "1px solid #b7efc5",
                            padding: "16px",
                            borderRadius: "18px",
                            fontSize: "12px",
                            color: "#1b4332",
                            lineHeight: "1.5"
                        }}>
                            <strong style={{ display: "block", marginBottom: "4px", fontWeight: "800", color: "#1b4332" }}>Kios Binaan Resmi</strong>
                            Telah bersertifikasi uji timbang &amp; pengawasan berkala DKPP Lamongan.
                        </div>

                        {/* SEBARAN HARGA PER PASAR (DITARUH DI SINI) */}
                        <div style={{
                            paddingTop: "16px",
                            borderTop: "1px solid #d8e2dc",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px"
                        }}>
                            <div>
                                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#112216", margin: "0 0 2px 0" }}>
                                    Sebaran Harga per Pasar
                                </h3>
                                <span style={{ fontSize: "12px", color: "#4a6550" }}>Pantauan rata-rata harian</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {[
                                    { nama: "Pasar Babat", harga: "Rp13.000", kios: "18 Kios Pantau", color: "#2d6a4f" },
                                    { nama: "Pasar Sidoharjo", harga: "Rp13.500", kios: "14 Kios Pantau", color: "#0d9488" },
                                    { nama: "Pasar Sukodadi", harga: "Rp13.400", kios: "9 Kios Pantau", color: "#64748b" },
                                    { nama: "Pasar Lamongan Kota", harga: "Rp14.000", kios: "7 Kios Pantau", color: "#e11d48" }
                                ].map((item) => {
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
                                                backgroundColor: isSelected ? "#eef8f2" : "#f4f8f5",
                                                borderRadius: "14px",
                                                border: isSelected ? "1.5px solid #2d6a4f" : "1px solid #d8e2dc",
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                                boxShadow: isSelected ? "0 4px 12px rgba(45,106,79,0.12)" : "none"
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: item.color }}></span>
                                                <span style={{ fontSize: "13px", fontWeight: "800", color: isSelected ? "#1b4332" : "#112216" }}>{item.nama}</span>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: "14px", fontWeight: "800", color: item.color }}>{item.harga}</div>
                                                <div style={{ fontSize: "10.5px", color: "#4a6550", fontWeight: "600" }}>{item.kios}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setActivePage && setActivePage("komparasi-pasar")}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    padding: "12px",
                                    backgroundColor: "#e8f5e9",
                                    border: "1px solid #b7efc5",
                                    borderRadius: "99px",
                                    fontSize: "13px",
                                    fontWeight: "800",
                                    color: "#1b4332",
                                    cursor: "pointer",
                                    marginTop: "4px",
                                    transition: "all 0.2s"
                                }}
                            >
                                <span>Buka Komparasi 16 Pasar</span>
                                <ArrowRight size={15} />
                            </button>
                        </div>
                    </aside>

                    {/* DAFTAR KIOS (GRID 2 KOLOM) */}
                    <section>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#112216" }}>Daftar Kios Terdekat</h2>
                            <span style={{ color: "#4a6550", fontSize: "13px", backgroundColor: "#ffffff", padding: "6px 16px", borderRadius: "99px", border: "1px solid #d8e2dc", fontWeight: "600" }}>
                                Ditemukan <strong style={{ color: "#2d6a4f" }}>{kiosList.length}</strong> kios
                            </span>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid #d8e2dc" }}>
                                <Loader2 className="animate-spin" size={32} color="#2d6a4f" style={{ margin: "0 auto 1rem auto" }} />
                                <p style={{ color: "#4a6550", margin: 0, fontSize: "14px" }}>Memuat data kios...</p>
                            </div>
                        ) : error ? (
                            <div style={{ textAlign: "center", padding: "2rem", backgroundColor: "#fef2f2", borderRadius: "28px", border: "1px solid #fecaca", color: "#991b1b" }}>
                                <p style={{ fontWeight: "700", margin: "0 0 0.5rem 0" }}>Gagal memuat data</p>
                                <p style={{ fontSize: "13px", margin: 0 }}>{error}</p>
                            </div>
                        ) : currentKiosList.length > 0 ? (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
                                    {currentKiosList.map((kios) => (
                                        <div key={kios.id} style={{
                                            backgroundColor: "#ffffff",
                                            borderRadius: "28px",
                                            border: "1px solid #d8e2dc",
                                            padding: "24px",
                                            boxShadow: "0 4px 20px rgba(27, 67, 50, 0.04)",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                            transition: "all 0.25s ease"
                                        }}>
                                            <div>
                                                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center" }}>
                                                    <span style={{
                                                        backgroundColor: "#e8f5e9",
                                                        color: "#1b4332",
                                                        border: "1px solid #b7efc5",
                                                        padding: "4px 10px",
                                                        borderRadius: "99px",
                                                        fontSize: "10px",
                                                        fontWeight: "800",
                                                        textTransform: "uppercase"
                                                    }}>
                                                        {kios.status_izin || "BERIZIN"}
                                                    </span>
                                                    {kios.is_active && (
                                                        <span style={{
                                                            backgroundColor: "#eef2ef",
                                                            color: "#2d6a4f",
                                                            padding: "4px 10px",
                                                            borderRadius: "99px",
                                                            fontSize: "10px",
                                                            fontWeight: "800",
                                                            textTransform: "uppercase"
                                                        }}>
                                                            Binaan DKPP
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.15rem", fontWeight: "800", color: "#112216" }}>
                                                    {kios.nama_kios}
                                                </h3>

                                                <div style={{ fontSize: "13px", color: "#4a6550", display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "12px", lineHeight: "1.5" }}>
                                                    <MapPin size={14} color="#2d6a4f" style={{ marginTop: "3px", flexShrink: 0 }} />
                                                    <span>{kios.alamat_lengkap}</span>
                                                </div>

                                                <div style={{ fontSize: "12px", color: "#4a6550", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "20px" }}>
                                                    <span>👤 Pemilik: <strong style={{ color: "#112216" }}>{kios.pemilik}</strong></span>
                                                    <span>🕒 Jam Buka: <strong style={{ color: "#112216" }}>{kios.jam_buka}</strong></span>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: "1px solid #d8e2dc", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <div style={{ fontSize: "10px", color: "#4a6550", fontWeight: "800", letterSpacing: "0.04em" }}>KATALOG</div>
                                                    <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#1b4332" }}>
                                                        {kios.total_katalog} <span style={{ fontSize: "12px", color: "#4a6550", fontWeight: "600" }}>Item</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDetailKios(kios)}
                                                    style={{
                                                        background: "linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)",
                                                        color: "#ffffff",
                                                        border: "none",
                                                        padding: "10px 22px",
                                                        borderRadius: "99px",
                                                        fontWeight: "700",
                                                        fontSize: "13px",
                                                        cursor: "pointer",
                                                        boxShadow: "0 4px 14px rgba(27, 67, 50, 0.2)"
                                                    }}
                                                >
                                                    Detail Kios
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* PAGINATION */}
                                {totalPages > 1 && (
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "2.5rem" }}>
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            style={{
                                                padding: "8px 16px",
                                                borderRadius: "99px",
                                                border: "1px solid #d8e2dc",
                                                backgroundColor: currentPage === 1 ? "#f4f6f5" : "#ffffff",
                                                color: currentPage === 1 ? "#9ca3af" : "#112216",
                                                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                                fontSize: "13px",
                                                fontWeight: "700"
                                            }}
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
                                                    fontWeight: "800"
                                                }}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            style={{
                                                padding: "8px 16px",
                                                borderRadius: "99px",
                                                border: "1px solid #d8e2dc",
                                                backgroundColor: currentPage === totalPages ? "#f4f6f5" : "#ffffff",
                                                color: currentPage === totalPages ? "#9ca3af" : "#112216",
                                                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                                fontSize: "13px",
                                                fontWeight: "700"
                                            }}
                                        >
                                            Selanjutnya
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "4rem 1rem", backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid #d8e2dc" }}>
                                <Search size={32} color="#9ca3af" style={{ margin: "0 auto 1rem auto" }} />
                                <h4 style={{ margin: "0 0 6px 0", color: "#112216", fontWeight: "800" }}>Kios tidak ditemukan</h4>
                                <p style={{ fontSize: "13px", color: "#4a6550", margin: 0 }}>Coba ubah kata kunci atau filter lokasi pasar.</p>
                            </div>
                        )}
                    </section>

                </div>
            </div>
        </div>
    );
}
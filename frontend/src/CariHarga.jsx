import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix icon Marker Leaflet di React / Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Helper Komponent untuk re-center/zoom peta secara halus
function MapRecenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 14, { duration: 1.2 });
        }
    }, [center, map]);
    return null;
}

export default function CariHarga({ onSelectKios, onNavigate }) {
    // State Data Backend & Filter
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMarket, setSelectedMarket] = useState("Semua Pasar");
    const [sortOrder, setSortOrder] = useState("Harga Termurah");
    const [selectedRadius, setSelectedRadius] = useState("< 1 km");
    const [selectedVarieties, setSelectedVarieties] = useState(["Medium IR 64"]);

    // State Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    // Koordinat Pusat & Reference Marker Peta
    const [mapCenter, setMapCenter] = useState([-7.1186, 112.4158]);
    const markerRefs = useRef({});

    // 1. FETCH DATA DARI BACKEND FASTAPI
    useEffect(() => {
        fetchStalls();
    }, []);

    const fetchStalls = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/kios");
            if (response.ok) {
                const data = await response.json();
                setStalls(data);
            } else {
                setFallbackData();
            }
        } catch (error) {
            console.warn("Backend tidak terhubung, menggunakan data dummy lokal:", error);
            setFallbackData();
        } finally {
            setLoading(false);
        }
    };

    // Data dummy lengkap dengan alamat detail & koordinat
    const setFallbackData = () => {
        setStalls([
            {
                id: 1,
                name: "Kios Bu Siti",
                market: "Pasar Babat, Los Beras Blok B-12",
                addressDetail: "Jl. Pasar Raya Babat No. 12, Sektor Tengah",
                price: 13000,
                hetDiff: "Rp1.000 di bawah HET",
                distanceVal: 0.8,
                distance: "0.8 km",
                time: "Buka s/d 16.30 WIB",
                isCheap: true,
                variety: "Medium IR 64",
                commodities: "Beras Medium IR 64 (Kemasan Curah & 5 kg)",
                badges: ["HARGA TERMURAH", "Binaan DKPP"],
                lat: -7.1132,
                lng: 112.1645
            },
            {
                id: 2,
                name: "Kios Berkah Tani",
                market: "Pasar Babat, Sektor Barat Blok A-05",
                addressDetail: "Jl. Raya Babat - Jombang No. 45",
                price: 13200,
                hetDiff: "Selisih +Rp200 dari termurah",
                distanceVal: 0.5,
                distance: "0.5 km (3 mnt jalan)",
                time: "Buka s/d 17.00 WIB",
                isCheap: false,
                variety: "Medium IR 64",
                commodities: "Medium Lokal Babat (Kemasan 10 kg & 25 kg)",
                badges: ["PALING DEKAT"],
                lat: -7.1145,
                lng: 112.1630
            },
            {
                id: 3,
                name: "Toko Barokah Abadi",
                market: "Pasar Sidoharjo, Blok C-02",
                addressDetail: "Jl. Simpang Sidoarjo No. 8, Lamongan Kota",
                price: 13500,
                hetDiff: "Sesuai Batas HET",
                distanceVal: 4.2,
                distance: "4.2 km (8 mnt mobil)",
                time: "Buka s/d 15.00 WIB",
                isCheap: false,
                variety: "Premium Mentik Wangi",
                commodities: "Beras Medium Super & Beras Ramos",
                badges: ["PASAR SIDOHARJO", "Binaan DKPP"],
                lat: -7.1260,
                lng: 112.4110
            },
            {
                id: 4,
                name: "Kios Rejeki Makmur",
                market: "Pasar Lamongan Kota, Area Timur",
                addressDetail: "Jl. Kyai H. Ahmad Dahlan No. 12",
                price: 14000,
                hetDiff: "Tertinggi di wilayah pantau",
                distanceVal: 8.5,
                distance: "8.5 km (16 mnt)",
                time: "Tutup pkl 14.00 WIB",
                isCheap: false,
                variety: "Rojolele Delanggu",
                commodities: "Beras Medium C4",
                badges: ["PASAR LAMONGAN KOTA"],
                lat: -7.1180,
                lng: 112.4180
            },
            {
                id: 5,
                name: "Kios Jaya Pangan",
                market: "Pasar Babat, Blok D-01",
                addressDetail: "Pintu Masuk Utama Pasar Babat, Kios No. 1",
                price: 13100,
                hetDiff: "Rp900 di bawah HET",
                distanceVal: 2.1,
                distance: "2.1 km",
                time: "Buka s/d 16.00 WIB",
                isCheap: false,
                variety: "Beras Bulog SPHP",
                commodities: "Beras Bulog SPHP Medium 5kg",
                badges: ["Binaan DKPP"],
                lat: -7.1120,
                lng: 112.1670
            }
        ]);
    };

    // Toggle Checkbox Varietas
    const handleVarietyChange = (varietyName) => {
        if (selectedVarieties.includes(varietyName)) {
            setSelectedVarieties(selectedVarieties.filter(v => v !== varietyName));
        } else {
            setSelectedVarieties([...selectedVarieties, varietyName]);
        }
        setCurrentPage(1);
    };

    // LOGIKA FILTER PRESISI SUNGGUHAN
    const filteredStalls = stalls.filter((stall) => {
        const matchesSearch = stall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stall.commodities.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesMarket = selectedMarket === "Semua Pasar" || stall.market.includes(selectedMarket);

        let matchesRadius = true;
        if (selectedRadius === "< 1 km") matchesRadius = stall.distanceVal <= 1.0;
        else if (selectedRadius === "3 km") matchesRadius = stall.distanceVal <= 3.0;
        else if (selectedRadius === "5 km") matchesRadius = stall.distanceVal <= 5.0;
        else if (selectedRadius === "> 10 km") matchesRadius = stall.distanceVal > 5.0;

        const matchesVariety = selectedVarieties.length === 0 || selectedVarieties.includes(stall.variety);

        return matchesSearch && matchesMarket && matchesRadius && matchesVariety;
    }).sort((a, b) => {
        if (sortOrder === "Harga Termurah") return a.price - b.price;
        if (sortOrder === "Jarak Terdekat") return a.distanceVal - b.distanceVal;
        return 0;
    });

    // LOGIKA PAGINATION
    const totalPages = Math.ceil(filteredStalls.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStalls = filteredStalls.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Pindah fokus peta saat pilihan pasar berubah
    const handleMarketChange = (market) => {
        setSelectedMarket(market);
        setCurrentPage(1);
        if (market === "Pasar Babat") setMapCenter([-7.1132, 112.1645]);
        else if (market === "Pasar Sidoharjo") setMapCenter([-7.1260, 112.4110]);
        else if (market === "Pasar Lamongan Kota") setMapCenter([-7.1180, 112.4180]);
        else setMapCenter([-7.1186, 112.4158]);
    };

    // Pindah ke detail kios
    const handleGoToDetail = (stall) => {
        if (onSelectKios) {
            onSelectKios(stall);
        }
        if (onNavigate) {
            onNavigate("detail-kios");
        }
    };

    return (
        <div style={{ backgroundColor: "#eef7f2", minHeight: "100vh", padding: "2rem 1.5rem", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto" }}>

                {/* HEADER SECTION */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", backgroundColor: "#ffffff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", color: "#166534", border: "1px solid #dcfce7", marginBottom: "0.75rem" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16a34a" }}></span>
                        SISTEM INFORMASI STABILITAS HARGA PANGAN DAERAH
                    </div>
                    <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#064e3b", margin: "0 0 0.5rem 0" }}>
                        Pantau & Bandingkan <span style={{ color: "#16a34a" }}>Harga Pangan Pokok</span> Terkini di Lamongan
                    </h1>
                    <p style={{ color: "#475569", fontSize: "0.9rem", margin: 0 }}>
                        Akses data fluktuasi komoditas harian dari enumerator resmi Dinas Ketahanan Pangan dan Pertanian (DKPP) Lamongan.
                    </p>
                </div>

                {/* TOP FILTER BAR */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: "1.25rem", border: "1px solid #f0fdf4" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: "0.75rem" }}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder="🔍 Cari komoditas atau kios..."
                            style={{ padding: "0.7rem 1rem", borderRadius: "10px", border: "1px solid #f1f5f9", backgroundColor: "#f8fafc", outline: "none", fontSize: "0.9rem" }}
                        />

                        <select
                            value={selectedMarket}
                            onChange={(e) => handleMarketChange(e.target.value)}
                            style={{ padding: "0.7rem", borderRadius: "10px", border: "1px solid #f1f5f9", backgroundColor: "#f8fafc", fontSize: "0.875rem", color: "#334155" }}
                        >
                            <option value="Semua Pasar">Semua Pasar Rakyat</option>
                            <option value="Pasar Babat">Pasar Babat (Terdekat)</option>
                            <option value="Pasar Sidoharjo">Pasar Sidoharjo</option>
                            <option value="Pasar Lamongan Kota">Pasar Lamongan Kota</option>
                        </select>

                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            style={{ padding: "0.7rem", borderRadius: "10px", border: "1px solid #f1f5f9", backgroundColor: "#f8fafc", fontSize: "0.875rem", color: "#334155" }}
                        >
                            <option value="Harga Termurah">Harga Termurah</option>
                            <option value="Jarak Terdekat">Jarak Terdekat</option>
                        </select>

                        <button
                            onClick={() => setCurrentPage(1)}
                            style={{ backgroundColor: "#064e3b", color: "#fff", border: "none", padding: "0.7rem 1.2rem", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
                        >
                            Terapkan
                        </button>
                    </div>
                </div>

                {/* BANNER PELUANG HEMAT */}
                <div style={{ backgroundColor: "#064e3b", color: "#fff", borderRadius: "20px", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <span style={{ backgroundColor: "#16a34a", color: "#ffffff", padding: "3px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "800" }}>
                            PELUANG HEMAT WARGA
                        </span>
                        <h3 style={{ margin: "6px 0 2px", fontSize: "1.15rem", fontWeight: "700" }}>
                            Hemat hingga <span style={{ color: "#4ade80" }}>Rp1.000 / kg</span> belanja di Pasar Babat
                        </h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#a7f3d0" }}>
                            Harga terendah Rp13.000 (Kios Bu Siti) vs tertinggi Rp14.000 (Pasar Kota).
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <div style={{ backgroundColor: "rgba(255,255,255,0.08)", padding: "0.6rem 1rem", borderRadius: "12px", textAlign: "right", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div style={{ fontSize: "0.65rem", color: "#a7f3d0" }}>RATA-RATA BABAT</div>
                            <strong style={{ fontSize: "1.05rem" }}>Rp13.150/kg</strong>
                        </div>
                        <div style={{ backgroundColor: "rgba(255,255,255,0.08)", padding: "0.6rem 1rem", borderRadius: "12px", textAlign: "right", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div style={{ fontSize: "0.65rem", color: "#a7f3d0" }}>HET NASIONAL</div>
                            <strong style={{ fontSize: "1.05rem" }}>Rp13.500/kg</strong>
                        </div>
                    </div>
                </div>

                {/* LAYOUT 3 KOLOM UTAMA */}
                <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 310px", gap: "1.25rem" }}>

                    {/* KOLOM KIRI: FILTER PRESISI */}
                    <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "20px", border: "1px solid #f0fdf4", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", height: "fit-content" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                            <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "800", color: "#064e3b" }}>
                                FILTER PRESISI
                            </h4>
                            <button
                                onClick={() => { setSelectedRadius("< 1 km"); setSelectedVarieties(["Medium IR 64"]); setCurrentPage(1); }}
                                style={{ border: "none", background: "none", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer" }}
                            >
                                Reset
                            </button>
                        </div>

                        {/* Radius Jarak */}
                        <div style={{ marginBottom: "1.25rem" }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.6rem" }}>RADIUS JARAK</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                                {["< 1 km", "3 km", "5 km", "> 10 km"].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => { setSelectedRadius(r); setCurrentPage(1); }}
                                        style={{
                                            padding: "0.45rem",
                                            borderRadius: "8px",
                                            border: "none",
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            backgroundColor: selectedRadius === r ? "#16a34a" : "#f8fafc",
                                            color: selectedRadius === r ? "#fff" : "#475569",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Varietas & Mutu Beras */}
                        <div style={{ marginBottom: "1.25rem" }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "0.6rem" }}>
                                VARIETAS & MUTU
                            </label>
                            {[
                                { name: "Medium IR 64", count: "24" },
                                { name: "Premium Mentik Wangi", count: "16" },
                                { name: "Rojolele Delanggu", count: "8" },
                                { name: "Beras Bulog SPHP", count: "12" }
                            ].map((v, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", fontSize: "0.8rem" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "#334155", fontWeight: "500" }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedVarieties.includes(v.name)}
                                            onChange={() => handleVarietyChange(v.name)}
                                            style={{ accentColor: "#16a34a" }}
                                        />
                                        {v.name}
                                    </label>
                                    <span style={{ fontSize: "0.7rem", color: "#94a3b8", backgroundColor: "#f1f5f9", padding: "1px 6px", borderRadius: "10px" }}>{v.count}</span>
                                </div>
                            ))}
                        </div>

                        {/* Banner Kios Binaan */}
                        <div style={{ backgroundColor: "#f0fdf4", padding: "0.85rem", borderRadius: "12px", border: "1px solid #dcfce7" }}>
                            <strong style={{ fontSize: "0.75rem", color: "#166534", display: "block", marginBottom: "2px" }}>Kios Binaan Resmi</strong>
                            <p style={{ fontSize: "0.7rem", color: "#15803d", margin: 0, lineHeight: "1.3" }}>Bersertifikasi uji timbang & pengawasan DKPP Lamongan.</p>
                        </div>
                    </div>

                    {/* KOLOM TENGAH: DAFTAR KIOS & PAGINATION */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#064e3b" }}>Daftar Kios Terdekat</h3>
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{filteredStalls.length} kios ditemukan</span>
                        </div>

                        {loading ? (
                            <p style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>Memuat data dari backend...</p>
                        ) : currentStalls.length === 0 ? (
                            <div style={{ backgroundColor: "#fff", padding: "2rem", borderRadius: "16px", textAlign: "center", color: "#64748b" }}>
                                Tidak ada kios yang cocok dengan kombinasi filter ini. Coba ubah atau reset filter.
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                {currentStalls.map((stall) => (
                                    <div
                                        key={stall.id}
                                        onClick={() => handleGoToDetail(stall)}
                                        style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: stall.isCheap ? "2px solid #22c55e" : "1px solid #f0fdf4", padding: "1.1rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)", cursor: "pointer" }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
                                                    {stall.badges && stall.badges.map((b, idx) => (
                                                        <span key={idx} style={{ backgroundColor: b.includes("TERMURAH") ? "#22c55e" : "#f1f5f9", color: b.includes("TERMURAH") ? "#fff" : "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "0.65rem", fontWeight: "800" }}>
                                                            {b}
                                                        </span>
                                                    ))}
                                                </div>
                                                <h4 style={{ margin: "2px 0 4px", fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>{stall.name}</h4>
                                                <p style={{ margin: "0 0 2px 0", fontSize: "0.8rem", color: "#1e293b", fontWeight: "600" }}>📍 {stall.market}</p>
                                                {stall.addressDetail && (
                                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>{stall.addressDetail}</p>
                                                )}
                                                <div style={{ display: "flex", gap: "0.8rem", marginTop: "6px", fontSize: "0.75rem", color: "#64748b" }}>
                                                    <span>🚴 {stall.distance}</span>
                                                    <span>🕒 {stall.time}</span>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: "right", minWidth: "120px" }}>
                                                <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Harga Terkini</span>
                                                <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#16a34a" }}>
                                                    Rp{stall.price?.toLocaleString("id-ID")}<span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "#64748b" }}>/kg</span>
                                                </div>
                                                <span style={{ fontSize: "0.7rem", color: stall.isCheap ? "#15803d" : "#64748b", fontWeight: "600" }}>{stall.hetDiff}</span>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: "1px solid #f8fafc", paddingTop: "0.65rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "0.75rem", color: "#475569" }}>Komoditas: <strong>{stall.commodities}</strong></span>
                                            <div style={{ display: "flex", gap: "0.4rem" }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleGoToDetail(stall);
                                                    }}
                                                    style={{ backgroundColor: "#16a34a", border: "none", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600", color: "#fff", cursor: "pointer" }}
                                                >
                                                    Detail Kios
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`https://www.google.com/maps/search/?api=1&query=${stall.lat},${stall.lng}`, '_blank');
                                                    }}
                                                    style={{ backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}
                                                >
                                                    Rute
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* PAGINATION INTERAKTIF */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 0.25rem 0", width: "100%" }}>
                            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                Halaman {currentPage} dari {totalPages} ({filteredStalls.length} Kios Terdata)
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{ border: "none", backgroundColor: "#e8effc", color: currentPage === 1 ? "#94a3b8" : "#475569", padding: "0.5rem 0.9rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "500", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                                >
                                    Sebelumnya
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handlePageChange(num)}
                                        style={{ border: "none", backgroundColor: currentPage === num ? "#064e3b" : "#e8effc", color: currentPage === num ? "#ffffff" : "#475569", padding: "0.5rem 0.8rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" }}
                                    >
                                        {num}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={{ border: "none", backgroundColor: currentPage === totalPages ? "#94a3b8" : "#475569", padding: "0.5rem 0.9rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "500", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* KOLOM KANAN: PETA INTERAKTIF SUNGGUHAN & SEBARAN HARGA */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "1.25rem", border: "1px solid #f0fdf4", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>Peta Sebaran Kios</h3>
                                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{filteredStalls.length} Kios Aktif Ditampilkan</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: "12px", fontSize: "0.65rem", fontWeight: "700", border: "1px solid #dcfce7" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e" }}></span>
                                    Live GPS
                                </div>
                            </div>

                            {/* PETA INTERAKTIF LEAFLET DENGAN POPUP ALAMAT KIOS */}
                            <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", height: "260px", marginBottom: "1.25rem", border: "1px solid #e2e8f0" }}>
                                <MapContainer center={mapCenter} zoom={11} style={{ height: "100%", width: "100%" }}>
                                    <MapRecenter center={mapCenter} />
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {filteredStalls.map((stall) => (
                                        stall.lat && stall.lng && (
                                            <Marker
                                                key={stall.id}
                                                position={[stall.lat, stall.lng]}
                                                ref={(el) => (markerRefs.current[stall.id] = el)}
                                            >
                                                <Popup minWidth={200}>
                                                    <div style={{ fontFamily: "sans-serif", fontSize: "0.8rem", padding: "2px" }}>
                                                        <div style={{ backgroundColor: stall.isCheap ? "#22c55e" : "#064e3b", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontSize: "0.65rem", fontWeight: "bold", display: "inline-block", marginBottom: "4px" }}>
                                                            {stall.isCheap ? "HARGA TERMURAH" : "KIOS MONITORING"}
                                                        </div>
                                                        <h5 style={{ margin: "2px 0 4px 0", fontSize: "0.95rem", color: "#0f172a" }}>{stall.name}</h5>
                                                        <p style={{ margin: "0 0 2px 0", fontWeight: "600", color: "#334155" }}>📍 {stall.market}</p>
                                                        {stall.addressDetail && (
                                                            <p style={{ margin: "0 0 6px 0", fontSize: "0.72rem", color: "#64748b" }}>{stall.addressDetail}</p>
                                                        )}
                                                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "4px", marginTop: "4px" }}>
                                                            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Harga Beras:</span><br />
                                                            <strong style={{ color: "#16a34a", fontSize: "1rem" }}>Rp{stall.price?.toLocaleString("id-ID")}/kg</strong>
                                                        </div>
                                                        <button
                                                            onClick={() => handleGoToDetail(stall)}
                                                            style={{ marginTop: "6px", width: "100%", backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "4px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}
                                                        >
                                                            Lihat Detail Kios &rarr;
                                                        </button>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )
                                    ))}
                                </MapContainer>
                            </div>

                            {/* Sebaran Harga per Pasar */}
                            <div>
                                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", fontWeight: "700", color: "#334155" }}>
                                    Sebaran Harga per Pasar
                                </h4>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                                    {[
                                        { name: "Pasar Babat", price: "Rp13.000", count: "18 Kios Pantau", color: "#16a34a", bg: "#f0fdf4" },
                                        { name: "Pasar Sidoharjo", price: "Rp13.500", count: "14 Kios Pantau", color: "#0284c7", bg: "#f0f9ff" },
                                        { name: "Pasar Sukodadi", price: "Rp13.400", count: "9 Kios Pantau", color: "#64748b", bg: "#f8fafc" },
                                        { name: "Pasar Lamongan Kota", price: "Rp14.000", count: "7 Kios Pantau", color: "#dc2626", bg: "#fef2f2" }
                                    ].map((item, idx) => (
                                        <div key={idx} style={{ backgroundColor: item.bg, padding: "0.55rem 0.75rem", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: item.color }}></span>
                                                <strong style={{ fontSize: "0.78rem", color: "#1e293b" }}>{item.name}</strong>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <strong style={{ display: "block", fontSize: "0.78rem", color: item.color }}>{item.price}</strong>
                                                <span style={{ fontSize: "0.62rem", color: "#94a3b8" }}>{item.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => alert("Membuka komparasi 16 pasar...")}
                                    style={{ width: "100%", backgroundColor: "#e8effc", color: "#2563eb", border: "none", padding: "0.65rem", borderRadius: "10px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Buka Komparasi 16 Pasar &rarr;
                                </button>
                            </div>

                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
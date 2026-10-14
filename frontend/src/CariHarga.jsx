import React, { useState, useEffect } from "react";
import {
    Search,
    MapPin,
    X,
    ChevronDown,
    Circle,
    Loader2
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

    // Fungsi Fetch Data dari FastAPI Backend
    const fetchKiosData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Susun query parameter sesuai endpoint FastAPI /kios
            const params = new URLSearchParams();
            if (searchQuery.trim() !== "") {
                params.append("search", searchQuery.trim());
            }
            if (selectedPasar !== "Semua Pasar Rakyat") {
                params.append("lokasi", selectedPasar);
            }

            const response = await fetch(`http://localhost:8000/kios?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Gagal mengambil data dari server");
            }

            const result = await response.json();
            setKiosList(result.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch pas pertama kali render atau saat tombol filter ditekan
    useEffect(() => {
        fetchKiosData();
    }, []);

    const handleTerapkanFilter = () => {
        fetchKiosData();
    };

    const handleDetailKios = (kiosData) => {
        if (setSelectedKios) setSelectedKios(kiosData);
        if (setActivePage) setActivePage("detail-kios");
    };

    return (
        <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "3rem" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>

                {/* HERO SECTION */}
                <div style={{ paddingTop: "2rem", paddingBottom: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                        <Circle size={8} fill="#15803d" color="#15803d" />
                        <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#15803d", letterSpacing: "0.05em" }}>
                            SISTEM INFORMASI STABILITAS HARGA PANGAN DAERAH
                        </span>
                    </div>
                    <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#1e293b", margin: "0 0 0.5rem 0", lineHeight: "1.2" }}>
                        Pantau & Bandingkan <span style={{ color: "#15803d" }}>Harga Pangan Pokok</span> Terkini di Lamongan
                    </h1>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
                        Akses data fluktuasi komoditas harian dari enumerator resmi Dinas Ketahanan Pangan dan Pertanian (DKPP) Lamongan.
                    </p>
                </div>

                {/* SEARCH BAR & FILTER DROPDOWN */}
                <div style={{
                    backgroundColor: "#ffffff",
                    padding: "0.75rem",
                    borderRadius: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.05)",
                    display: "grid",
                    gridTemplateColumns: "1fr 250px 220px auto",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                    border: "1px solid #f1f5f9"
                }}>
                    <div style={{ display: "flex", alignItems: "center", padding: "0 0.75rem", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Cari nama kios atau pemilik..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleTerapkanFilter()}
                            style={{ border: "none", outline: "none", background: "transparent", width: "100%", padding: "0.75rem", fontSize: "0.9rem", color: "#334155" }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div style={{ position: "relative" }}>
                        <select
                            value={selectedPasar}
                            onChange={(e) => setSelectedPasar(e.target.value)}
                            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", appearance: "none", fontSize: "0.9rem", color: "#475569", outline: "none" }}
                        >
                            <option value="Semua Pasar Rakyat">Semua Pasar Rakyat</option>
                            <option value="Pasar Babat">Pasar Babat</option>
                            <option value="Pasar Sidoharjo">Pasar Sidoharjo</option>
                            <option value="Pasar Sukodadi">Pasar Sukodadi</option>
                        </select>
                        <ChevronDown size={16} color="#94a3b8" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>

                    <div style={{ position: "relative" }}>
                        <select
                            value={selectedUrutan}
                            onChange={(e) => setSelectedUrutan(e.target.value)}
                            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", appearance: "none", fontSize: "0.9rem", color: "#475569", outline: "none" }}
                        >
                            <option>Harga Termurah</option>
                            <option>Harga Tertinggi</option>
                            <option>Jarak Terdekat</option>
                        </select>
                        <ChevronDown size={16} color="#94a3b8" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>

                    <button
                        onClick={handleTerapkanFilter}
                        style={{ backgroundColor: "#064e3b", color: "white", border: "none", padding: "0 1.5rem", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem", whiteSpace: "nowrap" }}
                    >
                        Terapkan
                    </button>
                </div>

                {/* BANNER INFORMASI HEMAT */}
                <div style={{ backgroundColor: "#276854", color: "#ffffff", padding: "1.5rem", borderRadius: "16px", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <span style={{ backgroundColor: "#10b981", color: "white", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", display: "inline-block", marginBottom: "0.75rem" }}>
                            PELUANG HEMAT WARGA
                        </span>
                        <h2 style={{ fontSize: "1.25rem", margin: "0 0 0.25rem 0", fontWeight: "700" }}>
                            Pantau Stabilitas Harga Komoditas di Pasar Lamongan
                        </h2>
                        <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.9 }}>
                            Data langsung tersambung dengan katalog pedagang dan pengawasan DKPP.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <div style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", padding: "0.75rem 1.25rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div style={{ fontSize: "0.7rem", opacity: 0.9, marginBottom: "0.25rem" }}>RATA-RATA BABAT</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>Rp13.150/kg</div>
                        </div>
                        <div style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", padding: "0.75rem 1.25rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div style={{ fontSize: "0.7rem", opacity: 0.9, marginBottom: "0.25rem" }}>HET NASIONAL</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>Rp13.500/kg</div>
                        </div>
                    </div>
                </div>

                {/* GRID CONTENT */}
                <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 320px", gap: "2rem" }}>

                    {/* SIDEBAR FILTER PRESISI */}
                    <aside style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: "fit-content", border: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h3 style={{ margin: 0, fontWeight: "700", fontSize: "0.95rem", color: "#0f172a" }}>FILTER PRESISI</h3>
                            <button onClick={() => { setSearchQuery(""); setSelectedPasar("Semua Pasar Rakyat"); fetchKiosData(); }} style={{ border: "none", background: "none", color: "#94a3b8", fontSize: "0.85rem", cursor: "pointer" }}>
                                Reset
                            </button>
                        </div>

                        <div style={{ marginBottom: "2rem" }}>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748b", marginBottom: "0.75rem" }}>RADIUS JARAK</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                {["< 1 km", "3 km", "5 km", "> 10 km"].map((radius) => (
                                    <button
                                        key={radius}
                                        onClick={() => setSelectedRadius(radius)}
                                        style={{
                                            padding: "0.5rem",
                                            borderRadius: "8px",
                                            border: selectedRadius === radius ? "none" : "1px solid #e2e8f0",
                                            backgroundColor: selectedRadius === radius ? "#16a34a" : "#ffffff",
                                            color: selectedRadius === radius ? "#ffffff" : "#475569",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            fontWeight: selectedRadius === radius ? "600" : "400"
                                        }}
                                    >
                                        {radius}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ backgroundColor: "#f0fdf4", padding: "1rem", borderRadius: "8px", fontSize: "0.75rem", color: "#166534", lineHeight: "1.4" }}>
                            <strong style={{ display: "block", marginBottom: "0.25rem" }}>Kios Binaan Resmi</strong>
                            Bersertifikasi uji timbang & pengawasan DKPP Lamongan.
                        </div>
                    </aside>

                    {/* DAFTAR KIOS DARI BACKEND */}
                    <section>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>Daftar Kios Terdekat</h2>
                            <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{kiosList.length} kios ditemukan</span>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "#ffffff", borderRadius: "16px" }}>
                                <Loader2 className="animate-spin" size={32} color="#16a34a" style={{ margin: "0 auto 1rem auto" }} />
                                <p style={{ color: "#64748b", margin: 0 }}>Mengambil data dari server...</p>
                            </div>
                        ) : error ? (
                            <div style={{ textAlign: "center", padding: "2rem", backgroundColor: "#fef2f2", borderRadius: "16px", color: "#991b1b" }}>
                                <p style={{ fontWeight: "bold", margin: "0 0 0.5rem 0" }}>Gagal memuat data</p>
                                <p style={{ fontSize: "0.85rem", margin: 0 }}>{error}</p>
                            </div>
                        ) : kiosList.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {kiosList.map((kios) => (
                                    <div key={kios.id} style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>

                                            <div>
                                                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                                    <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "700" }}>
                                                        {kios.status_izin || "BERIZIN"}
                                                    </span>
                                                    {kios.is_active && (
                                                        <span style={{ color: "#1d4ed8", fontSize: "0.7rem", fontWeight: "700", display: "flex", alignItems: "center" }}>
                                                            Binaan DKPP
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.15rem", fontWeight: "700", color: "#0f172a" }}>{kios.nama_kios}</h3>
                                                <div style={{ fontSize: "0.85rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem" }}>
                                                    <MapPin size={14} color="#ef4444" />
                                                    <span>{kios.alamat_lengkap}</span>
                                                </div>
                                                <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", gap: "0.75rem", marginTop: "0.4rem" }}>
                                                    <span>👤 {kios.pemilik}</span>
                                                    <span>🕒 {kios.jam_buka}</span>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.2rem" }}>TOTAL KATALOG</div>
                                                <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#16a34a" }}>
                                                    {kios.total_katalog} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "400" }}>Item</span>
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: kios.status_buka_sekarang ? "#15803d" : "#ef4444", fontWeight: "500", marginTop: "0.2rem" }}>
                                                    {kios.status_buka_sekarang ? "● Buka Sekarang" : "○ Tutup"}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                                                No. Telp: <strong>{kios.no_telepon}</strong>
                                            </div>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    onClick={() => handleDetailKios(kios)}
                                                    style={{ backgroundColor: "#16a34a", color: "#ffffff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "6px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
                                                >
                                                    Detail Kios
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "3rem 1rem", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                                <Search size={32} color="#cbd5e1" style={{ margin: "0 auto 1rem auto" }} />
                                <h4 style={{ margin: "0 0 0.5rem 0", color: "#334155" }}>Kios tidak ditemukan</h4>
                                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>Coba ganti kata kunci atau pilih pasar lain.</p>
                            </div>
                        )}
                    </section>

                    {/* SIDEBAR PETA & SEBARAN */}
                    <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                                <div>
                                    <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem", fontWeight: "700" }}>Peta Sebaran Kios</h3>
                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>{kiosList.length} Kios Ditampilkan</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#f0fdf4", padding: "0.2rem 0.5rem", borderRadius: "9999px" }}>
                                    <Circle size={8} fill="#16a34a" color="#16a34a" />
                                    <span style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: "600" }}>Live GPS</span>
                                </div>
                            </div>
                            <div style={{ width: "100%", height: "180px", backgroundColor: "#e2e8f0", borderRadius: "12px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <MapPin size={28} color="#16a34a" />
                            </div>
                        </div>
                    </aside>

                </div>
            </div>
        </div>
    );
}
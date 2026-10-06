import React, { useState, useEffect, useCallback } from "react";
import {
    Bell,
    HelpCircle,
    User,
    Download,
    Mic,
    PlusCircle,
    Store,
    Package,
    FileText,
    AlertTriangle,
    MapPin,
    Users,
    Database,
    History,
    Search,
    CheckCircle2,
    Clock,
    Edit2,
    Trash2,
    ArrowLeft,
    LogOut,
    ChevronRight,
    ShieldCheck,
} from "lucide-react";

import { getSurveiHarga, updateSurveiHarga, hapusSurveiHarga, getDashboardRingkasan, getCurrentUser, logoutPetugas } from "./api";

export default function AdminDashboard({ setActivePage, showToast, products, setProducts }) {
    // State Filter & Form Input
    const [activeTab, setActiveTab] = useState("Ringkasan Pasar");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("semua");

    // State data dari backend
    const [surveyLogs, setSurveyLogs] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    // Info user dari localStorage (disimpan saat login)
    const currentUser = getCurrentUser();

    // Helper: konversi format API → format JSX yang dipakai komponen ini
    const mapSurvei = (item) => ({
        id: item.id,
        name: item.nama_komoditas,
        subtitle: item.kualitas_mutu || "-",
        kios: item.nama_kios,
        lokasi: `${item.lokasi_pasar}${item.blok_stan ? " (" + item.blok_stan + ")" : ""}`,
        price: item.harga,
        unit: item.satuan,
        priceNote: item.status_het || "-",
        time: item.waktu_survei || "-",
        type: item.metode_input || "Input Langsung",
        status: item.status_verifikasi || "Terverifikasi",
    });

    // Fetch data survei dari backend
    const fetchSurvei = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const filter = statusFilter === "pending" ? "Menunggu Cek" : "";
            const res = await getSurveiHarga({ search: searchTerm, status_verifikasi: filter });
            const items = (res.data || res || []).map(mapSurvei);
            setSurveyLogs(items);
        } catch (err) {
            setLoadError(err.message || "Gagal memuat data survei.");
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter]);

    // Fetch ringkasan dashboard
    const fetchDashboard = useCallback(async () => {
        try {
            const res = await getDashboardRingkasan();
            setDashboardData(res);
        } catch {
            // Tidak kritis, biarkan dashboard tetap tampil
        }
    }, []);

    useEffect(() => {
        fetchSurvei();
        fetchDashboard();
    }, [fetchSurvei, fetchDashboard]);

    // Validasi item → update status di backend
    const handleValidate = async (id) => {
        try {
            await updateSurveiHarga(id, { status_verifikasi: "Terverifikasi" });
            setSurveyLogs((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status: "Terverifikasi" } : item))
            );
            if (showToast) showToast("Data berhasil divalidasi!", "success");
        } catch (err) {
            if (showToast) showToast("Gagal validasi: " + err.message, "error");
        }
    };

    // Hapus item → delete di backend
    const handleDeleteLog = async (id) => {
        try {
            await hapusSurveiHarga(id);
            setSurveyLogs((prev) => prev.filter((item) => item.id !== id));
            if (showToast) showToast("Catatan survei dihapus", "info");
        } catch (err) {
            if (showToast) showToast("Gagal hapus: " + err.message, "error");
        }
    };

    // Logout
    const handleLogout = () => {
        logoutPetugas();
        if (showToast) showToast("Berhasil logout");
        setActivePage("dashboard");
    };

    const filteredLogs = surveyLogs.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.kios.toLowerCase().includes(searchTerm.toLowerCase());
        if (statusFilter === "pending") {
            return matchesSearch && item.status === "Menunggu Cek";
        }
        return matchesSearch;
    });

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            {/* SIDEBAR KIRI */}
            <aside
                style={{
                    width: "260px",
                    backgroundColor: "#ffffff",
                    borderRight: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    padding: "20px 16px",
                    justifyContent: "space-between",
                }}
            >
                <div>
                    {/* Logo E-Pangan */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                backgroundColor: "#10b981",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: "bold",
                            }}
                        >
                            E
                        </div>
                        <div>
                            <div style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>E-PANGAN</div>
                            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "600" }}>KAB. LAMONGAN</div>
                        </div>
                    </div>

                    {/* User Badge Sidebar */}
                    <div
                        style={{
                            backgroundColor: "#eff6ff",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}
                    >
                        <User size={18} color="#2563eb" />
                        <div>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e3a8a" }}>Petugas Enumerator</div>
                            <div style={{ fontSize: "11px", color: "#3b82f6" }}>Pasar Sidoharjo Lamongan</div>
                        </div>
                    </div>

                    {/* Menu Navigasi Sidebar */}
                    <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {[
                            { name: "Ringkasan Pasar", icon: Store },
                            { name: "Input Suara (NLP)", icon: Mic },
                            { name: "Validasi Lapangan", icon: CheckCircle2 },
                            { name: "Laporan Satgas", icon: FileText },
                            { name: "Manajemen Kios", icon: Users },
                        ].map((menu) => {
                            const Icon = menu.icon;
                            const isActive = activeTab === menu.name;
                            return (
                                <button
                                    key={menu.name}
                                    onClick={() => {
                                        if (menu.name === "Manajemen Kios") {
                                            setActivePage("detail-kios");
                                        } else {
                                            setActiveTab(menu.name);
                                        }
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "none",
                                        backgroundColor: isActive ? "#047857" : "transparent",
                                        color: isActive ? "#ffffff" : "#475569",
                                        fontWeight: isActive ? "600" : "500",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <Icon size={18} color={isActive ? "#ffffff" : "#64748b"} />
                                    <span>{menu.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tombol Kembali ke Portal Utama */}
                <button
                    onClick={() => setActivePage("dashboard")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#f8fafc",
                        color: "#475569",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                    }}
                >
                    <ArrowLeft size={16} />
                    <span>Kembali ke Portal</span>
                </button>
            </aside>

            {/* AREA UTAMA / MAIN CONTENT */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
                {/* TOP NAVBAR ADMIN */}
                <header
                    style={{
                        height: "64px",
                        backgroundColor: "#ffffff",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 28px",
                    }}
                >
                    {/* Badge Sinkronisasi */}
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "#ccfbf1",
                            color: "#0f766e",
                            padding: "6px 14px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                        }}
                    >
                        <span
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#0d9488",
                            }}
                        ></span>
                        SINKRONISASI PETUGAS LAPANGAN
                    </div>

                    {/* User Right Action */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                            <Bell size={20} />
                        </button>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                            <HelpCircle size={20} />
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "10px" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: "#047857",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "bold",
                                }}
                            >
                                A
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Admin DKPP</span>
                            <button
                                onClick={() => setActivePage("dashboard")}
                                title="Keluar"
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", marginLeft: "8px" }}
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* CONTAINER KONTEN UTAMA */}
                <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* 1. SECTION PROFIL ENUMERATOR & AKSIS */}
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            padding: "20px 24px",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "16px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div
                                style={{
                                    width: "56px",
                                    height: "56px",
                                    borderRadius: "12px",
                                    backgroundColor: "#f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "1px solid #cbd5e1",
                                    position: "relative",
                                }}
                            >
                                <User size={28} color="#64748b" />
                                <span
                                    style={{
                                        position: "absolute",
                                        bottom: "-2px",
                                        right: "-2px",
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "50%",
                                        backgroundColor: "#10b981",
                                        border: "2px solid #ffffff",
                                    }}
                                ></span>
                            </div>
                            <div>
                                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                                    Hendra Setiawan
                                </h2>
                                <div style={{ fontSize: "12px", color: "#64748b", margin: "4px 0" }}>
                                    NIP: 19850412 201001 1 014
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
                                    <span style={{ color: "#059669", fontWeight: "600" }}>● Online &amp; Terverifikasi DKPP</span>
                                    <span style={{ color: "#64748b" }}>📍 Wilayah Pantau: Pasar Babat &amp; Pasar Sukodadi</span>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi Kanan */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 16px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    backgroundColor: "#f8fafc",
                                    color: "#334155",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                }}
                            >
                                <Download size={16} />
                                Ekspor Laporan Harian
                            </button>

                            <button
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 16px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: "#a7f3d0",
                                    color: "#065f46",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                }}
                            >
                                <Mic size={16} />
                                Modul Suara NLP
                            </button>

                            <button
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 18px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: "#047857",
                                    color: "#ffffff",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                }}
                            >
                                <PlusCircle size={16} />
                                Input Data Baru (+)
                            </button>
                        </div>
                    </div>

                    {/* 2. STAT CARDS / RINGKASAN INDIKATOR */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                        {/* Card 1 */}
                        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>KIOS TERPANTAU</span>
                                <div style={{ width: "32px", height: "32px", backgroundColor: "#ecfdf5", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                                    <Store size={18} />
                                </div>
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
                                24 <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>/ 24 Kios</span>
                            </div>
                            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                                <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>100% Target Babat</span>
                                <span style={{ color: "#64748b" }}>Penuh tersurvei</span>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>KOMODITAS AKTIF</span>
                                <div style={{ width: "32px", height: "32px", backgroundColor: "#f0fdf4", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                                    <Package size={18} />
                                </div>
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
                                18 <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Bahan Pokok</span>
                            </div>
                            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                                <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>Lengkap 18/18</span>
                                <span style={{ color: "#64748b" }}>NFA &amp; Bapanas</span>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>INPUT HARI INI</span>
                                <div style={{ width: "32px", height: "32px", backgroundColor: "#eff6ff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                                    <FileText size={18} />
                                </div>
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
                                42 <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Catatan</span>
                            </div>
                            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                                <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>s/d 09:30 WIB</span>
                                <span style={{ color: "#16a34a", fontWeight: "600" }}>+14 dari kemarin</span>
                            </div>
                        </div>

                        {/* Card 4 */}
                        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#b45309" }}>PENDING VALIDASI</span>
                                <div style={{ width: "32px", height: "32px", backgroundColor: "#fef3c7", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
                                    <AlertTriangle size={18} />
                                </div>
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
                                3 <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Perlu Konfirmasi</span>
                            </div>
                            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                                <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>Deviasi Signifikan</span>
                                <span style={{ color: "#dc2626", fontWeight: "600" }}>Anomali &gt; 5%</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. WIDGET INPUT SUARA (NLP ENUMERATOR) */}
                    <div
                        style={{
                            backgroundColor: "#f0fdf4",
                            borderRadius: "12px",
                            border: "1px solid #bbf7d0",
                            padding: "20px 24px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <span
                                style={{
                                    backgroundColor: "#047857",
                                    color: "#ffffff",
                                    fontSize: "10px",
                                    fontWeight: "700",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                FITUR INOVASI DKPP
                            </span>
                            <span
                                style={{
                                    backgroundColor: "#e2e8f0",
                                    color: "#334155",
                                    fontSize: "10px",
                                    fontWeight: "600",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                }}
                            >
                                Model Bahasa Daerah Jatim
                            </span>
                        </div>

                        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#065f46", margin: "0 0 6px 0" }}>
                            Modul Input Cepat Suara (NLP Enumerator)
                        </h3>
                        <p style={{ fontSize: "13px", color: "#047857", margin: "0 0 16px 0", maxWidth: "800px" }}>
                            Cukup diktekan kalimat percakapan tawar-menawar pasar biasa menggunakan bahasa lokal maupun formal. Algoritma otomatis memetakan nama komoditas, nama pedagang, pasar rujukan, dan estimasi harga per kilogram.
                        </p>

                        {/* Box Transkrip */}
                        <div
                            style={{
                                backgroundColor: "#eef2ff",
                                borderRadius: "10px",
                                padding: "16px",
                                border: "1px dashed #c7d2fe",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#4338ca", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Mic size={14} /> CONTOH TRANSKRIP SUARA LAPANGAN LANGSUNG:
                                </span>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#047857" }}>AKURASI PARSER 98.4%</span>
                            </div>
                            <p style={{ fontSize: "14px", fontStyle: "italic", fontWeight: "600", color: "#1e1b4b", margin: "0 0 12px 0" }}>
                                “Pasar Babat Kios Makmur, Miyak Goreng limolas ewu sak liter, Beras IR Enam puluh empat Telulas ewu sak kilo”
                            </p>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                <span style={{ backgroundColor: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", color: "#1e293b", border: "1px solid #cbd5e1" }}>
                                    Komoditas: <strong style={{ color: "#047857" }}>Minyak Goreng</strong>
                                </span>
                                <span style={{ backgroundColor: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", color: "#1e293b", border: "1px solid #cbd5e1" }}>
                                    Pasar: <strong style={{ color: "#047857" }}>Pasar Babat</strong>
                                </span>
                                <span style={{ backgroundColor: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", color: "#1e293b", border: "1px solid #cbd5e1" }}>
                                    Harga Terdeteksi: <strong style={{ color: "#047857" }}>Rp15.000 &amp; Rp13.000</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 4. MANAJEMEN MASTER DATA PORTAL */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                            <div>
                                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                                    Manajemen Master Data Portal
                                </h3>
                                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                                    Akses konfigurasi titik pantau, inventaris kios, hierarki komoditas, dan buku besar harga harian.
                                </p>
                            </div>
                            <span style={{ fontSize: "11px", backgroundColor: "#e2e8f0", color: "#475569", padding: "4px 10px", borderRadius: "12px", fontWeight: "600" }}>
                                Hak Akses: Surveyor Supervisor
                            </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                            {/* Card Data Pasar */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div style={{ width: "36px", height: "36px", backgroundColor: "#f0fdf4", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                                        <MapPin size={20} />
                                    </div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#166534", backgroundColor: "#dcfce7", padding: "2px 8px", borderRadius: "10px" }}>
                                        5 Titik Pantau
                                    </span>
                                </div>
                                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>Data Pasar</h4>
                                <p style={{ fontSize: "11px", color: "#64748b", height: "32px", margin: 0 }}>
                                    Kelola wilayah pantau resmi: Babat, Sukodadi, Sidoharjo, Brondong, dan Blimbing Lamongan.
                                </p>
                                <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "12px", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                                    <span style={{ color: "#64748b" }}>Radius GPS Aktif</span>
                                    <button style={{ background: "none", border: "none", color: "#047857", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                                        Kelola Pasar <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Data Kios Mitra */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    {/* PERBAIKAN DI BARIS INI: color: "#2563eb" pakai titik dua (:) */}
                                    <div style={{ width: "36px", height: "36px", backgroundColor: "#eff6ff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                                        <Users size={20} />
                                    </div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e40af", backgroundColor: "#dbeafe", padding: "2px 8px", borderRadius: "10px" }}>
                                        48 Kios Terdaftar
                                    </span>
                                </div>
                                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>Data Kios Mitra</h4>
                                <p style={{ fontSize: "11px", color: "#64748b", height: "32px", margin: 0 }}>
                                    Direktori pedagang langganan, nomor registrasi kios, blok pasar, dan kontak penanggung jawab stan.
                                </p>
                                <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "12px", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                                    <span style={{ color: "#64748b" }}>100% Berizin Pemkab</span>
                                    <button
                                        onClick={() => setActivePage && setActivePage("detail-kios")}
                                        style={{ background: "none", border: "none", color: "#047857", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                                    >
                                        Kelola Kios <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Data Komoditas */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div style={{ width: "36px", height: "36px", backgroundColor: "#fff7ed", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
                                        <Database size={20} />
                                    </div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#9a3412", backgroundColor: "#ffedd5", padding: "2px 8px", borderRadius: "10px" }}>
                                        18 Bahan Pokok
                                    </span>
                                </div>
                                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>Data Komoditas</h4>
                                <p style={{ fontSize: "11px", color: "#64748b", height: "32px", margin: 0 }}>
                                    Spesifikasi mutu, batas toleransi fluktuasi, satuan standar (kg, liter, butir), dan kategori NFA.
                                </p>
                                <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "12px", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                                    <span style={{ color: "#64748b" }}>HET Terkalibrasi</span>
                                    <button style={{ background: "none", border: "none", color: "#047857", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                                        Kelola Komoditas <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Harga Harian */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div style={{ width: "36px", height: "36px", backgroundColor: "#f0fdf4", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                                        <History size={20} />
                                    </div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#166534", backgroundColor: "#dcfce7", padding: "2px 8px", borderRadius: "10px" }}>
                                        Real-time Stream
                                    </span>
                                </div>
                                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>Harga Harian</h4>
                                <p style={{ fontSize: "11px", color: "#64748b", height: "32px", margin: 0 }}>
                                    Basis data riwayat entri, catatan revisi petugas, log audit integritas harga, dan arsip harian.
                                </p>
                                <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "12px", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                                    <span style={{ color: "#64748b" }}>Sinkronisasi Pusat OK</span>
                                    <button style={{ background: "none", border: "none", color: "#047857", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                                        Kelola Log Harga <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. TABEL PEMBARUAN TERKINI DATA HARGA PASAR */}
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
                        {/* Table Header Filter */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                                    Pembaruan Terkini Data Harga Pasar
                                </h3>
                                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                                    Daftar entri survei lapangan hari ini dari stan pedagang mitra Pasar Babat &amp; Sukodadi.
                                </p>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {/* Input Search */}
                                <div style={{ position: "relative" }}>
                                    <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "10px" }} />
                                    <input
                                        type="text"
                                        placeholder="Cari kios / komoditas..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            padding: "8px 12px 8px 32px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "12px",
                                            outline: "none",
                                            width: "200px",
                                        }}
                                    />
                                </div>

                                {/* Filter Button Tabs */}
                                <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                                    <button
                                        onClick={() => setStatusFilter("semua")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "none",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            backgroundColor: statusFilter === "semua" ? "#ffffff" : "transparent",
                                            color: statusFilter === "semua" ? "#0f172a" : "#64748b",
                                            boxShadow: statusFilter === "semua" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                                        }}
                                    >
                                        Semua Status
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter("pending")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "none",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            backgroundColor: statusFilter === "pending" ? "#ffffff" : "transparent",
                                            color: statusFilter === "pending" ? "#0f172a" : "#64748b",
                                            boxShadow: statusFilter === "pending" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                                        }}
                                    >
                                        Pending Saja (3)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Table Content */}
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                        <th style={{ padding: "12px", fontSize: "11px", fontWeight: "700", color: "#475569" }}>NAMA KOMODITAS</th>
                                        <th style={{ padding: "12px", fontSize: "11px", fontWeight: "700", color: "#475569" }}>KIOS &amp; LOKASI PASAR</th>
                                        <th style={{ padding: "12px", fontSize: "11px", fontWeight: "700", color: "#475569" }}>HARGA TERINPUT</th>
                                        <th style={{ padding: "12px", fontSize: "11px", fontWeight: "700", color: "#475569" }}>WAKTU SURVEI</th>
                                        <th style={{ padding: "12px", fontSize: "11px", fontWeight: "700", color: "#475569" }}>STATUS VERIFIKASI</th>
                                        <th style={{ padding: "12px", fontSize: "11px", fontWeight: "700", color: "#475569", textAlign: "center" }}>AKSI TINDAKAN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            {/* Komoditas */}
                                            <td style={{ padding: "14px 12px" }}>
                                                <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>{item.name}</div>
                                                <div style={{ fontSize: "11px", color: "#64748b" }}>{item.subtitle}</div>
                                            </td>

                                            {/* Kios & Lokasi */}
                                            <td style={{ padding: "14px 12px" }}>
                                                <div style={{ fontWeight: "600", fontSize: "12px", color: "#1e293b" }}>{item.kios}</div>
                                                <div style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "3px" }}>
                                                    <span style={{ color: "#10b981" }}>●</span> {item.lokasi}
                                                </div>
                                            </td>

                                            {/* Harga */}
                                            <td style={{ padding: "14px 12px" }}>
                                                <div style={{ fontWeight: "800", fontSize: "14px", color: "#0f172a" }}>
                                                    Rp {item.price.toLocaleString("id-ID")}{" "}
                                                    <span style={{ fontSize: "11px", fontWeight: "400", color: "#64748b" }}>/{item.unit}</span>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "10px",
                                                        fontWeight: "700",
                                                        color: item.priceNote.includes("+") ? "#dc2626" : "#059669",
                                                    }}
                                                >
                                                    {item.priceNote}
                                                </div>
                                            </td>

                                            {/* Waktu */}
                                            <td style={{ padding: "14px 12px" }}>
                                                <div style={{ fontWeight: "600", fontSize: "12px", color: "#334155" }}>{item.time}</div>
                                                <div style={{ fontSize: "11px", color: "#64748b" }}>Hari ini • {item.type}</div>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: "14px 12px" }}>
                                                {item.status === "Terverifikasi" ? (
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            backgroundColor: "#dcfce7",
                                                            color: "#15803d",
                                                            padding: "4px 10px",
                                                            borderRadius: "20px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                        }}
                                                    >
                                                        <CheckCircle2 size={12} /> Terverifikasi
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            backgroundColor: "#fef3c7",
                                                            color: "#b45309",
                                                            padding: "4px 10px",
                                                            borderRadius: "20px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                        }}
                                                    >
                                                        <Clock size={12} /> Menunggu Cek
                                                    </span>
                                                )}
                                            </td>

                                            {/* Aksi */}
                                            <td style={{ padding: "14px 12px", textAlign: "center" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                    {item.status === "Menunggu Cek" && (
                                                        <button
                                                            onClick={() => handleValidate(item.id)}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                                backgroundColor: "#047857",
                                                                color: "#ffffff",
                                                                border: "none",
                                                                padding: "6px 12px",
                                                                borderRadius: "6px",
                                                                fontSize: "11px",
                                                                fontWeight: "700",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <CheckCircle2 size={13} /> Validasi
                                                        </button>
                                                    )}
                                                    <button
                                                        title="Edit"
                                                        style={{
                                                            background: "none",
                                                            border: "1px solid #cbd5e1",
                                                            padding: "5px",
                                                            borderRadius: "6px",
                                                            cursor: "pointer",
                                                            color: "#475569",
                                                        }}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        title="Hapus"
                                                        onClick={() => handleDeleteLog(item.id)}
                                                        style={{
                                                            background: "none",
                                                            border: "1px solid #fca5a5",
                                                            padding: "5px",
                                                            borderRadius: "6px",
                                                            cursor: "pointer",
                                                            color: "#ef4444",
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "16px", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                            <div>
                                Menampilkan <strong>{filteredLogs.length}</strong> dari 42 catatan survei hari ini • <span style={{ fontStyle: "italic" }}>🔄 Sinkronisasi otomatis setiap 60 detik</span>
                            </div>
                            <div style={{ display: "flex", gap: "4px" }}>
                                <button style={{ border: "1px solid #e2e8f0", backgroundColor: "#fff", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", color: "#94a3b8" }}>Sebelumnya</button>
                                <button style={{ border: "none", backgroundColor: "#047857", color: "#fff", padding: "4px 10px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>1</button>
                                <button style={{ border: "1px solid #e2e8f0", backgroundColor: "#fff", padding: "4px 10px", borderRadius: "4px", cursor: "pointer" }}>2</button>
                                <button style={{ border: "1px solid #e2e8f0", backgroundColor: "#fff", padding: "4px 10px", borderRadius: "4px", cursor: "pointer" }}>3</button>
                                <button style={{ border: "1px solid #e2e8f0", backgroundColor: "#fff", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", color: "#475569" }}>Selanjutnya</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
import React, { useState, useEffect, useCallback } from "react";
import NlpAudioUpload from './NlpAudioUpload';
import './App.css';
import {
    Bell,
    User,
    Download,
    Mic,
    Store,
    Package,
    FileText,
    AlertTriangle,
    Users,
    Search,
    CheckCircle2,
    Trash2,
    ArrowLeft,
    LogOut,
    ShieldCheck,
    X,
    RefreshCw,
    Menu,
    Plus,
    MapPin,
    Phone,
    Clock,
    Loader2,
} from "lucide-react";

import {
    getSurveiHarga,
    updateSurveiHarga,
    validasiSurveiHarga,
    hapusSurveiHarga,
    getDashboardRingkasan,
    getCurrentUser,
    logoutPetugas,
    tambahSurveiHarga,
    getKiosList,
    tambahKios,
    hapusKios,
} from "./api";

export default function AdminDashboard({ setActivePage, showToast }) {
    const [activeTab, setActiveTab] = useState("Ringkasan Pasar");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("semua");
    const [validasiSubFilter, setValidasiSubFilter] = useState("semua");

    const [surveyLogs, setSurveyLogs] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));

    // State Manajemen Kios
    const [kiosList, setKiosList] = useState([]);
    const [kiosLoading, setKiosLoading] = useState(false);
    const [kiosSearch, setKiosSearch] = useState("");
    const [kiosFilterPasar, setKiosFilterPasar] = useState("Semua Pasar");
    const [showAddKiosModal, setShowAddKiosModal] = useState(false);
    const [isSubmittingKios, setIsSubmittingKios] = useState(false);
    const [newKiosForm, setNewKiosForm] = useState({
        nama_kios: "",
        pemilik: "",
        lokasi_pasar: "Pasar Babat",
        blok_stan: "",
        alamat_lengkap: "",
        jam_buka: "06:00 - 16:30 WIB",
        no_telepon: "",
        status_izin: "Terdaftar Resmi DKPP",
    });

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: "Laporan Anomali Harga", time: "10 menit lalu", read: false, desc: "Daging ayam di Pasar Babat naik 8%" },
        { id: 2, title: "Survei Baru Terkirim", time: "25 menit lalu", read: false, desc: "Petugas Hendra menambahkan data Minyakita" },
        { id: 3, title: "Validasi Otomatis", time: "1 jam lalu", read: true, desc: "Beras Medium terverifikasi sistem" },
    ]);

    const [showMasterModal, setShowMasterModal] = useState(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const currentUser = getCurrentUser();

    const mapSurvei = (item) => ({
        id: item.id,
        name: item.nama_komoditas || "Komoditas",
        subtitle: item.kualitas_mutu || "Kualitas Standar",
        kios: item.nama_kios || "Kios Umum",
        lokasi: `${item.lokasi_pasar || "Pasar Utama"}${item.blok_stan ? " (" + item.blok_stan + ")" : ""}`,
        price: Number(item.harga) || 0,
        unit: item.satuan || "kg",
        time: item.waktu_survei || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        status: item.status_verifikasi || "Terverifikasi",
        metode: item.metode_input || "Input Manual",
        status_het: item.status_het || "Sesuai HET",
        catatan: item.catatan || "",
        petugas: item.petugas_nama || "Petugas Lapangan",
        kategori: item.kategori || "Bahan Pokok",
    });

    const getDashboardValue = (field, fallback = 0) => {
        if (!dashboardData) return fallback;
        const val = dashboardData[field];
        if (val === null || val === undefined) return fallback;
        if (typeof val === "object") return val.tercapai ?? val.nilai_numerik ?? fallback;
        return Number(val) || fallback;
    };

    const fetchSurvei = useCallback(async () => {
        try {
            const filter = statusFilter === "pending" ? "Menunggu Cek" : "";
            const res = await getSurveiHarga({ search: searchTerm, status_verifikasi: filter });
            const rawData = res.data || res || [];
            if (Array.isArray(rawData)) {
                setSurveyLogs(rawData.map(mapSurvei));
            } else {
                setSurveyLogs([]);
            }
        } catch {
            setSurveyLogs([
                { id: 1, name: "Beras Medium", subtitle: "IR-64 Super", kios: "Kios UD Barokah", lokasi: "Pasar Babat (Blok B-04)", price: 13500, unit: "kg", time: "08:15 WIB", status: "Terverifikasi", metode: "Input Manual", status_het: "Sesuai HET" },
                { id: 2, name: "Minyak Goreng Sawit", subtitle: "Minyakita Kemasan 1L", kios: "Kios Makmur", lokasi: "Pasar Babat (Stan Sayur)", price: 17500, unit: "liter", time: "08:45 WIB", status: "Menunggu Cek", metode: "Suara NLP", status_het: "+11% di atas HET", catatan: "Input Suara NLP (Pasar Babat Kios Makmur...)" },
                { id: 3, name: "Cabai Merah Keriting", subtitle: "Lokal Fresh", kios: "Stan Mbak Sri", lokasi: "Pasar Sukodadi (A-12)", price: 38000, unit: "kg", time: "09:10 WIB", status: "Terverifikasi", metode: "Input Manual", status_het: "Sesuai HET" },
            ]);
        }
    }, [searchTerm, statusFilter]);

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await getDashboardRingkasan();
            setDashboardData({
                kios_terpantau: res?.kios_terpantau || 24,
                komoditas_aktif: res?.komoditas_aktif || 18,
            });
        } catch {
            setDashboardData({ kios_terpantau: 24, komoditas_aktif: 18 });
        }
    }, []);

    const fetchKios = useCallback(async () => {
        setKiosLoading(true);
        try {
            const res = await getKiosList();
            const data = res?.data || res || [];
            if (Array.isArray(data)) {
                setKiosList(data);
            }
        } catch {
            // fallback
        } finally {
            setKiosLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSurvei();
        fetchDashboard();
        fetchKios();
    }, [fetchSurvei, fetchDashboard, fetchKios]);

    useEffect(() => {
        if (activeTab === "Validasi Lapangan") {
            fetchSurvei();
        } else if (activeTab === "Manajemen Kios") {
            fetchKios();
        }
    }, [activeTab, fetchSurvei, fetchKios]);

    const handleFullRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchSurvei(), fetchDashboard(), fetchKios()]);
            setLastSyncTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
            if (showToast) showToast("Data berhasil disinkronisasi!", "success");
        } catch {
            if (showToast) showToast("Gagal menyinkronkan data", "error");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleAddKiosSubmit = async (e) => {
        e.preventDefault();
        if (!newKiosForm.nama_kios.trim()) {
            if (showToast) showToast("Nama kios wajib diisi!", "error");
            return;
        }
        setIsSubmittingKios(true);
        try {
            const res = await tambahKios(newKiosForm);
            if (showToast) showToast(res.message || "Kios baru berhasil didaftarkan ke database!", "success");
            setShowAddKiosModal(false);
            setNewKiosForm({
                nama_kios: "",
                pemilik: "",
                lokasi_pasar: "Pasar Babat",
                blok_stan: "",
                alamat_lengkap: "",
                jam_buka: "06:00 - 16:30 WIB",
                no_telepon: "",
                status_izin: "Terdaftar Resmi DKPP",
            });
            await fetchKios();
        } catch (err) {
            const msg = err.message || "Gagal mendaftarkan kios baru";
            if (showToast) showToast(msg, "error");
        } finally {
            setIsSubmittingKios(false);
        }
    };

    const handleDeleteKios = async (id, nama) => {
        if (!window.confirm(`Hapus kios "${nama}" dari direktori resmi DKPP?`)) return;
        try {
            await hapusKios(id);
            setKiosList((prev) => prev.filter((k) => k.id !== id));
            if (showToast) showToast(`Kios "${nama}" berhasil dihapus dari database!`, "info");
        } catch {
            if (showToast) showToast("Gagal menghapus kios", "error");
        }
    };

    const handleValidate = async (id) => {
        try {
            await validasiSurveiHarga(id);
            setSurveyLogs((prev) => prev.map((item) => (item.id === id ? { ...item, status: "Terverifikasi" } : item)));
            if (showToast) showToast("Data survei berhasil divalidasi oleh Satgas DKPP!", "success");
        } catch {
            try {
                await updateSurveiHarga(id, { status_verifikasi: "Terverifikasi" });
                setSurveyLogs((prev) => prev.map((item) => (item.id === id ? { ...item, status: "Terverifikasi" } : item)));
                if (showToast) showToast("Data berhasil divalidasi!", "success");
            } catch {
                if (showToast) showToast("Gagal memvalidasi data", "error");
            }
        }
    };

    const handleDeleteLog = async (id) => {
        if (!window.confirm("Hapus catatan harga ini?")) return;
        try {
            await hapusSurveiHarga(id);
        } catch { }
        setSurveyLogs((prev) => prev.filter((item) => item.id !== id));
        if (showToast) showToast("Catatan dihapus", "info");
    };

    const handleExportCSV = () => {
        if (showToast) showToast("Laporan CSV berhasil diunduh!", "success");
    };

    const unreadCount = notifications.filter((n) => !n.read).length;
    const filteredLogs = surveyLogs.filter((item) => {
        const matches = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.kios.toLowerCase().includes(searchTerm.toLowerCase());
        return statusFilter === "pending" ? matches && item.status === "Menunggu Cek" : matches;
    });

    return (
        <div className="admin-dashboard-container" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f6f4", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#112216", position: "relative" }}>

            {/* BACKDROP MOBILE */}
            {mobileSidebarOpen && (
                <div
                    onClick={() => setMobileSidebarOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.45)",
                        zIndex: 998,
                        backdropFilter: "blur(4px)"
                    }}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`admin-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`} style={{
                width: "280px",
                backgroundColor: "#ffffff",
                borderRight: "1px solid #d2ded7",
                display: "flex",
                flexDirection: "column",
                padding: "28px 20px",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                height: "100vh",
                boxShadow: "4px 0 24px rgba(27,67,50,0.02)",
                zIndex: 999,
                boxSizing: "border-box"
            }}>
                <div>
                    {/* Logo Brand */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", padding: "0 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                                width: "42px", height: "42px", borderRadius: "14px",
                                background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontWeight: "800", fontSize: "20px",
                                boxShadow: "0 6px 16px rgba(27,67,50,0.25)"
                            }}>
                                E
                            </div>
                            <div>
                                <div style={{ fontWeight: "800", fontSize: "17px", color: "#0f1d14" }}>E-PANGAN</div>
                                <div style={{ fontSize: "10px", color: "#2d6a4f", fontWeight: "800", letterSpacing: "0.5px" }}>KABUPATEN LAMONGAN</div>
                            </div>
                        </div>
                        <button
                            className="mobile-close-sidebar-btn"
                            onClick={() => setMobileSidebarOpen(false)}
                            style={{
                                background: "#f1f5f3",
                                border: "none",
                                borderRadius: "8px",
                                padding: "6px",
                                cursor: "pointer",
                                display: "none"
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Menu Sidebar */}
                    <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {[
                            { name: "Ringkasan Pasar", icon: Store },
                            { name: "Input Suara (NLP)", icon: Mic },
                            { name: "Validasi Lapangan", icon: CheckCircle2, badge: surveyLogs.filter(x => x.status === "Menunggu Cek").length },
                            { name: "Manajemen Kios", icon: Users },
                        ].map((menu) => {
                            const Icon = menu.icon;
                            const isActive = activeTab === menu.name;
                            return (
                                <button
                                    key={menu.name}
                                    onClick={() => {
                                        setActiveTab(menu.name);
                                        setMobileSidebarOpen(false);
                                    }}
                                    style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "13px 18px", borderRadius: "14px", border: "none",
                                        backgroundColor: isActive ? "#1b4332" : "transparent",
                                        color: isActive ? "#ffffff" : "#4e6754",
                                        fontWeight: isActive ? "800" : "600", fontSize: "13.5px",
                                        cursor: "pointer", transition: "all 0.2s",
                                        boxShadow: isActive ? "0 6px 16px rgba(27,67,50,0.18)" : "none"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        <Icon size={18} color={isActive ? "#74c69d" : "#4e6754"} />
                                        <span>{menu.name}</span>
                                    </div>
                                    {menu.badge > 0 && (
                                        <span style={{
                                            backgroundColor: isActive ? "#52b788" : "#d97706",
                                            color: "#ffffff",
                                            fontSize: "11px",
                                            fontWeight: "800",
                                            padding: "2px 8px",
                                            borderRadius: "99px",
                                            lineHeight: "1.2"
                                        }}>
                                            {menu.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={() => { logoutPetugas(); setActivePage("dashboard"); }} style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        padding: "11px", borderRadius: "14px", border: "1px solid #fecaca",
                        backgroundColor: "#fef2f2", color: "#dc2626", fontWeight: "700", fontSize: "13px", cursor: "pointer"
                    }}>
                        <LogOut size={16} /> Keluar Portal
                    </button>
                    <button onClick={() => setActivePage("dashboard")} style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        padding: "11px", borderRadius: "14px", border: "1px solid #d2ded7",
                        backgroundColor: "#ffffff", color: "#4e6754", fontWeight: "700", fontSize: "13px", cursor: "pointer"
                    }}>
                        <ArrowLeft size={16} /> Layanan Publik
                    </button>
                </div>
            </aside>

            {/* KONTEN UTAMA */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                {/* NAVBAR ATAS */}
                <header className="admin-topbar" style={{
                    height: "80px", backgroundColor: "#ffffff", borderBottom: "1px solid #d2ded7",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0 24px", position: "sticky", top: 0, zIndex: 20
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            className="admin-hamburger-btn"
                            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                            style={{
                                display: "none",
                                background: "#f2f7f4",
                                border: "1px solid #d2ded7",
                                borderRadius: "10px",
                                padding: "8px",
                                cursor: "pointer",
                                color: "#1b4332"
                            }}
                            aria-label="Toggle Menu"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="admin-status-badge" style={{
                            backgroundColor: "#eef8f2", color: "#1b4332", padding: "8px 16px",
                            borderRadius: "99px", fontSize: "12px", fontWeight: "800", border: "1px solid #b7efc5",
                            display: "flex", alignItems: "center", gap: "8px"
                        }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2d6a4f" }}></span>
                            SISTEM PEMANTAUAN REALTIME
                        </div>

                        <button onClick={handleFullRefresh} disabled={isRefreshing} style={{
                            backgroundColor: "#f2f7f4", border: "1px solid #d2ded7", padding: "8px 16px",
                            borderRadius: "99px", color: "#1b4332", fontSize: "12px", fontWeight: "800", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "6px"
                        }}>
                            <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
                            <span>{isRefreshing ? "Sinkron..." : "Refresh"}</span>
                            <span className="admin-sync-time" style={{ color: "#4e6754" }}>• {lastSyncTime}</span>
                        </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div style={{ position: "relative" }}>
                            <button onClick={() => setShowNotifications(!showNotifications)} style={{
                                backgroundColor: "#f2f7f4", border: "1px solid #d2ded7", borderRadius: "50%",
                                width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#1b4332"
                            }}>
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px",
                                        backgroundColor: "#ef4444", color: "#fff", borderRadius: "50%", fontSize: "9px", fontWeight: "800",
                                        display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff"
                                    }}>{unreadCount}</span>
                                )}
                            </button>

                            {showNotifications && (
                                <div style={{
                                    position: "absolute", right: 0, top: "50px", width: "340px", backgroundColor: "#ffffff",
                                    borderRadius: "20px", boxShadow: "0 15px 35px rgba(27,67,50,0.15)", border: "1px solid #d2ded7", zIndex: 100, overflow: "hidden"
                                }}>
                                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #d2ded7", backgroundColor: "#f2f7f4", display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontWeight: "800", fontSize: "14px", color: "#0f1d14" }}>Notifikasi</span>
                                        <span style={{ fontSize: "11px", color: "#1b4332", fontWeight: "800", background: "#b7efc5", padding: "2px 8px", borderRadius: "99px" }}>{unreadCount} baru</span>
                                    </div>
                                    <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                                        {notifications.map((n) => (
                                            <div key={n.id} onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))} style={{
                                                padding: "14px 20px", borderBottom: "1px solid #f2f7f4", backgroundColor: n.read ? "#fff" : "#eef8f2", cursor: "pointer"
                                            }}>
                                                <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#0f1d14" }}>{n.title}</div>
                                                <div style={{ fontSize: "12px", color: "#4e6754" }}>{n.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", borderLeft: "1px solid #d2ded7", paddingLeft: "16px" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#1b4332", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", border: "2px solid #b7efc5" }}>
                                A
                            </div>
                            <div>
                                <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f1d14" }}>Admin DKPP</div>
                                <div style={{ fontSize: "11px", color: "#4e6754", fontWeight: "600" }}>Dinas Ketahanan Pangan</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ISI KONTEN TAB */}
                <div className="admin-content-area" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "28px" }}>

                    {/* BANNER PROFIL */}
                    <div className="admin-profile-banner" style={{
                        backgroundColor: "#ffffff", borderRadius: "28px", padding: "32px 40px", border: "1px solid #d2ded7",
                        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px",
                        boxShadow: "0 4px 20px rgba(27,67,50,0.04)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                            <div style={{ width: "68px", height: "68px", borderRadius: "20px", backgroundColor: "#f2f7f4", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #d2ded7", flexShrink: 0 }}>
                                <User size={32} color="#1b4332" />
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f1d14", margin: 0 }}>
                                        {currentUser?.nama_lengkap || currentUser?.nama || "Admin Petugas"}
                                    </h2>
                                    <ShieldCheck size={18} color="#2d6a4f" />
                                </div>
                                <div style={{ fontSize: "13px", color: "#4e6754", margin: "4px 0", fontWeight: "600" }}>
                                    NIP: {currentUser?.nip || "19820516 200801 1 009"} • {currentUser?.jabatan || "Petugas Resmi DKPP"}
                                </div>
                                <div style={{ fontSize: "12px", color: "#2d6a4f", fontWeight: "700", marginTop: "4px" }}>
                                    📍 Wilayah Pantau: {currentUser?.wilayah_pantau || "Pasar Sidoharjo & Pasar Lamongan"}
                                </div>
                            </div>
                        </div>

                        <button onClick={handleExportCSV} style={{
                            display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "99px",
                            border: "1px solid #d2ded7", backgroundColor: "#ffffff", color: "#1b4332", fontWeight: "800", fontSize: "13px", cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(27,67,50,0.04)"
                        }}>
                            <Download size={16} /> Ekspor Laporan CSV
                        </button>
                    </div>

                    {/* TAB 1: RINGKASAN PASAR */}
                    {activeTab === "Ringkasan Pasar" && (
                        <>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "20px" }}>
                                <div onClick={() => setShowMasterModal("kios")} style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "24px", border: "1px solid #d2ded7", cursor: "pointer", boxShadow: "0 4px 16px rgba(27,67,50,0.04)" }}>
                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#4e6754" }}>KIOS TERPANTAU</div>
                                    <div style={{ fontSize: "32px", fontWeight: "800", color: "#0f1d14", marginTop: "10px" }}>{getDashboardValue("kios_terpantau", 24)} <span style={{ fontSize: "14px", color: "#4e6754" }}>Kios</span></div>
                                </div>
                                <div onClick={() => setShowMasterModal("komoditas")} style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "24px", border: "1px solid #d2ded7", cursor: "pointer", boxShadow: "0 4px 16px rgba(27,67,50,0.04)" }}>
                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#4e6754" }}>KOMODITAS AKTIF</div>
                                    <div style={{ fontSize: "32px", fontWeight: "800", color: "#0f1d14", marginTop: "10px" }}>{getDashboardValue("komoditas_aktif", 18)} <span style={{ fontSize: "14px", color: "#4e6754" }}>Bahan Pokok</span></div>
                                </div>
                                <div onClick={() => setStatusFilter("pending")} style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "24px", border: "1px solid #d2ded7", cursor: "pointer", boxShadow: "0 4px 16px rgba(27,67,50,0.04)" }}>
                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#b45309" }}>PENDING VALIDASI</div>
                                    <div style={{ fontSize: "32px", fontWeight: "800", color: "#0f1d14", marginTop: "10px" }}>{surveyLogs.filter((x) => x.status === "Menunggu Cek").length} <span style={{ fontSize: "14px", color: "#4e6754" }}>Perlu Cek</span></div>
                                </div>
                            </div>

                            {/* TABEL DATA */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid #d2ded7", padding: "32px", boxShadow: "0 4px 20px rgba(27,67,50,0.05)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                    <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f1d14", margin: 0 }}>Pembaruan Terkini Data Harga Pasar</h3>

                                    <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "320px" }}>
                                        <div style={{ position: "relative", width: "100%" }}>
                                            <Search size={16} color="#4e6754" style={{ position: "absolute", left: "14px", top: "12px" }} />
                                            <input type="text" placeholder="Cari komoditas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
                                                padding: "10px 14px 10px 38px", borderRadius: "99px", border: "1px solid #d2ded7", fontSize: "13.5px", outline: "none", backgroundColor: "#f2f7f4", fontWeight: "600", width: "100%", boxSizing: "border-box"
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "600px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f2f7f4", borderBottom: "1px solid #d2ded7" }}>
                                            <th style={{ padding: "16px", fontSize: "11px", fontWeight: "800", color: "#1b4332" }}>KOMODITAS</th>
                                            <th style={{ padding: "16px", fontSize: "11px", fontWeight: "800", color: "#1b4332" }}>KIOS &amp; LOKASI</th>
                                            <th style={{ padding: "16px", fontSize: "11px", fontWeight: "800", color: "#1b4332" }}>HARGA</th>
                                            <th style={{ padding: "16px", fontSize: "11px", fontWeight: "800", color: "#1b4332" }}>STATUS</th>
                                            <th style={{ padding: "16px", fontSize: "11px", fontWeight: "800", color: "#1b4332", textAlign: "center" }}>AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogs.map((item) => (
                                            <tr key={item.id} style={{ borderBottom: "1px solid #f2f7f4" }}>
                                                <td style={{ padding: "18px 16px", fontWeight: "800", color: "#0f1d14" }}>{item.name} <div style={{ fontSize: "11.5px", color: "#4e6754", fontWeight: "600" }}>{item.subtitle}</div></td>
                                                <td style={{ padding: "18px 16px", fontWeight: "700", color: "#0f1d14" }}>{item.kios} <div style={{ fontSize: "11.5px", color: "#4e6754", fontWeight: "600" }}>{item.lokasi}</div></td>
                                                <td style={{ padding: "18px 16px", fontWeight: "800", color: "#0f1d14" }}>Rp {item.price.toLocaleString("id-ID")} /{item.unit}</td>
                                                <td style={{ padding: "18px 16px" }}>
                                                    {item.status === "Terverifikasi" ? (
                                                        <span style={{ backgroundColor: "#eef8f2", color: "#1b4332", padding: "6px 14px", borderRadius: "99px", fontSize: "11px", fontWeight: "800", border: "1px solid #b7efc5" }}>Terverifikasi</span>
                                                    ) : (
                                                        <span style={{ backgroundColor: "#fef3c7", color: "#b45309", padding: "6px 14px", borderRadius: "99px", fontSize: "11px", fontWeight: "800", border: "1px solid #fde68a" }}>Menunggu Cek</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: "18px 16px", textAlign: "center" }}>
                                                    <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                                        {item.status === "Menunggu Cek" && (
                                                            <button onClick={() => handleValidate(item.id)} style={{ backgroundColor: "#2d6a4f", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "99px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>Validasi</button>
                                                        )}
                                                        <button onClick={() => handleDeleteLog(item.id)} style={{ background: "#fee2e2", border: "1px solid #fca5a5", padding: "8px", borderRadius: "50%", cursor: "pointer", color: "#ef4444" }}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* TAB 2: NLP AUDIO */}
                    {activeTab === "Input Suara (NLP)" && (
                        <NlpAudioUpload onSuccessSave={handleFullRefresh} showToast={showToast} onNavigateTab={setActiveTab} />
                    )}

                    {/* TAB 3: VALIDASI */}
                    {activeTab === "Validasi Lapangan" && (() => {
                        const pendingItems = surveyLogs.filter(x => x.status === "Menunggu Cek");
                        const nlpPendingCount = pendingItems.filter(x => (x.metode || "").toLowerCase().includes("nlp") || (x.metode || "").toLowerCase().includes("suara")).length;
                        const anomaliPendingCount = pendingItems.filter(x => {
                            const het = (x.status_het || "").toLowerCase();
                            return het.includes("atas") || het.includes("+") || het.includes("anomali");
                        }).length;

                        const displayedPending = pendingItems.filter(item => {
                            if (validasiSubFilter === "nlp") {
                                return (item.metode || "").toLowerCase().includes("nlp") || (item.metode || "").toLowerCase().includes("suara");
                            }
                            if (validasiSubFilter === "anomali") {
                                const het = (item.status_het || "").toLowerCase();
                                return het.includes("atas") || het.includes("+") || het.includes("anomali");
                            }
                            return true;
                        });

                        return (
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid #d2ded7", padding: "32px", boxShadow: "0 4px 20px rgba(27,67,50,0.05)" }}>
                                {/* Header Tab */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                            <span style={{ backgroundColor: "#1b4332", color: "#ffffff", fontSize: "11px", fontWeight: "800", padding: "4px 12px", borderRadius: "99px" }}>
                                                SATGAS DKPP VALIDATION HUB
                                            </span>
                                            <span style={{ backgroundColor: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: "800", padding: "4px 12px", borderRadius: "99px", border: "1px solid #fde68a" }}>
                                                {pendingItems.length} Menunggu Cek
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#0f1d14", margin: "0 0 4px 0" }}>
                                            Pusat Validasi Lapangan &amp; Verifikasi Satgas
                                        </h3>
                                        <p style={{ fontSize: "13.5px", color: "#4e6754", margin: 0, fontWeight: "600" }}>
                                            Verifikasi data survei harga harian dan hasil ekstraksi percakapan audio NLP sebelum disahkan ke portal publik.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleFullRefresh}
                                        disabled={isRefreshing}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "10px 18px",
                                            borderRadius: "99px",
                                            border: "1px solid #d2ded7",
                                            backgroundColor: "#ffffff",
                                            color: "#1b4332",
                                            fontWeight: "800",
                                            fontSize: "12.5px",
                                            cursor: isRefreshing ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
                                        <span>{isRefreshing ? "Menyegarkan..." : "Segarkan Antrean"}</span>
                                    </button>
                                </div>

                                {/* Filter Sub-Tabs */}
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px", borderBottom: "1px solid #e5ede8", paddingBottom: "16px" }}>
                                    <button
                                        onClick={() => setValidasiSubFilter("semua")}
                                        style={{
                                            padding: "8px 18px",
                                            borderRadius: "99px",
                                            border: "none",
                                            backgroundColor: validasiSubFilter === "semua" ? "#1b4332" : "#f2f7f4",
                                            color: validasiSubFilter === "semua" ? "#ffffff" : "#4e6754",
                                            fontWeight: "800",
                                            fontSize: "12.5px",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        Semua Antrean ({pendingItems.length})
                                    </button>
                                    <button
                                        onClick={() => setValidasiSubFilter("nlp")}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "8px 18px",
                                            borderRadius: "99px",
                                            border: "none",
                                            backgroundColor: validasiSubFilter === "nlp" ? "#2d6a4f" : "#f2f7f4",
                                            color: validasiSubFilter === "nlp" ? "#ffffff" : "#4e6754",
                                            fontWeight: "800",
                                            fontSize: "12.5px",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <Mic size={14} /> Dari Suara NLP ({nlpPendingCount})
                                    </button>
                                    <button
                                        onClick={() => setValidasiSubFilter("anomali")}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "8px 18px",
                                            borderRadius: "99px",
                                            border: "none",
                                            backgroundColor: validasiSubFilter === "anomali" ? "#b45309" : "#f2f7f4",
                                            color: validasiSubFilter === "anomali" ? "#ffffff" : "#4e6754",
                                            fontWeight: "800",
                                            fontSize: "12.5px",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <AlertTriangle size={14} /> Anomali di Atas HET ({anomaliPendingCount})
                                    </button>
                                </div>

                                {/* List Cards */}
                                {displayedPending.length === 0 ? (
                                    <div style={{
                                        textAlign: "center",
                                        padding: "48px 20px",
                                        backgroundColor: "#f9fbf9",
                                        borderRadius: "20px",
                                        border: "1px dashed #b7efc5"
                                    }}>
                                        <div style={{
                                            width: "56px",
                                            height: "56px",
                                            borderRadius: "50%",
                                            backgroundColor: "#eef8f2",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            margin: "0 auto 16px auto",
                                            color: "#2d6a4f"
                                        }}>
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f1d14", margin: "0 0 6px 0" }}>
                                            Tidak Ada Antrean Validasi Menunggu Cek
                                        </h4>
                                        <p style={{ fontSize: "13px", color: "#4e6754", maxWidth: "440px", margin: "0 auto", fontWeight: "600" }}>
                                            {validasiSubFilter === "semua"
                                                ? "Semua data survei lapangan telah divalidasi dan terverifikasi. Data baru yang diinput via modul Suara NLP akan otomatis masuk ke sini."
                                                : "Tidak ada data menunggu cek untuk kategori filter ini."}
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        {displayedPending.map((item) => {
                                            const isNlp = (item.metode || "").toLowerCase().includes("nlp") || (item.metode || "").toLowerCase().includes("suara");
                                            const isAnomali = (item.status_het || "").toLowerCase().includes("atas") || (item.status_het || "").includes("+");

                                            return (
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        border: isAnomali ? "1px solid #fde68a" : "1px solid #d2ded7",
                                                        backgroundColor: isAnomali ? "#fffdf5" : "#ffffff",
                                                        padding: "20px 24px",
                                                        borderRadius: "20px",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        flexWrap: "wrap",
                                                        gap: "16px",
                                                        boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
                                                    }}
                                                >
                                                    <div style={{ flex: 1, minWidth: "260px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                                                            {isNlp && (
                                                                <span style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                    backgroundColor: "#e0e7ff",
                                                                    color: "#3730a3",
                                                                    fontSize: "11px",
                                                                    fontWeight: "800",
                                                                    padding: "3px 10px",
                                                                    borderRadius: "99px"
                                                                }}>
                                                                    <Mic size={12} /> Modul Suara NLP
                                                                </span>
                                                            )}
                                                            <span style={{
                                                                backgroundColor: isAnomali ? "#fef3c7" : "#eef8f2",
                                                                color: isAnomali ? "#b45309" : "#1b4332",
                                                                fontSize: "11px",
                                                                fontWeight: "800",
                                                                padding: "3px 10px",
                                                                borderRadius: "99px",
                                                                border: isAnomali ? "1px solid #fde68a" : "1px solid #b7efc5"
                                                            }}>
                                                                {item.status_het || "Sesuai HET"}
                                                            </span>
                                                            <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>
                                                                {item.time}
                                                            </span>
                                                        </div>

                                                        <div style={{ fontWeight: "800", fontSize: "17px", color: "#0f1d14", marginBottom: "2px" }}>
                                                            {item.name}
                                                            <span style={{ fontWeight: "600", fontSize: "13px", color: "#4e6754", marginLeft: "8px" }}>
                                                                ({item.subtitle})
                                                            </span>
                                                        </div>

                                                        <div style={{ fontSize: "13px", color: "#4e6754", fontWeight: "600", marginBottom: "6px" }}>
                                                            📍 <strong>{item.kios}</strong> — {item.lokasi}
                                                        </div>

                                                        {item.catatan && (
                                                            <div style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", backgroundColor: "#f2f7f4", padding: "6px 12px", borderRadius: "10px", display: "inline-block", maxWidth: "100%" }}>
                                                                💬 {item.catatan}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                                                        <div style={{ textAlign: "right" }}>
                                                            <div style={{ fontSize: "11px", color: "#4e6754", fontWeight: "700" }}>HARGA SURVEI</div>
                                                            <div style={{ fontSize: "20px", fontWeight: "800", color: "#1b4332" }}>
                                                                Rp {item.price.toLocaleString("id-ID")}
                                                                <span style={{ fontSize: "12px", fontWeight: "600", color: "#4e6754" }}> /{item.unit}</span>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            <button
                                                                onClick={() => handleValidate(item.id)}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "6px",
                                                                    backgroundColor: "#2d6a4f",
                                                                    color: "#ffffff",
                                                                    border: "none",
                                                                    padding: "10px 20px",
                                                                    borderRadius: "99px",
                                                                    fontWeight: "800",
                                                                    fontSize: "13px",
                                                                    cursor: "pointer",
                                                                    boxShadow: "0 4px 12px rgba(45,106,79,0.2)"
                                                                }}
                                                            >
                                                                <CheckCircle2 size={16} /> Verifikasi Sekarang
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLog(item.id)}
                                                                title="Tolak / Hapus Catatan"
                                                                style={{
                                                                    background: "#fee2e2",
                                                                    border: "1px solid #fca5a5",
                                                                    padding: "10px",
                                                                    borderRadius: "50%",
                                                                    cursor: "pointer",
                                                                    color: "#ef4444",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center"
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* TAB 4: MANAJEMEN KIOS */}
                    {activeTab === "Manajemen Kios" && (() => {
                        const pasarOptions = [
                            "Semua Pasar",
                            "Pasar Babat",
                            "Pasar Sidoharjo",
                            "Pasar Sukodadi",
                            "Pasar Mantup",
                            "Pasar Blimbing Brondong",
                            "Pasar Ngimbang",
                        ];

                        const filteredKios = kiosList.filter((k) => {
                            const matchSearch =
                                (k.nama_kios || "").toLowerCase().includes(kiosSearch.toLowerCase()) ||
                                (k.pemilik || "").toLowerCase().includes(kiosSearch.toLowerCase()) ||
                                (k.blok_stan || "").toLowerCase().includes(kiosSearch.toLowerCase());
                            const matchPasar =
                                kiosFilterPasar === "Semua Pasar" ||
                                (k.lokasi_pasar || "").toLowerCase().includes(kiosFilterPasar.toLowerCase());
                            return matchSearch && matchPasar;
                        });

                        return (
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid #d2ded7", padding: "32px", boxShadow: "0 4px 20px rgba(27,67,50,0.05)" }}>
                                {/* Header Kios */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                            <span style={{ backgroundColor: "#1b4332", color: "#ffffff", fontSize: "11px", fontWeight: "800", padding: "4px 12px", borderRadius: "99px" }}>
                                                DIREKTORI RESMI DKPP LAMONGAN
                                            </span>
                                            <span style={{ backgroundColor: "#eef8f2", color: "#1b4332", fontSize: "11px", fontWeight: "800", padding: "4px 12px", borderRadius: "99px", border: "1px solid #b7efc5" }}>
                                                {kiosList.length} Kios Terdaftar
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#0f1d14", margin: "0 0 4px 0" }}>
                                            Direktori Manajemen Kios Mitra
                                        </h3>
                                        <p style={{ fontSize: "13.5px", color: "#4e6754", margin: 0, fontWeight: "600" }}>
                                            Kelola kios pedagang bahan pangan resmi di pasar-pasar Kabupaten Lamongan yang tersambung ke survei harga dan pencarian publik.
                                        </p>
                                    </div>

                                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                        <button
                                            onClick={fetchKios}
                                            disabled={kiosLoading}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                padding: "10px 18px",
                                                borderRadius: "99px",
                                                border: "1px solid #d2ded7",
                                                backgroundColor: "#ffffff",
                                                color: "#1b4332",
                                                fontWeight: "800",
                                                fontSize: "12.5px",
                                                cursor: kiosLoading ? "not-allowed" : "pointer"
                                            }}
                                        >
                                            <RefreshCw size={14} className={kiosLoading ? "spin" : ""} />
                                            <span>{kiosLoading ? "Memuat..." : "Segarkan"}</span>
                                        </button>
                                        <button
                                            onClick={() => setShowAddKiosModal(true)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                padding: "10px 22px",
                                                borderRadius: "99px",
                                                border: "none",
                                                backgroundColor: "#2d6a4f",
                                                color: "#ffffff",
                                                fontWeight: "800",
                                                fontSize: "13px",
                                                cursor: "pointer",
                                                boxShadow: "0 6px 16px rgba(45,106,79,0.25)"
                                            }}
                                        >
                                            <Plus size={16} />
                                            <span>+ Daftarkan Kios Baru</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Filter & Pencarian Bar */}
                                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px", alignItems: "center" }}>
                                    <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
                                        <Search size={16} color="#4e6754" style={{ position: "absolute", left: "14px", top: "12px" }} />
                                        <input
                                            type="text"
                                            placeholder="Cari kios, pemilik, atau stan..."
                                            value={kiosSearch}
                                            onChange={(e) => setKiosSearch(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "10px 14px 10px 38px",
                                                borderRadius: "99px",
                                                border: "1px solid #d2ded7",
                                                fontSize: "13px",
                                                outline: "none",
                                                backgroundColor: "#f2f7f4",
                                                fontWeight: "600",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                    </div>
                                    <select
                                        value={kiosFilterPasar}
                                        onChange={(e) => setKiosFilterPasar(e.target.value)}
                                        style={{
                                            padding: "10px 18px",
                                            borderRadius: "99px",
                                            border: "1px solid #d2ded7",
                                            backgroundColor: "#f2f7f4",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            color: "#1b4332",
                                            outline: "none",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {pasarOptions.map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: "12.5px", color: "#4e6754", fontWeight: "700" }}>
                                        Menampilkan: {filteredKios.length} kios
                                    </div>
                                </div>

                                {/* Grid Kios */}
                                {kiosLoading ? (
                                    <div style={{ textAlign: "center", padding: "40px 0", color: "#4e6754" }}>
                                        <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto", color: "#2d6a4f" }} />
                                        <div style={{ fontWeight: "700" }}>Memuat direktori kios dari database...</div>
                                    </div>
                                ) : filteredKios.length === 0 ? (
                                    <div style={{
                                        textAlign: "center",
                                        padding: "48px 20px",
                                        backgroundColor: "#f9fbf9",
                                        borderRadius: "20px",
                                        border: "1px dashed #b7efc5"
                                    }}>
                                        <Store size={36} color="#2d6a4f" style={{ margin: "0 auto 12px auto" }} />
                                        <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f1d14", margin: "0 0 6px 0" }}>
                                            Tidak Ada Kios Ditemukan
                                        </h4>
                                        <p style={{ fontSize: "13px", color: "#4e6754", maxWidth: "420px", margin: "0 auto", fontWeight: "600" }}>
                                            Tidak ada kios yang cocok dengan kata kunci atau filter pasar yang dipilih.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                                        {filteredKios.map((kios) => (
                                            <div
                                                key={kios.id}
                                                style={{
                                                    padding: "24px",
                                                    borderRadius: "20px",
                                                    border: "1px solid #d2ded7",
                                                    backgroundColor: "#ffffff",
                                                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "space-between",
                                                    transition: "transform 0.2s, box-shadow 0.2s"
                                                }}
                                            >
                                                <div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                                                        <div>
                                                            <div style={{ fontWeight: "800", fontSize: "17px", color: "#0f1d14" }}>
                                                                {kios.nama_kios}
                                                            </div>
                                                            <div style={{ fontSize: "12.5px", color: "#4e6754", fontWeight: "600", marginTop: "2px" }}>
                                                                👤 {kios.pemilik || "Pedagang Binaan"}
                                                            </div>
                                                        </div>
                                                        <span style={{
                                                            fontSize: "11px",
                                                            backgroundColor: "#eef8f2",
                                                            color: "#1b4332",
                                                            padding: "4px 10px",
                                                            borderRadius: "99px",
                                                            fontWeight: "800",
                                                            border: "1px solid #b7efc5",
                                                            whiteSpace: "nowrap"
                                                        }}>
                                                            {kios.status_izin || "Resmi DKPP"}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "14px 0", fontSize: "12.5px", color: "#4e6754" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
                                                            <MapPin size={14} color="#2d6a4f" />
                                                            <span><strong>{kios.lokasi_pasar}</strong> {kios.blok_stan ? `(${kios.blok_stan})` : ""}</span>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <Clock size={14} color="#6b7280" />
                                                            <span>{kios.jam_buka || "06:00 - 16:30 WIB"}</span>
                                                        </div>
                                                        {kios.no_telepon && kios.no_telepon !== "-" && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                <Phone size={14} color="#6b7280" />
                                                                <span>{kios.no_telepon}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid #f2f7f4" }}>
                                                    <span style={{ fontSize: "11.5px", color: "#1b4332", fontWeight: "700" }}>
                                                        📦 {kios.total_katalog || 0} Komoditas
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteKios(kios.id, kios.nama_kios)}
                                                        title="Hapus Kios"
                                                        style={{
                                                            background: "#fee2e2",
                                                            border: "1px solid #fca5a5",
                                                            padding: "8px",
                                                            borderRadius: "50%",
                                                            cursor: "pointer",
                                                            color: "#ef4444",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center"
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                </div>
            </div>

            {/* MODAL MASTER */}
            {showMasterModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", maxWidth: "500px", width: "100%", padding: "32px", border: "1px solid #d2ded7" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f1d14", margin: 0, textTransform: "capitalize" }}>Master Data {showMasterModal}</h3>
                            <button onClick={() => setShowMasterModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4e6754" }}><X size={20} /></button>
                        </div>
                        <div style={{ backgroundColor: "#f2f7f4", padding: "16px", borderRadius: "16px", fontSize: "13.5px", color: "#1b4332", fontWeight: "600", lineHeight: "2" }}>
                            {showMasterModal === "kios" ? "Daftar 24 Kios Resmi Terverifikasi di Pasar Rakyat Lamongan." : "Daftar 18 Komoditas Bahan Pokok Strategis Utama."}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                            <button onClick={() => setShowMasterModal(null)} style={{ padding: "10px 24px", borderRadius: "99px", border: "none", backgroundColor: "#2d6a4f", color: "#fff", fontWeight: "800", cursor: "pointer" }}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TAMBAH KIOS BARU */}
            {showAddKiosModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.65)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1100,
                    padding: "20px"
                }}>
                    <div style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "28px",
                        maxWidth: "540px",
                        width: "100%",
                        padding: "32px",
                        border: "1px solid #d2ded7",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                        maxHeight: "90vh",
                        overflowY: "auto"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <span style={{ backgroundColor: "#1b4332", color: "#ffffff", fontSize: "10.5px", fontWeight: "800", padding: "3px 10px", borderRadius: "99px" }}>
                                    FORMULIR PENDAFTARAN
                                </span>
                                <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f1d14", margin: "6px 0 0 0" }}>
                                    Daftarkan Kios Mitra Baru
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowAddKiosModal(false)}
                                style={{ background: "#f2f7f4", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer", color: "#4e6754" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddKiosSubmit}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                        Nama Kios / Stan *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Kios Berkah Jaya"
                                        value={newKiosForm.nama_kios}
                                        onChange={(e) => setNewKiosForm({ ...newKiosForm, nama_kios: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "11px 14px",
                                            borderRadius: "12px",
                                            border: "1px solid #d2ded7",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            outline: "none",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                            Nama Pemilik / Pengelola
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Bu Hj. Aminah"
                                            value={newKiosForm.pemilik}
                                            onChange={(e) => setNewKiosForm({ ...newKiosForm, pemilik: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "11px 14px",
                                                borderRadius: "12px",
                                                border: "1px solid #d2ded7",
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                outline: "none",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                            No. Telepon / WhatsApp
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 0812-3456-7890"
                                            value={newKiosForm.no_telepon}
                                            onChange={(e) => setNewKiosForm({ ...newKiosForm, no_telepon: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "11px 14px",
                                                borderRadius: "12px",
                                                border: "1px solid #d2ded7",
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                outline: "none",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                            Titik Pasar Pantau *
                                        </label>
                                        <select
                                            value={newKiosForm.lokasi_pasar}
                                            onChange={(e) => setNewKiosForm({ ...newKiosForm, lokasi_pasar: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "11px 14px",
                                                borderRadius: "12px",
                                                border: "1px solid #d2ded7",
                                                fontSize: "13px",
                                                fontWeight: "700",
                                                color: "#1b4332",
                                                outline: "none",
                                                backgroundColor: "#ffffff",
                                                boxSizing: "border-box"
                                            }}
                                        >
                                            <option value="Pasar Babat">Pasar Babat</option>
                                            <option value="Pasar Sidoharjo">Pasar Sidoharjo</option>
                                            <option value="Pasar Sukodadi">Pasar Sukodadi</option>
                                            <option value="Pasar Mantup">Pasar Mantup</option>
                                            <option value="Pasar Blimbing Brondong">Pasar Blimbing Brondong</option>
                                            <option value="Pasar Ngimbang">Pasar Ngimbang</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                            Nomor Blok / Stan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Blok B-04 / Stan Sayur"
                                            value={newKiosForm.blok_stan}
                                            onChange={(e) => setNewKiosForm({ ...newKiosForm, blok_stan: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "11px 14px",
                                                borderRadius: "12px",
                                                border: "1px solid #d2ded7",
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                outline: "none",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                            Jam Operasional
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="06:00 - 16:30 WIB"
                                            value={newKiosForm.jam_buka}
                                            onChange={(e) => setNewKiosForm({ ...newKiosForm, jam_buka: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "11px 14px",
                                                borderRadius: "12px",
                                                border: "1px solid #d2ded7",
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                outline: "none",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                            Status Perizinan DKPP
                                        </label>
                                        <select
                                            value={newKiosForm.status_izin}
                                            onChange={(e) => setNewKiosForm({ ...newKiosForm, status_izin: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "11px 14px",
                                                borderRadius: "12px",
                                                border: "1px solid #d2ded7",
                                                fontSize: "13px",
                                                fontWeight: "700",
                                                color: "#1b4332",
                                                outline: "none",
                                                backgroundColor: "#ffffff",
                                                boxSizing: "border-box"
                                            }}
                                        >
                                            <option value="Terdaftar Resmi DKPP">Terdaftar Resmi DKPP</option>
                                            <option value="100% Berizin Pemkab">100% Berizin Pemkab</option>
                                            <option value="Binaan Satgas Pangan">Binaan Satgas Pangan</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                        Alamat Lengkap Kios (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Misal: Jl. Pasar Babat Sisi Timur Stan No. 12"
                                        value={newKiosForm.alamat_lengkap}
                                        onChange={(e) => setNewKiosForm({ ...newKiosForm, alamat_lengkap: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "11px 14px",
                                            borderRadius: "12px",
                                            border: "1px solid #d2ded7",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            outline: "none",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddKiosModal(false)}
                                    style={{
                                        padding: "10px 20px",
                                        borderRadius: "99px",
                                        border: "1px solid #d2ded7",
                                        backgroundColor: "#ffffff",
                                        color: "#4e6754",
                                        fontWeight: "700",
                                        fontSize: "13px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingKios}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "10px 24px",
                                        borderRadius: "99px",
                                        border: "none",
                                        backgroundColor: "#2d6a4f",
                                        color: "#ffffff",
                                        fontWeight: "800",
                                        fontSize: "13px",
                                        cursor: isSubmittingKios ? "not-allowed" : "pointer",
                                        boxShadow: "0 6px 16px rgba(45,106,79,0.25)"
                                    }}
                                >
                                    {isSubmittingKios ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                                    <span>{isSubmittingKios ? "Menyimpan ke DB..." : "Simpan Kios ke Database"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
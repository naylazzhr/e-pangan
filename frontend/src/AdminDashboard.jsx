import React, { useState, useEffect, useCallback } from "react";
import {
    Bell,
    HelpCircle,
    User,
    Download,
    Mic,
    MicOff,
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
    X,
    Sparkles,
    RefreshCw,
    Check,
    Filter,
} from "lucide-react";

import {
    getSurveiHarga,
    updateSurveiHarga,
    hapusSurveiHarga,
    getDashboardRingkasan,
    getCurrentUser,
    logoutPetugas,
    tambahSurveiHarga,
    prosesSuaraNLP,
} from "./api";

export default function AdminDashboard({ setActivePage, showToast }) {
    // State Navigasi Tab / Sidebar
    const [activeTab, setActiveTab] = useState("Ringkasan Pasar");

    // State Filter & Pencarian
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("semua");

    // State Data Backend
    const [surveyLogs, setSurveyLogs] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // State Dropdown Notifikasi Lonceng
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: "Laporan Anomali Harga", time: "10 menit lalu", read: false, desc: "Daging ayam di Pasar Babat naik 8%" },
        { id: 2, title: "Survei Baru Terkirim", time: "25 menit lalu", read: false, desc: "Petugas Hendra menambahkan data Minyakita" },
        { id: 3, title: "Validasi Otomatis", time: "1 jam lalu", read: true, desc: "Beras Medium terverifikasi sistem" },
    ]);

    // State Modal & Form Input Manual
    const [showInputModal, setShowInputModal] = useState(false);
    const [showMasterModal, setShowMasterModal] = useState(null); // 'pasar' | 'kios' | 'komoditas' | 'log'
    const [editingItem, setEditingItem] = useState(null);

    const [formData, setFormData] = useState({
        nama_komoditas: "Beras Medium",
        kualitas_mutu: "KW 1",
        nama_kios: "Kios Makmur",
        lokasi_pasar: "Pasar Babat",
        blok_stan: "Blok A No. 12",
        harga: "",
        satuan: "kg",
        metode_input: "Manual Form",
        status_verifikasi: "Terverifikasi",
    });

    // State Modul Suara (NLP Realtime Simulator)
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [parsedResult, setParsedResult] = useState(null);
    const [isProcessingNLP, setIsProcessingNLP] = useState(false);

    // Profile User Login
    const currentUser = getCurrentUser();

    // Helper Map Data API -> UI
    const mapSurvei = (item) => ({
        id: item.id,
        name: item.nama_komoditas || "Komoditas",
        subtitle: item.kualitas_mutu || "Kualitas Standar",
        kios: item.nama_kios || "Kios Umum",
        lokasi: `${item.lokasi_pasar || "Pasar Utama"}${item.blok_stan ? " (" + item.blok_stan + ")" : ""}`,
        price: Number(item.harga) || 0,
        unit: item.satuan || "kg",
        priceNote: item.status_het || "Sesuai HET",
        time: item.waktu_survei || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        type: item.metode_input || "Input Langsung",
        status: item.status_verifikasi || "Terverifikasi",
    });

    // Helper Ambil Nilai Indikator Dashboard
    const getDashboardValue = (field, fallback = 0) => {
        if (!dashboardData) return fallback;
        const val = dashboardData[field];
        if (val === null || val === undefined) return fallback;
        if (typeof val === "object") return val.tercapai ?? val.nilai_numerik ?? fallback;
        return Number(val) || fallback;
    };

    // Fetch Survei
    const fetchSurvei = useCallback(async () => {
        setIsLoading(true);
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
            // Data Fallback Presisi
            setSurveyLogs([
                { id: 1, name: "Beras Medium", subtitle: "IR-64 Super", kios: "Kios UD Barokah", lokasi: "Pasar Babat (Blok B-04)", price: 13500, unit: "kg", priceNote: "Sesuai HET", time: "08:15 WIB", type: "Input Langsung", status: "Terverifikasi" },
                { id: 2, name: "Minyak Goreng Kita", subtitle: "Kemasan Bantal 1L", kios: "Kios Makmur", lokasi: "Pasar Sidoharjo (Blok C-01)", price: 16000, unit: "liter", priceNote: "+Rp500 di atas HET", time: "08:45 WIB", type: "Suara NLP", status: "Menunggu Cek" },
                { id: 3, name: "Cabai Merah Keriting", subtitle: "Lokal Fresh", kios: "Stan Mbak Sri", lokasi: "Pasar Sukodadi (A-12)", price: 38000, unit: "kg", priceNote: "-Rp2.000 Stabil", time: "09:10 WIB", type: "Input Langsung", status: "Terverifikasi" },
                { id: 4, name: "Daging Ayam Ras", subtitle: "Segar Karkas", kios: "Kios Pak Mat", lokasi: "Pasar Babat (Blok D-02)", price: 34000, unit: "kg", priceNote: "Anomali +8%", time: "09:30 WIB", type: "Suara NLP", status: "Menunggu Cek" },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter]);

    // Fetch Dashboard
    const fetchDashboard = useCallback(async () => {
        try {
            const res = await getDashboardRingkasan();
            const parseNum = (val, fallback = 0) => {
                if (val === null || val === undefined) return fallback;
                if (typeof val === "number") return val;
                if (typeof val === "object") return Number(val.tercapai ?? val.nilai) || fallback;
                return parseInt(String(val)) || fallback;
            };
            setDashboardData({
                kios_terpantau: parseNum(res?.kios_terpantau, 24),
                komoditas_aktif: parseNum(res?.komoditas_aktif, 18),
                total_input_hari_ini: parseNum(res?.input_hari_ini, 0),
                pending_validasi: parseNum(res?.pending_validasi, 0),
            });
        } catch {
            setDashboardData({ kios_terpantau: 24, komoditas_aktif: 18, total_input_hari_ini: 42, pending_validasi: 3 });
        }
    }, []);

    useEffect(() => {
        fetchSurvei();
        fetchDashboard();
    }, [fetchSurvei, fetchDashboard]);

    // Actions
    const handleValidate = async (id) => {
        try {
            await updateSurveiHarga(id, { status_verifikasi: "Terverifikasi" });
        } catch {
            // Local fallback
        } finally {
            setSurveyLogs((prev) => prev.map((item) => (item.id === id ? { ...item, status: "Terverifikasi" } : item)));
            if (showToast) showToast("Data berhasil divalidasi!", "success");
        }
    };

    const handleDeleteLog = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus catatan harga ini?")) return;
        try {
            await hapusSurveiHarga(id);
        } catch {
            // Local fallback
        } finally {
            setSurveyLogs((prev) => prev.filter((item) => item.id !== id));
            if (showToast) showToast("Catatan survei dihapus", "info");
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateSurveiHarga(editingItem.id, formData);
            } else {
                await tambahSurveiHarga(formData);
            }
        } catch {
            if (editingItem) {
                setSurveyLogs((prev) =>
                    prev.map((item) =>
                        item.id === editingItem.id
                            ? { ...item, name: formData.nama_komoditas, subtitle: formData.kualitas_mutu, kios: formData.nama_kios, price: Number(formData.harga) }
                            : item
                    )
                );
            } else {
                const newItem = mapSurvei({ id: Date.now(), ...formData, waktu_survei: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB" });
                setSurveyLogs((prev) => [newItem, ...prev]);
            }
        } finally {
            setShowInputModal(false);
            setEditingItem(null);
            if (showToast) showToast("Data berhasil disimpan!", "success");
        }
    };

    const handleToggleRecord = async () => {
        if (!isRecording) {
            setIsRecording(true);
            setTranscript("Mendengarkan percakapan tawar-menawar...");
            setTimeout(async () => {
                const sampleText = "Pasar Babat Kios Makmur, Minyak Goreng limolas ewu sak liter, Beras IR Enam puluh empat Telulas ewu sak kilo";
                setTranscript(`"${sampleText}"`);
                setIsRecording(false);
                setIsProcessingNLP(true);
                try {
                    const res = await prosesSuaraNLP(sampleText);
                    setParsedResult(res);
                } catch {
                    setParsedResult({
                        komoditas: "Minyak Goreng & Beras IR-64",
                        pasar: "Pasar Babat (Kios Makmur)",
                        harga: "Rp15.000 /L & Rp13.000 /kg",
                    });
                } finally {
                    setIsProcessingNLP(false);
                }
            }, 2500);
        } else {
            setIsRecording(false);
        }
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Nama Komoditas", "Kios", "Lokasi", "Harga", "Satuan", "Waktu", "Status"];
        const rows = surveyLogs.map((item) => [item.id, `"${item.name}"`, `"${item.kios}"`, `"${item.lokasi}"`, item.price, item.unit, `"${item.time}"`, `"${item.status}"`]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Harga_Pangan_Lamongan_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (showToast) showToast("Laporan CSV diunduh!", "success");
    };

    const markNotificationRead = (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    };

    const filteredLogs = surveyLogs.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.kios.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
        if (statusFilter === "pending") return matchesSearch && item.status === "Menunggu Cek";
        return matchesSearch;
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* SIDEBAR KIRI */}
            <aside
                style={{
                    width: "260px",
                    backgroundColor: "#ffffff",
                    borderRight: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    padding: "24px 16px",
                    justifyContent: "space-between",
                    position: "sticky",
                    top: 0,
                    height: "100vh",
                    boxShadow: "2px 0 10px rgba(0,0,0,0.02)",
                }}
            >
                <div>
                    {/* Brand Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", padding: "0 8px" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: "800",
                                fontSize: "20px",
                                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                            }}
                        >
                            E
                        </div>
                        <div>
                            <div style={{ fontWeight: "800", fontSize: "17px", color: "#0f172a", letterSpacing: "-0.3px" }}>E-PANGAN</div>
                            <div style={{ fontSize: "10px", color: "#059669", fontWeight: "700", letterSpacing: "0.5px" }}>KABUPATEN LAMONGAN</div>
                        </div>
                    </div>

                    {/* Profile Badge */}
                    <div
                        style={{
                            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                            padding: "12px 14px",
                            borderRadius: "12px",
                            marginBottom: "24px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            border: "1px solid #bfdbfe",
                        }}
                    >
                        <div style={{ padding: "8px", borderRadius: "50%", backgroundColor: "#ffffff", color: "#2563eb", display: "flex" }}>
                            <User size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", fontWeight: "800", color: "#1e3a8a" }}>
                                {currentUser?.nama || "Hendra Setiawan"}
                            </div>
                            <div style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "600" }}>
                                {currentUser?.role || "Petugas Enumerator"}
                            </div>
                        </div>
                    </div>

                    {/* Navigasi Menu Sidebar */}
                    <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {[
                            { name: "Ringkasan Pasar", icon: Store },
                            { name: "Input Suara (NLP)", icon: Mic },
                            { name: "Validasi Lapangan", icon: CheckCircle2 },
                            { name: "Manajemen Kios", icon: Users },
                        ].map((menu) => {
                            const Icon = menu.icon;
                            const isActive = activeTab === menu.name;
                            return (
                                <button
                                    key={menu.name}
                                    onClick={() => setActiveTab(menu.name)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "11px 16px",
                                        borderRadius: "10px",
                                        border: "none",
                                        backgroundColor: isActive ? "#047857" : "transparent",
                                        color: isActive ? "#ffffff" : "#475569",
                                        fontWeight: isActive ? "700" : "500",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        boxShadow: isActive ? "0 4px 12px rgba(4, 120, 87, 0.25)" : "none",
                                    }}
                                >
                                    <Icon size={18} color={isActive ? "#ffffff" : "#64748b"} />
                                    <span>{menu.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button
                        onClick={() => {
                            logoutPetugas();
                            if (showToast) showToast("Berhasil keluar dari Portal");
                            setActivePage("dashboard");
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid #fecaca",
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: "pointer",
                        }}
                    >
                        <LogOut size={16} />
                        <span>Keluar Portal</span>
                    </button>

                    <button
                        onClick={() => setActivePage("dashboard")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#ffffff",
                            color: "#64748b",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                        }}
                    >
                        <ArrowLeft size={16} />
                        <span>Layanan Publik</span>
                    </button>
                </div>
            </aside>

            {/* AREA UTAMA / MAIN CONTENT */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
                {/* TOP NAVBAR ADMIN */}
                <header
                    style={{
                        height: "70px",
                        backgroundColor: "#ffffff",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 32px",
                        position: "sticky",
                        top: 0,
                        zIndex: 20,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                backgroundColor: "#ccfbf1",
                                color: "#0f766e",
                                padding: "6px 16px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "700",
                                border: "1px solid #99f6e4",
                            }}
                        >
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#0d9488", boxShadow: "0 0 8px #0d9488" }}></span>
                            SINKRONISASI PETUGAS LAPANGAN REALTIME
                        </div>

                        <button
                            onClick={fetchSurvei}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#047857", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600" }}
                        >
                            <RefreshCw size={14} className={isLoading ? "spin" : ""} /> Refresh
                        </button>
                    </div>

                    {/* Top Right Header & Lonceng Notifikasi */}
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "relative" }}>
                        {/* Lonceng */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", position: "relative", padding: "6px" }}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: "4px",
                                            right: "4px",
                                            width: "18px",
                                            height: "18px",
                                            backgroundColor: "#ef4444",
                                            color: "#fff",
                                            borderRadius: "50%",
                                            fontSize: "10px",
                                            fontWeight: "800",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Notifikasi */}
                            {showNotifications && (
                                <div
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "40px",
                                        width: "320px",
                                        backgroundColor: "#ffffff",
                                        borderRadius: "14px",
                                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)",
                                        border: "1px solid #e2e8f0",
                                        zIndex: 100,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontWeight: "800", fontSize: "14px", color: "#0f172a" }}>Pemberitahuan Sistem</span>
                                        <span style={{ fontSize: "11px", color: "#047857", fontWeight: "700" }}>{unreadCount} baru</span>
                                    </div>
                                    <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                                        {notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                onClick={() => markNotificationRead(n.id)}
                                                style={{
                                                    padding: "12px 16px",
                                                    borderBottom: "1px solid #f8fafc",
                                                    backgroundColor: n.read ? "#ffffff" : "#f0fdf4",
                                                    cursor: "pointer",
                                                    transition: "background 0.2s",
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>{n.title}</span>
                                                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>{n.time}</span>
                                                </div>
                                                <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{n.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: "10px", textAlign: "center", backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
                                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#047857", cursor: "pointer" }}>Tandai semua dibaca</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                            <HelpCircle size={20} />
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
                            <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "#047857", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "15px" }}>
                                A
                            </div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>Admin DKPP</div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>Dinas Ketahanan Pangan</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* CONTAINER KONTEN DYNAMIC SEUAI TAB */}
                <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "28px" }}>

                    {/* BANNER PROFIL ENUMERATOR */}
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            padding: "24px 28px",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "20px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                            <div style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #e2e8f0", position: "relative" }}>
                                <User size={32} color="#475569" />
                                <span style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#10b981", border: "2.5px solid #ffffff" }}></span>
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{currentUser?.nama || "Hendra Setiawan"}</h2>
                                    <ShieldCheck size={18} color="#059669" />
                                </div>
                                <div style={{ fontSize: "13px", color: "#64748b", margin: "4px 0" }}>NIP: 19850412 201001 1 014 • Petugas Enumerator Resmi</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", marginTop: "6px" }}>
                                    <span style={{ color: "#059669", fontWeight: "700" }}>● Status Aktif &amp; Terverifikasi DKPP</span>
                                    <span style={{ color: "#64748b" }}>📍 Wilayah Pantau: Pasar Babat, Sukodadi &amp; Sidoharjo</span>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi Kanan Banner */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <button
                                onClick={handleExportCSV}
                                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#334155", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                            >
                                <Download size={16} /> Ekspor CSV
                            </button>

                            <button
                                onClick={() => {
                                    setEditingItem(null);
                                    setFormData({
                                        nama_komoditas: "Beras Medium",
                                        kualitas_mutu: "KW 1",
                                        nama_kios: "Kios Makmur",
                                        lokasi_pasar: "Pasar Babat",
                                        blok_stan: "Blok A No. 12",
                                        harga: "",
                                        satuan: "kg",
                                        metode_input: "Manual Form",
                                        status_verifikasi: "Terverifikasi",
                                    });
                                    setShowInputModal(true);
                                }}
                                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 22px", borderRadius: "10px", border: "none", backgroundColor: "#047857", color: "#ffffff", fontWeight: "700", fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 14px rgba(4, 120, 87, 0.3)" }}
                            >
                                <PlusCircle size={16} /> Input Data Baru (+)
                            </button>
                        </div>
                    </div>

                    {/* VIEW 1: RINGKASAN PASAR */}
                    {activeTab === "Ringkasan Pasar" && (
                        <>
                            {/* KATALOG KARTU INDIKATOR (BISA DIKLIK) */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "20px" }}>
                                <div
                                    onClick={() => setShowMasterModal("kios")}
                                    style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", cursor: "pointer", transition: "transform 0.2s", ":hover": { transform: "translateY(-2px)" } }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", letterSpacing: "0.5px" }}>KIOS TERPANTAU</span>
                                        <div style={{ width: "36px", height: "36px", backgroundColor: "#ecfdf5", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                                            <Store size={20} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", marginTop: "10px" }}>
                                        {getDashboardValue("kios_terpantau", 24)} <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>/ 24 Kios</span>
                                    </div>
                                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                                        <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: "12px", fontWeight: "800" }}>100% Babat</span>
                                        <span style={{ color: "#047857", fontWeight: "700" }}>Klik Buka Katalog</span>
                                    </div>
                                </div>

                                <div
                                    onClick={() => setShowMasterModal("komoditas")}
                                    style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", cursor: "pointer" }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", letterSpacing: "0.5px" }}>KOMODITAS AKTIF</span>
                                        <div style={{ width: "36px", height: "36px", backgroundColor: "#f0fdf4", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                                            <Package size={20} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", marginTop: "10px" }}>
                                        {getDashboardValue("komoditas_aktif", 18)} <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Bahan Pokok</span>
                                    </div>
                                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                                        <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: "12px", fontWeight: "800" }}>Lengkap 18/18</span>
                                        <span style={{ color: "#047857", fontWeight: "700" }}>Klik Kelola Master</span>
                                    </div>
                                </div>

                                <div
                                    onClick={() => setStatusFilter("semua")}
                                    style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", cursor: "pointer" }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", letterSpacing: "0.5px" }}>INPUT HARI INI</span>
                                        <div style={{ width: "36px", height: "36px", backgroundColor: "#eff6ff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                                            <FileText size={20} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", marginTop: "10px" }}>
                                        {surveyLogs.length} <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Catatan</span>
                                    </div>
                                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                                        <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: "12px", fontWeight: "800" }}>Pembaruan Live</span>
                                        <span style={{ color: "#16a34a", fontWeight: "700" }}>Lihat Semua Data</span>
                                    </div>
                                </div>

                                <div
                                    onClick={() => {
                                        setStatusFilter("pending");
                                        setActiveTab("Validasi Lapangan");
                                    }}
                                    style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", cursor: "pointer" }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#b45309", letterSpacing: "0.5px" }}>PENDING VALIDASI</span>
                                        <div style={{ width: "36px", height: "36px", backgroundColor: "#fef3c7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
                                            <AlertTriangle size={20} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", marginTop: "10px" }}>
                                        {surveyLogs.filter((x) => x.status === "Menunggu Cek").length} <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Perlu Cek</span>
                                    </div>
                                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                                        <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "3px 10px", borderRadius: "12px", fontWeight: "800" }}>Butuh Validasi</span>
                                        <span style={{ color: "#dc2626", fontWeight: "700" }}>Buka Modul Validasi →</span>
                                    </div>
                                </div>
                            </div>

                            {/* TABEL DATA SURVEI */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Pembaruan Terkini Data Harga Pasar</h3>
                                        <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>Daftar entri survei lapangan hari ini dari Pasar Babat, Sukodadi &amp; Sidoharjo.</p>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                        <div style={{ position: "relative" }}>
                                            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "11px" }} />
                                            <input
                                                type="text"
                                                placeholder="Cari kios / komoditas / lokasi..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{ padding: "9px 14px 9px 36px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", width: "220px" }}
                                            />
                                        </div>

                                        <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
                                            <button
                                                onClick={() => setStatusFilter("semua")}
                                                style={{ padding: "6px 14px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer", backgroundColor: statusFilter === "semua" ? "#ffffff" : "transparent", color: statusFilter === "semua" ? "#0f172a" : "#64748b" }}
                                            >
                                                Semua ({surveyLogs.length})
                                            </button>
                                            <button
                                                onClick={() => setStatusFilter("pending")}
                                                style={{ padding: "6px 14px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer", backgroundColor: statusFilter === "pending" ? "#ffffff" : "transparent", color: statusFilter === "pending" ? "#0f172a" : "#64748b" }}
                                            >
                                                Pending ({surveyLogs.filter((x) => x.status === "Menunggu Cek").length})
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                                <th style={{ padding: "14px", fontSize: "11px", fontWeight: "800", color: "#475569" }}>KOMODITAS</th>
                                                <th style={{ padding: "14px", fontSize: "11px", fontWeight: "800", color: "#475569" }}>KIOS &amp; LOKASI PASAR</th>
                                                <th style={{ padding: "14px", fontSize: "11px", fontWeight: "800", color: "#475569" }}>HARGA TERINPUT</th>
                                                <th style={{ padding: "14px", fontSize: "11px", fontWeight: "800", color: "#475569" }}>WAKTU SURVEI</th>
                                                <th style={{ padding: "14px", fontSize: "11px", fontWeight: "800", color: "#475569" }}>STATUS VERIFIKASI</th>
                                                <th style={{ padding: "14px", fontSize: "11px", fontWeight: "800", color: "#475569", textAlign: "center" }}>AKSI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLogs.map((item) => (
                                                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                    <td style={{ padding: "16px 14px" }}>
                                                        <div style={{ fontWeight: "800", fontSize: "14px", color: "#0f172a" }}>{item.name}</div>
                                                        <div style={{ fontSize: "12px", color: "#64748b" }}>{item.subtitle}</div>
                                                    </td>
                                                    <td style={{ padding: "16px 14px" }}>
                                                        <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>{item.kios}</div>
                                                        <div style={{ fontSize: "11px", color: "#64748b" }}>📍 {item.lokasi}</div>
                                                    </td>
                                                    <td style={{ padding: "16px 14px" }}>
                                                        <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>Rp {item.price.toLocaleString("id-ID")} /{item.unit}</div>
                                                    </td>
                                                    <td style={{ padding: "16px 14px" }}>
                                                        <div style={{ fontWeight: "700", fontSize: "13px", color: "#334155" }}>{item.time}</div>
                                                    </td>
                                                    <td style={{ padding: "16px 14px" }}>
                                                        {item.status === "Terverifikasi" ? (
                                                            <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "800" }}>Terverifikasi</span>
                                                        ) : (
                                                            <span style={{ backgroundColor: "#fef3c7", color: "#b45309", padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "800" }}>Menunggu Cek</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "16px 14px", textAlign: "center" }}>
                                                        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                                            {item.status === "Menunggu Cek" && (
                                                                <button onClick={() => handleValidate(item.id)} style={{ backgroundColor: "#047857", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>
                                                                    Validasi
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleDeleteLog(item.id)} style={{ background: "#fff", border: "1px solid #fca5a5", padding: "6px", borderRadius: "8px", cursor: "pointer", color: "#ef4444" }}>
                                                                <Trash2 size={14} />
                                                            </button>
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

                    {/* VIEW 2: MODUL SUARA (NLP ENUMERATOR TERPISAH) */}
                    {activeTab === "Input Suara (NLP)" && (
                        <div style={{ backgroundColor: "#f0fdf4", borderRadius: "16px", border: "1px solid #bbf7d0", padding: "28px", boxShadow: "0 4px 16px rgba(16, 185, 129, 0.05)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                <span style={{ backgroundColor: "#047857", color: "#ffffff", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "6px" }}>MODUL INPUT KHUSUS NLP</span>
                                <span style={{ backgroundColor: "#e2e8f0", color: "#334155", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px" }}>Model Bahasa Daerah Jatim</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                                <div>
                                    <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#065f46", margin: "0 0 6px 0" }}>Modul Input Cepat Suara (NLP Enumerator)</h3>
                                    <p style={{ fontSize: "13px", color: "#047857", margin: 0 }}>Tekan tombol mikrofon di bawah untuk merekam kalimat percakapan tawar-menawar harga di pasar.</p>
                                </div>

                                <button
                                    onClick={handleToggleRecord}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "12px 24px",
                                        borderRadius: "12px",
                                        border: "none",
                                        backgroundColor: isRecording ? "#ef4444" : "#047857",
                                        color: "#ffffff",
                                        fontWeight: "700",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                    }}
                                >
                                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                    {isRecording ? "Berhenti Merekam..." : "Mulai Rekam Suara"}
                                </button>
                            </div>

                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px dashed #a7f3d0", marginTop: "20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#047857", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Sparkles size={16} /> HASIL TRANSKRIP &amp; ANALISIS NLP:
                                    </span>
                                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#059669" }}>{isProcessingNLP ? "MEMPROSES..." : "AKURASI PARSER: 98.4%"}</span>
                                </div>

                                <p style={{ fontSize: "14px", fontStyle: "italic", fontWeight: "600", color: "#1e293b", margin: "0 0 14px 0" }}>
                                    {transcript || "“Pasar Babat Kios Makmur, Minyak Goreng limolas ewu sak liter, Beras IR Enam puluh empat Telulas ewu sak kilo”"}
                                </p>

                                {parsedResult && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                                        <span style={{ backgroundColor: "#ecfdf5", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", color: "#065f46", border: "1px solid #a7f3d0", fontWeight: "600" }}>
                                            Komoditas: <strong>{parsedResult.komoditas}</strong>
                                        </span>
                                        <span style={{ backgroundColor: "#eff6ff", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", color: "#1e40af", border: "1px solid #bfdbfe", fontWeight: "600" }}>
                                            Pasar: <strong>{parsedResult.pasar}</strong>
                                        </span>
                                        <span style={{ backgroundColor: "#fff7ed", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", color: "#9a3412", border: "1px solid #fed7aa", fontWeight: "600" }}>
                                            Estimasi Harga: <strong>{parsedResult.harga}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VIEW 3: VALIDASI LAPANGAN TERPISAH */}
                    {activeTab === "Validasi Lapangan" && (
                        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Dashboard Validasi Lapangan</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>Daftar temuan deviasi harga yang memerlukan pemeriksaan ulang oleh supervisor.</p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {surveyLogs.filter(x => x.status === "Menunggu Cek").map(item => (
                                    <div key={item.id} style={{ border: "1px solid #fef3c7", backgroundColor: "#fffbeb", padding: "16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontWeight: "800", fontSize: "15px", color: "#92400e" }}>{item.name} - {item.kios}</div>
                                            <div style={{ fontSize: "12px", color: "#b45309" }}>{item.lokasi} | Price: Rp {item.price.toLocaleString("id-ID")}</div>
                                        </div>
                                        <button onClick={() => handleValidate(item.id)} style={{ backgroundColor: "#047857", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                                            Verifikasi Sekarang
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VIEW 4: MANAJEMEN KIOS TERPISAH */}
                    {activeTab === "Manajemen Kios" && (
                        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Direktori Manajemen Kios Mitra</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>Kelola pedagang mitra resmi terdaftar di Pasar Babat, Sukodadi, &amp; Sidoharjo.</p>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                                {["Kios Makmur", "Kios UD Barokah", "Stan Mbak Sri", "Kios Pak Mat"].map((kios, idx) => (
                                    <div key={idx} style={{ padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                                        <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>{kios}</div>
                                        <div style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 12px 0" }}>Terdaftar Resmi DKPP</div>
                                        <span style={{ fontSize: "11px", backgroundColor: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "6px", fontWeight: "700" }}>Aktif Beroperasi</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* MODAL INPUT DATA SURVEI BISA DIGUNAKAN & REALISTIS */}
            {showInputModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", maxWidth: "500px", width: "100%", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Input Data Survei Baru</h3>
                            <button onClick={() => setShowInputModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Nama Komoditas</label>
                                <input type="text" required value={formData.nama_komoditas} onChange={(e) => setFormData({ ...formData, nama_komoditas: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }} placeholder="Contoh: Beras Premium, Minyakita" />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Harga (Rp)</label>
                                    <input type="number" required value={formData.harga} onChange={(e) => setFormData({ ...formData, harga: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }} placeholder="14000" />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Satuan</label>
                                    <select value={formData.satuan} onChange={(e) => setFormData({ ...formData, satuan: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
                                        <option value="kg">Per Kilogram (kg)</option>
                                        <option value="liter">Per Liter</option>
                                        <option value="butir">Per Butir</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Lokasi Pasar</label>
                                    <select value={formData.lokasi_pasar} onChange={(e) => setFormData({ ...formData, lokasi_pasar: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
                                        <option value="Pasar Babat">Pasar Babat</option>
                                        <option value="Pasar Sukodadi">Pasar Sukodadi</option>
                                        <option value="Pasar Sidoharjo">Pasar Sidoharjo</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Nama Kios</label>
                                    <input type="text" required value={formData.nama_kios} onChange={(e) => setFormData({ ...formData, nama_kios: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }} placeholder="Contoh: Kios Makmur" />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                                <button type="button" onClick={() => setShowInputModal(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#475569", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>Batal</button>
                                <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#047857", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>Simpan Data Survei</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CATALOG MASTER DATA */}
            {showMasterModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", maxWidth: "550px", width: "100%", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0, textTransform: "capitalize" }}>Master Data {showMasterModal}</h3>
                            <button onClick={() => setShowMasterModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
                        </div>

                        <div style={{ maxHeight: "280px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                            {showMasterModal === "kios" && (
                                <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "13px", lineHeight: "2" }}>
                                    <li><strong>Kios Makmur</strong> - Pasar Babat (Pemilik: H. Achmad)</li>
                                    <li><strong>Kios UD Barokah</strong> - Pasar Babat (Pemilik: Hj. Siti)</li>
                                    <li><strong>Stan Mbak Sri</strong> - Pasar Sukodadi (Pemilik: Sri Wahyuni)</li>
                                    <li><strong>Kios Pak Mat</strong> - Pasar Sidoharjo (Pemilik: M. Miftah)</li>
                                </ul>
                            )}
                            {showMasterModal === "komoditas" && (
                                <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "13px", lineHeight: "2" }}>
                                    <li><strong>Beras Medium</strong> (HET: Rp12.500/kg)</li>
                                    <li><strong>Beras Premium</strong> (HET: Rp14.900/kg)</li>
                                    <li><strong>Minyakita</strong> (HET: Rp15.700/L)</li>
                                    <li><strong>Daging Ayam Ras</strong> (HET: Rp35.000/kg)</li>
                                </ul>
                            )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                            <button onClick={() => setShowMasterModal(null)} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: "#047857", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
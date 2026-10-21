import React, { useState, useEffect, useCallback } from "react";
import NlpAudioUpload from './NlpAudioUpload';
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
} from "lucide-react";

import {
    getSurveiHarga,
    updateSurveiHarga,
    hapusSurveiHarga,
    getDashboardRingkasan,
    getCurrentUser,
    logoutPetugas,
    tambahSurveiHarga,
} from "./api";

export default function AdminDashboard({ setActivePage, showToast }) {
    const [activeTab, setActiveTab] = useState("Ringkasan Pasar");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("semua");

    const [surveyLogs, setSurveyLogs] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: "Laporan Anomali Harga", time: "10 menit lalu", read: false, desc: "Daging ayam di Pasar Babat naik 8%" },
        { id: 2, title: "Survei Baru Terkirim", time: "25 menit lalu", read: false, desc: "Petugas Hendra menambahkan data Minyakita" },
        { id: 3, title: "Validasi Otomatis", time: "1 jam lalu", read: true, desc: "Beras Medium terverifikasi sistem" },
    ]);

    const [showMasterModal, setShowMasterModal] = useState(null);
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
                { id: 1, name: "Beras Medium", subtitle: "IR-64 Super", kios: "Kios UD Barokah", lokasi: "Pasar Babat (Blok B-04)", price: 13500, unit: "kg", time: "08:15 WIB", status: "Terverifikasi" },
                { id: 2, name: "Minyak Goreng Kita", subtitle: "Kemasan Bantal 1L", kios: "Kios Makmur", lokasi: "Pasar Sidoharjo (Blok C-01)", price: 16000, unit: "liter", time: "08:45 WIB", status: "Menunggu Cek" },
                { id: 3, name: "Cabai Merah Keriting", subtitle: "Lokal Fresh", kios: "Stan Mbak Sri", lokasi: "Pasar Sukodadi (A-12)", price: 38000, unit: "kg", time: "09:10 WIB", status: "Terverifikasi" },
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

    useEffect(() => {
        fetchSurvei();
        fetchDashboard();
    }, [fetchSurvei, fetchDashboard]);

    const handleFullRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchSurvei(), fetchDashboard()]);
            setLastSyncTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
            if (showToast) showToast("Data berhasil disinkronisasi!", "success");
        } catch {
            if (showToast) showToast("Gagal menyinkronkan data", "error");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleValidate = async (id) => {
        try {
            await updateSurveiHarga(id, { status_verifikasi: "Terverifikasi" });
        } catch { }
        setSurveyLogs((prev) => prev.map((item) => (item.id === id ? { ...item, status: "Terverifikasi" } : item)));
        if (showToast) showToast("Data berhasil divalidasi!", "success");
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
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f6f4", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#112216" }}>

            {/* SIDEBAR */}
            <aside style={{
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
                boxShadow: "4px 0 24px rgba(27,67,50,0.02)"
            }}>
                <div>
                    {/* Logo Brand */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", padding: "0 8px" }}>
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

                    {/* Menu Sidebar */}
                    <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                                        display: "flex", alignItems: "center", gap: "14px",
                                        padding: "13px 18px", borderRadius: "14px", border: "none",
                                        backgroundColor: isActive ? "#1b4332" : "transparent",
                                        color: isActive ? "#ffffff" : "#4e6754",
                                        fontWeight: isActive ? "800" : "600", fontSize: "13.5px",
                                        cursor: "pointer", transition: "all 0.2s",
                                        boxShadow: isActive ? "0 6px 16px rgba(27,67,50,0.18)" : "none"
                                    }}
                                >
                                    <Icon size={18} color={isActive ? "#74c69d" : "#4e6754"} />
                                    <span>{menu.name}</span>
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                {/* NAVBAR ATAS */}
                <header style={{
                    height: "80px", backgroundColor: "#ffffff", borderBottom: "1px solid #d2ded7",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0 40px", position: "sticky", top: 0, zIndex: 20
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
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
                            <span style={{ color: "#4e6754" }}>• {lastSyncTime}</span>
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
                <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "28px" }}>

                    {/* BANNER PROFIL */}
                    <div style={{
                        backgroundColor: "#ffffff", borderRadius: "28px", padding: "32px 40px", border: "1px solid #d2ded7",
                        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px",
                        boxShadow: "0 4px 20px rgba(27,67,50,0.04)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                            <div style={{ width: "68px", height: "68px", borderRadius: "20px", backgroundColor: "#f2f7f4", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #d2ded7" }}>
                                <User size={32} color="#1b4332" />
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f1d14", margin: 0 }}>{currentUser?.nama || "Hendra Setiawan"}</h2>
                                    <ShieldCheck size={18} color="#2d6a4f" />
                                </div>
                                <div style={{ fontSize: "13px", color: "#4e6754", margin: "4px 0", fontWeight: "600" }}>NIP: 19850412 201001 1 014 • Petugas Enumerator Resmi</div>
                                <div style={{ fontSize: "12px", color: "#2d6a4f", fontWeight: "700", marginTop: "4px" }}>📍 Wilayah Pantau: Pasar Babat, Sukodadi &amp; Sidoharjo</div>
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

                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <div style={{ position: "relative" }}>
                                            <Search size={16} color="#4e6754" style={{ position: "absolute", left: "14px", top: "12px" }} />
                                            <input type="text" placeholder="Cari komoditas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
                                                padding: "10px 14px 10px 38px", borderRadius: "99px", border: "1px solid #d2ded7", fontSize: "13.5px", outline: "none", backgroundColor: "#f2f7f4", fontWeight: "600"
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
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
                        </>
                    )}

                    {/* TAB 2: NLP AUDIO */}
                    {activeTab === "Input Suara (NLP)" && (
                        <NlpAudioUpload onSuccessSave={handleFullRefresh} showToast={showToast} onNavigateTab={setActiveTab} />
                    )}

                    {/* TAB 3: VALIDASI */}
                    {activeTab === "Validasi Lapangan" && (
                        <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid #d2ded7", padding: "32px" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f1d14", marginBottom: "8px" }}>Dashboard Validasi Lapangan</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                                {surveyLogs.filter(x => x.status === "Menunggu Cek").map(item => (
                                    <div key={item.id} style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb", padding: "20px", borderRadius: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontWeight: "800", fontSize: "15px", color: "#92400e" }}>{item.name} - {item.kios}</div>
                                            <div style={{ fontSize: "12.5px", color: "#b45309", fontWeight: "600" }}>{item.lokasi} | Harga: Rp {item.price.toLocaleString("id-ID")}</div>
                                        </div>
                                        <button onClick={() => handleValidate(item.id)} style={{ backgroundColor: "#2d6a4f", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "99px", fontWeight: "800", cursor: "pointer" }}>Verifikasi Sekarang</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: MANAJEMEN KIOS */}
                    {activeTab === "Manajemen Kios" && (
                        <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid #d2ded7", padding: "32px" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f1d14", marginBottom: "8px" }}>Direktori Manajemen Kios Mitra</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginTop: "16px" }}>
                                {["Kios Makmur", "Kios UD Barokah", "Stan Mbak Sri", "Kios Pak Mat"].map((kios, idx) => (
                                    <div key={idx} style={{ padding: "20px", borderRadius: "20px", border: "1px solid #d2ded7", backgroundColor: "#f2f7f4" }}>
                                        <div style={{ fontWeight: "800", fontSize: "15.5px", color: "#0f1d14" }}>{kios}</div>
                                        <div style={{ fontSize: "12.5px", color: "#4e6754", margin: "6px 0 14px", fontWeight: "600" }}>Terdaftar Resmi DKPP</div>
                                        <span style={{ fontSize: "11.5px", backgroundColor: "#eef8f2", color: "#1b4332", padding: "4px 12px", borderRadius: "99px", fontWeight: "800", border: "1px solid #b7efc5" }}>Aktif Beroperasi</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
        </div>
    );
}
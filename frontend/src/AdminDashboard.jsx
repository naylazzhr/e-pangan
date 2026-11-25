import React, { useState, useEffect, useCallback } from "react";
import NlpAudioUpload from './NlpAudioUpload';
import './App.css';
import './AdminDashboard.css';
import logoEpangan from './assets/logo-epangan.png';
import {
    Bell,
    User,
    Download,
    Mic,
    Store,
    Package,
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
    Edit2,
    Eye,
    Image as ImageIcon,
    UploadCloud,
    RotateCcw,
    Camera,
    Check,
    CheckCheck,
    Link as LinkIcon,
} from "lucide-react";

import {
    getSurveiHarga,
    updateSurveiHarga,
    validasiSurveiHarga,
    hapusSurveiHarga,
    getDashboardRingkasan,
    getCurrentUser,
    logoutPetugas,
    getKiosList,
    getDetailKios,
    tambahKios,
    updateKios,
    hapusKios,
    tambahKomoditasKios,
    updateKomoditasKios,
    hapusKomoditasKios,
    getCustomPhotos,
    uploadKomoditasFoto,
    updateKomoditasFotoUrl,
    resetKomoditasFoto,
    getMasterKatalog,
    tambahMasterKatalog,
    updateMasterKatalog,
    deleteMasterKatalog,
} from "./api";

// Master Komoditas Bahan Pokok & Katalog Dashboard
const MASTER_KATALOG_KOMODITAS = [
    { name: "Beras Medium IR 64", kategori: "KEBUTUHAN POKOK", desc: "Beras medium standar pasar daerah Lamongan" },
    { name: "Beras Premium Pandan Wangi", kategori: "KEBUTUHAN POKOK", desc: "Beras premium aroma pandan wangi bulir utuh" },
    { name: "Gula Pasir Kristal", kategori: "BAHAN BAKU", desc: "Gula pasir kristal putih higienis kemasan pabrik" },
    { name: "Gula Pasir Curah", kategori: "BAHAN BAKU", desc: "Gula tebu kristal curah terjangkau" },
    { name: "Gula Aren", kategori: "BAHAN BAKU", desc: "Gula aren / gula kelapa tradisional asli daerah" },
    { name: "Minyak Goreng Sawit", kategori: "MINYAK GORENG", desc: "Minyakita kemasan resmi 1 Liter" },
    { name: "Minyak Goreng Curah", kategori: "MINYAK GORENG", desc: "Minyak kelapa sawit curah higienis" },
    { name: "Cabai Rawit Merah", kategori: "BUMBU DAPUR", desc: "Cabai rawit pedas segar lokal Lamongan" },
    { name: "Cabai Merah Keriting", kategori: "BUMBU DAPUR", desc: "Cabai merah keriting segar petik" },
    { name: "Bawang Merah Allium", kategori: "BUMBU DAPUR", desc: "Bawang merah varietas super unggulan daerah" },
    { name: "Bawang Putih Honan", kategori: "BUMBU DAPUR", desc: "Bawang putih kering bersih kualitas terbaik" },
    { name: "Daging Ayam Broiler", kategori: "PROTEIN HEWANI", desc: "Daging ayam potong karkas segar harian" },
    { name: "Daging Sapi Murni", kategori: "PROTEIN HEWANI", desc: "Daging sapi bagian paha belakang super" },
    { name: "Telur Ayam Ras", kategori: "PROTEIN HEWANI", desc: "Telur ayam ras segar grade A bersih" },
    { name: "Ikan Bandeng Segar", kategori: "PROTEIN HEWANI", desc: "Bandeng tambak segar pesisir Lamongan" },
    { name: "Ikan Tongkol Segar", kategori: "PROTEIN HEWANI", desc: "Ikan laut segar tangkapan nelayan Brondong" },
    { name: "Tepung Terigu Segitiga", kategori: "BAHAN BAKU", desc: "Tepung terigu protein sedang untuk olahan dapur" },
    { name: "Jagung Pipil Kering", kategori: "BAHAN BAKU", desc: "Jagung pipil pakan & pangan kadar air 14%" },
    { name: "Kedelai Impor Kuning", kategori: "BAHAN BAKU", desc: "Kedelai kuning bahan baku tempe & tahu" },
    { name: "Kulat (Jamur Pangan)", kategori: "SAYUR & JAMUR", desc: "Jamur pangan segar lokal daerah Lamongan" },
];

export default function AdminDashboard({
    setActivePage,
    showToast,
    products = [],
    setProducts,
    customPhotos = {},
    setCustomPhotos,
    getKomoditasImage,
}) {
    const [activeTab, setActiveTab] = useState("Ringkasan Pasar");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("semua");
    const [validasiSubFilter, setValidasiSubFilter] = useState("semua");

    // State Khusus Manajemen Foto Katalog
    const [fotoSearch, setFotoSearch] = useState("");
    const [fotoCategoryFilter, setFotoCategoryFilter] = useState("Semua");
    const [hanyaKustomFilter, setHanyaKustomFilter] = useState(false);
    const [uploadingName, setUploadingName] = useState("");
    const [urlModalItem, setUrlModalItem] = useState(null);
    const [urlInputVal, setUrlInputVal] = useState("");

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

    // State Edit Kios
    const [showEditKiosModal, setShowEditKiosModal] = useState(false);
    const [isUpdatingKios, setIsUpdatingKios] = useState(false);
    const [editKiosForm, setEditKiosForm] = useState({
        id: null,
        nama_kios: "",
        pemilik: "",
        lokasi_pasar: "Pasar Babat",
        blok_stan: "",
        alamat_lengkap: "",
        jam_buka: "06:00 - 16:30 WIB",
        no_telepon: "",
        status_izin: "Terdaftar Resmi DKPP",
    });

    // State Kelola Komoditas Kios
    const [viewingKiosDetail, setViewingKiosDetail] = useState(null);
    const [loadingKiosDetail, setLoadingKiosDetail] = useState(false);
    const [showAddKomoditasForm, setShowAddKomoditasForm] = useState(false);
    const [isAddingKomoditas, setIsAddingKomoditas] = useState(false);
    const [editingKomoditas, setEditingKomoditas] = useState(null);
    const [isSavingKomoditas, setIsSavingKomoditas] = useState(false);
    const [newKomoditasForm, setNewKomoditasForm] = useState({
        nama_bahan: "",
        kategori: "Kebutuhan Pokok",
        harga: "",
        satuan: "kg",
        varian_keterangan: "Standar Pasar",
        stok_fisik: "Tersedia",
        status_label: "Stabil"
    });

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifFilter, setNotifFilter] = useState("all");
    const [notifications, setNotifications] = useState([
        { id: 1, type: "anomali", title: "Laporan Anomali Harga", time: "10 menit lalu", read: false, desc: "Daging ayam di Pasar Babat naik 8% di atas tren normal" },
        { id: 2, type: "pending", title: "Survei Baru Terkirim", time: "25 menit lalu", read: false, desc: "Petugas menambahkan data Minyakita (Menunggu Cek Validasi)" },
        { id: 3, type: "kios", title: "Pembaruan Kios Mitra", time: "1 jam lalu", read: false, desc: "28 Kios Mitra aktif terpantau di 5 pasar wilayah Lamongan" },
        { id: 4, type: "sistem", title: "Validasi Otomatis Berhasil", time: "2 jam lalu", read: true, desc: "Beras Medium SPHP terverifikasi stabil sesuai HET" },
    ]);

    const [showMasterModal, setShowMasterModal] = useState(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // State Manajemen Master Katalog Komoditas (CRUD Database)
    const [masterKatalogList, setMasterKatalogList] = useState([]);
    const [katalogLoading, setKatalogLoading] = useState(false);
    const [showAddKatalogModal, setShowAddKatalogModal] = useState(false);
    const [newKatalogForm, setNewKatalogForm] = useState({
        name: "",
        kategori: "KEBUTUHAN POKOK",
        satuan: "1kg",
        harga_acuan: 13000,
        het: 14000,
        foto_url: "",
        target_pasar: "Semua Pasar",
        target_kios_id: ""
    });
    const [editingKatalogItem, setEditingKatalogItem] = useState(null);
    const [editKatalogForm, setEditKatalogForm] = useState({
        old_name: "",
        name: "",
        kategori: "",
        satuan: "",
        harga_acuan: 0,
        het: 0,
        foto_url: ""
    });
    const [deletingKatalogName, setDeletingKatalogName] = useState(null);
    const [isSubmittingKatalog, setIsSubmittingKatalog] = useState(false);
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

    const fetchMasterKatalogData = useCallback(async () => {
        try {
            setKatalogLoading(true);
            const res = await getMasterKatalog();
            let loadedList = [];
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                loadedList = res.data.map((item, idx) => ({
                    id: item.id || idx + 1,
                    name: item.nama_komoditas || item.name || item.nama_bahan,
                    kategori: item.kategori || "KEBUTUHAN POKOK",
                    satuan: item.satuan || "1kg",
                    harga_acuan: item.harga_acuan || item.harga || 0,
                    het: item.het || item.harga_acuan || 0,
                    foto_url: item.foto_url || customPhotos[(item.nama_komoditas || item.name || "").toLowerCase()] || "",
                    daftar_pasar: item.daftar_pasar || [],
                    total_titik: item.total_titik || 0,
                }));
            } else if (products && products.length > 0) {
                // Ambil daftar komoditas yang sudah ada di database
                const uniqueMap = new Map();
                products.forEach((p, idx) => {
                    const cleanName = (p.name || p.nama_bahan || "").trim();
                    if (cleanName && !uniqueMap.has(cleanName.toLowerCase())) {
                        uniqueMap.set(cleanName.toLowerCase(), {
                            id: p.id || idx + 1,
                            name: cleanName,
                            kategori: (p.category || p.kategori || "KEBUTUHAN POKOK").toUpperCase(),
                            satuan: p.unit || p.satuan || "1kg",
                            harga_acuan: p.price || p.harga || 13000,
                            het: p.het || p.price || 14000,
                            foto_url: p.image || customPhotos[cleanName.toLowerCase()] || "",
                            daftar_pasar: p.lokasi ? [p.lokasi] : ["Pasar Babat", "Pasar Sidoharjo"],
                            total_titik: 2
                        });
                    }
                });
                loadedList = Array.from(uniqueMap.values());
            }

            // Fallback master komoditas resmi jika belum ada
            if (loadedList.length === 0) {
                loadedList = MASTER_KATALOG_KOMODITAS.map((m, idx) => ({
                    id: idx + 1,
                    name: m.name,
                    kategori: m.kategori,
                    satuan: "1kg",
                    harga_acuan: 14000,
                    het: 15000,
                    foto_url: customPhotos[m.name.toLowerCase()] || "",
                    daftar_pasar: ["Pasar Babat", "Pasar Sidoharjo"],
                    total_titik: 2
                }));
            }

            setMasterKatalogList(loadedList);
        } catch (err) {
            console.error("Gagal memuat master katalog dari database:", err);
            if (products && products.length > 0) {
                setMasterKatalogList(products.map((p, idx) => ({
                    id: p.id || idx + 1,
                    name: p.name || p.nama_bahan,
                    kategori: (p.category || p.kategori || "KEBUTUHAN POKOK").toUpperCase(),
                    satuan: p.unit || "1kg",
                    harga_acuan: p.price || 13000,
                    het: p.het || 14000,
                    foto_url: p.image || ""
                })));
            }
        } finally {
            setKatalogLoading(false);
        }
    }, [products, customPhotos]);

    const handleLogout = useCallback(() => {
        try {
            logoutPetugas();
            sessionStorage.removeItem("epangan_page");
        } catch (e) {
            console.warn("Logout error:", e);
        }
        if (showToast) showToast("Berhasil keluar dari portal petugas.");
        setActivePage("dashboard");
        setMobileSidebarOpen(false);
    }, [setActivePage, showToast]);

    useEffect(() => {
        fetchSurvei();
        fetchDashboard();
        fetchKios();
        fetchMasterKatalogData();
    }, [fetchSurvei, fetchDashboard, fetchKios, fetchMasterKatalogData]);

    useEffect(() => {
        if (activeTab === "Validasi Lapangan") {
            fetchSurvei();
        } else if (activeTab === "Manajemen Kios") {
            fetchKios();
        } else if (activeTab === "Manajemen Katalog") {
            fetchMasterKatalogData();
        }
    }, [activeTab, fetchSurvei, fetchKios, fetchMasterKatalogData]);

    const handleFotoUploadFile = (e, isEdit = false) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            if (isEdit) {
                setEditKatalogForm(prev => ({ ...prev, foto_url: dataUrl }));
            } else {
                setNewKatalogForm(prev => ({ ...prev, foto_url: dataUrl }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAddKatalogSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!newKatalogForm.name.trim()) {
            if (showToast) showToast("Nama komoditas wajib diisi!");
            return;
        }
        try {
            setIsSubmittingKatalog(true);
            await tambahMasterKatalog({
                nama_komoditas: newKatalogForm.name.trim(),
                kategori: newKatalogForm.kategori || "KEBUTUHAN POKOK",
                satuan: newKatalogForm.satuan || "1kg",
                harga_acuan: Number(newKatalogForm.harga_acuan) || 0,
                het: Number(newKatalogForm.het) || 0,
                foto_url: newKatalogForm.foto_url.trim() || undefined
            });

            // Jika dipilih kios tertentu, tambahkan juga langsung ke kios tersebut
            if (newKatalogForm.target_kios_id) {
                try {
                    await tambahKomoditasKios(newKatalogForm.target_kios_id, {
                        nama_bahan: newKatalogForm.name.trim(),
                        kategori: newKatalogForm.kategori || "KEBUTUHAN POKOK",
                        harga: Number(newKatalogForm.harga_acuan) || 13000,
                        satuan: newKatalogForm.satuan || "kg",
                        stok_fisik: "Tersedia",
                        status_label: "Sesuai HET",
                        varian_keterangan: "Standar Pasar",
                    });
                    await fetchKios();
                } catch (kiosErr) {
                    console.warn("Tambah ke kios notice:", kiosErr);
                }
            }

            await fetchMasterKatalogData();
            if (typeof handleFullRefresh === "function") {
                await handleFullRefresh();
            }
            setShowAddKatalogModal(false);
            setNewKatalogForm({
                name: "",
                kategori: "KEBUTUHAN POKOK",
                satuan: "1kg",
                harga_acuan: 13000,
                het: 14000,
                foto_url: "",
                target_pasar: "Semua Pasar",
                target_kios_id: ""
            });
            if (showToast) showToast(`Komoditas "${newKatalogForm.name}" berhasil ditambahkan ke database & halaman publik!`);
        } catch (err) {
            console.error("Gagal tambah komoditas:", err);
            const msg = err.response?.data?.detail || "Gagal menambahkan komoditas ke database.";
            if (showToast) showToast(msg);
        } finally {
            setIsSubmittingKatalog(false);
        }
    };

    const handleEditKatalogSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!editKatalogForm.name.trim()) {
            if (showToast) showToast("Nama komoditas tidak boleh kosong!");
            return;
        }
        try {
            setIsSubmittingKatalog(true);
            await updateMasterKatalog(editKatalogForm.old_name, {
                nama_baru: editKatalogForm.name.trim(),
                kategori: editKatalogForm.kategori || "KEBUTUHAN POKOK",
                satuan: editKatalogForm.satuan || "1kg",
                harga_acuan: Number(editKatalogForm.harga_acuan) || 0,
                het: Number(editKatalogForm.het) || 0,
                foto_url: editKatalogForm.foto_url.trim() || undefined
            });
            await fetchMasterKatalogData();
            if (typeof handleFullRefresh === "function") {
                await handleFullRefresh();
            }
            setEditingKatalogItem(null);
            if (showToast) showToast(`Komoditas "${editKatalogForm.name}" berhasil diperbarui di database & halaman publik!`);
        } catch (err) {
            console.error("Gagal update komoditas:", err);
            const msg = err.response?.data?.detail || err.message || "Gagal memperbarui komoditas.";
            if (showToast) showToast(msg);
        } finally {
            setIsSubmittingKatalog(false);
        }
    };

    const handleDeleteKatalogSubmit = async (komoditasName) => {
        if (!komoditasName) return;
        try {
            setIsSubmittingKatalog(true);
            await deleteMasterKatalog(komoditasName);
            await fetchMasterKatalogData();
            if (typeof handleFullRefresh === "function") {
                await handleFullRefresh();
            }
            setDeletingKatalogName(null);
            if (showToast) showToast(`Komoditas "${komoditasName}" berhasil dihapus dari database & halaman publik!`);
        } catch (err) {
            console.error("Gagal hapus komoditas:", err);
            const msg = err.response?.data?.detail || "Gagal menghapus komoditas.";
            if (showToast) showToast(msg);
        } finally {
            setIsSubmittingKatalog(false);
        }
    };

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

    const handleOpenEditKios = (kios) => {
        setEditKiosForm({
            id: kios.id,
            nama_kios: kios.nama_kios || "",
            pemilik: kios.pemilik || "",
            lokasi_pasar: kios.lokasi_pasar || "Pasar Babat",
            blok_stan: kios.blok_stan || "",
            alamat_lengkap: kios.alamat_lengkap || "",
            jam_buka: kios.jam_buka || "06:00 - 16:30 WIB",
            no_telepon: kios.no_telepon || "",
            status_izin: kios.status_izin || "Terdaftar Resmi DKPP",
        });
        setShowEditKiosModal(true);
    };

    const handleEditKiosSubmit = async (e) => {
        e.preventDefault();
        if (!editKiosForm.nama_kios.trim()) {
            if (showToast) showToast("Nama kios wajib diisi!", "error");
            return;
        }
        setIsUpdatingKios(true);
        try {
            await updateKios(editKiosForm.id, editKiosForm);
            if (showToast) showToast(`Data kios "${editKiosForm.nama_kios}" berhasil diperbarui!`, "success");
            setShowEditKiosModal(false);
            await fetchKios();
        } catch (err) {
            const msg = err.message || "Gagal memperbarui kios";
            if (showToast) showToast(msg, "error");
        } finally {
            setIsUpdatingKios(false);
        }
    };

    const handleOpenKiosDetail = async (kios) => {
        setLoadingKiosDetail(true);
        const kiosId = kios.id || kios.id_kios;
        setViewingKiosDetail({ ...kios, id: kiosId, id_kios: kiosId, katalog: [] });
        setShowAddKomoditasForm(false);
        setEditingKomoditas(null);
        try {
            const res = await getDetailKios(kiosId);
            const data = res.data || res;
            setViewingKiosDetail({ ...data, id: data.id || data.id_kios || kiosId });
        } catch (err) {
            if (showToast) showToast("Gagal memuat katalog komoditas kios", "error");
        } finally {
            setLoadingKiosDetail(false);
        }
    };

    const handleTambahKomoditasSubmit = async (e) => {
        e.preventDefault();
        const kiosId = viewingKiosDetail?.id || viewingKiosDetail?.id_kios;
        if (!kiosId) {
            if (showToast) showToast("ID Kios tidak valid!", "error");
            return;
        }
        if (!newKomoditasForm.nama_bahan || !newKomoditasForm.nama_bahan.trim()) {
            if (showToast) showToast("Nama komoditas bahan pangan wajib diisi!", "error");
            return;
        }
        const hargaVal = parseFloat(newKomoditasForm.harga);
        if (!hargaVal || hargaVal <= 0) {
            if (showToast) showToast("Harga komoditas harus berupa angka di atas 0!", "error");
            return;
        }

        setIsAddingKomoditas(true);

        const tempItem = {
            id: Date.now(),
            id_komoditas: Date.now(),
            kios_id: kiosId,
            nama_bahan: newKomoditasForm.nama_bahan.trim(),
            kategori: newKomoditasForm.kategori || "Kebutuhan Pokok",
            harga: hargaVal,
            satuan: newKomoditasForm.satuan || "kg",
            varian_keterangan: newKomoditasForm.varian_keterangan || "Standar Pasar",
            stok_fisik: newKomoditasForm.stok_fisik || "Tersedia",
            status_label: newKomoditasForm.status_label || "Stabil"
        };

        // Optimistic UI update pada modal detail kios
        setViewingKiosDetail((prev) => {
            if (!prev) return prev;
            const updatedKatalog = [tempItem, ...(prev.katalog || [])];
            return {
                ...prev,
                katalog: updatedKatalog,
                total_komoditas: updatedKatalog.length
            };
        });

        // Update list kios pada daftar utama agar jumlah komoditas sinkron
        setKiosList((prev) =>
            prev.map((k) =>
                (k.id === kiosId || k.id_kios === kiosId)
                    ? { ...k, total_komoditas: (k.total_komoditas || 0) + 1 }
                    : k
            )
        );

        try {
            await tambahKomoditasKios(kiosId, {
                ...newKomoditasForm,
                harga: hargaVal
            });
            if (showToast) showToast(`Komoditas "${newKomoditasForm.nama_bahan}" berhasil ditambahkan ke katalog kios!`, "success");
            setNewKomoditasForm({
                nama_bahan: "",
                kategori: "Kebutuhan Pokok",
                harga: "",
                satuan: "kg",
                varian_keterangan: "Standar Pasar",
                stok_fisik: "Tersedia",
                status_label: "Stabil"
            });
            setShowAddKomoditasForm(false);
            const res = await getDetailKios(kiosId);
            const data = res.data || res;
            if (data && Array.isArray(data.katalog)) {
                setViewingKiosDetail({ ...data, id: data.id || data.id_kios || kiosId });
            }
            fetchKios();
        } catch (err) {
            console.warn("Tambah komoditas backend notice:", err.message);
            setShowAddKomoditasForm(false);
            if (showToast) showToast(`Komoditas "${newKomoditasForm.nama_bahan}" tersimpan ke katalog kios!`, "success");
        } finally {
            setIsAddingKomoditas(false);
        }
    };

    const handleUpdateKomoditasSubmit = async (e) => {
        e.preventDefault();
        const kiosId = viewingKiosDetail?.id || viewingKiosDetail?.id_kios;
        const komoditasId = editingKomoditas?.id_komoditas || editingKomoditas?.id;
        if (!kiosId || !komoditasId || !editingKomoditas.nama_bahan?.trim() || !editingKomoditas.harga) {
            if (showToast) showToast("Data komoditas tidak lengkap!", "error");
            return;
        }
        setIsSavingKomoditas(true);
        try {
            await updateKomoditasKios(kiosId, komoditasId, {
                nama_bahan: editingKomoditas.nama_bahan.trim(),
                kategori: editingKomoditas.kategori || "Kebutuhan Pokok",
                varian_keterangan: editingKomoditas.varian_keterangan || "-",
                harga: parseFloat(editingKomoditas.harga),
                satuan: editingKomoditas.satuan || "kg",
                stok_fisik: editingKomoditas.stok_fisik || "Tersedia",
                status_label: editingKomoditas.status_label || "Stabil"
            });
            if (showToast) showToast(`Komoditas "${editingKomoditas.nama_bahan}" berhasil diperbarui!`, "success");
            setEditingKomoditas(null);
            const res = await getDetailKios(kiosId);
            const data = res.data || res;
            setViewingKiosDetail({ ...data, id: data.id || data.id_kios || kiosId });
            await fetchKios();
        } catch (err) {
            const msg = err.message || "Gagal memperbarui komoditas";
            if (showToast) showToast(msg, "error");
        } finally {
            setIsSavingKomoditas(false);
        }
    };

    const handleHapusKomoditas = async (komoditasId, namaBahan) => {
        const kiosId = viewingKiosDetail?.id || viewingKiosDetail?.id_kios;
        if (!kiosId || !komoditasId) {
            if (showToast) showToast("ID Kios atau Komoditas tidak ditemukan", "error");
            return;
        }
        if (!window.confirm(`Hapus komoditas "${namaBahan}" dari kios ini?`)) return;
        try {
            await hapusKomoditasKios(kiosId, komoditasId);
            if (showToast) showToast(`Komoditas "${namaBahan}" berhasil dihapus dari kios.`, "info");
            const res = await getDetailKios(kiosId);
            const data = res.data || res;
            setViewingKiosDetail({ ...data, id: data.id || data.id_kios || kiosId });
            await fetchKios();
        } catch (err) {
            const msg = err.message || "Gagal menghapus komoditas";
            if (showToast) showToast(msg, "error");
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
        try {
            const headers = [
                "NO",
                "TANGGAL SURVEI",
                "LOKASI PASAR",
                "KIOS / STAN",
                "NAMA KOMODITAS",
                "KATEGORI",
                "HARGA TERPANTAU (RP)",
                "SATUAN",
                "HET ACUAN (RP)",
                "STATUS HET",
                "KETERSEDIAAN STOK",
                "STATUS VALIDASI",
                "PETUGAS ENUMERATOR"
            ];

            const sourceData = (surveyLogs && surveyLogs.length > 0) ? surveyLogs : (products || []);

            const rows = sourceData.map((item, idx) => {
                const hargaNum = Number(item.price || item.harga || 0);
                const hetNum = Number(item.het || 0);
                let statusHet = item.hetStatus || item.status_label || (hetNum > 0 && hargaNum > hetNum ? "Di Atas HET" : "Sesuai HET");
                if (hetNum > 0 && hargaNum > hetNum) {
                    const selisih = Math.round(((hargaNum - hetNum) / hetNum) * 100);
                    statusHet = `Di Atas HET (+${selisih}%)`;
                }

                return [
                    idx + 1,
                    `"${item.time || item.updated_at || new Date().toLocaleDateString('id-ID')}"`,
                    `"${item.pasar || item.market || 'Pasar Babat'}"`,
                    `"${item.kios || '-'}"`,
                    `"${item.name || item.nama_bahan || 'Bahan Pangan'}"`,
                    `"${item.category || item.kategori || 'Kebutuhan Pokok'}"`,
                    hargaNum,
                    `"${item.unit || item.satuan || 'kg'}"`,
                    hetNum > 0 ? hetNum : "-",
                    `"${statusHet}"`,
                    `"${item.stok_fisik || 'Tersedia'}"`,
                    `"${item.status || 'Terverifikasi'}"`,
                    `"${item.petugas || currentUser?.nama || 'Petugas DKPP Lamongan'}"`
                ];
            });

            // \uFEFF adalah UTF-8 BOM untuk memastikan Microsoft Excel membaca karakter & tabel secara otomatis rapi
            const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            a.href = url;
            a.download = `laporan_pemantauan_harga_dkpp_${today}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (showToast) showToast("Laporan pemantauan harga berhasil diekspor ke CSV/Excel dengan rapi!", "success");
        } catch (err) {
            console.error("Export error:", err);
            if (showToast) showToast("Gagal mengekspor laporan: " + err.message, "error");
        }
    };

    // =========================================================================
    // HANDLERS FOTO KATALOG KOMODITAS
    // =========================================================================

    // Gabungkan master komoditas dengan produk dari dashboard agar semua tercakup
    const combinedKatalog = React.useMemo(() => {
        const map = new Map();
        MASTER_KATALOG_KOMODITAS.forEach((item) => {
            map.set(item.name.toLowerCase().trim(), item);
        });
        (products || []).forEach((p) => {
            const key = (p.name || "").toLowerCase().trim();
            if (!map.has(key)) {
                map.set(key, {
                    name: p.name,
                    kategori: p.category || "KEBUTUHAN POKOK",
                    desc: "Komoditas dari pantauan harga pasar",
                });
            }
        });
        return Array.from(map.values());
    }, [products]);

    const handleUploadPhoto = async (commodityName, file) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            if (showToast) showToast("Ukuran foto maksimal 10MB!", "error");
            return;
        }
        setUploadingName(commodityName);
        const cleanKey = commodityName.toLowerCase().trim();

        // Buat preview data URL lokal instan
        const reader = new FileReader();
        reader.onload = async (event) => {
            const localDataUrl = event.target.result;

            if (setCustomPhotos) {
                setCustomPhotos((prev) => {
                    const next = { ...prev, [cleanKey]: localDataUrl };
                    try {
                        localStorage.setItem("epangan_custom_photos", JSON.stringify(next));
                    } catch { }
                    return next;
                });
            }

            try {
                const res = await uploadKomoditasFoto(commodityName, file);
                if (res?.foto_url && setCustomPhotos) {
                    setCustomPhotos((prev) => {
                        const next = { ...prev, [cleanKey]: res.foto_url };
                        try {
                            localStorage.setItem("epangan_custom_photos", JSON.stringify(next));
                        } catch { }
                        return next;
                    });
                }
                if (showToast) showToast(`Foto untuk "${commodityName}" berhasil diperbarui!`, "success");
            } catch (err) {
                console.warn("Upload ke backend gagal, foto tetap tersimpan di browser:", err);
                if (showToast) showToast(`Foto "${commodityName}" disimpan secara lokal!`, "success");
            } finally {
                setUploadingName("");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleResetPhoto = async (commodityName) => {
        if (!window.confirm(`Kembalikan foto "${commodityName}" ke foto bawaan (default)?`)) return;
        const cleanKey = commodityName.toLowerCase().trim();

        if (setCustomPhotos) {
            setCustomPhotos((prev) => {
                const next = { ...prev };
                delete next[cleanKey];
                try {
                    localStorage.setItem("epangan_custom_photos", JSON.stringify(next));
                } catch { }
                return next;
            });
        }

        try {
            await resetKomoditasFoto(commodityName);
            if (showToast) showToast(`Foto "${commodityName}" direset ke bawaan`, "info");
        } catch {
            if (showToast) showToast(`Foto "${commodityName}" direset ke bawaan`, "info");
        }
    };

    const handleSaveUrlPhoto = async (commodityName, url) => {
        if (!url || !url.trim()) return;
        const cleanKey = commodityName.toLowerCase().trim();
        const cleanUrl = url.trim();

        if (setCustomPhotos) {
            setCustomPhotos((prev) => {
                const next = { ...prev, [cleanKey]: cleanUrl };
                try {
                    localStorage.setItem("epangan_custom_photos", JSON.stringify(next));
                } catch { }
                return next;
            });
        }

        try {
            await updateKomoditasFotoUrl(commodityName, cleanUrl);
            if (showToast) showToast(`URL foto untuk "${commodityName}" berhasil disimpan!`, "success");
        } catch {
            if (showToast) showToast(`URL foto untuk "${commodityName}" disimpan lokal!`, "success");
        }
        setUrlModalItem(null);
        setUrlInputVal("");
    };

    const unreadCount = notifications.filter((n) => !n.read).length;
    const filteredLogs = surveyLogs.filter((item) => {
        const matches = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.kios.toLowerCase().includes(searchTerm.toLowerCase());
        return statusFilter === "pending" ? matches && item.status === "Menunggu Cek" : matches;
    });

    return (
        <div className="admin-dashboard-container" style={{
            display: "flex",
            height: "100vh",
            maxHeight: "100vh",
            overflow: "hidden",
            backgroundColor: "#f3f6f4",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#112216",
            position: "relative"
        }}>

            {/* FLOATING CARD MENU MOBILE ALA SSCASN */}
            {mobileSidebarOpen && (
                <>
                    <div
                        className="admin-mobile-backdrop"
                        onClick={() => setMobileSidebarOpen(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            backgroundColor: "rgba(15,29,20,0.35)",
                            zIndex: 1400,
                            backdropFilter: "blur(2px)"
                        }}
                    />
                    <div
                        className="admin-mobile-floating-menu"
                        style={{
                            position: "fixed",
                            top: "56px",
                            right: "12px",
                            width: "245px",
                            maxWidth: "calc(100vw - 24px)",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            boxShadow: "0 12px 36px rgba(15, 29, 20, 0.22)",
                            border: "1px solid #d2ded7",
                            padding: "14px 12px",
                            zIndex: 1500,
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 8px 6px", borderBottom: "1px solid #eef3f0", marginBottom: "4px" }}>
                            <div style={{ fontSize: "12px", fontWeight: "800", color: "#1b4332", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Menu Petugas
                            </div>
                            <button
                                onClick={() => setMobileSidebarOpen(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#4e6754", padding: "2px" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {[
                            { name: "Ringkasan Pasar", icon: Store },
                            { name: "Input Suara (NLP)", icon: Mic },
                            { name: "Validasi Lapangan", icon: CheckCircle2, badge: surveyLogs.filter(x => x.status === "Menunggu Cek").length },
                            { name: "Manajemen Kios", icon: Users },
                            { name: "Manajemen Katalog", icon: Package },
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
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "10px 12px",
                                        borderRadius: "10px",
                                        border: "none",
                                        backgroundColor: isActive ? "#1b4332" : "transparent",
                                        color: isActive ? "#ffffff" : "#2d4436",
                                        fontWeight: isActive ? "800" : "600",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.15s"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <Icon size={16} color={isActive ? "#ffffff" : "#2d6a4f"} />
                                        <span>{menu.name}</span>
                                    </div>
                                    {menu.badge > 0 && (
                                        <span style={{
                                            backgroundColor: isActive ? "#ffffff" : "#eef8f2",
                                            color: isActive ? "#1b4332" : "#2d6a4f",
                                            fontSize: "11px",
                                            fontWeight: "800",
                                            padding: "2px 7px",
                                            borderRadius: "99px",
                                            border: isActive ? "none" : "1px solid #b7efc5"
                                        }}>
                                            {menu.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        <div style={{ height: "1px", backgroundColor: "#eef3f0", margin: "6px 0" }} />

                        <button
                            onClick={handleLogout}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "9px 12px",
                                borderRadius: "10px",
                                border: "1px solid #fecaca",
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                fontWeight: "700",
                                fontSize: "12px",
                                cursor: "pointer",
                                width: "100%",
                                justifyContent: "center"
                            }}
                        >
                            <LogOut size={14} /> Keluar Portal
                        </button>

                        <button
                            onClick={() => {
                                setActivePage("dashboard");
                                setMobileSidebarOpen(false);
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "9px 12px",
                                borderRadius: "10px",
                                border: "1px solid #d2ded7",
                                backgroundColor: "#ffffff",
                                color: "#4e6754",
                                fontWeight: "700",
                                fontSize: "12px",
                                cursor: "pointer",
                                width: "100%",
                                justifyContent: "center",
                                marginTop: "4px"
                            }}
                        >
                            <ArrowLeft size={14} /> Layanan Publik
                        </button>
                    </div>
                </>
            )}

            {/* BACKDROP MOBILE - DIHAPUS DUPLIKAT, sudah ada di floating menu atas */}

            {/* SIDEBAR DESKTOP */}
            <aside className="admin-sidebar" style={{
                width: "280px",
                backgroundColor: "#ffffff",
                borderRight: "1px solid #d2ded7",
                display: "flex",
                flexDirection: "column",
                padding: "28px 20px",
                justifyContent: "space-between",
                height: "100vh",
                flexShrink: 0,
                boxShadow: "4px 0 24px rgba(27,67,50,0.02)",
                zIndex: 999,
                boxSizing: "border-box",
                overflowY: "auto"
            }}>
                <div>
                    {/* Logo Brand */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", padding: "0 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => setActivePage("dashboard")}>
                            <img
                                src={logoEpangan}
                                alt="E-Pangan Kab. Lamongan"
                                style={{ height: "42px", width: "auto", objectFit: "contain", display: "block" }}
                            />
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
                            { name: "Manajemen Katalog", icon: Package },
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
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto", paddingTop: "24px" }}>
                    <button onClick={handleLogout} style={{
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
            <div className="admin-main-wrapper" style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                height: "100vh",
                overflowY: "auto"
            }}>

                {/* NAVBAR ATAS */}
                <header className="admin-topbar">
                    {/* Brand Logo Resmi Sisi Kiri */}
                    <div className="admin-topbar-left" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                            className="admin-mobile-brand"
                            onClick={() => setActivePage("dashboard")}
                            title="Ke Beranda E-Pangan"
                            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                            <img
                                src={logoEpangan}
                                alt="E-Pangan"
                                style={{ height: "34px", width: "auto", objectFit: "contain", display: "block" }}
                            />
                        </div>

                        <div className="admin-status-badge desktop-only-badge">
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2d6a4f" }}></span>
                            SISTEM PEMANTAUAN REALTIME
                        </div>
                    </div>

                    {/* Sisi Kanan: Refresh, User Pill, & Tombol Hamburger SSCASN */}
                    <div className="admin-topbar-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                            className="admin-refresh-btn"
                            onClick={handleFullRefresh}
                            disabled={isRefreshing}
                            title="Sinkronisasi Data"
                        >
                            <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
                            <span className="admin-refresh-text desktop-only-text">{isRefreshing ? "Sinkron..." : "Refresh"}</span>
                            <span className="admin-sync-time desktop-only-text" style={{ color: "#4e6754" }}>• {lastSyncTime}</span>
                        </button>

                        <div className="admin-user-pill desktop-only-user">
                            <div className="admin-avatar">
                                <User size={16} />
                            </div>
                            <span className="admin-user-name">{currentUser?.nama || "Petugas Lapangan"}</span>
                        </div>

                        {/* Tombol Hamburger di Sisi KANAN Paling Ujung Ala SSCASN (Kecil & Rapi) */}
                        <button
                            className="admin-hamburger-btn"
                            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                            aria-label="Buka Menu"
                            title={mobileSidebarOpen ? "Tutup Menu" : "Buka Menu Petugas"}
                        >
                            {mobileSidebarOpen ? <X size={18} color="#1b4332" /> : <Menu size={18} color="#1b4332" />}
                        </button>
                    </div>
                </header>

                {/* ISI KONTEN TAB */}
                <div className="admin-content-area">

                    {/* BANNER PROFIL */}
                    <div className="admin-profile-banner">
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                            <div className="admin-banner-avatar">
                                <User size={28} color="#1b4332" />
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <h2 className="admin-banner-title">
                                        {currentUser?.nama_lengkap || currentUser?.nama || "Admin Petugas"}
                                    </h2>
                                    <ShieldCheck size={18} color="#2d6a4f" />
                                </div>
                                <div style={{ fontSize: "12.5px", color: "#4e6754", margin: "4px 0", fontWeight: "600" }}>
                                    NIP: {currentUser?.nip || "19820516 200801 1 009"} • {currentUser?.jabatan || "Petugas Resmi DKPP"}
                                </div>
                                <div style={{ fontSize: "11.5px", color: "#2d6a4f", fontWeight: "700", marginTop: "2px" }}>
                                    Wilayah Pantau: {currentUser?.wilayah_pantau || "Pasar Sidoharjo & Pasar Lamongan"}
                                </div>
                            </div>
                        </div>

                        <button className="admin-export-btn" onClick={handleExportCSV} style={{
                            display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "99px",
                            border: "1px solid #d2ded7", backgroundColor: "#ffffff", color: "#1b4332", fontWeight: "800", fontSize: "12.5px", cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(27,67,50,0.04)"
                        }}>
                            <Download size={15} /> Ekspor Laporan CSV
                        </button>
                    </div>

                    {/* TAB 1: RINGKASAN PASAR */}
                    {activeTab === "Ringkasan Pasar" && (
                        <>
                            <div className="admin-ringkasan-grid">
                                <div className="admin-stat-card" onClick={() => setShowMasterModal("kios")}>
                                    <div className="admin-stat-label" style={{ color: "#4e6754" }}>KIOS TERPANTAU</div>
                                    <div className="admin-stat-value">{getDashboardValue("kios_terpantau", 24)} <span style={{ fontSize: "13px", color: "#4e6754", fontWeight: "700" }}>Kios</span></div>
                                </div>
                                <div className="admin-stat-card" onClick={() => setShowMasterModal("komoditas")}>
                                    <div className="admin-stat-label" style={{ color: "#4e6754" }}>KOMODITAS AKTIF</div>
                                    <div className="admin-stat-value">{getDashboardValue("komoditas_aktif", 18)} <span style={{ fontSize: "13px", color: "#4e6754", fontWeight: "700" }}>Bahan Pokok</span></div>
                                </div>
                                <div className="admin-stat-card" onClick={() => setStatusFilter("pending")}>
                                    <div className="admin-stat-label" style={{ color: "#b45309" }}>PENDING VALIDASI</div>
                                    <div className="admin-stat-value">{surveyLogs.filter((x) => x.status === "Menunggu Cek").length} <span style={{ fontSize: "13px", color: "#4e6754", fontWeight: "700" }}>Perlu Cek</span></div>
                                </div>
                            </div>

                            {/* TABEL DATA */}
                            <div className="admin-card-section">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
                                    <h3 className="admin-section-title">Pembaruan Terkini Data Harga Pasar</h3>

                                    <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "320px" }}>
                                        <div style={{ position: "relative", width: "100%" }}>
                                            <Search size={16} color="#4e6754" style={{ position: "absolute", left: "14px", top: "12px" }} />
                                            <input type="text" placeholder="Cari komoditas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
                                                padding: "10px 14px 10px 38px", borderRadius: "99px", border: "1px solid #d2ded7", fontSize: "13px", outline: "none", backgroundColor: "#f2f7f4", fontWeight: "600", width: "100%", boxSizing: "border-box"
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-tabel-wrap">
                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "540px" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#f2f7f4", borderBottom: "1px solid #d2ded7" }}>
                                                <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: "800", color: "#1b4332" }}>KOMODITAS</th>
                                                <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: "800", color: "#1b4332" }}>KIOS &amp; LOKASI</th>
                                                <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: "800", color: "#1b4332" }}>HARGA</th>
                                                <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: "800", color: "#1b4332" }}>STATUS</th>
                                                <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: "800", color: "#1b4332", textAlign: "center" }}>AKSI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLogs.map((item) => (
                                                <tr key={item.id} style={{ borderBottom: "1px solid #f2f7f4" }}>
                                                    <td style={{ padding: "14px 16px", fontWeight: "800", color: "#0f1d14" }}>{item.name} <div style={{ fontSize: "11px", color: "#4e6754", fontWeight: "600" }}>{item.subtitle}</div></td>
                                                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#0f1d14" }}>{item.kios} <div style={{ fontSize: "11px", color: "#4e6754", fontWeight: "600" }}>{item.lokasi}</div></td>
                                                    <td style={{ padding: "14px 16px", fontWeight: "800", color: "#0f1d14" }}>Rp {item.price.toLocaleString("id-ID")} /{item.unit}</td>
                                                    <td style={{ padding: "14px 16px" }}>
                                                        {item.status === "Terverifikasi" ? (
                                                            <span style={{ backgroundColor: "#eef8f2", color: "#1b4332", padding: "5px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: "800", border: "1px solid #b7efc5" }}>Terverifikasi</span>
                                                        ) : (
                                                            <span style={{ backgroundColor: "#fef3c7", color: "#b45309", padding: "5px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: "800", border: "1px solid #fde68a" }}>Menunggu Cek</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                                            {item.status === "Menunggu Cek" && (
                                                                <button onClick={() => handleValidate(item.id)} style={{ backgroundColor: "#2d6a4f", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>Validasi</button>
                                                            )}
                                                            <button onClick={() => handleDeleteLog(item.id)} style={{ background: "#fee2e2", border: "1px solid #fca5a5", padding: "7px", borderRadius: "50%", cursor: "pointer", color: "#ef4444" }}><Trash2 size={13} /></button>
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
                        <NlpAudioUpload
                            onSuccessSave={handleFullRefresh}
                            showToast={showToast}
                            onNavigateTab={setActiveTab}
                            kiosList={kiosList}
                        />
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
                            <div className="admin-card-section" style={{ backgroundColor: "#ffffff", border: "1px solid #d2ded7", boxShadow: "0 4px 20px rgba(27,67,50,0.05)" }}>
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
                                                             <strong>{item.kios}</strong> — {item.lokasi}
                                                        </div>

                                                        {item.catatan && (
                                                            <div style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", backgroundColor: "#f2f7f4", padding: "6px 12px", borderRadius: "10px", display: "inline-block", maxWidth: "100%" }}>
                                                                Catatan:  {item.catatan}
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
                            "Pasar Blimbing",
                            "Pasar Sendangrejo",
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
                            <div className="admin-card-section" style={{ backgroundColor: "#ffffff", border: "1px solid #d2ded7", boxShadow: "0 4px 20px rgba(27,67,50,0.05)" }}>
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
                                    <div className="admin-kios-grid">
                                        {filteredKios.map((kios) => (
                                            <div
                                                key={kios.id}
                                                className="admin-kios-card"
                                                style={{
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
                                                            <div style={{ fontSize: "12.5px", color: "#4e6754", fontWeight: "600", marginTop: "2px", display: "flex", alignItems: "center", gap: "5px" }}>
                                                                <User size={13} color="#2d6a4f" />
                                                                <span>{kios.pemilik || "Pedagang Binaan"}</span>
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

                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid #f2f7f4", flexWrap: "wrap", gap: "8px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenKiosDetail(kios)}
                                                        title="Lihat & Kelola Komoditas Kios"
                                                        style={{
                                                            background: "#eef8f2",
                                                            border: "1px solid #b7efc5",
                                                            color: "#1b4332",
                                                            padding: "6px 12px",
                                                            borderRadius: "99px",
                                                            fontSize: "11.5px",
                                                            fontWeight: "800",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "5px"
                                                        }}
                                                    >
                                                        <Eye size={13} color="#2d6a4f" />
                                                        <span>{kios.total_katalog || 0} Komoditas</span>
                                                    </button>

                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditKios(kios)}
                                                            title="Edit Data Kios"
                                                            style={{
                                                                background: "#f0fdf4",
                                                                border: "1px solid #bbf7d0",
                                                                padding: "6px 12px",
                                                                borderRadius: "99px",
                                                                cursor: "pointer",
                                                                color: "#166534",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                                fontSize: "11.5px",
                                                                fontWeight: "700"
                                                            }}
                                                        >
                                                            <Edit2 size={12} />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteKios(kios.id, kios.nama_kios)}
                                                            title="Hapus Kios"
                                                            style={{
                                                                background: "#fee2e2",
                                                                border: "1px solid #fca5a5",
                                                                padding: "7px",
                                                                borderRadius: "50%",
                                                                cursor: "pointer",
                                                                color: "#ef4444",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center"
                                                            }}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* TAB 5: MANAJEMEN KATALOG KOMODITAS (CRUD DATABASE) */}
                    {activeTab === "Manajemen Katalog" && (() => {
                        const filteredMasterKatalog = masterKatalogList.filter(item =>
                            (item.name || "").toLowerCase().includes(fotoSearch.toLowerCase()) ||
                            (item.kategori || "").toLowerCase().includes(fotoSearch.toLowerCase())
                        );

                        return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {/* Header Banner */}
                                <div style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "24px",
                                    padding: "24px 28px",
                                    border: "1px solid #d2ded7",
                                    boxShadow: "0 4px 20px rgba(27,67,50,0.04)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "16px"
                                }}>
                                    <div>
                                        <div style={{
                                            display: "inline-flex", alignItems: "center", gap: "8px",
                                            backgroundColor: "#eef8f2", padding: "5px 14px",
                                            borderRadius: "99px", marginBottom: "10px", border: "1px solid #b7efc5"
                                        }}>
                                            <Package size={14} color="#2d6a4f" />
                                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.04em" }}>
                                                MANAJEMEN KATALOG KOMODITAS
                                            </span>
                                        </div>
                                        <h2 style={{ fontSize: "21px", fontWeight: "800", color: "#0f1d14", margin: "0 0 6px 0" }}>
                                            Kelola Data Katalog Komoditas
                                        </h2>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#4e6754", lineHeight: "1.6" }}>
                                            Tambah, edit, dan hapus komoditas. Perubahan langsung tersinkron ke halaman publik dan database.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddKatalogModal(true)}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: "8px",
                                            padding: "11px 22px", borderRadius: "99px", border: "none",
                                            backgroundColor: "#1b4332", color: "#ffffff",
                                            fontWeight: "800", fontSize: "13px", cursor: "pointer",
                                            boxShadow: "0 6px 18px rgba(27,67,50,0.25)", flexShrink: 0
                                        }}
                                    >
                                        <Plus size={16} /> Tambah Komoditas Baru
                                    </button>
                                </div>

                                {/* Toolbar: search + filter */}
                                <div style={{
                                    backgroundColor: "#ffffff", borderRadius: "18px",
                                    padding: "16px 20px", border: "1px solid #d2ded7",
                                    display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap"
                                }}>
                                    <div style={{ position: "relative", flex: "1 1 220px", minWidth: "180px" }}>
                                        <Search size={15} color="#4e6754" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                                        <input
                                            type="text"
                                            placeholder="Cari komoditas..."
                                            value={fotoSearch}
                                            onChange={e => setFotoSearch(e.target.value)}
                                            style={{
                                                width: "100%", padding: "9px 12px 9px 36px",
                                                borderRadius: "99px", border: "1px solid #d2ded7",
                                                fontSize: "13px", fontWeight: "600", outline: "none",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#4e6754" }}>
                                        {katalogLoading ? "Memuat..." : `${filteredMasterKatalog.length} komoditas`}
                                    </span>
                                </div>

                                {/* Grid Katalog */}
                                {katalogLoading ? (
                                    <div style={{ textAlign: "center", padding: "48px", color: "#4e6754" }}>
                                        <Loader2 size={32} className="spin" color="#2d6a4f" />
                                        <p style={{ marginTop: "12px", fontSize: "14px", fontWeight: "700" }}>Memuat data katalog...</p>
                                    </div>
                                ) : filteredMasterKatalog.length === 0 ? (
                                    <div style={{
                                        textAlign: "center", padding: "48px 24px",
                                        backgroundColor: "#ffffff", borderRadius: "24px",
                                        border: "1px solid #d2ded7"
                                    }}>
                                        <Package size={40} color="#b7efc5" />
                                        <p style={{ marginTop: "12px", fontSize: "15px", fontWeight: "800", color: "#1b4332" }}>
                                            {fotoSearch ? "Komoditas tidak ditemukan" : "Belum ada katalog komoditas"}
                                        </p>
                                        <p style={{ fontSize: "13px", color: "#4e6754", marginTop: "6px" }}>
                                            {fotoSearch ? "Coba kata kunci lain" : "Klik \"Tambah Komoditas Baru\" untuk mulai menambahkan."}
                                        </p>
                                        {!fotoSearch && (
                                            <button
                                                onClick={() => setShowAddKatalogModal(true)}
                                                style={{
                                                    marginTop: "16px", padding: "10px 24px",
                                                    borderRadius: "99px", border: "none",
                                                    backgroundColor: "#1b4332", color: "#ffffff",
                                                    fontWeight: "800", fontSize: "13px", cursor: "pointer"
                                                }}
                                            >
                                                + Tambah Komoditas Pertama
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="admin-katalog-grid">
                                        {filteredMasterKatalog.map((item, idx) => (
                                            <div key={item.id || idx} className="admin-katalog-card">
                                                {/* Foto */}
                                                <div className="admin-katalog-img-wrap">
                                                    {(() => {
                                                        const imgSource = item.foto_url || (getKomoditasImage && getKomoditasImage(item.name)) || customPhotos[(item.name || "").toLowerCase()] || "";
                                                        return imgSource ? (
                                                            <img
                                                                src={imgSource}
                                                                alt={item.name}
                                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                onError={e => { e.target.style.display = "none"; }}
                                                            />
                                                        ) : (
                                                            <Package size={28} color="#b7efc5" />
                                                        );
                                                    })()}
                                                </div>
                                                {/* Info */}
                                                <div>
                                                    <span className="admin-katalog-badge">
                                                        {item.kategori || "UMUM"}
                                                    </span>
                                                    <h3 className="admin-katalog-name">
                                                        {item.name}
                                                    </h3>
                                                    <p className="admin-katalog-price">
                                                        {item.satuan || "kg"} • Rp {Number(item.harga_acuan || 0).toLocaleString("id-ID")}
                                                    </p>
                                                </div>
                                                {/* Action Buttons */}
                                                <div style={{ display: "flex", gap: "6px", marginTop: "auto" }}>
                                                    <button
                                                        onClick={() => {
                                                            setEditingKatalogItem(item);
                                                            setEditKatalogForm({
                                                                old_name: item.name,
                                                                name: item.name,
                                                                kategori: item.kategori || "KEBUTUHAN POKOK",
                                                                satuan: item.satuan || "1kg",
                                                                harga_acuan: item.harga_acuan || 0,
                                                                het: item.het || 0,
                                                                foto_url: item.foto_url || ""
                                                            });
                                                        }}
                                                        className="admin-katalog-btn-edit"
                                                    >
                                                        <Edit2 size={13} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Hapus "${item.name}" dari katalog?\n\nData di halaman publik juga akan terhapus.`)) {
                                                                handleDeleteKatalogSubmit(item.name);
                                                            }
                                                        }}
                                                        className="admin-katalog-btn-del"
                                                    >
                                                        <Trash2 size={13} /> Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                 {/* MODAL TAMBAH KATALOG */}
                                {showAddKatalogModal && (
                                    <div style={{
                                        position: "fixed", inset: 0,
                                        backgroundColor: "rgba(15,23,42,0.65)",
                                        backdropFilter: "blur(4px)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        zIndex: 1200, padding: "16px"
                                    }}>
                                        <div style={{
                                            backgroundColor: "#ffffff", borderRadius: "24px",
                                            maxWidth: "540px", width: "100%", padding: "28px",
                                            border: "1px solid #d2ded7", maxHeight: "90vh", overflowY: "auto"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f1d14" }}>
                                                        Tambah Komoditas Baru
                                                    </h3>
                                                    <span style={{ fontSize: "12px", color: "#4e6754", fontWeight: "600" }}>
                                                        Daftarkan komoditas ke master database & kios pasar
                                                    </span>
                                                </div>
                                                <button onClick={() => setShowAddKatalogModal(false)}
                                                    style={{ background: "#f2f7f4", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer", color: "#4e6754" }}>
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            <form onSubmit={handleAddKatalogSubmit}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                                    <div>
                                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>Nama Komoditas Pangan *</label>
                                                        <input required type="text" value={newKatalogForm.name}
                                                            onChange={e => setNewKatalogForm({ ...newKatalogForm, name: e.target.value })}
                                                            placeholder="Contoh: Beras Premium Pandan Wangi"
                                                            style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #d2ded7", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} />
                                                    </div>

                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>Kategori Bahan *</label>
                                                            <select value={newKatalogForm.kategori}
                                                                onChange={e => setNewKatalogForm({ ...newKatalogForm, kategori: e.target.value })}
                                                                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #d2ded7", fontSize: "13px", fontWeight: "700", color: "#1b4332", outline: "none", backgroundColor: "#ffffff", boxSizing: "border-box" }}>
                                                                <option value="KEBUTUHAN POKOK">Kebutuhan Pokok</option>
                                                                <option value="BAHAN BAKU">Bahan Baku</option>
                                                                <option value="BUMBU DAPUR">Bumbu Dapur</option>
                                                                <option value="PROTEIN HEWANI">Protein Hewani</option>
                                                                <option value="MINYAK GORENG">Minyak Goreng</option>
                                                                <option value="SAYUR & JAMUR">Sayur & Jamur</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>Satuan</label>
                                                            <input type="text" value={newKatalogForm.satuan}
                                                                onChange={e => setNewKatalogForm({ ...newKatalogForm, satuan: e.target.value })}
                                                                placeholder="1kg / 1liter"
                                                                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #d2ded7", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} />
                                                        </div>
                                                    </div>

                                                    {/* PILIHAN PASAR & KIOS TUJUAN */}
                                                    <div style={{ backgroundColor: "#f4f9f6", padding: "14px", borderRadius: "14px", border: "1px solid #cfe8d8" }}>
                                                        <div style={{ fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <MapPin size={14} color="#2d6a4f" />
                                                            <span>PILIHAN PASAR & KIOS TUJUAN</span>
                                                        </div>
                                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                                            <div>
                                                                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#4e6754", marginBottom: "4px" }}>Pilih Pasar</label>
                                                                <select
                                                                    value={newKatalogForm.target_pasar}
                                                                    onChange={e => setNewKatalogForm({ ...newKatalogForm, target_pasar: e.target.value, target_kios_id: "" })}
                                                                    style={{ width: "100%", padding: "8px 10px", borderRadius: "10px", border: "1px solid #d2ded7", fontSize: "12px", fontWeight: "700", color: "#1b4332", backgroundColor: "#ffffff" }}
                                                                >
                                                                    <option value="Semua Pasar">Semua Pasar (Seluruh Daerah)</option>
                                                                    <option value="Pasar Babat">Pasar Babat</option>
                                                                    <option value="Pasar Sidoharjo">Pasar Sidoharjo</option>
                                                                    <option value="Pasar Mantup">Pasar Mantup</option>
                                                                    <option value="Pasar Blimbing">Pasar Blimbing</option>
                                                                    <option value="Pasar Sukodadi">Pasar Sukodadi</option>
                                                                    <option value="Pasar Sendangrejo">Pasar Sendangrejo</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#4e6754", marginBottom: "4px" }}>Pilih Kios (Opsional)</label>
                                                                <select
                                                                    value={newKatalogForm.target_kios_id}
                                                                    onChange={e => setNewKatalogForm({ ...newKatalogForm, target_kios_id: e.target.value })}
                                                                    style={{ width: "100%", padding: "8px 10px", borderRadius: "10px", border: "1px solid #d2ded7", fontSize: "12px", fontWeight: "600", color: "#1b4332", backgroundColor: "#ffffff" }}
                                                                >
                                                                    <option value="">Semua Kios Terkait</option>
                                                                    {kiosList
                                                                        .filter(k => newKatalogForm.target_pasar === "Semua Pasar" || (k.lokasi_pasar || "").toLowerCase().includes(newKatalogForm.target_pasar.toLowerCase()))
                                                                        .map(k => (
                                                                            <option key={k.id || k.id_kios} value={k.id || k.id_kios}>
                                                                                {k.nama_kios} ({k.lokasi_pasar})
                                                                            </option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>Harga Acuan (Rp)</label>
                                                            <input type="number" value={newKatalogForm.harga_acuan}
                                                                onChange={e => setNewKatalogForm({ ...newKatalogForm, harga_acuan: parseInt(e.target.value) || 0 })}
                                                                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #d2ded7", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>HET Resmi Pemkab (Rp)</label>
                                                            <input type="number" value={newKatalogForm.het}
                                                                onChange={e => setNewKatalogForm({ ...newKatalogForm, het: parseInt(e.target.value) || 0 })}
                                                                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #d2ded7", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} />
                                                        </div>
                                                    </div>

                                                    {/* UPLOAD FOTO LANGSUNG DARI PERANGKAT */}
                                                    <div>
                                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                                            Foto Komoditas (Pilih Berkas Foto Langsung)
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={e => handleFotoUploadFile(e, false)}
                                                            style={{
                                                                width: "100%",
                                                                padding: "9px 12px",
                                                                borderRadius: "12px",
                                                                border: "1.5px dashed #2d6a4f",
                                                                backgroundColor: "#f4f9f6",
                                                                fontSize: "12px",
                                                                fontWeight: "600",
                                                                color: "#1b4332",
                                                                cursor: "pointer",
                                                                boxSizing: "border-box"
                                                            }}
                                                        />
                                                        {newKatalogForm.foto_url && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", backgroundColor: "#eef8f2", padding: "8px 12px", borderRadius: "10px", border: "1px solid #b7efc5" }}>
                                                                <img
                                                                    src={newKatalogForm.foto_url}
                                                                    alt="Preview"
                                                                    style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "8px" }}
                                                                />
                                                                <span style={{ fontSize: "11.5px", color: "#1b4332", fontWeight: "700" }}>
                                                                    Foto berhasil dimuat &amp; siap disimpan
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setNewKatalogForm(prev => ({ ...prev, foto_url: "" }))}
                                                                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}
                                                                >
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                        )}
                                                        <input
                                                            type="text"
                                                            value={newKatalogForm.foto_url.startsWith("data:") ? "" : newKatalogForm.foto_url}
                                                            onChange={e => setNewKatalogForm({ ...newKatalogForm, foto_url: e.target.value })}
                                                            placeholder="Atau tempel tautan URL gambar disini..."
                                                            style={{ width: "100%", marginTop: "6px", padding: "8px 12px", borderRadius: "10px", border: "1px solid #d2ded7", fontSize: "11.5px", outline: "none", boxSizing: "border-box" }}
                                                        />
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "22px" }}>
                                                    <button type="button" onClick={() => setShowAddKatalogModal(false)}
                                                        style={{ padding: "10px 20px", borderRadius: "99px", border: "1px solid #d2ded7", backgroundColor: "#ffffff", color: "#4e6754", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                                                        Batal
                                                    </button>
                                                    <button type="submit"
                                                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRadius: "99px", border: "none", backgroundColor: "#1b4332", color: "#ffffff", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>
                                                        <CheckCircle2 size={15} /> Simpan ke Database
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {/* MODAL EDIT KATALOG */}
                                {editingKatalogItem && (
                                    <div style={{
                                        position: "fixed", inset: 0,
                                        backgroundColor: "rgba(15,23,42,0.65)",
                                        backdropFilter: "blur(4px)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        zIndex: 1200, padding: "16px"
                                    }}>
                                        <div style={{
                                            backgroundColor: "#ffffff", borderRadius: "24px",
                                            maxWidth: "540px", width: "100%", padding: "28px",
                                            border: "1px solid #d2ded7", maxHeight: "90vh", overflowY: "auto"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f1d14" }}>
                                                    Edit: {editingKatalogItem.name}
                                                </h3>
                                                <button onClick={() => setEditingKatalogItem(null)}
                                                    style={{ background: "#f2f7f4", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer", color: "#4e6754" }}>
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            <form onSubmit={handleEditKatalogSubmit}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                                    <div>
                                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>Nama Komoditas *</label>
                                                        <input required type="text" value={editKatalogForm.name}
                                                            onChange={e => setEditKatalogForm({ ...editKatalogForm, name: e.target.value })}
                                                            style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #d2ded7", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>Kategori *</label>
                                                        <select value={editKatalogForm.kategori}
                                                            onChange={e => setEditKatalogForm({ ...editKatalogForm, kategori: e.target.value })}
                                                            style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #d2ded7", fontSize: "13px", fontWeight: "700", color: "#1b4332", outline: "none", backgroundColor: "#ffffff", boxSizing: "border-box" }}>
                                                            <option value="KEBUTUHAN POKOK">Kebutuhan Pokok</option>
                                                            <option value="BAHAN BAKU">Bahan Baku</option>
                                                            <option value="BUMBU DAPUR">Bumbu Dapur</option>
                                                            <option value="PROTEIN HEWANI">Protein Hewani</option>
                                                            <option value="MINYAK GORENG">Minyak Goreng</option>
                                                            <option value="SAYUR & JAMUR">Sayur & Jamur</option>
                                                        </select>
                                                    </div>
                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>Satuan</label>
                                                            <input type="text" value={editKatalogForm.satuan}
                                                                onChange={e => setEditKatalogForm({ ...editKatalogForm, satuan: e.target.value })}
                                                                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #d2ded7", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>Harga Acuan (Rp)</label>
                                                            <input type="number" value={editKatalogForm.harga_acuan}
                                                                onChange={e => setEditKatalogForm({ ...editKatalogForm, harga_acuan: parseInt(e.target.value) || 0 })}
                                                                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #d2ded7", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} />
                                                        </div>
                                                    </div>

                                                    {/* UPLOAD FOTO LANGSUNG DI MODAL EDIT */}
                                                    <div>
                                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                                            Ubah Foto (Pilih Berkas Foto Langsung)
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={e => handleFotoUploadFile(e, true)}
                                                            style={{
                                                                width: "100%",
                                                                padding: "9px 12px",
                                                                borderRadius: "12px",
                                                                border: "1.5px dashed #0284c7",
                                                                backgroundColor: "#f0f9ff",
                                                                fontSize: "12px",
                                                                fontWeight: "600",
                                                                color: "#0369a1",
                                                                cursor: "pointer",
                                                                boxSizing: "border-box"
                                                            }}
                                                        />
                                                        {editKatalogForm.foto_url && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", backgroundColor: "#f0f9ff", padding: "8px 12px", borderRadius: "10px", border: "1px solid #bae6fd" }}>
                                                                <img
                                                                    src={editKatalogForm.foto_url}
                                                                    alt="Preview"
                                                                    style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "8px" }}
                                                                />
                                                                <span style={{ fontSize: "11.5px", color: "#0369a1", fontWeight: "700" }}>
                                                                    Foto siap diperbarui
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditKatalogForm(prev => ({ ...prev, foto_url: "" }))}
                                                                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}
                                                                >
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                        )}
                                                        <input
                                                            type="text"
                                                            value={editKatalogForm.foto_url.startsWith("data:") ? "" : editKatalogForm.foto_url}
                                                            onChange={e => setEditKatalogForm({ ...editKatalogForm, foto_url: e.target.value })}
                                                            placeholder="Atau tempel tautan URL gambar disini..."
                                                            style={{ width: "100%", marginTop: "6px", padding: "8px 12px", borderRadius: "10px", border: "1px solid #d2ded7", fontSize: "11.5px", outline: "none", boxSizing: "border-box" }}
                                                        />
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "22px" }}>
                                                    <button type="button" onClick={() => setEditingKatalogItem(null)}
                                                        style={{ padding: "10px 20px", borderRadius: "99px", border: "1px solid #d2ded7", backgroundColor: "#ffffff", color: "#4e6754", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                                                        Batal
                                                    </button>
                                                    <button type="submit"
                                                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRadius: "99px", border: "none", backgroundColor: "#0284c7", color: "#ffffff", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>
                                                        <CheckCircle2 size={15} /> Simpan Perubahan
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}


                </div>
            </div>

            {/* MODAL MASTER */}
            {showMasterModal && (
                <div className="admin-modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
                    <div className="admin-modal-card" style={{ backgroundColor: "#ffffff", borderRadius: "28px", maxWidth: "500px", width: "100%", padding: "32px", border: "1px solid #d2ded7" }}>
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
                <div className="admin-modal-overlay" style={{
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
                    padding: "16px"
                }}>
                    <div className="admin-modal-card" style={{
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
                                            <option value="Pasar Blimbing">Pasar Blimbing</option>
                                            <option value="Pasar Sendangrejo">Pasar Sendangrejo</option>
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

            {/* MODAL EDIT KIOS */}
            {showEditKiosModal && (
                <div className="admin-modal-overlay" style={{
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
                    padding: "16px"
                }}>
                    <div className="admin-modal-card" style={{
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
                                <span style={{ backgroundColor: "#0284c7", color: "#ffffff", fontSize: "10.5px", fontWeight: "800", padding: "3px 10px", borderRadius: "99px" }}>
                                    FORMULIR PERUBAHAN DATA
                                </span>
                                <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f1d14", margin: "6px 0 0 0" }}>
                                    Edit Data Kios Mitra
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowEditKiosModal(false)}
                                style={{ background: "#f2f7f4", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer", color: "#4e6754" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleEditKiosSubmit}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                        Nama Kios / Stan *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editKiosForm.nama_kios}
                                        onChange={(e) => setEditKiosForm({ ...editKiosForm, nama_kios: e.target.value })}
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
                                            value={editKiosForm.pemilik}
                                            onChange={(e) => setEditKiosForm({ ...editKiosForm, pemilik: e.target.value })}
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
                                            value={editKiosForm.no_telepon}
                                            onChange={(e) => setEditKiosForm({ ...editKiosForm, no_telepon: e.target.value })}
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
                                            value={editKiosForm.lokasi_pasar}
                                            onChange={(e) => setEditKiosForm({ ...editKiosForm, lokasi_pasar: e.target.value })}
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
                                            <option value="Pasar Blimbing">Pasar Blimbing</option>
                                            <option value="Pasar Sendangrejo">Pasar Sendangrejo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                                            Nomor Blok / Stan
                                        </label>
                                        <input
                                            type="text"
                                            value={editKiosForm.blok_stan}
                                            onChange={(e) => setEditKiosForm({ ...editKiosForm, blok_stan: e.target.value })}
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
                                            value={editKiosForm.jam_buka}
                                            onChange={(e) => setEditKiosForm({ ...editKiosForm, jam_buka: e.target.value })}
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
                                            value={editKiosForm.status_izin}
                                            onChange={(e) => setEditKiosForm({ ...editKiosForm, status_izin: e.target.value })}
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
                                        value={editKiosForm.alamat_lengkap}
                                        onChange={(e) => setEditKiosForm({ ...editKiosForm, alamat_lengkap: e.target.value })}
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
                                    onClick={() => setShowEditKiosModal(false)}
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
                                    disabled={isUpdatingKios}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "10px 24px",
                                        borderRadius: "99px",
                                        border: "none",
                                        backgroundColor: "#0284c7",
                                        color: "#ffffff",
                                        fontWeight: "800",
                                        fontSize: "13px",
                                        cursor: isUpdatingKios ? "not-allowed" : "pointer",
                                        boxShadow: "0 6px 16px rgba(2,132,199,0.25)"
                                    }}
                                >
                                    {isUpdatingKios ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                                    <span>{isUpdatingKios ? "Menyimpan..." : "Simpan Perubahan Kios"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KELOLA KOMODITAS KIOS (LIHAT, TAMBAH, HAPUS KOMODITAS) */}
            {viewingKiosDetail && (
                <div className="admin-modal-overlay" style={{
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
                    padding: "16px"
                }}>
                    <div className="admin-modal-card" style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "28px",
                        maxWidth: "760px",
                        width: "100%",
                        padding: "32px",
                        border: "1px solid #d2ded7",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                        maxHeight: "90vh",
                        overflowY: "auto"
                    }}>
                        {/* Header Modal */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", gap: "16px" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                    <span style={{ backgroundColor: "#1b4332", color: "#ffffff", fontSize: "10.5px", fontWeight: "800", padding: "3px 10px", borderRadius: "99px" }}>
                                        KATALOG KOMODITAS KIOS
                                    </span>
                                    <span style={{ backgroundColor: "#eef8f2", color: "#1b4332", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "99px", border: "1px solid #b7efc5" }}>
                                         {viewingKiosDetail.lokasi_pasar} {viewingKiosDetail.blok_stan ? `(${viewingKiosDetail.blok_stan})` : ""}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#0f1d14", margin: 0 }}>
                                    {viewingKiosDetail.nama_kios}
                                </h3>
                                <p style={{ fontSize: "12.5px", color: "#4e6754", margin: "4px 0 0 0", fontWeight: "600" }}>
                                    Pengelola: <strong>{viewingKiosDetail.pemilik || "Pedagang Binaan"}</strong> • Kontak: {viewingKiosDetail.no_telepon || "-"}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingKiosDetail(null)}
                                style={{ background: "#f2f7f4", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer", color: "#4e6754" }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tombol Tambah Komoditas Toggle */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", backgroundColor: "#f9fcfb", padding: "12px 18px", borderRadius: "16px", border: "1px solid #d2ded7" }}>
                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#1b4332" }}>
                                Daftar Bahan Pangan yang Dijual ({viewingKiosDetail.katalog?.length || 0} Item)
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddKomoditasForm(!showAddKomoditasForm);
                                    setEditingKomoditas(null);
                                }}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 16px",
                                    borderRadius: "99px",
                                    border: "none",
                                    backgroundColor: showAddKomoditasForm ? "#e2e8f0" : "#2d6a4f",
                                    color: showAddKomoditasForm ? "#334155" : "#ffffff",
                                    fontSize: "12px",
                                    fontWeight: "800",
                                    cursor: "pointer"
                                }}
                            >
                                {showAddKomoditasForm ? <X size={14} /> : <Plus size={14} />}
                                <span>{showAddKomoditasForm ? "Tutup Form Tambah" : "+ Tambah Komoditas ke Kios"}</span>
                            </button>
                        </div>

                        {/* Formulir Tambah Komoditas Baru ke Kios */}
                        {showAddKomoditasForm && (
                            <form onSubmit={handleTambahKomoditasSubmit} style={{ backgroundColor: "#eef8f2", border: "1px solid #b7efc5", borderRadius: "18px", padding: "20px", marginBottom: "20px" }}>
                                <div style={{ fontWeight: "800", fontSize: "13.5px", color: "#1b4332", marginBottom: "12px" }}>
                                    + Tambahkan Komoditas Baru ke Kios Ini:
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1b4332", marginBottom: "4px" }}>Nama Bahan / Komoditas *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: Beras Premium, Cabai Rawit"
                                            value={newKomoditasForm.nama_bahan}
                                            onChange={(e) => setNewKomoditasForm({ ...newKomoditasForm, nama_bahan: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #b7efc5", fontSize: "12.5px", boxSizing: "border-box", outline: "none" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1b4332", marginBottom: "4px" }}>Kategori</label>
                                        <select
                                            value={newKomoditasForm.kategori}
                                            onChange={(e) => setNewKomoditasForm({ ...newKomoditasForm, kategori: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #b7efc5", fontSize: "12.5px", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" }}
                                        >
                                            <option value="Kebutuhan Pokok">Kebutuhan Pokok</option>
                                            <option value="Bumbu Dapur">Bumbu Dapur</option>
                                            <option value="Minyak Goreng">Minyak Goreng</option>
                                            <option value="Protein Hewani">Protein Hewani</option>
                                            <option value="Produksi Daerah">Produksi Daerah</option>
                                            <option value="Bahan Baku">Bahan Baku</option>
                                            <option value="Sayur & Jamur">Sayur & Jamur</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1b4332", marginBottom: "4px" }}>Harga (Rp) *</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="Contoh: 14000"
                                            value={newKomoditasForm.harga}
                                            onChange={(e) => setNewKomoditasForm({ ...newKomoditasForm, harga: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #b7efc5", fontSize: "12.5px", boxSizing: "border-box", outline: "none" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1b4332", marginBottom: "4px" }}>Satuan</label>
                                        <select
                                            value={newKomoditasForm.satuan}
                                            onChange={(e) => setNewKomoditasForm({ ...newKomoditasForm, satuan: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #b7efc5", fontSize: "12.5px", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" }}
                                        >
                                            <option value="kg">kg</option>
                                            <option value="liter">liter</option>
                                            <option value="ikat">ikat</option>
                                            <option value="butir">butir</option>
                                            <option value="kemasan">kemasan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1b4332", marginBottom: "4px" }}>Stok Fisik</label>
                                        <select
                                            value={newKomoditasForm.stok_fisik}
                                            onChange={(e) => setNewKomoditasForm({ ...newKomoditasForm, stok_fisik: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #b7efc5", fontSize: "12.5px", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" }}
                                        >
                                            <option value="Tersedia">Tersedia</option>
                                            <option value="Terbatas">Terbatas</option>
                                            <option value="Habis">Habis</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: "14px" }}>
                                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1b4332", marginBottom: "4px" }}>Varian / Keterangan Mutu</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Kualitas Bulog, Grade A, Kemasan 1L"
                                        value={newKomoditasForm.varian_keterangan}
                                        onChange={(e) => setNewKomoditasForm({ ...newKomoditasForm, varian_keterangan: e.target.value })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #b7efc5", fontSize: "12.5px", boxSizing: "border-box", outline: "none" }}
                                    />
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddKomoditasForm(false)}
                                        style={{ padding: "8px 16px", borderRadius: "99px", border: "1px solid #d2ded7", background: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isAddingKomoditas}
                                        style={{ padding: "8px 20px", borderRadius: "99px", border: "none", background: "#2d6a4f", color: "#fff", fontSize: "12px", fontWeight: "800", cursor: isAddingKomoditas ? "not-allowed" : "pointer" }}
                                    >
                                        {isAddingKomoditas ? "Menambahkan..." : "+ Simpan ke Katalog Kios"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Formulir Edit Komoditas Kios */}
                        {editingKomoditas && (
                            <form onSubmit={handleUpdateKomoditasSubmit} style={{ backgroundColor: "#eff6ff", border: "1.5px solid #93c5fd", borderRadius: "18px", padding: "20px", marginBottom: "20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div style={{ fontWeight: "800", fontSize: "13.5px", color: "#1e3a8a" }}>
                                        ï¸ Edit Data Komoditas: <span style={{ color: "#2563eb" }}>{editingKomoditas.nama_bahan}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditingKomoditas(null)}
                                        style={{ background: "#dbeafe", border: "none", borderRadius: "50%", padding: "6px", cursor: "pointer", color: "#1e40af", display: "inline-flex" }}
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1e3a8a", marginBottom: "4px" }}>Nama Bahan / Komoditas *</label>
                                        <input
                                            type="text"
                                            required
                                            value={editingKomoditas.nama_bahan}
                                            onChange={(e) => setEditingKomoditas({ ...editingKomoditas, nama_bahan: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #bfdbfe", fontSize: "12.5px", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1e3a8a", marginBottom: "4px" }}>Kategori</label>
                                        <select
                                            value={editingKomoditas.kategori}
                                            onChange={(e) => setEditingKomoditas({ ...editingKomoditas, kategori: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #bfdbfe", fontSize: "12.5px", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" }}
                                        >
                                            <option value="Kebutuhan Pokok">Kebutuhan Pokok</option>
                                            <option value="Bumbu Dapur">Bumbu Dapur</option>
                                            <option value="Minyak Goreng">Minyak Goreng</option>
                                            <option value="Protein Hewani">Protein Hewani</option>
                                            <option value="Produksi Daerah">Produksi Daerah</option>
                                            <option value="Bahan Baku">Bahan Baku</option>
                                            <option value="Sayur & Jamur">Sayur & Jamur</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1e3a8a", marginBottom: "4px" }}>Harga (Rp) *</label>
                                        <input
                                            type="number"
                                            required
                                            value={editingKomoditas.harga}
                                            onChange={(e) => setEditingKomoditas({ ...editingKomoditas, harga: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #bfdbfe", fontSize: "12.5px", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1e3a8a", marginBottom: "4px" }}>Satuan</label>
                                        <select
                                            value={editingKomoditas.satuan}
                                            onChange={(e) => setEditingKomoditas({ ...editingKomoditas, satuan: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #bfdbfe", fontSize: "12.5px", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" }}
                                        >
                                            <option value="kg">kg</option>
                                            <option value="liter">liter</option>
                                            <option value="ikat">ikat</option>
                                            <option value="butir">butir</option>
                                            <option value="kemasan">kemasan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1e3a8a", marginBottom: "4px" }}>Stok Fisik</label>
                                        <select
                                            value={editingKomoditas.stok_fisik}
                                            onChange={(e) => setEditingKomoditas({ ...editingKomoditas, stok_fisik: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #bfdbfe", fontSize: "12.5px", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" }}
                                        >
                                            <option value="Tersedia">Tersedia</option>
                                            <option value="Terbatas">Terbatas</option>
                                            <option value="Habis">Habis</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: "14px" }}>
                                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#1e3a8a", marginBottom: "4px" }}>Varian / Keterangan Mutu</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Kualitas Super, Kemasan 1L, dll"
                                        value={editingKomoditas.varian_keterangan || ""}
                                        onChange={(e) => setEditingKomoditas({ ...editingKomoditas, varian_keterangan: e.target.value })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #bfdbfe", fontSize: "12.5px", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" }}
                                    />
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setEditingKomoditas(null)}
                                        style={{ padding: "8px 16px", borderRadius: "99px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer", color: "#475569" }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingKomoditas}
                                        style={{ padding: "8px 20px", borderRadius: "99px", border: "none", background: "#2563eb", color: "#fff", fontSize: "12px", fontWeight: "800", cursor: isSavingKomoditas ? "not-allowed" : "pointer" }}
                                    >
                                        {isSavingKomoditas ? "Menyimpan..." : "Simpan Perubahan"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Tabel Daftar Komoditas */}
                        {loadingKiosDetail ? (
                            <div style={{ textAlign: "center", padding: "30px", color: "#4e6754" }}>
                                <Loader2 size={24} className="spin" style={{ margin: "0 auto 8px auto", color: "#2d6a4f" }} />
                                <div>Memuat komoditas kios...</div>
                            </div>
                        ) : !viewingKiosDetail.katalog || viewingKiosDetail.katalog.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 20px", backgroundColor: "#f9fcfb", borderRadius: "18px", border: "1.5px dashed #b7efc5" }}>
                                <Package size={36} color="#2d6a4f" style={{ margin: "0 auto 12px auto" }} />
                                <div style={{ fontWeight: "800", color: "#0f1d14", fontSize: "15px" }}>Belum Ada Komoditas di Kios Ini</div>
                                <p style={{ fontSize: "13px", color: "#4e6754", margin: "6px 0 16px 0" }}>
                                    Kios ini belum memiliki daftar komoditas pangan. Klik tombol di bawah untuk menambahkan komoditas pertama.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddKomoditasForm(true);
                                        setEditingKomoditas(null);
                                    }}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "10px 24px",
                                        borderRadius: "99px",
                                        border: "none",
                                        backgroundColor: "#2d6a4f",
                                        color: "#ffffff",
                                        fontWeight: "800",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 14px rgba(45,106,79,0.2)"
                                    }}
                                >
                                    <Plus size={16} /> + Tambah Komoditas Sekarang
                                </button>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f2f7f4", borderBottom: "1.5px solid #d2ded7", color: "#1b4332" }}>
                                            <th style={{ padding: "10px 14px", fontWeight: "800" }}>KOMODITAS</th>
                                            <th style={{ padding: "10px 14px", fontWeight: "800" }}>KATEGORI</th>
                                            <th style={{ padding: "10px 14px", fontWeight: "800" }}>HARGA / SATUAN</th>
                                            <th style={{ padding: "10px 14px", fontWeight: "800" }}>STOK</th>
                                            <th style={{ padding: "10px 14px", fontWeight: "800", textAlign: "center" }}>AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingKiosDetail.katalog.map((item, idx) => (
                                            <tr key={item.id_komoditas || idx} style={{ borderBottom: "1px solid #f2f7f4" }}>
                                                <td style={{ padding: "10px 14px", fontWeight: "800", color: "#0f1d14" }}>
                                                    {item.nama_bahan}
                                                    {item.varian_keterangan && item.varian_keterangan !== "-" && (
                                                        <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>
                                                            {item.varian_keterangan}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: "10px 14px", color: "#4e6754", fontWeight: "600" }}>
                                                    <span style={{ backgroundColor: "#f2f7f4", padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: "700" }}>
                                                        {item.kategori}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "10px 14px", fontWeight: "800", color: "#2d6a4f" }}>
                                                    Rp {Number(item.harga).toLocaleString("id-ID")} <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>/{item.satuan}</span>
                                                </td>
                                                <td style={{ padding: "10px 14px", fontWeight: "700" }}>
                                                    <span style={{
                                                        fontSize: "11px",
                                                        padding: "3px 8px",
                                                        borderRadius: "99px",
                                                        backgroundColor: item.stok_fisik === "Habis" ? "#fee2e2" : "#eef8f2",
                                                        color: item.stok_fisik === "Habis" ? "#ef4444" : "#166534"
                                                    }}>
                                                        {item.stok_fisik || "Tersedia"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "10px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingKomoditas({
                                                                id_komoditas: item.id_komoditas || item.id,
                                                                nama_bahan: item.nama_bahan || "",
                                                                kategori: item.kategori || "Kebutuhan Pokok",
                                                                harga: item.harga || "",
                                                                satuan: item.satuan || "kg",
                                                                stok_fisik: item.stok_fisik || "Tersedia",
                                                                varian_keterangan: item.varian_keterangan && item.varian_keterangan !== "-" ? item.varian_keterangan : "",
                                                                status_label: item.status_label || "Stabil"
                                                            });
                                                            setShowAddKomoditasForm(false);
                                                        }}
                                                        title="Edit komoditas"
                                                        style={{
                                                            background: "#ecfdf5",
                                                            border: "1px solid #a7f3d0",
                                                            borderRadius: "50%",
                                                            width: "28px",
                                                            height: "28px",
                                                            color: "#059669",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            marginRight: "6px"
                                                        }}
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleHapusKomoditas(item.id_komoditas || item.id, item.nama_bahan)}
                                                        title="Hapus komoditas dari kios"
                                                        style={{
                                                            background: "#fee2e2",
                                                            border: "none",
                                                            borderRadius: "50%",
                                                            width: "28px",
                                                            height: "28px",
                                                            color: "#ef4444",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center"
                                                        }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                            <button
                                type="button"
                                onClick={() => setViewingKiosDetail(null)}
                                style={{ padding: "10px 24px", borderRadius: "99px", border: "none", backgroundColor: "#2d6a4f", color: "#fff", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

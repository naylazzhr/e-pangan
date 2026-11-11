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
} from "./api";

// Master Komoditas Bahan Pokok & Katalog Dashboard
const MASTER_KATALOG_KOMODITAS = [
    { name: "Beras Medium (IR 64)", kategori: "KEBUTUHAN POKOK", desc: "Beras medium standar Bulog & pasar daerah Lamongan" },
    { name: "Beras Premium Pandan Wangi", kategori: "KEBUTUHAN POKOK", desc: "Beras premium aroma pandan wangi bulir utuh" },
    { name: "Beras Bulog SPHP", kategori: "KEBUTUHAN POKOK", desc: "Beras stabilisasi pasokan dan harga pangan Bulog" },
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
        if (!kiosId || !newKomoditasForm.nama_bahan.trim() || !newKomoditasForm.harga) {
            if (showToast) showToast("Nama bahan dan harga wajib diisi!", "error");
            return;
        }
        setIsAddingKomoditas(true);
        try {
            await tambahKomoditasKios(kiosId, {
                ...newKomoditasForm,
                harga: parseFloat(newKomoditasForm.harga)
            });
            if (showToast) showToast(`Komoditas "${newKomoditasForm.nama_bahan}" berhasil ditambahkan!`, "success");
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
            setViewingKiosDetail({ ...data, id: data.id || data.id_kios || kiosId });
            await fetchKios();
        } catch (err) {
            const msg = err.message || "Gagal menambahkan komoditas ke kios";
            if (showToast) showToast(msg, "error");
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
        if (showToast) showToast("Laporan CSV berhasil diunduh!", "success");
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
                    } catch {}
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
                        } catch {}
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
                } catch {}
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
                } catch {}
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
                            { name: "Foto Katalog", icon: ImageIcon, badge: Object.keys(customPhotos || {}).length },
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
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            className="admin-hamburger-btn"
                            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                            aria-label="Buka Menu"
                            title="Buka Menu Navigasi"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Brand Logo Khusus Tampilan Layar HP */}
                        <div
                            className="admin-mobile-brand"
                            onClick={() => setActivePage("dashboard")}
                            title="Ke Beranda E-Pangan"
                        >
                            <img
                                src={logoEpangan}
                                alt="E-Pangan"
                                style={{ height: "32px", width: "auto", objectFit: "contain", display: "block" }}
                            />
                        </div>

                        <div className="admin-status-badge">
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2d6a4f" }}></span>
                            SISTEM PEMANTAUAN REALTIME
                        </div>

                        <button
                            className="admin-refresh-btn"
                            onClick={handleFullRefresh}
                            disabled={isRefreshing}
                            title="Sinkronisasi Data"
                        >
                            <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
                            <span className="admin-refresh-text">{isRefreshing ? "Sinkron..." : "Refresh"}</span>
                            <span className="admin-sync-time" style={{ color: "#4e6754" }}>• {lastSyncTime}</span>
                        </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ position: "relative" }}>
                            <button
                                className="admin-notif-btn"
                                onClick={() => setShowNotifications(!showNotifications)}
                                title="Notifikasi"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="admin-notif-badge">{unreadCount}</span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="admin-notif-panel" style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "54px",
                                    width: "340px",
                                    maxWidth: "calc(100vw - 24px)",
                                    backgroundColor: "#ffffff",
                                    borderRadius: "20px",
                                    boxShadow: "0 15px 35px rgba(27,67,50,0.15)",
                                    border: "1px solid #d2ded7",
                                    zIndex: 1050,
                                    overflow: "hidden"
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

                        <div className="admin-user-pill">
                            <div className="admin-user-avatar">
                                {currentUser?.nama?.charAt(0) || "A"}
                            </div>
                            <div className="admin-user-text">
                                <div className="admin-user-name">
                                    {currentUser?.nama || "Admin DKPP"}
                                </div>
                                <div className="admin-user-role">
                                    {currentUser?.role === "superadmin" ? "Super Admin" : "Dinas Ketahanan Pangan"}
                                </div>
                            </div>
                        </div>
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
                                    📍 Wilayah Pantau: {currentUser?.wilayah_pantau || "Pasar Sidoharjo & Pasar Lamongan"}
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
                                                        <span>📦 {kios.total_katalog || 0} Komoditas</span>
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

                    {/* TAB 5: MANAJEMEN FOTO KATALOG KOMODITAS */}
                    {activeTab === "Foto Katalog" && (() => {
                        const kategoriPills = [
                            "Semua",
                            "KEBUTUHAN POKOK",
                            "BAHAN BAKU",
                            "BUMBU DAPUR",
                            "PROTEIN HEWANI",
                            "MINYAK GORENG",
                            "SAYUR & JAMUR",
                        ];

                        const filteredKatalog = combinedKatalog.filter((item) => {
                            const clean = item.name.toLowerCase();
                            const matchSearch = clean.includes(fotoSearch.toLowerCase().trim());
                            const matchCategory =
                                fotoCategoryFilter === "Semua" ||
                                (item.kategori || "").toUpperCase().includes(fotoCategoryFilter.toUpperCase());
                            const isCustom = Boolean(customPhotos[clean]);
                            const matchKustom = !hanyaKustomFilter || isCustom;
                            return matchSearch && matchCategory && matchKustom;
                        });

                        const totalKustomCount = Object.keys(customPhotos || {}).length;

                        return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                                {/* HEADER BANNER PENJELASAN */}
                                <div style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "24px",
                                    padding: "26px 30px",
                                    border: "1px solid #d2ded7",
                                    boxShadow: "0 4px 20px rgba(27,67,50,0.04)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "18px"
                                }}>
                                    <div style={{ maxWidth: "680px" }}>
                                        <div style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            backgroundColor: "#eef8f2",
                                            padding: "5px 14px",
                                            borderRadius: "99px",
                                            marginBottom: "10px",
                                            border: "1px solid #b7efc5"
                                        }}>
                                            <Camera size={14} color="#2d6a4f" />
                                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.04em" }}>
                                                PENGATURAN FOTO KATALOG DASHBOARD
                                            </span>
                                        </div>
                                        <h2 style={{ fontSize: "21px", fontWeight: "800", color: "#0f1d14", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                                            Kelola Foto Katalog Komoditas Beranda
                                        </h2>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#4e6754", lineHeight: "1.6" }}>
                                            Admin dapat mengganti dan mengunggah foto komoditas kapan saja langsung dari portal ini tanpa perlu mengedit kode program. Foto yang diganti akan otomatis tersimpan permanen dan langsung tampil di halaman Beranda (Dashboard Publik).
                                        </p>
                                    </div>

                                    {/* Stat Ringkasan Foto */}
                                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                        <div style={{
                                            backgroundColor: "#f2f7f4",
                                            padding: "12px 18px",
                                            borderRadius: "16px",
                                            border: "1px solid #d2ded7",
                                            textAlign: "center",
                                            minWidth: "110px"
                                        }}>
                                            <div style={{ fontSize: "10.5px", fontWeight: "800", color: "#4e6754", letterSpacing: "0.04em" }}>TOTAL KATALOG</div>
                                            <div style={{ fontSize: "22px", fontWeight: "800", color: "#1b4332", marginTop: "2px" }}>
                                                {combinedKatalog.length}
                                            </div>
                                        </div>
                                        <div style={{
                                            backgroundColor: totalKustomCount > 0 ? "#eef8f2" : "#f2f7f4",
                                            padding: "12px 18px",
                                            borderRadius: "16px",
                                            border: totalKustomCount > 0 ? "1px solid #b7efc5" : "1px solid #d2ded7",
                                            textAlign: "center",
                                            minWidth: "110px"
                                        }}>
                                            <div style={{ fontSize: "10.5px", fontWeight: "800", color: totalKustomCount > 0 ? "#2d6a4f" : "#4e6754", letterSpacing: "0.04em" }}>FOTO KUSTOM</div>
                                            <div style={{ fontSize: "22px", fontWeight: "800", color: totalKustomCount > 0 ? "#2d6a4f" : "#4e6754", marginTop: "2px" }}>
                                                {totalKustomCount}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TOOLBAR PENCARIAN & FILTER KATEGORI */}
                                <div style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "24px",
                                    padding: "20px 24px",
                                    border: "1px solid #d2ded7",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "16px",
                                    boxShadow: "0 4px 16px rgba(27,67,50,0.03)"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                                        {/* Input Cari */}
                                        <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
                                            <Search size={16} color="#4e6754" style={{ position: "absolute", left: "14px", top: "12px" }} />
                                            <input
                                                type="text"
                                                placeholder="Cari komoditas (misal: Gula Aren, Jagung, Telur)..."
                                                value={fotoSearch}
                                                onChange={(e) => setFotoSearch(e.target.value)}
                                                style={{
                                                    padding: "10px 14px 10px 38px",
                                                    borderRadius: "99px",
                                                    border: "1px solid #d2ded7",
                                                    fontSize: "13px",
                                                    outline: "none",
                                                    backgroundColor: "#f2f7f4",
                                                    fontWeight: "600",
                                                    width: "100%",
                                                    boxSizing: "border-box"
                                                }}
                                            />
                                            {fotoSearch && (
                                                <button
                                                    onClick={() => setFotoSearch("")}
                                                    style={{ position: "absolute", right: "12px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "#4e6754" }}
                                                >
                                                    <X size={15} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Filter Kustom Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setHanyaKustomFilter(!hanyaKustomFilter)}
                                            style={{
                                                padding: "9px 18px",
                                                borderRadius: "99px",
                                                border: hanyaKustomFilter ? "1.5px solid #2d6a4f" : "1px solid #d2ded7",
                                                backgroundColor: hanyaKustomFilter ? "#1b4332" : "#ffffff",
                                                color: hanyaKustomFilter ? "#ffffff" : "#4e6754",
                                                fontSize: "12.5px",
                                                fontWeight: "800",
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                transition: "all 0.15s"
                                            }}
                                        >
                                            <Camera size={14} />
                                            <span>Hanya Foto Kustom ({totalKustomCount})</span>
                                        </button>
                                    </div>

                                    {/* Kategori Filter Pills */}
                                    <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                                        {kategoriPills.map((kat) => {
                                            const isActive = fotoCategoryFilter === kat;
                                            return (
                                                <button
                                                    key={kat}
                                                    type="button"
                                                    onClick={() => setFotoCategoryFilter(kat)}
                                                    style={{
                                                        padding: "6px 14px",
                                                        borderRadius: "99px",
                                                        border: isActive ? "1.5px solid #2d6a4f" : "1px solid #d2ded7",
                                                        backgroundColor: isActive ? "#eef8f2" : "#ffffff",
                                                        color: isActive ? "#1b4332" : "#4e6754",
                                                        fontSize: "11.5px",
                                                        fontWeight: isActive ? "800" : "600",
                                                        cursor: "pointer",
                                                        whiteSpace: "nowrap",
                                                        transition: "all 0.15s"
                                                    }}
                                                >
                                                    {kat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* GRID DAFTAR KOMODITAS & FOTONYA */}
                                {filteredKatalog.length === 0 ? (
                                    <div style={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "24px",
                                        padding: "48px 20px",
                                        textAlign: "center",
                                        border: "1px solid #d2ded7"
                                    }}>
                                        <Camera size={36} color="#9ca3af" style={{ margin: "0 auto 12px" }} />
                                        <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#0f1d14" }}>
                                            Komoditas Tidak Ditemukan
                                        </h4>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#4e6754" }}>
                                            Coba ubah kata kunci pencarian atau pilih kategori lain.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                                        gap: "20px"
                                    }}>
                                        {filteredKatalog.map((item, idx) => {
                                            const cleanKey = item.name.toLowerCase().trim();
                                            const isCustom = Boolean(customPhotos[cleanKey]);
                                            const currentImg =
                                                customPhotos[cleanKey] ||
                                                (getKomoditasImage ? getKomoditasImage(item.name) : null);
                                            const isUploadingThis = uploadingName === item.name;

                                            return (
                                                <div
                                                    key={item.name}
                                                    style={{
                                                        backgroundColor: "#ffffff",
                                                        borderRadius: "24px",
                                                        padding: "18px",
                                                        border: isCustom ? "2px solid #52b788" : "1px solid #d2ded7",
                                                        boxShadow: isCustom
                                                            ? "0 6px 20px rgba(82, 183, 136, 0.12)"
                                                            : "0 2px 12px rgba(27,67,50,0.03)",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "space-between",
                                                        gap: "14px",
                                                        position: "relative",
                                                        transition: "all 0.2s"
                                                    }}
                                                >
                                                    {/* Hidden File Input untuk komoditas ini */}
                                                    <input
                                                        type="file"
                                                        id={`upload-foto-item-${idx}`}
                                                        accept="image/jpeg,image/png,image/jpg,image/webp,image/svg+xml"
                                                        style={{ display: "none" }}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleUploadPhoto(item.name, file);
                                                            e.target.value = "";
                                                        }}
                                                    />

                                                    {/* Header Card: Kategori & Status Badge */}
                                                    <div>
                                                        <div style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            marginBottom: "12px",
                                                            flexWrap: "wrap"
                                                        }}>
                                                            <span style={{
                                                                fontSize: "10px",
                                                                fontWeight: "800",
                                                                color: "#2d6a4f",
                                                                backgroundColor: "#eef8f2",
                                                                padding: "4px 10px",
                                                                borderRadius: "99px",
                                                                letterSpacing: "0.04em",
                                                                border: "1px solid #b7efc5"
                                                            }}>
                                                                {item.kategori || "KEBUTUHAN POKOK"}
                                                            </span>

                                                            {isCustom ? (
                                                                <span style={{
                                                                    fontSize: "10.5px",
                                                                    fontWeight: "800",
                                                                    color: "#1b4332",
                                                                    backgroundColor: "#b7efc5",
                                                                    padding: "4px 10px",
                                                                    borderRadius: "99px",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px"
                                                                }}>
                                                                    ⭐ Foto Kustom
                                                                </span>
                                                            ) : (
                                                                <span style={{
                                                                    fontSize: "10.5px",
                                                                    fontWeight: "700",
                                                                    color: "#6b8f71",
                                                                    backgroundColor: "#f4f8f5",
                                                                    padding: "4px 10px",
                                                                    borderRadius: "99px"
                                                                }}>
                                                                    Bawaan
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Preview Gambar Box */}
                                                        <div
                                                            onClick={() => {
                                                                const el = document.getElementById(`upload-foto-item-${idx}`);
                                                                if (el) el.click();
                                                            }}
                                                            title="Klik untuk mengganti foto komoditas ini"
                                                            style={{
                                                                width: "100%",
                                                                height: "175px",
                                                                borderRadius: "16px",
                                                                overflow: "hidden",
                                                                backgroundColor: "#f2f7f4",
                                                                position: "relative",
                                                                cursor: "pointer",
                                                                border: "1px solid #e2ece6",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center"
                                                            }}
                                                        >
                                                            {currentImg ? (
                                                                <img
                                                                    src={currentImg}
                                                                    alt={item.name}
                                                                    style={{
                                                                        width: "100%",
                                                                        height: "100%",
                                                                        objectFit: "cover",
                                                                        display: "block",
                                                                        transition: "transform 0.25s"
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div style={{ textAlign: "center", padding: "16px", color: "#6b8f71" }}>
                                                                    <Camera size={32} style={{ margin: "0 auto 6px", opacity: 0.5 }} />
                                                                    <div style={{ fontSize: "11px", fontWeight: "700" }}>Pilih Foto</div>
                                                                </div>
                                                            )}

                                                            {/* Overlay jika sedang mengunggah */}
                                                            {isUploadingThis && (
                                                                <div style={{
                                                                    position: "absolute",
                                                                    inset: 0,
                                                                    backgroundColor: "rgba(27,67,50,0.85)",
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    color: "#ffffff",
                                                                    gap: "8px",
                                                                    backdropFilter: "blur(2px)"
                                                                }}>
                                                                    <Loader2 size={24} style={{ animation: "ch-spin 1s linear infinite" }} />
                                                                    <span style={{ fontSize: "12px", fontWeight: "800" }}>Mengunggah...</span>
                                                                </div>
                                                            )}

                                                            {/* Hover prompt kecil di pojok kanan bawah */}
                                                            <div style={{
                                                                position: "absolute",
                                                                right: "8px",
                                                                bottom: "8px",
                                                                backgroundColor: "rgba(17, 34, 22, 0.8)",
                                                                backdropFilter: "blur(4px)",
                                                                color: "#ffffff",
                                                                borderRadius: "99px",
                                                                padding: "4px 10px",
                                                                fontSize: "10.5px",
                                                                fontWeight: "800",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "5px"
                                                            }}>
                                                                <Camera size={12} />
                                                                <span>Ganti</span>
                                                            </div>
                                                        </div>

                                                        {/* Judul & Keterangan Bahan */}
                                                        <div style={{ marginTop: "12px" }}>
                                                            <h3 style={{
                                                                margin: "0 0 4px 0",
                                                                fontSize: "15px",
                                                                fontWeight: "800",
                                                                color: "#0f1d14",
                                                                lineHeight: "1.3"
                                                            }}>
                                                                {item.name}
                                                            </h3>
                                                            <p style={{
                                                                margin: 0,
                                                                fontSize: "11.5px",
                                                                color: "#4e6754",
                                                                lineHeight: "1.4"
                                                            }}>
                                                                {item.desc || "Komoditas pangan resmi pantauan pasar DKPP Lamongan"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Tombol Aksi */}
                                                    <div style={{
                                                        borderTop: "1px solid #f2f7f4",
                                                        paddingTop: "12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px"
                                                    }}>
                                                        {/* Tombol Unggah Langsung dari Komputer/HP */}
                                                        <button
                                                            type="button"
                                                            disabled={isUploadingThis}
                                                            onClick={() => {
                                                                const el = document.getElementById(`upload-foto-item-${idx}`);
                                                                if (el) el.click();
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                backgroundColor: "#1b4332",
                                                                color: "#ffffff",
                                                                border: "none",
                                                                borderRadius: "12px",
                                                                padding: "9px 12px",
                                                                fontSize: "12px",
                                                                fontWeight: "800",
                                                                cursor: "pointer",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                gap: "6px",
                                                                fontFamily: "inherit",
                                                                transition: "all 0.15s"
                                                            }}
                                                        >
                                                            <UploadCloud size={14} />
                                                            <span>Upload Foto</span>
                                                        </button>

                                                        {/* Tombol Link URL */}
                                                        <button
                                                            type="button"
                                                            title="Masukkan URL Gambar Web"
                                                            onClick={() => {
                                                                setUrlModalItem(item);
                                                                setUrlInputVal(customPhotos[cleanKey] || "");
                                                            }}
                                                            style={{
                                                                backgroundColor: "#ffffff",
                                                                color: "#1b4332",
                                                                border: "1px solid #d2ded7",
                                                                borderRadius: "12px",
                                                                padding: "9px 11px",
                                                                fontSize: "12px",
                                                                fontWeight: "700",
                                                                cursor: "pointer",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                transition: "all 0.15s"
                                                            }}
                                                        >
                                                            <LinkIcon size={14} />
                                                        </button>

                                                        {/* Tombol Reset ke Default (Hanya jika sedang memakai foto kustom) */}
                                                        {isCustom && (
                                                            <button
                                                                type="button"
                                                                title="Reset ke Foto Bawaan"
                                                                onClick={() => handleResetPhoto(item.name)}
                                                                style={{
                                                                    backgroundColor: "#fef2f2",
                                                                    color: "#dc2626",
                                                                    border: "1px solid #fecaca",
                                                                    borderRadius: "12px",
                                                                    padding: "9px 11px",
                                                                    fontSize: "12px",
                                                                    fontWeight: "700",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    transition: "all 0.15s"
                                                                }}
                                                            >
                                                                <RotateCcw size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* MODAL INPUT URL GAMBAR */}
                                {urlModalItem && (
                                    <div
                                        className="admin-modal-overlay"
                                        style={{
                                            position: "fixed",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: "rgba(15, 23, 42, 0.6)",
                                            backdropFilter: "blur(4px)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            zIndex: 2000,
                                            padding: "16px"
                                        }}
                                    >
                                        <div
                                            className="admin-modal-card"
                                            style={{
                                                backgroundColor: "#ffffff",
                                                borderRadius: "28px",
                                                maxWidth: "480px",
                                                width: "100%",
                                                padding: "28px 30px",
                                                border: "1px solid #d2ded7",
                                                boxShadow: "0 20px 45px rgba(0,0,0,0.2)"
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <LinkIcon size={18} color="#2d6a4f" />
                                                    <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f1d14", margin: 0 }}>
                                                        Setel URL Foto Komoditas
                                                    </h3>
                                                </div>
                                                <button
                                                    onClick={() => { setUrlModalItem(null); setUrlInputVal(""); }}
                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#4e6754" }}
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            <div style={{ marginBottom: "16px" }}>
                                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2d6a4f", textTransform: "uppercase" }}>
                                                    Komoditas:
                                                </span>
                                                <h4 style={{ margin: "2px 0 10px 0", fontSize: "16px", fontWeight: "800", color: "#0f1d14" }}>
                                                    {urlModalItem.name}
                                                </h4>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4e6754", marginBottom: "6px" }}>
                                                    Tautan URL Gambar (https://... atau /uploads/...)
                                                </label>
                                                <input
                                                    type="url"
                                                    placeholder="https://example.com/foto-komoditas.jpg"
                                                    value={urlInputVal}
                                                    onChange={(e) => setUrlInputVal(e.target.value)}
                                                    style={{
                                                        width: "100%",
                                                        boxSizing: "border-box",
                                                        padding: "12px 16px",
                                                        borderRadius: "14px",
                                                        border: "1px solid #d2ded7",
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        fontFamily: "inherit",
                                                        outline: "none",
                                                        backgroundColor: "#f4f8f5"
                                                    }}
                                                />
                                            </div>

                                            {/* Preview URL jika terisi */}
                                            {urlInputVal && (
                                                <div style={{ marginBottom: "18px", textAlign: "center" }}>
                                                    <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#4e6754", marginBottom: "6px" }}>
                                                        Preview Gambar:
                                                    </span>
                                                    <div style={{
                                                        width: "100%",
                                                        height: "140px",
                                                        borderRadius: "14px",
                                                        overflow: "hidden",
                                                        backgroundColor: "#f2f7f4",
                                                        border: "1px solid #d2ded7"
                                                    }}>
                                                        <img
                                                            src={urlInputVal}
                                                            alt="Preview"
                                                            onError={(e) => { e.target.style.display = "none"; }}
                                                            onLoad={(e) => { e.target.style.display = "block"; }}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => { setUrlModalItem(null); setUrlInputVal(""); }}
                                                    style={{
                                                        padding: "10px 18px",
                                                        borderRadius: "99px",
                                                        border: "1px solid #d2ded7",
                                                        backgroundColor: "#ffffff",
                                                        color: "#4e6754",
                                                        fontSize: "13px",
                                                        fontWeight: "700",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!urlInputVal.trim()}
                                                    onClick={() => handleSaveUrlPhoto(urlModalItem.name, urlInputVal)}
                                                    style={{
                                                        padding: "10px 22px",
                                                        borderRadius: "99px",
                                                        border: "none",
                                                        backgroundColor: "#1b4332",
                                                        color: "#ffffff",
                                                        fontSize: "13px",
                                                        fontWeight: "800",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Simpan Foto
                                                </button>
                                            </div>
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
                                        📍 {viewingKiosDetail.lokasi_pasar} {viewingKiosDetail.blok_stan ? `(${viewingKiosDetail.blok_stan})` : ""}
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
                                    ➕ Tambahkan Komoditas Baru ke Kios Ini:
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
                                        ✏️ Edit Data Komoditas: <span style={{ color: "#2563eb" }}>{editingKomoditas.nama_bahan}</span>
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
                            <div style={{ textAlign: "center", padding: "40px 20px", backgroundColor: "#f9fcfb", borderRadius: "18px", border: "1px dashed #b7efc5" }}>
                                <Package size={32} color="#2d6a4f" style={{ margin: "0 auto 10px auto" }} />
                                <div style={{ fontWeight: "800", color: "#0f1d14", fontSize: "14px" }}>Belum Ada Komoditas di Kios Ini</div>
                                <p style={{ fontSize: "12.5px", color: "#4e6754", margin: "4px 0 14px 0" }}>
                                    Kios ini belum memiliki daftar komoditas pangan. Klik tombol di atas untuk menambahkan.
                                </p>
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
import React, { useState, useEffect, useCallback } from "react";
import {
  Store,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Navigation,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import {
  getSemuaKios,
  getDetailKios,
  updateDetailKios,
  tambahKomoditasKios,
  updateKomoditasKios,
  hapusKomoditasKios,
  isLoggedIn,
} from "./api";

function formatRupiah(amount) {
  if (amount === undefined || amount === null) return "Rp 0";
  return "Rp " + Number(amount).toLocaleString("id-ID");
}

export default function DetailKios({ onBack, showToast, setActivePage }) {
  const [kiosList, setKiosList] = useState([]);
  const [selectedKiosId, setSelectedKiosId] = useState(1);
  const [kiosDetail, setKiosDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal states
  const [showEditKiosModal, setShowEditKiosModal] = useState(false);
  const [kiosFormData, setKiosFormData] = useState({
    nama_kios: "",
    pemilik: "",
    lokasi_pasar: "",
    blok_stan: "",
    alamat_lengkap: "",
    jam_buka: "",
    no_telepon: "",
  });

  const [showKomoditasModal, setShowKomoditasModal] = useState(false);
  const [editingKomoditasId, setEditingKomoditasId] = useState(null);
  const [komoditasFormData, setKomoditasFormData] = useState({
    nama_bahan: "",
    harga: "",
    satuan: "kg",
    status_label: "Sesuai HET",
    varian_keterangan: "",
    stok_fisik: "Tersedia",
    kategori: "KEBUTUHAN POKOK",
  });

  const isAdmin = isLoggedIn();

  // 1. Fetch seluruh kios
  const fetchKiosList = useCallback(async () => {
    try {
      const res = await getSemuaKios();
      if (res && res.data) {
        setKiosList(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat daftar kios:", err);
    }
  }, []);

  // 2. Fetch detail kios terpilih
  const fetchDetail = useCallback(async (id) => {
    setIsLoading(true);
    try {
      const res = await getDetailKios(id);
      setKiosDetail(res);
      setKiosFormData({
        nama_kios: res.nama_kios || "",
        pemilik: res.pemilik || "",
        lokasi_pasar: res.lokasi_pasar || "",
        blok_stan: res.blok_stan || res.blok || "",
        alamat_lengkap: res.alamat_lengkap || "",
        jam_buka: res.jam_buka || "",
        no_telepon: res.no_telepon || "",
      });
    } catch (err) {
      console.error("Gagal memuat detail kios:", err);
      if (showToast) showToast("Gagal memuat detail kios: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchKiosList();
  }, [fetchKiosList]);

  useEffect(() => {
    if (selectedKiosId) {
      fetchDetail(selectedKiosId);
    }
  }, [selectedKiosId, fetchDetail]);

  // Handle Simpan Edit Profil Kios
  const handleSaveKios = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await updateDetailKios(selectedKiosId, kiosFormData);
      if (showToast) showToast(res.message || "Data Kios berhasil diperbarui!", "success");
      setShowEditKiosModal(false);
      fetchDetail(selectedKiosId);
      fetchKiosList();
    } catch (err) {
      if (showToast) showToast("Gagal memperbarui kios: " + err.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Buka Modal Tambah Komoditas
  const openAddKomoditas = () => {
    setEditingKomoditasId(null);
    setKomoditasFormData({
      nama_bahan: "",
      harga: "",
      satuan: "kg",
      status_label: "Sesuai HET",
      varian_keterangan: "",
      stok_fisik: "Tersedia",
      kategori: "KEBUTUHAN POKOK",
    });
    setShowKomoditasModal(true);
  };

  // Buka Modal Edit Komoditas
  const openEditKomoditas = (item) => {
    setEditingKomoditasId(item.id_komoditas);
    setKomoditasFormData({
      nama_bahan: item.nama_bahan,
      harga: item.harga,
      satuan: item.satuan,
      status_label: item.status_label,
      varian_keterangan: item.varian_keterangan,
      stok_fisik: item.stok_fisik,
      kategori: item.kategori,
    });
    setShowKomoditasModal(true);
  };

  // Handle Simpan Komoditas (Tambah / Edit)
  const handleSaveKomoditas = async (e) => {
    e.preventDefault();
    if (!komoditasFormData.nama_bahan || !komoditasFormData.harga) {
      if (showToast) showToast("Nama komoditas dan harga wajib diisi!", "error");
      return;
    }

    setIsUpdating(true);
    try {
      const payload = {
        ...komoditasFormData,
        harga: Number(komoditasFormData.harga),
      };

      if (editingKomoditasId) {
        const res = await updateKomoditasKios(selectedKiosId, editingKomoditasId, payload);
        if (showToast) showToast(res.message || "Komoditas berhasil diperbarui!", "success");
      } else {
        const res = await tambahKomoditasKios(selectedKiosId, payload);
        if (showToast) showToast(res.message || "Komoditas berhasil ditambahkan!", "success");
      }

      setShowKomoditasModal(false);
      fetchDetail(selectedKiosId);
    } catch (err) {
      if (showToast) showToast("Gagal menyimpan komoditas: " + err.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Hapus Komoditas
  const handleDeleteKomoditas = async (komoditasId, namaBahan) => {
    if (!window.confirm(`Yakin ingin menghapus komoditas "${namaBahan}" dari katalog kios ini?`)) {
      return;
    }

    try {
      const res = await hapusKomoditasKios(selectedKiosId, komoditasId);
      if (showToast) showToast(res.message || "Komoditas berhasil dihapus", "info");
      fetchDetail(selectedKiosId);
    } catch (err) {
      if (showToast) showToast("Gagal menghapus komoditas: " + err.message, "error");
    }
  };

  // Filter katalog berdasarkan search
  const filteredKatalog = (kiosDetail?.katalog || []).filter((item) =>
    item.nama_bahan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.varian_keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.kategori && item.kategori.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "28px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* TOP BAR / BREADCRUMB */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <button
            onClick={onBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#0f172a",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <ArrowLeft size={16} /> Kembali ke Beranda
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isAdmin ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                <CheckCircle2 size={14} /> Mode Admin Aktif (Bisa Update Katalog &amp; Alamat)
              </span>
            ) : (
              <button
                onClick={() => setActivePage && setActivePage("login")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#047857",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Login Admin untuk Kelola
              </button>
            )}
          </div>
        </div>

        {/* SELECTOR KIOS */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#047857", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                DIREKTORI KIOS MITRA RESMI
              </span>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "4px 0 0 0" }}>
                Pilih Kios Pasar di Kabupaten Lamongan
              </h2>
            </div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Total <strong>{kiosList.length}</strong> Kios Terdaftar
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
            {kiosList.map((k) => (
              <button
                key={k.id}
                onClick={() => setSelectedKiosId(k.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: selectedKiosId === k.id ? "2px solid #047857" : "1px solid #e2e8f0",
                  backgroundColor: selectedKiosId === k.id ? "#ecfdf5" : "#ffffff",
                  color: selectedKiosId === k.id ? "#065f46" : "#334155",
                  fontWeight: selectedKiosId === k.id ? "700" : "500",
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <Store size={14} color={selectedKiosId === k.id ? "#047857" : "#94a3b8"} />
                <span>{k.nama_kios}</span>
                <small style={{ fontSize: "11px", opacity: 0.75 }}>({k.lokasi_pasar})</small>
              </button>
            ))}
          </div>
        </div>

        {isLoading || !kiosDetail ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
            <RefreshCw size={32} className="spinning-icon" style={{ marginBottom: "12px", color: "#047857" }} />
            <p>Memuat rincian kios &amp; katalog komoditas...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
            {/* HERO PROFILE KIOS & ALAMAT TERKONEKSI */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span
                      style={{
                        backgroundColor: "#ecfdf5",
                        color: "#047857",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "700",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <ShieldCheck size={13} /> {kiosDetail.status_izin}
                    </span>
                    <span
                      style={{
                        backgroundColor: kiosDetail.status_buka_sekarang ? "#dcfce7" : "#fee2e2",
                        color: kiosDetail.status_buka_sekarang ? "#166534" : "#991b1b",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      ● {kiosDetail.status_buka_sekarang ? "BUKA SEKARANG" : "TUTUP"}
                    </span>
                  </div>

                  <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                    {kiosDetail.nama_kios}
                  </h1>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Penanggung Jawab / Pemilik: <strong>{kiosDetail.pemilik}</strong> • Stan: <strong>{kiosDetail.blok_stan || kiosDetail.blok}</strong>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setShowEditKiosModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    <Edit2 size={14} /> Edit Kios &amp; Alamat
                  </button>

                  <a
                    href={kiosDetail.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "#047857",
                      border: "none",
                      color: "#ffffff",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      textDecoration: "none",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Navigation size={14} /> Buka Google Maps
                  </a>
                </div>
              </div>

              {/* DETAIL INFO & ALAMAT KIOS (MASIH NYAMBUNG) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "16px",
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                    <MapPin size={14} color="#047857" />
                    <strong>Alamat Lengkap Kios:</strong>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a", lineHeight: "1.4" }}>
                    {kiosDetail.alamat_lengkap}
                  </div>
                  <small style={{ color: "#047857", fontWeight: "500", display: "block", marginTop: "2px" }}>
                    ✓ Terhubung ke {kiosDetail.lokasi_pasar} (Lamongan)
                  </small>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                    <Clock size={14} color="#047857" />
                    <strong>Jam Operasional &amp; Status:</strong>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                    {kiosDetail.jam_buka}
                  </div>
                  <small style={{ color: "#64748b" }}>Update: {kiosDetail.waktu_update_terakhir}</small>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                    <Phone size={14} color="#047857" />
                    <strong>Kontak / WhatsApp:</strong>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                    {kiosDetail.no_telepon}
                  </div>
                  <small style={{ color: "#64748b" }}>Layanan Konsumen &amp; Pemesanan</small>
                </div>
              </div>

              {/* EMBED PETA GOOGLE MAPS LOKASI KIOS & PASAR */}
              <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0", height: "180px", position: "relative" }}>
                <iframe
                  title={`Maps Lokasi ${kiosDetail.nama_kios}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(kiosDetail.alamat_lengkap || (kiosDetail.lokasi_pasar + ' Lamongan'))}&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
                <div
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    left: "8px",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#065f46",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  📍 Titik Pasar: {kiosDetail.lokasi_pasar} • Stan: {kiosDetail.blok_stan}
                </div>
              </div>
            </div>

            {/* KATALOG KOMODITAS KIOS (BISA UPDATE SESUAI ADMIN) */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShoppingBag size={20} color="#047857" />
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                      Katalog Komoditas Pangan Kios
                    </h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                    Daftar harga komoditas (Nama, Harga satuan/kg, Status &amp; Keterangan varian mutu).
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
                    <input
                      type="text"
                      placeholder="Cari dalam katalog..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        padding: "7px 12px 7px 32px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        width: "180px",
                      }}
                    />
                  </div>

                  <button
                    onClick={openAddKomoditas}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "#047857",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Plus size={16} /> Tambah Komoditas
                  </button>
                </div>
              </div>

              {/* TABEL KATALOG KOMODITAS */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "12px", color: "#475569", fontWeight: "700" }}>KOMODITAS</th>
                      <th style={{ padding: "12px", color: "#475569", fontWeight: "700" }}>KETERANGAN / MUTU</th>
                      <th style={{ padding: "12px", color: "#475569", fontWeight: "700" }}>HARGA SATUAN</th>
                      <th style={{ padding: "12px", color: "#475569", fontWeight: "700" }}>STATUS &amp; STOK</th>
                      <th style={{ padding: "12px", color: "#475569", fontWeight: "700", textAlign: "center" }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKatalog.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "40px 12px", color: "#94a3b8" }}>
                          Belum ada komoditas di katalog kios ini. Klik tombol <strong>+ Tambah Komoditas</strong> untuk menambahkan.
                        </td>
                      </tr>
                    ) : (
                      filteredKatalog.map((item) => (
                        <tr key={item.id_komoditas} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          {/* Nama Komoditas */}
                          <td style={{ padding: "14px 12px" }}>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>{item.nama_bahan}</div>
                            <small style={{ color: "#64748b" }}>{item.kategori}</small>
                          </td>

                          {/* Keterangan & Varian Mutu */}
                          <td style={{ padding: "14px 12px" }}>
                            <span style={{ color: "#334155", fontWeight: "500" }}>{item.varian_keterangan}</span>
                          </td>

                          {/* Harga Satuan */}
                          <td style={{ padding: "14px 12px" }}>
                            <span style={{ fontWeight: "800", color: "#047857", fontSize: "14px" }}>
                              {formatRupiah(item.harga)}
                            </span>
                            <span style={{ color: "#64748b", fontSize: "12px" }}> /{item.satuan}</span>
                          </td>

                          {/* Status & Stok */}
                          <td style={{ padding: "14px 12px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  backgroundColor: item.status_label?.includes("+")
                                    ? "#fee2e2"
                                    : item.status_label?.includes("Turun")
                                    ? "#ecfdf5"
                                    : "#e0f2fe",
                                  color: item.status_label?.includes("+")
                                    ? "#b91c1c"
                                    : item.status_label?.includes("Turun")
                                    ? "#047857"
                                    : "#0369a1",
                                  width: "fit-content",
                                }}
                              >
                                {item.status_label}
                              </span>
                              <small style={{ color: "#64748b" }}>Stok: {item.stok_fisik}</small>
                            </div>
                          </td>

                          {/* Tombol Aksi */}
                          <td style={{ padding: "14px 12px", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                onClick={() => openEditKomoditas(item)}
                                title="Edit Komoditas"
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                  backgroundColor: "#ffffff",
                                  color: "#334155",
                                  cursor: "pointer",
                                }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteKomoditas(item.id_komoditas, item.nama_bahan)}
                                title="Hapus Komoditas"
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  border: "1px solid #fecaca",
                                  backgroundColor: "#fff5f5",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDIT KIOS & ALAMAT */}
        {showEditKiosModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "520px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "24px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Edit Profil &amp; Alamat Kios
                </h3>
                <button onClick={() => setShowEditKiosModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveKios} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    NAMA KIOS
                  </label>
                  <input
                    type="text"
                    required
                    value={kiosFormData.nama_kios}
                    onChange={(e) => setKiosFormData({ ...kiosFormData, nama_kios: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    NAMA PEMILIK / PENANGGUNG JAWAB
                  </label>
                  <input
                    type="text"
                    value={kiosFormData.pemilik}
                    onChange={(e) => setKiosFormData({ ...kiosFormData, pemilik: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      LOKASI PASAR
                    </label>
                    <input
                      type="text"
                      required
                      value={kiosFormData.lokasi_pasar}
                      onChange={(e) => setKiosFormData({ ...kiosFormData, lokasi_pasar: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      BLOK / NOMOR STAN
                    </label>
                    <input
                      type="text"
                      value={kiosFormData.blok_stan}
                      onChange={(e) => setKiosFormData({ ...kiosFormData, blok_stan: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    ALAMAT LENGKAP KIOS (TERSAMBUNG KE PASAR LAMONGAN)
                  </label>
                  <textarea
                    rows="3"
                    value={kiosFormData.alamat_lengkap}
                    onChange={(e) => setKiosFormData({ ...kiosFormData, alamat_lengkap: e.target.value })}
                    placeholder="Contoh: Pasar Babat, Jl. Raya Babat No. 12, Blok A-12, Babat, Lamongan"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      JAM OPERASIONAL
                    </label>
                    <input
                      type="text"
                      value={kiosFormData.jam_buka}
                      onChange={(e) => setKiosFormData({ ...kiosFormData, jam_buka: e.target.value })}
                      placeholder="06:00 - 16:30 WIB"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      NO. TELEPON / WHATSAPP
                    </label>
                    <input
                      type="text"
                      value={kiosFormData.no_telepon}
                      onChange={(e) => setKiosFormData({ ...kiosFormData, no_telepon: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowEditKiosModal(false)}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#047857",
                      color: "#fff",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {isUpdating ? "Menyimpan..." : "Simpan Perubahan Kios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH / EDIT KOMODITAS KATALOG */}
        {showKomoditasModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "500px",
                padding: "24px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  {editingKomoditasId ? "Edit Komoditas Katalog" : "Tambah Komoditas ke Katalog"}
                </h3>
                <button onClick={() => setShowKomoditasModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveKomoditas} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    NAMA KOMODITAS PANGAN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Beras Medium (IR 64), Minyakita"
                    value={komoditasFormData.nama_bahan}
                    onChange={(e) => setKomoditasFormData({ ...komoditasFormData, nama_bahan: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      HARGA SATUAN (RP) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      placeholder="Contoh: 13000"
                      value={komoditasFormData.harga}
                      onChange={(e) => setKomoditasFormData({ ...komoditasFormData, harga: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      SATUAN
                    </label>
                    <select
                      value={komoditasFormData.satuan}
                      onChange={(e) => setKomoditasFormData({ ...komoditasFormData, satuan: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    >
                      <option value="kg">kg</option>
                      <option value="liter">liter</option>
                      <option value="butir">butir</option>
                      <option value="ikat">ikat</option>
                      <option value="bungkus">bungkus</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    KETERANGAN / SPESIFIKASI MUTU *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kualitas Bulog Premium, Grade A Bulir Utuh, Minyakita Kemasan 1L"
                    value={komoditasFormData.varian_keterangan}
                    onChange={(e) => setKomoditasFormData({ ...komoditasFormData, varian_keterangan: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      STATUS HARGA / HET
                    </label>
                    <select
                      value={komoditasFormData.status_label}
                      onChange={(e) => setKomoditasFormData({ ...komoditasFormData, status_label: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    >
                      <option value="Sesuai HET">Sesuai HET</option>
                      <option value="Stabil">Stabil</option>
                      <option value="+12% di atas HET">+12% di atas HET</option>
                      <option value="+15% di atas HET">+15% di atas HET</option>
                      <option value="Turun Rp2.000">Turun Rp2.000</option>
                      <option value="Turun Rp1.000">Turun Rp1.000</option>
                      <option value="Tersedia">Tersedia</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      STOK FISIK
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Melimpah (500 kg), Tersedia"
                      value={komoditasFormData.stok_fisik}
                      onChange={(e) => setKomoditasFormData({ ...komoditasFormData, stok_fisik: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowKomoditasModal(false)}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#047857",
                      color: "#fff",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {isUpdating ? "Menyimpan..." : (editingKomoditasId ? "Update Komoditas" : "Tambahkan ke Katalog")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

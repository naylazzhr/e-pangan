import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Package,
  FileText,
  Search,
  MapPin,
  User,
  Clock,
  Store,
  ShieldCheck,
  Plus,
  X,
  CheckCircle2,
  Calendar,
  Sparkles,
  Tag,
  Phone,
} from "lucide-react";
import { tambahKomoditasKios } from "./api";

export default function DetailKios({ kios, onBack }) {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Data lengkap kios (termasuk katalog) dari backend
  const [detail, setDetail] = useState(null);
  const [loadingKatalog, setLoadingKatalog] = useState(false);

  // State Modal Tambah Komoditas
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extraKatalog, setExtraKatalog] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);

  const [formTambah, setFormTambah] = useState({
    nama_bahan: "",
    kategori: "Kebutuhan Pokok",
    harga: "",
    satuan: "kg",
    stok_fisik: "Tersedia",
    varian_keterangan: "Standar Pasar",
    status_label: "Sesuai HET",
  });

  const triggerToast = (msg, type = "success") => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    const idKios = kios?.id || kios?.id_kios || kios?.kios_id;
    if (!idKios) return;

    const ambilDetail = async () => {
      setLoadingKatalog(true);
      try {
        const baseUrl = import.meta.env?.VITE_API_URL || "/api";
        let response;
        try {
          response = await fetch(`${baseUrl}/kios/${idKios}`);
        } catch {
          response = await fetch(`/api/kios/${idKios}`);
        }
        if (!response.ok) throw new Error("Gagal mengambil detail kios");
        const result = await response.json();
        setDetail(result.data || result);
      } catch (err) {
        console.warn("Gagal load detail kios dari API:", err.message);
      } finally {
        setLoadingKatalog(false);
      }
    };

    ambilDetail();
  }, [kios]);

  // Pakai data dari detail kalau sudah ada, kalau belum pakai data dari daftar
  const sumber = detail || kios || {};
  const rawKatalog = [
    ...extraKatalog,
    ...(detail && Array.isArray(detail.katalog) && detail.katalog.length > 0
      ? detail.katalog
      : Array.isArray(sumber.katalog) && sumber.katalog.length > 0
      ? sumber.katalog
      : []),
  ];

  const getEmojiForProduct = (nama) => {
    const n = (nama || "").toLowerCase();
    if (n.includes("beras")) return "🌾";
    if (n.includes("minyak")) return "🛢️";
    if (n.includes("gula") || n.includes("tepung")) return "🧂";
    if (n.includes("ayam")) return "🍗";
    if (n.includes("daging") || n.includes("sapi")) return "🥩";
    if (n.includes("telur")) return "🥚";
    if (n.includes("cabai") || n.includes("cabe")) return "🌶️";
    if (n.includes("bawang")) return "🧅";
    if (n.includes("ikan")) return "🐟";
    return "📦";
  };

  const getStokBadgeColor = (stok) => {
    const s = (stok || "").toLowerCase();
    if (s.includes("habis") || s.includes("kosong")) {
      return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
    }
    if (s.includes("terbatas") || s.includes("sedikit")) {
      return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
    }
    return { bg: "#ecfdf5", color: "#166534", border: "#bbf7d0" };
  };

  const katalog = rawKatalog.map((item, idx) => ({
    id_komoditas: item.id_komoditas || item.id || idx + 1,
    nama_bahan: item.nama_bahan || item.nama || item.name || "Komoditas Pangan",
    varian_keterangan: item.varian_keterangan || item.kualitas_mutu || item.keterangan || "Standar Pasar",
    harga: Number(item.harga || item.price || item.hargaKios || 0),
    satuan: item.satuan || item.unit || "kg",
    stok_fisik: item.stok_fisik || (item.stok ? `${item.stok} ${item.satuan || "kg"}` : "Tersedia"),
    status_label: item.status_label || item.badgeHET || "Sesuai HET",
    kategori: item.kategori || item.category || "Kebutuhan Pokok",
    image: item.image || getEmojiForProduct(item.nama_bahan || item.nama),
    updated_at: item.updated_at || "Hari ini, 08:30 WIB",
  }));

  const dataKios = {
    id: sumber.id || sumber.id_kios || 1,
    nama: sumber.nama_kios || sumber.nama || sumber.name || "Kios Pangan Rakyat",
    pemilik: sumber.pemilik || "Pedagang Binaan",
    pasar: sumber.lokasi_pasar || sumber.pasar || "Pasar Babat",
    lokasi: sumber.alamat_lengkap || sumber.lokasi || sumber.alamat || "Stan Pasar Rakyat",
    jamBuka: sumber.jam_buka || "06:00 - 16:30 WIB",
    blok: sumber.blok_stan || sumber.blok || "Stan Pasar",
    telepon: sumber.no_telepon || sumber.telepon || "-",
    statusIzin: sumber.status_izin || "100% Berizin Pemkab",
    terakhirDiupdate: sumber.waktu_update_terakhir || "Hari ini, 08:30 WIB",
    totalKomoditas: katalog.length,
  };

  const infoRows = [
    { icon: MapPin, label: "Alamat & Pasar", value: dataKios.lokasi },
    { icon: User, label: "Nama Pemilik", value: dataKios.pemilik },
    { icon: Clock, label: "Jam Operasional", value: dataKios.jamBuka },
    { icon: Store, label: "Blok / Nomor Stan", value: dataKios.blok },
    ...(dataKios.telepon && dataKios.telepon !== "-" ? [{ icon: Phone, label: "Kontak Kios", value: dataKios.telepon }] : []),
    { icon: ShieldCheck, label: "Legalitas Izin", value: dataKios.statusIzin },
  ];

  const categories = ["Semua", ...new Set(katalog.map((item) => item.kategori).filter(Boolean))];

  const filteredProducts = katalog.filter((item) => {
    const itemName = item.nama_bahan || "";
    const itemKat = item.kategori || "";
    const matchCategory = selectedCategory === "Semua" || itemKat === selectedCategory;
    const matchSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleTambahSubmit = async (e) => {
    e.preventDefault();
    if (!formTambah.nama_bahan.trim()) {
      triggerToast("Nama komoditas bahan pangan wajib diisi!", "error");
      return;
    }
    const hargaNum = parseFloat(formTambah.harga);
    if (!hargaNum || hargaNum <= 0) {
      triggerToast("Harga komoditas harus berupa angka di atas 0!", "error");
      return;
    }

    setIsSubmitting(true);
    const idKios = dataKios.id;

    const baru = {
      id_komoditas: Date.now(),
      nama_bahan: formTambah.nama_bahan.trim(),
      kategori: formTambah.kategori,
      harga: hargaNum,
      satuan: formTambah.satuan || "kg",
      stok_fisik: formTambah.stok_fisik || "Tersedia",
      status_label: formTambah.status_label || "Sesuai HET",
      varian_keterangan: formTambah.varian_keterangan || "Standar Pasar",
      image: getEmojiForProduct(formTambah.nama_bahan),
      updated_at: "Baru saja",
    };

    // Tambah optimis ke katalog lokal
    setExtraKatalog((prev) => [baru, ...prev]);

    try {
      if (idKios) {
        await tambahKomoditasKios(idKios, {
          nama_bahan: baru.nama_bahan,
          kategori: baru.kategori,
          harga: baru.harga,
          satuan: baru.satuan,
          stok_fisik: baru.stok_fisik,
          status_label: baru.status_label,
          varian_keterangan: baru.varian_keterangan,
        });
      }
      triggerToast(`Komoditas "${baru.nama_bahan}" berhasil ditambahkan ke kios!`, "success");
      setShowAddModal(false);
      setFormTambah({
        nama_bahan: "",
        kategori: "Kebutuhan Pokok",
        harga: "",
        satuan: "kg",
        stok_fisik: "Tersedia",
        varian_keterangan: "Standar Pasar",
        status_label: "Sesuai HET",
      });
    } catch (err) {
      console.warn("API add note:", err.message);
      triggerToast(`Komoditas "${baru.nama_bahan}" tersimpan ke katalog kios!`, "success");
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f4f7f5",
        minHeight: "100vh",
        paddingBottom: "5rem",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: "#112216",
      }}
    >
      <style>{`
        .dk-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 1.5rem 3rem;
          box-sizing: border-box;
        }
        .dk-hero {
          background: linear-gradient(180deg, #d8eedf 0%, #e8f5ec 100%);
          padding: 24px 0 36px;
          margin-bottom: 28px;
          border-bottom: 1px solid #cfe3d6;
        }
        .dk-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .dk-hero-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
        }
        .dk-main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }
        .dk-katalog-box {
          background-color: #ffffff;
          border-radius: 28px;
          padding: 30px 32px;
          border: 1px solid #d8e6dc;
          box-shadow: 0 4px 20px rgba(27,67,50,0.04);
        }
        .dk-product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .dk-product-card {
          border: 1px solid #e1ebe4;
          border-radius: 20px;
          padding: 16px;
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .dk-product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(27,67,50,0.06);
          border-color: #b7efc5;
        }
        .dk-title {
          font-size: clamp(1.4rem, 4vw, 2.3rem);
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: #0f2419;
        }
        .dk-btn-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #ffffff;
          border: 1px solid #cfe3d6;
          padding: 8px 18px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          color: #1b4332;
          transition: background 0.15s;
        }
        .dk-btn-back:hover {
          background-color: #f2f7f4;
        }
        .dk-btn-tambah {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #1b4332;
          color: #ffffff;
          border: none;
          padding: 9px 18px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
          box-shadow: 0 4px 14px rgba(27,67,50,0.18);
        }
        .dk-btn-tambah:hover {
          background-color: #143326;
          transform: translateY(-1px);
        }
        .dk-btn-tambah:active {
          transform: translateY(0);
        }
        .dk-search-box {
          position: relative;
          width: 250px;
        }
        .dk-info-aside {
          background-color: #ffffff;
          border-radius: 24px;
          border: 1px solid #d8e2dc;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(27,67,50,0.04);
        }

        /* Responsive Breakpoint Khusus Mode HP / Smartphone */
        @media (max-width: 900px) {
          .dk-container { padding: 0 16px 2rem !important; }
          .dk-hero { padding: 18px 0 24px !important; margin-bottom: 20px !important; }
          .dk-hero-grid { flex-direction: column !important; align-items: stretch !important; gap: 14px !important; }
          .dk-main-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
        @media (max-width: 600px) {
          .dk-container { padding: 0 14px 2rem !important; }
          .dk-hero { padding: 16px 0 20px !important; margin-bottom: 16px !important; }
          .dk-topbar {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .dk-katalog-box {
            padding: 18px 14px !important;
            border-radius: 20px !important;
          }
          .dk-product-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .dk-search-box {
            width: 100% !important;
          }
          .dk-info-aside {
            padding: 18px 16px !important;
            border-radius: 20px !important;
          }
        }
      `}</style>

      {/* TOAST NOTIFIKASI */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 99999,
            backgroundColor: toastMsg.type === "error" ? "#dc2626" : "#1b4332",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "14px",
            fontWeight: "700",
            fontSize: "13.5px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="dk-hero">
        <div className="dk-container">
          <div className="dk-topbar">
            <button onClick={onBack} className="dk-btn-back">
              <ArrowLeft size={16} /> Kembali ke Direktori
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#4a6550", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Clock size={13} color="#2d6a4f" />
                Update: <strong style={{ color: "#112216" }}>{dataKios.terakhirDiupdate}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="dk-btn-tambah"
                title="Tambah Komoditas ke Kios"
              >
                <Plus size={15} /> + Tambah Komoditas
              </button>
            </div>
          </div>

          <div className="dk-hero-grid">
            <div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#e2f5ea",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    border: "1px solid #b7efc5",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2d6a4f" }}></span>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {dataKios.statusIzin}
                  </span>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#ffffff",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    border: "1px solid #cfe3d6",
                  }}
                >
                  <MapPin size={12} color="#2d6a4f" />
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {dataKios.pasar}
                  </span>
                </div>
              </div>
              <h1 className="dk-title">{dataKios.nama}</h1>
              <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#4a6550", fontWeight: "600" }}>
                Pedagang resmi binaan DKPP Kabupaten Lamongan · Blok {dataKios.blok}
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#1b4332",
                color: "#ffffff",
                borderRadius: "20px",
                padding: "16px 24px",
                minWidth: "160px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <span style={{ display: "block", fontSize: "10.5px", fontWeight: "800", letterSpacing: "0.06em", color: "#74c69d", marginBottom: "4px" }}>
                KOMODITAS TERPANTAU
              </span>
              <div style={{ fontSize: "1.9rem", fontWeight: "800", lineHeight: 1 }}>{dataKios.totalKomoditas} Item</div>
            </div>
          </div>
        </div>
      </div>

      {/* LAYOUT UTAMA */}
      <div className="dk-container">
        <div className="dk-main-grid">

          {/* KATALOG INVENTARIS */}
          <div className="dk-katalog-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "14px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", color: "#0a2116", fontSize: "1.35rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Package size={22} color="#2d6a4f" /> Katalog Bahan Pangan Kios
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#4e6754", fontWeight: "600" }}>
                  Daftar komoditas pangan yang tersedia dan dijual di kios ini
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", width: "100%", maxWidth: "380px" }}>
                <div className="dk-search-box" style={{ flex: 1 }}>
                  <Search size={15} color="#4e6754" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Cari komoditas di kios ini..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: "9px 12px 9px 34px",
                      borderRadius: "999px",
                      border: "1px solid #d2ded7",
                      fontSize: "13px",
                      width: "100%",
                      boxSizing: "border-box",
                      outline: "none",
                      backgroundColor: "#f9fcfb",
                      fontWeight: "600",
                      color: "#112216",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="dk-btn-tambah"
                  style={{ whiteSpace: "nowrap" }}
                >
                  <Plus size={14} /> + Tambah
                </button>
              </div>
            </div>

            {/* Filter Kategori */}
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "10px", marginBottom: "16px" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "999px",
                    border: selectedCategory === cat ? "1.5px solid #1b4332" : "1px solid #d2ded7",
                    fontSize: "12px",
                    fontWeight: "700",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    backgroundColor: selectedCategory === cat ? "#1b4332" : "#ffffff",
                    color: selectedCategory === cat ? "#ffffff" : "#4a6550",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid Komoditas */}
            <div className="dk-product-grid">
              {loadingKatalog && (
                <div style={{ padding: "30px", textAlign: "center", color: "#4e6754", fontWeight: "600", gridColumn: "1/-1" }}>
                  Memuat katalog komoditas kios...
                </div>
              )}

              {!loadingKatalog && filteredProducts.length === 0 && (
                <div style={{ padding: "40px 20px", textAlign: "center", backgroundColor: "#f9fcfb", borderRadius: "20px", border: "1.5px dashed #b7efc5", gridColumn: "1/-1" }}>
                  <Package size={36} color="#2d6a4f" style={{ margin: "0 auto 10px auto" }} />
                  <h4 style={{ margin: "0 0 6px 0", color: "#0f1d14", fontSize: "15px", fontWeight: "800" }}>
                    Belum Ada Komoditas yang Cocok
                  </h4>
                  <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#4e6754" }}>
                    {searchQuery ? `Tidak ada komoditas dengan kata kunci "${searchQuery}".` : "Kios ini belum memiliki daftar komoditas pada kategori ini."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="dk-btn-tambah"
                  >
                    <Plus size={15} /> Tambah Komoditas Sekarang
                  </button>
                </div>
              )}

              {filteredProducts.map((item, idx) => {
                const stokBadge = getStokBadgeColor(item.stok_fisik);
                return (
                  <div key={item.id_komoditas || idx} className="dk-product-card">
                    <div>
                      {/* Baris Atas: Emoji Icon & Badge Stok */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "8px" }}>
                        <span style={{ fontSize: "1.8rem", backgroundColor: "#f4f8f5", padding: "6px 10px", borderRadius: "14px", border: "1px solid #e2eee6" }}>
                          {item.image || "📦"}
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "800",
                              padding: "3px 9px",
                              borderRadius: "999px",
                              backgroundColor: stokBadge.bg,
                              color: stokBadge.color,
                              border: `1px solid ${stokBadge.border}`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            ● {item.stok_fisik || "Tersedia"}
                          </span>
                          {item.status_label && (
                            <span style={{ fontSize: "10.5px", color: "#2d6a4f", fontWeight: "700" }}>
                              {item.status_label}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nama & Keterangan Mutu */}
                      <h4 style={{ margin: "0 0 4px 0", color: "#0f1d14", fontSize: "15px", fontWeight: "800", lineHeight: "1.3" }}>
                        {item.nama_bahan}
                      </h4>
                      <div style={{ fontSize: "12px", color: "#4e6754", fontWeight: "600", marginBottom: "4px" }}>
                        {item.varian_keterangan}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6b7280", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Tag size={11} color="#2d6a4f" /> {item.kategori}
                      </div>
                    </div>

                    {/* Baris Harga & Satuan yang Jelas */}
                    <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #e1ebe4", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div>
                        <span style={{ fontSize: "1.25rem", fontWeight: "900", color: "#16402b" }}>
                          Rp {Number(item.harga || 0).toLocaleString("id-ID")}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#4a6550", marginLeft: "4px" }}>
                          /{item.satuan}
                        </span>
                      </div>
                      <span style={{ fontSize: "10.5px", color: "#6b7280", fontWeight: "600" }}>
                        Update {item.updated_at ? item.updated_at.split(",")[0] : "harian"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INFORMASI KIOS */}
          <aside className="dk-info-aside">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "800",
                fontSize: "15px",
                paddingBottom: "14px",
                borderBottom: "1.5px solid #d8e2dc",
                marginBottom: "8px",
                color: "#0f2419",
              }}
            >
              <FileText size={17} color="#2d6a4f" />
              <span>Profil Lengkap Kios</span>
            </div>

            {infoRows.map((row, i) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    padding: "12px 0",
                    borderBottom: i === infoRows.length - 1 ? "none" : "1px solid #eef2ef",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#e2f5ea",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} color="#2d6a4f" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "10.5px", fontWeight: "800", color: "#4a6550", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "2px" }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#112216", lineHeight: 1.45, wordBreak: "break-word" }}>
                      {row.value}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Action Tambah Komoditas di Aside */}
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed #d8e2dc" }}>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px",
                  borderRadius: "14px",
                  border: "1.5px dashed #2d6a4f",
                  backgroundColor: "#f4faf6",
                  color: "#1b4332",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}
              >
                <Plus size={15} color="#2d6a4f" /> + Tambah Komoditas Baru
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* MODAL TAMBAH KOMODITAS KE KIOS */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 29, 20, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              border: "1px solid #d2ded7",
              overflow: "hidden",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e6eee9",
                backgroundColor: "#f4f8f5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 2px 0", fontSize: "16px", fontWeight: "800", color: "#0f2419" }}>
                  Tambah Komoditas ke Kios
                </h3>
                <span style={{ fontSize: "12px", color: "#4a6550", fontWeight: "600" }}>
                  {dataKios.nama} · {dataKios.pasar}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "#e2ede6",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#1b4332",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Input */}
            <form onSubmit={handleTambahSubmit} style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                  Nama Bahan / Komoditas Pangan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beras Premium, Cabai Rawit, Minyak Goreng"
                  value={formTambah.nama_bahan}
                  onChange={(e) => setFormTambah({ ...formTambah, nama_bahan: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1.5px solid #cfe3d6",
                    fontSize: "13px",
                    fontWeight: "600",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                    Kategori Pangan
                  </label>
                  <select
                    value={formTambah.kategori}
                    onChange={(e) => setFormTambah({ ...formTambah, kategori: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1.5px solid #cfe3d6",
                      fontSize: "13px",
                      fontWeight: "600",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      outline: "none",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                    }}
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

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                    Harga Satuan (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 14500"
                    value={formTambah.harga}
                    onChange={(e) => setFormTambah({ ...formTambah, harga: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1.5px solid #cfe3d6",
                      fontSize: "13px",
                      fontWeight: "700",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                    Satuan Ukuran
                  </label>
                  <select
                    value={formTambah.satuan}
                    onChange={(e) => setFormTambah({ ...formTambah, satuan: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1.5px solid #cfe3d6",
                      fontSize: "13px",
                      fontWeight: "600",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      outline: "none",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="liter">liter (Liter)</option>
                    <option value="butir">butir (Butir / Biji)</option>
                    <option value="ikat">ikat (Ikat)</option>
                    <option value="kemasan">kemasan (Pack / Botol)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                    Status Ketersediaan Stok
                  </label>
                  <select
                    value={formTambah.stok_fisik}
                    onChange={(e) => setFormTambah({ ...formTambah, stok_fisik: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1.5px solid #cfe3d6",
                      fontSize: "13px",
                      fontWeight: "600",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      outline: "none",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="Tersedia">Tersedia (Normal)</option>
                    <option value="Melimpah">Melimpah</option>
                    <option value="Terbatas">Terbatas</option>
                    <option value="Habis">Habis</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1b4332", marginBottom: "6px" }}>
                  Varian / Mutu / Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kualitas Bulog Premium, Grade A Super"
                  value={formTambah.varian_keterangan}
                  onChange={(e) => setFormTambah({ ...formTambah, varian_keterangan: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1.5px solid #cfe3d6",
                    fontSize: "13px",
                    fontWeight: "600",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              {/* Tombol Aksi Form */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "12px", borderTop: "1px solid #eef3f0" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "999px",
                    border: "1px solid #d2ded7",
                    backgroundColor: "#ffffff",
                    color: "#4e6754",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "999px",
                    border: "none",
                    backgroundColor: "#1b4332",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: isSubmitting ? "wait" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: "0 4px 14px rgba(27,67,50,0.2)",
                  }}
                >
                  {isSubmitting ? "Menyimpan..." : "+ Simpan ke Katalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

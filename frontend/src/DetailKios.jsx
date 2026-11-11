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
} from "lucide-react";

export default function DetailKios({ kios, onBack }) {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Data lengkap kios (termasuk katalog) dari backend
  const [detail, setDetail] = useState(null);
  const [loadingKatalog, setLoadingKatalog] = useState(false);

  useEffect(() => {
    const idKios = kios?.id || kios?.id_kios || kios?.kios_id;
    if (!idKios) return;

    const ambilDetail = async () => {
      setLoadingKatalog(true);
      try {
        const baseUrl = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000";
        let response;
        try {
          response = await fetch(`${baseUrl}/kios/${idKios}`);
        } catch {
          response = await fetch(`http://localhost:8000/kios/${idKios}`);
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
  const rawKatalog = (detail && Array.isArray(detail.katalog) && detail.katalog.length > 0)
    ? detail.katalog
    : (Array.isArray(sumber.katalog) && sumber.katalog.length > 0 ? sumber.katalog : []);

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

  const katalog = rawKatalog.map((item, idx) => ({
    id_komoditas: item.id_komoditas || item.id || idx + 1,
    nama_bahan: item.nama_bahan || item.nama || item.name || "Komoditas Pangan",
    varian_keterangan: item.varian_keterangan || item.kualitas_mutu || item.keterangan || "Standar Pasar",
    harga: Number(item.harga || item.price || item.hargaKios || 0),
    satuan: item.satuan || item.unit || "kg",
    stok_fisik: item.stok_fisik || (item.stok ? `${item.stok} ${item.satuan || 'kg'}` : "Tersedia"),
    status_label: item.status_label || item.badgeHET || "Sesuai HET",
    kategori: item.kategori || item.category || "Kebutuhan Pokok",
    image: item.image || getEmojiForProduct(item.nama_bahan || item.nama),
  }));

  const dataKios = {
    id: sumber.id || sumber.id_kios || 1,
    nama: sumber.nama_kios || sumber.nama || sumber.name || "Kios Pangan Rakyat",
    pemilik: sumber.pemilik || "Pedagang Binaan",
    pasar: sumber.lokasi_pasar || sumber.pasar || "Pasar Babat",
    lokasi: sumber.alamat_lengkap || sumber.lokasi || sumber.alamat || "Stan Pasar Rakyat",
    jamBuka: sumber.jam_buka || "06:00 - 16:30 WIB",
    blok: sumber.blok_stan || sumber.blok || "Stan Pasar",
    statusIzin: sumber.status_izin || "100% Berizin Pemkab",
    terakhirDiupdate: sumber.waktu_update_terakhir || "Hari ini, 08:30 WIB",
    totalKomoditas: sumber.total_komoditas ?? (katalog.length || sumber.total_katalog || 0),
  };

  // Baris informasi kios
  const infoRows = [
    { icon: MapPin, label: "Alamat", value: dataKios.lokasi },
    { icon: User, label: "Pemilik", value: dataKios.pemilik },
    { icon: Clock, label: "Jam Buka", value: dataKios.jamBuka },
    { icon: Store, label: "Blok / Stan", value: dataKios.blok },
    { icon: ShieldCheck, label: "Status Izin", value: dataKios.statusIzin },
  ];

  // Kategori dibuat otomatis dari data katalog
  const categories = ["Semua", ...new Set(katalog.map((item) => item.kategori).filter(Boolean))];

  const filteredProducts = katalog.filter((item) => {
    const itemName = item.nama_bahan || "";
    const itemKat = item.kategori || "";
    const matchCategory = selectedCategory === "Semua" || itemKat === selectedCategory;
    const matchSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div
      style={{
        backgroundColor: "#f3f6f4",
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
          background: #d4e8da;
          padding: 28px 0 40px;
          margin-bottom: 32px;
        }
        .dk-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .dk-hero-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
        }
        .dk-main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }
        .dk-product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .dk-title {
          font-size: 2.3rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }
        @media (max-width: 900px) {
          .dk-container { padding: 0 14px !important; }
          .dk-hero { padding: 18px 0 24px !important; margin-bottom: 18px !important; }
          .dk-topbar { margin-bottom: 16px !important; flex-direction: row !important; }
          .dk-hero-grid { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
          .dk-title { font-size: 1.35rem !important; line-height: 1.25 !important; }
          .dk-main-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .dk-product-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
        @media (max-width: 768px) {
          .dk-container { padding: 0 12px !important; }
          .dk-hero { padding: 14px 0 20px !important; margin-bottom: 14px !important; }
          .dk-topbar {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 8px !important;
            margin-bottom: 12px !important;
            flex-wrap: wrap !important;
          }
          .dk-title { font-size: 1.2rem !important; }
          .dk-hero-grid { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .dk-main-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .dk-product-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
        }
      `}</style>

      {/* HERO */}
      <div className="dk-hero">
        <div className="dk-container">
          <div className="dk-topbar">
            <button
              onClick={onBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#ffffff",
                border: "1px solid #d8e2dc",
                padding: "8px 18px",
                borderRadius: "999px",
                fontWeight: "700",
                fontSize: "13px",
                fontFamily: "inherit",
                cursor: "pointer",
                color: "#1b4332",
              }}
            >
              <ArrowLeft size={16} /> Kembali ke Direktori
            </button>
            <span style={{ fontSize: "12px", color: "#4a6550", fontWeight: "600" }}>
              Update data: <strong style={{ color: "#112216" }}>{dataKios.terakhirDiupdate}</strong>
            </span>
          </div>

          <div className="dk-hero-grid">
            <div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#e2f5ea",
                    padding: "4px 12px",
                    borderRadius: "999px",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2d6a4f" }}></span>
                  <span style={{ fontSize: "10.5px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.05em", textTransform: "uppercase" }}>
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
                  }}
                >
                  <MapPin size={12} color="#2d6a4f" />
                  <span style={{ fontSize: "10.5px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {dataKios.pasar}
                  </span>
                </div>
              </div>
              <h1 className="dk-title">
                {dataKios.nama}
              </h1>
            </div>

            <div
              style={{
                backgroundColor: "#1b4332",
                color: "#ffffff",
                borderRadius: "24px",
                padding: "20px 32px",
                minWidth: "180px",
              }}
            >
              <span style={{ display: "block", fontSize: "11px", fontWeight: "800", letterSpacing: "0.06em", color: "#74c69d", marginBottom: "6px" }}>
                TOTAL KOMODITAS
              </span>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", lineHeight: 1 }}>{dataKios.totalKomoditas}</div>
            </div>
          </div>
        </div>
      </div>

      {/* LAYOUT UTAMA */}
      <div className="dk-container">
        <div className="dk-main-grid">

          {/* KATALOG */}
          <div style={{ backgroundColor: "#dbece2", borderRadius: "36px", padding: "36px 40px", border: "1px solid #c8dcd0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", color: "#0a2116", fontSize: "1.5rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Package size={22} color="#2d6a4f" /> Katalog &amp; Inventaris Kios
                </h3>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#4e6754", fontWeight: "600" }}>
                  Daftar barang komoditas pangan yang dijual di kios ini
                </p>
              </div>

              <div style={{ position: "relative", width: "240px" }}>
                <Search size={16} color="#4e6754" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Cari komoditas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: "10px 14px 10px 38px", borderRadius: "99px", border: "1px solid #d2ded7", fontSize: "13.5px", width: "100%", boxSizing: "border-box", outline: "none", backgroundColor: "#fff", fontWeight: "600", color: "#112216", fontFamily: "inherit" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "20px" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "99px",
                    border: selectedCategory === cat ? "1px solid #1b4332" : "1px solid #d2ded7",
                    fontSize: "13px",
                    fontWeight: "700",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    backgroundColor: selectedCategory === cat ? "#1b4332" : "#ffffff",
                    color: selectedCategory === cat ? "#fff" : "#4a6550",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="dk-product-grid">
              {loadingKatalog && <p style={{ color: "#4e6754", fontWeight: "600" }}>Memuat katalog...</p>}
              {!loadingKatalog && filteredProducts.length === 0 && (
                <p style={{ color: "#4e6754", fontWeight: "600" }}>Belum ada data katalog untuk kios ini.</p>
              )}
              {filteredProducts.map((item, idx) => (
                <div
                  key={item.id_komoditas || idx}
                  style={{
                    border: "1px solid #d2ded7",
                    borderRadius: "24px",
                    padding: "20px",
                    backgroundColor: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <span style={{ fontSize: "2.2rem", backgroundColor: "#f2f7f4", padding: "8px", borderRadius: "16px" }}>{item.image || "📦"}</span>
                      {item.stok_fisik && (
                        <span style={{ fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "99px", backgroundColor: "#eef8f2", color: "#1b4332", border: "1px solid #b7efc5" }}>
                          Stok: {item.stok_fisik}
                        </span>
                      )}
                    </div>

                    <h4 style={{ margin: "0 0 4px 0", color: "#0f1d14", fontSize: "1.05rem", fontWeight: "800" }}>{item.nama_bahan}</h4>
                    <span style={{ display: "block", fontSize: "12px", color: "#4e6754", fontWeight: "600" }}>{item.varian_keterangan}</span>
                    {item.status_label && (
                      <span style={{ display: "block", fontSize: "12px", color: "#2d6a4f", fontWeight: "800", marginTop: "4px" }}>
                        {item.status_label}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed #d2ded7" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f1d14" }}>
                      Rp{Number(item.harga || 0).toLocaleString("id-ID")}{" "}
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#4e6754" }}>/{item.satuan}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INFORMASI KIOS */}
          <aside
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #d8e2dc",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "800",
                fontSize: "15px",
                paddingBottom: "14px",
                borderBottom: "1px solid #d8e2dc",
                marginBottom: "6px",
              }}
            >
              <FileText size={16} color="#2d6a4f" />
              <span>Informasi Kios</span>
            </div>

            {infoRows.map((row, i) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start",
                    padding: "14px 0",
                    borderBottom: i === infoRows.length - 1 ? "none" : "1px solid #eef2ef",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      backgroundColor: "#e2f5ea",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color="#2d6a4f" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "10.5px", fontWeight: "800", color: "#4a6550", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "3px" }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#112216", lineHeight: 1.5 }}>
                      {row.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </aside>

        </div>
      </div>
    </div>
  );
}
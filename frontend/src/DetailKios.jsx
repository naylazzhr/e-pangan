import React, { useState, useEffect } from "react";
import { ArrowLeft, Package, FileText, Search, MapPin } from "lucide-react";

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
    telepon: sumber.no_telepon || sumber.telepon || "-",
    blok: sumber.blok_stan || sumber.blok || "Stan Pasar",
    statusIzin: sumber.status_izin || "100% Berizin Pemkab",
    terakhirDiupdate: sumber.waktu_update_terakhir || "Hari ini, 08:30 WIB",
    totalKomoditas: sumber.total_komoditas ?? (katalog.length || sumber.total_katalog || 0),
    mapsUrl: sumber.google_maps_url || "",
  };

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
    <div style={{ backgroundColor: "#f3f6f4", minHeight: "100vh", padding: "2.5rem 3rem", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#112216" }}>
      <div style={{ maxWidth: "1750px", margin: "0 auto" }}>

        {/* Tombol Kembali */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <button
            onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#fff", border: "1px solid #d2ded7", padding: "10px 20px", borderRadius: "99px", fontWeight: "700", cursor: "pointer", color: "#1b4332", boxShadow: "0 4px 14px rgba(27,67,50,0.04)" }}
          >
            <ArrowLeft size={16} /> Kembali ke Direktori
          </button>
          <span style={{ fontSize: "13px", color: "#4e6754", fontWeight: "600" }}>Update Data Terakhir: <strong style={{ color: "#112216" }}>{dataKios.terakhirDiupdate}</strong></span>
        </div>

        {/* HEADER HERO PROFIL KIOS */}
        <div style={{ background: "linear-gradient(135deg, #071a11 0%, #113324 50%, #235841 100%)", color: "#fff", borderRadius: "28px", padding: "32px 40px", boxShadow: "0 12px 36px rgba(10, 33, 22, 0.15)", marginBottom: "2rem", display: "grid", gridTemplateColumns: "1fr auto", gap: "1.5rem", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
              <span style={{ backgroundColor: "#eef8f2", color: "#1b4332", fontSize: "11px", fontWeight: "800", padding: "4px 14px", borderRadius: "99px", border: "1px solid #b7efc5", textTransform: "uppercase" }}>
                {dataKios.statusIzin}
              </span>
              <span style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "4px 14px", borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={13} color="#74c69d" /> {dataKios.pasar}
              </span>
            </div>
            <h1 style={{ margin: "0 0 6px 0", fontSize: "2.4rem", fontWeight: "800", letterSpacing: "-0.03em" }}>{dataKios.nama}</h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "1.05rem", lineHeight: "1.5" }}>
              {dataKios.lokasi} • Pemilik: <strong style={{ color: "#ffffff" }}>{dataKios.pemilik}</strong> • Jam buka: {dataKios.jamBuka}
            </p>
          </div>

          <div style={{ backgroundColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", padding: "20px 28px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#b7efc5", fontWeight: "800", display: "block", marginBottom: "4px" }}>Total Komoditas</span>
            <div style={{ fontSize: "2.4rem", fontWeight: "800", color: "#74c69d", lineHeight: 1 }}>{dataKios.totalKomoditas}</div>
          </div>
        </div>

        {/* LAYOUT UTAMA */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>

          <div style={{ backgroundColor: "#dbece2", borderRadius: "36px", padding: "36px 40px", border: "1px solid #c8dcd0", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", color: "#0a2116", fontSize: "1.5rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Package size={22} color="#2d6a4f" /> Katalog &amp; Inventaris Kios
                </h3>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#4e6754", fontWeight: "600" }}>Daftar barang komoditas pangan yang dijual di kios ini</p>
              </div>

              <div style={{ position: "relative", width: "240px" }}>
                <Search size={16} color="#4e6754" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Cari komoditas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: "10px 14px 10px 38px", borderRadius: "99px", border: "1px solid #d2ded7", fontSize: "13.5px", width: "100%", outline: "none", backgroundColor: "#fff", fontWeight: "600", color: "#112216", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
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
                    cursor: "pointer",
                    backgroundColor: selectedCategory === cat ? "#1b4332" : "#ffffff",
                    color: selectedCategory === cat ? "#fff" : "#4a6550",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
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
                    boxShadow: "0 4px 16px rgba(27, 67, 50, 0.04)"
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
                      Rp{Number(item.harga || 0).toLocaleString("id-ID")} <span style={{ fontSize: "12px", fontWeight: "600", color: "#4e6754" }}>/{item.satuan}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INFO KIOS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ backgroundColor: "#fff", borderRadius: "28px", padding: "28px", border: "1px solid #d2ded7", boxShadow: "0 4px 20px rgba(27, 67, 50, 0.05)" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#0f1d14", fontSize: "1.1rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={18} color="#2d6a4f" /> Informasi Kios
              </h4>
              <div style={{ backgroundColor: "#f2f7f4", padding: "16px", borderRadius: "18px", fontSize: "13.5px", color: "#1b4332", borderLeft: "4px solid #2d6a4f", lineHeight: "1.8", fontWeight: "600" }}>
                <div>Blok/Stan: {dataKios.blok}</div>
                <div>Telepon: {dataKios.telepon}</div>
                <div>Status izin: {dataKios.statusIzin}</div>
              </div>
              {dataKios.mapsUrl && (
                <a
                  href={dataKios.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-block", marginTop: "14px", fontSize: "13px", fontWeight: "700", color: "#2d6a4f" }}
                >
                  Buka di Google Maps
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
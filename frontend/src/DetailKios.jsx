import React, { useState } from "react";

export default function DetailKios({ kios, onBack }) {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const DEFAULT_KATALOG = [
    {
      id: 1,
      nama: "Beras Medium IR-64",
      kategori: "Beras & Padi",
      hargaKios: kios?.price || 13000,
      het: 13500,
      stok: 120,
      satuan: "kg",
      statusStok: "Aman",
      badgeHET: (kios?.price || 13000) <= 13500 ? "Di Bawah HET" : "Di Atas HET",
      statusColor: (kios?.price || 13000) <= 13500 ? "#16a34a" : "#dc2626",
      image: "🌾"
    },
    {
      id: 2,
      nama: "MinyakKita 1 Liter",
      kategori: "Minyak & Mentega",
      hargaKios: 15700,
      het: 15700,
      stok: 15,
      satuan: "liter",
      statusStok: "Menipis",
      badgeHET: "Sesuai HET",
      statusColor: "#2563eb",
      image: "🍾"
    },
    {
      id: 3,
      nama: "Gula Pasir Curah",
      kategori: "Bumbu & Gula",
      hargaKios: 17800,
      het: 17500,
      stok: 60,
      satuan: "kg",
      statusStok: "Aman",
      badgeHET: "Di Atas HET",
      statusColor: "#dc2626",
      image: "🍬"
    },
    {
      id: 4,
      nama: "Bawang Merah Lokal",
      kategori: "Bumbu & Gula",
      hargaKios: 28000,
      het: 30000,
      stok: 25,
      satuan: "kg",
      statusStok: "Aman",
      badgeHET: "Di Bawah HET",
      statusColor: "#16a34a",
      image: "🧅"
    },
    {
      id: 5,
      nama: "Telur Ayam Ras",
      kategori: "Daging & Telur",
      hargaKios: 27000,
      het: 28000,
      stok: 0,
      satuan: "kg",
      statusStok: "Habis",
      badgeHET: "Di Bawah HET",
      statusColor: "#16a34a",
      image: "🥚"
    }
  ];

  // Data Detail Kios & Inventaris Dagangan (menerima dari props kios jika ada)
  const dataKios = {
    nama: kios?.nama || kios?.name || "Kios Bu Siti",
    pemilik: kios?.pemilik || (kios?.name === "Kios Berkah Tani" ? "H. Ahmad Fauzi" : "Hj. Siti Aminah"),
    pasar: kios?.pasar || kios?.marketName || "Pasar Babat",
    lokasi: kios?.lokasi || kios?.location || "Los Beras, Blok B No. 12",
    telepon: kios?.telepon || "0812-3456-7890",
    statusBinaan: kios?.statusBinaan || (kios?.isOfficial !== false ? "Kios Binaan DKPP & Mitra Bulog" : "Kios Pantauan Pasar DKPP"),
    skorKepatuhan: kios?.skorKepatuhan || (kios?.badge === "HARGA TERMURAH" ? 95 : 90),
    terakhirDiupdate: kios?.terakhirDiupdate || "Hari ini, 07:45 WIB",
    enumerator: kios?.enumerator || "Budi Santoso (Petugas Lapangan DKPP)",
    fotoKios: kios?.fotoKios || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    katalog: (kios?.katalog && kios.katalog.length > 0) ? kios.katalog : DEFAULT_KATALOG,
  };

  const categories = ["Semua", "Beras & Padi", "Minyak & Mentega", "Bumbu & Gula", "Daging & Telur"];

  // Filter Barang Dagangan Kios
  const filteredProducts = dataKios.katalog.filter((item) => {
    const matchCategory = selectedCategory === "Semua" || item.kategori === selectedCategory;
    const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "1.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>

      {/* Tombol Kembali & Breadcrumb */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#fff", border: "1px solid #cbd5e1", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: "600", cursor: "pointer", color: "#334155" }}
        >
          ← Kembali
        </button>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Update Data Enumerator: <strong>{dataKios.terakhirDiupdate}</strong></span>
      </div>

      {/* HEADER HERO PROFIL KIOS */}
      <div style={{ backgroundColor: "#064e3b", color: "#fff", borderRadius: "16px", padding: "1.5rem 2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <span style={{ backgroundColor: "#10b981", color: "#064e3b", fontSize: "0.75rem", fontWeight: "bold", padding: "4px 10px", borderRadius: "20px" }}>
              {dataKios.statusBinaan}
            </span>
            <span style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.75rem", padding: "4px 10px", borderRadius: "20px" }}>
              📍 {dataKios.pasar}
            </span>
          </div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "2rem", fontWeight: "700" }}>{dataKios.nama}</h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: "0.95rem" }}>
            {dataKios.lokasi} • Pemilik: <strong>{dataKios.pemilik}</strong>
          </p>
        </div>

        {/* Badge Score Kepatuhan HET */}
        <div style={{ backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", padding: "1rem 1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", textAlign: "center" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.8 }}>Kepatuhan HET</span>
          <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#34d399", lineHeight: 1 }}>{dataKios.skorKepatuhan}%</div>
        </div>
      </div>

      {/* LAYOUT UTAMA: KATALOG (KIRI) vs DETAIL OPERASIONAL (KANAN) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" }}>

        {/* ================= KOLOM KIRI: KATALOG DAGANGAN KIOS ================= */}
        <div>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>

            {/* Header Katalog & Search Filter */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.1rem" }}>📦 Katalog & Inventaris Kios</h3>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Daftar barang komoditas pangan yang dijual di kios ini</p>
              </div>

              <input
                type="text"
                placeholder="Cari komoditas di kios ini..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", width: "220px", outline: "none" }}
              />
            </div>

            {/* Filter Kategori (Pill Buttons) */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "1rem" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: "none",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    backgroundColor: selectedCategory === cat ? "#064e3b" : "#f1f5f9",
                    color: selectedCategory === cat ? "#fff" : "#475569",
                    transition: "all 0.2s"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* GRID CARDS PRODUK DAGANGAN */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1rem" }}>
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "1rem",
                    backgroundColor: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    justify: "space-between",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                  }}
                >
                  <div>
                    {/* Header Card Produk */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "2rem" }}>{item.image}</span>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: item.statusStok === "Habis" ? "#fef2f2" : item.statusStok === "Menipis" ? "#fffbeb" : "#f0fdf4",
                        color: item.statusStok === "Habis" ? "#dc2626" : item.statusStok === "Menipis" ? "#d97706" : "#16a34a"
                      }}>
                        Stok: {item.stok} {item.satuan} ({item.statusStok})
                      </span>
                    </div>

                    <h4 style={{ margin: "0 0 4px 0", color: "#0f172a", fontSize: "0.95rem" }}>{item.nama}</h4>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>HET: Rp{item.het.toLocaleString()}/{item.satuan}</span>
                  </div>

                  {/* Pricing & Compliance Badge */}
                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #e2e8f0" }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
                      Rp{item.hargaKios.toLocaleString()} <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "#64748b" }}>/{item.satuan}</span>
                    </div>

                    <span style={{
                      display: "inline-block",
                      marginTop: "6px",
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      color: item.statusColor
                    }}>
                      • {item.badgeHET}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ================= KOLOM KANAN: INSPEKSI & LEGALITAS ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Catatan Inspeksi Enumerator */}
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
              📝 Catatan Inspeksi
            </h4>
            <div style={{ backgroundColor: "#f8fafc", padding: "0.85rem", borderRadius: "10px", fontSize: "0.825rem", color: "#334155", borderLeft: "3px solid #064e3b" }}>
              "Stok beras medium SPHP aman dan dijual sesuai HET. Pasokan minyak goreng curah menipis dari agen distributor."
            </div>
            <div style={{ marginTop: "10px", fontSize: "0.75rem", color: "#64748b" }}>
              Petugas: <strong>{dataKios.enumerator}</strong>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
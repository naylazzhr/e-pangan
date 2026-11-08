import React, { useState, useEffect } from "react";
import { getKomoditas, getPasar, kalkulasiSmartBudgeting } from "./api";
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  Search,
  Trash2,
  Zap,
  AlertTriangle,
  CheckCircle,
  X,
  Navigation,
  ExternalLink,
  Lightbulb,
  ShoppingCart,
  Minus,
  Plus,
} from "lucide-react";

const SUBSTITUSI_MAP = {
  "Cabai Rawit Merah": "Cabai Keriting",
  "Beras Premium": "Beras Medium IR-64",
};

const periodMultiplier = { harian: 1, mingguan: 7, bulanan: 30 };

// perkiraan konsumsi per orang per hari (kg atau liter)
const KONSUMSI_PER_HARI = [
  { kata: "beras", jumlah: 0.15 },
  { kata: "minyak", jumlah: 0.03 },
  { kata: "gula", jumlah: 0.02 },
  { kata: "telur", jumlah: 0.03 },
  { kata: "bawang", jumlah: 0.01 },
  { kata: "cabai", jumlah: 0.01 },
  { kata: "ayam", jumlah: 0.04 },
  { kata: "ikan", jumlah: 0.03 },
  { kata: "daging", jumlah: 0.015 },
  { kata: "tomat", jumlah: 0.02 },
  { kata: "tepung", jumlah: 0.01 },
  { kata: "garam", jumlah: 0.005 },
];
const KONSUMSI_DEFAULT = 0.02;

function hitungQty(nama, anggota, hari) {
  const n = (nama || "").toLowerCase();
  const cocok = KONSUMSI_PER_HARI.find((k) => n.includes(k.kata));
  const perHari = cocok ? cocok.jumlah : KONSUMSI_DEFAULT;
  return Math.max(1, Math.round(perHari * anggota * hari));
}

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

function QtyControl({ qty, onMinus, onPlus, small }) {
  const pad = small ? "4px 8px" : "7px 12px";
  const btn = {
    border: "none",
    background: "transparent",
    padding: pad,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    color: "#1b4332",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "#ffffff",
        border: "1px solid #d8e2dc",
        borderRadius: "999px",
        overflow: "hidden",
      }}
    >
      <button onClick={onMinus} style={btn} aria-label="Kurangi">
        <Minus size={small ? 12 : 14} />
      </button>
      <span style={{ minWidth: small ? 18 : 24, textAlign: "center", fontWeight: "800", fontSize: small ? "12px" : "13.5px" }}>
        {qty}
      </span>
      <button onClick={onPlus} style={btn} aria-label="Tambah">
        <Plus size={small ? 12 : 14} />
      </button>
    </div>
  );
}

export default function SmartBudgeting({ onBack, onNavigate }) {
  const [budget, setBudget] = useState(600000);
  const [period, setPeriod] = useState("bulanan");
  const [familyMembers, setFamilyMembers] = useState(4);
  const [selectedPasarId, setSelectedPasarId] = useState("");
  const [items, setItems] = useState([]);
  const [searchKatalog, setSearchKatalog] = useState("");
  const [pasarList, setPasarList] = useState([]);
  const [katalogList, setKatalogList] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [allKomoditasData, setAllKomoditasData] = useState([]);

  useEffect(() => {
    let isMounted = true;
    setLoadingData(true);

    Promise.all([getPasar().catch(() => null), getKomoditas().catch(() => null)])
      .then(([pasarRes, komoditasRes]) => {
        if (!isMounted) return;

        const rawPasar = pasarRes?.data || pasarRes?.pasar || [];
        if (Array.isArray(rawPasar) && rawPasar.length > 0) {
          const mappedPasar = rawPasar.map((p, idx) => ({
            id: String(p.id || idx + 1),
            name: p.nama_pasar || p.name,
            sub: `${p.nama_pasar || p.name} (${p.kecamatan || "Kabupaten Lamongan"})`,
            alamat: p.alamat || `${p.nama_pasar || p.name}, Lamongan`,
            info: `Titik Pantau Resmi • ${p.jam_operasional || "05:00 - 15:00 WIB"}`,
            lat: p.latitude || -7.1043741,
            lon: p.longitude || 112.1661619,
            maps: `https://www.google.com/maps/search/?api=1&query=${p.latitude || -7.1043741},${p.longitude || 112.1661619}`,
            rute: `https://www.google.com/maps/dir/?api=1&destination=${p.latitude || -7.1043741},${p.longitude || 112.1661619}`,
          }));
          setPasarList(mappedPasar);
          setSelectedPasarId(mappedPasar[0].id);
        }

        const rawKomoditas = komoditasRes?.data || komoditasRes?.komoditas || [];
        if (Array.isArray(rawKomoditas) && rawKomoditas.length > 0) {
          setAllKomoditasData(rawKomoditas);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!allKomoditasData || allKomoditasData.length === 0) return;
    const currentPasarObj = pasarList.find((p) => p.id === selectedPasarId) || pasarList[0];
    const targetPasarName = currentPasarObj?.name || "";

    let pasarItems = allKomoditasData.filter(
      (item) =>
        !targetPasarName || (item.lokasi && item.lokasi.toLowerCase().includes(targetPasarName.toLowerCase()))
    );
    if (pasarItems.length === 0) {
      pasarItems = allKomoditasData;
    }

    const unique = [];
    const seen = new Set();
    pasarItems.forEach((item, idx) => {
      const namaBahan = item.nama_bahan || item.komoditas;
      if (namaBahan && !seen.has(namaBahan)) {
        seen.add(namaBahan);
        unique.push({
          id: String(item.id || idx + 1),
          name: namaBahan,
          price: item.harga || item.minPrice || 0,
          unit: item.satuan || "kg",
          category: (item.kategori || "BAHAN POKOK").toUpperCase(),
        });
      }
    });

    setKatalogList(unique);

    setItems((prevItems) => {
      if (prevItems.length === 0) {
        const hari = periodMultiplier[period];
        const dipilih = [];
        KONSUMSI_PER_HARI.forEach((k) => {
          if (dipilih.length >= 6) return;
          const cocok = unique.find((u) => u.name.toLowerCase().includes(k.kata) && !dipilih.includes(u));
          if (cocok) dipilih.push(cocok);
        });
        const awal = dipilih.length > 0 ? dipilih : unique.slice(0, 6);

        return awal.map((k) => ({
          ...k,
          qty: hitungQty(k.name, familyMembers, hari),
          auto: true,
        }));
      }
      return prevItems.map((it) => {
        const match = unique.find((u) => u.name.toLowerCase() === it.name.toLowerCase());
        return match ? { ...it, price: match.price } : it;
      });
    });
  }, [selectedPasarId, allKomoditasData, pasarList, familyMembers, period]);

  useEffect(() => {
    const hari = periodMultiplier[period];
    setItems((prev) =>
      prev.map((it) => (it.auto ? { ...it, qty: hitungQty(it.name, familyMembers, hari) } : it))
    );
  }, [period, familyMembers]);

  const updateQty = (id, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta), auto: false } : item
      )
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((item) => item.id !== id));

  const addFromKatalog = (katalogItem) => {
    const exists = items.find((i) => i.id === katalogItem.id);
    if (exists) {
      updateQty(katalogItem.id, 1);
    } else {
      setItems([
        ...items,
        {
          ...katalogItem,
          qty: hitungQty(katalogItem.name, familyMembers, periodMultiplier[period]),
          auto: true,
        },
      ]);
    }
  };

  const handleApplySubstitution = (oldName, newName) => {
    let subItem = katalogList.find((m) => m.name && m.name.toLowerCase().includes(newName.toLowerCase()));
    
    if (!subItem && allKomoditasData.length > 0) {
      const globalMatch = allKomoditasData.find((m) => (m.nama_bahan || m.komoditas || "").toLowerCase().includes(newName.toLowerCase()));
      if (globalMatch) {
        subItem = {
          id: String(globalMatch.id || Date.now()),
          name: globalMatch.nama_bahan || globalMatch.komoditas,
          price: globalMatch.harga || globalMatch.minPrice || 15000,
          unit: globalMatch.satuan || "kg",
          category: (globalMatch.kategori || "BAHAN POKOK").toUpperCase(),
        };
      }
    }

    if (!subItem) {
      subItem = {
        id: String(Date.now()),
        name: newName,
        price: 25000,
        unit: "kg",
        category: "BAHAN POKOK",
      };
    }

    setItems((prev) =>
      prev.map((item) =>
        item.name && item.name.toLowerCase().trim() === oldName.toLowerCase().trim()
          ? {
              ...item,
              id: subItem.id,
              name: subItem.name,
              price: subItem.price,
              unit: subItem.unit,
              category: subItem.category || item.category,
              auto: false,
            }
          : item
      )
    );
  };

  const handleOptimasiOtomatis = async () => {
    setIsOptimizing(true);
    try {
      const activeP = pasarList.find((p) => p.id === selectedPasarId);
      const res = await kalkulasiSmartBudgeting({
        budget,
        lokasi_pasar: activeP ? activeP.name : "",
      });
      const paket = res?.rekomendasi_paket || res?.data || [];
      if (Array.isArray(paket) && paket.length > 0) {
        const paketItems = paket.map((r, idx) => ({
          id: String(r.id || idx + 1),
          name: r.nama_bahan || r.komoditas,
          price: r.harga || r.minPrice || 10000,
          unit: r.satuan || "kg",
          qty: 1,
        }));
        setItems(paketItems);
      }
    } catch (e) {
      console.warn("Optimasi backend error:", e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const totalCost = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const remainingBudget = budget - totalCost;
  const isOverBudget = remainingBudget < 0;
  const daysInPeriod = periodMultiplier[period];
  const dailySpend = Math.round(totalCost / daysInPeriod);
  const usedPercent = budget > 0 ? Math.min(100, Math.round((totalCost / budget) * 100)) : 0;

  const activePasar = pasarList.find((p) => p.id === selectedPasarId) ||
    pasarList[0] || {
      name: "Memuat Pasar...",
      alamat: "Kabupaten Lamongan",
      info: "Titik Pantau Resmi DKPP",
      lat: -7.1126,
      lon: 112.1634,
      maps: "#",
      rute: "#",
    };

  const expensiveItem = items.find((i) => SUBSTITUSI_MAP[i.name]);

  const filteredKatalog = katalogList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchKatalog.toLowerCase()) ||
      item.category.toLowerCase().includes(searchKatalog.toLowerCase())
  );

  const goBack = () => {
    if (onBack) onBack();
    else if (onNavigate) onNavigate("dashboard");
  };

  return (
    <div
      style={{
        backgroundColor: "#f3f6f4",
        minHeight: "100vh",
        paddingBottom: "5rem",
        color: "#112216",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style>{`
        .sb-container {
          width: 100%;
          max-width: 1750px;
          margin: 0 auto;
          padding: 0 3rem;
          box-sizing: border-box;
        }
        .sb-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          padding: 32px 0 28px;
          margin-bottom: 28px;
          border-bottom: 1px solid #d8e2dc;
        }
        .sb-main-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 28px;
          align-items: start;
        }
        .sb-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }
        .sb-card {
          background: #ffffff;
          border: 1px solid #d8e2dc;
          border-radius: 24px;
          padding: 28px;
        }
        .sb-label {
          font-size: 11px;
          font-weight: 800;
          color: #2d6a4f;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .sb-card-title {
          font-size: 1.25rem;
          font-weight: 800;
          margin: 0;
        }
        .sb-field-label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #4a6550;
          margin-bottom: 8px;
          letter-spacing: 0.04em;
        }
        .sb-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid #d8e2dc;
          background: #f4f8f5;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          color: #112216;
          outline: none;
        }
        .sb-input:focus {
          border-color: #2d6a4f;
        }
        .sb-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid #d8e2dc;
          background: #ffffff;
          color: #4a6550;
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
        }
        .sb-chip.active {
          background: #1b4332;
          border-color: #1b4332;
          color: #ffffff;
        }
        .sb-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 18px;
          border-radius: 18px;
          background: #f4f8f5;
          border: 1px solid #e6eee9;
        }
        .sb-katalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 14px;
          max-height: 460px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .sb-katalog-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 18px;
          border: 1px solid #d8e2dc;
          border-radius: 20px;
          background: #ffffff;
        }
        .sb-side {
          position: sticky;
          top: 90px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sb-kasir-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 16px;
          padding-right: 4px;
        }
        @media (max-width: 1000px) {
          .sb-main-grid { grid-template-columns: 1fr; }
          .sb-side { position: static; }
        }
        @media (max-width: 768px) {
          .sb-container { padding: 0 1rem; }
          .sb-head {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px 0 16px;
            gap: 8px;
          }
          .sb-head h1 {
            font-size: 1.5rem !important;
            line-height: 1.2 !important;
          }
          .sb-head p {
            font-size: 12.5px !important;
          }
          .sb-card { padding: 16px; border-radius: 18px; }
          .sb-item-row { flex-wrap: wrap; padding: 12px; }
          .sb-two-col { grid-template-columns: 1fr !important; }
          .sb-katalog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="sb-container">
        <div className="sb-head">
          <div>
            <button
              onClick={goBack}
              style={{
                background: "none",
                border: "none",
                color: "#2d6a4f",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13.5px",
                padding: 0,
                marginBottom: "18px",
                fontFamily: "inherit",
              }}
            >
              <ArrowLeft size={16} /> Kembali ke Beranda
            </button>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#e2f5ea",
                padding: "6px 16px",
                borderRadius: "999px",
                marginBottom: "14px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2d6a4f" }}></span>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#1b4332", letterSpacing: "0.05em" }}>
                INOVASI DKPP KABUPATEN LAMONGAN
              </span>
            </div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "800", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              Smart Budgeting: <span style={{ color: "#2d6a4f" }}>Kalkulator &amp; Optimasi Dapur</span>
            </h1>
          </div>
          <p style={{ color: "#4a6550", margin: 0, fontSize: "1rem", maxWidth: "460px", lineHeight: "1.6" }}>
            Hitung kebutuhan dapur keluarga dan temukan pasar rakyat dengan kombinasi harga paling hemat di Kabupaten Lamongan.
          </p>
        </div>

        <div className="sb-main-grid">
          <div className="sb-col">
            <div className="sb-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                <span className="sb-label">Alokasi Anggaran</span>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <button
                    onClick={handleOptimasiOtomatis}
                    disabled={isOptimizing}
                    style={{
                      background: "#1b4332",
                      color: "#ffffff",
                      border: "none",
                      padding: "9px 18px",
                      borderRadius: "999px",
                      fontWeight: "700",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      cursor: isOptimizing ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Zap size={14} /> {isOptimizing ? "Menghitung..." : "Optimasi Paket Otomatis"}
                  </button>
                  <button
                    onClick={() => {
                      setBudget(600000);
                      setPeriod("bulanan");
                      setFamilyMembers(4);
                    }}
                    style={{ background: "none", border: "none", color: "#4a6550", fontSize: "13px", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px", fontFamily: "inherit" }}
                  >
                    <RefreshCw size={13} /> Reset
                  </button>
                </div>
              </div>

              <h3 className="sb-card-title" style={{ marginBottom: "16px" }}>
                Pagu Anggaran Belanja {period === "harian" ? "Harian" : period === "mingguan" ? "Mingguan" : "Bulanan"}
              </h3>

              <div style={{ display: "flex", alignItems: "center", background: "#f4f8f5", borderRadius: "16px", border: "1px solid #d8e2dc", padding: "0 18px", marginBottom: "14px" }}>
                <span style={{ fontSize: "18px", fontWeight: "800", color: "#2d6a4f" }}>Rp</span>
                <input
                  type="text"
                  value={budget === 0 ? "" : budget.toLocaleString("id-ID")}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, "");
                    setBudget(rawVal === "" ? 0 : Number(rawVal));
                  }}
                  style={{ width: "100%", border: "none", outline: "none", background: "transparent", padding: "15px", fontSize: "20px", fontWeight: "800", fontFamily: "inherit", color: "#112216" }}
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "22px" }}>
                {[200000, 400000, 600000, 850000, 1200000].map((val) => (
                  <button key={val} onClick={() => setBudget(val)} className={`sb-chip ${budget === val ? "active" : ""}`}>
                    {formatRp(val)}
                  </button>
                ))}
              </div>

              <div className="sb-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", paddingTop: "20px", borderTop: "1px solid #d8e2dc" }}>
                <div>
                  <label className="sb-field-label">PERIODE BELANJA</label>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className="sb-input" style={{ cursor: "pointer" }}>
                    <option value="harian">Harian (1 Hari)</option>
                    <option value="mingguan">Mingguan (7 Hari)</option>
                    <option value="bulanan">Bulanan (30 Hari)</option>
                  </select>
                </div>
                <div>
                  <label className="sb-field-label">JUMLAH ANGGOTA KELUARGA</label>
                  <input
                    type="number"
                    min="1"
                    value={familyMembers}
                    onChange={(e) => setFamilyMembers(Math.max(1, Number(e.target.value)))}
                    className="sb-input"
                  />
                </div>
              </div>
            </div>

            <div className="sb-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <span className="sb-label">Rekomendasi Lokasi &amp; Peta Pasar</span>
                <span style={{ background: "#e2f5ea", color: "#1b4332", padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: "800" }}>
                  Titik GPS Terverifikasi DKPP
                </span>
              </div>
              <h3 className="sb-card-title" style={{ marginBottom: "6px" }}>Pilih Pasar Rakyat Tujuan di Lamongan</h3>
              <p style={{ color: "#4a6550", fontSize: "13.5px", margin: "0 0 18px 0", lineHeight: "1.5" }}>
                Pilih pasar untuk melihat alamat lengkap dan navigasi langsung ke titik pasar.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
                {loadingData ? (
                  <p style={{ fontSize: "13px", color: "#4a6550", margin: 0 }}>Memuat daftar pasar...</p>
                ) : (
                  pasarList.map((pasar) => (
                    <button
                      key={pasar.id}
                      onClick={() => setSelectedPasarId(pasar.id)}
                      className={`sb-chip ${selectedPasarId === pasar.id ? "active" : ""}`}
                    >
                      <MapPin size={14} color={selectedPasarId === pasar.id ? "#74c69d" : "#2d6a4f"} /> {pasar.name}
                    </button>
                  ))
                )}
              </div>

              <div style={{ background: "#e2f5ea", borderRadius: "20px", padding: "20px", marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "16px" }}>
                    <MapPin size={17} color="#2d6a4f" /> {activePasar.name}
                  </div>
                  <div style={{ color: "#4a6550", fontSize: "13px", fontWeight: "600", marginTop: "6px" }}>{activePasar.alamat}</div>
                  <div style={{ color: "#1b4332", fontSize: "12.5px", fontWeight: "700", marginTop: "4px" }}>{activePasar.info}</div>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <a
                    href={activePasar.rute}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: "#1b4332", color: "#ffffff", padding: "10px 18px", borderRadius: "999px", fontSize: "12.5px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Navigation size={14} /> Petunjuk Rute
                  </a>
                  <a
                    href={activePasar.maps}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: "#ffffff", color: "#1b4332", border: "1px solid #2d6a4f", padding: "10px 18px", borderRadius: "999px", fontSize: "12.5px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <ExternalLink size={14} /> Buka di Maps
                  </a>
                </div>
              </div>

              <div style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid #d8e2dc", height: "250px" }}>
                <iframe
                  title={`Peta Lokasi ${activePasar.name}`}
                  src={`https://maps.google.com/maps?q=${activePasar.lat},${activePasar.lon}&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            <div className="sb-card">
              <div style={{ marginBottom: "18px" }}>
                <h3 className="sb-card-title">Rencana Belanja Pangan</h3>
                <span style={{ fontSize: "13px", color: "#4a6550", fontWeight: "600" }}>
                  {items.length} komoditas terpilih
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#4a6550", padding: "20px", margin: 0 }}>
                    Belum ada item dipilih. Tambahkan dari katalog di bawah.
                  </p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="sb-item-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: "800", fontSize: "14.5px" }}>{item.name}</div>
                        <div style={{ color: "#4a6550", fontSize: "12.5px", fontWeight: "600" }}>
                          {formatRp(item.price)} /{item.unit}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <QtyControl qty={item.qty} onMinus={() => updateQty(item.id, -1)} onPlus={() => updateQty(item.id, 1)} />
                        <span style={{ fontWeight: "800", textAlign: "right", minWidth: "110px", fontSize: "15px" }}>
                          {formatRp(item.qty * item.price)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{ border: "none", background: "transparent", color: "#e11d48", cursor: "pointer", padding: "4px", display: "flex" }}
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="sb-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
                <div>
                  <span className="sb-label">Direktori Pangan Daerah</span>
                  <h3 className="sb-card-title" style={{ margin: "4px 0 2px" }}>Katalog Komoditas Pangan</h3>
                  <span style={{ fontSize: "13px", color: "#4a6550", fontWeight: "600" }}>
                    Daftar harga dari pasar yang dipilih
                  </span>
                </div>
                <div style={{ width: "260px", maxWidth: "100%", position: "relative" }}>
                  <Search size={15} color="#4a6550" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Cari komoditas..."
                    value={searchKatalog}
                    onChange={(e) => setSearchKatalog(e.target.value)}
                    className="sb-input"
                    style={{ padding: "11px 16px 11px 40px", borderRadius: "999px" }}
                  />
                </div>
              </div>

              <div className="sb-katalog-grid">
                {loadingData ? (
                  <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#4a6550", padding: "30px", margin: 0 }}>
                    Memuat katalog...
                  </p>
                ) : filteredKatalog.length === 0 ? (
                  <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#4a6550", padding: "30px", margin: 0 }}>
                    Komoditas tidak ditemukan.
                  </p>
                ) : (
                  filteredKatalog.map((katalog) => {
                    const isAdded = items.some((i) => i.id === katalog.id);
                    return (
                      <div key={katalog.id} className="sb-katalog-card">
                        <div style={{ minWidth: 0 }}>
                          <span style={{ background: "#e2f5ea", color: "#1b4332", padding: "3px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: "800", letterSpacing: "0.04em" }}>
                            {katalog.category}
                          </span>
                          <div style={{ fontWeight: "800", fontSize: "15px", margin: "8px 0 4px" }}>{katalog.name}</div>
                          <div style={{ color: "#1b4332", fontWeight: "800", fontSize: "16px" }}>
                            {formatRp(katalog.price)}{" "}
                            <span style={{ fontSize: "12px", color: "#4a6550", fontWeight: "600" }}>/{katalog.unit}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => addFromKatalog(katalog)}
                          style={{
                            background: isAdded ? "#e2f5ea" : "#1b4332",
                            color: isAdded ? "#1b4332" : "#ffffff",
                            border: "none",
                            padding: "10px 18px",
                            borderRadius: "999px",
                            fontSize: "12.5px",
                            fontWeight: "800",
                            fontFamily: "inherit",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isAdded ? "+ Tambah Lagi" : "Tambah"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="sb-side">
            <div style={{ background: "#1b4332", borderRadius: "24px", padding: "26px", color: "#ffffff" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.12)", padding: "6px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", color: "#b7efc5", marginBottom: "18px" }}>
                <Zap size={13} /> DIAGNOSA REAL-TIME
              </div>

              {isOverBudget ? (
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "20px", fontWeight: "800", color: "#fca5a5", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={20} /> Melebihi Anggaran
                  </h4>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
                    Defisit {formatRp(Math.abs(remainingBudget))}
                  </span>
                </div>
              ) : (
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "20px", fontWeight: "800", color: "#b7efc5", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle size={20} /> Anggaran Aman
                  </h4>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
                    Sisa {formatRp(remainingBudget)}
                  </span>
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "rgba(255,255,255,0.75)", marginBottom: "6px", fontWeight: "600" }}>
                  <span>Terpakai: {formatRp(totalCost)}</span>
                  <span>{usedPercent}%</span>
                </div>
                <div style={{ height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      background: isOverBudget ? "#ef4444" : "#74c69d",
                      width: `${usedPercent}%`,
                      borderRadius: "999px",
                      transition: "width 0.4s",
                    }}
                  ></div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "16px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px", fontWeight: "600" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(255,255,255,0.75)" }}>Sisa Budget:</span>
                  <span>{formatRp(remainingBudget < 0 ? 0 : remainingBudget)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#b7efc5" }}>
                  <span>Estimasi Pengeluaran:</span>
                  <span>~{formatRp(dailySpend)}/hari</span>
                </div>
              </div>

              {isOverBudget && expensiveItem && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "16px", marginTop: "16px" }}>
                  <p style={{ fontSize: "12px", color: "#fca5a5", fontWeight: "700", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Lightbulb size={14} /> Saran Substitusi Bahan
                  </p>
                  <div style={{ background: "rgba(0,0,0,0.2)", padding: "14px", borderRadius: "14px" }}>
                    <p style={{ fontSize: "12px", margin: "0 0 10px 0", lineHeight: "1.5" }}>
                      Ganti <strong>{expensiveItem.name}</strong> dengan <strong>{SUBSTITUSI_MAP[expensiveItem.name]}</strong> untuk menghemat pengeluaran.
                    </p>
                    <button
                      onClick={() => handleApplySubstitution(expensiveItem.name, SUBSTITUSI_MAP[expensiveItem.name])}
                      style={{ background: "#b7efc5", color: "#1b4332", border: "none", width: "100%", padding: "9px", borderRadius: "999px", fontWeight: "800", fontSize: "12px", fontFamily: "inherit", cursor: "pointer" }}
                    >
                      Terapkan Substitusi
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="sb-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #d8e2dc", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#4a6550", letterSpacing: "0.04em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShoppingCart size={14} color="#2d6a4f" /> Rincian Kasir
                </span>
                <span style={{ background: "#e2f5ea", color: "#1b4332", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                  {activePasar.name}
                </span>
              </div>

              <div className="sb-kasir-list">
                {items.length === 0 ? (
                  <p style={{ color: "#9ca3af", textAlign: "center", fontSize: "12px", margin: "10px 0" }}>Belum ada item.</p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f4f8f5", padding: "10px 12px", borderRadius: "14px", border: "1px solid #e6eee9", gap: "8px" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "13px" }}>
                          {item.name}
                        </span>
                        <span style={{ fontSize: "11px", color: "#4a6550", fontWeight: "600" }}>
                          {formatRp(item.price)} /{item.unit}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <QtyControl small qty={item.qty} onMinus={() => updateQty(item.id, -1)} onPlus={() => updateQty(item.id, 1)} />
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{ border: "none", background: "#fee2e2", color: "#ef4444", width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, flexShrink: 0 }}
                          title="Hapus item"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ borderTop: "1px solid #d8e2dc", paddingTop: "16px", display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "16px" }}>
                <span>Total Belanja:</span>
                <span style={{ color: "#2d6a4f" }}>{formatRp(totalCost)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
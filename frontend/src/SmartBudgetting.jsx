import React, { useState, useEffect } from 'react';
import { getKomoditas, getPasar, kalkulasiSmartBudgeting } from './api';
import { Sparkles, ArrowLeft, RefreshCw, Calculator, MapPin, Search, Trash2, Zap, AlertTriangle, CheckCircle, X } from 'lucide-react';

const SUBSTITUSI_MAP = {
  'Cabai Rawit Merah': 'Cabai Keriting',
  'Beras Premium': 'Beras Medium IR-64',
};

export default function SmartBudgeting({ onBack, onNavigate }) {
  const [budget, setBudget] = useState(200000);
  const [period, setPeriod] = useState('bulanan');
  const [familyMembers, setFamilyMembers] = useState(4);
  const [selectedPasarId, setSelectedPasarId] = useState('');
  const [items, setItems] = useState([]);
  const [searchKatalog, setSearchKatalog] = useState('');
  const [pasarList, setPasarList] = useState([]);
  const [katalogList, setKatalogList] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const periodMultiplier = { harian: 1, mingguan: 7, bulanan: 30 };

  useEffect(() => {
    let isMounted = true;
    setLoadingData(true);

    Promise.all([
      getPasar().catch(() => null),
      getKomoditas().catch(() => null)
    ]).then(([pasarRes, komoditasRes]) => {
      if (!isMounted) return;

      const rawPasar = pasarRes?.data || pasarRes?.pasar || [];
      if (Array.isArray(rawPasar) && rawPasar.length > 0) {
        const mappedPasar = rawPasar.map((p, idx) => ({
          id: String(p.id || idx + 1),
          name: p.nama_pasar || p.name,
          sub: `${p.nama_pasar || p.name} (${p.kecamatan || 'Kabupaten Lamongan'})`,
          alamat: p.alamat || `${p.nama_pasar || p.name}, Lamongan`,
          info: `Titik Pantau Resmi • ${p.jam_operasional || '05:00 - 15:00 WIB'}`,
          lat: p.latitude || -7.1126,
          lon: p.longitude || 112.1634,
          maps: `https://www.google.com/maps/search/?api=1&query=${p.latitude || -7.1126},${p.longitude || 112.1634}`,
          rute: `https://www.google.com/maps/dir/?api=1&destination=${p.latitude || -7.1126},${p.longitude || 112.1634}`
        }));
        setPasarList(mappedPasar);
        setSelectedPasarId(mappedPasar[0].id);
      }

      const rawKomoditas = komoditasRes?.data || komoditasRes?.komoditas || [];
      if (Array.isArray(rawKomoditas) && rawKomoditas.length > 0) {
        const unique = [];
        const seen = new Set();
        rawKomoditas.forEach((item, idx) => {
          const namaBahan = item.nama_bahan || item.komoditas;
          if (namaBahan && !seen.has(namaBahan)) {
            seen.add(namaBahan);
            unique.push({
              id: String(item.id || idx + 1),
              name: namaBahan,
              price: item.harga || item.minPrice || 0,
              unit: item.satuan || 'kg',
              category: (item.kategori || 'BAHAN POKOK').toUpperCase()
            });
          }
        });
        setKatalogList(unique);

        const days = periodMultiplier['bulanan'];
        const defaultItems = unique.slice(0, 6).map((k, idx) => ({
          ...k,
          qty: Math.max(1, Math.round(0.2 * familyMembers * days * (idx + 1 === 1 ? 0.5 : 0.1)))
        }));
        setItems(defaultItems);
      }
    }).finally(() => {
      if (isMounted) setLoadingData(false);
    });

    return () => { isMounted = false; };
  }, []);

  const updateQty = (id, delta) => {
    setItems(prev =>
      prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item)
    );
  };

  const removeItem = (id) => setItems(prev => prev.filter(item => item.id !== id));

  const addFromKatalog = (katalogItem) => {
    const exists = items.find(i => i.id === katalogItem.id);
    if (exists) {
      updateQty(katalogItem.id, 1);
    } else {
      setItems([...items, { ...katalogItem, qty: 1 }]);
    }
  };

  const handleApplySubstitution = (oldName, newName) => {
    const subItem = katalogList.find(m => m.name.toLowerCase().includes(newName.toLowerCase()));
    if (!subItem) return;
    setItems(prev => prev.map(item => item.name === oldName ? { ...item, ...subItem } : item));
  };

  const handleOptimasiOtomatis = async () => {
    setIsOptimizing(true);
    try {
      const activeP = pasarList.find(p => p.id === selectedPasarId);
      const res = await kalkulasiSmartBudgeting({
        budget,
        lokasi_pasar: activeP ? activeP.name : ""
      });
      const paket = res?.rekomendasi_paket || res?.data || [];
      if (Array.isArray(paket) && paket.length > 0) {
        const paketItems = paket.map((r, idx) => ({
          id: String(r.id || idx + 1),
          name: r.nama_bahan || r.komoditas,
          price: r.harga || r.minPrice || 10000,
          unit: r.satuan || 'kg',
          qty: 1
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

  const activePasar = pasarList.find(p => p.id === selectedPasarId) || pasarList[0] || {
    name: 'Memuat Pasar...',
    alamat: 'Kabupaten Lamongan',
    info: 'Titik Pantau Resmi DKPP',
    lat: -7.1126,
    lon: 112.1634,
    maps: '#',
    rute: '#'
  };

  const expensiveItem = items.find(i => SUBSTITUSI_MAP[i.name]);

  const filteredKatalog = katalogList.filter(item =>
    item.name.toLowerCase().includes(searchKatalog.toLowerCase()) ||
    item.category.toLowerCase().includes(searchKatalog.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#f3f6f4', minHeight: '100vh', padding: '2.5rem 3rem 5rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#112216' }}>
      <div style={{ maxWidth: '1750px', margin: '0 auto' }}>

        {/* HEADER BANNER */}
        <div style={{ background: 'linear-gradient(135deg, #071a11 0%, #113324 50%, #235841 100%)', borderRadius: '36px', padding: '3rem 4rem', color: '#fff', marginBottom: '2.5rem', boxShadow: '0 24px 54px rgba(10, 33, 22, 0.16)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => onBack ? onBack() : onNavigate('dashboard')}
              style={{ background: 'none', border: 'none', color: '#b7efc5', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', padding: 0 }}
            >
              <ArrowLeft size={16} /> Kembali ke Beranda
            </button>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '4px 14px', borderRadius: '99px', fontSize: '11px', fontWeight: '800', color: '#b7efc5', backdropFilter: 'blur(10px)' }}>
              INOVASI DKPP KABUPATEN LAMONGAN
            </span>
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-0.03em' }}>
            Smart Budgeting: <span style={{ background: 'linear-gradient(135deg, #74c69d 0%, #d8f3dc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Kalkulator &amp; Optimasi Dapur</span>
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', maxWidth: '750px', lineHeight: '1.6' }}>
            Hitung estimasi kebutuhan dapur secara riil dan dapatkan rekomendasi pasar rakyat dengan kombinasi harga paling hemat di Kabupaten Lamongan berdasarkan database live.
          </p>
        </div>

        {/* MAIN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* ALOKASI ANGGARAN */}
            <div style={{ background: '#fff', borderRadius: '28px', padding: '32px', border: '1px solid #d2ded7', boxShadow: '0 4px 20px rgba(27, 67, 50, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#2d6a4f', letterSpacing: '0.06em', textTransform: 'uppercase' }}>ALOKASI ANGGARAN</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={handleOptimasiOtomatis}
                    disabled={isOptimizing}
                    style={{ background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '99px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(45, 106, 79, 0.25)' }}
                  >
                    <Zap size={14} /> {isOptimizing ? "Menghitung..." : "Optimasi Paket Otomatis"}
                  </button>
                  <button
                    onClick={() => { setBudget(200000); setPeriod('bulanan'); setFamilyMembers(4); }}
                    style={{ background: 'none', border: 'none', color: '#4e6754', fontSize: '13px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={13} /> Reset
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f1d14', margin: '0 0 16px 0' }}>
                Pagu Anggaran Belanja {period === 'harian' ? 'Harian' : period === 'mingguan' ? 'Mingguan' : 'Bulanan'}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', background: '#f2f7f4', borderRadius: '16px', border: '1px solid #d2ded7', padding: '0 16px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#2d6a4f' }}>Rp</span>
                <input
                  type="text"
                  value={budget === 0 ? '' : budget.toLocaleString('id-ID')}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, '');
                    setBudget(rawVal === '' ? 0 : Number(rawVal));
                  }}
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '16px', fontSize: '20px', fontWeight: '800', color: '#0f1d14' }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                {[200000, 400000, 600000, 850000, 1200000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setBudget(val)}
                    style={{ padding: '8px 16px', borderRadius: '99px', border: budget === val ? '1px solid #1b4332' : '1px solid #d2ded7', background: budget === val ? '#1b4332' : '#ffffff', color: budget === val ? '#ffffff' : '#4e6754', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Rp {val.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '20px', borderTop: '1px solid #d2ded7' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#4e6754', marginBottom: '8px', letterSpacing: '0.04em' }}>PERIODE BELANJA</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '1px solid #d2ded7', background: '#f2f7f4', fontSize: '14px', fontWeight: '600', color: '#0f1d14', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="harian">Harian (1 Hari)</option>
                    <option value="mingguan">Mingguan (7 Hari)</option>
                    <option value="bulanan">Bulanan (30 Hari)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#4e6754', marginBottom: '8px', letterSpacing: '0.04em' }}>JUMLAH ANGGOTA KELUARGA</label>
                  <input
                    type="number"
                    min="1"
                    value={familyMembers}
                    onChange={(e) => setFamilyMembers(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '1px solid #d2ded7', background: '#f2f7f4', fontSize: '14px', fontWeight: '700', color: '#0f1d14', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* REKOMENDASI PASAR & LIVE MAPS */}
            <div style={{ background: '#fff', borderRadius: '28px', padding: '32px', border: '1px solid #d2ded7', boxShadow: '0 4px 20px rgba(27, 67, 50, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#2d6a4f', letterSpacing: '0.06em', textTransform: 'uppercase' }}>REKOMENDASI LOKASI &amp; PETA PASAR</span>
                <span style={{ background: '#eef8f2', color: '#1b4332', border: '1px solid #b7efc5', padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '800' }}>
                  Titik GPS Terverifikasi DKPP
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f1d14', margin: '0 0 6px 0' }}>Pilih Pasar Rakyat Tujuan di Lamongan</h3>
              <p style={{ color: '#4e6754', fontSize: '13.5px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                Pilih pasar untuk melihat estimasi jarak, alamat lengkap, dan navigasi langsung ke titik pasar.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {loadingData ? (
                  <p style={{ fontSize: '13px', color: '#4e6754' }}>Memuat daftar pasar...</p>
                ) : pasarList.map((pasar) => (
                  <button
                    key={pasar.id}
                    onClick={() => setSelectedPasarId(pasar.id)}
                    style={{ padding: '10px 18px', borderRadius: '99px', border: selectedPasarId === pasar.id ? '1px solid #1b4332' : '1px solid #d2ded7', background: selectedPasarId === pasar.id ? '#1b4332' : '#f2f7f4', color: selectedPasarId === pasar.id ? '#ffffff' : '#4e6754', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <MapPin size={14} color={selectedPasarId === pasar.id ? '#74c69d' : '#2d6a4f'} /> {pasar.name}
                  </button>
                ))}
              </div>

              <div style={{ background: '#eef8f2', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', border: '1px solid #b7efc5' }}>
                <div>
                  <div style={{ fontWeight: '800', color: '#0f1d14', fontSize: '16px' }}>📍 {activePasar.name}</div>
                  <div style={{ color: '#4e6754', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>🏠 Alamat: {activePasar.alamat}</div>
                  <div style={{ color: '#1b4332', fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>✨ {activePasar.info}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a
                    href={activePasar.rute}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: '#2d6a4f', color: '#fff', padding: '8px 16px', borderRadius: '99px', fontSize: '12.5px', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    🧭 Petunjuk Rute Maps
                  </a>
                  <a
                    href={activePasar.maps}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: '#fff', color: '#2d6a4f', border: '1px solid #2d6a4f', padding: '8px 16px', borderRadius: '99px', fontSize: '12.5px', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    🔍 Buka Titik Maps
                  </a>
                </div>
              </div>

              <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid #d2ded7', height: '250px', position: 'relative' }}>
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

            {/* RENCANA BELANJA PANGAN */}
            <div style={{ background: '#fff', borderRadius: '28px', padding: '32px', border: '1px solid #d2ded7', boxShadow: '0 4px 20px rgba(27, 67, 50, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f1d14', margin: 0 }}>Rencana Belanja Pangan</h3>
                  <span style={{ fontSize: '13px', color: '#4e6754', fontWeight: '600' }}>Total {items.length} Komoditas Terpilih dari Database Live</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#4e6754', padding: '20px' }}>Belum ada item dipilih. Tambahkan dari katalog di bawah.</p>
                ) : items.map((item) => (
                  <div key={item.id} style={{ padding: '16px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'between', background: '#f2f7f4', border: '1px solid #d2ded7' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '800', color: '#0f1d14', fontSize: '14.5px' }}>{item.name}</div>
                      <div style={{ color: '#4e6754', fontSize: '12.5px', fontWeight: '600' }}>
                        Rp {item.price.toLocaleString('id-ID')} /{item.unit}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', background: '#fff', border: '1px solid #d2ded7', borderRadius: '99px', overflow: 'hidden' }}>
                        <button onClick={() => updateQty(item.id, -1)} style={{ border: 'none', background: 'transparent', padding: '6px 12px', fontWeight: '800', cursor: 'pointer' }}>-</button>
                        <span style={{ padding: '6px 12px', fontWeight: '800', fontSize: '13.5px', color: '#0f1d14' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} style={{ border: 'none', background: 'transparent', padding: '6px 12px', fontWeight: '800', cursor: 'pointer' }}>+</button>
                      </div>

                      <span style={{ fontWeight: '800', color: '#0f1d14', textAlign: 'right', minWidth: '100px', fontSize: '15px' }}>
                        Rp {(item.qty * item.price).toLocaleString('id-ID')}
                      </span>

                      <button onClick={() => removeItem(item.id)} style={{ border: 'none', background: 'transparent', color: '#e11d48', cursor: 'pointer', padding: '4px' }} title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KATALOG KOMODITAS LIVE */}
            <div style={{ background: '#dbece2', borderRadius: '36px', padding: '40px 44px', border: '1px solid #c8dcd0', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1b4332', letterSpacing: '0.08em' }}>DIREKTORI PANGAN DAERAH</span>
                  <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#0a2116', margin: '4px 0 4px 0' }}>Katalog Komoditas Pangan</h3>
                  <span style={{ fontSize: '13.5px', color: '#4e6754', fontWeight: '600' }}>Daftar harga real-time dari database backend</span>
                </div>
                <div style={{ width: '260px', position: 'relative' }}>
                  <Search size={15} color="#4e6754" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Cari komoditas..."
                    value={searchKatalog}
                    onChange={(e) => setSearchKatalog(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '99px', border: '1px solid #d2ded7', background: '#fff', fontSize: '13.5px', outline: 'none', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', maxHeight: '440px', overflowY: 'auto', paddingRight: '4px' }}>
                {loadingData ? (
                  <p style={{ gridColumn: 'span 2', textAlign: 'center', color: '#4e6754', padding: '30px' }}>Memuat katalog live...</p>
                ) : filteredKatalog.length === 0 ? (
                  <p style={{ gridColumn: 'span 2', textAlign: 'center', color: '#4e6754', padding: '30px' }}>Komoditas tidak ditemukan.</p>
                ) : filteredKatalog.map((katalog) => {
                  const isAdded = items.some(i => i.id === katalog.id);
                  return (
                    <div key={katalog.id} style={{ padding: '20px', border: '1px solid #d2ded7', borderRadius: '22px', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 16px rgba(27, 67, 50, 0.04)' }}>
                      <div>
                        <span style={{ background: '#0a2116', color: '#fff', padding: '4px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.04em' }}>
                          {katalog.category}
                        </span>
                        <div style={{ fontWeight: '800', color: '#0f1d14', fontSize: '15px', margin: '8px 0 4px' }}>{katalog.name}</div>
                        <div style={{ color: '#0a2116', fontWeight: '800', fontSize: '16px' }}>
                          Rp {katalog.price.toLocaleString('id-ID')} <span style={{ fontSize: '12px', color: '#4e6754', fontWeight: '600' }}>/{katalog.unit}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => addFromKatalog(katalog)}
                        style={{ background: isAdded ? '#f2f7f4' : '#2d6a4f', color: isAdded ? '#2d6a4f' : '#fff', border: isAdded ? '1px solid #52b788' : 'none', padding: '10px 18px', borderRadius: '99px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {isAdded ? '+ Tambah' : 'Tambah'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (STICKY SUMMARY) */}
          <div style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* DIAGNOSA REAL-TIME */}
            <div style={{ background: 'linear-gradient(135deg, #071a11 0%, #113324 100%)', borderRadius: '28px', padding: '28px', color: '#fff', boxShadow: '0 12px 32px rgba(10, 33, 22, 0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: '99px', fontSize: '11px', fontWeight: '800', color: '#b7efc5', marginBottom: '20px' }}>
                <Zap size={13} /> DIAGNOSA REAL-TIME
              </div>

              {isOverBudget ? (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#fca5a5', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={20} /> Melebihi Anggaran
                  </h4>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>Defisit Rp {Math.abs(remainingBudget).toLocaleString('id-ID')}</span>
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#86efac', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={20} /> Anggaran Aman
                  </h4>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>Sisa Rp {remainingBudget.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginBottom: '6px', fontWeight: '600' }}>
                  <span>Terpakai: Rp {totalCost.toLocaleString('id-ID')}</span>
                  <span>{Math.min(100, Math.round((totalCost / budget) * 100))}%</span>
                </div>
                <div style={{ height: '8px', background: '#0a2116', borderRadius: '99px', overflow: 'hidden' }}>
                  <div
                    style={{ height: '100%', background: isOverBudget ? '#ef4444' : '#52b788', width: `${Math.min(100, (totalCost / budget) * 100)}%`, borderRadius: '99px', transition: 'width 0.4s' }}
                  ></div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '600' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Sisa Budget:</span>
                  <span>Rp {remainingBudget < 0 ? 0 : remainingBudget.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b7efc5' }}>
                  <span>Estimasi Pengeluaran:</span>
                  <span>~Rp {dailySpend.toLocaleString('id-ID')}/hari</span>
                </div>
              </div>

              {isOverBudget && expensiveItem && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px', marginTop: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#fca5a5', fontWeight: '700', margin: '0 0 8px 0' }}>💡 Saran Substitusi Bahan:</p>
                  <div style={{ background: '#0a2116', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '12px', color: '#fff', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                      Ganti <strong>{expensiveItem.name}</strong> dengan <strong>{SUBSTITUSI_MAP[expensiveItem.name]}</strong> untuk menghemat pengeluaran.
                    </p>
                    <button
                      onClick={() => handleApplySubstitution(expensiveItem.name, SUBSTITUSI_MAP[expensiveItem.name])}
                      style={{ background: '#f59e0b', color: '#0f1d14', border: 'none', width: '100%', padding: '8px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Terapkan Substitusi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* KASIR CARD (DENGAN KONTROL QTY - / + DAN TOMBOL HAPUS) */}
            <div style={{ background: '#fff', borderRadius: '28px', padding: '28px', border: '1px solid #d2ded7', boxShadow: '0 4px 20px rgba(27, 67, 50, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #d2ded7' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#4e6754', letterSpacing: '0.04em', textTransform: 'uppercase' }}>🛒 Rincian Kasir</span>
                <span style={{ background: '#eef8f2', color: '#1b4332', border: '1px solid #b7efc5', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '800' }}>
                  {activePasar.name}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', maxHeight: '280px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                {items.length === 0 ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center', fontSize: '12px', margin: '10px 0' }}>Belum ada item.</p>
                ) : items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4e6754', fontWeight: '600', background: '#f8fafc', padding: '10px 12px', borderRadius: '14px', border: '1px solid #edf2f7', gap: '8px' }}>

                    {/* Nama dan Harga Satuan */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: '700', color: '#0f1d14', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>{item.name}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Rp {item.price.toLocaleString('id-ID')} /{item.unit}</span>
                    </div>

                    {/* Kontrol Qty (- / +) dan Tombol Hapus */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '99px', overflow: 'hidden', alignItems: 'center' }}>
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          style={{ border: 'none', background: 'transparent', padding: '2px 8px', fontWeight: '800', cursor: 'pointer', fontSize: '12px', color: '#334155' }}
                        >-</button>
                        <span style={{ padding: '0 4px', fontWeight: '800', fontSize: '12px', color: '#0f1d14', minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          style={{ border: 'none', background: 'transparent', padding: '2px 8px', fontWeight: '800', cursor: 'pointer', fontSize: '12px', color: '#334155' }}
                        >+</button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        style={{ border: 'none', background: '#fee2e2', color: '#ef4444', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                        title="Hapus item"
                      >
                        <X size={12} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #d2ded7', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#0f1d14', fontSize: '16px' }}>
                <span>Total Belanja:</span>
                <span style={{ color: '#2d6a4f' }}>Rp {totalCost.toLocaleString('id-ID')}</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
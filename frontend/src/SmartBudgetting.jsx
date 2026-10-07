import React, { useState, useEffect } from 'react';

// Data Pasar Resmi Kabupaten Lamongan beserta Koordinat GPS & Navigasi
const PASAR_OPTIONS = [
  {
    id: 'babat',
    name: 'Pasar Babat',
    sub: 'Pasar Babat (Kecamatan Babat)',
    alamat: 'Jl. Raya Babat No. 12, Babat, Kab. Lamongan',
    info: 'Jarak: ± 1,8 Km • Status: Termurah & Terlengkap',
    lat: -7.1126,
    lon: 112.1634,
    maps: 'https://www.google.com/maps/search/?api=1&query=-7.1126,112.1634',
    rute: 'https://www.google.com/maps/dir/?api=1&destination=-7.1126,112.1634'
  },
  {
    id: 'sidoharjo',
    name: 'Pasar Sidoharjo',
    sub: 'Pasar Sidoharjo (Kecamatan Lamongan)',
    alamat: 'Jl. Pahlawan, Sidoharjo, Kec. Lamongan',
    info: 'Jarak: ± 3,2 Km • Status: Pasar Induk Pusat Kota',
    lat: -7.1205,
    lon: 112.4152,
    maps: 'https://www.google.com/maps/search/?api=1&query=-7.1205,112.4152',
    rute: 'https://www.google.com/maps/dir/?api=1&destination=-7.1205,112.4152'
  },
  {
    id: 'sukodadi',
    name: 'Pasar Sukodadi',
    sub: 'Pasar Sukodadi (Kecamatan Sukodadi)',
    alamat: 'Jl. Raya Sukodadi No. 8, Kec. Sukodadi, Lamongan',
    info: 'Jarak: ± 5,4 Km • Status: Pasar Tradisional Terpadu',
    lat: -7.1082,
    lon: 112.3354,
    maps: 'https://www.google.com/maps/search/?api=1&query=-7.1082,112.3354',
    rute: 'https://www.google.com/maps/dir/?api=1&destination=-7.1082,112.3354'
  },
  {
    id: 'agrobis',
    name: 'Pasar Agrobis Babat',
    sub: 'Pasar Agrobis (Kecamatan Babat)',
    alamat: 'Kawasan Agrobisnis Babat, Babat, Kab. Lamongan',
    info: 'Jarak: ± 2,5 Km • Status: Grosir & Eceran Pertanian',
    lat: -7.1095,
    lon: 112.1720,
    maps: 'https://www.google.com/maps/search/?api=1&query=-7.1095,112.1720',
    rute: 'https://www.google.com/maps/dir/?api=1&destination=-7.1095,112.1720'
  },
  {
    id: 'mantup',
    name: 'Pasar Mantup',
    sub: 'Pasar Mantup (Kecamatan Mantup)',
    alamat: 'Jl. Raya Mantup, Kec. Mantup, Kab. Lamongan',
    info: 'Jarak: ± 12 Km • Status: Komoditas Lokal Wilayah Selatan',
    lat: -7.2415,
    lon: 112.3582,
    maps: 'https://www.google.com/maps/search/?api=1&query=-7.2415,112.3582',
    rute: 'https://www.google.com/maps/dir/?api=1&destination=-7.2415,112.3582'
  },
  {
    id: 'brondong',
    name: 'Pasar Brondong',
    sub: 'Pasar Brondong (Kecamatan Brondong)',
    alamat: 'Jl. Raya Brondong - Tuban, Kec. Brondong, Lamongan',
    info: 'Jarak: ± 25 Km • Status: Pasar Ikan & Pesisir Pantura',
    lat: -6.8924,
    lon: 112.2856,
    maps: 'https://www.google.com/maps/search/?api=1&query=-6.8924,112.2856',
    rute: 'https://www.google.com/maps/dir/?api=1&destination=-6.8924,112.2856'
  },
  {
    id: 'blimbing',
    name: 'Pasar Blimbing',
    sub: 'Pasar Blimbing (Kecamatan Paciran)',
    alamat: 'Jl. Raya Daendels, Paciran, Kab. Lamongan',
    info: 'Jarak: ± 28 Km • Status: Sentra Logistik Nelayan Pantura',
    lat: -6.8781,
    lon: 112.3524,
    maps: 'https://www.google.com/maps/search/?api=1&query=-6.8781,112.3524',
    rute: 'https://www.google.com/maps/dir/?api=1&destination=-6.8781,112.3524'
  }
];

// Master Katalog Komoditas Pasar Lamongan
const MASTER_KOMODITAS = [
  { id: '1', name: 'Beras Medium IR-64', price: 13000, unit: 'kg', category: 'Bahan Pokok' },
  { id: '2', name: 'Beras Premium', price: 15500, unit: 'kg', category: 'Bahan Pokok' },
  { id: '3', name: 'Minyak Goreng Sawit', price: 15700, unit: 'liter', category: 'Minyak & Gula' },
  { id: '4', name: 'Telur Ayam Ras Segar', price: 28500, unit: 'kg', category: 'Daging & Telur' },
  { id: '5', name: 'Daging Ayam Broiler', price: 34000, unit: 'kg', category: 'Daging & Telur' },
  { id: '6', name: 'Cabai Rawit Merah', price: 48500, unit: 'kg', category: 'Bumbu Dapur' },
  { id: '7', name: 'Cabai Keriting', price: 28000, unit: 'kg', category: 'Bumbu Dapur' },
  { id: '8', name: 'Bawang Merah Allium', price: 27500, unit: 'kg', category: 'Bumbu Dapur' },
  { id: '9', name: 'Gula Pasir Kristal', price: 17500, unit: 'kg', category: 'Minyak & Gula' },
  { id: '10', name: 'Bawang Putih Honan', price: 36000, unit: 'kg', category: 'Bumbu Dapur' },
  { id: '11', name: 'Daging Sapi Segar', price: 115000, unit: 'kg', category: 'Daging & Telur' },
  { id: '12', name: 'Tepung Terigu Cakra', price: 12500, unit: 'kg', category: 'Bahan Pokok' }
];

const SUBSTITUSI_MAP = {
  'Cabai Rawit Merah': 'Cabai Keriting',
  'Beras Premium': 'Beras Medium IR-64',
};

export default function SmartBudgeting() {
  const [budget, setBudget] = useState(200000);
  const [period, setPeriod] = useState('bulanan');
  const [familyMembers, setFamilyMembers] = useState(4);
  const [selectedPasarId, setSelectedPasarId] = useState('babat');
  const [items, setItems] = useState([]);
  const [searchKatalog, setSearchKatalog] = useState('');

  const periodMultiplier = { harian: 1, mingguan: 7, bulanan: 30 };

  useEffect(() => {
    const days = periodMultiplier[period];
    const initialList = [
      { id: '1', name: 'Beras Medium IR-64', price: 13000, unit: 'kg', qty: Math.max(1, Math.round(0.25 * familyMembers * days)) },
      { id: '3', name: 'Minyak Goreng Sawit', price: 15700, unit: 'liter', qty: Math.max(1, Math.round(0.04 * familyMembers * days)) },
      { id: '4', name: 'Telur Ayam Ras Segar', price: 28500, unit: 'kg', qty: Math.max(1, Math.round(0.05 * familyMembers * days)) },
      { id: '5', name: 'Daging Ayam Broiler', price: 34000, unit: 'kg', qty: Math.max(1, Math.round(0.03 * familyMembers * days)) },
      { id: '6', name: 'Cabai Rawit Merah', price: 48500, unit: 'kg', qty: Math.max(1, Math.round(0.01 * familyMembers * days)) },
      { id: '8', name: 'Bawang Merah Allium', price: 27500, unit: 'kg', qty: Math.max(1, Math.round(0.015 * familyMembers * days)) },
      { id: '9', name: 'Gula Pasir Kristal', price: 17500, unit: 'kg', qty: Math.max(1, Math.round(0.02 * familyMembers * days)) },
    ];
    setItems(initialList);
  }, [period, familyMembers]);

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
    const subItem = MASTER_KOMODITAS.find(m => m.name === newName);
    if (!subItem) return;
    setItems(prev => prev.map(item => item.name === oldName ? { ...item, ...subItem } : item));
  };

  const totalCost = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const remainingBudget = budget - totalCost;
  const isOverBudget = remainingBudget < 0;
  const daysInPeriod = periodMultiplier[period];
  const dailySpend = Math.round(totalCost / daysInPeriod);

  const activePasar = PASAR_OPTIONS.find(p => p.id === selectedPasarId) || PASAR_OPTIONS[0];
  const expensiveItem = items.find(i => SUBSTITUSI_MAP[i.name]);

  const filteredKatalog = MASTER_KOMODITAS.filter(item =>
    item.name.toLowerCase().includes(searchKatalog.toLowerCase()) ||
    item.category.toLowerCase().includes(searchKatalog.toLowerCase())
  );

  return (
    <div className="container py-4">
      {/* HEADER BANNER */}
      <div className="card bg-emerald-light border-emerald rounded-4 p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="text-emerald fw-semibold small" style={{ cursor: 'pointer' }}>
            ← Kembali ke Dashboard
          </span>
          <span className="badge bg-white text-success border border-success-subtle rounded-pill">
            # INOVASI DKPP KABUPATEN LAMONGAN
          </span>
        </div>
        <h2 className="fw-bold text-dark m-0">
          Smart Budgeting: <span className="text-emerald">Kalkulator & Optimasi Dapur</span>
        </h2>
        <p className="text-muted small mt-1 mb-0">
          Hitung estimasi kebutuhan dapur secara riil dan dapatkan rekomendasi pasar rakyat dengan kombinasi harga paling hemat di Kabupaten Lamongan.
        </p>
      </div>

      {/* MAIN GRID */}
      <div className="row g-4">
        {/* LEFT COLUMN */}
        <div className="col-lg-8">
          {/* ALOKASI ANGGARAN */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-emerald text-uppercase fs-7">ALOKASI ANGGARAN</span>
              <button
                onClick={() => { setBudget(200000); setPeriod('bulanan'); setFamilyMembers(4); }}
                className="btn btn-sm btn-link text-muted text-decoration-none p-0 small"
              >
                🔄 Reset
              </button>
            </div>

            <h5 className="fw-bold text-dark mb-3">
              Pagu Anggaran Belanja {period === 'harian' ? 'Harian' : period === 'mingguan' ? 'Mingguan' : 'Bulanan'}
            </h5>

            <div className="input-group input-group-lg mb-3">
              <span className="input-group-text bg-light text-success fw-bold border-end-0">Rp</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="form-control bg-light fw-bold border-start-0"
                step="10000"
              />
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
              {[200000, 400000, 600000, 850000, 1200000].map((val) => (
                <button
                  key={val}
                  onClick={() => setBudget(val)}
                  className={`btn btn-sm rounded-3 ${budget === val ? 'btn-success fw-bold' : 'btn-outline-secondary'}`}
                >
                  Rp {val.toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            <div className="row g-3 pt-3 border-top">
              <div className="col-sm-6">
                <label className="form-label text-muted small fw-semibold">PERIODE BELANJA</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="form-select bg-light rounded-3"
                >
                  <option value="harian">Harian (1 Hari)</option>
                  <option value="mingguan">Mingguan (7 Hari)</option>
                  <option value="bulanan">Bulanan (30 Hari)</option>
                </select>
              </div>

              <div className="col-sm-6">
                <label className="form-label text-muted small fw-semibold">JUMLAH ANGGOTA KELUARGA</label>
                <input
                  type="number"
                  min="1"
                  value={familyMembers}
                  onChange={(e) => setFamilyMembers(Number(e.target.value))}
                  className="form-control bg-light rounded-3"
                />
              </div>
            </div>
          </div>

          {/* REKOMENDASI PASAR & LIVE MAPS LOKASI PASAR LAMONGAN */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-emerald text-uppercase fs-7">REKOMENDASI LOKASI &amp; PETA PASAR</span>
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
                Titik GPS Terverifikasi DKPP
              </span>
            </div>
            <h5 className="fw-bold text-dark mb-1">Pilih Pasar Rakyat Tujuan di Lamongan</h5>
            <p className="text-muted small mb-3">
              Klik nama pasar untuk melihat estimasi jarak, alamat lengkap, dan navigasi langsung Google Maps ke titik pasar.
            </p>

            <div className="d-flex flex-wrap gap-2 mb-3">
              {PASAR_OPTIONS.map((pasar) => (
                <button
                  key={pasar.id}
                  onClick={() => setSelectedPasarId(pasar.id)}
                  className={`btn btn-sm rounded-3 ${selectedPasarId === pasar.id ? 'btn-success fw-bold shadow-sm' : 'btn-light text-secondary border'}`}
                >
                  📍 {pasar.name}
                </button>
              ))}
            </div>

            {/* Info Box Pasar Aktif */}
            <div className="p-3 bg-emerald-light rounded-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 border border-emerald-subtle">
              <div>
                <div className="fw-bold text-dark fs-6">📍 {activePasar.name}</div>
                <div className="text-secondary small fw-medium mt-1">🏠 Alamat: {activePasar.alamat}</div>
                <div className="text-success small fw-semibold mt-1">✨ {activePasar.info}</div>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <a
                  href={activePasar.rute}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-success rounded-2 text-nowrap d-inline-flex align-items-center gap-1 shadow-sm"
                >
                  <span>🧭 Petunjuk Rute Maps</span>
                </a>
                <a
                  href={activePasar.maps}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline-success bg-white rounded-2 text-nowrap d-inline-flex align-items-center gap-1"
                >
                  <span>🔍 Buka Titik Maps</span>
                </a>
              </div>
            </div>

            {/* Live Interactive Embed Map Pasar Lamongan */}
            <div className="rounded-3 overflow-hidden border shadow-sm" style={{ height: '230px', position: 'relative' }}>
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
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#065f46',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                📍 Lokasi Terpilih: {activePasar.name} (Lamongan) • Lat: {activePasar.lat}, Lon: {activePasar.lon}
              </div>
            </div>
          </div>

          {/* LIST ITEM PANGAN YANG DIPILIH */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark m-0">Rencana Belanja Pangan</h5>
                <small className="text-muted">Total {items.length} Komoditas Terpilih</small>
              </div>
            </div>

            <div className="d-flex flex-column gap-2">
              {items.map((item) => (
                <div key={item.id} className="p-3 rounded-3 d-flex align-items-center justify-content-between bg-light border">
                  <div>
                    <div className="fw-bold text-dark small">{item.name}</div>
                    <div className="text-muted small">
                      Rp {item.price.toLocaleString('id-ID')} /{item.unit}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <div className="btn-group btn-group-sm bg-white border rounded-2">
                      <button onClick={() => updateQty(item.id, -1)} className="btn btn-light fw-bold px-2">-</button>
                      <span className="btn btn-light disabled text-dark fw-bold px-3">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="btn btn-light fw-bold px-2">+</button>
                    </div>

                    <span className="fw-bold text-dark text-end" style={{ minWidth: '90px' }}>
                      Rp {(item.qty * item.price).toLocaleString('id-ID')}
                    </span>

                    <button onClick={() => removeItem(item.id)} className="btn btn-sm text-danger border-0 p-1" title="Hapus">
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KOMPONEN KATALOG LENGKAP HARGA KOMODITAS */}
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
              <div>
                <h5 className="fw-bold text-dark m-0">Katalog Komoditas Pangan</h5>
                <small className="text-muted">Daftar acuan harga riil di {activePasar.name}</small>
              </div>
              <div style={{ maxWidth: '250px' }}>
                <input
                  type="text"
                  placeholder="🔍 Cari komoditas..."
                  value={searchKatalog}
                  onChange={(e) => setSearchKatalog(e.target.value)}
                  className="form-control form-control-sm bg-light rounded-3"
                />
              </div>
            </div>

            <div className="row g-2" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {filteredKatalog.map((katalog) => {
                const isAdded = items.some(i => i.id === katalog.id);
                return (
                  <div key={katalog.id} className="col-sm-6">
                    <div className="p-3 border rounded-3 bg-white d-flex justify-content-between align-items-center h-100">
                      <div>
                        <span className="badge bg-light text-secondary border mb-1" style={{ fontSize: '0.65rem' }}>
                          {katalog.category}
                        </span>
                        <div className="fw-bold text-dark small">{katalog.name}</div>
                        <div className="text-emerald fw-semibold small">
                          Rp {katalog.price.toLocaleString('id-ID')} /{katalog.unit}
                        </div>
                      </div>
                      <button
                        onClick={() => addFromKatalog(katalog)}
                        className={`btn btn-sm rounded-2 ${isAdded ? 'btn-outline-success' : 'btn-success'} text-nowrap`}
                      >
                        {isAdded ? '+ Tambah' : 'Tambah'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="col-lg-4">
          <div style={{ position: 'sticky', top: '1.5rem' }} className="d-flex flex-column gap-4">
            {/* REALTIME DIAGNOSIS CARD */}
            <div className="card border-0 bg-emerald-dark text-white rounded-4 p-4 shadow-lg">
              <span className="badge bg-success bg-opacity-50 text-light w-auto align-self-start mb-3 px-2 py-1 small">
                ⚡ DIAGNOSA REAL-TIME
              </span>

              {isOverBudget ? (
                <div className="mb-3">
                  <h4 className="fw-bold text-warning mb-1">⚠️ Melebihi Anggaran</h4>
                  <small className="text-light opacity-75">Defisit Rp {Math.abs(remainingBudget).toLocaleString('id-ID')}</small>
                </div>
              ) : (
                <div className="mb-3">
                  <h4 className="fw-bold text-success-subtle mb-1">✅ Anggaran Aman</h4>
                  <small className="text-light opacity-75">Sisa Rp {remainingBudget.toLocaleString('id-ID')}</small>
                </div>
              )}

              <div className="mb-3">
                <div className="d-flex justify-content-between small text-light opacity-75 mb-1">
                  <span>Terpakai: Rp {totalCost.toLocaleString('id-ID')}</span>
                  <span>{Math.min(100, Math.round((totalCost / budget) * 100))}%</span>
                </div>
                <div className="progress" style={{ height: '8px', backgroundColor: '#022c22' }}>
                  <div
                    className={`progress-bar ${isOverBudget ? 'bg-danger' : 'bg-success'}`}
                    style={{ width: `${Math.min(100, (totalCost / budget) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="border-top border-secondary border-opacity-50 pt-3 small d-flex flex-column gap-1">
                <div className="d-flex justify-content-between">
                  <span>Sisa Budget:</span>
                  <span className="fw-bold">
                    Rp {remainingBudget < 0 ? 0 : remainingBudget.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="d-flex justify-content-between text-success-subtle">
                  <span>Estimasi Pengeluaran:</span>
                  <span>~Rp {dailySpend.toLocaleString('id-ID')}/hari</span>
                </div>
              </div>

              <div className="border-top border-secondary border-opacity-50 pt-3 mt-3">
                {isOverBudget ? (
                  <div>
                    <p className="small text-warning mb-2">💡 <strong>Saran Substitusi Bahan:</strong></p>
                    {expensiveItem ? (
                      <div className="p-3 rounded-3 border border-secondary border-opacity-50" style={{ backgroundColor: '#022c22' }}>
                        <p className="small text-light mb-2">
                          Ganti <strong>{expensiveItem.name}</strong> dengan <strong>{SUBSTITUSI_MAP[expensiveItem.name]}</strong> untuk hemat.
                        </p>
                        <button
                          onClick={() => handleApplySubstitution(expensiveItem.name, SUBSTITUSI_MAP[expensiveItem.name])}
                          className="btn btn-sm btn-warning w-100 fw-bold rounded-2 text-dark"
                        >
                          Terapkan Substitusi
                        </button>
                      </div>
                    ) : (
                      <p className="small text-light opacity-75 mb-0">Pertimbangkan mengurangi kuantitas item sekunder.</p>
                    )}
                  </div>
                ) : (
                  <div className="small text-light">
                    <p className="fw-bold text-success-subtle mb-1">💰 Opsi Alokasi Sisa:</p>
                    <p className="m-0 opacity-75">
                      Sisa dana <strong>Rp {remainingBudget.toLocaleString('id-ID')}</strong> dapat dialokasikan ke <strong>Tabungan Keluarga</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* KASIR CARD */}
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <span className="fw-bold text-secondary text-uppercase small">🛒 Rincian Kasir</span>
                <span className="badge bg-success-subtle text-success">{activePasar.name}</span>
              </div>

              <div className="d-flex flex-column gap-2 small mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {items.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between text-secondary">
                    <span>{item.name} <span className="text-muted">({item.qty} {item.unit})</span></span>
                    <span className="fw-semibold text-dark">Rp {(item.qty * item.price).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="border-top pt-2 d-flex justify-content-between fw-bold text-dark">
                <span>Total Belanja:</span>
                <span className="text-success">Rp {totalCost.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronRight, Store, User, MapPin, Navigation, Clock, Search, Wheat, Package, Droplet, Egg,
  Leaf, Flame, ShieldCheck, RefreshCw, Plus, Minus, ShoppingBasket, Copy, Send, X,
  CheckCircle2, TrendingDown, TrendingUp, Minus as Flat, Flag,
} from "lucide-react";

/* ---------- Token: diambil dari tema dashboard E-Pangan ---------- */
const C = {
  ink: "#0b1b2b", mute: "#5b6b7b", line: "#e3ece7", mint: "#e6f6ef", green: "#0fa361",
  greenDeep: "#0b5a3e", greenInk: "#064e3b", chip: "#0f6b45", amber: "#b45309", amberSoft: "#fef3c7",
  red: "#dc2626", redSoft: "#fee2e2", okSoft: "#d1fae5",
};

const KATEGORI = ["Semua Komoditas", "Beras & Padi", "Bumbu Dapur & Cabai", "Minyak & Mentega", "Daging, Unggas & Telur", "Bawang & Sayuran", "Gula & Bahan Baku"];
const IKON = { beras: Wheat, gula: Package, minyak: Droplet, telur: Egg, bawang: Leaf, cabai: Flame };

/* ---------- Data contoh (ganti lewat prop `kios` / API) ---------- */
const KIOS_DEFAULT = {
  nama: "Kios Bu Siti", pasar: "Pasar Babat", blok: "Blok B-12 (Los Beras & Sembako)",
  pemilik: "Ibu Siti Khodijah", alamat: "Jl. Raya Pasar Babat No. 45, Babat, Lamongan",
  jarak: "0.8 km (3 menit berkendara)", buka: "06:00", tutup: "16:00",
  telepon: "6281234567890", foto: null, update: "Hari ini, 07:45 WIB",
  komoditas: [
    { id: 1, ikon: "beras", kategori: "Beras & Padi", nama: "Beras Medium IR-64", varian: "Grade A Bulog", harga: 13000, rataPasar: 13500, het: 13500, satuan: "kg", stok: 120, riwayat: [13400, 13300, 13200, 13200, 13100, 13000, 13000] },
    { id: 2, ikon: "gula", kategori: "Gula & Bahan Baku", nama: "Gula Pasir Curah", varian: "Pabrik Gula Kebonagung", harga: 17800, rataPasar: 17500, het: 18500, satuan: "kg", stok: 60, riwayat: [17500, 17500, 17600, 17700, 17800, 17800, 17800] },
    { id: 3, ikon: "minyak", kategori: "Minyak & Mentega", nama: "Minyak Goreng MinyaKita", varian: "Kemasan botol 1 liter", harga: 15700, rataPasar: 16000, het: 15700, satuan: "liter", stok: 45, riwayat: [15900, 15800, 15800, 15700, 15700, 15700, 15700] },
    { id: 4, ikon: "telur", kategori: "Daging, Unggas & Telur", nama: "Telur Ayam Ras", varian: "Peternak Tiung, ukuran sedang", harga: 29500, rataPasar: 29000, satuan: "kg", stok: 30, riwayat: [28500, 28800, 29000, 29200, 29300, 29500, 29500] },
    { id: 5, ikon: "bawang", kategori: "Bawang & Sayuran", nama: "Bawang Merah Lokal", varian: "Sukorame, jemur super", harga: 28000, rataPasar: 30000, satuan: "kg", stok: 25, riwayat: [31000, 30500, 30000, 29500, 29000, 28500, 28000] },
    { id: 6, ikon: "cabai", kategori: "Bumbu Dapur & Cabai", nama: "Cabai Rawit Merah", varian: "Panen lokal Modo", harga: 44000, rataPasar: 41000, satuan: "kg", stok: 8, riwayat: [38000, 39000, 40500, 41500, 42500, 43500, 44000] },
  ],
};

const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const qtyTxt = (n) => String(n).replace(".", ",");
const mnt = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const STOK_TIPIS = 20;

function Sparkline({ data, naik }) {
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 64},${22 - ((v - min) / r) * 18 - 2}`).join(" ");
  return (
    <svg width="64" height="22" viewBox="0 0 64 22" role="img" aria-label="Tren harga 7 hari terakhir">
      <polyline points={pts} fill="none" stroke={naik ? C.red : C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DetailKios({ kios = KIOS_DEFAULT, onBack, onNavigate }) {
  const k = { ...KIOS_DEFAULT, ...kios };
  const [cari, setCari] = useState("");
  const [kat, setKat] = useState(KATEGORI[0]);
  const [urut, setUrut] = useState("default");
  const [keranjang, setKeranjang] = useState({});
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3200); return () => clearTimeout(t); }, [toast]);

  const menitNow = now.getHours() * 60 + now.getMinutes();
  const buka = menitNow >= mnt(k.buka) && menitNow < mnt(k.tutup);

  const olah = (it) => {
    const selisih = ((it.harga - it.rataPasar) / it.rataPasar) * 100;
    const kemarin = it.riwayat[it.riwayat.length - 2];
    return { ...it, selisih, tren: ((it.harga - kemarin) / kemarin) * 100, naik: it.harga > it.riwayat[0] };
  };
  const semua = useMemo(() => k.komoditas.map(olah), [k.komoditas]);

  const daftar = useMemo(() => {
    let a = semua.filter((i) => (kat === KATEGORI[0] || i.kategori === kat) && i.nama.toLowerCase().includes(cari.trim().toLowerCase()));
    if (urut === "murah") a = [...a].sort((x, y) => x.harga - y.harga);
    if (urut === "mahal") a = [...a].sort((x, y) => y.harga - x.harga);
    if (urut === "hemat") a = [...a].sort((x, y) => x.selisih - y.selisih);
    return a;
  }, [semua, cari, kat, urut]);

  const lebihMurah = semua.filter((i) => i.selisih < 0).length;
  const tipis = semua.filter((i) => i.stok < STOK_TIPIS).length;
  const termurah = [...semua].sort((a, b) => a.selisih - b.selisih)[0];

  const ubah = (it, d) => setKeranjang((s) => {
    const q = Math.min(it.stok, Math.max(0, (s[it.id] || 0) + d));
    const n = { ...s }; q ? (n[it.id] = q) : delete n[it.id]; return n;
  });
  const isi = semua.filter((i) => keranjang[i.id]);
  const total = isi.reduce((t, i) => t + i.harga * keranjang[i.id], 0);
  const hemat = isi.reduce((t, i) => t + (i.rataPasar - i.harga) * keranjang[i.id], 0);
  const teks = `Daftar belanja di ${k.nama} (${k.pasar})\n` + isi.map((i) => `- ${i.nama} ${qtyTxt(keranjang[i.id])} ${i.satuan} = ${rp(i.harga * keranjang[i.id])}`).join("\n") + `\nTotal: ${rp(total)}`;

  const salin = async () => {
    try { await navigator.clipboard.writeText(teks); setToast("Daftar belanja disalin."); }
    catch { setToast("Gagal menyalin. Salin manual dari tombol WhatsApp."); }
  };

  return (
    <div className="dk" style={{ fontFamily: "inherit", color: C.ink, minHeight: "100vh", background: `linear-gradient(180deg, ${C.mint} 0%, #f7fbf9 340px, #fff 100%)` }}>
      <style>{`
        .dk *{box-sizing:border-box}
        .dk button{font-family:inherit;cursor:pointer}
        .dk button:focus-visible,.dk input:focus-visible,.dk select:focus-visible,.dk a:focus-visible{outline:2px solid ${C.green};outline-offset:2px}
        .dk-card{background:#fff;border-radius:20px;box-shadow:0 2px 12px rgba(11,90,62,.08);border:1px solid ${C.line}}
        .dk-pill{border:none;background:transparent;color:${C.ink};font-size:13px;font-weight:600;padding:9px 16px;border-radius:999px;white-space:nowrap}
        .dk-pill:hover{background:${C.mint}} .dk-pill.on{background:${C.chip};color:#fff}
        .dk-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:20px;align-items:start}
        .dk-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .dk-item{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:16px;align-items:center;padding:16px 18px;border-top:1px solid ${C.line}}
        .dk-side{position:sticky;top:16px}
        @media (max-width:960px){.dk-grid{grid-template-columns:1fr}.dk-side{position:static}.dk-stats{grid-template-columns:repeat(2,1fr)}}
        @media (max-width:620px){.dk-item{grid-template-columns:1fr auto}.dk-spark{display:none}}
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 20px 56px" }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.mute, flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={() => onBack?.()} style={link}>Beranda</button><ChevronRight size={12} />
          <button onClick={() => onNavigate?.("cari-harga")} style={link}>Cari Harga</button><ChevronRight size={12} />
          <span>{k.pasar}</span><ChevronRight size={12} />
          <strong style={{ color: C.greenDeep }}>{k.nama}</strong>
        </nav>

        {/* Profil kios */}
        <section className="dk-card" style={{ padding: 22, display: "flex", gap: 22, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ width: 168, height: 128, borderRadius: 16, overflow: "hidden", flexShrink: 0, display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${C.okSoft}, #a7f3d0)` }}>
            {k.foto ? <img src={k.foto} alt={`Foto ${k.nama}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Store size={44} color={C.greenDeep} />}
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: "-.02em" }}>{k.nama}</h1>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999, background: buka ? C.okSoft : C.redSoft, color: buka ? C.greenDeep : "#991b1b" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: buka ? C.green : C.red }} />{buka ? "Buka sekarang" : "Sedang tutup"}
              </span>
            </div>
            <p style={{ ...meta, color: C.greenDeep, fontWeight: 700, fontSize: 14, marginTop: 6 }}><Store size={15} /> {k.pasar}, {k.blok}</p>
            <p style={meta}><User size={14} /> Pemilik: {k.pemilik} <Clock size={14} style={{ marginLeft: 8 }} /> {k.buka} - {k.tutup} WIB</p>
            <p style={meta}><MapPin size={14} /> {k.alamat} <Navigation size={14} style={{ marginLeft: 8 }} /> {k.jarak}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(k.nama + " " + k.alamat)}`} target="_blank" rel="noreferrer" style={{ ...btn, background: C.greenDeep, color: "#fff", textDecoration: "none" }}><Navigation size={14} /> Petunjuk arah</a>
              {k.telepon && <a href={`https://wa.me/${k.telepon}?text=${encodeURIComponent("Halo, saya lihat harga di E-Pangan Lamongan. Apakah stok masih ada?")}`} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: "none" }}><Send size={14} /> Tanya stok via WhatsApp</a>}
            </div>
          </div>
        </section>

        {/* Statistik */}
        <section className="dk-stats" style={{ marginBottom: 20 }} aria-label="Ringkasan kios">
          <Stat ikon={ShoppingBasket} warna={C.okSoft} fg={C.green} nilai={`${semua.length} komoditas`} ket="Dipantau di kios ini" />
          <Stat ikon={TrendingDown} warna="#e0f2fe" fg="#0369a1" nilai={`${lebihMurah} dari ${semua.length}`} ket="Lebih murah dari rata-rata pasar" />
          <Stat ikon={Package} warna={C.amberSoft} fg={C.amber} nilai={`${tipis} stok tipis`} ket={`Di bawah ${STOK_TIPIS} ${"kg/liter"}`} />
          <Stat ikon={ShieldCheck} warna="#fce7f3" fg="#be185d" nilai={termurah.nama.split(" ").slice(0, 2).join(" ")} ket={`Paling hemat: ${Math.abs(termurah.selisih).toFixed(1).replace(".", ",")}% di bawah pasar`} />
        </section>

        <div className="dk-grid">
          {/* Katalog */}
          <section className="dk-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: 18, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Harga komoditas hari ini</h2>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.greenDeep, background: C.mint, padding: "5px 12px", borderRadius: 999 }}><RefreshCw size={12} /> Diperbarui {k.update}</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 14, padding: "0 14px", background: "#f9fcfb" }}>
                  <Search size={16} color={C.mute} />
                  <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari komoditas di kios ini..." aria-label="Cari komoditas" style={{ border: "none", background: "transparent", padding: "12px 0", flex: 1, fontSize: 13.5, fontFamily: "inherit", outline: "none", minWidth: 0 }} />
                </label>
                <select value={urut} onChange={(e) => setUrut(e.target.value)} aria-label="Urutkan" style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: "0 14px", height: 44, background: "#fff", fontSize: 13.5, fontFamily: "inherit", fontWeight: 600 }}>
                  <option value="default">Urutan default</option><option value="murah">Harga termurah</option><option value="mahal">Harga termahal</option><option value="hemat">Paling hemat vs pasar</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }} role="tablist" aria-label="Kategori">
                {KATEGORI.map((x) => <button key={x} role="tab" aria-selected={kat === x} className={`dk-pill ${kat === x ? "on" : ""}`} onClick={() => setKat(x)}>{x}</button>)}
              </div>
            </div>

            {daftar.length === 0 && (
              <div style={{ padding: "36px 20px", textAlign: "center", color: C.mute, borderTop: `1px solid ${C.line}`, fontSize: 14 }}>
                Tidak ada komoditas yang cocok. <button style={{ ...link, color: C.green, fontWeight: 700 }} onClick={() => { setCari(""); setKat(KATEGORI[0]); }}>Reset filter</button>
              </div>
            )}

            {daftar.map((it) => {
              const Ikon = IKON[it.ikon] || Package;
              const q = keranjang[it.id] || 0;
              const murah = it.selisih < -0.05, mahal = it.selisih > 0.05;
              const TrenIc = it.tren < -0.05 ? TrendingDown : it.tren > 0.05 ? TrendingUp : Flat;
              return (
                <article key={it.id} className="dk-item">
                  <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                    <span style={{ width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", background: it.stok < STOK_TIPIS ? C.redSoft : C.okSoft, flexShrink: 0 }}><Ikon size={20} color={it.stok < STOK_TIPIS ? C.red : C.green} /></span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{it.nama}</div>
                      <div style={{ fontSize: 12, color: C.mute }}>{it.varian}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        <span style={{ ...tag, background: murah ? C.okSoft : mahal ? C.amberSoft : "#eef2f7", color: murah ? C.greenDeep : mahal ? C.amber : C.mute }}>
                          {murah ? `${Math.abs(it.selisih).toFixed(1).replace(".", ",")}% di bawah pasar` : mahal ? `${it.selisih.toFixed(1).replace(".", ",")}% di atas pasar` : "Setara harga pasar"}
                        </span>
                        {it.het && <span style={{ ...tag, background: it.harga <= it.het ? "#ccfbf1" : C.redSoft, color: it.harga <= it.het ? "#0f766e" : "#991b1b" }}>{it.harga <= it.het ? "Sesuai HET" : "Di atas HET"}</span>}
                        <span style={{ ...tag, background: it.stok < STOK_TIPIS ? C.redSoft : "#eef2f7", color: it.stok < STOK_TIPIS ? "#991b1b" : C.mute }}>Stok {qtyTxt(it.stok)} {it.satuan}</span>
                      </div>
                    </div>
                  </div>
                  <div className="dk-spark" style={{ textAlign: "center" }}>
                    <Sparkline data={it.riwayat} naik={it.naik} />
                    <div style={{ fontSize: 11, color: it.tren > 0.05 ? C.red : C.mute, display: "flex", gap: 3, justifyContent: "center", alignItems: "center" }}><TrenIc size={11} />{Math.abs(it.tren).toFixed(1).replace(".", ",")}% vs kemarin</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: C.greenDeep }}>{rp(it.harga)}</div>
                    <div style={{ fontSize: 11.5, color: C.mute, marginBottom: 8 }}>per {it.satuan}</div>
                    {q === 0 ? (
                      <button onClick={() => ubah(it, 0.5)} style={{ ...btn, padding: "6px 12px", fontSize: 12 }}><Plus size={13} /> Tambah</button>
                    ) : (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.mint, borderRadius: 999, padding: 3 }}>
                        <button aria-label="Kurangi" onClick={() => ubah(it, -0.5)} style={step}><Minus size={13} /></button>
                        <span style={{ fontSize: 12.5, fontWeight: 700, minWidth: 34, textAlign: "center" }}>{qtyTxt(q)}</span>
                        <button aria-label="Tambah" onClick={() => ubah(it, 0.5)} style={step}><Plus size={13} /></button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            <footer style={{ padding: "14px 18px", background: C.mint, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 12.5, color: C.greenDeep }}>
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><ShieldCheck size={15} /> Data dicatat enumerator Dinas Ketahanan Pangan.</span>
              <button onClick={() => setModal(true)} style={{ ...link, color: C.greenDeep, fontWeight: 800, display: "inline-flex", gap: 5, alignItems: "center" }}><Flag size={13} /> Harga di lapangan berbeda? Laporkan</button>
            </footer>
          </section>

          {/* Daftar belanja */}
          <aside className="dk-side" aria-label="Daftar belanja">
            <div style={{ borderRadius: 20, padding: 22, color: "#fff", background: `linear-gradient(160deg, ${C.greenDeep}, ${C.greenInk})`, boxShadow: "0 8px 24px rgba(6,78,59,.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 18 }}><ShoppingBasket size={20} /> Daftar Belanja</div>
              <p style={{ fontSize: 12.5, opacity: 0.8, margin: "4px 0 14px" }}>Tambahkan komoditas untuk menghitung estimasi belanja di kios ini.</p>
              {isi.length === 0 ? (
                <div style={{ border: "1px dashed rgba(255,255,255,.35)", borderRadius: 14, padding: 18, fontSize: 13, textAlign: "center", opacity: 0.85 }}>Belum ada item. Tekan "Tambah" pada komoditas.</div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                  {isi.map((i) => (
                    <li key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                      <span>{i.nama}<br /><span style={{ opacity: 0.7, fontSize: 11.5 }}>{qtyTxt(keranjang[i.id])} {i.satuan} x {rp(i.harga)}</span></span>
                      <strong>{rp(i.harga * keranjang[i.id])}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ borderTop: "1px solid rgba(255,255,255,.2)", margin: "16px 0 12px", paddingTop: 14 }}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Estimasi total</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{rp(total)}</div>
                {isi.length > 0 && hemat > 0 && <div style={{ fontSize: 12.5, color: "#6ee7b7", marginTop: 2 }}>Hemat sekitar {rp(hemat)} dibanding rata-rata pasar</div>}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <a aria-disabled={!isi.length} href={isi.length ? `https://wa.me/${k.telepon || ""}?text=${encodeURIComponent(teks)}` : undefined} target="_blank" rel="noreferrer"
                  style={{ ...btnW, background: "#fff", color: C.greenDeep, opacity: isi.length ? 1 : 0.5, pointerEvents: isi.length ? "auto" : "none", textDecoration: "none" }}><Send size={15} /> Kirim pesanan ke kios</a>
                <div style={{ display: "flex", gap: 8 }}>
                  <button disabled={!isi.length} onClick={salin} style={{ ...btnW, flex: 1, opacity: isi.length ? 1 : 0.5 }}><Copy size={14} /> Salin</button>
                  <button disabled={!isi.length} onClick={() => setKeranjang({})} style={{ ...btnW, flex: 1, opacity: isi.length ? 1 : 0.5 }}><X size={14} /> Kosongkan</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {modal && <Lapor komoditas={semua} onClose={() => setModal(false)} onKirim={(m) => { setModal(false); setToast(m); }} />}
      {toast && <div role="status" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.greenInk, color: "#fff", padding: "12px 18px", borderRadius: 14, fontSize: 13, fontWeight: 600, display: "flex", gap: 8, alignItems: "center", boxShadow: "0 8px 24px rgba(0,0,0,.2)", zIndex: 80 }}><CheckCircle2 size={16} /> {toast}</div>}
    </div>
  );
}

function Stat({ ikon: I, warna, fg, nilai, ket }) {
  return (
    <div className="dk-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ width: 46, height: 46, borderRadius: 14, background: warna, display: "grid", placeItems: "center", flexShrink: 0 }}><I size={21} color={fg} /></span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nilai}</div>
        <div style={{ fontSize: 12, color: C.mute, lineHeight: 1.3 }}>{ket}</div>
      </div>
    </div>
  );
}

function Lapor({ komoditas, onClose, onKirim }) {
  const [id, setId] = useState(komoditas[0].id);
  const [harga, setHarga] = useState("");
  const [err, setErr] = useState("");
  const it = komoditas.find((x) => x.id === Number(id));
  const angka = Number(harga), sel = angka > 0 ? angka - it.harga : null;
  useEffect(() => { const f = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [onClose]);
  const kirim = () => {
    if (!angka || angka <= 0) return setErr("Isi harga yang Anda temukan di lapangan.");
    if (angka === it.harga) return setErr("Harga sama dengan data kami, tidak ada selisih untuk dilaporkan.");
    onKirim(`Laporan ${it.nama} (${rp(angka)}/${it.satuan}) terkirim. Terima kasih!`);
  };
  const lbl = { display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 12 };
  const inp = { display: "block", width: "100%", marginTop: 6, padding: "11px 12px", borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: "inherit" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(6,40,30,.5)", display: "grid", placeItems: "center", padding: 16, zIndex: 70 }}>
      <div role="dialog" aria-modal="true" aria-label="Laporkan selisih harga" onClick={(e) => e.stopPropagation()} className="dk-card" style={{ width: "100%", maxWidth: 420, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Laporkan selisih harga</h3>
          <button aria-label="Tutup" onClick={onClose} style={{ background: "none", border: "none" }}><X size={18} /></button>
        </div>
        <label style={lbl}>Komoditas
          <select value={id} onChange={(e) => { setId(e.target.value); setErr(""); }} style={inp}>{komoditas.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</select>
        </label>
        <p style={{ fontSize: 12.5, color: C.mute, margin: "0 0 12px" }}>Harga di sistem: <strong>{rp(it.harga)}/{it.satuan}</strong></p>
        <label style={lbl}>Harga di lapangan (Rp)
          <input type="number" min="0" inputMode="numeric" value={harga} placeholder="Contoh: 14000" onChange={(e) => { setHarga(e.target.value); setErr(""); }} style={inp} />
        </label>
        {sel !== null && sel !== 0 && <p style={{ fontSize: 12.5, fontWeight: 700, color: sel > 0 ? C.red : C.green, margin: "0 0 8px" }}>Selisih {sel > 0 ? "+" : "-"}{rp(Math.abs(sel))} dari data sistem</p>}
        {err && <p role="alert" style={{ fontSize: 12.5, color: C.red, margin: "0 0 8px" }}>{err}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
          <button onClick={onClose} style={btn}>Batal</button>
          <button onClick={kirim} style={{ ...btn, background: C.greenDeep, color: "#fff", borderColor: C.greenDeep }}>Kirim laporan</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Style bersama ---------- */
const link = { background: "none", border: "none", padding: 0, color: C.mute, fontSize: "inherit" };
const meta = { fontSize: 13, color: C.mute, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" };
const btn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 13, fontWeight: 700 };
const btnW = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,.35)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700 };
const tag = { fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999 };
const step = { width: 26, height: 26, borderRadius: "50%", border: "none", background: "#fff", color: C.greenDeep, display: "grid", placeItems: "center" };

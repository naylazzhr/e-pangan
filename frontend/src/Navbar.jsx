import React from "react";
import { User, Store, BarChart2, Calculator, Home, Shield } from "lucide-react";

export default function Navbar({ activePage, setActivePage, showToast }) {
  return (
    <header className="topbar">
      {/* Brand Logo */}
      <div
        className="brand-wrapper"
        onClick={() => {
          setActivePage("dashboard");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
      >
        <div style={{
          width: "38px",
          height: "38px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #2d6a4f 0%, #133320 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: "800",
          fontSize: "18px",
          boxShadow: "0 4px 12px rgba(45, 106, 79, 0.25)"
        }}>
          EP
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-dark)", lineHeight: "1.2" }}>
            E-PANGAN
          </div>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--eco-primary)", letterSpacing: "0.05em" }}>
            KAB. LAMONGAN
          </div>
        </div>
      </div>

      {/* Navigasi Menu Utama */}
      <nav className="mainnav-links">
        <button
          type="button"
          className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
          onClick={() => {
            setActivePage("dashboard");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Home size={14} style={{ display: "inline", marginRight: "4px" }} />
          Beranda
        </button>

        <button
          type="button"
          className={`nav-link ${activePage === "cari-harga" ? "active" : ""}`}
          onClick={() => {
            setActivePage("cari-harga");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Store size={14} style={{ display: "inline", marginRight: "4px" }} />
          Cari Harga
        </button>

        <button
          type="button"
          className={`nav-link ${activePage === "komparasi-pasar" ? "active" : ""}`}
          onClick={() => {
            setActivePage("komparasi-pasar");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <BarChart2 size={14} style={{ display: "inline", marginRight: "4px" }} />
          Perbandingan Antar Pasar
        </button>

        <button
          type="button"
          className={`nav-link ${activePage === "smart-budgeting" ? "active" : ""}`}
          onClick={() => {
            setActivePage("smart-budgeting");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Calculator size={14} style={{ display: "inline", marginRight: "4px" }} />
          Smart Budgeting
        </button>
      </nav>

      {/* Aksi Kanan (Login Admin) */}
      <div className="topbar-actions">
        <button
          className="btn-login-admin"
          type="button"
          onClick={() => {
            setActivePage("login");
            if (showToast) showToast("Mengarahkan ke Portal Login Petugas...");
          }}
        >
          <Shield size={15} />
          <span>Portal Admin</span>
        </button>
      </div>
    </header>
  );
}
import React, { useState } from "react";
import { User, Store, BarChart2, Calculator, Home, Shield, Menu, X } from "lucide-react";

export default function Navbar({ activePage, setActivePage, showToast }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header className="topbar">
        {/* Brand Logo */}
        <div
          className="brand-wrapper"
          onClick={() => handleNavClick("dashboard")}
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
            boxShadow: "0 4px 12px rgba(45, 106, 79, 0.25)",
            flexShrink: 0
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

        {/* Navigasi Menu Utama (Desktop) */}
        <nav className="mainnav-links desktop-only">
          <button
            type="button"
            className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            <Home size={14} style={{ display: "inline", marginRight: "4px" }} />
            Beranda
          </button>

          <button
            type="button"
            className={`nav-link ${activePage === "cari-harga" ? "active" : ""}`}
            onClick={() => handleNavClick("cari-harga")}
          >
            <Store size={14} style={{ display: "inline", marginRight: "4px" }} />
            Cari Harga
          </button>

          <button
            type="button"
            className={`nav-link ${activePage === "komparasi-pasar" ? "active" : ""}`}
            onClick={() => handleNavClick("komparasi-pasar")}
          >
            <BarChart2 size={14} style={{ display: "inline", marginRight: "4px" }} />
            Perbandingan Antar Pasar
          </button>

          <button
            type="button"
            className={`nav-link ${activePage === "smart-budgeting" ? "active" : ""}`}
            onClick={() => handleNavClick("smart-budgeting")}
          >
            <Calculator size={14} style={{ display: "inline", marginRight: "4px" }} />
            Smart Budgeting
          </button>
        </nav>

        {/* Aksi Kanan & Hamburger Button */}
        <div className="topbar-actions">
          <button
            className="btn-login-admin desktop-only"
            type="button"
            onClick={() => {
              setActivePage("login");
              if (showToast) showToast("Mengarahkan ke Portal Login Petugas...");
            }}
          >
            <Shield size={15} />
            <span>Portal Admin</span>
          </button>

          {/* Tombol Hamburger Mobile */}
          <button
            className="mobile-hamburger-btn"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Buka Menu Navigasi"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Backdrop Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Navigation */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="mobile-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2d6a4f 0%, #133320 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "800",
              fontSize: "14px"
            }}>
              EP
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-dark)" }}>E-PANGAN</div>
              <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--eco-primary)" }}>LAMONGAN</div>
            </div>
          </div>
          <button
            className="mobile-drawer-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-drawer-links">
          <button
            type="button"
            className={`mobile-drawer-link ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            <Home size={18} />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            className={`mobile-drawer-link ${activePage === "cari-harga" ? "active" : ""}`}
            onClick={() => handleNavClick("cari-harga")}
          >
            <Store size={18} />
            <span>Cari Harga</span>
          </button>

          <button
            type="button"
            className={`mobile-drawer-link ${activePage === "komparasi-pasar" ? "active" : ""}`}
            onClick={() => handleNavClick("komparasi-pasar")}
          >
            <BarChart2 size={18} />
            <span>Perbandingan Antar Pasar</span>
          </button>

          <button
            type="button"
            className={`mobile-drawer-link ${activePage === "smart-budgeting" ? "active" : ""}`}
            onClick={() => handleNavClick("smart-budgeting")}
          >
            <Calculator size={18} />
            <span>Smart Budgeting</span>
          </button>
        </nav>

        <div className="mobile-drawer-footer">
          <button
            className="mobile-btn-admin"
            type="button"
            onClick={() => {
              setActivePage("login");
              setMobileMenuOpen(false);
              if (showToast) showToast("Mengarahkan ke Portal Login Petugas...");
            }}
          >
            <Shield size={16} />
            <span>Portal Login Petugas</span>
          </button>
          <div className="mobile-drawer-badge">
            Sistem Pemantau Harga Pangan DKPP Lamongan
          </div>
        </div>
      </div>
    </>
  );
}
import React, { useState } from "react";
import { Store, BarChart2, Calculator, Home, Shield, Menu, X, Search } from "lucide-react";
import logoEpangan from "./assets/logo-epangan.png";

export default function Navbar({ activePage, setActivePage, showToast }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header className="topbar grocery-topbar">
        {/* Brand Logo Resmi E-Pangan Kab. Lamongan */}
        <div
          className="brand-wrapper"
          onClick={() => handleNavClick("dashboard")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          title="E-Pangan Kabupaten Lamongan"
        >
          <img
            src={logoEpangan}
            alt="E-Pangan Kab. Lamongan"
            style={{
              height: "42px",
              width: "auto",
              objectFit: "contain",
              display: "block"
            }}
          />
        </div>

        {/* Navigasi Menu Utama (Desktop) */}
        <nav className="mainnav-links desktop-only grocery-nav-links">
          <button
            type="button"
            className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            Beranda
          </button>

          <button
            type="button"
            className={`nav-link ${activePage === "cari-harga" ? "active" : ""}`}
            onClick={() => handleNavClick("cari-harga")}
          >
            Cari Harga
          </button>

          <button
            type="button"
            className={`nav-link ${activePage === "komparasi-pasar" ? "active" : ""}`}
            onClick={() => handleNavClick("komparasi-pasar")}
          >
            Perbandingan Pasar
          </button>

          <button
            type="button"
            className={`nav-link ${activePage === "smart-budgeting" ? "active" : ""}`}
            onClick={() => handleNavClick("smart-budgeting")}
          >
            Smart Budgeting
          </button>
        </nav>

        {/* Aksi Kanan & Hamburger Button */}
        <div className="topbar-actions grocery-actions">
          <button
            className="btn-search-trigger desktop-only"
            type="button"
            onClick={() => {
              if (activePage !== "dashboard") setActivePage("dashboard");
              setTimeout(() => {
                const el = document.getElementById("search-input-main");
                if (el) {
                  el.focus();
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }, 150);
            }}
            title="Cari Komoditas"
          >
            <Search size={15} />
            <span>Cari</span>
          </button>

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
            title={mobileMenuOpen ? "Tutup Menu" : "Buka Menu Navigasi"}
          >
            {mobileMenuOpen ? <X size={22} color="#1b4332" /> : <Menu size={22} color="#1b4332" />}
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
          <div
            onClick={() => handleNavClick("dashboard")}
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            title="E-Pangan Kabupaten Lamongan"
          >
            <img
              src={logoEpangan}
              alt="E-Pangan Kab. Lamongan"
              style={{
                height: "36px",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
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
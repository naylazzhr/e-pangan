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

          {/* Tombol Hamburger Mobile Ala Admin (Kecil, Rapi, Border Halus) */}
          <button
            className="mobile-hamburger-btn"
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "12px",
              border: "1px solid #d2ded7",
              backgroundColor: "#ffffff",
              color: "#1b4332",
              cursor: "pointer",
              padding: 0
            }}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Buka Menu Navigasi"
            title={mobileMenuOpen ? "Tutup Menu" : "Buka Menu Navigasi"}
          >
            {mobileMenuOpen ? <X size={18} color="#1b4332" /> : <Menu size={18} color="#1b4332" />}
          </button>
        </div>
      </header>

      {/* HAMBURGER MODAL / FLOATING MENU KHUSUS MOBILE (BENTUK PERSIS ADMIN) */}
      {mobileMenuOpen && (
        <div
          className="user-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(10, 33, 22, 0.45)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 99998
          }}
        />
      )}

      {mobileMenuOpen && (
        <div
          className="user-mobile-floating-menu"
          style={{
            position: "fixed",
            top: "58px",
            right: "12px",
            width: "250px",
            maxWidth: "calc(100vw - 24px)",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 12px 36px rgba(15, 29, 20, 0.22)",
            border: "1px solid #d2ded7",
            padding: "14px 12px",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          {/* Header Popover */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 6px 8px 6px",
              borderBottom: "1px solid #eef3f0",
              marginBottom: "4px"
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "800",
                color: "#1b4332",
                textTransform: "uppercase",
                letterSpacing: "0.04em"
              }}
            >
              Menu Utama
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#4e6754",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              aria-label="Tutup Menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* List Menu Item Popover */}
          {[
            { id: "dashboard", name: "Beranda", icon: Home },
            { id: "cari-harga", name: "Cari Harga", icon: Store },
            { id: "komparasi-pasar", name: "Perbandingan Pasar", icon: BarChart2 },
            { id: "smart-budgeting", name: "Smart Budgeting", icon: Calculator },
          ].map((item) => {
            const Icon = item.icon;
            const isActive =
              item.id === "dashboard"
                ? activePage === "dashboard"
                : item.id === "cari-harga"
                ? activePage === "cari-harga" || activePage === "detail-kios"
                : activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: isActive ? "#1b4332" : "transparent",
                  color: isActive ? "#ffffff" : "#2d4436",
                  fontWeight: isActive ? "800" : "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon size={16} color={isActive ? "#ffffff" : "#2d6a4f"} />
                  <span>{item.name}</span>
                </div>
              </button>
            );
          })}

          <div style={{ height: "1px", backgroundColor: "#eef3f0", margin: "6px 0" }} />

          {/* Tombol Akses Portal Petugas */}
          <button
            onClick={() => {
              setActivePage("login");
              setMobileMenuOpen(false);
              if (showToast) showToast("Mengarahkan ke Portal Login Petugas...");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 12px",
              borderRadius: "10px",
              border: "1px solid #d2ded7",
              backgroundColor: "#ffffff",
              color: "#1b4332",
              fontWeight: "700",
              fontSize: "12px",
              cursor: "pointer",
              width: "100%",
              justifyContent: "center",
              transition: "all 0.15s"
            }}
          >
            <Shield size={14} color="#2d6a4f" />
            <span>Portal Login Petugas</span>
          </button>
        </div>
      )}
    </>
  );
}
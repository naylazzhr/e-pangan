import React from "react";
import { User } from "lucide-react";

export default function Navbar({ activePage, setActivePage, showToast }) {
  return (
    <header className="topbar">
      <div
        className="brand-wrapper"
        onClick={() => setActivePage("dashboard")}
        style={{ cursor: "pointer" }}
      >
        <img
          src="/logo-epangan.png"
          alt="E-Pangan Kab. Lamongan"
          className="brand-logo-img"
          style={{ height: "40px", objectFit: "contain" }}
        />
      </div>

      <nav className="mainnav-links">
        <button
          type="button"
          className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
          onClick={() => setActivePage("dashboard")}
        >
          Beranda
        </button>

        {/* DIUBAH: Pindah halaman ke 'cari-harga' */}
        <button
          type="button"
          className={`nav-link ${activePage === "cari-harga" ? "active" : ""}`}
          onClick={() => setActivePage("cari-harga")}
        >
          Cari Harga
        </button>

        <button
          type="button"
          className={`nav-link ${activePage === "komparasi-pasar" ? "active" : ""}`}
          onClick={() => setActivePage("komparasi-pasar")}
        >
          Perbandingan Antar Pasar
        </button>

        <button
          type="button"
          className={`nav-link ${activePage === "smart-budgeting" ? "active" : ""}`}
          onClick={() => setActivePage && setActivePage("smart-budgeting")}
        >
          Smart Budgeting
        </button>

        <button
          type="button"
          className={`nav-link ${activePage === "detail-kios" ? "active" : ""}`}
          onClick={() => setActivePage && setActivePage("detail-kios")}
        >
          Detail Kios
        </button>

        <button
          type="button"
          className={`nav-link ${activePage === "login" ? "active" : ""}`}
          onClick={() => setActivePage && setActivePage("login")}
        >
          Portal Admin
        </button>
      </nav>

      <div className="topbar-actions">
        <button
          className="btn-login-admin"
          type="button"
          onClick={() => setActivePage && setActivePage("login")}
        >
          <User size={16} />
          <span>Login Admin</span>
        </button>
      </div>
    </header>
  );
}
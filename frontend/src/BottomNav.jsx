import React from "react";
import { Home, Store, BarChart2, Calculator } from "lucide-react";

export default function BottomNav({ activePage, setActivePage, showToast }) {
  const handleNav = (page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigasi Menu Mobile">
      <button
        type="button"
        className={`mobile-bottom-nav-item ${activePage === "dashboard" ? "active" : ""}`}
        onClick={() => handleNav("dashboard")}
      >
        <div className="nav-icon-wrap">
          <Home size={19} />
        </div>
        <span>Beranda</span>
      </button>

      <button
        type="button"
        className={`mobile-bottom-nav-item ${activePage === "cari-harga" || activePage === "detail-kios" ? "active" : ""}`}
        onClick={() => handleNav("cari-harga")}
      >
        <div className="nav-icon-wrap">
          <Store size={19} />
        </div>
        <span>Cari Harga</span>
      </button>

      <button
        type="button"
        className={`mobile-bottom-nav-item ${activePage === "komparasi-pasar" ? "active" : ""}`}
        onClick={() => handleNav("komparasi-pasar")}
      >
        <div className="nav-icon-wrap">
          <BarChart2 size={19} />
        </div>
        <span>Komparasi</span>
      </button>

      <button
        type="button"
        className={`mobile-bottom-nav-item ${activePage === "smart-budgeting" ? "active" : ""}`}
        onClick={() => handleNav("smart-budgeting")}
      >
        <div className="nav-icon-wrap">
          <Calculator size={19} />
        </div>
        <span>Budget</span>
      </button>
    </nav>
  );
}


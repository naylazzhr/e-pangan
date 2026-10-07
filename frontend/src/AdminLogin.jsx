import React, { useState } from "react";
import { User, Lock, ShieldCheck, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { loginPetugas } from "./api";

export default function AdminLogin({ setActivePage, showToast }) {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (!identifier || !password) {
            setErrorMessage("Silakan isi Email/Username dan Kata Sandi.");
            return;
        }

        setIsLoading(true);
        try {
            await loginPetugas(identifier, password);
            if (showToast) showToast("Berhasil masuk ke Portal Admin!");
            setActivePage("admin-dashboard");
        } catch (err) {
            setErrorMessage(err.message || "Email/Username atau kata sandi tidak sesuai.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: "85vh" }}>
            <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: "420px", width: "100%" }}>

                {/* Header Banner */}
                <div className="bg-success text-white text-center p-4 rounded-top-4">
                    <div className="d-inline-flex bg-white bg-opacity-25 p-3 rounded-circle mb-2">
                        <ShieldCheck size={36} className="text-white" />
                    </div>
                    <h4 className="fw-bold mb-1">E-Pangan</h4>
                    <span className="badge bg-white text-success px-3 py-1 rounded-pill fw-semibold">
                        KABUPATEN LAMONGAN
                    </span>
                </div>

                <div className="card-body p-4">
                    <div className="text-center mb-4">
                        <span className="badge bg-success-subtle text-success border border-success-subtle mb-2 px-3 py-1 rounded-pill">
                            PORTAL KHUSUS PETUGAS LAPANGAN
                        </span>
                        <h5 className="fw-bold text-dark mt-1">Masuk Akun Petugas</h5>
                        <p className="text-muted small">
                            Akses sistem pembaruan data harga komoditas dan laporan pasar
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
                            {errorMessage}
                        </div>
                    )}

                    {/* Tambahkan autoComplete="off" pada tag form */}
                    <form onSubmit={handleSubmit} autoComplete="off">
                        {/* Input Username / Email */}
                        <div className="mb-3">
                            <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
                                <User size={14} className="text-success" /> Email Gmail / Username
                            </label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    name="username_nofill"
                                    autoComplete="off"
                                    className="form-control bg-light border-end-0 rounded-start-3 py-2 fs-6"
                                    placeholder="Masukkan Email atau Username"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    disabled={isLoading}
                                />
                                <span className="input-group-text bg-light border-start-0 text-success rounded-end-3 px-3">
                                    <CheckCircle2 size={18} />
                                </span>
                            </div>
                        </div>

                        {/* Input Password */}
                        <div className="mb-3">
                            <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
                                <Lock size={14} className="text-success" /> Kata Sandi / Password
                            </label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password_nofill"
                                    autoComplete="new-password"
                                    className="form-control bg-light border-end-0 rounded-start-3 py-2 fs-6"
                                    placeholder="Masukkan Kata Sandi"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button
                                    className="btn btn-light border border-start-0 text-muted px-3 rounded-end-3"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-success w-100 py-2 fw-semibold rounded-3 mt-3 shadow-sm"
                            disabled={isLoading}
                        >
                            {isLoading ? "Memverifikasi..." : "Masuk ke Portal Petugas"}
                        </button>
                    </form>

                    <div className="p-3 bg-light rounded-3 mt-4 text-muted small border">
                        <div className="fw-semibold text-dark mb-1 d-flex align-items-center gap-1">
                            <ShieldCheck size={16} className="text-success" /> Otorisasi & Protokol Keamanan
                        </div>
                        Hanya petugas resmi Dinas Ketahanan Pangan yang memiliki wewenang akses.
                    </div>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            className="btn btn-link text-decoration-none text-muted small p-0"
                            onClick={() => setActivePage("dashboard")}
                        >
                            <ArrowLeft size={14} className="me-1" /> Kembali ke Layanan Publik
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, Check } from "lucide-react";
import { loginPetugas } from "./api";

export default function AdminLogin({ setActivePage, showToast }) {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setErrorMessage("");

        if (!identifier.trim() || !password.trim()) {
            setErrorMessage("Silakan isi Email / NIP / Username dan Password.");
            return;
        }

        setIsLoading(true);
        try {
            await loginPetugas(identifier.trim(), password);
            if (showToast) showToast("Berhasil masuk ke Portal Admin!");
            setActivePage("admin-dashboard");
        } catch (err) {
            setErrorMessage(err.message || "Email/NIP/Username atau Password salah! Akses ditolak.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="epangan-login-page">
            <style>{`
                .epangan-login-page {
                    min-height: 100vh;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    /* Atmosfer Hijau Alam Khas E-Pangan */
                    background: linear-gradient(145deg, #2d6a4f 0%, #1b4332 45%, #081c12 100%);
                    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
                    box-sizing: border-box;
                    padding: 40px 20px;
                }

                /* Ambient Bokeh Glow Background */
                .epangan-glow-1 {
                    position: absolute;
                    top: -80px;
                    left: 15%;
                    width: 480px;
                    height: 480px;
                    background: radial-gradient(circle, rgba(183, 239, 197, 0.35) 0%, rgba(82, 183, 136, 0.12) 50%, rgba(0,0,0,0) 75%);
                    border-radius: 50%;
                    pointer-events: none;
                    filter: blur(50px);
                }

                .epangan-glow-2 {
                    position: absolute;
                    bottom: -100px;
                    right: 10%;
                    width: 520px;
                    height: 520px;
                    background: radial-gradient(circle, rgba(45, 106, 79, 0.5) 0%, rgba(8, 28, 18, 0) 70%);
                    border-radius: 50%;
                    pointer-events: none;
                    filter: blur(60px);
                }

                /* Tombol Kembali (Pojok Kiri Atas) */
                .epangan-back-btn {
                    position: absolute;
                    top: 24px;
                    left: 24px;
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 8px 24px rgba(7, 28, 18, 0.18);
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    z-index: 40;
                }

                .epangan-back-btn:hover {
                    transform: scale(1.06) translateX(-2px);
                    background: #ffffff;
                    box-shadow: 0 12px 28px rgba(7, 28, 18, 0.28);
                }

                /* Container Card Utama dengan Stepped Button */
                .epangan-stepped-card-container {
                    position: relative;
                    width: 100%;
                    max-width: 380px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 20;
                    margin-top: 30px;
                    animation: epanganCardPop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes epanganCardPop {
                    from {
                        opacity: 0;
                        transform: translateY(16px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* Avatar Bulat Mengambang di Atas Card */
                .epangan-floating-avatar {
                    position: absolute;
                    top: -42px;
                    width: 82px;
                    height: 82px;
                    border-radius: 50%;
                    background: #0f2c1e;
                    border: 3.5px solid #ffffff;
                    box-shadow: 0 12px 28px rgba(5, 20, 13, 0.35);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    z-index: 30;
                    transition: transform 0.25s ease;
                }

                .epangan-floating-avatar:hover {
                    transform: scale(1.05);
                }

                /* Card Frosted Glass Bentuk Persegi Membulat */
                .epangan-form-card {
                    width: 100%;
                    background: rgba(240, 248, 244, 0.88);
                    backdrop-filter: blur(28px);
                    -webkit-backdrop-filter: blur(28px);
                    border: 1.5px solid rgba(255, 255, 255, 0.95);
                    border-radius: 34px;
                    box-shadow: 0 24px 60px rgba(5, 24, 15, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.8);
                    padding: 56px 28px 28px 28px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                }

                /* Judul & Keterangan */
                .epangan-card-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: #112216;
                    margin: 0 0 3px 0;
                    text-align: center;
                    letter-spacing: -0.02em;
                }

                .epangan-card-title span {
                    color: #2d6a4f;
                }

                .epangan-card-subtitle {
                    font-size: 12px;
                    font-weight: 600;
                    color: #4e6754;
                    margin: 0 0 20px 0;
                    text-align: center;
                    letter-spacing: 0.02em;
                }

                /* Input Row dengan Desain Kotak Solid Bersekat (Seperti Referensi) */
                .epangan-input-box {
                    width: 100%;
                    height: 50px;
                    background: #173827;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    margin-bottom: 14px;
                    border: 1.5px solid #1f4732;
                    overflow: hidden;
                    box-shadow: 0 4px 14px rgba(8, 28, 18, 0.12);
                    transition: all 0.22s ease;
                }

                .epangan-input-box:focus-within {
                    border-color: #52b788;
                    box-shadow: 0 0 0 3px rgba(82, 183, 136, 0.28);
                    background: #133222;
                }

                /* Kotak Icon Sisi Kiri */
                .epangan-input-icon-slot {
                    width: 50px;
                    height: 100%;
                    background: #10291c;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    border-right: 1px solid rgba(255, 255, 255, 0.08);
                }

                /* Input Text Field */
                .epangan-input-field {
                    flex: 1;
                    height: 100%;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: #ffffff !important;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 0 14px;
                    font-family: inherit;
                    letter-spacing: 0.01em;
                }

                .epangan-input-field::placeholder {
                    color: rgba(216, 243, 220, 0.6) !important;
                    font-weight: 500;
                }

                .epangan-input-field:-webkit-autofill,
                .epangan-input-field:-webkit-autofill:hover, 
                .epangan-input-field:-webkit-autofill:focus {
                    -webkit-text-fill-color: #ffffff !important;
                    -webkit-box-shadow: 0 0 0px 1000px #173827 inset !important;
                    transition: background-color 5000s ease-in-out 0s;
                }

                .epangan-eye-btn {
                    background: transparent;
                    border: none;
                    padding: 0 14px;
                    color: rgba(216, 243, 220, 0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    outline: none;
                    transition: color 0.15s ease;
                }

                .epangan-eye-btn:hover {
                    color: #ffffff;
                }

                /* Baris Remember Me & Info */
                .epangan-meta-row {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin: 4px 0 16px 0;
                    font-size: 12px;
                    color: #3b5745;
                }

                .epangan-remember-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    cursor: pointer;
                    user-select: none;
                    font-weight: 600;
                }

                .epangan-custom-checkbox {
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                    border: 1.5px solid #2d6a4f;
                    background: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s;
                }

                .epangan-custom-checkbox.checked {
                    background: #2d6a4f;
                    border-color: #2d6a4f;
                }

                /* Alert Error */
                .epangan-error-box {
                    width: 100%;
                    background: rgba(225, 29, 72, 0.12);
                    border: 1px solid rgba(225, 29, 72, 0.4);
                    color: #b91c1c;
                    padding: 9px 12px;
                    border-radius: 10px;
                    font-size: 11.5px;
                    line-height: 1.4;
                    margin-bottom: 14px;
                    text-align: center;
                    font-weight: 600;
                    box-sizing: border-box;
                }

                /* Stepped LOGIN Button (Menjulur / Bertingkat di Bawah Card Seperti Contoh Gambar) */
                .epangan-stepped-btn {
                    width: 72%;
                    height: 50px;
                    margin-top: -6px;
                    border-bottom-left-radius: 20px;
                    border-bottom-right-radius: 20px;
                    border-top-left-radius: 4px;
                    border-top-right-radius: 4px;
                    background: linear-gradient(180deg, #1d4632 0%, #0d281a 100%);
                    border: 1.5px solid rgba(255, 255, 255, 0.25);
                    border-top: none;
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 800;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 16px 32px rgba(4, 18, 11, 0.45);
                    transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
                    font-family: inherit;
                    z-index: 10;
                }

                .epangan-stepped-btn:hover:not(:disabled) {
                    background: linear-gradient(180deg, #275d43 0%, #123624 100%);
                    transform: translateY(2px);
                    box-shadow: 0 18px 36px rgba(4, 18, 11, 0.55);
                    color: #d8f3dc;
                }

                .epangan-stepped-btn:active:not(:disabled) {
                    transform: translateY(4px);
                    box-shadow: 0 8px 18px rgba(4, 18, 11, 0.35);
                }

                .epangan-stepped-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                /* Badge Keamanan Petugas */
                .epangan-card-footer-badge {
                    margin-top: 14px;
                    padding: 8px 12px;
                    background: rgba(45, 106, 79, 0.08);
                    border: 1px dashed rgba(45, 106, 79, 0.35);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    color: #214d38;
                    line-height: 1.35;
                    width: 100%;
                    box-sizing: border-box;
                }

                /* Footer Credit Bawah */
                .epangan-bottom-credit {
                    margin-top: 32px;
                    color: rgba(216, 243, 220, 0.75);
                    font-size: 12px;
                    font-weight: 600;
                    text-align: center;
                    letter-spacing: 0.03em;
                    z-index: 10;
                }

                @media (max-width: 768px) {
                    .epangan-login-page {
                        padding: 32px 16px;
                    }
                    .epangan-stepped-card-container {
                        max-width: 100%;
                        margin-top: 20px;
                    }
                    .epangan-form-card {
                        border-radius: 28px;
                        padding: 54px 20px 24px 20px;
                    }
                    .epangan-input-box {
                        height: 48px;
                    }
                    .epangan-input-field {
                        font-size: 16px !important;
                    }
                    .epangan-stepped-btn {
                        width: 80%;
                        height: 48px;
                        font-size: 13px;
                    }
                    .epangan-glow-1 {
                        width: 300px;
                        height: 300px;
                    }
                    .epangan-glow-2 {
                        width: 320px;
                        height: 320px;
                    }
                }
                @media (max-width: 480px) {
                    .epangan-stepped-card-container {
                        max-width: 96vw;
                    }
                    .epangan-form-card {
                        padding: 50px 18px 20px 18px;
                        border-radius: 24px;
                    }
                    .epangan-stepped-btn {
                        width: 84%;
                        height: 46px;
                    }
                }
            `}</style>

            {/* Tombol Kembali ke Beranda */}
            <button
                type="button"
                className="epangan-back-btn"
                onClick={() => setActivePage("dashboard")}
                title="Kembali ke Beranda"
                aria-label="Kembali ke Beranda"
            >
                <ArrowLeft size={22} color="#1b4332" strokeWidth={2.5} />
            </button>

            {/* Efek Ambient Glow / Bokeh Hijau */}
            <div className="epangan-glow-1" />
            <div className="epangan-glow-2" />

            {/* Container Utama Desain Card Stepped */}
            <div className="epangan-stepped-card-container">
                {/* Floating Avatar Bulat di Atas Card */}
                <div className="epangan-floating-avatar">
                    <User size={34} strokeWidth={2.2} color="#74c69d" />
                </div>

                {/* Form Card */}
                <form className="epangan-form-card" onSubmit={handleSubmit} autoComplete="off">
                    <h2 className="epangan-card-title">
                        Portal Petugas <span>E-Pangan</span>
                    </h2>
                    <p className="epangan-card-subtitle">
                        Kabupaten Lamongan
                    </p>

                    {errorMessage && (
                        <div className="epangan-error-box">
                            {errorMessage}
                        </div>
                    )}

                    {/* Input 1: Email ID / NIP / Username */}
                    <div className="epangan-input-box">
                        <div className="epangan-input-icon-slot">
                            <User size={18} color="#b7efc5" strokeWidth={2.2} />
                        </div>
                        <input
                            type="text"
                            name="identifier"
                            className="epangan-input-field"
                            placeholder="Email / NIP / Username"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            disabled={isLoading}
                            autoComplete="username"
                        />
                    </div>

                    {/* Input 2: Password */}
                    <div className="epangan-input-box">
                        <div className="epangan-input-icon-slot">
                            <Lock size={18} color="#b7efc5" strokeWidth={2.2} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="epangan-input-field"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className="epangan-eye-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                            {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                        </button>
                    </div>

                    {/* Remember Me & Petugas Info */}
                    <div className="epangan-meta-row">
                        <label
                            className="epangan-remember-label"
                            onClick={() => setRememberMe(!rememberMe)}
                        >
                            <span className={`epangan-custom-checkbox ${rememberMe ? "checked" : ""}`}>
                                {rememberMe && <Check size={12} color="#ffffff" strokeWidth={3} />}
                            </span>
                            Ingat saya
                        </label>
                        <span style={{ fontSize: "11px", color: "#6b8f71", fontWeight: "600" }}>
                            DKPP Lamongan
                        </span>
                    </div>

                    {/* Badge Keamanan Resmi */}
                    <div className="epangan-card-footer-badge">
                        <ShieldCheck size={16} color="#2d6a4f" style={{ flexShrink: 0 }} />
                        <span>Akses terbatas khusus petugas resmi Dinas Ketahanan Pangan Lamongan.</span>
                    </div>
                </form>

                {/* Tombol LOGIN Stepped / Menjulur di Bawah Card (Sesuai Referensi Gambar) */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="epangan-stepped-btn"
                    disabled={isLoading}
                >
                    {isLoading ? "Memverifikasi..." : "LOGIN"}
                </button>
            </div>

            {/* Attribution Text Bawah */}
            <div className="epangan-bottom-credit">
                E-Pangan Kabupaten Lamongan &bull; Portal Akses Petugas
            </div>
        </div>
    );
}

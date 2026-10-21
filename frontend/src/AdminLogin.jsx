import React, { useState } from "react";
import { User, Lock, ShieldCheck, Eye, EyeOff, ArrowLeft } from "lucide-react";
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
        <div style={{
            minHeight: "100vh",
            width: "100%",
            background: "radial-gradient(circle at 50% 30%, #1e4d35 0%, #addbbfff 60%, #e3ede7ff 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Ambient Background Glow / Pendaran Cahaya */}
            <div style={{
                position: "absolute",
                width: "600px",
                height: "600px",
                background: "radial-gradient(circle, rgba(129, 201, 165, 0.59) 0%, rgba(0, 0, 0, 0) 70%)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                pointerEvents: "none"
            }} />

            <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>

                {/* Lingkaran Avatar Profil Mengambang di Atas Card */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "-40px", position: "relative", zIndex: 10 }}>
                    <div style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "#0c1f14",
                        border: "2px solid rgba(255, 255, 255, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
                        color: "#ffffff"
                    }}>
                        <User size={38} strokeWidth={1.8} />
                    </div>
                </div>

                {/* Glassmorphism Card Utama */}
                <div style={{
                    position: "relative",
                    background: "rgba(255, 255, 255, 0.07)",
                    backdropFilter: "blur(25px)",
                    WebkitBackdropFilter: "blur(25px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "36px",
                    padding: "54px 32px 32px 32px",
                    boxShadow: "0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                    color: "#fff",
                    overflow: "hidden"
                }}>

                    {/* Pantulan Cahaya Kaca Glossy (Diagonal Highlight) */}
                    <div style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.03) 40%, transparent 60%)",
                        pointerEvents: "none"
                    }} />

                    {/* Judul & Deskripsi */}
                    <div style={{ textAlign: "center", marginBottom: "28px" }}>
                        <h3 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 6px 0", letterSpacing: "-0.02em", color: "#ffffff" }}>
                            Portal Petugas <span style={{ color: "#abfad3ff" }}>E-Pangan</span>
                        </h3>
                        <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.7)", margin: 0, fontWeight: "500" }}>
                            Kabupaten Lamongan
                        </p>
                    </div>

                    {errorMessage && (
                        <div style={{
                            background: "rgba(225, 29, 72, 0.25)",
                            border: "1px solid rgba(225, 29, 72, 0.5)",
                            color: "#fca5a5",
                            padding: "10px 14px",
                            borderRadius: "14px",
                            fontSize: "12px",
                            marginBottom: "20px",
                            textAlign: "center",
                            fontWeight: "600"
                        }}>
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} autoComplete="off">
                        {/* Input Email / Username (Abu-abu terang semi-transparan) */}
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                background: "rgba(240, 243, 241, 0.82)",
                                borderRadius: "14px",
                                padding: "0 16px",
                                border: "1px solid rgba(255,255,255,0.3)"
                            }}>
                                <User size={18} color="#2b3b32" style={{ flexShrink: 0, marginRight: "12px" }} />
                                <input
                                    type="text"
                                    name="username_nofill"
                                    autoComplete="off"
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        background: "transparent",
                                        padding: "14px 0",
                                        color: "#112216",
                                        fontSize: "14px",
                                        outline: "none",
                                        fontWeight: "600"
                                    }}
                                    placeholder="Email ID / Username"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Input Password */}
                        <div style={{ marginBottom: "24px" }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                background: "rgba(240, 243, 241, 0.82)",
                                borderRadius: "14px",
                                padding: "0 16px",
                                border: "1px solid rgba(255,255,255,0.3)"
                            }}>
                                <Lock size={18} color="#2b3b32" style={{ flexShrink: 0, marginRight: "12px" }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password_nofill"
                                    autoComplete="new-password"
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        background: "transparent",
                                        padding: "14px 0",
                                        color: "#112216",
                                        fontSize: "14px",
                                        outline: "none",
                                        fontWeight: "600"
                                    }}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#2b3b32",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        padding: 0
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Tombol Login Hijau Gelap Elegan */}
                        <button
                            type="submit"
                            style={{
                                width: "100%",
                                background: "linear-gradient(135deg, #18422e 0%, #0d2818 100%)",
                                color: "#ffffff",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                padding: "14px",
                                borderRadius: "14px",
                                fontSize: "14px",
                                fontWeight: "800",
                                cursor: "pointer",
                                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
                                transition: "all 0.2s",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase"
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? "Memverifikasi..." : "LOGIN"}
                        </button>
                    </form>

                    {/* Catatan Protokol Otorisasi */}
                    <div style={{
                        marginTop: "24px",
                        padding: "12px 14px",
                        background: "rgba(0, 0, 0, 0.25)",
                        borderRadius: "16px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                    }}>
                        <ShieldCheck size={18} color="#74c69d" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", lineHeight: "1.4" }}>
                            Akses terbatas khusus petugas resmi Dinas Ketahanan Pangan Lamongan.
                        </span>
                    </div>

                </div>

                {/* Tombol Kembali ke Beranda Rapi di Bawah Card */}
                <div style={{ textAlign: "center", marginTop: "24px" }}>
                    <button
                        type="button"
                        onClick={() => setActivePage("dashboard")}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(255, 255, 255, 0.7)",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s"
                        }}
                    >
                        <ArrowLeft size={15} /> Kembali ke Beranda Utama
                    </button>
                </div>

            </div>
        </div>
    );
}
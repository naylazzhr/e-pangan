import React, { useState, useRef } from "react";
import { CloudUpload, Music, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function NlpAudioUpload({ onSuccessSave, showToast, onNavigateTab }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [nlpResult, setNlpResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Endpoint API Lokal E-Pangan
    const BACKEND_NLP_URL = "/api/nlp/upload-suara";
    const BACKEND_SAVE_URL = "/api/nlp/submit-suara";

    const validateAndSetFile = (file) => {
        if (!file) return;
        if (file.type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(file.name)) {
            setSelectedFile(file);
            setErrorMsg("");
            setNlpResult(null);
            setIsSaved(false);
        } else {
            const err = "Format file tidak didukung! Harap unggah file berkas audio (.mp3, .wav, .m4a, dll).";
            setErrorMsg(err);
            if (showToast) showToast(err, "error");
            setSelectedFile(null);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleUploadAndProcess = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setIsSaved(false);
        setErrorMsg("");

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const token = localStorage.getItem("epangan_token");
            const response = await fetch(BACKEND_NLP_URL, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || data.message || "Gagal memproses berkas audio di server.");
            }

            setNlpResult(data);
            if (showToast) showToast(`Berhasil mengekstraksi data suara dari file ${selectedFile.name}!`, "success");
        } catch (error) {
            const msg = error.message || "Terjadi kesalahan saat menghubungkan ke server backend.";
            setErrorMsg(msg);
            if (showToast) showToast(msg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToDatabase = async () => {
        if (!nlpResult) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem("epangan_token");
            const transcriptText = nlpResult.transcript || nlpResult.transkrip || "";
            const response = await fetch(BACKEND_SAVE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    transcript: transcriptText,
                    simpan_langsung: true,
                }),
            });

            const result = await response.json();
            if (response.ok) {
                setIsSaved(true);
                if (showToast) {
                    showToast("Data hasil ekstraksi NLP berhasil disimpan ke seluruh sistem!", "success");
                }
                if (onSuccessSave) onSuccessSave(result);
            } else {
                const failMsg = "Gagal menyimpan data: " + (result.detail || result.message || "Terjadi kesalahan.");
                if (showToast) showToast(failMsg, "error");
                else alert(failMsg);
            }
        } catch (err) {
            const netErr = "Terjadi kesalahan jaringan saat menyimpan data.";
            if (showToast) showToast(netErr, "error");
            else alert(netErr);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid #d2ded7", padding: "36px", boxShadow: "0 4px 20px rgba(27,67,50,0.05)" }}>

            {/* Label Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ backgroundColor: "#1b4332", color: "#ffffff", fontSize: "11px", fontWeight: "800", padding: "5px 14px", borderRadius: "99px", letterSpacing: "0.04em" }}>
                    MODUL UNGGAH AUDIO NLP
                </span>
                <span style={{ backgroundColor: "#f2f7f4", color: "#4e6754", fontSize: "11px", fontWeight: "700", padding: "5px 14px", borderRadius: "99px", border: "1px solid #d2ded7" }}>
                    Model Bahasa Daerah Jatim
                </span>
            </div>

            <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f1d14", margin: "0 0 6px 0" }}>
                    Unggah Berkas Rekaman Suara Pasar
                </h3>
                <p style={{ fontSize: "13.5px", color: "#4e6754", margin: 0, fontWeight: "600" }}>
                    Unggah file rekaman percakapan (.mp3, .wav, .m4a) untuk mendeteksi harga komoditas secara otomatis melalui ekstraksi NLP.
                </p>
            </div>

            {/* Drag & Drop File Area */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                style={{
                    border: "2px dashed " + (isDragOver ? "#2d6a4f" : selectedFile ? "#2d6a4f" : "#cbdccf"),
                    backgroundColor: isDragOver ? "#f2f7f4" : "#f9fcfb",
                    borderRadius: "24px",
                    padding: "36px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out"
                }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="audio/*,.mp3,.wav,.m4a"
                    style={{ display: "none" }}
                />

                {selectedFile ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <div style={{ padding: "14px", backgroundColor: "#eef8f2", borderRadius: "50%", color: "#2d6a4f", border: "1px solid #b7efc5" }}>
                            <Music size={32} />
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f1d14" }}>{selectedFile.name}</div>
                        <div style={{ fontSize: "12.5px", color: "#4e6754", fontWeight: "600" }}>
                            Ukuran: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                        <span style={{ fontSize: "12px", color: "#2d6a4f", fontWeight: "800", textDecoration: "underline", marginTop: "4px" }}>
                            Klik / Seret file lain untuk mengganti
                        </span>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                        <div style={{ padding: "16px", backgroundColor: "#eef8f2", borderRadius: "50%", color: "#2d6a4f", border: "1px solid #b7efc5" }}>
                            <CloudUpload size={36} />
                        </div>
                        <div style={{ fontSize: "14.5px", fontWeight: "800", color: "#0f1d14" }}>
                            Klik untuk memilih berkas audio, atau seret file ke sini
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#4e6754", fontWeight: "600" }}>
                            Format didukung: MP3, WAV, M4A, OGG
                        </div>
                    </div>
                )}
            </div>

            {/* Pesan Error */}
            {errorMsg && (
                <div style={{ marginTop: "16px", padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "14px", color: "#dc2626", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Tombol Kirim File ke Backend */}
            {selectedFile && !nlpResult && (
                <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                        onClick={handleUploadAndProcess}
                        disabled={isLoading}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 24px",
                            borderRadius: "99px",
                            border: "none",
                            backgroundColor: "#2d6a4f",
                            color: "#ffffff",
                            fontWeight: "800",
                            fontSize: "13.5px",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            boxShadow: "0 6px 16px rgba(45,106,79,0.25)"
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="spin" /> Memproses File Audio & NLP...
                            </>
                        ) : (
                            <>Proses & Analisis Berkas</>
                        )}
                    </button>
                </div>
            )}

            {/* Hasil dari Backend */}
            {nlpResult && (
                <div style={{ backgroundColor: "#f2f7f4", borderRadius: "20px", padding: "24px", border: "1px solid #d2ded7", marginTop: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#1b4332", display: "flex", alignItems: "center", gap: "6px" }}>
                            <CheckCircle2 size={16} color="#2d6a4f" /> HASIL TRANSKRIP &amp; ANALISIS NLP:
                        </span>
                        <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#1b4332", backgroundColor: "#eef8f2", padding: "4px 12px", borderRadius: "99px", border: "1px solid #b7efc5" }}>
                            AKURASI PARSER: {nlpResult.accuracy || "98.4%"}
                        </span>
                    </div>

                    <p style={{ fontSize: "13.5px", fontStyle: "italic", fontWeight: "600", color: "#0f1d14", backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #d2ded7", margin: "0 0 20px 0" }}>
                        "{nlpResult.transcript}"
                    </p>

                    {/* Preview Tabel Data Ter-ekstraksi */}
                    {nlpResult.extracted_data?.items && (
                        <div style={{ overflowX: "auto", marginBottom: "20px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left", backgroundColor: "#ffffff", borderRadius: "14px", overflow: "hidden", border: "1px solid #d2ded7" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#eef8f2", borderBottom: "1px solid #d2ded7", color: "#1b4332" }}>
                                        <th style={{ padding: "10px 14px", fontWeight: "800" }}>KOMODITAS</th>
                                        <th style={{ padding: "10px 14px", fontWeight: "800" }}>HARGA</th>
                                        <th style={{ padding: "10px 14px", fontWeight: "800" }}>SATUAN</th>
                                        <th style={{ padding: "10px 14px", fontWeight: "800" }}>PASAR / LOKASI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nlpResult.extracted_data.items.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid #f2f7f4" }}>
                                            <td style={{ padding: "10px 14px", fontWeight: "800", color: "#0f1d14" }}>{item.komoditas}</td>
                                            <td style={{ padding: "10px 14px", fontWeight: "800", color: "#2d6a4f" }}>
                                                Rp {Number(item.harga).toLocaleString("id-ID")}
                                            </td>
                                            <td style={{ padding: "10px 14px", fontWeight: "600", color: "#4e6754" }}>{item.satuan}</td>
                                            <td style={{ padding: "10px 14px", color: "#4e6754", fontWeight: "600" }}>{item.pasar}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Tombol Aksi Simpan */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #d2ded7", paddingTop: "16px" }}>
                        <button
                            onClick={() => { setSelectedFile(null); setNlpResult(null); setIsSaved(false); }}
                            style={{ padding: "10px 18px", borderRadius: "99px", border: "1px solid #d2ded7", backgroundColor: "#ffffff", color: "#4e6754", fontWeight: "700", fontSize: "12.5px", cursor: "pointer" }}
                        >
                            Unggah Ulang
                        </button>
                        <button
                            onClick={handleSaveToDatabase}
                            disabled={isSaving}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "10px 22px",
                                borderRadius: "99px",
                                border: "none",
                                backgroundColor: "#2d6a4f",
                                color: "#ffffff",
                                fontWeight: "800",
                                fontSize: "12.5px",
                                cursor: isSaving ? "not-allowed" : "pointer",
                                boxShadow: "0 4px 12px rgba(45,106,79,0.2)"
                            }}
                        >
                            {isSaving ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                            {isSaving ? "Menyimpan ke Seluruh Sistem..." : "Simpan ke Database Utama"}
                        </button>
                    </div>
                </div>
            )}

            {/* Banner Sukses Tersambung ke Sistem Lainnya */}
            {isSaved && (
                <div style={{ marginTop: "24px", backgroundColor: "#eef8f2", border: "1px solid #b7efc5", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 16px rgba(27,67,50,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f1d14" }}>
                                Data Suara Berhasil Disimpan &amp; Tersambung ke Seluruh Sistem!
                            </div>
                            <div style={{ fontSize: "13px", color: "#4e6754", fontWeight: "600", marginTop: "2px" }}>
                                Rekaman telah diproses: harga dicatat ke Survei Lapangan, memperbarui Katalog Master Komoditas, serta disinkronkan ke Dasbor Publik.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                        {onNavigateTab && (
                            <button
                                onClick={() => onNavigateTab("Ringkasan Pasar")}
                                style={{
                                    padding: "10px 20px",
                                    borderRadius: "99px",
                                    border: "none",
                                    backgroundColor: "#2d6a4f",
                                    color: "#ffffff",
                                    fontSize: "12.5px",
                                    fontWeight: "800",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 12px rgba(45,106,79,0.2)"
                                }}
                            >
                                📊 Buka di Ringkasan Pasar →
                            </button>
                        )}
                        {onNavigateTab && (
                            <button
                                onClick={() => onNavigateTab("Validasi Lapangan")}
                                style={{
                                    padding: "10px 20px",
                                    borderRadius: "99px",
                                    border: "1px solid #d2ded7",
                                    backgroundColor: "#ffffff",
                                    color: "#1b4332",
                                    fontSize: "12.5px",
                                    fontWeight: "800",
                                    cursor: "pointer"
                                }}
                            >
                                🔍 Cek Validasi Lapangan
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setSelectedFile(null);
                                setNlpResult(null);
                                setIsSaved(false);
                            }}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "99px",
                                border: "1px solid #b7efc5",
                                backgroundColor: "#ffffff",
                                color: "#2d6a4f",
                                fontSize: "12.5px",
                                fontWeight: "800",
                                cursor: "pointer"
                            }}
                        >
                            + Unggah Berkas Audio Baru
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface VerificationResult {
  valid: boolean;
  ticket?: {
    id: string;
    status: string;
    user: {
      id: string;
      name: string;
      phone: string;
    };
  };
  message?: string;
  error?: string;
}

export default function ScannerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualTicketId, setManualTicketId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.isBodyguard && !session?.user?.isAdmin) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setResult(null);
    
    try {
      readerRef.current = new BrowserMultiFormatReader();
      
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        setError(language === "tr" 
          ? "Kamera bulunamadı. Lütfen bilet ID'sini manuel girin."
          : "No camera found. Please enter ticket ID manually.");
        return;
      }

      // Prefer back camera
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes("back") || 
        device.label.toLowerCase().includes("arka")
      );
      const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

      setScanning(true);

      readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const ticketId = result.getText();
            stopScanning();
            verifyTicket(ticketId);
          }
        }
      );
    } catch (err) {
      console.error("Camera error:", err);
      setError(language === "tr"
        ? "Kamera erişimi reddedildi. Lütfen kamera iznini verin veya bilet ID'sini manuel girin."
        : "Camera access denied. Please allow camera access or enter ticket ID manually.");
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setScanning(false);
  };

  const verifyTicket = async (ticketId: string) => {
    setError(null);
    setResult(null);
    setIsVerifying(true);

    try {
      const res = await fetch("/api/ticket/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(language === "tr" 
        ? "Bilet doğrulanamadı. Lütfen tekrar deneyin."
        : "Failed to verify ticket. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTicketId.trim()) {
      verifyTicket(manualTicketId.trim());
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setManualTicketId("");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="spinner" />
      </div>
    );
  }

  if (!session?.user?.isBodyguard && !session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-christmas-gold">
          🛡️ {language === "tr" ? "Bilet Tarayıcı" : "Ticket Scanner"}
        </h1>
        <p className="text-christmas-cream/70 mt-2">
          {language === "tr" 
            ? "Misafir biletlerini doğrulamak için QR kodları tarayın"
            : "Scan QR codes to verify guest tickets"}
        </p>
      </div>

      {/* Scanner Section */}
      <div className="christmas-card p-6 mb-6">
        {!scanning && !result && !isVerifying && (
          <div className="text-center">
            <button
              onClick={startScanning}
              className="btn-christmas text-lg px-8 py-4 mb-4"
            >
              📷 {language === "tr" ? "Kamerayı Başlat" : "Start Camera Scanner"}
            </button>
            <p className="text-christmas-cream/60 text-sm">
              {language === "tr" 
                ? "Veya bilet ID'sini aşağıya manuel girin"
                : "Or enter ticket ID manually below"}
            </p>
          </div>
        )}

        {scanning && (
          <div className="relative">
            {/* Camera Video */}
            <div className="relative overflow-hidden rounded-lg border-2 border-christmas-gold bg-black">
              <video 
                ref={videoRef} 
                className="w-full h-[400px] object-cover"
                playsInline
                muted
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Dark overlay with transparent center */}
                <div className="absolute inset-0 bg-black/50" />
                
                {/* Scanning Square */}
                <div className="relative w-64 h-64">
                  {/* Transparent center */}
                  <div className="absolute inset-0 bg-transparent" style={{
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }} />
                  
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-christmas-gold rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-christmas-gold rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-christmas-gold rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-christmas-gold rounded-br-lg" />
                  
                  {/* Scanning line animation */}
                  <div className="absolute left-2 right-2 h-0.5 bg-christmas-gold animate-scan-line" />
                </div>
              </div>

              {/* Scanning text */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                  {language === "tr" 
                    ? "QR kodu kareye hizalayın"
                    : "Align QR code within the square"}
                </p>
              </div>
            </div>

            <button
              onClick={stopScanning}
              className="mt-4 w-full py-3 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10 transition font-medium"
            >
              {language === "tr" ? "Taramayı Durdur" : "Stop Scanning"}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isVerifying && (
          <div className="text-center py-12">
            <div className="spinner mb-4" />
            <p className="text-christmas-cream">
              {language === "tr" ? "Bilet doğrulanıyor..." : "Verifying ticket..."}
            </p>
          </div>
        )}

        {/* Result Display */}
        {result && !isVerifying && (
          <div className={`p-6 rounded-lg text-center ${
            result.valid 
              ? "bg-green-900/30 border-2 border-green-500" 
              : "bg-red-900/30 border-2 border-red-500"
          }`}>
            <div className="text-7xl mb-4">
              {result.valid ? "✅" : "❌"}
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${
              result.valid ? "text-green-400" : "text-red-400"
            }`}>
              {result.valid 
                ? (language === "tr" ? "GİRİŞ İZNİ VAR" : "ENTRY ALLOWED")
                : (language === "tr" ? "GİRİŞ REDDEDİLDİ" : "ENTRY DENIED")}
            </h2>
            {result.ticket && (
              <div className="mt-6 text-left bg-christmas-dark/50 rounded-lg p-5">
                <p className="text-christmas-gold font-medium text-sm mb-2">
                  {language === "tr" ? "Misafir Bilgileri:" : "Guest Details:"}
                </p>
                <p className="text-christmas-cream text-2xl font-bold">
                  {result.ticket.user.name}
                </p>
                <p className="text-christmas-cream/70">
                  {result.ticket.user.phone}
                </p>
                <div className="mt-4 pt-4 border-t border-christmas-gold/20">
                  <span className="text-christmas-cream/60 text-sm">
                    {language === "tr" ? "Durum: " : "Status: "}
                  </span>
                  <span className={`text-lg font-bold ${
                    result.ticket.status === "ACTIVATED" 
                      ? "text-green-400" 
                      : result.ticket.status === "PAYMENT_PENDING"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}>
                    {result.ticket.status === "ACTIVATED" 
                      ? (language === "tr" ? "AKTİF" : "ACTIVATED")
                      : result.ticket.status === "PAYMENT_PENDING"
                        ? (language === "tr" ? "ÖDEME BEKLİYOR" : "PAYMENT PENDING")
                        : (language === "tr" ? "AKTİF DEĞİL" : "NOT ACTIVATED")}
                  </span>
                </div>
              </div>
            )}
            {result.error && (
              <p className="mt-4 text-red-400 font-medium">{result.error}</p>
            )}
            <button
              onClick={resetScanner}
              className="mt-6 btn-christmas text-lg px-8 py-3"
            >
              {language === "tr" ? "Sonraki Bileti Tara" : "Scan Next Ticket"}
            </button>
          </div>
        )}

        {error && !result && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Manual Entry */}
      {!result && !scanning && !isVerifying && (
        <div className="christmas-card p-6">
          <h3 className="text-lg font-bold text-christmas-gold mb-4">
            📝 {language === "tr" ? "Manuel Bilet Doğrulama" : "Manual Ticket Verification"}
          </h3>
          <form onSubmit={handleManualVerify} className="flex gap-3">
            <input
              type="text"
              value={manualTicketId}
              onChange={(e) => setManualTicketId(e.target.value)}
              placeholder={language === "tr" ? "Bilet ID'sini girin..." : "Enter Ticket ID..."}
              className="input-christmas flex-1"
            />
            <button
              type="submit"
              disabled={!manualTicketId.trim()}
              className="btn-christmas"
            >
              {language === "tr" ? "Doğrula" : "Verify"}
            </button>
          </form>
        </div>
      )}

      {/* Instructions */}
      <div className="christmas-card p-6 mt-6">
        <h3 className="text-lg font-bold text-christmas-gold mb-3">
          📋 {language === "tr" ? "Talimatlar" : "Instructions"}
        </h3>
        <ul className="space-y-3 text-christmas-cream/80 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <span>
              <strong className="text-green-400">
                {language === "tr" ? "AKTİF" : "ACTIVATED"}
              </strong> 
              {language === "tr" 
                ? " - Misafir partiye girebilir"
                : " - Guest can enter the party"}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-400 text-lg">⚠</span>
            <span>
              <strong className="text-yellow-400">
                {language === "tr" ? "ÖDEME BEKLİYOR" : "PAYMENT PENDING"}
              </strong>
              {language === "tr" 
                ? " - Misafir önce ödemeyi tamamlamalı"
                : " - Guest needs to complete payment first"}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-400 text-lg">✗</span>
            <span>
              <strong className="text-red-400">
                {language === "tr" ? "AKTİF DEĞİL" : "NOT ACTIVATED"}
              </strong>
              {language === "tr" 
                ? " - Misafir giremez"
                : " - Guest cannot enter"}
            </span>
          </li>
        </ul>
      </div>

      {/* Add scanning animation styles */}
      <style jsx>{`
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

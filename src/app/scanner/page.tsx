"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

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
  const { t } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualTicketId, setManualTicketId] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.isBodyguard && !session?.user?.isAdmin) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    // Cleanup camera stream on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setResult(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanQRCode();
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera access or enter ticket ID manually.");
      console.error("Camera error:", err);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple QR code detection using the BarcodeDetector API if available
    if ("BarcodeDetector" in window) {
      // @ts-ignore - BarcodeDetector might not be in types
      const barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] });
      barcodeDetector.detect(imageData).then((barcodes: any[]) => {
        if (barcodes.length > 0) {
          const ticketId = barcodes[0].rawValue;
          stopScanning();
          verifyTicket(ticketId);
        } else if (scanning) {
          requestAnimationFrame(scanQRCode);
        }
      }).catch(() => {
        if (scanning) requestAnimationFrame(scanQRCode);
      });
    } else {
      // Fallback - just keep scanning, user can use manual entry
      if (scanning) requestAnimationFrame(scanQRCode);
    }
  };

  useEffect(() => {
    if (scanning) {
      scanQRCode();
    }
  }, [scanning]);

  const verifyTicket = async (ticketId: string) => {
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ticket/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Failed to verify ticket. Please try again.");
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
          🛡️ Ticket Scanner
        </h1>
        <p className="text-christmas-cream/70 mt-2">
          Scan QR codes to verify guest tickets
        </p>
      </div>

      {/* Scanner Section */}
      <div className="christmas-card p-6 mb-6">
        {!scanning && !result && (
          <div className="text-center">
            <button
              onClick={startScanning}
              className="btn-christmas text-lg px-8 py-4 mb-4"
            >
              📷 Start Camera Scanner
            </button>
            <p className="text-christmas-cream/60 text-sm">
              Or enter ticket ID manually below
            </p>
          </div>
        )}

        {scanning && (
          <div className="relative">
            <video 
              ref={videoRef} 
              className="w-full rounded-lg border-2 border-christmas-gold"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-christmas-gold/50 rounded-lg animate-pulse" />
            </div>
            <button
              onClick={stopScanning}
              className="mt-4 w-full py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10 transition"
            >
              Stop Scanning
            </button>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className={`p-6 rounded-lg text-center ${
            result.valid 
              ? "bg-green-900/30 border-2 border-green-500" 
              : "bg-red-900/30 border-2 border-red-500"
          }`}>
            <div className="text-6xl mb-4">
              {result.valid ? "✅" : "❌"}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${
              result.valid ? "text-green-400" : "text-red-400"
            }`}>
              {result.valid ? "ENTRY ALLOWED" : "ENTRY DENIED"}
            </h2>
            {result.ticket && (
              <div className="mt-4 text-left bg-christmas-dark/50 rounded-lg p-4">
                <p className="text-christmas-gold font-medium">Guest Details:</p>
                <p className="text-christmas-cream text-lg font-bold mt-1">
                  {result.ticket.user.name}
                </p>
                <p className="text-christmas-cream/70 text-sm">
                  {result.ticket.user.phone}
                </p>
                <p className="mt-2">
                  <span className="text-christmas-cream/60">Status: </span>
                  <span className={`font-bold ${
                    result.ticket.status === "ACTIVATED" 
                      ? "text-green-400" 
                      : result.ticket.status === "PAYMENT_PENDING"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}>
                    {result.ticket.status.replace("_", " ")}
                  </span>
                </p>
              </div>
            )}
            {result.message && (
              <p className="mt-4 text-christmas-cream/80">{result.message}</p>
            )}
            {result.error && (
              <p className="mt-4 text-red-400">{result.error}</p>
            )}
            <button
              onClick={resetScanner}
              className="mt-6 btn-christmas"
            >
              Scan Next Ticket
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-center mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Manual Entry */}
      {!result && (
        <div className="christmas-card p-6">
          <h3 className="text-lg font-bold text-christmas-gold mb-4">
            📝 Manual Ticket Verification
          </h3>
          <form onSubmit={handleManualVerify} className="flex gap-3">
            <input
              type="text"
              value={manualTicketId}
              onChange={(e) => setManualTicketId(e.target.value)}
              placeholder="Enter Ticket ID..."
              className="input-christmas flex-1"
            />
            <button
              type="submit"
              disabled={!manualTicketId.trim()}
              className="btn-christmas"
            >
              Verify
            </button>
          </form>
        </div>
      )}

      {/* Instructions */}
      <div className="christmas-card p-6 mt-6">
        <h3 className="text-lg font-bold text-christmas-gold mb-3">
          📋 Instructions
        </h3>
        <ul className="space-y-2 text-christmas-cream/80 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span><strong className="text-green-400">ACTIVATED</strong> - Guest can enter the party</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">⚠</span>
            <span><strong className="text-yellow-400">PAYMENT PENDING</strong> - Guest needs to complete payment first</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">✗</span>
            <span><strong className="text-red-400">NOT ACTIVATED</strong> - Guest cannot enter</span>
          </li>
        </ul>
      </div>
    </div>
  );
}


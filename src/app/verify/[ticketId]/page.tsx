"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface TicketData {
  valid: boolean;
  ticket?: {
    id: string;
    status: string;
    user: {
      name: string;
      phone: string;
    };
  };
  error?: string;
}

// Simple PIN for bodyguards - change this to your desired PIN
const BODYGUARD_PIN = "2025";

export default function VerifyTicketPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  
  const [pinEntered, setPinEntered] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if PIN was already entered in this session
  useEffect(() => {
    const savedPin = sessionStorage.getItem("bodyguard_verified");
    if (savedPin === "true") {
      setPinEntered(true);
    }
  }, []);

  // Verify ticket when PIN is confirmed
  useEffect(() => {
    if (pinEntered && ticketId) {
      verifyTicket();
    }
  }, [pinEntered, ticketId]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === BODYGUARD_PIN) {
      sessionStorage.setItem("bodyguard_verified", "true");
      setPinEntered(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const verifyTicket = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ticket/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      const data = await res.json();
      setTicketData(data);
    } catch (err) {
      setError("Failed to verify ticket");
    } finally {
      setLoading(false);
    }
  };

  // PIN Entry Screen
  if (!pinEntered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-christmas-dark to-black flex items-center justify-center p-4">
        <div className="christmas-card p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-2xl font-bold text-christmas-gold mb-2">
            Bodyguard Access
          </h1>
          <p className="text-christmas-cream/70 text-sm mb-6">
            Enter PIN to verify ticket
          </p>
          
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center text-3xl tracking-widest py-4 px-4 bg-christmas-dark border-2 border-christmas-gold/50 rounded-lg text-christmas-cream focus:border-christmas-gold focus:outline-none"
              autoFocus
            />
            {pinError && (
              <p className="text-red-400 text-sm mt-2">Incorrect PIN</p>
            )}
            <button
              type="submit"
              disabled={pin.length < 4}
              className="w-full mt-4 btn-christmas py-3 disabled:opacity-50"
            >
              Verify Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-christmas-dark to-black flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-christmas-cream">Verifying ticket...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-christmas-dark to-black flex items-center justify-center p-4">
        <div className="christmas-card p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1>
          <p className="text-christmas-cream/70">{error}</p>
        </div>
      </div>
    );
  }

  // Ticket Not Found
  if (ticketData && !ticketData.ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-950 to-black flex items-center justify-center p-4">
        <div className="bg-red-900/50 border-4 border-red-500 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="text-8xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-400 mb-2">
            INVALID TICKET
          </h1>
          <p className="text-red-300/70">
            This ticket does not exist
          </p>
        </div>
      </div>
    );
  }

  // Ticket Result
  if (ticketData?.ticket) {
    const isActivated = ticketData.ticket.status === "ACTIVATED";
    const isPending = ticketData.ticket.status === "PAYMENT_PENDING";
    
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isActivated 
          ? "bg-gradient-to-b from-green-950 to-black" 
          : "bg-gradient-to-b from-red-950 to-black"
      }`}>
        <div className={`rounded-2xl p-8 max-w-sm w-full text-center ${
          isActivated 
            ? "bg-green-900/50 border-4 border-green-500" 
            : "bg-red-900/50 border-4 border-red-500"
        }`}>
          {/* Big Status Icon */}
          <div className="text-9xl mb-4">
            {isActivated ? "✅" : "❌"}
          </div>
          
          {/* Status Text */}
          <h1 className={`text-4xl font-bold mb-4 ${
            isActivated ? "text-green-400" : "text-red-400"
          }`}>
            {isActivated ? "ENTRY OK" : "NO ENTRY"}
          </h1>
          
          {/* Guest Details */}
          <div className={`rounded-xl p-4 mt-4 ${
            isActivated ? "bg-green-950/50" : "bg-red-950/50"
          }`}>
            <p className="text-white text-2xl font-bold">
              {ticketData.ticket.user.name}
            </p>
            <p className="text-white/60 mt-1">
              📞 {ticketData.ticket.user.phone}
            </p>
          </div>
          
          {/* Status Badge */}
          <div className={`mt-4 inline-block px-4 py-2 rounded-full text-sm font-bold ${
            isActivated 
              ? "bg-green-500 text-white" 
              : isPending
                ? "bg-yellow-500 text-black"
                : "bg-red-500 text-white"
          }`}>
            {isActivated 
              ? "✓ ACTIVATED" 
              : isPending 
                ? "⏳ PAYMENT PENDING" 
                : "✗ NOT ACTIVATED"}
          </div>
          
          {/* Additional Message */}
          {!isActivated && (
            <p className="mt-4 text-white/70 text-sm">
              {isPending 
                ? "Guest needs to complete payment" 
                : "Ticket has not been activated"}
            </p>
          )}
          
          {/* Scan Another Button */}
          <button
            onClick={() => window.close()}
            className="mt-6 w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return null;
}


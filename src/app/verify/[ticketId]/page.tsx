"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

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

export default function VerifyTicketPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const ticketId = params.ticketId as string;
  
  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundPlayed, setSoundPlayed] = useState(false);
  
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const deniedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Check authentication
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      // Redirect to login with return URL
      router.push(`/login?callbackUrl=/verify/${ticketId}`);
    }
  }, [authStatus, router, ticketId]);

  // Verify ticket when authenticated
  useEffect(() => {
    if (authStatus === "authenticated" && session?.user && ticketId) {
      // Check if user is bodyguard or admin
      if (!session.user.isBodyguard && !session.user.isAdmin) {
        setError("Access denied. Only bodyguards can verify tickets.");
        setLoading(false);
        return;
      }
      verifyTicket();
    }
  }, [authStatus, session, ticketId]);

  // Play sound when result is received
  useEffect(() => {
    if (ticketData && !soundPlayed) {
      playResultSound(ticketData.valid);
      setSoundPlayed(true);
    }
  }, [ticketData, soundPlayed]);

  const playResultSound = (isValid: boolean) => {
    try {
      if (isValid) {
        // Success sound - pleasant chime
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6
        oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.2); // E6
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      } else {
        // Denied sound - low buzz
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (err) {
      console.log("Audio not supported");
    }
  };

  const verifyTicket = async () => {
    setLoading(true);
    setError(null);
    setSoundPlayed(false);

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

  // Loading auth state
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-christmas-dark to-black flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-christmas-cream">Checking access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-christmas-dark to-black flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-christmas-cream">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Access denied - not bodyguard
  if (error === "Access denied. Only bodyguards can verify tickets.") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-christmas-dark to-black flex items-center justify-center p-4">
        <div className="christmas-card p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-christmas-cream/70 mb-4">
            Only bodyguards can verify tickets.
          </p>
          <Link href="/dashboard" className="btn-christmas inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Loading ticket verification
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
          <button 
            onClick={() => verifyTicket()} 
            className="btn-christmas mt-4"
          >
            Try Again
          </button>
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
          
          {/* Close Button */}
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

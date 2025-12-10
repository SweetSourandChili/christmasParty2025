"use client";

import { useEffect, useState, useRef } from "react";

interface IllusionOverlayProps {
  isActive: boolean;
}

export default function IllusionOverlay({ isActive }: IllusionOverlayProps) {
  const [phase, setPhase] = useState<"hidden" | "message" | "card-reveal" | "background">("hidden");
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Clear all timers
  const clearTimers = () => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => {
    if (isActive) {
      // Clear any existing timers
      clearTimers();
      
      // Start the sequence from message phase
      setPhase("message");
      
      // After 10 seconds, show card reveal
      const cardTimer = setTimeout(() => {
        setPhase("card-reveal");
      }, 10000);
      timersRef.current.push(cardTimer);

      // After 15 seconds total, transition to background
      const bgTimer = setTimeout(() => {
        setPhase("background");
      }, 15000);
      timersRef.current.push(bgTimer);

    } else {
      // When deactivated, clear timers and hide
      clearTimers();
      setPhase("hidden");
    }

    return () => clearTimers();
  }, [isActive]);

  if (phase === "hidden") return null;

  return (
    <>
      {/* Message Phase - Full screen overlay */}
      {phase === "message" && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.99) 100%)",
            animation: "fadeIn 1s ease-out forwards",
          }}
        >
          <div className="text-center px-8 max-w-4xl">
            <div className="mb-8 opacity-80">
              <span className="text-6xl">♠️</span>
            </div>
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-6"
              style={{
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                textShadow: "0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.1)",
                letterSpacing: "0.05em",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              Reality is merely an illusion...
            </h1>
            <p
              className="text-xl md:text-2xl text-white/60 font-light tracking-wider"
              style={{
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                animation: "fadeInUp 2s ease-out forwards",
              }}
            >
              ...albeit a very persistent one
            </p>
            <div className="mt-12 flex justify-center gap-4 opacity-50">
              <span className="text-3xl animate-bounce" style={{ animationDelay: "0s" }}>♠</span>
              <span className="text-3xl animate-bounce" style={{ animationDelay: "0.2s" }}>♣</span>
              <span className="text-3xl animate-bounce" style={{ animationDelay: "0.4s" }}>♥</span>
              <span className="text-3xl animate-bounce" style={{ animationDelay: "0.6s" }}>♦</span>
            </div>
            <div className="mt-8">
              <div className="w-64 h-1 mx-auto bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/60 rounded-full"
                  style={{
                    animation: "loadingBar 10s linear forwards",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Reveal Phase - Spade 3 prominently displayed */}
      {phase === "card-reveal" && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, #0a0a1a 0%, #000005 100%)",
            animation: "fadeIn 0.5s ease-out forwards",
          }}
        >
          {/* Sparkle effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `sparkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div className="text-center" style={{ animation: "cardReveal 1.5s ease-out forwards" }}>
            {/* The Playing Card */}
            <div
              className="relative mx-auto mb-8 w-72 h-[420px] rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
              style={{
                background: "linear-gradient(145deg, #ffffff 0%, #f8f8f8 50%, #f0f0f0 100%)",
                boxShadow: "0 30px 100px rgba(0,0,0,0.8), 0 0 150px rgba(139, 92, 246, 0.4), 0 0 60px rgba(255,255,255,0.2)",
              }}
            >
              {/* Card Border */}
              <div className="absolute inset-3 border-2 border-gray-300 rounded-xl" />
              
              {/* Top Left - Number and Suit */}
              <div className="absolute top-5 left-5 text-center">
                <div 
                  className="text-4xl font-bold text-gray-900"
                  style={{ fontFamily: "'Times New Roman', serif" }}
                >
                  3
                </div>
                <div className="text-4xl text-gray-900 -mt-1">♠</div>
              </div>
              
              {/* Center Spades - Classic 3 of Spades layout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center py-16">
                {/* Top spade */}
                <div className="text-7xl text-gray-900 mb-4">♠</div>
                {/* Bottom two spades */}
                <div className="flex gap-16 mt-4">
                  <div className="text-7xl text-gray-900">♠</div>
                  <div className="text-7xl text-gray-900">♠</div>
                </div>
              </div>
              
              {/* Bottom Right - Number and Suit (rotated) */}
              <div className="absolute bottom-5 right-5 text-center rotate-180">
                <div 
                  className="text-4xl font-bold text-gray-900"
                  style={{ fontFamily: "'Times New Roman', serif" }}
                >
                  3
                </div>
                <div className="text-4xl text-gray-900 -mt-1">♠</div>
              </div>

              {/* Shine Effect */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.1) 100%)",
                }}
              />
            </div>

            {/* Text below card */}
            <p
              className="text-2xl text-white/80 font-light tracking-widest"
              style={{
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                textShadow: "0 0 20px rgba(255,255,255,0.3)",
                animation: "fadeInUp 1s ease-out 0.5s forwards",
                opacity: 0,
              }}
            >
              Three of Spades
            </p>
            <p
              className="text-lg text-white/50 mt-2 tracking-wider"
              style={{
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                animation: "fadeInUp 1s ease-out 1s forwards",
                opacity: 0,
              }}
            >
              The cards have been dealt
            </p>
          </div>
        </div>
      )}

      {/* Background Phase - Subtle Spade 3 pattern, page is usable */}
      {phase === "background" && (
        <div 
          className="fixed inset-0 z-[1] pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(10,10,26,0.95) 0%, rgba(0,0,10,0.95) 100%)",
            animation: "fadeIn 1s ease-out forwards",
          }}
        >
          {/* Floating spade pattern */}
          <div className="absolute inset-0 overflow-hidden opacity-[0.07]">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="absolute text-white"
                style={{
                  left: `${(i % 8) * 12.5}%`,
                  top: `${Math.floor(i / 8) * 20}%`,
                  fontSize: `${30 + Math.random() * 20}px`,
                  transform: `rotate(${Math.random() * 20 - 10}deg)`,
                }}
              >
                ♠
              </div>
            ))}
          </div>

          {/* Large central watermark Spade 3 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
            <div className="text-center transform scale-150">
              <div className="text-[200px] text-white leading-none" style={{ fontFamily: "'Times New Roman', serif" }}>3</div>
              <div className="text-[250px] text-white -mt-20">♠</div>
            </div>
          </div>

          {/* Subtle vignette */}
          <div 
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)",
            }}
          />
        </div>
      )}

      {/* Global Animations */}
      <style jsx global>{`
        @keyframes loadingBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes cardReveal {
          0% {
            opacity: 0;
            transform: scale(0.5) rotateY(180deg);
          }
          50% {
            transform: scale(1.1) rotateY(0deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotateY(0deg);
          }
        }
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </>
  );
}

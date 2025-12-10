"use client";

import { useEffect, useState } from "react";

interface EventReminderModalProps {
  onClose: () => void;
}

export default function EventReminderModal({ onClose }: EventReminderModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleClose = async () => {
    // Increment notification count
    try {
      await fetch("/api/user/notification", { method: "POST" });
    } catch (error) {
      console.error("Failed to update notification count:", error);
    }
    
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative christmas-card w-full max-w-md p-6 transform transition-all duration-300 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-christmas-cream/50 hover:text-christmas-cream transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="text-6xl mb-4">🎄</div>
          <h2 className="text-2xl font-bold text-christmas-gold mb-3">
            Don&apos;t Forget!
          </h2>
          <p className="text-christmas-cream/80 mb-6">
            Make sure to check the <strong className="text-christmas-gold">Events</strong> page 
            and select which events you&apos;d like to join for the party!
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10 transition"
            >
              Later
            </button>
            <a
              href="/events"
              className="flex-1 btn-christmas text-center"
              onClick={handleClose}
            >
              View Events →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


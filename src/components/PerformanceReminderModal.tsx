"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./LanguageProvider";

interface PerformanceReminderModalProps {
  onClose: () => void;
}

const STORAGE_KEY = "performanceReminderCount";
const MAX_SHOWS = 3;

export function shouldShowPerformanceReminder(): boolean {
  if (typeof window === "undefined") return false;
  const count = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  return count < MAX_SHOWS;
}

export default function PerformanceReminderModal({ onClose }: PerformanceReminderModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const incrementCount = () => {
    const count = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    localStorage.setItem(STORAGE_KEY, String(count + 1));
  };

  const setMaxCount = () => {
    localStorage.setItem(STORAGE_KEY, String(MAX_SHOWS));
  };

  const handleClose = () => {
    incrementCount();
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleViewPerformances = () => {
    setMaxCount();
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      router.push("/performances");
    }, 300);
  };

  const content = {
    en: {
      title: "🎭 We're Excited to Have You!",
      message: "We're really excited to have you as a participant! Since we're approaching the event, make sure to add or review your performance. Let's make this night unforgettable! Have fun! 🎉",
      later: "Maybe Later",
      action: "View Performances →"
    },
    tr: {
      title: "🎭 Seni Aramızda Görmekten Mutluyuz!",
      message: "Etkinliğimize katılmanızdan çok mutluyuz! Etkinlik yaklaştığına göre, performansınızı eklemeyi veya gözden geçirmeyi unutmayın. Bu geceyi unutulmaz yapalım! İyi eğlenceler! 🎉",
      later: "Sonra Bakarım",
      action: "Performansları Gör →"
    }
  };

  const t = content[language as keyof typeof content] || content.tr;

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
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-2xl font-bold text-christmas-gold mb-3">
            {t.title}
          </h2>
          <p className="text-christmas-cream/80 mb-6 leading-relaxed">
            {t.message}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10 transition"
            >
              {t.later}
            </button>
            <button
              onClick={handleViewPerformances}
              className="flex-1 btn-christmas text-center"
            >
              {t.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


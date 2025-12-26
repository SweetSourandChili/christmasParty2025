"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";

interface PlaylistReminderModalProps {
  onClose: () => void;
}

const STORAGE_KEY = "playlistReminderCount";
const MAX_SHOWS = 2;

export function shouldShowPlaylistReminder(): boolean {
  if (typeof window === "undefined") return false;
  const count = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  return count < MAX_SHOWS;
}

export default function PlaylistReminderModal({ onClose }: PlaylistReminderModalProps) {
  const [isVisible, setIsVisible] = useState(false);
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

  const handleOpenPlaylist = () => {
    setMaxCount();
    setIsVisible(false);
    // Open Spotify playlist in new tab
    window.open(
      "https://open.spotify.com/playlist/17P1aavugSwlLPWmvuXZqs?si=0a0a55f24ab84d62&pt=a1e6b75e95ed69b78f23ccfcf8a758cd",
      "_blank"
    );
    setTimeout(onClose, 300);
  };

  const content = {
    en: {
      title: "🎵 Add Your Favorite Songs!",
      message: "Help us create the perfect party atmosphere! Please add your favorite songs to our collaborative party playlist on the Dashboard. The more songs, the better the vibes! 🎶",
      later: "Remind Me Later",
      action: "Open Playlist 🎧"
    },
    tr: {
      title: "🎵 Favori Şarkılarını Ekle!",
      message: "Mükemmel parti atmosferini birlikte oluşturalım! Lütfen favori şarkılarını Panel'deki ortak parti çalma listemize ekle. Ne kadar çok şarkı, o kadar iyi ortam! 🎶",
      later: "Sonra Hatırlat",
      action: "Listeyi Aç 🎧"
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
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold text-christmas-gold mb-3">
            {t.title}
          </h2>
          <p className="text-christmas-cream/80 mb-6 leading-relaxed">
            {t.message}
          </p>
          
          {/* Spotify Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1DB954] to-[#1ed760] flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10 transition"
            >
              {t.later}
            </button>
            <button
              onClick={handleOpenPlaylist}
              className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-2 rounded-lg transition"
            >
              {t.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


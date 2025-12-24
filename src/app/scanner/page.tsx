"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

export default function ScannerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.isBodyguard && !session?.user?.isAdmin) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

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
          🛡️ {language === "tr" ? "Bilet Doğrulama" : "Ticket Verification"}
        </h1>
        <p className="text-christmas-cream/70 mt-2">
          {language === "tr" 
            ? "Misafir biletlerini doğrulamak için talimatları izleyin"
            : "Follow the instructions to verify guest tickets"}
        </p>
      </div>

      {/* Instructions Card */}
      <div className="christmas-card p-6 mb-6">
        <h2 className="text-xl font-bold text-christmas-gold mb-4">
          📱 {language === "tr" ? "QR Kodu Nasıl Taranır" : "How to Scan QR Codes"}
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-christmas-dark/50 rounded-lg">
            <span className="text-2xl">1️⃣</span>
            <div>
              <p className="text-christmas-cream font-medium">
                {language === "tr" 
                  ? "Telefonunuzun kamerasını açın"
                  : "Open your phone's camera"}
              </p>
              <p className="text-christmas-cream/60 text-sm mt-1">
                {language === "tr" 
                  ? "Normal kamera uygulamasını kullanın"
                  : "Use the default camera app"}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-christmas-dark/50 rounded-lg">
            <span className="text-2xl">2️⃣</span>
            <div>
              <p className="text-christmas-cream font-medium">
                {language === "tr" 
                  ? "QR kodu kameraya gösterin"
                  : "Point camera at QR code"}
              </p>
              <p className="text-christmas-cream/60 text-sm mt-1">
                {language === "tr" 
                  ? "Misafirin telefonundaki QR kodu tarayın"
                  : "Scan the QR code on guest's phone"}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-christmas-dark/50 rounded-lg">
            <span className="text-2xl">3️⃣</span>
            <div>
              <p className="text-christmas-cream font-medium">
                {language === "tr" 
                  ? "Açılan linke tıklayın"
                  : "Tap the link that appears"}
              </p>
              <p className="text-christmas-cream/60 text-sm mt-1">
                {language === "tr" 
                  ? "Doğrulama sayfası açılacak"
                  : "Verification page will open"}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-christmas-dark/50 rounded-lg">
            <span className="text-2xl">4️⃣</span>
            <div>
              <p className="text-christmas-cream font-medium">
                {language === "tr" 
                  ? "PIN kodunu girin"
                  : "Enter the PIN code"}
              </p>
              <p className="text-christmas-cream/60 text-sm mt-1">
                {language === "tr" 
                  ? "İlk taramada PIN girilir, sonraki taramalarda otomatik açılır"
                  : "PIN is entered once, then auto-verified for rest of session"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Guide */}
      <div className="christmas-card p-6">
        <h3 className="text-lg font-bold text-christmas-gold mb-4">
          📋 {language === "tr" ? "Bilet Durumları" : "Ticket Statuses"}
        </h3>
        <ul className="space-y-3">
          <li className="flex items-center gap-3 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-green-400 font-bold">
                {language === "tr" ? "GİRİŞ OK" : "ENTRY OK"}
              </p>
              <p className="text-green-300/70 text-sm">
                {language === "tr" 
                  ? "Misafir partiye girebilir"
                  : "Guest can enter the party"}
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
            <span className="text-3xl">⏳</span>
            <div>
              <p className="text-yellow-400 font-bold">
                {language === "tr" ? "ÖDEME BEKLİYOR" : "PAYMENT PENDING"}
              </p>
              <p className="text-yellow-300/70 text-sm">
                {language === "tr" 
                  ? "Misafir önce ödemeyi tamamlamalı"
                  : "Guest needs to complete payment first"}
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
            <span className="text-3xl">❌</span>
            <div>
              <p className="text-red-400 font-bold">
                {language === "tr" ? "GİRİŞ YOK" : "NO ENTRY"}
              </p>
              <p className="text-red-300/70 text-sm">
                {language === "tr" 
                  ? "Bilet aktif değil veya geçersiz"
                  : "Ticket not activated or invalid"}
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* PIN Reminder */}
      <div className="christmas-card p-4 mt-6 border-2 border-christmas-gold/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <p className="text-christmas-gold font-medium">
              {language === "tr" ? "Bodyguard PIN Kodu" : "Bodyguard PIN Code"}
            </p>
            <p className="text-christmas-cream/60 text-sm">
              {language === "tr" 
                ? "PIN kodu: 2025"
                : "PIN code: 2025"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

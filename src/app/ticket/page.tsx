"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TicketStatus from "@/components/TicketStatus";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { QRCodeSVG } from "qrcode.react";

interface Ticket {
  id: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    phone: string;
    registrations: {
      performance: {
        id: string;
        name: string;
        description: string | null;
      };
    }[];
    eventRegistrations: {
      event: {
        id: string;
        name: string;
        price: number;
      };
      joining: boolean;
    }[];
  };
}

export default function TicketPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTicket();
    }
  }, [session]);

  const fetchTicket = async () => {
    try {
      const res = await fetch("/api/ticket");
      const data = await res.json();
      setTicket(data);
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="spinner" />
      </div>
    );
  }

  if (!session || !ticket) {
    return null;
  }

  const joiningEvents =
    ticket.user?.eventRegistrations?.filter((reg) => reg.joining) || [];

  // Calculate total price for joined events
  const totalPrice = joiningEvents.reduce((total, reg) => {
    return total + (reg.event.price > 0 ? reg.event.price : 0);
  }, 0);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-christmas-gold text-center mb-8">
        🎫 {t("ticketTitle")}
      </h1>

      {/* Ticket Card */}
      <div className="christmas-card overflow-hidden">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-christmas-red to-christmas-green p-6 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-christmas-gold" />
          <h2 className="text-2xl font-bold text-white mb-1">
            🎄 KIKI Christmas Event 2025 🎄
          </h2>
          <p className="text-white/80 text-sm">
            {language === "tr" ? "31 Aralık 2025 • Saat 18:00" : "December 31, 2025 • 6:00 PM"}
          </p>
        </div>

        {/* Ticket Body */}
        <div className="p-6">
          {/* Guest Info */}
          <div className="border-b border-christmas-gold/30 pb-4 mb-4">
            <p className="text-sm text-christmas-gold mb-1">{t("guest")}</p>
            <p className="text-2xl font-bold text-christmas-cream">
              {ticket.user?.name || session.user.name}
            </p>
            <p className="text-christmas-cream/60 text-sm">
              {ticket.user?.phone || session.user.phone}
            </p>
          </div>

          {/* Ticket Status */}
          <div className="border-b border-christmas-gold/30 pb-4 mb-4">
            <p className="text-sm text-christmas-gold mb-2">{t("ticketStatus")}</p>
            <TicketStatus status={ticket.status} showMessage />
          </div>

          {/* Performances */}
          <div className="border-b border-christmas-gold/30 pb-4 mb-4">
            <p className="text-sm text-christmas-gold mb-2">{t("myPerformancesTicket")}</p>
            {ticket.user?.registrations?.length > 0 ? (
              <ul className="space-y-2">
                {ticket.user.registrations.map((reg) => (
                  <li
                    key={reg.performance.id}
                    className="flex items-center gap-2"
                  >
                    <span className="text-christmas-gold">🎭</span>
                    <span className="text-christmas-cream">
                      {reg.performance.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-christmas-cream/60 text-sm">
                {t("noPerformancesRegistered")}{" "}
                <Link
                  href="/performances"
                  className="text-christmas-gold hover:underline"
                >
                  {t("registerNow")}
                </Link>
              </p>
            )}
          </div>

          {/* Events */}
          <div className="border-b border-christmas-gold/30 pb-4 mb-4">
            <p className="text-sm text-christmas-gold mb-2">{t("eventsJoining")}</p>
            {joiningEvents.length > 0 ? (
              <ul className="space-y-2">
                {joiningEvents.map((reg) => (
                  <li
                    key={reg.event.id}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-christmas-gold">🎉</span>
                      <span className="text-christmas-cream">
                        {reg.event.name}
                      </span>
                    </span>
                    <span className={`text-sm ${reg.event.price > 0 ? 'text-christmas-gold font-medium' : 'text-christmas-cream/50'}`}>
                      {reg.event.price > 0 ? `${reg.event.price.toLocaleString()} ₺` : t("tba")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-christmas-cream/60 text-sm">
                {t("noEventsSelected")}{" "}
                <Link
                  href="/events"
                  className="text-christmas-gold hover:underline"
                >
                  {t("browseEvents")}
                </Link>
              </p>
            )}
          </div>

          {/* Estimated Price */}
          <div className="bg-christmas-gold/10 border border-christmas-gold/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-christmas-cream font-medium">
                {t("estimatedTotal")}
              </span>
              <span className="text-christmas-gold font-bold text-lg">
                {totalPrice > 0 ? `${totalPrice.toLocaleString()} ₺` : t("tba")}
              </span>
            </div>
            <p className="text-christmas-cream/50 text-xs mt-2">
              {t("finalPriceNote")}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="bg-christmas-dark/50 rounded-lg p-6 text-center">
            <p className="text-sm text-christmas-gold mb-4 font-medium">
              {language === "tr" ? "Giriş için QR Kodunuz" : "Your Entry QR Code"}
            </p>
            <button 
              onClick={() => setShowQRModal(true)}
              className="inline-block bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            >
              <QRCodeSVG 
                value={ticket.id} 
                size={180}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#1a1a2e"
              />
            </button>
            <p className="text-christmas-gold text-sm mt-4 font-medium">
              👆 {language === "tr" ? "Büyütmek için tıkla" : "Tap to enlarge"}
            </p>
            <p className="text-xs text-christmas-cream/50 mt-3">{t("ticketId")}</p>
            <p className="font-mono text-christmas-gold text-xs mt-1">{ticket.id}</p>
            <p className="text-christmas-cream/40 text-xs mt-3">
              {language === "tr" 
                ? "Parti girişinde bu QR kodu gösterin" 
                : "Show this QR code at party entrance"}
            </p>
          </div>
        </div>

        {/* Decorative Footer */}
        <div className="bg-christmas-gold h-3" />
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {language === "tr" ? "🎫 Giriş QR Kodu" : "🎫 Entry QR Code"}
              </h3>
              <div className="flex justify-center">
                <QRCodeSVG 
                  value={ticket.id} 
                  size={280}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#1a1a2e"
                />
              </div>
              <p className="text-gray-600 font-medium mt-4">
                {ticket.user?.name || session.user.name}
              </p>
              <p className="text-gray-400 text-sm mt-1 font-mono">
                {ticket.id}
              </p>
              <button
                onClick={() => setShowQRModal(false)}
                className="mt-6 w-full py-3 bg-christmas-green text-white font-bold rounded-lg hover:bg-green-700 transition"
              >
                {language === "tr" ? "Kapat" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Info */}
      {ticket.status === "PAYMENT_PENDING" && (
        <div className="christmas-card p-6 mt-6">
          <h3 className="text-xl font-bold text-christmas-gold mb-4">
            💳 {t("paymentInstructions")}
          </h3>
          <p className="text-christmas-cream/80 mb-4">
            {t("paymentPendingDesc")}
          </p>
          <div className="bg-christmas-dark/50 rounded-lg p-4">
            <p className="text-christmas-gold font-medium mb-1">{t("estimatedAmount")}</p>
            <p className="text-2xl font-bold text-christmas-cream">
              {totalPrice > 0 ? `${totalPrice.toLocaleString()} ₺` : t("tba")}
            </p>
          </div>
          <p className="text-sm text-christmas-cream/60 mt-4">
            {t("paymentConfirmNote")}
          </p>
        </div>
      )}
    </div>
  );
}

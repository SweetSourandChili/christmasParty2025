"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Countdown from "@/components/Countdown";
import TicketStatus from "@/components/TicketStatus";
import EventReminderModal from "@/components/EventReminderModal";
import PerformanceReminderModal, { shouldShowPerformanceReminder } from "@/components/PerformanceReminderModal";
import PlaylistReminderModal, { shouldShowPlaylistReminder } from "@/components/PlaylistReminderModal";
import FeedbackForm from "@/components/FeedbackForm";
import { useLanguage } from "@/components/LanguageProvider";
import { logAction } from "@/lib/logger";

interface Ticket {
  id: string;
  status: string;
  user: {
    registrations: {
      performance: {
        id: string;
        name: string;
      };
    }[];
    eventRegistrations: {
      event: {
        id: string;
        name: string;
      };
      joining: boolean;
    }[];
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPerformanceReminder, setShowPerformanceReminder] = useState(false);
  const [showPlaylistReminder, setShowPlaylistReminder] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTicket();
      checkNotificationCount();
      logAction("VIEW_DASHBOARD", "Viewed dashboard page");
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

  const checkNotificationCount = async () => {
    try {
      const res = await fetch("/api/user/notification");
      const data = await res.json();
      // Show event reminder modal only if user has seen it less than 3 times
      if (data.notificationCount < 3) {
        // Delay showing modal for better UX
        setTimeout(() => setShowReminderModal(true), 1500);
      }
      
      // Check for performance reminder (uses localStorage)
      if (shouldShowPerformanceReminder()) {
        setTimeout(() => setShowPerformanceReminder(true), 3000);
      }
      
      // Check for playlist reminder (uses localStorage)
      if (shouldShowPlaylistReminder()) {
        setTimeout(() => setShowPlaylistReminder(true), 5000);
      }
    } catch (error) {
      console.error("Failed to check notification count:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Event Reminder Modal */}
      {showReminderModal && (
        <EventReminderModal onClose={() => setShowReminderModal(false)} />
      )}
      
      {/* Performance Reminder Modal */}
      {showPerformanceReminder && !showReminderModal && (
        <PerformanceReminderModal onClose={() => setShowPerformanceReminder(false)} />
      )}
      
      {/* Playlist Reminder Modal */}
      {showPlaylistReminder && !showReminderModal && !showPerformanceReminder && (
        <PlaylistReminderModal onClose={() => setShowPlaylistReminder(false)} />
      )}

      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-christmas-gold mb-4">
          🎄 {t("welcomeUser")}, {session.user.name}! 🎄
        </h1>
        <p className="text-xl text-christmas-cream/80">
          {t("getReady")}
        </p>
      </div>

      {/* Countdown */}
      <div className="christmas-card p-8 mb-8">
        <Countdown />
      </div>

      {/* Ticket Status Alert */}
      {ticket && ticket.status === "NOT_ACTIVATED" && (
        <div className="christmas-card-red p-6 mb-8">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="text-xl font-bold text-christmas-gold mb-2">
                {t("ticketNotActivated")}
              </h3>
              <p className="text-christmas-cream/80 mb-4">
                {t("ticketNotActivatedDesc")}
              </p>
              <Link href="/performances" className="btn-christmas inline-block">
                {t("viewPerformances")}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* My Ticket Card */}
        <div className="christmas-card p-6">
          <h2 className="text-2xl font-bold text-christmas-gold mb-4 flex items-center gap-2">
            🎫 {t("myTicketCard")}
          </h2>
          {ticket && (
            <div>
              <TicketStatus status={ticket.status} showMessage />
              <Link
                href="/ticket"
                className="btn-christmas-green inline-block mt-4"
              >
                {t("viewFullTicket")}
              </Link>
            </div>
          )}
        </div>

        {/* My Performances Card */}
        <div className="christmas-card p-6">
          <h2 className="text-2xl font-bold text-christmas-gold mb-4 flex items-center gap-2">
            🎭 {t("myPerformances")}
          </h2>
          {ticket?.user?.registrations?.length ? (
            <ul className="space-y-2 mb-4">
              {ticket.user.registrations.map((reg) => (
                <li
                  key={reg.performance.id}
                  className="flex items-center gap-2 text-christmas-cream"
                >
                  <span>🎪</span>
                  {reg.performance.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-christmas-cream/70 mb-4">
              {t("noPerformances")}
            </p>
          )}
          <Link
            href="/performances"
            className="btn-christmas-green inline-block"
          >
            {t("browsePerformances")}
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="christmas-card p-6 mb-8">
        <h2 className="text-2xl font-bold text-christmas-gold mb-6 text-center">
          🌟 {t("quickActions")}
        </h2>
        <div className="grid sm:grid-cols-4 gap-4">
          <Link
            href="/performances"
            className="christmas-card p-4 text-center hover:border-christmas-gold transition group"
          >
            <span className="text-4xl block mb-2 group-hover:scale-110 transition">
              🎭
            </span>
            <span className="text-christmas-gold font-medium">{t("performances")}</span>
            <p className="text-sm text-christmas-cream/60 mt-1">
              {t("createOrJoin")}
            </p>
          </Link>

          <Link
            href="/events"
            className="christmas-card p-4 text-center hover:border-christmas-gold transition group"
          >
            <span className="text-4xl block mb-2 group-hover:scale-110 transition">
              🎉
            </span>
            <span className="text-christmas-gold font-medium">{t("events")}</span>
            <p className="text-sm text-christmas-cream/60 mt-1">
              {t("chooseEvents")}
            </p>
          </Link>

          <Link
            href="/tasks"
            className="christmas-card p-4 text-center hover:border-christmas-gold transition group"
          >
            <span className="text-4xl block mb-2 group-hover:scale-110 transition">
              📋
            </span>
            <span className="text-christmas-gold font-medium">{t("contributions")}</span>
            <p className="text-sm text-christmas-cream/60 mt-1">
              {t("whatCanYouBring")}
            </p>
          </Link>

          <Link
            href="/ticket"
            className="christmas-card p-4 text-center hover:border-christmas-gold transition group"
          >
            <span className="text-4xl block mb-2 group-hover:scale-110 transition">
              🎫
            </span>
            <span className="text-christmas-gold font-medium">{t("myTicket")}</span>
            <p className="text-sm text-christmas-cream/60 mt-1">
              {t("viewDetails")}
            </p>
          </Link>
        </div>
      </div>

      {/* Party Playlist Section */}
      <div className="christmas-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-christmas-gold mb-2 flex items-center justify-center sm:justify-start gap-2">
              🎵 {t("partyPlaylist")}
            </h2>
            <p className="text-christmas-cream/80 mb-4">
              {t("playlistDesc")}
            </p>
            <a
              href="https://open.spotify.com/playlist/17P1aavugSwlLPWmvuXZqs?si=0a0a55f24ab84d62&pt=a1e6b75e95ed69b78f23ccfcf8a758cd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-full transition-all hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              {t("addMusicSpotify")}
            </a>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      <FeedbackForm />
    </div>
  );
}

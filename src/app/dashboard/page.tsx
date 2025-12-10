"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Countdown from "@/components/Countdown";
import TicketStatus from "@/components/TicketStatus";
import EventReminderModal from "@/components/EventReminderModal";
import FeedbackForm from "@/components/FeedbackForm";

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
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTicket();
      checkNotificationCount();
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
      // Show modal only if user has seen it less than 2 times
      if (data.notificationCount < 2) {
        // Delay showing modal for better UX
        setTimeout(() => setShowReminderModal(true), 1500);
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

      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-christmas-gold mb-4">
          🎄 Welcome, {session.user.name}! 🎄
        </h1>
        <p className="text-xl text-christmas-cream/80">
          Get ready for the KIKI Christmas Event!
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
                Your Ticket is Not Activated
              </h3>
              <p className="text-christmas-cream/80 mb-4">
                To activate your ticket and join the party, you need to create
                or register for a performance. Once registered, complete the
                payment to fully activate your ticket.
              </p>
              <Link href="/performances" className="btn-christmas inline-block">
                View Performances →
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
            🎫 My Ticket
          </h2>
          {ticket && (
            <div>
              <TicketStatus status={ticket.status} showMessage />
              <Link
                href="/ticket"
                className="btn-christmas-green inline-block mt-4"
              >
                View Full Ticket →
              </Link>
            </div>
          )}
        </div>

        {/* My Performances Card */}
        <div className="christmas-card p-6">
          <h2 className="text-2xl font-bold text-christmas-gold mb-4 flex items-center gap-2">
            🎭 My Performances
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
              You haven&apos;t registered for any performances yet.
            </p>
          )}
          <Link
            href="/performances"
            className="btn-christmas-green inline-block"
          >
            Browse Performances →
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="christmas-card p-6 mb-8">
        <h2 className="text-2xl font-bold text-christmas-gold mb-6 text-center">
          🌟 Quick Actions
        </h2>
        <div className="grid sm:grid-cols-4 gap-4">
          <Link
            href="/performances"
            className="christmas-card p-4 text-center hover:border-christmas-gold transition group"
          >
            <span className="text-4xl block mb-2 group-hover:scale-110 transition">
              🎭
            </span>
            <span className="text-christmas-gold font-medium">Performances</span>
            <p className="text-sm text-christmas-cream/60 mt-1">
              Create or join
            </p>
          </Link>

          <Link
            href="/events"
            className="christmas-card p-4 text-center hover:border-christmas-gold transition group"
          >
            <span className="text-4xl block mb-2 group-hover:scale-110 transition">
              🎉
            </span>
            <span className="text-christmas-gold font-medium">Events</span>
            <p className="text-sm text-christmas-cream/60 mt-1">
              Choose events
            </p>
          </Link>

          <Link
            href="/tasks"
            className="christmas-card p-4 text-center hover:border-christmas-gold transition group"
          >
            <span className="text-4xl block mb-2 group-hover:scale-110 transition">
              📋
            </span>
            <span className="text-christmas-gold font-medium">Contributions</span>
            <p className="text-sm text-christmas-cream/60 mt-1">
              What can you bring?
            </p>
          </Link>

          <Link
            href="/ticket"
            className="christmas-card p-4 text-center hover:border-christmas-gold transition group"
          >
            <span className="text-4xl block mb-2 group-hover:scale-110 transition">
              🎫
            </span>
            <span className="text-christmas-gold font-medium">My Ticket</span>
            <p className="text-sm text-christmas-cream/60 mt-1">
              View details
            </p>
          </Link>
        </div>
      </div>

      {/* Feedback Form */}
      <FeedbackForm />
    </div>
  );
}

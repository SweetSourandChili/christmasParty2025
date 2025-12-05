"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TicketStatus from "@/components/TicketStatus";
import Link from "next/link";

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
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-christmas-gold text-center mb-8">
        🎫 My Ticket
      </h1>

      {/* Ticket Card */}
      <div className="christmas-card overflow-hidden">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-christmas-red to-christmas-green p-6 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-christmas-gold" />
          <h2 className="text-2xl font-bold text-white mb-1">
            🎄 KIKI Christmas Event 2025 🎄
          </h2>
          <p className="text-white/80 text-sm">December 31, 2025 • 6:00 PM</p>
        </div>

        {/* Ticket Body */}
        <div className="p-6">
          {/* Guest Info */}
          <div className="border-b border-christmas-gold/30 pb-4 mb-4">
            <p className="text-sm text-christmas-gold mb-1">GUEST</p>
            <p className="text-2xl font-bold text-christmas-cream">
              {ticket.user?.name || session.user.name}
            </p>
            <p className="text-christmas-cream/60 text-sm">
              {ticket.user?.phone || session.user.phone}
            </p>
          </div>

          {/* Ticket Status */}
          <div className="border-b border-christmas-gold/30 pb-4 mb-4">
            <p className="text-sm text-christmas-gold mb-2">TICKET STATUS</p>
            <TicketStatus status={ticket.status} showMessage />
          </div>

          {/* Performances */}
          <div className="border-b border-christmas-gold/30 pb-4 mb-4">
            <p className="text-sm text-christmas-gold mb-2">MY PERFORMANCES</p>
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
                No performances registered yet.{" "}
                <Link
                  href="/performances"
                  className="text-christmas-gold hover:underline"
                >
                  Register now →
                </Link>
              </p>
            )}
          </div>

          {/* Events */}
          <div className="border-b border-christmas-gold/30 pb-4 mb-4">
            <p className="text-sm text-christmas-gold mb-2">EVENTS JOINING</p>
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
                    <span className="text-christmas-cream/50 text-sm">
                      TBA
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-christmas-cream/60 text-sm">
                No events selected yet.{" "}
                <Link
                  href="/events"
                  className="text-christmas-gold hover:underline"
                >
                  Browse events →
                </Link>
              </p>
            )}
          </div>

          {/* Estimated Price */}
          <div className="bg-christmas-gold/10 border border-christmas-gold/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-christmas-cream font-medium">
                Estimated Total
              </span>
              <span className="text-christmas-gold font-bold text-lg">
                800 - 1,100 ₺
              </span>
            </div>
            <p className="text-christmas-cream/50 text-xs mt-2">
              Final price will be announced soon. This is an approximate range.
            </p>
          </div>

          {/* Ticket ID */}
          <div className="bg-christmas-dark/50 rounded-lg p-4 text-center">
            <p className="text-xs text-christmas-cream/50 mb-1">TICKET ID</p>
            <p className="font-mono text-christmas-gold text-sm">{ticket.id}</p>
          </div>
        </div>

        {/* Decorative Footer */}
        <div className="bg-christmas-gold h-3" />
      </div>

      {/* Payment Info */}
      {ticket.status === "PAYMENT_PENDING" && (
        <div className="christmas-card p-6 mt-6">
          <h3 className="text-xl font-bold text-christmas-gold mb-4">
            💳 Payment Instructions
          </h3>
          <p className="text-christmas-cream/80 mb-4">
            Your ticket is pending payment. Please complete the payment to
            activate your ticket. Contact the admin for payment details.
          </p>
          <div className="bg-christmas-dark/50 rounded-lg p-4">
            <p className="text-christmas-gold font-medium mb-1">Estimated Amount</p>
            <p className="text-2xl font-bold text-christmas-cream">800 - 1,100 ₺</p>
          </div>
          <p className="text-sm text-christmas-cream/60 mt-4">
            Once payment is confirmed, your ticket status will be updated to
            &quot;Activated&quot;.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

interface Event {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isLocked: boolean;
  autoJoin: boolean;
  registrations: {
    user: {
      id: string;
      name: string;
    };
    joining: boolean;
  }[];
}

const eventIcons: Record<string, string> = {
  "Base Expenses": "🛒",
  "Performance": "🎭",
  "Group Alcohol": "🍷",
};

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchEvents();
    }
  }, [session]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (eventId: string, joining: boolean) => {
    setActionLoading(eventId);

    try {
      const res = await fetch(`/api/events/${eventId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joining }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchEvents();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getMyRegistration = (event: Event) => {
    return event.registrations.find((reg) => reg.user.id === session?.user?.id);
  };

  const getJoiningCount = (event: Event) => {
    return event.registrations.filter((reg) => reg.joining).length;
  };

  const getEventIcon = (eventName: string) => {
    return eventIcons[eventName] || "🎉";
  };

  // Calculate total price for events user is joining
  // Performance is mandatory for everyone, so always include its price
  const calculateTotal = () => {
    return events.reduce((total, event) => {
      const myRegistration = getMyRegistration(event);
      const isJoining = myRegistration?.joining || event.autoJoin;
      
      // Performance event is mandatory for everyone
      if (event.name === "Performance" && event.price > 0) {
        return total + event.price;
      }
      
      if (isJoining && event.price > 0) {
        return total + event.price;
      }
      return total;
    }, 0);
  };

  const totalPrice = calculateTotal();

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-christmas-gold">
          🎉 {t("eventsTitle")}
        </h1>
        <p className="text-christmas-cream/70 mt-1">
          {t("eventsDesc")}
        </p>
      </div>

      {/* Total Estimate Box */}
      <div className="christmas-card p-5 mb-8 bg-gradient-to-r from-christmas-green/20 to-christmas-red/20">
        <div className="flex items-center gap-4">
          <span className="text-4xl">💰</span>
          <div>
            <h3 className="text-lg font-bold text-christmas-gold">
              {t("estimatedTotalCost")}
            </h3>
            <p className="text-christmas-cream text-xl font-semibold">
              {totalPrice > 0 ? (
                <span className="text-christmas-gold">{totalPrice.toLocaleString()} ₺</span>
              ) : (
                <span className="text-christmas-cream/60">{t("tba")}</span>
              )}
            </p>
            <p className="text-christmas-cream/60 text-sm mt-1">
              {t("finalPricesAnnounced")}
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="christmas-card p-4 mb-8 flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div className="text-sm text-christmas-cream/80">
          <p>
            {t("eventInfoDesc")}
          </p>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="christmas-card p-12 text-center">
          <span className="text-6xl block mb-4">🎊</span>
          <h2 className="text-2xl font-bold text-christmas-gold mb-2">
            {t("eventsComingSoon")}
          </h2>
          <p className="text-christmas-cream/70">
            {t("eventsComingSoonDesc")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const myRegistration = getMyRegistration(event);
              const joiningCount = getJoiningCount(event);
              const isLocked = event.isLocked;

              return (
                <div key={event.id} className={`christmas-card overflow-hidden ${isLocked ? 'border-christmas-gold/50' : ''}`}>
                  {/* Event Image/Icon Header */}
                  <div className="bg-gradient-to-br from-christmas-red/50 to-christmas-green/50 p-8 text-center relative">
                    <span className="text-6xl">{getEventIcon(event.name)}</span>
                    {isLocked && (
                      <div className="absolute top-2 right-2 bg-christmas-gold/90 text-christmas-dark px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        🔒 {t("required")}
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-christmas-gold">
                        {event.name}
                      </h3>
                      <span className="bg-christmas-gold/20 text-christmas-gold px-2 py-1 rounded text-xs font-medium">
                        {event.price > 0 ? `${event.price.toLocaleString()} ₺` : t("tba")}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-christmas-cream/70 text-sm mb-4">
                        {event.description}
                      </p>
                    )}

                    <div className="text-xs text-christmas-cream/50 mb-4">
                      {joiningCount} {joiningCount === 1 ? t("personJoining") : t("peopleJoining")}
                    </div>

                    {/* Action Buttons or Locked Status */}
                    {isLocked ? (
                      <div className="bg-christmas-gold/10 border border-christmas-gold/30 rounded-lg p-3 text-center">
                        {myRegistration?.joining || event.autoJoin ? (
                          <p className="text-green-400 font-medium flex items-center justify-center gap-2">
                            <span>✓</span> {t("youAreRegistered")}
                          </p>
                        ) : (
                          <p className="text-christmas-cream/70 text-sm">
                            {t("registrationManagedByAdmin")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoin(event.id, true)}
                          disabled={actionLoading === event.id}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                            myRegistration?.joining
                              ? "bg-green-600 text-white"
                              : "bg-christmas-green/30 text-christmas-cream hover:bg-christmas-green/50"
                          }`}
                        >
                          {myRegistration?.joining ? `✓ ${t("joining")}` : t("join")}
                        </button>
                        <button
                          onClick={() => handleJoin(event.id, false)}
                          disabled={actionLoading === event.id}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                            myRegistration && !myRegistration.joining
                              ? "bg-red-600/80 text-white"
                              : "bg-red-900/30 text-christmas-cream/70 hover:bg-red-900/50"
                          }`}
                        >
                          {myRegistration && !myRegistration.joining
                            ? `✓ ${t("notJoining")}`
                            : t("notJoining")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* More Events Coming Soon */}
          <div className="mt-8 christmas-card p-6 text-center border-dashed border-2 border-christmas-gold/30">
            <span className="text-4xl block mb-3">🎊</span>
            <h3 className="text-xl font-bold text-christmas-gold mb-2">
              {t("moreEventsSoon")}
            </h3>
            <p className="text-christmas-cream/60 text-sm">
              {t("moreEventsSoonDesc")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

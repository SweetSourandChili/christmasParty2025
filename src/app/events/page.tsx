"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  registrations: {
    user: {
      id: string;
      name: string;
    };
    joining: boolean;
  }[];
}

const defaultEvents = [
  {
    icon: "🍸",
    defaultName: "Cocktail Hour",
    defaultDescription:
      "Enjoy festive cocktails and mocktails while mingling with fellow guests.",
  },
  {
    icon: "🎄",
    defaultName: "Christmas Market",
    defaultDescription:
      "Browse handmade gifts, decorations, and delicious treats at our mini market.",
  },
  {
    icon: "🍽️",
    defaultName: "Dinner Feast",
    defaultDescription:
      "A magnificent Christmas dinner with traditional and modern dishes.",
  },
];

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
    const match = defaultEvents.find((e) =>
      eventName.toLowerCase().includes(e.defaultName.toLowerCase().split(" ")[0])
    );
    return match?.icon || "🎉";
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-christmas-gold">
          🎉 Party Events
        </h1>
        <p className="text-christmas-cream/70 mt-1">
          Select which events you&apos;d like to join
        </p>
      </div>

      {/* Info Box */}
      <div className="christmas-card p-4 mb-8 flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div className="text-sm text-christmas-cream/80">
          <p>
            Let us know which events you&apos;re interested in attending. Some
            events may have additional costs. Your response helps us plan better!
          </p>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="christmas-card p-12 text-center">
          <span className="text-6xl block mb-4">🎊</span>
          <h2 className="text-2xl font-bold text-christmas-gold mb-2">
            Events Coming Soon!
          </h2>
          <p className="text-christmas-cream/70">
            The admin is setting up exciting events for the party. Check back
            later!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const myRegistration = getMyRegistration(event);
            const joiningCount = getJoiningCount(event);

            return (
              <div key={event.id} className="christmas-card overflow-hidden">
                {/* Event Image/Icon Header */}
                <div className="bg-gradient-to-br from-christmas-red/50 to-christmas-green/50 p-8 text-center">
                  <span className="text-6xl">{getEventIcon(event.name)}</span>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-christmas-gold">
                      {event.name}
                    </h3>
                    {event.price > 0 && (
                      <span className="bg-christmas-gold text-christmas-dark px-2 py-1 rounded text-sm font-bold">
                        ${event.price}
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-christmas-cream/70 text-sm mb-4">
                      {event.description}
                    </p>
                  )}

                  <div className="text-xs text-christmas-cream/50 mb-4">
                    {joiningCount} {joiningCount === 1 ? "person" : "people"}{" "}
                    joining
                  </div>

                  {/* Action Buttons */}
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
                      {myRegistration?.joining ? "✓ Joining" : "Join"}
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
                        ? "✓ Not Joining"
                        : "Not Joining"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


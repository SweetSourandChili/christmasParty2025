"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  createdAt: string;
  ticket: {
    id: string;
    status: string;
  } | null;
  registrations: {
    performance: {
      id: string;
      name: string;
    };
  }[];
  performances: {
    id: string;
    name: string;
  }[];
  eventRegistrations: {
    event: {
      id: string;
      name: string;
      price: number;
    };
    joining: boolean;
  }[];
}

interface Stats {
  totalUsers: number;
  totalPerformances: number;
  totalEvents: number;
  tickets: {
    activated: number;
    pending: number;
    notActivated: number;
  };
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "events" | "stats">(
    "users"
  );
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    price: 0,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes, eventsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
        fetch("/api/events"),
      ]);

      const [usersData, statsData, eventsData] = await Promise.all([
        usersRes.json(),
        statsRes.json(),
        eventsRes.json(),
      ]);

      setUsers(usersData);
      setStats(statsData);
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (userId: string, newStatus: string) => {
    setActionLoading(userId);

    try {
      const res = await fetch(`/api/admin/tickets/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("create-event");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setShowCreateEvent(false);
      setNewEvent({ name: "", description: "", price: 0 });
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setActionLoading(eventId);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVATED":
        return "badge-activated";
      case "PAYMENT_PENDING":
        return "badge-pending";
      default:
        return "badge-not-activated";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="spinner" />
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-christmas-gold">
          👑 Admin Panel
        </h1>
        <p className="text-christmas-cream/70 mt-1">
          Manage users, events, and ticket approvals
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="christmas-card p-4 text-center">
            <p className="text-3xl font-bold text-christmas-gold">
              {stats.totalUsers}
            </p>
            <p className="text-sm text-christmas-cream/70">Total Users</p>
          </div>
          <div className="christmas-card p-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {stats.tickets.activated}
            </p>
            <p className="text-sm text-christmas-cream/70">Activated</p>
          </div>
          <div className="christmas-card p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">
              {stats.tickets.pending}
            </p>
            <p className="text-sm text-christmas-cream/70">Pending</p>
          </div>
          <div className="christmas-card p-4 text-center">
            <p className="text-3xl font-bold text-red-400">
              {stats.tickets.notActivated}
            </p>
            <p className="text-sm text-christmas-cream/70">Not Activated</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-christmas-gold/30 pb-2">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-t-lg transition ${
            activeTab === "users"
              ? "bg-christmas-gold text-christmas-dark font-medium"
              : "text-christmas-cream/70 hover:text-christmas-gold"
          }`}
        >
          👥 Users & Tickets
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded-t-lg transition ${
            activeTab === "events"
              ? "bg-christmas-gold text-christmas-dark font-medium"
              : "text-christmas-cream/70 hover:text-christmas-gold"
          }`}
        >
          🎉 Events
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="christmas-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="christmas-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Performances</th>
                  <th>Ticket Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {user.isAdmin && <span title="Admin">👑</span>}
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="text-christmas-cream/70">{user.phone}</td>
                    <td>
                      {user.registrations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.registrations.map((reg) => (
                            <span
                              key={reg.performance.id}
                              className="bg-christmas-green/30 text-christmas-cream px-2 py-0.5 rounded text-xs"
                            >
                              {reg.performance.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-christmas-cream/50 text-sm">
                          None
                        </span>
                      )}
                    </td>
                    <td>
                      {user.ticket ? (
                        <span
                          className={`badge ${getStatusBadgeClass(
                            user.ticket.status
                          )}`}
                        >
                          {user.ticket.status.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-christmas-cream/50 text-sm">
                          No ticket
                        </span>
                      )}
                    </td>
                    <td>
                      {user.ticket && !user.isAdmin && (
                        <select
                          value={user.ticket.status}
                          onChange={(e) =>
                            handleUpdateTicketStatus(user.id, e.target.value)
                          }
                          disabled={actionLoading === user.id}
                          className="input-christmas text-sm py-1 px-2"
                        >
                          <option value="NOT_ACTIVATED">Not Activated</option>
                          <option value="PAYMENT_PENDING">Payment Pending</option>
                          <option value="ACTIVATED">Activated ✓</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowCreateEvent(true)}
              className="btn-christmas"
            >
              ➕ Create Event
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <div key={event.id} className="christmas-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-christmas-gold">{event.name}</h3>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    disabled={actionLoading === event.id}
                    className="text-red-400 hover:text-red-300"
                  >
                    🗑️
                  </button>
                </div>
                {event.description && (
                  <p className="text-sm text-christmas-cream/70 mb-2">
                    {event.description}
                  </p>
                )}
                <p className="text-christmas-gold font-medium">
                  ${event.price}
                </p>
              </div>
            ))}
          </div>

          {/* Create Event Modal */}
          {showCreateEvent && (
            <div
              className="modal-overlay"
              onClick={() => setShowCreateEvent(false)}
            >
              <div
                className="christmas-card w-full max-w-md p-6 m-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-christmas-gold mb-6">
                  ➕ Create Event
                </h2>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-christmas-gold mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      value={newEvent.name}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, name: e.target.value })
                      }
                      placeholder="e.g., Cocktail Hour"
                      className="input-christmas w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-christmas-gold mb-2">
                      Description
                    </label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, description: e.target.value })
                      }
                      placeholder="Describe the event..."
                      className="input-christmas w-full h-24 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-christmas-gold mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={newEvent.price}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                      className="input-christmas w-full"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateEvent(false)}
                      className="flex-1 py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading === "create-event"}
                      className="btn-christmas flex-1"
                    >
                      {actionLoading === "create-event"
                        ? "Creating..."
                        : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


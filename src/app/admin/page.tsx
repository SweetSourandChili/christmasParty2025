"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  isBodyguard: boolean;
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
  isLocked: boolean;
  autoJoin: boolean;
  registrations: {
    user: { id: string; name: string };
    joining: boolean;
  }[];
}

interface Feedback {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface AppSettings {
  votingEnabled: boolean;
  illusionMode: boolean;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "events" | "feedback" | "settings">("users");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showUserEventModal, setShowUserEventModal] = useState<{ event: Event } | null>(null);
  const [showLogsModal, setShowLogsModal] = useState<{ userId: string; userName: string } | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    price: 0,
    isLocked: false,
    autoJoin: false,
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
      const [usersRes, statsRes, eventsRes, feedbacksRes, settingsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
        fetch("/api/events"),
        fetch("/api/feedback"),
        fetch("/api/admin/settings"),
      ]);

      const [usersData, statsData, eventsData, feedbacksData, settingsData] = await Promise.all([
        usersRes.json(),
        statsRes.json(),
        eventsRes.json(),
        feedbacksRes.ok ? feedbacksRes.json() : [],
        settingsRes.ok ? settingsRes.json() : { votingEnabled: false },
      ]);

      setUsers(usersData);
      setStats(statsData);
      setEvents(eventsData);
      setFeedbacks(feedbacksData);
      setSettings(settingsData);
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
      setNewEvent({ name: "", description: "", price: 0, isLocked: false, autoJoin: false });
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setActionLoading(editingEvent.id);

    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingEvent.name,
          description: editingEvent.description,
          price: editingEvent.price,
          isLocked: editingEvent.isLocked,
          autoJoin: editingEvent.autoJoin,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setEditingEvent(null);
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

  const handleJoinUserToEvent = async (eventId: string, userId: string, joining: boolean) => {
    setActionLoading(`${eventId}-${userId}`);

    try {
      const res = await fetch(`/api/admin/events/${eventId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, joining }),
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

  const handleToggleVoting = async () => {
    setActionLoading("voting");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votingEnabled: !settings?.votingEnabled }),
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

  const handleToggleIllusion = async () => {
    setActionLoading("illusion");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ illusionMode: !settings?.illusionMode }),
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

  const handleSyncPerformanceEvent = async () => {
    setActionLoading("sync");

    try {
      const res = await fetch("/api/admin/sync-performance-event", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      alert(data.message);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) return;

    setActionLoading(`delete-${userId}`);

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      alert("User deleted successfully");
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetNotifications = async () => {
    if (!confirm("Are you sure you want to reset all users' event notifications? They will see the reminder again.")) return;

    setActionLoading("reset-notifications");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetNotifications: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      alert("All user notifications have been reset!");
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBodyguard = async (userId: string, currentStatus: boolean) => {
    setActionLoading(`bodyguard-${userId}`);

    try {
      const res = await fetch("/api/admin/bodyguard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isBodyguard: !currentStatus }),
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleViewLogs = async (userId: string, userName: string) => {
    setShowLogsModal({ userId, userName });
    setLogsLoading(true);
    setUserLogs([]);

    try {
      const res = await fetch(`/api/logs?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserLogs(data);
      } else {
        alert("Failed to fetch logs");
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      alert("Failed to fetch logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("LOGIN")) return "🔐";
    if (action.includes("REGISTER")) return "📝";
    if (action.includes("PERFORMANCE")) return "🎭";
    if (action.includes("EVENT")) return "🎉";
    if (action.includes("TASK")) return "📋";
    if (action.includes("FEEDBACK")) return "💬";
    if (action.includes("VOTE")) return "⭐";
    if (action.includes("ADMIN")) return "👑";
    if (action.includes("TICKET")) return "🎫";
    if (action.includes("VERIFY")) return "✅";
    return "📌";
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
      <div className="flex gap-2 mb-6 border-b border-christmas-gold/30 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-t-lg transition whitespace-nowrap ${
            activeTab === "users"
              ? "bg-christmas-gold text-christmas-dark font-medium"
              : "text-christmas-cream/70 hover:text-christmas-gold"
          }`}
        >
          👥 Users & Tickets
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded-t-lg transition whitespace-nowrap ${
            activeTab === "events"
              ? "bg-christmas-gold text-christmas-dark font-medium"
              : "text-christmas-cream/70 hover:text-christmas-gold"
          }`}
        >
          🎉 Events
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`px-4 py-2 rounded-t-lg transition whitespace-nowrap ${
            activeTab === "feedback"
              ? "bg-christmas-gold text-christmas-dark font-medium"
              : "text-christmas-cream/70 hover:text-christmas-gold"
          }`}
        >
          💬 Feedback ({feedbacks.length})
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-t-lg transition whitespace-nowrap ${
            activeTab === "settings"
              ? "bg-christmas-gold text-christmas-dark font-medium"
              : "text-christmas-cream/70 hover:text-christmas-gold"
          }`}
        >
          ⚙️ Settings
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
                  <th>Bodyguard</th>
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
                      {!user.isAdmin && (
                        <button
                          onClick={() => handleToggleBodyguard(user.id, user.isBodyguard)}
                          disabled={actionLoading === `bodyguard-${user.id}`}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                            user.isBodyguard
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-christmas-dark border border-christmas-gold/30 text-christmas-cream/70 hover:border-christmas-gold"
                          }`}
                        >
                          {actionLoading === `bodyguard-${user.id}` ? "..." : user.isBodyguard ? "🛡️ Yes" : "No"}
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
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
                        <button
                          onClick={() => handleViewLogs(user.id, user.name)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="View logs"
                        >
                          📋
                        </button>
                        {!user.isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={actionLoading === `delete-${user.id}`}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Delete user"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingEvent(event)}
                      className="text-christmas-gold hover:text-christmas-cream"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      disabled={actionLoading === event.id}
                      className="text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {event.description && (
                  <p className="text-sm text-christmas-cream/70 mb-3">
                    {event.description}
                  </p>
                )}
                
                {/* Event Settings */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-christmas-cream/70">Price</span>
                    <span className="text-christmas-gold font-medium">
                      {event.price > 0 ? `${event.price} ₺` : "TBA"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-christmas-cream/70">Status</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      event.isLocked ? "bg-christmas-gold/20 text-christmas-gold" : "bg-green-900/30 text-green-400"
                    }`}>
                      {event.isLocked ? "🔒 Locked" : "🔓 Open"}
                    </span>
                  </div>
                  {event.autoJoin && (
                    <div className="text-xs text-green-400">
                      ✓ Auto-joins new users
                    </div>
                  )}
                </div>

                {/* Manage Users Button */}
                <button
                  onClick={() => setShowUserEventModal({ event })}
                  className="w-full py-2 text-sm border border-christmas-gold/30 rounded-lg text-christmas-cream/70 hover:text-christmas-gold hover:border-christmas-gold/50 transition"
                >
                  👥 Manage Users ({event.registrations.filter(r => r.joining).length} joined)
                </button>
              </div>
            ))}
          </div>

          {/* Create Event Modal */}
          {showCreateEvent && (
            <div className="modal-overlay" onClick={() => setShowCreateEvent(false)}>
              <div className="christmas-card w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-christmas-gold mb-6">➕ Create Event</h2>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-christmas-gold mb-2">Event Name *</label>
                    <input
                      type="text"
                      value={newEvent.name}
                      onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                      className="input-christmas w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-christmas-gold mb-2">Description</label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="input-christmas w-full h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-christmas-gold mb-2">Price (₺)</label>
                    <input
                      type="number"
                      value={newEvent.price}
                      onChange={(e) => setNewEvent({ ...newEvent, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      className="input-christmas w-full"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={newEvent.isLocked} onChange={(e) => setNewEvent({ ...newEvent, isLocked: e.target.checked })} className="w-4 h-4" />
                      <span className="text-sm text-christmas-cream">🔒 Lock event</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={newEvent.autoJoin} onChange={(e) => setNewEvent({ ...newEvent, autoJoin: e.target.checked })} className="w-4 h-4" />
                      <span className="text-sm text-christmas-cream">✓ Auto-join new users</span>
                    </label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowCreateEvent(false)} className="flex-1 py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10">Cancel</button>
                    <button type="submit" disabled={actionLoading === "create-event"} className="btn-christmas flex-1">{actionLoading === "create-event" ? "Creating..." : "Create"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Event Modal */}
          {editingEvent && (
            <div className="modal-overlay" onClick={() => setEditingEvent(null)}>
              <div className="christmas-card w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-christmas-gold mb-6">✏️ Edit Event</h2>
                <form onSubmit={handleUpdateEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-christmas-gold mb-2">Event Name *</label>
                    <input
                      type="text"
                      value={editingEvent.name}
                      onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                      className="input-christmas w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-christmas-gold mb-2">Description</label>
                    <textarea
                      value={editingEvent.description || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                      className="input-christmas w-full h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-christmas-gold mb-2">Price (₺)</label>
                    <input
                      type="number"
                      value={editingEvent.price}
                      onChange={(e) => setEditingEvent({ ...editingEvent, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      className="input-christmas w-full"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={editingEvent.isLocked} onChange={(e) => setEditingEvent({ ...editingEvent, isLocked: e.target.checked })} className="w-4 h-4" />
                      <span className="text-sm text-christmas-cream">🔒 Lock event</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={editingEvent.autoJoin} onChange={(e) => setEditingEvent({ ...editingEvent, autoJoin: e.target.checked })} className="w-4 h-4" />
                      <span className="text-sm text-christmas-cream">✓ Auto-join new users</span>
                    </label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10">Cancel</button>
                    <button type="submit" disabled={actionLoading === editingEvent.id} className="btn-christmas flex-1">{actionLoading === editingEvent.id ? "Saving..." : "Save"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Manage Users Modal */}
          {showUserEventModal && (
            <div className="modal-overlay" onClick={() => setShowUserEventModal(null)}>
              <div className="christmas-card w-full max-w-lg max-h-[80vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-christmas-gold/30">
                  <h2 className="text-xl font-bold text-christmas-gold">👥 Manage Users</h2>
                  <p className="text-sm text-christmas-cream/70">{showUserEventModal.event.name}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {users.filter(u => !u.isAdmin).map((user) => {
                      const isJoined = showUserEventModal.event.registrations.some(r => r.user.id === user.id && r.joining);
                      return (
                        <div key={user.id} className="flex items-center justify-between bg-christmas-dark/50 rounded-lg p-3">
                          <span className="text-christmas-cream">{user.name}</span>
                          <button
                            onClick={() => handleJoinUserToEvent(showUserEventModal.event.id, user.id, !isJoined)}
                            disabled={actionLoading === `${showUserEventModal.event.id}-${user.id}`}
                            className={`px-3 py-1 rounded text-xs font-medium transition ${
                              isJoined
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-christmas-dark border border-christmas-gold/30 text-christmas-cream/70 hover:border-christmas-gold"
                            }`}
                          >
                            {isJoined ? "✓ Joined" : "Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="p-4 border-t border-christmas-gold/30">
                  <button onClick={() => setShowUserEventModal(null)} className="w-full py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === "feedback" && (
        <div className="christmas-card p-6">
          <h2 className="text-xl font-bold text-christmas-gold mb-4">💬 User Feedback</h2>
          {feedbacks.length === 0 ? (
            <p className="text-christmas-cream/50 text-center py-8">No feedback submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="bg-christmas-dark/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-christmas-gold">{feedback.user.name}</span>
                    <span className="text-xs text-christmas-cream/50">{formatDate(feedback.createdAt)}</span>
                  </div>
                  <p className="text-christmas-cream">{feedback.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Voting Settings */}
          <div className="christmas-card p-6">
            <h2 className="text-xl font-bold text-christmas-gold mb-4">⭐ Voting Settings</h2>
            <p className="text-christmas-cream/70 text-sm mb-4">
              Enable voting during the party so users can rate performances.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-christmas-cream">Performance Voting</p>
                <p className="text-xs text-christmas-cream/50">
                  {settings?.votingEnabled ? "Users can vote for performances" : "Voting is disabled"}
                </p>
              </div>
              <button
                onClick={handleToggleVoting}
                disabled={actionLoading === "voting"}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  settings?.votingEnabled
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-christmas-dark border border-christmas-gold/30 text-christmas-cream/70 hover:border-christmas-gold"
                }`}
              >
                {actionLoading === "voting" ? "..." : settings?.votingEnabled ? "✓ Enabled" : "Enable"}
              </button>
            </div>
          </div>

          {/* Sync Performance Event */}
          <div className="christmas-card p-6">
            <h2 className="text-xl font-bold text-christmas-gold mb-4">🔄 Sync Performance Event</h2>
            <p className="text-christmas-cream/70 text-sm mb-4">
              Automatically add all users who have registered for any performance to the &quot;Performance&quot; event.
              This ensures all performers are joined to the Performance event.
            </p>
            <button
              onClick={handleSyncPerformanceEvent}
              disabled={actionLoading === "sync"}
              className="btn-christmas"
            >
              {actionLoading === "sync" ? "Syncing..." : "🔄 Sync Now"}
            </button>
          </div>

          {/* Reset Event Notifications */}
          <div className="christmas-card p-6">
            <h2 className="text-xl font-bold text-christmas-gold mb-4">🔔 Event Reminder Notifications</h2>
            <p className="text-christmas-cream/70 text-sm mb-4">
              Reset all users&apos; event reminder notifications. After resetting, users will see the 
              &quot;Don&apos;t forget to check events&quot; reminder again when they visit the dashboard.
            </p>
            <button
              onClick={handleResetNotifications}
              disabled={actionLoading === "reset-notifications"}
              className="btn-christmas"
            >
              {actionLoading === "reset-notifications" ? "Resetting..." : "🔔 Reset All Notifications"}
            </button>
          </div>

          {/* Illusion Mode - Performance Feature */}
          <div className="christmas-card p-6 border-2 border-purple-500/30">
            <h2 className="text-xl font-bold text-purple-400 mb-4">♠️ Illusion Mode</h2>
            <p className="text-christmas-cream/70 text-sm mb-4">
              Trigger the dramatic reveal! When activated, all users will see a mysterious message 
              that transitions into the Spade 3 card after 10 seconds.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-christmas-cream">Activate Illusion</p>
                <p className="text-xs text-christmas-cream/50">
                  {settings?.illusionMode ? "The illusion is active for all users!" : "Click to start the magic"}
                </p>
              </div>
              <button
                onClick={handleToggleIllusion}
                disabled={actionLoading === "illusion"}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  settings?.illusionMode
                    ? "bg-purple-600 text-white hover:bg-purple-700 animate-pulse"
                    : "bg-christmas-dark border border-purple-500/30 text-purple-400 hover:border-purple-500"
                }`}
              >
                {actionLoading === "illusion" ? "..." : settings?.illusionMode ? "♠️ Active" : "♠️ Activate"}
              </button>
            </div>
            {settings?.illusionMode && (
              <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                <p className="text-sm text-purple-300">
                  ✨ The illusion is now showing for all users. Click the button again to deactivate.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="christmas-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-christmas-gold/30">
              <div>
                <h2 className="text-2xl font-bold text-christmas-gold">
                  📋 Activity Logs
                </h2>
                <p className="text-christmas-cream/70 text-sm mt-1">
                  {showLogsModal.userName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLogsModal(null);
                  setUserLogs([]);
                }}
                className="text-christmas-cream/50 hover:text-christmas-cream transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="spinner" />
                </div>
              ) : userLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-christmas-cream/50">No logs found for this user.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userLogs.map((log) => {
                    let metadata = null;
                    try {
                      if (log.metadata) {
                        metadata = JSON.parse(log.metadata);
                      }
                    } catch (e) {
                      // Ignore parse errors
                    }

                    return (
                      <div
                        key={log.id}
                        className="bg-christmas-dark/50 border border-christmas-gold/20 rounded-lg p-4 hover:border-christmas-gold/40 transition"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getActionIcon(log.action)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-christmas-gold">
                                {log.action.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs text-christmas-cream/50">
                                {formatDateTime(log.createdAt)}
                              </span>
                            </div>
                            {log.details && (
                              <p className="text-christmas-cream/80 text-sm mb-2">
                                {log.details}
                              </p>
                            )}
                            {metadata && Object.keys(metadata).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-christmas-gold/10">
                                <details className="text-xs">
                                  <summary className="text-christmas-cream/50 cursor-pointer hover:text-christmas-cream/70">
                                    View Details
                                  </summary>
                                  <pre className="mt-2 text-christmas-cream/60 bg-christmas-dark/50 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(metadata, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-christmas-gold/30">
              <p className="text-xs text-christmas-cream/50 text-center">
                Showing {userLogs.length} most recent logs (max 500)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

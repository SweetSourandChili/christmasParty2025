"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Performance {
  id: string;
  name: string;
  description: string | null;
  maxParticipants: number;
  creator: {
    id: string;
    name: string;
  };
  registrations: {
    user: {
      id: string;
      name: string;
    };
  }[];
}

export default function PerformancesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPerformance, setNewPerformance] = useState({
    name: "",
    description: "",
    maxParticipants: 3,
  });
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPerformances();
    }
  }, [session]);

  const fetchPerformances = async () => {
    try {
      const res = await fetch("/api/performances");
      const data = await res.json();
      setPerformances(data);
    } catch (error) {
      console.error("Failed to fetch performances:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/performances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPerformance),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setShowCreateModal(false);
      setNewPerformance({ name: "", description: "", maxParticipants: 3 });
      fetchPerformances();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRegister = async (performanceId: string) => {
    setActionLoading(performanceId);

    try {
      const res = await fetch(`/api/performances/${performanceId}/register`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchPerformances();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnregister = async (performanceId: string) => {
    setActionLoading(performanceId);

    try {
      const res = await fetch(`/api/performances/${performanceId}/register`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchPerformances();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (performanceId: string) => {
    if (!confirm("Are you sure you want to delete this performance?")) return;

    setActionLoading(performanceId);

    try {
      const res = await fetch(`/api/performances/${performanceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchPerformances();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const isRegistered = (performance: Performance) => {
    return performance.registrations.some(
      (reg) => reg.user.id === session?.user?.id
    );
  };

  const isCreator = (performance: Performance) => {
    return performance.creator.id === session?.user?.id;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-christmas-gold">
            🎭 Performance Stage
          </h1>
          <p className="text-christmas-cream/70 mt-1">
            Create or join a performance group (1-3 people)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-christmas"
        >
          ✨ Create Performance
        </button>
      </div>

      {/* Info Box */}
      <div className="christmas-card p-4 mb-8 flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div className="text-sm text-christmas-cream/80">
          <p className="font-medium text-christmas-gold mb-1">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Create a performance or join an existing one</li>
            <li>Each performance can have 1-3 participants</li>
            <li>
              Creating or joining a performance activates your ticket (pending
              payment)
            </li>
            <li>
              Once payment is approved by admin, your ticket will be fully
              activated
            </li>
          </ul>
        </div>
      </div>

      {/* Performances List */}
      {performances.length === 0 ? (
        <div className="christmas-card p-12 text-center">
          <span className="text-6xl block mb-4">🎪</span>
          <h2 className="text-2xl font-bold text-christmas-gold mb-2">
            No Performances Yet
          </h2>
          <p className="text-christmas-cream/70 mb-6">
            Be the first to create a performance!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-christmas"
          >
            Create First Performance
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performances.map((performance) => (
            <div key={performance.id} className="christmas-card p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-christmas-gold">
                  {performance.name}
                </h3>
                <span className="text-sm text-christmas-cream/60">
                  {performance.registrations.length}/{performance.maxParticipants}
                </span>
              </div>

              {performance.description && (
                <p className="text-christmas-cream/70 text-sm mb-4">
                  {performance.description}
                </p>
              )}

              <div className="mb-4">
                <p className="text-xs text-christmas-gold mb-2">Participants:</p>
                <div className="flex flex-wrap gap-2">
                  {performance.registrations.map((reg) => (
                    <span
                      key={reg.user.id}
                      className="bg-christmas-green/30 text-christmas-cream px-2 py-1 rounded text-xs"
                    >
                      {reg.user.id === performance.creator.id && "👑 "}
                      {reg.user.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {isRegistered(performance) ? (
                  <>
                    <span className="flex-1 text-center py-2 text-green-400 text-sm">
                      ✓ Registered
                    </span>
                    {!isCreator(performance) && (
                      <button
                        onClick={() => handleUnregister(performance.id)}
                        disabled={actionLoading === performance.id}
                        className="btn-christmas text-xs px-3 py-2"
                      >
                        {actionLoading === performance.id ? "..." : "Leave"}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleRegister(performance.id)}
                    disabled={
                      actionLoading === performance.id ||
                      performance.registrations.length >=
                        performance.maxParticipants
                    }
                    className="btn-christmas-green flex-1 text-sm py-2"
                  >
                    {actionLoading === performance.id
                      ? "..."
                      : performance.registrations.length >=
                        performance.maxParticipants
                      ? "Full"
                      : "Join Performance"}
                  </button>
                )}

                {(isCreator(performance) || session.user.isAdmin) && (
                  <button
                    onClick={() => handleDelete(performance.id)}
                    disabled={actionLoading === performance.id}
                    className="text-red-400 hover:text-red-300 px-2"
                    title="Delete"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="christmas-card w-full max-w-md p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-christmas-gold mb-6">
              ✨ Create Performance
            </h2>

            <form onSubmit={handleCreatePerformance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-christmas-gold mb-2">
                  Performance Name *
                </label>
                <input
                  type="text"
                  value={newPerformance.name}
                  onChange={(e) =>
                    setNewPerformance({ ...newPerformance, name: e.target.value })
                  }
                  placeholder="e.g., Christmas Carol Singers"
                  className="input-christmas w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-christmas-gold mb-2">
                  Description
                </label>
                <textarea
                  value={newPerformance.description}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
                      description: e.target.value,
                    })
                  }
                  placeholder="Tell us about your performance..."
                  className="input-christmas w-full h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-christmas-gold mb-2">
                  Max Participants (1-3)
                </label>
                <select
                  value={newPerformance.maxParticipants}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
                      maxParticipants: parseInt(e.target.value),
                    })
                  }
                  className="input-christmas w-full"
                >
                  <option value={1}>1 (Solo)</option>
                  <option value={2}>2 (Duo)</option>
                  <option value={3}>3 (Trio)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-christmas flex-1"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


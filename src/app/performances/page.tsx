"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PerformanceCommentsModal from "@/components/PerformanceCommentsModal";
import { useLanguage } from "@/components/LanguageProvider";

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
  _count?: {
    comments: number;
  };
}

interface PerformanceWithVotes {
  id: string;
  name: string;
  description: string | null;
  creator: { id: string; name: string };
  participants: { id: string; name: string }[];
  totalPoints: number;
  voteCount: number;
  averagePoints: number;
  userVote: number | null;
  isParticipant: boolean;
}

export default function PerformancesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [performancesWithVotes, setPerformancesWithVotes] = useState<PerformanceWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentsModal, setCommentsModal] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"performances" | "voting">("performances");
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [newPerformance, setNewPerformance] = useState({
    name: "",
    description: "",
    maxParticipants: 3,
  });
  const [editingPerformance, setEditingPerformance] = useState<Performance | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [votingLoading, setVotingLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPerformances();
      checkVotingStatus();
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

  const checkVotingStatus = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setVotingEnabled(data.votingEnabled || session?.user?.isAdmin);
      }
    } catch (error) {
      console.error("Failed to check voting status:", error);
    }
  };

  const fetchVotingData = async () => {
    setVotingLoading(true);
    try {
      const res = await fetch("/api/performances/votes");
      if (res.ok) {
        const data = await res.json();
        setPerformancesWithVotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch voting data:", error);
    } finally {
      setVotingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "voting" && (votingEnabled || session?.user?.isAdmin)) {
      fetchVotingData();
    }
  }, [activeTab, votingEnabled, session?.user?.isAdmin]);

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
    if (!confirm(t("delete") + "?")) return;

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

  const handleVote = async (performanceId: string, points: number) => {
    setActionLoading(`vote-${performanceId}`);

    try {
      const res = await fetch(`/api/performances/${performanceId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchVotingData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerformance) return;

    setActionLoading(`edit-${editingPerformance.id}`);

    try {
      const res = await fetch(`/api/performances/${editingPerformance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingPerformance.name,
          description: editingPerformance.description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setEditingPerformance(null);
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
            🎭 {t("performanceStage")}
          </h1>
          <p className="text-christmas-cream/70 mt-1">
            {t("performanceDesc")}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-christmas"
        >
          {t("createPerformance")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-christmas-gold/30 pb-2">
        <button
          onClick={() => setActiveTab("performances")}
          className={`px-4 py-2 rounded-t-lg transition ${
            activeTab === "performances"
              ? "bg-christmas-gold text-christmas-dark font-medium"
              : "text-christmas-cream/70 hover:text-christmas-gold"
          }`}
        >
          🎭 {t("performancesTab")}
        </button>
        <button
          onClick={() => setActiveTab("voting")}
          className={`px-4 py-2 rounded-t-lg transition ${
            activeTab === "voting"
              ? "bg-christmas-gold text-christmas-dark font-medium"
              : "text-christmas-cream/70 hover:text-christmas-gold"
          }`}
        >
          ⭐ {t("voteRankings")}
        </button>
      </div>

      {/* Performances Tab */}
      {activeTab === "performances" && (
        <>
          {/* Info Box */}
          <div className="christmas-card p-4 mb-8 flex items-start gap-3">
            <span className="text-2xl">🎁</span>
            <div className="text-sm text-christmas-cream/80">
              <p className="font-medium text-christmas-gold mb-1">{t("performerGift")}</p>
              <p>{t("performerGiftDesc")}</p>
            </div>
          </div>

          {/* Performances List */}
          {performances.length === 0 ? (
            <div className="christmas-card p-12 text-center">
              <span className="text-6xl block mb-4">🎪</span>
              <h2 className="text-2xl font-bold text-christmas-gold mb-2">
                {t("noPerformancesYet")}
              </h2>
              <p className="text-christmas-cream/70 mb-6">
                {t("beFirstPerformance")}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-christmas"
              >
                {t("createFirstPerformance")}
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
                    <p className="text-xs text-christmas-gold mb-2">{t("participants")}:</p>
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

                  {/* Comments & Edit Buttons */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setCommentsModal({ id: performance.id, name: performance.name })}
                      className="flex-1 py-2 text-sm text-christmas-cream/70 hover:text-christmas-gold border border-christmas-gold/30 rounded-lg hover:border-christmas-gold/50 transition flex items-center justify-center gap-2"
                    >
                      💬 {t("comments")}
                    </button>
                    {isRegistered(performance) && (
                      <button
                        onClick={() => setEditingPerformance(performance)}
                        className="py-2 px-3 text-sm text-christmas-cream/70 hover:text-christmas-gold border border-christmas-gold/30 rounded-lg hover:border-christmas-gold/50 transition"
                        title={t("edit")}
                      >
                        ✏️
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isRegistered(performance) ? (
                      <>
                        <span className="flex-1 text-center py-2 text-green-400 text-sm">
                          {t("registered")}
                        </span>
                        {!isCreator(performance) && (
                          <button
                            onClick={() => handleUnregister(performance.id)}
                            disabled={actionLoading === performance.id}
                            className="btn-christmas text-xs px-3 py-2"
                          >
                            {actionLoading === performance.id ? "..." : t("leave")}
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
                          ? t("full")
                          : t("joinPerformance")}
                      </button>
                    )}

                    {(isCreator(performance) || session.user.isAdmin) && (
                      <button
                        onClick={() => handleDelete(performance.id)}
                        disabled={actionLoading === performance.id}
                        className="text-red-400 hover:text-red-300 px-2"
                        title={t("delete")}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Voting Tab */}
      {activeTab === "voting" && (
        <>
          {!votingEnabled && !session.user.isAdmin ? (
            <div className="christmas-card p-12 text-center">
              <span className="text-6xl block mb-4">🔒</span>
              <h2 className="text-2xl font-bold text-christmas-gold mb-2">
                {t("votingNotOpen")}
              </h2>
              <p className="text-christmas-cream/70">
                {t("votingNotOpenDesc")}
              </p>
            </div>
          ) : votingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* Voting Info */}
              <div className="christmas-card p-4 mb-8 flex items-start gap-3">
                <span className="text-2xl">⭐</span>
                <div className="text-sm text-christmas-cream/80">
                  <p className="font-medium text-christmas-gold mb-1">{t("ratePerformances")}</p>
                  <p>{t("ratePerformancesDesc")}</p>
                  {session.user.isAdmin && !votingEnabled && (
                    <p className="text-yellow-400 mt-2">{t("adminPreview")}</p>
                  )}
                </div>
              </div>

              {/* Leaderboard */}
              <div className="space-y-4">
                {performancesWithVotes.map((perf, index) => (
                  <div key={perf.id} className="christmas-card p-4">
                    <div className="flex items-start gap-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-christmas-dark/50 text-2xl font-bold">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-christmas-gold truncate">
                          {perf.name}
                        </h3>
                        {perf.description && (
                          <p className="text-christmas-cream/60 text-sm truncate">{perf.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {perf.participants.map((p) => (
                            <span
                              key={p.id}
                              className="bg-christmas-green/20 text-christmas-cream/80 px-2 py-0.5 rounded text-xs"
                            >
                              {p.id === perf.creator.id && "👑 "}
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Stats & Voting */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-bold text-christmas-gold">
                          {perf.totalPoints}
                        </div>
                        <div className="text-xs text-christmas-cream/50">
                          {perf.voteCount} {perf.voteCount === 1 ? t("vote") : t("votes")}
                        </div>
                        {perf.voteCount > 0 && (
                          <div className="text-xs text-christmas-cream/50">
                            {t("avg")}: {perf.averagePoints}
                          </div>
                        )}

                        {/* Vote Selector */}
                        {!perf.isParticipant && (
                          <div className="mt-3">
                            <select
                              value={perf.userVote || ""}
                              onChange={(e) => handleVote(perf.id, parseInt(e.target.value))}
                              disabled={actionLoading === `vote-${perf.id}`}
                              className="input-christmas text-sm py-1 px-2"
                            >
                              <option value="">{t("voteAction")}</option>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <option key={n} value={n}>
                                  {n} {n === 1 ? t("point") : t("points")}
                                </option>
                              ))}
                            </select>
                            {perf.userVote && (
                              <div className="text-xs text-green-400 mt-1">
                                {t("yourVote")}: {perf.userVote}
                              </div>
                            )}
                          </div>
                        )}
                        {perf.isParticipant && (
                          <div className="text-xs text-christmas-cream/40 mt-3">
                            {t("yourPerformance")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {performancesWithVotes.length === 0 && (
                  <div className="christmas-card p-12 text-center">
                    <span className="text-6xl block mb-4">🎭</span>
                    <h2 className="text-2xl font-bold text-christmas-gold mb-2">
                      {t("noPerformancesYet")}
                    </h2>
                    <p className="text-christmas-cream/70">
                      {t("beFirstPerformance")}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="christmas-card w-full max-w-md p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-christmas-gold mb-6">
              ✨ {t("createPerformanceTitle")}
            </h2>

            <form onSubmit={handleCreatePerformance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-christmas-gold mb-2">
                  {t("performanceName")} *
                </label>
                <input
                  type="text"
                  value={newPerformance.name}
                  onChange={(e) =>
                    setNewPerformance({ ...newPerformance, name: e.target.value })
                  }
                  placeholder={t("performanceNamePlaceholder")}
                  className="input-christmas w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-christmas-gold mb-2">
                  {t("description")}
                </label>
                <textarea
                  value={newPerformance.description}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
                      description: e.target.value,
                    })
                  }
                  placeholder={t("descriptionPlaceholder")}
                  className="input-christmas w-full h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-christmas-gold mb-2">
                  {t("maxParticipants")}
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
                  <option value={1}>1 ({t("solo")})</option>
                  <option value={2}>2 ({t("duo")})</option>
                  <option value={3}>3 ({t("trio")})</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-christmas flex-1"
                >
                  {creating ? t("creating") : t("create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPerformance && (
        <div className="modal-overlay" onClick={() => setEditingPerformance(null)}>
          <div
            className="christmas-card w-full max-w-md p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-christmas-gold mb-6">
              ✏️ {t("editPerformanceTitle")}
            </h2>

            <form onSubmit={handleEditPerformance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-christmas-gold mb-2">
                  {t("performanceName")} *
                </label>
                <input
                  type="text"
                  value={editingPerformance.name}
                  onChange={(e) =>
                    setEditingPerformance({ ...editingPerformance, name: e.target.value })
                  }
                  placeholder={t("performanceNamePlaceholder")}
                  className="input-christmas w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-christmas-gold mb-2">
                  {t("description")}
                </label>
                <textarea
                  value={editingPerformance.description || ""}
                  onChange={(e) =>
                    setEditingPerformance({
                      ...editingPerformance,
                      description: e.target.value,
                    })
                  }
                  placeholder={t("descriptionPlaceholder")}
                  className="input-christmas w-full h-24 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingPerformance(null)}
                  className="flex-1 py-2 border border-christmas-gold/50 rounded-lg text-christmas-cream hover:bg-christmas-gold/10"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === `edit-${editingPerformance.id}`}
                  className="btn-christmas flex-1"
                >
                  {actionLoading === `edit-${editingPerformance.id}` ? t("saving") : t("saveChanges")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentsModal && (
        <PerformanceCommentsModal
          performanceId={commentsModal.id}
          performanceName={commentsModal.name}
          onClose={() => setCommentsModal(null)}
        />
      )}
    </div>
  );
}

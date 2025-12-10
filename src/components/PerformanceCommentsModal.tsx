"use client";

import { useState, useEffect } from "react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface PerformanceCommentsModalProps {
  performanceId: string;
  performanceName: string;
  onClose: () => void;
}

export default function PerformanceCommentsModal({
  performanceId,
  performanceName,
  onClose,
}: PerformanceCommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComments();
  }, [performanceId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/performances/${performanceId}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/performances/${performanceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post comment");
      }

      const comment = await res.json();
      setComments([comment, ...comments]);
      setNewComment("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative christmas-card w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-christmas-gold/30 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-christmas-gold">💬 Comments</h2>
            <p className="text-sm text-christmas-cream/70">{performanceName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-christmas-cream/50 hover:text-christmas-cream transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-christmas-cream/50">
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-christmas-dark/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-christmas-gold text-sm">
                    {comment.user.name}
                  </span>
                  <span className="text-xs text-christmas-cream/50">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-christmas-cream text-sm">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment Form */}
        <div className="p-4 border-t border-christmas-gold/30">
          {error && (
            <div className="bg-red-900/50 text-red-200 text-sm px-3 py-2 rounded mb-3">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your excitement..."
              className="input-christmas flex-1 text-sm"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="btn-christmas-green px-4 text-sm"
            >
              {submitting ? "..." : "Post"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


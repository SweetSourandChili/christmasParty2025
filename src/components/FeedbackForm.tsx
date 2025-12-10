"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

export default function FeedbackForm() {
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSuccess(true);
      setContent("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="christmas-card p-6">
      <h3 className="text-xl font-bold text-christmas-gold mb-4 flex items-center gap-2">
        💬 {t("feedbackTitle")}
      </h3>
      
      {success && (
        <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4">
          ✓ {t("feedbackSuccess")}
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("feedbackPlaceholder")}
          className="input-christmas w-full h-24 resize-none"
          maxLength={500}
          required
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-christmas-cream/50">
            {content.length}/500
          </span>
          <button
            type="submit"
            disabled={loading || content.trim().length === 0}
            className="btn-christmas-green px-6"
          >
            {loading ? "..." : t("feedbackSubmit")}
          </button>
        </div>
      </form>
    </div>
  );
}

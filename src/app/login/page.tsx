"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const { t } = useLanguage();
  
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        phone,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {registered && (
        <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
          {t("registrationSuccess")}
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-christmas-gold mb-2">
            {t("phone")}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+90 555 123 4567"
            className="input-christmas w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-christmas-gold mb-2">
            {t("password")}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-christmas w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-christmas w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner w-5 h-5" />
              {t("signingIn")}
            </span>
          ) : (
            t("loginButton")
          )}
        </button>
      </form>
    </>
  );
}

function LoginContent() {
  const { t } = useLanguage();
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Check if user has visited before by looking for any stored data
    const hasVisited = localStorage.getItem("language") || localStorage.getItem("hasVisited");
    if (hasVisited) {
      setIsReturningUser(true);
    }
    // Mark that user has visited
    localStorage.setItem("hasVisited", "true");
  }, []);
  
  return (
    <div className="christmas-card w-full max-w-md p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-christmas-gold mb-2">
          🎅 {mounted ? (isReturningUser ? t("loginTitle") : t("loginTitleNew")) : t("loginTitleNew")}
        </h1>
        <p className="text-christmas-cream/70">
          {mounted ? (isReturningUser ? t("loginDesc") : t("loginDescNew")) : t("loginDescNew")}
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center"><span className="spinner w-8 h-8" /></div>}>
        <LoginForm />
      </Suspense>

      <div className="mt-8 text-center border-t border-christmas-gold/30 pt-6">
        <p className="text-christmas-cream/70">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="text-christmas-gold hover:underline"
          >
            {t("signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <LoginContent />
    </div>
  );
}

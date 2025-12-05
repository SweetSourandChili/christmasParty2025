"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  
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
          🎉 Registration successful! Please login with your credentials.
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
            Phone Number
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
            Password
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
              Signing in...
            </span>
          ) : (
            "🎄 Sign In"
          )}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="christmas-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-christmas-gold mb-2">
            🎅 Welcome Back!
          </h1>
          <p className="text-christmas-cream/70">
            Sign in to your KIKI Christmas Event account
          </p>
        </div>

        <Suspense fallback={<div className="flex justify-center"><span className="spinner w-8 h-8" /></div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-8 text-center border-t border-christmas-gold/30 pt-6">
          <p className="text-christmas-cream/70">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-christmas-gold hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

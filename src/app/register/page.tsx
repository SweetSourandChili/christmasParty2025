"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "verification">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setStep("verification");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="christmas-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-christmas-gold mb-2">
            🎄 Join the Party!
          </h1>
          <p className="text-christmas-cream/70">
            Create your account for the KIKI Christmas Event
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === "details" ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-christmas-gold mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input-christmas w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-christmas-gold mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="input-christmas w-full"
                required
              />
            </div>

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
              <p className="text-xs text-christmas-cream/50 mt-1">
                Used for login identification
              </p>
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
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-christmas-gold mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Sending Code...
                </span>
              ) : (
                "📧 Send Verification Code"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-christmas-cream/70">
                A verification code has been sent to
              </p>
              <p className="text-christmas-gold font-medium">{email}</p>
              <p className="text-xs text-christmas-cream/50 mt-2">
                Please check your inbox (and spam folder)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-christmas-gold mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                className="input-christmas w-full text-center text-2xl tracking-widest"
                maxLength={6}
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
                  Creating Account...
                </span>
              ) : (
                "🎁 Complete Registration"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("details");
                setVerificationCode("");
              }}
              className="w-full text-center text-christmas-cream/70 hover:text-christmas-gold transition"
            >
              ← Back to details
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-christmas-gold/30 pt-6">
          <p className="text-christmas-cream/70">
            Already have an account?{" "}
            <Link href="/login" className="text-christmas-gold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

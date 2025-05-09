// app/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const oobCode = params.get("oobCode") || "";

  const [step, setStep] = useState<"form" | "success" | "error">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid reset link.");
      setStep("error");
    }
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStep("success");
    } catch (err: any) {
      setError(err.message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  if (!oobCode && step === "form") {
    return (
      <div className="h-screen bg-[#0d1623] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1623] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-[#1b2538] px-6 py-8 rounded-lg shadow-xl">
        <div
          className="mb-6 cursor-pointer"
          onClick={() => router.replace("/")}
        >
          <Image
            src="/trackingbehaviorlogo2.png"
            alt="Tracking Behavior"
            width={140}
            height={50}
          />
        </div>

        {step === "form" && (
          <>
            <h1 className="text-2xl font-bold text-[#f3ede0] mb-1">
              Reset password
            </h1>
            <p className="text-[#cfd8e3] mb-6">
              Enter your new password below.
            </p>

            {error && <p className="text-red-400 text-center mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-[#f3ede0] mb-1">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 rounded border border-[#3a4a6a]
                             bg-[#0d1623] text-[#f3ede0]
                             focus:outline-none focus:ring-2 focus:ring-[#3a4a6a]"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-[#f3ede0] mb-1">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 rounded border border-[#3a4a6a]
                             bg-[#0d1623] text-[#f3ede0]
                             focus:outline-none focus:ring-2 focus:ring-[#3a4a6a]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#3a4a6a] text-[#f3ede0]
                           font-semibold rounded hover:bg-[#52607f] transition"
              >
                {loading ? <LoadingSpinner /> : "SET NEW PASSWORD"}
              </button>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h1 className="text-2xl font-bold text-[#f3ede0] mb-1">
              Password reset!
            </h1>
            <p className="text-[#cfd8e3]">
              Your password has been updated.{" "}
              <button
                className="underline text-[#f3ede0]"
                onClick={() => router.replace("/login")}
              >
                Log in
              </button>
            </p>
          </div>
        )}

        {step === "error" && !error && (
          <p className="text-red-400 text-center">Something went wrong.</p>
        )}
      </div>
    </div>
  );
}

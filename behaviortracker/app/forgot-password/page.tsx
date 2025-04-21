"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import Image from "next/image";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import type { ActionCodeSettings } from "firebase/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "sent">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionCodeSettings: ActionCodeSettings = {
    // after the user clicks the link in their email
    // they’ll be brought back here:
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: false,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setStep("sent");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToLogin = async () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0d1623] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-[#1b2538] px-6 py-8 rounded-lg shadow-xl">
        {/* logo */}
        <div
          className="mb-6 cursor-pointer"
          onClick={() => (location.href = "/")}
        >
          <Image
            src="/trackingbehaviorlogo2.png"
            alt="Tracking Behavior"
            width={140}
            height={50}
          />
        </div>

        {step === "form" ? (
          <>
            <h1 className="text-2xl font-bold text-[#f3ede0] mb-1">
              Reset password
            </h1>
            <p className="text-[#cfd8e3] mb-6">
              Enter the email address you used to create your account.
            </p>

            {error && <p className="text-red-400 text-center mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[#f3ede0] mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                {loading ? <LoadingSpinner /> : "SEND PASSWORD RESET LINK"}
              </button>
            </form>

            <p className="mt-6 text-center text-[#cfd8e3]">
              Having issues changing your password?{" "}
              <a
                href="mailto:trackingbehaviorapp@gmail.com"
                className="underline text-[#f3ede0]"
              >
                Contact Customer Care
              </a>
            </p>
          </>
        ) : (
          /* confirmation screen */
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
              Check your inbox
            </h1>
            <p className="text-[#cfd8e3]">
              If you’re registered with us, a link has been sent to:
              <br />
              <span className="font-mono mt-2 block">{email}</span>
            </p>
            <button
              type="submit"
              disabled={loading}
              onClick={handleToLogin}
              className="mt-4 w-3/4 md:w-1/2 mx-auto py-3 bg-[#3a4a6a] text-[#f3ede0] font-semibold rounded hover:bg-[#52607f] transition"
            >
              Go back to Log in page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

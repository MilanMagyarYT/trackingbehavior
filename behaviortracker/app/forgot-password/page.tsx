"use client";

import { FirebaseError } from "firebase/app";
import { useState, FormEvent } from "react";
import { sendPasswordResetEmail, type ActionCodeSettings } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import Image from "next/image";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useRouter } from "next/navigation";

import "@/app/components/ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "sent">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionCodeSettings: ActionCodeSettings = {
    url: `${window.location.origin}/forgot-password`,
    handleCodeInApp: false,
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setStep("sent");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fp-bg">
      <section className="fp-wrapper">
        {step === "form" && (
          <header
            className="fp-hero"
            onClick={() => router.replace("/")}
            role="button"
          >
            <Image
              src="/trackingbehaviorlogo2.png"
              alt="Tracking Behavior"
              width={140}
              height={50}
            />
            <h1 className="fp-hero-title">reset password</h1>
            <p className="fp-hero-sub">
              enter the email address you used
              <br />
              to create your account.
            </p>
          </header>
        )}
        <div className="fp-card">
          {step === "form" ? (
            <>
              {error && <p className="fp-error">{error}</p>}

              <form onSubmit={handleSubmit} className="fp-form">
                <label>
                  <span>email</span>
                  <input
                    type="email"
                    value={email}
                    required
                    placeholder="you@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="fp-btn-main"
                >
                  {loading ? <LoadingSpinner /> : "send password reset link"}
                </button>
              </form>

              <p className="fp-help">
                having issues changing your password?{" "}
                <a href="mailto:trackingbehaviorapp@gmail.com">
                  contact customer care
                </a>
              </p>
            </>
          ) : (
            <div className="fp-sent">
              <Image
                src="/trackingbehaviorlogo2.png"
                alt="Tracking Behavior"
                width={140}
                height={50}
              />
              <span className="fp-check">
                <svg viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>

              <h2>check your inbox</h2>
              <p>
                a reset link has been sent to:
                <br />
                <code>{email}</code>
              </p>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="fp-btn-return"
              >
                go back to log&nbsp;in page
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

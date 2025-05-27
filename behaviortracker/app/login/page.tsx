"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import Image from "next/image";
import { FaGoogle } from "react-icons/fa";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import "@/app/components/LoginPage2.css";

export default function LoginPage() {
  const router = useRouter();
  const [statusKnown, setStatusKnown] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setStatusKnown(true);
      if (u) router.replace("/profile");
    });
    return () => unsub();
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await signInWithEmailAndPassword(
        auth,
        fd.get("email") as string,
        fd.get("password") as string
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!statusKnown) {
    return (
      <div className="log-bg">
        <LoadingSpinner />
      </div>
    );
  }
  if (user) return null;

  return (
    <div className="log-bg">
      <section className="log-wrapper">
        <header
          className="log-hero"
          onClick={() => router.replace("/")}
          role="button"
        >
          <Image
            src="/trackingbehaviorlogo2.png"
            alt="Tracking Behavior"
            width={140}
            height={50}
          />
          <h1 className="log-hero-title">welcome back</h1>
          <p className="log-hero-sub">good to see you again.</p>
        </header>

        <div className="log-card">
          {error && <p className="log-error">{error}</p>}

          <form onSubmit={handleSubmit} className="log-form">
            <label>
              <span>email</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              <span>password</span>
              <input
                type="password"
                name="password"
                placeholder="***********"
                required
              />
            </label>

            <button type="submit" className="log-btn-main">
              log&nbsp;in
            </button>

            <div className="log-forgot">
              <button onClick={() => router.push("/forgot-password")}>
                forgot your password?
              </button>
            </div>
          </form>

          <div className="log-divider">
            <span>or</span>
          </div>

          <button onClick={handleGoogle} className="log-btn-google">
            <FaGoogle />
            continue with google
          </button>

          <p className="log-signup">
            don’t have an account?{" "}
            <button onClick={() => router.push("/create-account")}>
              sign&nbsp;up
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}

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

export default function LoginPage() {
  const router = useRouter();
  const [statusKnown, setStatusKnown] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState<string | null>(null);

  // listen for auth state
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

  function handleImageClick() {
    router.replace("/");
  }

  if (!statusKnown)
    return (
      <div className="h-screen bg-[#0d1623] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  // if already logged in, blank until redirect
  if (user) return null;

  return (
    <div className="min-h-screen bg-[#0d1623] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-[#1b2538] px-6 py-8 rounded-lg shadow-xl">
        {/* logo top-left */}
        <div className="mb-6" onClick={handleImageClick}>
          <Image
            src="/trackingbehaviorlogo2.png"
            alt="Tracking Behavior"
            width={140}
            height={50}
          />
        </div>

        {/* header */}
        <h1 className="text-2xl font-bold text-[#f3ede0] mb-1">Welcome back</h1>
        <p className="text-[#cfd8e3] mb-6">Good to see you again.</p>

        {/* form */}
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[#f3ede0] mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="you@example.com"
              required
              className="w-full p-3 rounded border border-[#3a4a6a] bg-[#0d1623] focus:outline-none focus:ring-2 focus:ring-[#3a4a6a] text-[#f3ede0]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[#f3ede0] mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="••••••••"
              required
              className="w-full p-3 rounded border border-[#3a4a6a] bg-[#0d1623] focus:outline-none focus:ring-2 focus:ring-[#3a4a6a] text-[#f3ede0]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#3a4a6a] text-[#f3ede0] font-semibold rounded hover:bg-[#52607f] transition"
          >
            LOG IN
          </button>

          <div className="text-right">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-sm text-[#cfd8e3] underline"
            >
              Forgot your password?
            </button>
          </div>
        </form>

        {/* divider */}
        <div className="my-6 flex items-center text-[#cfd8e3]">
          <hr className="flex-grow border-[#3a4a6a]" />
          <span className="px-3">OR</span>
          <hr className="flex-grow border-[#3a4a6a]" />
        </div>

        {/* social login */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-2 py-2 mb-3 border border-[#3a4a6a] rounded hover:bg-[#162137] transition"
        >
          <FaGoogle className="text-xl text-[#f3ede0]" />
          <span className="text-[#f3ede0] font-medium">
            Continue with Google
          </span>
        </button>

        {/* sign up */}
        <p className="mt-6 text-center text-[#cfd8e3]">
          Don’t have an account?{" "}
          <button
            onClick={() => router.push("/create-account")}
            className="underline text-[#f3ede0]"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

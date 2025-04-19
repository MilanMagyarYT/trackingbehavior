"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import Image from "next/image";
import BTNavbar from "../components/BTNavbar";
import { useAppSelector } from "@/app/store";
import LoadingSpinner from "../components/LoadingSpinner";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useAppSelector((s) => s.auth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/profile");
  }, [status, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await signInWithEmailAndPassword(
        auth,
        fd.get("email") as string,
        fd.get("password") as string
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  }
  if (status === "loading")
    return (
      <div>
        <BTNavbar />
        <LoadingSpinner />
      </div>
    );

  return (
    <div>
      <BTNavbar />
      <div className="min-h-screen bg-[#0d1623] flex flex-col items-center justify-center p-4">
        <Image
          src="/trackingbehaviorlogo.png"
          alt="Logo Here"
          width={250}
          height={50}
          className="logo"
        />
        <div className="w-full max-w-md bg-[#1b2538] p-8 rounded shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-6 text-[#f3ede0]">
            Login
          </h1>
          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[#f3ede0] mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Enter your email"
                required
                className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f3ede0] text-[#f3ede0]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[#f3ede0] mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Enter your password"
                required
                className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f3ede0] text-[#f3ede0]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#f3ede0] text-[#1b2538] font-semibold rounded hover:opacity-90 transition duration-200"
            >
              Login
            </button>
          </form>
        </div>
        <p className="home__login">
          Don’t have an account yet?{" "}
          <span onClick={() => router.push("/create-account")}>Register</span>
        </p>{" "}
      </div>
    </div>
  );
}

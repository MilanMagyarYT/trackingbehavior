"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import BTNavbar from "../components/BTNavbar";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/profile");
    } catch (error: any) {
      setError(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1623] flex flex-col items-center justify-center p-4">
      <img
        src="/officiallogo.png"
        alt="Logo Here"
        className="h-16 w-auto mb-6"
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
    </div>
  );
}

// app/create-account/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  AuthError,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, db } from "@/lib/firebaseClient";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { store } from "@/app/store";
import { setUser } from "@/app/store/authSlice";
import { FaGoogle } from "react-icons/fa";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function CreateAccountPage() {
  const router = useRouter();

  // local state
  const [statusKnown, setStatusKnown] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(
    auth.currentUser
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // track auth → redirect if already signed in
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
      setStatusKnown(true);
      if (u) router.replace("/profile");
    });
    return () => unsub();
  }, [router]);

  // wait until we know whether they're logged in or not
  if (!statusKnown) {
    return (
      <div className="h-screen bg-[#0d1623] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  // already signed in → nothing to render, redirect is in effect
  if (currentUser) {
    return null;
  }

  // email/password sign‑up
  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // set displayName on the Firebase user
      await updateProfile(auth.currentUser!, {
        displayName: `${firstName} ${lastName}`,
      });

      // immediately reflect in Redux
      store.dispatch(
        setUser({
          uid: cred.user.uid,
          email: cred.user.email!,
          displayName: auth.currentUser!.displayName,
        })
      );

      // persist baseline info in Firestore
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          authEmail: email,
          createdAt: serverTimestamp(),
          firstName,
          lastName,
        },
        { merge: true }
      );

      router.replace("/profile");
    } catch (err) {
      setError((err as AuthError).message);
      setLoading(false);
    }
  };

  // Google sign‑up
  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const u = result.user;

      // dispatch to Redux
      store.dispatch(
        setUser({
          uid: u.uid,
          email: u.email!,
          displayName: u.displayName,
        })
      );

      // optionally write your Firestore doc here if you need more fields
      // ...

      router.replace("/profile");
    } catch (err) {
      setError((err as AuthError).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1623] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-[#1b2538] px-6 py-8 rounded-lg shadow-xl">
        {/* Logo */}
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

        {/* Header */}
        <h1 className="text-2xl font-bold text-[#f3ede0] mb-1">
          Create an account
        </h1>
        <p className="text-[#cfd8e3] mb-6">
          Every month, 100+ users start tracking their behavior. Join them!
        </p>

        {/* Error */}
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        {/* Email/password form */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
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
              className="w-full p-3 rounded border border-[#3a4a6a] bg-[#0d1623] text-[#f3ede0]
                         focus:outline-none focus:ring-2 focus:ring-[#3a4a6a]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[#f3ede0] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full p-3 rounded border border-[#3a4a6a] bg-[#0d1623] text-[#f3ede0]
                         focus:outline-none focus:ring-2 focus:ring-[#3a4a6a]"
            />
          </div>

          {/* First + Last name side‑by‑side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-[#f3ede0] mb-1">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 rounded border border-[#3a4a6a] bg-[#0d1623] text-[#f3ede0]
                           focus:outline-none focus:ring-2 focus:ring-[#3a4a6a]"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-[#f3ede0] mb-1">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 rounded border border-[#3a4a6a] bg-[#0d1623] text-[#f3ede0]
                           focus:outline-none focus:ring-2 focus:ring-[#3a4a6a]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#3a4a6a] text-[#f3ede0]
                       font-semibold rounded hover:bg-[#52607f] transition"
          >
            SIGN UP
          </button>
        </form>

        {/* OR divider */}
        <div className="my-6 flex items-center text-[#cfd8e3]">
          <hr className="flex-grow border-[#3a4a6a]" />
          <span className="px-3">OR</span>
          <hr className="flex-grow border-[#3a4a6a]" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 mb-3
                     border border-[#3a4a6a] rounded hover:bg-[#162137] transition"
        >
          <FaGoogle className="text-xl text-[#f3ede0]" />
          <span className="text-[#f3ede0] font-medium">
            Continue with Google
          </span>
        </button>

        {/* Already have account */}
        <p className="mt-6 text-center text-[#cfd8e3]">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="underline text-[#f3ede0] hover:opacity-80"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

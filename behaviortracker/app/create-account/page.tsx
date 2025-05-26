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
import "@/app/components/CreateAccountPage.css";

export default function CreateAccountPage() {
  const router = useRouter();

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

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
      setStatusKnown(true);
      if (u) router.replace("/profile");
    });
    return () => unsub();
  }, [router]);

  if (!statusKnown) {
    return (
      <div className="">
        <LoadingSpinner />
      </div>
    );
  }
  if (currentUser) {
    return null;
  }

  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(auth.currentUser!, {
        displayName: `${firstName} ${lastName}`,
      });

      store.dispatch(
        setUser({
          uid: cred.user.uid,
          email: cred.user.email!,
          displayName: auth.currentUser!.displayName,
        })
      );

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

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const u = result.user;

      store.dispatch(
        setUser({
          uid: u.uid,
          email: u.email!,
          displayName: u.displayName,
        })
      );

      router.replace("/profile");
    } catch (err) {
      setError((err as AuthError).message);
      setLoading(false);
    }
  };

  return (
    <div className="cap-bg">
      {!statusKnown ? (
        <LoadingSpinner />
      ) : currentUser ? null : (
        <section className="cap-wrapper">
          <header
            className="cap-hero"
            onClick={() => router.replace("/")}
            role="button"
          >
            <Image
              src="/trackingbehaviorlogo2.png"
              alt="Tracking Behavior"
              width={140}
              height={50}
            />

            <h1 className="cap-hero-title">create an account</h1>
            <p className="cap-hero-sub">good to see you joining.</p>
          </header>

          <div className="cap-card">
            {error && <p className="cap-error">{error}</p>}

            <form onSubmit={handleEmailSignUp} className="cap-form">
              <label>
                <span>email</span>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label>
                <span>password</span>
                <input
                  type="password"
                  required
                  placeholder="***********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <div className="cap-name-row">
                <label>
                  <span>first name</span>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>

                <label>
                  <span>last name</span>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </label>
              </div>

              <button type="submit" disabled={loading} className="cap-btn-main">
                sign&nbsp;up
              </button>
            </form>

            <div className="cap-divider">
              <span>or</span>
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="cap-btn-google"
            >
              <FaGoogle />
              continue with google
            </button>

            <p className="cap-login">
              already have an account?{" "}
              <button onClick={() => router.push("/login")}>log&nbsp;in</button>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

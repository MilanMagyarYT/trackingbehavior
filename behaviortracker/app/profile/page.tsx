"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import React from "react";
import { useRouter } from "next/navigation";
import BTNavbar from "../components/BTNavbar";
import BTButton from "../components/BTButton";
import { useAppSelector } from "../store";
import "./Profile.css";

export default function ProfilePage() {
  const router = useRouter();
  const { status } = useAppSelector((s) => s.auth);
  // Handlers
  const startSetup = () => router.push("/start-setup");
  const addNewSession = () => router.push("/add-new-session");
  const viewSessions = () => router.push("/view-sessions");
  const viewRecommendations = () => router.push("/view-recommendations");

  // Example values; replace with dynamic data as needed
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const { uid } = useAppSelector((s) => s.auth); // needed for Firestore
  const sessionsToday = 0;
  const totalUsage = { hours: 0, minutes: 0 };
  const recommendationsCount = 0;

  useEffect(() => {
    const checkSetup = async () => {
      if (!uid) return;
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      console.log(userSnap);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setSetupComplete(!!data.baselineCompletedAt);
      }
    };

    checkSetup();
  }, [uid]);

  if (status === "loading") return <p>Checking login…</p>;

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  return (
    <div>
      <BTNavbar />
      <div className="profile">
        <main className="profile__container">
          <h1 className="profile__title">
            Wish you a great time tracking your behavior
          </h1>

          {!setupComplete && (
            <div className="profile__card">
              <h2 className="profile__card-title">Set-Up Your Account</h2>
              <p className="profile__card-subtitle">
                Step Remaining: Uncompleted
              </p>
              <BTButton text="Start Set-Up" onClick={startSetup} />
            </div>
          )}

          <div className="profile__card">
            <h2 className="profile__card-title">Add a New Session</h2>
            <p className="profile__card-subtitle">
              Sessions Today: {sessionsToday}
            </p>
            <BTButton text="New Session" onClick={addNewSession} />
          </div>

          <div className="profile__card">
            <h2 className="profile__card-title">
              View Today’s Tracked Sessions
            </h2>
            <p className="profile__card-subtitle">
              Total Social Media Usage: {totalUsage.hours} hours{" "}
              {totalUsage.minutes} minutes
            </p>
            <BTButton text="View Your Data" onClick={viewSessions} />
          </div>

          <div className="profile__card">
            <h2 className="profile__card-title">
              View Yesterday’s Usage Recommendations
            </h2>
            <p className="profile__card-subtitle">
              Number of Recommendations: {recommendationsCount}
            </p>
            <BTButton
              text="View Recommendations"
              onClick={viewRecommendations}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

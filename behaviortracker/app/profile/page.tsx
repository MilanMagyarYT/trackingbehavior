"use client";

import { useEffect, useState } from "react";
import { PiHandPalmDuotone } from "react-icons/pi";
import { GiBrain } from "react-icons/gi";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";

import BTNavbar from "@/app/components/BTNavbar";
import BTBottomNav from "@/app/components/BTBottomNav";

import { clamp, lerpColor } from "@/lib/utils";
import "./Profile.css";
import BTSetupBanner from "../components/BTSetupBanner";

interface SessionDoc {
  durMin: number;
  sessionScore: number;
}

export default function ProfilePage() {
  const { uid, status } = useAppSelector((s) => s.auth);
  const router = useRouter();

  const [totalMin, setTotalMin] = useState(0);
  const [prodWeighted, setProdWt] = useState(0);
  const [prodPossible, setProdPos] = useState(0);

  const [goalMin, setGoalMin] = useState<number | null>(null);

  const usageScore = goalMin ? clamp(1 / (totalMin / goalMin), 0, 1) : null;
  const prodScore = prodPossible ? prodWeighted / prodPossible : null;
  const dayScore =
    100 -
    (usageScore !== null && prodScore !== null
      ? ((usageScore + prodScore) / 2) * 100
      : 0);

  const [loading, setLoading] = useState(true);

  const [baselineDone, setBaselineDone] = useState<boolean | null>(null);
  const [showUsageCard, setShowUsageCard] = useState(false);
  const [showBehCard, setShowBehCard] = useState(false);

  const [stats30, setStats30] = useState<{
    usagePct: number;
    behPct: number;
  } | null>(null);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((s) => {
      if (!s.exists()) return;
      const data = s.data();
      setGoalMin(data.goalPhoneMin ?? null);
      setBaselineDone(!!data.baselineCompletedAt);
    });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const q = query(
      collection(db, "users", uid, "sessions"),
      where("createdAt", ">=", Timestamp.fromDate(today)),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      let min = 0,
        wt = 0;
      snap.forEach((doc) => {
        const d = doc.data() as SessionDoc;
        min += d.durMin;
        wt += d.durMin * d.sessionScore;
      });
      setTotalMin(min);
      setProdWt(wt);
      setProdPos(min);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "users", uid, "sessions"),
      where("createdAt", ">=", Timestamp.fromDate(start))
    );

    const unsub = onSnapshot(q, (snap) => {
      let min = 0,
        wt = 0;
      snap.forEach((d) => {
        const s = d.data() as SessionDoc;
        min += s.durMin;
        wt += s.durMin * s.sessionScore;
      });

      const usage30 = goalMin ? clamp(1 / (min / goalMin), 0, 1) : 0;
      const beh30 = min ? wt / min : 0;

      setStats30({
        usagePct: Math.round((1 - usage30) * 100),
        behPct: Math.round(beh30 * 100),
      });
    });

    return () => unsub();
  }, [uid, goalMin]);

  if (status === "loading" || loading) {
    return (
      <div className="acc-loader">
        <div className="acc-spinner" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const R = 140;
  const C = 2 * Math.PI * R;
  const pct = dayScore ?? 0;

  return (
    <div className="has-footer">
      <BTNavbar />
      {baselineDone === false && (
        <div className="notification">
          <BTSetupBanner onClick={() => router.push("/start-setup")} />
        </div>
      )}

      <main className="profile-ct">
        <h1 className="profile-h1">today’s score</h1>
        <p className="profile-date">
          {new Date().toLocaleDateString(undefined, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <div className="donut-wrap">
          <svg width="320" height="320" viewBox="0 0 320 320">
            <circle
              cx="160"
              cy="160"
              r={R}
              stroke="#132032"
              strokeWidth="24"
              fill="#1B2538"
            />

            <circle
              cx="160"
              cy="160"
              r={R}
              stroke={lerpColor("#ffae66", "#fa4617", pct / 100)}
              strokeWidth="24"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct / 100)}
              transform="rotate(-90 160 160)"
              style={{ transition: "stroke-dashoffset .6s ease" }}
            />
          </svg>

          <div className="donut-centre">
            <span className="donut-label">productivity</span>
            <span className="donut-num">
              {dayScore !== null ? Math.round(dayScore) : "0"}
              <span className="donut-pct">%</span>
            </span>
          </div>
        </div>

        <section className="profile-info">
          <h3>USAGE + BEHAVIOR % BASELINE</h3>
          <p>
            tracking behavior calculates how productive your social‑media usage
            is by assessing your daily recorded sessions by comparing it to your
            baseline metrics and behavior.
          </p>
        </section>
        <div className="stat-head">
          <span>productivity statistics</span>
          <span>vs. previous 30 days</span>
        </div>

        <div className="stat-wrap">
          <button
            className="stat-pill"
            onClick={() => {
              setShowUsageCard((v) => !v);
              setShowBehCard(false);
            }}
          >
            <PiHandPalmDuotone className="stat-icon" />
            USAGE
          </button>

          {showUsageCard && stats30 && (
            <div className="stat-dropdown">
              <div className="stat-row">
                <span>today</span>
                <span>{Math.round((1 - (usageScore ?? 0)) * 100)}%</span>
              </div>
              <div className="stat-row">
                <span>last 30 days</span>
                <span>{stats30.usagePct}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="stat-wrap">
          <button
            className="stat-pill"
            onClick={() => {
              setShowBehCard((v) => !v);
              setShowUsageCard(false);
            }}
          >
            <GiBrain className="stat-icon" />
            BEHAVIOR
          </button>

          {showBehCard && stats30 && (
            <div className="stat-dropdown">
              <div className="stat-row">
                <span>today</span>
                <span>{Math.round((prodScore ?? 0) * 100)}%</span>
              </div>
              <div className="stat-row">
                <span>last 30 days</span>
                <span>{stats30.behPct}%</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ height: "2rem" }} />
      </main>
      <BTBottomNav />
    </div>
  );
}

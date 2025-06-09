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
  Timestamp as FirestoreTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";
import BTNavbar from "@/app/components/BTNavbar";
import BTBottomNav from "@/app/components/BTBottomNav";
import BTSetupBanner from "../components/BTSetupBanner";
import { clamp, lerpColor } from "@/lib/utils";
import "./Profile3.css";

interface SessionDoc {
  duration: number;
  rawScore: number;
}

export default function ProfilePage() {
  const { uid, status } = useAppSelector((s) => s.auth);
  const router = useRouter();

  const [totalMinutesToday, setTotalMinutesToday] = useState(0);
  const [prodNumerator, setProdNumerator] = useState(0);
  const [baselineDone, setBaselineDone] = useState<boolean | null>(null);

  const [baselinePhoneLast30Days, setBaselinePhoneLast30Days] = useState<
    number | null
  >(null);
  const [goalPhoneMin, setGoalPhoneMin] = useState<number | null>(null);
  const [baselineProdPct, setBaselineProdPct] = useState<number | null>(null);
  const [goalProdPct, setGoalProdPct] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [showUsageCard, setShowUsageCard] = useState(false);
  const [showBehCard, setShowBehCard] = useState(false);
  const [stats30, setStats30] = useState<{
    usagePct: number;
    behPct: number;
  } | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (!snap.exists()) {
        setMetaLoading(false);
        return;
      }
      const data = snap.data() as {
        baselinePhoneLast30Days?: number;
        goalPhoneMin?: number;
        unprodPct?: number;
        unprodGoalPct?: number;
        baselineCompletedAt?: FirestoreTimestamp | null;
      };
      setBaselinePhoneLast30Days(data.baselinePhoneLast30Days ?? null);
      setGoalPhoneMin(data.goalPhoneMin ?? null);
      if (typeof data.unprodPct === "number")
        setBaselineProdPct(data.unprodPct);
      if (typeof data.unprodGoalPct === "number")
        setGoalProdPct(data.unprodGoalPct);
      setBaselineDone(!!data.baselineCompletedAt);
      setMetaLoading(false);
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    if (goalPhoneMin === null) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, "users", uid, "sessions"),
      where("createdAt", ">=", Timestamp.fromDate(today)),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      let minSum = 0;
      let numSum = 0;
      snap.forEach((doc) => {
        const s = doc.data() as SessionDoc;
        minSum += s.duration;
        const sessionPct = 50 + s.rawScore * 50;
        numSum += sessionPct * s.duration;
      });
      setTotalMinutesToday(minSum);
      setProdNumerator(numSum);
      setLoading(false);
    });
    return () => unsub();
  }, [uid, goalPhoneMin]);

  useEffect(() => {
    if (!uid) return;
    if (goalPhoneMin === null) return;
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, "users", uid, "sessions"),
      where("createdAt", ">=", Timestamp.fromDate(start))
    );
    const unsub = onSnapshot(q, (snap) => {
      let minSum = 0;
      let numSum = 0;
      snap.forEach((doc) => {
        const s = doc.data() as SessionDoc;
        minSum += s.duration;
        const sessionPct = 50 + s.rawScore * 50;
        numSum += sessionPct * s.duration;
      });
      const usagePct = Math.round(minSum / 7);
      const behPct = minSum > 0 ? Math.round(numSum / minSum) : 100;
      setStats30({ usagePct, behPct });
    });
    return () => unsub();
  }, [uid, goalPhoneMin]);

  if (status === "loading" || loading || metaLoading) {
    return (
      <div className="acc-loader">
        <div className="acc-spinner" />
      </div>
    );
  }

  const prodPctToday =
    totalMinutesToday === 0
      ? 100
      : clamp(prodNumerator / totalMinutesToday, 0, 100);
  const usageFracToday = clamp(totalMinutesToday / (goalPhoneMin || 1), 0, 1);

  const R = 140;
  const C = 2 * Math.PI * R;
  const pctTime = usageFracToday * 100;
  const pctProd = prodPctToday;

  return (
    <div className="has-footer">
      <BTNavbar />
      {!metaLoading && baselineDone === null && (
        <div className="notification">
          <BTSetupBanner onClick={() => router.push("/start-setup")} />
        </div>
      )}

      <main className="profile-ct">
        <h1 className="profile-h1">today’s overview</h1>
        <p className="profile-date">
          {new Date().toLocaleDateString(undefined, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <div className="donut-container">
          <div className="donut-wrap">
            <h3 className="donut-title">Usage</h3>
            <svg width="310" height="310" viewBox="0 0 320 320">
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
                stroke="#46547B"
                strokeWidth="4"
                fill="none"
                strokeDasharray={C}
                strokeDashoffset={
                  C * (1 - (baselinePhoneLast30Days || 0) / 100)
                }
                transform="rotate(-90 160 160)"
              />
              <circle
                cx="160"
                cy="160"
                r={R}
                stroke={lerpColor("#ffae66", "#fa4617", pctTime / 100)}
                strokeWidth="24"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pctTime / 100)}
                transform="rotate(-90 160 160)"
                style={{ transition: "stroke-dashoffset .6s ease" }}
              />
            </svg>
            <div className="donut-centre">
              <span className="donut-label">minutes</span>
              <span className="donut-num">{totalMinutesToday}</span>
            </div>
          </div>

          <div className="donut-wrap">
            <h3 className="donut-title">Productivity</h3>
            <svg width="310" height="310" viewBox="0 0 320 320">
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
                stroke="#46547B"
                strokeWidth="4"
                fill="none"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - (baselineProdPct || 0) / 100)}
                transform="rotate(-90 160 160)"
              />
              <circle
                cx="160"
                cy="160"
                r={R}
                stroke="#FA4617"
                strokeWidth="4"
                fill="none"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - (goalProdPct || 0) / 100)}
                transform="rotate(-90 160 160)"
              />
              <circle
                cx="160"
                cy="160"
                r={R}
                stroke={lerpColor("#ffae66", "#fa4617", pctProd / 100)}
                strokeWidth="24"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pctProd / 100)}
                transform="rotate(-90 160 160)"
                style={{ transition: "stroke-dashoffset .6s ease" }}
              />
            </svg>
            <div className="donut-centre">
              <span className="donut-label">percent</span>
              <span className="donut-num">
                {Math.round(pctProd)}
                <span className="donut-pct">%</span>
              </span>
            </div>
          </div>
        </div>

        <section className="profile-info">
          <h3>USAGE & BEHAVIOR % BASELINE</h3>
          <p>
            tracking behavior calculates how productive your social-media usage
            and behavior is by assessing your daily recorded sessions and
            comparing them to your baseline metrics and goals.
          </p>
        </section>

        <div className="stat-head">
          <span>usage statistics</span>
          <span>vs. previous 7 days</span>
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
            TIME
          </button>

          {showUsageCard && stats30 && (
            <div className="stat-dropdown">
              <div className="stat-row">
                <span>today</span>
                <span>{totalMinutesToday}min</span>
              </div>
              <div className="stat-row">
                <span>last 7 days</span>
                <span>{stats30.usagePct}min</span>
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
            QUALITY
          </button>

          {showBehCard && stats30 && (
            <div className="stat-dropdown">
              <div className="stat-row">
                <span>today</span>
                <span>{Math.round(pctProd)}%</span>
              </div>
              <div className="stat-row">
                <span>last 7 days</span>
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

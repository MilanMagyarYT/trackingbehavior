"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BTNavbar from "@/app/components/BTNavbar";
import BTBottomNav from "@/app/components/BTBottomNav";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";
import "@/app/components/Advice.css";
import {
  IoChevronBackCircleOutline,
  IoChevronForwardCircleOutline,
} from "react-icons/io5";

/* ------------------------------------------------------------------
   1. helpers (kept inside the same file to match your coding style)
------------------------------------------------------------------- */

type TimeBucket = "morning" | "afternoon" | "evening" | "night";

interface SessionDoc {
  durMin: number;
  sessionScore: number;
  timeBucket: TimeBucket;
  triggers: string[];
  moodDelta: number;
  contentMajor: string[];
  createdAt: Timestamp;
}

interface Aggregates {
  totalMin: number;
  lateNightMin: number;
  maxSessionMin: number;
  notifPct: number;
  prodMinutes: number;
  unprodMinutes: number;
  prodScore: number; // 0-1
  moodBoostContent: string | null;
}

interface AdviceCard {
  id: string;
  type: "fix" | "keep";
  text: string;
  impactMin?: number;
}

function buildAggregates(rows: SessionDoc[]): Aggregates {
  const totalMin = rows.reduce((s, r) => s + r.durMin, 0);
  const lateNightMin = rows
    .filter((r) => r.timeBucket === "night")
    .reduce((s, r) => s + r.durMin, 0);
  const maxSessionMin =
    rows.length > 0 ? Math.max(...rows.map((r) => r.durMin)) : 0;
  const notifSessions = rows.filter((r) =>
    r.triggers.includes("notification")
  ).length;
  const notifPct = rows.length ? notifSessions / rows.length : 0;

  const prodMinutes = rows
    .filter((r) => r.sessionScore >= 0.6)
    .reduce((s, r) => s + r.durMin, 0);
  const unprodMinutes = totalMin - prodMinutes;
  const prodScore = totalMin ? prodMinutes / totalMin : 0;

  /* mood-boost winner */
  const moodMap: Record<string, number[]> = {};
  rows.forEach((r) =>
    r.contentMajor.forEach((c) => {
      moodMap[c] = (moodMap[c] ?? []).concat(r.moodDelta);
    })
  );
  const moodBoostContent =
    Object.entries(moodMap)
      .map(([k, v]) => ({
        k,
        avg: v.reduce((a, b) => a + b, 0) / v.length,
      }))
      .sort((a, b) => b.avg - a.avg)[0]?.k ?? null;

  return {
    totalMin,
    lateNightMin,
    maxSessionMin,
    notifPct,
    prodMinutes,
    unprodMinutes,
    prodScore,
    moodBoostContent,
  };
}

function pickAdvice(a: Aggregates): AdviceCard[] {
  const cards: AdviceCard[] = [];

  /* R1 — Night-owl */
  if (a.lateNightMin > 0.2 * a.totalMin && a.prodScore < 0.4) {
    cards.push({
      id: "R1",
      type: "fix",
      text: `Night-scrolling cost you ~${a.lateNightMin} min. Try Bedtime Mode after 22 h.`,
      impactMin: a.lateNightMin,
    });
  }

  /* R2 — Notification loop */
  if (a.notifPct > 0.35 && a.prodScore < 0.5) {
    cards.push({
      id: "R2",
      type: "fix",
      text: `Notifications triggered ${Math.round(
        a.notifPct * 100
      )}% of today’s sessions and felt unproductive. Silence non-essential alerts.`,
      impactMin: Math.round(a.notifPct * a.unprodMinutes),
    });
  }

  /* R3 — Long scroll */
  if (a.maxSessionMin >= 30 && a.prodScore < 0.6) {
    cards.push({
      id: "R3",
      type: "fix",
      text: `Your longest session was ${a.maxSessionMin} min and rated low productivity. Set a 15-min timer next time.`,
      impactMin: a.maxSessionMin,
    });
  }

  /* R5 — Mood booster */
  if (a.moodBoostContent) {
    cards.push({
      id: "R5",
      type: "keep",
      text: `${
        a.moodBoostContent[0].toUpperCase() + a.moodBoostContent.slice(1)
      } content boosted your mood 🙂. Schedule a short session tomorrow.`,
    });
  }

  /* rank: top-2 fixes + one keeper if present */
  const fixes = cards
    .filter((c) => c.type === "fix")
    .sort((x, y) => (y.impactMin ?? 0) - (x.impactMin ?? 0))
    .slice(0, 2);
  const keep = cards.find((c) => c.type === "keep");
  return keep ? [...fixes, keep] : fixes;
}

/* ------------------------------------------------------------------
   2. component
------------------------------------------------------------------- */
export default function AdvicePage() {
  const router = useRouter();
  const { uid, status } = useAppSelector((s) => s.auth);

  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, 1 = yesterday …

  /* Redirect if unauthenticated */
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  /* Live Firestore query for the selected day */
  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - dayOffset);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const q = query(
      collection(db, "users", uid, "sessions"),
      where("createdAt", ">=", Timestamp.fromDate(dayStart)),
      where("createdAt", "<", Timestamp.fromDate(dayEnd)),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => d.data() as SessionDoc));
      setLoading(false);
    });
  }, [uid, dayOffset]);

  /* aggregates + advice recomputed whenever `sessions` changes */
  const adviceCards = useMemo(() => {
    const agg = buildAggregates(sessions);
    return pickAdvice(agg);
  }, [sessions]);

  const dateLabel = new Date(Date.now() - dayOffset * 864e5).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  /* --------------- UI --------------- */
  if (status === "loading" || loading) {
    return (
      <div className="acc-loader">
        <div className="acc-spinner" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="advice-page">
      <BTNavbar />

      {/* date navigator (same look as insights) */}
      <div className="advice-date-nav">
        <button
          type="button"
          className="advice-nav-btn"
          onClick={() => setDayOffset((d) => d + 1)}
        >
          <IoChevronBackCircleOutline />
        </button>
        <span className="advice-date-label">{dateLabel}</span>
        <button
          type="button"
          className="advice-nav-btn"
          onClick={() => setDayOffset((d) => Math.max(0, d - 1))}
        >
          <IoChevronForwardCircleOutline />
        </button>
      </div>

      <main className="advice-ct">
        {adviceCards.map((c) => (
          <div key={c.id} className="advice-card">
            {c.text}
          </div>
        ))}

        {adviceCards.length === 0 && (
          <p style={{ marginTop: "1rem" }}>
            no recommendations for this day yet
          </p>
        )}
      </main>

      <BTBottomNav />
    </div>
  );
}

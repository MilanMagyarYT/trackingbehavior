// app/advice/page.tsx

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

  // 1) Late-night scrolling → recommend staying off phone during those hours
  if (a.lateNightMin > 0.2 * a.totalMin && a.prodScore < 0.4) {
    cards.push({
      id: "R1",
      type: "fix",
      text: `You spent about ${a.lateNightMin} min late at night. For a more productive day, stay off your phone entirely during those late-night hours.`,
      impactMin: a.lateNightMin,
    });
  }

  // 2) Notifications leading to unproductive sessions → recommend staying off phone when notified
  if (a.notifPct > 0.35 && a.prodScore < 0.5) {
    cards.push({
      id: "R2",
      type: "fix",
      text: `Notifications triggered ${Math.round(
        a.notifPct * 100
      )}% of yesterday’s sessions and felt unproductive. Instead of checking right away, stay off your phone when a notification arrives.`,
      impactMin: Math.round(a.notifPct * a.unprodMinutes),
    });
  }

  // 3) One very long unproductive session → recommend staying off phone next time
  if (a.maxSessionMin >= 30 && a.prodScore < 0.6) {
    cards.push({
      id: "R3",
      type: "fix",
      text: `Your longest session was ${a.maxSessionMin} min with low productivity. Next time, simply stay off your phone for at least ${a.maxSessionMin} min to break the habit.`,
      impactMin: a.maxSessionMin,
    });
  }

  // 4) Mood-boosting content → keep doing it, but suggest staying off phone longer if already good
  if (a.moodBoostContent) {
    cards.push({
      id: "R5",
      type: "keep",
      text: `${
        a.moodBoostContent[0].toUpperCase() + a.moodBoostContent.slice(1)
      } content boosted your mood 😊. To improve even more tomorrow, try staying off your phone for an extra 10 min before opening any app.`,
    });
  }

  // 5) If overall productivity was already strong → recommend shaving off extra minutes
  if (a.prodScore >= 0.8) {
    cards.push({
      id: "R6",
      type: "keep",
      text: `Great job—your productive minutes were ${Math.round(
        a.prodScore * 100
      )}%. To shave even more off your total, stay off your phone for a 15 min block during your usual heaviest hour.`,
    });
  }

  // Take top two “fix” cards by impactMin, plus one “keep” card if any
  const fixes = cards
    .filter((c) => c.type === "fix")
    .sort((x, y) => (y.impactMin ?? 0) - (x.impactMin ?? 0))
    .slice(0, 2);
  const keep = cards.find((c) => c.type === "keep");
  return keep ? [...fixes, keep] : fixes;
}

export default function AdvicePage() {
  const router = useRouter();
  const { uid, status } = useAppSelector((s) => s.auth);

  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(1); // always show yesterday by default

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

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
          onClick={() => setDayOffset((d) => Math.max(1, d - 1))}
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

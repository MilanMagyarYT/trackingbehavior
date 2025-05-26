"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BTNavbar from "@/app/components/BTNavbar";
import BTBottomNav from "@/app/components/BTBottomNav";
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  Timestamp,
  Query,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";
import "../components/DailyInsights.css";
import {
  IoChevronBackCircleOutline,
  IoChevronForwardCircleOutline,
} from "react-icons/io5";

interface Session {
  durMin: number;
  sessionScore: number;
  createdAt: Timestamp;
  appId: string;
}

type PeriodKey = "morning" | "afternoon" | "evening" | "night";

const periodRanges: Record<PeriodKey, { label: string; hours: number[] }> = {
  morning: { label: "morning (6–11)", hours: [6, 7, 8, 9, 10] },
  afternoon: { label: "afternoon (11–17)", hours: [11, 12, 13, 14, 15, 16] },
  evening: { label: "evening (17–22)", hours: [17, 18, 19, 20, 21] },
  night: { label: "late-night (22–6)", hours: [22, 23, 0, 1, 2, 3, 4, 5] },
};

export default function InsightsPage() {
  const router = useRouter();
  const { uid, status } = useAppSelector((s) => s.auth);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(0);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - dayOffset);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const q: Query = query(
      collection(db, "users", uid, "sessions"),
      where("createdAt", ">=", Timestamp.fromDate(dayStart)),
      where("createdAt", "<", Timestamp.fromDate(dayEnd)),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr: Session[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as Session;
        arr.push({
          durMin: data.durMin,
          sessionScore: data.sessionScore,
          createdAt: data.createdAt,
          appId: data.appId,
        });
      });
      setSessions(arr);
      setLoading(false);
    });

    return () => unsub();
  }, [uid, dayOffset]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const totalMin = sessions.reduce((sum, s) => sum + s.durMin, 0);
  const weightedSum = sessions.reduce(
    (sum, s) => sum + s.durMin * s.sessionScore,
    0
  );
  const prodPct = totalMin ? Math.round((weightedSum / totalMin) * 100) : 0;

  const appData = useMemo(() => {
    const bucket: Record<string, { totalMin: number; weightedSum: number }> =
      {};

    sessions.forEach((s) => {
      if (!bucket[s.appId]) bucket[s.appId] = { totalMin: 0, weightedSum: 0 };
      bucket[s.appId].totalMin += s.durMin;
      bucket[s.appId].weightedSum += s.durMin * s.sessionScore;
    });

    return Object.entries(bucket)
      .map(([appId, { totalMin, weightedSum }]) => ({
        appId,
        totalMin,
        pct: Math.round((weightedSum / totalMin) * 100),
      }))
      .sort((a, b) => b.totalMin - a.totalMin);
  }, [sessions]);

  const periodData = useMemo(() => {
    const buckets: Record<
      PeriodKey,
      { totalMin: number; weightedSum: number }
    > = {
      morning: { totalMin: 0, weightedSum: 0 },
      afternoon: { totalMin: 0, weightedSum: 0 },
      evening: { totalMin: 0, weightedSum: 0 },
      night: { totalMin: 0, weightedSum: 0 },
    };

    sessions.forEach((s) => {
      const hour = new Date(s.createdAt.toDate()).getHours();
      (Object.keys(periodRanges) as PeriodKey[]).forEach((key) => {
        if (periodRanges[key].hours.includes(hour)) {
          buckets[key].totalMin += s.durMin;
          buckets[key].weightedSum += s.durMin * s.sessionScore;
        }
      });
    });

    return (Object.keys(buckets) as PeriodKey[]).map((key) => {
      const { totalMin, weightedSum } = buckets[key];
      return {
        key,
        label: periodRanges[key].label,
        totalMin,
        pct: totalMin ? Math.round((weightedSum / totalMin) * 100) : 0,
      };
    });
  }, [sessions]);

  const dateLabel = new Date(Date.now() - dayOffset * 864e5).toLocaleDateString(
    undefined,
    { day: "numeric", month: "long", year: "numeric" }
  );

  if (status === "loading" || loading) {
    return (
      <div className="acc-loader">
        <div className="acc-spinner" />
      </div>
    );
  }
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="insights-page">
      <BTNavbar />

      <div className="insights-date-nav">
        <button
          type="button"
          className="insights-nav-btn"
          onClick={() => setDayOffset((d) => d + 1)}
        >
          <IoChevronBackCircleOutline />
        </button>
        <span className="insights-date-label">{dateLabel}</span>
        <button
          type="button"
          className="insights-nav-btn"
          onClick={() => setDayOffset((d) => Math.max(0, d - 1))}
        >
          <IoChevronForwardCircleOutline />
        </button>
      </div>

      <div className="insights-summary">
        <div className="summary-block">
          <div className="label">total time spent:</div>
          <div className="value">
            {Math.floor(totalMin / 60)}h {totalMin % 60}m
          </div>
        </div>
        <div className="divider" />
        <div className="summary-block">
          <div className="label">productivity:</div>
          <div className="value">{prodPct}%</div>
        </div>
      </div>

      <h3 className="insights-section-title">usage by time of day</h3>
      <div className="insights-period-grid">
        {periodData.map(({ key, label, totalMin, pct }) => (
          <div key={key} className="period-card">
            <div className="period-label">{label}</div>
            <div className="period-stats">
              <span className="period-time">
                {Math.floor(totalMin / 60)}h {totalMin % 60}m
              </span>
              <span className="period-pct">{pct}%</span>
            </div>
          </div>
        ))}
      </div>

      <h3 className="insights-section-title">applications used today</h3>
      <ul className="insights-app-list">
        {appData.length ? (
          appData.map(({ appId, totalMin, pct }) => (
            <li key={appId} className="insights-app-item">
              <span className="app-name">{appId}</span>
              <span className="app-duration">
                {Math.floor(totalMin / 60)}h {totalMin % 60}m
              </span>
              <span className="app-pct">{pct}%</span>
            </li>
          ))
        ) : (
          <li className="none">no usage today</li>
        )}
      </ul>

      <BTBottomNav />
    </div>
  );
}

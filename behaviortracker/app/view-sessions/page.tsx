// app/(auth)/insights/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BTNavbar from "@/app/components/BTNavbar";
import BTBottomNav from "@/app/components/BTBottomNav";
import LoadingSpinner from "@/app/components/LoadingSpinner";
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import "../components/DailyInsights.css";

interface Session {
  durMin: number;
  sessionScore: number; // 0–1
  createdAt: Timestamp;
  appId: string;
}

export default function InsightsPage() {
  const router = useRouter();
  const { uid, status } = useAppSelector((s) => s.auth);

  // ───── UI state ─────
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(0);

  // ───── Subscribe to “that day” ─────
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
      snap.forEach((d) => {
        const data = d.data() as any;
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

  // ───── Redirect if not authed ─────
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // ───── Derived / memoized data ─────
  const totalMin = sessions.reduce((sum, s) => sum + s.durMin, 0);
  const weightedSum = sessions.reduce(
    (sum, s) => sum + s.durMin * s.sessionScore,
    0
  );
  const prodPct = totalMin ? Math.round((weightedSum / totalMin) * 100) : 0;

  const chartData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}`,
      usage: 0,
    }));
    sessions.forEach((s) => {
      const h = new Date(s.createdAt.toDate()).getHours();
      buckets[h].usage += s.durMin;
    });
    return buckets;
  }, [sessions]);

  const apps = useMemo(() => {
    const byApp: Record<string, { dur: number; scoreSum: number }> = {};
    sessions.forEach((s) => {
      if (!byApp[s.appId]) byApp[s.appId] = { dur: 0, scoreSum: 0 };
      byApp[s.appId].dur += s.durMin;
      byApp[s.appId].scoreSum += s.durMin * s.sessionScore;
    });
    return Object.entries(byApp).map(([appId, { dur, scoreSum }]) => ({
      appId,
      dur,
      pct: dur ? Math.round((scoreSum / dur) * 100) : 0,
    }));
  }, [sessions]);

  const dateLabel = new Date(Date.now() - dayOffset * 864e5).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  // ───── Now we can safely do our early returns ─────
  if (status === "loading" || loading) {
    return (
      <div className="insights-loader">
        <LoadingSpinner />
      </div>
    );
  }
  if (status === "unauthenticated") {
    return null;
  }

  // ───── Finally: the UI ─────
  return (
    <div className="insights-page">
      <BTNavbar />

      {/* Date nav */}
      <div className="insights-date-nav">
        <button onClick={() => setDayOffset((d) => d + 1)}>‹</button>
        <span>{dateLabel}</span>
        <button onClick={() => setDayOffset((d) => Math.max(0, d - 1))}>
          ›
        </button>
      </div>

      {/* Summary */}
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

      {/* Bar chart */}
      <h3 className="insights-section-title">usage chart</h3>
      <div className="insights-chart">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 0, left: 0, bottom: 8 }}
          >
            {/* soft horizontal grid lines only */}
            <CartesianGrid stroke="#2A3D60" vertical={false} />

            {/* hide the Y‐axis labels, just keep domain lines */}
            <YAxis
              hide={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6F7A8A", fontSize: 12 }}
              stroke="#6F7A8A"
              domain={[0, 60]}
              interval="preserveStartEnd"
            />

            {/* hour labels */}
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6F7A8A", fontSize: 12 }}
              interval={Math.floor(chartData.length / 7)}
            />

            <Tooltip
              contentStyle={{
                background: "#1B2538",
                border: "none",
                borderRadius: 8,
              }}
              labelStyle={{ color: "#F3EDE0" }}
              itemStyle={{ color: "#FA4617" }}
            />

            {/* thick rounded orange bars */}
            <Bar
              dataKey="usage"
              fill="#FA4617"
              barSize={16}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* App list */}
      <h3 className="insights-section-title">applications used today</h3>
      <ul className="insights-app-list">
        {apps.length ? (
          apps.map((a) => (
            <li key={a.appId} className="insights-app-item">
              <span className="app-name">{a.appId}</span>
              <span className="app-duration">
                {Math.floor(a.dur / 60)}h {a.dur % 60}m
              </span>
              <span className="app-pct">{a.pct}%</span>
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

"use client";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";

import "./BTMonthCalendar.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* ---------- helper: local YYYY-MM-DD key ---------- */
function dateKey(d: Date): string {
  const tz =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Amsterdam";
  return d.toLocaleDateString("sv-SE", { timeZone: tz }); // "2025-06-07"
}
type DayAgg = { minutes: number; numSum: number };

export default function BTMonthCalendar() {
  /* ---------- auth ---------- */
  const { uid } = useAppSelector((s) => s.auth);

  /* ---------- view-month ---------- */
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0–11

  /* ---------- baseline & goals ---------- */
  const [baselineAt, setBaselineAt] = useState<Date | null>(null);
  const [goalPhoneMin, setGoalPhoneMin] = useState<number | null>(null);
  const [goalProdPct, setGoalProdPct] = useState<number | null>(null);

  /* ---------- per-day aggregates ---------- */
  const [dayMap, setDayMap] = useState<Record<string, DayAgg>>({});

  /* ---------- selected-day ---------- */
  const [selected, setSelected] = useState<{
    date: Date;
    minutes: number;
    prodPct: number | null;
  } | null>(null);

  useEffect(() => setSelected(null), [viewMonth, viewYear]);

  /* ---------- month boundaries ---------- */
  const { first, last, daysInMonth } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    return { first: firstDay, last: lastDay, daysInMonth: lastDay.getDate() };
  }, [viewYear, viewMonth]);

  /* ---------- fetch baseline ---------- */
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return;
      const d = snap.data() as {
        baselineCompletedAt?: Timestamp | null;
        goalPhoneMin?: number;
        unprodGoalPct?: number;
      };
      if (d.baselineCompletedAt) {
        const b = d.baselineCompletedAt.toDate(); // original Date
        const midnight = new Date(b.getFullYear(), b.getMonth(), b.getDate());
        setBaselineAt(midnight); // 00:00 of that day
      } else {
        setBaselineAt(null);
      }
      setGoalPhoneMin(d.goalPhoneMin ?? null);
      setGoalProdPct(d.unprodGoalPct ?? null);
    })();
  }, [uid]);

  /* ---------- fetch sessions for view month ---------- */
  useEffect(() => {
    if (!uid) return;
    const start = new Date(first);
    start.setHours(0, 0, 0, 0);
    const end = new Date(last);
    end.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "users", uid, "sessions"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<=", Timestamp.fromDate(end))
    );

    getDocs(q).then((snap) => {
      const tmp: Record<string, DayAgg> = {};
      snap.forEach((d) => {
        const s = d.data() as {
          duration: number;
          rawScore: number;
          createdAt: Timestamp;
        };
        const k = dateKey(s.createdAt.toDate());
        const min = s.duration;
        const pct = 50 + s.rawScore * 50;

        tmp[k] = tmp[k]
          ? { minutes: tmp[k].minutes + min, numSum: tmp[k].numSum + pct * min }
          : { minutes: min, numSum: pct * min };
      });
      setDayMap(tmp);
    });
  }, [uid, first, last]);

  /* ---------- colour logic ---------- */
  const colourForDay = (day: number): "green" | "yellow" | "red" | "none" => {
    if (goalPhoneMin == null || goalProdPct == null || baselineAt == null)
      return "none";

    const d = new Date(viewYear, viewMonth, day);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    /* NEW: today is undecided → no colour */
    if (d >= todayMidnight) return "none";

    if (d < baselineAt) return "none";

    const agg = dayMap[dateKey(d)];
    if (!agg) return "yellow";

    const minutes = agg.minutes;
    const prodPct = Math.round(minutes ? agg.numSum / minutes : 100);
    const usageOk = minutes <= goalPhoneMin;
    const prodOk = prodPct >= goalProdPct;
    const lowUsage = minutes < 0.25 * goalPhoneMin;
    console.log(goalPhoneMin, prodPct, usageOk, prodOk, lowUsage);
    if (lowUsage) return "yellow";
    if (usageOk && prodOk) return "green";
    return "red";
  };

  /* ---------- helpers ---------- */
  const firstWeekday = first.getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array(daysInMonth)
      .fill(null)
      .map((_, i) => i + 1),
  ];

  const prevMonth = () => {
    setViewMonth((m) => (m === 0 ? 11 : m - 1));
    if (viewMonth === 0) setViewYear((y) => y - 1);
  };
  const nextMonth = () => {
    setViewMonth((m) => (m === 11 ? 0 : m + 1));
    if (viewMonth === 11) setViewYear((y) => y + 1);
  };

  const handleSelectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);

    if (
      selected &&
      selected.date.getFullYear() === d.getFullYear() &&
      selected.date.getMonth() === d.getMonth() &&
      selected.date.getDate() === d.getDate()
    ) {
      setSelected(null); // toggle off
      return;
    }

    const agg = dayMap[dateKey(d)];
    setSelected({
      date: d,
      minutes: agg ? agg.minutes : 0,
      prodPct: agg && agg.minutes ? agg.numSum / agg.minutes : null,
    });
  };

  /* ---------- render ---------- */
  return (
    <div className="bt-cal-wrap">
      <header className="bt-cal-header">
        <button onClick={prevMonth} aria-label="previous month">
          ‹
        </button>
        <span>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} aria-label="next month">
          ›
        </button>
      </header>

      <div className="bt-cal-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
          <div key={w} className="bt-cal-head">
            {w}
          </div>
        ))}

        {cells.map((d, i) =>
          d ? (
            <button
              key={i}
              className={`bt-cal-cell ${colourForDay(d)}`}
              onClick={() => handleSelectDay(d)}
            >
              {d}
            </button>
          ) : (
            <div key={i} className="bt-cal-cell empty" />
          )
        )}
      </div>

      {selected && (
        <aside className="bt-day-info">
          <h4>
            {selected.date.toLocaleDateString(undefined, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </h4>

          {selected.prodPct === null ? (
            <p>no data recorded</p>
          ) : (
            <>
              <p>
                <strong>{selected.minutes}</strong> minutes
              </p>
              <p>
                <strong>{Math.round(selected.prodPct)}%</strong> productivity
              </p>
            </>
          )}
        </aside>
      )}
    </div>
  );
}

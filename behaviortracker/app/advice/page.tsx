"use client";

import React, { useEffect, useState, useMemo } from "react";
import BTNavbar from "@/app/components/BTNavbar";
import BTBottomNav from "@/app/components/BTBottomNav";
import {
  collection,
  onSnapshot,
  query,
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
  appId: string;
  durMin: number;
  sessionScore: number; // actual productivity 0–1
  prodSelf: number; // user’s self-rating -2..2 (optional for stats)
  timeBucket: TimeBucket;
  trigger: string;
  engagement: string;
  goalPrimary: string;
  contentMajor: string;
  location: string;
  multitask: string; // "none" or other label
  moodDifference: number; // -2..2
  createdAt: Timestamp;
}

interface PerAppMetrics {
  totalMin: number;
  totalScore: number;
  sessions: number;
}

interface Distribution {
  under5: number;
  between5and15: number;
  between15and45: number;
  over45: number;
}

interface ByBucket {
  [key: string]: { totalMin: number; totalScore: number; sessions: number };
}

interface Aggregates {
  totalMin: number;
  lateNightMin: number;
  maxSessionMin: number;
  notifPct: number;
  prodMinutes: number;
  unprodMinutes: number;
  prodScore: number;
  moodBoostContent: string | null;
}

interface AdviceCard {
  id: string;
  type: "fix" | "keep";
  text: string;
  impactMin?: number;
}

export default function StatsPage() {
  const { uid, status } = useAppSelector((s) => s.auth);

  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [dayOffset, setDayOffset] = useState(0);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const q = query(
      collection(db, "users", uid, "sessions"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => d.data() as SessionDoc));
      setLoading(false);
    });
  }, [uid]);

  function buildAggregates(rows: SessionDoc[]): Aggregates {
    const totalMin = rows.reduce((sum, r) => sum + r.durMin, 0);
    const lateNightMin = rows
      .filter((r) => r.timeBucket === "night")
      .reduce((sum, r) => sum + r.durMin, 0);
    const maxSessionMin =
      rows.length > 0 ? Math.max(...rows.map((r) => r.durMin)) : 0;

    const notifSessions = rows.filter(
      (r) => r.trigger === "notification"
    ).length;
    const notifPct = rows.length > 0 ? notifSessions / rows.length : 0;

    const prodMinutes = rows
      .filter((r) => r.sessionScore >= 0.6)
      .reduce((sum, r) => sum + r.durMin, 0);
    const unprodMinutes = totalMin - prodMinutes;
    const prodScore = totalMin > 0 ? prodMinutes / totalMin : 0;

    const moodMap: Record<string, number[]> = {};
    rows.forEach((r) => {
      const c = r.contentMajor;
      if (!moodMap[c]) moodMap[c] = [];
      moodMap[c].push(r.moodDifference);
    });
    const moodBoostContent =
      Object.entries(moodMap)
        .map(([k, arr]) => ({
          k,
          avg: arr.reduce((a, b) => a + b, 0) / arr.length,
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

  // Generate advice cards from those aggregates
  function pickAdvice(a: Aggregates): AdviceCard[] {
    const cards: AdviceCard[] = [];

    // (1) Late-night
    if (a.lateNightMin > 0.2 * a.totalMin && a.prodScore < 0.4) {
      cards.push({
        id: "R1",
        type: "fix",
        text: `You spent about ${a.lateNightMin} min late at night. For a more productive day, stay off your phone entirely during those late-night hours.`,
        impactMin: a.lateNightMin,
      });
    }

    // (2) Notifications
    if (a.notifPct > 0.35 && a.prodScore < 0.5) {
      cards.push({
        id: "R2",
        type: "fix",
        text: `Notifications triggered ${Math.round(
          a.notifPct * 100
        )}% of this day’s sessions and felt unproductive. Instead of checking immediately, stay off your phone when a notification arrives.`,
        impactMin: Math.round(a.notifPct * a.unprodMinutes),
      });
    }

    // (3) Long unproductive session
    if (a.maxSessionMin >= 30 && a.prodScore < 0.6) {
      cards.push({
        id: "R3",
        type: "fix",
        text: `Your longest session was ${a.maxSessionMin} min with low productivity. Next time, simply stay off your phone for at least ${a.maxSessionMin} min to break the habit.`,
        impactMin: a.maxSessionMin,
      });
    }

    // (4) Mood-boosting content
    if (a.moodBoostContent) {
      cards.push({
        id: "R5",
        type: "keep",
        text: `${
          a.moodBoostContent[0].toUpperCase() + a.moodBoostContent.slice(1)
        } content boosted your mood 😊. To improve even more tomorrow, try staying off your phone for an extra 10 min before opening any app.`,
      });
    }

    // (5) If overall productivity was already strong
    if (a.prodScore >= 0.8) {
      cards.push({
        id: "R6",
        type: "keep",
        text: `Great job—your productive minutes were ${Math.round(
          a.prodScore * 100
        )}%. To shave even more off your total, stay off your phone for a 15 min block during your usual heaviest hour.`,
      });
    }

    // Return top two “fix” sorted by impactMin, plus one “keep”
    const fixes = cards
      .filter((c) => c.type === "fix")
      .sort((x, y) => (y.impactMin ?? 0) - (x.impactMin ?? 0))
      .slice(0, 2);
    const keep = cards.find((c) => c.type === "keep");
    return keep ? [...fixes, keep] : fixes;
  }

  // Everything below is computed “for that selected day only”
  const metrics = useMemo(() => {
    // If no sessions at all, return defaults
    if (sessions.length === 0) {
      return {
        mostUsedApp: "",
        mostUsedMin: 0,
        leastProdApp: "",
        leastProdValue: 0,
        distribution: {
          under5: 0,
          between5and15: 0,
          between15and45: 0,
          over45: 0,
        },
        mostBucket: "",
        mostBucketMin: 0,
        worstBucket: "",
        worstBucketScore: 0,
        topTrigger: "",
        topTriggerMin: 0,
        worstTrigger: "",
        worstTriggerScore: 0,
        topGoal: "",
        topGoalMin: 0,
        worstGoal: "",
        worstGoalScore: 0,
        topEng: "",
        topEngMin: 0,
        worstEng: "",
        worstEngScore: 0,
        topContent: "",
        topContentMin: 0,
        worstContent: "",
        worstContentScore: 0,
        topLoc: "",
        topLocMin: 0,
        worstLoc: "",
        worstLocScore: 0,
        multitaskMin: 0,
        avgMultiScore: 0,
        noMultiMin: 0,
        avgNoMultiScore: 0,
        avgPerceivedDiff: 0,
        negMoodMin: 0,
        avgNegMoodScore: 0,
        posMoodMin: 0,
        avgPosMoodScore: 0,
        moodScoreDiff: 0,
        dayAdvice: [] as AdviceCard[],
        dayLabel: "",
      };
    }

    // 1) Determine the date range for the selected day
    const now = new Date();
    const dayStart = new Date();
    dayStart.setDate(now.getDate() - dayOffset);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // Filter sessions to exactly that day
    const filtered = sessions.filter((r) => {
      const d = r.createdAt.toDate();
      return d >= dayStart && d < dayEnd;
    });

    // If there are no sessions on that day, return defaults + dayLabel
    if (filtered.length === 0) {
      const dayLabel = dayStart.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return {
        mostUsedApp: "",
        mostUsedMin: 0,
        leastProdApp: "",
        leastProdValue: 0,
        distribution: {
          under5: 0,
          between5and15: 0,
          between15and45: 0,
          over45: 0,
        },
        mostBucket: "",
        mostBucketMin: 0,
        worstBucket: "",
        worstBucketScore: 0,
        topTrigger: "",
        topTriggerMin: 0,
        worstTrigger: "",
        worstTriggerScore: 0,
        topGoal: "",
        topGoalMin: 0,
        worstGoal: "",
        worstGoalScore: 0,
        topEng: "",
        topEngMin: 0,
        worstEng: "",
        worstEngScore: 0,
        topContent: "",
        topContentMin: 0,
        worstContent: "",
        worstContentScore: 0,
        topLoc: "",
        topLocMin: 0,
        worstLoc: "",
        worstLocScore: 0,
        multitaskMin: 0,
        avgMultiScore: 0,
        noMultiMin: 0,
        avgNoMultiScore: 0,
        avgPerceivedDiff: 0,
        negMoodMin: 0,
        avgNegMoodScore: 0,
        posMoodMin: 0,
        avgPosMoodScore: 0,
        moodScoreDiff: 0,
        dayAdvice: [] as AdviceCard[],
        dayLabel,
      };
    }

    // 2) Compute “by-app” metrics for that filtered list
    const byApp: Record<string, PerAppMetrics> = {};
    filtered.forEach((r) => {
      if (!byApp[r.appId]) {
        byApp[r.appId] = { totalMin: 0, totalScore: 0, sessions: 0 };
      }
      byApp[r.appId].totalMin += r.durMin;
      byApp[r.appId].totalScore += r.sessionScore;
      byApp[r.appId].sessions += 1;
    });
    let mostUsedApp = "";
    let mostUsedMin = -1;
    let leastProdApp = "";
    let leastProdValue = Infinity;
    Object.entries(byApp).forEach(([appId, data]) => {
      if (data.totalMin > mostUsedMin) {
        mostUsedMin = data.totalMin;
        mostUsedApp = appId;
      }
      const avgScore = data.totalScore / data.sessions;
      if (avgScore < leastProdValue) {
        leastProdValue = avgScore;
        leastProdApp = appId;
      }
    });

    // 3) Session-length distribution (count of sessions)
    const distribution: Distribution = {
      under5: 0,
      between5and15: 0,
      between15and45: 0,
      over45: 0,
    };
    filtered.forEach((r) => {
      if (r.durMin < 5) distribution.under5 += 1;
      else if (r.durMin < 15) distribution.between5and15 += 1;
      else if (r.durMin < 45) distribution.between15and45 += 1;
      else distribution.over45 += 1;
    });

    // 4) By-timeBucket
    const byBucket: ByBucket = {};
    filtered.forEach((r) => {
      const b = r.timeBucket;
      if (!byBucket[b]) {
        byBucket[b] = { totalMin: 0, totalScore: 0, sessions: 0 };
      }
      byBucket[b].totalMin += r.durMin;
      byBucket[b].totalScore += r.sessionScore;
      byBucket[b].sessions += 1;
    });
    let mostBucket = "";
    let mostBucketMin = -1;
    let worstBucket = "";
    let worstBucketScore = Infinity;
    Object.entries(byBucket).forEach(([bucket, data]) => {
      if (data.totalMin > mostBucketMin) {
        mostBucketMin = data.totalMin;
        mostBucket = bucket;
      }
      const avg = data.totalScore / data.sessions;
      if (avg < worstBucketScore) {
        worstBucketScore = avg;
        worstBucket = bucket;
      }
    });

    // 5) By-trigger
    const byTrigger: ByBucket = {};
    filtered.forEach((r) => {
      const t = r.trigger;
      if (!byTrigger[t]) {
        byTrigger[t] = { totalMin: 0, totalScore: 0, sessions: 0 };
      }
      byTrigger[t].totalMin += r.durMin;
      byTrigger[t].totalScore += r.sessionScore;
      byTrigger[t].sessions += 1;
    });
    let topTrigger = "";
    let topTriggerMin = -1;
    let worstTrigger = "";
    let worstTriggerScore = Infinity;
    Object.entries(byTrigger).forEach(([trigger, data]) => {
      if (data.totalMin > topTriggerMin) {
        topTriggerMin = data.totalMin;
        topTrigger = trigger;
      }
      const avg = data.totalScore / data.sessions;
      if (avg < worstTriggerScore) {
        worstTriggerScore = avg;
        worstTrigger = trigger;
      }
    });

    // 6) By-goalPrimary
    const byGoal: ByBucket = {};
    filtered.forEach((r) => {
      const g = r.goalPrimary;
      if (!byGoal[g]) {
        byGoal[g] = { totalMin: 0, totalScore: 0, sessions: 0 };
      }
      byGoal[g].totalMin += r.durMin;
      byGoal[g].totalScore += r.sessionScore;
      byGoal[g].sessions += 1;
    });
    let topGoal = "";
    let topGoalMin = -1;
    let worstGoal = "";
    let worstGoalScore = Infinity;
    Object.entries(byGoal).forEach(([goal, data]) => {
      if (data.totalMin > topGoalMin) {
        topGoalMin = data.totalMin;
        topGoal = goal;
      }
      const avg = data.totalScore / data.sessions;
      if (avg < worstGoalScore) {
        worstGoalScore = avg;
        worstGoal = goal;
      }
    });

    // 7) By-engagement
    const byEng: ByBucket = {};
    filtered.forEach((r) => {
      const e = r.engagement;
      if (!byEng[e]) {
        byEng[e] = { totalMin: 0, totalScore: 0, sessions: 0 };
      }
      byEng[e].totalMin += r.durMin;
      byEng[e].totalScore += r.sessionScore;
      byEng[e].sessions += 1;
    });
    let topEng = "";
    let topEngMin = -1;
    let worstEng = "";
    let worstEngScore = Infinity;
    Object.entries(byEng).forEach(([eng, data]) => {
      if (data.totalMin > topEngMin) {
        topEngMin = data.totalMin;
        topEng = eng;
      }
      const avg = data.totalScore / data.sessions;
      if (avg < worstEngScore) {
        worstEngScore = avg;
        worstEng = eng;
      }
    });

    // 8) By-contentMajor
    const byContent: ByBucket = {};
    filtered.forEach((r) => {
      const c = r.contentMajor;
      if (!byContent[c]) {
        byContent[c] = { totalMin: 0, totalScore: 0, sessions: 0 };
      }
      byContent[c].totalMin += r.durMin;
      byContent[c].totalScore += r.sessionScore;
      byContent[c].sessions += 1;
    });
    let topContent = "";
    let topContentMin = -1;
    let worstContent = "";
    let worstContentScore = Infinity;
    Object.entries(byContent).forEach(([cont, data]) => {
      if (data.totalMin > topContentMin) {
        topContentMin = data.totalMin;
        topContent = cont;
      }
      const avg = data.totalScore / data.sessions;
      if (avg < worstContentScore) {
        worstContentScore = avg;
        worstContent = cont;
      }
    });

    // 9) By-location
    const byLoc: ByBucket = {};
    filtered.forEach((r) => {
      const l = r.location;
      if (!byLoc[l]) {
        byLoc[l] = { totalMin: 0, totalScore: 0, sessions: 0 };
      }
      byLoc[l].totalMin += r.durMin;
      byLoc[l].totalScore += r.sessionScore;
      byLoc[l].sessions += 1;
    });
    let topLoc = "";
    let topLocMin = -1;
    let worstLoc = "";
    let worstLocScore = Infinity;
    Object.entries(byLoc).forEach(([loc, data]) => {
      if (data.totalMin > topLocMin) {
        topLocMin = data.totalMin;
        topLoc = loc;
      }
      const avg = data.totalScore / data.sessions;
      if (avg < worstLocScore) {
        worstLocScore = avg;
        worstLoc = loc;
      }
    });

    // 10) Multitasking vs non-multitasking
    let multitaskMin = 0;
    let multitaskScoreSum = 0;
    let multitaskCount = 0;
    let noMultiMin = 0;
    let noMultiScoreSum = 0;
    let noMultiCount = 0;
    filtered.forEach((r) => {
      if (r.multitask === "none") {
        noMultiMin += r.durMin;
        noMultiScoreSum += r.sessionScore;
        noMultiCount += 1;
      } else {
        multitaskMin += r.durMin;
        multitaskScoreSum += r.sessionScore;
        multitaskCount += 1;
      }
    });
    const avgMultiScore = multitaskCount
      ? multitaskScoreSum / multitaskCount
      : 0;
    const avgNoMultiScore = noMultiCount ? noMultiScoreSum / noMultiCount : 0;

    // 11) Perceived vs actual productivity difference
    let diffSum = 0;
    filtered.forEach((r) => {
      const perceived = (r.prodSelf + 2) / 4; // map -2..2 → 0..1
      diffSum += perceived - r.sessionScore;
    });
    const avgPerceivedDiff = filtered.length ? diffSum / filtered.length : 0;

    // 12) Mood drop vs boost
    let negMoodMin = 0;
    let negMoodScoreSum = 0;
    let negMoodCount = 0;
    let posMoodMin = 0;
    let posMoodScoreSum = 0;
    let posMoodCount = 0;
    filtered.forEach((r) => {
      if (r.moodDifference < 0) {
        negMoodMin += r.durMin;
        negMoodScoreSum += r.sessionScore;
        negMoodCount += 1;
      } else if (r.moodDifference > 0) {
        posMoodMin += r.durMin;
        posMoodScoreSum += r.sessionScore;
        posMoodCount += 1;
      }
    });
    const avgNegMoodScore = negMoodCount ? negMoodScoreSum / negMoodCount : 0;
    const avgPosMoodScore = posMoodCount ? posMoodScoreSum / posMoodCount : 0;
    const moodScoreDiff = avgPosMoodScore - avgNegMoodScore;

    // 13) "Advice for that day"
    const dayAgg = buildAggregates(filtered);
    const dayAdvice = pickAdvice(dayAgg);

    const dayLabel = dayStart.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return {
      mostUsedApp,
      mostUsedMin,
      leastProdApp,
      leastProdValue,
      distribution,
      mostBucket,
      mostBucketMin,
      worstBucket,
      worstBucketScore,
      topTrigger,
      topTriggerMin,
      worstTrigger,
      worstTriggerScore,
      topGoal,
      topGoalMin,
      worstGoal,
      worstGoalScore,
      topEng,
      topEngMin,
      worstEng,
      worstEngScore,
      topContent,
      topContentMin,
      worstContent,
      worstContentScore,
      topLoc,
      topLocMin,
      worstLoc,
      worstLocScore,
      multitaskMin,
      avgMultiScore,
      noMultiMin,
      avgNoMultiScore,
      avgPerceivedDiff,
      negMoodMin,
      avgNegMoodScore,
      posMoodMin,
      avgPosMoodScore,
      moodScoreDiff,
      dayAdvice,
      dayLabel,
    };
  }, [sessions, dayOffset]);

  // Destructure from metrics
  const {
    mostUsedApp,
    mostUsedMin,
    leastProdApp,
    leastProdValue,
    distribution,
    mostBucket,
    mostBucketMin,
    worstBucket,
    worstBucketScore,
    topTrigger,
    topTriggerMin,
    worstTrigger,
    worstTriggerScore,
    topGoal,
    topGoalMin,
    worstGoal,
    worstGoalScore,
    topEng,
    topEngMin,
    worstEng,
    worstEngScore,
    topContent,
    topContentMin,
    worstContent,
    worstContentScore,
    topLoc,
    topLocMin,
    worstLoc,
    worstLocScore,
    multitaskMin,
    avgMultiScore,
    noMultiMin,
    avgNoMultiScore,
    avgPerceivedDiff,
    negMoodMin,
    avgNegMoodScore,
    posMoodMin,
    avgPosMoodScore,
    moodScoreDiff,
    dayAdvice,
    dayLabel,
  } = metrics;

  if (status === "loading" || loading) {
    return (
      <div className="acc-loader">
        <div className="acc-spinner" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="stats-page">
      <BTNavbar />

      {/* ------------ Day Selector at Top ------------ */}
      <div className="advice-date-nav">
        <button
          type="button"
          className="advice-nav-btn"
          onClick={() => setDayOffset((d) => d + 1)}
        >
          <IoChevronBackCircleOutline />
        </button>
        <span className="advice-date-label">{dayLabel}</span>
        <button
          type="button"
          className="advice-nav-btn"
          onClick={() => setDayOffset((d) => Math.max(0, d - 1))}
        >
          <IoChevronForwardCircleOutline />
        </button>
      </div>

      <main className="stats-ct">
        <h1>Usage & Productivity Overview</h1>

        <section className="stats-section">
          <h2>Apps</h2>
          <p>
            <strong>Most used app:</strong> {mostUsedApp} ({mostUsedMin} min
            total)
          </p>
          <p>
            <strong>Least productive app:</strong> {leastProdApp} (
            {Math.round(leastProdValue * 100)}% avg productivity)
          </p>
        </section>

        <section className="stats-section">
          <h2>Session Length Distribution</h2>
          <ul>
            <li>Under 5 min: {distribution.under5} sessions</li>
            <li>5–15 min: {distribution.between5and15} sessions</li>
            <li>15–45 min: {distribution.between15and45} sessions</li>
            <li>Over 45 min: {distribution.over45} sessions</li>
          </ul>
        </section>

        <section className="stats-section">
          <h2>Time of Day</h2>
          <p>
            <strong>Most usage:</strong> {mostBucket} ({mostBucketMin} min)
          </p>
          <p>
            <strong>Worst productivity:</strong> {worstBucket} (
            {Math.round(worstBucketScore * 100)}% avg)
          </p>
        </section>

        <section className="stats-section">
          <h2>Triggers</h2>
          <p>
            <strong>Trigger causing most usage:</strong> {topTrigger} (
            {topTriggerMin} min)
          </p>
          <p>
            <strong>Trigger with worst productivity:</strong> {worstTrigger} (
            {Math.round(worstTriggerScore * 100)}%)
          </p>
        </section>

        <section className="stats-section">
          <h2>Goals</h2>
          <p>
            <strong>Most time on goal:</strong> {topGoal} ({topGoalMin} min)
          </p>
          <p>
            <strong>Worst productivity goal:</strong> {worstGoal} (
            {Math.round(worstGoalScore * 100)}% )
          </p>
        </section>

        <section className="stats-section">
          <h2>Activities</h2>
          <p>
            <strong>Most time on activity:</strong> {topEng} ({topEngMin} min)
          </p>
          <p>
            <strong>Worst productivity activity:</strong> {worstEng} (
            {Math.round(worstEngScore * 100)}% )
          </p>
        </section>

        <section className="stats-section">
          <h2>Content Types</h2>
          <p>
            <strong>Most time on content:</strong> {topContent} ({topContentMin}{" "}
            min)
          </p>
          <p>
            <strong>Worst productivity content:</strong> {worstContent} (
            {Math.round(worstContentScore * 100)}% )
          </p>
        </section>

        <section className="stats-section">
          <h2>Locations</h2>
          <p>
            <strong>Most usage location:</strong> {topLoc} ({topLocMin} min)
          </p>
          <p>
            <strong>Worst productivity location:</strong> {worstLoc} (
            {Math.round(worstLocScore * 100)}% )
          </p>
        </section>

        <section className="stats-section">
          <h2>Multitasking vs Non-Multitasking</h2>
          <p>
            <strong>Time multi-tasking:</strong> {multitaskMin} min (
            {Math.round(avgMultiScore * 100)}% avg prod)
          </p>
          <p>
            <strong>Time not multi-tasking:</strong> {noMultiMin} min (
            {Math.round(avgNoMultiScore * 100)}% avg prod)
          </p>
        </section>

        <section className="stats-section">
          <h2>Perceived vs Actual Productivity</h2>
          <p>
            On average, your perceived–actual productivity difference was
            {avgPerceivedDiff.toFixed(2)} (on a 0–1 scale).
          </p>
        </section>

        <section className="stats-section">
          <h2>Mood Impact</h2>
          <p>
            <strong>Time in negative mood:</strong> {negMoodMin} min (
            {Math.round(avgNegMoodScore * 100)}% avg prod)
          </p>
          <p>
            <strong>Time in positive mood:</strong> {posMoodMin} min (
            {Math.round(avgPosMoodScore * 100)}% avg prod)
          </p>
          <p>
            Productivity difference (positive minus negative):
            {Math.round(moodScoreDiff * 100)}%
          </p>
        </section>

        {/* ---------------- Advice for This Day ---------------- */}
        <section className="stats-section">
          <h2>Advice for {dayLabel}</h2>
          {dayAdvice.map((card) => (
            <div key={card.id} className="advice-card">
              {card.text}
            </div>
          ))}
          {dayAdvice.length === 0 && (
            <p style={{ marginTop: "1rem" }}>
              no recommendations for this day yet
            </p>
          )}
        </section>
      </main>

      <BTBottomNav />
    </div>
  );
}

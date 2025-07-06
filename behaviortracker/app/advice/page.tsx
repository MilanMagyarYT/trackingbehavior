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

import DaySelector from "../components/DaySelector";
import StatsDetails from "../components/StatsDetails";

type TimeBucket = "morning" | "afternoon" | "evening" | "night";

interface SessionDoc {
  appId: string;
  duration: number;
  rawScore: number;
  prodSelf: number;
  timeBucket: TimeBucket;
  trigger: string;
  engagement: string;
  goalPrimary: string;
  contentMajor: string;
  location: string;
  multitask: string;
  moodDifference: number;
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
  leastprod: string;
  mostsessions: string;
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

function useDailyMetrics(
  sessions: SessionDoc[],
  dayOffset: number
): ReturnType<typeof computeMetrics> {
  return useMemo(
    () => computeMetrics(sessions, dayOffset),
    [sessions, dayOffset]
  );
}

function buildAggregates(rows: SessionDoc[]): Aggregates {
  const totalMin = rows.reduce((sum, r) => sum + r.duration, 0);
  const lateNightMin = rows
    .filter((r) => r.timeBucket === "night")
    .reduce((sum, r) => sum + r.duration, 0);
  const maxSessionMin =
    rows.length > 0 ? Math.max(...rows.map((r) => r.duration)) : 0;

  const notifSessions = rows.filter((r) => r.trigger === "notification").length;
  const notifPct = rows.length > 0 ? notifSessions / rows.length : 0;

  const prodMinutes = rows
    .filter((r) => r.rawScore >= 0.6)
    .reduce((sum, r) => sum + r.duration, 0);
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

  // (5) Overall high productivity
  if (a.prodScore >= 0.8) {
    cards.push({
      id: "R6",
      type: "keep",
      text: `Great job — your productive minutes were ${Math.round(
        a.prodScore * 100
      )}%. To shave even more off your total, stay off your phone for a 15 min block during your usual heaviest hour.`,
    });
  }

  const fixes = cards
    .filter((c) => c.type === "fix")
    .sort((x, y) => (y.impactMin ?? 0) - (x.impactMin ?? 0))
    .slice(0, 2);
  const keep = cards.find((c) => c.type === "keep");
  return keep ? [...fixes, keep] : fixes;
}

function computeMetrics(sessions: SessionDoc[], dayOffset: number) {
  // DEFAULTS
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
        leastprod: "",
        mostsessions: "",
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

  // 1) Compute which exact day we’re looking at
  const now = new Date();
  const dayStart = new Date();
  dayStart.setDate(now.getDate() - dayOffset);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  // 2) FILTER sessions for that single day
  const filtered = sessions.filter((r) => {
    const d = r.createdAt.toDate();
    return d >= dayStart && d < dayEnd;
  });

  // 3) If no sessions that day, return defaults + dayLabel
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
        leastprod: "",
        mostsessions: "",
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
  // 4) “By-app” metrics
  const byApp: Record<string, PerAppMetrics> = {};
  filtered.forEach((r) => {
    if (!byApp[r.appId]) {
      byApp[r.appId] = { totalMin: 0, totalScore: 0, sessions: 0 };
    }
    byApp[r.appId].totalMin += r.duration;
    byApp[r.appId].totalScore += r.rawScore;
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
  let under5raw = 0,
    between5and15raw = 0,
    between15and45raw = 0,
    over45raw = 0,
    leastprodraw = 1000,
    mostsessionsnumb = -1;
  // 5) Session-length distribution (count)
  const distribution: Distribution = {
    under5: 0,
    between5and15: 0,
    between15and45: 0,
    over45: 0,
    leastprod: "",
    mostsessions: "",
  };
  filtered.forEach((r) => {
    if (r.duration < 5) {
      distribution.under5 += 1;
      under5raw += r.rawScore;
      if (under5raw < leastprodraw) {
        leastprodraw = under5raw;
        distribution.leastprod = "<5 min";
      }
      if (distribution.under5 > mostsessionsnumb) {
        mostsessionsnumb = distribution.under5;
        distribution.mostsessions = "<5 min";
      }
    } else if (r.duration < 15) {
      distribution.between5and15 += 1;
      between5and15raw += r.rawScore;
      if (between5and15raw < leastprodraw) {
        leastprodraw = between5and15raw;
        distribution.leastprod = "5-15 min";
      }
      if (distribution.between5and15 > mostsessionsnumb) {
        mostsessionsnumb = distribution.between5and15;
        distribution.mostsessions = "5-15 min";
      }
    } else if (r.duration < 45) {
      distribution.between15and45 += 1;
      between15and45raw += r.rawScore;
      if (between15and45raw < leastprodraw) {
        leastprodraw = between15and45raw;
        distribution.leastprod = "15-45 min";
      }
      if (distribution.between15and45 > mostsessionsnumb) {
        mostsessionsnumb = distribution.between15and45;
        distribution.mostsessions = "15-45 min";
      }
    } else {
      distribution.over45 += 1;
      over45raw += r.rawScore;
      if (over45raw < leastprodraw) {
        leastprodraw = over45raw;
        distribution.leastprod = ">45 min";
      }
      if (distribution.over45 > mostsessionsnumb) {
        mostsessionsnumb = distribution.over45;
        distribution.mostsessions = ">45 min";
      }
    }
  });

  // 6) By-timeBucket
  const byBucket: ByBucket = {};
  filtered.forEach((r) => {
    const b = r.timeBucket;
    if (!byBucket[b]) {
      byBucket[b] = { totalMin: 0, totalScore: 0, sessions: 0 };
    }
    byBucket[b].totalMin += r.duration;
    byBucket[b].totalScore += r.rawScore;
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

  // 7) By-trigger
  const byTrigger: ByBucket = {};
  filtered.forEach((r) => {
    const t = r.trigger;
    if (!byTrigger[t]) {
      byTrigger[t] = { totalMin: 0, totalScore: 0, sessions: 0 };
    }
    byTrigger[t].totalMin += r.duration;
    byTrigger[t].totalScore += r.rawScore;
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

  // 8) By-goalPrimary
  const byGoal: ByBucket = {};
  filtered.forEach((r) => {
    const g = r.goalPrimary;
    if (!byGoal[g]) {
      byGoal[g] = { totalMin: 0, totalScore: 0, sessions: 0 };
    }
    byGoal[g].totalMin += r.duration;
    byGoal[g].totalScore += r.rawScore;
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

  // 9) By-engagement
  const byEng: ByBucket = {};
  filtered.forEach((r) => {
    const e = r.engagement;
    if (!byEng[e]) {
      byEng[e] = { totalMin: 0, totalScore: 0, sessions: 0 };
    }
    byEng[e].totalMin += r.duration;
    byEng[e].totalScore += r.rawScore;
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

  // 10) By-contentMajor
  const byContent: ByBucket = {};
  filtered.forEach((r) => {
    const c = r.contentMajor;
    if (!byContent[c]) {
      byContent[c] = { totalMin: 0, totalScore: 0, sessions: 0 };
    }
    byContent[c].totalMin += r.duration;
    byContent[c].totalScore += r.rawScore;
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

  // 11) By-location
  const byLoc: ByBucket = {};
  filtered.forEach((r) => {
    const l = r.location;
    if (!byLoc[l]) {
      byLoc[l] = { totalMin: 0, totalScore: 0, sessions: 0 };
    }
    byLoc[l].totalMin += r.duration;
    byLoc[l].totalScore += r.rawScore;
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

  // 12) Multitasking vs Non-Multitasking
  let multitaskMin = 0;
  let multitaskScoreSum = 0;
  let multitaskCount = 0;
  let noMultiMin = 0;
  let noMultiScoreSum = 0;
  let noMultiCount = 0;
  filtered.forEach((r) => {
    if (r.multitask === "none") {
      noMultiMin += r.duration;
      noMultiScoreSum += r.rawScore;
      noMultiCount += 1;
    } else {
      multitaskMin += r.duration;
      multitaskScoreSum += r.rawScore;
      multitaskCount += 1;
    }
  });
  const avgMultiScore = multitaskCount ? multitaskScoreSum / multitaskCount : 0;
  const avgNoMultiScore = noMultiCount ? noMultiScoreSum / noMultiCount : 0;

  // 13) Perceived vs Actual difference
  let diffSum = 0;
  filtered.forEach((r) => {
    const perceived = (r.prodSelf + 2) / 4;
    diffSum += perceived - r.rawScore;
  });
  const avgPerceivedDiff = filtered.length ? diffSum / filtered.length : 0;

  // 14) Mood drop vs boost
  let negMoodMin = 0;
  let negMoodScoreSum = 0;
  let negMoodCount = 0;
  let posMoodMin = 0;
  let posMoodScoreSum = 0;
  let posMoodCount = 0;
  filtered.forEach((r) => {
    if (r.moodDifference < 0) {
      negMoodMin += r.duration;
      negMoodScoreSum += r.rawScore;
      negMoodCount += 1;
    } else if (r.moodDifference > 0) {
      posMoodMin += r.duration;
      posMoodScoreSum += r.rawScore;
      posMoodCount += 1;
    }
  });
  const avgNegMoodScore = negMoodCount ? negMoodScoreSum / negMoodCount : 0;
  const avgPosMoodScore = posMoodCount ? posMoodScoreSum / posMoodCount : 0;
  const moodScoreDiff = avgPosMoodScore - avgNegMoodScore;

  // 15) Advice for that day
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
}

export default function StatsPage() {
  const { uid, status } = useAppSelector((s) => s.auth);

  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(1);

  // Subscribe to all sessions
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

  // Compute all per-day metrics + advice for the selected day
  const metrics = useDailyMetrics(sessions, dayOffset);

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

      {/* Day selector at top */}
      <DaySelector
        dayLabel={dayLabel}
        onPrev={() => setDayOffset((d) => d + 1)}
        onNext={() => setDayOffset((d) => Math.max(1, d - 1))}
      />

      <StatsDetails
        mostUsedApp={mostUsedApp}
        mostUsedMin={mostUsedMin}
        leastProdApp={leastProdApp}
        leastProdValue={leastProdValue}
        distribution={distribution}
        mostBucket={mostBucket}
        mostBucketMin={mostBucketMin}
        worstBucket={worstBucket}
        worstBucketScore={worstBucketScore}
        topTrigger={topTrigger}
        topTriggerMin={topTriggerMin}
        worstTrigger={worstTrigger}
        worstTriggerScore={worstTriggerScore}
        topGoal={topGoal}
        topGoalMin={topGoalMin}
        worstGoal={worstGoal}
        worstGoalScore={worstGoalScore}
        topEng={topEng}
        topEngMin={topEngMin}
        worstEng={worstEng}
        worstEngScore={worstEngScore}
        topContent={topContent}
        topContentMin={topContentMin}
        worstContent={worstContent}
        worstContentScore={worstContentScore}
        topLoc={topLoc}
        topLocMin={topLocMin}
        worstLoc={worstLoc}
        worstLocScore={worstLocScore}
        dayAdvice={dayAdvice}
      />

      <BTBottomNav />
    </div>
  );
}

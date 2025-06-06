// app/stats/StatsDetails.tsx
"use client";

import React from "react";
import "@/app/components/Advice.css";

interface AdviceCard {
  id: string;
  text: string;
}

interface Distribution {
  under5: number;
  between5and15: number;
  between15and45: number;
  over45: number;
}

interface StatsDetailsProps {
  mostUsedApp: string;
  mostUsedMin: number;
  leastProdApp: string;
  leastProdValue: number;

  distribution: Distribution;

  mostBucket: string;
  mostBucketMin: number;
  worstBucket: string;
  worstBucketScore: number;

  topTrigger: string;
  topTriggerMin: number;
  worstTrigger: string;
  worstTriggerScore: number;

  topGoal: string;
  topGoalMin: number;
  worstGoal: string;
  worstGoalScore: number;

  topEng: string;
  topEngMin: number;
  worstEng: string;
  worstEngScore: number;

  topContent: string;
  topContentMin: number;
  worstContent: string;
  worstContentScore: number;

  topLoc: string;
  topLocMin: number;
  worstLoc: string;
  worstLocScore: number;

  multitaskMin: number;
  avgMultiScore: number;
  noMultiMin: number;
  avgNoMultiScore: number;

  avgPerceivedDiff: number;

  negMoodMin: number;
  avgNegMoodScore: number;
  posMoodMin: number;
  avgPosMoodScore: number;
  moodScoreDiff: number;

  dayAdvice: AdviceCard[];
}

export default function StatsDetails({
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
}: StatsDetailsProps) {
  return (
    <main className="stats-ct">
      <h1>Usage &amp; Productivity Overview</h1>

      {/* ---------- Apps ---------- */}
      <section className="stats-section">
        <h2>Apps</h2>
        <p>
          <strong>Most used app:</strong> {mostUsedApp} ({mostUsedMin} min
          total)
        </p>
        <p>
          <strong>Least productive app:</strong> {leastProdApp} (
          {Math.round(leastProdValue * 100)}% avg)
        </p>
      </section>

      {/* ---------- Session Length Distribution ---------- */}
      <section className="stats-section">
        <h2>Session Length Distribution</h2>
        <ul>
          <li>Under 5 min: {distribution.under5} session(s)</li>
          <li>5–15 min: {distribution.between5and15} session(s)</li>
          <li>15–45 min: {distribution.between15and45} session(s)</li>
          <li>Over 45 min: {distribution.over45} session(s)</li>
        </ul>
      </section>

      {/* ---------- Time of Day ---------- */}
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

      {/* ---------- Triggers ---------- */}
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

      {/* ---------- Goals ---------- */}
      <section className="stats-section">
        <h2>Goals</h2>
        <p>
          <strong>Most time on goal:</strong> {topGoal} ({topGoalMin} min)
        </p>
        <p>
          <strong>Worst productivity goal:</strong> {worstGoal} (
          {Math.round(worstGoalScore * 100)}%)
        </p>
      </section>

      {/* ---------- Activities ---------- */}
      <section className="stats-section">
        <h2>Activities</h2>
        <p>
          <strong>Most time on activity:</strong> {topEng} ({topEngMin} min)
        </p>
        <p>
          <strong>Worst productivity activity:</strong> {worstEng} (
          {Math.round(worstEngScore * 100)}%)
        </p>
      </section>

      {/* ---------- Content Types ---------- */}
      <section className="stats-section">
        <h2>Content Types</h2>
        <p>
          <strong>Most time on content:</strong> {topContent} ({topContentMin}{" "}
          min)
        </p>
        <p>
          <strong>Worst productivity content:</strong> {worstContent} (
          {Math.round(worstContentScore * 100)}%)
        </p>
      </section>

      {/* ---------- Locations ---------- */}
      <section className="stats-section">
        <h2>Locations</h2>
        <p>
          <strong>Most usage location:</strong> {topLoc} ({topLocMin} min)
        </p>
        <p>
          <strong>Worst productivity location:</strong> {worstLoc} (
          {Math.round(worstLocScore * 100)}%)
        </p>
      </section>

      {/* ---------- Multitasking vs Non-Multitasking ---------- */}
      <section className="stats-section">
        <h2>Multitasking vs Non-Multitasking</h2>
        <p>
          <strong>Time multitasking:</strong> {multitaskMin} min (
          {Math.round(avgMultiScore * 100)}% avg prod)
        </p>
        <p>
          <strong>Time not multitasking:</strong> {noMultiMin} min (
          {Math.round(avgNoMultiScore * 100)}% avg prod)
        </p>
      </section>

      {/* ---------- Perceived vs Actual Productivity ---------- */}
      <section className="stats-section">
        <h2>Perceived vs Actual Productivity</h2>
        <p>
          On average, your perceived–actual productivity difference was{" "}
          {avgPerceivedDiff.toFixed(2)} (on a 0–1 scale).
        </p>
      </section>

      {/* ---------- Mood Impact ---------- */}
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
          Productivity difference (positive–negative):{" "}
          {Math.round(moodScoreDiff * 100)}%
        </p>
      </section>

      {/* ---------- Advice for This Day ---------- */}
      <section className="stats-section">
        <h2>Advice for This Day</h2>
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
  );
}

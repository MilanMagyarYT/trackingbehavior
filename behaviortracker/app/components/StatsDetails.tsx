"use client";

import React from "react";
import "@/app/components/StatsDetails.css";
import "../components/AccountPage.css";

interface AdviceCard {
  id: string;
  text: string;
}

interface Distribution {
  under5: number;
  between5and15: number;
  between15and45: number;
  over45: number;
  leastprod: string;
  mostsessions: string;
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

  dayAdvice,
}: StatsDetailsProps) {
  return (
    <main className="stats-ct">
      <section className="stats-card">
        <h2 className="stats-card-title">advice for this day</h2>
        {dayAdvice.map((card) => (
          <div key={card.id} className="advice-card">
            {card.text}
          </div>
        ))}
        {dayAdvice.length === 0 && (
          <p className="stats-card-single" style={{ marginTop: "1rem" }}>
            no recommendations for this day yet
          </p>
        )}
      </section>
      {/* WRAP each card in a slider-item DIV */}
      <div className="slider-item">
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">1</div>
            <h3 className="acc-card-title">time of day</h3>
            <p className="acc-card-sub">when it comes to social media</p>
          </div>

          <div className="acc-row two-cols">
            <div>
              <label>most used app</label>
              <input
                type="text"
                value={`${mostUsedApp} (${mostUsedMin} min)`}
                readOnly
              />
            </div>
            <div>
              <label>least productive %</label>
              <input
                type="text"
                value={`${leastProdApp} (${Math.round(
                  leastProdValue * 100
                )}% )`}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>

      <div className="slider-item">
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">2</div>
            <h3 className="acc-card-title">session length</h3>
            <p className="acc-card-sub">when it comes to social media</p>
          </div>

          <div className="acc-row two-cols">
            <div>
              <label>most session lengths</label>
              <input
                type="text"
                value={distribution.mostsessions.toString()}
                readOnly
              />
            </div>
            <div>
              <label>least productive %</label>
              <input
                type="text"
                value={distribution.leastprod.toString()}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>

      <div className="slider-item">
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">3</div>
            <h3 className="acc-card-title">time of day</h3>
            <p className="acc-card-sub">when it comes to social media</p>
          </div>

          <div className="acc-row two-cols">
            <div>
              <label>most usage</label>
              <input
                type="text"
                value={`${mostBucket} (${mostBucketMin} min)`}
                readOnly
              />
            </div>
            <div>
              <label>least productive %</label>
              <input
                type="text"
                value={`${worstBucket} (${Math.round(
                  worstBucketScore * 100
                )}% )`}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>

      <div className="slider-item">
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">4</div>
            <h3 className="acc-card-title">triggers</h3>
            <p className="acc-card-sub">when it comes to social media</p>
          </div>

          <div className="acc-row two-cols">
            <div>
              <label>most usage</label>
              <input
                type="text"
                value={`${topTrigger} (${topTriggerMin} min)`}
                readOnly
              />
            </div>
            <div>
              <label>least productive %</label>
              <input
                type="text"
                value={`${worstTrigger} (${Math.round(
                  worstTriggerScore * 100
                )}% )`}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>

      <div className="slider-item">
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">5</div>
            <h3 className="acc-card-title">goals</h3>
            <p className="acc-card-sub">when it comes to social media</p>
          </div>

          <div className="acc-row two-cols">
            <div>
              <label>most usage</label>
              <input
                type="text"
                value={`${topGoal} (${topGoalMin} min)`}
                readOnly
              />
            </div>
            <div>
              <label>least productive %</label>
              <input
                type="text"
                value={`${worstGoal} (${Math.round(worstGoalScore * 100)}% )`}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>

      <div className="slider-item">
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">6</div>
            <h3 className="acc-card-title">activities</h3>
            <p className="acc-card-sub">when it comes to social media</p>
          </div>

          <div className="acc-row two-cols">
            <div>
              <label>most usage</label>
              <input
                type="text"
                value={`${topEng} (${topEngMin} min)`}
                readOnly
              />
            </div>
            <div>
              <label>least productive %</label>
              <input
                type="text"
                value={`${worstEng} (${Math.round(worstEngScore * 100)}% )`}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>

      <div className="slider-item">
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">7</div>
            <h3 className="acc-card-title">content types</h3>
            <p className="acc-card-sub">when it comes to social media</p>
          </div>

          <div className="acc-row two-cols">
            <div>
              <label>most usage</label>
              <input
                type="text"
                value={`${topContent} (${topContentMin} min)`}
                readOnly
              />
            </div>
            <div>
              <label>least productive %</label>
              <input
                type="text"
                value={`${worstContent} (${Math.round(
                  worstContentScore * 100
                )}% )`}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>

      <div className="slider-item">
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">8</div>
            <h3 className="acc-card-title">locations</h3>
            <p className="acc-card-sub">when it comes to social media</p>
          </div>

          <div className="acc-row two-cols">
            <div>
              <label>most usage</label>
              <input
                type="text"
                value={`${topLoc} (${topLocMin} min)`}
                readOnly
              />
            </div>
            <div>
              <label>least productive %</label>
              <input
                type="text"
                value={`${worstLoc} (${Math.round(worstLocScore * 100)}% )`}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

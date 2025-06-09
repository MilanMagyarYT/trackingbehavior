"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BTNavbar from "@/app/components/BTNavbar";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { getAuth } from "firebase/auth";
import { useAppSelector } from "@/app/store";
import LoadingSpinner from "../components/LoadingSpinner";
import "../components/StartSetup.css";
import SimpleSelect from "../components/SimpleSelect";
import BTCategoryScoring from "@/app/components/BTCategoryScoring";

const triggerList = [
  "boredom",
  "received notification",
  "habit",
  "procrastination",
  "received message",
  "study requirement",
  "work task",
] as const;

const goalList = [
  "entertainment",
  "academic / learning",
  "work / professional task",
  "social connection",
  "news",
  "creating/posting content",
] as const;

const actList = [
  "scrolling/swipping",
  "watching",
  "reading",
  "messaging",
  "searching",
  "posting",
] as const;

const contentList = [
  "educational",
  "news",
  "entertainment",
  "personal updates",
  "professional",
  "political",
  "shopping",
  "sports",
  "podcasts",
  "music",
] as const;

type TriggerCat = (typeof triggerList)[number];
type GoalCat = (typeof goalList)[number];
type ActivityCat = (typeof actList)[number];
type ContentCat = (typeof contentList)[number];
type Step = 1 | 2 | 3 | 4;
type Val = -1 | 0 | 1;

function mkRecordVal<K extends string>(
  keys: readonly K[],
  defaultVal: Val
): Record<K, Val> {
  return keys.reduce(
    (acc, k) => ({ ...acc, [k]: defaultVal }),
    {} as Record<K, Val>
  );
}

export default function StartSetup() {
  const router = useRouter();
  const { uid, status, email: storedEmail } = useAppSelector((s) => s.auth);
  const authEmail = storedEmail ?? getAuth().currentUser?.email ?? "";

  const [step, setStep] = useState<Step>(1);
  const [avgLastMonth, setAvgLastMonth] = useState<string>("");
  const [goalPhone, setGoalPhone] = useState<string>("");
  const [unprodPct, setUnprodPct] = useState<string>("");
  const [optUnprodPct, setOptUnprodPct] = useState<string>("");
  const [negMoodChoice, setNegMoodChoice] = useState<string>("");

  const [prodTriggers, setProdTriggers] = useState<Record<TriggerCat, Val>>(
    () => mkRecordVal(triggerList, 0)
  );
  const [prodGoals, setProdGoals] = useState<Record<GoalCat, Val>>(() =>
    mkRecordVal(goalList, 0)
  );
  const [prodActs, setProdActs] = useState<Record<ActivityCat, Val>>(() =>
    mkRecordVal(actList, 0)
  );
  const [prodContent, setProdContent] = useState<Record<ContentCat, Val>>(() =>
    mkRecordVal(contentList, 0)
  );

  const [negMoodIsUnprod, setNegMoodIsUnprod] = useState<"yes" | "no">("yes");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="su-loader">
        <LoadingSpinner />
      </div>
    );
  }

  const nextDisabled = (): boolean => {
    return step === 1
      ? !(avgLastMonth && goalPhone && unprodPct && optUnprodPct)
      : step === 2
      ? !(
          prodTriggers &&
          prodGoals &&
          prodActs &&
          negMoodIsUnprod &&
          prodContent
        )
      : false;
  };

  const handleSubmitAnswers = async () => {
    if (!uid) return;
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        email: authEmail,
        baselinePhoneLast30Days: Number(avgLastMonth),
        goalPhoneMin: Number(goalPhone),
        unprodTolerancePct: Number(unprodPct),
        unprodGoalPct: Number(optUnprodPct),
        prodRules: {
          triggers: prodTriggers,
          goals: prodGoals,
          acts: prodActs,
          content: prodContent,
        },
        negMoodIsUnprod: negMoodIsUnprod === "yes",
        baselineCompletedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setStep(4);
  };

  return (
    <div className="navbarwith">
      <BTNavbar />

      <div className="su-bg">
        <section className="su-card">
          {step <= 3 && (
            <span className="su-step-badge">step {step <= 3 ? step : "✓"}</span>
          )}

          <h2 className="su-title">
            {step === 1 && "usage metrics"}
            {step === 2 && "usage behavior"}
            {step === 3 && "review answers"}
          </h2>

          {step < 3 && (
            <p className="su-sub">
              {step === 1
                ? "add your numerical values regarding the amount and quality of time you spend on your phone daily"
                : "clearly label what is your definition of productivity when using social media apps"}
            </p>
          )}
          {step === 3 && (
            <p className="su-sub">
              it&apos;s of high importance to gather the correct data, so that
              our algorithm will make the correct calculations
            </p>
          )}

          {step <= 3 && (
            <div className="su-progress">
              <div
                className="su-progress-bar"
                style={{ width: `${step * 33.333}%` }}
              />
            </div>
          )}

          {step === 1 && (
            <>
              <label className="su-label">
                what is your daily social media usage in the last 30 days?
                (minutes)
              </label>
              <input
                className="su-input"
                type="number"
                placeholder="ex: 360"
                value={avgLastMonth}
                onChange={(e) => setAvgLastMonth(e.target.value)}
              />

              <label className="su-label">
                what is your daily phone usage goal? (minutes)
              </label>
              <input
                className="su-input"
                type="number"
                placeholder="ex: 120"
                value={goalPhone}
                onChange={(e) => setGoalPhone(e.target.value)}
              />

              <label className="su-label">
                how productive do you think is your daily phone usage?
                (percentage %)
              </label>
              <input
                className="su-input"
                type="number"
                placeholder="ex: 33"
                value={unprodPct}
                onChange={(e) => setUnprodPct(e.target.value)}
              />

              <label className="su-label">
                how productive do you want to be daily when using your phone?
                (percentage %)
              </label>
              <input
                className="su-input"
                type="number"
                placeholder="ex: 75"
                value={optUnprodPct}
                onChange={(e) => setOptUnprodPct(e.target.value)}
              />

              <button
                disabled={nextDisabled()}
                className="su-btn-primary su-btn-full"
                onClick={() => setStep(2)}
              >
                next step
              </button>

              <label className="su-explanation">
                Explanation: for a 33% productivity, one out of three session on
                your phone is productive, while the rest unproductive.
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <label className="su-label">
                how do you classify the following triggers when opening social
                media apps?
              </label>
              <BTCategoryScoring
                label="trigger options"
                options={triggerList}
                values={prodTriggers}
                onChange={(key, val) =>
                  setProdTriggers((prev) => ({ ...prev, [key]: val }))
                }
              />

              <label className="su-label">
                how do you classify the following goals when opening social
                media apps?
              </label>
              <BTCategoryScoring
                label="goal options"
                options={goalList}
                values={prodGoals}
                onChange={(key, val) =>
                  setProdGoals((prev) => ({ ...prev, [key]: val }))
                }
              />

              <label className="su-label">
                how do you classify the following activities when on social
                media apps?
              </label>
              <BTCategoryScoring
                label="activity options"
                options={actList}
                values={prodActs}
                onChange={(key, val) =>
                  setProdActs((prev) => ({ ...prev, [key]: val }))
                }
              />

              <label className="su-label">
                how do you classify the following content types on social media
                apps?
              </label>
              <BTCategoryScoring
                label="content type options"
                options={contentList}
                values={prodContent}
                onChange={(key, val) =>
                  setProdContent((prev) => ({ ...prev, [key]: val }))
                }
              />

              <label className="su-label">
                do you consider a negative drop in your overall mood as
                unproductive?
              </label>
              <SimpleSelect
                options={[
                  { label: "yes", value: "yes" },
                  { label: "no", value: "no" },
                ]}
                value={negMoodChoice}
                onChange={(v) => {
                  setNegMoodChoice(v as "yes" | "no");
                  setNegMoodIsUnprod(v as "yes" | "no");
                }}
              />

              <div className="su-btn-row">
                <button className="su-btn-outline" onClick={() => setStep(1)}>
                  back
                </button>
                <button
                  disabled={nextDisabled()}
                  className="su-btn-primary"
                  onClick={() => setStep(3)}
                >
                  next step
                </button>
              </div>

              <label className="su-explanation">
                Explanation: it is extremely important to understand your
                opinion on these situations to be able to correctly classify
                your future sessions.
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <div className="su-btn-row">
                <button className="su-btn-outline" onClick={() => setStep(2)}>
                  back
                </button>
                <button
                  className="su-btn-primary"
                  onClick={handleSubmitAnswers}
                >
                  submit
                </button>
              </div>
              <div className="su-review">
                <ReviewRow
                  label="average daily phone usage last 30 days"
                  value={`${avgLastMonth} minutes`}
                />
                <ReviewRow
                  label="wanted daily phone usage"
                  value={`${goalPhone} minutes`}
                />
                <ReviewRow
                  label="average daily unproductive phone usage"
                  value={`${unprodPct}%`}
                />
                <ReviewRow
                  label="optimum daily unproductive phone usage"
                  value={`${optUnprodPct}%`}
                />
                <ReviewRow
                  label="trigger scores"
                  value={formatValRecord(prodTriggers)}
                />
                <ReviewRow
                  label="goal scores"
                  value={formatValRecord(prodGoals)}
                />
                <ReviewRow
                  label="activity scores"
                  value={formatValRecord(prodActs)}
                />
                <ReviewRow
                  label="content scores"
                  value={formatValRecord(prodContent)}
                />
                <ReviewRow
                  label="negative mood drop unproductive?"
                  value={negMoodIsUnprod === "yes" ? "yes" : "no"}
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <span className="su-done-icon">✓</span>
              <h2 className="su-title2">answers submitted</h2>
              <p className="su-sub2">
                by finalizing your account, you now have access to your personal
                behavior tracking portal
              </p>
              <button
                className="su-btn-primary su-btn-full"
                onClick={() => router.push("/profile")}
              >
                go to behavior tracking portal
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function formatValRecord<T extends string>(rec: Record<T, -1 | 0 | 1>): string {
  return (Object.keys(rec) as T[]).map((k) => `${k} ${rec[k]},`).join("  ");
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <p className="su-review-label">{label}</p>
      <div className="su-review-value">{value}</div>
    </>
  );
}

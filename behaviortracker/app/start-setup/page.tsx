"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BTNavbar from "@/app/components/BTNavbar";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";
import LoadingSpinner from "../components/LoadingSpinner";
import "../components/StartSetup.css";
import SimpleSelect from "../components/SimpleSelect";
import { MultiSelect } from "primereact/multiselect";

const triggerList = [
  "boredom",
  "notification",
  "habit",
  "check_updates",
  "search",
  "work",
  "post_planned",
] as const;

const goalList = [
  "entertainment",
  "work",
  "academic",
  "social",
  "creation",
  "news",
] as const;

const actList = ["scroll", "post", "comment", "react", "dm", "search"] as const;

const contentList = [
  "educational",
  "entertainment",
  "personal_updates",
  "political",
  "professional",
  "shopping",
] as const;

type TriggerCat = (typeof triggerList)[number];
type GoalCat = (typeof goalList)[number];
type ActivityCat = (typeof actList)[number];
type ContentCat = (typeof contentList)[number];

type Step = 1 | 2 | 3 | 4;

function mkRecord<K extends string>(
  keys: readonly K[],
  defaultVal: boolean,
  setTrue?: K[]
): Record<K, boolean> {
  const base = keys.reduce(
    (acc, k) => ({ ...acc, [k]: defaultVal }),
    {} as Record<K, boolean>
  );
  if (!setTrue) return base;
  setTrue.forEach((k) => (base[k] = true));
  return base;
}

export default function StartSetup() {
  const router = useRouter();
  const { uid, status } = useAppSelector((s) => s.auth);

  const [step, setStep] = useState<Step>(1);
  const [avgLastWeek, setAvgLastWeek] = useState<string>("");
  const [goalPhone, setGoalPhone] = useState<string>("");
  const [unprodPct, setUnprodPct] = useState<string>("");
  const [optUnprodPct, setOptUnprodPct] = useState<string>("");
  const [negMoodChoice, setNegMoodChoice] = useState<string>("");

  const [prodTriggers, setProdTriggers] = useState<Record<TriggerCat, boolean>>(
    () => mkRecord(triggerList, false)
  );
  const [prodGoals, setProdGoals] = useState<Record<GoalCat, boolean>>(() =>
    mkRecord(goalList, false)
  );
  const [prodActs, setProdActs] = useState<Record<ActivityCat, boolean>>(() =>
    mkRecord(actList, false)
  );
  const [negMoodIsUnprod, setNegMoodIsUnprod] = useState<"yes" | "no">("yes");
  const [prodContent, setProdContent] = useState<Record<ContentCat, boolean>>(
    () => mkRecord(contentList, false)
  );

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
      ? !(avgLastWeek && goalPhone && unprodPct && optUnprodPct)
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
        baselinePhoneLastWeek: Number(avgLastWeek),
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
                ? "add your numerical values regarding phone usage, needed to understand your past behavior"
                : "add your reason and thoughts for the usage metrics, needed to evaluate why you make certain decisions"}
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
                average daily phone usage in last 30 days in minutes
              </label>
              <input
                className="su-input"
                type="number"
                placeholder="360 minutes"
                value={avgLastWeek}
                onChange={(e) => setAvgLastWeek(e.target.value)}
              />

              <label className="su-label">
                wanted daily phone usage in minutes
              </label>
              <input
                className="su-input"
                type="number"
                placeholder="90 minutes"
                value={goalPhone}
                onChange={(e) => setGoalPhone(e.target.value)}
              />

              <label className="su-label">
                average daily unproductive phone usage percentage
              </label>
              <input
                className="su-input"
                type="number"
                placeholder="60%"
                value={unprodPct}
                onChange={(e) => setUnprodPct(e.target.value)}
              />

              <label className="su-label">
                wanted daily unproductive phone usage percentage
              </label>
              <input
                className="su-input"
                type="number"
                placeholder="10%"
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
            </>
          )}

          {step === 2 && (
            <>
              <label className="su-label">
                which reasons do you consider productive behavior?
              </label>
              <MultiSelect
                value={listFromRecord(prodTriggers)}
                options={triggerList.map((t) => ({
                  label: t.replace(/_/g, " "),
                  value: t,
                }))}
                onChange={(e) =>
                  setProdTriggers(
                    mkRecord(triggerList, false, e.value as TriggerCat[])
                  )
                }
                placeholder="choose you answers"
                display="chip"
                className="su-multi"
              />

              <label className="su-label">
                which goals do you consider productive behavior?
              </label>
              <MultiSelect
                value={listFromRecord(prodGoals)}
                options={goalList.map((g) => ({ label: g, value: g }))}
                onChange={(e) =>
                  setProdGoals(mkRecord(goalList, false, e.value as GoalCat[]))
                }
                placeholder="choose you answers"
                display="chip"
                className="su-multi"
              />

              <label className="su-label">
                which activities do you consider productive behavior?
              </label>
              <MultiSelect
                value={listFromRecord(prodActs)}
                options={actList.map((a) => ({ label: a, value: a }))}
                onChange={(e) =>
                  setProdActs(
                    mkRecord(actList, false, e.value as ActivityCat[])
                  )
                }
                placeholder="choose you answers"
                display="chip"
                className="su-multi"
              />

              <label className="su-label">
                do you consider a negative mood drop unproductive?
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

              <label className="su-label">
                which content type do you consider productive?
              </label>
              <MultiSelect
                value={listFromRecord(prodContent)}
                options={contentList.map((c) => ({
                  label: c.replace(/_/g, " "),
                  value: c,
                }))}
                onChange={(e) =>
                  setProdContent(
                    mkRecord(contentList, false, e.value as ContentCat[])
                  )
                }
                placeholder="choose you answers"
                display="chip"
                className="su-multi"
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
                  submit answers
                </button>
              </div>
              <div className="su-review">
                <ReviewRow
                  label="average daily phone usage last 30 days"
                  value={`${avgLastWeek} minutes`}
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
                  label="productive triggers"
                  value={listFromRecord(prodTriggers).join(", ") || "—"}
                />
                <ReviewRow
                  label="productive goals"
                  value={listFromRecord(prodGoals).join(", ") || "—"}
                />
                <ReviewRow
                  label="productive activities"
                  value={listFromRecord(prodActs).join(", ") || "—"}
                />
                <ReviewRow
                  label="negative mood drop unproductive?"
                  value={negMoodIsUnprod === "yes" ? "yes" : "no"}
                />
                <ReviewRow
                  label="productive content types"
                  value={listFromRecord(prodContent).join(", ") || "—"}
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

function listFromRecord<T extends string>(rec: Record<T, boolean>): T[] {
  return Object.keys(rec).filter((k) => rec[k as T]) as T[];
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <p className="su-review-label">{label}</p>
      <div className="su-review-value">{value}</div>
    </>
  );
}

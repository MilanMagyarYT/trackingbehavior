"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BTNavbar from "@/app/components/BTNavbar";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";
import LoadingSpinner from "../components/LoadingSpinner";

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

type Step = 1 | 2;

/**
 * Helper to create a typed record from a key array
 */
const mkRecord = <K extends string, V>(
  keys: readonly K[],
  value: V
): Record<K, V> =>
  keys.reduce((acc, key) => ({ ...acc, [key]: value }), {} as Record<K, V>);

export default function StartSetup() {
  const router = useRouter();
  const { uid, status } = useAppSelector((s) => s.auth);

  const [step, setStep] = useState<Step>(1);
  const [avgLastWeek, setAvgLastWeek] = useState<string>("");
  const [goalPhone, setGoalPhone] = useState<string>("120");
  const [unprodPct, setUnprodPct] = useState<string>("15");

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

  if (status === "loading")
    return (
      <>
        <BTNavbar />
        <LoadingSpinner />
      </>
    );
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const toggle = <T extends string>(
    setter: React.Dispatch<React.SetStateAction<Record<T, boolean>>>,
    key: T
  ) => setter((prev) => ({ ...prev, [key]: !prev[key] }));

  const nextDisabled = (): boolean => {
    return step === 1 ? !(avgLastWeek && goalPhone && unprodPct) : false;
  };

  const handleSubmit = async () => {
    if (!uid) return;
    const userRef = doc(db, "users", uid);

    await setDoc(
      userRef,
      {
        baselinePhoneLastWeek: Number(avgLastWeek),
        goalPhoneMin: Number(goalPhone),
        unprodTolerancePct: Number(unprodPct),
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
    router.push("/profile");
  };

  return (
    <div>
      <BTNavbar />
      <div className="min-h-screen bg-[#0d1623] flex flex-col items-center py-6 px-4 text-[#f3ede0]">
        <div className="w-full max-w-sm md:max-w-md bg-[#00101e] p-6 rounded border border-[#f3ede0] mt-6">
          <h2 className="text-2xl font-bold mb-2">Set‑Up Your Account</h2>
          <p className="text-sm mb-4">
            Through this page, you will fill in personal details and your own
            productivity baselines.
          </p>

          <div className="w-full h-2 bg-[#112233] rounded mb-6 overflow-hidden">
            <div
              className="h-full bg-[#f3ede0] transition-all duration-300"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>

          {step === 1 && (
            <>
              <h3 className="text-xl font-semibold mb-4">
                Step 1: Personal Details
              </h3>

              <label className="block text-sm mb-1">
                How much time did you spend on your phone on average last week?
                (minutes)
              </label>
              <input
                className="w-full mb-4 p-2 rounded bg-transparent border border-[#f3ede0]"
                type="number"
                value={avgLastWeek}
                onChange={(e) => setAvgLastWeek(e.target.value)}
              />

              <label className="block text-sm mb-1">
                Desired daily phone time (minutes)
              </label>
              <input
                className="w-full mb-4 p-2 rounded bg-transparent border border-[#f3ede0]"
                type="number"
                value={goalPhone}
                onChange={(e) => setGoalPhone(e.target.value)}
              />

              <label className="block text-sm mb-1">
                Acceptable unproductive % of daily time
              </label>
              <input
                className="w-full mb-4 p-2 rounded bg-transparent border border-[#f3ede0]"
                type="number"
                value={unprodPct}
                onChange={(e) => setUnprodPct(e.target.value)}
              />

              <button
                disabled={nextDisabled()}
                onClick={() => setStep(2)}
                className="w-full py-2 mt-2 bg-[#f3ede0] text-[#00101e] font-semibold rounded disabled:opacity-40"
              >
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-xl font-semibold mb-4">
                Step 2: Behavioural Self‑Assessment
              </h3>

              <p className="text-sm mb-1">
                Productive reasons to open social media
              </p>
              {triggerList.map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-2 text-sm capitalize"
                >
                  <input
                    type="checkbox"
                    checked={prodTriggers[t]}
                    onChange={() => toggle(setProdTriggers, t)}
                  />
                  {t.replace(/_/g, " ")}
                </label>
              ))}
              <hr className="my-3 border-[#334455]" />

              <p className="text-sm mb-1">
                Productive goals when opening the app
              </p>
              {goalList.map((g) => (
                <label
                  key={g}
                  className="flex items-center gap-2 text-sm capitalize"
                >
                  <input
                    type="checkbox"
                    checked={prodGoals[g]}
                    onChange={() => toggle(setProdGoals, g)}
                  />
                  {g.replace(/_/g, " ")}
                </label>
              ))}
              <hr className="my-3 border-[#334455]" />

              <p className="text-sm mb-1">Productive activities</p>
              {actList.map((a) => (
                <label
                  key={a}
                  className="flex items-center gap-2 text-sm capitalize"
                >
                  <input
                    type="checkbox"
                    checked={prodActs[a]}
                    onChange={() => toggle(setProdActs, a)}
                  />
                  {a}
                </label>
              ))}
              <hr className="my-3 border-[#334455]" />

              <p className="text-sm mb-1">
                Should a negative mood drop mark the session unproductive?
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="negMood"
                  value="yes"
                  checked={negMoodIsUnprod === "yes"}
                  onChange={(e) =>
                    setNegMoodIsUnprod(e.target.value as "yes" | "no")
                  }
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="negMood"
                  value="no"
                  checked={negMoodIsUnprod === "no"}
                  onChange={(e) =>
                    setNegMoodIsUnprod(e.target.value as "yes" | "no")
                  }
                />
                No
              </label>
              <hr className="my-3 border-[#334455]" />

              <p className="text-sm mb-1">Productive content types</p>
              {contentList.map((c) => (
                <label
                  key={c}
                  className="flex items-center gap-2 text-sm capitalize"
                >
                  <input
                    type="checkbox"
                    checked={prodContent[c]}
                    onChange={() => toggle(setProdContent, c)}
                  />
                  {c.replace(/_/g, " ")}
                </label>
              ))}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 border border-[#f3ede0] rounded"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2 bg-[#f3ede0] text-[#00101e] font-semibold rounded"
                >
                  Finish
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

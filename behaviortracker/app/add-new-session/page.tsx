"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BTNavbar from "@/app/components/BTNavbar";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";
import LoadingSpinner from "../components/LoadingSpinner";

/* ------------------ constant lists ------------------ */
const appList = [
  "Facebook",
  "Instagram",
  "Twitter",
  "LinkedIn",
  "TikTok",
  "Snapchat",
  "YouTube",
  "Twitch",
  "Reddit",
  "Pinterest",
  "Tumblr",
  "WhatsApp",
  "Messenger",
  "WeChat",
  "Telegram",
  "Discord",
  "Clubhouse",
  "VK",
] as const;

const durationBuckets = [
  { label: "<5 min", mid: 3 },
  { label: "5‑15 min", mid: 10 },
  { label: "15‑30 min", mid: 22 },
  { label: "30‑60 min", mid: 45 },
  { label: ">60 min", mid: 70 },
] as const;

type TimeBucket = "morning" | "afternoon" | "evening" | "night";
const timeOptions: { label: string; value: TimeBucket }[] = [
  { label: "🌅 Morning (6‑11)", value: "morning" },
  { label: "☀️ Afternoon (11‑17)", value: "afternoon" },
  { label: "🌆 Evening (17‑22)", value: "evening" },
  { label: "🌙 Late‑Night (22‑6)", value: "night" },
];

const triggerList = [
  "boredom",
  "notification",
  "habit",
  "check_updates",
  "search",
  "work",
  "post_planned",
] as const;

type TriggerCat = (typeof triggerList)[number];

const goalList = [
  "entertainment",
  "work",
  "academic",
  "social",
  "creation",
  "news",
] as const;

type GoalCat = (typeof goalList)[number];

const actList = ["scroll", "post", "comment", "react", "dm", "search"] as const;

type ActivityCat = (typeof actList)[number];

const contentList = [
  "educational",
  "entertainment",
  "personal_updates",
  "political",
  "professional",
  "shopping",
] as const;

type ContentCat = (typeof contentList)[number];

type Step = 1 | 2 | 3 | 4;

export default function AddNewSessionPage() {
  const router = useRouter();
  const { uid, status } = useAppSelector((s) => s.auth);
  const [step, setStep] = useState<Step>(1);

  /* ---------- page‑1 state ---------- */
  const [appUsed, setAppUsed] = useState<string>("");
  const [durationIdx, setDurationIdx] = useState<number | null>(null);
  const [timeBucket, setTimeBucket] = useState<TimeBucket | "">("");

  /* ---------- page‑2 ---------- */
  const [triggers, setTriggers] = useState<TriggerCat[]>([]);
  const [goalPrimary, setGoalPrimary] = useState<GoalCat | "">("");
  const [engage, setEngage] = useState<Record<ActivityCat, boolean>>(
    () => Object.fromEntries(actList.map((a) => [a, false])) as any
  );

  /* ---------- page‑3 ---------- */
  const [moodPre, setMoodPre] = useState<1 | 2 | 3 | 4 | 5 | "">("");
  const [moodPost, setMoodPost] = useState<1 | 2 | 3 | 4 | 5 | "">("");
  const [prodSelf, setProdSelf] = useState<1 | 2 | 3 | 4 | 5 | "">("");

  /* ---------- page‑4 ---------- */
  const [contentMajor, setContentMajor] = useState<ContentCat[]>([]);
  const [loc, setLoc] = useState<
    "home" | "work" | "commute" | "outside" | "bed" | "other" | ""
  >("");
  const [multitask, setMultitask] = useState<
    "tv" | "eating" | "working" | "none" | "other" | ""
  >("");

  /* ---------- baseline data (needed for helpers) ---------- */
  const [baseline, setBaseline] = useState<any>(null);
  useEffect(() => {
    const fetchBaseline = async () => {
      if (!uid) return;
      const snap = await getDoc(doc(db, "users", uid));
      setBaseline(snap.exists() ? snap.data() : null);
    };
    fetchBaseline();
  }, [uid]);

  if (status === "loading" || baseline === null)
    return (
      <div>
        <BTNavbar />
        <LoadingSpinner />
      </div>
    );
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  /* ---------- toggle helpers ---------- */
  const toggleArray = <T extends string>(
    arr: T[],
    val: T,
    setter: (v: T[]) => void
  ) => setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  const toggleEngage = (key: ActivityCat) =>
    setEngage((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ---------- submit ---------- */
  const handleSubmit = async () => {
    if (!uid || durationIdx === null) return;

    /* 1. build raw doc */
    const durMin = durationBuckets[durationIdx].mid;
    const dataRaw = {
      createdAt: serverTimestamp(),
      appId: appUsed,
      durMin,
      timeBucket,
      triggers,
      goalPrimary,
      engagement: engage,
      moodPre,
      moodPost,
      prodSelf,
      contentMajor,
      loc,
      multitask,
    };

    /* 2. derive helpers from baseline rules */
    const rules = baseline.prodRules;
    const moodDelta = (moodPost as number) - (moodPre as number);

    const triggerProd = triggers.some((t) => rules.triggers[t]);
    const goalProd = rules.goals[goalPrimary];
    const actProd = Object.entries(engage).some(
      ([k, v]) => v && rules.acts[k as ActivityCat]
    );
    const contentProd = contentMajor.some((c) => rules.content[c]);
    const moodBad = baseline.negMoodIsUnprod && moodDelta < 0;

    const yResearch = goalProd && actProd && contentProd && !moodBad ? 1 : 0;
    const prodNorm = ((prodSelf as number) - 1) / 4; // 0‑1
    const sessionScore = 0.6 * prodNorm + 0.4 * yResearch;

    const data = {
      ...dataRaw,
      moodDelta,
      prodNorm,
      yResearch,
      sessionScore,
      activeFlag: actProd,
    };

    /* 3. write to Firestore */
    await addDoc(collection(doc(db, "users", uid), "sessions"), data);

    router.push("/profile");
  };

  /* ---------- validation ---------- */
  const pageValid = () => {
    if (step === 1) return appUsed && durationIdx !== null && timeBucket;
    if (step === 2) return triggers.length && goalPrimary;
    if (step === 3) return moodPre && moodPost && prodSelf;
    if (step === 4) return contentMajor.length && loc && multitask;
    return false;
  };

  /* ---------- UI helpers ---------- */
  const labelCls = "block text-sm mb-1 mt-4";
  const inputCls = "w-full p-2 rounded bg-transparent border border-[#f3ede0]";

  /* ---------- render ---------- */
  return (
    <div>
      <BTNavbar />
      <div className="min-h-screen bg-[#0d1623] flex flex-col items-center py-6 px-4 text-[#f3ede0]">
        <Image
          src="/trackingbehaviorlogo.png"
          alt="logo"
          width={200}
          height={50}
        />

        <div className="w-full max-w-sm md:max-w-md bg-[#00101e] p-6 rounded border border-[#f3ede0] mt-6">
          <h2 className="text-2xl font-bold mb-2">Add a New Session</h2>
          <p className="text-sm mb-4">
            Through this page, you will log each new social‑media session so we
            can improve your behaviour insights.
          </p>

          {/* progress */}
          <div className="w-full h-2 bg-[#112233] rounded mb-6 overflow-hidden">
            <div
              className="h-full bg-[#f3ede0] transition-all duration-300"
              style={{ width: `${step * 25}%` }}
            />
          </div>

          {/* ---------- STEP 1 ---------- */}
          {step === 1 && (
            <>
              <h3 className="text-xl font-semibold mb-2">
                Page 1: Session Metrics
              </h3>

              <label className={labelCls}>Which app did you use?</label>
              <select
                className={inputCls}
                value={appUsed}
                onChange={(e) => setAppUsed(e.target.value)}
              >
                <option value="" disabled>
                  Select app
                </option>
                {appList.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>

              <label className={labelCls}>
                How long did this session last?
              </label>
              <select
                className={inputCls}
                value={durationIdx ?? ""}
                onChange={(e) => setDurationIdx(Number(e.target.value))}
              >
                <option value="" disabled>
                  Select duration
                </option>
                {durationBuckets.map((b, i) => (
                  <option key={b.label} value={i}>
                    {b.label}
                  </option>
                ))}
              </select>

              <label className={labelCls}>
                When did this session take place?
              </label>
              <select
                className={inputCls}
                value={timeBucket}
                onChange={(e) => setTimeBucket(e.target.value as TimeBucket)}
              >
                <option value="" disabled>
                  Select time of day
                </option>
                {timeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* ---------- STEP 2 ---------- */}
          {step === 2 && (
            <>
              <h3 className="text-xl font-semibold mb-2">
                Page 2: Intent & Engagement
              </h3>
              <p className="text-sm mb-1">Main reasons (select all)</p>
              {triggerList.map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-2 text-sm capitalize"
                >
                  <input
                    type="checkbox"
                    checked={triggers.includes(t)}
                    onChange={() => toggleArray(triggers, t, setTriggers)}
                  />
                  {t.replace(/_/g, " ")}
                </label>
              ))}

              <label className={labelCls}>Primary goal</label>
              <select
                className={inputCls}
                value={goalPrimary}
                onChange={(e) => setGoalPrimary(e.target.value as GoalCat)}
              >
                <option value="" disabled>
                  Choose goal
                </option>
                {goalList.map((g) => (
                  <option key={g} value={g}>
                    {g.replace(/_/g, " ")}
                  </option>
                ))}
              </select>

              <p className="text-sm mb-1 mt-4">What did you do? (select all)</p>
              {actList.map((a) => (
                <label
                  key={a}
                  className="flex items-center gap-2 text-sm capitalize"
                >
                  <input
                    type="checkbox"
                    checked={engage[a]}
                    onChange={() => toggleEngage(a)}
                  />
                  {a}
                </label>
              ))}
            </>
          )}

          {/* ---------- STEP 3 ---------- */}
          {step === 3 && (
            <>
              <h3 className="text-xl font-semibold mb-2">
                Page 3: Mood & Productivity
              </h3>
              <label className={labelCls}>Mood before</label>
              <select
                className={inputCls}
                value={moodPre}
                onChange={(e) => setMoodPre(Number(e.target.value) as any)}
              >
                <option value="" disabled>
                  Select mood
                </option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <label className={labelCls}>Mood after</label>
              <select
                className={inputCls}
                value={moodPost}
                onChange={(e) => setMoodPost(Number(e.target.value) as any)}
              >
                <option value="" disabled>
                  Select mood
                </option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <label className={labelCls}>Self‑rated productivity (1‑5)</label>
              <select
                className={inputCls}
                value={prodSelf}
                onChange={(e) => setProdSelf(Number(e.target.value) as any)}
              >
                <option value="" disabled>
                  Select value
                </option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* ---------- STEP 4 ---------- */}
          {step === 4 && (
            <>
              <h3 className="text-xl font-semibold mb-2">
                Page 4: Content & Context
              </h3>
              <p className="text-sm mb-1">Main content (up to 2)</p>
              {contentList.map((c) => (
                <label
                  key={c}
                  className="flex items-center gap-2 text-sm capitalize"
                >
                  <input
                    type="checkbox"
                    checked={contentMajor.includes(c)}
                    disabled={
                      contentMajor.includes(c)
                        ? false
                        : contentMajor.length >= 2
                    }
                    onChange={() =>
                      toggleArray(contentMajor, c, setContentMajor)
                    }
                  />
                  {c.replace(/_/g, " ")}
                </label>
              ))}

              <label className={labelCls}>Where were you?</label>
              <select
                className={inputCls}
                value={loc}
                onChange={(e) => setLoc(e.target.value as any)}
              >
                <option value="" disabled>
                  Select location
                </option>
                <option value="home">Home</option>
                <option value="work">Work / School</option>
                <option value="commute">Commuting</option>
                <option value="outside">Outdoors</option>
                <option value="bed">In bed</option>
                <option value="other">Other</option>
              </select>

              <label className={labelCls}>Multitasking?</label>
              <select
                className={inputCls}
                value={multitask}
                onChange={(e) => setMultitask(e.target.value as any)}
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="tv">Watching TV</option>
                <option value="eating">Eating</option>
                <option value="working">Working / Studying</option>
                <option value="none">None</option>
                <option value="other">Other</option>
              </select>
            </>
          )}

          {/* ---------- nav buttons ---------- */}
          <div className="flex gap-2 mt-6">
            {step > 1 && (
              <button
                className="flex-1 py-2 border border-[#f3ede0] rounded"
                onClick={() => setStep((step - 1) as Step)}
              >
                Back
              </button>
            )}
            {step < 4 && (
              <button
                disabled={!pageValid()}
                className="flex-1 py-2 bg-[#f3ede0] text-[#00101e] font-semibold rounded disabled:opacity-40"
                onClick={() => setStep((step + 1) as Step)}
              >
                Next
              </button>
            )}
            {step === 4 && (
              <button
                disabled={!pageValid()}
                className="flex-1 py-2 bg-[#f3ede0] text-[#00101e] font-semibold rounded disabled:opacity-40"
                onClick={handleSubmit}
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

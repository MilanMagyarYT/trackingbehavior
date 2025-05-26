"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import BTNavbar from "@/app/components/BTNavbar";
import BTBottomNav from "@/app/components/BTBottomNav";
import SimpleSelect from "@/app/components/SimpleSelect";
import { MultiSelect } from "primereact/multiselect";
import { useAppSelector } from "@/app/store";
import "../components/AddNewSession.css";
import "../components/StartSetup.css";
import type { Option } from "@/app/components/SimpleSelect";

type TimeBucket = "morning" | "afternoon" | "evening" | "night";

const timeOptions: Option[] = [
  { label: "Morning (6-11)", value: "morning" },
  { label: "Afternoon (11-17)", value: "afternoon" },
  { label: "Evening (17-22)", value: "evening" },
  { label: "Late-Night (22-6)", value: "night" },
];

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
  { label: "< 5 min", mid: 3 },
  { label: "5 ‑ 15 min", mid: 10 },
  { label: "15 ‑ 30 min", mid: 22 },
  { label: "30 ‑ 60 min", mid: 45 },
  { label: "> 60 min", mid: 70 },
] as const;

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
type MoodRating = 1 | 2 | 3 | 4 | 5;
type LocCat = "home" | "work" | "commute" | "outside" | "bed" | "other";
type MultiCat = "tv" | "eating" | "working" | "none" | "other";

interface ProdRules {
  goals: Record<GoalCat, boolean>;
  acts: Record<ActivityCat, boolean>;
  content: Record<ContentCat, boolean>;
}

interface UserBaseline {
  prodRules: ProdRules;
  negMoodIsUnprod: boolean;
}

type TriggerCat = (typeof triggerList)[number];
type GoalCat = (typeof goalList)[number];
type ActivityCat = (typeof actList)[number];
type ContentCat = (typeof contentList)[number];
type Step = 1 | 2 | 3 | 4 | 5 | 6;

const mkBoolRecord = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, false])) as Record<K, boolean>;

const todayStr = () =>
  new Date().toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
const nowStr = () =>
  new Date().toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AddNewSession() {
  const { uid, status } = useAppSelector((s) => s.auth);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const [step, setStep] = useState<Step>(1);

  const [appUsed, setApp] = useState<string>("");
  const [durIdx, setDurIdx] = useState<number | null>(null);
  const [dayPart, setDayPart] = useState<TimeBucket | "">("");

  const [triggers, setTrig] = useState<TriggerCat[]>([]);
  const [goal, setGoal] = useState<GoalCat | "">("");
  const [acts, setActs] = useState<Record<ActivityCat, boolean>>(() =>
    mkBoolRecord(actList)
  );

  const [moodPre, setPre] = useState<1 | 2 | 3 | 4 | 5 | "">("");
  const [moodPost, setPost] = useState<1 | 2 | 3 | 4 | 5 | "">("");
  const [prodSelf, setProd] = useState<1 | 2 | 3 | 4 | 5 | "">("");

  const [content, setCont] = useState<ContentCat[]>([]);
  const [loc, setLoc] = useState<
    "home" | "work" | "commute" | "outside" | "bed" | "other" | ""
  >("");
  const [multi, setMulti] = useState<
    "tv" | "eating" | "working" | "none" | "other" | ""
  >("");

  const [baseline, setBase] = useState<UserBaseline | null>(null);
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((s) => {
      if (s.exists()) setBase(s.data() as UserBaseline);
    });
  }, [uid]);

  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return appUsed && durIdx !== null && dayPart;
      case 2:
        return triggers.length && goal && Object.values(acts).some(Boolean);
      case 3:
        return moodPre && moodPost && prodSelf;
      case 4:
        return content.length && loc && multi;
      case 5:
        return true;
      default:
        return false;
    }
  }, [
    step,
    appUsed,
    durIdx,
    dayPart,
    triggers,
    goal,
    acts,
    moodPre,
    moodPost,
    prodSelf,
    content,
    loc,
    multi,
  ]);

  if (status === "unauthenticated") return null;
  if (status === "loading" || baseline === null) return <CenteredSpinner />;

  const saveSession = async () => {
    if (!uid || durIdx === null) return;
    const durMin = durationBuckets[durIdx].mid;
    const moodDelta = (moodPost as number) - (moodPre as number);
    const rules = baseline!.prodRules;

    const goalProd = goal ? rules.goals[goal as GoalCat] : false;
    const actProd = Object.entries(acts).some(
      ([k, v]) => v && rules.acts[k as ActivityCat]
    );
    const contProd = content.some((c) => rules.content[c]);
    const moodBad = baseline!.negMoodIsUnprod && moodDelta < 0;

    const yResearch = goalProd && actProd && contProd && !moodBad ? 1 : 0;
    const prodNorm = ((prodSelf as number) - 1) / 4;
    const sessionScore = 0.6 * prodNorm + 0.4 * yResearch;

    await addDoc(collection(doc(db, "users", uid), "sessions"), {
      createdAt: serverTimestamp(),
      appId: appUsed,
      durMin,
      timeBucket: dayPart,
      triggers,
      goalPrimary: goal,
      engagement: acts,
      moodPre,
      moodPost,
      moodDelta,
      prodSelf,
      prodNorm,
      yResearch,
      sessionScore,
      contentMajor: content,
      loc,
      multitask: multi,
      activeFlag: actProd,
    });
    setStep(6);
  };

  const Row = ({ l, v }: { l: string; v: string }) => (
    <>
      <p className="su-review-label">{l}</p>
      <div className="su-review-value">{v}</div>
    </>
  );

  return (
    <div className="navbarwithmilan">
      <BTNavbar />
      {step < 6 && (
        <main className="sn-bg">
          <header className="sn-session">
            <h3>session {nowStr()}</h3>
            <span>{todayStr()}</span>
          </header>
          <section className="su-card sn-card">
            <span className="su-step-badge sn-step-badge">step {step}</span>

            <h2 className="sn-title">add new session</h2>
            <p className="su-sub sn-sub">
              {step === 1 && "session numerical metrics"}
              {step === 2 && "session intent and engagement"}
              {step === 3 && "session mood and productivity"}
              {step === 4 && "session content type and context"}
              {step === 5 &&
                "it’s of high importance to gather the correct data, so that our algorithm will make the correct calculations"}
            </p>

            <div className="su-progress">
              <div
                className="sn-progress-bar"
                style={{ width: `${step * 20}%` }}
              />
            </div>

            {step === 1 && (
              <>
                <label className="sn-label">
                  which social media app did you just use?
                </label>
                <SimpleSelect
                  value={appUsed}
                  onChange={setApp}
                  placeholder="select app"
                  options={appList.map((a) => ({ label: a, value: a }))}
                />

                <label className="sn-label">
                  how long did this session last?
                </label>
                <SimpleSelect
                  value={durIdx === null ? "" : durIdx.toString()}
                  onChange={(v) => setDurIdx(Number(v))}
                  placeholder="select duration"
                  options={durationBuckets.map((b, i) => ({
                    label: b.label,
                    value: i.toString(),
                  }))}
                />

                <label className="sn-label">
                  when did this session take place?
                </label>
                <SimpleSelect
                  value={dayPart}
                  onChange={(v) => setDayPart(v as TimeBucket)}
                  placeholder="select time of day"
                  options={timeOptions}
                />
              </>
            )}

            {step === 2 && (
              <>
                <label className="sn-label">
                  what was the main reason you opened this app?
                </label>
                <MultiSelect
                  className="su-multi"
                  display="chip"
                  placeholder="choose answers"
                  value={triggers}
                  options={triggerList.map((t) => ({
                    label: t.replace(/_/g, " "),
                    value: t,
                  }))}
                  onChange={(e) => setTrig(e.value as TriggerCat[])}
                />

                <label className="sn-label">
                  what was your primary goal when opening this app?
                </label>
                <SimpleSelect
                  value={goal}
                  onChange={(v) => setGoal(v as GoalCat)}
                  placeholder="choose goal"
                  options={goalList.map((g) => ({ label: g, value: g }))}
                />

                <label className="sn-label">
                  what did you do during this session? (select all)
                </label>
                <MultiSelect
                  className="su-multi"
                  display="chip"
                  placeholder="choose answers"
                  value={Object.keys(acts).filter(
                    (k) => acts[k as ActivityCat]
                  )}
                  options={actList.map((a) => ({ label: a, value: a }))}
                  onChange={(e) => {
                    const sel = e.value as ActivityCat[];
                    setActs(mkBoolRecord(actList));
                    sel.forEach((k) => setActs((p) => ({ ...p, [k]: true })));
                  }}
                />
              </>
            )}

            {step === 3 && (
              <>
                <label className="sn-label">
                  how was your mood before this session?
                </label>
                <SimpleSelect
                  value={moodPre.toString()}
                  onChange={(v) => setPre(Number(v) as MoodRating)}
                  placeholder="select value"
                  options={[1, 2, 3, 4, 5].map((n) => ({
                    label: n.toString(),
                    value: n.toString(),
                  }))}
                />

                <label className="sn-label">
                  how was your mood after this session?
                </label>
                <SimpleSelect
                  value={moodPost.toString()}
                  onChange={(v) => setPost(Number(v) as MoodRating)}
                  placeholder="select value"
                  options={[1, 2, 3, 4, 5].map((n) => ({
                    label: n.toString(),
                    value: n.toString(),
                  }))}
                />

                <label className="sn-label">
                  how productive do you think this session was?
                </label>
                <SimpleSelect
                  value={prodSelf.toString()}
                  onChange={(v) => setProd(Number(v) as MoodRating)}
                  placeholder="select value"
                  options={[1, 2, 3, 4, 5].map((n) => ({
                    label: n.toString(),
                    value: n.toString(),
                  }))}
                />
              </>
            )}

            {step === 4 && (
              <>
                <label className="sn-label">
                  what kind of content did you mostly engage with?
                </label>
                <MultiSelect
                  className="su-multi"
                  display="chip"
                  placeholder="choose content"
                  maxSelectedLabels={2}
                  value={content}
                  options={contentList.map((c) => ({
                    label: c.replace(/_/g, " "),
                    value: c,
                  }))}
                  onChange={(e) => setCont(e.value as ContentCat[])}
                />

                <label className="sn-label">
                  where were you while using social media this session?
                </label>
                <SimpleSelect
                  value={loc}
                  onChange={(v) => setLoc(v as LocCat)}
                  placeholder="select location"
                  options={[
                    { label: "home", value: "home" },
                    { label: "work / school", value: "work" },
                    { label: "commuting", value: "commute" },
                    { label: "outdoors", value: "outside" },
                    { label: "in bed", value: "bed" },
                    { label: "other", value: "other" },
                  ]}
                />

                <label className="sn-label">
                  were you doing anything else while using social media?
                </label>
                <SimpleSelect
                  value={multi}
                  onChange={(v) => setMulti(v as MultiCat)}
                  placeholder="select"
                  options={[
                    { label: "watching TV", value: "tv" },
                    { label: "eating", value: "eating" },
                    { label: "working / studying", value: "working" },
                    { label: "none", value: "none" },
                    { label: "other", value: "other" },
                  ]}
                />
              </>
            )}

            {step === 5 && (
              <>
                <div className="su-btn-row">
                  <button className="su-btn-outline" onClick={() => setStep(4)}>
                    back
                  </button>
                  <button
                    className="su-btn-primary sn-btn-primary"
                    disabled={!stepValid}
                    onClick={saveSession}
                  >
                    submit session
                  </button>
                </div>

                <div className="su-review">
                  <Row
                    l="which social media app did you just use?"
                    v={appUsed}
                  />
                  <Row
                    l="how long did this session last?"
                    v={durationBuckets[durIdx!].label}
                  />
                  <Row l="when did this session take place?" v={dayPart} />
                  <Row
                    l="what was the main reason you opened this app? (select all)"
                    v={triggers.join(", ")}
                  />
                  <Row
                    l="what was your primary goal when opening this app?"
                    v={goal}
                  />
                  <Row
                    l="what did you do during this session? (select all)"
                    v={Object.keys(acts)
                      .filter((k) => acts[k as ActivityCat])
                      .join(", ")}
                  />
                  <Row
                    l="how was your mood before this session?"
                    v={moodPre.toString()}
                  />
                  <Row
                    l="how was your mood after this session?"
                    v={moodPost.toString()}
                  />
                  <Row
                    l="how productive do you think this session was?"
                    v={prodSelf.toString()}
                  />
                  <Row
                    l="what kind of content did you mostly engage with?"
                    v={content.join(", ")}
                  />
                  <Row
                    l="where were you while using social media this session?"
                    v={loc}
                  />
                  <Row
                    l="were you doing anything else while using social media?"
                    v={multi}
                  />
                </div>
              </>
            )}
            <div className="su-btn-row sn-btn-row">
              {step > 1 && (
                <button
                  className="su-btn-outline sn-btn-outline"
                  onClick={() => setStep((step - 1) as Step)}
                >
                  back
                </button>
              )}
              {step < 5 && (
                <button
                  className="su-btn-primary sn-btn-primary"
                  disabled={!stepValid}
                  onClick={() => setStep((step + 1) as Step)}
                >
                  next step
                </button>
              )}
            </div>
          </section>
        </main>
      )}
      {step === 6 && (
        <div className="su-bg">
          <section className="su-card">
            <span className="su-done-icon">✓</span>

            <h2 className="su-title2">session added</h2>

            <p className="su-sub2">
              you have successfully added a new social-media session at{" "}
              {nowStr()}
            </p>

            <button
              className="su-btn-primary su-btn-full"
              onClick={() => router.push("/profile")}
            >
              go to behavior tracking portal
            </button>
          </section>
        </div>
      )}

      <BTBottomNav />
    </div>
  );
}

const CenteredSpinner = () => (
  <div className="acc-loader">
    <div className="acc-spinner" />
  </div>
);

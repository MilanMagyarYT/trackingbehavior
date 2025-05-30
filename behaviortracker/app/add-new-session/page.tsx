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
  "YouTube",
  "Facebook",
  "WhatsApp",
  "Instagram",
  "Twitter",
  "TikTok",
  "Snapchat",
  "LinkedIn",
  "Reddit",
  "Twitch",
  "Messenger",
  "Telegram",
  "Discord",
] as const;

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

type MoodRating = -2 | -1 | 0 | 1 | 2;

type LocCat =
  | "commuting – car, bus, train or subway"
  | "home – living room / couch"
  | "toilet"
  | "home – in bed"
  | "home office / desk"
  | "gym"
  | "workplace – at your desk"
  | "classroom / meeting room"
  | "cafe / restaurant";

type MultiCat =
  | "none"
  | "eating"
  | "working / studying"
  | "listening to music or podcasts"
  | "exercising"
  | "cooking"
  | "commuting"
  | "audio/video call";

interface ProdRules {
  goals: Record<GoalCat, boolean>;
  acts: Record<ActivityCat, boolean>;
  content: Record<ContentCat, boolean>;
  triggers: Record<TriggerCat, boolean>;
}

interface UserBaseline {
  prodRules: ProdRules;
  negMoodIsUnprod: boolean;
  goalPhoneMin: number;
}

type TriggerCat = (typeof triggerList)[number];
type GoalCat = (typeof goalList)[number];
type ActivityCat = (typeof actList)[number];
type ContentCat = (typeof contentList)[number];
type Step = 1 | 2 | 3 | 4 | 5 | 6;

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
  const [step, setStep] = useState<Step>(1);
  const [appUsed, setApp] = useState<string>("");
  const [dayPart, setDayPart] = useState<TimeBucket | "">("");
  const [triggers, setTrig] = useState<TriggerCat[]>([]);
  const [activities, setActivities] = useState<ActivityCat[]>([]);
  const [goal, setGoal] = useState<GoalCat | "">("");
  const [baseline, setBase] = useState<UserBaseline | null>(null);
  const [duration, setDuration] = useState<string>("");
  const [moodDifference, setMoodDifference] = useState<
    -2 | -1 | 0 | 1 | 2 | ""
  >("");
  const [prodSelf, setProd] = useState<-2 | -1 | 0 | 1 | 2 | "">("");
  const [content, setCont] = useState<ContentCat[]>([]);
  const [loc, setLoc] = useState<
    | "commuting – car, bus, train or subway"
    | "home – living room / couch"
    | "toilet"
    | "home – in bed"
    | "home office / desk"
    | "gym"
    | "workplace – at your desk"
    | "classroom / meeting room"
    | "cafe / restaurant"
    | ""
  >("");
  const [multi, setMulti] = useState<
    | "none"
    | "eating"
    | "working / studying"
    | "listening to music or podcasts"
    | "exercising"
    | "cooking"
    | "commuting"
    | "audio/video call"
    | ""
  >("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((s) => {
      if (s.exists()) setBase(s.data() as UserBaseline);
    });
  }, [uid]);

  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return appUsed && duration && dayPart;
      case 2:
        return triggers.length && goal && activities;
      case 3:
        return moodDifference && prodSelf;
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
    duration,
    dayPart,
    triggers,
    goal,
    activities,
    moodDifference,
    prodSelf,
    content,
    loc,
    multi,
  ]);

  if (status === "unauthenticated") return null;
  if (status === "loading" || baseline === null) return <CenteredSpinner />;

  const computeRawScore = () => {
    if (!baseline) return 0;

    const M = Number(moodDifference) / 2;
    const P = multi === "none" ? 0 : -1;

    const avg = <T extends string>(
      arr: T[],
      lookup: Record<T, boolean>
    ): number =>
      arr.reduce((sum, key) => sum + (lookup[key] ? 1 : -1), 0) / arr.length;

    const C = avg(content, baseline.prodRules.content);
    const T = avg(triggers, baseline.prodRules.triggers);
    const A = avg(activities, baseline.prodRules.acts);
    const G = baseline.prodRules.goals[goal as GoalCat] ? 1 : -1;
    const selfP = Number(prodSelf) / 2;

    return (
      0.23 * M +
      0.19 * C +
      0.19 * T +
      0.15 * P +
      0.1 * A +
      0.06 * G +
      0.08 * selfP
    );
  };

  const computeDeltaPoints = (rawScore: number) => {
    const B = Number(baseline!.goalPhoneMin);
    const minutes = Number(duration);
    const rate = 50 / B;
    const rawPts = rawScore * minutes * rate;
    const deltaPoints = rawPts > 0 ? Math.ceil(rawPts) : Math.floor(rawPts);
    return deltaPoints;
  };

  const saveSession = async () => {
    if (!uid) return;

    const rawScore = computeRawScore();
    const deltaPoints = computeDeltaPoints(rawScore);
    const minutes = Number(duration);

    await addDoc(collection(doc(db, "users", uid), "sessions"), {
      appId: appUsed,
      contentMajor: content,
      createdAt: serverTimestamp(),
      duration: minutes,
      engagement: activities,
      goalPrimary: goal,
      location: loc,
      moodDifference,
      multitask: multi,
      prodSelf,
      timeBucket: dayPart,
      triggers,
      rawScore,
      deltaPoints,
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
            <h3>session at {nowStr()}</h3>
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
                  how long did this session last?
                </label>
                <input
                  className="sn-input"
                  type="number"
                  placeholder="add session duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <label className="sn-label">
                  which social media app did you use?
                </label>
                <SimpleSelect
                  value={appUsed}
                  onChange={setApp}
                  placeholder="select app"
                  options={appList.map((a) => ({ label: a, value: a }))}
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
                  what were the reasons you opened this social media app?
                  (select all)
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
                  what was your primary goal when opening this social media app?
                </label>
                <SimpleSelect
                  value={goal}
                  onChange={(v) => setGoal(v as GoalCat)}
                  placeholder="choose goal"
                  options={goalList.map((g) => ({ label: g, value: g }))}
                />

                <label className="sn-label">
                  what activities did you do during this social media session?
                  (select all)
                </label>
                <MultiSelect
                  className="su-multi"
                  display="chip"
                  placeholder="choose answers"
                  value={activities}
                  options={actList.map((t) => ({
                    label: t.replace(/_/g, " "),
                    value: t,
                  }))}
                  onChange={(e) => setActivities(e.value as ActivityCat[])}
                />
              </>
            )}

            {step === 3 && (
              <>
                <label className="sn-label">
                  did you go through a mood change after the social media
                  session?
                </label>
                <SimpleSelect
                  value={moodDifference.toString()}
                  onChange={(v) => setMoodDifference(Number(v) as MoodRating)}
                  placeholder="select value"
                  options={[
                    {
                      label: "-2 (much worse)",
                      value: "-2",
                    },
                    {
                      label: "-1 (slightly worse)",
                      value: "-1",
                    },
                    {
                      label: "0 (no change)",
                      value: "0",
                    },
                    {
                      label: "1 (slightly better)",
                      value: "1",
                    },
                    {
                      label: "2 (much better)",
                      value: "2",
                    },
                  ]}
                />

                <label className="sn-label">
                  how productive was your social media session?
                </label>
                <SimpleSelect
                  value={prodSelf.toString()}
                  onChange={(v) => setProd(Number(v) as MoodRating)}
                  placeholder="select value"
                  options={[
                    {
                      label: "-2 (very unproductive)",
                      value: "-2",
                    },
                    {
                      label: "-1 (slightly unproductive)",
                      value: "-1",
                    },
                    {
                      label: "0 (neutral)",
                      value: "0",
                    },
                    {
                      label: "1 (slightly productive)",
                      value: "1",
                    },
                    {
                      label: "2 (very productive)",
                      value: "2",
                    },
                  ]}
                />
              </>
            )}

            {step === 4 && (
              <>
                <label className="sn-label">
                  what type of content did you engage with during this social
                  media session? (select all)
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
                    {
                      label: "commuting – car, bus, train or subway",
                      value: "commuting – car, bus, train or subway",
                    },
                    {
                      label: "home – living room / couch",
                      value: "home – living room / couch",
                    },
                    { label: "toilet", value: "toilet" },
                    { label: "home – in bed", value: "home – in bed" },
                    {
                      label: "home office / desk",
                      value: "home office / desk",
                    },
                    { label: "gym", value: "gym" },
                    {
                      label: "workplace – at your desk",
                      value: "workplace – at your desk",
                    },
                    {
                      label: "classroom / meeting room",
                      value: "classroom / meeting room",
                    },
                    { label: "cafe / restaurant", value: "cafe / restaurant" },
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
                    { label: "none", value: "none" },
                    { label: "eating", value: "eating" },
                    {
                      label: "working / studying",
                      value: "working / studying",
                    },
                    {
                      label: "listening to music or podcasts",
                      value: "listening to music or podcasts",
                    },
                    { label: "exercising", value: "exercising" },
                    { label: "cooking", value: "cooking" },
                    { label: "commuting", value: "commuting" },
                    { label: "audio/video call", value: "audio/video call" },
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
                    submit
                  </button>
                </div>

                <div className="su-review">
                  <Row
                    l="which social media app did you just use?"
                    v={appUsed}
                  />
                  <Row l="how long did this session last?" v={duration} />
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
                    v={activities.join(", ")}
                  />
                  <Row
                    l="did you go through a mood change after the social media session?"
                    v={moodDifference.toString()}
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
              {step > 1 && step < 5 && (
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

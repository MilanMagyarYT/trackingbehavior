"use client";
import { FieldValue, Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import BTNavbar from "@/app/components/BTNavbar";
import BTBottomNav from "@/app/components/BTBottomNav";
import SimpleSelect from "@/app/components/SimpleSelect";
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
  triggers: Record<TriggerCat, boolean>;
  goals: Record<GoalCat, boolean>;
  acts: Record<ActivityCat, boolean>;
  content: Record<ContentCat, boolean>;
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

// A preset’s shape (in Firestore under users/{uid}/presets):
interface Preset {
  name: string;
  appId: string;
  dayPart: TimeBucket;
  trigger: TriggerCat;
  activity: ActivityCat;
  goal: GoalCat;
  duration: number;
  moodDifference: MoodRating;
  prodSelf: MoodRating;
  content: ContentCat;
  loc: LocCat;
  multi: MultiCat;
}

// A session doc’s shape (in Firestore under users/{uid}/sessions):
interface SessionDoc {
  appId: string;
  timeBucket: TimeBucket;
  trigger: TriggerCat;
  engagement: ActivityCat;
  goalPrimary: GoalCat;
  duration: number;
  moodDifference: MoodRating;
  prodSelf: MoodRating;
  contentMajor: ContentCat;
  location: LocCat;
  multitask: MultiCat;
  rawScore: number;
  deltaPoints: number;
  createdAt: FieldValue | Timestamp;
}

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

  // ---- MODE SELECTION ----
  type Mode = "choose" | "new" | "preset" | "savePreset";
  const [mode, setMode] = useState<Mode>("choose");

  // ---- LOAD BASELINE ----
  const [baseline, setBase] = useState<UserBaseline | null>(null);
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((s) => {
      if (s.exists()) setBase(s.data() as UserBaseline);
    });
  }, [uid]);

  // ---- STATE FOR NEW SESSION STEPS ----
  const [step, setStep] = useState<Step>(1);
  const [appUsed, setApp] = useState<string>("");
  const [dayPart, setDayPart] = useState<TimeBucket | "">("");
  const [trigger, setTrigger] = useState<TriggerCat | "">("");
  const [activity, setActivity] = useState<ActivityCat | "">("");
  const [goal, setGoal] = useState<GoalCat | "">("");
  const [duration, setDuration] = useState<string>("");
  const [moodDifference, setMoodDifference] = useState<MoodRating | "">("");
  const [prodSelf, setProd] = useState<MoodRating | "">("");
  const [content, setCont] = useState<ContentCat | "">("");
  const [loc, setLoc] = useState<LocCat | "">("");
  const [multi, setMulti] = useState<MultiCat | "">("");

  // ---- STATE FOR PRESETS ----
  const [presets, setPresets] = useState<{ id: string; data: Preset }[]>([]);
  const [presetName, setPresetName] = useState<string>("");

  // ---- VALIDATION FOR NEW-SESSION STEPS ----
  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return !!appUsed && !!duration && !!dayPart;
      case 2:
        return !!trigger && !!goal && !!activity;
      case 3:
        return moodDifference !== "" && prodSelf !== "";
      case 4:
        return !!content && !!loc && !!multi;
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
    trigger,
    goal,
    activity,
    moodDifference,
    prodSelf,
    content,
    loc,
    multi,
  ]);

  // ---- COMPUTE rawScore & deltaPoints ----
  const computeRawScore = () => {
    const M = Number(moodDifference) / 2; // –2..+2 → –1..+1
    const P = multi === "none" ? 0 : -1;
    const selfP = Number(prodSelf) / 2; // –2..+2 → –1..+1

    // Single‐choice lookups → either 1 (productive) or –1 (unproductive)
    const C = baseline!.prodRules.content[content as ContentCat] ? 1 : -1;
    const T = baseline!.prodRules.triggers[trigger as TriggerCat] ? 1 : -1;
    const A = baseline!.prodRules.acts[activity as ActivityCat] ? 1 : -1;
    const G = baseline!.prodRules.goals[goal as GoalCat] ? 1 : -1;

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
    return rawPts > 0 ? Math.ceil(rawPts) : Math.floor(rawPts);
  };

  // ---- SAVE SESSION TO Firestore ----
  const saveSession = async () => {
    if (!uid) return;
    const rawScore = computeRawScore();
    const deltaPoints = computeDeltaPoints(rawScore);
    const minutes = Number(duration);

    const sessionDoc: SessionDoc = {
      appId: appUsed,
      timeBucket: dayPart as TimeBucket,
      trigger: trigger as TriggerCat,
      engagement: activity as ActivityCat,
      goalPrimary: goal as GoalCat,
      duration: minutes,
      moodDifference: moodDifference as MoodRating,
      prodSelf: prodSelf as MoodRating,
      contentMajor: content as ContentCat,
      location: loc as LocCat,
      multitask: multi as MultiCat,
      rawScore,
      deltaPoints,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(doc(db, "users", uid), "sessions"), sessionDoc);
    setStep(6);
  };

  // ---- SAVE NEW PRESET TO Firestore ----
  const savePreset = async () => {
    if (!uid || presetName.trim() === "") return;
    const preset: Preset = {
      name: presetName.trim(),
      appId: appUsed,
      dayPart: dayPart as TimeBucket,
      trigger: trigger as TriggerCat,
      activity: activity as ActivityCat,
      goal: goal as GoalCat,
      duration: Number(duration),
      moodDifference: moodDifference as MoodRating,
      prodSelf: prodSelf as MoodRating,
      content: content as ContentCat,
      loc: loc as LocCat,
      multi: multi as MultiCat,
    };
    await addDoc(collection(doc(db, "users", uid), "presets"), preset);
    setPresetName("");
    setMode("preset");
  };

  // ---- APPLY A PRESET TO THE FORM ----
  const handleUsePreset = (p: Preset) => {
    setApp(p.appId);
    setDayPart(p.dayPart);
    setTrigger(p.trigger);
    setActivity(p.activity);
    setGoal(p.goal);
    setDuration(String(p.duration));
    setMoodDifference(p.moodDifference);
    setProd(p.prodSelf);
    setCont(p.content);
    setLoc(p.loc);
    setMulti(p.multi);
    setStep(5);
    setMode("new");
  };

  // ---- VALIDATION FOR “Save Preset” ----
  const canSavePreset = useMemo(() => {
    return (
      presetName.trim() !== "" &&
      !!appUsed &&
      !!duration &&
      !!dayPart &&
      !!trigger &&
      !!goal &&
      !!activity &&
      moodDifference !== "" &&
      prodSelf !== "" &&
      !!content &&
      !!loc &&
      !!multi
    );
  }, [
    presetName,
    appUsed,
    duration,
    dayPart,
    trigger,
    goal,
    activity,
    moodDifference,
    prodSelf,
    content,
    loc,
    multi,
  ]);

  // ---- LOAD PRESETS FOR “Use a Preset” MODE ----
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "users", uid, "presets"),
      orderBy("name", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr: { id: string; data: Preset }[] = [];
      snap.forEach((d) => arr.push({ id: d.id, data: d.data() as Preset }));
      setPresets(arr);
    });
    return () => unsub();
  }, [uid]);

  // ---- AUTH/LOADING GUARDS ----
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);
  if (status === "unauthenticated") return null;
  if (status === "loading" || baseline === null) {
    return (
      <div className="acc-loader">
        <div className="acc-spinner" />
      </div>
    );
  }

  // ---- RENDER “Choose Mode” ----
  if (mode === "choose") {
    return (
      <div className="navbarwithmilan">
        <BTNavbar />
        <div className="sn-bg">
          <main className="su-card">
            <h2 className="su-title">select action</h2>
            <p className="su-sub">
              add a new session for today, you win back your time one session at
              a time
            </p>
            <button
              className="su-btn-primary su-btn-full"
              onClick={() => setMode("new")}
            >
              add a new session
            </button>
            <button
              className="su-btn-outline su-btn-full"
              onClick={() => setMode("preset")}
            >
              use a preset
            </button>
          </main>
        </div>
        <BTBottomNav />
      </div>
    );
  }

  // ---- RENDER “Use a Preset” ----
  if (mode === "preset") {
    return (
      <div className="navbarwithmilan">
        <BTNavbar />
        <div className="sn-bg">
          <main className="su-card">
            <h2 className="su-title">your presets</h2>
            <p className="su-sub">
              the list of session presets you have, to be more efficient with
              your time
            </p>
            {presets.length === 0 && <p>no presets yet.</p>}
            {presets.map((p) => (
              <div key={p.id} className="preset-row">
                <span className="preset-name">{p.data.name}</span>
                <button
                  className="su-btn-primary"
                  onClick={() => handleUsePreset(p.data)}
                >
                  Use
                </button>
              </div>
            ))}
            <button
              className="su-btn-outline su-btn-full"
              onClick={() => setMode("savePreset")}
            >
              create a new preset
            </button>
            <button
              className="su-btn-outline su-btn-full"
              onClick={() => setMode("choose")}
            >
              back
            </button>
          </main>
        </div>
        <BTBottomNav />
      </div>
    );
  }

  // ---- RENDER “Save Preset” ----
  if (mode === "savePreset") {
    return (
      <div className="navbarwithmilan">
        <BTNavbar />
        <div className="sn-bg">
          <main className="su-card">
            <h2 className="su-title">new preset</h2>
            <p className="su-sub">add a new preset</p>
            <label className="su-label">preset name</label>
            <input
              className="su-input"
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g. Insta Quick"
            />

            <label className="su-label">
              which social media app did you use?
            </label>
            <SimpleSelect
              options={appList.map((a) => ({ label: a, value: a }))}
              value={appUsed}
              onChange={setApp}
              placeholder="select app"
            />

            <label className="su-label">how long did this session last?</label>
            <input
              className="su-input"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <label className="su-label">
              when did this session take place?
            </label>
            <SimpleSelect
              options={timeOptions}
              value={dayPart}
              onChange={(v) => setDayPart(v as TimeBucket)}
              placeholder="select time"
            />

            <label className="su-label">
              what was the main reason you opened this app?
            </label>
            <SimpleSelect
              options={triggerList.map((t) => ({
                label: t.replace(/_/g, " "),
                value: t,
              }))}
              value={trigger}
              onChange={(v) => setTrigger(v as TriggerCat)}
              placeholder="select trigger"
            />

            <label className="su-label">what was your primary goal?</label>
            <SimpleSelect
              options={goalList.map((g) => ({ label: g, value: g }))}
              value={goal}
              onChange={(v) => setGoal(v as GoalCat)}
              placeholder="select goal"
            />

            <label className="su-label">what activity did you do?</label>
            <SimpleSelect
              options={actList.map((a) => ({
                label: a.replace(/_/g, " "),
                value: a,
              }))}
              value={activity}
              onChange={(v) => setActivity(v as ActivityCat)}
              placeholder="select activity"
            />

            <label className="su-label">
              did you go through a mood change?
            </label>
            <SimpleSelect
              options={[
                { label: "-2 (much worse)", value: "-2" },
                { label: "-1 (slightly worse)", value: "-1" },
                { label: "0 (no change)", value: "0" },
                { label: "1 (slightly better)", value: "1" },
                { label: "2 (much better)", value: "2" },
              ]}
              value={moodDifference.toString()}
              onChange={(v) => setMoodDifference(Number(v) as MoodRating)}
              placeholder="select mood"
            />

            <label className="su-label">how productive was the session?</label>
            <SimpleSelect
              options={[
                { label: "-2 (very unproductive)", value: "-2" },
                { label: "-1 (slightly unproductive)", value: "-1" },
                { label: "0 (neutral)", value: "0" },
                { label: "1 (slightly productive)", value: "1" },
                { label: "2 (very productive)", value: "2" },
              ]}
              value={prodSelf.toString()}
              onChange={(v) => setProd(Number(v) as MoodRating)}
              placeholder="select rating"
            />

            <label className="su-label">
              what type of content did you engage with?
            </label>
            <SimpleSelect
              options={contentList.map((c) => ({
                label: c.replace(/_/g, " "),
                value: c,
              }))}
              value={content}
              onChange={(v) => setCont(v as ContentCat)}
              placeholder="select content"
            />

            <label className="su-label">where were you?</label>
            <SimpleSelect
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
                { label: "home office / desk", value: "home office / desk" },
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
              value={loc}
              onChange={(v) => setLoc(v as LocCat)}
              placeholder="select location"
            />

            <label className="su-label">were you doing anything else?</label>
            <SimpleSelect
              options={[
                { label: "none", value: "none" },
                { label: "eating", value: "eating" },
                { label: "working / studying", value: "working / studying" },
                {
                  label: "listening to music or podcasts",
                  value: "listening to music or podcasts",
                },
                { label: "exercising", value: "exercising" },
                { label: "cooking", value: "cooking" },
                { label: "commuting", value: "commuting" },
                { label: "audio/video call", value: "audio/video call" },
              ]}
              value={multi}
              onChange={(v) => setMulti(v as MultiCat)}
              placeholder="select multitask"
            />

            <div className="su-btn-row">
              <button
                className="su-btn-outline"
                onClick={() => setMode("preset")}
              >
                back to presets
              </button>
              <button
                className="su-btn-primary"
                disabled={!canSavePreset}
                onClick={savePreset}
              >
                save preset
              </button>
            </div>
          </main>
        </div>
        <BTBottomNav />
      </div>
    );
  }

  // ---- “Add New Session” FLOW (mode="new") ----
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
            <span className="su-step-badge sn-step-badge">
              step&nbsp;{step}
            </span>

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

            {/* ===== STEP 1 ===== */}
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

            {/* ===== STEP 2 ===== */}
            {step === 2 && (
              <>
                <label className="sn-label">
                  what were the reasons you opened this social media app?
                </label>
                <SimpleSelect
                  options={triggerList.map((t) => ({
                    label: t.replace(/_/g, " "),
                    value: t,
                  }))}
                  value={trigger}
                  onChange={(v) => setTrigger(v as TriggerCat)}
                  placeholder="select trigger"
                />

                <label className="sn-label">
                  what was your primary goal when opening this social media app?
                </label>
                <SimpleSelect
                  value={goal}
                  onChange={(v) => setGoal(v as GoalCat)}
                  placeholder="select goal"
                  options={goalList.map((g) => ({ label: g, value: g }))}
                />

                <label className="sn-label">
                  what activity did you do during this social media session?
                </label>
                <SimpleSelect
                  options={actList.map((a) => ({
                    label: a.replace(/_/g, " "),
                    value: a,
                  }))}
                  value={activity}
                  onChange={(v) => setActivity(v as ActivityCat)}
                  placeholder="select activity"
                />
              </>
            )}

            {/* ===== STEP 3 ===== */}
            {step === 3 && (
              <>
                <label className="sn-label">
                  did you go through a mood change after the social media
                  session?
                </label>
                <SimpleSelect
                  value={moodDifference.toString()}
                  onChange={(v) => setMoodDifference(Number(v) as MoodRating)}
                  placeholder="select mood"
                  options={[
                    { label: "-2 (much worse)", value: "-2" },
                    { label: "-1 (slightly worse)", value: "-1" },
                    { label: "0 (no change)", value: "0" },
                    { label: "1 (slightly better)", value: "1" },
                    { label: "2 (much better)", value: "2" },
                  ]}
                />

                <label className="sn-label">
                  how productive was your social media session?
                </label>
                <SimpleSelect
                  value={prodSelf.toString()}
                  onChange={(v) => setProd(Number(v) as MoodRating)}
                  placeholder="select rating"
                  options={[
                    { label: "-2 (very unproductive)", value: "-2" },
                    { label: "-1 (slightly unproductive)", value: "-1" },
                    { label: "0 (neutral)", value: "0" },
                    { label: "1 (slightly productive)", value: "1" },
                    { label: "2 (very productive)", value: "2" },
                  ]}
                />
              </>
            )}

            {/* ===== STEP 4 ===== */}
            {step === 4 && (
              <>
                <label className="sn-label">
                  what type of content did you engage with during this social
                  media session?
                </label>
                <SimpleSelect
                  options={contentList.map((c) => ({
                    label: c.replace(/_/g, " "),
                    value: c,
                  }))}
                  value={content}
                  onChange={(v) => setCont(v as ContentCat)}
                  placeholder="select content"
                />

                <label className="sn-label">
                  where were you while using social media this session?
                </label>
                <SimpleSelect
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
                  value={loc}
                  onChange={(v) => setLoc(v as LocCat)}
                  placeholder="select location"
                />

                <label className="sn-label">
                  were you doing anything else while using social media?
                </label>
                <SimpleSelect
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
                  value={multi}
                  onChange={(v) => setMulti(v as MultiCat)}
                  placeholder="select multitask"
                />
              </>
            )}

            {/* ===== STEP 5: REVIEW & SUBMIT ===== */}
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
                  <Row l="social media app" v={appUsed} />
                  <Row l="session duration" v={`${duration} min`} />
                  <Row l="time of day" v={dayPart} />
                  <Row l="trigger" v={trigger} />
                  <Row l="primary goal" v={goal} />
                  <Row l="activity" v={activity} />
                  <Row l="mood change" v={moodDifference.toString()} />
                  <Row l="self-rating" v={prodSelf.toString()} />
                  <Row l="content type" v={content} />
                  <Row l="location" v={loc} />
                  <Row l="multitasking" v={multi} />
                </div>
              </>
            )}

            {/* NAVIGATION BUTTONS */}
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

      {/* ===== STEP 6: SUCCESS MESSAGE ===== */}
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

function Row({ l, v }: { l: string; v: string }) {
  return (
    <>
      <p className="su-review-label">{l}</p>
      <div className="su-review-value">{v}</div>
    </>
  );
}

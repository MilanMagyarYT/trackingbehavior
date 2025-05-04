// app/components/HowItWorks.tsx
import { Eye, Smartphone, Laptop } from "lucide-react";
import StepCard from "./BTStepCard";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="flex flex-col gap-8 px-6">
      <header className="text-center">
        <span className="inline-block rounded-full border border-textSecondary px-4 py-1 text-xs uppercase text-textSecondary">
          behavior tracking explained
        </span>
        <h2 className="mt-4 text-title font-semibold">how it works</h2>
        <p className="mt-2 text-md text-textSecondary">
          the simple three step process <br /> to improving your habits.
        </p>
      </header>

      <StepCard
        step={1}
        title="set‑up your account"
        icon={<Smartphone size={96} className="stroke-accent" />}
      >
        From defining your average versus target screen time to selecting
        productive triggers, goals, activities, and content types, personalize
        your settings so the app can deliver tailored daily recommendations and
        targets.
      </StepCard>

      <StepCard
        step={2}
        title="track each social‑media session"
        icon={<Eye size={96} className="stroke-accent" />}
        highlight
      >
        Easily log each social‑media session with one tap: capture app,
        duration, time, triggers, activities, and mood shifts; the system
        computes your session score and aggregates them into daily history.
      </StepCard>

      <StepCard
        step={3}
        title="analyze daily insights"
        icon={<Laptop size={96} className="stroke-accent" />}
      >
        Review your personalized daily metrics summary each morning and adjust
        habits, limit unproductive time, and optimize your social‑media use.
      </StepCard>
    </section>
  );
}

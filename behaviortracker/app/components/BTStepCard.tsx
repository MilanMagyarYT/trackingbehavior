// app/components/StepCard.tsx
import { ReactNode } from "react";

export default function BTStepCard({
  step,
  icon,
  title,
  children,
  highlight = false,
}: {
  step: number;
  icon: ReactNode;
  title: string;
  children: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl border ${
        highlight ? "border-accent" : "border-card"
      } p-6 pb-10`}
    >
      <span
        className={`absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-medium ${
          highlight ? "bg-accent" : "bg-card"
        }`}
      >
        {step}
      </span>
      <div className="flex items-center justify-center">{icon}</div>
      <h3 className="mt-6 text-md font-semibold capitalize">{title}</h3>
      <p className="mt-2 text-base text-textSecondary">{children}</p>
    </div>
  );
}

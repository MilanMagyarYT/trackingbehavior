// app/components/Hero.tsx
"use client";
import Image from "next/image";

export default function BTHero() {
  return (
    <header className="relative flex flex-col items-center px-6 pt-6 pb-12 text-center">
      {/* logo + burger */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" width={28} height={28} />
          <span className="font-semibold text-md uppercase leading-tight">
            tracking
            <br />
            behavior
          </span>
        </div>
        <button aria-label="menu" className="space-y-1.5 p-2">
          <span className="block h-0.5 w-5 bg-textPrimary"></span>
          <span className="block h-0.5 w-5 bg-textPrimary"></span>
          <span className="block h-0.5 w-5 bg-textPrimary"></span>
        </button>
      </div>

      {/* badge */}
      <span className="mt-8 inline-block rounded-full border border-textSecondary px-4 py-1 text-xs uppercase text-textSecondary">
        best for people who desire change
      </span>

      <h1 className="mt-6 text-title font-semibold leading-tight">
        learn to improve your <br /> social‑media habits
      </h1>

      <p className="mt-4 text-md font-medium text-textSecondary">
        a tool built for <br /> students by students.
      </p>

      <a
        href="#how-it-works"
        className="mt-8 inline-block rounded-md bg-accent px-6 py-3 text-md font-medium text-primaryBg shadow-md shadow-accent/30"
      >
        start behavior tracking
      </a>
    </header>
  );
}

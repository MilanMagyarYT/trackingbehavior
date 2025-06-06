"use client";

import React from "react";
import {
  IoChevronBackCircleOutline,
  IoChevronForwardCircleOutline,
} from "react-icons/io5";
import "@/app/components/Advice.css";

interface DaySelectorProps {
  dayLabel: string;
  onPrev: () => void;
  onNext: () => void;
}

export default function DaySelector({
  dayLabel,
  onPrev,
  onNext,
}: DaySelectorProps) {
  return (
    <div className="advice-date-nav">
      <button type="button" className="advice-nav-btn" onClick={onPrev}>
        <IoChevronBackCircleOutline />
      </button>
      <span className="advice-date-label">{dayLabel}</span>
      <button type="button" className="advice-nav-btn" onClick={onNext}>
        <IoChevronForwardCircleOutline />
      </button>
    </div>
  );
}

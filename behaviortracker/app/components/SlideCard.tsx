"use client";

import React from "react";
import "../components/SlideCard.css";

interface SlideCardProps {
  index: number;
  title: string;
  subtitle: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
}

export default function SlideCard({
  index,
  title,
  subtitle,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: SlideCardProps) {
  return (
    <section className="acc-card slider-item">
      <div className="acc-card-header">
        <div className="acc-section-title">{index}</div>
        <h3 className="acc-card-title">{title}</h3>
        <p className="acc-card-sub">{subtitle}</p>
      </div>

      <div className="acc-row two-cols">
        <div>
          <label>{leftLabel}</label>
          <input type="text" readOnly value={leftValue} />
        </div>
        <div>
          <label>{rightLabel}</label>
          <input type="text" readOnly value={rightValue} />
        </div>
      </div>
    </section>
  );
}

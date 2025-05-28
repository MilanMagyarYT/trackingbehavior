"use client";

import { FaArrowRight } from "react-icons/fa";
import "./BTSetupBanner.css";

export default function BTSetupBanner({ onClick }: { onClick: () => void }) {
  return (
    <button className="setup-banner" onClick={onClick}>
      <FaArrowRight className="setup-icon" />
      <div className="setup-text">
        <span className="setup-title">set‑up account</span>
        <span className="setup-sub">
          you have not started setting‑up your
          <br />
          account, cannot use the app without it
        </span>
      </div>
    </button>
  );
}

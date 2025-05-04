import "./BTTextSubTitle.css";
import React from "react";

export default function BTTextSubTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bt-subtitle">
      <span className="bt-subtitle-text">{children}</span>
    </div>
  );
}

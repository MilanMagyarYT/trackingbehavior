import React from "react";
import "./BTButtonCTA2.css";

interface BTButtonCTAProps {
  text: string;
  onChange: () => void;
}

export default function BTButtonCTA2({ text, onChange }: BTButtonCTAProps) {
  return (
    <div className="bt-buttoncta2-wrapper">
      <button type="button" className="bt-buttoncta2" onClick={onChange}>
        {text}
      </button>
    </div>
  );
}

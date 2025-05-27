import React from "react";
import "./BTButtonCTA5.css";

interface BTButtonCTAProps {
  text: string;
  onChange: () => void;
}

export default function BTButtonCTA({ text, onChange }: BTButtonCTAProps) {
  return (
    <div className="bt-buttoncta-wrapper">
      <button type="button" className="bt-buttoncta" onClick={onChange}>
        {text}
      </button>
    </div>
  );
}

import React from "react";
import "./CategoryScoring.css";

type Val = -1 | 0 | 1;

type CategoryScoringProps<K extends string> = {
  label: string;
  options: readonly K[];
  values: Record<K, Val>;
  onChange: (key: K, val: Val) => void;
};

export default function CategoryScoring<K extends string>({
  label,
  options,
  values,
  onChange,
}: CategoryScoringProps<K>) {
  return (
    <details className="btcs-details">
      <summary className="btcs-summary">{label}</summary>
      <div className="btcs-list">
        {options.map((opt) => (
          <div key={opt} className="btcs-item">
            <span className="btcs-label">{opt}</span>
            <div className="btcs-options">
              {([-1, 0, 1] as Val[]).map((val) => (
                <label key={val} className="btcs-radio-label">
                  <input
                    type="radio"
                    name={`${label}-${opt}`}
                    value={val}
                    checked={values[opt] === val}
                    onChange={() => onChange(opt, val)}
                    className="btcs-radio"
                  />
                  <span className="btcs-val">{val}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

import { useEffect, useRef, useState } from "react";
import "./SimpleSelect.css";

interface Option {
  label: string;
  value: string;
}

export default function SimpleSelect({
  options,
  value,
  onChange,
  placeholder = "select …",
}: {
  options: Option[];
  value: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  /* close on click‑outside */
  useEffect(() => {
    const h = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  /* keyboard nav */
  function handleKey(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }

    if (open) {
      if (e.key === "ArrowDown") {
        setActive((p) => (p + 1) % options.length);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setActive((p) => (p - 1 + options.length) % options.length);
        e.preventDefault();
      } else if (e.key === "Enter") {
        onChange(options[active].value);
        setOpen(false);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
  }

  return (
    <div className="su-select" ref={ref} tabIndex={0} onKeyDown={handleKey}>
      <div
        className="su-input su-select-display"
        onClick={() => setOpen((o) => !o)}
      >
        {value ? options.find((o) => o.value === value)?.label : placeholder}
      </div>

      {open && (
        <ul className="su-select-list">
          {options.map((o, i) => (
            <li
              key={o.value}
              className={`su-select-item ${i === active ? "is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

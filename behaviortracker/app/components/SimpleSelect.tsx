import { useEffect, useRef, useState } from "react";
import "./SimpleSelect.css";

export interface Option {
  label: string;
  value: string;
}

export default function SimpleSelect({
  options,
  value,
  onChange,
  placeholder = "select answer",
}: {
  options: Option[];
  value: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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
    <div className="btcs-select" ref={ref} tabIndex={0} onKeyDown={handleKey}>
      <div className="btcs-select-display" onClick={() => setOpen((o) => !o)}>
        {value ? options.find((o) => o.value === value)?.label : placeholder}
      </div>
      {open && (
        <ul ref={listRef} className="btcs-select-list">
          {options.map((o, i) => (
            <li
              key={o.value}
              className={`btcs-select-item ${i === active ? "is-active" : ""}`}
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

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

interface Option {
  value: string;
  label: string;
}

interface DropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

/** 브라우저 기본 <select> 는 펼침 목록을 꾸밀 수 없어서, 같은 동작을 우리 스타일로 그린 드롭다운. */
export default function Dropdown({ options, value, onChange, ariaLabel }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));

  // 바깥을 누르면 닫는다.
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function toggle() {
    setActive(selectedIndex);
    setOpen((o) => !o);
  }

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        toggle();
        return;
      }
      setActive((i) => Math.min(Math.max(i + (e.key === "ArrowDown" ? 1 : -1), 0), options.length - 1));
    } else if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      choose(options[active].value);
    }
  }

  return (
    <div className="dropdown" ref={ref} onKeyDown={onKeyDown}>
      <button
        type="button"
        className={`dropdown-trigger${open ? " open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={toggle}
      >
        {options[selectedIndex]?.label}
      </button>
      {open && (
        <ul className="dropdown-list" role="listbox" aria-label={ariaLabel}>
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`dropdown-option${o.value === value ? " on" : ""}${i === active ? " active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o.value)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

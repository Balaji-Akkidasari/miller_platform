import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";
const KEY = "miller.theme";

function read(): Mode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch { return "system"; }
}

function apply(mode: Mode) {
  const el = document.documentElement;
  if (mode === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", mode);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>(read);

  useEffect(() => { apply(mode); }, [mode]);

  const resolved = mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : mode;

  const next = () => {
    const to: Mode = resolved === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, to); } catch { /* private mode */ }
    setMode(to);
  };

  return (
    <button className="tglow" type="button" onClick={next}
            aria-label={resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
      {resolved === "dark" ? (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="10" cy="10" r="3.6" />
          <path d="M10 1.6v2M10 16.4v2M18.4 10h-2M3.6 10h-2M15.9 4.1l-1.4 1.4M5.5 14.5l-1.4 1.4M15.9 15.9l-1.4-1.4M5.5 5.5L4.1 4.1" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M16.5 12.4A7 7 0 017.6 3.5a7 7 0 108.9 8.9z" />
        </svg>
      )}
    </button>
  );
}

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  /** true while the cross-theme transition is animating */
  isChanging: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "webwheels-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [isChanging, setIsChanging] = useState(false);
  const isFirstRun = useRef(true);

  // Apply theme to <html> and animate the swap
  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isFirstRun.current && !prefersReducedMotion) {
      root.classList.add("theme-transition");
      setIsChanging(true);
    }

    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    root.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);

    // Keep the browser UI (mobile address bar) in sync with the theme
    const meta = document.querySelector('meta[name="theme-color"]');
    const color = theme === "dark" ? "#060d1a" : "#f5f7fb";
    if (meta) {
      meta.setAttribute("content", color);
    } else {
      const el = document.createElement("meta");
      el.name = "theme-color";
      el.content = color;
      document.head.appendChild(el);
    }

    isFirstRun.current = false;

    const timer = window.setTimeout(() => {
      root.classList.remove("theme-transition");
      setIsChanging(false);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [theme]);

  // Follow the OS preference while the user hasn't picked a theme explicitly
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) => {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
      setThemeState(e.matches ? "light" : "dark");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isChanging,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme, isChanging]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

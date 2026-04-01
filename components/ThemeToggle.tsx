"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";

const COOKIE = "wiryo-theme";
const YEAR = 60 * 60 * 24 * 365;

function setThemeCookie(value: "dark" | "light") {
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${YEAR}; SameSite=Lax`;
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  function toggle() {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setThemeCookie("light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      setThemeCookie("dark");
      setIsDark(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

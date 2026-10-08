"use client";

import { useEffect, useState } from "react";
import { getThemeMode, toggleThemeMode } from "@noahwright/design";
import { ToggleIcon } from "../ui";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(getThemeMode() === "dark");
  }, []);

  return (
    <ToggleIcon
      preset="moon-sun"
      isToggled={isDark}
      onChange={() => setIsDark(toggleThemeMode() === "dark")}
    />
  );
}

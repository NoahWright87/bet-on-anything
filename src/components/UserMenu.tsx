"use client";

import { useEffect, useState } from "react";
import { Avatar, Menu, getThemeMode, toggleThemeMode } from "@noahwright/design";
import { usePlayer } from "../lib/player";

/** Avatar in the header; opens the account menu. Account controls will live here. */
export default function UserMenu() {
  const player = usePlayer();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(getThemeMode() === "dark");
  }, []);

  return (
    <Menu
      align="right"
      label="Account menu"
      trigger={<Avatar name={player.name} alt="Account menu" size={40} />}
      items={[
        { text: player.name, disabled: true },
        {
          icon: isDark ? "☀️" : "🌙",
          text: isDark ? "Light mode" : "Dark mode",
          onClick: () => setIsDark(toggleThemeMode() === "dark"),
        },
      ]}
    />
  );
}

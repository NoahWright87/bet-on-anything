"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { Avatar, Menu, Modal, Text, getThemeMode, toggleThemeMode } from "@noahwright/design";
import { useTable } from "../lib/game";
import { usePlayer } from "../lib/player";
import { tableCodeFromParam } from "../lib/roomCode";

/** Avatar in the header; opens the account menu. Account (and, for now, host) controls live here. */
export default function UserMenu() {
  const player = usePlayer();
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const inTable = pathname.startsWith("/table/");
  const table = useTable(inTable ? tableCodeFromParam(params.id) : "");

  const [isDark, setIsDark] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    setIsDark(getThemeMode() === "dark");
  }, []);

  const items = [
    { text: player.name, disabled: true },
    {
      icon: isDark ? "☀️" : "🌙",
      text: isDark ? "Light mode" : "Dark mode",
      onClick: () => setIsDark(toggleThemeMode() === "dark"),
    },
  ];
  if (inTable && table.isHost && !table.closed) {
    items.push({ icon: "🔒", text: "Close table", onClick: () => setConfirmClose(true) } as (typeof items)[number]);
  }

  return (
    <>
      <Menu
        align="right"
        label="Account menu"
        trigger={<Avatar name={player.name} alt="Account menu" size={40} />}
        items={items}
      />
      {confirmClose && (
        <Modal
          open
          onClose={() => setConfirmClose(false)}
          title="Close this table?"
          actions={[
            { label: "Keep open", variant: "secondary" },
            { label: "Close table", variant: "danger", onClick: table.closeTable },
          ]}
        >
          <Text>Nobody can place new bets afterward. Open bets can still be settled.</Text>
        </Modal>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button, Footer } from "@noahwright/design";
import { useTable } from "../lib/game";
import ChipCount from "./ChipCount";

/**
 * Sticky in-game dashboard shown on every table page: the room code (so it's easy to
 * read out to someone joining) and the player's table stats. The middle is reserved
 * for more stats.
 */
export default function TableFooter({ code }: { code: string }) {
  const { chips } = useTable(code);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard unavailable (insecure context, denied): the code is still on screen.
    }
  };

  return (
    <Footer
      isSticky
      left={
        <div className="hud__code">
          <span className="hud__caption">Room code · tap to copy</span>
          <Button variant="outline" onClick={copyCode} style={{ fontFamily: "var(--font-family-mono)", letterSpacing: "0.15em" }}>
            {copied ? "COPIED!" : code}
          </Button>
        </div>
      }
      right={<ChipCount amount={chips} />}
    />
  );
}

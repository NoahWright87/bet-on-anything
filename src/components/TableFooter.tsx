"use client";

import { useEffect, useState } from "react";
import { Footer } from "@noahwright/design";
import { useTable, type PlayerSummary } from "../lib/useTable";
import { formatChips } from "../lib/formatChips";
import ChipImage from "./ChipImage";

/** First name, plus a last initial only when two players would otherwise look the same. */
function shortName(name: string, all: PlayerSummary[]): string {
  const [first, ...rest] = name.split(" ");
  const clash = all.filter((p) => p.name.split(" ")[0] === first).length > 1;
  return clash && rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
}

/**
 * Sticky in-game dashboard on every table page. Your chips are big on the left (no name);
 * everyone else is on the right with a small chip, name and amount. The room code is a quiet
 * footnote underneath: easy to find and read out when someone is joining, but out of the way.
 */
export default function TableFooter({ code }: { code: string }) {
  const { players } = useTable(code);
  const [copied, setCopied] = useState(false);
  const me = players.find((p) => p.isYou);
  const others = players.filter((p) => !p.isYou);

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
      hasBottomSeparator
      bottom={
        <button type="button" className="hud__code" onClick={copyCode} aria-label={`Room code ${code.split("").join(" ")}. Tap to copy`}>
          {copied ? "Copied!" : <>Room code <span className="hud__code-value">{code}</span> · tap to copy</>}
        </button>
      }
    >
      <div className="hud">
        {me && (
          <div className="hud__you" aria-label={`Your chips: ${me.chips.toLocaleString("en-US")}`} title={`${me.chips.toLocaleString("en-US")} chips`}>
            <ChipImage size={36} />
            <span className="hud__you-chips">{formatChips(me.chips)}</span>
          </div>
        )}
        <ul className="hud__others" aria-label="Other players">
          {others.map((p) => (
            <li key={p.name} className="hud__other" title={`${p.name}: ${p.chips.toLocaleString("en-US")} chips`}>
              <ChipImage size={16} />
              <span className="hud__other-name">{shortName(p.name, players)}</span>
              <span className="hud__other-chips">{formatChips(p.chips)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Footer>
  );
}

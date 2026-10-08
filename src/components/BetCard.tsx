"use client";

import { Card } from "@noahwright/design";
import { betPot, type Bet } from "../lib/game";
import ChipCount from "./ChipCount";

/** One bet in the list. Roughly the height of the BET button; tap to open details. */
export default function BetCard({ bet, you, onOpen }: { bet: Bet; you: string; onOpen: () => void }) {
  const against = bet.counters.length;
  const who = bet.creator === you ? "You" : bet.creator;

  return (
    <Card
      interactive
      className="bet-card-root"
      role="button"
      tabIndex={0}
      aria-label={`${bet.description}. Open bet details`}
      onClick={onOpen}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="bet-card">
        <div className="bet-card__main">
          <span className="bet-card__title">{bet.description}</span>
          <span className="bet-card__meta">
            {who} · {against === 0 ? "no counters yet" : `${against} against`}
          </span>
        </div>
        <ChipCount amount={betPot(bet)} />
      </div>
    </Card>
  );
}

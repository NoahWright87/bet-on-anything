"use client";

import { HOUSE, formatChipsCompact, optionTotal, type Wager } from "../lib/bets";
import { playerColor } from "../lib/colors";
import ChipToken from "./ChipToken";

export type TileState = "normal" | "proposed" | "winner" | "loser";

const OFFSET = 14; // how far each extra backer's chip peeks out
const MAX_CHIPS = 3;

/**
 * One outcome of a bet: a stack of chips (one per backer, each in that player's color) with
 * the total on the front chip, and the outcome's name underneath. Tap to bet on it.
 */
export default function OptionTile({
  label,
  emoji,
  wagers,
  you,
  state = "normal",
  onClick,
}: {
  label: string;
  emoji?: string;
  wagers: Wager[];
  you: string;
  state?: TileState;
  onClick: () => void;
}) {
  const backers = Array.from(new Set(wagers.map((w) => w.player)));
  const shown = backers.slice(0, MAX_CHIPS);
  const total = optionTotal({ wagers });
  const width = 48 + OFFSET * Math.max(shown.length - 1, 0);

  return (
    <button
      type="button"
      className={`option-tile option-tile--${state}`}
      onClick={onClick}
      aria-label={`${label}: ${total} ${total === 1 ? "chip" : "chips"} from ${backers.length} ${backers.length === 1 ? "backer" : "backers"}${
        state === "winner" ? ", winner" : ""
      }. Open`}
    >
      <span className="option-tile__stack" style={{ width }}>
        {shown.map((player, i) => (
          <span key={player} className="option-tile__chip" style={{ left: i * OFFSET, zIndex: i }}>
            <ChipToken
              color={playerColor(player === HOUSE ? HOUSE : player, you)}
              label={i === shown.length - 1 ? formatChipsCompact(total) : undefined}
            />
          </span>
        ))}
        {state === "winner" && <span className="option-tile__badge" aria-hidden="true">🏆</span>}
      </span>
      <span className="option-tile__label">
        {emoji && <span aria-hidden="true">{emoji} </span>}
        {label}
      </span>
    </button>
  );
}

/** The "+" chip: tap to add a new guess to a bet. */
export function AddOptionTile({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="option-tile option-tile--add" onClick={onClick} aria-label="Add a guess">
      <span className="option-tile__stack" style={{ width: 48 }}>
        <span className="option-tile__chip" style={{ left: 0 }}>
          <ChipToken color="var(--secondary)" outline />
          <span className="option-tile__plus" aria-hidden="true">+</span>
        </span>
      </span>
      <span className="option-tile__label">&nbsp;</span>
    </button>
  );
}

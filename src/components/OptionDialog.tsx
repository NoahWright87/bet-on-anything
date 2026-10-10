"use client";

import { useState } from "react";
import { Button, Input, Modal, Text } from "@noahwright/design";
import {
  NOT_THAT_ID,
  allOptions,
  houseStake,
  optionTotal,
  type Bet,
  type TableSettings,
} from "../lib/bets";
import { formatChips } from "../lib/formatChips";
import { playerColor } from "../lib/colors";

/** Tap an outcome chip: see who backed it, bet on it, or (tucked away) say it was the winner. */
export default function OptionDialog({
  bet,
  optionId,
  settings,
  chips,
  you,
  closed,
  onWager,
  onToggleWinner,
  onClose,
}: {
  bet: Bet;
  optionId: string;
  settings: TableSettings;
  chips: number;
  you: string;
  closed: boolean;
  onWager: (betId: string, optionId: string, amount: number) => string | null;
  onToggleWinner: (betId: string, optionId: string) => void;
  onClose: () => void;
}) {
  const option = allOptions(bet, settings).find((o) => o.id === optionId);
  const [amountText, setAmountText] = useState(String(Math.min(50, chips)));
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState<string>();

  if (!option) return null;

  const isNotThat = option.id === NOT_THAT_ID;
  const settled = Boolean(bet.result);
  const canBet = !settled && !closed;
  const inProposal = bet.proposal?.winners.includes(option.id) ?? false;
  const amount = Number(amountText);
  const amountError =
    chips < 1 ? "You're out of chips" : Number.isInteger(amount) && amount >= 1 && amount <= chips ? undefined : `Pick 1 to ${chips} chips`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (amountError) return;
    const err = onWager(bet.id, option.id, amount);
    if (err) setServerError(err);
    else onClose();
  };

  // Total per player (a player can wager more than once).
  const byPlayer = new Map<string, number>();
  for (const w of option.wagers) byPlayer.set(w.player, (byPlayer.get(w.player) ?? 0) + w.amount);

  return (
    <Modal open onClose={onClose} title={`${bet.title}: ${isNotThat ? "Not that" : option.label}`} actions={[{ label: "Close", variant: "secondary" }]}>
      <div className="bet-detail">
        <div className="bet-detail__section">
          <span className="bet-detail__label">Backed by</span>
          {Array.from(byPlayer).map(([player, total]) => (
            <div className="bet-detail__row" key={player}>
              <span className="bet-detail__player">
                <span className="bet-detail__dot" style={{ background: playerColor(player, you) }} />
                {player === you ? "You" : player}
              </span>
              <strong>{formatChips(total)}</strong>
            </div>
          ))}
          <div className="bet-detail__row bet-detail__total">
            <span>Total</span>
            <strong>{formatChips(optionTotal(option))}</strong>
          </div>
        </div>

        {isNotThat && (
          <Text tone="muted">
            Wins if none of the guesses do.
            {houseStake(bet, settings) > 0 && ` The house has put in ${houseStake(bet, settings)}.`}
            {canBet && " Risky: more guesses can be added later."}
          </Text>
        )}

        {canBet ? (
          <form className="bet-form" onSubmit={submit}>
            <Input
              label="Your bet (chips)"
              name="amount"
              type="number"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              error={attempted ? amountError ?? serverError : undefined}
            />
            <Button type="submit" size="large" color={isNotThat ? "secondary" : "primary"} disabled={chips < 1} style={{ width: "100%" }}>
              BET ON {isNotThat ? "NOT THAT" : option.label.toUpperCase()}
            </Button>
          </form>
        ) : (
          <Text tone="muted">{settled ? "This bet is settled." : "This table is closed."}</Text>
        )}

        {!settled && (
          <details className="bet-detail__settle">
            <summary>Settle this bet</summary>
            <div className="bet-form">
              <Text tone="muted">
                {settings.confirmationsRequired} different people need to agree before chips are paid out. Mark more than one guess for a tie.
              </Text>
              <Button
                variant="outline"
                color="confirm"
                style={{ width: "100%" }}
                onClick={() => {
                  onToggleWinner(bet.id, option.id);
                  onClose();
                }}
              >
                {inProposal
                  ? `Take ${isNotThat ? "Not that" : option.label} off the winners`
                  : isNotThat
                    ? "None of the guesses were correct"
                    : `${option.label} was correct`}
              </Button>
            </div>
          </details>
        )}
      </div>
    </Modal>
  );
}

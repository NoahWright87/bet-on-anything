"use client";

import { useState } from "react";
import { Button, Input, Modal, Text } from "@noahwright/design";
import { betPot, type Bet } from "../lib/game";
import { formatChips } from "../lib/formatChips";
import ChipCount from "./ChipCount";

/** Mounted only while a bet is open, so the counter form starts fresh each time. */
export default function BetDetailsDialog({
  bet,
  chips,
  you,
  onCounter,
  onClose,
}: {
  bet: Bet;
  chips: number;
  you: string;
  onCounter: (betId: string, amount: number) => boolean;
  onClose: () => void;
}) {
  const isMine = bet.creator === you;
  const [amountText, setAmountText] = useState(String(Math.max(1, Math.min(bet.stake, chips))));
  const [attempted, setAttempted] = useState(false);

  const amount = Number(amountText);
  const amountError =
    chips < 1
      ? "You're out of chips"
      : Number.isInteger(amount) && amount >= 1 && amount <= chips
        ? undefined
        : `Pick 1 to ${chips} chips`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!amountError) onCounter(bet.id, amount);
  };

  return (
    <Modal open onClose={onClose} title={bet.description} actions={[{ label: "Close", variant: "secondary" }]}>
      <div className="bet-detail">
        <div className="bet-detail__row">
          <span>{isMine ? "You" : bet.creator} backed it</span>
          <strong>{formatChips(bet.stake)} chips</strong>
        </div>

        <div className="bet-detail__section">
          <span className="bet-detail__label">Against</span>
          {bet.counters.length === 0 ? (
            <Text tone="muted">No one yet</Text>
          ) : (
            bet.counters.map((c) => (
              <div className="bet-detail__row" key={c.id}>
                <span>{c.player === you ? "You" : c.player}</span>
                <strong>{formatChips(c.amount)} chips</strong>
              </div>
            ))
          )}
        </div>

        <div className="bet-detail__row bet-detail__pot">
          <span>Pot</span>
          <ChipCount amount={betPot(bet)} />
        </div>

        {isMine ? (
          <Text tone="muted">This is your bet. Others can counter it.</Text>
        ) : (
          <form className="bet-form" onSubmit={submit}>
            <Input
              label="Counter with (chips)"
              name="counter"
              type="number"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              error={attempted ? amountError : undefined}
            />
            <Button type="submit" size="large" color="secondary" disabled={chips < 1} style={{ width: "100%" }}>
              COUNTER
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@noahwright/design";
import { MAX_LABEL_LENGTH } from "../lib/game";

/** The "+" chip: add your own guess to a bet, with a stake. */
export default function NewOptionDialog({
  betTitle,
  chips,
  onAdd,
  onClose,
}: {
  betTitle: string;
  chips: number;
  onAdd: (guess: string, amount: number) => string | null;
  onClose: () => void;
}) {
  const [guess, setGuess] = useState("");
  const [amountText, setAmountText] = useState(String(Math.min(50, chips)));
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState<string>();

  const amount = Number(amountText);
  const guessError = guess.trim() ? serverError : "Add your guess";
  const amountError = Number.isInteger(amount) && amount >= 1 && amount <= chips ? undefined : `Pick 1 to ${chips} chips`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!guess.trim() || amountError) return;
    const err = onAdd(guess, amount);
    if (err) setServerError(err);
    else onClose();
  };

  return (
    <Modal open onClose={onClose} title={betTitle} actions={[{ label: "Cancel", variant: "secondary" }]}>
      <form className="bet-form" onSubmit={submit}>
        <Input
          label="Your guess"
          name="guess"
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value.slice(0, MAX_LABEL_LENGTH));
            setServerError(undefined);
          }}
          error={attempted ? guessError : undefined}
        />
        <Input
          label="Your stake (chips)"
          name="amount"
          type="number"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          error={attempted ? amountError : undefined}
        />
        <Button type="submit" size="large" color="secondary" style={{ width: "100%" }}>
          ADD GUESS
        </Button>
      </form>
    </Modal>
  );
}

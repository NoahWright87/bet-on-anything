"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@noahwright/design";
import { MAX_LABEL_LENGTH, MAX_TITLE_LENGTH } from "../lib/game";

const DEFAULT_STAKE = 50;

/** Mounted only while open, so the form starts fresh each time. */
export default function NewBetDialog({
  chips,
  onCreate,
  onClose,
}: {
  chips: number;
  onCreate: (title: string, guess: string, amount: number) => string | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [guess, setGuess] = useState("");
  const [amountText, setAmountText] = useState(String(Math.min(DEFAULT_STAKE, chips)));
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState<string>();

  const amount = Number(amountText);
  const titleError = title.trim() ? undefined : "Name the bet";
  const guessError = guess.trim() ? undefined : "Add your guess";
  const amountError = Number.isInteger(amount) && amount >= 1 && amount <= chips ? undefined : `Pick 1 to ${chips} chips`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (titleError || guessError || amountError) return;
    const err = onCreate(title, guess, amount);
    if (err) setServerError(err);
    else onClose();
  };

  return (
    <Modal open onClose={onClose} title="New bet" actions={[{ label: "Cancel", variant: "secondary" }]}>
      <form className="bet-form" onSubmit={submit}>
        <Input
          label="What's the bet?"
          name="title"
          placeholder="Challenge winner"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
          error={attempted ? titleError : undefined}
        />
        <Input
          label="Your guess"
          name="guess"
          placeholder="Andy"
          value={guess}
          onChange={(e) => setGuess(e.target.value.slice(0, MAX_LABEL_LENGTH))}
          error={attempted ? guessError : undefined}
        />
        <Input
          label="Your stake (chips)"
          name="amount"
          type="number"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          error={attempted ? amountError ?? serverError : undefined}
        />
        <Button type="submit" size="large" style={{ width: "100%" }}>
          PLACE BET
        </Button>
      </form>
    </Modal>
  );
}

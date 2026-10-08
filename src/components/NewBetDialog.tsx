"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@noahwright/design";
import { MAX_DESCRIPTION_LENGTH } from "../lib/game";

const DEFAULT_STAKE = 100;

/** Mounted only while open, so the form starts fresh each time. */
export default function NewBetDialog({
  chips,
  onPlace,
  onClose,
}: {
  chips: number;
  onPlace: (description: string, amount: number) => boolean;
  onClose: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState(String(Math.min(DEFAULT_STAKE, chips)));
  const [attempted, setAttempted] = useState(false);

  const amount = Number(amountText);
  const descriptionError = description.trim() ? undefined : "Describe the bet";
  const amountError =
    Number.isInteger(amount) && amount >= 1 && amount <= chips ? undefined : `Pick 1 to ${chips} chips`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (descriptionError || amountError) return;
    if (onPlace(description, amount)) onClose();
  };

  return (
    <Modal open onClose={onClose} title="New bet" actions={[{ label: "Cancel", variant: "secondary" }]}>
      <form className="bet-form" onSubmit={submit}>
        <Input
          label="What's the bet?"
          name="description"
          multiline
          rows={2}
          placeholder="Dad falls asleep before the second half"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
          error={attempted ? descriptionError : undefined}
        />
        <Input
          label="Your stake (chips)"
          name="amount"
          type="number"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          error={attempted ? amountError : undefined}
        />
        <Button type="submit" size="large" style={{ width: "100%" }}>
          PLACE BET
        </Button>
      </form>
    </Modal>
  );
}

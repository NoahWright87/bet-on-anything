"use client";

import { useState } from "react";
import { Button, Input, Modal, Text } from "@noahwright/design";
import { MAX_NAME_LENGTH } from "../../shared/limits";

/**
 * Asks who you are the first time you sit at a table (and again if the name is taken there).
 * Names are how the table tells players apart, so they must be unique per table; there are no
 * accounts yet. Leaving goes back to the landing page.
 */
export default function NamePrompt({
  initial,
  error,
  onSubmit,
  onLeave,
}: {
  initial: string;
  error: string | null;
  onSubmit: (name: string) => void;
  onLeave: () => void;
}) {
  const [name, setName] = useState(initial);
  const [attempted, setAttempted] = useState(false);

  const clean = name.trim().replace(/\s+/g, " ");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (clean) onSubmit(clean);
  };

  return (
    <Modal
      open
      onClose={onLeave}
      closeOnBackdrop={false}
      title="What's your name?"
      actions={[{ label: "Back", variant: "secondary" }]}
    >
      <form className="bet-form" onSubmit={submit}>
        <Text tone="muted">Your friends will see this on your chips and bets. Use the same name next time to keep your seat.</Text>
        <Input
          label="Your name"
          name="playerName"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
          error={error ?? (attempted && !clean ? "Add your name" : undefined)}
        />
        <Button type="submit" size="large" style={{ width: "100%" }}>
          SIT DOWN
        </Button>
      </form>
    </Modal>
  );
}

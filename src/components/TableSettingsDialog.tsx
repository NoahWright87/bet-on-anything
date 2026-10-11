"use client";

import { useState } from "react";
import { Button, Input, Modal, Text } from "@noahwright/design";
import type { TableSettings } from "../../shared/bets";

/** Host-only table settings. Mounted only while open, so the form starts from the current values. */
export default function TableSettingsDialog({
  settings,
  onSave,
  onRequestClose,
  onClose,
}: {
  settings: TableSettings;
  onSave: (settings: TableSettings) => void;
  onRequestClose: () => void; // "Close table…": the caller shows its confirmation
  onClose: () => void;
}) {
  const [percentText, setPercentText] = useState(String(settings.houseBidPercent));
  const [minText, setMinText] = useState(String(settings.houseBidMin));
  const [confirmText, setConfirmText] = useState(String(settings.confirmationsRequired));
  const [attempted, setAttempted] = useState(false);

  const percent = Number(percentText);
  const min = Number(minText);
  const confirmations = Number(confirmText);
  const percentError = percentText.trim() !== "" && Number.isFinite(percent) && percent >= 0 && percent <= 100 ? undefined : "Pick 0 to 100";
  const minError = minText.trim() !== "" && Number.isInteger(min) && min >= 0 ? undefined : "Pick 0 or more chips";
  const confirmError =
    confirmText.trim() !== "" && Number.isInteger(confirmations) && confirmations >= 1 ? undefined : "Pick 1 or more people";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (percentError || minError || confirmError) return;
    onSave({ houseBidPercent: percent, houseBidMin: min, confirmationsRequired: confirmations });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Table settings" actions={[{ label: "Cancel", variant: "secondary" }]}>
      <form className="bet-form" onSubmit={submit}>
        <Text tone="muted">
          Every time someone bets on a guess, the house adds free chips to &ldquo;Not that&rdquo;: a percentage of that
          bet, but at least the minimum. The more people bet, the bigger the pot for whoever wins. Set both to 0 for
          no free chips. Applies to open bets.
        </Text>
        <Input
          label="House bid (% of each bet)"
          name="houseBidPercent"
          type="number"
          value={percentText}
          onChange={(e) => setPercentText(e.target.value)}
          error={attempted ? percentError : undefined}
        />
        <Input
          label="House bid minimum (chips)"
          name="houseBidMin"
          type="number"
          value={minText}
          onChange={(e) => setMinText(e.target.value)}
          error={attempted ? minError : undefined}
        />
        <Input
          label="People who must agree to settle a bet"
          name="confirmationsRequired"
          type="number"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          error={attempted ? confirmError : undefined}
        />
        <Button type="submit" size="large" style={{ width: "100%" }}>
          SAVE
        </Button>
        <Button
          variant="outline"
          color="danger"
          style={{ width: "100%" }}
          onClick={() => {
            onClose();
            onRequestClose();
          }}
        >
          Close table…
        </Button>
      </form>
    </Modal>
  );
}

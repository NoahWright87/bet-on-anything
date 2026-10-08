"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, Heading, Input, Pill, Text } from "../../../ui";
import ChipWidget from "../../../components/ChipWidget";

export default function Table() {
  const { id } = useParams<{ id: string }>();
  const [amount, setAmount] = useState("0");

  return (
    <div className="page">
      <Heading level={1} eyebrow="Table">{decodeURIComponent(id)}</Heading>
      <Card title="Your chips" subtitle="Placeholder: betting isn't wired up yet" elevated>
        <div className="page__row">
          <Input
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <ChipWidget amount={Number.parseInt(amount, 10) || 0} />
        </div>
      </Card>
      <Text tone="muted">
        <Pill>Coming soon</Pill> participants, bets, and resolving winners.
      </Text>
    </div>
  );
}

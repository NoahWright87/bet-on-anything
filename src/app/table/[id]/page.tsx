"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button, Text } from "../../../ui";
import BetCard from "../../../components/BetCard";
import BetDetailsDialog from "../../../components/BetDetailsDialog";
import NewBetDialog from "../../../components/NewBetDialog";
import { useTable } from "../../../lib/game";
import { tableCodeFromParam } from "../../../lib/roomCode";

export default function Table() {
  const { id } = useParams<{ id: string }>();
  const { bets, chips, you, placeBet, counterBet } = useTable(tableCodeFromParam(id));
  const [newBetOpen, setNewBetOpen] = useState(false);
  const [openBetId, setOpenBetId] = useState<string | null>(null);
  const openBet = bets.find((b) => b.id === openBetId);

  return (
    <div className="page">
      <Button
        size="large"
        onClick={() => setNewBetOpen(true)}
        style={{ width: "100%", minHeight: "4.5rem", fontSize: "var(--text-xl)" }}
      >
        BET
      </Button>

      {bets.length === 0 && <Text tone="muted">No bets yet. Tap BET to start one.</Text>}
      {bets.map((bet) => (
        <BetCard key={bet.id} bet={bet} you={you} onOpen={() => setOpenBetId(bet.id)} />
      ))}

      {newBetOpen && <NewBetDialog chips={chips} onPlace={placeBet} onClose={() => setNewBetOpen(false)} />}
      {openBet && (
        <BetDetailsDialog
          bet={openBet}
          chips={chips}
          you={you}
          onCounter={counterBet}
          onClose={() => setOpenBetId(null)}
        />
      )}
    </div>
  );
}

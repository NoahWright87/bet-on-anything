"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Text } from "../../../ui";
import BetCard from "../../../components/BetCard";
import NewBetDialog from "../../../components/NewBetDialog";
import NewOptionDialog from "../../../components/NewOptionDialog";
import NamePrompt from "../../../components/NamePrompt";
import OptionDialog from "../../../components/OptionDialog";
import { getStoredName } from "../../../lib/player";
import { useTable } from "../../../lib/useTable";
import { tableCodeFromParam } from "../../../lib/roomCode";

export default function Table() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTable(tableCodeFromParam(id));
  const [newBetOpen, setNewBetOpen] = useState(false);
  const [optionTarget, setOptionTarget] = useState<{ betId: string; optionId: string } | null>(null);
  const [addToBetId, setAddToBetId] = useState<string | null>(null);

  const optionBet = t.bets.find((b) => b.id === optionTarget?.betId);
  const addBet = t.bets.find((b) => b.id === addToBetId);

  if (t.status === "missing") {
    return (
      <div className="page">
        <Card title="No such table">
          <Text tone="muted">Check the room code with whoever is hosting, or start a table of your own.</Text>
          <Button onClick={() => router.push("/")}>Back home</Button>
        </Card>
      </div>
    );
  }

  if (t.status === "needs-name") {
    return (
      <NamePrompt
        initial={getStoredName() ?? ""}
        error={t.nameError}
        onSubmit={t.setName}
        onLeave={() => router.push("/")}
      />
    );
  }

  if (!t.ready) {
    return (
      <div className="page">
        <Text tone="muted">{t.notice ?? "Joining the table…"}</Text>
      </div>
    );
  }

  return (
    <div className="page">
      {t.notice && (
        <p className="notice" role="alert">
          <span>{t.notice}</span>
          <Button size="small" variant="text" onClick={t.dismissNotice}>
            Dismiss
          </Button>
        </p>
      )}

      <Button
        size="large"
        disabled={t.closed}
        onClick={() => setNewBetOpen(true)}
        style={{ width: "100%", minHeight: "4.5rem", fontSize: "var(--text-xl)" }}
      >
        BET
      </Button>

      {t.closed && (
        <Card flat title="This table is closed">
          <Text tone="muted">No new bets, but any open bets can still be settled.</Text>
        </Card>
      )}

      {t.bets.length === 0 && !t.closed && <Text tone="muted">No bets yet. Tap BET to start one.</Text>}
      {t.bets.map((bet) => (
        <BetCard
          key={bet.id}
          bet={bet}
          you={t.you}
          settings={t.settings}
          closed={t.closed}
          actions={t}
          onOpenOption={(optionId) => setOptionTarget({ betId: bet.id, optionId })}
          onAddOption={() => setAddToBetId(bet.id)}
        />
      ))}

      {newBetOpen && <NewBetDialog chips={t.chips} onCreate={t.createBet} onClose={() => setNewBetOpen(false)} />}
      {addBet && (
        <NewOptionDialog
          betTitle={addBet.title}
          chips={t.chips}
          onAdd={(guess, amount) => t.addOption(addBet.id, guess, amount)}
          onClose={() => setAddToBetId(null)}
        />
      )}
      {optionTarget && optionBet && (
        <OptionDialog
          bet={optionBet}
          optionId={optionTarget.optionId}
          settings={t.settings}
          chips={t.chips}
          you={t.you}
          closed={t.closed}
          onWager={t.wager}
          onToggleWinner={t.proposeWinner}
          onClose={() => setOptionTarget(null)}
        />
      )}
    </div>
  );
}

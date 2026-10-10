"use client";

import { Button, Card } from "@noahwright/design";
import {
  NOT_THAT_ID,
  NOT_THAT_LABEL,
  allOptions,
  betPot,
  type Bet,
  type TableSettings,
} from "../lib/bets";
import { DEMO_MODE } from "../lib/game";
import OptionTile, { AddOptionTile, type TileState } from "./OptionTile";

export type BetActions = {
  confirmResolution: (betId: string) => void;
  cancelProposal: (betId: string) => void;
  simulateFriendConfirm: (betId: string) => void;
};

/** A full-width bet: the title out of the way, outcome chips below, "Not that" on the far right. */
export default function BetCard({
  bet,
  you,
  settings,
  closed,
  actions,
  onOpenOption,
  onAddOption,
}: {
  bet: Bet;
  you: string;
  settings: TableSettings;
  closed: boolean;
  actions: BetActions;
  onOpenOption: (optionId: string) => void;
  onAddOption: () => void;
}) {
  const options = allOptions(bet, settings);
  const listed = options.filter((o) => !o.isNotThat);
  const notThat = options.find((o) => o.isNotThat)!;
  const proposal = bet.proposal;
  const result = bet.result;
  const canBet = !result && !closed;

  const stateFor = (id: string): TileState => {
    if (result) return result.winners.includes(id) ? "winner" : "loser";
    if (proposal?.winners.includes(id)) return "proposed";
    return "normal";
  };

  const labelOf = (id: string) => options.find((o) => o.id === id)?.label ?? id;
  const winnerNames = (ids: string[]) =>
    ids.map((id) => (id === NOT_THAT_ID ? "None of the guesses" : labelOf(id))).join(" + ");

  const yourStake = options.reduce(
    (sum, o) => sum + o.wagers.filter((w) => w.player === you).reduce((s, w) => s + w.amount, 0),
    0,
  );
  const yourPayout = result?.payouts[you] ?? 0;

  return (
    <Card className="bet-card-root">
      <div className="bet-card__head">
        <span className="bet-card__title">{bet.title}</span>
        <span className="bet-card__pot">Pot {betPot(bet, settings).toLocaleString("en-US")}</span>
      </div>

      <div className="bet-card__row">
        <div className="bet-card__options">
          {listed.map((o) => (
            <OptionTile
              key={o.id}
              label={o.label}
              wagers={o.wagers}
              you={you}
              state={stateFor(o.id)}
              onClick={() => onOpenOption(o.id)}
            />
          ))}
          {canBet && <AddOptionTile onClick={onAddOption} />}
        </div>
        <OptionTile
          label={NOT_THAT_LABEL}
          emoji="👈"
          wagers={notThat.wagers}
          you={you}
          state={stateFor(NOT_THAT_ID)}
          onClick={() => onOpenOption(NOT_THAT_ID)}
        />
      </div>

      {proposal && (
        <div className="bet-card__banner" role="status">
          <span>
            {proposal.proposedBy === you ? "You say" : `${proposal.proposedBy} says`}{" "}
            <strong>{winnerNames(proposal.winners)}</strong> won ·{" "}
            {proposal.confirmedBy.length}/{settings.confirmationsRequired} confirmed
          </span>
          <span className="bet-card__banner-actions">
            {!proposal.confirmedBy.includes(you) && (
              <Button size="small" color="confirm" onClick={() => actions.confirmResolution(bet.id)}>
                CONFIRM
              </Button>
            )}
            <Button size="small" variant="outline" onClick={() => actions.cancelProposal(bet.id)}>
              Not yet
            </Button>
            {DEMO_MODE && (
              <Button size="small" variant="text" onClick={() => actions.simulateFriendConfirm(bet.id)}>
                Demo: a friend confirms
              </Button>
            )}
          </span>
        </div>
      )}

      {result && (
        <div className="bet-card__result">
          <strong>{winnerNames(result.winners)}</strong> won
          {yourStake > 0 &&
            (yourPayout > 0 ? ` · you got ${yourPayout.toLocaleString("en-US")}` : " · you lost your stake")}
        </div>
      )}
    </Card>
  );
}

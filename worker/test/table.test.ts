import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, NOT_THAT_ID, chipsOf } from "../../shared/bets";
import { STARTING_CHIPS } from "../../shared/limits";
import { applyAction, applyChange, type Action, type Env, type TableState } from "../../shared/table";

let n = 0;
let clock = 0;
const env: Env = { newId: (p) => `${p}-${++n}`, now: () => ++clock };

const fresh = (): TableState => ({
  host: "Alex",
  players: ["Alex", "Sam", "Jordan"],
  bets: [],
  settings: DEFAULT_SETTINGS,
  closed: false,
});

/** Runs an action as `who` and applies the result, failing the test if it was rejected. */
function run(state: TableState, who: string, action: Action): TableState {
  const out = applyAction(state, who, action, env);
  if (!out.ok) throw new Error(`rejected: ${out.error}`);
  return applyChange(state, out.change);
}
const reject = (state: TableState, who: string, action: Action) => {
  const out = applyAction(state, who, action, env);
  return out.ok ? null : out.error;
};

const withBet = () => run(fresh(), "Alex", { type: "createBet", title: "Winner", guess: "Andy", amount: 100 });

describe("creating bets and wagering", () => {
  it("creates a bet with the creator's first wager and charges chips", () => {
    const s = withBet();
    expect(s.bets).toHaveLength(1);
    expect(s.bets[0].options[0].label).toBe("Andy");
    expect(chipsOf("Alex", s.bets)).toBe(STARTING_CHIPS - 100);
  });

  it("rejects strangers, overspending, and junk", () => {
    const s = fresh();
    expect(reject(s, "Mallory", { type: "createBet", title: "x", guess: "y", amount: 1 })).toMatch(/join/i);
    expect(reject(s, "Alex", { type: "createBet", title: "x", guess: "y", amount: STARTING_CHIPS + 1 })).toMatch(/Pick 1 to/);
    expect(reject(s, "Alex", { type: "createBet", title: "x", guess: "y", amount: 1.5 })).toMatch(/Pick 1 to/);
    expect(reject(s, "Alex", { type: "createBet", title: "x", guess: "y", amount: NaN })).toMatch(/Pick 1 to/);
    expect(reject(s, "Alex", { type: "createBet", title: "  ", guess: "y", amount: 1 })).toMatch(/Name the bet/);
    expect(reject(s, "Alex", { type: "createBet", title: "x", guess: "", amount: 1 })).toMatch(/guess/);
    expect(reject(s, "Alex", { type: "nope" } as unknown as Action)).toMatch(/Unknown/);
    // Wrong types from a hostile client are coerced, not crashed on.
    expect(reject(s, "Alex", { type: "createBet", title: 5, guess: {}, amount: "9" } as unknown as Action)).toBeTruthy();
  });

  it("cannot spend the same chips twice", () => {
    let s = run(fresh(), "Sam", { type: "createBet", title: "a", guess: "x", amount: 900 });
    expect(reject(s, "Sam", { type: "createBet", title: "b", guess: "y", amount: 200 })).toMatch(/Pick 1 to 100/);
    s = run(s, "Sam", { type: "wager", betId: s.bets[0].id, optionId: s.bets[0].options[0].id, amount: 100 });
    expect(chipsOf("Sam", s.bets)).toBe(0);
  });

  it("adds options (no duplicates, no 'Not that') and wagers on real options only", () => {
    let s = withBet();
    const id = s.bets[0].id;
    expect(reject(s, "Sam", { type: "addOption", betId: id, guess: "andy", amount: 10 })).toMatch(/already an option/);
    expect(reject(s, "Sam", { type: "addOption", betId: id, guess: "Not that", amount: 10 })).toMatch(/already an option/);
    s = run(s, "Sam", { type: "addOption", betId: id, guess: "Betty", amount: 10 });
    expect(s.bets[0].options.map((o) => o.label)).toEqual(["Andy", "Betty"]);
    expect(reject(s, "Sam", { type: "wager", betId: id, optionId: "bogus", amount: 5 })).toMatch(/No such guess/);
    s = run(s, "Sam", { type: "wager", betId: id, optionId: NOT_THAT_ID, amount: 5 });
    expect(s.bets[0].notThat).toHaveLength(1);
  });

  it("moves the active bet to the newest updatedAt", () => {
    let s = withBet();
    const first = s.bets[0].updatedAt;
    s = run(s, "Sam", { type: "wager", betId: s.bets[0].id, optionId: s.bets[0].options[0].id, amount: 5 });
    expect(s.bets[0].updatedAt).toBeGreaterThan(first);
  });
});

describe("settling", () => {
  it("needs the configured number of different players", () => {
    let s = withBet();
    const bet = s.bets[0];
    s = run(s, "Alex", { type: "proposeWinner", betId: bet.id, optionId: bet.options[0].id });
    expect(s.bets[0].result).toBeUndefined();
    expect(reject(s, "Alex", { type: "confirm", betId: bet.id })).toMatch(/already confirmed/);
    s = run(s, "Sam", { type: "confirm", betId: bet.id });
    expect(s.bets[0].result?.winners).toEqual([bet.options[0].id]);
    expect(s.bets[0].proposal).toBeUndefined();
    // Alex staked 100, was alone on the winning side: gets the pot (100 + house 1).
    expect(chipsOf("Alex", s.bets)).toBe(STARTING_CHIPS + 1);
  });

  it("changing the proposal restarts confirmations; a new option cancels it", () => {
    let s = withBet();
    const id = s.bets[0].id;
    s = run(s, "Alex", { type: "addOption", betId: id, guess: "Betty", amount: 10 });
    const [a, b] = s.bets[0].options;
    s = run(s, "Alex", { type: "proposeWinner", betId: id, optionId: a.id });
    s = run(s, "Sam", { type: "proposeWinner", betId: id, optionId: b.id }); // tie proposal by Sam
    expect(s.bets[0].proposal).toMatchObject({ proposedBy: "Sam", confirmedBy: ["Sam"], winners: [a.id, b.id] });
    s = run(s, "Jordan", { type: "addOption", betId: id, guess: "Carl", amount: 10 });
    expect(s.bets[0].proposal).toBeUndefined();
  });

  it("refuses to settle twice or touch a settled bet", () => {
    let s = withBet();
    const bet = s.bets[0];
    s = run(s, "Alex", { type: "proposeWinner", betId: bet.id, optionId: bet.options[0].id });
    s = run(s, "Sam", { type: "confirm", betId: bet.id });
    expect(reject(s, "Sam", { type: "wager", betId: bet.id, optionId: bet.options[0].id, amount: 1 })).toMatch(/closed/);
    expect(reject(s, "Sam", { type: "proposeWinner", betId: bet.id, optionId: NOT_THAT_ID })).toMatch(/settled/);
  });
});

describe("host controls and closing", () => {
  it("only the host changes settings or closes, and settings are validated", () => {
    const s = fresh();
    const settings = { houseBidPercent: 5, houseBidMin: 2, confirmationsRequired: 3 };
    expect(reject(s, "Sam", { type: "updateSettings", settings })).toMatch(/host/);
    expect(reject(s, "Sam", { type: "closeTable" })).toMatch(/host/);
    expect(run(s, "Alex", { type: "updateSettings", settings }).settings).toEqual(settings);
    for (const bad of [
      { ...settings, houseBidPercent: 101 },
      { ...settings, houseBidPercent: -1 },
      { ...settings, houseBidMin: 1.5 },
      { ...settings, confirmationsRequired: 0 },
      { ...settings, confirmationsRequired: NaN },
    ]) {
      expect(reject(s, "Alex", { type: "updateSettings", settings: bad })).toBeTruthy();
    }
  });

  it("a closed table takes no new bets or wagers, but open bets can still be settled", () => {
    let s = withBet();
    const bet = s.bets[0];
    s = run(s, "Alex", { type: "closeTable" });
    expect(s.closed).toBe(true);
    expect(reject(s, "Sam", { type: "createBet", title: "x", guess: "y", amount: 1 })).toMatch(/closed/);
    expect(reject(s, "Sam", { type: "wager", betId: bet.id, optionId: bet.options[0].id, amount: 1 })).toMatch(/closed/);
    s = run(s, "Alex", { type: "proposeWinner", betId: bet.id, optionId: bet.options[0].id });
    s = run(s, "Sam", { type: "confirm", betId: bet.id });
    expect(s.bets[0].result).toBeDefined();
  });
});

describe("applyChange", () => {
  it("adds players once and keeps the first host", () => {
    let s: TableState = { ...fresh(), players: [], host: "" };
    s = applyChange(s, { joined: "Alex", host: "Alex" });
    s = applyChange(s, { joined: "Sam" });
    s = applyChange(s, { joined: "Sam" });
    expect(s.players).toEqual(["Alex", "Sam"]);
    expect(s.host).toBe("Alex");
  });
});

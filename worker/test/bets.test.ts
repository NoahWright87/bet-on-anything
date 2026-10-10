import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  HOUSE,
  NOT_THAT_ID,
  chipsOf,
  computeResult,
  houseBidFor,
  toggleWinner,
  type Bet,
} from "../../shared/bets";
import { STARTING_CHIPS } from "../../shared/limits";

const bet = (over: Partial<Bet> = {}): Bet => ({
  id: "b",
  title: "t",
  creator: "Alex",
  options: [
    { id: "andy", label: "Andy", wagers: [{ id: "1", player: "Alex", amount: 50 }, { id: "2", player: "Sam", amount: 25 }] },
    { id: "betty", label: "Betty", wagers: [{ id: "3", player: "Jordan", amount: 100 }] },
  ],
  notThat: [],
  updatedAt: 1,
  ...over,
});

describe("payouts", () => {
  it("pools the pot (house included) among the winners by stake", () => {
    // house adds 1 per bet (1% of 50 rounds to 1, min 1): 3 total, pot 178
    const r = computeResult(bet(), DEFAULT_SETTINGS, ["andy"]);
    expect(r.pot).toBe(178);
    expect(r.payouts).toEqual({ Alex: 119, Sam: 59 });
    expect(r.burned).toBe(0);
  });

  it("hands out every chip (largest remainder rounding)", () => {
    const r = computeResult(bet(), DEFAULT_SETTINGS, ["andy"]);
    expect(Object.values(r.payouts).reduce((a, b) => a + b, 0)).toBe(r.pot);
  });

  it("pools ties together", () => {
    const r = computeResult(bet(), DEFAULT_SETTINGS, ["andy", "betty"]);
    expect(r.payouts.Jordan! + r.payouts.Alex! + r.payouts.Sam!).toBe(r.pot);
  });

  it("burns the pot when only the house backed the winner", () => {
    const r = computeResult(bet(), DEFAULT_SETTINGS, [NOT_THAT_ID]);
    expect(r.burned).toBe(r.pot);
    expect(r.payouts).toEqual({});
    expect(HOUSE in r.payouts).toBe(false);
  });

  it("house bid is a percentage with a minimum, and can be turned off", () => {
    expect(houseBidFor(500, DEFAULT_SETTINGS)).toBe(5);
    expect(houseBidFor(10, DEFAULT_SETTINGS)).toBe(1);
    expect(houseBidFor(500, { ...DEFAULT_SETTINGS, houseBidPercent: 0, houseBidMin: 0 })).toBe(0);
  });
});

describe("chips", () => {
  it("are derived from stakes and payouts", () => {
    const b = bet();
    expect(chipsOf("Alex", [b])).toBe(STARTING_CHIPS - 50);
    const settled = { ...b, result: computeResult(b, DEFAULT_SETTINGS, ["andy"]) };
    expect(chipsOf("Alex", [settled])).toBe(STARTING_CHIPS - 50 + 119);
    expect(chipsOf("Nobody", [settled])).toBe(STARTING_CHIPS);
  });
});

describe("toggleWinner", () => {
  it("keeps Not that and listed options mutually exclusive", () => {
    expect(toggleWinner(["a"], NOT_THAT_ID)).toEqual([NOT_THAT_ID]);
    expect(toggleWinner([NOT_THAT_ID], "a")).toEqual(["a"]);
    expect(toggleWinner(["a"], "a")).toEqual([]);
    expect(toggleWinner(["a"], "b")).toEqual(["a", "b"]);
  });
});

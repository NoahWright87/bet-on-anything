// Limits enforced by the Worker (and mirrored in the UI so forms can show errors early).

export const STARTING_CHIPS = 1000;

export const MAX_NAME_LENGTH = 24; // player display name
export const MAX_TITLE_LENGTH = 60; // bet title
export const MAX_LABEL_LENGTH = 24; // a guess ("Andy")

// Abuse guards for a public endpoint. Generous for a group of friends, small enough that one
// table's state stays well inside a Durable Object's limits.
export const MAX_PLAYERS = 30;
export const MAX_BETS = 300;
export const MAX_OPTIONS = 12; // guesses per bet (not counting "Not that")
export const MAX_WAGERS_PER_BET = 500;

/** Upper bound for the house bid minimum a host can set. */
export const MAX_AMOUNT = 1000000;

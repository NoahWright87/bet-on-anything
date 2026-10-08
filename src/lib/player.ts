"use client";

export type Player = {
  name: string;
  chips: number;
};

// Placeholder until accounts and the table backend exist.
const PLACEHOLDER_PLAYER: Player = { name: "First Last", chips: 1000 };

/** The current user. Swap the body for real auth/table state later; callers won't change. */
export function usePlayer(): Player {
  return PLACEHOLDER_PLAYER;
}

"use client";

export type Player = {
  name: string;
};

// Placeholder until accounts exist.
const PLACEHOLDER_PLAYER: Player = { name: "First Last" };

/** The current user. Swap the body for real auth later; callers won't change. */
export function usePlayer(): Player {
  return PLACEHOLDER_PLAYER;
}

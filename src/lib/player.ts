"use client";

import { useSyncExternalStore } from "react";

/**
 * Who you are on this device: a display name you pick (no passwords yet), plus a secret token
 * per table that lets a refresh resume your seat. Both live in localStorage, which can be
 * unavailable (private windows, blocked storage): then you simply rejoin as new each time.
 */

export type Player = {
  name: string;
};

const NAME_KEY = "boa:name";
const tokenKey = (code: string) => `boa:token:${code}`;

const listeners = new Set<() => void>();
let memoryName: string | null = null; // fallback when storage throws

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: carry on in memory only.
  }
}

export function getStoredName(): string | null {
  return read(NAME_KEY) ?? memoryName;
}

export function setStoredName(name: string): void {
  memoryName = name;
  write(NAME_KEY, name);
  listeners.forEach((l) => l());
}

export const getToken = (code: string): string | null => read(tokenKey(code));
export const setToken = (code: string, token: string): void => write(tokenKey(code), token);

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The current user. Before a name is picked (and during server render) this is "Guest". */
export function usePlayer(): Player {
  const name = useSyncExternalStore(subscribe, getStoredName, () => null);
  return { name: name ?? "Guest" };
}

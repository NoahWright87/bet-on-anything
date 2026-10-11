// Messages exchanged over a table's WebSocket. Imported by both the Worker and the Next app,
// so keep it free of platform APIs.
//
// Flow: the client opens the socket and sends `join`. The server answers `welcome` with the
// whole table once, then only sends `update` deltas (one bet, or a setting, or a new player),
// to keep Durable Object request counts low. Every action's result comes back as an `update`
// to everybody including the sender; a rejected action comes back as `error` to the sender only.

import type { Action, Change, TableState } from "./table";

export type ClientMessage =
  | { type: "join"; name: string; token?: string } // `token` resumes an earlier seat at this table
  | { type: "action"; action: Action };

export type ServerMessage =
  | { type: "welcome"; you: string; token: string; state: TableState }
  | { type: "update"; change: Change }
  | { type: "join-error"; message: string } // the name was refused; the socket stays open for another try
  | { type: "error"; message: string };

/** Largest message the server will parse. Real messages are a few hundred bytes. */
export const MAX_MESSAGE_BYTES = 4096;

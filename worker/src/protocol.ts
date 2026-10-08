// Messages exchanged over a table's WebSocket. Keep this file dependency-free so
// the Next app can import it later (via a relative path or a shared package).

export type Participant = { id: string; name: string };

export type ClientMessage = { type: "join"; name: string };

export type ServerMessage =
  | { type: "welcome"; you: Participant; participants: Participant[] }
  | { type: "participants"; participants: Participant[] }
  | { type: "error"; message: string };

export const MAX_NAME_LENGTH = 24;

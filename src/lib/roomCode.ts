export const ROOM_CODE_LENGTH = 8;

/** What the room-code box accepts: letters only, uppercase, capped at the code length. */
export function sanitizeRoomCode(input: string): string {
  return input.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, ROOM_CODE_LENGTH);
}

/** Room code from a `/table/[id]` route param (URL-encoded, any case). */
export function tableCodeFromParam(param: string | undefined): string {
  if (!param) return "";
  try {
    return sanitizeRoomCode(decodeURIComponent(param));
  } catch {
    return sanitizeRoomCode(param);
  }
}

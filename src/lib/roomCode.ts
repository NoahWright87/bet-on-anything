export const ROOM_CODE_LENGTH = 8;

const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ";

/** What the room-code box accepts: letters only, uppercase, capped at the code length. */
export function sanitizeRoomCode(input: string): string {
  return input.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, ROOM_CODE_LENGTH);
}

/** Random code for a new table, e.g. "BKXQMTVZ". Consonants only so codes can't spell words. */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CONSONANTS.charAt(Math.floor(Math.random() * CONSONANTS.length));
  }
  return code;
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

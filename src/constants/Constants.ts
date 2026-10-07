export const MAX_AMOUNT = 1000000;

const CONSONANTS = "bcdfghjklmnpqrstvwxyz";

/** Random 8-letter room code, e.g. "bkxqmtvz". */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CONSONANTS.charAt(Math.floor(Math.random() * CONSONANTS.length));
  }
  return code;
}

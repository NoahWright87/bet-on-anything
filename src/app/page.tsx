"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Text } from "../ui";
import { ROOM_CODE_LENGTH, generateRoomCode, sanitizeRoomCode } from "../lib/roomCode";

export default function Home() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const canJoin = roomCode.length === ROOM_CODE_LENGTH;

  const joinTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (canJoin) router.push(`/table/${roomCode}`);
  };

  const hostTable = () => router.push(`/table/${generateRoomCode()}`);

  return (
    <>
      <section className="landing-hero" aria-label="Join or host a table">
        <form className="landing-hero__join" onSubmit={joinTable}>
          <div className="room-code">
            <Input
              label="Room code"
              name="roomCode"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(sanitizeRoomCode(e.target.value))}
            />
          </div>
          <Button type="submit" size="large" disabled={!canJoin}>
            JOIN
          </Button>
        </form>
        <div className="landing-hero__host">
          <Button size="large" color="secondary" onClick={hostTable} style={{ fontSize: "var(--text-xl)", padding: "1.25rem 1.5rem" }}>
            HOST
          </Button>
        </div>
      </section>

      <div className="page">
        <details className="about-details">
          <summary>What is this?</summary>
          <Text>
            Bet on Anything is a game for friends and family. One person hosts a table, everyone
            else joins with the room code, and you wager chips on whatever is going on around you.
          </Text>
        </details>
      </div>
    </>
  );
}

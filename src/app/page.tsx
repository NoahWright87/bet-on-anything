"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Container, Heading, Hero, Input, Text } from "../ui";
import { generateRoomCode } from "../constants/Constants";

export default function Home() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const joinTable = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim();
    if (code) router.push(`/table/${encodeURIComponent(code)}`);
  };

  return (
    <>
      <Hero
        title={<Heading level={1} gradient animateIn>Bet on Anything!</Heading>}
        description={<Text>Pick a table, throw in some chips, and settle it like friends.</Text>}
        actions={
          <Button variant="solid" onClick={() => router.push(`/table/${generateRoomCode()}`)}>
            Create a table
          </Button>
        }
        background="subtle"
      />
      <Container padding="lg" centered>
        <form className="page__row" onSubmit={joinTable}>
          <Input
            label="Room code"
            name="roomCode"
            placeholder="e.g. bkxqmtvz"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <Button type="submit" variant="outline" disabled={!roomCode.trim()}>
            Join table
          </Button>
        </form>
      </Container>
    </>
  );
}

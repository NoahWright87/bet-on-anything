"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const handleJoinRoom = () => {
    if (roomCode) {
      router.push(`/table/${roomCode}`);
    }
  };

  const generateRandomString = () => {
    const consonants = "bcdfghjklmnpqrstvwxyz";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += consonants.charAt(Math.floor(Math.random() * consonants.length));
    }
    return result;
  };

  const handleCreateTable = () => {
    const newRoomCode = generateRandomString();
    router.push(`/table/${newRoomCode}`);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1>Bet on Anything!</h1>
        <label>
          Enter room code:
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="border p-2 bg-white text-black"
          />
        </label>
        <button onClick={handleJoinRoom} className="bg-blue-500 text-white p-2">
          Join room
        </button>
        <button onClick={handleCreateTable} className="bg-green-500 text-white p-2">
          Create table
        </button>
      </main>
    </div>
  );
}

"use client";

import { useSearchParams } from 'next/navigation';

export default function Table() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  return (
    <div>
      <h1>Table {id}</h1>
      <p>PLACEHOLDER</p>
    </div>
  );
}
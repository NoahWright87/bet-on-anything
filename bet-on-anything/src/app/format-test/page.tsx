"use client";

import { useState } from "react";
import ChipWidget from "../../components/ChipWidget";

export default function FormatTest() {
  const [amount, setAmount] = useState(0);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseInt(event.target.value, 10));
  };

  const generateFillerContent = () => {
    const fillerContent = [];
    for (let i = 0; i < 100; i++) {
      fillerContent.push(<p key={i}>More filler content to ensure vertical scrolling.</p>);
    }
    fillerContent.push(<p key={100}>This is the last filler content.</p>);
    return fillerContent;
  };

  return (
    <div>
      <h1>Format Test</h1>
      <p>This is a format test page with filler content for vertical scrolling.</p>
      <h2>Heading 2</h2>
      <p>Some filler content under heading 2.</p>
      <h3>Heading 3</h3>
      <p>Some filler content under heading 3.</p>
      <h4>Heading 4</h4>
      <p>Some filler content under heading 4.</p>
      <h5>Heading 5</h5>
      <p>Some filler content under heading 5.</p>
      <h6>Heading 6</h6>
      <p>Some filler content under heading 6.</p>
      <div>
        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          name="amount"
          min="0"
          max="1000000"
          step="1"
          value={amount}
          onChange={handleAmountChange}
          className="border p-2 bg-white text-black"
        />
      </div>
      <ChipWidget amount={amount} />
      {generateFillerContent()}
    </div>
  );
}

import { formatChips } from "../lib/formatChips";
import ChipImage from "./ChipImage";

export default function ChipCount({ amount }: { amount: number }) {
  return (
    <div className="chip-count" title={`${amount.toLocaleString("en-US")} chips`}>
      <ChipImage />
      <span className="chip-count__value">{formatChips(amount)}</span>
      <span className="visually-hidden"> chips</span>
    </div>
  );
}

import { MAX_AMOUNT } from "../constants/Constants";
import { Pill } from "../ui";

interface ChipWidgetProps {
  amount: number;
}

export default function ChipWidget({ amount }: ChipWidgetProps) {
  const clamped = Math.min(Math.max(amount, 0), MAX_AMOUNT);
  return <Pill variant="primary" size="large">{clamped.toLocaleString()} chips</Pill>;
}

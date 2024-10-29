import React from 'react';
import { MAX_AMOUNT } from '../constants/Constants';

interface ChipWidgetProps {
  amount: number;
}

const ChipWidget: React.FC<ChipWidgetProps> = ({ amount }) => {
  const validateAmount = (value: number) => {
    const min = 0;
    const max = MAX_AMOUNT;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  };

  const validatedAmount = validateAmount(amount);

  return (
    <div className="w-32 h-32 flex items-center justify-center bg-blue-500 text-white text-4xl font-bold rounded-lg transition-all duration-300 hover:bg-blue-700">
      {validatedAmount}
    </div>
  );
};

export default ChipWidget;

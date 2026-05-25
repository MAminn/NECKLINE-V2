'use client';

import { useState } from 'react';

interface QuantityStepperProps {
  min?: number;
  max?: number;
  initial?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

export default function QuantityStepper({
  min = 1,
  max = 99,
  initial = 1,
  onChange,
  disabled = false,
}: QuantityStepperProps) {
  const [value, setValue] = useState(initial);

  function update(newValue: number) {
    const clamped = Math.max(min, Math.min(max, newValue));
    setValue(clamped);
    onChange?.(clamped);
  }

  return (
    <div className={`inline-flex items-center rounded-md border border-border bg-surface ${disabled ? 'opacity-50' : ''}`}>
      <button
        type="button"
        onClick={() => update(value - 1)}
        disabled={disabled || value <= min}
        className="px-3 py-2 text-text-primary transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => update(parseInt(e.target.value, 10) || min)}
        disabled={disabled}
        className="w-12 bg-transparent text-center text-sm font-medium text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => update(value + 1)}
        disabled={disabled || value >= max}
        className="px-3 py-2 text-text-primary transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

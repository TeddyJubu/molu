"use client";

export interface PaymentSelectorProps {
  selectedMethod: "bkash" | "nagad" | null;
  onSelect: (method: "bkash" | "nagad") => void;
  isProcessing?: boolean;
}

export function PaymentSelector({ selectedMethod, onSelect, isProcessing }: PaymentSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="font-semibold">Select Payment Method</p>

      <label className="flex cursor-pointer gap-3 rounded border p-4 hover:bg-gray-50">
        <input
          type="radio"
          name="payment"
          value="bkash"
          checked={selectedMethod === "bkash"}
          onChange={() => onSelect("bkash")}
          disabled={isProcessing}
        />
        <div>
          <p className="font-medium">bKash</p>
          <p className="text-sm text-gray-600">Fast & secure mobile payment</p>
        </div>
      </label>

      <label className="flex cursor-pointer gap-3 rounded border p-4 hover:bg-gray-50">
        <input
          type="radio"
          name="payment"
          value="nagad"
          checked={selectedMethod === "nagad"}
          onChange={() => onSelect("nagad")}
          disabled={isProcessing}
        />
        <div>
          <p className="font-medium">Nagad</p>
          <p className="text-sm text-gray-600">Mobile banking service from Nagad</p>
        </div>
      </label>
    </div>
  );
}


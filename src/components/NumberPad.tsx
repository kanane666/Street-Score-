import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  initial: number;
  onClose: () => void;
  onConfirm: (value: number) => void;
  title?: string;
  max?: number;
}

export function NumberPad({ open, initial, onClose, onConfirm, title = "Saisir un score", max = 999 }: Props) {
  const [value, setValue] = useState(String(initial));

  useEffect(() => {
    if (open) setValue(String(initial));
  }, [open, initial]);

  if (!open) return null;

  const press = (digit: string) => {
    if (digit === "C") return setValue("0");
    if (value === "0") setValue(digit);
    else {
      const next = value + digit;
      if (Number(next) <= max) setValue(next);
    }
  };

  const confirm = () => {
    const n = Math.max(0, Math.min(max, Number(value) || 0));
    onConfirm(n);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-xs rounded-2xl bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="mt-2 mb-4 text-center font-score text-5xl text-score-color">{value}</p>
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((k) => (
            <button
              key={k}
              onClick={() => (k === "OK" ? confirm() : press(k))}
              className={`rounded-lg py-4 text-xl font-bold ${
                k === "OK"
                  ? "bg-primary text-primary-foreground"
                  : k === "C"
                    ? "bg-destructive/20 text-destructive"
                    : "bg-secondary text-foreground"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

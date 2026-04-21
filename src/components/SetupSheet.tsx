import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMatch, type PeriodType } from "@/store/match";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SetupSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const startMatch = useMatch((s) => s.startMatch);
  const [team1, setTeam1] = useState("Équipe A");
  const [team2, setTeam2] = useState("Équipe B");
  const [duration, setDuration] = useState<number>(10);
  const [customMode, setCustomMode] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>("quarter");

  if (!open) return null;

  const presetActive = (val: number) => !customMode && duration === val;

  const submit = () => {
    startMatch({ team1Name: team1, team2Name: team2, durationMinutes: duration, periodType });
    onClose();
    navigate({ to: "/match" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-slide-up w-full max-w-lg rounded-t-2xl bg-card p-6 pb-8 shadow-2xl sm:rounded-2xl sm:mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
        <h2 className="mb-5 text-xl font-bold">Nouveau match</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Équipe 1</label>
            <input
              value={team1}
              maxLength={14}
              onChange={(e) => setTeam1(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Équipe 2</label>
            <input
              value={team2}
              maxLength={14}
              onChange={(e) => setTeam2(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Durée par période</label>
            <div className="grid grid-cols-4 gap-2">
              {[8, 10, 12].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setCustomMode(false);
                    setDuration(v);
                  }}
                  className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${
                    presetActive(v)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-foreground"
                  }`}
                >
                  {v} min
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomMode(true)}
                className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${
                  customMode
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-foreground"
                }`}
              >
                Custom
              </button>
            </div>
            {customMode && (
              <input
                type="number"
                min={1}
                max={60}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                className="mt-2 w-full rounded-lg border border-border bg-secondary px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPeriodType("quarter")}
                className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${
                  periodType === "quarter"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-foreground"
                }`}
              >
                Par quart-temps
              </button>
              <button
                type="button"
                onClick={() => setPeriodType("half")}
                className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${
                  periodType === "half"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-foreground"
                }`}
              >
                Par mi-temps
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={submit}
            className="mt-2 w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground active:scale-[0.98]"
            style={{ minHeight: 56 }}
          >
            Lancer le match
          </button>
        </div>
      </div>
    </div>
  );
}

import { useMatch, type Settings } from "@/store/match";

interface Props {
  open: boolean;
  onClose: () => void;
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition-colors ${value ? "bg-primary" : "bg-secondary"}`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsPanel({ open, onClose }: Props) {
  const settings = useMatch((s) => s.settings);
  const update = useMatch((s) => s.updateSettings);
  if (!open) return null;

  const set = (patch: Partial<Settings>) => update(patch);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-slide-up w-full max-w-lg rounded-t-2xl bg-card p-6 pb-8 sm:rounded-2xl sm:mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
        <h2 className="mb-2 text-xl font-bold">Réglages</h2>

        <div className="divide-y divide-border">
          <ToggleRow
            label="Reset shot clock à chaque panier"
            value={settings.autoResetShotClockOnScore}
            onChange={(v) => set({ autoResetShotClockOnScore: v })}
          />
          <ToggleRow
            label="Reset fautes à chaque période"
            value={settings.resetFoulsEachPeriod}
            onChange={(v) => set({ resetFoulsEachPeriod: v })}
          />
          <ToggleRow
            label="Sons activés"
            value={settings.soundEnabled}
            onChange={(v) => set({ soundEnabled: v })}
          />
          <ToggleRow
            label="Vibrations"
            value={settings.vibrationEnabled}
            onChange={(v) => set({ vibrationEnabled: v })}
          />
          <ToggleRow
            label="Sync shot clock / chrono"
            value={settings.shotClockSync}
            onChange={(v) => set({ shotClockSync: v })}
          />

          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm">Temps-morts max par équipe</span>
            <div className="flex gap-1">
              {[3, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => set({ maxTimeouts: n as 3 | 5 })}
                  className={`rounded-md px-3 py-1 text-sm font-semibold ${
                    settings.maxTimeouts === n ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-secondary py-3 text-sm font-semibold"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

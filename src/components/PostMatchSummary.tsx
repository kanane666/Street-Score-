import { useNavigate } from "@tanstack/react-router";
import type { MatchState, MatchRecord } from "@/store/match";
import { useMatch } from "@/store/match";

interface Props {
  match: MatchState;
  onClose: () => void;
}

export function PostMatchSummary({ match, onClose }: Props) {
  const navigate = useNavigate();
  const rematch = useMatch((s) => s.rematch);
  const clearCurrent = useMatch((s) => s.clearCurrent);

  const winner =
    match.team1.score === match.team2.score
      ? "Égalité"
      : match.team1.score > match.team2.score
        ? match.team1.name
        : match.team2.name;

  // Per-period points
  const perPeriod: { period: number; t1: number; t2: number }[] = [];
  for (let p = 1; p <= match.totalPeriods; p++) {
    const t1 = match.events
      .filter((e) => e.period === p && e.team === 1 && e.points > 0)
      .reduce((acc, e) => acc + e.points, 0);
    const t2 = match.events
      .filter((e) => e.period === p && e.team === 2 && e.points > 0)
      .reduce((acc, e) => acc + e.points, 0);
    perPeriod.push({ period: p, t1, t2 });
  }
  const maxP = Math.max(1, ...perPeriod.map((p) => Math.max(p.t1, p.t2)));

  const share = async () => {
    const date = new Date(match.date).toLocaleDateString("fr-FR");
    const text = `🏀 ${match.team1.name} ${match.team1.score} – ${match.team2.score} ${match.team2.name} | ${date} | via StreetScore`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      alert("Résultat copié dans le presse-papier !");
    } catch {
      // noop
    }
  };

  const periodLabel = (p: number) => (match.periodType === "quarter" ? `Q${p}` : `MT${p}`);

  // Make TS happy about unused MatchRecord export
  const _unused: MatchRecord | null = null;
  void _unused;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/90 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl">
        <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">Match terminé</p>
        <h2 className="mt-1 text-center text-2xl font-bold">{winner === "Égalité" ? "Égalité" : `${winner} l'emporte`}</h2>

        <div className="mt-5 grid grid-cols-3 items-center gap-2">
          <div className="text-center">
            <p className="truncate text-sm font-semibold">{match.team1.name}</p>
            <p className="font-score text-6xl text-score-color">{match.team1.score}</p>
          </div>
          <p className="text-center text-3xl text-muted-foreground">–</p>
          <div className="text-center">
            <p className="truncate text-sm font-semibold">{match.team2.name}</p>
            <p className="font-score text-6xl text-score-color">{match.team2.score}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-secondary p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Fautes</p>
            <p className="mt-1 font-semibold">
              {match.team1.fouls} – {match.team2.fouls}
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">T-O utilisés</p>
            <p className="mt-1 font-semibold">
              {Math.max(0, 5 - match.team1.timeouts)} – {Math.max(0, 5 - match.team2.timeouts)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Points par période</p>
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-block h-3 w-3 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: "var(--color-score)" }}
                aria-hidden="true"
              />
              <span className="truncate font-semibold">{match.team1.name}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-block h-3 w-3 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: "var(--color-shotclock)" }}
                aria-hidden="true"
              />
              <span className="truncate font-semibold">{match.team2.name}</span>
            </div>
          </div>
          <div className="space-y-2">
            {perPeriod.map((p) => (
              <div key={p.period} className="flex items-center gap-2">
                <span className="w-8 text-xs text-muted-foreground">{periodLabel(p.period)}</span>
                <div className="flex-1">
                  <div className="flex h-5 items-center gap-1">
                    <div
                      className="h-full rounded bg-score"
                      style={{ width: `${(p.t1 / maxP) * 50}%`, backgroundColor: "var(--color-score)" }}
                    />
                    <span className="w-6 text-xs">{p.t1}</span>
                  </div>
                  <div className="mt-1 flex h-5 items-center gap-1">
                    <div
                      className="h-full rounded"
                      style={{ width: `${(p.t2 / maxP) * 50}%`, backgroundColor: "var(--color-shotclock)" }}
                    />
                    <span className="w-6 text-xs">{p.t2}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              rematch();
              onClose();
            }}
            className="rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            Revanche
          </button>
          <button
            onClick={share}
            className="rounded-xl bg-secondary py-3 text-sm font-semibold"
          >
            Partager
          </button>
          <button
            onClick={() => {
              clearCurrent();
              onClose();
              navigate({ to: "/" });
            }}
            className="rounded-xl border border-border py-3 text-sm font-semibold"
          >
            Nouveau
          </button>
        </div>
      </div>
    </div>
  );
}

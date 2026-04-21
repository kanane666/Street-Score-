import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMatch } from "@/store/match";
import { BasketballIcon } from "@/components/BasketballIcon";
import { SetupSheet } from "@/components/SetupSheet";
import { HistoryDetail } from "@/components/HistoryDetail";
import { InstallBanner } from "@/components/InstallBanner";
import type { MatchRecord } from "@/store/match";
import streetscoreLogo from "@/assets/streetscore-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StreetScore — Accueil" },
      { name: "description", content: "Démarrer un nouveau match de basket et consulter l'historique." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const history = useMatch((s) => s.history);
  const current = useMatch((s) => s.current);
  const [setupOpen, setSetupOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [detail, setDetail] = useState<MatchRecord | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pt-4 pb-32">
        {/* Compact header */}
        <header className="flex items-center gap-2 pt-2 pb-4">
          <img
            src={streetscoreLogo}
            alt=""
            aria-hidden="true"
            className="h-9 w-auto object-contain"
          />
          <span className="text-lg font-bold tracking-tight">StreetScore</span>
        </header>

        {/* CTA */}
        <button
          onClick={() => setSetupOpen(true)}
          className="mt-6 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground active:scale-[0.98] transition-transform"
          style={{ height: 56 }}
        >
          + Nouveau match
        </button>

        {current && !current.finished && (
          <a
            href="/match"
            className="mt-3 block w-full rounded-xl border border-border bg-card py-3 text-center text-sm font-semibold"
          >
            Reprendre le match en cours · {current.team1.name} {current.team1.score} – {current.team2.score} {current.team2.name}
          </a>
        )}

        {/* History */}
        <div className="mt-8">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Historique des matchs</span>
            <span className="text-xs text-muted-foreground">{historyOpen ? "−" : "+"}</span>
          </button>

          {historyOpen && (
            <div className="mt-3 space-y-2">
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                  <p className="text-sm text-muted-foreground">Aucun match enregistré</p>
                </div>
              ) : (
                history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setDetail(h)}
                    className="block w-full rounded-xl border border-border bg-card p-3 text-left active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {h.team1} <span className="text-muted-foreground">vs</span> {h.team2}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(h.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="font-score text-lg text-score-color">
                          {h.score1}–{h.score2}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <SetupSheet open={setupOpen} onClose={() => setSetupOpen(false)} />
      <HistoryDetail open={!!detail} record={detail} onClose={() => setDetail(null)} />
      <InstallBanner />
    </div>
  );
}

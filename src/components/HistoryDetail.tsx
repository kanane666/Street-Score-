import { useState } from "react";
import { useMatch, type MatchRecord } from "@/store/match";

interface Props {
  open: boolean;
  onClose: () => void;
  record: MatchRecord | null;
}

export function HistoryDetail({ open, onClose, record }: Props) {
  const deleteHistory = useMatch((s) => s.deleteHistory);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!open || !record) return null;

  const winner =
    record.score1 === record.score2
      ? "Égalité"
      : record.score1 > record.score2
        ? record.team1
        : record.team2;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-slide-up w-full max-w-lg rounded-t-2xl bg-card p-6 pb-8 sm:rounded-2xl sm:mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {new Date(record.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex-1">
            <p className="truncate text-base font-semibold">{record.team1}</p>
            <p className="font-score text-5xl text-score-color">{record.score1}</p>
          </div>
          <p className="px-4 text-2xl text-muted-foreground">–</p>
          <div className="flex-1 text-right">
            <p className="truncate text-base font-semibold">{record.team2}</p>
            <p className="font-score text-5xl text-score-color">{record.score2}</p>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Vainqueur : <span className="font-semibold text-foreground">{winner}</span>
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {record.periods} périodes · {Math.round(record.duration / 60)} min/période
        </p>

        <div className="mt-6 flex gap-2">
          {confirmDelete ? (
            <>
              <button
                onClick={() => {
                  deleteHistory(record.id);
                  setConfirmDelete(false);
                  onClose();
                }}
                className="flex-1 rounded-lg bg-destructive py-3 text-sm font-semibold text-destructive-foreground"
              >
                Confirmer suppression
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-border px-4 py-3 text-sm"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 rounded-lg border border-border py-3 text-sm font-semibold text-destructive"
              >
                Supprimer
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-secondary py-3 text-sm font-semibold"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

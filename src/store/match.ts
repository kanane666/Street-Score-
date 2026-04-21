import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";

export type PeriodType = "quarter" | "half";

export interface TeamState {
  name: string;
  score: number;
  fouls: number;
  timeouts: number; // remaining
}

export interface GameEvent {
  id: string;
  team: 1 | 2;
  points: number; // can be negative for correction
  period: number;
  timerAt: number; // remaining seconds when scored
  at: number; // timestamp ms
}

export interface Settings {
  autoResetShotClockOnScore: boolean;
  resetFoulsEachPeriod: boolean;
  maxTimeouts: 3 | 5;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  shotClockSync: boolean;
}

export interface MatchState {
  id: string;
  team1: TeamState;
  team2: TeamState;
  timer: { totalSeconds: number; remaining: number; isRunning: boolean };
  shotClock: { value: number; isRunning: boolean };
  period: number;
  totalPeriods: number;
  periodType: PeriodType;
  date: string;
  startedAt: string;
  events: GameEvent[];
  finished: boolean;
}

export interface MatchRecord {
  id: string;
  team1: string;
  score1: number;
  team2: string;
  score2: number;
  duration: number; // seconds per period
  periods: number;
  date: string;
  events: GameEvent[];
}

interface UndoSnapshot {
  team1: TeamState;
  team2: TeamState;
  events: GameEvent[];
  shotClock: { value: number; isRunning: boolean };
}

interface Store {
  current: MatchState | null;
  history: MatchRecord[];
  settings: Settings;
  lastUndo: UndoSnapshot | null;

  // setup
  startMatch: (opts: {
    team1Name: string;
    team2Name: string;
    durationMinutes: number;
    periodType: PeriodType;
  }) => void;
  endMatch: () => MatchRecord | null;
  rematch: () => void;
  deleteHistory: (id: string) => void;
  clearCurrent: () => void;

  // scoring
  addScore: (team: 1 | 2, points: number) => void;
  setScore: (team: 1 | 2, value: number) => void;
  undo: () => void;
  clearUndo: () => void;

  // fouls / timeouts
  addFoul: (team: 1 | 2, delta: number) => void;
  addTimeout: (team: 1 | 2, delta: number) => void;

  // timer
  tick: (delta: number) => void; // delta seconds
  setTimerRunning: (running: boolean) => void;
  resetTimer: () => void;
  setTimerRemaining: (s: number) => void;

  // shot clock
  setShotClockRunning: (running: boolean) => void;
  resetShotClock: (value?: number) => void;
  setShotClockValue: (v: number) => void;

  // misc
  swapTeams: () => void;
  setTeamName: (team: 1 | 2, name: string) => void;
  nextPeriod: () => void;

  // settings
  updateSettings: (s: Partial<Settings>) => void;
}

const DEFAULT_SETTINGS: Settings = {
  autoResetShotClockOnScore: false,
  resetFoulsEachPeriod: false,
  maxTimeouts: 5,
  soundEnabled: true,
  vibrationEnabled: true,
  shotClockSync: true,
};

function makeTeam(name: string, timeouts: number): TeamState {
  return { name, score: 0, fouls: 0, timeouts };
}

function snapshot(s: MatchState): UndoSnapshot {
  return {
    team1: { ...s.team1 },
    team2: { ...s.team2 },
    events: [...s.events],
    shotClock: { ...s.shotClock },
  };
}

export const useMatch = create<Store>()(
  persist(
    (set, get) => ({
      current: null,
      history: [],
      settings: DEFAULT_SETTINGS,
      lastUndo: null,

      startMatch: ({ team1Name, team2Name, durationMinutes, periodType }) => {
        const totalSeconds = Math.max(60, Math.floor(durationMinutes * 60));
        const totalPeriods = periodType === "quarter" ? 4 : 2;
        const settings = get().settings;
        const now = new Date();
        set({
          current: {
            id: nanoid(),
            team1: makeTeam(team1Name || "Équipe A", settings.maxTimeouts),
            team2: makeTeam(team2Name || "Équipe B", settings.maxTimeouts),
            timer: { totalSeconds, remaining: totalSeconds, isRunning: false },
            shotClock: { value: 24, isRunning: false },
            period: 1,
            totalPeriods,
            periodType,
            date: now.toISOString(),
            startedAt: now.toISOString(),
            events: [],
            finished: false,
          },
          lastUndo: null,
        });
      },

      endMatch: () => {
        const s = get().current;
        if (!s) return null;
        const record: MatchRecord = {
          id: s.id,
          team1: s.team1.name,
          score1: s.team1.score,
          team2: s.team2.name,
          score2: s.team2.score,
          duration: s.timer.totalSeconds,
          periods: s.totalPeriods,
          date: s.date,
          events: s.events,
        };
        const history = [record, ...get().history.filter((h) => h.id !== record.id)].slice(0, 30);
        set({
          history,
          current: { ...s, finished: true, timer: { ...s.timer, isRunning: false } },
        });
        return record;
      },

      rematch: () => {
        const s = get().current;
        if (!s) return;
        const settings = get().settings;
        const now = new Date();
        set({
          current: {
            ...s,
            id: nanoid(),
            team1: makeTeam(s.team1.name, settings.maxTimeouts),
            team2: makeTeam(s.team2.name, settings.maxTimeouts),
            timer: { totalSeconds: s.timer.totalSeconds, remaining: s.timer.totalSeconds, isRunning: false },
            shotClock: { value: 24, isRunning: false },
            period: 1,
            date: now.toISOString(),
            startedAt: now.toISOString(),
            events: [],
            finished: false,
          },
          lastUndo: null,
        });
      },

      deleteHistory: (id) => set({ history: get().history.filter((h) => h.id !== id) }),
      clearCurrent: () => set({ current: null, lastUndo: null }),

      addScore: (team, points) => {
        const s = get().current;
        if (!s || s.finished) return;
        const undo = snapshot(s);
        const teamKey = team === 1 ? "team1" : "team2";
        const newTeam: TeamState = {
          ...s[teamKey],
          score: Math.max(0, s[teamKey].score + points),
        };
        const evt: GameEvent = {
          id: nanoid(),
          team,
          points,
          period: s.period,
          timerAt: s.timer.remaining,
          at: Date.now(),
        };
        const settings = get().settings;
        const shotClock = settings.autoResetShotClockOnScore && points > 0
          ? { ...s.shotClock, value: 24 }
          : s.shotClock;
        set({
          current: { ...s, [teamKey]: newTeam, events: [...s.events, evt], shotClock },
          lastUndo: undo,
        });
      },

      setScore: (team, value) => {
        const s = get().current;
        if (!s || s.finished) return;
        const undo = snapshot(s);
        const teamKey = team === 1 ? "team1" : "team2";
        set({
          current: { ...s, [teamKey]: { ...s[teamKey], score: Math.max(0, value) } },
          lastUndo: undo,
        });
      },

      undo: () => {
        const s = get().current;
        const u = get().lastUndo;
        if (!s || !u) return;
        set({
          current: { ...s, team1: u.team1, team2: u.team2, events: u.events, shotClock: u.shotClock },
          lastUndo: null,
        });
      },

      clearUndo: () => set({ lastUndo: null }),

      addFoul: (team, delta) => {
        const s = get().current;
        if (!s) return;
        const teamKey = team === 1 ? "team1" : "team2";
        set({
          current: {
            ...s,
            [teamKey]: { ...s[teamKey], fouls: Math.max(0, s[teamKey].fouls + delta) },
          },
        });
      },

      addTimeout: (team, delta) => {
        const s = get().current;
        if (!s) return;
        const teamKey = team === 1 ? "team1" : "team2";
        const next = Math.max(0, Math.min(get().settings.maxTimeouts, s[teamKey].timeouts + delta));
        set({ current: { ...s, [teamKey]: { ...s[teamKey], timeouts: next } } });
      },

      tick: (delta) => {
        const s = get().current;
        if (!s || s.finished) return;
        const settings = get().settings;
        let { remaining, isRunning } = s.timer;
        let sc = { ...s.shotClock };
        if (isRunning) {
          remaining = Math.max(0, remaining - delta);
          if (remaining === 0) isRunning = false;
          if (settings.shotClockSync) {
            sc.isRunning = s.timer.isRunning && remaining > 0;
            if (sc.isRunning) sc.value = Math.max(0, sc.value - delta);
          }
        }
        if (sc.isRunning && !settings.shotClockSync) {
          sc.value = Math.max(0, sc.value - delta);
        }
        set({ current: { ...s, timer: { ...s.timer, remaining, isRunning }, shotClock: sc } });
      },

      setTimerRunning: (running) => {
        const s = get().current;
        if (!s) return;
        const settings = get().settings;
        const sc = settings.shotClockSync
          ? { ...s.shotClock, isRunning: running && s.timer.remaining > 0 }
          : s.shotClock;
        set({
          current: {
            ...s,
            timer: { ...s.timer, isRunning: running && s.timer.remaining > 0 },
            shotClock: sc,
          },
        });
      },

      resetTimer: () => {
        const s = get().current;
        if (!s) return;
        set({
          current: {
            ...s,
            timer: { ...s.timer, remaining: s.timer.totalSeconds, isRunning: false },
          },
        });
      },

      setTimerRemaining: (sec) => {
        const s = get().current;
        if (!s) return;
        set({
          current: {
            ...s,
            timer: { ...s.timer, remaining: Math.max(0, Math.min(s.timer.totalSeconds, sec)) },
          },
        });
      },

      setShotClockRunning: (running) => {
        const s = get().current;
        if (!s) return;
        set({ current: { ...s, shotClock: { ...s.shotClock, isRunning: running && s.shotClock.value > 0 } } });
      },

      resetShotClock: (value = 24) => {
        const s = get().current;
        if (!s) return;
        set({ current: { ...s, shotClock: { ...s.shotClock, value } } });
      },

      setShotClockValue: (v) => {
        const s = get().current;
        if (!s) return;
        set({ current: { ...s, shotClock: { ...s.shotClock, value: Math.max(0, Math.min(24, v)) } } });
      },

      swapTeams: () => {
        const s = get().current;
        if (!s) return;
        set({ current: { ...s, team1: s.team2, team2: s.team1 } });
      },

      setTeamName: (team, name) => {
        const s = get().current;
        if (!s) return;
        const trimmed = name.slice(0, 14);
        const teamKey = team === 1 ? "team1" : "team2";
        set({ current: { ...s, [teamKey]: { ...s[teamKey], name: trimmed } } });
      },

      nextPeriod: () => {
        const s = get().current;
        if (!s) return;
        const settings = get().settings;
        const nextP = Math.min(s.totalPeriods, s.period + 1);
        const team1 = settings.resetFoulsEachPeriod ? { ...s.team1, fouls: 0 } : s.team1;
        const team2 = settings.resetFoulsEachPeriod ? { ...s.team2, fouls: 0 } : s.team2;
        set({
          current: {
            ...s,
            period: nextP,
            team1,
            team2,
            timer: { ...s.timer, remaining: s.timer.totalSeconds, isRunning: false },
            shotClock: { value: 24, isRunning: false },
          },
        });
      },

      updateSettings: (partial) => {
        const next = { ...get().settings, ...partial };
        set({ settings: next });
      },
    }),
    {
      name: "bball_store_v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      partialize: (s) => ({ current: s.current, history: s.history, settings: s.settings }),
    }
  )
);

export function periodLabel(s: MatchState): string {
  if (s.periodType === "quarter") return `Q${s.period}`;
  return `Mi-temps ${s.period}`;
}

export function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

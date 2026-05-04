

## Plan : Corriger les freezes et la surchauffe sur l'écran de match

### Diagnostic (cause racine)

En lisant `src/store/match.ts` et `src/routes/match.tsx`, j'ai trouvé **trois bugs de performance** qui se cumulent et expliquent exactement les symptômes (boutons qui rament, surchauffe, plantage) — sans toucher à la logique :

**1. `tick()` écrit dans le store à chaque seconde même quand rien ne tourne (le pire bug)**
Dans `store/match.ts` ligne 286-304, `tick(1)` est appelé toutes les secondes par `setInterval`. Même quand le chrono ET le shot clock sont à l'arrêt, la fonction crée systématiquement un nouvel objet `current` via `set({ current: {...s, timer: {...}, shotClock: sc} })`. Conséquences :
- Re-render complet de `MatchPage` chaque seconde même hors match actif
- Le middleware `persist` de Zustand **sérialise tout le state et écrit dans `localStorage` chaque seconde** (lourd, sync, bloque le main thread → boutons qui ne répondent pas, batterie/CPU)
- Au fil du temps localStorage devient le goulot, l'app chauffe et finit par lagger jusqu'au crash

**2. Le `useEffect` de buzzer dépend de `match` entier**
Lignes 81-95 de `match.tsx` : `useEffect(..., [match, ...])`. Comme `match` change de référence à chaque tick (à cause du bug 1), cet effet s'exécute chaque seconde, refait toute la logique de comparaison, déclenche `setFlash` potentiellement, etc. C'est un effet qui devrait tourner uniquement quand `remaining` ou `isRunning` change.

**3. Persistance non throttle même légitime**
Même après le fix 1, écrire dans localStorage à chaque tick actif reste coûteux. On exclut `timer.remaining` et `shotClock.value` du `partialize` — au reload on reprend le match avec le chrono en pause à sa dernière valeur sauvegardée (sauvegarde déclenchée par chaque action utilisateur : score, pause, etc.).

### Modifications

**1. `src/store/match.ts` — `tick()` : early-return si rien ne tourne**
```ts
tick: (delta) => {
  const s = get().current;
  if (!s || s.finished) return;
  const settings = get().settings;
  const timerActive = s.timer.isRunning && s.timer.remaining > 0;
  const scActive = s.shotClock.isRunning && s.shotClock.value > 0;
  if (!timerActive && !scActive) return; // ← clé : pas de set, pas de re-render, pas de persist
  // ...reste du calcul existant inchangé
}
```
Comportement identique côté UX : si rien ne tourne, rien ne change → on n'a pas besoin de re-render.

**2. `src/store/match.ts` — `partialize` allégé**
```ts
partialize: (s) => ({
  current: s.current
    ? {
        ...s.current,
        timer: { ...s.current.timer, isRunning: false }, // toujours en pause au reload
        shotClock: { ...s.current.shotClock, isRunning: false },
      }
    : null,
  history: s.history,
  settings: s.settings,
}),
```
Ça garde la persistance complète (score, fautes, time-outs, période, events, valeur exacte du chrono et du shot clock au dernier `set`), mais la sauvegarde n'arrive plus que sur les actions utilisateur, plus à chaque tick. Bonus : reload en pause = comportement plus sûr (l'utilisateur reprend manuellement).

**3. `src/routes/match.tsx` — découpler le useEffect buzzer**
Sélectionner précisément `remaining` et `isRunning` au lieu de `match` entier dans la dépendance :
```ts
const remaining = match?.timer.remaining;
const isRunning = match?.timer.isRunning;
useEffect(() => {
  const wasRunning = prevRunningRef.current;
  if (wasRunning && remaining === 0) {
    playBuzzer(settings.soundEnabled);
    vibrate(settings.vibrationEnabled, [800, 200, 800]);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 900);
    if (match && match.period < match.totalPeriods) {
      setInterSeconds(60);
      setInterPeriod(true);
    }
  }
  prevRunningRef.current = !!isRunning;
}, [remaining, isRunning, settings.soundEnabled, settings.vibrationEnabled, match?.period, match?.totalPeriods]);
```

**4. `src/routes/match.tsx` — `onScore` : enlever `settings` global de la dep**
Petit gain : remplacer `settings` par `settings.vibrationEnabled, settings.soundEnabled` dans les deps de `useCallback` pour éviter de recréer le handler quand un autre paramètre des settings change.

### Hors scope
Aucun changement à : règles de score, chrono, shot clock, fautes, time-outs, undo, périodes, historique, design/UI, animations, routes, store API publique. Pas de nouvelle dépendance. Pas de modification de la PWA / service worker (non incriminés ici).

### Résultat attendu
- Plus de re-render ni d'écriture localStorage quand le match est en pause → boutons réactifs immédiatement
- En match actif : 1 re-render/sec (légitime pour le chrono) au lieu de cascades d'effets parasites
- Plus de surchauffe — la charge CPU passe de ~100% sporadique à quasi nulle hors tick actif
- Stabilité longue durée

### Fichiers touchés
- `src/store/match.ts` (modif `tick` + `partialize`)
- `src/routes/match.tsx` (deps des `useEffect` / `useCallback`)


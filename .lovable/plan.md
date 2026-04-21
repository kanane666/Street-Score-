

## Plan : Build statique SPA pour Vercel/Netlify

### Le contexte technique honnête

Ton projet utilise **TanStack Start** (framework SSR) avec un preset Cloudflare Workers — c'est pour ça que `npm run build` produit `dist/client/` + `dist/server/` au lieu d'un simple `dist/index.html`. Pour un déploiement statique pur sur Vercel/Netlify, il faut basculer en mode SPA classique (sans SSR).

L'app n'utilise **aucune fonction serveur** — juste des routes client, Zustand + localStorage, et le PWA. Elle est donc 100 % compatible avec un mode SPA. Aucune fonctionnalité ne sera perdue.

### Approche : ajouter un script de build statique parallèle

Au lieu de remplacer le build TanStack Start (qui sert encore au preview Lovable), j'ajoute un **second script** `build:static` qui produit le bundle SPA propre. Comme ça tu gardes le preview Lovable intact ET tu as un build déployable.

### Modifications

**1. Nouveau fichier `vite.config.static.ts`** — config Vite minimale en mode SPA
- Plugins : `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`, `vite-plugin-pwa` (manifest identique), et le router plugin TanStack en mode `autoCodeSplitting` sans Start
- `build.outDir: "dist"` (pas `dist/client`)
- `build.rollupOptions.input: "index.html"` à la racine
- Pas de `@cloudflare/vite-plugin`, pas de `@tanstack/react-start`

**2. Nouveau `index.html` à la racine** — point d'entrée SPA classique
- Balises meta de base (title, description, theme-color, manifest, icônes)
- `<div id="root"></div>` + `<script type="module" src="/src/main.tsx">`

**3. Nouveau `src/main.tsx`** — bootstrap React/Router côté client uniquement
- Crée le QueryClient (si besoin) et le router via `getRouter()`
- Monte `<RouterProvider router={router} />` dans `#root`
- Importe `./styles.css`
- Importe `virtual:pwa-register` pour activer le SW

**4. Adapter `src/routes/__root.tsx`** — version SPA-safe
- Le `shellComponent` actuel rend `<html><body>` (SSR). En SPA, le shell HTML vient de `index.html`, donc `__root.tsx` doit juste exposer `component: RootComponent` (avec `<Outlet />`, Toaster, PWARegister).
- Je garde le `head()` actuel mais via `HeadContent` rendu dans le component, pas dans un shell HTML.
- **Important** : pour ne pas casser le build TanStack Start existant (utilisé par le preview Lovable), je conditionne : `shellComponent` reste pour Start, et le SPA ignore juste le shell (TanStack Router sans Start n'utilise pas `shellComponent`).

**5. Nouveaux scripts dans `package.json`**
```json
"build:static": "vite build --config vite.config.static.ts",
"preview:static": "vite preview --config vite.config.static.ts"
```
Le `npm run build` existant reste inchangé (preview Lovable intact).

**6. Fichiers de routing SPA fallback**
- `public/_redirects` (Netlify) : `/* /index.html 200`
- `vercel.json` à la racine : rewrites de `/(.*)` vers `/index.html`

**7. PWA**
- Le plugin `vite-plugin-pwa` reste configuré dans `vite.config.static.ts` avec le même manifest et workbox que la config actuelle. `manifest.webmanifest`, `sw.js`, et les icônes seront générés dans `dist/`.

### Résultat après `npm run build:static`

```
dist/
  index.html              ← point d'entrée
  assets/                 ← JS + CSS bundle
  icon-192.png
  icon-512.png
  manifest.webmanifest
  sw.js
  workbox-*.js
  _redirects              ← Netlify SPA fallback
```

Tu peux déposer ce dossier sur Netlify drop, ou lier le repo à Vercel avec `Build Command: npm run build:static` et `Output Directory: dist`. Le `vercel.json` gère le SPA fallback.

### Hors scope (intact)

Aucun changement à : score, chrono, shot clock, fautes, time-outs, historique, persistance localStorage, Zustand store, routes, composants UI, styles. Pure config build.

### Fichiers touchés
- **Nouveaux** : `index.html` (racine), `src/main.tsx`, `vite.config.static.ts`, `vercel.json`, `public/_redirects`
- **Modifiés** : `package.json` (ajout 2 scripts), `src/routes/__root.tsx` (rendre `HeadContent` dans le composant pour que ça marche en SPA aussi)


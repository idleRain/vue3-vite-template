# Vue 3 + Vite 8 Starter

English Docs | [中文文档 →](./README.zh-CN.md)

There are already enough Vue starters that ship a 300KB icon font you'll never use, keep the Options API nobody asked
for, and carry a PostCSS config file nobody can explain.

This template doesn't add to that pile — it picks the latest
version of every tool that matters, wires them up with actual engineering discipline, and gets out of your way.

---

## What you get out of the box

- Dark mode that reads your preference _before_ Vue mounts — no white flash
- GSAP-driven error page animations
- Auto-imports for Vue, Router, Pinia, i18n APIs — zero manual import lines
- Lint-on-save: a custom Vite plugin runs ESLint via the file watcher, not the browser
- i18n type generation: add a JSON5 file to `locales/`, TypeScript keys update on save
- `useRequest` composable: wraps any async function with `data / loading / error` state
- ky-based HTTP layer with a pluggable hook pipeline (auth, business code, cache busting, error toast); retry, timeout,
  headers sit on the ky instance itself
- MSW-based mock layer: handler-level toggle, zero code change to switch between mock and real API; `config.ts` is the single
  source of truth — set `false` to bypass, HMR takes effect immediately
- Production build drops `console` / `debugger`, stripped by `oxc` minifier
- Data-heavy UI wired up: @tanstack/vue-table for tables, vee-validate + zod for forms

One caveat: it's a foundation, not a finished app.

---

## Why this, not other Vue template

| You care about       | Typical template                              | This one                                                                                                                                                                 |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Build speed          | Vite 5 / Rollup                               | **Vite 8 / Rolldown** — Rust bundler, dev cold start in seconds (typical desktop)                                                                                        |
| HTTP client          | axios (XHR, ~12KB gzipped)                    | **ky** (fetch, ~4KB gzipped) — half the size, hook-based middleware                                                                                                      |
| Lint workflow        | `pnpm lint` as a separate step, often skipped | **Auto-fix on every save** — custom Vite plugin, file watcher triggers ESLint directly, no browser request in the loop                                                   |
| i18n maintenance     | Write type declarations by hand               | **Auto-generated schema** — `import.meta.glob` scans `locales/`, builds the interface, dev watcher keeps it fresh. Add a file, types update                              |
| UI flexibility       | One library, one look                         | **shadcn-vue + Element Plus** — shadcn components are copied into your source (you own them), Element Plus handles data-heavy enterprise UIs                             |
| Production output    | Default Terser, slow                          | **oxc minifier** — Rust-based, same AST as Rolldown, 30-90x faster per oxc's own benchmarks. Console/debugger stripped only in prod mode                                 |
| Chunk strategy       | Framework + vendor dump                       | **Fine-grained code splitting** — Vue, Router, Pinia, i18n, Element Plus, reka-ui, dayjs each get their own chunk. Business shared code auto-detected by `minShareCount` |
| Testing & guardrails | None, or ad-hoc                               | **Vitest + jsdom**, plus commitlint / husky / lint-staged — tests run, commits stay conventional                                                                         |

---

## Quick start

```bash
git clone https://github.com/idleRain/vue3-vite-template.git
pnpm install
pnpm dev          # → http://localhost:6789
```

Requirements: Node.js ≥ 22, pnpm ≥ 8.

---

## Design decisions

### HTTP layer: `services/` owns the logic, `api/` just declares endpoints

```
services/
├── instance.ts    # ky.create() with timeout, retry, headers
├── types.ts       # ResponseData<T>, request context
├── errors.ts      # BusinessError (when API says "success": false)
└── hooks/
    ├── auth.ts          # Bearer token injection, 401 redirect
    ├── businessCode.ts  # Check response.code, unwrap payload or throw
    ├── cacheBuster.ts   # GET cache busting
    └── errorMessage.ts  # Human-readable error toast via vue-sonner

api/
└── example.ts     # getHello() → request.get('/hello').json()
```

Components never see HTTP. They call `API.example.getHello()`. `useRequest` handles the loading/error state so you're
never writing `const loading = ref(true)` by hand.

### Mock: data / routing / config, three layers separated

```
mocks/
├── config.ts       # Per-endpoint toggle map, typed via as const satisfies
├── helpers.ts      # guard(key, factory) — reads config, returns mock or bypass()
├── data/           # Response bodies (what to return)
├── handlers/       # Route definitions (which URL maps to which data)
├── browser.ts      # setupWorker (dev mode)
└── server.ts       # setupServer (test mode)
```

Each handler wraps a mock factory with `guard()` — when `config.ts` says `true`, MSW intercepts and returns the mock; when
`false`, `bypass()` lets the request through to the real network. The ky hook pipeline (auth, business code, error toast)
runs normally regardless — MSW sits at the `fetch` level, transparent to the services layer.

Tests use the same handlers. `setup.ts` forces all config entries to `true` so a config change in dev can't silently break
tests.

### i18n: file structure is the schema

```
locales/zh/example.json5       →  schema.example
locales/zh/layout.json5       →  schema.layout
locales/zh/a/b/deep.json5     →  schema.a.b.deep
```

`import.meta.glob` auto-discovers every JSON5 file. The same regex that builds the runtime message tree also generates
`typings/i18n-schema.d.ts`. Add a new file — no registration step, no manual type update. `pnpm i18n:type` runs the
scanner manually; the dev watcher handles it on every save.

### Custom lint plugin, not a middleware

Most ESLint plugins for Vite run in the `transform` hook — meaning a file only gets linted when the browser requests it.
That's slow and easy to miss. The built-in `eslint-watch` plugin hooks into Vite's chokidar watcher: the moment you save
a file, ESLint fixes it and writes it back to disk. The browser never enters the loop.

### Chunks that make sense

Below is what `vite.config.ts`'s `codeSplitting.groups` aims to produce. Actual output depends on your imports —
anything without a dedicated group falls back to `vendor`.

```
dist/static/js/
├── vue-[hash].js           # Vue core
├── vue-router-[hash].js    # Router
├── pinia-[hash].js         # Pinia
├── vue-i18n-[hash].js      # i18n runtime
├── element-plus-[hash].js  # Element Plus
├── reka-ui-[hash].js       # shadcn-vue's headless layer
├── lucide-[hash].js        # Icons
├── form-[hash].js          # vee-validate + zod
├── vueuse-[hash].js        # VueUse utilities
├── dayjs-[hash].js         # Date library
├── ky-[hash].js            # HTTP client
├── sonner-[hash].js        # vue-sonner toast
├── date-[hash].js          # @internationalized/date
├── vendor-[hash].js        # Everything else from node_modules
└── common-[hash].js        # Business code shared by ≥2 chunks, >10KB
```

Each library gets its own cache entry. Upgrading Element Plus doesn't invalidate the Vue cache. The `common` chunk is
auto-detected — any module referenced by at least 2 async chunks and larger than 10KB gets extracted. No manual tuning.

### Styling: no config files

Tailwind CSS 4 runs through `@tailwindcss/vite`. No `tailwind.config.js`, no `postcss.config.js`. Theme tokens live in
`src/styles/index.css` as `@theme inline` blocks — everything in one place, CSS custom properties in `oklch` color
space. The dark variant is a single `@custom-variant dark` declaration.

---

## Architecture

```
src/
├── api/            # Endpoint declarations
├── services/       # HTTP client, hooks, types
├── mocks/          # MSW handlers, config, data — three-layer mock
├── store/          # Pinia modules
├── composables/    # useRequest, useClickPosition, ...
├── components/     # Auto-imported, including ui/ (shadcn-vue)
├── layouts/        # Sidebar + header shells
├── views/          # Pages and error screens
├── router/         # Route config
├── i18n/           # Engine + type generation
├── locales/        # {lang}/{namespace}.json5
├── styles/         # Tailwind entry + theme tokens
├── types/          # Shared interfaces
├── utils/          # cn(), debounce(), deepClone(), storage, precision math
└── test/           # Setup, mocks
```

---

## Scripts

```bash
pnpm dev              # Dev server, HMR, lint-on-save, i18n watcher
pnpm build            # Production build (oxc + stripped console/debugger)
pnpm build:test       # Test build (keeps console)
pnpm build:preview    # Preview build
pnpm preview          # Preview production build
pnpm ts               # vue-tsc --noEmit
pnpm lint             # ESLint --fix
pnpm format           # Prettier
pnpm test             # Vitest (all)
pnpm test:watch       # Vitest (watch)
pnpm test:coverage    # Vitest + coverage
pnpm i18n:type        # Regenerate i18n TypeScript schema
```

Recommended verification: `pnpm lint` → `pnpm ts` → `pnpm test`

---

## License

[MIT](./LICENSE)

# Glucose-ML Web Application

Vite, React, and TypeScript application for the Glucose-ML public frontend.

```bash
npm ci
node --test tests/*.test.ts
npm run lint
npm run build
npm run dev
```

Runtime aggregate data and required visual assets are under `public/`. Participant-level and subject-level dataset content is intentionally excluded from this repository.

## Analytics environment variables

The app sends anonymous, aggregate Google Analytics 4 (GA4) events (see `src/analytics/`). No participant, health, or free-form data is ever included — see the design spec at `docs/superpowers/specs/2026-07-20-google-analytics-4-integration-design.md` for the full privacy rules.

- `VITE_GA_MEASUREMENT_ID` — optional. Overrides the GA4 Measurement ID used to configure `gtag.js`. Defaults to `G-7VEBP7G8TE` when unset or blank.
- `VITE_GA_DEBUG` — optional, set to `true` to enable analytics in local development and mark outgoing events with `debug_mode: true` so they show up in GA4 DebugView.

Deployed production and preview builds (`import.meta.env.PROD`) enable analytics automatically — no environment variable is required. Local development (`npm run dev`) does **not** send analytics unless `VITE_GA_DEBUG=true` is set:

```bash
VITE_GA_DEBUG=true npm run dev
```

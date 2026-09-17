# Witness to History

A browser game where students step into a moment in American history, talk with
the people who lived it, and face the same decision they faced. See `CLAUDE.md`
for the project brief and `CONTENT_SCHEMA.md` for how content is written.

## Run it locally

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## Other commands

| Command | What it does |
|---|---|
| `npm run build` | Typechecks and builds the static site into `dist/` |
| `npm run preview` | Serves the built site so you can test it like production |
| `npm run typecheck` | Typecheck only |

## Adding or editing content

Content lives in `content/scenarios/<scenario-id>.json`. Adding a new era means
adding a new JSON file there. No code changes are needed.

On load the game checks every file against the schema:

- **Errors** (a choice points to a dialogue ID that does not exist, a decision
  option points to a missing outcome, and so on) stop that scenario from
  loading. The era menu shows exactly which cell to fix.
- **Warnings** (empty or `TODO` cells, missing images or alt text) let the
  scenario run. The game shows a yellow banner at the top listing them and
  renders each unfinished field as an obvious "Content coming soon" box.

The game never fills in missing content on its own.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and
publishes it to GitHub Pages. One-time setup in the repo: Settings > Pages >
Source > "GitHub Actions".

## Code map

```
src/
  content/      types.ts (JSON shape), validate.ts (schema checks), loadScenarios.ts
  engine/       state.ts: the game's screen-to-screen state machine
  screens/      one component per screen in the core loop
  components/   shared pieces: Frame, ContentText, ContentImage, SourceList, WarningBanner
```

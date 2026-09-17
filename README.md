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

### From the Google Sheet to JSON

The content team writes in a Google Sheet with eight tabs. Blank CSV templates
for those tabs, plus setup and export steps for the content team, are in
`content/templates/`. To convert an export:

```bash
npm run convert -- path/to/folder-of-csvs
```

The script reads one CSV per tab (Google's `Sheet name - Tab.csv` file names
are fine), builds the JSON, and runs the same validation the game runs. Every
problem is printed with the tab, row, and column to fix, for example:

```
✖ Row 5 of Dialogue (committee_intro), column "choice_1_next": "committee_fair" is not a dialogue ID or END.
```

It writes `content/scenarios/<id>.json` only when there are no errors. Warnings
about unfinished `TODO` cells are listed but do not block the file.

## Maps

Two optional, content-driven map features:

- **Town map hub.** If a scenario has a `map` block (from the optional Places
  tab), the "who do you want to talk to" screen draws a simple illustrated town
  map in SVG and places each figure at their spot. Pins are real buttons named
  like "Talk to Mr. Hale at Mr. Hale's shop", and the plain list of people stays
  below the map, so keyboard and screen reader users lose nothing. The
  drawings are generic on purpose: the game never depicts a specific real town.
- **"You are here" on a briefing image.** Any briefing screen with an image can
  carry a marker (percent coordinates plus a label). The boycott scenario uses
  it on a public domain 1774 map of New England from the Library of Congress,
  loaded straight from their image service, with the record cited as a source.

## Read aloud

The header has one "Read aloud" toggle. When it is on, the game reads each new
screen with the browser's built-in Web Speech API (`speechSynthesis`), which is
free and needs no library or network. It reads headings, body text, and the
numbered dialogue choices and decision options, and skips navigation buttons,
source citations, and anything a student types. The button only appears in
browsers that support speech, and the on/off preference is remembered in the
browser's local storage. Nothing is sent anywhere.

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

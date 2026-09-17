# Project Brief: Witness to History (working title)

CS 3892 / MTED 3050, Designing Computing for Learning, Vanderbilt, Fall 2026.
Team: 2 CS students (Julia, Naya) build the tool. 4 Peabody Education students own research, content, learning design, and evaluation.

## The idea
Students travel back to a moment in American history, talk with the people who lived it, and face the same hard decisions those people faced, with the same limited information.

## Learner
Middle and high school students studying American history. Design for the youngest end: assume a 12 year old reading level, short attention span, and a school Chromebook.

## Learning goal
Students understand that historical figures made decisions under real constraints and incomplete information, and that different choices could have led to different outcomes.

## Core loop (one play session, about 10 to 15 minutes)
1. **Choose an era** from a menu.
2. **Briefing:** a few short, visual screens set the scene (year, place, what is at stake).
3. **Talk to figures:** a hub shows 2 to 3 historical figures. The student opens branching conversations by picking dialogue options. Figures explain their perspective, pressures, and what they do and do not know.
4. **Decision:** the student faces one real decision from the era and picks an option.
5. **Outcome:** the game shows what follows from their choice.
6. **Historical reveal:** what actually happened and why.
7. **Reflection:** 1 to 2 short prompts connecting their choice to the real constraints.

## Priorities
**Must have (Phase 1 pitch, Oct 7)**
- Era select
- Period briefing
- Interactive dialogue with at least one figure
- One decision point with outcomes
- Opens reliably from a link in a browser

**Should have (Phase 2, by late Nov)**
- Full scenario with 2 to 3 figures, historical reveal, reflection
- Read aloud for all text (browser Web Speech API, free)
- Primary source viewer (sources already tagged in content)

**Nice to have**
- Second era
- Map showing where the student is

**Out of scope for now**
- Character customization
- Accounts, logins, saving progress to a server
- AI-generated dialogue at runtime

## Hard constraints
- **Zero cost.** Every tool, library, host, asset, and data source must be free.
- **Browser only.** No install, no login. Must work on a school Chromebook and on a phone.
- **Content is pre-written by the Education students** and loaded from data files. The code must never invent historical content. If content is missing, show an obvious placeholder, do not make something up.
- **Accessible and readable:** large text, high contrast, keyboard navigable, every image has alt text.
- **Small and working beats large and broken.** Keep a deployable version working at all times.

## Tech stack
- Vite + React + TypeScript
- Content lives in `content/scenarios/<scenario-id>.json`, following `CONTENT_SCHEMA.md`
- Validate content against the schema on load and show clear errors (the content authors are not programmers)
- No backend. Static site deployed free via GitHub Pages
- Public domain images only (Library of Congress, National Archives, Wikimedia Commons public domain)

## Working rules for AI coding sessions
- Work in small, testable steps. Propose a plan before large changes.
- Build the thinnest end to end slice first, then deepen.
- Do not add features outside the current sprint task.
- Keep the engine content-agnostic: adding a new scenario should require only a new JSON file.
- Summarize what changed after each task so the team can log AI use for the course worksheets.

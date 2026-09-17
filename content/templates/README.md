# Content templates

Nine CSV files, one per tab of the content sheet. Each has only a header row.
Column meanings are in `CONTENT_SCHEMA.md` at the top of the repo. The
**Places** tab is optional: leave it out and the game shows the people as a
plain list instead of a town map.

## Setting up the Google Sheet

1. Make a new Google Sheet. Rename the first tab **Scenario**.
2. Add tabs named exactly: **Briefing**, **Figures**, **Dialogue**, **Decision**,
   **Outcomes**, **Reveal and Reflection**, **Sources**, and optionally **Places**.
3. For each tab: File > Import > Upload the matching CSV here > Import location
   "Replace current sheet". That fills in the header row.
4. Write content in the rows below the headers. Write `TODO` in any cell you
   have not finished. Leave optional cells (images, choice 2 and 3, excerpt)
   empty if not needed.

## Handing content to the CS team

Google Sheets downloads one tab at a time:

1. Click the tab, then File > Download > Comma Separated Values (.csv).
2. Repeat for every tab. Put the files in one folder.
3. Send the folder (or a zip of it). File names like
   `Witness Content - Dialogue.csv` are fine.

The CS team runs `npm run convert -- <folder>`. It prints any problems as
"Row 4 of Dialogue, column choice_1_next: ..." so they can be fixed in the
sheet without touching code.

## Quick rules

- IDs: lowercase letters, numbers and underscores. Unique within a tab.
- Links between rows use IDs. A choice's `next` is a Dialogue `id` or `END`.
- `sources` cells hold one or more Source IDs separated by commas.
- `is_real_person`: `yes` or `no`. Source `type`: document, image, map,
  letter, newspaper, or secondary.
- Every image needs an alt text cell filled in.
- Map positions (`x`, `y`, `marker_x`, `marker_y`) are percentages across the
  picture: 0 is the left or top edge, 100 is the right or bottom edge.
- Place `kind`: meeting_house, shop, farm, house, church, tavern, dock, field,
  or other. It only changes the little drawing.

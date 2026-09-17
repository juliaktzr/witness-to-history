# Content Schema

This is the contract between the Peabody content team and the CS build team.
Peabody students write content in a shared Google Sheet with the tabs below. The sheet is exported and converted into one JSON file per scenario, which the game loads. Nobody on the content team needs to touch code.

## Rules for everyone
- **IDs** are short, lowercase, no spaces: `merchant_intro`, `src_association`. Every ID must be unique within its tab.
- **Links between rows use IDs.** A dialogue choice points to the next dialogue row by its ID.
- **Every factual claim needs a source.** Put one or more source IDs in the `sources` column.
- **Reading level:** aim for grade 6 to 7. Keep each text block under about 60 words.
- **Placeholders:** write `TODO` in any cell you have not finished. The game shows these clearly instead of breaking.

## Sheet tabs

### 1. Scenario (one row)
| Column | What to write | Example |
|---|---|---|
| id | Short ID for the scenario | `rev_1775_boycott` |
| title | Title students see | Stand With the Boycott? |
| era | Era name shown in the menu | American Revolution |
| year | Year of the scenario | 1775 |
| location | Where it takes place | A small town in Massachusetts |
| summary | One sentence for the era menu | Your town must decide whether to enforce a boycott of British goods. |
| cover_image | Public domain image link | (link) |
| cover_image_alt | Description of the cover image for accessibility | A crowd in a colonial town square |

### 2. Briefing (one row per screen, in order)
| Column | What to write |
|---|---|
| id | `brief_1`, `brief_2` ... |
| order | 1, 2, 3 ... |
| heading | Short heading |
| text | What the student reads |
| image | Public domain image link (optional) |
| image_alt | Description of the image for accessibility |
| marker_x, marker_y | Optional. Put a "you are here" pin on the image. Percent across (x) and down (y) the picture, 0 to 100 |
| marker_label | Optional. Text under the pin, e.g. "Your town is somewhere near here" |
| sources | Source IDs, comma separated |

### 3. Figures (one row per person)
| Column | What to write |
|---|---|
| id | `merchant`, `loyalist` ... |
| name | Name shown to student |
| role | One line: who they are |
| is_real_person | `yes` if a real historical person, `no` if a composite based on real people |
| portrait | Public domain image link |
| portrait_alt | Image description |
| start_node | ID of the first dialogue row for this figure |
| place | Optional. ID of a row in the Places tab, where this person stands on the town map |

### 4. Dialogue (one row per thing a figure says)
| Column | What to write |
|---|---|
| id | Unique ID, e.g. `merchant_intro` |
| figure | Figure ID who is speaking |
| text | What the figure says |
| sources | Source IDs backing the facts in this line |
| choice_1_text | First thing the student can say back |
| choice_1_next | Dialogue ID that choice leads to, or `END` |
| choice_2_text | Second option (optional) |
| choice_2_next | |
| choice_3_text | Third option (optional) |
| choice_3_next | |

A row with no choices ends the conversation and returns the student to the figure hub.

### 5. Decision (one row)
| Column | What to write |
|---|---|
| id | `decision` |
| prompt | The question the student must answer |
| context | Reminder of the pressures and what is unknown |
| option_1_text / option_1_outcome | Option text and the Outcome ID it leads to |
| option_2_text / option_2_outcome | |
| option_3_text / option_3_outcome | (optional) |

### 6. Outcomes (one row per possible outcome)
| Column | What to write |
|---|---|
| id | `outcome_enforce` ... |
| title | Short title |
| text | What happens because of the student's choice (plausible, grounded in history) |
| sources | Source IDs |

### 7. Reveal and Reflection
| Column | What to write |
|---|---|
| type | `reveal` or `reflection` |
| id | `reveal`, `reflect_1`, `reflect_2` |
| text | What actually happened (reveal), or the question (reflection) |
| sources | Source IDs (reveal only) |

### 9. Places (optional, one row per spot on the town map)
When this tab exists, the "talk to figures" hub draws a simple illustrated town map and puts each figure at their place. Leave the tab out to show a plain list.
| Column | What to write |
|---|---|
| id | `meeting_house`, `shop` ... |
| label | Name shown on the map, e.g. Mr. Hale's shop |
| kind | Which little drawing to use: `meeting_house`, `shop`, `farm`, `house`, `church`, `tavern`, `dock`, `field`, `other` |
| x | Left-to-right position, 0 to 100 |
| y | Top-to-bottom position, 0 to 100 |
| you_are_here | `yes` on the one place where the student is standing |

### 8. Sources (one row per primary or secondary source)
| Column | What to write |
|---|---|
| id | `src_association` ... |
| title | Title of the document or image |
| creator | Author or creator |
| date | Date created |
| type | `document`, `image`, `map`, `letter`, `newspaper`, `secondary` |
| url | Link to the archive page |
| excerpt | Short excerpt students can read (optional, public domain only) |

## JSON shape (for the CS team)
The converter (`npm run convert -- <folder-of-csvs>`, see `content/templates/README.md`) turns the sheet into this structure. See `content/scenarios/rev_1775_boycott.json` for a full example.

```json
{
  "id": "string",
  "title": "string",
  "era": "string",
  "year": 1775,
  "location": "string",
  "summary": "string",
  "coverImage": { "src": "string", "alt": "string" },
  "briefing": [
    { "id": "string", "heading": "string", "text": "string",
      "image": { "src": "string", "alt": "string" },
      "marker": { "x": 50, "y": 40, "label": "string" },
      "sources": ["srcId"] }
  ],
  "figures": [
    { "id": "string", "name": "string", "role": "string", "isRealPerson": false,
      "portrait": { "src": "string", "alt": "string" }, "startNode": "dialogueId",
      "place": "placeId" }
  ],
  "map": {
    "places": [ { "id": "string", "label": "string", "kind": "shop", "x": 50, "y": 40 } ],
    "here": "placeId"
  },
  "dialogue": {
    "dialogueId": {
      "figure": "figureId", "text": "string", "sources": ["srcId"],
      "choices": [ { "text": "string", "next": "dialogueId or END" } ]
    }
  },
  "decision": {
    "prompt": "string", "context": "string",
    "options": [ { "text": "string", "outcome": "outcomeId" } ]
  },
  "outcomes": {
    "outcomeId": { "title": "string", "text": "string", "sources": ["srcId"] }
  },
  "reveal": { "text": "string", "sources": ["srcId"] },
  "reflection": [ { "id": "string", "prompt": "string" } ],
  "sources": {
    "srcId": { "title": "string", "creator": "string", "date": "string",
      "type": "document", "url": "string", "excerpt": "string" }
  }
}
```

## Validation the game should run on load
- Every `next`, `outcome`, `startNode`, and source ID points to something that exists
- Every dialogue node is reachable from some figure's `startNode`
- No text field is empty; `TODO` values are flagged in a visible warning banner
- Every image has alt text
- Every figure `place` and the map's `here` point to a row in Places; positions are 0 to 100

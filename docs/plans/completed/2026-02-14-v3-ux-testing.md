# V3 UX Testing Report — 2026-02-14

## Plan Acceptance Criteria: All Pass

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Home renders featured chart by default | PASS — `?chart=pain-gender`, grouped bar renders |
| 2 | Switching presets updates chart + URL | PASS — clicked "Partners & Openness", URL and chart both updated |
| 3 | Deep-link Home → Explore pre-populates X/Y | PASS — `/explore?x=sexcount&y=opennessvariable` |
| 4 | `/` no longer shows "Dataset Dashboard" | PASS — shows "The Big Kink Survey" |
| 5 | `/data-quality` preserves former dashboard | PASS — rows, questions, caveats, missingness all present |
| 6 | Nav labels are plain-language | PASS — Home, Explore, Browse Topics, Build a Profile, What's Connected?, etc. |
| 7 | About "Try This" links target real columns | PASS — "Explore orientation vs politics" → `/explore?x=straightness&y=politics` |
| 8 | Explore layout: visual first, controls last | PASS — 01 Chart → 02 Result Details → 03 Edit this chart |
| 9 | Tooltip triggers on Explore controls | PASS — `?` buttons on X/Y, filter, row limit, normalization |
| 10 | Question cards (6-8 prompts) | PASS — 8 cards, 2-col grid |
| 11 | Build Your Own works | PASS — bar chart renders with Straightness × Politics |
| 12 | About the Data trust block | PASS — Section 04 with respondent count, tip, link |
| 13 | Profile suggested starter chips | PASS — "Straight Males 25-28", "Liberal Females", "Conservative Non-Straight" |
| 14 | Browse Topics interestingness sort | PASS — defaults to "Interesting starter questions" |

## Bug Found & Fixed

**Question card deep link missing base path** (`src/routes/index.tsx:388`)

The "What is connected to straightness overall?" card used `<a href="/relationships?column=straightness">` which doesn't include the `/survey/` base path. Navigated to `austinwallace.ca/relationships?column=straightness` → 404 on the main site.

Fix: replaced `<a href>` with TanStack `<Link to>`. Deployed to Railway same session.

---

## First-Time User UX Evaluation

### What works well

1. **The opening hook is strong.** "The Big Kink Survey" title + a real chart immediately visible above the fold is a massive improvement over the old "Dataset Dashboard" with null ratios. You land on something visual and intriguing.

2. **Question framing is excellent.** "Are men and women different on giving vs receiving pain?" is immediately graspable. The plain-language question above each chart is the single best UX decision in the whole overhaul.

3. **Preset pills are intuitive.** The tab row with 10 options feels like flipping through a magazine. Clicking a pill, seeing the chart swap instantly, and having the URL update for sharing — this flow is smooth and satisfying.

4. **Evidence metadata strikes a good balance.** The "Evidence: robust" / "Data notes" lines below each chart are unobtrusive but give credibility to engaged readers. Good progressive disclosure.

5. **Build Your Own is surprisingly usable.** Two dropdowns + chart type selector is the right level of simplicity. The chart renders instantly via DuckDB-WASM which feels like magic.

6. **Question cards are good wayfinding.** Eight natural-language prompts give the user a reason to keep exploring. The mix of "Open Chart" (stays on home) and "Open Page" (goes deeper) is well-calibrated.

7. **Browse Topics default sort is smart.** Defaulting to "Interesting starter questions" instead of alphabetical means the first things you see are worth looking at.

8. **Profile suggested starters are exactly right.** "Straight Males 25-28" is a relatable demographic most people can reason about — much better than a blank form.

9. **The design system holds up.** Ink & Paper (cream, ink, red accent, Fraunces display, no border-radius) is distinctive and pleasant. The monospace labels ("QUESTION", "01", "02") give it a research-journal feel without being cold.

### Issues and improvement opportunities

#### High Priority

**H1. Preset pill labels are cryptic to lay users.**
"Childhood & S/M", "Arousal Fixity", "Honesty Signal", "Role Quadrants", "Politics & Breadth", "Orientation & Breadth", "State Effect", "Neuroticism & Pain" — most of these are jargon. A first-time visitor doesn't know what "fixity" or "breadth" means. The *questions* underneath are great, but the pills are the first thing you see and they're the entry point.

Suggestion: Use the question itself as the pill label, abbreviated. E.g.:
- "Childhood & S/M" → "Childhood → Kinks?"
- "Arousal Fixity" → "How fixed are kinks?"
- "Honesty Signal" → "Do people lie?"
- "Role Quadrants" → "Dom vs Sub"
- "Politics & Breadth" → "Politics & Kinks"
- "State Effect" → "Mood & Arousal"
- "Neuroticism & Pain" → "Anxiety & Pain"

**H2. The "Build Your Own" default chart (Straightness × Politics) is misleading.**
It shows a single massive red bar for "Straight" (~14000) dwarfing "Not straight" (~1000). This is just showing the sample composition (most respondents are straight), not an interesting relationship. A first-time user might think "this chart says nothing" and disengage. The default should show something with visible variation — e.g., `politics` × `opennessvariable` would show a clear gradient.

**H3. Navigation is broken on mobile.**
The horizontal nav is a single row that overflows and gets cut off ("WHAT'S CO..."). There's no hamburger menu, no horizontal scroll indicator. Users on phones can't access SQL Console, Notebook, Data Quality, or About. This needs either a hamburger/drawer menu or a visible horizontal scroll with overflow indicators.

**H4. The Explore page shows a table, not a chart, in the "Chart" section.**
The section is called "01 Chart" but renders a data table (rows of sexcount × opennessvariable values). This is confusing — it says "Chart" and "Start by reading the visual result first" but there's no visual chart. Either add an actual chart visualization here, or rename the section to "Results."

**H5. "UNKNOWN" labels under the X/Y dropdowns on Explore are confusing.**
Below "Sexcount" and "Opennessvariable" dropdowns, there's a gray "UNKNOWN" label. A user doesn't know what this means. Is the column type unknown? Is it an error? These should either be removed or replaced with a meaningful description (e.g., the column's category tag or a brief description).

#### Medium Priority

**M1. Section headers leak implementation thinking.**
"Featured Chart Explorer", "Build Your Own (v1)", "Question Cards" — these read like internal feature names, not user-facing copy. Nobody knows what "v1" means. Suggestions:
- "Featured Chart Explorer" → "What the data shows" or just remove the header
- "Build Your Own (v1)" → "Build your own chart"
- "Question Cards" → "Questions you can explore"
- "About the Data" is fine

**M2. The subtitle is meta, not compelling.**
"Start with plain-language findings, then drill into the raw questions when you want detail" describes the *app's structure* rather than the *content*. A first-time user cares about what they'll learn, not how the app is organized. Better: "What 15,000 people revealed about desire, personality, and identity."

**M3. Wave-2 evidence text is still jargon-heavy for casual users.**
"Evidence: robust. Large in responder subset (wave-2: d=0.62 pre-imputation, much smaller under zero-imputation)" — this is meaningful to a researcher but gibberish to the target "lay person" audience. The evidence tier label is good ("robust" / "supported"), but the effect-size detail could be collapsed behind a "Details" toggle.

**M4. Chart legend rendering appears glitchy.**
The "Receive pain" legend text on the Pain & Gender chart appears to have overlapping or misaligned characters ("Re8eive pain" in screenshots). This could be a font rendering issue with JetBrains Mono at small sizes, or a Recharts legend positioning bug.

**M5. No visual affordance that preset pills are interactive.**
The pills look like static labels. On first load "Pain & Gender" is filled (dark background), but the other pills look like plain bordered tags — not clearly clickable. A hover effect or cursor change would help. Even a subtle "Pick a finding:" label above the row would improve discoverability.

**M6. The `?chart=` URL param is visible to users.**
Not a bug, but the URL after landing is `austinwallace.ca/survey/?chart=pain-gender`. The `?chart=` is visible in the address bar and when sharing. Minor, but "pain-gender" as a URL slug could be surprising in some social contexts.

**M7. Column names in Explore are raw identifiers.**
"Sexcount" and "Opennessvariable" are internal column names, not human-readable labels. The column combobox on the home page shows "Straightness" and "Politics" which are fine, but deeper columns like "opennessvariable" would be confusing. Display names should be used consistently.

#### Low Priority

**L1. No loading state between preset switches.**
When clicking a new preset pill, there's a brief flash where the old chart disappears and new data loads. The loading skeleton exists for initial load but doesn't appear for preset switches. A subtle transition or skeleton would feel more polished.

**L2. Question card grid could use visual hierarchy.**
All 8 cards look identical — same border, same padding, same button style. The most popular/interesting findings could be visually promoted (larger card, different background, or a "Popular" badge).

**L3. About the Data section feels disconnected.**
It's at the very bottom of a long page. Users who need this context (before making claims from the data) likely won't scroll that far. Consider putting a condensed trust line near the top — something like "Based on 15,503 anonymized survey responses" right under the subtitle.

**L4. No indication of sample size on featured charts.**
The chart shows averages but doesn't say N. A user might wonder "is this based on 50 people or 5,000?" Adding a small "N = X,XXX" somewhere near each chart would build confidence.

---

## Naive User Journey Evaluation

**Persona**: Someone who's curious about kink/sexuality data but has never used a stats tool, pivot table, or cross-tab. They found this link on social media and clicked.

### The Landing (Home Page)

**First impression: strong.** "The Big Kink Survey" in big serif type + a real chart visible immediately = good hook. The pain & gender chart is visually striking and the question "Are men and women different on giving vs receiving pain?" is immediately understandable. A curious person keeps scrolling.

**But the subtitle loses them immediately.** "Start with plain-language findings, then drill into the raw questions when you want detail" is app-architecture meta-text. A naive user doesn't care how the app is organized — they care what they'll learn. This should say something about the *content*, e.g. "What 15,000 people revealed about desire, personality, and identity."

**The preset pills are a guessing game.** "Pain & Gender" is clear. But then: "Childhood & S/M" (ok, guessable), "Arousal Fixity" (what?), "Honesty Signal" (what signal?), "Role Quadrants" (quadrants?), "Politics & Breadth" (breadth of what?), "State Effect" (what state?). A naive user would click the ones they can decode and skip the rest — meaning half the content is invisible to them. The questions *underneath* each chart are excellent, but the pills are the entry point and they're failing.

**The evidence text is a wall of jargon.** Below the Pain & Gender chart: "Evidence: robust. Large in responder subset (wave-2: d=0.62 pre-imputation, much smaller under zero-imputation)" followed by "Data notes: Uses gated columns; effect sizes are inflated among responders. Direction/magnitude may change under zero-imputation sensitivity checks." A naive user reads "Evidence: robust" and understands that. Everything after is noise that may actively undermine trust — if I don't understand it, maybe this isn't for me.

**The "Re8eive pain" legend glitch.** The chart legend renders "Receive pain" with overlapping characters, looking like "Re8eive pain". Small but it dents credibility for a new visitor.

**Build Your Own section: confusing default.** The default chart shows Straightness × Politics — a single huge red bar for "Straight" (~14000) dwarfing a tiny "Not straight" bar. This just shows sample composition, not an interesting relationship. A naive user thinks "this chart says nothing" and disengages. The section title "Build Your Own (v1)" also leaks implementation thinking — "(v1)" means nothing to a user.

**Question Cards: good but flat.** Eight natural-language prompts are well-written. "Does childhood spanking connect to adult S/M interest?" is immediately engaging. But all 8 cards look identical — no visual hierarchy, no indication of which are most popular or surprising. A naive user picks one semi-randomly.

**About the Data: buried and cold.** It's at the very bottom of a long page. The text "15,503 respondents and 365 columns" is factual but not compelling. No mention of who collected it, why, or what makes it unique. The tip about "Data Quality for schema diagnostics" is pure jargon. A naive user who needs to know if this data is trustworthy before sharing a finding will never scroll this far.

### Following "Explore This Further" (Home → Explore)

**This is where the naive user journey breaks catastrophically.**

I clicked "Explore this further" from the "Arousal Fixity" chart. The home page showed a clean bar chart with a plain-language question. Explore shows:

1. **Section "01 Chart" but it's a table.** The heading says "Chart" and the subtext says "Start by reading the visual result first" — but there's no visual. It's a raw data table with columns "IF YOU TRIED VERY HARD, COULD YOU STOP BEING AROUSED BY S..." (truncated) and "TOTALFETISHCATEGORY" (raw internal column name). A naive user expected to see a chart. They see a spreadsheet.

2. **The data table is enormous and unsummarized.** Dozens of rows like "With some effort, yes | 7.0 | 373" repeating with different numbers. No aggregation, no visual pattern. The table that was a clean 5-bar chart on the home page has exploded into 50+ incomprehensible rows.

3. **Internal identifiers are visible.** The Result Details section shows "People who answered If you tried very hard, could you stop being aroused by something you're into? (7lgg41e): 15,502" — the "(7lgg41e)" hash is an internal column ID that shouldn't be user-facing.

4. **"UNKNOWN" labels under both dropdowns.** Below the X and Y question selectors, gray "UNKNOWN" text appears. A naive user doesn't know what's unknown — is something broken?

5. **"TOTALFETISHCATEGORY" as a Y-axis label.** This is a raw internal column name. The home page called it "total kink breadth" which was already jargon, but at least it was English words. This is a database column name.

6. **Residual filter state is confusing.** The "Optional Demographic Filter" shows "I am aroused by being submissive in sexual interactions" with numeric filter values (2.0, 3.0, 1.0, 0.0, -2.0, -1.0, -3.0). A naive user has no idea what -2.0 means in this context. Are these Likert scale values? They're not labeled.

7. **"RESULT ROW LIMIT (TABLE MODE)"** — pure implementation jargon.

**Verdict: The Explore page is the single biggest barrier to naive user engagement.** The journey from a beautiful home page chart to this raw data dump is the moment a casual visitor closes the tab.

### "What's Connected?" Page

**The concept is clear** — "Select a question to see its strongest connections" with "Straightness" pre-selected. Good default choice.

**But the results table exposes internals:**
- Internal column IDs visible: "(5b30vz2)", "(eowvxbs)", "(i73h77m)", "(35jn7ey)" appear after question text
- "CONNECTION STRENGTH (V)" — a naive user doesn't know what "V" is (Cramer's V)
- Decimal values like "0.1461" mean nothing without context — is that strong or weak?
- "STRENGTH LABEL" column shows "Weak" and "Negligible" — these are helpful! But they contradict the "Most Connected" heading. If the top connections are all "Weak", a naive user thinks the feature is broken or the question isn't interesting.
- The red bar visualization next to strength values is a good affordance — it gives a visual sense of magnitude even if the number is opaque.

**The subtitle is jargon:** "Categorical pairs use V and numeric pairs use correlation." A naive user doesn't know what categorical/numeric pairs are, what V means, or what correlation means in this context.

### "Build a Profile" Page

**The concept is immediately clear.** "Pick a group and see what is unusually common compared with everyone else" — a naive user gets it. Suggested starters ("Straight Males 25-28", "Liberal Females", "Conservative Non-Straight") are relatable entry points.

**But clicking a starter exposes raw data:**
- Field 2 shows "Biomale" (a raw column name). A naive user doesn't know what "biomale" means. Should be "Sex" or "Gender".
- The value for Biomale is "1.0" — a numeric code with no label. A naive user doesn't know that 1.0 = male.
- The URL shows `v1=%221.0%22` which looks broken.

**The results are conceptually powerful but unintelligible:**
- "Your Group Summary" with Dataset Size / Cohort Size / Cohort Share / Cohort Rarity is well-structured. The big numbers (15,503 / 1,565 / 10.09% / 89.91%) are satisfying.
- "Percentile Snapshot" uses all raw internal column names: "totalfetishcategory", "powerlessnessvariable", "opennessvariable", "extroversionvariable", "neuroticismvariable". A naive user cannot read this table.
- Values like "-1.000" and "0.000" have no scale context. Is -1 extroversion low? Medium? What's the range?
- "Global Percentile" (62.23%) is useful but unlabeled — no explanation like "more extroverted than 62% of all respondents."
- "Most Unusually Common Signals" is the most interesting section: "Times more likely" (4.73x, 2.00x, 1.95x) is intuitive for lay users. But again, raw column names ("Biomale", "Bondagemost") and unlabeled values ("-2.0") ruin comprehension.

### "Browse Topics" Page

**The search + sort interface is functional.** "Interesting starter questions" as default sort is smart.

**Topic filter labels are jargon:**
- "ocean" — this is the OCEAN/Big Five personality model. A naive user thinks of the actual ocean. Should be "personality" or "Big Five personality".
- "derived" — a naive user doesn't know what derived variables are. Should be "computed" or "combined scores" or just hidden.
- "demographic", "fetish", "other" are fine.

**Column cards use raw internal names:** "straightness", "politics", "biomale" — all lowercase, no human-readable labels. Should be "Orientation (Straight vs Not)", "Political Leaning", "Sex (Biological Male)".

**"UNKNOWN" badges appear on every card** — this is the column's category tag when no category is assigned. To a naive user, "UNKNOWN" looks like an error. Should either be hidden or replaced with a meaningful default.

**"CATEGORICAL" badges** — stats jargon. A naive user doesn't know what categorical means. Could be replaced with "Multiple choice" or just hidden.

### "About This Project" Page

**This is actually well-written for the target audience.** It explains who created the survey (Aella), what the data covers (sexual interests, kinks, personality, demographics, politics), and why it's anonymized. The ~15,500 / 365 / 5 stat callout is clean.

**The "What This Explorer Does" section** provides a useful guide to each page. The descriptions are in monospace and feel slightly technical but are short enough to scan.

**"Try This" links are clear** — "Explore orientation vs politics", "Compare gender and relationship style", "Jump to strongest associations for straightness" are plain-language and actionable.

**One issue:** The page descriptions still use some jargon: "adjust counting mode", "data-note summaries", "question metadata". These are minor since the About page is opt-in reading, but a truly naive user might bounce off them.

### Overall Journey Assessment: The Cliff Edge Problem

The core issue is a **cliff edge between the home page and every other page**:

| Surface | Experience level | Verdict |
|---------|-----------------|---------|
| Home page (featured charts) | Beginner-friendly | Works well — visual, question-driven, engaging |
| Home page (build your own) | Mixed | Functional but default chart is misleading |
| Explore page | Expert-only | Wall of raw data, no chart, internal identifiers visible |
| What's Connected? | Advanced | Interesting concept but jargon-heavy (V, correlation) |
| Build a Profile | Advanced | Great concept, raw column names and numeric codes |
| Browse Topics | Advanced | Raw column names, "UNKNOWN" badges, jargon filters |
| About page | Beginner-friendly | Well-written, good Try This links |

**A naive user's likely journey:** Land on home → read 2-3 charts (30 seconds of delight) → click "Explore this further" → see a data table instead of a chart → close tab.

The home page promises a guided, visual experience. Every subsequent page delivers a data analysis tool. This mismatch is the single biggest UX problem.

### The Root Cause: Raw Column Names Everywhere

A single fix would improve almost every page: **a human-readable display name map for all 365 columns**, referenced consistently across:
- Explore dropdowns and column headers
- What's Connected table
- Build a Profile field labels and values
- Browse Topics cards
- Percentile Snapshot metric names
- "UNKNOWN" category tags → meaningful categories

Current state: The schema has `displayName` for some columns (e.g., "Straightness", "Politics") but many show raw identifiers like "totalfetishcategory", "opennessvariable", "biomale", "(7lgg41e)", "(5b30vz2)".

### Fix Applied: Human Labels Map

Created `src/lib/schema/human-labels.json` — a hand-curated map of 134 identifier-style column names to plain-language labels. Wired into `scripts/profile-schema.mjs` so human overrides take priority over auto-generated title-casing during `pnpm profile-schema`.

Examples of before → after:
| Raw name | Old displayName | New displayName |
|---|---|---|
| biomale | Biomale | Sex (biological male) |
| totalfetishcategory | Totalfetishcategory | Total Kink Categories |
| opennessvariable | Opennessvariable | Openness (personality) |
| extroversionvariable | Extroversionvariable | Extroversion (personality) |
| sexcount | Sexcount | Number of Partners |
| straightness | Straightness | Sexual Orientation |
| politics | Politics | Political Leaning |
| bondagemost | Bondagemost | Bondage (favorite type) |

Schema regenerated (`pnpm profile-schema`), types pass, build succeeds. Every page that uses `column.displayName` now shows the curated label automatically — no component changes needed.

---

## What I'd test next (if continuing)

1. **Click every preset pill** — verify all 10 render correct chart types (bar, grouped-bar, line) without errors
2. **Test all question card "Open Chart" links** — verify each switches to the correct preset
3. **Mobile viewport on all pages** — especially Relationships (long table), Profile (three-column form), and SQL Console
4. **Chart tooltip quality on every preset** — hover each bar/line point to verify tooltip content is meaningful
5. **Build Your Own with edge cases** — select two numeric columns (line chart), two high-cardinality columns (does it overwhelm?), same column for X and Y
6. **Keyboard navigation** — tab through preset pills, verify focus ring and aria-selected state
7. **Slow connection simulation** — DuckDB-WASM is ~40MB; test the loading skeleton experience on throttled connection
8. **Test the "Edit this chart" anchor** on Explore — does it smooth-scroll to section 03?
9. **Bookmark/share a preset URL** — open `?chart=childhood-sm` in a fresh incognito tab, verify it loads correctly
10. **Test all nav links from every page** — verify no more base-path issues like the one found
11. **Accessibility audit** — screen reader on the chart (are bar values announced?), color contrast on the cream background with faded text
12. **Performance profiling** — time from first paint to interactive chart on cold load

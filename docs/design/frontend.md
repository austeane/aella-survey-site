# Frontend Design System — "Ink & Paper"

Direction: editorial research journal. The UI should feel like a beautifully typeset academic publication — warm, authoritative, and clear. Think NYT data journalism meets a well-set research paper.

## Design Tokens

### Colors (CSS variables)

```css
--paper: #f5f0e8;          /* primary background */
--paper-warm: #ede6d8;      /* secondary/sidebar background */
--ink: #1a1612;             /* primary text */
--ink-light: #4a4238;       /* secondary text */
--ink-faded: #8a7e70;       /* tertiary/muted text */
--rule: #c8bfb0;            /* borders, horizontal rules */
--rule-light: #ddd5c8;      /* subtle dividers */
--accent: #b8432f;          /* emphasis, links, active states */
--accent-hover: #9a3625;    /* accent hover/pressed */
--highlight: #e8d5a0;       /* selection, highlight backgrounds */
--sidebar-bg: #eae3d5;      /* raised panel backgrounds */
```

**Principle**: Dominant warm cream with ink-dark text. Red accent used sparingly — section numbers, active nav, percentage highlights. No gradients. No neon. No purple.

### Typography

| Role | Font | Weight | Size | Tracking |
|---|---|---|---|---|
| Display / H1 | Fraunces | 700 | 2.75rem | -0.03em |
| Section headers | Fraunces | 600 | 1.2rem | normal |
| Body text | Source Serif 4 | 400 | 1rem (16px) | normal |
| Body emphasis | Source Serif 4 | 600 | 0.95rem | normal |
| Subtitle/italic | Source Serif 4 italic | 400 | 1.1rem | normal |
| Data / mono | JetBrains Mono | 400-500 | 0.8rem | normal |
| Labels / caps | JetBrains Mono | 400 | 0.65rem | 0.12em, uppercase |
| Large numbers | Fraunces | 700 | 2.5rem | -0.03em |

**Google Fonts import**:
```
Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400
Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,400
JetBrains+Mono:wght@400;500
```

**Rules**:
- Never use system fonts, Inter, Roboto, or Arial
- Fraunces for headlines and large numbers only — never body
- Source Serif 4 for all body/paragraph text
- JetBrains Mono for data values, column names, SQL, code, and all-caps labels
- Pair font sizes with appropriate line-height: display 1.1, body 1.6, data 1.4

### Spacing

Base unit: `1rem` (16px). Use multiples: 0.5, 0.75, 1, 1.5, 2, 3.

- Page padding: `3rem 2rem` (top/bottom, left/right)
- Section gaps: `3rem` between major sections
- Card padding: `1.5rem 2rem`
- Table cell padding: `0.6rem 0`
- Max content width: `1200px`, centered

### Borders & Rules

- Primary divider: `2px solid var(--ink)` (nav bottom, section separators)
- Section divider: `1px solid var(--rule)` (between content areas)
- Table header border: `2px solid var(--ink)` bottom
- Table row borders: `1px solid var(--rule-light)` bottom
- Card borders: `1px solid var(--rule)` or `1px solid var(--ink)` for emphasis
- **No border-radius anywhere** — square corners are part of the editorial identity

### Backgrounds & Texture

- Apply a subtle paper noise texture via SVG filter overlay on `body::before` at ~3% opacity
- No solid color cards — use `var(--paper)` base with `var(--sidebar-bg)` for raised panels
- The accent bar on stat sections: a `3px` solid red line above the panel
- No box shadows. Depth comes from borders and background contrast only.

## Component Patterns

### Navigation

- Horizontal bar with `2px solid var(--ink)` bottom border
- Logo: Fraunces 700, 1.5rem. Subtitle in Source Serif italic, faded
- Links: Source Serif 0.85rem, uppercase with 0.06em tracking
- Active state: `var(--accent)` color + `2px` bottom border in accent
- No pills, no background highlights — editorial underline style

### Stat Cards

- Grid row with no gaps, shared `1px solid var(--ink)` outer border
- Internal dividers: `1px solid var(--rule)` between cells
- Label: JetBrains Mono, 0.65rem, uppercase, faded
- Value: Fraunces 700, 2.5rem
- Optional note: Source Serif italic, 0.8rem, faded

### Data Tables

- Full-width, no outer border
- Header: JetBrains Mono, 0.65rem, uppercase, faded. Bottom border `2px solid var(--ink)`
- Rows: `1px solid var(--rule-light)` bottom. No zebra striping
- First column (names): JetBrains Mono, ink color
- Numeric columns: JetBrains Mono, right-aligned
- Optional inline bar: 4px height, accent color at 30% opacity, positioned absolutely

### Section Headers

- Fraunces 600, 1.2rem
- Bottom border: `1px solid var(--rule)`
- Numbered: JetBrains Mono section number in accent color (e.g., "01", "02")
- Use `display: flex; align-items: baseline; gap: 0.75rem;`

### Form Controls (selects, inputs)

- JetBrains Mono, 0.8rem
- `1px solid var(--rule)` border, `var(--paper)` background
- No border-radius
- Custom dropdown arrow via `::after` pseudo-element
- Focus: border-color to `var(--ink)`

### Raised Panels (Column Inspector, etc.)

- Background: `var(--sidebar-bg)`
- Border: `1px solid var(--rule)`
- Top accent bar: `3px solid var(--accent)` via `::before` pseudo-element
- Internal stat grids: `1px` gap with `var(--rule)` background showing through

### Caveats / Callouts

- No background color — just content with rule dividers
- Title: Source Serif 600, 0.95rem
- Body: Source Serif 400, 0.85rem, `var(--ink-light)`
- Guidance: Source Serif italic, 0.75rem, `var(--ink-faded)`

## Animation

- Entrance: `fadeUp` — opacity 0→1, translateY 12px→0, 0.6s ease-out
- Stagger delays: 0.1s increments for sequential sections
- No hover animations on cards (editorial, not SaaS)
- Transitions on nav links: color 0.2s

## Anti-Patterns — Never Do These

- **No dark mode** — this is a light, warm design. The paper IS the identity
- **No border-radius** — square corners everywhere
- **No gradients** — flat colors, borders, and typography create hierarchy
- **No box-shadows** — depth via background contrast and rules
- **No Inter/Roboto/system fonts** — always Fraunces + Source Serif + JetBrains
- **No purple, blue, or neon accents** — only red (`#b8432f`) as accent
- **No pill buttons or rounded chips** — square, bordered elements
- **No emoji or icons in headers** — numbered sections and typography only
- **No card hover lift effects** — this is a journal, not a dashboard

## Reference Mockup

The canonical mockup is at `design-mockups/01-ink-and-paper.html`. Open it in a browser to see the full dashboard rendered in this design system. All implementation should match this aesthetic.

# FireDrill — Design System

## Color strategy

**Restrained at rest, Committed under alarm.** When nothing is failing the surface is brushed graphite + concrete with one warm accent. When an incident is live, the apparatus-bay red carries the page: header strip, status bar, active scenario card all flip to red.

All colors in OKLCH. Neutrals tinted toward the brand hue (warm, ~20° / very low chroma).

### Tokens

| Token              | OKLCH                       | Hex (approx) | Use                                                  |
| ------------------ | --------------------------- | ------------ | ---------------------------------------------------- |
| `--concrete-950`   | `oklch(0.14 0.008 40)`      | `#0e0c0a`    | App background                                       |
| `--concrete-900`   | `oklch(0.18 0.009 40)`      | `#171311`    | Side rail, headers                                   |
| `--concrete-800`   | `oklch(0.22 0.010 40)`      | `#1f1a17`    | Cards                                                |
| `--concrete-700`   | `oklch(0.28 0.012 40)`      | `#28221d`    | Card borders, dividers                               |
| `--concrete-600`   | `oklch(0.36 0.012 40)`      | `#3a322c`    | Subtle text, secondary borders                       |
| `--steel-500`      | `oklch(0.52 0.012 220)`     | `#6c7a85`    | Body text                                            |
| `--steel-300`      | `oklch(0.74 0.010 220)`     | `#b3bcc4`    | Primary text                                         |
| `--bone-100`       | `oklch(0.94 0.005 80)`      | `#ece7df`    | Whitest white, never #fff                            |
| `--ember-600`      | `oklch(0.56 0.20 35)`       | `#c63a14`    | Apparatus red — primary action, active state, alarm  |
| `--ember-500`      | `oklch(0.64 0.21 38)`       | `#e7491c`    | Hover, brighter alarm                                |
| `--ember-900`      | `oklch(0.32 0.13 32)`       | `#5a1d0d`    | Pressed red, dark red surfaces                       |
| `--signal-yellow`  | `oklch(0.83 0.16 92)`       | `#e8c233`    | Warning state                                        |
| `--signal-green`   | `oklch(0.72 0.16 155)`      | `#5fb579`    | Healthy state                                        |
| `--signal-ice`     | `oklch(0.78 0.07 220)`      | `#9fc1d5`    | Info / neutral status                                |

### Strategy rules

- Ember is **state**, not decoration. If nothing is failing, ember appears only in: brand mark, the FireDrill type, primary CTA buttons, the current selected nav item. Total surface coverage <8%.
- When a scenario goes live, that scenario's card flips to ember-900 background + ember-600 stroke. The Overview header's status bar adopts ember-600. The bay-number eyebrow on its card turns ember.
- Signal yellow is **only** for warning alerts. Don't dilute it.
- No pure black. No `#fff`. Neutrals always carry the warm tint.

## Typography

Three families, all variable, all on stack:

| Role                | Family                          | Weight   | Tracking | Case               |
| ------------------- | ------------------------------- | -------- | -------- | ------------------ |
| Eyebrows / dispatch | `JetBrains Mono`                | 500      | +0.18em  | UPPERCASE          |
| Headings            | `Inter`                         | 600/700  | -0.01em  | Sentence case      |
| Body                | `Inter`                         | 400/500  | 0        | Sentence case      |
| Numbers / data      | `JetBrains Mono`                | 500      | 0        | as-is              |
| Bay tags            | `Saira Stencil One` (fallback Inter 800 italic) | 400 | +0.04em | UPPERCASE |

Type scale (rem): `0.625, 0.75, 0.8125, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3`. Ratio 1.125–1.2 between adjacent steps.

No fluid type. No `clamp()` on headings.

## Layout

- Side rail: 240 px, dark concrete, no border-line — separated by a deep shadow notch instead.
- Header strip on each page: status bar with bay number, dispatch line, system clock. Becomes red when something is live.
- Content grid: 12-col, asymmetric. Don't fall back to uniform card grids — alternate large metric tiles, narrow status lists, full-bleed log streams.
- Spacing scale (px): 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64.
- Cards have full borders (1 px concrete-700) or no border (raised by shadow). **Never** side-stripe borders.

## Texture & surface

Two subtle SVG noise textures, applied with low opacity:
- **Concrete grain** on the app background — fine speckle, ~0.04 opacity.
- **Brushed steel** on side rail and metric tiles — horizontal scratches, ~0.06 opacity.

Plus stenciled "BAY" numbers, hand-painted-sign rivet dots in corners of large cards, and a single thin top-rule that runs across the page header.

## Motion

- 180–220 ms ease-out-quart on hovers, panel reveals.
- Live status badge has a 1.6 s opacity pulse (NOT a scale pulse — scale animates layout). Pulse only when an incident is currently firing.
- No bounce, no spring, no enter-from-below page transitions.
- `prefers-reduced-motion`: kill the pulse, keep state changes instant.

## Components vocabulary

- **Status pill**: pill, 1px stroke matching its state token, monospace label. Healthy / Degraded / Down.
- **Dispatch line**: thin horizontal rule at the top of each page, bay number on the left, current state on the right.
- **Scenario card**: tall portrait card. Top half is the controls. Bottom half is metadata (intensity, started, duration, affects). Goes ember on enable.
- **Incident strip**: low row, mono ID + scenario + age. No avatar, no card chrome. The list is the primary affordance.
- **Bay tag**: stenciled "BAY 03" label on metric tiles, scenarios, and service entries. Numbered 01–N for the demo's sake.

## Absolute "do not"

- No side-stripe colored borders (`border-l-N color`) on any card, list row, or callout. Use full borders, leading bay tags, or background tints.
- No gradient text. Type emphasis through weight + size only.
- No glassmorphism. The fire station is concrete, not glass.
- No emoji. Ever. Hand-drawn stencil icons or none.
- No "✨", "🔥", "🚒" flame/truck emoji in the brand mark.

# TradeLog Journal — Design Brief

**Tone**: Retro-futuristic trading culture, bold neon-driven Gen Z energy. Confident, unafraid of glow.

**Purpose**: Help retail traders log, annotate, analyze trades retroactively with freemium monetization via performance insights.

**Differentiation**: Neon progress bars (green → yellow → red), glassmorphic cards with accent borders, glowing CTAs, annotation canvas hero, freemium teaser cards with blur overlay.

## Color Palette (OKLCH)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Background | `0.99 0 0` (white) | `0.095 0 0` (void navy) | Page background, app base |
| Foreground | `0.15 0 0` (black) | `0.93 0 0` (off-white) | Primary text |
| Card | `1.0 0 0` | `0.14 0 0` | Glassmorphic panels |
| Primary | `0.35 0 0` (dark) | `0.72 0.2 142` (purple) | Secondary accent, accent-heavy elements |
| Secondary | `0.95 0 0` (light) | `0.48 0.18 258` (cyan) | Info panels, neutral UI |
| Accent | `0.35 0 0` (dark) | `0.68 0.22 109` (electric green) | Market gains, primary CTAs, progress bar |
| Destructive | `0.55 0.22 25` (orange) | `0.6 0.18 28` (red) | Losses, warnings, risk |
| Border | `0.9 0 0` (light) | `0.22 0.04 258` (purple glow) | Thin card borders with accent tint |
| Muted | `0.95 0 0` | `0.2 0 0` | Secondary UI, disabled states |

## Typography

| Role | Font | Scale | Weight | Usage |
|------|------|-------|--------|-------|
| Display | General Sans | 32px, 28px, 24px | 700 | Headers, trade pair labels, dashboard metrics |
| Body | Figtree | 16px, 14px | 400, 500 | Body text, trade notes, form labels |
| Mono | JetBrains Mono | 12px, 14px | 400 | Prices, P&L values, timestamps |

## Elevation & Depth

- **Void background** (`0.095 0 0`): Deep, immersive
- **Card layer** (`0.14 0 0`): Slight lift with 15% white backdrop blur + purple-tinted border
- **Interactive elevation**: Hover scale 1.05, neon glow intensify, shadow expand
- **Glassmorphism**: `backdrop-blur-md`, border `border-border` (purple tint in dark mode)

## Structural Zones

| Zone | Background | Treatment | Border |
|------|------------|-----------|--------|
| Header | `card` | Glassmorphic with border-b | `border-border` with glow |
| Main Content | `background` | Void navy, clean grid | None |
| Card Sections | `card/80` | Glassmorphic, backdrop blur | Thin accent-tinted border |
| Footer | `muted/20` | Subtle lift | `border-t` with border-border |
| Progress Bar | Gradient (accent → yellow → destructive) | Smooth animation | Rounded pill shape |

## Component Patterns

- **Buttons**: Neon glow on hover, accent color, bold text, scale 1.05 transform, 200ms transition
- **Cards**: Glassmorphism (card/80 + backdrop-blur-md), thin accent border, soft shadow
- **Form inputs**: Dark background (input), white text, accent focus ring, placeholder gray
- **Progress Bar**: Linear gradient (green → yellow → red), rounded pill, subtle glow
- **Teaser Cards**: Blur overlay (20% opacity backdrop), accent border, "Upgrade to unlock" text
- **Annotation Canvas**: Dark background with grid, neon drawing tools (green, cyan, purple)

## Motion & Interaction

- **Page Load**: Fade-in (300ms) + slide-up (12px offset) staggered on sections
- **Hover**: Scale 1.05, shadow expand to `shadow-neon-lg`, accent color intensify
- **Focus**: Accent ring outline, smooth color transition
- **Transitions**: All 0.3s ease (custom `transition-smooth` utility)
- **No bouncy animations**: Keep motion refined, purposeful

## Spacing & Rhythm

- **Radius**: 8px (`0.5rem`) standard, 0 for sharp edges on hero annotations, full for pills
- **Gap density**: `gap-4` for card grids, `gap-3` for sections, `gap-2` for form rows
- **Padding**: `p-6` for cards, `p-4` for sections, `p-2` for compact UI
- **Max width**: 1400px for main container (dashboard views), full width for hero

## Constraints for Brownfield Extensibility

- **Color function purity**: OKLCH values only—no hex, no rgb(), no hsl()
- **Token usage**: Components use semantic tokens (`bg-accent`, `text-foreground`, `border-border`), never arbitrary colors
- **Font consistency**: All text uses `font-display` or `font-body` CSS variables, never system fonts inline
- **Animation choreography**: Entrance animations follow fade-in + slide-up pattern; no random easing
- **Hover state uniformity**: All interactive elements scale 1.05 on hover with neon glow, no exceptions

## Freemium Teaser Strategy

- **Free tier limit**: Max 25 trades total, 5 entries per day. Show progress bar with remaining count.
- **Blurred insights**: Performance dashboard sections with 20% blur overlay, "Unlock performance insights" CTA
- **Upgrade prompts**: Natural conversion points (e.g., "View best/worst pairs — upgrade to unlock")
- **Paid tier**: Unlimited entries, full annotation tools, real-time performance dashboard

## Signature Detail

**Neon progress bars** with color-coded sentiment (green = gains, yellow = neutral, red = losses). Bars emit subtle glow on dark background, updating in real-time as user approaches free tier limits. This becomes the visual metaphor for freemium progression—visual urgency through neon.

## Fonts

- `General Sans` (bold, geometric) — display headers
- `Figtree` (clean, friendly) — body text
- `JetBrains Mono` (technical) — prices, P&L, timestamps

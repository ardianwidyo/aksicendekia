# Research & Technical Decisions: Design System & App Shell

**Feature**: Design System & App Shell (`specs/001-design-system-app-shell`)
**Date**: 2026-08-26

## 1. Design Token Generator (`design/DESIGN.md` -> `packages/design-tokens`)

### Decision
Implement a zero-dependency Node.js script (`packages/design-tokens/scripts/generate-tokens.mjs`) that parses the YAML frontmatter in `design/DESIGN.md`, generates CSS Custom Properties for base M3 tokens and grade-level overrides, and outputs `packages/design-tokens/src/tokens.css` and `tokens.json`.

### Rationale
- **Single Source of Truth**: Enforces Constitution Principle VI. Updates to `design/DESIGN.md` automatically propagate to build artifacts.
- **Zero Manual Drift**: Prevents developers from hardcoding hex colors, font sizes, or pixel spacing in CSS or component code.
- **Tailwind Integration**: `packages/ui/tailwind.config.js` maps Tailwind color/spacing/radius utilities directly to `var(--...)` custom properties output by the generator.

### Alternatives Considered
- *Manual CSS copy-pasting*: Rejected due to high risk of human error and violation of Constitution Principle VI.
- *Style Dictionary framework*: Rejected because a lightweight 60-line ES module parser script handles YAML frontmatter and CSS variable generation without adding third-party build dependencies.

---

## 2. Grade-Level Theming via Root Data Attribute (`data-jenjang`)

### Decision
Inject theme CSS variables via root DOM attribute selectors: `[data-jenjang="tk"]`, `[data-jenjang="sd"]`, `[data-jenjang="smp"]`, `[data-jenjang="sma"]` applied to `<html>` or `<body>`.

### Token Mapping Matrix

| Token Role | TK (Foundational) | SD (Elementary) | SMP (Junior High) | SMA (Senior High) |
|---|---|---|---|---|
| `--color-background` | `#FFF8FA` (Pastel Rose) | `#F8F9FF` (Azure Tint) | `#F5F3FF` (Deep Violet Tint) | `#0B121E` (Dark Slate) |
| `--color-surface` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | `#152238` (Dark Surface) |
| `--color-primary` | `#FF7EAC` (Soft Pink) | `#0058BE` (High Sat Azure) | `#00855B` (Emerald Teal) | `#00E699` (Neon Mint) |
| `--color-secondary` | `#FFB84D` (Soft Gold) | `#FEA619` (Playful Amber) | `#8B5CF6` (Royal Purple) | `#CCFF00` (Neon Lime) |
| `--font-heading` | Quicksand | Quicksand | Quicksand | Montserrat |
| `--font-body` | Inter | Inter | Inter | Inter |

### Rationale
- **Zero Component Branching**: Components consume standard CSS variables (e.g. `bg-primary`, `text-on-surface`). Theme changes swap token values at the root without re-rendering components or evaluating conditional JSX `if (jenjang === 'tk')`.
- **Performance**: Theme switching completes in <10ms via single DOM attribute update (`document.documentElement.setAttribute('data-jenjang', level)`).

### Alternatives Considered
- *Conditional Tailwind class branching*: Rejected by user instruction and Constitution Principle VI.

---

## 3. Font Loading via `next/font/google`

### Decision
Configure `Quicksand`, `Inter`, and `Montserrat` in `apps/web/app/layout.tsx` using `next/font/google` with CSS variable declarations:

```typescript
import { Quicksand, Inter, Montserrat } from 'next/font/google';

const quicksand = Quicksand({ subsets: ['latin'], variable: '--font-quicksand' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
```

### Rationale
- **Performance & Privacy**: Fonts are downloaded at build time, self-hosted by Next.js, and served with zero external network requests during runtime.
- **Grade-Level Override**: CSS variables dynamically map `--font-heading` to `--font-quicksand` by default, overriding to `--font-montserrat` under `[data-jenjang="sma"]`.

### Alternatives Considered
- *CDN `<link>` tags in HTML `<head>`*: Rejected by user instruction and privacy requirements.

---

## 4. Iconography via `lucide-react`

### Decision
Adopt `lucide-react` in `packages/ui` as the sole icon package. Provide typed icon components or wrapper primitives.

### Icon Mapping
- `Flame` / `Zap`: Gamification Streak Indicator
- `Trophy` / `Award`: Achievement Badges
- `BookOpen`, `Settings`, `Sparkles`: Sidebar navigation & CTA
- `Languages` / `Globe`: i18n Language Switcher
- `ChevronDown`, `Check`: Level Selector dropdown / state indicators

### Rationale
- **Tree-shakeable**: Only icons used in code are bundled.
- **Accessible & Styleable**: Accepts standard SVG props (`size`, `color`, `strokeWidth`, `aria-hidden`, `className`).

### Alternatives Considered
- *Material Symbols CDN*: Rejected by user prompt (no CDN font loading).

---

## 5. Lightweight Internal Component Catalog Route (`/catalog`)

### Decision
Build an internal page route at `apps/web/app/catalog/page.tsx` that renders all `packages/ui` components inside interactive tabbed panels and side-by-side grade-level grid previews.

### Rationale
- **Zero Heavy Tooling**: Eliminates Storybook build step and maintenance overhead while providing immediate visual and accessibility validation.
- **Real-World Runtime**: Components are tested directly inside the Next.js App Router runtime environment.

---

## 6. Self-Hosted Image Assets & Mascot Placeholders

### Decision
All mascot illustrations, badges, and avatar images reside in `apps/web/public/assets/` and `packages/ui/src/assets/`. SVG vector components are used for mascot speech bubble avatars.

### Rationale
- **Constitution Compliance**: Enforces Principle VI (no external image hotlinking, zero third-party domain dependencies).

# Implementation Plan: Design System dan App Shell AksiCendekia

**Branch**: `001-design-system-app-shell` | **Date**: 2026-08-27 | **Spec**: [specs/001-design-system-app-shell/spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/001-design-system-app-shell/spec.md)

**Input**: Feature specification from `/specs/001-design-system-app-shell/spec.md` and user technical prompt.

---

## Summary

Membangun fondasi visual dan arsitektur UI tunggal AksiCendekia menggunakan **Next.js App Router**, **TypeScript strict mode**, **Tailwind CSS (PostCSS)**, dan **shadcn/ui** pada monorepo **pnpm workspace** (`apps/web`, `packages/ui`, `packages/design-tokens`).

Seluruh 47 token warna M3, skala tipografi (7 kanon + 4 ekstensi), radius, dan spacing diekstrak dari `design/DESIGN.md` via skrip generator Node.js (`packages/design-tokens/scripts/generate-tokens.mjs`) sebagai CSS custom properties, kemudian di-consume oleh `tailwind.config.js` pada `packages/ui` dan `apps/web`. Arsitektur theming multi-jenjang dikendalikan via atribut root `data-jenjang="sd"` tanpa class conditional pada komponen. Tipografi dimuat via `next/font` (`Quicksand`, `Inter`, `Montserrat` untuk SMA/Professional). Seluruh ikon CDN diganti `lucide-react`, dan aset gambar di-host secara lokal. Halaman katalog komponen internal disediakan pada rute `/catalog` & `/design-system` di `apps/web`.

---

## Technical Context

- **Language/Version**: TypeScript 5.4+ (`"strict": true` di seluruh `tsconfig.json`).
- **Primary Dependencies**: Next.js 14+ (App Router, `next/font`), React 18, Tailwind CSS 3.4 (PostCSS), `lucide-react`, `@aksicendekia/design-tokens`.
- **Storage**: Non-persistent / Static data untuk sampel UI (Tanpa koneksi DB pada Feature 001).
- **Testing**: Vitest + `tsc --noEmit` typechecking.
- **Target Platform**: Desktop & Mobile Web Browsers (Responsive 375px & 1440px).
- **Project Type**: Monorepo Web Application (`pnpm` workspace: `apps/web`, `packages/ui`, `packages/design-tokens`).
- **Performance Goals**: 100% Static Prerendered Pages (`/catalog`, `/design-system`, `/`), Zero External CDN blocking scripts/fonts.
- **Constraints**: Kepatuhan WCAG 2.1 AA (touch target >= 44x44px, kontras >= 4.5:1, keyboard nav), UU No. 27/2022 Data Privacy, DILARANG CDN Tailwind / Google Fonts CDN / Storybook.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Pass** - **Pasal V (Frontend Stack)**: Next.js App Router + TypeScript strict + Tailwind CSS (PostCSS) + pnpm monorepo workspace (`apps/web`, `packages/ui`, `packages/design-tokens`). CDN Tailwind DILARANG.
- **Pass** - **Pasal VI (Design System Sumber Tunggal)**: Token visual berasal dari `packages/design-tokens` via `generate-tokens.mjs` yang membaca `design/DESIGN.md`. Anti-hardcoding hex/font. Multi-jenjang theme via CSS variables root `data-jenjang`. Local assets only.
- **Pass** - **Pasal VIII (i18n & Kurikulum)**: Default Bahasa Indonesia via dictionary `id.json`. 0% string Inggris hardcoded.
- **Pass** - **Pasal IX (Aksesibilitas)**: WCAG 2.1 AA, touch target 44x44px, keyboard navigation, kontras 4.5:1.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-design-system-app-shell/
├── spec.md              # Feature specification document
├── plan.md              # Implementation plan document
└── tasks.md             # Task breakdown document (Phase 2 output)
```

### Source Code (repository root)

```text
packages/
├── design-tokens/
│   ├── scripts/
│   │   └── generate-tokens.mjs    # Skrip ekstrak token dari design/DESIGN.md -> CSS/JSON
│   ├── src/
│   │   ├── tokens.css             # Auto-generated CSS Custom Properties & data-jenjang selectors
│   │   ├── tokens.json            # Auto-generated JSON tokens
│   │   └── index.ts               # Grade level metadata exports
│   ├── package.json
│   └── tsconfig.json
│
└── ui/
    ├── src/
    │   ├── components/
    │   │   ├── card.tsx           # InteractiveCard (Group A)
    │   │   ├── progress-bar.tsx   # ProgressBar pill gradient (Group A)
    │   │   ├── achievement-badge.tsx # AchievementBadge coin 4px gold border (Group A)
    │   │   ├── button.tsx         # ButtonPrimary 3D & GhostButton (Group A)
    │   │   ├── level-selector.tsx # LevelSelector TK/SD/SMP/SMA (Group A)
    │   │   ├── mascot-speech-bubble.tsx # MascotSpeechBubble (Group A)
    │   │   ├── forms/
    │   │   │   ├── TextInput.tsx  # Form Primitives (Group B)
    │   │   │   ├── PasswordInput.tsx # Toggle visibility (Group B)
    │   │   │   ├── Select.tsx     # Dropdown select (Group B)
    │   │   │   ├── Checkbox.tsx   # Touch target 44x44px (Group B)
    │   │   │   ├── RadioGroup.tsx # Accessible radio options (Group B)
    │   │   │   ├── FormField.tsx  # Label & Error wrapper (Group B)
    │   │   │   ├── Modal.tsx      # Dialog backdrop ESC focus trap (Group B)
    │   │   │   ├── Toast.tsx      # Auto-dismiss notification (Group B)
    │   │   │   └── Alert.tsx      # Banner alert box (Group B)
    │   │   ├── states/
    │   │   │   ├── SkeletonState.tsx # Pulse block animation (Universal State)
    │   │   │   ├── EmptyState.tsx    # Friendly illustration & CTA (Universal State)
    │   │   │   └── ErrorState.tsx    # Retry action button (Universal State)
    │   │   └── data/
    │   │       ├── DataTable.tsx     # Sort, pagination, 3-state support (Group C)
    │   │       ├── Tabs.tsx          # Accessible tablist, 3-state support (Group C)
    │   │       ├── DropdownMenu.tsx  # Action menu dividers, 3-state support (Group C)
    │   │       ├── StatCard.tsx      # Trend indicator, 3-state support (Group C)
    │   │       ├── ChartWrapper.tsx  # Visual container, 3-state support (Group C)
    │   │       └── FileDropzone.tsx  # Drag & drop upload, 3-state support (Group C)
    │   ├── shells/
    │   │   ├── StudentShell.tsx      # Student App Shell (sidebar, topbar, streak, pro CTA)
    │   │   └── ProfessionalShell.tsx # Professional App Shell (data-shell="professional", Inter font)
    │   ├── locales/
    │   │   ├── id.json               # 100% Bahasa Indonesia UI Dictionary
    │   │   └── en.json               # Secondary English Dictionary
    │   ├── providers/
    │   │   ├── theme-provider.tsx    # Root data-jenjang manager
    │   │   └── i18n-provider.tsx     # Locale translation manager
    │   └── index.ts                  # Public package exports
    ├── tailwind.config.js            # Consumer configuration for design tokens
    └── package.json

apps/
└── web/
    ├── app/
    │   ├── catalog/
    │   │   └── page.tsx              # Component Catalog Showcase Page
    │   ├── design-system/
    │   │   └── page.tsx              # Alias Route to Catalog
    │   ├── globals.css               # Imports @aksicendekia/design-tokens/tokens.css & Tailwind
    │   ├── layout.tsx                # Next.js Font loading (Quicksand, Inter, Montserrat)
    │   └── page.tsx                  # Home Landing Preview Page
    ├── tailwind.config.js
    └── package.json
```

**Structure Decision**: Menggunakan struktur monorepo pnpm workspace (`apps/web`, `packages/ui`, `packages/design-tokens`) sesuai perintah Konstitusi Pasal V & VI.

---

## Technical Approach & Key Architectural Decisions

1. **Skrip Generator Token**: Node.js script (`generate-tokens.mjs`) membaca YAML frontmatter dari `design/DESIGN.md` dan secara otomatis mengompilasi `tokens.css` dan `tokens.json`. `DESIGN.md` dijamin menjadi **Single Source of Truth**.
2. **Theming Multi-Jenjang via Atribut Root**: Ditetapkan via `data-jenjang="sd"` pada elemen root `<html>` / container. Token CSS Custom Property (`--color-primary`, `--color-background`, dll) ditukar tanpa menambahkan class conditional (`if (level === 'sd') ...`) di dalam komponen UI.
3. **Pemuatan Font via `next/font/google`**: Font `Quicksand`, `Inter`, dan `Montserrat` diinisialisasi dalam `apps/web/app/layout.tsx` menggunakan `next/font/google` dengan variabel CSS (`--font-quicksand`, `--font-inter`, `--font-montserrat`), sepenuhnya bebas dari link tag CDN external.
4. **Substitusi Ikon CDN**: Seluruh ikon Material Symbols CDN diganti menggunakan paket `lucide-react` (seperti `Award`, `Sparkles`, `Flame`, `ShieldCheck`, `Check`, `ChevronDown`, `X`, `Search`).
5. **Komponen React Baru dari Referensi Stitch**: File HTML Stitch (`code.html`) diperlakukan murni sebagai referensi visual dan ditulis ulang dari nol sebagai komponen React TypeScript yang modular dan type-safe.
6. **Aset Lokal**: Seluruh URL `lh3.googleusercontent.com` diganti dengan komponen placeholder SVG / Lucide Icon atau aset lokal dalam `public/`.
7. **Rute Katalog Internal**: Katalog komponen disajikan pada rute internal `apps/web/app/catalog/page.tsx` tanpa menambahkan dependensi Storybook.

---

## Complexity Tracking

> **Status**: Tidak ada pelanggaran Konstitusi. Seluruh keputusan arsitektur secara ketat mematuhi Konstitusi AksiCendekia v1.1.0 dan spesifikasi `001-design-system-app-shell`.

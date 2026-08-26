# Data Model & State Schema: Design System & App Shell

**Feature**: Design System & App Shell (`specs/001-design-system-app-shell`)
**Date**: 2026-08-26

## 1. Grade-Level Theme Context (`GradeLevel`)

Represents the active student education tier used to set the root `data-jenjang` attribute and drive design token swapping.

```typescript
export type GradeLevel = 'tk' | 'sd' | 'smp' | 'sma';

export interface GradeLevelMeta {
  id: GradeLevel;
  nameKey: string;            // e.g. 'theme.tk.name'
  subtitleKey: string;        // e.g. 'theme.tk.subtitle'
  iconName: string;           // Icon key for level selector tile
  accentColorToken: string;   // CSS variable reference
  headingFontFamily: string;  // Quicksand vs Montserrat
}
```

### Static Grade Level Metadata Registry

| ID | Name (id) | Subtitle (id) | Theme Characteristics | Heading Font |
|---|---|---|---|---|
| `tk` | Taman Kanak-Kanak | Paud & TK (Fase Foundation) | Soft Pastels, Low Anxiety | Quicksand |
| `sd` | Sekolah Dasar | SD (Fase A - C) | High-Saturation Primary Colors | Quicksand |
| `smp` | Sekolah Menengah Pertama | SMP (Fase D) | Jewel Tones (Teal & Purple) | Quicksand |
| `sma` | Sekolah Menengah Atas | SMA (Fase E - F) | High-Contrast Dark Mode & Neon Lime | Montserrat |

---

## 2. Component Primitive Contracts (`packages/ui`)

### Interactive Card Props (`CardProps`)
```typescript
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'container' | 'outline' | 'elevated';
  padding?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean; // Adds hover bounce & focus ring
  children: React.ReactNode;
}
```

### Progress Bar Props (`ProgressBarProps`)
```typescript
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;            // 0 - 100
  max?: number;            // default 100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}
```

### Achievement Badge Props (`BadgeProps`)
```typescript
export interface AchievementBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon: React.ReactNode;
  unlocked?: boolean;
  level?: 'bronze' | 'silver' | 'gold' | 'master';
  size?: 'sm' | 'md' | 'lg';
}
```

### Primary / Ghost Button Props (`ButtonProps`)
```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

### Mascot Speech Bubble Props (`SpeechBubbleProps`)
```typescript
export interface SpeechBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  speakerName?: string;
  message: string;
  avatarSrc?: string;
  pointerDirection?: 'left' | 'right' | 'top' | 'bottom';
}
```

### Level Selector Tile Props (`LevelSelectorProps`)
```typescript
export interface LevelSelectorTileProps {
  level: GradeLevel;
  selected: boolean;
  onSelect: (level: GradeLevel) => void;
}
```

---

## 3. App Shell Navigation & State (`packages/ui`)

```typescript
export interface NavigationItem {
  id: string;
  labelKey: string;
  href: string;
  iconName: string;
  badgeCount?: number;
}

export interface UserStreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // ISO Date String YYYY-MM-DD
  isStreakActiveToday: boolean;
}

export interface AppShellState {
  activeGradeLevel: GradeLevel;
  currentLanguage: 'id' | 'en';
  isMobileSidebarOpen: boolean;
  streak: UserStreakState;
}
```

---

## 4. Internationalization Dictionary Schema (`LocaleDictionary`)

```typescript
export interface LocaleDictionary {
  common: {
    appTitle: string;
    upgradeToPro: string;
    streakDays: string;
    language: string;
    selectGrade: string;
  };
  nav: {
    dashboard: string;
    achievements: string;
    settings: string;
    catalog: string;
  };
  components: {
    interactiveCard: string;
    progressBar: string;
    achievementBadge: string;
    primaryButton: string;
    ghostButton: string;
    levelSelector: string;
    mascotBubble: string;
  };
  themes: {
    tk: string;
    sd: string;
    smp: string;
    sma: string;
  };
}
```

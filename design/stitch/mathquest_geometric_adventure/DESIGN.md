---
name: MathQuest Geometric Adventure
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424754'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 64px
  container-max: 1200px
  gutter: 20px
---

## Brand & Style

The design system is built to bridge the gap between "play" and "learning." It treats mathematical concepts as a journey of discovery rather than a series of drills. The brand personality is **Energetic, Educational, Interactive, and Friendly**.

The aesthetic follows a **Modern Tactile** approach. It combines the cleanliness of Corporate/Modern design (for legibility and trust) with "squishy" tactile elements and vibrant color blocking. UI components use soft shadows and subtle gradients to feel like physical tiles or tokens that a student can interact with. The interface should feel bouncy and responsive to reinforce positive feedback loops.

## Colors

The color palette is functionally driven to denote progression and feedback. 
- **Primary (Bright Azure):** Used for main navigation, primary actions, and "neutral" mathematical information.
- **Secondary (Playful Amber):** Reserved for rewards, streaks, and "Level Up" moments.
- **Success (Emerald):** Used exclusively for correct answers and completed milestones.

**Level-Specific Contexts:**
The UI background or header accents should shift based on the student's grade level:
- **TK (Foundational):** Soft pastels to create a low-anxiety, welcoming environment.
- **SD (Elementary):** High-saturation primary colors to maintain high energy.
- **SMP (Junior High):** Sophisticated jewel tones (Teal/Purple) to feel "grown-up" but creative.
- **SMA (Senior High):** High-contrast "Dark Mode" aesthetic with neon lime accents for a technical, high-performance feel.

## Typography

This design system uses a dual-font strategy to balance friendliness with clarity.
- **Headlines (Quicksand):** The rounded terminals of Quicksand are used for all headers, titles, and score displays to maintain the "Friendly/Playful" brand pillar.
- **Body & Technical Data (Inter):** For actual math problems, explanations, and fine print, Inter provides the necessary precision and high legibility.

**Implementation Note:** For SMA (Senior High) levels, the system may swap `Quicksand` for `Montserrat` in headlines to provide a sharper, more professional tone while maintaining the geometric foundation.

## Layout & Spacing

The layout uses a **Fluid Grid** model with generous margins to keep the focus on the central learning content. 
- **Mobile:** 4-column grid with 16px margins. Content cards are usually full-width.
- **Tablet/Desktop:** 12-column grid. Math problems are centered in a max-width container (800px-1000px) to prevent eye strain.

Spacing follows an 8px rhythmic scale. Components like "Interactive Math Cards" use `md` (24px) padding to ensure hit targets are large and accessible for younger fingers.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Tactile Shadows**. 
- **Level 0 (Background):** Flat, slightly off-white or very light tinted grey.
- **Level 1 (Cards):** White background with a 1px soft border and a low-opacity "ambient" shadow (Color: Primary Tint, Blur: 8px, Offset-Y: 4px).
- **Level 2 (Interactive Elements):** Buttons and active cards use a "thick" bottom border (4px) in a darker shade of the element's color to simulate a physical push-button.

When a student selects an answer, the element should "depress" (shadow disappears, Y-offset moves down 2px) to provide immediate haptic-style visual feedback.

## Shapes

The shape language is consistently **Rounded**. 
- Standard buttons and cards use `0.5rem` (8px) corners.
- Achievement badges and level selectors use `rounded-xl` or full circles to feel like collectible coins.
- Progress bars must have fully rounded (pill-shaped) ends to avoid looking like "health bars" from violent games, keeping the vibe educational and safe.

## Components

### Interactive Math Cards
The core unit of the app. These cards house the math problem. They should have a minimum height to ensure white space. The background color of the card can subtly change based on the level (e.g., a faint pink glow for TK).

### Progress Bars
Double-layered bars. The background track is a low-opacity version of the Primary color. The "fill" uses a gradient from Primary to Success to show growth.

### Achievement Badges
Circular containers with a thick gold (`secondary`) border. They use an inner "sunburst" effect to draw attention to the central icon or mascot.

### Buttons
- **Primary Action:** Large, bold color with a "3D" bottom shadow.
- **Ghost Action:** Outline only, used for "Skip" or "Back" to reduce visual weight.

### Animated Mascot Placeholders
Mascots should be placed in the bottom-right of cards or the top-left of screens. They require a "speech bubble" container that uses the same `roundedness` as cards, but with a small triangular pointer.

### Level Selectors
Large, vertical or horizontal scrolling tiles. Each tile features a large number in the `display-lg` style and an icon representing the topic (e.g., an abacus for TK, a graph for SMA).
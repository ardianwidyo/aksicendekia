# Feature Specification: Design System & App Shell

**Feature Directory**: `specs/001-design-system-app-shell`
**Created**: 2026-08-26
**Status**: Draft
**Input**: User description: "/speckit.specify Design System dan App Shell AksiCendekia."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Level Theme & Component Showcase (Priority: P1)

As a designer, developer, or stakeholder, I want an internal component catalog page where I can view all core UI components across all 4 grade-level themes (TK, SD, SMP, SMA) simultaneously and switch active themes dynamically, so that I can verify visual consistency, tactile responsiveness, and token adherence without hardcoded styles.

**Why this priority**: Core foundation for the entire application interface. All future learning screens and features depend on these design tokens and unified component primitives.

**Independent Test**: Navigate to the internal component catalog route (`/catalog` or `/components`). Select each theme (TK, SD, SMP, SMA). Verify that all components (Cards, Progress Bars, Badges, Buttons, Level Selectors, Mascot Bubbles) re-render instantly using theme-specific design tokens with zero component duplication or visual degradation.

**Acceptance Scenarios**:

1. **Given** the component catalog page is loaded, **When** the user selects the "TK (Foundational)" theme, **Then** all UI elements update to soft pastel background hues and low-anxiety color tokens while maintaining Quicksand/Inter typography.
2. **Given** the component catalog page is loaded, **When** the user selects the "SD (Elementary)" theme, **Then** the interface updates to high-saturation primary color tokens.
3. **Given** the component catalog page is loaded, **When** the user selects the "SMP (Junior High)" theme, **Then** the interface updates to sophisticated jewel tones (teal and purple accents).
4. **Given** the component catalog page is loaded, **When** the user selects the "SMA (Senior High)" theme, **Then** the interface updates to a high-contrast dark mode aesthetic with neon lime accents.
5. **Given** any action button in the catalog, **When** the user clicks or presses the button, **Then** the button exhibits a tactile 3D depress effect (the 4px bottom border flattens, Y-offset moves down by 2px, and shadow decreases) with a touch target of at least 44x44px.

---

### User Story 2 - Responsive App Shell & Navigation (Priority: P2)

As a student or educator accessing AksiCendekia on mobile or desktop devices, I want a unified responsive App Shell featuring a persistent navigation bar, level switcher, streak indicator, language switcher, and main content area, so that I can navigate seamlessly across different screen sizes.

**Why this priority**: Essential container for framing all platform pages and providing global context (level context, language, user profile preview, streak).

**Independent Test**: Load the App Shell at 375px (mobile) and 1440px (desktop) viewport widths. Verify layout grid adaptation (4 columns / 16px margins on mobile vs 12 columns / 1200px max-container on desktop), sidebar navigation visibility/drawer behavior, and responsive top bar controls.

**Acceptance Scenarios**:

1. **Given** a desktop viewport (1440px width), **When** the App Shell renders, **Then** a persistent sidebar navigation displays the Grade-Level Selector (TK, SD, SMP, SMA), main navigation links (Pencapaian, Pengaturan), and "Tingkatkan ke Pro" CTA button, while main content is constrained to a 12-column grid within a 1200px max-width container.
2. **Given** a mobile viewport (375px width), **When** the App Shell renders, **Then** the layout switches to a 4-column grid with 16px side margins, and navigation controls collapse into an accessible mobile drawer/bottom bar.
3. **Given** the top bar in the App Shell, **When** the user clicks the grade-level selector in the sidebar, **Then** the active theme for the entire App Shell and content area switches to the selected grade-level theme dynamically.
4. **Given** the top bar in the App Shell, **When** the user views the header, **Then** the streak indicator displays current streak count with reward icon, and the language switcher toggle is visible and keyboard-accessible.

---

### User Story 3 - Internationalization (i18n) & Localized UI Strings (Priority: P3)

As a user, I want all UI strings in the App Shell and component primitives to be served through an i18n localization layer defaulted to Bahasa Indonesia with support for a secondary language (English), so that no text is hardcoded and the application is ready for multi-language support.

**Why this priority**: Ensures compliance with Constitution Principle VIII (mandatory i18n layer) and prepares the application for multi-lingual accessibility without refactoring component code later.

**Independent Test**: Toggle the language selector between Bahasa Indonesia (`id`) and English (`en`) in the top bar. Verify that all UI strings (navigation items, button labels, badge descriptions, level names, catalog section titles) update instantly from locale resource files without page reload.

**Acceptance Scenarios**:

1. **Given** the default application state, **When** any page or component loads, **Then** all visible strings are rendered in Bahasa Indonesia (`id`) sourced from i18n locale definitions.
2. **Given** the top bar language toggle, **When** the user selects "English", **Then** all App Shell and component catalog strings update dynamically to English (`en`).
3. **Given** any component in `packages/ui`, **When** inspecting the component source code, **Then** zero string literals exist directly inside component JSX; all text is referenced via i18n translation keys.

---

### Edge Cases

- **Rapid Level Switching**: What happens when a user switches grade levels rapidly (e.g. TK -> SMA -> SD in under 500ms)? The theme tokens must update atomically without flash of unstyled content (FOUC) or mismatched color states across components.
- **Font Fallback & Rendering**: How does the system handle slow font loading for Quicksand or Inter? System font fallbacks (`sans-serif`, `system-ui`) must maintain layout stability and contrast ratios while Google Fonts load.
- **Narrow Viewports (<360px)**: How does the App Shell handle ultra-small screen sizes? Touch targets must retain minimum 44x44px size, and grid layout must wrap cleanly without horizontal scrolling.
- **Keyboard Navigation & High Contrast Focus**: How do interactive components behave under keyboard-only navigation? All buttons, cards, selectors, and toggles must display a high-contrast focus ring compliant with WCAG 2.1 AA (min 4.5:1 contrast).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a centralized design token package (`packages/design-tokens`) derived from `design/DESIGN.md` containing Material Design 3 (M3) color tokens, Quicksand/Inter typography scale, border-radius scale (`sm`, `DEFAULT`, `md`, `lg`, `xl`, `full`), and 8px-based spacing scale (`xs: 4px`, `base: 8px`, `sm: 12px`, `md: 24px`, `lg: 48px`, `xl: 64px`, `container-max: 1200px`, `gutter: 20px`).
- **FR-002**: System MUST support 4 grade-level visual themes switchable at runtime via CSS variable token injection:
  - **TK (Foundational)**: Soft pastel hues, low-anxiety color scheme.
  - **SD (Elementary)**: High-saturation primary colors for high-energy playfulness.
  - **SMP (Junior High)**: Sophisticated jewel tones (teal and purple accents).
  - **SMA (Senior High)**: High-contrast dark mode aesthetic with neon lime accents.
- **FR-003**: System MUST implement themes strictly through CSS variable token replacement in `packages/design-tokens`, strictly forbidding component duplication or conditional component branching per grade level.
- **FR-004**: System MUST strictly prohibit hardcoded color hex values, font sizes, line heights, or spacing values within component files (`packages/ui` and `apps/web`). All styles MUST reference design tokens.
- **FR-005**: System MUST provide the following core component primitives in `packages/ui`:
  - **Interactive Card**: Surface container with minimum height, soft elevation shadow, 1px border, and subtle grade-level accent glow.
  - **Progress Bar**: Double-layered pill-shaped container (`rounded-full`) with primary-to-success gradient fill.
  - **Achievement Badge**: Circular container with gold (`secondary`) border, inner sunburst pattern, and collectible visual depth.
  - **Primary Button**: Tactile push-button with 4px bottom border in a darker shade that depresses (Y-offset +2px, shadow flattens) on active state, with minimum 44x44px touch target.
  - **Ghost Button**: Transparent outline-only button variant for secondary or skip actions with minimum 44x44px touch target.
  - **Level Selector**: Large selectable tiles displaying `display-lg` numbers and topic iconography.
  - **Mascot Speech Bubble**: Rounded container with triangular pointer matching card corner radius.
- **FR-006**: System MUST provide a responsive App Shell comprising:
  - **Sidebar**: Grade Level Selector (TK, SD, SMP, SMA), Navigation Links (Pencapaian, Pengaturan), and "Tingkatkan ke Pro" CTA button.
  - **Top Bar**: Language switcher control (ID/EN) and gamification Streak Indicator.
  - **Main Content Area**: Container for rendering page content.
- **FR-007**: System MUST enforce a fluid responsive layout grid:
  - Mobile (375px): 4-column layout with 16px side margins.
  - Desktop (1440px): 12-column layout with 1200px maximum container width.
- **FR-008**: System MUST implement an i18n translation layer defaulted to Bahasa Indonesia (`id`) with complete translations for all App Shell, navigation, level names, and component catalog text.
- **FR-009**: System MUST provide an internal Component Catalog page (`/catalog`) displaying all core components across all 4 grade-level themes for visual and accessibility verification.
- **FR-010**: All components MUST comply with WCAG 2.1 Level AA standards, enforcing a minimum 4.5:1 text contrast ratio, minimum 44x44px interactive touch targets, and full keyboard navigation.
- **FR-011**: All image assets and iconography MUST be self-hosted within the repository/application storage; third-party hotlinking is strictly prohibited.

### Key Entities

- **DesignTokenSet**: Represents the collection of M3 color roles, typography definitions, radius tokens, and spacing tokens for a specific grade level.
- **GradeLevelTheme**: Enum representing the active learning tier context (`TK`, `SD`, `SMP`, `SMA`).
- **LocaleDictionary**: Key-value collection of UI text strings structured for i18n translation (`id`, `en`).
- **NavigationItem**: Represents a sidebar navigation link with label key, icon token, and active state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of visual styling in components and App Shell consumes tokens from `packages/design-tokens`; zero hardcoded hex codes, inline font sizes, or arbitrary pixel margins exist in component files.
- **SC-002**: Grade-level theme switching between TK, SD, SMP, and SMA completes instantaneously (<50ms) across the entire application without page reloads or unstyled flashes.
- **SC-003**: 100% of interactive elements (buttons, cards, selectors, drawer toggles) meet or exceed the 44x44px minimum touch target size.
- **SC-004**: All text elements across all 4 grade-level themes pass WCAG 2.1 AA automated contrast checking with a ratio of at least 4.5:1 for normal text and 3.0:1 for large text.
- **SC-005**: 100% of user flows within the App Shell and Component Catalog can be completed using keyboard-only navigation (Tab, Shift+Tab, Enter, Space) with visible focus indicators.
- **SC-006**: App Shell renders cleanly without layout breaks or horizontal scrollbars at both 375px mobile viewport and 1440px desktop viewport.

## Assumptions

- **Static Mock Data**: Auth, live user data, backend integration, real lesson content, payment gateways, and quizzes are explicitly out of scope for this feature. Mock data structures will supply streak counts, user level, and navigation items.
- **Font Availability**: Google Fonts (`Quicksand` and `Inter`) will be loaded via webfont link or local self-hosted font packages in Next.js.
- **Monorepo Context**: The repository workspace structure follows `apps/web`, `apps/api`, `packages/ui`, and `packages/design-tokens` as specified in Constitution Principle V.

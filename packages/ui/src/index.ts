// Providers
export * from './providers/theme-provider';
export * from './providers/i18n-provider';

// Group A - Gamification
export * from './components/card';
export * from './components/progress-bar';
export * from './components/achievement-badge';
export * from './components/button';
export * from './components/badge';
export * from './components/mascot-speech-bubble';
export * from './components/level-selector';
export * from './components/tactile-option-button';

// Group B - Form Primitives & Feedback
export * from './components/forms/TextInput';
export * from './components/forms/PasswordInput';
export * from './components/forms/Select';
export * from './components/forms/Checkbox';
export * from './components/forms/RadioGroup';
export * from './components/forms/FormField';
export * from './components/forms/Modal';
export * from './components/forms/Toast';
export * from './components/forms/Alert';

// Universal States
export * from './components/states/SkeletonState';
export * from './components/states/EmptyState';
export * from './components/states/ErrorState';

// Group C - Data & CMS Components
export * from './components/data/DataTable';
export * from './components/data/Tabs';
export * from './components/data/DropdownMenu';
export * from './components/data/StatCard';
export * from './components/data/ChartWrapper';
export * from './components/data/FileDropzone';

// App Shells
export * from './shells/StudentShell';
export * from './shells/ProfessionalShell';
export * from './components/app-shell';

// Guest Mode Components (Feature 009)
export * from './components/guest/guest-header-banner';
export * from './components/guest/guest-profile-modal';
export * from './components/guest/guest-sync-modal';
export * from './components/guest/guest-reset-modal';
export * from './components/guest/guest-feature-gate';

// Interactive Lesson Content (Feature 010)
export * from './hooks/use-reduced-motion';
export * from './hooks/use-speech-synthesis';
export * from './components/a11y/ListenButton';
// T087 (SC-004/SC-006): the 7 widget components are deliberately NOT re-exported
// here. Each is a React.lazy() chunk behind registry.ts / InteractiveWidgetBlock;
// re-exporting the concrete component from this barrel would make it reachable via
// a synchronous import path too, which defeats webpack's code-splitting for it (a
// module reachable both statically and dynamically gets bundled into the static
// chunk). Import a specific widget directly from its file if you need it outside
// the registry (as the tests under components/interactive/__tests__ do).
export * from './components/interactive/registry';
export * from './components/lesson/LessonContentRenderer';
export * from './components/lesson/MediaFallback';
export * from './components/lesson/UnsupportedWidgetFallback';
export * from './components/lesson/blocks/RichTextBlock';
export * from './components/lesson/blocks/IllustrationBlock';
export * from './components/lesson/blocks/ConceptAnimationBlock';
export * from './components/lesson/blocks/VideoBlock';
export * from './components/lesson/blocks/EmbeddedVideoBlock';
export * from './components/lesson/blocks/InteractiveWidgetBlock';
export * from './components/question/DragDropGroupingQuestion';
export * from './components/question/NumberLinePlacementQuestion';
export * from './components/question/InteractiveFeedback';
export * from './components/interactive/usePlacementInput';
export * from './components/layout/ScrollableWide';
export * from './components/illustration/PlaceValueBlocks';
export * from './components/illustration/NumberLineStrip';
export * from './components/illustration/FractionShape';
export * from './components/illustration/ArrayGrid';
export * from './components/illustration/ShapeFigure';
export * from './components/illustration/BarChartMini';
export * from './components/illustration/ClockFace';
export * from './components/illustration/MoneyStack';
export * from './components/illustration/PatternRow';
export * from './components/illustration/MeasureRuler';

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
export * from './components/interactive/registry';
export * from './components/interactive/StepRevealExplainer';
export * from './components/interactive/ParameterExplorer';
export * from './components/interactive/NumberLineExplorer';
export * from './components/interactive/FractionBarBuilder';
export * from './components/interactive/ImageHotspot';
export * from './components/interactive/SortIntoGroups';
export * from './components/interactive/AnimatedWorkedExample';
export * from './components/lesson/LessonContentRenderer';
export * from './components/lesson/MediaFallback';
export * from './components/lesson/UnsupportedWidgetFallback';
export * from './components/lesson/blocks/RichTextBlock';
export * from './components/lesson/blocks/IllustrationBlock';
export * from './components/lesson/blocks/ConceptAnimationBlock';
export * from './components/lesson/blocks/VideoBlock';
export * from './components/lesson/blocks/InteractiveWidgetBlock';

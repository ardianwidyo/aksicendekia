import React from 'react';

export interface ScrollableWideProps {
  /** Accessible name for the scrollable region (e.g. the widget's title). */
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Feature 011 / FR-041 — the single component that satisfies "no page-level
 * horizontal scroll" for content that is naturally wide (a number line, a
 * data table, a wide diagram). It contains the overflow to its own box
 * instead of letting it escape to the page, which is the most common cause
 * of horizontal scroll at 320px (research.md R6).
 *
 * Deliberately renders nothing but this one wrapper — it must never reach
 * up and touch an ancestor's overflow, or the containment guarantee breaks.
 */
export const ScrollableWide: React.FC<ScrollableWideProps> = ({ label, children, className = '' }) => {
  return (
    <div role="region" aria-label={label} className={`overflow-x-auto ${className}`.trim()}>
      {children}
    </div>
  );
};

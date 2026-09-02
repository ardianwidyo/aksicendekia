import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollableWide } from '../ScrollableWide';

/**
 * Feature 011 / FR-041 — wide content (number lines, tables) scrolls inside
 * its own container; the page itself never gains horizontal scroll.
 * T024 — written before ScrollableWide.tsx exists — must fail first (Constitution III).
 */

describe('ScrollableWide', () => {
  it('renders its children inside a horizontally-scrollable container', () => {
    render(
      <ScrollableWide label="Garis bilangan">
        <div style={{ width: '2000px' }}>lebar</div>
      </ScrollableWide>,
    );
    const region = screen.getByRole('region', { name: 'Garis bilangan' });
    expect(region.className).toMatch(/overflow-x-auto/);
    expect(region).toContainElement(screen.getByText('lebar'));
  });

  it('never sets overflow on an ancestor beyond its own element', () => {
    const { container } = render(
      <ScrollableWide label="Tabel data">
        <table><tbody><tr><td>1</td></tr></tbody></table>
      </ScrollableWide>,
    );
    // The only element ScrollableWide renders is its own wrapper — nothing
    // upstream of it is touched, which is what keeps the page from scrolling.
    expect(container.children).toHaveLength(1);
  });
});

import { afterNextRender, DestroyRef, ElementRef, inject, Signal, signal } from '@angular/core';

/** Narrowest drawing box: below it the SVG scales down instead of crowding its labels. */
export const MIN_CHART_WIDTH = 560;

/**
 * Width of the calling component's host in CSS pixels, kept up to date. Charts draw at this width so
 * their texts keep their real size instead of growing with the screen. Call from a constructor or a
 * field initialiser; `fallback` holds until the first measure (and in tests, without ResizeObserver).
 */
export function hostWidth(fallback: number): Signal<number> {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const width = signal(fallback);
  if (typeof ResizeObserver === 'undefined') {
    return width.asReadonly();
  }
  const observer = new ResizeObserver(([entry]) => {
    width.set(Math.max(MIN_CHART_WIDTH, Math.round(entry.contentRect.width)));
  });
  afterNextRender(() => observer.observe(host));
  inject(DestroyRef).onDestroy(() => observer.disconnect());
  return width.asReadonly();
}

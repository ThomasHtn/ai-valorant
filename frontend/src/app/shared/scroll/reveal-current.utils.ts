/**
 * Scrolls a list so its current item (`aria-current="page"`) shows, without moving the page. The list
 * may run below the screen, so its visible part ends at the bottom of the window.
 */
export function revealCurrent(list: HTMLElement | null): void {
  const item = list?.querySelector('[aria-current="page"]');
  if (!list || !item) {
    return;
  }
  const box = list.getBoundingClientRect();
  const at = item.getBoundingClientRect();
  if (at.top < box.top || at.bottom > Math.min(box.bottom, window.innerHeight)) {
    list.scrollTop += at.top - box.top;
  }
}

/** A small proximity lift; event-driven, with no idle animation loop. */
export function initNavProximity(nav) {
  if (!nav) return;
  const items = [...nav.querySelectorAll('a, button')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0;
  let pointer;
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    items.forEach(item => item.style.removeProperty('--nav-near'));
  };
  nav.addEventListener('pointermove', event => {
    if (!fine.matches || reduced.matches || event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const bounds = nav.getBoundingClientRect();
      items.forEach(item => {
        // Layout offsets avoid feeding the animated transform back into distance.
        const left = bounds.left + item.offsetLeft;
        const top = bounds.top + item.offsetTop;
        const dx = Math.max(left - pointer.x, 0, pointer.x - left - item.offsetWidth);
        const dy = Math.max(top - pointer.y, 0, pointer.y - top - item.offsetHeight);
        const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / 34);
        item.style.setProperty('--nav-near', proximity.toFixed(3));
      });
    });
  }, { passive: true });
  nav.addEventListener('pointerleave', reset);
  nav.addEventListener('pointercancel', reset);
  window.addEventListener('blur', reset);
  reduced.addEventListener('change', reset);
  fine.addEventListener('change', reset);
}

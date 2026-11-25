(() => {
  const hero = document.querySelector('.story-panel');
  const background = document.querySelector('.story-background');
  if (!hero || !background) return;

  const mobile = window.matchMedia('(max-width: 767px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scheduled = false;

  function update() {
    scheduled = false;
    if (!mobile.matches || reducedMotion.matches) {
      background.style.transform = '';
      return;
    }

    const offset = Math.min(window.scrollY, hero.offsetHeight) * 0.12;
    background.style.transform = `translate3d(0, ${offset}px, 0)`;
  }

  function scheduleUpdate() {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  mobile.addEventListener('change', scheduleUpdate);
  reducedMotion.addEventListener('change', scheduleUpdate);
  update();
})();
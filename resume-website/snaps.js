/* ==========================================================
   Portrait photos
   One photo at a time. Every few seconds the next one cross-fades
   in (the fade itself is CSS). A click or tap shows the next photo,
   and then the visitor is in charge: it stops changing on its own.
   Automatic changes wait while the pointer is over the photo, while
   it's off screen or the tab is in the background, and are off for
   visitors who prefer reduced motion. Behind the welcome screen
   (gate.js) it waits until the visitor goes in.
   ========================================================== */
(function () {
  const portrait = document.querySelector('.portrait');
  if (!portrait) return;
  const snaps = Array.from(portrait.querySelectorAll('.snap'));
  const button = portrait.querySelector('.snap-next');
  if (snaps.length < 2 || !button) return;

  const root = document.documentElement;
  const moving = () => root.classList.contains('motion');
  const EVERY = 5500; // ms between changes
  const FIRST = 6000; // the first change waits for the page's entrance

  let current = Math.max(0, snaps.findIndex((s) => s.classList.contains('is-current')));
  let auto = true;
  let timer = null;
  let hovering = false;
  let inView = true;

  function show(i) {
    current = (i + snaps.length) % snaps.length;
    snaps.forEach((s, k) => {
      const on = k === current;
      s.classList.toggle('is-current', on);
      if (on) s.removeAttribute('aria-hidden');
      else s.setAttribute('aria-hidden', 'true');
    });
    // start loading the photo after this one, so it's ready in time
    const next = snaps[(current + 1) % snaps.length].querySelector('img');
    if (next && next.loading === 'lazy') next.loading = 'eager';
  }

  function schedule(wait) {
    clearTimeout(timer);
    if (auto && moving()) timer = setTimeout(tick, wait);
  }

  function tick() {
    const paused = hovering || !inView || document.hidden || portrait.contains(document.activeElement);
    if (!paused) show(current + 1);
    schedule(EVERY);
  }

  button.addEventListener('click', () => {
    auto = false;
    clearTimeout(timer);
    show(current + 1);
  });

  portrait.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
  portrait.addEventListener('pointerleave', () => { hovering = false; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
    }, { threshold: 0.4 }).observe(portrait);
  }

  show(current);
  const begin = () => schedule(FIRST);
  if (root.classList.contains('gate-on')) document.addEventListener('site:enter', begin, { once: true });
  else begin();
})();

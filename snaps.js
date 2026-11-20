/* ==========================================================
   Profile photo pile
   The snapshots at the top of the page lie in a small pile. Every few
   seconds the top one is pulled out and tucked in at the bottom,
   showing the next. Tapping or clicking the pile does the same, and
   then the visitor is in charge: it stops shuffling on its own.
   Automatic shuffling waits while the pointer is over the pile, while
   it's scrolled out of view or the tab is in the background, and is
   off when the device asks for reduced motion (tapping still works).
   ========================================================== */
(function () {
  const stack = document.querySelector('.snap-stack');
  if (!stack) return;
  const snaps = Array.from(stack.querySelectorAll('.snap'));
  const button = stack.querySelector('.snap-next');
  if (snaps.length < 2 || !button) return;

  const root = document.documentElement;
  const moving = () => root.classList.contains('motion');
  const EVERY = 5000;        // ms between automatic shuffles
  const FIRST = 6500;        // the first one waits for the page's entrance
  const PULL = 1100;         // ms for one shuffle

  let top = 0;
  let auto = true;
  let timer = null;
  let hovering = false;
  let inView = true;
  let running = null;        // the shuffle animation in progress

  // data-pos: 0 = on top, 1 and 2 = peeking out below, 3 = out of sight
  function layout() {
    snaps.forEach((snap, i) => {
      const pos = Math.min((i - top + snaps.length) % snaps.length, 3);
      snap.dataset.pos = String(pos);
      if (pos === 0) snap.removeAttribute('aria-hidden');
      else snap.setAttribute('aria-hidden', 'true');
    });
  }

  function shuffle() {
    if (running) running.finish();
    const leaving = snaps[top];
    top = (top + 1) % snaps.length;
    const arriving = snaps[top];

    if (!moving() || typeof leaving.animate !== 'function') { layout(); return; }

    // start from wherever the top photo is now (it may be lifted by hover)
    const now = getComputedStyle(leaving);
    const from = { rotate: now.rotate === 'none' ? '0deg' : now.rotate,
                   translate: now.translate === 'none' ? '0px 0px' : now.translate };

    leaving.classList.add('is-leaving');
    stack.classList.add('is-shuffling');
    layout();

    const end = getComputedStyle(leaving);
    const to = { rotate: end.rotate === 'none' ? '0deg' : end.rotate,
                 translate: end.translate === 'none' ? '0px 0px' : end.translate,
                 opacity: end.opacity };

    // pull it out to the side, then slide it back in under the pile
    running = leaving.animate([
      { rotate: from.rotate, translate: from.translate, opacity: 1, zIndex: 5 },
      { rotate: '13deg', translate: '70% -9%', opacity: 1, zIndex: 5, offset: .42 },
      { rotate: '11deg', translate: '62% -6%', zIndex: 0, offset: .5 },
      { opacity: 1, offset: .78 },
      { rotate: to.rotate, translate: to.translate, opacity: to.opacity, zIndex: 0 }
    ], { duration: PULL, easing: 'cubic-bezier(.45, 0, .25, 1)' });

    // the new photo's caption is written on again
    const label = arriving.querySelector('.photo-label');
    if (label) {
      label.animate([
        { clipPath: 'inset(-60% 100% -60% -20%)' },
        { clipPath: 'inset(-60% -20% -60% -20%)' }
      ], { duration: 800, delay: 650, easing: 'ease', fill: 'backwards' });
    }

    const done = running;
    const tidy = () => {
      leaving.classList.remove('is-leaving');
      if (running === done) {
        running = null;
        stack.classList.remove('is-shuffling');
      }
    };
    done.addEventListener('finish', tidy);
    done.addEventListener('cancel', tidy);
  }

  function schedule(wait) {
    clearTimeout(timer);
    if (auto && moving()) timer = setTimeout(tick, wait);
  }

  function tick() {
    const paused = hovering || !inView || document.hidden || stack.contains(document.activeElement);
    if (!paused) shuffle();
    schedule(EVERY);
  }

  button.addEventListener('click', () => {
    auto = false;
    clearTimeout(timer);
    shuffle();
  });

  stack.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
  stack.addEventListener('pointerleave', () => { hovering = false; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
    }, { threshold: 0.4 }).observe(stack);
  }

  layout();
  // let the photos underneath fan out only after the pile has landed
  setTimeout(() => stack.classList.add('is-ready'), 2600);
  schedule(FIRST);
})();

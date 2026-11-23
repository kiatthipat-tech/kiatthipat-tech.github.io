/* ==========================================================
   Welcome screen
   First-time visitors see a quiet title page before the site:
   "Hello. สวัสดี" and a choice of English or ภาษาไทย. Picking one
   sets the site's language and remembers it, so the welcome page
   isn't shown again on this device. The page then fades away while
   the site makes its entrance underneath. Esc picks the suggested
   language (the one this device uses).

   The script in <head> decides whether to show it (html.gate-on).
   If this file ever fails to load, the choices still work as plain
   links (?lang=en / ?lang=th).
   ========================================================== */
(function () {
  const root = document.documentElement;
  const gate = document.getElementById('welcome');
  if (!gate || !root.classList.contains('gate-on')) return;

  const choices = Array.from(gate.querySelectorAll('[data-choose]'));
  const calm = !root.classList.contains('motion');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // the language this device uses is marked "your device"
  const suggested = (navigator.language || '').toLowerCase().startsWith('th') ? 'th' : 'en';
  choices.forEach((c) => c.classList.toggle('is-suggested', c.dataset.choose === suggested));

  // the rest of the page can't be reached until the visitor goes in
  const behind = Array.from(document.body.children).filter((el) => el !== gate && el.tagName !== 'SCRIPT');
  behind.forEach((el) => { el.inert = true; });
  gate.focus({ preventScroll: true });

  // with a mouse, the photo leans a little as the pointer moves
  const drift = gate.querySelector('.gate-photo-drift');
  if (drift && !calm && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let frame = 0;
    let x = 0;
    let y = 0;
    gate.addEventListener('pointermove', (e) => {
      x = (0.5 - e.clientX / window.innerWidth) * 16;   // up to 8px each way
      y = (0.5 - e.clientY / window.innerHeight) * 12;  // up to 6px each way
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        drift.style.setProperty('--px', x.toFixed(1) + 'px');
        drift.style.setProperty('--py', y.toFixed(1) + 'px');
      });
    });
  }

  let leaving = false;

  async function enter(lang, picked) {
    if (leaving) return;
    leaving = true;

    // the site switches to that language (and remembers it) underneath
    document.dispatchEvent(new CustomEvent('site:choose-lang', { detail: { lang } }));
    const url = new URL(window.location.href);
    if (url.searchParams.has('welcome')) {
      url.searchParams.delete('welcome');
      history.replaceState(history.state, '', url);
    }

    if (!calm && typeof gate.animate === 'function') {
      // the chosen line stays lit, the other one dims
      if (picked) picked.classList.add('is-picked');
      choices.filter((c) => c !== picked).forEach((c) => {
        c.animate([{}, { opacity: 0.25 }], { duration: 300, easing: 'ease', fill: 'forwards' });
      });
      await wait(280);

      // the page fades up and away while the site makes its entrance
      document.dispatchEvent(new Event('site:enter'));
      const out = gate.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-18px)' }],
        { duration: 750, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' }
      );
      try { await out.finished; } catch (e) { /* cancelled: close anyway */ }
    } else {
      document.dispatchEvent(new Event('site:enter'));
    }
    close();
  }

  function close() {
    root.classList.remove('gate-on');
    gate.hidden = true;
    gate.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    behind.forEach((el) => { el.inert = false; });
    if (gate.contains(document.activeElement)) document.activeElement.blur();
  }

  choices.forEach((c) => {
    c.addEventListener('click', (e) => {
      e.preventDefault();
      enter(c.dataset.choose, c);
    });
  });

  gate.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    enter(suggested, choices.find((c) => c.dataset.choose === suggested));
  });
})();

/* ==========================================================
   English / Thai switch
   - All visible text is in the page twice (data-l="en" / "th");
     CSS shows the language set on <html data-lang>.
   - Attributes that can't hold two languages (image descriptions,
     photo captions, button labels, download links) keep their Thai
     version in data-th-* and are swapped here.
   - The choice is remembered on this device and added to the URL
     as ?lang=th, so a Thai link can be shared.
   - Switching plays a short "translation" sequence: a yellow ink
     sheet bursts out of the button with the greeting written on it,
     the language changes underneath, the sheet lifts away and the
     new text rises into place while pen strokes are redrawn.
     Visitors who prefer reduced motion get an instant switch.
   The starting language is set in <head> before the page paints.
   ========================================================== */
(function () {
  const root = document.documentElement;
  const buttons = Array.from(document.querySelectorAll('[data-set-lang]'));
  const description = document.querySelector('meta[name="description"]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'cubic-bezier(.16, 1, .3, 1)';
  const EASE_IN_OUT = 'cubic-bezier(.7, 0, .2, 1)';

  const META = {
    en: {
      title: document.title,
      description: description ? description.content : '',
      announce: 'Switched to English',
    },
    th: {
      title: 'Kiatthipat Mengsan — ภาษาไทย–อังกฤษ และงานบริการลูกค้า',
      description: 'Kiatthipat Mengsan — งานแปลไทย–อังกฤษ ล่าม ติวเตอร์ภาษาอังกฤษ และงานบริการลูกค้าระดับนานาชาติ ประกาศนียบัตรบัณฑิตสาขาภาษาอังกฤษ มหาวิทยาลัยลิเวอร์พูล',
      announce: 'เปลี่ยนเป็นภาษาไทยแล้ว',
    },
  };

  /* ---------- Swapping the text ---------- */
  // [name used in data-th-*, attribute it fills]
  const ATTRS = [
    ['alt', 'alt'],
    ['aria-label', 'aria-label'],
    ['caption', 'data-caption'],
    ['href', 'href'],
    ['download', 'download'],
  ];
  const translatable = Array.from(document.querySelectorAll(ATTRS.map(([k]) => `[data-th-${k}]`).join(',')));

  // Remember the English values once, so we can switch back.
  translatable.forEach((el) => {
    ATTRS.forEach(([k, attr]) => {
      if (el.hasAttribute(`data-th-${k}`)) el.setAttribute(`data-en-${k}`, el.getAttribute(attr) || '');
    });
  });

  function apply(lang, remember) {
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    document.title = META[lang].title;
    if (description) description.content = META[lang].description;

    translatable.forEach((el) => {
      ATTRS.forEach(([k, attr]) => {
        const value = el.getAttribute(`data-${lang}-${k}`);
        if (value !== null) el.setAttribute(attr, value);
      });
    });

    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));

    if (remember) {
      try { localStorage.setItem('lang', lang); } catch (e) { /* private mode: just don't remember */ }
      const url = new URL(window.location.href);
      if (lang === 'th') url.searchParams.set('lang', 'th');
      else url.searchParams.delete('lang');
      history.replaceState(history.state, '', url);
    }
  }

  apply(root.getAttribute('data-lang') === 'th' ? 'th' : 'en', false);

  /* ---------- Screen-reader announcement ---------- */
  const live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);
  const announce = (lang) => { live.textContent = META[lang].announce; };

  // Let other parts of the page react (the sticky note jumps to that greeting).
  const tell = (lang) => document.dispatchEvent(new CustomEvent('site:lang', { detail: { lang } }));

  /* ---------- The ink sheet ---------- */
  const sweep = document.createElement('div');
  sweep.className = 'lang-sweep';
  sweep.setAttribute('aria-hidden', 'true');
  sweep.innerHTML =
    '<p class="lang-sweep-word"></p>' +
    '<svg class="lang-sweep-line" viewBox="0 0 200 20" preserveAspectRatio="none" focusable="false">' +
    '<path d="M 4 13 C 42 5, 84 18, 122 10 S 178 6, 196 12" pathLength="1"/></svg>' +
    '<p class="lang-sweep-sub"></p>';
  document.body.appendChild(sweep);
  const sweepWord = sweep.querySelector('.lang-sweep-word');
  const sweepSub = sweep.querySelector('.lang-sweep-sub');
  const sweepLine = sweep.querySelector('.lang-sweep-line path');

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const inView = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  };
  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // reflow so the animation plays again
    el.classList.add(cls);
  }

  /* ---------- New text rises in, strokes are redrawn ---------- */
  function playIn(lang) {
    // the text boxes on screen, top to bottom
    const boxes = new Set();
    document.querySelectorAll(`[data-l="${lang}"]`).forEach((span) => {
      if (inView(span)) boxes.add(span.parentElement);
    });
    const ordered = Array.from(boxes).sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (ra.top - rb.top) || (ra.left - rb.left);
    });

    ordered.forEach((el, i) => {
      const delay = 80 + Math.min(i, 16) * 45;
      if (el.classList.contains('note')) {
        // handwritten notes are written out again
        el.animate(
          [{ clipPath: 'inset(-60% 100% -60% -20%)' }, { clipPath: 'inset(-60% -20% -60% -20%)' }],
          { duration: 900, delay: delay + 350, easing: 'ease', fill: 'backwards' }
        );
      } else {
        // like subtitles changing: rise out of a blur
        el.animate(
          [
            { opacity: 0, translate: '0 .75em', filter: 'blur(6px)' },
            { opacity: 1, translate: '0 0', filter: 'blur(0)' },
          ],
          { duration: 700, delay, easing: EASE, fill: 'backwards' }
        );
      }
    });

    // pen underlines, circles and arrows on screen are drawn again
    document.querySelectorAll('.scribble path').forEach((path) => {
      if (path.closest('.lang-chips') || !inView(path)) return;
      path.animate(
        [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
        { duration: 950, delay: 450, easing: EASE, fill: 'backwards' }
      );
    });

    // and the highlighter sweeps across again
    document.querySelectorAll(`[data-l="${lang}"] strong:not(.circled)`).forEach((mark) => {
      if (!inView(mark)) return;
      mark.animate(
        [{ backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%' }],
        { duration: 900, delay: 600, easing: EASE, fill: 'backwards' }
      );
    });
  }

  /* ---------- The switch ---------- */
  let busy = false;

  async function switchTo(lang, button) {
    if (busy || root.getAttribute('data-lang') === lang) return;
    busy = true;
    restart(button, 'is-popping');

    const animated = root.classList.contains('motion') && !reduceMotion.matches && typeof sweep.animate === 'function';
    if (!animated) {
      apply(lang, true);
      tell(lang);
      announce(lang);
      busy = false;
      return;
    }

    // 1. the sheet bursts out of the button that was clicked
    const r = button.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    sweepWord.textContent = lang === 'th' ? 'สวัสดี!' : 'Hello!';
    sweepWord.lang = lang;
    sweepSub.textContent = lang === 'th' ? 'EN  →  ไทย' : 'ไทย  →  EN';
    sweep.classList.add('is-active');

    const cover = sweep.animate(
      [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${radius}px at ${x}px ${y}px)` }],
      { duration: 560, easing: EASE_IN_OUT, fill: 'forwards' }
    );
    // the greeting is written on, then underlined. The clip leaves plenty of
    // room around the word (tall strokes like "!" and Thai tone marks reach
    // well outside the text box) and is dropped once the word is written.
    sweepWord.animate(
      [{ clipPath: 'inset(-60% 100% -60% -20%)' }, { clipPath: 'inset(-60% -20% -60% -20%)' }],
      { duration: 650, delay: 220, easing: 'ease-out', fill: 'backwards' }
    );
    sweepLine.animate(
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: 500, delay: 560, easing: EASE, fill: 'both' }
    );
    sweepSub.animate(
      [{ opacity: 0, translate: '0 8px' }, { opacity: .75, translate: '0 0' }],
      { duration: 400, delay: 450, easing: EASE, fill: 'both' }
    );
    await cover.finished;

    // 2. the language changes underneath
    apply(lang, true);
    await wait(420);

    // 3. the sheet lifts away on a tilted edge and the new text rises in
    const lift = sweep.animate(
      [
        { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
        { clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 75%)', offset: 0.45 },
        { clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' },
      ],
      { duration: 640, easing: EASE_IN_OUT, fill: 'forwards' }
    );
    playIn(lang);
    tell(lang);
    await lift.finished;

    sweep.classList.remove('is-active');
    sweep.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    announce(lang);
    busy = false;
  }

  buttons.forEach((b) => {
    b.addEventListener('click', () => switchTo(b.dataset.setLang, b));
  });
})();

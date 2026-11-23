/* ==========================================================
   English / Thai switch
   - All visible text is in the page twice (data-l="en" / "th");
     CSS shows the language set on <html data-lang>.
   - Attributes that can't hold two languages (image descriptions,
     photo captions, button labels, download links) keep their Thai
     version in data-th-* and are swapped here.
   - The choice is remembered on this device and added to the URL
     as ?lang=th, so a Thai link can be shared.
   - Switching brings the other language into focus: the words blur
     out and the new ones sharpen (see refocus below). Visitors who
     prefer reduced motion get an instant switch.
   The starting language is set in <head> before the page paints.
   ========================================================== */
(function () {
  const root = document.documentElement;
  const buttons = Array.from(document.querySelectorAll('[data-set-lang]'));
  const description = document.querySelector('meta[name="description"]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const META = {
    en: {
      title: document.title,
      description: description ? description.content : '',
      announce: 'Switched to English',
    },
    th: {
      title: 'เกียรติภัทร์ เม่งซ่าน (Kiatthipat Mengsan) — ภาษาไทย–อังกฤษ และงานบริการลูกค้า',
      description: 'เกียรติภัทร์ เม่งซ่าน (Kiatthipat Mengsan) — งานแปลไทย–อังกฤษ ล่าม ติวเตอร์ภาษาอังกฤษ และงานบริการลูกค้าระดับนานาชาติ ประกาศนียบัตรบัณฑิตสาขาภาษาอังกฤษ มหาวิทยาลัยลิเวอร์พูล',
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

  // Let other parts of the page react (the greeting in the hero follows).
  const tell = (lang) => document.dispatchEvent(new CustomEvent('site:lang', { detail: { lang } }));

  /* ---------- The switch: the words come into focus in the other language ----------
     Only what changes moves. The words on screen blur away, the page
     swaps, and the new words sharpen from the top of the screen down.
     Photos and blocks that the new text nudges glide to their new place
     instead of jumping, and the part of the page being read stays put. */
  const EASE = 'cubic-bezier(.2, .7, 0, 1)';
  // pictures that glide to their new place (each one moves on its own)
  const MEDIA = '.hero-media, .marquee, .photo-frame, .app-demo, .entry-logo';
  // the lines of the page that can hold your place while you read
  const ANCHORS = '.hero, .marquee, .entry-head, .entry-points > li, .prose > p, .gallery, .app-demo, .skill-group, .facts > div, .contact-block, .site-footer';
  const NAV_ROOM = 80; // px under the sticky menu bar

  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  };
  const wordsOnScreen = (lang) => Array.from(document.querySelectorAll(`[data-l="${lang}"]`)).filter(onScreen);
  const settle = (anims) => Promise.all(anims.map((a) => a.finished.catch(() => {})));

  async function refocus(lang, change) {
    // 1. the words on screen blur away
    const leaving = wordsOnScreen(root.getAttribute('data-lang'));
    await settle(leaving.map((el) => el.animate(
      [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(4px)' }],
      { duration: 160, easing: 'ease-in', fill: 'forwards' }
    )));

    // 2. swap, keeping the line at the top of the screen where it was
    const media = Array.from(document.querySelectorAll(MEDIA)).filter(onScreen);
    const before = new Map(media.map((el) => [el, el.getBoundingClientRect().top]));
    const anchor = window.scrollY > 0
      ? Array.from(document.querySelectorAll(ANCHORS)).find((el) => onScreen(el) && el.getBoundingClientRect().bottom > NAV_ROOM)
      : null;
    const anchorTop = anchor ? anchor.getBoundingClientRect().top : 0;
    change();
    leaving.forEach((el) => el.getAnimations().forEach((a) => a.cancel())); // hidden now
    if (anchor) {
      const drift = anchor.getBoundingClientRect().top - anchorTop;
      if (Math.abs(drift) >= 1) window.scrollTo({ top: window.scrollY + drift, behavior: 'instant' });
    }

    // 3. pictures glide into place; the new words sharpen, top first
    const glides = media.map((el) => {
      const dy = before.get(el) - el.getBoundingClientRect().top;
      return Math.abs(dy) < 1 ? null : el.animate(
        [{ transform: `translateY(${dy.toFixed(1)}px)` }, { transform: 'none' }],
        { duration: 520, easing: EASE }
      );
    }).filter(Boolean);
    const h = window.innerHeight;
    const arriving = wordsOnScreen(lang).map((el) => el.animate(
      [{ opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0)' }],
      {
        duration: 420,
        delay: Math.min(1, Math.max(0, el.getBoundingClientRect().top / h)) * 140,
        easing: EASE,
        fill: 'backwards',
      }
    ));
    await settle(glides.concat(arriving));
  }

  let busy = false;

  async function switchTo(lang) {
    if (busy || root.getAttribute('data-lang') === lang) return;
    busy = true;
    const change = () => { apply(lang, true); tell(lang); };
    const animated = root.classList.contains('motion') && !reduceMotion.matches
      && typeof document.body.animate === 'function';

    try {
      if (animated) await refocus(lang, change);
      else change();
    } catch (e) {
      // an interrupted switch must never leave the old language showing
      if (root.getAttribute('data-lang') !== lang) change();
      document.querySelectorAll('[data-l]').forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    }

    announce(lang);
    busy = false;
  }

  buttons.forEach((b) => {
    b.addEventListener('click', () => switchTo(b.dataset.setLang));
  });

  // The welcome screen (gate.js) sets the language without a fade:
  // it has its own exit, and the site makes its entrance afterwards.
  document.addEventListener('site:choose-lang', (e) => {
    const lang = e.detail && e.detail.lang === 'th' ? 'th' : 'en';
    apply(lang, true);
    tell(lang);
    announce(lang);
  });
})();

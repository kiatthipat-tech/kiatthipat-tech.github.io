/* ==========================================================
   Motion
   - nav: a hairline appears under the bar once you scroll, the
     section you're reading is underlined, and a thin line at the
     very top shows how far down the page you are
   - hero: the name rises letter by letter (English or Thai), the
     rest fades up, the portrait is unveiled and then drifts a
     little slower than the page; "Email me" leans towards the mouse
   - the greeting beside the languages changes every few seconds:
     Hello / สวัสดี / Hola
   - sections: titles rise out of a mask, the rule above them draws
     itself, the About lead lights up word by word as you read, job
     points arrive one by one, photos are unveiled from the top
   Visitors who prefer reduced motion see everything at once.
   ========================================================== */
(function () {
  window.__motionReady = true;

  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const lang = () => (root.getAttribute('data-lang') === 'th' ? 'th' : 'en');

  /* ---------- Nav: hairline after scrolling, current section ---------- */
  const nav = $('.nav');
  const links = $$('.nav-links a');
  const targets = links.map((a) => document.querySelector(a.getAttribute('href')));
  let ticking = false;
  function updateNav() {
    ticking = false;
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
    const line = window.innerHeight * 0.35;
    let active = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= line) active = i; });
    links.forEach((a, i) => {
      const on = i === active;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateNav); }
  }, { passive: true });
  updateNav();

  /* ---------- Greeting: Hello / สวัสดี / Hola ---------- */
  const greet = $('.greet');
  const chips = $$('.lang-chips li');
  const greetings = [
    { text: 'Hello', code: 'en', chip: 'EN' },
    { text: 'สวัสดี', code: 'th', chip: 'TH' },
    { text: 'Hola', code: 'es', chip: 'ES' },
  ];
  let greetIndex = 0;
  let greetTimer = null;
  function showGreeting(i, animate) {
    if (!greet) return;
    greetIndex = i;
    greet.textContent = greetings[i].text;
    greet.lang = greetings[i].code;
    if (animate) {
      greet.classList.remove('is-swapping');
      void greet.offsetWidth; // restart the fade
      greet.classList.add('is-swapping');
    }
    chips.forEach((c) => c.classList.toggle('is-active', c.dataset.lang === greetings[i].chip));
  }
  function startGreeting() {
    if (!greet || reduce) return;
    clearInterval(greetTimer);
    greetTimer = setInterval(() => {
      if (!document.hidden) showGreeting((greetIndex + 1) % greetings.length, true);
    }, 3600);
  }
  showGreeting(lang() === 'th' ? 1 : 0, false);

  if (reduce) {
    document.addEventListener('site:lang', (e) => {
      const i = greetings.findIndex((g) => g.code === e.detail.lang);
      if (i >= 0) showGreeting(i, false);
    });
    return;
  }
  root.classList.add('motion');

  /* ---------- Splitting text into letters and words ---------- */
  // Thai letters carry vowel and tone marks, so split into whole
  // characters (graphemes), never into loose marks.
  const graphemes = (text, code) => {
    if (window.Intl && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter(code, { granularity: 'grapheme' }).segment(text), (s) => s.segment);
    }
    return code === 'th' ? [text] : Array.from(text);
  };
  const words = (text, code) => {
    if (code === 'th' && window.Intl && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter('th', { granularity: 'word' }).segment(text), (s) => s.segment);
    }
    return text.split(/(\s+)/);
  };
  function letters(el, code, start = 0) {
    const text = el.textContent;
    el.textContent = '';
    let i = start;
    graphemes(text, code).forEach((g) => {
      if (/^\s+$/.test(g)) { el.appendChild(document.createTextNode(g)); return; }
      const c = document.createElement('span');
      c.className = 'ch';
      c.textContent = g;
      c.style.setProperty('--i', String(i));
      el.appendChild(c);
      i += 1;
    });
    return i;
  }

  // the name: each language's version letter by letter; screen readers
  // get the whole name from a hidden copy
  const heroName = $('.hero-name');
  if (heroName) {
    $$('[data-l]', heroName).forEach((version) => {
      const code = version.getAttribute('data-l');
      const copy = document.createElement('span');
      copy.className = 'sr-only';
      copy.textContent = version.textContent.replace(/\s+/g, ' ').trim();
      let i = 0;
      $$('.line > span', version).forEach((part) => {
        part.setAttribute('aria-hidden', 'true');
        i = letters(part, code, i);
      });
      version.prepend(copy);
    });
    heroName.classList.add('is-split');
  }

  // the email address, letter by letter (the link keeps its full name)
  const email = $('.contact-email');
  if (email) {
    email.setAttribute('aria-label', email.textContent.trim());
    letters(email, 'en');
  }

  // the About lead, word by word
  const lead = $$('.prose p:first-child [data-l]').map((version) => {
    const code = version.getAttribute('data-l');
    const text = version.textContent;
    version.textContent = '';
    const list = [];
    words(text, code).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { version.appendChild(document.createTextNode(part)); return; }
      const w = document.createElement('span');
      w.className = 'w';
      w.textContent = part;
      version.appendChild(w);
      list.push(w);
    });
    return { version, list };
  });
  function lightLead() {
    const vh = window.innerHeight;
    lead.forEach(({ version, list }) => {
      if (!version.offsetParent) return; // the other language
      const r = version.getBoundingClientRect();
      // from when it comes up from the bottom until it's well up the screen
      const p = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (vh * 0.3 + r.height)));
      const lit = Math.round(p * list.length);
      list.forEach((w, k) => w.classList.toggle('is-lit', k < lit));
    });
  }

  /* ---------- Scroll: progress line, drifting photo, the lead ---------- */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  const heroMedia = $('.hero-media');

  let scrolling = false;
  function onScroll() {
    scrolling = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    if (heroMedia) {
      // only when the photo sits beside the name (not under it), and never far
      const beside = window.innerWidth > 992;
      const drift = beside ? Math.min(window.scrollY * 0.08, 56) : 0;
      heroMedia.style.translate = drift ? `0 ${drift.toFixed(1)}px` : '';
    }
    lightLead();
  }
  window.addEventListener('scroll', () => {
    if (!scrolling) { scrolling = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  // when the language changes: the greeting follows, the lead re-measures
  document.addEventListener('site:lang', (e) => {
    const i = greetings.findIndex((g) => g.code === e.detail.lang);
    if (i >= 0) { showGreeting(i, true); startGreeting(); }
    requestAnimationFrame(lightLead);
  });

  /* ---------- The moving band can be paused (and played again) ----------
     The choice is remembered on this device. With reduced motion the band
     never moves, so the button stays hidden (this file stops earlier). */
  const band = $('.marquee-band');
  const bandButton = band && band.querySelector('.marquee-toggle');
  if (bandButton) {
    const setPaused = (paused) => {
      band.classList.toggle('is-paused', paused);
      bandButton.setAttribute('aria-pressed', String(paused));
    };
    let saved = null;
    try { saved = localStorage.getItem('marquee'); } catch (e) { /* private mode */ }
    setPaused(saved === 'paused');
    bandButton.hidden = false;
    bandButton.addEventListener('click', () => {
      const paused = bandButton.getAttribute('aria-pressed') !== 'true';
      setPaused(paused);
      try { localStorage.setItem('marquee', paused ? 'paused' : 'playing'); } catch (e) { /* private mode */ }
    });
  }

  /* ---------- Mouse: the button leans in ---------- */
  if (fine) {
    $$('.btn').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        b.style.translate = `${(x * 0.25).toFixed(1)}px ${(y * 0.35).toFixed(1)}px`;
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }

  /* ---------- Fade up as things come into view ----------
     (the hidden starting state is in CSS, so nothing flashes) */
  const revealEls = $$('.prose > p, .entry, .skill-group, .facts > div, .section-title, .contact-block');
  const io = new IntersectionObserver((entries) => {
    const batch = entries
      .filter((e) => e.isIntersecting)
      .map((e) => e.target)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    batch.forEach((el, i) => {
      el.style.setProperty('--rd', `${Math.min(i, 5) * 90}ms`);
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  revealEls.forEach((el) => {
    // once revealed, hand the element back to its normal transitions
    el.addEventListener('transitionend', (e) => {
      if (e.target === el && e.propertyName === 'transform') el.classList.add('is-done');
    });
  });

  // sections: the rule above each one draws itself as it arrives
  const sectionIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      sectionIo.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

  // key facts: the highlighter is drawn once the phrase is well into view
  const hlIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-lit');
      hlIo.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -22% 0px', threshold: 1 });

  /* ---------- Start once fonts are in, so the name doesn't jump ---------- */
  function start() {
    root.classList.add('is-loaded');
    setTimeout(() => {
      revealEls.forEach((el) => io.observe(el));
      $$('.section').forEach((el) => sectionIo.observe(el));
      $$('.hl').forEach((el) => hlIo.observe(el));
    }, 250);
    setTimeout(startGreeting, 2600);
    // after the entrance, letters of the name lift under the mouse
    setTimeout(() => { if (heroName) heroName.classList.add('is-ready'); }, 2400);
    onScroll();
  }
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const fontsIn = Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]);
  // While the welcome screen is up (gate.js), the entrance waits until the visitor goes in.
  const entered = root.classList.contains('gate-on')
    ? new Promise((r) => document.addEventListener('site:enter', r, { once: true }))
    : Promise.resolve();
  Promise.all([fontsIn, entered])
    .then(() => requestAnimationFrame(() => requestAnimationFrame(start)));
})();

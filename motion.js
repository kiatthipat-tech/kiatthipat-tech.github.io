/* ==========================================================
   Motion & hand-drawn touches
   - pen strokes: underlines under headings, a circle around the
     award, arrows on the handwritten notes. Each one is drawn with
     a slightly different wobble, like a real pen.
   - hero: the name rises letter by letter, the sticky note is
     slapped on, the note "that's me" is written in
   - sticky note: Hello / สวัสดี / Hola are written on in turn and
     the language being shown gets circled
   - scroll reveals for entries, notes, highlights and snapshots
   - nav: a squiggle marks the section you're reading
   Visitors who prefer reduced motion get every stroke drawn and
   still, with no animation.
   ========================================================== */
(function () {
  window.__motionReady = true;

  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- Pen strokes ---------- */
  // Deterministic wobble: every stroke differs, but the same on every visit.
  let seed = 11;
  const rand = (min, max) => {
    seed = (seed * 9301 + 49297) % 233280;
    return min + (seed / 233280) * (max - min);
  };
  const n = (v) => v.toFixed(1);

  function stroke(cls, viewBox, d, stretch = true) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'scribble ' + cls);
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('preserveAspectRatio', stretch ? 'none' : 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('pathLength', '1');
    svg.appendChild(path);
    return svg;
  }

  // A quick, slightly uneven underline (viewBox 100 × 12).
  function underlinePath() {
    const y = () => n(rand(4, 8));
    return `M ${n(rand(0, 3))} ${y()} C ${n(rand(18, 30))} ${y()}, ${n(rand(40, 55))} ${y()}, ${n(rand(60, 70))} ${y()} ` +
           `S ${n(rand(86, 93))} ${y()}, ${n(rand(97, 100))} ${y()}`;
  }

  // A loop drawn in one stroke that overshoots its start (viewBox 200 × 62).
  function circlePath() {
    const j = (v, a) => n(v + rand(-a, a));
    return `M ${j(28, 3)} ${j(8, 2)} ` +
           `C ${j(80, 6)} ${j(1, 1)}, ${j(188, 4)} ${j(5, 2)}, ${j(196, 2)} ${j(30, 3)} ` +
           `C ${j(200, 2)} ${j(53, 3)}, ${j(112, 8)} ${j(61, 1)}, ${j(52, 6)} ${j(57, 2)} ` +
           `C ${j(6, 3)} ${j(53, 3)}, ${j(0, 1)} ${j(28, 3)}, ${j(20, 4)} ${j(12, 2)} ` +
           `C ${j(48, 4)} ${j(2, 1)}, ${j(92, 6)} ${j(2, 1)}, ${j(124, 6)} ${j(4, 1)}`;
  }

  // Little arrows for the handwritten notes (viewBox 40 × 40).
  const ARROWS = {
    'up-left': 'M 34 35 C 30 22, 20 12, 8 7 M 8 7 L 10 17 M 8 7 L 18 7',
    up: 'M 22 37 C 27 25, 14 17, 19 5 M 19 5 L 12 12 M 19 5 L 25 11',
    left: 'M 37 23 C 28 13, 17 26, 5 19 M 5 19 L 13 14 M 5 19 L 11 27',
  };

  // headings: an underline in a different pen colour each time
  const pens = ['var(--queen)', 'var(--accent)', 'var(--sky)', 'var(--sister)', 'var(--queen)', 'var(--accent)'];
  $$('.section-title h2').forEach((h, i) => {
    const s = stroke('underline', '0 0 100 12', underlinePath());
    s.style.setProperty('--stroke', pens[i % pens.length]);
    h.appendChild(s);
  });
  // marked phrases (hero line, contact email)
  $$('.u-sketch').forEach((el) => {
    const s = stroke('underline', '0 0 100 12', underlinePath());
    if (el.dataset.pen) s.style.setProperty('--stroke', el.dataset.pen);
    el.appendChild(s);
  });
  // circled phrases, and one circle per language on the sticky note
  $$('.circled, .lang-chips li').forEach((el) => el.appendChild(stroke('circle', '0 0 200 62', circlePath())));
  // arrows on the notes
  $$('.note[data-arrow]').forEach((el) => {
    const d = ARROWS[el.dataset.arrow];
    if (d) el.prepend(stroke('arrow', '0 0 40 40', d, false));
  });

  /* ---------- Nav: mark the section you're reading ---------- */
  const links = $$('.nav-links a');
  const targets = links.map((a) => document.querySelector(a.getAttribute('href')));
  let ticking = false;
  function updateNav() {
    ticking = false;
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

  if (reduce) return;
  root.classList.add('motion');

  /* ---------- Split the name into letters ---------- */
  const heroName = $('.hero h1');
  if (heroName) {
    const text = heroName.textContent.trim().replace(/\s+/g, ' ');
    heroName.setAttribute('aria-label', text);
    heroName.textContent = '';
    const hues = ['var(--brutal)', 'var(--queen)', 'var(--sister)', 'var(--sky)'];
    let i = 0;
    text.split(' ').forEach((word, wi, words) => {
      const w = document.createElement('span');
      w.className = 'word';
      w.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach((ch) => {
        const c = document.createElement('span');
        c.className = 'char';
        c.textContent = ch;
        c.style.setProperty('--i', String(i));
        c.style.setProperty('--c', hues[i % hues.length]);
        i += 1;
        w.appendChild(c);
      });
      heroName.appendChild(w);
      if (wi < words.length - 1) heroName.appendChild(document.createTextNode(' '));
    });
    heroName.classList.add('is-split');
  }

  /* ---------- Sticky note: Hello / สวัสดี / Hola ---------- */
  const greetWord = $('.greeting-word');
  const chips = $$('.lang-chips li');
  const greetings = [
    { text: 'Hello', lang: 'EN', code: 'en' },
    { text: 'สวัสดี', lang: 'TH', code: 'th' },
    { text: 'Hola', lang: 'ES', code: 'es' },
  ];
  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // reflow so the animation plays again
    el.classList.add(cls);
  }
  let greetIndex = 0;
  let greetTimer = null;
  function showGreeting(index) {
    greetIndex = index;
    greetWord.textContent = greetings[index].text;
    greetWord.lang = greetings[index].code;
    restart(greetWord, 'is-writing');
    chips.forEach((c) => c.classList.toggle('is-active', c.dataset.lang === greetings[index].lang));
  }
  function startGreeting() {
    if (!greetWord) return;
    clearInterval(greetTimer);
    greetTimer = setInterval(() => {
      if (document.hidden) return;
      showGreeting((greetIndex + 1) % greetings.length);
    }, 3400);
  }
  // When the visitor switches the site's language, jump to that greeting.
  document.addEventListener('site:lang', (e) => {
    const index = greetings.findIndex((g) => g.code === e.detail.lang);
    if (greetWord && index >= 0) {
      showGreeting(index);
      startGreeting();
    }
  });

  /* ---------- Scroll reveals ---------- */
  const revealEls = $$('.prose > p, .entry, .skill-group, .facts > div, .section-title, .contact-block');
  $$('.entry-points, .gallery').forEach((list) => {
    Array.from(list.children).forEach((child, i) => {
      if (!child.style.getPropertyValue('--i')) child.style.setProperty('--i', String(i));
    });
  });

  const io = new IntersectionObserver((entries) => {
    // things that come into view together appear one after another
    const batch = entries.filter((e) => e.isIntersecting).map((e) => e.target);
    batch.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    batch.forEach((el, i) => {
      el.style.setProperty('--d', `${Math.min(i, 6) * 90}ms`);
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  revealEls.forEach((el) => {
    // once revealed, hand the element back to its normal transitions
    el.addEventListener('transitionend', (e) => {
      if (e.target === el && e.propertyName === 'transform') el.classList.add('is-done');
    });
  });

  /* ---------- Start once fonts are in, so letters don't jump ---------- */
  function start() {
    root.classList.add('is-loaded');
    setTimeout(() => revealEls.forEach((el) => io.observe(el)), 300);
    setTimeout(() => { if (heroName) heroName.classList.add('is-ready'); }, 1900);
    setTimeout(startGreeting, 2800);
  }
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))])
    .then(() => requestAnimationFrame(() => requestAnimationFrame(start)));
})();

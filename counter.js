/* ==========================================================
   Visitor counter (footer)
   GitHub Pages only serves files, so the numbers are kept by a free
   counting service (Abacus, abacus.jasoncameron.dev). Every day and
   every month has its own counter, named by the date in Bangkok time,
   so "today" starts again from 0 at midnight and "this month" on the
   1st. Each browser is counted once a day and once a month (remembered
   on the device), so reloads and page-hopping don't inflate the
   numbers. Visits while working on the site locally aren't counted.
   If the service can't be reached, the line simply stays hidden.
   ========================================================== */
(function () {
  const box = document.querySelector('[data-visits]');
  if (!box || typeof fetch !== 'function') return;

  const API = 'https://abacus.jasoncameron.dev';
  const SPACE = 'km-44614ff47e';   // this site's counters
  const ZONE = 'Asia/Bangkok';     // when the day and the month roll over
  const local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  // today's date in Bangkok, as "2026-11-26"
  function today() {
    const parts = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date())
      .forEach((p) => { parts[p.type] = p.value; });
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  const day = today();
  const month = day.slice(0, 7);

  let seen = {};
  try { seen = JSON.parse(localStorage.getItem('visits') || '{}') || {}; } catch (e) { seen = {}; }

  // "hit" adds this visitor and returns the new total; "get" only reads it
  function counter(key, add) {
    return fetch(`${API}/${add ? 'hit' : 'get'}/${SPACE}/${key}`, { cache: 'no-store' })
      .then((r) => {
        if (r.status === 404) return { value: 0 }; // nobody yet
        if (!r.ok) throw new Error(`counter ${r.status}`);
        return r.json();
      })
      .then((d) => Math.max(0, Number(d.value) || 0));
  }

  const addDay = !local && seen.day !== day;
  const addMonth = !local && seen.month !== month;

  Promise.all([
    counter(`day-${day.replace(/-/g, '')}`, addDay),
    counter(`month-${month.replace('-', '')}`, addMonth),
  ]).then(([d, m]) => {
    if (addDay || addMonth) {
      try { localStorage.setItem('visits', JSON.stringify({ day, month })); } catch (e) { /* private mode */ }
    }
    show(d, Math.max(d, m));
  }).catch(() => { /* service unreachable: keep the line hidden */ });

  /* ---------- Showing the numbers ---------- */
  const dayEl = box.querySelector('[data-visits-day]');
  const monthEl = box.querySelector('[data-visits-month]');
  const set = (el, n) => { el.textContent = n.toLocaleString('en-GB'); };

  function show(d, m) {
    box.hidden = false;
    const calm = !document.documentElement.classList.contains('motion') || !('IntersectionObserver' in window);
    if (calm) { set(dayEl, d); set(monthEl, m); return; }

    // the numbers count up the first time the footer comes into view
    set(dayEl, 0);
    set(monthEl, 0);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      roll(dayEl, d);
      roll(monthEl, m);
    });
    io.observe(box);
  }

  function roll(el, to) {
    const start = performance.now();
    const length = 900;
    const step = (now) => {
      const k = Math.min(1, (now - start) / length);
      set(el, Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
})();

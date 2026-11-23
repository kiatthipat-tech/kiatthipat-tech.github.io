/* ==========================================================
   Journey line
   A hairline runs down the page from "About" to "Contact" and draws
   itself as you scroll. Its tip follows a reading line 60% of the
   way down the screen, so the drawn length is how far you've
   scrolled through the timeline. Each chapter and each job or
   degree lights up as the line reaches it.
   ========================================================== */
(function () {
  const main = document.getElementById('main');
  const svg = main && main.querySelector('.journey');
  if (!svg) return;

  const track = svg.querySelector('.journey-track');
  const line = svg.querySelector('.journey-line');
  const nodeLayer = svg.querySelector('.journey-nodes');
  const head = svg.querySelector('.journey-head');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';
  const READING_LINE = 0.6; // where the tip sits, as a fraction of screen height

  let x = 0;
  let start = 0;
  let end = 0;
  let nodes = [];
  let ticking = false;
  let pathLen = 0;

  document.documentElement.classList.add('has-journey');

  // A straight hairline from the first stop to the last.
  function straightPath(x0, y0, y1) {
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} L ${x0.toFixed(1)} ${y1.toFixed(1)}`;
  }

  // Distance from the top of <main>. Uses offsetTop, which ignores
  // transforms, so scroll-reveal animations don't shift the stops.
  function topIn(el) {
    let y = 0;
    while (el && el !== main) {
      y += el.offsetTop;
      el = el.offsetParent;
    }
    return y;
  }

  /* Measure the page and place the line and its stops. */
  function layout() {
    const splits = main.querySelectorAll('.section .split');
    if (!splits.length) return;

    const origin = main.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    // Horizontal position: the middle of the gap between the section title
    // and its content, or just left of the content when they stack on phones.
    const t = splits[0].querySelector('.section-title').getBoundingClientRect();
    const b = splits[0].querySelector('.section-body').getBoundingClientRect();
    const stacked = t.right > b.left + 1;
    x = (stacked ? b.left - 0.875 * rem : (t.right + b.left) / 2) - origin.left;

    // Stops: one ring per section heading and one dot per job/degree.
    // Measured from non-sticky elements so scroll position doesn't matter.
    const stops = [];
    splits.forEach((split) => {
      const section = split.closest('.section');
      const heading = split.querySelector('.section-title h2');
      const top = topIn(section) + parseFloat(getComputedStyle(section).paddingTop);
      const headingMid = heading ? (parseFloat(getComputedStyle(heading).lineHeight) || heading.offsetHeight) / 2 : 10;
      stops.push({ y: top + headingMid, kind: 'chapter' });

      split.querySelectorAll('.entry-title').forEach((h) => {
        const lineHeight = parseFloat(getComputedStyle(h).lineHeight) || h.offsetHeight;
        stops.push({ y: topIn(h) + lineHeight / 2, kind: 'stop' });
      });
    });

    start = stops[0].y;
    end = stops[stops.length - 1].y;
    if (end <= start) return;

    const d = straightPath(x, start, end);
    track.setAttribute('d', d);
    line.setAttribute('d', d);
    pathLen = line.getTotalLength();
    line.style.strokeDasharray = `${pathLen} ${pathLen}`;

    // Reuse circles when we can, so a resize doesn't replay every animation.
    if (nodeLayer.children.length !== stops.length) {
      nodeLayer.replaceChildren(...stops.map(() => document.createElementNS(NS, 'circle')));
    }
    nodes = stops.map((s, i) => {
      const c = nodeLayer.children[i];
      c.setAttribute('cx', x);
      c.setAttribute('cy', s.y);
      c.setAttribute('r', s.kind === 'stop' ? 2.5 : 3.5);
      c.classList.add('journey-node', `is-${s.kind}`);
      return { y: s.y, el: c };
    });

    update();
  }

  /* Draw the line up to the current scroll position. */
  function update() {
    ticking = false;
    const length = end - start;
    if (length <= 0) return;

    const doc = document.documentElement;
    const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
    const tip = window.innerHeight * READING_LINE - main.getBoundingClientRect().top;

    let progress = (tip - start) / length;
    if (atBottom || reduceMotion.matches) progress = 1;
    progress = Math.min(1, Math.max(0, progress));

    const y = start + progress * length;
    line.style.strokeDashoffset = String(pathLen * (1 - progress));
    head.style.transform = `translate(${x}px, ${y}px)`;
    head.classList.toggle('is-hidden', progress <= 0 || progress >= 1 || reduceMotion.matches);

    for (const n of nodes) {
      n.el.classList.toggle('is-reached', progress > 0 && n.y <= y + 0.5);
    }
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', update);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(main);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('load', layout);
  layout();
})();

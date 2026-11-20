/* ==========================================================
   Phone menu
   The menu button (shown on phones and small tablets) opens a
   panel with the section links and the dark-mode switch.
   It closes when you pick a section, press Esc, tap outside it,
   or when the screen becomes wide enough for the normal nav.
   ========================================================== */
(function () {
  const button = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!button || !menu) return;

  const isOpen = () => button.getAttribute('aria-expanded') === 'true';

  function setOpen(open) {
    button.setAttribute('aria-expanded', String(open));
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { if (!isOpen()) menu.hidden = true; }, 260);
    }
  }

  button.addEventListener('click', () => setOpen(!isOpen()));

  // picking a section closes the menu
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      button.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (isOpen() && !e.target.closest('.nav')) setOpen(false);
  });

  const wide = window.matchMedia('(min-width: 62.01rem)');
  const onWide = (e) => { if (e.matches && isOpen()) setOpen(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);
  else if (wide.addListener) wide.addListener(onWide);
})();

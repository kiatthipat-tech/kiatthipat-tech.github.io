/* ==========================================================
   Light / dark theme
   The starting theme is set in <head> (saved choice, otherwise the
   system setting). Any button with data-theme-toggle switches it
   (the round button in the bar, and "Dark mode" in the phone menu)
   and the choice is remembered on this device. Without a saved
   choice the site follows the system setting, even if it changes
   while the page is open. The phone browser's bar colour
   (meta theme-color) follows the theme too.
   ========================================================== */
(function () {
  const root = document.documentElement;
  const buttons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
  const barColour = document.querySelector('meta[name="theme-color"]');
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const BAR = { light: '#FFFFFF', dark: '#0F1322' };

  function saved() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(theme === 'dark')));
    if (barColour) barColour.setAttribute('content', BAR[theme]);
  }

  apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.classList.add('theme-switching');
      apply(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode: just don't remember */ }
      setTimeout(() => root.classList.remove('theme-switching'), 400);
    });
  });

  const follow = (e) => { if (!saved()) apply(e.matches ? 'dark' : 'light'); };
  if (system.addEventListener) system.addEventListener('change', follow);
  else if (system.addListener) system.addListener(follow);
})();

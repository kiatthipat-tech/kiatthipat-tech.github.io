/* ==========================================================
   Light / dark theme
   The starting theme is set in <head> (saved choice, otherwise the
   system setting). Any button with data-theme-toggle switches it
   (the round button in the bar, and "Dark mode" in the phone menu)
   and the choice is remembered on this device. Without a saved
   choice the site follows the system setting, even if it changes
   while the page is open (e.g. phones that go dark at sunset).
   Switching back to the device's own look forgets the choice, so
   the site follows the device again. The phone browser's bar colour
   (meta theme-color) follows the theme too.
   ========================================================== */
(function () {
  const root = document.documentElement;
  const buttons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
  const barColour = document.querySelector('meta[name="theme-color"]');
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const BAR = { light: '#F7F8FA', dark: '#0C0D10' };

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
      // Choosing the same look as the device goes back to following the
      // device; only a different look is remembered as the visitor's choice.
      try {
        if (next === (system.matches ? 'dark' : 'light')) localStorage.removeItem('theme');
        else localStorage.setItem('theme', next);
      } catch (e) { /* private mode: just don't remember */ }
      setTimeout(() => root.classList.remove('theme-switching'), 400);
    });
  });

  const follow = (e) => { if (!saved()) apply(e.matches ? 'dark' : 'light'); };
  if (system.addEventListener) system.addEventListener('change', follow);
  else if (system.addListener) system.addListener(follow);
})();

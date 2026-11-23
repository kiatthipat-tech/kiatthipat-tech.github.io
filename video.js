/* ==========================================================
   App tour video (Chaba Chaba)
   The silent phone video plays by itself while it's on screen and
   pauses when you scroll past it or switch tabs. The Pause / Play
   button (or tapping the phone) controls it; once you pause it
   yourself it stays paused. With reduced motion it never starts by
   itself. The video file only downloads when it first plays.
   Without JavaScript the browser's own video controls are shown.
   ========================================================== */
(function () {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.app-demo').forEach((demo) => {
    const video = demo.querySelector('video');
    const button = demo.querySelector('.phone-play');
    if (!video || !button) return;

    video.controls = false;
    video.muted = true;
    button.hidden = false;

    let stoppedByVisitor = calm;
    let inView = false;

    // the button shows "Pause" while playing and "Play" while paused
    const sync = () => { button.dataset.playing = String(!video.paused); };
    const play = () => {
      const started = video.play();
      if (started && started.catch) started.catch(sync);
    };

    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);

    button.addEventListener('click', () => {
      if (video.paused) { stoppedByVisitor = false; play(); }
      else { stoppedByVisitor = true; video.pause(); }
    });
    video.addEventListener('click', () => button.click());

    const update = () => {
      const shouldPlay = inView && !stoppedByVisitor && !document.hidden;
      if (shouldPlay && video.paused) play();
      else if (!shouldPlay && !video.paused) video.pause();
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        inView = entries[entries.length - 1].isIntersecting;
        update();
      }, { threshold: 0.5 }).observe(video);
    }
    document.addEventListener('visibilitychange', update);
    sync();
  });
})();

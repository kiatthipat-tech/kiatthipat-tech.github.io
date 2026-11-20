/* ==========================================================
   Photo viewer
   Clicking a photo in a .gallery opens it full-screen.
   Arrows / ← → keys / swipe move between photos;
   Esc, the × button or clicking the dark area closes it.
   Without JavaScript the thumbnails simply link to the photo.
   ========================================================== */
(function () {
  const dialog = document.querySelector('.lightbox');
  const photos = Array.from(document.querySelectorAll('.gallery .photo'));
  if (!dialog || !photos.length || typeof dialog.showModal !== 'function') return;

  const img = dialog.querySelector('.lightbox-img');
  const caption = dialog.querySelector('.lightbox-caption');
  const count = dialog.querySelector('.lightbox-count');
  // each .gallery is its own set: next/previous stay within it
  let set = photos;
  let index = 0;

  function show(i) {
    index = (i + set.length) % set.length;
    const link = set[index];
    img.src = link.getAttribute('href');
    img.alt = link.querySelector('img').alt;
    caption.textContent = link.dataset.caption || '';
    count.textContent = `${index + 1} / ${set.length}`;
    img.classList.remove('is-swapping');
    void img.offsetWidth; // restart the swap animation
    img.classList.add('is-swapping');
    // load the neighbours so next/previous feel instant
    if (set.length > 1) {
      [index - 1, index + 1].forEach((j) => {
        new Image().src = set[(j + set.length) % set.length].getAttribute('href');
      });
    }
  }

  photos.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      set = Array.from(link.closest('.gallery').querySelectorAll('.photo'));
      dialog.classList.toggle('is-single', set.length < 2);
      show(set.indexOf(link));
      dialog.showModal();
    });
  });

  dialog.querySelector('.lightbox-prev').addEventListener('click', () => show(index - 1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => show(index + 1));
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });

  // Swipe (touch or mouse drag) to change photo. Not while the page is
  // pinch-zoomed in, where a sideways drag means "look around the photo".
  let startX = null;
  let swiped = false;
  const zoomedIn = () => window.visualViewport && window.visualViewport.scale > 1.05;
  dialog.addEventListener('pointerdown', (e) => { startX = e.isPrimary ? e.clientX : null; });
  dialog.addEventListener('pointercancel', () => { startX = null; });
  dialog.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50 && !zoomedIn()) {
      swiped = true;
      // a swipe isn't a tap: forget it once this gesture's click (if any) has passed
      setTimeout(() => { swiped = false; }, 0);
      show(index + (dx < 0 ? 1 : -1));
    }
  });

  // Clicking the dark area around the photo closes the viewer.
  dialog.addEventListener('click', (e) => {
    if (swiped) { swiped = false; return; }
    if (e.target === dialog) dialog.close();
  });
})();

/* ==========================================================================
   Liftoff - LOOK BOOK Chapter
   Clips from the film on a curved film strip: it drifts on its own, drags (or swipes
   sideways) to move, and a click opens the clip large. The center frames play.
   Clips (11/2026, from Ryan): 2:1, up to 5 s (the middle of longer shots), on S3 under
   liftoff-lookbook/ as NN-sm.mp4 (strip), NN-lg.mp4 (large) and NN.jpg (poster).
   ========================================================================== */

// Uses discrete section system from content.js

const BASE = 'https://triglass-assets.s3.amazonaws.com/liftoff-lookbook/';
const CLIPS = ['01', '02', '03', '04', '05', '06', '08', '09', '10', '11', '12', '13', '14',
  '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26'];

// The strip: frames on the outside of a cylinder, seen from the front
const FRAME_W = 320;
const FRAME_H = 160;
const GAP = 14;                 // frame line between frames
const PERF_H = 30;              // perforated band above and below the frames
const PANEL_W = FRAME_W + GAP;
const BAND_H = FRAME_H + PERF_H * 2;
const RADIUS = 760;             // distance from the cylinder's axis to the middle of each panel
const STEP = 2 * Math.atan(PANEL_W / 2 / RADIUS);   // panels meet edge to edge
const VISIBLE = 80 * Math.PI / 180;                  // hide panels turned further than this
const DRIFT = 0.1;              // frames per second when nobody is dragging
const PLAY_RANGE = 1;           // frames this close to center play

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;
const PERSPECTIVE_SCALE = 1000 / (1000 - REST_Z);

let container = null;
let ring = null;
let counter = null;
let panels = [];
let sectionIndex = -1;
let animated = false;
let fitScale = 1;
let postersLoaded = false;

// Strip motion, in frames
let offset = 0;
let velocity = 0;
let lastTime = 0;
let resumeAt = 0;
let drag = null;

// Large view
let lightbox = null;
let lightboxVideo = null;
let lightboxCount = null;
let lightboxIndex = -1;

const wrap = d => ((d % CLIPS.length) + CLIPS.length * 1.5) % CLIPS.length - CLIPS.length / 2;

function injectStyles() {
  if (document.getElementById('lookbook-chapter-styles')) return;

  // Perforations: holes cut out of the band (a mask, so the stars show through)
  const hole = (top) => `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${PANEL_W / 6}' height='${PERF_H}'><path fill-rule='evenodd' d='M0 0H${PANEL_W / 6}V${PERF_H}H0Z M${PANEL_W / 12 - 9} ${top}h18a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-18a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z'/></svg>`)}")`;

  const style = document.createElement('style');
  style.id = 'lookbook-chapter-styles';
  style.textContent = `
    /* Hide default title/subtitle - this slide renders its own */
    .liftoff-text.lookbook-layout,
    .liftoff-preview.preview-lookbook {
      display: none;
    }

    .lookbook-container {
      position: absolute;
      width: 1100px;
      transform-style: preserve-3d;
      pointer-events: none;
      font-family: 'montserrat', sans-serif;
      color: rgba(255, 255, 255, 0.85);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .lookbook-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(24px, 3.6vw, 42px);
      font-weight: 400;
      color: #d4d4d4;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      text-align: center;
      margin: 0 0 8px;
    }
    .lookbook-lede {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
      margin: 0 0 18px;
    }

    /* Its own perspective: the chapter container fades with opacity, which flattens 3D */
    .lookbook-stage {
      position: relative;
      height: ${BAND_H + 40}px;
      perspective: 1500px;
      perspective-origin: 50% 50%;
      pointer-events: auto;
      cursor: grab;
      touch-action: pan-y;
      user-select: none;
      -webkit-user-select: none;
    }
    .lookbook-stage.is-dragging { cursor: grabbing; }
    .lookbook-ring {
      position: absolute;
      left: 50%;
      top: 20px;
      width: 0;
      height: ${BAND_H}px;
      transform-style: preserve-3d;
      transform-origin: 0 ${BAND_H / 2}px ${RADIUS}px;   /* tilt around the front frame */
      transform: translateZ(-${RADIUS}px) rotateX(4deg);
    }
    .lookbook-panel {
      position: absolute;
      left: ${-PANEL_W / 2}px;
      top: 0;
      width: ${PANEL_W}px;
      height: ${BAND_H}px;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    .lookbook-perf {
      height: ${PERF_H}px;
      background: linear-gradient(to bottom, #1b1b1f, #121215);
      -webkit-mask: ${hole(5)} repeat-x;
      mask: ${hole(5)} repeat-x;
    }
    .lookbook-perf.bottom {
      position: relative;
      background: linear-gradient(to top, #1b1b1f, #121215);
      -webkit-mask: ${hole(PERF_H - 17)} repeat-x;
      mask: ${hole(PERF_H - 17)} repeat-x;
    }
    .lookbook-edge {
      position: absolute;
      left: ${GAP / 2 + 6}px;
      top: 2px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 8.5px;
      font-weight: 500;
      letter-spacing: 0.22em;
      color: rgba(240, 170, 70, 0.7);
      white-space: nowrap;
    }
    .lookbook-frame {
      position: relative;
      height: ${FRAME_H}px;
      padding: 0 ${GAP / 2}px;
      background: #121215;
    }
    .lookbook-frame video {
      display: block;
      width: ${FRAME_W}px;
      height: ${FRAME_H}px;
      object-fit: cover;
      border-radius: 2px;
      background: #050507;
      pointer-events: none;
    }
    .lookbook-shade {
      position: absolute;
      inset: 0 ${GAP / 2}px;
      border-radius: 2px;
      background: #000;
      pointer-events: none;
    }

    .lookbook-meta {
      display: flex;
      justify-content: space-between;
      width: 640px;
      margin: 10px auto 0;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.45);
    }
    .lookbook-meta .count { color: rgba(255, 255, 255, 0.75); font-variant-numeric: tabular-nums; }

    /* Staggered entrance */
    .lookbook-reveal {
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .animate-in .lookbook-reveal {
      opacity: 1;
      transform: translateY(0);
    }

    /* Large view */
    .lookbook-lightbox {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: grid;
      place-items: center;
      background: rgba(0, 0, 0, 0.86);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0s linear 0.3s;
    }
    .lookbook-lightbox.is-open {
      opacity: 1;
      visibility: visible;
      transition: opacity 0.3s ease;
    }
    .lookbook-lightbox video {
      width: min(86vw, 160vh);
      aspect-ratio: 2 / 1;
      border-radius: 6px;
      background: #000;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
    }
    .lookbook-lightbox-bar {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 18px;
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.14em;
      color: rgba(255, 255, 255, 0.7);
      font-variant-numeric: tabular-nums;
    }
    .lookbook-lightbox button {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      cursor: pointer;
      padding: 0;
    }
    .lookbook-lightbox button:hover { background: rgba(255, 255, 255, 0.14); }
    .lookbook-lightbox button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .lookbook-lightbox .close {
      position: absolute;
      top: 24px;
      right: 24px;
    }
  `;
  document.head.appendChild(style);
}

function build() {
  panels = CLIPS.map((clip, i) => {
    const el = document.createElement('div');
    el.className = 'lookbook-panel';
    el.dataset.index = i;
    el.innerHTML = `
      <div class="lookbook-perf"></div>
      <div class="lookbook-frame">
        <video muted loop playsinline preload="none"></video>
        <div class="lookbook-shade"></div>
      </div>
      <div class="lookbook-perf bottom"><span class="lookbook-edge">LIFTOFF &#9656; ${i + 1}A</span></div>
    `;
    return { el, video: el.querySelector('video'), shade: el.querySelector('.lookbook-shade'), clip, playing: false };
  });

  container.innerHTML = `
    <h1 class="lookbook-title">Look Book</h1>
    <p class="lookbook-lede lookbook-reveal" style="transition-delay: 0.1s">Moments from the film</p>
    <div class="lookbook-stage lookbook-reveal" style="transition-delay: 0.2s">
      <div class="lookbook-ring"></div>
    </div>
    <div class="lookbook-meta lookbook-reveal" style="transition-delay: 0.35s">
      <span>Frame <span class="count"></span></span>
      <span>Drag the strip · Click a frame to enlarge</span>
    </div>
  `;
  ring = container.querySelector('.lookbook-ring');
  counter = container.querySelector('.count');
  panels.forEach(p => ring.appendChild(p.el));
  bindDrag(container.querySelector('.lookbook-stage'));
}

// Posters only once someone heads for this slide
function loadPosters() {
  if (postersLoaded) return;
  postersLoaded = true;
  panels.forEach(p => { p.video.poster = `${BASE}${p.clip}.jpg`; });
}

// ---- strip motion ----------------------------------------------------------------

const pxPerFrame = () => PANEL_W * fitScale * PERSPECTIVE_SCALE;

function bindDrag(stage) {
  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, start: e.clientX, offset, t: performance.now(), moved: false, samples: [] };
    velocity = 0;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    const now = performance.now();
    if (Math.abs(e.clientX - drag.start) > 5) {
      drag.moved = true;
      stage.classList.add('is-dragging');
    }
    offset = drag.offset - (e.clientX - drag.start) / pxPerFrame();
    drag.samples.push({ x: e.clientX, t: now });
    drag.samples = drag.samples.filter(s => now - s.t < 100);
  });
  const end = e => {
    if (!drag) return;
    stage.classList.remove('is-dragging');
    if (!drag.moved) {
      // A click: open the frame under the pointer (or the center one)
      const panel = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.classList?.contains('lookbook-panel'));
      openLightbox(panel ? +panel.dataset.index : nearestIndex());
    } else if (drag.samples.length > 1) {
      const a = drag.samples[0];
      const b = drag.samples[drag.samples.length - 1];
      const dt = (b.t - a.t) / 1000;
      if (dt > 0) velocity = -((b.x - a.x) / pxPerFrame()) / dt;
    }
    drag = null;
    resumeAt = performance.now() + 1800;
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
}

// Sideways trackpad swipes move the strip (up/down still changes slides)
function onWheel(e) {
  if (lightboxIndex >= 0) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  if (!animated || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  offset += e.deltaX / pxPerFrame();
  velocity = 0;
  resumeAt = performance.now() + 1800;
}

const nearestIndex = () => ((Math.round(offset) % CLIPS.length) + CLIPS.length) % CLIPS.length;

function stepStrip(now, active) {
  const dt = Math.min(0.05, (now - (lastTime || now)) / 1000);
  lastTime = now;
  if (!drag && active) {
    if (Math.abs(velocity) > 0.02) {
      offset += velocity * dt;
      velocity *= Math.exp(-dt * 3);
    } else if (now > resumeAt && lightboxIndex < 0 && !reducedMotion()) {
      velocity = 0;
      offset += DRIFT * dt;
    }
  }
  offset = ((offset % CLIPS.length) + CLIPS.length) % CLIPS.length;
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function layoutStrip(active) {
  panels.forEach((p, i) => {
    const d = wrap(i - offset);
    const angle = d * STEP;
    const visible = Math.abs(angle) < VISIBLE;
    p.el.style.visibility = visible ? 'visible' : 'hidden';
    if (visible) {
      p.el.style.transform = `rotateY(${angle}rad) translateZ(${RADIUS}px)`;
      p.shade.style.opacity = Math.min(0.75, Math.pow(Math.abs(angle) / VISIBLE, 1.4) * 0.85).toFixed(3);
    }
    // Only the frames near the center play, and only while this slide is up
    const play = active && Math.abs(d) <= PLAY_RANGE && lightboxIndex < 0;
    if (play && !p.playing) {
      if (!p.video.src) p.video.src = `${BASE}${p.clip}-sm.mp4`;
      p.video.play().catch(() => {});
      p.playing = true;
    } else if (!play && p.playing) {
      p.video.pause();
      p.playing = false;
    }
    // Let go of clips well off center
    if (Math.abs(d) > 3 && p.video.getAttribute('src')) {
      p.video.removeAttribute('src');
      p.video.load();
    }
  });
  if (counter) counter.textContent = `${String(nearestIndex() + 1).padStart(2, '0')} / ${CLIPS.length}`;
}

// ---- large view ------------------------------------------------------------------

const ARROW = d => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;

function buildLightbox() {
  lightbox = document.createElement('div');
  lightbox.className = 'lookbook-lightbox';
  lightbox.innerHTML = `
    <video muted loop playsinline></video>
    <button class="close" type="button" aria-label="Close">${ARROW('M6 6l12 12M18 6L6 18')}</button>
    <div class="lookbook-lightbox-bar">
      <button class="prev" type="button" aria-label="Previous">${ARROW('M15 5l-7 7 7 7')}</button>
      <span class="lookbook-lightbox-count"></span>
      <button class="next" type="button" aria-label="Next">${ARROW('M9 5l7 7-7 7')}</button>
    </div>
  `;
  lightboxVideo = lightbox.querySelector('video');
  lightboxCount = lightbox.querySelector('.lookbook-lightbox-count');
  lightbox.addEventListener('click', e => {
    if (e.target.closest('.prev')) showClip(lightboxIndex - 1);
    else if (e.target.closest('.next')) showClip(lightboxIndex + 1);
    else if (e.target.closest('.close') || e.target === lightbox) closeLightbox();
  });
  document.body.appendChild(lightbox);
}

function showClip(index) {
  lightboxIndex = (index + CLIPS.length) % CLIPS.length;
  const clip = CLIPS[lightboxIndex];
  lightboxVideo.poster = `${BASE}${clip}.jpg`;
  lightboxVideo.src = `${BASE}${clip}-lg.mp4`;
  lightboxVideo.play().catch(() => {});
  lightboxCount.textContent = `${String(lightboxIndex + 1).padStart(2, '0')} / ${CLIPS.length}`;
  // Bring the strip along, so closing lands on the same frame
  offset = lightboxIndex;
  velocity = 0;
}

function openLightbox(index) {
  if (!lightbox) return;
  showClip(index);
  lightbox.classList.add('is-open');
}

function closeLightbox() {
  if (!lightbox || lightboxIndex < 0) return;
  lightbox.classList.remove('is-open');
  lightboxVideo.pause();
  lightboxVideo.removeAttribute('src');
  lightboxVideo.load();
  lightboxIndex = -1;
  resumeAt = performance.now() + 1800;
}

function onKey(e) {
  if (lightboxIndex < 0) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') showClip(lightboxIndex - 1);
  else if (e.key === 'ArrowRight') showClip(lightboxIndex + 1);
}

// Shrink the slide if the window is too small to show it whole
function measureFit() {
  if (!container) return;
  const w = container.offsetWidth * PERSPECTIVE_SCALE;
  const h = container.offsetHeight * PERSPECTIVE_SCALE;
  fitScale = Math.min(1, (window.innerWidth - 160) / w, (window.innerHeight - 80) / h);
}

// ---- chapter lifecycle -----------------------------------------------------------

export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.lookbookLayout);
  if (sectionIndex < 0) {
    console.warn('[LOOKBOOK] Could not find section with lookbookLayout');
    return;
  }

  container = document.createElement('div');
  container.className = 'lookbook-container';
  build();
  buildLightbox();
  container.style.opacity = 0;
  container.style.visibility = 'hidden';
  imgWorld.appendChild(container);
  layoutStrip(false);

  measureFit();
  window.addEventListener('resize', measureFit);
  window.addEventListener('wheel', onWheel, { capture: true, passive: false });
  window.addEventListener('keydown', onKey);
}

export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !container) return;
  const goingForward = targetSection > currentSection;
  const now = performance.now();

  let containerZ = REST_Z;
  let containerOpacity = 0;
  let containerScale = 1;

  if (isTransitioning) {
    if (sectionIndex === currentSection) {
      // Current section, animating away
      if (goingForward) {
        containerZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
        containerScale = 1 + transitionProgress * 0.5;
        containerOpacity = Math.max(0, 1 - transitionProgress * 2);
      } else {
        containerZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
        containerScale = 1 - transitionProgress * 0.3;
        containerOpacity = 1 - transitionProgress;
      }
      if (transitionProgress > 0.5 && animated) {
        animated = false;
        container.classList.remove('animate-in');
      }
    } else if (sectionIndex === targetSection) {
      // Target section, approaching
      loadPosters();
      if (goingForward) {
        containerZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
        containerScale = 0.7 + transitionProgress * 0.3;
      } else {
        containerZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
        containerScale = 1.5 - transitionProgress * 0.5;
      }
      containerOpacity = transitionProgress;

      if (transitionProgress > 0.8 && !animated) {
        animated = true;
        container.classList.add('animate-in');
      }
    }
  } else if (sectionIndex === currentSection) {
    // At rest
    loadPosters();
    containerZ = REST_Z + elasticOffset * 500;
    containerOpacity = 1;

    if (!animated) {
      animated = true;
      container.classList.add('animate-in');
    }

    if (scrollAnticipation < 0) {
      containerZ = REST_Z + Math.abs(scrollAnticipation) * 200;
      containerScale = 1 + Math.abs(scrollAnticipation) * 0.2;
      containerOpacity = 1 - Math.abs(scrollAnticipation) * 0.5;
    } else if (scrollAnticipation > 0) {
      containerZ = REST_Z - scrollAnticipation * 400;
      containerScale = 1 - scrollAnticipation * 0.3;
      containerOpacity = 1 - scrollAnticipation * 0.6;
    }
  }

  // Play only while this slide is up and settled; close the large view if we've moved on
  const active = sectionIndex === currentSection && !isTransitioning;
  if (!active && lightboxIndex >= 0) closeLightbox();
  const shown = containerOpacity > 0.01;
  if (shown || active) {
    stepStrip(now, active);
    layoutStrip(active);
  } else {
    lastTime = 0;
    panels.forEach(p => { if (p.playing) { p.video.pause(); p.playing = false; } });
  }

  // Match parallax to text container in content.js
  const offsetX = mouse.x * 8;
  const offsetY = -mouse.y * 2;

  container.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale * fitScale})`;
  container.style.opacity = Math.max(0, Math.min(1, containerOpacity));
  container.style.visibility = shown ? 'visible' : 'hidden';
}

export function destroy() {
  window.removeEventListener('resize', measureFit);
  window.removeEventListener('wheel', onWheel, { capture: true });
  window.removeEventListener('keydown', onKey);
  closeLightbox();
  if (lightbox) lightbox.remove();
  if (container) container.remove();
  container = ring = counter = lightbox = lightboxVideo = lightboxCount = null;
  panels = [];
  sectionIndex = -1;
  animated = false;

  const styles = document.getElementById('lookbook-chapter-styles');
  if (styles) styles.remove();
}

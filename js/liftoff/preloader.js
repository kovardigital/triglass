/* ==========================================================================
   Liftoff - Preloader Module
   Logo reveal animation from left to right
   ========================================================================== */

// DOM elements
let preloaderEl = null;
let progressEl = null;
let styleEl = null;

// Callbacks
const readyCallbacks = [];

// Logo URL - hosted on GitHub Pages
const LOGO_URL = 'https://kovardigital.github.io/triglass/assets/images/triglass-logo.png';

// Initialize preloader (show immediately)
function init() {
  preloaderEl = document.createElement('div');
  preloaderEl.className = 'liftoff-preloader';
  preloaderEl.innerHTML = `
    <div class="liftoff-preloader-logo">
      <img src="${LOGO_URL}" alt="Triglass" class="liftoff-logo-faint">
      <div class="liftoff-logo-reveal">
        <img src="${LOGO_URL}" alt="Triglass" class="liftoff-logo-bright">
      </div>
    </div>
  `;

  // Get reference to progress element
  progressEl = preloaderEl.querySelector('.liftoff-logo-reveal');

  // Inject preloader styles
  styleEl = document.createElement('style');
  styleEl.textContent = `
    .liftoff-preloader {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s ease-out;
    }
    .liftoff-preloader.fade-out {
      opacity: 0;
      pointer-events: none;
    }
    .liftoff-preloader-logo {
      position: relative;
      width: 200px;
      max-width: 60vw;
    }
    .liftoff-preloader-logo img {
      width: 100%;
      height: auto;
      display: block;
    }
    .liftoff-logo-faint {
      opacity: 0.15;
      filter: grayscale(100%);
    }
    .liftoff-logo-reveal {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      clip-path: inset(0 100% 0 0);
      transition: clip-path 0.1s ease-out;
    }
    .liftoff-logo-bright {
      opacity: 1;
    }
  `;
  document.head.appendChild(styleEl);

  document.body.appendChild(preloaderEl);
  console.log('[LIFTOFF] Preloader shown, logo:', LOGO_URL);
}

// Set loading progress (0 to 1)
function setProgress(progress) {
  if (!progressEl) return;

  // Clamp progress between 0 and 1
  const p = Math.max(0, Math.min(1, progress));

  // Update clip-path to reveal from left to right
  const clipRight = 100 - (p * 100);
  progressEl.style.clipPath = `inset(0 ${clipRight}% 0 0)`;
}

// Hide preloader with fade animation
function hide(delay = 300) {
  if (!preloaderEl) return;

  // Complete the progress first
  setProgress(1);

  setTimeout(() => {
    preloaderEl.classList.add('fade-out');

    // Remove from DOM after transition
    setTimeout(() => {
      if (preloaderEl) {
        preloaderEl.remove();
        preloaderEl = null;
        progressEl = null;
      }

      // Fire ready callbacks
      readyCallbacks.forEach(cb => cb());
      console.log('[LIFTOFF] Preloader hidden');
    }, 500);
  }, delay);
}

// Register callback for when preloader is hidden
function onReady(callback) {
  readyCallbacks.push(callback);
}

export { init, setProgress, hide, onReady };

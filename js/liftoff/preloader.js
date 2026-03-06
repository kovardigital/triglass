/* ==========================================================================
   Liftoff - Preloader Module
   Logo reveal animation from left to right with actual asset loading
   ========================================================================== */

// DOM elements
let preloaderEl = null;
let progressEl = null;
let styleEl = null;

// Callbacks
const readyCallbacks = [];

// Logo URL - hosted on GitHub Pages
const LOGO_URL = 'https://kovardigital.github.io/triglass/assets/images/triglass-logo.png';

// Assets to preload
const ASSETS = {
  images: [
    'https://triglass-assets.s3.amazonaws.com/image0.png', // Title image
    'https://triglass-assets.s3.amazonaws.com/selena-2.jpg', // Character
    'https://triglass-assets.s3.amazonaws.com/leo-2.jpg', // Character
    'https://triglass-assets.s3.amazonaws.com/grandpa-2.jpg', // Character
    'https://triglass-assets.s3.amazonaws.com/dad-2.jpg', // Character
    // Cast headshots
    'https://triglass-assets.s3.amazonaws.com/genevieve.jpg',
    'https://triglass-assets.s3.amazonaws.com/seamus.jpg',
    'https://triglass-assets.s3.amazonaws.com/erik.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg', // Earth texture
    // Comp movie posters (featured)
    'https://triglass-assets.s3.amazonaws.com/movie-1.jpg',
    'https://triglass-assets.s3.amazonaws.com/movie-2.jpg',
    'https://triglass-assets.s3.amazonaws.com/movie-3.jpg',
    'https://triglass-assets.s3.amazonaws.com/movie-4.jpg',
    // Comp movie posters (background)
    ...Array.from({ length: 14 }, (_, i) => `https://triglass-assets.s3.amazonaws.com/movie-${i + 5}.jpg`),
  ],
  videos: [
    'https://triglass-assets.s3.amazonaws.com/LadderShot_01.mp4', // Logline autoplay loop
    'https://triglass-assets.s3.us-east-1.amazonaws.com/FakeTrailer_01-hd.mp4', // Trailer
  ],
};

// Loading state
let loadedCount = 0;
let totalAssets = 0;

// Preload a single image
function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      updateProgress();
      resolve();
    };
    img.onerror = () => {
      console.warn('[LIFTOFF] Failed to preload image:', src);
      loadedCount++;
      updateProgress();
      resolve(); // Resolve anyway to not block
    };
    img.src = src;
  });
}

// Preload a single video (just metadata, not full download)
function preloadVideo(src) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      loadedCount++;
      updateProgress();
      resolve();
    };
    video.onerror = () => {
      console.warn('[LIFTOFF] Failed to preload video:', src);
      loadedCount++;
      updateProgress();
      resolve(); // Resolve anyway to not block
    };
    video.src = src;
  });
}

// Update progress bar based on loaded assets
function updateProgress() {
  if (totalAssets > 0) {
    // Reserve first 10% for initialization, rest for assets
    const assetProgress = loadedCount / totalAssets;
    setProgress(0.1 + assetProgress * 0.9);
  }
}

// Start preloading all assets
function preloadAssets() {
  const imagePromises = ASSETS.images.map(preloadImage);
  const videoPromises = ASSETS.videos.map(preloadVideo);

  totalAssets = ASSETS.images.length + ASSETS.videos.length;
  loadedCount = 0;

  console.log('[LIFTOFF] Preloading', totalAssets, 'assets...');

  return Promise.all([...imagePromises, ...videoPromises]).then(() => {
    console.log('[LIFTOFF] All assets preloaded');
  });
}

// Initialize preloader (show immediately)
function init() {
  // Immediately set black background to prevent white flash
  document.documentElement.style.backgroundColor = '#000';
  document.body.style.backgroundColor = '#000';

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

export { init, setProgress, hide, onReady, preloadAssets };

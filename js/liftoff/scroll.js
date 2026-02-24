/* ==========================================================================
   Liftoff - Scroll Module
   Scroll tracking with inertia and camera Z position
   ========================================================================== */

// Scroll state - target is actual scroll, current lerps toward it for smoothness
let targetProgress = 0;
let currentProgress = 0;

// Inertia settings
const LERP_FACTOR = 0.08; // Lower = more inertia (0.05-0.15 feels good)

// Reference to camera
let camera = null;

// Camera Z range - very long travel through deep space
const CAMERA_START_Z = 100;
const CAMERA_TRAVEL = 2000; // How far camera moves on full scroll

// Scroll handler - updates target immediately
// Inverted: scroll UP to progress (start at bottom, scroll up to advance)
function onScroll() {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = scrollHeight > 0 ? 1 - (window.scrollY / scrollHeight) : 0;
}

// Initialize scroll tracking
function init(cam) {
  camera = cam;

  // Prevent browser from restoring scroll position on refresh
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  targetProgress = 0;
  currentProgress = 0;

  window.addEventListener('scroll', onScroll, { passive: true });
  console.log('[LIFTOFF] Scroll tracking initialized (scroll UP to progress)');
}

// Scroll to starting position (must be called after scroll spacer is created)
function scrollToStart() {
  // Start at the bottom of the page (scroll UP to progress)
  window.scrollTo(0, document.documentElement.scrollHeight);
  targetProgress = 0;
  currentProgress = 0;
  console.log('[LIFTOFF] Scrolled to start position (bottom)');
}

// Update camera position (called each frame)
function update() {
  if (!camera) return;

  // Lerp current toward target for smooth inertia
  currentProgress += (targetProgress - currentProgress) * LERP_FACTOR;

  // Only snap at the very ends (0 and 1) when extremely close
  if (targetProgress === 0 && currentProgress < 0.0001) {
    currentProgress = 0;
  } else if (targetProgress === 1 && currentProgress > 0.9999) {
    currentProgress = 1;
  }

  // Move camera forward on scroll (flying through space)
  camera.position.z = CAMERA_START_Z - currentProgress * CAMERA_TRAVEL;
}

// Get current scroll progress (0 to 1) - returns the smoothed value
function getProgress() {
  return currentProgress;
}

// Cleanup
function destroy() {
  window.removeEventListener('scroll', onScroll);
  camera = null;
}

export { init, scrollToStart, update, getProgress, destroy };

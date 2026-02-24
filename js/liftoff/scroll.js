/* ==========================================================================
   Liftoff - Scroll Module
   Scroll tracking with inertia, camera Z position, and elastic bounce
   ========================================================================== */

// Scroll state - target is actual scroll, current lerps toward it for smoothness
let targetProgress = 0;
let currentProgress = 0;

// Inertia settings
const LERP_FACTOR = 0.08; // Lower = more inertia (0.05-0.15 feels good)

// Elastic bounce settings
const ELASTIC_MAX = -0.08; // How far back the rubber band can stretch (negative = behind start)
const ELASTIC_RESISTANCE = 0.3; // How much resistance when pulling back (lower = harder to pull)
const ELASTIC_SNAPBACK = 0.12; // How fast it snaps back (higher = faster)

// State for elastic effect
let isAtStart = true;
let elasticOffset = 0; // Negative when stretched back
let lastScrollY = 0;
let scrollTimeout = null;

// Reference to camera
let camera = null;

// Camera Z range - very long travel through deep space
const CAMERA_START_Z = 100;
const CAMERA_TRAVEL = 2000; // How far camera moves on full scroll

// Scroll handler - updates target immediately
// Inverted: scroll UP to progress (start at bottom, scroll up to advance)
function onScroll() {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const rawProgress = scrollHeight > 0 ? 1 - (window.scrollY / scrollHeight) : 0;

  // Detect scroll direction
  const currentScrollY = window.scrollY;
  const scrollDelta = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;

  // Check if we're at the start (bottom of page)
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  isAtStart = window.scrollY >= maxScroll - 5; // Within 5px of bottom

  // If at start and scrolling DOWN (backwards), apply elastic effect
  if (isAtStart && scrollDelta > 0) {
    // Add to elastic offset with resistance
    elasticOffset -= scrollDelta * ELASTIC_RESISTANCE * 0.001;
    // Clamp to max stretch
    elasticOffset = Math.max(ELASTIC_MAX, elasticOffset);

    // Clear any existing snapback timeout
    if (scrollTimeout) clearTimeout(scrollTimeout);

    // Set timeout to start snapback when scrolling stops
    scrollTimeout = setTimeout(() => {
      // Snapback will happen in update()
    }, 50);
  }

  targetProgress = rawProgress;
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
  elasticOffset = 0;
  lastScrollY = 0;

  window.addEventListener('scroll', onScroll, { passive: true });
  console.log('[LIFTOFF] Scroll tracking initialized (scroll UP to progress)');
}

// Scroll to starting position (must be called after scroll spacer is created)
function scrollToStart() {
  // Start at the bottom of the page (scroll UP to progress)
  window.scrollTo(0, document.documentElement.scrollHeight);
  targetProgress = 0;
  currentProgress = 0;
  elasticOffset = 0;
  lastScrollY = document.documentElement.scrollHeight;
  console.log('[LIFTOFF] Scrolled to start position (bottom)');
}

// Update camera position (called each frame)
function update() {
  if (!camera) return;

  // Lerp current toward target for smooth inertia
  currentProgress += (targetProgress - currentProgress) * LERP_FACTOR;

  // Snap back elastic offset toward 0
  if (elasticOffset < 0) {
    elasticOffset += Math.abs(elasticOffset) * ELASTIC_SNAPBACK;
    if (elasticOffset > -0.001) {
      elasticOffset = 0;
    }
  }

  // Only snap at the very ends (0 and 1) when extremely close
  if (targetProgress === 0 && currentProgress < 0.0001 && elasticOffset === 0) {
    currentProgress = 0;
  } else if (targetProgress === 1 && currentProgress > 0.9999) {
    currentProgress = 1;
  }

  // Combine progress with elastic offset for final position
  const effectiveProgress = currentProgress + elasticOffset;

  // Move camera forward on scroll (flying through space)
  camera.position.z = CAMERA_START_Z - effectiveProgress * CAMERA_TRAVEL;
}

// Get current scroll progress (0 to 1) - returns the smoothed value with elastic
function getProgress() {
  return Math.max(0, currentProgress + elasticOffset);
}

// Cleanup
function destroy() {
  window.removeEventListener('scroll', onScroll);
  if (scrollTimeout) clearTimeout(scrollTimeout);
  camera = null;
}

export { init, scrollToStart, update, getProgress, destroy };

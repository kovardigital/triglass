/* ==========================================================================
   Liftoff - Scroll Module
   Scroll tracking with inertia, camera Z position, and elastic bounce
   ========================================================================== */

// Scroll state - target is actual scroll, current lerps toward it for smoothness
let targetProgress = 0;
let currentProgress = 0;

// Inertia settings
const LERP_FACTOR = 0.08; // Lower = more inertia (0.05-0.15 feels good)

// Spring physics for elastic bounce (smooth, bouncy feel)
const SPRING_STIFFNESS = 0.025; // How quickly spring returns to rest (higher = faster)
const SPRING_DAMPING = 0.94; // Friction (lower = more bouncy, higher = more damped)
const ELASTIC_MAX = -0.12; // Max stretch distance
const WHEEL_FORCE = 0.00008; // How much wheel input adds velocity (lighter feel)

// State for elastic spring
let elasticOffset = 0; // Current position (negative = stretched back)
let elasticVelocity = 0; // Current velocity
let wheelTimeout = null;
let isStretching = false; // Are we actively being pulled?

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

// Wheel handler - for elastic effect at boundaries
function onWheel(e) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const atBottom = window.scrollY >= maxScroll - 2;

  // If at bottom and scrolling DOWN (positive deltaY = scroll down), apply elastic
  if (atBottom && e.deltaY > 0) {
    isStretching = true;

    // Add velocity based on wheel input (creates smooth acceleration)
    elasticVelocity -= e.deltaY * WHEEL_FORCE;

    // Clear any existing timeout
    if (wheelTimeout) clearTimeout(wheelTimeout);

    // Mark as no longer stretching after wheel stops
    wheelTimeout = setTimeout(() => {
      isStretching = false;
    }, 100);
  }
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
  elasticVelocity = 0;
  isStretching = false;

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: true });
  console.log('[LIFTOFF] Scroll tracking initialized (scroll UP to progress)');
}

// Scroll to starting position (must be called after scroll spacer is created)
function scrollToStart() {
  // Start at the bottom of the page (scroll UP to progress)
  window.scrollTo(0, document.documentElement.scrollHeight);
  targetProgress = 0;
  currentProgress = 0;
  elasticOffset = 0;
  elasticVelocity = 0;
  isStretching = false;
  console.log('[LIFTOFF] Scrolled to start position (bottom)');
}

// Update camera position (called each frame)
function update() {
  if (!camera) return;

  // Lerp current toward target for smooth inertia
  currentProgress += (targetProgress - currentProgress) * LERP_FACTOR;

  // Spring physics for elastic bounce
  if (elasticOffset !== 0 || elasticVelocity !== 0) {
    // Spring force pulls back toward 0
    const springForce = -elasticOffset * SPRING_STIFFNESS;

    // Apply spring force to velocity
    elasticVelocity += springForce;

    // Apply damping (friction)
    elasticVelocity *= SPRING_DAMPING;

    // Update position
    elasticOffset += elasticVelocity;

    // Clamp to max stretch
    if (elasticOffset < ELASTIC_MAX) {
      elasticOffset = ELASTIC_MAX;
      elasticVelocity *= -0.3; // Bounce off the limit
    }

    // Clamp to 0 (can't stretch forward)
    if (elasticOffset > 0) {
      elasticOffset = 0;
      elasticVelocity = 0;
    }

    // Settle when very close to rest
    if (Math.abs(elasticOffset) < 0.0005 && Math.abs(elasticVelocity) < 0.0001) {
      elasticOffset = 0;
      elasticVelocity = 0;
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

// Get elastic offset for other modules to use (negative when pulled back)
function getElasticOffset() {
  return elasticOffset;
}

// Cleanup
function destroy() {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('wheel', onWheel);
  if (wheelTimeout) clearTimeout(wheelTimeout);
  camera = null;
}

export { init, scrollToStart, update, getProgress, getElasticOffset, destroy };

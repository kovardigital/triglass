/* ==========================================================================
   Liftoff - Scroll Module
   Scroll tracking and camera Z position
   ========================================================================== */

// Scroll state
let scrollProgress = 0;

// Reference to camera
let camera = null;

// Camera Z range
const CAMERA_START_Z = 100;
const CAMERA_TRAVEL = 400; // How far camera moves on full scroll

// Scroll handler
function onScroll() {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
}

// Initialize scroll tracking
function init(cam) {
  camera = cam;
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Initial calculation
  console.log('[LIFTOFF] Scroll tracking initialized');
}

// Update camera position (called each frame)
function update() {
  if (!camera) return;

  // Move camera forward on scroll (flying through space)
  camera.position.z = CAMERA_START_Z - scrollProgress * CAMERA_TRAVEL;
}

// Get current scroll progress (0 to 1)
function getProgress() {
  return scrollProgress;
}

// Cleanup
function destroy() {
  window.removeEventListener('scroll', onScroll);
  camera = null;
}

export { init, update, getProgress, destroy };

/* ==========================================================================
   Liftoff - Parallax Module
   Mouse tracking and world rotation for "steering" effect
   ========================================================================== */

// Mouse state
let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;

// Reference to world group
let worldGroup = null;

// Smoothing factor (lower = smoother/slower)
const SMOOTHING = 0.05;

// Rotation multipliers
const ROTATION_Z = 0.15; // Steering feel
const ROTATION_X = 0.08; // Vertical tilt
const ROTATION_Y = 0.1;  // Horizontal rotation

// Mouse move handler
function onMouseMove(e) {
  targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;  // -1 to 1
  targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
}

// Initialize parallax
function init(group) {
  worldGroup = group;
  document.addEventListener('mousemove', onMouseMove);
  console.log('[LIFTOFF] Parallax initialized');
}

// Update parallax (called each frame)
function update() {
  if (!worldGroup) return;

  // Smooth mouse following
  mouseX += (targetMouseX - mouseX) * SMOOTHING;
  mouseY += (targetMouseY - mouseY) * SMOOTHING;

  // Apply rotation to world group
  // Z rotation gives the "steering" feel (like fantik)
  worldGroup.rotation.z = mouseX * ROTATION_Z;
  // Subtle X and Y rotation for depth
  worldGroup.rotation.x = mouseY * ROTATION_X;
  worldGroup.rotation.y = -mouseX * ROTATION_Y;
}

// Get current mouse values (for debug display)
function getMouse() {
  return { x: mouseX, y: mouseY };
}

// Cleanup
function destroy() {
  document.removeEventListener('mousemove', onMouseMove);
  worldGroup = null;
}

export { init, update, getMouse, destroy };

/* ==========================================================================
   Liftoff - Parallax Module
   Mouse tracking and world rotation for "steering" effect
   Based on fantik.studio implementation
   ========================================================================== */

// Mouse position state (normalized -1 to 1)
let mouseX = 0;
let mouseY = 0;
let prevMouseX = 0;
let prevMouseY = 0;

// Inertia for Z rotation (accumulated from mouse delta)
let inertiaZ = 0;

// Reference to world group
let worldGroup = null;

// Configuration (matching fantik values)
const CONFIG = {
  rotation: {
    strengthX: 0.025,   // How much mouse Y affects X rotation
    strengthY: 0.08,    // How much mouse X affects Y rotation
    strengthZ: 0.08,    // How much mouse delta affects Z inertia
    damp: 0.08,         // General rotation damping
    inertiaDecayZ: 0.85, // How fast Z inertia decays
    returnDampZ: 0.04   // How fast Z rotation returns to zero
  },
  position: {
    strengthX: 1.5,     // X parallax strength
    strengthY: 0.5,     // Y parallax strength (minimal)
    damp: 0.08          // Position damping
  }
};

// Current rotation values (smoothed)
let rotationX = 0;
let rotationY = 0;
let rotationZ = 0;

// Mouse move handler
function onMouseMove(e) {
  // Store previous
  prevMouseX = mouseX;
  prevMouseY = mouseY;

  // Update current (normalized -1 to 1)
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

  // Calculate delta
  const deltaX = mouseX - prevMouseX;

  // Accumulate delta into Z inertia
  inertiaZ += deltaX * CONFIG.rotation.strengthZ;
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

  // Target rotations based on mouse position - everything moves WITH mouse
  const targetRotX = mouseY * CONFIG.rotation.strengthX;
  const targetRotY = mouseX * CONFIG.rotation.strengthY;

  // Smooth rotation X and Y towards target
  rotationX += (targetRotX - rotationX) * CONFIG.rotation.damp;
  rotationY += (targetRotY - rotationY) * CONFIG.rotation.damp;

  // Z rotation: add inertia, then return to zero
  rotationZ += inertiaZ * CONFIG.rotation.damp;
  rotationZ += (0 - rotationZ) * CONFIG.rotation.returnDampZ;

  // Decay inertia
  inertiaZ *= CONFIG.rotation.inertiaDecayZ;

  // Apply to world group
  worldGroup.rotation.x = rotationX;
  worldGroup.rotation.y = rotationY;
  worldGroup.rotation.z = rotationZ;
}

// Get current mouse values (for other modules)
function getMouse() {
  return { x: mouseX, y: mouseY };
}

// Get current rotation Z (for text to match world rotation)
function getRotationZ() {
  return rotationZ;
}

// Cleanup
function destroy() {
  document.removeEventListener('mousemove', onMouseMove);
  worldGroup = null;
}

export { init, update, getMouse, getRotationZ, destroy };

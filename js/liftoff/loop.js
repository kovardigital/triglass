/* ==========================================================================
   Liftoff - Animation Loop Module
   Manages requestAnimationFrame and update callbacks
   ========================================================================== */

import { scene, camera, renderer } from './core.js';

// Registry of update functions
const updateFns = new Map();

// Animation state
let animationId = null;
let isRunning = false;

// Main animation loop
function animate() {
  if (!isRunning) return;

  animationId = requestAnimationFrame(animate);

  // Call all registered update functions
  updateFns.forEach((fn, name) => {
    try {
      fn();
    } catch (e) {
      console.error(`[LIFTOFF] Error in update function "${name}":`, e);
    }
  });

  // Render the scene
  renderer.render(scene, camera);
}

// Register an update function
function onUpdate(name, fn) {
  updateFns.set(name, fn);
}

// Remove an update function
function offUpdate(name) {
  updateFns.delete(name);
}

// Start the animation loop
function start() {
  if (isRunning) return;
  isRunning = true;
  animate();
  console.log('%c[LIFTOFF] Animation loop started', 'color: #10b981');
}

// Stop the animation loop
function stop() {
  isRunning = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  console.log('[LIFTOFF] Animation loop stopped');
}

export { start, stop, onUpdate, offUpdate };

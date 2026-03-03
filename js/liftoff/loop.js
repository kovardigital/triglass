/* ==========================================================================
   Liftoff - Animation Loop Module
   Manages requestAnimationFrame and update callbacks
   ========================================================================== */

import { scene, camera, renderer } from './core.js';

// Registry of update functions
const updateFns = new Map();

// Custom render function (for effects like blur)
let customRenderFn = null;

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

  // Use custom render if set, otherwise standard render
  if (customRenderFn) {
    customRenderFn(renderer, scene, camera);
  } else {
    renderer.render(scene, camera);
  }
}

// Register an update function
function onUpdate(name, fn) {
  updateFns.set(name, fn);
}

// Remove an update function
function offUpdate(name) {
  updateFns.delete(name);
}

// Set custom render function (for post-processing effects)
function setCustomRender(fn) {
  customRenderFn = fn;
}

// Clear custom render function
function clearCustomRender() {
  customRenderFn = null;
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

export { start, stop, onUpdate, offUpdate, setCustomRender, clearCustomRender };

/* ==========================================================================
   Liftoff - Starfield Module
   Three.js particle system for background stars
   ========================================================================== */

import * as THREE from 'three';

// Configuration
const STAR_COUNT = 2000;

// Module state
let stars = null;
let material = null;

// Initialize starfield
function init(worldGroup) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(STAR_COUNT * 3);

  for (let i = 0; i < STAR_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 3000;     // X: wider spread
    positions[i * 3 + 1] = (Math.random() - 0.5) * 3000; // Y: wider spread
    // Z: all stars behind camera (-200 to -2000), none in front
    positions[i * 3 + 2] = -200 - Math.random() * 1800;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2.5,
    transparent: true,
    opacity: 1.0,
    sizeAttenuation: true
  });

  stars = new THREE.Points(geometry, material);
  worldGroup.add(stars);

  console.log('[LIFTOFF] Starfield created with', STAR_COUNT, 'stars');
}

// Update starfield (subtle twinkle effect)
function update() {
  if (!material) return;

  const time = Date.now() * 0.001;
  // Keep brightness high (0.9 to 1.0)
  material.opacity = 0.95 + Math.sin(time) * 0.05;
}

// Cleanup
function destroy() {
  if (stars) {
    stars.geometry.dispose();
    material.dispose();
    stars = null;
    material = null;
  }
}

export { init, update, destroy };

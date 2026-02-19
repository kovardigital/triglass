/* ==========================================================================
   Liftoff - Core Module
   Scene, camera, renderer, and worldGroup setup
   ========================================================================== */

import * as THREE from 'three';

// Create canvas container
const container = document.createElement('div');
container.id = 'liftoff-canvas';
container.style.opacity = '0';
container.style.transition = 'opacity 3s ease-out';
document.body.appendChild(container);

// Reveal the scene (called after text starts animating)
function revealScene() {
  container.style.opacity = '1';
  console.log('[LIFTOFF] Scene fading in');
}

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.z = 100;

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// World group - rotated by parallax for "steering" effect
const worldGroup = new THREE.Group();
scene.add(worldGroup);

// Handle resize
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

// Cleanup function
function destroy() {
  window.removeEventListener('resize', onResize);
  renderer.dispose();
  container.remove();
}

console.log('%c[LIFTOFF] Core initialized', 'color: #6b7cff');

export { scene, camera, renderer, worldGroup, container, revealScene, destroy };

/* ==========================================================================
   Liftoff - Asteroids Module
   Three.js asteroid objects with rotation and mouse parallax
   ========================================================================== */

import * as THREE from 'three';
import * as Parallax from './parallax.js';

// Asteroid configurations - positions spread out more, with depth factor for parallax
const ASTEROID_CONFIGS = [
  { x: -120, y: 60, z: -150, size: 18, rotSpeed: 0.002, depth: 0.3 },
  { x: 150, y: -40, z: -250, size: 30, rotSpeed: 0.001, depth: 0.5 },
  { x: -80, y: -80, z: -100, size: 12, rotSpeed: 0.003, depth: 0.2 },
  { x: 180, y: 70, z: -350, size: 35, rotSpeed: 0.0015, depth: 0.7 },
  { x: -150, y: 30, z: -200, size: 25, rotSpeed: 0.002, depth: 0.4 },
  { x: 90, y: -70, z: -300, size: 22, rotSpeed: 0.0025, depth: 0.6 },
];

// Module state
let asteroidGroup = null;
const asteroids = [];

// Initialize asteroids
function init(worldGroup) {
  asteroidGroup = new THREE.Group();
  worldGroup.add(asteroidGroup);

  ASTEROID_CONFIGS.forEach(config => {
    const geometry = new THREE.IcosahedronGeometry(config.size, 1);

    // Distort vertices for rocky look
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const noise = 0.8 + Math.random() * 0.4;
      positions.setXYZ(i, x * noise, y * noise, z * noise);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      wireframe: false,
      transparent: true,
      opacity: 0.8
    });

    const asteroid = new THREE.Mesh(geometry, material);
    asteroid.position.set(config.x, config.y, config.z);
    asteroid.userData = {
      rotSpeed: config.rotSpeed,
      depth: config.depth,
      baseX: config.x,
      baseY: config.y,
      baseZ: config.z
    };

    asteroidGroup.add(asteroid);
    asteroids.push(asteroid);
  });

  console.log('[LIFTOFF] Asteroids created:', asteroids.length);
}

// Update asteroids (rotation + individual mouse parallax)
function update() {
  const mouse = Parallax.getMouse();

  asteroids.forEach(asteroid => {
    // Rotation animation
    asteroid.rotation.x += asteroid.userData.rotSpeed;
    asteroid.rotation.y += asteroid.userData.rotSpeed * 0.7;

    // Individual parallax based on depth
    // Deeper asteroids (higher depth value) move more with mouse
    const depth = asteroid.userData.depth;
    const parallaxX = -mouse.x * depth * 60;
    const parallaxY = -mouse.y * depth * 50;

    asteroid.position.x = asteroid.userData.baseX + parallaxX;
    asteroid.position.y = asteroid.userData.baseY + parallaxY;
  });
}

// Cleanup
function destroy() {
  asteroids.forEach(asteroid => {
    asteroid.geometry.dispose();
    asteroid.material.dispose();
  });
  asteroids.length = 0;
  asteroidGroup = null;
}

export { init, update, destroy };

/* ==========================================================================
   Liftoff - Asteroids Module
   Physics-based asteroids with Cannon.js and mouse repulsion
   ========================================================================== */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import * as Parallax from './parallax.js';

// Physics world
let world = null;

// Number of asteroids
const ASTEROID_COUNT = 40;

// Module state
let asteroidGroup = null;
const asteroids = []; // { mesh, body, baseZ }

// Mouse repulsion settings
const MOUSE_REPEL_STRENGTH = 8000;  // Strong immediate repulsion
const MOUSE_REPEL_RADIUS = 80;      // Tight interaction radius around cursor

// Physics settings
const DAMPING = 0.15;               // Low damping - asteroids drift freely

// Distance fade settings - quick fade in from distance
const FADE_START_DISTANCE = 1900;   // Fully opaque at this distance
const FADE_END_DISTANCE = 2000;     // Fully invisible at this distance (only 100 unit fade)

// Initialize physics world and asteroids
function init(worldGroup) {
  try {
    console.log('[LIFTOFF] Initializing physics asteroids...');

    // Create physics world with no gravity (space!)
    world = new CANNON.World();
    world.gravity.set(0, 0, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 5;

  asteroidGroup = new THREE.Group();
  worldGroup.add(asteroidGroup);

  // Create asteroids spread throughout Z depth
  for (let i = 0; i < ASTEROID_COUNT; i++) {
    createAsteroid(i);
  }

    console.log('[LIFTOFF] Physics asteroids created:', asteroids.length);
  } catch (error) {
    console.error('[LIFTOFF] Failed to initialize physics asteroids:', error);
  }
}

// Simple 3D noise function for natural-looking deformation
function noise3D(x, y, z, seed) {
  const n = Math.sin(x * 1.5 + seed) * Math.cos(y * 1.3 + seed * 0.7) * Math.sin(z * 1.7 + seed * 1.3);
  const n2 = Math.sin(x * 3.1 + seed * 2) * Math.cos(y * 2.7 + seed * 1.5) * Math.sin(z * 2.9 + seed * 0.9);
  return n * 0.6 + n2 * 0.4;
}

// Create a single asteroid with mesh and physics body
function createAsteroid(index) {
  // Varied asteroid sizes - from small to large
  const size = 8 + Math.random() * 60;

  // Icosahedron with noise-based deformation for rocky look
  const geometry = new THREE.IcosahedronGeometry(size, 2);
  const positions = geometry.attributes.position;
  const seed = Math.random() * 100;

  // Deform vertices using noise for natural rocky appearance
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Normalize to get direction
    const len = Math.sqrt(x * x + y * y + z * z);
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;

    // Apply noise-based displacement
    const noiseVal = noise3D(nx * 2, ny * 2, nz * 2, seed);
    const displacement = 0.8 + noiseVal * 0.4; // 0.6 to 1.2 range

    positions.setXYZ(i, x * displacement, y * displacement, z * displacement);
  }

  geometry.computeVertexNormals();

  // Simple dark grey material
  const shade = 0.003 + Math.random() * 0.007; // 0.003 to 0.01 - very dark
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(shade, shade, shade),
    transparent: true,
    opacity: 1,  // Fully opaque by default
    depthWrite: true  // Ensure solid rendering
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Spread asteroids deep into Z space for long-distance travel feel
  // Camera goes from z=100 to z=-1900, stretch asteroids much farther
  const x = (Math.random() - 0.5) * 600;
  const y = (Math.random() - 0.5) * 400;
  const z = -200 - Math.random() * 5000; // Spread from z=-200 to z=-5200 (very deep)

  mesh.position.set(x, y, z);
  mesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

  asteroidGroup.add(mesh);

  // Create physics body
  const shape = new CANNON.Sphere(size * 0.8); // Slightly smaller collision
  const body = new CANNON.Body({
    mass: size * 0.5,
    shape: shape,
    linearDamping: DAMPING,
    angularDamping: 0.02  // Very low - rotation persists
  });
  body.position.set(x, y, z);
  body.quaternion.setFromEuler(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);

  // More varied rotation - some slow, some fast
  const rotSpeed = 0.1 + Math.random() * 0.8; // 0.1 to 0.9 range (much more variation)
  body.angularVelocity.set(
    (Math.random() - 0.5) * rotSpeed,
    (Math.random() - 0.5) * rotSpeed,
    (Math.random() - 0.5) * rotSpeed
  );

  world.addBody(body);

  asteroids.push({
    mesh,
    body,
    baseX: x,  // Store original position
    baseY: y,
    baseZ: z,
    size,
    rotSpeed: 0.001 + Math.random() * 0.002
  });
}

// Update physics and sync meshes
function update(camera) {
  if (!world) return;

  try {
    const mouse = Parallax.getMouse();
    const camZ = camera.position.z;

    // Camera FOV in radians (half angle)
    const fovRad = (camera.fov / 2) * (Math.PI / 180);
    const aspect = camera.aspect;

    // Center of mass for force application (local coordinates)
    const centerOfMass = new CANNON.Vec3(0, 0, 0);

    // Apply forces to each asteroid
    asteroids.forEach(asteroid => {
      const pos = asteroid.body.position;

      // Calculate mouse position at THIS asteroid's Z depth
      // Distance from camera to asteroid
      const distToAsteroid = camZ - pos.z;

      // Visible height/width at that distance (perspective projection)
      const visibleHeight = 2 * distToAsteroid * Math.tan(fovRad);
      const visibleWidth = visibleHeight * aspect;

      // Mouse position in world space at asteroid's Z depth
      const mouseX = mouse.x * (visibleWidth / 2);
      const mouseY = mouse.y * (visibleHeight / 2);

      // Mouse repulsion force (2D distance at same Z plane)
      const dx = pos.x - mouseX;
      const dy = pos.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOUSE_REPEL_RADIUS && dist > 0) {
        // Repulsion force - stronger when closer
        const falloff = Math.pow(1 - dist / MOUSE_REPEL_RADIUS, 2);
        const strength = MOUSE_REPEL_STRENGTH * falloff;
        const force = new CANNON.Vec3(
          (dx / dist) * strength,
          (dy / dist) * strength,
          0  // No Z force - push sideways only
        );
        asteroid.body.applyForce(force, centerOfMass);
      }
    });

  // Step physics simulation
  world.step(1 / 60);

  // Sync Three.js meshes with physics bodies and update distance-based opacity
  asteroids.forEach(asteroid => {
    asteroid.mesh.position.copy(asteroid.body.position);
    asteroid.mesh.quaternion.copy(asteroid.body.quaternion);

    // Calculate distance from camera to asteroid
    const distToAsteroid = camZ - asteroid.body.position.z;

    // Fade based on distance: fully visible when close, invisible when far
    let opacity = 1;
    if (distToAsteroid > FADE_END_DISTANCE) {
      opacity = 0;
    } else if (distToAsteroid > FADE_START_DISTANCE) {
      // Linear fade between start and end distances
      opacity = 1 - (distToAsteroid - FADE_START_DISTANCE) / (FADE_END_DISTANCE - FADE_START_DISTANCE);
    }
    asteroid.mesh.material.opacity = opacity;
  });

    // Apply world group rotation (parallax)
    const rotZ = Parallax.getRotationZ();
    if (asteroidGroup) {
      asteroidGroup.rotation.z = rotZ;
    }
  } catch (error) {
    console.error('[LIFTOFF] Asteroids update error:', error);
  }
}

// Cleanup
function destroy() {
  asteroids.forEach(asteroid => {
    asteroid.mesh.geometry.dispose();
    asteroid.mesh.material.dispose();
    world.removeBody(asteroid.body);
  });
  asteroids.length = 0;
  asteroidGroup = null;
  world = null;
}

export { init, update, destroy };

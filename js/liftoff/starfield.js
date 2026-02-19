/* ==========================================================================
   Liftoff - Starfield Module
   Two layers of stars: distant large stars + closer small stars
   Stars fade in/out over random ~4 second lifecycle
   ========================================================================== */

import * as THREE from 'three';

// Configuration
const STAR_LIFECYCLE_BASE = 4.0; // base seconds for full fade in/out cycle
const STAR_LIFECYCLE_VARIANCE = 2.0; // +/- variance (so 2-6 seconds range)

// Layer 1: Distant large stars (far background)
const DISTANT_STAR_COUNT = 800;
const DISTANT_STAR_SIZE = 8;
const DISTANT_Z_MIN = 2000;  // Very far back
const DISTANT_Z_RANGE = 4000;

// Layer 2: Closer small stars (mid-ground twinkle)
const CLOSE_STAR_COUNT = 1000;
const CLOSE_STAR_SIZE = 2;
const CLOSE_Z_MIN = 500;
const CLOSE_Z_RANGE = 1500;

// Layer 3: Ultra-distant stars (galaxy distance, synced with camera)
const ULTRA_DISTANT_STAR_COUNT = 2500;
const ULTRA_DISTANT_STAR_SIZE = 6;
const ULTRA_DISTANT_Z_OFFSET = -2500; // Same as galaxy offset

// Module state
let distantStars = null;
let distantMaterial = null;
let distantLifetimes = null;
let distantDurations = null;

let closeStars = null;
let closeMaterial = null;
let closeLifetimes = null;
let closeDurations = null;

let ultraDistantStars = null;
let ultraDistantMaterial = null;
let ultraDistantLifetimes = null;
let ultraDistantDurations = null;

// Create ultra-distant star layer (syncs with camera like galaxy)
function createUltraDistantLayer(count, size, zOffset, worldGroup) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count);
  const durations = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Spread wider since they're further away
    positions[i * 3] = (Math.random() - 0.5) * 8000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8000;
    positions[i * 3 + 2] = zOffset + (Math.random() - 0.5) * 500; // Small z variance around offset

    colors[i * 3] = 1;
    colors[i * 3 + 1] = 1;
    colors[i * 3 + 2] = 1;

    // Slower lifecycle for distant stars
    durations[i] = STAR_LIFECYCLE_BASE * 1.5 + (Math.random() - 0.5) * STAR_LIFECYCLE_VARIANCE * 2;
    lifetimes[i] = Math.random() * durations[i];
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: size,
    transparent: true,
    opacity: 0.6, // Slightly dimmer to match galaxy opacity
    vertexColors: true,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });

  const stars = new THREE.Points(geometry, material);
  worldGroup.add(stars);

  return { stars, material, lifetimes, durations, basePositions: positions.slice() };
}

// Create a star layer
function createStarLayer(count, size, zMin, zRange, worldGroup) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count);
  const durations = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6000;
    positions[i * 3 + 2] = -zMin - Math.random() * zRange;

    colors[i * 3] = 1;
    colors[i * 3 + 1] = 1;
    colors[i * 3 + 2] = 1;

    // Random lifecycle duration per star
    durations[i] = STAR_LIFECYCLE_BASE + (Math.random() - 0.5) * STAR_LIFECYCLE_VARIANCE * 2;
    // Random starting phase
    lifetimes[i] = Math.random() * durations[i];
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: size,
    transparent: true,
    opacity: 1.0,
    vertexColors: true,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });

  const stars = new THREE.Points(geometry, material);
  worldGroup.add(stars);

  return { stars, material, lifetimes, durations, zMin, zRange };
}

// Update a star layer
function updateStarLayer(layer, camera, deltaTime) {
  const { stars, lifetimes, durations, zMin, zRange } = layer;
  const colors = stars.geometry.attributes.color.array;
  const positions = stars.geometry.attributes.position.array;
  const count = lifetimes.length;
  const camZ = camera ? camera.position.z : 0;

  for (let i = 0; i < count; i++) {
    const duration = durations[i];
    lifetimes[i] += deltaTime;

    const progress = (lifetimes[i] % duration) / duration;
    const brightness = Math.sin(progress * Math.PI);

    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness;
    colors[i * 3 + 2] = brightness;

    if (lifetimes[i] >= duration) {
      lifetimes[i] = 0;
      // New random duration for next cycle
      durations[i] = STAR_LIFECYCLE_BASE + (Math.random() - 0.5) * STAR_LIFECYCLE_VARIANCE * 2;
      positions[i * 3] = (Math.random() - 0.5) * 6000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6000;
      positions[i * 3 + 2] = camZ - zMin - Math.random() * zRange;
    }
  }

  stars.geometry.attributes.color.needsUpdate = true;
  stars.geometry.attributes.position.needsUpdate = true;
}

// Initialize both starfields
function init(worldGroup) {
  // Distant large stars
  const distant = createStarLayer(DISTANT_STAR_COUNT, DISTANT_STAR_SIZE, DISTANT_Z_MIN, DISTANT_Z_RANGE, worldGroup);
  distantStars = distant.stars;
  distantMaterial = distant.material;
  distantLifetimes = distant.lifetimes;
  distantDurations = distant.durations;

  // Close small stars
  const close = createStarLayer(CLOSE_STAR_COUNT, CLOSE_STAR_SIZE, CLOSE_Z_MIN, CLOSE_Z_RANGE, worldGroup);
  closeStars = close.stars;
  closeMaterial = close.material;
  closeLifetimes = close.lifetimes;
  closeDurations = close.durations;

  // Ultra-distant stars (galaxy distance, synced with camera)
  const ultraDistant = createUltraDistantLayer(ULTRA_DISTANT_STAR_COUNT, ULTRA_DISTANT_STAR_SIZE, ULTRA_DISTANT_Z_OFFSET, worldGroup);
  ultraDistantStars = ultraDistant.stars;
  ultraDistantMaterial = ultraDistant.material;
  ultraDistantLifetimes = ultraDistant.lifetimes;
  ultraDistantDurations = ultraDistant.durations;

  console.log('[LIFTOFF] Triple starfield created:', DISTANT_STAR_COUNT, 'distant +', CLOSE_STAR_COUNT, 'close +', ULTRA_DISTANT_STAR_COUNT, 'ultra-distant stars');
}

// Update all starfields
function update(camera) {
  if (!distantStars || !closeStars) return;

  const deltaTime = 1 / 60;
  const time = Date.now() * 0.001;

  // Update distant layer
  updateStarLayer(
    { stars: distantStars, lifetimes: distantLifetimes, durations: distantDurations, zMin: DISTANT_Z_MIN, zRange: DISTANT_Z_RANGE },
    camera,
    deltaTime
  );

  // Update close layer
  updateStarLayer(
    { stars: closeStars, lifetimes: closeLifetimes, durations: closeDurations, zMin: CLOSE_Z_MIN, zRange: CLOSE_Z_RANGE },
    camera,
    deltaTime
  );

  // Update ultra-distant layer (synced with camera like galaxy)
  if (ultraDistantStars && camera) {
    // Sync z position with camera so stars have no depth movement
    ultraDistantStars.position.z = camera.position.z;

    // Update twinkling
    const colors = ultraDistantStars.geometry.attributes.color.array;
    const count = ultraDistantLifetimes.length;

    for (let i = 0; i < count; i++) {
      ultraDistantLifetimes[i] += deltaTime;
      const duration = ultraDistantDurations[i];
      const progress = (ultraDistantLifetimes[i] % duration) / duration;
      const brightness = Math.sin(progress * Math.PI);

      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;

      if (ultraDistantLifetimes[i] >= duration) {
        ultraDistantLifetimes[i] = 0;
        ultraDistantDurations[i] = STAR_LIFECYCLE_BASE * 1.5 + (Math.random() - 0.5) * STAR_LIFECYCLE_VARIANCE * 2;
      }
    }
    ultraDistantStars.geometry.attributes.color.needsUpdate = true;
  }

  // Subtle size pulsing for distant stars only
  distantMaterial.size = DISTANT_STAR_SIZE + Math.sin(time * 3) * 0.5;
}

// Cleanup
function destroy() {
  if (distantStars) {
    distantStars.geometry.dispose();
    distantMaterial.dispose();
    distantStars = null;
    distantMaterial = null;
    distantLifetimes = null;
    distantDurations = null;
  }
  if (closeStars) {
    closeStars.geometry.dispose();
    closeMaterial.dispose();
    closeStars = null;
    closeMaterial = null;
    closeLifetimes = null;
    closeDurations = null;
  }
  if (ultraDistantStars) {
    ultraDistantStars.geometry.dispose();
    ultraDistantMaterial.dispose();
    ultraDistantStars = null;
    ultraDistantMaterial = null;
    ultraDistantLifetimes = null;
    ultraDistantDurations = null;
  }
}

export { init, update, destroy };

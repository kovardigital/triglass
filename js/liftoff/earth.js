/* ==========================================================================
   Liftoff - Earth Module
   3D Earth sphere for The Story section
   ========================================================================== */

import * as THREE from 'three';
import * as Scroll from './scroll.js';
import * as Parallax from './parallax.js';

// Configuration
const STORY_SECTION = 4; // Index of THE STORY section
const EARTH_RADIUS = 200; // Larger Earth
const EARTH_SEGMENTS = 64;

// Module state
let earthGroup = null;
let earthMesh = null;
let earthSphere = null;
let time = 0;
let isInitialized = false;
let labelsContainer = null;
let sectionTitle = null;
let sectionSubtitle = null;
let camera = null;
let renderer = null;

// Mouse rotation state
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let targetRotationY = 6.47; // Initial rotation (-60 degrees from 7.52)
let targetRotationX = 0;
let currentRotationY = 6.47;
let currentRotationX = 0;
const ROTATION_SPEED = 0.005;
const ROTATION_DAMPING = 0.1;

// Create Earth mesh
function createEarth() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, EARTH_SEGMENTS, EARTH_SEGMENTS);
  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = 'anonymous';

  // Use Earth Atmos texture (globe 4)
  const texture = textureLoader.load(
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      console.log('[LIFTOFF] Earth texture loaded');
    },
    undefined,
    (error) => {
      console.error('[LIFTOFF] Failed to load Earth texture:', error);
    }
  );

  // Use MeshBasicMaterial for solid rendering (no transparency issues)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
  });

  const earth = new THREE.Mesh(geometry, material);
  // Position adjusted: larger radius means center needs to move down to keep top in same place
  // Original: radius 100, y = 50, so top was at y = 150
  // New: radius 150, to keep top at y = 150, center needs to be at y = 0
  earth.position.y = 0;
  // Initial rotation set via targetRotationY, applied in update()

  console.log('[LIFTOFF] Created Earth with Earth Atmos texture');

  return earth;
}

// Create HTML labels
function createLabels() {
  const style = document.createElement('style');
  style.textContent = `
    .earth-labels {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 50;
      opacity: 0;
      transition: opacity 0.3s ease-out;
    }
    .earth-labels.visible {
      opacity: 1;
    }
    .earth-section-title {
      position: absolute;
      font-family: 'montserrat', sans-serif;
      font-size: clamp(19px, 3.2vw, 38px);
      font-weight: 500;
      color: #fff;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      transform: translateX(-50%);
    }
    .earth-section-subtitle {
      position: absolute;
      font-family: 'montserrat', sans-serif;
      font-size: clamp(10px, 1.2vw, 13px);
      font-weight: 300;
      color: rgba(255,255,255,0.7);
      text-align: center;
      letter-spacing: 0.02em;
      white-space: nowrap;
      transform: translateX(-50%);
      font-style: italic;
    }
  `;
  document.head.appendChild(style);

  // Create container
  labelsContainer = document.createElement('div');
  labelsContainer.className = 'earth-labels';
  document.body.appendChild(labelsContainer);

  // Create section title and subtitle
  sectionTitle = document.createElement('div');
  sectionTitle.className = 'earth-section-title';
  sectionTitle.textContent = 'THE STORY';
  labelsContainer.appendChild(sectionTitle);

  sectionSubtitle = document.createElement('div');
  sectionSubtitle.className = 'earth-section-subtitle';
  sectionSubtitle.textContent = 'Begin The Adventure';
  labelsContainer.appendChild(sectionSubtitle);
}

// Mouse event handlers for rotation
function onMouseDown(e) {
  // Only start dragging if Earth is visible
  if (!earthGroup || !earthGroup.visible) return;
  isDragging = true;
  previousMouseX = e.clientX;
  previousMouseY = e.clientY;
}

function onMouseMove(e) {
  if (!isDragging) return;

  const deltaX = e.clientX - previousMouseX;
  const deltaY = e.clientY - previousMouseY;

  targetRotationY += deltaX * ROTATION_SPEED;
  targetRotationX += deltaY * ROTATION_SPEED;

  // Clamp vertical rotation to prevent flipping
  targetRotationX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, targetRotationX));

  previousMouseX = e.clientX;
  previousMouseY = e.clientY;
}

function onMouseUp() {
  isDragging = false;
}

// Initialize Earth
function init(parentGroup, threeCamera, threeRenderer) {
  if (isInitialized) return;

  camera = threeCamera;
  renderer = threeRenderer;

  earthGroup = new THREE.Group();
  earthGroup.position.z = -500;

  // Create Earth mesh
  earthMesh = createEarth();

  // Position Earth lower (below text) - adjusted for larger radius
  // Moved down further for larger Earth
  earthMesh.position.y = -180;

  earthGroup.add(earthMesh);

  parentGroup.add(earthGroup);

  // Add a simple ambient light for the Earth
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  earthGroup.add(ambientLight);

  // Add directional light for sun effect (side lighting)
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
  sunLight.position.set(5, 3, 5);
  earthGroup.add(sunLight);

  // Add front light from camera/viewer direction
  const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
  frontLight.position.set(0, 0, 200); // From the front (where camera comes from)
  earthGroup.add(frontLight);

  // Add light from above camera, pointed at Earth
  const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
  topLight.position.set(0, 300, 200); // Above and in front
  topLight.target = earthMesh; // Point at the Earth
  earthGroup.add(topLight);
  earthGroup.add(topLight.target);

  // Create HTML labels
  createLabels();

  // Add mouse event listeners for rotation
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mouseleave', onMouseUp);

  isInitialized = true;

  console.log('[LIFTOFF] Earth initialized with mouse rotation');
}

// Update Earth based on scroll and time
function update() {
  if (!earthGroup || !isInitialized) return;

  time += 0.016;

  const scrollProgress = Scroll.getProgress();
  const numSections = 6;
  const sectionFloat = scrollProgress * (numSections - 1);
  const sectionIndex = Math.floor(sectionFloat);
  const sectionProgress = sectionFloat - sectionIndex;

  // Calculate Z position based on section
  // Section 4 (THE STORY): camera goes from -4000 to -5000
  // Position Earth to be visible during this range
  const IMAGE_START_Z = -4800;
  const IMAGE_END_Z = -3400;
  const zRange = 3;
  const zDistance = (IMAGE_END_Z - IMAGE_START_Z) * zRange;
  const sectionStartZ = IMAGE_START_Z - (zDistance - (IMAGE_END_Z - IMAGE_START_Z)) / 2;

  let groupOpacity = 0;
  let groupZ = sectionStartZ;

  if (sectionIndex === STORY_SECTION) {
    const t = Math.min(1, sectionProgress);
    groupZ = sectionStartZ + zDistance * t;

    // Fade in/out
    if (t < 0.15) {
      groupOpacity = t / 0.15;
    } else if (t > 0.75) {
      groupOpacity = 1 - ((t - 0.75) / 0.25);
    } else {
      groupOpacity = 1;
    }

    // Additional fade when close to camera
    const distanceToCamera = camera.position.z - groupZ;
    if (distanceToCamera < 300) {
      const proximityFade = Math.max(0, (distanceToCamera - 50) / 250);
      groupOpacity *= proximityFade;
    }
  } else if (sectionIndex > STORY_SECTION) {
    groupZ = sectionStartZ + zDistance + 200;
    groupOpacity = 0;
  }

  earthGroup.position.z = groupZ;

  // Get parallax for subtle movement
  const parallaxMouse = Parallax.getMouse();
  const parallaxX = parallaxMouse.x * 10;
  const parallaxY = parallaxMouse.y * 8;

  // Apply parallax to Earth mesh (keeps base Y offset of -180 for larger radius)
  earthMesh.position.x = parallaxX;
  earthMesh.position.y = -180 + parallaxY;

  // Smooth rotation with damping (user can rotate with mouse)
  currentRotationY += (targetRotationY - currentRotationY) * ROTATION_DAMPING;
  currentRotationX += (targetRotationX - currentRotationX) * ROTATION_DAMPING;
  earthMesh.rotation.y = currentRotationY;
  earthMesh.rotation.x = currentRotationX;

  // Show/hide based on opacity (no transparency for testing)
  earthGroup.visible = groupOpacity > 0.01;

  // Update title/subtitle positions
  // Layout: Title -> Subtitle -> Earth (vertically stacked)
  if (camera && sectionTitle && sectionSubtitle && earthMesh) {
    if (groupOpacity > 0.01) {
      const earthWorldPos = new THREE.Vector3();
      earthMesh.getWorldPosition(earthWorldPos);

      const distanceToCamera = camera.position.z - earthWorldPos.z;

      if (distanceToCamera > 50 && distanceToCamera < 1500) {
        const baseDistance = 800;
        const scale = Math.max(0.5, Math.min(2.5, baseDistance / distanceToCamera));

        // Title above Earth (positioned relative to top of Earth)
        const titlePos = earthWorldPos.clone();
        titlePos.y += EARTH_RADIUS + 60; // Above Earth top

        // Subtitle between title and Earth
        const subtitlePos = earthWorldPos.clone();
        subtitlePos.y += EARTH_RADIUS + 20; // Below title, just above Earth top

        const titleScreen = titlePos.clone().project(camera);
        const subtitleScreen = subtitlePos.clone().project(camera);

        if (titleScreen.z < 1 && subtitleScreen.z < 1) {
          const titleX = (titleScreen.x * 0.5 + 0.5) * window.innerWidth;
          const titleY = (-titleScreen.y * 0.5 + 0.5) * window.innerHeight;
          const subtitleX = (subtitleScreen.x * 0.5 + 0.5) * window.innerWidth;
          const subtitleY = (-subtitleScreen.y * 0.5 + 0.5) * window.innerHeight;

          sectionTitle.style.left = `${titleX}px`;
          sectionTitle.style.top = `${titleY}px`;
          sectionTitle.style.transform = `translateX(-50%) scale(${scale})`;
          sectionTitle.style.opacity = groupOpacity;

          sectionSubtitle.style.left = `${subtitleX}px`;
          sectionSubtitle.style.top = `${subtitleY}px`;
          sectionSubtitle.style.transform = `translateX(-50%) scale(${scale})`;
          sectionSubtitle.style.opacity = groupOpacity;
        } else {
          sectionTitle.style.opacity = 0;
          sectionSubtitle.style.opacity = 0;
        }
      } else {
        sectionTitle.style.opacity = 0;
        sectionSubtitle.style.opacity = 0;
      }
    } else {
      sectionTitle.style.opacity = 0;
      sectionSubtitle.style.opacity = 0;
    }
  }

  // Show/hide labels container
  if (labelsContainer) {
    if (groupOpacity > 0.01) {
      labelsContainer.classList.add('visible');
    } else {
      labelsContainer.classList.remove('visible');
    }
  }
}

// Cleanup
function destroy() {
  // Remove mouse event listeners
  window.removeEventListener('mousedown', onMouseDown);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('mouseleave', onMouseUp);

  if (earthGroup) {
    earthGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
    earthGroup.parent?.remove(earthGroup);
  }

  if (labelsContainer) {
    labelsContainer.remove();
  }

  earthGroup = null;
  earthMesh = null;
  labelsContainer = null;
  sectionTitle = null;
  sectionSubtitle = null;
  camera = null;
  renderer = null;
  time = 0;
  isInitialized = false;
  isDragging = false;
  targetRotationY = 6.47;
  targetRotationX = 0;
  currentRotationY = 6.47;
  currentRotationX = 0;
}

export { init, update, destroy };

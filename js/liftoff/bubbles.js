/* ==========================================================================
   Liftoff - Bubbles Module
   3D iridescent bubbles for crew section with character images
   ========================================================================== */

import * as THREE from 'three';
import * as Scroll from './scroll.js';
import * as Parallax from './parallax.js';

// Configuration
const CREW_SECTION = 3; // Index of THE CREW section
const BUBBLE_RADIUS = 80;
const BUBBLE_SEGMENTS = 64;

// Crew data - positions and image URLs
const CREW_DATA = [
  { name: 'Selena', x: -220, y: 20, image: 'https://triglass-assets.s3.us-east-1.amazonaws.com/selena-1.jpg' },
  { name: 'Leo', x: 0, y: 0, image: 'https://triglass-assets.s3.us-east-1.amazonaws.com/leo-1.jpg' },
  { name: 'Dad', x: 220, y: 20, image: 'https://triglass-assets.s3.us-east-1.amazonaws.com/dad-1.jpg' },
];

// Module state
let bubblesGroup = null;
let bubbles = [];
let time = 0;
let isInitialized = false;

// Create environment map for reflections
function createEnvMap() {
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);

  // Create a simple gradient environment
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Dark space gradient with subtle star-like specs
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 360);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#0d0d1a');
  gradient.addColorStop(1, '#050510');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  // Add some subtle light specs
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  return texture;
}

// Create a single bubble mesh
function createBubble(crewMember, index) {
  const geometry = new THREE.SphereGeometry(BUBBLE_RADIUS, BUBBLE_SEGMENTS, BUBBLE_SEGMENTS);

  // Load character image texture with CORS support
  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = 'anonymous';

  const characterTexture = textureLoader.load(
    crewMember.image,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      console.log(`[LIFTOFF] Loaded texture for ${crewMember.name}`);
    },
    undefined,
    (error) => {
      console.error(`[LIFTOFF] Failed to load texture for ${crewMember.name}:`, error);
    }
  );

  // Create environment map for reflections
  const envMap = createEnvMap();

  // MeshPhysicalMaterial with iridescence for bubble effect
  const material = new THREE.MeshPhysicalMaterial({
    // Base - slightly tinted, mostly transparent
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,

    // Transmission (glass-like transparency)
    transmission: 0.85,
    thickness: 0.5,

    // Iridescence (rainbow thin-film effect)
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],

    // Clearcoat for extra shine
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,

    // Reflections
    envMap: envMap,
    envMapIntensity: 0.5,

    // Make it double-sided so we see inside
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });

  const bubble = new THREE.Mesh(geometry, material);

  // Create inner circle with character image (plane facing camera)
  const innerGeometry = new THREE.CircleGeometry(BUBBLE_RADIUS * 0.75, BUBBLE_SEGMENTS);
  const innerMaterial = new THREE.MeshBasicMaterial({
    map: characterTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1.0,
  });
  const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
  innerCircle.position.z = 5; // Slightly in front to be more visible
  innerCircle.userData.isInnerCircle = true; // Mark for billboard update

  // Create a group to hold bubble and inner image
  const bubbleGroup = new THREE.Group();
  bubbleGroup.add(innerCircle);
  bubbleGroup.add(bubble);

  // Position
  bubbleGroup.position.set(crewMember.x, crewMember.y, 0);

  // Store reference data
  bubbleGroup.userData = {
    name: crewMember.name,
    index: index,
    baseX: crewMember.x,
    baseY: crewMember.y,
    phase: Math.random() * Math.PI * 2, // Random phase for wobble
  };

  return bubbleGroup;
}

// Initialize bubbles
function init(parentGroup) {
  if (isInitialized) return;

  bubblesGroup = new THREE.Group();
  bubblesGroup.position.z = -500; // Start behind camera view

  // Create bubbles for each crew member
  CREW_DATA.forEach((crew, index) => {
    const bubble = createBubble(crew, index);
    bubbles.push(bubble);
    bubblesGroup.add(bubble);
  });

  parentGroup.add(bubblesGroup);
  isInitialized = true;

  console.log('[LIFTOFF] Bubbles initialized with', bubbles.length, 'crew members');
}

// Update bubbles based on scroll and time
function update() {
  if (!bubblesGroup || !isInitialized) return;

  time += 0.016; // Approximate 60fps delta

  const scrollProgress = Scroll.getProgress();
  const numSections = 6;
  const sectionFloat = scrollProgress * (numSections - 1);
  const sectionIndex = Math.floor(sectionFloat);
  const sectionProgress = sectionFloat - sectionIndex;

  // Calculate Z position based on section
  // Bubbles appear in section 3 (THE CREW)
  const IMAGE_START_Z = -800;
  const IMAGE_END_Z = 600;
  const zRange = 3; // Match crew section zRange from content.js
  const zDistance = (IMAGE_END_Z - IMAGE_START_Z) * zRange;
  const sectionStartZ = IMAGE_START_Z - (zDistance - (IMAGE_END_Z - IMAGE_START_Z)) / 2;

  let groupOpacity = 0;
  let groupZ = sectionStartZ;

  if (sectionIndex === CREW_SECTION) {
    // In crew section - animate through
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
    if (groupZ > 200) {
      const proximityFade = 1 - ((groupZ - 200) / 400);
      groupOpacity *= Math.max(0, proximityFade);
    }
  } else if (sectionIndex > CREW_SECTION) {
    // Past crew section
    groupZ = sectionStartZ + zDistance + 200;
    groupOpacity = 0;
  }
  // Future sections: stay hidden at default values

  // Apply group position
  bubblesGroup.position.z = groupZ;

  // Get parallax for wobble
  const mouse = Parallax.getMouse();

  // Update each bubble
  bubbles.forEach((bubble) => {
    const { baseX, baseY, phase, index } = bubble.userData;

    // Gentle floating wobble
    const wobbleX = Math.sin(time * 0.5 + phase) * 8;
    const wobbleY = Math.cos(time * 0.7 + phase) * 6;

    // Parallax offset (subtle)
    const parallaxX = mouse.x * 15;
    const parallaxY = mouse.y * 10;

    // Staggered delay for each bubble
    const delay = index * 0.15;
    const adjustedProgress = sectionIndex === CREW_SECTION
      ? Math.max(0, (sectionProgress - delay) / (1 - delay))
      : 0;

    // Individual bubble opacity with stagger
    let bubbleOpacity = groupOpacity;
    if (sectionIndex === CREW_SECTION && adjustedProgress < 0.2) {
      bubbleOpacity *= adjustedProgress / 0.2;
    }

    // Apply position
    bubble.position.x = baseX + wobbleX + parallaxX;
    bubble.position.y = baseY + wobbleY - parallaxY;

    // Gentle rotation for bubble group
    bubble.rotation.y = time * 0.1 + phase;
    bubble.rotation.x = Math.sin(time * 0.3 + phase) * 0.1;

    // Set opacity on materials and handle inner circle billboard
    bubble.children.forEach((child) => {
      if (child.material) {
        child.material.opacity = bubbleOpacity * (child.userData.isInnerCircle ? 1.0 : 0.9);
      }
      // Keep inner circle facing camera (counter-rotate)
      if (child.userData.isInnerCircle) {
        child.rotation.y = -bubble.rotation.y;
        child.rotation.x = -bubble.rotation.x;
      }
    });

    // Hide/show based on opacity
    bubble.visible = bubbleOpacity > 0.01;
  });

  bubblesGroup.visible = groupOpacity > 0.01;
}

// Cleanup
function destroy() {
  if (bubblesGroup) {
    bubbles.forEach((bubble) => {
      bubble.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          if (child.material.envMap) child.material.envMap.dispose();
          child.material.dispose();
        }
      });
    });
    bubblesGroup.parent?.remove(bubblesGroup);
  }

  bubblesGroup = null;
  bubbles = [];
  time = 0;
  isInitialized = false;
}

export { init, update, destroy };

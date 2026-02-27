/* ==========================================================================
   Liftoff - Bubbles Module
   3D iridescent bubbles for crew section with character images
   Uses custom shader for soap bubble effect with fresnel and rainbow colors
   ========================================================================== */

import * as THREE from 'three';
import * as Scroll from './scroll.js';
import * as Parallax from './parallax.js';

// Configuration
const CREW_SECTION = 3; // Index of THE CREW section
const BUBBLE_RADIUS = 80;
const BUBBLE_SEGMENTS = 64;

// Crew data - positions and image URLs (all at same Y position)
const CREW_DATA = [
  { name: 'Selena', x: -220, y: 20, image: 'https://triglass-assets.s3.us-east-1.amazonaws.com/selena-1.jpg' },
  { name: 'Leo', x: 0, y: 20, image: 'https://triglass-assets.s3.us-east-1.amazonaws.com/leo-1.jpg' },
  { name: 'Dad', x: 220, y: 20, image: 'https://triglass-assets.s3.us-east-1.amazonaws.com/dad-1.jpg' },
];

// Module state
let bubblesGroup = null;
let bubbles = [];
let time = 0;
let isInitialized = false;

// Bubble shader - creates iridescent soap bubble effect
const bubbleVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Character image shader with radial edge fade
const characterVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const characterFragmentShader = `
  uniform sampler2D uTexture;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(uTexture, vUv);

    // Calculate distance from center (0.5, 0.5)
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center) * 2.0; // 0 at center, 1 at edge

    // Soft radial fade starting at 70% from center
    float fadeStart = 0.7;
    float alpha = 1.0 - smoothstep(fadeStart, 1.0, dist);

    gl_FragColor = vec4(texColor.rgb, texColor.a * alpha * uOpacity);
  }
`;

const bubbleFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  // Rainbow color based on angle and time (thin-film interference simulation)
  vec3 iridescence(float angle, float time) {
    // Simulate thin-film interference with shifting wavelengths
    float thickness = 0.5 + 0.3 * sin(time * 0.5 + angle * 2.0);

    // Create rainbow colors based on interference
    float r = 0.5 + 0.5 * sin(angle * 6.28318 + time * 0.3 + thickness * 10.0);
    float g = 0.5 + 0.5 * sin(angle * 6.28318 + time * 0.3 + thickness * 10.0 + 2.094);
    float b = 0.5 + 0.5 * sin(angle * 6.28318 + time * 0.3 + thickness * 10.0 + 4.188);

    return vec3(r, g, b);
  }

  void main() {
    // Calculate fresnel effect (more visible at edges)
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));
    fresnel = pow(fresnel, 2.0);

    // Get iridescent color based on view angle
    float angle = atan(vNormal.y, vNormal.x) + atan(vNormal.z, vNormal.x);
    vec3 iridescentColor = iridescence(angle + fresnel, uTime);

    // Mix with base bubble color (slight blue tint)
    vec3 baseColor = vec3(0.9, 0.95, 1.0);
    vec3 finalColor = mix(baseColor, iridescentColor, 0.6 + fresnel * 0.4);

    // Opacity based on fresnel (transparent center, visible edges)
    float alpha = fresnel * 0.7 + 0.1;
    alpha *= uOpacity;

    // Add subtle rim highlight
    float rimLight = pow(fresnel, 3.0) * 0.5;
    finalColor += vec3(rimLight);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

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

  // Custom shader material for bubble effect
  const bubbleMaterial = new THREE.ShaderMaterial({
    vertexShader: bubbleVertexShader,
    fragmentShader: bubbleFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1.0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const bubble = new THREE.Mesh(geometry, bubbleMaterial);

  // Create inner circle with character image (full size with edge fade)
  const innerGeometry = new THREE.CircleGeometry(BUBBLE_RADIUS * 0.95, BUBBLE_SEGMENTS);
  const innerMaterial = new THREE.ShaderMaterial({
    vertexShader: characterVertexShader,
    fragmentShader: characterFragmentShader,
    uniforms: {
      uTexture: { value: characterTexture },
      uOpacity: { value: 1.0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
  innerCircle.position.z = 2; // Slightly in front
  innerCircle.userData.isInnerCircle = true;
  innerCircle.userData.innerMaterial = innerMaterial;

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
    phase: Math.random() * Math.PI * 2,
    bubbleMaterial: bubbleMaterial, // Store reference for animation
  };

  return bubbleGroup;
}

// Initialize bubbles
function init(parentGroup) {
  if (isInitialized) return;

  bubblesGroup = new THREE.Group();
  bubblesGroup.position.z = -500;

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

  time += 0.016;

  const scrollProgress = Scroll.getProgress();
  const numSections = 6;
  const sectionFloat = scrollProgress * (numSections - 1);
  const sectionIndex = Math.floor(sectionFloat);
  const sectionProgress = sectionFloat - sectionIndex;

  // Calculate Z position based on section
  const IMAGE_START_Z = -800;
  const IMAGE_END_Z = 600;
  const zRange = 3;
  const zDistance = (IMAGE_END_Z - IMAGE_START_Z) * zRange;
  const sectionStartZ = IMAGE_START_Z - (zDistance - (IMAGE_END_Z - IMAGE_START_Z)) / 2;

  let groupOpacity = 0;
  let groupZ = sectionStartZ;

  if (sectionIndex === CREW_SECTION) {
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
    groupZ = sectionStartZ + zDistance + 200;
    groupOpacity = 0;
  }

  bubblesGroup.position.z = groupZ;

  // Get parallax for wobble
  const mouse = Parallax.getMouse();

  // Update each bubble
  bubbles.forEach((bubble) => {
    const { baseX, baseY, phase, index, bubbleMaterial } = bubble.userData;

    // Gentle floating wobble
    const wobbleX = Math.sin(time * 0.5 + phase) * 8;
    const wobbleY = Math.cos(time * 0.7 + phase) * 6;

    // Parallax offset
    const parallaxX = mouse.x * 15;
    const parallaxY = mouse.y * 10;

    // All bubbles appear together (no stagger)
    const bubbleOpacity = groupOpacity;

    // Apply position
    bubble.position.x = baseX + wobbleX + parallaxX;
    bubble.position.y = baseY + wobbleY - parallaxY;

    // Gentle rotation
    bubble.rotation.y = time * 0.1 + phase;
    bubble.rotation.x = Math.sin(time * 0.3 + phase) * 0.1;

    // Update shader uniforms
    if (bubbleMaterial) {
      bubbleMaterial.uniforms.uTime.value = time + phase;
      bubbleMaterial.uniforms.uOpacity.value = bubbleOpacity;
    }

    // Update inner circle
    bubble.children.forEach((child) => {
      if (child.userData.isInnerCircle) {
        // Update shader uniform for opacity
        if (child.userData.innerMaterial) {
          child.userData.innerMaterial.uniforms.uOpacity.value = bubbleOpacity;
        }
        // Billboard - counter-rotate to face camera
        child.rotation.y = -bubble.rotation.y;
        child.rotation.x = -bubble.rotation.x;
      }
    });

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

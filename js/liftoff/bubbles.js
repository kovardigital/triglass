/* ==========================================================================
   Liftoff - Bubbles Module
   3D iridescent bubbles for crew section with character images
   Custom shader with subtle iridescent rim effect
   ========================================================================== */

import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as Scroll from './scroll.js';
import * as Parallax from './parallax.js';

// Configuration
const CREW_SECTION = 3; // Index of THE CREW section
const BUBBLE_RADIUS = 80;
const BUBBLE_SEGMENTS = 64;

// Crew data - positions, image URLs, and color tints (all at same Y position)
// Using very dark colors for space context
const CREW_DATA = [
  { name: 'Selena', x: -220, y: 20, image: 'https://triglass-assets.s3.amazonaws.com/selena-2.jpg', tint: [0.04, 0.06, 0.18] },  // Very dark blue
  { name: 'Leo', x: 0, y: 20, image: 'https://triglass-assets.s3.amazonaws.com/leo-2.jpg', tint: [0.18, 0.02, 0.02] },           // Very dark red
  { name: 'Dad', x: 220, y: 20, image: 'https://triglass-assets.s3.amazonaws.com/dad-2.jpg', tint: [0.10, 0.03, 0.18] },         // Very dark purple
];

// Module state
let bubblesGroup = null;
let bubbles = [];
let time = 0;
let isInitialized = false;
let labelsContainer = null;
let nameLabels = [];
let sectionTitle = null;
let sectionSubtitle = null;
let camera = null;
let envMap = null;
let pmremGenerator = null;

// Hover/jiggle state
let raycaster = null;
let mouse = new THREE.Vector2();
let hoveredBubbleIndex = -1;
let previousHoveredIndex = -1; // Track previous to detect new hovers
let clickedBubbleIndex = -1; // Track clicked bubble for stronger jiggle
let jiggleIntensity = []; // Per-bubble jiggle intensity (0 = none, 1 = full jiggle)
let jiggleVelocity = []; // Per-bubble jiggle velocity for spring effect

// Load HDRI environment map for realistic bubble reflections
function loadHDRIEnvMap(renderer, onLoaded) {
  // Create PMREM generator for proper environment map processing
  pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  // Load HDRI from Polyhaven (night sky with stars for space context)
  const rgbeLoader = new RGBELoader();
  rgbeLoader.load(
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/autumn_hill_view_1k.hdr',
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      envMap = pmremGenerator.fromEquirectangular(texture).texture;
      texture.dispose();

      console.log('[LIFTOFF] HDRI environment map loaded');

      // Update existing bubble materials with the loaded env map
      if (onLoaded) onLoaded(envMap);
    },
    undefined,
    (error) => {
      console.warn('[LIFTOFF] Failed to load HDRI, using fallback:', error);
      // Fallback to simple procedural environment
      envMap = createFallbackEnvMap(renderer);
      if (onLoaded) onLoaded(envMap);
    }
  );
}

// Fallback procedural environment if HDRI fails to load
function createFallbackEnvMap(renderer) {
  const envScene = new THREE.Scene();
  const ambient = new THREE.AmbientLight(0xffffff, 1);
  envScene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2);
  keyLight.position.set(5, 10, 7);
  envScene.add(keyLight);

  const roomGeo = new THREE.SphereGeometry(50, 32, 32);
  const roomMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.BackSide });
  envScene.add(new THREE.Mesh(roomGeo, roomMat));

  const envMapRT = pmremGenerator.fromScene(envScene, 0.04);
  roomGeo.dispose();
  roomMat.dispose();

  return envMapRT.texture;
}

// ============================================================================
// CHARACTER SHADERS - For inner circle displaying character image
// ============================================================================
const characterVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const characterFragmentShader = `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3 uTint;
  uniform float uEdgeFadeStart;
  uniform float uBrightness;
  uniform float uBlackBgMode;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    // Sample character texture
    vec4 texColor = texture2D(uTexture, vUv);

    // Boost brightness
    vec3 color = texColor.rgb * uBrightness;
    color = min(color, vec3(1.0));

    // Calculate distance from center for edge fade
    vec2 center = vec2(0.5, 0.5);
    float dist = length(vUv - center) * 2.0;

    // Edge fade
    float edgeFade = 1.0 - smoothstep(uEdgeFadeStart, 1.0, dist);

    // Apply subtle tint
    color = color * (vec3(1.0) + uTint * 0.3);

    // Black background modes:
    // Mode 0: No black background
    // Mode 1: Full solid black background
    // Mode 2: Black background only at edges
    float alpha = texColor.a * edgeFade * uOpacity;

    if (uBlackBgMode > 0.5) {
      // Mode 1 or 2: Add black background
      float bgStrength = 1.0;
      if (uBlackBgMode > 1.5) {
        // Mode 2: Only at edges
        bgStrength = 1.0 - edgeFade;
      }
      // Blend character over black background
      vec3 bgColor = vec3(0.0);
      color = mix(bgColor, color, texColor.a);
      alpha = max(alpha, bgStrength * edgeFade * uOpacity);
    }

    gl_FragColor = vec4(color, alpha);
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

  // Convert crew tint to a color for the bubble
  const tintColor = new THREE.Color(crewMember.tint[0], crewMember.tint[1], crewMember.tint[2]);

  // Settings from Dad (best white edge reduction):
  const envIntensity = 0.05;
  const specIntensity = 0.5;
  const iridescenceAmount = 1;
  const roughnessAmount = 0.08;

  // Winner: transmission 0.6 with black attenuation (from Selena test)
  const transmissionAmount = 0.6;
  const useBlackAttenuation = true;

  // MeshPhysicalMaterial with settings from CodeSandbox example
  const bubbleMaterial = new THREE.MeshPhysicalMaterial({
    // Use crew member's tint as base color
    color: tintColor,
    // Reduced transmission to block more background
    transmission: transmissionAmount,
    thickness: 0.5,
    roughness: roughnessAmount, // Slight roughness to soften Fresnel edges
    metalness: 0,
    // Iridescence settings
    iridescence: iridescenceAmount,
    iridescenceIOR: 1,
    iridescenceThicknessRange: [0, 1400],
    // Clearcoat disabled
    clearcoat: 0,
    clearcoatRoughness: 0,
    // Match specular to tint color
    specularColor: tintColor,
    specularIntensity: specIntensity,
    // Environment map intensity - testing different levels
    envMapIntensity: envIntensity,
    // Attenuation - use black to absorb light for Selena/Leo
    attenuationColor: useBlackAttenuation ? new THREE.Color(0x000000) : tintColor,
    attenuationDistance: useBlackAttenuation ? 0.5 : 1, // Shorter distance = more absorption
    // Transparency
    transparent: true,
    opacity: 1,
    side: THREE.FrontSide, // Only front faces for transmission
    depthWrite: false,
    // Apply environment map
    envMap: envMap,
  });

  // Very gentle, smooth distortion - much lower frequency for organic feel without jaggedness
  bubbleMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    bubbleMaterial.userData.shader = shader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uTime;`
    );

    // Very gentle, low-frequency wobble using simple sine waves
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      // Smooth, gentle wobble - very low frequency
      float wave1 = sin(position.x * 0.02 + uTime * 0.5) * sin(position.y * 0.02 + uTime * 0.3);
      float wave2 = sin(position.y * 0.015 + uTime * 0.4) * sin(position.z * 0.015 + uTime * 0.6);
      float displacement = (wave1 + wave2) * 2.0;
      transformed += normal * displacement;`
    );
  };

  const bubble = new THREE.Mesh(geometry, bubbleMaterial);
  bubble.renderOrder = 2; // Render bubble after character (1)

  // Create a group to hold bubble and character representation
  const bubbleGroup = new THREE.Group();

  // Add BackSide sphere - renders the back of the bubble as black with feathered edges
  // Using ShaderMaterial for edge fade effect
  const backGeometry = new THREE.SphereGeometry(BUBBLE_RADIUS, BUBBLE_SEGMENTS, BUBBLE_SEGMENTS);
  const backMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);

        // Apply wobble displacement
        vec3 pos = position;
        float wave1 = sin(position.x * 0.02 + uTime * 0.5) * sin(position.y * 0.02 + uTime * 0.3);
        float wave2 = sin(position.y * 0.015 + uTime * 0.4) * sin(position.z * 0.015 + uTime * 0.6);
        float displacement = (wave1 + wave2) * 2.0;
        pos += normal * displacement;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        // Fresnel - stronger at edges (where view grazes surface)
        float fresnel = 1.0 - abs(dot(viewDir, normal));

        // Fade out at edges - center is full opacity, edges fade to transparent
        // Lower power = wider feathering
        float edgeFade = 1.0 - pow(fresnel, 0.8);

        gl_FragColor = vec4(0.0, 0.0, 0.0, uOpacity * edgeFade);
      }
    `,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.85 },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });

  const backSphere = new THREE.Mesh(backGeometry, backMaterial);
  backSphere.renderOrder = 0; // Render first (lowest)
  backSphere.userData.isBackSphere = true;
  backSphere.userData.backMaterial = backMaterial;
  bubbleGroup.add(backSphere);

  // Character visibility settings
  const brightness = 2.0;
  const opacityMult = 1.0;

  // Make inner circle slightly smaller than bubble to stay inside wobble range
  const circleScale = 0.85; // Larger characters
  const edgeFadeStart = 0.65; // More feathering at edges
  const innerGeometry = new THREE.CircleGeometry(BUBBLE_RADIUS * circleScale, BUBBLE_SEGMENTS);

  // Winner: Mode 1 - Full solid black background (from Selena test)
  const blackBgMode = 1;

  const innerMaterial = new THREE.ShaderMaterial({
    vertexShader: characterVertexShader,
    fragmentShader: characterFragmentShader,
    uniforms: {
      uTexture: { value: characterTexture },
      uOpacity: { value: 1.0 },
      uTime: { value: 0 },
      uTint: { value: new THREE.Vector3(crewMember.tint[0], crewMember.tint[1], crewMember.tint[2]) },
      uEdgeFadeStart: { value: edgeFadeStart },
      uBrightness: { value: brightness },
      uBlackBgMode: { value: blackBgMode },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  innerMaterial.userData.opacityMult = opacityMult; // Store for animation update

  const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
  innerCircle.position.z = -20; // Closer to center, gives margin for wobble
  innerCircle.renderOrder = 1; // Render AFTER back sphere (0), so character shows on top of black
  innerCircle.userData.isInnerCircle = true;
  innerCircle.userData.innerMaterial = innerMaterial;

  bubbleGroup.add(innerCircle);
  bubbleGroup.add(bubble);

  // Add outer iridescent shell that overlays on top of character
  // This shows HDRI/iridescence on top of the character image
  const shellGeometry = new THREE.SphereGeometry(BUBBLE_RADIUS * 0.98, BUBBLE_SEGMENTS, BUBBLE_SEGMENTS);
  const shellMaterial = new THREE.MeshPhysicalMaterial({
    color: tintColor,
    transparent: true,
    opacity: 0.45, // More visible iridescence overlay
    transmission: 0, // No transmission - this is an overlay
    roughness: 0.05,
    metalness: 0,
    iridescence: 1,
    iridescenceIOR: 1.6, // Higher IOR for more color shift
    iridescenceThicknessRange: [50, 1200], // Wider range for more color variation
    clearcoat: 0,
    specularColor: tintColor,
    specularIntensity: 0.5,
    envMapIntensity: 0.3,
    side: THREE.FrontSide,
    depthWrite: false,
    envMap: envMap,
  });

  // Add wobble animation to shell too
  shellMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shellMaterial.userData.shader = shader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uTime;`
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      float wave1 = sin(position.x * 0.02 + uTime * 0.5) * sin(position.y * 0.02 + uTime * 0.3);
      float wave2 = sin(position.y * 0.015 + uTime * 0.4) * sin(position.z * 0.015 + uTime * 0.6);
      float displacement = (wave1 + wave2) * 2.0;
      transformed += normal * displacement;`
    );
  };

  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  shell.renderOrder = 3; // Render on top of everything (bubble + character)
  shell.userData.isShell = true;
  shell.userData.shellMaterial = shellMaterial;
  bubbleGroup.add(shell);

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
    shellMaterial: shellMaterial, // Store shell reference too
  };

  return bubbleGroup;
}

// Create HTML labels for crew names
function createLabels() {
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .crew-labels {
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
    .crew-labels.visible {
      opacity: 1;
    }
    .crew-name-label {
      position: absolute;
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 2px;
      white-space: nowrap;
      transform: translateX(-50%);
    }
    .crew-section-title {
      position: absolute;
      font-family: 'montserrat', sans-serif;
      font-size: clamp(24px, 4vw, 48px);
      font-weight: 500;
      color: #fff;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      transform: translateX(-50%);
    }
    .crew-section-subtitle {
      position: absolute;
      font-family: 'montserrat', sans-serif;
      font-size: clamp(12px, 1.5vw, 16px);
      font-weight: 300;
      color: rgba(255,255,255,0.7);
      text-align: center;
      letter-spacing: 0.02em;
      white-space: nowrap;
      transform: translateX(-50%);
    }
  `;
  document.head.appendChild(style);

  // Create container
  labelsContainer = document.createElement('div');
  labelsContainer.className = 'crew-labels';
  document.body.appendChild(labelsContainer);

  // Create label for each crew member
  CREW_DATA.forEach((crew, index) => {
    const label = document.createElement('div');
    label.className = 'crew-name-label';
    label.textContent = crew.name;
    label.dataset.index = index;
    labelsContainer.appendChild(label);
    nameLabels.push(label);
  });

  // Create section title and subtitle
  sectionTitle = document.createElement('div');
  sectionTitle.className = 'crew-section-title';
  sectionTitle.textContent = 'THE CREW';
  labelsContainer.appendChild(sectionTitle);

  sectionSubtitle = document.createElement('div');
  sectionSubtitle.className = 'crew-section-subtitle';
  sectionSubtitle.textContent = 'Three experiences. One life-changing event.';
  labelsContainer.appendChild(sectionSubtitle);
}

// Initialize bubbles
function init(parentGroup, threeCamera, renderer) {
  if (isInitialized) return;

  camera = threeCamera;

  bubblesGroup = new THREE.Group();
  bubblesGroup.position.z = -500;

  // Create bubbles for each crew member (env map will be applied when loaded)
  CREW_DATA.forEach((crew, index) => {
    const bubble = createBubble(crew, index);
    bubbles.push(bubble);
    bubblesGroup.add(bubble);
  });

  parentGroup.add(bubblesGroup);

  // Load HDRI environment map asynchronously
  if (renderer) {
    loadHDRIEnvMap(renderer, (loadedEnvMap) => {
      // Apply env map to all bubble and shell materials
      bubbles.forEach((bubbleGroup) => {
        const bubbleMaterial = bubbleGroup.userData.bubbleMaterial;
        if (bubbleMaterial) {
          bubbleMaterial.envMap = loadedEnvMap;
          bubbleMaterial.needsUpdate = true;
        }
        const shellMaterial = bubbleGroup.userData.shellMaterial;
        if (shellMaterial) {
          shellMaterial.envMap = loadedEnvMap;
          shellMaterial.needsUpdate = true;
        }
      });
    });
  }

  // Create HTML labels
  createLabels();

  // Set up raycaster for hover detection
  raycaster = new THREE.Raycaster();
  jiggleIntensity = bubbles.map(() => 0); // Initialize jiggle intensity for each bubble
  jiggleVelocity = bubbles.map(() => 0); // Initialize jiggle velocity for spring effect

  // Mouse move listener for hover detection
  const onMouseMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };
  window.addEventListener('mousemove', onMouseMove);

  // Mousedown listener for stronger jiggle (fires immediately on press)
  const onMouseDown = () => {
    // If hovering a bubble, mark it as clicked for stronger jiggle
    if (hoveredBubbleIndex >= 0) {
      clickedBubbleIndex = hoveredBubbleIndex;
    }
  };
  window.addEventListener('mousedown', onMouseDown);

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

    // Additional fade when close to camera (based on actual distance)
    const distanceToCamera = camera.position.z - groupZ;
    if (distanceToCamera < 300) {
      // Fade out as distance goes from 300 to 50
      const proximityFade = Math.max(0, (distanceToCamera - 50) / 250);
      groupOpacity *= proximityFade;
    }
  } else if (sectionIndex > CREW_SECTION) {
    groupZ = sectionStartZ + zDistance + 200;
    groupOpacity = 0;
  }

  bubblesGroup.position.z = groupZ;

  // Get parallax for wobble
  const parallaxMouse = Parallax.getMouse();

  // Hover detection with raycaster
  if (raycaster && camera && groupOpacity > 0.5) {
    raycaster.setFromCamera(mouse, camera);
    // Get all bubble meshes (the main sphere in each group)
    const bubbleMeshes = bubbles.map(b => b.children.find(c => c.geometry?.type === 'SphereGeometry' && !c.userData.isBackSphere && !c.userData.isShell)).filter(Boolean);
    const intersects = raycaster.intersectObjects(bubbleMeshes, false);

    const newHoveredIndex = intersects.length > 0
      ? bubbles.findIndex(b => b.children.includes(intersects[0].object))
      : -1;

    hoveredBubbleIndex = newHoveredIndex;
  } else {
    hoveredBubbleIndex = -1;
  }

  // Update each bubble
  bubbles.forEach((bubble, idx) => {
    const { baseX, baseY, phase, index, bubbleMaterial } = bubble.userData;

    // Trigger jiggle: click = strong, hover = subtle
    // Uses spring physics for bouncy easing
    if (idx === clickedBubbleIndex) {
      // Clicked - strong initial velocity
      jiggleVelocity[idx] = 0.09;
      clickedBubbleIndex = -1; // Reset after triggering
    } else if (idx === hoveredBubbleIndex && idx !== previousHoveredIndex) {
      // Just became hovered - subtle initial velocity
      jiggleVelocity[idx] = 0.06;
    }

    // Spring physics: velocity adds to intensity, then decays with damping
    jiggleIntensity[idx] += jiggleVelocity[idx];
    jiggleVelocity[idx] *= 0.88; // Velocity damping

    // Pull intensity back toward 0 with spring force + friction
    const springForce = -jiggleIntensity[idx] * 0.05; // Lower spring = less bounce
    jiggleVelocity[idx] += springForce;
    jiggleIntensity[idx] *= 0.945; // Friction to settle

    // Parallax offset (responds to mouse)
    const parallaxX = parallaxMouse.x * 15;
    const parallaxY = parallaxMouse.y * 10;

    // Hover jiggle effect - faster oscillation when hovered
    const jiggle = jiggleIntensity[idx];
    const jiggleX = Math.sin(time * 8 + phase) * 8 * jiggle;
    const jiggleY = Math.cos(time * 10 + phase * 1.3) * 8 * jiggle;
    const jiggleScale = 1 + Math.sin(time * 12 + phase) * 0.06 * jiggle;

    // All bubbles appear together (no stagger)
    const bubbleOpacity = groupOpacity;

    // Apply position (parallax + jiggle only, no random wobble)
    bubble.position.x = baseX + parallaxX + jiggleX;
    bubble.position.y = baseY - parallaxY + jiggleY;

    // Apply scale jiggle
    bubble.scale.setScalar(jiggleScale);

    // Static rotation with hover jiggle only
    bubble.rotation.y = phase + Math.sin(time * 6) * 0.1 * jiggle;
    bubble.rotation.x = Math.cos(time * 7) * 0.08 * jiggle;

    // Update shader uniforms for wobble animation and opacity
    if (bubbleMaterial) {
      // For MeshPhysicalMaterial with onBeforeCompile
      if (bubbleMaterial.userData.shader) {
        bubbleMaterial.userData.shader.uniforms.uTime.value = time + phase;
      }
      // Update opacity
      bubbleMaterial.opacity = bubbleOpacity;
    }

    // Update character representation (inner circle), back sphere, and shell
    bubble.children.forEach((child) => {
      if (child.userData.isBackSphere) {
        // Update back sphere opacity and wobble time
        const backMat = child.userData.backMaterial;
        if (backMat && backMat.uniforms) {
          backMat.uniforms.uOpacity.value = bubbleOpacity * 0.85;
          backMat.uniforms.uTime.value = time + phase;
        }
      }
      if (child.userData.isInnerCircle) {
        // Update shader uniforms for opacity and time
        if (child.userData.innerMaterial) {
          // Use per-character opacity multiplier
          const opacityMult = child.userData.innerMaterial.userData.opacityMult || 0.85;
          child.userData.innerMaterial.uniforms.uOpacity.value = bubbleOpacity * opacityMult;
          if (child.userData.innerMaterial.uniforms.uTime) {
            child.userData.innerMaterial.uniforms.uTime.value = time + phase;
          }
        }
        // Billboard - counter-rotate to face camera
        if (child.geometry.type === 'CircleGeometry') {
          child.rotation.y = -bubble.rotation.y;
          child.rotation.x = -bubble.rotation.x;
        }
      }
      // Update iridescent shell overlay
      if (child.userData.isShell) {
        const shellMaterial = child.userData.shellMaterial;
        if (shellMaterial) {
          shellMaterial.opacity = bubbleOpacity * 0.3; // Keep semi-transparent
          if (shellMaterial.userData.shader) {
            shellMaterial.userData.shader.uniforms.uTime.value = time + phase;
          }
        }
      }
    });

    bubble.visible = bubbleOpacity > 0.01;

    // Update label position (project 3D to 2D)
    if (camera && nameLabels[index]) {
      const label = nameLabels[index];
      // Get world position of bubble
      const worldPos = new THREE.Vector3();
      bubble.getWorldPosition(worldPos);

      // Calculate distance from camera
      const distanceToCamera = camera.position.z - worldPos.z;

      // Only show if in front of camera and within reasonable range
      if (distanceToCamera > 50 && distanceToCamera < 1500 && bubbleOpacity > 0.01) {
        worldPos.y -= BUBBLE_RADIUS + 20; // Position below bubble

        // Project to screen coordinates
        const screenPos = worldPos.clone().project(camera);

        // Check if in front of camera (z < 1 in NDC space)
        if (screenPos.z < 1) {
          const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

          label.style.left = `${x}px`;
          label.style.top = `${y}px`;
          label.style.opacity = bubbleOpacity;
        } else {
          label.style.opacity = 0;
        }
      } else {
        label.style.opacity = 0;
      }
    }
  });

  // Update section title/subtitle position (above/below bubbles)
  if (camera && sectionTitle && sectionSubtitle && bubbles.length > 0) {
    // Only update when section is visible
    if (groupOpacity > 0.01) {
      // Use center bubble (Leo) as reference
      const centerBubble = bubbles[1];
      const bubbleWorldPos = new THREE.Vector3();
      centerBubble.getWorldPosition(bubbleWorldPos);

      // Calculate distance from camera for scale
      const distanceToCamera = camera.position.z - bubbleWorldPos.z;

      // Only show if bubble is in front of camera and within reasonable range
      if (distanceToCamera > 50 && distanceToCamera < 1500) {
        // Scale based on distance (closer = bigger)
        // At distance 800 = scale 1, at 400 = scale 2, at 1200 = scale 0.67
        const baseDistance = 800;
        const scale = Math.max(0.5, Math.min(2.5, baseDistance / distanceToCamera));

        const titlePos = bubbleWorldPos.clone();
        titlePos.y += BUBBLE_RADIUS + 120; // Position above bubbles

        const subtitlePos = bubbleWorldPos.clone();
        subtitlePos.y -= BUBBLE_RADIUS + 100; // Position below bubbles (below name labels)

        // Project to screen coordinates
        const titleScreen = titlePos.clone().project(camera);
        const subtitleScreen = subtitlePos.clone().project(camera);

        // Check if in front of camera (z < 1 in NDC space)
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
          // Behind camera - hide
          sectionTitle.style.opacity = 0;
          sectionSubtitle.style.opacity = 0;
        }
      } else {
        // Out of range - hide
        sectionTitle.style.opacity = 0;
        sectionSubtitle.style.opacity = 0;
      }
    } else {
      // Section not visible - hide and reset
      sectionTitle.style.opacity = 0;
      sectionSubtitle.style.opacity = 0;
    }
  }

  bubblesGroup.visible = groupOpacity > 0.01;

  // Show/hide labels container
  if (labelsContainer) {
    if (groupOpacity > 0.01) {
      labelsContainer.classList.add('visible');
    } else {
      labelsContainer.classList.remove('visible');
    }
  }

  // Update cursor based on hover
  if (hoveredBubbleIndex >= 0) {
    document.body.style.cursor = 'pointer';
  } else if (groupOpacity > 0.01) {
    // Only reset if we're in the crew section (so we don't interfere with other sections)
    document.body.style.cursor = '';
  }

  // Track previous hover for detecting new hovers next frame
  previousHoveredIndex = hoveredBubbleIndex;
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

  // Clean up labels
  if (labelsContainer) {
    labelsContainer.remove();
  }

  bubblesGroup = null;
  bubbles = [];
  nameLabels = [];
  sectionTitle = null;
  sectionSubtitle = null;
  labelsContainer = null;
  camera = null;
  if (envMap) {
    envMap.dispose();
    envMap = null;
  }
  if (pmremGenerator) {
    pmremGenerator.dispose();
    pmremGenerator = null;
  }
  time = 0;
  isInitialized = false;
}

export { init, update, destroy };

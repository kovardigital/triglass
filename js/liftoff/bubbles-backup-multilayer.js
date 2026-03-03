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
let camera = null;
let envMap = null;
let pmremGenerator = null;

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
// UNIFIED BUBBLE SHADER - Single sphere handles everything
// Uses gl_FrontFacing to render black on back, character+iridescence on front
// ============================================================================
const unifiedBubbleVertexShader = `
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;

    // Apply wobble displacement
    vec3 pos = position;
    float wave1 = sin(position.x * 0.02 + uTime * 0.5) * sin(position.y * 0.02 + uTime * 0.3);
    float wave2 = sin(position.y * 0.015 + uTime * 0.4) * sin(position.z * 0.015 + uTime * 0.6);
    float displacement = (wave1 + wave2) * 2.0;
    pos += normal * displacement;

    // Transform normal for view space calculations
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const unifiedBubbleFragmentShader = `
  uniform sampler2D uTexture;
  uniform samplerCube uEnvMap;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3 uTint;
  uniform float uBackOpacity;
  uniform float uBrightness;
  uniform float uIridescenceStrength;
  uniform float uEnvMapIntensity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  varying vec3 vPosition;

  // Attempt to sample equirectangular HDRI from cube environment map
  vec3 sampleEnvMap(vec3 direction) {
    // Convert direction to spherical coordinates for equirectangular
    float phi = atan(direction.z, direction.x);
    float theta = acos(direction.y);
    vec2 envUv = vec2(phi / (2.0 * 3.14159) + 0.5, theta / 3.14159);
    // For now just return a simple sky gradient since we can't sample cubemap directly in this context
    float skyGradient = smoothstep(-0.3, 0.8, direction.y);
    vec3 skyColor = mix(vec3(0.02, 0.02, 0.05), vec3(0.1, 0.15, 0.3), skyGradient);
    return skyColor * 0.5;
  }

  // Thin-film iridescence calculation
  vec3 iridescence(float cosTheta, float thickness) {
    // Simplified thin-film interference
    float delta = thickness * cosTheta;

    // Create color shift based on viewing angle
    vec3 color;
    color.r = 0.5 + 0.5 * sin(delta * 6.28 + 0.0);
    color.g = 0.5 + 0.5 * sin(delta * 6.28 + 2.09);
    color.b = 0.5 + 0.5 * sin(delta * 6.28 + 4.19);

    return color;
  }

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);

    // Fresnel calculation
    float fresnel = 1.0 - abs(dot(viewDir, normal));
    fresnel = pow(fresnel, 2.0);

    if (!gl_FrontFacing) {
      // BACK FACE - render black (blocks stars behind)
      gl_FragColor = vec4(0.0, 0.0, 0.0, uOpacity * uBackOpacity);
      return;
    }

    // FRONT FACE - render character + iridescence + reflections

    // Matcap-style UV from view normal for character texture
    vec2 matcapUv = normal.xy * 0.5 + 0.5;

    // Add subtle lens distortion to character UV
    vec2 center = vec2(0.5, 0.5);
    vec2 offset = matcapUv - center;
    float dist = length(offset) * 2.0;
    float distortion = 1.0 - dist * dist * 0.1;
    distortion += sin(uTime * 0.3 + dist * 2.0) * 0.02;
    vec2 distortedUv = center + offset * distortion;
    distortedUv = clamp(distortedUv, 0.0, 1.0);

    // Sample character texture
    vec4 texColor = texture2D(uTexture, distortedUv);

    // Boost brightness
    vec3 characterColor = texColor.rgb * uBrightness;
    characterColor = min(characterColor, vec3(1.0));

    // Apply tint toward edges
    float tintStrength = smoothstep(0.2, 0.9, fresnel) * 0.7;
    vec3 tintedColor = characterColor * (vec3(1.0) + uTint * 0.5);
    characterColor = mix(characterColor, tintedColor, tintStrength);

    // Calculate iridescence
    float thickness = 0.5 + 0.5 * sin(uTime * 0.2 + dist * 3.0);
    vec3 iridescentColor = iridescence(1.0 - fresnel, thickness * 2.0);

    // Apply iridescence more at edges (fresnel)
    float iriStrength = fresnel * uIridescenceStrength;

    // Simple environment reflection
    vec3 reflectDir = reflect(-viewDir, normal);
    vec3 envColor = sampleEnvMap(reflectDir);

    // Blend everything together
    // Base: character texture
    vec3 finalColor = characterColor;

    // Add iridescence overlay
    finalColor = mix(finalColor, finalColor * iridescentColor * 1.5, iriStrength * 0.6);

    // Add environment reflection at edges
    finalColor += envColor * fresnel * uEnvMapIntensity;

    // Add subtle rim highlight
    float rimLight = pow(fresnel, 3.0) * 0.3;
    finalColor += vec3(rimLight) * uTint;

    // Edge fade for soft bubble look
    float edgeFade = 1.0 - smoothstep(0.85, 1.0, fresnel);

    // Final alpha: use texture alpha where character exists, fade at edges
    float characterAlpha = texColor.a;
    float finalAlpha = mix(0.8, characterAlpha, 1.0 - fresnel * 0.5) * edgeFade * uOpacity;

    gl_FragColor = vec4(finalColor, finalAlpha);
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

  // Add BackSide sphere - renders the back of the bubble as black
  // Using MeshBasicMaterial for guaranteed visibility
  // SAME size as bubble so vertices align perfectly for synchronized wobble
  const backGeometry = new THREE.SphereGeometry(BUBBLE_RADIUS, BUBBLE_SEGMENTS, BUBBLE_SEGMENTS);
  const backMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide,
    transparent: true,
    opacity: 1.0, // Start at 100%, will tune down later
  });
  // Add wobble animation to back sphere so it moves with the bubble
  backMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    backMaterial.userData.shader = shader;

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

  const backSphere = new THREE.Mesh(backGeometry, backMaterial);
  backSphere.renderOrder = 0; // Render first (lowest)
  backSphere.userData.isBackSphere = true;
  backSphere.userData.backMaterial = backMaterial;
  bubbleGroup.add(backSphere);

  // Character visibility settings
  const brightness = 2.0;
  const opacityMult = 1.0;

  // Make inner circle smaller than bubble to stay inside wobble range
  // Wobble displacement is ~4 units on 80 radius, so 75% size gives safe margin
  const circleScale = 0.75;
  const edgeFadeStart = 0.85;
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
    opacity: 0.3, // Semi-transparent to show character through
    transmission: 0, // No transmission - this is an overlay
    roughness: 0.1,
    metalness: 0,
    iridescence: 1,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 800],
    clearcoat: 0,
    specularColor: tintColor,
    specularIntensity: 0.3,
    envMapIntensity: 0.2,
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
        if (backMat) {
          backMat.opacity = bubbleOpacity; // Fade with bubble
          // Update wobble animation time
          if (backMat.userData.shader) {
            backMat.userData.shader.uniforms.uTime.value = time + phase;
          }
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
      worldPos.y -= BUBBLE_RADIUS + 20; // Position below bubble

      // Project to screen coordinates
      const screenPos = worldPos.clone().project(camera);
      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
      label.style.opacity = bubbleOpacity;
    }
  });

  bubblesGroup.visible = groupOpacity > 0.01;

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

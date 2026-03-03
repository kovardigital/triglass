/* ==========================================================================
   Liftoff - Bubbles Module (Blur Disks)
   Simple circles that blur the background behind them
   ========================================================================== */

import * as THREE from 'three';
import * as Scroll from './scroll.js';
import * as Parallax from './parallax.js';
import { setCustomRender, clearCustomRender } from './loop.js';
import { SECTION_COUNT, SECTIONS } from './config.js';

// Configuration - find characters section dynamically
const CREW_SECTION = SECTIONS.findIndex(s => s.id === 'characters');
const BUBBLE_RADIUS = 80;
const BLUR_AMOUNT = 16; // Blur strength

// Crew data
const CREW_DATA = [
  {
    name: 'Selena',
    x: -220,
    y: 20,
    image: 'https://triglass-assets.s3.amazonaws.com/selena-2.jpg',
    description: 'A brilliant astrophysicist whose discovery of the anomaly sets everything in motion. Her scientific curiosity masks a deeper search for meaning in a universe that suddenly feels much larger than before.',
  },
  {
    name: 'Leo',
    x: 0,
    y: 20,
    image: 'https://triglass-assets.s3.amazonaws.com/leo-2.jpg',
    description: 'Selena\'s younger brother, a restless dreamer who has always felt like he doesn\'t quite fit in. The cosmic event awakens something dormant within him—a connection he never knew he had.',
  },
  {
    name: 'Dad',
    x: 220,
    y: 20,
    image: 'https://triglass-assets.s3.amazonaws.com/dad-2.jpg',
    description: 'A retired engineer haunted by a decision he made decades ago. When the truth about the anomaly emerges, he must confront secrets he thought he had buried forever.',
  },
];

// Blur shaders
const blurVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const horizontalBlurFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float blurSize;
  varying vec2 vUv;

  void main() {
    vec4 sum = vec4(0.0);

    // 9-tap Gaussian blur
    sum += texture2D(tDiffuse, vec2(vUv.x - 4.0 * blurSize, vUv.y)) * 0.051;
    sum += texture2D(tDiffuse, vec2(vUv.x - 3.0 * blurSize, vUv.y)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x - 2.0 * blurSize, vUv.y)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x - 1.0 * blurSize, vUv.y)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.1633;
    sum += texture2D(tDiffuse, vec2(vUv.x + 1.0 * blurSize, vUv.y)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x + 2.0 * blurSize, vUv.y)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x + 3.0 * blurSize, vUv.y)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x + 4.0 * blurSize, vUv.y)) * 0.051;

    gl_FragColor = sum;
  }
`;

const verticalBlurFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float blurSize;
  varying vec2 vUv;

  void main() {
    vec4 sum = vec4(0.0);

    // 9-tap Gaussian blur
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 4.0 * blurSize)) * 0.051;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 3.0 * blurSize)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 2.0 * blurSize)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 1.0 * blurSize)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.1633;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 1.0 * blurSize)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 2.0 * blurSize)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 3.0 * blurSize)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 4.0 * blurSize)) * 0.051;

    gl_FragColor = sum;
  }
`;

// Blur disk shader - samples from blurred texture at screen position
const diskVertexShader = `
  varying vec2 vUv;
  varying vec4 vScreenPos;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vScreenPos = projectionMatrix * mvPosition;
    gl_Position = vScreenPos;
  }
`;

const diskFragmentShader = `
  uniform sampler2D blurredScene;
  uniform sampler2D characterTexture;
  uniform float opacity;
  uniform float hasTexture;

  varying vec2 vUv;
  varying vec4 vScreenPos;

  void main() {
    // Convert to screen UV (0-1 range)
    vec2 screenUv = vScreenPos.xy / vScreenPos.w * 0.5 + 0.5;

    // Sample blurred background
    vec4 blurColor = texture2D(blurredScene, screenUv);

    // Create circular mask
    float dist = length(vUv - 0.5) * 2.0;
    float circleMask = 1.0 - smoothstep(0.9, 1.0, dist);

    // Just output the blurred background within the circle
    vec3 finalColor = blurColor.rgb;

    // Add character image on top if available
    if (hasTexture > 0.5) {
      vec4 texColor = texture2D(characterTexture, vUv);
      finalColor = mix(finalColor, texColor.rgb, texColor.a * 0.9);
    }

    gl_FragColor = vec4(finalColor, circleMask * opacity);
  }
`;

// Module state
let camera = null;
let renderer = null;
let scene = null;
let isInitialized = false;
let bubblesGroup = null;
let parentGroup = null;

// Render targets for blur
let sceneTarget = null;
let blurTarget1 = null;
let blurTarget2 = null;
let blurMaterialH = null;
let blurMaterialV = null;
let fullscreenQuad = null;
let fullscreenCamera = null;

// Three.js objects
let diskMeshes = [];
let characterTextures = [];

// HTML elements for UI
let container = null;
let nameLabels = [];
let clickIcons = [];
let sectionTitle = null;
let sectionSubtitle = null;
let detailPanel = null;
let styleEl = null;

// State
let selectedBubbleIndex = -1;
let isDetailTransitioning = false;
let bubblesVisible = false;

// Animated positions for smooth transitions
let animatedX = [CREW_DATA[0].x, CREW_DATA[1].x, CREW_DATA[2].x];
const ANIMATION_SPEED = 0.08;

// Create render targets and blur materials
function setupBlurPipeline(width, height) {
  sceneTarget = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  });

  blurTarget1 = new THREE.WebGLRenderTarget(width / 2, height / 2, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  });

  blurTarget2 = new THREE.WebGLRenderTarget(width / 2, height / 2, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  });

  blurMaterialH = new THREE.ShaderMaterial({
    vertexShader: blurVertexShader,
    fragmentShader: horizontalBlurFragmentShader,
    uniforms: {
      tDiffuse: { value: null },
      blurSize: { value: BLUR_AMOUNT / width }
    }
  });

  blurMaterialV = new THREE.ShaderMaterial({
    vertexShader: blurVertexShader,
    fragmentShader: verticalBlurFragmentShader,
    uniforms: {
      tDiffuse: { value: null },
      blurSize: { value: BLUR_AMOUNT / height }
    }
  });

  // Fullscreen quad for blur passes
  const quadGeometry = new THREE.PlaneGeometry(2, 2);
  fullscreenQuad = new THREE.Mesh(quadGeometry, blurMaterialH);
  fullscreenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
}

// Custom render function for blur effect
function customRenderWithBlur(rendererRef, sceneRef, cameraRef) {
  if (!bubblesVisible || !sceneTarget) {
    // Just render normally when bubbles aren't visible
    rendererRef.render(sceneRef, cameraRef);
    return;
  }

  // Hide bubbles for clean scene capture
  if (bubblesGroup) bubblesGroup.visible = false;

  // 1. Render scene to texture
  rendererRef.setRenderTarget(sceneTarget);
  rendererRef.render(sceneRef, cameraRef);

  // 2. Horizontal blur pass
  blurMaterialH.uniforms.tDiffuse.value = sceneTarget.texture;
  fullscreenQuad.material = blurMaterialH;
  rendererRef.setRenderTarget(blurTarget1);
  rendererRef.render(fullscreenQuad, fullscreenCamera);

  // 3. Vertical blur pass
  blurMaterialV.uniforms.tDiffuse.value = blurTarget1.texture;
  fullscreenQuad.material = blurMaterialV;
  rendererRef.setRenderTarget(blurTarget2);
  rendererRef.render(fullscreenQuad, fullscreenCamera);

  // 4. Update disk materials with blurred texture
  diskMeshes.forEach(mesh => {
    mesh.material.uniforms.blurredScene.value = blurTarget2.texture;
  });

  // 5. Show bubbles and render final scene to screen
  if (bubblesGroup) bubblesGroup.visible = true;
  rendererRef.setRenderTarget(null);
  rendererRef.render(sceneRef, cameraRef);
}

// Create blur disk mesh
function createBlurDisk(crew, index) {
  const geometry = new THREE.CircleGeometry(BUBBLE_RADIUS, 64);

  // Load character texture
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(crew.image);
  texture.colorSpace = THREE.SRGBColorSpace;
  characterTextures.push(texture);

  const material = new THREE.ShaderMaterial({
    vertexShader: diskVertexShader,
    fragmentShader: diskFragmentShader,
    uniforms: {
      blurredScene: { value: null },
      characterTexture: { value: texture },
      opacity: { value: 0.95 },
      hasTexture: { value: 1.0 }
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(crew.x, crew.y, 0);
  mesh.userData.index = index;
  mesh.userData.baseX = crew.x;

  return mesh;
}

// Inject styles for HTML UI
function injectStyles() {
  styleEl = document.createElement('style');
  styleEl.textContent = `
    .crew-container {
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
    .crew-container.visible {
      opacity: 1;
    }

    /* Invisible click targets */
    .crew-click-target {
      position: absolute;
      border-radius: 50%;
      cursor: pointer;
      pointer-events: auto;
      transform: translate(-50%, -50%);
    }

    /* Name labels */
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
      pointer-events: none;
      transition: opacity 0.3s ease-out;
    }

    /* Click icons */
    .crew-click-icon {
      position: absolute;
      width: 20px;
      height: 20px;
      pointer-events: none;
      transform: translate(-50%, -50%);
      transition: opacity 0.2s ease-out;
    }
    .crew-click-icon svg {
      width: 100%;
      height: 100%;
      display: block;
      stroke: rgba(255,255,255,0.5);
      fill: none;
    }

    /* Section title and subtitle */
    .crew-section-title {
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
      pointer-events: none;
    }
    .crew-section-subtitle {
      position: absolute;
      font-family: 'montserrat', sans-serif;
      font-size: clamp(10px, 1.2vw, 13px);
      font-weight: 300;
      color: rgba(255,255,255,0.7);
      text-align: center;
      letter-spacing: 0.02em;
      white-space: nowrap;
      transform: translateX(-50%);
      pointer-events: none;
    }

    /* Detail panel */
    .crew-detail-panel {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
    }
    .crew-detail-panel.visible {
      pointer-events: auto;
    }
    .crew-detail-text {
      position: absolute;
      opacity: 0;
      transition: opacity 0.4s ease-out;
    }
    .crew-detail-panel.visible .crew-detail-text {
      opacity: 1;
    }
    .crew-detail-name {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(14px, 2.1vw, 24px);
      font-weight: 500;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      margin-bottom: 10px;
    }
    .crew-detail-description {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(7px, 0.7vw, 8px);
      font-weight: 300;
      color: rgba(255,255,255,0.85);
      line-height: 1.6;
      letter-spacing: 0.01em;
      max-width: 400px;
    }
    .crew-detail-close {
      position: absolute;
      top: 30px;
      right: 30px;
      width: 40px;
      height: 40px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }
    .crew-detail-panel.visible .crew-detail-close {
      opacity: 0.6;
    }
    .crew-detail-close:hover {
      opacity: 1;
    }
    .crew-detail-close svg {
      width: 100%;
      height: 100%;
      stroke: #fff;
      stroke-width: 2;
    }
  `;
  document.head.appendChild(styleEl);
}

// Create HTML UI elements
function createUIElements() {
  container = document.createElement('div');
  container.className = 'crew-container';
  document.body.appendChild(container);

  CREW_DATA.forEach((crew, index) => {
    // Invisible click target
    const clickTarget = document.createElement('div');
    clickTarget.className = 'crew-click-target';
    clickTarget.dataset.index = index;
    clickTarget.addEventListener('click', () => toggleBubbleDetail(index));
    container.appendChild(clickTarget);

    // Name label
    const label = document.createElement('div');
    label.className = 'crew-name-label';
    label.textContent = crew.name;
    container.appendChild(label);
    nameLabels.push(label);

    // Click icon
    const clickIcon = document.createElement('div');
    clickIcon.className = 'crew-click-icon';
    clickIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M8 13V4.5a1.5 1.5 0 0 1 3 0V12m0-.5v-2a1.5 1.5 0 0 1 3 0V12m0-1.5a1.5 1.5 0 0 1 3 0V12"></path><path d="M17 11.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2h.208a6 6 0 0 1-5.012-2.7L7 19q-.468-.718-3.286-5.728a1.5 1.5 0 0 1 .536-2.022a1.87 1.87 0 0 1 2.28.28L8 13M5 3L4 2m0 5H3m11-4l1-1m0 4h1"></path></g></svg>`;
    container.appendChild(clickIcon);
    clickIcons.push(clickIcon);
  });

  // Section title
  sectionTitle = document.createElement('div');
  sectionTitle.className = 'crew-section-title';
  sectionTitle.textContent = 'CHARACTERS';
  container.appendChild(sectionTitle);

  // Section subtitle
  sectionSubtitle = document.createElement('div');
  sectionSubtitle.className = 'crew-section-subtitle';
  sectionSubtitle.textContent = 'Three experiences. One life-changing event.';
  container.appendChild(sectionSubtitle);

  // Detail panel
  detailPanel = document.createElement('div');
  detailPanel.className = 'crew-detail-panel';
  detailPanel.innerHTML = `
    <div class="crew-detail-text">
      <div class="crew-detail-name"></div>
      <div class="crew-detail-description"></div>
    </div>
    <div class="crew-detail-close">
      <svg viewBox="0 0 24 24" fill="none">
        <line x1="6" y1="6" x2="18" y2="18"/>
        <line x1="18" y1="6" x2="6" y2="18"/>
      </svg>
    </div>
  `;
  document.body.appendChild(detailPanel);

  const closeBtn = detailPanel.querySelector('.crew-detail-close');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeBubbleDetail();
  });

  detailPanel.addEventListener('click', () => {
    closeBubbleDetail();
  });
}

function toggleBubbleDetail(index) {
  if (selectedBubbleIndex === index) {
    closeBubbleDetail();
  } else {
    openBubbleDetail(index);
  }
}

function openBubbleDetail(index) {
  if (index < 0 || index >= CREW_DATA.length || isDetailTransitioning) return;

  isDetailTransitioning = true;
  selectedBubbleIndex = index;

  const crew = CREW_DATA[index];
  const nameEl = detailPanel.querySelector('.crew-detail-name');
  const descEl = detailPanel.querySelector('.crew-detail-description');
  if (nameEl) nameEl.textContent = crew.name;
  if (descEl) descEl.textContent = crew.description;

  // Fade non-selected meshes
  diskMeshes.forEach((mesh, idx) => {
    if (idx !== index) {
      mesh.material.uniforms.opacity.value = 0.15;
    }
  });

  detailPanel.classList.add('visible');
  console.log('[LIFTOFF] Opened detail for', crew.name);

  setTimeout(() => { isDetailTransitioning = false; }, 400);
}

function closeBubbleDetail() {
  if (selectedBubbleIndex < 0 || isDetailTransitioning) return;

  isDetailTransitioning = true;
  detailPanel.classList.remove('visible');

  // Restore mesh opacity
  diskMeshes.forEach(mesh => {
    mesh.material.uniforms.opacity.value = 0.95;
  });

  console.log('[LIFTOFF] Closed detail view');

  setTimeout(() => {
    selectedBubbleIndex = -1;
    isDetailTransitioning = false;
  }, 400);
}

// Initialize
function init(worldGroup, threeCamera, threeRenderer) {
  if (isInitialized) return;

  camera = threeCamera;
  renderer = threeRenderer;
  parentGroup = worldGroup;
  scene = worldGroup.parent; // Get scene from worldGroup

  // Setup blur pipeline
  setupBlurPipeline(window.innerWidth, window.innerHeight);

  // Create bubbles group
  bubblesGroup = new THREE.Group();
  bubblesGroup.position.z = -500;
  parentGroup.add(bubblesGroup);

  // Create blur disk meshes
  CREW_DATA.forEach((crew, index) => {
    const mesh = createBlurDisk(crew, index);
    bubblesGroup.add(mesh);
    diskMeshes.push(mesh);
  });

  // Set custom render function
  setCustomRender(customRenderWithBlur);

  injectStyles();
  createUIElements();

  // Handle resize
  window.addEventListener('resize', onResize);

  isInitialized = true;
  console.log('[LIFTOFF] Bubbles (blur disks) initialized');
}

function onResize() {
  if (!sceneTarget) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  sceneTarget.setSize(width, height);
  blurTarget1.setSize(width / 2, height / 2);
  blurTarget2.setSize(width / 2, height / 2);

  blurMaterialH.uniforms.blurSize.value = BLUR_AMOUNT / width;
  blurMaterialV.uniforms.blurSize.value = BLUR_AMOUNT / height;
}

// Update
function update() {
  if (!container || !isInitialized || !camera) return;

  const scrollProgress = Scroll.getProgress();
  const numSections = SECTION_COUNT;
  const sectionFloat = scrollProgress * (numSections - 1);
  const sectionIndex = Math.floor(sectionFloat);
  const sectionProgress = sectionFloat - sectionIndex;

  // Z position - same approach as content.js
  // Position bubbles relative to camera, flying through during section
  const IMAGE_START_Z = -800;
  const IMAGE_END_Z = -200;
  const zRange = 3;
  const zDistance = (IMAGE_END_Z - IMAGE_START_Z) * zRange;
  const sectionStartZ = IMAGE_START_Z - (zDistance - (IMAGE_END_Z - IMAGE_START_Z)) / 2;

  let groupOpacity = 0;
  let groupZ = sectionStartZ;

  if (sectionIndex === CREW_SECTION) {
    const t = Math.min(1, sectionProgress);
    groupZ = sectionStartZ + zDistance * t;

    // Fade in/out based on section progress
    if (t < 0.15) {
      groupOpacity = t / 0.15;
    } else if (t > 0.75) {
      groupOpacity = 1 - ((t - 0.75) / 0.25);
    } else {
      groupOpacity = 1;
    }

    const distanceToCamera = camera.position.z - groupZ;
    if (distanceToCamera < 300) {
      const proximityFade = Math.max(0, (distanceToCamera - 50) / 250);
      groupOpacity *= proximityFade;
    }
  } else if (sectionIndex > CREW_SECTION) {
    groupZ = sectionStartZ + zDistance + 200;
    groupOpacity = 0;
  }

  bubblesGroup.position.z = groupZ;

  const parallaxMouse = Parallax.getMouse();
  const parallaxX = parallaxMouse.x * 15;
  const parallaxY = parallaxMouse.y * 10;

  const isDetailOpen = selectedBubbleIndex >= 0;
  const disksVisible = groupOpacity > 0.01;

  // Track visibility for blur rendering
  bubblesVisible = disksVisible;

  // Show/hide group
  bubblesGroup.visible = disksVisible;

  if (disksVisible) {
    container.classList.add('visible');
  } else {
    container.classList.remove('visible');
  }

  // Update each character
  CREW_DATA.forEach((crew, idx) => {
    const mesh = diskMeshes[idx];
    const label = nameLabels[idx];
    const clickIcon = clickIcons[idx];
    const clickTarget = container.querySelectorAll('.crew-click-target')[idx];

    // Calculate target X position
    let targetX = crew.x;
    if (isDetailOpen && idx === selectedBubbleIndex) {
      targetX = CREW_DATA[0].x; // Move to Selena's position
    }

    // Smoothly animate toward target position
    animatedX[idx] += (targetX - animatedX[idx]) * ANIMATION_SPEED;

    // Update mesh position using animated X
    mesh.position.x = animatedX[idx] + parallaxX;
    mesh.position.y = crew.y - parallaxY;

    // Update mesh opacity
    const meshOpacity = isDetailOpen && idx !== selectedBubbleIndex ? 0.15 * groupOpacity : 0.95 * groupOpacity;
    mesh.material.uniforms.opacity.value = meshOpacity;

    // Project to screen for HTML elements (use animated position)
    const worldPos = new THREE.Vector3(
      animatedX[idx] + parallaxX,
      crew.y - parallaxY,
      groupZ
    );
    const screenPos = worldPos.clone().project(camera);
    const distanceToCamera = camera.position.z - groupZ;

    if (distanceToCamera > 50 && distanceToCamera < 1500 && screenPos.z < 1) {
      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
      const baseDistance = 800;
      const scale = Math.max(0.3, Math.min(2, baseDistance / distanceToCamera));

      // Position click target
      const targetSize = BUBBLE_RADIUS * 2 * scale;
      if (clickTarget) {
        clickTarget.style.left = `${x}px`;
        clickTarget.style.top = `${y}px`;
        clickTarget.style.width = `${targetSize}px`;
        clickTarget.style.height = `${targetSize}px`;
      }

      // Position label
      const labelY = y + (BUBBLE_RADIUS * scale) + 20;
      label.style.left = `${x}px`;
      label.style.top = `${labelY}px`;
      label.style.opacity = isDetailOpen ? 0 : groupOpacity;

      // Position click icon
      const iconX = x + (BUBBLE_RADIUS * 0.75 * scale);
      const iconY = y + (BUBBLE_RADIUS * 0.75 * scale);
      clickIcon.style.left = `${iconX}px`;
      clickIcon.style.top = `${iconY}px`;
      clickIcon.style.opacity = isDetailOpen ? 0 : groupOpacity * 0.7;
    } else {
      label.style.opacity = 0;
      clickIcon.style.opacity = 0;
    }
  });

  // Section title/subtitle
  if (sectionTitle && sectionSubtitle && disksVisible && !isDetailOpen) {
    const centerWorldPos = new THREE.Vector3(parallaxX, CREW_DATA[1].y - parallaxY, groupZ);
    const distanceToCamera = camera.position.z - groupZ;

    if (distanceToCamera > 50 && distanceToCamera < 1500) {
      const baseDistance = 800;
      const scale = Math.max(0.5, Math.min(2.5, baseDistance / distanceToCamera));

      const titlePos = centerWorldPos.clone();
      titlePos.y += BUBBLE_RADIUS + 80;
      const titleScreen = titlePos.clone().project(camera);

      if (titleScreen.z < 1) {
        const titleX = (titleScreen.x * 0.5 + 0.5) * window.innerWidth;
        const titleY = (-titleScreen.y * 0.5 + 0.5) * window.innerHeight;
        sectionTitle.style.left = `${titleX}px`;
        sectionTitle.style.top = `${titleY}px`;
        sectionTitle.style.transform = `translateX(-50%) scale(${scale})`;
        sectionTitle.style.opacity = groupOpacity;
      }

      const subtitlePos = centerWorldPos.clone();
      subtitlePos.y -= BUBBLE_RADIUS + 80;
      const subtitleScreen = subtitlePos.clone().project(camera);

      if (subtitleScreen.z < 1) {
        const subtitleX = (subtitleScreen.x * 0.5 + 0.5) * window.innerWidth;
        const subtitleY = (-subtitleScreen.y * 0.5 + 0.5) * window.innerHeight;
        sectionSubtitle.style.left = `${subtitleX}px`;
        sectionSubtitle.style.top = `${subtitleY}px`;
        sectionSubtitle.style.transform = `translateX(-50%) scale(${scale})`;
        sectionSubtitle.style.opacity = groupOpacity;
      }
    }
  } else {
    if (sectionTitle) sectionTitle.style.opacity = 0;
    if (sectionSubtitle) sectionSubtitle.style.opacity = 0;
  }

  // Detail panel positioning (follows the animated character position)
  if (detailPanel && isDetailOpen && selectedBubbleIndex >= 0) {
    const crew = CREW_DATA[selectedBubbleIndex];
    const worldPos = new THREE.Vector3(
      animatedX[selectedBubbleIndex] + parallaxX,
      crew.y - parallaxY,
      groupZ
    );

    const distanceToCamera = camera.position.z - groupZ;
    if (distanceToCamera > 50 && distanceToCamera < 1500) {
      const baseDistance = 800;
      const scale = Math.max(0.5, Math.min(2.5, baseDistance / distanceToCamera));

      const textPos = worldPos.clone();
      textPos.x += BUBBLE_RADIUS + 100;

      const textScreen = textPos.clone().project(camera);
      const textContainer = detailPanel.querySelector('.crew-detail-text');

      if (textScreen.z < 1 && textContainer) {
        const textX = (textScreen.x * 0.5 + 0.5) * window.innerWidth;
        const textY = (-textScreen.y * 0.5 + 0.5) * window.innerHeight;
        textContainer.style.left = `${textX}px`;
        textContainer.style.top = `${textY}px`;
        textContainer.style.transform = `translate(0%, -50%) scale(${scale})`;
      }
    }
  }
}

function destroy() {
  // Clear custom render
  clearCustomRender();

  // Remove resize listener
  window.removeEventListener('resize', onResize);

  // Dispose render targets
  if (sceneTarget) sceneTarget.dispose();
  if (blurTarget1) blurTarget1.dispose();
  if (blurTarget2) blurTarget2.dispose();
  if (blurMaterialH) blurMaterialH.dispose();
  if (blurMaterialV) blurMaterialV.dispose();
  if (fullscreenQuad) fullscreenQuad.geometry.dispose();

  // Dispose Three.js objects
  diskMeshes.forEach(mesh => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  characterTextures.forEach(texture => {
    texture.dispose();
  });

  if (bubblesGroup && bubblesGroup.parent) {
    bubblesGroup.parent.remove(bubblesGroup);
  }

  if (container) container.remove();
  if (detailPanel) detailPanel.remove();
  if (styleEl) styleEl.remove();

  camera = null;
  renderer = null;
  scene = null;
  parentGroup = null;
  bubblesGroup = null;
  sceneTarget = null;
  blurTarget1 = null;
  blurTarget2 = null;
  blurMaterialH = null;
  blurMaterialV = null;
  fullscreenQuad = null;
  fullscreenCamera = null;
  diskMeshes = [];
  characterTextures = [];
  container = null;
  nameLabels = [];
  clickIcons = [];
  sectionTitle = null;
  sectionSubtitle = null;
  detailPanel = null;
  styleEl = null;
  selectedBubbleIndex = -1;
  isDetailTransitioning = false;
  isInitialized = false;
  bubblesVisible = false;
  animatedX = [CREW_DATA[0].x, CREW_DATA[1].x, CREW_DATA[2].x];
}

export { init, update, destroy };

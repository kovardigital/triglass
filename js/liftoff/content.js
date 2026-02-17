/* ==========================================================================
   Liftoff - Content Module
   3D text sections with parallax and scroll animation
   ========================================================================== */

import * as Parallax from './parallax.js';

// Configuration
const SECTION_DEPTH = 1000; // Distance between sections in Z-space

// Section content data
const SECTIONS = [
  { title: 'LIFTOFF', subtitle: 'A journey beyond the stars' },
  { title: 'THE MISSION', subtitle: "Humanity's greatest adventure" },
  { title: 'THE CREW', subtitle: 'Five astronauts. One chance.' },
  { title: 'THE STAKES', subtitle: 'Everything we know hangs in the balance' },
  { title: 'COMING SOON', subtitle: '2026' }
];

// DOM elements
let viewport = null;
let world = null;
let scrollSpacer = null;
let debugDisplay = null;
const sectionElements = [];

// Total Z depth for all sections
const totalDepth = (SECTIONS.length - 1) * SECTION_DEPTH;

// Check if we're in development mode
function isDev() {
  const hostname = window.location.hostname;
  return hostname === 'localhost' ||
         hostname === '127.0.0.1' ||
         hostname.includes('webflow.io');
}

// Inject additional CSS for 3D text
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .liftoff-viewport {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      perspective: 1000px;
      perspective-origin: 50% 50%;
      overflow: hidden;
      z-index: 10;
      pointer-events: none;
    }
    .liftoff-world {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
    }
    .liftoff-section {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80vw;
      max-width: 800px;
      text-align: center;
      transform-style: flat;
      backface-visibility: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .liftoff-section h1 {
      font-size: clamp(32px, 8vw, 80px);
      font-weight: 700;
      margin: 0 0 20px 0;
      letter-spacing: -0.02em;
      color: #fff;
    }
    .liftoff-section p {
      font-size: clamp(16px, 2vw, 22px);
      line-height: 1.6;
      color: rgba(255,255,255,0.7);
      margin: 0;
    }
  `;
  document.head.appendChild(style);
}

// Initialize content elements
function init() {
  injectStyles();

  // Create 3D viewport
  viewport = document.createElement('div');
  viewport.className = 'liftoff-viewport';

  // Create 3D world that moves on scroll
  world = document.createElement('div');
  world.className = 'liftoff-world';
  viewport.appendChild(world);

  // Create sections at different Z depths
  SECTIONS.forEach((data, index) => {
    const section = document.createElement('div');
    section.className = 'liftoff-section';
    section.innerHTML = `<h1>${data.title}</h1><p>${data.subtitle}</p>`;

    // Position each section further back in Z
    const zPos = -index * SECTION_DEPTH;
    section.style.transform = `translate(-50%, -50%) translateZ(${zPos}px)`;
    section.dataset.zPos = zPos;

    world.appendChild(section);
    sectionElements.push(section);
  });

  document.body.appendChild(viewport);

  // Scroll spacer to create scroll height
  scrollSpacer = document.createElement('div');
  scrollSpacer.className = 'liftoff-scroll-spacer';
  document.body.appendChild(scrollSpacer);

  // Debug display (dev only)
  if (isDev()) {
    debugDisplay = document.createElement('div');
    debugDisplay.className = 'liftoff-debug';
    debugDisplay.innerHTML = 'Scroll: 0%';
    document.body.appendChild(debugDisplay);
  }

  console.log('[LIFTOFF] Content initialized with', SECTIONS.length, 'sections');
}

// Update content based on scroll progress
function update(scrollProgress) {
  if (!world || !viewport) return;

  const mouse = Parallax.getMouse();

  // Calculate world Z position based on scroll
  const worldZ = scrollProgress * totalDepth;

  // Apply parallax to viewport - text moves TOWARDS mouse (foreground feel)
  const steerAngle = mouse.x * 8; // degrees
  const offsetX = mouse.x * 40;   // Positive = follows mouse
  const offsetY = mouse.y * 35;
  viewport.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${-steerAngle * 0.5}deg)`;

  // Move world forward in Z
  world.style.transform = `translate(-50%, -50%) translateZ(${worldZ}px)`;

  // Update opacity for each section based on effective Z position
  sectionElements.forEach((section) => {
    const sectionZ = parseFloat(section.dataset.zPos);
    const effectiveZ = sectionZ + worldZ;

    let opacity = 0;

    if (effectiveZ < -800) {
      // Too far away - invisible
      opacity = 0;
    } else if (effectiveZ < -100) {
      // Fading in as it approaches
      opacity = (effectiveZ + 800) / 700;
    } else if (effectiveZ <= 300) {
      // In the sweet spot - fully visible
      opacity = 1;
    } else {
      // Very close - dim but don't disappear
      opacity = Math.max(0.3, 1 - (effectiveZ - 300) / 500);
    }

    section.style.opacity = Math.max(0, Math.min(1, opacity));
  });

  // Update debug display
  if (debugDisplay) {
    debugDisplay.innerHTML = `Scroll: ${Math.round(scrollProgress * 100)}% | Z: ${Math.round(worldZ)} | Mouse: ${mouse.x.toFixed(2)}, ${mouse.y.toFixed(2)}`;
  }
}

// Cleanup
function destroy() {
  if (viewport) viewport.remove();
  if (scrollSpacer) scrollSpacer.remove();
  if (debugDisplay) debugDisplay.remove();
  viewport = null;
  world = null;
  scrollSpacer = null;
  debugDisplay = null;
  sectionElements.length = 0;
}

export { init, update, destroy };

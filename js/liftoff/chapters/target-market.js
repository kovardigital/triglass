/* ==========================================================================
   Liftoff - TARGET MARKET Chapter
   Venn diagram showing three overlapping audience segments
   ========================================================================== */

import { getSectionConfig } from '../config.js';

// Chapter configuration
export const config = {
  title: 'TARGET MARKET',
  subtitle: 'The film is designed to reach three distinct audiences, with a shared overlap that allows us to engage all three at once and maximize both reach and long-term value.',
  targetMarketLayout: true,
  images: []
};

// Venn diagram dimensions
const CIRCLE_RADIUS = 130;
const DIAGRAM_SIZE = 420;

// Target audience segments - muted accent colors for subtle differentiation
const AUDIENCE_SEGMENTS = [
  {
    id: 'kids',
    title: 'Kids & Teens',
    ageRange: '8–16',
    // Position: top-left of center
    offsetX: -65,
    offsetY: -55,
    // Label offset from circle center (push towards outer edge)
    labelOffsetX: -30,
    labelOffsetY: -25
  },
  {
    id: 'parents',
    title: 'Adults',
    subtitle: 'with Kids',
    // Position: top-right of center
    offsetX: 65,
    offsetY: -55,
    // Label offset from circle center
    labelOffsetX: 30,
    labelOffsetY: -25
  },
  {
    id: 'nostalgia',
    title: 'Nostalgia-Seeking',
    subtitle: 'Adults',
    // Position: bottom-center
    offsetX: 0,
    offsetY: 65,
    // Label offset from circle center
    labelOffsetX: 0,
    labelOffsetY: 35
  }
];

// DOM elements
let vennContainer = null;
let sectionIndex = -1;

// Z range for content (matching content.js)
const IMAGE_START_Z = -800;
const IMAGE_END_Z = 600;

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('target-market-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'target-market-chapter-styles';
  style.textContent = `
    /* Target Market layout - title at top, subtitle at bottom */
    .liftoff-text.target-market-layout {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 10vh 0 8vh 0;
      transform: none !important;
    }
    .liftoff-text.target-market-layout h1 {
      font-size: clamp(24px, 4vw, 48px);
      margin: 0;
      width: 100%;
      text-align: center !important;
    }
    .liftoff-text.target-market-layout p {
      font-size: clamp(10px, 1.2vw, 13px);
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
      text-align: center !important;
      line-height: 1.6;
    }

    /* Venn diagram container */
    .target-market-venn {
      position: absolute;
      width: ${DIAGRAM_SIZE}px;
      height: ${DIAGRAM_SIZE}px;
      transform-style: preserve-3d;
      pointer-events: auto;
    }

    /* Individual circle - light fill with visible stroke */
    .venn-circle {
      position: absolute;
      width: ${CIRCLE_RADIUS * 2}px;
      height: ${CIRCLE_RADIUS * 2}px;
      border-radius: 50%;
      background: rgba(60,60,90,0.25);
      border: 1px solid rgba(255,255,255,0.35);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                  border-color 0.3s ease-out,
                  box-shadow 0.3s ease-out;
    }
    .venn-circle:hover {
      transform: scale(1.02) translateZ(10px);
      border-color: rgba(255,255,255,0.5);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 10;
    }

    /* Circle label container - positioned away from center overlap */
    .venn-circle .circle-label {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .venn-circle .circle-title {
      font-family: 'montserrat', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      line-height: 1.3;
    }
    .venn-circle .circle-subtitle {
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 400;
      color: rgba(255,255,255,0.7);
    }
    .venn-circle .circle-age {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: rgba(255,255,255,0.5);
      margin-top: 6px;
    }

    /* Center overlap area */
    .venn-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 20;
      pointer-events: none;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: rgba(30,30,50,0.6);
      border: 1px solid rgba(255,255,255,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .venn-center .center-logo {
      font-family: 'gin', serif;
      font-size: 18px;
      font-weight: 400;
      color: #FED003;
      text-shadow: 0 0 20px rgba(254,208,3,0.5);
      letter-spacing: 0.02em;
    }
  `;
  document.head.appendChild(style);
}

// Initialize chapter DOM elements
export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.targetMarketLayout);
  if (sectionIndex < 0) {
    console.warn('[TARGET-MARKET] Could not find TARGET MARKET section');
    return;
  }

  // Create Venn diagram container
  vennContainer = document.createElement('div');
  vennContainer.className = 'target-market-venn';

  // Create circles
  const centerX = DIAGRAM_SIZE / 2;
  const centerY = DIAGRAM_SIZE / 2;

  AUDIENCE_SEGMENTS.forEach(segment => {
    const circle = document.createElement('div');
    circle.className = 'venn-circle';

    // Position circle
    const x = centerX + segment.offsetX - CIRCLE_RADIUS;
    const y = centerY + segment.offsetY - CIRCLE_RADIUS;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;

    // Create label container positioned towards outer edge
    const labelContainer = document.createElement('div');
    labelContainer.className = 'circle-label';
    // Position label: center of circle + label offset
    const labelX = CIRCLE_RADIUS + (segment.labelOffsetX || 0);
    const labelY = CIRCLE_RADIUS + (segment.labelOffsetY || 0);
    labelContainer.style.left = `${labelX}px`;
    labelContainer.style.top = `${labelY}px`;
    labelContainer.style.transform = 'translate(-50%, -50%)';

    // Build label HTML
    let labelHTML = `<span class="circle-title">${segment.title}</span>`;
    if (segment.subtitle) {
      labelHTML += `<span class="circle-subtitle">${segment.subtitle}</span>`;
    }
    if (segment.ageRange) {
      labelHTML += `<span class="circle-age">${segment.ageRange}</span>`;
    }

    labelContainer.innerHTML = labelHTML;
    circle.appendChild(labelContainer);
    vennContainer.appendChild(circle);
  });

  // Create center label (LIFTOFF)
  const centerLabel = document.createElement('div');
  centerLabel.className = 'venn-center';
  centerLabel.innerHTML = `<span class="center-logo">LIFTOFF</span>`;
  vennContainer.appendChild(centerLabel);

  vennContainer.style.opacity = 0;
  imgWorld.appendChild(vennContainer);

  console.log('[TARGET-MARKET] Chapter initialized with Venn diagram');
}

// Update chapter based on scroll position
export function update(cameraZ, mouse, leanAngle, elasticOffset) {
  if (sectionIndex < 0 || !vennContainer) return;

  // Get section config for TARGET MARKET
  const sectionConfig = getSectionConfig(sectionIndex);
  const snapZ = sectionConfig.snapZ;
  const approachDistance = sectionConfig.approachDistance;
  const departDistance = sectionConfig.departDistance;

  // Calculate section progress based on camera Z
  const contentStart = snapZ + approachDistance;
  const totalRange = approachDistance + departDistance;

  // t: 0 = content just starting, 1 = content passed
  const t = totalRange > 0
    ? Math.max(0, Math.min(1, (contentStart - cameraZ) / totalRange))
    : 0;

  // CSS Z position for the diagram
  const zPos = IMAGE_START_Z + (IMAGE_END_Z - IMAGE_START_Z) * t;

  // Calculate opacity
  let opacity = 0;
  if (t > 0 && t < 1) {
    // Fade in during first 15%
    if (t < 0.15) {
      opacity = t / 0.15;
    } else if (t > 0.85) {
      // Fade out in last 15%
      opacity = 1 - ((t - 0.85) / 0.15);
    } else {
      opacity = 1;
    }

    // Proximity fade when close to camera
    if (zPos > 300) {
      const proximityFade = 1 - ((zPos - 300) / 300);
      opacity *= Math.max(0, proximityFade);
    }
  }

  // Subtle parallax with mouse
  const panX = mouse.x * 25;
  const panY = -mouse.y * 15;

  // Apply transform to Venn container
  vennContainer.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) translateZ(${zPos}px) rotate(${leanAngle}deg)`;
  vennContainer.style.opacity = Math.max(0, Math.min(1, opacity));
}

// Cleanup chapter DOM
export function destroy() {
  if (vennContainer) {
    vennContainer.remove();
    vennContainer = null;
  }
  sectionIndex = -1;

  const styles = document.getElementById('target-market-chapter-styles');
  if (styles) styles.remove();
}

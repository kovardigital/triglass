/* ==========================================================================
   Liftoff - TARGET MARKET Chapter
   Venn diagram showing three overlapping audience segments
   ========================================================================== */

// Uses discrete section system from content.js

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
    labelOffsetY: -25,
    // Dark blue
    color: 'rgb(20 30 50 / 70%)'
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
    labelOffsetY: -25,
    // Dark gold/brown
    color: 'rgb(39 36 19 / 70%)'
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
    labelOffsetY: 35,
    // Dark green
    color: 'rgb(20 40 25 / 70%)'
  }
];

// DOM elements
let vennContainer = null;
let sectionIndex = -1;

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;  // Must be < perspective 1000px

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('target-market-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'target-market-chapter-styles';
  style.textContent = `
    /* Target Market layout - title above Venn diagram, subtitle below */
    .liftoff-text.target-market-layout {
      top: calc(28% - 50px);
      max-width: none;
      width: 100vw;
    }
    .liftoff-text.target-market-layout h1 {
      font-size: clamp(32px, 5vw, 56px);
    }
    .liftoff-text.target-market-layout p {
      position: absolute;
      top: 550px;
      left: 50%;
      transform: translateX(-50%);
      font-size: clamp(11px, 1.3vw, 15px);
      max-width: 900px;
      width: 90vw;
      padding: 0 20px;
      text-align: center;
      line-height: 1.6;
    }

    /* Venn diagram container */
    .target-market-venn {
      position: absolute;
      width: ${DIAGRAM_SIZE}px;
      height: ${DIAGRAM_SIZE}px;
      transform-style: preserve-3d;
      pointer-events: none;
    }

    /* Individual circle - darker fill to dim space scene behind */
    .venn-circle {
      position: absolute;
      width: ${CIRCLE_RADIUS * 2}px;
      height: ${CIRCLE_RADIUS * 2}px;
      border-radius: 50%;
      background: rgb(20 25 40 / 70%);
      border: none;
      box-shadow:
        inset 0 -40px 60px -30px rgba(0,0,0,0.3),
        inset 0 40px 60px -30px rgba(255,255,255,0.1),
        0 2px 8px rgba(0,0,0,0.2);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                  box-shadow 0.3s ease-out;
    }
    /* Gradient border - bright top to black bottom */
    .venn-circle::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      padding: 1px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.6) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      pointer-events: none;
    }
    /* Rim light highlight */
    .venn-circle::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 10%;
      right: 10%;
      height: 40%;
      border-radius: 50% 50% 50% 50% / 100% 100% 0% 0%;
      background: linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 100%);
      pointer-events: none;
    }
    .venn-circle:hover {
      transform: scale(1.02) translateZ(10px);
      box-shadow:
        inset 0 -40px 60px -30px rgba(0,0,0,0.3),
        inset 0 40px 60px -30px rgba(255,255,255,0.15),
        0 10px 30px rgba(0,0,0,0.3);
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

    // Apply segment color
    if (segment.color) {
      circle.style.background = segment.color;
    }

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

// Update chapter based on discrete section system (matching content.js)
export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !vennContainer) return;

  const goingForward = targetSection > currentSection;

  let vennZ = REST_Z;
  let vennOpacity = 0;
  let vennScale = 1;

  if (isTransitioning) {
    if (sectionIndex === currentSection) {
      // TARGET MARKET is current section, animating away
      if (goingForward) {
        vennZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
        vennScale = 1 + transitionProgress * 0.5;
        vennOpacity = Math.max(0, 1 - transitionProgress * 2); // Fade out twice as fast
      } else {
        vennZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
        vennScale = 1 - transitionProgress * 0.3;
        vennOpacity = 1 - transitionProgress;
      }
    } else if (sectionIndex === targetSection) {
      // TARGET MARKET is target section, approaching
      if (goingForward) {
        vennZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
        vennScale = 0.7 + transitionProgress * 0.3;
      } else {
        vennZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
        vennScale = 1.5 - transitionProgress * 0.5;
      }
      vennOpacity = transitionProgress;
    }
  } else {
    // At rest
    if (sectionIndex === currentSection) {
      vennZ = REST_Z + elasticOffset * 500;
      vennOpacity = 1;

      // Apply scroll anticipation
      if (scrollAnticipation < 0) {
        vennZ = REST_Z + Math.abs(scrollAnticipation) * 200;
        vennScale = 1 + Math.abs(scrollAnticipation) * 0.2;
        vennOpacity = 1 - Math.abs(scrollAnticipation) * 0.5;
      } else if (scrollAnticipation > 0) {
        vennZ = REST_Z - scrollAnticipation * 400;
        vennScale = 1 - scrollAnticipation * 0.3;
        vennOpacity = 1 - scrollAnticipation * 0.6;
      }
    }
  }

  // Subtle parallax with mouse
  const panX = mouse.x * 25;
  const panY = -mouse.y * 15;

  // Apply transform to Venn container
  vennContainer.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) translateZ(${vennZ}px) rotate(${leanAngle}deg) scale(${vennScale})`;
  vennContainer.style.opacity = Math.max(0, Math.min(1, vennOpacity));
  // Only allow interactions when visible
  vennContainer.style.pointerEvents = vennOpacity > 0.5 ? 'auto' : 'none';
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

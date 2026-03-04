/* ==========================================================================
   Liftoff - TARGET MARKET Chapter
   Venn diagram showing three overlapping audience segments
   Uses image with clickable hotspots
   ========================================================================== */

// Uses discrete section system from content.js

// Chapter configuration
export const config = {
  title: 'TARGET MARKET',
  subtitle: 'The film is designed to reach three distinct audiences, with a shared overlap that allows us to engage all three at once and maximize both reach and long-term value.',
  targetMarketLayout: true,
  images: []
};

// Venn diagram image
const VENN_IMAGE_URL = 'https://triglass-assets.s3.amazonaws.com/venn.png';
const DIAGRAM_WIDTH = 500;
const DIAGRAM_HEIGHT = 500;

// Target audience segments with detailed descriptions and hotspot positions
const AUDIENCE_SEGMENTS = [
  {
    id: 'kids',
    title: 'Kids & Teens',
    ageRange: '8–16',
    description: 'Young viewers drawn to adventure, humor, and relatable coming-of-age themes. They connect with the journey of discovery and the wonder of space exploration.',
    // Hotspot position (percentage from top-left of image)
    hotspot: { x: 22, y: 28, radius: 22 },
    color: 'rgb(55 140 200)'
  },
  {
    id: 'parents',
    title: 'Adults with Kids',
    ageRange: '30–50',
    description: 'Parents looking for quality family entertainment with heart. They appreciate films that spark imagination and create shared experiences with their children.',
    // Hotspot position
    hotspot: { x: 78, y: 28, radius: 22 },
    color: 'rgb(220 160 40)'
  },
  {
    id: 'nostalgia',
    title: 'Nostalgia-Seeking Adults',
    ageRange: '25–45',
    description: 'Adults who grew up with classic animated adventures and sci-fi. They seek films that recapture that sense of wonder while offering sophisticated storytelling.',
    // Hotspot position
    hotspot: { x: 50, y: 72, radius: 22 },
    color: 'rgb(65 155 85)'
  }
];

// DOM elements
let vennContainer = null;
let vennImage = null;
let detailsPanel = null;
let hotspotElements = [];
let sectionIndex = -1;
let selectedSegmentIndex = -1;

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
      transition: opacity 0.4s ease-out;
    }
    .liftoff-text.target-market-layout.segment-selected {
      opacity: 0;
      pointer-events: none;
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
      width: ${DIAGRAM_WIDTH}px;
      height: ${DIAGRAM_HEIGHT}px;
      transform-style: preserve-3d;
      pointer-events: none;
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .target-market-venn.segment-selected {
      transform: translate(calc(-50% - 150px), -50%) translateZ(200px) scale(0.85) !important;
    }

    /* Venn diagram image */
    .venn-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      pointer-events: none;
    }

    /* Clickable hotspots over each segment */
    .venn-hotspot {
      position: absolute;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
      /* Debug: uncomment to see hotspots */
      /* background: rgba(255, 0, 0, 0.2); */
    }
    .venn-hotspot:hover {
      transform: scale(1.05);
    }
    .target-market-venn.segment-selected .venn-hotspot {
      opacity: 0.3;
    }
    .target-market-venn.segment-selected .venn-hotspot.selected {
      opacity: 1;
    }

    /* Segment details panel */
    .segment-details {
      position: absolute;
      top: 50%;
      right: -320px;
      transform: translateY(-50%);
      width: 280px;
      padding: 30px;
      background: rgba(15, 20, 35, 0.95);
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s ease-out, right 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .target-market-venn.segment-selected .segment-details {
      opacity: 1;
      right: -350px;
      pointer-events: auto;
    }
    .segment-details .segment-title {
      font-family: 'montserrat', sans-serif;
      font-size: 22px;
      font-weight: 600;
      color: #fff;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .segment-details .segment-age {
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: rgba(255,255,255,0.6);
      margin: 0 0 20px 0;
    }
    .segment-details .segment-description {
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 300;
      color: rgba(255,255,255,0.8);
      line-height: 1.7;
      margin: 0;
    }
    .segment-details .close-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      width: 28px;
      height: 28px;
      border: none;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      color: rgba(255,255,255,0.7);
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease-out, color 0.2s ease-out;
    }
    .segment-details .close-btn:hover {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }
  `;
  document.head.appendChild(style);
}

// Handle hotspot click
function onHotspotClick(index, event) {
  event.stopPropagation();

  if (selectedSegmentIndex === index) {
    // Clicking same hotspot - deselect
    deselectSegment();
  } else {
    // Select this segment
    selectSegment(index);
  }
}

// Select a segment
function selectSegment(index) {
  selectedSegmentIndex = index;
  const segment = AUDIENCE_SEGMENTS[index];

  // Add selected class to container
  vennContainer.classList.add('segment-selected');

  // Update hotspot states
  hotspotElements.forEach((hotspot, i) => {
    hotspot.classList.toggle('selected', i === index);
  });

  // Update details panel
  if (detailsPanel) {
    detailsPanel.querySelector('.segment-title').textContent = segment.title;
    detailsPanel.querySelector('.segment-age').textContent = `Ages ${segment.ageRange}`;
    detailsPanel.querySelector('.segment-description').textContent = segment.description;
    // Set accent color on border
    detailsPanel.style.borderColor = segment.color;
  }

  // Hide main title/subtitle
  const textContainer = document.querySelector('.liftoff-text.target-market-layout');
  if (textContainer) {
    textContainer.classList.add('segment-selected');
  }
}

// Deselect segment (exported for click-outside handling)
export function deselectSegment() {
  if (selectedSegmentIndex < 0) return;

  selectedSegmentIndex = -1;

  // Remove selected class from container
  if (vennContainer) {
    vennContainer.classList.remove('segment-selected');
  }

  // Clear hotspot states
  hotspotElements.forEach(hotspot => {
    hotspot.classList.remove('selected');
  });

  // Show main title/subtitle
  const textContainer = document.querySelector('.liftoff-text.target-market-layout');
  if (textContainer) {
    textContainer.classList.remove('segment-selected');
  }
}

// Check if a segment is selected
export function isSegmentSelected() {
  return selectedSegmentIndex >= 0;
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

  // Create the Venn diagram image
  vennImage = document.createElement('img');
  vennImage.className = 'venn-image';
  vennImage.src = VENN_IMAGE_URL;
  vennImage.alt = 'Target Market Venn Diagram';
  vennContainer.appendChild(vennImage);

  // Create clickable hotspots for each segment
  hotspotElements = [];
  AUDIENCE_SEGMENTS.forEach((segment, index) => {
    const hotspot = document.createElement('div');
    hotspot.className = 'venn-hotspot';
    hotspot.dataset.segmentIndex = index;

    // Position and size the hotspot based on percentage coordinates
    const size = segment.hotspot.radius * 2;
    hotspot.style.width = `${size}%`;
    hotspot.style.height = `${size}%`;
    hotspot.style.left = `${segment.hotspot.x - segment.hotspot.radius}%`;
    hotspot.style.top = `${segment.hotspot.y - segment.hotspot.radius}%`;

    // Add click handler
    hotspot.addEventListener('click', (e) => onHotspotClick(index, e));

    vennContainer.appendChild(hotspot);
    hotspotElements.push(hotspot);
  });

  // Create details panel
  detailsPanel = document.createElement('div');
  detailsPanel.className = 'segment-details';
  detailsPanel.innerHTML = `
    <button class="close-btn">×</button>
    <h3 class="segment-title"></h3>
    <p class="segment-age"></p>
    <p class="segment-description"></p>
  `;
  detailsPanel.querySelector('.close-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    deselectSegment();
  });
  vennContainer.appendChild(detailsPanel);

  vennContainer.style.opacity = 0;
  imgWorld.appendChild(vennContainer);

  console.log('[TARGET-MARKET] Chapter initialized with Venn diagram image');
}

// Update chapter based on discrete section system (matching content.js)
export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !vennContainer) return;

  const goingForward = targetSection > currentSection;

  let vennZ = REST_Z;
  let vennOpacity = 0;
  let vennScale = 1;

  if (isTransitioning) {
    // Deselect when transitioning away
    if (selectedSegmentIndex >= 0) {
      deselectSegment();
    }

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

  // Subtle parallax with mouse (reduced when segment selected)
  const parallaxFactor = selectedSegmentIndex >= 0 ? 0.3 : 1;
  const panX = mouse.x * 25 * parallaxFactor;
  const panY = -mouse.y * 15 * parallaxFactor;

  // Apply transform to Venn container (CSS handles segment-selected offset)
  if (selectedSegmentIndex < 0) {
    vennContainer.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) translateZ(${vennZ}px) rotate(${leanAngle}deg) scale(${vennScale})`;
  }
  vennContainer.style.opacity = Math.max(0, Math.min(1, vennOpacity));
  // Only allow interactions when this is the active section and not transitioning
  vennContainer.style.pointerEvents = (sectionIndex === currentSection && !isTransitioning && vennOpacity > 0.5) ? 'auto' : 'none';
}

// Cleanup chapter DOM
export function destroy() {
  if (vennContainer) {
    vennContainer.remove();
    vennContainer = null;
  }
  vennImage = null;
  detailsPanel = null;
  hotspotElements = [];
  sectionIndex = -1;
  selectedSegmentIndex = -1;

  const styles = document.getElementById('target-market-chapter-styles');
  if (styles) styles.remove();
}

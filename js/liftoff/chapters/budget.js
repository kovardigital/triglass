/* ==========================================================================
   Liftoff - BUDGET Chapter
   Interactive pie chart showing budget breakdown with drill-down capability
   ========================================================================== */

// Uses discrete section system from content.js

// Chapter configuration
export const config = {
  title: 'BUDGET',
  subtitle: 'Financial Overview',
  budgetLayout: true,
  images: []
};

// Pie chart dimensions - donut style
const PIE_OUTER_RADIUS = 200;
const PIE_INNER_RADIUS = 130; // Inner radius for donut hole
const PIE_CENTER_RADIUS = 100; // Center circle for total/back button
const BACKDROP_PADDING = 24; // Extra padding around pie for blur backdrop
const SEGMENT_GAP = 2; // Gap in degrees between segments
const LEADER_LINE_LENGTH = 30; // Length of leader line for small segments
const LABEL_OFFSET = 8; // Distance from leader line end to label

// Main budget categories based on Liftoff Budget Draft V1 (03-03-26)
// Grand Total: $2,195,214
const BUDGET_DATA = {
  total: 2195214,
  categories: [
    {
      id: 'production',
      label: 'Production',
      percent: 44,
      color: '#4ECDC4', // Teal
      description: 'Below-the-line production: crew, equipment, locations, and operations',
      subcategories: [
        { label: 'Locations', percent: 14, color: '#5ED4CB' },
        { label: 'Camera', percent: 14, color: '#4ECDC4' },
        { label: 'Crew', percent: 13, color: '#3DBDB5' },
        { label: 'Travel & Living', percent: 11, color: '#2CADA5' },
        { label: 'Electrical', percent: 9, color: '#1C9D95' },
        { label: 'Set Operations', percent: 8, color: '#0C8D85' },
        { label: 'Other', percent: 31, color: '#3DBDB5' }
      ]
    },
    {
      id: 'atl',
      label: 'Above-The-Line',
      percent: 29,
      color: '#FF6B6B', // Coral/Red
      description: 'Story rights, cast, direction, producers, and ATL travel',
      subcategories: [
        { label: 'Story & Rights', percent: 42, color: '#FF7B7B' },
        { label: 'Cast', percent: 35, color: '#FF6B6B' },
        { label: 'ATL Travel', percent: 16, color: '#FF5B5B' },
        { label: 'Direction', percent: 4, color: '#FF4B4B' },
        { label: 'Producers', percent: 3, color: '#FF3B3B' }
      ]
    },
    {
      id: 'post',
      label: 'Post Production',
      percent: 11,
      color: '#9B59B6', // Purple
      description: 'Editing, VFX, sound, color, music, and deliverables',
      subcategories: [
        { label: 'Visual Effects', percent: 42, color: '#A569C6' },
        { label: 'Editing', percent: 19, color: '#9B59B6' },
        { label: 'DI & Color', percent: 12, color: '#8B49A6' },
        { label: 'Deliverables', percent: 11, color: '#7B3996' },
        { label: 'Sound', percent: 8, color: '#6B2986' },
        { label: 'Music', percent: 6, color: '#5B1976' },
        { label: 'Titles', percent: 2, color: '#4B0966' }
      ]
    },
    {
      id: 'contingency',
      label: 'Contingency',
      percent: 9,
      color: '#F4D03F', // Golden yellow
      description: '10% reserve for unexpected costs and production overages',
      subcategories: []
    },
    {
      id: 'general',
      label: 'General & Fees',
      percent: 7,
      color: '#2C3E50', // Dark navy/slate
      description: 'Insurance, legal, finance fees, and residual reserves',
      subcategories: [
        { label: 'General Expense', percent: 32, color: '#3C4E60' },
        { label: 'Insurance', percent: 25, color: '#2C3E50' },
        { label: 'Residuals', percent: 20, color: '#1C2E40' },
        { label: 'Finance Fees', percent: 14, color: '#1C2E40' },
        { label: 'Legal', percent: 9, color: '#0C1E30' }
      ]
    }
  ]
};

// DOM elements
let budgetContainer = null;
let svgElement = null;
let infoPanelElement = null;
let blurBackdropElement = null;
let sectionIndex = -1;

// State
let currentView = 'main'; // 'main' or category id

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('budget-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'budget-chapter-styles';
  style.textContent = `
    /* Budget layout - hide default title/subtitle, we handle it ourselves */
    .liftoff-text.budget-layout {
      display: none;
    }
    .liftoff-preview.preview-budget {
      display: none;
    }

    /* Budget container - horizontal layout: pie on left, text on right */
    .budget-container {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 60px;
    }

    /* Right side content (title + info) */
    .budget-text-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    /* Budget title */
    .budget-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(24px, 3.6vw, 42px);
      font-weight: 400;
      color: #d4d4d4;
      text-transform: uppercase;
      margin-bottom: 16px;
      letter-spacing: 0.14em;
    }

    /* Info panel - fixed position below title */
    .budget-info-panel {
      min-height: 100px;
      width: 320px;
    }
    .budget-info-title {
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: rgba(255,255,255,0.95);
      margin-bottom: 4px;
    }
    .budget-info-amount {
      font-family: 'montserrat', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #FED003;
      margin-bottom: 8px;
    }
    .budget-info-desc {
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255,255,255,0.7);
      line-height: 1.5;
    }
    .budget-info-hint {
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 400;
      color: rgba(255,255,255,0.5);
      margin-top: 8px;
    }
    .budget-info-default {
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255,255,255,0.5);
      font-style: italic;
    }

    /* Blur backdrop circle - matching crew/character styling */
    /* Appended directly to imgWorld for proper backdrop-filter during 3D transforms */
    .budget-blur-backdrop {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      pointer-events: none;
      overflow: hidden;
      width: ${(PIE_OUTER_RADIUS + BACKDROP_PADDING) * 2}px;
      height: ${(PIE_OUTER_RADIUS + BACKDROP_PADDING) * 2}px;
    }
    /* Linear gradient stroke - matching character styling */
    .budget-blur-backdrop::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      padding: 1px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.4) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      pointer-events: none;
    }
    /* Subtle glint animation */
    @keyframes budget-glint {
      0% { left: -60%; opacity: 0; }
      5% { opacity: 1; }
      20% { left: 110%; opacity: 0; }
      100% { left: 110%; opacity: 0; }
    }
    .budget-blur-backdrop::after {
      content: '';
      position: absolute;
      top: 0;
      left: -60%;
      width: 55%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
      transform: skewX(-20deg);
      animation: budget-glint 6s ease-in-out infinite;
      pointer-events: none;
    }

    /* Pie wrapper for relative positioning */
    .budget-pie-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* SVG pie chart - pointer-events controlled by JS based on section visibility */
    .budget-pie-svg {
      overflow: visible;
      position: relative;
      z-index: 1;
    }

    /* Pie segments - slight transparency to match schedule pills */
    .pie-segment {
      cursor: pointer;
      pointer-events: auto;
      fill-opacity: 0.8;
      transition: filter 0.3s ease,
                  transform 0.2s ease;
      transform-origin: center;
    }
    .pie-segment:hover {
      transform: scale(1.02);
    }
    .pie-segment.active {
      transform: scale(1.02);
    }

    /* Segment labels - inside donut */
    .pie-label {
      font-family: 'montserrat', sans-serif;
      font-size: 13px;
      font-weight: 600;
      fill: rgba(255,255,255,0.95);
      text-anchor: middle;
      pointer-events: none;
      text-shadow: 0 1px 1px rgba(0,0,0,0.5), 0 2px 2px rgba(0,0,0,0.5);
    }
    .pie-label-percent {
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 700;
      fill: rgba(255,255,255,0.9);
      text-anchor: middle;
      pointer-events: none;
      text-shadow: 0 1px 1px rgba(0,0,0,0.5), 0 2px 2px rgba(0,0,0,0.5);
    }

    /* Leader lines for small segments */
    .pie-leader-line {
      stroke: rgba(255,255,255,0.4);
      stroke-width: 1;
      fill: none;
      pointer-events: none;
    }
    .pie-leader-dot {
      fill: rgba(255,255,255,0.6);
      pointer-events: none;
    }

    /* External labels for small segments */
    .pie-label-external {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 500;
      fill: rgba(255,255,255,0.85);
      pointer-events: none;
    }
    .pie-label-external-percent {
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 600;
      fill: rgba(255,255,255,0.7);
      pointer-events: none;
    }

    /* Center circle - dark hole with subtle border */
    .pie-center {
      fill: rgba(15, 20, 30, 0.95);
      stroke: rgba(255,255,255,0.15);
      stroke-width: 2;
      cursor: default;
      pointer-events: auto;
    }
    .pie-center.clickable {
      cursor: pointer;
    }
    .pie-center.clickable:hover {
      fill: rgba(25, 30, 45, 0.95);
    }
    .pie-center-text {
      font-family: 'montserrat', sans-serif;
      font-size: 24px;
      font-weight: 600;
      fill: #4ECDC4;
      text-anchor: middle;
      pointer-events: none;
    }
    .pie-center-label {
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 400;
      fill: rgba(255,255,255,0.5);
      text-anchor: middle;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      pointer-events: none;
    }

    /* Back arrow */
    .pie-back-arrow {
      font-family: 'montserrat', sans-serif;
      font-size: 18px;
      fill: rgba(255,255,255,0.7);
      text-anchor: middle;
      pointer-events: none;
      transition: fill 0.2s ease;
    }
    .pie-center.clickable:hover .pie-back-arrow {
      fill: rgba(255,255,255,1);
    }
  `;
  document.head.appendChild(style);
}

// Format currency
function formatCurrency(amount) {
  if (amount >= 1000000) {
    return '$' + (amount / 1000000).toFixed(1) + 'M';
  } else if (amount >= 1000) {
    return '$' + (amount / 1000).toFixed(0) + 'K';
  }
  return '$' + amount.toFixed(0);
}

// Calculate donut segment path (arc between inner and outer radius)
function describeArc(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", outerStart.x, outerStart.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
    "L", innerStart.x, innerStart.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerEnd.x, innerEnd.y,
    "Z"
  ].join(" ");
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: cx + (radius * Math.cos(angleInRadians)),
    y: cy + (radius * Math.sin(angleInRadians))
  };
}

// Get label position (middle of donut ring)
function getLabelPosition(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const midAngle = (startAngle + endAngle) / 2;
  const labelRadius = (outerRadius + innerRadius) / 2;
  return polarToCartesian(cx, cy, labelRadius, midAngle);
}

// Build pie chart SVG
function buildPieChart() {
  // Larger SVG to accommodate external labels with leader lines
  const size = PIE_OUTER_RADIUS * 2 + 160;
  const cx = size / 2;
  const cy = size / 2;

  svgElement.setAttribute('width', size);
  svgElement.setAttribute('height', size);
  svgElement.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svgElement.innerHTML = '';

  let data;
  let totalForView;

  if (currentView === 'main') {
    data = BUDGET_DATA.categories;
    totalForView = BUDGET_DATA.total;
  } else {
    const category = BUDGET_DATA.categories.find(c => c.id === currentView);
    if (!category || !category.subcategories.length) {
      currentView = 'main';
      buildPieChart();
      return;
    }
    data = category.subcategories;
    totalForView = BUDGET_DATA.total * (category.percent / 100);
  }

  // Create segments first (so leader lines draw on top)
  let currentAngle = 0;
  const segmentData = []; // Store segment info for labels

  data.forEach((segment, index) => {
    const segmentAngle = (segment.percent / 100) * 360;
    const endAngle = currentAngle + segmentAngle;

    // Apply gap: add half gap to start, subtract half gap from end
    const gapStart = currentAngle + SEGMENT_GAP / 2;
    const gapEnd = endAngle - SEGMENT_GAP / 2;

    // Create donut segment path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', describeArc(cx, cy, PIE_OUTER_RADIUS, PIE_INNER_RADIUS, gapStart, gapEnd));
    path.setAttribute('fill', segment.color);
    path.setAttribute('class', 'pie-segment');
    path.dataset.index = index;
    path.dataset.id = segment.id || segment.label;
    path.dataset.color = segment.color;

    // Event handlers - no glow, just update info panel
    path.addEventListener('mouseenter', () => {
      handleSegmentHover(segment, totalForView);
    });
    path.addEventListener('mouseleave', () => {
      handleSegmentLeave();
    });
    path.addEventListener('click', () => handleSegmentClick(segment));

    svgElement.appendChild(path);

    // Store segment data for label rendering
    segmentData.push({
      segment,
      segmentAngle,
      startAngle: currentAngle,
      endAngle
    });

    currentAngle = endAngle;
  });

  // Now add labels (internal or external with leader lines)
  segmentData.forEach(({ segment, segmentAngle, startAngle, endAngle }) => {
    const midAngle = (startAngle + endAngle) / 2;

    if (segmentAngle > 25) {
      // Large segment: label inside the donut ring
      const labelPos = getLabelPosition(cx, cy, PIE_OUTER_RADIUS, PIE_INNER_RADIUS, startAngle, endAngle);

      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('x', labelPos.x);
      labelText.setAttribute('y', labelPos.y - 4);
      labelText.setAttribute('class', 'pie-label');
      labelText.textContent = segment.label;
      svgElement.appendChild(labelText);

      const percentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      percentText.setAttribute('x', labelPos.x);
      percentText.setAttribute('y', labelPos.y + 10);
      percentText.setAttribute('class', 'pie-label-percent');
      percentText.textContent = segment.percent + '%';
      svgElement.appendChild(percentText);
    } else {
      // Small segment: leader line with external label
      const edgePos = polarToCartesian(cx, cy, PIE_OUTER_RADIUS, midAngle);
      const outerPos = polarToCartesian(cx, cy, PIE_OUTER_RADIUS + LEADER_LINE_LENGTH, midAngle);

      // Determine if label should be on left or right
      const isRightSide = midAngle < 180;
      const labelEndX = outerPos.x + (isRightSide ? LABEL_OFFSET + 5 : -LABEL_OFFSET - 5);

      // Draw leader line (two segments: radial + horizontal)
      const leaderLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      leaderLine.setAttribute('d', `M ${edgePos.x} ${edgePos.y} L ${outerPos.x} ${outerPos.y} L ${labelEndX} ${outerPos.y}`);
      leaderLine.setAttribute('class', 'pie-leader-line');
      svgElement.appendChild(leaderLine);

      // Small dot at the segment edge
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', edgePos.x);
      dot.setAttribute('cy', edgePos.y);
      dot.setAttribute('r', 2);
      dot.setAttribute('class', 'pie-leader-dot');
      svgElement.appendChild(dot);

      // External label
      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('x', labelEndX + (isRightSide ? 4 : -4));
      labelText.setAttribute('y', outerPos.y - 2);
      labelText.setAttribute('class', 'pie-label-external');
      labelText.setAttribute('text-anchor', isRightSide ? 'start' : 'end');
      labelText.textContent = segment.label;
      svgElement.appendChild(labelText);

      // External percent
      const percentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      percentText.setAttribute('x', labelEndX + (isRightSide ? 4 : -4));
      percentText.setAttribute('y', outerPos.y + 10);
      percentText.setAttribute('class', 'pie-label-external-percent');
      percentText.setAttribute('text-anchor', isRightSide ? 'start' : 'end');
      percentText.textContent = segment.percent + '%';
      svgElement.appendChild(percentText);
    }
  });

  // Center circle
  const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerCircle.setAttribute('cx', cx);
  centerCircle.setAttribute('cy', cy);
  centerCircle.setAttribute('r', PIE_CENTER_RADIUS);
  centerCircle.setAttribute('class', 'pie-center' + (currentView !== 'main' ? ' clickable' : ''));

  if (currentView !== 'main') {
    centerCircle.addEventListener('click', () => {
      currentView = 'main';
      buildPieChart();
    });
  }

  svgElement.appendChild(centerCircle);

  // Center text
  if (currentView === 'main') {
    // Show "Total" label above
    const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelText.setAttribute('x', cx);
    labelText.setAttribute('y', cy - 10);
    labelText.setAttribute('class', 'pie-center-label');
    labelText.textContent = 'Total';
    svgElement.appendChild(labelText);

    // Show total budget amount below
    const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalText.setAttribute('x', cx);
    totalText.setAttribute('y', cy + 18);
    totalText.setAttribute('class', 'pie-center-text');
    totalText.textContent = formatCurrency(BUDGET_DATA.total);
    svgElement.appendChild(totalText);
  } else {
    // Show back arrow and label
    const backArrow = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    backArrow.setAttribute('x', cx);
    backArrow.setAttribute('y', cy + 4);
    backArrow.setAttribute('class', 'pie-back-arrow');
    backArrow.textContent = '←';
    svgElement.appendChild(backArrow);

    const backLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    backLabel.setAttribute('x', cx);
    backLabel.setAttribute('y', cy + 24);
    backLabel.setAttribute('class', 'pie-center-label');
    backLabel.textContent = 'BACK';
    svgElement.appendChild(backLabel);
  }
}

// Handle segment hover - update info panel
function handleSegmentHover(segment, totalForView) {
  updateInfoPanel(segment, totalForView);
}

// Handle segment leave - show default info
function handleSegmentLeave() {
  showDefaultInfo();
}

// Update info panel with segment data
function updateInfoPanel(segment, totalForView) {
  if (!infoPanelElement) return;

  const amount = totalForView * (segment.percent / 100);

  let infoHTML = `
    <div class="budget-info-title">${segment.label}</div>
    <div class="budget-info-amount">${formatCurrency(amount)} (${segment.percent}%)</div>
  `;

  if (segment.description) {
    infoHTML += `<div class="budget-info-desc">${segment.description}</div>`;
  }

  if (segment.subcategories && segment.subcategories.length > 0) {
    infoHTML += `<div class="budget-info-hint">Click to see breakdown</div>`;
  }

  infoPanelElement.innerHTML = infoHTML;
}

// Show default info when nothing is hovered
function showDefaultInfo() {
  if (!infoPanelElement) return;
  infoPanelElement.innerHTML = `<div class="budget-info-default">Hover over a segment for details</div>`;
}

// Handle segment click
function handleSegmentClick(segment) {
  if (segment.subcategories && segment.subcategories.length > 0) {
    currentView = segment.id;
    buildPieChart();
  }
}

// Initialize chapter DOM elements
export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.budgetLayout);
  if (sectionIndex < 0) {
    console.warn('[BUDGET] Could not find BUDGET section');
    return;
  }

  // Create blur backdrop circle - appended directly to imgWorld for proper backdrop-filter
  blurBackdropElement = document.createElement('div');
  blurBackdropElement.className = 'budget-blur-backdrop';
  // Start hidden - update() will show it when budget section is active
  blurBackdropElement.style.opacity = '0';
  blurBackdropElement.style.visibility = 'hidden';
  imgWorld.appendChild(blurBackdropElement);

  // Create budget container (holds everything in horizontal layout)
  budgetContainer = document.createElement('div');
  budgetContainer.className = 'budget-container';

  // Create pie wrapper (holds SVG)
  const pieWrapper = document.createElement('div');
  pieWrapper.className = 'budget-pie-wrapper';

  // Create SVG element for pie chart (LEFT side)
  svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgElement.setAttribute('class', 'budget-pie-svg');
  pieWrapper.appendChild(svgElement);

  budgetContainer.appendChild(pieWrapper);

  // Create text content wrapper (RIGHT side)
  const textContent = document.createElement('div');
  textContent.className = 'budget-text-content';

  // Create title
  const titleElement = document.createElement('h1');
  titleElement.className = 'budget-title';
  titleElement.textContent = 'BUDGET';
  textContent.appendChild(titleElement);

  // Create info panel (below title)
  infoPanelElement = document.createElement('div');
  infoPanelElement.className = 'budget-info-panel';
  textContent.appendChild(infoPanelElement);

  budgetContainer.appendChild(textContent);

  // Build initial pie chart
  buildPieChart();

  // Show default info
  showDefaultInfo();

  budgetContainer.style.opacity = 0;
  imgWorld.appendChild(budgetContainer);

  console.log('[BUDGET] Chapter initialized with interactive pie chart');
}

// Update chapter based on discrete section system
export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !budgetContainer) return;

  const goingForward = targetSection > currentSection;

  let containerZ = REST_Z;
  let containerOpacity = 0;
  let containerScale = 1;

  if (isTransitioning) {
    if (sectionIndex === currentSection) {
      // BUDGET is current section, animating away
      if (goingForward) {
        containerZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
        containerScale = 1 + transitionProgress * 0.5;
        containerOpacity = Math.max(0, 1 - transitionProgress * 2);
      } else {
        containerZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
        containerScale = 1 - transitionProgress * 0.3;
        containerOpacity = 1 - transitionProgress;
      }
      // Reset to main view when leaving
      if (transitionProgress > 0.5 && currentView !== 'main') {
        currentView = 'main';
        buildPieChart();
        showDefaultInfo();
      }
    } else if (sectionIndex === targetSection) {
      // BUDGET is target section, approaching
      if (goingForward) {
        containerZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
        containerScale = 0.7 + transitionProgress * 0.3;
      } else {
        containerZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
        containerScale = 1.5 - transitionProgress * 0.5;
      }
      containerOpacity = transitionProgress;
    }
  } else {
    // At rest
    if (sectionIndex === currentSection) {
      containerZ = REST_Z + elasticOffset * 500;
      containerOpacity = 1;

      // Apply scroll anticipation
      if (scrollAnticipation < 0) {
        containerZ = REST_Z + Math.abs(scrollAnticipation) * 200;
        containerScale = 1 + Math.abs(scrollAnticipation) * 0.2;
        containerOpacity = 1 - Math.abs(scrollAnticipation) * 0.5;
      } else if (scrollAnticipation > 0) {
        containerZ = REST_Z - scrollAnticipation * 400;
        containerScale = 1 - scrollAnticipation * 0.3;
        containerOpacity = 1 - scrollAnticipation * 0.6;
      }
    }
  }

  // Match parallax to text container
  const offsetX = mouse.x * 8;
  const offsetY = -mouse.y * 2;

  // Calculate pie chart offset from container center (pie is on left side)
  // The container uses flex with gap:60px, so pie center is offset left
  const pieOffsetX = -190; // Approximate offset to align backdrop with pie center

  // Determine if budget section should be visible at all
  const shouldBeVisible = sectionIndex === currentSection || sectionIndex === targetSection;

  // Update blur backdrop - needs full 3D transform for backdrop-filter to work during transitions
  // Also control visibility to prevent blocking other sections
  if (blurBackdropElement) {
    blurBackdropElement.style.transform = `translate(calc(-50% + ${offsetX + pieOffsetX}px), calc(-50% + ${offsetY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
    blurBackdropElement.style.opacity = Math.max(0, Math.min(1, containerOpacity));
    blurBackdropElement.style.visibility = shouldBeVisible && containerOpacity > 0.01 ? 'visible' : 'hidden';
  }

  // Apply transform to container
  budgetContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
  budgetContainer.style.opacity = Math.max(0, Math.min(1, containerOpacity));
  // Hide container completely when not visible to prevent blocking other sections
  budgetContainer.style.visibility = shouldBeVisible && containerOpacity > 0.01 ? 'visible' : 'hidden';

  // Control pointer-events on SVG based on section visibility
  const isActive = sectionIndex === currentSection && !isTransitioning && containerOpacity > 0.5;
  if (svgElement) {
    svgElement.style.pointerEvents = isActive ? 'auto' : 'none';
  }
}

// Cleanup chapter DOM
export function destroy() {
  // Remove backdrop (it's in imgWorld, not budgetContainer)
  if (blurBackdropElement) {
    blurBackdropElement.remove();
    blurBackdropElement = null;
  }

  if (budgetContainer) {
    budgetContainer.remove();
    budgetContainer = null;
  }

  svgElement = null;
  infoPanelElement = null;
  sectionIndex = -1;
  currentView = 'main';

  const styles = document.getElementById('budget-chapter-styles');
  if (styles) styles.remove();
}

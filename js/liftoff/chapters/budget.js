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

// Pie chart dimensions
const PIE_RADIUS = 180;
const PIE_CENTER_RADIUS = 60; // Inner circle for total/back button

// Main budget categories (percentages should sum to 100)
const BUDGET_DATA = {
  total: 2500000, // $2.5M total budget
  categories: [
    {
      id: 'production',
      label: 'Production',
      percent: 45,
      color: '#3498db',
      description: 'Principal photography, locations, equipment, and production staff',
      subcategories: [
        { label: 'Cast', percent: 25, color: '#5dade2' },
        { label: 'Crew', percent: 30, color: '#3498db' },
        { label: 'Equipment', percent: 20, color: '#2980b9' },
        { label: 'Locations', percent: 15, color: '#1f618d' },
        { label: 'Production Office', percent: 10, color: '#154360' }
      ]
    },
    {
      id: 'post',
      label: 'Post Production',
      percent: 30,
      color: '#9b59b6',
      description: 'Editing, VFX, sound design, color grading, and music',
      subcategories: [
        { label: 'VFX', percent: 40, color: '#af7ac5' },
        { label: 'Editing', percent: 20, color: '#9b59b6' },
        { label: 'Sound Design', percent: 20, color: '#8e44ad' },
        { label: 'Music', percent: 15, color: '#7d3c98' },
        { label: 'Color', percent: 5, color: '#6c3483' }
      ]
    },
    {
      id: 'preproduction',
      label: 'Pre-Production',
      percent: 15,
      color: '#e67e22',
      description: 'Script development, casting, location scouting, and planning',
      subcategories: [
        { label: 'Development', percent: 35, color: '#f39c12' },
        { label: 'Casting', percent: 25, color: '#e67e22' },
        { label: 'Location Scout', percent: 20, color: '#d35400' },
        { label: 'Storyboards', percent: 20, color: '#ba4a00' }
      ]
    },
    {
      id: 'contingency',
      label: 'Contingency',
      percent: 10,
      color: '#27ae60',
      description: 'Reserve fund for unexpected costs and overages',
      subcategories: []
    }
  ]
};

// DOM elements
let budgetContainer = null;
let svgElement = null;
let infoPanelElement = null;
let sectionIndex = -1;

// State
let currentView = 'main'; // 'main' or category id
let hoveredSegment = null;

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
      font-family: 'montserrat', sans-serif;
      font-size: clamp(32px, 5vw, 56px);
      font-weight: 700;
      color: #d4d4d4;
      text-transform: uppercase;
      margin-bottom: 16px;
      letter-spacing: 0.02em;
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
      font-weight: 300;
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
      font-weight: 300;
      color: rgba(255,255,255,0.5);
      font-style: italic;
    }

    /* SVG pie chart */
    .budget-pie-svg {
      overflow: visible;
      filter: drop-shadow(0 4px 20px rgba(0,0,0,0.4));
    }

    /* Pie segments */
    .pie-segment {
      cursor: pointer;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                  filter 0.3s ease;
      transform-origin: center;
    }
    .pie-segment:hover {
      filter: brightness(1.2);
    }
    .pie-segment.active {
      filter: brightness(1.3);
    }

    /* Segment labels */
    .pie-label {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 500;
      fill: rgba(255,255,255,0.9);
      text-anchor: middle;
      pointer-events: none;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
    .pie-label-percent {
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 400;
      fill: rgba(255,255,255,0.7);
      text-anchor: middle;
      pointer-events: none;
    }

    /* Center circle */
    .pie-center {
      fill: rgba(20, 25, 40, 0.9);
      stroke: rgba(255,255,255,0.2);
      stroke-width: 1;
      cursor: default;
    }
    .pie-center.clickable {
      cursor: pointer;
    }
    .pie-center-text {
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 600;
      fill: rgba(255,255,255,0.9);
      text-anchor: middle;
      pointer-events: none;
    }
    .pie-center-label {
      font-family: 'montserrat', sans-serif;
      font-size: 9px;
      font-weight: 400;
      fill: rgba(255,255,255,0.5);
      text-anchor: middle;
      text-transform: uppercase;
      letter-spacing: 0.1em;
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

// Calculate segment path
function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
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

// Get label position
function getLabelPosition(cx, cy, radius, startAngle, endAngle) {
  const midAngle = (startAngle + endAngle) / 2;
  const labelRadius = radius * 0.65;
  return polarToCartesian(cx, cy, labelRadius, midAngle);
}

// Build pie chart SVG
function buildPieChart() {
  const size = PIE_RADIUS * 2 + 40;
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

  // Create segments
  let currentAngle = 0;

  data.forEach((segment, index) => {
    const segmentAngle = (segment.percent / 100) * 360;
    const endAngle = currentAngle + segmentAngle;

    // Create path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', describeArc(cx, cy, PIE_RADIUS, currentAngle, endAngle));
    path.setAttribute('fill', segment.color);
    path.setAttribute('class', 'pie-segment');
    path.dataset.index = index;
    path.dataset.id = segment.id || segment.label;

    // Event handlers
    path.addEventListener('mouseenter', () => handleSegmentHover(segment, totalForView));
    path.addEventListener('mouseleave', () => handleSegmentLeave());
    path.addEventListener('click', () => handleSegmentClick(segment));

    svgElement.appendChild(path);

    // Add label if segment is large enough
    if (segmentAngle > 25) {
      const labelPos = getLabelPosition(cx, cy, PIE_RADIUS, currentAngle, endAngle);

      // Label text
      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('x', labelPos.x);
      labelText.setAttribute('y', labelPos.y - 6);
      labelText.setAttribute('class', 'pie-label');
      labelText.textContent = segment.label;
      svgElement.appendChild(labelText);

      // Percent text
      const percentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      percentText.setAttribute('x', labelPos.x);
      percentText.setAttribute('y', labelPos.y + 8);
      percentText.setAttribute('class', 'pie-label-percent');
      percentText.textContent = segment.percent + '%';
      svgElement.appendChild(percentText);
    }

    currentAngle = endAngle;
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
    // Show total budget
    const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalText.setAttribute('x', cx);
    totalText.setAttribute('y', cy + 4);
    totalText.setAttribute('class', 'pie-center-text');
    totalText.textContent = formatCurrency(BUDGET_DATA.total);
    svgElement.appendChild(totalText);

    const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelText.setAttribute('x', cx);
    labelText.setAttribute('y', cy - 12);
    labelText.setAttribute('class', 'pie-center-label');
    labelText.textContent = 'TOTAL';
    svgElement.appendChild(labelText);
  } else {
    // Show back arrow
    const backArrow = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    backArrow.setAttribute('x', cx);
    backArrow.setAttribute('y', cy + 6);
    backArrow.setAttribute('class', 'pie-back-arrow');
    backArrow.textContent = '\u2190'; // Left arrow
    svgElement.appendChild(backArrow);

    const backLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    backLabel.setAttribute('x', cx);
    backLabel.setAttribute('y', cy + 22);
    backLabel.setAttribute('class', 'pie-center-label');
    backLabel.textContent = 'BACK';
    svgElement.appendChild(backLabel);
  }
}

// Handle segment hover - update info panel
function handleSegmentHover(segment, totalForView) {
  hoveredSegment = segment;
  updateInfoPanel(segment, totalForView);
}

// Handle segment leave - show default info
function handleSegmentLeave() {
  hoveredSegment = null;
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

  // Create budget container (holds everything in horizontal layout)
  budgetContainer = document.createElement('div');
  budgetContainer.className = 'budget-container';

  // Create SVG element for pie chart (LEFT side)
  svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgElement.setAttribute('class', 'budget-pie-svg');
  budgetContainer.appendChild(svgElement);

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

  // Apply transform to container
  budgetContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
  budgetContainer.style.opacity = Math.max(0, Math.min(1, containerOpacity));
  // Only allow interactions when this is the active section and not transitioning
  budgetContainer.style.pointerEvents = (sectionIndex === currentSection && !isTransitioning && containerOpacity > 0.5) ? 'auto' : 'none';
}

// Cleanup chapter DOM
export function destroy() {
  if (budgetContainer) {
    budgetContainer.remove();
    budgetContainer = null;
  }
  svgElement = null;
  infoPanelElement = null;
  sectionIndex = -1;
  currentView = 'main';
  hoveredSegment = null;

  const styles = document.getElementById('budget-chapter-styles');
  if (styles) styles.remove();
}

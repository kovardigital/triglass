/* ==========================================================================
   Liftoff - SCHEDULE Chapter
   Gantt-style horizontal timeline showing production phases
   ========================================================================== */

// Uses discrete section system from content.js

// Chapter configuration
export const config = {
  title: 'SCHEDULE',
  subtitle: '',
  scheduleLayout: true,
  images: []
};

// Timeline dimensions
const TIMELINE_WIDTH = 700;
const BAR_HEIGHT = 36;
const BAR_GAP = 12;

// Production schedule phases - 2026
const PRODUCTION_PHASES = [
  {
    id: 'prep',
    name: 'Pre-Production',
    description: 'Script finalization, casting, location scouting, crew hiring, and production planning.',
    color: 'rgba(60, 140, 200, 0.8)',
    glowColor: 'rgba(60, 140, 200, 0.4)',
    startMonth: 0,  // January
    endMonth: 2.5   // Mid-March
  },
  {
    id: 'setbuild',
    name: 'Set Construction',
    description: 'Building the magical attic set pieces, practical effects elements, and props.',
    color: 'rgba(200, 140, 60, 0.8)',
    glowColor: 'rgba(200, 140, 60, 0.4)',
    startMonth: 2,    // March
    endMonth: 4.5     // Mid-May
  },
  {
    id: 'filming',
    name: 'Principal Photography',
    description: 'Main production filming with cast and crew on location and stage.',
    color: 'rgba(60, 180, 100, 0.8)',
    glowColor: 'rgba(60, 180, 100, 0.4)',
    startMonth: 4,    // May
    endMonth: 8       // August
  },
  {
    id: 'pickups',
    name: 'Wrap & Pick-ups',
    description: 'Additional shots, insert photography, and production wrap.',
    color: 'rgba(160, 90, 200, 0.8)',
    glowColor: 'rgba(160, 90, 200, 0.4)',
    startMonth: 8,    // September
    endMonth: 9       // September
  }
];

// Post-production schedule phases - 2027
const POST_PHASES = [
  {
    id: 'editing',
    name: 'Editorial',
    description: 'Assembly cut, rough cut, and fine cut editing with director.',
    color: 'rgba(60, 200, 200, 0.8)',
    glowColor: 'rgba(60, 200, 200, 0.4)',
    startMonth: 0,    // January
    endMonth: 4       // April
  },
  {
    id: 'vfx',
    name: 'VFX & Sound Design',
    description: 'Visual effects, sound design, ADR, and Foley recording.',
    color: 'rgba(200, 80, 160, 0.8)',
    glowColor: 'rgba(200, 80, 160, 0.4)',
    startMonth: 3,    // April (overlaps with editing)
    endMonth: 8       // August
  },
  {
    id: 'color',
    name: 'Color & DI',
    description: 'Digital intermediate, color correction, and establishing final look.',
    color: 'rgba(220, 180, 60, 0.8)',
    glowColor: 'rgba(220, 180, 60, 0.4)',
    startMonth: 8,    // September
    endMonth: 10      // October
  },
  {
    id: 'delivery',
    name: 'Final Mix',
    description: 'Final sound mix, mastering, and deliverables for distribution.',
    color: 'rgba(60, 160, 160, 0.8)',
    glowColor: 'rgba(60, 160, 160, 0.4)',
    startMonth: 10,   // November
    endMonth: 12      // December
  }
];

const MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// DOM elements
let scheduleContainer = null;
let timelineContainer = null;
let yearLabel = null;
let yearToggle = null;
let yearRow = null;
let tooltipEl = null;
let sectionIndex = -1;
let currentYear = 2026;
let hasAnimated = false;

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('schedule-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'schedule-chapter-styles';
  style.textContent = `
    /* Schedule layout - title above timeline */
    .liftoff-text.schedule-layout {
      top: calc(50% - 200px);
      max-width: none;
      width: 100vw;
    }
    .liftoff-text.schedule-layout h1 {
      font-size: clamp(32px, 5vw, 56px);
    }
    .liftoff-text.schedule-layout p {
      display: none;
    }

    /* Preview styling for schedule */
    .liftoff-preview.preview-schedule {
      top: calc(50% - 200px);
      max-width: none;
      width: 100vw;
    }
    .liftoff-preview.preview-schedule h1 {
      font-size: clamp(32px, 5vw, 56px);
    }
    .liftoff-preview.preview-schedule p {
      display: none;
    }

    /* Schedule container */
    .schedule-container {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    /* Year row with label and toggle */
    .schedule-year-row {
      display: flex;
      align-items: center;
      gap: 24px;
      opacity: 0;
      transform: translateY(-20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .schedule-year-row.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .schedule-year {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(32px, 5vw, 48px);
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      letter-spacing: 0.05em;
    }
    .schedule-toggle {
      display: flex;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      overflow: hidden;
    }
    .schedule-toggle button {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.4);
      background: transparent;
      border: none;
      padding: 10px 18px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .schedule-toggle button:hover {
      color: rgba(255, 255, 255, 0.7);
    }
    .schedule-toggle button.active {
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.95);
    }

    /* Timeline container */
    .schedule-timeline {
      position: relative;
      width: ${TIMELINE_WIDTH}px;
    }

    /* Month markers */
    .schedule-months {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 0 4px;
    }
    .schedule-month-marker {
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      width: ${TIMELINE_WIDTH / 12}px;
      text-align: center;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }
    .schedule-month-marker.animate-in {
      opacity: 1;
      transform: translateY(0);
    }

    /* Vertical month guide lines */
    .schedule-month-guides {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 250%;
      pointer-events: none;
    }
    .schedule-month-guide {
      position: absolute;
      top: 0;
      width: 1px;
      height: 100%;
      background: linear-gradient(to bottom,
        rgba(255, 255, 255, 0.12) 0%,
        rgba(255, 255, 255, 0.06) 40%,
        rgba(255, 255, 255, 0) 100%);
      opacity: 0;
      transform: scaleY(0);
      transform-origin: top center;
      transition: opacity 0.4s ease, transform 0.5s ease;
    }
    .schedule-month-guide.animate-in {
      opacity: 1;
      transform: scaleY(1);
    }

    /* Timeline track (background line) */
    .schedule-track {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 4px;
    }

    /* Phase bars container */
    .schedule-bars {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: ${BAR_GAP}px;
    }

    /* Individual phase bar */
    .schedule-bar {
      position: relative;
      height: ${BAR_HEIGHT}px;
      border-radius: ${BAR_HEIGHT / 2}px;
      cursor: pointer;
      transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                  opacity 0.4s ease;
      display: flex;
      align-items: center;
      padding: 0 16px;
      overflow: hidden;
      opacity: 0;
      transform: scaleX(0);
      transform-origin: left center;
    }
    .schedule-bar.animate-in {
      opacity: 1;
      transform: scaleX(1);
    }
    .schedule-bar::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: ${BAR_HEIGHT / 2}px;
      padding: 1px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.2) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      pointer-events: none;
    }
    .schedule-bar:hover {
      transform: scale(1.02) translateY(-2px);
      z-index: 10;
    }
    .schedule-bar-label {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      position: relative;
      z-index: 1;
    }

    /* Tooltip */
    .schedule-tooltip {
      position: fixed;
      max-width: 300px;
      background: rgba(12, 16, 28, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 16px 20px;
      pointer-events: none;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      z-index: 1000;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    .schedule-tooltip.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .schedule-tooltip-title {
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      margin-bottom: 6px;
    }
    .schedule-tooltip-dates {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .schedule-tooltip-desc {
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 300;
      color: rgba(255, 255, 255, 0.75);
      line-height: 1.6;
    }
  `;
  document.head.appendChild(style);
}

// Calculate bar position and width from month values
function getBarStyle(phase) {
  const startPercent = (phase.startMonth / 12) * 100;
  const widthPercent = ((phase.endMonth - phase.startMonth) / 12) * 100;
  return {
    left: `${startPercent}%`,
    width: `${widthPercent}%`
  };
}

// Get date range string
function getDateRange(phase) {
  const startMonth = MONTH_ABBREV[Math.floor(phase.startMonth)];
  const endMonth = MONTH_ABBREV[Math.min(11, Math.floor(phase.endMonth))];
  return `${startMonth} – ${endMonth} ${currentYear}`;
}

// Build timeline for current year
function buildTimeline() {
  if (!timelineContainer) return;

  timelineContainer.innerHTML = '';
  const phases = currentYear === 2026 ? PRODUCTION_PHASES : POST_PHASES;

  // Month markers
  const monthsRow = document.createElement('div');
  monthsRow.className = 'schedule-months';
  MONTH_ABBREV.forEach(month => {
    const marker = document.createElement('div');
    marker.className = 'schedule-month-marker';
    marker.textContent = month;
    monthsRow.appendChild(marker);
  });
  timelineContainer.appendChild(monthsRow);

  // Bars container with track background
  const barsContainer = document.createElement('div');
  barsContainer.className = 'schedule-bars';

  // Track background
  const track = document.createElement('div');
  track.className = 'schedule-track';
  barsContainer.appendChild(track);

  // Month guide lines (separators between months)
  const guidesContainer = document.createElement('div');
  guidesContainer.className = 'schedule-month-guides';
  for (let i = 1; i < 12; i++) {
    const guide = document.createElement('div');
    guide.className = 'schedule-month-guide';
    guide.style.left = `${(i / 12) * 100}%`;
    guidesContainer.appendChild(guide);
  }
  barsContainer.appendChild(guidesContainer);

  // Phase bars
  phases.forEach(phase => {
    const bar = document.createElement('div');
    bar.className = 'schedule-bar';

    const style = getBarStyle(phase);
    bar.style.marginLeft = style.left;
    bar.style.width = style.width;
    bar.style.background = phase.color;

    // Label inside bar
    const label = document.createElement('span');
    label.className = 'schedule-bar-label';
    label.textContent = phase.name;
    bar.appendChild(label);

    // Hover events
    bar.addEventListener('mouseenter', (e) => showTooltip(e, phase));
    bar.addEventListener('mouseleave', hideTooltip);
    bar.addEventListener('mousemove', moveTooltip);

    barsContainer.appendChild(bar);
  });

  timelineContainer.appendChild(barsContainer);
}

// Show tooltip
function showTooltip(e, phase) {
  if (!tooltipEl) return;

  tooltipEl.innerHTML = `
    <div class="schedule-tooltip-title" style="color: ${phase.color.replace('0.8', '1')}">${phase.name}</div>
    <div class="schedule-tooltip-dates">${getDateRange(phase)}</div>
    <div class="schedule-tooltip-desc">${phase.description}</div>
  `;

  moveTooltip(e);
  tooltipEl.classList.add('visible');
}

// Move tooltip
function moveTooltip(e) {
  if (!tooltipEl) return;

  const padding = 16;
  let x = e.clientX + padding;
  let y = e.clientY + padding;

  // Keep in viewport
  const rect = tooltipEl.getBoundingClientRect();
  if (x + rect.width > window.innerWidth - padding) {
    x = e.clientX - rect.width - padding;
  }
  if (y + rect.height > window.innerHeight - padding) {
    y = e.clientY - rect.height - padding;
  }

  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
}

// Hide tooltip
function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.classList.remove('visible');
}

// Trigger entrance animations with staggered delays
function triggerAnimations() {
  if (hasAnimated) return;
  hasAnimated = true;

  // Animate year row first
  if (yearRow) {
    setTimeout(() => yearRow.classList.add('animate-in'), 100);
  }

  // Animate month markers with stagger
  const monthMarkers = timelineContainer?.querySelectorAll('.schedule-month-marker');
  if (monthMarkers) {
    monthMarkers.forEach((marker, i) => {
      setTimeout(() => marker.classList.add('animate-in'), 200 + i * 40);
    });
  }

  // Animate month guide lines with stagger
  const monthGuides = timelineContainer?.querySelectorAll('.schedule-month-guide');
  if (monthGuides) {
    monthGuides.forEach((guide, i) => {
      setTimeout(() => guide.classList.add('animate-in'), 300 + i * 40);
    });
  }

  // Animate bars with stagger (left-to-right grow effect)
  const bars = timelineContainer?.querySelectorAll('.schedule-bar');
  if (bars) {
    bars.forEach((bar, i) => {
      setTimeout(() => bar.classList.add('animate-in'), 500 + i * 150);
    });
  }
}

// Reset animations (for when switching years or re-entering section)
function resetAnimations() {
  hasAnimated = false;

  if (yearRow) yearRow.classList.remove('animate-in');

  const monthMarkers = timelineContainer?.querySelectorAll('.schedule-month-marker');
  if (monthMarkers) {
    monthMarkers.forEach(marker => marker.classList.remove('animate-in'));
  }

  const monthGuides = timelineContainer?.querySelectorAll('.schedule-month-guide');
  if (monthGuides) {
    monthGuides.forEach(guide => guide.classList.remove('animate-in'));
  }

  const bars = timelineContainer?.querySelectorAll('.schedule-bar');
  if (bars) {
    bars.forEach(bar => bar.classList.remove('animate-in'));
  }
}

// Switch year
function switchYear(year) {
  if (year === currentYear) return;
  currentYear = year;

  if (yearLabel) {
    yearLabel.textContent = year;
  }

  if (yearToggle) {
    yearToggle.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.year) === year);
    });
  }

  buildTimeline();

  // Re-trigger bar animations for new timeline
  hasAnimated = false;
  // Keep year row animated, just animate new content
  if (yearRow) yearRow.classList.add('animate-in');
  triggerAnimations();
}

// Initialize chapter DOM elements
export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.scheduleLayout);
  if (sectionIndex < 0) {
    console.warn('[SCHEDULE] Could not find SCHEDULE section');
    return;
  }

  // Create schedule container
  scheduleContainer = document.createElement('div');
  scheduleContainer.className = 'schedule-container';

  // Year row
  yearRow = document.createElement('div');
  yearRow.className = 'schedule-year-row';

  yearLabel = document.createElement('div');
  yearLabel.className = 'schedule-year';
  yearLabel.textContent = currentYear;
  yearRow.appendChild(yearLabel);

  yearToggle = document.createElement('div');
  yearToggle.className = 'schedule-toggle';
  yearToggle.innerHTML = `
    <button data-year="2026" class="active">Production</button>
    <button data-year="2027">Post</button>
  `;
  yearToggle.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => switchYear(parseInt(btn.dataset.year)));
  });
  yearRow.appendChild(yearToggle);

  scheduleContainer.appendChild(yearRow);

  // Timeline container
  timelineContainer = document.createElement('div');
  timelineContainer.className = 'schedule-timeline';
  scheduleContainer.appendChild(timelineContainer);

  // Tooltip
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'schedule-tooltip';
  document.body.appendChild(tooltipEl);

  // Build initial timeline
  buildTimeline();

  scheduleContainer.style.opacity = 0;
  imgWorld.appendChild(scheduleContainer);

  console.log('[SCHEDULE] Chapter initialized');
}

// Update chapter based on discrete section system
export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !scheduleContainer) return;

  const goingForward = targetSection > currentSection;

  let containerZ = REST_Z;
  let containerOpacity = 0;
  let containerScale = 1;

  if (isTransitioning) {
    if (sectionIndex === currentSection) {
      if (goingForward) {
        containerZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
        containerScale = 1 + transitionProgress * 0.5;
        containerOpacity = Math.max(0, 1 - transitionProgress * 2);
      } else {
        containerZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
        containerScale = 1 - transitionProgress * 0.3;
        containerOpacity = 1 - transitionProgress;
      }
    } else if (sectionIndex === targetSection) {
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
    if (sectionIndex === currentSection) {
      containerZ = REST_Z + elasticOffset * 500;
      containerOpacity = 1;

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

  scheduleContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY + 60}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
  scheduleContainer.style.opacity = Math.max(0, Math.min(1, containerOpacity));
  // Only allow interactions when this is the active section and not transitioning
  scheduleContainer.style.pointerEvents = (sectionIndex === currentSection && !isTransitioning && containerOpacity > 0.5) ? 'auto' : 'none';

  // Trigger animations when section becomes active
  if (sectionIndex === currentSection && !isTransitioning && containerOpacity > 0.8) {
    triggerAnimations();
  }

  // Reset animations when leaving section
  if (containerOpacity < 0.1 && hasAnimated) {
    resetAnimations();
  }

  // Hide tooltip when not visible
  if (containerOpacity < 0.5 && tooltipEl) {
    tooltipEl.classList.remove('visible');
  }
}

// Cleanup
export function destroy() {
  if (scheduleContainer) {
    scheduleContainer.remove();
    scheduleContainer = null;
  }
  if (tooltipEl) {
    tooltipEl.remove();
    tooltipEl = null;
  }
  timelineContainer = null;
  yearLabel = null;
  yearToggle = null;
  yearRow = null;
  sectionIndex = -1;
  currentYear = 2026;
  hasAnimated = false;

  const styles = document.getElementById('schedule-chapter-styles');
  if (styles) styles.remove();
}

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

// Timeline dimensions - spans 16 months (Jan 2026 - Apr 2027)
const TIMELINE_WIDTH = 800;
const BAR_HEIGHT = 36;
const BAR_GAP = 12;

// Unified production schedule - all phases on one timeline
// Month indices: 0 = Jan '26, 11 = Dec '26, 12 = Jan '27, 15 = Apr '27
// labelPos: 'internal' (inside bar), 'below' (external below), 'above' (external above)
const SCHEDULE_PHASES = [
  {
    id: 'post1',
    name: 'Post-Production',
    description: 'Editorial work on existing footage, assembly cuts, and early post work.',
    color: 'rgba(60, 200, 200, 0.8)',
    glowColor: 'rgba(60, 200, 200, 0.4)',
    startMonth: 0,    // January 2026
    endMonth: 4,      // April 2026
    row: 0,
    labelPos: 'internal'
  },
  {
    id: 'prep',
    name: 'Prep / Construction',
    description: 'Set construction, prop building, location prep, and production planning.',
    color: 'rgba(155, 89, 182, 0.8)',
    glowColor: 'rgba(155, 89, 182, 0.4)',
    startMonth: 3,    // April 2026
    endMonth: 6,      // June 2026
    row: 1,
    labelPos: 'internal'
  },
  {
    id: 'filming',
    name: 'Principal Photography',
    description: 'Main production filming with cast and crew on location and stage.',
    color: 'rgba(255, 107, 107, 0.8)',
    glowColor: 'rgba(255, 107, 107, 0.4)',
    startMonth: 6.5,  // Mid-July 2026
    endMonth: 7.5,    // Mid-August 2026
    row: 2,
    labelPos: 'above'
  },
  {
    id: 'post2',
    name: 'Post-Production',
    description: 'Editorial resumes with new footage, rough cuts, and continued post work.',
    color: 'rgba(60, 200, 200, 0.8)',
    glowColor: 'rgba(60, 200, 200, 0.4)',
    startMonth: 7,    // August 2026
    endMonth: 16,     // April 2027
    row: 0,
    labelPos: 'internal'
  },
  {
    id: 'filming2',
    name: 'Additional Filming',
    description: 'December filming session for additional scenes and coverage.',
    color: 'rgba(244, 208, 63, 0.8)',
    glowColor: 'rgba(244, 208, 63, 0.4)',
    startMonth: 11,   // December 2026
    endMonth: 12,     // December 2026
    row: 2,
    labelPos: 'above'
  },
  {
    id: 'pickups',
    name: 'Pick Up Shoots',
    description: 'Additional shots and insert photography for remaining coverage.',
    color: 'rgba(44, 62, 80, 0.8)',
    glowColor: 'rgba(44, 62, 80, 0.4)',
    startMonth: 12,   // January 2027
    endMonth: 14,     // February 2027
    row: 3,
    labelPos: 'above'
  }
];

// Month labels for the 16-month timeline
const MONTH_LABELS = [
  { abbrev: 'J', month: 'Jan', year: "'26" },
  { abbrev: 'F', month: 'Feb', year: "'26" },
  { abbrev: 'M', month: 'Mar', year: "'26" },
  { abbrev: 'A', month: 'Apr', year: "'26" },
  { abbrev: 'M', month: 'May', year: "'26" },
  { abbrev: 'J', month: 'Jun', year: "'26" },
  { abbrev: 'J', month: 'Jul', year: "'26" },
  { abbrev: 'A', month: 'Aug', year: "'26" },
  { abbrev: 'S', month: 'Sep', year: "'26" },
  { abbrev: 'O', month: 'Oct', year: "'26" },
  { abbrev: 'N', month: 'Nov', year: "'26" },
  { abbrev: 'D', month: 'Dec', year: "'26" },
  { abbrev: 'J', month: 'Jan', year: "'27" },
  { abbrev: 'F', month: 'Feb', year: "'27" },
  { abbrev: 'M', month: 'Mar', year: "'27" },
  { abbrev: 'A', month: 'Apr', year: "'27" }
];

// DOM elements
let scheduleContainer = null;
let timelineContainer = null;
let titleRow = null;
let tooltipEl = null;
let sectionIndex = -1;
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
      font-size: clamp(24px, 3.6vw, 42px);
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
      font-size: clamp(24px, 3.6vw, 42px);
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

    /* Title row */
    .schedule-title-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
      margin-bottom: 8px;
      opacity: 0;
      transform: translateY(-20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .schedule-title-row.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .schedule-title {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(14px, 2vw, 18px);
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .schedule-years {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(28px, 4vw, 40px);
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      letter-spacing: 0.05em;
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
      font-size: 9px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      width: ${TIMELINE_WIDTH / 16}px;
      text-align: center;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }
    .schedule-month-marker.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .schedule-month-marker .year-label {
      display: block;
      font-size: 8px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 2px;
    }

    /* Year divider line */
    .schedule-year-divider {
      position: absolute;
      top: 0;
      width: 2px;
      height: 100%;
      background: linear-gradient(to bottom,
        rgba(255, 255, 255, 0.3) 0%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0) 100%);
      opacity: 0;
      transform: scaleY(0);
      transform-origin: top center;
      transition: opacity 0.4s ease, transform 0.5s ease;
    }
    .schedule-year-divider.animate-in {
      opacity: 1;
      transform: scaleY(1);
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

    /* Phase bars container - uses rows for overlapping phases */
    .schedule-bars {
      position: relative;
      height: ${(BAR_HEIGHT + BAR_GAP) * 4 + 80}px;
    }

    /* Individual phase bar wrapper - contains bar + external label */
    .schedule-bar-wrapper {
      position: absolute;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }
    .schedule-bar-wrapper.animate-in {
      opacity: 1;
      transform: translateY(0);
    }

    /* The actual bar */
    .schedule-bar {
      position: relative;
      height: ${BAR_HEIGHT}px;
      border-radius: ${BAR_HEIGHT / 2}px;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
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
    .schedule-bar-wrapper:hover .schedule-bar {
      transform: scale(1.03) translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 10;
    }

    /* External label */
    .schedule-bar-label-external {
      position: absolute;
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }

    /* Internal label for wide bars */
    .schedule-bar-label-internal {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      pointer-events: none;
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
      font-weight: 500;
      color: rgba(255, 255, 255, 0.75);
      line-height: 1.6;
    }
  `;
  document.head.appendChild(style);
}

// Calculate bar position and width from month values (16-month timeline)
function getBarStyle(phase) {
  const startPercent = (phase.startMonth / 16) * 100;
  const widthPercent = ((phase.endMonth - phase.startMonth) / 16) * 100;
  const topPosition = phase.row * (BAR_HEIGHT + BAR_GAP);
  return {
    left: `${startPercent}%`,
    width: `${widthPercent}%`,
    top: `${topPosition}px`
  };
}

// Get date range string
function getDateRange(phase) {
  const startIdx = Math.floor(phase.startMonth);
  const endIdx = Math.min(15, Math.floor(phase.endMonth) - 1);
  const startLabel = MONTH_LABELS[startIdx];
  const endLabel = MONTH_LABELS[endIdx];
  return `${startLabel.month} ${startLabel.year} – ${endLabel.month} ${endLabel.year}`;
}

// Build unified timeline
function buildTimeline() {
  if (!timelineContainer) return;

  timelineContainer.innerHTML = '';

  // Month markers
  const monthsRow = document.createElement('div');
  monthsRow.className = 'schedule-months';
  MONTH_LABELS.forEach((monthData, i) => {
    const marker = document.createElement('div');
    marker.className = 'schedule-month-marker';
    marker.innerHTML = `${monthData.abbrev}<span class="year-label">${i === 0 || i === 12 ? monthData.year : ''}</span>`;
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
  for (let i = 1; i < 16; i++) {
    const guide = document.createElement('div');
    guide.className = 'schedule-month-guide';
    guide.style.left = `${(i / 16) * 100}%`;
    guidesContainer.appendChild(guide);
  }
  barsContainer.appendChild(guidesContainer);

  // Year divider between Dec '26 and Jan '27
  const yearDivider = document.createElement('div');
  yearDivider.className = 'schedule-year-divider';
  yearDivider.style.left = `${(12 / 16) * 100}%`;
  barsContainer.appendChild(yearDivider);

  // Phase bars with wrappers for labels
  SCHEDULE_PHASES.forEach(phase => {
    const wrapper = document.createElement('div');
    wrapper.className = 'schedule-bar-wrapper';

    const style = getBarStyle(phase);
    wrapper.style.left = style.left;
    wrapper.style.width = style.width;
    wrapper.style.top = style.top;
    wrapper.style.height = `${BAR_HEIGHT}px`;

    // The bar itself
    const bar = document.createElement('div');
    bar.className = 'schedule-bar';
    bar.style.width = '100%';
    bar.style.background = phase.color;
    wrapper.appendChild(bar);

    // Add label based on position type
    if (phase.labelPos === 'internal') {
      // Label inside the bar
      const label = document.createElement('span');
      label.className = 'schedule-bar-label-internal';
      label.textContent = phase.name;
      bar.appendChild(label);
    } else if (phase.labelPos === 'above') {
      // External label above - left aligned with pill
      const label = document.createElement('span');
      label.className = 'schedule-bar-label-external';
      label.textContent = phase.name;
      label.style.bottom = '32px';
      label.style.left = '0';
      wrapper.appendChild(label);
    } else {
      // External label below (5px below bottom of pill)
      const label = document.createElement('span');
      label.className = 'schedule-bar-label-external';
      label.textContent = phase.name;
      label.style.top = `${BAR_HEIGHT + 5}px`;
      label.style.left = '50%';
      label.style.transform = 'translateX(-50%)';
      wrapper.appendChild(label);
    }

    // Hover events
    wrapper.addEventListener('mouseenter', (e) => showTooltip(e, phase));
    wrapper.addEventListener('mouseleave', hideTooltip);
    wrapper.addEventListener('mousemove', moveTooltip);

    barsContainer.appendChild(wrapper);
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

  // Animate title row first
  if (titleRow) {
    setTimeout(() => titleRow.classList.add('animate-in'), 100);
  }

  // Animate month markers with stagger
  const monthMarkers = timelineContainer?.querySelectorAll('.schedule-month-marker');
  if (monthMarkers) {
    monthMarkers.forEach((marker, i) => {
      setTimeout(() => marker.classList.add('animate-in'), 200 + i * 30);
    });
  }

  // Animate month guide lines with stagger
  const monthGuides = timelineContainer?.querySelectorAll('.schedule-month-guide');
  if (monthGuides) {
    monthGuides.forEach((guide, i) => {
      setTimeout(() => guide.classList.add('animate-in'), 250 + i * 25);
    });
  }

  // Animate year divider
  const yearDivider = timelineContainer?.querySelector('.schedule-year-divider');
  if (yearDivider) {
    setTimeout(() => yearDivider.classList.add('animate-in'), 400);
  }

  // Animate bar wrappers with stagger
  const wrappers = timelineContainer?.querySelectorAll('.schedule-bar-wrapper');
  if (wrappers) {
    wrappers.forEach((wrapper, i) => {
      setTimeout(() => wrapper.classList.add('animate-in'), 500 + i * 120);
    });
  }
}

// Reset animations (for when re-entering section)
function resetAnimations() {
  hasAnimated = false;

  if (titleRow) titleRow.classList.remove('animate-in');

  const monthMarkers = timelineContainer?.querySelectorAll('.schedule-month-marker');
  if (monthMarkers) {
    monthMarkers.forEach(marker => marker.classList.remove('animate-in'));
  }

  const monthGuides = timelineContainer?.querySelectorAll('.schedule-month-guide');
  if (monthGuides) {
    monthGuides.forEach(guide => guide.classList.remove('animate-in'));
  }

  const yearDivider = timelineContainer?.querySelector('.schedule-year-divider');
  if (yearDivider) {
    yearDivider.classList.remove('animate-in');
  }

  const wrappers = timelineContainer?.querySelectorAll('.schedule-bar-wrapper');
  if (wrappers) {
    wrappers.forEach(wrapper => wrapper.classList.remove('animate-in'));
  }
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

  // Title row with year span
  titleRow = document.createElement('div');
  titleRow.className = 'schedule-title-row';
  titleRow.innerHTML = `
    <span class="schedule-years">2026 – 2027</span>
  `;
  scheduleContainer.appendChild(titleRow);

  // Timeline container
  timelineContainer = document.createElement('div');
  timelineContainer.className = 'schedule-timeline';
  scheduleContainer.appendChild(timelineContainer);

  // Tooltip
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'schedule-tooltip';
  document.body.appendChild(tooltipEl);

  // Build timeline
  buildTimeline();

  scheduleContainer.style.opacity = 0;
  imgWorld.appendChild(scheduleContainer);

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
  titleRow = null;
  sectionIndex = -1;
  hasAnimated = false;

  const styles = document.getElementById('schedule-chapter-styles');
  if (styles) styles.remove();
}

/* ==========================================================================
   Liftoff - SCHEDULE Chapter
   Gantt-style horizontal timeline showing production phases
   With drill-down: click a phase to see weekly breakdown
   ========================================================================== */

// Uses discrete section system from content.js

// Chapter configuration
export const config = {
  title: 'SCHEDULE',
  subtitle: '',
  scheduleLayout: true,
  images: []
};

// Timeline dimensions - spans 26 months (Nov 2025 - Dec 2027)
const TIMELINE_WIDTH = 800;
const BAR_HEIGHT = 36;
const BAR_GAP = 12;
const ROW_COUNT = 2; // Row 0: filming, row 1: post-production
const MIN_BAR_WIDTH = 10; // Filming blocks are only days long; keep them visible

// Timeline starts Nov 1, 2025 (month 0) and ends Dec 31, 2027 (month 26)
const TIMELINE_START = { year: 2025, month: 11 };
const MONTH_COUNT = 26;

// Fractional month position of a date on the timeline (y, m, d are calendar values; m is 1-12)
function monthPos(y, m, d = 1) {
  const daysInMonth = new Date(y, m, 0).getDate();
  return (y - TIMELINE_START.year) * 12 + (m - TIMELINE_START.month) + (d - 1) / daysInMonth;
}

const FILMING_COLOR = 'rgba(255, 107, 107, 0.8)';
const POST_COLOR = 'rgba(60, 200, 200, 0.8)';

// Schedule from "Schedule_10.29.26" - dates are Ryan's, verbatim in `dates`
// estimated: phases marked "EST." in the schedule (drawn as outlines)
// start/end: bar extents in timeline months (end is exclusive)
// Post bars are clipped around the March 2026 shoot so the two March post phases don't overlap
const SCHEDULE_PHASES = [
  { id: 'film-1', name: 'Filmed', row: 0, color: FILMING_COLOR, estimated: false,
    dates: 'Nov 29, 2025 – Dec 9, 2025', start: monthPos(2025, 11, 29), end: monthPos(2025, 12, 10) },
  { id: 'post-1', name: 'Post-Production', row: 1, color: POST_COLOR, estimated: false,
    dates: 'Jan 2026 – Mar 2026', start: monthPos(2026, 1), end: monthPos(2026, 3, 20) },
  { id: 'film-2', name: 'Filmed', row: 0, color: FILMING_COLOR, estimated: false,
    dates: 'Mar 20, 2026 – Mar 24, 2026', start: monthPos(2026, 3, 20), end: monthPos(2026, 3, 25) },
  { id: 'post-2', name: 'Post-Production', row: 1, color: POST_COLOR, estimated: false,
    dates: 'Mar 2026 – Jul 2026', start: monthPos(2026, 3, 25), end: monthPos(2026, 8) },
  { id: 'film-3', name: 'Filmed', row: 0, color: FILMING_COLOR, estimated: false,
    dates: 'Jul 27, 2026 – Jul 31, 2026', start: monthPos(2026, 7, 27), end: monthPos(2026, 8) },
  { id: 'post-3', name: 'Post-Production', row: 1, color: POST_COLOR, estimated: false,
    dates: 'Aug 2026 – Dec 2026', start: monthPos(2026, 8), end: monthPos(2027, 1) },
  { id: 'film-4', name: 'Est. Filming', row: 0, color: FILMING_COLOR, estimated: true,
    dates: 'Dec 12, 2026 – Dec 19, 2026', start: monthPos(2026, 12, 12), end: monthPos(2026, 12, 20) },
  { id: 'post-4', name: 'Est. Post-Production', row: 1, color: POST_COLOR, estimated: true,
    dates: 'Jan 2027 – Mar 2027', start: monthPos(2027, 1), end: monthPos(2027, 4) },
  { id: 'film-5', name: 'Est. Filming', row: 0, color: FILMING_COLOR, estimated: true,
    dates: 'Mar 21, 2027 – Mar 28, 2027', start: monthPos(2027, 3, 21), end: monthPos(2027, 3, 29) },
  { id: 'post-5', name: 'Est. Post-Production', row: 1, color: POST_COLOR, estimated: true,
    dates: 'Apr 2027 – Jun 2027', start: monthPos(2027, 4), end: monthPos(2027, 7) },
  { id: 'film-6', name: 'Est. Filming', row: 0, color: FILMING_COLOR, estimated: true,
    dates: 'Jul 18, 2027 – Jul 25, 2027', start: monthPos(2027, 7, 18), end: monthPos(2027, 7, 26) },
  { id: 'post-6', name: 'Est. Post-Production', row: 1, color: POST_COLOR, estimated: true,
    dates: 'Aug 2027 – Dec 2027', start: monthPos(2027, 8), end: monthPos(2028, 1) },
];

const ROW_LABELS = ['Filming', 'Post'];

// Month labels for the 26-month timeline (Nov '25 - Dec '27)
const MONTH_LABELS = Array.from({ length: MONTH_COUNT }, (_, i) => {
  const date = new Date(TIMELINE_START.year, TIMELINE_START.month - 1 + i, 1);
  const month = date.toLocaleString('en-US', { month: 'short' });
  return { abbrev: month[0], month, year: `'${String(date.getFullYear()).slice(2)}`, isJanuary: date.getMonth() === 0 };
});

// DOM elements
let scheduleContainer = null;
let timelineContainer = null;
let titleRow = null;
let tooltipEl = null;
let sectionIndex = -1;
let hasAnimated = false;

// Drill-down state
let currentView = 'main'; // 'main' or phase id
let detailContainer = null;

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;

// Detail view dimensions
const DETAIL_BAR_HEIGHT = 28;
const DETAIL_BAR_GAP = 8;

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
      transform: translateZ(0); /* Own layer: without it Chrome hit-tests bars wrong inside the 3D container, so tooltips never fire */
      transition: opacity 0.4s ease, transform 0.4s ease;
    }
    .schedule-timeline.fade-out {
      opacity: 0;
      transform: scale(0.95);
      pointer-events: none;
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
      width: ${TIMELINE_WIDTH / MONTH_COUNT}px;
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
      height: ${(BAR_HEIGHT + BAR_GAP) * ROW_COUNT}px;
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

    /* Estimated phases: outlined instead of filled */
    .schedule-bar-wrapper.estimated .schedule-bar {
      border: 1px dashed;
    }
    .schedule-bar-wrapper.estimated .schedule-bar::before {
      display: none;
    }

    /* Row labels (left of track) */
    .schedule-row-label {
      position: absolute;
      right: calc(100% + 16px);
      transform: translateY(-50%);
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }

    /* Today marker */
    .schedule-today {
      position: absolute;
      top: -6px;
      bottom: -6px;
      width: 2px;
      margin-left: -1px;
      background: rgba(255, 255, 255, 0.85);
      border-radius: 1px;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
      pointer-events: none;
      z-index: 5;
    }
    .schedule-today-label {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 6px;
      font-family: 'montserrat', sans-serif;
      font-size: 9px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.85);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      white-space: nowrap;
    }

    /* Legend + completion note */
    .schedule-footer {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-top: 36px;
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
    }
    .schedule-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .schedule-legend-swatch {
      width: 18px;
      height: 10px;
      border-radius: 5px;
    }
    .schedule-legend-swatch.estimated {
      background: rgba(255, 255, 255, 0.12);
      border: 1px dashed rgba(255, 255, 255, 0.7);
    }
    .schedule-complete-note {
      margin-left: auto;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
    }

    /* Click hint on hover */
    .schedule-bar-wrapper:hover .schedule-bar-click-hint {
      opacity: 1;
    }
    .schedule-bar-click-hint {
      position: absolute;
      bottom: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'montserrat', sans-serif;
      font-size: 9px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.4);
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
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
    .schedule-tooltip-hint {
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 8px;
    }

    /* ===== Detail (drill-down) view ===== */
    .schedule-detail {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      opacity: 0;
      transform: scale(1.05);
      transition: opacity 0.4s ease, transform 0.4s ease;
      pointer-events: none;
    }
    .schedule-detail.visible {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    /* Detail header */
    .schedule-detail-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      width: ${TIMELINE_WIDTH}px;
    }
    .schedule-detail-back {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
      flex-shrink: 0;
    }
    .schedule-detail-back:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }
    .schedule-detail-back svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: rgba(255, 255, 255, 0.8);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .schedule-detail-title {
      font-family: 'montserrat', sans-serif;
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .schedule-detail-dates {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.5);
      margin-left: auto;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Detail timeline */
    .schedule-detail-timeline {
      position: relative;
      width: ${TIMELINE_WIDTH}px;
    }

    /* Week markers */
    .schedule-detail-weeks {
      display: flex;
      margin-bottom: 12px;
      padding: 0 2px;
    }
    .schedule-detail-week-marker {
      font-family: 'montserrat', sans-serif;
      font-size: 8px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      opacity: 0;
      transform: translateY(-8px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .schedule-detail-week-marker.animate-in {
      opacity: 1;
      transform: translateY(0);
    }

    /* Detail bars container */
    .schedule-detail-bars {
      position: relative;
    }

    /* Detail bar wrapper */
    .schedule-detail-bar-wrapper {
      position: absolute;
      height: ${DETAIL_BAR_HEIGHT}px;
      opacity: 0;
      transform: translateX(-10px);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }
    .schedule-detail-bar-wrapper.animate-in {
      opacity: 1;
      transform: translateX(0);
    }

    /* Detail bar */
    .schedule-detail-bar {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: ${DETAIL_BAR_HEIGHT / 2}px;
      cursor: default;
      transition: transform 0.2s ease;
    }
    .schedule-detail-bar::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: ${DETAIL_BAR_HEIGHT / 2}px;
      padding: 1px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.15) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      pointer-events: none;
    }
    .schedule-detail-bar-wrapper:hover .schedule-detail-bar {
      transform: scale(1.02) translateY(-1px);
    }

    /* Detail bar label */
    .schedule-detail-bar-label {
      position: absolute;
      top: 50%;
      left: 14px;
      transform: translateY(-50%);
      font-family: 'montserrat', sans-serif;
      font-size: 9px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      letter-spacing: 0.03em;
      white-space: nowrap;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      pointer-events: none;
    }

    /* Detail week guides */
    .schedule-detail-guides {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      pointer-events: none;
    }
    .schedule-detail-guide {
      position: absolute;
      top: -12px;
      width: 1px;
      height: calc(100% + 12px);
      background: linear-gradient(to bottom,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.05) 60%,
        rgba(255, 255, 255, 0) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .schedule-detail-guide.animate-in {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}

// Calculate bar position and width from month values
function getBarStyle(phase) {
  const startPercent = (phase.start / MONTH_COUNT) * 100;
  const widthPercent = ((phase.end - phase.start) / MONTH_COUNT) * 100;
  const topPosition = phase.row * (BAR_HEIGHT + BAR_GAP);
  // Short (filming) blocks get a minimum width, centered on their real dates
  const minWidthShift = `max(0px, (${MIN_BAR_WIDTH}px - ${widthPercent}%) / 2)`;
  return {
    left: `calc(${startPercent}% - ${minWidthShift})`,
    width: `max(${MIN_BAR_WIDTH}px, ${widthPercent}%)`,
    top: `${topPosition}px`
  };
}

// Get date range string
function getDateRange(phase) {
  return phase.dates;
}

// Today's position on the timeline, or null when outside it
function getTodayPos() {
  const now = new Date();
  const pos = monthPos(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return pos >= 0 && pos <= MONTH_COUNT ? pos : null;
}

// Build unified timeline (main view)
function buildTimeline() {
  if (!timelineContainer) return;

  timelineContainer.innerHTML = '';

  // Month markers (year shown on the first month and on each January)
  const monthsRow = document.createElement('div');
  monthsRow.className = 'schedule-months';
  MONTH_LABELS.forEach((monthData, i) => {
    const marker = document.createElement('div');
    marker.className = 'schedule-month-marker';
    marker.innerHTML = `${monthData.abbrev}<span class="year-label">${i === 0 || monthData.isJanuary ? monthData.year : ''}</span>`;
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
  for (let i = 1; i < MONTH_COUNT; i++) {
    const guide = document.createElement('div');
    guide.className = 'schedule-month-guide';
    guide.style.left = `${(i / MONTH_COUNT) * 100}%`;
    guidesContainer.appendChild(guide);
  }
  barsContainer.appendChild(guidesContainer);

  // Year dividers at each January
  MONTH_LABELS.forEach((monthData, i) => {
    if (!monthData.isJanuary) return;
    const yearDivider = document.createElement('div');
    yearDivider.className = 'schedule-year-divider';
    yearDivider.style.left = `${(i / MONTH_COUNT) * 100}%`;
    barsContainer.appendChild(yearDivider);
  });

  // Row labels (left of the track)
  ROW_LABELS.forEach((text, row) => {
    const label = document.createElement('span');
    label.className = 'schedule-row-label';
    label.textContent = text;
    label.style.top = `${row * (BAR_HEIGHT + BAR_GAP) + BAR_HEIGHT / 2}px`;
    barsContainer.appendChild(label);
  });

  // Phase bars with wrappers for tooltips
  SCHEDULE_PHASES.forEach(phase => {
    const wrapper = document.createElement('div');
    wrapper.className = 'schedule-bar-wrapper' + (phase.estimated ? ' estimated' : '');

    const style = getBarStyle(phase);
    wrapper.style.left = style.left;
    wrapper.style.width = style.width;
    wrapper.style.top = style.top;
    wrapper.style.height = `${BAR_HEIGHT}px`;

    // The bar itself (estimated phases are outlined, not filled)
    const bar = document.createElement('div');
    bar.className = 'schedule-bar';
    bar.style.width = '100%';
    if (phase.estimated) {
      bar.style.background = phase.color.replace('0.8', '0.18');
      bar.style.borderColor = phase.color;
    } else {
      bar.style.background = phase.color;
    }
    wrapper.appendChild(bar);

    // Hover events
    wrapper.addEventListener('mouseenter', (e) => showTooltip(e, phase));
    wrapper.addEventListener('mouseleave', hideTooltip);
    wrapper.addEventListener('mousemove', moveTooltip);

    barsContainer.appendChild(wrapper);
  });

  // Today marker
  const todayPos = getTodayPos();
  if (todayPos !== null) {
    const today = document.createElement('div');
    today.className = 'schedule-today';
    today.style.left = `${(todayPos / MONTH_COUNT) * 100}%`;
    today.innerHTML = '<span class="schedule-today-label">Today</span>';
    barsContainer.appendChild(today);
  }

  timelineContainer.appendChild(barsContainer);

  // Legend + completion note
  const footer = document.createElement('div');
  footer.className = 'schedule-footer';
  footer.innerHTML = `
    <span class="schedule-legend-item"><span class="schedule-legend-swatch" style="background: ${FILMING_COLOR}"></span>Filming</span>
    <span class="schedule-legend-item"><span class="schedule-legend-swatch" style="background: ${POST_COLOR}"></span>Post-production</span>
    <span class="schedule-legend-item"><span class="schedule-legend-swatch estimated"></span>Estimated</span>
    <span class="schedule-complete-note">Est. project complete at the end of 2027</span>
  `;
  timelineContainer.appendChild(footer);
}

// === Drill-down detail view ===

function drillDown(phase) {
  if (currentView !== 'main') return;
  currentView = phase.id;

  hideTooltip();

  // Fade out main timeline
  timelineContainer.classList.add('fade-out');

  // Build and show detail view
  buildDetailView(phase);

  // Update title row
  if (titleRow) {
    const yearsEl = titleRow.querySelector('.schedule-years');
    if (yearsEl) {
      yearsEl.dataset.originalText = yearsEl.textContent;
      yearsEl.textContent = phase.name;
    }
  }
}

function drillUp() {
  if (currentView === 'main') return;
  currentView = 'main';

  // Hide detail view
  if (detailContainer) {
    detailContainer.classList.remove('visible');
    setTimeout(() => {
      if (detailContainer) {
        detailContainer.remove();
        detailContainer = null;
      }
    }, 400);
  }

  // Fade main timeline back in
  timelineContainer.classList.remove('fade-out');

  // Restore title row
  if (titleRow) {
    const yearsEl = titleRow.querySelector('.schedule-years');
    if (yearsEl && yearsEl.dataset.originalText) {
      yearsEl.textContent = yearsEl.dataset.originalText;
    }
  }
}

function buildDetailView(phase) {
  // Remove existing detail view
  if (detailContainer) {
    detailContainer.remove();
    detailContainer = null;
  }

  detailContainer = document.createElement('div');
  detailContainer.className = 'schedule-detail';

  // Calculate total weeks for this phase
  const totalMonths = phase.end - phase.start;
  const totalWeeks = Math.ceil(totalMonths * 4.33); // ~4.33 weeks per month
  const maxWeek = Math.max(...phase.weeks.map(w => w.endWeek));

  // Header with back button
  const header = document.createElement('div');
  header.className = 'schedule-detail-header';

  const backBtn = document.createElement('div');
  backBtn.className = 'schedule-detail-back';
  backBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6"/></svg>';
  backBtn.addEventListener('click', drillUp);
  header.appendChild(backBtn);

  const titleEl = document.createElement('span');
  titleEl.className = 'schedule-detail-title';
  titleEl.style.color = phase.color.replace('0.8', '1');
  titleEl.textContent = phase.name;
  header.appendChild(titleEl);

  const datesEl = document.createElement('span');
  datesEl.className = 'schedule-detail-dates';
  datesEl.textContent = getDateRange(phase);
  header.appendChild(datesEl);

  detailContainer.appendChild(header);

  // Detail timeline
  const detailTimeline = document.createElement('div');
  detailTimeline.className = 'schedule-detail-timeline';

  // Week markers
  const weeksRow = document.createElement('div');
  weeksRow.className = 'schedule-detail-weeks';
  for (let i = 0; i < maxWeek; i++) {
    const marker = document.createElement('div');
    marker.className = 'schedule-detail-week-marker';
    marker.style.width = `${100 / maxWeek}%`;
    marker.textContent = `W${i + 1}`;
    weeksRow.appendChild(marker);
  }
  detailTimeline.appendChild(weeksRow);

  // Bars container
  const barsContainer = document.createElement('div');
  barsContainer.className = 'schedule-detail-bars';

  // Week guide lines
  const guidesContainer = document.createElement('div');
  guidesContainer.className = 'schedule-detail-guides';
  for (let i = 1; i < maxWeek; i++) {
    const guide = document.createElement('div');
    guide.className = 'schedule-detail-guide';
    guide.style.left = `${(i / maxWeek) * 100}%`;
    guidesContainer.appendChild(guide);
  }
  barsContainer.appendChild(guidesContainer);

  // Calculate rows for overlapping bars (simple greedy algorithm)
  const rows = assignRows(phase.weeks, maxWeek);
  const totalRows = Math.max(...rows) + 1;
  barsContainer.style.height = `${totalRows * (DETAIL_BAR_HEIGHT + DETAIL_BAR_GAP) + 20}px`;

  // Build bars
  phase.weeks.forEach((week, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'schedule-detail-bar-wrapper';

    const leftPercent = (week.startWeek / maxWeek) * 100;
    const widthPercent = ((week.endWeek - week.startWeek) / maxWeek) * 100;
    const topPosition = rows[i] * (DETAIL_BAR_HEIGHT + DETAIL_BAR_GAP);

    wrapper.style.left = `${leftPercent}%`;
    wrapper.style.width = `${widthPercent}%`;
    wrapper.style.top = `${topPosition}px`;

    const bar = document.createElement('div');
    bar.className = 'schedule-detail-bar';
    bar.style.background = week.color;
    wrapper.appendChild(bar);

    // Label
    const label = document.createElement('span');
    label.className = 'schedule-detail-bar-label';
    label.textContent = week.label;
    bar.appendChild(label);

    // Hover tooltip for detail bars
    wrapper.addEventListener('mouseenter', (e) => {
      if (!tooltipEl) return;
      const weekStart = week.startWeek + 1;
      const weekEnd = week.endWeek;
      tooltipEl.innerHTML = `
        <div class="schedule-tooltip-title" style="color: ${week.color.replace('0.8', '1')}">${week.label}</div>
        <div class="schedule-tooltip-dates">Week ${weekStart} – Week ${weekEnd}</div>
      `;
      moveTooltip(e);
      tooltipEl.classList.add('visible');
    });
    wrapper.addEventListener('mouseleave', hideTooltip);
    wrapper.addEventListener('mousemove', moveTooltip);

    barsContainer.appendChild(wrapper);
  });

  detailTimeline.appendChild(barsContainer);
  detailContainer.appendChild(detailTimeline);

  // Append to schedule container
  scheduleContainer.appendChild(detailContainer);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    detailContainer.classList.add('visible');

    // Stagger animate week markers
    const weekMarkers = detailContainer.querySelectorAll('.schedule-detail-week-marker');
    weekMarkers.forEach((marker, i) => {
      setTimeout(() => marker.classList.add('animate-in'), 100 + i * 20);
    });

    // Stagger animate guides
    const guides = detailContainer.querySelectorAll('.schedule-detail-guide');
    guides.forEach((guide, i) => {
      setTimeout(() => guide.classList.add('animate-in'), 150 + i * 15);
    });

    // Stagger animate bars
    const bars = detailContainer.querySelectorAll('.schedule-detail-bar-wrapper');
    bars.forEach((bar, i) => {
      setTimeout(() => bar.classList.add('animate-in'), 250 + i * 80);
    });
  });
}

// Assign rows to overlapping bars using greedy algorithm
function assignRows(weeks, maxWeek) {
  const rows = new Array(weeks.length).fill(0);
  const rowEnds = []; // Track when each row becomes free

  // Sort by start time for greedy assignment
  const indices = weeks.map((_, i) => i).sort((a, b) => weeks[a].startWeek - weeks[b].startWeek);

  indices.forEach(idx => {
    const week = weeks[idx];
    let placed = false;
    for (let r = 0; r < rowEnds.length; r++) {
      if (rowEnds[r] <= week.startWeek) {
        rows[idx] = r;
        rowEnds[r] = week.endWeek;
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows[idx] = rowEnds.length;
      rowEnds.push(week.endWeek);
    }
  });

  return rows;
}

// Show tooltip
function showTooltip(e, phase) {
  if (!tooltipEl) return;

  const hasWeeks = phase.weeks && phase.weeks.length > 0;

  tooltipEl.innerHTML = `
    <div class="schedule-tooltip-title" style="color: ${phase.color.replace('0.8', '1')}">${phase.name}</div>
    <div class="schedule-tooltip-dates">${getDateRange(phase)}</div>
    ${phase.description ? `<div class="schedule-tooltip-desc">${phase.description}</div>` : ''}
    ${hasWeeks ? '<div class="schedule-tooltip-hint">Click to see weekly breakdown</div>' : ''}
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

  // Also reset detail view when leaving
  if (currentView !== 'main') {
    currentView = 'main';
    if (detailContainer) {
      detailContainer.remove();
      detailContainer = null;
    }
    timelineContainer.classList.remove('fade-out');
    if (titleRow) {
      const yearsEl = titleRow.querySelector('.schedule-years');
      if (yearsEl && yearsEl.dataset.originalText) {
        yearsEl.textContent = yearsEl.dataset.originalText;
      }
    }
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
    <span class="schedule-years">2025 – 2027</span>
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
      // Reset to main view when leaving
      if (transitionProgress > 0.5 && currentView !== 'main') {
        currentView = 'main';
        if (detailContainer) {
          detailContainer.remove();
          detailContainer = null;
        }
        timelineContainer.classList.remove('fade-out');
        if (titleRow) {
          const yearsEl = titleRow.querySelector('.schedule-years');
          if (yearsEl && yearsEl.dataset.originalText) {
            yearsEl.textContent = yearsEl.dataset.originalText;
          }
        }
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

  scheduleContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
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
  if (detailContainer) {
    detailContainer.remove();
    detailContainer = null;
  }
  timelineContainer = null;
  titleRow = null;
  sectionIndex = -1;
  hasAnimated = false;
  currentView = 'main';

  const styles = document.getElementById('schedule-chapter-styles');
  if (styles) styles.remove();
}

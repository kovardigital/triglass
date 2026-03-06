/* ==========================================================================
   Liftoff - TARGET MARKET Chapter
   Interactive stacked bar chart showing genre performance over time
   Based on Ampere Analysis chart style
   ========================================================================== */

// Chapter configuration
export const config = {
  title: 'TARGET MARKET',
  subtitle: 'Family films and Sci-Fi consistently dominate the $100M+ box office. Our film sits at the intersection of the two fastest-growing genres.',
  targetMarketLayout: true,
  images: []
};

// Genre colors matching Ampere Analysis style
const GENRES = [
  { id: 'scifi', name: 'Sci-Fi & Fantasy', color: '#2eafc9' },
  { id: 'family', name: 'Children & Family', color: '#3cb371' },
  { id: 'action', name: 'Action & Adventure', color: '#daa520' },
  { id: 'comedy', name: 'Comedy', color: '#9b7cc7' },
  { id: 'crime', name: 'Crime & Thriller', color: '#7b9fc7' },
  { id: 'drama', name: 'Drama', color: '#d4a5a5' },
  { id: 'horror', name: 'Horror', color: '#e8915f' },
  { id: 'romance', name: 'Romance', color: '#a64d79' }
];

// Data based on US studio movies grossing >$100m (Ampere Analysis style)
const CHART_DATA = [
  {
    year: 2021,
    total: 11,
    segments: [
      { genre: 'scifi', count: 7, percent: 64 },
      { genre: 'family', count: 1, percent: 9 },
      { genre: 'action', count: 1, percent: 9 },
      { genre: 'comedy', count: 1, percent: 9 },
      { genre: 'crime', count: 1, percent: 9 }
    ]
  },
  {
    year: 2022,
    total: 15,
    segments: [
      { genre: 'scifi', count: 6, percent: 39 },
      { genre: 'family', count: 3, percent: 20 },
      { genre: 'action', count: 2, percent: 13 },
      { genre: 'comedy', count: 1, percent: 7 },
      { genre: 'crime', count: 1, percent: 7 },
      { genre: 'drama', count: 1, percent: 7 },
      { genre: 'horror', count: 1, percent: 7 }
    ]
  },
  {
    year: 2023,
    total: 17,
    segments: [
      { genre: 'scifi', count: 6, percent: 35 },
      { genre: 'family', count: 5, percent: 29 },
      { genre: 'action', count: 2, percent: 12 },
      { genre: 'comedy', count: 1, percent: 6 },
      { genre: 'crime', count: 1, percent: 6 },
      { genre: 'drama', count: 1, percent: 6 },
      { genre: 'horror', count: 1, percent: 6 }
    ]
  },
  {
    year: 2024,
    total: 21,
    segments: [
      { genre: 'scifi', count: 8, percent: 37 },
      { genre: 'family', count: 7, percent: 33 },
      { genre: 'action', count: 2, percent: 10 },
      { genre: 'comedy', count: 2, percent: 10 },
      { genre: 'crime', count: 1, percent: 5 },
      { genre: 'drama', count: 1, percent: 5 }
    ]
  }
];

// Chart dimensions
const CHART_WIDTH = 700;
const CHART_HEIGHT = 420;
const BAR_WIDTH = 100;
const BAR_GAP = 60;
const CHART_PADDING = { top: 80, right: 40, bottom: 60, left: 60 };
const MAX_VALUE = 25;

// DOM elements
let chartContainer = null;
let tooltipEl = null;
let sectionIndex = -1;
let selectedGenre = null;
let hoveredSegment = null;
let isHoveringChart = false;

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;

// Get genre info by id
function getGenre(id) {
  return GENRES.find(g => g.id === id);
}

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('target-market-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'target-market-chapter-styles';
  style.textContent = `
    /* Target Market layout - combined for both preview and settled states */
    .liftoff-text.target-market-layout,
    .liftoff-preview.preview-target-market {
      top: calc(26% - 20px);
      max-width: none;
      width: 100vw;
      transition: opacity 0.4s ease-out;
    }
    .liftoff-text.target-market-layout h1,
    .liftoff-preview.preview-target-market h1 {
      font-size: clamp(24px, 3.6vw, 42px);
    }
    .liftoff-text.target-market-layout p,
    .liftoff-preview.preview-target-market p {
      position: absolute;
      top: 580px;
      left: 50%;
      transform: translateX(-50%);
      font-size: clamp(11px, 1.3vw, 15px);
      max-width: 800px;
      width: 90vw;
      padding: 0 20px;
      text-align: center;
      line-height: 1.6;
    }

    /* Chart container */
    .target-market-chart {
      position: absolute;
      width: ${CHART_WIDTH}px;
      height: ${CHART_HEIGHT}px;
      transform-style: preserve-3d;
      will-change: transform, opacity;
    }

    .chart-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 20, 35, 0.85);
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      pointer-events: none;
    }

    .chart-legend {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: grid;
      grid-template-columns: repeat(4, auto);
      gap: 8px 24px;
      justify-content: center;
      pointer-events: auto;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s ease-out, opacity 0.2s ease-out;
      white-space: nowrap;
      pointer-events: auto;
    }
    .legend-item:hover { background: rgba(255,255,255,0.1); }
    .legend-item.selected { background: rgba(255,255,255,0.15); }
    .legend-item.highlighted { background: rgba(255,255,255,0.12); }
    .legend-item.dimmed { opacity: 0.3; }
    .legend-color {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .legend-label {
      font-family: 'montserrat', sans-serif;
      font-size: 9px;
      font-weight: 500;
      color: rgba(255,255,255,0.8);
    }

    .y-axis {
      position: absolute;
      top: ${CHART_PADDING.top}px;
      left: 0;
      width: ${CHART_PADDING.left}px;
      height: calc(100% - ${CHART_PADDING.top + CHART_PADDING.bottom}px);
      pointer-events: none;
    }
    .y-axis-label {
      position: absolute;
      left: 10px;
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 400;
      color: rgba(255,255,255,0.5);
      transform: translateY(-50%);
    }
    .y-axis-title {
      position: absolute;
      left: -5px;
      top: 50%;
      transform: rotate(-90deg) translateX(-50%);
      transform-origin: left center;
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 500;
      color: rgba(255,255,255,0.6);
      white-space: nowrap;
    }

    .grid-line {
      position: absolute;
      left: ${CHART_PADDING.left}px;
      width: calc(100% - ${CHART_PADDING.left + CHART_PADDING.right}px);
      height: 1px;
      background: rgba(255,255,255,0.08);
      pointer-events: none;
    }

    .bars-container {
      position: absolute;
      top: ${CHART_PADDING.top}px;
      left: ${CHART_PADDING.left}px;
      width: calc(100% - ${CHART_PADDING.left + CHART_PADDING.right}px);
      height: calc(100% - ${CHART_PADDING.top + CHART_PADDING.bottom}px);
      pointer-events: auto;
      transform: translateZ(0);
      will-change: contents;
    }

    .bar-group {
      position: absolute;
      bottom: 0;
      width: ${BAR_WIDTH}px;
      cursor: pointer;
      pointer-events: auto;
      transform: translateZ(0);
    }

    .bar-segment {
      position: absolute;
      width: 100%;
      left: 0;
      border-radius: 3px;
      cursor: pointer;
      pointer-events: auto;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    .bar-segment:hover {
      filter: brightness(1.3) saturate(1.2);
      box-shadow: 0 0 12px rgba(255,255,255,0.3);
    }
    .bar-segment:first-child { border-radius: 3px 3px 8px 8px; }
    .bar-segment:last-child { border-radius: 8px 8px 3px 3px; }
    .bar-segment.dimmed { opacity: 0.25; filter: grayscale(0.5); }
    .bar-segment.highlighted { filter: brightness(1.3) saturate(1.2); box-shadow: 0 0 12px rgba(255,255,255,0.3); }

    .segment-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }
    .bar-segment.show-label .segment-label,
    .bar-segment:hover .segment-label { opacity: 1; }

    .year-label {
      position: absolute;
      bottom: 20px;
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
      transform: translateX(-50%);
      pointer-events: none;
    }

    .chart-tooltip {
      position: absolute;
      padding: 12px 16px;
      background: rgba(20, 25, 40, 0.98);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease-out;
      z-index: 100;
      min-width: 160px;
    }
    .chart-tooltip.visible { opacity: 1; }
    .tooltip-genre {
      font-family: 'montserrat', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tooltip-color {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
    .tooltip-stats {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 400;
      color: rgba(255,255,255,0.7);
      line-height: 1.6;
    }
    .tooltip-highlight {
      color: #fff;
      font-weight: 600;
    }

    .chart-source {
      position: absolute;
      bottom: 8px;
      right: 15px;
      font-family: 'montserrat', sans-serif;
      font-size: 9px;
      font-weight: 400;
      color: rgba(255,255,255,0.35);
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

// Create the chart DOM
function createChart() {
  chartContainer = document.createElement('div');
  chartContainer.className = 'target-market-chart';

  const bg = document.createElement('div');
  bg.className = 'chart-bg';
  chartContainer.appendChild(bg);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  GENRES.forEach(genre => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.dataset.genre = genre.id;
    item.innerHTML = `
      <div class="legend-color" style="background: ${genre.color}"></div>
      <span class="legend-label">${genre.name}</span>
    `;
    item.addEventListener('click', () => onLegendClick(genre.id));
    item.addEventListener('mouseenter', () => onLegendHover(genre.id));
    item.addEventListener('mouseleave', () => onLegendHover(null));
    legend.appendChild(item);
  });
  chartContainer.appendChild(legend);

  // Y-axis
  const yAxis = document.createElement('div');
  yAxis.className = 'y-axis';
  const yTitle = document.createElement('div');
  yTitle.className = 'y-axis-title';
  yTitle.textContent = 'No. of movies (#)';
  yAxis.appendChild(yTitle);

  const chartHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  for (let i = 0; i <= 5; i++) {
    const value = i * 5;
    const yPercent = 1 - (value / MAX_VALUE);
    const label = document.createElement('div');
    label.className = 'y-axis-label';
    label.style.top = `${yPercent * 100}%`;
    label.textContent = value;
    yAxis.appendChild(label);

    const gridLine = document.createElement('div');
    gridLine.className = 'grid-line';
    gridLine.style.top = `${CHART_PADDING.top + yPercent * chartHeight}px`;
    chartContainer.appendChild(gridLine);
  }
  chartContainer.appendChild(yAxis);

  // Bars
  const barsContainer = document.createElement('div');
  barsContainer.className = 'bars-container';

  const totalBarsWidth = CHART_DATA.length * BAR_WIDTH + (CHART_DATA.length - 1) * BAR_GAP;
  const containerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const startX = (containerWidth - totalBarsWidth) / 2;

  CHART_DATA.forEach((yearData, yearIndex) => {
    const barGroup = document.createElement('div');
    barGroup.className = 'bar-group';
    barGroup.style.left = `${startX + yearIndex * (BAR_WIDTH + BAR_GAP)}px`;

    let currentY = 0;
    yearData.segments.forEach((segment) => {
      const genre = getGenre(segment.genre);
      const segmentHeight = (segment.count / MAX_VALUE) * chartHeight;

      const segEl = document.createElement('div');
      segEl.className = 'bar-segment';
      segEl.dataset.genre = segment.genre;
      segEl.dataset.year = yearData.year;
      segEl.style.background = genre.color;
      segEl.style.height = `${segmentHeight}px`;
      segEl.style.bottom = `${currentY}px`;

      const label = document.createElement('span');
      label.className = 'segment-label';
      label.textContent = `${segment.percent}%`;
      segEl.appendChild(label);

      if (segmentHeight > 30) segEl.classList.add('show-label');

      segEl.addEventListener('mouseenter', (e) => onSegmentHover(segment, yearData, e));
      segEl.addEventListener('mouseleave', () => onSegmentHover(null, null, null));
      segEl.addEventListener('click', () => onSegmentClick(segment.genre));

      barGroup.appendChild(segEl);
      currentY += segmentHeight;
    });

    barsContainer.appendChild(barGroup);

    const yearLabel = document.createElement('div');
    yearLabel.className = 'year-label';
    yearLabel.style.left = `${CHART_PADDING.left + startX + yearIndex * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2}px`;
    yearLabel.textContent = yearData.year;
    chartContainer.appendChild(yearLabel);
  });

  chartContainer.appendChild(barsContainer);

  // Tooltip
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'chart-tooltip';
  tooltipEl.innerHTML = `
    <div class="tooltip-genre">
      <div class="tooltip-color"></div>
      <span class="tooltip-name"></span>
    </div>
    <div class="tooltip-stats"></div>
  `;
  chartContainer.appendChild(tooltipEl);

  const source = document.createElement('div');
  source.className = 'chart-source';
  source.textContent = 'Source: Ampere - Movies';
  chartContainer.appendChild(source);

  return chartContainer;
}

function onLegendClick(genreId) {
  selectedGenre = selectedGenre === genreId ? null : genreId;
  updateHighlights();
}

function onLegendHover(genreId) {
  if (selectedGenre) return;
  hoveredSegment = genreId ? { genre: genreId } : null;
  isHoveringChart = genreId !== null;
  updateHighlights();
}

function onSegmentHover(segment, yearData, event) {
  if (event) event.stopPropagation();
  if (segment && yearData) {
    hoveredSegment = { genre: segment.genre, year: yearData.year };
    isHoveringChart = true;
  } else {
    hoveredSegment = null;
    isHoveringChart = false;
  }
  if (!selectedGenre) updateHighlights();
}

function onSegmentClick(genreId) {
  selectedGenre = selectedGenre === genreId ? null : genreId;
  updateHighlights();
}

function updateHighlights() {
  if (!chartContainer) return;

  const activeGenre = selectedGenre || (hoveredSegment ? hoveredSegment.genre : null);

  chartContainer.querySelectorAll('.legend-item').forEach(item => {
    const genreId = item.dataset.genre;
    item.classList.toggle('selected', selectedGenre === genreId);
    item.classList.toggle('highlighted', !selectedGenre && hoveredSegment && genreId === hoveredSegment.genre);
    item.classList.toggle('dimmed', activeGenre && genreId !== activeGenre);
  });

  chartContainer.querySelectorAll('.bar-segment').forEach(seg => {
    const genreId = seg.dataset.genre;
    seg.classList.toggle('dimmed', activeGenre && genreId !== activeGenre);
    seg.classList.toggle('highlighted', activeGenre && genreId === activeGenre);
  });
}

function showTooltip(segment, yearData, event) {
  const genre = getGenre(segment.genre);
  tooltipEl.querySelector('.tooltip-color').style.background = genre.color;
  tooltipEl.querySelector('.tooltip-name').textContent = genre.name;
  tooltipEl.querySelector('.tooltip-stats').innerHTML = `
    <span class="tooltip-highlight">${yearData.year}</span>: ${segment.count} films (<span class="tooltip-highlight">${segment.percent}%</span>)<br>
    of ${yearData.total} films grossing >$100M
  `;

  const rect = event.target.getBoundingClientRect();
  const chartRect = chartContainer.getBoundingClientRect();
  let x = rect.left - chartRect.left + rect.width + 10;
  let y = rect.top - chartRect.top + rect.height / 2 - 40;

  if (x + 180 > CHART_WIDTH) x = rect.left - chartRect.left - 180;
  if (y < 10) y = 10;
  if (y + 80 > CHART_HEIGHT - 10) y = CHART_HEIGHT - 90;

  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
  tooltipEl.classList.add('visible');
}

function hideTooltip() {
  tooltipEl.classList.remove('visible');
}

export function deselectSegment() {
  if (!selectedGenre) return;
  selectedGenre = null;
  updateHighlights();
}

export function isSegmentSelected() {
  return selectedGenre !== null;
}

export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.targetMarketLayout);
  if (sectionIndex < 0) {
    console.warn('[TARGET-MARKET] Could not find TARGET MARKET section');
    return;
  }

  createChart();
  chartContainer.style.opacity = 0;
  chartContainer.style.pointerEvents = 'none';
  chartContainer.style.visibility = 'hidden';
  imgWorld.appendChild(chartContainer);

  console.log('[TARGET-MARKET] Chapter initialized with stacked bar chart');
}

export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !chartContainer) return;

  const goingForward = targetSection > currentSection;
  let chartZ = REST_Z;
  let chartOpacity = 0;
  let chartScale = 1;

  if (isTransitioning) {
    if (selectedGenre) deselectSegment();

    if (sectionIndex === currentSection) {
      if (goingForward) {
        chartZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
        chartScale = 1 + transitionProgress * 0.5;
        chartOpacity = Math.max(0, 1 - transitionProgress * 2);
      } else {
        chartZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
        chartScale = 1 - transitionProgress * 0.3;
        chartOpacity = 1 - transitionProgress;
      }
    } else if (sectionIndex === targetSection) {
      if (goingForward) {
        chartZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
        chartScale = 0.7 + transitionProgress * 0.3;
      } else {
        chartZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
        chartScale = 1.5 - transitionProgress * 0.5;
      }
      chartOpacity = transitionProgress;
    }
  } else {
    if (sectionIndex === currentSection) {
      chartZ = REST_Z + elasticOffset * 500;
      chartOpacity = 1;

      if (scrollAnticipation < 0) {
        chartZ = REST_Z + Math.abs(scrollAnticipation) * 200;
        chartScale = 1 + Math.abs(scrollAnticipation) * 0.2;
        chartOpacity = 1 - Math.abs(scrollAnticipation) * 0.5;
      } else if (scrollAnticipation > 0) {
        chartZ = REST_Z - scrollAnticipation * 400;
        chartScale = 1 - scrollAnticipation * 0.3;
        chartOpacity = 1 - scrollAnticipation * 0.6;
      }
    }
  }

  // Freeze parallax effect when hovering to prevent transform changes from breaking hover state
  const panX = isHoveringChart ? 0 : mouse.x * 20;
  const panY = isHoveringChart ? 0 : -mouse.y * 12;
  const effectiveLean = isHoveringChart ? 0 : leanAngle;

  chartContainer.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) translateZ(${chartZ}px) rotate(${effectiveLean}deg) scale(${chartScale})`;
  chartContainer.style.opacity = Math.max(0, Math.min(1, chartOpacity));
  chartContainer.style.visibility = chartOpacity > 0.01 ? 'visible' : 'hidden';
  chartContainer.style.pointerEvents = (sectionIndex === currentSection && !isTransitioning && chartOpacity > 0.5) ? 'auto' : 'none';
}

export function destroy() {
  if (chartContainer) {
    chartContainer.remove();
    chartContainer = null;
  }
  tooltipEl = null;
  sectionIndex = -1;
  selectedGenre = null;
  hoveredSegment = null;
  isHoveringChart = false;

  const styles = document.getElementById('target-market-chapter-styles');
  if (styles) styles.remove();
}

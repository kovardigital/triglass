/* ==========================================================================
   Liftoff - TARGET MARKET Chapter
   Family films revenue data with stacked bar chart
   ========================================================================== */

// Chapter configuration
export const config = {
  title: 'TARGET MARKET',
  subtitle: '',
  targetMarketLayout: true,
  images: []
};

// Simplified genre categories (colors matched to budget donut for cohesion)
const CATEGORIES = [
  { id: 'action', name: 'Action & Adventure', color: '#4ECDC4' },   // Teal (Production)
  { id: 'family', name: 'Children & Family', color: '#FF6B6B' },    // Coral (Above-The-Line)
  { id: 'other', name: 'Other', color: 'rgba(120, 120, 120, 0.5)' },
];

// Data: US movies grossing >$100M at US Box Office by Genre (% of total)
const CHART_DATA = [
  {
    year: 2021,
    segments: [
      { category: 'other', percent: 27 },
      { category: 'family', percent: 9 },
      { category: 'action', percent: 64 },
    ]
  },
  {
    year: 2024,
    segments: [
      { category: 'other', percent: 22 },
      { category: 'family', percent: 39 },
      { category: 'action', percent: 39 },
    ]
  },
  {
    year: 2025,
    segments: [
      { category: 'other', percent: 38 },
      { category: 'family', percent: 28 },
      { category: 'action', percent: 34 },
    ]
  }
];

// Key stats for text panel
const HEADLINE = 'Family Films Command a Growing Share of Theatrical Revenue';
const KEY_STAT = 'PG-rated films accounted for 41.5% of the US box-office revenue of 2025';
const BULLETS = [
  'Families with children attend the cinema more frequently than average audiences (53% vs. 46%)',
  '65% of families report watching content together',
  '33% of studio films grossing $100M in 2024 were family films',
];
const SOURCES = [
  'Wall Street Journal. "Wicked, Zootopia, PG Movies..." (2025).',
  'Advanced Television. "Analysis: Family Films Fueling the Box Office." (July 28, 2025).',
];

// Chart dimensions
const CHART_WIDTH = 340;
const CHART_HEIGHT = 300;
const BAR_WIDTH = 80;
const BAR_GAP = 20;
const CHART_PADDING = { top: 40, right: 20, bottom: 40, left: 20 };

// DOM elements
let marketContainer = null;
let sectionIndex = -1;
let isHoveringChart = false;

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;

function getCategory(id) {
  return CATEGORIES.find(c => c.id === id);
}

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('target-market-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'target-market-chapter-styles';
  style.textContent = `
    /* Hide default text container */
    .liftoff-text.target-market-layout {
      display: none;
    }
    .liftoff-preview.preview-target-market {
      display: none;
    }

    /* Market container */
    .target-market-container {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
    }

    /* Inner layout - side by side */
    .target-market-inner {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 48px;
      max-width: 920px;
    }

    /* Section title above everything */
    .target-market-section-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(24px, 3.6vw, 42px);
      font-weight: 400;
      color: #d4d4d4;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      margin-bottom: 20px;
      margin-top: -20px;
      text-align: center;
      width: 100%;
    }

    /* Full wrapper */
    .target-market-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* === Left panel: text content === */
    .target-market-text {
      flex: 1;
      min-width: 380px;
      max-width: 480px;
    }
    .target-market-headline {
      font-family: 'montserrat', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      line-height: 1.35;
      margin-bottom: 20px;
    }
    .target-market-key-stat {
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #FED003;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .target-market-subhead {
      font-family: 'montserrat', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.85);
      margin-bottom: 12px;
    }
    .target-market-bullets {
      list-style: none;
      padding: 0;
      margin: 0 0 24px 0;
    }
    .target-market-bullets li {
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      padding-left: 0;
      position: relative;
      margin-bottom: 8px;
    }
    .target-market-bullets li::before {
      content: '•  ';
      color: rgba(255, 255, 255, 0.4);
    }

    /* Chart label */
    .target-market-chart-label {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 6px;
      text-align: center;
    }

    /* === Right panel: chart === */
    .target-market-chart-panel {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Legend */
    .target-market-legend {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      justify-content: center;
    }
    .target-market-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .target-market-legend-swatch {
      width: 14px;
      height: 14px;
      border-radius: 2px;
    }
    .target-market-legend-label {
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Chart container */
    .target-market-chart {
      position: relative;
      width: ${CHART_WIDTH}px;
      height: ${CHART_HEIGHT}px;
      pointer-events: auto;
    }

    /* Bar group */
    .tm-bar-group {
      position: absolute;
      bottom: ${CHART_PADDING.bottom}px;
      width: ${BAR_WIDTH}px;
    }

    /* Bar segment */
    .tm-bar-segment {
      position: absolute;
      width: 100%;
      left: 0;
      transition: filter 0.2s ease, box-shadow 0.2s ease;
    }
    .tm-bar-segment:hover {
      filter: brightness(1.2);
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.15);
    }
    /* Segment percent label */
    .tm-segment-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-family: 'montserrat', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      pointer-events: none;
    }

    /* Year labels */
    .tm-year-label {
      position: absolute;
      bottom: 10px;
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.85);
      transform: translateX(-50%);
      pointer-events: none;
    }

    /* Break indicator between 2021 and 2024 */
    .tm-break {
      position: absolute;
      bottom: ${CHART_PADDING.bottom}px;
      font-family: 'montserrat', sans-serif;
      font-size: 18px;
      font-weight: 300;
      color: rgba(255, 255, 255, 0.3);
      letter-spacing: 2px;
    }

    /* Source attribution */
    .target-market-sources {
      margin-top: 16px;
      max-width: 100%;
    }
    .target-market-source-text {
      font-family: 'montserrat', sans-serif;
      font-size: 8px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.3);
      line-height: 1.5;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

// Build the full layout
function buildLayout() {
  const wrapper = document.createElement('div');
  wrapper.className = 'target-market-wrapper';

  // Section title
  const sectionTitle = document.createElement('h1');
  sectionTitle.className = 'target-market-section-title';
  sectionTitle.textContent = 'TARGET MARKET';
  wrapper.appendChild(sectionTitle);

  // Inner two-column layout
  const inner = document.createElement('div');
  inner.className = 'target-market-inner';

  // Left: text panel
  const textPanel = document.createElement('div');
  textPanel.className = 'target-market-text';

  const headline = document.createElement('div');
  headline.className = 'target-market-headline';
  headline.textContent = HEADLINE;
  textPanel.appendChild(headline);

  const keyStat = document.createElement('div');
  keyStat.className = 'target-market-key-stat';
  keyStat.textContent = KEY_STAT;
  textPanel.appendChild(keyStat);

  const subhead = document.createElement('div');
  subhead.className = 'target-market-subhead';
  subhead.textContent = 'Families are a disproportionately valuable segment';
  textPanel.appendChild(subhead);

  const bullets = document.createElement('ul');
  bullets.className = 'target-market-bullets';
  BULLETS.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    bullets.appendChild(li);
  });
  textPanel.appendChild(bullets);

  inner.appendChild(textPanel);

  // Right: chart panel
  const chartPanel = document.createElement('div');
  chartPanel.className = 'target-market-chart-panel';

  // Chart label
  const chartLabel = document.createElement('div');
  chartLabel.className = 'target-market-chart-label';
  chartLabel.textContent = 'US Movies grossing > $100M at the US Box Office by Genre';
  chartPanel.appendChild(chartLabel);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'target-market-legend';
  CATEGORIES.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'target-market-legend-item';

    const swatch = document.createElement('div');
    swatch.className = 'target-market-legend-swatch';
    swatch.style.backgroundColor = cat.color;
    item.appendChild(swatch);

    const label = document.createElement('span');
    label.className = 'target-market-legend-label';
    label.textContent = cat.name;
    item.appendChild(label);

    legend.appendChild(item);
  });
  chartPanel.appendChild(legend);

  // Chart
  const chart = document.createElement('div');
  chart.className = 'target-market-chart';

  chart.addEventListener('mouseenter', () => { isHoveringChart = true; });
  chart.addEventListener('mouseleave', () => { isHoveringChart = false; });

  const barAreaHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const totalBarsWidth = CHART_DATA.length * BAR_WIDTH + (CHART_DATA.length - 1) * BAR_GAP;
  // Add extra gap between first and second bar for the break indicator
  const breakGap = 30;
  const totalWidth = totalBarsWidth + breakGap;
  const startX = (CHART_WIDTH - totalWidth) / 2;

  CHART_DATA.forEach((yearData, yearIndex) => {
    // Offset for break gap after first bar
    const extraOffset = yearIndex > 0 ? breakGap : 0;
    const barX = startX + yearIndex * (BAR_WIDTH + BAR_GAP) + extraOffset;

    const barGroup = document.createElement('div');
    barGroup.className = 'tm-bar-group';
    barGroup.style.left = `${barX}px`;

    let currentBottom = 0;
    yearData.segments.forEach(segment => {
      const cat = getCategory(segment.category);
      const segmentHeight = (segment.percent / 100) * barAreaHeight;

      const segEl = document.createElement('div');
      segEl.className = 'tm-bar-segment';
      segEl.style.backgroundColor = cat.color;
      segEl.style.height = `${segmentHeight}px`;
      segEl.style.bottom = `${currentBottom}px`;

      // Percent label (only show if segment is large enough)
      if (segmentHeight > 25) {
        const label = document.createElement('span');
        label.className = 'tm-segment-label';
        label.textContent = `${segment.percent}%`;
        segEl.appendChild(label);
      }

      barGroup.appendChild(segEl);
      currentBottom += segmentHeight;
    });

    chart.appendChild(barGroup);

    // Year label
    const yearLabel = document.createElement('div');
    yearLabel.className = 'tm-year-label';
    yearLabel.style.left = `${barX + BAR_WIDTH / 2}px`;
    yearLabel.textContent = yearData.year;
    chart.appendChild(yearLabel);
  });

  // Break indicator (//) between 2021 and 2024
  const break1X = startX + BAR_WIDTH + BAR_GAP / 2 + breakGap / 2;
  const breakEl = document.createElement('div');
  breakEl.className = 'tm-break';
  breakEl.style.left = `${break1X - 8}px`;
  breakEl.textContent = '//';
  chart.appendChild(breakEl);

  chartPanel.appendChild(chart);

  // Source
  const sources = document.createElement('div');
  sources.className = 'target-market-sources';
  const sourceText = document.createElement('div');
  sourceText.className = 'target-market-source-text';
  sourceText.textContent = SOURCES.join(' ');
  sources.appendChild(sourceText);
  chartPanel.appendChild(sources);

  inner.appendChild(chartPanel);
  wrapper.appendChild(inner);

  return wrapper;
}

export function deselectSegment() {
  // No segment selection in simplified version
}

export function isSegmentSelected() {
  return false;
}

export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.targetMarketLayout);
  if (sectionIndex < 0) {
    console.warn('[TARGET-MARKET] Could not find TARGET MARKET section');
    return;
  }

  marketContainer = document.createElement('div');
  marketContainer.className = 'target-market-container';
  marketContainer.appendChild(buildLayout());
  marketContainer.style.opacity = 0;
  marketContainer.style.visibility = 'hidden';
  imgWorld.appendChild(marketContainer);
}

export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !marketContainer) return;

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

  // Freeze parallax when hovering chart to prevent jitter
  const panX = isHoveringChart ? 0 : mouse.x * 12;
  const panY = isHoveringChart ? 0 : -mouse.y * 6;
  const effectiveLean = isHoveringChart ? 0 : leanAngle;

  const shouldBeVisible = sectionIndex === currentSection || sectionIndex === targetSection;

  marketContainer.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) translateZ(${containerZ}px) rotate(${effectiveLean}deg) scale(${containerScale})`;
  marketContainer.style.opacity = Math.max(0, Math.min(1, containerOpacity));
  marketContainer.style.visibility = shouldBeVisible && containerOpacity > 0.01 ? 'visible' : 'hidden';
  marketContainer.style.pointerEvents = (sectionIndex === currentSection && !isTransitioning && containerOpacity > 0.5) ? 'auto' : 'none';
}

export function destroy() {
  if (marketContainer) {
    marketContainer.remove();
    marketContainer = null;
  }
  sectionIndex = -1;
  isHoveringChart = false;

  const styles = document.getElementById('target-market-chapter-styles');
  if (styles) styles.remove();
}

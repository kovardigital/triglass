/* ==========================================================================
   Liftoff - COMPS Chapter
   Comparison matrix showing Liftoff vs comparable films
   ========================================================================== */

// Uses discrete section system from content.js

// Chapter configuration
export const config = {
  title: 'COMPS',
  subtitle: '',
  compsLayout: true,
  images: []
};

// Comparable films data
const COMP_FILMS = [
  {
    id: 'stand-by-me',
    title: 'Stand By Me',
    year: '1986',
    poster: 'https://triglass-assets.s3.amazonaws.com/comp-stand-by-me.jpg',
    budget: '$8M',
    boxOffice: '$52M',
    roi: '6.5x',
    childLed: true,
    originalIP: false,
    highConcept: true,
    independent: true,
    firstDirector: true,
    festivalPedigree: false,
    festivalNote: '',
  },
  {
    id: 'wilderpeople',
    title: 'Hunt for the Wilderpeople',
    year: '2016',
    poster: 'https://triglass-assets.s3.amazonaws.com/comp-wilderpeople.jpg',
    budget: '$2.5M',
    boxOffice: '$23M',
    roi: '9.2x',
    childLed: true,
    originalIP: false,
    highConcept: true,
    independent: true,
    firstDirector: true,
    festivalPedigree: true,
    festivalNote: 'Sundance Premiere',
  },
  {
    id: 'pbf',
    title: 'Peanut Butter Falcon',
    year: '2019',
    poster: 'https://triglass-assets.s3.amazonaws.com/comp-pbf.jpg',
    budget: '$6M',
    boxOffice: '$23M',
    roi: '3.8x',
    childLed: true,
    originalIP: true,
    highConcept: true,
    independent: true,
    firstDirector: true,
    festivalPedigree: true,
    festivalNote: 'SXSW Audience Award',
  },
  {
    id: 'sketch',
    title: 'Sketch',
    year: '2025',
    poster: 'https://triglass-assets.s3.amazonaws.com/comp-sketch.jpg',
    budget: '$3M',
    boxOffice: '$11M',
    roi: '3.7x',
    childLed: true,
    originalIP: true,
    highConcept: true,
    independent: true,
    firstDirector: true,
    festivalPedigree: true,
    festivalNote: 'TIFF Premiere',
  },
  {
    id: 'liftoff',
    title: 'Liftoff',
    year: '2027',
    poster: 'https://triglass-assets.s3.amazonaws.com/comp-liftoff.jpg',
    budget: '$1.8M',
    boxOffice: '',
    roi: '',
    childLed: true,
    originalIP: true,
    highConcept: true,
    independent: true,
    firstDirector: true,
    festivalPedigree: false,
    festivalNote: '',
    isLiftoff: true,
  },
];

// Attribute rows in display order
const ATTRIBUTES = [
  { key: 'childLed', label: 'Child-led Perspective' },
  { key: 'originalIP', label: 'Original IP' },
  { key: 'highConcept', label: 'High Concept' },
  { key: 'independent', label: 'Independent Production' },
  { key: 'firstDirector', label: 'First or Second Time Directors' },
  { key: 'festivalPedigree', label: 'Festival Pedigree' },
];

const FINANCIAL_ROWS = [
  { key: 'budget', label: 'Budget' },
  { key: 'boxOffice', label: 'Box Office' },
  { key: 'roi', label: 'ROI Ratio' },
];

// Layout
const POSTER_WIDTH = 120;
const POSTER_HEIGHT = 178;
const COLUMN_WIDTH = 140;
const LABEL_WIDTH = 220;

// DOM elements
let compsContainer = null;
let sectionIndex = -1;

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('comps-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'comps-chapter-styles';
  style.textContent = `
    /* Hide default text container for comps */
    .liftoff-text.comps-layout {
      display: none;
    }
    .liftoff-preview.preview-comps {
      display: none;
    }

    /* Comps container */
    .comps-container {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
    }

    /* Inner wrapper for layout */
    .comps-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Section title */
    .comps-section-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(24px, 3.6vw, 42px);
      font-weight: 400;
      color: #d4d4d4;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      margin-bottom: 32px;
      text-align: center;
    }

    /* Table container - glassmorphism */
    .comps-table {
      background: rgba(15, 20, 35, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 28px 24px 20px;
      pointer-events: auto;
    }

    /* Poster row */
    .comps-poster-row {
      display: flex;
      align-items: flex-end;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .comps-poster-label-cell {
      width: ${LABEL_WIDTH}px;
      flex-shrink: 0;
    }
    .comps-poster-cell {
      width: ${COLUMN_WIDTH}px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .comps-poster-img {
      width: ${POSTER_WIDTH}px;
      height: ${POSTER_HEIGHT}px;
      border-radius: 6px;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(40, 40, 60, 0.6);
      transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .comps-poster-img:hover {
      transform: scale(1.04);
      border-color: rgba(255, 255, 255, 0.25);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    /* Liftoff poster gets a subtle accent glow */
    .comps-poster-cell.liftoff .comps-poster-img {
      border-color: rgba(254, 208, 3, 0.25);
    }
    .comps-poster-cell.liftoff .comps-poster-img:hover {
      border-color: rgba(254, 208, 3, 0.5);
      box-shadow: 0 8px 24px rgba(254, 208, 3, 0.15);
    }

    /* Attribute rows */
    .comps-attr-row {
      display: flex;
      align-items: center;
      min-height: 40px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .comps-attr-row:last-child {
      border-bottom: none;
    }
    .comps-attr-label {
      width: ${LABEL_WIDTH}px;
      flex-shrink: 0;
      font-family: 'montserrat', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      padding-right: 16px;
    }
    .comps-attr-cell {
      width: ${COLUMN_WIDTH}px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }

    /* Dot indicators */
    .comps-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
    }
    .comps-dot.filled {
      background: #2d8a4e;
      box-shadow: 0 0 6px rgba(45, 138, 78, 0.4);
    }
    .comps-dot.empty {
      background: transparent;
      border: 2px solid rgba(255, 255, 255, 0.25);
    }

    /* Festival note under dot */
    .comps-festival-note {
      font-family: 'montserrat', sans-serif;
      font-size: 9px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.55);
      font-style: italic;
      text-align: center;
      line-height: 1.3;
      max-width: ${COLUMN_WIDTH - 8}px;
    }

    /* Financial values */
    .comps-financial-value {
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
    }
    .comps-financial-value.accent {
      color: #FED003;
    }
    .comps-financial-value.empty {
      color: rgba(255, 255, 255, 0.2);
      font-size: 12px;
      font-weight: 400;
    }

    /* Financial section separator */
    .comps-financial-divider {
      display: flex;
      align-items: center;
      min-height: 24px;
      margin-top: 4px;
      margin-bottom: 4px;
    }
    .comps-financial-divider-line {
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.12);
    }

    /* Liftoff column highlight */
    .comps-poster-cell.liftoff,
    .comps-attr-cell.liftoff {
      position: relative;
    }
    .comps-attr-cell.liftoff::before {
      content: '';
      position: absolute;
      top: -2px;
      bottom: -2px;
      left: 4px;
      right: 4px;
      background: rgba(254, 208, 3, 0.03);
      border-radius: 4px;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

// Build comparison table
function buildTable() {
  const inner = document.createElement('div');
  inner.className = 'comps-inner';

  // Section title
  const title = document.createElement('h1');
  title.className = 'comps-section-title';
  title.textContent = 'COMPS';
  inner.appendChild(title);

  // Table
  const table = document.createElement('div');
  table.className = 'comps-table';

  // Poster row
  const posterRow = document.createElement('div');
  posterRow.className = 'comps-poster-row';

  const posterLabelCell = document.createElement('div');
  posterLabelCell.className = 'comps-poster-label-cell';
  posterRow.appendChild(posterLabelCell);

  COMP_FILMS.forEach(film => {
    const cell = document.createElement('div');
    cell.className = 'comps-poster-cell' + (film.isLiftoff ? ' liftoff' : '');

    const img = document.createElement('img');
    img.className = 'comps-poster-img';
    img.src = film.poster;
    img.alt = film.title;
    img.loading = 'lazy';
    cell.appendChild(img);

    posterRow.appendChild(cell);
  });

  table.appendChild(posterRow);

  // Attribute rows
  ATTRIBUTES.forEach(attr => {
    const row = document.createElement('div');
    row.className = 'comps-attr-row';

    const label = document.createElement('div');
    label.className = 'comps-attr-label';
    label.textContent = attr.label;
    row.appendChild(label);

    COMP_FILMS.forEach(film => {
      const cell = document.createElement('div');
      cell.className = 'comps-attr-cell' + (film.isLiftoff ? ' liftoff' : '');

      const dot = document.createElement('div');
      dot.className = 'comps-dot ' + (film[attr.key] ? 'filled' : 'empty');
      cell.appendChild(dot);

      // Festival pedigree note
      if (attr.key === 'festivalPedigree' && film.festivalNote) {
        const note = document.createElement('div');
        note.className = 'comps-festival-note';
        note.textContent = film.festivalNote;
        cell.appendChild(note);
      }

      row.appendChild(cell);
    });

    table.appendChild(row);
  });

  // Financial divider
  const divider = document.createElement('div');
  divider.className = 'comps-financial-divider';
  const dividerLine = document.createElement('div');
  dividerLine.className = 'comps-financial-divider-line';
  divider.appendChild(dividerLine);
  table.appendChild(divider);

  // Financial rows
  FINANCIAL_ROWS.forEach(fin => {
    const row = document.createElement('div');
    row.className = 'comps-attr-row';

    const label = document.createElement('div');
    label.className = 'comps-attr-label';
    label.textContent = fin.label;
    row.appendChild(label);

    COMP_FILMS.forEach(film => {
      const cell = document.createElement('div');
      cell.className = 'comps-attr-cell' + (film.isLiftoff ? ' liftoff' : '');

      const value = document.createElement('div');
      const val = film[fin.key];
      if (val) {
        value.className = 'comps-financial-value' + (film.isLiftoff ? ' accent' : '');
        value.textContent = val;
      } else {
        value.className = 'comps-financial-value empty';
        value.textContent = '—';
      }
      cell.appendChild(value);

      row.appendChild(cell);
    });

    table.appendChild(row);
  });

  inner.appendChild(table);
  return inner;
}

// Initialize chapter DOM elements
export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.compsLayout);
  if (sectionIndex < 0) {
    console.warn('[COMPS] Could not find COMPS section');
    return;
  }

  compsContainer = document.createElement('div');
  compsContainer.className = 'comps-container';
  compsContainer.appendChild(buildTable());
  compsContainer.style.opacity = 0;
  imgWorld.appendChild(compsContainer);
}

// Update chapter based on discrete section system
export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !compsContainer) return;

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

  const offsetX = mouse.x * 12;
  const offsetY = -mouse.y * 6;

  const shouldBeVisible = sectionIndex === currentSection || sectionIndex === targetSection;

  compsContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
  compsContainer.style.opacity = Math.max(0, Math.min(1, containerOpacity));
  compsContainer.style.visibility = shouldBeVisible && containerOpacity > 0.01 ? 'visible' : 'hidden';
  compsContainer.style.pointerEvents = (sectionIndex === currentSection && !isTransitioning && containerOpacity > 0.5) ? 'auto' : 'none';
}

// Cleanup chapter DOM
export function destroy() {
  if (compsContainer) {
    compsContainer.remove();
    compsContainer = null;
  }
  sectionIndex = -1;

  const styles = document.getElementById('comps-chapter-styles');
  if (styles) styles.remove();
}

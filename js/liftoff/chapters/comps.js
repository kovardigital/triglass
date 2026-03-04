/* ==========================================================================
   Liftoff - COMPS Chapter
   Wall of movie poster comps - flat wall at section Z, pan with mouse
   ========================================================================== */

// Uses discrete section system from content.js

// Chapter configuration
export const config = {
  title: 'COMPS',
  subtitle: 'Films like E.T., Jumanji, Bridge to Terabithia, and Sketch succeed because they tap into a universal childhood truth: when children face experiences too big to understand—loss, fear, isolation, change—imagination becomes their survival tool.',
  compsLayout: true,
  images: []
};

// Wall dimensions - wide grid with featured 4 in center
const WALL_COLS = 10;  // Extra column on each side
const WALL_ROWS = 5;   // Extra row on top and bottom
const POSTER_WIDTH = 226;  // 20% larger again
const POSTER_HEIGHT = 337; // 20% larger again
const POSTER_GAP = 16;

// Featured poster positions (col, row) - center row, middle 4 columns
const FEATURED_POSITIONS = [
  { col: 3, row: 2 },
  { col: 4, row: 2 },
  { col: 5, row: 2 },
  { col: 6, row: 2 },
];

// Hidden positions - leave space for title (row above featured) and subtitle (row below featured)
const HIDDEN_POSITIONS = [
  // Row above featured - middle 3 for title (centered)
  { col: 4, row: 1 },
  { col: 5, row: 1 },
  { col: 6, row: 1 },
  // Row below featured - middle 4 for subtitle
  { col: 3, row: 3 },
  { col: 4, row: 3 },
  { col: 5, row: 3 },
  { col: 6, row: 3 },
];

// Featured poster data
const FEATURED_DATA = [
  { title: 'E.T.', budget: '~$10.5M', boxOffice: '~$797.3M', year: '1982', image: 'https://triglass-assets.s3.amazonaws.com/movie-1.jpg' },
  { title: 'Jumanji', budget: '~$65M', boxOffice: '~$262.8M', year: '1995', image: 'https://triglass-assets.s3.amazonaws.com/movie-2.jpg' },
  { title: 'Bridge to Terabithia', budget: '~$20M', boxOffice: '~$137M', year: '2007', image: 'https://triglass-assets.s3.amazonaws.com/movie-3.jpg' },
  { title: 'Sketch', budget: '~$3M', boxOffice: '~$10.8M', year: '2025', image: 'https://triglass-assets.s3.amazonaws.com/movie-4.jpg' },
];

// DOM elements
let wallContainer = null;
let posterElements = [];
let sectionIndex = -1;

// Z positions matching content.js fly-through system
const REST_Z = 200;           // Where content sits when active
const APPROACH_Z = -1400;     // Where content starts when approaching
const DEPART_Z = 800;         // Where content goes when departing (must be < perspective 1000px)

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('comps-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'comps-chapter-styles';
  style.textContent = `
    /* Comps layout - expand container width */
    .liftoff-text.comps-layout,
    .liftoff-preview.preview-comps {
      max-width: 1600px;
      width: 95vw;
    }

    /* Comps layout - title above posters, subtitle below */
    .liftoff-text.comps-layout h1,
    .liftoff-preview.preview-comps h1 {
      position: absolute;
      top: -280px;
      left: 50%;
      transform: translateX(-50%);
      font-size: clamp(36px, 6vw, 72px);
      width: 100%;
      text-align: center;
      white-space: nowrap;
    }
    .liftoff-text.comps-layout p,
    .liftoff-preview.preview-comps p {
      position: absolute;
      top: 220px;
      left: 50%;
      transform: translateX(-50%);
      font-size: clamp(11px, 1.3vw, 15px);
      max-width: 1400px;
      padding: 0 20px;
      text-align: center;
      line-height: 1.6;
    }

    /* Poster wall grid */
    .comps-wall {
      position: absolute;
      display: grid;
      grid-template-columns: repeat(${WALL_COLS}, ${POSTER_WIDTH}px);
      grid-template-rows: repeat(${WALL_ROWS}, ${POSTER_HEIGHT}px);
      gap: ${POSTER_GAP}px;
      transform-style: preserve-3d;
      pointer-events: none;
    }

    /* Background poster - dimmed but clearly visible */
    .comps-poster {
      width: ${POSTER_WIDTH}px;
      height: ${POSTER_HEIGHT}px;
      background: linear-gradient(180deg, rgba(55,55,85,0.98) 0%, rgba(35,35,55,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      opacity: 0.5;
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                  opacity 0.3s ease-out;
    }
    .comps-poster .poster-label {
      font-family: 'montserrat', sans-serif;
      font-size: 8px;
      font-weight: 400;
      color: rgba(255,255,255,0.25);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .comps-poster:hover {
      opacity: 0.65;
      transform: scale(1.03);
    }

    /* Very dim poster - in title/subtitle areas */
    .comps-poster.very-dim {
      opacity: 0.5;
      background: linear-gradient(180deg, rgba(40,40,60,0.9) 0%, rgba(25,25,40,0.9) 100%);
      border-color: rgba(255,255,255,0.06);
    }
    .comps-poster.very-dim:hover {
      opacity: 0.55;
    }
    .comps-poster.very-dim .poster-label {
      color: rgba(255,255,255,0.12);
    }

    /* Featured poster - bright and prominent */
    .comps-poster.featured {
      background: #111;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      opacity: 1;
    }
    .comps-poster.featured:hover {
      opacity: 1;
      transform: scale(1.05);
      border-color: rgba(255,255,255,0.25);
      box-shadow: 0 15px 40px rgba(0,0,0,0.4), 0 0 50px rgba(100,150,255,0.15);
    }
    .comps-poster.featured .poster-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 5px;
    }
    .comps-poster.featured .poster-title {
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: auto;
      margin-bottom: auto;
      text-align: center;
      padding: 0 10px;
    }
    .comps-poster.featured .poster-data {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 20px 10px 14px;
      background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, transparent 100%);
      text-align: center;
      z-index: 1;
    }
    .comps-poster.featured .poster-data .budget,
    .comps-poster.featured .poster-data .box-office {
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      color: rgba(255,255,255,0.7);
      display: block;
      line-height: 1.5;
    }
    .comps-poster.featured .poster-data .year {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      color: rgba(255,255,255,0.9);
      display: block;
      margin-top: 5px;
      font-weight: 500;
    }
  `;
  document.head.appendChild(style);
}

// Check if position is a featured poster, return its data
function getFeaturedData(col, row) {
  const posIndex = FEATURED_POSITIONS.findIndex(p => p.col === col && p.row === row);
  if (posIndex >= 0) {
    return FEATURED_DATA[posIndex];
  }
  return null;
}

// Check if position should be hidden (for text visibility)
function isHiddenPosition(col, row) {
  return HIDDEN_POSITIONS.some(p => p.col === col && p.row === row);
}

// Initialize chapter DOM elements
export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.compsLayout);
  if (sectionIndex < 0) {
    console.warn('[COMPS] Could not find COMPS section');
    return;
  }

  // Create wall container
  wallContainer = document.createElement('div');
  wallContainer.className = 'comps-wall';

  // Calculate wall dimensions
  const wallWidth = WALL_COLS * POSTER_WIDTH + (WALL_COLS - 1) * POSTER_GAP;
  const wallHeight = WALL_ROWS * POSTER_HEIGHT + (WALL_ROWS - 1) * POSTER_GAP;

  // Set dimensions (centering done via transform in update)
  wallContainer.style.width = `${wallWidth}px`;
  wallContainer.style.height = `${wallHeight}px`;

  // Create posters in grid
  for (let row = 0; row < WALL_ROWS; row++) {
    for (let col = 0; col < WALL_COLS; col++) {
      // Very dim posters in title/subtitle areas
      if (isHiddenPosition(col, row)) {
        const dimPoster = document.createElement('div');
        dimPoster.className = 'comps-poster very-dim';
        dimPoster.innerHTML = `<span class="poster-label">Poster</span>`;
        wallContainer.appendChild(dimPoster);
        posterElements.push(dimPoster);
        continue;
      }

      const poster = document.createElement('div');
      poster.className = 'comps-poster';

      const featured = getFeaturedData(col, row);
      if (featured) {
        poster.classList.add('featured');
        poster.innerHTML = `
          <img class="poster-image" src="${featured.image}" alt="${featured.title}" />
          <div class="poster-data">
            <span class="budget">Budget: ${featured.budget}</span>
            <span class="box-office">Box Office: ${featured.boxOffice}</span>
            <span class="year">${featured.year}</span>
          </div>
        `;
      } else {
        poster.innerHTML = `<span class="poster-label">Poster</span>`;
      }

      wallContainer.appendChild(poster);
      posterElements.push(poster);
    }
  }

  wallContainer.style.opacity = 0;
  imgWorld.appendChild(wallContainer);

  console.log('[COMPS] Chapter initialized with', posterElements.length, 'posters');
}

// Update chapter based on discrete section system (matching content.js)
export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !wallContainer) return;

  const goingForward = targetSection > currentSection;

  let wallZ = REST_Z;
  let wallOpacity = 0;
  let wallScale = 1;

  if (isTransitioning) {
    if (sectionIndex === currentSection) {
      // COMPS is current section, animating away
      if (goingForward) {
        wallZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
        wallScale = 1 + transitionProgress * 0.5;
        wallOpacity = Math.max(0, 1 - transitionProgress * 2); // Fade out twice as fast
      } else {
        wallZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
        wallScale = 1 - transitionProgress * 0.3;
        wallOpacity = 1 - transitionProgress;
      }
    } else if (sectionIndex === targetSection) {
      // COMPS is target section, approaching
      if (goingForward) {
        wallZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
        wallScale = 0.7 + transitionProgress * 0.3;
      } else {
        wallZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
        wallScale = 1.5 - transitionProgress * 0.5;
      }
      wallOpacity = transitionProgress;
    }
  } else {
    // At rest
    if (sectionIndex === currentSection) {
      wallZ = REST_Z + elasticOffset * 500;
      wallOpacity = 1;

      // Apply scroll anticipation
      if (scrollAnticipation < 0) {
        wallZ = REST_Z + Math.abs(scrollAnticipation) * 200;
        wallScale = 1 + Math.abs(scrollAnticipation) * 0.2;
        wallOpacity = 1 - Math.abs(scrollAnticipation) * 0.5;
      } else if (scrollAnticipation > 0) {
        wallZ = REST_Z - scrollAnticipation * 400;
        wallScale = 1 - scrollAnticipation * 0.3;
        wallOpacity = 1 - scrollAnticipation * 0.6;
      }
    }
  }

  // Subtle parallax movement with mouse
  const panX = mouse.x * 30;
  const panY = -mouse.y * 15;

  // Apply transform to wall container - centered
  wallContainer.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) translateZ(${wallZ}px) rotate(${leanAngle}deg) scale(${wallScale})`;
  wallContainer.style.opacity = Math.max(0, Math.min(1, wallOpacity));
  // Only allow interactions when this is the active section and not transitioning
  wallContainer.style.pointerEvents = (sectionIndex === currentSection && !isTransitioning && wallOpacity > 0.5) ? 'auto' : 'none';
}

// Cleanup chapter DOM
export function destroy() {
  if (wallContainer) {
    wallContainer.remove();
    wallContainer = null;
  }
  posterElements = [];
  sectionIndex = -1;

  const styles = document.getElementById('comps-chapter-styles');
  if (styles) styles.remove();
}

/* ==========================================================================
   Liftoff - COMPS Chapter
   Wall of movie poster comps - flat wall at section Z, pan with mouse
   ========================================================================== */

import { getSectionConfig } from '../config.js';

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
  { title: 'E.T.', budget: '~$10.5M', boxOffice: '~$797.3M', year: '1982' },
  { title: 'Jumanji', budget: '~$65M', boxOffice: '~$262.8M', year: '1995' },
  { title: 'Bridge to Terabithia', budget: '~$20M', boxOffice: '~$137M', year: '2007' },
  { title: 'Sketch', budget: '~$3M', boxOffice: '~$10.8M', year: '2025' },
];

// DOM elements
let wallContainer = null;
let posterElements = [];
let sectionIndex = -1;

// Z range for content (matching content.js)
const IMAGE_START_Z = -800;
const IMAGE_END_Z = 600;

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('comps-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'comps-chapter-styles';
  style.textContent = `
    /* Comps layout - title and subtitle close to center cards */
    .liftoff-text.comps-layout {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0;
      transform: translate(-50%, -50%) translateZ(200px) !important;
      top: 50% !important;
      left: 50% !important;
    }
    .liftoff-text.comps-layout h1 {
      font-size: clamp(24px, 4vw, 48px);
      margin: 0 0 320px 0;
      width: 100%;
      text-align: center !important;
    }
    .liftoff-text.comps-layout p {
      font-size: clamp(10px, 1.2vw, 13px);
      max-width: 800px;
      margin: 320px auto 0 auto;
      padding: 0 20px;
      text-align: center !important;
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
      pointer-events: auto;
      z-index: 5;
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
      background: linear-gradient(180deg, rgba(45,45,70,0.95) 0%, rgba(22,22,38,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      opacity: 1;
    }
    .comps-poster.featured:hover {
      opacity: 1;
      transform: scale(1.05) translateZ(20px);
      border-color: rgba(255,255,255,0.25);
      box-shadow: 0 15px 40px rgba(0,0,0,0.4), 0 0 50px rgba(100,150,255,0.15);
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
      padding: 14px 10px;
      background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%);
      text-align: center;
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
          <span class="poster-title">${featured.title}</span>
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

// Update chapter based on scroll position
export function update(cameraZ, mouse, leanAngle, elasticOffset, isolatedSection = null) {
  if (sectionIndex < 0 || !wallContainer) return;

  // If isolation mode is active and this isn't the isolated section, hide
  if (isolatedSection !== null && isolatedSection !== sectionIndex) {
    wallContainer.style.opacity = 0;
    return;
  }

  // Get section config for COMPS
  const sectionConfig = getSectionConfig(sectionIndex);
  const snapZ = sectionConfig.snapZ;
  const approachDistance = sectionConfig.approachDistance;
  const departDistance = sectionConfig.departDistance;

  // Calculate section progress based on camera Z
  const contentStart = snapZ + approachDistance;
  const totalRange = approachDistance + departDistance;

  // t: 0 = content just starting, 1 = content passed
  const t = totalRange > 0
    ? Math.max(0, Math.min(1, (contentStart - cameraZ) / totalRange))
    : 0;

  // CSS Z position for the wall
  const zPos = IMAGE_START_Z + (IMAGE_END_Z - IMAGE_START_Z) * t;

  // Calculate opacity
  let opacity = 0;
  if (t > 0 && t < 1) {
    // Fade in during first 15%
    if (t < 0.15) {
      opacity = t / 0.15;
    } else if (t > 0.85) {
      // Fade out in last 15%
      opacity = 1 - ((t - 0.85) / 0.15);
    } else {
      opacity = 1;
    }

    // Proximity fade when close to camera
    if (zPos > 300) {
      const proximityFade = 1 - ((zPos - 300) / 300);
      opacity *= Math.max(0, proximityFade);
    }
  }

  // Subtle parallax movement with mouse
  const panX = mouse.x * 30;
  const panY = -mouse.y * 15;

  // Apply transform to wall container - centered
  wallContainer.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) translateZ(${zPos}px) rotate(${leanAngle}deg)`;
  wallContainer.style.opacity = Math.max(0, Math.min(1, opacity));
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

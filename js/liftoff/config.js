/* ==========================================================================
   Liftoff - Centralized Configuration
   Single source of truth for sections, snap points, and camera settings
   ========================================================================== */

// Camera Z range
export const CAMERA_START_Z = 100;
export const CAMERA_TRAVEL = 2000;

// Section definitions - add/remove/reorder sections here
// snapZ: the camera Z position where this section snaps (calculated to progress automatically)
export const SECTIONS = [
  {
    id: 'liftoff',
    title: 'LIFTOFF',
    snapZ: 100,  // Starting position
  },
  {
    id: 'logline',
    title: 'LOGLINE',
    snapZ: -607,
  },
  {
    id: 'trailer',
    title: 'TRAILER',
    snapZ: -1072,
  },
  {
    id: 'the-crew',
    title: 'THE CREW',
    snapZ: -1156,
  },
  {
    id: 'the-stakes',
    title: 'THE STAKES',
    snapZ: -1500,
  },
  {
    id: 'coming-soon',
    title: 'COMING SOON',
    snapZ: -1900,  // End position
  },
];

// Derived values (auto-calculated)
export const SECTION_COUNT = SECTIONS.length;

// Convert camera Z to progress (0-1)
export function zToProgress(z) {
  return (CAMERA_START_Z - z) / CAMERA_TRAVEL;
}

// Convert progress to camera Z
export function progressToZ(progress) {
  return CAMERA_START_Z - progress * CAMERA_TRAVEL;
}

// Get snap point progress values (auto-calculated from snapZ)
export function getSnapPoints() {
  return SECTIONS.map(s => zToProgress(s.snapZ));
}

// Get snap progress for a specific section index
export function getSectionSnapProgress(sectionIndex) {
  if (sectionIndex < 0) return 0;
  if (sectionIndex >= SECTION_COUNT) return 1;
  return zToProgress(SECTIONS[sectionIndex].snapZ);
}

// Get chapter names array
export function getChapterNames() {
  return SECTIONS.map(s => s.title);
}

/* ==========================================================================
   Liftoff - Centralized Configuration
   Single source of truth for sections, snap points, and camera settings
   ========================================================================== */

// Camera Z range
export const CAMERA_START_Z = 0;
export const CAMERA_TRAVEL = 5000;

// Section definitions - add/remove/reorder sections here
// snapZ: the camera Z position where this section snaps
// Standardized: 1000 Z units between each checkpoint
export const SECTIONS = [
  {
    id: 'liftoff',
    title: 'LIFTOFF',
    snapZ: 0,      // Starting position
  },
  {
    id: 'logline',
    title: 'LOGLINE',
    snapZ: -1000,
  },
  {
    id: 'trailer',
    title: 'TRAILER',
    snapZ: -2000,
  },
  {
    id: 'characters',
    title: 'CHARACTERS',
    snapZ: -3000,
  },
  {
    id: 'the-story',
    title: 'THE STORY',
    snapZ: -4000,
  },
  {
    id: 'coming-soon',
    title: 'COMING SOON',
    snapZ: -5000,  // End position
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

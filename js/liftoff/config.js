/* ==========================================================================
   Liftoff - Centralized Configuration
   Single source of truth for sections (discrete section system)
   ========================================================================== */

// Section definitions - add/remove/reorder sections here
// No Z positions needed - sections are discrete, not spread across Z space
export const SECTIONS = [
  { id: 'liftoff', title: 'LIFTOFF' },
  { id: 'logline', title: 'LOGLINE' },
  { id: 'trailer', title: 'TRAILER' },
  { id: 'characters', title: 'CHARACTERS' },
  { id: 'the-story', title: 'THE STORY' },
  { id: 'comps', title: 'COMPS' },
  { id: 'target-market', title: 'TARGET MARKET' },
  { id: 'the-crew', title: 'THE CREW' },
  { id: 'completion', title: 'COMPLETION' },
  { id: 'budget', title: 'BUDGET' },
  { id: 'schedule', title: 'SCHEDULE' },
  { id: 'coming-soon', title: 'COMING SOON' },
];

// Derived values
export const SECTION_COUNT = SECTIONS.length;

// Get chapter names array (for sidebar)
export function getChapterNames() {
  return SECTIONS.map(s => s.title);
}

/* ==========================================================================
   Liftoff (creative deck) - Centralized Configuration
   Single source of truth for sections (discrete section system)
   Creative-only copy of ../liftoff for talent: no business slides.
   Keep this list in the same order as SECTIONS in content.js.
   ========================================================================== */

// Section definitions - add/remove/reorder sections here
// No Z positions needed - sections are discrete, not spread across Z space
export const SECTIONS = [
  { id: 'liftoff', title: 'LIFTOFF' },
  { id: 'logline', title: 'LOGLINE' },
  { id: 'directors-statement', title: "DIRECTOR'S STATEMENT" },
  { id: 'characters', title: 'CHARACTERS' },
  { id: 'the-story', title: 'THE STORY' },
  { id: 'the-crew', title: 'THE CREW' },
  { id: 'look-book', title: 'LOOK BOOK' },
  { id: 'trailer', title: 'TRAILER' },
];

// Derived values
export const SECTION_COUNT = SECTIONS.length;

// Get chapter names array (for sidebar)
export function getChapterNames() {
  return SECTIONS.map(s => s.title);
}

/* ==========================================================================
   Liftoff - Content Module (Discrete Sections)
   Fixed Z positioning with fly-through transitions between sections
   ========================================================================== */

import * as Parallax from './parallax.js';
import * as Scroll from './scroll.js';
import * as CompsChapter from './chapters/comps.js';
import * as TargetMarketChapter from './chapters/target-market.js';
import * as CrewChapter from './chapters/crew.js';
import * as CompletionChapter from './chapters/completion.js';
import * as BudgetChapter from './chapters/budget.js';
import * as ScheduleChapter from './chapters/schedule.js';

// Section content data (simplified - no zRange needed)
const SECTIONS = [
  {
    title: 'LIFTOFF',
    titleImage: 'https://triglass-assets.s3.amazonaws.com/image0.png',
    subtitle: 'A journey beyond the stars',
    images: []
  },
  {
    title: 'LOGLINE',
    subtitle: "As grief fractures a family, two children retreat into a magical attic built from memory and imagination while their father races against time to retrieve them from a fantasy that is slowly turning into reality.",
    images: [
      { x: -120, y: -20, width: 1000, height: 1000, scale: 0.85, label: 'Logline', delay: 0, rotateY: 0, video: 'https://triglass-assets.s3.amazonaws.com/LadderShot_01.mp4', autoplay: true },
    ]
  },
  {
    title: 'TRAILER',
    subtitle: '',
    trailerLayout: true,
    images: [
      { x: 0, y: 0, width: 1280, height: 640, scale: 0.49, label: 'Trailer', delay: 0, rotateY: 0, video: 'https://triglass-assets.s3.amazonaws.com/liftoff-trailer-3.mp4', playable: true },
    ]
  },
  {
    title: 'CHARACTERS',
    subtitle: 'Three characters. One life-changing event.',
    images: [],
    charactersLayout: true, // Special layout: title above, subtitle below
    characters: [
      {
        name: 'Selena',
        x: -172,
        y: -12,
        image: 'https://triglass-assets.s3.amazonaws.com/selena-2.jpg',
        bio: "Selena (12) is a resourceful, intelligent natural leader. She's independent, stubborn, and emotionally ahead of her years. Growing up without a mother and with a father stretched beyond his limits, Selena has quietly become the emotional backbone of her family, acting as both protector and second parent to her younger brother.",
        castName: 'Genevieve Jane',
        castImage: 'https://triglass-assets.s3.amazonaws.com/genevieve.jpg',
        castBio: "Genevieve Jane is an on-camera and theater actor based in Chicago known for her natural screen presence and comedic timing. Theater highlights include Young Elsa in Paramount Aurora's regional premiere of Frozen, Brigitta in Sound of Music, and Shonelle in School of Rock. She has featured in commercials for Pizza Hut and Hansons.",
      },
      {
        name: 'Leo',
        x: -57,
        y: -12,
        image: 'https://triglass-assets.s3.amazonaws.com/leo-2.jpg',
        bio: "Leo (8) is imaginative, sensitive, and deeply connected to the magical world his mother created for him. He struggles to process grief and instead retreats into fantasy, where he can still feel close to her. His innocence and wonder make him the heart of the story.",
        castName: 'Seamus Kidwell',
        castImage: 'https://triglass-assets.s3.amazonaws.com/seamus.jpg',
        castBio: "Seamus most recently had supporting roles in the feature films \"Buddy\" (Sundance and SXSW 2026), Stephen Cone's \"System of Colors,\" and \"A Cherry Pie Christmas.\" Outside of acting, Seamus loves to read, play piano, code, draw, and play board games with his family. Represented by Gray Talent Group.",
      },
      {
        name: 'Dad',
        x: 57,
        y: -12,
        image: 'https://triglass-assets.s3.amazonaws.com/dad-2.jpg',
        bio: "Dad (40s) is a grieving father drowning in responsibility. Once warm and present, he's now emotionally distant, working overtime to keep the family afloat while struggling with his own unprocessed loss. His journey is learning to be present again before it's too late.",
        castName: 'Erik Stolhanske',
        castImage: 'https://triglass-assets.s3.amazonaws.com/erik.jpg',
        castBio: "Erik Stolhanske is an American actor, writer, and producer, and one of the members of the Broken Lizard comedy group. Best known as \"Officer Rabbit\" from the cult-classic Super Troopers, he has starred in Beerfest, The Slammin' Salmon, and Club Dread. He has also appeared on HBO's Curb Your Enthusiasm and Six Feet Under.",
      },
      {
        name: 'Grandpa',
        x: 172,
        y: -12,
        image: 'https://triglass-assets.s3.amazonaws.com/grandpa.jpg',
        bio: "Coming Soon",
      },
    ]
  },
  {
    title: 'THE STORY',
    subtitle: 'Begin The Adventure',
    storyLayout: true,
    images: []
  },
  {
    title: 'COMPS',
    subtitle: '',
    compsLayout: true,
    images: []
  },
  {
    title: 'TARGET MARKET',
    subtitle: '',
    targetMarketLayout: true,
    images: []
  },
  {
    title: 'THE CREW',
    subtitle: 'The Team Behind The Film',
    crewLayout: true,
    images: []
  },
  {
    title: 'COMPLETION',
    subtitle: 'Production Status',
    completionLayout: true,
    images: []
  },
  {
    title: 'BUDGET',
    subtitle: 'Financial Overview',
    budgetLayout: true,
    images: []
  },
  {
    title: 'SCHEDULE',
    subtitle: 'Timeline',
    scheduleLayout: true,
    images: []
  },
  {
    title: 'COMING SOON',
    subtitle: '2027',
    images: []
  }
];

// Fly-through Z positions
const REST_Z = 200;           // Where content sits when active
const APPROACH_Z = -1400;     // Where content starts when approaching
const DEPART_Z = 800;         // Where content goes when departing (must be < perspective 1000px)

// Easing function: snappy ease-out (quadratic) - scroll.js already has exponential ease
function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

// DOM elements
let viewport = null;
let textContainer = null;
let imageWorld = null;
let scrollSpacer = null;
let titleEl = null;
let subtitleEl = null;
let contactBtn = null;
let copyrightEl = null;
let scrollHintEl = null;
const imageElements = [];
const characterElements = [];
const characterBackdrops = []; // Blur backdrops appended directly to imgWorld for proper backdrop-filter

// Track which section's text is currently displayed
let lastSectionIndex = -1;

// Preview element for backward scroll anticipation
let previewContainer = null;
let previewTitleEl = null;
let previewSubtitleEl = null;

// Character bio state
let selectedCharacterIndex = -1; // -1 = none selected
let bioContainer = null;
let bioTextEl = null;
let characterBioMode = false; // True when showing a character bio
let showingCastBio = false; // True when flipped to show cast/actor bio
let meetCastButton = null; // "Meet the cast" button element

// Character animation state (for smooth lerping)
const characterAnimState = []; // {x, y, opacity, nameOpacity} for each character
const CHAR_LERP_SPEED = 0.15; // How fast characters animate (0-1, higher = faster)

// Story video for Story section (single video approach)
let storyVideoContainer = null;  // Container for close button overlay
let storyVideo = null;           // The actual video element (in preview)
let storyCloseButton = null;
let storyPlayButton = null;      // Container with video + play circle
let storyPlayCircle = null;      // Play button overlay
let isStoryVideoActive = false;
let isStoryVideoExiting = false; // Prevents re-triggering outro
let isStoryVideoClosing = false; // Prevents duplicate close calls

// Story video URLs - single video with built-in intro/outro
const STORY_VIDEO_WEBM = 'https://triglass-assets.s3.amazonaws.com/liftoffstoryslide-website-unfinishedv1.webm';
const STORY_VIDEO_HEVC = 'https://triglass-assets.s3.amazonaws.com/liftoffstoryslide-website-unfinishedv1.mp4';
// Exit point - jump to this time to play the outro animation (last ~9 seconds)
const STORY_VIDEO_EXIT_TIME = 105; // seconds from start where outro begins

// Toggle character bio view
function toggleCharacterBio(charIndex) {
  if (selectedCharacterIndex === charIndex) {
    // Clicking same character - close bio
    closeCharacterBio();
  } else {
    // Open bio for this character
    openCharacterBio(charIndex);
  }
}

// Open character bio
function openCharacterBio(charIndex) {
  selectedCharacterIndex = charIndex;
  characterBioMode = true;
  showingCastBio = false; // Always start with character bio

  // Get character data
  const charData = SECTIONS[3].characters[charIndex]; // Characters are in section 3

  // Update title to character name
  if (titleEl) {
    titleEl.textContent = charData.name.toUpperCase();
  }

  // Update bio text
  if (bioTextEl && bioContainer) {
    bioTextEl.textContent = charData.bio;
    bioContainer.classList.add('visible');
  }

  // Add bio-active class to text container
  if (textContainer) {
    textContainer.classList.add('bio-active');
  }

  // Show "Meet the cast" button only if cast data exists
  if (meetCastButton) {
    if (charData.castName && charData.castBio) {
      meetCastButton.textContent = 'Meet the Cast';
      meetCastButton.classList.add('visible');
    } else {
      meetCastButton.classList.remove('visible');
    }
  }

  // Reset flip state on portrait (ensure character image is shown)
  const portrait = characterElements[charIndex]?.portrait;
  if (portrait) {
    portrait.classList.remove('flipped');
  }
}

// Close character bio
function closeCharacterBio() {
  // Reset portrait flip state if we were showing cast
  if (selectedCharacterIndex >= 0) {
    const portrait = characterElements[selectedCharacterIndex]?.portrait;
    if (portrait) {
      portrait.classList.remove('flipped');
    }
  }

  selectedCharacterIndex = -1;
  characterBioMode = false;

  // Restore original title
  if (titleEl) {
    titleEl.textContent = 'CHARACTERS';
  }

  // Hide bio
  if (bioContainer) {
    bioContainer.classList.remove('visible');
  }

  // Remove bio-active class
  if (textContainer) {
    textContainer.classList.remove('bio-active');
  }

  // Reset cast bio state
  showingCastBio = false;

  // Hide meet cast button
  if (meetCastButton) {
    meetCastButton.classList.remove('visible');
  }
}

// Flip to show cast bio
function showCastBio() {
  if (selectedCharacterIndex < 0) return;

  showingCastBio = true;
  const charData = SECTIONS[3].characters[selectedCharacterIndex];

  // Update title to actor name
  if (titleEl) {
    titleEl.textContent = charData.castName.toUpperCase();
  }

  // Update bio text to actor bio
  if (bioTextEl) {
    bioTextEl.textContent = charData.castBio;
  }

  // Flip to show cast image (add flipped class)
  const portrait = characterElements[selectedCharacterIndex]?.portrait;
  if (portrait) {
    portrait.classList.add('flipped');
  }

  // Update button text
  if (meetCastButton) {
    meetCastButton.textContent = '← Back to Character';
    meetCastButton.classList.add('visible');
  }
}

// Flip back to character bio
function showCharacterBioFromCast() {
  if (selectedCharacterIndex < 0) return;

  showingCastBio = false;
  const charData = SECTIONS[3].characters[selectedCharacterIndex];

  // Update title back to character name
  if (titleEl) {
    titleEl.textContent = charData.name.toUpperCase();
  }

  // Update bio text back to character bio
  if (bioTextEl) {
    bioTextEl.textContent = charData.bio;
  }

  // Flip back to character image (remove flipped class)
  const portrait = characterElements[selectedCharacterIndex]?.portrait;
  if (portrait) {
    portrait.classList.remove('flipped');
  }

  // Update button text
  if (meetCastButton) {
    meetCastButton.textContent = 'Meet the Cast';
    meetCastButton.classList.add('visible');
  }
}

// Toggle between character and cast bio
function toggleCastBio() {
  if (showingCastBio) {
    showCharacterBioFromCast();
  } else {
    showCastBio();
  }
}

// Story Video functions (single video - plays in place)
function openStoryVideo(e) {
  if (e) e.stopPropagation();
  if (isStoryVideoActive || !storyVideo) return;

  isStoryVideoActive = true;
  isStoryVideoClosing = false; // Reset for new playback

  // Hide play button, show close button, hide title/subtitle
  if (storyPlayCircle) storyPlayCircle.style.opacity = '0';
  if (storyVideoContainer) storyVideoContainer.classList.add('active');
  if (textContainer) textContainer.style.opacity = '0';

  // Hide contact button and rocket indicator
  if (contactBtn) contactBtn.style.opacity = '0';
  const rocketIndicator = document.querySelector('.rocket-indicator');
  if (rocketIndicator) rocketIndicator.style.opacity = '0';

  // Play the video from start
  storyVideo.currentTime = 0;
  storyVideo.play().catch((err) => {
    console.error('[LIFTOFF] Story video play error:', err);
  });

}

function exitStoryVideo() {
  if (!isStoryVideoActive || !storyVideo || isStoryVideoExiting) return;

  isStoryVideoExiting = true;

  // Jump to the exit point (last ~9 seconds) to play outro animation
  storyVideo.currentTime = STORY_VIDEO_EXIT_TIME;
  storyVideo.play().catch(() => {});

}

function closeStoryVideo() {
  // Called ~1s before video ends (before content fades to transparent)
  if (!storyVideo) return;

  isStoryVideoExiting = false;

  // Hide close button
  if (storyVideoContainer) storyVideoContainer.classList.remove('active');

  // Reset transform to rest state (scale 1) to match starting size
  if (storyPlayButton) {
    storyPlayButton.style.transform = `translate(-50%, -50%) translateZ(${REST_Z}px) scale(1)`;
  }

  // Fade in UI elements on top of current frame
  if (storyPlayCircle) storyPlayCircle.style.opacity = '1';
  if (textContainer) textContainer.style.opacity = '1';
  if (contactBtn) contactBtn.style.opacity = '1';
  const rocketIndicator = document.querySelector('.rocket-indicator');
  if (rocketIndicator) rocketIndicator.style.opacity = '1';

  // After UI is visible, reset video and release render loop
  setTimeout(() => {
    storyVideo.currentTime = 0;
    isStoryVideoActive = false;
  }, 400);
}

// Wheel handler to close bio on scroll attempt and exit story video on scroll
function onWheelCloseBio(e) {
  if (characterBioMode) {
    e.preventDefault();
    e.stopPropagation();
    closeCharacterBio();
  }
  // Exit story video on scroll (plays outro)
  if (isStoryVideoActive) {
    e.preventDefault();
    e.stopPropagation();
    exitStoryVideo();
  }
}

// Click-outside handler to close bio or deselect segment
function onDocumentClick(e) {
  // Handle character bio mode
  if (characterBioMode) {
    // Check if click was on a character portrait
    const clickedChar = e.target.closest('.liftoff-character');
    if (clickedChar) return; // Let the character click handler deal with it

    // Check if click was on the bio itself
    if (e.target.closest('.liftoff-bio')) return;

    // Check if click was on the Meet Cast button
    if (e.target.closest('.liftoff-meet-cast-btn')) return;

    // Otherwise close the bio
    closeCharacterBio();
    return;
  }

  // Handle target market segment selection
  if (TargetMarketChapter.isSegmentSelected()) {
    // Check if click was on a venn circle or details panel
    const clickedCircle = e.target.closest('.venn-circle');
    const clickedDetails = e.target.closest('.segment-details');
    if (clickedCircle || clickedDetails) return;

    // Otherwise deselect the segment
    TargetMarketChapter.deselectSegment();
  }
}

// Inject CSS (same as before)
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .liftoff-viewport {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      overflow: visible;
      z-index: 10;
      pointer-events: none;
      perspective: 1000px;
      perspective-origin: 50% 50%;
      transform-style: preserve-3d;
    }

    /* Scroll spacer - creates scrollable area for scroll detection */
    .liftoff-scroll-spacer {
      width: 1px;
      pointer-events: none;
    }

    /* Hide scrollbar but allow scrolling */
    html {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE/Edge */
    }
    html::-webkit-scrollbar {
      display: none; /* Chrome/Safari/Opera */
    }

    /* Text container with 3D transforms */
    .liftoff-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transform-style: preserve-3d;
      text-align: center;
      width: 80vw;
      max-width: 800px;
      z-index: 20;
      pointer-events: auto;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      backface-visibility: hidden;
    }
    .liftoff-text h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(24px, 4.2vw, 46px);
      font-weight: 400;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #d4d4d4;
      line-height: 1.1;
      backface-visibility: hidden;
    }
    /* Larger title for intro section - uses Gin font */
    .liftoff-text.intro h1 {
      font-family: gin, serif;
      font-size: clamp(60px, 15vw, 150px);
      font-weight: 400;
      color: #FED003;
      letter-spacing: -0.02em;
    }
    /* Title image for intro section */
    .liftoff-text.intro h1 img.title-image {
      max-width: clamp(300px, 60vw, 800px);
      height: auto;
      display: block;
      margin: 0 auto;
    }
    /* Intro subtitle - anchored to fixed position in container */
    .liftoff-text.intro p {
      position: absolute;
      left: 0;
      right: 0;
      top: calc(50% + 40px);
    }
    .liftoff-text p {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(12px, 1.5vw, 16px);
      font-weight: 500;
      line-height: 1.6;
      color: rgba(255,255,255,0.7);
      margin: 0;
      letter-spacing: 0.02em;
    }
    /* Larger subtitle for intro section */
    .liftoff-text.intro p {
      font-size: clamp(14px, 2vw, 20px);
    }

    /* Intro animation - title fades on first, then subtitle */
    .liftoff-text.intro h1 {
      opacity: 0;
      transform: scale(0.85);
      transition: opacity 1.8s ease-out, transform 2.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .liftoff-text.intro p {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 1.5s ease-out, transform 1.8s cubic-bezier(0.16, 1, 0.3, 1);
      transition-delay: 1s;
    }
    .liftoff-text.intro.revealed h1 {
      opacity: 1;
      transform: scale(1);
    }
    .liftoff-text.intro.revealed p {
      opacity: 1;
      transform: translateY(0);
    }

    /* Outro section (COMING SOON) - smaller title */
    .liftoff-text.outro h1 {
      font-size: clamp(10px, 2vw, 19px);
      letter-spacing: 0.15em;
    }

    /* Logline section */
    .liftoff-text.logline {
      top: 46%;
    }
    .liftoff-text.logline h1 {
      font-size: clamp(24px, 4.2vw, 46px);
    }
    .liftoff-text.logline p {
      font-size: clamp(10px, 1vw, 13px);
      max-width: 600px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Trailer section - large title positioned above video */
    .liftoff-text.trailer {
      top: 28%;
    }
    .liftoff-text.trailer h1 {
      font-size: clamp(26px, 4.2vw, 52px);
      letter-spacing: 0.05em;
    }

    /* Preview container for backward scroll anticipation */
    .liftoff-preview {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transform-style: preserve-3d;
      text-align: center;
      width: 80vw;
      max-width: 800px;
      z-index: 15;
      pointer-events: none;
      opacity: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      backface-visibility: hidden;
    }
    .liftoff-preview h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(24px, 4.2vw, 46px);
      font-weight: 400;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #d4d4d4;
      line-height: 1.1;
      backface-visibility: hidden;
    }
    .liftoff-preview p {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(12px, 1.5vw, 16px);
      font-weight: 500;
      line-height: 1.6;
      color: rgba(255,255,255,0.7);
      margin: 0;
      letter-spacing: 0.02em;
    }
    /* Preview logline styling - matches main logline */
    .liftoff-preview.preview-logline {
      top: 46%;
    }
    .liftoff-preview.preview-logline h1 {
      font-size: clamp(24px, 4.2vw, 46px);
    }
    .liftoff-preview.preview-logline p {
      font-size: clamp(10px, 1vw, 13px);
      max-width: 600px;
      margin: 0 auto;
      padding: 0 20px;
    }
    .liftoff-preview.preview-intro h1 {
      font-family: gin, serif;
      font-size: clamp(60px, 15vw, 150px);
      font-weight: 400;
      color: #FED003;
      letter-spacing: -0.02em;
    }
    .liftoff-preview.preview-intro h1 img.title-image {
      max-width: clamp(300px, 60vw, 800px);
      height: auto;
      display: block;
      margin: 0 auto;
    }
    .liftoff-preview.preview-intro p {
      position: absolute;
      left: 0;
      right: 0;
      top: calc(50% + 40px);
      font-size: clamp(14px, 2vw, 20px);
    }
    .liftoff-preview.preview-trailer {
      top: 28%;
    }
    .liftoff-preview.preview-trailer h1 {
      font-size: clamp(26px, 4.2vw, 52px);
      letter-spacing: 0.05em;
    }
    .liftoff-preview.preview-characters {
      top: calc(36% - 70px);
    }
    .liftoff-preview.preview-characters h1 {
      font-size: clamp(24px, 4.2vw, 46px);
    }
    .liftoff-preview.preview-characters p {
      position: absolute;
      top: 380px;
      left: 50%;
      transform: translateX(-50%);
      font-size: clamp(12px, 1.3vw, 16px);
      white-space: nowrap;
    }
    .liftoff-preview.preview-story {
      top: 30%;
    }
    .liftoff-preview.preview-story h1 {
      font-size: clamp(26px, 4.2vw, 44px);
    }
    .liftoff-preview.preview-story p {
      font-size: clamp(10px, 1.2vw, 14px);
    }
    .liftoff-preview.preview-target-market {
      top: calc(12% - 20px);
      max-width: none;
      width: 100vw;
    }
    .liftoff-preview.preview-target-market h1 {
      font-size: clamp(24px, 3.6vw, 42px);
    }
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
    /* Preview outro styling - matches main outro (COMING SOON) */
    .liftoff-preview.preview-outro h1 {
      font-size: clamp(10px, 2vw, 19px);
      letter-spacing: 0.15em;
    }

    /* 3D world for image placeholders */
    .liftoff-image-world {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
    }

    /* Image placeholder styling */
    .liftoff-image {
      position: absolute;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.4);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      backface-visibility: hidden;
      overflow: hidden;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 10;
    }

    /* Character portrait styling - ALL styles in one block */
    .liftoff-character {
      position: absolute;
      width: 207px;
      height: 207px;
      border-radius: 50%;
      overflow: visible;
      backface-visibility: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      border: 2px solid rgba(255,255,255,0.25);
      cursor: pointer;
      pointer-events: none; /* Controlled via JavaScript */
      transition: box-shadow 0.3s ease-out, border-color 0.3s ease-out;
    }
    /* Default glow - Selena (cyan/teal) */
    .liftoff-character[data-char-index="0"] {
      border-color: rgba(0, 200, 220, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(0, 200, 220, 0.45),
                  0 0 50px rgba(0, 200, 220, 0.25);
    }
    /* Leo (pink/magenta) */
    .liftoff-character[data-char-index="1"] {
      border-color: rgba(220, 80, 120, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(220, 80, 120, 0.45),
                  0 0 50px rgba(220, 80, 120, 0.25);
    }
    /* Dad (purple) */
    .liftoff-character[data-char-index="2"] {
      border-color: rgba(160, 100, 220, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(160, 100, 220, 0.45),
                  0 0 50px rgba(160, 100, 220, 0.25);
    }
    /* Grandpa (amber/gold) */
    .liftoff-character[data-char-index="3"] {
      border-color: rgba(230, 180, 80, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(230, 180, 80, 0.45),
                  0 0 50px rgba(230, 180, 80, 0.25);
    }
    /* Gradient stroke on character portrait - white top fading to transparent bottom */
    .liftoff-character::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      padding: 3px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.05) 70%, transparent 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      pointer-events: none;
      z-index: 10;
    }
    /* Blur backdrop circle - separate element for proper backdrop-filter during transitions */
    .liftoff-character-backdrop {
      position: absolute;
      width: 240px;
      height: 240px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      pointer-events: none;
      overflow: hidden;
    }
    /* Colored ring glow per character on backdrop */
    .liftoff-character-backdrop[data-char-index="0"] {
      box-shadow: 0 0 30px rgba(0, 200, 220, 0.3),
                  inset 0 0 40px rgba(0, 200, 220, 0.08);
    }
    .liftoff-character-backdrop[data-char-index="1"] {
      box-shadow: 0 0 30px rgba(220, 80, 120, 0.3),
                  inset 0 0 40px rgba(220, 80, 120, 0.08);
    }
    .liftoff-character-backdrop[data-char-index="2"] {
      box-shadow: 0 0 30px rgba(160, 100, 220, 0.3),
                  inset 0 0 40px rgba(160, 100, 220, 0.08);
    }
    .liftoff-character-backdrop[data-char-index="3"] {
      box-shadow: 0 0 30px rgba(230, 180, 80, 0.3),
                  inset 0 0 40px rgba(230, 180, 80, 0.08);
    }
    /* Gradient stroke on backdrop - white top fading to transparent bottom */
    .liftoff-character-backdrop::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      padding: 2px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.08) 60%, transparent 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      mix-blend-mode: plus-lighter;
      pointer-events: none;
    }
    /* Subtle glint animation - slightly more visible */
    @keyframes character-glint {
      0% { left: -60%; opacity: 0; }
      5% { opacity: 1; }
      20% { left: 110%; opacity: 0; }
      100% { left: 110%; opacity: 0; }
    }
    .liftoff-character-backdrop::after {
      content: '';
      position: absolute;
      top: 0;
      left: -60%;
      width: 55%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
      transform: skewX(-20deg);
      animation: character-glint 6s ease-in-out infinite;
      pointer-events: none;
    }
    /* Stagger the glint timing per character */
    .liftoff-character-backdrop[data-char-index="0"]::after {
      animation-delay: 0.5s;
    }
    .liftoff-character-backdrop[data-char-index="1"]::after {
      animation-delay: 1.5s;
    }
    .liftoff-character-backdrop[data-char-index="2"]::after {
      animation-delay: 2s;
    }
    .liftoff-character-backdrop[data-char-index="3"]::after {
      animation-delay: 3s;
    }
    /* Hover glow - intensified */
    .liftoff-character[data-char-index="0"]:hover {
      border-color: rgba(0, 220, 240, 0.7);
      box-shadow: 0 12px 48px rgba(0,0,0,0.5),
                  0 0 35px rgba(0, 220, 240, 0.7),
                  0 0 70px rgba(0, 220, 240, 0.4),
                  inset 0 0 25px rgba(0, 220, 240, 0.25);
    }
    .liftoff-character[data-char-index="1"]:hover {
      border-color: rgba(240, 90, 140, 0.7);
      box-shadow: 0 12px 48px rgba(0,0,0,0.5),
                  0 0 35px rgba(240, 90, 140, 0.7),
                  0 0 70px rgba(240, 90, 140, 0.4),
                  inset 0 0 25px rgba(240, 90, 140, 0.25);
    }
    .liftoff-character[data-char-index="2"]:hover {
      border-color: rgba(180, 120, 240, 0.7);
      box-shadow: 0 12px 48px rgba(0,0,0,0.5),
                  0 0 35px rgba(180, 120, 240, 0.7),
                  0 0 70px rgba(180, 120, 240, 0.4),
                  inset 0 0 25px rgba(180, 120, 240, 0.25);
    }
    .liftoff-character[data-char-index="3"]:hover {
      border-color: rgba(250, 200, 100, 0.7);
      box-shadow: 0 12px 48px rgba(0,0,0,0.5),
                  0 0 35px rgba(250, 200, 100, 0.7),
                  0 0 70px rgba(250, 200, 100, 0.4),
                  inset 0 0 25px rgba(250, 200, 100, 0.25);
    }
    .liftoff-character-name {
      position: absolute;
      left: 50%;
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 2px;
      white-space: nowrap;
      pointer-events: none;
    }

    /* Bio container - slides in from right of character */
    .liftoff-bio {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 470px;
      opacity: 0;
      pointer-events: none;
      backface-visibility: hidden;
      transform-style: preserve-3d;
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .liftoff-bio.visible {
      opacity: 1;
      pointer-events: auto;
    }
    .liftoff-bio p {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(11px, 1.1vw, 14px);
      font-weight: 500;
      color: rgba(255,255,255,0.9);
      line-height: 1.7;
      text-align: left;
      margin: 0;
    }

    /* Meet the Cast button */
    .liftoff-meet-cast-btn {
      position: absolute;
      left: 50%;
      top: 50%;
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.9);
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      padding: 10px 20px;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease, background 0.2s ease, border-color 0.2s ease;
      white-space: nowrap;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .liftoff-meet-cast-btn.visible {
      opacity: 1;
      pointer-events: auto;
    }
    .liftoff-meet-cast-btn:hover {
      background: rgba(255,255,255,0.15);
      border-color: rgba(255,255,255,0.35);
    }

    /* Character portrait card flip */
    .liftoff-character {
      perspective: 600px;
    }
    .character-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.5s ease-out;
      transform-style: preserve-3d;
    }
    .liftoff-character.flipped .character-card-inner {
      transform: rotateY(180deg);
    }
    .character-card-front,
    .character-card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      border-radius: 50%;
      overflow: hidden;
    }
    .character-card-back {
      transform: rotateY(180deg);
    }
    .character-card-front img,
    .character-card-back img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    /* Title and subtitle transitions when showing character bio */
    .liftoff-text.characters h1 {
      transition: opacity 0.3s ease;
    }
    .liftoff-text.characters p {
      transition: opacity 0.3s ease;
    }
    .liftoff-text.characters.bio-active h1 {
      opacity: 1;
    }
    .liftoff-text.characters.bio-active p {
      opacity: 0;
      pointer-events: none;
    }

    /* Characters section - title above, subtitle below */
    .liftoff-text.characters {
      top: calc(36% - 70px);
    }
    .liftoff-text.characters h1 {
      font-size: clamp(24px, 4.2vw, 46px);
    }
    .liftoff-text.characters p {
      position: absolute;
      top: 380px;
      left: 50%;
      transform: translateX(-50%);
      font-size: clamp(12px, 1.3vw, 16px);
      white-space: nowrap;
    }

    /* Story section - text moved up 20% */
    .liftoff-text.story {
      top: 30%;
    }
    .liftoff-text.story h1 {
      font-size: clamp(26px, 4.2vw, 44px);
    }
    .liftoff-text.story p {
      font-size: clamp(10px, 1.2vw, 14px);
    }

    /* Story Video - close button overlay (video plays in place) */
    .story-video-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2000;
      background: transparent;
      display: none;
      pointer-events: none;
    }
    .story-video-container.active {
      display: block;
    }
    .story-video-close {
      position: absolute;
      top: 24px;
      right: 24px;
      z-index: 10;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease-out 1s, background 0.2s ease, transform 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .story-video-container.active .story-video-close {
      opacity: 1;
      pointer-events: auto;
    }
    .story-video-close:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: scale(1.1);
    }
    /* Story play button trigger in THE STORY section */
    .story-play-trigger {
      position: absolute;
      top: 50%;
      left: 50%;
      cursor: pointer;
      backface-visibility: hidden;
      pointer-events: auto;
      /* 80% size to compensate for ~25% perspective enlargement (REST_Z=200, perspective=1000) */
      width: 80vw;
      height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .story-play-trigger .preview-video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;  /* Fill width, crop top/bottom on ultrawide */
      pointer-events: none;
      transition: opacity 0.4s ease;
    }
    .story-play-trigger .preview-video.fading {
      opacity: 0;
    }
    .story-play-trigger .play-circle {
      position: relative;
      z-index: 2;
      width: 64px;
      height: 64px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateY(-60px);
      transition: background 0.2s ease, transform 0.2s ease, opacity 0.3s ease;
    }
    .story-play-trigger:hover .play-circle {
      background: rgba(0, 0, 0, 0.7);
      transform: translateY(-60px) scale(1.1);
    }
    .story-play-trigger .play-circle svg {
      width: 22px;
      height: 22px;
      fill: white;
      margin-left: 3px;
    }
    .liftoff-image span {
      display: inline-block;
      clip-path: inset(0 100% 0 0);
      transition: clip-path 0.3s ease-out;
    }

    /* Video placeholders */
    .liftoff-image video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
      image-rendering: high-quality;
    }
    /* Autoplay video mask (logline) - feathered edges with top-right fade */
    .liftoff-image.autoplay-video video {
      mask-image: radial-gradient(circle at 40% 58%, black 20%, transparent 45%);
      -webkit-mask-image: radial-gradient(circle at 40% 58%, black 20%, transparent 45%);
    }
    .liftoff-image.has-video {
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      will-change: transform;
      transform-style: preserve-3d;
      -webkit-transform-style: preserve-3d;
      border: none;
    }
    /* Static images */
    .liftoff-image.has-image {
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      will-change: transform;
      transform-style: preserve-3d;
      -webkit-transform-style: preserve-3d;
      border: none;
    }
    .liftoff-image.has-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
    }
    /* Playable video (trailer) - no mask, with play button */
    .liftoff-image.playable-video video {
      mask-image: none;
      -webkit-mask-image: none;
      border-radius: 12px;
      object-fit: contain;
    }
    .liftoff-image.playable-video {
      cursor: pointer;
      pointer-events: auto;
      overflow: visible;
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 12px;
      transition: border-color 0.3s ease;
      background: #000;
    }
    .liftoff-image.playable-video.playing {
      border-color: transparent;
    }
    .liftoff-play-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 80px;
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, transform 0.2s ease, opacity 0.3s ease;
      z-index: 10;
    }
    .liftoff-play-button:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: translate(-50%, -50%) scale(1.1);
    }
    .liftoff-play-button svg {
      width: 32px;
      height: 32px;
      fill: white;
      margin-left: 4px;
    }
    .liftoff-image.playable-video.playing .liftoff-play-button {
      opacity: 0;
      pointer-events: none;
    }
    .liftoff-image.playable-video.playing:hover .liftoff-play-button {
      opacity: 1;
      pointer-events: auto;
    }
    .liftoff-image.playable-video:hover .liftoff-play-button {
      opacity: 1;
    }
    .liftoff-play-button svg.pause-icon {
      margin-left: 0;
    }
    .liftoff-fullscreen-button {
      position: absolute;
      bottom: -70px;
      right: 0;
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, opacity 0.3s ease;
      z-index: 10;
      opacity: 0;
      pointer-events: none;
      cursor: pointer;
    }
    .liftoff-fullscreen-button:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
      transform: scale(1.08);
    }
    .liftoff-fullscreen-button svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    .liftoff-image.playable-video.playing .liftoff-fullscreen-button {
      opacity: 1;
      pointer-events: auto;
    }
    .liftoff-volume-control {
      position: absolute;
      bottom: -70px;
      right: 66px;
      display: flex;
      align-items: center;
      gap: 0;
      z-index: 10;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .liftoff-image.playable-video.playing .liftoff-volume-control {
      opacity: 1;
      pointer-events: auto;
    }
    .liftoff-volume-button {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, border-color 0.2s ease;
      cursor: pointer;
      flex-shrink: 0;
    }
    .liftoff-volume-button:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
    }
    .liftoff-volume-button svg {
      width: 26px;
      height: 26px;
      fill: white;
    }
    .liftoff-volume-button.muted svg .volume-wave {
      display: none;
    }
    /* Slider container - expands on hover */
    .liftoff-volume-slider-wrap {
      width: 0;
      overflow: hidden;
      transition: width 0.25s ease;
      display: flex;
      align-items: center;
    }
    .liftoff-volume-control:hover .liftoff-volume-slider-wrap {
      width: 110px;
    }
    .liftoff-volume-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 90px;
      height: 4px;
      margin: 0 10px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }
    .liftoff-volume-slider::-webkit-slider-runnable-track {
      height: 4px;
      border-radius: 2px;
      background: transparent;
    }
    .liftoff-volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      border: none;
      margin-top: -6px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }
    .liftoff-volume-slider::-moz-range-track {
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
    }
    .liftoff-volume-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      border: none;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }

    /* Progress bar */
    .liftoff-progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 0 0 12px 12px;
      overflow: hidden;
      z-index: 15;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease, height 0.15s ease;
      cursor: pointer;
    }
    .liftoff-image.playable-video.playing .liftoff-progress-bar {
      opacity: 1;
      pointer-events: auto;
    }
    .liftoff-image.playable-video.playing:hover .liftoff-progress-bar {
      height: 6px;
    }
    .liftoff-progress-fill {
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 0 0 0 12px;
      width: 0%;
      transition: none;
    }
    .liftoff-progress-time {
      position: absolute;
      bottom: 12px;
      left: 10px;
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      z-index: 15;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .liftoff-image.playable-video.playing .liftoff-progress-time {
      opacity: 1;
    }

    /* Password overlay for protected videos */
    .liftoff-password-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 20;
      gap: 12px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .liftoff-password-overlay.visible {
      opacity: 1;
      pointer-events: auto;
    }
    .liftoff-password-overlay .password-lock-icon {
      width: 36px;
      height: 36px;
      fill: rgba(255, 255, 255, 0.6);
      margin-bottom: 4px;
    }
    .liftoff-password-overlay .password-label {
      font-family: 'montserrat', sans-serif;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.6);
    }
    .liftoff-password-overlay .password-input-wrap {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;
    }
    .liftoff-password-overlay input {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;
      padding: 14px 18px;
      color: white;
      font-family: 'montserrat', sans-serif;
      font-size: clamp(16px, 2.5vw, 20px);
      letter-spacing: 0.05em;
      outline: none;
      width: clamp(160px, 30vw, 260px);
      transition: border-color 0.2s ease;
    }
    .liftoff-password-overlay input::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }
    .liftoff-password-overlay input:focus {
      border-color: rgba(255, 255, 255, 0.5);
    }
    .liftoff-password-overlay input.error {
      border-color: rgba(255, 80, 80, 0.7);
      animation: password-shake 0.4s ease;
    }
    .liftoff-password-overlay .password-submit {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;
      padding: 14px 22px;
      color: white;
      font-family: 'montserrat', sans-serif;
      font-size: clamp(14px, 2vw, 18px);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .liftoff-password-overlay .password-submit:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.4);
    }
    @keyframes password-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }

    /* Contact button - top right */
    .liftoff-contact {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 100;
      font-family: 'montserrat', sans-serif;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.9);
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 6px;
      padding: 10px 20px;
      cursor: pointer;
      transition: background 0.2s ease-out, border-color 0.2s ease-out, opacity 0.3s ease;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .liftoff-contact:hover {
      background: rgba(255,255,255,0.15);
      border-color: rgba(255,255,255,0.25);
    }

    /* Copyright - bottom left */
    .liftoff-copyright {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 100;
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.05em;
      color: rgba(255,255,255,0.4);
    }

    /* Scroll hint - shown on intro section */
    .liftoff-scroll-hint {
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.6s ease-out;
    }
    .liftoff-scroll-hint.visible {
      opacity: 1;
    }
    .liftoff-scroll-hint .mouse-icon {
      width: 26px;
      height: 42px;
      border: 2px solid rgba(255,255,255,0.7);
      border-radius: 14px;
      position: relative;
    }
    .liftoff-scroll-hint .mouse-wheel {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 3px;
      height: 8px;
      background: rgba(255,255,255,0.9);
      border-radius: 2px;
      animation: scroll-hint-wheel 1.8s ease-in-out infinite;
    }
    @keyframes scroll-hint-wheel {
      0%   { transform: translate(-50%, 0); opacity: 1; }
      40%  { transform: translate(-50%, -10px); opacity: 0; }
      60%  { transform: translate(-50%, 0); opacity: 0; }
      100% { transform: translate(-50%, 0); opacity: 1; }
    }
    .liftoff-scroll-hint .scroll-label {
      font-family: 'montserrat', sans-serif;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.7);
    }
  `;
  document.head.appendChild(style);
}

// Initialize content elements
function init() {
  // Immediately set black background to prevent white flash
  document.documentElement.style.backgroundColor = '#000';
  document.body.style.backgroundColor = '#000';

  injectStyles();

  // Create viewport
  viewport = document.createElement('div');
  viewport.className = 'liftoff-viewport';

  // Create text container
  textContainer = document.createElement('div');
  textContainer.className = 'liftoff-text intro';
  textContainer.innerHTML = `<h1></h1><p></p>`;
  titleEl = textContainer.querySelector('h1');
  subtitleEl = textContainer.querySelector('p');
  viewport.appendChild(textContainer);

  // Create preview container for backward scroll anticipation
  previewContainer = document.createElement('div');
  previewContainer.className = 'liftoff-preview';
  previewContainer.innerHTML = `<h1></h1><p></p>`;
  previewTitleEl = previewContainer.querySelector('h1');
  previewSubtitleEl = previewContainer.querySelector('p');
  viewport.appendChild(previewContainer);

  // Create 3D world for images
  imageWorld = document.createElement('div');
  imageWorld.className = 'liftoff-image-world';
  viewport.appendChild(imageWorld);

  // Create all image placeholders
  SECTIONS.forEach((sectionData, sectionIndex) => {
    if (!sectionData.images) return;

    sectionData.images.forEach((imgConfig) => {
      const img = document.createElement('div');
      img.className = 'liftoff-image';
      img.style.width = imgConfig.width + 'px';
      img.style.height = imgConfig.height + 'px';

      // Check if this is a video placeholder
      if (imgConfig.video && imgConfig.video !== 'VIDEO_URL_HERE') {
        img.classList.add('has-video');
        const video = document.createElement('video');
        video.src = imgConfig.video;
        video.playsInline = true;
        video.preload = 'auto';
        video.loop = imgConfig.autoplay || false;

        // Check if this is an autoplay looping video (like logline)
        if (imgConfig.autoplay) {
          video.muted = true;
          video.autoplay = true;
          img.dataset.autoplayVideo = 'true';
          img.classList.add('autoplay-video');
        }
        // Check if this is a playable video (like trailer) vs scrub video
        else if (imgConfig.playable) {
          img.classList.add('playable-video');
          video.muted = false;
          video.controls = false;

          // Track if password has been verified for this session
          let passwordVerified = !sectionData.passwordProtected;

          // Add play button overlay
          const playBtn = document.createElement('div');
          playBtn.className = 'liftoff-play-button';
          playBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
          img.appendChild(playBtn);

          // Add password overlay if section is password-protected
          if (sectionData.passwordProtected) {
            const passwordOverlay = document.createElement('div');
            passwordOverlay.className = 'liftoff-password-overlay';
            passwordOverlay.innerHTML = `
              <span class="password-label">Enter password to watch</span>
              <div class="password-input-wrap">
                <input type="password" placeholder="Password" autocomplete="off" />
                <button class="password-submit">Go</button>
              </div>
            `;
            passwordOverlay.classList.add('visible');
            playBtn.style.display = 'none';
            img.appendChild(passwordOverlay);

            const pwInput = passwordOverlay.querySelector('input');
            const pwSubmit = passwordOverlay.querySelector('.password-submit');

            const attemptPassword = () => {
              if (pwInput.value === sectionData.password) {
                passwordVerified = true;
                passwordOverlay.classList.remove('visible');
                playBtn.style.display = '';
              } else {
                pwInput.classList.add('error');
                pwInput.value = '';
                setTimeout(() => pwInput.classList.remove('error'), 500);
              }
            };

            pwSubmit.addEventListener('click', (e) => {
              e.stopPropagation();
              attemptPassword();
            });
            pwInput.addEventListener('keydown', (e) => {
              e.stopPropagation();
              if (e.key === 'Enter') attemptPassword();
            });
            pwInput.addEventListener('click', (e) => e.stopPropagation());
            passwordOverlay.addEventListener('click', (e) => e.stopPropagation());
          }

          // Add fullscreen button overlay
          const fullscreenBtn = document.createElement('div');
          fullscreenBtn.className = 'liftoff-fullscreen-button';
          fullscreenBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
          img.appendChild(fullscreenBtn);

          // Fullscreen click handler
          fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (video.requestFullscreen) {
              video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
              video.webkitRequestFullscreen();
            } else if (video.webkitEnterFullscreen) {
              video.webkitEnterFullscreen();
            }
          });

          // Add volume control (button + slider)
          const volumeControl = document.createElement('div');
          volumeControl.className = 'liftoff-volume-control';

          const sliderWrap = document.createElement('div');
          sliderWrap.className = 'liftoff-volume-slider-wrap';
          const slider = document.createElement('input');
          slider.type = 'range';
          slider.min = '0';
          slider.max = '1';
          slider.step = '0.05';
          slider.value = '1';
          slider.className = 'liftoff-volume-slider';
          sliderWrap.appendChild(slider);
          volumeControl.appendChild(sliderWrap);

          const volumeBtn = document.createElement('div');
          volumeBtn.className = 'liftoff-volume-button';
          volumeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path class="volume-wave" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
          volumeControl.appendChild(volumeBtn);

          img.appendChild(volumeControl);

          // Volume button click — toggle mute
          volumeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            video.muted = !video.muted;
            volumeBtn.classList.toggle('muted', video.muted);
            if (!video.muted && video.volume === 0) {
              video.volume = 1;
              slider.value = '1';
            }
          });

          // Slider input — adjust volume
          slider.addEventListener('input', (e) => {
            e.stopPropagation();
            video.volume = parseFloat(slider.value);
            video.muted = video.volume === 0;
            volumeBtn.classList.toggle('muted', video.muted);
          });
          slider.addEventListener('click', (e) => e.stopPropagation());

          // Add progress bar
          const progressBar = document.createElement('div');
          progressBar.className = 'liftoff-progress-bar';
          progressBar.innerHTML = '<div class="liftoff-progress-fill"></div>';
          img.appendChild(progressBar);
          const progressFill = progressBar.querySelector('.liftoff-progress-fill');

          // Add time display
          const timeDisplay = document.createElement('div');
          timeDisplay.className = 'liftoff-progress-time';
          img.appendChild(timeDisplay);

          const formatTime = (s) => {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${m}:${sec.toString().padStart(2, '0')}`;
          };

          video.addEventListener('timeupdate', () => {
            if (video.duration) {
              const pct = (video.currentTime / video.duration) * 100;
              progressFill.style.width = pct + '%';
              timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
            }
          });

          // Click on progress bar to seek
          progressBar.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = progressBar.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            video.currentTime = pct * video.duration;
          });

          // Click to play/pause (blocked until password verified)
          img.addEventListener('click', () => {
            if (!passwordVerified) return;
            if (video.paused) {
              video.play();
              img.classList.add('playing');
              playBtn.innerHTML = `<svg class="pause-icon" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
            } else {
              video.pause();
              img.classList.remove('playing');
              playBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
            }
          });

          // Reset when video ends
          video.addEventListener('ended', () => {
            img.classList.remove('playing');
            video.currentTime = 0;
            playBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
          });

          img.dataset.playable = 'true';
        } else {
          video.muted = true;
        }

        img.appendChild(video);
        img.dataset.hasVideo = 'true';
      } else if (imgConfig.image) {
        // Static image
        img.classList.add('has-image');
        const imgEl = document.createElement('img');
        imgEl.src = imgConfig.image;
        imgEl.alt = imgConfig.label || '';
        img.appendChild(imgEl);
      } else {
        img.innerHTML += `<span>${imgConfig.label}</span>`;
      }

      // Store metadata
      img.dataset.section = sectionIndex;
      img.dataset.baseX = imgConfig.x;
      img.dataset.baseY = imgConfig.y;
      img.dataset.rotateY = imgConfig.rotateY || 0;
      img.dataset.scale = imgConfig.scale || 1;
      img.style.opacity = 0;

      imageWorld.appendChild(img);
      imageElements.push(img);
    });

    // Create character portraits if this section has them
    if (sectionData.characters) {
      sectionData.characters.forEach((charConfig, charIndex) => {
        // Create blur backdrop element (appended directly to imgWorld for proper backdrop-filter)
        const backdropEl = document.createElement('div');
        backdropEl.className = 'liftoff-character-backdrop';
        backdropEl.dataset.section = sectionIndex;
        backdropEl.dataset.charIndex = charIndex;
        backdropEl.dataset.baseX = charConfig.x;
        backdropEl.dataset.baseY = charConfig.y;
        backdropEl.style.opacity = 0;
        imageWorld.appendChild(backdropEl);
        characterBackdrops.push(backdropEl);

        // Character portrait container with flip card structure
        const charEl = document.createElement('div');
        charEl.className = 'liftoff-character';
        const backCardHtml = charConfig.castImage
          ? `<div class="character-card-back"><img src="${charConfig.castImage}" alt="${charConfig.castName}"></div>`
          : '';
        charEl.innerHTML = `
          <div class="character-card-inner">
            <div class="character-card-front">
              <img src="${charConfig.image}" alt="${charConfig.name}">
            </div>
            ${backCardHtml}
          </div>
        `;

        // Store metadata
        charEl.dataset.section = sectionIndex;
        charEl.dataset.charIndex = charIndex;
        charEl.dataset.baseX = charConfig.x;
        charEl.dataset.baseY = charConfig.y;
        charEl.dataset.name = charConfig.name;
        charEl.dataset.bio = charConfig.bio || '';
        charEl.style.opacity = 0;

        // Click handler for character selection
        charEl.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleCharacterBio(charIndex);
        });

        imageWorld.appendChild(charEl);

        // Name label (separate element for positioning)
        const nameEl = document.createElement('div');
        nameEl.className = 'liftoff-character-name';
        nameEl.textContent = charConfig.name;
        nameEl.dataset.section = sectionIndex;
        nameEl.dataset.charIndex = charIndex;
        nameEl.dataset.baseX = charConfig.x;
        nameEl.dataset.baseY = charConfig.y + 40; // Below portrait (positions multiply by 3)
        nameEl.style.opacity = 0;

        imageWorld.appendChild(nameEl);

        characterElements.push({ portrait: charEl, name: nameEl });
      });

      // Create bio container (shared for all characters)
      bioContainer = document.createElement('div');
      bioContainer.className = 'liftoff-bio';
      bioTextEl = document.createElement('p');
      bioContainer.appendChild(bioTextEl);
      imageWorld.appendChild(bioContainer);

      // Create "Meet the cast" button (positioned below character portrait)
      meetCastButton = document.createElement('button');
      meetCastButton.className = 'liftoff-meet-cast-btn';
      meetCastButton.textContent = 'Meet the Cast';
      meetCastButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCastBio();
      });
      imageWorld.appendChild(meetCastButton);
    }

    // Create Story Video for Story section (simplified single video approach)
    if (sectionData.storyLayout) {
      // Play button trigger with video preview (shows in the section)
      storyPlayButton = document.createElement('div');
      storyPlayButton.className = 'story-play-trigger';
      storyPlayButton.dataset.section = sectionIndex;
      storyPlayButton.style.opacity = 0;

      // The video element (shows first frame, plays in place when clicked)
      storyVideo = document.createElement('video');
      storyVideo.className = 'preview-video';
      storyVideo.playsInline = true;
      storyVideo.preload = 'auto';
      // Add sources
      const sourceWebm = document.createElement('source');
      sourceWebm.src = STORY_VIDEO_WEBM;
      sourceWebm.type = 'video/webm';
      storyVideo.appendChild(sourceWebm);
      const sourceHevc = document.createElement('source');
      sourceHevc.src = STORY_VIDEO_HEVC;
      sourceHevc.type = 'video/mp4; codecs=hvc1';
      storyVideo.appendChild(sourceHevc);

      // Pause at first frame when loaded
      storyVideo.addEventListener('loadeddata', () => {
        storyVideo.currentTime = 0;
        storyVideo.pause();
      });

      // Catch video BEFORE content fades out (outro has alpha fade at end)
      storyVideo.addEventListener('timeupdate', () => {
        if (isStoryVideoActive && !isStoryVideoClosing && storyVideo.duration - storyVideo.currentTime < 1.0) {
          isStoryVideoClosing = true;
          storyVideo.pause(); // Freeze before content fades
          closeStoryVideo();
        }
      });

      // Debug: log errors
      storyVideo.addEventListener('error', () => {
        console.error('[LIFTOFF] Story video error:', storyVideo.error);
      });

      storyPlayButton.appendChild(storyVideo);

      // Play button overlay
      storyPlayCircle = document.createElement('div');
      storyPlayCircle.className = 'play-circle';
      storyPlayCircle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
      storyPlayButton.appendChild(storyPlayCircle);

      storyPlayButton.addEventListener('click', openStoryVideo);
      imageWorld.appendChild(storyPlayButton);

      // Close button container (fixed overlay, just for close button)
      storyVideoContainer = document.createElement('div');
      storyVideoContainer.className = 'story-video-container';

      // Close button
      storyCloseButton = document.createElement('button');
      storyCloseButton.className = 'story-video-close';
      storyCloseButton.innerHTML = '&times;';
      storyCloseButton.addEventListener('click', (e) => {
        e.stopPropagation();
        exitStoryVideo();
      });

      // Append close button container to body (video stays in imageWorld)
      storyVideoContainer.appendChild(storyCloseButton);
      document.body.appendChild(storyVideoContainer);
    }
  });

  document.body.appendChild(viewport);

  // Scroll spacer (needed for scroll detection)
  scrollSpacer = document.createElement('div');
  scrollSpacer.className = 'liftoff-scroll-spacer';
  scrollSpacer.style.height = '300vh'; // Enough room to scroll both directions
  document.body.appendChild(scrollSpacer);

  // Contact button
  contactBtn = document.createElement('button');
  contactBtn.className = 'liftoff-contact';
  contactBtn.textContent = 'Contact';
  contactBtn.addEventListener('click', () => {
    window.location.href = 'mailto:hello@triglass.com';
  });
  document.body.appendChild(contactBtn);

  // Copyright
  copyrightEl = document.createElement('div');
  copyrightEl.className = 'liftoff-copyright';
  copyrightEl.textContent = '\u00A9 2026 Triglass Productions';
  document.body.appendChild(copyrightEl);

  // Scroll hint (shown only on intro section)
  scrollHintEl = document.createElement('div');
  scrollHintEl.className = 'liftoff-scroll-hint';
  scrollHintEl.innerHTML = `
    <div class="mouse-icon"><div class="mouse-wheel"></div></div>
    <div class="scroll-label">Scroll</div>
  `;
  document.body.appendChild(scrollHintEl);

  // Click-outside handler for closing character bios
  document.addEventListener('click', onDocumentClick);

  // Wheel handler to close bio before scrolling (capture phase to intercept first)
  window.addEventListener('wheel', onWheelCloseBio, { capture: true });

  // Initialize chapter modules
  CompsChapter.init(imageWorld, SECTIONS);
  TargetMarketChapter.init(imageWorld, SECTIONS);
  CrewChapter.init(imageWorld, SECTIONS);
  CompletionChapter.init(imageWorld, SECTIONS);
  BudgetChapter.init(imageWorld, SECTIONS);
  ScheduleChapter.init(imageWorld, SECTIONS);

  // Set initial text for intro
  setTextContent(0);

}

// Set text content (no CSS animation - handled by JavaScript fly-through)
function setTextContent(sectionIndex) {
  const section = SECTIONS[sectionIndex];
  if (!section) return;

  // Update text content
  if (section.titleImage && sectionIndex === 0) {
    titleEl.innerHTML = `<img src="${section.titleImage}" alt="${section.title}" class="title-image">`;
  } else {
    titleEl.textContent = section.title;
  }
  subtitleEl.textContent = section.subtitle;

  // Update CSS classes for styling
  textContainer.classList.remove('intro', 'logline', 'trailer', 'characters', 'story', 'comps-layout', 'target-market-layout', 'crew-layout', 'completion-layout', 'budget-layout', 'schedule-layout', 'outro');
  if (sectionIndex === 0) {
    textContainer.classList.add('intro');
  } else if (sectionIndex === 1) {
    textContainer.classList.add('logline');
  } else if (sectionIndex === 2 || section.trailerLayout) {
    textContainer.classList.add('trailer');
  } else if (sectionIndex === 3) {
    textContainer.classList.add('characters');
  } else if (sectionIndex === 4) {
    textContainer.classList.add('story');
  } else if (section.compsLayout) {
    textContainer.classList.add('comps-layout');
  } else if (section.targetMarketLayout) {
    textContainer.classList.add('target-market-layout');
  } else if (section.crewLayout) {
    textContainer.classList.add('crew-layout');
  } else if (section.completionLayout) {
    textContainer.classList.add('completion-layout');
  } else if (section.budgetLayout) {
    textContainer.classList.add('budget-layout');
  } else if (section.scheduleLayout) {
    textContainer.classList.add('schedule-layout');
  } else if (sectionIndex === SECTIONS.length - 1) {
    textContainer.classList.add('outro');
  }

  lastSectionIndex = sectionIndex;
}

// Update content based on discrete sections
function update() {
  if (!viewport || !imageWorld) return;

  const currentSection = Scroll.getCurrentSection();
  const targetSection = Scroll.getTargetSection();
  const rawProgress = Scroll.getTransitionProgress();
  const isTransitioning = Scroll.isInTransition();
  const elasticOffset = Scroll.getElasticOffset();
  const scrollAnticipation = Scroll.getScrollAnticipation();

  // Apply easing for snappier feel (slow-fast-slow)
  const transitionProgress = easeOutQuad(rawProgress);

  // Get parallax values (reduced for subtler movement)
  const mouse = Parallax.getMouse();
  const rotZ = Parallax.getRotationZ();
  const leanAngle = rotZ * 20;
  const offsetX = mouse.x * 8;
  const offsetY = -mouse.y * 2;

  // Main container = current section's content
  // Preview container = target section's content (during transitions) or previous section (during backward anticipation)

  let textZ = REST_Z;
  let textOpacity = 1;
  let textScale = 1;
  let previewZ = DEPART_Z;
  let previewOpacity = 0;
  let previewScale = 1;
  let previewY = 0; // Slide-up effect (starts offset, ends at 0)

  if (isTransitioning) {
    // DURING TRANSITION: Both sections visible
    // Main container shows CURRENT section animating away
    // Preview container shows TARGET section approaching
    const goingForward = targetSection > currentSection;

    // Ensure main container has CURRENT section content
    if (currentSection !== lastSectionIndex) {
      setTextContent(currentSection);
    }

    // Set preview to TARGET section content
    const targetData = SECTIONS[targetSection];
    if (targetData) {
      if (targetData.titleImage && targetSection === 0) {
        previewTitleEl.innerHTML = `<img src="${targetData.titleImage}" alt="${targetData.title}" class="title-image">`;
      } else {
        previewTitleEl.textContent = targetData.title;
      }
      previewSubtitleEl.textContent = targetData.subtitle;

      previewContainer.classList.remove('preview-intro', 'preview-logline', 'preview-trailer', 'preview-characters', 'preview-story', 'preview-comps', 'preview-target-market', 'preview-crew', 'preview-completion', 'preview-budget', 'preview-schedule', 'preview-outro');
      if (targetSection === 0) {
        previewContainer.classList.add('preview-intro');
        // Ensure main container will be revealed when we land on intro
        textContainer.classList.add('revealed');
      }
      else if (targetSection === 1) previewContainer.classList.add('preview-logline');
      else if (targetSection === 2 || SECTIONS[targetSection]?.trailerLayout) previewContainer.classList.add('preview-trailer');
      else if (targetSection === 3) previewContainer.classList.add('preview-characters');
      else if (targetSection === 4) previewContainer.classList.add('preview-story');
      else if (SECTIONS[targetSection]?.compsLayout) previewContainer.classList.add('preview-comps');
      else if (SECTIONS[targetSection]?.targetMarketLayout) previewContainer.classList.add('preview-target-market');
      else if (SECTIONS[targetSection]?.crewLayout) previewContainer.classList.add('preview-crew');
      else if (SECTIONS[targetSection]?.completionLayout) previewContainer.classList.add('preview-completion');
      else if (SECTIONS[targetSection]?.budgetLayout) previewContainer.classList.add('preview-budget');
      else if (SECTIONS[targetSection]?.scheduleLayout) previewContainer.classList.add('preview-schedule');
      else if (targetSection === SECTIONS.length - 1) previewContainer.classList.add('preview-outro');
    }

    if (goingForward) {
      // FORWARD TRANSITION:
      // Current section flies TOWARD camera (REST_Z → DEPART_Z), gets bigger, fades out fast
      textZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
      textOpacity = Math.max(0, 1 - transitionProgress * 2); // Fade out twice as fast
      textScale = 1 + transitionProgress * 0.5; // Gets bigger as it approaches

      // Target section approaches FROM BEHIND (APPROACH_Z → REST_Z), fades in, slides up
      previewZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
      previewOpacity = transitionProgress;
      previewScale = 0.7 + transitionProgress * 0.3; // Starts smaller, grows to normal
      previewY = 30 * (1 - transitionProgress); // Slides up from 30px to 0
    } else {
      // BACKWARD TRANSITION:
      // Current section zooms OUT/away (REST_Z → APPROACH_Z), gets smaller, fades out
      textZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
      textOpacity = 1 - transitionProgress;
      textScale = 1 - transitionProgress * 0.3; // Gets smaller as it moves away

      // Target section comes back FROM IN FRONT (DEPART_Z → REST_Z), starts large, shrinks to normal, slides down
      previewZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
      previewOpacity = transitionProgress;
      previewScale = 1.5 - transitionProgress * 0.5; // Starts large (1.5), shrinks to normal (1.0)
      previewY = -30 * (1 - transitionProgress); // Slides down from -30px to 0 (coming from above)
    }

  } else {
    // AT REST: Only current section visible, with scroll anticipation effects
    if (currentSection !== lastSectionIndex) {
      setTextContent(currentSection);
    }

    if (scrollAnticipation < 0) {
      // FORWARD ANTICIPATION: content moves toward camera (Z increases, gets bigger)
      textZ = REST_Z + Math.abs(scrollAnticipation) * 200;
      textOpacity = 1 - Math.abs(scrollAnticipation) * 0.5;
      textScale = 1 + Math.abs(scrollAnticipation) * 0.2;
    } else if (scrollAnticipation > 0) {
      // BACKWARD ANTICIPATION: content moves away (Z decreases, gets smaller)
      textZ = REST_Z - scrollAnticipation * 400;
      textOpacity = 1 - scrollAnticipation * 0.6;
      textScale = 1 - scrollAnticipation * 0.3;

      // Show preview of previous section coming back
      if (currentSection > 0) {
        const prevSection = SECTIONS[currentSection - 1];
        if (prevSection) {
          if (prevSection.titleImage && currentSection - 1 === 0) {
            previewTitleEl.innerHTML = `<img src="${prevSection.titleImage}" alt="${prevSection.title}" class="title-image">`;
          } else {
            previewTitleEl.textContent = prevSection.title;
          }
          previewSubtitleEl.textContent = prevSection.subtitle;

          previewContainer.classList.remove('preview-intro', 'preview-logline', 'preview-trailer', 'preview-characters', 'preview-story', 'preview-comps', 'preview-target-market', 'preview-crew', 'preview-completion', 'preview-budget', 'preview-schedule', 'preview-outro');
          if (currentSection - 1 === 0) {
            previewContainer.classList.add('preview-intro');
            // Ensure main container will be revealed when we land on intro
            textContainer.classList.add('revealed');
          }
          else if (currentSection - 1 === 1) previewContainer.classList.add('preview-logline');
          else if (currentSection - 1 === 2 || SECTIONS[currentSection - 1]?.trailerLayout) previewContainer.classList.add('preview-trailer');
          else if (currentSection - 1 === 3) previewContainer.classList.add('preview-characters');
          else if (currentSection - 1 === 4) previewContainer.classList.add('preview-story');
          else if (SECTIONS[currentSection - 1]?.compsLayout) previewContainer.classList.add('preview-comps');
          else if (SECTIONS[currentSection - 1]?.targetMarketLayout) previewContainer.classList.add('preview-target-market');
          else if (SECTIONS[currentSection - 1]?.crewLayout) previewContainer.classList.add('preview-crew');
          else if (SECTIONS[currentSection - 1]?.completionLayout) previewContainer.classList.add('preview-completion');
          else if (SECTIONS[currentSection - 1]?.budgetLayout) previewContainer.classList.add('preview-budget');
          else if (SECTIONS[currentSection - 1]?.scheduleLayout) previewContainer.classList.add('preview-schedule');
          else if (currentSection - 1 === SECTIONS.length - 1) previewContainer.classList.add('preview-outro');

          // Preview comes from DEPART_Z back toward REST_Z
          previewZ = DEPART_Z - scrollAnticipation * (DEPART_Z - REST_Z);
          previewOpacity = scrollAnticipation;
          previewScale = 1.5 - scrollAnticipation * 0.5;
        }
      }
    }

    textZ += elasticOffset * 500;
  }

  // Apply text transform with parallax (skip if story video is playing)
  if (!isStoryVideoActive) {
    if (currentSection === 0 && textContainer.classList.contains('intro') && !isTransitioning) {
      // Intro section: only show if revealed
      if (textContainer.classList.contains('revealed')) {
        textContainer.style.opacity = textOpacity;
      }
    } else {
      textContainer.style.opacity = textOpacity;
    }
  }

  // Show scroll hint only on intro section (and when revealed)
  if (scrollHintEl) {
    const showHint = currentSection === 0 && !isTransitioning && textContainer.classList.contains('revealed');
    if (showHint) {
      scrollHintEl.classList.add('visible');
    } else {
      scrollHintEl.classList.remove('visible');
    }
  }

  textContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${textZ}px) rotate(${leanAngle}deg) scale(${textScale})`;
  textContainer.style.pointerEvents = textOpacity > 0.5 ? 'auto' : 'none';

  // Apply preview transform (includes slide-up/down effect via previewY)
  previewContainer.style.opacity = previewOpacity;
  previewContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY + previewY}px)) translateZ(${previewZ}px) rotate(${leanAngle}deg) scale(${previewScale})`;

  // Update images - same fly-through logic as text
  const goingForward = targetSection > currentSection;

  imageElements.forEach((img) => {
    const imgSection = parseInt(img.dataset.section);
    const baseX = parseFloat(img.dataset.baseX);
    const baseY = parseFloat(img.dataset.baseY);
    const baseRotateY = parseFloat(img.dataset.rotateY) || 0;
    const baseScale = parseFloat(img.dataset.scale) || 1;

    let imgZ = REST_Z;
    let imgOpacity = 0;
    let imgScale = baseScale;

    if (isTransitioning) {
      if (imgSection === currentSection) {
        // Current section's images animate away
        if (goingForward) {
          // FORWARD: fly toward camera (REST_Z → DEPART_Z), get bigger, fade out fast
          imgZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
          imgScale = baseScale * (1 + transitionProgress * 0.5);
          imgOpacity = Math.max(0, 1 - transitionProgress * 2); // Fade out twice as fast
        } else {
          // BACKWARD: zoom out/away (REST_Z → APPROACH_Z), get smaller
          imgZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
          imgScale = baseScale * (1 - transitionProgress * 0.3);
          imgOpacity = 1 - transitionProgress;
        }
      } else if (imgSection === targetSection) {
        // Target section's images approach
        if (goingForward) {
          // FORWARD: approach from behind (APPROACH_Z → REST_Z), grow to normal
          imgZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
          imgScale = baseScale * (0.7 + transitionProgress * 0.3);
        } else {
          // BACKWARD: come back from in front (DEPART_Z → REST_Z), shrink to normal
          imgZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
          imgScale = baseScale * (1.5 - transitionProgress * 0.5);
        }
        imgOpacity = transitionProgress;
      }
    } else {
      // At rest
      if (imgSection === currentSection) {
        imgZ = REST_Z + elasticOffset * 500;
        imgOpacity = 1;

        // Apply scroll anticipation to images too
        if (scrollAnticipation < 0) {
          // FORWARD: move toward camera, get bigger
          imgZ = REST_Z + Math.abs(scrollAnticipation) * 200;
          imgScale = baseScale * (1 + Math.abs(scrollAnticipation) * 0.2);
          imgOpacity = 1 - Math.abs(scrollAnticipation) * 0.5;
        } else if (scrollAnticipation > 0) {
          // BACKWARD: move away, get smaller
          imgZ = REST_Z - scrollAnticipation * 400;
          imgScale = baseScale * (1 - scrollAnticipation * 0.3);
          imgOpacity = 1 - scrollAnticipation * 0.6;
        }
      }
    }

    // Apply parallax (negative mouse.y so content follows mouse direction)
    // Disable parallax for playable videos so they're easier to click
    const isPlayable = img.dataset.playable === 'true';
    const imgOffsetX = isPlayable ? baseX * 3 : baseX * 3 + mouse.x * 6;
    const imgOffsetY = isPlayable ? baseY * 3 : baseY * 3 - mouse.y * 5;
    const imgLean = isPlayable ? 0 : leanAngle;

    img.style.transform = `translate(calc(-50% + ${imgOffsetX}px), calc(-50% + ${imgOffsetY}px)) translateZ(${imgZ}px) rotateY(${baseRotateY}deg) rotate(${imgLean}deg) scale(${imgScale})`;
    img.style.opacity = Math.max(0, Math.min(1, imgOpacity));

    // Disable pointer-events when not visible (prevents blocking other sections)
    if (isPlayable) {
      const isVisible = imgOpacity > 0.5;
      img.style.pointerEvents = isVisible ? 'auto' : 'none';
      // Also disable password overlay pointer-events to prevent it blocking other sections
      const pwOverlay = img.querySelector('.liftoff-password-overlay');
      if (pwOverlay) {
        pwOverlay.style.pointerEvents = isVisible ? '' : 'none';
      }
    }

    // Handle videos
    if (img.dataset.hasVideo === 'true') {
      const video = img.querySelector('video');

      // Playable videos: pause when leaving section
      if (img.dataset.playable === 'true') {
        if (imgSection !== currentSection || isTransitioning) {
          if (!video.paused) {
            video.pause();
            video.currentTime = 0;
            img.classList.remove('playing');
          }
        }
      } else if (img.dataset.autoplayVideo === 'true') {
        // Autoplay looping videos: play when in section or approaching during transition
        const shouldPlay = (imgSection === currentSection && !isTransitioning) ||
                          (isTransitioning && imgSection === targetSection);
        if (shouldPlay) {
          if (video.paused) {
            video.play().catch(() => {}); // Ignore autoplay errors
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      } else {
        // Scrub videos: stay at start when at rest
        if (imgSection === currentSection && !isTransitioning) {
          if (video && video.duration && !isNaN(video.duration)) {
            video.currentTime = 0;
          }
        }
      }
    }
  });

  // Update character portraits - same fly-through logic
  // First slot position (where all characters move to in bio mode)
  const FIRST_SLOT_X = -105;
  const FIRST_SLOT_Y = -12;

  characterElements.forEach(({ portrait, name }) => {
    const charSection = parseInt(portrait.dataset.section);
    const charIndex = parseInt(portrait.dataset.charIndex);
    const baseX = parseFloat(portrait.dataset.baseX);
    const baseY = parseFloat(portrait.dataset.baseY);
    const nameBaseY = parseFloat(name.dataset.baseY);

    let charZ = REST_Z;
    let charOpacity = 0;
    let charScale = 1;
    let nameOpacity = 0; // Separate opacity for name (hidden in bio mode)

    // Target position - normally base position, but first slot when in bio mode
    let targetX = baseX;
    let targetY = baseY;
    let targetNameY = nameBaseY;

    // In bio mode, all characters move to first slot position
    if (characterBioMode && charSection === currentSection) {
      targetX = FIRST_SLOT_X;
      targetY = FIRST_SLOT_Y;
      targetNameY = FIRST_SLOT_Y + 40; // Name below portrait

      // Only selected character is visible, name hidden (shown in title)
      if (charIndex === selectedCharacterIndex) {
        charOpacity = 1;
        charScale = 1;
        charZ = REST_Z;
        nameOpacity = 0; // Name hidden in bio mode - shown in title instead
      } else {
        charOpacity = 0;
        charScale = 0.8;
        nameOpacity = 0;
      }
    } else if (isTransitioning) {
      // Close bio when transitioning away from characters section
      if (characterBioMode && charSection === currentSection) {
        closeCharacterBio();
      }

      if (charSection === currentSection) {
        // Current section's characters animate away
        if (goingForward) {
          charZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
          charScale = 1 + transitionProgress * 0.5;
          charOpacity = Math.max(0, 1 - transitionProgress * 2); // Fade out twice as fast
        } else {
          charZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
          charScale = 1 - transitionProgress * 0.3;
          charOpacity = 1 - transitionProgress;
        }
        nameOpacity = charOpacity;
      } else if (charSection === targetSection) {
        // Target section's characters approach
        if (goingForward) {
          charZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
          charScale = 0.7 + transitionProgress * 0.3;
        } else {
          charZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
          charScale = 1.5 - transitionProgress * 0.5;
        }
        charOpacity = transitionProgress;
        nameOpacity = charOpacity;
      }
    } else {
      // At rest
      if (charSection === currentSection) {
        charZ = REST_Z + elasticOffset * 500;
        charOpacity = 1;
        nameOpacity = 1;

        // Apply scroll anticipation
        if (scrollAnticipation < 0) {
          charZ = REST_Z + Math.abs(scrollAnticipation) * 200;
          charScale = 1 + Math.abs(scrollAnticipation) * 0.2;
          charOpacity = 1 - Math.abs(scrollAnticipation) * 0.5;
          nameOpacity = charOpacity;
        } else if (scrollAnticipation > 0) {
          charZ = REST_Z - scrollAnticipation * 400;
          charScale = 1 - scrollAnticipation * 0.3;
          charOpacity = 1 - scrollAnticipation * 0.6;
          nameOpacity = charOpacity;
        }
      }
    }

    // Initialize animation state if needed
    if (!characterAnimState[charIndex]) {
      characterAnimState[charIndex] = {
        x: targetX,
        y: targetY,
        nameY: targetNameY,
        opacity: charOpacity,
        nameOpacity: nameOpacity
      };
    }

    // Lerp animation state toward target
    const state = characterAnimState[charIndex];
    state.x += (targetX - state.x) * CHAR_LERP_SPEED;
    state.y += (targetY - state.y) * CHAR_LERP_SPEED;
    state.nameY += (targetNameY - state.nameY) * CHAR_LERP_SPEED;
    state.opacity += (charOpacity - state.opacity) * CHAR_LERP_SPEED;
    state.nameOpacity += (nameOpacity - state.nameOpacity) * CHAR_LERP_SPEED;

    // Apply parallax using lerped positions
    const charOffsetX = state.x * 3 + mouse.x * 6;
    const charOffsetY = state.y * 3 - mouse.y * 5;
    const nameOffsetX = state.x * 3 + mouse.x * 6;
    const nameOffsetY = state.nameY * 3 - mouse.y * 5;

    portrait.style.transform = `translate(calc(-50% + ${charOffsetX}px), calc(-50% + ${charOffsetY}px)) translateZ(${charZ}px) scale(${charScale})`;
    portrait.style.opacity = Math.max(0, Math.min(1, state.opacity));
    portrait.style.pointerEvents = (charSection === currentSection && state.opacity > 0.5) ? 'auto' : 'none';

    name.style.transform = `translate(calc(-50% + ${nameOffsetX}px), calc(-50% + ${nameOffsetY}px)) translateZ(${charZ}px) scale(${charScale})`;
    name.style.opacity = Math.max(0, Math.min(1, state.nameOpacity));

    // Update blur backdrop with full transform including dynamic Z (for proper backdrop-filter during transitions)
    const backdrop = characterBackdrops[charIndex];
    if (backdrop) {
      backdrop.style.transform = `translate(calc(-50% + ${charOffsetX}px), calc(-50% + ${charOffsetY}px)) translateZ(${charZ}px) scale(${charScale})`;
      backdrop.style.opacity = Math.max(0, Math.min(1, state.opacity));
    }
  });

  // Update bio container position (follows character position with parallax)
  if (bioContainer) {
    const bioOffsetX = FIRST_SLOT_X * 3 + mouse.x * 6;
    const bioOffsetY = FIRST_SLOT_Y * 3 - mouse.y * 5;
    // Position bio to the right of the character portrait
    bioContainer.style.transform = `translate(calc(-50% + ${bioOffsetX + 390}px), calc(-50% + ${bioOffsetY}px)) translateZ(${REST_Z}px)`;
  }

  // Update Meet Cast button position (below character portrait)
  if (meetCastButton) {
    const btnOffsetX = FIRST_SLOT_X * 3 + mouse.x * 6;
    const btnOffsetY = FIRST_SLOT_Y * 3 - mouse.y * 5;
    // Position button below the character portrait (portrait is ~207px, offset by ~140px from center)
    meetCastButton.style.transform = `translate(calc(-50% + ${btnOffsetX}px), calc(-50% + ${btnOffsetY + 165}px)) translateZ(${REST_Z}px)`;
  }

  // Update Story Play Button for Story section (section index 4)
  if (storyPlayButton && !isStoryVideoActive) {
    const storySection = 4; // Story section
    let btnZ = REST_Z;
    let btnOpacity = 0;
    let btnScale = 1;

    if (isTransitioning) {
      if (storySection === currentSection) {
        // Current section's button animates away
        if (goingForward) {
          btnZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
          btnScale = 1 + transitionProgress * 0.5;
          btnOpacity = Math.max(0, 1 - transitionProgress * 2);
        } else {
          btnZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
          btnScale = 1 - transitionProgress * 0.3;
          btnOpacity = 1 - transitionProgress;
        }
      } else if (storySection === targetSection) {
        // Button approaches with target section
        if (goingForward) {
          btnZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
          btnScale = 0.7 + transitionProgress * 0.3;
        } else {
          btnZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
          btnScale = 1.5 - transitionProgress * 0.5;
        }
        btnOpacity = transitionProgress;
      }
    } else {
      // At rest
      if (storySection === currentSection) {
        btnZ = REST_Z + elasticOffset * 500;
        btnOpacity = 1;

        // Apply scroll anticipation
        if (scrollAnticipation < 0) {
          btnZ = REST_Z + Math.abs(scrollAnticipation) * 200;
          btnScale = 1 + Math.abs(scrollAnticipation) * 0.2;
          btnOpacity = 1 - Math.abs(scrollAnticipation) * 0.5;
        } else if (scrollAnticipation > 0) {
          btnZ = REST_Z - scrollAnticipation * 400;
          btnScale = 1 - scrollAnticipation * 0.3;
          btnOpacity = 1 - scrollAnticipation * 0.6;
        }
      }
    }

    // Position preview centered (no parallax offset since it's fullscreen)
    storyPlayButton.style.transform = `translate(-50%, -50%) translateZ(${btnZ}px) scale(${btnScale})`;
    storyPlayButton.style.opacity = Math.max(0, Math.min(1, btnOpacity));
    storyPlayButton.style.pointerEvents = (storySection === currentSection && !isTransitioning && btnOpacity > 0.5) ? 'auto' : 'none';
  }

  // Update chapter modules
  CompsChapter.update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation);
  TargetMarketChapter.update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation);
  CrewChapter.update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation);
  CompletionChapter.update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation);
  BudgetChapter.update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation);
  ScheduleChapter.update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation);
}

// Reveal intro animation (called after preloader hides)
function reveal() {
  if (!textContainer) return;
  textContainer.offsetHeight; // Force reflow
  requestAnimationFrame(() => {
    textContainer.classList.add('revealed');
  });
}

// Jump to section - delegates to scroll module
function jumpToSection(sectionIndex) {
  if (sectionIndex < 0 || sectionIndex >= SECTIONS.length) return;
  Scroll.jumpToSection(sectionIndex);
}

// Cleanup
function destroy() {
  document.removeEventListener('click', onDocumentClick);
  window.removeEventListener('wheel', onWheelCloseBio, { capture: true });
  CompsChapter.destroy();
  TargetMarketChapter.destroy();
  CrewChapter.destroy();
  CompletionChapter.destroy();
  BudgetChapter.destroy();
  ScheduleChapter.destroy();
  if (viewport) viewport.remove();
  if (scrollSpacer) scrollSpacer.remove();
  if (contactBtn) contactBtn.remove();
  if (copyrightEl) copyrightEl.remove();
  if (scrollHintEl) scrollHintEl.remove();
  if (storyVideoContainer) storyVideoContainer.remove();
  viewport = null;
  textContainer = null;
  previewContainer = null;
  previewTitleEl = null;
  previewSubtitleEl = null;
  imageWorld = null;
  scrollSpacer = null;
  titleEl = null;
  subtitleEl = null;
  contactBtn = null;
  copyrightEl = null;
  scrollHintEl = null;
  bioContainer = null;
  bioTextEl = null;
  meetCastButton = null;
  // Story video cleanup
  storyVideoContainer = null;
  storyVideo = null;
  storyCloseButton = null;
  storyPlayButton = null;
  isStoryVideoActive = false;
  selectedCharacterIndex = -1;
  characterBioMode = false;
  showingCastBio = false;
  imageElements.length = 0;
  characterElements.length = 0;
  characterBackdrops.forEach(backdrop => backdrop.remove());
  characterBackdrops.length = 0;
  characterAnimState.length = 0;
  lastSectionIndex = -1;
}

export { init, update, reveal, jumpToSection, destroy };

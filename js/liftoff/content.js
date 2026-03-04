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
      { x: -180, y: 0, width: 1000, height: 1000, scale: 0.625, label: 'Logline', delay: 0, rotateY: 0, image: 'https://triglass-assets.s3.amazonaws.com/logline.png' },
    ]
  },
  {
    title: 'TRAILER',
    subtitle: '',
    trailerLayout: true,
    images: [
      { x: 0, y: 0, width: 1280, height: 720, scale: 0.49, label: 'Trailer', delay: 0, rotateY: 0, video: 'https://triglass-assets.s3.amazonaws.com/FakeTrailer_01-hd.mp4', playable: true },
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
        x: -85,
        y: -12,
        image: 'https://triglass-assets.s3.amazonaws.com/selena-2.jpg',
        bio: "Selena (12) is a resourceful, intelligent natural leader. She's independent, stubborn, and emotionally ahead of her years. Growing up without a mother and with a father stretched beyond his limits, Selena has quietly become the emotional backbone of her family, acting as both protector and second parent to her younger brother.",
      },
      {
        name: 'Leo',
        x: 0,
        y: -12,
        image: 'https://triglass-assets.s3.amazonaws.com/leo-2.jpg',
        bio: "Leo (8) is imaginative, sensitive, and deeply connected to the magical world his mother created for him. He struggles to process grief and instead retreats into fantasy, where he can still feel close to her. His innocence and wonder make him the heart of the story.",
      },
      {
        name: 'Dad',
        x: 85,
        y: -12,
        image: 'https://triglass-assets.s3.amazonaws.com/dad-2.jpg',
        bio: "Dad (40s) is a grieving father drowning in responsibility. Once warm and present, he's now emotionally distant, working overtime to keep the family afloat while struggling with his own unprocessed loss. His journey is learning to be present again before it's too late.",
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
    subtitle: 'Films like E.T., Jumanji, Bridge to Terabithia, and Sketch succeed because they tap into a universal childhood truth: when children face experiences too big to understand—loss, fear, isolation, change—imagination becomes their survival tool.',
    compsLayout: true,
    images: []
  },
  {
    title: 'TARGET MARKET',
    subtitle: 'The film is designed to reach three distinct audiences, with a shared overlap that allows us to engage all three at once and maximize both reach and long-term value.',
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
    subtitle: '2026',
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
const imageElements = [];
const characterElements = [];

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

// Character animation state (for smooth lerping)
const characterAnimState = []; // {x, y, opacity, nameOpacity} for each character
const CHAR_LERP_SPEED = 0.15; // How fast characters animate (0-1, higher = faster)

// Earth element for Story section
let earthElement = null;

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
}

// Close character bio
function closeCharacterBio() {
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
}

// Click-outside handler to close bio
function onDocumentClick(e) {
  if (!characterBioMode) return;

  // Check if click was on a character portrait
  const clickedChar = e.target.closest('.liftoff-character');
  if (clickedChar) return; // Let the character click handler deal with it

  // Check if click was on the bio itself
  if (e.target.closest('.liftoff-bio')) return;

  // Otherwise close the bio
  closeCharacterBio();
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
    }
    .liftoff-text h1 {
      font-family: montserrat, sans-serif;
      font-size: clamp(32px, 6vw, 64px);
      font-weight: 700;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      color: #d4d4d4;
      line-height: 1.1;
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
    /* Intro subtitle - moved up over PNG whitespace */
    .liftoff-text.intro p {
      position: relative;
      top: clamp(-243px, calc(-40vw + 57px), -123px);
    }
    .liftoff-text p {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(12px, 1.5vw, 16px);
      font-weight: 300;
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
      font-size: clamp(12px, 2.5vw, 24px);
      letter-spacing: 0.15em;
    }

    /* Logline section */
    .liftoff-text.logline h1 {
      font-size: clamp(32px, 6vw, 64px);
    }
    .liftoff-text.logline p {
      font-size: clamp(10px, 1vw, 13px);
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Trailer section - large title positioned above video */
    .liftoff-text.trailer {
      top: 28%;
    }
    .liftoff-text.trailer h1 {
      font-size: clamp(36px, 6vw, 72px);
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
    }
    .liftoff-preview h1 {
      font-family: montserrat, sans-serif;
      font-size: clamp(32px, 6vw, 64px);
      font-weight: 700;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      color: #d4d4d4;
      line-height: 1.1;
    }
    .liftoff-preview p {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(12px, 1.5vw, 16px);
      font-weight: 300;
      line-height: 1.6;
      color: rgba(255,255,255,0.7);
      margin: 0;
      letter-spacing: 0.02em;
    }
    /* Preview logline styling - matches main logline */
    .liftoff-preview.preview-logline h1 {
      font-size: clamp(32px, 6vw, 64px);
    }
    .liftoff-preview.preview-logline p {
      font-size: clamp(10px, 1vw, 13px);
      max-width: 800px;
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
      position: relative;
      top: clamp(-243px, calc(-40vw + 57px), -123px);
      font-size: clamp(14px, 2vw, 20px);
    }
    .liftoff-preview.preview-trailer {
      top: 28%;
    }
    .liftoff-preview.preview-trailer h1 {
      font-size: clamp(36px, 6vw, 72px);
    }
    .liftoff-preview.preview-characters {
      top: calc(36% - 50px);
    }
    .liftoff-preview.preview-characters h1 {
      font-size: clamp(32px, 6vw, 64px);
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
      font-size: clamp(36px, 6vw, 60px);
    }
    .liftoff-preview.preview-story p {
      font-size: clamp(10px, 1.2vw, 14px);
    }
    .liftoff-preview.preview-target-market {
      top: calc(28% - 50px);
      max-width: none;
      width: 100vw;
    }
    .liftoff-preview.preview-target-market h1 {
      font-size: clamp(32px, 5vw, 56px);
    }
    .liftoff-preview.preview-target-market p {
      position: absolute;
      top: 550px;
      left: 50%;
      transform: translateX(-50%);
      font-size: clamp(11px, 1.3vw, 15px);
      max-width: 900px;
      width: 90vw;
      padding: 0 20px;
      text-align: center;
      line-height: 1.6;
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
      border: 2px solid rgba(255,255,255,0.2);
      cursor: pointer;
      pointer-events: none; /* Controlled via JavaScript */
      transition: none !important;
    }
    /* Backdrop circle behind portrait */
    .liftoff-character::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 276px;
      height: 276px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 60%, transparent 70%);
      pointer-events: none;
      z-index: -1;
    }
    .liftoff-character img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    .liftoff-character:hover {
      box-shadow: 0 12px 48px rgba(0,0,0,0.6), 0 0 30px rgba(254, 208, 3, 0.3);
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
      width: 320px;
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
      font-weight: 300;
      color: rgba(255,255,255,0.9);
      line-height: 1.7;
      text-align: left;
      margin: 0;
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
      top: calc(36% - 50px);
    }
    .liftoff-text.characters h1 {
      font-size: clamp(32px, 6vw, 64px);
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
      font-size: clamp(36px, 6vw, 60px);
    }
    .liftoff-text.story p {
      font-size: clamp(10px, 1.2vw, 14px);
    }

    /* Earth image for Story section */
    .liftoff-earth {
      position: absolute;
      width: 600px;
      height: 600px;
      backface-visibility: hidden;
      pointer-events: none;
    }
    .liftoff-earth img {
      width: 100%;
      height: 100%;
      object-fit: contain;
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
      mask-image: radial-gradient(ellipse 70% 70% at center, black 20%, transparent 65%);
      -webkit-mask-image: radial-gradient(ellipse 70% 70% at center, black 20%, transparent 65%);
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
    }
    .liftoff-image.playable-video {
      cursor: pointer;
      pointer-events: auto;
      overflow: visible;
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
    .liftoff-image.playable-video:hover .liftoff-play-button {
      opacity: 1;
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
      transition: background 0.2s ease-out, border-color 0.2s ease-out;
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
      font-weight: 300;
      letter-spacing: 0.05em;
      color: rgba(255,255,255,0.4);
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
        video.loop = false;

        // Check if this is a playable video (like trailer) vs scrub video
        if (imgConfig.playable) {
          img.classList.add('playable-video');
          video.muted = false;
          video.controls = false;

          // Add play button overlay
          const playBtn = document.createElement('div');
          playBtn.className = 'liftoff-play-button';
          playBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
          img.appendChild(playBtn);

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

          // Click to play/pause
          img.addEventListener('click', () => {
            if (video.paused) {
              video.play();
              img.classList.add('playing');
            } else {
              video.pause();
              img.classList.remove('playing');
            }
          });

          // Reset when video ends
          video.addEventListener('ended', () => {
            img.classList.remove('playing');
            video.currentTime = 0;
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
        // Character portrait container
        const charEl = document.createElement('div');
        charEl.className = 'liftoff-character';
        charEl.innerHTML = `<img src="${charConfig.image}" alt="${charConfig.name}">`;

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
    }

    // Create Earth element for Story section
    if (sectionData.storyLayout) {
      earthElement = document.createElement('div');
      earthElement.className = 'liftoff-earth';
      earthElement.innerHTML = `<img src="https://triglass-assets.s3.amazonaws.com/earth-1.png" alt="Earth">`;
      earthElement.dataset.section = sectionIndex;
      earthElement.style.opacity = 0;
      imageWorld.appendChild(earthElement);
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

  // Click-outside handler for closing character bios
  document.addEventListener('click', onDocumentClick);

  // Initialize chapter modules
  CompsChapter.init(imageWorld, SECTIONS);
  TargetMarketChapter.init(imageWorld, SECTIONS);
  CrewChapter.init(imageWorld, SECTIONS);
  CompletionChapter.init(imageWorld, SECTIONS);
  BudgetChapter.init(imageWorld, SECTIONS);
  ScheduleChapter.init(imageWorld, SECTIONS);

  // Set initial text for intro
  setTextContent(0);

  console.log('[LIFTOFF] Content initialized with', SECTIONS.length, 'sections,', imageElements.length, 'images');
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
  } else if (sectionIndex === 2) {
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

      previewContainer.classList.remove('preview-intro', 'preview-logline', 'preview-trailer', 'preview-characters', 'preview-story', 'preview-comps', 'preview-target-market', 'preview-crew', 'preview-completion', 'preview-budget', 'preview-schedule');
      if (targetSection === 0) {
        previewContainer.classList.add('preview-intro');
        // Ensure main container will be revealed when we land on intro
        textContainer.classList.add('revealed');
      }
      else if (targetSection === 1) previewContainer.classList.add('preview-logline');
      else if (targetSection === 2) previewContainer.classList.add('preview-trailer');
      else if (targetSection === 3) previewContainer.classList.add('preview-characters');
      else if (targetSection === 4) previewContainer.classList.add('preview-story');
      else if (SECTIONS[targetSection]?.compsLayout) previewContainer.classList.add('preview-comps');
      else if (SECTIONS[targetSection]?.targetMarketLayout) previewContainer.classList.add('preview-target-market');
      else if (SECTIONS[targetSection]?.crewLayout) previewContainer.classList.add('preview-crew');
      else if (SECTIONS[targetSection]?.completionLayout) previewContainer.classList.add('preview-completion');
      else if (SECTIONS[targetSection]?.budgetLayout) previewContainer.classList.add('preview-budget');
      else if (SECTIONS[targetSection]?.scheduleLayout) previewContainer.classList.add('preview-schedule');
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

          previewContainer.classList.remove('preview-intro', 'preview-logline', 'preview-trailer', 'preview-characters', 'preview-story', 'preview-comps', 'preview-target-market', 'preview-crew', 'preview-completion', 'preview-budget', 'preview-schedule');
          if (currentSection - 1 === 0) {
            previewContainer.classList.add('preview-intro');
            // Ensure main container will be revealed when we land on intro
            textContainer.classList.add('revealed');
          }
          else if (currentSection - 1 === 1) previewContainer.classList.add('preview-logline');
          else if (currentSection - 1 === 2) previewContainer.classList.add('preview-trailer');
          else if (currentSection - 1 === 3) previewContainer.classList.add('preview-characters');
          else if (currentSection - 1 === 4) previewContainer.classList.add('preview-story');
          else if (SECTIONS[currentSection - 1]?.compsLayout) previewContainer.classList.add('preview-comps');
          else if (SECTIONS[currentSection - 1]?.targetMarketLayout) previewContainer.classList.add('preview-target-market');
          else if (SECTIONS[currentSection - 1]?.crewLayout) previewContainer.classList.add('preview-crew');
          else if (SECTIONS[currentSection - 1]?.completionLayout) previewContainer.classList.add('preview-completion');
          else if (SECTIONS[currentSection - 1]?.budgetLayout) previewContainer.classList.add('preview-budget');
          else if (SECTIONS[currentSection - 1]?.scheduleLayout) previewContainer.classList.add('preview-schedule');

          // Preview comes from DEPART_Z back toward REST_Z
          previewZ = DEPART_Z - scrollAnticipation * (DEPART_Z - REST_Z);
          previewOpacity = scrollAnticipation;
          previewScale = 1.5 - scrollAnticipation * 0.5;
        }
      }
    }

    textZ += elasticOffset * 500;
  }

  // Apply text transform with parallax
  if (currentSection === 0 && textContainer.classList.contains('intro') && !isTransitioning) {
    // Intro section: only show if revealed
    if (textContainer.classList.contains('revealed')) {
      textContainer.style.opacity = textOpacity;
    }
  } else {
    textContainer.style.opacity = textOpacity;
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
      img.style.pointerEvents = imgOpacity > 0.5 ? 'auto' : 'none';
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
  const FIRST_SLOT_X = -85;
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
  });

  // Update bio container position (follows character position with parallax)
  if (bioContainer) {
    const bioOffsetX = FIRST_SLOT_X * 3 + mouse.x * 6;
    const bioOffsetY = FIRST_SLOT_Y * 3 - mouse.y * 5;
    // Position bio to the right of the character portrait
    bioContainer.style.transform = `translate(calc(-50% + ${bioOffsetX + 280}px), calc(-50% + ${bioOffsetY}px)) translateZ(${REST_Z}px)`;
  }

  // Update Earth element for Story section (section index 4)
  if (earthElement) {
    const earthSection = 4; // Story section
    let earthZ = REST_Z;
    let earthOpacity = 0;
    let earthScale = 1;

    if (isTransitioning) {
      if (earthSection === currentSection) {
        // Current section's Earth animates away
        if (goingForward) {
          earthZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
          earthScale = 1 + transitionProgress * 0.5;
          earthOpacity = Math.max(0, 1 - transitionProgress * 2); // Fade out twice as fast
        } else {
          earthZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
          earthScale = 1 - transitionProgress * 0.3;
          earthOpacity = 1 - transitionProgress;
        }
      } else if (earthSection === targetSection) {
        // Earth approaches with target section
        if (goingForward) {
          earthZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
          earthScale = 0.7 + transitionProgress * 0.3;
        } else {
          earthZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
          earthScale = 1.5 - transitionProgress * 0.5;
        }
        earthOpacity = transitionProgress;
      }
    } else {
      // At rest
      if (earthSection === currentSection) {
        earthZ = REST_Z + elasticOffset * 500;
        earthOpacity = 1;

        // Apply scroll anticipation
        if (scrollAnticipation < 0) {
          earthZ = REST_Z + Math.abs(scrollAnticipation) * 200;
          earthScale = 1 + Math.abs(scrollAnticipation) * 0.2;
          earthOpacity = 1 - Math.abs(scrollAnticipation) * 0.5;
        } else if (scrollAnticipation > 0) {
          earthZ = REST_Z - scrollAnticipation * 400;
          earthScale = 1 - scrollAnticipation * 0.3;
          earthOpacity = 1 - scrollAnticipation * 0.6;
        }
      }
    }

    // Position Earth below the text (y offset positive = below center)
    const earthOffsetX = mouse.x * 6;
    const earthOffsetY = 140 - mouse.y * 5; // Below center

    earthElement.style.transform = `translate(calc(-50% + ${earthOffsetX}px), calc(-50% + ${earthOffsetY}px)) translateZ(${earthZ}px) scale(${earthScale})`;
    earthElement.style.opacity = Math.max(0, Math.min(1, earthOpacity));
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
    console.log('[LIFTOFF] Content intro revealed');
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
  bioContainer = null;
  bioTextEl = null;
  earthElement = null;
  selectedCharacterIndex = -1;
  characterBioMode = false;
  imageElements.length = 0;
  characterElements.length = 0;
  characterAnimState.length = 0;
  lastSectionIndex = -1;
}

export { init, update, reveal, jumpToSection, destroy };

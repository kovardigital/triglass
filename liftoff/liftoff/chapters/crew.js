/* ==========================================================================
   Liftoff - CREW Chapter
   Team portraits arranged in pyramid layout with gradient ring glows
   Similar to characters section with clickable bios
   ========================================================================== */

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;

// Portrait sizing
const PORTRAIT_SIZE = 120;

// Crew member data - positions are relative offsets from center (in pixels)
// Layout: Top row of 3, bottom row of 4 - Top row: Ryan, Triglass, Noelle | Bottom row: Rita, Kaleb, David, James
const CREW_DATA = [
  {
    name: 'Ryan Thielen',
    role: 'Director',
    x: -200,
    y: -100,
    image: 'https://triglass-assets.s3.amazonaws.com/ryan.jpg',
    bio: `The world through Ryan Thielen's eyes is big, bold and filled with endless possibility. His work intersects emotional storytelling with imaginative, fantastical worlds.

Ryan is an award-winning filmmaker, earning <strong>35 Regional Emmy Awards</strong>, <strong>8 Telly Awards</strong>, <strong>2 IDEA Awards</strong>, and multiple <strong>Clio Awards</strong>.`,
    reel: 'https://triglass-assets.s3.amazonaws.com/RyanVid.png',
    signature: 'https://triglass-assets.s3.amazonaws.com/signature.png',
  },
  {
    name: 'Noelle Anderson',
    role: 'AD',
    x: 200,
    y: -100,
    image: 'https://triglass-assets.s3.amazonaws.com/noelle.jpg',
    bio: 'Noelle Anderson serves as Assistant Director, coordinating the production with precision and creative insight. She is known for developing and delivering compelling visual and narrative-driven projects across film, television and digital media. With a strong eye for storytelling and production strategy, she specializes in guiding projects from concept through completion, balancing creative vision with executional excellence.',
  },
  {
    name: 'Kaleb Lechowski',
    role: 'Art Director',
    x: -100,
    y: 120,
    image: 'https://triglass-assets.s3.amazonaws.com/kaleb.jpg',
    bio: 'As Art Director, Kaleb Lechowski brings the visual world of Liftoff to life, crafting the film\'s magical aesthetic. Kaleb is best known for his visually striking, cinematic animations that blend science fiction with emotional storytelling. He gained international recognition with his short film R\'ha, which showcased Hollywood-level visual effects created independently and led to opportunities in major film and game productions. His work is characterized by technical precision, atmospheric design, and a focus on immersive, character-driven narratives.',
  },
  {
    name: 'David Vanderwarn',
    role: 'Producer',
    x: 100,
    y: 120,
    image: 'https://triglass-assets.s3.amazonaws.com/david.jpg',
    bio: 'David Vanderwarn has a natural ability to build trust and communicate value. He excels at identifying needs and delivering outcomes that exceed expectations. Known for his reliability, competitive edge, and relationship-focused approach, David is someone clients and teams rely on to move the needle and close the gap between potential and performance.',
  },
  {
    name: 'Rita Thielen',
    role: 'Writer',
    x: -300,
    y: 120,
    image: 'https://triglass-assets.s3.amazonaws.com/rita-1.png',
    bio: 'Rita Thielen is the writer of Liftoff, crafting the emotional story at the heart of the film. With a talent for developing authentic characters and layered narratives, she brings nuance, heart, and clarity to each scene, shaping a story that resonates beyond the screen. Her writing reflects a thoughtful balance of structure and emotion, drawing viewers into a compelling journey that explores human experience with honesty and depth.',
  },
  {
    name: 'James Evenson',
    role: '',
    x: 300,
    y: 120,
    image: 'https://triglass-assets.s3.amazonaws.com/james-1.jpg',
    bio: 'James Evenson is a seasoned entrepreneur, investor, and business strategist who has been building, acquiring and restructuring companies for nearly four decades. Known for solving complex challenges and bringing order to chaos, he combines deep intuition with rigorous analysis to drive success across startups and billion-dollar enterprises worldwide.',
  },
  {
    name: 'Triglass Productions',
    role: 'Production & Post House',
    x: 0,
    y: -100,
    image: 'https://triglass-assets.s3.amazonaws.com/triglass.png',
    isLogo: true,
    bio: `Triglass Productions is an award-winning production and post-production house specializing in bringing imaginative stories to life.

With expertise spanning commercial production, narrative filmmaking, and cutting-edge visual effects, Triglass delivers cinematic quality across all formats.`,
  },
];

// DOM elements
let crewContainer = null;
let imageWorld = null; // Reference to imgWorld for backdrop positioning
let crewElements = [];
let sectionIndex = -1;

// Bio state
let selectedCrewIndex = -1;
let bioContainer = null;
let bioTextEl = null;
let crewBioMode = false;

// Animation state
const crewAnimState = [];
const LERP_SPEED = 0.15;

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('crew-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'crew-chapter-styles';
  style.textContent = `
    /* Crew layout positioning */
    .liftoff-text.crew-layout {
      top: 26%;
    }
    .liftoff-text.crew-layout h1 {
      font-size: clamp(24px, 4.2vw, 46px);
    }
    .liftoff-text.crew-layout p {
      display: none; /* Subtitle hidden - we show role under each name */
    }

    /* Preview crew positioning */
    .liftoff-preview.preview-crew {
      top: 26%;
    }
    .liftoff-preview.preview-crew h1 {
      font-size: clamp(24px, 4.2vw, 46px);
    }
    .liftoff-preview.preview-crew p {
      display: none;
    }

    /* Crew container */
    .crew-container {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
    }

    /* Crew portrait */
    .crew-portrait {
      position: absolute;
      width: ${PORTRAIT_SIZE}px;
      height: ${PORTRAIT_SIZE}px;
      border-radius: 50%;
      overflow: visible;
      backface-visibility: hidden;
      cursor: pointer;
      pointer-events: none;
      transition: none !important;
    }

    /* Blur backdrop circle - separate element for proper backdrop-filter */
    .crew-blur-backdrop {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      pointer-events: none;
      overflow: hidden;
      transition: box-shadow 0.2s ease-out;
    }
    .crew-blur-backdrop.portrait-size {
      width: ${PORTRAIT_SIZE + 24}px;
      height: ${PORTRAIT_SIZE + 24}px;
    }
    /* Gradient stroke on backdrop - white top fading to transparent bottom */
    .crew-blur-backdrop::before {
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
    /* Subtle glint animation */
    @keyframes crew-glint {
      0% { left: -60%; opacity: 0; }
      5% { opacity: 1; }
      20% { left: 110%; opacity: 0; }
      100% { left: 110%; opacity: 0; }
    }
    .crew-blur-backdrop::after {
      content: '';
      position: absolute;
      top: 0;
      left: -60%;
      width: 55%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
      transform: skewX(-20deg);
      animation: crew-glint 6s ease-in-out infinite;
      pointer-events: none;
    }
    /* Stagger the glint timing per crew member */
    .crew-blur-backdrop[data-crew-index="7"]::after { animation-delay: 4s; }
    .crew-blur-backdrop[data-crew-index="0"]::after { animation-delay: 0.5s; }
    .crew-blur-backdrop[data-crew-index="1"]::after { animation-delay: 1s; }
    .crew-blur-backdrop[data-crew-index="2"]::after { animation-delay: 1.5s; }
    .crew-blur-backdrop[data-crew-index="3"]::after { animation-delay: 2s; }
    .crew-blur-backdrop[data-crew-index="4"]::after { animation-delay: 2.5s; }
    .crew-blur-backdrop[data-crew-index="5"]::after { animation-delay: 3s; }
    .crew-blur-backdrop[data-crew-index="6"]::after { animation-delay: 3.5s; }

    /* Colored ring glow per crew member on backdrop */
    /* Ryan - Orange */
    .crew-blur-backdrop[data-crew-index="0"] {
      box-shadow: 0 0 30px rgba(255, 150, 50, 0.3),
                  inset 0 0 40px rgba(255, 150, 50, 0.08);
    }
    /* Charles - Pink/Magenta */
    .crew-blur-backdrop[data-crew-index="1"] {
      box-shadow: 0 0 30px rgba(255, 80, 150, 0.3),
                  inset 0 0 40px rgba(255, 80, 150, 0.08);
    }
    /* Noelle - Green */
    .crew-blur-backdrop[data-crew-index="2"] {
      box-shadow: 0 0 30px rgba(80, 220, 120, 0.3),
                  inset 0 0 40px rgba(80, 220, 120, 0.08);
    }
    /* Kaleb - Pink/Magenta */
    .crew-blur-backdrop[data-crew-index="3"] {
      box-shadow: 0 0 30px rgba(255, 80, 150, 0.3),
                  inset 0 0 40px rgba(255, 80, 150, 0.08);
    }
    /* David - Cyan/Teal */
    .crew-blur-backdrop[data-crew-index="4"] {
      box-shadow: 0 0 30px rgba(50, 200, 200, 0.3),
                  inset 0 0 40px rgba(50, 200, 200, 0.08);
    }
    /* Triglass - Purple */
    .crew-blur-backdrop[data-crew-index="7"] {
      box-shadow: 0 0 30px rgba(160, 80, 200, 0.3),
                  inset 0 0 40px rgba(160, 80, 200, 0.08);
    }
    /* Rita - Warm Orange/Gold */
    .crew-blur-backdrop[data-crew-index="5"] {
      box-shadow: 0 0 30px rgba(255, 180, 80, 0.3),
                  inset 0 0 40px rgba(255, 180, 80, 0.08);
    }
    /* James - Blue */
    .crew-blur-backdrop[data-crew-index="6"] {
      box-shadow: 0 0 30px rgba(80, 150, 255, 0.3),
                  inset 0 0 40px rgba(80, 150, 255, 0.08);
    }

    .crew-portrait-inner {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      overflow: visible;
      border: 2px solid rgba(255,255,255,0.2);
      box-shadow: 0 6px 24px rgba(0,0,0,0.4);
      background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
      transition: box-shadow 0.2s ease-out, border-color 0.2s ease-out;
    }
    /* Gradient stroke on portrait - white top fading to transparent bottom */
    .crew-portrait-inner::before {
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

    .crew-portrait img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      position: relative;
      z-index: 1;
    }

    /* Unique glow colors for each crew member - layered glows matching character styling */
    /* Ryan Thielen - Orange */
    .crew-portrait[data-crew-index="0"] .crew-portrait-inner {
      border-color: rgba(255, 150, 50, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(255, 150, 50, 0.45),
                  0 0 50px rgba(255, 150, 50, 0.25);
    }
    .crew-portrait[data-crew-index="0"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5),
                  0 0 35px rgba(255, 150, 50, 0.6),
                  0 0 70px rgba(255, 150, 50, 0.35);
    }
    /* Noelle Anderson - Green */
    .crew-portrait[data-crew-index="1"] .crew-portrait-inner {
      border-color: rgba(80, 220, 120, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(80, 220, 120, 0.45),
                  0 0 50px rgba(80, 220, 120, 0.25);
    }
    .crew-portrait[data-crew-index="1"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5),
                  0 0 35px rgba(80, 220, 120, 0.6),
                  0 0 70px rgba(80, 220, 120, 0.35);
    }
    /* Kaleb Lechowski - Pink/Magenta */
    .crew-portrait[data-crew-index="2"] .crew-portrait-inner {
      border-color: rgba(255, 80, 150, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(255, 80, 150, 0.45),
                  0 0 50px rgba(255, 80, 150, 0.25);
    }
    .crew-portrait[data-crew-index="2"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5),
                  0 0 35px rgba(255, 80, 150, 0.6),
                  0 0 70px rgba(255, 80, 150, 0.35);
    }
    /* David Vanderwarn - Cyan/Teal */
    .crew-portrait[data-crew-index="3"] .crew-portrait-inner {
      border-color: rgba(50, 200, 200, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(50, 200, 200, 0.45),
                  0 0 50px rgba(50, 200, 200, 0.25);
    }
    .crew-portrait[data-crew-index="3"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5),
                  0 0 35px rgba(50, 200, 200, 0.6),
                  0 0 70px rgba(50, 200, 200, 0.35);
    }
    /* Rita Thielen - Warm Orange/Gold */
    .crew-portrait[data-crew-index="4"] .crew-portrait-inner {
      border-color: rgba(255, 180, 80, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(255, 180, 80, 0.45),
                  0 0 50px rgba(255, 180, 80, 0.25);
    }
    .crew-portrait[data-crew-index="4"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5),
                  0 0 35px rgba(255, 180, 80, 0.6),
                  0 0 70px rgba(255, 180, 80, 0.35);
    }
    /* James Evenson - Blue */
    .crew-portrait[data-crew-index="5"] .crew-portrait-inner {
      border-color: rgba(80, 150, 255, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(80, 150, 255, 0.45),
                  0 0 50px rgba(80, 150, 255, 0.25);
    }
    .crew-portrait[data-crew-index="5"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5),
                  0 0 35px rgba(80, 150, 255, 0.6),
                  0 0 70px rgba(80, 150, 255, 0.35);
    }
    /* Triglass - Purple */
    .crew-portrait[data-crew-index="6"] .crew-portrait-inner {
      border-color: rgba(160, 80, 200, 0.5);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4),
                  0 0 25px rgba(160, 80, 200, 0.45),
                  0 0 50px rgba(160, 80, 200, 0.25);
    }
    .crew-portrait[data-crew-index="6"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5),
                  0 0 35px rgba(160, 80, 200, 0.6),
                  0 0 70px rgba(160, 80, 200, 0.35);
    }

    /* Crew name and role labels */
    .crew-label {
      position: absolute;
      top: 50%;
      left: 50%;
      text-align: center;
      white-space: nowrap;
      pointer-events: none;
    }
    .crew-label-name {
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      text-transform: none;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 2px;
    }
    .crew-label-role {
      font-family: 'montserrat', sans-serif;
      font-size: 11px;
      font-weight: 400;
      color: rgba(255,255,255,0.6);
      text-transform: none;
      letter-spacing: 0.5px;
      display: block;
    }

    /* Logo portrait (Triglass) - same size as other portraits */
    .crew-portrait.logo {
      width: ${PORTRAIT_SIZE}px;
      height: ${PORTRAIT_SIZE}px;
      cursor: pointer;
      pointer-events: auto !important;
    }
    .crew-portrait.logo .crew-portrait-inner {
      background: linear-gradient(135deg, #1a1a2a 0%, #0a0a15 100%);
      border-color: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .crew-portrait.logo img {
      width: 70%;
      height: 70%;
      object-fit: contain;
    }

    /* Bio container for crew */
    .crew-bio {
      position: absolute;
      left: 50%;
      top: 0;
      width: 520px;
      max-height: 70vh;
      opacity: 0;
      pointer-events: none;
      backface-visibility: hidden;
      transform-style: preserve-3d;
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .crew-bio.visible {
      opacity: 1;
      pointer-events: auto;
    }

    /* Scrollable content wrapper */
    .crew-bio-scroll {
      max-height: 70vh;
      overflow-y: auto;
      position: relative;
    }
    .crew-bio-content {
      /* No transform - content stays top-aligned */
    }

    .crew-bio-text {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(12px, 1.1vw, 14px);
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      line-height: 1.65;
      text-align: left;
      margin: 0 0 20px 0;
      white-space: pre-line;
    }
    .crew-bio-text strong {
      font-weight: 600;
      color: #fff;
    }

    /* Reel image in bio */
    .crew-bio-reel {
      position: relative;
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 16px;
    }
    .crew-bio-reel img {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 8px;
    }

    /* Signature in bio */
    .crew-bio-signature {
      position: relative;
      width: 180px;
      height: auto;
      opacity: 0.9;
      pointer-events: none;
      margin-top: 20px;
      margin-left: auto;
    }
    .crew-bio-signature img {
      width: 100%;
      height: auto;
    }

    /* Larger portrait when in bio mode */
    .crew-portrait.bio-active {
      width: 180px !important;
      height: 180px !important;
    }

    /* Title changes when showing bio */
    .liftoff-text.crew-layout.bio-active p {
      display: none;
    }
  `;
  document.head.appendChild(style);
}

// Toggle crew bio view
function toggleCrewBio(crewIndex) {
  if (selectedCrewIndex === crewIndex) {
    closeCrewBio();
  } else {
    openCrewBio(crewIndex);
  }
}

// Open crew bio
function openCrewBio(crewIndex) {
  selectedCrewIndex = crewIndex;
  crewBioMode = true;

  const crewData = CREW_DATA[crewIndex];

  // Update title to crew member name
  const titleEl = document.querySelector('.liftoff-text.crew-layout h1');
  if (titleEl) {
    titleEl.textContent = crewData.name.toUpperCase();
  }

  // Update bio text (use innerHTML for rich text support)
  if (bioTextEl && bioContainer) {
    bioTextEl.innerHTML = crewData.bio;

    // Update reel image
    const reelContainer = document.getElementById('crew-bio-reel');
    if (reelContainer) {
      if (crewData.reel) {
        reelContainer.innerHTML = `<img src="${crewData.reel}" alt="Reel">`;
        reelContainer.style.display = 'block';
      } else {
        reelContainer.innerHTML = '';
        reelContainer.style.display = 'none';
      }
    }

    // Update signature
    const signatureContainer = document.getElementById('crew-bio-signature');
    if (signatureContainer) {
      if (crewData.signature) {
        signatureContainer.innerHTML = `<img src="${crewData.signature}" alt="Signature">`;
        signatureContainer.style.display = 'block';
      } else {
        signatureContainer.innerHTML = '';
        signatureContainer.style.display = 'none';
      }
    }

    bioContainer.classList.add('visible');
  }

  // Add bio-active class
  const textContainer = document.querySelector('.liftoff-text.crew-layout');
  if (textContainer) {
    textContainer.classList.add('bio-active');
  }
}

// Close crew bio
function closeCrewBio() {
  selectedCrewIndex = -1;
  crewBioMode = false;

  // Restore original title
  const titleEl = document.querySelector('.liftoff-text.crew-layout h1');
  if (titleEl) {
    titleEl.textContent = 'THE CREW';
  }

  // Hide bio
  if (bioContainer) {
    bioContainer.classList.remove('visible');
  }

  // Remove bio-active class
  const textContainer = document.querySelector('.liftoff-text.crew-layout');
  if (textContainer) {
    textContainer.classList.remove('bio-active');
  }
}

// Document click handler
function onDocumentClick(e) {
  if (!crewBioMode) return;

  const clickedCrew = e.target.closest('.crew-portrait');
  if (clickedCrew) return;

  if (e.target.closest('.crew-bio')) return;

  closeCrewBio();
}


// Initialize chapter DOM elements
export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.crewLayout);
  if (sectionIndex < 0) {
    console.warn('[CREW] Could not find CREW section');
    return;
  }

  // Store reference to imgWorld for backdrop positioning
  imageWorld = imgWorld;

  // Create container
  crewContainer = document.createElement('div');
  crewContainer.className = 'crew-container';

  // Create crew member elements (including Triglass as a regular member)
  CREW_DATA.forEach((member, index) => {
    const elements = createPortraitElement(member, index, member.isLogo || false);
    crewElements.push(elements);
  });

  // Append blur backdrops directly to imgWorld (not crewContainer) for proper backdrop-filter
  crewElements.forEach(elements => {
    imgWorld.appendChild(elements.backdrop);
  });

  // Then append portraits and labels to crewContainer
  crewElements.forEach(elements => {
    crewContainer.appendChild(elements.portrait);
    crewContainer.appendChild(elements.label);
  });

  // Create bio container with scrollable content
  bioContainer = document.createElement('div');
  bioContainer.className = 'crew-bio';

  // Scroll wrapper
  const bioScroll = document.createElement('div');
  bioScroll.className = 'crew-bio-scroll';
  bioScroll.id = 'crew-bio-scroll';

  // Content wrapper (this gets translated for scroll effect)
  const bioContent = document.createElement('div');
  bioContent.className = 'crew-bio-content';
  bioContent.id = 'crew-bio-content';

  bioTextEl = document.createElement('div');
  bioTextEl.className = 'crew-bio-text';
  bioContent.appendChild(bioTextEl);

  // Reel image container
  const bioReelContainer = document.createElement('div');
  bioReelContainer.className = 'crew-bio-reel';
  bioReelContainer.id = 'crew-bio-reel';
  bioContent.appendChild(bioReelContainer);

  // Signature container
  const bioSignature = document.createElement('div');
  bioSignature.className = 'crew-bio-signature';
  bioSignature.id = 'crew-bio-signature';
  bioContent.appendChild(bioSignature);

  // Assemble scroll structure
  bioScroll.appendChild(bioContent);
  bioContainer.appendChild(bioScroll);

  crewContainer.appendChild(bioContainer);

  crewContainer.style.opacity = 0;
  imgWorld.appendChild(crewContainer);

  // Add document click listener
  document.addEventListener('click', onDocumentClick);

}

// Create a portrait element with its label and blur backdrop
function createPortraitElement(data, index, isLogo) {
  // Create blur backdrop element - all same size now
  const backdrop = document.createElement('div');
  backdrop.className = 'crew-blur-backdrop portrait-size';
  backdrop.dataset.baseX = data.x;
  backdrop.dataset.baseY = data.y;
  backdrop.dataset.index = index;
  backdrop.dataset.crewIndex = index; // For CSS glow color targeting

  const portrait = document.createElement('div');
  portrait.className = 'crew-portrait' + (isLogo ? ' logo' : '');

  portrait.dataset.baseX = data.x;
  portrait.dataset.baseY = data.y;
  portrait.dataset.index = index;
  portrait.dataset.crewIndex = index; // For CSS glow color targeting

  const inner = document.createElement('div');
  inner.className = 'crew-portrait-inner';

  if (data.image !== 'PLACEHOLDER') {
    const img = document.createElement('img');
    img.src = data.image;
    img.alt = data.name;
    inner.appendChild(img);
  }

  portrait.appendChild(inner);

  // Click handler for all portraits including logo
  portrait.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCrewBio(index);
  });

  // Label element - positioned below portrait
  const labelOffsetY = 95; // Distance below portrait center
  const label = document.createElement('div');
  label.className = 'crew-label';
  label.dataset.baseX = data.x;
  label.dataset.baseY = data.y + labelOffsetY;
  label.dataset.index = index;
  label.innerHTML = `
    <span class="crew-label-name">${data.name}</span>
    <span class="crew-label-role">${data.role}</span>
  `;

  return { portrait, label, backdrop };
}

// Update chapter based on discrete section system
export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !crewContainer) return;

  const goingForward = targetSection > currentSection;

  let containerZ = REST_Z;
  let containerOpacity = 0;
  let containerScale = 1;

  if (isTransitioning) {
    // Close bio when transitioning away
    if (crewBioMode && sectionIndex === currentSection) {
      closeCrewBio();
    }

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

  // Parallax movement
  const panX = mouse.x * 20;
  const panY = -mouse.y * 10;

  // Update container
  crewContainer.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
  crewContainer.style.opacity = Math.max(0, Math.min(1, containerOpacity));

  // Update individual elements for bio mode animation
  const bioTargetX = -310; // Position when showing bio (further left for larger portrait)
  const bioTargetY = 20; // Slightly lower to center with expanded bio

  // Update crew portraits (including Triglass)
  crewElements.forEach((elements, index) => {
    const baseX = parseFloat(elements.portrait.dataset.baseX);
    const baseY = parseFloat(elements.portrait.dataset.baseY);
    const labelBaseX = parseFloat(elements.label.dataset.baseX);
    const labelBaseY = parseFloat(elements.label.dataset.baseY);

    let targetX = baseX;
    let targetY = baseY;
    let targetLabelX = labelBaseX;
    let targetLabelY = labelBaseY;
    let opacity = containerOpacity;
    let labelOpacity = containerOpacity;
    let targetScale = 1;

    if (crewBioMode && sectionIndex === currentSection) {
      if (index === selectedCrewIndex) {
        targetX = bioTargetX;
        targetY = bioTargetY;
        targetLabelX = bioTargetX;
        targetLabelY = bioTargetY + 120; // Adjusted for larger portrait
        targetScale = 1.5; // Scale up portrait in bio mode
        // Keep label visible in bio mode (shows name + role under portrait)
      } else {
        opacity = 0;
        labelOpacity = 0;
      }
    }

    // Initialize animation state
    if (!crewAnimState[index]) {
      crewAnimState[index] = { x: targetX, y: targetY, labelX: targetLabelX, labelY: targetLabelY, opacity, labelOpacity, scale: targetScale };
    }

    // Lerp to target
    const state = crewAnimState[index];
    state.x += (targetX - state.x) * LERP_SPEED;
    state.y += (targetY - state.y) * LERP_SPEED;
    state.labelX += (targetLabelX - state.labelX) * LERP_SPEED;
    state.labelY += (targetLabelY - state.labelY) * LERP_SPEED;
    state.opacity += (opacity - state.opacity) * LERP_SPEED;
    state.labelOpacity += (labelOpacity - state.labelOpacity) * LERP_SPEED;
    state.scale += (targetScale - state.scale) * LERP_SPEED;

    // Backdrop gets full transform like trailer images (needed for backdrop-filter during transitions)
    // Position offset must be scaled by containerScale to match portrait inside scaled container
    const isActive = sectionIndex === currentSection && !isTransitioning && state.opacity > 0.5;
    elements.backdrop.style.transform = `translate(calc(-50% + ${state.x * containerScale + panX}px), calc(-50% + ${state.y * containerScale + panY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale * state.scale})`;
    elements.backdrop.style.opacity = Math.max(0, Math.min(1, state.opacity));
    elements.backdrop.style.visibility = state.opacity > 0.01 ? 'visible' : 'hidden';
    elements.backdrop.style.pointerEvents = 'none'; // Backdrops should never intercept clicks
    elements.portrait.style.transform = `translate(calc(-50% + ${state.x}px), calc(-50% + ${state.y}px)) scale(${state.scale})`;
    elements.portrait.style.opacity = Math.max(0, Math.min(1, state.opacity));
    elements.portrait.style.visibility = state.opacity > 0.01 ? 'visible' : 'hidden';
    // Only allow interactions when this is the active section and not transitioning
    elements.portrait.style.pointerEvents = isActive ? 'auto' : 'none';

    elements.label.style.transform = `translate(calc(-50% + ${state.labelX}px), calc(-50% + ${state.labelY}px))`;
    elements.label.style.opacity = Math.max(0, Math.min(1, state.labelOpacity));
  });

  // Update bio position - top-aligned, to the right of portrait
  if (bioContainer) {
    const bioX = bioTargetX + 400; // To the right of the larger portrait (180px + gap)
    const bioY = bioTargetY - 70; // Align with top of portrait area
    bioContainer.style.transform = `translate(calc(-50% + ${bioX}px), ${bioY}px)`;
  }
}

// Cleanup chapter DOM
export function destroy() {
  document.removeEventListener('click', onDocumentClick);

  // Remove backdrops (they're in imgWorld, not crewContainer)
  crewElements.forEach(elements => {
    if (elements.backdrop) {
      elements.backdrop.remove();
    }
  });

  if (crewContainer) {
    crewContainer.remove();
    crewContainer = null;
  }

  imageWorld = null;
  crewElements = [];
  bioContainer = null;
  bioTextEl = null;
  selectedCrewIndex = -1;
  crewBioMode = false;
  crewAnimState.length = 0;
  sectionIndex = -1;

  const styles = document.getElementById('crew-chapter-styles');
  if (styles) styles.remove();
}

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
const CREW_DATA = [
  {
    name: 'Ryan Thielen',
    role: 'Director',
    x: 0,
    y: -230,
    image: 'https://triglass-assets.s3.amazonaws.com/ryan.jpg',
    bio: `The world through Ryan Thielen's eyes is big, bold, and filled with endless possibility. His work lives at the intersection of emotional story driven story and imaginative, fantastical worlds.

Ryan is an award-winning filmmaker, earning <strong>35 Regional Emmy Awards</strong>, 8 Telly Awards, 2 IDEA Awards, and a Clio.`,
    reel: 'https://triglass-assets.s3.amazonaws.com/RyanVid.png',
    signature: 'https://triglass-assets.s3.amazonaws.com/signature.png',
  },
  {
    name: 'Charles Mulford',
    role: 'Producer',
    x: -230,
    y: -30,
    image: 'https://triglass-assets.s3.amazonaws.com/charles.jpg',
    bio: 'Charles Mulford produces Liftoff with a focus on bringing imaginative stories to life while maintaining creative integrity.',
  },
  {
    name: 'Noelle Anderson',
    role: 'AD',
    x: 230,
    y: -30,
    image: 'https://triglass-assets.s3.amazonaws.com/noelle.jpg',
    bio: 'Noelle Anderson serves as Assistant Director, coordinating the production with precision and creative insight.',
  },
  {
    name: 'Kaleb Lechowski',
    role: 'Art Director',
    x: -140,
    y: 175,
    image: 'https://triglass-assets.s3.amazonaws.com/kaleb.jpg',
    bio: 'Kaleb Lechowski brings the visual world of Liftoff to life as Art Director, crafting the magical aesthetic of the film.',
  },
  {
    name: 'David Vanderwarn',
    role: 'Line Producer',
    x: 140,
    y: 175,
    image: 'https://triglass-assets.s3.amazonaws.com/david.jpg',
    bio: 'David Vanderwarn manages the day-to-day production as Line Producer, ensuring everything runs smoothly.',
  },
];

// Triglass logo in the center
const LOGO_DATA = {
  name: 'Triglass Productions',
  role: 'Production & Post House',
  x: 0,
  y: -30,
  image: 'https://triglass-assets.s3.amazonaws.com/triglass.png',
  isLogo: true,
  bio: `Triglass Productions is an award-winning production and post-production house specializing in bringing imaginative stories to life.

With expertise spanning commercial production, narrative filmmaking, and cutting-edge visual effects, Triglass delivers cinematic quality across all formats.`,
};

// DOM elements
let crewContainer = null;
let imageWorld = null; // Reference to imgWorld for backdrop positioning
let crewElements = [];
let logoElement = null;
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
      top: 18%;
    }
    .liftoff-text.crew-layout h1 {
      font-size: clamp(26px, 4.8vw, 51px);
    }
    .liftoff-text.crew-layout p {
      display: none; /* Subtitle hidden - we show role under each name */
    }

    /* Preview crew positioning */
    .liftoff-preview.preview-crew {
      top: 18%;
    }
    .liftoff-preview.preview-crew h1 {
      font-size: clamp(26px, 4.8vw, 51px);
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
    /* Linear gradient stroke - matching character styling */
    .crew-blur-backdrop::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      padding: 1px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.4) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
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
    .crew-blur-backdrop[data-crew-index="-1"]::after { animation-delay: 0s; }
    .crew-blur-backdrop[data-crew-index="0"]::after { animation-delay: 0.5s; }
    .crew-blur-backdrop[data-crew-index="1"]::after { animation-delay: 1s; }
    .crew-blur-backdrop[data-crew-index="2"]::after { animation-delay: 1.5s; }
    .crew-blur-backdrop[data-crew-index="3"]::after { animation-delay: 2s; }
    .crew-blur-backdrop[data-crew-index="4"]::after { animation-delay: 2.5s; }

    .crew-portrait-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid rgba(255,255,255,0.2);
      box-shadow: 0 6px 24px rgba(0,0,0,0.4);
      background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
      transition: box-shadow 0.2s ease-out, border-color 0.2s ease-out;
    }

    .crew-portrait img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Unique glow colors for each crew member - projecting from portrait onto backdrop */
    /* Ryan Thielen - Orange */
    .crew-portrait[data-crew-index="0"] .crew-portrait-inner {
      box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 16px rgba(255, 150, 50, 0.6);
    }
    .crew-portrait[data-crew-index="0"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 24px rgba(255, 150, 50, 0.95);
    }
    /* Charles Mulford - Pink/Magenta */
    .crew-portrait[data-crew-index="1"] .crew-portrait-inner {
      box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 16px rgba(255, 80, 150, 0.6);
    }
    .crew-portrait[data-crew-index="1"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 24px rgba(255, 80, 150, 0.95);
    }
    /* Noelle Anderson - Green */
    .crew-portrait[data-crew-index="2"] .crew-portrait-inner {
      box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 16px rgba(80, 220, 120, 0.6);
    }
    .crew-portrait[data-crew-index="2"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 24px rgba(80, 220, 120, 0.95);
    }
    /* Kaleb Lechowski - Pink/Magenta */
    .crew-portrait[data-crew-index="3"] .crew-portrait-inner {
      box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 16px rgba(255, 80, 150, 0.6);
    }
    .crew-portrait[data-crew-index="3"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 24px rgba(255, 80, 150, 0.95);
    }
    /* David Vanderwarn - Cyan/Teal */
    .crew-portrait[data-crew-index="4"] .crew-portrait-inner {
      box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 16px rgba(50, 200, 200, 0.6);
    }
    .crew-portrait[data-crew-index="4"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 24px rgba(50, 200, 200, 0.95);
    }
    /* Triglass - Purple */
    .crew-portrait[data-crew-index="-1"] .crew-portrait-inner {
      box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 16px rgba(160, 80, 200, 0.6);
    }
    .crew-portrait[data-crew-index="-1"]:hover .crew-portrait-inner {
      box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 24px rgba(160, 80, 200, 0.95);
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
      top: 50%;
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
      overflow: hidden;
      position: relative;
    }
    .crew-bio-content {
      transition: transform 0.3s ease-out;
    }

    .crew-bio-text {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(12px, 1.1vw, 14px);
      font-weight: 300;
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

  // Handle logo (index -1) vs regular crew members
  const crewData = crewIndex === -1 ? LOGO_DATA : CREW_DATA[crewIndex];

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

// Mouse move handler for auto-scrolling bio content
function onMouseMoveForScroll(e) {
  if (!crewBioMode) return;

  const bioContent = document.getElementById('crew-bio-content');
  const bioScroll = document.getElementById('crew-bio-scroll');
  if (!bioContent || !bioScroll) return;

  // Get content height vs visible height
  const contentHeight = bioContent.offsetHeight;
  const visibleHeight = bioScroll.offsetHeight;
  const scrollableAmount = Math.max(0, contentHeight - visibleHeight);

  if (scrollableAmount <= 0) return; // No need to scroll

  // Calculate scroll based on mouse Y position (0 = top, 1 = bottom of viewport)
  const viewportHeight = window.innerHeight;
  const mouseYRatio = e.clientY / viewportHeight;

  // Only start scrolling when mouse is in bottom 60% of screen
  // Map 0.4-1.0 range to 0-1 scroll range
  const scrollRatio = Math.max(0, Math.min(1, (mouseYRatio - 0.4) / 0.6));

  // Apply scroll offset
  const scrollOffset = -scrollRatio * scrollableAmount;
  bioContent.style.transform = `translateY(${scrollOffset}px)`;
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

  // Create logo element (center)
  logoElement = createPortraitElement(LOGO_DATA, -1, true);

  // Create crew member elements
  CREW_DATA.forEach((member, index) => {
    const elements = createPortraitElement(member, index, false);
    crewElements.push(elements);
  });

  // Append blur backdrops directly to imgWorld (not crewContainer) for proper backdrop-filter
  imgWorld.appendChild(logoElement.backdrop);
  crewElements.forEach(elements => {
    imgWorld.appendChild(elements.backdrop);
  });

  // Then append portraits and labels to crewContainer
  // Append crew members first, then logo last so logo is on top (clickable)
  crewElements.forEach(elements => {
    crewContainer.appendChild(elements.portrait);
    crewContainer.appendChild(elements.label);
  });
  crewContainer.appendChild(logoElement.portrait);
  crewContainer.appendChild(logoElement.label);

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

  // Add mouse move listener for auto-scroll
  document.addEventListener('mousemove', onMouseMoveForScroll);

  console.log('[CREW] Chapter initialized with', CREW_DATA.length, 'crew members');
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
  const labelOffsetY = 80; // Distance below portrait center
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

  // Update logo - now supports bio mode like other crew members
  if (logoElement) {
    const logoBaseX = parseFloat(logoElement.portrait.dataset.baseX);
    const logoBaseY = parseFloat(logoElement.portrait.dataset.baseY);
    const logoLabelBaseX = parseFloat(logoElement.label.dataset.baseX);
    const logoLabelBaseY = parseFloat(logoElement.label.dataset.baseY);

    let logoTargetX = logoBaseX;
    let logoTargetY = logoBaseY;
    let logoTargetLabelX = logoLabelBaseX;
    let logoTargetLabelY = logoLabelBaseY;
    let logoOpacity = containerOpacity;
    let logoLabelOpacity = containerOpacity;
    let logoTargetScale = 1;

    if (crewBioMode && sectionIndex === currentSection) {
      if (selectedCrewIndex === -1) {
        // Logo is selected - animate to bio position
        logoTargetX = bioTargetX;
        logoTargetY = bioTargetY;
        logoTargetLabelX = bioTargetX;
        logoTargetLabelY = bioTargetY + 120;
        logoTargetScale = 1.5;
      } else {
        // Another crew member is selected - fade out logo
        logoOpacity = 0;
        logoLabelOpacity = 0;
      }
    }

    // Initialize logo animation state
    if (!crewAnimState[-1]) {
      crewAnimState[-1] = { x: logoTargetX, y: logoTargetY, labelX: logoTargetLabelX, labelY: logoTargetLabelY, opacity: logoOpacity, labelOpacity: logoLabelOpacity, scale: logoTargetScale };
    }

    // Lerp logo to target
    const logoState = crewAnimState[-1];
    logoState.x += (logoTargetX - logoState.x) * LERP_SPEED;
    logoState.y += (logoTargetY - logoState.y) * LERP_SPEED;
    logoState.labelX += (logoTargetLabelX - logoState.labelX) * LERP_SPEED;
    logoState.labelY += (logoTargetLabelY - logoState.labelY) * LERP_SPEED;
    logoState.opacity += (logoOpacity - logoState.opacity) * LERP_SPEED;
    logoState.labelOpacity += (logoLabelOpacity - logoState.labelOpacity) * LERP_SPEED;
    logoState.scale += (logoTargetScale - logoState.scale) * LERP_SPEED;

    // Backdrop gets full transform like trailer images (needed for backdrop-filter during transitions)
    logoElement.backdrop.style.transform = `translate(calc(-50% + ${logoState.x + panX}px), calc(-50% + ${logoState.y + panY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale * logoState.scale})`;
    logoElement.backdrop.style.opacity = Math.max(0, Math.min(1, logoState.opacity));
    logoElement.portrait.style.transform = `translate(calc(-50% + ${logoState.x}px), calc(-50% + ${logoState.y}px)) scale(${logoState.scale})`;
    logoElement.portrait.style.opacity = Math.max(0, Math.min(1, logoState.opacity));
    // pointer-events handled by CSS for .crew-portrait.logo
    logoElement.label.style.transform = `translate(calc(-50% + ${logoState.labelX}px), calc(-50% + ${logoState.labelY}px))`;
    logoElement.label.style.opacity = Math.max(0, Math.min(1, logoState.labelOpacity));
  }

  // Update crew portraits
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
    elements.backdrop.style.transform = `translate(calc(-50% + ${state.x + panX}px), calc(-50% + ${state.y + panY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale * state.scale})`;
    elements.backdrop.style.opacity = Math.max(0, Math.min(1, state.opacity));
    elements.portrait.style.transform = `translate(calc(-50% + ${state.x}px), calc(-50% + ${state.y}px)) scale(${state.scale})`;
    elements.portrait.style.opacity = Math.max(0, Math.min(1, state.opacity));
    // Only allow interactions when this is the active section and not transitioning
    elements.portrait.style.pointerEvents = (sectionIndex === currentSection && !isTransitioning && state.opacity > 0.5) ? 'auto' : 'none';

    elements.label.style.transform = `translate(calc(-50% + ${state.labelX}px), calc(-50% + ${state.labelY}px))`;
    elements.label.style.opacity = Math.max(0, Math.min(1, state.labelOpacity));
  });

  // Update bio position - align top with top of portrait
  if (bioContainer) {
    const bioX = bioTargetX + 400; // To the right of the larger portrait (180px + gap)
    const bioY = bioTargetY + 60; // Position well below the title
    bioContainer.style.transform = `translate(calc(-50% + ${bioX}px), calc(-50% + ${bioY}px))`;
  }
}

// Cleanup chapter DOM
export function destroy() {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('mousemove', onMouseMoveForScroll);

  // Remove backdrops (they're in imgWorld, not crewContainer)
  if (logoElement && logoElement.backdrop) {
    logoElement.backdrop.remove();
  }
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
  logoElement = null;
  bioContainer = null;
  bioTextEl = null;
  selectedCrewIndex = -1;
  crewBioMode = false;
  crewAnimState.length = 0;
  sectionIndex = -1;

  const styles = document.getElementById('crew-chapter-styles');
  if (styles) styles.remove();
}

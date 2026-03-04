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
const LOGO_SIZE = 140;

// Crew member data - positions are relative offsets from center (in pixels)
const CREW_DATA = [
  {
    name: 'Ryan Thielen',
    role: 'Director',
    x: 0,
    y: -230,
    image: 'PLACEHOLDER',
    bio: 'Ryan Thielen is the visionary director behind Liftoff, bringing his passion for emotionally resonant storytelling to every frame.',
  },
  {
    name: 'Charles Mulford',
    role: 'Producer',
    x: -230,
    y: -30,
    image: 'PLACEHOLDER',
    bio: 'Charles Mulford produces Liftoff with a focus on bringing imaginative stories to life while maintaining creative integrity.',
  },
  {
    name: 'Noelle Anderson',
    role: 'AD',
    x: 230,
    y: -30,
    image: 'PLACEHOLDER',
    bio: 'Noelle Anderson serves as Assistant Director, coordinating the production with precision and creative insight.',
  },
  {
    name: 'Kaleb Lechowski',
    role: 'Art Director',
    x: -140,
    y: 175,
    image: 'PLACEHOLDER',
    bio: 'Kaleb Lechowski brings the visual world of Liftoff to life as Art Director, crafting the magical aesthetic of the film.',
  },
  {
    name: 'David Vanderwarn',
    role: 'Line Producer',
    x: 140,
    y: 175,
    image: 'PLACEHOLDER',
    bio: 'David Vanderwarn manages the day-to-day production as Line Producer, ensuring everything runs smoothly.',
  },
];

// Triglass logo in the center
const LOGO_DATA = {
  name: 'Triglass Productions',
  role: 'Production & Post House',
  x: 0,
  y: -30,
  image: 'PLACEHOLDER',
  isLogo: true,
};

// DOM elements
let crewContainer = null;
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
      font-size: clamp(32px, 6vw, 64px);
    }
    .liftoff-text.crew-layout p {
      display: none; /* Subtitle hidden - we show role under each name */
    }

    /* Preview crew positioning */
    .liftoff-preview.preview-crew {
      top: 18%;
    }
    .liftoff-preview.preview-crew h1 {
      font-size: clamp(32px, 6vw, 64px);
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


    .crew-portrait-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid rgba(255,255,255,0.2);
      box-shadow: 0 6px 24px rgba(0,0,0,0.4);
      background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
    }

    .crew-portrait img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .crew-portrait:hover .crew-portrait-inner {
      border-color: rgba(255,255,255,0.35);
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
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

    /* Logo portrait (Triglass) - slightly different styling */
    .crew-portrait.logo {
      width: ${LOGO_SIZE}px;
      height: ${LOGO_SIZE}px;
      cursor: default;
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
      width: 320px;
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
    .crew-bio p {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(11px, 1.1vw, 14px);
      font-weight: 300;
      color: rgba(255,255,255,0.9);
      line-height: 1.7;
      text-align: left;
      margin: 0;
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

  // Update bio text
  if (bioTextEl && bioContainer) {
    bioTextEl.textContent = crewData.bio;
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

  // Create container
  crewContainer = document.createElement('div');
  crewContainer.className = 'crew-container';

  // Create logo element (center)
  logoElement = createPortraitElement(LOGO_DATA, -1, true);
  crewContainer.appendChild(logoElement.portrait);
  crewContainer.appendChild(logoElement.label);

  // Create crew member elements
  CREW_DATA.forEach((member, index) => {
    const elements = createPortraitElement(member, index, false);
    crewElements.push(elements);
    crewContainer.appendChild(elements.portrait);
    crewContainer.appendChild(elements.label);
  });

  // Create bio container
  bioContainer = document.createElement('div');
  bioContainer.className = 'crew-bio';
  bioTextEl = document.createElement('p');
  bioContainer.appendChild(bioTextEl);
  crewContainer.appendChild(bioContainer);

  crewContainer.style.opacity = 0;
  imgWorld.appendChild(crewContainer);

  // Add document click listener
  document.addEventListener('click', onDocumentClick);

  console.log('[CREW] Chapter initialized with', CREW_DATA.length, 'crew members');
}

// Create a portrait element with its label
function createPortraitElement(data, index, isLogo) {
  const portrait = document.createElement('div');
  portrait.className = 'crew-portrait' + (isLogo ? ' logo' : '');

  portrait.dataset.baseX = data.x;
  portrait.dataset.baseY = data.y;
  portrait.dataset.index = index;

  const inner = document.createElement('div');
  inner.className = 'crew-portrait-inner';

  if (data.image !== 'PLACEHOLDER') {
    const img = document.createElement('img');
    img.src = data.image;
    img.alt = data.name;
    inner.appendChild(img);
  }

  portrait.appendChild(inner);

  // Click handler for non-logo portraits
  if (!isLogo) {
    portrait.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCrewBio(index);
    });
  }

  // Label element - positioned below portrait
  const labelOffsetY = isLogo ? 95 : 80; // Distance below portrait center
  const label = document.createElement('div');
  label.className = 'crew-label';
  label.dataset.baseX = data.x;
  label.dataset.baseY = data.y + labelOffsetY;
  label.dataset.index = index;
  label.innerHTML = `
    <span class="crew-label-name">${data.name}</span>
    <span class="crew-label-role">${data.role}</span>
  `;

  return { portrait, label };
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
  const bioTargetX = -120; // Position when showing bio
  const bioTargetY = -20;

  // Update logo
  if (logoElement) {
    const logoX = parseFloat(logoElement.portrait.dataset.baseX);
    const logoY = parseFloat(logoElement.portrait.dataset.baseY);
    const labelX = parseFloat(logoElement.label.dataset.baseX);
    const labelY = parseFloat(logoElement.label.dataset.baseY);

    // In bio mode, fade out logo
    let opacity = containerOpacity;
    if (crewBioMode) {
      opacity = 0;
    }

    logoElement.portrait.style.transform = `translate(calc(-50% + ${logoX}px), calc(-50% + ${logoY}px))`;
    logoElement.portrait.style.opacity = opacity;
    logoElement.label.style.transform = `translate(calc(-50% + ${labelX}px), calc(-50% + ${labelY}px))`;
    logoElement.label.style.opacity = opacity;
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

    if (crewBioMode && sectionIndex === currentSection) {
      if (index === selectedCrewIndex) {
        targetX = bioTargetX;
        targetY = bioTargetY;
        targetLabelX = bioTargetX;
        targetLabelY = bioTargetY + 80;
        labelOpacity = 0; // Hide name when showing bio (it's in the title)
      } else {
        opacity = 0;
        labelOpacity = 0;
      }
    }

    // Initialize animation state
    if (!crewAnimState[index]) {
      crewAnimState[index] = { x: targetX, y: targetY, labelX: targetLabelX, labelY: targetLabelY, opacity, labelOpacity };
    }

    // Lerp to target
    const state = crewAnimState[index];
    state.x += (targetX - state.x) * LERP_SPEED;
    state.y += (targetY - state.y) * LERP_SPEED;
    state.labelX += (targetLabelX - state.labelX) * LERP_SPEED;
    state.labelY += (targetLabelY - state.labelY) * LERP_SPEED;
    state.opacity += (opacity - state.opacity) * LERP_SPEED;
    state.labelOpacity += (labelOpacity - state.labelOpacity) * LERP_SPEED;

    elements.portrait.style.transform = `translate(calc(-50% + ${state.x}px), calc(-50% + ${state.y}px))`;
    elements.portrait.style.opacity = Math.max(0, Math.min(1, state.opacity));
    elements.portrait.style.pointerEvents = (sectionIndex === currentSection && state.opacity > 0.5) ? 'auto' : 'none';

    elements.label.style.transform = `translate(calc(-50% + ${state.labelX}px), calc(-50% + ${state.labelY}px))`;
    elements.label.style.opacity = Math.max(0, Math.min(1, state.labelOpacity));
  });

  // Update bio position
  if (bioContainer) {
    const bioX = bioTargetX + 180; // To the right of the portrait
    const bioY = bioTargetY - 20;
    bioContainer.style.transform = `translate(calc(-50% + ${bioX}px), calc(-50% + ${bioY}px))`;
  }
}

// Cleanup chapter DOM
export function destroy() {
  document.removeEventListener('click', onDocumentClick);

  if (crewContainer) {
    crewContainer.remove();
    crewContainer = null;
  }

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

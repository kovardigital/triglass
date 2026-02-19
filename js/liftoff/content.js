/* ==========================================================================
   Liftoff - Content Module
   Static text with checkpoint transitions + Z-animated image placeholders
   ========================================================================== */

import * as Parallax from './parallax.js';

// Section content data - each section has text and optional image placeholders
// Section 0 is intro-only (title fades on scroll, then images appear)
const SECTIONS = [
  {
    title: 'LIFTOFF',
    subtitle: 'A journey beyond the stars',
    images: []  // No images in intro - title fades first, then content appears
  },
  {
    title: 'THE MISSION',
    subtitle: "Humanity's greatest adventure",
    images: [
      { x: 0, y: 0, width: 480, height: 300, label: 'Hero Image', delay: 0 },
    ]
  },
  {
    title: 'THE CREW',
    subtitle: 'Five astronauts. One chance.',
    images: [
      { x: -40, y: -8, width: 150, height: 200, label: 'Crew 1', delay: 0 },
      { x: 35, y: 5, width: 150, height: 200, label: 'Crew 2', delay: 0.25 },
      { x: -35, y: 0, width: 150, height: 200, label: 'Crew 3', delay: 0.5 },
      { x: 40, y: -5, width: 150, height: 200, label: 'Crew 4', delay: 0.75 },
    ],
    zRange: 3  // Images travel 3x further in Z-space for more separation
  },
  {
    title: 'THE STAKES',
    subtitle: 'Everything we know hangs in the balance',
    images: [
      { x: -40, y: 0, width: 320, height: 200, label: 'Earth View', delay: 0 },
      { x: 35, y: 5, width: 280, height: 180, label: 'The Threat', delay: 0.35 },
    ],
    zRange: 3  // Match crew section Z separation
  },
  {
    title: 'COMING SOON',
    subtitle: '2026',
    images: []
  }
];

// Configuration
const IMAGE_START_Z = -800;  // How far back images start
const IMAGE_END_Z = 600;     // Images fly past the camera

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

// Track current section for text transitions
let currentSection = 0;
let displaySection = 0; // Which section's styling to show (changes after transition completes)
let isTransitioning = false;
let transitionTimeout = null; // Store timeout ID to cancel if needed
let jumpTarget = null; // Section we're jumping to (blocks scroll-based updates)

// Inject Google Fonts
function injectFonts() {
  // Preconnect for faster loading
  const preconnect1 = document.createElement('link');
  preconnect1.rel = 'preconnect';
  preconnect1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnect1);

  const preconnect2 = document.createElement('link');
  preconnect2.rel = 'preconnect';
  preconnect2.href = 'https://fonts.gstatic.com';
  preconnect2.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect2);

  // Load fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@300..700&display=swap';
  document.head.appendChild(fontLink);
}

// Inject CSS
function injectStyles() {
  injectFonts();
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
    }
    .liftoff-text h1 {
      font-family: 'Michroma', sans-serif;
      font-size: clamp(20px, 4vw, 42px);
      font-weight: 400;
      margin: 0 0 12px 0;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #fff;
      line-height: 1.1;
    }
    /* Larger title for intro section */
    .liftoff-text.intro h1 {
      font-size: clamp(32px, 8vw, 72px);
    }
    .liftoff-text p {
      font-family: 'Space Grotesk', sans-serif;
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
    .liftoff-text.transitioning h1,
    .liftoff-text.transitioning p {
      opacity: 0;
      transition: opacity 0.6s ease-out;
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
      transition-delay: 1s; /* Start after title fades in */
    }
    .liftoff-text.intro.revealed h1 {
      opacity: 1;
      transform: scale(1);
    }
    .liftoff-text.intro.revealed p {
      opacity: 1;
      transform: translateY(0);
    }

    /* Outro section (COMING SOON) - smaller title, centered */
    .liftoff-text.outro h1 {
      font-size: clamp(12px, 2.5vw, 24px);
      letter-spacing: 0.15em;
    }

    /* Character animation for section transitions */
    .liftoff-char {
      display: inline-block;
      opacity: 0;
      transform: translateY(100%) rotateX(-80deg);
      transform-origin: center top;
      transition: opacity 0.6s ease-out, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .liftoff-char.space {
      width: 0.3em;
    }
    .liftoff-text.char-revealed .liftoff-char {
      opacity: 1;
      transform: translateY(0) rotateX(0deg);
    }

    /* 3D world for image placeholders */
    .liftoff-image-world {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
      perspective: 1000px;
    }

    /* Image placeholder styling - frosted glass effect */
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
    }
    .liftoff-image span {
      display: inline-block;
      clip-path: inset(0 100% 0 0);
      transition: clip-path 0.3s ease-out;
    }

    /* Contact button - top right */
    .liftoff-contact {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 100;
      font-family: 'Space Grotesk', sans-serif;
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
      font-family: 'Space Grotesk', sans-serif;
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
  injectStyles();

  // Create viewport
  viewport = document.createElement('div');
  viewport.className = 'liftoff-viewport';

  // Create static text container (no Z movement)
  textContainer = document.createElement('div');
  textContainer.className = 'liftoff-text intro'; // Start with intro class for scale animation
  textContainer.innerHTML = `<h1></h1><p></p>`;
  titleEl = textContainer.querySelector('h1');
  subtitleEl = textContainer.querySelector('p');
  viewport.appendChild(textContainer);

  // Create 3D world for images
  imageWorld = document.createElement('div');
  imageWorld.className = 'liftoff-image-world';
  viewport.appendChild(imageWorld);

  // Create all image placeholders for all sections
  SECTIONS.forEach((sectionData, sectionIndex) => {
    if (!sectionData.images) return;

    sectionData.images.forEach((imgConfig, imgIndex) => {
      const img = document.createElement('div');
      img.className = 'liftoff-image';
      img.innerHTML = `<span>${imgConfig.label}</span>`;
      img.style.width = imgConfig.width + 'px';
      img.style.height = imgConfig.height + 'px';

      // Store metadata
      img.dataset.section = sectionIndex;
      img.dataset.baseX = imgConfig.x; // percentage from center
      img.dataset.baseY = imgConfig.y;
      img.dataset.delay = imgConfig.delay || 0; // stagger delay (0-1)

      // Start hidden
      img.style.opacity = 0;

      imageWorld.appendChild(img);
      imageElements.push(img);
    });
  });

  document.body.appendChild(viewport);

  // Scroll spacer
  scrollSpacer = document.createElement('div');
  scrollSpacer.className = 'liftoff-scroll-spacer';
  document.body.appendChild(scrollSpacer);

  // Contact button (top right)
  contactBtn = document.createElement('button');
  contactBtn.className = 'liftoff-contact';
  contactBtn.textContent = 'Contact';
  contactBtn.addEventListener('click', () => {
    window.location.href = 'mailto:hello@triglass.com';
  });
  document.body.appendChild(contactBtn);

  // Copyright (bottom left)
  copyrightEl = document.createElement('div');
  copyrightEl.className = 'liftoff-copyright';
  copyrightEl.textContent = '\u00A9 2026 Triglass Productions';
  document.body.appendChild(copyrightEl);

  // Set initial text
  updateText(0);

  console.log('[LIFTOFF] Content initialized with', SECTIONS.length, 'sections,', imageElements.length, 'images');
}

// Update text with transition effect
function updateText(sectionIndex, force = false) {
  if (!force && sectionIndex === currentSection && titleEl.textContent) return;

  const section = SECTIONS[sectionIndex];
  if (!section) return;

  const wasFirstSection = currentSection === 0;
  currentSection = sectionIndex;

  // First section on init - just set text (intro animation handles reveal)
  if (sectionIndex === 0 && !titleEl.textContent) {
    titleEl.textContent = section.title;
    subtitleEl.textContent = section.subtitle;
    return;
  }

  // Cancel any pending transition
  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }

  // Fade out current text
  isTransitioning = true;
  textContainer.classList.add('transitioning');
  textContainer.classList.remove('char-revealed');

  transitionTimeout = setTimeout(() => {
    transitionTimeout = null;
    isTransitioning = false;
    displaySection = sectionIndex; // Now update the visual styling

    // Clear any inline opacity from intro section fade-out
    textContainer.style.opacity = '';

    // Handle intro/outro class based on which section we're going to
    if (sectionIndex === 0) {
      // Restore intro class for section 0 (larger font, etc.)
      textContainer.classList.add('intro', 'revealed');
      textContainer.classList.remove('outro');
    } else if (sectionIndex === SECTIONS.length - 1) {
      // Add outro class for last section (smaller title, centered)
      textContainer.classList.add('outro');
      textContainer.classList.remove('intro', 'revealed');
    } else {
      // Regular sections - remove both special classes
      textContainer.classList.remove('intro', 'revealed', 'outro');
    }

    // Set new text and split into characters for animation
    titleEl.textContent = section.title;
    subtitleEl.textContent = section.subtitle;

    // Use character animation for all section transitions
    const titleCharCount = splitTextToChars(titleEl, 0);
    const subtitleDelay = titleCharCount * 0.04 + 0.1;
    splitTextToChars(subtitleEl, subtitleDelay);

    // Remove transitioning and trigger reveal
    textContainer.classList.remove('transitioning');

    // Trigger character animation after reflow
    // eslint-disable-next-line no-unused-expressions
    textContainer.offsetHeight;
    requestAnimationFrame(() => {
      textContainer.classList.add('char-revealed');
    });
  }, 800); // Wait for fade out to complete
}

// Update content based on scroll progress
function update(scrollProgress) {
  if (!viewport || !imageWorld) return;

  const mouse = Parallax.getMouse();
  const numSections = SECTIONS.length;

  // Determine which section we're in (0 to numSections-1)
  const sectionFloat = scrollProgress * (numSections - 1);
  const sectionIndex = Math.min(Math.floor(sectionFloat), numSections - 1);
  const sectionProgress = sectionFloat - sectionIndex; // 0-1 within current section

  // Update text at checkpoints (but not if we're jumping to a different section)
  if (jumpTarget !== null) {
    // We're in the middle of a jump - only clear when scroll catches up
    if (sectionIndex === jumpTarget) {
      jumpTarget = null; // Arrived at target, resume normal scroll-based updates
    }
    // Don't call updateText while jumping - it was already triggered
  } else {
    updateText(sectionIndex);
  }

  // Apply parallax to text - moves TOWARDS mouse (foreground feel)
  // Text rotation matches world rotation (velocity-based, springs back)
  const offsetX = mouse.x * 40;
  const offsetY = -mouse.y * 8; // Minimal Y movement (negative to match CSS coords)
  const rotZ = Parallax.getRotationZ(); // Get velocity-based rotation that springs back
  const leanAngle = rotZ * 100; // Convert radians to degrees, lean towards mouse direction

  // Intro section (0): text floats in space, we fly straight through it
  // Outro section (last): centered like intro
  // Use displaySection for transform (only changes after transition completes)
  // Use currentSection for opacity logic (prevents re-applying intro fade after leaving)
  const lastSection = SECTIONS.length - 1;

  if (displaySection === 0) {
    // Move toward camera in Z space (0 -> 950px, just under perspective of 1000px)
    const introZ = sectionProgress * 950;
    // Only apply intro opacity if we're actually still in section 0 content-wise
    if (currentSection === 0) {
      const introOpacity = sectionProgress < 0.6 ? 1 : Math.max(0, 1 - ((sectionProgress - 0.6) / 0.3));
      textContainer.style.opacity = introOpacity;
    }
    textContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${introZ}px) rotate(${leanAngle}deg)`;
  } else if (displaySection === lastSection) {
    // Outro section: centered like intro, no Z movement
    textContainer.style.opacity = '';
    textContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) rotate(${leanAngle}deg)`;
  } else {
    // Other sections: 25% from bottom (75% from top)
    // Clear any stale intro opacity
    textContainer.style.opacity = '';
    textContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + 25vh + ${offsetY}px)) rotate(${leanAngle}deg)`;
  }

  // Update image placeholders - they fly in from Z distance, staggered by delay
  imageElements.forEach((img) => {
    const imgSection = parseInt(img.dataset.section);
    const baseX = parseFloat(img.dataset.baseX);
    const baseY = parseFloat(img.dataset.baseY);
    const delay = parseFloat(img.dataset.delay) || 0;

    // Get section-specific Z range multiplier (default 1)
    const sectionData = SECTIONS[imgSection];
    const zRange = sectionData?.zRange || 1;
    const zDistance = (IMAGE_END_Z - IMAGE_START_Z) * zRange;
    const sectionStartZ = IMAGE_START_Z - (zDistance - (IMAGE_END_Z - IMAGE_START_Z)) / 2;

    let opacity = 0;
    let textReveal = 0; // Separate from opacity for text clip-path
    let zPos = sectionStartZ;

    if (imgSection === sectionIndex) {
      // Each image has its own timing based on delay
      // delay 0 = starts at section start, delay 0.5 = starts halfway through section
      const adjustedProgress = Math.max(0, (sectionProgress - delay) / (1 - delay));
      const t = Math.min(1, adjustedProgress);

      zPos = sectionStartZ + zDistance * t;

      // Fade in quickly, fade out as it passes the camera
      if (t < 0.15) {
        opacity = t / 0.15; // Fast fade in
        textReveal = opacity; // Text reveals with fade-in
      } else if (t > 0.75) {
        opacity = 1 - ((t - 0.75) / 0.25); // Fade out in last 25%
        textReveal = 1; // Text stays fully revealed during fade-out
      } else {
        opacity = 1; // Stay fully visible in middle
        textReveal = 1;
      }

      // Additional fade when very close to camera (Z > 200)
      // This prevents placeholders from blocking the view
      if (zPos > 200) {
        const proximityFade = 1 - ((zPos - 200) / 400); // Fade from z=200 to z=600
        opacity *= Math.max(0, proximityFade);
      }
    } else if (imgSection < sectionIndex) {
      // Past section - already flown by, fade out
      zPos = sectionStartZ + zDistance + 200;
      opacity = 0;
    }
    // Future sections stay hidden at default values

    // Calculate position with parallax
    const parallaxStrength = 0.5 + (1 - opacity) * 0.5; // More parallax when further away
    const imgOffsetX = baseX * 3 + mouse.x * 30 * parallaxStrength;
    const imgOffsetY = baseY * 3 + mouse.y * 25 * parallaxStrength;

    // Same rotation as text (velocity-based, springs back)
    img.style.transform = `translate(calc(-50% + ${imgOffsetX}px), calc(-50% + ${imgOffsetY}px)) translateZ(${zPos}px) rotate(${leanAngle}deg)`;
    img.style.opacity = Math.max(0, Math.min(1, opacity));

    // Text reveal from left to right (smooth clip-path, not affected by proximity fade)
    const textSpan = img.querySelector('span');
    if (textSpan) {
      const clipProgress = Math.max(0, Math.min(1, textReveal));
      const clipRight = 100 - (clipProgress * 100);
      textSpan.style.clipPath = `inset(0 ${clipRight}% 0 0)`;
    }
  });

}

// Easing function for smooth animation
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Split text into animated characters
function splitTextToChars(element, baseDelay = 0) {
  const text = element.textContent;
  element.innerHTML = '';

  let charIndex = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const span = document.createElement('span');
    span.className = 'liftoff-char' + (char === ' ' ? ' space' : '');
    span.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space
    span.style.transitionDelay = `${baseDelay + charIndex * 0.04}s`;
    element.appendChild(span);
    charIndex++;
  }

  return charIndex; // Return count for calculating subtitle delay
}

// Reveal intro animation (called after preloader hides)
// First section uses simple scale animation, not character animation
function reveal() {
  if (!textContainer) return;

  // Force browser to acknowledge initial state before animating
  // eslint-disable-next-line no-unused-expressions
  textContainer.offsetHeight;

  // Add revealed class to trigger scale animation
  requestAnimationFrame(() => {
    textContainer.classList.add('revealed');
    console.log('[LIFTOFF] Content intro revealed (scale animation)');
  });
}

// Jump to a specific section immediately (for chapter clicks)
function jumpToSection(sectionIndex) {
  if (sectionIndex < 0 || sectionIndex >= SECTIONS.length) return;
  jumpTarget = sectionIndex; // Block scroll-based updates until we arrive
  updateText(sectionIndex, true); // Force the transition even if same section
}

// Cleanup
function destroy() {
  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }
  if (viewport) viewport.remove();
  if (scrollSpacer) scrollSpacer.remove();
  if (contactBtn) contactBtn.remove();
  if (copyrightEl) copyrightEl.remove();
  viewport = null;
  textContainer = null;
  imageWorld = null;
  scrollSpacer = null;
  titleEl = null;
  subtitleEl = null;
  contactBtn = null;
  copyrightEl = null;
  imageElements.length = 0;
  currentSection = 0;
  displaySection = 0;
  isTransitioning = false;
  jumpTarget = null;
}

export { init, update, reveal, jumpToSection, destroy };

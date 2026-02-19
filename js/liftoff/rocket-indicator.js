/* ==========================================================================
   Liftoff - Rocket Indicator Module
   Vertical scroll progress with animated rocket and debris
   ========================================================================== */

// DOM elements
let container = null;
let track = null;
let rocket = null;
let debrisContainer = null;
let smokeLayer = null;
let markers = [];
let styleEl = null;
let debrisInterval = null;
let smokeInterval = null;
let isTraveling = false;
let lastRocketTop = null;
let travelDirection = 'up'; // 'up' or 'down'
let scrollTimeout = null;
let lastScrollY = 0;
let scrollHandler = null;
let scrollSpeed = 0;

// Configuration
const TRACK_HEIGHT = 50; // Percentage of viewport height
const SECTION_COUNT = 5;
const SECTION_OFFSET = 0.15; // Land 15% into each section

// Chapter names (index 0 = LIFTOFF at bottom, index 4 = COMING SOON at top)
const CHAPTER_NAMES = [
  'LIFTOFF',
  'THE MISSION',
  'THE CREW',
  'THE STAKES',
  'COMING SOON'
];

// Calculate where each section click lands (same logic as click handler)
function getSectionScrollProgress(sectionIndex) {
  const sectionSize = 1 / (SECTION_COUNT - 1);
  if (sectionIndex === 0) return 0;
  if (sectionIndex === SECTION_COUNT - 1) return 1; // Last section lands at end
  return (sectionIndex * sectionSize) + (sectionSize * SECTION_OFFSET);
}

// Inject styles
function injectStyles() {
  styleEl = document.createElement('style');
  styleEl.textContent = `
    .rocket-indicator {
      position: fixed;
      right: 30px;
      top: 50%;
      transform: translateY(-50%);
      height: ${TRACK_HEIGHT}vh;
      z-index: 100;
      pointer-events: auto;
      padding-left: 200px;
    }

    .rocket-marker-wrap {
      position: absolute;
      right: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(50%, -50%);
      pointer-events: auto;
      cursor: pointer;
    }

    .rocket-label {
      position: absolute;
      right: 20px;
      white-space: nowrap;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 12px;
      font-weight: 400;
      letter-spacing: 0.08em;
      color: rgba(255,255,255,0.9);
      opacity: 0;
      transform: translateX(8px);
      transition: opacity 0.2s ease-out, transform 0.2s ease-out;
    }

    /* Show ALL labels when hovering anywhere on the indicator */
    .rocket-indicator:hover .rocket-label {
      opacity: 1;
      transform: translateX(0);
    }

    .rocket-track {
      position: absolute;
      right: 5px;
      top: 0;
      width: 1px;
      height: 100%;
      background: rgba(255,255,255,0.3);
    }

    .rocket-marker {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0a0a0f;
      border: 1px solid rgba(255,255,255,0.3);
      transition: all 0.2s ease-out;
    }

    .rocket-marker-wrap:hover .rocket-marker {
      background: rgba(255,255,255,1);
      border-color: rgba(255,255,255,1);
    }

    .rocket-marker.active {
      background: rgba(255,255,255,0.9);
      border-color: rgba(255,255,255,1);
      box-shadow: 0 0 8px rgba(255,255,255,0.5);
    }

    .rocket-marker.passed {
      background: rgba(255,255,255,0.6);
      border-color: rgba(255,255,255,0.8);
    }

    .rocket-ship {
      position: absolute;
      right: -7px;
      width: 24px;
      height: 24px;
      transform: translateY(-50%);
      transition: top 0.1s ease-out;
      color: white;
    }

    /* Matte background to hide track behind ship */
    .rocket-ship::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 30px;
      background: radial-gradient(circle, #0a0a0f 40%, transparent 70%);
      border-radius: 50%;
      z-index: -1;
    }

    .rocket-ship svg {
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
    }

    /* Rocket exhaust flame */
    .rocket-flame {
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 14px;
      pointer-events: none;
    }

    .rocket-flame::before,
    .rocket-flame::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    }

    /* Outer flame - white/light grey */
    .rocket-flame::before {
      width: 8px;
      height: 12px;
      background: linear-gradient(to bottom,
        rgba(255, 255, 255, 0.9) 0%,
        rgba(220, 220, 230, 0.7) 40%,
        rgba(180, 180, 200, 0.3) 70%,
        transparent 100%);
      animation: flameOuter 0.4s ease-in-out infinite alternate;
    }

    /* Inner flame - bright white core */
    .rocket-flame::after {
      width: 4px;
      height: 8px;
      background: linear-gradient(to bottom,
        rgba(255, 255, 255, 1) 0%,
        rgba(240, 240, 255, 0.9) 30%,
        rgba(200, 200, 220, 0.5) 60%,
        transparent 100%);
      animation: flameInner 0.3s ease-in-out infinite alternate;
    }

    @keyframes flameOuter {
      0% {
        height: 10px;
        opacity: 0.8;
      }
      100% {
        height: 14px;
        opacity: 1;
      }
    }

    @keyframes flameInner {
      0% {
        height: 6px;
        opacity: 0.9;
      }
      100% {
        height: 9px;
        opacity: 1;
      }
    }

    /* Single smoke layer - drop-shadow outlines ALL particles as one shape */
    .smoke-layer {
      position: absolute;
      top: 0;
      right: 0;
      width: 40px;
      height: 100%;
      pointer-events: none;
      z-index: 10;
      filter: none;
    }

    /* Individual smoke circles - starts white */
    .smoke-particle {
      position: absolute;
      border-radius: 50%;
      background: #ffffff;
      border: none;
    }

    .smoke-particle.going-up {
      animation: smokeDown 0.4s ease-out forwards;
    }

    .smoke-particle.going-down {
      animation: smokeUp 0.4s ease-out forwards;
    }

    @keyframes smokeDown {
      0% {
        transform: translateY(0) scale(0.2);
        background: #ffffff;
      }
      100% {
        transform: translateY(3px) scale(2);
        background: #000000;
        opacity: 0;
      }
    }

    @keyframes smokeUp {
      0% {
        transform: translateY(0) scale(0.2);
        background: #ffffff;
      }
      100% {
        transform: translateY(-3px) scale(2);
        background: #000000;
        opacity: 0;
      }
    }

    /* Debris container */
    .rocket-debris {
      position: absolute;
      right: 0;
      top: 0;
      width: 30px;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
    }

    .debris-particle {
      position: absolute;
      width: 2px;
      height: 2px;
      background: rgba(255,255,255,0.3);
      border-radius: 50%;
      animation: debrisFall 2s linear forwards;
    }

    @keyframes debrisFall {
      0% {
        transform: translateY(0) scale(1);
        opacity: 0.5;
      }
      100% {
        transform: translateY(100vh) scale(0.5);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

// Create rocket SVG (new cleaner design)
function createRocketSVG() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
      <path d="M16.061 10.404L14 17h-4l-2.061-6.596a6 6 0 0 1 .998-5.484l2.59-3.315a.6.6 0 0 1 .946 0l2.59 3.315a6 6 0 0 1 .998 5.484"/>
      <path d="M10 20c0 2 2 3 2 3s2-1 2-3"/>
      <path d="M8.5 12.5C5 15 7 19 7 19l3-2"/>
      <path d="M15.431 12.5c3.5 2.5 1.5 6.5 1.5 6.5l-3-2"/>
      <circle cx="12" cy="9" r="2"/>
    </svg>
  `;
}

// Create debris particle
function createDebrisParticle() {
  if (!debrisContainer || !rocket) return;

  const particle = document.createElement('div');
  particle.className = 'debris-particle';

  // Random position near rocket
  const rocketTop = parseFloat(rocket.style.top) || 0;
  particle.style.top = `${rocketTop}px`;
  particle.style.right = `${5 + Math.random() * 15}px`;
  particle.style.width = `${1 + Math.random() * 2}px`;
  particle.style.height = particle.style.width;
  particle.style.animationDuration = `${1.5 + Math.random() * 1}s`;

  debrisContainer.appendChild(particle);

  // Remove after animation
  setTimeout(() => particle.remove(), 2500);
}

// Create smoke particles in the single smoke layer
function createSmokeParticle() {
  if (!smokeLayer || !rocket || !isTraveling) return;

  // Base position for particles (adjusted: up 3px, left 2px)
  const rocketTop = parseFloat(rocket.style.top) || 0;
  const baseOffset = travelDirection === 'up' ? 13 : -5;

  // Create particles based on scroll speed (continuous stream)
  const particleCount = Math.max(8, Math.floor(scrollSpeed / 10) * 3);

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = `smoke-particle going-${travelDirection}`;

    // Varied sizes - smaller particles
    const sizes = [2, 3, 4, 5, 6];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Position - spread along trail direction for continuous look
    const xOffset = 3 + (Math.random() - 0.5) * 6;
    // Spread particles along the Y axis in the direction of travel
    const trailSpread = travelDirection === 'up' ? Math.random() * 12 : -Math.random() * 12;
    const yOffset = rocketTop + baseOffset + trailSpread;

    particle.style.right = `${xOffset}px`;
    particle.style.top = `${yOffset}px`;
    particle.style.animationDuration = `${0.4 + Math.random() * 0.2}s`;

    smokeLayer.appendChild(particle);

    // Remove after animation
    setTimeout(() => particle.remove(), 600);
  }
}

// Start smoke emission
function startSmoke() {
  if (smokeInterval) return;
  isTraveling = true;
  smokeInterval = setInterval(createSmokeParticle, 30);
}

// Stop smoke emission
function stopSmoke() {
  isTraveling = false;
  if (smokeInterval) {
    clearInterval(smokeInterval);
    smokeInterval = null;
  }
}

// Initialize rocket indicator
function init() {
  injectStyles();

  // Create container
  container = document.createElement('div');
  container.className = 'rocket-indicator';

  // Create track
  track = document.createElement('div');
  track.className = 'rocket-track';
  container.appendChild(track);

  // Create debris container
  debrisContainer = document.createElement('div');
  debrisContainer.className = 'rocket-debris';
  container.appendChild(debrisContainer);

  // Create single smoke layer - all particles go here for unified outline
  smokeLayer = document.createElement('div');
  smokeLayer.className = 'smoke-layer';
  container.appendChild(smokeLayer);

  // Create section markers - positioned where rocket actually lands
  for (let i = 0; i < SECTION_COUNT; i++) {
    const sectionIndex = (SECTION_COUNT - 1) - i; // Invert: i=0 is top (COMING SOON)
    const scrollProgress = getSectionScrollProgress(sectionIndex);
    const trackPercent = (1 - scrollProgress) * 100; // Invert for track position

    const wrap = document.createElement('div');
    wrap.className = 'rocket-marker-wrap';
    wrap.style.top = `${trackPercent}%`;

    // Marker dot
    const marker = document.createElement('div');
    marker.className = 'rocket-marker';
    wrap.appendChild(marker);

    // Chapter label
    const label = document.createElement('span');
    label.className = 'rocket-label';
    label.textContent = CHAPTER_NAMES[sectionIndex];
    wrap.appendChild(label);

    // Click to jump to section
    wrap.addEventListener('click', () => {
      const scrollSpacer = document.querySelector('.liftoff-scroll-spacer');
      if (scrollSpacer) {
        const maxScroll = scrollSpacer.offsetHeight - window.innerHeight;
        const targetScroll = Math.min(scrollProgress, 1) * maxScroll;
        const currentScroll = window.scrollY;

        // Determine travel direction (up the track = scrolling down, down the track = scrolling up)
        travelDirection = targetScroll > currentScroll ? 'up' : 'down';

        // Start smoke effect while traveling
        startSmoke();

        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    });

    container.appendChild(wrap);
    markers.push({ marker, sectionIndex });
  }

  // Create rocket
  rocket = document.createElement('div');
  rocket.className = 'rocket-ship';
  rocket.innerHTML = createRocketSVG();

  // Add flame element
  const flame = document.createElement('div');
  flame.className = 'rocket-flame';
  rocket.appendChild(flame);

  container.appendChild(rocket);

  document.body.appendChild(container);

  // Start debris animation
  debrisInterval = setInterval(createDebrisParticle, 300);

  // Listen for scroll to trigger smoke (only when scrolling down/forward)
  lastScrollY = window.scrollY;
  scrollHandler = () => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;

    // Only trigger smoke when scrolling DOWN (positive delta = scrolling down the page)
    // which means the rocket goes UP the track (forward through experience)
    if (scrollDelta > 2) {
      // Scrolling down = rocket goes up the track
      travelDirection = 'up';
      scrollSpeed = Math.min(scrollDelta, 50); // Cap at 50

      // Start smoke if not already smoking
      if (!isTraveling) {
        startSmoke();
      }

      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Stop smoke after scrolling stops
      scrollTimeout = setTimeout(() => {
        stopSmoke();
        scrollSpeed = 0;
      }, 150);
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', scrollHandler, { passive: true });

  console.log('[LIFTOFF] Rocket indicator initialized');
}

// Update rocket position based on scroll progress
function update(scrollProgress) {
  if (!rocket || !track) return;

  // Clamp progress
  const p = Math.max(0, Math.min(1, scrollProgress));

  // Update rocket position (bottom = 0%, top = 100%)
  const trackHeight = container.offsetHeight;
  const rocketTop = (1 - p) * trackHeight;
  rocket.style.top = `${rocketTop}px`;

  // Detect when rocket stops moving (for smoke effect)
  if (isTraveling) {
    if (lastRocketTop !== null && Math.abs(rocketTop - lastRocketTop) < 0.5) {
      stopSmoke();
    }
  }
  lastRocketTop = rocketTop;

  // Update markers based on current scroll position
  markers.forEach(({ marker, sectionIndex }) => {
    const sectionStart = getSectionScrollProgress(sectionIndex);
    const nextSection = sectionIndex + 1;
    const sectionEnd = nextSection < SECTION_COUNT ? getSectionScrollProgress(nextSection) : 1;

    marker.classList.remove('active', 'passed');

    if (p >= sectionStart && p < sectionEnd) {
      marker.classList.add('active');
    } else if (p >= sectionEnd) {
      marker.classList.add('passed');
    }
  });
}

// Cleanup
function destroy() {
  if (debrisInterval) clearInterval(debrisInterval);
  if (smokeInterval) clearInterval(smokeInterval);
  if (scrollTimeout) clearTimeout(scrollTimeout);
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
  if (container) container.remove();
  if (styleEl) styleEl.remove();
  container = null;
  track = null;
  rocket = null;
  debrisContainer = null;
  smokeLayer = null;
  markers = [];
  styleEl = null;
  debrisInterval = null;
  smokeInterval = null;
  isTraveling = false;
  lastRocketTop = null;
  travelDirection = 'up';
  scrollTimeout = null;
  lastScrollY = 0;
  scrollHandler = null;
  scrollSpeed = 0;
}

export { init, update, destroy };

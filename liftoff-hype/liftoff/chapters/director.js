/* ==========================================================================
   Liftoff - DIRECTOR'S STATEMENT Chapter
   Ryan's letter (text exactly as he sent it, 11/2026), a pull quote and his signature
   ========================================================================== */

// Uses discrete section system from content.js

const PULL_QUOTE = 'At its heart, it’s about what comes after.';
const PARAGRAPHS = [
  'My name is Ryan Thielen, and I am a writer and director who has spent the last three years dreaming of bringing Liftoff to life.',
  'When my grandfather passed away, what struck me most was how differently each member of my family experienced grief. I watched my aunts and uncles struggle through their own emotions, sometimes finding themselves at odds with one another. It took time for everyone to find their footing and for the family to come together again.',
  'That experience inspired me to explore a similar journey through the eyes of a family that has lost its mother, where each member must navigate their own grief while learning to assume roles that were once someone else’s.',
  'While Liftoff explores grief, it is not a film about death or loss itself. At its heart, it’s about what comes after. It’s about a family finding the missing pieces and learning how to be a family once more.',
  'I see Liftoff as an imaginative, challenging, but ultimately uplifting adventure filled with laughter, heartbreak, hope, and transformation.',
  'Thank you for taking the time to explore this story and consider being part of it. I believe we have an opportunity to create something truly special.',
];
const NAME = 'Ryan Thielen';
const ROLE = 'Director';   // as on The Crew slide
// Ryan's signature image (transparent PNG/SVG). Until it's set, his name is set in a script face.
const SIGNATURE_IMAGE = '';

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;
const PERSPECTIVE_SCALE = 1000 / (1000 - REST_Z);   // how much bigger the slide looks at rest

let container = null;
let sectionIndex = -1;
let animated = false;
let fitScale = 1;

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('director-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'director-chapter-styles';
  style.textContent = `
    /* Hide default title/subtitle - this slide renders its own */
    .liftoff-text.director-layout,
    .liftoff-preview.preview-director {
      display: none;
    }

    .director-container {
      position: absolute;
      width: 880px;
      transform-style: preserve-3d;
      pointer-events: none;
      font-family: 'montserrat', sans-serif;
      color: rgba(255, 255, 255, 0.85);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .director-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(24px, 3.6vw, 42px);
      font-weight: 400;
      color: #d4d4d4;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      text-align: center;
      margin: 0 0 14px;
    }
    .director-quote {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 21px;
      font-weight: 300;
      letter-spacing: 0.01em;
      color: rgba(255, 255, 255, 0.92);
      text-align: center;
      margin: 0 0 26px;
    }
    .director-quote::before,
    .director-quote::after {
      color: #FED003;
      font-weight: 400;
    }
    .director-quote::before { content: '“'; margin-right: 2px; }
    .director-quote::after { content: '”'; margin-left: 2px; }

    /* The letter: a glass panel, set in two columns */
    .director-letter {
      padding: 30px 38px 26px;
      border-radius: 18px;
      background: rgba(10, 14, 24, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-top: 3px solid rgba(254, 208, 3, 0.75);
      column-count: 2;
      column-gap: 46px;
      column-rule: 1px solid rgba(255, 255, 255, 0.07);
    }
    .director-letter p {
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.62;
      color: rgba(255, 255, 255, 0.8);
      margin: 0 0 11px;
    }
    .director-letter p:first-child {
      color: rgba(255, 255, 255, 0.95);
    }

    /* Sign-off at the end of the letter */
    .director-signoff {
      break-inside: avoid;
      padding-top: 6px;
    }
    .director-signature {
      display: block;
      height: 58px;
      clip-path: inset(0 100% 0 0);
      transition: clip-path 1.6s cubic-bezier(0.45, 0, 0.2, 1) 1.1s;
    }
    .animate-in .director-signature {
      clip-path: inset(0 0 0 0);
    }
    .director-signature.is-script {
      font-family: 'Mrs Saint Delafield', cursive;
      font-size: 50px;
      line-height: 58px;
      color: rgba(255, 255, 255, 0.95);
      white-space: nowrap;
    }
    .director-signature img {
      height: 100%;
      width: auto;
    }
    .director-name {
      display: block;
      margin-top: 2px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.85);
    }
    .director-role {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.5);
    }

    /* Staggered entrance */
    .director-reveal {
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .animate-in .director-reveal {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

function build() {
  const signature = SIGNATURE_IMAGE
    ? `<span class="director-signature"><img src="${SIGNATURE_IMAGE}" alt="${NAME}"></span>`
    : `<span class="director-signature is-script">${NAME}</span>`;
  container.innerHTML = `
    <h1 class="director-title">Director’s Statement</h1>
    <p class="director-quote director-reveal" style="transition-delay: 0.1s">${PULL_QUOTE}</p>
    <div class="director-letter director-reveal" style="transition-delay: 0.3s">
      ${PARAGRAPHS.map(p => `<p>${p}</p>`).join('')}
      <div class="director-signoff">
        ${signature}
        <span class="director-name">${NAME} <span class="director-role">· ${ROLE}</span></span>
      </div>
    </div>
  `;
}

// Shrink the slide if the window is too small to show it whole (the wheel changes slides, so it can't scroll)
function measureFit() {
  if (!container) return;
  const w = container.offsetWidth * PERSPECTIVE_SCALE;
  const h = container.offsetHeight * PERSPECTIVE_SCALE;
  fitScale = Math.min(1, (window.innerWidth - 160) / w, (window.innerHeight - 60) / h);
}

// Initialize chapter DOM elements
export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.directorLayout);
  if (sectionIndex < 0) {
    console.warn('[DIRECTOR] Could not find section with directorLayout');
    return;
  }

  container = document.createElement('div');
  container.className = 'director-container';
  build();
  container.style.opacity = 0;
  container.style.visibility = 'hidden';
  imgWorld.appendChild(container);

  measureFit();
  window.addEventListener('resize', measureFit);
  document.fonts?.ready.then(measureFit);
}

// Update chapter based on discrete section system
export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !container) return;
  const goingForward = targetSection > currentSection;

  let containerZ = REST_Z;
  let containerOpacity = 0;
  let containerScale = 1;

  if (isTransitioning) {
    if (sectionIndex === currentSection) {
      // Current section, animating away
      if (goingForward) {
        containerZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
        containerScale = 1 + transitionProgress * 0.5;
        containerOpacity = Math.max(0, 1 - transitionProgress * 2);
      } else {
        containerZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
        containerScale = 1 - transitionProgress * 0.3;
        containerOpacity = 1 - transitionProgress;
      }
      // Reset entrance animation once mostly gone
      if (transitionProgress > 0.5 && animated) {
        animated = false;
        container.classList.remove('animate-in');
      }
    } else if (sectionIndex === targetSection) {
      // Target section, approaching
      if (goingForward) {
        containerZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
        containerScale = 0.7 + transitionProgress * 0.3;
      } else {
        containerZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
        containerScale = 1.5 - transitionProgress * 0.5;
      }
      containerOpacity = transitionProgress;

      if (transitionProgress > 0.8 && !animated) {
        animated = true;
        container.classList.add('animate-in');
      }
    }
  } else if (sectionIndex === currentSection) {
    // At rest
    containerZ = REST_Z + elasticOffset * 500;
    containerOpacity = 1;

    if (!animated) {
      animated = true;
      container.classList.add('animate-in');
    }

    // Apply scroll anticipation
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

  // Match parallax to text container in content.js
  const offsetX = mouse.x * 8;
  const offsetY = -mouse.y * 2;

  container.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale * fitScale})`;
  container.style.opacity = Math.max(0, Math.min(1, containerOpacity));
  container.style.visibility = containerOpacity > 0.01 ? 'visible' : 'hidden';
}

// Cleanup chapter DOM
export function destroy() {
  window.removeEventListener('resize', measureFit);
  if (container) container.remove();
  container = null;
  sectionIndex = -1;
  animated = false;

  const styles = document.getElementById('director-chapter-styles');
  if (styles) styles.remove();
}

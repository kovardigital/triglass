/* ==========================================================================
   Liftoff - INVESTMENT DISCLOSURES Chapter
   Ryan's disclosures, text exactly as he sent it (11/2026)
   ========================================================================== */

// Uses discrete section system from content.js

const ITEMS = [
  ["Confidentiality.", "This presentation is confidential, intended solely for authorized prospective investors, and may not be reproduced or distributed without the prior written consent of Liftoff Film LLC (the “Company”)."],
  ["Investment Risk.", "An investment in Liftoff is speculative and involves substantial risk, including the potential loss of the entire investment. There is no guarantee that the film will be completed, obtain distribution, generate revenue, or provide any financial return."],
  ["No Guaranteed Returns.", "Any projected revenues, investment returns, or recoupment percentages are estimates or contractual distribution priorities, not guarantees of repayment or profitability."],
  ["Forward-Looking Statements.", "Financial projections, production schedules, distribution strategies, and other forward-looking statements are based on assumptions and expectations that may not materialize. Actual results may differ materially."],
  ["Private Offering.", "Any investment interests offered have not been registered under federal or state securities laws and are intended to be offered pursuant to an applicable exemption from registration. Such interests will be subject to transfer and resale restrictions."],
  ["Definitive Agreements.", "This presentation is for informational purposes only and does not contain all information material to an investment decision. Any investment will be governed by definitive offering documents and agreements. Prospective investors should consult their own legal, tax, and financial advisers before investing."],
];

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
  if (document.getElementById('disclosures-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'disclosures-chapter-styles';
  style.textContent = `
    /* Hide default title/subtitle - this slide renders its own */
    .liftoff-text.disclosures-layout,
    .liftoff-preview.preview-disclosures {
      display: none;
    }

    .disclosures-container {
      position: absolute;
      width: 880px;
      transform-style: preserve-3d;
      pointer-events: none;
      font-family: 'montserrat', sans-serif;
      color: rgba(255, 255, 255, 0.85);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .disclosures-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(24px, 3.6vw, 42px);
      font-weight: 400;
      color: #d4d4d4;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      text-align: center;
      margin: 0 0 22px;
    }
    .disclosures-panel {
      padding: 28px 36px 22px;
      border-radius: 18px;
      background: rgba(10, 14, 24, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.12);
      column-count: 2;
      column-gap: 44px;
      column-rule: 1px solid rgba(255, 255, 255, 0.07);
    }
    .disclosures-panel p {
      break-inside: avoid;
      font-size: 12.5px;
      font-weight: 500;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.75);
      margin: 0 0 13px;
    }
    .disclosures-panel strong {
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
    }

    /* Staggered entrance */
    .disclosures-reveal {
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .animate-in .disclosures-reveal {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

function build() {
  container.innerHTML = `
    <h1 class="disclosures-title">Investment Disclosures</h1>
    <div class="disclosures-panel disclosures-reveal" style="transition-delay: 0.2s">
      ${ITEMS.map(([lead, text]) => `<p><strong>${lead}</strong> ${text}</p>`).join('')}
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

  sectionIndex = sections.findIndex(s => s.disclosuresLayout);
  if (sectionIndex < 0) {
    console.warn('[DISCLOSURES] Could not find section with disclosuresLayout');
    return;
  }

  container = document.createElement('div');
  container.className = 'disclosures-container';
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

  const styles = document.getElementById('disclosures-chapter-styles');
  if (styles) styles.remove();
}

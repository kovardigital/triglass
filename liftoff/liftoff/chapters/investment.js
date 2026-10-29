/* ==========================================================================
   Liftoff - INVESTMENT + WATERFALL Chapters
   Capital & investor economics, from the Liftoff Investment Brief (V5, slide 02)
   - INVESTMENT: how the budget is raised (Series A/B/C) + earmarked revenue
   - WATERFALL: the order in which revenue is paid back out
   ========================================================================== */

// Uses discrete section system from content.js

// Capital stack - amounts as stated in the Investment Brief
const TOTAL_BUDGET = 1940000;
const MIN_INVESTMENT = 50000;
const ROUNDS = [
  { id: 'a', label: 'Series A', status: 'Raised', amount: 508000 },
  { id: 'b', label: 'Series B', status: 'Now raising', amount: 775000 },
  { id: 'c', label: 'Series C', status: 'Future', amount: 657000 },
];

// Earmarked revenue (contingent - see footnote)
const EARMARKED = [
  { amount: 500000, label: 'Distribution minimum guarantee', note: 'pending final agreement' },
  { amount: 291300, label: 'Minnesota tax incentive', note: 'pending equal production spend' },
];

// Waterfall tiers, in payment order
const TIERS = [
  {
    tag: 'First dollar',
    title: 'Series B Recoupment — 120%',
    body: "Available proceeds are first distributed to investors pro rata and pari passu until each investor has received 120% of the investor's original contribution.",
  },
  {
    tag: 'Then',
    title: 'Permitted Deferrals',
    body: 'Thereafter, available proceeds are applied pro rata and pari passu to approved deferred fees.',
  },
  {
    tag: 'Net profits',
    title: 'Net Profits — 50% / 50%',
    body: 'Remaining Net Profits are divided 50% to the Investor Share and 50% to the Producers Pool. Each investor participates in the Investor Share pro rata.',
    split: true,
  },
];

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;

// One entry per slide this module owns
const slides = [
  { layout: 'investmentLayout', build: buildInvestment, sectionIndex: -1, container: null, animated: false },
  { layout: 'waterfallLayout', build: buildWaterfall, sectionIndex: -1, container: null, animated: false },
];

// Format currency as exact dollars (e.g., 775000 -> "$775,000")
function formatCurrency(amount) {
  return '$' + Math.round(amount).toLocaleString('en-US');
}

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('investment-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'investment-chapter-styles';
  style.textContent = `
    /* Hide default title/subtitle - these slides render their own */
    .liftoff-text.investment-layout,
    .liftoff-text.waterfall-layout,
    .liftoff-preview.preview-investment,
    .liftoff-preview.preview-waterfall {
      display: none;
    }

    .invest-container {
      position: absolute;
      width: 760px;
      transform-style: preserve-3d;
      pointer-events: none;
      font-family: 'montserrat', sans-serif;
      color: rgba(255, 255, 255, 0.85);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .invest-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(24px, 3.6vw, 42px);
      font-weight: 400;
      color: #d4d4d4;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      text-align: center;
      margin: 0 0 8px;
    }
    .invest-lede {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
      margin: 0 0 36px;
    }
    .invest-lede strong {
      color: rgba(255, 255, 255, 0.95);
      font-weight: 600;
    }
    .invest-eyebrow {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
      margin: 0 0 14px;
    }
    .invest-footnote {
      font-size: 10px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.4);
      line-height: 1.5;
      margin: 24px 0 0;
      text-align: center;
    }

    /* Staggered entrance */
    .invest-reveal {
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .animate-in .invest-reveal {
      opacity: 1;
      transform: translateY(0);
    }

    /* ----- Capital stack ----- */
    .invest-stack {
      display: flex;
      gap: 4px;
      height: 52px;
      margin-bottom: 14px;
    }
    .invest-stack-seg {
      position: relative;
      border-radius: 26px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .invest-stack-fill {
      position: absolute;
      inset: 4px;
      border-radius: 22px;
      transform: scaleX(0);
      transform-origin: left center;
      transition: transform 1.1s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .animate-in .invest-stack-fill {
      transform: scaleX(1);
    }
    .invest-stack-seg.a .invest-stack-fill { background: rgba(155, 89, 182, 0.8); }
    .invest-stack-seg.b .invest-stack-fill { background: rgba(254, 208, 3, 0.85); transition-delay: 0.35s; }
    .invest-stack-seg.c .invest-stack-fill {
      background: repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0 6px, rgba(255,255,255,0.03) 6px 12px);
      transition-delay: 0.7s;
    }
    .invest-stack-seg.b {
      border-color: rgba(254, 208, 3, 0.6);
      box-shadow: 0 0 24px rgba(254, 208, 3, 0.25);
    }

    .invest-stack-labels {
      display: flex;
      gap: 4px;
      margin-bottom: 40px;
    }
    .invest-stack-label {
      padding: 0 6px;
    }
    .invest-stack-label .round {
      display: block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.55);
    }
    .invest-stack-label .amount {
      display: block;
      font-size: 22px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      margin: 2px 0;
      font-variant-numeric: tabular-nums;
    }
    .invest-stack-label .status {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
    }
    .invest-stack-label.b .amount { color: #FED003; }
    .invest-stack-label.b .status { color: rgba(255, 255, 255, 0.85); }

    /* ----- Earmarked revenue ----- */
    .invest-earmarked {
      padding: 22px 26px;
      border-radius: 16px;
      background: rgba(10, 14, 24, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .invest-earmarked-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      align-items: baseline;
      gap: 16px;
      padding: 6px 0;
    }
    .invest-earmarked-row .amount {
      font-size: 20px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .invest-earmarked-row .label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.85);
    }
    .invest-earmarked-row .note {
      color: rgba(255, 255, 255, 0.5);
    }
    .invest-earmarked-row.total {
      margin-top: 8px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }
    .invest-earmarked-row.total .amount { color: #FED003; }

    /* ----- Waterfall ----- */
    .invest-tiers {
      position: relative;
    }
    .invest-tier {
      position: relative;
      width: 560px;
      padding: 14px 22px;
      border-radius: 16px;
      background: rgba(10, 14, 24, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .invest-tier + .invest-tier {
      margin-top: 22px;
    }
    .invest-tier:nth-child(2) { margin-left: 100px; }
    .invest-tier:nth-child(3) { margin-left: 200px; }
    .invest-tier:nth-child(1) { border-top: 3px solid rgba(254, 208, 3, 0.85); }
    .invest-tier:nth-child(2) { border-top: 3px solid rgba(255, 255, 255, 0.5); }
    .invest-tier:nth-child(3) { border-top: 3px solid rgba(60, 200, 200, 0.8); }
    /* Flow arrow from each tier down into the next */
    .invest-tier + .invest-tier::before {
      content: '';
      position: absolute;
      left: -50px;
      top: -36px;
      width: 50px;
      height: 58px;
      border-left: 1px solid rgba(255, 255, 255, 0.3);
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      border-bottom-left-radius: 14px;
    }
    .invest-tier + .invest-tier::after {
      content: '';
      position: absolute;
      left: -8px;
      top: 17px;
      border: 5px solid transparent;
      border-left: 7px solid rgba(255, 255, 255, 0.5);
    }
    .invest-tier-head {
      display: flex;
      align-items: baseline;
      gap: 14px;
      margin-bottom: 6px;
    }
    .invest-tier-num {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 22px;
      color: rgba(255, 255, 255, 0.45);
    }
    .invest-tier-title {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.95);
    }
    .invest-tier-tag {
      margin-left: auto;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.45);
      white-space: nowrap;
    }
    .invest-tier-body {
      font-size: 12.5px;
      font-weight: 500;
      line-height: 1.55;
      color: rgba(255, 255, 255, 0.75);
      margin: 0;
    }
    .invest-split {
      display: flex;
      gap: 4px;
      margin-top: 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .invest-split span {
      flex: 1;
      padding: 6px 12px;
      border-radius: 8px;
      text-align: center;
      color: rgba(255, 255, 255, 0.95);
    }
    .invest-split .investors { background: rgba(254, 208, 3, 0.28); border: 1px solid rgba(254, 208, 3, 0.6); }
    .invest-split .producers { background: rgba(60, 200, 200, 0.22); border: 1px solid rgba(60, 200, 200, 0.6); }

    .invest-example {
      margin: 22px 0 0;
      padding: 12px 18px;
      border-radius: 12px;
      border: 1px solid rgba(254, 208, 3, 0.35);
      background: rgba(254, 208, 3, 0.06);
      font-size: 12.5px;
      font-weight: 500;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.8);
    }
    .invest-container.waterfall .invest-lede {
      margin-bottom: 24px;
    }
    .invest-container.waterfall .invest-footnote {
      margin-top: 14px;
    }
    .invest-example strong {
      color: #FED003;
      font-weight: 700;
    }
  `;
  document.head.appendChild(style);
}

// INVESTMENT slide: capital stack + earmarked revenue
function buildInvestment(container) {
  const stackSegs = ROUNDS.map(r =>
    `<div class="invest-stack-seg ${r.id}" style="flex: ${r.amount} 1 0"><div class="invest-stack-fill"></div></div>`
  ).join('');
  const stackLabels = ROUNDS.map(r => `
    <div class="invest-stack-label ${r.id}" style="flex: ${r.amount} 1 0">
      <span class="round">${r.label}</span>
      <span class="amount">${formatCurrency(r.amount)}</span>
      <span class="status">${r.status}${r.id === 'b' ? ` · Min. ${formatCurrency(MIN_INVESTMENT)}` : ''}</span>
    </div>`
  ).join('');

  const earmarkedTotal = EARMARKED.reduce((sum, e) => sum + e.amount, 0);
  const earmarkedRows = EARMARKED.map(e => `
    <div class="invest-earmarked-row">
      <span class="amount">${formatCurrency(e.amount)}</span>
      <span class="label">${e.label} <span class="note">(${e.note})</span></span>
    </div>`
  ).join('');

  container.innerHTML = `
    <h1 class="invest-title">Investment</h1>
    <p class="invest-lede">A <strong>${formatCurrency(TOTAL_BUDGET)}</strong> total budget, raised in three rounds</p>
    <div class="invest-stack">${stackSegs}</div>
    <div class="invest-stack-labels invest-reveal">${stackLabels}</div>
    <div class="invest-earmarked invest-reveal" style="transition-delay: 0.5s">
      <p class="invest-eyebrow">Earmarked revenue*</p>
      ${earmarkedRows}
      <div class="invest-earmarked-row total">
        <span class="amount">${formatCurrency(earmarkedTotal)}</span>
        <span class="label">Identified so far</span>
      </div>
    </div>
    <p class="invest-footnote">*Earmarked revenue is contingent on final agreements and production spend and is not guaranteed.<br>Definitive rights and obligations are governed exclusively by the executed investment documents.</p>
  `;
}

// WATERFALL slide: payment order, first dollar through net profits
function buildWaterfall(container) {
  const tiers = TIERS.map((t, i) => `
    <div class="invest-tier invest-reveal" style="transition-delay: ${0.15 + i * 0.3}s">
      <div class="invest-tier-head">
        <span class="invest-tier-num">0${i + 1}</span>
        <span class="invest-tier-title">${t.title}</span>
        <span class="invest-tier-tag">${t.tag}</span>
      </div>
      <p class="invest-tier-body">${t.body}</p>
      ${t.split ? '<div class="invest-split"><span class="investors">50% Investor Share</span><span class="producers">50% Producers Pool</span></div>' : ''}
    </div>`
  ).join('');

  const example = MIN_INVESTMENT;
  container.innerHTML = `
    <h1 class="invest-title">Waterfall</h1>
    <p class="invest-lede">Available revenue is applied in order, from first dollar through net profits.</p>
    <div class="invest-tiers">${tiers}</div>
    <p class="invest-example invest-reveal" style="transition-delay: 1.1s">
      <strong>Example:</strong> a ${formatCurrency(example)} Series B investment has a 120% recoupment target of
      <strong>${formatCurrency(example * 1.2)}</strong> before deferred fees are paid, then shares pro rata in the 50% Investor Share of net profits.
      This is a recoupment priority, not a guarantee of return.
    </p>
    <p class="invest-footnote">Definitive rights and obligations are governed exclusively by the executed investment documents.</p>
  `;
}

// Initialize chapter DOM elements
export function init(imgWorld, sections) {
  injectStyles();

  slides.forEach(slide => {
    slide.sectionIndex = sections.findIndex(s => s[slide.layout]);
    if (slide.sectionIndex < 0) {
      console.warn(`[INVESTMENT] Could not find section with ${slide.layout}`);
      return;
    }
    slide.container = document.createElement('div');
    slide.container.className = 'invest-container' + (slide.layout === 'waterfallLayout' ? ' waterfall' : '');
    slide.build(slide.container);
    slide.container.style.opacity = 0;
    slide.container.style.visibility = 'hidden';
    imgWorld.appendChild(slide.container);
  });
}

// Update chapter based on discrete section system
export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  const goingForward = targetSection > currentSection;

  slides.forEach(slide => {
    const { sectionIndex, container } = slide;
    if (sectionIndex < 0 || !container) return;

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
        if (transitionProgress > 0.5 && slide.animated) {
          slide.animated = false;
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

        if (transitionProgress > 0.8 && !slide.animated) {
          slide.animated = true;
          container.classList.add('animate-in');
        }
      }
    } else if (sectionIndex === currentSection) {
      // At rest
      containerZ = REST_Z + elasticOffset * 500;
      containerOpacity = 1;

      if (!slide.animated) {
        slide.animated = true;
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

    container.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
    container.style.opacity = Math.max(0, Math.min(1, containerOpacity));
    container.style.visibility = containerOpacity > 0.01 ? 'visible' : 'hidden';
  });
}

// Cleanup chapter DOM
export function destroy() {
  slides.forEach(slide => {
    if (slide.container) slide.container.remove();
    slide.container = null;
    slide.sectionIndex = -1;
    slide.animated = false;
  });

  const styles = document.getElementById('investment-chapter-styles');
  if (styles) styles.remove();
}

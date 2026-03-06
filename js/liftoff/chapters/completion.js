/* ==========================================================================
   Liftoff - COMPLETION Chapter
   Animated progress bar showing production completion percentage
   ========================================================================== */

// Uses discrete section system from content.js

// Chapter configuration
export const config = {
  title: 'COMPLETION',
  subtitle: '',
  completionLayout: true,
  images: []
};

// Progress bar configuration
const COMPLETION_PERCENT = 23; // Current completion percentage
const BUDGET_RAISED = 250000; // Amount raised
const BUDGET_NEEDED = 1750000; // Total budget needed
const BUDGET_PERCENT = (BUDGET_RAISED / BUDGET_NEEDED) * 100;
const BAR_WIDTH = 660;
const BAR_HEIGHT = 52;
const BAR_OFFSET_Y = -45; // Offset from center (shared by bar track and blur backdrop)
const BUDGET_OFFSET_Y = BAR_OFFSET_Y + BAR_HEIGHT + 90; // Budget bar below completion bar

// DOM elements
let progressContainer = null;
let progressBar = null;
let percentLabel = null;
let statusText = null;
let blurBackdrop = null;
let budgetBar = null;
let budgetRaisedLabel = null;
let budgetNeededLabel = null;
let budgetBlurBackdrop = null;
let imageWorld = null;
let sectionIndex = -1;
let hasAnimated = false;
let hasBudgetAnimated = false;
let currentPercent = 0;
let currentBudgetPercent = 0;
let animationStartTime = null;
let budgetAnimationStartTime = null;

// Z positions matching content.js fly-through system
const REST_Z = 200;
const APPROACH_Z = -1400;
const DEPART_Z = 800;

// Animation timing
const ANIMATION_DURATION = 1800; // ms for bar to fill
const ANIMATION_DELAY = 400; // ms delay before animation starts

// Inject chapter-specific styles
function injectStyles() {
  if (document.getElementById('completion-chapter-styles')) return;

  const style = document.createElement('style');
  style.id = 'completion-chapter-styles';
  style.textContent = `
    /* Completion layout - title above progress bar */
    .liftoff-text.completion-layout {
      top: calc(50% - 140px);
      max-width: none;
      width: 100vw;
    }
    .liftoff-text.completion-layout h1 {
      font-size: clamp(26px, 4.2vw, 52px);
    }
    .liftoff-text.completion-layout p {
      display: none;
    }

    /* Preview styling for completion */
    .liftoff-preview.preview-completion {
      top: calc(50% - 140px);
      max-width: none;
      width: 100vw;
    }
    .liftoff-preview.preview-completion h1 {
      font-size: clamp(26px, 4.2vw, 52px);
    }
    .liftoff-preview.preview-completion p {
      display: none;
    }

    /* Progress bar container */
    .completion-progress {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
    }

    /* Bar track positioned at BAR_OFFSET_Y from center */
    .completion-bar-wrapper {
      position: absolute;
      left: 0;
      top: ${BAR_OFFSET_Y}px;
      transform: translate(-50%, -50%);
    }

    /* Status text positioned below bar */
    .completion-status-wrapper {
      position: absolute;
      left: 0;
      top: ${BAR_OFFSET_Y + BAR_HEIGHT / 2 + 20}px;
      transform: translateX(-50%);
      white-space: nowrap;
    }

    /* Blur backdrop - separate element for proper backdrop-filter during transitions */
    .completion-blur-backdrop {
      position: absolute;
      width: ${BAR_WIDTH}px;
      height: ${BAR_HEIGHT}px;
      border-radius: ${BAR_HEIGHT / 2}px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      pointer-events: none;
    }

    /* Progress bar track */
    .completion-bar-track {
      position: relative;
      width: ${BAR_WIDTH}px;
      height: ${BAR_HEIGHT}px;
      border-radius: ${BAR_HEIGHT / 2}px;
      overflow: hidden;
    }

    /* Gradient border effect */
    .completion-bar-track::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: ${BAR_HEIGHT / 2}px;
      padding: 1px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.3) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      pointer-events: none;
    }

    /* Progress bar fill - teal matching schedule Post-Production */
    .completion-bar-fill {
      position: absolute;
      top: 4px;
      left: 4px;
      height: calc(100% - 8px);
      width: 0px;
      background: rgba(60, 200, 200, 0.8);
      border-radius: ${(BAR_HEIGHT - 8) / 2}px;
    }

    /* Percent labels container */
    .completion-labels {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      transform: translateY(-50%);
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      pointer-events: none;
    }

    /* Current percent label */
    .completion-percent {
      font-family: 'montserrat', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 0 10px rgba(60, 200, 220, 0.5);
      letter-spacing: 0.05em;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      backface-visibility: hidden;
    }

    /* 100% label */
    .completion-max {
      font-family: 'montserrat', sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 0.05em;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      backface-visibility: hidden;
    }

    /* Status text below bar */
    .completion-status {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(13px, 1.5vw, 17px);
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      backface-visibility: hidden;
    }
    .completion-status strong {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
    }

    /* Budget bar wrapper */
    .budget-bar-wrapper {
      position: absolute;
      left: 0;
      top: ${BUDGET_OFFSET_Y}px;
      transform: translate(-50%, -50%);
      opacity: 0;
    }

    /* Budget blur backdrop for completion section (different from budget chapter's backdrop) */
    .completion-budget-backdrop {
      position: absolute;
      width: ${BAR_WIDTH}px;
      height: ${BAR_HEIGHT}px;
      border-radius: ${BAR_HEIGHT / 2}px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      pointer-events: none;
    }

    /* Budget bar fill - purple matching schedule Prep/Construction */
    .budget-bar-fill {
      position: absolute;
      top: 4px;
      left: 4px;
      height: calc(100% - 8px);
      width: 0px;
      background: rgba(155, 89, 182, 0.8);
      border-radius: ${(BAR_HEIGHT - 8) / 2}px;
    }

    /* Budget labels */
    .budget-labels {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      transform: translateY(-50%);
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      pointer-events: none;
    }

    .budget-raised {
      font-family: 'montserrat', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 0 10px rgba(100, 140, 220, 0.5);
      letter-spacing: 0.05em;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      backface-visibility: hidden;
    }

    .budget-needed {
      font-family: 'montserrat', sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 0.05em;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      backface-visibility: hidden;
    }
  `;
  document.head.appendChild(style);
}

// Easing function for smooth animation
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Format currency (e.g., 1500000 -> "1.5M", 1750000 -> "1.75M", 250000 -> "250K")
function formatCurrency(amount) {
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    // Use 2 decimal places if needed (e.g., 1.75M), otherwise 1 (e.g., 1.5M)
    const formatted = millions % 0.1 !== 0 ? millions.toFixed(2) : millions.toFixed(1);
    return '$' + formatted + 'M';
  } else if (amount >= 1000) {
    return '$' + Math.round(amount / 1000) + 'K';
  }
  return '$' + amount;
}

// Initialize chapter DOM elements
export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.completionLayout);
  if (sectionIndex < 0) {
    console.warn('[COMPLETION] Could not find COMPLETION section');
    return;
  }

  // Store reference to imgWorld for backdrop positioning
  imageWorld = imgWorld;

  // Create blur backdrop element (appended directly to imgWorld for proper backdrop-filter)
  blurBackdrop = document.createElement('div');
  blurBackdrop.className = 'completion-blur-backdrop';
  blurBackdrop.style.opacity = 0;
  imgWorld.appendChild(blurBackdrop);

  // Create progress container
  progressContainer = document.createElement('div');
  progressContainer.className = 'completion-progress';

  // Create bar wrapper (positioned at BAR_OFFSET_Y)
  const barWrapper = document.createElement('div');
  barWrapper.className = 'completion-bar-wrapper';

  // Create progress bar track
  const barTrack = document.createElement('div');
  barTrack.className = 'completion-bar-track';

  // Create progress bar fill
  progressBar = document.createElement('div');
  progressBar.className = 'completion-bar-fill';
  barTrack.appendChild(progressBar);

  // Create labels container
  const labelsContainer = document.createElement('div');
  labelsContainer.className = 'completion-labels';

  // Current percent label
  percentLabel = document.createElement('span');
  percentLabel.className = 'completion-percent';
  percentLabel.textContent = '0%';
  labelsContainer.appendChild(percentLabel);

  // 100% label
  const maxLabel = document.createElement('span');
  maxLabel.className = 'completion-max';
  maxLabel.textContent = '100%';
  labelsContainer.appendChild(maxLabel);

  barTrack.appendChild(labelsContainer);
  barWrapper.appendChild(barTrack);
  progressContainer.appendChild(barWrapper);

  // Create status wrapper (positioned below bar)
  const statusWrapper = document.createElement('div');
  statusWrapper.className = 'completion-status-wrapper';

  // Status text
  statusText = document.createElement('p');
  statusText.className = 'completion-status';
  statusText.innerHTML = `Liftoff is currently <strong>${COMPLETION_PERCENT}% complete</strong> in production & post.`;
  statusWrapper.appendChild(statusText);
  progressContainer.appendChild(statusWrapper);

  // Create budget blur backdrop (appended directly to imgWorld)
  budgetBlurBackdrop = document.createElement('div');
  budgetBlurBackdrop.className = 'completion-budget-backdrop';
  budgetBlurBackdrop.style.opacity = 0;
  budgetBlurBackdrop.style.visibility = 'hidden';
  imgWorld.appendChild(budgetBlurBackdrop);

  // Create budget bar wrapper
  const budgetWrapper = document.createElement('div');
  budgetWrapper.className = 'budget-bar-wrapper';

  // Create budget bar track (reuse completion-bar-track class)
  const budgetTrack = document.createElement('div');
  budgetTrack.className = 'completion-bar-track';

  // Create budget bar fill
  budgetBar = document.createElement('div');
  budgetBar.className = 'budget-bar-fill';
  budgetTrack.appendChild(budgetBar);

  // Create budget labels container
  const budgetLabelsContainer = document.createElement('div');
  budgetLabelsContainer.className = 'budget-labels';

  // Raised label
  budgetRaisedLabel = document.createElement('span');
  budgetRaisedLabel.className = 'budget-raised';
  budgetRaisedLabel.textContent = '$0';
  budgetLabelsContainer.appendChild(budgetRaisedLabel);

  // Needed label
  budgetNeededLabel = document.createElement('span');
  budgetNeededLabel.className = 'budget-needed';
  budgetNeededLabel.textContent = formatCurrency(BUDGET_NEEDED) + ' Needed';
  budgetLabelsContainer.appendChild(budgetNeededLabel);

  budgetTrack.appendChild(budgetLabelsContainer);
  budgetWrapper.appendChild(budgetTrack);
  progressContainer.appendChild(budgetWrapper);

  progressContainer.style.opacity = 0;
  imgWorld.appendChild(progressContainer);

  console.log('[COMPLETION] Chapter initialized');
}

// Animate the progress bar
function animateProgress(timestamp) {
  if (!animationStartTime) {
    animationStartTime = timestamp;
  }

  const elapsed = timestamp - animationStartTime - ANIMATION_DELAY;

  if (elapsed < 0) {
    // Still in delay period
    requestAnimationFrame(animateProgress);
    return;
  }

  const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
  const easedProgress = easeOutCubic(progress);
  currentPercent = Math.round(easedProgress * COMPLETION_PERCENT);

  // Calculate fill width in pixels (fillable area is BAR_WIDTH - 8 for padding)
  const fillableWidth = BAR_WIDTH - 8;
  const fillWidth = (easedProgress * COMPLETION_PERCENT / 100) * fillableWidth;

  // Update bar fill width
  progressBar.style.width = `${fillWidth}px`;

  // Update percent label
  percentLabel.textContent = `${currentPercent}%`;

  if (progress < 1) {
    requestAnimationFrame(animateProgress);
  } else if (!hasBudgetAnimated) {
    // Start budget animation after completion finishes
    hasBudgetAnimated = true;
    requestAnimationFrame(animateBudget);
  }
}

// Animate the budget bar
function animateBudget(timestamp) {
  if (!budgetAnimationStartTime) {
    budgetAnimationStartTime = timestamp;
    // Fade in the budget bar wrapper
    const budgetWrapper = document.querySelector('.budget-bar-wrapper');
    if (budgetWrapper) {
      budgetWrapper.style.transition = 'opacity 0.5s ease-out';
      budgetWrapper.style.opacity = 1;
    }
  }

  const elapsed = timestamp - budgetAnimationStartTime - 300; // Small delay after fade in

  if (elapsed < 0) {
    requestAnimationFrame(animateBudget);
    return;
  }

  const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
  const easedProgress = easeOutCubic(progress);
  const currentRaised = Math.round(easedProgress * BUDGET_RAISED);
  currentBudgetPercent = easedProgress * BUDGET_PERCENT;

  // Calculate fill width
  const fillableWidth = BAR_WIDTH - 8;
  const fillWidth = (currentBudgetPercent / 100) * fillableWidth;

  // Update budget bar fill
  if (budgetBar) {
    budgetBar.style.width = `${fillWidth}px`;
  }

  // Update raised label
  if (budgetRaisedLabel) {
    budgetRaisedLabel.textContent = formatCurrency(currentRaised) + ' Spent';
  }

  if (progress < 1) {
    requestAnimationFrame(animateBudget);
  }
}

// Reset animation state
function resetAnimation() {
  hasAnimated = false;
  hasBudgetAnimated = false;
  animationStartTime = null;
  budgetAnimationStartTime = null;
  currentPercent = 0;
  currentBudgetPercent = 0;
  if (progressBar) {
    progressBar.style.width = '0px';
  }
  if (percentLabel) {
    percentLabel.textContent = '0%';
  }
  if (budgetBar) {
    budgetBar.style.width = '0px';
  }
  if (budgetRaisedLabel) {
    budgetRaisedLabel.textContent = '$0';
  }
  // Reset budget wrapper opacity
  const budgetWrapper = document.querySelector('.budget-bar-wrapper');
  if (budgetWrapper) {
    budgetWrapper.style.transition = 'none';
    budgetWrapper.style.opacity = 0;
  }
}

// Update chapter based on discrete section system
export function update(currentSection, targetSection, transitionProgress, isTransitioning, mouse, leanAngle, elasticOffset, scrollAnticipation) {
  if (sectionIndex < 0 || !progressContainer) return;

  const goingForward = targetSection > currentSection;

  let containerZ = REST_Z;
  let containerOpacity = 0;
  let containerScale = 1;

  if (isTransitioning) {
    if (sectionIndex === currentSection) {
      // COMPLETION is current section, animating away
      if (goingForward) {
        containerZ = REST_Z + (DEPART_Z - REST_Z) * transitionProgress;
        containerScale = 1 + transitionProgress * 0.5;
        containerOpacity = Math.max(0, 1 - transitionProgress * 2);
      } else {
        containerZ = REST_Z - (REST_Z - APPROACH_Z) * transitionProgress;
        containerScale = 1 - transitionProgress * 0.3;
        containerOpacity = 1 - transitionProgress;
      }
      // Reset animation when leaving
      if (transitionProgress > 0.5) {
        resetAnimation();
      }
    } else if (sectionIndex === targetSection) {
      // COMPLETION is target section, approaching
      if (goingForward) {
        containerZ = APPROACH_Z + (REST_Z - APPROACH_Z) * transitionProgress;
        containerScale = 0.7 + transitionProgress * 0.3;
      } else {
        containerZ = DEPART_Z - (DEPART_Z - REST_Z) * transitionProgress;
        containerScale = 1.5 - transitionProgress * 0.5;
      }
      containerOpacity = transitionProgress;

      // Start animation when approaching and nearly arrived
      if (transitionProgress > 0.8 && !hasAnimated) {
        hasAnimated = true;
        requestAnimationFrame(animateProgress);
      }
    }
  } else {
    // At rest
    if (sectionIndex === currentSection) {
      containerZ = REST_Z + elasticOffset * 500;
      containerOpacity = 1;

      // Start animation if not yet animated
      if (!hasAnimated) {
        hasAnimated = true;
        requestAnimationFrame(animateProgress);
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
  }

  // Match parallax to text container in content.js for alignment
  const offsetX = mouse.x * 8;
  const offsetY = -mouse.y * 2;

  // Apply transform to blur backdrop (directly in imgWorld with full transform for proper backdrop-filter)
  // Uses BAR_OFFSET_Y to stay aligned with bar track
  if (blurBackdrop) {
    blurBackdrop.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY + BAR_OFFSET_Y}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
    blurBackdrop.style.opacity = Math.max(0, Math.min(1, containerOpacity));
    blurBackdrop.style.visibility = containerOpacity > 0.01 ? 'visible' : 'hidden';
  }

  // Apply transform to budget blur backdrop
  if (budgetBlurBackdrop) {
    // Only show budget backdrop after budget animation starts
    const budgetOpacity = hasBudgetAnimated ? containerOpacity : 0;
    budgetBlurBackdrop.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY + BUDGET_OFFSET_Y}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
    budgetBlurBackdrop.style.opacity = Math.max(0, Math.min(1, budgetOpacity));
    budgetBlurBackdrop.style.visibility = budgetOpacity > 0.01 ? 'visible' : 'hidden';
  }

  // Apply transform to container - positioned at center (title is 100px above center)
  progressContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
  progressContainer.style.opacity = Math.max(0, Math.min(1, containerOpacity));

  // Only allow interactions when this is the active section and not transitioning
  progressContainer.style.pointerEvents = (sectionIndex === currentSection && !isTransitioning && containerOpacity > 0.5) ? 'auto' : 'none';
}

// Cleanup chapter DOM
export function destroy() {
  // Remove blur backdrops (they're in imgWorld, not progressContainer)
  if (blurBackdrop) {
    blurBackdrop.remove();
    blurBackdrop = null;
  }
  if (budgetBlurBackdrop) {
    budgetBlurBackdrop.remove();
    budgetBlurBackdrop = null;
  }

  if (progressContainer) {
    progressContainer.remove();
    progressContainer = null;
  }
  imageWorld = null;
  progressBar = null;
  percentLabel = null;
  statusText = null;
  budgetBar = null;
  budgetRaisedLabel = null;
  budgetNeededLabel = null;
  sectionIndex = -1;
  hasAnimated = false;
  hasBudgetAnimated = false;
  animationStartTime = null;
  budgetAnimationStartTime = null;
  currentPercent = 0;
  currentBudgetPercent = 0;

  const styles = document.getElementById('completion-chapter-styles');
  if (styles) styles.remove();
}

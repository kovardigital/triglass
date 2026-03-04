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
const BAR_WIDTH = 560;
const BAR_HEIGHT = 44;

// DOM elements
let progressContainer = null;
let progressBar = null;
let percentLabel = null;
let statusText = null;
let sectionIndex = -1;
let hasAnimated = false;
let currentPercent = 0;
let animationStartTime = null;

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
      top: calc(50% - 100px);
      max-width: none;
      width: 100vw;
    }
    .liftoff-text.completion-layout h1 {
      font-size: clamp(36px, 6vw, 72px);
    }
    .liftoff-text.completion-layout p {
      display: none;
    }

    /* Preview styling for completion */
    .liftoff-preview.preview-completion {
      top: calc(50% - 100px);
      max-width: none;
      width: 100vw;
    }
    .liftoff-preview.preview-completion h1 {
      font-size: clamp(36px, 6vw, 72px);
    }
    .liftoff-preview.preview-completion p {
      display: none;
    }

    /* Progress bar container */
    .completion-progress {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    /* Progress bar track */
    .completion-bar-track {
      position: relative;
      width: ${BAR_WIDTH}px;
      height: ${BAR_HEIGHT}px;
      background: rgba(20, 30, 45, 0.8);
      border-radius: ${BAR_HEIGHT / 2}px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow:
        inset 0 2px 8px rgba(0, 0, 0, 0.4),
        0 2px 12px rgba(0, 0, 0, 0.3);
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

    /* Progress bar fill */
    .completion-bar-fill {
      position: absolute;
      top: 4px;
      left: 4px;
      height: calc(100% - 8px);
      width: 0px;
      background: linear-gradient(90deg,
        rgba(40, 180, 200, 0.9) 0%,
        rgba(60, 200, 220, 1) 50%,
        rgba(80, 220, 240, 0.9) 100%);
      border-radius: ${(BAR_HEIGHT - 8) / 2}px;
      box-shadow:
        0 0 20px rgba(60, 200, 220, 0.5),
        0 0 40px rgba(60, 200, 220, 0.3);
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
      font-size: 16px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 0 10px rgba(60, 200, 220, 0.5);
      letter-spacing: 0.05em;
    }

    /* 100% label */
    .completion-max {
      font-family: 'montserrat', sans-serif;
      font-size: 14px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.05em;
    }

    /* Status text below bar */
    .completion-status {
      font-family: 'montserrat', sans-serif;
      font-size: clamp(13px, 1.5vw, 17px);
      font-weight: 300;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      line-height: 1.5;
    }
    .completion-status strong {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
    }
  `;
  document.head.appendChild(style);
}

// Easing function for smooth animation
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Initialize chapter DOM elements
export function init(imgWorld, sections) {
  injectStyles();

  sectionIndex = sections.findIndex(s => s.completionLayout);
  if (sectionIndex < 0) {
    console.warn('[COMPLETION] Could not find COMPLETION section');
    return;
  }

  // Create progress container
  progressContainer = document.createElement('div');
  progressContainer.className = 'completion-progress';

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
  progressContainer.appendChild(barTrack);

  // Status text
  statusText = document.createElement('p');
  statusText.className = 'completion-status';
  statusText.innerHTML = `Liftoff is currently <strong>${COMPLETION_PERCENT}% complete</strong> in production & post.`;
  progressContainer.appendChild(statusText);

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
  }
}

// Reset animation state
function resetAnimation() {
  hasAnimated = false;
  animationStartTime = null;
  currentPercent = 0;
  if (progressBar) {
    progressBar.style.width = '0px';
  }
  if (percentLabel) {
    percentLabel.textContent = '0%';
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

  // Apply transform to container - positioned at center (title is 100px above center)
  progressContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${containerZ}px) rotate(${leanAngle}deg) scale(${containerScale})`;
  progressContainer.style.opacity = Math.max(0, Math.min(1, containerOpacity));

  // Only allow interactions when this is the active section and not transitioning
  progressContainer.style.pointerEvents = (sectionIndex === currentSection && !isTransitioning && containerOpacity > 0.5) ? 'auto' : 'none';
}

// Cleanup chapter DOM
export function destroy() {
  if (progressContainer) {
    progressContainer.remove();
    progressContainer = null;
  }
  progressBar = null;
  percentLabel = null;
  statusText = null;
  sectionIndex = -1;
  hasAnimated = false;
  animationStartTime = null;
  currentPercent = 0;

  const styles = document.getElementById('completion-chapter-styles');
  if (styles) styles.remove();
}

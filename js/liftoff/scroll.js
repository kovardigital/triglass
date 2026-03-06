/* ==========================================================================
   Liftoff - Scroll Module (Discrete Sections)
   Scroll triggers section changes with fly-through transitions
   ========================================================================== */

import { SECTION_COUNT } from './config.js';

// Section state - discrete sections instead of continuous progress
let currentSection = 0;
let targetSection = 0;
let transitionProgress = 0;  // 0 = at currentSection, 1 = arrived at targetSection
let isTransitioning = false;

// Scroll accumulation for threshold detection
let accumulatedScroll = 0;
let scrollDirection = 0; // -1 = forward, 1 = backward, 0 = none

// Transition settings
const TRANSITION_SPEED = 0.09;
const SIDEBAR_TRANSITION_SPEED = 0.05; // Slower, smoother for sidebar clicks
const SCROLL_THRESHOLD = 75;

// Track if current transition is from sidebar click
let isSidebarTransition = false;

// Elastic bounce for visual feedback
const SPRING_STIFFNESS = 0.025;
const SPRING_DAMPING = 0.94;
const ELASTIC_MAX = -0.08;
const WHEEL_FORCE = 0.00006;

let elasticOffset = 0;
let elasticVelocity = 0;
let wheelTimeout = null;
let isStretching = false;

// Decay timeout - reset scroll when user stops
let decayTimeout = null;

// Smoothed anticipation for visual feedback
let smoothedAnticipation = 0;
const ANTICIPATION_SMOOTH_FACTOR = 0.12; // Lower = smoother

// Chain cooldown - prevents inertia from triggering multiple chains
let chainCooldown = false;
let chainCooldownTimeout = null;
const CHAIN_COOLDOWN_MS = 250; // Time before another chain can happen

// Space Z movement - accumulates as user navigates, creating fly-through-space effect
let spaceZ = 0;           // Current interpolated Z position
let spaceZStart = 0;      // Z at start of transition
let spaceZTarget = 0;     // Z target for current transition
const SPACE_Z_PER_SECTION = 100; // How far to travel per section change

// Debug indicator
let debugIndicator = null;

// Reference to camera
let camera = null;

// Trigger a section change with transition
function triggerSectionChange(newSection) {
  if (newSection < 0 || newSection >= SECTION_COUNT) return;
  if (newSection === currentSection) return;

  targetSection = newSection;
  isTransitioning = true;
  isSidebarTransition = false; // Scroll uses faster transition
  transitionProgress = 0;
  accumulatedScroll = 0;

  // Set space Z target - forward = positive Z (space comes at us), backward = negative Z
  const direction = newSection > currentSection ? 1 : -1;
  spaceZStart = spaceZ;
  spaceZTarget = spaceZ + direction * SPACE_Z_PER_SECTION;

  console.log('[LIFTOFF] Transitioning to section', newSection);
}

// Wheel handler - only source of scroll detection
function onWheel(e) {
  // Accumulate scroll freely - even during transitions (allows interruption)
  // Cap per-event contribution to prevent fast scrolling from being too sensitive
  accumulatedScroll += Math.min(Math.abs(e.deltaY), 15) * Math.sign(e.deltaY);

  // Clamp to prevent over-accumulation beyond thresholds
  accumulatedScroll = Math.max(-SCROLL_THRESHOLD * 1.5, Math.min(SCROLL_THRESHOLD * 1.5, accumulatedScroll));

  // During transition: allow reversal OR chaining to next section
  if (isTransitioning) {
    const goingForward = targetSection > currentSection;

    // REVERSAL: scrolling opposite to transition direction
    if (goingForward && accumulatedScroll > SCROLL_THRESHOLD * 0.5) {
      // Scrolling backward during forward transition - reverse it
      targetSection = currentSection;
      isTransitioning = false;
      accumulatedScroll = SCROLL_THRESHOLD * 0.3; // Start with some backward momentum
    } else if (!goingForward && accumulatedScroll < -SCROLL_THRESHOLD * 0.5) {
      // Scrolling forward during backward transition - reverse it
      targetSection = currentSection;
      isTransitioning = false;
      accumulatedScroll = -SCROLL_THRESHOLD * 0.3; // Start with some forward momentum
    }
    // CHAINING: scrolling same direction past threshold - skip to next section
    // Only allow if not in cooldown AND transition is at least 40% complete
    // This prevents accidental chaining from a single scroll gesture
    else if (!chainCooldown && transitionProgress > 0.4 && goingForward && accumulatedScroll < -SCROLL_THRESHOLD && targetSection < SECTION_COUNT - 1) {
      // Snap current transition complete, start next
      currentSection = targetSection;
      targetSection = targetSection + 1;
      transitionProgress = 0;
      accumulatedScroll = 0;
      isSidebarTransition = false; // Chaining uses fast scroll speed
      // Update space Z for chained transition
      spaceZStart = spaceZ;
      spaceZTarget = spaceZ + SPACE_Z_PER_SECTION; // Forward = positive Z
      // Start cooldown to prevent inertia chaining
      chainCooldown = true;
      if (chainCooldownTimeout) clearTimeout(chainCooldownTimeout);
      chainCooldownTimeout = setTimeout(() => { chainCooldown = false; }, CHAIN_COOLDOWN_MS);
      console.log('[LIFTOFF] Chaining forward to section', targetSection);
    } else if (!chainCooldown && transitionProgress > 0.4 && !goingForward && accumulatedScroll > SCROLL_THRESHOLD && targetSection > 0) {
      // Snap current transition complete, start prev
      currentSection = targetSection;
      targetSection = targetSection - 1;
      transitionProgress = 0;
      accumulatedScroll = 0;
      isSidebarTransition = false; // Chaining uses fast scroll speed
      // Update space Z for chained transition
      spaceZStart = spaceZ;
      spaceZTarget = spaceZ - SPACE_Z_PER_SECTION; // Backward = negative Z
      // Start cooldown to prevent inertia chaining
      chainCooldown = true;
      if (chainCooldownTimeout) clearTimeout(chainCooldownTimeout);
      chainCooldownTimeout = setTimeout(() => { chainCooldown = false; }, CHAIN_COOLDOWN_MS);
      console.log('[LIFTOFF] Chaining backward to section', targetSection);
    }
    return;
  }

  // Check threshold for new transitions
  if (accumulatedScroll > SCROLL_THRESHOLD && currentSection > 0) {
    triggerSectionChange(currentSection - 1);
  } else if (accumulatedScroll < -SCROLL_THRESHOLD && currentSection < SECTION_COUNT - 1) {
    triggerSectionChange(currentSection + 1);
  }

  // Elastic stretch at boundaries
  if (currentSection === SECTION_COUNT - 1 && e.deltaY < 0) {
    isStretching = true;
    elasticVelocity += e.deltaY * WHEEL_FORCE;
    if (wheelTimeout) clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => { isStretching = false; }, 100);
  }
  if (currentSection === 0 && e.deltaY > 0) {
    isStretching = true;
    elasticVelocity -= e.deltaY * WHEEL_FORCE;
    if (wheelTimeout) clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => { isStretching = false; }, 100);
  }
}

// Initialize scroll tracking
function init(cam) {
  camera = cam;

  // Prevent browser from restoring scroll position
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  currentSection = 0;
  targetSection = 0;
  transitionProgress = 0;
  isTransitioning = false;
  accumulatedScroll = 0;
  elasticOffset = 0;
  elasticVelocity = 0;

  // Debug indicator disabled for production
  // debugIndicator = document.createElement('div');
  // debugIndicator.style.cssText = `...`;
  // document.body.appendChild(debugIndicator);

  window.addEventListener('wheel', onWheel, { passive: true });

  console.log('[LIFTOFF] Discrete scroll initialized');
}

// Scroll to starting position
function scrollToStart() {
  currentSection = 0;
  targetSection = 0;
  transitionProgress = 0;
  isTransitioning = false;
  isSidebarTransition = false;
  accumulatedScroll = 0;
  scrollDirection = 0;
  elasticOffset = 0;
  elasticVelocity = 0;
  smoothedAnticipation = 0;
  chainCooldown = false;
  spaceZ = 0;
  spaceZStart = 0;
  spaceZTarget = 0;
  if (chainCooldownTimeout) clearTimeout(chainCooldownTimeout);

  console.log('[LIFTOFF] Reset to section 0');
}

// Jump directly to a section (for sidebar clicks)
function jumpToSection(sectionIndex) {
  if (sectionIndex < 0 || sectionIndex >= SECTION_COUNT) return;
  if (sectionIndex === currentSection && !isTransitioning) return;

  // Calculate how many sections we're jumping
  const sectionDelta = sectionIndex - currentSection;
  const direction = sectionDelta > 0 ? 1 : -1;

  targetSection = sectionIndex;
  isTransitioning = true;
  isSidebarTransition = true; // Use slower, smoother transition
  transitionProgress = 0;
  accumulatedScroll = 0;

  // Set space Z target - travel proportional to number of sections jumped
  spaceZStart = spaceZ;
  spaceZTarget = spaceZ + direction * Math.abs(sectionDelta) * SPACE_Z_PER_SECTION;

  console.log('[LIFTOFF] Jumping to section', sectionIndex);
}

// Update transition state (called each frame)
function update() {
  // Animate transition
  if (isTransitioning) {
    // Ease-out animation - use slower speed for sidebar clicks
    const speed = isSidebarTransition ? SIDEBAR_TRANSITION_SPEED : TRANSITION_SPEED;
    transitionProgress += (1 - transitionProgress) * speed;

    // Interpolate space Z position during transition
    spaceZ = spaceZStart + (spaceZTarget - spaceZStart) * transitionProgress;

    // Check if transition is complete - snap sooner to avoid slow crawl at end
    if (transitionProgress > 0.96) {
      transitionProgress = 1;
      spaceZ = spaceZTarget; // Snap to exact target
      currentSection = targetSection;
      isTransitioning = false;
      isSidebarTransition = false;
      accumulatedScroll = 0;
      scrollDirection = 0;
    }
  }

  // Spring physics for elastic bounce
  if (elasticOffset !== 0 || elasticVelocity !== 0) {
    const springForce = -elasticOffset * SPRING_STIFFNESS;
    elasticVelocity += springForce;
    elasticVelocity *= SPRING_DAMPING;
    elasticOffset += elasticVelocity;

    // Clamp elastic range
    if (elasticOffset < ELASTIC_MAX) {
      elasticOffset = ELASTIC_MAX;
      elasticVelocity *= -0.3;
    }
    if (elasticOffset > -ELASTIC_MAX) {
      elasticOffset = Math.min(elasticOffset, -ELASTIC_MAX);
      if (elasticOffset > 0) elasticOffset = 0;
    }

    // Settle when close to rest
    if (Math.abs(elasticOffset) < 0.0005 && Math.abs(elasticVelocity) < 0.0001) {
      elasticOffset = 0;
      elasticVelocity = 0;
    }
  }

  // Smooth the anticipation value for visual feedback
  const rawAnticipation = isTransitioning ? 0 : Math.max(-1, Math.min(1, accumulatedScroll / SCROLL_THRESHOLD));
  smoothedAnticipation += (rawAnticipation - smoothedAnticipation) * ANTICIPATION_SMOOTH_FACTOR;

  // Settle when very close to target
  if (Math.abs(smoothedAnticipation - rawAnticipation) < 0.001) {
    smoothedAnticipation = rawAnticipation;
  }

  // Update debug indicator
  if (debugIndicator) {
    const transState = isTransitioning ? `→ ${targetSection} (${(transitionProgress * 100).toFixed(0)}%)` : 'idle';
    const anticipation = getScrollAnticipation();
    const direction = anticipation > 0 ? '← BACK' : anticipation < 0 ? 'FWD →' : '';
    debugIndicator.innerHTML = `
      Section: ${currentSection}<br>
      Transition: ${transState}<br>
      Scroll: ${accumulatedScroll.toFixed(0)} ${direction}<br>
      Anticipation: ${(anticipation * 100).toFixed(0)}%
    `;
  }
}

// === New API for discrete sections ===

// Get current section index (the one we're at or leaving from)
function getCurrentSection() {
  return currentSection;
}

// Get target section index (where we're going, or same as current if not transitioning)
function getTargetSection() {
  return targetSection;
}

// Get transition progress (0 = at current, 1 = arrived at target)
function getTransitionProgress() {
  return transitionProgress;
}

// Get transition direction (1 = forward, -1 = backward, 0 = not transitioning)
function getTransitionDirection() {
  if (!isTransitioning) return 0;
  return targetSection > currentSection ? 1 : -1;
}

// Check if currently transitioning
function isInTransition() {
  return isTransitioning;
}

// Get elastic offset for visual effects
function getElasticOffset() {
  return elasticOffset;
}

// Get scroll anticipation (0-1 range, negative = scrolling backward)
// Reduced effect - subtle visual feedback before threshold is crossed
function getScrollAnticipation() {
  return smoothedAnticipation * 0.4; // Scale down the effect
}

// Get space Z offset for 3D world movement
// This accumulates as user navigates, creating fly-through-space effect
function getSpaceZ() {
  return spaceZ;
}

// Legacy: get progress (for backwards compatibility during transition)
// Maps section + transition to 0-1 range
function getProgress() {
  const sectionWidth = 1 / (SECTION_COUNT - 1);
  const baseProgress = currentSection * sectionWidth;

  if (isTransitioning) {
    const direction = targetSection > currentSection ? 1 : -1;
    return baseProgress + direction * sectionWidth * transitionProgress;
  }

  return baseProgress;
}

// Cleanup
function destroy() {
  window.removeEventListener('wheel', onWheel);
  if (wheelTimeout) clearTimeout(wheelTimeout);
  if (decayTimeout) clearTimeout(decayTimeout);
  if (chainCooldownTimeout) clearTimeout(chainCooldownTimeout);
  if (debugIndicator) {
    debugIndicator.remove();
    debugIndicator = null;
  }
  camera = null;
}

export {
  init,
  scrollToStart,
  update,
  jumpToSection,
  destroy,
  // New discrete API
  getCurrentSection,
  getTargetSection,
  getTransitionProgress,
  getTransitionDirection,
  isInTransition,
  getElasticOffset,
  getScrollAnticipation,
  getSpaceZ,
  // Legacy
  getProgress
};

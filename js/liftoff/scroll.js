/* ==========================================================================
   Liftoff - Scroll Module
   Scroll tracking with inertia, camera Z position, elastic bounce, and snap points
   ========================================================================== */

import { SECTION_COUNT, CAMERA_START_Z, CAMERA_TRAVEL, getSectionSnapProgress } from './config.js';

// Scroll state - target is actual scroll, current lerps toward it for smoothness
let targetProgress = 0;
let currentProgress = 0;

// Inertia settings
const LERP_FACTOR = 0.08; // Lower = more inertia (0.05-0.15 feels good)

// Spring physics for elastic bounce (smooth, bouncy feel)
const SPRING_STIFFNESS = 0.025; // How quickly spring returns to rest (higher = faster)
const SPRING_DAMPING = 0.94; // Friction (lower = more bouncy, higher = more damped)
const ELASTIC_MAX = -0.12; // Max stretch distance
const WHEEL_FORCE = 0.00008; // How much wheel input adds velocity (lighter feel)

// State for elastic spring
let elasticOffset = 0; // Current position (negative = stretched back)
let elasticVelocity = 0; // Current velocity
let wheelTimeout = null;
let isStretching = false; // Are we actively being pulled?

// Snap point settings
const SNAP_THRESHOLD = 0.2; // 20% past a snap point triggers snap to next
let currentSnappedSection = 0; // Which section we're "committed" to
let isSnapping = false; // Are we currently in a snap animation?
let snapTargetProgress = null; // Track where we're snapping to
let snapCooldown = false; // Prevent immediate re-snap after arriving

// Debug indicator element
let debugIndicator = null;

// Reference to camera
let camera = null;

// Alias for cleaner code
function getSectionProgress(sectionIndex) {
  return getSectionSnapProgress(sectionIndex);
}

// Scroll handler - updates target immediately
// Inverted: scroll UP to progress (start at bottom, scroll up to advance)
function onScroll() {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = scrollHeight > 0 ? 1 - (window.scrollY / scrollHeight) : 0;

  // If snapping, check if we've arrived at the target
  if (isSnapping && snapTargetProgress !== null) {
    if (Math.abs(targetProgress - snapTargetProgress) < 0.02) {
      isSnapping = false;
      snapTargetProgress = null;
      // Brief cooldown to prevent immediate re-snap
      snapCooldown = true;
      setTimeout(() => { snapCooldown = false; }, 300);
    }
    return; // Don't check snap triggers while snapping
  }

  // Check if we should snap (only if not already snapping or cooling down)
  // TESTING: Snap between sections 0, 1, and 2 for now
  if (!isSnapping && !snapCooldown && currentSnappedSection <= 2) {
    checkSnapTrigger();
  }
}

// Check if progress has crossed a snap threshold
function checkSnapTrigger() {
  const currentSnapProgress = getSectionProgress(currentSnappedSection);

  // TESTING: Allow snapping to sections 0, 1, and 2
  const maxSnapSection = 2;

  // Check if we've moved past threshold toward next section
  if (currentSnappedSection < maxSnapSection) {
    const nextSnapProgress = getSectionProgress(currentSnappedSection + 1);
    const distanceToNext = nextSnapProgress - currentSnapProgress;
    const triggerPoint = currentSnapProgress + distanceToNext * SNAP_THRESHOLD;

    if (targetProgress > triggerPoint) {
      // Snap to next section
      snapToSection(currentSnappedSection + 1);
      return;
    }
  }

  // Check if we've moved past threshold toward previous section
  if (currentSnappedSection > 0) {
    const prevSnapProgress = getSectionProgress(currentSnappedSection - 1);
    const distanceToPrev = currentSnapProgress - prevSnapProgress;
    const triggerPoint = currentSnapProgress - distanceToPrev * SNAP_THRESHOLD;

    if (targetProgress < triggerPoint) {
      // Snap to previous section
      snapToSection(currentSnappedSection - 1);
      return;
    }
  }
}

// Smoothly scroll to a section's snap point
function snapToSection(sectionIndex) {
  if (sectionIndex < 0 || sectionIndex >= SECTION_COUNT) return;

  isSnapping = true;
  currentSnappedSection = sectionIndex;

  const targetSnapProg = getSectionProgress(sectionIndex);
  snapTargetProgress = targetSnapProg; // Track where we're snapping to

  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  // Invert: progress 0 = bottom, progress 1 = top
  const targetScrollY = (1 - targetSnapProg) * scrollHeight;

  // Use smooth scroll behavior
  window.scrollTo({
    top: targetScrollY,
    behavior: 'smooth'
  });

  // Fallback: clear snapping flag after max animation time
  setTimeout(() => {
    if (isSnapping) {
      isSnapping = false;
      snapTargetProgress = null;
      snapCooldown = true;
      setTimeout(() => { snapCooldown = false; }, 300);
    }
  }, 1000);

  console.log('[LIFTOFF] Snapping to section', sectionIndex, 'at progress', targetSnapProg.toFixed(2));
}

// Wheel handler - for elastic effect at boundaries
function onWheel(e) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const atBottom = window.scrollY >= maxScroll - 2;

  // If at bottom and scrolling DOWN (positive deltaY = scroll down), apply elastic
  if (atBottom && e.deltaY > 0) {
    isStretching = true;

    // Add velocity based on wheel input (creates smooth acceleration)
    elasticVelocity -= e.deltaY * WHEEL_FORCE;

    // Clear any existing timeout
    if (wheelTimeout) clearTimeout(wheelTimeout);

    // Mark as no longer stretching after wheel stops
    wheelTimeout = setTimeout(() => {
      isStretching = false;
    }, 100);
  }
}

// Initialize scroll tracking
function init(cam) {
  camera = cam;

  // Prevent browser from restoring scroll position on refresh
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  targetProgress = 0;
  currentProgress = 0;
  elasticOffset = 0;
  elasticVelocity = 0;
  isStretching = false;

  // Create debug indicator (top-left corner)
  debugIndicator = document.createElement('div');
  debugIndicator.style.cssText = `
    position: fixed;
    top: 16px;
    left: 16px;
    background: rgba(0,0,0,0.7);
    color: #0f0;
    font-family: monospace;
    font-size: 12px;
    padding: 8px 12px;
    border-radius: 4px;
    z-index: 9999;
    pointer-events: none;
    line-height: 1.6;
  `;
  document.body.appendChild(debugIndicator);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: true });
  console.log('[LIFTOFF] Scroll tracking initialized (scroll UP to progress)');
}

// Scroll to starting position (must be called after scroll spacer is created)
function scrollToStart() {
  // Start at the bottom of the page (scroll UP to progress)
  window.scrollTo(0, document.documentElement.scrollHeight);
  targetProgress = 0;
  currentProgress = 0;
  elasticOffset = 0;
  elasticVelocity = 0;
  isStretching = false;
  currentSnappedSection = 0;
  isSnapping = false;
  snapTargetProgress = null;
  snapCooldown = false;
  console.log('[LIFTOFF] Scrolled to start position (bottom)');
}

// Jump directly to a section (for sidebar clicks) - immediate snap, no threshold
function jumpToSection(sectionIndex) {
  if (sectionIndex < 0 || sectionIndex >= SECTION_COUNT) return;

  currentSnappedSection = sectionIndex;
  isSnapping = true;

  const targetSnapProg = getSectionProgress(sectionIndex);
  snapTargetProgress = targetSnapProg;

  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const targetScrollY = (1 - targetSnapProg) * scrollHeight;

  window.scrollTo({
    top: targetScrollY,
    behavior: 'smooth'
  });

  // Fallback timeout
  setTimeout(() => {
    if (isSnapping) {
      isSnapping = false;
      snapTargetProgress = null;
      snapCooldown = true;
      setTimeout(() => { snapCooldown = false; }, 300);
    }
  }, 1000);

  console.log('[LIFTOFF] Jumping to section', sectionIndex);
}

// Update camera position (called each frame)
function update() {
  if (!camera) return;

  // Lerp current toward target for smooth inertia
  currentProgress += (targetProgress - currentProgress) * LERP_FACTOR;

  // Spring physics for elastic bounce
  if (elasticOffset !== 0 || elasticVelocity !== 0) {
    // Spring force pulls back toward 0
    const springForce = -elasticOffset * SPRING_STIFFNESS;

    // Apply spring force to velocity
    elasticVelocity += springForce;

    // Apply damping (friction)
    elasticVelocity *= SPRING_DAMPING;

    // Update position
    elasticOffset += elasticVelocity;

    // Clamp to max stretch
    if (elasticOffset < ELASTIC_MAX) {
      elasticOffset = ELASTIC_MAX;
      elasticVelocity *= -0.3; // Bounce off the limit
    }

    // Clamp to 0 (can't stretch forward)
    if (elasticOffset > 0) {
      elasticOffset = 0;
      elasticVelocity = 0;
    }

    // Settle when very close to rest
    if (Math.abs(elasticOffset) < 0.0005 && Math.abs(elasticVelocity) < 0.0001) {
      elasticOffset = 0;
      elasticVelocity = 0;
    }
  }

  // Only snap at the very ends (0 and 1) when extremely close
  if (targetProgress === 0 && currentProgress < 0.0001 && elasticOffset === 0) {
    currentProgress = 0;
  } else if (targetProgress === 1 && currentProgress > 0.9999) {
    currentProgress = 1;
  }

  // Combine progress with elastic offset for final position
  const effectiveProgress = currentProgress + elasticOffset;

  // Move camera forward on scroll (flying through space)
  camera.position.z = CAMERA_START_Z - effectiveProgress * CAMERA_TRAVEL;

  // Update debug indicator
  if (debugIndicator) {
    const zPos = camera.position.z.toFixed(0);
    const progress = (currentProgress * 100).toFixed(1);
    debugIndicator.innerHTML = `
      Progress: ${progress}%<br>
      Camera Z: ${zPos}<br>
      Section: ${currentSnappedSection}
    `;
  }
}

// Get current scroll progress (0 to 1) - returns the smoothed value with elastic
function getProgress() {
  return Math.max(0, currentProgress + elasticOffset);
}

// Get elastic offset for other modules to use (negative when pulled back)
function getElasticOffset() {
  return elasticOffset;
}

// Cleanup
function destroy() {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('wheel', onWheel);
  if (wheelTimeout) clearTimeout(wheelTimeout);
  if (debugIndicator) {
    debugIndicator.remove();
    debugIndicator = null;
  }
  camera = null;
}

export { init, scrollToStart, update, getProgress, getElasticOffset, jumpToSection, destroy };

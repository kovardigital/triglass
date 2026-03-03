/* ==========================================================================
   Liftoff - Content Module (Simplified)
   Text and images fly through same Z space, driven purely by scroll position
   ========================================================================== */

import * as Parallax from './parallax.js';
import * as Scroll from './scroll.js';

// Section content data
const SECTIONS = [
  {
    title: 'LIFTOFF',
    titleImage: 'https://triglass-assets.s3.amazonaws.com/image0.png',
    subtitle: 'A journey beyond the stars',
    images: []
  },
  {
    title: 'LOGLINE',
    subtitle: "As grief fractures a family, two children retreat into a magical attic built from memory and imagination while their father races against time to retrieve them from a fantasy that is slowly turning into reality.",
    images: [
      { x: -75, y: 0, width: 1920, height: 1080, scale: 0.38, label: 'Video', delay: 0, rotateY: 30, video: 'https://triglass-assets.s3.us-east-1.amazonaws.com/LadderShot_scrub.mp4' },
    ]
  },
  {
    title: 'TRAILER',
    subtitle: '',
    trailerLayout: true,
    images: [
      // HIDDEN: { x: 0, y: 5, width: 2048, height: 1025, scale: 0.35, label: 'Trailer Video', delay: 0, video: 'https://triglass-assets.s3.us-east-1.amazonaws.com/FakeTrailer_01-hd.mp4', playable: true },
    ]
  },
  {
    title: 'THE CREW',
    subtitle: 'Three experiences. One life-changing event.',
    images: [],
    zRange: 3
  },
  {
    title: 'THE STORY',
    subtitle: 'Begin The Adventure',
    images: [],
    zRange: 3
  },
  {
    title: 'COMING SOON',
    subtitle: '2026',
    images: []
  }
];

// Configuration - same Z range for text and images
const IMAGE_START_Z = -800;
const IMAGE_END_Z = 600;

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

// Track which section's text is currently displayed
let lastSectionIndex = -1;

// Track when we entered trailer section for auto-fade
let trailerEnteredTime = null;

// Inject CSS
function injectStyles() {
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
      transform-style: preserve-3d;
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
      pointer-events: auto;
    }
    .liftoff-text h1 {
      font-family: montserrat, sans-serif;
      font-size: clamp(32px, 6vw, 64px);
      font-weight: 500;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      color: #fff;
      line-height: 1.1;
    }
    /* Larger title for intro section - uses Gin font */
    .liftoff-text.intro h1 {
      font-family: gin, serif;
      font-size: clamp(60px, 15vw, 150px);
      font-weight: 400;
      color: #FED003;
      letter-spacing: -0.02em;
    }
    /* Title image for intro section */
    .liftoff-text.intro h1 img.title-image {
      max-width: clamp(300px, 60vw, 800px);
      height: auto;
      display: block;
      margin: 0 auto;
    }
    /* Intro subtitle - moved up over PNG whitespace */
    .liftoff-text.intro p {
      position: relative;
      top: clamp(-243px, calc(-40vw + 57px), -123px);
    }
    .liftoff-text p {
      font-family: 'montserrat', sans-serif;
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
      transition-delay: 1s;
    }
    .liftoff-text.intro.revealed h1 {
      opacity: 1;
      transform: scale(1);
    }
    .liftoff-text.intro.revealed p {
      opacity: 1;
      transform: translateY(0);
    }

    /* Chapter entrance animation - for non-intro sections */
    .liftoff-text:not(.intro) h1 {
      opacity: 0;
      transform: translateY(30px);
      transition: none; /* No transition when resetting */
    }
    .liftoff-text:not(.intro) p {
      opacity: 0;
      transform: translateY(20px);
      transition: none; /* No transition when resetting */
    }
    .liftoff-text:not(.intro).section-entered h1 {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.8s ease-out, transform 1s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .liftoff-text:not(.intro).section-entered p {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.7s ease-out, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
      transition-delay: 0.3s;
    }

    /* Outro section (COMING SOON) - smaller title */
    .liftoff-text.outro h1 {
      font-size: clamp(12px, 2.5vw, 24px);
      letter-spacing: 0.15em;
    }

    /* Logline section - 25% smaller text */
    .liftoff-text.logline h1 {
      font-size: clamp(24px, 4.5vw, 48px);
    }
    .liftoff-text.logline p {
      font-size: clamp(8px, 0.85vw, 10px);
      max-width: 448px;
      margin: 0 auto;
    }

    /* Trailer section - smaller title */
    .liftoff-text.trailer h1 {
      font-size: clamp(18px, 3vw, 32px);
    }

    /* Crew layout - title top, subtitle bottom */
    .liftoff-text.crew-layout {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 12vh 0 15vh 0;
    }
    .liftoff-text.crew-layout h1 {
      font-size: clamp(24px, 4vw, 48px);
      margin: 0;
      width: 100%;
      text-align: center !important;
    }
    .liftoff-text.crew-layout p {
      font-size: clamp(12px, 1.5vw, 18px);
      margin: 0;
      width: 100%;
      text-align: center !important;
    }

    /* 3D world for image placeholders */
    .liftoff-image-world {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
    }

    /* Image placeholder styling */
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

    /* Video placeholders */
    .liftoff-image video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
      image-rendering: high-quality;
      mask-image: radial-gradient(ellipse 80% 80% at center, black 50%, transparent 85%);
      -webkit-mask-image: radial-gradient(ellipse 80% 80% at center, black 50%, transparent 85%);
    }
    .liftoff-image.has-video {
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      will-change: transform;
      transform-style: preserve-3d;
      -webkit-transform-style: preserve-3d;
      border: none;
    }
    .liftoff-image.playable-video {
      pointer-events: auto;
    }
    .liftoff-image.playable-video video {
      mask-image: none;
      -webkit-mask-image: none;
      border-radius: 12px;
      pointer-events: auto;
    }

    /* Playable video play button */
    .liftoff-image .video-play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 2px solid rgba(255,255,255,0.3);
      cursor: pointer;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease-out;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 20;
    }
    .liftoff-image .video-play-btn:hover {
      background: rgba(255,255,255,0.2);
      border-color: rgba(255,255,255,0.5);
      transform: translate(-50%, -50%) scale(1.1);
    }
    .liftoff-image .video-play-btn::after {
      content: '';
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 12px 0 12px 20px;
      border-color: transparent transparent transparent rgba(255,255,255,0.9);
      margin-left: 4px;
    }
    .liftoff-image .video-play-btn.playing {
      opacity: 0;
      pointer-events: none;
    }
    .liftoff-image .video-play-btn.playing.show-pause {
      opacity: 1;
      pointer-events: auto;
    }
    .liftoff-image .video-play-btn.playing::after {
      border-width: 0;
      width: 20px;
      height: 24px;
      border-left: 6px solid rgba(255,255,255,0.9);
      border-right: 6px solid rgba(255,255,255,0.9);
      margin-left: 0;
    }

    /* Contact button - top right */
    .liftoff-contact {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 100;
      font-family: 'montserrat', sans-serif;
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
      font-family: 'montserrat', sans-serif;
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

  // Create text container
  textContainer = document.createElement('div');
  textContainer.className = 'liftoff-text intro';
  textContainer.innerHTML = `<h1></h1><p></p>`;
  titleEl = textContainer.querySelector('h1');
  subtitleEl = textContainer.querySelector('p');
  viewport.appendChild(textContainer);

  // Create 3D world for images
  imageWorld = document.createElement('div');
  imageWorld.className = 'liftoff-image-world';
  viewport.appendChild(imageWorld);

  // Create all image placeholders
  SECTIONS.forEach((sectionData, sectionIndex) => {
    if (!sectionData.images) return;

    sectionData.images.forEach((imgConfig) => {
      const img = document.createElement('div');
      img.className = 'liftoff-image';
      img.style.width = imgConfig.width + 'px';
      img.style.height = imgConfig.height + 'px';

      // Check if this is a video placeholder
      if (imgConfig.video && imgConfig.video !== 'VIDEO_URL_HERE') {
        img.classList.add('has-video');
        const video = document.createElement('video');
        video.src = imgConfig.video;
        video.playsInline = true;
        video.preload = 'auto';

        if (imgConfig.playable) {
          video.muted = false;
          video.loop = false;
          img.dataset.playable = 'true';
          img.classList.add('playable-video');

          const playBtn = document.createElement('button');
          playBtn.className = 'video-play-btn';
          let hideTimeout = null;
          let lastMouseX = 0;
          let lastMouseY = 0;

          const showPauseButton = (e) => {
            if (e && e.clientX !== undefined) {
              if (Math.abs(e.clientX - lastMouseX) < 2 && Math.abs(e.clientY - lastMouseY) < 2) return;
              lastMouseX = e.clientX;
              lastMouseY = e.clientY;
            }
            if (!video.paused) {
              playBtn.classList.add('show-pause');
              clearTimeout(hideTimeout);
              hideTimeout = setTimeout(() => playBtn.classList.remove('show-pause'), 800);
            }
          };

          playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (video.paused) {
              video.play();
              playBtn.classList.add('playing');
              playBtn.classList.remove('show-pause');
            } else {
              video.pause();
              playBtn.classList.remove('playing', 'show-pause');
              clearTimeout(hideTimeout);
            }
          });

          img.addEventListener('mouseenter', showPauseButton);
          img.addEventListener('mousemove', showPauseButton);
          video.addEventListener('mouseenter', showPauseButton);
          video.addEventListener('mousemove', showPauseButton);
          video.addEventListener('ended', () => {
            playBtn.classList.remove('playing', 'show-pause');
            clearTimeout(hideTimeout);
            video.currentTime = 0;
          });

          img.appendChild(playBtn);
        } else {
          video.muted = true;
          video.loop = false;
        }

        img.appendChild(video);
        img.dataset.hasVideo = 'true';
      } else {
        img.innerHTML += `<span>${imgConfig.label}</span>`;
      }

      // Store metadata
      img.dataset.section = sectionIndex;
      img.dataset.baseX = imgConfig.x;
      img.dataset.baseY = imgConfig.y;
      img.dataset.delay = imgConfig.delay || 0;
      img.dataset.angle = imgConfig.angle || 0;
      img.dataset.rotateY = imgConfig.rotateY || 0;
      img.dataset.scale = imgConfig.scale || 1;
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

  // Contact button
  contactBtn = document.createElement('button');
  contactBtn.className = 'liftoff-contact';
  contactBtn.textContent = 'Contact';
  contactBtn.addEventListener('click', () => {
    window.location.href = 'mailto:hello@triglass.com';
  });
  document.body.appendChild(contactBtn);

  // Copyright
  copyrightEl = document.createElement('div');
  copyrightEl.className = 'liftoff-copyright';
  copyrightEl.textContent = '\u00A9 2026 Triglass Productions';
  document.body.appendChild(copyrightEl);

  // Set initial text for intro
  setTextContent(0);

  console.log('[LIFTOFF] Content initialized with', SECTIONS.length, 'sections,', imageElements.length, 'images');
}

// Set text content with entrance animation
function setTextContent(sectionIndex) {
  const section = SECTIONS[sectionIndex];
  if (!section) return;

  // Remove entrance animation class to reset for new section
  textContainer.classList.remove('section-entered');

  // Update text content
  if (section.titleImage && sectionIndex === 0) {
    titleEl.innerHTML = `<img src="${section.titleImage}" alt="${section.title}" class="title-image">`;
  } else {
    titleEl.textContent = section.title;
  }
  subtitleEl.textContent = section.subtitle;

  // Update CSS classes for styling
  // Note: we never remove 'revealed' - once added by reveal(), it persists
  textContainer.classList.remove('intro', 'logline', 'trailer', 'outro', 'crew-layout');
  if (sectionIndex === 0) {
    textContainer.classList.add('intro');
  } else if (sectionIndex === 1) {
    textContainer.classList.add('logline');
  } else if (sectionIndex === 2) {
    textContainer.classList.add('trailer');
  } else if (sectionIndex === SECTIONS.length - 1) {
    textContainer.classList.add('outro');
  }
  if (section.crewLayout) {
    textContainer.classList.add('crew-layout');
  }

  // Trigger entrance animation immediately (for non-intro sections)
  if (sectionIndex !== 0) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        textContainer.classList.add('section-entered');
      });
    });
  }

  lastSectionIndex = sectionIndex;
}

// Update content based on scroll progress
function update(scrollProgress) {
  if (!viewport || !imageWorld) return;

  const mouse = Parallax.getMouse();
  const elasticOffset = Scroll.getElasticOffset();
  const numSections = SECTIONS.length;

  // Determine which section we're in
  const sectionFloat = scrollProgress * (numSections - 1);
  const sectionIndex = Math.min(Math.floor(sectionFloat), numSections - 1);
  const sectionProgress = sectionFloat - sectionIndex;

  // Update text content when section changes
  if (sectionIndex !== lastSectionIndex) {
    setTextContent(sectionIndex);
    // Track when we enter trailer section for auto-fade
    if (sectionIndex === 2) {
      trailerEnteredTime = performance.now();
    } else {
      trailerEnteredTime = null;
    }
  }

  // Parallax offsets
  const offsetX = mouse.x * 40;
  const offsetY = -mouse.y * 8;
  const rotZ = Parallax.getRotationZ();
  const leanAngle = rotZ * 100;

  // Calculate text Z position (same system as images)
  const sectionData = SECTIONS[sectionIndex];
  const zRange = sectionData?.zRange || 1;
  const zDistance = (IMAGE_END_Z - IMAGE_START_Z) * zRange;
  const sectionStartZ = IMAGE_START_Z - (zDistance - (IMAGE_END_Z - IMAGE_START_Z)) / 2;

  const t = Math.max(0, Math.min(1, sectionProgress));
  const textZ = sectionStartZ + zDistance * t + elasticOffset * 1000;
  const clampedZ = Math.max(-800, Math.min(950, textZ));

  // Calculate opacity - text is visible at start of section, fades out as you leave
  // (Unlike images which fade in from far away, text should be readable when you arrive)
  let textOpacity = 1;
  if (t > 0.6) {
    textOpacity = 1 - ((t - 0.6) / 0.4); // Fade out in last 40% of section
  }
  // Proximity fade when very close to camera
  if (clampedZ > 400) {
    const proximityFade = 1 - ((clampedZ - 400) / 300);
    textOpacity *= Math.max(0, proximityFade);
  }

  // Special handling for intro (section 0) - use zoom behavior
  // Start closer to camera (Z=150) so title appears larger initially
  if (sectionIndex === 0) {
    const introZ = 150 + sectionProgress * 800 + elasticOffset * 2000;
    const introOpacity = sectionProgress < 0.6 ? 1 : Math.max(0, 1 - ((sectionProgress - 0.6) / 0.3));
    // Only apply opacity if revealed
    if (textContainer.classList.contains('revealed')) {
      textContainer.style.opacity = introOpacity;
    }
    textContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${introZ}px) rotate(${leanAngle}deg)`;
    textContainer.style.pointerEvents = 'auto';
  } else if (sectionIndex === 3) {
    // Crew section - title/subtitle handled by bubbles.js with 3D projection
    // Hide the CSS text container
    textContainer.style.opacity = 0;
    textContainer.style.pointerEvents = 'none';
  } else if (sectionIndex === 4) {
    // Story section - title/subtitle handled by earth.js with 3D projection
    // Hide the CSS text container
    textContainer.style.opacity = 0;
    textContainer.style.pointerEvents = 'none';
  } else if (sectionData?.trailerLayout) {
    // Trailer section - title above video, same Z as video, auto-fade after 3s
    // Calculate video Z position (same as image Z calculation)
    const videoZ = IMAGE_START_Z + (IMAGE_END_Z - IMAGE_START_Z) * t;

    // Auto-fade: full opacity for 3 seconds, then fade out over 1 second
    let trailerOpacity = 1;
    if (trailerEnteredTime) {
      const elapsed = (performance.now() - trailerEnteredTime) / 1000;
      if (elapsed > 3) {
        trailerOpacity = Math.max(0, 1 - (elapsed - 3));
      }
    }

    // Position above the video (not too high)
    textContainer.style.opacity = trailerOpacity;
    textContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-18vh + ${offsetY}px)) translateZ(${videoZ}px) rotate(${leanAngle}deg)`;
    textContainer.style.pointerEvents = trailerOpacity < 0.1 ? 'none' : 'auto';
  } else {
    // Standard sections
    // For logline (section 1), push text ahead of the video so it doesn't clip through
    const textZOffset = sectionIndex === 1 ? 150 : 0;
    textContainer.style.opacity = textOpacity;
    textContainer.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${clampedZ + textZOffset}px) rotate(${leanAngle}deg)`;
    textContainer.style.pointerEvents = 'auto';
  }

  // Update images - same Z calculation
  imageElements.forEach((img) => {
    const imgSection = parseInt(img.dataset.section);
    const baseX = parseFloat(img.dataset.baseX);
    const baseY = parseFloat(img.dataset.baseY);
    const delay = parseFloat(img.dataset.delay) || 0;
    const baseAngle = parseFloat(img.dataset.angle) || 0;
    const baseRotateY = parseFloat(img.dataset.rotateY) || 0;
    const baseScale = parseFloat(img.dataset.scale) || 1;

    const imgSectionData = SECTIONS[imgSection];
    const imgZRange = imgSectionData?.zRange || 1;
    const imgZDistance = (IMAGE_END_Z - IMAGE_START_Z) * imgZRange;
    const imgStartZ = IMAGE_START_Z - (imgZDistance - (IMAGE_END_Z - IMAGE_START_Z)) / 2;

    let opacity = 0;
    let textReveal = 0;
    let zPos = imgStartZ;

    if (imgSection === sectionIndex) {
      const adjustedProgress = Math.max(0, (sectionProgress - delay) / (1 - delay));
      const imgT = Math.min(1, adjustedProgress);

      zPos = imgStartZ + imgZDistance * imgT;

      const isPlayable = img.dataset.playable === 'true';

      if (imgT < 0.15) {
        opacity = imgT / 0.15;
        textReveal = opacity;
      } else if (!isPlayable && imgT > 0.75) {
        // Non-playable: fade out in last 25% of section
        opacity = 1 - ((imgT - 0.75) / 0.25);
        textReveal = 1;
      } else {
        opacity = 1;
        textReveal = 1;
      }

      if (isPlayable) {
        // Playable videos: ONLY fade based on camera Z position (no imgT fade)
        // Camera goes from 0 to -5000 (standardized 1000 Z per section)
        const cameraZ = -scrollProgress * 5000;
        // Section 2 (TRAILER) is at camera Z = -2000
        const fadeStartZ = -2100; // Start fading when camera reaches this Z
        const fadeRange = 100; // Fade over 100 Z units

        if (cameraZ <= fadeStartZ) {
          const fadeProgress = Math.min(1, (fadeStartZ - cameraZ) / fadeRange);
          opacity *= (1 - fadeProgress);
        }
      } else {
        // For non-playable: use proximity-based fade
        const proximityStart = 200;
        const proximityRange = 400;
        if (zPos > proximityStart) {
          const proximityFade = 1 - ((zPos - proximityStart) / proximityRange);
          opacity *= Math.max(0, proximityFade);
        }
      }
    } else if (imgSection < sectionIndex) {
      // Past this section
      const isPlayable = img.dataset.playable === 'true';

      if (isPlayable) {
        // Playable videos: continue moving forward past their section
        // Camera goes from 0 to -5000 (standardized 1000 Z per section)
        const cameraZ = -scrollProgress * 5000;
        const fadeStartZ = -2100; // Section 2 (TRAILER) fade point
        const fadeRange = 100;

        // Continue moving at same rate as during the section
        const sectionWidth = 1 / (numSections - 1);
        const sectionEndProgress = (imgSection + 1) * sectionWidth;
        const progressPastSection = scrollProgress - sectionEndProgress;
        const zSpeed = imgZDistance / sectionWidth; // Z units per progress unit
        zPos = (imgStartZ + imgZDistance) + progressPastSection * zSpeed;

        if (cameraZ > fadeStartZ) {
          opacity = 1; // Still fully visible
        } else {
          const fadeProgress = Math.min(1, (fadeStartZ - cameraZ) / fadeRange);
          opacity = 1 - fadeProgress;
        }
      } else {
        zPos = imgStartZ + imgZDistance + 200;
        opacity = 0;
      }
    }

    const parallaxStrength = 0.5 + (1 - opacity) * 0.5;
    const imgOffsetX = baseX * 3 + mouse.x * 30 * parallaxStrength;
    const imgOffsetY = baseY * 3 + mouse.y * 25 * parallaxStrength;
    const totalAngle = leanAngle + baseAngle;

    img.style.transform = `translate(calc(-50% + ${imgOffsetX}px), calc(-50% + ${imgOffsetY}px)) translateZ(${zPos}px) rotateY(${baseRotateY}deg) rotate(${totalAngle}deg) scale(${baseScale})`;
    img.style.opacity = Math.max(0, Math.min(1, opacity));

    // Text reveal clip-path
    const textSpan = img.querySelector('span');
    if (textSpan) {
      const clipProgress = Math.max(0, Math.min(1, textReveal));
      const clipRight = 100 - (clipProgress * 100);
      textSpan.style.clipPath = `inset(0 ${clipRight}% 0 0)`;
    }

    // Scroll-scrub video
    if (img.dataset.hasVideo === 'true' && img.dataset.playable !== 'true' && imgSection === sectionIndex) {
      const video = img.querySelector('video');
      if (video && video.duration && !isNaN(video.duration)) {
        const adjustedProgress = Math.max(0, (sectionProgress - delay) / (1 - delay));
        const videoProgress = Math.min(1, Math.max(0, adjustedProgress));
        video.currentTime = videoProgress * video.duration;
      }
    }
  });
}

// Reveal intro animation (called after preloader hides)
function reveal() {
  if (!textContainer) return;
  // eslint-disable-next-line no-unused-expressions
  textContainer.offsetHeight;
  requestAnimationFrame(() => {
    textContainer.classList.add('revealed');
    console.log('[LIFTOFF] Content intro revealed');
  });
}

// Jump to section - just scroll there, content updates automatically
function jumpToSection(sectionIndex) {
  if (sectionIndex < 0 || sectionIndex >= SECTIONS.length) return;
  Scroll.jumpToSection(sectionIndex);
}

// Cleanup
function destroy() {
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
  lastSectionIndex = -1;
}

export { init, update, reveal, jumpToSection, destroy };

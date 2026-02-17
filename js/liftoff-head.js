/* ==========================================================================
   Liftoff - Head Script
   Loads CSS and required libraries
   ========================================================================== */

(function() {
  'use strict';

  // Inject CSS
  const styles = document.createElement('style');
  styles.textContent = `
/* ==========================================================================
   Liftoff - Core Styles
   ========================================================================== */

:root {
  --color-bg: #000000;
  --color-bg-subtle: #0a0a0f;
  --color-text: #ffffff;
  --color-text-muted: #8a8a9a;
  --color-accent: #6b7cff;
  --color-accent-glow: rgba(107, 124, 255, 0.3);
  --color-asteroid-dark: #1a1a24;
  --color-asteroid-mid: #2a2a3a;
  --color-asteroid-light: #3a3a4a;
  --font-heading: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --section-padding: clamp(80px, 15vh, 150px);
  --container-max: 1200px;
  --container-padding: 24px;
  --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Lenis */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-scrolling iframe { pointer-events: none; }

body {
  background-color: var(--color-bg) !important;
  overflow-x: hidden;
}

/* Starfield */
.starfield {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.starfield canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}


/* Scroll Rocket - 70% height, rocket moves up */
.scroll-rocket {
  position: fixed;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  height: 70vh;
  width: 120px;
  z-index: 100;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0;
}

.scroll-rocket__track {
  position: relative;
  width: 2px;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  margin-right: 19px;
}

.scroll-rocket__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0%;
  background: rgba(255, 255, 255, 0.3);
}

.scroll-rocket__markers {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 100%;
}

.scroll-rocket__marker {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s ease;
}

.scroll-rocket__marker:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(-50%) scale(1.5);
}

.scroll-rocket__marker::before {
  content: attr(data-label);
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: 12px;
  color: rgba(255, 255, 255, 0);
  transition: all 0.2s ease;
  pointer-events: none;
}

.scroll-rocket__marker:hover::before {
  color: rgba(255, 255, 255, 0.8);
  right: 16px;
}

.scroll-rocket__icon {
  position: absolute;
  bottom: 0;
  left: 50%;
  margin-left: -31px;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
  transition: top 0.1s ease-out;
}

.scroll-rocket__icon svg {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .scroll-rocket { display: none; }
}

/* Asteroids - 3D transforms */
.asteroids-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
  perspective: 1000px;
}

.asteroid {
  position: absolute;
  pointer-events: none;
  will-change: transform;
  transform-style: preserve-3d;
}

.asteroid img,
.asteroid svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Sections - with perspective for Z-axis animations */
.liftoff-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--section-padding) var(--container-padding);
  perspective: 1000px;
  z-index: 10;
}

.liftoff-section__inner {
  max-width: var(--container-max);
  width: 100%;
  text-align: center;
}

/* Section label */
.section-label {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

.section-label::before { content: '{'; }
.section-label::after { content: '}'; }

/* Headings */
.liftoff-heading {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 24px 0;
  color: var(--color-text);
}

.liftoff-heading--xl {
  font-size: clamp(48px, 10vw, 120px);
  font-weight: 700;
  letter-spacing: -0.03em;
}

.liftoff-heading--lg { font-size: clamp(32px, 5vw, 64px); }
.liftoff-heading--md { font-size: clamp(24px, 3vw, 40px); }

/* Text */
.liftoff-text {
  font-size: clamp(16px, 2vw, 22px);
  line-height: 1.6;
  color: var(--color-text);
  max-width: 700px;
  margin: 0 auto;
}

.liftoff-text--muted { color: var(--color-text-muted); }

/* Buttons */
.liftoff-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 32px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-decoration: none;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s var(--ease-smooth);
}

.liftoff-btn--primary {
  background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
  color: #000;
  border: none;
}

.liftoff-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
}

.liftoff-btn--outline {
  background: transparent;
  color: var(--color-text);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.liftoff-btn--outline:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.5);
}

.liftoff-btn--corners {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  padding: 20px 40px;
  border-radius: 8px;
}

.liftoff-btn--corners::before,
.liftoff-btn--corners::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.liftoff-btn--corners::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.liftoff-btn--corners::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

/* Animation classes - GSAP handles transforms, CSS only sets opacity */
.fade-in,
.zoom-in,
.scale-in,
.fade-left,
.fade-right {
  opacity: 0;
}

/* Nav */
.liftoff-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 24px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.liftoff-nav__logo {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text);
  text-decoration: none;
}

.liftoff-nav__links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.liftoff-nav__link {
  font-size: 14px;
  color: var(--color-text);
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.liftoff-nav__link:hover { opacity: 1; }

/* Footer */
.liftoff-footer {
  position: relative;
  z-index: 10;
  padding: 40px var(--container-padding);
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}
  `;
  document.head.appendChild(styles);

  // Load Lenis
  const lenisScript = document.createElement('script');
  lenisScript.src = 'https://unpkg.com/lenis@1.1.18/dist/lenis.min.js';
  document.head.appendChild(lenisScript);

  // Load GSAP
  const gsapScript = document.createElement('script');
  gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
  document.head.appendChild(gsapScript);

  // Load ScrollTrigger
  gsapScript.onload = function() {
    const stScript = document.createElement('script');
    stScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
    document.head.appendChild(stScript);
  };

  console.log('Liftoff: Head loaded');
})();

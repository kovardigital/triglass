/* ==========================================================================
   Liftoff - Three.js Head Script
   Injects importmap and base styles for Three.js scene
   ========================================================================== */

(function() {
  'use strict';

  console.log('%c[LIFTOFF-3D] Head script starting...', 'color: #6b7cff; font-weight: bold');

  // Inject importmap for ES modules
  const importmap = document.createElement('script');
  importmap.type = 'importmap';
  importmap.textContent = JSON.stringify({
    imports: {
      'three': 'https://unpkg.com/three@0.160.0/build/three.module.js',
      'three/addons/': 'https://unpkg.com/three@0.160.0/examples/jsm/'
    }
  });
  document.head.appendChild(importmap);
  console.log('%c[LIFTOFF-3D] Importmap injected', 'color: #10b981');

  // Inject minimal CSS
  const styles = document.createElement('style');
  styles.textContent = `
/* Reset & Base */
*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: #000;
  color: #fff;
  font-family: 'Inter', -apple-system, sans-serif;
  overflow-x: hidden;
}

/* Three.js Canvas Container */
#liftoff-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* Content overlay for text sections */
.liftoff-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  pointer-events: none;
  transition: opacity 0.3s ease-out;
}

.liftoff-content h1 {
  font-size: clamp(32px, 8vw, 80px);
  font-weight: 700;
  margin: 0 0 20px 0;
  letter-spacing: -0.02em;
}

.liftoff-content p {
  font-size: clamp(16px, 2vw, 22px);
  line-height: 1.6;
  color: rgba(255,255,255,0.7);
  margin: 0;
}

/* Scroll spacer - creates scroll height */
.liftoff-scroll-spacer {
  height: 500vh;
  pointer-events: none;
}

/* Debug info */
.liftoff-debug {
  position: fixed;
  top: 20px;
  left: 20px;
  background: rgba(0,0,0,0.8);
  color: #0f0;
  font-family: monospace;
  font-size: 12px;
  padding: 10px 15px;
  border-radius: 4px;
  z-index: 9999;
}
  `;
  document.head.appendChild(styles);

  console.log('%c[LIFTOFF-3D] Styles injected', 'color: #10b981');
})();

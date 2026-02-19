/* ==========================================================================
   Liftoff - Three.js Entry Point
   Imports and initializes all modules
   ========================================================================== */

import { scene, camera, renderer, worldGroup, revealScene } from './liftoff/core.js';
import * as Loop from './liftoff/loop.js';
import * as Galaxy from './liftoff/galaxy.js';
import * as Starfield from './liftoff/starfield.js';
import * as Asteroids from './liftoff/asteroids.js';
import * as Parallax from './liftoff/parallax.js';
import * as Scroll from './liftoff/scroll.js';
import * as Content from './liftoff/content.js';
import * as Preloader from './liftoff/preloader.js';
import * as RocketIndicator from './liftoff/rocket-indicator.js';

console.log('%c[LIFTOFF] Starting...', 'color: #6b7cff; font-weight: bold');

// Show preloader immediately
Preloader.init();
Preloader.setProgress(0.1); // Core loaded

// Initialize modules with progress updates
Galaxy.init(worldGroup);  // Galaxy in worldGroup for parallax, Z synced with camera
Preloader.setProgress(0.2);

Starfield.init(worldGroup);
Preloader.setProgress(0.3);

Asteroids.init(worldGroup);
Preloader.setProgress(0.5);

Parallax.init(worldGroup);
Preloader.setProgress(0.6);

Scroll.init(camera);
Preloader.setProgress(0.7);

Content.init();
Preloader.setProgress(0.8);

RocketIndicator.init();
RocketIndicator.setOnSectionClick(Content.jumpToSection);
Preloader.setProgress(0.9);

// Register update functions with the animation loop
Loop.onUpdate('galaxy', Galaxy.update);
Loop.onUpdate('parallax', Parallax.update);
Loop.onUpdate('scroll', Scroll.update);
Loop.onUpdate('asteroids', () => Asteroids.update(camera));
Loop.onUpdate('starfield', () => Starfield.update(camera));
Loop.onUpdate('content', () => Content.update(Scroll.getProgress()));
Loop.onUpdate('rocketIndicator', () => RocketIndicator.update(Scroll.getProgress()));

Preloader.setProgress(1.0);

// Register intro sequence for after preloader hides
Preloader.onReady(() => {
  // Step 1: Title fades on first
  Content.reveal();

  // Step 2: Subtitle animates on after title (handled by CSS delay)

  // Step 3: Scene fades in slowly after text animations start
  setTimeout(() => {
    revealScene();
  }, 1700);
});

// Start animation loop and hide preloader
Loop.start();
Preloader.hide(500); // Slightly longer delay to see full logo

console.log('%c[LIFTOFF] Ready! Move mouse and scroll.', 'color: #10b981');

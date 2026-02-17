/* ==========================================================================
   Liftoff - Three.js Entry Point
   Imports and initializes all modules
   ========================================================================== */

import { scene, camera, renderer, worldGroup } from './liftoff/core.js';
import * as Loop from './liftoff/loop.js';
import * as Starfield from './liftoff/starfield.js';
import * as Asteroids from './liftoff/asteroids.js';
import * as Parallax from './liftoff/parallax.js';
import * as Scroll from './liftoff/scroll.js';
import * as Content from './liftoff/content.js';
import * as Preloader from './liftoff/preloader.js';

console.log('%c[LIFTOFF] Starting...', 'color: #6b7cff; font-weight: bold');

// Show preloader immediately
Preloader.init();
Preloader.setProgress(0.1); // Core loaded

// Initialize modules with progress updates
Starfield.init(worldGroup);
Preloader.setProgress(0.3);

Asteroids.init(worldGroup);
Preloader.setProgress(0.5);

Parallax.init(worldGroup);
Preloader.setProgress(0.6);

Scroll.init(camera);
Preloader.setProgress(0.7);

Content.init();
Preloader.setProgress(0.85);

// Register update functions with the animation loop
Loop.onUpdate('parallax', Parallax.update);
Loop.onUpdate('scroll', Scroll.update);
Loop.onUpdate('asteroids', Asteroids.update);
Loop.onUpdate('starfield', Starfield.update);
Loop.onUpdate('content', () => Content.update(Scroll.getProgress()));

Preloader.setProgress(1.0);

// Start animation loop and hide preloader
Loop.start();
Preloader.hide(500); // Slightly longer delay to see full logo

console.log('%c[LIFTOFF] Ready! Move mouse and scroll.', 'color: #10b981');

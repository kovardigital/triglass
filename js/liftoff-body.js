/* ==========================================================================
   Liftoff - Body Script
   Creates elements and initializes animations
   ========================================================================== */

(function() {
  'use strict';

  // ==========================================================================
  // Configuration
  // ==========================================================================

  const CONFIG = {
    stars: { count: 200, minSize: 0.5, maxSize: 2.5, minOpacity: 0.1, maxOpacity: 1 },
    parallax: { asteroidStrength: 0.05, scrollZoomStrength: 0.15 },
  };

  // ==========================================================================
  // Create DOM Elements
  // ==========================================================================

  function createElements() {
    // Starfield
    const starfield = document.createElement('div');
    starfield.className = 'starfield';
    document.body.insertBefore(starfield, document.body.firstChild);

    // Asteroids
    const asteroidsContainer = document.createElement('div');
    asteroidsContainer.className = 'asteroids-container';
    asteroidsContainer.innerHTML = `
      <!-- Asteroid 1 - Large, left side -->
      <div class="asteroid" style="top: 10%; left: -8%; width: 280px; height: 280px;" data-depth="0.3">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="a1-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3a3a4a"/><stop offset="50%" style="stop-color:#2a2a3a"/><stop offset="100%" style="stop-color:#1a1a24"/></linearGradient></defs>
          <path d="M95 15 C130 10, 165 35, 180 70 C195 105, 185 145, 155 170 C125 195, 75 195, 45 170 C15 145, 5 100, 20 65 C35 30, 60 20, 95 15 Z" fill="url(#a1-grad)"/>
          <ellipse cx="80" cy="70" rx="20" ry="15" fill="#1a1a24" opacity="0.5"/>
          <ellipse cx="130" cy="120" rx="15" ry="12" fill="#1a1a24" opacity="0.4"/>
        </svg>
      </div>

      <!-- Asteroid 2 - Medium, right side -->
      <div class="asteroid" style="top: 25%; right: -5%; width: 180px; height: 180px;" data-depth="0.5">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="a2-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#1a1a24"/><stop offset="50%" style="stop-color:#2a2a3a"/><stop offset="100%" style="stop-color:#3a3a4a"/></linearGradient></defs>
          <path d="M100 10 C140 5, 175 25, 190 60 C205 95, 195 140, 170 165 C145 190, 100 200, 60 180 C20 160, 5 120, 15 80 C25 40, 60 15, 100 10 Z" fill="url(#a2-grad)"/>
          <ellipse cx="120" cy="60" rx="18" ry="14" fill="#1a1a24" opacity="0.5"/>
          <ellipse cx="70" cy="100" rx="22" ry="16" fill="#1a1a24" opacity="0.4"/>
        </svg>
      </div>

      <!-- Asteroid 3 - Small, left mid -->
      <div class="asteroid" style="top: 45%; left: -3%; width: 100px; height: 100px;" data-depth="0.7">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="a3-grad" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" style="stop-color:#3a3a4a"/><stop offset="100%" style="stop-color:#1a1a24"/></linearGradient></defs>
          <path d="M90 8 C110 5, 145 15, 170 40 C195 65, 198 95, 185 125 C172 155, 150 180, 115 190 C80 200, 45 185, 25 155 C5 125, 8 85, 30 55 C52 25, 70 11, 90 8 Z" fill="url(#a3-grad)"/>
          <ellipse cx="100" cy="80" rx="25" ry="18" fill="#1a1a24" opacity="0.45"/>
        </svg>
      </div>

      <!-- Asteroid 4 - Large, right lower -->
      <div class="asteroid" style="top: 55%; right: -10%; width: 320px; height: 320px;" data-depth="0.25">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="a4-grad" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" style="stop-color:#2a2a3a"/><stop offset="100%" style="stop-color:#1a1a24"/></linearGradient></defs>
          <path d="M30 90 C35 60, 65 35, 100 30 C135 25, 170 45, 185 80 C200 115, 190 150, 155 165 C120 180, 70 175, 40 150 C10 125, 25 120, 30 90 Z" fill="url(#a4-grad)"/>
          <ellipse cx="90" cy="90" rx="20" ry="15" fill="#1a1a24" opacity="0.5"/>
          <ellipse cx="145" cy="115" rx="18" ry="13" fill="#1a1a24" opacity="0.4"/>
        </svg>
      </div>

      <!-- Asteroid 5 - Small, left lower -->
      <div class="asteroid" style="top: 72%; left: 5%; width: 120px; height: 120px;" data-depth="0.6">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="a5-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#2a2a3a"/><stop offset="100%" style="stop-color:#1a1a24"/></linearGradient></defs>
          <path d="M95 15 C130 10, 165 35, 180 70 C195 105, 185 145, 155 170 C125 195, 75 195, 45 170 C15 145, 5 100, 20 65 C35 30, 60 20, 95 15 Z" fill="url(#a5-grad)"/>
          <ellipse cx="100" cy="100" rx="25" ry="20" fill="#1a1a24" opacity="0.4"/>
        </svg>
      </div>

      <!-- Asteroid 6 - Medium, right top -->
      <div class="asteroid" style="top: 5%; right: 15%; width: 140px; height: 140px;" data-depth="0.8">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="a6-grad" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#3a3a4a"/><stop offset="100%" style="stop-color:#1a1a24"/></linearGradient></defs>
          <path d="M100 10 C140 5, 175 25, 190 60 C205 95, 195 140, 170 165 C145 190, 100 200, 60 180 C20 160, 5 120, 15 80 C25 40, 60 15, 100 10 Z" fill="url(#a6-grad)"/>
          <ellipse cx="110" cy="90" rx="20" ry="15" fill="#1a1a24" opacity="0.45"/>
        </svg>
      </div>
    `;
    document.body.insertBefore(asteroidsContainer, document.body.firstChild.nextSibling);

    // Scroll Rocket
    const scrollRocket = document.createElement('div');
    scrollRocket.className = 'scroll-rocket';
    scrollRocket.innerHTML = `
      <div class="scroll-rocket__track">
        <div class="scroll-rocket__progress"></div>
      </div>
      <div class="scroll-rocket__icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
          <path d="M12 2C12 2 8 6 8 12C8 15 9 18 12 22C15 18 16 15 16 12C16 6 12 2 12 2Z" fill="white"/>
          <circle cx="12" cy="10" r="2" fill="#1a1a24"/>
          <path d="M8 14L5 18L8 17V14Z" fill="white"/>
          <path d="M16 14L19 18L16 17V14Z" fill="white"/>
          <path d="M10 20C10 20 11 22 12 23C13 22 14 20 14 20C13 21 12 21.5 12 21.5C12 21.5 11 21 10 20Z" fill="#ff6b4a" opacity="0.9"/>
        </svg>
      </div>
    `;
    document.body.appendChild(scrollRocket);

    // Demo content sections (will be replaced by Webflow native elements later)
    const demoContent = document.createElement('div');
    demoContent.id = 'liftoff-demo-content';
    demoContent.innerHTML = `
      <!-- Hero Section -->
      <section class="liftoff-section">
        <div class="liftoff-section__inner">
          <div class="section-label fade-up">The Film</div>
          <h1 class="liftoff-heading liftoff-heading--xl fade-up">LIFTOFF</h1>
          <p class="liftoff-text fade-up" style="margin-bottom: 40px;">
            A story of dreams, determination, and the infinite possibilities beyond our world.
          </p>
          <a href="#about" class="liftoff-btn liftoff-btn--primary fade-up">Explore the Journey</a>
        </div>
      </section>

      <!-- About Section -->
      <section class="liftoff-section" id="about">
        <div class="liftoff-section__inner">
          <div class="section-label fade-up">About</div>
          <h2 class="liftoff-heading liftoff-heading--lg fade-up">
            A young boy's journey to the stars
          </h2>
          <p class="liftoff-text fade-up">
            When 12-year-old Marcus discovers an abandoned spacecraft in his grandfather's barn,
            he embarks on an adventure that will take him beyond everything he's ever known.
            Liftoff is a heartwarming tale about believing in the impossible.
          </p>
        </div>
      </section>

      <!-- Story Section -->
      <section class="liftoff-section">
        <div class="liftoff-section__inner">
          <div class="section-label fade-up">The Story</div>
          <h2 class="liftoff-heading liftoff-heading--lg fade-up">
            Beyond the atmosphere,<br>beyond imagination
          </h2>
          <p class="liftoff-text fade-up">
            Set in rural Montana, Liftoff follows Marcus as he repairs the mysterious craft
            with help from his skeptical sister and an eccentric former NASA engineer.
            Together, they discover that the ship holds secrets that could change humanity forever.
          </p>
        </div>
      </section>

      <!-- Investment Section -->
      <section class="liftoff-section">
        <div class="liftoff-section__inner">
          <div class="section-label fade-up">Invest</div>
          <h2 class="liftoff-heading liftoff-heading--lg fade-up">
            Join the mission
          </h2>
          <p class="liftoff-text fade-up" style="margin-bottom: 40px;">
            We're seeking visionary investors to bring this story to life.
            With an experienced team and a compelling narrative, Liftoff is poised
            to inspire audiences worldwide.
          </p>
          <div class="fade-up">
            <a href="#contact" class="liftoff-btn liftoff-btn--outline" style="margin-right: 16px;">View Pitch Deck</a>
            <a href="#contact" class="liftoff-btn liftoff-btn--primary">Contact Us</a>
          </div>
        </div>
      </section>

      <!-- Contact Section -->
      <section class="liftoff-section" id="contact">
        <div class="liftoff-section__inner">
          <div class="section-label fade-up">Contact</div>
          <h2 class="liftoff-heading liftoff-heading--md fade-up">
            Ready to launch?
          </h2>
          <p class="liftoff-text liftoff-text--muted fade-up">
            hello@triglass.com
          </p>
        </div>
      </section>

      <!-- Footer -->
      <footer class="liftoff-footer">
        <p>&copy; 2026 Triglass Productions. All rights reserved.</p>
      </footer>
    `;
    document.body.appendChild(demoContent);

    console.log('Liftoff: Elements created');
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  function lerp(start, end, factor) { return start + (end - start) * factor; }
  function mapRange(value, inMin, inMax, outMin, outMax) { return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin; }
  function randomRange(min, max) { return Math.random() * (max - min) + min; }

  // ==========================================================================
  // Smooth Scroll (Lenis)
  // ==========================================================================

  let lenis = null;

  function initSmoothScroll() {
    if (typeof Lenis === 'undefined') {
      console.warn('Lenis not loaded yet, retrying...');
      setTimeout(initSmoothScroll, 100);
      return;
    }

    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }

    console.log('Liftoff: Smooth scroll initialized');
  }

  // ==========================================================================
  // Starfield
  // ==========================================================================

  class Starfield {
    constructor(container) {
      this.container = container;
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.stars = [];
      this.scrollProgress = 0;
      this.container.appendChild(this.canvas);
      this.resize();
      this.createStars();
      this.animate();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.centerX = this.width / 2;
      this.centerY = this.height / 2;
    }

    createStars() {
      this.stars = [];
      for (let i = 0; i < CONFIG.stars.count; i++) {
        const star = {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: randomRange(CONFIG.stars.minSize, CONFIG.stars.maxSize),
          opacity: randomRange(CONFIG.stars.minOpacity, CONFIG.stars.maxOpacity),
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed: randomRange(0.001, 0.003),
          layer: Math.floor(Math.random() * 3),
        };
        star.baseX = star.x;
        star.baseY = star.y;
        this.stars.push(star);
      }
    }

    setScrollProgress(progress) { this.scrollProgress = progress; }

    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      const time = Date.now();
      const zoomFactor = 1 + this.scrollProgress * CONFIG.parallax.scrollZoomStrength;

      this.stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const opacity = star.opacity * mapRange(twinkle, -1, 1, 0.3, 1);
        const layerZoom = zoomFactor * (1 + star.layer * 0.1);
        const dx = star.baseX - this.centerX;
        const dy = star.baseY - this.centerY;
        const x = this.centerX + dx * layerZoom;
        const y = this.centerY + dy * layerZoom;
        const size = star.size * (1 + this.scrollProgress * 0.2);

        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.fill();

        if (star.size > 1.5) {
          this.ctx.beginPath();
          this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
          this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.1})`;
          this.ctx.fill();
        }
      });

      requestAnimationFrame(() => this.animate());
    }
  }

  let starfield = null;

  function initStarfield() {
    const container = document.querySelector('.starfield');
    if (container) {
      starfield = new Starfield(container);
      console.log('Liftoff: Starfield initialized');
    }
  }

  // ==========================================================================
  // Mouse Parallax
  // ==========================================================================

  let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;

  function initMouseParallax() {
    const asteroids = document.querySelectorAll('.asteroid');
    if (!asteroids.length) return;

    document.addEventListener('mousemove', (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function updateParallax() {
      mouseX = lerp(mouseX, targetMouseX, 0.08);
      mouseY = lerp(mouseY, targetMouseY, 0.08);

      asteroids.forEach((asteroid) => {
        const depth = parseFloat(asteroid.dataset.depth) || 1;
        const strength = CONFIG.parallax.asteroidStrength * depth;
        const moveX = mouseX * strength * 100;
        const moveY = mouseY * strength * 100;
        const currentTransform = asteroid.dataset.scrollTransform || '';
        asteroid.style.transform = `${currentTransform} translate(${moveX}px, ${moveY}px)`;
      });

      requestAnimationFrame(updateParallax);
    }

    updateParallax();
    console.log('Liftoff: Mouse parallax initialized');
  }

  // ==========================================================================
  // Scroll Animations
  // ==========================================================================

  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP/ScrollTrigger not loaded yet, retrying...');
      setTimeout(initScrollAnimations, 100);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Starfield zoom on scroll
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { if (starfield) starfield.setScrollProgress(self.progress); },
    });

    // Asteroid zoom on scroll
    document.querySelectorAll('.asteroid').forEach((asteroid) => {
      const depth = parseFloat(asteroid.dataset.depth) || 1;
      const zoomAmount = 1 + CONFIG.parallax.scrollZoomStrength * depth;

      gsap.to(asteroid, {
        scale: zoomAmount,
        ease: 'none',
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate: (self) => {
            const scale = 1 + self.progress * (zoomAmount - 1);
            asteroid.dataset.scrollTransform = `scale(${scale})`;
          },
        },
      });
    });

    // Animation classes
    const animations = {
      '.fade-up': { from: { opacity: 0, y: 60 }, to: { opacity: 1, y: 0 } },
      '.fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
      '.scale-in': { from: { opacity: 0, scale: 0.8 }, to: { opacity: 1, scale: 1 } },
      '.fade-left': { from: { opacity: 0, x: -60 }, to: { opacity: 1, x: 0 } },
      '.fade-right': { from: { opacity: 0, x: 60 }, to: { opacity: 1, x: 0 } },
    };

    Object.entries(animations).forEach(([selector, { from, to }]) => {
      gsap.utils.toArray(selector).forEach((el) => {
        gsap.fromTo(el, from, {
          ...to,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    });

    console.log('Liftoff: Scroll animations initialized');
  }

  // ==========================================================================
  // Scroll Rocket
  // ==========================================================================

  function initScrollRocket() {
    const rocket = document.querySelector('.scroll-rocket');
    if (!rocket) return;

    const icon = rocket.querySelector('.scroll-rocket__icon');
    const progress = rocket.querySelector('.scroll-rocket__progress');
    const track = rocket.querySelector('.scroll-rocket__track');
    if (!icon || !track) return;

    const trackHeight = track.offsetHeight;

    function updateRocket() {
      const scrollTop = window.scrollY || (lenis && lenis.scroll) || 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.min(scrollTop / docHeight, 1);
      icon.style.top = `${scrollPercent * trackHeight}px`;
      if (progress) progress.style.height = `${scrollPercent * 100}%`;
    }

    if (lenis) {
      lenis.on('scroll', updateRocket);
    } else {
      window.addEventListener('scroll', updateRocket, { passive: true });
    }

    updateRocket();
    console.log('Liftoff: Scroll rocket initialized');
  }

  // ==========================================================================
  // Initialize
  // ==========================================================================

  function init() {
    console.log('Liftoff: Initializing...');

    // Create DOM elements first
    createElements();

    // Wait a bit for libraries to load, then initialize
    setTimeout(() => {
      initSmoothScroll();
      initStarfield();
      initMouseParallax();
      initScrollAnimations();
      initScrollRocket();
      console.log('Liftoff: Ready for launch!');
    }, 200);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.Liftoff = {
    get lenis() { return lenis; },
    get starfield() { return starfield; },
    config: CONFIG
  };
})();

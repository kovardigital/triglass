/* ==========================================================================
   Liftoff - Triglass Film Pitch Site
   Animation System
   ========================================================================== */

(function () {
  'use strict';

  // ==========================================================================
  // Configuration
  // ==========================================================================

  const CONFIG = {
    // Starfield
    stars: {
      count: 200,
      minSize: 0.5,
      maxSize: 2.5,
      minOpacity: 0.1,
      maxOpacity: 1,
      twinkleSpeed: 0.002,
    },

    // Parallax
    parallax: {
      asteroidStrength: 0.05, // Mouse parallax strength
      scrollZoomStrength: 0.15, // How much asteroids zoom on scroll
    },

    // Scroll animations
    scroll: {
      fadeDistance: 100, // Distance for fade animations
      staggerDelay: 0.1, // Delay between staggered elements
    },
  };

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  // ==========================================================================
  // Smooth Scroll (Lenis)
  // ==========================================================================

  let lenis = null;

  function initSmoothScroll() {
    if (typeof Lenis === 'undefined') {
      console.warn('Lenis not loaded, using native scroll');
      return;
    }

    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Connect Lenis to GSAP ScrollTrigger
    if (typeof gsap !== 'undefined' && gsap.ticker) {
      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    } else {
      // Fallback RAF loop
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    console.log('Lenis smooth scroll initialized');
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
      this.baseScale = 1;

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
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          baseX: 0,
          baseY: 0,
          size: randomRange(CONFIG.stars.minSize, CONFIG.stars.maxSize),
          opacity: randomRange(CONFIG.stars.minOpacity, CONFIG.stars.maxOpacity),
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed: randomRange(0.001, 0.003),
          layer: Math.floor(Math.random() * 3), // 0 = far, 1 = mid, 2 = close
        });
      }

      // Store original positions for zoom effect
      this.stars.forEach((star) => {
        star.baseX = star.x;
        star.baseY = star.y;
      });
    }

    setScrollProgress(progress) {
      this.scrollProgress = progress;
    }

    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      const time = Date.now();
      const zoomFactor = 1 + this.scrollProgress * CONFIG.parallax.scrollZoomStrength;

      this.stars.forEach((star) => {
        // Twinkle effect
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const opacity = star.opacity * mapRange(twinkle, -1, 1, 0.3, 1);

        // Zoom from center based on scroll
        const layerZoom = zoomFactor * (1 + star.layer * 0.1);
        const dx = star.baseX - this.centerX;
        const dy = star.baseY - this.centerY;
        const x = this.centerX + dx * layerZoom;
        const y = this.centerY + dy * layerZoom;

        // Size also scales slightly with zoom
        const size = star.size * (1 + this.scrollProgress * 0.2);

        // Draw star
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.fill();

        // Add glow for larger stars
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
    if (!container) {
      console.warn('No .starfield container found');
      return;
    }

    starfield = new Starfield(container);
    console.log('Starfield initialized');
  }

  // ==========================================================================
  // Mouse Parallax (Asteroids)
  // ==========================================================================

  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  function initMouseParallax() {
    const asteroids = document.querySelectorAll('.asteroid');
    if (!asteroids.length) return;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Smooth parallax animation loop
    function updateParallax() {
      mouseX = lerp(mouseX, targetMouseX, 0.08);
      mouseY = lerp(mouseY, targetMouseY, 0.08);

      asteroids.forEach((asteroid) => {
        const depth = parseFloat(asteroid.dataset.depth) || 1;
        const strength = CONFIG.parallax.asteroidStrength * depth;

        const moveX = mouseX * strength * 100;
        const moveY = mouseY * strength * 100;

        // Get current scroll-based transform and add mouse parallax
        const currentTransform = asteroid.dataset.scrollTransform || '';
        asteroid.style.transform = `${currentTransform} translate(${moveX}px, ${moveY}px)`;
      });

      requestAnimationFrame(updateParallax);
    }

    updateParallax();
    console.log('Mouse parallax initialized');
  }

  // ==========================================================================
  // Scroll Animations (GSAP ScrollTrigger)
  // ==========================================================================

  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not loaded');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Update starfield zoom on scroll
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (starfield) {
          starfield.setScrollProgress(self.progress);
        }
      },
    });

    // Asteroid scroll zoom effect
    const asteroids = document.querySelectorAll('.asteroid');
    asteroids.forEach((asteroid) => {
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
            // Store scroll transform for mouse parallax to use
            const scale = 1 + self.progress * (zoomAmount - 1);
            asteroid.dataset.scrollTransform = `scale(${scale})`;
          },
        },
      });
    });

    // Fade up animations
    gsap.utils.toArray('.fade-up').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'top 50%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Fade in animations
    gsap.utils.toArray('.fade-in').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Scale in animations (zoom from center)
    gsap.utils.toArray('.scale-in').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Fade left animations
    gsap.utils.toArray('.fade-left').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, x: -60 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Fade right animations
    gsap.utils.toArray('.fade-right').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, x: 60 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Staggered children animations
    gsap.utils.toArray('.stagger-children').forEach((container) => {
      const children = container.children;
      gsap.fromTo(
        children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: CONFIG.scroll.staggerDelay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Section titles with split animation
    gsap.utils.toArray('.liftoff-heading').forEach((heading) => {
      // Skip if already has animation class
      if (heading.classList.contains('fade-up') || heading.classList.contains('scale-in')) return;

      gsap.fromTo(
        heading,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    console.log('Scroll animations initialized');
  }

  // ==========================================================================
  // Scroll Progress Rocket
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
      const scrollTop = window.scrollY || lenis?.scroll || 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.min(scrollTop / docHeight, 1);

      // Update rocket position along track
      const rocketY = scrollPercent * trackHeight;
      icon.style.top = `${rocketY}px`;

      // Update progress bar
      if (progress) {
        progress.style.height = `${scrollPercent * 100}%`;
      }
    }

    // Use Lenis scroll event if available, otherwise use native
    if (lenis) {
      lenis.on('scroll', updateRocket);
    } else {
      window.addEventListener('scroll', updateRocket, { passive: true });
    }

    // Initial update
    updateRocket();
    console.log('Scroll rocket initialized');
  }

  // ==========================================================================
  // Initialize Everything
  // ==========================================================================

  function init() {
    console.log('Liftoff: Initializing...');

    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }

  function onReady() {
    // Initialize in order
    initSmoothScroll();
    initStarfield();
    initMouseParallax();
    initScrollAnimations();
    initScrollRocket();

    console.log('Liftoff: Ready for launch!');
  }

  // Auto-initialize
  init();

  // Expose API for external use
  window.Liftoff = {
    lenis,
    starfield,
    reinit: init,
    config: CONFIG,
  };
})();

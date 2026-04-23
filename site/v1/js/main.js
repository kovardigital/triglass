// Triglass Productions — Main JS
// Loads content from data/content.json and renders the homepage

(async function () {
  // Preloader: lock page behind black screen until ready
  document.body.classList.add('preloader-active');

  // Measure scrollbar width and expose as CSS var (for modal scroll-lock compensation)
  const sbw = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', sbw + 'px');
  window.addEventListener('resize', () => {
    const w = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', w + 'px');
  });

  const res = await fetch('/v1/data/content.json');
  const data = await res.json();

  initNav(data);
  initContactModal();
  initHero(data.hero, data.heroThumbs);
  initHeroControls();
  renderWorkGrid(data.work);
  renderDirectors(data.directors);
  renderCaseStudies(data.caseStudies);
  initFooter(data);
  initScrollEffects();
  initCtaReveal();

  // Dismiss preloader: logo animates in (CSS), then fade out overlay
  const preloader = document.getElementById('preloader');
  if (preloader) {
    // Start fade-out as soon as logo finishes fading in (0.3s delay + 1.6s anim)
    setTimeout(() => {
      preloader.classList.add('is-leaving');
      document.body.classList.remove('preloader-active');
      preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });
    }, 1900);
  }
})();

// --- Navigation ---
function initNav(data) {
  const navLinks = document.getElementById('navLinks');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuBtn = document.getElementById('menuBtn');

  data.nav.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;

    // Work scrolls to grid
    if (item.label === 'Work') {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Post-Production and Motion Graphics link to grid with filter
    if (item.label === 'Post-Production' || item.label === 'Motion Graphics') {
      a.href = '#work';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const filterSlug = item.label.toLowerCase().replace(/[^a-z]/g, '-');
        activateFilter(filterSlug);
        document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
      });
    }

    li.appendChild(a);
    navLinks.appendChild(li);
  });

  data.nav.forEach(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    a.addEventListener('click', () => mobileMenu.classList.remove('is-open'));
    mobileMenu.appendChild(a);
  });

  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('is-open');
  });
}

// --- Hero Controls ---
function initHeroControls() {
  const video = document.getElementById('heroVideo');
  const controls = document.getElementById('heroControls');
  const volumeBtn = document.getElementById('volumeBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const videoWrap = document.getElementById('heroVideoWrap');
  let hideTimer;

  function showControls() {
    controls.classList.add('is-visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      controls.classList.remove('is-visible');
    }, 2000);
  }

  videoWrap.addEventListener('click', (e) => {
    if (e.target.closest('.hero__controls')) return;
    showControls();
  });

  // Volume
  volumeBtn.addEventListener('click', () => {
    if (video.muted) {
      video.muted = false;
      video.volume = parseFloat(volumeSlider.value) || 0.5;
      volumeSlider.value = video.volume;
    } else {
      video.muted = true;
    }
    updateVolumeIcon();
    showControls();
  });

  volumeSlider.addEventListener('input', () => {
    video.volume = parseFloat(volumeSlider.value);
    video.muted = video.volume === 0;
    updateVolumeIcon();
    showControls();
  });

  function updateVolumeIcon() {
    const icon = document.getElementById('volumeIcon');
    if (video.muted || video.volume === 0) {
      icon.setAttribute('d', 'M11 5L6 9H2v6h4l5 4V5z');
      volumeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="18" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="18" y2="15"/></svg>`;
    } else {
      volumeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>`;
    }
  }

  // Fullscreen
  fullscreenBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      (videoWrap.requestFullscreen || videoWrap.webkitRequestFullscreen).call(videoWrap);
    }
    showControls();
  });
}

// --- Contact Modal ---
function initContactModal() {
  const btn = document.getElementById('contactBtn');
  const modal = document.getElementById('contactModal');
  const closeBtn = modal.querySelector('.contact-modal__close');

  function open() { modal.classList.add('is-open'); document.body.classList.add('modal-open'); }
  function close() { modal.classList.remove('is-open'); document.body.classList.remove('modal-open'); }

  btn.addEventListener('click', open);
  const ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn) ctaBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}

// --- Hero ---
function initHero(hero, thumbs) {
  const video = document.getElementById('heroVideo');
  if (hero.poster) video.poster = hero.poster;
  if (hero.video) video.src = hero.video;

  const heroBottom = document.getElementById('heroBottom');
  if (heroBottom && thumbs && thumbs.length) {
    heroBottom.innerHTML = renderThumbStrip(thumbs);
  }
}

function renderThumbStrip(projects) {
  const items = projects.map(p => `
    <div class="thumb-strip__item" data-video="${p.video || ''}" data-preview="${p.preview || ''}">
      <img src="${p.thumbnail}" alt="${p.title}${p.client ? ' — ' + p.client : ''}" loading="lazy">
      ${p.preview ? `<video class="thumb-strip__video" muted loop playsinline preload="none"></video>` : ''}
      <div class="thumb-strip__label">
        <span class="thumb-strip__title">${p.title}</span>
        ${p.client ? `<span class="thumb-strip__client">${p.client}</span>` : ''}
      </div>
    </div>
  `).join('');

  return `<div class="thumb-strip">${items}</div>`;
}

// --- Work Grid ---
function renderWorkGrid(work) {
  const main = document.getElementById('main');

  const section = document.createElement('section');
  section.className = 'work-section';
  section.id = 'work';


  // Filters
  const filters = document.createElement('div');
  filters.className = 'work-filters';

  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'work-filters__tabs';
  const filterNames = ['Featured', 'Post-Production', 'Motion Graphics'];
  filterNames.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.className = 'work-filters__tab' + (i === 0 ? ' is-active' : '');
    btn.textContent = name;
    btn.dataset.filter = name.toLowerCase().replace(/[^a-z]/g, '-');
    tabsWrap.appendChild(btn);
  });
  const line = document.createElement('div');
  line.className = 'work-filters__line';
  tabsWrap.appendChild(line);
  filters.appendChild(tabsWrap);

  // Filter button (right-aligned)
  const filterBtn = document.createElement('button');
  filterBtn.className = 'work-filters__open';
  filterBtn.textContent = 'Filter';
  filters.appendChild(filterBtn);

  section.appendChild(filters);

  // Position underline on first tab after render
  requestAnimationFrame(() => {
    const activeTab = tabsWrap.querySelector('.is-active');
    if (activeTab) {
      line.style.left = activeTab.offsetLeft + 'px';
      line.style.width = activeTab.offsetWidth + 'px';
    }
  });

  // Filter panel
  const overlay = document.createElement('div');
  overlay.className = 'filter-overlay';
  document.body.appendChild(overlay);

  const panel = document.createElement('div');
  panel.className = 'filter-panel';
  panel.innerHTML = `
    <div class="filter-panel__header">
      <span class="filter-panel__title">Filter</span>
      <button class="filter-panel__close">&times;</button>
    </div>
    <div class="filter-panel__body">
      <div class="filter-panel__group">
        <div class="filter-panel__group-title">Client</div>
        <div class="filter-panel__options">
          <button class="filter-panel__option">San Francisco 49ers</button>
          <button class="filter-panel__option">Charlotte FC</button>
          <button class="filter-panel__option">New York Jets</button>
          <button class="filter-panel__option">Seattle Kraken</button>
          <button class="filter-panel__option">Dairy Queen</button>
          <button class="filter-panel__option">Minnesota Wild</button>
          <button class="filter-panel__option">Chicago Cubs</button>
        </div>
      </div>
      <div class="filter-panel__group">
        <div class="filter-panel__group-title">Mood</div>
        <div class="filter-panel__options">
          <button class="filter-panel__option">Epic</button>
          <button class="filter-panel__option">Cinematic</button>
          <button class="filter-panel__option">Emotional</button>
          <button class="filter-panel__option">Energetic</button>
          <button class="filter-panel__option">Dark</button>
        </div>
      </div>
      <div class="filter-panel__group">
        <div class="filter-panel__group-title">Genre</div>
        <div class="filter-panel__options">
          <button class="filter-panel__option">Sports</button>
          <button class="filter-panel__option">Commercial</button>
          <button class="filter-panel__option">Narrative</button>
          <button class="filter-panel__option">Brand</button>
          <button class="filter-panel__option">Film</button>
        </div>
      </div>
      <div class="filter-panel__group">
        <div class="filter-panel__group-title">Director</div>
        <div class="filter-panel__options">
          <button class="filter-panel__option">Director 1</button>
          <button class="filter-panel__option">Director 2</button>
          <button class="filter-panel__option">Director 3</button>
          <button class="filter-panel__option">Director 4</button>
        </div>
      </div>
    </div>
    <div class="filter-panel__footer">
      <button class="filter-panel__apply">Apply</button>
    </div>
  `;
  document.body.appendChild(panel);

  // Panel interactions
  filterBtn.addEventListener('click', () => {
    panel.classList.add('is-open');
    overlay.classList.add('is-open');
  });

  function closePanel() {
    panel.classList.remove('is-open');
    overlay.classList.remove('is-open');
  }

  panel.querySelector('.filter-panel__close').addEventListener('click', closePanel);
  panel.querySelector('.filter-panel__apply').addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
  });

  // Toggle pill options
  panel.querySelectorAll('.filter-panel__option').forEach(opt => {
    opt.addEventListener('click', () => opt.classList.toggle('is-active'));
  });

  const grid = document.createElement('div');
  grid.className = 'work-grid';

  work.forEach((project, i) => {
    const item = document.createElement('div');
    item.className = 'work-grid__item';
    const ratio = project.ratio || 2.0;
    item.style.flexGrow = ratio;
    item.style.flexBasis = (ratio * 280) + 'px';
    item.dataset.index = i;
    item.dataset.video = project.video || '';
    item.dataset.preview = project.preview || '';

    item.innerHTML = `
      <div class="work-grid__media">
        <img src="${project.thumbnail}" alt="${project.title}" loading="lazy">
        <video class="work-grid__preview" muted loop playsinline preload="none"></video>
      </div>
      <div class="work-grid__overlay">
        <span class="work-grid__title">${project.title}</span>
        <span class="work-grid__client">${project.client}</span>
      </div>
    `;

    grid.appendChild(item);
  });

  section.appendChild(grid);

  // View More button
  const viewMore = document.createElement('div');
  viewMore.className = 'work-view-more';
  viewMore.innerHTML = `<button class="work-view-more__btn">View More</button>`;
  section.appendChild(viewMore);

  // Expanded player (hidden by default)
  const player = document.createElement('div');
  player.className = 'work-player';
  player.id = 'workPlayer';
  player.innerHTML = `
    <div class="work-player__card">
      <div class="work-player__inner">
        <video class="work-player__video" muted playsinline preload="none"></video>
        <button class="work-player__close" aria-label="Close">&times;</button>
        <div class="video-progress work-player__progress">
          <span class="video-progress__timecode"></span>
          <div class="video-progress__bar">
            <div class="video-progress__filled"></div>
          </div>
        </div>
        <div class="hero__controls work-player__controls">
          <div class="hero__volume-wrap">
            <button class="hero__control-btn work-player__volume-btn" aria-label="Volume">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="18" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="18" y2="15"/></svg>
            </button>
            <input type="range" class="hero__volume-slider work-player__volume-slider" min="0" max="1" step="0.05" value="0">
          </div>
          <button class="hero__control-btn work-player__fullscreen-btn" aria-label="Fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
          </button>
        </div>
      </div>
      <div class="work-player__info">
        <span class="work-player__title"></span>
        <span class="work-player__client"></span>
        <span class="work-player__director"></span>
        <p class="work-player__description"></p>
      </div>
    </div>
  `;
  section.appendChild(player);

  main.appendChild(section);

  initWorkInteractions(work);
  initWorkFilters();
  initWorkScrollReveal();
}

function initWorkInteractions(work) {
  const grid = document.querySelector('.work-grid');
  const player = document.getElementById('workPlayer');
  const playerVideo = player.querySelector('.work-player__video');
  const playerTitle = player.querySelector('.work-player__title');
  const playerClient = player.querySelector('.work-player__client');
  const playerDirector = player.querySelector('.work-player__director');
  const playerDesc = player.querySelector('.work-player__description');
  const playerInfo = player.querySelector('.work-player__info');
  const closeBtn = player.querySelector('.work-player__close');
  let infoTimer;

  // Hover: play preview clip
  grid.addEventListener('mouseenter', (e) => {
    const item = e.target.closest('.work-grid__item');
    if (!item) return;
    const preview = item.querySelector('.work-grid__preview');
    const src = item.dataset.preview;
    if (preview && src) {
      preview.src = src;
      preview.currentTime = 0;
      preview.play().catch(() => {});
    }
  }, true);

  grid.addEventListener('mouseleave', (e) => {
    const item = e.target.closest('.work-grid__item');
    if (!item) return;
    const preview = item.querySelector('.work-grid__preview');
    if (preview) {
      preview.pause();
      preview.removeAttribute('src');
    }
  }, true);

  // Click: expand to full-width player
  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.work-grid__item');
    if (!item) return;

    const idx = parseInt(item.dataset.index);
    const project = work[idx];

    // Stop hover preview
    const preview = item.querySelector('.work-grid__preview');
    if (preview) {
      preview.pause();
      preview.removeAttribute('src');
    }

    // Set player content
    playerTitle.textContent = project.title;
    playerClient.textContent = project.client;
    playerDirector.textContent = project.director ? 'Directed by ' + project.director : '';
    playerDesc.textContent = project.description || '';

    const videoSrc = project.video || project.preview;
    if (videoSrc) {
      playerVideo.src = videoSrc;
      playerVideo.play().catch(() => {});
    }

    // Get the clicked item's position for the animation origin
    const rect = item.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();

    player.style.setProperty('--origin-top', `${rect.top - gridRect.top}px`);
    player.style.setProperty('--origin-left', `${rect.left - gridRect.left}px`);
    player.style.setProperty('--origin-width', `${rect.width}px`);
    player.style.setProperty('--origin-height', `${rect.height}px`);

    // Activate
    player.classList.add('is-active');
    grid.classList.add('is-dimmed');
    document.body.classList.add('modal-open');
  });

  // Close player
  function closePlayer() {
    player.classList.remove('is-active');
    grid.classList.remove('is-dimmed');
    document.body.classList.remove('modal-open');
    playerVideo.pause();
    playerVideo.removeAttribute('src');
  }

  closeBtn.addEventListener('click', closePlayer);

  player.addEventListener('click', (e) => {
    if (e.target === player || e.target === player.querySelector('.work-player__inner')) {
      closePlayer();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && player.classList.contains('is-active')) {
      closePlayer();
    }
  });

  // Modal player controls
  const modalVolBtn = player.querySelector('.work-player__volume-btn');
  const modalVolSlider = player.querySelector('.work-player__volume-slider');
  const modalFsBtn = player.querySelector('.work-player__fullscreen-btn');
  const modalInner = player.querySelector('.work-player__inner');

  modalVolBtn.addEventListener('click', () => {
    if (playerVideo.muted) {
      playerVideo.muted = false;
      playerVideo.volume = parseFloat(modalVolSlider.value) || 0.5;
      modalVolSlider.value = playerVideo.volume;
    } else {
      playerVideo.muted = true;
    }
    updateModalVolumeIcon();
  });

  modalVolSlider.addEventListener('input', () => {
    playerVideo.volume = parseFloat(modalVolSlider.value);
    playerVideo.muted = playerVideo.volume === 0;
    updateModalVolumeIcon();
  });

  function updateModalVolumeIcon() {
    if (playerVideo.muted || playerVideo.volume === 0) {
      modalVolBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="18" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="18" y2="15"/></svg>`;
    } else {
      modalVolBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>`;
    }
  }

  modalFsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      (modalInner.requestFullscreen || modalInner.webkitRequestFullscreen).call(modalInner);
    }
  });

  // Modal progress bar
  const modalProgressFilled = player.querySelector('.work-player__progress .video-progress__filled');
  const modalTimecode = player.querySelector('.work-player__progress .video-progress__timecode');
  const modalProgress = player.querySelector('.work-player__progress');

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  playerVideo.addEventListener('timeupdate', () => {
    if (playerVideo.duration) {
      const pct = (playerVideo.currentTime / playerVideo.duration) * 100;
      modalProgressFilled.style.width = pct + '%';
      modalTimecode.textContent = formatTime(playerVideo.currentTime) + ' / ' + formatTime(playerVideo.duration);
    }
  });

  modalProgress.addEventListener('click', (e) => {
    const rect = modalProgress.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    playerVideo.currentTime = pct * playerVideo.duration;
  });
}

// --- Work Filters ---
function activateFilter(filterSlug) {
  const tabsWrap = document.querySelector('.work-filters__tabs');
  if (!tabsWrap) return;
  const tabs = tabsWrap.querySelectorAll('.work-filters__tab');
  const line = tabsWrap.querySelector('.work-filters__line');
  const items = document.querySelectorAll('.work-grid__item');

  tabs.forEach(tab => {
    if (tab.dataset.filter === filterSlug) {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      line.style.left = tab.offsetLeft + 'px';
      line.style.width = tab.offsetWidth + 'px';

      items.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
      });

      setTimeout(() => {
        items.forEach((item, i) => {
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, i * 60);
        });
      }, 300);
    }
  });
}

function initWorkFilters() {
  const tabsWrap = document.querySelector('.work-filters__tabs');
  const line = tabsWrap.querySelector('.work-filters__line');
  const tabs = tabsWrap.querySelectorAll('.work-filters__tab');

  function moveLine(tab) {
    line.style.left = tab.offsetLeft + 'px';
    line.style.width = tab.offsetWidth + 'px';
  }

  // Hover: animate line to hovered tab
  tabs.forEach(tab => {
    tab.addEventListener('mouseenter', () => moveLine(tab));
  });

  // Mouse leave tabs: return to active tab
  tabsWrap.addEventListener('mouseleave', () => {
    const active = tabsWrap.querySelector('.is-active');
    if (active) moveLine(active);
  });

  // Click: set active and simulate filter
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activateFilter(tab.dataset.filter);
    });
  });
}

// --- Case Studies ---
function renderCaseStudies(caseStudies) {
  if (!caseStudies || !caseStudies.length) return;
  const main = document.getElementById('main');

  const section = document.createElement('section');
  section.className = 'case-studies';
  section.id = 'case-studies';

  caseStudies.forEach((cs, i) => {
    const row = document.createElement('div');
    row.className = 'case-study';

    row.innerHTML = `
      <img class="case-study__img" src="${cs.thumbnail}" alt="${cs.title}" loading="lazy">
      ${cs.video ? `<video class="case-study__video" muted loop playsinline preload="none"></video>` : ''}
      <div class="case-study__overlay"></div>

      <div class="case-study__content">
        <div class="case-study__info">
          <span class="case-study__client"><strong class="case-study__label-inline">Case Study:</strong> ${cs.client}</span>
          <span class="case-study__title">${cs.title}</span>
          <div class="case-study__description-wrap">
            <p class="case-study__description">${cs.description || ''} <span class="case-study__read-more">Read more</span></p>
          </div>
        </div>
      </div>
    `;

    row.dataset.video = cs.video || '';
    row.dataset.title = cs.title;
    row.dataset.client = cs.client;
    row.dataset.description = cs.description || '';
    section.appendChild(row);
  });

  // Show more button
  const moreWrap = document.createElement('div');
  moreWrap.className = 'case-studies__more';
  moreWrap.innerHTML = '<button class="case-studies__more-btn">Show more case studies</button>';
  section.appendChild(moreWrap);

  main.appendChild(section);

  // Scroll reveal: stagger each row in
  const rows = section.querySelectorAll('.case-study');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  rows.forEach((row, i) => {
    row.style.transitionDelay = `${i * 0.12}s`;
    observer.observe(row);
  });

  // Hover: play preview video (attached per row to avoid event bubble issues)
  rows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      const video = row.querySelector('.case-study__video');
      const src = row.dataset.video;
      if (video && src && !video.src) {
        video.src = src;
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    });
    row.addEventListener('mouseleave', () => {
      const video = row.querySelector('.case-study__video');
      if (video) {
        video.pause();
        video.removeAttribute('src');
      }
    });
  });

  // Click to open case study in the work player modal
  section.addEventListener('click', (e) => {
    const row = e.target.closest('.case-study');
    if (!row) return;

    const player = document.getElementById('workPlayer');
    if (!player) return;

    const playerVideo = player.querySelector('.work-player__video');
    const playerTitle = player.querySelector('.work-player__title');
    const playerClient = player.querySelector('.work-player__client');
    const playerDirector = player.querySelector('.work-player__director');
    const playerDesc = player.querySelector('.work-player__description');

    if (playerTitle) playerTitle.textContent = row.dataset.title;
    if (playerClient) playerClient.textContent = row.dataset.client;
    if (playerDirector) playerDirector.textContent = '';
    if (playerDesc) playerDesc.textContent = row.dataset.description;

    const videoSrc = row.dataset.video;
    if (videoSrc) {
      playerVideo.src = videoSrc;
      playerVideo.play().catch(() => {});
    }

    player.classList.add('is-active');
    document.body.classList.add('modal-open');
  });
}

// --- Directors Section ---
function renderDirectors(directors) {
  if (!directors || !directors.length) return;
  const main = document.getElementById('main');

  const section = document.createElement('section');
  section.className = 'directors-section';
  section.id = 'directors';

  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = '<div class="section-header__inner"><h2 class="section-header__title">Directors</h2></div>';
  section.appendChild(header);

  const content = document.createElement('div');
  content.className = 'directors-section__content';

  const cards = document.createElement('div');
  cards.className = 'directors-cards';

  directors.forEach((d, i) => {
    const card = document.createElement('div');
    card.className = 'director-card';
    card.dataset.index = i;
    card.innerHTML = `
      <img class="director-card__bg" src="${d.bg}" alt="${d.name}">
      <div class="director-card__overlay"></div>
      <div class="director-card__info">
        <span class="director-card__name">${d.name}</span>
        <span class="director-card__role">${d.role}</span>
      </div>
    `;
    cards.appendChild(card);
  });

  content.appendChild(cards);
  section.appendChild(content);
  main.appendChild(section);

  // Scroll reveal
  const directorsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        directorsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  directorsObserver.observe(section);

  // Modal interactions
  const modal = document.getElementById('directorModal');
  if (!modal) return;

  const modalPhoto = document.getElementById('directorPhoto');
  const modalName = document.getElementById('directorName');
  const modalRole = document.getElementById('directorRole');
  const modalBio = document.getElementById('directorBio');
  const modalClose = modal.querySelector('.director-modal__close');
  const modalContactBtn = document.getElementById('directorContactBtn');

  function openModal(director) {
    modalPhoto.style.backgroundImage = `url('${director.photo}')`;
    modalName.textContent = director.name;
    modalRole.textContent = director.role;
    modalBio.textContent = director.bio || '';
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  cards.addEventListener('click', (e) => {
    const card = e.target.closest('.director-card');
    if (!card) return;
    const idx = parseInt(card.dataset.index);
    openModal(directors[idx]);
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  modalContactBtn.addEventListener('click', () => {
    closeModal();
    setTimeout(() => {
      document.getElementById('contactModal').classList.add('is-open');
      document.body.classList.add('modal-open');
    }, 300);
  });
}

// --- Work Scroll Reveal ---
function initWorkScrollReveal() {
  const filters = document.querySelector('.work-filters');
  const items = document.querySelectorAll('.work-grid__item');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  if (filters) observer.observe(filters);

  items.forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.08}s`;
    observer.observe(item);
  });
}

// --- CTA Scroll Reveal ---
function initCtaReveal() {
  const cta = document.getElementById('cta');
  if (!cta) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        cta.classList.add('is-visible');
        observer.unobserve(cta);
      }
    });
  }, { threshold: 0.3 });
  observer.observe(cta);
}

// --- Footer ---
function initFooter(data) {
  document.getElementById('year').textContent = new Date().getFullYear();

  // Jobs modal
  const jobsModal = document.getElementById('jobsModal');
  const jobsClose = jobsModal.querySelector('.contact-modal__close');
  const footerJobsLink = document.getElementById('footerJobsLink');

  function openJobs() { jobsModal.classList.add('is-open'); document.body.classList.add('modal-open'); }
  function closeJobs() { jobsModal.classList.remove('is-open'); document.body.classList.remove('modal-open'); }

  footerJobsLink.addEventListener('click', (e) => { e.preventDefault(); openJobs(); });
  jobsClose.addEventListener('click', closeJobs);
  jobsModal.addEventListener('click', (e) => { if (e.target === jobsModal) closeJobs(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && jobsModal.classList.contains('is-open')) closeJobs();
  });

  // Footer contact link
  const footerContactLink = document.getElementById('footerContactLink');
  footerContactLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('contactModal').classList.add('is-open');
  });
}

// --- Scroll Effects ---
function initScrollEffects() {
  const nav = document.getElementById('nav');
  const workSection = document.getElementById('work');

  const ctaSection = document.getElementById('cta');

  window.addEventListener('scroll', () => {
    const navH = nav.offsetHeight;
    const workTop = workSection ? workSection.getBoundingClientRect().top : Infinity;
    const ctaTop = ctaSection ? ctaSection.getBoundingClientRect().top : Infinity;

    const overLight = workTop <= navH && ctaTop > navH;
    nav.classList.toggle('nav--light', overLight);
  }, { passive: true });

  // Hero thumb hover: play preview
  document.addEventListener('mouseenter', (e) => {
    const item = e.target.closest('.thumb-strip__item');
    if (!item) return;
    const video = item.querySelector('.thumb-strip__video');
    const src = item.dataset.preview;
    if (video && src) {
      video.src = src;
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, true);

  document.addEventListener('mouseleave', (e) => {
    const item = e.target.closest('.thumb-strip__item');
    if (!item) return;
    const video = item.querySelector('.thumb-strip__video');
    if (video) {
      video.pause();
      video.removeAttribute('src');
    }
  }, true);

  // Thumbnail click to swap hero video
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.thumb-strip__item[data-video]');
    if (!item) return;
    const videoSrc = item.dataset.video;
    if (!videoSrc) return;

    // Stop the hover preview
    const preview = item.querySelector('.thumb-strip__video');
    if (preview) {
      preview.pause();
      preview.removeAttribute('src');
      preview.style.opacity = '0';
    }

    const heroVideo = document.getElementById('heroVideo');
    if (heroVideo && heroVideo.src !== videoSrc) {
      heroVideo.style.opacity = '0';
      setTimeout(() => {
        heroVideo.src = videoSrc;
        heroVideo.play().catch(() => {});
        heroVideo.style.opacity = '1';
      }, 300);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

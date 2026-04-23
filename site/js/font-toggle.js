// Font Toggle — dev tool for testing typography
// Remove this file + script tag when a font is chosen

(function () {
  const w = '400;500;600;700';
  const fonts = [
    // Current
    { name: 'Inter', weights: w },
    // Geometric / clean sans
    { name: 'DM Sans', weights: w },
    { name: 'Manrope', weights: w },
    { name: 'Outfit', weights: w },
    { name: 'Plus Jakarta Sans', weights: w },
    { name: 'Sora', weights: w },
    { name: 'Space Grotesk', weights: w },
    { name: 'Urbanist', weights: w },
    { name: 'Albert Sans', weights: w },
    { name: 'Figtree', weights: w },
    { name: 'Geist', weights: w },
    { name: 'Nunito Sans', weights: w },
    { name: 'Quicksand', weights: w },
    { name: 'Comfortaa', weights: w },
    { name: 'Varela Round', weights: '400' },
    { name: 'Exo 2', weights: w },
    // Modern / editorial
    { name: 'Poppins', weights: w },
    { name: 'Montserrat', weights: w },
    { name: 'Raleway', weights: w },
    { name: 'Karla', weights: w },
    { name: 'Rubik', weights: w },
    { name: 'Work Sans', weights: w },
    { name: 'Lexend', weights: w },
    { name: 'Jost', weights: w },
    { name: 'Josefin Sans', weights: w },
    { name: 'Barlow', weights: w },
    { name: 'Barlow Condensed', weights: w },
    { name: 'Overpass', weights: w },
    { name: 'Mukta', weights: w },
    { name: 'Heebo', weights: w },
    { name: 'Archivo', weights: w },
    { name: 'Archivo Narrow', weights: w },
    { name: 'Signika', weights: w },
    { name: 'Maven Pro', weights: w },
    { name: 'Catamaran', weights: w },
    { name: 'Sarabun', weights: w },
    { name: 'Kanit', weights: w },
    { name: 'Prompt', weights: w },
    // Premium / cinematic
    { name: 'Darker Grotesque', weights: w },
    { name: 'Hanken Grotesk', weights: w },
    { name: 'Red Hat Display', weights: w },
    { name: 'Red Hat Text', weights: w },
    { name: 'Bricolage Grotesque', weights: w },
    { name: 'Instrument Sans', weights: w },
    { name: 'Schibsted Grotesk', weights: w },
    { name: 'Be Vietnam Pro', weights: w },
    { name: 'Epilogue', weights: w },
    { name: 'Familjen Grotesk', weights: w },
    { name: 'Kumbh Sans', weights: w },
    { name: 'Chivo', weights: w },
    { name: 'Public Sans', weights: w },
    { name: 'Readex Pro', weights: w },
    { name: 'Wix Madefor Display', weights: w },
    { name: 'Onest', weights: w },
    { name: 'Gabarito', weights: w },
    { name: 'Inclusive Sans', weights: w },
    // Condensed / display
    { name: 'Oswald', weights: w },
    { name: 'Bebas Neue', weights: '400' },
    { name: 'Anton', weights: '400' },
    { name: 'Teko', weights: w },
    { name: 'Fjalla One', weights: '400' },
    { name: 'Pathway Extreme', weights: w },
    { name: 'Big Shoulders Display', weights: w },
    // Elegant / slightly rounded
    { name: 'Nunito', weights: w },
    { name: 'Cabin', weights: w },
    { name: 'Muli', weights: w },
    { name: 'Assistant', weights: w },
    { name: 'Hind', weights: w },
    { name: 'Sen', weights: w },
    { name: 'Zen Kaku Gothic New', weights: w },
    // Tech / sharp
    { name: 'IBM Plex Sans', weights: w },
    { name: 'IBM Plex Mono', weights: w },
    { name: 'JetBrains Mono', weights: w },
    { name: 'Source Sans 3', weights: w },
    { name: 'Source Code Pro', weights: w },
    { name: 'Fira Sans', weights: w },
    { name: 'Fira Code', weights: w },
    { name: 'Roboto', weights: w },
    { name: 'Roboto Condensed', weights: w },
    { name: 'Roboto Mono', weights: w },
    { name: 'Noto Sans', weights: w },
    { name: 'Open Sans', weights: w },
    { name: 'Lato', weights: w },
    { name: 'PT Sans', weights: '400;700' },
    // Serif (for contrast testing)
    { name: 'Playfair Display', weights: w },
    { name: 'Cormorant Garamond', weights: w },
    { name: 'Libre Baskerville', weights: '400;700' },
    { name: 'Lora', weights: w },
    { name: 'Source Serif 4', weights: w },
    { name: 'DM Serif Display', weights: '400' },
    { name: 'Fraunces', weights: w },
    { name: 'Newsreader', weights: w },
    { name: 'Crimson Pro', weights: w },
    { name: 'EB Garamond', weights: w },
    { name: 'Bitter', weights: w },
    // Fontshare
    { name: 'Satoshi', weights: w, source: 'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap' },
    { name: 'General Sans', weights: w, source: 'https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap' },
    { name: 'Cabinet Grotesk', weights: w, source: 'https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700&display=swap' },
    { name: 'Switzer', weights: w, source: 'https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap' },
    { name: 'Clash Display', weights: w, source: 'https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap' },
    { name: 'Clash Grotesk', weights: w, source: 'https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600,700&display=swap' },
  ];

  const saved = localStorage.getItem('triglass-font');
  const loaded = new Set();

  function loadFont(font) {
    if (loaded.has(font.name)) return;
    loaded.add(font.name);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    if (font.source) {
      link.href = font.source;
    } else {
      const family = font.name.replace(/ /g, '+');
      link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@${font.weights}&display=swap`;
    }
    document.head.appendChild(link);
  }

  function applyFont(name) {
    document.documentElement.style.setProperty(
      '--font-body',
      `'${name}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    );
    localStorage.setItem('triglass-font', name);
    // Update active state
    document.querySelectorAll('.font-toggle__option').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.font === name);
    });
  }

  // Apply saved font on load
  if (saved) {
    const font = fonts.find(f => f.name === saved);
    if (font) {
      loadFont(font);
      applyFont(saved);
    }
  }

  // Build UI
  const wrap = document.createElement('div');
  wrap.className = 'font-toggle';

  const btn = document.createElement('button');
  btn.className = 'font-toggle__btn';
  btn.textContent = 'Aa';
  btn.title = 'Font picker';
  wrap.appendChild(btn);

  const panel = document.createElement('div');
  panel.className = 'font-toggle__panel';

  // Upload custom font option
  const upload = document.createElement('label');
  upload.className = 'font-toggle__option';
  upload.style.cursor = 'pointer';
  upload.textContent = '+ Upload font file';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.woff,.woff2,.ttf,.otf';
  fileInput.style.display = 'none';
  upload.appendChild(fileInput);
  panel.appendChild(upload);

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const fontName = file.name.replace(/\.[^.]+$/, '');
    const face = new FontFace(fontName, buffer);
    await face.load();
    document.fonts.add(face);
    applyFont(fontName);
    // Add a button for it
    const opt = document.createElement('button');
    opt.className = 'font-toggle__option is-active';
    opt.dataset.font = fontName;
    opt.textContent = fontName + ' (uploaded)';
    opt.style.fontFamily = `'${fontName}', sans-serif`;
    opt.addEventListener('click', () => applyFont(fontName));
    panel.insertBefore(opt, upload.nextSibling);
    // Clear active on others
    document.querySelectorAll('.font-toggle__option').forEach(b => {
      if (b !== opt) b.classList.remove('is-active');
    });
    fileInput.value = '';
  });

  const divider = document.createElement('div');
  divider.style.cssText = 'height:1px;background:rgba(255,255,255,0.1);margin:4px 0;';
  panel.appendChild(divider);

  fonts.forEach(font => {
    const opt = document.createElement('button');
    opt.className = 'font-toggle__option';
    opt.dataset.font = font.name;
    opt.textContent = font.name;
    if ((saved || 'Inter') === font.name) opt.classList.add('is-active');

    // Load font on hover so we don't fetch all 100 upfront
    opt.addEventListener('mouseenter', () => {
      loadFont(font);
      opt.style.fontFamily = `'${font.name}', sans-serif`;
    });

    opt.addEventListener('click', () => {
      loadFont(font);
      applyFont(font.name);
    });
    panel.appendChild(opt);
  });

  wrap.appendChild(panel);
  const navRight = document.getElementById('navRight');
  navRight.insertBefore(wrap, navRight.firstChild);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('is-open');
  });

  document.addEventListener('click', () => {
    panel.classList.remove('is-open');
  });

  panel.addEventListener('click', (e) => e.stopPropagation());
})();

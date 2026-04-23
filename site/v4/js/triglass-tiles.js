// Triglass Tiles — reusable faceted glass pattern overlay
// Usage: triglassTiles(containerElement, options?)

function triglassTiles(container, opts = {}) {
  const W = opts.size || 50;
  const H = Math.round(W * 0.866);
  const halfW = W / 2;

  // Ensure container can hold absolutely positioned children
  const pos = getComputedStyle(container).position;
  if (pos === 'static') container.style.position = 'relative';

  const rect = container.getBoundingClientRect();
  const vw = rect.width;
  const vh = rect.height;

  const cols = Math.ceil(vw / halfW) + 2;
  const rows = Math.ceil(vh / H) + 2;

  const downFills = opts.fills || [
    'rgba(255,255,255,0.017)',
    'rgba(255,255,255,0.028)',
    'rgba(255,255,255,0.003)',
    'rgba(255,255,255,0.014)',
  ];

  const downBuckets = ['','','',''];
  let downEdges = '';
  let downInner = '';
  let upEdges = '';
  let clipTriangles = '';

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const isDown = ((c + r) & 1) === 0;
      const x = c * halfW;
      const y = r * H;

      if (isDown) {
        const ax = x, ay = y;
        const bx = x+W, by = y;
        const cx = x+halfW, cy = y+H;
        const mx = x+W/4, my = y+H/2;
        const nx = x+3*W/4, ny = y+H/2;

        downBuckets[0] += `M${ax},${ay}L${ax+halfW},${ay}L${mx},${my}Z `;
        downBuckets[1] += `M${ax+halfW},${ay}L${bx},${by}L${nx},${ny}Z `;
        downBuckets[2] += `M${mx},${my}L${ax+halfW},${ay}L${nx},${ny}Z `;
        downBuckets[3] += `M${mx},${my}L${nx},${ny}L${cx},${cy}Z `;

        downEdges += `M${ax},${ay}L${bx},${by}L${cx},${cy}Z `;
        downInner += `M${ax+halfW},${ay}L${mx},${my} M${ax+halfW},${ay}L${nx},${ny} M${mx},${my}L${nx},${ny} `;
        downInner += `M${mx},${my}L${cx},${cy} M${nx},${ny}L${cx},${cy} `;

        clipTriangles += `M${ax},${ay}L${bx},${by}L${cx},${cy}Z `;
      } else {
        const ax = x+halfW, ay = y;
        const bx = x, by = y+H;
        const cx2 = x+W, cy2 = y+H;
        upEdges += `M${ax},${ay}L${bx},${by}L${cx2},${cy2}Z `;
      }
    }
  }

  // Base blur layer (covers everything lightly)
  const baseBlur = document.createElement('div');
  baseBlur.className = 'tg-tile-base-blur';
  container.appendChild(baseBlur);

  // Triangle blur layer (stronger, clipped to down-triangles)
  const triBlur = document.createElement('div');
  triBlur.className = 'tg-tile-blur';
  container.appendChild(triBlur);

  // Hidden SVG for clipPath definition
  const clipId = 'tgclip-' + Math.random().toString(36).slice(2, 8);
  const clipSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  clipSvg.setAttribute('width', '0');
  clipSvg.setAttribute('height', '0');
  clipSvg.style.position = 'absolute';
  clipSvg.innerHTML = `<defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><path d="${clipTriangles}"/></clipPath></defs>`;
  container.appendChild(clipSvg);

  triBlur.style.clipPath = `url(#${clipId})`;
  triBlur.style.webkitClipPath = `url(#${clipId})`;

  // Visual SVG overlay (lines + facet fills)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'tg-tile-svg');
  svg.setAttribute('width', vw);
  svg.setAttribute('height', vh);

  let html = '';
  for (let i = 0; i < 4; i++) {
    html += `<path d="${downBuckets[i]}" fill="${downFills[i]}"/>`;
  }
  html += `<path d="${downEdges}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>`;
  html += `<path d="${downInner}" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="0.3"/>`;
  html += `<path d="${upEdges}" fill="none" stroke="rgba(255,255,255,0.014)" stroke-width="0.3"/>`;

  svg.innerHTML = html;
  container.appendChild(svg);
}

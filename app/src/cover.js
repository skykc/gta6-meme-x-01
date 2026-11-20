// Neon Coast Cover Studio — the cover engine (vanilla 2D canvas, no network).
// Six multi-panel layouts, five gradient-map grades, a title block in Anton
// with a Pacifico neon subtitle, plus grain, vignette, a halftone option, a
// five-star heat meter and a badge ribbon. Everything is drawn from the
// caller's photos and state, so the same code renders the live preview and
// the exported PNGs at any size.

export const LAYOUTS = [
  { id: 'grid9', name: 'Nine Panel', panels: 8 },
  { id: 'collage', name: 'Collage', panels: 9 },
  { id: 'hero3', name: 'Hero + 3', panels: 4 },
  { id: 'fullbleed', name: 'Full Bleed', panels: 1 },
  { id: 'tilted', name: 'Tilted Snaps', panels: 3 },
  { id: 'sleeve6', name: 'Six Sleeve', panels: 6 },
  { id: 'poster', name: 'Poster', panels: 1 },
];

export const GRADES = [
  {
    id: 'sunset', name: 'Sunset',
    filter: 'saturate(1.28) contrast(1.08) brightness(1.03)',
    overlay: ['#ff7a3c', '#ff2e88'], overlayAlpha: 0.32, overlayMode: 'overlay',
    title: ['#ffd76a', '#ff5e7a'], sub: '#ff7ad9',
  },
  {
    id: 'neon', name: 'Neon Pink / Teal',
    filter: 'saturate(1.55) contrast(1.12)',
    overlay: ['#ff2e9a', '#00e5c7'], overlayAlpha: 0.30, overlayMode: 'soft-light',
    title: ['#ff7ad9', '#4de8ff'], sub: '#4de8ff',
  },
  {
    id: 'tealgold', name: 'Teal Gold',
    filter: 'saturate(1.12) contrast(1.06)',
    overlay: ['#0e7d7b', '#e8a93c'], overlayAlpha: 0.30, overlayMode: 'overlay',
    title: ['#ffe9a8', '#e8a93c'], sub: '#7fe0d4',
  },
  {
    id: 'ink', name: 'Mono Ink',
    filter: 'grayscale(1) contrast(1.28) brightness(1.06)',
    overlay: null, overlayAlpha: 0, overlayMode: 'overlay',
    title: ['#ffffff', '#ffffff'], sub: '#e8e8e8',
  },
  {
    id: 'dusk', name: 'Warm Dusk',
    filter: 'saturate(0.92) contrast(1.06) brightness(0.94) sepia(0.28)',
    overlay: ['#5b2a86', '#ff8a3c'], overlayAlpha: 0.22, overlayMode: 'multiply',
    title: ['#ffe6c4', '#ff9a5e'], sub: '#ffc9a3',
  },
];

export const SIZES = [
  { id: 'square', label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: 'story', label: 'Story 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

/** A fresh default state. `panels` holds nine crop configs; each layout uses the ones it needs.
 * Every panel uses a DIFFERENT sample photo (no repeats), and each crop is
 * centred on its photo's face, so no face is ever cut by a panel edge. */
export function defaultState() {
  const crops = [
    { photo: 12, cx: 0.25, cy: 0.50, zoom: 1.0 },  // mafia: landscape art, mobster on the left
    { photo: 13, cx: 0.55, cy: 0.50, zoom: 1.0 },  // bikini-drink: face + cocktail
    { photo: 14, cx: 0.55, cy: 0.55, zoom: 1.0 },  // lambo: driver face clear of the V logo's top edge
    { photo: 8, cx: 0.70, cy: 0.47, zoom: 1.4 },   // convertible: red classic, driver zoomed big
    { photo: 6, cx: 0.5, cy: 0.25, zoom: 1.3 },    // skater: face fully in frame, not under the title
    { photo: 4, cx: 0.45, cy: 0.40, zoom: 1.3 },   // lifeguard: face + chest tattoos in frame
    { photo: 9, cx: 0.57, cy: 0.55, zoom: 1.0 },   // oceandrive: Black rider standing stunt on a sport bike, neon street
    { photo: 10, cx: 0.55, cy: 0.55, zoom: 1.0 },  // alligator: head right, low in frame
    { photo: 11, cx: 0.5, cy: 0.58, zoom: 1.0 },   // dog: bar trio — guy with pistol, two girls with cocktails; cy 0.58 keeps faces + pistol in the wide slot
  ];
  return {
    layout: 'grid9',
    grade: 'sunset',
    title: 'NEON COAST',
    subtitle: 'chase the sunset',
    badge: 'EST. 2026',
    heat: 4,
    grain: true,
    vignette: true,
    halftone: true,
    panels: crops,
  };
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/**
 * Slot rects for a layout at W x H. Each slot is {x, y, w, h, panel, rot, kind}
 * where kind is 'photo', 'title' or 'band' and panel indexes state.panels.
 * The title block is always drawn last, on top of the photos.
 */
export function layoutSlots(layoutId, W, H) {
  const g = Math.max(2, Math.round(Math.min(W, H) * 0.014));
  const slots = [];
  if (layoutId === 'grid9') {
    const cw = (W - 2 * g) / 3;
    const ch = (H - 2 * g) / 3;
    let p = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const x = c * (cw + g);
        const y = r * (ch + g);
        if (r === 1 && c === 1) {
          slots.push({ x, y, w: cw, h: ch, panel: -1, rot: 0, kind: 'title' });
        } else {
          slots.push({ x, y, w: cw, h: ch, panel: p++, rot: 0, kind: 'photo' });
        }
      }
    }
  } else if (layoutId === 'collage') {
    // A key-art collage, not a uniform grid: two tall panels down the left
    // (mafia, bikini), two wide car panels across the top, three mid panels
    // and two wide panels at the foot, with the title block overlapping the
    // top/middle seam in the centre like a poster logo. Panel sizes vary on
    // purpose; every slot shows a different photo, nine in all.
    slots.push({ x: 0, y: 0, w: W * 0.25, h: H * 0.50, panel: 0, rot: 0, kind: 'photo' });
    slots.push({ x: 0, y: H * 0.50, w: W * 0.25, h: H * 0.50, panel: 1, rot: 0, kind: 'photo' });
    slots.push({ x: W * 0.25, y: 0, w: W * 0.37, h: H * 0.34, panel: 2, rot: 0, kind: 'photo' });
    slots.push({ x: W * 0.62, y: 0, w: W * 0.38, h: H * 0.34, panel: 3, rot: 0, kind: 'photo' });
    slots.push({ x: W * 0.25, y: H * 0.34, w: W * 0.25, h: H * 0.33, panel: 4, rot: 0, kind: 'photo' });
    slots.push({ x: W * 0.50, y: H * 0.34, w: W * 0.25, h: H * 0.33, panel: 5, rot: 0, kind: 'photo' });
    slots.push({ x: W * 0.75, y: H * 0.34, w: W * 0.25, h: H * 0.33, panel: 6, rot: 0, kind: 'photo' });
    slots.push({ x: W * 0.25, y: H * 0.67, w: W * 0.37, h: H * 0.33, panel: 7, rot: 0, kind: 'photo' });
    slots.push({ x: W * 0.62, y: H * 0.67, w: W * 0.38, h: H * 0.33, panel: 8, rot: 0.03, kind: 'photo' });
    slots.push({ x: W * 0.29, y: H * 0.22, w: W * 0.36, h: H * 0.32, panel: -1, rot: 0, kind: 'logo' });
  } else if (layoutId === 'hero3') {
    const hw = W * 0.62;
    const rw = W - hw - g;
    const rh = (H - 2 * g) / 3;
    slots.push({ x: 0, y: 0, w: hw, h: H, panel: 0, rot: 0, kind: 'photo' });
    for (let i = 0; i < 3; i++) {
      slots.push({ x: hw + g, y: i * (rh + g), w: rw, h: rh, panel: 1 + i, rot: 0, kind: 'photo' });
    }
    slots.push({ x: 0, y: H * 0.80, w: W, h: H * 0.20, panel: -1, rot: 0, kind: 'band', bandStyle: 'bottom' });
  } else if (layoutId === 'fullbleed') {
    slots.push({ x: 0, y: 0, w: W, h: H, panel: 0, rot: 0, kind: 'photo' });
    slots.push({ x: 0, y: H * 0.72, w: W, h: H * 0.28, panel: -1, rot: 0, kind: 'band', bandStyle: 'bottom' });
  } else if (layoutId === 'tilted') {
    slots.push({ x: 0, y: 0, w: W, h: H * 0.13, panel: -1, rot: 0, kind: 'band', bandStyle: 'top' });
    // Narrower cards with wider gaps and gentler tilts: a rotated card's
    // corner must never cross the gap into its neighbour, or a sliver of the
    // neighbour's face peeks out at the card edge.
    const cw = W * 0.29;
    const ch = H * 0.72;
    const y = H * 0.16;
    slots.push({ x: W * 0.02, y, w: cw, h: ch, panel: 0, rot: -0.045, kind: 'photo' });
    slots.push({ x: W * 0.345, y: y - H * 0.02, w: cw, h: ch, panel: 1, rot: 0.03, kind: 'photo' });
    slots.push({ x: W * 0.67, y, w: cw, h: ch, panel: 2, rot: -0.02, kind: 'photo' });
    slots.push({ x: 0, y: H * 0.92, w: W, h: H * 0.05, panel: -1, rot: 0, kind: 'footer' });
  } else if (layoutId === 'sleeve6') {
    const cw = (W - 2 * g) / 3;
    const ch = (H * 0.80 - g) / 2;
    let p = 0;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        slots.push({ x: c * (cw + g), y: r * (ch + g), w: cw, h: ch, panel: p++, rot: 0, kind: 'photo' });
      }
    }
    slots.push({ x: 0, y: H * 0.82, w: W, h: H * 0.18, panel: -1, rot: 0, kind: 'band', bandStyle: 'bottom' });
  } else {
    // poster: one photo, title over the darkened foot.
    slots.push({ x: 0, y: 0, w: W, h: H, panel: 0, rot: 0, kind: 'photo' });
    slots.push({ x: 0, y: H * 0.56, w: W, h: H * 0.44, panel: -1, rot: 0, kind: 'band', bandStyle: 'bottom' });
  }
  return slots;
}

// --- deterministic grain -------------------------------------------------
// A fixed-seed noise tile, so the same state always renders the same cover.
let noiseTile = null;
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 192; c.height = 192;
  const x = c.getContext('2d');
  const img = x.createImageData(192, 192);
  const rnd = mulberry32(20261119);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

// --- helpers ---------------------------------------------------------------
function fitFont(ctx, text, family, weight, maxW, startSize, minSize = 10) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > minSize && ctx.measureText(text).width > maxW) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (fill) ctx.fill();
  else ctx.stroke();
}

function drawHeat(ctx, x, y, size, heat) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 5; i++) {
    const cx = x + i * size * 1.35 + size / 2;
    ctx.fillStyle = i < heat ? '#ffd76a' : 'rgba(255,255,255,0.25)';
    ctx.strokeStyle = 'rgba(20,9,43,0.85)';
    ctx.lineWidth = Math.max(1, size * 0.06);
    drawStar(ctx, cx, y, size / 2, i < heat);
    if (i >= heat) ctx.stroke();
  }
  ctx.restore();
}

function drawBadge(ctx, x, y, w, h, text) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(-0.06);
  const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  grad.addColorStop(0, '#ff2e88');
  grad.addColorStop(1, '#ff7a3c');
  ctx.fillStyle = grad;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1, h * 0.08);
  ctx.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitFont(ctx, text, 'Anton, sans-serif', 400, w * 0.86, h * 0.62);
  ctx.font = `400 ${size}px Anton, sans-serif`;
  ctx.fillText(text, 0, h * 0.03);
  ctx.restore();
}

function drawHalftone(ctx, x, y, w, h, step, alpha) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const t = (xx - x) / w;
      const r = (step * 0.42) * (0.35 + 0.65 * t);
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// --- photo panels ----------------------------------------------------------
function drawPhotoPanel(ctx, slot, photo, grade, W, H) {
  const { x, y, w, h, rot } = slot;
  ctx.save();
  if (rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    ctx.translate(-w / 2, -h / 2);
  } else {
    ctx.translate(x, y);
  }
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  if (photo) {
    const iw = photo.naturalWidth;
    const ih = photo.naturalHeight;
    const cfg = slot.cfg;
    // Cover-fit with a zoomed source window centred on (cx, cy): the source
    // rect is clamped inside the photo, so no image content is ever drawn
    // outside the canvas (drawing past the canvas edge renders slightly
    // differently run to run under SwiftShader).
    const scale = Math.max(w / iw, h / ih) * cfg.zoom;
    const sw = w / scale;
    const sh = h / scale;
    const sx = Math.min(Math.max(cfg.cx * iw - sw / 2, 0), iw - sw);
    const sy = Math.min(Math.max(cfg.cy * ih - sh / 2, 0), ih - sh);
    ctx.filter = grade.filter;
    ctx.drawImage(photo, sx, sy, sw, sh, 0, 0, w, h);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#2a1845';
    ctx.fillRect(0, 0, w, h);
  }
  if (grade.overlay) {
    const og = ctx.createLinearGradient(0, 0, w * 0.25, h);
    og.addColorStop(0, grade.overlay[0]);
    og.addColorStop(1, grade.overlay[1]);
    ctx.globalCompositeOperation = grade.overlayMode;
    ctx.globalAlpha = grade.overlayAlpha;
    ctx.fillStyle = og;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  // Inked poster banding: a dark outer edge and a thin white inner line.
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.012);
  ctx.strokeStyle = '#14092b';
  ctx.strokeRect(0, 0, w, h);
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.004);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.strokeRect(ctx.lineWidth * 2, ctx.lineWidth * 2, w - ctx.lineWidth * 4, h - ctx.lineWidth * 4);
  ctx.restore();
}

// --- title block -----------------------------------------------------------
function drawTitleBlock(ctx, slot, state, grade, W, H) {
  const { x, y, w, h, kind } = slot;
  const u = Math.min(w, h);
  ctx.save();

  // Footer strip (tilted layout): one centred line, no background.
  if (kind === 'footer') {
    const text = `${(state.title || 'NEON COAST').toUpperCase()}  ·  ${state.badge || 'EST. 2026'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = grade.title[0];
    const size = fitFont(ctx, text, 'Anton, sans-serif', 400, w * 0.9, h * 0.62);
    ctx.font = `400 ${size}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(1, size * 0.12)}px`; } catch { /* older canvas */ }
    ctx.fillText(text, x + w / 2, y + h / 2);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    ctx.restore();
    return;
  }

  // Collage logo block: a slim V chevron (after the big V silhouette in
  // Risma's reference — the shape only, never the Rockstar logo itself),
  // sunset-gradient fill, white Anton text with a dark outline. The V covers
  // far less of the photos than the old wide rectangle (its point sits
  // between the skater and lifeguard panels, below both faces), and the type
  // is nearly twice as big. The subtitle floats just under the point.
  if (kind === 'logo') {
    const cx = x + w / 2;
    const logoTitle = (state.title || 'NEON COAST').toUpperCase();
    const logoLines = logoTitle.split(/\s+/).filter(Boolean);
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#7c5cff');
    grad.addColorStop(0.45, '#ff5e9c');
    grad.addColorStop(1, '#ff8a3c');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(cx, y + h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = Math.max(3, w * 0.012);
    ctx.strokeStyle = '#14092b';
    ctx.stroke();
    ctx.lineWidth = Math.max(1, w * 0.003);
    ctx.strokeStyle = 'rgba(255,46,136,0.9)';
    ctx.stroke();

    const pad = w * 0.04;
    const bandH = h * 0.30;
    const lineTs = [0.30, 0.58];
    let size = bandH;
    logoLines.forEach((line, i) => {
      const t = i < lineTs.length ? lineTs[i] : 0.58 + 0.22 * (i - 1);
      const maxW = w * (1 - t) - pad * 2;
      size = Math.min(size, fitFont(ctx, line, 'Anton, sans-serif', 400, maxW, bandH));
    });
    size = Math.max(10, size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    logoLines.forEach((line, i) => {
      const t = i < lineTs.length ? lineTs[i] : 0.58 + 0.22 * (i - 1);
      const cy = y + h * t;
      ctx.font = `400 ${size}px Anton, sans-serif`;
      ctx.lineWidth = Math.max(1, size * 0.08);
      ctx.strokeStyle = '#14092b';
      ctx.strokeText(line, cx, cy);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, cx, cy);
    });
    const sub = (state.subtitle || '').trim();
    if (sub) {
      // The tagline rides on a small dark pill just under the point, so it
      // stays readable over the busy photos instead of sprawling across
      // the skater's and lifeguard's necks.
      const subSize = fitFont(ctx, sub, 'Pacifico, cursive', 400, w * 0.85, h * 0.13);
      ctx.font = `400 ${subSize}px Pacifico, cursive`;
      const subY = y + h + h * 0.10;
      const textW = ctx.measureText(sub).width;
      const pillW = textW + subSize * 1.2;
      const pillH = subSize * 1.9;
      const px = cx - pillW / 2;
      const py = subY - pillH / 2;
      const r = pillH / 2;
      ctx.beginPath();
      ctx.moveTo(px + r, py);
      ctx.lineTo(px + pillW - r, py);
      ctx.arcTo(px + pillW, py, px + pillW, py + r, r);
      ctx.lineTo(px + pillW, py + pillH - r);
      ctx.arcTo(px + pillW, py + pillH, px + pillW - r, py + pillH, r);
      ctx.lineTo(px + r, py + pillH);
      ctx.arcTo(px, py + pillH, px, py + pillH - r, r);
      ctx.lineTo(px, py + r);
      ctx.arcTo(px, py, px + r, py, r);
      ctx.closePath();
      ctx.fillStyle = '#14092b';
      ctx.fill();
      ctx.lineWidth = Math.max(1, subSize * 0.06);
      ctx.strokeStyle = '#ff2e88';
      ctx.stroke();
      ctx.fillStyle = grade.sub;
      ctx.shadowColor = grade.sub;
      ctx.shadowBlur = subSize * 0.35;
      ctx.fillText(sub, cx, subY);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
    return;
  }

  if (kind === 'band') {
    if (slot.bandStyle === 'top') {
      ctx.fillStyle = 'rgba(20,9,43,0.94)';
      ctx.fillRect(x, y, w, h);
    } else {
      const bg = ctx.createLinearGradient(0, y, 0, y + h);
      bg.addColorStop(0, 'rgba(20,9,43,0.55)');
      bg.addColorStop(0.35, 'rgba(20,9,43,0.9)');
      bg.addColorStop(1, 'rgba(20,9,43,0.97)');
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);
    }
  } else {
    ctx.fillStyle = '#14092b';
    ctx.fillRect(x, y, w, h);
    if (state.halftone) drawHalftone(ctx, x, y, w, h, Math.max(10, u * 0.09), 0.10);
    ctx.lineWidth = Math.max(2, u * 0.012);
    ctx.strokeStyle = '#ff2e88';
    ctx.strokeRect(x, y, w, h);
  }

  const pad = u * 0.07;
  const title = (state.title || 'NEON COAST').toUpperCase();
  const lines = title.split(/\s+/).filter(Boolean);
  const isBlock = kind === 'title';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (!isBlock) {
    // Band: stars on the top row, title in the middle, subtitle at the foot,
    // badge ribbon in the cover's top-right corner (never over a face).
    const starSize = Math.max(8, h * 0.13);
    const starsW = starSize * 1.35 * 5;
    drawHeat(ctx, x + (w - starsW) / 2, y + h * 0.14, starSize, state.heat);
    const bw = Math.min(W * 0.2, 240);
    const bh = Math.max(14, Math.min(h * 0.24, 46));
    drawBadge(ctx, W - bw - pad, pad, bw, bh, state.badge || 'EST. 2026');

    const titleMaxW = w - pad * 2;
    const titleMaxH = h * 0.34;
    // Bands read best with one big line; stack the words only when a single
    // line would shrink below a useful size.
    let titleLines = [title];
    const oneLineSize = fitFont(ctx, title, 'Anton, sans-serif', 400, titleMaxW, titleMaxH * 0.92);
    if (oneLineSize < titleMaxH * 0.42) titleLines = lines;
    const lineH = titleMaxH / Math.max(1, titleLines.length);
    let size = Math.min(lineH * 0.92, (titleMaxW / Math.max(1, ...titleLines.map((l) => l.length))) * 0.78);
    size = Math.max(10, size);
    for (const line of titleLines) {
      size = Math.min(size, fitFont(ctx, line, 'Anton, sans-serif', 400, titleMaxW, size));
    }
    const grad = ctx.createLinearGradient(x, y, x + w * 0.3, y + h);
    grad.addColorStop(0, grade.title[0]);
    grad.addColorStop(1, grade.title[1]);
    const totalH = lineH * titleLines.length;
    const startY = y + h * 0.50;
    titleLines.forEach((line, i) => {
      const cy = startY - totalH / 2 + lineH * (i + 0.5);
      ctx.font = `400 ${size}px Anton, sans-serif`;
      ctx.lineWidth = Math.max(1, size * 0.07);
      ctx.strokeStyle = 'rgba(20,9,43,0.9)';
      ctx.strokeText(line, x + w / 2, cy);
      ctx.fillStyle = grad;
      ctx.fillText(line, x + w / 2, cy);
    });
    const sub = (state.subtitle || '').trim();
    if (sub) {
      const subSize = fitFont(ctx, sub, 'Pacifico, cursive', 400, titleMaxW * 0.94, h * 0.20);
      ctx.font = `400 ${subSize}px Pacifico, cursive`;
      ctx.fillStyle = grade.sub;
      ctx.shadowColor = grade.sub;
      ctx.shadowBlur = subSize * 0.45;
      ctx.fillText(sub, x + w / 2, y + h * 0.82);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
    return;
  }

  // Centre title block (grid9): stacked title, heat meter, neon subtitle.
  const titleMaxW = w - pad * 2;
  const titleMaxH = h * 0.52;

  // Title in Anton, sunset-gradient fill, dark outline.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineH = titleMaxH / Math.max(1, lines.length);
  let size = Math.min(lineH * 0.92, titleMaxW / Math.max(1, ...lines.map((l) => l.length)) * 0.78);
  size = Math.max(10, size);
  for (const line of lines) {
    size = Math.min(size, fitFont(ctx, line, 'Anton, sans-serif', 400, titleMaxW, size));
  }
  const grad = ctx.createLinearGradient(x, y, x + w * 0.3, y + h);
  grad.addColorStop(0, grade.title[0]);
  grad.addColorStop(1, grade.title[1]);
  const totalH = lineH * lines.length;
  const startY = y + h * 0.30;
  lines.forEach((line, i) => {
    const cy = startY - totalH / 2 + lineH * (i + 0.5);
    ctx.font = `400 ${size}px Anton, sans-serif`;
    ctx.lineWidth = Math.max(1, size * 0.07);
    ctx.strokeStyle = 'rgba(20,9,43,0.9)';
    ctx.strokeText(line, x + w / 2, cy);
    ctx.fillStyle = grad;
    ctx.fillText(line, x + w / 2, cy);
  });

  // Subtitle in Pacifico, neon glow.
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = fitFont(ctx, sub, 'Pacifico, cursive', 400, titleMaxW * 0.94, h * 0.16);
    ctx.font = `400 ${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.sub;
    ctx.shadowColor = grade.sub;
    ctx.shadowBlur = subSize * 0.45;
    ctx.fillText(sub, x + w / 2, y + h * 0.82);
    ctx.shadowBlur = 0;
  }

  // Heat meter under the title.
  const starSize = Math.max(8, Math.min(w, h) * 0.075);
  const starsW = starSize * 1.35 * 5;
  drawHeat(ctx, x + (w - starsW) / 2, y + h * 0.68, starSize, state.heat);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` (any size) from `state` and `photos`
 * (an array of images, or null entries). `opts.preview` draws the editor's
 * selection outline and panel numbers; exports call it without opts.
 */
export function drawCover(canvas, state, photos, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = gradeById(state.grade);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#14092b';
  ctx.fillRect(0, 0, W, H);

  const slots = layoutSlots(state.layout, W, H);
  // Photos first, then the title block on top.
  for (const slot of slots) {
    if (slot.kind !== 'photo') continue;
    const cfg = state.panels[slot.panel] ?? { photo: 0, cx: 0.5, cy: 0.5, zoom: 1 };
    const photo = photos[cfg.photo] ?? null;
    drawPhotoPanel(ctx, { ...slot, cfg }, photo, grade, W, H);
  }
  for (const slot of slots) {
    if (slot.kind === 'photo') continue;
    drawTitleBlock(ctx, slot, state, grade, W, H);
  }

  if (state.grain) {
    const tile = getNoiseTile();
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const vg = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.72,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(10,4,24,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  if (opts.preview) {
    // Editor overlay: dashed outline + number on the selected panel.
    const sel = slots.find((s) => s.kind === 'photo' && s.panel === opts.selected);
    if (sel) {
      ctx.save();
      ctx.setLineDash([10, 6]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#4de8ff';
      ctx.strokeRect(sel.x + 2, sel.y + 2, sel.w - 4, sel.h - 4);
      ctx.setLineDash([]);
      ctx.fillStyle = '#4de8ff';
      ctx.font = `700 ${Math.max(12, Math.min(W, H) * 0.02)}px system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`PANEL ${sel.panel + 1}`, sel.x + 10, sel.y + 8);
      ctx.restore();
    }
  }
  return slots;
}

/** Hit-test: which photo panel (index into state.panels) sits at px, py? */
export function panelAt(layoutId, W, H, px, py) {
  const slots = layoutSlots(layoutId, W, H);
  for (const s of slots) {
    if (s.kind !== 'photo') continue;
    if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) return s.panel;
  }
  return -1;
}

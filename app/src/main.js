// Neon Coast Cover Studio — the editor. Wires the page: pick photos, choose a
// layout and a grade, letter the caption, crop each panel by dragging and
// scrolling, then export the cover as a PNG in the three post sizes. Photos
// are read with FileReader and never leave the machine. A `?shot=` query sets
// up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, panelAt, defaultState, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const SAMPLES = [
  { name: 'woman-car', src: 'samples/woman-car.jpg' },
  { name: 'friends-neon', src: 'samples/friends-neon.jpg' },
  { name: 'motorcycle', src: 'samples/motorcycle.jpg' },
  { name: 'diner', src: 'samples/diner.jpg' },
  { name: 'lifeguard', src: 'samples/lifeguard.jpg' },
  { name: 'yacht', src: 'samples/yacht.jpg' },
  { name: 'skater', src: 'samples/skater.jpg' },
  { name: 'pier', src: 'samples/pier.jpg' },
  { name: 'convertible', src: 'samples/convertible.jpg' },
  { name: 'oceandrive', src: 'samples/oceandrive.jpg' },
  { name: 'alligator', src: 'samples/alligator.jpg' },
  { name: 'dog', src: 'samples/dog.jpg' },
  { name: 'mafia', src: 'samples/mafia.jpg' },
  { name: 'bikini-drink', src: 'samples/bikini-drink.jpg' },
  { name: 'lambo', src: 'samples/lambo.jpg' },
];

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const thumbs = document.getElementById('thumbs');

let photos = []; // {name, img}
let state = defaultState();
let selected = 0;
let history = [];
let future = [];
let lastSlots = [];

function snapshot() {
  return JSON.stringify(state);
}
function pushHistory() {
  history.push(snapshot());
  if (history.length > 60) history.shift();
  future = [];
  updateUndoButtons();
}
function restore(json) {
  state = JSON.parse(json);
  syncControls();
  redraw();
}
function updateUndoButtons() {
  document.getElementById('undo').disabled = history.length === 0;
  document.getElementById('redo').disabled = future.length === 0;
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  photos = [];
  for (const s of SAMPLES) {
    try {
      photos.push({ name: s.name, img: await loadImage(s.src) });
    } catch {
      // A missing sample just means fewer panels to fill.
    }
  }
  renderThumbs();
}

function renderThumbs() {
  thumbs.innerHTML = '';
  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = `Use ${p.name} for panel ${selected + 1}`;
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    b.appendChild(img);
    b.addEventListener('click', () => {
      pushHistory();
      state.panels[selected].photo = i;
      state.panels[selected].zoom = 1.15;
      redraw();
      status.textContent = `${p.name} is now panel ${selected + 1}.`;
    });
    thumbs.appendChild(b);
  });
}

function redraw() {
  lastSlots = drawCover(canvas, state, photos.map((p) => p.img), {
    preview: !document.body.classList.contains('shot-cover'),
    selected,
  });
}

function syncControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('heat').value = String(state.heat);
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  document.getElementById('halftone').checked = state.halftone;
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.classList.toggle('on', b.dataset.layout === state.layout);
    b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout));
  });
  document.querySelectorAll('#grades button').forEach((b) => {
    b.classList.toggle('on', b.dataset.grade === state.grade);
    b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade));
  });
  renderThumbs();
}

function buildControls() {
  const layoutsEl = document.getElementById('layouts');
  for (const l of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = l.id;
    b.textContent = l.name;
    b.addEventListener('click', () => {
      if (state.layout === l.id) return;
      pushHistory();
      state.layout = l.id;
      selected = 0;
      syncControls();
      redraw();
    });
    layoutsEl.appendChild(b);
  }
  const gradesEl = document.getElementById('grades');
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = g.id;
    b.textContent = g.name;
    b.style.setProperty('--sw1', g.overlay ? g.overlay[0] : '#888888');
    b.style.setProperty('--sw2', g.overlay ? g.overlay[1] : '#222222');
    b.addEventListener('click', () => {
      if (state.grade === g.id) return;
      pushHistory();
      state.grade = g.id;
      syncControls();
      redraw();
    });
    gradesEl.appendChild(b);
  }
}

// --- photo upload ----------------------------------------------------------
document.getElementById('photo').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  pushHistory();
  for (const f of files) {
    const url = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(f);
    });
    photos.push({ name: f.name.replace(/\.[^.]+$/, ''), img: await loadImage(url) });
  }
  renderThumbs();
  redraw();
  status.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} added — click a thumbnail to put it in the selected panel.`;
  e.target.value = '';
});

document.getElementById('fillall').addEventListener('click', () => {
  if (!photos.length) return;
  pushHistory();
  const i = state.panels[selected].photo;
  state.panels.forEach((p) => { p.photo = i; });
  redraw();
  status.textContent = `Every panel now uses ${photos[i].name}.`;
});

// --- text + toggles ----------------------------------------------------------
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
document.getElementById('heat').addEventListener('change', (e) => { pushHistory(); state.heat = Number(e.target.value); redraw(); });
document.getElementById('grain').addEventListener('change', (e) => { pushHistory(); state.grain = e.target.checked; redraw(); });
document.getElementById('vignette').addEventListener('change', (e) => { pushHistory(); state.vignette = e.target.checked; redraw(); });
document.getElementById('halftone').addEventListener('change', (e) => { pushHistory(); state.halftone = e.target.checked; redraw(); });
for (const id of ['title', 'subtitle', 'badge']) {
  document.getElementById(id).addEventListener('change', () => pushHistory());
}

document.getElementById('undo').addEventListener('click', () => {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  updateUndoButtons();
});
document.getElementById('redo').addEventListener('click', () => {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  updateUndoButtons();
});

// --- per-panel crop: drag to pan, scroll to zoom ------------------------------
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (hit < 0) return;
  if (hit !== selected) {
    selected = hit;
    renderThumbs();
    redraw();
  }
  drag = { panel: hit, x: p.x, y: p.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const cfg = state.panels[drag.panel];
  const slot = lastSlots.find((s) => s.kind === 'photo' && s.panel === drag.panel);
  if (!slot) return;
  const dx = (p.x - drag.x) / slot.w;
  const dy = (p.y - drag.y) / slot.h;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
  cfg.cx = Math.min(1.4, Math.max(-0.4, cfg.cx - dx * 0.9));
  cfg.cy = Math.min(1.4, Math.max(-0.4, cfg.cy - dy * 0.9));
  drag.x = p.x;
  drag.y = p.y;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (drag?.moved) pushHistory();
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const hit = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (hit < 0) return;
  const cfg = state.panels[hit];
  cfg.zoom = Math.min(4, Math.max(1, cfg.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
  selected = hit;
  redraw();
}, { passive: false });

// --- export ------------------------------------------------------------------
function exportSize(size) {
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  drawCover(out, state, photos.map((p) => p.img));
  return new Promise((resolve) => {
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-coast-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

document.querySelectorAll('[data-export]').forEach((b) => {
  b.addEventListener('click', async () => {
    const size = SIZES.find((s) => s.id === b.dataset.export);
    await exportSize(size);
    status.textContent = `Saved neon-coast-${size.w}x${size.h}.png`;
  });
});
document.getElementById('export-all').addEventListener('click', async () => {
  for (const size of SIZES) {
    await exportSize(size);
    await new Promise((r) => setTimeout(r, 150));
  }
  status.textContent = 'Saved all three sizes: 1080x1080, 1080x1350, 1920x1080.';
});

// --- boot ----------------------------------------------------------------------
buildControls();
syncControls();
updateUndoButtons();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadSamples,
    setState(patch) {
      Object.assign(state, patch);
      syncControls();
    },
    setCanvasSize(w, h) {
      canvas.width = w;
      canvas.height = h;
    },
    draw: redraw,
  });
} else {
  (async () => {
    // Load both vendored fonts explicitly before the first paint: Pacifico is
    // only used on the canvas, so without this the first paint uses a
    // fallback script font and never repaints with the real one.
    try {
      await Promise.all([
        document.fonts.load('80px Anton'),
        document.fonts.load('40px Pacifico'),
      ]);
    } catch {
      // Fall back to system fonts; the cover still renders.
    }
    await document.fonts.ready;
    await loadSamples();
    redraw();
    document.fonts.ready.then(redraw);
  })();
}

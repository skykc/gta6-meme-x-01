// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo;
// ?shot=cover shows the cover alone at the size the query asks for (w, h).
// layout, grade, title, subtitle, badge, heat and halftone come from the query.
// panels=<panel:photo:cx:cy:zoom;...> overrides individual panel crops for the
// shot, so a screenshot can frame each photo exactly (a different photo in
// every panel, every face whole) without changing the editor's default state.
// window.__shotReady is set once the fonts are loaded and the cover is painted.
import { defaultState } from './cover.js';

export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  const patch = {
    layout: query.get('layout') ?? 'grid9',
    grade: query.get('grade') ?? 'sunset',
    title: query.get('title') ?? 'NEON COAST',
    subtitle: query.get('subtitle') ?? 'chase the sunset',
  };
  if (query.get('badge')) patch.badge = query.get('badge');
  if (query.get('heat')) patch.heat = Number(query.get('heat'));
  if (query.get('halftone')) patch.halftone = query.get('halftone') === '1';
  if (query.get('grain')) patch.grain = query.get('grain') === '1';
  if (query.get('vignette')) patch.vignette = query.get('vignette') === '1';
  if (query.get('panels')) {
    const panels = defaultState().panels.map((p) => ({ ...p }));
    for (const part of query.get('panels').split(';')) {
      const [panel, photo, cx, cy, zoom] = part.split(':').map(Number);
      if (Number.isInteger(panel) && panels[panel] && Number.isInteger(photo)) {
        panels[panel] = { photo, cx, cy, zoom };
      }
    }
    patch.panels = panels;
  }
  await api.loadSamples();
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('80px Anton'),
        document.fonts.load('40px Pacifico'),
      ]),
      new Promise((r) => setTimeout(r, 5000)),
    ]);
  } catch {
    // Fall back to system fonts; the shot still renders.
  }
  api.setState(patch);
  if (shot === 'cover') {
    const w = Number(query.get('w') ?? 1080);
    const h = Number(query.get('h') ?? 1080);
    api.setCanvasSize(w, h);
  }
  api.draw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

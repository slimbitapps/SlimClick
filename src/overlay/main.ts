/**
 * Durchsichtige Ebene über der Präsentation: roter Laserpunkt oder Spotlight.
 * Klicks gehen durch sie hindurch; sie nimmt nie den Fokus.
 */
type State = { x: number; y: number; visible: boolean; mode: 'laser' | 'spot'; color?: string; size?: 's' | 'm' | 'l' };

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
let W = 0;
let H = 0;
function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

let target: State = { x: 0.5, y: 0.5, visible: false, mode: 'laser' };
let pos = { x: 0.5, y: 0.5 };
let alpha = 0;
let trail: { x: number; y: number; t: number }[] = [];

window.api.on('overlay:state', (s: State) => {
  if (s.visible && !target.visible) pos = { x: s.x, y: s.y }; // neu ansetzen statt durchs Bild zu fliegen
  target = s;
});

const SIZES = { s: 9, m: 13, l: 19 };

function frame(now: number) {
  // Weiches Nachziehen: glättet Zittern vom Finger und Netzwerk-Ruckler
  pos.x += (target.x - pos.x) * 0.45;
  pos.y += (target.y - pos.y) * 0.45;
  alpha += ((target.visible ? 1 : 0) - alpha) * 0.25;
  const px = pos.x * W;
  const py = pos.y * H;
  ctx.clearRect(0, 0, W, H);

  if (alpha > 0.01) {
    const color = target.color || '#ff3b30';
    if (target.mode === 'spot') {
      const r = Math.min(W, H) * 0.16;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(px, py, r, 0, Math.PI * 2, true);
      ctx.fill('evenodd');
      const g = ctx.createRadialGradient(px, py, r * 0.85, px, py, r * 1.08);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r * 1.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      trail.push({ x: px, y: py, t: now });
      trail = trail.filter((p) => now - p.t < 220);
      const rad = SIZES[target.size || 'm'];
      // Leuchtspur
      for (const p of trail) {
        const k = 1 - (now - p.t) / 220;
        ctx.globalAlpha = alpha * k * 0.35;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 0.7 * k, 0, Math.PI * 2);
        ctx.fill();
      }
      // Leuchten
      ctx.globalAlpha = alpha;
      const glow = ctx.createRadialGradient(px, py, 0, px, py, rad * 3.2);
      glow.addColorStop(0, hexA(color, 0.55));
      glow.addColorStop(1, hexA(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, rad * 3.2, 0, Math.PI * 2);
      ctx.fill();
      // Punkt mit hellem Kern
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(px, py, rad * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else {
    trail = [];
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

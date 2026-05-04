import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import path from "node:path";
import fs from "node:fs";

const WIDTH = 800;
const HEIGHT = 360;

const FONT_FAMILY = "TimerSans";
let fontRegistered = false;

function ensureFontRegistered(): void {
  if (fontRegistered) return;
  const candidates = [
    path.join(process.cwd(), "fonts", "DejaVuSans-Bold.ttf"),
    path.join(process.cwd(), "dist", "fonts", "DejaVuSans-Bold.ttf"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        GlobalFonts.registerFromPath(p, FONT_FAMILY);
        fontRegistered = true;
        return;
      }
    } catch {
      /* try next */
    }
  }
  fontRegistered = true;
}

function formatTime(totalSeconds: number): string {
  const raw = Math.max(0, Math.floor(totalSeconds));
  const safe = Math.floor(raw / 30) * 30;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mm = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export type TimerStyle = "random" | "hellokitty" | "kuromie";

export interface ColorPair {
  accent: string;
  accentSoft: string;
}

export const RANDOM_PALETTE: ColorPair[] = [
  { accent: "#ff2bd6", accentSoft: "#a21caf" },
  { accent: "#22d3ee", accentSoft: "#06b6d4" },
  { accent: "#a3ff12", accentSoft: "#65a30d" },
  { accent: "#ffeb3b", accentSoft: "#ca8a04" },
  { accent: "#ff6b35", accentSoft: "#c2410c" },
  { accent: "#b14eff", accentSoft: "#7e22ce" },
  { accent: "#ff3366", accentSoft: "#be123c" },
  { accent: "#4ad9ff", accentSoft: "#0284c7" },
];

export interface TimerImageOptions {
  remainingSeconds: number;
  phase: "study" | "break";
  style: TimerStyle;
  paletteIndex?: number;
}

export function renderTimerImage(opts: TimerImageOptions): Buffer {
  ensureFontRegistered();

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  if (opts.style === "hellokitty") {
    renderHelloKitty(ctx, opts);
  } else if (opts.style === "kuromie") {
    renderKuromi(ctx, opts);
  } else {
    renderNeon(ctx, opts);
  }

  return canvas.toBuffer("image/png");
}

// ---------------- NEON / RANDOM STYLE ----------------

function renderNeon(ctx: SKRSContext2D, opts: TimerImageOptions): void {
  const isBreak = opts.phase === "break";
  let accent: string;
  let accentSoft: string;
  if (isBreak) {
    accent = "#22d3ee";
    accentSoft = "#06b6d4";
  } else {
    const idx = (opts.paletteIndex ?? 0) % RANDOM_PALETTE.length;
    accent = RANDOM_PALETTE[idx]!.accent;
    accentSoft = RANDOM_PALETTE[idx]!.accentSoft;
  }

  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, "#08020c");
  bg.addColorStop(1, "#1a0a1f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = accentSoft;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) {
    ctx.save();
    ctx.rotate((Math.PI / 14) * i);
    ctx.beginPath();
    ctx.ellipse(0, 0, 320, 110, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.18;
  const glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 420);
  glow.addColorStop(0, accent);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  ctx.font = `bold 30px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TIMER", cx, 60);
  ctx.restore();

  const timeText = formatTime(opts.remainingSeconds);
  ctx.save();
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 35;
  ctx.font = `bold 140px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(timeText, cx, cy + 10);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.18;
  ctx.fillText(timeText, cx, cy + 10);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#f5d0fe";
  ctx.globalAlpha = 0.85;
  ctx.font = `bold 22px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isBreak ? "BREAK TIME" : "FOCUS TIME", cx, HEIGHT - 36);
  ctx.restore();
}

// ---------------- HELLO KITTY STYLE ----------------

function renderHelloKitty(ctx: SKRSContext2D, opts: TimerImageOptions): void {
  const isBreak = opts.phase === "break";

  // background: soft pink stripes
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, "#ffe0f0");
  bg.addColorStop(0.5, "#fff0f8");
  bg.addColorStop(1, "#ffd6ec");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // subtle polka dots
  drawPolkaDots(ctx);

  // Scattered hearts
  drawHearts(ctx);

  // Bows in the corners
  drawBow(ctx, 60, 60, 52);
  drawBow(ctx, WIDTH - 60, 60, 52);
  drawBow(ctx, 60, HEIGHT - 60, 38);
  drawBow(ctx, WIDTH - 60, HEIGHT - 60, 38);

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  // Kitty faces on sides
  drawKittyFace(ctx, 108, cy + 20, 72);
  drawKittyFace(ctx, WIDTH - 108, cy + 20, 72);

  // Decorative top border
  ctx.save();
  ctx.fillStyle = "#ff5da8";
  ctx.fillRect(0, 0, WIDTH, 8);
  ctx.fillRect(0, HEIGHT - 8, WIDTH, 8);
  ctx.restore();

  // Header
  ctx.save();
  ctx.fillStyle = "#c2185b";
  ctx.shadowColor = "#ff85b3";
  ctx.shadowBlur = 8;
  ctx.font = `bold 26px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("♡ HELLO KITTY TIMER ♡", cx, 42);
  ctx.restore();

  // Star sparkles near header
  drawSparkles(ctx, cx, 42);

  // Time text with soft drop shadow
  const timeText = formatTime(opts.remainingSeconds);
  ctx.save();
  // shadow
  ctx.fillStyle = "#ffb3d1";
  ctx.font = `bold 128px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(timeText, cx + 4, cy + 14);
  // main color
  ctx.fillStyle = "#e91e63";
  ctx.fillText(timeText, cx, cy + 10);
  // highlight
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.3;
  ctx.fillText(timeText, cx - 2, cy + 6);
  ctx.restore();

  // Phase label with bow decoration
  ctx.save();
  ctx.fillStyle = "#880e4f";
  ctx.font = `bold 22px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    isBreak ? "♡ BREAK TIME ♡" : "♡ FOCUS TIME ♡",
    cx,
    HEIGHT - 30,
  );
  ctx.restore();
}

function drawPolkaDots(ctx: SKRSContext2D): void {
  const dots = [
    { x: 30, y: 30, r: 6 }, { x: 200, y: 15, r: 5 }, { x: 400, y: 20, r: 7 },
    { x: 600, y: 10, r: 5 }, { x: 760, y: 35, r: 6 }, { x: 25, y: 180, r: 5 },
    { x: 775, y: 200, r: 6 }, { x: 20, y: 330, r: 7 }, { x: 790, y: 320, r: 5 },
    { x: 350, y: 340, r: 5 }, { x: 500, y: 345, r: 6 }, { x: 150, y: 350, r: 5 },
  ];
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#ff5da8";
  for (const d of dots) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSparkles(ctx: SKRSContext2D, cx: number, cy: number): void {
  const positions = [cx - 230, cx + 230];
  ctx.save();
  ctx.fillStyle = "#ff5da8";
  ctx.font = "16px sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  for (const x of positions) {
    ctx.fillText("✦", x, cy);
  }
  ctx.restore();
}

function drawHearts(ctx: SKRSContext2D): void {
  const hearts = [
    { x: 50, y: 190, s: 14, a: 0.4 },
    { x: 155, y: 265, s: 18, a: 0.35 },
    { x: 230, y: 120, s: 12, a: 0.4 },
    { x: 370, y: 85, s: 16, a: 0.3 },
    { x: 555, y: 265, s: 20, a: 0.35 },
    { x: 645, y: 145, s: 14, a: 0.4 },
    { x: 725, y: 235, s: 12, a: 0.4 },
    { x: 475, y: 300, s: 16, a: 0.3 },
    { x: 310, y: 310, s: 10, a: 0.35 },
  ];
  for (const h of hearts) {
    ctx.save();
    ctx.globalAlpha = h.a;
    ctx.fillStyle = "#ff5da8";
    drawHeart(ctx, h.x, h.y, h.s);
    ctx.restore();
  }
}

function drawHeart(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.beginPath();
  const k = size;
  ctx.moveTo(x, y + k * 0.3);
  ctx.bezierCurveTo(x, y, x - k, y, x - k, y + k * 0.5);
  ctx.bezierCurveTo(x - k, y + k * 0.9, x, y + k * 1.1, x, y + k * 1.4);
  ctx.bezierCurveTo(x, y + k * 1.1, x + k, y + k * 0.9, x + k, y + k * 0.5);
  ctx.bezierCurveTo(x + k, y, x, y, x, y + k * 0.3);
  ctx.fill();
}

function drawBow(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#ff5da8";
  ctx.beginPath();
  ctx.ellipse(-size * 0.45, 0, size * 0.45, size * 0.32, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.45, 0, size * 0.45, size * 0.32, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e83e8c";
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.16, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawKittyFace(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);

  // ears
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-size * 0.6, -size * 0.3);
  ctx.lineTo(-size * 0.85, -size * 0.95);
  ctx.lineTo(-size * 0.25, -size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.6, -size * 0.3);
  ctx.lineTo(size * 0.85, -size * 0.95);
  ctx.lineTo(size * 0.25, -size * 0.55);
  ctx.closePath();
  ctx.fill();

  // inner ear pink
  ctx.fillStyle = "#ffb3d1";
  ctx.beginPath();
  ctx.moveTo(-size * 0.55, -size * 0.38);
  ctx.lineTo(-size * 0.75, -size * 0.82);
  ctx.lineTo(-size * 0.32, -size * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.55, -size * 0.38);
  ctx.lineTo(size * 0.75, -size * 0.82);
  ctx.lineTo(size * 0.32, -size * 0.58);
  ctx.closePath();
  ctx.fill();

  // head
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffb3d1";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.95, size * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // bow on left ear area
  drawBow(ctx, -size * 0.55, -size * 0.58, size * 0.52);

  // eyes (oval)
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.ellipse(-size * 0.3, size * 0.04, size * 0.08, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.3, size * 0.04, size * 0.08, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  // eye shine
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-size * 0.27, size * 0.0, size * 0.025, size * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.33, size * 0.0, size * 0.025, size * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();

  // nose
  ctx.fillStyle = "#f5a623";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.26, size * 0.09, size * 0.065, 0, 0, Math.PI * 2);
  ctx.fill();

  // whiskers
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 1.2;
  for (const dir of [-1, 1]) {
    for (const yo of [-0.03, 0.12, 0.27]) {
      ctx.beginPath();
      ctx.moveTo(dir * size * 0.42, size * (0.1 + yo));
      ctx.lineTo(dir * size * 0.95, size * (0.05 + yo));
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ---------------- KUROMI STYLE ----------------

function renderKuromi(ctx: SKRSContext2D, opts: TimerImageOptions): void {
  const isBreak = opts.phase === "break";
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  // background: soft lavender like the Kuromi Sanrio aesthetic
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, "#dcc6f0");
  bg.addColorStop(0.5, "#e8d5f5");
  bg.addColorStop(1, "#cdb4e8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // subtle soft pattern - tiny dots
  drawLavenderDots(ctx);

  // sparkle stars scattered
  drawKuromiSparkles(ctx);

  // decorative border with rounded feel
  ctx.save();
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(10, 10, WIDTH - 20, HEIGHT - 20);
  ctx.restore();

  // corner mini skulls (pink, matching the image)
  drawPinkSkull(ctx, 40, 40, 22);
  drawPinkSkull(ctx, WIDTH - 40, 40, 22);
  drawPinkSkull(ctx, 40, HEIGHT - 40, 18);
  drawPinkSkull(ctx, WIDTH - 40, HEIGHT - 40, 18);

  // Kuromi full character on sides
  drawKuromiFull(ctx, 100, cy + 10, 78);
  drawKuromiFull(ctx, WIDTH - 100, cy + 10, 78);

  // decorative top/bottom bar
  ctx.save();
  ctx.fillStyle = "#9333ea";
  ctx.globalAlpha = 0.4;
  ctx.fillRect(0, 0, WIDTH, 7);
  ctx.fillRect(0, HEIGHT - 7, WIDTH, 7);
  ctx.restore();

  // Header - cute dark purple text
  ctx.save();
  ctx.fillStyle = "#4a1272";
  ctx.font = `bold 26px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦ Kuromi Timer ✦", cx, 42);
  ctx.restore();

  // Time text - dark purple on lavender
  const timeText = formatTime(opts.remainingSeconds);
  ctx.save();
  // soft drop shadow
  ctx.fillStyle = "#b890d8";
  ctx.font = `bold 128px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(timeText, cx + 4, cy + 14);
  // main color: deep purple
  ctx.fillStyle = "#3b0764";
  ctx.fillText(timeText, cx, cy + 10);
  // slight highlight
  ctx.fillStyle = "#7c3aed";
  ctx.globalAlpha = 0.25;
  ctx.fillText(timeText, cx - 2, cy + 6);
  ctx.restore();

  // Phase label
  ctx.save();
  ctx.fillStyle = "#5b2188";
  ctx.font = `bold 22px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    isBreak ? "✦ BREAK TIME ✦" : "✦ FOCUS TIME ✦",
    cx,
    HEIGHT - 30,
  );
  ctx.restore();
}

function drawLavenderDots(ctx: SKRSContext2D): void {
  const dots = [
    { x: 25, y: 25 }, { x: 180, y: 18 }, { x: 400, y: 22 },
    { x: 620, y: 15 }, { x: 775, y: 30 }, { x: 20, y: 180 },
    { x: 778, y: 195 }, { x: 22, y: 325 }, { x: 780, y: 318 },
    { x: 340, y: 342 }, { x: 510, y: 348 }, { x: 155, y: 348 }, { x: 660, y: 340 },
  ];
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#7c3aed";
  for (const d of dots) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawKuromiSparkles(ctx: SKRSContext2D): void {
  const sparkles = [
    { x: 210, y: 80, s: 11, a: 0.8 },
    { x: 590, y: 75, s: 13, a: 0.9 },
    { x: 260, y: 295, s: 9, a: 0.7 },
    { x: 540, y: 288, s: 10, a: 0.8 },
    { x: 170, y: 165, s: 7, a: 0.6 },
    { x: 635, y: 200, s: 8, a: 0.65 },
    { x: 390, y: 310, s: 7, a: 0.6 },
  ];
  ctx.save();
  for (const sp of sparkles) {
    ctx.globalAlpha = sp.a;
    ctx.fillStyle = "#ffffff";
    drawSparkle4(ctx, sp.x, sp.y, sp.s);
  }
  ctx.restore();
}

function drawSparkle4(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i;
    const ox = x + Math.cos(angle) * size;
    const oy = y + Math.sin(angle) * size;
    const ia = angle + Math.PI / 4;
    const ix = x + Math.cos(ia) * size * 0.35;
    const iy = y + Math.sin(ia) * size * 0.35;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
}

function drawPinkSkull(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.75;

  // skull head - hot pink like Kuromi's skull accessory
  ctx.fillStyle = "#ff5da8";
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.08, size * 0.52, size * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  // jaw
  ctx.beginPath();
  ctx.ellipse(0, size * 0.28, size * 0.34, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-size * 0.18, -size * 0.1, size * 0.12, size * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.18, -size * 0.1, size * 0.12, size * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  // nose
  ctx.fillStyle = "#e0408a";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.1, size * 0.06, size * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  // teeth gap
  ctx.fillStyle = "#e0408a";
  ctx.beginPath();
  ctx.rect(-size * 0.08, size * 0.2, size * 0.16, size * 0.14);
  ctx.fill();

  ctx.restore();
}

function drawKuromiFull(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);

  // maid dress body (black with white frills)
  // skirt
  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.moveTo(-size * 0.6, size * 0.55);
  ctx.lineTo(-size * 0.75, size * 1.35);
  ctx.lineTo(size * 0.75, size * 1.35);
  ctx.lineTo(size * 0.6, size * 0.55);
  ctx.closePath();
  ctx.fill();
  // white frilly bottom of skirt
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-size * 0.75, size * 1.35);
  ctx.bezierCurveTo(-size * 0.6, size * 1.2, -size * 0.3, size * 1.45, 0, size * 1.3);
  ctx.bezierCurveTo(size * 0.3, size * 1.45, size * 0.6, size * 1.2, size * 0.75, size * 1.35);
  ctx.lineTo(size * 0.75, size * 1.42);
  ctx.bezierCurveTo(size * 0.6, size * 1.28, size * 0.3, size * 1.52, 0, size * 1.37);
  ctx.bezierCurveTo(-size * 0.3, size * 1.52, -size * 0.6, size * 1.28, -size * 0.75, size * 1.42);
  ctx.closePath();
  ctx.fill();

  // torso/apron
  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.42, size * 0.48, size * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  // white apron
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.44, size * 0.22, size * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  // apron bow
  drawKuromiBow(ctx, 0, size * 0.18, size * 0.28);

  // arms
  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.ellipse(-size * 0.58, size * 0.55, size * 0.12, size * 0.32, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.58, size * 0.55, size * 0.12, size * 0.32, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // white cuffs
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-size * 0.64, size * 0.82, size * 0.12, size * 0.09, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.64, size * 0.82, size * 0.12, size * 0.09, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // legs / feet
  ctx.fillStyle = "#333333";
  ctx.beginPath();
  ctx.ellipse(-size * 0.28, size * 1.5, size * 0.14, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.28, size * 1.5, size * 0.14, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // BLACK HOOD
  ctx.fillStyle = "#0d0010";
  ctx.strokeStyle = "#3b1060";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-size * 0.88, size * 0.08);
  ctx.bezierCurveTo(-size * 0.95, -size * 0.55, -size * 0.28, -size * 1.3, 0, -size * 1.38);
  ctx.bezierCurveTo(size * 0.28, -size * 1.3, size * 0.95, -size * 0.55, size * 0.88, size * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // pink skull on hood
  ctx.save();
  ctx.translate(0, -size * 0.72);
  drawPinkSkull(ctx, 0, 0, size * 0.3);
  ctx.restore();

  // white maid headband on hood
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(-size * 0.72, -size * 0.12);
  ctx.bezierCurveTo(-size * 0.62, -size * 0.25, size * 0.62, -size * 0.25, size * 0.72, -size * 0.12);
  ctx.lineWidth = size * 0.1;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.globalAlpha = 1;

  // WHITE FACE
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ddb8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.08, size * 0.62, size * 0.56, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // big cute eyes
  ctx.fillStyle = "#1a0028";
  ctx.beginPath();
  ctx.ellipse(-size * 0.22, size * 0.06, size * 0.1, size * 0.155, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.22, size * 0.06, size * 0.1, size * 0.155, 0.08, 0, Math.PI * 2);
  ctx.fill();
  // eye shine
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-size * 0.18, size * 0.02, size * 0.03, size * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.26, size * 0.02, size * 0.03, size * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();

  // rosy cheeks (soft purple/pink)
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#d946a8";
  ctx.beginPath();
  ctx.ellipse(-size * 0.38, size * 0.2, size * 0.13, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.38, size * 0.2, size * 0.13, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // small smile
  ctx.strokeStyle = "#1a0028";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, size * 0.24, size * 0.13, 0.25, Math.PI - 0.25);
  ctx.stroke();

  // purple bow on left of hood (Kuromi's signature bow)
  drawKuromiBow(ctx, -size * 0.58, -size * 0.1, size * 0.44);

  ctx.restore();
}

function drawKuromiBow(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#7c3aed";
  ctx.strokeStyle = "#9333ea";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(-size * 0.42, 0, size * 0.42, size * 0.27, -0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(size * 0.42, 0, size * 0.42, size * 0.27, 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#9333ea";
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.13, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}


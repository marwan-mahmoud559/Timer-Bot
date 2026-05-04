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

export type TimerStyle = "random" | "hellokitty" | "kuromi";

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
  } else if (opts.style === "kuromi") {
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

  // background: dark purple/black gradient
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, "#0d0010");
  bg.addColorStop(0.5, "#1a0028");
  bg.addColorStop(1, "#0a000f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // subtle star field background
  drawStarField(ctx);

  // purple glow in center
  ctx.save();
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  ctx.globalAlpha = 0.2;
  const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 380);
  glow.addColorStop(0, "#9b30ff");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();

  // decorative border
  ctx.save();
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 10;
  ctx.strokeRect(8, 8, WIDTH - 16, HEIGHT - 16);
  ctx.restore();

  // corner skulls
  drawSkull(ctx, 42, 42, 28);
  drawSkull(ctx, WIDTH - 42, 42, 28);
  drawSkull(ctx, 42, HEIGHT - 42, 22);
  drawSkull(ctx, WIDTH - 42, HEIGHT - 42, 22);

  // Kuromi face on sides
  drawKuromiFace(ctx, 108, cy + 15, 70);
  drawKuromiFace(ctx, WIDTH - 108, cy + 15, 70);

  // floating stars/sparkles
  drawKuromiStars(ctx);

  // decorative top/bottom bars
  ctx.save();
  ctx.fillStyle = "#7c3aed";
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 8;
  ctx.fillRect(0, 0, WIDTH, 6);
  ctx.fillRect(0, HEIGHT - 6, WIDTH, 6);
  ctx.restore();

  // Header
  ctx.save();
  ctx.fillStyle = "#d8b4fe";
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 14;
  ctx.font = `bold 26px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("☆ KUROMI TIMER ☆", cx, 42);
  ctx.restore();

  // Time text
  const timeText = formatTime(opts.remainingSeconds);
  ctx.save();
  // dark shadow
  ctx.fillStyle = "#3b0764";
  ctx.font = `bold 128px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(timeText, cx + 4, cy + 14);
  // main purple/white gradient text
  const textGrad = ctx.createLinearGradient(0, cy - 65, 0, cy + 65);
  textGrad.addColorStop(0, "#f0abfc");
  textGrad.addColorStop(0.4, "#ffffff");
  textGrad.addColorStop(0.6, "#c084fc");
  textGrad.addColorStop(1, "#7e22ce");
  ctx.fillStyle = textGrad;
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 22;
  ctx.fillText(timeText, cx, cy + 10);
  // outline
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#3b0764";
  ctx.lineWidth = 2;
  ctx.strokeText(timeText, cx, cy + 10);
  ctx.restore();

  // Phase label
  ctx.save();
  ctx.fillStyle = "#e9d5ff";
  ctx.font = `bold 22px "${FONT_FAMILY}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    isBreak ? "☆ BREAK TIME ☆" : "☆ FOCUS TIME ☆",
    cx,
    HEIGHT - 30,
  );
  ctx.restore();
}

function drawStarField(ctx: SKRSContext2D): void {
  const stars = [
    { x: 30, y: 50, r: 1.2 }, { x: 120, y: 20, r: 1.5 }, { x: 200, y: 80, r: 1 },
    { x: 320, y: 30, r: 1.3 }, { x: 450, y: 15, r: 1 }, { x: 600, y: 55, r: 1.5 },
    { x: 700, y: 25, r: 1.2 }, { x: 780, y: 70, r: 1 }, { x: 760, y: 290, r: 1.3 },
    { x: 680, y: 320, r: 1 }, { x: 50, y: 280, r: 1.2 }, { x: 140, y: 320, r: 1 },
    { x: 250, y: 300, r: 1.5 }, { x: 550, y: 310, r: 1.2 }, { x: 420, y: 330, r: 1 },
  ];
  ctx.save();
  ctx.fillStyle = "#d8b4fe";
  for (const s of stars) {
    ctx.globalAlpha = 0.4 + Math.random() * 0.3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawKuromiStars(ctx: SKRSContext2D): void {
  const positions = [
    { x: 230, y: 130, s: 10 }, { x: 570, y: 100, s: 12 },
    { x: 300, y: 290, s: 9 }, { x: 510, y: 270, s: 11 },
  ];
  ctx.save();
  ctx.fillStyle = "#c084fc";
  ctx.globalAlpha = 0.6;
  for (const p of positions) {
    drawStar4(ctx, p.x, p.y, p.s);
  }
  ctx.restore();
}

function drawStar4(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i;
    const outerX = x + Math.cos(angle) * size;
    const outerY = y + Math.sin(angle) * size;
    const innerAngle = angle + Math.PI / 4;
    const innerX = x + Math.cos(innerAngle) * size * 0.38;
    const innerY = y + Math.sin(innerAngle) * size * 0.38;
    if (i === 0) ctx.moveTo(outerX, outerY);
    else ctx.lineTo(outerX, outerY);
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fill();
}

function drawSkull(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.65;

  // skull head
  ctx.fillStyle = "#e9d5ff";
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.1, size * 0.55, size * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  // jaw
  ctx.beginPath();
  ctx.ellipse(0, size * 0.3, size * 0.38, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // eyes (dark holes)
  ctx.fillStyle = "#0d0010";
  ctx.beginPath();
  ctx.ellipse(-size * 0.2, -size * 0.1, size * 0.13, size * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.2, -size * 0.1, size * 0.13, size * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // nose hole
  ctx.beginPath();
  ctx.ellipse(0, size * 0.12, size * 0.07, size * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  // teeth
  ctx.fillStyle = "#0d0010";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.rect(i * size * 0.22 - size * 0.08, size * 0.22, size * 0.14, size * 0.16);
    ctx.fill();
  }

  ctx.restore();
}

function drawKuromiFace(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);

  // black hood/hat
  ctx.fillStyle = "#0d0010";
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 2;

  // hood shape (large rounded triangle on top)
  ctx.beginPath();
  ctx.moveTo(-size * 0.95, size * 0.05);
  ctx.bezierCurveTo(-size * 1.0, -size * 0.5, -size * 0.3, -size * 1.3, 0, -size * 1.4);
  ctx.bezierCurveTo(size * 0.3, -size * 1.3, size * 1.0, -size * 0.5, size * 0.95, size * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // skull on hood
  ctx.save();
  ctx.translate(0, -size * 0.8);
  drawSkull(ctx, 0, 0, size * 0.28);
  ctx.restore();

  // white face
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#d8b4fe";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.1, size * 0.75, size * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // purple bow on left side of hood
  drawKuromiBow(ctx, -size * 0.62, -size * 0.05, size * 0.48);

  // big oval eyes (cute but slightly evil)
  ctx.fillStyle = "#1a0028";
  ctx.beginPath();
  ctx.ellipse(-size * 0.28, size * 0.08, size * 0.12, size * 0.17, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.28, size * 0.08, size * 0.12, size * 0.17, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // eye shine
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-size * 0.24, size * 0.03, size * 0.035, size * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.32, size * 0.03, size * 0.035, size * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // small rosy cheeks
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#c084fc";
  ctx.beginPath();
  ctx.ellipse(-size * 0.44, size * 0.22, size * 0.14, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.44, size * 0.22, size * 0.14, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // small smile
  ctx.strokeStyle = "#1a0028";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, size * 0.28, size * 0.15, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.restore();
}

function drawKuromiBow(ctx: SKRSContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  // left loop
  ctx.fillStyle = "#7c3aed";
  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-size * 0.42, 0, size * 0.42, size * 0.28, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // right loop
  ctx.beginPath();
  ctx.ellipse(size * 0.42, 0, size * 0.42, size * 0.28, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // center knot
  ctx.fillStyle = "#a855f7";
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.14, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}


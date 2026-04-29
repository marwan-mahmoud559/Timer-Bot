import { createCanvas, GlobalFonts } from "@napi-rs/canvas";

const WIDTH = 800;
const HEIGHT = 360;

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mm = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export interface TimerImageOptions {
  remainingSeconds: number;
  phase: "study" | "break";
}

export function renderTimerImage(opts: TimerImageOptions): Buffer {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  const isBreak = opts.phase === "break";
  const accent = isBreak ? "#22d3ee" : "#ff2bd6";
  const accentSoft = isBreak ? "#06b6d4" : "#a21caf";

  // background gradient
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, "#08020c");
  bg.addColorStop(1, "#1a0a1f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // decorative spirograph-like ellipses
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

  // soft outer glow
  ctx.save();
  ctx.globalAlpha = 0.18;
  const glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 420);
  glow.addColorStop(0, accent);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();

  // small "TIMER" label
  ctx.save();
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  ctx.font = "bold 30px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TIMER", cx, 60);
  ctx.restore();

  // main time text
  const timeText = formatTime(opts.remainingSeconds);
  ctx.save();
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 35;
  ctx.font = "bold 140px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(timeText, cx, cy + 10);
  // re-stroke for crisper edges over glow
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.18;
  ctx.fillText(timeText, cx, cy + 10);
  ctx.restore();

  // phase label at bottom
  ctx.save();
  ctx.fillStyle = "#f5d0fe";
  ctx.globalAlpha = 0.85;
  ctx.font = "600 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isBreak ? "BREAK TIME" : "FOCUS TIME", cx, HEIGHT - 36);
  ctx.restore();

  return canvas.toBuffer("image/png");
}

// Touch GlobalFonts to keep import (no-op; fallback to system sans-serif)
void GlobalFonts;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EvasionEngine, PhysicsSample } from '../simulation/EvasionEngine';

interface PhysicsChartsPanelProps {
  engine: EvasionEngine;
}

type WindowSize = 150 | 300 | 600;

const CANVAS_W = 554;
const CANVAS_H = 392;
const PAD_L = 46;
const PAD_R = 44;
const PLOT_X = PAD_L;
const PLOT_W = CANVAS_W - PAD_L - PAD_R;

const BAND_H = 82;
const BANDS = [
  { y: 8, h: BAND_H, title: 'SPEED |v|', unit: '% / px·step⁻¹' },
  { y: 100, h: BAND_H, title: 'VELOCITY vx / vy', unit: '±100% / ±px' },
  { y: 192, h: BAND_H, title: 'HEADING θ', unit: 'deg / dir' },
  { y: 284, h: BAND_H, title: 'ACCEL / BRAKE Δ|v|', unit: '+accel / -brake' },
] as const;

function getCardinalDir(deg: number): string {
  const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  const norm = ((deg % 360) + 360) % 360;
  return dirs[Math.round(norm / 45) % 8];
}

function getMotionState(sample: PhysicsSample | null): {
  label: 'ACCEL' | 'BRAKE' | 'CRUISE' | 'IDLE';
  textClass: string;
} {
  if (!sample) return { label: 'IDLE', textClass: 'text-[#888]' };
  if (sample.speedPct < 2) return { label: 'IDLE', textClass: 'text-[#94a3b8]' };
  if (sample.accelPct > 1.5) return { label: 'ACCEL', textClass: 'text-[#34d399]' };
  if (sample.accelPct < -1.5) return { label: 'BRAKE', textClass: 'text-[#fb7185]' };
  return { label: 'CRUISE', textClass: 'text-[#22d3ee]' };
}

function drawBandFrame(
  ctx: CanvasRenderingContext2D,
  y: number,
  h: number,
  title: string,
  leftTop: string,
  leftMid: string,
  leftBot: string,
  rightTop: string,
  rightMid: string,
  rightBot: string,
  midDash = true
): void {
  ctx.fillStyle = '#07090d';
  ctx.fillRect(PLOT_X, y, PLOT_W, h);

  ctx.strokeStyle = '#1f242d';
  ctx.lineWidth = 1;
  ctx.strokeRect(PLOT_X + 0.5, y + 0.5, PLOT_W - 1, h - 1);

  const midY = Math.round(y + h * 0.5) + 0.5;
  ctx.save();
  ctx.strokeStyle = midDash ? '#262d38' : '#1b2029';
  if (midDash) ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(PLOT_X, midY);
  ctx.lineTo(PLOT_X + PLOT_W, midY);
  ctx.stroke();
  ctx.restore();

  // Quarter guide lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.beginPath();
  ctx.moveTo(PLOT_X, Math.round(y + h * 0.25) + 0.5);
  ctx.lineTo(PLOT_X + PLOT_W, Math.round(y + h * 0.25) + 0.5);
  ctx.moveTo(PLOT_X, Math.round(y + h * 0.75) + 0.5);
  ctx.lineTo(PLOT_X + PLOT_W, Math.round(y + h * 0.75) + 0.5);
  ctx.stroke();

  // Left axis labels (%)
  ctx.font = '9px monospace';
  ctx.fillStyle = '#7b8594';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(leftTop, PLOT_X - 5, y + 2);
  ctx.textBaseline = 'middle';
  ctx.fillText(leftMid, PLOT_X - 5, y + h * 0.5);
  ctx.textBaseline = 'bottom';
  ctx.fillText(leftBot, PLOT_X - 5, y + h - 1);

  // Right axis labels (px/step or cardinal)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(rightTop, PLOT_X + PLOT_W + 5, y + 2);
  ctx.textBaseline = 'middle';
  ctx.fillText(rightMid, PLOT_X + PLOT_W + 5, y + h * 0.5);
  ctx.textBaseline = 'bottom';
  ctx.fillText(rightBot, PLOT_X + PLOT_W + 5, y + h - 1);

  // Band title inside top-left
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#9aa5b5';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(title, PLOT_X + 6, y + 4);
}

function drawPhysicsCanvas(
  ctx: CanvasRenderingContext2D,
  samples: PhysicsSample[],
  windowSize: WindowSize,
  playerSpeed: number,
  hoverIdx: number | null
): void {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const count = samples.length;
  const xForIndex = (i: number): number => {
    const virtualIdx = windowSize - count + i;
    return PLOT_X + (virtualIdx / Math.max(1, windowSize - 1)) * PLOT_W;
  };

  // Vertical time gridlines (4 divisions)
  const drawVerticalGrid = (y: number, h: number) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      const gx = Math.round(PLOT_X + (PLOT_W * k) / 4) + 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
  };

  // Compute adaptive symmetric accel scale (25%, 50%, or 100%)
  let maxAbsAccelPct = 0;
  for (let i = 0; i < count; i++) {
    const a = Math.abs(samples[i].accelPct);
    if (a > maxAbsAccelPct) maxAbsAccelPct = a;
  }
  const accelScalePct = maxAbsAccelPct <= 22 ? 25 : maxAbsAccelPct <= 46 ? 50 : 100;
  const accelScalePx = (accelScalePct / 100) * playerSpeed;

  // 1. SPEED BAND
  const b0 = BANDS[0];
  drawBandFrame(
    ctx,
    b0.y,
    b0.h,
    b0.title,
    '100%',
    '50%',
    '0%',
    playerSpeed.toFixed(2),
    (playerSpeed * 0.5).toFixed(2),
    '0.00'
  );
  drawVerticalGrid(b0.y, b0.h);

  const speedPadT = 14;
  const speedPadB = 4;
  const speedInnerH = b0.h - speedPadT - speedPadB;
  const speedBaseY = b0.y + b0.h - speedPadB;
  const yForSpeed = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    return speedBaseY - (clamped / 100) * speedInnerH;
  };

  if (count >= 1) {
    if (count >= 2) {
      ctx.beginPath();
      ctx.moveTo(xForIndex(0), speedBaseY);
      for (let i = 0; i < count; i++) {
        ctx.lineTo(xForIndex(i), yForSpeed(samples[i].speedPct));
      }
      ctx.lineTo(xForIndex(count - 1), speedBaseY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(34, 211, 238, 0.14)';
      ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const px = xForIndex(i);
        const py = yForSpeed(samples[i].speedPct);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(xForIndex(0), yForSpeed(samples[0].speedPct), 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. VELOCITY (vx, vy) BAND
  const b1 = BANDS[1];
  drawBandFrame(
    ctx,
    b1.y,
    b1.h,
    b1.title,
    '+100%',
    '0%',
    '-100%',
    `+${playerSpeed.toFixed(2)}`,
    '0.00',
    `-${playerSpeed.toFixed(2)}`
  );
  drawVerticalGrid(b1.y, b1.h);

  // Legend inside Band 1 top-right
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('vx', PLOT_X + PLOT_W - 26, b1.y + 4);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('vy', PLOT_X + PLOT_W - 6, b1.y + 4);

  const velPadY = 12;
  const velMidY = b1.y + b1.h * 0.5;
  const velHalfH = b1.h * 0.5 - velPadY;
  const yForVel = (pct: number) => {
    const clamped = Math.max(-100, Math.min(100, pct));
    return velMidY - (clamped / 100) * velHalfH;
  };

  if (count >= 2) {
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const px = xForIndex(i);
      const py = yForVel(samples[i].vxPct);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.35;
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const px = xForIndex(i);
      const py = yForVel(samples[i].vyPct);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.35;
    ctx.stroke();
  }

  // 3. HEADING BAND
  const b2 = BANDS[2];
  drawBandFrame(
    ctx,
    b2.y,
    b2.h,
    b2.title,
    '+180°',
    '0°',
    '-180°',
    'W',
    'E',
    'W'
  );
  drawVerticalGrid(b2.y, b2.h);

  // N / S subtle labels at +/- 90°
  ctx.font = '8px monospace';
  ctx.fillStyle = '#4e5866';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('S (+90°)', PLOT_X + 6, b2.y + b2.h * 0.25 + 3);
  ctx.fillText('N (-90°)', PLOT_X + 6, b2.y + b2.h * 0.75 - 2);

  const headPadY = 12;
  const headMidY = b2.y + b2.h * 0.5;
  const headHalfH = b2.h * 0.5 - headPadY;
  const yForHeading = (deg: number) => {
    const clamped = Math.max(-180, Math.min(180, deg));
    return headMidY - (clamped / 180) * headHalfH;
  };

  if (count >= 2) {
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < count; i++) {
      const curr = samples[i];
      const px = xForIndex(i);
      const py = yForHeading(curr.headingDeg);
      if (!started || Math.abs(curr.headingDeg - samples[i - 1].headingDeg) > 180) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  // 4. ACCEL / BRAKE (SIGNED SPEED DELTA) BAND
  const b3 = BANDS[3];
  drawBandFrame(
    ctx,
    b3.y,
    b3.h,
    b3.title,
    `+${accelScalePct}%`,
    '0%',
    `-${accelScalePct}%`,
    `+${accelScalePx.toFixed(2)}`,
    '0.00',
    `-${accelScalePx.toFixed(2)}`
  );
  drawVerticalGrid(b3.y, b3.h);

  // Legend inside Band 3 top-right
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#34d399';
  ctx.fillText('+Accel', PLOT_X + PLOT_W - 48, b3.y + 4);
  ctx.fillStyle = '#fb7185';
  ctx.fillText('-Brake', PLOT_X + PLOT_W - 6, b3.y + 4);

  const accPadY = 12;
  const accZeroY = b3.y + b3.h * 0.5;
  const accHalfH = b3.h * 0.5 - accPadY;
  const yForAccel = (pct: number) => {
    const clamped = Math.max(-accelScalePct, Math.min(accelScalePct, pct));
    return accZeroY - (clamped / accelScalePct) * accHalfH;
  };

  if (count >= 2) {
    for (let i = 1; i < count; i++) {
      const v0 = samples[i - 1].accelPct;
      const v1 = samples[i].accelPct;
      const x0 = xForIndex(i - 1);
      const x1 = xForIndex(i);
      const y0 = yForAccel(v0);
      const y1 = yForAccel(v1);

      if (v0 >= 0 && v1 >= 0) {
        ctx.fillStyle = 'rgba(52, 211, 153, 0.28)';
        ctx.beginPath();
        ctx.moveTo(x0, accZeroY);
        ctx.lineTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1, accZeroY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      } else if (v0 <= 0 && v1 <= 0) {
        ctx.fillStyle = 'rgba(251, 113, 133, 0.30)';
        ctx.beginPath();
        ctx.moveTo(x0, accZeroY);
        ctx.lineTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1, accZeroY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      } else {
        const t = Math.abs(v0) / (Math.abs(v0) + Math.abs(v1));
        const xc = x0 + (x1 - x0) * t;
        const firstPos = v0 > 0;

        ctx.fillStyle = firstPos ? 'rgba(52, 211, 153, 0.28)' : 'rgba(251, 113, 133, 0.30)';
        ctx.beginPath();
        ctx.moveTo(x0, accZeroY);
        ctx.lineTo(x0, y0);
        ctx.lineTo(xc, accZeroY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = firstPos ? '#34d399' : '#fb7185';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(xc, accZeroY);
        ctx.stroke();

        ctx.fillStyle = firstPos ? 'rgba(251, 113, 133, 0.30)' : 'rgba(52, 211, 153, 0.28)';
        ctx.beginPath();
        ctx.moveTo(xc, accZeroY);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1, accZeroY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = firstPos ? '#fb7185' : '#34d399';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(xc, accZeroY);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
  }

  // Bottom step timeline footer
  const footerY = 374;
  ctx.fillStyle = '#64748b';
  ctx.font = '9px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(`-${windowSize}f`, PLOT_X, footerY);
  ctx.textAlign = 'center';
  if (count > 0) {
    ctx.fillText(
      `Steps ${samples[0].step}..${samples[count - 1].step} (${count}f captured)`,
      PLOT_X + PLOT_W * 0.5,
      footerY
    );
  } else {
    ctx.fillText('Waiting for simulation steps...', PLOT_X + PLOT_W * 0.5, footerY);
  }
  ctx.textAlign = 'right';
  ctx.fillText('Now', PLOT_X + PLOT_W, footerY);

  // Synchronized hover crosshair across all 4 bands
  if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < count) {
    const s = samples[hoverIdx];
    const hx = xForIndex(hoverIdx);

    ctx.save();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(hx, b0.y);
    ctx.lineTo(hx, b3.y + b3.h);
    ctx.stroke();
    ctx.restore();

    const dots: { y: number; color: string }[] = [
      { y: yForSpeed(s.speedPct), color: '#22d3ee' },
      { y: yForVel(s.vxPct), color: '#38bdf8' },
      { y: yForVel(s.vyPct), color: '#f59e0b' },
      { y: yForHeading(s.headingDeg), color: '#a78bfa' },
      { y: yForAccel(s.accelPct), color: s.accelPct >= 0 ? '#34d399' : '#fb7185' },
    ];

    for (const d of dots) {
      ctx.fillStyle = d.color;
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(hx, d.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export const PhysicsChartsPanel: React.FC<PhysicsChartsPanelProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [windowSize, setWindowSize] = useState<WindowSize>(300);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [readoutSample, setReadoutSample] = useState<PhysicsSample | null>(() => {
    const len = engine.physicsHistory.length;
    return len > 0 ? engine.physicsHistory[len - 1] : null;
  });
  const [episodeMeta, setEpisodeMeta] = useState<{ gen: number; step: number }>({
    gen: engine.generation,
    step: engine.stepCount,
  });

  const pausedSnapshotRef = useRef<PhysicsSample[]>([]);
  const lastDrawnKeyRef = useRef<string>('');
  const lastUiSyncRef = useRef<number>(0);

  const getDisplayedSamples = useCallback((): PhysicsSample[] => {
    const source = isPaused ? pausedSnapshotRef.current : engine.physicsHistory;
    if (source.length <= windowSize) return source;
    return source.slice(source.length - windowSize);
  }, [engine, isPaused, windowSize]);

  useEffect(() => {
    let rafId = 0;
    const renderLoop = () => {
      const samples = getDisplayedSamples();
      const validHover =
        hoverIdx !== null && samples.length > 0
          ? Math.max(0, Math.min(samples.length - 1, hoverIdx))
          : null;

      const drawKey = `${isPaused ? 'P' : engine.physicsVersion}|${windowSize}|${validHover ?? 'N'}|${samples.length}`;
      if (drawKey !== lastDrawnKeyRef.current) {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          drawPhysicsCanvas(ctx, samples, windowSize, engine.playerSpeed, validHover);
          lastDrawnKeyRef.current = drawKey;
        }
      }

      const now = performance.now();
      if (now - lastUiSyncRef.current >= 65) {
        lastUiSyncRef.current = now;
        const targetSample =
          validHover !== null
            ? samples[validHover] ?? null
            : samples.length > 0
            ? samples[samples.length - 1]
            : null;
        setReadoutSample(targetSample);
        setEpisodeMeta({ gen: engine.generation, step: engine.stepCount });
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [engine, getDisplayedSamples, hoverIdx, isPaused, windowSize]);

  const handleTogglePause = () => {
    if (!isPaused) {
      pausedSnapshotRef.current = engine.physicsHistory.slice();
      setIsPaused(true);
    } else {
      pausedSnapshotRef.current = [];
      setIsPaused(false);
    }
    lastDrawnKeyRef.current = '';
  };

  const handleClear = () => {
    engine.clearPhysicsHistory();
    pausedSnapshotRef.current = [];
    setHoverIdx(null);
    setReadoutSample(null);
    lastDrawnKeyRef.current = '';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const cx = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    if (cx < PLOT_X || cx > PLOT_X + PLOT_W) {
      setHoverIdx(null);
      return;
    }
    const samples = getDisplayedSamples();
    if (samples.length === 0) {
      setHoverIdx(null);
      return;
    }
    const normX = (cx - PLOT_X) / PLOT_W;
    const virtualIdx = Math.round(normX * Math.max(1, windowSize - 1));
    const idx = virtualIdx - (windowSize - samples.length);
    if (idx < -2 || idx >= samples.length) {
      setHoverIdx(null);
      return;
    }
    const clampedIdx = Math.max(0, Math.min(samples.length - 1, idx));
    setHoverIdx(clampedIdx);
    setReadoutSample(samples[clampedIdx]);
  };

  const samplesNow = getDisplayedSamples();
  const isInspecting = hoverIdx !== null && samplesNow.length > 0;
  const displayed =
    isInspecting && hoverIdx !== null
      ? samplesNow[Math.max(0, Math.min(samplesNow.length - 1, hoverIdx))] ?? readoutSample
      : readoutSample;

  const motion = getMotionState(displayed);

  return (
    <div
      id="physicsChartsPanel"
      className="w-[95%] max-w-[570px] mx-auto bg-[#0a0a0a] border border-[#333] p-[8px] font-mono text-[11px] text-[#ddd]"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-[6px] flex-wrap mb-[6px]">
        <div className="flex items-center gap-[4px] flex-wrap">
          <button
            id="btnPhysicsPause"
            type="button"
            onClick={handleTogglePause}
            className={`${
              isPaused
                ? 'bg-[#5c3d10] border-[#c88a2e] text-[#fff]'
                : 'bg-[#1a1a1a] border-[#444] text-[#ccc] hover:bg-[#2a2a2a]'
            } border px-[7px] py-[2px] cursor-pointer whitespace-nowrap shrink-0`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            id="btnPhysicsClear"
            type="button"
            onClick={handleClear}
            className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#444] text-[#ccc] px-[7px] py-[2px] cursor-pointer whitespace-nowrap shrink-0"
          >
            Clear
          </button>
          <span className="text-[#444] mx-[2px]">|</span>
          <span className="text-[#888] text-[10px] mr-[2px]">Window:</span>
          {([150, 300, 600] as WindowSize[]).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => {
                setWindowSize(sz);
                setHoverIdx(null);
                lastDrawnKeyRef.current = '';
              }}
              className={`${
                windowSize === sz
                  ? 'bg-[#066] border-[#0aa] text-[#fff]'
                  : 'bg-[#1a1a1a] border-[#444] text-[#ccc] hover:bg-[#2a2a2a]'
              } border px-[6px] py-[2px] cursor-pointer tabular-nums whitespace-nowrap shrink-0`}
            >
              {sz}f
            </button>
          ))}
        </div>

        <div className="text-[10px] text-[#888] tabular-nums whitespace-nowrap">
          {isInspecting && displayed
            ? `Inspecting Step ${displayed.step}`
            : `${isPaused ? 'Paused' : 'Live'} · Gen ${episodeMeta.gen} · Step ${episodeMeta.step}`}
        </div>
      </div>

      {/* Live / Inspected Readout Strip */}
      <div className="mb-[6px] px-[8px] py-[5px] bg-[#141414] border border-[#2a2a2a] grid grid-cols-2 sm:grid-cols-4 gap-[8px] tabular-nums">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-[#7b8594]">Speed |v|</span>
          <span className="text-[#22d3ee] font-semibold">
            {displayed ? `${displayed.speedPct.toFixed(0)}%` : '—'}
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            {displayed ? `${displayed.speedPx.toFixed(2)} px/step` : '—'}
          </span>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-[#7b8594]">Velocity vx / vy</span>
          <span className="font-semibold">
            {displayed ? (
              <>
                <span className="text-[#38bdf8]">
                  {displayed.vxPct >= 0 ? '+' : ''}
                  {displayed.vxPct.toFixed(0)}%
                </span>
                <span className="text-[#555] mx-[3px]">/</span>
                <span className="text-[#f59e0b]">
                  {displayed.vyPct >= 0 ? '+' : ''}
                  {displayed.vyPct.toFixed(0)}%
                </span>
              </>
            ) : (
              <span className="text-[#888]">—</span>
            )}
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            {displayed
              ? `${displayed.vxPx >= 0 ? '+' : ''}${displayed.vxPx.toFixed(2)} / ${displayed.vyPx >= 0 ? '+' : ''}${displayed.vyPx.toFixed(2)} px`
              : '—'}
          </span>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-[#7b8594]">Heading θ</span>
          <span className="text-[#a78bfa] font-semibold">
            {displayed
              ? `${displayed.headingDeg >= 0 ? '+' : ''}${displayed.headingDeg.toFixed(0)}° · ${getCardinalDir(displayed.headingDeg)}`
              : '—'}
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            {displayed ? (displayed.isMoving ? 'Active steering' : 'Stationary') : '—'}
          </span>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-[#7b8594]">Accel / Brake</span>
          <span className={`${motion.textClass} font-semibold`}>
            {displayed
              ? `${motion.label} · ${displayed.accelPct >= 0 ? '+' : ''}${displayed.accelPct.toFixed(1)}%`
              : '—'}
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            {displayed
              ? `${displayed.accelPx >= 0 ? '+' : ''}${displayed.accelPx.toFixed(2)} px/step`
              : '—'}
          </span>
        </div>
      </div>

      {/* Stacked Synchronized Charts Canvas */}
      <canvas
        ref={canvasRef}
        id="physicsCanvas"
        width={CANVAS_W}
        height={CANVAS_H}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIdx(null)}
        className="w-full h-auto block bg-[#050505] border border-[#262626] select-none touch-none cursor-crosshair"
      />

      <div className="mt-[5px] flex items-center justify-between gap-[8px] flex-wrap text-[10px] text-[#888] tabular-nums">
        <span>
          Hover charts to scrub synchronized step · Max {engine.playerSpeed.toFixed(2)} px/step (100%)
        </span>
        <span>Current episode rolling window</span>
      </div>
    </div>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DemoFrame, HumanDemoRecording, TrainingResult } from '../simulation/DemonstrationStore';
import { EvasionEngine, SIM_HEIGHT, SIM_WIDTH } from '../simulation/EvasionEngine';
import { ActivationType } from '../simulation/NeuralNetwork';
import { DemoLibraryPanel } from './DemoLibraryPanel';

interface HumanDemoOverlayProps {
  engine: EvasionEngine;
  demos: HumanDemoRecording[];
  layers: number;
  neurons: number;
  activation: ActivationType;
  onSaveDemo: (demo: HumanDemoRecording) => void;
  onDeleteDemo: (id: string) => void;
  onClearAllDemos: () => void;
  onDownloadAllDemos: () => void;
  onDownloadSingleDemo: (demo: HumanDemoRecording) => void;
  onImportDemosData: (data: unknown) => number;
  onTrainModel: (config: {
    epochs: number;
    learningRate: number;
    seedPopulation: boolean;
  }) => TrainingResult;
  onExit: () => void;
}

const STICK_W = 320;
const STICK_H = 148;
const STICK_RADIUS = 46;

export const HumanDemoOverlay: React.FC<HumanDemoOverlayProps> = ({
  engine,
  demos,
  layers,
  neurons,
  activation,
  onSaveDemo,
  onDeleteDemo,
  onClearAllDemos,
  onDownloadAllDemos,
  onDownloadSingleDemo,
  onImportDemosData,
  onTrainModel,
  onExit,
}) => {
  const arenaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stickCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showTrainer, setShowTrainer] = useState<boolean>(false);
  const [liveSteps, setLiveSteps] = useState<number>(0);
  const [liveFitness, setLiveFitness] = useState<number>(0);
  const [isRunActive, setIsRunActive] = useState<boolean>(false);
  const [bannerText, setBannerText] = useState<string>('Move stick or WASD to start');

  const showTrainerRef = useRef<boolean>(false);
  const runActiveRef = useRef<boolean>(false);
  const framesRef = useRef<DemoFrame[]>([]);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const lastBannerRef = useRef<string>('Move stick or WASD to start');

  // Stick + keyboard control state
  const stickDragRef = useRef<{
    pointerId: number;
    anchorX: number;
    anchorY: number;
    knobX: number;
    knobY: number;
    ax: number;
    ay: number;
  } | null>(null);
  const keysDownRef = useRef<Set<string>>(new Set());
  const demoCountRef = useRef<number>(demos.length);

  useEffect(() => {
    demoCountRef.current = demos.length;
  }, [demos.length]);

  useEffect(() => {
    showTrainerRef.current = showTrainer;
  }, [showTrainer]);

  const setBanner = useCallback((msg: string) => {
    lastBannerRef.current = msg;
    setBannerText(msg);
  }, []);

  const resetForNextRun = useCallback((keepBanner = false) => {
    engine.startEpisode();
    framesRef.current = [];
    trailRef.current = [];
    runActiveRef.current = false;
    setIsRunActive(false);
    setLiveSteps(0);
    setLiveFitness(0);
    if (!keepBanner) {
      setBanner('Move stick or WASD to start');
    }
  }, [engine, setBanner]);

  const finalizeAndBankRun = useCallback(
    (wasHit: boolean) => {
      const recorded = framesRef.current;
      if (recorded.length < 10) {
        resetForNextRun(true);
        setBanner(wasHit ? 'HIT too early (<10 frames) — Move stick for next run' : 'Reset (<10 frames)');
        return false;
      }

      const nextNum = demoCountRef.current + 1;
      const isRest = engine.params.simMode === 'restaurant';
      const demo: HumanDemoRecording = {
        id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: `${isRest ? 'Shift' : 'Run'} #${nextNum}`,
        createdAt: new Date().toISOString(),
        steps: recorded.length,
        fitness: engine.currentFitness,
        hit: wasHit,
        envSummary: {
          simMode: engine.params.simMode,
          numEnemies: engine.params.numEnemies,
          enemySpeedPct: engine.params.enemySpeedPct,
          enemySpeedMode: engine.params.enemySpeedMode,
          spawnMode: engine.params.spawnMode,
        },
        frames: recorded.slice(),
      };

      onSaveDemo(demo);
      resetForNextRun(true);
      const endPrefix = wasHit ? (isRest ? 'SHIFT ENDED! ' : 'HIT! ') : '';
      setBanner(
        `${endPrefix}Saved ${demo.name} (${demo.steps} frames) — Move stick for next run`
      );
      return true;
    },
    [engine.currentFitness, engine.params, onSaveDemo, resetForNextRun, setBanner]
  );

  // Initialize fresh episode on mount
  useEffect(() => {
    resetForNextRun();
  }, [resetForNextRun]);

  // Keyboard listener (WASD + Arrows)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showTrainerRef.current) return;
      const key = e.key.toLowerCase();
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)
      ) {
        e.preventDefault();
        keysDownRef.current.add(key);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.key.toLowerCase());
    };
    const onBlur = () => {
      keysDownRef.current.clear();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Compute merged input vector from analog stick + keyboard
  const getCurrentControl = useCallback((): { ax: number; ay: number } => {
    const drag = stickDragRef.current;
    if (drag && (Math.abs(drag.ax) > 0.01 || Math.abs(drag.ay) > 0.01)) {
      return { ax: drag.ax, ay: drag.ay };
    }

    const keys = keysDownRef.current;
    let kx = 0;
    let ky = 0;
    if (keys.has('a') || keys.has('arrowleft')) kx -= 1;
    if (keys.has('d') || keys.has('arrowright')) kx += 1;
    if (keys.has('w') || keys.has('arrowup')) ky -= 1;
    if (keys.has('s') || keys.has('arrowdown')) ky += 1;

    const kMag = Math.hypot(kx, ky);
    if (kMag > 1) {
      kx /= kMag;
      ky /= kMag;
    }
    return { ax: kx, ay: ky };
  }, []);

  // Main 60fps loop for Human Demo gameplay + Arena + Joystick canvas
  useEffect(() => {
    let animId = 0;
    let lastFrameTime = performance.now();

    const tick = (now: number) => {
      const dt = now - lastFrameTime;
      if (dt >= 15.5) {
        lastFrameTime = now - (dt % 16.67);

        const ctrl = getCurrentControl();
        const ctrlMag = Math.hypot(ctrl.ax, ctrl.ay);

        if (!showTrainerRef.current) {
          if (!runActiveRef.current && ctrlMag > 0.06) {
            runActiveRef.current = true;
            setIsRunActive(true);
            setBanner('');
          }

          if (runActiveRef.current) {
            const stepRes = engine.stepHumanControl(ctrl.ax, ctrl.ay);
            framesRef.current.push({
              inputs: stepRes.inputs,
              action: stepRes.action,
            });
            setLiveSteps(framesRef.current.length);
            setLiveFitness(Math.round(stepRes.fitness));

            const lastPt = trailRef.current[trailRef.current.length - 1];
            if (
              !lastPt ||
              Math.hypot(engine.player.x - lastPt.x, engine.player.y - lastPt.y) >= 1.5
            ) {
              trailRef.current.push({ x: engine.player.x, y: engine.player.y });
              if (trailRef.current.length > 32) {
                trailRef.current.shift();
              }
            }

            if (stepRes.hit || engine.stepCount >= engine.maxSteps) {
              finalizeAndBankRun(stepRes.hit);
            }
          }
        }

        // Render Brotato-style Arena Canvas
        const arenaCanvas = arenaCanvasRef.current;
        const aCtx = arenaCanvas?.getContext('2d');
        if (aCtx) {
          engine.drawArena(aCtx);

          if (engine.params.simMode !== 'restaurant') {
            // Crisp arena grid
            aCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            aCtx.lineWidth = 1;
            for (let gx = 50; gx < SIM_WIDTH; gx += 50) {
              aCtx.beginPath();
              aCtx.moveTo(gx, 0);
              aCtx.lineTo(gx, SIM_HEIGHT);
              aCtx.stroke();
            }
            for (let gy = 50; gy < SIM_HEIGHT; gy += 50) {
              aCtx.beginPath();
              aCtx.moveTo(0, gy);
              aCtx.lineTo(SIM_WIDTH, gy);
              aCtx.stroke();
            }
          }

          // Fading motion trail
          const trail = trailRef.current;
          for (let i = 1; i < trail.length; i++) {
            const alpha = (i / trail.length) * 0.5;
            aCtx.strokeStyle = `rgba(0, 255, 255, ${alpha.toFixed(2)})`;
            aCtx.lineWidth = 2;
            aCtx.beginPath();
            aCtx.moveTo(trail[i - 1].x, trail[i - 1].y);
            aCtx.lineTo(trail[i].x, trail[i].y);
            aCtx.stroke();
          }

          // Control vector indicator around player
          if (ctrlMag > 0.05) {
            const arrowLen = 14 + ctrlMag * 16;
            aCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            aCtx.lineWidth = 1.8;
            aCtx.beginPath();
            aCtx.moveTo(engine.player.x, engine.player.y);
            aCtx.lineTo(
              engine.player.x + (ctrl.ax / ctrlMag) * arrowLen,
              engine.player.y + (ctrl.ay / ctrlMag) * arrowLen
            );
            aCtx.stroke();
          }

          // Subtle status prompt inside arena when idle/post-hit
          if (!runActiveRef.current && lastBannerRef.current) {
            aCtx.fillStyle = 'rgba(0, 0, 0, 0.62)';
            aCtx.fillRect(0, SIM_HEIGHT - 30, SIM_WIDTH, 30);
            aCtx.fillStyle = '#0ff';
            aCtx.font = 'bold 12px monospace';
            aCtx.textAlign = 'center';
            aCtx.textBaseline = 'middle';
            aCtx.fillText(lastBannerRef.current, SIM_WIDTH * 0.5, SIM_HEIGHT - 15);
            aCtx.textAlign = 'left';
          }
        }

        // Render Brotato-style Floating Analog Control Stick Canvas
        const stickCanvas = stickCanvasRef.current;
        const sCtx = stickCanvas?.getContext('2d');
        if (sCtx) {
          sCtx.fillStyle = '#0b0b0b';
          sCtx.fillRect(0, 0, STICK_W, STICK_H);

          const drag = stickDragRef.current;
          const anchorX = drag ? drag.anchorX : STICK_W * 0.5;
          const anchorY = drag ? drag.anchorY : STICK_H * 0.5;
          const knobX = drag ? drag.knobX : anchorX + ctrl.ax * STICK_RADIUS;
          const knobY = drag ? drag.knobY : anchorY + ctrl.ay * STICK_RADIUS;

          // Outer joystick ring
          sCtx.strokeStyle = drag || ctrlMag > 0.05 ? 'rgba(0, 225, 255, 0.55)' : 'rgba(255, 255, 255, 0.22)';
          sCtx.lineWidth = 2;
          sCtx.beginPath();
          sCtx.arc(anchorX, anchorY, STICK_RADIUS, 0, Math.PI * 2);
          sCtx.stroke();

          sCtx.fillStyle = 'rgba(0, 220, 240, 0.06)';
          sCtx.fill();

          // Crosshair lines
          sCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          sCtx.lineWidth = 1;
          sCtx.beginPath();
          sCtx.moveTo(anchorX - STICK_RADIUS, anchorY);
          sCtx.lineTo(anchorX + STICK_RADIUS, anchorY);
          sCtx.moveTo(anchorX, anchorY - STICK_RADIUS);
          sCtx.lineTo(anchorX, anchorY + STICK_RADIUS);
          sCtx.stroke();

          // Tether stem
          sCtx.strokeStyle = 'rgba(0, 255, 255, 0.55)';
          sCtx.lineWidth = 3;
          sCtx.beginPath();
          sCtx.moveTo(anchorX, anchorY);
          sCtx.lineTo(knobX, knobY);
          sCtx.stroke();

          // Thumb puck
          sCtx.fillStyle = ctrlMag > 0.05 ? '#0ff' : '#4a6b6e';
          sCtx.strokeStyle = '#fff';
          sCtx.lineWidth = 1.5;
          sCtx.beginPath();
          sCtx.arc(knobX, knobY, 17, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.stroke();

          // Subtle corner vector readout
          sCtx.fillStyle = '#666';
          sCtx.font = '10px monospace';
          sCtx.textBaseline = 'top';
          sCtx.fillText(`STICK (${ctrl.ax.toFixed(2)}, ${ctrl.ay.toFixed(2)})`, 8, 6);
          sCtx.textBaseline = 'bottom';
          sCtx.fillText('Drag pad or use WASD / Arrows', 8, STICK_H - 6);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [engine, finalizeAndBankRun, getCurrentControl, setBanner]);

  const toStickCoords = (clientX: number, clientY: number) => {
    const canvas = stickCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * STICK_W,
      y: ((clientY - rect.top) / rect.height) * STICK_H,
    };
  };

  return (
    <div
      id="humanDemoOverlay"
      className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-between p-[8px] sm:p-[12px] font-mono text-[#eee] select-none overflow-hidden"
    >
      {/* Top Minimal HUD */}
      <div className="w-full max-w-[640px] flex items-center justify-between gap-[6px] flex-wrap bg-[#111] border border-[#2d2d2d] px-[8px] py-[6px] text-[11px]">
        <div className="flex items-center gap-[8px] flex-wrap">
          <span className="inline-flex items-center gap-[5px] font-bold text-[#0ff]">
            <span
              className={`inline-block w-[8px] h-[8px] ${
                isRunActive ? 'bg-[#f33]' : 'bg-[#0aa]'
              }`}
            />
            HUMAN DEMO
          </span>
          <span className="text-[#bbb] tabular-nums">
            Frames: <span className="text-[#fff]">{liveSteps}</span>
          </span>
          <span className="text-[#bbb] tabular-nums">
            Fit: <span className="text-[#0dd]">{liveFitness}</span>
          </span>
          {engine.params.simMode === 'restaurant' && (
            <span className="text-[#bbb] tabular-nums">
              Served: <span className="text-[#34d399]">{engine.restaurant.customersServed}</span>
              {' · '}
              Left: <span className="text-[#f87171]">{engine.restaurant.customersLeft}</span>
            </span>
          )}
          <span className="text-[#888] tabular-nums">Saved: {demos.length}</span>
        </div>

        <div className="flex items-center gap-[5px] flex-wrap">
          <button
            id="btnDemoSaveRun"
            type="button"
            disabled={liveSteps < 10}
            onClick={() => finalizeAndBankRun(false)}
            title="Save current demonstration run and reset for next run"
            className="bg-[#1b4a4a] hover:bg-[#246363] border border-[#0aa] text-[#fff] px-[7px] py-[3px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Run
          </button>
          <button
            id="btnDemoOpenLibrary"
            type="button"
            onClick={() => setShowTrainer((prev) => !prev)}
            className={`${
              showTrainer ? 'bg-[#066] border-[#0ff]' : 'bg-[#222] border-[#444] hover:bg-[#333]'
            } border text-[#eee] px-[7px] py-[3px] cursor-pointer`}
          >
            Demos / Train ({demos.length})
          </button>
          <button
            id="btnDemoExit"
            type="button"
            onClick={() => {
              if (framesRef.current.length >= 15) {
                finalizeAndBankRun(false);
              }
              onExit();
            }}
            className="bg-[#331a1a] hover:bg-[#4a2323] border border-[#744] text-[#fdd] px-[7px] py-[3px] cursor-pointer"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Center Brotato-Style Arena */}
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-0 my-[6px]">
        <canvas
          ref={arenaCanvasRef}
          id="humanDemoArenaCanvas"
          width={SIM_WIDTH}
          height={SIM_HEIGHT}
          className="bg-[#000] border-2 border-[#3a3a3a] max-w-full max-h-full aspect-[3/2] block"
        />
        {bannerText && (
          <div className="mt-[4px] text-[10px] text-[#0cc] text-center">{bannerText}</div>
        )}
      </div>

      {/* Bottom Floating Analog Control Stick */}
      <div className="w-full max-w-[360px] flex flex-col items-center">
        <canvas
          ref={stickCanvasRef}
          id="humanStickCanvas"
          width={STICK_W}
          height={STICK_H}
          onPointerDown={(e) => {
            if (showTrainerRef.current) return;
            const pt = toStickCoords(e.clientX, e.clientY);
            if (!pt) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            const padMargin = STICK_RADIUS + 8;
            const ax = Math.max(padMargin, Math.min(STICK_W - padMargin, pt.x));
            const ay = Math.max(padMargin, Math.min(STICK_H - padMargin, pt.y));
            stickDragRef.current = {
              pointerId: e.pointerId,
              anchorX: ax,
              anchorY: ay,
              knobX: ax,
              knobY: ay,
              ax: 0,
              ay: 0,
            };
          }}
          onPointerMove={(e) => {
            const drag = stickDragRef.current;
            if (!drag || drag.pointerId !== e.pointerId) return;
            const pt = toStickCoords(e.clientX, e.clientY);
            if (!pt) return;
            const dx = pt.x - drag.anchorX;
            const dy = pt.y - drag.anchorY;
            const dist = Math.hypot(dx, dy);
            const clamped = Math.min(STICK_RADIUS, dist);
            const ux = dist > 0.001 ? dx / dist : 0;
            const uy = dist > 0.001 ? dy / dist : 0;
            drag.knobX = drag.anchorX + ux * clamped;
            drag.knobY = drag.anchorY + uy * clamped;

            const normMag = clamped / STICK_RADIUS;
            if (normMag < 0.06) {
              drag.ax = 0;
              drag.ay = 0;
            } else {
              drag.ax = ux * normMag;
              drag.ay = uy * normMag;
            }
          }}
          onPointerUp={(e) => {
            if (stickDragRef.current?.pointerId === e.pointerId) {
              stickDragRef.current = null;
            }
          }}
          onPointerCancel={(e) => {
            if (stickDragRef.current?.pointerId === e.pointerId) {
              stickDragRef.current = null;
            }
          }}
          className="w-full h-auto block bg-[#0b0b0b] border border-[#333] touch-none cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Modal Overlay for Saved Demo Files & Imitation Training */}
      {showTrainer && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-[10px]">
          <DemoLibraryPanel
            demos={demos}
            layers={layers}
            neurons={neurons}
            activation={activation}
            onDeleteDemo={onDeleteDemo}
            onClearAllDemos={onClearAllDemos}
            onDownloadAllDemos={onDownloadAllDemos}
            onDownloadSingleDemo={onDownloadSingleDemo}
            onImportDemosData={onImportDemosData}
            onTrainModel={onTrainModel}
            onClose={() => setShowTrainer(false)}
          />
        </div>
      )}
    </div>
  );
};

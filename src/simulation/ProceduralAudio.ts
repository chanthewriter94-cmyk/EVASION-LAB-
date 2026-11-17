import type { VisualMode } from './ProceduralVisuals';

export type CreatureAudioCueKind =
  | 'step'
  | 'wallGrip'
  | 'spring'
  | 'glassBrush'
  | 'bubble'
  | 'hit';

export interface CreatureAudioCue {
  kind: CreatureAudioCueKind;
  visualMode: Exclude<VisualMode, 'classic'>;
  intensity: number;
  pan: number;
  isFront?: boolean;
}

export interface CreatureAudioTelemetry {
  visualMode: VisualMode;
  speedRatio: number;
  turnRate: number;
  isWallRiding: boolean;
  pan: number;
}

const CUE_COOLDOWNS_MS: Record<CreatureAudioCueKind, number> = {
  step: 52,
  wallGrip: 75,
  spring: 135,
  glassBrush: 165,
  bubble: 120,
  hit: 130,
};

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private pinkNoiseBuffer: AudioBuffer | null = null;
  private whiteNoiseBuffer: AudioBuffer | null = null;

  // Continuous Goldfish underwater swim flow bed
  private swimBedSource: AudioBufferSourceNode | null = null;
  private swimBedFilter: BiquadFilterNode | null = null;
  private swimBedPanner: StereoPannerNode | null = null;
  private swimBedGain: GainNode | null = null;

  private enabled = true;
  private volume = 0.35;
  private frameAudible = true;
  private lastCueMs: Partial<Record<CreatureAudioCueKind, number>> = {};
  private lastTelemetryMs = 0;
  private idleWatchdogId: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) return this.ctx;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    try {
      const ctx = new AudioCtx();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, ctx.currentTime);
      compressor.knee.setValueAtTime(12, ctx.currentTime);
      compressor.ratio.setValueAtTime(4, ctx.currentTime);
      compressor.attack.setValueAtTime(0.004, ctx.currentTime);
      compressor.release.setValueAtTime(0.08, ctx.currentTime);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.getTargetMasterGain(), ctx.currentTime);

      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      this.ctx = ctx;
      this.compressor = compressor;
      this.masterGain = masterGain;

      this.pinkNoiseBuffer = this.buildNoiseBuffer(ctx, 2.0, true);
      this.whiteNoiseBuffer = this.buildNoiseBuffer(ctx, 0.75, false);
      this.setupSwimBed(ctx, compressor);

      return ctx;
    } catch {
      return null;
    }
  }

  private buildNoiseBuffer(ctx: AudioContext, seconds: number, pinkWeighted: boolean): AudioBuffer {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (!pinkWeighted) {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    }

    // Smooth Paul Kellet pink/brown-tilted noise for warm organic & underwater filtering
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
      data[i] = clamp(sample, -1, 1);
    }
    return buffer;
  }

  private setupSwimBed(ctx: AudioContext, destination: AudioNode): void {
    if (!this.pinkNoiseBuffer) return;

    const src = ctx.createBufferSource();
    src.buffer = this.pinkNoiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);
    filter.Q.setValueAtTime(0.85, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);

    let panner: StereoPannerNode | null = null;
    if (typeof ctx.createStereoPanner === 'function') {
      panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(0, ctx.currentTime);
      src.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
    } else {
      src.connect(filter);
      filter.connect(gain);
    }

    gain.connect(destination);
    src.start();

    this.swimBedSource = src;
    this.swimBedFilter = filter;
    this.swimBedPanner = panner;
    this.swimBedGain = gain;
  }

  private getTargetMasterGain(): number {
    if (!this.enabled || !this.frameAudible) return 0;
    return clamp(this.volume, 0, 1) * 0.65;
  }

  private syncMasterGain(timeConstant = 0.025): void {
    if (!this.ctx || !this.masterGain) return;
    const target = this.getTargetMasterGain();
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, timeConstant);
    if (target <= 0.0001 && this.swimBedGain) {
      this.swimBedGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.025);
    }
  }

  unlock(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    this.syncMasterGain(0.03);
  }

  setSettings(enabled: boolean, volume: number): void {
    this.enabled = enabled;
    this.volume = clamp(volume, 0, 1);
    if (this.ctx) {
      this.syncMasterGain(0.025);
    }
  }

  setFrameAudible(audible: boolean): void {
    if (this.frameAudible === audible) return;
    this.frameAudible = audible;
    this.syncMasterGain(0.025);
  }

  silenceContinuous(): void {
    if (!this.ctx || !this.swimBedGain) return;
    this.swimBedGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    if (this.idleWatchdogId !== null) {
      window.clearTimeout(this.idleWatchdogId);
      this.idleWatchdogId = null;
    }
  }

  private scheduleIdleWatchdog(): void {
    if (typeof window === 'undefined') return;
    if (this.idleWatchdogId !== null) {
      window.clearTimeout(this.idleWatchdogId);
    }
    this.idleWatchdogId = window.setTimeout(() => {
      this.idleWatchdogId = null;
      if (performance.now() - this.lastTelemetryMs >= 130) {
        this.silenceContinuous();
      }
    }, 150);
  }

  processFrame(cues: CreatureAudioCue[], telemetry: CreatureAudioTelemetry): void {
    if (!this.enabled || !this.frameAudible || this.volume <= 0.002) {
      return;
    }
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.compressor) {
      return;
    }

    this.lastTelemetryMs = performance.now();
    this.updateContinuousBed(ctx, telemetry);
    this.scheduleIdleWatchdog();

    for (let i = 0; i < cues.length; i++) {
      this.triggerCue(ctx, cues[i]);
    }
  }

  private updateContinuousBed(ctx: AudioContext, telemetry: CreatureAudioTelemetry): void {
    if (!this.swimBedGain || !this.swimBedFilter) return;

    const now = ctx.currentTime;
    if (telemetry.visualMode !== 'goldfish' || !this.enabled || !this.frameAudible) {
      this.swimBedGain.gain.setTargetAtTime(0, now, 0.04);
      return;
    }

    const motion = clamp(telemetry.speedRatio * 0.78 + telemetry.turnRate * 0.42, 0, 1);
    const targetGain = motion > 0.05 ? motion * motion * 0.046 : 0;
    const targetCutoff = 165 + motion * 255 + (telemetry.isWallRiding ? 45 : 0);

    this.swimBedGain.gain.setTargetAtTime(targetGain, now, 0.06);
    this.swimBedFilter.frequency.setTargetAtTime(targetCutoff, now, 0.06);
    if (this.swimBedPanner) {
      this.swimBedPanner.pan.setTargetAtTime(clamp(telemetry.pan, -0.35, 0.35), now, 0.07);
    }
  }

  private routeWithPan(ctx: AudioContext, pan: number): AudioNode {
    if (!this.compressor) {
      return ctx.destination;
    }
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(clamp(pan, -0.35, 0.35), ctx.currentTime);
      panner.connect(this.compressor);
      return panner;
    }
    return this.compressor;
  }

  private canTriggerCue(kind: CreatureAudioCueKind): boolean {
    const nowMs = performance.now();
    const lastMs = this.lastCueMs[kind] ?? 0;
    if (nowMs - lastMs < CUE_COOLDOWNS_MS[kind]) {
      return false;
    }
    this.lastCueMs[kind] = nowMs;
    return true;
  }

  private triggerCue(ctx: AudioContext, cue: CreatureAudioCue): void {
    if (!this.canTriggerCue(cue.kind)) return;

    const intensity = clamp(cue.intensity, 0.1, 1);
    const jitter = 0.92 + Math.random() * 0.16;
    const ampJitter = 0.88 + Math.random() * 0.24;
    const out = this.routeWithPan(ctx, cue.pan);

    switch (cue.kind) {
      case 'step':
        this.playLizardStep(ctx, out, intensity * ampJitter, jitter, Boolean(cue.isFront));
        break;
      case 'wallGrip':
        this.playLizardWallGrip(ctx, out, intensity * ampJitter, jitter, Boolean(cue.isFront));
        break;
      case 'spring':
        if (cue.visualMode === 'goldfish') {
          this.playGoldfishTailKick(ctx, out, intensity * ampJitter, jitter);
        } else {
          this.playLizardSpring(ctx, out, intensity * ampJitter, jitter);
        }
        break;
      case 'glassBrush':
        this.playGoldfishGlassBrush(ctx, out, intensity * ampJitter, jitter);
        break;
      case 'bubble':
        this.playGoldfishBubble(ctx, out, intensity * ampJitter, jitter);
        break;
      case 'hit':
        if (cue.visualMode === 'goldfish') {
          this.playGoldfishHit(ctx, out, intensity, jitter);
        } else {
          this.playLizardHit(ctx, out, intensity, jitter);
        }
        break;
    }
  }

  private playLizardStep(
    ctx: AudioContext,
    out: AudioNode,
    intensity: number,
    jitter: number,
    isFront: boolean
  ): void {
    if (!this.pinkNoiseBuffer) return;
    const now = ctx.currentTime;

    // Soft dry organic pad contact (filtered noise micro-puff)
    const src = ctx.createBufferSource();
    src.buffer = this.pinkNoiseBuffer;
    const offset = Math.random() * 1.4;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((isFront ? 920 : 710) * jitter, now);
    filter.Q.setValueAtTime(1.8, now);

    const env = ctx.createGain();
    const peak = 0.022 + intensity * 0.032;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.021);

    src.connect(filter);
    filter.connect(env);
    env.connect(out);
    src.start(now, offset, 0.028);

    // Subtle skin/pad body tap
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const baseHz = (isFront ? 175 : 138) * jitter;
    osc.frequency.setValueAtTime(baseHz, now);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 0.52, now + 0.018);

    const oscEnv = ctx.createGain();
    oscEnv.gain.setValueAtTime(0.0001, now);
    oscEnv.gain.linearRampToValueAtTime(peak * 0.45, now + 0.002);
    oscEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.019);

    osc.connect(oscEnv);
    oscEnv.connect(out);
    osc.start(now);
    osc.stop(now + 0.022);
  }

  private playLizardWallGrip(
    ctx: AudioContext,
    out: AudioNode,
    intensity: number,
    jitter: number,
    isFront: boolean
  ): void {
    if (!this.whiteNoiseBuffer) return;
    const now = ctx.currentTime;

    // Crisp but ultra-quiet dry claw latch tick
    const src = ctx.createBufferSource();
    src.buffer = this.whiteNoiseBuffer;
    const offset = Math.random() * 0.5;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((isFront ? 2050 : 1680) * jitter, now);
    filter.Q.setValueAtTime(3.1, now);

    const env = ctx.createGain();
    const peak = 0.018 + intensity * 0.026;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

    src.connect(filter);
    filter.connect(env);
    env.connect(out);
    src.start(now, offset, 0.022);

    // Muted woody wall tap
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(310 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(140 * jitter, now + 0.016);

    const oscEnv = ctx.createGain();
    oscEnv.gain.setValueAtTime(0.0001, now);
    oscEnv.gain.linearRampToValueAtTime(peak * 0.35, now + 0.0015);
    oscEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    osc.connect(oscEnv);
    oscEnv.connect(out);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  private playLizardSpring(
    ctx: AudioContext,
    out: AudioNode,
    intensity: number,
    jitter: number
  ): void {
    const now = ctx.currentTime;
    const peak = 0.036 + intensity * 0.038;

    // Soft organic push-off thump
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(102 * jitter, now);
    osc.frequency.linearRampToValueAtTime(148 * jitter, now + 0.016);
    osc.frequency.exponentialRampToValueAtTime(68 * jitter, now + 0.055);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(env);
    env.connect(out);
    osc.start(now);
    osc.stop(now + 0.065);

    // Subtle dry air/surface brush
    if (this.pinkNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.pinkNoiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(520 * jitter, now);
      filter.Q.setValueAtTime(1.2, now);

      const nEnv = ctx.createGain();
      nEnv.gain.setValueAtTime(0.0001, now);
      nEnv.gain.linearRampToValueAtTime(peak * 0.55, now + 0.006);
      nEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

      src.connect(filter);
      filter.connect(nEnv);
      nEnv.connect(out);
      src.start(now, Math.random() * 1.2, 0.055);
    }
  }

  private playLizardHit(
    ctx: AudioContext,
    out: AudioNode,
    intensity: number,
    jitter: number
  ): void {
    const now = ctx.currentTime;
    const peak = 0.065 + intensity * 0.05;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(145 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(48 * jitter, now + 0.085);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(460, now);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

    osc.connect(filter);
    filter.connect(env);
    env.connect(out);
    osc.start(now);
    osc.stop(now + 0.1);

    if (this.pinkNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.pinkNoiseBuffer;
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(410 * jitter, now);
      nFilter.Q.setValueAtTime(1.0, now);

      const nEnv = ctx.createGain();
      nEnv.gain.setValueAtTime(0.0001, now);
      nEnv.gain.linearRampToValueAtTime(peak * 0.65, now + 0.004);
      nEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

      src.connect(nFilter);
      nFilter.connect(nEnv);
      nEnv.connect(out);
      src.start(now, Math.random() * 1.2, 0.085);
    }
  }

  private playGoldfishTailKick(
    ctx: AudioContext,
    out: AudioNode,
    intensity: number,
    jitter: number
  ): void {
    const now = ctx.currentTime;
    const peak = 0.032 + intensity * 0.035;

    // Muffled underwater pressure pulse
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(76 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(42 * jitter, now + 0.072);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.078);

    osc.connect(env);
    env.connect(out);
    osc.start(now);
    osc.stop(now + 0.085);

    // Warm low-passed water displacement whoosh
    if (this.pinkNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.pinkNoiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280 * jitter, now);
      filter.frequency.exponentialRampToValueAtTime(135, now + 0.075);

      const nEnv = ctx.createGain();
      nEnv.gain.setValueAtTime(0.0001, now);
      nEnv.gain.linearRampToValueAtTime(peak * 0.65, now + 0.012);
      nEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.082);

      src.connect(filter);
      filter.connect(nEnv);
      nEnv.connect(out);
      src.start(now, Math.random() * 1.2, 0.09);
    }
  }

  private playGoldfishGlassBrush(
    ctx: AudioContext,
    out: AudioNode,
    intensity: number,
    jitter: number
  ): void {
    const now = ctx.currentTime;
    const peak = 0.016 + intensity * 0.022;

    // Damped low underwater glass nudge (no harsh high ring)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(142 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(88 * jitter, now + 0.036);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);

    osc.connect(filter);
    filter.connect(env);
    env.connect(out);
    osc.start(now);
    osc.stop(now + 0.048);
  }

  private playGoldfishBubble(
    ctx: AudioContext,
    out: AudioNode,
    intensity: number,
    jitter: number
  ): void {
    const now = ctx.currentTime;
    const peak = 0.012 + intensity * 0.018;

    // Soft muffled upward water bubble bloop
    const startHz = (310 + Math.random() * 140) * jitter;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startHz, now);
    osc.frequency.exponentialRampToValueAtTime(startHz * 1.48, now + 0.024);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);

    osc.connect(filter);
    filter.connect(env);
    env.connect(out);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  private playGoldfishHit(
    ctx: AudioContext,
    out: AudioNode,
    intensity: number,
    jitter: number
  ): void {
    const now = ctx.currentTime;
    const peak = 0.055 + intensity * 0.042;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(112 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(42 * jitter, now + 0.1);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(env);
    env.connect(out);
    osc.start(now);
    osc.stop(now + 0.12);

    if (this.pinkNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.pinkNoiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(480 * jitter, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.1);

      const nEnv = ctx.createGain();
      nEnv.gain.setValueAtTime(0.0001, now);
      nEnv.gain.linearRampToValueAtTime(peak * 0.6, now + 0.008);
      nEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.105);

      src.connect(filter);
      filter.connect(nEnv);
      nEnv.connect(out);
      src.start(now, Math.random() * 1.2, 0.115);
    }
  }

  dispose(): void {
    if (this.idleWatchdogId !== null) {
      window.clearTimeout(this.idleWatchdogId);
      this.idleWatchdogId = null;
    }
    try {
      this.swimBedSource?.stop();
    } catch {
      // Ignore already stopped
    }
    this.swimBedSource = null;
    this.swimBedFilter = null;
    this.swimBedPanner = null;
    this.swimBedGain = null;
    this.compressor = null;
    this.masterGain = null;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

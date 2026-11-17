import type {
  CreatureAudioCue,
  CreatureAudioCueKind,
  CreatureAudioTelemetry,
} from './ProceduralAudio';

export type VisualMode = 'lizard' | 'goldfish' | 'classic';

export interface VisualPlayerSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface VisualEnemySnapshot {
  x: number;
  y: number;
  speedPct?: number;
  spawnDelay?: number;
}

export interface VisualStepContext {
  player: VisualPlayerSnapshot;
  partnerPlayer?: VisualPlayerSnapshot;
  playerSpeed: number;
  enemies: VisualEnemySnapshot[];
  simWidth: number;
  simHeight: number;
  episodeId: number;
  visualMode: Exclude<VisualMode, 'classic'>;
  headingOverride?: number;
  stamina?: number;
  isSprinting?: boolean;
  palette?: 'default' | 'cyan' | 'amber' | 'split';
  splitPaletteColors?: string[];
  skipEnemies?: boolean;
}

interface Vec2 {
  x: number;
  y: number;
}

type WallSide = 'left' | 'right' | 'top' | 'bottom';

interface PerimeterInfo {
  wx: number;
  wy: number;
  nx: number;
  ny: number;
  s: number;
  edgeDist: number;
  side: WallSide;
}

interface LizardLimb {
  // 0: FL, 1: FR, 2: BL, 3: BR
  isFront: boolean;
  side: -1 | 1; // -1 = left of heading, +1 = right of heading
  footX: number;
  footY: number;
  stepStartX: number;
  stepStartY: number;
  stepTargetX: number;
  stepTargetY: number;
  stepProgress: number; // 0..1 when stepping, 1 when planted
  isStepping: boolean;
  isWallStep: boolean;
  bracedWall: WallSide | null;
  flash: number; // 0..1 visual foot latch / push flash
}

interface WallPulse {
  x: number;
  y: number;
  nx: number;
  ny: number;
  life: number;
  maxLife: number;
  isAquatic?: boolean;
}

interface WallTrailNode {
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

interface WallGripTick {
  x: number;
  y: number;
  nx: number;
  ny: number;
  life: number;
  maxLife: number;
}

interface VisualParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  kind: 'spark' | 'dust' | 'bubble' | 'ripple';
  color: string;
}

interface HitBurstShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

interface HitBurst {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  shards: HitBurstShard[];
}

interface EnemyHunterVisual {
  heading: number;
  phase: number;
  lastX: number;
  lastY: number;
  threatLevel: number; // 0..1 based on proximity to player
  snapPhase: number; // 0..1 mandible/jaw snap impulse
  snapCooldown: number;
  segments: Vec2[];
}

interface ChaserWisp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  enemyIndex: number;
  trail: Vec2[];
}

// Lizard rig constants
const LIZARD_SPINE_LENGTHS = [4.2, 4.4, 4.4, 4.1, 4.4, 4.2, 3.8, 3.3]; // 9 vertices
const LIZARD_SPINE_RADII = [3.1, 2.5, 3.2, 2.7, 2.5, 1.9, 1.35, 0.9, 0.45];

// Goldfish rig constants (7 body vertices + 2 trailing split veil tail tips)
const FISH_SPINE_LENGTHS = [3.4, 3.5, 3.5, 3.3, 3.1, 2.9]; // 7 vertices: 0=snout/head .. 6=peduncle
const FISH_SPINE_RADII = [3.3, 4.35, 4.1, 3.2, 2.25, 1.4, 0.85];

const FRONT_L1 = 5.4;
const FRONT_L2 = 5.6;
const REAR_L1 = 5.8;
const REAR_L2 = 6.0;

const HUNTER_SEG_LENGTHS = [4.2, 3.8, 3.4]; // 4 vertices per enemy hunter
const MAX_PARTICLES = 90;
const MAX_HIT_BURSTS = 6;
const WALL_MARGIN = 1.5;
const CORNER_BLEND_RADIUS = 26;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function wrapAngle(a: number): number {
  let res = a;
  while (res > Math.PI) res -= Math.PI * 2;
  while (res < -Math.PI) res += Math.PI * 2;
  return res;
}

function lerpAngle(from: number, to: number, t: number): number {
  return wrapAngle(from + wrapAngle(to - from) * t);
}

function projectToPerimeter(
  px: number,
  py: number,
  simWidth: number,
  simHeight: number
): PerimeterInfo {
  const x0 = WALL_MARGIN;
  const x1 = simWidth - WALL_MARGIN;
  const y0 = WALL_MARGIN;
  const y1 = simHeight - WALL_MARGIN;
  const w = x1 - x0;
  const h = y1 - y0;

  const dLeft = Math.max(0, px - x0);
  const dRight = Math.max(0, x1 - px);
  const dTop = Math.max(0, py - y0);
  const dBot = Math.max(0, y1 - py);

  const edgeDist = Math.min(dLeft, dRight, dTop, dBot);

  let wx = clamp(px, x0, x1);
  let wy = clamp(py, y0, y1);
  let side: WallSide = 'left';
  let s = 0;

  if (edgeDist === dTop) {
    side = 'top';
    wy = y0;
    s = wx - x0;
  } else if (edgeDist === dRight) {
    side = 'right';
    wx = x1;
    s = w + (wy - y0);
  } else if (edgeDist === dBot) {
    side = 'bottom';
    wy = y1;
    s = w + h + (x1 - wx);
  } else {
    side = 'left';
    wx = x0;
    s = 2 * w + h + (y1 - wy);
  }

  const innerMinX = x0 + CORNER_BLEND_RADIUS;
  const innerMaxX = x1 - CORNER_BLEND_RADIUS;
  const innerMinY = y0 + CORNER_BLEND_RADIUS;
  const innerMaxY = y1 - CORNER_BLEND_RADIUS;
  const cx = clamp(px, innerMinX, innerMaxX);
  const cy = clamp(py, innerMinY, innerMaxY);
  const inX = cx - px;
  const inY = cy - py;
  const inMag = Math.hypot(inX, inY);

  let nx = 0;
  let ny = 0;
  if (inMag > 1e-4) {
    nx = inX / inMag;
    ny = inY / inMag;
  } else {
    nx = side === 'left' ? 1 : side === 'right' ? -1 : 0;
    ny = side === 'top' ? 1 : side === 'bottom' ? -1 : 0;
  }

  return { wx, wy, nx, ny, s, edgeDist, side };
}

function pointAtPerimeterS(
  sRaw: number,
  simWidth: number,
  simHeight: number
): { x: number; y: number; nx: number; ny: number; side: WallSide } {
  const x0 = WALL_MARGIN;
  const x1 = simWidth - WALL_MARGIN;
  const y0 = WALL_MARGIN;
  const y1 = simHeight - WALL_MARGIN;
  const w = x1 - x0;
  const h = y1 - y0;
  const perim = 2 * (w + h);

  let s = sRaw % perim;
  if (s < 0) s += perim;

  if (s < w) {
    return { x: x0 + s, y: y0, nx: 0, ny: 1, side: 'top' };
  }
  s -= w;
  if (s < h) {
    return { x: x1, y: y0 + s, nx: -1, ny: 0, side: 'right' };
  }
  s -= h;
  if (s < w) {
    return { x: x1 - s, y: y1, nx: 0, ny: -1, side: 'bottom' };
  }
  s -= w;
  return { x: x0, y: y1 - s, nx: 1, ny: 0, side: 'left' };
}

function solve2BoneIK(
  rootX: number,
  rootY: number,
  targetX: number,
  targetY: number,
  l1: number,
  l2: number,
  bendSign: number
): { jointX: number; jointY: number; endX: number; endY: number } {
  const dx = targetX - rootX;
  const dy = targetY - rootY;
  const rawDist = Math.hypot(dx, dy);
  const maxReach = (l1 + l2) * 0.985;
  const minReach = Math.max(0.5, Math.abs(l1 - l2) + 0.35);
  const dist = clamp(rawDist, minReach, maxReach);

  const dirAngle = rawDist > 1e-4 ? Math.atan2(dy, dx) : 0;
  const cosAngle = clamp(
    (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist),
    -1,
    1
  );
  const offsetAngle = Math.acos(cosAngle);
  const shoulderAngle = dirAngle + bendSign * offsetAngle;

  const jointX = rootX + Math.cos(shoulderAngle) * l1;
  const jointY = rootY + Math.sin(shoulderAngle) * l1;
  const endX = rootX + Math.cos(dirAngle) * dist;
  const endY = rootY + Math.sin(dirAngle) * dist;

  return { jointX, jointY, endX, endY };
}

export class ProceduralVisuals {
  private lastEpisodeId = -1;
  private activeVisualMode: Exclude<VisualMode, 'classic'> = 'lizard';
  private activePalette: 'default' | 'cyan' | 'amber' | 'split' = 'default';
  private activeSplitColors: string[] = ['#22d3ee', '#f59e0b'];
  private initialized = false;

  // Shared creature kinematics state
  private heading = 0;
  private angularVel = 0;
  private prevSpeedRatio = 0;
  private squashStretch = 1.0;
  private gaitPhase = 0;
  private tongueCooldown = 48;
  private tongueTimer = 0;
  private spine: Vec2[] = [];
  private limbs: LizardLimb[] = [];

  // Goldfish veil tail & pectoral fin secondary motion
  private fishTailUpper: Vec2[] = []; // 3 nodes trailing peduncle
  private fishTailLower: Vec2[] = []; // 3 nodes trailing peduncle
  private fishFinPaddle = 0;
  private fishBubbleCooldown = 22;
  private fishGlassSquash = 0;

  // Wall-riding & reaction visual state (strictly visual, zero physics feedback)
  private braceAmount = 0;
  private wallRideBlend = 0;
  private wallCwSign: 1 | -1 = 1;
  private prevWallNormalAngle = 0;
  private hasPrevWallNormal = false;
  private cornerWhip = 0;
  private bracedWall: WallSide | null = null;
  private prevWallInwardVel = 0;
  private springTimer = 0;
  private springDirX = 0;
  private springDirY = 0;
  private visualOffsetX = 0;
  private visualOffsetY = 0;
  private wallPulses: WallPulse[] = [];
  private wallTrails: WallTrailNode[] = [];
  private wallGripTicks: WallGripTick[] = [];

  // Ambient & impact FX pools (hit bursts survive episode transitions cleanly)
  private particles: VisualParticle[] = [];
  private hitBursts: HitBurst[] = [];

  // Enemy hunter & non-colliding wisp state
  private enemyHunters: Map<number, EnemyHunterVisual> = new Map();
  private wisps: ChaserWisp[] = [];
  private lastStamina = 1;
  private lastSprinting = false;

  // Procedural audio cue queue & continuous motion telemetry
  private audioCues: CreatureAudioCue[] = [];
  private lastSimWidth = 600;
  private lastAudioTelemetry: CreatureAudioTelemetry = {
    visualMode: 'lizard',
    speedRatio: 0,
    turnRate: 0,
    isWallRiding: false,
    pan: 0,
  };

  private computePan(x: number, simWidth = this.lastSimWidth): number {
    const w = simWidth > 0 ? simWidth : 600;
    return clamp(((x / w) * 2 - 1) * 0.35, -0.35, 0.35);
  }

  private pushAudioCue(
    kind: CreatureAudioCueKind,
    visualMode: Exclude<VisualMode, 'classic'>,
    intensity: number,
    x: number,
    isFront?: boolean
  ): void {
    if (this.audioCues.length >= 16) {
      this.audioCues.shift();
    }
    this.audioCues.push({
      kind,
      visualMode,
      intensity: clamp(intensity, 0.1, 1),
      pan: this.computePan(x),
      isFront,
    });
  }

  consumeAudioFrame(): {
    cues: CreatureAudioCue[];
    telemetry: CreatureAudioTelemetry;
  } {
    const cues = this.audioCues;
    this.audioCues = [];
    return {
      cues,
      telemetry: { ...this.lastAudioTelemetry },
    };
  }

  clearAllEffects(): void {
    this.wallPulses = [];
    this.wallTrails = [];
    this.wallGripTicks = [];
    this.particles = [];
    this.hitBursts = [];
    this.audioCues = [];
  }

  triggerHitBurst(x: number, y: number): void {
    const shards: HitBurstShard[] = [];
    const count = 16;
    const palette =
      this.activeVisualMode === 'goldfish'
        ? ['#ffffff', '#ff2233', '#fb923c', '#7dd3fc']
        : ['#ffffff', '#ff2233', '#00ffff', '#fb923c'];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.28;
      const spd = 1.8 + Math.random() * 3.4;
      shards.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 1.4 + Math.random() * 1.8,
        color: palette[i % palette.length],
      });
    }
    this.hitBursts.push({
      x,
      y,
      life: 22,
      maxLife: 22,
      shards,
    });
    if (this.hitBursts.length > MAX_HIT_BURSTS) {
      this.hitBursts.shift();
    }
    this.pushAudioCue('hit', this.activeVisualMode, 0.9, x);
  }

  private emitSpark(x: number, y: number, vx: number, vy: number, color = '#67e8f9'): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }
    this.particles.push({
      x,
      y,
      vx,
      vy,
      radius: 1.05 + Math.random() * 0.85,
      life: 11 + Math.floor(Math.random() * 6),
      maxLife: 16,
      kind: 'spark',
      color,
    });
  }

  private emitBubble(x: number, y: number, vx: number, vy: number, radius = 1.6): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }
    const life = 22 + Math.floor(Math.random() * 14);
    this.particles.push({
      x,
      y,
      vx,
      vy,
      radius: radius + Math.random() * 1.1,
      life,
      maxLife: life,
      kind: 'bubble',
      color: '#bae6fd',
    });
  }

  private emitRipple(x: number, y: number, startRadius = 3.5, color = '#7dd3fc'): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }
    const life = 20;
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: startRadius,
      life,
      maxLife: life,
      kind: 'ripple',
      color,
    });
  }

  private emitWallDust(x: number, y: number, nx: number, ny: number, count = 3): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }
      const spread = (Math.random() - 0.5) * 1.3;
      const tx = -ny;
      const ty = nx;
      const spd = 0.45 + Math.random() * 0.9;
      const life = 14 + Math.floor(Math.random() * 7);
      this.particles.push({
        x: x + tx * (Math.random() - 0.5) * 4,
        y: y + ty * (Math.random() - 0.5) * 4,
        vx: nx * spd + tx * spread * 0.7,
        vy: ny * spd + ty * spread * 0.7,
        radius: 1.8 + Math.random() * 1.4,
        life,
        maxLife: life,
        kind: 'dust',
        color: i === 0 ? '#a5f3fc' : '#94a3b8',
      });
    }
  }

  private stampWallGrip(x: number, y: number, nx: number, ny: number): void {
    this.wallGripTicks.push({
      x,
      y,
      nx,
      ny,
      life: 18,
      maxLife: 18,
    });
    if (this.wallGripTicks.length > 24) {
      this.wallGripTicks.shift();
    }
  }

  reset(ctx: VisualStepContext): void {
    this.lastEpisodeId = ctx.episodeId;
    this.activeVisualMode = ctx.visualMode;
    this.initialized = true;

    const speed = Math.hypot(ctx.player.vx, ctx.player.vy);
    this.heading = speed > 0.05 ? Math.atan2(ctx.player.vy, ctx.player.vx) : 0;
    this.angularVel = 0;
    this.prevSpeedRatio = ctx.playerSpeed > 0 ? clamp(speed / ctx.playerSpeed, 0, 1) : 0;
    this.squashStretch = 1.0;
    this.gaitPhase = 0;
    this.tongueCooldown = 36 + Math.floor(Math.random() * 36);
    this.tongueTimer = 0;
    this.fishFinPaddle = 0;
    this.fishBubbleCooldown = 18;
    this.fishGlassSquash = 0;
    this.braceAmount = 0;
    this.wallRideBlend = 0;
    this.wallCwSign = 1;
    this.hasPrevWallNormal = false;
    this.cornerWhip = 0;
    this.bracedWall = null;
    this.prevWallInwardVel = 0;
    this.springTimer = 0;
    this.springDirX = 0;
    this.springDirY = 0;
    this.visualOffsetX = 0;
    this.visualOffsetY = 0;
    this.wallPulses = [];
    this.wallTrails = [];
    this.wallGripTicks = [];

    const segLengths =
      ctx.visualMode === 'goldfish' ? FISH_SPINE_LENGTHS : LIZARD_SPINE_LENGTHS;
    this.spine = [{ x: ctx.player.x, y: ctx.player.y }];
    let cx = ctx.player.x;
    let cy = ctx.player.y;
    const backX = -Math.cos(this.heading);
    const backY = -Math.sin(this.heading);
    for (let i = 0; i < segLengths.length; i++) {
      cx += backX * segLengths[i];
      cy += backY * segLengths[i];
      this.spine.push({ x: cx, y: cy });
    }

    // Initialize Goldfish veil tail tips
    const ped = this.spine[this.spine.length - 1];
    this.fishTailUpper = [];
    this.fishTailLower = [];
    for (let k = 1; k <= 3; k++) {
      this.fishTailUpper.push({
        x: ped.x + backX * k * 3.1 - backY * k * 0.9,
        y: ped.y + backY * k * 3.1 + backX * k * 0.9,
      });
      this.fishTailLower.push({
        x: ped.x + backX * k * 3.1 + backY * k * 0.9,
        y: ped.y + backY * k * 3.1 - backX * k * 0.9,
      });
    }

    // Initialize 4 IK limbs (used in lizard mode)
    this.limbs = [
      this.createLimb(true, -1),
      this.createLimb(true, 1),
      this.createLimb(false, -1),
      this.createLimb(false, 1),
    ];
    for (const limb of this.limbs) {
      const ideal = this.computeIdealFootTarget(limb, 0, 1, 0);
      limb.footX = ideal.x;
      limb.footY = ideal.y;
      limb.stepStartX = ideal.x;
      limb.stepStartY = ideal.y;
      limb.stepTargetX = ideal.x;
      limb.stepTargetY = ideal.y;
      limb.stepProgress = 1;
      limb.isStepping = false;
      limb.isWallStep = false;
      limb.bracedWall = null;
      limb.flash = 0;
    }

    this.enemyHunters.clear();
    this.wisps = [];
  }

  private createLimb(isFront: boolean, side: -1 | 1): LizardLimb {
    return {
      isFront,
      side,
      footX: 0,
      footY: 0,
      stepStartX: 0,
      stepStartY: 0,
      stepTargetX: 0,
      stepTargetY: 0,
      stepProgress: 1,
      isStepping: false,
      isWallStep: false,
      bracedWall: null,
      flash: 0,
    };
  }

  private getAnchorNodeIndex(limb: LizardLimb): number {
    return limb.isFront ? 2 : 4;
  }

  private computeIdealFootTarget(
    limb: LizardLimb,
    speedRatio: number,
    vxDir: number,
    vyDir: number
  ): Vec2 {
    const nodeIdx = this.getAnchorNodeIndex(limb);
    const anchor = this.spine[nodeIdx] ?? this.spine[0];
    const prev = this.spine[Math.max(0, nodeIdx - 1)] ?? anchor;
    let fx = prev.x - anchor.x;
    let fy = prev.y - anchor.y;
    const fLen = Math.hypot(fx, fy);
    if (fLen > 1e-4) {
      fx /= fLen;
      fy /= fLen;
    } else {
      fx = Math.cos(this.heading);
      fy = Math.sin(this.heading);
    }
    const rx = -fy;
    const ry = fx;

    const lateralOffset = limb.isFront ? 8.2 : 8.6;
    const forwardBias = limb.isFront ? 2.8 : -1.2;
    const strideReach = speedRatio * 4.4;

    return {
      x:
        anchor.x +
        rx * limb.side * lateralOffset +
        fx * forwardBias +
        vxDir * strideReach,
      y:
        anchor.y +
        ry * limb.side * lateralOffset +
        fy * forwardBias +
        vyDir * strideReach,
    };
  }

  step(ctx: VisualStepContext): void {
    this.lastSimWidth = ctx.simWidth || 600;
    this.lastStamina = typeof ctx.stamina === 'number' ? clamp(ctx.stamina, 0, 1) : 1;
    this.lastSprinting = Boolean(ctx.isSprinting);
    this.activePalette = ctx.palette ?? 'default';
    if (ctx.splitPaletteColors && ctx.splitPaletteColors.length >= 2) {
      this.activeSplitColors = ctx.splitPaletteColors;
    } else if (this.activePalette === 'split') {
      this.activeSplitColors = ['#22d3ee', '#f59e0b'];
    }
    if (
      !this.initialized ||
      ctx.episodeId !== this.lastEpisodeId ||
      ctx.visualMode !== this.activeVisualMode
    ) {
      this.reset(ctx);
    }

    if (ctx.visualMode === 'goldfish') {
      this.stepGoldfish(ctx);
    } else {
      this.stepLizard(ctx);
    }

    this.stepParticlesAndBursts();
    if (!ctx.skipEnemies) {
      this.stepEnemiesAndWisps(ctx);
    }
  }

  private stepGoldfish(ctx: VisualStepContext): void {
    const { player, playerSpeed, simWidth, simHeight } = ctx;
    const speed = Math.hypot(player.vx, player.vy);
    const speedRatio = playerSpeed > 0 ? clamp(speed / playerSpeed, 0, 1.15) : 0;
    const accelRatio = speedRatio - this.prevSpeedRatio;
    this.prevSpeedRatio = speedRatio;

    const perim = projectToPerimeter(player.x, player.y, simWidth, simHeight);
    const wallReach = 26;
    const wallProx = clamp(1 - perim.edgeDist / wallReach, 0, 1);
    const inwardVel =
      playerSpeed > 0 ? (player.vx * perim.nx + player.vy * perim.ny) / playerSpeed : 0;
    const cwX = perim.ny;
    const cwY = -perim.nx;
    const rawCwVel = playerSpeed > 0 ? (player.vx * cwX + player.vy * cwY) / playerSpeed : 0;

    if (Math.abs(rawCwVel) > 0.08) {
      this.wallCwSign = rawCwVel >= 0 ? 1 : -1;
    } else if (wallProx > 0.1) {
      const hCw = Math.cos(this.heading) * cwX + Math.sin(this.heading) * cwY;
      this.wallCwSign = hCw >= 0 ? 1 : -1;
    }

    // Smooth heading along swim velocity vector (or explicit polar heading)
    const prevHeading = this.heading;
    if (typeof ctx.headingOverride === 'number' && Number.isFinite(ctx.headingOverride)) {
      this.heading = lerpAngle(this.heading, ctx.headingOverride, 0.48);
    } else if (speed > 0.08) {
      const velHeading = Math.atan2(player.vy, player.vx);
      const turnRate = clamp(0.22 + speedRatio * 0.2, 0.18, 0.42);
      this.heading = lerpAngle(this.heading, velHeading, turnRate);
    }
    const dHeading = wrapAngle(this.heading - prevHeading);
    this.angularVel = this.angularVel * 0.72 + dHeading * 0.28;

    // Carangiform swimming cadence & gentle hover fin paddle
    this.gaitPhase += 0.12 + speedRatio * 0.4 + Math.max(0, accelRatio) * 0.65;
    this.fishFinPaddle += 0.16 + (1 - speedRatio) * 0.08;

    // Subtle body stretch on sudden dart thrust, squash when brushing aquarium glass
    const targetGlassSquash =
      perim.edgeDist < 18 && inwardVel < 0.15
        ? wallProx * clamp(-inwardVel * 0.8 + 0.35, 0, 1)
        : 0;
    this.fishGlassSquash = this.fishGlassSquash * 0.72 + targetGlassSquash * 0.28;

    const targetSquash = clamp(
      1 + accelRatio * 0.38 + speedRatio * 0.05 - this.fishGlassSquash * 0.14,
      0.84,
      1.18
    );
    this.squashStretch = this.squashStretch * 0.68 + targetSquash * 0.32;

    // Glass wall approach ripple & tail-kick thrust when swimming away from wall
    if (
      this.braceAmount > 0.25 &&
      (inwardVel > 0.32 || (inwardVel - this.prevWallInwardVel > 0.4 && inwardVel > 0.1))
    ) {
      this.springTimer = 1.0;
      const vxN = speed > 0.05 ? player.vx / speed : perim.nx;
      const vyN = speed > 0.05 ? player.vy / speed : perim.ny;
      const sx = perim.nx * 0.6 + vxN * 0.6;
      const sy = perim.ny * 0.6 + vyN * 0.6;
      const sMag = Math.hypot(sx, sy) || 1;
      this.springDirX = sx / sMag;
      this.springDirY = sy / sMag;

      this.wallPulses.push({
        x: perim.wx,
        y: perim.wy,
        nx: perim.nx,
        ny: perim.ny,
        life: 20,
        maxLife: 20,
        isAquatic: true,
      });
      if (this.wallPulses.length > 8) this.wallPulses.shift();

      this.emitRipple(perim.wx + perim.nx * 4, perim.wy + perim.ny * 4, 3.5, '#7dd3fc');
      for (let b = 0; b < 4; b++) {
        this.emitBubble(
          perim.wx + perim.nx * (4 + Math.random() * 5),
          perim.wy + perim.ny * (4 + Math.random() * 5),
          perim.nx * (0.4 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.8,
          perim.ny * (0.4 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.8,
          1.2
        );
      }
      this.pushAudioCue('spring', 'goldfish', 0.78, perim.wx);
      this.pushAudioCue('bubble', 'goldfish', 0.55, perim.wx);
      this.braceAmount = 0;
    } else {
      const prevBrace = this.braceAmount;
      this.braceAmount = this.braceAmount * 0.74 + targetGlassSquash * 0.26;
      if (prevBrace <= 0.25 && this.braceAmount > 0.25) {
        this.emitRipple(perim.wx + perim.nx * 3, perim.wy + perim.ny * 3, 2.5, '#bae6fd');
        this.emitBubble(
          perim.wx + perim.nx * 4,
          perim.wy + perim.ny * 4,
          perim.nx * 0.5 + (Math.random() - 0.5) * 0.5,
          perim.ny * 0.5 - 0.35,
          1.3
        );
        this.pushAudioCue(
          'glassBrush',
          'goldfish',
          clamp(0.35 + wallProx * 0.5, 0.3, 0.85),
          perim.wx
        );
        this.pushAudioCue('bubble', 'goldfish', 0.35, perim.wx);
      }
    }
    this.prevWallInwardVel = inwardVel;

    if (this.springTimer > 0) {
      this.springTimer = Math.max(0, this.springTimer - 0.08);
    }
    const kickCurve = Math.sin(this.springTimer * Math.PI);
    const targetOffsetX =
      this.springDirX * kickCurve * 2.8 - perim.nx * this.fishGlassSquash * 1.4;
    const targetOffsetY =
      this.springDirY * kickCurve * 2.8 - perim.ny * this.fishGlassSquash * 1.4;
    this.visualOffsetX = this.visualOffsetX * 0.62 + targetOffsetX * 0.38;
    this.visualOffsetY = this.visualOffsetY * 0.62 + targetOffsetY * 0.38;

    for (let i = this.wallPulses.length - 1; i >= 0; i--) {
      this.wallPulses[i].life -= 1;
      if (this.wallPulses[i].life <= 0) this.wallPulses.splice(i, 1);
    }

    // Continuous subtle water glide ribbon along tank glass
    const rideGlass = wallProx > 0.25 ? wallProx : 0;
    this.wallRideBlend = this.wallRideBlend * 0.74 + rideGlass * 0.26;
    if (this.wallRideBlend > 0.35 && Math.abs(rawCwVel) > 0.25) {
      const lastTrail = this.wallTrails[this.wallTrails.length - 1];
      if (!lastTrail || Math.hypot(perim.wx - lastTrail.x, perim.wy - lastTrail.y) >= 4.5) {
        this.wallTrails.push({ x: perim.wx, y: perim.wy, life: 24, maxLife: 24 });
        if (this.wallTrails.length > 24) this.wallTrails.shift();
      }
    }
    for (let i = this.wallTrails.length - 1; i >= 0; i--) {
      this.wallTrails[i].life -= 1;
      if (this.wallTrails[i].life <= 0) this.wallTrails.splice(i, 1);
    }

    // Solve 7-node swimming spine with travelling S-wave
    const headX = clamp(player.x + this.visualOffsetX, 4, simWidth - 4);
    const headY = clamp(player.y + this.visualOffsetY, 4, simHeight - 4);
    this.spine[0].x = headX;
    this.spine[0].y = headY;

    const fwdX = Math.cos(this.heading);
    const fwdY = Math.sin(this.heading);
    const rightX = -fwdY;
    const rightY = fwdX;
    const stretchMult = (1 + kickCurve * 0.12) * this.squashStretch;

    for (let i = 1; i < this.spine.length; i++) {
      const prev = this.spine[i - 1];
      const curr = this.spine[i];
      const segLen = FISH_SPINE_LENGTHS[i - 1] * stretchMult;

      const t = i / (this.spine.length - 1);
      const waveAmp = (0.25 + t * t * 1.35) * (0.25 + speedRatio * 0.85);
      const sway =
        Math.sin(this.gaitPhase - i * 0.82) * waveAmp -
        this.angularVel * (1.8 + t * 5.2);

      let dx = curr.x - prev.x - fwdX * (0.35 + speedRatio * 0.55);
      let dy = curr.y - prev.y - fwdY * (0.35 + speedRatio * 0.55);
      dx += rightX * sway * 0.48;
      dy += rightY * sway * 0.48;

      if (this.wallRideBlend > 0.2 && i >= 3) {
        // Tail curls gracefully inward away from tank glass
        const curl = (i - 2) * 0.24 * this.wallRideBlend;
        dx += perim.nx * curl;
        dy += perim.ny * curl;
      }

      const d = Math.hypot(dx, dy);
      curr.x = clamp(
        d > 1e-4 ? prev.x + (dx / d) * segLen : prev.x - fwdX * segLen,
        2.5,
        simWidth - 2.5
      );
      curr.y = clamp(
        d > 1e-4 ? prev.y + (dy / d) * segLen : prev.y - fwdY * segLen,
        2.5,
        simHeight - 2.5
      );
    }

    // Solve flowing upper & lower split veil tail lobes trailing behind peduncle
    const ped = this.spine[this.spine.length - 1];
    const prePed = this.spine[this.spine.length - 2];
    const pedDx = ped.x - prePed.x;
    const pedDy = ped.y - prePed.y;
    const pedLen = Math.hypot(pedDx, pedDy) || 1;
    const pedBackX = pedDx / pedLen;
    const pedBackY = pedDy / pedLen;
    const pedSideX = -pedBackY;
    const pedSideY = pedBackX;

    const updateVeilLobe = (lobe: Vec2[], spreadSign: number) => {
      let anchorX = ped.x;
      let anchorY = ped.y;
      for (let k = 0; k < lobe.length; k++) {
        const node = lobe[k];
        const segLen = 3.1 + k * 0.35;
        const flutter =
          Math.sin(this.gaitPhase - (6 + k) * 0.88 + spreadSign * 0.4) *
          (0.65 + speedRatio * 0.75);
        const spread = (1.1 + k * 0.95) * spreadSign * (1.15 - speedRatio * 0.35);
        const desiredX =
          anchorX + pedBackX * segLen + pedSideX * (spread + flutter);
        const desiredY =
          anchorY + pedBackY * segLen + pedSideY * (spread + flutter);
        // Spring follow for silky water lag
        const lag = 0.42 - k * 0.08;
        node.x = node.x * (1 - lag) + desiredX * lag;
        node.y = node.y * (1 - lag) + desiredY * lag;

        const ddx = node.x - anchorX;
        const ddy = node.y - anchorY;
        const dd = Math.hypot(ddx, ddy) || 1;
        node.x = clamp(anchorX + (ddx / dd) * segLen, 2, simWidth - 2);
        node.y = clamp(anchorY + (ddy / dd) * segLen, 2, simHeight - 2);
        anchorX = node.x;
        anchorY = node.y;
      }
    };
    updateVeilLobe(this.fishTailUpper, 1);
    updateVeilLobe(this.fishTailLower, -1);

    // Emit ambient micro-bubbles & dart-thrust bubble bursts
    this.fishBubbleCooldown -= 0.7 + speedRatio * 1.1;
    if (this.fishBubbleCooldown <= 0) {
      this.fishBubbleCooldown = 16 + Math.floor(Math.random() * 20);
      this.emitBubble(
        headX + fwdX * 3.5 + (Math.random() - 0.5) * 3,
        headY + fwdY * 3.5 + (Math.random() - 0.5) * 3,
        -player.vx * 0.18 + (Math.random() - 0.5) * 0.4,
        -player.vy * 0.18 - 0.35 - Math.random() * 0.35,
        1.15
      );
      this.pushAudioCue('bubble', 'goldfish', 0.3 + speedRatio * 0.25, headX);
    }
    if (
      (accelRatio > 0.18 && speedRatio > 0.5) ||
      (Math.abs(dHeading) > 0.28 && speedRatio > 0.55)
    ) {
      this.emitBubble(
        ped.x + (Math.random() - 0.5) * 4,
        ped.y + (Math.random() - 0.5) * 4,
        -player.vx * 0.25 + (Math.random() - 0.5) * 0.9,
        -player.vy * 0.25 + (Math.random() - 0.5) * 0.9,
        1.4
      );
      this.pushAudioCue('bubble', 'goldfish', 0.52, ped.x);
      if (accelRatio > 0.26) {
        this.emitRipple(ped.x, ped.y, 2.5, 'rgba(186, 230, 253, 0.75)');
      }
    }

    this.lastAudioTelemetry = {
      visualMode: 'goldfish',
      speedRatio: clamp(speedRatio, 0, 1),
      turnRate: clamp(Math.abs(this.angularVel) * 4.2, 0, 1),
      isWallRiding: this.wallRideBlend > 0.3,
      pan: this.computePan(headX, simWidth),
    };
  }

  private stepLizard(ctx: VisualStepContext): void {
    const { player, playerSpeed, simWidth, simHeight } = ctx;
    const speed = Math.hypot(player.vx, player.vy);
    const speedRatio = playerSpeed > 0 ? clamp(speed / playerSpeed, 0, 1.15) : 0;
    const accelRatio = speedRatio - this.prevSpeedRatio;
    this.prevSpeedRatio = speedRatio;

    // 1. Continuous rounded-corner wall projection around arena perimeter
    const perim = projectToPerimeter(player.x, player.y, simWidth, simHeight);
    const wallReach = 27;
    const wallProx = clamp(1 - perim.edgeDist / wallReach, 0, 1);

    const inwardVel =
      playerSpeed > 0 ? (player.vx * perim.nx + player.vy * perim.ny) / playerSpeed : 0;
    const cwX = perim.ny;
    const cwY = -perim.nx;
    const rawCwVel = playerSpeed > 0 ? (player.vx * cwX + player.vy * cwY) / playerSpeed : 0;

    if (Math.abs(rawCwVel) > 0.08) {
      this.wallCwSign = rawCwVel >= 0 ? 1 : -1;
    } else if (wallProx > 0.1) {
      const hCw = Math.cos(this.heading) * cwX + Math.sin(this.heading) * cwY;
      this.wallCwSign = hCw >= 0 ? 1 : -1;
    }
    const tangX = cwX * this.wallCwSign;
    const tangY = cwY * this.wallCwSign;
    const tangSpeedRatio = clamp(Math.abs(rawCwVel), 0, 1.1);

    const nearWallRiding = wallProx > 0.14 && (inwardVel < 0.32 || perim.edgeDist < 10);
    const targetWallRide = nearWallRiding ? clamp(wallProx * 1.15, 0, 1) : 0;
    this.wallRideBlend = this.wallRideBlend * 0.72 + targetWallRide * 0.28;

    let targetBrace = 0;
    let activeWall: WallSide | null = null;
    if (perim.edgeDist < wallReach) {
      const pressingIn = clamp(-inwardVel * 0.9 + 0.45, 0, 1);
      if (perim.edgeDist < 10 || inwardVel < 0.25) {
        targetBrace = wallProx * Math.max(perim.edgeDist < 8 ? 0.95 : 0.25, pressingIn);
        activeWall = perim.side;
      }
    }

    if (
      this.braceAmount > 0.28 &&
      this.bracedWall &&
      (inwardVel > 0.35 || (inwardVel - this.prevWallInwardVel > 0.42 && inwardVel > 0.1))
    ) {
      this.springTimer = 1.0;
      const vxN = speed > 0.05 ? player.vx / speed : perim.nx;
      const vyN = speed > 0.05 ? player.vy / speed : perim.ny;
      const sx = perim.nx * 0.72 + vxN * 0.52;
      const sy = perim.ny * 0.72 + vyN * 0.52;
      const sMag = Math.hypot(sx, sy) || 1;
      this.springDirX = sx / sMag;
      this.springDirY = sy / sMag;

      this.wallPulses.push({
        x: perim.wx,
        y: perim.wy,
        nx: perim.nx,
        ny: perim.ny,
        life: 20,
        maxLife: 20,
      });
      if (this.wallPulses.length > 8) {
        this.wallPulses.shift();
      }

      this.emitWallDust(perim.wx, perim.wy, perim.nx, perim.ny, 4);
      for (const limb of this.limbs) {
        if (limb.bracedWall) {
          limb.flash = 1.0;
        }
      }
      this.pushAudioCue(
        'spring',
        'lizard',
        clamp(0.48 + speedRatio * 0.45, 0.45, 0.95),
        perim.wx
      );

      targetBrace = 0;
      activeWall = null;
      this.wallRideBlend *= 0.35;
    }

    this.prevWallInwardVel = inwardVel;
    this.braceAmount = this.braceAmount * 0.74 + targetBrace * 0.26;
    if (activeWall && this.braceAmount > 0.12) {
      this.bracedWall = activeWall;
    } else if (this.braceAmount <= 0.12) {
      this.bracedWall = null;
    }

    const wallNormalAngle = Math.atan2(perim.ny, perim.nx);
    if (this.wallRideBlend > 0.35 && this.hasPrevWallNormal) {
      const dNorm = Math.abs(wrapAngle(wallNormalAngle - this.prevWallNormalAngle));
      if (dNorm > 0.055 && tangSpeedRatio > 0.32) {
        this.cornerWhip = Math.min(1, this.cornerWhip + dNorm * 2.4);
        if (dNorm > 0.11) {
          this.emitWallDust(perim.wx, perim.wy, perim.nx, perim.ny, 2);
        }
      }
    }
    this.prevWallNormalAngle = wallNormalAngle;
    this.hasPrevWallNormal = this.wallRideBlend > 0.15;
    this.cornerWhip = Math.max(0, this.cornerWhip - 0.08);

    // 2. Smooth heading + angular velocity + wall-tangent alignment + squash/stretch
    const prevHeading = this.heading;
    if (typeof ctx.headingOverride === 'number' && Number.isFinite(ctx.headingOverride)) {
      this.heading = lerpAngle(this.heading, ctx.headingOverride, 0.5);
    } else if (speed > 0.08) {
      const velHeading = Math.atan2(player.vy, player.vx);
      const wallTangHeading = Math.atan2(tangY, tangX);
      const blendTang = this.wallRideBlend * clamp(tangSpeedRatio * 0.55, 0, 0.4);
      const targetHeading = lerpAngle(velHeading, wallTangHeading, blendTang);
      const turnRate = clamp(0.24 + speedRatio * 0.22, 0.2, 0.45);
      this.heading = lerpAngle(this.heading, targetHeading, turnRate);
    }
    const dHeading = wrapAngle(this.heading - prevHeading);
    this.angularVel = this.angularVel * 0.68 + dHeading * 0.32;

    const targetSquash = clamp(
      1 + accelRatio * 0.45 + speedRatio * 0.07 - Math.min(0.12, Math.abs(dHeading) * 0.28),
      0.84,
      1.22
    );
    this.squashStretch = this.squashStretch * 0.65 + targetSquash * 0.35;

    this.gaitPhase += 0.14 + speedRatio * 0.36;

    if (this.tongueTimer > 0) {
      this.tongueTimer--;
    } else {
      this.tongueCooldown -= speedRatio < 0.2 ? 1.5 : 1;
      if (this.tongueCooldown <= 0) {
        this.tongueTimer = 18;
        this.tongueCooldown = 58 + Math.floor(Math.random() * 68);
      }
    }

    if (this.springTimer > 0) {
      this.springTimer = Math.max(0, this.springTimer - 0.075);
    }
    const leapCurve = Math.sin(this.springTimer * Math.PI);
    const hugPull = this.wallRideBlend * (1.2 + Math.max(0, -inwardVel) * 1.4);
    const targetOffsetX = this.springDirX * leapCurve * 3.5 - perim.nx * hugPull;
    const targetOffsetY = this.springDirY * leapCurve * 3.5 - perim.ny * hugPull;
    this.visualOffsetX = this.visualOffsetX * 0.6 + targetOffsetX * 0.4;
    this.visualOffsetY = this.visualOffsetY * 0.6 + targetOffsetY * 0.4;

    for (let i = this.wallPulses.length - 1; i >= 0; i--) {
      this.wallPulses[i].life -= 1;
      if (this.wallPulses[i].life <= 0) {
        this.wallPulses.splice(i, 1);
      }
    }

    if (this.wallRideBlend > 0.36 && tangSpeedRatio > 0.22) {
      const lastTrail = this.wallTrails[this.wallTrails.length - 1];
      if (!lastTrail || Math.hypot(perim.wx - lastTrail.x, perim.wy - lastTrail.y) >= 4.2) {
        this.wallTrails.push({
          x: perim.wx,
          y: perim.wy,
          life: 26,
          maxLife: 26,
        });
        if (this.wallTrails.length > 28) {
          this.wallTrails.shift();
        }
      }
    }
    for (let i = this.wallTrails.length - 1; i >= 0; i--) {
      this.wallTrails[i].life -= 1;
      if (this.wallTrails[i].life <= 0) {
        this.wallTrails.splice(i, 1);
      }
    }
    for (let i = this.wallGripTicks.length - 1; i >= 0; i--) {
      this.wallGripTicks[i].life -= 1;
      if (this.wallGripTicks[i].life <= 0) {
        this.wallGripTicks.splice(i, 1);
      }
    }

    // 3. Solve spine + tapered tail chain
    const headX = clamp(player.x + this.visualOffsetX, 3.5, simWidth - 3.5);
    const headY = clamp(player.y + this.visualOffsetY, 3.5, simHeight - 3.5);
    this.spine[0].x = headX;
    this.spine[0].y = headY;

    const stretchMult =
      (1 + leapCurve * 0.18 - this.braceAmount * 0.08) * this.squashStretch;
    const fwdX = Math.cos(this.heading);
    const fwdY = Math.sin(this.heading);
    const rightX = -fwdY;
    const rightY = fwdX;

    const rideHug = this.wallRideBlend;
    const hugTargetDist = 5.4;

    for (let i = 1; i < this.spine.length; i++) {
      const prev = this.spine[i - 1];
      const curr = this.spine[i];
      const segLen =
        LIZARD_SPINE_LENGTHS[i - 1] * (i <= 4 ? stretchMult : 1 + leapCurve * 0.1);

      const waveAmp =
        (i <= 4 ? 0.32 * (1 - rideHug * 0.45) : 0.65 + (i - 4) * 0.26) *
        (0.12 + speedRatio * 0.88);
      const sway =
        Math.sin(this.gaitPhase - i * 0.72) * waveAmp +
        -this.angularVel * (i <= 4 ? 2.4 : 4.6 + (i - 4) * 1.4);

      const backDirX = fwdX * (1 - rideHug * 0.55) + tangX * (rideHug * 0.55);
      const backDirY = fwdY * (1 - rideHug * 0.55) + tangY * (rideHug * 0.55);

      let dx = curr.x - prev.x - backDirX * (0.28 + speedRatio * 0.42);
      let dy = curr.y - prev.y - backDirY * (0.28 + speedRatio * 0.42);
      dx += rightX * sway * 0.45;
      dy += rightY * sway * 0.45;

      if (rideHug > 0.15) {
        if (i <= 4) {
          const nodePerim = projectToPerimeter(curr.x, curr.y, simWidth, simHeight);
          const distErr = hugTargetDist - nodePerim.edgeDist;
          dx += nodePerim.nx * distErr * rideHug * 0.28;
          dy += nodePerim.ny * distErr * rideHug * 0.28;
        } else {
          const tailIdx = i - 4;
          const sweepStrength = (0.45 + tailIdx * 0.28 + this.cornerWhip * 0.75) * rideHug;
          dx += perim.nx * sweepStrength;
          dy += perim.ny * sweepStrength;
        }
      }

      const d = Math.hypot(dx, dy);
      let nextX = d > 1e-4 ? prev.x + (dx / d) * segLen : prev.x - fwdX * segLen;
      let nextY = d > 1e-4 ? prev.y + (dy / d) * segLen : prev.y - fwdY * segLen;

      nextX = clamp(nextX, 2.2, simWidth - 2.2);
      nextY = clamp(nextY, 2.2, simHeight - 2.2);
      curr.x = nextX;
      curr.y = nextY;
    }

    if (
      (Math.abs(dHeading) > 0.21 && speedRatio > 0.52) ||
      (accelRatio < -0.22 && speedRatio < 0.65)
    ) {
      const hip = this.spine[4] ?? this.spine[0];
      const backVx = speed > 0.05 ? -player.vx * 0.32 : -fwdX * 1.1;
      const backVy = speed > 0.05 ? -player.vy * 0.32 : -fwdY * 1.1;
      const sparkCount = Math.abs(dHeading) > 0.4 ? 3 : 2;
      for (let s = 0; s < sparkCount; s++) {
        this.emitSpark(
          hip.x + (Math.random() - 0.5) * 5,
          hip.y + (Math.random() - 0.5) * 5,
          backVx + (Math.random() - 0.5) * 1.25,
          backVy + (Math.random() - 0.5) * 1.25,
          s === 0 ? '#ffffff' : '#67e8f9'
        );
      }
    }

    // 4. Update 4 stepping IK limbs
    const vxDir = speed > 0.05 ? player.vx / speed : fwdX;
    const vyDir = speed > 0.05 ? player.vy / speed : fwdY;
    const isWallRiding = this.wallRideBlend > 0.26;

    for (let i = 0; i < this.limbs.length; i++) {
      const limb = this.limbs[i];
      limb.flash = Math.max(0, limb.flash - 0.09);

      const anchorIdx = this.getAnchorNodeIndex(limb);
      const anchor = this.spine[anchorIdx];
      const anchorPerim = projectToPerimeter(anchor.x, anchor.y, simWidth, simHeight);

      const limbLatX = rightX * limb.side;
      const limbLatY = rightY * limb.side;
      const wallFacingDot = limbLatX * anchorPerim.nx + limbLatY * anchorPerim.ny;
      const isWallSideLimb =
        isWallRiding && wallFacingDot < -0.1 && anchorPerim.edgeDist < 24;

      const prevBraced = limb.bracedWall;
      let target: Vec2;
      let liftNormalX = fwdX;
      let liftNormalY = fwdY;

      if (isWallSideLimb) {
        limb.bracedWall = anchorPerim.side;
        const anchorCwSign =
          vxDir * anchorPerim.ny + vyDir * -anchorPerim.nx >= 0 ? 1 : -1;
        const crawlSign = tangSpeedRatio > 0.12 ? anchorCwSign : this.wallCwSign;
        const stepAhead = (limb.isFront ? 5.2 : -0.6) + tangSpeedRatio * 5.8;
        const nextPerim = pointAtPerimeterS(
          anchorPerim.s + crawlSign * stepAhead,
          simWidth,
          simHeight
        );
        target = { x: nextPerim.x, y: nextPerim.y };
        liftNormalX = anchorPerim.nx;
        liftNormalY = anchorPerim.ny;

        if (!prevBraced) {
          limb.flash = 0.9;
          this.emitWallDust(nextPerim.x, nextPerim.y, nextPerim.nx, nextPerim.ny, 2);
          this.pushAudioCue(
            'wallGrip',
            'lizard',
            clamp(0.4 + tangSpeedRatio * 0.5, 0.35, 0.92),
            nextPerim.x,
            limb.isFront
          );
        }
      } else {
        limb.bracedWall = null;
        const floorIdeal = this.computeIdealFootTarget(limb, speedRatio, vxDir, vyDir);
        if (isWallRiding) {
          const counterPhase = Math.sin(this.gaitPhase + (limb.isFront ? 0 : Math.PI)) * 2.2;
          const cornerReach = this.cornerWhip * 3.2;
          target = {
            x: clamp(
              floorIdeal.x + perim.nx * (3.0 + cornerReach) + tangX * counterPhase,
              4,
              simWidth - 4
            ),
            y: clamp(
              floorIdeal.y + perim.ny * (3.0 + cornerReach) + tangY * counterPhase,
              4,
              simHeight - 4
            ),
          };
        } else {
          target = floorIdeal;
        }
      }

      const maxReach = (limb.isFront ? FRONT_L1 + FRONT_L2 : REAR_L1 + REAR_L2) * 0.97;
      const distFromAnchor = Math.hypot(limb.footX - anchor.x, limb.footY - anchor.y);
      const distFromTarget = Math.hypot(limb.footX - target.x, limb.footY - target.y);

      const adjLeftOrRight = i ^ 1;
      const partnerStepping = this.limbs[adjLeftOrRight].isStepping;

      const stepThreshold = isWallSideLimb
        ? 6.4 + tangSpeedRatio * 2.6
        : 4.8 + speedRatio * 2.2;

      if (
        !limb.isStepping &&
        ((distFromTarget > stepThreshold && (!partnerStepping || distFromAnchor > maxReach)) ||
          distFromAnchor > maxReach * 1.12 ||
          (isWallSideLimb && !prevBraced))
      ) {
        limb.isStepping = true;
        limb.isWallStep = isWallSideLimb;
        limb.stepProgress = 0;
        limb.stepStartX = limb.footX;
        limb.stepStartY = limb.footY;
        limb.stepTargetX = target.x;
        limb.stepTargetY = target.y;
      }

      if (limb.isStepping) {
        limb.stepTargetX = target.x;
        limb.stepTargetY = target.y;
        const stepSpeed = limb.isWallStep
          ? 0.25 + tangSpeedRatio * 0.2
          : 0.22 + speedRatio * 0.16;
        limb.stepProgress = Math.min(1, limb.stepProgress + stepSpeed);
        const smoothT = limb.stepProgress * limb.stepProgress * (3 - 2 * limb.stepProgress);
        const arcLift = Math.sin(limb.stepProgress * Math.PI) * (limb.isWallStep ? 3.2 : 2.4);
        const liftScale = limb.isWallStep ? 1.0 : 0.4;
        limb.footX =
          limb.stepStartX +
          (limb.stepTargetX - limb.stepStartX) * smoothT +
          liftNormalX * arcLift * liftScale;
        limb.footY =
          limb.stepStartY +
          (limb.stepTargetY - limb.stepStartY) * smoothT +
          liftNormalY * arcLift * liftScale;

        if (limb.stepProgress >= 1) {
          limb.isStepping = false;
          limb.footX = limb.stepTargetX;
          limb.footY = limb.stepTargetY;
          if (limb.isWallStep) {
            limb.flash = Math.max(limb.flash, 0.72);
            const landedPerim = projectToPerimeter(
              limb.footX,
              limb.footY,
              simWidth,
              simHeight
            );
            this.stampWallGrip(limb.footX, limb.footY, landedPerim.nx, landedPerim.ny);
            this.pushAudioCue(
              'wallGrip',
              'lizard',
              clamp(0.32 + tangSpeedRatio * 0.52, 0.3, 0.88),
              limb.footX,
              limb.isFront
            );
          } else {
            this.pushAudioCue(
              'step',
              'lizard',
              clamp(0.22 + speedRatio * 0.65, 0.2, 0.88),
              limb.footX,
              limb.isFront
            );
          }
          limb.isWallStep = false;
        }
      } else if (isWallSideLimb) {
        if (distFromAnchor > maxReach * 1.2) {
          limb.footX = limb.footX * 0.5 + target.x * 0.5;
          limb.footY = limb.footY * 0.5 + target.y * 0.5;
        }
      }
    }

    this.lastAudioTelemetry = {
      visualMode: 'lizard',
      speedRatio: clamp(speedRatio, 0, 1),
      turnRate: clamp(Math.abs(this.angularVel) * 4.0, 0, 1),
      isWallRiding,
      pan: this.computePan(headX, simWidth),
    };
  }

  private stepParticlesAndBursts(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.kind === 'dust') {
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.radius += 0.18;
      } else if (p.kind === 'bubble') {
        p.vx = p.vx * 0.93 + Math.sin(p.life * 0.35) * 0.04;
        p.vy = p.vy * 0.93 - 0.02;
      } else if (p.kind === 'ripple') {
        p.radius += 0.85;
      } else {
        p.vx *= 0.87;
        p.vy *= 0.87;
      }
      p.life -= 1;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let b = this.hitBursts.length - 1; b >= 0; b--) {
      const burst = this.hitBursts[b];
      burst.life -= 1;
      for (const s of burst.shards) {
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.88;
        s.vy *= 0.88;
      }
      if (burst.life <= 0) {
        this.hitBursts.splice(b, 1);
      }
    }
  }

  private stepEnemiesAndWisps(ctx: VisualStepContext): void {
    const { player, partnerPlayer, playerSpeed, simWidth, simHeight } = ctx;
    const activeIndices: number[] = [];
    for (let i = 0; i < ctx.enemies.length; i++) {
      const e = ctx.enemies[i];
      if (!e.spawnDelay || e.spawnDelay <= 0) {
        activeIndices.push(i);
        const d1 = Math.hypot(player.x - e.x, player.y - e.y);
        const d2 = partnerPlayer ? Math.hypot(partnerPlayer.x - e.x, partnerPlayer.y - e.y) : Infinity;
        const targetPlayer = d2 < d1 && partnerPlayer ? partnerPlayer : player;
        const distToPlayer = Math.min(d1, d2);
        const targetThreat = clamp(1 - distToPlayer / 95, 0, 1);

        let hunter = this.enemyHunters.get(i);
        if (!hunter) {
          const initHeading = Math.atan2(targetPlayer.y - e.y, targetPlayer.x - e.x);
          const segments: Vec2[] = [{ x: e.x, y: e.y }];
          let sx = e.x;
          let sy = e.y;
          for (let k = 0; k < HUNTER_SEG_LENGTHS.length; k++) {
            sx -= Math.cos(initHeading) * HUNTER_SEG_LENGTHS[k];
            sy -= Math.sin(initHeading) * HUNTER_SEG_LENGTHS[k];
            segments.push({ x: sx, y: sy });
          }
          hunter = {
            heading: initHeading,
            phase: i * 1.37,
            lastX: e.x,
            lastY: e.y,
            threatLevel: targetThreat,
            snapPhase: 0,
            snapCooldown: 10 + (i % 4) * 6,
            segments,
          };
          this.enemyHunters.set(i, hunter);
        } else {
          const evx = e.x - hunter.lastX;
          const evy = e.y - hunter.lastY;
          const eSpeed = Math.hypot(evx, evy);
          if (eSpeed > 0.05) {
            hunter.heading = lerpAngle(hunter.heading, Math.atan2(evy, evx), 0.32);
          } else {
            hunter.heading = lerpAngle(
              hunter.heading,
              Math.atan2(targetPlayer.y - e.y, targetPlayer.x - e.x),
              0.15
            );
          }
          hunter.phase += 0.16 + Math.min(0.28, eSpeed * 0.08);
          hunter.lastX = e.x;
          hunter.lastY = e.y;
          hunter.threatLevel = hunter.threatLevel * 0.78 + targetThreat * 0.22;

          if (hunter.snapPhase > 0) {
            hunter.snapPhase = Math.max(0, hunter.snapPhase - 0.14);
          } else {
            hunter.snapCooldown -= distToPlayer < 75 ? 2.4 : 0.7;
            if (hunter.snapCooldown <= 0 && distToPlayer < 95) {
              hunter.snapPhase = 1.0;
              hunter.snapCooldown = distToPlayer < 45 ? 10 : 22;
            }
          }

          hunter.segments[0].x = e.x;
          hunter.segments[0].y = e.y;
          const hfX = Math.cos(hunter.heading);
          const hfY = Math.sin(hunter.heading);
          const hrX = -hfY;
          const hrY = hfX;
          for (let k = 1; k < hunter.segments.length; k++) {
            const p = hunter.segments[k - 1];
            const c = hunter.segments[k];
            const wag = Math.sin(hunter.phase - k * 0.9) * (ctx.visualMode === 'goldfish' ? 0.85 : 0.55);
            const dx = c.x - p.x - hfX * 0.35 + hrX * wag * 0.4;
            const dy = c.y - p.y - hfY * 0.35 + hrY * wag * 0.4;
            const d = Math.hypot(dx, dy);
            const len = HUNTER_SEG_LENGTHS[k - 1];
            if (d > 1e-4) {
              c.x = p.x + (dx / d) * len;
              c.y = p.y + (dy / d) * len;
            } else {
              c.x = p.x - hfX * len;
              c.y = p.y - hfY * len;
            }
          }
        }
      } else {
        this.enemyHunters.delete(i);
      }
    }

    for (const key of this.enemyHunters.keys()) {
      if (key >= ctx.enemies.length) {
        this.enemyHunters.delete(key);
      }
    }

    const maxWisps = Math.min(activeIndices.length, 18);
    while (this.wisps.length < maxWisps) {
      const idx = activeIndices[this.wisps.length];
      const e = ctx.enemies[idx];
      const hunter = this.enemyHunters.get(idx);
      const h = hunter ? hunter.heading : Math.atan2(player.y - e.y, player.x - e.x);
      const wx = e.x - Math.cos(h) * 26;
      const wy = e.y - Math.sin(h) * 26;
      this.wisps.push({
        x: wx,
        y: wy,
        vx: 0,
        vy: 0,
        phase: this.wisps.length * 1.9,
        enemyIndex: idx,
        trail: [{ x: wx, y: wy }],
      });
    }
    if (this.wisps.length > maxWisps) {
      this.wisps.length = maxWisps;
    }

    for (let w = 0; w < this.wisps.length; w++) {
      const wisp = this.wisps[w];
      const targetEnemyIdx = activeIndices[w % activeIndices.length];
      wisp.enemyIndex = targetEnemyIdx;
      const e = ctx.enemies[targetEnemyIdx];
      const hunter = this.enemyHunters.get(targetEnemyIdx);
      const h = hunter ? hunter.heading : 0;

      wisp.phase += 0.11;
      const perpX = -Math.sin(h);
      const perpY = Math.cos(h);
      const weave = Math.sin(wisp.phase) * 11.5;
      const followDist = 20 + (w % 3) * 4;
      const goalX = e.x - Math.cos(h) * followDist + perpX * weave;
      const goalY = e.y - Math.sin(h) * followDist + perpY * weave;

      const dx = goalX - wisp.x;
      const dy = goalY - wisp.y;
      const dist = Math.hypot(dx, dy);

      const maxWispSpeed = Math.max(2.6, playerSpeed * 0.98);
      if (dist > 0.5) {
        const desiredSpeed = Math.min(maxWispSpeed, dist * 0.24);
        const dvx = (dx / dist) * desiredSpeed;
        const dvy = (dy / dist) * desiredSpeed;
        wisp.vx = wisp.vx * 0.78 + dvx * 0.22;
        wisp.vy = wisp.vy * 0.78 + dvy * 0.22;
      } else {
        wisp.vx *= 0.85;
        wisp.vy *= 0.85;
      }

      wisp.x = clamp(wisp.x + wisp.vx, 2, simWidth - 2);
      wisp.y = clamp(wisp.y + wisp.vy, 2, simHeight - 2);

      wisp.trail.push({ x: wisp.x, y: wisp.y });
      if (wisp.trail.length > 11) {
        wisp.trail.shift();
      }
    }
  }

  drawArenaBackdrop(
    ctx: CanvasRenderingContext2D,
    simWidth: number,
    simHeight: number,
    visualMode: Exclude<VisualMode, 'classic'> = 'lizard'
  ): void {
    ctx.fillStyle = visualMode === 'goldfish' ? '#02060c' : '#000';
    ctx.fillRect(0, 0, simWidth, simHeight);

    ctx.save();
    ctx.strokeStyle =
      visualMode === 'goldfish'
        ? 'rgba(125, 211, 252, 0.045)'
        : 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let gx = 50; gx < simWidth; gx += 50) {
      ctx.beginPath();
      ctx.moveTo(gx + 0.5, 0);
      ctx.lineTo(gx + 0.5, simHeight);
      ctx.stroke();
    }
    for (let gy = 50; gy < simHeight; gy += 50) {
      ctx.beginPath();
      ctx.moveTo(0, gy + 0.5);
      ctx.lineTo(simWidth, gy + 0.5);
      ctx.stroke();
    }

    const b = 12;
    ctx.strokeStyle =
      visualMode === 'goldfish'
        ? 'rgba(251, 146, 60, 0.24)'
        : 'rgba(103, 232, 249, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(2, b);
    ctx.lineTo(2, 2);
    ctx.lineTo(b, 2);
    ctx.moveTo(simWidth - b, 2);
    ctx.lineTo(simWidth - 2, 2);
    ctx.lineTo(simWidth - 2, b);
    ctx.moveTo(2, simHeight - b);
    ctx.lineTo(2, simHeight - 2);
    ctx.lineTo(b, simHeight - 2);
    ctx.moveTo(simWidth - b, simHeight - 2);
    ctx.lineTo(simWidth - 2, simHeight - 2);
    ctx.lineTo(simWidth - 2, simHeight - b);
    ctx.stroke();
    ctx.restore();
  }

  drawPlayerAgent(
    ctx: CanvasRenderingContext2D,
    visualMode: Exclude<VisualMode, 'classic'> = this.activeVisualMode
  ): void {
    if (visualMode === 'goldfish') {
      this.drawPlayerGoldfish(ctx);
    } else {
      this.drawPlayerLizard(ctx);
    }

    if ((this.lastStamina < 0.99 || this.lastSprinting) && this.spine.length > 1) {
      const anchor = this.spine[1];
      const radius = 14;
      const startA = -Math.PI * 0.85;
      const span = Math.PI * 0.7;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, radius, startA, startA + span);
      ctx.stroke();

      if (this.lastStamina > 0.01) {
        ctx.strokeStyle = this.lastSprinting
          ? 'rgba(250, 204, 21, 0.92)'
          : 'rgba(34, 211, 238, 0.78)';
        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, radius, startA, startA + span * this.lastStamina);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawPlayerGoldfish(ctx: CanvasRenderingContext2D): void {
    if (!this.initialized || this.spine.length < 7) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 0. Subtle tank glass glide trail
    if (this.wallTrails.length >= 2) {
      for (let i = 1; i < this.wallTrails.length; i++) {
        const a = this.wallTrails[i - 1];
        const b = this.wallTrails[i];
        if (Math.hypot(b.x - a.x, b.y - a.y) > 22) continue;
        const alpha = clamp(b.life / b.maxLife, 0, 1) * 0.34;
        ctx.strokeStyle = `rgba(125, 211, 252, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // 1. Aquatic wall kick arcs
    for (const pulse of this.wallPulses) {
      const t = 1 - pulse.life / pulse.maxLife;
      const alpha = (1 - t) * 0.68;
      const r = 4 + t * 16;
      const baseAngle = Math.atan2(pulse.ny, pulse.nx);

      ctx.strokeStyle = `rgba(186, 230, 253, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, r, baseAngle - 0.95, baseAngle + 0.95);
      ctx.stroke();

      ctx.strokeStyle = `rgba(251, 146, 60, ${(alpha * 0.45).toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, r * 0.62, baseAngle - 0.75, baseAngle + 0.75);
      ctx.stroke();
    }

    // 2. Water ripples & bubbles underneath goldfish
    for (const p of this.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.kind === 'ripple') {
        ctx.strokeStyle = `rgba(125, 211, 252, ${(alpha * 0.42).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === 'bubble') {
        ctx.strokeStyle = `rgba(186, 230, 253, ${(alpha * 0.75).toFixed(3)})`;
        ctx.fillStyle = `rgba(224, 242, 254, ${(alpha * 0.18).toFixed(3)})`;
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Micro specular glint
        ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.85).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.35, p.y - p.radius * 0.35, 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const isCyanFish = this.activePalette === 'cyan';
    const isSplitFish = this.activePalette === 'split';
    const splitFishColors = this.activeSplitColors;
    const isMultiSplitFish = isSplitFish && splitFishColors.length > 2;

    // 3. Soft aquatic glow halo
    ctx.strokeStyle = isSplitFish
      ? 'rgba(165, 243, 252, 0.14)'
      : isCyanFish
      ? 'rgba(34, 211, 238, 0.15)'
      : 'rgba(251, 146, 60, 0.14)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(this.spine[0].x, this.spine[0].y);
    for (let i = 1; i < this.spine.length; i++) {
      ctx.lineTo(this.spine[i].x, this.spine[i].y);
    }
    ctx.stroke();

    // 4. Translucent split veil tail lobes (caudal fin)
    const ped = this.spine[this.spine.length - 1];
    const drawVeilLobe = (lobe: Vec2[], fillAlpha: number, slotIdx: number) => {
      if (lobe.length < 3) return;
      if (isMultiSplitFish) {
        const col = splitFishColors[slotIdx % splitFishColors.length];
        ctx.save();
        ctx.globalAlpha = fillAlpha;
        ctx.fillStyle = col;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(ped.x, ped.y);
        ctx.quadraticCurveTo(lobe[0].x, lobe[0].y, lobe[2].x, lobe[2].y);
        const midBackX = (ped.x + lobe[1].x) * 0.5;
        const midBackY = (ped.y + lobe[1].y) * 0.5;
        ctx.quadraticCurveTo(midBackX, midBackY, ped.x, ped.y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = Math.min(1, fillAlpha + 0.35);
        ctx.stroke();
        ctx.restore();
        return;
      }
      const useCyan = isSplitFish ? slotIdx === 0 : isCyanFish;
      ctx.fillStyle = useCyan
        ? `rgba(34, 211, 238, ${fillAlpha})`
        : `rgba(251, 146, 60, ${fillAlpha})`;
      ctx.strokeStyle = useCyan
        ? 'rgba(165, 243, 252, 0.65)'
        : 'rgba(254, 215, 170, 0.62)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(ped.x, ped.y);
      ctx.quadraticCurveTo(
        lobe[0].x,
        lobe[0].y,
        lobe[2].x,
        lobe[2].y
      );
      const midBackX = (ped.x + lobe[1].x) * 0.5;
      const midBackY = (ped.y + lobe[1].y) * 0.5;
      ctx.quadraticCurveTo(midBackX, midBackY, ped.x, ped.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Delicate tail fin ray
      ctx.strokeStyle = useCyan
        ? 'rgba(207, 250, 254, 0.38)'
        : 'rgba(255, 237, 213, 0.35)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(ped.x, ped.y);
      ctx.lineTo(lobe[1].x, lobe[1].y);
      ctx.lineTo(lobe[2].x, lobe[2].y);
      ctx.stroke();
    };
    drawVeilLobe(this.fishTailUpper, 0.42, isMultiSplitFish ? 2 : 0);
    drawVeilLobe(
      this.fishTailLower,
      0.36,
      isMultiSplitFish ? Math.min(3, splitFishColors.length - 1) : 1
    );

    // 5. Pectoral fins (paddle at slow speed, tuck sleekly when fast, flare near glass)
    const shoulder = this.spine[1];
    const head = this.spine[0];
    const bodyAngle = Math.atan2(head.y - shoulder.y, head.x - shoulder.x);
    const speedRatio = clamp(this.prevSpeedRatio, 0, 1);
    const glassFlare = this.fishGlassSquash * 0.45;
    const drawPectoralFin = (side: -1 | 1) => {
      const paddle =
        Math.sin(this.fishFinPaddle + (side === 1 ? 0 : 0.6)) *
        (0.28 * (1 - speedRatio * 0.65));
      const baseSweep = 2.05 + speedRatio * 0.48 - glassFlare;
      const turnFlare = this.angularVel * side * 0.9;
      const finAngle = bodyAngle + side * (baseSweep + paddle + turnFlare);
      const finLen = 6.2 + (1 - speedRatio) * 1.4;
      const rootX = shoulder.x + Math.cos(bodyAngle + side * Math.PI * 0.5) * 3.0;
      const rootY = shoulder.y + Math.sin(bodyAngle + side * Math.PI * 0.5) * 3.0;
      const tipX = rootX + Math.cos(finAngle) * finLen;
      const tipY = rootY + Math.sin(finAngle) * finLen;
      const ctrlX = rootX + Math.cos(finAngle - side * 0.45) * (finLen * 0.65);
      const ctrlY = rootY + Math.sin(finAngle - side * 0.45) * (finLen * 0.65);

      if (isMultiSplitFish) {
        const finCol = splitFishColors[side === -1 ? 0 : 1];
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = finCol;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(rootX, rootY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
        ctx.quadraticCurveTo(
          rootX + Math.cos(finAngle + side * 0.35) * (finLen * 0.55),
          rootY + Math.sin(finAngle + side * 0.35) * (finLen * 0.55),
          rootX,
          rootY
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        return;
      }

      const finCyan = isSplitFish ? side === -1 : isCyanFish;
      ctx.fillStyle = finCyan ? 'rgba(103, 232, 249, 0.46)' : 'rgba(253, 186, 116, 0.46)';
      ctx.strokeStyle = finCyan ? 'rgba(207, 250, 254, 0.7)' : 'rgba(255, 237, 213, 0.68)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.quadraticCurveTo(
        rootX + Math.cos(finAngle + side * 0.35) * (finLen * 0.55),
        rootY + Math.sin(finAngle + side * 0.35) * (finLen * 0.55),
        rootX,
        rootY
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    drawPectoralFin(-1);
    drawPectoralFin(1);

    // 6. Tapered plump Koi/Goldfish body polygon
    const widthScale = 1 / Math.sqrt(clamp(this.squashStretch, 0.82, 1.2));
    const leftSide: Vec2[] = [];
    const rightSide: Vec2[] = [];
    for (let i = 0; i < this.spine.length; i++) {
      const curr = this.spine[i];
      let tx = 0;
      let ty = 0;
      if (i === 0) {
        tx = curr.x - this.spine[1].x;
        ty = curr.y - this.spine[1].y;
      } else if (i === this.spine.length - 1) {
        tx = this.spine[i - 1].x - curr.x;
        ty = this.spine[i - 1].y - curr.y;
      } else {
        tx = this.spine[i - 1].x - this.spine[i + 1].x;
        ty = this.spine[i - 1].y - this.spine[i + 1].y;
      }
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      const r = FISH_SPINE_RADII[i] * (i <= 3 ? widthScale : 1);
      leftSide.push({ x: curr.x + nx * r, y: curr.y + ny * r });
      rightSide.push({ x: curr.x - nx * r, y: curr.y - ny * r });
    }

    const snoutDist = 3.5 * (1 - this.fishGlassSquash * 0.25);
    const snoutX = head.x + Math.cos(bodyAngle) * snoutDist;
    const snoutY = head.y + Math.sin(bodyAngle) * snoutDist;

    if (isMultiSplitFish) {
      const kCount = splitFishColors.length;
      const totalSegs = this.spine.length; // 6 nodes -> 5 quads (snout->0 + 0..4->5)
      for (let i = 0; i < totalSegs - 1; i++) {
        const bandIdx = Math.min(kCount - 1, Math.floor((i / (totalSegs - 1)) * kCount));
        ctx.fillStyle = splitFishColors[bandIdx];
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        if (i === 0) {
          ctx.moveTo(snoutX, snoutY);
          ctx.quadraticCurveTo(leftSide[0].x, leftSide[0].y, leftSide[1].x, leftSide[1].y);
          ctx.lineTo(rightSide[1].x, rightSide[1].y);
          ctx.quadraticCurveTo(rightSide[0].x, rightSide[0].y, snoutX, snoutY);
        } else {
          ctx.moveTo(leftSide[i].x, leftSide[i].y);
          ctx.lineTo(leftSide[i + 1].x, leftSide[i + 1].y);
          ctx.lineTo(rightSide[i + 1].x, rightSide[i + 1].y);
          ctx.lineTo(rightSide[i].x, rightSide[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Crisp dorsal band dividers
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.78)';
      ctx.lineWidth = 0.9;
      for (let i = 1; i < totalSegs - 1; i++) {
        const prevBand = Math.min(kCount - 1, Math.floor(((i - 1) / (totalSegs - 1)) * kCount));
        const currBand = Math.min(kCount - 1, Math.floor((i / (totalSegs - 1)) * kCount));
        if (currBand !== prevBand) {
          ctx.beginPath();
          ctx.moveTo(leftSide[i].x, leftSide[i].y);
          ctx.lineTo(rightSide[i].x, rightSide[i].y);
          ctx.stroke();
        }
      }
    } else if (isSplitFish) {
      // Left hemisphere (Cyan - Brain A)
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#083344';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(snoutX, snoutY);
      ctx.quadraticCurveTo(leftSide[0].x, leftSide[0].y, leftSide[1].x, leftSide[1].y);
      for (let i = 2; i < leftSide.length; i++) {
        ctx.lineTo(leftSide[i].x, leftSide[i].y);
      }
      for (let i = this.spine.length - 1; i >= 0; i--) {
        ctx.lineTo(this.spine[i].x, this.spine[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right hemisphere (Amber - Brain B)
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(snoutX, snoutY);
      for (let i = 0; i < this.spine.length; i++) {
        ctx.lineTo(this.spine[i].x, this.spine[i].y);
      }
      for (let i = rightSide.length - 1; i >= 1; i--) {
        ctx.lineTo(rightSide[i].x, rightSide[i].y);
      }
      ctx.quadraticCurveTo(rightSide[0].x, rightSide[0].y, snoutX, snoutY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crisp split-brain seam
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.82)';
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.moveTo(snoutX, snoutY);
      for (let i = 0; i < this.spine.length; i++) {
        ctx.lineTo(this.spine[i].x, this.spine[i].y);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = isCyanFish ? '#06b6d4' : '#fb923c';
      ctx.strokeStyle = isCyanFish ? '#083344' : '#7c2d12';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(snoutX, snoutY);
      ctx.quadraticCurveTo(leftSide[0].x, leftSide[0].y, leftSide[1].x, leftSide[1].y);
      for (let i = 2; i < leftSide.length; i++) {
        ctx.lineTo(leftSide[i].x, leftSide[i].y);
      }
      for (let i = rightSide.length - 1; i >= 1; i--) {
        ctx.lineTo(rightSide[i].x, rightSide[i].y);
      }
      ctx.quadraticCurveTo(rightSide[0].x, rightSide[0].y, snoutX, snoutY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Koi pearl-white shoulder patch + bright sheen
      ctx.fillStyle = isCyanFish ? 'rgba(236, 254, 255, 0.88)' : 'rgba(255, 247, 237, 0.85)';
      ctx.beginPath();
      ctx.ellipse(
        (head.x + shoulder.x) * 0.5,
        (head.y + shoulder.y) * 0.5,
        2.4,
        1.6,
        bodyAngle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Undulating translucent dorsal fin ridge
    ctx.strokeStyle = isSplitFish
      ? 'rgba(241, 245, 249, 0.78)'
      : isCyanFish
      ? 'rgba(165, 243, 252, 0.78)'
      : 'rgba(254, 215, 170, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(this.spine[1].x, this.spine[1].y);
    for (let i = 2; i <= 4; i++) {
      const n = this.spine[i];
      const lean = -this.angularVel * 2.4;
      ctx.lineTo(n.x - Math.sin(bodyAngle) * lean, n.y + Math.cos(bodyAngle) * lean);
    }
    ctx.stroke();

    // Expressive eyes with tiny white specular highlights
    const eyeFwdX = Math.cos(bodyAngle) * 0.8;
    const eyeFwdY = Math.sin(bodyAngle) * 0.8;
    const eyeLatX = -Math.sin(bodyAngle) * 2.25;
    const eyeLatY = Math.cos(bodyAngle) * 2.25;

    for (const side of [-1, 1]) {
      const ex = head.x + eyeFwdX + eyeLatX * side;
      const ey = head.y + eyeFwdY + eyeLatY * side;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(ex + 0.3, ey - 0.3, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawPlayerLizard(ctx: CanvasRenderingContext2D): void {
    if (!this.initialized || this.spine.length < 9) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this.wallTrails.length >= 2) {
      for (let i = 1; i < this.wallTrails.length; i++) {
        const a = this.wallTrails[i - 1];
        const b = this.wallTrails[i];
        if (Math.hypot(b.x - a.x, b.y - a.y) > 22) continue;
        const alpha = clamp(b.life / b.maxLife, 0, 1) * 0.38;
        ctx.strokeStyle = `rgba(103, 232, 249, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.45;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (const tick of this.wallGripTicks) {
      const alpha = clamp(tick.life / tick.maxLife, 0, 1) * 0.65;
      ctx.strokeStyle = `rgba(165, 243, 252, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(tick.x, tick.y);
      ctx.lineTo(tick.x + tick.nx * 3.2, tick.y + tick.ny * 3.2);
      ctx.stroke();
    }

    for (const pulse of this.wallPulses) {
      const t = 1 - pulse.life / pulse.maxLife;
      const alpha = (1 - t) * 0.72;
      const r = 4 + t * 16;
      const baseAngle = Math.atan2(pulse.ny, pulse.nx);

      ctx.strokeStyle = `rgba(165, 243, 252, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, r, baseAngle - 0.95, baseAngle + 0.95);
      ctx.stroke();

      if (t > 0.12) {
        ctx.strokeStyle = `rgba(34, 211, 238, ${(alpha * 0.45).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, r * 0.65, baseAngle - 0.75, baseAngle + 0.75);
        ctx.stroke();
      }

      const tx = -pulse.ny;
      const ty = pulse.nx;
      const span = 8 + t * 6;
      ctx.strokeStyle = `rgba(103, 232, 249, ${(alpha * 0.8).toFixed(3)})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(pulse.x - tx * span, pulse.y - ty * span);
      ctx.lineTo(pulse.x + tx * span, pulse.y + ty * span);
      ctx.stroke();
    }

    for (const p of this.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.kind === 'dust') {
        ctx.fillStyle = `rgba(148, 163, 184, ${(alpha * 0.28).toFixed(3)})`;
        ctx.strokeStyle = `rgba(165, 243, 252, ${(alpha * 0.25).toFixed(3)})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === 'spark') {
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    const isAmberLizard = this.activePalette === 'amber';
    const isSplitLizard = this.activePalette === 'split';
    const splitLizardColors = this.activeSplitColors;
    const isMultiSplitLizard = isSplitLizard && splitLizardColors.length > 2;
    ctx.strokeStyle = isSplitLizard
      ? 'rgba(165, 243, 252, 0.12)'
      : isAmberLizard
      ? 'rgba(245, 158, 11, 0.14)'
      : 'rgba(0, 255, 255, 0.11)';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(this.spine[0].x, this.spine[0].y);
    for (let i = 1; i <= 5; i++) {
      ctx.lineTo(this.spine[i].x, this.spine[i].y);
    }
    ctx.stroke();

    for (let limbIdx = 0; limbIdx < this.limbs.length; limbIdx++) {
      const limb = this.limbs[limbIdx];
      const anchor = this.spine[this.getAnchorNodeIndex(limb)];
      const prev = this.spine[Math.max(0, this.getAnchorNodeIndex(limb) - 1)];
      const segAngle = Math.atan2(prev.y - anchor.y, prev.x - anchor.x);
      const shoulderOffset = limb.isFront ? 2.1 : 1.7;
      const rootX = anchor.x + Math.cos(segAngle + limb.side * Math.PI * 0.5) * shoulderOffset;
      const rootY = anchor.y + Math.sin(segAngle + limb.side * Math.PI * 0.5) * shoulderOffset;

      const l1 = limb.isFront ? FRONT_L1 : REAR_L1;
      const l2 = limb.isFront ? FRONT_L2 : REAR_L2;
      const bendSign = limb.isFront ? -limb.side : limb.side;
      const ik = solve2BoneIK(rootX, rootY, limb.footX, limb.footY, l1, l2, bendSign);

      const limbAmber = isSplitLizard ? limb.side === 1 : isAmberLizard;
      const limbColor = isMultiSplitLizard
        ? splitLizardColors[limbIdx % splitLizardColors.length]
        : limbAmber
        ? '#f59e0b'
        : '#22d3ee';
      ctx.strokeStyle =
        limb.bracedWall || limb.flash > 0.3
          ? '#f8fafc'
          : limbColor;
      ctx.lineWidth = limb.bracedWall ? 1.85 : 1.45;
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.lineTo(ik.jointX, ik.jointY);
      ctx.lineTo(ik.endX, ik.endY);
      ctx.stroke();

      if (limb.flash > 0.02) {
        ctx.strokeStyle = isMultiSplitLizard
          ? limbColor
          : limbAmber
          ? `rgba(254, 243, 199, ${(limb.flash * 0.85).toFixed(3)})`
          : `rgba(224, 250, 255, ${(limb.flash * 0.85).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(ik.endX, ik.endY, 2.2 + (1 - limb.flash) * 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle =
        limb.bracedWall || limb.flash > 0.2
          ? '#ffffff'
          : isMultiSplitLizard
          ? limbColor
          : limbAmber
          ? '#fcd34d'
          : '#67e8f9';
      ctx.beginPath();
      ctx.arc(ik.endX, ik.endY, limb.bracedWall ? 1.75 : 1.25, 0, Math.PI * 2);
      ctx.fill();
    }

    const widthScale = 1 / Math.sqrt(clamp(this.squashStretch, 0.82, 1.24));
    const leftSide: Vec2[] = [];
    const rightSide: Vec2[] = [];
    for (let i = 0; i < this.spine.length; i++) {
      const curr = this.spine[i];
      let tx = 0;
      let ty = 0;
      if (i === 0) {
        tx = curr.x - this.spine[1].x;
        ty = curr.y - this.spine[1].y;
      } else if (i === this.spine.length - 1) {
        tx = this.spine[i - 1].x - curr.x;
        ty = this.spine[i - 1].y - curr.y;
      } else {
        tx = this.spine[i - 1].x - this.spine[i + 1].x;
        ty = this.spine[i - 1].y - this.spine[i + 1].y;
      }
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      const r = LIZARD_SPINE_RADII[i] * (i >= 1 && i <= 4 ? widthScale : 1);
      leftSide.push({ x: curr.x + nx * r, y: curr.y + ny * r });
      rightSide.push({ x: curr.x - nx * r, y: curr.y - ny * r });
    }

    const head = this.spine[0];
    const neck = this.spine[1];
    const headAngle = Math.atan2(head.y - neck.y, head.x - neck.x);
    const snoutX = head.x + Math.cos(headAngle) * 4.2;
    const snoutY = head.y + Math.sin(headAngle) * 4.2;

    if (this.tongueTimer > 0) {
      const tNorm = 1 - this.tongueTimer / 18;
      const flick = Math.abs(Math.sin(tNorm * Math.PI * 2));
      const ext = flick * 5.6;
      if (ext > 0.6) {
        const wobble = Math.sin(tNorm * Math.PI * 5) * 0.18;
        const tAngle = headAngle + wobble;
        const midX = snoutX + Math.cos(tAngle) * (ext * 0.65);
        const midY = snoutY + Math.sin(tAngle) * (ext * 0.65);
        const tipLX = snoutX + Math.cos(tAngle - 0.42) * ext;
        const tipLY = snoutY + Math.sin(tAngle - 0.42) * ext;
        const tipRX = snoutX + Math.cos(tAngle + 0.42) * ext;
        const tipRY = snoutY + Math.sin(tAngle + 0.42) * ext;

        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.moveTo(snoutX, snoutY);
        ctx.lineTo(midX, midY);
        ctx.lineTo(tipLX, tipLY);
        ctx.moveTo(midX, midY);
        ctx.lineTo(tipRX, tipRY);
        ctx.stroke();
      }
    }

    if (isMultiSplitLizard) {
      const kCount = splitLizardColors.length;
      const numQuads = this.spine.length - 1; // 8 spine quads
      // Snout cap (Brain A)
      ctx.fillStyle = splitLizardColors[0];
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(snoutX, snoutY);
      ctx.lineTo(leftSide[0].x, leftSide[0].y);
      ctx.lineTo(rightSide[0].x, rightSide[0].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      for (let i = 0; i < numQuads; i++) {
        const bandIdx = Math.min(kCount - 1, Math.floor((i / numQuads) * kCount));
        ctx.fillStyle = splitLizardColors[bandIdx];
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(leftSide[i].x, leftSide[i].y);
        ctx.lineTo(leftSide[i + 1].x, leftSide[i + 1].y);
        ctx.lineTo(rightSide[i + 1].x, rightSide[i + 1].y);
        ctx.lineTo(rightSide[i].x, rightSide[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
      ctx.lineWidth = 0.95;
      for (let i = 1; i < numQuads; i++) {
        const prevBand = Math.min(kCount - 1, Math.floor(((i - 1) / numQuads) * kCount));
        const currBand = Math.min(kCount - 1, Math.floor((i / numQuads) * kCount));
        if (currBand !== prevBand) {
          ctx.beginPath();
          ctx.moveTo(leftSide[i].x, leftSide[i].y);
          ctx.lineTo(rightSide[i].x, rightSide[i].y);
          ctx.stroke();
        }
      }
    } else if (isSplitLizard) {
      // Left hemisphere (Cyan - Brain A)
      ctx.fillStyle = '#00ffff';
      ctx.strokeStyle = '#083344';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(snoutX, snoutY);
      for (let i = 0; i < leftSide.length; i++) {
        ctx.lineTo(leftSide[i].x, leftSide[i].y);
      }
      for (let i = this.spine.length - 1; i >= 0; i--) {
        ctx.lineTo(this.spine[i].x, this.spine[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right hemisphere (Amber - Brain B)
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(snoutX, snoutY);
      for (let i = 0; i < this.spine.length; i++) {
        ctx.lineTo(this.spine[i].x, this.spine[i].y);
      }
      for (let i = rightSide.length - 1; i >= 0; i--) {
        ctx.lineTo(rightSide[i].x, rightSide[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Split dorsal corpus callosum seam
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.moveTo(snoutX, snoutY);
      for (let i = 0; i < 6; i++) {
        ctx.lineTo(this.spine[i].x, this.spine[i].y);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = isAmberLizard ? '#f59e0b' : '#00ffff';
      ctx.strokeStyle = isAmberLizard ? '#451a03' : '#083344';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(snoutX, snoutY);
      for (let i = 0; i < leftSide.length; i++) {
        ctx.lineTo(leftSide[i].x, leftSide[i].y);
      }
      for (let i = rightSide.length - 1; i >= 0; i--) {
        ctx.lineTo(rightSide[i].x, rightSide[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = isAmberLizard ? 'rgba(69, 26, 3, 0.72)' : 'rgba(8, 51, 68, 0.72)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(head.x, head.y);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(this.spine[i].x, this.spine[i].y);
      }
      ctx.stroke();
    }

    const eyeFwd = Math.cos(headAngle) * 1.1;
    const eyeFwdY = Math.sin(headAngle) * 1.1;
    const eyeLatX = -Math.sin(headAngle) * 1.65;
    const eyeLatY = Math.cos(headAngle) * 1.65;
    ctx.fillStyle = isAmberLizard ? '#1c0f02' : '#041820';
    ctx.beginPath();
    ctx.arc(head.x + eyeFwd + eyeLatX, head.y + eyeFwdY + eyeLatY, 0.9, 0, Math.PI * 2);
    ctx.arc(head.x + eyeFwd - eyeLatX, head.y + eyeFwdY - eyeLatY, 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawEnemiesAndWisps(
    ctx: CanvasRenderingContext2D,
    enemies: VisualEnemySnapshot[],
    playerPos?: VisualPlayerSnapshot,
    visualMode: Exclude<VisualMode, 'classic'> = this.activeVisualMode,
    partnerPos?: VisualPlayerSnapshot
  ): void {
    const isFish = visualMode === 'goldfish';
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Non-colliding chaser wisps (amber in lizard mode, aquamarine fry in goldfish mode)
    for (const wisp of this.wisps) {
      if (wisp.trail.length >= 2) {
        ctx.strokeStyle = isFish
          ? 'rgba(56, 189, 248, 0.16)'
          : 'rgba(245, 158, 11, 0.14)';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(wisp.trail[0].x, wisp.trail[0].y);
        for (let i = 1; i < wisp.trail.length; i++) {
          ctx.lineTo(wisp.trail[i].x, wisp.trail[i].y);
        }
        ctx.stroke();

        for (let i = 1; i < wisp.trail.length; i++) {
          const frac = i / wisp.trail.length;
          ctx.strokeStyle = isFish
            ? `rgba(125, 211, 252, ${(frac * 0.62).toFixed(3)})`
            : `rgba(251, 191, 36, ${(frac * 0.62).toFixed(3)})`;
          ctx.lineWidth = 0.5 + frac * 1.65;
          ctx.beginPath();
          ctx.moveTo(wisp.trail[i - 1].x, wisp.trail[i - 1].y);
          ctx.lineTo(wisp.trail[i].x, wisp.trail[i].y);
          ctx.stroke();
        }
      }

      const wAngle =
        Math.hypot(wisp.vx, wisp.vy) > 0.05
          ? Math.atan2(wisp.vy, wisp.vx)
          : wisp.phase;
      const tipX = wisp.x + Math.cos(wAngle) * 3.3;
      const tipY = wisp.y + Math.sin(wAngle) * 3.3;
      const wingLX = wisp.x - Math.cos(wAngle - 0.85) * 2.7;
      const wingLY = wisp.y - Math.sin(wAngle - 0.85) * 2.7;
      const wingRX = wisp.x - Math.cos(wAngle + 0.85) * 2.7;
      const wingRY = wisp.y - Math.sin(wAngle + 0.85) * 2.7;

      ctx.fillStyle = isFish
        ? 'rgba(56, 189, 248, 0.24)'
        : 'rgba(251, 191, 36, 0.22)';
      ctx.beginPath();
      ctx.arc(wisp.x, wisp.y, 4.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isFish
        ? 'rgba(186, 230, 253, 0.92)'
        : 'rgba(253, 224, 71, 0.92)';
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(wingLX, wingLY);
      ctx.lineTo(wisp.x - Math.cos(wAngle) * 0.8, wisp.y - Math.sin(wAngle) * 0.8);
      ctx.lineTo(wingRX, wingRY);
      ctx.closePath();
      ctx.fill();
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.spawnDelay && e.spawnDelay > 0) continue;

      const hunter = this.enemyHunters.get(i);
      if (!hunter || hunter.segments.length < 4) {
        ctx.fillStyle = '#ff2233';
        ctx.fillRect(e.x - 5, e.y - 5, 10, 10);
        continue;
      }

      const h = hunter.heading;
      const fX = Math.cos(h);
      const fY = Math.sin(h);
      const rX = -fY;
      const rY = fX;

      const threat = hunter.threatLevel;
      ctx.fillStyle = `rgba(255, 34, 51, ${(0.09 + threat * 0.13).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 9 + threat * 7, 0, Math.PI * 2);
      ctx.fill();

      if (threat > 0.08 && playerPos) {
        const d1 = Math.hypot(playerPos.x - e.x, playerPos.y - e.y);
        const d2 = partnerPos ? Math.hypot(partnerPos.x - e.x, partnerPos.y - e.y) : Infinity;
        const aimTarget = d2 < d1 && partnerPos ? partnerPos : playerPos;
        const aimAngle = Math.atan2(aimTarget.y - e.y, aimTarget.x - e.x);
        ctx.strokeStyle = `rgba(255, 68, 85, ${(threat * 0.45).toFixed(3)})`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 11 + threat * 3, aimAngle - 0.65, aimAngle + 0.65);
        ctx.stroke();
      }

      const segs = hunter.segments;
      for (let k = segs.length - 1; k >= 1; k--) {
        const s = segs[k];
        const prev = segs[k - 1];
        const radius = 3.2 - k * 0.65;
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = radius * 1.45;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        if (isFish) {
          // Aquatic predator tail fin fork at last segment, swept pectoral fins on mid segment
          if (k === segs.length - 1) {
            const tailWag = Math.sin(hunter.phase - 1.5) * 2.2;
            ctx.fillStyle = 'rgba(220, 38, 38, 0.72)';
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - fX * 5.2 + rX * (3.4 + tailWag), s.y - fY * 5.2 + rY * (3.4 + tailWag));
            ctx.lineTo(s.x - fX * 2.8, s.y - fY * 2.8);
            ctx.lineTo(s.x - fX * 5.2 - rX * (3.4 - tailWag), s.y - fY * 5.2 - rY * (3.4 - tailWag));
            ctx.closePath();
            ctx.fill();
          } else if (k === 1) {
            ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - fX * 2.8 + rX * 5.0, s.y - fY * 2.8 + rY * 5.0);
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - fX * 2.8 - rX * 5.0, s.y - fY * 2.8 - rY * 5.0);
            ctx.stroke();
          }
        } else if (k <= 2) {
          const swing = Math.sin(hunter.phase + k * 1.8) * 1.6;
          const legSpan = 5.4 - k * 0.9;
          ctx.strokeStyle = 'rgba(248, 113, 113, 0.72)';
          ctx.lineWidth = 1.05;
          ctx.beginPath();
          ctx.moveTo(s.x + rX * legSpan + fX * swing, s.y + rY * legSpan + fY * swing);
          ctx.lineTo(s.x, s.y);
          ctx.lineTo(s.x - rX * legSpan - fX * swing, s.y - rY * legSpan - fY * swing);
          ctx.stroke();
        }
      }

      const headTipX = e.x + fX * 6.0;
      const headTipY = e.y + fY * 6.0;
      const cheekLX = e.x + rX * 4.5 - fX * 1.8;
      const cheekLY = e.y + rY * 4.5 - fY * 1.8;
      const cheekRX = e.x - rX * 4.5 - fX * 1.8;
      const cheekRY = e.y - rY * 4.5 - fY * 1.8;
      const backX = e.x - fX * 4.2;
      const backY = e.y - fY * 4.2;

      ctx.fillStyle = threat > 0.35 ? '#ff3344' : '#ff2233';
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(headTipX, headTipY);
      ctx.lineTo(cheekLX, cheekLY);
      ctx.lineTo(backX, backY);
      ctx.lineTo(cheekRX, cheekRY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      let mandSpread = 0.45 + Math.sin(hunter.phase * 1.4) * 0.14 + threat * 0.35;
      if (hunter.snapPhase > 0) {
        mandSpread =
          hunter.snapPhase > 0.55
            ? 1.15
            : 0.12 + (0.55 - hunter.snapPhase) * 0.25;
      }
      const mTipDist = hunter.snapPhase > 0 && hunter.snapPhase <= 0.55 ? 8.3 : 7.6;
      const mLat = 2.8 * mandSpread;

      ctx.strokeStyle = hunter.snapPhase > 0 ? '#fee2e2' : '#fca5a5';
      ctx.lineWidth = hunter.snapPhase > 0 ? 1.35 : 1.1;
      ctx.beginPath();
      ctx.moveTo(e.x + fX * 3.0 + rX * 2.2, e.y + fY * 3.0 + rY * 2.2);
      ctx.lineTo(e.x + fX * mTipDist + rX * mLat, e.y + fY * mTipDist + rY * mLat);
      ctx.moveTo(e.x + fX * 3.0 - rX * 2.2, e.y + fY * 3.0 - rY * 2.2);
      ctx.lineTo(e.x + fX * mTipDist - rX * mLat, e.y + fY * mTipDist - rY * mLat);
      ctx.stroke();

      if (hunter.snapPhase > 0.25 && hunter.snapPhase <= 0.52) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(e.x + fX * 8.2, e.y + fY * 8.2, 1.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawHitBursts(ctx: CanvasRenderingContext2D): void {
    if (this.hitBursts.length === 0) return;
    ctx.save();
    for (const burst of this.hitBursts) {
      const t = 1 - burst.life / burst.maxLife;
      const alpha = clamp(1 - t, 0, 1);

      ctx.strokeStyle = `rgba(255, 68, 85, ${(alpha * 0.85).toFixed(3)})`;
      ctx.lineWidth = 2.0 * (1 - t * 0.6);
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, 4 + t * 24, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(103, 232, 249, ${(alpha * 0.65).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, 2 + t * 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = alpha;
      for (const s of burst.shards) {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (1 - t * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

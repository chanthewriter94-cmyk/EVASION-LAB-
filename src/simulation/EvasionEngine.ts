import {
  ActivationType,
  getOutputConfigSpec,
  NeuralNetwork,
  OUTPUT_CONFIG_OPTIONS,
  OutputConfig,
} from './NeuralNetwork';
import { ProceduralAudio } from './ProceduralAudio';
import { ProceduralVisuals, VisualMode } from './ProceduralVisuals';

export type { OutputConfig, VisualMode };
export { OUTPUT_CONFIG_OPTIONS, getOutputConfigSpec };
export const SIM_WIDTH = 600;
export const SIM_HEIGHT = 400;
export const NN_WIDTH = 570;
export const NN_HEIGHT = 475;

export type SpawnMode = 'outer' | 'central';
export type EnemySpeedMode = 'fixed' | 'rarity';
export type AgentId = 'A' | 'B' | 'C' | 'D' | 'E';
export type ExtraBrainId = 'C' | 'D' | 'E';
export type NetViewMode = AgentId | 'split';
export type TelepathyBridgeMode = 'dual' | 'a_to_b' | 'b_to_a';
export type SimMode = 'single' | 'dual' | 'split_brain';
export type SplitBrainMergeMode =
  | 'collision_sum'
  | 'blend'
  | 'winner'
  | 'split_axes'
  | 'alternate';

export const ALL_BRAIN_IDS: AgentId[] = ['A', 'B', 'C', 'D', 'E'];
export const EXTRA_BRAIN_IDS: ExtraBrainId[] = ['C', 'D', 'E'];
export const MAX_SPLIT_BRAINS = 5;

export const BRAIN_COLORS: Record<
  AgentId,
  {
    hex: string;
    lightHex: string;
    darkHex: string;
    rgba: (alpha: number) => string;
  }
> = {
  A: {
    hex: '#22d3ee',
    lightHex: '#67e8f9',
    darkHex: '#083344',
    rgba: (alpha: number) => `rgba(34, 211, 238, ${alpha})`,
  },
  B: {
    hex: '#f59e0b',
    lightHex: '#fcd34d',
    darkHex: '#451a03',
    rgba: (alpha: number) => `rgba(245, 158, 11, ${alpha})`,
  },
  C: {
    hex: '#e879f9',
    lightHex: '#f5d0fe',
    darkHex: '#4a044e',
    rgba: (alpha: number) => `rgba(232, 121, 249, ${alpha})`,
  },
  D: {
    hex: '#4ade80',
    lightHex: '#bbf7d0',
    darkHex: '#052e16',
    rgba: (alpha: number) => `rgba(74, 222, 128, ${alpha})`,
  },
  E: {
    hex: '#fb7185',
    lightHex: '#fecdd3',
    darkHex: '#4c0519',
    rgba: (alpha: number) => `rgba(251, 113, 133, ${alpha})`,
  },
};

export const SPLIT_BRAIN_MERGE_OPTIONS: {
  value: SplitBrainMergeMode;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: 'collision_sum',
    label: 'Collision Sum',
    shortLabel: 'Collision',
    description:
      'Direct additive vector collision of all active brains — opposing pushes cancel out, total speed capped at 1x.',
  },
  {
    value: 'blend',
    label: 'Equal Blend',
    shortLabel: 'Blend',
    description: 'Smooth equal-weight average across all active brains capped at 1x speed.',
  },
  {
    value: 'winner',
    label: 'Stronger Wins',
    shortLabel: 'Winner',
    description: 'Whichever brain outputs the highest effort magnitude takes sole control each frame.',
  },
  {
    value: 'split_axes',
    label: 'Split Axes (X/Y)',
    shortLabel: 'X / Y',
    description:
      'Brains A, C, E drive horizontal X velocity while Brains B, D drive vertical Y velocity (capped at 1x speed).',
  },
  {
    value: 'alternate',
    label: 'Alternating Pulse',
    shortLabel: 'Pulse',
    description: 'Control cycles strictly through each active brain in turn every 10 frames.',
  },
];

export interface AgentBrainConfig {
  hiddenLayersCount: number;
  neuronsPerLayer: number;
  activationType: ActivationType;
  outputConfig: OutputConfig;
}

export interface SimParams {
  hiddenLayersCount: number;
  neuronsPerLayer: number;
  activationType: ActivationType;
  numEnemies: number;
  enemySpeedPct: number;
  enemySpeedMode: EnemySpeedMode;
  spawnMode: SpawnMode;
  simSpeed: number;
  turboMode: boolean;
  outputConfig?: OutputConfig;
  visualMode?: VisualMode;
  proceduralVisuals?: boolean;
  rewardEnemyDist: boolean;
  rewardWallDist: boolean;
  rewardGroupEnemies: boolean;
  rewardSpreadEnemies: boolean;
  rewardEdgeEnemies: boolean;
  rewardOppHeading: boolean;
  rewardSmoothVel: boolean;
  rewardSplitGap: boolean;
  rewardEdgeSense: boolean;
  rewardOrbitKite: boolean;
  rewardMatadorCut: boolean;
  rewardAnkleBreaker: boolean;
  rewardPincerEscape: boolean;
  rewardOpenCorridor: boolean;
  rewardWallSlingshot: boolean;
  rewardPackTangle: boolean;
  rewardSpideySense: boolean;
  rewardFarWallSense: boolean;
  rewardSplitGapCollect: boolean;
  rewardSplitGapPredict: boolean;
  rewardHit: boolean;
  rewardAvgEnemyCenter: boolean;
  rewardVectorStabbing: boolean;
  rewardTwitch: boolean;
  weightEnemyDist: number;
  weightWallDist: number;
  weightGroupEnemies: number;
  weightSpreadEnemies: number;
  weightEdgeEnemies: number;
  weightOppHeading: number;
  weightSmoothVel: number;
  weightSplitGap: number;
  weightEdgeSense: number;
  weightOrbitKite: number;
  weightMatadorCut: number;
  weightAnkleBreaker: number;
  weightPincerEscape: number;
  weightOpenCorridor: number;
  weightWallSlingshot: number;
  weightPackTangle: number;
  weightSpideySense: number;
  weightFarWallSense: number;
  weightSplitGapCollect: number;
  weightSplitGapPredict: number;
  weightHit: number;
  weightAvgEnemyCenter: number;
  weightVectorStabbing: number;
  weightTwitch: number;
}

export interface Enemy {
  x: number;
  y: number;
  spawnDelay?: number;
  entered?: boolean;
  speedPct?: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PhysicsSample {
  step: number;
  speedPx: number;
  speedPct: number;
  vxPx: number;
  vyPx: number;
  vxPct: number;
  vyPct: number;
  headingDeg: number;
  isMoving: boolean;
  accelPx: number;
  accelPct: number;
}

export interface FrozenRewardEntry {
  rewards: string[];
  generation: number;
}

interface ExtraBrainSlot {
  config: AgentBrainConfig;
  agent: NeuralNetwork | null;
  bestAgent: NeuralNetwork | null;
  population: NeuralNetwork[];
  popPairingOrder: number[];
  isFrozen: boolean;
  frozenRewardEntries: FrozenRewardEntry[];
  physicsHistory: PhysicsSample[];
  prevSpeedPx: number;
  lastValidHeadingDeg: number;
  headingRad: number;
  stamina: number;
  sprinting: boolean;
  lastOutputAux: number;
  splitVel: { vx: number; vy: number };
  splitFitness: number;
  bestFitness: number;
}

export class EvasionEngine {
  readonly playerSpeed = 3.5;
  readonly maxSteps = 18000; // 5 minutes at 60fps
  readonly popSize = 15;
  readonly maxPhysicsHistory = 600;

  simMode: SimMode = 'single';
  dualAgentMode = false;
  splitBrainMode = false;
  splitBrainCount = 2;
  activeInspectAgent: AgentId = 'A';
  netViewMode: NetViewMode = 'A';
  telepathyBridgeMode: TelepathyBridgeMode = 'dual';
  splitBrainMergeMode: SplitBrainMergeMode = 'collision_sum';
  splitBrainVelA: { vx: number; vy: number } = { vx: 0, vy: 0 };
  splitBrainVelB: { vx: number; vy: number } = { vx: 0, vy: 0 };
  splitBrainFitnessA = 0;
  splitBrainFitnessB = 0;
  bestFitnessA = -Infinity;
  bestFitnessB = -Infinity;
  splitBrainLastWinner: AgentId | 'both' = 'both';
  agentBParams: AgentBrainConfig;
  extraBrains: Record<ExtraBrainId, ExtraBrainSlot>;

  params: SimParams;
  enemySpeed: number;
  player: Player = { x: SIM_WIDTH / 2, y: SIM_HEIGHT / 2, vx: 0, vy: 0 };
  playerB: Player = { x: SIM_WIDTH * 0.65, y: SIM_HEIGHT / 2, vx: 0, vy: 0 };
  enemies: Enemy[] = [];
  agent: NeuralNetwork | null = null;
  agentB: NeuralNetwork | null = null;
  bestAgent: NeuralNetwork | null = null;
  bestAgentB: NeuralNetwork | null = null;
  population: NeuralNetwork[] = [];
  populationB: NeuralNetwork[] = [];
  private popPairingOrderB: number[] = [];
  popIndex = 0;
  generation = 1;
  stepCount = 0;
  currentFitness = 0;
  bestFitness = -Infinity;
  isFrozen = false;
  isFrozenB = false;
  frozenRewardEntries: FrozenRewardEntry[] = [];
  frozenRewardEntriesB: FrozenRewardEntry[] = [];
  prevVx = 0;
  prevVy = 0;
  emaVx = 0;
  emaVy = 0;
  emaPx = SIM_WIDTH / 2;
  emaPy = SIM_HEIGHT / 2;
  collectedSplitGaps: { pairKey: number; mx: number; my: number; step: number }[] = [];
  splitGapHistory: { angle: number; x: number; y: number }[] = [];
  physicsHistory: PhysicsSample[] = [];

  prevVxB = 0;
  prevVyB = 0;
  emaVxB = 0;
  emaVyB = 0;
  emaPxB = SIM_WIDTH * 0.65;
  emaPyB = SIM_HEIGHT / 2;
  collectedSplitGapsB: { pairKey: number; mx: number; my: number; step: number }[] = [];
  splitGapHistoryB: { angle: number; x: number; y: number }[] = [];
  physicsHistoryB: PhysicsSample[] = [];

  physicsVersion = 0;
  private prevSpeedPx = 0;
  private lastValidHeadingDeg = 0;
  private prevSpeedPxB = 0;
  private lastValidHeadingDegB = 0;
  private episodeId = 0;
  playerHeadingRad = 0;
  playerStamina = 1;
  playerSprinting = false;
  lastOutputAux = 0;
  playerBHeadingRad = 0;
  playerBStamina = 1;
  playerBSprinting = false;
  lastOutputAuxB = 0;
  prevRawOutputsA: number[] = [0, 0, 0, 0];
  prevRawOutputsB: number[] = [0, 0, 0, 0];
  private proceduralVisualsEngine = new ProceduralVisuals();
  private proceduralVisualsEngineB = new ProceduralVisuals();
  private proceduralAudioEngine = new ProceduralAudio();
  onStatsChange?: (statsText: string) => void;

  constructor(initialParams: SimParams, onStatsChange?: (statsText: string) => void) {
    const resolvedVisualMode: VisualMode =
      initialParams.visualMode ?? (initialParams.proceduralVisuals === false ? 'classic' : 'lizard');
    const resolvedOutputConfig: OutputConfig = initialParams.outputConfig ?? 'cartesian_2d';
    this.params = {
      ...initialParams,
      visualMode: resolvedVisualMode,
      outputConfig: resolvedOutputConfig,
    };
    const makeDefaultConfig = (): AgentBrainConfig => ({
      hiddenLayersCount: Math.max(1, initialParams.hiddenLayersCount || 1),
      neuronsPerLayer: Math.max(1, initialParams.neuronsPerLayer || 16),
      activationType: initialParams.activationType || 'tanh',
      outputConfig: resolvedOutputConfig,
    });
    const makeExtraSlot = (): ExtraBrainSlot => ({
      config: makeDefaultConfig(),
      agent: null,
      bestAgent: null,
      population: [],
      popPairingOrder: [],
      isFrozen: false,
      frozenRewardEntries: [],
      physicsHistory: [],
      prevSpeedPx: 0,
      lastValidHeadingDeg: 0,
      headingRad: 0,
      stamina: 1,
      sprinting: false,
      lastOutputAux: 0,
      splitVel: { vx: 0, vy: 0 },
      splitFitness: 0,
      bestFitness: -Infinity,
    });
    this.agentBParams = makeDefaultConfig();
    this.extraBrains = {
      C: makeExtraSlot(),
      D: makeExtraSlot(),
      E: makeExtraSlot(),
    };
    this.enemySpeed = this.playerSpeed * (this.params.enemySpeedPct / 100);
    this.onStatsChange = onStatsChange;
  }

  private sampleRaritySpeedPct(): number {
    const u1 = Math.max(1e-7, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const raw = Math.random() < 0.92 ? 60 + z * 13 : 1 + Math.random() * 89;
    return Math.min(90, Math.max(1, Math.round(raw)));
  }

  private spawnEnemy(spawnDelay = 0): Enemy {
    const speedPct =
      this.params.enemySpeedMode === 'rarity'
        ? this.sampleRaritySpeedPct()
        : this.params.enemySpeedPct;

    if (this.params.spawnMode === 'central') {
      let ex = 0;
      let ey = 0;
      let dist = 0;
      let attempts = 0;
      do {
        ex = 10 + Math.random() * (SIM_WIDTH - 20);
        ey = 10 + Math.random() * (SIM_HEIGHT - 20);
        const dA = Math.hypot(ex - this.player.x, ey - this.player.y);
        const dB = this.dualAgentMode ? Math.hypot(ex - this.playerB.x, ey - this.playerB.y) : Infinity;
        dist = Math.min(dA, dB);
        attempts++;
      } while (dist < 60 && attempts < 25);
      return { x: ex, y: ey, spawnDelay: 0, entered: true, speedPct };
    }

    const edge = Math.floor(Math.random() * 4);
    const offset = 14;
    let ex = 0;
    let ey = 0;
    if (edge === 0) {
      ex = Math.random() * SIM_WIDTH;
      ey = -offset;
    } else if (edge === 1) {
      ex = SIM_WIDTH + offset;
      ey = Math.random() * SIM_HEIGHT;
    } else if (edge === 2) {
      ex = Math.random() * SIM_WIDTH;
      ey = SIM_HEIGHT + offset;
    } else {
      ex = -offset;
      ey = Math.random() * SIM_HEIGHT;
    }
    return { x: ex, y: ey, spawnDelay, entered: false, speedPct };
  }

  private isExtraBrainId(id: AgentId): id is ExtraBrainId {
    return id === 'C' || id === 'D' || id === 'E';
  }

  getActiveBrainIds(): AgentId[] {
    if (this.splitBrainMode) {
      return ALL_BRAIN_IDS.slice(0, this.splitBrainCount);
    }
    if (this.dualAgentMode) {
      return ['A', 'B'];
    }
    return ['A'];
  }

  getActiveBrainCount(): number {
    return this.getActiveBrainIds().length;
  }

  hasTwoBrains(): boolean {
    return this.dualAgentMode || this.splitBrainMode;
  }

  hasMultipleBrains(): boolean {
    return this.dualAgentMode || this.splitBrainMode;
  }

  private clampActiveAgentId(agentId: AgentId = this.activeInspectAgent): AgentId {
    const active = this.getActiveBrainIds();
    return active.includes(agentId) ? agentId : 'A';
  }

  getSplitBrainVelocity(agentId: AgentId): { vx: number; vy: number } {
    if (agentId === 'B') return this.splitBrainVelB;
    if (this.isExtraBrainId(agentId)) return this.extraBrains[agentId].splitVel;
    return this.splitBrainVelA;
  }

  private setSplitBrainVelocity(agentId: AgentId, vx: number, vy: number): void {
    if (agentId === 'B') {
      this.splitBrainVelB = { vx, vy };
    } else if (this.isExtraBrainId(agentId)) {
      this.extraBrains[agentId].splitVel = { vx, vy };
    } else {
      this.splitBrainVelA = { vx, vy };
    }
  }

  getSplitBrainFitness(agentId: AgentId): number {
    if (agentId === 'B') return this.splitBrainFitnessB;
    if (this.isExtraBrainId(agentId)) return this.extraBrains[agentId].splitFitness;
    return this.splitBrainFitnessA;
  }

  private setSplitBrainFitness(agentId: AgentId, val: number): void {
    if (agentId === 'B') {
      this.splitBrainFitnessB = val;
    } else if (this.isExtraBrainId(agentId)) {
      this.extraBrains[agentId].splitFitness = val;
    } else {
      this.splitBrainFitnessA = val;
    }
  }

  getSplitBrainBestFitness(agentId: AgentId): number {
    if (agentId === 'B') return this.bestFitnessB;
    if (this.isExtraBrainId(agentId)) return this.extraBrains[agentId].bestFitness;
    return this.bestFitnessA;
  }

  private setSplitBrainBestFitness(agentId: AgentId, val: number): void {
    if (agentId === 'B') {
      this.bestFitnessB = val;
    } else if (this.isExtraBrainId(agentId)) {
      this.extraBrains[agentId].bestFitness = val;
    } else {
      this.bestFitnessA = val;
    }
  }

  getAgentMotorState(agentId: AgentId): {
    headingRad: number;
    stamina: number;
    sprinting: boolean;
    aux: number;
  } {
    if (agentId === 'B') {
      return {
        headingRad: this.playerBHeadingRad,
        stamina: this.playerBStamina,
        sprinting: this.playerBSprinting,
        aux: this.lastOutputAuxB,
      };
    }
    if (this.isExtraBrainId(agentId)) {
      const slot = this.extraBrains[agentId];
      return {
        headingRad: slot.headingRad,
        stamina: slot.stamina,
        sprinting: slot.sprinting,
        aux: slot.lastOutputAux,
      };
    }
    return {
      headingRad: this.playerHeadingRad,
      stamina: this.playerStamina,
      sprinting: this.playerSprinting,
      aux: this.lastOutputAux,
    };
  }

  private setAgentMotorState(
    agentId: AgentId,
    headingRad: number,
    stamina: number,
    sprinting: boolean,
    aux: number
  ): void {
    if (agentId === 'B') {
      this.playerBHeadingRad = headingRad;
      this.playerBStamina = stamina;
      this.playerBSprinting = sprinting;
      this.lastOutputAuxB = aux;
    } else if (this.isExtraBrainId(agentId)) {
      const slot = this.extraBrains[agentId];
      slot.headingRad = headingRad;
      slot.stamina = stamina;
      slot.sprinting = sprinting;
      slot.lastOutputAux = aux;
    } else {
      this.playerHeadingRad = headingRad;
      this.playerStamina = stamina;
      this.playerSprinting = sprinting;
      this.lastOutputAux = aux;
    }
  }

  formatStatsText(): string {
    const bestVal = Math.round(this.bestFitness === -Infinity ? 0 : this.bestFitness);
    if (this.splitBrainMode) {
      const parts = this.getActiveBrainIds()
        .map((id) => `${id}:${Math.round(this.getSplitBrainFitness(id))}`)
        .join(' ');
      return `${this.generation} | ${parts} | ${bestVal}`;
    }
    return `${this.generation} | ${Math.round(this.currentFitness)} | ${bestVal}`;
  }

  getTargetBrainConfig(agentId: AgentId = this.activeInspectAgent): AgentBrainConfig {
    if (agentId === 'B') return this.agentBParams;
    if (this.isExtraBrainId(agentId)) return this.extraBrains[agentId].config;
    return {
      hiddenLayersCount: this.params.hiddenLayersCount,
      neuronsPerLayer: this.params.neuronsPerLayer,
      activationType: this.params.activationType,
      outputConfig: this.params.outputConfig ?? 'cartesian_2d',
    };
  }

  getTargetAgent(agentId: AgentId = this.activeInspectAgent): NeuralNetwork | null {
    const targetId = this.clampActiveAgentId(agentId);
    if (targetId === 'B') return this.agentB;
    if (this.isExtraBrainId(targetId)) return this.extraBrains[targetId].agent;
    return this.agent;
  }

  getTargetBestAgent(agentId: AgentId = this.activeInspectAgent): NeuralNetwork | null {
    const targetId = this.clampActiveAgentId(agentId);
    if (targetId === 'B') return this.bestAgentB;
    if (this.isExtraBrainId(targetId)) return this.extraBrains[targetId].bestAgent;
    return this.bestAgent;
  }

  getTargetPopulation(agentId: AgentId = this.activeInspectAgent): NeuralNetwork[] {
    const targetId = this.clampActiveAgentId(agentId);
    if (targetId === 'B') return this.populationB;
    if (this.isExtraBrainId(targetId)) return this.extraBrains[targetId].population;
    return this.population;
  }

  getTargetPlayer(agentId: AgentId = this.activeInspectAgent): Player {
    return agentId === 'B' && this.dualAgentMode ? this.playerB : this.player;
  }

  getTargetPhysicsHistory(agentId: AgentId = this.activeInspectAgent): PhysicsSample[] {
    const targetId = this.clampActiveAgentId(agentId);
    if (targetId === 'B') return this.physicsHistoryB;
    if (this.isExtraBrainId(targetId)) return this.extraBrains[targetId].physicsHistory;
    return this.physicsHistory;
  }

  isAgentFrozen(agentId: AgentId = this.activeInspectAgent): boolean {
    const targetId = this.clampActiveAgentId(agentId);
    if (targetId === 'B') return this.isFrozenB;
    if (this.isExtraBrainId(targetId)) return this.extraBrains[targetId].isFrozen;
    return this.isFrozen;
  }

  doesAgentReceiveTelepathy(agentId: AgentId = this.activeInspectAgent): boolean {
    if (!this.dualAgentMode || this.splitBrainMode) return false;
    if (this.telepathyBridgeMode === 'dual') return true;
    return this.telepathyBridgeMode === 'a_to_b' ? agentId === 'B' : agentId === 'A';
  }

  getPartnerOutputCount(agentId: AgentId = this.activeInspectAgent): number {
    if (!this.doesAgentReceiveTelepathy(agentId)) return 0;
    const partnerId: AgentId = agentId === 'A' ? 'B' : 'A';
    return getOutputConfigSpec(this.getOutputConfig(partnerId)).outputSize;
  }

  getActiveInputIndices(agentId: AgentId = this.activeInspectAgent): number[] {
    const indices: number[] = [];
    const baseCount = 4 + this.params.numEnemies * 2;
    for (let i = 0; i < baseCount; i++) {
      indices.push(i);
    }
    if (this.dualAgentMode && !this.splitBrainMode) {
      const partnerOutCount = this.getPartnerOutputCount(agentId);
      for (let k = 0; k < partnerOutCount; k++) {
        indices.push(104 + k);
      }
    }
    return indices;
  }

  getActiveInputCount(agentId: AgentId = this.activeInspectAgent): number {
    const baseCount = 4 + this.params.numEnemies * 2;
    return this.dualAgentMode && !this.splitBrainMode
      ? baseCount + this.getPartnerOutputCount(agentId)
      : baseCount;
  }

  getInputLabel(idx: number, agentId: AgentId = this.activeInspectAgent): string {
    if (idx === 0) return 'px';
    if (idx === 1) return 'py';
    if (idx === 2) return 'vx';
    if (idx === 3) return 'vy';
    if (idx >= 104 && idx < 108) {
      const partnerId: AgentId = agentId === 'A' ? 'B' : 'A';
      const partnerLabels = this.getOutputLabels(partnerId);
      const outIdx = idx - 104;
      const outLbl = partnerLabels[outIdx] ?? `o${outIdx + 1}`;
      return `${partnerId}.${outLbl}`;
    }
    const enemyIdx = Math.floor((idx - 4) / 2) + 1;
    const axis = (idx - 4) % 2 === 0 ? 'dx' : 'dy';
    return `e${enemyIdx}.${axis}`;
  }

  setSpawnMode(mode: SpawnMode): void {
    this.params.spawnMode = mode;
  }

  setEnemySpeedMode(mode: EnemySpeedMode): void {
    this.params.enemySpeedMode = mode;
    if (mode === 'rarity') {
      for (const e of this.enemies) {
        e.speedPct = this.sampleRaritySpeedPct();
      }
    } else {
      for (const e of this.enemies) {
        e.speedPct = this.params.enemySpeedPct;
      }
    }
  }

  updateEnemyCount(targetCount: number): void {
    const clamped = Math.min(50, Math.max(1, targetCount));
    this.params.numEnemies = clamped;
    while (this.enemies.length < clamped) {
      this.enemies.push(this.spawnEnemy());
    }
    if (this.enemies.length > clamped) {
      this.enemies.length = clamped;
    }
  }

  updateEnemySpeedPct(pct: number): void {
    const clamped = Math.max(1, pct);
    this.params.enemySpeedPct = clamped;
    this.enemySpeed = this.playerSpeed * (clamped / 100);
  }

  private initPopulationB(): void {
    const layersB = Math.max(1, this.agentBParams.hiddenLayersCount || 1);
    const neuronsB = Math.max(1, this.agentBParams.neuronsPerLayer || 16);
    const activationB = this.agentBParams.activationType || 'tanh';
    const outSizeB = getOutputConfigSpec(this.agentBParams.outputConfig).outputSize;
    this.populationB = [];
    for (let i = 0; i < this.popSize; i++) {
      this.populationB.push(new NeuralNetwork(108, layersB, neuronsB, outSizeB, activationB));
    }
    this.popPairingOrderB = Array.from({ length: this.popSize }, (_, idx) => idx);
    this.bestAgentB = null;
    this.isFrozenB = false;
    this.frozenRewardEntriesB = [];
    this.agentB = this.populationB[0] ?? null;
  }

  private initExtraPopulation(id: ExtraBrainId): void {
    const slot = this.extraBrains[id];
    const layers = Math.max(1, slot.config.hiddenLayersCount || 1);
    const neurons = Math.max(1, slot.config.neuronsPerLayer || 16);
    const activation = slot.config.activationType || 'tanh';
    const outSize = getOutputConfigSpec(slot.config.outputConfig).outputSize;
    slot.population = [];
    for (let i = 0; i < this.popSize; i++) {
      slot.population.push(new NeuralNetwork(108, layers, neurons, outSize, activation));
    }
    slot.popPairingOrder = Array.from({ length: this.popSize }, (_, idx) => idx);
    slot.bestAgent = null;
    slot.isFrozen = false;
    slot.frozenRewardEntries = [];
    slot.agent = slot.population[0] ?? null;
  }

  private clearExtraPopulation(id: ExtraBrainId): void {
    const slot = this.extraBrains[id];
    slot.population = [];
    slot.popPairingOrder = [];
    slot.agent = null;
    slot.bestAgent = null;
    slot.isFrozen = false;
    slot.frozenRewardEntries = [];
    slot.splitFitness = 0;
    slot.bestFitness = -Infinity;
    slot.splitVel = { vx: 0, vy: 0 };
  }

  private ensureActivePopulations(): void {
    const activeIds = this.getActiveBrainIds();
    if (activeIds.includes('B')) {
      if (this.populationB.length !== this.popSize) {
        this.initPopulationB();
      } else if (this.popPairingOrderB.length !== this.popSize) {
        this.popPairingOrderB = Array.from({ length: this.popSize }, (_, idx) => idx);
      }
    }
    for (const id of EXTRA_BRAIN_IDS) {
      if (activeIds.includes(id)) {
        const slot = this.extraBrains[id];
        if (slot.population.length !== this.popSize) {
          this.initExtraPopulation(id);
        } else if (slot.popPairingOrder.length !== this.popSize) {
          slot.popPairingOrder = Array.from({ length: this.popSize }, (_, idx) => idx);
        }
      }
    }
  }

  setSimMode(mode: SimMode): void {
    if (this.simMode === mode) return;
    this.simMode = mode;
    this.dualAgentMode = mode === 'dual';
    this.splitBrainMode = mode === 'split_brain';
    if (this.hasTwoBrains()) {
      this.ensureActivePopulations();
      this.activeInspectAgent = this.clampActiveAgentId(this.activeInspectAgent);
      this.netViewMode = 'split';
    } else {
      this.activeInspectAgent = 'A';
      this.netViewMode = 'A';
    }
    this.bestFitness = -Infinity;
    this.bestFitnessA = -Infinity;
    this.bestFitnessB = -Infinity;
    this.bestAgent = null;
    this.bestAgentB = null;
    this.splitBrainFitnessA = 0;
    this.splitBrainFitnessB = 0;
    this.splitBrainVelA = { vx: 0, vy: 0 };
    this.splitBrainVelB = { vx: 0, vy: 0 };
    for (const id of EXTRA_BRAIN_IDS) {
      const slot = this.extraBrains[id];
      slot.bestFitness = -Infinity;
      slot.bestAgent = null;
      slot.splitFitness = 0;
      slot.splitVel = { vx: 0, vy: 0 };
    }
    this.splitBrainLastWinner = 'both';
    this.proceduralVisualsEngine.clearAllEffects();
    this.proceduralVisualsEngineB.clearAllEffects();
    this.startEpisode();
    this.onStatsChange?.(this.formatStatsText());
  }

  setSplitBrainCount(count: number): void {
    const clamped = Math.min(MAX_SPLIT_BRAINS, Math.max(2, Math.round(count)));
    if (this.splitBrainCount === clamped) return;
    this.splitBrainCount = clamped;
    const activeIds = this.getActiveBrainIds();
    if (!activeIds.includes(this.activeInspectAgent)) {
      this.activeInspectAgent = 'A';
    }
    if (this.netViewMode !== 'split' && !activeIds.includes(this.netViewMode)) {
      this.netViewMode = this.hasTwoBrains() ? 'split' : 'A';
    }
    if (this.splitBrainMode) {
      this.ensureActivePopulations();
      this.bestFitness = -Infinity;
      this.bestFitnessA = -Infinity;
      this.bestFitnessB = -Infinity;
      this.bestAgent = null;
      this.bestAgentB = null;
      for (const id of EXTRA_BRAIN_IDS) {
        this.extraBrains[id].bestFitness = -Infinity;
        this.extraBrains[id].bestAgent = null;
      }
      this.startEpisode();
      this.onStatsChange?.(this.formatStatsText());
    }
  }

  setDualAgentMode(enabled: boolean): void {
    this.setSimMode(enabled ? 'dual' : 'single');
  }

  setSplitBrainMergeMode(mode: SplitBrainMergeMode): void {
    this.splitBrainMergeMode = mode;
  }

  setActiveInspectAgent(agentId: AgentId): void {
    this.activeInspectAgent = this.clampActiveAgentId(agentId);
  }

  setNetViewMode(mode: NetViewMode): void {
    if (!this.hasTwoBrains()) {
      this.netViewMode = 'A';
      return;
    }
    const activeIds = this.getActiveBrainIds();
    if (mode !== 'split' && !activeIds.includes(mode)) {
      this.netViewMode = 'split';
      return;
    }
    this.netViewMode = mode;
    if (mode !== 'split') {
      this.activeInspectAgent = mode;
    }
  }

  setTelepathyBridgeMode(mode: TelepathyBridgeMode): void {
    this.telepathyBridgeMode = mode;
    if (this.agent && this.agent.layerValues.length > 0) {
      this.agent.predict(this.buildCurrentInputs('A'));
    }
    if (this.hasTwoBrains() && this.agentB && this.agentB.layerValues.length > 0) {
      this.agentB.predict(this.buildCurrentInputs('B'));
    }
  }

  resetSimulation(): void {
    const layers = Math.max(1, this.params.hiddenLayersCount || 1);
    const neurons = Math.max(1, this.params.neuronsPerLayer || 16);
    const activation = this.params.activationType || 'tanh';
    this.params.hiddenLayersCount = layers;
    this.params.neuronsPerLayer = neurons;
    this.params.numEnemies = Math.min(50, Math.max(1, this.params.numEnemies || 3));
    this.updateEnemySpeedPct(this.params.enemySpeedPct || 80);

    this.population = [];
    const outputSize = getOutputConfigSpec(this.getOutputConfig('A')).outputSize;
    for (let i = 0; i < this.popSize; i++) {
      this.population.push(new NeuralNetwork(108, layers, neurons, outputSize, activation));
    }
    const activeIds = this.getActiveBrainIds();
    if (this.hasTwoBrains()) {
      this.initPopulationB();
    } else {
      this.populationB = [];
      this.popPairingOrderB = [];
      this.agentB = null;
      this.bestAgentB = null;
      this.isFrozenB = false;
      this.frozenRewardEntriesB = [];
    }

    for (const id of EXTRA_BRAIN_IDS) {
      if (activeIds.includes(id)) {
        this.initExtraPopulation(id);
      } else {
        this.clearExtraPopulation(id);
      }
    }

    this.popIndex = 0;
    this.generation = 1;
    this.bestFitness = -Infinity;
    this.bestFitnessA = -Infinity;
    this.bestFitnessB = -Infinity;
    this.bestAgent = null;
    this.isFrozen = false;
    this.frozenRewardEntries = [];
    this.proceduralVisualsEngine.clearAllEffects();
    this.proceduralVisualsEngineB.clearAllEffects();
    this.startEpisode();
    this.onStatsChange?.(this.formatStatsText());
  }

  startEpisode(): void {
    this.player.x = this.dualAgentMode ? SIM_WIDTH * 0.35 : SIM_WIDTH / 2;
    this.player.y = SIM_HEIGHT / 2;
    this.player.vx = 0;
    this.player.vy = 0;

    this.playerB.x = SIM_WIDTH * 0.65;
    this.playerB.y = SIM_HEIGHT / 2;
    this.playerB.vx = 0;
    this.playerB.vy = 0;

    this.enemies = [];
    if (this.params.spawnMode === 'central') {
      for (let i = 0; i < this.params.numEnemies; i++) {
        this.enemies.push(this.spawnEnemy(0));
      }
    } else {
      const maxStagger = Math.min(75, 16 + this.params.numEnemies * 5);
      for (let i = 0; i < this.params.numEnemies; i++) {
        const delay = i === 0 ? 0 : Math.floor(4 + Math.random() * maxStagger);
        this.enemies.push(this.spawnEnemy(delay));
      }
    }

    this.agent = this.population[this.popIndex] ?? null;
    if (this.hasTwoBrains()) {
      this.ensureActivePopulations();
      const pairIdxB = this.popPairingOrderB[this.popIndex] ?? this.popIndex;
      this.agentB = this.populationB[pairIdxB] ?? this.populationB[0] ?? null;
      const activeIds = this.getActiveBrainIds();
      for (const id of EXTRA_BRAIN_IDS) {
        const slot = this.extraBrains[id];
        if (activeIds.includes(id)) {
          const pairIdx = slot.popPairingOrder[this.popIndex] ?? this.popIndex;
          slot.agent = slot.population[pairIdx] ?? slot.population[0] ?? null;
        } else {
          slot.agent = null;
        }
      }
    } else {
      this.agentB = null;
      for (const id of EXTRA_BRAIN_IDS) {
        this.extraBrains[id].agent = null;
      }
    }

    this.stepCount = 0;
    this.currentFitness = 0;
    this.splitBrainFitnessA = 0;
    this.splitBrainFitnessB = 0;
    this.splitBrainVelA = { vx: 0, vy: 0 };
    this.splitBrainVelB = { vx: 0, vy: 0 };
    this.splitBrainLastWinner = 'both';
    this.prevVx = 0;
    this.prevVy = 0;
    this.emaVx = 0;
    this.emaVy = 0;
    this.emaPx = this.player.x;
    this.emaPy = this.player.y;
    this.collectedSplitGaps = [];
    this.splitGapHistory = [];
    this.physicsHistory = [];
    this.prevSpeedPx = 0;
    this.lastValidHeadingDeg = 0;
    this.playerHeadingRad = 0;
    this.playerStamina = 1;
    this.playerSprinting = false;
    this.lastOutputAux = 0;

    this.prevVxB = 0;
    this.prevVyB = 0;
    this.emaVxB = 0;
    this.emaVyB = 0;
    this.emaPxB = this.playerB.x;
    this.emaPyB = this.playerB.y;
    this.collectedSplitGapsB = [];
    this.splitGapHistoryB = [];
    this.physicsHistoryB = [];
    this.prevSpeedPxB = 0;
    this.lastValidHeadingDegB = 0;
    this.playerBHeadingRad = this.splitBrainMode ? 0 : Math.PI;
    this.playerBStamina = 1;
    this.playerBSprinting = false;
    this.lastOutputAuxB = 0;

    for (const id of EXTRA_BRAIN_IDS) {
      const slot = this.extraBrains[id];
      slot.splitFitness = 0;
      slot.splitVel = { vx: 0, vy: 0 };
      slot.physicsHistory = [];
      slot.prevSpeedPx = 0;
      slot.lastValidHeadingDeg = 0;
      slot.headingRad = 0;
      slot.stamina = 1;
      slot.sprinting = false;
      slot.lastOutputAux = 0;
    }

    this.prevRawOutputsA = [0, 0, 0, 0];
    this.prevRawOutputsB = [0, 0, 0, 0];

    this.episodeId++;
    this.physicsVersion++;
    this.stepProceduralVisuals();
  }

  getOutputConfig(agentId: AgentId = 'A'): OutputConfig {
    if (agentId === 'B') return this.agentBParams.outputConfig;
    if (this.isExtraBrainId(agentId)) return this.extraBrains[agentId].config.outputConfig;
    return this.params.outputConfig ?? 'cartesian_2d';
  }

  getOutputLabels(agentId: AgentId = 'A'): string[] {
    return getOutputConfigSpec(this.getOutputConfig(agentId)).nodeLabels;
  }

  setOutputConfig(config: OutputConfig, agentId: AgentId = this.activeInspectAgent): void {
    const targetId = this.clampActiveAgentId(agentId);
    const targetSize = getOutputConfigSpec(config).outputSize;
    if (targetId === 'B') {
      this.agentBParams.outputConfig = config;
      for (let i = 0; i < this.populationB.length; i++) {
        this.populationB[i].resizeOutputSize(targetSize, i < 3);
      }
      if (this.bestAgentB) {
        this.bestAgentB.resizeOutputSize(targetSize, true);
      }
      if (this.agentB && this.agentB.layerValues.length > 0) {
        this.agentB.predict(this.agentB.layerValues[0]);
      }
      this.playerBSprinting = false;
      this.playerBStamina = 1;
      this.lastOutputAuxB = 0;
      this.prevRawOutputsB = [0, 0, 0, 0];
      return;
    }

    if (this.isExtraBrainId(targetId)) {
      const slot = this.extraBrains[targetId];
      slot.config.outputConfig = config;
      for (let i = 0; i < slot.population.length; i++) {
        slot.population[i].resizeOutputSize(targetSize, i < 3);
      }
      if (slot.bestAgent) {
        slot.bestAgent.resizeOutputSize(targetSize, true);
      }
      if (slot.agent && slot.agent.layerValues.length > 0) {
        slot.agent.predict(slot.agent.layerValues[0]);
      }
      slot.sprinting = false;
      slot.stamina = 1;
      slot.lastOutputAux = 0;
      return;
    }

    this.params.outputConfig = config;
    for (let i = 0; i < this.population.length; i++) {
      this.population[i].resizeOutputSize(targetSize, i < 3);
    }
    if (this.bestAgent) {
      this.bestAgent.resizeOutputSize(targetSize, true);
    }
    if (this.agent && this.agent.layerValues.length > 0) {
      this.agent.predict(this.agent.layerValues[0]);
    }
    this.playerSprinting = false;
    this.playerStamina = 1;
    this.lastOutputAux = 0;
    this.prevRawOutputsA = [0, 0, 0, 0];
  }

  private decodeVelocityOutputs(
    rawOutputs: number[],
    baseVx: number,
    baseVy: number,
    baseHeadingRad: number,
    baseStamina: number,
    wasSprinting: boolean,
    modeOverride?: OutputConfig
  ): {
    vx: number;
    vy: number;
    headingRad: number;
    stamina: number;
    sprinting: boolean;
    aux: number;
  } {
    const mode = modeOverride ?? this.getOutputConfig('A');
    const clamp1 = (v: number) => Math.max(-1, Math.min(1, Number.isFinite(v) ? v : 0));

    if (mode === 'sprint_burst') {
      let ax = clamp1(rawOutputs[0] ?? 0);
      let ay = clamp1(rawOutputs[1] ?? 0);
      const sprintOut = clamp1(rawOutputs[2] ?? -1);
      const mag = Math.hypot(ax, ay);
      if (mag > 1) {
        ax /= mag;
        ay /= mag;
      }

      const canSprint =
        (wasSprinting && baseStamina > 0.02) || (!wasSprinting && baseStamina >= 0.2);
      const wantsSprint = sprintOut > 0.15 && mag > 0.05;
      let nextStamina = baseStamina;
      let nextSprinting = false;
      let speedMult = 1;

      if (wantsSprint && canSprint) {
        nextSprinting = true;
        nextStamina = Math.max(0, baseStamina - 0.024);
        const boostT = Math.min(1, Math.max(0, (sprintOut - 0.15) / 0.85));
        speedMult = 1 + 0.45 * boostT;
      } else {
        nextStamina = Math.min(1, baseStamina + 0.008);
      }

      const vx = ax * this.playerSpeed * speedMult;
      const vy = ay * this.playerSpeed * speedMult;
      const headingRad = Math.hypot(vx, vy) > 0.05 ? Math.atan2(vy, vx) : baseHeadingRad;
      return {
        vx,
        vy,
        headingRad,
        stamina: nextStamina,
        sprinting: nextSprinting,
        aux: sprintOut,
      };
    }

    if (mode === 'dash_3d') {
      let ax = clamp1(rawOutputs[0] ?? 0);
      let ay = clamp1(rawOutputs[1] ?? 0);
      const burstOut = clamp1(rawOutputs[2] ?? -1);
      const mag = Math.hypot(ax, ay);
      if (mag > 1) {
        ax /= mag;
        ay /= mag;
      }

      let nextStamina = baseStamina;
      let nextSprinting = false;
      let speedMult = 1;
      let dirX = ax;
      let dirY = ay;

      if (wasSprinting && baseStamina > 0.02) {
        nextSprinting = true;
        nextStamina = Math.max(0, baseStamina - 0.1);
        if (nextStamina <= 0.02) nextSprinting = false;
        speedMult = 2.15;
        if (mag > 0.05) {
          dirX = ax / mag;
          dirY = ay / mag;
        } else {
          dirX = Math.cos(baseHeadingRad);
          dirY = Math.sin(baseHeadingRad);
        }
      } else if (!wasSprinting && baseStamina >= 0.95 && burstOut > 0.35 && mag > 0.05) {
        nextSprinting = true;
        nextStamina = Math.max(0, baseStamina - 0.1);
        speedMult = 2.15;
        dirX = ax / mag;
        dirY = ay / mag;
      } else {
        nextStamina = Math.min(1, baseStamina + 0.015);
      }

      const vx = dirX * this.playerSpeed * speedMult;
      const vy = dirY * this.playerSpeed * speedMult;
      const headingRad = Math.hypot(vx, vy) > 0.05 ? Math.atan2(vy, vx) : baseHeadingRad;
      return {
        vx,
        vy,
        headingRad,
        stamina: nextStamina,
        sprinting: nextSprinting,
        aux: burstOut,
      };
    }

    if (mode === 'throttle_3d') {
      const dx = clamp1(rawOutputs[0] ?? 0);
      const dy = clamp1(rawOutputs[1] ?? 0);
      const spdOut = clamp1(rawOutputs[2] ?? 0);
      const dMag = Math.hypot(dx, dy);
      const ux = dMag > 1e-4 ? dx / dMag : 0;
      const uy = dMag > 1e-4 ? dy / dMag : 0;
      const throttle = Math.max(0, Math.min(1, (spdOut + 1) * 0.5));
      const vx = ux * this.playerSpeed * throttle;
      const vy = uy * this.playerSpeed * throttle;
      const headingRad = dMag > 1e-4 ? Math.atan2(uy, ux) : baseHeadingRad;
      return {
        vx,
        vy,
        headingRad,
        stamina: 1,
        sprinting: false,
        aux: spdOut,
      };
    }

    if (mode === 'drift_3d') {
      let tx = clamp1(rawOutputs[0] ?? 0);
      let ty = clamp1(rawOutputs[1] ?? 0);
      const gripOut = clamp1(rawOutputs[2] ?? 1);
      const mag = Math.hypot(tx, ty);
      if (mag > 1) {
        tx /= mag;
        ty /= mag;
      }
      const gripNorm = Math.max(0, Math.min(1, (gripOut + 1) * 0.5));
      const alpha = 0.06 + 0.94 * (gripNorm * gripNorm);
      const targetVx = tx * this.playerSpeed;
      const targetVy = ty * this.playerSpeed;
      const vx = baseVx + (targetVx - baseVx) * alpha;
      const vy = baseVy + (targetVy - baseVy) * alpha;
      const headingRad = Math.hypot(vx, vy) > 0.05 ? Math.atan2(vy, vx) : baseHeadingRad;
      return {
        vx,
        vy,
        headingRad,
        stamina: 1,
        sprinting: false,
        aux: gripOut,
      };
    }

    if (mode === 'polar_2d') {
      const turn = clamp1(rawOutputs[0] ?? 0);
      const thrust = clamp1(rawOutputs[1] ?? 0);
      let nextHeading = baseHeadingRad + turn * 0.18;
      while (nextHeading > Math.PI) nextHeading -= Math.PI * 2;
      while (nextHeading < -Math.PI) nextHeading += Math.PI * 2;

      const vx = Math.cos(nextHeading) * thrust * this.playerSpeed;
      const vy = Math.sin(nextHeading) * thrust * this.playerSpeed;
      return {
        vx,
        vy,
        headingRad: nextHeading,
        stamina: 1,
        sprinting: false,
        aux: thrust,
      };
    }

    if (mode === 'car_2d') {
      const steer = clamp1(rawOutputs[0] ?? 0);
      const gas = clamp1(rawOutputs[1] ?? 0);
      const prevSignedSpeed =
        baseVx * Math.cos(baseHeadingRad) + baseVy * Math.sin(baseHeadingRad);
      const targetSpeed = gas * this.playerSpeed;
      const nextSignedSpeed = prevSignedSpeed + (targetSpeed - prevSignedSpeed) * 0.35;
      const speedRatio = this.playerSpeed > 0 ? nextSignedSpeed / this.playerSpeed : 0;

      let nextHeading = baseHeadingRad + steer * 0.16 * speedRatio;
      while (nextHeading > Math.PI) nextHeading -= Math.PI * 2;
      while (nextHeading < -Math.PI) nextHeading += Math.PI * 2;

      const vx = Math.cos(nextHeading) * nextSignedSpeed;
      const vy = Math.sin(nextHeading) * nextSignedSpeed;
      return {
        vx,
        vy,
        headingRad: nextHeading,
        stamina: 1,
        sprinting: false,
        aux: speedRatio,
      };
    }

    if (mode === 'asteroids_2d') {
      const turn = clamp1(rawOutputs[0] ?? 0);
      const boost = Math.max(0, clamp1(rawOutputs[1] ?? 0));
      let nextHeading = baseHeadingRad + turn * 0.18;
      while (nextHeading > Math.PI) nextHeading -= Math.PI * 2;
      while (nextHeading < -Math.PI) nextHeading += Math.PI * 2;

      const accel = 0.28 * this.playerSpeed * boost;
      let vx = baseVx * 0.975 + Math.cos(nextHeading) * accel;
      let vy = baseVy * 0.975 + Math.sin(nextHeading) * accel;
      const maxSpd = this.playerSpeed * 1.35;
      const spd = Math.hypot(vx, vy);
      if (spd > maxSpd) {
        vx = (vx / spd) * maxSpd;
        vy = (vy / spd) * maxSpd;
      }
      return {
        vx,
        vy,
        headingRad: nextHeading,
        stamina: 1,
        sprinting: false,
        aux: boost,
      };
    }

    if (mode === 'compass_2d') {
      const angleOut = clamp1(rawOutputs[0] ?? 0);
      const spdOut = clamp1(rawOutputs[1] ?? 0);
      const nextHeading = angleOut * Math.PI;
      const throttle = Math.max(0, Math.min(1, (spdOut + 1) * 0.5));
      const vx = Math.cos(nextHeading) * this.playerSpeed * throttle;
      const vy = Math.sin(nextHeading) * this.playerSpeed * throttle;
      return {
        vx,
        vy,
        headingRad: nextHeading,
        stamina: 1,
        sprinting: false,
        aux: angleOut,
      };
    }

    if (mode === 'etch_2d') {
      const rawX = clamp1(rawOutputs[0] ?? 0);
      const rawY = clamp1(rawOutputs[1] ?? 0);
      let ax = 0;
      let ay = 0;
      let axisLock = 0;
      if (Math.abs(rawX) >= 0.05 || Math.abs(rawY) >= 0.05) {
        if (Math.abs(rawX) >= Math.abs(rawY)) {
          ax = rawX;
          axisLock = 1;
        } else {
          ay = rawY;
          axisLock = -1;
        }
      }
      const vx = ax * this.playerSpeed;
      const vy = ay * this.playerSpeed;
      const headingRad = Math.hypot(vx, vy) > 0.05 ? Math.atan2(vy, vx) : baseHeadingRad;
      return {
        vx,
        vy,
        headingRad,
        stamina: 1,
        sprinting: false,
        aux: axisLock,
      };
    }

    if (mode === 'polar_3d') {
      const turn = clamp1(rawOutputs[0] ?? 0);
      const thrust = clamp1(rawOutputs[1] ?? 0);
      const strafe = clamp1(rawOutputs[2] ?? 0);
      let nextHeading = baseHeadingRad + turn * 0.16;
      while (nextHeading > Math.PI) nextHeading -= Math.PI * 2;
      while (nextHeading < -Math.PI) nextHeading += Math.PI * 2;

      const fx = Math.cos(nextHeading);
      const fy = Math.sin(nextHeading);
      const rx = -fy;
      const ry = fx;
      let bx = thrust;
      let by = strafe;
      const bMag = Math.hypot(bx, by);
      if (bMag > 1) {
        bx /= bMag;
        by /= bMag;
      }
      const vx = (fx * bx + rx * by) * this.playerSpeed;
      const vy = (fy * bx + ry * by) * this.playerSpeed;
      return {
        vx,
        vy,
        headingRad: nextHeading,
        stamina: 1,
        sprinting: false,
        aux: strafe,
      };
    }

    if (mode === 'spin_frame_3d') {
      let lx = clamp1(rawOutputs[0] ?? 0);
      let ly = clamp1(rawOutputs[1] ?? 0);
      const turn = clamp1(rawOutputs[2] ?? 0);
      const mag = Math.hypot(lx, ly);
      if (mag > 1) {
        lx /= mag;
        ly /= mag;
      }
      let nextHeading = baseHeadingRad + turn * 0.16;
      while (nextHeading > Math.PI) nextHeading -= Math.PI * 2;
      while (nextHeading < -Math.PI) nextHeading += Math.PI * 2;

      const cosH = Math.cos(nextHeading);
      const sinH = Math.sin(nextHeading);
      const vx = (lx * cosH - ly * sinH) * this.playerSpeed;
      const vy = (lx * sinH + ly * cosH) * this.playerSpeed;
      return {
        vx,
        vy,
        headingRad: nextHeading,
        stamina: 1,
        sprinting: false,
        aux: turn,
      };
    }

    if (mode === 'hybrid_4d') {
      const ax = clamp1(rawOutputs[0] ?? 0);
      const ay = clamp1(rawOutputs[1] ?? 0);
      const turn = clamp1(rawOutputs[2] ?? 0);
      const thrust = clamp1(rawOutputs[3] ?? 0);
      let nextHeading = baseHeadingRad + turn * 0.16;
      while (nextHeading > Math.PI) nextHeading -= Math.PI * 2;
      while (nextHeading < -Math.PI) nextHeading += Math.PI * 2;

      let rx = ax + Math.cos(nextHeading) * thrust;
      let ry = ay + Math.sin(nextHeading) * thrust;
      const rMag = Math.hypot(rx, ry);
      if (rMag > 1) {
        rx /= rMag;
        ry /= rMag;
      }
      const vx = rx * this.playerSpeed;
      const vy = ry * this.playerSpeed;
      return {
        vx,
        vy,
        headingRad: nextHeading,
        stamina: 1,
        sprinting: false,
        aux: thrust,
      };
    }

    if (mode === 'thrusters_4d') {
      const px = Math.max(0, clamp1(rawOutputs[0] ?? 0));
      const nx = Math.max(0, clamp1(rawOutputs[1] ?? 0));
      const py = Math.max(0, clamp1(rawOutputs[2] ?? 0));
      const ny = Math.max(0, clamp1(rawOutputs[3] ?? 0));
      let ax = px - nx;
      let ay = py - ny;
      const mag = Math.hypot(ax, ay);
      if (mag > 1) {
        ax /= mag;
        ay /= mag;
      }
      const vx = ax * this.playerSpeed;
      const vy = ay * this.playerSpeed;
      const headingRad = Math.hypot(vx, vy) > 0.05 ? Math.atan2(vy, vx) : baseHeadingRad;
      return {
        vx,
        vy,
        headingRad,
        stamina: 1,
        sprinting: false,
        aux: 0,
      };
    }

    // Default: cartesian_2d
    let ax = clamp1(rawOutputs[0] ?? 0);
    let ay = clamp1(rawOutputs[1] ?? 0);
    const mag = Math.hypot(ax, ay);
    if (mag > 1) {
      ax /= mag;
      ay /= mag;
    }
    const vx = ax * this.playerSpeed;
    const vy = ay * this.playerSpeed;
    const headingRad = Math.hypot(vx, vy) > 0.05 ? Math.atan2(vy, vx) : baseHeadingRad;
    return {
      vx,
      vy,
      headingRad,
      stamina: 1,
      sprinting: false,
      aux: 0,
    };
  }

  getVisualMode(): VisualMode {
    if (this.params.visualMode) return this.params.visualMode;
    return this.params.proceduralVisuals === false ? 'classic' : 'lizard';
  }

  setVisualMode(mode: VisualMode): void {
    this.params.visualMode = mode;
    this.params.proceduralVisuals = mode !== 'classic';
    if (mode === 'classic') {
      this.proceduralVisualsEngine.clearAllEffects();
      this.proceduralVisualsEngineB.clearAllEffects();
      this.proceduralAudioEngine.setFrameAudible(false);
    } else {
      this.stepProceduralVisuals();
    }
  }

  unlockAudio(): void {
    this.proceduralAudioEngine.unlock();
  }

  setAudioSettings(enabled: boolean, volume: number): void {
    this.proceduralAudioEngine.setSettings(enabled, volume);
  }

  silenceContinuousAudio(): void {
    this.proceduralAudioEngine.silenceContinuous();
  }

  disposeAudio(): void {
    this.proceduralAudioEngine.dispose();
  }

  private hasBodyHeadingMode(outCfg: OutputConfig): boolean {
    return (
      outCfg === 'polar_2d' ||
      outCfg === 'car_2d' ||
      outCfg === 'asteroids_2d' ||
      outCfg === 'compass_2d' ||
      outCfg === 'polar_3d' ||
      outCfg === 'spin_frame_3d' ||
      outCfg === 'hybrid_4d'
    );
  }

  private hasChargeBarMode(outCfg: OutputConfig): boolean {
    return outCfg === 'sprint_burst' || outCfg === 'dash_3d';
  }

  stepProceduralVisuals(): void {
    const mode = this.getVisualMode();
    if (mode === 'classic') return;
    const outCfgA = this.getOutputConfig('A');
    const hasBodyHeadingA = this.hasBodyHeadingMode(outCfgA);
    const hasChargeBarA = this.hasChargeBarMode(outCfgA);
    this.proceduralVisualsEngine.step({
      player: this.player,
      partnerPlayer: this.dualAgentMode ? this.playerB : undefined,
      playerSpeed: this.playerSpeed,
      enemies: this.enemies,
      simWidth: SIM_WIDTH,
      simHeight: SIM_HEIGHT,
      episodeId: this.episodeId,
      visualMode: mode,
      palette: this.splitBrainMode ? 'split' : this.dualAgentMode ? 'cyan' : 'default',
      splitPaletteColors: this.splitBrainMode
        ? this.getActiveBrainIds().map((id) => BRAIN_COLORS[id].hex)
        : undefined,
      headingOverride: hasBodyHeadingA ? this.playerHeadingRad : undefined,
      stamina: hasChargeBarA ? this.playerStamina : 1,
      isSprinting: hasChargeBarA && this.playerSprinting,
    });

    if (this.dualAgentMode) {
      const outCfgB = this.getOutputConfig('B');
      const hasBodyHeadingB = this.hasBodyHeadingMode(outCfgB);
      const hasChargeBarB = this.hasChargeBarMode(outCfgB);
      this.proceduralVisualsEngineB.step({
        player: this.playerB,
        partnerPlayer: this.player,
        playerSpeed: this.playerSpeed,
        enemies: this.enemies,
        simWidth: SIM_WIDTH,
        simHeight: SIM_HEIGHT,
        episodeId: this.episodeId,
        visualMode: mode,
        palette: 'amber',
        skipEnemies: true,
        headingOverride: hasBodyHeadingB ? this.playerBHeadingRad : undefined,
        stamina: hasChargeBarB ? this.playerBStamina : 1,
        isSprinting: hasChargeBarB && this.playerBSprinting,
      });
    }
  }

  clearPhysicsHistory(agentId?: AgentId): void {
    const clearOne = (id: AgentId) => {
      if (id === 'A') {
        const currSpeed = Math.hypot(this.player.vx, this.player.vy);
        this.physicsHistory = [];
        this.prevSpeedPx = currSpeed;
      } else if (id === 'B') {
        const currSpeedB = Math.hypot(this.playerB.vx, this.playerB.vy);
        this.physicsHistoryB = [];
        this.prevSpeedPxB = currSpeedB;
      } else if (this.isExtraBrainId(id)) {
        const slot = this.extraBrains[id];
        slot.physicsHistory = [];
        slot.prevSpeedPx = Math.hypot(this.player.vx, this.player.vy);
      }
    };
    if (agentId) {
      clearOne(agentId);
    } else {
      for (const id of ALL_BRAIN_IDS) clearOne(id);
    }
    this.physicsVersion++;
  }

  private recordPhysicsSampleForAgent(agentId: AgentId): void {
    const useSplitVec = this.splitBrainMode;
    const pl = agentId === 'B' && this.dualAgentMode ? this.playerB : this.player;
    const history = this.getTargetPhysicsHistory(agentId);
    const splitVel = this.getSplitBrainVelocity(agentId);
    const vxPx = useSplitVec ? splitVel.vx : pl.vx;
    const vyPx = useSplitVec ? splitVel.vy : pl.vy;
    const speedPx = Math.hypot(vxPx, vyPx);
    const invMax = this.playerSpeed > 0 ? 1 / this.playerSpeed : 0;
    const speedPct = speedPx * invMax * 100;
    const vxPct = vxPx * invMax * 100;
    const vyPct = vyPx * invMax * 100;
    const isMoving = speedPx > 1e-3;

    const prevHeading =
      agentId === 'B'
        ? this.lastValidHeadingDegB
        : this.isExtraBrainId(agentId)
        ? this.extraBrains[agentId].lastValidHeadingDeg
        : this.lastValidHeadingDeg;
    const headingDeg = isMoving ? (Math.atan2(vyPx, vxPx) * 180) / Math.PI : prevHeading;
    if (isMoving) {
      if (agentId === 'B') this.lastValidHeadingDegB = headingDeg;
      else if (this.isExtraBrainId(agentId)) this.extraBrains[agentId].lastValidHeadingDeg = headingDeg;
      else this.lastValidHeadingDeg = headingDeg;
    }

    const prevSpd =
      agentId === 'B'
        ? this.prevSpeedPxB
        : this.isExtraBrainId(agentId)
        ? this.extraBrains[agentId].prevSpeedPx
        : this.prevSpeedPx;
    const accelPx = history.length === 0 ? 0 : speedPx - prevSpd;
    const accelPct = accelPx * invMax * 100;
    if (agentId === 'B') this.prevSpeedPxB = speedPx;
    else if (this.isExtraBrainId(agentId)) this.extraBrains[agentId].prevSpeedPx = speedPx;
    else this.prevSpeedPx = speedPx;

    history.push({
      step: this.stepCount,
      speedPx,
      speedPct,
      vxPx,
      vyPx,
      vxPct,
      vyPct,
      headingDeg,
      isMoving,
      accelPx,
      accelPct,
    });
    if (history.length > this.maxPhysicsHistory) {
      history.shift();
    }
  }

  private recordPhysicsSample(): void {
    for (const id of this.getActiveBrainIds()) {
      this.recordPhysicsSampleForAgent(id);
    }
    this.physicsVersion++;
  }

  private computeSplitGapAngle(
    activeEnemies: Enemy[],
    px = this.player.x,
    py = this.player.y
  ): number | null {
    if (activeEnemies.length === 0) return null;
    const sortedNearby = activeEnemies
      .map((e) => {
        const dx = e.x - px;
        const dy = e.y - py;
        return { dist: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) };
      })
      .sort((a, b) => a.dist - b.dist);

    const withinRadius = sortedNearby.filter((e) => e.dist <= 220);
    const nearby =
      withinRadius.length >= 2
        ? withinRadius.slice(0, 12)
        : sortedNearby.slice(0, Math.min(sortedNearby.length, 8));

    if (nearby.length === 1) {
      return nearby[0].angle + Math.PI;
    }

    const angles = nearby.map((e) => e.angle).sort((a, b) => a - b);
    let maxGap = -1;
    let bestMidAngle = 0;
    for (let i = 0; i < angles.length; i++) {
      const a1 = angles[i];
      const a2 = i === angles.length - 1 ? angles[0] + Math.PI * 2 : angles[i + 1];
      const gap = a2 - a1;
      if (gap > maxGap) {
        maxGap = gap;
        bestMidAngle = a1 + gap * 0.5;
      }
    }
    return bestMidAngle;
  }

  private buildInputsForAgent(
    pl: Player,
    partnerPrevOutputs: number[],
    activeEnemies: Enemy[]
  ): number[] {
    const inputs: number[] = [
      (pl.x / SIM_WIDTH) * 2 - 1,
      (pl.y / SIM_HEIGHT) * 2 - 1,
      pl.vx / this.playerSpeed,
      pl.vy / this.playerSpeed,
    ];

    for (let i = 0; i < 50; i++) {
      if (i < activeEnemies.length) {
        inputs.push((activeEnemies[i].x - pl.x) / SIM_WIDTH);
        inputs.push((activeEnemies[i].y - pl.y) / SIM_HEIGHT);
      } else {
        inputs.push(0);
        inputs.push(0);
      }
    }

    if (this.dualAgentMode) {
      for (let k = 0; k < 4; k++) {
        const v = partnerPrevOutputs[k] ?? 0;
        inputs.push(Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0);
      }
    } else {
      inputs.push(0, 0, 0, 0);
    }

    return inputs;
  }

  buildCurrentInputs(agentId: AgentId = 'A'): number[] {
    const activeEnemies = this.enemies.filter((e) => !e.spawnDelay || e.spawnDelay <= 0);
    if (agentId === 'B' && this.dualAgentMode) {
      return this.buildInputsForAgent(
        this.playerB,
        this.doesAgentReceiveTelepathy('B') ? this.prevRawOutputsA : [0, 0, 0, 0],
        activeEnemies
      );
    }
    return this.buildInputsForAgent(
      this.player,
      this.doesAgentReceiveTelepathy('A') ? this.prevRawOutputsB : [0, 0, 0, 0],
      activeEnemies
    );
  }

  private evaluateAgentPerStepRewards(
    agentId: AgentId,
    prevPx: number,
    prevPy: number,
    minEnemyDist: number,
    activeEnemies: Enemy[],
    activeEnemyIndices: number[],
    activeEnemyVels: { vx: number; vy: number }[]
  ): number {
    const pl = agentId === 'B' ? this.playerB : this.player;
    const collectedSplitGaps = agentId === 'B' ? this.collectedSplitGapsB : this.collectedSplitGaps;
    const splitGapHistory = agentId === 'B' ? this.splitGapHistoryB : this.splitGapHistory;
    let prevVx = agentId === 'B' ? this.prevVxB : this.prevVx;
    let prevVy = agentId === 'B' ? this.prevVyB : this.prevVy;
    let emaVx = agentId === 'B' ? this.emaVxB : this.emaVx;
    let emaVy = agentId === 'B' ? this.emaVyB : this.emaVy;
    let emaPx = agentId === 'B' ? this.emaPxB : this.emaPx;
    let emaPy = agentId === 'B' ? this.emaPyB : this.emaPy;

    let delta = 0;

    if (this.params.rewardEnemyDist && activeEnemies.length > 0) {
      delta += minEnemyDist * this.params.weightEnemyDist;
    }

    if (this.params.rewardWallDist) {
      const wallDistX = Math.min(pl.x - 6, SIM_WIDTH - 6 - pl.x);
      const wallDistY = Math.min(pl.y - 6, SIM_HEIGHT - 6 - pl.y);
      const minWallDist = Math.min(wallDistX, wallDistY);
      delta += minWallDist * this.params.weightWallDist;
    }

    if (this.params.rewardOppHeading && activeEnemies.length > 0) {
      let avgEx = 0;
      let avgEy = 0;
      for (let i = 0; i < activeEnemies.length; i++) {
        const dx = activeEnemies[i].x - pl.x;
        const dy = activeEnemies[i].y - pl.y;
        const d = Math.hypot(dx, dy);
        if (d > 0.001) {
          avgEx += dx / d;
          avgEy += dy / d;
        }
      }
      avgEx /= activeEnemies.length;
      avgEy /= activeEnemies.length;

      const avgMag = Math.hypot(avgEx, avgEy);
      const pMag = Math.hypot(pl.vx, pl.vy);
      if (avgMag > 0.001 && pMag > 0.001) {
        const awayX = -avgEx / avgMag;
        const awayY = -avgEy / avgMag;
        const headX = pl.vx / pMag;
        const headY = pl.vy / pMag;
        const alignment = headX * awayX + headY * awayY;
        delta += alignment * 100 * this.params.weightOppHeading;
      }
    }

    const prevStepVx = prevVx;
    const prevStepVy = prevVy;
    const nvx = pl.vx / this.playerSpeed;
    const nvy = pl.vy / this.playerSpeed;
    if (this.stepCount === 0) {
      prevVx = nvx;
      prevVy = nvy;
      emaVx = nvx;
      emaVy = nvy;
    } else {
      if (this.params.rewardSmoothVel) {
        const speedNorm = Math.hypot(nvx, nvy);
        const jerk = Math.hypot(nvx - prevVx, nvy - prevVy);
        const noise = Math.hypot(nvx - emaVx, nvy - emaVy);
        const smoothScore = (speedNorm - 1.5 * jerk - 1.0 * noise) * 80;
        delta += smoothScore * this.params.weightSmoothVel;
      }
      prevVx = nvx;
      prevVy = nvy;
      emaVx = 0.88 * emaVx + 0.12 * nvx;
      emaVy = 0.88 * emaVy + 0.12 * nvy;
    }

    if (this.params.rewardSplitGap && activeEnemies.length > 0) {
      const bestMidAngle = this.computeSplitGapAngle(activeEnemies, pl.x, pl.y);
      if (bestMidAngle !== null) {
        const gapX = Math.cos(bestMidAngle);
        const gapY = Math.sin(bestMidAngle);
        const gapAlignment = nvx * gapX + nvy * gapY;
        delta += gapAlignment * 100 * this.params.weightSplitGap;
      }
    }

    if (this.params.rewardSplitGapPredict && activeEnemies.length > 0) {
      const currAngle = this.computeSplitGapAngle(activeEnemies, pl.x, pl.y);
      if (currAngle !== null) {
        const currX = Math.cos(currAngle);
        const currY = Math.sin(currAngle);

        const wrapAngle = (diff: number): number => {
          let a = diff;
          while (a > Math.PI) a -= Math.PI * 2;
          while (a < -Math.PI) a += Math.PI * 2;
          return a;
        };

        if (splitGapHistory.length > 0) {
          const prevSample = splitGapHistory[splitGapHistory.length - 1];
          const stepJump = Math.abs(wrapAngle(currAngle - prevSample.angle));
          if (stepJump > 0.85) {
            splitGapHistory.length = 0;
          }
        }

        let predictedAngle = currAngle;
        let anticipationScore = 0;

        if (splitGapHistory.length > 0) {
          const pastSample = splitGapHistory[0];
          const dt = splitGapHistory.length;
          const rawDiff = wrapAngle(currAngle - pastSample.angle);
          const perStepDelta = rawDiff / dt;
          const leadAngle = Math.max(-0.65, Math.min(0.65, perStepDelta * 5));
          predictedAngle = currAngle + leadAngle;

          const prevMag = Math.hypot(prevStepVx, prevStepVy);
          const speedNorm = Math.hypot(nvx, nvy);
          if (this.stepCount > 0 && prevMag > 0.01 && speedNorm > 0.01 && Math.abs(rawDiff) > 0.01) {
            const prevUx = prevStepVx / prevMag;
            const prevUy = prevStepVy / prevMag;
            const alignCurr = prevUx * currX + prevUy * currY;
            const alignPast = prevUx * pastSample.x + prevUy * pastSample.y;
            anticipationScore =
              Math.max(-1, Math.min(1, (alignCurr - alignPast) * 6)) * 35 * speedNorm;
          }
        }

        const predX = Math.cos(predictedAngle);
        const predY = Math.sin(predictedAngle);
        const predAlignment = nvx * predX + nvy * predY;
        delta += (predAlignment * 100 + anticipationScore) * this.params.weightSplitGapPredict;

        splitGapHistory.push({ angle: currAngle, x: currX, y: currY });
        if (splitGapHistory.length > 5) {
          splitGapHistory.shift();
        }
      }
    }

    if (this.params.rewardEdgeSense && activeEnemies.length > 0) {
      const speedNorm = Math.hypot(nvx, nvy);
      if (speedNorm > 0.01) {
        const ux = nvx / speedNorm;
        const uy = nvy / speedNorm;
        const rx = -uy;
        const ry = ux;
        const senseRadius = 140;

        let leftThreat = 0;
        let rightThreat = 0;
        let frontThreat = 0;

        for (let i = 0; i < activeEnemies.length; i++) {
          const dx = activeEnemies[i].x - pl.x;
          const dy = activeEnemies[i].y - pl.y;
          const d = Math.hypot(dx, dy);
          if (d <= 0.001 || d >= senseRadius) continue;

          const closeness = 1 - d / senseRadius;
          const ndx = dx / d;
          const ndy = dy / d;
          const fwd = ndx * ux + ndy * uy;
          const lat = ndx * rx + ndy * ry;
          const periphThreat = closeness * Math.abs(lat);

          if (lat < 0) {
            if (periphThreat > leftThreat) leftThreat = periphThreat;
          } else if (lat > 0) {
            if (periphThreat > rightThreat) rightThreat = periphThreat;
          }

          if (fwd > 0.75) {
            const ft = closeness * ((fwd - 0.75) / 0.25);
            if (ft > frontThreat) frontThreat = ft;
          }
        }

        const edgeScore =
          (Math.abs(leftThreat - rightThreat) -
            Math.min(leftThreat, rightThreat) -
            0.5 * frontThreat) *
          speedNorm;
        delta += edgeScore * 100 * this.params.weightEdgeSense;
      }
    }

    const velSpeedNorm = Math.hypot(nvx, nvy);
    if (velSpeedNorm > 0.01) {
      const ux = nvx / velSpeedNorm;
      const uy = nvy / velSpeedNorm;

      if (this.params.rewardOrbitKite && activeEnemies.length > 0) {
        let nearDx = 0;
        let nearDy = 0;
        let nearDist = Infinity;
        for (let i = 0; i < activeEnemies.length; i++) {
          const dx = activeEnemies[i].x - pl.x;
          const dy = activeEnemies[i].y - pl.y;
          const d = Math.hypot(dx, dy);
          if (d < nearDist) {
            nearDist = d;
            nearDx = dx;
            nearDy = dy;
          }
        }
        if (nearDist > 0.001) {
          const ex = nearDx / nearDist;
          const ey = nearDy / nearDist;
          const tangentAlign = 1 - Math.abs(ux * ex + uy * ey);
          const sweetSpot = Math.max(0, 1 - Math.abs(nearDist - 85) / 55);
          const tooClosePenalty = nearDist < 35 ? ((35 - nearDist) / 35) * 0.6 : 0;
          const orbitScore =
            (sweetSpot * (tangentAlign - 0.15) - tooClosePenalty) * velSpeedNorm;
          delta += orbitScore * 100 * this.params.weightOrbitKite;
        }
      }

      if (this.params.rewardMatadorCut && activeEnemies.length > 0) {
        const cutRadius = 115;
        let bestPos = 0;
        let worstNeg = 0;
        for (let i = 0; i < activeEnemies.length; i++) {
          const dx = activeEnemies[i].x - pl.x;
          const dy = activeEnemies[i].y - pl.y;
          const d = Math.hypot(dx, dy);
          if (d <= 0.001 || d >= cutRadius) continue;

          const ev = activeEnemyVels[i];
          const evMag = Math.hypot(ev.vx, ev.vy);
          if (evMag <= 0.001) continue;

          const evx = ev.vx / evMag;
          const evy = ev.vy / evMag;
          const closeness = 1 - d / cutRadius;
          const towardEnemy = ux * (dx / d) + uy * (dy / d);

          if (towardEnemy > 0.6) {
            const pen = -closeness * ((towardEnemy - 0.6) / 0.4);
            if (pen < worstNeg) worstNeg = pen;
          } else {
            const againstEnemyHeading = -(ux * evx + uy * evy);
            const perpToEnemyHeading = Math.abs(-ux * evy + uy * evx);
            const safeMask = 1 - Math.max(0, towardEnemy) / 0.6;
            const score =
              closeness * (0.75 * againstEnemyHeading + 0.25 * perpToEnemyHeading) * safeMask;
            if (score > bestPos) bestPos = score;
            if (score < worstNeg) worstNeg = score;
          }
        }
        delta += (bestPos + worstNeg) * velSpeedNorm * 100 * this.params.weightMatadorCut;
      }

      if (this.params.rewardAnkleBreaker && activeEnemies.length > 0) {
        const radius = 135;
        let bestPos = 0;
        let worstNeg = 0;
        for (let i = 0; i < activeEnemies.length; i++) {
          const dx = activeEnemies[i].x - pl.x;
          const dy = activeEnemies[i].y - pl.y;
          const d = Math.hypot(dx, dy);
          if (d <= 0.001 || d >= radius) continue;

          const closeness = 1 - d / radius;
          const towardEnemy = ux * (dx / d) + uy * (dy / d);
          const rvx = activeEnemyVels[i].vx - pl.vx;
          const rvy = activeEnemyVels[i].vy - pl.vy;
          const angRate = Math.abs(dx * rvy - dy * rvx) / (d * d);
          const normRate = Math.min(1.5, angRate * 14);

          if (towardEnemy > 0.65) {
            const pen = -closeness * ((towardEnemy - 0.65) / 0.35);
            if (pen < worstNeg) worstNeg = pen;
          } else {
            const pos = closeness * normRate * (1 - Math.max(0, towardEnemy) * 0.5);
            if (pos > bestPos) bestPos = pos;
          }
        }
        delta += (bestPos + worstNeg) * velSpeedNorm * 100 * this.params.weightAnkleBreaker;
      }

      if (this.params.rewardPincerEscape && activeEnemies.length >= 2) {
        const pincerRadius = 185;
        let bestSeverity = 0;
        let bestAx = 0;
        let bestAy = 0;

        for (let i = 0; i < activeEnemies.length; i++) {
          const dx1 = activeEnemies[i].x - pl.x;
          const dy1 = activeEnemies[i].y - pl.y;
          const d1 = Math.hypot(dx1, dy1);
          if (d1 <= 0.001 || d1 >= pincerRadius) continue;
          const u1x = dx1 / d1;
          const u1y = dy1 / d1;

          for (let j = i + 1; j < activeEnemies.length; j++) {
            const dx2 = activeEnemies[j].x - pl.x;
            const dy2 = activeEnemies[j].y - pl.y;
            const d2 = Math.hypot(dx2, dy2);
            if (d2 <= 0.001 || d2 >= pincerRadius) continue;

            const dot = u1x * (dx2 / d2) + u1y * (dy2 / d2);
            if (dot < -0.35) {
              const opp = (-dot - 0.35) / 0.65;
              const prox = 1 - Math.max(d1, d2) / pincerRadius;
              const severity = opp * prox;
              if (severity > bestSeverity) {
                bestSeverity = severity;
                bestAx = activeEnemies[j].x - activeEnemies[i].x;
                bestAy = activeEnemies[j].y - activeEnemies[i].y;
              }
            }
          }
        }

        if (bestSeverity > 0) {
          const aLen = Math.hypot(bestAx, bestAy);
          if (aLen > 0.001) {
            const axisX = bestAx / aLen;
            const axisY = bestAy / aLen;
            const escX = -axisY;
            const escY = axisX;
            const escAlign = Math.abs(ux * escX + uy * escY);
            const axisAlign = Math.abs(ux * axisX + uy * axisY);
            const pincerScore = (escAlign - 0.5 * axisAlign) * bestSeverity * velSpeedNorm;
            delta += pincerScore * 100 * this.params.weightPincerEscape;
          }
        }
      }

      if (this.params.rewardOpenCorridor) {
        const baseAngle = Math.atan2(uy, ux);
        const offsets = [-0.42, 0, 0.42];
        const maxHorizon = 240;
        let minRay = 1;
        let sumRay = 0;

        for (let k = 0; k < offsets.length; k++) {
          const rx = Math.cos(baseAngle + offsets[k]);
          const ry = Math.sin(baseAngle + offsets[k]);
          const tx =
            rx > 1e-5
              ? (SIM_WIDTH - 6 - pl.x) / rx
              : rx < -1e-5
              ? (6 - pl.x) / rx
              : maxHorizon;
          const ty =
            ry > 1e-5
              ? (SIM_HEIGHT - 6 - pl.y) / ry
              : ry < -1e-5
              ? (6 - pl.y) / ry
              : maxHorizon;
          let clearance = Math.max(0, Math.min(maxHorizon, tx, ty));

          for (let i = 0; i < activeEnemies.length; i++) {
            const dx = activeEnemies[i].x - pl.x;
            const dy = activeEnemies[i].y - pl.y;
            const proj = dx * rx + dy * ry;
            if (proj > 0 && proj < clearance + 11) {
              const perp = Math.abs(dx * ry - dy * rx);
              if (perp < 22) {
                const hitDist = Math.max(0, proj - 11);
                if (hitDist < clearance) clearance = hitDist;
              }
            }
          }

          const normClear = clearance / maxHorizon;
          if (normClear < minRay) minRay = normClear;
          sumRay += normClear;
        }

        const avgRay = sumRay / offsets.length;
        const corridorScore = (0.5 * minRay + 0.5 * avgRay) * velSpeedNorm;
        delta += corridorScore * 100 * this.params.weightOpenCorridor;
      }

      if (this.params.rewardWallSlingshot && activeEnemies.length > 0) {
        const wallThresh = 65;
        const dLeft = pl.x - 6;
        const dRight = SIM_WIDTH - 6 - pl.x;
        const dTop = pl.y - 6;
        const dBot = SIM_HEIGHT - 6 - pl.y;
        const minWall = Math.min(dLeft, dRight, dTop, dBot);

        if (minWall < wallThresh) {
          let nearDx = 0;
          let nearDy = 0;
          let nearDist = Infinity;
          for (let i = 0; i < activeEnemies.length; i++) {
            const dx = activeEnemies[i].x - pl.x;
            const dy = activeEnemies[i].y - pl.y;
            const d = Math.hypot(dx, dy);
            if (d < nearDist) {
              nearDist = d;
              nearDx = dx;
              nearDy = dy;
            }
          }

          if (nearDist > 0.001 && nearDist < 170) {
            const wnxRaw =
              (dLeft < wallThresh ? 1 - dLeft / wallThresh : 0) -
              (dRight < wallThresh ? 1 - dRight / wallThresh : 0);
            const wnyRaw =
              (dTop < wallThresh ? 1 - dTop / wallThresh : 0) -
              (dBot < wallThresh ? 1 - dBot / wallThresh : 0);
            const wnMag = Math.hypot(wnxRaw, wnyRaw);
            if (wnMag > 0.001) {
              const wnx = wnxRaw / wnMag;
              const wny = wnyRaw / wnMag;
              const tx = -wny;
              const ty = wnx;
              const ex = nearDx / nearDist;
              const ey = nearDy / nearDist;
              const sign = ex * tx + ey * ty > 0 ? -1 : 1;
              const escX = tx * sign;
              const escY = ty * sign;
              const wallProx = 1 - minWall / wallThresh;
              const enemyProx = 1 - nearDist / 170;
              const slingScore = (ux * escX + uy * escY) * wallProx * enemyProx * velSpeedNorm;
              delta += slingScore * 100 * this.params.weightWallSlingshot;
            }
          }
        }
      }

      if (this.params.rewardPackTangle && activeEnemies.length >= 2) {
        const pairRadius = 65;
        let totalTightness = 0;
        let weightedCx = 0;
        let weightedCy = 0;

        for (let i = 0; i < activeEnemies.length; i++) {
          for (let j = i + 1; j < activeEnemies.length; j++) {
            const dij = Math.hypot(
              activeEnemies[j].x - activeEnemies[i].x,
              activeEnemies[j].y - activeEnemies[i].y
            );
            if (dij < pairRadius) {
              const t = 1 - dij / pairRadius;
              totalTightness += t;
              weightedCx += (activeEnemies[i].x + activeEnemies[j].x) * 0.5 * t;
              weightedCy += (activeEnemies[i].y + activeEnemies[j].y) * 0.5 * t;
            }
          }
        }

        if (totalTightness > 0.001) {
          const cx = weightedCx / totalTightness;
          const cy = weightedCy / totalTightness;
          const cdx = cx - pl.x;
          const cdy = cy - pl.y;
          const cd = Math.hypot(cdx, cdy);
          if (cd > 0.001) {
            const clusterDensity = Math.min(1, totalTightness / Math.max(1, activeEnemies.length * 0.75));
            const behindFactor = -(ux * (cdx / cd) + uy * (cdy / cd));
            const safeMargin = minEnemyDist > 26 ? Math.min(1, (minEnemyDist - 26) / 60) : -0.5;
            const tangleScore =
              clusterDensity *
              (behindFactor > 0 ? behindFactor * safeMargin : behindFactor * 0.5) *
              velSpeedNorm;
            delta += tangleScore * 100 * this.params.weightPackTangle;
          }
        }
      }

      if (this.params.rewardSpideySense && activeEnemies.length > 0) {
        const senseRadius = 200;
        let omegaX = 0;
        let omegaY = 0;

        for (let i = 0; i < activeEnemies.length; i++) {
          const dx = activeEnemies[i].x - pl.x;
          const dy = activeEnemies[i].y - pl.y;
          const d = Math.hypot(dx, dy);
          if (d <= 0.001 || d >= senseRadius) continue;

          const gx = dx / d;
          const gy = dy / d;
          const prox = 1 - d / senseRadius;
          const proxWeight = prox * prox;
          const closingSpeed =
            ((pl.vx - activeEnemyVels[i].vx) * gx + (pl.vy - activeEnemyVels[i].vy) * gy) /
            this.playerSpeed;
          const closeWeight = 0.35 + Math.max(0, closingSpeed);
          const gradMag = proxWeight * closeWeight;

          omegaX += gx * gradMag;
          omegaY += gy * gradMag;
        }

        const uphillPierce = omegaX * nvx + omegaY * nvy;
        if (uphillPierce > 0) {
          delta -= uphillPierce * 100 * this.params.weightSpideySense;
        }
      }

      if (this.params.rewardVectorStabbing) {
        const stabBuffer = 24;
        const rawNextX = prevPx + pl.vx;
        const rawNextY = prevPy + pl.vy;

        const dLeft = Math.max(0, prevPx - 6);
        const dRight = Math.max(0, SIM_WIDTH - 6 - prevPx);
        const dTop = Math.max(0, prevPy - 6);
        const dBot = Math.max(0, SIM_HEIGHT - 6 - prevPy);

        const outLeft = Math.max(0, -nvx);
        const outRight = Math.max(0, nvx);
        const outTop = Math.max(0, -nvy);
        const outBot = Math.max(0, nvy);

        const pierceLeft = Math.max(0, 6 - rawNextX) / this.playerSpeed;
        const pierceRight = Math.max(0, rawNextX - (SIM_WIDTH - 6)) / this.playerSpeed;
        const pierceTop = Math.max(0, 6 - rawNextY) / this.playerSpeed;
        const pierceBot = Math.max(0, rawNextY - (SIM_HEIGHT - 6)) / this.playerSpeed;

        const proxLeft = dLeft < stabBuffer ? (1 - dLeft / stabBuffer) * outLeft : 0;
        const proxRight = dRight < stabBuffer ? (1 - dRight / stabBuffer) * outRight : 0;
        const proxTop = dTop < stabBuffer ? (1 - dTop / stabBuffer) * outTop : 0;
        const proxBot = dBot < stabBuffer ? (1 - dBot / stabBuffer) * outBot : 0;

        const stabLeft = Math.max(pierceLeft, 0.5 * proxLeft);
        const stabRight = Math.max(pierceRight, 0.5 * proxRight);
        const stabTop = Math.max(pierceTop, 0.5 * proxTop);
        const stabBot = Math.max(pierceBot, 0.5 * proxBot);

        const totalStab = Math.min(1.5, stabLeft + stabRight + stabTop + stabBot);
        if (totalStab > 0) {
          delta += totalStab * 100 * this.params.weightVectorStabbing;
        }
      }

      if (this.params.rewardTwitch && activeEnemies.length > 0 && this.stepCount > 0) {
        const prevStepMag = Math.hypot(prevStepVx, prevStepVy);
        if (prevStepMag > 0.05) {
          const fx = prevStepVx / prevStepMag;
          const fy = prevStepVy / prevStepMag;
          const twitchRadius = 115;
          const turnSnap = Math.min(1, Math.hypot(nvx - prevStepVx, nvy - prevStepVy) / 1.1);
          const latPrev = Math.abs(-ux * fy + uy * fx);

          let bestPos = 0;
          let worstNeg = 0;
          for (let i = 0; i < activeEnemies.length; i++) {
            const dx = activeEnemies[i].x - pl.x;
            const dy = activeEnemies[i].y - pl.y;
            const d = Math.hypot(dx, dy);
            if (d <= 0.001 || d >= twitchRadius) continue;

            const ex = dx / d;
            const ey = dy / d;
            const frontDot = fx * ex + fy * ey;
            if (frontDot <= 0.45) continue;

            const closeness = 1 - d / twitchRadius;
            const frontWeight = closeness * ((frontDot - 0.45) / 0.55);
            const towardEnemy = ux * ex + uy * ey;

            if (towardEnemy > 0.65) {
              const pen = -frontWeight * ((towardEnemy - 0.65) / 0.35);
              if (pen < worstNeg) worstNeg = pen;
            } else {
              const latEnemy = Math.abs(-ux * ey + uy * ex);
              const score =
                frontWeight *
                (0.55 * latPrev + 0.45 * latEnemy) *
                (0.35 + 0.65 * turnSnap);
              if (score > bestPos) bestPos = score;
            }
          }
          if (bestPos > 0 || worstNeg < 0) {
            delta += (bestPos + worstNeg) * velSpeedNorm * 100 * this.params.weightTwitch;
          }
        }
      }

      if (this.params.rewardFarWallSense) {
        const farX = Math.max(
          6,
          Math.min(SIM_WIDTH - 6, SIM_WIDTH * 0.5 + (SIM_WIDTH * 0.5 - emaPx) * 1.5)
        );
        const farY = Math.max(
          6,
          Math.min(SIM_HEIGHT - 6, SIM_HEIGHT * 0.5 + (SIM_HEIGHT * 0.5 - emaPy) * 1.5)
        );
        const toFarX = farX - pl.x;
        const toFarY = farY - pl.y;
        const distToFar = Math.hypot(toFarX, toFarY);
        if (distToFar > 0.001) {
          const maxSpan = Math.hypot(SIM_WIDTH, SIM_HEIGHT);
          const alignment = (ux * toFarX + uy * toFarY) / distToFar;
          const farWeight = Math.min(1, distToFar / (maxSpan * 0.45));
          const farScore = alignment * farWeight * velSpeedNorm;
          delta += farScore * 100 * this.params.weightFarWallSense;
        }
      }

      if (this.params.rewardSplitGapCollect && activeEnemies.length >= 2) {
        const sortedEntries = activeEnemies
          .map((e, localIdx) => {
            const dx = e.x - pl.x;
            const dy = e.y - pl.y;
            return {
              x: e.x,
              y: e.y,
              idx: activeEnemyIndices[localIdx] ?? localIdx,
              dist: Math.hypot(dx, dy),
              angle: Math.atan2(dy, dx),
            };
          })
          .sort((a, b) => a.dist - b.dist);

        const withinRadius = sortedEntries.filter((e) => e.dist <= 220);
        const nearby = (
          withinRadius.length >= 2
            ? withinRadius.slice(0, 12)
            : sortedEntries.slice(0, Math.min(sortedEntries.length, 8))
        ).sort((a, b) => a.angle - b.angle);

        if (nearby.length >= 2) {
          let maxGap = -1;
          let widestIndex = 0;
          for (let i = 0; i < nearby.length; i++) {
            const a1 = nearby[i].angle;
            const a2 =
              i === nearby.length - 1 ? nearby[0].angle + Math.PI * 2 : nearby[i + 1].angle;
            const gap = a2 - a1;
            if (gap > maxGap) {
              maxGap = gap;
              widestIndex = i;
            }
          }

          const velAngle = Math.atan2(uy, ux);
          const isGapAlreadyIdentified = (pairKey: number, mx: number, my: number): boolean => {
            for (let k = collectedSplitGaps.length - 1; k >= 0; k--) {
              const rec = collectedSplitGaps[k];
              const age = this.stepCount - rec.step;
              const spatialDist = Math.hypot(mx - rec.mx, my - rec.my);
              if (rec.pairKey === pairKey && (age < 240 || spatialDist < 100)) {
                return true;
              }
              if (spatialDist < 48 && age < 360) {
                return true;
              }
            }
            return false;
          };

          let bestForwardShape = 0;
          let crossedStepDelta = 0;
          const rX = pl.x - prevPx;
          const rY = pl.y - prevPy;

          for (let i = 0; i < nearby.length; i++) {
            const e1 = nearby[i];
            const e2 = i === nearby.length - 1 ? nearby[0] : nearby[i + 1];
            const chordLen = Math.hypot(e2.x - e1.x, e2.y - e1.y);
            if (chordLen < 24 || chordLen > 280) continue;

            const pairKey = Math.min(e1.idx, e2.idx) * 100 + Math.max(e1.idx, e2.idx);
            const mx = (e1.x + e2.x) * 0.5;
            const my = (e1.y + e2.y) * 0.5;
            const alreadyCollected = isGapAlreadyIdentified(pairKey, mx, my);

            const sX = e2.x - e1.x;
            const sY = e2.y - e1.y;
            const denom = rX * sY - rY * sX;
            if (Math.abs(denom) > 1e-6) {
              const qpx = e1.x - prevPx;
              const qpy = e1.y - prevPy;
              const s = (qpx * sY - qpy * sX) / denom;
              const t = (qpx * rY - qpy * rX) / denom;
              if (s >= 0 && s <= 1 && t >= 0.1 && t <= 0.9) {
                const postClearance = Math.min(
                  Math.hypot(pl.x - e1.x, pl.y - e1.y),
                  Math.hypot(pl.x - e2.x, pl.y - e2.y)
                );
                if (postClearance >= 13) {
                  const centerQuality = Math.max(0.25, 4 * t * (1 - t));
                  const widestMult = i === widestIndex ? 1.25 : 1.0;
                  if (alreadyCollected) {
                    crossedStepDelta -= 400 * centerQuality;
                  } else {
                    crossedStepDelta += 600 * centerQuality * widestMult;
                    collectedSplitGaps.push({ pairKey, mx, my, step: this.stepCount });
                    if (collectedSplitGaps.length > 64) {
                      collectedSplitGaps.shift();
                    }
                  }
                }
              }
            }

            const toMidX = mx - pl.x;
            const toMidY = my - pl.y;
            const md = Math.hypot(toMidX, toMidY);
            if (md > 0.001 && md < 190 && minEnemyDist > 16) {
              const forwardDot = (ux * toMidX + uy * toMidY) / md;
              if (forwardDot > 0.25) {
                const a1 = e1.angle;
                const a2 = i === nearby.length - 1 ? e2.angle + Math.PI * 2 : e2.angle;
                let va = velAngle;
                while (va < a1) va += Math.PI * 2;
                while (va > a1 + Math.PI * 2) va -= Math.PI * 2;
                if (va >= a1 && va <= a2) {
                  const span = a2 - a1;
                  const frac = span > 0.001 ? (va - a1) / span : 0.5;
                  const centerAim = Math.max(0, 1 - Math.abs(frac - 0.5) * 2);
                  const prox = 1 - md / 190;
                  const widestMult = i === widestIndex ? 1.35 : 1.0;
                  const shape = centerAim * prox * widestMult * velSpeedNorm;
                  if (alreadyCollected) {
                    if (-shape * 55 < bestForwardShape) bestForwardShape = -shape * 55;
                  } else {
                    if (shape * 60 > bestForwardShape) bestForwardShape = shape * 60;
                  }
                }
              }
            }
          }

          delta += (crossedStepDelta + bestForwardShape) * this.params.weightSplitGapCollect;
        }
      }
    }

    emaPx = 0.98 * emaPx + 0.02 * pl.x;
    emaPy = 0.98 * emaPy + 0.02 * pl.y;

    if (agentId === 'B') {
      this.prevVxB = prevVx;
      this.prevVyB = prevVy;
      this.emaVxB = emaVx;
      this.emaVyB = emaVy;
      this.emaPxB = emaPx;
      this.emaPyB = emaPy;
    } else {
      this.prevVx = prevVx;
      this.prevVy = prevVy;
      this.emaVx = emaVx;
      this.emaVy = emaVy;
      this.emaPx = emaPx;
      this.emaPy = emaPy;
    }

    return delta;
  }

  private mergeSplitBrainVelocities(
    entries: { id: AgentId; vx: number; vy: number }[]
  ): { vx: number; vy: number; winner: AgentId | 'both' } {
    if (entries.length === 0) {
      return { vx: 0, vy: 0, winner: 'both' };
    }
    const mags = entries.map((e) => Math.hypot(e.vx, e.vy));
    let topIdx = 0;
    let secondMag = -1;
    for (let i = 1; i < mags.length; i++) {
      if (mags[i] > mags[topIdx]) {
        secondMag = mags[topIdx];
        topIdx = i;
      } else if (mags[i] > secondMag) {
        secondMag = mags[i];
      }
    }
    const topMag = mags[topIdx];
    const ratioWinner: AgentId | 'both' =
      topMag > Math.max(0.05, secondMag * 1.15) ? entries[topIdx].id : 'both';

    const maxAllowedSpeed = Math.max(this.playerSpeed, topMag);
    const capVelocity = (rawVx: number, rawVy: number): { vx: number; vy: number } => {
      const mag = Math.hypot(rawVx, rawVy);
      if (mag > maxAllowedSpeed && mag > 1e-6) {
        const scale = maxAllowedSpeed / mag;
        return { vx: rawVx * scale, vy: rawVy * scale };
      }
      return { vx: rawVx, vy: rawVy };
    };

    if (this.splitBrainMergeMode === 'blend') {
      let sx = 0;
      let sy = 0;
      for (const e of entries) {
        sx += e.vx;
        sy += e.vy;
      }
      const k = entries.length;
      const capped = capVelocity(sx / k, sy / k);
      return { vx: capped.vx, vy: capped.vy, winner: ratioWinner };
    }

    if (this.splitBrainMergeMode === 'winner') {
      const tied = entries.filter((_, idx) => Math.abs(mags[idx] - topMag) < 0.05);
      if (tied.length > 1) {
        let sx = 0;
        let sy = 0;
        for (const e of tied) {
          sx += e.vx;
          sy += e.vy;
        }
        const capped = capVelocity(sx / tied.length, sy / tied.length);
        return { vx: capped.vx, vy: capped.vy, winner: 'both' };
      }
      return { vx: entries[topIdx].vx, vy: entries[topIdx].vy, winner: entries[topIdx].id };
    }

    if (this.splitBrainMergeMode === 'split_axes') {
      let sumX = 0;
      let countX = 0;
      let sumY = 0;
      let countY = 0;
      for (let i = 0; i < entries.length; i++) {
        if (i % 2 === 0) {
          sumX += entries[i].vx;
          countX++;
        } else {
          sumY += entries[i].vy;
          countY++;
        }
      }
      const capped = capVelocity(countX > 0 ? sumX / countX : 0, countY > 0 ? sumY / countY : 0);
      return { vx: capped.vx, vy: capped.vy, winner: ratioWinner };
    }

    if (this.splitBrainMergeMode === 'alternate') {
      const activeIdx = Math.floor(this.stepCount / 10) % entries.length;
      const chosen = entries[activeIdx];
      return { vx: chosen.vx, vy: chosen.vy, winner: chosen.id };
    }

    // Default: 'collision_sum' — direct additive collision; opposing vectors cancel out, speed capped at 1x
    let vx = 0;
    let vy = 0;
    for (const e of entries) {
      vx += e.vx;
      vy += e.vy;
    }
    const capped = capVelocity(vx, vy);
    return { vx: capped.vx, vy: capped.vy, winner: ratioWinner };
  }

  private computeSplitBrainIntentScore(
    propVx: number,
    propVy: number,
    mergedVx: number,
    mergedVy: number,
    prevPx: number,
    prevPy: number,
    activeEnemies: Enemy[]
  ): number {
    const propMag = Math.hypot(propVx, propVy);
    const candX = Math.max(6, Math.min(SIM_WIDTH - 6, prevPx + propVx));
    const candY = Math.max(6, Math.min(SIM_HEIGHT - 6, prevPy + propVy));

    let score = 0;
    if (activeEnemies.length > 0) {
      let minBefore = Infinity;
      let minAfter = Infinity;
      let avgEx = 0;
      let avgEy = 0;

      for (let i = 0; i < activeEnemies.length; i++) {
        const e = activeEnemies[i];
        const dBefore = Math.hypot(prevPx - e.x, prevPy - e.y);
        const dAfter = Math.hypot(candX - e.x, candY - e.y);
        if (dBefore < minBefore) minBefore = dBefore;
        if (dAfter < minAfter) minAfter = dAfter;
        if (dBefore > 0.001) {
          avgEx += (e.x - prevPx) / dBefore;
          avgEy += (e.y - prevPy) / dBefore;
        }
      }

      const clearanceGain = minAfter - minBefore;
      const urgency = minBefore < 120 ? 1.85 : 0.75;
      score += clearanceGain * urgency;

      if (minAfter < 11) {
        score -= 40;
      }

      if (this.params.rewardOppHeading && propMag > 1e-3) {
        const avgMag = Math.hypot(avgEx, avgEy);
        if (avgMag > 0.001) {
          const align =
            (propVx / propMag) * (-avgEx / avgMag) +
            (propVy / propMag) * (-avgEy / avgMag);
          score += align * 6 * this.params.weightOppHeading;
        }
      }
    }

    // Contribution / dominance alignment with actual surviving displacement
    const mergedMag = Math.hypot(mergedVx, mergedVy);
    if (propMag > 1e-3 && mergedMag > 1e-3) {
      const dot = (propVx * mergedVx + propVy * mergedVy) / (propMag * mergedMag);
      const effort = Math.min(1, propMag / Math.max(1e-3, this.playerSpeed));
      score += dot * effort * 1.4;
    }

    // Wall-safety penalty if a brain drives straight into the boundary
    const prevWall = Math.min(prevPx - 6, SIM_WIDTH - 6 - prevPx, prevPy - 6, SIM_HEIGHT - 6 - prevPy);
    const candWall = Math.min(candX - 6, SIM_WIDTH - 6 - candX, candY - 6, SIM_HEIGHT - 6 - candY);
    if (candWall < 12 && candWall < prevWall) {
      score -= (12 - candWall) * 0.25;
    }

    return score;
  }

  update(manualControl?: {
    ax: number;
    ay: number;
    aux?: number;
    rawOutputs?: number[];
    agentId?: AgentId;
  }): boolean {
    const manualAgentId: AgentId | null = manualControl ? manualControl.agentId ?? 'A' : null;
    const activeIds = this.getActiveBrainIds();

    for (const id of activeIds) {
      const net = this.getTargetAgent(id);
      if (!net && manualAgentId !== id) {
        return false;
      }
    }

    const activeEnemies = this.enemies.filter((e) => !e.spawnDelay || e.spawnDelay <= 0);
    const prevPxA = this.player.x;
    const prevPyA = this.player.y;
    let prevPxB = this.playerB.x;
    let prevPyB = this.playerB.y;

    const getManualOutputs = (): number[] => {
      if (!manualControl) return [0, 0];
      if (manualControl.rawOutputs) return manualControl.rawOutputs;
      return typeof manualControl.aux === 'number'
        ? [manualControl.ax, manualControl.ay, manualControl.aux]
        : [manualControl.ax, manualControl.ay];
    };

    const splitEntries: { id: AgentId; vx: number; vy: number }[] = [];

    if (this.splitBrainMode) {
      const sharedInputs = this.buildInputsForAgent(this.player, [0, 0, 0, 0], activeEnemies);
      for (const id of activeIds) {
        const net = this.getTargetAgent(id);
        const rawOutputs =
          manualControl && manualAgentId === id ? getManualOutputs() : net!.predict(sharedInputs);
        const motor = this.getAgentMotorState(id);
        const decoded = this.decodeVelocityOutputs(
          rawOutputs,
          this.player.vx,
          this.player.vy,
          motor.headingRad,
          motor.stamina,
          motor.sprinting,
          this.getOutputConfig(id)
        );
        this.setAgentMotorState(
          id,
          decoded.headingRad,
          decoded.stamina,
          decoded.sprinting,
          decoded.aux
        );
        this.setSplitBrainVelocity(id, decoded.vx, decoded.vy);
        splitEntries.push({ id, vx: decoded.vx, vy: decoded.vy });
      }

      const merged = this.mergeSplitBrainVelocities(splitEntries);
      this.splitBrainLastWinner = merged.winner;
      this.player.vx = merged.vx;
      this.player.vy = merged.vy;
      this.player.x = Math.max(6, Math.min(SIM_WIDTH - 6, this.player.x + this.player.vx));
      this.player.y = Math.max(6, Math.min(SIM_HEIGHT - 6, this.player.y + this.player.vy));

      this.prevRawOutputsA = [0, 0, 0, 0];
      this.prevRawOutputsB = [0, 0, 0, 0];
    } else {
      const prevOutputsForA = this.doesAgentReceiveTelepathy('A')
        ? [...this.prevRawOutputsB]
        : [0, 0, 0, 0];
      const inputsA = this.buildInputsForAgent(this.player, prevOutputsForA, activeEnemies);
      const rawOutputsA =
        manualControl && manualAgentId === 'A' ? getManualOutputs() : this.agent!.predict(inputsA);

      const decodedA = this.decodeVelocityOutputs(
        rawOutputsA,
        this.player.vx,
        this.player.vy,
        this.playerHeadingRad,
        this.playerStamina,
        this.playerSprinting,
        this.getOutputConfig('A')
      );

      this.player.vx = decodedA.vx;
      this.player.vy = decodedA.vy;
      this.playerHeadingRad = decodedA.headingRad;
      this.playerStamina = decodedA.stamina;
      this.playerSprinting = decodedA.sprinting;
      this.lastOutputAux = decodedA.aux;
      this.player.x = Math.max(6, Math.min(SIM_WIDTH - 6, this.player.x + this.player.vx));
      this.player.y = Math.max(6, Math.min(SIM_HEIGHT - 6, this.player.y + this.player.vy));

      if (this.dualAgentMode) {
        const prevOutputsForB = this.doesAgentReceiveTelepathy('B')
          ? [...this.prevRawOutputsA]
          : [0, 0, 0, 0];
        const inputsB = this.buildInputsForAgent(this.playerB, prevOutputsForB, activeEnemies);
        const rawOutputsB =
          manualControl && manualAgentId === 'B'
            ? getManualOutputs()
            : this.agentB!.predict(inputsB);

        const decodedB = this.decodeVelocityOutputs(
          rawOutputsB,
          this.playerB.vx,
          this.playerB.vy,
          this.playerBHeadingRad,
          this.playerBStamina,
          this.playerBSprinting,
          this.getOutputConfig('B')
        );
        prevPxB = this.playerB.x;
        prevPyB = this.playerB.y;
        this.playerB.vx = decodedB.vx;
        this.playerB.vy = decodedB.vy;
        this.playerBHeadingRad = decodedB.headingRad;
        this.playerBStamina = decodedB.stamina;
        this.playerBSprinting = decodedB.sprinting;
        this.lastOutputAuxB = decodedB.aux;
        this.playerB.x = Math.max(6, Math.min(SIM_WIDTH - 6, this.playerB.x + this.playerB.vx));
        this.playerB.y = Math.max(6, Math.min(SIM_HEIGHT - 6, this.playerB.y + this.playerB.vy));

        this.prevRawOutputsA = [
          rawOutputsA[0] ?? 0,
          rawOutputsA[1] ?? 0,
          rawOutputsA[2] ?? 0,
          rawOutputsA[3] ?? 0,
        ];
        this.prevRawOutputsB = [
          rawOutputsB[0] ?? 0,
          rawOutputsB[1] ?? 0,
          rawOutputsB[2] ?? 0,
          rawOutputsB[3] ?? 0,
        ];
      }
    }

    this.recordPhysicsSample();

    const activeEnemyIndices: number[] = [];
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.spawnDelay || e.spawnDelay <= 0) {
        activeEnemyIndices.push(i);
      }
    }

    let minEnemyDistA = Infinity;
    let minEnemyDistB = Infinity;
    const activeEnemyVels: { vx: number; vy: number }[] = [];
    for (let i = 0; i < activeEnemies.length; i++) {
      const e = activeEnemies[i];
      const dxA = this.player.x - e.x;
      const dyA = this.player.y - e.y;
      const distA = Math.sqrt(dxA * dxA + dyA * dyA);
      if (distA < minEnemyDistA) minEnemyDistA = distA;

      let distB = Infinity;
      let dx = dxA;
      let dy = dyA;
      let targetDist = distA;

      if (this.dualAgentMode) {
        const dxB = this.playerB.x - e.x;
        const dyB = this.playerB.y - e.y;
        distB = Math.sqrt(dxB * dxB + dyB * dyB);
        if (distB < minEnemyDistB) minEnemyDistB = distB;
        if (distB < distA) {
          dx = dxB;
          dy = dyB;
          targetDist = distB;
        }
      }

      let vx = targetDist > 0.1 ? dx / targetDist : 0;
      let vy = targetDist > 0.1 ? dy / targetDist : 0;

      let sepX = 0;
      let sepY = 0;
      const desiredSep = 26;
      for (let j = 0; j < activeEnemies.length; j++) {
        if (i === j) continue;
        const other = activeEnemies[j];
        const sdx = e.x - other.x;
        const sdy = e.y - other.y;
        const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sDist > 0.001 && sDist < desiredSep) {
          const weight = (desiredSep - sDist) / desiredSep;
          sepX += (sdx / sDist) * weight;
          sepY += (sdy / sDist) * weight;
        }
      }

      vx += sepX * 1.6;
      vy += sepY * 1.6;

      const vMag = Math.sqrt(vx * vx + vy * vy);
      if (vMag > 0.001) {
        const effSpeed =
          this.params.enemySpeedMode === 'rarity'
            ? this.playerSpeed * (Math.min(90, Math.max(1, e.speedPct ?? 60)) / 100)
            : this.enemySpeed;
        const stepVx = (vx / vMag) * effSpeed;
        const stepVy = (vy / vMag) * effSpeed;
        e.x += stepVx;
        e.y += stepVy;
        activeEnemyVels.push({ vx: stepVx, vy: stepVy });
      } else {
        activeEnemyVels.push({ vx: 0, vy: 0 });
      }

      const hitA = distA < 11;
      const hitB = this.dualAgentMode && distB < 11;
      if (hitA || hitB) {
        if (this.splitBrainMode) {
          if (this.params.rewardHit) {
            const dCollide = Math.max(1e-3, Math.hypot(e.x - prevPxA, e.y - prevPyA));
            const ex = (e.x - prevPxA) / dCollide;
            const ey = (e.y - prevPyA) / dCollide;
            const badWeights = splitEntries.map((entry) => {
              const mag = Math.hypot(entry.vx, entry.vy);
              return Math.max(
                0.05,
                (entry.vx * ex + entry.vy * ey) / Math.max(1e-3, this.playerSpeed) +
                  0.35 * (mag / Math.max(1e-3, this.playerSpeed))
              );
            });
            const denom = badWeights.reduce((acc, w) => acc + w, 0) || 1;
            let bestLive = -Infinity;
            for (let k = 0; k < splitEntries.length; k++) {
              const id = splitEntries[k].id;
              const nextFit =
                this.getSplitBrainFitness(id) + this.params.weightHit * (badWeights[k] / denom);
              this.setSplitBrainFitness(id, nextFit);
              if (nextFit > bestLive) bestLive = nextFit;
            }
            this.currentFitness = Number.isFinite(bestLive) ? bestLive : this.currentFitness;
          }
        } else if (this.params.rewardHit) {
          this.currentFitness += this.params.weightHit;
        }
        if (
          this.getVisualMode() !== 'classic' &&
          (manualControl || (!this.params.turboMode && this.params.simSpeed <= 4))
        ) {
          if (hitA) {
            this.proceduralVisualsEngine.triggerHitBurst(
              (this.player.x + e.x) * 0.5,
              (this.player.y + e.y) * 0.5
            );
          }
          if (hitB) {
            this.proceduralVisualsEngineB.triggerHitBurst(
              (this.playerB.x + e.x) * 0.5,
              (this.playerB.y + e.y) * 0.5
            );
          }
        }
        if (manualControl) {
          return true;
        }
        this.endEpisode();
        return true;
      }
    }

    const minEnemyGap = 11;
    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < activeEnemies.length; i++) {
        for (let j = i + 1; j < activeEnemies.length; j++) {
          const dx = activeEnemies[j].x - activeEnemies[i].x;
          const dy = activeEnemies[j].y - activeEnemies[i].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minEnemyGap) {
            const nx = d > 0.001 ? dx / d : Math.cos(i + j);
            const ny = d > 0.001 ? dy / d : Math.sin(i + j);
            const overlap = (minEnemyGap - d) * 0.5;
            activeEnemies[i].x -= nx * overlap;
            activeEnemies[i].y -= ny * overlap;
            activeEnemies[j].x += nx * overlap;
            activeEnemies[j].y += ny * overlap;
          }
        }
      }
      for (let i = 0; i < activeEnemies.length; i++) {
        const e = activeEnemies[i];
        if (!e.entered) {
          if (e.x >= 5 && e.x <= SIM_WIDTH - 5 && e.y >= 5 && e.y <= SIM_HEIGHT - 5) {
            e.entered = true;
          }
        }
        if (e.entered) {
          e.x = Math.max(5, Math.min(SIM_WIDTH - 5, e.x));
          e.y = Math.max(5, Math.min(SIM_HEIGHT - 5, e.y));
        }
      }
    }

    let sharedEnvDelta = 0;
    if (this.params.rewardGroupEnemies && activeEnemies.length > 1) {
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < activeEnemies.length; i++) {
        cx += activeEnemies[i].x;
        cy += activeEnemies[i].y;
      }
      cx /= activeEnemies.length;
      cy /= activeEnemies.length;
      let totalSpread = 0;
      for (let i = 0; i < activeEnemies.length; i++) {
        totalSpread += Math.hypot(activeEnemies[i].x - cx, activeEnemies[i].y - cy);
      }
      const avgSpread = totalSpread / activeEnemies.length;
      const maxArenaRadius = Math.hypot(SIM_WIDTH, SIM_HEIGHT) * 0.5;
      const tightness = Math.max(0, maxArenaRadius - avgSpread);
      sharedEnvDelta += tightness * this.params.weightGroupEnemies;
    }

    if (this.params.rewardSpreadEnemies && activeEnemies.length > 1) {
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < activeEnemies.length; i++) {
        cx += activeEnemies[i].x;
        cy += activeEnemies[i].y;
      }
      cx /= activeEnemies.length;
      cy /= activeEnemies.length;
      let totalSpread = 0;
      for (let i = 0; i < activeEnemies.length; i++) {
        totalSpread += Math.hypot(activeEnemies[i].x - cx, activeEnemies[i].y - cy);
      }
      const avgSpread = totalSpread / activeEnemies.length;
      sharedEnvDelta += avgSpread * this.params.weightSpreadEnemies;
    }

    if (this.params.rewardEdgeEnemies && activeEnemies.length > 0) {
      let totalEdgeCloseness = 0;
      for (let i = 0; i < activeEnemies.length; i++) {
        const e = activeEnemies[i];
        const distToLeft = e.x;
        const distToRight = SIM_WIDTH - e.x;
        const distToTop = e.y;
        const distToBottom = SIM_HEIGHT - e.y;
        const minDistToEdge = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        const maxPossibleEdgeDist = Math.min(SIM_WIDTH, SIM_HEIGHT) * 0.5;
        const edgeCloseness = Math.max(0, maxPossibleEdgeDist - minDistToEdge);
        totalEdgeCloseness += edgeCloseness;
      }
      sharedEnvDelta +=
        (totalEdgeCloseness / activeEnemies.length) * this.params.weightEdgeEnemies;
    }

    if (this.params.rewardAvgEnemyCenter && activeEnemies.length > 0) {
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < activeEnemies.length; i++) {
        cx += activeEnemies[i].x;
        cy += activeEnemies[i].y;
      }
      cx /= activeEnemies.length;
      cy /= activeEnemies.length;
      const distFromCenter = Math.hypot(cx - SIM_WIDTH * 0.5, cy - SIM_HEIGHT * 0.5);
      const maxArenaRadius = Math.hypot(SIM_WIDTH, SIM_HEIGHT) * 0.5;
      const centerScore = Math.max(0, maxArenaRadius - distFromCenter);
      sharedEnvDelta += centerScore * this.params.weightAvgEnemyCenter;
    }

    const rewardDeltaA = this.evaluateAgentPerStepRewards(
      'A',
      prevPxA,
      prevPyA,
      minEnemyDistA,
      activeEnemies,
      activeEnemyIndices,
      activeEnemyVels
    );

    if (this.splitBrainMode) {
      const baseSurvival = 0.5 + (sharedEnvDelta + rewardDeltaA) * 0.5;
      let bestLive = -Infinity;
      for (const entry of splitEntries) {
        const intentScore = this.computeSplitBrainIntentScore(
          entry.vx,
          entry.vy,
          this.player.vx,
          this.player.vy,
          prevPxA,
          prevPyA,
          activeEnemies
        );
        const nextFit = this.getSplitBrainFitness(entry.id) + baseSurvival + intentScore;
        this.setSplitBrainFitness(entry.id, nextFit);
        if (nextFit > bestLive) bestLive = nextFit;
      }
      this.currentFitness = Number.isFinite(bestLive) ? bestLive : this.currentFitness;
    } else if (this.dualAgentMode) {
      const rewardDeltaB = this.evaluateAgentPerStepRewards(
        'B',
        prevPxB,
        prevPyB,
        minEnemyDistB,
        activeEnemies,
        activeEnemyIndices,
        activeEnemyVels
      );
      this.currentFitness += sharedEnvDelta + (rewardDeltaA + rewardDeltaB) * 0.5;
    } else {
      this.currentFitness += sharedEnvDelta + rewardDeltaA;
    }

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.spawnDelay && e.spawnDelay > 0) {
        e.spawnDelay--;
      }
    }

    if (manualControl || (!this.params.turboMode && this.params.simSpeed <= 4)) {
      this.stepProceduralVisuals();
    }

    this.stepCount++;
    if (!manualControl && this.stepCount >= this.maxSteps) {
      this.endEpisode();
    }
    return false;
  }

  stepHumanControl(
    ax: number,
    ay: number,
    auxFlag = false,
    agentId: AgentId = this.activeInspectAgent
  ): {
    inputs: number[];
    action: number[];
    fitness: number;
    hit: boolean;
    stepCount: number;
  } {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const inputs = this.buildCurrentInputs(targetId);
    const headingRad = this.getAgentMotorState(targetId).headingRad;
    let cx = ax;
    let cy = ay;
    const mag = Math.hypot(cx, cy);
    if (mag > 1) {
      cx /= mag;
      cy /= mag;
    }

    const mode = this.getOutputConfig(targetId);
    let action: number[];
    if (mode === 'sprint_burst' || mode === 'dash_3d') {
      action = [cx, cy, auxFlag ? 1 : -1];
    } else if (mode === 'throttle_3d') {
      const clampedMag = Math.min(1, mag);
      const dirX = clampedMag > 1e-4 ? ax / Math.hypot(ax, ay) : 0;
      const dirY = clampedMag > 1e-4 ? ay / Math.hypot(ax, ay) : 0;
      const effThrottle = auxFlag ? Math.min(clampedMag, 0.35) : clampedMag;
      const spdRaw = Math.max(-1, Math.min(1, effThrottle * 2 - 1));
      action = [dirX, dirY, spdRaw];
    } else if (mode === 'drift_3d') {
      action = [cx, cy, auxFlag ? -0.85 : 0.85];
    } else if (mode === 'polar_2d') {
      const m = Math.min(1, Math.hypot(cx, cy));
      let turn = 0;
      let thrust = 0;
      if (m > 0.05) {
        const targetAng = Math.atan2(cy, cx);
        let diff = targetAng - headingRad;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        turn = Math.max(-1, Math.min(1, diff / 0.32));
        const fx = Math.cos(headingRad);
        const fy = Math.sin(headingRad);
        thrust = Math.max(-1, Math.min(1, cx * fx + cy * fy));
      }
      action = [turn, thrust];
    } else if (mode === 'car_2d') {
      const m = Math.min(1, Math.hypot(cx, cy));
      let steer = 0;
      let gas = 0;
      if (m > 0.05) {
        const targetAng = Math.atan2(cy, cx);
        let diff = targetAng - headingRad;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.cos(diff) >= -0.25) {
          gas = m;
          steer = Math.max(-1, Math.min(1, diff / 0.32));
        } else {
          gas = -m;
          let revDiff = targetAng - (headingRad + Math.PI);
          while (revDiff > Math.PI) revDiff -= Math.PI * 2;
          while (revDiff < -Math.PI) revDiff += Math.PI * 2;
          steer = Math.max(-1, Math.min(1, -revDiff / 0.32));
        }
      }
      action = [steer, gas];
    } else if (mode === 'asteroids_2d') {
      const m = Math.min(1, Math.hypot(cx, cy));
      let turn = 0;
      let boost = 0;
      if (m > 0.05) {
        const targetAng = Math.atan2(cy, cx);
        let diff = targetAng - headingRad;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        turn = Math.max(-1, Math.min(1, diff / 0.32));
        const align = Math.cos(diff);
        boost = align > 0.15 ? Math.max(0, Math.min(1, m * align)) : 0;
      }
      action = [turn, boost];
    } else if (mode === 'compass_2d') {
      const m = Math.min(1, Math.hypot(cx, cy));
      if (m > 0.05) {
        const angNorm = Math.max(-1, Math.min(1, Math.atan2(cy, cx) / Math.PI));
        action = [angNorm, Math.max(-1, Math.min(1, m * 2 - 1))];
      } else {
        action = [0, -1];
      }
    } else if (mode === 'etch_2d') {
      action = Math.abs(cx) >= Math.abs(cy) ? [cx, 0] : [0, cy];
    } else if (mode === 'polar_3d') {
      const m = Math.min(1, Math.hypot(cx, cy));
      let turn = 0;
      let thrust = 0;
      let strafe = 0;
      if (m > 0.05) {
        const targetAng = Math.atan2(cy, cx);
        let diff = targetAng - headingRad;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        turn = Math.max(-1, Math.min(1, diff / 0.32));
        const fx = Math.cos(headingRad);
        const fy = Math.sin(headingRad);
        const rx = -fy;
        const ry = fx;
        thrust = Math.max(-1, Math.min(1, cx * fx + cy * fy));
        strafe = Math.max(-1, Math.min(1, cx * rx + cy * ry));
      }
      action = [turn, thrust, strafe];
    } else if (mode === 'spin_frame_3d') {
      const m = Math.min(1, Math.hypot(cx, cy));
      let turn = 0;
      let lx = 0;
      let ly = 0;
      if (m > 0.05) {
        const targetAng = Math.atan2(cy, cx);
        let diff = targetAng - headingRad;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        turn = Math.max(-1, Math.min(1, diff / 0.32));
        const cosH = Math.cos(headingRad);
        const sinH = Math.sin(headingRad);
        lx = Math.max(-1, Math.min(1, cx * cosH + cy * sinH));
        ly = Math.max(-1, Math.min(1, -cx * sinH + cy * cosH));
      }
      action = [lx, ly, turn];
    } else if (mode === 'hybrid_4d') {
      const m = Math.min(1, Math.hypot(cx, cy));
      let turn = 0;
      let thrust = 0;
      if (m > 0.05) {
        const targetAng = Math.atan2(cy, cx);
        let diff = targetAng - headingRad;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        turn = Math.max(-1, Math.min(1, diff / 0.32));
        const fx = Math.cos(headingRad);
        const fy = Math.sin(headingRad);
        thrust = Math.max(-1, Math.min(1, cx * fx + cy * fy));
      }
      action = [cx * 0.65, cy * 0.65, turn, thrust * 0.65];
    } else if (mode === 'thrusters_4d') {
      action = [
        cx > 0 ? cx : -0.5,
        cx < 0 ? -cx : -0.5,
        cy > 0 ? cy : -0.5,
        cy < 0 ? -cy : -0.5,
      ];
    } else {
      action = [cx, cy];
    }

    const hit = this.update({
      ax: action[0],
      ay: action[1],
      aux: action[2],
      rawOutputs: action,
      agentId: targetId,
    });
    const { cues, telemetry } = this.proceduralVisualsEngine.consumeAudioFrame();
    if (this.dualAgentMode) {
      this.proceduralVisualsEngineB.consumeAudioFrame();
    }
    if (this.getVisualMode() !== 'classic') {
      this.proceduralAudioEngine.setFrameAudible(true);
      this.proceduralAudioEngine.processFrame(cues, telemetry);
    } else {
      this.proceduralAudioEngine.setFrameAudible(false);
    }
    return {
      inputs,
      action,
      fitness: this.splitBrainMode ? this.getSplitBrainFitness(targetId) : this.currentFitness,
      hit,
      stepCount: this.stepCount,
    };
  }

  applyTrainedAgent(
    trainedNet: NeuralNetwork,
    seedPopulation = true,
    agentId: AgentId = this.activeInspectAgent
  ): void {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const elite = trainedNet.clone();
    elite.fitness = -Infinity;

    if (this.isExtraBrainId(targetId)) {
      const slot = this.extraBrains[targetId];
      if (seedPopulation) {
        const nextPop: NeuralNetwork[] = [elite];
        while (nextPop.length < this.popSize) {
          const child = elite.clone();
          child.mutate(0.08);
          nextPop.push(child);
        }
        slot.population = nextPop;
      } else {
        if (slot.population.length === 0) {
          slot.population = [elite];
        } else {
          slot.population[0] = elite;
        }
      }
      slot.popPairingOrder = Array.from({ length: this.popSize }, (_, idx) => idx);
      this.popIndex = 0;
      slot.agent = slot.population[0];
      slot.bestAgent = elite.clone();
      slot.bestFitness = -Infinity;
      this.startEpisode();
      return;
    }

    if (targetId === 'B') {
      if (seedPopulation) {
        const nextPop: NeuralNetwork[] = [elite];
        while (nextPop.length < this.popSize) {
          const child = elite.clone();
          child.mutate(0.08);
          nextPop.push(child);
        }
        this.populationB = nextPop;
      } else {
        if (this.populationB.length === 0) {
          this.populationB = [elite];
        } else {
          this.populationB[0] = elite;
        }
      }
      this.popPairingOrderB = Array.from({ length: this.popSize }, (_, idx) => idx);
      this.popIndex = 0;
      this.agentB = this.populationB[0];
      this.bestAgentB = elite.clone();
      this.bestFitnessB = -Infinity;
      this.bestFitness = this.splitBrainMode ? this.bestFitnessA : -Infinity;
      this.startEpisode();
      return;
    }

    if (seedPopulation) {
      const nextPop: NeuralNetwork[] = [elite];
      while (nextPop.length < this.popSize) {
        const child = elite.clone();
        child.mutate(0.08);
        nextPop.push(child);
      }
      this.population = nextPop;
    } else {
      if (this.population.length === 0) {
        this.population = [elite];
      } else {
        this.population[0] = elite;
      }
    }

    this.popIndex = 0;
    this.agent = this.population[0];
    this.bestAgent = elite.clone();
    this.bestFitness = -Infinity;
    this.startEpisode();
  }

  evaluateSpatialSample(
    px: number,
    py: number,
    agentId: AgentId = this.activeInspectAgent
  ): { fitness: number; hit: boolean } {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const targetAgent = this.getTargetAgent(targetId);
    if (!targetAgent) return { fitness: 0, hit: false };

    const targetPl = targetId === 'B' && this.dualAgentMode ? this.playerB : this.player;
    const motorState = this.getAgentMotorState(targetId);
    const targetHeading = motorState.headingRad;
    const targetStamina = motorState.stamina;
    const targetSprinting = motorState.sprinting;
    const targetPrevVx = targetId === 'B' && this.dualAgentMode ? this.prevVxB : this.prevVx;
    const targetPrevVy = targetId === 'B' && this.dualAgentMode ? this.prevVyB : this.prevVy;
    const targetEmaVx = targetId === 'B' && this.dualAgentMode ? this.emaVxB : this.emaVx;
    const targetEmaVy = targetId === 'B' && this.dualAgentMode ? this.emaVyB : this.emaVy;
    const targetEmaPx = targetId === 'B' && this.dualAgentMode ? this.emaPxB : this.emaPx;
    const targetEmaPy = targetId === 'B' && this.dualAgentMode ? this.emaPyB : this.emaPy;
    const partnerPrev = this.doesAgentReceiveTelepathy(targetId)
      ? targetId === 'B'
        ? this.prevRawOutputsA
        : this.prevRawOutputsB
      : [0, 0, 0, 0];

    const activeEnemies = this.enemies.filter((e) => !e.spawnDelay || e.spawnDelay <= 0);
    const inputs = this.buildInputsForAgent(
      { x: px, y: py, vx: targetPl.vx, vy: targetPl.vy },
      partnerPrev,
      activeEnemies
    );

    const outputs = targetAgent.forwardOnly(inputs);
    const decoded = this.decodeVelocityOutputs(
      outputs,
      targetPl.vx,
      targetPl.vy,
      targetHeading,
      targetStamina,
      targetSprinting,
      this.getOutputConfig(targetId)
    );

    let vx = decoded.vx;
    let vy = decoded.vy;
    if (this.splitBrainMode) {
      const entries: { id: AgentId; vx: number; vy: number }[] = [];
      for (const id of this.getActiveBrainIds()) {
        if (id === targetId) {
          entries.push({ id, vx: decoded.vx, vy: decoded.vy });
          continue;
        }
        const partnerAgent = this.getTargetAgent(id);
        if (!partnerAgent) continue;
        const pOut = partnerAgent.forwardOnly(inputs);
        const pMotor = this.getAgentMotorState(id);
        const pDecoded = this.decodeVelocityOutputs(
          pOut,
          targetPl.vx,
          targetPl.vy,
          pMotor.headingRad,
          pMotor.stamina,
          pMotor.sprinting,
          this.getOutputConfig(id)
        );
        entries.push({ id, vx: pDecoded.vx, vy: pDecoded.vy });
      }
      if (entries.length > 0) {
        const merged = this.mergeSplitBrainVelocities(entries);
        vx = merged.vx;
        vy = merged.vy;
      }
    }
    const nx = Math.max(6, Math.min(SIM_WIDTH - 6, px + vx));
    const ny = Math.max(6, Math.min(SIM_HEIGHT - 6, py + vy));
    const nvx = vx / this.playerSpeed;
    const nvy = vy / this.playerSpeed;

    let fitness = 0;
    let minEnemyDist = Infinity;
    const enemyVels: { vx: number; vy: number }[] = [];

    for (let i = 0; i < activeEnemies.length; i++) {
      const e = activeEnemies[i];
      const dx = nx - e.x;
      const dy = ny - e.y;
      const d = Math.hypot(dx, dy);
      if (d < minEnemyDist) minEnemyDist = d;
      const effSpeed =
        this.params.enemySpeedMode === 'rarity'
          ? this.playerSpeed * (Math.min(90, Math.max(1, e.speedPct ?? 60)) / 100)
          : this.enemySpeed;
      enemyVels.push(d > 0.1 ? { vx: (dx / d) * effSpeed, vy: (dy / d) * effSpeed } : { vx: 0, vy: 0 });
    }

    const hit = activeEnemies.length > 0 && minEnemyDist < 11;
    if (hit && this.params.rewardHit) {
      fitness += this.params.weightHit;
    }

    if (this.params.rewardEnemyDist && activeEnemies.length > 0) {
      fitness += minEnemyDist * this.params.weightEnemyDist;
    }

    if (this.params.rewardWallDist) {
      const minWallDist = Math.min(nx - 6, SIM_WIDTH - 6 - nx, ny - 6, SIM_HEIGHT - 6 - ny);
      fitness += minWallDist * this.params.weightWallDist;
    }

    if (this.params.rewardGroupEnemies && activeEnemies.length > 1) {
      let cx = 0;
      let cy = 0;
      for (const e of activeEnemies) {
        cx += e.x;
        cy += e.y;
      }
      cx /= activeEnemies.length;
      cy /= activeEnemies.length;
      let spread = 0;
      for (const e of activeEnemies) spread += Math.hypot(e.x - cx, e.y - cy);
      const maxArenaRadius = Math.hypot(SIM_WIDTH, SIM_HEIGHT) * 0.5;
      fitness += Math.max(0, maxArenaRadius - spread / activeEnemies.length) * this.params.weightGroupEnemies;
    }

    if (this.params.rewardSpreadEnemies && activeEnemies.length > 1) {
      let cx = 0;
      let cy = 0;
      for (const e of activeEnemies) {
        cx += e.x;
        cy += e.y;
      }
      cx /= activeEnemies.length;
      cy /= activeEnemies.length;
      let spread = 0;
      for (const e of activeEnemies) spread += Math.hypot(e.x - cx, e.y - cy);
      fitness += (spread / activeEnemies.length) * this.params.weightSpreadEnemies;
    }

    if (this.params.rewardEdgeEnemies && activeEnemies.length > 0) {
      const maxPossibleEdgeDist = Math.min(SIM_WIDTH, SIM_HEIGHT) * 0.5;
      let total = 0;
      for (const e of activeEnemies) {
        const minEdge = Math.min(e.x, SIM_WIDTH - e.x, e.y, SIM_HEIGHT - e.y);
        total += Math.max(0, maxPossibleEdgeDist - minEdge);
      }
      fitness += (total / activeEnemies.length) * this.params.weightEdgeEnemies;
    }

    if (this.params.rewardAvgEnemyCenter && activeEnemies.length > 0) {
      let cx = 0;
      let cy = 0;
      for (const e of activeEnemies) {
        cx += e.x;
        cy += e.y;
      }
      cx /= activeEnemies.length;
      cy /= activeEnemies.length;
      const distFromCenter = Math.hypot(cx - SIM_WIDTH * 0.5, cy - SIM_HEIGHT * 0.5);
      const maxArenaRadius = Math.hypot(SIM_WIDTH, SIM_HEIGHT) * 0.5;
      fitness += Math.max(0, maxArenaRadius - distFromCenter) * this.params.weightAvgEnemyCenter;
    }

    if (this.params.rewardOppHeading && activeEnemies.length > 0) {
      let avgEx = 0;
      let avgEy = 0;
      for (const e of activeEnemies) {
        const dx = e.x - nx;
        const dy = e.y - ny;
        const d = Math.hypot(dx, dy);
        if (d > 0.001) {
          avgEx += dx / d;
          avgEy += dy / d;
        }
      }
      avgEx /= activeEnemies.length;
      avgEy /= activeEnemies.length;
      const avgMag = Math.hypot(avgEx, avgEy);
      const pMag = Math.hypot(vx, vy);
      if (avgMag > 0.001 && pMag > 0.001) {
        const alignment = (vx / pMag) * (-avgEx / avgMag) + (vy / pMag) * (-avgEy / avgMag);
        fitness += alignment * 100 * this.params.weightOppHeading;
      }
    }

    if (this.params.rewardSmoothVel) {
      const speedNorm = Math.hypot(nvx, nvy);
      const jerk = Math.hypot(nvx - targetPrevVx, nvy - targetPrevVy);
      const noise = Math.hypot(nvx - targetEmaVx, nvy - targetEmaVy);
      fitness += (speedNorm - 1.5 * jerk - 1.0 * noise) * 80 * this.params.weightSmoothVel;
    }

    if ((this.params.rewardSplitGap || this.params.rewardSplitGapPredict || this.params.rewardSplitGapCollect) && activeEnemies.length > 0) {
      const sortedNearby = activeEnemies
        .map((e) => ({ dist: Math.hypot(e.x - nx, e.y - ny), angle: Math.atan2(e.y - ny, e.x - nx) }))
        .sort((a, b) => a.dist - b.dist);
      const within = sortedNearby.filter((e) => e.dist <= 220);
      const nearby = within.length >= 2 ? within.slice(0, 12) : sortedNearby.slice(0, Math.min(sortedNearby.length, 8));
      let bestMidAngle = 0;
      if (nearby.length === 1) {
        bestMidAngle = nearby[0].angle + Math.PI;
      } else {
        const angles = nearby.map((e) => e.angle).sort((a, b) => a - b);
        let maxGap = -1;
        for (let i = 0; i < angles.length; i++) {
          const a1 = angles[i];
          const a2 = i === angles.length - 1 ? angles[0] + Math.PI * 2 : angles[i + 1];
          if (a2 - a1 > maxGap) {
            maxGap = a2 - a1;
            bestMidAngle = a1 + maxGap * 0.5;
          }
        }
      }
      const gapAlign = nvx * Math.cos(bestMidAngle) + nvy * Math.sin(bestMidAngle);
      if (this.params.rewardSplitGap) fitness += gapAlign * 100 * this.params.weightSplitGap;
      if (this.params.rewardSplitGapPredict) fitness += gapAlign * 100 * this.params.weightSplitGapPredict;
      if (this.params.rewardSplitGapCollect) fitness += Math.max(0, gapAlign) * 60 * this.params.weightSplitGapCollect;
    }

    const speedNorm = Math.hypot(nvx, nvy);
    if (speedNorm > 0.01) {
      const ux = nvx / speedNorm;
      const uy = nvy / speedNorm;

      if (this.params.rewardEdgeSense && activeEnemies.length > 0) {
        const rx = -uy;
        const ry = ux;
        let leftT = 0;
        let rightT = 0;
        let frontT = 0;
        for (const e of activeEnemies) {
          const dx = e.x - nx;
          const dy = e.y - ny;
          const d = Math.hypot(dx, dy);
          if (d <= 0.001 || d >= 140) continue;
          const closeness = 1 - d / 140;
          const ndx = dx / d;
          const ndy = dy / d;
          const fwd = ndx * ux + ndy * uy;
          const lat = ndx * rx + ndy * ry;
          const pt = closeness * Math.abs(lat);
          if (lat < 0 && pt > leftT) leftT = pt;
          if (lat > 0 && pt > rightT) rightT = pt;
          if (fwd > 0.75) {
            const ft = closeness * ((fwd - 0.75) / 0.25);
            if (ft > frontT) frontT = ft;
          }
        }
        fitness += (Math.abs(leftT - rightT) - Math.min(leftT, rightT) - 0.5 * frontT) * speedNorm * 100 * this.params.weightEdgeSense;
      }

      if (this.params.rewardOrbitKite && activeEnemies.length > 0 && minEnemyDist > 0.001) {
        let nearDx = 0;
        let nearDy = 0;
        let nd = Infinity;
        for (const e of activeEnemies) {
          const d = Math.hypot(e.x - nx, e.y - ny);
          if (d < nd) {
            nd = d;
            nearDx = e.x - nx;
            nearDy = e.y - ny;
          }
        }
        const tangent = 1 - Math.abs(ux * (nearDx / nd) + uy * (nearDy / nd));
        const sweet = Math.max(0, 1 - Math.abs(nd - 85) / 55);
        const closePen = nd < 35 ? ((35 - nd) / 35) * 0.6 : 0;
        fitness += (sweet * (tangent - 0.15) - closePen) * speedNorm * 100 * this.params.weightOrbitKite;
      }

      if (this.params.rewardOpenCorridor) {
        const baseAngle = Math.atan2(uy, ux);
        const offsets = [-0.42, 0, 0.42];
        const maxHorizon = 240;
        let minRay = 1;
        let sumRay = 0;
        for (const off of offsets) {
          const rx = Math.cos(baseAngle + off);
          const ry = Math.sin(baseAngle + off);
          const tx = rx > 1e-5 ? (SIM_WIDTH - 6 - nx) / rx : rx < -1e-5 ? (6 - nx) / rx : maxHorizon;
          const ty = ry > 1e-5 ? (SIM_HEIGHT - 6 - ny) / ry : ry < -1e-5 ? (6 - ny) / ry : maxHorizon;
          let clearance = Math.max(0, Math.min(maxHorizon, tx, ty));
          for (const e of activeEnemies) {
            const dx = e.x - nx;
            const dy = e.y - ny;
            const proj = dx * rx + dy * ry;
            if (proj > 0 && proj < clearance + 11 && Math.abs(dx * ry - dy * rx) < 22) {
              clearance = Math.min(clearance, Math.max(0, proj - 11));
            }
          }
          const nc = clearance / maxHorizon;
          if (nc < minRay) minRay = nc;
          sumRay += nc;
        }
        fitness += (0.5 * minRay + 0.5 * (sumRay / offsets.length)) * speedNorm * 100 * this.params.weightOpenCorridor;
      }

      if (this.params.rewardSpideySense && activeEnemies.length > 0) {
        let ox = 0;
        let oy = 0;
        for (let i = 0; i < activeEnemies.length; i++) {
          const dx = activeEnemies[i].x - nx;
          const dy = activeEnemies[i].y - ny;
          const d = Math.hypot(dx, dy);
          if (d <= 0.001 || d >= 200) continue;
          const gx = dx / d;
          const gy = dy / d;
          const prox = 1 - d / 200;
          const closing = ((vx - enemyVels[i].vx) * gx + (vy - enemyVels[i].vy) * gy) / this.playerSpeed;
          const gm = prox * prox * (0.35 + Math.max(0, closing));
          ox += gx * gm;
          oy += gy * gm;
        }
        const pierce = ox * nvx + oy * nvy;
        if (pierce > 0) fitness -= pierce * 100 * this.params.weightSpideySense;
      }

      if (this.params.rewardVectorStabbing) {
        const stabBuffer = 24;
        const rawNextX = px + vx;
        const rawNextY = py + vy;
        const dLeft = Math.max(0, px - 6);
        const dRight = Math.max(0, SIM_WIDTH - 6 - px);
        const dTop = Math.max(0, py - 6);
        const dBot = Math.max(0, SIM_HEIGHT - 6 - py);
        const stabLeft = Math.max(Math.max(0, 6 - rawNextX) / this.playerSpeed, 0.5 * (dLeft < stabBuffer ? (1 - dLeft / stabBuffer) * Math.max(0, -nvx) : 0));
        const stabRight = Math.max(Math.max(0, rawNextX - (SIM_WIDTH - 6)) / this.playerSpeed, 0.5 * (dRight < stabBuffer ? (1 - dRight / stabBuffer) * Math.max(0, nvx) : 0));
        const stabTop = Math.max(Math.max(0, 6 - rawNextY) / this.playerSpeed, 0.5 * (dTop < stabBuffer ? (1 - dTop / stabBuffer) * Math.max(0, -nvy) : 0));
        const stabBot = Math.max(Math.max(0, rawNextY - (SIM_HEIGHT - 6)) / this.playerSpeed, 0.5 * (dBot < stabBuffer ? (1 - dBot / stabBuffer) * Math.max(0, nvy) : 0));
        const totalStab = Math.min(1.5, stabLeft + stabRight + stabTop + stabBot);
        if (totalStab > 0) fitness += totalStab * 100 * this.params.weightVectorStabbing;
      }

      if (this.params.rewardTwitch && activeEnemies.length > 0) {
        const prevStepMag = Math.hypot(targetPrevVx, targetPrevVy);
        if (prevStepMag > 0.05) {
          const fx = targetPrevVx / prevStepMag;
          const fy = targetPrevVy / prevStepMag;
          const twitchRadius = 115;
          const turnSnap = Math.min(1, Math.hypot(nvx - targetPrevVx, nvy - targetPrevVy) / 1.1);
          const latPrev = Math.abs(-ux * fy + uy * fx);
          let bestPos = 0;
          let worstNeg = 0;
          for (let i = 0; i < activeEnemies.length; i++) {
            const dx = activeEnemies[i].x - nx;
            const dy = activeEnemies[i].y - ny;
            const d = Math.hypot(dx, dy);
            if (d <= 0.001 || d >= twitchRadius) continue;
            const ex = dx / d;
            const ey = dy / d;
            const frontDot = fx * ex + fy * ey;
            if (frontDot <= 0.45) continue;
            const frontWeight = (1 - d / twitchRadius) * ((frontDot - 0.45) / 0.55);
            const towardEnemy = ux * ex + uy * ey;
            if (towardEnemy > 0.65) {
              const pen = -frontWeight * ((towardEnemy - 0.65) / 0.35);
              if (pen < worstNeg) worstNeg = pen;
            } else {
              const latEnemy = Math.abs(-ux * ey + uy * ex);
              const score =
                frontWeight *
                (0.55 * latPrev + 0.45 * latEnemy) *
                (0.35 + 0.65 * turnSnap);
              if (score > bestPos) bestPos = score;
            }
          }
          if (bestPos > 0 || worstNeg < 0) {
            fitness += (bestPos + worstNeg) * speedNorm * 100 * this.params.weightTwitch;
          }
        }
      }

      if (this.params.rewardFarWallSense) {
        const farX = Math.max(6, Math.min(SIM_WIDTH - 6, SIM_WIDTH * 0.5 + (SIM_WIDTH * 0.5 - targetEmaPx) * 1.5));
        const farY = Math.max(6, Math.min(SIM_HEIGHT - 6, SIM_HEIGHT * 0.5 + (SIM_HEIGHT * 0.5 - targetEmaPy) * 1.5));
        const toFarX = farX - nx;
        const toFarY = farY - ny;
        const dFar = Math.hypot(toFarX, toFarY);
        if (dFar > 0.001) {
          const align = (ux * toFarX + uy * toFarY) / dFar;
          const fw = Math.min(1, dFar / (Math.hypot(SIM_WIDTH, SIM_HEIGHT) * 0.45));
          fitness += align * fw * speedNorm * 100 * this.params.weightFarWallSense;
        }
      }
    }

    return { fitness, hit };
  }

  endEpisode(): void {
    if (!this.agent) return;
    const activeIds = this.getActiveBrainIds();

    if (this.splitBrainMode) {
      let bestOverall = this.bestFitness;
      for (const id of activeIds) {
        const net = this.getTargetAgent(id);
        const fit = this.getSplitBrainFitness(id);
        if (net) {
          net.fitness = fit;
          if (fit > this.getSplitBrainBestFitness(id)) {
            this.setSplitBrainBestFitness(id, fit);
            const clone = net.clone();
            clone.fitness = fit;
            if (id === 'B') {
              this.bestAgentB = clone;
            } else if (this.isExtraBrainId(id)) {
              this.extraBrains[id].bestAgent = clone;
            } else {
              this.bestAgent = clone;
            }
          }
        }
        const bFit = this.getSplitBrainBestFitness(id);
        if (bFit > bestOverall) bestOverall = bFit;
      }
      this.bestFitness = bestOverall;
    } else {
      this.agent.fitness = this.currentFitness;
      if (this.dualAgentMode && this.agentB) {
        this.agentB.fitness = this.currentFitness;
      }

      if (this.currentFitness > this.bestFitness) {
        this.bestFitness = this.currentFitness;
        this.bestAgent = this.agent.clone();
        this.bestAgent.fitness = this.agent.fitness;
        if (this.dualAgentMode && this.agentB) {
          this.bestAgentB = this.agentB.clone();
          this.bestAgentB.fitness = this.agentB.fitness;
        }
      }
    }

    this.popIndex++;
    if (this.popIndex >= this.popSize) {
      this.population.sort((a, b) => b.fitness - a.fitness);
      const nextGenA: NeuralNetwork[] = [];
      for (let i = 0; i < 3; i++) {
        nextGenA.push(this.population[i].clone());
      }
      while (nextGenA.length < this.popSize) {
        const parent = this.population[Math.floor(Math.random() * 3)];
        const child = parent.clone();
        child.mutate(0.2);
        nextGenA.push(child);
      }
      this.population = nextGenA;

      const evolveSecondaryPop = (pop: NeuralNetwork[]): { nextPop: NeuralNetwork[]; pairing: number[] } => {
        pop.sort((a, b) => b.fitness - a.fitness);
        const nextGen: NeuralNetwork[] = [];
        for (let i = 0; i < 3; i++) {
          nextGen.push(pop[i].clone());
        }
        while (nextGen.length < this.popSize) {
          const parent = pop[Math.floor(Math.random() * 3)];
          const child = parent.clone();
          child.mutate(0.2);
          nextGen.push(child);
        }
        const shuffledOffspring = Array.from(
          { length: Math.max(0, this.popSize - 3) },
          (_, i) => i + 3
        );
        for (let i = shuffledOffspring.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = shuffledOffspring[i];
          shuffledOffspring[i] = shuffledOffspring[j];
          shuffledOffspring[j] = tmp;
        }
        return { nextPop: nextGen, pairing: [0, 1, 2, ...shuffledOffspring] };
      };

      for (const id of activeIds) {
        if (id === 'A') continue;
        if (id === 'B' && this.populationB.length === this.popSize) {
          const res = evolveSecondaryPop(this.populationB);
          this.populationB = res.nextPop;
          this.popPairingOrderB = res.pairing;
        } else if (this.isExtraBrainId(id)) {
          const slot = this.extraBrains[id];
          if (slot.population.length === this.popSize) {
            const res = evolveSecondaryPop(slot.population);
            slot.population = res.nextPop;
            slot.popPairingOrder = res.pairing;
          }
        }
      }

      this.generation++;
      this.popIndex = 0;
    }

    this.onStatsChange?.(this.formatStatsText());
    this.startEpisode();
  }

  stepFrame(): void {
    const mode = this.getVisualMode();
    if (this.params.turboMode) {
      const startTime = performance.now();
      while (performance.now() - startTime < 14) {
        this.update();
      }
      this.stepProceduralVisuals();
      this.proceduralVisualsEngine.consumeAudioFrame();
      if (this.dualAgentMode) this.proceduralVisualsEngineB.consumeAudioFrame();
      this.proceduralAudioEngine.setFrameAudible(false);
    } else {
      for (let i = 0; i < this.params.simSpeed; i++) {
        this.update();
      }
      if (this.params.simSpeed > 4) {
        this.stepProceduralVisuals();
        this.proceduralVisualsEngine.consumeAudioFrame();
        if (this.dualAgentMode) this.proceduralVisualsEngineB.consumeAudioFrame();
        this.proceduralAudioEngine.setFrameAudible(false);
      } else {
        const { cues, telemetry } = this.proceduralVisualsEngine.consumeAudioFrame();
        if (this.dualAgentMode) this.proceduralVisualsEngineB.consumeAudioFrame();
        if (mode !== 'classic') {
          this.proceduralAudioEngine.setFrameAudible(true);
          this.proceduralAudioEngine.processFrame(cues, telemetry);
        } else {
          this.proceduralAudioEngine.setFrameAudible(false);
        }
      }
    }
  }

  private drawVectorArrow(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    vx: number,
    vy: number,
    color: string,
    lineWidth: number,
    dashed = false
  ): void {
    const mag = Math.hypot(vx, vy);
    if (mag < 0.08) return;
    const scale = 8.5;
    const len = Math.min(34, Math.max(6, mag * scale));
    const ux = vx / mag;
    const uy = vy / mag;
    const tx = ox + ux * len;
    const ty = oy + uy * len;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    if (dashed) ctx.setLineDash([2.5, 2]);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.setLineDash([]);
    const headLen = 4.5;
    const ang = Math.atan2(uy, ux);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - headLen * Math.cos(ang - 0.52), ty - headLen * Math.sin(ang - 0.52));
    ctx.lineTo(tx - headLen * Math.cos(ang + 0.52), ty - headLen * Math.sin(ang + 0.52));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawSplitBrainForceVectors(ctx: CanvasRenderingContext2D): void {
    const activeIds = this.getActiveBrainIds();
    for (const id of activeIds) {
      const vel = this.getSplitBrainVelocity(id);
      this.drawVectorArrow(
        ctx,
        this.player.x,
        this.player.y,
        vel.vx,
        vel.vy,
        BRAIN_COLORS[id].rgba(0.88),
        1.55,
        true
      );
    }
    this.drawVectorArrow(
      ctx,
      this.player.x,
      this.player.y,
      this.player.vx,
      this.player.vy,
      'rgba(255, 255, 255, 0.94)',
      1.8,
      false
    );
  }

  private drawSplitBrainBodyLabels(ctx: CanvasRenderingContext2D, labelY: number): void {
    const activeIds = this.getActiveBrainIds();
    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const step = 8;
    const startX = this.player.x - ((activeIds.length - 1) * step) * 0.5;
    for (let i = 0; i < activeIds.length; i++) {
      const id = activeIds[i];
      ctx.fillStyle = BRAIN_COLORS[id].lightHex;
      ctx.fillText(id, startX + i * step, labelY);
    }
    ctx.restore();
  }

  drawArena(ctx: CanvasRenderingContext2D): void {
    const mode = this.getVisualMode();

    if (mode !== 'classic') {
      this.proceduralVisualsEngine.drawArenaBackdrop(ctx, SIM_WIDTH, SIM_HEIGHT, mode);
      this.proceduralVisualsEngine.drawEnemiesAndWisps(
        ctx,
        this.enemies,
        this.player,
        mode,
        this.dualAgentMode ? this.playerB : undefined
      );
      this.proceduralVisualsEngine.drawPlayerAgent(ctx, mode);
      if (this.splitBrainMode) {
        this.drawSplitBrainForceVectors(ctx);
        this.drawSplitBrainBodyLabels(ctx, Math.max(12, this.player.y - 12));
      } else if (this.dualAgentMode) {
        this.proceduralVisualsEngineB.drawPlayerAgent(ctx, mode);
        this.proceduralVisualsEngineB.drawHitBursts(ctx);

        ctx.save();
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(103, 232, 249, 0.9)';
        ctx.fillText('A', this.player.x, Math.max(12, this.player.y - 11));
        ctx.fillStyle = 'rgba(252, 211, 77, 0.92)';
        ctx.fillText('B', this.playerB.x, Math.max(12, this.playerB.y - 11));
        ctx.restore();
      }
      this.proceduralVisualsEngine.drawHitBursts(ctx);
      return;
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIM_WIDTH, SIM_HEIGHT);

    const drawClassicAgent = (
      pl: Player,
      headingRad: number,
      stamina: number,
      sprinting: boolean,
      outCfg: OutputConfig,
      baseColor: string,
      staminaColor: string,
      tag?: string
    ) => {
      ctx.fillStyle = sprinting ? '#fde047' : baseColor;
      ctx.fillRect(pl.x - 6, pl.y - 6, 12, 12);

      if (this.hasBodyHeadingMode(outCfg)) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(pl.x, pl.y);
        ctx.lineTo(
          pl.x + Math.cos(headingRad) * 11,
          pl.y + Math.sin(headingRad) * 11
        );
        ctx.stroke();
      }

      if (this.hasChargeBarMode(outCfg) && (stamina < 0.99 || sprinting)) {
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(pl.x - 8, pl.y + 9, 16, 2);
        ctx.fillStyle = sprinting ? '#fde047' : staminaColor;
        ctx.fillRect(pl.x - 8, pl.y + 9, 16 * stamina, 2);
      }

      if (tag) {
        ctx.fillStyle = baseColor;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(tag, pl.x, Math.max(11, pl.y - 8));
      }
    };

    if (this.splitBrainMode) {
      const activeIds = this.getActiveBrainIds();
      const bodyW = 12;
      const segW = bodyW / activeIds.length;
      const startX = this.player.x - 6;
      const topY = this.player.y - 6;

      for (let i = 0; i < activeIds.length; i++) {
        const id = activeIds[i];
        ctx.fillStyle = BRAIN_COLORS[id].hex;
        ctx.fillRect(startX + i * segW, topY, segW + (i === activeIds.length - 1 ? 0 : 0.3), bodyW);
      }
      ctx.fillStyle = '#fff';
      for (let i = 1; i < activeIds.length; i++) {
        ctx.fillRect(startX + i * segW - 0.5, topY, 1, bodyW);
      }

      for (const id of activeIds) {
        const cfg = this.getOutputConfig(id);
        const motor = this.getAgentMotorState(id);
        if (this.hasBodyHeadingMode(cfg)) {
          ctx.strokeStyle = BRAIN_COLORS[id].lightHex;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(this.player.x, this.player.y);
          ctx.lineTo(
            this.player.x + Math.cos(motor.headingRad) * 11,
            this.player.y + Math.sin(motor.headingRad) * 11
          );
          ctx.stroke();
        }
      }

      this.drawSplitBrainForceVectors(ctx);
      this.drawSplitBrainBodyLabels(ctx, Math.max(11, this.player.y - 8));
    } else {
      drawClassicAgent(
        this.player,
        this.playerHeadingRad,
        this.playerStamina,
        this.playerSprinting,
        this.getOutputConfig('A'),
        '#0ff',
        '#22d3ee',
        this.dualAgentMode ? 'A' : undefined
      );

      if (this.dualAgentMode) {
        drawClassicAgent(
          this.playerB,
          this.playerBHeadingRad,
          this.playerBStamina,
          this.playerBSprinting,
          this.getOutputConfig('B'),
          '#f59e0b',
          '#fbbf24',
          'B'
        );
      }
    }

    ctx.fillStyle = '#f00';
    for (const e of this.enemies) {
      if (!e.spawnDelay || e.spawnDelay <= 0) {
        ctx.fillRect(e.x - 5, e.y - 5, 10, 10);
      }
    }
  }

  private getSplitGridBounds(): {
    panes: { id: AgentId; bounds: { x: number; y: number; width: number; height: number } }[];
    barY: number;
    barH: number;
    isDualBridgeLayout: boolean;
  } {
    const activeIds = this.getActiveBrainIds();
    const count = activeIds.length;
    if (count <= 2) {
      const bridgeH = 34;
      const paneH = Math.floor((NN_HEIGHT - bridgeH) / 2);
      return {
        panes: [
          { id: 'A', bounds: { x: 0, y: 0, width: NN_WIDTH, height: paneH } },
          {
            id: 'B',
            bounds: { x: 0, y: paneH + bridgeH, width: NN_WIDTH, height: NN_HEIGHT - paneH - bridgeH },
          },
        ],
        barY: paneH,
        barH: bridgeH,
        isDualBridgeLayout: true,
      };
    }

    const topBarH = 38;
    const availH = NN_HEIGHT - topBarH;
    if (count === 3) {
      const h1 = Math.floor(availH / 3);
      const h2 = Math.floor(availH / 3);
      const h3 = availH - h1 - h2;
      return {
        panes: [
          { id: 'A', bounds: { x: 0, y: topBarH, width: NN_WIDTH, height: h1 } },
          { id: 'B', bounds: { x: 0, y: topBarH + h1, width: NN_WIDTH, height: h2 } },
          { id: 'C', bounds: { x: 0, y: topBarH + h1 + h2, width: NN_WIDTH, height: h3 } },
        ],
        barY: 0,
        barH: topBarH,
        isDualBridgeLayout: false,
      };
    }

    if (count === 4) {
      const w1 = Math.floor(NN_WIDTH / 2);
      const w2 = NN_WIDTH - w1;
      const h1 = Math.floor(availH / 2);
      const h2 = availH - h1;
      return {
        panes: [
          { id: 'A', bounds: { x: 0, y: topBarH, width: w1, height: h1 } },
          { id: 'B', bounds: { x: w1, y: topBarH, width: w2, height: h1 } },
          { id: 'C', bounds: { x: 0, y: topBarH + h1, width: w1, height: h2 } },
          { id: 'D', bounds: { x: w1, y: topBarH + h1, width: w2, height: h2 } },
        ],
        barY: 0,
        barH: topBarH,
        isDualBridgeLayout: false,
      };
    }

    // 5 brains: 3 top panes (A, B, C) + 2 bottom panes (D, E)
    const topW1 = Math.floor(NN_WIDTH / 3);
    const topW2 = Math.floor(NN_WIDTH / 3);
    const topW3 = NN_WIDTH - topW1 - topW2;
    const botW1 = Math.floor(NN_WIDTH / 2);
    const botW2 = NN_WIDTH - botW1;
    const h1 = Math.floor(availH / 2);
    const h2 = availH - h1;
    return {
      panes: [
        { id: 'A', bounds: { x: 0, y: topBarH, width: topW1, height: h1 } },
        { id: 'B', bounds: { x: topW1, y: topBarH, width: topW2, height: h1 } },
        { id: 'C', bounds: { x: topW1 + topW2, y: topBarH, width: topW3, height: h1 } },
        { id: 'D', bounds: { x: 0, y: topBarH + h1, width: botW1, height: h2 } },
        { id: 'E', bounds: { x: botW1, y: topBarH + h1, width: botW2, height: h2 } },
      ],
      barY: 0,
      barH: topBarH,
      isDualBridgeLayout: false,
    };
  }

  getNNNodeLayout(
    agentId: AgentId = this.activeInspectAgent,
    bounds: { x: number; y: number; width: number; height: number } = {
      x: 0,
      y: 0,
      width: NN_WIDTH,
      height: NN_HEIGHT,
    }
  ): { x: number; y: number }[][] {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const targetAgent = this.getTargetAgent(targetId);
    if (!targetAgent) return [];
    const activeInputCount = this.getActiveInputCount(targetId);
    const hiddenSizes = targetAgent.getHiddenLayerSizes();
    const outputSize = targetAgent.getOutputSize();
    const layerCounts = [activeInputCount, ...hiddenSizes, outputSize];
    const numLayers = layerCounts.length;
    const padLeft = this.dualAgentMode ? 36 : bounds.width < 250 ? 12 : bounds.width < 340 ? 16 : 24;
    const padRight = bounds.width < 250 ? 30 : 50;
    const padY = bounds.height < 180 ? 16 : bounds.height < 260 ? 18 : 15;
    const layerSpacing = (bounds.width - padLeft - padRight) / Math.max(1, numLayers - 1);
    const layout: { x: number; y: number }[][] = [];

    for (let l = 0; l < numLayers; l++) {
      const count = layerCounts[l];
      const x = bounds.x + padLeft + l * layerSpacing;
      const stepY = (bounds.height - padY * 2) / Math.max(1, count - 1);
      const col: { x: number; y: number }[] = [];
      for (let n = 0; n < count; n++) {
        const y = count === 1 ? bounds.y + bounds.height / 2 : bounds.y + padY + n * stepY;
        col.push({ x, y });
      }
      layout.push(col);
    }
    return layout;
  }

  findHiddenNodeAt(
    x: number,
    y: number,
    radius = 9
  ): { hiddenLayer: number; nodeIndex: number; agentId: AgentId } | null {
    if (this.hasTwoBrains() && this.netViewMode === 'split') {
      const grid = this.getSplitGridBounds();
      const pane = grid.panes.find(
        (p) =>
          x >= p.bounds.x &&
          x <= p.bounds.x + p.bounds.width &&
          y >= p.bounds.y &&
          y <= p.bounds.y + p.bounds.height
      );
      if (!pane) return null;
      const layout = this.getNNNodeLayout(pane.id, pane.bounds);
      let bestDist = radius;
      let match: { hiddenLayer: number; nodeIndex: number; agentId: AgentId } | null = null;
      for (let l = 1; l < layout.length - 1; l++) {
        const nodes = layout[l];
        for (let n = 0; n < nodes.length; n++) {
          const d = Math.hypot(nodes[n].x - x, nodes[n].y - y);
          if (d <= bestDist) {
            bestDist = d;
            match = { hiddenLayer: l - 1, nodeIndex: n, agentId: pane.id };
          }
        }
      }
      return match;
    }

    const targetId: AgentId = this.clampActiveAgentId(
      this.netViewMode === 'split' ? 'A' : this.netViewMode
    );
    const targetAgent = this.getTargetAgent(targetId);
    if (!targetAgent) return null;
    const layout = this.getNNNodeLayout(targetId);
    let bestDist = radius;
    let match: { hiddenLayer: number; nodeIndex: number; agentId: AgentId } | null = null;

    for (let l = 1; l < layout.length - 1; l++) {
      const nodes = layout[l];
      for (let n = 0; n < nodes.length; n++) {
        const d = Math.hypot(nodes[n].x - x, nodes[n].y - y);
        if (d <= bestDist) {
          bestDist = d;
          match = { hiddenLayer: l - 1, nodeIndex: n, agentId: targetId };
        }
      }
    }
    return match;
  }

  private applyFreezeState(targetId: AgentId, nextFrozenAll: boolean, recordContext: boolean): void {
    if (targetId === 'B') {
      this.isFrozenB = nextFrozenAll;
      if (recordContext) {
        this.recordFrozenRewardContext(false, 'B');
      } else if (!this.isFrozenB) {
        this.frozenRewardEntriesB = [];
      }
    } else if (this.isExtraBrainId(targetId)) {
      const slot = this.extraBrains[targetId];
      slot.isFrozen = nextFrozenAll;
      if (recordContext) {
        this.recordFrozenRewardContext(false, targetId);
      } else if (!slot.isFrozen) {
        slot.frozenRewardEntries = [];
      }
    } else {
      this.isFrozen = nextFrozenAll;
      if (recordContext) {
        this.recordFrozenRewardContext(false, 'A');
      } else if (!this.isFrozen) {
        this.frozenRewardEntries = [];
      }
    }
  }

  toggleHiddenNodeFreeze(
    hiddenLayer: number,
    nodeIndex: number,
    agentId: AgentId = this.activeInspectAgent
  ): { isFrozen: boolean; canPrune: boolean; agentId: AgentId } {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const targetAgent = this.getTargetAgent(targetId);
    const targetPop = this.getTargetPopulation(targetId);
    const targetBest = this.getTargetBestAgent(targetId);
    if (!targetAgent) {
      return { isFrozen: this.isAgentFrozen(targetId), canPrune: false, agentId: targetId };
    }
    const currentlyFrozen = Boolean(targetAgent.frozenBiases[hiddenLayer]?.[nodeIndex]);
    const nextFrozen = !currentlyFrozen;

    for (const net of targetPop) {
      net.setHiddenNodeFrozen(hiddenLayer, nodeIndex, nextFrozen);
    }
    if (targetBest) {
      targetBest.setHiddenNodeFrozen(hiddenLayer, nodeIndex, nextFrozen);
    }

    const nextFrozenAll = targetAgent.hasFrozenWeights();
    this.applyFreezeState(targetId, nextFrozenAll, nextFrozen);
    return {
      isFrozen: nextFrozenAll,
      canPrune: this.canPrune(targetId),
      agentId: targetId,
    };
  }

  toggleHiddenNodesInRect(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): { changed: boolean; isFrozen: boolean; canPrune: boolean; agentId: AgentId } {
    const isSplit = this.hasTwoBrains() && this.netViewMode === 'split';
    let targetId: AgentId = this.clampActiveAgentId(
      this.netViewMode === 'split' ? 'A' : this.netViewMode
    );
    let bounds = { x: 0, y: 0, width: NN_WIDTH, height: NN_HEIGHT };
    if (isSplit) {
      const grid = this.getSplitGridBounds();
      const midX = (x1 + x2) * 0.5;
      const midY = (y1 + y2) * 0.5;
      const pane =
        grid.panes.find(
          (p) =>
            midX >= p.bounds.x &&
            midX <= p.bounds.x + p.bounds.width &&
            midY >= p.bounds.y &&
            midY <= p.bounds.y + p.bounds.height
        ) ?? grid.panes[0];
      targetId = pane.id;
      bounds = pane.bounds;
    }

    const targetAgent = this.getTargetAgent(targetId);
    const targetPop = this.getTargetPopulation(targetId);
    const targetBest = this.getTargetBestAgent(targetId);
    if (!targetAgent) {
      return {
        changed: false,
        isFrozen: this.isAgentFrozen(targetId),
        canPrune: false,
        agentId: targetId,
      };
    }

    const minX = Math.min(x1, x2) - 5;
    const maxX = Math.max(x1, x2) + 5;
    const minY = Math.min(y1, y2) - 5;
    const maxY = Math.max(y1, y2) + 5;
    const layout = this.getNNNodeLayout(targetId, bounds);
    const selected: { hiddenLayer: number; nodeIndex: number; frozen: boolean }[] = [];

    for (let l = 1; l < layout.length - 1; l++) {
      const nodes = layout[l];
      for (let n = 0; n < nodes.length; n++) {
        const pt = nodes[n];
        if (pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY) {
          selected.push({
            hiddenLayer: l - 1,
            nodeIndex: n,
            frozen: Boolean(targetAgent.frozenBiases[l - 1]?.[n]),
          });
        }
      }
    }

    if (selected.length === 0) {
      return {
        changed: false,
        isFrozen: this.isAgentFrozen(targetId),
        canPrune: this.canPrune(targetId),
        agentId: targetId,
      };
    }

    const shouldFreeze = selected.some((s) => !s.frozen);
    for (const item of selected) {
      for (const net of targetPop) {
        net.setHiddenNodeFrozen(item.hiddenLayer, item.nodeIndex, shouldFreeze);
      }
      if (targetBest) {
        targetBest.setHiddenNodeFrozen(item.hiddenLayer, item.nodeIndex, shouldFreeze);
      }
    }

    const nextFrozenAll = targetAgent.hasFrozenWeights();
    this.applyFreezeState(targetId, nextFrozenAll, shouldFreeze);
    return {
      changed: true,
      isFrozen: nextFrozenAll,
      canPrune: this.canPrune(targetId),
      agentId: targetId,
    };
  }

  private drawNNSingle(
    nnCtx: CanvasRenderingContext2D,
    agentId: AgentId,
    bounds: { x: number; y: number; width: number; height: number }
  ): void {
    const targetAgent = this.getTargetAgent(agentId);
    if (!targetAgent || !targetAgent.layerValues || targetAgent.layerValues.length === 0) return;

    const activeIndices = this.getActiveInputIndices(agentId);
    const inputLayerVals = activeIndices.map((rawIdx) => targetAgent.layerValues[0]?.[rawIdx] ?? 0);
    const layers = targetAgent.layerValues.map((vals, idx) => (idx === 0 ? inputLayerVals : vals));
    const numLayers = layers.length;
    const layout = this.getNNNodeLayout(agentId, bounds);
    const nodeCoords: { x: number; y: number; val: number; rawInputIdx?: number }[][] = layout.map(
      (col, l) =>
        col.map((pt, n) => ({
          x: pt.x,
          y: pt.y,
          val: layers[l]?.[n] ?? 0,
          rawInputIdx: l === 0 ? activeIndices[n] : undefined,
        }))
    );

    const frozenBoxes: {
      layerEnd: number;
      left: number;
      right: number;
      top: number;
      bottom: number;
    }[] = [];

    for (let l = 1; l < numLayers - 1; l++) {
      const nodes = nodeCoords[l];
      let runStart = -1;
      for (let n = 0; n <= nodes.length; n++) {
        const isNodeFrozen =
          n < nodes.length && Boolean(targetAgent.frozenBiases[l - 1]?.[n]);
        if (isNodeFrozen && runStart === -1) {
          runStart = n;
        } else if (!isNodeFrozen && runStart !== -1) {
          const top = nodes[runStart].y - 9;
          const bottom = nodes[n - 1].y + 9;
          const left = nodes[runStart].x - 11;
          const right = nodes[runStart].x + 11;
          const prev = frozenBoxes[frozenBoxes.length - 1];
          if (
            prev &&
            prev.layerEnd === l - 1 &&
            Math.abs(prev.top - top) < 1 &&
            Math.abs(prev.bottom - bottom) < 1
          ) {
            prev.layerEnd = l;
            prev.right = right;
          } else {
            frozenBoxes.push({ layerEnd: l, left, right, top, bottom });
          }
          runStart = -1;
        }
      }
    }

    for (const box of frozenBoxes) {
      const w = box.right - box.left;
      const h = box.bottom - box.top;
      nnCtx.fillStyle = 'rgba(38, 92, 175, 0.16)';
      nnCtx.strokeStyle = 'rgba(95, 165, 255, 0.52)';
      nnCtx.lineWidth = 1;
      nnCtx.beginPath();
      nnCtx.roundRect(box.left, box.top, w, h, 4);
      nnCtx.fill();
      nnCtx.stroke();
    }

    const firingEdges: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      signal: number;
      mag: number;
      phaseOffset: number;
      frozen: boolean;
      telepathy: boolean;
    }[] = [];

    for (let l = 0; l < targetAgent.weights.length; l++) {
      const wMatrix = targetAgent.weights[l];
      const fwMatrix = targetAgent.frozenWeights[l];
      const fromNodes = nodeCoords[l];
      const toNodes = nodeCoords[l + 1];
      for (let r = 0; r < toNodes.length; r++) {
        for (let c = 0; c < fromNodes.length; c++) {
          const weightCol = l === 0 ? fromNodes[c].rawInputIdx ?? c : c;
          const isTelepathyEdge = l === 0 && weightCol >= 104;
          const w = wMatrix[r]?.[weightCol] ?? 0;
          const isEdgeFrozen = Boolean(fwMatrix?.[r]?.[weightCol]);
          const baseAlpha = Math.min(0.24, Math.abs(w) * 0.18);
          const signal = fromNodes[c].val * w;
          const signalMag = Math.abs(signal);

          if (baseAlpha >= 0.025) {
            nnCtx.strokeStyle = isEdgeFrozen
              ? w > 0
                ? `rgba(80, 150, 235, ${baseAlpha})`
                : `rgba(145, 115, 230, ${baseAlpha})`
              : isTelepathyEdge
              ? agentId === 'A'
                ? `rgba(245, 158, 11, ${Math.min(0.38, baseAlpha * 1.35)})`
                : `rgba(34, 211, 238, ${Math.min(0.38, baseAlpha * 1.35)})`
              : w > 0
              ? `rgba(0, 200, 200, ${baseAlpha})`
              : `rgba(210, 60, 60, ${baseAlpha})`;
            nnCtx.lineWidth = Math.min(1.3, 0.45 + Math.abs(w) * 0.4);
            nnCtx.beginPath();
            nnCtx.moveTo(fromNodes[c].x, fromNodes[c].y);
            nnCtx.lineTo(toNodes[r].x, toNodes[r].y);
            nnCtx.stroke();
          }

          if (signalMag > 0.04) {
            firingEdges.push({
              x1: fromNodes[c].x,
              y1: fromNodes[c].y,
              x2: toNodes[r].x,
              y2: toNodes[r].y,
              signal,
              mag: signalMag,
              phaseOffset: l * 0.27 + (c * 0.13 + r * 0.19),
              frozen: isEdgeFrozen,
              telepathy: isTelepathyEdge,
            });
          }
        }
      }
    }

    const pulsePhase = performance.now() * 0.0016;
    for (const edge of firingEdges) {
      const alpha = Math.min(0.88, edge.mag * 0.72);
      nnCtx.strokeStyle = edge.frozen
        ? edge.signal > 0
          ? `rgba(105, 185, 255, ${alpha})`
          : `rgba(165, 130, 255, ${alpha})`
        : edge.telepathy
        ? edge.signal > 0
          ? agentId === 'A'
            ? `rgba(251, 191, 36, ${alpha})`
            : `rgba(34, 211, 238, ${alpha})`
          : `rgba(248, 113, 113, ${alpha})`
        : edge.signal > 0
        ? `rgba(0, 255, 255, ${alpha})`
        : `rgba(255, 65, 65, ${alpha})`;
      nnCtx.lineWidth = Math.min(2.2, 0.7 + edge.mag * 1.05);
      nnCtx.beginPath();
      nnCtx.moveTo(edge.x1, edge.y1);
      nnCtx.lineTo(edge.x2, edge.y2);
      nnCtx.stroke();

      if (edge.mag > 0.2) {
        const t = (pulsePhase + edge.phaseOffset) % 1;
        const px = edge.x1 + (edge.x2 - edge.x1) * t;
        const py = edge.y1 + (edge.y2 - edge.y1) * t;
        const dotAlpha = Math.min(0.85, edge.mag * 0.7);
        nnCtx.fillStyle = edge.frozen
          ? edge.signal > 0
            ? `rgba(205, 235, 255, ${dotAlpha})`
            : `rgba(225, 210, 255, ${dotAlpha})`
          : edge.signal > 0
          ? `rgba(180, 255, 255, ${dotAlpha})`
          : `rgba(255, 165, 165, ${dotAlpha})`;
        nnCtx.beginPath();
        nnCtx.arc(px, py, 1.35, 0, Math.PI * 2);
        nnCtx.fill();
      }
    }

    const nodeRadius =
      bounds.width < 250 || bounds.height < 180 ? 2.5 : bounds.height < 260 ? 3.2 : 4;
    for (let l = 0; l < numLayers; l++) {
      for (let n = 0; n < nodeCoords[l].length; n++) {
        const node = nodeCoords[l][n];
        const v = Math.max(-1, Math.min(1, node.val));
        const absV = Math.abs(v);
        const isHiddenFrozen =
          l > 0 &&
          l < numLayers - 1 &&
          Boolean(targetAgent.frozenBiases[l - 1]?.[n]);
        const isTelepathyInput = l === 0 && (node.rawInputIdx ?? -1) >= 104;

        nnCtx.beginPath();
        nnCtx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        if (isHiddenFrozen) {
          if (v >= 0) {
            nnCtx.fillStyle = `rgb(${Math.floor(25 + v * 75)}, ${Math.floor(
              70 + v * 130
            )}, ${Math.floor(145 + v * 110)})`;
          } else {
            const neg = -v;
            nnCtx.fillStyle = `rgb(${Math.floor(65 + neg * 115)}, ${Math.floor(
              55 + neg * 60
            )}, ${Math.floor(135 + neg * 120)})`;
          }
          nnCtx.fill();
          nnCtx.strokeStyle =
            absV > 0.35 ? (v >= 0 ? '#93c5fd' : '#c4b5fd') : '#5b82b0';
          nnCtx.lineWidth = 1.35;
        } else if (isTelepathyInput) {
          if (agentId === 'A') {
            const tint = Math.floor(120 + absV * 135);
            nnCtx.fillStyle =
              v >= 0
                ? `rgb(${tint}, ${Math.floor(tint * 0.65)}, 20)`
                : `rgb(${Math.floor(tint * 0.85)}, 48, 36)`;
            nnCtx.strokeStyle = absV > 0.25 ? '#fbbf24' : '#b45309';
          } else {
            const tint = Math.floor(110 + absV * 145);
            nnCtx.fillStyle =
              v >= 0
                ? `rgb(18, ${Math.floor(tint * 0.85)}, ${tint})`
                : `rgb(${Math.floor(tint * 0.85)}, 48, 48)`;
            nnCtx.strokeStyle = absV > 0.25 ? '#22d3ee' : '#0e7490';
          }
          nnCtx.fill();
          nnCtx.lineWidth = 1.4;
        } else {
          if (v >= 0) {
            const intensity = Math.floor(v * 255);
            nnCtx.fillStyle = `rgb(0, ${intensity}, ${intensity})`;
          } else {
            const intensity = Math.floor(-v * 255);
            nnCtx.fillStyle = `rgb(${intensity}, 40, 40)`;
          }
          nnCtx.fill();
          nnCtx.strokeStyle =
            absV > 0.35 ? (v >= 0 ? '#0aa' : '#a44') : '#555';
          nnCtx.lineWidth = 1;
        }
        nnCtx.stroke();

        if (isTelepathyInput && node.rawInputIdx !== undefined) {
          nnCtx.fillStyle = agentId === 'A' ? '#fbbf24' : '#22d3ee';
          nnCtx.font = '8px monospace';
          nnCtx.textAlign = 'right';
          nnCtx.textBaseline = 'middle';
          nnCtx.fillText(this.getInputLabel(node.rawInputIdx, agentId), node.x - 6, node.y);
          nnCtx.textAlign = 'left';
        }
      }
    }

    const outputNodes = nodeCoords[numLayers - 1];
    if (outputNodes && outputNodes.length > 0) {
      const outLabels = this.getOutputLabels(agentId);
      nnCtx.fillStyle = '#7b8594';
      nnCtx.font = bounds.width < 250 ? '8px monospace' : '9px monospace';
      nnCtx.textBaseline = 'middle';
      nnCtx.textAlign = 'left';
      for (let i = 0; i < outputNodes.length; i++) {
        const label = outLabels[i] ?? `o${i + 1}`;
        nnCtx.fillText(label, outputNodes[i].x + (bounds.width < 250 ? 5 : 7), outputNodes[i].y);
      }
    }

    if (this.hasTwoBrains()) {
      nnCtx.fillStyle = BRAIN_COLORS[agentId].hex;
      nnCtx.font = bounds.width < 250 ? 'bold 8px monospace' : 'bold 9px monospace';
      nnCtx.textAlign = 'left';
      nnCtx.textBaseline = 'top';
      const prefix = this.splitBrainMode ? 'BRAIN' : 'AGENT';
      const outTag = this.getOutputConfig(agentId).toUpperCase();
      nnCtx.fillText(
        bounds.width < 220 ? `${agentId} · ${outTag}` : `${prefix} ${agentId} · ${outTag}`,
        bounds.x + 6,
        bounds.y + 4
      );
    }
  }

  drawDualNN(
    nnCtx: CanvasRenderingContext2D,
    selectionBox?: { x1: number; y1: number; x2: number; y2: number } | null
  ): void {
    nnCtx.fillStyle = '#000';
    nnCtx.fillRect(0, 0, NN_WIDTH, NN_HEIGHT);

    const grid = this.getSplitGridBounds();
    for (const pane of grid.panes) {
      this.drawNNSingle(nnCtx, pane.id, pane.bounds);
    }

    if (!grid.isDualBridgeLayout) {
      nnCtx.strokeStyle = '#1e293b';
      nnCtx.lineWidth = 1;
      for (const pane of grid.panes) {
        nnCtx.strokeRect(
          pane.bounds.x + 0.5,
          pane.bounds.y + 0.5,
          pane.bounds.width - 1,
          pane.bounds.height - 1
        );
      }
    }

    const { barY, barH } = grid;
    nnCtx.fillStyle = '#090e17';
    nnCtx.fillRect(0, barY, NN_WIDTH, barH);
    nnCtx.strokeStyle = this.splitBrainMode ? '#334155' : '#1f2937';
    nnCtx.lineWidth = 1;
    nnCtx.beginPath();
    if (grid.isDualBridgeLayout) {
      nnCtx.moveTo(0, barY + 0.5);
      nnCtx.lineTo(NN_WIDTH, barY + 0.5);
    }
    nnCtx.moveTo(0, barY + barH - 0.5);
    nnCtx.lineTo(NN_WIDTH, barY + barH - 0.5);
    nnCtx.stroke();

    if (this.splitBrainMode) {
      const activeIds = this.getActiveBrainIds();
      const mags = activeIds.map((id) => {
        const v = this.getSplitBrainVelocity(id);
        return Math.hypot(v.vx, v.vy);
      });
      const totalMag = mags.reduce((acc, m) => acc + m, 0);
      const shares = mags.map((m) =>
        totalMag > 1e-4 ? m / totalMag : 1 / Math.max(1, activeIds.length)
      );
      const mergeSpec =
        SPLIT_BRAIN_MERGE_OPTIONS.find((m) => m.value === this.splitBrainMergeMode) ??
        SPLIT_BRAIN_MERGE_OPTIONS[0];

      if (grid.isDualBridgeLayout) {
        const midY = barY + barH * 0.5;
        const barW = 220;
        const meterH = 7;
        const barX = NN_WIDTH * 0.5 - barW * 0.5;
        const meterY = barY + 20;

        nnCtx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        nnCtx.fillRect(barX, meterY, barW, meterH);
        let curX = barX;
        for (let i = 0; i < activeIds.length; i++) {
          const segW = barW * shares[i];
          nnCtx.fillStyle = BRAIN_COLORS[activeIds[i]].hex;
          nnCtx.fillRect(curX, meterY, segW, meterH);
          curX += segW;
        }
        nnCtx.fillStyle = '#ffffff';
        nnCtx.fillRect(NN_WIDTH * 0.5 - 0.5, meterY - 1, 1, meterH + 2);

        nnCtx.font = 'bold 9px monospace';
        nnCtx.textBaseline = 'middle';
        nnCtx.fillStyle = BRAIN_COLORS.A.hex;
        nnCtx.textAlign = 'left';
        nnCtx.fillText(
          `BRAIN A ${Math.round(shares[0] * 100)}% (${Math.round(this.getSplitBrainFitness('A'))})`,
          10,
          midY
        );

        nnCtx.fillStyle =
          this.splitBrainLastWinner === 'both'
            ? '#cbd5e1'
            : BRAIN_COLORS[this.splitBrainLastWinner].lightHex;
        nnCtx.textAlign = 'center';
        nnCtx.fillText(
          `ISOLATED · ${mergeSpec.label.toUpperCase()}`,
          NN_WIDTH * 0.5,
          barY + 10
        );

        nnCtx.fillStyle = BRAIN_COLORS.B.lightHex;
        nnCtx.textAlign = 'right';
        nnCtx.fillText(
          `(${Math.round(this.getSplitBrainFitness('B'))}) ${Math.round(shares[1] * 100)}% BRAIN B`,
          NN_WIDTH - 10,
          midY
        );
        nnCtx.textAlign = 'left';
      } else {
        // Compact top bar for 3, 4, or 5 isolated split brains
        const meterX = 8;
        const meterY = barY + 23;
        const meterW = NN_WIDTH - 16;
        const meterH = 8;
        nnCtx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        nnCtx.fillRect(meterX, meterY, meterW, meterH);
        let curX = meterX;
        for (let i = 0; i < activeIds.length; i++) {
          const segW = meterW * shares[i];
          nnCtx.fillStyle = BRAIN_COLORS[activeIds[i]].hex;
          nnCtx.fillRect(curX, meterY, segW, meterH);
          curX += segW;
        }

        nnCtx.font = 'bold 9px monospace';
        nnCtx.textBaseline = 'middle';
        nnCtx.fillStyle =
          this.splitBrainLastWinner === 'both'
            ? '#cbd5e1'
            : BRAIN_COLORS[this.splitBrainLastWinner].lightHex;
        nnCtx.textAlign = 'left';
        nnCtx.fillText(
          `ISOLATED ${activeIds.length}x · ${mergeSpec.shortLabel.toUpperCase()}`,
          8,
          barY + 12
        );

        const itemW = Math.floor((NN_WIDTH - 185) / activeIds.length);
        for (let i = 0; i < activeIds.length; i++) {
          const id = activeIds[i];
          nnCtx.fillStyle = BRAIN_COLORS[id].lightHex;
          nnCtx.textAlign = 'right';
          const rightX = NN_WIDTH - 8 - (activeIds.length - 1 - i) * itemW;
          nnCtx.fillText(
            `${id}:${Math.round(shares[i] * 100)}%(${Math.round(this.getSplitBrainFitness(id))})`,
            rightX,
            barY + 12
          );
        }
        nnCtx.textAlign = 'left';
      }

      if (selectionBox) {
        const sx = Math.min(selectionBox.x1, selectionBox.x2);
        const sy = Math.min(selectionBox.y1, selectionBox.y2);
        const sw = Math.abs(selectionBox.x2 - selectionBox.x1);
        const sh = Math.abs(selectionBox.y2 - selectionBox.y1);
        if (sw >= 2 || sh >= 2) {
          nnCtx.save();
          nnCtx.fillStyle = 'rgba(95, 165, 255, 0.14)';
          nnCtx.strokeStyle = 'rgba(130, 200, 255, 0.85)';
          nnCtx.lineWidth = 1;
          nnCtx.setLineDash([4, 3]);
          nnCtx.fillRect(sx, sy, sw, sh);
          nnCtx.strokeRect(sx, sy, sw, sh);
          nnCtx.restore();
        }
      }
      return;
    }

    const boundsA = grid.panes[0].bounds;
    const boundsB = grid.panes[1].bounds;
    const bridgeY = barY;
    const bridgeH = barH;
    const aReceivesB = this.doesAgentReceiveTelepathy('A');
    const bReceivesA = this.doesAgentReceiveTelepathy('B');
    const layoutA = this.getNNNodeLayout('A', boundsA);
    const layoutB = this.getNNNodeLayout('B', boundsB);
    const activeIdxA = this.getActiveInputIndices('A');
    const activeIdxB = this.getActiveInputIndices('B');
    const outNodesA = layoutA[layoutA.length - 1] ?? [];
    const outNodesB = layoutB[layoutB.length - 1] ?? [];
    const inNodesA = layoutA[0] ?? [];
    const inNodesB = layoutB[0] ?? [];
    const pulsePhase = performance.now() * 0.0014;

    const drawBridgeWire = (
      fromPt: { x: number; y: number },
      toPt: { x: number; y: number },
      laneY: number,
      val: number,
      isAToB: boolean,
      phaseOffset: number
    ) => {
      const clamped = Math.max(-1, Math.min(1, Number.isFinite(val) ? val : 0));
      const mag = Math.abs(clamped);
      const alpha = 0.22 + mag * 0.68;
      const stroke =
        clamped >= 0
          ? isAToB
            ? `rgba(34, 211, 238, ${alpha})`
            : `rgba(251, 191, 36, ${alpha})`
          : `rgba(248, 113, 113, ${alpha})`;
      const exitX = Math.min(NN_WIDTH - 12, fromPt.x + 26);
      const entryX = Math.max(10, toPt.x - 18);

      nnCtx.save();
      nnCtx.strokeStyle = stroke;
      nnCtx.lineWidth = 0.9 + mag * 1.3;
      nnCtx.beginPath();
      nnCtx.moveTo(fromPt.x, fromPt.y);
      nnCtx.bezierCurveTo(exitX, fromPt.y, exitX, laneY, exitX - 18, laneY);
      nnCtx.lineTo(entryX + 18, laneY);
      nnCtx.bezierCurveTo(entryX, laneY, entryX, toPt.y, toPt.x, toPt.y);
      nnCtx.stroke();

      // Animated pulse dot along the bridge corridor
      if (mag > 0.06) {
        const t = (pulsePhase + phaseOffset) % 1;
        let px: number;
        let py: number;
        if (t < 0.2) {
          const k = t / 0.2;
          px = fromPt.x + (exitX - 18 - fromPt.x) * k;
          py = fromPt.y + (laneY - fromPt.y) * k;
        } else if (t < 0.8) {
          const k = (t - 0.2) / 0.6;
          px = exitX - 18 + (entryX + 18 - (exitX - 18)) * k;
          py = laneY;
        } else {
          const k = (t - 0.8) / 0.2;
          px = entryX + 18 + (toPt.x - (entryX + 18)) * k;
          py = laneY + (toPt.y - laneY) * k;
        }
        nnCtx.fillStyle =
          clamped >= 0 ? (isAToB ? '#a5f3fc' : '#fde68a') : '#fecaca';
        nnCtx.beginPath();
        nnCtx.arc(px, py, 1.8, 0, Math.PI * 2);
        nnCtx.fill();
      }
      nnCtx.restore();
    };

    if (bReceivesA) {
      for (let k = 0; k < outNodesA.length; k++) {
        const targetNodeIdx = activeIdxB.indexOf(104 + k);
        if (targetNodeIdx >= 0 && inNodesB[targetNodeIdx]) {
          drawBridgeWire(
            outNodesA[k],
            inNodesB[targetNodeIdx],
            bridgeY + 5 + k * 2.2,
            this.prevRawOutputsA[k] ?? 0,
            true,
            k * 0.19
          );
        }
      }
    }

    if (aReceivesB) {
      for (let k = 0; k < outNodesB.length; k++) {
        const targetNodeIdx = activeIdxA.indexOf(104 + k);
        if (targetNodeIdx >= 0 && inNodesA[targetNodeIdx]) {
          drawBridgeWire(
            outNodesB[k],
            inNodesA[targetNodeIdx],
            bridgeY + bridgeH - 5 - k * 2.2,
            this.prevRawOutputsB[k] ?? 0,
            false,
            0.5 + k * 0.19
          );
        }
      }
    }

    const labelsA = this.getOutputLabels('A');
    const labelsB = this.getOutputLabels('B');
    const bToAStr = labelsB
      .map((l, i) => `${l}:${(this.prevRawOutputsB[i] ?? 0).toFixed(2)}`)
      .join(' ');
    const aToBStr = labelsA
      .map((l, i) => `${l}:${(this.prevRawOutputsA[i] ?? 0).toFixed(2)}`)
      .join(' ');

    nnCtx.font = '9px monospace';
    nnCtx.textBaseline = 'middle';
    const midY = bridgeY + bridgeH * 0.5;
    nnCtx.fillStyle = 'rgba(9, 14, 23, 0.78)';
    nnCtx.fillRect(4, midY - 7, NN_WIDTH - 8, 14);

    nnCtx.fillStyle = aReceivesB ? '#fbbf24' : '#525c6b';
    nnCtx.textAlign = 'left';
    nnCtx.fillText(
      aReceivesB ? `B→A [${bToAStr}]` : 'B→A OFF (1-WAY)',
      10,
      midY
    );

    nnCtx.fillStyle =
      this.telepathyBridgeMode === 'dual'
        ? '#2dd4bf'
        : this.telepathyBridgeMode === 'a_to_b'
        ? '#22d3ee'
        : '#fbbf24';
    nnCtx.textAlign = 'center';
    nnCtx.fillText(
      this.telepathyBridgeMode === 'dual'
        ? 'DUAL BRIDGE A↔B'
        : this.telepathyBridgeMode === 'a_to_b'
        ? '1-WAY BRIDGE A→B'
        : '1-WAY BRIDGE B→A',
      NN_WIDTH * 0.5,
      midY
    );

    nnCtx.fillStyle = bReceivesA ? '#22d3ee' : '#525c6b';
    nnCtx.textAlign = 'right';
    nnCtx.fillText(
      bReceivesA ? `A→B [${aToBStr}]` : 'A→B OFF (1-WAY)',
      NN_WIDTH - 10,
      midY
    );
    nnCtx.textAlign = 'left';

    if (selectionBox) {
      const sx = Math.min(selectionBox.x1, selectionBox.x2);
      const sy = Math.min(selectionBox.y1, selectionBox.y2);
      const sw = Math.abs(selectionBox.x2 - selectionBox.x1);
      const sh = Math.abs(selectionBox.y2 - selectionBox.y1);
      if (sw >= 2 || sh >= 2) {
        nnCtx.save();
        nnCtx.fillStyle = 'rgba(95, 165, 255, 0.14)';
        nnCtx.strokeStyle = 'rgba(130, 200, 255, 0.85)';
        nnCtx.lineWidth = 1;
        nnCtx.setLineDash([4, 3]);
        nnCtx.fillRect(sx, sy, sw, sh);
        nnCtx.strokeRect(sx, sy, sw, sh);
        nnCtx.restore();
      }
    }
  }

  drawNN(
    nnCtx: CanvasRenderingContext2D,
    selectionBox?: { x1: number; y1: number; x2: number; y2: number } | null
  ): void {
    if (this.hasTwoBrains() && this.netViewMode === 'split') {
      this.drawDualNN(nnCtx, selectionBox);
      return;
    }

    nnCtx.fillStyle = '#000';
    nnCtx.fillRect(0, 0, NN_WIDTH, NN_HEIGHT);
    const targetId: AgentId = this.clampActiveAgentId(
      this.netViewMode === 'split' ? 'A' : this.netViewMode
    );
    this.drawNNSingle(nnCtx, targetId, { x: 0, y: 0, width: NN_WIDTH, height: NN_HEIGHT });

    if (selectionBox) {
      const sx = Math.min(selectionBox.x1, selectionBox.x2);
      const sy = Math.min(selectionBox.y1, selectionBox.y2);
      const sw = Math.abs(selectionBox.x2 - selectionBox.x1);
      const sh = Math.abs(selectionBox.y2 - selectionBox.y1);
      if (sw >= 2 || sh >= 2) {
        nnCtx.save();
        nnCtx.fillStyle = 'rgba(95, 165, 255, 0.14)';
        nnCtx.strokeStyle = 'rgba(130, 200, 255, 0.85)';
        nnCtx.lineWidth = 1;
        nnCtx.setLineDash([4, 3]);
        nnCtx.fillRect(sx, sy, sw, sh);
        nnCtx.strokeRect(sx, sy, sw, sh);
        nnCtx.restore();
      }
    }
  }

  getHiddenLayerSizes(agentId: AgentId = this.activeInspectAgent): number[] {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const targetAgent = this.getTargetAgent(targetId);
    if (targetAgent) {
      return targetAgent.getHiddenLayerSizes();
    }
    const cfg = this.getTargetBrainConfig(targetId);
    const layers = Math.max(1, cfg.hiddenLayersCount || 1);
    const neurons = Math.max(1, cfg.neuronsPerLayer || 16);
    return new Array<number>(layers).fill(neurons);
  }

  canPrune(agentId: AgentId = this.activeInspectAgent): boolean {
    const targetAgent = this.getTargetAgent(this.clampActiveAgentId(agentId));
    return targetAgent ? targetAgent.canPrune() : false;
  }

  pruneNetwork(
    mode: 'least' | 'strongest' = 'least',
    agentId: AgentId = this.activeInspectAgent
  ): {
    hiddenLayerSizes: number[];
    canPruneMore: boolean;
  } | null {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const targetAgent = this.getTargetAgent(targetId);
    const targetPop = this.getTargetPopulation(targetId);
    const targetBest = this.getTargetBestAgent(targetId);
    if (!targetAgent) return null;
    const pruned = targetAgent.pruneNode(mode);
    if (!pruned) return null;

    for (const net of targetPop) {
      if (net !== targetAgent) {
        net.pruneNode(mode, pruned.layer);
      }
    }

    if (targetBest) {
      targetBest.pruneNode(mode, pruned.layer);
    }

    const sizes = targetAgent.getHiddenLayerSizes();
    if (sizes.length > 0) {
      if (targetId === 'B') {
        this.agentBParams.neuronsPerLayer = Math.max(...sizes);
      } else if (this.isExtraBrainId(targetId)) {
        this.extraBrains[targetId].config.neuronsPerLayer = Math.max(...sizes);
      } else {
        this.params.neuronsPerLayer = Math.max(...sizes);
      }
    }

    return {
      hiddenLayerSizes: sizes,
      canPruneMore: targetAgent.canPrune(),
    };
  }

  getActiveRewardDescriptions(): string[] {
    const p = this.params;
    const items: { flag: boolean; label: string; weight: number }[] = [
      { flag: p.rewardHit, label: 'Hit', weight: p.weightHit },
      { flag: p.rewardEnemyDist, label: 'EnemyDist', weight: p.weightEnemyDist },
      { flag: p.rewardWallDist, label: 'WallDist', weight: p.weightWallDist },
      { flag: p.rewardGroupEnemies, label: 'GroupEnemies', weight: p.weightGroupEnemies },
      { flag: p.rewardSpreadEnemies, label: 'SpreadEnemies', weight: p.weightSpreadEnemies },
      { flag: p.rewardEdgeEnemies, label: 'EdgeEnemies', weight: p.weightEdgeEnemies },
      { flag: p.rewardAvgEnemyCenter, label: 'AvgEnemyCenter', weight: p.weightAvgEnemyCenter },
      { flag: p.rewardOppHeading, label: 'OppHeading', weight: p.weightOppHeading },
      { flag: p.rewardSmoothVel, label: 'SmoothVel', weight: p.weightSmoothVel },
      { flag: p.rewardSplitGap, label: 'SplitGap', weight: p.weightSplitGap },
      { flag: p.rewardSplitGapCollect, label: 'SplitGapCollect', weight: p.weightSplitGapCollect },
      { flag: p.rewardSplitGapPredict, label: 'SplitGapPredict', weight: p.weightSplitGapPredict },
      { flag: p.rewardOpenCorridor, label: 'OpenCorridor', weight: p.weightOpenCorridor },
      { flag: p.rewardFarWallSense, label: 'FarWallSense', weight: p.weightFarWallSense },
      { flag: p.rewardEdgeSense, label: 'EdgeSense', weight: p.weightEdgeSense },
      { flag: p.rewardOrbitKite, label: 'OrbitKite', weight: p.weightOrbitKite },
      { flag: p.rewardMatadorCut, label: 'MatadorCut', weight: p.weightMatadorCut },
      { flag: p.rewardAnkleBreaker, label: 'AnkleBreaker', weight: p.weightAnkleBreaker },
      { flag: p.rewardPincerEscape, label: 'PincerEscape', weight: p.weightPincerEscape },
      { flag: p.rewardWallSlingshot, label: 'WallSlingshot', weight: p.weightWallSlingshot },
      { flag: p.rewardPackTangle, label: 'PackTangle', weight: p.weightPackTangle },
      { flag: p.rewardSpideySense, label: 'SpideySense', weight: p.weightSpideySense },
      { flag: p.rewardVectorStabbing, label: 'VectorStabbing', weight: p.weightVectorStabbing },
      { flag: p.rewardTwitch, label: 'Twitch', weight: p.weightTwitch },
    ];
    const active = items
      .filter((it) => it.flag)
      .map((it) => `${it.weight >= 0 ? '+' : '-'}${it.label} (${Math.abs(it.weight)})`);
    return active.length > 0 ? active : ['Survival only (no rewards)'];
  }

  private recordFrozenRewardContext(
    replaceExisting: boolean,
    agentId: AgentId = this.activeInspectAgent
  ): void {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const entry: FrozenRewardEntry = {
      rewards: this.getActiveRewardDescriptions(),
      generation: this.generation,
    };
    const entries =
      targetId === 'B'
        ? this.frozenRewardEntriesB
        : this.isExtraBrainId(targetId)
        ? this.extraBrains[targetId].frozenRewardEntries
        : this.frozenRewardEntries;
    let updated: FrozenRewardEntry[];
    if (replaceExisting || entries.length === 0) {
      updated = [entry];
    } else {
      const key = entry.rewards.join('|');
      const alreadyExists = entries.some((e) => e.rewards.join('|') === key);
      updated = alreadyExists ? entries : [...entries, entry];
    }
    if (targetId === 'B') {
      this.frozenRewardEntriesB = updated;
    } else if (this.isExtraBrainId(targetId)) {
      this.extraBrains[targetId].frozenRewardEntries = updated;
    } else {
      this.frozenRewardEntries = updated;
    }
  }

  getFrozenRewardsSummary(agentId: AgentId = this.activeInspectAgent): FrozenRewardEntry[] {
    const targetId = this.clampActiveAgentId(agentId);
    const entries =
      targetId === 'B'
        ? this.frozenRewardEntriesB
        : this.isExtraBrainId(targetId)
        ? this.extraBrains[targetId].frozenRewardEntries
        : this.frozenRewardEntries;
    return entries.map((e) => ({
      ...e,
      rewards: [...e.rewards],
    }));
  }

  getMinimumArchitectureBounds(
    agentId: AgentId = this.activeInspectAgent
  ): { minLayers: number; minNeurons: number } {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const targetAgent = this.getTargetAgent(targetId);
    if (!targetAgent || !this.isAgentFrozen(targetId)) {
      return { minLayers: 1, minNeurons: 1 };
    }
    return targetAgent.getMinimumFrozenDimensions();
  }

  setFrozen(
    frozen: boolean,
    agentId: AgentId = this.activeInspectAgent
  ): { isFrozen: boolean; canPrune: boolean } {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const targetPop = this.getTargetPopulation(targetId);
    const targetBest = this.getTargetBestAgent(targetId);

    for (const net of targetPop) {
      if (frozen) net.freezeHiddenAll();
      else net.unfreezeAll();
    }
    if (targetBest) {
      if (frozen) targetBest.freezeHiddenAll();
      else targetBest.unfreezeAll();
    }

    if (targetId === 'B') {
      this.isFrozenB = frozen;
      if (frozen) this.recordFrozenRewardContext(true, 'B');
      else this.frozenRewardEntriesB = [];
    } else if (this.isExtraBrainId(targetId)) {
      const slot = this.extraBrains[targetId];
      slot.isFrozen = frozen;
      if (frozen) this.recordFrozenRewardContext(true, targetId);
      else slot.frozenRewardEntries = [];
    } else {
      this.isFrozen = frozen;
      if (frozen) this.recordFrozenRewardContext(true, 'A');
      else this.frozenRewardEntries = [];
    }

    return {
      isFrozen: frozen,
      canPrune: this.canPrune(targetId),
    };
  }

  scaleFrozenNetwork(
    targetLayers: number,
    targetNeurons: number,
    activation: ActivationType,
    agentId: AgentId = this.activeInspectAgent
  ): { layers: number; neurons: number; hiddenLayerSizes: number[]; canPrune: boolean } {
    return this.resizeNetwork(targetLayers, targetNeurons, activation, agentId);
  }

  resizeNetwork(
    targetLayers: number,
    targetNeurons: number,
    activation: ActivationType,
    agentId: AgentId = this.activeInspectAgent
  ): { layers: number; neurons: number; hiddenLayerSizes: number[]; canPrune: boolean } {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const targetAgent = this.getTargetAgent(targetId);
    const targetPop = this.getTargetPopulation(targetId);
    const targetBest = this.getTargetBestAgent(targetId);
    const isFrozen = this.isAgentFrozen(targetId);
    const cfg = this.getTargetBrainConfig(targetId);

    if (!targetAgent) {
      return {
        layers: cfg.hiddenLayersCount,
        neurons: cfg.neuronsPerLayer,
        hiddenLayerSizes: this.getHiddenLayerSizes(targetId),
        canPrune: false,
      };
    }

    const frozenBounds = isFrozen
      ? targetAgent.getMinimumFrozenDimensions()
      : { minLayers: 1, minNeurons: 1 };
    const clampedLayers = Math.min(5, Math.max(frozenBounds.minLayers, targetLayers));
    const clampedNeurons = Math.min(64, Math.max(frozenBounds.minNeurons, targetNeurons));

    for (let i = 0; i < targetPop.length; i++) {
      targetPop[i].resize(clampedLayers, clampedNeurons, activation, i < 3, isFrozen);
    }
    if (targetBest) {
      targetBest.resize(clampedLayers, clampedNeurons, activation, true, isFrozen);
    }

    if (targetAgent.layerValues.length > 0) {
      targetAgent.predict(targetAgent.layerValues[0]);
    }

    const actualSizes = targetAgent.getHiddenLayerSizes();
    const effectiveNeurons = actualSizes.length > 0 ? Math.max(...actualSizes) : clampedNeurons;

    if (targetId === 'B') {
      this.agentBParams.hiddenLayersCount = clampedLayers;
      this.agentBParams.neuronsPerLayer = effectiveNeurons;
      this.agentBParams.activationType = activation;
    } else if (this.isExtraBrainId(targetId)) {
      const slot = this.extraBrains[targetId];
      slot.config.hiddenLayersCount = clampedLayers;
      slot.config.neuronsPerLayer = effectiveNeurons;
      slot.config.activationType = activation;
    } else {
      this.params.hiddenLayersCount = clampedLayers;
      this.params.neuronsPerLayer = effectiveNeurons;
      this.params.activationType = activation;
    }

    return {
      layers: clampedLayers,
      neurons: effectiveNeurons,
      hiddenLayerSizes: actualSizes,
      canPrune: this.canPrune(targetId),
    };
  }

  setActivation(activation: ActivationType, agentId: AgentId = this.activeInspectAgent): void {
    const targetId: AgentId = this.clampActiveAgentId(agentId);
    const targetPop = this.getTargetPopulation(targetId);
    const targetBest = this.getTargetBestAgent(targetId);
    const targetAgent = this.getTargetAgent(targetId);
    if (targetId === 'B') {
      this.agentBParams.activationType = activation;
    } else if (this.isExtraBrainId(targetId)) {
      this.extraBrains[targetId].config.activationType = activation;
    } else {
      this.params.activationType = activation;
    }
    for (const net of targetPop) {
      net.activation = activation;
    }
    if (targetBest) {
      targetBest.activation = activation;
    }
    if (targetAgent && targetAgent.layerValues.length > 0) {
      targetAgent.predict(targetAgent.layerValues[0]);
    }
  }

  private serializeNet(net: NeuralNetwork) {
    return {
      activation: net.activation,
      fitness: Number.isFinite(net.fitness) ? net.fitness : null,
      weights: JSON.parse(JSON.stringify(net.weights)) as number[][][],
      biases: JSON.parse(JSON.stringify(net.biases)) as number[][],
      frozenWeights: JSON.parse(JSON.stringify(net.frozenWeights)) as boolean[][][],
      frozenBiases: JSON.parse(JSON.stringify(net.frozenBiases)) as boolean[][],
    };
  }

  exportWeightsPayload() {
    const liveFitness = this.agent
      ? this.splitBrainMode
        ? this.splitBrainFitnessA
        : this.currentFitness
      : -Infinity;
    const savedBestFitness = this.bestAgent
      ? this.splitBrainMode
        ? this.bestFitnessA
        : this.bestFitness
      : -Infinity;
    const sourceA =
      this.bestAgent && savedBestFitness >= liveFitness
        ? this.bestAgent
        : this.agent ?? this.bestAgent;
    if (!sourceA) return null;

    const hiddenLayerSizesA = sourceA.getHiddenLayerSizes();
    const effectiveBestFitness = Math.max(savedBestFitness, liveFitness);

    const basePayload = {
      format: this.splitBrainMode
        ? 'rl-evasion-split-weights-v1'
        : this.dualAgentMode
        ? 'rl-evasion-dual-weights-v1'
        : 'rl-evasion-baseline-weights-v2',
      exportedAt: new Date().toISOString(),
      simMode: this.simMode,
      dualAgentMode: this.dualAgentMode,
      splitBrainMode: this.splitBrainMode,
      splitBrainCount: this.splitBrainCount,
      splitBrainMergeMode: this.splitBrainMergeMode,
      generation: this.generation,
      fitness: effectiveBestFitness !== -Infinity ? effectiveBestFitness : 0,
      architecture: {
        inputSize: 108,
        hiddenLayers: hiddenLayerSizesA.length,
        hiddenLayerSizes: hiddenLayerSizesA,
        outputSize: sourceA.getOutputSize(),
        outputConfig: this.getOutputConfig('A'),
        activation: sourceA.activation,
      },
      weights: JSON.parse(JSON.stringify(sourceA.weights)) as number[][][],
      biases: JSON.parse(JSON.stringify(sourceA.biases)) as number[][],
      frozenWeights: JSON.parse(JSON.stringify(sourceA.frozenWeights)) as boolean[][][],
      frozenBiases: JSON.parse(JSON.stringify(sourceA.frozenBiases)) as boolean[][],
      frozenHiddenNodes: sourceA.getFrozenHiddenMask(),
      isFrozen: this.isFrozen,
      frozenRewards: this.getFrozenRewardsSummary('A'),
      params: { ...this.params, outputConfig: this.getOutputConfig('A') },
      simulationState: {
        popIndex: this.popIndex,
        stepCount: this.stepCount,
        currentFitness: this.currentFitness,
        bestFitness: this.bestFitness !== -Infinity ? this.bestFitness : null,
        splitBrainFitnessA: this.splitBrainFitnessA,
        splitBrainFitnessB: this.splitBrainFitnessB,
        bestFitnessA: this.bestFitnessA !== -Infinity ? this.bestFitnessA : null,
        bestFitnessB: this.bestFitnessB !== -Infinity ? this.bestFitnessB : null,
        prevVx: this.prevVx,
        prevVy: this.prevVy,
        emaVx: this.emaVx,
        emaVy: this.emaVy,
        emaPx: this.emaPx,
        emaPy: this.emaPy,
        playerHeadingRad: this.playerHeadingRad,
        playerStamina: this.playerStamina,
        playerSprinting: this.playerSprinting,
        collectedSplitGaps: this.collectedSplitGaps.map((g) => ({ ...g })),
        splitGapHistory: this.splitGapHistory.map((h) => ({ ...h })),
        player: { ...this.player },
        enemies: this.enemies.map((e) => ({
          x: e.x,
          y: e.y,
          spawnDelay: e.spawnDelay ?? 0,
          entered: e.entered ?? true,
          ...(typeof e.speedPct === 'number' ? { speedPct: e.speedPct } : {}),
        })),
        population: this.population.map((net) => this.serializeNet(net)),
        bestAgent: this.bestAgent ? this.serializeNet(this.bestAgent) : null,
      },
    };

    if (!this.hasTwoBrains()) {
      return basePayload;
    }

    const liveFitnessB = this.agentB
      ? this.splitBrainMode
        ? this.splitBrainFitnessB
        : this.currentFitness
      : -Infinity;
    const savedBestFitnessB = this.bestAgentB
      ? this.splitBrainMode
        ? this.bestFitnessB
        : this.bestFitness
      : -Infinity;
    const sourceB =
      this.bestAgentB && savedBestFitnessB >= liveFitnessB
        ? this.bestAgentB
        : this.agentB ?? this.bestAgentB ?? sourceA;
    const hiddenLayerSizesB = sourceB.getHiddenLayerSizes();

    const extraBrainsPayload: Partial<Record<ExtraBrainId, Record<string, unknown>>> = {};
    if (this.splitBrainMode) {
      for (const id of EXTRA_BRAIN_IDS) {
        if (!this.getActiveBrainIds().includes(id)) continue;
        const slot = this.extraBrains[id];
        const liveF = slot.agent ? slot.splitFitness : -Infinity;
        const savedF = slot.bestAgent ? slot.bestFitness : -Infinity;
        const src =
          slot.bestAgent && savedF >= liveF ? slot.bestAgent : slot.agent ?? slot.bestAgent ?? sourceA;
        const hiddenSizes = src.getHiddenLayerSizes();
        extraBrainsPayload[id] = {
          brainConfig: { ...slot.config },
          architecture: {
            inputSize: 108,
            hiddenLayers: hiddenSizes.length,
            hiddenLayerSizes: hiddenSizes,
            outputSize: src.getOutputSize(),
            outputConfig: this.getOutputConfig(id),
            activation: src.activation,
          },
          weights: JSON.parse(JSON.stringify(src.weights)) as number[][][],
          biases: JSON.parse(JSON.stringify(src.biases)) as number[][],
          frozenWeights: JSON.parse(JSON.stringify(src.frozenWeights)) as boolean[][][],
          frozenBiases: JSON.parse(JSON.stringify(src.frozenBiases)) as boolean[][],
          frozenHiddenNodes: src.getFrozenHiddenMask(),
          isFrozen: slot.isFrozen,
          frozenRewards: this.getFrozenRewardsSummary(id),
          popPairingOrder: [...slot.popPairingOrder],
          playerHeadingRad: slot.headingRad,
          playerStamina: slot.stamina,
          playerSprinting: slot.sprinting,
          splitBrainFitness: slot.splitFitness,
          bestFitness: slot.bestFitness !== -Infinity ? slot.bestFitness : null,
          population: slot.population.map((net) => this.serializeNet(net)),
          bestAgent: slot.bestAgent ? this.serializeNet(slot.bestAgent) : null,
        };
      }
    }

    return {
      ...basePayload,
      activeInspectAgent: this.activeInspectAgent,
      netViewMode: this.netViewMode,
      telepathyBridgeMode: this.telepathyBridgeMode,
      prevRawOutputsA: [...this.prevRawOutputsA],
      prevRawOutputsB: [...this.prevRawOutputsB],
      agentB: {
        brainConfig: { ...this.agentBParams },
        architecture: {
          inputSize: 108,
          hiddenLayers: hiddenLayerSizesB.length,
          hiddenLayerSizes: hiddenLayerSizesB,
          outputSize: sourceB.getOutputSize(),
          outputConfig: this.getOutputConfig('B'),
          activation: sourceB.activation,
        },
        weights: JSON.parse(JSON.stringify(sourceB.weights)) as number[][][],
        biases: JSON.parse(JSON.stringify(sourceB.biases)) as number[][],
        frozenWeights: JSON.parse(JSON.stringify(sourceB.frozenWeights)) as boolean[][][],
        frozenBiases: JSON.parse(JSON.stringify(sourceB.frozenBiases)) as boolean[][],
        frozenHiddenNodes: sourceB.getFrozenHiddenMask(),
        isFrozen: this.isFrozenB,
        frozenRewards: this.getFrozenRewardsSummary('B'),
        popPairingOrderB: [...this.popPairingOrderB],
        prevVx: this.prevVxB,
        prevVy: this.prevVyB,
        emaVx: this.emaVxB,
        emaVy: this.emaVyB,
        emaPx: this.emaPxB,
        emaPy: this.emaPyB,
        playerHeadingRad: this.playerBHeadingRad,
        playerStamina: this.playerBStamina,
        playerSprinting: this.playerBSprinting,
        collectedSplitGaps: this.collectedSplitGapsB.map((g) => ({ ...g })),
        splitGapHistory: this.splitGapHistoryB.map((h) => ({ ...h })),
        player: { ...this.playerB },
        population: this.populationB.map((net) => this.serializeNet(net)),
        bestAgent: this.bestAgentB ? this.serializeNet(this.bestAgentB) : null,
      },
      ...(Object.keys(extraBrainsPayload).length > 0 ? { extraBrains: extraBrainsPayload } : {}),
    };
  }

  private applySharedParamsFromImport(p: Partial<SimParams>, fallbackOutSize: number): void {
    if (typeof p.numEnemies === 'number' && Number.isFinite(p.numEnemies)) {
      this.params.numEnemies = Math.min(50, Math.max(1, Math.round(p.numEnemies)));
    }
    if (typeof p.enemySpeedPct === 'number' && Number.isFinite(p.enemySpeedPct)) {
      this.updateEnemySpeedPct(p.enemySpeedPct);
    }
    if (p.enemySpeedMode === 'fixed' || p.enemySpeedMode === 'rarity') {
      this.params.enemySpeedMode = p.enemySpeedMode;
    }
    if (p.spawnMode === 'outer' || p.spawnMode === 'central') {
      this.params.spawnMode = p.spawnMode;
    }
    if (typeof p.simSpeed === 'number' && Number.isFinite(p.simSpeed)) {
      this.params.simSpeed = Math.min(100, Math.max(1, Math.round(p.simSpeed)));
    }
    if (typeof p.turboMode === 'boolean') {
      this.params.turboMode = p.turboMode;
    }
    const validOutputConfigs = new Set(OUTPUT_CONFIG_OPTIONS.map((o) => o.value));
    if (p.outputConfig && validOutputConfigs.has(p.outputConfig)) {
      this.params.outputConfig = p.outputConfig;
    } else {
      this.params.outputConfig =
        fallbackOutSize === 4 ? 'hybrid_4d' : fallbackOutSize === 3 ? 'sprint_burst' : 'cartesian_2d';
    }
    if (typeof p.rewardEnemyDist === 'boolean') this.params.rewardEnemyDist = p.rewardEnemyDist;
    if (typeof p.rewardWallDist === 'boolean') this.params.rewardWallDist = p.rewardWallDist;
    if (typeof p.rewardGroupEnemies === 'boolean') {
      this.params.rewardGroupEnemies = p.rewardGroupEnemies;
    }
    if (typeof p.rewardSpreadEnemies === 'boolean') {
      this.params.rewardSpreadEnemies = p.rewardSpreadEnemies;
    }
    if (typeof p.rewardEdgeEnemies === 'boolean') {
      this.params.rewardEdgeEnemies = p.rewardEdgeEnemies;
    }
    if (typeof p.rewardOppHeading === 'boolean') this.params.rewardOppHeading = p.rewardOppHeading;
    if (typeof p.rewardSmoothVel === 'boolean') this.params.rewardSmoothVel = p.rewardSmoothVel;
    if (typeof p.rewardSplitGap === 'boolean') this.params.rewardSplitGap = p.rewardSplitGap;
    if (typeof p.rewardEdgeSense === 'boolean') this.params.rewardEdgeSense = p.rewardEdgeSense;
    if (typeof p.rewardOrbitKite === 'boolean') this.params.rewardOrbitKite = p.rewardOrbitKite;
    if (typeof p.rewardMatadorCut === 'boolean') this.params.rewardMatadorCut = p.rewardMatadorCut;
    if (typeof p.rewardAnkleBreaker === 'boolean') {
      this.params.rewardAnkleBreaker = p.rewardAnkleBreaker;
    }
    if (typeof p.rewardPincerEscape === 'boolean') {
      this.params.rewardPincerEscape = p.rewardPincerEscape;
    }
    if (typeof p.rewardOpenCorridor === 'boolean') {
      this.params.rewardOpenCorridor = p.rewardOpenCorridor;
    }
    if (typeof p.rewardWallSlingshot === 'boolean') {
      this.params.rewardWallSlingshot = p.rewardWallSlingshot;
    }
    if (typeof p.rewardPackTangle === 'boolean') this.params.rewardPackTangle = p.rewardPackTangle;
    if (typeof p.rewardSpideySense === 'boolean') this.params.rewardSpideySense = p.rewardSpideySense;
    if (typeof p.rewardFarWallSense === 'boolean') {
      this.params.rewardFarWallSense = p.rewardFarWallSense;
    }
    if (typeof p.rewardSplitGapCollect === 'boolean') {
      this.params.rewardSplitGapCollect = p.rewardSplitGapCollect;
    }
    if (typeof p.rewardSplitGapPredict === 'boolean') {
      this.params.rewardSplitGapPredict = p.rewardSplitGapPredict;
    }
    if (typeof p.rewardHit === 'boolean') this.params.rewardHit = p.rewardHit;
    if (typeof p.rewardAvgEnemyCenter === 'boolean') {
      this.params.rewardAvgEnemyCenter = p.rewardAvgEnemyCenter;
    }
    if (typeof p.rewardVectorStabbing === 'boolean') {
      this.params.rewardVectorStabbing = p.rewardVectorStabbing;
    }
    if (typeof p.rewardTwitch === 'boolean') this.params.rewardTwitch = p.rewardTwitch;

    if (typeof p.weightEnemyDist === 'number' && Number.isFinite(p.weightEnemyDist)) {
      this.params.weightEnemyDist = p.weightEnemyDist;
    }
    if (typeof p.weightWallDist === 'number' && Number.isFinite(p.weightWallDist)) {
      this.params.weightWallDist = p.weightWallDist;
    }
    if (typeof p.weightGroupEnemies === 'number' && Number.isFinite(p.weightGroupEnemies)) {
      this.params.weightGroupEnemies = p.weightGroupEnemies;
    }
    if (typeof p.weightSpreadEnemies === 'number' && Number.isFinite(p.weightSpreadEnemies)) {
      this.params.weightSpreadEnemies = p.weightSpreadEnemies;
    }
    if (typeof p.weightEdgeEnemies === 'number' && Number.isFinite(p.weightEdgeEnemies)) {
      this.params.weightEdgeEnemies = p.weightEdgeEnemies;
    }
    if (typeof p.weightOppHeading === 'number' && Number.isFinite(p.weightOppHeading)) {
      this.params.weightOppHeading = p.weightOppHeading;
    }
    if (typeof p.weightSmoothVel === 'number' && Number.isFinite(p.weightSmoothVel)) {
      this.params.weightSmoothVel = p.weightSmoothVel;
    }
    if (typeof p.weightSplitGap === 'number' && Number.isFinite(p.weightSplitGap)) {
      this.params.weightSplitGap = p.weightSplitGap;
    }
    if (typeof p.weightEdgeSense === 'number' && Number.isFinite(p.weightEdgeSense)) {
      this.params.weightEdgeSense = p.weightEdgeSense;
    }
    if (typeof p.weightOrbitKite === 'number' && Number.isFinite(p.weightOrbitKite)) {
      this.params.weightOrbitKite = p.weightOrbitKite;
    }
    if (typeof p.weightMatadorCut === 'number' && Number.isFinite(p.weightMatadorCut)) {
      this.params.weightMatadorCut = p.weightMatadorCut;
    }
    if (typeof p.weightAnkleBreaker === 'number' && Number.isFinite(p.weightAnkleBreaker)) {
      this.params.weightAnkleBreaker = p.weightAnkleBreaker;
    }
    if (typeof p.weightPincerEscape === 'number' && Number.isFinite(p.weightPincerEscape)) {
      this.params.weightPincerEscape = p.weightPincerEscape;
    }
    if (typeof p.weightOpenCorridor === 'number' && Number.isFinite(p.weightOpenCorridor)) {
      this.params.weightOpenCorridor = p.weightOpenCorridor;
    }
    if (typeof p.weightWallSlingshot === 'number' && Number.isFinite(p.weightWallSlingshot)) {
      this.params.weightWallSlingshot = p.weightWallSlingshot;
    }
    if (typeof p.weightPackTangle === 'number' && Number.isFinite(p.weightPackTangle)) {
      this.params.weightPackTangle = p.weightPackTangle;
    }
    if (typeof p.weightSpideySense === 'number' && Number.isFinite(p.weightSpideySense)) {
      this.params.weightSpideySense = p.weightSpideySense;
    }
    if (typeof p.weightFarWallSense === 'number' && Number.isFinite(p.weightFarWallSense)) {
      this.params.weightFarWallSense = p.weightFarWallSense;
    }
    if (typeof p.weightSplitGapCollect === 'number' && Number.isFinite(p.weightSplitGapCollect)) {
      this.params.weightSplitGapCollect = p.weightSplitGapCollect;
    }
    if (typeof p.weightSplitGapPredict === 'number' && Number.isFinite(p.weightSplitGapPredict)) {
      this.params.weightSplitGapPredict = p.weightSplitGapPredict;
    }
    if (typeof p.weightHit === 'number' && Number.isFinite(p.weightHit)) {
      this.params.weightHit = p.weightHit;
    }
    if (typeof p.weightAvgEnemyCenter === 'number' && Number.isFinite(p.weightAvgEnemyCenter)) {
      this.params.weightAvgEnemyCenter = p.weightAvgEnemyCenter;
    }
    if (typeof p.weightVectorStabbing === 'number' && Number.isFinite(p.weightVectorStabbing)) {
      this.params.weightVectorStabbing = p.weightVectorStabbing;
    }
    if (typeof p.weightTwitch === 'number' && Number.isFinite(p.weightTwitch)) {
      this.params.weightTwitch = p.weightTwitch;
    }
  }

  private parseFrozenRewardsList(rawFrozenRewards: unknown, fallbackGen: number): FrozenRewardEntry[] {
    const restoredEntries: FrozenRewardEntry[] = [];
    if (Array.isArray(rawFrozenRewards)) {
      for (const item of rawFrozenRewards) {
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          const rewardsList = Array.isArray(rec.rewards)
            ? rec.rewards.filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
            : [];
          if (rewardsList.length > 0) {
            restoredEntries.push({
              rewards: rewardsList,
              generation:
                typeof rec.generation === 'number' && Number.isFinite(rec.generation)
                  ? Math.max(1, Math.floor(rec.generation))
                  : fallbackGen,
            });
          }
        }
      }
    }
    return restoredEntries.length > 0
      ? restoredEntries
      : [{ rewards: this.getActiveRewardDescriptions(), generation: fallbackGen }];
  }

  importWeightsPayload(data: unknown): {
    params: SimParams;
    generation: number;
    hiddenLayerSizes: number[];
    canPrune: boolean;
    isFrozen: boolean;
    simMode: SimMode;
    dualAgentMode: boolean;
    splitBrainMode: boolean;
    splitBrainCount: number;
    splitBrainMergeMode: SplitBrainMergeMode;
    activeInspectAgent: AgentId;
    netViewMode: NetViewMode;
    telepathyBridgeMode: TelepathyBridgeMode;
  } {
    const parsed = NeuralNetwork.fromJSON(data);
    const { network, generation, fitness, hiddenLayerSizes } = parsed;
    const record = data as Record<string, unknown>;
    const isDualImport =
      (record.format === 'rl-evasion-dual-weights-v1' ||
        record.format === 'rl-evasion-split-weights-v1') &&
      Boolean(record.agentB && typeof record.agentB === 'object');

    // If currently in Dual/Split Brain mode and importing a single-agent file, load into the active agent slot
    if (!isDualImport && this.hasTwoBrains() && this.activeInspectAgent !== 'A') {
      const targetSlotId = this.clampActiveAgentId(this.activeInspectAgent);
      const validOutputConfigs = new Set(OUTPUT_CONFIG_OPTIONS.map((o) => o.value));
      const importedParams = record.params as Partial<SimParams> | undefined;
      const inferredSize = network.getOutputSize();
      const outCfgSlot: OutputConfig =
        importedParams?.outputConfig && validOutputConfigs.has(importedParams.outputConfig)
          ? importedParams.outputConfig
          : inferredSize === 4
          ? 'hybrid_4d'
          : inferredSize === 3
          ? 'sprint_burst'
          : 'cartesian_2d';
      const nextCfg: AgentBrainConfig = {
        hiddenLayersCount: hiddenLayerSizes.length,
        neuronsPerLayer: hiddenLayerSizes[0] ?? 16,
        activationType: network.activation,
        outputConfig: outCfgSlot,
      };
      if (targetSlotId === 'B') {
        this.agentBParams = nextCfg;
      } else if (this.isExtraBrainId(targetSlotId)) {
        this.extraBrains[targetSlotId].config = nextCfg;
      }
      this.applyTrainedAgent(network, true, targetSlotId);
      const nextFrozen = Boolean(this.getTargetAgent(targetSlotId)?.hasFrozenWeights());
      if (targetSlotId === 'B') {
        this.isFrozenB = nextFrozen;
        this.frozenRewardEntriesB = nextFrozen
          ? this.parseFrozenRewardsList(record.frozenRewards, this.generation)
          : [];
      } else if (this.isExtraBrainId(targetSlotId)) {
        this.extraBrains[targetSlotId].isFrozen = nextFrozen;
        this.extraBrains[targetSlotId].frozenRewardEntries = nextFrozen
          ? this.parseFrozenRewardsList(record.frozenRewards, this.generation)
          : [];
      }
      const actualSizesSlot = this.getHiddenLayerSizes(targetSlotId);
      this.onStatsChange?.(this.formatStatsText());
      return {
        params: { ...this.params },
        generation: this.generation,
        hiddenLayerSizes: actualSizesSlot,
        canPrune: this.canPrune(targetSlotId),
        isFrozen: nextFrozen,
        simMode: this.simMode,
        dualAgentMode: this.dualAgentMode,
        splitBrainMode: this.splitBrainMode,
        splitBrainCount: this.splitBrainCount,
        splitBrainMergeMode: this.splitBrainMergeMode,
        activeInspectAgent: targetSlotId,
        netViewMode: this.netViewMode,
        telepathyBridgeMode: this.telepathyBridgeMode,
      };
    }

    if (record.params && typeof record.params === 'object') {
      this.applySharedParamsFromImport(record.params as Partial<SimParams>, network.getOutputSize());
    } else {
      const inferredSize = network.getOutputSize();
      this.params.outputConfig =
        inferredSize === 4 ? 'hybrid_4d' : inferredSize === 3 ? 'sprint_burst' : 'cartesian_2d';
    }

    if (isDualImport) {
      const isSplitFile =
        record.format === 'rl-evasion-split-weights-v1' ||
        record.simMode === 'split_brain' ||
        record.splitBrainMode === true;
      this.simMode = isSplitFile ? 'split_brain' : 'dual';
      this.dualAgentMode = this.simMode === 'dual';
      this.splitBrainMode = this.simMode === 'split_brain';
      if (isSplitFile) {
        const extraMap =
          record.extraBrains && typeof record.extraBrains === 'object'
            ? (record.extraBrains as Record<string, unknown>)
            : null;
        const detectedCount =
          typeof record.splitBrainCount === 'number' && Number.isFinite(record.splitBrainCount)
            ? Math.min(MAX_SPLIT_BRAINS, Math.max(2, Math.round(record.splitBrainCount)))
            : extraMap
            ? Math.min(MAX_SPLIT_BRAINS, 2 + EXTRA_BRAIN_IDS.filter((k) => Boolean(extraMap[k])).length)
            : 2;
        this.splitBrainCount = detectedCount;
      }
      const validMerges = new Set(SPLIT_BRAIN_MERGE_OPTIONS.map((m) => m.value));
      if (
        typeof record.splitBrainMergeMode === 'string' &&
        validMerges.has(record.splitBrainMergeMode as SplitBrainMergeMode)
      ) {
        this.splitBrainMergeMode = record.splitBrainMergeMode as SplitBrainMergeMode;
      }
      const rawInspect = record.activeInspectAgent as AgentId | undefined;
      this.activeInspectAgent =
        rawInspect && ALL_BRAIN_IDS.includes(rawInspect)
          ? this.clampActiveAgentId(rawInspect)
          : 'A';
      const rawView = record.netViewMode as NetViewMode | undefined;
      this.netViewMode =
        rawView === 'split' || (rawView && this.getActiveBrainIds().includes(rawView))
          ? rawView
          : 'split';
      this.telepathyBridgeMode =
        record.telepathyBridgeMode === 'a_to_b' ||
        record.telepathyBridgeMode === 'b_to_a' ||
        record.telepathyBridgeMode === 'dual'
          ? record.telepathyBridgeMode
          : 'dual';
    } else if (!this.hasTwoBrains()) {
      this.activeInspectAgent = 'A';
      this.netViewMode = 'A';
    }

    this.params.hiddenLayersCount = hiddenLayerSizes.length;
    if (
      hiddenLayerSizes.length === 1 ||
      !(record.params && typeof (record.params as Partial<SimParams>).neuronsPerLayer === 'number')
    ) {
      this.params.neuronsPerLayer = hiddenLayerSizes[0] ?? 16;
    } else {
      this.params.neuronsPerLayer = Math.min(
        64,
        Math.max(2, Math.round((record.params as Partial<SimParams>).neuronsPerLayer!))
      );
    }
    this.params.activationType = network.activation;

    let restoredExactState = false;
    if (record.simulationState && typeof record.simulationState === 'object') {
      const sim = record.simulationState as Record<string, unknown>;
      if (Array.isArray(sim.population) && sim.population.length > 0) {
        const restoredPop: NeuralNetwork[] = [];
        for (const item of sim.population) {
          if (item && typeof item === 'object') {
            const netItem = item as Record<string, unknown>;
            const parsedMember = NeuralNetwork.fromJSON({
              weights: netItem.weights,
              biases: netItem.biases,
              frozenWeights: netItem.frozenWeights,
              frozenBiases: netItem.frozenBiases,
              frozenHiddenNodes: netItem.frozenHiddenNodes ?? record.frozenHiddenNodes,
              isFrozen: record.isFrozen,
              fitness: netItem.fitness,
              architecture: { activation: netItem.activation ?? network.activation },
            });
            restoredPop.push(parsedMember.network);
          }
        }

        if (restoredPop.length > 0) {
          this.population = restoredPop;
          const rawPopIdx = typeof sim.popIndex === 'number' ? Math.floor(sim.popIndex) : 0;
          this.popIndex = Math.max(0, Math.min(this.population.length - 1, rawPopIdx));
          this.agent = this.population[this.popIndex];
          this.generation = generation;
          this.stepCount =
            typeof sim.stepCount === 'number' && Number.isFinite(sim.stepCount) && sim.stepCount >= 0
              ? Math.floor(sim.stepCount)
              : 0;
          this.currentFitness =
            typeof sim.currentFitness === 'number' && Number.isFinite(sim.currentFitness)
              ? sim.currentFitness
              : 0;
          this.bestFitness =
            'bestFitness' in sim
              ? typeof sim.bestFitness === 'number' && Number.isFinite(sim.bestFitness)
                ? sim.bestFitness
                : -Infinity
              : fitness;
          this.splitBrainFitnessA =
            typeof sim.splitBrainFitnessA === 'number' && Number.isFinite(sim.splitBrainFitnessA)
              ? sim.splitBrainFitnessA
              : this.currentFitness;
          this.splitBrainFitnessB =
            typeof sim.splitBrainFitnessB === 'number' && Number.isFinite(sim.splitBrainFitnessB)
              ? sim.splitBrainFitnessB
              : this.currentFitness;
          this.bestFitnessA =
            'bestFitnessA' in sim
              ? typeof sim.bestFitnessA === 'number' && Number.isFinite(sim.bestFitnessA)
                ? sim.bestFitnessA
                : -Infinity
              : this.bestFitness;
          this.bestFitnessB =
            'bestFitnessB' in sim
              ? typeof sim.bestFitnessB === 'number' && Number.isFinite(sim.bestFitnessB)
                ? sim.bestFitnessB
                : -Infinity
              : this.bestFitness;
          this.prevVx =
            typeof sim.prevVx === 'number' && Number.isFinite(sim.prevVx) ? sim.prevVx : 0;
          this.prevVy =
            typeof sim.prevVy === 'number' && Number.isFinite(sim.prevVy) ? sim.prevVy : 0;
          this.emaVx =
            typeof sim.emaVx === 'number' && Number.isFinite(sim.emaVx) ? sim.emaVx : 0;
          this.emaVy =
            typeof sim.emaVy === 'number' && Number.isFinite(sim.emaVy) ? sim.emaVy : 0;
          this.emaPx =
            typeof sim.emaPx === 'number' && Number.isFinite(sim.emaPx)
              ? sim.emaPx
              : SIM_WIDTH / 2;
          this.emaPy =
            typeof sim.emaPy === 'number' && Number.isFinite(sim.emaPy)
              ? sim.emaPy
              : SIM_HEIGHT / 2;
          if (typeof sim.playerHeadingRad === 'number' && Number.isFinite(sim.playerHeadingRad)) {
            this.playerHeadingRad = sim.playerHeadingRad;
          }
          if (typeof sim.playerStamina === 'number' && Number.isFinite(sim.playerStamina)) {
            this.playerStamina = Math.max(0, Math.min(1, sim.playerStamina));
          }
          if (typeof sim.playerSprinting === 'boolean') {
            this.playerSprinting = sim.playerSprinting;
          }
          if (Array.isArray(sim.collectedSplitGaps)) {
            this.collectedSplitGaps = sim.collectedSplitGaps
              .filter(
                (g): g is { pairKey: number; mx: number; my: number; step: number } =>
                  Boolean(
                    g &&
                      typeof g === 'object' &&
                      typeof (g as Record<string, unknown>).pairKey === 'number' &&
                      typeof (g as Record<string, unknown>).mx === 'number' &&
                      typeof (g as Record<string, unknown>).my === 'number' &&
                      typeof (g as Record<string, unknown>).step === 'number'
                  )
              )
              .slice(-64);
          } else {
            this.collectedSplitGaps = [];
          }
          if (Array.isArray(sim.splitGapHistory)) {
            this.splitGapHistory = sim.splitGapHistory
              .filter(
                (h): h is { angle: number; x: number; y: number } =>
                  Boolean(
                    h &&
                      typeof h === 'object' &&
                      typeof (h as Record<string, unknown>).angle === 'number' &&
                      typeof (h as Record<string, unknown>).x === 'number' &&
                      typeof (h as Record<string, unknown>).y === 'number'
                  )
              )
              .slice(-5);
          } else {
            this.splitGapHistory = [];
          }

          if (sim.bestAgent && typeof sim.bestAgent === 'object') {
            const b = sim.bestAgent as Record<string, unknown>;
            this.bestAgent = NeuralNetwork.fromJSON({
              weights: b.weights,
              biases: b.biases,
              frozenWeights: b.frozenWeights,
              frozenBiases: b.frozenBiases,
              frozenHiddenNodes: b.frozenHiddenNodes ?? record.frozenHiddenNodes,
              isFrozen: record.isFrozen,
              fitness: b.fitness,
              architecture: { activation: b.activation ?? network.activation },
            }).network;
          } else {
            this.bestAgent = network.clone();
          }

          if (sim.player && typeof sim.player === 'object') {
            const pl = sim.player as Record<string, unknown>;
            if (
              typeof pl.x === 'number' &&
              typeof pl.y === 'number' &&
              typeof pl.vx === 'number' &&
              typeof pl.vy === 'number'
            ) {
              this.player = { x: pl.x, y: pl.y, vx: pl.vx, vy: pl.vy };
            }
          }

          if (Array.isArray(sim.enemies)) {
            const restoredEnemies: Enemy[] = [];
            for (const e of sim.enemies) {
              if (
                e &&
                typeof e === 'object' &&
                typeof (e as Record<string, unknown>).x === 'number' &&
                typeof (e as Record<string, unknown>).y === 'number'
              ) {
                const rec = e as Record<string, unknown>;
                restoredEnemies.push({
                  x: rec.x as number,
                  y: rec.y as number,
                  spawnDelay:
                    typeof rec.spawnDelay === 'number' && Number.isFinite(rec.spawnDelay)
                      ? Math.max(0, Math.floor(rec.spawnDelay))
                      : 0,
                  entered: typeof rec.entered === 'boolean' ? rec.entered : true,
                  speedPct:
                    typeof rec.speedPct === 'number' && Number.isFinite(rec.speedPct)
                      ? this.params.enemySpeedMode === 'rarity'
                        ? Math.min(90, Math.max(1, rec.speedPct))
                        : Math.max(1, rec.speedPct)
                      : this.params.enemySpeedMode === 'rarity'
                      ? this.sampleRaritySpeedPct()
                      : this.params.enemySpeedPct,
                });
              }
            }
            if (restoredEnemies.length > 0) {
              this.enemies = restoredEnemies;
              this.params.numEnemies = restoredEnemies.length;
            }
          }

          restoredExactState = true;
          const restoredSpeed = Math.hypot(this.player.vx, this.player.vy);
          this.physicsHistory = [];
          this.prevSpeedPx = restoredSpeed;
          this.lastValidHeadingDeg =
            restoredSpeed > 1e-3 ? (Math.atan2(this.player.vy, this.player.vx) * 180) / Math.PI : 0;
        }
      }
    }

    if (!restoredExactState) {
      const nextPop: NeuralNetwork[] = [];
      for (let i = 0; i < this.popSize; i++) {
        const clone = network.clone();
        if (i >= 3) {
          clone.mutate(0.2);
        }
        nextPop.push(clone);
      }

      this.population = nextPop;
      this.popIndex = 0;
      this.generation = generation;
      this.bestFitness = fitness;
      this.bestAgent = network.clone();
      this.bestAgent.fitness = fitness;
      if (!isDualImport) {
        this.startEpisode();
      }
    }

    if (isDualImport) {
      const bBlock = record.agentB as Record<string, unknown>;
      const parsedB = NeuralNetwork.fromJSON(bBlock);
      const netB = parsedB.network;
      const validOutputConfigs = new Set(OUTPUT_CONFIG_OPTIONS.map((o) => o.value));
      const bBrain = bBlock.brainConfig as Partial<AgentBrainConfig> | undefined;
      const outCfgB: OutputConfig =
        bBrain?.outputConfig && validOutputConfigs.has(bBrain.outputConfig)
          ? bBrain.outputConfig
          : netB.getOutputSize() === 4
          ? 'hybrid_4d'
          : netB.getOutputSize() === 3
          ? 'sprint_burst'
          : 'cartesian_2d';
      this.agentBParams = {
        hiddenLayersCount: parsedB.hiddenLayerSizes.length,
        neuronsPerLayer: bBrain?.neuronsPerLayer ?? parsedB.hiddenLayerSizes[0] ?? 16,
        activationType: netB.activation,
        outputConfig: outCfgB,
      };

      const restoredPopB: NeuralNetwork[] = [];
      if (Array.isArray(bBlock.population)) {
        for (const item of bBlock.population) {
          if (item && typeof item === 'object') {
            const netItem = item as Record<string, unknown>;
            restoredPopB.push(
              NeuralNetwork.fromJSON({
                weights: netItem.weights,
                biases: netItem.biases,
                frozenWeights: netItem.frozenWeights,
                frozenBiases: netItem.frozenBiases,
                frozenHiddenNodes: netItem.frozenHiddenNodes ?? bBlock.frozenHiddenNodes,
                isFrozen: bBlock.isFrozen,
                fitness: netItem.fitness,
                architecture: { activation: netItem.activation ?? netB.activation },
              }).network
            );
          }
        }
      }
      if (restoredPopB.length === 0) {
        for (let i = 0; i < this.popSize; i++) {
          const clone = netB.clone();
          if (i >= 3) clone.mutate(0.2);
          restoredPopB.push(clone);
        }
      }
      this.populationB = restoredPopB;

      if (
        Array.isArray(bBlock.popPairingOrderB) &&
        bBlock.popPairingOrderB.length === this.populationB.length
      ) {
        this.popPairingOrderB = bBlock.popPairingOrderB.map((idx) =>
          typeof idx === 'number'
            ? Math.max(0, Math.min(this.populationB.length - 1, Math.floor(idx)))
            : 0
        );
      } else {
        this.popPairingOrderB = Array.from({ length: this.populationB.length }, (_, i) => i);
      }

      const pairIdxB = this.popPairingOrderB[this.popIndex] ?? this.popIndex;
      this.agentB = this.populationB[pairIdxB] ?? this.populationB[0] ?? null;

      if (bBlock.bestAgent && typeof bBlock.bestAgent === 'object') {
        const bb = bBlock.bestAgent as Record<string, unknown>;
        this.bestAgentB = NeuralNetwork.fromJSON({
          weights: bb.weights,
          biases: bb.biases,
          frozenWeights: bb.frozenWeights,
          frozenBiases: bb.frozenBiases,
          frozenHiddenNodes: bb.frozenHiddenNodes ?? bBlock.frozenHiddenNodes,
          isFrozen: bBlock.isFrozen,
          fitness: bb.fitness,
          architecture: { activation: bb.activation ?? netB.activation },
        }).network;
      } else {
        this.bestAgentB = netB.clone();
      }

      this.prevVxB = typeof bBlock.prevVx === 'number' ? bBlock.prevVx : 0;
      this.prevVyB = typeof bBlock.prevVy === 'number' ? bBlock.prevVy : 0;
      this.emaVxB = typeof bBlock.emaVx === 'number' ? bBlock.emaVx : 0;
      this.emaVyB = typeof bBlock.emaVy === 'number' ? bBlock.emaVy : 0;
      this.emaPxB = typeof bBlock.emaPx === 'number' ? bBlock.emaPx : SIM_WIDTH * 0.65;
      this.emaPyB = typeof bBlock.emaPy === 'number' ? bBlock.emaPy : SIM_HEIGHT * 0.5;
      this.playerBHeadingRad =
        typeof bBlock.playerHeadingRad === 'number' ? bBlock.playerHeadingRad : Math.PI;
      this.playerBStamina =
        typeof bBlock.playerStamina === 'number'
          ? Math.max(0, Math.min(1, bBlock.playerStamina))
          : 1;
      this.playerBSprinting = Boolean(bBlock.playerSprinting);
      if (bBlock.player && typeof bBlock.player === 'object') {
        const plB = bBlock.player as Record<string, unknown>;
        if (
          typeof plB.x === 'number' &&
          typeof plB.y === 'number' &&
          typeof plB.vx === 'number' &&
          typeof plB.vy === 'number'
        ) {
          this.playerB = { x: plB.x, y: plB.y, vx: plB.vx, vy: plB.vy };
        }
      }
      this.physicsHistoryB = [];
      const spdB = Math.hypot(this.playerB.vx, this.playerB.vy);
      this.prevSpeedPxB = spdB;
      this.lastValidHeadingDegB =
        spdB > 1e-3 ? (Math.atan2(this.playerB.vy, this.playerB.vx) * 180) / Math.PI : 0;
      this.isFrozenB = Boolean(this.agentB?.hasFrozenWeights());
      this.frozenRewardEntriesB = this.isFrozenB
        ? this.parseFrozenRewardsList(bBlock.frozenRewards, generation)
        : [];

      if (Array.isArray(record.prevRawOutputsA)) {
        this.prevRawOutputsA = [0, 1, 2, 3].map((k) =>
          typeof (record.prevRawOutputsA as unknown[])[k] === 'number'
            ? ((record.prevRawOutputsA as number[])[k] ?? 0)
            : 0
        );
      } else {
        this.prevRawOutputsA = [0, 0, 0, 0];
      }
      if (Array.isArray(record.prevRawOutputsB)) {
        this.prevRawOutputsB = [0, 1, 2, 3].map((k) =>
          typeof (record.prevRawOutputsB as unknown[])[k] === 'number'
            ? ((record.prevRawOutputsB as number[])[k] ?? 0)
            : 0
        );
      } else {
        this.prevRawOutputsB = [0, 0, 0, 0];
      }

      const rawExtras =
        record.extraBrains && typeof record.extraBrains === 'object'
          ? (record.extraBrains as Record<string, unknown>)
          : null;
      const activeIdsAfterImport = this.getActiveBrainIds();
      for (const extraId of EXTRA_BRAIN_IDS) {
        if (!activeIdsAfterImport.includes(extraId)) {
          this.clearExtraPopulation(extraId);
          continue;
        }
        const eBlock =
          rawExtras && rawExtras[extraId] && typeof rawExtras[extraId] === 'object'
            ? (rawExtras[extraId] as Record<string, unknown>)
            : null;
        if (!eBlock) {
          this.initExtraPopulation(extraId);
          continue;
        }
        const slot = this.extraBrains[extraId];
        const parsedE = NeuralNetwork.fromJSON(eBlock);
        const netE = parsedE.network;
        const eBrain = eBlock.brainConfig as Partial<AgentBrainConfig> | undefined;
        const outCfgE: OutputConfig =
          eBrain?.outputConfig && validOutputConfigs.has(eBrain.outputConfig)
            ? eBrain.outputConfig
            : netE.getOutputSize() === 4
            ? 'hybrid_4d'
            : netE.getOutputSize() === 3
            ? 'sprint_burst'
            : 'cartesian_2d';
        slot.config = {
          hiddenLayersCount: parsedE.hiddenLayerSizes.length,
          neuronsPerLayer: eBrain?.neuronsPerLayer ?? parsedE.hiddenLayerSizes[0] ?? 16,
          activationType: netE.activation,
          outputConfig: outCfgE,
        };
        const restoredPopE: NeuralNetwork[] = [];
        if (Array.isArray(eBlock.population)) {
          for (const item of eBlock.population) {
            if (item && typeof item === 'object') {
              const netItem = item as Record<string, unknown>;
              restoredPopE.push(
                NeuralNetwork.fromJSON({
                  weights: netItem.weights,
                  biases: netItem.biases,
                  frozenWeights: netItem.frozenWeights,
                  frozenBiases: netItem.frozenBiases,
                  frozenHiddenNodes: netItem.frozenHiddenNodes ?? eBlock.frozenHiddenNodes,
                  isFrozen: eBlock.isFrozen,
                  fitness: netItem.fitness,
                  architecture: { activation: netItem.activation ?? netE.activation },
                }).network
              );
            }
          }
        }
        if (restoredPopE.length === 0) {
          for (let i = 0; i < this.popSize; i++) {
            const clone = netE.clone();
            if (i >= 3) clone.mutate(0.2);
            restoredPopE.push(clone);
          }
        }
        slot.population = restoredPopE;
        if (
          Array.isArray(eBlock.popPairingOrder) &&
          eBlock.popPairingOrder.length === slot.population.length
        ) {
          slot.popPairingOrder = eBlock.popPairingOrder.map((idx) =>
            typeof idx === 'number'
              ? Math.max(0, Math.min(slot.population.length - 1, Math.floor(idx)))
              : 0
          );
        } else {
          slot.popPairingOrder = Array.from({ length: slot.population.length }, (_, i) => i);
        }
        const pairIdxE = slot.popPairingOrder[this.popIndex] ?? this.popIndex;
        slot.agent = slot.population[pairIdxE] ?? slot.population[0] ?? null;
        if (eBlock.bestAgent && typeof eBlock.bestAgent === 'object') {
          const be = eBlock.bestAgent as Record<string, unknown>;
          slot.bestAgent = NeuralNetwork.fromJSON({
            weights: be.weights,
            biases: be.biases,
            frozenWeights: be.frozenWeights,
            frozenBiases: be.frozenBiases,
            frozenHiddenNodes: be.frozenHiddenNodes ?? eBlock.frozenHiddenNodes,
            isFrozen: eBlock.isFrozen,
            fitness: be.fitness,
            architecture: { activation: be.activation ?? netE.activation },
          }).network;
        } else {
          slot.bestAgent = netE.clone();
        }
        slot.headingRad = typeof eBlock.playerHeadingRad === 'number' ? eBlock.playerHeadingRad : 0;
        slot.stamina =
          typeof eBlock.playerStamina === 'number'
            ? Math.max(0, Math.min(1, eBlock.playerStamina))
            : 1;
        slot.sprinting = Boolean(eBlock.playerSprinting);
        slot.splitFitness =
          typeof eBlock.splitBrainFitness === 'number' && Number.isFinite(eBlock.splitBrainFitness)
            ? eBlock.splitBrainFitness
            : 0;
        slot.bestFitness =
          typeof eBlock.bestFitness === 'number' && Number.isFinite(eBlock.bestFitness)
            ? eBlock.bestFitness
            : -Infinity;
        slot.physicsHistory = [];
        slot.isFrozen = Boolean(slot.agent?.hasFrozenWeights());
        slot.frozenRewardEntries = slot.isFrozen
          ? this.parseFrozenRewardsList(eBlock.frozenRewards, generation)
          : [];
      }
    }

    if (restoredExactState || isDualImport) {
      this.episodeId++;
      this.physicsVersion++;
      this.stepProceduralVisuals();
    }

    this.isFrozen = Boolean(this.agent?.hasFrozenWeights());
    this.frozenRewardEntries = this.isFrozen
      ? this.parseFrozenRewardsList(record.frozenRewards, generation)
      : [];

    const actualHiddenSizesA = this.getHiddenLayerSizes('A');
    this.params.hiddenLayersCount = actualHiddenSizesA.length;
    if (actualHiddenSizesA.length > 0) {
      this.params.neuronsPerLayer = Math.max(...actualHiddenSizesA);
    }

    for (const id of this.getActiveBrainIds()) {
      const desiredOut = getOutputConfigSpec(this.getOutputConfig(id)).outputSize;
      const pop = this.getTargetPopulation(id);
      for (let i = 0; i < pop.length; i++) {
        if (pop[i].getOutputSize() !== desiredOut) {
          pop[i].resizeOutputSize(desiredOut, i < 3);
        }
      }
      const bestNet = this.getTargetBestAgent(id);
      if (bestNet && bestNet.getOutputSize() !== desiredOut) {
        bestNet.resizeOutputSize(desiredOut, true);
      }
      const net = this.getTargetAgent(id);
      if (net && net.layerValues.length > 0) {
        net.predict(net.layerValues[0]);
      }
    }

    const activeSizes = this.getHiddenLayerSizes(this.activeInspectAgent);
    this.onStatsChange?.(this.formatStatsText());

    return {
      params: { ...this.params },
      generation: this.generation,
      hiddenLayerSizes: activeSizes,
      canPrune: this.canPrune(this.activeInspectAgent),
      isFrozen: this.isAgentFrozen(this.activeInspectAgent),
      simMode: this.simMode,
      dualAgentMode: this.dualAgentMode,
      splitBrainMode: this.splitBrainMode,
      splitBrainCount: this.splitBrainCount,
      splitBrainMergeMode: this.splitBrainMergeMode,
      activeInspectAgent: this.activeInspectAgent,
      netViewMode: this.netViewMode,
      telepathyBridgeMode: this.telepathyBridgeMode,
    };
  }
}

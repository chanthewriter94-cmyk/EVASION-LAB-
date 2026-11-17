import { useCallback, useEffect, useRef, useState } from 'react';
import { ControlBar, RewardConfigItem } from './components/ControlBar';
import { DemoLibraryPanel } from './components/DemoLibraryPanel';
import { FrozenInfoPopover } from './components/FrozenInfoPopover';
import { HumanDemoOverlay } from './components/HumanDemoOverlay';
import { LossLandscapePanel } from './components/LossLandscapePanel';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PhysicsChartsPanel } from './components/PhysicsChartsPanel';
import { WeightInspector } from './components/WeightInspector';
import { BRAIN_UI_STYLES } from './components/brainStyles';
import {
  createDemoBundlePayload,
  HumanDemoRecording,
  loadSavedDemos,
  parseDemoImportData,
  saveDemosToStorage,
  trainNetworkOnDemos,
  TrainingResult,
} from './simulation/DemonstrationStore';
import {
  AgentId,
  ALL_BRAIN_IDS,
  EnemySpeedMode,
  EvasionEngine,
  FrozenRewardEntry,
  NetViewMode,
  NN_HEIGHT,
  NN_WIDTH,
  SIM_HEIGHT,
  SIM_WIDTH,
  SimMode,
  SimParams,
  SpawnMode,
  SPLIT_BRAIN_MERGE_OPTIONS,
  SplitBrainMergeMode,
  TelepathyBridgeMode,
  VisualMode,
} from './simulation/EvasionEngine';
import {
  LandscapeData,
  LandscapeMetric,
  LandscapeMode,
  LandscapeView,
  scanSpatialLandscape,
  WeightSpaceScanner,
} from './simulation/LossLandscape';
import { ActivationType, OutputConfig } from './simulation/NeuralNetwork';
import { VideoRecorder } from './simulation/VideoRecorder';

const INITIAL_PARAMS: SimParams = {
  hiddenLayersCount: 1,
  neuronsPerLayer: 16,
  activationType: 'tanh',
  outputConfig: 'cartesian_2d',
  numEnemies: 3,
  enemySpeedPct: 80,
  enemySpeedMode: 'fixed',
  spawnMode: 'outer',
  simSpeed: 1,
  turboMode: false,
  visualMode: 'lizard',
  rewardEnemyDist: true,
  rewardWallDist: false,
  rewardGroupEnemies: false,
  rewardSpreadEnemies: false,
  rewardEdgeEnemies: false,
  rewardOppHeading: false,
  rewardSmoothVel: false,
  rewardSplitGap: false,
  rewardEdgeSense: false,
  rewardOrbitKite: false,
  rewardMatadorCut: false,
  rewardAnkleBreaker: false,
  rewardPincerEscape: false,
  rewardOpenCorridor: false,
  rewardWallSlingshot: false,
  rewardPackTangle: false,
  rewardSpideySense: false,
  rewardFarWallSense: false,
  rewardSplitGapCollect: false,
  rewardSplitGapPredict: false,
  rewardHit: true,
  rewardAvgEnemyCenter: false,
  rewardVectorStabbing: false,
  rewardTwitch: false,
  weightEnemyDist: 1.0,
  weightWallDist: 1.5,
  weightGroupEnemies: 0.8,
  weightSpreadEnemies: 0.8,
  weightEdgeEnemies: 1.0,
  weightOppHeading: 1.0,
  weightSmoothVel: 1.0,
  weightSplitGap: 1.0,
  weightEdgeSense: 1.0,
  weightOrbitKite: 1.0,
  weightMatadorCut: 1.0,
  weightAnkleBreaker: 1.0,
  weightPincerEscape: 1.0,
  weightOpenCorridor: 1.0,
  weightWallSlingshot: 1.0,
  weightPackTangle: 1.0,
  weightSpideySense: 1.0,
  weightFarWallSense: 1.0,
  weightSplitGapCollect: 1.0,
  weightSplitGapPredict: 1.0,
  weightHit: -500,
  weightAvgEnemyCenter: 1.0,
  weightVectorStabbing: -1.0,
  weightTwitch: 1.0,
};

const INITIAL_REWARDS: RewardConfigItem[] = [
  {
    id: 'R21',
    label: 'Hit',
    category: 'spacing',
    active: true,
    isPositive: false,
    weightText: '500',
    title: 'Fitness change applied when an enemy collides with the player (default -500)',
  },
  {
    id: 'R1',
    label: '+EnemyDist',
    category: 'spacing',
    active: true,
    isPositive: true,
    weightText: '1',
    title: 'Distance from nearest enemy',
  },
  {
    id: 'R2',
    label: '+WallDist',
    category: 'spacing',
    active: false,
    isPositive: true,
    weightText: '1.5',
    title: 'Distance from nearest arena wall',
  },
  {
    id: 'R3',
    label: '+GroupEnemies',
    category: 'spacing',
    active: false,
    isPositive: true,
    weightText: '0.8',
    title: 'Weight for enemy grouping reward',
  },
  {
    id: 'R4',
    label: '+SpreadEnemies',
    category: 'spacing',
    active: false,
    isPositive: true,
    weightText: '0.8',
    title: 'Weight for enemy spreading reward',
  },
  {
    id: 'R5',
    label: '+EdgeEnemies',
    category: 'spacing',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Weight for enemies near map edge reward',
  },
  {
    id: 'R22',
    label: '+AvgEnemyCenter',
    category: 'spacing',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Reward when the average enemy position (centroid) is in the center of the arena',
  },
  {
    id: 'R6',
    label: '+OppHeading',
    category: 'flow',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Weight for player heading away from average enemy vector',
  },
  {
    id: 'R7',
    label: '+SmoothVel',
    category: 'flow',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Weight for smooth average velocity and penalizing jerky or noisy movement',
  },
  {
    id: 'R8',
    label: '+SplitGap',
    category: 'flow',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Weight for velocity splitting the largest angular gap between nearby enemies',
  },
  {
    id: 'R19',
    label: '+SplitGapCollect',
    category: 'flow',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Meta-reward for SplitGap: rewards collecting unique forward enemy gaps and penalizes re-crossing already-collected gaps',
  },
  {
    id: 'R20',
    label: '+SplitGapPredict',
    category: 'flow',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Meta-reward for SplitGap: learns the shift from where the split gap was moments before to predict and steer toward where the gap is going to be',
  },
  {
    id: 'R14',
    label: '+OpenCorridor',
    category: 'flow',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Forward cone clearance to both arena walls and enemy intercepts',
  },
  {
    id: 'R18',
    label: '+FarWallSense',
    category: 'flow',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Prefer moving toward the opposite side of the arena from recent position',
  },
  {
    id: 'R9',
    label: '+EdgeSense',
    category: 'tactical',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Favor velocities with a close enemy in only one peripheral while the opposite peripheral is clear',
  },
  {
    id: 'R10',
    label: '+OrbitKite',
    category: 'tactical',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Orbit nearest enemy at 90 degrees inside a 60-110px sweet-spot band',
  },
  {
    id: 'R11',
    label: '+MatadorCut',
    category: 'tactical',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Cut past a close enemy shoulder behind its pursuit velocity vector',
  },
  {
    id: 'R12',
    label: '+AnkleBreaker',
    category: 'tactical',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Maximize angular bearing sweep rate of nearby enemies around the player',
  },
  {
    id: 'R13',
    label: '+PincerEscape',
    category: 'tactical',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Break perpendicularly out of opposing two-enemy squeezes',
  },
  {
    id: 'R15',
    label: '+WallSlingshot',
    category: 'tactical',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Run parallel along walls away from nearby threats when cornered near edges',
  },
  {
    id: 'R16',
    label: '+PackTangle',
    category: 'tactical',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Lead trailing enemies into tightly crowded clusters behind the player heading',
  },
  {
    id: 'R17',
    label: '+SpideySense',
    category: 'tactical',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Sum spatial danger gradients within 200px weighted by proximity and closing speed, penalizing velocity piercing uphill into danger',
  },
  {
    id: 'R23',
    label: 'VectorStabbing',
    category: 'tactical',
    active: false,
    isPositive: false,
    weightText: '1.0',
    title: 'Penalize velocity vectors that pierce into or drive straight toward the arena walls',
  },
  {
    id: 'R24',
    label: '+Twitch',
    category: 'tactical',
    active: false,
    isPositive: true,
    weightText: '1.0',
    title: 'Reward sharp perpendicular lateral movement when an enemy is right in front of the player',
  },
];

export default function App() {
  const [layers, setLayers] = useState<number>(INITIAL_PARAMS.hiddenLayersCount);
  const [neurons, setNeurons] = useState<number>(INITIAL_PARAMS.neuronsPerLayer);
  const [hiddenLayerSizes, setHiddenLayerSizes] = useState<number[]>(() =>
    new Array<number>(INITIAL_PARAMS.hiddenLayersCount).fill(INITIAL_PARAMS.neuronsPerLayer)
  );
  const [activation, setActivation] = useState<ActivationType>(INITIAL_PARAMS.activationType);
  const [outputConfig, setOutputConfig] = useState<OutputConfig>(
    INITIAL_PARAMS.outputConfig ?? 'cartesian_2d'
  );
  const [enemyCount, setEnemyCount] = useState<number>(INITIAL_PARAMS.numEnemies);
  const [enemySpeedPct, setEnemySpeedPct] = useState<number>(INITIAL_PARAMS.enemySpeedPct);
  const [enemySpeedMode, setEnemySpeedMode] = useState<EnemySpeedMode>(
    INITIAL_PARAMS.enemySpeedMode
  );
  const [spawnMode, setSpawnMode] = useState<SpawnMode>(INITIAL_PARAMS.spawnMode);
  const [simSpeed, setSimSpeed] = useState<number>(INITIAL_PARAMS.simSpeed);
  const [turboMode, setTurboMode] = useState<boolean>(INITIAL_PARAMS.turboMode);
  const [visualMode, setVisualMode] = useState<VisualMode>(
    INITIAL_PARAMS.visualMode ?? 'lizard'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('rl_evasion_sound_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [soundVolume, setSoundVolume] = useState<number>(() => {
    try {
      const raw = window.localStorage.getItem('rl_evasion_sound_volume');
      const parsed = raw !== null ? parseFloat(raw) : NaN;
      return !isNaN(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.35;
    } catch {
      return 0.35;
    }
  });
  const [rewards, setRewards] = useState<RewardConfigItem[]>(INITIAL_REWARDS);
  const [statsText, setStatsText] = useState<string>('0 | 0 | 0');
  const [canPrune, setCanPrune] = useState<boolean>(true);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [frozenRewards, setFrozenRewards] = useState<FrozenRewardEntry[]>([]);
  const [minArchBounds, setMinArchBounds] = useState<{ minLayers: number; minNeurons: number }>({
    minLayers: 1,
    minNeurons: 1,
  });
  const [nnCursor, setNnCursor] = useState<'default' | 'pointer' | 'crosshair'>('default');
  const [activeToolTab, setActiveToolTab] = useState<
    'nn' | 'weights' | 'landscape' | 'physics' | 'video' | null
  >('nn');
  const lastToolTabRef = useRef<'nn' | 'weights' | 'landscape' | 'physics' | 'video'>('nn');
  const [inspectorTick, setInspectorTick] = useState<number>(0);
  const [recNeuralNet, setRecNeuralNet] = useState<boolean>(true);
  const [recLossLandscape, setRecLossLandscape] = useState<boolean>(true);
  const [recTraining, setRecTraining] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recElapsedSec, setRecElapsedSec] = useState<number>(0);
  const [recStatus, setRecStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [landscapeMode, setLandscapeMode] = useState<LandscapeMode>('weight');
  const [landscapeView, setLandscapeView] = useState<LandscapeView>('2d+3d');
  const [landscapeMetric, setLandscapeMetric] = useState<LandscapeMetric>('loss');
  const [landscapeData, setLandscapeData] = useState<LandscapeData | null>(null);
  const [humanDemoOpen, setHumanDemoOpen] = useState<boolean>(false);
  const [demoTrainerOpen, setDemoTrainerOpen] = useState<boolean>(false);
  const [humanDemos, setHumanDemos] = useState<HumanDemoRecording[]>(() => loadSavedDemos());
  const [simMode, setSimMode] = useState<SimMode>('single');
  const dualAgentMode = simMode === 'dual';
  const splitBrainMode = simMode === 'split_brain';
  const [splitBrainCount, setSplitBrainCount] = useState<number>(2);
  const activeBrainIds: AgentId[] = splitBrainMode
    ? ALL_BRAIN_IDS.slice(0, splitBrainCount)
    : dualAgentMode
    ? ['A', 'B']
    : ['A'];
  const [splitBrainMergeMode, setSplitBrainMergeMode] = useState<SplitBrainMergeMode>('collision_sum');
  const [activeInspectAgent, setActiveInspectAgent] = useState<AgentId>('A');
  const [netViewMode, setNetViewMode] = useState<NetViewMode>('A');
  const [telepathyBridgeMode, setTelepathyBridgeMode] = useState<TelepathyBridgeMode>('dual');

  const rewardsRef = useRef<RewardConfigItem[]>(INITIAL_REWARDS);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nnCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EvasionEngine | null>(null);
  const recorderRef = useRef<VideoRecorder | null>(null);
  const dragBoxRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const landscapeDataRef = useRef<LandscapeData | null>(null);
  const weightScannerRef = useRef<WeightSpaceScanner | null>(null);
  const lastLandscapeGenRef = useRef<number>(-1);
  const lastScanStartedAtRef = useRef<number>(0);
  const humanDemoOpenRef = useRef<boolean>(false);

  useEffect(() => {
    humanDemoOpenRef.current = humanDemoOpen;
  }, [humanDemoOpen]);

  if (!engineRef.current) {
    engineRef.current = new EvasionEngine(INITIAL_PARAMS);
  }

  useEffect(() => {
    engineRef.current?.setAudioSettings(soundEnabled, soundVolume);
  }, [soundEnabled, soundVolume]);

  useEffect(() => {
    const engine = engineRef.current!;
    engine.onStatsChange = setStatsText;
    engine.setAudioSettings(soundEnabled, soundVolume);
    engine.resetSimulation();

    const unlockOnGesture = () => {
      engine.unlockAudio();
    };
    const handleVisibility = () => {
      if (document.hidden) {
        engine.silenceContinuousAudio();
      }
    };
    window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    window.addEventListener('keydown', unlockOnGesture, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    let animId = 0;
    const loop = () => {
      if (!humanDemoOpenRef.current) {
        engine.stepFrame();

        const simCtx = simCanvasRef.current?.getContext('2d');
        if (simCtx) {
          engine.drawArena(simCtx);
        }

        const nnCtx = nnCanvasRef.current?.getContext('2d');
        if (nnCtx) {
          engine.drawNN(nnCtx, dragBoxRef.current);
        }

        if (recorderRef.current?.isRecording) {
          recorderRef.current.renderFrame(engine);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const preventFileNav = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventFileNav);
    window.addEventListener('drop', preventFileNav);

    return () => {
      cancelAnimationFrame(animId);
      recorderRef.current?.stop();
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('dragover', preventFileNav);
      window.removeEventListener('drop', preventFileNav);
      engine.disposeAudio();
    };
  }, []);

  useEffect(() => {
    if (!isRecording) {
      setRecElapsedSec(0);
      return;
    }
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      setRecElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [isRecording]);

  useEffect(() => {
    if (activeToolTab === 'nn') {
      const nnCtx = nnCanvasRef.current?.getContext('2d');
      if (nnCtx && engineRef.current) {
        engineRef.current.drawNN(nnCtx, dragBoxRef.current);
      }
      return;
    }
    if (activeToolTab !== 'weights') return;
    setInspectorTick((t) => t + 1);
    const id = window.setInterval(() => {
      setInspectorTick((t) => t + 1);
    }, 150);
    return () => window.clearInterval(id);
  }, [activeToolTab]);

  const startFreshLandscapeScan = useCallback(
    (modeOverride?: LandscapeMode, agentOverride?: AgentId) => {
      const engine = engineRef.current;
      if (!engine) return;
      const activeMode = modeOverride ?? landscapeMode;
      const targetAgent = agentOverride ?? engine.activeInspectAgent;
      lastLandscapeGenRef.current = engine.generation;
      lastScanStartedAtRef.current = Date.now();

      if (activeMode === 'spatial') {
        weightScannerRef.current = null;
        const snap = scanSpatialLandscape(engine, 25, 17, targetAgent);
        landscapeDataRef.current = snap;
        setLandscapeData(snap);
      } else {
        const scanner = new WeightSpaceScanner(engine, 13, 110, 1.2, targetAgent);
        const initial = scanner.stepRows(2);
        weightScannerRef.current = scanner;
        const copy = { ...initial };
        landscapeDataRef.current = copy;
        setLandscapeData(copy);
      }
    },
    [landscapeMode]
  );

  const needsLandscapeUpdates =
    activeToolTab === 'landscape' || (isRecording && recLossLandscape);

  useEffect(() => {
    if (!needsLandscapeUpdates) return;

    startFreshLandscapeScan(landscapeMode);

    if (landscapeMode === 'spatial') {
      const id = window.setInterval(() => {
        if (!engineRef.current) return;
        const snap = scanSpatialLandscape(
          engineRef.current,
          25,
          17,
          engineRef.current.activeInspectAgent
        );
        landscapeDataRef.current = snap;
        setLandscapeData(snap);
      }, 120);
      return () => window.clearInterval(id);
    }

    const id = window.setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;
      const scanner = weightScannerRef.current;

      if (!scanner) {
        startFreshLandscapeScan('weight');
        return;
      }

      if (!scanner.isComplete) {
        const next = scanner.stepRows(1);
        const copy = { ...next };
        landscapeDataRef.current = copy;
        setLandscapeData(copy);
      } else if (
        engine.generation !== lastLandscapeGenRef.current &&
        Date.now() - lastScanStartedAtRef.current >= 2500
      ) {
        startFreshLandscapeScan('weight');
      }
    }, 65);

    return () => window.clearInterval(id);
  }, [needsLandscapeUpdates, landscapeMode, startFreshLandscapeScan]);

  // Refresh landscape immediately when active rewards, architecture, or target agent change
  useEffect(() => {
    if (!needsLandscapeUpdates) return;
    startFreshLandscapeScan(landscapeMode);
  }, [
    rewards,
    layers,
    neurons,
    activation,
    outputConfig,
    simMode,
    splitBrainCount,
    splitBrainMergeMode,
    activeInspectAgent,
    telepathyBridgeMode,
    enemyCount,
    enemySpeedPct,
    enemySpeedMode,
    spawnMode,
    needsLandscapeUpdates,
    landscapeMode,
    startFreshLandscapeScan,
  ]);

  const syncBrainUiFromEngine = useCallback((agentOverride?: AgentId) => {
    const engine = engineRef.current;
    if (!engine) return;
    const targetId: AgentId = engine.hasTwoBrains()
      ? agentOverride ?? engine.activeInspectAgent
      : 'A';
    const cfg = engine.getTargetBrainConfig(targetId);
    setLayers(cfg.hiddenLayersCount);
    setNeurons(cfg.neuronsPerLayer);
    setHiddenLayerSizes(engine.getHiddenLayerSizes(targetId));
    setActivation(cfg.activationType);
    setOutputConfig(engine.getOutputConfig(targetId));
    setIsFrozen(engine.isAgentFrozen(targetId));
    setCanPrune(engine.canPrune(targetId));
    setFrozenRewards(engine.getFrozenRewardsSummary(targetId));
    setMinArchBounds(engine.getMinimumArchitectureBounds(targetId));
  }, []);

  const handleSimModeChange = useCallback(
    (mode: SimMode) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setSimMode(mode);
      setSimMode(engine.simMode);
      setSplitBrainCount(engine.splitBrainCount);
      setSplitBrainMergeMode(engine.splitBrainMergeMode);
      setActiveInspectAgent(engine.activeInspectAgent);
      setNetViewMode(engine.netViewMode);
      setTelepathyBridgeMode(engine.telepathyBridgeMode);
      syncBrainUiFromEngine(engine.activeInspectAgent);
      setInspectorTick((t) => t + 1);
      weightScannerRef.current = null;
      const simCtx = simCanvasRef.current?.getContext('2d');
      if (simCtx) engine.drawArena(simCtx);
      const nnCtx = nnCanvasRef.current?.getContext('2d');
      if (nnCtx) engine.drawNN(nnCtx, dragBoxRef.current);
      if (activeToolTab === 'landscape' || (isRecording && recLossLandscape)) {
        startFreshLandscapeScan(undefined, engine.activeInspectAgent);
      }
    },
    [activeToolTab, isRecording, recLossLandscape, startFreshLandscapeScan, syncBrainUiFromEngine]
  );

  const handleSplitBrainCountChange = useCallback(
    (count: number) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setSplitBrainCount(count);
      setSplitBrainCount(engine.splitBrainCount);
      setActiveInspectAgent(engine.activeInspectAgent);
      setNetViewMode(engine.netViewMode);
      syncBrainUiFromEngine(engine.activeInspectAgent);
      setInspectorTick((t) => t + 1);
      weightScannerRef.current = null;
      const simCtx = simCanvasRef.current?.getContext('2d');
      if (simCtx) engine.drawArena(simCtx);
      const nnCtx = nnCanvasRef.current?.getContext('2d');
      if (nnCtx) engine.drawNN(nnCtx, dragBoxRef.current);
      if (activeToolTab === 'landscape' || (isRecording && recLossLandscape)) {
        startFreshLandscapeScan(undefined, engine.activeInspectAgent);
      }
    },
    [activeToolTab, isRecording, recLossLandscape, startFreshLandscapeScan, syncBrainUiFromEngine]
  );

  const handleSplitBrainMergeModeChange = useCallback(
    (mode: SplitBrainMergeMode) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setSplitBrainMergeMode(mode);
      setSplitBrainMergeMode(engine.splitBrainMergeMode);
      setInspectorTick((t) => t + 1);
      weightScannerRef.current = null;
      const simCtx = simCanvasRef.current?.getContext('2d');
      if (simCtx) engine.drawArena(simCtx);
      const nnCtx = nnCanvasRef.current?.getContext('2d');
      if (nnCtx) engine.drawNN(nnCtx, dragBoxRef.current);
      if (activeToolTab === 'landscape' || (isRecording && recLossLandscape)) {
        startFreshLandscapeScan(undefined, engine.activeInspectAgent);
      }
    },
    [activeToolTab, isRecording, recLossLandscape, startFreshLandscapeScan]
  );

  const handleSelectInspectAgent = useCallback(
    (id: AgentId) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setActiveInspectAgent(id);
      setActiveInspectAgent(engine.activeInspectAgent);
      syncBrainUiFromEngine(engine.activeInspectAgent);
      setInspectorTick((t) => t + 1);
      weightScannerRef.current = null;
    },
    [syncBrainUiFromEngine]
  );

  const handleNetViewModeChange = useCallback(
    (mode: NetViewMode) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setNetViewMode(mode);
      setNetViewMode(engine.netViewMode);
      setActiveInspectAgent(engine.activeInspectAgent);
      syncBrainUiFromEngine(engine.activeInspectAgent);
      const nnCtx = nnCanvasRef.current?.getContext('2d');
      if (nnCtx) {
        engine.drawNN(nnCtx, dragBoxRef.current);
      }
    },
    [syncBrainUiFromEngine]
  );

  const handleTelepathyBridgeModeChange = useCallback(
    (mode: TelepathyBridgeMode) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setTelepathyBridgeMode(mode);
      setTelepathyBridgeMode(engine.telepathyBridgeMode);
      setInspectorTick((t) => t + 1);
      weightScannerRef.current = null;
      const nnCtx = nnCanvasRef.current?.getContext('2d');
      if (nnCtx) {
        engine.drawNN(nnCtx, dragBoxRef.current);
      }
      if (activeToolTab === 'landscape' || (isRecording && recLossLandscape)) {
        startFreshLandscapeScan(undefined, engine.activeInspectAgent);
      }
    },
    [activeToolTab, isRecording, recLossLandscape, startFreshLandscapeScan]
  );

  const handleReset = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.resetSimulation();
    syncBrainUiFromEngine(engineRef.current.activeInspectAgent);
    setInspectorTick((t) => t + 1);
    weightScannerRef.current = null;
    if (activeToolTab === 'landscape' || (isRecording && recLossLandscape)) {
      startFreshLandscapeScan();
    }
  }, [activeToolTab, isRecording, recLossLandscape, startFreshLandscapeScan, syncBrainUiFromEngine]);

  const handleToggleFreeze = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const targetId = engine.activeInspectAgent;
    const next = !engine.isAgentFrozen(targetId);
    engine.setFrozen(next, targetId);
    syncBrainUiFromEngine(targetId);
    setInspectorTick((t) => t + 1);
  }, [syncBrainUiFromEngine]);

  const handleToggleInspectorNodeFreeze = useCallback(
    (hiddenLayer: number, nodeIndex: number, agentId: AgentId) => {
      const engine = engineRef.current;
      if (!engine) return;
      const res = engine.toggleHiddenNodeFreeze(hiddenLayer, nodeIndex, agentId);
      if (res.agentId === engine.activeInspectAgent) {
        syncBrainUiFromEngine(res.agentId);
      }
      setInspectorTick((t) => t + 1);
    },
    [syncBrainUiFromEngine]
  );

  const handleStartRecording = useCallback(() => {
    if (!engineRef.current || isRecording) return;
    if (!recorderRef.current) {
      recorderRef.current = new VideoRecorder();
    }
    if (recLossLandscape && !landscapeDataRef.current) {
      startFreshLandscapeScan();
    }
    const activeLabels = rewardsRef.current
      .filter((r) => r.active)
      .map((r) => `${r.isPositive ? '+' : '-'}${r.label.replace(/^[+-]/, '')}`);
    setRecStatus(null);
    const ok = recorderRef.current.start(
      engineRef.current,
      {
        recordTraining: recTraining,
        recordLossLandscape: recLossLandscape,
        recordNeuralNet: recNeuralNet,
        landscapeMode,
        landscapeMetric,
        activeRewardLabels: activeLabels,
        getLandscapeData: () => landscapeDataRef.current,
      },
      (fileName) => {
        setIsRecording(false);
        setRecStatus({ text: `Saved ${fileName}`, isError: false });
      },
      (errMsg) => {
        setIsRecording(false);
        setRecStatus({ text: errMsg, isError: true });
      }
    );
    if (ok) {
      setIsRecording(true);
    }
  }, [
    isRecording,
    landscapeMetric,
    landscapeMode,
    recLossLandscape,
    recNeuralNet,
    recTraining,
    startFreshLandscapeScan,
  ]);

  const handleStopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const getNNCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = nnCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * NN_WIDTH,
      y: ((clientY - rect.top) / rect.height) * NN_HEIGHT,
    };
  }, []);

  const finishNNDrag = useCallback(
    (clientX: number, clientY: number) => {
      const box = dragBoxRef.current;
      dragBoxRef.current = null;
      if (!box || !engineRef.current) {
        setNnCursor('default');
        return;
      }
      const pt = getNNCanvasPoint(clientX, clientY);
      const endX = pt ? pt.x : box.x2;
      const endY = pt ? pt.y : box.y2;
      const dragDist = Math.hypot(endX - box.x1, endY - box.y1);

      if (dragDist < 5) {
        const hit = engineRef.current.findHiddenNodeAt(endX, endY);
        if (hit) {
          const res = engineRef.current.toggleHiddenNodeFreeze(
            hit.hiddenLayer,
            hit.nodeIndex,
            hit.agentId
          );
          engineRef.current.setActiveInspectAgent(res.agentId);
          setActiveInspectAgent(engineRef.current.activeInspectAgent);
          syncBrainUiFromEngine(res.agentId);
          setInspectorTick((t) => t + 1);
        }
      } else {
        const res = engineRef.current.toggleHiddenNodesInRect(box.x1, box.y1, endX, endY);
        if (res.changed) {
          engineRef.current.setActiveInspectAgent(res.agentId);
          setActiveInspectAgent(engineRef.current.activeInspectAgent);
          syncBrainUiFromEngine(res.agentId);
          setInspectorTick((t) => t + 1);
        }
      }
      setNnCursor(pt && engineRef.current.findHiddenNodeAt(pt.x, pt.y) ? 'pointer' : 'default');
    },
    [getNNCanvasPoint, syncBrainUiFromEngine]
  );

  useEffect(() => {
    const handleWindowPointerUp = (e: PointerEvent) => {
      if (dragBoxRef.current) {
        finishNNDrag(e.clientX, e.clientY);
      }
    };
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [finishNNDrag]);

  const handleLayersChange = useCallback(
    (val: number) => {
      const engine = engineRef.current;
      if (!engine) return;
      const targetId = engine.activeInspectAgent;
      const cfg = engine.getTargetBrainConfig(targetId);
      const clamped = Math.min(5, Math.max(1, val));
      engine.resizeNetwork(clamped, cfg.neuronsPerLayer, cfg.activationType, targetId);
      syncBrainUiFromEngine(targetId);
      setInspectorTick((t) => t + 1);
    },
    [syncBrainUiFromEngine]
  );

  const handleNeuronsChange = useCallback(
    (val: number) => {
      const engine = engineRef.current;
      if (!engine) return;
      const targetId = engine.activeInspectAgent;
      const cfg = engine.getTargetBrainConfig(targetId);
      const clamped = Math.min(64, Math.max(1, val));
      engine.resizeNetwork(cfg.hiddenLayersCount, clamped, cfg.activationType, targetId);
      syncBrainUiFromEngine(targetId);
      setInspectorTick((t) => t + 1);
    },
    [syncBrainUiFromEngine]
  );

  const handlePruneNetwork = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const targetId = engine.activeInspectAgent;
    const result = engine.pruneNetwork('least', targetId);
    if (!result) {
      setCanPrune(false);
      return;
    }
    syncBrainUiFromEngine(targetId);
    setInspectorTick((t) => t + 1);
  }, [syncBrainUiFromEngine]);

  const handleReversePrune = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const targetId = engine.activeInspectAgent;
    const result = engine.pruneNetwork('strongest', targetId);
    if (!result) {
      setCanPrune(false);
      return;
    }
    syncBrainUiFromEngine(targetId);
    setInspectorTick((t) => t + 1);
  }, [syncBrainUiFromEngine]);

  const handleDownloadWeights = useCallback(() => {
    const payload = engineRef.current?.exportWeightsPayload();
    if (!payload) return;
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rl-evasion-weights-gen-${payload.generation}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const handleGetWeightsJson = useCallback(() => {
    const payload = engineRef.current?.exportWeightsPayload();
    if (!payload) return '';
    return JSON.stringify(payload);
  }, []);

  const handleUploadWeights = useCallback(
    (data: unknown) => {
      if (!engineRef.current) {
        throw new Error('Simulation engine not ready.');
      }
      const result = engineRef.current.importWeightsPayload(data);
      const p = result.params;
      setSimMode(result.simMode);
      setSplitBrainCount(result.splitBrainCount);
      setSplitBrainMergeMode(result.splitBrainMergeMode);
      setActiveInspectAgent(result.activeInspectAgent);
      setNetViewMode(result.netViewMode);
      setTelepathyBridgeMode(result.telepathyBridgeMode);
      syncBrainUiFromEngine(result.activeInspectAgent);
      setEnemyCount(p.numEnemies);
      setEnemySpeedPct(p.enemySpeedPct);
      setEnemySpeedMode(p.enemySpeedMode);
      setSpawnMode(p.spawnMode);
      setSimSpeed(p.simSpeed);
      setTurboMode(p.turboMode);
      setInspectorTick((t) => t + 1);
      weightScannerRef.current = null;

    const restoredRewards: RewardConfigItem[] = [
      {
        id: 'R21',
        label: 'Hit',
        category: 'spacing',
        active: typeof p.rewardHit === 'boolean' ? p.rewardHit : true,
        isPositive: (p.weightHit ?? -500) >= 0,
        weightText: String(Math.abs(p.weightHit ?? -500)),
        title: 'Fitness change applied when an enemy collides with the player (default -500)',
      },
      {
        id: 'R1',
        label: '+EnemyDist',
        category: 'spacing',
        active: p.rewardEnemyDist,
        isPositive: p.weightEnemyDist >= 0,
        weightText: String(Math.abs(p.weightEnemyDist)),
        title: 'Distance from nearest enemy',
      },
      {
        id: 'R2',
        label: '+WallDist',
        category: 'spacing',
        active: p.rewardWallDist,
        isPositive: p.weightWallDist >= 0,
        weightText: String(Math.abs(p.weightWallDist)),
        title: 'Distance from nearest arena wall',
      },
      {
        id: 'R3',
        label: '+GroupEnemies',
        category: 'spacing',
        active: p.rewardGroupEnemies,
        isPositive: p.weightGroupEnemies >= 0,
        weightText: String(Math.abs(p.weightGroupEnemies)),
        title: 'Weight for enemy grouping reward',
      },
      {
        id: 'R4',
        label: '+SpreadEnemies',
        category: 'spacing',
        active: p.rewardSpreadEnemies,
        isPositive: p.weightSpreadEnemies >= 0,
        weightText: String(Math.abs(p.weightSpreadEnemies)),
        title: 'Weight for enemy spreading reward',
      },
      {
        id: 'R5',
        label: '+EdgeEnemies',
        category: 'spacing',
        active: p.rewardEdgeEnemies,
        isPositive: p.weightEdgeEnemies >= 0,
        weightText: String(Math.abs(p.weightEdgeEnemies)),
        title: 'Weight for enemies near map edge reward',
      },
      {
        id: 'R22',
        label: '+AvgEnemyCenter',
        category: 'spacing',
        active: Boolean(p.rewardAvgEnemyCenter),
        isPositive: (p.weightAvgEnemyCenter ?? 1.0) >= 0,
        weightText: String(Math.abs(p.weightAvgEnemyCenter ?? 1.0)),
        title: 'Reward when the average enemy position (centroid) is in the center of the arena',
      },
      {
        id: 'R6',
        label: '+OppHeading',
        category: 'flow',
        active: p.rewardOppHeading,
        isPositive: p.weightOppHeading >= 0,
        weightText: String(Math.abs(p.weightOppHeading)),
        title: 'Weight for player heading away from average enemy vector',
      },
      {
        id: 'R7',
        label: '+SmoothVel',
        category: 'flow',
        active: p.rewardSmoothVel,
        isPositive: p.weightSmoothVel >= 0,
        weightText: String(Math.abs(p.weightSmoothVel)),
        title: 'Weight for smooth average velocity and penalizing jerky or noisy movement',
      },
      {
        id: 'R8',
        label: '+SplitGap',
        category: 'flow',
        active: p.rewardSplitGap,
        isPositive: p.weightSplitGap >= 0,
        weightText: String(Math.abs(p.weightSplitGap)),
        title: 'Weight for velocity splitting the largest angular gap between nearby enemies',
      },
      {
        id: 'R19',
        label: '+SplitGapCollect',
        category: 'flow',
        active: p.rewardSplitGapCollect,
        isPositive: p.weightSplitGapCollect >= 0,
        weightText: String(Math.abs(p.weightSplitGapCollect)),
        title: 'Meta-reward for SplitGap: rewards collecting unique forward enemy gaps and penalizes re-crossing already-collected gaps',
      },
      {
        id: 'R20',
        label: '+SplitGapPredict',
        category: 'flow',
        active: Boolean(p.rewardSplitGapPredict),
        isPositive: (p.weightSplitGapPredict ?? 1.0) >= 0,
        weightText: String(Math.abs(p.weightSplitGapPredict ?? 1.0)),
        title: 'Meta-reward for SplitGap: learns the shift from where the split gap was moments before to predict and steer toward where the gap is going to be',
      },
      {
        id: 'R14',
        label: '+OpenCorridor',
        category: 'flow',
        active: p.rewardOpenCorridor,
        isPositive: p.weightOpenCorridor >= 0,
        weightText: String(Math.abs(p.weightOpenCorridor)),
        title: 'Forward cone clearance to both arena walls and enemy intercepts',
      },
      {
        id: 'R18',
        label: '+FarWallSense',
        category: 'flow',
        active: p.rewardFarWallSense,
        isPositive: p.weightFarWallSense >= 0,
        weightText: String(Math.abs(p.weightFarWallSense)),
        title: 'Prefer moving toward the opposite side of the arena from recent position',
      },
      {
        id: 'R9',
        label: '+EdgeSense',
        category: 'tactical',
        active: p.rewardEdgeSense,
        isPositive: p.weightEdgeSense >= 0,
        weightText: String(Math.abs(p.weightEdgeSense)),
        title: 'Favor velocities with a close enemy in only one peripheral while the opposite peripheral is clear',
      },
      {
        id: 'R10',
        label: '+OrbitKite',
        category: 'tactical',
        active: p.rewardOrbitKite,
        isPositive: p.weightOrbitKite >= 0,
        weightText: String(Math.abs(p.weightOrbitKite)),
        title: 'Orbit nearest enemy at 90 degrees inside a 60-110px sweet-spot band',
      },
      {
        id: 'R11',
        label: '+MatadorCut',
        category: 'tactical',
        active: p.rewardMatadorCut,
        isPositive: p.weightMatadorCut >= 0,
        weightText: String(Math.abs(p.weightMatadorCut)),
        title: 'Cut past a close enemy shoulder behind its pursuit velocity vector',
      },
      {
        id: 'R12',
        label: '+AnkleBreaker',
        category: 'tactical',
        active: p.rewardAnkleBreaker,
        isPositive: p.weightAnkleBreaker >= 0,
        weightText: String(Math.abs(p.weightAnkleBreaker)),
        title: 'Maximize angular bearing sweep rate of nearby enemies around the player',
      },
      {
        id: 'R13',
        label: '+PincerEscape',
        category: 'tactical',
        active: p.rewardPincerEscape,
        isPositive: p.weightPincerEscape >= 0,
        weightText: String(Math.abs(p.weightPincerEscape)),
        title: 'Break perpendicularly out of opposing two-enemy squeezes',
      },
      {
        id: 'R15',
        label: '+WallSlingshot',
        category: 'tactical',
        active: p.rewardWallSlingshot,
        isPositive: p.weightWallSlingshot >= 0,
        weightText: String(Math.abs(p.weightWallSlingshot)),
        title: 'Run parallel along walls away from nearby threats when cornered near edges',
      },
      {
        id: 'R16',
        label: '+PackTangle',
        category: 'tactical',
        active: p.rewardPackTangle,
        isPositive: p.weightPackTangle >= 0,
        weightText: String(Math.abs(p.weightPackTangle)),
        title: 'Lead trailing enemies into tightly crowded clusters behind the player heading',
      },
      {
        id: 'R17',
        label: '+SpideySense',
        category: 'tactical',
        active: p.rewardSpideySense,
        isPositive: p.weightSpideySense >= 0,
        weightText: String(Math.abs(p.weightSpideySense)),
        title: 'Sum spatial danger gradients within 200px weighted by proximity and closing speed, penalizing velocity piercing uphill into danger',
      },
      {
        id: 'R23',
        label: 'VectorStabbing',
        category: 'tactical',
        active: Boolean(p.rewardVectorStabbing),
        isPositive: (p.weightVectorStabbing ?? -1.0) >= 0,
        weightText: String(Math.abs(p.weightVectorStabbing ?? -1.0)),
        title: 'Penalize velocity vectors that pierce into or drive straight toward the arena walls',
      },
      {
        id: 'R24',
        label: '+Twitch',
        category: 'tactical',
        active: Boolean(p.rewardTwitch),
        isPositive: (p.weightTwitch ?? 1.0) >= 0,
        weightText: String(Math.abs(p.weightTwitch ?? 1.0)),
        title: 'Reward sharp perpendicular lateral movement when an enemy is right in front of the player',
      },
    ];
    rewardsRef.current = restoredRewards;
    setRewards(restoredRewards);
    return { generation: result.generation };
  }, [syncBrainUiFromEngine]);

  const handleActivationChange = useCallback(
    (val: ActivationType) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setActivation(val, engine.activeInspectAgent);
      syncBrainUiFromEngine(engine.activeInspectAgent);
    },
    [syncBrainUiFromEngine]
  );

  const handleOutputConfigChange = useCallback(
    (cfg: OutputConfig) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setOutputConfig(cfg, engine.activeInspectAgent);
      syncBrainUiFromEngine(engine.activeInspectAgent);
      const nnCtx = nnCanvasRef.current?.getContext('2d');
      if (nnCtx) {
        engine.drawNN(nnCtx, dragBoxRef.current);
      }
      setInspectorTick((t) => t + 1);
      weightScannerRef.current = null;
      if (activeToolTab === 'landscape' || (isRecording && recLossLandscape)) {
        startFreshLandscapeScan();
      }
    },
    [activeToolTab, isRecording, recLossLandscape, startFreshLandscapeScan, syncBrainUiFromEngine]
  );

  const handleEnemyCountChange = useCallback((val: number) => {
    const clamped = Math.min(50, Math.max(1, val));
    setEnemyCount(clamped);
    engineRef.current?.updateEnemyCount(clamped);
  }, []);

  const handleEnemySpeedPctChange = useCallback((val: number) => {
    const clamped = Math.max(1, val);
    setEnemySpeedPct(clamped);
    engineRef.current?.updateEnemySpeedPct(clamped);
  }, []);

  const handleEnemySpeedModeChange = useCallback((mode: EnemySpeedMode) => {
    setEnemySpeedMode(mode);
    engineRef.current?.setEnemySpeedMode(mode);
  }, []);

  const handleSpawnModeChange = useCallback((mode: SpawnMode) => {
    setSpawnMode(mode);
    engineRef.current?.setSpawnMode(mode);
  }, []);

  const handleSimSpeedChange = useCallback((val: number) => {
    setSimSpeed(val);
    setTurboMode(false);
    if (engineRef.current) {
      engineRef.current.params.simSpeed = val;
      engineRef.current.params.turboMode = false;
    }
  }, []);

  const handleSetTurboMode = useCallback((turbo: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.params.turboMode = turbo;
    setTurboMode(turbo);
    if (!turbo) {
      engineRef.current.params.simSpeed = 1;
      setSimSpeed(1);
    }
  }, []);

  const handleVisualModeChange = useCallback((mode: VisualMode) => {
    setVisualMode(mode);
    if (engineRef.current) {
      engineRef.current.setVisualMode(mode);
      const simCtx = simCanvasRef.current?.getContext('2d');
      if (simCtx) {
        engineRef.current.drawArena(simCtx);
      }
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('rl_evasion_sound_enabled', String(next));
      } catch {
        // Ignore storage restrictions
      }
      if (next) {
        engineRef.current?.unlockAudio();
      } else {
        engineRef.current?.silenceContinuousAudio();
      }
      return next;
    });
  }, []);

  const handleSoundVolumeChange = useCallback((vol: number) => {
    const clamped = Math.min(1, Math.max(0, vol));
    setSoundVolume(clamped);
    try {
      window.localStorage.setItem('rl_evasion_sound_volume', String(clamped));
    } catch {
      // Ignore storage restrictions
    }
    engineRef.current?.unlockAudio();
  }, []);

  const syncRewardFlag = (id: RewardConfigItem['id'], active: boolean) => {
    if (!engineRef.current) return;
    switch (id) {
      case 'R1':
        engineRef.current.params.rewardEnemyDist = active;
        break;
      case 'R2':
        engineRef.current.params.rewardWallDist = active;
        break;
      case 'R3':
        engineRef.current.params.rewardGroupEnemies = active;
        break;
      case 'R4':
        engineRef.current.params.rewardSpreadEnemies = active;
        break;
      case 'R5':
        engineRef.current.params.rewardEdgeEnemies = active;
        break;
      case 'R6':
        engineRef.current.params.rewardOppHeading = active;
        break;
      case 'R7':
        engineRef.current.params.rewardSmoothVel = active;
        break;
      case 'R8':
        engineRef.current.params.rewardSplitGap = active;
        break;
      case 'R9':
        engineRef.current.params.rewardEdgeSense = active;
        break;
      case 'R10':
        engineRef.current.params.rewardOrbitKite = active;
        break;
      case 'R11':
        engineRef.current.params.rewardMatadorCut = active;
        break;
      case 'R12':
        engineRef.current.params.rewardAnkleBreaker = active;
        break;
      case 'R13':
        engineRef.current.params.rewardPincerEscape = active;
        break;
      case 'R14':
        engineRef.current.params.rewardOpenCorridor = active;
        break;
      case 'R15':
        engineRef.current.params.rewardWallSlingshot = active;
        break;
      case 'R16':
        engineRef.current.params.rewardPackTangle = active;
        break;
      case 'R17':
        engineRef.current.params.rewardSpideySense = active;
        break;
      case 'R18':
        engineRef.current.params.rewardFarWallSense = active;
        break;
      case 'R19':
        engineRef.current.params.rewardSplitGapCollect = active;
        break;
      case 'R20':
        engineRef.current.params.rewardSplitGapPredict = active;
        break;
      case 'R21':
        engineRef.current.params.rewardHit = active;
        break;
      case 'R22':
        engineRef.current.params.rewardAvgEnemyCenter = active;
        break;
      case 'R23':
        engineRef.current.params.rewardVectorStabbing = active;
        break;
      case 'R24':
        engineRef.current.params.rewardTwitch = active;
        break;
    }
  };

  const syncRewardWeight = (id: RewardConfigItem['id'], signedWeight: number) => {
    if (!engineRef.current) return;
    switch (id) {
      case 'R1':
        engineRef.current.params.weightEnemyDist = signedWeight;
        break;
      case 'R2':
        engineRef.current.params.weightWallDist = signedWeight;
        break;
      case 'R3':
        engineRef.current.params.weightGroupEnemies = signedWeight;
        break;
      case 'R4':
        engineRef.current.params.weightSpreadEnemies = signedWeight;
        break;
      case 'R5':
        engineRef.current.params.weightEdgeEnemies = signedWeight;
        break;
      case 'R6':
        engineRef.current.params.weightOppHeading = signedWeight;
        break;
      case 'R7':
        engineRef.current.params.weightSmoothVel = signedWeight;
        break;
      case 'R8':
        engineRef.current.params.weightSplitGap = signedWeight;
        break;
      case 'R9':
        engineRef.current.params.weightEdgeSense = signedWeight;
        break;
      case 'R10':
        engineRef.current.params.weightOrbitKite = signedWeight;
        break;
      case 'R11':
        engineRef.current.params.weightMatadorCut = signedWeight;
        break;
      case 'R12':
        engineRef.current.params.weightAnkleBreaker = signedWeight;
        break;
      case 'R13':
        engineRef.current.params.weightPincerEscape = signedWeight;
        break;
      case 'R14':
        engineRef.current.params.weightOpenCorridor = signedWeight;
        break;
      case 'R15':
        engineRef.current.params.weightWallSlingshot = signedWeight;
        break;
      case 'R16':
        engineRef.current.params.weightPackTangle = signedWeight;
        break;
      case 'R17':
        engineRef.current.params.weightSpideySense = signedWeight;
        break;
      case 'R18':
        engineRef.current.params.weightFarWallSense = signedWeight;
        break;
      case 'R19':
        engineRef.current.params.weightSplitGapCollect = signedWeight;
        break;
      case 'R20':
        engineRef.current.params.weightSplitGapPredict = signedWeight;
        break;
      case 'R21':
        engineRef.current.params.weightHit = signedWeight;
        break;
      case 'R22':
        engineRef.current.params.weightAvgEnemyCenter = signedWeight;
        break;
      case 'R23':
        engineRef.current.params.weightVectorStabbing = signedWeight;
        break;
      case 'R24':
        engineRef.current.params.weightTwitch = signedWeight;
        break;
    }
  };

  const handleToggleReward = useCallback((id: RewardConfigItem['id']) => {
    const nextRewards = rewardsRef.current.map((item) => {
      if (item.id !== id) return item;
      const nextActive = !item.active;
      syncRewardFlag(id, nextActive);
      return { ...item, active: nextActive };
    });
    rewardsRef.current = nextRewards;
    setRewards(nextRewards);
  }, []);

  const handleToggleRewardSign = useCallback((id: RewardConfigItem['id']) => {
    const nextRewards = rewardsRef.current.map((item) => {
      if (item.id !== id) return item;
      const nextPositive = !item.isPositive;
      const raw = parseFloat(item.weightText) || 0;
      const signed = nextPositive ? Math.abs(raw) : -Math.abs(raw);
      syncRewardWeight(id, signed);
      return { ...item, isPositive: nextPositive };
    });
    rewardsRef.current = nextRewards;
    setRewards(nextRewards);
  }, []);

  const handleRewardWeightChange = useCallback((id: RewardConfigItem['id'], text: string) => {
    const nextRewards = rewardsRef.current.map((item) => {
      if (item.id !== id) return item;
      const parsed = parseFloat(text);
      if (!isNaN(parsed)) {
        const signed = item.isPositive ? Math.abs(parsed) : -Math.abs(parsed);
        syncRewardWeight(id, signed);
      }
      return { ...item, weightText: text };
    });
    rewardsRef.current = nextRewards;
    setRewards(nextRewards);
  }, []);

  const handleClearAllRewards = useCallback(() => {
    const nextRewards = rewardsRef.current.map((item) => {
      if (item.active) {
        syncRewardFlag(item.id, false);
      }
      return { ...item, active: false };
    });
    rewardsRef.current = nextRewards;
    setRewards(nextRewards);
  }, []);

  const handleSaveDemo = useCallback((demo: HumanDemoRecording) => {
    setHumanDemos((prev) => {
      const next = [...prev, demo];
      saveDemosToStorage(next);
      return next;
    });
  }, []);

  const handleDeleteDemo = useCallback((id: string) => {
    setHumanDemos((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveDemosToStorage(next);
      return next;
    });
  }, []);

  const handleClearAllDemos = useCallback(() => {
    setHumanDemos([]);
    saveDemosToStorage([]);
  }, []);

  const downloadJsonFile = (obj: unknown, fileName: string) => {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadAllDemos = useCallback(() => {
    if (humanDemos.length === 0) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const payload = createDemoBundlePayload(humanDemos);
    downloadJsonFile(payload, `rl-evasion-human-demos-${humanDemos.length}-${stamp}.json`);
  }, [humanDemos]);

  const handleDownloadSingleDemo = useCallback((demo: HumanDemoRecording) => {
    const safeName = demo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const payload = createDemoBundlePayload([demo]);
    downloadJsonFile(payload, `rl-evasion-${safeName || 'demo'}-${demo.steps}f.json`);
  }, []);

  const handleImportDemosData = useCallback((data: unknown): number => {
    const incoming = parseDemoImportData(data);
    setHumanDemos((prev) => {
      const seenIds = new Set(prev.map((d) => d.id));
      const additions = incoming.map((d, idx) =>
        seenIds.has(d.id) ? { ...d, id: `${d.id}-imp-${Date.now()}-${idx}` } : d
      );
      const next = [...prev, ...additions];
      saveDemosToStorage(next);
      return next;
    });
    return incoming.length;
  }, []);

  const handleTrainOnDemos = useCallback(
    (config: {
      epochs: number;
      learningRate: number;
      seedPopulation: boolean;
      agentId?: AgentId;
    }): TrainingResult => {
      const engine = engineRef.current;
      if (!engine) {
        throw new Error('Simulation engine not ready.');
      }
      const targetId: AgentId = engine.hasTwoBrains()
        ? config.agentId ?? engine.activeInspectAgent
        : 'A';
      const targetNet =
        engine.getTargetAgent(targetId) ?? engine.getTargetBestAgent(targetId);
      if (!targetNet) {
        throw new Error('No neural network initialized.');
      }
      const { network, result } = trainNetworkOnDemos(
        targetNet,
        humanDemos,
        {
          epochs: config.epochs,
          learningRate: config.learningRate,
          batchSize: 64,
        },
        engine.getOutputConfig(targetId)
      );
      engine.applyTrainedAgent(network, config.seedPopulation, targetId);
      engine.setActiveInspectAgent(targetId);
      setActiveInspectAgent(engine.activeInspectAgent);
      syncBrainUiFromEngine(targetId);
      setInspectorTick((t) => t + 1);
      weightScannerRef.current = null;
      return result;
    },
    [humanDemos, syncBrainUiFromEngine]
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden flex flex-col items-center">
      <ControlBar
        layers={layers}
        neurons={neurons}
        hiddenLayerSizes={hiddenLayerSizes}
        minLayers={minArchBounds.minLayers}
        minNeurons={minArchBounds.minNeurons}
        activation={activation}
        outputConfig={outputConfig}
        enemyCount={enemyCount}
        enemySpeedPct={enemySpeedPct}
        enemySpeedMode={enemySpeedMode}
        spawnMode={spawnMode}
        simSpeed={simSpeed}
        turboMode={turboMode}
        visualMode={visualMode}
        soundEnabled={soundEnabled}
        soundVolume={soundVolume}
        rewards={rewards}
        onLayersChange={handleLayersChange}
        onNeuronsChange={handleNeuronsChange}
        onActivationChange={handleActivationChange}
        onOutputConfigChange={handleOutputConfigChange}
        onEnemyCountChange={handleEnemyCountChange}
        onEnemySpeedPctChange={handleEnemySpeedPctChange}
        onEnemySpeedModeChange={handleEnemySpeedModeChange}
        onSpawnModeChange={handleSpawnModeChange}
        onSimSpeedChange={handleSimSpeedChange}
        onVisualModeChange={handleVisualModeChange}
        onToggleSound={handleToggleSound}
        onSoundVolumeChange={handleSoundVolumeChange}
        onToggleReward={handleToggleReward}
        onToggleRewardSign={handleToggleRewardSign}
        onRewardWeightChange={handleRewardWeightChange}
        onClearAllRewards={handleClearAllRewards}
        onSetTurboMode={handleSetTurboMode}
        isFrozen={isFrozen}
        frozenRewards={frozenRewards}
        onToggleFreeze={handleToggleFreeze}
        onPruneNetwork={handlePruneNetwork}
        onReversePrune={handleReversePrune}
        onDownloadWeights={handleDownloadWeights}
        onGetWeightsJson={handleGetWeightsJson}
        onUploadWeights={handleUploadWeights}
        canPrune={canPrune}
        onReset={handleReset}
        demoCount={humanDemos.length}
        onOpenHumanDemo={() => {
          setDemoTrainerOpen(false);
          setHumanDemoOpen(true);
        }}
        onOpenDemoTrainer={() => setDemoTrainerOpen(true)}
        simMode={simMode}
        dualAgentMode={dualAgentMode}
        splitBrainMode={splitBrainMode}
        splitBrainCount={splitBrainCount}
        activeBrainIds={activeBrainIds}
        splitBrainMergeMode={splitBrainMergeMode}
        activeInspectAgent={activeInspectAgent}
        telepathyBridgeMode={telepathyBridgeMode}
        partnerOutputConfig={
          dualAgentMode
            ? engineRef.current?.getOutputConfig(activeInspectAgent === 'A' ? 'B' : 'A')
            : undefined
        }
        onSimModeChange={handleSimModeChange}
        onSplitBrainCountChange={handleSplitBrainCountChange}
        onSplitBrainMergeModeChange={handleSplitBrainMergeModeChange}
        onSelectInspectAgent={handleSelectInspectAgent}
        onTelepathyBridgeModeChange={handleTelepathyBridgeModeChange}
      />
      <canvas
        ref={simCanvasRef}
        id="simCanvas"
        width={SIM_WIDTH}
        height={SIM_HEIGHT}
        className="bg-[#000] border border-[#333] block max-w-full"
      />
      <div id="stats" className="text-[11px] my-[5px] text-[#888] tabular-nums">
        {statsText}
      </div>
      <div className="w-full max-w-[600px] flex flex-col items-center">
        {/* Unified Neural Net, Analysis & Video Panel */}
        <div
          id="toolsPanelContainer"
          className="w-full mb-[8px] border border-[#333] bg-[#141414] font-mono text-[12px] overflow-hidden"
        >
          <div className="flex items-center justify-between gap-[6px] px-[8px] py-[4px] min-w-0">
            <button
              id="btnToggleToolsPanel"
              type="button"
              onClick={() => {
                dragBoxRef.current = null;
                setNnCursor('default');
                setActiveToolTab((prev) => {
                  if (prev !== null) {
                    lastToolTabRef.current = prev;
                    return null;
                  }
                  return lastToolTabRef.current;
                });
              }}
              className="flex-1 min-w-0 overflow-hidden flex items-center justify-between gap-[8px] bg-transparent border-none p-0 font-mono text-[12px] text-[#ddd] hover:text-[#fff] cursor-pointer text-left"
            >
              <span className="inline-flex items-center gap-[6px] whitespace-nowrap shrink-0">
                <span className={activeToolTab !== null ? 'text-[#2dd4bf]' : 'text-[#ddd]'}>
                  Panels &amp; Video {activeToolTab !== null ? '▾' : '▸'}
                </span>
              </span>
              <span className="text-[10px] text-[#777] truncate min-w-0">
                {activeToolTab === 'nn'
                  ? 'Neural Net'
                  : activeToolTab === 'weights'
                  ? 'Weight Inspector'
                  : activeToolTab === 'landscape'
                  ? 'Loss Landscape'
                  : activeToolTab === 'physics'
                  ? 'Physics'
                  : activeToolTab === 'video'
                  ? 'Video Recorder'
                  : 'Net · Weights · Landscape · Physics · Rec'}
              </span>
            </button>

            {isRecording && (
              <button
                id="btnQuickStopRec"
                type="button"
                onClick={handleStopRecording}
                title="Stop recording and download video"
                className="bg-[#7a1c1c] hover:bg-[#962222] text-[#fff] border border-[#d55] px-[6px] py-[2px] font-mono text-[11px] cursor-pointer whitespace-nowrap tabular-nums shrink-0"
              >
                ■ {Math.floor(recElapsedSec / 60)}:
                {String(recElapsedSec % 60).padStart(2, '0')}
              </button>
            )}
          </div>

          {activeToolTab !== null && (
            <div className="border-t border-[#2b2b2b] bg-[#111]">
              <div className="grid grid-cols-5 border-b border-[#333] bg-[#191919] text-[11px]">
                <button
                  id="tabNeuralNet"
                  type="button"
                  onClick={() => {
                    dragBoxRef.current = null;
                    setNnCursor('default');
                    lastToolTabRef.current = 'nn';
                    setActiveToolTab('nn');
                  }}
                  className={`${
                    activeToolTab === 'nn'
                      ? 'bg-[#066] text-[#fff]'
                      : 'bg-transparent text-[#ccc] hover:bg-[#242424]'
                  } border-none border-r border-[#333] py-[5px] px-[2px] font-mono text-[11px] cursor-pointer whitespace-nowrap text-center`}
                >
                  Net
                </button>
                <button
                  id="tabWeightInspector"
                  type="button"
                  onClick={() => {
                    dragBoxRef.current = null;
                    setNnCursor('default');
                    lastToolTabRef.current = 'weights';
                    setActiveToolTab('weights');
                  }}
                  className={`${
                    activeToolTab === 'weights'
                      ? 'bg-[#066] text-[#fff]'
                      : 'bg-transparent text-[#ccc] hover:bg-[#242424]'
                  } border-none border-r border-[#333] py-[5px] px-[2px] font-mono text-[11px] cursor-pointer whitespace-nowrap text-center`}
                >
                  Weights
                </button>
                <button
                  id="tabLossLandscape"
                  type="button"
                  onClick={() => {
                    dragBoxRef.current = null;
                    setNnCursor('default');
                    lastToolTabRef.current = 'landscape';
                    setActiveToolTab('landscape');
                  }}
                  className={`${
                    activeToolTab === 'landscape'
                      ? 'bg-[#066] text-[#fff]'
                      : 'bg-transparent text-[#ccc] hover:bg-[#242424]'
                  } border-none border-r border-[#333] py-[5px] px-[2px] font-mono text-[11px] cursor-pointer whitespace-nowrap text-center`}
                >
                  Landscape
                </button>
                <button
                  id="tabPhysics"
                  type="button"
                  onClick={() => {
                    dragBoxRef.current = null;
                    setNnCursor('default');
                    lastToolTabRef.current = 'physics';
                    setActiveToolTab('physics');
                  }}
                  className={`${
                    activeToolTab === 'physics'
                      ? 'bg-[#066] text-[#fff]'
                      : 'bg-transparent text-[#ccc] hover:bg-[#242424]'
                  } border-none border-r border-[#333] py-[5px] px-[2px] font-mono text-[11px] cursor-pointer whitespace-nowrap text-center`}
                >
                  Physics
                </button>
                <button
                  id="tabRecSuite"
                  type="button"
                  onClick={() => {
                    dragBoxRef.current = null;
                    setNnCursor('default');
                    lastToolTabRef.current = 'video';
                    setActiveToolTab('video');
                  }}
                  className={`${
                    isRecording
                      ? 'bg-[#6b1414] text-[#fff]'
                      : activeToolTab === 'video'
                      ? 'bg-[#066] text-[#fff]'
                      : 'bg-transparent text-[#ccc] hover:bg-[#242424]'
                  } border-none py-[5px] px-[2px] font-mono text-[11px] cursor-pointer whitespace-nowrap text-center tabular-nums`}
                >
                  {isRecording
                    ? `■ ${Math.floor(recElapsedSec / 60)}:${String(recElapsedSec % 60).padStart(2, '0')}`
                    : '● Video'}
                </button>
              </div>

              <div className="p-[6px]">
                {activeToolTab === 'nn' && (
                  <div className="flex flex-col gap-[6px]">
                    {(dualAgentMode || splitBrainMode) && (
                      <div className="w-full max-w-[570px] mx-auto flex items-center justify-between gap-[6px] flex-wrap text-[10px]">
                        <div className="flex items-center gap-[5px] flex-wrap">
                          <span className="text-[#888]">View:</span>
                          <span className="inline-flex border border-[#3a3a3a]">
                            {activeBrainIds.map((id, idx) => (
                              <button
                                key={id}
                                id={`btnNetView${id}`}
                                type="button"
                                title={`Inspect ${splitBrainMode ? 'Brain' : 'Agent'} ${id} (${BRAIN_UI_STYLES[id].colorName})`}
                                onClick={() => handleNetViewModeChange(id)}
                                className={`${
                                  netViewMode === id
                                    ? BRAIN_UI_STYLES[id].activeTabClass
                                    : 'bg-[#171717] text-[#aaa] hover:bg-[#242424]'
                                } border-none ${idx > 0 ? 'border-l border-[#3a3a3a]' : ''} px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                              >
                                {splitBrainMode
                                  ? activeBrainIds.length > 2
                                    ? id
                                    : `Brain ${id}`
                                  : `Agent ${id}`}
                              </button>
                            ))}
                            <button
                              id="btnNetViewSplit"
                              type="button"
                              onClick={() => handleNetViewModeChange('split')}
                              className={`${
                                netViewMode === 'split'
                                  ? 'bg-[#066] text-[#fff]'
                                  : 'bg-[#171717] text-[#aaa] hover:bg-[#242424]'
                              } border-none border-l border-[#3a3a3a] px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                            >
                              {splitBrainMode ? `All ${splitBrainCount} Split` : 'Dual Split'}
                            </button>
                          </span>
                          {splitBrainMode && (
                            <span className="inline-flex items-center gap-[4px]">
                              <span className="text-[#888]">Brains:</span>
                              <span className="inline-flex border border-[#3a3a3a]">
                                {[2, 3, 4, 5].map((cnt, idx) => (
                                  <button
                                    key={cnt}
                                    id={`btnNetSplitCount_${cnt}`}
                                    type="button"
                                    title={`Use ${cnt} independent split brains on one agent`}
                                    onClick={() => handleSplitBrainCountChange(cnt)}
                                    className={`${
                                      splitBrainCount === cnt
                                        ? 'bg-[#066] text-[#fff]'
                                        : 'bg-[#171717] text-[#aaa] hover:bg-[#242424]'
                                    } border-none ${idx > 0 ? 'border-l border-[#3a3a3a]' : ''} px-[5px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap tabular-nums`}
                                  >
                                    {cnt}
                                  </button>
                                ))}
                              </span>
                            </span>
                          )}
                        </div>
                        {dualAgentMode ? (
                          <div className="flex items-center gap-[5px]">
                            <span className="text-[#888]">Bridge:</span>
                            <span
                              className="inline-flex border border-[#3a3a3a]"
                              title="Choose Dual two-way telepathy or One-Way telepathy bridge"
                            >
                              <button
                                id="btnNetBridgeDual"
                                type="button"
                                onClick={() => handleTelepathyBridgeModeChange('dual')}
                                className={`${
                                  telepathyBridgeMode === 'dual'
                                    ? 'bg-[#066] text-[#fff]'
                                    : 'bg-[#171717] text-[#aaa] hover:bg-[#242424]'
                                } border-none px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                              >
                                A↔B Dual ({engineRef.current?.getOutputLabels('A').length ?? 2}↔
                                {engineRef.current?.getOutputLabels('B').length ?? 2})
                              </button>
                              <button
                                id="btnNetBridgeAToB"
                                type="button"
                                onClick={() => handleTelepathyBridgeModeChange('a_to_b')}
                                className={`${
                                  telepathyBridgeMode === 'a_to_b'
                                    ? 'bg-[#0c4a55] text-[#67e8f9]'
                                    : 'bg-[#171717] text-[#aaa] hover:bg-[#242424]'
                                } border-none border-l border-[#3a3a3a] px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                              >
                                A→B 1-Way
                              </button>
                              <button
                                id="btnNetBridgeBToA"
                                type="button"
                                onClick={() => handleTelepathyBridgeModeChange('b_to_a')}
                                className={`${
                                  telepathyBridgeMode === 'b_to_a'
                                    ? 'bg-[#5c360b] text-[#fcd34d]'
                                    : 'bg-[#171717] text-[#aaa] hover:bg-[#242424]'
                                } border-none border-l border-[#3a3a3a] px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                              >
                                B→A 1-Way
                              </button>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-[5px] flex-wrap">
                            <span className="text-[#888]">Merge:</span>
                            <span className="inline-flex border border-[#3a3a3a] flex-wrap">
                              {SPLIT_BRAIN_MERGE_OPTIONS.map((opt, idx) => (
                                <button
                                  key={opt.value}
                                  id={`btnNetMerge_${opt.value}`}
                                  type="button"
                                  title={`${opt.label}: ${opt.description}`}
                                  onClick={() => handleSplitBrainMergeModeChange(opt.value)}
                                  className={`${
                                    splitBrainMergeMode === opt.value
                                      ? 'bg-[#066] text-[#fff]'
                                      : 'bg-[#171717] text-[#aaa] hover:bg-[#242424]'
                                  } border-none ${idx > 0 ? 'border-l border-[#3a3a3a]' : ''} px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                                >
                                  {opt.shortLabel}
                                </button>
                              ))}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <canvas
                      ref={nnCanvasRef}
                      id="nnCanvas"
                      width={NN_WIDTH}
                      height={NN_HEIGHT}
                      onPointerDown={(e) => {
                        if (e.button !== 0 && e.pointerType === 'mouse') return;
                        const pt = getNNCanvasPoint(e.clientX, e.clientY);
                        if (!pt) return;
                        e.currentTarget.setPointerCapture?.(e.pointerId);
                        dragBoxRef.current = { x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y };
                        setNnCursor('crosshair');
                      }}
                      onPointerMove={(e) => {
                        const pt = getNNCanvasPoint(e.clientX, e.clientY);
                        if (!pt) return;
                        if (dragBoxRef.current) {
                          dragBoxRef.current.x2 = pt.x;
                          dragBoxRef.current.y2 = pt.y;
                          return;
                        }
                        const hit = engineRef.current?.findHiddenNodeAt(pt.x, pt.y);
                        setNnCursor(hit ? 'pointer' : 'default');
                      }}
                      onPointerUp={(e) => {
                        if (dragBoxRef.current) {
                          finishNNDrag(e.clientX, e.clientY);
                        }
                      }}
                      onPointerCancel={() => {
                        dragBoxRef.current = null;
                        setNnCursor('default');
                      }}
                      onPointerLeave={() => {
                        if (!dragBoxRef.current) {
                          setNnCursor('default');
                        }
                      }}
                      className={`bg-[#000] border border-[#333] block w-full max-w-[570px] h-auto mx-auto select-none touch-none ${
                        nnCursor === 'pointer'
                          ? 'cursor-pointer'
                          : nnCursor === 'crosshair'
                          ? 'cursor-crosshair'
                          : 'cursor-default'
                      }`}
                    />
                  </div>
                )}

                {activeToolTab === 'weights' && engineRef.current && (
                  <WeightInspector
                    engine={engineRef.current}
                    tick={inspectorTick}
                    agentId={activeInspectAgent}
                    dualAgentMode={dualAgentMode}
                    splitBrainMode={splitBrainMode}
                    activeBrainIds={activeBrainIds}
                    onSelectAgent={handleSelectInspectAgent}
                    onToggleHiddenNodeFreeze={handleToggleInspectorNodeFreeze}
                  />
                )}

                {activeToolTab === 'landscape' && engineRef.current && (
                  <LossLandscapePanel
                    engine={engineRef.current}
                    mode={landscapeMode}
                    onModeChange={setLandscapeMode}
                    view={landscapeView}
                    onViewChange={setLandscapeView}
                    metric={landscapeMetric}
                    onMetricChange={setLandscapeMetric}
                    data={landscapeData}
                    activeRewardLabels={rewards
                      .filter((r) => r.active)
                      .map((r) => `${r.isPositive ? '+' : '-'}${r.weightText} ${r.label.replace(/^[+-]/, '')}`)}
                    onRescan={() => startFreshLandscapeScan()}
                    dualAgentMode={dualAgentMode}
                    splitBrainMode={splitBrainMode}
                    activeBrainIds={activeBrainIds}
                    inspectAgent={activeInspectAgent}
                    onSelectAgent={handleSelectInspectAgent}
                  />
                )}

                {activeToolTab === 'physics' && engineRef.current && (
                  <PhysicsChartsPanel
                    engine={engineRef.current}
                    agentId={activeInspectAgent}
                    dualAgentMode={dualAgentMode}
                    splitBrainMode={splitBrainMode}
                    activeBrainIds={activeBrainIds}
                    onSelectAgent={handleSelectInspectAgent}
                  />
                )}

                {activeToolTab === 'video' && (
                  <div
                    id="recordingSuitePanel"
                    className="w-full p-[6px] bg-[#161616] border border-[#2a2a2a] flex items-center justify-between gap-[8px] flex-wrap font-mono text-[11px]"
                  >
                    <div className="flex items-center gap-[10px] flex-wrap">
                      <label className="inline-flex items-center gap-[4px] cursor-pointer text-[#ddd]">
                        <input
                          id="chkRecNeuralNet"
                          type="checkbox"
                          checked={recNeuralNet}
                          disabled={isRecording}
                          onChange={(e) => setRecNeuralNet(e.target.checked)}
                          className="accent-[#0aa] cursor-pointer disabled:opacity-50"
                        />
                        Record Neural Net
                      </label>
                      <label className="inline-flex items-center gap-[4px] cursor-pointer text-[#ddd]">
                        <input
                          id="chkRecLandscape"
                          type="checkbox"
                          checked={recLossLandscape}
                          disabled={isRecording}
                          onChange={(e) => setRecLossLandscape(e.target.checked)}
                          className="accent-[#0aa] cursor-pointer disabled:opacity-50"
                        />
                        Record Loss Landscape
                      </label>
                      <label className="inline-flex items-center gap-[4px] cursor-pointer text-[#ddd]">
                        <input
                          id="chkRecTraining"
                          type="checkbox"
                          checked={recTraining}
                          disabled={isRecording}
                          onChange={(e) => setRecTraining(e.target.checked)}
                          className="accent-[#0aa] cursor-pointer disabled:opacity-50"
                        />
                        Record Training
                      </label>
                    </div>

                    <div className="flex items-center gap-[8px]">
                      {recStatus && (
                        <span className={recStatus.isError ? 'text-[#f55]' : 'text-[#0cc]'}>
                          {recStatus.text}
                        </span>
                      )}
                      {!isRecording ? (
                        <button
                          id="btnStartRec"
                          type="button"
                          disabled={!recNeuralNet && !recLossLandscape && !recTraining}
                          onClick={handleStartRecording}
                          className="bg-[#1f4f4f] hover:bg-[#276868] text-[#fff] border border-[#0aa] px-[8px] py-[3px] font-mono text-[11px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          ● Record
                        </button>
                      ) : (
                        <button
                          id="btnStopRec"
                          type="button"
                          onClick={handleStopRecording}
                          className="bg-[#7a1c1c] hover:bg-[#962222] text-[#fff] border border-[#d55] px-[8px] py-[3px] font-mono text-[11px] cursor-pointer whitespace-nowrap tabular-nums"
                        >
                          ■ Stop ({Math.floor(recElapsedSec / 60)}:
                          {String(recElapsedSec % 60).padStart(2, '0')})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {humanDemoOpen && engineRef.current && (
        <HumanDemoOverlay
          engine={engineRef.current}
          demos={humanDemos}
          layers={layers}
          neurons={neurons}
          activation={activation}
          dualAgentMode={dualAgentMode}
          splitBrainMode={splitBrainMode}
          activeBrainIds={activeBrainIds}
          targetAgent={activeInspectAgent}
          onSelectTargetAgent={handleSelectInspectAgent}
          onSaveDemo={handleSaveDemo}
          onDeleteDemo={handleDeleteDemo}
          onClearAllDemos={handleClearAllDemos}
          onDownloadAllDemos={handleDownloadAllDemos}
          onDownloadSingleDemo={handleDownloadSingleDemo}
          onImportDemosData={handleImportDemosData}
          onTrainModel={handleTrainOnDemos}
          onExit={() => {
            engineRef.current?.startEpisode();
            setHumanDemoOpen(false);
          }}
        />
      )}

      {demoTrainerOpen && !humanDemoOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-[10px]">
          <DemoLibraryPanel
            demos={humanDemos}
            layers={layers}
            neurons={neurons}
            activation={activation}
            outputConfig={
              engineRef.current ? engineRef.current.getOutputConfig(activeInspectAgent) : outputConfig
            }
            dualAgentMode={dualAgentMode}
            splitBrainMode={splitBrainMode}
            activeBrainIds={activeBrainIds}
            targetAgent={activeInspectAgent}
            onSelectTargetAgent={handleSelectInspectAgent}
            onDeleteDemo={handleDeleteDemo}
            onClearAllDemos={handleClearAllDemos}
            onDownloadAllDemos={handleDownloadAllDemos}
            onDownloadSingleDemo={handleDownloadSingleDemo}
            onImportDemosData={handleImportDemosData}
            onTrainModel={handleTrainOnDemos}
            onClose={() => setDemoTrainerOpen(false)}
          />
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
}

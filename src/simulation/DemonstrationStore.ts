import { EnemySpeedMode, SpawnMode } from './EvasionEngine';
import {
  getOutputConfigSpec,
  NeuralNetwork,
  OUTPUT_CONFIG_OPTIONS,
  OutputConfig,
} from './NeuralNetwork';

export interface DemoFrame {
  inputs: number[];
  action: number[];
}

export interface DemoEnvSummary {
  outputConfig?: OutputConfig;
  numEnemies: number;
  enemySpeedPct: number;
  enemySpeedMode: EnemySpeedMode;
  spawnMode: SpawnMode;
}

export interface HumanDemoRecording {
  id: string;
  name: string;
  createdAt: string;
  steps: number;
  fitness: number;
  hit: boolean;
  envSummary: DemoEnvSummary;
  frames: DemoFrame[];
}

export interface HumanDemoBundle {
  format: 'rl-evasion-human-demos-v1';
  exportedAt: string;
  demos: HumanDemoRecording[];
}

export interface TrainingConfig {
  epochs: number;
  learningRate: number;
  batchSize: number;
}

export interface TrainingResult {
  initialLoss: number;
  finalLoss: number;
  lossHistory: number[];
  directionAccuracyPct: number;
  totalFrames: number;
  epochsRun: number;
}

const STORAGE_KEY = 'rl_evasion_human_demos_v1';

export function loadSavedDemos(): HumanDemoRecording[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return parseDemoImportData(parsed);
  } catch {
    return [];
  }
}

export function saveDemosToStorage(demos: HumanDemoRecording[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const bundle: HumanDemoBundle = {
      format: 'rl-evasion-human-demos-v1',
      exportedAt: new Date().toISOString(),
      demos,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
    return true;
  } catch {
    return false;
  }
}

export function createDemoBundlePayload(demos: HumanDemoRecording[]): HumanDemoBundle {
  return {
    format: 'rl-evasion-human-demos-v1',
    exportedAt: new Date().toISOString(),
    demos,
  };
}

function normalizeDemoRecord(raw: unknown, fallbackIdx: number): HumanDemoRecording | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.frames) || r.frames.length === 0) return null;

  const frames: DemoFrame[] = [];
  for (const f of r.frames) {
    if (!f || typeof f !== 'object') continue;
    const fr = f as Record<string, unknown>;
    if (
      !Array.isArray(fr.inputs) ||
      (fr.inputs.length !== 104 && fr.inputs.length !== 108) ||
      !Array.isArray(fr.action) ||
      fr.action.length < 2
    ) {
      continue;
    }
    const action: number[] = [];
    for (let k = 0; k < fr.action.length; k++) {
      const val = Number(fr.action[k]);
      if (!Number.isFinite(val)) break;
      action.push(val);
    }
    if (action.length < 2) continue;
    const inputs = fr.inputs.map((v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    });
    frames.push({ inputs, action });
  }

  if (frames.length === 0) return null;

  const envRaw =
    r.envSummary && typeof r.envSummary === 'object'
      ? (r.envSummary as Record<string, unknown>)
      : {};
  const validOutputConfigs = new Set(OUTPUT_CONFIG_OPTIONS.map((o) => o.value));
  const rawOutCfg = typeof envRaw.outputConfig === 'string' ? (envRaw.outputConfig as OutputConfig) : undefined;
  const envSummary: DemoEnvSummary = {
    ...(rawOutCfg && validOutputConfigs.has(rawOutCfg) ? { outputConfig: rawOutCfg } : {}),
    numEnemies:
      typeof envRaw.numEnemies === 'number' && Number.isFinite(envRaw.numEnemies)
        ? envRaw.numEnemies
        : 3,
    enemySpeedPct:
      typeof envRaw.enemySpeedPct === 'number' && Number.isFinite(envRaw.enemySpeedPct)
        ? envRaw.enemySpeedPct
        : 80,
    enemySpeedMode: envRaw.enemySpeedMode === 'rarity' ? 'rarity' : 'fixed',
    spawnMode: envRaw.spawnMode === 'central' ? 'central' : 'outer',
  };

  return {
    id:
      typeof r.id === 'string' && r.id.trim().length > 0
        ? r.id
        : `demo-${Date.now()}-${fallbackIdx}-${Math.random().toString(36).slice(2, 7)}`,
    name:
      typeof r.name === 'string' && r.name.trim().length > 0
        ? r.name
        : `Human Demo #${fallbackIdx + 1}`,
    createdAt:
      typeof r.createdAt === 'string' && r.createdAt.length > 0
        ? r.createdAt
        : new Date().toISOString(),
    steps: frames.length,
    fitness:
      typeof r.fitness === 'number' && Number.isFinite(r.fitness) ? r.fitness : 0,
    hit: Boolean(r.hit),
    envSummary,
    frames,
  };
}

export function parseDemoImportData(data: unknown): HumanDemoRecording[] {
  if (!data) {
    throw new Error('Invalid demonstration JSON.');
  }

  let candidateList: unknown[] = [];
  if (Array.isArray(data)) {
    candidateList = data;
  } else if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.demos)) {
      candidateList = obj.demos;
    } else if (Array.isArray(obj.frames)) {
      candidateList = [obj];
    } else {
      throw new Error('JSON is missing a "demos" array or "frames" list.');
    }
  } else {
    throw new Error('Invalid demonstration JSON format.');
  }

  const parsed: HumanDemoRecording[] = [];
  for (let i = 0; i < candidateList.length; i++) {
    const item = normalizeDemoRecord(candidateList[i], i);
    if (item) parsed.push(item);
  }
  if (parsed.length === 0) {
    throw new Error('No valid demonstration frames (104 or 108 inputs + 2 actions) found.');
  }
  return parsed;
}

function mapDemoActionToTargetConfig(
  frame: DemoFrame,
  sourceConfig: OutputConfig | undefined,
  targetConfig: OutputConfig,
  outSize: number
): number[] {
  const src = sourceConfig ?? 'cartesian_2d';
  if (src === targetConfig && frame.action.length >= outSize) {
    return frame.action.slice(0, outSize);
  }

  const a0 = frame.action[0] ?? 0;
  const a1 = frame.action[1] ?? 0;
  const a2 = frame.action[2];
  const a3 = frame.action[3];
  const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

  const vxIn = frame.inputs[2] ?? 0;
  const vyIn = frame.inputs[3] ?? 0;
  const velHeading = Math.hypot(vxIn, vyIn) > 0.05 ? Math.atan2(vyIn, vxIn) : 0;

  let wx = a0;
  let wy = a1;
  if (src === 'polar_2d' || src === 'car_2d' || src === 'asteroids_2d') {
    const h = velHeading + clamp1(a0) * 0.18;
    const thrustVal = src === 'asteroids_2d' ? Math.max(0, clamp1(a1)) : clamp1(a1);
    wx = Math.cos(h) * thrustVal;
    wy = Math.sin(h) * thrustVal;
  } else if (src === 'compass_2d') {
    const h = clamp1(a0) * Math.PI;
    const spd = Math.max(0, Math.min(1, (clamp1(a1) + 1) * 0.5));
    wx = Math.cos(h) * spd;
    wy = Math.sin(h) * spd;
  } else if (src === 'etch_2d') {
    if (Math.abs(a0) >= Math.abs(a1)) {
      wx = clamp1(a0);
      wy = 0;
    } else {
      wx = 0;
      wy = clamp1(a1);
    }
  } else if (src === 'polar_3d') {
    const h = velHeading + clamp1(a0) * 0.16;
    const fx = Math.cos(h);
    const fy = Math.sin(h);
    const rx = -fy;
    const ry = fx;
    wx = fx * clamp1(a1) + rx * clamp1(a2 ?? 0);
    wy = fy * clamp1(a1) + ry * clamp1(a2 ?? 0);
  } else if (src === 'spin_frame_3d') {
    const h = velHeading + clamp1(a2 ?? 0) * 0.16;
    const cosH = Math.cos(h);
    const sinH = Math.sin(h);
    wx = clamp1(a0) * cosH - clamp1(a1) * sinH;
    wy = clamp1(a0) * sinH + clamp1(a1) * cosH;
  } else if (src === 'hybrid_4d') {
    const h = velHeading + clamp1(a2 ?? 0) * 0.16;
    wx = clamp1(a0) + Math.cos(h) * clamp1(a3 ?? 0);
    wy = clamp1(a1) + Math.sin(h) * clamp1(a3 ?? 0);
  } else if (src === 'thrusters_4d') {
    wx = Math.max(0, clamp1(a0)) - Math.max(0, clamp1(a1));
    wy = Math.max(0, clamp1(a2 ?? 0)) - Math.max(0, clamp1(a3 ?? 0));
  } else {
    wx = clamp1(a0);
    wy = clamp1(a1);
  }

  const wMag = Math.hypot(wx, wy);
  if (wMag > 1) {
    wx /= wMag;
    wy /= wMag;
  }

  if (targetConfig === 'cartesian_2d') {
    return [wx, wy];
  }

  if (targetConfig === 'etch_2d') {
    return Math.abs(wx) >= Math.abs(wy) ? [wx, 0] : [0, wy];
  }

  if (targetConfig === 'compass_2d') {
    const mag = Math.min(1, Math.hypot(wx, wy));
    if (mag <= 0.05) return [0, -1];
    return [clamp1(Math.atan2(wy, wx) / Math.PI), clamp1(mag * 2 - 1)];
  }

  if (targetConfig === 'sprint_burst' || targetConfig === 'dash_3d') {
    const mag = Math.hypot(wx, wy);
    const aux =
      (src === 'sprint_burst' || src === 'dash_3d') && typeof a2 === 'number'
        ? clamp1(a2)
        : mag > 0.92
        ? 0.55
        : -0.8;
    return [wx, wy, aux];
  }

  if (targetConfig === 'throttle_3d') {
    const mag = Math.min(1, Math.hypot(wx, wy));
    const ux = mag > 1e-4 ? wx / mag : 0;
    const uy = mag > 1e-4 ? wy / mag : 0;
    const spd = src === 'throttle_3d' && typeof a2 === 'number' ? clamp1(a2) : mag * 2 - 1;
    return [ux, uy, clamp1(spd)];
  }

  if (targetConfig === 'drift_3d') {
    const grip = src === 'drift_3d' && typeof a2 === 'number' ? clamp1(a2) : 0.75;
    return [wx, wy, grip];
  }

  if (targetConfig === 'thrusters_4d') {
    return [
      wx > 0 ? wx : -0.5,
      wx < 0 ? -wx : -0.5,
      wy > 0 ? wy : -0.5,
      wy < 0 ? -wy : -0.5,
    ];
  }

  const mag = Math.min(1, Math.hypot(wx, wy));
  const heading = Math.hypot(vxIn, vyIn) > 0.05 ? velHeading : Math.atan2(wy, wx);
  let turn = 0;
  let thrust = 0;
  let strafe = 0;
  let lx = 0;
  let ly = 0;
  if (mag > 0.05) {
    let diff = Math.atan2(wy, wx) - heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    turn = clamp1(diff / 0.32);
    const fx = Math.cos(heading);
    const fy = Math.sin(heading);
    const rx = -fy;
    const ry = fx;
    thrust = clamp1(wx * fx + wy * fy);
    strafe = clamp1(wx * rx + wy * ry);
    lx = clamp1(wx * fx + wy * fy);
    ly = clamp1(-wx * fy + wy * fx);
  }

  if (targetConfig === 'polar_2d') {
    return [turn, thrust];
  }
  if (targetConfig === 'car_2d') {
    if (mag <= 0.05) return [0, 0];
    let diff = Math.atan2(wy, wx) - heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.cos(diff) >= -0.25) {
      return [clamp1(diff / 0.32), mag];
    }
    let revDiff = Math.atan2(wy, wx) - (heading + Math.PI);
    while (revDiff > Math.PI) revDiff -= Math.PI * 2;
    while (revDiff < -Math.PI) revDiff += Math.PI * 2;
    return [clamp1(-revDiff / 0.32), -mag];
  }
  if (targetConfig === 'asteroids_2d') {
    if (mag <= 0.05) return [0, 0];
    let diff = Math.atan2(wy, wx) - heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const align = Math.cos(diff);
    return [turn, align > 0.15 ? clamp1(mag * align) : 0];
  }
  if (targetConfig === 'spin_frame_3d') {
    return [lx, ly, turn];
  }
  if (targetConfig === 'hybrid_4d') {
    return [wx * 0.65, wy * 0.65, turn, thrust * 0.65];
  }
  return [turn, thrust, strafe];
}

export function trainNetworkOnDemos(
  baseNet: NeuralNetwork,
  demos: HumanDemoRecording[],
  config: TrainingConfig = { epochs: 40, learningRate: 0.004, batchSize: 64 },
  targetOutputConfig: OutputConfig = 'cartesian_2d'
): { network: NeuralNetwork; result: TrainingResult } {
  const allFrames: { inputs: number[]; target: number[] }[] = [];
  const targetOutSize = getOutputConfigSpec(targetOutputConfig).outputSize;
  for (const demo of demos) {
    for (const f of demo.frames) {
      const paddedInputs =
        f.inputs.length === 108
          ? f.inputs
          : f.inputs.length < 108
          ? [...f.inputs, ...new Array<number>(108 - f.inputs.length).fill(0)]
          : f.inputs.slice(0, 108);
      allFrames.push({
        inputs: paddedInputs,
        target: mapDemoActionToTargetConfig(f, demo.envSummary.outputConfig, targetOutputConfig, targetOutSize),
      });
    }
  }

  if (allFrames.length === 0) {
    throw new Error('No recorded frames available for training.');
  }

  const net = baseNet.clone();
  if (net.getInputSize() !== 108) {
    net.resizeInputSize(108);
  }
  if (net.getOutputSize() !== targetOutSize) {
    net.resizeOutputSize(targetOutSize, false);
  }
  const outSize = net.getOutputSize();
  const numLayers = net.weights.length;

  // Adam optimizer moment buffers
  const mW: number[][][] = net.weights.map((l) => l.map((r) => r.map(() => 0)));
  const vW: number[][][] = net.weights.map((l) => l.map((r) => r.map(() => 0)));
  const mB: number[][] = net.biases.map((l) => l.map(() => 0));
  const vB: number[][] = net.biases.map((l) => l.map(() => 0));

  const gradW: number[][][] = net.weights.map((l) => l.map((r) => r.map(() => 0)));
  const gradB: number[][] = net.biases.map((l) => l.map(() => 0));

  const dirIndices: [number, number] = targetOutputConfig === 'polar_3d' ? [1, 2] : [0, 1];

  const evalDataset = (): { mse: number; dirAccPct: number } => {
    let totalSq = 0;
    let dirMatch = 0;
    let movingFrames = 0;

    for (const f of allFrames) {
      const out = net.forwardOnly(f.inputs);
      let sq = 0;
      for (let k = 0; k < outSize; k++) {
        const d = (out[k] ?? 0) - (f.target[k] ?? 0);
        sq += d * d;
      }
      totalSq += sq / outSize;

      let t0 = 0;
      let t1 = 0;
      let p0 = 0;
      let p1 = 0;
      if (targetOutputConfig === 'thrusters_4d') {
        t0 = Math.max(0, f.target[0] ?? 0) - Math.max(0, f.target[1] ?? 0);
        t1 = Math.max(0, f.target[2] ?? 0) - Math.max(0, f.target[3] ?? 0);
        p0 = Math.max(0, out[0] ?? 0) - Math.max(0, out[1] ?? 0);
        p1 = Math.max(0, out[2] ?? 0) - Math.max(0, out[3] ?? 0);
      } else if (targetOutputConfig === 'compass_2d') {
        const tSpd = Math.max(0, ((f.target[1] ?? -1) + 1) * 0.5);
        const pSpd = Math.max(0, ((out[1] ?? -1) + 1) * 0.5);
        const tAng = (f.target[0] ?? 0) * Math.PI;
        const pAng = (out[0] ?? 0) * Math.PI;
        t0 = Math.cos(tAng) * tSpd;
        t1 = Math.sin(tAng) * tSpd;
        p0 = Math.cos(pAng) * pSpd;
        p1 = Math.sin(pAng) * pSpd;
      } else {
        const [i0, i1] = dirIndices;
        t0 = f.target[i0] ?? 0;
        t1 = f.target[i1] ?? 0;
        p0 = out[i0] ?? 0;
        p1 = out[i1] ?? 0;
      }
      const tMag = Math.hypot(t0, t1);
      const pMag = Math.hypot(p0, p1);
      if (tMag > 0.15) {
        movingFrames++;
        if (pMag > 0.08) {
          const cos = (p0 * t0 + p1 * t1) / (pMag * tMag);
          if (cos >= 0.7) dirMatch++;
        }
      } else {
        movingFrames++;
        if (pMag <= 0.35) dirMatch++;
      }
    }

    return {
      mse: totalSq / allFrames.length,
      dirAccPct: movingFrames > 0 ? (dirMatch / movingFrames) * 100 : 100,
    };
  };

  const initialEval = evalDataset();
  const lossHistory: number[] = [initialEval.mse];

  const epochs = Math.max(1, Math.min(200, Math.round(config.epochs)));
  const lr = Math.max(0.0001, Math.min(0.05, config.learningRate));
  const batchSize = Math.max(8, Math.min(256, Math.round(config.batchSize)));

  const beta1 = 0.9;
  const beta2 = 0.999;
  const eps = 1e-8;
  let adamStep = 0;

  const indices = allFrames.map((_, i) => i);

  for (let epoch = 0; epoch < epochs; epoch++) {
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }

    let epochLoss = 0;

    for (let start = 0; start < indices.length; start += batchSize) {
      const end = Math.min(indices.length, start + batchSize);
      const bCount = end - start;
      if (bCount <= 0) continue;

      // Zero gradients
      for (let l = 0; l < numLayers; l++) {
        for (let i = 0; i < gradW[l].length; i++) {
          gradB[l][i] = 0;
          gradW[l][i].fill(0);
        }
      }

      for (let bi = start; bi < end; bi++) {
        const frame = allFrames[indices[bi]];

        // Forward pass storing pre-activations z and post-activations a
        const activations: number[][] = [frame.inputs];
        const preActs: number[][] = [];
        let curr = frame.inputs;

        for (let l = 0; l < numLayers; l++) {
          const isOutput = l === numLayers - 1;
          const zVec: number[] = new Array(net.weights[l].length);
          const aVec: number[] = new Array(net.weights[l].length);

          for (let i = 0; i < net.weights[l].length; i++) {
            let sum = net.biases[l][i];
            const wRow = net.weights[l][i];
            for (let j = 0; j < curr.length; j++) {
              sum += wRow[j] * curr[j];
            }
            zVec[i] = sum;
            aVec[i] = isOutput ? Math.tanh(sum) : net.activate(sum);
          }

          preActs.push(zVec);
          activations.push(aVec);
          curr = aVec;
        }

        const pred = activations[numLayers];
        let deltas: number[] = new Array<number>(outSize);
        let sampleSq = 0;
        for (let k = 0; k < outSize; k++) {
          const p = pred[k] ?? 0;
          const err = p - (frame.target[k] ?? 0);
          sampleSq += err * err;
          deltas[k] = err * (1 - p * p);
        }
        epochLoss += sampleSq / outSize;

        for (let l = numLayers - 1; l >= 0; l--) {
          const prevAct = activations[l];
          for (let i = 0; i < net.weights[l].length; i++) {
            const d = Math.max(-5, Math.min(5, deltas[i]));
            gradB[l][i] += d;
            const gRow = gradW[l][i];
            for (let j = 0; j < prevAct.length; j++) {
              gRow[j] += d * prevAct[j];
            }
          }

          if (l > 0) {
            const nextDeltas = new Array<number>(prevAct.length).fill(0);
            for (let i = 0; i < net.weights[l].length; i++) {
              const d = Math.max(-5, Math.min(5, deltas[i]));
              const wRow = net.weights[l][i];
              for (let j = 0; j < prevAct.length; j++) {
                nextDeltas[j] += wRow[j] * d;
              }
            }
            const zPrev = preActs[l - 1];
            const aPrev = activations[l];
            for (let j = 0; j < prevAct.length; j++) {
              nextDeltas[j] *= net.activateDerivative(zPrev[j], aPrev[j]);
            }
            deltas = nextDeltas;
          }
        }
      }

      // Adam parameter update (respecting frozen weights & biases)
      adamStep++;
      const bc1 = 1 - Math.pow(beta1, adamStep);
      const bc2 = 1 - Math.pow(beta2, adamStep);
      const invBatch = 1 / bCount;

      for (let l = 0; l < numLayers; l++) {
        for (let i = 0; i < net.weights[l].length; i++) {
          if (!net.frozenBiases[l]?.[i]) {
            const gb = gradB[l][i] * invBatch;
            mB[l][i] = beta1 * mB[l][i] + (1 - beta1) * gb;
            vB[l][i] = beta2 * vB[l][i] + (1 - beta2) * gb * gb;
            const mHat = mB[l][i] / bc1;
            const vHat = vB[l][i] / bc2;
            net.biases[l][i] -= (lr * mHat) / (Math.sqrt(vHat) + eps);
          }

          for (let j = 0; j < net.weights[l][i].length; j++) {
            if (net.frozenWeights[l]?.[i]?.[j]) continue;
            const gw = gradW[l][i][j] * invBatch;
            mW[l][i][j] = beta1 * mW[l][i][j] + (1 - beta1) * gw;
            vW[l][i][j] = beta2 * vW[l][i][j] + (1 - beta2) * gw * gw;
            const mHat = mW[l][i][j] / bc1;
            const vHat = vW[l][i][j] / bc2;
            net.weights[l][i][j] -= (lr * mHat) / (Math.sqrt(vHat) + eps);
          }
        }
      }
    }

    lossHistory.push(epochLoss / allFrames.length);
  }

  const finalEval = evalDataset();
  return {
    network: net,
    result: {
      initialLoss: initialEval.mse,
      finalLoss: finalEval.mse,
      lossHistory,
      directionAccuracyPct: finalEval.dirAccPct,
      totalFrames: allFrames.length,
      epochsRun: epochs,
    },
  };
}

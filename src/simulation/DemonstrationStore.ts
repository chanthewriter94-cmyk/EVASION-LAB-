import { EnemySpeedMode, SimMode, SpawnMode } from './EvasionEngine';
import { NeuralNetwork } from './NeuralNetwork';

export interface DemoFrame {
  inputs: number[];
  action: [number, number];
}

export interface DemoEnvSummary {
  simMode?: SimMode;
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
    if (!Array.isArray(fr.inputs) || fr.inputs.length !== 104 || !Array.isArray(fr.action) || fr.action.length < 2) {
      continue;
    }
    const ax = Number(fr.action[0]);
    const ay = Number(fr.action[1]);
    if (!Number.isFinite(ax) || !Number.isFinite(ay)) continue;
    const inputs = fr.inputs.map((v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    });
    frames.push({ inputs, action: [ax, ay] });
  }

  if (frames.length === 0) return null;

  const envRaw =
    r.envSummary && typeof r.envSummary === 'object'
      ? (r.envSummary as Record<string, unknown>)
      : {};
  const envSummary: DemoEnvSummary = {
    simMode: envRaw.simMode === 'restaurant' ? 'restaurant' : 'evasion',
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
    throw new Error('No valid demonstration frames (104 inputs + 2 actions) found.');
  }
  return parsed;
}

export function trainNetworkOnDemos(
  baseNet: NeuralNetwork,
  demos: HumanDemoRecording[],
  config: TrainingConfig = { epochs: 40, learningRate: 0.004, batchSize: 64 }
): { network: NeuralNetwork; result: TrainingResult } {
  const allFrames: DemoFrame[] = [];
  for (const demo of demos) {
    for (const f of demo.frames) {
      allFrames.push(f);
    }
  }

  if (allFrames.length === 0) {
    throw new Error('No recorded frames available for training.');
  }

  const net = baseNet.clone();
  const numLayers = net.weights.length;

  // Adam optimizer moment buffers
  const mW: number[][][] = net.weights.map((l) => l.map((r) => r.map(() => 0)));
  const vW: number[][][] = net.weights.map((l) => l.map((r) => r.map(() => 0)));
  const mB: number[][] = net.biases.map((l) => l.map(() => 0));
  const vB: number[][] = net.biases.map((l) => l.map(() => 0));

  const gradW: number[][][] = net.weights.map((l) => l.map((r) => r.map(() => 0)));
  const gradB: number[][] = net.biases.map((l) => l.map(() => 0));

  const evalDataset = (): { mse: number; dirAccPct: number } => {
    let totalSq = 0;
    let dirMatch = 0;
    let movingFrames = 0;

    for (const f of allFrames) {
      const out = net.forwardOnly(f.inputs);
      const dx = out[0] - f.action[0];
      const dy = out[1] - f.action[1];
      totalSq += 0.5 * (dx * dx + dy * dy);

      const tMag = Math.hypot(f.action[0], f.action[1]);
      const pMag = Math.hypot(out[0], out[1]);
      if (tMag > 0.15) {
        movingFrames++;
        if (pMag > 0.08) {
          const cos = (out[0] * f.action[0] + out[1] * f.action[1]) / (pMag * tMag);
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
        const err0 = pred[0] - frame.action[0];
        const err1 = pred[1] - frame.action[1];
        epochLoss += 0.5 * (err0 * err0 + err1 * err1);

        // Output delta (MSE wrt tanh output)
        let deltas: number[] = [
          err0 * (1 - pred[0] * pred[0]),
          err1 * (1 - pred[1] * pred[1]),
        ];

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

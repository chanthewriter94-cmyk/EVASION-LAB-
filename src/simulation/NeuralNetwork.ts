export type ActivationType =
  | 'linear'
  | 'relu'
  | 'leaky_relu'
  | 'elu'
  | 'selu'
  | 'gelu'
  | 'swish'
  | 'mish'
  | 'softplus'
  | 'softsign'
  | 'tanh'
  | 'sigmoid'
  | 'hard_sigmoid'
  | 'hard_tanh'
  | 'step'
  | 'gaussian'
  | 'sin'
  | 'cos';

export const ACTIVATION_OPTIONS: { value: ActivationType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'relu', label: 'ReLU' },
  { value: 'leaky_relu', label: 'Leaky ReLU' },
  { value: 'elu', label: 'ELU' },
  { value: 'selu', label: 'SELU' },
  { value: 'gelu', label: 'GELU' },
  { value: 'swish', label: 'Swish / SiLU' },
  { value: 'mish', label: 'Mish' },
  { value: 'softplus', label: 'Softplus' },
  { value: 'softsign', label: 'Softsign' },
  { value: 'tanh', label: 'Tanh' },
  { value: 'sigmoid', label: 'Sigmoid' },
  { value: 'hard_sigmoid', label: 'Hard Sigmoid' },
  { value: 'hard_tanh', label: 'Hard Tanh' },
  { value: 'step', label: 'Step' },
  { value: 'gaussian', label: 'Gaussian' },
  { value: 'sin', label: 'Sin' },
  { value: 'cos', label: 'Cos' },
];

export type OutputConfig =
  | 'cartesian_2d'
  | 'polar_2d'
  | 'car_2d'
  | 'asteroids_2d'
  | 'compass_2d'
  | 'etch_2d'
  | 'sprint_burst'
  | 'dash_3d'
  | 'throttle_3d'
  | 'drift_3d'
  | 'polar_3d'
  | 'spin_frame_3d'
  | 'hybrid_4d'
  | 'thrusters_4d';

export interface OutputConfigSpec {
  value: OutputConfig;
  label: string;
  shortLabel: string;
  outputSize: number;
  nodeLabels: string[];
  description: string;
}

export const OUTPUT_CONFIG_OPTIONS: OutputConfigSpec[] = [
  {
    value: 'cartesian_2d',
    label: '2-Out: vx, vy',
    shortLabel: '2-Out (vx,vy)',
    outputSize: 2,
    nodeLabels: ['vx', 'vy'],
    description: 'vx · vy — standard unit-clamped velocity',
  },
  {
    value: 'polar_2d',
    label: '2-Out: turn, thrust',
    shortLabel: '2-Out (Polar)',
    outputSize: 2,
    nodeLabels: ['turn', 'thrust'],
    description: 'turn · thrust — pure unicycle steering (360° arcs on 1 neuron)',
  },
  {
    value: 'car_2d',
    label: '2-Out: steer, gas (Car)',
    shortLabel: '2-Out (Car)',
    outputSize: 2,
    nodeLabels: ['steer', 'gas'],
    description: 'steer · gas — Ackermann car (speed-gated turns + reverse gear)',
  },
  {
    value: 'asteroids_2d',
    label: '2-Out: turn, boost (Space)',
    shortLabel: '2-Out (Asteroids)',
    outputSize: 2,
    nodeLabels: ['turn', 'boost'],
    description: 'turn · boost — Newtonian inertia & coasting forward thruster',
  },
  {
    value: 'compass_2d',
    label: '2-Out: angle, speed',
    shortLabel: '2-Out (Compass)',
    outputSize: 2,
    nodeLabels: ['angle', 'speed'],
    description: 'angle · speed — direct -180°..+180° heading sweep + throttle',
  },
  {
    value: 'etch_2d',
    label: '2-Out: etch x, y',
    shortLabel: '2-Out (Etch)',
    outputSize: 2,
    nodeLabels: ['etchX', 'etchY'],
    description: 'etchX · etchY — Etch-A-Sketch dominant-axis orthogonal lock',
  },
  {
    value: 'sprint_burst',
    label: '3-Out: vx, vy, sprint',
    shortLabel: '3-Out (Sprint)',
    outputSize: 3,
    nodeLabels: ['vx', 'vy', 'sprint'],
    description: 'vx · vy · sprint — stamina-gated 1.45x burst',
  },
  {
    value: 'dash_3d',
    label: '3-Out: vx, vy, burst (Dash)',
    shortLabel: '3-Out (Dash)',
    outputSize: 3,
    nodeLabels: ['vx', 'vy', 'burst'],
    description: 'vx · vy · burst — discrete 2.15x impulse dash with recharge',
  },
  {
    value: 'throttle_3d',
    label: '3-Out: dx, dy, speed',
    shortLabel: '3-Out (Throttle)',
    outputSize: 3,
    nodeLabels: ['dx', 'dy', 'spd'],
    description: 'dx · dy · spd — independent heading & 0-100% speed',
  },
  {
    value: 'drift_3d',
    label: '3-Out: vx, vy, grip',
    shortLabel: '3-Out (Drift)',
    outputSize: 3,
    nodeLabels: ['vx', 'vy', 'grip'],
    description: 'vx · vy · grip — icy glide to crisp cut blend',
  },
  {
    value: 'polar_3d',
    label: '3-Out: turn, thrust, strafe',
    shortLabel: '3-Out (Polar+Strafe)',
    outputSize: 3,
    nodeLabels: ['turn', 'thrust', 'strafe'],
    description: 'turn · thrust · strafe — body-frame 360° steering',
  },
  {
    value: 'spin_frame_3d',
    label: '3-Out: vx, vy, turn',
    shortLabel: '3-Out (SpinFrame)',
    outputSize: 3,
    nodeLabels: ['vx', 'vy', 'turn'],
    description: 'vx · vy · turn — body-rotated vector steered by turn rate',
  },
  {
    value: 'hybrid_4d',
    label: '4-Out: vx, vy, turn, thrust',
    shortLabel: '4-Out (Hybrid)',
    outputSize: 4,
    nodeLabels: ['vx', 'vy', 'turn', 'thrust'],
    description: 'vx · vy + turn · thrust — world vector blended with polar steering',
  },
  {
    value: 'thrusters_4d',
    label: '4-Out: +x, -x, +y, -y',
    shortLabel: '4-Out (Thrusters)',
    outputSize: 4,
    nodeLabels: ['+x', '-x', '+y', '-y'],
    description: '+x · -x · +y · -y — four rectified cardinal thrusters',
  },
];

export function getOutputConfigSpec(config?: OutputConfig): OutputConfigSpec {
  return (
    OUTPUT_CONFIG_OPTIONS.find((opt) => opt.value === config) ?? OUTPUT_CONFIG_OPTIONS[0]
  );
}

export class NeuralNetwork {
  weights: number[][][] = [];
  biases: number[][] = [];
  frozenWeights: boolean[][][] = [];
  frozenBiases: boolean[][] = [];
  layerValues: number[][] = [];
  activation: ActivationType;
  fitness = -Infinity;

  constructor(
    inputSize: number,
    hiddenLayers: number,
    neurons: number,
    outputSize: number,
    activation: ActivationType
  ) {
    this.activation = activation;

    if (inputSize > 0) {
      let prevSize = inputSize;
      for (let i = 0; i < hiddenLayers; i++) {
        this.weights.push(this.randomMatrix(neurons, prevSize));
        this.biases.push(this.randomVector(neurons));
        this.frozenWeights.push(this.boolMatrix(neurons, prevSize, false));
        this.frozenBiases.push(this.boolVector(neurons, false));
        prevSize = neurons;
      }
      this.weights.push(this.randomMatrix(outputSize, prevSize));
      this.biases.push(this.randomVector(outputSize));
      this.frozenWeights.push(this.boolMatrix(outputSize, prevSize, false));
      this.frozenBiases.push(this.boolVector(outputSize, false));
    }
  }

  private randomMatrix(rows: number, cols: number): number[][] {
    const m: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push((Math.random() * 2 - 1) * Math.sqrt(2 / cols));
      }
      m.push(row);
    }
    return m;
  }

  private randomVector(size: number): number[] {
    const v: number[] = [];
    for (let i = 0; i < size; i++) v.push(0);
    return v;
  }

  private boolMatrix(rows: number, cols: number, value: boolean): boolean[][] {
    const m: boolean[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: boolean[] = [];
      for (let j = 0; j < cols; j++) row.push(value);
      m.push(row);
    }
    return m;
  }

  private boolVector(size: number, value: boolean): boolean[] {
    const v: boolean[] = [];
    for (let i = 0; i < size; i++) v.push(value);
    return v;
  }

  activate(x: number): number {
    switch (this.activation) {
      case 'linear':
        return x;
      case 'relu':
        return Math.max(0, x);
      case 'leaky_relu':
        return x > 0 ? x : 0.01 * x;
      case 'elu':
        return x >= 0 ? x : Math.exp(x) - 1;
      case 'selu': {
        const alpha = 1.6732632423543772;
        const scale = 1.0507009873554805;
        return scale * (x >= 0 ? x : alpha * (Math.exp(x) - 1));
      }
      case 'gelu':
        return (
          0.5 *
          x *
          (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))))
        );
      case 'swish':
        return x / (1 + Math.exp(-x));
      case 'mish': {
        const sp = x > 20 ? x : Math.log1p(Math.exp(x));
        return x * Math.tanh(sp);
      }
      case 'softplus':
        return x > 20 ? x : Math.log1p(Math.exp(x));
      case 'softsign':
        return x / (1 + Math.abs(x));
      case 'tanh':
        return Math.tanh(x);
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'hard_sigmoid':
        return Math.max(0, Math.min(1, 0.2 * x + 0.5));
      case 'hard_tanh':
        return Math.max(-1, Math.min(1, x));
      case 'step':
        return x >= 0 ? 1 : 0;
      case 'gaussian':
        return Math.exp(-(x * x));
      case 'sin':
        return Math.sin(x);
      case 'cos':
        return Math.cos(x);
      default:
        return x;
    }
  }

  activateDerivative(z: number, activated: number): number {
    switch (this.activation) {
      case 'linear':
        return 1;
      case 'relu':
        return z > 0 ? 1 : 0;
      case 'leaky_relu':
        return z > 0 ? 1 : 0.01;
      case 'elu':
        return z >= 0 ? 1 : activated + 1;
      case 'selu': {
        const alpha = 1.6732632423543772;
        const scale = 1.0507009873554805;
        return z >= 0 ? scale : scale * alpha * Math.exp(z);
      }
      case 'gelu': {
        const c = Math.sqrt(2 / Math.PI);
        const u = c * (z + 0.044715 * z * z * z);
        const th = Math.tanh(u);
        const sech2 = 1 - th * th;
        const du = c * (1 + 3 * 0.044715 * z * z);
        return 0.5 * (1 + th) + 0.5 * z * sech2 * du;
      }
      case 'swish': {
        const sig = 1 / (1 + Math.exp(-z));
        return sig + z * sig * (1 - sig);
      }
      case 'mish': {
        const sp = z > 20 ? z : Math.log1p(Math.exp(z));
        const th = Math.tanh(sp);
        const sig = 1 / (1 + Math.exp(-z));
        return th + z * sig * (1 - th * th);
      }
      case 'softplus':
        return 1 / (1 + Math.exp(-z));
      case 'softsign': {
        const denom = 1 + Math.abs(z);
        return 1 / (denom * denom);
      }
      case 'tanh':
        return 1 - activated * activated;
      case 'sigmoid':
        return activated * (1 - activated);
      case 'hard_sigmoid': {
        const v = 0.2 * z + 0.5;
        return v > 0 && v < 1 ? 0.2 : 0;
      }
      case 'hard_tanh':
        return z > -1 && z < 1 ? 1 : 0;
      case 'step':
        return Math.abs(z) <= 1 ? 0.5 : 0.05;
      case 'gaussian':
        return -2 * z * activated;
      case 'sin':
        return Math.cos(z);
      case 'cos':
        return -Math.sin(z);
      default:
        return 1;
    }
  }

  predict(inputs: number[]): number[] {
    this.layerValues = [inputs.slice()];
    let current = inputs;
    for (let l = 0; l < this.weights.length; l++) {
      const next: number[] = [];
      const isOutput = l === this.weights.length - 1;
      for (let i = 0; i < this.weights[l].length; i++) {
        let sum = this.biases[l][i];
        for (let j = 0; j < current.length; j++) {
          sum += this.weights[l][i][j] * current[j];
        }
        next.push(isOutput ? Math.tanh(sum) : this.activate(sum));
      }
      this.layerValues.push(next.slice());
      current = next;
    }
    return current;
  }

  forwardOnly(inputs: number[]): number[] {
    let current = inputs;
    for (let l = 0; l < this.weights.length; l++) {
      const next: number[] = [];
      const isOutput = l === this.weights.length - 1;
      for (let i = 0; i < this.weights[l].length; i++) {
        let sum = this.biases[l][i];
        for (let j = 0; j < current.length; j++) {
          sum += this.weights[l][i][j] * current[j];
        }
        next.push(isOutput ? Math.tanh(sum) : this.activate(sum));
      }
      current = next;
    }
    return current;
  }

  mutate(rate = 0.1): void {
    for (let l = 0; l < this.weights.length; l++) {
      for (let i = 0; i < this.weights[l].length; i++) {
        if (!this.frozenBiases[l]?.[i] && Math.random() < rate) {
          this.biases[l][i] += (Math.random() * 2 - 1) * 0.5;
        }
        for (let j = 0; j < this.weights[l][i].length; j++) {
          if (!this.frozenWeights[l]?.[i]?.[j] && Math.random() < rate) {
            this.weights[l][i][j] += (Math.random() * 2 - 1) * 0.5;
          }
        }
      }
    }
  }

  clone(): NeuralNetwork {
    const copy = new NeuralNetwork(0, 0, 0, 0, this.activation);
    copy.weights = JSON.parse(JSON.stringify(this.weights)) as number[][][];
    copy.biases = JSON.parse(JSON.stringify(this.biases)) as number[][];
    copy.frozenWeights = JSON.parse(JSON.stringify(this.frozenWeights)) as boolean[][][];
    copy.frozenBiases = JSON.parse(JSON.stringify(this.frozenBiases)) as boolean[][];
    return copy;
  }

  freezeAll(): void {
    this.freezeHiddenAll();
  }

  freezeHiddenAll(): void {
    const hiddenCount = this.weights.length - 1;
    this.frozenWeights = this.weights.map((layer, l) =>
      layer.map((row) => row.map(() => l < hiddenCount))
    );
    this.frozenBiases = this.biases.map((layer, l) =>
      layer.map(() => l < hiddenCount)
    );
  }

  unfreezeAll(): void {
    this.frozenWeights = this.weights.map((layer) =>
      layer.map((row) => row.map(() => false))
    );
    this.frozenBiases = this.biases.map((layer) => layer.map(() => false));
  }

  setHiddenNodeFrozen(hiddenLayerIdx: number, nodeIdx: number, frozen: boolean): void {
    if (hiddenLayerIdx < 0 || hiddenLayerIdx >= this.weights.length - 1) return;
    if (nodeIdx < 0 || nodeIdx >= this.weights[hiddenLayerIdx].length) return;
    if (!this.frozenBiases[hiddenLayerIdx]) return;
    this.frozenBiases[hiddenLayerIdx][nodeIdx] = frozen;
    const row = this.frozenWeights[hiddenLayerIdx]?.[nodeIdx];
    if (row) {
      for (let c = 0; c < row.length; c++) {
        row[c] = frozen;
      }
    }
  }

  getFrozenHiddenMask(): boolean[][] {
    const mask: boolean[][] = [];
    for (let h = 0; h < this.weights.length - 1; h++) {
      mask.push(
        this.weights[h].map((_, i) => Boolean(this.frozenBiases[h]?.[i]))
      );
    }
    return mask;
  }

  applyFrozenHiddenMask(mask: unknown): void {
    if (!Array.isArray(mask)) return;
    this.unfreezeAll();
    const hiddenCount = this.weights.length - 1;
    for (let h = 0; h < hiddenCount; h++) {
      const layerMask = mask[h];
      if (!Array.isArray(layerMask)) continue;
      for (let i = 0; i < this.weights[h].length; i++) {
        if (Boolean(layerMask[i])) {
          this.setHiddenNodeFrozen(h, i, true);
        }
      }
    }
  }

  getMinimumFrozenDimensions(): { minLayers: number; minNeurons: number } {
    let minLayers = 1;
    let minNeurons = 1;
    for (let h = 0; h < this.weights.length - 1; h++) {
      let frozenInLayer = 0;
      for (let i = 0; i < this.weights[h].length; i++) {
        if (this.frozenBiases[h]?.[i]) {
          frozenInLayer++;
        }
      }
      if (frozenInLayer > 0) {
        minLayers = Math.max(minLayers, h + 1);
        minNeurons = Math.max(minNeurons, frozenInLayer);
      }
    }
    return { minLayers, minNeurons };
  }

  hasFrozenWeights(): boolean {
    const hiddenCount = Math.max(0, this.weights.length - 1);
    for (let l = 0; l < hiddenCount; l++) {
      for (let i = 0; i < (this.frozenBiases[l]?.length ?? 0); i++) {
        if (this.frozenBiases[l][i]) return true;
      }
    }
    return false;
  }

  expandFrozen(
    targetHiddenLayers: number,
    targetNeurons: number,
    activation: ActivationType,
    preserveEliteOutput: boolean
  ): void {
    this.resize(targetHiddenLayers, targetNeurons, activation, preserveEliteOutput, true);
  }

  resize(
    targetHiddenLayers: number,
    targetNeurons: number,
    activation: ActivationType,
    preserveEliteOutput: boolean,
    freezeExisting: boolean
  ): void {
    this.activation = activation;
    if (freezeExisting && !this.hasFrozenWeights()) {
      this.freezeHiddenAll();
    }

    const oldHiddenCount = this.weights.length - 1;
    let prevSize = this.weights[0]?.[0]?.length ?? 108;

    for (let h = 0; h < oldHiddenCount; h++) {
      const oldCount = this.weights[h].length;
      if (targetNeurons > oldCount) {
        const addedCount = targetNeurons - oldCount;
        for (let k = 0; k < addedCount; k++) {
          const newRow: number[] = [];
          const newFrozenRow: boolean[] = [];
          for (let j = 0; j < prevSize; j++) {
            newRow.push((Math.random() * 2 - 1) * Math.sqrt(2 / prevSize));
            newFrozenRow.push(false);
          }
          this.weights[h].push(newRow);
          this.biases[h].push(0);
          this.frozenWeights[h].push(newFrozenRow);
          this.frozenBiases[h].push(false);
        }

        const isNextOutput = h + 1 === this.weights.length - 1;
        for (let r = 0; r < this.weights[h + 1].length; r++) {
          const isRowFrozen = Boolean(this.frozenBiases[h + 1]?.[r]);
          for (let k = 0; k < addedCount; k++) {
            if (isNextOutput) {
              const initW = preserveEliteOutput ? 0 : (Math.random() * 2 - 1) * 0.15;
              this.weights[h + 1][r].push(initW);
              this.frozenWeights[h + 1][r].push(false);
            } else {
              const initW =
                isRowFrozen || preserveEliteOutput ? 0 : (Math.random() * 2 - 1) * 0.15;
              this.weights[h + 1][r].push(initW);
              this.frozenWeights[h + 1][r].push(isRowFrozen);
            }
          }
        }
      } else if (targetNeurons < oldCount) {
        while (this.weights[h].length > targetNeurons && this.weights[h].length > 1) {
          const pruned = this.pruneNode('least', h);
          if (!pruned) break;
        }
      }
      prevSize = this.weights[h].length;
    }

    if (targetHiddenLayers > oldHiddenCount) {
      const preservedOutSize = this.getOutputSize();
      this.weights.pop();
      this.biases.pop();
      this.frozenWeights.pop();
      this.frozenBiases.pop();

      for (let h = oldHiddenCount; h < targetHiddenLayers; h++) {
        this.weights.push(this.randomMatrix(targetNeurons, prevSize));
        this.biases.push(this.randomVector(targetNeurons));
        this.frozenWeights.push(this.boolMatrix(targetNeurons, prevSize, false));
        this.frozenBiases.push(this.boolVector(targetNeurons, false));
        prevSize = targetNeurons;
      }

      this.weights.push(this.randomMatrix(preservedOutSize, prevSize));
      this.biases.push(this.randomVector(preservedOutSize));
      this.frozenWeights.push(this.boolMatrix(preservedOutSize, prevSize, false));
      this.frozenBiases.push(this.boolVector(preservedOutSize, false));
    } else if (
      targetHiddenLayers < oldHiddenCount &&
      (!freezeExisting || targetHiddenLayers >= this.getMinimumFrozenDimensions().minLayers)
    ) {
      const outW = this.weights.pop()!;
      const outB = this.biases.pop()!;
      const outFW = this.frozenWeights.pop()!;
      const outFB = this.frozenBiases.pop()!;

      while (this.weights.length > targetHiddenLayers) {
        this.weights.pop();
        this.biases.pop();
        this.frozenWeights.pop();
        this.frozenBiases.pop();
      }

      const lastHiddenSize = this.weights[this.weights.length - 1].length;
      const resizedOutW = outW.map((row) => {
        const nextRow = row.slice(0, lastHiddenSize);
        while (nextRow.length < lastHiddenSize) {
          nextRow.push(0);
        }
        return nextRow;
      });
      const resizedOutFW = outFW.map((row) => {
        const nextRow = row.slice(0, lastHiddenSize);
        while (nextRow.length < lastHiddenSize) {
          nextRow.push(false);
        }
        return nextRow;
      });

      this.weights.push(resizedOutW);
      this.biases.push(outB);
      this.frozenWeights.push(resizedOutFW);
      this.frozenBiases.push(outFB);
      if (this.layerValues.length > targetHiddenLayers + 2) {
        this.layerValues = this.layerValues.slice(0, targetHiddenLayers + 2);
      }
    }
  }

  getOutputSize(): number {
    const outLayer = this.weights[this.weights.length - 1];
    return outLayer ? outLayer.length : 2;
  }

  resizeOutputSize(targetOutputSize: number, zeroNewRows = false): void {
    const target = Math.max(2, Math.min(8, Math.round(targetOutputSize)));
    const outLayerIdx = this.weights.length - 1;
    if (outLayerIdx < 0) return;

    const currentSize = this.weights[outLayerIdx].length;
    const prevSize =
      this.weights[outLayerIdx][0]?.length ??
      (outLayerIdx > 0 ? this.weights[outLayerIdx - 1].length : 108);

    if (target > currentSize) {
      for (let r = currentSize; r < target; r++) {
        const newRow: number[] = [];
        const newFrozenRow: boolean[] = [];
        for (let j = 0; j < prevSize; j++) {
          newRow.push(zeroNewRows ? 0 : (Math.random() * 2 - 1) * 0.14);
          newFrozenRow.push(false);
        }
        this.weights[outLayerIdx].push(newRow);
        this.biases[outLayerIdx].push(0);
        this.frozenWeights[outLayerIdx].push(newFrozenRow);
        this.frozenBiases[outLayerIdx].push(false);
      }
    } else if (target < currentSize) {
      this.weights[outLayerIdx].length = target;
      this.biases[outLayerIdx].length = target;
      this.frozenWeights[outLayerIdx].length = target;
      this.frozenBiases[outLayerIdx].length = target;
    }

    if (this.layerValues.length > outLayerIdx + 1) {
      const outVals = this.layerValues[outLayerIdx + 1];
      while (outVals.length < target) outVals.push(0);
      if (outVals.length > target) outVals.length = target;
    }
  }

  getInputSize(): number {
    return this.weights[0]?.[0]?.length ?? 108;
  }

  resizeInputSize(targetInputSize: number): void {
    if (this.weights.length === 0) return;
    const target = Math.max(4, Math.round(targetInputSize));
    const layer0 = this.weights[0];
    const frozen0 = this.frozenWeights[0];
    for (let r = 0; r < layer0.length; r++) {
      const row = layer0[r];
      const fRow = frozen0?.[r];
      if (row.length < target) {
        while (row.length < target) {
          row.push(0);
          fRow?.push(false);
        }
      } else if (row.length > target) {
        row.length = target;
        if (fRow) fRow.length = target;
      }
    }
    if (this.layerValues.length > 0 && this.layerValues[0]) {
      const inVals = this.layerValues[0];
      while (inVals.length < target) inVals.push(0);
      if (inVals.length > target) inVals.length = target;
    }
  }

  getHiddenLayerSizes(): number[] {
    const sizes: number[] = [];
    for (let h = 0; h < this.weights.length - 1; h++) {
      sizes.push(this.weights[h].length);
    }
    return sizes;
  }

  canPrune(): boolean {
    for (let h = 0; h < this.weights.length - 1; h++) {
      if (this.weights[h].length <= 1) continue;
      for (let i = 0; i < this.weights[h].length; i++) {
        if (!this.frozenBiases[h]?.[i]) return true;
      }
    }
    return false;
  }

  pruneLeastWeightedNode(targetLayer?: number): { layer: number; node: number; score: number } | null {
    return this.pruneNode('least', targetLayer);
  }

  pruneStrongestNode(targetLayer?: number): { layer: number; node: number; score: number } | null {
    return this.pruneNode('strongest', targetLayer);
  }

  pruneNode(
    mode: 'least' | 'strongest',
    targetLayer?: number
  ): { layer: number; node: number; score: number } | null {
    let bestScore = mode === 'least' ? Infinity : -Infinity;
    let bestLayer = -1;
    let bestNode = -1;

    const startLayer = targetLayer !== undefined ? targetLayer : 0;
    const endLayer = targetLayer !== undefined ? targetLayer : this.weights.length - 2;

    for (let h = startLayer; h <= endLayer; h++) {
      if (h < 0 || h >= this.weights.length - 1) continue;
      if (this.weights[h].length <= 1) continue;

      for (let i = 0; i < this.weights[h].length; i++) {
        if (this.frozenBiases[h]?.[i]) continue;
        let score = 0;
        for (let j = 0; j < this.weights[h][i].length; j++) {
          score += Math.abs(this.weights[h][i][j]);
        }
        for (let r = 0; r < this.weights[h + 1].length; r++) {
          score += Math.abs(this.weights[h + 1][r][i]);
        }
        const isBetter = mode === 'least' ? score < bestScore : score > bestScore;
        if (isBetter) {
          bestScore = score;
          bestLayer = h;
          bestNode = i;
        }
      }
    }

    if (bestLayer === -1 || bestNode === -1) {
      return null;
    }

    this.weights[bestLayer].splice(bestNode, 1);
    this.biases[bestLayer].splice(bestNode, 1);
    this.frozenWeights[bestLayer]?.splice(bestNode, 1);
    this.frozenBiases[bestLayer]?.splice(bestNode, 1);

    for (let r = 0; r < this.weights[bestLayer + 1].length; r++) {
      this.weights[bestLayer + 1][r].splice(bestNode, 1);
      this.frozenWeights[bestLayer + 1]?.[r]?.splice(bestNode, 1);
    }
    if (this.layerValues.length > bestLayer + 1) {
      this.layerValues[bestLayer + 1].splice(bestNode, 1);
    }

    return { layer: bestLayer, node: bestNode, score: bestScore };
  }

  static fromJSON(data: unknown): {
    network: NeuralNetwork;
    generation: number;
    fitness: number;
    hiddenLayerSizes: number[];
  } {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid weights file: expected JSON object.');
    }

    const record = data as Record<string, unknown>;
    const rawWeights = record.weights;
    const rawBiases = record.biases;

    if (!Array.isArray(rawWeights) || !Array.isArray(rawBiases)) {
      throw new Error('Invalid weights file: missing weights or biases.');
    }
    if (rawWeights.length < 2 || rawWeights.length !== rawBiases.length) {
      throw new Error('Invalid weights file: mismatched layer count.');
    }

    const weights: number[][][] = [];
    const biases: number[][] = [];
    const firstLayerInputCols =
      Array.isArray(rawWeights[0]) && Array.isArray((rawWeights[0] as unknown[])[0])
        ? ((rawWeights[0] as unknown[])[0] as unknown[]).length
        : 108;
    if (firstLayerInputCols !== 104 && firstLayerInputCols !== 108) {
      throw new Error(`Invalid input dimensions at layer 0: expected 104 or 108, got ${firstLayerInputCols}.`);
    }
    let expectedCols = firstLayerInputCols;

    for (let l = 0; l < rawWeights.length; l++) {
      const layerWeights = rawWeights[l];
      const layerBiases = rawBiases[l];
      if (!Array.isArray(layerWeights) || !Array.isArray(layerBiases)) {
        throw new Error(`Invalid weights at layer ${l}.`);
      }
      if (layerWeights.length === 0 || layerWeights.length !== layerBiases.length) {
        throw new Error(`Mismatched neuron count at layer ${l}.`);
      }

      const parsedMatrix: number[][] = [];
      const parsedBiases: number[] = [];

      for (let i = 0; i < layerWeights.length; i++) {
        const row = layerWeights[i];
        const b = layerBiases[i];
        if (!Array.isArray(row) || row.length !== expectedCols || typeof b !== 'number' || !Number.isFinite(b)) {
          throw new Error(`Invalid matrix dimensions at layer ${l}, node ${i}.`);
        }
        const parsedRow: number[] = [];
        for (let j = 0; j < row.length; j++) {
          const val = row[j];
          if (typeof val !== 'number' || !Number.isFinite(val)) {
            throw new Error(`Invalid weight value at layer ${l}, node ${i}, input ${j}.`);
          }
          parsedRow.push(val);
        }
        parsedMatrix.push(parsedRow);
        parsedBiases.push(b);
      }

      weights.push(parsedMatrix);
      biases.push(parsedBiases);
      expectedCols = layerWeights.length;
    }

    if (expectedCols < 2 || expectedCols > 8) {
      throw new Error(`Expected 2 to 8 output neurons, got ${expectedCols}.`);
    }

    const arch =
      record.architecture && typeof record.architecture === 'object'
        ? (record.architecture as Record<string, unknown>)
        : {};
    const rawAct = typeof arch.activation === 'string' ? arch.activation : 'tanh';
    const validActivations = new Set(ACTIVATION_OPTIONS.map((o) => o.value));
    const activation: ActivationType = validActivations.has(rawAct as ActivationType)
      ? (rawAct as ActivationType)
      : 'tanh';

    const network = new NeuralNetwork(0, 0, 0, 0, activation);
    network.weights = weights;
    network.biases = biases;

    const rawFW = record.frozenWeights;
    const rawFB = record.frozenBiases;
    const hiddenCount = weights.length - 1;
    if (
      Array.isArray(rawFW) &&
      Array.isArray(rawFB) &&
      rawFW.length === weights.length &&
      rawFB.length === biases.length
    ) {
      network.frozenWeights = weights.map((layer, l) =>
        layer.map((row, i) =>
          row.map((_, j) =>
            l < hiddenCount ? Boolean((rawFW[l] as unknown[][])?.[i]?.[j]) : false
          )
        )
      );
      network.frozenBiases = biases.map((layer, l) =>
        layer.map((_, i) =>
          l < hiddenCount ? Boolean((rawFB[l] as unknown[])?.[i]) : false
        )
      );
    } else if (Array.isArray(record.frozenHiddenNodes)) {
      network.applyFrozenHiddenMask(record.frozenHiddenNodes);
    } else if (record.isFrozen === true) {
      network.freezeHiddenAll();
    } else {
      network.unfreezeAll();
    }

    if (network.getInputSize() < 108) {
      network.resizeInputSize(108);
    }

    const fitness =
      typeof record.fitness === 'number' && Number.isFinite(record.fitness)
        ? record.fitness
        : -Infinity;
    network.fitness = fitness;

    const generation =
      typeof record.generation === 'number' && Number.isFinite(record.generation) && record.generation >= 1
        ? Math.floor(record.generation)
        : 1;

    return {
      network,
      generation,
      fitness,
      hiddenLayerSizes: network.getHiddenLayerSizes(),
    };
  }
}

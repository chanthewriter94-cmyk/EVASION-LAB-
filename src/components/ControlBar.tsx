import React, { useEffect, useRef, useState } from 'react';
import {
  AgentId,
  EnemySpeedMode,
  FrozenRewardEntry,
  SimMode,
  SpawnMode,
  SPLIT_BRAIN_MERGE_OPTIONS,
  SplitBrainMergeMode,
  TelepathyBridgeMode,
  VisualMode,
} from '../simulation/EvasionEngine';
import {
  ACTIVATION_OPTIONS,
  ActivationType,
  getOutputConfigSpec,
  OUTPUT_CONFIG_OPTIONS,
  OutputConfig,
} from '../simulation/NeuralNetwork';
import { FrozenInfoPopover } from './FrozenInfoPopover';
import { PWAInstallButton } from './PWAInstallButton';
import { BRAIN_UI_STYLES } from './brainStyles';

export type RewardCategory = 'spacing' | 'flow' | 'tactical';

export interface RewardConfigItem {
  id:
    | 'R1'
    | 'R2'
    | 'R3'
    | 'R4'
    | 'R5'
    | 'R6'
    | 'R7'
    | 'R8'
    | 'R9'
    | 'R10'
    | 'R11'
    | 'R12'
    | 'R13'
    | 'R14'
    | 'R15'
    | 'R16'
    | 'R17'
    | 'R18'
    | 'R19'
    | 'R20'
    | 'R21'
    | 'R22'
    | 'R23'
    | 'R24';
  label: string;
  category: RewardCategory;
  active: boolean;
  isPositive: boolean;
  weightText: string;
  title?: string;
}

type ControlTab = 'network' | 'env' | 'rewards' | null;
type RewardFilter = 'all' | 'active' | RewardCategory;

interface ControlBarProps {
  layers: number;
  neurons: number;
  hiddenLayerSizes: number[];
  minLayers: number;
  minNeurons: number;
  activation: ActivationType;
  outputConfig: OutputConfig;
  enemyCount: number;
  enemySpeedPct: number;
  enemySpeedMode: EnemySpeedMode;
  spawnMode: SpawnMode;
  simSpeed: number;
  turboMode: boolean;
  visualMode: VisualMode;
  soundEnabled: boolean;
  soundVolume: number;
  rewards: RewardConfigItem[];
  onLayersChange: (val: number) => void;
  onNeuronsChange: (val: number) => void;
  onActivationChange: (val: ActivationType) => void;
  onOutputConfigChange: (val: OutputConfig) => void;
  onEnemyCountChange: (val: number) => void;
  onEnemySpeedPctChange: (val: number) => void;
  onEnemySpeedModeChange: (mode: EnemySpeedMode) => void;
  onSpawnModeChange: (mode: SpawnMode) => void;
  onSimSpeedChange: (val: number) => void;
  onVisualModeChange: (mode: VisualMode) => void;
  onToggleSound: () => void;
  onSoundVolumeChange: (volume: number) => void;
  onToggleReward: (id: RewardConfigItem['id']) => void;
  onToggleRewardSign: (id: RewardConfigItem['id']) => void;
  onRewardWeightChange: (id: RewardConfigItem['id'], text: string) => void;
  onClearAllRewards: () => void;
  onSetTurboMode: (turbo: boolean) => void;
  isFrozen: boolean;
  frozenRewards: FrozenRewardEntry[];
  onToggleFreeze: () => void;
  onPruneNetwork: () => void;
  onReversePrune: () => void;
  onDownloadWeights: () => void;
  onGetWeightsJson: () => string;
  onUploadWeights: (data: unknown) => { generation: number };
  canPrune: boolean;
  onReset: () => void;
  demoCount: number;
  onOpenHumanDemo: () => void;
  onOpenDemoTrainer: () => void;
  simMode: SimMode;
  dualAgentMode: boolean;
  splitBrainMode: boolean;
  splitBrainCount: number;
  activeBrainIds: AgentId[];
  splitBrainMergeMode: SplitBrainMergeMode;
  activeInspectAgent: AgentId;
  telepathyBridgeMode: TelepathyBridgeMode;
  partnerOutputConfig?: OutputConfig;
  onSimModeChange: (mode: SimMode) => void;
  onSplitBrainCountChange: (count: number) => void;
  onSplitBrainMergeModeChange: (mode: SplitBrainMergeMode) => void;
  onSelectInspectAgent: (id: AgentId) => void;
  onTelepathyBridgeModeChange: (mode: TelepathyBridgeMode) => void;
}

const inputBaseClass =
  'bg-[#222] text-[#eee] border border-[#444] p-[4px] font-mono text-[12px] leading-normal';
const buttonBaseClass =
  'bg-[#222] text-[#eee] border border-[#444] p-[4px] font-mono text-[12px] leading-normal cursor-pointer hover:bg-[#333] whitespace-nowrap';

export const ControlBar: React.FC<ControlBarProps> = ({
  layers,
  neurons,
  hiddenLayerSizes,
  minLayers,
  minNeurons,
  activation,
  outputConfig,
  enemyCount,
  enemySpeedPct,
  enemySpeedMode,
  spawnMode,
  simSpeed,
  turboMode,
  visualMode,
  soundEnabled,
  soundVolume,
  rewards,
  onLayersChange,
  onNeuronsChange,
  onActivationChange,
  onOutputConfigChange,
  onEnemyCountChange,
  onEnemySpeedPctChange,
  onEnemySpeedModeChange,
  onSpawnModeChange,
  onSimSpeedChange,
  onVisualModeChange,
  onToggleSound,
  onSoundVolumeChange,
  onToggleReward,
  onToggleRewardSign,
  onRewardWeightChange,
  onClearAllRewards,
  onSetTurboMode,
  isFrozen,
  frozenRewards,
  onToggleFreeze,
  onPruneNetwork,
  onReversePrune,
  onDownloadWeights,
  onGetWeightsJson,
  onUploadWeights,
  canPrune,
  onReset,
  demoCount,
  onOpenHumanDemo,
  onOpenDemoTrainer,
  simMode,
  dualAgentMode,
  splitBrainMode,
  splitBrainCount,
  activeBrainIds,
  splitBrainMergeMode,
  activeInspectAgent,
  telepathyBridgeMode,
  partnerOutputConfig,
  onSimModeChange,
  onSplitBrainCountChange,
  onSplitBrainMergeModeChange,
  onSelectInspectAgent,
  onTelepathyBridgeModeChange,
}) => {
  const [activeTab, setActiveTab] = useState<ControlTab>(null);
  const lastSetupTabRef = useRef<Exclude<ControlTab, null>>('network');
  const [rewardFilter, setRewardFilter] = useState<RewardFilter>('all');
  const [showUploadPanel, setShowUploadPanel] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [enemyCountText, setEnemyCountText] = useState<string>(String(enemyCount));
  const [enemySpeedText, setEnemySpeedText] = useState<string>(String(enemySpeedPct));
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEnemyCountText(String(enemyCount));
  }, [enemyCount]);

  useEffect(() => {
    setEnemySpeedText(String(enemySpeedPct));
  }, [enemySpeedPct]);

  const toggleSetupDrawer = () => {
    setActiveTab((prev) => {
      if (prev !== null) {
        lastSetupTabRef.current = prev;
        return null;
      }
      return lastSetupTabRef.current;
    });
  };

  const selectTab = (tab: Exclude<ControlTab, null>) => {
    lastSetupTabRef.current = tab;
    setActiveTab(tab);
  };

  const loadRawJsonString = (rawText: string) => {
    try {
      const parsed: unknown = JSON.parse(rawText);
      const result = onUploadWeights(parsed);
      setStatusMsg({ text: `Loaded Gen ${result.generation}`, isError: false });
      setPasteText('');
      setShowUploadPanel(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid weights JSON.';
      setStatusMsg({ text: message, isError: true });
    }
  };

  const readFileAndLoad = (file: File, inputEl?: HTMLInputElement | null) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        loadRawJsonString(reader.result);
      } else {
        setStatusMsg({ text: 'Unable to read file as text.', isError: true });
      }
    };
    reader.onerror = () => {
      setStatusMsg({ text: 'Failed to read selected file.', isError: true });
    };
    reader.onloadend = () => {
      if (inputEl) {
        inputEl.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    readFileAndLoad(file, e.target);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    readFileAndLoad(file);
  };

  const handleCopyJson = async () => {
    const json = onGetWeightsJson();
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      setStatusMsg({ text: 'Copied JSON', isError: false });
    } catch {
      setPasteText(json);
      setShowUploadPanel(true);
      setStatusMsg({ text: 'JSON placed below', isError: false });
    }
  };

  const activeRewardCount = rewards.filter((r) => r.active).length;
  const hasTwoBrains = dualAgentMode || splitBrainMode;
  const activeMergeSpec =
    SPLIT_BRAIN_MERGE_OPTIONS.find((o) => o.value === splitBrainMergeMode) ??
    SPLIT_BRAIN_MERGE_OPTIONS[0];

  return (
    <div className="w-full max-w-[600px] mb-[6px] text-[12px] font-mono">
      {/* Clean outside bar: Setup drawer toggle + Single/Dual toggle + 1x / MAX playback + Reset */}
      <div className="flex items-center justify-between gap-[6px] min-w-0 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-[140px] overflow-hidden border border-[#333] bg-[#141414]">
          <button
            id="btnToggleSetupPanel"
            type="button"
            onClick={toggleSetupDrawer}
            className="w-full min-w-0 overflow-hidden flex items-center justify-between gap-[8px] px-[8px] py-[4px] bg-transparent border-none font-mono text-[12px] text-[#ddd] hover:text-[#fff] cursor-pointer text-left"
          >
            <span className="inline-flex items-center gap-[6px] whitespace-nowrap shrink-0">
              <span className={activeTab !== null ? 'text-[#2dd4bf]' : 'text-[#ddd]'}>
                Setup {activeTab !== null ? '▾' : '▸'}
              </span>
            </span>
            <span className="text-[10px] text-[#777] truncate min-w-0">
              {activeTab === 'network'
                ? splitBrainMode
                  ? `Network (${splitBrainCount} Brains · ${activeInspectAgent})`
                  : dualAgentMode
                  ? `Network (${activeInspectAgent})`
                  : 'Network'
                : activeTab === 'env'
                ? 'Env'
                : activeTab === 'rewards'
                ? `Rewards${activeRewardCount > 0 ? ` (${activeRewardCount})` : ''}`
                : 'Network · Env · Rewards'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-[4px] shrink-0">
          <span
            className="inline-flex border border-[#444]"
            title="Switch between Single Agent, Dual Agent (telepathy), and Split Brain (2-5 isolated nets on one body)"
          >
            <button
              id="btnModeSingle"
              type="button"
              onClick={() => onSimModeChange('single')}
              className={`${
                simMode === 'single' ? 'bg-[#066] text-[#fff]' : 'bg-[#222] text-[#ccc] hover:bg-[#333]'
              } border-none px-[6px] py-[4px] font-mono text-[11px] leading-normal cursor-pointer whitespace-nowrap`}
            >
              Single
            </button>
            <button
              id="btnModeDual"
              type="button"
              onClick={() => onSimModeChange('dual')}
              className={`${
                simMode === 'dual'
                  ? 'bg-[#5c360b] text-[#fcd34d]'
                  : 'bg-[#222] text-[#ccc] hover:bg-[#333]'
              } border-none border-l border-[#444] px-[6px] py-[4px] font-mono text-[11px] leading-normal cursor-pointer whitespace-nowrap`}
            >
              Dual Agent
            </button>
            <button
              id="btnModeSplitBrain"
              type="button"
              onClick={() => onSimModeChange('split_brain')}
              className={`${
                simMode === 'split_brain'
                  ? 'bg-gradient-to-r from-[#0c4a55] to-[#5c360b] text-[#fff]'
                  : 'bg-[#222] text-[#ccc] hover:bg-[#333]'
              } border-none border-l border-[#444] px-[6px] py-[4px] font-mono text-[11px] leading-normal cursor-pointer whitespace-nowrap`}
            >
              Split Brain
            </button>
          </span>

          <span className="inline-flex border border-[#444]">
            <button
              id="btnPlayMin"
              type="button"
              onClick={() => onSetTurboMode(false)}
              title="Play at standard 1x simulation speed"
              className={`${
                !turboMode && simSpeed <= 1 ? 'bg-[#066] text-[#fff]' : 'bg-[#222] text-[#eee] hover:bg-[#333]'
              } border-none px-[8px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
            >
              1x
            </button>
            <button
              id="btnTurbo"
              type="button"
              onClick={() => onSetTurboMode(true)}
              title="Play at MAX turbo training speed"
              className={`${
                turboMode ? 'bg-[#066] text-[#fff]' : 'bg-[#222] text-[#eee] hover:bg-[#333]'
              } border-none border-l border-[#444] px-[8px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
            >
              MAX
            </button>
          </span>
          <button
            id="btnReset"
            type="button"
            onClick={onReset}
            title="Reset network population and simulation"
            className="bg-[#222] text-[#eee] border border-[#444] px-[8px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer hover:bg-[#333] whitespace-nowrap"
          >
            Reset
          </button>
        </div>
      </div>

      {activeTab !== null && (
        <div
          id="setupPanelContainer"
          className="mt-[4px] border border-[#333] bg-[#141414] overflow-hidden"
        >
          <div className="grid grid-cols-3 border-b border-[#333] bg-[#191919] text-[11px]">
            <button
              id="tabNetwork"
              type="button"
              onClick={() => selectTab('network')}
              className={`${
                activeTab === 'network'
                  ? 'bg-[#066] text-[#fff]'
                  : 'bg-transparent text-[#ccc] hover:bg-[#242424]'
              } border-none border-r border-[#333] py-[5px] px-[4px] font-mono text-[11px] cursor-pointer whitespace-nowrap text-center`}
            >
              Network
            </button>
            <button
              id="tabEnv"
              type="button"
              onClick={() => selectTab('env')}
              className={`${
                activeTab === 'env'
                  ? 'bg-[#066] text-[#fff]'
                  : 'bg-transparent text-[#ccc] hover:bg-[#242424]'
              } border-none border-r border-[#333] py-[5px] px-[4px] font-mono text-[11px] cursor-pointer whitespace-nowrap text-center`}
            >
              Env
            </button>
            <button
              id="tabRewards"
              type="button"
              onClick={() => selectTab('rewards')}
              className={`${
                activeTab === 'rewards'
                  ? 'bg-[#066] text-[#fff]'
                  : 'bg-transparent text-[#ccc] hover:bg-[#242424]'
              } border-none py-[5px] px-[4px] font-mono text-[11px] cursor-pointer whitespace-nowrap text-center`}
            >
              {`Rewards${activeRewardCount > 0 ? ` (${activeRewardCount})` : ''}`}
            </button>
          </div>

          {activeTab === 'network' && (
            <div className="p-[8px] bg-[#141414] flex flex-col gap-[8px]">
              {hasTwoBrains && (
                <div className="flex items-center justify-between gap-[8px] flex-wrap pb-[6px] border-b border-[#262626] text-[11px]">
                  <div className="flex items-center gap-[6px] flex-wrap">
                    <span className="text-[#999]">Editing:</span>
                    <span className="inline-flex border border-[#444]">
                      {activeBrainIds.map((id, idx) => {
                        const style = BRAIN_UI_STYLES[id];
                        const compact = splitBrainMode && activeBrainIds.length > 2;
                        return (
                          <button
                            key={id}
                            id={`btnEditAgent${id}`}
                            type="button"
                            title={`Edit ${splitBrainMode ? 'Brain' : 'Agent'} ${id} (${style.colorName})`}
                            onClick={() => onSelectInspectAgent(id)}
                            className={`${
                              activeInspectAgent === id
                                ? style.activeTabClass
                                : 'bg-[#1c1c1c] text-[#aaa] hover:bg-[#2a2a2a]'
                            } border-none ${idx > 0 ? 'border-l border-[#444]' : ''} px-[8px] py-[2px] font-mono text-[11px] cursor-pointer whitespace-nowrap`}
                          >
                            {compact
                              ? `Brain ${id}`
                              : `${splitBrainMode ? 'Brain' : 'Agent'} ${id} (${style.colorName})`}
                          </button>
                        );
                      })}
                    </span>
                    {splitBrainMode && (
                      <div className="flex items-center gap-[4px]">
                        <span className="text-[10px] text-[#8a94a6]">Brains:</span>
                        <span className="inline-flex border border-[#444]">
                          {[2, 3, 4, 5].map((cnt, idx) => (
                            <button
                              key={cnt}
                              id={`btnSetupSplitCount_${cnt}`}
                              type="button"
                              title={`Run ${cnt} isolated neural nets simultaneously on the same character`}
                              onClick={() => onSplitBrainCountChange(cnt)}
                              className={`${
                                splitBrainCount === cnt
                                  ? 'bg-[#066] text-[#fff]'
                                  : 'bg-[#1c1c1c] text-[#aaa] hover:bg-[#2a2a2a]'
                              } border-none ${idx > 0 ? 'border-l border-[#444]' : ''} px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap tabular-nums`}
                            >
                              {cnt}
                            </button>
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                  {dualAgentMode ? (
                    <div className="flex items-center gap-[5px]">
                      <span className="text-[10px] text-[#8a94a6]">Bridge:</span>
                      <span className="inline-flex border border-[#444]">
                        <button
                          id="btnSetupBridgeDual"
                          type="button"
                          onClick={() => onTelepathyBridgeModeChange('dual')}
                          title="Dual telepathy bridge: A and B both receive each other's outputs"
                          className={`${
                            telepathyBridgeMode === 'dual'
                              ? 'bg-[#066] text-[#fff]'
                              : 'bg-[#1c1c1c] text-[#aaa] hover:bg-[#2a2a2a]'
                          } border-none px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                        >
                          A↔B Dual
                        </button>
                        <button
                          id="btnSetupBridgeAToB"
                          type="button"
                          onClick={() => onTelepathyBridgeModeChange('a_to_b')}
                          title="One-way telepathy bridge: only Agent B receives Agent A's outputs"
                          className={`${
                            telepathyBridgeMode === 'a_to_b'
                              ? 'bg-[#0c4a55] text-[#67e8f9]'
                              : 'bg-[#1c1c1c] text-[#aaa] hover:bg-[#2a2a2a]'
                          } border-none border-l border-[#444] px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                        >
                          A→B
                        </button>
                        <button
                          id="btnSetupBridgeBToA"
                          type="button"
                          onClick={() => onTelepathyBridgeModeChange('b_to_a')}
                          title="One-way telepathy bridge: only Agent A receives Agent B's outputs"
                          className={`${
                            telepathyBridgeMode === 'b_to_a'
                              ? 'bg-[#5c360b] text-[#fcd34d]'
                              : 'bg-[#1c1c1c] text-[#aaa] hover:bg-[#2a2a2a]'
                          } border-none border-l border-[#444] px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                        >
                          B→A
                        </button>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-[5px] flex-wrap">
                      <span className="text-[10px] text-[#8a94a6]">Merge:</span>
                      <span className="inline-flex border border-[#444] flex-wrap">
                        {SPLIT_BRAIN_MERGE_OPTIONS.map((opt, idx) => (
                          <button
                            key={opt.value}
                            id={`btnSetupMerge_${opt.value}`}
                            type="button"
                            title={`${opt.label}: ${opt.description}`}
                            onClick={() => onSplitBrainMergeModeChange(opt.value)}
                            className={`${
                              splitBrainMergeMode === opt.value
                                ? 'bg-[#066] text-[#fff]'
                                : 'bg-[#1c1c1c] text-[#aaa] hover:bg-[#2a2a2a]'
                            } border-none ${idx > 0 ? 'border-l border-[#444]' : ''} px-[6px] py-[2px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                          >
                            {opt.shortLabel}
                          </button>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Topology (L / N), Activation, and Freeze */}
              <div className="flex gap-[8px] flex-wrap items-center">
                <span className="inline-flex items-center">
                  <span className="mr-[4px] text-[#bbb]">L:</span>
                  <span className="inline-flex items-center border border-[#444] bg-[#222]">
                    <button
                      id="btnDecLayers"
                      type="button"
                      disabled={layers <= minLayers}
                      onClick={() => onLayersChange(layers - 1)}
                      title="Decrease hidden layers"
                      className="bg-[#222] hover:bg-[#333] text-[#eee] border-none px-[7px] py-[2px] font-mono text-[12px] leading-normal cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span
                      id="layersVal"
                      className="px-[7px] py-[2px] border-x border-[#444] text-[#eee] tabular-nums min-w-[22px] text-center"
                    >
                      {layers}
                    </span>
                    <button
                      id="btnIncLayers"
                      type="button"
                      disabled={layers >= 5}
                      onClick={() => onLayersChange(layers + 1)}
                      title="Increase hidden layers"
                      className="bg-[#222] hover:bg-[#333] text-[#eee] border-none px-[7px] py-[2px] font-mono text-[12px] leading-normal cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </span>
                </span>

                <span className="inline-flex items-center">
                  <span className="mr-[4px] text-[#bbb]">N:</span>
                  <span className="inline-flex items-center border border-[#444] bg-[#222]">
                    <button
                      id="btnDecNeurons"
                      type="button"
                      disabled={neurons <= minNeurons}
                      onClick={() => onNeuronsChange(neurons - 1)}
                      title="Decrease nodes per layer"
                      className="bg-[#222] hover:bg-[#333] text-[#eee] border-none px-[7px] py-[2px] font-mono text-[12px] leading-normal cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span
                      id="neuronsVal"
                      title={
                        hiddenLayerSizes.length > 1
                          ? `Hidden nodes per layer: ${hiddenLayerSizes.join(' · ')} (${hiddenLayerSizes.reduce((a, b) => a + b, 0)} total)`
                          : `${hiddenLayerSizes[0] ?? neurons} hidden nodes`
                      }
                      className="px-[7px] py-[2px] border-x border-[#444] text-[#eee] tabular-nums min-w-[28px] text-center"
                    >
                      {hiddenLayerSizes.length > 0 &&
                      hiddenLayerSizes.every((s) => s === hiddenLayerSizes[0])
                        ? hiddenLayerSizes[0]
                        : hiddenLayerSizes.length > 0
                        ? hiddenLayerSizes.join('/')
                        : neurons}
                    </span>
                    <button
                      id="btnIncNeurons"
                      type="button"
                      disabled={neurons >= 64}
                      onClick={() => onNeuronsChange(neurons + 1)}
                      title="Increase nodes per layer"
                      className="bg-[#222] hover:bg-[#333] text-[#eee] border-none px-[7px] py-[2px] font-mono text-[12px] leading-normal cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </span>
                </span>

                <label className="inline-flex items-center gap-[2px]">
                  A:
                  <select
                    id="activation"
                    value={activation}
                    onChange={(e) => onActivationChange(e.target.value as ActivationType)}
                    className={inputBaseClass}
                  >
                    {ACTIVATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  className="inline-flex items-center gap-[2px]"
                  title="Select movement output nodes (auto-adapts weights without resetting hidden layers)"
                >
                  Out:
                  <select
                    id="outputConfig"
                    value={outputConfig}
                    onChange={(e) => onOutputConfigChange(e.target.value as OutputConfig)}
                    className={inputBaseClass}
                  >
                    {OUTPUT_CONFIG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <span className="inline-flex items-center">
                  <button
                    id="btnFreeze"
                    type="button"
                    onClick={onToggleFreeze}
                    title={
                      isFrozen && frozenRewards.length > 0
                        ? `Frozen with: ${frozenRewards.map((f) => f.rewards.join(', ')).join(' | ')} (click to unfreeze)`
                        : 'Freeze hidden layers, or click/drag a box on hidden neurons in Net panel'
                    }
                    className={`${
                      isFrozen
                        ? 'bg-[#2a4b7c] border-[#5c94e0] text-[#e6f0ff] hover:bg-[#335a94]'
                        : 'bg-[#222] border-[#444] text-[#eee] hover:bg-[#333]'
                    } border p-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
                  >
                    {isFrozen ? 'Frozen' : 'Freeze'}
                  </button>
                  {isFrozen && (
                    <FrozenInfoPopover
                      frozenRewards={frozenRewards}
                      label="?"
                      buttonId="btnControlFrozenInfo"
                      title="Click to inspect which reward(s) this network was frozen with"
                      align="left"
                      attachLeft
                    />
                  )}
                </span>
              </div>

              <div className="text-[10px] text-[#8a94a6] leading-snug">
                {splitBrainMode ? (
                  <>
                    <span className={BRAIN_UI_STYLES[activeInspectAgent].lightTextClass}>
                      Brain {activeInspectAgent}
                    </span>{' '}
                    Outputs: <span className="text-[#c8d4e3]">{getOutputConfigSpec(outputConfig).description}</span>
                    <span className="text-[#7b8594]">
                      {' '}
                      · Isolated across {splitBrainCount} brains (0 partner inputs) · Merge:{' '}
                      <span className="text-[#c8d4e3]">{activeMergeSpec.label}</span> — {activeMergeSpec.description}
                    </span>
                  </>
                ) : dualAgentMode ? (
                  <>
                    <span className={BRAIN_UI_STYLES[activeInspectAgent].lightTextClass}>
                      Agent {activeInspectAgent}
                    </span>{' '}
                    Outputs: <span className="text-[#c8d4e3]">{getOutputConfigSpec(outputConfig).description}</span>
                    {partnerOutputConfig && (
                      <span className="text-[#7b8594]">
                        {' '}
                        ·{' '}
                        {telepathyBridgeMode === 'dual' ||
                        (telepathyBridgeMode === 'a_to_b' && activeInspectAgent === 'B') ||
                        (telepathyBridgeMode === 'b_to_a' && activeInspectAgent === 'A')
                          ? `Receiving ${activeInspectAgent === 'A' ? 'B' : 'A'} (${
                              getOutputConfigSpec(partnerOutputConfig).shortLabel
                            })`
                          : 'Sending only (1-way bridge)'}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Outputs: <span className="text-[#c8d4e3]">{getOutputConfigSpec(outputConfig).description}</span>
                  </>
                )}
              </div>

              {/* Pruning, Weights, Demos & App actions */}
              <div className="flex gap-[6px] flex-wrap items-center">
                <button
                  id="btnPrune"
                  type="button"
                  disabled={!canPrune}
                  onClick={onPruneNetwork}
                  title="Prune the hidden node with the smallest total weight magnitude"
                  className="bg-[#222] text-[#eee] border border-[#444] p-[4px] font-mono text-[12px] leading-normal cursor-pointer hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#222] whitespace-nowrap"
                >
                  Prune Network
                </button>

                <button
                  id="btnReversePrune"
                  type="button"
                  disabled={!canPrune}
                  onClick={onReversePrune}
                  title="Prune the hidden node with the largest total weight magnitude"
                  className="bg-[#222] text-[#eee] border border-[#444] p-[4px] font-mono text-[12px] leading-normal cursor-pointer hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#222] whitespace-nowrap"
                >
                  Reverse Prune
                </button>

                <button
                  id="btnDownloadWeights"
                  type="button"
                  onClick={onDownloadWeights}
                  title="Download network weights and biases as JSON"
                  className={buttonBaseClass}
                >
                  Download Weights
                </button>

                <button
                  id="btnCopyWeights"
                  type="button"
                  onClick={handleCopyJson}
                  title="Copy weights JSON to clipboard"
                  className={buttonBaseClass}
                >
                  Copy JSON
                </button>

                <button
                  id="btnUploadWeights"
                  type="button"
                  onClick={() => setShowUploadPanel((prev) => !prev)}
                  title="Load exported weights JSON via paste, drag-and-drop, or file"
                  className={`${
                    showUploadPanel ? 'bg-[#066]' : 'bg-[#222] hover:bg-[#333]'
                  } text-[#eee] border border-[#444] p-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
                >
                  Upload Weights
                </button>

                <button
                  id="btnHumanDemo"
                  type="button"
                  onClick={onOpenHumanDemo}
                  title="Enter focused mode to control the agent and record human demonstration files"
                  className="bg-[#163d3d] hover:bg-[#1f5555] text-[#e6ffff] border border-[#0aa] p-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap"
                >
                  Human Demo{demoCount > 0 ? ` (${demoCount})` : ''}
                </button>

                <button
                  id="btnOpenDemoTrainer"
                  type="button"
                  onClick={onOpenDemoTrainer}
                  title="Manage saved human demonstration files and train the neural net via Behavioral Cloning"
                  className="bg-[#163d3d] hover:bg-[#1f5555] text-[#e6ffff] border border-[#0aa] p-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap"
                >
                  Demos / Train ({demoCount})
                </button>

                <PWAInstallButton />

                {statusMsg && (
                  <span
                    className={`text-[11px] ${
                      statusMsg.isError ? 'text-[#f55]' : 'text-[#0cc]'
                    }`}
                  >
                    {statusMsg.text}
                  </span>
                )}
              </div>

          {showUploadPanel && (
            <div className="pt-[6px] border-t border-[#333] flex flex-col gap-[6px]">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={handleDrop}
                className={`border border-dashed ${
                  isDragging ? 'border-[#0ff] bg-[#102828]' : 'border-[#444] bg-[#111]'
                } p-[6px] flex items-center justify-between gap-[8px] flex-wrap`}
              >
                <span className="text-[11px] text-[#aaa]">
                  Drop .json file here (avoids iframe file picker) or choose file:
                </span>
                <button
                  id="btnBrowseWeightsFile"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className={buttonBaseClass}
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  id="fileUploadWeights"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex gap-[6px] items-start">
                <textarea
                  id="pasteWeightsJson"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Or paste downloaded weights JSON here..."
                  rows={2}
                  className="flex-1 bg-[#111] text-[#eee] border border-[#444] p-[4px] font-mono text-[11px] leading-tight resize-y"
                />
                <button
                  id="btnLoadPastedWeights"
                  type="button"
                  disabled={!pasteText.trim()}
                  onClick={() => loadRawJsonString(pasteText)}
                  className="bg-[#222] text-[#eee] border border-[#444] p-[4px] font-mono text-[12px] leading-normal cursor-pointer hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Load JSON
                </button>
              </div>
            </div>
          )}
            </div>
          )}

          {activeTab === 'env' && (
            <div className="p-[8px] bg-[#141414] flex gap-[10px] flex-wrap items-center">
              <span className="inline-flex items-center">
                <label htmlFor="enemyCount" className="mr-[2px]">
                  E:
                </label>
                <button
                  id="btnDecEnemy"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onEnemyCountChange(Math.max(1, (enemyCount || 1) - 1));
                  }}
                  className={buttonBaseClass}
                >
                  -
                </button>
                <input
                  type="number"
                  id="enemyCount"
                  value={enemyCountText}
                  min={1}
                  max={50}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setEnemyCountText(raw);
                    const parsed = parseInt(raw, 10);
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
                      onEnemyCountChange(parsed);
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseInt(enemyCountText, 10);
                    const valid = !isNaN(parsed) ? Math.min(50, Math.max(1, parsed)) : enemyCount;
                    setEnemyCountText(String(valid));
                    if (valid !== enemyCount) onEnemyCountChange(valid);
                  }}
                  className={`${inputBaseClass} w-[40px] text-center`}
                />
                <button
                  id="btnIncEnemy"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onEnemyCountChange(Math.min(50, (enemyCount || 1) + 1));
                  }}
                  className={buttonBaseClass}
                >
                  +
                </button>
              </span>

              <span className="inline-flex items-center gap-[4px]">
                <span className="inline-flex border border-[#444]">
                  <button
                    id="btnSpeedFixed"
                    type="button"
                    onClick={() => onEnemySpeedModeChange('fixed')}
                    title="All enemies move at the fixed % speed"
                    className={`${
                      enemySpeedMode === 'fixed' ? 'bg-[#066]' : 'bg-[#222] hover:bg-[#333]'
                    } text-[#eee] border-none px-[6px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
                  >
                    Fixed
                  </button>
                  <button
                    id="btnSpeedRarity"
                    type="button"
                    onClick={() => onEnemySpeedModeChange('rarity')}
                    title="Each enemy rolls a random speed (1-90%) on a ~60% bell curve"
                    className={`${
                      enemySpeedMode === 'rarity' ? 'bg-[#066]' : 'bg-[#222] hover:bg-[#333]'
                    } text-[#eee] border-none border-l border-[#444] px-[6px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
                  >
                    Rarity
                  </button>
                </span>
                {enemySpeedMode === 'fixed' ? (
                  <label className="inline-flex items-center gap-[2px]">
                    %:
                    <input
                      type="number"
                      id="enemySpeedPct"
                      value={enemySpeedText}
                      min={1}
                      max={200}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setEnemySpeedText(raw);
                        const parsed = parseFloat(raw);
                        if (!isNaN(parsed) && parsed >= 1) {
                          onEnemySpeedPctChange(parsed);
                        }
                      }}
                      onBlur={() => {
                        const parsed = parseFloat(enemySpeedText);
                        const valid = !isNaN(parsed) && parsed >= 1 ? parsed : enemySpeedPct;
                        setEnemySpeedText(String(valid));
                        if (valid !== enemySpeedPct) onEnemySpeedPctChange(valid);
                      }}
                      className={`${inputBaseClass} w-[45px]`}
                    />
                  </label>
                ) : (
                  <span
                    className="text-[11px] text-[#0cc] whitespace-nowrap"
                    title="Enemies spawn with random speeds from 1% to 90% on a bell curve averaging ~60%"
                  >
                    1–90% (~60%)
                  </span>
                )}
              </span>
          <label className="inline-flex items-center gap-[4px]">
            S:
            <input
              type="range"
              id="speedSlider"
              min={1}
              max={100}
              value={simSpeed}
              onChange={(e) => onSimSpeedChange(parseInt(e.target.value, 10) || 1)}
              className="bg-[#222] text-[#eee] border border-[#444] p-[4px] font-mono w-[80px] cursor-pointer"
            />
            <span id="speedVal">{turboMode ? 'MAX' : `${simSpeed}x`}</span>
          </label>

          <span className="inline-flex items-center">
            <span className="mr-[4px]">Spawn:</span>
            <span className="inline-flex border border-[#444]">
              <button
                id="btnSpawnOuter"
                type="button"
                onClick={() => onSpawnModeChange('outer')}
                title="Spawn enemies off-screen from random edges with short staggered delays"
                className={`${
                  spawnMode === 'outer' ? 'bg-[#066]' : 'bg-[#222] hover:bg-[#333]'
                } text-[#eee] border-none px-[6px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
              >
                Outer
              </button>
              <button
                id="btnSpawnCentral"
                type="button"
                onClick={() => onSpawnModeChange('central')}
                title="Spawn enemies at random positions inside the arena"
                className={`${
                  spawnMode === 'central' ? 'bg-[#066]' : 'bg-[#222] hover:bg-[#333]'
                } text-[#eee] border-none border-l border-[#444] px-[6px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
              >
                Central
              </button>
            </span>
          </span>

          <span className="inline-flex items-center">
            <span className="mr-[4px]">Visuals:</span>
            <span className="inline-flex border border-[#444]">
              <button
                id="btnVisualLizard"
                type="button"
                onClick={() => onVisualModeChange('lizard')}
                title="Render agent as procedural lizard with wall-riding kinematics and articulated hunters with amber chaser wisps"
                className={`${
                  visualMode === 'lizard' ? 'bg-[#066]' : 'bg-[#222] hover:bg-[#333]'
                } text-[#eee] border-none px-[6px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
              >
                Lizard
              </button>
              <button
                id="btnVisualGoldfish"
                type="button"
                onClick={() => onVisualModeChange('goldfish')}
                title="Render agent as procedural goldfish with swimming fins, veil tail, tank-glass reactions, and aquatic chaser wisps"
                className={`${
                  visualMode === 'goldfish' ? 'bg-[#066]' : 'bg-[#222] hover:bg-[#333]'
                } text-[#eee] border-none border-l border-[#444] px-[6px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
              >
                Goldfish
              </button>
              <button
                id="btnVisualClassic"
                type="button"
                onClick={() => onVisualModeChange('classic')}
                title="Render agent and enemies as classic geometric squares"
                className={`${
                  visualMode === 'classic' ? 'bg-[#066]' : 'bg-[#222] hover:bg-[#333]'
                } text-[#eee] border-none border-l border-[#444] px-[6px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
              >
                Classic
              </button>
            </span>
          </span>

          <span className="inline-flex items-center gap-[8px] flex-wrap">
            <span className="inline-flex items-center">
              <span className="mr-[4px]">Sound:</span>
              <span className="inline-flex border border-[#444]">
                <button
                  id="btnSoundOn"
                  type="button"
                  onClick={() => {
                    if (!soundEnabled) onToggleSound();
                  }}
                  title="Enable subtle procedural foley (auto-mutes in MAX turbo)"
                  className={`${
                    soundEnabled ? 'bg-[#066] text-[#fff]' : 'bg-[#222] text-[#eee] hover:bg-[#333]'
                  } border-none px-[6px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
                >
                  On
                </button>
                <button
                  id="btnSoundMute"
                  type="button"
                  onClick={() => {
                    if (soundEnabled) onToggleSound();
                  }}
                  title="Mute all procedural creature sound effects"
                  className={`${
                    !soundEnabled ? 'bg-[#066] text-[#fff]' : 'bg-[#222] text-[#eee] hover:bg-[#333]'
                  } border-none border-l border-[#444] px-[6px] py-[4px] font-mono text-[12px] leading-normal cursor-pointer whitespace-nowrap`}
                >
                  Mute
                </button>
              </span>
            </span>

            <label className="inline-flex items-center gap-[4px] whitespace-nowrap">
              <span className="text-[#bbb]">Vol:</span>
              <input
                id="soundVolume"
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(soundVolume * 100)}
                onChange={(e) => onSoundVolumeChange(Number(e.target.value) / 100)}
                title="Procedural sound volume (automatically silenced in MAX turbo mode)"
                className="w-[74px] accent-[#0aa] cursor-pointer"
              />
              <span className="text-[11px] text-[#ccc] tabular-nums w-[32px] text-right">
                {Math.round(soundVolume * 100)}%
              </span>
            </label>
          </span>
            </div>
          )}

          {activeTab === 'rewards' && (() => {
        const activeCount = rewards.filter((r) => r.active).length;
        const categories: { key: RewardCategory; title: string }[] = [
          { key: 'spacing', title: 'Spacing & Territory' },
          { key: 'flow', title: 'Heading & Corridor' },
          { key: 'tactical', title: 'Tactical Evasion' },
        ];

        const renderRewardChip = (r: RewardConfigItem) => (
          <span
            key={r.id}
            className={`inline-flex items-center border ${
              r.active ? 'border-[#0aa]' : 'border-[#444]'
            }`}
          >
            <button
              id={`btn${r.id}`}
              type="button"
              title={r.title}
              onClick={() => onToggleReward(r.id)}
              className={`${
                r.active ? 'bg-[#066] text-[#fff]' : 'bg-[#222] text-[#eee] hover:bg-[#333]'
              } border-none px-[5px] py-[3px] font-mono text-[11px] leading-normal cursor-pointer`}
            >
              {r.label}
            </button>
            <button
              id={`btnSign${r.id}`}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleRewardSign(r.id);
              }}
              className={`bg-[#222] hover:bg-[#333] border-none border-l border-[#444] w-[20px] py-[3px] font-mono text-[11px] leading-normal cursor-pointer ${
                r.isPositive ? 'text-[#eee]' : 'text-[#f55]'
              }`}
            >
              {r.isPositive ? '+' : '-'}
            </button>
            <input
              type="number"
              id={`w${r.id}`}
              value={r.weightText}
              step="0.1"
              title={r.title}
              onChange={(e) => onRewardWeightChange(r.id, e.target.value)}
              className="bg-[#222] text-[#eee] border-none border-l border-[#444] px-[4px] py-[3px] font-mono text-[11px] leading-normal w-[44px]"
            />
          </span>
        );

        const filterButtons: { key: RewardFilter; label: string }[] = [
          { key: 'all', label: 'All' },
          { key: 'active', label: `Active (${activeCount})` },
          { key: 'spacing', label: 'Spacing' },
          { key: 'flow', label: 'Flow' },
          { key: 'tactical', label: 'Tactical' },
        ];

        return (
          <div className="p-[8px] bg-[#141414] flex flex-col gap-[8px]">
            <div className="flex items-center justify-between gap-[6px] flex-wrap pb-[6px] border-b border-[#2a2a2a]">
              <div className="flex items-center gap-[3px] flex-wrap">
                {filterButtons.map((fb) => (
                  <button
                    key={fb.key}
                    type="button"
                    onClick={() => setRewardFilter(fb.key)}
                    className={`${
                      rewardFilter === fb.key
                        ? 'bg-[#066] text-[#fff] border-[#0aa]'
                        : 'bg-[#202020] text-[#bbb] border-[#3a3a3a] hover:bg-[#2d2d2d]'
                    } border px-[6px] py-[2px] font-mono text-[11px] leading-normal cursor-pointer whitespace-nowrap`}
                  >
                    {fb.label}
                  </button>
                ))}
              </div>
              <button
                id="btnClearRewards"
                type="button"
                disabled={activeCount === 0}
                onClick={onClearAllRewards}
                title="Disable all active rewards"
                className="bg-[#222] text-[#ccc] border border-[#444] px-[6px] py-[2px] font-mono text-[11px] leading-normal cursor-pointer hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Off All
              </button>
            </div>

            {rewardFilter === 'active' ? (
              activeCount === 0 ? (
                <div className="text-[11px] text-[#777] py-[2px]">
                  No rewards active.
                </div>
              ) : (
                <div className="flex gap-[5px] flex-wrap items-center">
                  {rewards.filter((r) => r.active).map(renderRewardChip)}
                </div>
              )
            ) : rewardFilter === 'all' ? (
              <div className="flex flex-col gap-[8px]">
                {categories.map((cat) => {
                  const items = rewards.filter((r) => r.category === cat.key);
                  const catActive = items.filter((r) => r.active).length;
                  return (
                    <div key={cat.key} className="flex flex-col gap-[4px]">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#888]">
                        <span>{cat.title}</span>
                        {catActive > 0 && (
                          <span className="text-[#0cc]">{catActive} on</span>
                        )}
                      </div>
                      <div className="flex gap-[5px] flex-wrap items-center">
                        {items.map(renderRewardChip)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-[5px] flex-wrap items-center">
                {rewards.filter((r) => r.category === rewardFilter).map(renderRewardChip)}
              </div>
            )}
          </div>
        );
      })()}
        </div>
      )}
    </div>
  );
};

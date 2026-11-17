import React, { useEffect, useRef, useState } from 'react';
import { HumanDemoRecording, TrainingResult } from '../simulation/DemonstrationStore';
import type { AgentId } from '../simulation/EvasionEngine';
import { ActivationType, getOutputConfigSpec, OutputConfig } from '../simulation/NeuralNetwork';
import { BRAIN_UI_STYLES } from './brainStyles';

interface DemoLibraryPanelProps {
  demos: HumanDemoRecording[];
  layers: number;
  neurons: number;
  activation: ActivationType;
  outputConfig?: OutputConfig;
  dualAgentMode?: boolean;
  splitBrainMode?: boolean;
  activeBrainIds?: AgentId[];
  targetAgent?: AgentId;
  onSelectTargetAgent?: (id: AgentId) => void;
  onDeleteDemo: (id: string) => void;
  onClearAllDemos: () => void;
  onDownloadAllDemos: () => void;
  onDownloadSingleDemo: (demo: HumanDemoRecording) => void;
  onImportDemosData: (data: unknown) => number;
  onTrainModel: (config: {
    epochs: number;
    learningRate: number;
    seedPopulation: boolean;
    agentId?: AgentId;
  }) => TrainingResult;
  onClose: () => void;
}

export const DemoLibraryPanel: React.FC<DemoLibraryPanelProps> = ({
  demos,
  layers,
  neurons,
  activation,
  outputConfig = 'cartesian_2d',
  dualAgentMode = false,
  splitBrainMode = false,
  activeBrainIds,
  targetAgent = 'A',
  onSelectTargetAgent,
  onDeleteDemo,
  onClearAllDemos,
  onDownloadAllDemos,
  onDownloadSingleDemo,
  onImportDemosData,
  onTrainModel,
  onClose,
}) => {
  const [epochsText, setEpochsText] = useState<string>('40');
  const [lrText, setLrText] = useState<string>('0.004');
  const [seedPopulation, setSeedPopulation] = useState<boolean>(true);
  const [trainResult, setTrainResult] = useState<TrainingResult | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showImportBox, setShowImportBox] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lossCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const totalFrames = demos.reduce((acc, d) => acc + d.frames.length, 0);

  useEffect(() => {
    const canvas = lossCanvasRef.current;
    if (!canvas || !trainResult || trainResult.lossHistory.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#070707';
    ctx.fillRect(0, 0, w, h);

    const hist = trainResult.lossHistory;
    let minL = Math.min(...hist);
    let maxL = Math.max(...hist);
    if (Math.abs(maxL - minL) < 1e-6) {
      minL = Math.max(0, minL - 0.01);
      maxL += 0.01;
    }

    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 1;
    for (let g = 1; g < 3; g++) {
      const gy = (g / 3) * h;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0ee';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    hist.forEach((val, idx) => {
      const x = (idx / (hist.length - 1)) * (w - 8) + 4;
      const norm = (val - minL) / (maxL - minL);
      const y = h - 5 - norm * (h - 10);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [trainResult]);

  const handleLoadJsonString = (raw: string) => {
    try {
      const parsed: unknown = JSON.parse(raw);
      const added = onImportDemosData(parsed);
      setStatusMsg({ text: `Imported ${added} demo(s)`, isError: false });
      setPasteText('');
      setShowImportBox(false);
    } catch (err) {
      setStatusMsg({
        text: err instanceof Error ? err.message : 'Failed to parse demo JSON.',
        isError: true,
      });
    }
  };

  const handleFilesSelected = (files: FileList | null, inputEl?: HTMLInputElement | null) => {
    if (!files || files.length === 0) return;
    let totalImported = 0;
    let remaining = files.length;
    let lastErr: string | null = null;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          if (typeof reader.result === 'string') {
            const parsed: unknown = JSON.parse(reader.result);
            totalImported += onImportDemosData(parsed);
          }
        } catch (err) {
          lastErr = err instanceof Error ? err.message : 'Invalid demo file.';
        } finally {
          remaining--;
          if (remaining === 0) {
            if (inputEl) inputEl.value = '';
            if (totalImported > 0) {
              setStatusMsg({
                text: `Imported ${totalImported} demo(s)${lastErr ? ` (${lastErr})` : ''}`,
                isError: false,
              });
            } else if (lastErr) {
              setStatusMsg({ text: lastErr, isError: true });
            }
          }
        }
      };
      reader.onerror = () => {
        remaining--;
        lastErr = 'Failed to read file.';
        if (remaining === 0 && inputEl) inputEl.value = '';
      };
      reader.readAsText(file);
    });
  };

  const handleRunTraining = () => {
    if (totalFrames === 0) return;
    try {
      const epochs = Math.max(1, Math.min(200, parseInt(epochsText, 10) || 40));
      const learningRate = Math.max(0.0001, Math.min(0.05, parseFloat(lrText) || 0.004));
      const resolvedIds =
        activeBrainIds ?? (dualAgentMode || splitBrainMode ? (['A', 'B'] as AgentId[]) : (['A'] as AgentId[]));
      const hasTwoBrains = resolvedIds.length > 1 || dualAgentMode || splitBrainMode;
      const activeTarget: AgentId = hasTwoBrains
        ? resolvedIds.includes(targetAgent)
          ? targetAgent
          : resolvedIds[0] ?? 'A'
        : 'A';
      const res = onTrainModel({ epochs, learningRate, seedPopulation, agentId: activeTarget });
      setTrainResult(res);
      setStatusMsg({
        text: `Trained ${hasTwoBrains ? `${splitBrainMode ? 'Brain' : 'Agent'} ${activeTarget} · ` : ''}${res.epochsRun} epochs on ${res.totalFrames} frames (applied)`,
        isError: false,
      });
    } catch (err) {
      setStatusMsg({
        text: err instanceof Error ? err.message : 'Training failed.',
        isError: true,
      });
    }
  };

  return (
    <div
      id="demoLibraryPanel"
      className="w-full max-w-[580px] bg-[#101010] border border-[#3a3a3a] p-[10px] font-mono text-[11px] text-[#ddd] flex flex-col gap-[8px] max-h-[82vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between gap-[8px] pb-[6px] border-b border-[#2b2b2b]">
        <div>
          <span className="text-[#0ff] font-bold">HUMAN DEMONSTRATIONS & TRAINING</span>
          <span className="ml-[8px] text-[#888] tabular-nums">
            {demos.length} runs | {totalFrames} frames
          </span>
        </div>
        <button
          id="btnCloseDemoLibrary"
          type="button"
          onClick={onClose}
          className="bg-[#222] hover:bg-[#333] border border-[#444] text-[#eee] px-[7px] py-[2px] cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* File Management Row */}
      <div className="flex items-center justify-between gap-[6px] flex-wrap">
        <div className="flex items-center gap-[5px] flex-wrap">
          <button
            id="btnExportAllDemos"
            type="button"
            disabled={demos.length === 0}
            onClick={onDownloadAllDemos}
            className="bg-[#1b3a3a] hover:bg-[#244e4e] border border-[#0aa] text-[#fff] px-[7px] py-[3px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save All Files (.json)
          </button>
          <button
            id="btnToggleImportDemos"
            type="button"
            onClick={() => setShowImportBox((prev) => !prev)}
            className={`${
              showImportBox ? 'bg-[#066] border-[#0aa]' : 'bg-[#222] border-[#444] hover:bg-[#333]'
            } text-[#eee] border px-[7px] py-[3px] cursor-pointer`}
          >
            Load Demo Files
          </button>
          <button
            id="btnClearAllDemos"
            type="button"
            disabled={demos.length === 0}
            onClick={onClearAllDemos}
            className="bg-[#2a1616] hover:bg-[#3c1e1e] border border-[#633] text-[#f99] px-[7px] py-[3px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>

        {statusMsg && (
          <span className={statusMsg.isError ? 'text-[#f66]' : 'text-[#0dd]'}>
            {statusMsg.text}
          </span>
        )}
      </div>

      {showImportBox && (
        <div className="p-[6px] bg-[#161616] border border-[#333] flex flex-col gap-[6px]">
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
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              handleFilesSelected(e.dataTransfer.files);
            }}
            className={`border border-dashed ${
              isDragging ? 'border-[#0ff] bg-[#102828]' : 'border-[#444] bg-[#0e0e0e]'
            } p-[6px] flex items-center justify-between gap-[8px] flex-wrap`}
          >
            <span className="text-[#aaa]">
              Drop demo .json file(s) here or pick multiple files:
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#222] hover:bg-[#333] border border-[#444] text-[#eee] px-[7px] py-[3px] cursor-pointer"
            >
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".json,application/json"
              onChange={(e) => handleFilesSelected(e.target.files, e.target)}
              className="hidden"
            />
          </div>

          <div className="flex gap-[6px] items-start">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Or paste demo bundle JSON here..."
              rows={2}
              className="flex-1 bg-[#0b0b0b] text-[#eee] border border-[#444] p-[4px] font-mono text-[11px] resize-y"
            />
            <button
              type="button"
              disabled={!pasteText.trim()}
              onClick={() => handleLoadJsonString(pasteText)}
              className="bg-[#222] hover:bg-[#333] border border-[#444] text-[#eee] px-[7px] py-[4px] cursor-pointer disabled:opacity-40"
            >
              Load
            </button>
          </div>
        </div>
      )}

      {/* Recorded Demonstrations List */}
      <div className="bg-[#0b0b0b] border border-[#2a2a2a] max-h-[160px] overflow-y-auto divide-y divide-[#1f1f1f]">
        {demos.length === 0 ? (
          <div className="p-[10px] text-[#777] text-center">
            No demonstrations recorded yet. Move the control stick in Human Demo mode or load a .json file.
          </div>
        ) : (
          demos.map((demo) => (
            <div
              key={demo.id}
              className="px-[8px] py-[5px] flex items-center justify-between gap-[8px] hover:bg-[#151515]"
            >
              <div className="flex items-center gap-[8px] flex-wrap min-w-0">
                <span className="text-[#eee] font-bold truncate max-w-[140px]">{demo.name}</span>
                <span className="text-[#0cc] tabular-nums">{demo.steps} frames</span>
                <span className="text-[#888] tabular-nums">
                  E:{demo.envSummary.numEnemies} · Fit:{Math.round(demo.fitness)}
                </span>
                <span className={demo.hit ? 'text-[#f66]' : 'text-[#6d6]'}>
                  {demo.hit ? 'HIT' : 'SAVED'}
                </span>
              </div>
              <div className="flex items-center gap-[4px] shrink-0">
                <button
                  type="button"
                  onClick={() => onDownloadSingleDemo(demo)}
                  title="Save this run as its own .json file"
                  className="bg-[#1e1e1e] hover:bg-[#2d2d2d] border border-[#3c3c3c] text-[#ccc] px-[6px] py-[1px] cursor-pointer"
                >
                  Save File
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteDemo(demo.id)}
                  title="Delete run"
                  className="bg-[#241616] hover:bg-[#3a1f1f] border border-[#533] text-[#f88] px-[6px] py-[1px] cursor-pointer"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Imitation / Behavioral Cloning Training Box */}
      <div className="p-[8px] bg-[#151515] border border-[#2f2f2f] flex flex-col gap-[6px]">
        <div className="flex items-center justify-between gap-[6px] flex-wrap">
          <div className="flex items-center gap-[6px] flex-wrap">
            {(() => {
              const resolvedIds =
                activeBrainIds ??
                (dualAgentMode || splitBrainMode ? (['A', 'B'] as AgentId[]) : (['A'] as AgentId[]));
              const hasMultiple = resolvedIds.length > 1;
              const activeTarget: AgentId = hasMultiple
                ? resolvedIds.includes(targetAgent)
                  ? targetAgent
                  : resolvedIds[0] ?? 'A'
                : 'A';
              return (
                <>
                  {hasMultiple && onSelectTargetAgent && (
                    <span className="inline-flex border border-[#3a3a3a]">
                      {resolvedIds.map((id, idx) => (
                        <button
                          key={id}
                          type="button"
                          title={`${splitBrainMode ? 'Brain' : 'Agent'} ${id} (${BRAIN_UI_STYLES[id].colorName})`}
                          onClick={() => onSelectTargetAgent(id)}
                          className={`${
                            activeTarget === id
                              ? BRAIN_UI_STYLES[id].activeTabClass
                              : 'bg-[#161616] text-[#999] hover:bg-[#242424]'
                          } border-none ${idx > 0 ? 'border-l border-[#3a3a3a]' : ''} px-[5px] py-[1px] font-mono text-[10px] cursor-pointer whitespace-nowrap`}
                        >
                          {resolvedIds.length > 2 ? id : `${splitBrainMode ? 'Brain' : 'Agent'} ${id}`}
                        </button>
                      ))}
                    </span>
                  )}
                  <span className="text-[#eee] font-bold">
                    Imitation Training{' '}
                    {hasMultiple && (
                      <span className={BRAIN_UI_STYLES[activeTarget].textClass}>
                        [{splitBrainMode ? 'Brain' : 'Agent'} {activeTarget}]{' '}
                      </span>
                    )}
                    ({layers}×{neurons} {activation} · {getOutputConfigSpec(outputConfig).shortLabel})
                  </span>
                </>
              );
            })()}
          </div>
          <span className="text-[#888]">Respects frozen neurons</span>
        </div>

        <div className="flex items-center gap-[10px] flex-wrap">
          <label className="inline-flex items-center gap-[4px]">
            Epochs:
            <input
              id="inpDemoEpochs"
              type="number"
              min={1}
              max={200}
              value={epochsText}
              onChange={(e) => setEpochsText(e.target.value)}
              className="w-[48px] bg-[#0b0b0b] border border-[#444] text-[#eee] px-[4px] py-[2px] text-center"
            />
          </label>
          <label className="inline-flex items-center gap-[4px]">
            LR:
            <select
              id="selDemoLr"
              value={lrText}
              onChange={(e) => setLrText(e.target.value)}
              className="bg-[#0b0b0b] border border-[#444] text-[#eee] px-[4px] py-[2px]"
            >
              <option value="0.001">0.001</option>
              <option value="0.002">0.002</option>
              <option value="0.004">0.004</option>
              <option value="0.008">0.008</option>
              <option value="0.015">0.015</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-[4px] cursor-pointer">
            <input
              id="chkDemoSeedPop"
              type="checkbox"
              checked={seedPopulation}
              onChange={(e) => setSeedPopulation(e.target.checked)}
              className="accent-[#0aa] cursor-pointer"
            />
            Seed RL population
          </label>
          <button
            id="btnTrainOnDemos"
            type="button"
            disabled={totalFrames === 0}
            onClick={handleRunTraining}
            className="ml-auto bg-[#0b5a5a] hover:bg-[#0e7373] border border-[#0dd] text-[#fff] font-bold px-[10px] py-[4px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Train Model ({totalFrames} frames)
          </button>
        </div>

        {trainResult && (
          <div className="flex items-center gap-[10px] flex-wrap pt-[4px] border-t border-[#262626]">
            <canvas
              ref={lossCanvasRef}
              width={210}
              height={46}
              className="bg-[#070707] border border-[#2a2a2a] block"
            />
            <div className="flex flex-col gap-[2px] tabular-nums text-[10px]">
              <div>
                MSE Loss:{' '}
                <span className="text-[#f88]">{trainResult.initialLoss.toFixed(4)}</span>
                {' → '}
                <span className="text-[#0ff] font-bold">{trainResult.finalLoss.toFixed(4)}</span>
              </div>
              <div>
                Direction Match:{' '}
                <span className="text-[#6f6] font-bold">
                  {trainResult.directionAccuracyPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

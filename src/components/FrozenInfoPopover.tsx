import React, { useEffect, useRef, useState } from 'react';
import { FrozenRewardEntry } from '../simulation/EvasionEngine';

interface FrozenInfoPopoverProps {
  frozenRewards: FrozenRewardEntry[];
  label: string;
  buttonId: string;
  title?: string;
  align?: 'left' | 'right';
  attachLeft?: boolean;
}

export const FrozenInfoPopover: React.FC<FrozenInfoPopoverProps> = ({
  frozenRewards,
  label,
  buttonId,
  title,
  align = 'left',
  attachLeft = false,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (frozenRewards.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        id={buttonId}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        title={title}
        aria-expanded={open}
        className={`bg-[#1a3154] hover:bg-[#23416e] text-[#d6e6ff] border border-[#5c94e0] ${
          attachLeft ? 'border-l-0 px-[6px] py-[4px]' : 'px-[6px] py-[2px]'
        } font-mono text-[11px] leading-normal cursor-pointer whitespace-nowrap shrink-0`}
      >
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Frozen network rewards"
          className={`absolute top-full mt-[4px] ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-50 min-w-[215px] max-w-[300px] bg-[#0d131d] border border-[#5c94e0] p-[8px] font-mono text-[11px] text-[#e2e8f0] shadow-[0_8px_24px_rgba(0,0,0,0.75)]`}
        >
          <div className="flex items-center justify-between gap-[8px] pb-[4px] mb-[6px] border-b border-[#253856]">
            <span className="font-bold text-[#93c5fd]">Frozen With</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close frozen reward tooltip"
              className="text-[#94a3b8] hover:text-[#fff] bg-transparent border-none px-[3px] py-0 font-mono text-[12px] leading-none cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-[6px]">
            {frozenRewards.map((entry, idx) => (
              <div
                key={`${entry.generation}-${idx}`}
                className={idx > 0 ? 'pt-[5px] border-t border-[#1e2d45]' : ''}
              >
                <div className="text-[10px] text-[#7ea6dc] mb-[3px] tabular-nums">
                  {frozenRewards.length > 1 ? `Stage ${idx + 1} · ` : ''}
                  Gen {entry.generation}
                </div>
                <ul className="m-0 pl-[14px] flex flex-col gap-[2px] text-[11px]">
                  {entry.rewards.map((rewardStr, rIdx) => {
                    const isNeg = rewardStr.startsWith('-');
                    const isNeutral = rewardStr.startsWith('Survival');
                    return (
                      <li
                        key={`${rIdx}-${rewardStr}`}
                        className={
                          isNeutral
                            ? 'text-[#cbd5e1]'
                            : isNeg
                            ? 'text-[#fca5a5]'
                            : 'text-[#67e8f9]'
                        }
                      >
                        {rewardStr}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

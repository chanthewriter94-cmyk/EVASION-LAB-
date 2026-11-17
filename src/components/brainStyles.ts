import type { AgentId } from '../simulation/EvasionEngine';

export const BRAIN_UI_STYLES: Record<
  AgentId,
  {
    colorName: string;
    activeTabClass: string;
    textClass: string;
    lightTextClass: string;
  }
> = {
  A: {
    colorName: 'Cyan',
    activeTabClass: 'bg-[#0c4a55] text-[#67e8f9]',
    textClass: 'text-[#22d3ee]',
    lightTextClass: 'text-[#67e8f9]',
  },
  B: {
    colorName: 'Amber',
    activeTabClass: 'bg-[#5c360b] text-[#fcd34d]',
    textClass: 'text-[#f59e0b]',
    lightTextClass: 'text-[#fcd34d]',
  },
  C: {
    colorName: 'Magenta',
    activeTabClass: 'bg-[#581c68] text-[#f5d0fe]',
    textClass: 'text-[#e879f9]',
    lightTextClass: 'text-[#f5d0fe]',
  },
  D: {
    colorName: 'Green',
    activeTabClass: 'bg-[#0b4a26] text-[#bbf7d0]',
    textClass: 'text-[#4ade80]',
    lightTextClass: 'text-[#bbf7d0]',
  },
  E: {
    colorName: 'Coral',
    activeTabClass: 'bg-[#5e1427] text-[#fecdd3]',
    textClass: 'text-[#fb7185]',
    lightTextClass: 'text-[#fecdd3]',
  },
};

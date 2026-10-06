/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Settings, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onQuit,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#02050b]/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-[#070d17]/95 border border-[#162a40] cut p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        <h2 className="font-['Orbitron'] font-black text-2xl text-white tracking-[0.3em] mb-6">
          RUN SUSPENDED
        </h2>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-[#19e3ff] hover:bg-[#57edff] text-[#030914] font-['Orbitron'] font-black text-sm tracking-widest cut transition-all cursor-pointer hover:shadow-[0_0_16px_rgba(25,227,255,0.6)]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME RUN</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#0a1424] hover:bg-[#12233c] text-white border border-[#162a40] hover:border-[#19e3ff] font-['Orbitron'] font-bold text-xs tracking-wider cut transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#19e3ff]" />
            <span>RESTART</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#0a1424] hover:bg-[#12233c] text-white border border-[#162a40] hover:border-[#a06bff] font-['Orbitron'] font-bold text-xs tracking-wider cut transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#a06bff]" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={onQuit}
            className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#160a12] hover:bg-[#260e1d] text-[#ff2d78] border border-[#ff2d78]/40 hover:border-[#ff2d78] font-['Orbitron'] font-bold text-xs tracking-wider cut transition-all cursor-pointer mt-2"
          >
            <Home className="w-4 h-4" />
            <span>QUIT TO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

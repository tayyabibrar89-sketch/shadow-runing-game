/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, Home, Award } from 'lucide-react';
import { RunStats } from '../game/types';

interface GameOverModalProps {
  stats: RunStats;
  isNewBest: boolean;
  bestScore: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewBest,
  bestScore,
  onPlayAgain,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#02050b]/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#070d17]/95 border border-[#162a40] cut p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        {/* Title */}
        <h2 className="font-['Orbitron'] font-black text-3xl sm:text-4xl text-[#ff2d78] tracking-[0.2em] drop-shadow-[0_0_16px_rgba(255,45,120,0.6)]">
          CRITICAL FAILURE
        </h2>

        {isNewBest && (
          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-[#1f0e20] border border-[#ff2d78] text-[#ff2d78] font-['Orbitron'] text-xs font-bold tracking-widest cut-sm animate-pulse">
            <Award className="w-3.5 h-3.5" />
            <span>NEW BEST RECORD!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 my-6 text-left">
          <div className="p-3 bg-[#0a1424] border border-[#15253a] cut-sm">
            <div className="text-[10px] font-['Orbitron'] tracking-widest text-[#647d96]">FINAL SCORE</div>
            <div className="font-['Orbitron'] font-bold text-lg text-white tabular-nums mt-0.5">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-[#0a1424] border border-[#15253a] cut-sm">
            <div className="text-[10px] font-['Orbitron'] tracking-widest text-[#647d96]">BEST RECORD</div>
            <div className="font-['Orbitron'] font-bold text-lg text-white tabular-nums mt-0.5">
              {bestScore.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-[#0a1424] border border-[#15253a] cut-sm">
            <div className="text-[10px] font-['Orbitron'] tracking-widest text-[#647d96]">DISTANCE</div>
            <div className="font-['Orbitron'] font-bold text-lg text-white tabular-nums mt-0.5">
              {stats.meters.toLocaleString()} m
            </div>
          </div>

          <div className="p-3 bg-[#0a1424] border border-[#15253a] cut-sm">
            <div className="text-[10px] font-['Orbitron'] tracking-widest text-[#647d96]">CREDITS EARNED</div>
            <div className="font-['Orbitron'] font-bold text-lg text-[#ffd257] tabular-nums mt-0.5">
              +{stats.runCoins.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-[#0a1424] border border-[#15253a] cut-sm">
            <div className="text-[10px] font-['Orbitron'] tracking-widest text-[#647d96]">ENEMIES PURGED</div>
            <div className="font-['Orbitron'] font-bold text-lg text-[#2dffd6] tabular-nums mt-0.5">
              {stats.kills}
            </div>
          </div>

          <div className="p-3 bg-[#0a1424] border border-[#15253a] cut-sm">
            <div className="text-[10px] font-['Orbitron'] tracking-widest text-[#647d96]">MAX CHAIN COMBO</div>
            <div className="font-['Orbitron'] font-bold text-lg text-[#19e3ff] tabular-nums mt-0.5">
              x{stats.maxCombo}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-[#19e3ff] hover:bg-[#57edff] text-[#030914] font-['Orbitron'] font-black text-sm tracking-widest cut transition-all cursor-pointer hover:shadow-[0_0_16px_rgba(25,227,255,0.6)]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REINITIALIZE RUN</span>
          </button>

          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#0a1424] hover:bg-[#12233c] text-white border border-[#162a40] hover:border-[#19e3ff] font-['Orbitron'] font-bold text-xs tracking-wider cut transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN COMMAND</span>
          </button>
        </div>
      </div>
    </div>
  );
};

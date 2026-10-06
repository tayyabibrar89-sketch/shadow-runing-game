/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, User, ShoppingBag, Target, Settings, Gift, Flame } from 'lucide-react';

interface MainMenuProps {
  bestScore: number;
  coins: number;
  hasDailyClaim: boolean;
  dailyStreak: number;
  onPlay: () => void;
  onOpenDaily: () => void;
  onOpenChars: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  bestScore,
  coins,
  hasDailyClaim,
  dailyStreak,
  onPlay,
  onOpenDaily,
  onOpenChars,
  onOpenShop,
  onOpenMissions,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-gradient-to-t from-[#02050b]/90 via-[#030713]/60 to-transparent">
      {/* Title */}
      <div className="text-center mb-8 relative">
        <h1 className="font-['Orbitron'] font-black text-5xl sm:text-7xl text-white tracking-wider drop-shadow-[0_0_25px_rgba(25,227,255,0.6)]">
          SHADOW RUNNER
        </h1>
        <div className="font-['Orbitron'] text-xs sm:text-sm font-semibold tracking-[0.5em] text-[#19e3ff] mt-2 drop-shadow-[0_0_8px_rgba(25,227,255,0.4)]">
          ESCAPE THE NEON CITY · 3D
        </div>
      </div>

      {/* Action Buttons Menu */}
      <div className="flex flex-col gap-3.5 w-full max-w-xs">
        <button
          onClick={onPlay}
          className="group flex items-center justify-center gap-3 w-full py-4 bg-[#19e3ff] hover:bg-[#57edff] text-[#030914] font-['Orbitron'] font-black text-lg sm:text-xl tracking-widest cut transition-all duration-150 hover:shadow-[0_0_24px_rgba(25,227,255,0.7)] hover:-translate-y-0.5 cursor-pointer active:scale-98"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>START RUN</span>
        </button>

        <button
          onClick={onOpenDaily}
          className={`flex items-center justify-between w-full py-3 px-5 cut transition-all cursor-pointer hover:translate-x-1 ${
            hasDailyClaim
              ? 'bg-[#181f0d] hover:bg-[#253014] text-white border-2 border-[#ffd257] shadow-[0_0_18px_rgba(255,210,87,0.35)]'
              : 'bg-[#0a1424]/90 hover:bg-[#12233c] text-white border border-[#162a40] hover:border-[#ffd257]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <Gift className={`w-4 h-4 ${hasDailyClaim ? 'text-[#ffd257] animate-bounce' : 'text-[#ffd257]'}`} />
            <span className="font-['Orbitron'] font-bold text-sm tracking-wider">DAILY REWARDS</span>
          </div>
          {hasDailyClaim ? (
            <span className="text-[10px] font-['Orbitron'] font-bold px-2 py-0.5 bg-[#ffd257] text-[#030914] rounded-xs animate-pulse">
              CLAIM!
            </span>
          ) : dailyStreak > 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-['Orbitron'] text-[#ff7a2d]">
              <Flame className="w-3 h-3" />
              <span>{dailyStreak}D</span>
            </span>
          ) : null}
        </button>

        <button
          onClick={onOpenChars}
          className="flex items-center gap-3.5 w-full py-3 px-5 bg-[#0a1424]/90 hover:bg-[#12233c] text-white border border-[#162a40] hover:border-[#19e3ff] font-['Orbitron'] font-bold text-sm tracking-wider cut transition-all cursor-pointer hover:translate-x-1"
        >
          <User className="w-4 h-4 text-[#19e3ff]" />
          <span>CHARACTERS & TRAILS</span>
        </button>

        <button
          onClick={onOpenShop}
          className="flex items-center gap-3.5 w-full py-3 px-5 bg-[#0a1424]/90 hover:bg-[#12233c] text-white border border-[#162a40] hover:border-[#ffd257] font-['Orbitron'] font-bold text-sm tracking-wider cut transition-all cursor-pointer hover:translate-x-1"
        >
          <ShoppingBag className="w-4 h-4 text-[#ffd257]" />
          <span>UPGRADES SHOP</span>
        </button>

        <button
          onClick={onOpenMissions}
          className="flex items-center gap-3.5 w-full py-3 px-5 bg-[#0a1424]/90 hover:bg-[#12233c] text-white border border-[#162a40] hover:border-[#2dffd6] font-['Orbitron'] font-bold text-sm tracking-wider cut transition-all cursor-pointer hover:translate-x-1"
        >
          <Target className="w-4 h-4 text-[#2dffd6]" />
          <span>MISSIONS</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-3.5 w-full py-3 px-5 bg-[#0a1424]/90 hover:bg-[#12233c] text-white border border-[#162a40] hover:border-[#a06bff] font-['Orbitron'] font-bold text-sm tracking-wider cut transition-all cursor-pointer hover:translate-x-1"
        >
          <Settings className="w-4 h-4 text-[#a06bff]" />
          <span>SETTINGS</span>
        </button>
      </div>

      {/* Footer Stats */}
      <div className="flex gap-8 mt-10 font-['Orbitron'] text-xs sm:text-sm tracking-widest text-[#647d96]">
        <div>
          BEST RECORD <span className="font-bold text-white ml-1 tabular-nums">{bestScore.toLocaleString()}</span>
        </div>
        <div className="text-[#ffd257]">
          CREDITS <span className="font-bold text-white ml-1 tabular-nums">{coins.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Trophy } from 'lucide-react';
import { ZONES } from '../game/constants';

interface VictoryModalProps {
  zoneIndex: number;
  rewardCoins: number;
  rewardScore: number;
  onContinue: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  zoneIndex,
  rewardCoins,
  rewardScore,
  onContinue,
}) => {
  const currentZone = ZONES[zoneIndex % ZONES.length];
  const nextZone = ZONES[(zoneIndex + 1) % ZONES.length];

  useEffect(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#19e3ff', '#ff2d78', '#ffd257', '#2dffd6'],
      });
    } catch {
      // safe fallback
    }
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#02050b]/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#070d17]/95 border border-[#2dffd6]/60 cut p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(45,255,214,0.3)]">
        {/* Trophy icon */}
        <div className="w-14 h-14 rounded-full bg-[#0a1e1a] border border-[#2dffd6] flex items-center justify-center text-[#2dffd6] mb-4 shadow-[0_0_20px_rgba(45,255,214,0.5)]">
          <Trophy className="w-7 h-7" />
        </div>

        {/* Title */}
        <h2 className="font-['Orbitron'] font-black text-2xl sm:text-3xl text-white tracking-[0.15em]">
          {currentZone.name} CLEARED
        </h2>

        <div className="text-xs font-['Orbitron'] font-bold tracking-[0.3em] text-[#2dffd6] mt-1">
          MEGA DRONE PURGED
        </div>

        {/* Rewards Box */}
        <div className="w-full bg-[#091522] border border-[#162a40] p-4 my-6 cut-sm flex justify-around">
          <div>
            <div className="text-[10px] font-['Orbitron'] text-[#647d96] tracking-widest">BOUNTY CREDITS</div>
            <div className="font-['Orbitron'] font-black text-xl text-[#ffd257] mt-1 tabular-nums">
              +{rewardCoins.toLocaleString()}
            </div>
          </div>

          <div className="w-px bg-[#162a40]" />

          <div>
            <div className="text-[10px] font-['Orbitron'] text-[#647d96] tracking-widest">BONUS SCORE</div>
            <div className="font-['Orbitron'] font-black text-xl text-[#19e3ff] mt-1 tabular-nums">
              +{rewardScore.toLocaleString()}
            </div>
          </div>
        </div>

        <p className="text-xs text-[#7089a3] mb-6">
          Proceeding to <span className="font-bold text-[#19e3ff]">{nextZone.name}</span>. Hazard density increasing.
        </p>

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-[#2dffd6] hover:bg-[#68ffe2] text-[#030914] font-['Orbitron'] font-black text-sm tracking-widest cut transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(45,255,214,0.6)]"
        >
          <span>ENTER NEXT SECTOR</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

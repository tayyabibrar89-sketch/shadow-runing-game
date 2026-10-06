/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Target } from 'lucide-react';
import { MISSION_DEFS } from '../game/constants';
import { MissionProgress } from '../game/types';
import { AudioManager } from '../game/audio';

interface MissionsModalProps {
  missions: Record<string, MissionProgress>;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({ missions, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#02050b]/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#070d17]/95 border border-[#162a40] cut p-5 sm:p-7 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#142338]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                AudioManager.play('click');
                onClose();
              }}
              className="p-2 bg-[#0b1626] border border-[#1a324d] hover:border-[#19e3ff] text-[#869ab0] hover:text-white rounded transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-['Orbitron'] font-bold text-lg sm:text-xl text-white tracking-widest">
              ACTIVE DIRECTIVES
            </h2>
          </div>
        </div>

        {/* Missions List */}
        <div className="flex flex-col gap-3.5 mt-5 max-h-[60vh] overflow-y-auto pr-1">
          {MISSION_DEFS.map((def) => {
            const m = missions[def.id] || { tier: 0, target: def.base, progress: 0 };
            const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
            const reward = def.reward(m.target);

            return (
              <div
                key={def.id}
                className="p-4 bg-[#0a1424] border border-[#15253a] cut flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#2dffd6]" />
                    <span className="font-['Orbitron'] font-bold text-sm text-white tracking-wider">
                      {def.name}
                    </span>
                    <span className="text-[10px] font-['Orbitron'] px-1.5 py-0.5 bg-[#122436] text-[#19e3ff] border border-[#19e3ff]/30 rounded">
                      TIER {m.tier + 1}
                    </span>
                  </div>

                  <span className="font-['Orbitron'] font-bold text-xs text-[#ffd257] tracking-wider">
                    +{reward.toLocaleString()} CREDITS
                  </span>
                </div>

                <div className="text-xs text-[#7089a3]">{def.fmt(m.target)}</div>

                {/* Progress bar */}
                <div className="mt-1">
                  <div className="h-2 w-full bg-[#101b2a] border border-[#182a40] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2dffd6] to-[#19e3ff] transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-['Orbitron'] text-[#5e7791] mt-1 tabular-nums">
                    <span>
                      {Math.floor(m.progress).toLocaleString()} / {m.target.toLocaleString()}
                    </span>
                    <span>{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

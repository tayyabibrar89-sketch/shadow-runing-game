/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { UPGRADES } from '../game/constants';
import { UpgradeTiers } from '../game/types';
import { AudioManager } from '../game/audio';

interface ShopModalProps {
  upgrades: UpgradeTiers;
  coins: number;
  onUpgrade: (key: keyof UpgradeTiers) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  upgrades,
  coins,
  onUpgrade,
  onClose,
}) => {
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
              CYBERNETIC WORKSHOP
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-[#0c1626] border border-[#19324d] px-3 py-1.5 cut-sm">
            <div className="w-3.5 h-3.5 rounded-full bg-[#ffd257] border border-[#8a5a00]" />
            <span className="font-['Orbitron'] font-bold text-xs sm:text-sm text-[#ffd257] tabular-nums">
              {coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="flex flex-col gap-3.5 mt-5 max-h-[60vh] overflow-y-auto pr-1">
          {Object.values(UPGRADES).map((upg) => {
            const currentLevel = upgrades[upg.id];
            const isMaxed = currentLevel >= upg.max;
            const cost = isMaxed ? 0 : upg.costs[currentLevel];
            const canAfford = coins >= cost;

            return (
              <div
                key={upg.id}
                className="p-4 bg-[#0a1424] border border-[#15253a] cut flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-['Orbitron'] font-bold text-sm text-white tracking-wider">
                      {upg.name}
                    </span>
                    {isMaxed && (
                      <span className="text-[10px] font-['Orbitron'] font-bold px-1.5 py-0.5 bg-[#142d26] text-[#2dffd6] border border-[#2dffd6]/40 rounded">
                        MAX
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7089a3] mt-1">{upg.desc}</p>

                  {/* Level Pips */}
                  <div className="flex gap-1.5 mt-2.5">
                    {Array.from({ length: upg.max }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-6 rounded-xs transition-colors ${
                          i < currentLevel
                            ? 'bg-[#19e3ff] shadow-[0_0_6px_rgba(25,227,255,0.7)]'
                            : 'bg-[#142338]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="shrink-0">
                  {isMaxed ? (
                    <div className="px-4 py-2 bg-[#0c1a16] border border-[#1b3d32] text-[#2dffd6] font-['Orbitron'] text-xs font-bold cut-sm flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>OPTIMAL</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          AudioManager.play('power');
                          onUpgrade(upg.id);
                        }
                      }}
                      disabled={!canAfford}
                      className={`px-4 py-2 font-['Orbitron'] font-bold text-xs tracking-wider cut-sm border transition-colors flex items-center gap-2 ${
                        canAfford
                          ? 'bg-[#1a1708] border-[#ffd257] text-[#ffd257] hover:bg-[#2b250c] cursor-pointer'
                          : 'bg-[#0d141e] border-[#18273a] text-[#4d6075] cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>UPGRADE · {cost.toLocaleString()}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

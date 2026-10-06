/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { SKINS, TRAILS } from '../game/constants';
import { SkinId, TrailId } from '../game/types';
import { AudioManager } from '../game/audio';

interface CharacterSelectProps {
  currentSkin: SkinId;
  ownedSkins: SkinId[];
  currentTrail: TrailId;
  ownedTrails: TrailId[];
  coins: number;
  onSelectSkin: (id: SkinId) => void;
  onBuySkin: (id: SkinId) => void;
  onSelectTrail: (id: TrailId) => void;
  onBuyTrail: (id: TrailId) => void;
  onClose: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  currentSkin,
  ownedSkins,
  currentTrail,
  ownedTrails,
  coins,
  onSelectSkin,
  onBuySkin,
  onSelectTrail,
  onBuyTrail,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'trails'>('skins');

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#02050b]/85 backdrop-blur-md">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#070d17]/95 border border-[#162a40] cut p-5 sm:p-7 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
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
              CYBER GEAR DECK
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-[#0c1626] border border-[#19324d] px-3 py-1.5 cut-sm">
            <div className="w-3.5 h-3.5 rounded-full bg-[#ffd257] border border-[#8a5a00]" />
            <span className="font-['Orbitron'] font-bold text-xs sm:text-sm text-[#ffd257] tabular-nums">
              {coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 my-4">
          <button
            onClick={() => {
              AudioManager.play('click');
              setActiveTab('skins');
            }}
            className={`font-['Orbitron'] font-bold text-xs tracking-wider px-4 py-2 cut-sm border transition-colors cursor-pointer ${
              activeTab === 'skins'
                ? 'bg-[#122840] border-[#19e3ff] text-[#19e3ff]'
                : 'bg-[#091322] border-[#16273c] text-[#647d96] hover:text-white'
            }`}
          >
            EXOSKELETON SUITS
          </button>
          <button
            onClick={() => {
              AudioManager.play('click');
              setActiveTab('trails');
            }}
            className={`font-['Orbitron'] font-bold text-xs tracking-wider px-4 py-2 cut-sm border transition-colors cursor-pointer ${
              activeTab === 'trails'
                ? 'bg-[#122840] border-[#19e3ff] text-[#19e3ff]'
                : 'bg-[#091322] border-[#16273c] text-[#647d96] hover:text-white'
            }`}
          >
            ENERGY TRAILS
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'skins' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(SKINS).map((skin) => {
                const isOwned = ownedSkins.includes(skin.id);
                const isEquipped = currentSkin === skin.id;
                const canAfford = coins >= skin.cost;

                return (
                  <div
                    key={skin.id}
                    className={`p-4 bg-[#0a1424] border cut transition-all ${
                      isEquipped
                        ? 'border-[#19e3ff] shadow-[0_0_18px_rgba(25,227,255,0.2)]'
                        : 'border-[#15253a] hover:border-[#223d5e]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-['Orbitron'] font-bold text-sm text-white tracking-wider">
                          {skin.name}
                        </h3>
                        <p className="text-xs text-[#7089a3] mt-1 leading-relaxed">
                          {skin.description}
                        </p>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border border-white/20 shrink-0 shadow-sm"
                        style={{ backgroundColor: skin.glowColor }}
                      />
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#122033] flex items-center justify-between">
                      {isOwned ? (
                        <button
                          onClick={() => {
                            AudioManager.play('click');
                            onSelectSkin(skin.id);
                          }}
                          disabled={isEquipped}
                          className={`w-full py-2 font-['Orbitron'] font-bold text-xs tracking-wider cut-sm border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isEquipped
                              ? 'bg-[#10273a] border-[#19e3ff] text-[#19e3ff] cursor-default'
                              : 'bg-[#0e1c2e] border-[#1f3b5c] text-white hover:border-[#19e3ff]'
                          }`}
                        >
                          {isEquipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>EQUIPPED</span>
                            </>
                          ) : (
                            <span>EQUIP SUIT</span>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              AudioManager.play('power');
                              onBuySkin(skin.id);
                            }
                          }}
                          disabled={!canAfford}
                          className={`w-full py-2 font-['Orbitron'] font-bold text-xs tracking-wider cut-sm border flex items-center justify-center gap-2 transition-colors ${
                            canAfford
                              ? 'bg-[#1a1708] border-[#ffd257] text-[#ffd257] hover:bg-[#2e290f] cursor-pointer'
                              : 'bg-[#0d141e] border-[#18273a] text-[#4d6075] cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>UNLOCK · {skin.cost.toLocaleString()} CREDITS</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(TRAILS).map((trail) => {
                const isOwned = ownedTrails.includes(trail.id);
                const isEquipped = currentTrail === trail.id;
                const canAfford = coins >= trail.cost;

                return (
                  <div
                    key={trail.id}
                    className={`p-4 bg-[#0a1424] border cut transition-all ${
                      isEquipped
                        ? 'border-[#19e3ff] shadow-[0_0_18px_rgba(25,227,255,0.2)]'
                        : 'border-[#15253a] hover:border-[#223d5e]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-['Orbitron'] font-bold text-sm text-white tracking-wider">
                          {trail.name}
                        </h3>
                        <p className="text-xs text-[#7089a3] mt-1 leading-relaxed">
                          {trail.description}
                        </p>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border border-white/20 shrink-0 shadow-sm"
                        style={{ backgroundColor: trail.color || '#334455' }}
                      />
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#122033] flex items-center justify-between">
                      {isOwned ? (
                        <button
                          onClick={() => {
                            AudioManager.play('click');
                            onSelectTrail(trail.id);
                          }}
                          disabled={isEquipped}
                          className={`w-full py-2 font-['Orbitron'] font-bold text-xs tracking-wider cut-sm border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isEquipped
                              ? 'bg-[#10273a] border-[#19e3ff] text-[#19e3ff] cursor-default'
                              : 'bg-[#0e1c2e] border-[#1f3b5c] text-white hover:border-[#19e3ff]'
                          }`}
                        >
                          {isEquipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>ACTIVE TRAIL</span>
                            </>
                          ) : (
                            <span>ACTIVATE TRAIL</span>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              AudioManager.play('power');
                              onBuyTrail(trail.id);
                            }
                          }}
                          disabled={!canAfford}
                          className={`w-full py-2 font-['Orbitron'] font-bold text-xs tracking-wider cut-sm border flex items-center justify-center gap-2 transition-colors ${
                            canAfford
                              ? 'bg-[#1a1708] border-[#ffd257] text-[#ffd257] hover:bg-[#2e290f] cursor-pointer'
                              : 'bg-[#0d141e] border-[#18273a] text-[#4d6075] cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>UNLOCK · {trail.cost.toLocaleString()} CREDITS</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

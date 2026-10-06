/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Pause, Zap, CloudRain, Cloud, Flame, Wind } from 'lucide-react';
import { PowerUpKind, RunStats } from '../game/types';
import { POW_META, ZONES } from '../game/constants';

interface HUDProps {
  stats: RunStats;
  hp: number;
  maxHp: number;
  bestScore: number;
  specialCd: number;
  bossHp: number;
  maxBossHp: number;
  zoneIndex: number;
  weather?: { label: string; type: string };
  activePows: Record<PowerUpKind, number>;
  onPause: () => void;
  onCastSpecial: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  hp,
  maxHp,
  bestScore,
  specialCd,
  bossHp,
  maxBossHp,
  zoneIndex,
  weather,
  activePows,
  onPause,
  onCastSpecial,
}) => {
  const currentZone = ZONES[zoneIndex % ZONES.length];
  const pulseReady = specialCd <= 0;
  const pulsePercent = Math.min(100, Math.max(0, ((10 - specialCd) / 10) * 100));

  // Active power-up list
  const activePowerUpList = (Object.keys(activePows) as PowerUpKind[]).filter(
    (k) => activePows[k] > 0
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6 font-['Rajdhani'] select-none">
      {/* Top Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Score & Health */}
        <div className="flex flex-col gap-1">
          <div className="font-['Orbitron'] font-black text-2xl sm:text-3xl text-white tracking-wider drop-shadow-[0_0_12px_rgba(25,227,255,0.6)] tabular-nums">
            {stats.score.toLocaleString()}
          </div>
          <div className="text-xs font-semibold tracking-widest text-[#647d96]">
            BEST {bestScore.toLocaleString()}
          </div>

          {/* Hearts Health Bar */}
          <div className="flex gap-1.5 mt-1.5">
            {Array.from({ length: maxHp }).map((_, i) => {
              const active = i < hp;
              return (
                <div
                  key={i}
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                    active ? 'scale-100' : 'scale-90 opacity-30'
                  }`}
                >
                  <svg viewBox="0 0 20 20" className="w-full h-full">
                    <path
                      d="M10 17 C2 11 1 5 5 3 C7.5 1.7 9.3 3.4 10 5 C10.7 3.4 12.5 1.7 15 3 C19 5 18 11 10 17Z"
                      fill={active ? '#ff2d78' : '#1a2232'}
                      stroke={active ? '#ff7fa8' : '#2a354a'}
                      strokeWidth="1.4"
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Zone & Distance */}
        <div className="flex flex-col items-center text-center">
          <div className="font-['Orbitron'] text-xs font-bold tracking-[0.25em] text-[#19e3ff] drop-shadow-[0_0_8px_rgba(25,227,255,0.4)]">
            {currentZone.name}
          </div>
          <div className="font-['Orbitron'] font-bold text-lg sm:text-xl text-white tracking-wider tabular-nums mt-0.5">
            {stats.meters.toLocaleString()} m
          </div>

          {/* Dynamic Weather Condition Indicator */}
          {weather && (
            <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-[#091522]/80 border border-[#162a40] text-[9px] font-['Orbitron'] font-bold tracking-widest text-[#7de8ff] cut-sm">
              {weather.type === 'neon_rain' && <CloudRain className="w-2.5 h-2.5 text-[#19e3ff]" />}
              {weather.type === 'toxic_steam' && <Cloud className="w-2.5 h-2.5 text-[#2dffd6]" />}
              {weather.type === 'molten_ash' && <Flame className="w-2.5 h-2.5 text-[#ff8533]" />}
              {weather.type === 'ion_aurora' && <Wind className="w-2.5 h-2.5 text-[#b48bff]" />}
              <span className="truncate max-w-[150px]">{weather.label}</span>
            </div>
          )}

          {/* Boss HP Bar */}
          {bossHp > 0 && (
            <div className="mt-2 w-64 sm:w-80 bg-[#0e0714] border border-[#ff2d78]/60 p-1 cut-sm">
              <div className="flex justify-between text-[10px] font-['Orbitron'] tracking-widest text-[#ff2d78] mb-1 font-bold">
                <span>MEGA DRONE BOSS</span>
                <span>{Math.round((bossHp / maxBossHp) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-[#1b0d26]">
                <div
                  className="h-full bg-gradient-to-r from-[#ff2d78] to-[#ff7a2d] transition-all duration-150 shadow-[0_0_8px_rgba(255,45,120,0.8)]"
                  style={{ width: `${Math.max(0, (bossHp / maxBossHp) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Coins & Active Power-Ups */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-[#070c16]/90 border border-[#16283e] px-3 py-1.5 cut-sm">
            <div className="w-4 h-4 rounded-full bg-[#ffd257] border border-[#8a5a00] shadow-[0_0_8px_rgba(255,200,87,0.7)]" />
            <span className="font-['Orbitron'] font-bold text-sm sm:text-base text-[#ffd257] tabular-nums">
              {stats.runCoins.toLocaleString()}
            </span>
            <button
              onClick={onPause}
              className="pointer-events-auto ml-2 p-1.5 hover:text-[#19e3ff] text-[#869ab0] hover:bg-[#122033] rounded transition-colors"
              title="Pause (P)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Power-up Pills */}
          <div className="flex flex-col gap-1.5 items-end">
            {activePowerUpList.map((k) => {
              const meta = POW_META[k];
              const maxDur = meta.duration || 1;
              const remaining = activePows[k];
              const pct = Math.min(100, Math.max(0, (remaining / maxDur) * 100));

              return (
                <div
                  key={k}
                  className="bg-[#070c16]/90 border border-[#16283e] px-2.5 py-1 min-w-[110px] cut-sm"
                  style={{ borderRightColor: meta.color, borderRightWidth: '3px' }}
                >
                  <div className="flex justify-between text-[10px] font-['Orbitron'] font-bold text-white tracking-wider">
                    <span>{meta.name}</span>
                    <span style={{ color: meta.color }}>{remaining.toFixed(1)}s</span>
                  </div>
                  <div className="h-1 bg-[#101c2c] w-full mt-1">
                    <div
                      className="h-full transition-all duration-75"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center Combo Pop */}
      {stats.combo >= 4 && (
        <div className="self-start ml-2 sm:ml-4 bg-[#0a1220]/80 border border-[#ffc857]/40 px-3 py-1.5 cut-sm animate-pulse">
          <div className="font-['Orbitron'] font-black text-2xl sm:text-3xl text-[#ffd257] drop-shadow-[0_0_10px_rgba(255,200,87,0.6)]">
            x{stats.combo}
          </div>
          <div className="text-[10px] font-bold tracking-widest text-[#88a0b8]">
            CHAIN MULTIPLIER
          </div>
        </div>
      )}

      {/* Bottom Row: EMP Pulse Ability Button / Indicator */}
      <div className="flex items-end justify-between w-full">
        <button
          onClick={onCastSpecial}
          disabled={!pulseReady}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 cut border transition-all ${
            pulseReady
              ? 'bg-[#0a1e30] border-[#19e3ff] text-white hover:bg-[#123150] shadow-[0_0_16px_rgba(25,227,255,0.4)] cursor-pointer'
              : 'bg-[#080d16]/80 border-[#16283e] text-[#556980] cursor-not-allowed'
          }`}
          title="EMP Shockwave (SPACE / E)"
        >
          <div className={`p-1.5 rounded ${pulseReady ? 'bg-[#19e3ff] text-[#030810]' : 'bg-[#141f2d] text-[#4a5c70]'}`}>
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col text-left">
            <span className={`font-['Orbitron'] font-bold text-xs tracking-widest ${pulseReady ? 'text-[#19e3ff]' : 'text-[#647d96]'}`}>
              {pulseReady ? 'EMP PULSE READY' : 'EMP CHARGING'}
            </span>
            <div className="w-24 sm:w-32 h-1.5 bg-[#0f1926] mt-1 border border-[#1c3048]">
              <div
                className="h-full bg-[#19e3ff] transition-all duration-100"
                style={{ width: `${pulsePercent}%` }}
              />
            </div>
          </div>
        </button>

        {/* Keyboard hints */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-semibold text-[#5a728a] tracking-wider">
          <span><kbd className="px-1.5 py-0.5 bg-[#0d1624] border border-[#1c3048] text-[#869ab0] rounded">A / D</kbd> LANE</span>
          <span><kbd className="px-1.5 py-0.5 bg-[#0d1624] border border-[#1c3048] text-[#869ab0] rounded">W / UP</kbd> JUMP</span>
          <span><kbd className="px-1.5 py-0.5 bg-[#0d1624] border border-[#1c3048] text-[#869ab0] rounded">S / DOWN</kbd> SLIDE</span>
          <span><kbd className="px-1.5 py-0.5 bg-[#0d1624] border border-[#1c3048] text-[#869ab0] rounded">SPACE</kbd> EMP</span>
        </div>
      </div>
    </div>
  );
};

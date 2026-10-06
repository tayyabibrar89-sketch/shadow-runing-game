/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SkinId = 'street' | 'ninja' | 'soldier' | 'shadow';
export type TrailId = 'none' | 'ember' | 'electric' | 'void';
export type PowerUpKind = 'shield' | 'magnet' | 'speed' | 'x2' | 'slow' | 'health';
export type QualitySetting = 'low' | 'medium' | 'high';
export type CameraSetting = 'dynamic' | 'close';

export interface UserSettings {
  music: boolean;
  sound: boolean;
  vib: boolean;
  quality: QualitySetting;
  cameraMode: CameraSetting;
}

export interface UpgradeTiers {
  vit: number;     // max HP boost
  shield: number;  // duration
  coin: number;    // coin value %
  speed: number;   // base speed boost %
}

export interface MissionProgress {
  tier: number;
  target: number;
  progress: number;
}

export interface DailyRewardState {
  lastClaimDate: string; // YYYY-MM-DD
  streak: number; // 0 to 7 (consecutive days)
  totalClaims: number;
}

export interface SaveData {
  best: number;
  coins: number;
  skin: SkinId;
  ownedSkins: SkinId[];
  trail: TrailId;
  ownedTrails: TrailId[];
  upg: UpgradeTiers;
  missions: Record<string, MissionProgress>;
  settings: UserSettings;
  dailyRewards: DailyRewardState;
}

export type GameState =
  | 'loading'
  | 'menu'
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'victory'
  | 'shop'
  | 'chars'
  | 'missions'
  | 'settings'
  | 'daily';

export interface RunStats {
  score: number;
  meters: number;
  runCoins: number;
  kills: number;
  combo: number;
  maxCombo: number;
  powsCollected: number;
  runTime: number;
  bossesDefeated: number;
}

export interface SkinConfig {
  id: SkinId;
  name: string;
  cost: number;
  suitColor: string;
  accentColor: string;
  glowColor: string;
  visorColor: string;
  description: string;
  hasRibbon?: boolean;
  hasPauldrons?: boolean;
  hasAura?: boolean;
}

export interface TrailConfig {
  id: TrailId;
  name: string;
  cost: number;
  color: string | null;
  description: string;
}

export interface ZoneConfig {
  id: number;
  name: string;
  fogColor: number;
  skyColor: number;
  accentColor: number;
  neonColor: string;
  groundColor: number;
  description: string;
}

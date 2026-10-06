/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkinConfig, TrailConfig, ZoneConfig, PowerUpKind } from './types';

export const LANES = [-2.8, 0, 2.8] as const;
export const LANE_WIDTH = 2.8;
export const ROAD_WIDTH = 10.4;
export const BOSS_ZONE_DISTANCE = 1200; // meters per zone / boss encounter

export const SKINS: Record<string, SkinConfig> = {
  street: {
    id: 'street',
    name: 'Street Runner',
    cost: 0,
    suitColor: '#1e2d3d',
    accentColor: '#19e3ff',
    glowColor: '#19e3ff',
    visorColor: '#7df3ff',
    description: 'Standard cyber-scout armor tailored for agile city traversal.',
  },
  ninja: {
    id: 'ninja',
    name: 'Cyber Shinobi',
    cost: 500,
    suitColor: '#2b0e24',
    accentColor: '#ff2d78',
    glowColor: '#ff2d78',
    visorColor: '#ff94bc',
    description: 'Black-ops stealth exoskeleton equipped with twin energy ribbons.',
    hasRibbon: true,
  },
  soldier: {
    id: 'soldier',
    name: 'Neon Vanguard',
    cost: 1200,
    suitColor: '#2d2410',
    accentColor: '#ffc857',
    glowColor: '#ffc857',
    visorColor: '#ffe9ab',
    description: 'Reinforced industrial assault frame with heavy pauldrons.',
    hasPauldrons: true,
  },
  shadow: {
    id: 'shadow',
    name: 'Astral Phantom',
    cost: 2500,
    suitColor: '#140c26',
    accentColor: '#a06bff',
    glowColor: '#a06bff',
    visorColor: '#e0c8ff',
    description: 'Experimental rift walker bathed in an astral resonance field.',
    hasAura: true,
  },
};

export const TRAILS: Record<string, TrailConfig> = {
  none: {
    id: 'none',
    name: 'Standard Jet',
    cost: 0,
    color: null,
    description: 'Stock thruster exhaust plume.',
  },
  ember: {
    id: 'ember',
    name: 'Solar Plasma',
    cost: 350,
    color: '#ff7a2d',
    description: 'Incandescent fiery trails and floating thermal sparks.',
  },
  electric: {
    id: 'electric',
    name: 'Cyan Overdrive',
    cost: 700,
    color: '#19e3ff',
    description: 'High-voltage electric ribbon with lightning afterimages.',
  },
  void: {
    id: 'void',
    name: 'Void Singularity',
    cost: 1200,
    color: '#a06bff',
    description: 'Pulsing dimensional distortions and violet particle vortices.',
  },
};

export interface UpgradeDef {
  id: 'vit' | 'shield' | 'coin' | 'speed';
  name: string;
  desc: string;
  max: number;
  costs: number[];
}

export const UPGRADES: Record<string, UpgradeDef> = {
  vit: {
    id: 'vit',
    name: 'NANO VITALITY',
    desc: '+1 maximum health hearts for each run',
    max: 2,
    costs: [400, 900],
  },
  shield: {
    id: 'shield',
    name: 'BARRIER CORE',
    desc: '+2.5s duration for protective energy shield',
    max: 3,
    costs: [250, 500, 800],
  },
  coin: {
    id: 'coin',
    name: 'PROFIT MATRIX',
    desc: '+15% increased coin reward value',
    max: 5,
    costs: [250, 450, 750, 1100, 1500],
  },
  speed: {
    id: 'speed',
    name: 'KINETIC OVERCLOCK',
    desc: '+5% higher running speed and multiplier boost',
    max: 3,
    costs: [300, 600, 950],
  },
};

export const POW_META: Record<PowerUpKind, { name: string; color: string; duration: number }> = {
  shield: { name: 'SHIELD', color: '#19e3ff', duration: 7 },
  magnet: { name: 'MAGNET', color: '#ff2d78', duration: 8 },
  speed: { name: 'NITRO BOOST', color: '#ffc857', duration: 6 },
  x2: { name: 'DOUBLE COINS', color: '#ffd257', duration: 9 },
  health: { name: 'NANO HEAL', color: '#2dffd6', duration: 0 },
  slow: { name: 'CHRONO SLOW', color: '#a06bff', duration: 5 },
};

export const ZONES: ZoneConfig[] = [
  {
    id: 0,
    name: 'NEO CYBER CITY',
    fogColor: 0x050c18,
    skyColor: 0x081326,
    accentColor: 0x19e3ff,
    neonColor: '#19e3ff',
    groundColor: 0x07111e,
    description: 'Neon-drenched megacity highway illuminated by holographic towers.',
  },
  {
    id: 1,
    name: 'SUB-SECTOR TUNNEL',
    fogColor: 0x031310,
    skyColor: 0x041c18,
    accentColor: 0x2dffd6,
    neonColor: '#2dffd6',
    groundColor: 0x03120f,
    description: 'Subterranean transit aqueduct with steam leaks and glowing conduits.',
  },
  {
    id: 2,
    name: 'INDUSTRIAL FOUNDRY',
    fogColor: 0x180b03,
    skyColor: 0x261105,
    accentColor: 0xffa033,
    neonColor: '#ffa033',
    groundColor: 0x140a04,
    description: 'Heavy manufacturing sector lined with blast vents and slag cranes.',
  },
  {
    id: 3,
    name: 'HIGHWAY ROOFTOPS',
    fogColor: 0x0c061a,
    skyColor: 0x170b30,
    accentColor: 0xb48bff,
    neonColor: '#b48bff',
    groundColor: 0x0e071c,
    description: 'Suspended sky-bridge connecting cloud piercing skyscrapers.',
  },
];

export interface MissionDef {
  id: string;
  name: string;
  base: number;
  multiplier: number;
  fmt: (v: number) => string;
  reward: (v: number) => number;
}

export const MISSION_DEFS: MissionDef[] = [
  {
    id: 'coins',
    name: 'CREDIT HARVESTER',
    base: 120,
    multiplier: 1.6,
    fmt: (v) => `Collect ${v} total credits`,
    reward: (v) => Math.min(650, Math.round((v * 1.2) / 10) * 10),
  },
  {
    id: 'dist',
    name: 'SYNTH RUNNER',
    base: 1500,
    multiplier: 1.6,
    fmt: (v) => `Cover ${v.toLocaleString()} m in distance`,
    reward: (v) => Math.round((v * 0.16) / 10) * 10,
  },
  {
    id: 'kills',
    name: 'DRONE EXTERMINATOR',
    base: 15,
    multiplier: 1.6,
    fmt: (v) => `Destroy ${v} drones or hazards`,
    reward: (v) => Math.round((v * 12) / 10) * 10,
  },
  {
    id: 'survive',
    name: 'ENDURANCE PROTOCOL',
    base: 90,
    multiplier: 1.5,
    fmt: (v) => `Survive ${v} seconds in one run`,
    reward: (v) => Math.round((v * 1.5) / 10) * 10,
  },
  {
    id: 'power',
    name: 'TECH ADAPTOR',
    base: 4,
    multiplier: 2.0,
    fmt: (v) => `Collect ${v} power-up capsules`,
    reward: (v) => v * 50,
  },
];

export interface DailyRewardItem {
  day: number;
  coins: number;
  bonusTitle: string;
  isSpecial?: boolean;
}

export const DAILY_REWARDS: DailyRewardItem[] = [
  { day: 1, coins: 150, bonusTitle: 'Starter Cache' },
  { day: 2, coins: 250, bonusTitle: 'Energy Pack' },
  { day: 3, coins: 400, bonusTitle: 'Cyber Stash' },
  { day: 4, coins: 600, bonusTitle: 'Data Vault' },
  { day: 5, coins: 850, bonusTitle: 'Neon Hoard' },
  { day: 6, coins: 1200, bonusTitle: 'Overclock Core' },
  { day: 7, coins: 2000, bonusTitle: 'GRAND JACKPOT MATRIX', isSpecial: true },
];

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SaveData } from './types';
import { MISSION_DEFS, DAILY_REWARDS, DailyRewardItem } from './constants';

const STORAGE_KEY = 'cyber_runner_3d_save_v1';

const DEFAULT_SAVE: SaveData = {
  best: 0,
  coins: 0,
  skin: 'street',
  ownedSkins: ['street'],
  trail: 'none',
  ownedTrails: ['none'],
  upg: {
    vit: 0,
    shield: 0,
    coin: 0,
    speed: 0,
  },
  missions: {},
  settings: {
    music: true,
    sound: true,
    vib: true,
    quality: 'high',
    cameraMode: 'dynamic',
  },
  dailyRewards: {
    lastClaimDate: '',
    streak: 0,
    totalClaims: 0,
  },
};

export const Storage = {
  data: JSON.parse(JSON.stringify(DEFAULT_SAVE)) as SaveData,
  saveTimeout: null as any,

  load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = {
          ...DEFAULT_SAVE,
          ...parsed,
          upg: { ...DEFAULT_SAVE.upg, ...(parsed.upg || {}) },
          settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
          dailyRewards: { ...DEFAULT_SAVE.dailyRewards, ...(parsed.dailyRewards || {}) },
        };
      }
    } catch {
      // Default fallback
    }

    // Ensure all mission entries exist
    if (!this.data.missions) this.data.missions = {};
    for (const def of MISSION_DEFS) {
      if (!this.data.missions[def.id]) {
        this.data.missions[def.id] = {
          tier: 0,
          target: def.base,
          progress: 0,
        };
      }
    }

    return this.data;
  },

  save() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch {
        // quota exceeded or private mode
      }
    }, 150);
  },

  reset(): SaveData {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
    for (const def of MISSION_DEFS) {
      this.data.missions[def.id] = {
        tier: 0,
        target: def.base,
        progress: 0,
      };
    }
    this.save();
    return this.data;
  },

  recordRun(score: number, coins: number): { isNewBest: boolean } {
    let isNewBest = false;
    if (score > this.data.best) {
      this.data.best = Math.floor(score);
      isNewBest = true;
    }
    this.data.coins += Math.floor(coins);
    this.save();
    return { isNewBest };
  },

  updateMission(id: string, delta: number, onComplete?: (reward: number, defName: string) => void) {
    const m = this.data.missions[id];
    const def = MISSION_DEFS.find((x) => x.id === id);
    if (!m || !def) return;

    m.progress += delta;
    if (m.progress >= m.target) {
      const reward = def.reward(m.target);
      this.data.coins += reward;
      m.tier += 1;
      m.target = Math.round(def.base * Math.pow(def.multiplier, m.tier));
      m.progress = 0;
      this.save();
      if (onComplete) onComplete(reward, def.name);
    } else {
      this.save();
    }
  },

  updateMissionMax(id: string, value: number, onComplete?: (reward: number, defName: string) => void) {
    const m = this.data.missions[id];
    const def = MISSION_DEFS.find((x) => x.id === id);
    if (!m || !def) return;

    if (value > m.progress) {
      m.progress = value;
      if (m.progress >= m.target) {
        const reward = def.reward(m.target);
        this.data.coins += reward;
        m.tier += 1;
        m.target = Math.round(def.base * Math.pow(def.multiplier, m.tier));
        m.progress = 0;
        this.save();
        if (onComplete) onComplete(reward, def.name);
      } else {
        this.save();
      }
    }
  },

  getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getDailyRewardStatus(): {
    canClaim: boolean;
    currentStreak: number;
    targetDay: number;
    hoursUntilNext: number;
    minutesUntilNext: number;
    lastClaimDate: string;
  } {
    const todayStr = this.getTodayDateString();
    const lastStr = this.data.dailyRewards?.lastClaimDate || '';
    const storedStreak = this.data.dailyRewards?.streak || 0;

    const now = new Date();
    const hoursUntilNext = 23 - now.getHours();
    const minutesUntilNext = 59 - now.getMinutes();

    if (!lastStr) {
      return {
        canClaim: true,
        currentStreak: 0,
        targetDay: 1,
        hoursUntilNext: 0,
        minutesUntilNext: 0,
        lastClaimDate: '',
      };
    }

    if (lastStr === todayStr) {
      return {
        canClaim: false,
        currentStreak: storedStreak,
        targetDay: storedStreak,
        hoursUntilNext,
        minutesUntilNext,
        lastClaimDate: lastStr,
      };
    }

    const todayParts = todayStr.split('-').map(Number);
    const lastParts = lastStr.split('-').map(Number);
    const todayDate = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
    const lastDate = new Date(lastParts[0], lastParts[1] - 1, lastParts[2]);

    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      const nextDay = (storedStreak % 7) + 1;
      return {
        canClaim: true,
        currentStreak: storedStreak,
        targetDay: nextDay,
        hoursUntilNext: 0,
        minutesUntilNext: 0,
        lastClaimDate: lastStr,
      };
    } else {
      return {
        canClaim: true,
        currentStreak: 0,
        targetDay: 1,
        hoursUntilNext: 0,
        minutesUntilNext: 0,
        lastClaimDate: lastStr,
      };
    }
  },

  claimDailyReward(): { reward: DailyRewardItem; newStreak: number; totalCoins: number } | null {
    const status = this.getDailyRewardStatus();
    if (!status.canClaim) return null;

    const targetDay = status.targetDay;
    const reward = DAILY_REWARDS[targetDay - 1];
    if (!reward) return null;

    this.data.coins += reward.coins;
    this.data.dailyRewards = {
      lastClaimDate: this.getTodayDateString(),
      streak: targetDay,
      totalClaims: (this.data.dailyRewards?.totalClaims || 0) + 1,
    };

    this.save();
    return {
      reward,
      newStreak: targetDay,
      totalCoins: this.data.coins,
    };
  },
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, Gift, Flame, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DAILY_REWARDS, DailyRewardItem } from '../game/constants';
import { AudioManager } from '../game/audio';
import { Storage } from '../game/storage';

interface DailyRewardsModalProps {
  onClose: () => void;
  onRewardClaimed: (coinsEarned: number) => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  onClose,
  onRewardClaimed,
}) => {
  const [status, setStatus] = useState(() => Storage.getDailyRewardStatus());
  const [justClaimedDay, setJustClaimedDay] = useState<number | null>(null);

  const handleClaim = (dayItem: DailyRewardItem) => {
    AudioManager.resumeOnUserInteraction();
    const result = Storage.claimDailyReward();
    if (result) {
      AudioManager.play('power');
      setJustClaimedDay(result.newStreak);
      setStatus(Storage.getDailyRewardStatus());
      onRewardClaimed(result.reward.coins);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd257', '#19e3ff', '#2dffd6', '#ff2d78'],
        });
      } catch {
        // safe
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#02050b]/85 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-[#070d17]/95 border border-[#162a40] cut p-5 sm:p-7 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.85)] max-h-[92vh] overflow-hidden">
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
            <div>
              <h2 className="font-['Orbitron'] font-bold text-lg sm:text-xl text-white tracking-widest flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#ffd257]" />
                <span>DAILY LOGIN MATRIX</span>
              </h2>
              <p className="text-xs text-[#647d96] mt-0.5">
                Maintain consecutive logins to unlock escalating high-yield credit caches
              </p>
            </div>
          </div>

          {/* Streak indicator badge */}
          <div className="flex items-center gap-2 bg-[#120f24] border border-[#ff7a2d]/50 px-3 py-1.5 cut-sm">
            <Flame className="w-4 h-4 text-[#ff7a2d]" />
            <div className="text-right">
              <div className="text-[9px] font-['Orbitron'] text-[#8f96a3] tracking-widest">ACTIVE STREAK</div>
              <div className="font-['Orbitron'] font-bold text-xs sm:text-sm text-[#ff9e58] tabular-nums">
                {status.currentStreak} {status.currentStreak === 1 ? 'DAY' : 'DAYS'}
              </div>
            </div>
          </div>
        </div>

        {/* Status banner */}
        <div className="mt-4 p-3 bg-[#0a1524] border border-[#152a42] cut-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {status.canClaim ? (
              <>
                <Sparkles className="w-4 h-4 text-[#ffd257] animate-pulse" />
                <span className="text-[#ffd257] font-['Orbitron'] tracking-wider">
                  DAY {status.targetDay} REWARD IS READY TO CLAIM!
                </span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-[#2dffd6]" />
                <span className="text-[#2dffd6] font-['Orbitron'] tracking-wider">
                  TODAY'S REWARD SECURED
                </span>
              </>
            )}
          </div>

          {!status.canClaim && (
            <div className="text-xs font-['Orbitron'] text-[#647d96] tracking-wider tabular-nums">
              NEXT UNLOCK IN <span className="text-white font-bold">{status.hoursUntilNext}h {status.minutesUntilNext}m</span>
            </div>
          )}
        </div>

        {/* 7-Days Reward Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 my-5 overflow-y-auto pr-1 flex-1">
          {DAILY_REWARDS.map((reward) => {
            const isClaimed =
              (!status.canClaim && reward.day <= status.currentStreak) ||
              (status.canClaim && reward.day < status.targetDay) ||
              justClaimedDay === reward.day;

            const isCurrentTarget = status.canClaim && reward.day === status.targetDay;
            const isLocked = !isClaimed && !isCurrentTarget;

            return (
              <div
                key={reward.day}
                className={`p-3 cut flex flex-col justify-between text-center transition-all relative ${
                  reward.isSpecial ? 'col-span-2 sm:col-span-2 lg:col-span-1' : ''
                } ${
                  isCurrentTarget
                    ? 'bg-[#0f243b] border-2 border-[#19e3ff] shadow-[0_0_20px_rgba(25,227,255,0.35)] scale-[1.02]'
                    : isClaimed
                    ? 'bg-[#0a1622] border border-[#1b364e] opacity-75'
                    : 'bg-[#08101a] border border-[#122030] opacity-55'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between text-[10px] font-['Orbitron'] font-bold tracking-wider">
                  <span className={isCurrentTarget ? 'text-[#19e3ff]' : isClaimed ? 'text-[#2dffd6]' : 'text-[#50667e]'}>
                    DAY {reward.day}
                  </span>
                  {reward.isSpecial && (
                    <span className="text-[8px] bg-[#2a1b08] text-[#ffd257] px-1 py-0.5 border border-[#ffd257]/40 rounded-xs">
                      JACKPOT
                    </span>
                  )}
                </div>

                {/* Coin Graphics */}
                <div className="my-3 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm transition-transform ${
                      isCurrentTarget
                        ? 'bg-[#292209] border-[#ffd257] text-[#ffd257] scale-110 shadow-[0_0_12px_rgba(255,210,87,0.5)]'
                        : isClaimed
                        ? 'bg-[#0e211b] border-[#2dffd6] text-[#2dffd6]'
                        : 'bg-[#101b28] border-[#1e3044] text-[#4d637c]'
                    }`}
                  >
                    {isClaimed ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Gift className="w-5 h-5" />
                    )}
                  </div>

                  <div className="font-['Orbitron'] font-bold text-sm sm:text-base text-white mt-2 tabular-nums">
                    +{reward.coins.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#6d88a3] tracking-wider truncate max-w-full">
                    {reward.bonusTitle}
                  </div>
                </div>

                {/* Bottom Action / State */}
                <div className="mt-1">
                  {isCurrentTarget ? (
                    <button
                      onClick={() => handleClaim(reward)}
                      className="w-full py-1.5 bg-[#19e3ff] hover:bg-[#52eaff] text-[#030914] font-['Orbitron'] font-bold text-[10px] tracking-widest cut-sm shadow-[0_0_12px_rgba(25,227,255,0.6)] cursor-pointer active:scale-95 transition-transform"
                    >
                      CLAIM
                    </button>
                  ) : isClaimed ? (
                    <div className="py-1 text-[10px] font-['Orbitron'] font-bold text-[#2dffd6] tracking-wider">
                      CLAIMED
                    </div>
                  ) : (
                    <div className="py-1 text-[10px] font-['Orbitron'] text-[#4a5f75] tracking-wider">
                      LOCKED
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[#142338] flex items-center justify-between text-xs text-[#5f7891]">
          <span>Log in each day to progress toward the Day 7 Grand Jackpot Matrix (+2,000 credits).</span>
          <button
            onClick={() => {
              AudioManager.play('click');
              onClose();
            }}
            className="px-4 py-1.5 bg-[#0e1b2b] hover:bg-[#152a42] border border-[#1c3552] text-white font-['Orbitron'] font-bold text-xs cut-sm cursor-pointer transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};

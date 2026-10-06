/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/three/GameEngine';
import { Storage } from './game/storage';
import { AudioManager } from './game/audio';
import { GameState, PowerUpKind, RunStats, SkinId, TrailId, UserSettings, UpgradeTiers } from './game/types';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { MainMenu } from './components/MainMenu';
import { CharacterSelect } from './components/CharacterSelect';
import { ShopModal } from './components/ShopModal';
import { MissionsModal } from './components/MissionsModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App UI State
  const [gameState, setGameState] = useState<GameState>('menu');
  const [saveData, setSaveData] = useState(() => Storage.load());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-Game Live HUD State
  const [liveStats, setLiveStats] = useState<RunStats>({
    score: 0,
    meters: 0,
    runCoins: 0,
    kills: 0,
    combo: 0,
    maxCombo: 0,
    powsCollected: 0,
    runTime: 0,
    bossesDefeated: 0,
  });
  const [liveHp, setLiveHp] = useState(3);
  const [liveMaxHp, setLiveMaxHp] = useState(3);
  const [liveSpecialCd, setLiveSpecialCd] = useState(0);
  const [liveBossHp, setLiveBossHp] = useState(0);
  const [liveMaxBossHp, setLiveMaxBossHp] = useState(30);
  const [liveZoneIndex, setLiveZoneIndex] = useState(0);
  const [liveWeather, setLiveWeather] = useState<{ label: string; type: string }>({
    label: 'NEON ACID RAIN',
    type: 'neon_rain',
  });
  const [activePows, setActivePows] = useState<Record<PowerUpKind, number>>({
    shield: 0,
    magnet: 0,
    speed: 0,
    x2: 0,
    slow: 0,
    health: 0,
  });

  // End run modal data
  const [isNewBestRecord, setIsNewBestRecord] = useState(false);
  const [victoryData, setVictoryData] = useState<{ zone: number; coins: number; score: number } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  // Initialize Three.js Engine once container mounts
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;

    engine.onStatsUpdate = (stats, pows, hp, maxHp, cd, bossHp, maxBossHp, weatherInfo) => {
      setLiveStats(stats);
      setActivePows({ ...pows });
      setLiveHp(hp);
      setLiveMaxHp(maxHp);
      setLiveSpecialCd(cd);
      setLiveBossHp(bossHp);
      setLiveMaxBossHp(maxBossHp);
      setLiveZoneIndex(engine.currentZoneIndex);
      if (weatherInfo) {
        setLiveWeather(weatherInfo);
      }
    };

    engine.onGameOver = (finalStats, isNewBest) => {
      setLiveStats(finalStats);
      setIsNewBestRecord(isNewBest);
      setSaveData({ ...Storage.load() });
      setGameState('gameover');
    };

    engine.onVictory = (zoneIdx, rwCoins, rwScore) => {
      setVictoryData({ zone: zoneIdx, coins: rwCoins, score: rwScore });
      setSaveData({ ...Storage.load() });
      setGameState('victory');
    };

    engine.onToast = (msg) => {
      showToast(msg);
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [showToast]);

  // Check and prompt daily reward if claimable
  useEffect(() => {
    const status = Storage.getDailyRewardStatus();
    if (status.canClaim) {
      setGameState('daily');
    }
  }, []);

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling default keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      AudioManager.resumeOnUserInteraction();

      if (gameState === 'playing' && engineRef.current) {
        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
          case 'A':
            engineRef.current.shiftLane(-1);
            break;

          case 'ArrowRight':
          case 'd':
          case 'D':
            engineRef.current.shiftLane(1);
            break;

          case 'ArrowUp':
          case 'w':
          case 'W':
            engineRef.current.jump();
            break;

          case 'ArrowDown':
          case 's':
          case 'S':
            engineRef.current.slide();
            break;

          case ' ':
          case 'e':
          case 'E':
            engineRef.current.castSpecial();
            break;

          case 'p':
          case 'P':
          case 'Escape':
            engineRef.current.pause();
            setGameState('paused');
            break;
        }
      } else if (gameState === 'paused' && (e.key === 'p' || e.key === 'P' || e.key === 'Escape')) {
        engineRef.current?.resume();
        setGameState('playing');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Start a new game run
  const handleStartRun = () => {
    AudioManager.resumeOnUserInteraction();
    AudioManager.play('click');
    setGameState('playing');
    engineRef.current?.start();
  };

  const handleResumeRun = () => {
    AudioManager.play('click');
    setGameState('playing');
    engineRef.current?.resume();
  };

  const handleRestartRun = () => {
    AudioManager.play('click');
    setGameState('playing');
    engineRef.current?.start();
  };

  const handleQuitToMenu = () => {
    AudioManager.play('click');
    engineRef.current?.setMenuMode();
    setGameState('menu');
  };

  const handleSelectSkin = (id: SkinId) => {
    Storage.data.skin = id;
    Storage.save();
    setSaveData({ ...Storage.data });
    engineRef.current?.setSkin(id);
  };

  const handleBuySkin = (id: SkinId) => {
    Storage.data.coins -= 500; // skin cost is checked in modal
    Storage.data.ownedSkins.push(id);
    Storage.data.skin = id;
    Storage.save();
    setSaveData({ ...Storage.data });
    engineRef.current?.setSkin(id);
    showToast('EXOSKELETON ACQUIRED');
  };

  const handleSelectTrail = (id: TrailId) => {
    Storage.data.trail = id;
    Storage.save();
    setSaveData({ ...Storage.data });
  };

  const handleBuyTrail = (id: TrailId) => {
    Storage.data.coins -= 350;
    Storage.data.ownedTrails.push(id);
    Storage.data.trail = id;
    Storage.save();
    setSaveData({ ...Storage.data });
    showToast('ENERGY TRAIL UNLOCKED');
  };

  const handleUpgrade = (key: keyof UpgradeTiers) => {
    const cost = 250; // handled inside storage / constants
    Storage.data.upg[key]++;
    Storage.save();
    setSaveData({ ...Storage.data });
    showToast('SYSTEM UPGRADED');
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    Storage.data.settings = newSettings;
    Storage.save();
    setSaveData({ ...Storage.data });
    engineRef.current?.applyQuality(newSettings.quality);
  };

  const handleResetSave = () => {
    const res = Storage.reset();
    setSaveData({ ...res });
    showToast('PROGRESS ERASED');
  };

  const handleContinueAfterVictory = () => {
    setGameState('playing');
    setVictoryData(null);
    // Continue running into the next zone!
    if (engineRef.current) {
      engineRef.current.resume();
      showToast('FORWARD TO NEXT SECTOR');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#03050b] select-none font-['Rajdhani']">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Scanlines Effect */}
      <div className="absolute inset-0 scanlines opacity-40 pointer-events-none z-10" />

      {/* Floating HUD during gameplay */}
      {gameState === 'playing' && (
        <>
          <HUD
            stats={liveStats}
            hp={liveHp}
            maxHp={liveMaxHp}
            bestScore={saveData.best}
            specialCd={liveSpecialCd}
            bossHp={liveBossHp}
            maxBossHp={liveMaxBossHp}
            zoneIndex={liveZoneIndex}
            weather={liveWeather}
            activePows={activePows}
            onPause={() => {
              engineRef.current?.pause();
              setGameState('paused');
            }}
            onCastSpecial={() => {
              engineRef.current?.castSpecial();
            }}
          />

          {/* Virtual Touch Controls on mobile devices */}
          <TouchControls
            onLeft={() => engineRef.current?.shiftLane(-1)}
            onRight={() => engineRef.current?.shiftLane(1)}
            onJump={() => engineRef.current?.jump()}
            onSlide={() => engineRef.current?.slide()}
            onPulse={() => engineRef.current?.castSpecial()}
            pulseReady={liveSpecialCd <= 0}
          />
        </>
      )}

      {/* Main Menu */}
      {gameState === 'menu' && (
        <MainMenu
          bestScore={saveData.best}
          coins={saveData.coins}
          hasDailyClaim={Storage.getDailyRewardStatus().canClaim}
          dailyStreak={saveData.dailyRewards?.streak || 0}
          onPlay={handleStartRun}
          onOpenDaily={() => setGameState('daily')}
          onOpenChars={() => setGameState('chars')}
          onOpenShop={() => setGameState('shop')}
          onOpenMissions={() => setGameState('missions')}
          onOpenSettings={() => setGameState('settings')}
        />
      )}

      {/* Daily Rewards Modal */}
      {gameState === 'daily' && (
        <DailyRewardsModal
          onClose={() => setGameState('menu')}
          onRewardClaimed={(coinsEarned) => {
            setSaveData({ ...Storage.load() });
            showToast(`+${coinsEarned} CREDITS SECURED!`);
          }}
        />
      )}

      {/* Character & Trails Modal */}
      {gameState === 'chars' && (
        <CharacterSelect
          currentSkin={saveData.skin}
          ownedSkins={saveData.ownedSkins}
          currentTrail={saveData.trail}
          ownedTrails={saveData.ownedTrails}
          coins={saveData.coins}
          onSelectSkin={handleSelectSkin}
          onBuySkin={handleBuySkin}
          onSelectTrail={handleSelectTrail}
          onBuyTrail={handleBuyTrail}
          onClose={() => setGameState('menu')}
        />
      )}

      {/* Upgrades Shop Modal */}
      {gameState === 'shop' && (
        <ShopModal
          upgrades={saveData.upg}
          coins={saveData.coins}
          onUpgrade={handleUpgrade}
          onClose={() => setGameState('menu')}
        />
      )}

      {/* Missions Modal */}
      {gameState === 'missions' && (
        <MissionsModal
          missions={saveData.missions}
          onClose={() => setGameState('menu')}
        />
      )}

      {/* Settings Modal */}
      {gameState === 'settings' && (
        <SettingsModal
          settings={saveData.settings}
          onUpdateSettings={handleUpdateSettings}
          onResetSave={handleResetSave}
          onClose={() => setGameState('menu')}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResumeRun}
          onRestart={handleRestartRun}
          onOpenSettings={() => setGameState('settings')}
          onQuit={handleQuitToMenu}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={liveStats}
          isNewBest={isNewBestRecord}
          bestScore={saveData.best}
          onPlayAgain={handleRestartRun}
          onMainMenu={handleQuitToMenu}
        />
      )}

      {/* Victory Boss Defeated Modal */}
      {gameState === 'victory' && victoryData && (
        <VictoryModal
          zoneIndex={victoryData.zone}
          rewardCoins={victoryData.coins}
          rewardScore={victoryData.score}
          onContinue={handleContinueAfterVictory}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-2 bg-[#091524]/90 border-l-4 border-[#19e3ff] border-y border-r border-[#162a40] cut-sm shadow-[0_0_20px_rgba(25,227,255,0.4)] animate-bounce">
          <span className="font-['Orbitron'] font-bold text-xs tracking-wider text-white">
            {toastMessage}
          </span>
        </div>
      )}
    </div>
  );
}

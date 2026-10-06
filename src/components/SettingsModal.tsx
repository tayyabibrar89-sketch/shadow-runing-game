/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { UserSettings } from '../game/types';
import { AudioManager } from '../game/audio';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onResetSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetSave,
  onClose,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const toggle = (key: 'music' | 'sound' | 'vib') => {
    AudioManager.play('click');
    const updated = { ...settings, [key]: !settings[key] };
    onUpdateSettings(updated);
    if (key === 'music') {
      if (updated.music) AudioManager.startMusic();
      else AudioManager.stopMusic();
    }
  };

  const setQuality = (q: 'low' | 'medium' | 'high') => {
    AudioManager.play('click');
    onUpdateSettings({ ...settings, quality: q });
  };

  const setCamera = (c: 'dynamic' | 'close') => {
    AudioManager.play('click');
    onUpdateSettings({ ...settings, cameraMode: c });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#02050b]/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#070d17]/95 border border-[#162a40] cut p-5 sm:p-7 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)]">
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
              SYSTEM CONFIG
            </h2>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 mt-5">
          {/* Music */}
          <div className="flex items-center justify-between p-3.5 bg-[#0a1424] border border-[#15253a] cut-sm">
            <span className="font-['Orbitron'] font-bold text-xs sm:text-sm text-white tracking-wider">
              SYNTHWAVE SOUNDTRACK
            </span>
            <button
              onClick={() => toggle('music')}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${
                settings.music ? 'bg-[#19e3ff]' : 'bg-[#142030]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#030914] transition-transform ${
                  settings.music ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound FX */}
          <div className="flex items-center justify-between p-3.5 bg-[#0a1424] border border-[#15253a] cut-sm">
            <span className="font-['Orbitron'] font-bold text-xs sm:text-sm text-white tracking-wider">
              AUDIO EFFECTS
            </span>
            <button
              onClick={() => toggle('sound')}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${
                settings.sound ? 'bg-[#19e3ff]' : 'bg-[#142030]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#030914] transition-transform ${
                  settings.sound ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between p-3.5 bg-[#0a1424] border border-[#15253a] cut-sm">
            <span className="font-['Orbitron'] font-bold text-xs sm:text-sm text-white tracking-wider">
              HAPTIC FEEDBACK
            </span>
            <button
              onClick={() => toggle('vib')}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${
                settings.vib ? 'bg-[#19e3ff]' : 'bg-[#142030]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#030914] transition-transform ${
                  settings.vib ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Graphics Quality */}
          <div className="flex items-center justify-between p-3.5 bg-[#0a1424] border border-[#15253a] cut-sm">
            <span className="font-['Orbitron'] font-bold text-xs sm:text-sm text-white tracking-wider">
              3D RENDERING QUALITY
            </span>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`px-3 py-1 font-['Orbitron'] font-bold text-[10px] tracking-wider uppercase cut-sm border transition-colors cursor-pointer ${
                    settings.quality === q
                      ? 'bg-[#19e3ff] border-[#19e3ff] text-[#030914]'
                      : 'bg-[#0e1928] border-[#1a304a] text-[#6b85a0] hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Mode */}
          <div className="flex items-center justify-between p-3.5 bg-[#0a1424] border border-[#15253a] cut-sm">
            <span className="font-['Orbitron'] font-bold text-xs sm:text-sm text-white tracking-wider">
              PERSPECTIVE CAM
            </span>
            <div className="flex gap-1">
              {(['dynamic', 'close'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCamera(c)}
                  className={`px-3 py-1 font-['Orbitron'] font-bold text-[10px] tracking-wider uppercase cut-sm border transition-colors cursor-pointer ${
                    settings.cameraMode === c
                      ? 'bg-[#19e3ff] border-[#19e3ff] text-[#030914]'
                      : 'bg-[#0e1928] border-[#1a304a] text-[#6b85a0] hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Progress */}
          <div className="pt-3 mt-1 border-t border-[#142338]">
            {showConfirmReset ? (
              <div className="p-3 bg-[#1e0a13] border border-[#ff2d78] cut-sm flex items-center justify-between">
                <span className="text-xs font-bold text-[#ff2d78]">
                  WIPE ALL SAVED DATA?
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      AudioManager.play('click');
                      onResetSave();
                      setShowConfirmReset(false);
                    }}
                    className="px-3 py-1 bg-[#ff2d78] text-white font-['Orbitron'] font-bold text-[10px] cut-sm cursor-pointer"
                  >
                    CONFIRM
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-3 py-1 bg-[#121c29] text-[#7d94aa] font-['Orbitron'] font-bold text-[10px] cut-sm cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full py-2.5 px-3 bg-[#0d1624] hover:bg-[#1a0f18] border border-[#1b2d42] hover:border-[#ff2d78] text-[#869ab0] hover:text-[#ff2d78] font-['Orbitron'] font-bold text-xs tracking-wider cut-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>RESET ALL RUNNER PROGRESS</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

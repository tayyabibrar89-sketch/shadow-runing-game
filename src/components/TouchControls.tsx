/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface TouchControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  onPulse: () => void;
  pulseReady: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onLeft,
  onRight,
  onJump,
  onSlide,
  onPulse,
  pulseReady,
}) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Global touch swipe gestures
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = performance.now() - touchStartRef.current.time;

      const threshold = 35;
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) onRight();
          else onLeft();
        } else {
          if (dy < 0) onJump();
          else onSlide();
        }
      } else if (dt < 250) {
        // Quick tap without swipe = jump
        onJump();
      }

      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onLeft, onRight, onJump, onSlide]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex justify-between items-end p-4 pb-6 select-none md:hidden">
      {/* Left / Right buttons */}
      <div className="flex gap-3 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLeft();
          }}
          className="w-14 h-14 rounded-xl bg-[#091322]/85 border border-[#1b324c] flex flex-col items-center justify-center text-white active:bg-[#19e3ff]/30 active:border-[#19e3ff] transition-transform active:scale-95"
          aria-label="Shift Left"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="text-[9px] font-['Orbitron'] font-bold tracking-widest text-[#7fa3c4]">LEFT</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRight();
          }}
          className="w-14 h-14 rounded-xl bg-[#091322]/85 border border-[#1b324c] flex flex-col items-center justify-center text-white active:bg-[#19e3ff]/30 active:border-[#19e3ff] transition-transform active:scale-95"
          aria-label="Shift Right"
        >
          <ChevronRight className="w-6 h-6" />
          <span className="text-[9px] font-['Orbitron'] font-bold tracking-widest text-[#7fa3c4]">RIGHT</span>
        </button>
      </div>

      {/* Jump, Slide & Pulse buttons */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {/* Pulse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPulse();
          }}
          disabled={!pulseReady}
          className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center transition-transform active:scale-95 ${
            pulseReady
              ? 'bg-[#122840] border-[#19e3ff] text-[#19e3ff] shadow-[0_0_12px_rgba(25,227,255,0.4)]'
              : 'bg-[#0a121e]/70 border-[#152438] text-[#3e5066] opacity-60'
          }`}
          aria-label="EMP Pulse"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span className="text-[8px] font-['Orbitron'] font-bold">EMP</span>
        </button>

        {/* Slide button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSlide();
          }}
          className="w-14 h-14 rounded-xl bg-[#091322]/85 border border-[#1b324c] flex flex-col items-center justify-center text-white active:bg-[#ffc857]/30 active:border-[#ffc857] transition-transform active:scale-95"
          aria-label="Slide"
        >
          <ArrowDown className="w-6 h-6 text-[#ffd257]" />
          <span className="text-[9px] font-['Orbitron'] font-bold tracking-widest text-[#ffd257]">SLIDE</span>
        </button>

        {/* Jump button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJump();
          }}
          className="w-16 h-16 rounded-xl bg-[#091e36]/90 border border-[#19e3ff] flex flex-col items-center justify-center text-white shadow-[0_0_14px_rgba(25,227,255,0.3)] active:bg-[#19e3ff]/40 transition-transform active:scale-95"
          aria-label="Jump"
        >
          <ArrowUp className="w-7 h-7 text-[#19e3ff]" />
          <span className="text-[10px] font-['Orbitron'] font-bold tracking-widest text-[#19e3ff]">JUMP</span>
        </button>
      </div>
    </div>
  );
};

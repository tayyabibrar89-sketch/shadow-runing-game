/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Storage } from './storage';

export const AudioManager = {
  ctx: null as AudioContext | null,
  sfxGain: null as GainNode | null,
  musicGain: null as GainNode | null,
  noiseBuffer: null as AudioBuffer | null,
  isPlayingMusic: false,
  stepIndex: 0,
  nextStepTime: 0,
  intervalId: null as any,

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.65;
      this.sfxGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.22;
      this.musicGain.connect(this.ctx.destination);

      // Pre-render 0.5s white noise for punchy percussions and impacts
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;

      if (Storage.data.settings.music) {
        this.startMusic();
      }
    } catch {
      // Audio not permitted or supported
    }
  },

  resumeOnUserInteraction() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  tone(opts: {
    f0: number;
    f1?: number;
    t: number;
    type?: OscillatorType;
    v?: number;
    dest?: AudioNode;
  }) {
    if (!this.ctx || !Storage.data.settings.sound) return;
    try {
      const c = this.ctx;
      const osc = c.createOscillator();
      const gain = c.createGain();
      const now = c.currentTime;

      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(opts.f0, now);
      if (opts.f1) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.f1), now + opts.t);
      }

      const peak = opts.v ?? 0.25;
      gain.gain.setValueAtTime(peak, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.t);

      osc.connect(gain);
      gain.connect(opts.dest || this.sfxGain || c.destination);

      osc.start(now);
      osc.stop(now + opts.t + 0.03);
    } catch {
      // Audio error safety
    }
  },

  noise(opts: { t: number; v?: number; hp?: number; lp?: number }) {
    if (!this.ctx || !this.noiseBuffer || !Storage.data.settings.sound) return;
    try {
      const c = this.ctx;
      const src = c.createBufferSource();
      const gain = c.createGain();
      const now = c.currentTime;

      src.buffer = this.noiseBuffer;
      let node: AudioNode = src;

      if (opts.hp) {
        const hp = c.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = opts.hp;
        node.connect(hp);
        node = hp;
      }
      if (opts.lp) {
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = opts.lp;
        node.connect(lp);
        node = lp;
      }

      gain.gain.setValueAtTime(opts.v ?? 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.t);

      node.connect(gain);
      gain.connect(this.sfxGain || c.destination);

      src.start(now);
      src.stop(now + opts.t + 0.03);
    } catch {
      // Audio safety
    }
  },

  play(sound: string) {
    this.resumeOnUserInteraction();
    if (!Storage.data.settings.sound) return;

    switch (sound) {
      case 'jump':
        this.tone({ f0: 240, f1: 680, t: 0.16, type: 'square', v: 0.15 });
        this.tone({ f0: 480, f1: 920, t: 0.12, type: 'sine', v: 0.1 });
        break;

      case 'slide':
        this.noise({ t: 0.2, v: 0.18, lp: 800, hp: 120 });
        this.tone({ f0: 220, f1: 90, t: 0.22, type: 'triangle', v: 0.12 });
        break;

      case 'laneShift':
        this.tone({ f0: 380, f1: 520, t: 0.07, type: 'sine', v: 0.08 });
        break;

      case 'coin':
        this.tone({ f0: 880, t: 0.06, type: 'sine', v: 0.2 });
        this.tone({ f0: 1320, t: 0.1, type: 'sine', v: 0.18 });
        break;

      case 'rare':
        this.tone({ f0: 1046, t: 0.08, v: 0.22 });
        this.tone({ f0: 1567, t: 0.12, v: 0.2 });
        this.tone({ f0: 2093, t: 0.18, v: 0.16 });
        break;

      case 'power':
        [392, 523, 659, 1046].forEach((freq, idx) => {
          setTimeout(() => {
            this.tone({ f0: freq, t: 0.18, type: 'triangle', v: 0.22 });
          }, idx * 65);
        });
        break;

      case 'hit':
        this.noise({ t: 0.25, v: 0.35, lp: 700 });
        this.tone({ f0: 140, f1: 45, t: 0.28, type: 'sawtooth', v: 0.35 });
        break;

      case 'kill':
        this.tone({ f0: 550, f1: 60, t: 0.24, type: 'sawtooth', v: 0.28 });
        this.noise({ t: 0.2, v: 0.22, lp: 2000 });
        break;

      case 'emp':
        this.tone({ f0: 140, f1: 1200, t: 0.45, type: 'sawtooth', v: 0.35 });
        this.noise({ t: 0.5, v: 0.3, lp: 3200, hp: 80 });
        break;

      case 'bossAlert':
        this.tone({ f0: 80, f1: 35, t: 0.8, type: 'sawtooth', v: 0.45 });
        this.noise({ t: 0.7, v: 0.25, lp: 450 });
        break;

      case 'bossHit':
        this.tone({ f0: 260, f1: 75, t: 0.16, type: 'square', v: 0.3 });
        break;

      case 'bossExplode':
        this.tone({ f0: 60, f1: 20, t: 1.2, type: 'sawtooth', v: 0.5 });
        this.noise({ t: 1.0, v: 0.45, lp: 1200 });
        break;

      case 'over':
        [349, 293, 220, 146].forEach((freq, idx) => {
          setTimeout(() => {
            this.tone({ f0: freq, t: 0.38, type: 'triangle', v: 0.28 });
          }, idx * 240);
        });
        break;

      case 'click':
        this.tone({ f0: 620, t: 0.04, type: 'square', v: 0.08 });
        break;
    }
  },

  startMusic() {
    if (!this.ctx || this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.stepIndex = 0;
    this.nextStepTime = this.ctx.currentTime + 0.08;
    this.intervalId = setInterval(() => this.musicLoop(), 40);
  },

  stopMusic() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPlayingMusic = false;
  },

  musicLoop() {
    const c = this.ctx;
    if (!c || !this.isPlayingMusic || !Storage.data.settings.music) return;

    const secondsPer16th = 60 / 122 / 2; // ~122 BPM
    while (this.nextStepTime < c.currentTime + 0.14) {
      this.playStep(this.stepIndex, this.nextStepTime);
      this.nextStepTime += secondsPer16th;
      this.stepIndex = (this.stepIndex + 1) % 32;
    }
  },

  playStep(step: number, time: number) {
    const c = this.ctx;
    if (!c || !this.musicGain) return;

    // Driving Synthwave Bass pattern in D minor (D1 = 36.7, F1 = 43.65, G1 = 49, A1 = 55)
    const bassline = [
      55, 0, 0, 55, 0, 55, 0, 0,
      55, 0, 0, 55, 0, 55, 0, 58.3,
      43.65, 0, 0, 43.65, 0, 43.65, 0, 0,
      49, 0, 0, 49, 0, 49, 0, 52.3,
    ];

    const freq = bassline[step];
    if (freq) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 380;

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 0.24);
    }

    // Punchy Kick Drum every 4 steps
    if (step % 8 === 0) {
      const kick = c.createOscillator();
      const kGain = c.createGain();

      kick.frequency.setValueAtTime(140, time);
      kick.frequency.exponentialRampToValueAtTime(36, time + 0.11);

      kGain.gain.setValueAtTime(0.55, time);
      kGain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

      kick.connect(kGain);
      kGain.connect(this.musicGain);

      kick.start(time);
      kick.stop(time + 0.15);
    }

    // Hi-hat on offbeats
    if (step % 2 === 0 && this.noiseBuffer) {
      const hat = c.createBufferSource();
      const hGain = c.createGain();
      const filter = c.createBiquadFilter();

      hat.buffer = this.noiseBuffer;
      filter.type = 'highpass';
      filter.frequency.value = 7500;

      const vol = step % 8 === 4 ? 0.09 : 0.04;
      hGain.gain.setValueAtTime(vol, time);
      hGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      hat.connect(filter);
      filter.connect(hGain);
      hGain.connect(this.musicGain);

      hat.start(time);
      hat.stop(time + 0.06);
    }

    // Melodic Synth Arpeggio
    if (step % 2 === 1) {
      const arpNotes = [220, 261.6, 329.6, 392, 440, 523.25];
      const noteFreq = arpNotes[(step * 3) % arpNotes.length];
      const arp = c.createOscillator();
      const aGain = c.createGain();

      arp.type = 'triangle';
      arp.frequency.value = noteFreq;

      aGain.gain.setValueAtTime(0.05, time);
      aGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      arp.connect(aGain);
      aGain.connect(this.musicGain);

      arp.start(time);
      arp.stop(time + 0.16);
    }
  },
};

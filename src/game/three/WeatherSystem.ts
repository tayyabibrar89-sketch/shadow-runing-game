/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ZONES } from '../constants';
import { ZoneConfig } from '../types';
import { Storage } from '../storage';

export type WeatherType = 'neon_rain' | 'toxic_steam' | 'molten_ash' | 'ion_aurora';

export interface WeatherSettings {
  type: WeatherType;
  label: string;
  color: number;
  fogColor: number;
  fogDensity: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  turbulence: number;
  size: number;
}

export const SECTOR_WEATHER: Record<number, WeatherSettings> = {
  0: {
    type: 'neon_rain',
    label: 'NEON ACID RAIN',
    color: 0x19e3ff,
    fogColor: 0x050c18,
    fogDensity: 0.016,
    speedX: -2.5,
    speedY: -34.0,
    speedZ: 4.0,
    turbulence: 0.4,
    size: 0.45,
  },
  1: {
    type: 'toxic_steam',
    label: 'BIOLUMINESCENT STEAM',
    color: 0x2dffd6,
    fogColor: 0x031310,
    fogDensity: 0.025,
    speedX: 0.8,
    speedY: 3.5, // rising steam vents!
    speedZ: -2.0,
    turbulence: 1.6,
    size: 0.85,
  },
  2: {
    type: 'molten_ash',
    label: 'MOLTEN ASH & SLAG EMBERS',
    color: 0xff8533,
    fogColor: 0x180b03,
    fogDensity: 0.019,
    speedX: -3.5,
    speedY: -4.5,
    speedZ: 5.0,
    turbulence: 2.2, // swirling embers
    size: 0.65,
  },
  3: {
    type: 'ion_aurora',
    label: 'ION WINDS & COSMIC DUST',
    color: 0xb48bff,
    fogColor: 0x0c061a,
    fogDensity: 0.012,
    speedX: -16.0, // fast horizontal wind
    speedY: -1.5,
    speedZ: -12.0,
    turbulence: 0.8,
    size: 0.55,
  },
};

function createParticleTexture(kind: 'drop' | 'circle' | 'streak'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  if (kind === 'drop') {
    // Slanted elongated rain line
    const grad = ctx.createLinearGradient(32, 4, 32, 60);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(28, 4, 8, 56);
  } else if (kind === 'streak') {
    // High-speed horizontal ion beam
    const grad = ctx.createLinearGradient(4, 32, 60, 32);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(4, 28, 56, 8);
  } else {
    // Radial soft sphere for steam & embers
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export class WeatherSystem {
  public scene: THREE.Scene;
  public currentWeather: WeatherSettings;

  // Particle System
  private particleCount: number;
  private particleGeo: THREE.BufferGeometry;
  private particleMat: THREE.PointsMaterial;
  private particlePoints: THREE.Points;
  private particlePositions: Float32Array;
  private particleVelocities: Float32Array;
  private particleSeeds: Float32Array;

  // Textures cache
  private dropTexture: THREE.CanvasTexture;
  private circleTexture: THREE.CanvasTexture;
  private streakTexture: THREE.CanvasTexture;

  // Atmospheric FX
  private lightningTimer = 0;
  private lightningDuration = 0;
  private ambientFlashLight: THREE.AmbientLight | null = null;
  private baseAmbientIntensity = 0.65;
  private targetFogColor = new THREE.Color(0x050c18);
  private targetFogDensity = 0.016;

  // Wet road splash particles
  private splashMesh: THREE.InstancedMesh;
  private splashCount = 45;
  private splashDummy = new THREE.Object3D();
  private splashLifetimes: Float32Array;

  constructor(scene: THREE.Scene, initialZone = 0) {
    this.scene = scene;
    this.currentWeather = { ...SECTOR_WEATHER[initialZone % 4] };

    const q = Storage.data.settings.quality;
    this.particleCount = q === 'high' ? 1200 : q === 'medium' ? 700 : 350;

    // Build particle textures
    this.dropTexture = createParticleTexture('drop');
    this.circleTexture = createParticleTexture('circle');
    this.streakTexture = createParticleTexture('streak');

    // 1. Weather Points Geometry
    this.particleGeo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleVelocities = new Float32Array(this.particleCount * 3);
    this.particleSeeds = new Float32Array(this.particleCount);

    this.initParticles();

    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    this.particleMat = new THREE.PointsMaterial({
      size: this.currentWeather.size,
      color: new THREE.Color(this.currentWeather.color),
      map: this.dropTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlePoints = new THREE.Points(this.particleGeo, this.particleMat);
    this.scene.add(this.particlePoints);

    // 2. Road Rain Splashes (Instanced Rings)
    const splashGeo = new THREE.RingGeometry(0.08, 0.28, 8);
    splashGeo.rotateX(-Math.PI / 2);
    const splashMat = new THREE.MeshBasicMaterial({
      color: 0x19e3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.splashMesh = new THREE.InstancedMesh(splashGeo, splashMat, this.splashCount);
    this.splashLifetimes = new Float32Array(this.splashCount);
    for (let i = 0; i < this.splashCount; i++) {
      this.splashLifetimes[i] = Math.random();
      this.splashDummy.position.set(0, -100, 0);
      this.splashDummy.updateMatrix();
      this.splashMesh.setMatrixAt(i, this.splashDummy.matrix);
    }
    this.splashMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.splashMesh);

    // Initial weather state setup
    this.setZone(initialZone);
  }

  public registerAmbientLight(light: THREE.AmbientLight) {
    this.ambientFlashLight = light;
    this.baseAmbientIntensity = light.intensity;
  }

  private initParticles() {
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      this.particlePositions[idx] = (Math.random() - 0.5) * 32;     // X: -16 to +16
      this.particlePositions[idx + 1] = Math.random() * 22;        // Y: 0 to 22
      this.particlePositions[idx + 2] = -Math.random() * 80;       // Z: relative to player
      this.particleSeeds[i] = Math.random() * Math.PI * 2;
    }
  }

  public setZone(zoneIndex: number) {
    const config = SECTOR_WEATHER[zoneIndex % 4] || SECTOR_WEATHER[0];
    this.currentWeather = { ...config };

    this.targetFogColor.setHex(config.fogColor);
    this.targetFogDensity = config.fogDensity;

    // Switch particle texture & styling
    this.particleMat.color.setHex(config.color);
    this.particleMat.size = config.size;

    if (config.type === 'neon_rain') {
      this.particleMat.map = this.dropTexture;
      this.particleMat.opacity = 0.85;
      this.splashMesh.visible = true;
      (this.splashMesh.material as THREE.MeshBasicMaterial).color.setHex(0x19e3ff);
    } else if (config.type === 'ion_aurora') {
      this.particleMat.map = this.streakTexture;
      this.particleMat.opacity = 0.9;
      this.splashMesh.visible = false;
    } else {
      this.particleMat.map = this.circleTexture;
      this.particleMat.opacity = config.type === 'toxic_steam' ? 0.75 : 0.95;
      this.splashMesh.visible = false;
    }
    this.particleMat.needsUpdate = true;
  }

  public update(dt: number, playerZ: number, playerSpeed: number) {
    const w = this.currentWeather;

    // 1. Dynamic Fog Interpolation
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.lerp(this.targetFogColor, dt * 1.5);
      this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, this.targetFogDensity, dt * 1.5);
    }

    // 2. Environmental Lightning / Furnace Flares
    this.updateAtmosphericFlashes(dt);

    // 3. Move & Wrap Particles relative to player
    const positions = this.particlePositions;
    const time = performance.now() * 0.001;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const seed = this.particleSeeds[i];

      // Lateral turbulence
      const turbX = Math.sin(time * 3 + seed) * w.turbulence;
      const turbY = Math.cos(time * 2.5 + seed) * (w.turbulence * 0.4);

      // Advance particle position
      positions[idx] += (w.speedX + turbX) * dt;
      positions[idx + 1] += (w.speedY + turbY) * dt;
      positions[idx + 2] += (w.speedZ) * dt;

      // Wrapping bounds around player:
      // X boundaries: -16 to 16
      if (positions[idx] < -16) positions[idx] += 32;
      if (positions[idx] > 16) positions[idx] -= 32;

      // Y boundaries:
      if (w.type === 'toxic_steam') {
        // Steam rises from road (Y: 0.1 to 16)
        if (positions[idx + 1] > 18) {
          positions[idx + 1] = 0.1;
          positions[idx] = (Math.random() - 0.5) * 14;
          positions[idx + 2] = playerZ - Math.random() * 70;
        }
      } else {
        // Rain / Ash / Dust falls down toward road
        if (positions[idx + 1] < 0.1) {
          // Trigger road splash if neon rain
          if (w.type === 'neon_rain' && Math.random() < 0.25) {
            this.triggerRoadSplash(positions[idx], positions[idx + 2]);
          }
          positions[idx + 1] = 18 + Math.random() * 4;
          positions[idx + 2] = playerZ - Math.random() * 75;
        }
      }

      // Z boundaries (keep particles anchored in front of player from playerZ to playerZ - 80)
      if (positions[idx + 2] > playerZ + 5) {
        positions[idx + 2] -= 85;
      } else if (positions[idx + 2] < playerZ - 85) {
        positions[idx + 2] += 85;
      }
    }

    this.particleGeo.attributes.position.needsUpdate = true;

    // 4. Update Road Splashes
    if (w.type === 'neon_rain') {
      this.updateSplashes(dt);
    }
  }

  private triggerRoadSplash(x: number, z: number) {
    if (Math.abs(x) > 5.5) return; // Only on the road deck
    const idx = Math.floor(Math.random() * this.splashCount);
    this.splashLifetimes[idx] = 0.001;
    this.splashDummy.position.set(x, 0.05, z);
    this.splashDummy.scale.set(0.2, 0.2, 0.2);
    this.splashDummy.updateMatrix();
    this.splashMesh.setMatrixAt(idx, this.splashDummy.matrix);
  }

  private updateSplashes(dt: number) {
    let needsUpdate = false;
    for (let i = 0; i < this.splashCount; i++) {
      if (this.splashLifetimes[i] > 0) {
        this.splashLifetimes[i] += dt * 3.5;
        const t = this.splashLifetimes[i];
        if (t >= 1) {
          this.splashLifetimes[i] = 0;
          this.splashDummy.position.set(0, -100, 0);
        } else {
          const scale = 0.3 + t * 1.4;
          this.splashDummy.scale.set(scale, scale, scale);
        }
        this.splashDummy.updateMatrix();
        this.splashMesh.setMatrixAt(i, this.splashDummy.matrix);
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      this.splashMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private updateAtmosphericFlashes(dt: number) {
    if (!this.ambientFlashLight) return;

    this.lightningTimer += dt;

    if (this.currentWeather.type === 'neon_rain') {
      // Occasional cyber lightning in the neon rain
      if (this.lightningDuration > 0) {
        this.lightningDuration -= dt;
        if (this.lightningDuration <= 0) {
          this.ambientFlashLight.intensity = this.baseAmbientIntensity;
          this.ambientFlashLight.color.setHex(0xffffff);
        }
      } else if (this.lightningTimer > 7.5 + Math.random() * 6.0) {
        this.lightningTimer = 0;
        this.lightningDuration = 0.09;
        this.ambientFlashLight.intensity = this.baseAmbientIntensity + 1.2;
        this.ambientFlashLight.color.setHex(0x19e3ff);
      }
    } else if (this.currentWeather.type === 'molten_ash') {
      // Periodic warm forge furnace pulse
      const pulse = Math.sin(performance.now() * 0.003) * 0.3;
      this.ambientFlashLight.intensity = this.baseAmbientIntensity + pulse;
      this.ambientFlashLight.color.setHex(0xff8533);
    } else {
      this.ambientFlashLight.intensity = this.baseAmbientIntensity;
      this.ambientFlashLight.color.setHex(0xffffff);
    }
  }

  public destroy() {
    this.scene.remove(this.particlePoints);
    this.scene.remove(this.splashMesh);
    this.particleGeo.dispose();
    this.particleMat.dispose();
    this.dropTexture.dispose();
    this.circleTexture.dispose();
    this.streakTexture.dispose();
  }
}

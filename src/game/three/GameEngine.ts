/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RunnerModel } from './RunnerModel';
import { TrackManager } from './TrackManager';
import { BossModel } from './BossModel';
import { WeatherSystem } from './WeatherSystem';
import { AudioManager } from '../audio';
import { Storage } from '../storage';
import { LANES, POW_META, BOSS_ZONE_DISTANCE, ZONES } from '../constants';
import { PowerUpKind, RunStats, SkinId, TrailId } from '../types';

export interface Obstacle3D {
  mesh: THREE.Group;
  type: 'low_barrier' | 'high_laser' | 'drone' | 'crate' | 'hazard_spikes';
  lane: number;
  z: number;
  y: number;
  dead: boolean;
  box: THREE.Box3;
  counted?: boolean;
}

export interface Coin3D {
  mesh: THREE.Mesh;
  lane: number;
  z: number;
  y: number;
  isRare: boolean;
  dead: boolean;
}

export interface PowerUp3D {
  mesh: THREE.Group;
  kind: PowerUpKind;
  lane: number;
  z: number;
  y: number;
  dead: boolean;
}

export interface Particle3D {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Subsystems
  public trackManager: TrackManager;
  public runner: RunnerModel;
  public boss: BossModel;
  public weather: WeatherSystem;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private runnerPointLight: THREE.PointLight;

  // Player State
  public targetLane = 0; // -1, 0, 1
  public playerX = 0;
  public playerY = 0;
  public playerZ = 0;
  public playerVy = 0;
  public jumpsLeft = 2;
  public isGrounded = true;
  public isSliding = false;
  public slideTimer = 0;
  public hp = 3;
  public maxHp = 3;
  public invulnTimer = 0;
  public isDead = false;
  public specialCd = 0;
  public mode: 'menu' | 'play' = 'menu';

  // Active Power-ups (seconds remaining)
  public activePows: Record<PowerUpKind, number> = {
    shield: 0,
    magnet: 0,
    speed: 0,
    x2: 0,
    slow: 0,
    health: 0,
  };

  // Progression & Stats
  public speed = 18; // units / sec
  public baseSpeed = 18;
  public score = 0;
  public meters = 0;
  public runCoins = 0;
  public combo = 0;
  public comboTimer = 0;
  public maxCombo = 0;
  public kills = 0;
  public powsCollected = 0;
  public runTime = 0;
  public bossesDefeated = 0;
  public currentZoneIndex = 0;
  public lastBossMeters = -1;

  // Entities
  public obstacles: Obstacle3D[] = [];
  public coins: Coin3D[] = [];
  public powerUps: PowerUp3D[] = [];
  public particles: Particle3D[] = [];
  private empWaveMesh: THREE.Mesh | null = null;
  private empWaveTimer = 0;

  // Spawner tracking
  private nextSpawnZ = -30;
  private nextPowerUpZ = -120;

  // Camera Shake
  private shakeIntensity = 0;
  private shakeTimer = 0;

  // State
  public isRunning = false;
  private animationFrameId: number | null = null;
  private lastTime = 0;

  // Callbacks for UI sync
  public onStatsUpdate?: (
    stats: RunStats,
    activePows: Record<PowerUpKind, number>,
    hp: number,
    maxHp: number,
    specialCd: number,
    bossHp: number,
    maxBossHp: number,
    weather: { label: string; type: string }
  ) => void;
  public onGameOver?: (stats: RunStats, isNewBest: boolean) => void;
  public onVictory?: (zoneIndex: number, rewardCoins: number, rewardScore: number) => void;
  public onToast?: (msg: string) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050c18, 0.016);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 450);
    this.camera.position.set(0, 4.2, 7.5);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: Storage.data.settings.quality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Storage.data.settings.quality === 'high' ? 2 : 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 3. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0x19e3ff, 1.4);
    this.dirLight.position.set(10, 25, 10);
    this.scene.add(this.dirLight);

    this.runnerPointLight = new THREE.PointLight(0x19e3ff, 1.8, 14);
    this.runnerPointLight.position.set(0, 2, 0);
    this.scene.add(this.runnerPointLight);

    // 4. Subsystems
    this.trackManager = new TrackManager(this.scene);
    this.runner = new RunnerModel(Storage.data.skin);
    this.scene.add(this.runner.group);

    this.boss = new BossModel();
    this.scene.add(this.boss.group);

    this.weather = new WeatherSystem(this.scene, 0);
    this.weather.registerAmbientLight(this.ambientLight);

    // 5. EMP Wave Effect Mesh
    const empGeo = new THREE.RingGeometry(0.5, 1.2, 32);
    const empMat = new THREE.MeshBasicMaterial({
      color: 0x19e3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.empWaveMesh = new THREE.Mesh(empGeo, empMat);
    this.empWaveMesh.rotation.x = Math.PI / 2;
    this.scene.add(this.empWaveMesh);

    window.addEventListener('resize', this.handleResize);

    this.setMenuMode();
    this.lastTime = performance.now();
    this.loop();
  }

  public handleResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public applyQuality(quality: 'low' | 'medium' | 'high') {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.5));
  }

  public setSkin(skinId: SkinId) {
    this.runner.setSkin(skinId);
  }

  public resetRun() {
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.targetLane = 0;
    this.playerVy = 0;
    this.jumpsLeft = 2;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.maxHp = 3 + Storage.data.upg.vit;
    this.hp = this.maxHp;
    this.invulnTimer = 0;
    this.isDead = false;
    this.specialCd = 0;

    this.baseSpeed = 18 * (1 + 0.05 * Storage.data.upg.speed);
    this.speed = this.baseSpeed;
    this.score = 0;
    this.meters = 0;
    this.runCoins = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.kills = 0;
    this.powsCollected = 0;
    this.runTime = 0;
    this.bossesDefeated = 0;
    this.currentZoneIndex = 0;
    this.lastBossMeters = -1;

    for (const k in this.activePows) {
      this.activePows[k as PowerUpKind] = 0;
    }

    // Clear existing objects
    this.clearEntities();
    this.nextSpawnZ = -35;
    this.nextPowerUpZ = -100;
    this.trackManager.setZone(0);
    this.weather?.setZone(0);
    this.updateFogAndLights();

    this.boss.dispose();
  }

  private clearEntities() {
    for (const o of this.obstacles) this.scene.remove(o.mesh);
    this.obstacles = [];

    for (const c of this.coins) this.scene.remove(c.mesh);
    this.coins = [];

    for (const p of this.powerUps) this.scene.remove(p.mesh);
    this.powerUps = [];

    for (const pt of this.particles) this.scene.remove(pt.mesh);
    this.particles = [];
  }

  public setMenuMode() {
    this.mode = 'menu';
    this.clearEntities();
    this.boss.dispose();
    this.playerX = 0;
    this.playerY = 0;
    this.targetLane = 0;
    this.invulnTimer = 0;
    this.isDead = false;
  }

  public start() {
    this.mode = 'play';
    this.resetRun();
    this.isRunning = true;
    this.lastTime = performance.now();
  }

  public pause() {
    this.isRunning = false;
  }

  public resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
    }
  }

  public shiftLane(direction: -1 | 1) {
    if (this.isDead || !this.isRunning) return;
    const newLane = THREE.MathUtils.clamp(this.targetLane + direction, -1, 1);
    if (newLane !== this.targetLane) {
      this.targetLane = newLane;
      AudioManager.play('laneShift');
    }
  }

  public jump() {
    if (this.isDead || !this.isRunning) return;
    if (this.jumpsLeft > 0) {
      this.playerVy = 13.5;
      this.jumpsLeft--;
      this.isGrounded = false;
      this.isSliding = false;
      AudioManager.play('jump');
      this.spawnSparks(this.playerX, this.playerY + 0.1, this.playerZ, 0x19e3ff, 6);
    }
  }

  public slide() {
    if (this.isDead || !this.isRunning) return;
    if (this.isGrounded) {
      this.isSliding = true;
      this.slideTimer = 0.85;
      AudioManager.play('slide');
      this.spawnSparks(this.playerX, this.playerY + 0.1, this.playerZ, 0x19e3ff, 8);
    } else {
      // Fast drop down when in air
      this.playerVy = -18;
    }
  }

  public castSpecial() {
    if (this.specialCd > 0 || this.isDead || !this.isRunning) return;
    this.specialCd = 10;
    this.invulnTimer = Math.max(this.invulnTimer, 1.2);
    this.empWaveTimer = 0.55;
    AudioManager.play('emp');
    this.addShake(8, 0.4);

    if (this.empWaveMesh) {
      this.empWaveMesh.position.set(this.playerX, this.playerY + 0.5, this.playerZ);
      this.empWaveMesh.scale.set(1, 1, 1);
      (this.empWaveMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
    }

    // Clear obstacles within 32m radius
    for (const obs of this.obstacles) {
      if (Math.abs(obs.z - this.playerZ) < 32 && !obs.dead) {
        obs.dead = true;
        this.spawnSparks(obs.mesh.position.x, obs.mesh.position.y, obs.mesh.position.z, 0x19e3ff, 14);
        this.kills++;
        this.score += 75;
        Storage.updateMission('kills', 1);
      }
    }

    // Damage boss if active
    if (this.boss.active) {
      const distToBoss = Math.abs(this.boss.group.position.z - this.playerZ);
      if (distToBoss < 45) {
        this.bossHit(6);
      }
    }
  }

  private bossHit(dmg: number) {
    AudioManager.play('bossHit');
    this.addShake(6, 0.25);
    const defeated = this.boss.takeDamage(dmg);
    if (defeated) {
      this.onBossDefeated();
    }
  }

  private onBossDefeated() {
    this.bossesDefeated++;
    AudioManager.play('bossExplode');
    this.addShake(15, 0.8);

    // Multi-point explosion
    const bPos = this.boss.group.position;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.spawnSparks(
          bPos.x + (Math.random() - 0.5) * 4,
          bPos.y + (Math.random() - 0.5) * 2,
          bPos.z + (Math.random() - 0.5) * 4,
          0xff2d78,
          25
        );
      }, i * 120);
    }

    // Shower of coins
    for (let i = 0; i < 30; i++) {
      this.spawnCoin(
        Math.floor(Math.random() * 3) - 1,
        bPos.z + (Math.random() - 0.5) * 16,
        1.5 + Math.random() * 2,
        Math.random() < 0.35
      );
    }

    const rewardCoins = 300 + this.currentZoneIndex * 150;
    const rewardScore = 1500 * (this.currentZoneIndex + 1);
    this.runCoins += rewardCoins;
    this.score += rewardScore;
    Storage.updateMission('kills', 5);

    setTimeout(() => {
      if (this.onVictory) {
        this.onVictory(this.currentZoneIndex, rewardCoins, rewardScore);
      }
    }, 1800);
  }

  public takeDamage() {
    if (this.isDead || this.invulnTimer > 0) return;

    if (this.activePows.shield > 0) {
      this.activePows.shield = 0;
      AudioManager.play('hit');
      this.addShake(5, 0.2);
      this.spawnSparks(this.playerX, this.playerY + 1, this.playerZ, 0x19e3ff, 15);
      this.invulnTimer = 0.8;
      if (this.onToast) this.onToast('SHIELD ABSORBED IMPACT');
      return;
    }

    this.hp--;
    this.invulnTimer = 1.4;
    this.combo = 0;
    this.runner.triggerHitFlash();
    AudioManager.play('hit');
    this.addShake(8, 0.35);
    this.spawnSparks(this.playerX, this.playerY + 1, this.playerZ, 0xff2d78, 18);

    if (this.hp <= 0) {
      this.die();
    }
  }

  private die() {
    this.isDead = true;
    this.isRunning = false;
    AudioManager.play('over');
    this.addShake(12, 0.6);
    this.spawnSparks(this.playerX, this.playerY + 1, this.playerZ, 0xff2d78, 30);

    const { isNewBest } = Storage.recordRun(this.score, this.runCoins);
    Storage.updateMission('dist', Math.floor(this.meters));
    Storage.updateMissionMax('survive', Math.floor(this.runTime));

    setTimeout(() => {
      if (this.onGameOver) {
        this.onGameOver(
          {
            score: Math.floor(this.score),
            meters: Math.floor(this.meters),
            runCoins: this.runCoins,
            kills: this.kills,
            combo: this.combo,
            maxCombo: this.maxCombo,
            powsCollected: this.powsCollected,
            runTime: Math.floor(this.runTime),
            bossesDefeated: this.bossesDefeated,
          },
          isNewBest
        );
      }
    }, 1400);
  }

  public addShake(intensity: number, duration: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  private loop = () => {
    this.animationFrameId = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.mode === 'play' && !this.isRunning && !this.isDead) return;

    this.update(dt);
    this.render();
  };

  private update(dt: number) {
    if (this.mode === 'menu') {
      const effDt = Math.min(dt, 0.05);
      this.playerZ -= 7.5 * effDt;
      this.runner.group.position.set(0, 0, this.playerZ);
      this.runner.update(effDt, 11, {
        isGrounded: true,
        isJumping: false,
        isSliding: false,
        laneLean: 0,
        hasShield: false,
        hasMagnet: false,
        isDead: false,
        isInvulnerable: false,
      });
      this.trackManager.update(this.playerZ);
      this.weather?.update(effDt, this.playerZ, 10);
      this.runnerPointLight.position.set(0, 2, this.playerZ);

      // Smooth cinematic camera tracking in front of runner
      const t = performance.now() * 0.0005;
      const camX = Math.sin(t) * 2.8;
      const camY = 2.0 + Math.cos(t * 1.4) * 0.3;
      const camZ = this.playerZ - 4.8;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(0, 1.2, this.playerZ);
      return;
    }

    this.runTime += dt;

    // Time scaling with Slow-Mo power-up
    const timeScale = this.activePows.slow > 0 ? 0.55 : 1.0;
    const effDt = dt * timeScale;

    // Update Timers
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.specialCd > 0) this.specialCd -= dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    for (const k in this.activePows) {
      const key = k as PowerUpKind;
      if (this.activePows[key] > 0) {
        this.activePows[key] = Math.max(0, this.activePows[key] - dt);
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Speed Calculation
    const targetSpeed =
      (this.baseSpeed + Math.min(this.meters * 0.003, 16)) *
      (this.activePows.speed > 0 ? 1.45 : 1.0) *
      (this.boss.active ? 0.8 : 1.0);
    this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, dt * 2.0);

    // Player forward movement along negative Z
    const distanceDelta = this.speed * effDt;
    this.playerZ -= distanceDelta;
    this.meters += distanceDelta * 1.5;
    this.score += distanceDelta * 2.5 * (1 + Math.floor(this.combo / 8));

    // Player lateral lane shifting
    const targetX = LANES[this.targetLane + 1];
    const prevX = this.playerX;
    this.playerX = THREE.MathUtils.lerp(this.playerX, targetX, dt * 14);
    const laneLean = THREE.MathUtils.clamp((this.playerX - prevX) * 15, -1, 1);

    // Slide state timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Player Vertical Physics (Jump / Fall)
    this.playerVy -= 34 * dt; // gravity
    this.playerY += this.playerVy * dt;

    // Check platform / ground height
    const platformY = this.trackManager.getPlatformUnder(this.playerX, this.playerZ);
    const groundLevel = platformY !== null ? platformY : 0;

    if (this.playerY <= groundLevel) {
      this.playerY = groundLevel;
      this.playerVy = 0;
      this.isGrounded = true;
      this.jumpsLeft = 2;
    } else {
      this.isGrounded = false;
    }

    // Update runner mesh position and animation
    this.runner.group.position.set(this.playerX, this.playerY, this.playerZ);
    this.runner.update(dt, this.speed, {
      isGrounded: this.isGrounded,
      isJumping: !this.isGrounded && this.playerVy > 0,
      isSliding: this.isSliding,
      laneLean,
      hasShield: this.activePows.shield > 0,
      hasMagnet: this.activePows.magnet > 0,
      isDead: this.isDead,
      isInvulnerable: this.invulnTimer > 0,
    });

    // Trail particle emission behind feet/thrusters
    this.emitTrailParticles(dt);

    // Light follows player
    this.runnerPointLight.position.set(this.playerX, this.playerY + 2, this.playerZ);

    // Track recycling
    this.trackManager.update(this.playerZ);

    // Zone progression & Boss Encounter
    const currentZone = Math.floor(this.meters / BOSS_ZONE_DISTANCE);
    if (currentZone !== this.currentZoneIndex) {
      this.currentZoneIndex = currentZone % ZONES.length;
      this.trackManager.setZone(this.currentZoneIndex);
      this.weather.setZone(this.currentZoneIndex);
      this.updateFogAndLights();
      if (this.onToast) this.onToast(`ENTERING ${ZONES[this.currentZoneIndex].name} · ${this.weather.currentWeather.label}`);
    }

    // Check Boss encounter trigger (150m before zone milestone)
    const nextZoneMilestone = (Math.floor(this.meters / BOSS_ZONE_DISTANCE) + 1) * BOSS_ZONE_DISTANCE;
    if (
      this.meters >= nextZoneMilestone - 150 &&
      this.lastBossMeters < Math.floor(this.meters / BOSS_ZONE_DISTANCE) &&
      !this.boss.active
    ) {
      this.lastBossMeters = Math.floor(this.meters / BOSS_ZONE_DISTANCE);
      this.boss.spawn(this.currentZoneIndex);
      AudioManager.play('bossAlert');
      this.addShake(10, 0.6);
      if (this.onToast) this.onToast('WARNING: MEGA DRONE DETECTED!');
    }

    // Boss Update
    if (this.boss.active) {
      this.boss.update(
        effDt,
        new THREE.Vector3(this.playerX, this.playerY + 1, this.playerZ),
        (x, y, z, vx, vy, vz) => {
          this.spawnBossBullet(x, y, z, vx, vy, vz);
        }
      );
    }

    // Spawner
    if (!this.boss.active) {
      this.ensureSpawns();
    }

    // Entities Update & Collisions
    this.updateObstacles(effDt);
    this.updateCoins(effDt);
    this.updatePowerUps(effDt);
    this.updateParticles(dt);

    // Dynamic Weather Simulation
    this.weather.update(effDt, this.playerZ, this.speed);

    // EMP Shockwave expansion
    if (this.empWaveTimer > 0 && this.empWaveMesh) {
      this.empWaveTimer -= dt;
      const progress = 1 - this.empWaveTimer / 0.55;
      const scale = 1 + progress * 28;
      this.empWaveMesh.scale.set(scale, scale, 1);
      (this.empWaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - progress));
    }

    // Camera choreography
    this.updateCamera(dt);

    // Notify UI
    if (this.onStatsUpdate) {
      this.onStatsUpdate(
        {
          score: Math.floor(this.score),
          meters: Math.floor(this.meters),
          runCoins: this.runCoins,
          kills: this.kills,
          combo: this.combo,
          maxCombo: this.maxCombo,
          powsCollected: this.powsCollected,
          runTime: Math.floor(this.runTime),
          bossesDefeated: this.bossesDefeated,
        },
        this.activePows,
        this.hp,
        this.maxHp,
        this.specialCd,
        this.boss.hp,
        this.boss.maxHp,
        {
          label: this.weather.currentWeather.label,
          type: this.weather.currentWeather.type,
        }
      );
    }
  }

  private updateFogAndLights() {
    const zone = ZONES[this.currentZoneIndex];
    if (this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color.setHex(zone.fogColor);
    }
    this.dirLight.color.setHex(zone.accentColor);
    this.runnerPointLight.color.setHex(zone.accentColor);
  }

  private emitTrailParticles(dt: number) {
    const trail = Storage.data.trail;
    if (trail === 'none' && this.activePows.speed <= 0) return;

    if (Math.random() < 0.6) {
      let color = 0x19e3ff;
      if (trail === 'ember') color = 0xff7a2d;
      if (trail === 'electric') color = 0x19e3ff;
      if (trail === 'void') color = 0xa06bff;
      if (this.activePows.speed > 0) color = 0xffc857;

      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 6, 6),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
      );
      pMesh.position.set(
        this.playerX + (Math.random() - 0.5) * 0.4,
        this.playerY + 0.3 + (Math.random() - 0.5) * 0.3,
        this.playerZ + 0.5
      );
      this.scene.add(pMesh);

      this.particles.push({
        mesh: pMesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 2, this.speed * 0.2),
        life: 0.35,
        maxLife: 0.35,
        color: new THREE.Color(color),
      });
    }
  }

  private spawnSparks(x: number, y: number, z: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const pMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
      );
      pMesh.position.set(x, y, z);
      this.scene.add(pMesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        mesh: pMesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.random() * 7, Math.sin(angle) * speed),
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.75,
        color: new THREE.Color(color),
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.velocity.y -= 14 * dt; // gravity
      p.mesh.position.addScaledVector(p.velocity, dt);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life / p.maxLife;
    }
  }

  private updateCamera(dt: number) {
    // Target camera position relative to player
    const isCloseCam = Storage.data.settings.cameraMode === 'close';
    const camDist = isCloseCam ? 5.2 : 7.4;
    const camHeight = isCloseCam ? 2.8 : 4.0;

    const targetCamX = this.playerX * 0.45;
    const targetCamY = Math.max(camHeight, this.playerY + camHeight);
    const targetCamZ = this.playerZ + camDist;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, dt * 10);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, dt * 10);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, dt * 18);

    // FOV dynamic expansion during Nitro speed boost
    const targetFov = this.activePows.speed > 0 ? 76 : 62;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 8);
    this.camera.updateProjectionMatrix();

    // Look at player chest
    const lookTarget = new THREE.Vector3(this.playerX * 0.25, this.playerY + 1.2, this.playerZ - 6);
    this.camera.lookAt(lookTarget);

    // Apply Screen Trauma Shake
    if (this.shakeTimer > 0) {
      const trauma = Math.min(1, this.shakeTimer / 0.5) * this.shakeIntensity * 0.05;
      this.camera.position.x += (Math.random() - 0.5) * trauma;
      this.camera.position.y += (Math.random() - 0.5) * trauma;
    }
  }

  private ensureSpawns() {
    // Spawn obstacles ahead along -Z
    while (this.nextSpawnZ > this.playerZ - 120) {
      this.spawnPatternAt(this.nextSpawnZ);
      const gap = Math.max(16, 28 - this.speed * 0.2);
      this.nextSpawnZ -= gap;
    }

    // Spawn power-ups
    if (this.nextPowerUpZ > this.playerZ - 140) {
      this.spawnPowerUp(this.nextPowerUpZ);
      this.nextPowerUpZ -= 90 + Math.random() * 60;
    }
  }

  private spawnPatternAt(z: number) {
    const roll = Math.random();
    const laneChoices = [-1, 0, 1];

    if (roll < 0.3) {
      // 1. Single Low Barrier
      const lane = laneChoices[Math.floor(Math.random() * 3)];
      this.spawnObstacle('low_barrier', lane, z);
      // Row of coins on another lane
      const otherLane = lane === 0 ? 1 : 0;
      for (let i = 0; i < 4; i++) {
        this.spawnCoin(otherLane, z - i * 3, 0.8, false);
      }
    } else if (roll < 0.55) {
      // 2. High Laser Gate (slide under)
      const lane = laneChoices[Math.floor(Math.random() * 3)];
      this.spawnObstacle('high_laser', lane, z);
      // Coins placed low to encourage sliding under
      for (let i = 0; i < 3; i++) {
        this.spawnCoin(lane, z - i * 2.5, 0.4, false);
      }
    } else if (roll < 0.75) {
      // 3. Patrolling Recon Drone
      const lane = laneChoices[Math.floor(Math.random() * 3)];
      this.spawnObstacle('drone', lane, z);
    } else if (roll < 0.9) {
      // 4. Two lanes blocked (forces quick lane choice!)
      const freeLane = laneChoices[Math.floor(Math.random() * 3)];
      for (const l of laneChoices) {
        if (l !== freeLane) {
          this.spawnObstacle('crate', l, z);
        }
      }
      this.spawnCoin(freeLane, z, 0.8, true);
    } else {
      // 5. Arc of coins leading over hazard spikes
      const lane = laneChoices[Math.floor(Math.random() * 3)];
      this.spawnObstacle('hazard_spikes', lane, z);
      for (let i = 0; i < 5; i++) {
        const arcY = 0.8 + Math.sin((i / 4) * Math.PI) * 2.5;
        this.spawnCoin(lane, z - 4 + i * 2, arcY, i === 2);
      }
    }
  }

  private spawnObstacle(type: Obstacle3D['type'], lane: number, z: number) {
    const x = LANES[lane + 1];
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    let box = new THREE.Box3();

    switch (type) {
      case 'low_barrier': {
        // Barricade (jump over)
        const barGeo = new THREE.BoxGeometry(2.3, 0.75, 0.4);
        const barMat = new THREE.MeshStandardMaterial({ color: 0x141f2e, roughness: 0.4, metalness: 0.8 });
        const mesh = new THREE.Mesh(barGeo, barMat);
        mesh.position.y = 0.38;
        group.add(mesh);

        // Warning neon stripe
        const stripMat = new THREE.MeshBasicMaterial({ color: 0xff2d78 });
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.15, 0.42), stripMat);
        stripe.position.y = 0.55;
        group.add(stripe);

        box = new THREE.Box3(new THREE.Vector3(x - 1.1, 0, z - 0.3), new THREE.Vector3(x + 1.1, 0.85, z + 0.3));
        break;
      }

      case 'high_laser': {
        // High Laser arch (slide under)
        const postMat = new THREE.MeshStandardMaterial({ color: 0x121b27, roughness: 0.5, metalness: 0.8 });
        const postL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.8, 0.3), postMat);
        postL.position.set(-1.1, 1.4, 0);
        group.add(postL);

        const postR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.8, 0.3), postMat);
        postR.position.set(1.1, 1.4, 0);
        group.add(postR);

        // Glowing red laser bar at head height
        const laserGeo = new THREE.BoxGeometry(2.2, 0.8, 0.15);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0xff2d78, transparent: true, opacity: 0.85 });
        const laser = new THREE.Mesh(laserGeo, laserMat);
        laser.position.set(0, 1.6, 0);
        group.add(laser);

        box = new THREE.Box3(new THREE.Vector3(x - 1.1, 1.1, z - 0.2), new THREE.Vector3(x + 1.1, 2.3, z + 0.2));
        break;
      }

      case 'drone': {
        // Recon Drone hovering at waist height
        const droneMat = new THREE.MeshStandardMaterial({ color: 0x152233, roughness: 0.3, metalness: 0.9 });
        const droneBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.6), droneMat);
        droneBody.position.y = 1.2;
        group.add(droneBody);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2d78 }));
        eye.position.set(0, 1.2, 0.32);
        group.add(eye);

        box = new THREE.Box3(new THREE.Vector3(x - 0.7, 0.6, z - 0.5), new THREE.Vector3(x + 0.7, 1.7, z + 0.5));
        break;
      }

      case 'crate': {
        // Heavy Nanite Crate (solid blockade)
        const crateGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x0f1824, roughness: 0.6, metalness: 0.5 });
        const crate = new THREE.Mesh(crateGeo, crateMat);
        crate.position.y = 1.1;
        group.add(crate);

        const glowLine = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.15, 2.25), new THREE.MeshBasicMaterial({ color: 0xffa033 }));
        glowLine.position.y = 1.1;
        group.add(glowLine);

        box = new THREE.Box3(new THREE.Vector3(x - 1.1, 0, z - 1.1), new THREE.Vector3(x + 1.1, 2.4, z + 1.1));
        break;
      }

      case 'hazard_spikes': {
        // Electrified floor grid
        const gridGeo = new THREE.BoxGeometry(2.4, 0.12, 3.5);
        const gridMat = new THREE.MeshBasicMaterial({ color: 0xffc857 });
        const grid = new THREE.Mesh(gridGeo, gridMat);
        grid.position.y = 0.06;
        group.add(grid);

        box = new THREE.Box3(new THREE.Vector3(x - 1.2, 0, z - 1.8), new THREE.Vector3(x + 1.2, 0.6, z + 1.8));
        break;
      }
    }

    this.scene.add(group);
    this.obstacles.push({
      mesh: group,
      type,
      lane,
      z,
      y: 0,
      dead: false,
      box,
    });
  }

  private spawnCoin(lane: number, z: number, y: number, isRare: boolean) {
    const x = LANES[lane + 1];
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 8);
    const coinMat = new THREE.MeshStandardMaterial({
      color: isRare ? 0xff2d78 : 0xffc857,
      emissive: isRare ? 0xff2d78 : 0xffaa00,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.9,
    });

    const mesh = new THREE.Mesh(coinGeo, coinMat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.coins.push({
      mesh,
      lane,
      z,
      y,
      isRare,
      dead: false,
    });
  }

  private spawnPowerUp(z: number) {
    const kinds: PowerUpKind[] = ['shield', 'magnet', 'speed', 'x2', 'slow', 'health'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const lane = Math.floor(Math.random() * 3) - 1;
    const x = LANES[lane + 1];
    const y = 1.3;

    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Octahedron capsule container
    const meta = POW_META[kind];
    const capGeo = new THREE.OctahedronGeometry(0.65, 0);
    const capMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(meta.color),
      emissive: new THREE.Color(meta.color),
      emissiveIntensity: 1.8,
      wireframe: true,
    });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    group.add(capMesh);

    // Glowing core sphere
    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 8, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(meta.color) })
    );
    group.add(coreMesh);

    this.scene.add(group);
    this.powerUps.push({
      mesh: group,
      kind,
      lane,
      z,
      y,
      dead: false,
    });
  }

  private spawnBossBullet(x: number, y: number, z: number, vx: number, vy: number, vz: number) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2d78 })
    );
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    // Add to obstacles list as dynamic projectile
    this.obstacles.push({
      mesh: mesh as any,
      type: 'drone',
      lane: 0,
      z,
      y,
      dead: false,
      box: new THREE.Box3(new THREE.Vector3(x - 0.4, y - 0.4, z - 0.4), new THREE.Vector3(x + 0.4, y + 0.4, z + 0.4)),
    });
  }

  private updateObstacles(dt: number) {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(this.playerX - 0.65, this.playerY, this.playerZ - 0.6),
      new THREE.Vector3(this.playerX + 0.65, this.playerY + (this.isSliding ? 0.75 : 1.85), this.playerZ + 0.6)
    );

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      // Clean up behind player
      if (obs.z > this.playerZ + 15 || obs.dead) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
        continue;
      }

      // Drone animation bobbing
      if (obs.type === 'drone') {
        obs.mesh.position.y = 1.2 + Math.sin(this.runTime * 4 + obs.z) * 0.3;
        obs.box.min.y = obs.mesh.position.y - 0.4;
        obs.box.max.y = obs.mesh.position.y + 0.4;
      }

      // Check Collision with player
      if (playerBox.intersectsBox(obs.box)) {
        if (this.isSliding && obs.type === 'drone') {
          // Slide kick drone!
          obs.dead = true;
          this.kills++;
          this.score += 50;
          Storage.updateMission('kills', 1);
          AudioManager.play('kill');
          this.spawnSparks(obs.mesh.position.x, obs.mesh.position.y, obs.mesh.position.z, 0xffa033, 15);
        } else if (!this.isGrounded && this.playerVy < 0 && obs.type === 'drone') {
          // Stomp drone!
          obs.dead = true;
          this.playerVy = 11; // bounce
          this.kills++;
          this.score += 50;
          Storage.updateMission('kills', 1);
          AudioManager.play('kill');
          this.spawnSparks(obs.mesh.position.x, obs.mesh.position.y, obs.mesh.position.z, 0xffa033, 15);
        } else {
          this.takeDamage();
          obs.dead = true;
        }
      }
    }
  }

  private updateCoins(dt: number) {
    const hasMagnet = this.activePows.magnet > 0;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];

      if (coin.z > this.playerZ + 10 || coin.dead) {
        this.scene.remove(coin.mesh);
        this.coins.splice(i, 1);
        continue;
      }

      // Spin coin
      coin.mesh.rotation.z += dt * 4;

      // Magnet attraction
      if (hasMagnet) {
        const dx = this.playerX - coin.mesh.position.x;
        const dy = (this.playerY + 0.8) - coin.mesh.position.y;
        const dz = this.playerZ - coin.mesh.position.z;
        const dist = Math.hypot(dx, dy, dz);

        if (dist < 14) {
          coin.mesh.position.x += (dx / dist) * 18 * dt;
          coin.mesh.position.y += (dy / dist) * 18 * dt;
          coin.mesh.position.z += (dz / dist) * 18 * dt;
        }
      }

      // Collection detection
      const dist = Math.hypot(
        this.playerX - coin.mesh.position.x,
        (this.playerY + 0.8) - coin.mesh.position.y,
        this.playerZ - coin.mesh.position.z
      );

      if (dist < 1.35) {
        coin.dead = true;
        this.collectCoin(coin.isRare);
        this.spawnSparks(
          coin.mesh.position.x,
          coin.mesh.position.y,
          coin.mesh.position.z,
          coin.isRare ? 0xff2d78 : 0xffc857,
          8
        );
      }
    }
  }

  private collectCoin(isRare: boolean) {
    this.combo++;
    this.comboTimer = 2.4;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    const mult = Math.min(5, 1 + Math.floor(this.combo / 8));
    let val = (isRare ? 5 : 1) * mult;
    if (this.activePows.x2 > 0) val *= 2;
    val = Math.max(1, Math.round(val * (1 + 0.15 * Storage.data.upg.coin)));

    this.runCoins += val;
    this.score += val * 10;
    Storage.updateMission('coins', val);

    AudioManager.play(isRare ? 'rare' : 'coin');
  }

  private updatePowerUps(dt: number) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];

      if (p.z > this.playerZ + 10 || p.dead) {
        this.scene.remove(p.mesh);
        this.powerUps.splice(i, 1);
        continue;
      }

      // Floating animation & spin
      p.mesh.rotation.y += dt * 3;
      p.mesh.position.y = p.y + Math.sin(this.runTime * 3 + p.z) * 0.2;

      // Collection
      const dist = Math.hypot(
        this.playerX - p.mesh.position.x,
        (this.playerY + 0.8) - p.mesh.position.y,
        this.playerZ - p.mesh.position.z
      );

      if (dist < 1.5) {
        p.dead = true;
        this.activatePowerUp(p.kind);
        this.spawnSparks(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, 0x19e3ff, 20);
      }
    }
  }

  private activatePowerUp(kind: PowerUpKind) {
    this.powsCollected++;
    Storage.updateMission('power', 1);
    AudioManager.play('power');

    if (kind === 'health') {
      this.hp = Math.min(this.maxHp, this.hp + 1);
      if (this.onToast) this.onToast('NANO REPAIR APPLIED');
      return;
    }

    let dur = POW_META[kind].duration;
    if (kind === 'shield') {
      dur += 2.5 * Storage.data.upg.shield;
    }

    this.activePows[kind] = dur;
    if (this.onToast) this.onToast(`${POW_META[kind].name} ACTIVATED`);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.pause();
    window.removeEventListener('resize', this.handleResize);
    this.clearEntities();
    this.weather?.destroy();
    this.renderer.dispose();
  }
}

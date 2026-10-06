/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { SKINS, TRAILS } from '../constants';
import { SkinId, TrailId } from '../types';

export class RunnerModel {
  public group: THREE.Group;
  public bodyGroup: THREE.Group;
  
  // Limbs for animation
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftShinGroup: THREE.Group;
  private rightShinGroup: THREE.Group;
  private headGroup: THREE.Group;
  private coreMesh: THREE.Mesh;
  private visorMesh: THREE.Mesh;
  private thrusterGlowLeft: THREE.Mesh;
  private thrusterGlowRight: THREE.Mesh;
  private shieldMesh: THREE.Mesh;
  private magnetMesh: THREE.Group;
  private ribbonMesh: THREE.Mesh | null = null;
  private auraMesh: THREE.Mesh | null = null;

  // Materials list for hit flashes & skin swaps
  private armorMaterials: THREE.MeshStandardMaterial[] = [];
  private glowMaterials: THREE.MeshStandardMaterial[] = [];
  private currentSkin: SkinId = 'street';

  // Animation phase timers
  private runCycle = 0;
  private isSliding = false;
  private isJumping = false;
  private damageFlashTimer = 0;

  constructor(skinId: SkinId = 'street') {
    this.currentSkin = skinId;
    this.group = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);

    // Initialize limb hierarchy
    this.leftArmGroup = new THREE.Group();
    this.rightArmGroup = new THREE.Group();
    this.leftLegGroup = new THREE.Group();
    this.rightLegGroup = new THREE.Group();
    this.leftShinGroup = new THREE.Group();
    this.rightShinGroup = new THREE.Group();
    this.headGroup = new THREE.Group();

    // Placeholder refs for TypeScript
    this.coreMesh = new THREE.Mesh();
    this.visorMesh = new THREE.Mesh();
    this.thrusterGlowLeft = new THREE.Mesh();
    this.thrusterGlowRight = new THREE.Mesh();
    this.shieldMesh = new THREE.Mesh();
    this.magnetMesh = new THREE.Group();

    this.buildCharacterMesh(skinId);
  }

  public setSkin(skinId: SkinId) {
    this.currentSkin = skinId;
    // Remove all existing children
    while (this.bodyGroup.children.length > 0) {
      this.bodyGroup.remove(this.bodyGroup.children[0]);
    }
    this.armorMaterials = [];
    this.glowMaterials = [];
    this.buildCharacterMesh(skinId);
  }

  private buildCharacterMesh(skinId: SkinId) {
    const skin = SKINS[skinId] || SKINS.street;

    const suitMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skin.suitColor),
      roughness: 0.35,
      metalness: 0.7,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skin.accentColor),
      roughness: 0.25,
      metalness: 0.85,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skin.glowColor),
      emissive: new THREE.Color(skin.glowColor),
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.1,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skin.visorColor),
      emissive: new THREE.Color(skin.visorColor),
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9,
    });

    this.armorMaterials.push(suitMat, accentMat);
    this.glowMaterials.push(glowMat, visorMat);

    // 1. Torso & Pelvis
    const pelvis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.22, 8),
      suitMat
    );
    pelvis.position.y = 0.88;
    this.bodyGroup.add(pelvis);

    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.52, 0.38),
      suitMat
    );
    chest.position.y = 1.25;
    this.bodyGroup.add(chest);

    // Chest armor plate
    const chestPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.38, 0.12),
      accentMat
    );
    chestPlate.position.set(0, 1.28, 0.18);
    this.bodyGroup.add(chestPlate);

    // Glowing Cyber-Core
    this.coreMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12),
      glowMat
    );
    this.coreMesh.rotation.x = Math.PI / 2;
    this.coreMesh.position.set(0, 1.28, 0.24);
    this.bodyGroup.add(this.coreMesh);

    // Jetpack Backpack
    const jetpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.42, 0.18),
      suitMat
    );
    jetpack.position.set(0, 1.25, -0.25);
    this.bodyGroup.add(jetpack);

    // Thruster nozzles & glow
    const nozzleLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8),
      accentMat
    );
    nozzleLeft.position.set(-0.12, 1.02, -0.25);
    this.bodyGroup.add(nozzleLeft);

    const nozzleRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8),
      accentMat
    );
    nozzleRight.position.set(0.12, 1.02, -0.25);
    this.bodyGroup.add(nozzleRight);

    this.thrusterGlowLeft = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      glowMat
    );
    this.thrusterGlowLeft.position.set(-0.12, 0.94, -0.25);
    this.bodyGroup.add(this.thrusterGlowLeft);

    this.thrusterGlowRight = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      glowMat
    );
    this.thrusterGlowRight.position.set(0.12, 0.94, -0.25);
    this.bodyGroup.add(this.thrusterGlowRight);

    // Shoulder Pauldrons
    if (skin.hasPauldrons) {
      const pauldronLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.16, 0.28),
        accentMat
      );
      pauldronLeft.position.set(-0.38, 1.48, 0);
      pauldronLeft.rotation.z = 0.25;
      this.bodyGroup.add(pauldronLeft);

      const pauldronRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.16, 0.28),
        accentMat
      );
      pauldronRight.position.set(0.38, 1.48, 0);
      pauldronRight.rotation.z = -0.25;
      this.bodyGroup.add(pauldronRight);
    }

    // 2. Head & Helmet
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.62, 0);
    this.bodyGroup.add(this.headGroup);

    const helmet = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.36, 0.36),
      suitMat
    );
    this.headGroup.add(helmet);

    // Visor strip
    this.visorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.14, 0.1),
      visorMat
    );
    this.visorMesh.position.set(0, 0.03, 0.16);
    this.headGroup.add(this.visorMesh);

    // Cyber antenna / crown
    const earAntennaL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.24, 6),
      accentMat
    );
    earAntennaL.position.set(-0.18, 0.15, -0.05);
    earAntennaL.rotation.z = -0.2;
    this.headGroup.add(earAntennaL);

    const earAntennaR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.24, 6),
      accentMat
    );
    earAntennaR.position.set(0.18, 0.15, -0.05);
    earAntennaR.rotation.z = 0.2;
    this.headGroup.add(earAntennaR);

    // Flowing Ninja Ribbon
    if (skin.hasRibbon) {
      const ribbonGeo = new THREE.PlaneGeometry(0.12, 1.2, 1, 8);
      const ribbonMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(skin.glowColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      this.ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
      this.ribbonMesh.position.set(0, 0.05, -0.24);
      this.ribbonMesh.rotation.x = Math.PI / 4;
      this.headGroup.add(this.ribbonMesh);
    }

    // Astral Aura
    if (skin.hasAura) {
      const auraGeo = new THREE.RingGeometry(0.65, 0.8, 24);
      const auraMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(skin.glowColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
      this.auraMesh.position.set(0, 1.2, 0);
      this.auraMesh.rotation.x = Math.PI / 2;
      this.bodyGroup.add(this.auraMesh);
    }

    // 3. Arms
    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.35, 1.44, 0);
    this.bodyGroup.add(this.leftArmGroup);

    const armUpperL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.14), suitMat);
    armUpperL.position.y = -0.16;
    this.leftArmGroup.add(armUpperL);

    const forearmL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), accentMat);
    forearmL.position.set(0, -0.42, 0.06);
    this.leftArmGroup.add(forearmL);

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.35, 1.44, 0);
    this.bodyGroup.add(this.rightArmGroup);

    const armUpperR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.14), suitMat);
    armUpperR.position.y = -0.16;
    this.rightArmGroup.add(armUpperR);

    const forearmR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), accentMat);
    forearmR.position.set(0, -0.42, 0.06);
    this.rightArmGroup.add(forearmR);

    // 4. Legs
    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.16, 0.82, 0);
    this.bodyGroup.add(this.leftLegGroup);

    const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.16), suitMat);
    thighL.position.y = -0.21;
    this.leftLegGroup.add(thighL);

    this.leftShinGroup = new THREE.Group();
    this.leftShinGroup.position.set(0, -0.42, 0);
    this.leftLegGroup.add(this.leftShinGroup);

    const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), accentMat);
    shinL.position.y = -0.21;
    this.leftShinGroup.add(shinL);

    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.28), glowMat);
    bootL.position.set(0, -0.42, 0.06);
    this.leftShinGroup.add(bootL);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.16, 0.82, 0);
    this.bodyGroup.add(this.rightLegGroup);

    const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.16), suitMat);
    thighR.position.y = -0.21;
    this.rightLegGroup.add(thighR);

    this.rightShinGroup = new THREE.Group();
    this.rightShinGroup.position.set(0, -0.42, 0);
    this.rightLegGroup.add(this.rightShinGroup);

    const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), accentMat);
    shinR.position.y = -0.21;
    this.rightShinGroup.add(shinR);

    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.28), glowMat);
    bootR.position.set(0, -0.42, 0.06);
    this.rightShinGroup.add(bootR);

    // 5. FX: Protective Energy Shield
    const shieldGeo = new THREE.SphereGeometry(1.25, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x19e3ff,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 1.0;
    this.group.add(this.shieldMesh);

    // 6. FX: Magnet Vortex
    this.magnetMesh = new THREE.Group();
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.03, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xff2d78, transparent: true, opacity: 0 })
    );
    ring1.rotation.x = Math.PI / 2;
    this.magnetMesh.add(ring1);
    this.magnetMesh.position.y = 1.1;
    this.group.add(this.magnetMesh);
  }

  public triggerHitFlash() {
    this.damageFlashTimer = 0.35;
  }

  public update(
    dt: number,
    speed: number,
    state: {
      isGrounded: boolean;
      isJumping: boolean;
      isSliding: boolean;
      laneLean: number; // -1 to 1 based on lane change
      hasShield: boolean;
      hasMagnet: boolean;
      isDead: boolean;
      isInvulnerable: boolean;
    }
  ) {
    this.isSliding = state.isSliding;
    this.isJumping = state.isJumping;

    // Hit flash handling
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= dt;
      const flashOn = Math.floor(this.damageFlashTimer * 20) % 2 === 0;
      for (const mat of this.armorMaterials) {
        mat.emissive.set(flashOn ? 0xff2d78 : 0x000000);
        mat.emissiveIntensity = flashOn ? 1.0 : 0.0;
      }
    } else {
      for (const mat of this.armorMaterials) {
        mat.emissive.set(0x000000);
        mat.emissiveIntensity = 0;
      }
    }

    // Invulnerability blinking
    if (state.isInvulnerable && !state.isDead) {
      this.group.visible = Math.floor(Date.now() / 90) % 2 === 0;
    } else {
      this.group.visible = true;
    }

    // Shield visibility & animation
    if (state.hasShield) {
      (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(Date.now() * 0.008) * 0.15;
      this.shieldMesh.rotation.y += dt * 1.5;
      this.shieldMesh.rotation.z += dt * 0.8;
      this.shieldMesh.visible = true;
    } else {
      this.shieldMesh.visible = false;
    }

    // Magnet vortex animation
    if (state.hasMagnet) {
      this.magnetMesh.visible = true;
      const ring = this.magnetMesh.children[0] as THREE.Mesh;
      if (ring) {
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(Date.now() * 0.01) * 0.2;
        ring.rotation.z += dt * 3.5;
      }
    } else {
      this.magnetMesh.visible = false;
    }

    // Astral Aura animation
    if (this.auraMesh) {
      this.auraMesh.rotation.z += dt * 1.8;
      const s = 1.0 + Math.sin(Date.now() * 0.005) * 0.1;
      this.auraMesh.scale.set(s, s, s);
    }

    // Ribbon wave animation
    if (this.ribbonMesh) {
      this.ribbonMesh.rotation.z = Math.sin(Date.now() * 0.01) * 0.2;
    }

    // Dead animation
    if (state.isDead) {
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, -Math.PI / 2.2, dt * 6);
      this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, 0.2, dt * 6);
      return;
    }

    // Banking & Leaning into Lane Shifts
    const targetRoll = -state.laneLean * 0.28;
    this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, targetRoll, dt * 12);

    // Stride speed scales with running velocity
    const strideFreq = Math.max(8, speed * 0.65);
    this.runCycle += dt * strideFreq;

    if (state.isSliding) {
      // Aerodynamic Low Slide Pose:
      // Drop torso low and lean backward, feet stretch forward
      this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, -0.38, dt * 15);
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, -0.65, dt * 15);

      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 1.2, dt * 15);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 1.0, dt * 15);
      this.leftShinGroup.rotation.x = THREE.MathUtils.lerp(this.leftShinGroup.rotation.x, -0.4, dt * 15);
      this.rightShinGroup.rotation.x = THREE.MathUtils.lerp(this.rightShinGroup.rotation.x, -0.3, dt * 15);

      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, -1.2, dt * 15);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, -1.2, dt * 15);
    } else if (state.isJumping) {
      // Aerodynamic Airborne Jump Pose:
      // Tuck knees, pump arms backward
      this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, 0, dt * 10);
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0.2, dt * 10);

      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0.7, dt * 12);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0.3, dt * 12);
      this.leftShinGroup.rotation.x = THREE.MathUtils.lerp(this.leftShinGroup.rotation.x, 0.8, dt * 12);
      this.rightShinGroup.rotation.x = THREE.MathUtils.lerp(this.rightShinGroup.rotation.x, 0.5, dt * 12);

      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, -1.1, dt * 12);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, -0.8, dt * 12);
    } else {
      // High-Velocity Ground Sprint Pose:
      // Slight forward forward pitch of torso, synchronized limb swinging
      this.bodyGroup.position.y = Math.sin(this.runCycle * 2) * 0.06;
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0.22, dt * 12);

      const legAngle = Math.sin(this.runCycle) * 0.85;
      this.leftLegGroup.rotation.x = legAngle;
      this.rightLegGroup.rotation.x = -legAngle;

      // Natural knee flexion
      this.leftShinGroup.rotation.x = legAngle > 0 ? 0.6 * legAngle : 0;
      this.rightShinGroup.rotation.x = -legAngle > 0 ? -0.6 * legAngle : 0;

      // Opposing arm pumps
      this.leftArmGroup.rotation.x = -legAngle * 0.85;
      this.rightArmGroup.rotation.x = legAngle * 0.85;
      this.leftArmGroup.rotation.z = 0.15;
      this.rightArmGroup.rotation.z = -0.15;
    }

    // Jet thruster intensity pulse
    const thrusterPulse = 1.0 + Math.sin(this.runCycle * 4) * 0.35;
    this.thrusterGlowLeft.scale.set(thrusterPulse, thrusterPulse, thrusterPulse);
    this.thrusterGlowRight.scale.set(thrusterPulse, thrusterPulse, thrusterPulse);
  }
}

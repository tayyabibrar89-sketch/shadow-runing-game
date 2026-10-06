/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface BossShot {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lane: number;
  dead: boolean;
}

export class BossModel {
  public group: THREE.Group;
  public hp = 30;
  public maxHp = 30;
  public active = false;
  public isEnraged = false;
  public state: 'enter' | 'strafe' | 'fan' | 'sweep' | 'dying' = 'enter';

  private stateTimer = 0;
  private shootTimer = 0;
  private lifeTime = 0;
  private rotorGroup1: THREE.Group;
  private rotorGroup2: THREE.Group;
  private eyeMesh: THREE.Mesh;
  private eyeMaterial: THREE.MeshStandardMaterial;
  private bodyMaterial: THREE.MeshStandardMaterial;
  private wingPods: THREE.Mesh[] = [];
  private hitFlashTimer = 0;

  // Projectiles
  public shots: BossShot[] = [];
  private shotGeo: THREE.SphereGeometry;
  private shotMat: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    this.rotorGroup1 = new THREE.Group();
    this.rotorGroup2 = new THREE.Group();
    this.shotGeo = new THREE.SphereGeometry(0.35, 12, 12);
    this.shotMat = new THREE.MeshBasicMaterial({ color: 0xff2d78 });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x19e3ff,
      emissive: 0x19e3ff,
      emissiveIntensity: 2.5,
      roughness: 0.1,
    });

    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x111c2a,
      roughness: 0.35,
      metalness: 0.85,
    });

    this.eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), this.eyeMaterial);

    this.buildBossMesh();
  }

  private buildBossMesh() {
    // 1. Central Core Fuselage (Heavy Hexagonal Pod)
    const hullGeo = new THREE.CylinderGeometry(1.6, 2.0, 1.2, 6);
    const hull = new THREE.Mesh(hullGeo, this.bodyMaterial);
    hull.rotation.y = Math.PI / 6;
    this.group.add(hull);

    // Armored Top Canopy
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 0.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a2638, roughness: 0.2, metalness: 0.9 })
    );
    canopy.position.y = 0.9;
    this.group.add(canopy);

    // Glowing Cyclops Sensor Eye
    this.eyeMesh.position.set(0, 0, 1.4);
    this.group.add(this.eyeMesh);

    // 2. Wings & Heavy Armament Pods
    const wingGeo = new THREE.BoxGeometry(2.4, 0.22, 1.2);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x162232, roughness: 0.4, metalness: 0.8 });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-2.4, 0, 0);
    leftWing.rotation.z = -0.12;
    this.group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(2.4, 0, 0);
    rightWing.rotation.z = 0.12;
    this.group.add(rightWing);

    // Missile / Plasma Battery Pods
    const podGeo = new THREE.CylinderGeometry(0.35, 0.4, 1.6, 8);
    const podMat = new THREE.MeshStandardMaterial({ color: 0x0c141f, roughness: 0.5, metalness: 0.9 });

    const leftPod = new THREE.Mesh(podGeo, podMat);
    leftPod.rotation.x = Math.PI / 2;
    leftPod.position.set(-3.2, -0.2, 0.2);
    this.group.add(leftPod);
    this.wingPods.push(leftPod);

    const rightPod = new THREE.Mesh(podGeo, podMat);
    rightPod.rotation.x = Math.PI / 2;
    rightPod.position.set(3.2, -0.2, 0.2);
    this.group.add(rightPod);
    this.wingPods.push(rightPod);

    // Pod glowing muzzles
    const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xff2d78 });
    const leftMuzzle = new THREE.Mesh(new THREE.CircleGeometry(0.3, 8), muzzleMat);
    leftMuzzle.position.set(-3.2, -0.2, 1.01);
    this.group.add(leftMuzzle);

    const rightMuzzle = new THREE.Mesh(new THREE.CircleGeometry(0.3, 8), muzzleMat);
    rightMuzzle.position.set(3.2, -0.2, 1.01);
    this.group.add(rightMuzzle);

    // 3. Dual Counter-Rotating Holo-Rotor Rings
    const ringGeo = new THREE.TorusGeometry(1.4, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x19e3ff, transparent: true, opacity: 0.8 });

    this.rotorGroup1 = new THREE.Group();
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    this.rotorGroup1.add(ring1);
    this.rotorGroup1.position.set(-2.2, 0.6, 0);
    this.group.add(this.rotorGroup1);

    this.rotorGroup2 = new THREE.Group();
    const ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
    ring2.rotation.x = Math.PI / 2;
    this.rotorGroup2.add(ring2);
    this.rotorGroup2.position.set(2.2, 0.6, 0);
    this.group.add(this.rotorGroup2);
  }

  public spawn(zoneId: number) {
    this.active = true;
    this.group.visible = true;
    this.maxHp = 30 + zoneId * 15;
    this.hp = this.maxHp;
    this.isEnraged = false;
    this.state = 'enter';
    this.stateTimer = 0;
    this.shootTimer = 0;
    this.lifeTime = 0;
    this.hitFlashTimer = 0;
    this.eyeMaterial.color.set(0x19e3ff);
    this.eyeMaterial.emissive.set(0x19e3ff);

    // Start high and forward
    this.group.position.set(0, 9, -45);
    this.group.rotation.set(0.3, Math.PI, 0);
  }

  public takeDamage(dmg: number): boolean {
    if (this.state === 'dying' || !this.active) return false;
    this.hp -= dmg;
    this.hitFlashTimer = 0.25;

    if (this.hp <= this.maxHp * 0.45 && !this.isEnraged) {
      this.isEnraged = true;
      this.eyeMaterial.color.set(0xff2d78);
      this.eyeMaterial.emissive.set(0xff2d78);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dying';
      this.stateTimer = 0;
      return true; // Boss defeated!
    }
    return false;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    onShoot: (x: number, y: number, z: number, vx: number, vy: number, vz: number) => void
  ) {
    if (!this.active) return;
    this.lifeTime += dt;
    this.stateTimer += dt;
    this.shootTimer += dt;

    // Spin rotor rings
    this.rotorGroup1.rotation.y += dt * 14;
    this.rotorGroup2.rotation.y -= dt * 14;

    // Hit flash handling
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.bodyMaterial.emissive.set(0xffffff);
      this.bodyMaterial.emissiveIntensity = 0.8;
    } else {
      this.bodyMaterial.emissive.set(0x000000);
      this.bodyMaterial.emissiveIntensity = 0;
    }

    const fireRate = this.isEnraged ? 1.1 : 1.8;

    switch (this.state) {
      case 'enter': {
        // Descend and move closer to player along Z
        const targetZ = playerPos.z - 22;
        const targetY = 3.6 + Math.sin(this.lifeTime * 2.5) * 0.5;
        this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, targetZ, dt * 2.2);
        this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, targetY, dt * 2.5);
        this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, 0, dt * 2.5);

        if (this.stateTimer > 2.5) {
          this.state = 'strafe';
          this.stateTimer = 0;
        }
        break;
      }

      case 'strafe': {
        // Weave back and forth across lanes (-3 to +3)
        const strafeFreq = this.isEnraged ? 1.8 : 1.2;
        const targetX = Math.sin(this.stateTimer * strafeFreq) * 3.4;
        const targetY = 3.2 + Math.cos(this.lifeTime * 2.8) * 0.6;
        const targetZ = playerPos.z - 24;

        this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, targetX, dt * 4.0);
        this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, targetY, dt * 3.0);
        this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, targetZ, dt * 5.0);

        // Bank into strafe
        const bankAngle = (this.group.position.x - targetX) * 0.08;
        this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, bankAngle, dt * 6.0);

        // Shoot at intervals
        if (this.shootTimer >= fireRate) {
          this.shootTimer = 0;
          // Spawn plasma bolt toward player
          const dir = new THREE.Vector3().subVectors(playerPos, this.group.position).normalize();
          const speed = 22;
          onShoot(
            this.group.position.x + (Math.random() > 0.5 ? 2.4 : -2.4),
            this.group.position.y - 0.2,
            this.group.position.z + 1.2,
            dir.x * speed * 0.35,
            dir.y * speed * 0.2,
            dir.z * speed
          );
        }

        if (this.stateTimer > 7.0) {
          this.state = Math.random() > 0.5 ? 'fan' : 'sweep';
          this.stateTimer = 0;
        }
        break;
      }

      case 'fan': {
        // Fly high center and emit 3 spread shots
        const targetZ = playerPos.z - 26;
        this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, 0, dt * 4.0);
        this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, 4.8, dt * 3.5);
        this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, targetZ, dt * 5.0);

        if (this.shootTimer >= 1.2) {
          this.shootTimer = 0;
          // Fire 3 lane spread
          [-2.8, 0, 2.8].forEach((laneX) => {
            const targetLanePos = new THREE.Vector3(laneX, 0.8, playerPos.z);
            const dir = new THREE.Vector3().subVectors(targetLanePos, this.group.position).normalize();
            onShoot(
              this.group.position.x,
              this.group.position.y - 0.3,
              this.group.position.z + 1.0,
              dir.x * 20,
              dir.y * 18,
              dir.z * 20
            );
          });
        }

        if (this.stateTimer > 4.0) {
          this.state = 'strafe';
          this.stateTimer = 0;
        }
        break;
      }

      case 'sweep': {
        // Swoop low to force player jump or slide!
        const targetZ = playerPos.z - 18;
        this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, 1.4, dt * 3.0);
        this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, targetZ, dt * 4.0);
        this.group.position.x = Math.sin(this.stateTimer * 2.5) * 2.8;

        if (this.stateTimer > 4.5) {
          this.state = 'strafe';
          this.stateTimer = 0;
        }
        break;
      }

      case 'dying': {
        // Death spin & collapse
        this.group.rotation.x += dt * 4;
        this.group.rotation.y += dt * 6;
        this.group.rotation.z += dt * 5;
        this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, -4, dt * 2.5);
        this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, playerPos.z - 30, dt * 1.5);
        break;
      }
    }
  }

  public dispose() {
    this.active = false;
    this.group.visible = false;
  }
}

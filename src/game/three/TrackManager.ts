/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ZONES, ROAD_WIDTH } from '../constants';
import { ZoneConfig } from '../types';

export interface RoadSegment {
  group: THREE.Group;
  zStart: number;
  length: number;
  hasElevatedWalkway: boolean;
  elevatedWalkwayY: number;
  elevatedWalkwayLane: number;
}

export class TrackManager {
  public scene: THREE.Scene;
  public segments: RoadSegment[] = [];
  public currentZone: ZoneConfig = ZONES[0];

  private segmentLength = 40;
  private totalSegments = 8;
  private roadMaterial: THREE.MeshStandardMaterial;
  private laneLineMaterial: THREE.MeshBasicMaterial;
  private edgeNeonMaterial: THREE.MeshBasicMaterial;
  private buildingMaterial: THREE.MeshStandardMaterial;
  private windowMaterial: THREE.MeshBasicMaterial;
  private skyboxMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Materials
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x07111e,
      roughness: 0.35,
      metalness: 0.65,
    });

    this.laneLineMaterial = new THREE.MeshBasicMaterial({
      color: 0x19e3ff,
      transparent: true,
      opacity: 0.85,
    });

    this.edgeNeonMaterial = new THREE.MeshBasicMaterial({
      color: 0x19e3ff,
      transparent: true,
      opacity: 0.95,
    });

    this.buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x091422,
      roughness: 0.8,
      metalness: 0.2,
    });

    this.windowMaterial = new THREE.MeshBasicMaterial({
      color: 0x19e3ff,
      transparent: true,
      opacity: 0.6,
    });

    this.buildSkybox();
    this.initSegments();
  }

  private buildSkybox() {
    const skyGeo = new THREE.SphereGeometry(350, 32, 16);
    // Load generated cyber city backdrop
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/src/assets/images/skybox_cyber_city_1791260203187.jpg',
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(2, 1);
        const skyMat = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide,
        });
        if (this.skyboxMesh) {
          this.skyboxMesh.material = skyMat;
        }
      },
      undefined,
      () => {
        // Fallback smooth night sky
      }
    );

    const defaultSkyMat = new THREE.MeshBasicMaterial({
      color: 0x030712,
      side: THREE.BackSide,
    });

    this.skyboxMesh = new THREE.Mesh(skyGeo, defaultSkyMat);
    this.scene.add(this.skyboxMesh);
  }

  private initSegments() {
    for (let i = 0; i < this.totalSegments; i++) {
      const zPos = -(i * this.segmentLength);
      const segment = this.createSegment(zPos);
      this.segments.push(segment);
      this.scene.add(segment.group);
    }
  }

  private createSegment(zStart: number): RoadSegment {
    const group = new THREE.Group();
    group.position.z = zStart;

    const len = this.segmentLength;

    // 1. Road Surface Deck
    const roadGeo = new THREE.BoxGeometry(ROAD_WIDTH, 0.4, len);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMaterial);
    roadMesh.position.set(0, -0.2, -len / 2);
    group.add(roadMesh);

    // 2. Roadside Curbs & Glowing Guardrails
    const curbGeo = new THREE.BoxGeometry(0.5, 0.5, len);
    const curbLeft = new THREE.Mesh(curbGeo, this.buildingMaterial);
    curbLeft.position.set(-ROAD_WIDTH / 2 - 0.25, 0.05, -len / 2);
    group.add(curbLeft);

    const curbRight = new THREE.Mesh(curbGeo, this.buildingMaterial);
    curbRight.position.set(ROAD_WIDTH / 2 + 0.25, 0.05, -len / 2);
    group.add(curbRight);

    // Neon Shoulder Lines
    const railGeo = new THREE.BoxGeometry(0.12, 0.12, len);
    const railLeft = new THREE.Mesh(railGeo, this.edgeNeonMaterial);
    railLeft.position.set(-ROAD_WIDTH / 2, 0.08, -len / 2);
    group.add(railLeft);

    const railRight = new THREE.Mesh(railGeo, this.edgeNeonMaterial);
    railRight.position.set(ROAD_WIDTH / 2, 0.08, -len / 2);
    group.add(railRight);

    // 3. Lane Divider Stripes (Two lines separating 3 lanes: X = -1.4 and X = 1.4)
    const stripeCount = Math.floor(len / 4);
    for (let i = 0; i < stripeCount; i++) {
      const stripeZ = -(i * 4 + 2);
      const stripeGeo = new THREE.BoxGeometry(0.1, 0.02, 2.2);

      const stripeL = new THREE.Mesh(stripeGeo, this.laneLineMaterial);
      stripeL.position.set(-1.4, 0.02, stripeZ);
      group.add(stripeL);

      const stripeR = new THREE.Mesh(stripeGeo, this.laneLineMaterial);
      stripeR.position.set(1.4, 0.02, stripeZ);
      group.add(stripeR);
    }

    // 4. Overhead Cyber Gateway / Arch (on every second segment)
    if (Math.abs(zStart / this.segmentLength) % 2 === 0) {
      this.addOverheadGateway(group, -len / 2);
    }

    // 5. Roadside Futuristic Skyscrapers & Hologram Spires
    this.addRoadsideBuildings(group, len);

    // 6. Occasional Elevated Walkway / Ramp Platform
    let hasElevated = false;
    let elevatedY = 2.4;
    let elevatedLane = 0;
    if (Math.random() < 0.35 && Math.abs(zStart) > 80) {
      hasElevated = true;
      elevatedLane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      const laneX = elevatedLane * 2.8;

      const catwalkGeo = new THREE.BoxGeometry(2.4, 0.25, len * 0.7);
      const catwalkMesh = new THREE.Mesh(catwalkGeo, this.roadMaterial);
      catwalkMesh.position.set(laneX, elevatedY, -len / 2);
      group.add(catwalkMesh);

      // Neon edges on catwalk
      const catRailL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, len * 0.7), this.edgeNeonMaterial);
      catRailL.position.set(laneX - 1.2, elevatedY + 0.1, -len / 2);
      group.add(catRailL);

      const catRailR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, len * 0.7), this.edgeNeonMaterial);
      catRailR.position.set(laneX + 1.2, elevatedY + 0.1, -len / 2);
      group.add(catRailR);

      // Support pillars
      const pillarGeo = new THREE.CylinderGeometry(0.18, 0.22, elevatedY, 8);
      const p1 = new THREE.Mesh(pillarGeo, this.buildingMaterial);
      p1.position.set(laneX, elevatedY / 2, -len * 0.3);
      group.add(p1);

      const p2 = new THREE.Mesh(pillarGeo, this.buildingMaterial);
      p2.position.set(laneX, elevatedY / 2, -len * 0.7);
      group.add(p2);
    }

    return {
      group,
      zStart,
      length: len,
      hasElevatedWalkway: hasElevated,
      elevatedWalkwayY: elevatedY,
      elevatedWalkwayLane: elevatedLane,
    };
  }

  private addOverheadGateway(group: THREE.Group, zPos: number) {
    const archH = 6.2;
    const archW = ROAD_WIDTH + 1.4;

    // Pillar Left & Right
    const pGeo = new THREE.BoxGeometry(0.6, archH, 0.8);
    const pLeft = new THREE.Mesh(pGeo, this.buildingMaterial);
    pLeft.position.set(-archW / 2, archH / 2, zPos);
    group.add(pLeft);

    const pRight = new THREE.Mesh(pGeo, this.buildingMaterial);
    pRight.position.set(archW / 2, archH / 2, zPos);
    group.add(pRight);

    // Crossbar
    const barGeo = new THREE.BoxGeometry(archW, 0.7, 0.8);
    const barMesh = new THREE.Mesh(barGeo, this.buildingMaterial);
    barMesh.position.set(0, archH, zPos);
    group.add(barMesh);

    // Glowing Neon Hologram Sign
    const signGeo = new THREE.BoxGeometry(archW * 0.7, 0.4, 0.1);
    const signMesh = new THREE.Mesh(signGeo, this.edgeNeonMaterial);
    signMesh.position.set(0, archH - 0.1, zPos + 0.45);
    group.add(signMesh);
  }

  private addRoadsideBuildings(group: THREE.Group, len: number) {
    // Left side buildings
    for (let i = 0; i < 3; i++) {
      const zOffset = -(i * (len / 3) + 4);
      const bWidth = 6 + Math.random() * 8;
      const bHeight = 22 + Math.random() * 45;
      const bDepth = 8 + Math.random() * 8;
      const bX = -(ROAD_WIDTH / 2 + 5 + bWidth / 2);

      const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMesh = new THREE.Mesh(bGeo, this.buildingMaterial);
      bMesh.position.set(bX, bHeight / 2 - 2, zOffset);
      group.add(bMesh);

      // Window grid strip
      const winGeo = new THREE.BoxGeometry(bWidth * 0.7, bHeight * 0.6, 0.1);
      const winMesh = new THREE.Mesh(winGeo, this.windowMaterial);
      winMesh.position.set(bX, bHeight / 2, zOffset + bDepth / 2 + 0.1);
      group.add(winMesh);
    }

    // Right side buildings
    for (let i = 0; i < 3; i++) {
      const zOffset = -(i * (len / 3) + 4);
      const bWidth = 6 + Math.random() * 8;
      const bHeight = 22 + Math.random() * 45;
      const bDepth = 8 + Math.random() * 8;
      const bX = ROAD_WIDTH / 2 + 5 + bWidth / 2;

      const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMesh = new THREE.Mesh(bGeo, this.buildingMaterial);
      bMesh.position.set(bX, bHeight / 2 - 2, zOffset);
      group.add(bMesh);

      const winGeo = new THREE.BoxGeometry(bWidth * 0.7, bHeight * 0.6, 0.1);
      const winMesh = new THREE.Mesh(winGeo, this.windowMaterial);
      winMesh.position.set(bX, bHeight / 2, zOffset + bDepth / 2 + 0.1);
      group.add(winMesh);
    }
  }

  public setZone(zoneIndex: number) {
    this.currentZone = ZONES[zoneIndex % ZONES.length];

    const neonColor = new THREE.Color(this.currentZone.neonColor);
    this.edgeNeonMaterial.color.copy(neonColor);
    this.laneLineMaterial.color.copy(neonColor);
    this.windowMaterial.color.copy(neonColor);
    this.roadMaterial.color.setHex(this.currentZone.groundColor);
  }

  public update(playerZ: number) {
    if (this.skyboxMesh) {
      this.skyboxMesh.position.z = playerZ;
    }

    // Recycle road segments that are far behind the player
    for (const segment of this.segments) {
      // If segment is more than 30 units behind player
      if (segment.group.position.z > playerZ + 35) {
        // Find furthest segment forward
        let minZ = 0;
        for (const s of this.segments) {
          if (s.group.position.z < minZ) {
            minZ = s.group.position.z;
          }
        }
        segment.group.position.z = minZ - this.segmentLength;
      }
    }
  }

  public getPlatformUnder(x: number, z: number): number | null {
    // Check if player is over any elevated walkway
    for (const seg of this.segments) {
      if (!seg.hasElevatedWalkway) continue;
      const segStart = seg.group.position.z;
      const segEnd = segStart - seg.length;
      if (z <= segStart && z >= segEnd) {
        const laneX = seg.elevatedWalkwayLane * 2.8;
        if (Math.abs(x - laneX) < 1.4) {
          return seg.elevatedWalkwayY;
        }
      }
    }
    return null;
  }
}

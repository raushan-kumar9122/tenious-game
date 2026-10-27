/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ShotType } from '../types';

export type PlayerAnimState =
  | 'idle'
  | 'run'
  | 'forehand'
  | 'backhand'
  | 'lob'
  | 'smash'
  | 'serveToss'
  | 'serveStrike'
  | 'celebrate'
  | 'disappointed';

export class TennisPlayer3D {
  public group: THREE.Group;
  public playerId: 1 | 2;
  public isServing: boolean = false;

  // Nodes for animation
  private bodyRoot: THREE.Group;
  private torso: THREE.Mesh;
  private head: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private rightForearm: THREE.Group;
  private racketGroup: THREE.Group;
  private racketHeadMesh: THREE.Mesh;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftShinGroup: THREE.Group;
  private rightShinGroup: THREE.Group;

  // Animation state
  public animState: PlayerAnimState = 'idle';
  private animTimer: number = 0;
  private animDuration: number = 0;
  private runCycleTime: number = 0;
  private isMoving: boolean = false;
  private targetYaw: number = 0;

  // Temp vectors for zero-GC calculations
  private static _v1 = new THREE.Vector3();
  private static _v2 = new THREE.Vector3();

  constructor(playerId: 1 | 2, outfitColor: string = '#2563eb', shortsColor: string = '#ffffff') {
    this.playerId = playerId;
    this.group = new THREE.Group();
    this.group.name = `Player_${playerId}`;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdfab8e,
      roughness: 0.65,
      metalness: 0.05,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(outfitColor),
      roughness: 0.6,
      metalness: 0.05,
    });
    const shortsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shortsColor),
      roughness: 0.7,
      metalness: 0.02,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
    });
    const sockMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: playerId === 1 ? 0x271910 : 0xd4a373,
      roughness: 0.8,
    });
    const bandMat = new THREE.MeshStandardMaterial({
      color: playerId === 1 ? 0xffffff : 0xef4444,
      roughness: 0.5,
    });

    // Root node
    this.bodyRoot = new THREE.Group();
    this.bodyRoot.position.y = 0.95; // Hip level
    this.group.add(this.bodyRoot);

    // 1. Pelvis & Shorts
    const hipsGeom = new THREE.BoxGeometry(0.36, 0.22, 0.24);
    const hips = new THREE.Mesh(hipsGeom, shortsMat);
    hips.castShadow = true;
    this.bodyRoot.add(hips);

    // 2. Torso & Polo Shirt
    const torsoGeom = new THREE.BoxGeometry(0.42, 0.54, 0.26);
    this.torso = new THREE.Mesh(torsoGeom, shirtMat);
    this.torso.position.y = 0.36;
    this.torso.castShadow = true;
    this.bodyRoot.add(this.torso);

    // Collar detail
    const collarGeom = new THREE.BoxGeometry(0.3, 0.05, 0.22);
    const collar = new THREE.Mesh(collarGeom, shortsMat);
    collar.position.y = 0.28;
    this.torso.add(collar);

    // 3. Head & Hair / Headband
    this.head = new THREE.Group();
    this.head.position.y = 0.38;
    this.torso.add(this.head);

    const headGeom = new THREE.SphereGeometry(0.14, 16, 16);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Hair
    const hairGeom = new THREE.SphereGeometry(0.145, 14, 14, 0, Math.PI * 2, 0, Math.PI / 1.7);
    const hairMesh = new THREE.Mesh(hairGeom, hairMat);
    hairMesh.position.y = 0.02;
    this.head.add(hairMesh);

    // Tennis Headband
    const bandGeom = new THREE.CylinderGeometry(0.146, 0.146, 0.04, 16);
    const headband = new THREE.Mesh(bandGeom, bandMat);
    headband.position.y = 0.02;
    this.head.add(headband);

    // 4. Left Arm (Shoulder -> Forearm -> Hand)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.26, 0.22, 0);
    this.torso.add(this.leftArmGroup);

    const leftUpperArmGeom = new THREE.CylinderGeometry(0.06, 0.055, 0.28, 8);
    const leftUpperArm = new THREE.Mesh(leftUpperArmGeom, skinMat);
    leftUpperArm.position.y = -0.14;
    leftUpperArm.castShadow = true;
    this.leftArmGroup.add(leftUpperArm);

    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.28;
    this.leftArmGroup.add(leftForearm);

    const leftLowerArmGeom = new THREE.CylinderGeometry(0.05, 0.045, 0.26, 8);
    const leftLowerArmMesh = new THREE.Mesh(leftLowerArmGeom, skinMat);
    leftLowerArmMesh.position.y = -0.13;
    leftLowerArmMesh.castShadow = true;
    leftForearm.add(leftLowerArmMesh);

    // 5. Right Arm (Primary Hitting Arm & Racket Holder)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.26, 0.22, 0);
    this.torso.add(this.rightArmGroup);

    const rightUpperArmGeom = new THREE.CylinderGeometry(0.065, 0.06, 0.28, 8);
    const rightUpperArm = new THREE.Mesh(rightUpperArmGeom, skinMat);
    rightUpperArm.position.y = -0.14;
    rightUpperArm.castShadow = true;
    this.rightArmGroup.add(rightUpperArm);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.y = -0.28;
    this.rightArmGroup.add(this.rightForearm);

    const rightLowerArmGeom = new THREE.CylinderGeometry(0.055, 0.05, 0.26, 8);
    const rightLowerArmMesh = new THREE.Mesh(rightLowerArmGeom, skinMat);
    rightLowerArmMesh.position.y = -0.13;
    rightLowerArmMesh.castShadow = true;
    this.rightForearm.add(rightLowerArmMesh);

    // 6. 3D Tennis Racket Assembly
    this.racketGroup = new THREE.Group();
    this.racketGroup.position.set(0, -0.27, 0.05);
    this.rightForearm.add(this.racketGroup);

    // Racket handle grip
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const frameMat = new THREE.MeshStandardMaterial({
      color: playerId === 1 ? 0xd97706 : 0x059669,
      metalness: 0.5,
      roughness: 0.3,
    });
    const stringsMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.65,
      roughness: 0.3,
    });

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.24, 8), handleMat);
    handle.position.y = -0.12;
    handle.castShadow = true;
    this.racketGroup.add(handle);

    // Racket throat (V shape)
    const throatL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), frameMat);
    throatL.position.set(-0.03, 0.04, 0);
    throatL.rotation.z = -0.25;
    this.racketGroup.add(throatL);

    const throatR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), frameMat);
    throatR.position.set(0.03, 0.04, 0);
    throatR.rotation.z = 0.25;
    this.racketGroup.add(throatR);

    // Racket oval rim (Torus)
    const rimGeom = new THREE.TorusGeometry(0.18, 0.014, 8, 24);
    rimGeom.scale(0.85, 1.25, 1.0); // Oval tennis racket head shape
    this.racketHeadMesh = new THREE.Mesh(rimGeom, frameMat);
    this.racketHeadMesh.position.set(0, 0.24, 0);
    this.racketHeadMesh.castShadow = true;
    this.racketGroup.add(this.racketHeadMesh);

    // String mesh bed
    const stringsGeom = new THREE.PlaneGeometry(0.28, 0.4);
    const stringsMesh = new THREE.Mesh(stringsGeom, stringsMat);
    stringsMesh.position.set(0, 0.24, 0);
    this.racketGroup.add(stringsMesh);

    // 7. Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.12, -0.12, 0);
    this.bodyRoot.add(this.leftLegGroup);

    const thighGeom = new THREE.CylinderGeometry(0.075, 0.065, 0.38, 8);
    const leftThigh = new THREE.Mesh(thighGeom, skinMat);
    leftThigh.position.y = -0.19;
    leftThigh.castShadow = true;
    this.leftLegGroup.add(leftThigh);

    this.leftShinGroup = new THREE.Group();
    this.leftShinGroup.position.y = -0.38;
    this.leftLegGroup.add(this.leftShinGroup);

    const shinGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.38, 8);
    const leftShin = new THREE.Mesh(shinGeom, sockMat);
    leftShin.position.y = -0.19;
    leftShin.castShadow = true;
    this.leftShinGroup.add(leftShin);

    const shoeGeom = new THREE.BoxGeometry(0.12, 0.09, 0.26);
    const leftShoe = new THREE.Mesh(shoeGeom, shoeMat);
    leftShoe.position.set(0, -0.38, 0.05);
    leftShoe.castShadow = true;
    this.leftShinGroup.add(leftShoe);

    // 8. Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.12, -0.12, 0);
    this.bodyRoot.add(this.rightLegGroup);

    const rightThigh = new THREE.Mesh(thighGeom, skinMat);
    rightThigh.position.y = -0.19;
    rightThigh.castShadow = true;
    this.rightLegGroup.add(rightThigh);

    this.rightShinGroup = new THREE.Group();
    this.rightShinGroup.position.y = -0.38;
    this.rightLegGroup.add(this.rightShinGroup);

    const rightShin = new THREE.Mesh(shinGeom, sockMat);
    rightShin.position.y = -0.19;
    rightShin.castShadow = true;
    this.rightShinGroup.add(rightShin);

    const rightShoe = new THREE.Mesh(shoeGeom, shoeMat);
    rightShoe.position.set(0, -0.38, 0.05);
    rightShoe.castShadow = true;
    this.rightShinGroup.add(rightShoe);

    // Orient players: Player 1 (near side, facing -Z toward net), Player 2 (far side, facing +Z toward net)
    this.targetYaw = playerId === 1 ? 0 : Math.PI;
    this.group.rotation.y = this.targetYaw;
  }

  public setPosition(x: number, z: number) {
    this.group.position.x = x;
    this.group.position.z = z;
  }

  public setMoving(moving: boolean) {
    this.isMoving = moving;
    if (this.animState === 'idle' && moving) {
      this.animState = 'run';
    } else if (this.animState === 'run' && !moving) {
      this.animState = 'idle';
    }
  }

  public playAnimation(anim: PlayerAnimState, duration: number = 0.45) {
    this.animState = anim;
    this.animTimer = 0;
    this.animDuration = duration;
  }

  public triggerShotAnimation(shot: ShotType, duration: number = 0.48) {
    if (shot === 'serve') {
      this.playAnimation('serveStrike', duration);
    } else if (shot === 'smash') {
      this.playAnimation('smash', duration);
    } else if (shot === 'lob') {
      this.playAnimation('lob', duration);
    } else if (shot === 'slice') {
      this.playAnimation('backhand', duration);
    } else {
      this.playAnimation('forehand', duration);
    }
  }

  public getRacketWorldPosition(targetVec: THREE.Vector3): THREE.Vector3 {
    return this.racketHeadMesh.getWorldPosition(targetVec);
  }

  public update(delta: number) {
    this.animTimer += delta;

    // Face toward opponent side of court by default, with slight dynamic body angling
    const baseFacing = this.playerId === 1 ? 0 : Math.PI;

    if (this.animState === 'idle') {
      // Ready bouncing stance: weight shifting, racket held in front with two hands
      const bounceFreq = 7.0;
      const bounce = Math.sin(this.animTimer * bounceFreq) * 0.04;
      this.bodyRoot.position.y = 0.95 + bounce;

      // Subtle knee bend
      this.leftLegGroup.rotation.x = -0.15;
      this.rightLegGroup.rotation.x = -0.15;
      this.leftShinGroup.rotation.x = 0.25;
      this.rightShinGroup.rotation.x = 0.25;

      // Torso slight forward lean
      this.torso.rotation.x = 0.12;
      this.torso.rotation.y = 0;

      // Arms holding racket ready
      this.rightArmGroup.rotation.set(-0.6, 0.4, 0.3);
      this.rightForearm.rotation.set(-0.8, -0.2, 0);
      this.racketGroup.rotation.set(-0.3, 0.2, 0.1);

      this.leftArmGroup.rotation.set(-0.5, -0.4, -0.2);
    } else if (this.animState === 'run') {
      // Sprinting animation: running stride cycle
      this.runCycleTime += delta * 12.0;
      const stride = Math.sin(this.runCycleTime);
      const bob = Math.abs(Math.cos(this.runCycleTime)) * 0.06;

      this.bodyRoot.position.y = 0.95 + bob;
      this.torso.rotation.x = 0.22; // Leaning into sprint
      this.torso.rotation.y = stride * 0.15;

      // Legs swing
      this.leftLegGroup.rotation.x = stride * 0.65;
      this.rightLegGroup.rotation.x = -stride * 0.65;
      this.leftShinGroup.rotation.x = Math.max(0, -stride * 0.7);
      this.rightShinGroup.rotation.x = Math.max(0, stride * 0.7);

      // Arms swing naturally with racket held secure
      this.rightArmGroup.rotation.set(-0.4 - stride * 0.3, 0.2, 0.2);
      this.leftArmGroup.rotation.set(-0.4 + stride * 0.4, -0.2, -0.2);
    } else if (this.animState === 'forehand') {
      // Powerful forehand stroke: backswing -> impact -> follow-through
      const progress = Math.min(1.0, this.animTimer / this.animDuration);

      if (progress < 0.28) {
        // Backswing loading
        const t = progress / 0.28;
        this.torso.rotation.y = THREE.MathUtils.lerp(0, -0.65, t);
        this.rightArmGroup.rotation.set(0.1, -0.5 * t, 0.8 * t);
        this.racketGroup.rotation.set(0, 0, -1.2 * t);
      } else if (progress < 0.65) {
        // Forward swing & ball impact
        const t = (progress - 0.28) / 0.37;
        this.torso.rotation.y = THREE.MathUtils.lerp(-0.65, 0.6, t);
        this.rightArmGroup.rotation.set(-1.0 * t, 0.8 * t, -0.5 * t);
        this.rightForearm.rotation.set(-0.6, 0.4, 0);
        this.racketGroup.rotation.set(0.5 * t, 0.8 * t, 0.8 * t);
      } else {
        // Follow-through across opposite shoulder
        const t = (progress - 0.65) / 0.35;
        this.torso.rotation.y = THREE.MathUtils.lerp(0.6, 0, t);
        this.rightArmGroup.rotation.set(
          THREE.MathUtils.lerp(-1.0, -0.6, t),
          THREE.MathUtils.lerp(0.8, 0.4, t),
          0.3
        );
      }

      if (progress >= 1.0) {
        this.animState = this.isMoving ? 'run' : 'idle';
      }
    } else if (this.animState === 'backhand') {
      // Fluid backhand drive
      const progress = Math.min(1.0, this.animTimer / this.animDuration);

      if (progress < 0.3) {
        const t = progress / 0.3;
        this.torso.rotation.y = THREE.MathUtils.lerp(0, 0.7, t);
        this.rightArmGroup.rotation.set(-0.3, 0.8 * t, -0.4 * t);
      } else if (progress < 0.7) {
        const t = (progress - 0.3) / 0.4;
        this.torso.rotation.y = THREE.MathUtils.lerp(0.7, -0.7, t);
        this.rightArmGroup.rotation.set(-0.9 * t, -0.8 * t, 0.5 * t);
      } else {
        const t = (progress - 0.7) / 0.3;
        this.torso.rotation.y = THREE.MathUtils.lerp(-0.7, 0, t);
      }

      if (progress >= 1.0) {
        this.animState = this.isMoving ? 'run' : 'idle';
      }
    } else if (this.animState === 'serveToss') {
      // Trophy position: Left arm tosses ball up, right racket arches behind back
      this.torso.rotation.x = -0.15; // arched back
      this.leftArmGroup.rotation.set(-2.8, -0.2, 0); // straight up
      this.rightArmGroup.rotation.set(1.1, 0.5, 0.9); // racket cocked behind neck
      this.racketGroup.rotation.set(-1.4, 0, 0);
    } else if (this.animState === 'serveStrike') {
      // Explosive reach and smash down
      const progress = Math.min(1.0, this.animTimer / this.animDuration);
      if (progress < 0.45) {
        // High reach strike
        const t = progress / 0.45;
        this.torso.rotation.x = THREE.MathUtils.lerp(-0.15, 0.35, t);
        this.rightArmGroup.rotation.set(
          THREE.MathUtils.lerp(1.1, -2.9, t),
          0.2,
          THREE.MathUtils.lerp(0.9, 0.1, t)
        );
        this.racketGroup.rotation.set(
          THREE.MathUtils.lerp(-1.4, 0.4, t),
          0,
          0
        );
        this.leftArmGroup.rotation.set(-1.2, -0.4, -0.3);
      } else {
        // Follow-through across left hip
        const t = (progress - 0.45) / 0.55;
        this.torso.rotation.x = THREE.MathUtils.lerp(0.35, 0.12, t);
        this.rightArmGroup.rotation.set(
          THREE.MathUtils.lerp(-2.9, -0.6, t),
          0.4,
          0.3
        );
      }

      if (progress >= 1.0) {
        this.animState = 'idle';
      }
    } else if (this.animState === 'smash') {
      // Jump and overhead smash
      const progress = Math.min(1.0, this.animTimer / this.animDuration);
      const jumpHeight = Math.sin(progress * Math.PI) * 0.45;
      this.bodyRoot.position.y = 0.95 + jumpHeight;

      if (progress < 0.4) {
        this.rightArmGroup.rotation.set(-2.8, 0.2, 0.3);
      } else {
        this.rightArmGroup.rotation.set(-0.5, 0.4, 0.2);
      }

      if (progress >= 1.0) {
        this.animState = 'idle';
      }
    } else if (this.animState === 'celebrate') {
      // Fist pump celebration!
      const pump = Math.sin(this.animTimer * 8.0);
      this.rightArmGroup.rotation.set(-2.4 + pump * 0.4, 0.2, 0.2);
      this.bodyRoot.position.y = 0.95 + Math.abs(Math.sin(this.animTimer * 6.0)) * 0.15;
    }

    this.group.rotation.y = baseFacing;
  }
}

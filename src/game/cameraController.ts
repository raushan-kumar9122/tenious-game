/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CameraMode } from '../types';
import { TennisBall } from './ballPhysics';
import { TennisPlayer3D } from './PlayerModel';

export class TennisCameraController {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'chase';
  public isCinematicIntro: boolean = false;
  private introAngle: number = 0;

  // Smoothing targets
  private currentPos: THREE.Vector3 = new THREE.Vector3(0, 7.5, 20.5);
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 1.2, 0);

  constructor(aspect: number = 16 / 9) {
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 150);
    this.camera.position.set(0, 7.5, 20.5);
    this.camera.lookAt(0, 1.2, 0);
  }

  public setMode(mode: CameraMode) {
    this.mode = mode;
    this.isCinematicIntro = false;
  }

  public startIntro() {
    this.isCinematicIntro = true;
    this.introAngle = 0;
  }

  public stopIntro() {
    this.isCinematicIntro = false;
  }

  public update(
    delta: number,
    ball: TennisBall,
    player1: TennisPlayer3D,
    player2: TennisPlayer3D
  ) {
    const p1Pos = player1.group.position;
    const ballPos = ball.position;

    const targetPos = new THREE.Vector3();
    const targetLook = new THREE.Vector3();

    if (this.isCinematicIntro) {
      this.introAngle += delta * 0.45;
      const radius = 24;
      targetPos.set(
        Math.cos(this.introAngle) * radius,
        10.5,
        Math.sin(this.introAngle) * radius
      );
      targetLook.set(0, 1.5, 0);
    } else if (this.mode === 'chase') {
      // Third person chase cam behind Player 1 with slight lateral follow
      targetPos.set(
        p1Pos.x * 0.45,
        5.8,
        p1Pos.z + 8.8
      );
      // Look slightly above net towards opponent side
      targetLook.set(
        p1Pos.x * 0.2 + ballPos.x * 0.15,
        1.4,
        -2.5
      );
    } else if (this.mode === 'broadcast') {
      // Classic Grand Slam TV broadcast high angle
      targetPos.set(0, 11.5, 24.5);
      targetLook.set(0, 1.0, -1.0);
    } else if (this.mode === 'action') {
      // Action camera dynamically framing player and ball
      const midZ = (p1Pos.z + ballPos.z) * 0.5;
      const midX = (p1Pos.x + ballPos.x) * 0.5;
      targetPos.set(
        midX * 0.7,
        4.5 + Math.abs(ballPos.y) * 0.3,
        p1Pos.z + 7.5
      );
      targetLook.set(midX * 0.4, 1.6, ballPos.z * 0.5);
    } else if (this.mode === 'firstPerson') {
      // Eye level action
      targetPos.set(p1Pos.x, 1.75, p1Pos.z + 0.3);
      targetLook.set(ballPos.x * 0.5, 1.2, -4.0);
    }

    // Exponential smoothing for buttery smooth cinematic motion
    const lambda = 7.5;
    this.currentPos.x = THREE.MathUtils.damp(this.currentPos.x, targetPos.x, lambda, delta);
    this.currentPos.y = THREE.MathUtils.damp(this.currentPos.y, targetPos.y, lambda, delta);
    this.currentPos.z = THREE.MathUtils.damp(this.currentPos.z, targetPos.z, lambda, delta);

    this.currentLookAt.x = THREE.MathUtils.damp(this.currentLookAt.x, targetLook.x, lambda, delta);
    this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, targetLook.y, lambda, delta);
    this.currentLookAt.z = THREE.MathUtils.damp(this.currentLookAt.z, targetLook.z, lambda, delta);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }

  public handleResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

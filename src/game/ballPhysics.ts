/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { COURT, PHYSICS, SURFACE_PRESETS } from './constants';
import { CourtSurface, ShotType } from '../types';

export interface BounceEvent {
  x: number;
  z: number;
  isFirstBounce: boolean;
  courtSide: 'player1' | 'player2';
  inCourt: boolean;
  inServiceBox: boolean;
}

export class TennisBall {
  public mesh: THREE.Mesh;
  public shadowMesh: THREE.Mesh;
  public group: THREE.Group;

  // Physics state
  public position = new THREE.Vector3(0, 1.2, 0);
  public velocity = new THREE.Vector3(0, 0, 0);
  public spin = new THREE.Vector3(0, 0, 0); // (topspin X, sidespin Y, rifling Z)
  public isActive = false;
  public lastHitter: 1 | 2 | null = null;
  public bounceCountThisSide = 0;
  public hasHitNet = false;
  public isServe = false;
  public targetServiceSide: 'deuce' | 'ad' = 'deuce';
  public targetSidePlayer: 1 | 2 = 2; // who should receive

  // Visual effects
  private trailLine: THREE.Line;
  private trailPoints: THREE.Vector3[] = [];
  private maxTrailLength = 16;
  private dustParticles: THREE.Points;
  private dustGeom: THREE.BufferGeometry;
  private dustPositions: Float32Array;
  private dustOpacities: Float32Array;
  private maxDust = 30;

  // Surface characteristics
  public currentSurface: CourtSurface = 'hard';

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'TennisBall';

    // 1. Procedural Tennis Ball Felt Texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Fluorescent optic yellow base
    ctx.fillStyle = '#ccff00';
    ctx.fillRect(0, 0, 256, 128);

    // Subtle fuzzy texture
    const imgData = ctx.getImageData(0, 0, 256, 128);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 15;
      imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // White rubber seam lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 42, 0, Math.PI * 2);
    ctx.arc(192, 64, 42, 0, Math.PI * 2);
    ctx.stroke();

    const ballTexture = new THREE.CanvasTexture(canvas);
    ballTexture.colorSpace = THREE.SRGBColorSpace;

    const ballGeom = new THREE.SphereGeometry(PHYSICS.BALL_RADIUS, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTexture,
      roughness: 0.75,
      metalness: 0.05,
    });

    this.mesh = new THREE.Mesh(ballGeom, ballMat);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // 2. Realistic Ground Contact Shadow
    const shadowGeom = new THREE.PlaneGeometry(PHYSICS.BALL_RADIUS * 3.5, PHYSICS.BALL_RADIUS * 3.5);
    shadowGeom.rotateX(-Math.PI / 2);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sCtx = shadowCanvas.getContext('2d')!;
    const gradient = sCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = gradient;
    sCtx.fillRect(0, 0, 64, 64);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });

    this.shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    this.shadowMesh.position.y = 0.01;
    this.group.add(this.shadowMesh);

    // 3. Motion Trail Ribbon
    for (let i = 0; i < this.maxTrailLength; i++) {
      this.trailPoints.push(new THREE.Vector3(0, 1.2, 0));
    }
    const trailGeom = new THREE.BufferGeometry().setFromPoints(this.trailPoints);
    const trailMat = new THREE.LineBasicMaterial({
      color: 0xccff00,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });
    this.trailLine = new THREE.Line(trailGeom, trailMat);
    this.group.add(this.trailLine);

    // 4. Chalk / Bounce Dust Particles
    this.dustGeom = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(this.maxDust * 3);
    this.dustOpacities = new Float32Array(this.maxDust);
    this.dustGeom.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));

    const dustMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    this.dustParticles = new THREE.Points(this.dustGeom, dustMat);
    this.group.add(this.dustParticles);
  }

  public reset(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.spin.set(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.shadowMesh.position.set(x, 0.01, z);
    this.bounceCountThisSide = 0;
    this.hasHitNet = false;
    this.isActive = false;

    // Reset trail
    for (let i = 0; i < this.maxTrailLength; i++) {
      this.trailPoints[i].copy(this.position);
    }
    this.trailLine.geometry.setFromPoints(this.trailPoints);
  }

  public launch(
    startPos: THREE.Vector3,
    targetX: number,
    targetZ: number,
    shotType: ShotType,
    power: number = 1.0,
    hitter: 1 | 2 = 1,
    isServeShot: boolean = false
  ) {
    this.position.copy(startPos);
    this.lastHitter = hitter;
    this.bounceCountThisSide = 0;
    this.hasHitNet = false;
    this.isServe = isServeShot;
    this.targetSidePlayer = hitter === 1 ? 2 : 1;
    this.isActive = true;

    // Calculate ball trajectory
    const dx = targetX - startPos.x;
    const dz = targetZ - startPos.z;
    const distHoriz = Math.hypot(dx, dz);

    // Calculate flight duration based on shot type
    let baseSpeed = 26; // m/s
    let liftY = 3.5;
    let topspinVal = 10;
    let sideSpinVal = (dx / distHoriz) * 4;

    if (shotType === 'smash') {
      baseSpeed = 38 * power;
      liftY = -1.5;
      topspinVal = 15;
    } else if (shotType === 'lob') {
      baseSpeed = 18 * power;
      liftY = 9.5;
      topspinVal = 5;
    } else if (shotType === 'slice') {
      baseSpeed = 22 * power;
      liftY = 3.0;
      topspinVal = -20; // Backspin
    } else if (shotType === 'topspin') {
      baseSpeed = 28 * power;
      liftY = 4.8;
      topspinVal = 32;
    } else if (shotType === 'serve') {
      baseSpeed = 36 * power;
      liftY = 1.8;
      topspinVal = 18;
    } else {
      // flat
      baseSpeed = 29 * power;
      liftY = 3.8;
      topspinVal = 8;
    }

    // Apply surface speed multiplier
    const surfPreset = SURFACE_PRESETS[this.currentSurface];
    baseSpeed *= surfPreset.ballSpeedMult;

    const time = distHoriz / baseSpeed;
    const vx = dx / time;
    const vz = dz / time;

    // Ballistics with gravity compensation: target height after time t
    // Y_t = Y_0 + vy * t - 0.5 * g * t^2 => vy = (Y_target - Y_0 + 0.5 * g * t^2) / t
    const targetY = PHYSICS.BALL_RADIUS + 0.2;
    const vy = (targetY - startPos.y + 0.5 * PHYSICS.GRAVITY * time * time) / time + liftY * 0.12;

    this.velocity.set(vx, vy, vz);
    this.spin.set(topspinVal, sideSpinVal, 0);

    // Reset trail
    for (let i = 0; i < this.maxTrailLength; i++) {
      this.trailPoints[i].copy(this.position);
    }
  }

  public spawnDustPuff(x: number, z: number) {
    for (let i = 0; i < this.maxDust; i++) {
      const idx = i * 3;
      this.dustPositions[idx] = x + (Math.random() - 0.5) * 0.3;
      this.dustPositions[idx + 1] = 0.02 + Math.random() * 0.15;
      this.dustPositions[idx + 2] = z + (Math.random() - 0.5) * 0.3;
      this.dustOpacities[i] = 1.0;
    }
    this.dustGeom.attributes.position.needsUpdate = true;
  }

  /**
   * Step physics by delta time and check collisions
   */
  public step(
    delta: number,
    onBounce: (event: BounceEvent) => void,
    onNetHit: (cordClip: boolean) => void
  ) {
    if (!this.isActive) return;

    // Sub-stepping for ultra-reliable net & high-speed collision detection
    const subSteps = 3;
    const dt = delta / subSteps;

    for (let step = 0; step < subSteps; step++) {
      // 1. Magnus Force & Gravity
      // Topspin pulls ball down (+Y acceleration downwards)
      const magnusY = -this.spin.x * PHYSICS.MAGNUS_COEFF * 4.0;
      // Sidespin curves ball
      const magnusX = -this.spin.y * PHYSICS.MAGNUS_COEFF * 2.0;

      this.velocity.y -= (PHYSICS.GRAVITY + magnusY) * dt;
      this.velocity.x += magnusX * dt;

      // Air resistance
      const speed = this.velocity.length();
      const drag = PHYSICS.AIR_DRAG * speed * dt;
      this.velocity.x *= 1 - drag;
      this.velocity.z *= 1 - drag;

      const prevZ = this.position.z;
      const nextX = this.position.x + this.velocity.x * dt;
      const nextY = this.position.y + this.velocity.y * dt;
      const nextZ = this.position.z + this.velocity.z * dt;

      // 2. Net Collision Check
      // Net sits at Z = 0, extends X in [-5.8, +5.8]
      if (
        !this.hasHitNet &&
        ((prevZ < 0 && nextZ >= 0) || (prevZ > 0 && nextZ <= 0)) &&
        Math.abs(nextX) <= COURT.NET_POST_X
      ) {
        // Net height varies from 0.914 at center to 1.07 at posts
        const distRatio = Math.abs(nextX) / COURT.NET_POST_X;
        const netH = COURT.NET_HEIGHT_CENTER + distRatio * (COURT.NET_HEIGHT_POST - COURT.NET_HEIGHT_CENTER);

        if (nextY <= netH) {
          // Check if top cord clip (within 0.05m of top)
          if (nextY >= netH - 0.06) {
            this.hasHitNet = true;
            this.velocity.z *= 0.6; // slow down and tumble forward
            this.velocity.y = Math.max(0.5, this.velocity.y * 0.4);
            onNetHit(true);
          } else {
            // Hard net rebound
            this.hasHitNet = true;
            this.velocity.z = -this.velocity.z * 0.25;
            this.velocity.x *= 0.3;
            this.velocity.y = 0.5;
            onNetHit(false);
          }
        }
      }

      // Update positions
      this.position.set(nextX, nextY, nextZ);

      // 3. Court Bounce Check
      if (this.position.y <= PHYSICS.BALL_RADIUS) {
        this.position.y = PHYSICS.BALL_RADIUS;

        const surf = SURFACE_PRESETS[this.currentSurface];

        // Restitution & bounce height
        this.velocity.y = -this.velocity.y * surf.restitution * surf.bounceHeightMult;
        // Friction on ground
        this.velocity.x *= surf.friction;
        this.velocity.z *= surf.friction * surf.skidFactor;

        // Topspin converts to forward velocity, slice kicks back
        this.velocity.z += (this.spin.x > 0 ? 1 : -1) * Math.abs(this.spin.x) * 0.04;
        this.spin.multiplyScalar(0.4); // spin diminishes on bounce

        this.bounceCountThisSide++;
        const isFirst = this.bounceCountThisSide === 1;

        // Determine which side of court ball bounced on
        const side: 'player1' | 'player2' = this.position.z > 0 ? 'player1' : 'player2';

        // Check if inside legal boundary
        const inSingles =
          Math.abs(this.position.x) <= COURT.HALF_SINGLES_WIDTH &&
          Math.abs(this.position.z) <= COURT.HALF_LENGTH;

        // Service box check:
        // Player 1 serves from Z > 11.8 to Player 2's side (Z in [-6.4, 0]).
        // If Deuce side: receiver's right box (X in [0, 4.115], Z in [-6.4, 0])
        // If Ad side: receiver's left box (X in [-4.115, 0], Z in [-6.4, 0])
        let inServiceBox = false;
        if (side === 'player2') {
          const inZ = this.position.z >= -COURT.SERVICE_LINE_Z && this.position.z <= 0;
          if (this.targetServiceSide === 'deuce') {
            inServiceBox = inZ && this.position.x >= 0 && this.position.x <= COURT.HALF_SINGLES_WIDTH;
          } else {
            inServiceBox = inZ && this.position.x <= 0 && this.position.x >= -COURT.HALF_SINGLES_WIDTH;
          }
        } else {
          // Player 2 serving to Player 1's side (Z in [0, 6.4])
          const inZ = this.position.z <= COURT.SERVICE_LINE_Z && this.position.z >= 0;
          if (this.targetServiceSide === 'deuce') {
            inServiceBox = inZ && this.position.x <= 0 && this.position.x >= -COURT.HALF_SINGLES_WIDTH;
          } else {
            inServiceBox = inZ && this.position.x >= 0 && this.position.x <= COURT.HALF_SINGLES_WIDTH;
          }
        }

        this.spawnDustPuff(this.position.x, this.position.z);

        onBounce({
          x: this.position.x,
          z: this.position.z,
          isFirstBounce: isFirst,
          courtSide: side,
          inCourt: inSingles,
          inServiceBox: inServiceBox,
        });

        // If bounce is negligible, stop ball
        if (Math.abs(this.velocity.y) < 0.3) {
          this.velocity.y = 0;
        }
      }
    }

    // Update 3D visual position
    this.mesh.position.copy(this.position);

    // Ball rotation from spin & motion
    this.mesh.rotation.x += (this.velocity.z + this.spin.x * 0.1) * delta * 5.0;
    this.mesh.rotation.y += this.spin.y * delta * 4.0;

    // Update ground contact shadow (size and opacity scale with ball height)
    this.shadowMesh.position.x = this.position.x;
    this.shadowMesh.position.z = this.position.z;
    const h = Math.max(0, this.position.y);
    const shadowScale = 1.0 + h * 0.6;
    this.shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
    (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.08, 0.65 - h * 0.12);

    // Update ribbon trail
    this.trailPoints.pop();
    this.trailPoints.unshift(this.position.clone());
    this.trailLine.geometry.setFromPoints(this.trailPoints);

    // Fade dust particles
    for (let i = 0; i < this.maxDust; i++) {
      if (this.dustOpacities[i] > 0) {
        this.dustOpacities[i] -= delta * 2.5;
        this.dustPositions[i * 3 + 1] += delta * 0.12; // float up slightly
      }
    }
    this.dustGeom.attributes.position.needsUpdate = true;
  }

  public getPredictedLanding(): THREE.Vector3 {
    // Project ball landing spot using simple ballistic kinematics
    const targetY = PHYSICS.BALL_RADIUS;
    const g = PHYSICS.GRAVITY;
    const vy = this.velocity.y;
    const y = this.position.y;

    // 0.5*g*t^2 - vy*t - (y - targetY) = 0
    const disc = vy * vy + 2 * g * (y - targetY);
    if (disc < 0) return this.position.clone();

    const t = (vy + Math.sqrt(disc)) / g;
    return new THREE.Vector3(
      this.position.x + this.velocity.x * t,
      targetY,
      this.position.z + this.velocity.z * t
    );
  }
}

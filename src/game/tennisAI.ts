/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { COURT } from './constants';
import { AIDifficulty, ShotType } from '../types';
import { TennisBall } from './ballPhysics';
import { TennisPlayer3D } from './PlayerModel';

export class TennisAIOpponent {
  public difficulty: AIDifficulty = 'medium';
  public targetX: number = 0;
  public targetZ: number = -11.5;
  private reactionDelayTimer: number = 0;
  private hasReacted: boolean = false;
  private targetLanding: THREE.Vector3 = new THREE.Vector3();

  // Difficulty configurations
  private config = {
    easy: {
      speed: 4.8,
      reactionDelay: 0.35,
      accuracySpread: 1.6,
      errorRate: 0.18,
      powerMin: 0.7,
      powerMax: 0.85,
    },
    medium: {
      speed: 6.2,
      reactionDelay: 0.18,
      accuracySpread: 0.9,
      errorRate: 0.08,
      powerMin: 0.8,
      powerMax: 0.95,
    },
    hard: {
      speed: 7.6,
      reactionDelay: 0.06,
      accuracySpread: 0.45,
      errorRate: 0.03,
      powerMin: 0.9,
      powerMax: 1.05,
    },
    expert: {
      speed: 8.8,
      reactionDelay: 0.01,
      accuracySpread: 0.2,
      errorRate: 0.01,
      powerMin: 0.95,
      powerMax: 1.15,
    },
  };

  constructor(difficulty: AIDifficulty = 'medium') {
    this.difficulty = difficulty;
  }

  public setDifficulty(diff: AIDifficulty) {
    this.difficulty = diff;
  }

  public onPlayerHitBall(ball: TennisBall) {
    this.reactionDelayTimer = this.config[this.difficulty].reactionDelay;
    this.hasReacted = false;
  }

  public update(
    delta: number,
    ball: TennisBall,
    aiPlayer: TennisPlayer3D,
    humanPlayer: TennisPlayer3D,
    onHitBall: (shotType: ShotType, power: number, targetX: number, targetZ: number) => void
  ) {
    const cfg = this.config[this.difficulty];

    // If ball is moving toward AI's half (velocity Z < 0)
    if (ball.isActive && ball.velocity.z < 0) {
      if (!this.hasReacted) {
        this.reactionDelayTimer -= delta;
        if (this.reactionDelayTimer <= 0) {
          this.hasReacted = true;
          this.targetLanding = ball.getPredictedLanding();
        }
      }

      if (this.hasReacted) {
        // Position AI behind the predicted landing point
        this.targetX = THREE.MathUtils.clamp(
          this.targetLanding.x,
          -COURT.HALF_SINGLES_WIDTH * 0.95,
          COURT.HALF_SINGLES_WIDTH * 0.95
        );
        // Intercept behind the bounce
        this.targetZ = Math.min(-9.0, this.targetLanding.z - 0.7);
      }
    } else {
      // Ball is moving away or point inactive: recover to base court center
      this.targetX = 0;
      this.targetZ = -11.4;
      this.hasReacted = false;
    }

    // Move AI smoothly toward target position
    const dx = this.targetX - aiPlayer.group.position.x;
    const dz = this.targetZ - aiPlayer.group.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.1) {
      aiPlayer.setMoving(true);
      const step = Math.min(dist, cfg.speed * delta);
      aiPlayer.setPosition(
        aiPlayer.group.position.x + (dx / dist) * step,
        aiPlayer.group.position.z + (dz / dist) * step
      );
    } else {
      aiPlayer.setMoving(false);
    }

    // Check Hitting Range
    // Ball must be in AI's court half (Z < 0), within strike radius and height
    if (ball.isActive && ball.lastHitter === 1) {
      const ballPos = ball.position;
      const playerPos = aiPlayer.group.position;
      const distToBall = Math.hypot(ballPos.x - playerPos.x, ballPos.z - playerPos.z);

      // Hit zone: within ~1.7m horiz, height between 0.35m and 2.5m
      const inHitWindow =
        distToBall < 1.75 &&
        ballPos.y >= 0.35 &&
        ballPos.y <= 2.6 &&
        ballPos.z < 0;

      if (inHitWindow) {
        // Decide shot
        this.executeAIShot(ball, aiPlayer, humanPlayer, onHitBall);
      }
    }
  }

  private executeAIShot(
    ball: TennisBall,
    aiPlayer: TennisPlayer3D,
    humanPlayer: TennisPlayer3D,
    onHitBall: (shotType: ShotType, power: number, targetX: number, targetZ: number) => void
  ) {
    const cfg = this.config[this.difficulty];

    // Select shot type based on human position and ball height
    let shot: ShotType = 'flat';
    const ballY = ball.position.y;
    const humanZ = humanPlayer.group.position.z;
    const humanX = humanPlayer.group.position.x;

    // If ball is floating high near net -> smash!
    if (ballY > 1.8 && aiPlayer.group.position.z > -6.0) {
      shot = 'smash';
    } else if (humanZ < 6.0) {
      // Human rushed net -> Lob over them or sharp angled pass!
      shot = Math.random() > 0.5 ? 'lob' : 'topspin';
    } else {
      // Normal rally: mix topspin, flat, slice
      const r = Math.random();
      if (r < 0.55) shot = 'topspin';
      else if (r < 0.85) shot = 'flat';
      else shot = 'slice';
    }

    // Target selection: aim away from human player's current X position
    let aimX = humanX > 0 ? -2.8 : 2.8; // cross-court winner attempt
    let aimZ = 9.8; // deep near player baseline

    // Add difficulty spread & human error
    const spread = cfg.accuracySpread;
    aimX += (Math.random() - 0.5) * spread;
    aimZ += (Math.random() - 0.5) * spread * 0.8;

    // Check unforced error
    if (Math.random() < cfg.errorRate) {
      // Hit ball slightly wide or into net
      aimX = (Math.random() > 0.5 ? 1 : -1) * (COURT.HALF_SINGLES_WIDTH + 0.3);
    }

    // Power
    const power = cfg.powerMin + Math.random() * (cfg.powerMax - cfg.powerMin);

    onHitBall(shot, power, aimX, aimZ);
  }

  public calculateAIServe(
    targetServiceSide: 'deuce' | 'ad'
  ): { shotType: ShotType; power: number; targetX: number; targetZ: number } {
    const cfg = this.config[this.difficulty];

    // Target inside receiver's service box (Z between 0 and 6.4m)
    // If Deuce: target X in [-3.5, -0.5]
    // If Ad: target X in [0.5, 3.5]
    const baseTargetX = targetServiceSide === 'deuce' ? -2.2 : 2.2;
    const targetZ = 4.8;

    const spread = cfg.accuracySpread * 0.6;
    const aimX = baseTargetX + (Math.random() - 0.5) * spread;

    const power = cfg.powerMin + Math.random() * (cfg.powerMax - cfg.powerMin);
    return {
      shotType: 'serve',
      power,
      targetX: aimX,
      targetZ,
    };
  }
}

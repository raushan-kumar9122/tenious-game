/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { COURT, PHYSICS, SHOT_PROFILES } from './constants';
import {
  CourtSurface,
  GameMode,
  AIDifficulty,
  ShotType,
  CameraMode,
  GraphicsQuality,
  MatchScore,
  MatchStats,
  CallAnnouncement,
} from '../types';
import { sound } from './audio';
import { createTennisStadium, CourtAssets } from './courtBuilder';
import { TennisPlayer3D } from './PlayerModel';
import { TennisBall, BounceEvent } from './ballPhysics';
import { TennisRulesEngine } from './tennisRules';
import { TennisAIOpponent } from './tennisAI';
import { TennisCameraController } from './cameraController';

export interface TennisEngineCallbacks {
  onScoreUpdate: (score: MatchScore) => void;
  onStatsUpdate: (stats: MatchStats) => void;
  onAnnouncement: (announcement: CallAnnouncement) => void;
  onServeSpeed: (speedKmh: number) => void;
  onShotFeedback: (feedback: string) => void;
  onPowerChange: (power: number) => void;
  onMatchComplete: (winner: 1 | 2) => void;
}

export class TennisEngine {
  public scene: THREE.Scene;
  public cameraController: TennisCameraController;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  private stadiumAssets: CourtAssets;
  public player1: TennisPlayer3D;
  public player2: TennisPlayer3D;
  public ball: TennisBall;
  public rules: TennisRulesEngine;
  public ai: TennisAIOpponent;

  // Game state
  public mode: GameMode = 'vsAI';
  public surface: CourtSurface = 'hard';
  public isPaused: boolean = false;
  private isDestroyed: boolean = false;
  private animFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();

  // Serving State
  public servePhase: 'ready' | 'tossing' | 'rally' | 'point_over' = 'ready';
  private serveTossTimer: number = 0;
  private servePowerCharge: number = 0;
  private isChargingShot: boolean = false;
  private chargedShotType: ShotType = 'flat';

  // Player 2 Local controls
  private isP2ChargingShot: boolean = false;
  private p2ChargedShotType: ShotType = 'flat';
  private p2ServePower: number = 0;

  // Active keyboard inputs
  private keysPressed: Record<string, boolean> = {};

  // Callbacks
  private callbacks: TennisEngineCallbacks;

  // Practice targets
  private practiceTargetMesh: THREE.Mesh | null = null;
  public practiceStreak: number = 0;

  constructor(container: HTMLElement, callbacks: TennisEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Initialize WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Initialize Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0a1128');
    this.scene.fog = new THREE.FogExp2('#0a1128', 0.008);

    // Generate Studio Environment Map for PBR
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting: Warm key sun + Cool hemisphere sky
    const keySun = new THREE.DirectionalLight(0xfff3e0, 2.2);
    keySun.position.set(16, 28, 18);
    keySun.castShadow = !isSoftwareGl;
    keySun.shadow.mapSize.width = 2048;
    keySun.shadow.mapSize.height = 2048;
    keySun.shadow.camera.near = 1;
    keySun.shadow.camera.far = 70;
    const d = 20;
    keySun.shadow.camera.left = -d;
    keySun.shadow.camera.right = d;
    keySun.shadow.camera.top = d;
    keySun.shadow.camera.bottom = -d;
    keySun.shadow.bias = -0.0005;
    keySun.shadow.normalBias = 0.02;
    this.scene.add(keySun);

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.2);
    this.scene.add(hemiLight);

    // Build Court and Stadium
    this.stadiumAssets = createTennisStadium(this.renderer);
    this.scene.add(this.stadiumAssets.group);

    // Build Players
    this.player1 = new TennisPlayer3D(1, '#2563eb', '#ffffff');
    this.player1.setPosition(0, COURT.BASELINE_Z);
    this.scene.add(this.player1.group);

    this.player2 = new TennisPlayer3D(2, '#dc2626', '#1e293b');
    this.player2.setPosition(0, -COURT.BASELINE_Z);
    this.scene.add(this.player2.group);

    // Build Ball
    this.ball = new TennisBall();
    this.scene.add(this.ball.group);

    // Initialize Subsystems
    this.rules = new TennisRulesEngine(1);
    this.rules.onAnnouncement = (ann) => {
      this.callbacks.onAnnouncement(ann);
      this.callbacks.onScoreUpdate({ ...this.rules.score });
      this.callbacks.onStatsUpdate({ ...this.rules.stats });
      if (this.rules.score.winner !== null) {
        this.callbacks.onMatchComplete(this.rules.score.winner);
      }
    };

    this.ai = new TennisAIOpponent('medium');
    this.cameraController = new TennisCameraController(container.clientWidth / container.clientHeight);

    // Setup Practice Bullseye
    this.setupPracticeTarget();

    // Bind Event Listeners
    this.bindEvents();

    // Position players for initial point
    this.prepareServePosition();

    // Start Main Loop
    this.tick();
  }

  private setupPracticeTarget() {
    const targetGeom = new THREE.RingGeometry(0.3, 0.9, 24);
    targetGeom.rotateX(-Math.PI / 2);
    const targetMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    this.practiceTargetMesh = new THREE.Mesh(targetGeom, targetMat);
    this.practiceTargetMesh.position.set(2.5, 0.02, -8.5);
    this.practiceTargetMesh.visible = false;
    this.scene.add(this.practiceTargetMesh);
  }

  private randomizePracticeTarget() {
    if (!this.practiceTargetMesh) return;
    const targetX = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 2.4);
    const targetZ = -7.5 - Math.random() * 3.5;
    this.practiceTargetMesh.position.set(targetX, 0.02, targetZ);
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
    if (this.practiceTargetMesh) {
      this.practiceTargetMesh.visible = mode === 'practice';
      if (mode === 'practice') this.randomizePracticeTarget();
    }
  }

  public setSurface(surface: CourtSurface) {
    this.surface = surface;
    this.stadiumAssets.updateSurface(surface);
    this.ball.currentSurface = surface;
  }

  public setDifficulty(diff: AIDifficulty) {
    this.ai.setDifficulty(diff);
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraController.setMode(mode);
  }

  public setGraphics(quality: GraphicsQuality) {
    if (quality === 'low') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(1.2);
      this.renderer.shadowMap.enabled = true;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
    }
  }

  public restartMatch(setsToWin: 1 | 2 | 3 = 1) {
    this.rules.resetMatch(setsToWin);
    this.prepareServePosition();
    this.callbacks.onScoreUpdate({ ...this.rules.score });
    this.callbacks.onStatsUpdate({ ...this.rules.stats });
    this.cameraController.startIntro();
    setTimeout(() => this.cameraController.stopIntro(), 3000);
  }

  /**
   * Set players in correct serving and receiving positions according to tennis rules
   */
  public prepareServePosition() {
    this.servePhase = 'ready';
    this.serveTossTimer = 0;
    this.servePowerCharge = 0;
    this.isChargingShot = false;
    this.callbacks.onPowerChange(0);

    const isP1Server = this.rules.score.server === 1;
    const isDeuceSide = this.rules.score.servingSide === 'deuce';

    // Server position: behind baseline
    // Deuce court: to the right of center mark (X > 0 for P1, X < 0 for P2)
    // Ad court: to the left of center mark
    if (isP1Server) {
      const serverX = isDeuceSide ? 1.8 : -1.8;
      this.player1.setPosition(serverX, COURT.BASELINE_Z + 0.3);
      this.player1.playAnimation('idle');
      this.player1.isServing = true;

      // Receiver (P2) stands diagonally opposite
      const receiverX = isDeuceSide ? -2.2 : 2.2;
      this.player2.setPosition(receiverX, -COURT.BASELINE_Z - 0.2);
      this.player2.playAnimation('idle');
      this.player2.isServing = false;

      // Ball sits in server's left hand
      this.ball.reset(serverX - 0.2, 1.1, COURT.BASELINE_Z + 0.2);
      this.ball.targetServiceSide = isDeuceSide ? 'deuce' : 'ad';
    } else {
      // P2 Serving (AI or Local Player 2)
      const serverX = isDeuceSide ? -1.8 : 1.8;
      this.player2.setPosition(serverX, -COURT.BASELINE_Z - 0.3);
      this.player2.playAnimation('idle');
      this.player2.isServing = true;

      const receiverX = isDeuceSide ? 2.2 : -2.2;
      this.player1.setPosition(receiverX, COURT.BASELINE_Z + 0.2);
      this.player1.playAnimation('idle');
      this.player1.isServing = false;

      this.ball.reset(serverX + 0.2, 1.1, -COURT.BASELINE_Z - 0.2);
      this.ball.targetServiceSide = isDeuceSide ? 'deuce' : 'ad';

      // If AI is serving, trigger automated serve sequence after short delay
      if (this.mode !== 'local2P') {
        setTimeout(() => this.triggerAIServe(), 1200);
      }
    }
  }

  private triggerAIServe() {
    if (this.servePhase !== 'ready' || this.rules.score.server !== 2) return;

    this.player2.playAnimation('serveToss', 0.6);
    this.servePhase = 'tossing';

    const ballStart = this.player2.group.position.clone();
    ballStart.y = 1.2;
    this.ball.position.copy(ballStart);
    this.ball.velocity.set(0, 5.0, 0); // Toss ball straight up
    this.ball.isActive = true;

    setTimeout(() => {
      if (this.servePhase !== 'tossing') return;
      this.player2.playAnimation('serveStrike', 0.5);

      const serveData = this.ai.calculateAIServe(this.ball.targetServiceSide);
      this.ball.launch(
        this.ball.position,
        serveData.targetX,
        serveData.targetZ,
        serveData.shotType,
        serveData.power,
        2,
        true
      );

      const speedKmh = Math.round(this.ball.velocity.length() * 3.6);
      this.rules.stats.maxServeSpeedP2 = Math.max(this.rules.stats.maxServeSpeedP2, speedKmh);
      this.callbacks.onServeSpeed(speedKmh);
      sound.playRacketHit('serve', serveData.power);

      this.servePhase = 'rally';
    }, 550);
  }

  private bindEvents() {
    const onKeyDown = (e: KeyboardEvent) => {
      // Prevent page scrolling on tennis gameplay keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      this.keysPressed[e.code] = true;

      // Player 1 Serve / Hit Trigger
      if (this.servePhase === 'ready' && this.rules.score.server === 1) {
        if (['Space', 'KeyQ', 'KeyE', 'KeyR', 'KeyF'].includes(e.code)) {
          this.startPlayer1ServeToss();
          return;
        }
      }

      // Player 2 Local Serve Trigger
      if (this.mode === 'local2P' && this.servePhase === 'ready' && this.rules.score.server === 2) {
        if (['Enter', 'KeyJ', 'KeyK', 'KeyL', 'ShiftRight'].includes(e.code)) {
          this.startPlayer2ServeToss();
          return;
        }
      }

      // Shot Power Charging
      if (this.servePhase === 'rally' || this.servePhase === 'tossing') {
        if (['Space', 'KeyQ', 'KeyE', 'KeyR', 'KeyF'].includes(e.code)) {
          this.isChargingShot = true;
          if (e.code === 'KeyQ') this.chargedShotType = 'topspin';
          else if (e.code === 'KeyE') this.chargedShotType = 'slice';
          else if (e.code === 'KeyR') this.chargedShotType = 'lob';
          else if (e.code === 'KeyF') this.chargedShotType = 'smash';
          else this.chargedShotType = 'flat';
        }

        if (this.mode === 'local2P' && ['Enter', 'KeyJ', 'KeyK', 'KeyL', 'ShiftRight'].includes(e.code)) {
          this.isP2ChargingShot = true;
          if (e.code === 'KeyJ') this.p2ChargedShotType = 'topspin';
          else if (e.code === 'KeyK') this.p2ChargedShotType = 'slice';
          else if (e.code === 'KeyL') this.p2ChargedShotType = 'lob';
          else if (e.code === 'ShiftRight') this.p2ChargedShotType = 'smash';
          else this.p2ChargedShotType = 'flat';
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysPressed[e.code] = false;

      // Player 1 Strike
      if (['Space', 'KeyQ', 'KeyE', 'KeyR', 'KeyF'].includes(e.code)) {
        if (this.servePhase === 'tossing' && this.rules.score.server === 1) {
          this.executePlayer1Serve();
        } else if (this.servePhase === 'rally') {
          this.attemptPlayer1Hit();
        }
        this.isChargingShot = false;
        this.servePowerCharge = 0;
        this.callbacks.onPowerChange(0);
      }

      // Player 2 Local Strike
      if (this.mode === 'local2P' && ['Enter', 'KeyJ', 'KeyK', 'KeyL', 'ShiftRight'].includes(e.code)) {
        if (this.servePhase === 'tossing' && this.rules.score.server === 2) {
          this.executePlayer2Serve();
        } else if (this.servePhase === 'rally') {
          this.attemptPlayer2Hit();
        }
        this.isP2ChargingShot = false;
        this.p2ServePower = 0;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onResize = () => {
      if (this.isDestroyed) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.renderer.setSize(w, h);
      this.cameraController.handleResize(w, h);
    };
    window.addEventListener('resize', onResize);
  }

  private startPlayer1ServeToss() {
    this.servePhase = 'tossing';
    this.player1.playAnimation('serveToss', 0.6);

    const tossStart = this.player1.group.position.clone();
    tossStart.y = 1.1;
    tossStart.x -= 0.15;
    this.ball.position.copy(tossStart);
    this.ball.velocity.set(0, 5.2, 0); // Toss ball into air
    this.ball.isActive = true;
  }

  private executePlayer1Serve() {
    this.player1.playAnimation('serveStrike', 0.5);

    // Timing check: hit ball near apex of toss (height > 2.0m)
    const ballY = this.ball.position.y;
    let timingQuality = 'GOOD';
    let powerMult = 1.0;

    if (ballY >= 2.2 && ballY <= 2.8) {
      timingQuality = 'SWEET SPOT!';
      powerMult = 1.15;
    } else if (ballY < 1.7) {
      timingQuality = 'LATE HIT';
      powerMult = 0.75;
    }

    this.callbacks.onShotFeedback(timingQuality);

    // Aim target inside receiver's service box (Z in [-6.4, 0])
    // Holding A/D steers service placement (wide slice vs down the T)
    let aimX = this.ball.targetServiceSide === 'deuce' ? 2.2 : -2.2;
    if (this.keysPressed['KeyA']) aimX -= 1.4;
    if (this.keysPressed['KeyD']) aimX += 1.4;

    const targetZ = -4.8;
    const power = THREE.MathUtils.clamp(this.servePowerCharge * powerMult, 0.7, 1.25);

    this.ball.launch(
      this.ball.position,
      aimX,
      targetZ,
      'serve',
      power,
      1,
      true
    );

    const speedKmh = Math.round(this.ball.velocity.length() * 3.6);
    this.rules.stats.maxServeSpeedP1 = Math.max(this.rules.stats.maxServeSpeedP1, speedKmh);
    this.callbacks.onServeSpeed(speedKmh);
    sound.playRacketHit('serve', power);

    this.servePhase = 'rally';
    this.ai.onPlayerHitBall(this.ball);
  }

  private startPlayer2ServeToss() {
    this.servePhase = 'tossing';
    this.player2.playAnimation('serveToss', 0.6);

    const tossStart = this.player2.group.position.clone();
    tossStart.y = 1.1;
    tossStart.x += 0.15;
    this.ball.position.copy(tossStart);
    this.ball.velocity.set(0, 5.2, 0);
    this.ball.isActive = true;
  }

  private executePlayer2Serve() {
    this.player2.playAnimation('serveStrike', 0.5);

    let aimX = this.ball.targetServiceSide === 'deuce' ? -2.2 : 2.2;
    if (this.keysPressed['ArrowLeft']) aimX -= 1.4;
    if (this.keysPressed['ArrowRight']) aimX += 1.4;

    const targetZ = 4.8;
    const power = 1.0;

    this.ball.launch(
      this.ball.position,
      aimX,
      targetZ,
      'serve',
      power,
      2,
      true
    );

    const speedKmh = Math.round(this.ball.velocity.length() * 3.6);
    this.rules.stats.maxServeSpeedP2 = Math.max(this.rules.stats.maxServeSpeedP2, speedKmh);
    this.callbacks.onServeSpeed(speedKmh);
    sound.playRacketHit('serve', power);

    this.servePhase = 'rally';
  }

  private attemptPlayer1Hit() {
    const ballPos = this.ball.position;
    const p1Pos = this.player1.group.position;
    const dist = Math.hypot(ballPos.x - p1Pos.x, ballPos.z - p1Pos.z);

    // Check strike radius
    if (dist <= 2.2 && ballPos.y >= 0.25 && ballPos.y <= 2.8 && ballPos.z > 0) {
      // Determine timing accuracy
      let feedback = 'PERFECT!';
      let power = 1.0;
      if (dist < 1.3 && ballPos.y >= 0.8 && ballPos.y <= 1.6) {
        feedback = 'SWEET SPOT!';
        power = 1.15;
      } else if (dist > 1.8) {
        feedback = 'REACHING';
        power = 0.85;
      }

      this.callbacks.onShotFeedback(feedback);

      // Shot direction influenced by steering keys (A/D or W/S)
      let targetX = 0;
      if (this.keysPressed['KeyA']) targetX = -3.2; // Cross-court / pull left
      else if (this.keysPressed['KeyD']) targetX = 3.2; // Inside-out / steer right
      else targetX = (Math.random() - 0.5) * 4.0;

      let targetZ = -9.6; // Deep near opponent baseline
      if (this.keysPressed['KeyS']) targetZ = -6.5; // Short drop/angle
      if (this.keysPressed['KeyW']) targetZ = -10.8; // Deep push

      this.player1.triggerShotAnimation(this.chargedShotType);
      this.ball.launch(this.ball.position, targetX, targetZ, this.chargedShotType, power, 1, false);

      const speedKmh = Math.round(this.ball.velocity.length() * 3.6);
      this.callbacks.onServeSpeed(speedKmh);
      sound.playRacketHit(this.chargedShotType, power);

      this.rules.stats.currentRally++;
      this.callbacks.onStatsUpdate({ ...this.rules.stats });

      // Notify AI
      this.ai.onPlayerHitBall(this.ball);

      // Check practice target hit
      if (this.mode === 'practice' && this.practiceTargetMesh) {
        const tPos = this.practiceTargetMesh.position;
        if (Math.hypot(targetX - tPos.x, targetZ - tPos.z) < 1.4) {
          this.practiceStreak++;
          sound.playScoreChime();
          this.randomizePracticeTarget();
        }
      }
    }
  }

  private attemptPlayer2Hit() {
    const ballPos = this.ball.position;
    const p2Pos = this.player2.group.position;
    const dist = Math.hypot(ballPos.x - p2Pos.x, ballPos.z - p2Pos.z);

    if (dist <= 2.2 && ballPos.y >= 0.25 && ballPos.y <= 2.8 && ballPos.z < 0) {
      let targetX = 0;
      if (this.keysPressed['ArrowLeft']) targetX = -3.2;
      else if (this.keysPressed['ArrowRight']) targetX = 3.2;
      else targetX = (Math.random() - 0.5) * 4.0;

      let targetZ = 9.6;
      if (this.keysPressed['ArrowDown']) targetZ = 10.8;
      if (this.keysPressed['ArrowUp']) targetZ = 6.5;

      this.player2.triggerShotAnimation(this.p2ChargedShotType);
      this.ball.launch(this.ball.position, targetX, targetZ, this.p2ChargedShotType, 1.0, 2, false);

      const speedKmh = Math.round(this.ball.velocity.length() * 3.6);
      this.callbacks.onServeSpeed(speedKmh);
      sound.playRacketHit(this.p2ChargedShotType, 1.0);

      this.rules.stats.currentRally++;
      this.callbacks.onStatsUpdate({ ...this.rules.stats });
    }
  }

  private updateMovement(delta: number) {
    const p1Speed = 7.5;
    let p1Dx = 0;
    let p1Dz = 0;

    if (this.keysPressed['KeyA']) p1Dx -= 1;
    if (this.keysPressed['KeyD']) p1Dx += 1;
    if (this.keysPressed['KeyW']) p1Dz -= 1;
    if (this.keysPressed['KeyS']) p1Dz += 1;

    if (p1Dx !== 0 || p1Dz !== 0) {
      const len = Math.hypot(p1Dx, p1Dz);
      p1Dx /= len;
      p1Dz /= len;

      this.player1.setMoving(true);
      const nextX = THREE.MathUtils.clamp(
        this.player1.group.position.x + p1Dx * p1Speed * delta,
        -COURT.HALF_DOUBLES_WIDTH - 1.2,
        COURT.HALF_DOUBLES_WIDTH + 1.2
      );
      // Stay on player 1's side (Z > 0.8)
      const nextZ = THREE.MathUtils.clamp(
        this.player1.group.position.z + p1Dz * p1Speed * delta,
        1.2,
        COURT.BASELINE_Z + 3.8
      );
      this.player1.setPosition(nextX, nextZ);
    } else {
      this.player1.setMoving(false);
    }

    // Local 2-Player Player 2 Movement
    if (this.mode === 'local2P') {
      const p2Speed = 7.5;
      let p2Dx = 0;
      let p2Dz = 0;
      if (this.keysPressed['ArrowLeft']) p2Dx -= 1;
      if (this.keysPressed['ArrowRight']) p2Dx += 1;
      if (this.keysPressed['ArrowUp']) p2Dz -= 1;
      if (this.keysPressed['ArrowDown']) p2Dz += 1;

      if (p2Dx !== 0 || p2Dz !== 0) {
        const len = Math.hypot(p2Dx, p2Dz);
        p2Dx /= len;
        p2Dz /= len;
        this.player2.setMoving(true);
        const nextX = THREE.MathUtils.clamp(
          this.player2.group.position.x + p2Dx * p2Speed * delta,
          -COURT.HALF_DOUBLES_WIDTH - 1.2,
          COURT.HALF_DOUBLES_WIDTH + 1.2
        );
        const nextZ = THREE.MathUtils.clamp(
          this.player2.group.position.z + p2Dz * p2Speed * delta,
          -COURT.BASELINE_Z - 3.8,
          -1.2
        );
        this.player2.setPosition(nextX, nextZ);
      } else {
        this.player2.setMoving(false);
      }
    }
  }

  private tick = () => {
    if (this.isDestroyed) return;
    this.animFrameId = requestAnimationFrame(this.tick);

    const delta = Math.min(0.05, this.clock.getDelta());
    if (this.isPaused) return;

    // 1. Charge Shot Power meter
    if (this.isChargingShot) {
      this.servePowerCharge = Math.min(1.0, this.servePowerCharge + delta * 1.8);
      this.callbacks.onPowerChange(this.servePowerCharge);
    }

    // 2. Update Player Movement
    this.updateMovement(delta);
    this.player1.update(delta);
    this.player2.update(delta);

    // 3. Update AI (when in vsAI, tournament, or quick mode)
    if (this.mode !== 'local2P' && this.servePhase === 'rally') {
      this.ai.update(
        delta,
        this.ball,
        this.player2,
        this.player1,
        (shotType, power, targetX, targetZ) => {
          this.player2.triggerShotAnimation(shotType);
          this.ball.launch(this.ball.position, targetX, targetZ, shotType, power, 2, false);
          sound.playRacketHit(shotType, power);
          const speedKmh = Math.round(this.ball.velocity.length() * 3.6);
          this.callbacks.onServeSpeed(speedKmh);
          this.rules.stats.currentRally++;
          this.callbacks.onStatsUpdate({ ...this.rules.stats });
        }
      );
    }

    // 4. Ball Physics Step
    this.ball.step(
      delta,
      (bounceEvent: BounceEvent) => this.handleBallBounce(bounceEvent),
      (cordClip: boolean) => {
        sound.playNetCord();
        if (cordClip) {
          sound.playCrowdGasp();
        }
      }
    );

    // 5. Camera Update
    this.cameraController.update(delta, this.ball, this.player1, this.player2);

    // 6. Render Frame
    this.renderer.render(this.scene, this.cameraController.camera);
  };

  /**
   * Official Tennis Ball Bounce Handling
   */
  private handleBallBounce(e: BounceEvent) {
    sound.playCourtBounce(this.surface, this.ball.velocity.length());

    // 1. Serve Bounce Rule
    if (this.ball.isServe) {
      if (e.isFirstBounce) {
        if (!e.inServiceBox) {
          // Serve landed out of service box -> Fault!
          this.servePhase = 'point_over';
          this.ball.isActive = false;
          sound.playCrowdGasp();
          this.rules.handleFault('fault');
          setTimeout(() => this.prepareServePosition(), 1800);
          return;
        } else if (this.ball.hasHitNet) {
          // Let! (Net cord into legal service box)
          this.servePhase = 'point_over';
          this.ball.isActive = false;
          this.rules.handleFault('let');
          setTimeout(() => this.prepareServePosition(), 1600);
          return;
        } else {
          // Valid first serve bounce -> now open rally
          this.ball.isServe = false;
        }
      }
      return;
    }

    // 2. Open Rally Bounce Rule
    if (e.isFirstBounce) {
      if (!e.inCourt) {
        // Ball landed OUT!
        this.servePhase = 'point_over';
        this.ball.isActive = false;
        sound.playCrowdGasp();

        const hitter = this.ball.lastHitter;
        const winner = hitter === 1 ? 2 : 1;
        this.rules.awardPoint(winner, 'unforced_error');
        setTimeout(() => this.prepareServePosition(), 1800);
        return;
      }
    } else {
      // Second bounce on same side without player returning it -> Point decided!
      this.servePhase = 'point_over';
      this.ball.isActive = false;

      const side = e.courtSide; // 'player1' or 'player2'
      const winner = side === 'player1' ? 2 : 1;
      const reason = this.ball.isServe ? 'ace' : 'winner';

      this.rules.awardPoint(winner, reason);
      setTimeout(() => this.prepareServePosition(), 1900);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

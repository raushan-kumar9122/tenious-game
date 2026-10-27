/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { COURT, SURFACE_PRESETS } from './constants';
import { CourtSurface } from '../types';

export interface CourtAssets {
  group: THREE.Group;
  courtMesh: THREE.Mesh;
  outerMesh: THREE.Mesh;
  netGroup: THREE.Group;
  updateSurface: (surface: CourtSurface) => void;
  updateCrowd: (time: number) => void;
}

export function createTennisStadium(renderer: THREE.WebGLRenderer): CourtAssets {
  const stadiumGroup = new THREE.Group();
  stadiumGroup.name = 'TennisStadium';

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  // 1. Procedural Texture Generators
  function createCourtTexture(surface: CourtSurface): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    const preset = SURFACE_PRESETS[surface];

    if (surface === 'grass') {
      // Wimbledon style alternating cut lawn stripes
      const stripeCount = 28;
      const stripeHeight = canvas.height / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#276735' : '#1f532b';
        ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight);
      }
      // Add subtle grass blade noise
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 16;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 1.5));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (surface === 'clay') {
      // Roland Garros terracotta with fine grit
      ctx.fillStyle = '#b95328';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 22;
        data[i] = Math.min(255, Math.max(0, data[i] + noise * 1.2));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.8));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6));
      }
      ctx.putImageData(imgData, 0, 0);
    } else {
      // US Open / Australian Open hard court (deep vibrant acrylic blue)
      ctx.fillStyle = '#1d5ec4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 12;
        data[i] = Math.min(255, Math.max(0, data[i] + noise * 0.7));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.9));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 1.3));
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // 2. Court Surface Geometry & Mesh
  const courtGeom = new THREE.PlaneGeometry(COURT.DOUBLES_WIDTH, COURT.LENGTH);
  courtGeom.rotateX(-Math.PI / 2);

  const initialSurface: CourtSurface = 'hard';
  let currentSurface: CourtSurface = initialSurface;

  const courtMat = new THREE.MeshStandardMaterial({
    map: createCourtTexture(initialSurface),
    roughness: 0.85,
    metalness: 0.05,
  });

  const courtMesh = new THREE.Mesh(courtGeom, courtMat);
  courtMesh.position.y = 0.005;
  courtMesh.receiveShadow = true;
  stadiumGroup.add(courtMesh);

  // Outer court apron / runoff surround
  const outerWidth = COURT.DOUBLES_WIDTH + COURT.OUT_RUNOFF_X * 2;
  const outerLength = COURT.LENGTH + COURT.OUT_RUNOFF_Z * 2;
  const outerGeom = new THREE.PlaneGeometry(outerWidth, outerLength);
  outerGeom.rotateX(-Math.PI / 2);

  const outerMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(SURFACE_PRESETS[initialSurface].outerColor),
    roughness: 0.9,
    metalness: 0.02,
  });

  const outerMesh = new THREE.Mesh(outerGeom, outerMat);
  outerMesh.position.y = 0;
  outerMesh.receiveShadow = true;
  stadiumGroup.add(outerMesh);

  // 3. Crisp Tennis Line Markings
  const lineMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const lineGroup = new THREE.Group();
  lineGroup.name = 'CourtLines';
  stadiumGroup.add(lineGroup);

  const lw = COURT.LINE_WIDTH;

  function addCourtLine(x1: number, z1: number, x2: number, z2: number, customWidth?: number) {
    const width = customWidth || lw;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    const geom = new THREE.PlaneGeometry(width, len);
    geom.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geom, lineMat);
    mesh.position.set((x1 + x2) / 2, 0.008, (z1 + z2) / 2);
    mesh.rotation.y = -Math.atan2(dx, dz);
    mesh.receiveShadow = true;
    lineGroup.add(mesh);
  }

  // Baselines (Z = ±11.885)
  addCourtLine(-COURT.HALF_DOUBLES_WIDTH, -COURT.HALF_LENGTH, COURT.HALF_DOUBLES_WIDTH, -COURT.HALF_LENGTH, 0.08);
  addCourtLine(-COURT.HALF_DOUBLES_WIDTH, COURT.HALF_LENGTH, COURT.HALF_DOUBLES_WIDTH, COURT.HALF_LENGTH, 0.08);

  // Doubles sidelines (X = ±5.485)
  addCourtLine(-COURT.HALF_DOUBLES_WIDTH, -COURT.HALF_LENGTH, -COURT.HALF_DOUBLES_WIDTH, COURT.HALF_LENGTH);
  addCourtLine(COURT.HALF_DOUBLES_WIDTH, -COURT.HALF_LENGTH, COURT.HALF_DOUBLES_WIDTH, COURT.HALF_LENGTH);

  // Singles sidelines (X = ±4.115)
  addCourtLine(-COURT.HALF_SINGLES_WIDTH, -COURT.HALF_LENGTH, -COURT.HALF_SINGLES_WIDTH, COURT.HALF_LENGTH);
  addCourtLine(COURT.HALF_SINGLES_WIDTH, -COURT.HALF_LENGTH, COURT.HALF_SINGLES_WIDTH, COURT.HALF_LENGTH);

  // Service lines (Z = ±6.40)
  addCourtLine(-COURT.HALF_SINGLES_WIDTH, -COURT.SERVICE_LINE_Z, COURT.HALF_SINGLES_WIDTH, -COURT.SERVICE_LINE_Z);
  addCourtLine(-COURT.HALF_SINGLES_WIDTH, COURT.SERVICE_LINE_Z, COURT.HALF_SINGLES_WIDTH, COURT.SERVICE_LINE_Z);

  // Center service line (between service lines, X = 0)
  addCourtLine(0, -COURT.SERVICE_LINE_Z, 0, COURT.SERVICE_LINE_Z);

  // Center baseline marks (small 10cm mark pointing inside court)
  addCourtLine(0, -COURT.HALF_LENGTH, 0, -COURT.HALF_LENGTH + 0.15);
  addCourtLine(0, COURT.HALF_LENGTH - 0.15, 0, COURT.HALF_LENGTH);

  // 4. Detailed 3D Tennis Net
  const netGroup = new THREE.Group();
  netGroup.name = 'TennisNet';
  stadiumGroup.add(netGroup);

  // Net posts
  const postGeom = new THREE.CylinderGeometry(0.045, 0.045, COURT.NET_HEIGHT_POST, 16);
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.25,
  });

  const postL = new THREE.Mesh(postGeom, postMat);
  postL.position.set(-COURT.NET_POST_X, COURT.NET_HEIGHT_POST / 2, 0);
  postL.castShadow = true;
  netGroup.add(postL);

  const postR = new THREE.Mesh(postGeom, postMat);
  postR.position.set(COURT.NET_POST_X, COURT.NET_HEIGHT_POST / 2, 0);
  postR.castShadow = true;
  netGroup.add(postR);

  // Net mesh procedural texture
  const netMeshCanvas = document.createElement('canvas');
  netMeshCanvas.width = 64;
  netMeshCanvas.height = 64;
  const netCtx = netMeshCanvas.getContext('2d')!;
  netCtx.fillStyle = 'rgba(10, 15, 20, 0.05)';
  netCtx.fillRect(0, 0, 64, 64);
  netCtx.strokeStyle = 'rgba(230, 235, 240, 0.65)';
  netCtx.lineWidth = 4;
  netCtx.strokeRect(4, 4, 56, 56);

  const netTexture = new THREE.CanvasTexture(netMeshCanvas);
  netTexture.wrapS = THREE.RepeatWrapping;
  netTexture.wrapT = THREE.RepeatWrapping;
  netTexture.repeat.set(120, 12);

  const netWidth = COURT.NET_POST_X * 2;
  const netHeight = COURT.NET_HEIGHT_POST;
  const netMeshGeom = new THREE.PlaneGeometry(netWidth, netHeight, 16, 4);

  // Slightly sag net in the middle down to 0.914m
  const posAttr = netMeshGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const distFromCenter = Math.abs(x) / COURT.NET_POST_X;
    // Parabolic sag
    const sag = (1 - distFromCenter * distFromCenter) * (COURT.NET_HEIGHT_POST - COURT.NET_HEIGHT_CENTER);
    posAttr.setY(i, y - sag);
  }
  netMeshGeom.computeVertexNormals();

  const netMeshMat = new THREE.MeshStandardMaterial({
    map: netTexture,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    roughness: 0.6,
    depthWrite: false,
  });

  const netMesh = new THREE.Mesh(netMeshGeom, netMeshMat);
  netMesh.position.set(0, COURT.NET_HEIGHT_POST / 2, 0);
  netMesh.castShadow = true;
  netMesh.receiveShadow = true;
  netGroup.add(netMesh);

  // White top headband cord tape
  const tapeGeom = new THREE.BoxGeometry(netWidth, 0.05, 0.03);
  const tapeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1,
  });
  const tape = new THREE.Mesh(tapeGeom, tapeMat);
  tape.position.set(0, COURT.NET_HEIGHT_CENTER + 0.02, 0);
  tape.castShadow = true;
  netGroup.add(tape);

  // Center white strap
  const strapGeom = new THREE.BoxGeometry(0.06, COURT.NET_HEIGHT_CENTER, 0.04);
  const strap = new THREE.Mesh(strapGeom, tapeMat);
  strap.position.set(0, COURT.NET_HEIGHT_CENTER / 2, 0);
  strap.castShadow = true;
  netGroup.add(strap);

  // 5. LED Sponsor Advertising Boards
  function createAdTexture(text: string, sub: string, bgColor: string, textColor: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 52px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, 48);

    ctx.font = '600 24px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(sub, canvas.width / 2, 98);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const adMatBack = new THREE.MeshStandardMaterial({
    map: createAdTexture('TENNIS CHAMPIONS 3D', 'OFFICIAL WORLD TOUR CHAMPIONSHIP', '#090d16', '#38bdf8'),
    roughness: 0.4,
    metalness: 0.2,
  });
  const adMatSide = new THREE.MeshStandardMaterial({
    map: createAdTexture('PRECISION TIMEKEEPING', 'SERVE RADAR SPEED TRACKING SYSTEM', '#0b132b', '#fbbf24'),
    roughness: 0.4,
    metalness: 0.2,
  });

  const boardHeight = 1.0;
  // Back wall ad boards
  const backBoardGeom = new THREE.BoxGeometry(outerWidth, boardHeight, 0.15);
  const backBoard1 = new THREE.Mesh(backBoardGeom, adMatBack);
  backBoard1.position.set(0, boardHeight / 2, -outerLength / 2);
  backBoard1.castShadow = true;
  backBoard1.receiveShadow = true;
  stadiumGroup.add(backBoard1);

  const backBoard2 = new THREE.Mesh(backBoardGeom, adMatBack);
  backBoard2.position.set(0, boardHeight / 2, outerLength / 2);
  backBoard2.rotation.y = Math.PI;
  backBoard2.castShadow = true;
  backBoard2.receiveShadow = true;
  stadiumGroup.add(backBoard2);

  // Side ad boards
  const sideBoardGeom = new THREE.BoxGeometry(outerLength, boardHeight, 0.15);
  const sideBoard1 = new THREE.Mesh(sideBoardGeom, adMatSide);
  sideBoard1.rotation.y = Math.PI / 2;
  sideBoard1.position.set(-outerWidth / 2, boardHeight / 2, 0);
  sideBoard1.castShadow = true;
  stadiumGroup.add(sideBoard1);

  const sideBoard2 = new THREE.Mesh(sideBoardGeom, adMatSide);
  sideBoard2.rotation.y = -Math.PI / 2;
  sideBoard2.position.set(outerWidth / 2, boardHeight / 2, 0);
  sideBoard2.castShadow = true;
  stadiumGroup.add(sideBoard2);

  // 6. Grandstands & Animated Spectator Crowd
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.8,
    metalness: 0.1,
  });

  // Build tiered grandstand steps
  const tiers = 12;
  const tierRise = 0.55;
  const tierDepth = 0.85;

  // Instanced crowd spectators
  const spectatorCount = 600;
  const headGeom = new THREE.SphereGeometry(0.2, 8, 8);
  const bodyGeom = new THREE.BoxGeometry(0.35, 0.5, 0.25);
  const spectatorMat = new THREE.MeshStandardMaterial({
    roughness: 0.7,
    metalness: 0.1,
  });

  const crowdInstancedMesh = new THREE.InstancedMesh(headGeom, spectatorMat, spectatorCount);
  crowdInstancedMesh.castShadow = true;
  crowdInstancedMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const crowdColors = [
    new THREE.Color('#ef4444'),
    new THREE.Color('#3b82f6'),
    new THREE.Color('#10b981'),
    new THREE.Color('#f59e0b'),
    new THREE.Color('#ffffff'),
    new THREE.Color('#8b5cf6'),
    new THREE.Color('#ec4899'),
    new THREE.Color('#06b6d4'),
  ];

  let specIdx = 0;
  // Place stands and spectators on North, South, East, West
  const standConfigs = [
    { side: 'north', z: -outerLength / 2 - 0.5, rot: 0, width: outerWidth + 12 },
    { side: 'south', z: outerLength / 2 + 0.5, rot: Math.PI, width: outerWidth + 12 },
    { side: 'west', x: -outerWidth / 2 - 0.5, rot: -Math.PI / 2, width: outerLength },
    { side: 'east', x: outerWidth / 2 + 0.5, rot: Math.PI / 2, width: outerLength },
  ];

  standConfigs.forEach((cfg) => {
    for (let t = 0; t < tiers; t++) {
      const stepY = (t + 1) * tierRise;
      const stepDist = t * tierDepth;
      const stepGeom = new THREE.BoxGeometry(cfg.width, tierRise, tierDepth);
      const stepMesh = new THREE.Mesh(stepGeom, standMat);
      stepMesh.receiveShadow = true;

      if (cfg.side === 'north') {
        stepMesh.position.set(0, stepY - tierRise / 2, cfg.z! - stepDist);
      } else if (cfg.side === 'south') {
        stepMesh.position.set(0, stepY - tierRise / 2, cfg.z! + stepDist);
      } else if (cfg.side === 'west') {
        stepMesh.position.set(cfg.x! - stepDist, stepY - tierRise / 2, 0);
        stepMesh.rotation.y = Math.PI / 2;
      } else {
        stepMesh.position.set(cfg.x! + stepDist, stepY - tierRise / 2, 0);
        stepMesh.rotation.y = Math.PI / 2;
      }
      stadiumGroup.add(stepMesh);

      // Add a row of spectators on this tier
      const seatsInRow = 14;
      for (let s = 0; s < seatsInRow && specIdx < spectatorCount; s++) {
        if (Math.random() > 0.88) continue; // Some empty seats
        const offset = ((s - seatsInRow / 2) / (seatsInRow / 2)) * (cfg.width * 0.42);
        let px = 0;
        let pz = 0;
        if (cfg.side === 'north') {
          px = offset;
          pz = cfg.z! - stepDist;
        } else if (cfg.side === 'south') {
          px = offset;
          pz = cfg.z! + stepDist;
        } else if (cfg.side === 'west') {
          px = cfg.x! - stepDist;
          pz = offset;
        } else {
          px = cfg.x! + stepDist;
          pz = offset;
        }

        dummy.position.set(px, stepY + 0.35, pz);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        crowdInstancedMesh.setMatrixAt(specIdx, dummy.matrix);
        const col = crowdColors[Math.floor(Math.random() * crowdColors.length)];
        crowdInstancedMesh.setColorAt(specIdx, col);
        specIdx++;
      }
    }
  });

  crowdInstancedMesh.count = specIdx;
  crowdInstancedMesh.instanceMatrix.needsUpdate = true;
  if (crowdInstancedMesh.instanceColor) crowdInstancedMesh.instanceColor.needsUpdate = true;
  stadiumGroup.add(crowdInstancedMesh);

  // 7. Umpire High Chair
  const umpireGroup = new THREE.Group();
  umpireGroup.position.set(-COURT.NET_POST_X - 1.2, 0, 0);
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3, roughness: 0.4 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });

  // Chair legs (tall ladder)
  const chairHeight = 2.4;
  const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, chairHeight), metalMat);
  leg1.position.set(-0.35, chairHeight / 2, -0.35);
  leg1.castShadow = true;
  umpireGroup.add(leg1);
  const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, chairHeight), metalMat);
  leg2.position.set(-0.35, chairHeight / 2, 0.35);
  leg2.castShadow = true;
  umpireGroup.add(leg2);
  const leg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, chairHeight), metalMat);
  leg3.position.set(0.35, chairHeight / 2, -0.35);
  leg3.castShadow = true;
  umpireGroup.add(leg3);
  const leg4 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, chairHeight), metalMat);
  leg4.position.set(0.35, chairHeight / 2, 0.35);
  leg4.castShadow = true;
  umpireGroup.add(leg4);

  // Chair seat & canopy
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.7), chairMat);
  seat.position.set(0, chairHeight, 0);
  seat.castShadow = true;
  umpireGroup.add(seat);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.7), chairMat);
  backrest.position.set(-0.35, chairHeight + 0.35, 0);
  backrest.castShadow = true;
  umpireGroup.add(backrest);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.0), chairMat);
  canopy.position.set(0, chairHeight + 1.1, 0);
  canopy.castShadow = true;
  umpireGroup.add(canopy);

  stadiumGroup.add(umpireGroup);

  // 8. Player Rest Benches with towels
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
  const towelMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });

  const bench1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 1.8), benchMat);
  bench1.position.set(COURT.NET_POST_X + 1.4, 0.225, -2.5);
  bench1.castShadow = true;
  stadiumGroup.add(bench1);

  const towel1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.7), towelMat);
  towel1.position.set(COURT.NET_POST_X + 1.4, 0.47, -2.2);
  stadiumGroup.add(towel1);

  const bench2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 1.8), benchMat);
  bench2.position.set(COURT.NET_POST_X + 1.4, 0.225, 2.5);
  bench2.castShadow = true;
  stadiumGroup.add(bench2);

  // 9. Stadium Floodlight Towers (4 corners)
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.3 });
  const lightEmissiveMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const towerPositions = [
    { x: -outerWidth * 0.75, z: -outerLength * 0.7 },
    { x: outerWidth * 0.75, z: -outerLength * 0.7 },
    { x: -outerWidth * 0.75, z: outerLength * 0.7 },
    { x: outerWidth * 0.75, z: outerLength * 0.7 },
  ];

  towerPositions.forEach((pos) => {
    const towerH = 14;
    const towerPylon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, towerH, 8), towerMat);
    towerPylon.position.set(pos.x, towerH / 2, pos.z);
    towerPylon.castShadow = true;
    stadiumGroup.add(towerPylon);

    // Light head fixture
    const fixture = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 0.5), towerMat);
    fixture.position.set(pos.x, towerH, pos.z);
    fixture.lookAt(0, 2, 0);
    stadiumGroup.add(fixture);

    // Glowing floodlight bank
    const bulbPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.0), lightEmissiveMat);
    bulbPanel.position.set(0, 0, 0.26);
    fixture.add(bulbPanel);
  });

  // Surface updater function
  function updateSurface(surface: CourtSurface) {
    currentSurface = surface;
    courtMat.map?.dispose();
    courtMat.map = createCourtTexture(surface);
    courtMat.needsUpdate = true;

    outerMat.color.set(SURFACE_PRESETS[surface].outerColor);
    outerMat.needsUpdate = true;
  }

  // Crowd subtle breathing/cheering animation
  function updateCrowd(time: number) {
    // Subtle wave or celebration
    if (!crowdInstancedMesh) return;
    const speed = 3.0;
    const amp = 0.04;
    // We can gently bob a few crowd members during cheers
  }

  return {
    group: stadiumGroup,
    courtMesh,
    outerMesh,
    netGroup,
    updateSurface,
    updateCrowd,
  };
}

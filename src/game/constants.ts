/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerStats } from '../types';

// Official Tennis Court Dimensions in Three.js World Units (meters)
export const COURT = {
  LENGTH: 23.77, // Total baseline to baseline
  HALF_LENGTH: 11.885,
  SINGLES_WIDTH: 8.23, // 27 feet
  HALF_SINGLES_WIDTH: 4.115,
  DOUBLES_WIDTH: 10.97, // 36 feet
  HALF_DOUBLES_WIDTH: 5.485,
  SERVICE_LINE_Z: 6.40, // 21 feet from net
  NET_HEIGHT_CENTER: 0.914, // 3 feet
  NET_HEIGHT_POST: 1.07, // 3.5 feet
  NET_POST_X: 5.8, // Slightly outside doubles line
  BASELINE_Z: 11.885,
  LINE_WIDTH: 0.05,
  OUT_RUNOFF_Z: 6.0, // Backspace behind baseline
  OUT_RUNOFF_X: 4.0, // Space beside doubles sideline
};

// Physics Constants
export const PHYSICS = {
  GRAVITY: 9.81, // m/s²
  BALL_RADIUS: 0.0335, // ~6.7cm diameter
  BALL_MASS: 0.058, // 58 grams
  AIR_DRAG: 0.006, // Aerodynamic drag coefficient
  MAGNUS_COEFF: 0.003, // Lift / sink from topspin / slice
  NET_CORONA_TOP: 0.93,
};

// Surface characteristics: restitution (bounce height), friction (speed preservation), spin grip
export const SURFACE_PRESETS = {
  grass: {
    name: 'Grass Court (London)',
    restitution: 0.68,
    friction: 0.88,
    ballSpeedMult: 1.12,
    bounceHeightMult: 0.85,
    skidFactor: 1.15,
    courtColor: '#2d6a36',
    outerColor: '#1d4d25',
    lineColor: '#f8fafc',
    description: 'Fast pace, low & skidding bounce. Favors big servers and attacking volleyers.',
  },
  hard: {
    name: 'Hard Court (New York)',
    restitution: 0.76,
    friction: 0.82,
    ballSpeedMult: 1.0,
    bounceHeightMult: 1.0,
    skidFactor: 1.0,
    courtColor: '#2563eb', // Vibrant blue
    outerColor: '#1e3a8a', // Deep navy
    lineColor: '#ffffff',
    description: 'True, predictable bounce with balanced speed. The ultimate all-court test.',
  },
  clay: {
    name: 'Clay Court (Paris)',
    restitution: 0.83,
    friction: 0.72,
    ballSpeedMult: 0.90,
    bounceHeightMult: 1.18,
    skidFactor: 0.85,
    courtColor: '#c25e36', // Terracotta clay
    outerColor: '#15803d', // Surrounding forest green
    lineColor: '#ffffff',
    description: 'Slow pace with high heavy kick bounce. Rewards patient baseliners and heavy topspin.',
  },
};

// Shot profiles: initial velocity vector factors, spin, arc
export const SHOT_PROFILES = {
  flat: {
    name: 'Flat Drive',
    speed: 28, // m/s
    liftAngle: 0.12, // radians upward
    topspin: 5,
    sideSpin: 0,
    depthTarget: 9.5, // Target Z near baseline
  },
  topspin: {
    name: 'Topspin',
    speed: 26,
    liftAngle: 0.22,
    topspin: 30, // Sharp dive down
    sideSpin: 0,
    depthTarget: 9.0,
  },
  slice: {
    name: 'Slice / Backspin',
    speed: 21,
    liftAngle: 0.15,
    topspin: -25, // Floats and stays low
    sideSpin: 4,
    depthTarget: 8.5,
  },
  lob: {
    name: 'High Lob',
    speed: 18,
    liftAngle: 0.65, // High trajectory
    topspin: 8,
    sideSpin: 0,
    depthTarget: 10.5,
  },
  smash: {
    name: 'Overhead Smash',
    speed: 36, // Blistering fast
    liftAngle: -0.10, // Driven downward
    topspin: 10,
    sideSpin: 0,
    depthTarget: 8.0,
  },
  serve: {
    name: 'First Serve',
    speed: 35,
    liftAngle: -0.05,
    topspin: 12,
    sideSpin: 2,
    depthTarget: 5.5, // Inside service box
  },
  serveSecond: {
    name: 'Second Kick Serve',
    speed: 27,
    liftAngle: 0.08,
    topspin: 26,
    sideSpin: 8,
    depthTarget: 5.2,
  },
};

// Tournament AI Players
export const TOURNAMENT_ROSTER: PlayerStats[] = [
  {
    id: 'player1',
    name: 'Alex Ryder',
    country: 'USA',
    avatarColor: '#2563eb',
    servePower: 86,
    speed: 88,
    accuracy: 85,
    spinControl: 84,
  },
  {
    id: 'ai_carlos',
    name: 'Carlos Soler',
    country: 'ESP',
    avatarColor: '#ef4444',
    servePower: 89,
    speed: 94,
    accuracy: 88,
    spinControl: 95,
  },
  {
    id: 'ai_novak',
    name: 'Nikola Vanev',
    country: 'SRB',
    avatarColor: '#10b981',
    servePower: 84,
    speed: 92,
    accuracy: 96,
    spinControl: 90,
  },
  {
    id: 'ai_roger',
    name: 'Stefan Maillard',
    country: 'SUI',
    avatarColor: '#8b5cf6',
    servePower: 92,
    speed: 86,
    accuracy: 94,
    spinControl: 92,
  },
  {
    id: 'ai_daniil',
    name: 'Dmitri Kozlov',
    country: 'RUS',
    avatarColor: '#f59e0b',
    servePower: 88,
    speed: 87,
    accuracy: 89,
    spinControl: 82,
  },
  {
    id: 'ai_jannik',
    name: 'Matteo Rossi',
    country: 'ITA',
    avatarColor: '#06b6d4',
    servePower: 91,
    speed: 90,
    accuracy: 91,
    spinControl: 88,
  },
  {
    id: 'ai_holger',
    name: 'Lars Lindqvist',
    country: 'SWE',
    avatarColor: '#ec4899',
    servePower: 85,
    speed: 89,
    accuracy: 84,
    spinControl: 86,
  },
  {
    id: 'ai_alexander',
    name: 'Felix Richter',
    country: 'GER',
    avatarColor: '#6366f1',
    servePower: 93,
    speed: 83,
    accuracy: 87,
    spinControl: 83,
  },
];

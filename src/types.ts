/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CourtSurface = 'grass' | 'hard' | 'clay';

export type GameMode = 'quick' | 'vsAI' | 'local2P' | 'tournament' | 'practice';

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type ShotType = 'flat' | 'topspin' | 'slice' | 'lob' | 'smash' | 'serve';

export type CameraMode = 'chase' | 'broadcast' | 'action' | 'firstPerson';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface PlayerStats {
  id: string;
  name: string;
  country: string;
  avatarColor: string;
  servePower: number; // 0-100
  speed: number;
  accuracy: number;
  spinControl: number;
}

export interface MatchScore {
  player1Sets: number[];
  player2Sets: number[];
  currentSet: number;
  player1Games: number;
  player2Games: number;
  player1Points: number | 'AD'; // 0, 15, 30, 40, 'AD'
  player2Points: number | 'AD';
  isTiebreak: boolean;
  player1TiebreakPoints: number;
  player2TiebreakPoints: number;
  server: 1 | 2; // who is serving
  servingSide: 'deuce' | 'ad'; // right or left side of center mark
  secondServe: boolean;
  winner: 1 | 2 | null;
}

export interface MatchStats {
  acesP1: number;
  acesP2: number;
  doubleFaultsP1: number;
  doubleFaultsP2: number;
  winnersP1: number;
  winnersP2: number;
  unforcedErrorsP1: number;
  unforcedErrorsP2: number;
  firstServeInP1: number;
  firstServeTotalP1: number;
  firstServeInP2: number;
  firstServeTotalP2: number;
  totalPointsP1: number;
  totalPointsP2: number;
  maxServeSpeedP1: number;
  maxServeSpeedP2: number;
  longestRally: number;
  currentRally: number;
}

export interface TournamentMatch {
  id: string;
  round: 'quarters' | 'semis' | 'final';
  player1: PlayerStats;
  player2: PlayerStats;
  winnerId: string | null;
  scoreDisplay?: string;
}

export interface GameSettings {
  courtSurface: CourtSurface;
  difficulty: AIDifficulty;
  setsToWin: 1 | 2 | 3; // 1 (best of 1), 2 (best of 3), 3 (best of 5)
  cameraMode: CameraMode;
  graphicsQuality: GraphicsQuality;
  masterVolume: number;
  sfxVolume: number;
  crowdVolume: number;
  voiceVolume: number;
  muted: boolean;
  showHitAssist: boolean;
  showTrajectory: boolean;
}

export interface CallAnnouncement {
  text: string;
  type: 'in' | 'out' | 'fault' | 'double_fault' | 'ace' | 'net' | 'let' | 'game' | 'set' | 'match_point' | 'winner';
  timestamp: number;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { TennisEngine } from './game/TennisEngine';
import { TournamentManager } from './game/tournament';
import { sound } from './game/audio';
import { Scoreboard } from './components/Scoreboard';
import { BottomDock } from './components/BottomDock';
import { ControlsGuide } from './components/ControlsGuide';
import { SettingsModal } from './components/SettingsModal';
import { TournamentBracket } from './components/TournamentBracket';
import { MatchSummary } from './components/MatchSummary';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { PracticeHUD } from './components/PracticeHUD';
import { MainMenu } from './components/MainMenu';
import {
  GameMode,
  CourtSurface,
  AIDifficulty,
  CameraMode,
  GameSettings,
  MatchScore,
  MatchStats,
  CallAnnouncement,
} from './types';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<TennisEngine | null>(null);
  const tournamentRef = useRef<TournamentManager>(new TournamentManager());

  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    courtSurface: 'hard',
    difficulty: 'medium',
    setsToWin: 1,
    cameraMode: 'chase',
    graphicsQuality: 'high',
    masterVolume: 0.85,
    sfxVolume: 0.9,
    crowdVolume: 0.7,
    voiceVolume: 0.95,
    muted: false,
    showHitAssist: true,
    showTrajectory: true,
  });

  // UI Flow States
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Live Match State
  const [currentGameMode, setCurrentGameMode] = useState<GameMode>('vsAI');
  const [player1Name, setPlayer1Name] = useState('Alex Ryder');
  const [player2Name, setPlayer2Name] = useState('Carlos Soler');
  const [player1Country, setPlayer1Country] = useState('USA');
  const [player2Country, setPlayer2Country] = useState('ESP');

  const [score, setScore] = useState<MatchScore>({
    player1Sets: [0],
    player2Sets: [0],
    currentSet: 0,
    player1Games: 0,
    player2Games: 0,
    player1Points: 0,
    player2Points: 0,
    isTiebreak: false,
    player1TiebreakPoints: 0,
    player2TiebreakPoints: 0,
    server: 1,
    servingSide: 'deuce',
    secondServe: false,
    winner: null,
  });

  const [stats, setStats] = useState<MatchStats>({
    acesP1: 0,
    acesP2: 0,
    doubleFaultsP1: 0,
    doubleFaultsP2: 0,
    winnersP1: 0,
    winnersP2: 0,
    unforcedErrorsP1: 0,
    unforcedErrorsP2: 0,
    firstServeInP1: 0,
    firstServeTotalP1: 0,
    firstServeInP2: 0,
    firstServeTotalP2: 0,
    totalPointsP1: 0,
    totalPointsP2: 0,
    maxServeSpeedP1: 0,
    maxServeSpeedP2: 0,
    longestRally: 0,
    currentRally: 0,
  });

  const [announcement, setAnnouncement] = useState<CallAnnouncement | null>(null);
  const [serveSpeedKmh, setServeSpeedKmh] = useState<number | null>(null);
  const [shotFeedback, setShotFeedback] = useState<string | null>(null);
  const [powerCharge, setPowerCharge] = useState(0);
  const [practiceStreak, setPracticeStreak] = useState(0);

  // Mount 3D Engine
  useEffect(() => {
    if (!canvasMountRef.current) return;

    sound.init();

    const engine = new TennisEngine(canvasMountRef.current, {
      onScoreUpdate: (newScore) => setScore(newScore),
      onStatsUpdate: (newStats) => setStats(newStats),
      onAnnouncement: (ann) => setAnnouncement(ann),
      onServeSpeed: (spd) => {
        setServeSpeedKmh(spd);
        setTimeout(() => setServeSpeedKmh(null), 3000);
      },
      onShotFeedback: (fb) => {
        setShotFeedback(fb);
        setTimeout(() => setShotFeedback(null), 1500);
      },
      onPowerChange: (p) => setPowerCharge(p),
      onMatchComplete: (winner) => {
        if (currentGameMode === 'tournament') {
          if (winner === 1) {
            tournamentRef.current.onUserWonMatch();
          } else {
            tournamentRef.current.onUserLostMatch();
          }
        }
        setIsSummaryOpen(true);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync settings with audio and engine
  useEffect(() => {
    sound.setVolumes(
      settings.masterVolume,
      settings.sfxVolume,
      settings.crowdVolume,
      settings.voiceVolume,
      settings.muted
    );

    if (engineRef.current) {
      engineRef.current.setSurface(settings.courtSurface);
      engineRef.current.setDifficulty(settings.difficulty);
      engineRef.current.setCameraMode(settings.cameraMode);
      engineRef.current.setGraphics(settings.graphicsQuality);
    }
  }, [settings]);

  // Global hotkeys
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'KeyP') {
        togglePause();
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'KeyC') {
        cycleCamera();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [settings.cameraMode, settings.muted, isPaused]);

  const togglePause = () => {
    if (!engineRef.current) return;
    const next = !isPaused;
    setIsPaused(next);
    engineRef.current.isPaused = next;
  };

  const toggleMute = () => {
    setSettings((prev) => ({ ...prev, muted: !prev.muted }));
  };

  const cycleCamera = () => {
    const modes: CameraMode[] = ['chase', 'broadcast', 'action', 'firstPerson'];
    const curIdx = modes.indexOf(settings.cameraMode);
    const nextMode = modes[(curIdx + 1) % modes.length];
    setSettings((prev) => ({ ...prev, cameraMode: nextMode }));
  };

  const handleStartGame = (mode: GameMode, surface: CourtSurface, difficulty: AIDifficulty) => {
    sound.init();
    sound.resumeContext();

    setCurrentGameMode(mode);
    setSettings((prev) => ({
      ...prev,
      courtSurface: surface,
      difficulty,
    }));

    if (engineRef.current) {
      engineRef.current.setMode(mode);
      engineRef.current.setSurface(surface);
      engineRef.current.setDifficulty(difficulty);

      if (mode === 'local2P') {
        setPlayer1Name('Player 1');
        setPlayer2Name('Player 2');
        setPlayer1Country('P1');
        setPlayer2Country('P2');
      } else if (mode === 'practice') {
        setPlayer1Name('Alex Ryder');
        setPlayer2Name('Ball Machine');
        setPlayer1Country('USA');
        setPlayer2Country('TRN');
        setPracticeStreak(0);
      } else if (mode === 'tournament') {
        tournamentRef.current.initTournament();
        const curMatch = tournamentRef.current.getCurrentMatch()!;
        setPlayer1Name(curMatch.player1.name);
        setPlayer2Name(curMatch.player2.name);
        setPlayer1Country(curMatch.player1.country);
        setPlayer2Country(curMatch.player2.country);
      } else {
        setPlayer1Name('Alex Ryder');
        setPlayer2Name('Carlos Soler');
        setPlayer1Country('USA');
        setPlayer2Country('ESP');
      }

      engineRef.current.restartMatch(settings.setsToWin);
    }

    setIsMainMenuOpen(false);
    setIsSummaryOpen(false);
    setIsPaused(false);
  };

  const handlePlayTournamentMatch = (match: { player1: { name: string; country: string }; player2: { name: string; country: string } }) => {
    setPlayer1Name(match.player1.name);
    setPlayer2Name(match.player2.name);
    setPlayer1Country(match.player1.country);
    setPlayer2Country(match.player2.country);

    if (engineRef.current) {
      engineRef.current.restartMatch(settings.setsToWin);
    }
    setIsTournamentOpen(false);
    setIsSummaryOpen(false);
  };

  const handleRematch = () => {
    if (engineRef.current) {
      engineRef.current.restartMatch(settings.setsToWin);
    }
    setIsSummaryOpen(false);
    setIsPaused(false);
  };

  const handleMainMenu = () => {
    setIsSummaryOpen(false);
    setIsTournamentOpen(false);
    setIsMainMenuOpen(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0" />

      {/* Broadcast Scoreboard (Top Left) */}
      {!isMainMenuOpen && (
        <Scoreboard
          score={score}
          stats={stats}
          surface={settings.courtSurface}
          player1Name={player1Name}
          player2Name={player2Name}
          player1Country={player1Country}
          player2Country={player2Country}
          serveSpeedKmh={serveSpeedKmh}
          shotFeedback={shotFeedback}
          powerCharge={powerCharge}
        />
      )}

      {/* Practice Mode Target Streak HUD (Top Right) */}
      {!isMainMenuOpen && currentGameMode === 'practice' && (
        <PracticeHUD
          streak={practiceStreak}
          onResetStreak={() => {
            setPracticeStreak(0);
            if (engineRef.current) engineRef.current.practiceStreak = 0;
          }}
        />
      )}

      {/* Broadcast Call Announcements Banner (Center Top) */}
      <AnnouncementBanner announcement={announcement} />

      {/* Ergonomic Collapsible Bottom Control Dock */}
      {!isMainMenuOpen && (
        <BottomDock
          isPaused={isPaused}
          onTogglePause={togglePause}
          onRestart={handleRematch}
          cameraMode={settings.cameraMode}
          onCameraChange={(mode) => setSettings((prev) => ({ ...prev, cameraMode: mode }))}
          isMuted={settings.muted}
          onToggleMute={toggleMute}
          onOpenControls={() => setIsControlsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Main Menu Modal */}
      <MainMenu
        isOpen={isMainMenuOpen}
        onStartGame={handleStartGame}
        onOpenControls={() => setIsControlsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Interactive Controls Guide Modal */}
      <ControlsGuide
        isOpen={isControlsOpen}
        onClose={() => setIsControlsOpen(false)}
        onStartMatch={
          isMainMenuOpen
            ? () => handleStartGame('quick', settings.courtSurface, settings.difficulty)
            : undefined
        }
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Tournament Bracket Modal */}
      <TournamentBracket
        isOpen={isTournamentOpen}
        matches={tournamentRef.current.matches}
        currentMatchId={tournamentRef.current.currentMatchId}
        tournamentWinner={tournamentRef.current.tournamentWinner}
        onPlayMatch={(m) => handlePlayTournamentMatch(m)}
        onClose={() => setIsTournamentOpen(false)}
      />

      {/* Match Summary & Victory Modal */}
      <MatchSummary
        isOpen={isSummaryOpen}
        score={score}
        stats={stats}
        player1Name={player1Name}
        player2Name={player2Name}
        onRematch={handleRematch}
        onMainMenu={handleMainMenu}
        isTournament={currentGameMode === 'tournament'}
        onNextTournamentMatch={() => {
          setIsSummaryOpen(false);
          setIsTournamentOpen(true);
        }}
      />
    </div>
  );
}

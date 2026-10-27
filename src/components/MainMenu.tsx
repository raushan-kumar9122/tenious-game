/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode, CourtSurface, AIDifficulty } from '../types';
import { Play, Users, Trophy, Target, Settings, HelpCircle, Sparkles } from 'lucide-react';

interface MainMenuProps {
  isOpen: boolean;
  onStartGame: (mode: GameMode, surface: CourtSurface, difficulty: AIDifficulty) => void;
  onOpenControls: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  isOpen,
  onStartGame,
  onOpenControls,
  onOpenSettings,
}) => {
  const [selectedMode, setSelectedMode] = React.useState<GameMode>('vsAI');
  const [selectedSurface, setSelectedSurface] = React.useState<CourtSurface>('hard');
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<AIDifficulty>('medium');

  if (!isOpen) return null;

  const modes = [
    {
      id: 'quick' as GameMode,
      title: 'Quick Match',
      desc: 'Jump instantly into center-court action with standard settings',
      icon: Play,
      accent: 'from-blue-600 to-indigo-600',
    },
    {
      id: 'vsAI' as GameMode,
      title: 'Player vs AI',
      desc: 'Exhibition match against computer with customizable difficulty',
      icon: Sparkles,
      accent: 'from-amber-500 to-orange-600',
    },
    {
      id: 'local2P' as GameMode,
      title: 'Local 2-Player',
      desc: 'Head-to-head 1v1 battle on a single keyboard (WASD vs Arrows)',
      icon: Users,
      accent: 'from-rose-500 to-pink-600',
    },
    {
      id: 'tournament' as GameMode,
      title: 'Tournament Mode',
      desc: 'Compete across 3 knockout rounds to lift the Grand Slam cup',
      icon: Trophy,
      accent: 'from-yellow-400 to-amber-600',
    },
    {
      id: 'practice' as GameMode,
      title: 'Practice Mode',
      desc: 'Hone serving accuracy, timing, and hit court bullseye targets',
      icon: Target,
      accent: 'from-emerald-500 to-teal-600',
    },
  ];

  const surfaces = [
    {
      id: 'hard' as CourtSurface,
      name: 'Hard Court',
      city: 'New York Open',
      color: '#1d5ec4',
      traits: 'True high bounce, balanced pace',
    },
    {
      id: 'grass' as CourtSurface,
      name: 'Lawn Grass',
      city: 'London Grand Slam',
      color: '#276735',
      traits: 'Slick low skidding bounce, fast pace',
    },
    {
      id: 'clay' as CourtSurface,
      name: 'Red Clay',
      city: 'Paris Championship',
      color: '#b95328',
      traits: 'High heavy kick, sliding baselines',
    },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 p-4 font-sans select-none">
      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-black uppercase tracking-widest mb-3">
            <Trophy className="w-3.5 h-3.5" /> Official Tour 3D Edition
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-md">
            TENNIS CHAMPIONS <span className="text-amber-400">3D</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Championship 3D Tennis Simulation &bull; Realistic Ball Dynamics &bull; Smart AI
          </p>
        </div>

        {/* 1. Game Mode Selection */}
        <div className="mb-6">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
            1. Select Game Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${mode.accent} text-white shadow`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-white">{mode.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{mode.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Court Surface Selection */}
        <div className="mb-6">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
            2. Choose Stadium & Surface
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {surfaces.map((surf) => {
              const isSelected = selectedSurface === surf.id;
              return (
                <button
                  key={surf.id}
                  onClick={() => setSelectedSurface(surf.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-400 shadow-xl shadow-blue-500/10 scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-inner"
                      style={{ backgroundColor: surf.color }}
                    />
                    <span className="font-bold text-sm text-white">{surf.name}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">{surf.city}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{surf.traits}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. AI Difficulty (if vsAI or quick) */}
        {selectedMode !== 'local2P' && selectedMode !== 'practice' && (
          <div className="mb-8">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              3. Opponent Difficulty
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'expert'] as AIDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition cursor-pointer text-center ${
                    selectedDifficulty === diff
                      ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-black'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenControls}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Controls Guide
            </button>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Settings className="w-4 h-4 text-sky-400" />
              Settings
            </button>
          </div>

          <button
            onClick={() => onStartGame(selectedMode, selectedSurface, selectedDifficulty)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-xl hover:shadow-amber-500/25 transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
};

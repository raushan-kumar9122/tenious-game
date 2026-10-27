/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MatchScore, MatchStats } from '../types';
import { Trophy, RotateCcw, Home, Award } from 'lucide-react';

interface MatchSummaryProps {
  isOpen: boolean;
  score: MatchScore;
  stats: MatchStats;
  player1Name: string;
  player2Name: string;
  onRematch: () => void;
  onMainMenu: () => void;
  isTournament?: boolean;
  onNextTournamentMatch?: () => void;
}

export const MatchSummary: React.FC<MatchSummaryProps> = ({
  isOpen,
  score,
  stats,
  player1Name,
  player2Name,
  onRematch,
  onMainMenu,
  isTournament,
  onNextTournamentMatch,
}) => {
  useEffect(() => {
    if (isOpen && score.winner === 1) {
      // Fire victory confetti burst
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#fbbf24', '#22c55e', '#ef4444', '#a855f7'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen, score.winner]);

  if (!isOpen) return null;

  const winnerName = score.winner === 1 ? player1Name : player2Name;
  const isP1Winner = score.winner === 1;

  const statRows = [
    { label: 'Aces', p1: stats.acesP1, p2: stats.acesP2 },
    { label: 'Double Faults', p1: stats.doubleFaultsP1, p2: stats.doubleFaultsP2 },
    { label: 'Winners', p1: stats.winnersP1, p2: stats.winnersP2 },
    { label: 'Unforced Errors', p1: stats.unforcedErrorsP1, p2: stats.unforcedErrorsP2 },
    { label: 'Max Serve Speed', p1: `${stats.maxServeSpeedP1 || 0} km/h`, p2: `${stats.maxServeSpeedP2 || 0} km/h` },
    { label: 'Longest Rally', p1: `${stats.longestRally} shots`, p2: `${stats.longestRally} shots` },
    { label: 'Total Points Won', p1: stats.totalPointsP1, p2: stats.totalPointsP2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 font-sans">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-white overflow-hidden">
        {/* Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3 shadow-lg">
            <Trophy className="w-8 h-8" />
          </div>
          <span className="block text-xs font-black uppercase tracking-widest text-amber-400 mb-1">
            Match Concluded
          </span>
          <h2 className="text-2xl font-black uppercase text-white tracking-wide">
            {winnerName} Wins!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isP1Winner ? 'Phenomenal performance on center court' : 'Hard-fought battle, tough luck!'}
          </p>
        </div>

        {/* Set Scores Summary */}
        <div className="flex items-center justify-center gap-4 py-3 px-4 bg-slate-950/60 rounded-xl border border-slate-800 mb-6">
          <span className="text-sm font-bold text-slate-300">{player1Name}</span>
          <div className="flex gap-2 font-mono font-bold text-amber-400 text-sm">
            {score.player1Sets.map((s, idx) => (
              <span key={idx}>
                {s}-{score.player2Sets[idx]}
              </span>
            ))}
          </div>
          <span className="text-sm font-bold text-slate-300">{player2Name}</span>
        </div>

        {/* Match Statistics Table */}
        <div className="bg-slate-950/40 rounded-xl border border-slate-800 p-4 mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
            Match Statistics
          </h3>
          <div className="space-y-2 text-xs">
            {statRows.map((row, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-800/40"
              >
                <span className="w-20 font-mono font-bold text-blue-400 text-left">{row.p1}</span>
                <span className="text-slate-300 font-semibold text-center flex-1">{row.label}</span>
                <span className="w-20 font-mono font-bold text-rose-400 text-right">{row.p2}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRematch}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Rematch
          </button>

          {isTournament && onNextTournamentMatch && (
            <button
              onClick={onNextTournamentMatch}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer"
            >
              <Award className="w-4 h-4" />
              Tournament Bracket
            </button>
          )}

          <button
            onClick={onMainMenu}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

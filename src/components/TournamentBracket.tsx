/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TournamentMatch, PlayerStats } from '../types';
import { Trophy, Play, CheckCircle2, Award } from 'lucide-react';

interface TournamentBracketProps {
  isOpen: boolean;
  matches: TournamentMatch[];
  currentMatchId: string;
  tournamentWinner: PlayerStats | null;
  onPlayMatch: (match: TournamentMatch) => void;
  onClose: () => void;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  isOpen,
  matches,
  currentMatchId,
  tournamentWinner,
  onPlayMatch,
  onClose,
}) => {
  if (!isOpen) return null;

  const qfMatches = matches.filter((m) => m.round === 'quarters');
  const sfMatches = matches.filter((m) => m.round === 'semis');
  const finalMatch = matches.find((m) => m.round === 'final');
  const activeMatch = matches.find((m) => m.id === currentMatchId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 font-sans">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-white overflow-y-auto max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold uppercase tracking-wide">Grand Slam Tournament</h2>
              <p className="text-xs text-slate-400">Battle through 8 world-class competitors for championship glory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            Exit to Menu
          </button>
        </div>

        {/* Winner Announcement if complete */}
        {tournamentWinner && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-400" />
              <div>
                <h3 className="text-lg font-black text-amber-400 uppercase">
                  {tournamentWinner.name} is the Grand Slam Champion!
                </h3>
                <p className="text-xs text-slate-300">Lifted the prestigious championship cup</p>
              </div>
            </div>
          </div>
        )}

        {/* 3-Round Tournament Bracket Tree */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Column 1: Quarterfinals */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Quarter-Finals
            </h3>
            <div className="space-y-3">
              {qfMatches.map((match) => (
                <div
                  key={match.id}
                  className={`p-3 rounded-xl border transition ${
                    match.id === currentMatchId
                      ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-300">{match.player1.name} ({match.player1.country})</span>
                    {match.winnerId === match.player1.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="font-semibold">{match.player2.name} ({match.player2.country})</span>
                    {match.winnerId === match.player2.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  {match.scoreDisplay && (
                    <div className="mt-2 text-[10px] font-mono text-amber-400/90 text-right">
                      {match.scoreDisplay}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Semifinals */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Semi-Finals
            </h3>
            <div className="space-y-6 pt-3">
              {sfMatches.map((match) => (
                <div
                  key={match.id}
                  className={`p-3 rounded-xl border transition ${
                    match.id === currentMatchId
                      ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-300">{match.player1.name} ({match.player1.country})</span>
                    {match.winnerId === match.player1.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="font-semibold">{match.player2.name} ({match.player2.country})</span>
                    {match.winnerId === match.player2.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  {match.scoreDisplay && (
                    <div className="mt-2 text-[10px] font-mono text-amber-400/90 text-right">
                      {match.scoreDisplay}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Championship Final */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Championship Final
            </h3>
            {finalMatch && (
              <div
                className={`p-4 rounded-xl border transition mt-10 ${
                  finalMatch.id === currentMatchId
                    ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-950/50 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-3 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <Trophy className="w-4 h-4" /> Championship Trophy Match
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-bold text-slate-200">{finalMatch.player1.name}</span>
                  {finalMatch.winnerId === finalMatch.player1.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span className="font-bold">{finalMatch.player2.name}</span>
                  {finalMatch.winnerId === finalMatch.player2.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                {finalMatch.scoreDisplay && (
                  <div className="mt-3 text-xs font-mono text-amber-400 font-bold text-right">
                    {finalMatch.scoreDisplay}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {activeMatch && !tournamentWinner && (
          <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Next Scheduled Match</span>
              <h4 className="text-base font-extrabold text-white">
                {activeMatch.player1.name} vs {activeMatch.player2.name}
              </h4>
            </div>
            <button
              onClick={() => onPlayMatch(activeMatch)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-black uppercase tracking-wider rounded-lg shadow-lg hover:shadow-amber-500/20 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Enter Court & Play
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MatchScore, MatchStats, CourtSurface } from '../types';

interface ScoreboardProps {
  score: MatchScore;
  stats: MatchStats;
  surface: CourtSurface;
  player1Name: string;
  player2Name: string;
  player1Country?: string;
  player2Country?: string;
  serveSpeedKmh: number | null;
  shotFeedback: string | null;
  powerCharge: number;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  score,
  surface,
  player1Name,
  player2Name,
  player1Country = 'USA',
  player2Country = 'ESP',
  serveSpeedKmh,
  shotFeedback,
  powerCharge,
}) => {
  const surfaceNames: Record<CourtSurface, string> = {
    grass: 'WIMBLEDON GRASS',
    hard: 'US OPEN HARDCOURT',
    clay: 'ROLAND GARROS CLAY',
  };

  const p1PointsDisplay = score.isTiebreak
    ? score.player1TiebreakPoints
    : score.player1Points;
  const p2PointsDisplay = score.isTiebreak
    ? score.player2TiebreakPoints
    : score.player2Points;

  return (
    <div className="absolute top-4 left-4 z-20 pointer-events-none select-none font-sans">
      {/* Tournament Header Badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 rounded shadow-md">
          {surfaceNames[surface]}
        </span>
        {score.isTiebreak && (
          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white rounded animate-pulse">
            TIEBREAK
          </span>
        )}
      </div>

      {/* Grand Slam Broadcast TV Scoreboard Table */}
      <div className="bg-slate-950/90 backdrop-blur-none border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden w-72 text-white">
        {/* Player 1 Row */}
        <div className={`flex items-center justify-between px-3 py-2 border-b border-slate-800 ${score.server === 1 ? 'bg-slate-900/90' : ''}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Serve Indicator Yellow Ball */}
            <div className="w-2.5 h-2.5 flex items-center justify-center">
              {score.server === 1 && (
                <div className="w-2.5 h-2.5 rounded-full bg-lime-400 shadow-[0_0_8px_#a3e635]" />
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-400 w-7">{player1Country}</span>
            <span className="text-sm font-bold text-white truncate">{player1Name}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Set scores */}
            <div className="flex gap-1.5 text-xs font-mono font-semibold text-slate-300">
              {score.player1Sets.map((games, idx) => (
                <span
                  key={idx}
                  className={`w-4 text-center ${idx === score.currentSet ? 'text-amber-400 font-bold' : ''}`}
                >
                  {idx === score.currentSet ? score.player1Games : games}
                </span>
              ))}
            </div>

            {/* Current Game Point */}
            <div className="w-8 h-6 flex items-center justify-center bg-amber-400 text-slate-950 font-black text-sm rounded">
              {p1PointsDisplay}
            </div>
          </div>
        </div>

        {/* Player 2 Row */}
        <div className={`flex items-center justify-between px-3 py-2 ${score.server === 2 ? 'bg-slate-900/90' : ''}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-2.5 h-2.5 flex items-center justify-center">
              {score.server === 2 && (
                <div className="w-2.5 h-2.5 rounded-full bg-lime-400 shadow-[0_0_8px_#a3e635]" />
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-400 w-7">{player2Country}</span>
            <span className="text-sm font-bold text-white truncate">{player2Name}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 text-xs font-mono font-semibold text-slate-300">
              {score.player2Sets.map((games, idx) => (
                <span
                  key={idx}
                  className={`w-4 text-center ${idx === score.currentSet ? 'text-amber-400 font-bold' : ''}`}
                >
                  {idx === score.currentSet ? score.player2Games : games}
                </span>
              ))}
            </div>

            <div className="w-8 h-6 flex items-center justify-center bg-amber-400 text-slate-950 font-black text-sm rounded">
              {p2PointsDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* Radar Speed Gun & Shot Feedback */}
      <div className="flex items-center gap-2 mt-2">
        {serveSpeedKmh && serveSpeedKmh > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/85 border border-sky-500/50 rounded shadow-md text-xs font-mono">
            <span className="text-sky-400 font-bold">RADAR:</span>
            <span className="text-white font-extrabold">{serveSpeedKmh} KM/H</span>
          </div>
        )}

        {shotFeedback && (
          <div className="px-2.5 py-1 bg-slate-950/85 border border-emerald-500/50 rounded shadow-md text-xs font-black uppercase text-emerald-400 tracking-wider">
            {shotFeedback}
          </div>
        )}
      </div>

      {/* Shot Power Charging Bar */}
      {powerCharge > 0 && (
        <div className="mt-2 w-72 bg-slate-950/90 border border-slate-700 rounded p-1.5 shadow-xl">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-300">
            <span>SHOT POWER</span>
            <span>{Math.round(powerCharge * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                powerCharge > 0.85
                  ? 'bg-rose-500'
                  : powerCharge > 0.6
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, powerCharge * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

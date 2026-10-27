/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Play, Gamepad2, Zap } from 'lucide-react';

interface ControlsGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch?: () => void;
}

export const ControlsGuide: React.FC<ControlsGuideProps> = ({
  isOpen,
  onClose,
  onStartMatch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 font-sans">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-white overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-wide uppercase">Match Controls Guide</h2>
              <p className="text-xs text-slate-400">Master movement, stroke selection, and sweet-spot timing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Players Controls Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Player 1 Card */}
          <div className="bg-slate-950/60 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-sm font-black text-blue-400 uppercase tracking-wider">Player 1 (Solo / Near Side)</span>
              <span className="text-[11px] font-mono text-slate-400">WASD + Actions</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">Court Movement</span>
                <div className="flex gap-1 font-mono font-bold text-slate-200">
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded shadow-sm">W</span>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded shadow-sm">A</span>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded shadow-sm">S</span>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded shadow-sm">D</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">Serve / Hit (Standard Flat)</span>
                <span className="px-3 py-0.5 bg-blue-600 font-mono font-bold text-white rounded border border-blue-400 shadow-sm">
                  SPACE
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">Forehand (Topspin Drive)</span>
                <span className="px-2.5 py-0.5 bg-slate-800 font-mono font-bold text-amber-400 rounded border border-slate-700">
                  Q
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">Backhand (Slice / Float)</span>
                <span className="px-2.5 py-0.5 bg-slate-800 font-mono font-bold text-sky-400 rounded border border-slate-700">
                  E
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">High Defensive Lob</span>
                <span className="px-2.5 py-0.5 bg-slate-800 font-mono font-bold text-emerald-400 rounded border border-slate-700">
                  R
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">Overhead Smash / Spike</span>
                <span className="px-2.5 py-0.5 bg-slate-800 font-mono font-bold text-rose-400 rounded border border-slate-700">
                  F
                </span>
              </div>
            </div>
          </div>

          {/* Player 2 Card (Local 2P) */}
          <div className="bg-slate-950/60 border border-rose-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-sm font-black text-rose-400 uppercase tracking-wider">Player 2 (Local 2-Player)</span>
              <span className="text-[11px] font-mono text-slate-400">Arrows + Actions</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">Court Movement</span>
                <div className="flex gap-1 font-mono font-bold text-slate-200">
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded shadow-sm">↑</span>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded shadow-sm">←</span>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded shadow-sm">↓</span>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded shadow-sm">→</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">Serve / Hit (Standard Flat)</span>
                <span className="px-3 py-0.5 bg-rose-600 font-mono font-bold text-white rounded border border-rose-400 shadow-sm">
                  ENTER
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">Forehand (Topspin Drive)</span>
                <span className="px-2.5 py-0.5 bg-slate-800 font-mono font-bold text-amber-400 rounded border border-slate-700">
                  J
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">Backhand (Slice / Float)</span>
                <span className="px-2.5 py-0.5 bg-slate-800 font-mono font-bold text-sky-400 rounded border border-slate-700">
                  K
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">High Defensive Lob</span>
                <span className="px-2.5 py-0.5 bg-slate-800 font-mono font-bold text-emerald-400 rounded border border-slate-700">
                  L
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-300 font-medium">Overhead Smash / Spike</span>
                <span className="px-2.5 py-0.5 bg-slate-800 font-mono font-bold text-rose-400 rounded border border-slate-700">
                  R-SHIFT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tips Section */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
            <Zap className="w-4 h-4" /> Pro Tennis Technique
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li><strong className="text-white">Serving:</strong> Press Space once to toss the ball high. When the ball reaches its peak, press Space or Q to unleash a booming 200+ km/h serve!</li>
            <li><strong className="text-white">Shot Direction:</strong> Hold <span className="font-mono text-amber-300">A</span> or <span className="font-mono text-amber-300">D</span> as you swing to drive the ball sharply cross-court or down the line.</li>
            <li><strong className="text-white">Sweet Spot Timing:</strong> Strike the ball waist-high just in front of your player for maximum velocity and explosive acoustic crack.</li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition"
          >
            Close Guide
          </button>
          {onStartMatch && (
            <button
              onClick={() => {
                onClose();
                onStartMatch();
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-black uppercase tracking-wider rounded-lg shadow-lg hover:shadow-amber-500/20 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Play Match Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

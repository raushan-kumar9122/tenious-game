/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, Award, RotateCcw } from 'lucide-react';

interface PracticeHUDProps {
  streak: number;
  onResetStreak: () => void;
}

export const PracticeHUD: React.FC<PracticeHUDProps> = ({ streak, onResetStreak }) => {
  return (
    <div className="absolute top-4 right-4 z-20 pointer-events-auto font-sans select-none">
      <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3 shadow-2xl text-white w-64">
        <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <Target className="w-4 h-4" /> Practice Target Drill
          </div>
          <button
            onClick={onResetStreak}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            title="Reset streak"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800 mb-2">
          <span className="text-xs text-slate-400 font-medium">Target Bullseyes Hit:</span>
          <div className="flex items-center gap-1.5 font-mono text-lg font-black text-amber-400">
            <Award className="w-4 h-4 text-amber-400" />
            {streak}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-tight">
          Aim your returns into the yellow glowing target circle on the opponent's court. Use <span className="text-white font-bold">A/D</span> to steer!
        </p>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSettings, CourtSurface, AIDifficulty, CameraMode, GraphicsQuality } from '../types';
import { X, Volume2, VolumeX, Monitor, Eye, Activity } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 font-sans">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-white overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold uppercase tracking-wide">Match & Audio Settings</h2>
              <p className="text-xs text-slate-400">Configure graphics, surfaces, cameras, and audio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-xs">
          {/* Court Surface */}
          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">
              Court Surface
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'hard', label: 'Hard Court', sub: 'New York (Fast)' },
                { id: 'grass', label: 'Lawn Grass', sub: 'London (Low Skid)' },
                { id: 'clay', label: 'Red Clay', sub: 'Paris (High Kick)' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => onUpdateSettings({ courtSurface: c.id as CourtSurface })}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    settings.courtSurface === c.id
                      ? 'bg-blue-600/30 border-blue-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold">{c.label}</div>
                  <div className="text-[10px] text-slate-400">{c.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty */}
          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">
              AI Opponent Difficulty
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'expert'] as AIDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => onUpdateSettings({ difficulty: diff })}
                  className={`py-2 px-3 rounded-xl border font-bold capitalize transition cursor-pointer text-center ${
                    settings.difficulty === diff
                      ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Camera View Angle */}
          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" /> Camera Angle
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'chase', label: 'Chase' },
                { id: 'broadcast', label: 'TV Broadcast' },
                { id: 'action', label: 'Action Zoom' },
                { id: 'firstPerson', label: 'First Person' },
              ].map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => onUpdateSettings({ cameraMode: cam.id as CameraMode })}
                  className={`py-2 px-2 rounded-xl border font-bold transition cursor-pointer text-center ${
                    settings.cameraMode === cam.id
                      ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>
          </div>

          {/* Match Length / Sets */}
          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">
              Match Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1, label: '1 Set (Quick)' },
                { val: 2, label: 'Best of 3 Sets' },
                { val: 3, label: 'Best of 5 Sets' },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => onUpdateSettings({ setsToWin: s.val as 1 | 2 | 3 })}
                  className={`py-2 px-3 rounded-xl border font-bold transition cursor-pointer text-center ${
                    settings.setsToWin === s.val
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Graphics Quality */}
          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> Graphics Quality (60 FPS Target)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`py-2 px-3 rounded-xl border font-bold capitalize transition cursor-pointer text-center ${
                    settings.graphicsQuality === q
                      ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Mix & Volume Controls */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                {settings.muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                Audio Volume
              </span>
              <button
                onClick={() => onUpdateSettings({ muted: !settings.muted })}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                  settings.muted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {settings.muted ? 'Unmute' : 'Mute All'}
              </button>
            </div>

            {/* Master */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Master Volume</span>
                <span className="font-mono">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => onUpdateSettings({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            {/* SFX */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Racket & Ball Hits</span>
                <span className="font-mono">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Crowd */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Crowd Cheering & Ambience</span>
                <span className="font-mono">{Math.round(settings.crowdVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.crowdVolume}
                onChange={(e) => onUpdateSettings({ crowdVolume: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Umpire Voice */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Umpire Score Calls</span>
                <span className="font-mono">{Math.round(settings.voiceVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.voiceVolume}
                onChange={(e) => onUpdateSettings({ voiceVolume: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

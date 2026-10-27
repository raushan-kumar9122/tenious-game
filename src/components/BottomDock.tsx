/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CameraMode } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  Settings,
  HelpCircle,
  Home,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BottomDockProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  cameraMode: CameraMode;
  onCameraChange: (mode: CameraMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenControls: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  isPaused,
  onTogglePause,
  onRestart,
  cameraMode,
  onCameraChange,
  isMuted,
  onToggleMute,
  onOpenControls,
  onOpenSettings,
  onMainMenu,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const cameras: { id: CameraMode; label: string }[] = [
    { id: 'chase', label: 'Chase' },
    { id: 'broadcast', label: 'TV Broadcast' },
    { id: 'action', label: 'Action' },
    { id: 'firstPerson', label: '1st Person' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 font-sans pointer-events-auto select-none flex flex-col items-center">
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-full text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-lg backdrop-blur-none transition cursor-pointer"
        title="Toggle HUD Visibility (H)"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" /> Show Controls
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" /> Hide Controls
          </>
        )}
      </button>

      {/* Dock Container */}
      {!isCollapsed && (
        <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-slate-950/90 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-none text-white max-w-[94vw]">
          {/* Pause / Resume */}
          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isPaused
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200'
            }`}
            title="Pause / Resume Match (P)"
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
            title="Restart Match"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Camera Angles */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <Eye className="w-3.5 h-3.5 text-sky-400 ml-1.5 mr-0.5 hidden md:block" />
            {cameras.map((c) => (
              <button
                key={c.id}
                onClick={() => onCameraChange(c.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  cameraMode === c.id
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio (M)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Controls Guide */}
          <button
            onClick={onOpenControls}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Open Controls Guide"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline">Controls</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Return to Main Menu */}
          <button
            onClick={onMainMenu}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-rose-400 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Return to Main Menu"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>
      )}
    </div>
  );
};

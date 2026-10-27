/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CallAnnouncement } from '../types';

interface AnnouncementBannerProps {
  announcement: CallAnnouncement | null;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ announcement }) => {
  const [visible, setVisible] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentType, setCurrentType] = useState<CallAnnouncement['type']>('in');

  useEffect(() => {
    if (!announcement) return;
    setCurrentText(announcement.text);
    setCurrentType(announcement.type);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [announcement]);

  if (!visible || !currentText) return null;

  const typeStyles: Record<CallAnnouncement['type'], string> = {
    ace: 'from-amber-500 to-yellow-400 text-slate-950 border-amber-300',
    fault: 'from-orange-600 to-rose-600 text-white border-orange-400',
    double_fault: 'from-rose-700 to-red-600 text-white border-rose-400',
    let: 'from-sky-600 to-blue-600 text-white border-sky-400',
    out: 'from-rose-600 to-red-600 text-white border-rose-400',
    in: 'from-slate-900 to-slate-950 text-white border-slate-700',
    net: 'from-amber-600 to-yellow-600 text-white border-yellow-400',
    game: 'from-emerald-600 to-teal-500 text-white border-emerald-400',
    set: 'from-purple-600 to-indigo-600 text-white border-purple-400',
    match_point: 'from-rose-600 to-pink-600 text-white border-pink-400',
    winner: 'from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-amber-200 shadow-2xl',
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none transition-all duration-300 transform scale-100 animate-in fade-in zoom-in-95">
      <div
        className={`px-6 py-2.5 rounded-2xl bg-gradient-to-r ${typeStyles[currentType]} border-2 shadow-2xl flex items-center gap-2`}
      >
        <span className="text-base sm:text-lg font-black uppercase tracking-wider font-sans drop-shadow">
          {currentText}
        </span>
      </div>
    </div>
  );
};

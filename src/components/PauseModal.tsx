import React from 'react';
import { Language } from '../game/types';

interface PauseModalProps {
  language: Language;
  day: number;
  balance: number;
  reputation: number;
  onResume: () => void;
  onRestart: () => void;
  onToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  language,
  day,
  balance,
  reputation,
  onResume,
  onRestart,
  onToTitle,
}) => {
  const isAr = language === 'ar';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'إيقاف مؤقت' : 'Game Paused'}
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#1e130b] p-6 text-amber-50 shadow-2xl">
        <h2 className="font-display-arabic text-3xl font-bold text-amber-200 mb-1">
          {isAr ? 'استراحة شاي (إيقاف مؤقت)' : 'Tea Break (Paused)'}
        </h2>
        <p className="text-sm text-amber-200/75 mb-5">
          {isAr
            ? 'القهوة متأمنة ومستنياك ترجع تكمل الشغل.'
            : 'Everything is safely paused while you catch your breath.'}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-6 p-3 rounded-xl bg-[#2a1b10] border border-amber-700/30 text-center">
          <div>
            <div className="text-[11px] text-amber-300/75">{isAr ? 'اليوم' : 'Day'}</div>
            <div className="text-lg font-bold tabular-nums">{day}</div>
          </div>
          <div>
            <div className="text-[11px] text-amber-300/75">{isAr ? 'الخزنة' : 'Cash'}</div>
            <div className="text-lg font-bold tabular-nums text-emerald-400">
              {balance} {isAr ? 'ج' : 'EGP'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-amber-300/75">{isAr ? 'السمعة' : 'Rep'}</div>
            <div className="text-lg font-bold tabular-nums text-amber-300">{reputation}%</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[46px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c1008] font-bold text-base cursor-pointer"
          >
            {isAr ? 'رجوع للشغل' : 'Resume Cafe'}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full min-h-[44px] rounded-xl bg-[#2e1e12] hover:bg-[#3d2818] border border-amber-600/40 text-amber-100 font-semibold text-sm cursor-pointer"
          >
            {isAr ? 'ابدأ قهوة جديدة (مسح الحفظ)' : 'New Coffeehouse (Reset Save)'}
          </button>
          <button
            type="button"
            onClick={onToTitle}
            className="w-full min-h-[44px] rounded-xl bg-transparent hover:bg-[#2a1a0f] border border-amber-800/50 text-amber-300 font-medium text-sm cursor-pointer"
          >
            {isAr ? 'الشاشة الرئيسية' : 'Main Title Screen'}
          </button>
        </div>
      </div>
    </div>
  );
};

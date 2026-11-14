import React from 'react';
import { GraphicsPreset, Language } from '../game/types';

interface TitleScreenProps {
  language: Language;
  hasSavedProgress: boolean;
  savedDay: number;
  savedBalance: number;
  onStart: () => void;
  onNewGame: () => void;
  graphicsPreset: GraphicsPreset;
  onChangeGraphics: (preset: GraphicsPreset) => void;
  onToggleLanguage: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  language,
  hasSavedProgress,
  savedDay,
  savedBalance,
  onStart,
  onNewGame,
  graphicsPreset,
  onChangeGraphics,
  onToggleLanguage,
}) => {
  const isAr = language === 'ar';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-30 flex flex-col justify-between p-6 md:p-10 pointer-events-none"
      style={{
        background: isAr
          ? 'radial-gradient(circle at 78% 22%, rgba(180, 83, 9, 0.22), transparent 34%), linear-gradient(255deg, #100a06 0%, #1c1009 58%, #2a170b 100%)'
          : 'radial-gradient(circle at 22% 22%, rgba(180, 83, 9, 0.22), transparent 34%), linear-gradient(105deg, #100a06 0%, #1c1009 58%, #2a170b 100%)',
      }}
    >
      {/* Top Language Toggle */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="text-xs tracking-wide text-amber-200/80 font-semibold">
          {isAr ? 'محاكاة القهوة المصرية الأصيلة' : 'Egyptian Cafe Life Simulation'}
        </div>
        <button
          type="button"
          onClick={onToggleLanguage}
          aria-label={isAr ? 'Switch to English' : 'التبديل للعربية'}
          className="min-h-[44px] px-4 py-2 rounded-lg border border-amber-500/40 bg-[#23160d]/90 text-amber-100 text-sm font-semibold hover:bg-[#342114] transition-colors cursor-pointer"
        >
          {isAr ? 'English' : 'عربي'}
        </button>
      </div>

      {/* Main Lockup in calm negative-space side */}
      <div className="max-w-lg my-auto pointer-events-auto">
        {/* Bespoke inline SVG Baladi Lantern & Tea Glass Crest */}
        <svg
          viewBox="0 0 120 84"
          className="w-24 h-16 mb-4 text-amber-400"
          aria-hidden="true"
        >
          <path
            d="M60 6 L74 22 L46 22 Z"
            fill="#d97706"
            stroke="#fde68a"
            strokeWidth="2"
          />
          <rect
            x="44"
            y="22"
            width="32"
            height="36"
            rx="4"
            fill="#451a03"
            stroke="#fbbf24"
            strokeWidth="2.5"
          />
          <path d="M52 30 L68 30 L65 50 L55 50 Z" fill="#f59e0b" />
          <path
            d="M54 34 Q60 28 66 34"
            fill="none"
            stroke="#fef3c7"
            strokeWidth="2"
          />
          <path d="M40 58 L80 58 L74 68 L46 68 Z" fill="#b45309" stroke="#fde68a" strokeWidth="2" />
          <circle cx="60" cy="40" r="3" fill="#fef3c7" />
        </svg>

        <h1 className="font-display-arabic text-4xl sm:text-5xl md:text-6xl font-bold text-amber-100 leading-tight mb-2">
          {isAr ? 'القهوة البلدي' : 'The Baladi Coffeehouse'}
        </h1>
        <p className="text-base sm:text-lg text-amber-200/90 font-medium mb-6 leading-relaxed">
          {isAr
            ? 'افتح باب القهوة، ظبّط الشاي ع البراد، واسمع حكايات عم حسني والمعلم في قلب الحتة.'
            : 'Brew authentic Egyptian tea & Turkish coffee, serve colorful regulars, hire staff, and grow your neighborhood cafe.'}
        </p>

        {hasSavedProgress && (
          <div className="mb-5 text-sm text-amber-300/95 font-medium tabular-nums">
            {isAr
              ? `حفظ محفوظ · اليوم ${savedDay} · الرصيد ${savedBalance} جنيه`
              : `Saved Cafe · Day ${savedDay} · Balance ${savedBalance} EGP`}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onStart}
            className="min-h-[52px] px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-[#1c1008] font-bold text-lg shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            {hasSavedProgress
              ? isAr
                ? 'كمّل الشغل في القهوة'
                : 'Continue Coffeehouse'
              : isAr
                ? 'ابدأ اللعبة'
                : 'Start Game'}
          </button>
          {hasSavedProgress && (
            <button
              type="button"
              onClick={onNewGame}
              className="min-h-[52px] px-6 py-3 rounded-xl border border-amber-500/45 bg-[#2a190f] hover:bg-[#3a2414] text-amber-100 font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isAr ? 'ابدأ قهوة جديدة' : 'New Coffeehouse'}
            </button>
          )}
        </div>
      </div>

      {/* Lightweight home-screen settings */}
      <div className="flex flex-wrap items-center gap-3 pointer-events-auto">
        <label className="flex items-center gap-2 rounded-xl border border-amber-700/40 bg-[#23160d]/80 px-4 py-3 text-sm text-amber-100">
          <span>{isAr ? 'جودة الرسوم' : 'Graphics'}</span>
          <select
            value={graphicsPreset}
            onChange={(event) => onChangeGraphics(event.target.value as GraphicsPreset)}
            className="bg-transparent text-amber-200 outline-none cursor-pointer"
            aria-label={isAr ? 'جودة الرسوم' : 'Graphics quality'}
          >
            <option value="low" className="bg-[#23160d]">{isAr ? 'خفيفة' : 'Low'}</option>
            <option value="medium" className="bg-[#23160d]">{isAr ? 'متوسطة' : 'Medium'}</option>
            <option value="high" className="bg-[#23160d]">{isAr ? 'عالية' : 'High'}</option>
          </select>
        </label>
        <span className="text-xs text-amber-200/60">
          {isAr ? 'اختار خفيفة لو الموبايل بيهنّج.' : 'Choose Low on slower phones.'}
        </span>
      </div>

      {/* Bottom Clean Control Hint */}
      <div className="text-xs sm:text-sm text-amber-200/75 font-medium pointer-events-none">
        {isAr
          ? 'WASD أو عصا التحكم للحركة · سحب الشاشة للكاميرا · E للتفاعل · C لتغيير زاوية الكاميرا · Esc للإيقاف'
          : 'WASD / Virtual Stick Move · Drag Screen Look · E Interact · C Camera Mode · Esc Pause'}
      </div>
    </div>
  );
};

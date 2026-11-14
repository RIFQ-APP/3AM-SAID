import React from 'react';
import { Settings, BookOpen, Info, Volume2, VolumeX, X, Play, Languages, MonitorCog, Gamepad2, Coffee, Users, Trophy, Sparkles, Wallet, ChevronLeft } from 'lucide-react';
import { TutorialModal } from './TutorialModal';
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
  muted: boolean;
  onToggleMute: () => void;
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
  muted,
  onToggleMute,
}) => {
  const isAr = language === 'ar';
  const [panel, setPanel] = React.useState<'settings' | 'about' | null>(null);
  const [guideStep, setGuideStep] = React.useState<number | null>(null);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-30 flex flex-col justify-between overflow-y-auto p-[max(1rem,env(safe-area-inset-top))] md:p-10 pointer-events-none"
      style={{
        backgroundImage: isAr
          ? 'linear-gradient(270deg, rgba(16,10,6,.94) 0%, rgba(28,16,9,.82) 48%, rgba(28,16,9,.42) 100%), url(/images/baladi-cafe-hero.svg)'
          : 'linear-gradient(270deg, rgba(16,10,6,.94) 0%, rgba(28,16,9,.82) 48%, rgba(28,16,9,.42) 100%), url(/images/baladi-cafe-hero.svg)',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
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
          className="flex min-h-[46px] items-center gap-2 rounded-xl border border-amber-500/45 bg-[#23160d]/90 px-4 py-2 text-sm font-bold text-amber-100 shadow-lg transition-colors hover:bg-[#342114] cursor-pointer"
        >
          <Languages className="h-4 w-4 text-amber-300" />
          {isAr ? 'English' : 'عربي'}
        </button>
      </div>

      {/* Main Lockup in calm negative-space side */}
      <div className="relative z-10 w-full max-w-lg my-auto py-4 pointer-events-auto">
        {/* Bespoke inline SVG Baladi Lantern & Tea Glass Crest */}
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-400/20 to-orange-950/60 text-amber-300 shadow-[0_12px_45px_rgba(217,119,6,0.18)]">
        <Coffee className="h-11 w-11" strokeWidth={1.7} />
        </div>
        <svg
          viewBox="0 0 120 84"
          className="hidden w-24 h-16 mb-4 text-amber-400"
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

        <div className="flex flex-col gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onStart}
            className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-xl bg-amber-500 px-8 py-3 text-lg font-extrabold text-[#1c1008] shadow-lg transition-all hover:bg-amber-400 active:scale-[0.98] cursor-pointer"
          >
            <Play className="h-6 w-6 fill-current" aria-hidden="true" />
            {hasSavedProgress
              ? isAr ? 'متابعة اللعب' : 'Continue Game'
              : isAr ? 'العب الآن' : 'Play Now'}
          </button>

          {hasSavedProgress && (
            <button
              type="button"
              onClick={onNewGame}
              className="min-h-[46px] w-full rounded-xl border border-amber-500/45 bg-[#2a190f] px-5 py-2.5 font-bold text-amber-100 transition-colors hover:bg-[#3a2414] cursor-pointer"
            >
              {isAr ? 'ابدأ لعبة جديدة' : 'New Game'}
            </button>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPanel('settings')}
              className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-xl border border-amber-700/45 bg-[#24160d]/90 px-2 py-3 text-sm font-bold text-amber-100 hover:bg-[#382314] cursor-pointer"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><Settings className="h-5 w-5" /></span>
              {isAr ? 'الإعدادات' : 'Settings'}
            </button>
            <button
              type="button"
              onClick={() => setGuideStep(0)}
              className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-xl border border-amber-700/45 bg-[#24160d]/90 px-2 py-3 text-sm font-bold text-amber-100 hover:bg-[#382314] cursor-pointer"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><BookOpen className="h-5 w-5" /></span>
              {isAr ? 'طريقة اللعب' : 'How to Play'}
            </button>
            <button
              type="button"
              onClick={() => setPanel('about')}
              className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-xl border border-amber-700/45 bg-[#24160d]/90 px-2 py-3 text-sm font-bold text-amber-100 hover:bg-[#382314] cursor-pointer"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300"><Info className="h-5 w-5" /></span>
              {isAr ? 'عن اللعبة' : 'About'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-amber-800/35 bg-[#24160d]/70 p-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300"><Users className="h-5 w-5" /></span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-100/85">{isAr ? 'زبائن متنوعون' : 'Unique Guests'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-800/35 bg-[#24160d]/70 p-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300"><Trophy className="h-5 w-5" /></span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-100/85">{isAr ? 'تحديات وجوائز' : 'Challenges'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-800/35 bg-[#24160d]/70 p-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-400/10 text-fuchsia-300"><Sparkles className="h-5 w-5" /></span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-100/85">{isAr ? 'طوّر قهوتك' : 'Cafe Upgrades'}</span>
          </div>
        </div>
      </div>

      {/* Home-screen settings and information panels */}
      {panel && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <section dir={isAr ? 'rtl' : 'ltr'} className="w-full max-w-md rounded-2xl border border-amber-500/45 bg-[#1d120a] p-5 text-amber-50 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-amber-200">
                {panel === 'settings' ? (isAr ? 'إعدادات اللعبة' : 'Game Settings') : (isAr ? 'عن القهوة البلدي' : 'About the Game')}
              </h2>
              <button type="button" onClick={() => setPanel(null)} aria-label={isAr ? 'إغلاق' : 'Close'} className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3a2415] text-amber-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {panel === 'settings' ? (
              <div className="space-y-3">
                <label className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-amber-800/40 bg-[#2a1a0f] px-4 py-3">
                  <span className="flex items-center gap-2 font-bold"><MonitorCog className="h-5 w-5 text-sky-300" />{isAr ? 'جودة الرسوم' : 'Graphics Quality'}</span>
                  <select
                    value={graphicsPreset}
                    onChange={(event) => onChangeGraphics(event.target.value as GraphicsPreset)}
                    className="max-w-[50%] rounded-lg bg-[#180f08] px-3 py-2 text-amber-200 outline-none"
                    aria-label={isAr ? 'جودة الرسوم' : 'Graphics quality'}
                  >
                    <option value="low">{isAr ? 'خفيفة' : 'Low'}</option>
                    <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                    <option value="high">{isAr ? 'عالية' : 'High'}</option>
                  </select>
                </label>
                <button type="button" onClick={onToggleLanguage} className="flex min-h-14 w-full items-center justify-between rounded-xl border border-amber-800/40 bg-[#2a1a0f] px-4 py-3 font-bold">
                  <span className="flex items-center gap-2"><Languages className="h-5 w-5 text-emerald-300" />{isAr ? 'لغة اللعبة' : 'Game Language'}</span>
                  <span className="text-amber-300">{isAr ? 'العربية / English' : 'English / العربية'}</span>
                </button>
                <button type="button" onClick={onToggleMute} className="flex min-h-14 w-full items-center justify-between rounded-xl border border-amber-800/40 bg-[#2a1a0f] px-4 py-3 font-bold">
                  <span className="flex items-center gap-2"><Volume2 className="h-5 w-5 text-violet-300" />{isAr ? 'الصوت' : 'Sound'}</span>
                  <span className="flex items-center gap-2 text-amber-300">
                    {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    {muted ? (isAr ? 'مكتوم' : 'Muted') : (isAr ? 'يعمل' : 'On')}
                  </span>
                </button>
                <p className="text-xs leading-6 text-amber-200/65">
                  {isAr ? 'اختار الجودة الخفيفة لو جهازك بيواجه بطء أو تقطيع.' : 'Choose Low if your device struggles with performance.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-sm leading-7 text-amber-100/85">
                <p>{isAr ? 'القهوة البلدي لعبة محاكاة وإدارة كوميدية مستوحاة من أجواء القهاوي المصرية.' : 'The Baladi Coffeehouse is a comedic management and life simulation inspired by Egyptian neighborhood cafes.'}</p>
                <p>{isAr ? 'استقبل الزباين، حضّر المشروبات، عيّن العمال، طوّر المكان، وتعامل مع مواقف الحارة اليومية.' : 'Serve customers, prepare drinks, hire staff, upgrade your cafe, and handle the neighborhood’s daily surprises.'}</p>
                <div className="rounded-xl border border-amber-800/40 bg-[#2a1a0f] p-3 text-amber-300">
                  {isAr ? 'هدفك: خلّي قهوتك أشهر قهوة في الحتة!' : 'Your goal: make your cafe the most famous spot in the neighborhood!'}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {guideStep !== null && (
        <TutorialModal
          language={language}
          step={guideStep}
          onNext={() => setGuideStep((step) => step !== null && step < 3 ? step + 1 : null)}
          onSkip={() => setGuideStep(null)}
        />
      )}

      {/* Bottom Clean Control Hint */}
      <div className="relative z-10 text-xs sm:text-sm text-amber-200/75 font-medium pointer-events-none pb-[env(safe-area-inset-bottom)]">
        {isAr
          ? 'WASD أو عصا التحكم للحركة · سحب الشاشة للكاميرا · E للتفاعل · C لتغيير زاوية الكاميرا · Esc للإيقاف'
          : 'WASD / Virtual Stick Move · Drag Screen Look · E Interact · C Camera Mode · Esc Pause'}
      </div>
    </div>
  );
};

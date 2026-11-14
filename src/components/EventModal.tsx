import React from 'react';
import { Coins, Package, Sparkles, Star } from 'lucide-react';
import { ActiveRandomEvent, EventEffectChip, Language } from '../game/types';

interface EventModalProps {
  event: ActiveRandomEvent;
  language: Language;
  onChoose: (choiceId: string) => void;
}

function renderChipIcon(kind: EventEffectChip['kind']) {
  if (kind === 'money') return <Coins className="w-4 h-4 shrink-0" />;
  if (kind === 'rep') return <Star className="w-4 h-4 shrink-0" />;
  if (kind === 'stock') return <Package className="w-4 h-4 shrink-0" />;
  return <Sparkles className="w-4 h-4 shrink-0" />;
}

export const EventModal: React.FC<EventModalProps> = ({ event, language, onChoose }) => {
  const isAr = language === 'ar';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? event.titleAr : event.titleEn}
    >
      <div className="w-full max-w-lg rounded-2xl border-2 border-amber-500/65 bg-[#22150c] p-5 sm:p-6 text-amber-50 shadow-2xl">
        <div className="text-xs font-extrabold text-amber-400 mb-1">
          {isAr ? 'موقف في القهوة' : 'Coffeehouse Event'}
        </div>
        <h2 className="font-display-arabic text-2xl sm:text-3xl font-bold text-amber-100 mb-2">
          {isAr ? event.titleAr : event.titleEn}
        </h2>
        <p className="text-sm sm:text-base text-amber-100/95 leading-snug mb-3.5">
          {isAr ? event.descriptionAr : event.descriptionEn}
        </p>

        <div
          dir="rtl"
          className="rounded-xl bg-[#160d07] border border-amber-700/45 px-3.5 py-2.5 mb-5 text-sm sm:text-base font-semibold text-amber-200"
        >
          {event.dialogueAr}
        </div>

        <div className="flex flex-col gap-3">
          {event.choices.map((ch, idx) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => onChoose(ch.id)}
              className={`w-full text-start p-4 rounded-2xl border-2 transition-colors cursor-pointer flex flex-col gap-2.5 ${
                idx === 0
                  ? 'bg-[#362213] hover:bg-[#492e19] border-amber-400/75'
                  : 'bg-[#2a1a0f] hover:bg-[#3a2415] border-amber-700/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-nums font-extrabold text-sm shrink-0 ${
                    idx === 0
                      ? 'bg-amber-400 text-[#1c1008]'
                      : 'bg-amber-900/80 text-amber-200 border border-amber-600/50'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="font-extrabold text-base text-amber-50">
                  {isAr ? ch.labelAr : ch.labelEn}
                </span>
              </div>

              {ch.effects && ch.effects.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 ps-9">
                  {ch.effects.map((eff, ei) => {
                    const isNeg = eff.delta < 0;
                    return (
                      <span
                        key={`${eff.kind}-${ei}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold border ${
                          isNeg
                            ? 'bg-red-950/75 border-red-500/55 text-red-200'
                            : 'bg-emerald-950/75 border-emerald-500/55 text-emerald-200'
                        }`}
                      >
                        {renderChipIcon(eff.kind)}
                        <span>{isAr ? eff.labelAr : eff.labelEn}</span>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-amber-300/90 font-bold ps-9">
                  {isAr ? ch.effectTextAr : ch.effectTextEn}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Language } from '../game/types';

interface TutorialModalProps {
  language: Language;
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

const STEPS = [
  {
    titleAr: 'أهلاً بيك يا معلم!',
    bodyAr: 'دي قهوتك، وإنت المسؤول عن تشغيلها وتوسيعها. هدفك ترضي الزباين وتكبر القهوة واحدة واحدة.',
    titleEn: 'Welcome, boss!',
    bodyEn: 'This is your coffeehouse. Run the daily service, keep customers happy, and grow the business step by step.',
    hintAr: 'ابدأ بالتجول داخل القهوة والتعرف على المكان.',
    hintEn: 'Start by walking around and learning the cafe layout.',
  },
  {
    titleAr: 'اتحرك واستكشف',
    bodyAr: 'على الموبايل استخدم عصا الحركة أسفل الشاشة. على الكمبيوتر استخدم WASD أو الأسهم. اسحب الشاشة لتحريك الكاميرا.',
    titleEn: 'Move and explore',
    bodyEn: 'On mobile, use the on-screen joystick. On desktop, use WASD or arrow keys. Drag the screen to move the camera.',
    hintAr: 'زر C يغيّر زاوية الكاميرا بين المنظور الأول والثالث والكاميرا الحرة.',
    hintEn: 'Press C to switch between first-person, third-person, and free camera.',
  },
  {
    titleAr: 'استقبل الطلبات',
    bodyAr: 'لما الزبون يقعد هيطلب مشروبه. تقدر تراجع الطلبات من قائمة الطلبات، وبعدها روح للنصبة عشان تحضّره.',
    titleEn: 'Take customer orders',
    bodyEn: 'Customers order after taking a seat. Review active orders in the Orders panel, then head to the preparation counter.',
    hintAr: 'قرب من النصبة واضغط زر التفاعل أو E لفتح تجهيز المشروبات.',
    hintEn: 'Walk to the counter and use the interaction button or E to prepare drinks.',
  },
  {
    titleAr: 'حضّر وقدّم واكسب',
    bodyAr: 'اختار المشروب الصحيح، اضبط المقادير ووقت الصب، وبعدها خد الصينية وقدّمها للزبون. الجودة العالية تزود البقشيش والسمعة.',
    titleEn: 'Brew, serve, and earn',
    bodyEn: 'Choose the correct drink, measure ingredients, and time the pour. Carry the tray to the customer. Better quality earns tips and reputation.',
    hintAr: 'طوّر المخزن والعمال والمعدات، وتابع المهام عشان تكبر القهوة.',
    hintEn: 'Upgrade stock, staff, and equipment, and complete missions to grow your cafe.',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  language,
  step,
  onNext,
  onSkip,
}) => {
  const isAr = language === 'ar';
  const current = STEPS[Math.max(0, Math.min(STEPS.length - 1, step))];
  const isLast = step >= STEPS.length - 1;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      onKeyDown={(event) => event.stopPropagation()}
    >
      <section className="w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/50 bg-[#1d120a] text-amber-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-800/50 bg-[#29190e] px-5 py-4">
          <div>
            <div className="text-xs font-bold tracking-wider text-amber-400">
              {isAr ? 'دليل البداية' : 'QUICK START GUIDE'}
            </div>
            <div className="mt-1 text-xs text-amber-100/65">
              {isAr ? `الخطوة ${step + 1} من ${STEPS.length}` : `Step ${step + 1} of ${STEPS.length}`}
            </div>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 w-6 rounded-full ${index <= step ? 'bg-amber-400' : 'bg-amber-900'}`}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-3xl" aria-hidden="true">
            {['☕', '🕹️', '📋', '🏆'][step] ?? '☕'}
          </div>
          <h2 id="tutorial-title" className="mb-3 text-2xl font-bold text-amber-200">
            {isAr ? current.titleAr : current.titleEn}
          </h2>
          <p className="text-sm leading-7 text-amber-50/90">
            {isAr ? current.bodyAr : current.bodyEn}
          </p>
          <div className="mt-5 rounded-xl border border-amber-700/35 bg-[#2a1b10] p-3 text-sm leading-6 text-amber-200">
            {isAr ? current.hintAr : current.hintEn}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-amber-800/40 bg-[#24170e] px-5 py-4">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-11 px-4 text-sm font-semibold text-amber-200/70 hover:text-amber-100"
          >
            {isAr ? 'تخطي الشرح' : 'Skip tutorial'}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="min-h-11 rounded-xl bg-amber-500 px-6 py-2 text-sm font-bold text-[#1c1008] transition-colors hover:bg-amber-400"
          >
            {isLast ? (isAr ? 'يلا نبدأ!' : "Let's play!") : (isAr ? 'التالي' : 'Next')}
          </button>
        </div>
      </section>
    </div>
  );
};

import React from 'react';
import { Coffee, Clock3, MapPin, UserRound, X } from 'lucide-react';
import { DRINKS } from '../game/catalog';
import { CustomerData, CustomerPortraitId } from '../game/types';

interface CustomerProfileModalProps {
  customer: CustomerData;
  language: 'ar' | 'en';
  onClose: () => void;
}

const PORTRAIT_CELLS: Record<CustomerPortraitId, { column: number; row: number }> = {
  'uncle-hosny': { column: 0, row: 0 },
  'young-regular': { column: 1, row: 0 },
  'abu-saeed': { column: 2, row: 0 },
  'customer-woman': { column: 0, row: 1 },
  'delivery-courier': { column: 1, row: 1 },
  mechanic: { column: 2, row: 1 },
};

const STATE_LABELS_AR: Record<CustomerData['state'], string> = {
  entering: 'داخل القهوة',
  looking_for_seat: 'بيدوّر على مكان',
  walking_to_table: 'رايح لترابيزته',
  sitting: 'قاعد وبيختار',
  ordering: 'بيطلب',
  waiting: 'مستني طلبه',
  talking: 'بيتكلم مع اللي حواليه',
  complaining: 'مستعجل ومتنرفز',
  drinking: 'بيشرب طلبه',
  paying: 'بيحاسب',
  leaving: 'ماشي',
};

const STATE_LABELS_EN: Record<CustomerData['state'], string> = {
  entering: 'Just arrived',
  looking_for_seat: 'Looking for a seat',
  walking_to_table: 'Finding a table',
  sitting: 'Choosing a drink',
  ordering: 'Placing an order',
  waiting: 'Waiting for the order',
  talking: 'Chatting with friends',
  complaining: 'Getting impatient',
  drinking: 'Enjoying the drink',
  paying: 'Paying',
  leaving: 'Leaving',
};

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customer,
  language,
  onClose,
}) => {
  const isAr = language === 'ar';
  const portrait = PORTRAIT_CELLS[customer.portraitId ?? 'uncle-hosny'];
  const patience = Math.max(0, Math.min(100, Math.round(customer.patienceLeft)));
  const drink = customer.orderedDrink
    ? isAr
      ? DRINKS[customer.orderedDrink].nameAr
      : DRINKS[customer.orderedDrink].nameEn
    : isAr
      ? 'لسه ماطلبش'
      : 'No order yet';

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      dir={isAr ? 'rtl' : 'ltr'}
      role="presentation"
      onClick={onClose}
    >
      <section
        className="relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-[28px] border border-amber-200/25 bg-[#21170f] text-amber-50 shadow-[0_24px_90px_rgba(0,0,0,.65)] sm:flex-row"
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? 'بيانات الزبون' : 'Customer profile'}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={isAr ? 'إغلاق' : 'Close'}
          className="absolute left-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/45 text-white transition hover:bg-black/70"
        >
          <X size={18} />
        </button>

        <div className="relative flex min-h-[250px] items-end justify-center overflow-hidden bg-gradient-to-b from-[#6b4325] via-[#3c281b] to-[#21170f] sm:min-h-[330px] sm:w-[45%]">
          <div
            className="h-[245px] w-[122px] bg-contain bg-bottom bg-no-repeat sm:h-[320px] sm:w-[160px]"
            style={{
              backgroundImage: "url('/images/customer-portraits.svg')",
              backgroundSize: '300% 200%',
              backgroundPosition: `${portrait.column * 50}% ${portrait.row * 100}%`,
            }}
          />
          <div className="absolute bottom-3 rounded-full border border-amber-200/20 bg-black/35 px-3 py-1 text-[10px] font-bold tracking-[.18em] text-amber-100/80">
            {isAr ? 'زبون القهوة' : 'COFFEEHOUSE GUEST'}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-amber-300">
              <UserRound size={16} />
              <span className="text-xs font-bold">{isAr ? 'ملف الزبون' : 'CUSTOMER PROFILE'}</span>
            </div>
            <h2 className="text-2xl font-black text-white">{isAr ? customer.nameAr : customer.nameEn}</h2>
            <p className="mt-1 text-sm text-amber-100/65">
              {isAr ? STATE_LABELS_AR[customer.state] : STATE_LABELS_EN[customer.state]}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.055] p-3">
            <div className="mb-2 flex items-center gap-2 text-amber-200">
              <Coffee size={16} />
              <span className="text-xs font-bold">{isAr ? 'الطلب المفضل حالياً' : 'CURRENT ORDER'}</span>
            </div>
            <p className="text-base font-extrabold text-white">{drink}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.055] p-3">
            <div className="mb-2 flex items-center justify-between gap-2 text-amber-200">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Clock3 size={15} />
                {isAr ? 'الصبر' : 'PATIENCE'}
              </span>
              <span className="text-sm font-black tabular-nums">{patience}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/35">
              <div
                className={`h-full rounded-full transition-all ${patience < 30 ? 'bg-rose-500' : patience < 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${patience}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-100/60">
            <MapPin size={14} />
            {isAr ? `ترابيزة رقم ${customer.tableId ?? '—'}` : `Table ${customer.tableId ?? '—'}`}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-auto rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-[#24160d] shadow-lg shadow-amber-950/25 transition hover:bg-amber-400"
          >
            {isAr ? 'تمام، ارجع للقهوة' : 'Back to the cafe'}
          </button>
        </div>
      </section>
    </div>
  );
};

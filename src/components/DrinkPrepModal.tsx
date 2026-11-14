import React, { useEffect, useRef, useState } from 'react';
import { Coffee, Droplets, Flame, Sparkles } from 'lucide-react';
import { DRINK_LIST, DRINKS, INGREDIENTS } from '../game/catalog';
import { calculateDrinkQuality, hasRequiredIngredients } from '../game/economy';
import { DrinkId, GameState, IngredientId, Order } from '../game/types';

interface DrinkPrepModalProps {
  gameState: GameState;
  orders: Order[];
  tableDirtyLookup: (tableId: number) => boolean;
  onClose: () => void;
  onOpenInventory: () => void;
  onPlaySound: (type: 'pour' | 'stir' | 'reward') => void;
  onCompleteDrink: (params: {
    order: Order | null;
    drinkId: DrinkId;
    quality: number;
  }) => void;
}

export const DrinkPrepModal: React.FC<DrinkPrepModalProps> = ({
  gameState,
  orders,
  tableDirtyLookup,
  onClose,
  onOpenInventory,
  onPlaySound,
  onCompleteDrink,
}) => {
  const isAr = gameState.settings.language === 'ar';
  const pendingOrders = orders.filter(
    (o) => o.status === 'new' || o.status === 'accepted' || o.status === 'preparing'
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    pendingOrders[0]?.id ?? ''
  );
  const activeOrder =
    pendingOrders.find((o) => o.id === selectedOrderId) ?? pendingOrders[0] ?? null;

  const [selectedDrink, setSelectedDrink] = useState<DrinkId>(
    activeOrder?.drinkId ?? 'medium_tea'
  );
  const [addedIngredients, setAddedIngredients] = useState<
    Partial<Record<IngredientId, number>>
  >({});
  const [brewMeter, setBrewMeter] = useState(0); // 0..100, sweet spot 68..88
  const [isBrewing, setIsBrewing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [lastQuality, setLastQuality] = useState<number | null>(null);
  const brewIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeOrder) {
      setSelectedDrink(activeOrder.drinkId);
      setAddedIngredients({});
      setBrewMeter(0);
      setStatusError(null);
    }
  }, [activeOrder?.id]);

  useEffect(() => {
    return () => {
      if (brewIntervalRef.current !== null) clearInterval(brewIntervalRef.current);
    };
  }, []);

  const recipe = DRINKS[selectedDrink];
  const stockCheck = hasRequiredIngredients(gameState.inventory, selectedDrink);

  const handleSelectDrink = (id: DrinkId) => {
    setSelectedDrink(id);
    setAddedIngredients({});
    setBrewMeter(0);
    setStatusError(null);
  };

  const handleAddIngredient = (ing: IngredientId) => {
    setStatusError(null);
    const available = gameState.inventory[ing] ?? 0;
    const currentAdded = addedIngredients[ing] ?? 0;
    if (currentAdded >= available) {
      setStatusError(
        isAr
          ? `الكمية خلصت من ${INGREDIENTS[ing].nameAr}!`
          : `Out of ${INGREDIENTS[ing].nameEn}!`
      );
      return;
    }
    setAddedIngredients((prev) => ({
      ...prev,
      [ing]: currentAdded + 1,
    }));
    onPlaySound('stir');
  };

  const handleAutoFillRecipe = () => {
    setStatusError(null);
    setLastQuality(null);
    if (!stockCheck.ok) {
      setStatusError(
        isAr
          ? `نقص خامات: ${stockCheck.missing.map((m) => INGREDIENTS[m].nameAr).join('، ')}`
          : `Missing: ${stockCheck.missing.map((m) => INGREDIENTS[m].nameEn).join(', ')}`
      );
      return;
    }
    setAddedIngredients({ ...recipe.ingredients });
    onPlaySound('pour');
  };

  const startBrewing = () => {
    setStatusError(null);
    if (!stockCheck.ok) {
      setStatusError(
        isAr
          ? 'لا يمكن التحضير، المخزن ناقص خامات! اشتري بضاعة الأول.'
          : 'Cannot brew: missing ingredients in inventory!'
      );
      return;
    }
    if (Object.keys(addedIngredients).length === 0) {
      setStatusError(
        isAr
          ? 'حط المكونات في الكوباية الأول (أو دوس تجهيز سريع للمكونات).'
          : 'Add ingredients to the cup first!'
      );
      return;
    }
    if (isBrewing) return;
    setIsBrewing(true);
    setBrewMeter(8);
    onPlaySound('pour');
    brewIntervalRef.current = window.setInterval(() => {
      setBrewMeter((prev) => {
        if (prev >= 100) {
          if (brewIntervalRef.current !== null) {
            clearInterval(brewIntervalRef.current);
            brewIntervalRef.current = null;
          }
          return 100;
        }
        return prev + 4;
      });
    }, 65);
  };

  const finishBrewing = () => {
    if (brewIntervalRef.current !== null) {
      clearInterval(brewIntervalRef.current);
      brewIntervalRef.current = null;
    }
    setIsBrewing(false);

    // Sweet spot is 78%
    const dist = Math.abs(brewMeter - 78);
    const brewAccuracy = Math.max(0.15, 1 - dist / 65);

    const quality = calculateDrinkQuality({
      targetDrinkId: activeOrder?.drinkId ?? selectedDrink,
      selectedDrinkId: selectedDrink,
      addedIngredients,
      brewMeterAccuracy: brewAccuracy,
      tableDirty: activeOrder ? tableDirtyLookup(activeOrder.tableId) : false,
      hasBrassKettleUpgrade: gameState.upgrades.brass_kettle,
    });

    setLastQuality(quality);
    onPlaySound('reward');
    onCompleteDrink({
      order: activeOrder,
      drinkId: selectedDrink,
      quality,
    });
  };

  const ingList = Object.keys(recipe.ingredients) as IngredientId[];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'نصبة المشروبات' : 'Drink Preparation Station'}
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-amber-500/45 bg-[#1e130b] text-amber-50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/35 bg-[#28190e]">
          <div>
            <h2 className="font-display-arabic text-xl sm:text-2xl font-bold text-amber-200">
              {isAr ? 'نصبة القهوة والشاي' : 'Traditional Drink Counter'}
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80">
              {isAr
                ? 'اختار الطلب، ظبّط المقادير، وصبّ في الوقت الصح'
                : 'Pick order, measure ingredients, and pour in the sweet spot'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق النصبة' : 'Close Counter'}
            className="min-h-[44px] min-w-[44px] px-3 rounded-lg bg-[#3a2415] hover:bg-[#4d301c] text-amber-100 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="cafe-scroll overflow-y-auto p-4 space-y-4">
          {/* Active Order Selector */}
          <div>
            <div className="text-xs font-bold text-amber-300 mb-2">
              {isAr ? '1. الطلبات المطلوبة حالياً' : '1. Active Customer Orders'}
            </div>
            {pendingOrders.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#27180d] border border-amber-800/30 text-xs text-amber-200/75">
                {isAr
                  ? 'مفيش طلبات جديدة دلوقتي.. تقدر تحضر أي مشروب للتدريب أو تستنى الزبائن.'
                  : 'No active orders right now — you can practice brewing or wait for guests.'}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pendingOrders.map((ord) => {
                  const selected = activeOrder?.id === ord.id;
                  const drink = DRINKS[ord.drinkId];
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setSelectedOrderId(ord.id)}
                      className={`shrink-0 px-3 py-2 rounded-xl border text-start cursor-pointer transition-colors ${
                        selected
                          ? 'bg-amber-500 text-[#1c1008] border-amber-300 font-bold'
                          : 'bg-[#2a1a0f] text-amber-100 border-amber-700/40 hover:bg-[#362113]'
                      }`}
                    >
                      <div className="text-xs">
                        {isAr ? ord.customerNameAr : ord.customerNameEn} ·{' '}
                        {isAr ? `ترابيزة ${ord.tableId}` : `T${ord.tableId}`}
                      </div>
                      <div className="text-sm font-bold">
                        {isAr ? drink.nameAr : drink.nameEn}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drink Selection */}
          <div>
            <div className="text-xs sm:text-sm font-bold text-amber-300 mb-2">
              {isAr ? '2. اختار المشروب' : '2. Select Drink'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DRINK_LIST.map((d) => {
                const locked = gameState.level < d.unlockLevel;
                const active = selectedDrink === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={locked}
                    onClick={() => handleSelectDrink(d.id)}
                    className={`p-2.5 rounded-xl border text-start cursor-pointer transition-colors ${
                      locked
                        ? 'bg-[#170e08] border-amber-900/30 text-amber-500/45 cursor-not-allowed'
                        : active
                          ? 'bg-[#462915] border-amber-400 text-amber-50'
                          : 'bg-[#27180d] border-amber-800/40 text-amber-100 hover:bg-[#332012]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {isAr ? d.nameAr : d.nameEn}
                      </span>
                      <span className="text-[11px] font-mono-nums text-amber-300 shrink-0">
                        {locked ? `Lv.${d.unlockLevel}` : `${d.price}${isAr ? 'ج' : 'EGP'}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ingredients Assembly */}
          <div className="p-3.5 rounded-xl bg-[#27180d] border border-amber-700/35">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="text-xs font-bold text-amber-300">
                {isAr ? '3. حط المكونات في الكوباية' : '3. Measure Ingredients'}
              </div>
              <button
                type="button"
                onClick={handleAutoFillRecipe}
                className="min-h-[36px] px-3 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-200 text-xs font-bold cursor-pointer"
              >
                {isAr ? 'تجهيز المقادير بالظبط' : 'Measure Exact Recipe'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ingList.map((ing) => {
                const needed = recipe.ingredients[ing] ?? 1;
                const added = addedIngredients[ing] ?? 0;
                const stock = gameState.inventory[ing] ?? 0;
                const meta = INGREDIENTS[ing];
                const done = added === needed;
                return (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => handleAddIngredient(ing)}
                    className={`p-2 rounded-lg border text-start cursor-pointer transition-colors ${
                      done
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
                        : stock < needed
                          ? 'bg-red-950/50 border-red-500/60 text-red-100'
                          : 'bg-[#1b110a] border-amber-800/40 text-amber-100 hover:bg-[#2f1d11]'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">
                      {isAr ? meta.nameAr : meta.nameEn}
                    </div>
                    <div className="flex items-center justify-between text-[11px] mt-1 font-mono-nums">
                      <span>
                        {added}/{needed}
                      </span>
                      <span className="text-amber-300/75">
                        {isAr ? `مخزن: ${stock}` : `Stock: ${stock}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {!stockCheck.ok && (
              <div className="mt-3 flex items-center justify-between gap-2 p-2.5 rounded-lg bg-red-950/60 border border-red-500/50 text-xs text-red-100">
                <span>
                  {isAr
                    ? `ناقص خامات في المخزن (${stockCheck.missing.map((m) => INGREDIENTS[m].nameAr).join('، ')})`
                    : `Missing stock (${stockCheck.missing.map((m) => INGREDIENTS[m].nameEn).join(', ')})`}
                </span>
                <button
                  type="button"
                  onClick={onOpenInventory}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shrink-0 cursor-pointer"
                >
                  {isAr ? 'شراء خامات' : 'Buy Stock'}
                </button>
              </div>
            )}
          </div>

          {/* Rich brewing station preview and interactive heat / pour timing */}
          <div className="overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#382315] via-[#24160e] to-[#160d08] shadow-inner">
            <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 px-4 py-3">
              <div>
                <div className="flex items-center gap-2 text-amber-200">
                  <Flame className="h-4 w-4" />
                  <span className="text-xs font-black">{isAr ? 'محطة التحضير البلدي' : 'BALADI BREWING STATION'}</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-100/60">
                  {isAr ? 'راقب الغليان والرغوة واختار لحظة الصب' : 'Watch the simmer and foam, then time your pour'}
                </p>
              </div>
              <div className="rounded-xl border border-amber-300/25 bg-black/25 px-3 py-1.5 text-center">
                <div className="text-[9px] font-bold text-amber-200/60">{isAr ? 'مستوى التحضير' : 'BREW LEVEL'}</div>
                <div className="text-lg font-black tabular-nums text-amber-100">{brewMeter}%</div>
              </div>
            </div>

            <div className="relative flex min-h-[156px] items-end justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_100%,rgba(217,119,6,.24),transparent_58%)] px-5 pb-4 pt-3">
              <div className={`absolute bottom-5 h-3 w-36 rounded-full bg-orange-500/20 blur-xl transition-opacity ${isBrewing ? 'opacity-100' : 'opacity-30'}`} />
              <div className="absolute bottom-6 flex gap-5">
                {[0,1,2].map((n) => (
                  <span key={n} className={`h-8 w-2 rounded-full bg-amber-100/50 blur-[2px] ${isBrewing ? 'animate-pulse' : 'opacity-20'}`} />
                ))}
              </div>
              <div className="relative z-10 flex h-28 w-24 flex-col items-center justify-end">
                <div className="absolute -top-5 flex gap-2">
                  <span className={`h-7 w-3 rounded-full border border-white/30 bg-white/20 blur-[1px] ${isBrewing ? 'animate-bounce' : 'opacity-25'}`} />
                  <span className={`mt-2 h-6 w-3 rounded-full border border-white/30 bg-white/20 blur-[1px] ${isBrewing ? 'animate-pulse' : 'opacity-20'}`} />
                  <span className={`h-7 w-3 rounded-full border border-white/30 bg-white/20 blur-[1px] ${isBrewing ? 'animate-bounce' : 'opacity-25'}`} />
                </div>
                <div className="relative h-20 w-16 overflow-hidden rounded-b-2xl rounded-t-md border-2 border-white/55 bg-white/10 shadow-[0_8px_28px_rgba(0,0,0,.35)]">
                  <div className="absolute inset-x-1 top-1 h-1 rounded-full bg-white/50" />
                  <div
                    className="absolute inset-x-0 bottom-0 transition-all duration-100"
                    style={{
                      height: `${Math.max(8, brewMeter)}%`,
                      background: `linear-gradient(180deg, rgba(245,208,120,.95) 0%, ${recipe.liquidColor} 28%, #4a2412 100%)`,
                    }}
                  />
                  <div className="absolute inset-x-2 top-3 h-px bg-white/35" />
                  <div className="absolute bottom-2 left-2 right-2 h-1 rounded-full bg-amber-100/45 blur-[1px]" />
                </div>
                <div className="h-2 w-20 rounded-full bg-gradient-to-b from-amber-200 to-amber-700 shadow-md" />
                <div className="absolute bottom-0 -z-10 h-4 w-28 rounded-full bg-black/35 blur-md" />
              </div>
              <div className="absolute bottom-5 left-4 flex items-center gap-1 text-[10px] font-bold text-amber-100/70">
                <Droplets className="h-3 w-3" />
                {isAr ? 'صب مضبوط' : 'CONTROLLED POUR'}
              </div>
              <div className="absolute bottom-5 right-4 flex items-center gap-1 text-[10px] font-bold text-amber-100/70">
                <Coffee className="h-3 w-3" />
                {isAr ? 'رغوة طازة' : 'FRESH FOAM'}
              </div>
            </div>

            <div className="px-4 pb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">
                  {isAr
                    ? '4. الغلي والصب (المنطقة الذهبية 70–88%)'
                    : '4. Brew & Pour (golden zone 70–88%)'}
                </span>
                <span className="text-xs font-mono-nums font-bold text-amber-100">{brewMeter}%</span>
              </div>
              <div className="relative mb-3 h-7 overflow-hidden rounded-full border border-amber-800/50 bg-[#130b06]">
                <div className="absolute bottom-0 top-0 border-x border-amber-200/80 bg-amber-300/30" style={{ left: '70%', width: '18%' }} />
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-700 via-amber-500 to-yellow-200 shadow-[0_0_14px_rgba(245,158,11,.4)]"
                  style={{ width: `${brewMeter}%` }}
                />
                <div className="absolute inset-y-0 left-[78%] w-0.5 bg-white/80 shadow-[0_0_8px_white]" />
              </div>

            {lastQuality !== null && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-400/40 bg-emerald-950/45 px-3 py-2 text-emerald-100">
                <span className="flex items-center gap-2 text-xs font-bold"><Sparkles className="h-4 w-4" />{isAr ? 'نتيجة جودة التحضير' : 'BREW QUALITY'}</span>
                <span className="text-lg font-black tabular-nums">{lastQuality}%</span>
              </div>
            )}
            {statusError && (
              <div className="mb-2.5 text-xs font-bold text-red-300">{statusError}</div>
            )}

            <div className="flex gap-2">
              {!isBrewing && brewMeter === 0 ? (
                <button
                  type="button"
                  onClick={startBrewing}
                  className="flex-1 min-h-[46px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c1008] font-bold text-sm cursor-pointer"
                >
                  {isAr ? 'ابدأ الغلي والصب' : 'Start Pour & Brew'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishBrewing}
                  className="flex-1 min-h-[46px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#052e16] font-bold text-sm cursor-pointer"
                >
                  {isAr ? 'شيل من ع النار وحط ع الصينية!' : 'Serve onto Tray Now!'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
  );
};

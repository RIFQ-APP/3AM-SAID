import React from 'react';
import { DRINKS, INGREDIENTS, UPGRADES } from '../game/catalog';
import {
  AudioSettings,
  GameState,
  GraphicsPreset,
  IngredientId,
  MissionCategory,
  Order,
  UpgradeId,
} from '../game/types';

export type ManagementTab =
  | 'orders'
  | 'inventory'
  | 'employees'
  | 'upgrades'
  | 'missions'
  | 'stats'
  | 'settings';

interface ManagementDrawersProps {
  activeTab: ManagementTab;
  gameState: GameState;
  orders: Order[];
  feedbackToast: string | null;
  onSelectTab: (tab: ManagementTab) => void;
  onClose: () => void;
  onAcceptOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onOpenPrepForOrder: () => void;
  onBuyIngredient: (id: IngredientId) => void;
  onHireEmployee: (empId: string) => void;
  onToggleEmployeeAssign: (empId: string) => void;
  onUpgradeEmployee: (empId: string) => void;
  onDismissEmployee: (empId: string) => void;
  onBuyUpgrade: (id: UpgradeId) => void;
  onClaimMission: (id: string) => void;
  onEndDay: () => void;
  onUpdateSettings: (patch: {
    language?: 'ar' | 'en';
    graphics?: GraphicsPreset;
    cameraSensitivity?: number;
    audio?: Partial<AudioSettings>;
  }) => void;
  onManualSave: () => void;
  onResetSave: () => void;
}

export const ManagementDrawers: React.FC<ManagementDrawersProps> = ({
  activeTab,
  gameState,
  orders,
  feedbackToast,
  onSelectTab,
  onClose,
  onAcceptOrder,
  onCancelOrder,
  onOpenPrepForOrder,
  onBuyIngredient,
  onHireEmployee,
  onToggleEmployeeAssign,
  onUpgradeEmployee,
  onDismissEmployee,
  onBuyUpgrade,
  onClaimMission,
  onEndDay,
  onUpdateSettings,
  onManualSave,
  onResetSave,
}) => {
  const isAr = gameState.settings.language === 'ar';
  const [missionCat, setMissionCat] = React.useState<MissionCategory>('main');

  const tabs: Array<{ id: ManagementTab; labelAr: string; labelEn: string }> = [
    { id: 'orders', labelAr: 'الطلبات', labelEn: 'Orders' },
    { id: 'inventory', labelAr: 'المخزن', labelEn: 'Inventory' },
    { id: 'employees', labelAr: 'العمال', labelEn: 'Employees' },
    { id: 'upgrades', labelAr: 'التطوير', labelEn: 'Upgrades' },
    { id: 'missions', labelAr: 'المهام', labelEn: 'Missions' },
    { id: 'stats', labelAr: 'الخزنة', labelEn: 'Economy' },
    { id: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings' },
  ];

  const netProfit =
    gameState.economy.dailyRevenue - gameState.economy.dailyExpenses;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'إدارة القهوة' : 'Coffeehouse Management'}
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-amber-500/45 bg-[#1d120a] text-amber-50 shadow-2xl overflow-hidden">
        {/* Header + Tabs */}
        <div className="bg-[#29190e] border-b border-amber-700/35 px-4 pt-3 pb-2">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-3">
              <h2 className="font-display-arabic text-xl sm:text-2xl font-bold text-amber-200">
                {isAr ? 'دفتر إدارة القهوة' : 'Coffeehouse Ledger'}
              </h2>
              <span className="text-sm font-mono-nums font-bold text-emerald-400">
                {gameState.economy.balance} {isAr ? 'جنيه' : 'EGP'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={isAr ? 'إغلاق القائمة' : 'Close Menu'}
              className="min-h-[44px] min-w-[44px] px-3 rounded-lg bg-[#3c2516] hover:bg-[#4e301d] text-amber-100 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {tabs.map((t) => {
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTab(t.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? 'bg-amber-500 text-[#1c1008]'
                      : 'bg-[#20130a] text-amber-200/80 hover:bg-[#352113]'
                  }`}
                >
                  {isAr ? t.labelAr : t.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {feedbackToast && (
          <div className="px-4 py-2 bg-amber-900/60 border-b border-amber-500/40 text-xs font-bold text-amber-100">
            {feedbackToast}
          </div>
        )}

        {/* Body */}
        <div className="cafe-scroll overflow-y-auto p-4 space-y-3 flex-1">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-200/80">
                  {isAr
                    ? `الطلبات النشطة (${orders.length})`
                    : `Active Orders (${orders.length})`}
                </span>
                <button
                  type="button"
                  onClick={onOpenPrepForOrder}
                  className="min-h-[40px] px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#1c1008] text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'فتح النصبة للتحضير' : 'Open Drink Counter'}
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#27180d] border border-amber-800/30 text-sm text-amber-200/75">
                  {isAr
                    ? 'مفيش طلبات دلوقتي.. الزباين بيدخلوا ويطلبوا أول ما يقعدوا.'
                    : 'No active orders right now. Customers will order once seated.'}
                </div>
              ) : (
                orders.map((ord) => {
                  const drink = DRINKS[ord.drinkId];
                  return (
                    <div
                      key={ord.id}
                      className="p-3 rounded-xl bg-[#28190e] border border-amber-700/35 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-bold text-amber-100">
                          {isAr ? drink.nameAr : drink.nameEn} ·{' '}
                          <span className="text-emerald-400 font-mono-nums">
                            {ord.price} {isAr ? 'ج' : 'EGP'}
                          </span>
                        </div>
                        <div className="text-xs text-amber-200/75 mt-0.5">
                          {isAr ? ord.customerNameAr : ord.customerNameEn} ·{' '}
                          {isAr ? `ترابيزة ${ord.tableId}` : `Table ${ord.tableId}`} ·{' '}
                          <span className="text-amber-300 font-semibold">
                            {ord.status === 'new'
                              ? isAr
                                ? 'طلب جديد'
                                : 'New'
                              : ord.status === 'accepted'
                                ? isAr
                                  ? 'تم القبول'
                                  : 'Accepted'
                                : ord.status === 'ready'
                                  ? isAr
                                    ? 'جاهز للتقديم'
                                    : 'Ready'
                                  : isAr
                                    ? 'قيد التجهيز'
                                    : 'Preparing'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ord.status === 'new' && (
                          <button
                            type="button"
                            onClick={() => onAcceptOrder(ord.id)}
                            className="min-h-[38px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                          >
                            {isAr ? 'استلام الطلب' : 'Accept'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onCancelOrder(ord.id)}
                          className="min-h-[38px] px-3 rounded-lg bg-red-900/70 hover:bg-red-800 text-red-100 text-xs font-bold cursor-pointer"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-amber-200/80">
                <span>
                  {isAr
                    ? `سعة المخزن القصوى: ${gameState.storageCapacity} لكل صنف`
                    : `Max Storage Capacity: ${gameState.storageCapacity} per item`}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(INGREDIENTS) as IngredientId[]).map((id) => {
                  const meta = INGREDIENTS[id];
                  const qty = gameState.inventory[id];
                  const low = qty <= 5;
                  const full = qty >= gameState.storageCapacity;
                  return (
                    <div
                      key={id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                        low
                          ? 'bg-red-950/40 border-red-500/50'
                          : 'bg-[#28190e] border-amber-700/35'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-amber-100">
                          {isAr ? meta.nameAr : meta.nameEn}
                        </div>
                        <div className="text-xs font-mono-nums mt-0.5 text-amber-200/80">
                          {qty} / {gameState.storageCapacity}{' '}
                          {isAr ? meta.unitAr : meta.unitEn}
                          {low && (
                            <span className="text-red-300 font-bold ms-2">
                              {isAr ? '· مخزون منخفض!' : '· Low!'}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={full || gameState.economy.balance < meta.packPrice}
                        onClick={() => onBuyIngredient(id)}
                        className="min-h-[40px] px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-amber-900/40 disabled:text-amber-500/50 text-[#1c1008] text-xs font-bold shrink-0 cursor-pointer"
                      >
                        +{meta.packQty} ({meta.packPrice}
                        {isAr ? 'ج' : 'EGP'})
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EMPLOYEES TAB */}
          {activeTab === 'employees' && (
            <div className="space-y-2.5">
              {gameState.employees.map((emp) => {
                const upgradeCost = 120 + emp.level * 80;
                const hireCost = emp.salaryPerDay * 2;
                return (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-xl bg-[#28190e] border border-amber-700/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-amber-100">
                        {isAr ? emp.nameAr : emp.nameEn}
                      </div>
                      <div className="text-xs text-amber-200/75 mt-0.5">
                        {isAr
                          ? `المستوى ${emp.level} · السرعة ${emp.speed.toFixed(2)}x · اليومية ${emp.salaryPerDay}ج`
                          : `Lv.${emp.level} · Speed ${emp.speed.toFixed(2)}x · ${emp.salaryPerDay} EGP/day`}
                      </div>
                      <div className="text-xs text-amber-300 mt-1">
                        {emp.hired
                          ? isAr
                            ? emp.assigned
                              ? `يعمل: ${emp.currentTaskAr}`
                              : 'في استراحة حالياً'
                            : isAr
                              ? 'متاح للتعيين'
                              : 'Available for hire'
                          : isAr
                            ? 'متاح للتعيين'
                            : 'Available for hire'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!emp.hired ? (
                        <button
                          type="button"
                          disabled={gameState.economy.balance < hireCost}
                          onClick={() => onHireEmployee(emp.id)}
                          className="min-h-[40px] px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950/50 disabled:text-emerald-600 text-[#052e16] text-xs font-bold cursor-pointer"
                        >
                          {isAr ? `تعيين (${hireCost}ج)` : `Hire (${hireCost} EGP)`}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onToggleEmployeeAssign(emp.id)}
                            className={`min-h-[38px] px-3 rounded-lg text-xs font-bold cursor-pointer ${
                              emp.assigned
                                ? 'bg-amber-600 text-white'
                                : 'bg-[#3c2516] text-amber-200'
                            }`}
                          >
                            {emp.assigned
                              ? isAr
                                ? 'إيقاف مؤقت'
                                : 'Rest'
                              : isAr
                                ? 'تفعيل'
                                : 'Assign'}
                          </button>
                          <button
                            type="button"
                            disabled={gameState.economy.balance < upgradeCost}
                            onClick={() => onUpgradeEmployee(emp.id)}
                            className="min-h-[38px] px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-amber-950/50 disabled:text-amber-600 text-[#1c1008] text-xs font-bold cursor-pointer"
                          >
                            {isAr ? `تدريب (${upgradeCost}ج)` : `Train (${upgradeCost} EGP)`}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDismissEmployee(emp.id)}
                            className="min-h-[38px] px-3 rounded-lg bg-red-900/70 hover:bg-red-800 text-red-100 text-xs font-bold cursor-pointer"
                          >
                            {isAr ? 'تسريح' : 'Dismiss'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* UPGRADES TAB */}
          {activeTab === 'upgrades' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {UPGRADES.map((u) => {
                const owned = gameState.upgrades[u.id];
                const locked = gameState.level < u.unlockLevel;
                return (
                  <div
                    key={u.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                      owned
                        ? 'bg-emerald-950/35 border-emerald-500/45'
                        : 'bg-[#28190e] border-amber-700/35'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-amber-100">
                          {isAr ? u.nameAr : u.nameEn}
                        </span>
                        <span className="text-xs font-mono-nums text-amber-300">
                          +{u.reputationBonus}% {isAr ? 'سمعة' : 'Rep'}
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/75 mt-1 leading-relaxed">
                        {isAr ? u.descriptionAr : u.descriptionEn}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={owned || locked || gameState.economy.balance < u.price}
                      onClick={() => onBuyUpgrade(u.id)}
                      className={`min-h-[40px] w-full rounded-lg text-xs font-bold cursor-pointer ${
                        owned
                          ? 'bg-emerald-800/50 text-emerald-200 cursor-default'
                          : locked
                            ? 'bg-[#190f08] text-amber-600 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-400 disabled:bg-amber-950/50 disabled:text-amber-600 text-[#1c1008]'
                      }`}
                    >
                      {owned
                        ? isAr
                          ? 'تم التركيب في القهوة ✓'
                          : 'Installed in 3D Cafe ✓'
                        : locked
                          ? isAr
                            ? `يفتح في مستوى ${u.unlockLevel}`
                            : `Unlocks at Lv.${u.unlockLevel}`
                          : isAr
                            ? `شراء وتركيب (${u.price} جنيه)`
                            : `Buy & Install (${u.price} EGP)`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* MISSIONS & ACHIEVEMENTS TAB */}
          {activeTab === 'missions' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {(
                  [
                    ['main', isAr ? 'أساسية' : 'Main'],
                    ['daily', isAr ? 'يومية' : 'Daily'],
                    ['achievement', isAr ? 'إنجازات' : 'Achievements'],
                  ] as Array<[MissionCategory, string]>
                ).map(([cat, label]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMissionCat(cat)}
                    className={`min-h-[38px] px-4 rounded-lg text-xs font-bold cursor-pointer ${
                      missionCat === cat
                        ? 'bg-amber-500 text-[#1c1008]'
                        : 'bg-[#28190e] text-amber-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {gameState.missions
                .filter((m) => m.category === missionCat)
                .map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-[#28190e] border border-amber-700/35 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-bold text-amber-100">
                        {isAr ? m.titleAr : m.titleEn}
                      </div>
                      <div className="text-xs text-amber-200/75 mt-0.5">
                        {isAr ? m.descriptionAr : m.descriptionEn}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-2 rounded-full bg-[#140c06] overflow-hidden">
                          <div
                            className="h-full bg-amber-400"
                            style={{
                              width: `${Math.min(100, (m.progress / m.target) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono-nums text-amber-200">
                          {m.progress}/{m.target}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!m.completed || m.claimed}
                      onClick={() => onClaimMission(m.id)}
                      className={`min-h-[40px] px-3.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer ${
                        m.claimed
                          ? 'bg-emerald-950/60 text-emerald-300'
                          : m.completed
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-[#052e16]'
                            : 'bg-[#1a1009] text-amber-500/60'
                      }`}
                    >
                      {m.claimed
                        ? isAr
                          ? 'تم الاستلام ✓'
                          : 'Claimed ✓'
                        : `+${m.rewardEgp}${isAr ? 'ج' : 'EGP'}`}
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* ECONOMY / STATS TAB */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-[#28190e] border border-amber-700/35">
                  <div className="text-[11px] text-amber-300/75">
                    {isAr ? 'الرصيد الحالي' : 'Cash Balance'}
                  </div>
                  <div className="text-lg font-mono-nums font-bold text-emerald-400">
                    {gameState.economy.balance} {isAr ? 'ج' : 'EGP'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#28190e] border border-amber-700/35">
                  <div className="text-[11px] text-amber-300/75">
                    {isAr ? 'دخل اليوم' : 'Daily Revenue'}
                  </div>
                  <div className="text-lg font-mono-nums font-bold text-amber-200">
                    +{gameState.economy.dailyRevenue} {isAr ? 'ج' : 'EGP'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#28190e] border border-amber-700/35">
                  <div className="text-[11px] text-amber-300/75">
                    {isAr ? 'مصروفات اليوم' : 'Daily Expenses'}
                  </div>
                  <div className="text-lg font-mono-nums font-bold text-red-300">
                    -{gameState.economy.dailyExpenses} {isAr ? 'ج' : 'EGP'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#28190e] border border-amber-700/35">
                  <div className="text-[11px] text-amber-300/75">
                    {isAr ? 'صافي الربح' : 'Net Profit'}
                  </div>
                  <div
                    className={`text-lg font-mono-nums font-bold ${
                      netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {netProfit >= 0 ? `+${netProfit}` : netProfit} {isAr ? 'ج' : 'EGP'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#28190e] border border-amber-700/35">
                <div className="text-xs text-amber-200/85">
                  {isAr
                    ? `البقشيش اليوم: ${gameState.economy.dailyTips}ج · طلبات مكتملة: ${gameState.stats.ordersCompleted}`
                    : `Today Tips: ${gameState.economy.dailyTips} EGP · Orders Done: ${gameState.stats.ordersCompleted}`}
                </div>
                <button
                  type="button"
                  onClick={onEndDay}
                  className="min-h-[38px] px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#1c1008] text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'تقفيل اليوم وصرف الرواتب' : 'Close Day & Pay Staff'}
                </button>
              </div>

              <div>
                <div className="text-xs font-bold text-amber-300 mb-2">
                  {isAr ? 'سجل المبيعات الأخير' : 'Recent Sales History'}
                </div>
                {gameState.economy.salesHistory.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#24160c] text-xs text-amber-200/70">
                    {isAr ? 'لا توجد مبيعات مسجلة بعد.' : 'No recorded sales yet.'}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {gameState.economy.salesHistory.slice(0, 12).map((s) => (
                      <div
                        key={s.id}
                        className="px-3 py-2 rounded-lg bg-[#24160c] border border-amber-800/30 flex items-center justify-between text-xs"
                      >
                        <span>
                          {isAr ? DRINKS[s.drinkId].nameAr : DRINKS[s.drinkId].nameEn} —{' '}
                          {s.customerNameAr}
                        </span>
                        <span className="font-mono-nums text-emerald-300 font-bold">
                          +{s.amount}
                          {s.tip > 0 ? ` (+${s.tip} ${isAr ? 'بقشيش' : 'tip'})` : ''}{' '}
                          {isAr ? 'ج' : 'EGP'} · {s.quality}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Language & Graphics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#28190e] border border-amber-700/35">
                  <div className="text-xs font-bold text-amber-300 mb-2">
                    {isAr ? 'لغة الواجهة' : 'Interface Language'}
                  </div>
                  <div className="flex gap-2">
                    {(['ar', 'en'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => onUpdateSettings({ language: lang })}
                        className={`flex-1 min-h-[40px] rounded-lg text-xs font-bold cursor-pointer ${
                          gameState.settings.language === lang
                            ? 'bg-amber-500 text-[#1c1008]'
                            : 'bg-[#1a1009] text-amber-200'
                        }`}
                      >
                        {lang === 'ar' ? 'العربية (مصري)' : 'English'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#28190e] border border-amber-700/35">
                  <div className="text-xs font-bold text-amber-300 mb-2">
                    {isAr ? 'جودة الرسوميات' : 'Graphics Quality'}
                  </div>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as GraphicsPreset[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => onUpdateSettings({ graphics: g })}
                        className={`flex-1 min-h-[40px] rounded-lg text-xs font-bold cursor-pointer ${
                          gameState.settings.graphics === g
                            ? 'bg-amber-500 text-[#1c1008]'
                            : 'bg-[#1a1009] text-amber-200'
                        }`}
                      >
                        {g === 'low'
                          ? isAr
                            ? 'منخفضة'
                            : 'Low'
                          : g === 'medium'
                            ? isAr
                              ? 'متوسطة'
                              : 'Medium'
                            : isAr
                              ? 'عالية'
                              : 'High'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Camera & Audio Sliders */}
              <div className="p-3.5 rounded-xl bg-[#28190e] border border-amber-700/35 space-y-3">
                <label className="block">
                  <div className="flex justify-between text-xs font-bold text-amber-200 mb-1">
                    <span>{isAr ? 'حساسية الكاميرا' : 'Camera Sensitivity'}</span>
                    <span className="font-mono-nums">
                      {gameState.settings.cameraSensitivity.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="2.0"
                    step="0.1"
                    value={gameState.settings.cameraSensitivity}
                    onChange={(e) =>
                      onUpdateSettings({
                        cameraSensitivity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500"
                  />
                </label>

                {(
                  [
                    ['music', isAr ? 'صوت الموسيقى (عود)' : 'Music Volume'],
                    ['sfx', isAr ? 'المؤثرات الصوتية' : 'SFX Volume'],
                    ['voices', isAr ? 'أصوات الشخصيات' : 'Character Voices'],
                    ['ambience', isAr ? 'ضوضاء القهوة المحيطة' : 'Ambience Volume'],
                  ] as Array<[keyof Omit<AudioSettings, 'muted'>, string]>
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <div className="flex justify-between text-xs font-bold text-amber-200 mb-1">
                      <span>{label}</span>
                      <span className="font-mono-nums">
                        {Math.round(gameState.settings.audio[key] * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={gameState.settings.audio[key]}
                      onChange={(e) =>
                        onUpdateSettings({
                          audio: { [key]: parseFloat(e.target.value) },
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </label>
                ))}
              </div>

              {/* Save / Reset */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onManualSave}
                  className="flex-1 min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'حفظ التقدم يدوياً' : 'Save Progress Now'}
                </button>
                <button
                  type="button"
                  onClick={onResetSave}
                  className="min-h-[44px] px-4 rounded-xl bg-red-900/80 hover:bg-red-800 text-red-100 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'مسح الحفظ والبدء من جديد' : 'Reset Saved Game'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

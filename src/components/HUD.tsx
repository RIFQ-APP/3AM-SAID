import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  Coins,
  Star,
  CalendarDays,
  Gamepad2,
  Footprints,
  Camera,
  ZoomIn,
  ZoomOut,
  Coffee,
  CupSoda,
  Dices,
  Flame,
  Hand,
  Menu,
  X,
  Package,
  Pause,
  RotateCcw,
  Settings,
  Sparkles,
  Trophy,
  Tv,
  Users,
  Video,
  Volume2,
  VolumeX,
  Wallet,
  MonitorCog,
} from 'lucide-react';
import { DRINKS, UPGRADES } from '../game/catalog';
import { getTimeOfDayInfo } from '../game/economy';
import {
  CameraMode,
  GraphicsPreset,
  CarriedDrink,
  CustomerActivity,
  DrinkId,
  GameState,
  IngredientId,
  InteractionPrompt,
  Order,
} from '../game/types';
import { ProjectedBubble } from '../three/CoffeehouseEngine';
import { ManagementTab } from './ManagementDrawers';

interface HUDProps {
  gameState: GameState;
  orders: Order[];
  bubbles: ProjectedBubble[];
  prompt: InteractionPrompt | null;
  carriedDrink: CarriedDrink | null;
  cameraMode: CameraMode;
  toastMessage: string | null;
  onJoystickMove: (x: number, y: number) => void;
  onCameraDrag: (dx: number, dy: number) => void;
  onCameraZoom: (delta: number) => void;
  onToggleRun: (running: boolean) => void;
  onCycleCamera: () => void;
  onResetCamera: () => void;
  onInteract: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenTab: (tab: ManagementTab) => void;
  onOpenPrep: () => void;
  graphicsPreset: GraphicsPreset;
  onChangeGraphics: (preset: GraphicsPreset) => void;
}

function renderDrinkOverheadIcon(drinkId: DrinkId | null) {
  if (!drinkId) return <Coffee className="w-4 h-4 shrink-0" />;
  const cupType = DRINKS[drinkId].cupType;
  if (cupType === 'glass') return <CupSoda className="w-4 h-4 shrink-0" />;
  return <Coffee className="w-4 h-4 shrink-0" />;
}

function renderActivityBadge(activity: CustomerActivity, isComplaining: boolean) {
  if (isComplaining) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white border border-red-200 shadow">
        <AlertTriangle className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (activity === 'shisha') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-900/95 text-amber-300 border border-amber-400/70 shadow">
        <Flame className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (activity === 'tawla') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-900/95 text-amber-200 border border-amber-400/70 shadow">
        <Dices className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (activity === 'watching_tv') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-900/95 text-sky-200 border border-sky-400/70 shadow">
        <Tv className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (activity === 'ahly_zamalek_argument') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-900/95 text-rose-200 border border-rose-400/70 shadow">
        <Users className="w-3.5 h-3.5" />
      </span>
    );
  }
  return null;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  orders,
  bubbles,
  prompt,
  carriedDrink,
  cameraMode,
  toastMessage,
  onJoystickMove,
  onCameraDrag,
  onCameraZoom,
  onToggleRun,
  onCycleCamera,
  onResetCamera,
  onInteract,
  onToggleMute,
  onPause,
  onOpenTab,
  onOpenPrep,
  graphicsPreset,
  onChangeGraphics,
}) => {
  const isAr = gameState.settings.language === 'ar';
  const timeInfo = getTimeOfDayInfo(gameState.clockMinutes);

  const [running, setRunning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joyPointerId = useRef<number | null>(null);
  const joyCenter = useRef({ x: 0, y: 0 });

  const lookPointerId = useRef<number | null>(null);
  const lastLook = useRef({ x: 0, y: 0 });

  const activeMission =
    gameState.missions.find((m) => !m.claimed && m.completed) ??
    gameState.missions.find((m) => !m.claimed);

  // Live notification badge counts for bottom management dock
  const lowStockCount = (Object.keys(gameState.inventory) as IngredientId[]).filter(
    (k) => gameState.inventory[k] <= 6
  ).length;
  const claimableMissionsCount = gameState.missions.filter(
    (m) => !m.claimed && m.completed
  ).length;
  const affordableUpgradesCount = Object.values(UPGRADES).filter(
    (u) => !gameState.upgrades[u.id] && gameState.economy.balance >= u.price
  ).length;
  const unhiredStaffCount = gameState.employees.filter((e) => !e.hired).length;

  const camLabel =
    cameraMode === 'third_person'
      ? isAr
        ? 'منظور ثالث'
        : '3rd Person'
      : cameraMode === 'first_person'
        ? isAr
          ? 'منظور أول'
          : '1st Person'
        : isAr
          ? 'كاميرا حرة'
          : 'Free Look';

  const handleJoyDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    joyPointerId.current = e.pointerId;
    joyCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateJoy(e.clientX, e.clientY);
  };

  const updateJoy = (cx: number, cy: number) => {
    const maxR = 40;
    const dx = cx - joyCenter.current.x;
    const dy = cy - joyCenter.current.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(maxR, dist);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;
    setJoyKnob({ x: kx, y: ky });
    onJoystickMove(kx / maxR, ky / maxR);
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    updateJoy(e.clientX, e.clientY);
  };

  const handleJoyUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    joyPointerId.current = null;
    setJoyKnob({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  const handleLookDown = (e: React.PointerEvent<HTMLDivElement>) => {
    lookPointerId.current = e.pointerId;
    lastLook.current = { x: e.clientX, y: e.clientY };
  };

  const handleLookMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== e.pointerId) return;
    const dx = e.clientX - lastLook.current.x;
    const dy = e.clientY - lastLook.current.y;
    lastLook.current = { x: e.clientX, y: e.clientY };
    onCameraDrag(dx, dy);
  };

  const handleLookUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current === e.pointerId) {
      lookPointerId.current = null;
    }
  };

  const menuTabs: Array<{
    id: ManagementTab;
    labelAr: string;
    labelEn: string;
    icon: React.ReactNode;
    badge: number;
  }> = [
    {
      id: 'orders',
      labelAr: 'الطلبات',
      labelEn: 'Orders',
      icon: <ClipboardList className="w-5 h-5" />,
      badge: orders.length,
    },
    {
      id: 'inventory',
      labelAr: 'المخزن',
      labelEn: 'Stock',
      icon: <Package className="w-5 h-5" />,
      badge: lowStockCount,
    },
    {
      id: 'employees',
      labelAr: 'العمال',
      labelEn: 'Staff',
      icon: <Users className="w-5 h-5" />,
      badge: unhiredStaffCount,
    },
    {
      id: 'upgrades',
      labelAr: 'التطوير',
      labelEn: 'Upgrades',
      icon: <Sparkles className="w-5 h-5" />,
      badge: affordableUpgradesCount,
    },
    {
      id: 'missions',
      labelAr: 'المهام',
      labelEn: 'Missions',
      icon: <Trophy className="w-5 h-5" />,
      badge: claimableMissionsCount,
    },
    {
      id: 'stats',
      labelAr: 'الخزنة',
      labelEn: 'Stats',
      icon: <Wallet className="w-5 h-5" />,
      badge: 0,
    },
    {
      id: 'settings',
      labelAr: 'ضبط',
      labelEn: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      badge: 0,
    },
  ];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-20 pointer-events-none select-none overflow-hidden"
    >
      {/* Full-viewport Camera Drag Surface (sits behind interactive HUD controls) */}
      <div
        className="absolute inset-0 pointer-events-auto touch-none"
        onPointerDown={handleLookDown}
        onPointerMove={handleLookMove}
        onPointerUp={handleLookUp}
        onPointerCancel={handleLookUp}
        onWheel={(e) => onCameraZoom(e.deltaY * 0.004)}
        aria-hidden="true"
      />

      {/* Floating 3D-Projected Overhead Customer Icons & Speech Bubbles */}
      {bubbles.map((b) => {
        const drink = b.orderDrinkId ? DRINKS[b.orderDrinkId] : null;
        const isWaitingOrAngry = b.state === 'waiting' || b.state === 'complaining';
        const isAngry = b.state === 'complaining' || b.patiencePct < 30;
        const activityBadge = renderActivityBadge(b.activity, isAngry);

        return (
          <div
            key={b.id}
            dir="rtl"
            style={{
              left: `${b.x}px`,
              top: `${b.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="absolute z-10 max-w-[220px] pointer-events-none flex flex-col items-center"
          >
            {/* Visual overhead icon bar (drink glass / shisha / tawla / angry alert) */}
            {(isWaitingOrAngry || activityBadge) && (
              <div className="mb-1 flex items-center gap-1.5">
                {activityBadge}
                {isWaitingOrAngry && drink && (
                  <div
                    className={`px-2 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-md ${
                      isAngry
                        ? 'bg-red-950/95 border-red-400 text-red-100'
                        : 'bg-[#1e120a]/95 border-amber-400/80 text-amber-100'
                    }`}
                  >
                    {renderDrinkOverheadIcon(b.orderDrinkId)}
                    <span className="truncate max-w-[92px]">{drink.nameAr}</span>
                  </div>
                )}
              </div>
            )}

            {b.text && (
              <div className="px-3 py-1.5 rounded-xl bg-[#fff8eb]/95 text-[#231409] border border-amber-700/45 shadow-md text-xs sm:text-sm leading-snug">
                <div className="font-extrabold text-[11px] text-amber-900 mb-0.5">
                  {b.nameAr}
                </div>
                <div className="font-semibold">{b.text}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Top Perimeter Bar — Clean, Enlarged Essential Metrics */}
      <div className="relative z-20 flex flex-wrap items-start justify-between gap-2 p-2.5 sm:p-3.5 pointer-events-none">
        {/* Top-Start Economy & Progression Strip */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-2xl bg-[#1b1109]/95 border border-amber-500/45 text-amber-50 shadow-xl">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-bold">
              <Coins className="h-3.5 w-3.5" />{isAr ? 'الخزنة' : 'CASH'}
            </div>
            <div
              data-testid="hud-balance"
              className="text-lg sm:text-xl font-mono-nums font-extrabold text-emerald-400 leading-tight"
            >
              {gameState.economy.balance} {isAr ? 'ج' : 'EGP'}
            </div>
          </div>

          <div className="h-7 w-px bg-amber-700/40" />

          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-bold">
              <Trophy className="h-3.5 w-3.5" />{isAr ? 'المستوى' : 'LEVEL'}
            </div>
            <div className="text-base sm:text-lg font-mono-nums font-extrabold text-amber-100 leading-tight">
              {gameState.level}
            </div>
          </div>

          <div className="h-7 w-px bg-amber-700/40" />

          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-bold">
              <Star className="h-3.5 w-3.5" />{isAr ? 'السمعة' : 'REP'}
            </div>
            <div className="text-base sm:text-lg font-mono-nums font-extrabold text-amber-300 leading-tight">
              {gameState.reputation}%
            </div>
          </div>

          <div className="hidden sm:block h-7 w-px bg-amber-700/40" />

          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-bold">
              <CalendarDays className="h-3.5 w-3.5" />{isAr ? `يوم ${gameState.day}` : `Day ${gameState.day}`}
            </div>
            <div className="text-sm sm:text-base font-bold text-amber-100 leading-tight">
              {isAr ? timeInfo.labelAr : timeInfo.labelEn}
            </div>
          </div>
        </div>

        {/* Only one essential utility remains visible during play */}
        <button
          type="button"
          onClick={onPause}
          aria-label={isAr ? 'إيقاف مؤقت' : 'Pause Game'}
          className="pointer-events-auto min-h-[46px] min-w-[46px] rounded-xl bg-[#1b1109]/95 hover:bg-[#2d1c10] border border-amber-500/45 text-amber-100 flex items-center justify-center cursor-pointer shadow-lg"
        >
          <Pause className="w-5 h-5" />
        </button>
      </div>

      {/* Enlarged Corner Mission & Active Orders Cards */}
      <div className="relative z-20 flex items-start justify-between gap-2 px-3 sm:px-3.5 pointer-events-none">
        <div className="flex flex-col gap-2 max-w-[260px]">
          {activeMission && (
            <button
              type="button"
              onClick={() => onOpenTab('missions')}
              className={`pointer-events-auto text-start px-3.5 py-2.5 rounded-2xl border shadow-lg cursor-pointer transition-colors ${
                activeMission.completed
                  ? 'bg-emerald-950/95 border-emerald-400/75 text-emerald-50 hover:bg-emerald-900/95'
                  : 'bg-[#1b1109]/92 border-amber-500/45 text-amber-50 hover:bg-[#2a1a0e]'
              }`}
            >
              <div className="text-xs text-amber-300 font-extrabold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {activeMission.completed
                    ? isAr
                      ? 'مهمة جاهزة! استلم الجائزة'
                      : 'Mission Ready!'
                    : isAr
                      ? 'المهمة الحالية'
                      : 'Active Mission'}
                </span>
              </div>
              <div className="text-sm sm:text-base font-bold mt-0.5 leading-snug">
                {isAr ? activeMission.titleAr : activeMission.titleEn}
              </div>
              <div className="text-xs sm:text-sm font-mono-nums font-bold text-amber-300 mt-0.5">
                {activeMission.progress} / {activeMission.target}
              </div>
            </button>
          )}

          {carriedDrink && (
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-950/95 border-2 border-emerald-400/75 text-sm text-emerald-50 font-bold shadow-lg flex items-center gap-2">
              <Coffee className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>
                {isAr
                  ? `معاك: ${DRINKS[carriedDrink.drinkId].nameAr} (ترابيزة ${carriedDrink.tableId})`
                  : `Carrying: ${DRINKS[carriedDrink.drinkId].nameEn} (T${carriedDrink.tableId})`}
              </span>
            </div>
          )}
        </div>

        {/* Enlarged Active Orders Quick Card */}
        {orders.length > 0 && (
          <button
            type="button"
            onClick={() => onOpenTab('orders')}
            className="pointer-events-auto px-3.5 py-2.5 rounded-2xl bg-[#1b1109]/92 hover:bg-[#2b1b10] border border-amber-500/50 text-amber-50 shadow-lg cursor-pointer text-start max-w-[240px]"
          >
            <div className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>{isAr ? `طلبات الزباين: ${orders.length}` : `Orders: ${orders.length}`}</span>
            </div>
            <div className="text-sm sm:text-base font-bold truncate mt-0.5">
              {isAr
                ? `${DRINKS[orders[0].drinkId].nameAr} · ${orders[0].customerNameAr}`
                : `${DRINKS[orders[0].drinkId].nameEn} · ${orders[0].customerNameEn}`}
            </div>
          </button>
        )}
      </div>

      {/* Transient Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-amber-500 text-[#1c1008] font-extrabold text-sm sm:text-base shadow-xl pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Bottom Controls & Management Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-2.5 sm:p-4 flex flex-col gap-2.5 pointer-events-none">
        {/* Thumb Zone: Virtual Joystick + Action / Run / Zoom */}
        <div className="flex items-end justify-between gap-4">
          {/* Left Thumb Virtual Joystick */}
          <div
            onPointerDown={handleJoyDown}
            onPointerMove={handleJoyMove}
            onPointerUp={handleJoyUp}
            onPointerCancel={handleJoyUp}
            aria-label={isAr ? 'عصا التحكم في الحركة' : 'Movement Joystick'}
            className="pointer-events-auto relative w-28 h-28 rounded-full bg-[#1b1109]/80 border-2 border-amber-500/50 flex items-center justify-center touch-none cursor-grab"
          >
            <div
              style={{
                transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`,
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-100 bg-gradient-to-br from-amber-300 to-amber-600 text-[#241306] shadow-lg"
            ><Gamepad2 className="h-6 w-6" /></div>
          </div>

          {/* Right Thumb Actions */}
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const next = !running;
                  setRunning(next);
                  onToggleRun(next);
                }}
                aria-label={isAr ? 'تبديل الجري' : 'Toggle Run'}
                className={`min-h-[44px] px-4 rounded-xl border text-xs sm:text-sm font-bold cursor-pointer ${
                  running
                    ? 'bg-amber-500 text-[#1c1008] border-amber-200'
                    : 'bg-[#1b1109]/92 text-amber-100 border-amber-500/45'
                }`}
              >
                <span className="inline-flex items-center gap-2"><Footprints className="h-4 w-4" />{isAr ? (running ? 'جري ✓' : 'جري') : running ? 'Run ✓' : 'Run'}</span>
              </button>
            </div>

            {prompt ? (
              <button
                key={`${prompt.type}:${prompt.targetId ?? ''}`}
                type="button"
                data-testid="context-interact"
                onClick={onInteract}
                className="animate-prompt-pop min-h-[60px] px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#052e16] font-extrabold text-base sm:text-lg shadow-2xl border-2 border-amber-200 cursor-pointer flex items-center gap-2.5"
              >
                <Hand className="w-5 h-5 shrink-0" />
                <span>{isAr ? prompt.labelAr : prompt.labelEn}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenPrep}
                className="min-h-[52px] px-5 py-2.5 rounded-2xl bg-[#2d1b0e]/95 hover:bg-[#3e2514] text-amber-200 font-bold text-sm sm:text-base border border-amber-500/50 shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Coffee className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{isAr ? 'النصبة (جهّز المشاريب)' : 'Open Drink Prep'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact management launcher: the full menu opens only when requested */}
        <div className="pointer-events-auto relative mx-auto w-full max-w-sm">
          {menuOpen && (
            <div className="absolute bottom-[calc(100%+10px)] inset-x-0 rounded-2xl border border-amber-500/50 bg-[#180f08]/[0.97] p-3 shadow-2xl backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-amber-200">
                  {isAr ? 'إدارة القهوة' : 'Coffeehouse Menu'}
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3a2415] text-amber-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {menuTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenTab(tab.id);
                    }}
                    className="relative flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl border border-amber-800/40 bg-[#2a1a0f] px-2 py-2 text-amber-100 transition-colors hover:bg-[#432a18] active:scale-95"
                  >
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-amber-100 bg-red-600 px-1 text-[10px] font-extrabold text-white">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                    <span className="text-amber-300">{tab.icon}</span>
                    <span className="text-[11px] font-bold">{isAr ? tab.labelAr : tab.labelEn}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2 border-t border-amber-800/50 pt-2">
                <button type="button" onClick={onCycleCamera} className="flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[#2a1a0f] px-2 text-[10px] font-bold text-amber-100">
                  <Camera className="h-4 w-4" />{isAr ? 'كاميرا' : 'Camera'}
                </button>
                <button type="button" onClick={onResetCamera} className="flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[#2a1a0f] px-2 text-[10px] font-bold text-amber-100">
                  <RotateCcw className="h-4 w-4" />{isAr ? 'ضبط' : 'Reset'}
                </button>
                <button type="button" onClick={onToggleMute} className="flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[#2a1a0f] px-2 text-[10px] font-bold text-amber-100">
                  {gameState.settings.audio.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {isAr ? 'الصوت' : 'Sound'}
                </button>
                <div className="flex items-center justify-center rounded-lg bg-[#2a1a0f] text-[10px] font-bold text-amber-200">
                  {camLabel}
                </div>
                <button type="button" onClick={() => onChangeGraphics(graphicsPreset === 'low' ? 'medium' : graphicsPreset === 'medium' ? 'high' : 'low')} className="flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[#2a1a0f] px-1 text-[10px] font-bold text-amber-100" aria-label={isAr ? 'تغيير جودة الرسوم' : 'Change graphics quality'}>
                  <MonitorCog className="h-4 w-4 text-amber-300" />{isAr ? (graphicsPreset === 'low' ? 'خفيفة' : graphicsPreset === 'medium' ? 'متوسطة' : 'عالية') : graphicsPreset.toUpperCase()}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-3">
                <button type="button" onClick={() => onCameraZoom(-0.8)} className="min-h-9 min-w-12 rounded-lg bg-[#2a1a0f] text-lg font-bold text-amber-100"><ZoomIn className="mx-auto h-4 w-4" /></button>
                <span className="text-[10px] text-amber-200/70">{isAr ? 'تقريب / إبعاد الكاميرا' : 'Camera zoom'}</span>
                <button type="button" onClick={() => onCameraZoom(0.8)} className="min-h-9 min-w-12 rounded-lg bg-[#2a1a0f] text-lg font-bold text-amber-100" aria-label={isAr ? 'إبعاد الكاميرا' : 'Zoom out'}><ZoomOut className="mx-auto h-4 w-4" /></button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={isAr ? 'فتح قائمة إدارة القهوة' : 'Open coffeehouse menu'}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/55 bg-[#180f08]/95 px-5 py-2.5 text-sm font-extrabold text-amber-100 shadow-2xl"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="inline-flex items-center gap-2"><Coffee className="h-5 w-5 text-amber-300" />{isAr ? 'قائمة القهوة' : 'Cafe Menu'}</span>
            {menuTabs.some((tab) => tab.badge > 0) && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white">
                {menuTabs.reduce((total, tab) => total + tab.badge, 0) > 9 ? '9+' : menuTabs.reduce((total, tab) => total + tab.badge, 0)}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

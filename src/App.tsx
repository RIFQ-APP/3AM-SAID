import { useCallback, useEffect, useRef, useState } from 'react';
import { DrinkPrepModal } from './components/DrinkPrepModal';
import { EventModal } from './components/EventModal';
import { HUD } from './components/HUD';
import { ManagementDrawers, ManagementTab } from './components/ManagementDrawers';
import { PauseModal } from './components/PauseModal';
import { TitleScreen } from './components/TitleScreen';
import { soundEngine } from './game/audio';
import { DRINKS, INGREDIENTS, UPGRADES } from './game/catalog';
import { createRandomEvent } from './game/dialogue';
import {
  addXpAndCheckLevel,
  buyIngredientPack,
  calculateOrderPayment,
  claimMissionReward,
  consumeIngredientsForDrink,
  getTimeOfDayInfo,
  purchaseUpgrade,
  syncMissions,
} from './game/economy';
import { clearGameSave, loadGameState, saveGameState } from './game/save';
import {
  ActiveRandomEvent,
  AudioSettings,
  CameraMode,
  CarriedDrink,
  CustomerData,
  DrinkId,
  GameScreenState,
  GameState,
  GraphicsPreset,
  IngredientId,
  InteractionPrompt,
  Order,
  RandomEventId,
  UpgradeId,
} from './game/types';
import { CoffeehouseEngine, ProjectedBubble } from './three/CoffeehouseEngine';

const EVENT_POOL: RandomEventId[] = [
  'table_argument',
  'football_match',
  'power_outage',
  'strange_order',
  'forgotten_wallet',
  'master_arrives',
  'missing_ingredients',
  'unexpected_crowds',
];

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CoffeehouseEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>(() => loadGameState());
  const [screenState, setScreenState] = useState<GameScreenState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });
  // Keep the title screen lightweight: create the WebGL world only after the player starts.
  const [engineEnabled, setEngineEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [bubbles, setBubbles] = useState<ProjectedBubble[]>([]);
  const [prompt, setPrompt] = useState<InteractionPrompt | null>(null);
  const [carriedDrink, setCarriedDrink] = useState<CarriedDrink | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('third_person');
  const [prepOpen, setPrepOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ManagementTab | null>(null);
  const [activeEvent, setActiveEvent] = useState<ActiveRandomEvent | null>(null);
  const [powerOutage, setPowerOutage] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [drawerToast, setDrawerToast] = useState<string | null>(null);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const screenRef = useRef(screenState);
  screenRef.current = screenState;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Sync body[data-state] and RTL dir
  useEffect(() => {
    document.body.dataset.state = screenState;
  }, [screenState]);

  useEffect(() => {
    document.documentElement.dir = gameState.settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = gameState.settings.language;
    soundEngine.updateSettings(gameState.settings.audio);
  }, [gameState.settings.language, gameState.settings.audio]);

  // Persist the complete state, including settings, clock, reputation and satisfaction.
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Sync latest React state into 3D Engine without tearing down WebGL
  useEffect(() => {
    engineRef.current?.syncState(gameState, orders, screenState, powerOutage);
  }, [gameState, orders, screenState, powerOutage]);

  const handleOrderDelivered = useCallback(
    (orderId: string, customer: CustomerData, quality: number, tableDirty: boolean) => {
      const targetOrder = ordersRef.current.find((o) => o.id === orderId);
      if (!targetOrder) return;

      const hasCashier = gameStateRef.current.employees.some(
        (e) => e.role === 'cashier' && e.hired && e.assigned
      );
      const payment = calculateOrderPayment({
        order: targetOrder,
        quality,
        patienceLeft: customer.patienceLeft,
        tipMultiplier: customer.personality.tipMultiplier * (hasCashier ? 1.15 : 1),
      });

      soundEngine.playCashRegister();

      setOrders((prev) => prev.filter((o) => o.id !== orderId));

      setGameState((prev) => {
        const leveled = addXpAndCheckLevel(prev.xp, prev.level, payment.xpEarned);
        const isTea = targetOrder.drinkId.includes('tea');
        const isRegular = customer.archetype !== 'regular';
        const timeStr = getTimeOfDayInfo(prev.clockMinutes).formattedTime;

        const next: GameState = {
          ...prev,
          xp: leveled.xp,
          level: leveled.level,
          reputation: Math.max(0, Math.min(100, prev.reputation + payment.reputationDelta)),
          satisfaction: Math.max(
            0,
            Math.min(100, prev.satisfaction + payment.satisfactionDelta)
          ),
          economy: {
            ...prev.economy,
            balance: prev.economy.balance + payment.pricePaid + payment.tip,
            totalEarned: prev.economy.totalEarned + payment.pricePaid + payment.tip,
            dailyRevenue: prev.economy.dailyRevenue + payment.pricePaid + payment.tip,
            dailyTips: prev.economy.dailyTips + payment.tip,
            salesHistory: [
              {
                id: orderId,
                drinkId: targetOrder.drinkId,
                customerNameAr: customer.nameAr,
                amount: payment.pricePaid,
                tip: payment.tip,
                quality,
                day: prev.day,
                timeLabel: timeStr,
              },
              ...prev.economy.salesHistory,
            ].slice(0, 40),
          },
          stats: {
            ...prev.stats,
            customersServed: prev.stats.customersServed + 1,
            ordersCompleted: prev.stats.ordersCompleted + 1,
            teaPrepared: prev.stats.teaPrepared + (isTea ? 1 : 0),
            coffeePrepared: prev.stats.coffeePrepared + (!isTea ? 1 : 0),
            regularsServed: prev.stats.regularsServed + (isRegular ? 1 : 0),
            perfectDrinks: prev.stats.perfectDrinks + (quality >= 90 ? 1 : 0),
            tipsReceived: prev.stats.tipsReceived + (payment.tip > 0 ? 1 : 0),
          },
        };
        if (leveled.leveledUp) {
          showToast(
            prev.settings.language === 'ar'
              ? `مبروك! وصلت للمستوى ${leveled.level}`
              : `Level Up! Reached Level ${leveled.level}`
          );
        } else if (tableDirty) {
          showToast(
            prev.settings.language === 'ar'
              ? `تم التسليم (+${payment.pricePaid}ج) · الترابيزة محتاجة مسح`
              : `Served (+${payment.pricePaid} EGP) · Clean table for higher quality`
          );
        } else {
          showToast(
            prev.settings.language === 'ar'
              ? `+${payment.pricePaid}${payment.tip > 0 ? ` (+${payment.tip} بقشيش)` : ''} جنيه · جودة ${quality}%`
              : `+${payment.pricePaid}${payment.tip > 0 ? ` (+${payment.tip} tip)` : ''} EGP · Quality ${quality}%`
          );
        }
        return syncMissions(next);
      });
    },
    [showToast]
  );

  // Mount Three.js Coffeehouse Engine ONCE
  useEffect(() => {
    if (!engineEnabled || !mountRef.current) return;
    const engine = new CoffeehouseEngine(mountRef.current, gameStateRef.current, {
      onOrderCreated: (order) => {
        setOrders((prev) => [...prev, order]);
      },
      onOrderDelivered: handleOrderDelivered,
      onCustomerComplaint: (customer) => {
        setOrders((prev) => prev.filter((o) => o.id !== customer.orderId));
        setGameState((prev) => ({
          ...prev,
          reputation: Math.max(0, prev.reputation - 3),
          satisfaction: Math.max(0, prev.satisfaction - 5),
          stats: {
            ...prev.stats,
            complaintsToday: prev.stats.complaintsToday + 1,
          },
        }));
        showToast(
          gameStateRef.current.settings.language === 'ar'
            ? `${customer.nameAr} مشي زعلان من التأخير!`
            : `${customer.nameEn} left frustrated from waiting!`
        );
      },
      onTableCleaned: (_tableId, byEmployee) => {
        setGameState((prev) => {
          const nextInv = {
            ...prev.inventory,
            cleaning: Math.max(0, prev.inventory.cleaning - 1),
          };
          const next = syncMissions({
            ...prev,
            inventory: nextInv,
            satisfaction: Math.min(100, prev.satisfaction + 1),
            stats: {
              ...prev.stats,
              tablesCleaned: prev.stats.tablesCleaned + 1,
            },
          });
          return next;
        });
        if (!byEmployee) {
          showToast(
            gameStateRef.current.settings.language === 'ar'
              ? 'الترابيزة نضفت وبتلمع!'
              : 'Table wiped spotless!'
          );
        }
      },
      onPromptChanged: (p) => setPrompt(p),
      onBubblesUpdated: (b) => setBubbles(b),
      onCarriedChanged: (c) => setCarriedDrink(c),
      onClockTick: (deltaMins) => {
        setGameState((prev) => {
          const nextClock = prev.clockMinutes + deltaMins;
          if (nextClock >= 1440) {
            // End of day automatic rollover
            const staffCost = prev.employees
              .filter((e) => e.hired)
              .reduce((acc, e) => acc + e.salaryPerDay, 0);
            return {
              ...prev,
              day: prev.day + 1,
              clockMinutes: 480,
              economy: {
                ...prev.economy,
                balance: Math.max(0, prev.economy.balance - staffCost),
                dailyRevenue: 0,
                dailyExpenses: staffCost,
                dailyTips: 0,
              },
              stats: {
                ...prev.stats,
                complaintsToday: 0,
              },
            };
          }
          return { ...prev, clockMinutes: nextClock };
        });
      },
      onBaristaCompleteOrder: (orderId, drinkId, quality) => {
        setGameState((prev) => {
          const cons = consumeIngredientsForDrink(prev.inventory, drinkId);
          if (!cons.ok) return prev;
          setOrders((ords) =>
            ords.map((o) =>
              o.id === orderId ? { ...o, status: 'ready', readyQuality: quality } : o
            )
          );
          return { ...prev, inventory: cons.nextInventory };
        });
      },
      onSoundEvent: (ev) => {
        if (ev === 'door') soundEngine.playDoor();
        else if (ev === 'clink') soundEngine.playStir();
        else if (ev === 'voice') soundEngine.playVoiceChime(0.95 + Math.random() * 0.2);
        else if (ev === 'clean') soundEngine.playPour();
      },
      onInteractTrigger: (p) => {
        if (p.type === 'prep_counter') setPrepOpen(true);
        else if (p.type === 'cashier') setActiveTab('stats');
        else if (p.type === 'storage') setActiveTab('inventory');
      },
      onCameraModeChanged: (m) => setCameraMode(m),
    });

    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [engineEnabled, handleOrderDelivered, showToast]);

  // Random Events Scheduler (every ~55 seconds while playing)
  useEffect(() => {
    if (screenState !== 'playing') return;
    const timer = window.setInterval(() => {
      if (activeEvent || prepOpen || activeTab) return;
      const evId = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
      setActiveEvent(createRandomEvent(evId));
      if (evId === 'power_outage') setPowerOutage(true);
    }, 52000);
    return () => clearInterval(timer);
  }, [screenState, activeEvent, prepOpen, activeTab]);

  // Global keyboard shortcuts for Title / Pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screenRef.current === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        soundEngine.unlock();
        setEngineEnabled(true);
        setScreenState('playing');
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (prepOpen) setPrepOpen(false);
        else if (activeTab) setActiveTab(null);
        else if (screenRef.current === 'playing') setScreenState('paused');
        else if (screenRef.current === 'paused') setScreenState('playing');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prepOpen, activeTab]);

  const handleStart = () => {
    soundEngine.unlock();
    setEngineEnabled(true);
    setScreenState('playing');
  };

  const createFreshGame = () => {
    const fresh = clearGameSave();
    const currentSettings = gameStateRef.current.settings;
    return {
      ...fresh,
      settings: {
        ...fresh.settings,
        ...currentSettings,
        audio: { ...fresh.settings.audio, ...currentSettings.audio },
      },
    };
  };

  const handleNewGame = () => {
    const fresh = createFreshGame();
    setGameState(fresh);
    setOrders([]);
    setBubbles([]);
    setPrompt(null);
    setCarriedDrink(null);
    setActiveEvent(null);
    setActiveTab(null);
    setPrepOpen(false);
    soundEngine.unlock();
    setEngineEnabled(true);
    setScreenState('playing');
  };

  const handleCompleteDrink = ({
    order,
    drinkId,
    quality,
  }: {
    order: Order | null;
    drinkId: DrinkId;
    quality: number;
  }) => {
    const cons = consumeIngredientsForDrink(gameState.inventory, drinkId);
    if (!cons.ok) {
      showToast(
        gameState.settings.language === 'ar'
          ? 'ناقص خامات في المخزن!'
          : 'Missing ingredients!'
      );
      return;
    }

    setGameState((prev) => ({
      ...prev,
      inventory: cons.nextInventory,
    }));

    if (order) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: 'ready', readyQuality: quality } : o
        )
      );
      engineRef.current?.setCarriedDrink({
        orderId: order.id,
        drinkId,
        tableId: order.tableId,
        customerId: order.customerId,
        quality,
      });
      showToast(
        gameState.settings.language === 'ar'
          ? `جهزت ${DRINKS[drinkId].nameAr}! وصلها لـ ${order.customerNameAr}`
          : `Brewed ${DRINKS[drinkId].nameEn}! Deliver to ${order.customerNameEn}`
      );
    } else {
      showToast(
        gameState.settings.language === 'ar'
          ? `عملت كوباية ${DRINKS[drinkId].nameAr} ممتازة للتدريب!`
          : `Practice brew complete (${quality}%)!`
      );
    }
    setPrepOpen(false);
  };

  const handleEventChoice = (choiceId: string) => {
    if (!activeEvent) return;
    const isAr = gameState.settings.language === 'ar';

    if (activeEvent.id === 'power_outage') {
      if (choiceId === 'generator') {
        setPowerOutage(false);
        setGameState((prev) => ({
          ...prev,
          reputation: Math.min(100, prev.reputation + 10),
          economy: {
            ...prev.economy,
            balance: Math.max(0, prev.economy.balance - 35),
            dailyExpenses: prev.economy.dailyExpenses + 35,
          },
        }));
      } else {
        window.setTimeout(() => setPowerOutage(false), 12000);
        setGameState((prev) => ({
          ...prev,
          reputation: Math.min(100, prev.reputation + 7),
        }));
      }
    } else if (activeEvent.id === 'table_argument') {
      const cost = choiceId === 'mediate' ? 15 : 0;
      const rep = choiceId === 'mediate' ? 10 : 3;
      setGameState((prev) => ({
        ...prev,
        reputation: Math.min(100, prev.reputation + rep),
        economy: {
          ...prev.economy,
          balance: Math.max(0, prev.economy.balance - cost),
          dailyExpenses: prev.economy.dailyExpenses + cost,
        },
      }));
    } else if (activeEvent.id === 'football_match') {
      const earn = choiceId === 'hype' ? 80 : 40;
      engineRef.current?.spawnCrowdBurst(2);
      setGameState((prev) => ({
        ...prev,
        reputation: Math.min(100, prev.reputation + (choiceId === 'hype' ? 8 : 4)),
        economy: {
          ...prev.economy,
          balance: prev.economy.balance + earn,
          totalEarned: prev.economy.totalEarned + earn,
          dailyRevenue: prev.economy.dailyRevenue + earn,
        },
      }));
    } else if (activeEvent.id === 'master_arrives') {
      const earn = choiceId === 'vip_service' ? 120 : 45;
      const cost = choiceId === 'vip_service' ? 20 : 0;
      setGameState((prev) => ({
        ...prev,
        reputation: Math.min(100, prev.reputation + (choiceId === 'vip_service' ? 12 : 4)),
        economy: {
          ...prev.economy,
          balance: prev.economy.balance + earn - cost,
          totalEarned: prev.economy.totalEarned + earn,
          dailyRevenue: prev.economy.dailyRevenue + earn,
          dailyExpenses: prev.economy.dailyExpenses + cost,
        },
      }));
    } else if (activeEvent.id === 'unexpected_crowds') {
      const earn = choiceId === 'rally' ? 100 : 45;
      engineRef.current?.spawnCrowdBurst(choiceId === 'rally' ? 3 : 1);
      setGameState((prev) => ({
        ...prev,
        reputation: Math.min(100, prev.reputation + (choiceId === 'rally' ? 10 : 4)),
        economy: {
          ...prev.economy,
          balance: prev.economy.balance + earn,
          totalEarned: prev.economy.totalEarned + earn,
          dailyRevenue: prev.economy.dailyRevenue + earn,
        },
      }));
    } else if (activeEvent.id === 'missing_ingredients' && choiceId === 'buy_rush') {
      setGameState((prev) => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          tea: Math.min(prev.storageCapacity, prev.inventory.tea + 10),
          sugar: Math.min(prev.storageCapacity, prev.inventory.sugar + 15),
        },
        economy: {
          ...prev.economy,
          balance: Math.max(0, prev.economy.balance - 45),
          dailyExpenses: prev.economy.dailyExpenses + 45,
        },
      }));
    } else if (activeEvent.id === 'forgotten_wallet') {
      const earn = choiceId === 'wash_cups' ? 20 : 0;
      setGameState((prev) => ({
        ...prev,
        reputation: Math.min(100, prev.reputation + (choiceId === 'forgive' ? 12 : 2)),
        satisfaction: Math.min(100, prev.satisfaction + (choiceId === 'forgive' ? 6 : 2)),
        economy: {
          ...prev.economy,
          balance: prev.economy.balance + earn,
          totalEarned: prev.economy.totalEarned + earn,
          dailyRevenue: prev.economy.dailyRevenue + earn,
        },
      }));
    } else if (activeEvent.id === 'strange_order') {
      const earn = choiceId === 'accept_strange' ? 65 : 22;
      setGameState((prev) => ({
        ...prev,
        reputation: Math.min(100, prev.reputation + (choiceId === 'accept_strange' ? 6 : 2)),
        economy: {
          ...prev.economy,
          balance: prev.economy.balance + earn,
          totalEarned: prev.economy.totalEarned + earn,
          dailyRevenue: prev.economy.dailyRevenue + earn,
        },
      }));
    }

    soundEngine.playReward();
    showToast(isAr ? 'تم التعامل مع الموقف بنجاح!' : 'Event resolved!');
    setActiveEvent(null);
  };

  const isAr = gameState.settings.language === 'ar';

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#16100b]">
      {/* Isolated 3D WebGL Viewport Container */}
      {engineEnabled && (
        <div
          ref={mountRef}
          data-testid="coffeehouse-canvas"
          className="absolute inset-0 w-full h-full"
        />
      )}

      {/* Title Screen */}
      {screenState === 'title' && (
        <TitleScreen
          language={gameState.settings.language}
          hasSavedProgress={gameState.stats.ordersCompleted > 0 || gameState.day > 1}
          savedDay={gameState.day}
          savedBalance={gameState.economy.balance}
          onStart={handleStart}
          onNewGame={handleNewGame}
          graphicsPreset={gameState.settings.graphics}
          onChangeGraphics={(graphics) =>
            setGameState((prev) => ({
              ...prev,
              settings: { ...prev.settings, graphics },
            }))
          }
          onToggleLanguage={() =>
            setGameState((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                language: prev.settings.language === 'ar' ? 'en' : 'ar',
              },
            }))
          }
        />
      )}

      {/* Active Gameplay HUD */}
      {screenState === 'playing' && (
        <HUD
          gameState={gameState}
          orders={orders}
          bubbles={bubbles}
          prompt={prompt}
          carriedDrink={carriedDrink}
          cameraMode={cameraMode}
          toastMessage={toast}
          onJoystickMove={(x, y) => engineRef.current?.setJoystick(x, y)}
          onCameraDrag={(dx, dy) => engineRef.current?.addCameraLookDelta(dx, dy)}
          onCameraZoom={(d) => engineRef.current?.addCameraZoom(d)}
          onToggleRun={(r) => engineRef.current?.setRunToggle(r)}
          onCycleCamera={() => {
            const next = engineRef.current?.cycleCameraMode();
            if (next) setCameraMode(next);
          }}
          onResetCamera={() => engineRef.current?.resetCamera()}
          onInteract={() => engineRef.current?.triggerInteraction()}
          onToggleMute={() =>
            setGameState((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                audio: { ...prev.settings.audio, muted: !prev.settings.audio.muted },
              },
            }))
          }
          onPause={() => setScreenState('paused')}
          onOpenTab={(tab) => {
            setDrawerToast(null);
            setActiveTab(tab);
          }}
          onOpenPrep={() => setPrepOpen(true)}
        />
      )}

      {/* Interactive Drink Prep Station */}
      {screenState === 'playing' && prepOpen && (
        <DrinkPrepModal
          gameState={gameState}
          orders={orders}
          tableDirtyLookup={(id) => engineRef.current?.isTableDirty(id) ?? false}
          onClose={() => setPrepOpen(false)}
          onOpenInventory={() => {
            setPrepOpen(false);
            setActiveTab('inventory');
          }}
          onPlaySound={(t) => {
            if (t === 'pour') soundEngine.playPour();
            else if (t === 'stir') soundEngine.playStir();
            else soundEngine.playReward();
          }}
          onCompleteDrink={handleCompleteDrink}
        />
      )}

      {/* Management Drawers */}
      {screenState === 'playing' && activeTab && (
        <ManagementDrawers
          activeTab={activeTab}
          gameState={gameState}
          orders={orders}
          feedbackToast={drawerToast}
          onSelectTab={(t) => {
            setDrawerToast(null);
            setActiveTab(t);
          }}
          onClose={() => setActiveTab(null)}
          onAcceptOrder={(id) =>
            setOrders((prev) =>
              prev.map((o) => (o.id === id ? { ...o, status: 'accepted' } : o))
            )
          }
          onCancelOrder={(id) =>
            setOrders((prev) => prev.filter((o) => o.id !== id))
          }
          onOpenPrepForOrder={() => {
            setActiveTab(null);
            setPrepOpen(true);
          }}
          onBuyIngredient={(id: IngredientId) => {
            const res = buyIngredientPack(gameState, id);
            if (!res.ok) {
              setDrawerToast(
                res.reason === 'storage_full'
                  ? isAr
                    ? 'المخزن ممتلئ! طوّر رفوف المخزن الأول.'
                    : 'Storage full! Upgrade shelving first.'
                  : isAr
                    ? 'الرصيد غير كافي!'
                    : 'Insufficient EGP!'
              );
              return;
            }
            soundEngine.playCashRegister();
            setGameState(res.state);
            setDrawerToast(
              isAr
                ? `تم شراء ${INGREDIENTS[id].nameAr}`
                : `Bought ${INGREDIENTS[id].nameEn}`
            );
          }}
          onHireEmployee={(empId) => {
            const emp = gameState.employees.find((e) => e.id === empId);
            if (!emp || emp.hired) return;
            const cost = emp.salaryPerDay * 2;
            if (gameState.economy.balance < cost) {
              setDrawerToast(isAr ? 'الرصيد غير كافي!' : 'Insufficient EGP!');
              return;
            }
            soundEngine.playReward();
            setGameState((prev) =>
              syncMissions({
                ...prev,
                economy: {
                  ...prev.economy,
                  balance: prev.economy.balance - cost,
                  dailyExpenses: prev.economy.dailyExpenses + cost,
                },
                employees: prev.employees.map((e) =>
                  e.id === empId ? { ...e, hired: true, assigned: true } : e
                ),
              })
            );
            setDrawerToast(
              isAr
                ? `تم تعيين ${emp.nameAr} وبدأ الشغل في القهوة!`
                : `Hired ${emp.nameEn}!`
            );
          }}
          onToggleEmployeeAssign={(empId) =>
            setGameState((prev) => ({
              ...prev,
              employees: prev.employees.map((e) =>
                e.id === empId ? { ...e, assigned: !e.assigned } : e
              ),
            }))
          }
          onUpgradeEmployee={(empId) => {
            const emp = gameState.employees.find((e) => e.id === empId);
            if (!emp) return;
            const cost = 120 + emp.level * 80;
            if (gameState.economy.balance < cost) {
              setDrawerToast(isAr ? 'الرصيد غير كافي!' : 'Insufficient EGP!');
              return;
            }
            soundEngine.playReward();
            setGameState((prev) => ({
              ...prev,
              economy: {
                ...prev.economy,
                balance: prev.economy.balance - cost,
                dailyExpenses: prev.economy.dailyExpenses + cost,
              },
              employees: prev.employees.map((e) =>
                e.id === empId
                  ? {
                      ...e,
                      level: e.level + 1,
                      skill: Math.min(5, e.skill + 1),
                      speed: Math.min(2.2, +(e.speed + 0.15).toFixed(2)),
                    }
                  : e
              ),
            }));
          }}
          onDismissEmployee={(empId) =>
            setGameState((prev) => ({
              ...prev,
              employees: prev.employees.map((e) =>
                e.id === empId ? { ...e, hired: false } : e
              ),
            }))
          }
          onBuyUpgrade={(id: UpgradeId) => {
            const res = purchaseUpgrade(gameState, id);
            if (!res.ok) {
              setDrawerToast(
                res.reason === 'locked_level'
                  ? isAr
                    ? 'المستوى غير كافي!'
                    : 'Level too low!'
                  : isAr
                    ? 'الرصيد غير كافي!'
                    : 'Insufficient EGP!'
              );
              return;
            }
            const meta = UPGRADES.find((u) => u.id === id);
            soundEngine.playReward();
            setGameState(res.state);
            setDrawerToast(
              isAr
                ? `تم تركيب ${meta?.nameAr ?? id} في القهوة!`
                : `Installed ${meta?.nameEn ?? id} in the 3D cafe!`
            );
          }}
          onClaimMission={(id) => {
            const res = claimMissionReward(gameState, id);
            if (res.ok) {
              soundEngine.playReward();
              setGameState(res.state);
              setDrawerToast(
                isAr ? 'تم استلام مكافأة المهمة!' : 'Mission reward claimed!'
              );
            }
          }}
          onEndDay={() => {
            const staffCost = gameState.employees
              .filter((e) => e.hired)
              .reduce((acc, e) => acc + e.salaryPerDay, 0);
            soundEngine.playCashRegister();
            setGameState((prev) => ({
              ...prev,
              day: prev.day + 1,
              clockMinutes: 480,
              economy: {
                ...prev.economy,
                balance: Math.max(0, prev.economy.balance - staffCost),
                dailyRevenue: 0,
                dailyExpenses: staffCost,
                dailyTips: 0,
              },
              stats: { ...prev.stats, complaintsToday: 0 },
            }));
            setDrawerToast(
              isAr
                ? `بدأ يوم جديد! تم خصم رواتب العمال (${staffCost}ج).`
                : `New day started! Paid staff salaries (${staffCost} EGP).`
            );
          }}
          onUpdateSettings={(patch: {
            language?: 'ar' | 'en';
            graphics?: GraphicsPreset;
            cameraSensitivity?: number;
            audio?: Partial<AudioSettings>;
          }) => {
            setGameState((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                language: patch.language ?? prev.settings.language,
                graphics: patch.graphics ?? prev.settings.graphics,
                cameraSensitivity:
                  patch.cameraSensitivity ?? prev.settings.cameraSensitivity,
                audio: {
                  ...prev.settings.audio,
                  ...(patch.audio ?? {}),
                },
              },
            }));
          }}
          onManualSave={() => {
            saveGameState(gameState);
            soundEngine.playReward();
            setDrawerToast(isAr ? 'تم حفظ التقدم بنجاح!' : 'Game progress saved!');
          }}
          onResetSave={() => {
            const fresh = createFreshGame();
            setGameState(fresh);
            setOrders([]);
            engineRef.current?.setCarriedDrink(null);
            setActiveTab(null);
            showToast(isAr ? 'تم بدء قهوة جديدة!' : 'Started fresh coffeehouse!');
          }}
        />
      )}

      {/* Random Event Modal */}
      {screenState === 'playing' && activeEvent && (
        <EventModal
          event={activeEvent}
          language={gameState.settings.language}
          onChoose={handleEventChoice}
        />
      )}

      {/* Pause Modal */}
      {screenState === 'paused' && (
        <PauseModal
          language={gameState.settings.language}
          day={gameState.day}
          balance={gameState.economy.balance}
          reputation={gameState.reputation}
          onResume={() => setScreenState('playing')}
          onRestart={() => {
            const fresh = createFreshGame();
            setGameState(fresh);
            setOrders([]);
            engineRef.current?.setCarriedDrink(null);
            setScreenState('playing');
          }}
          onToTitle={() => {
            setEngineEnabled(false);
            setScreenState('title');
          }}
        />
      )}
    </main>
  );
}

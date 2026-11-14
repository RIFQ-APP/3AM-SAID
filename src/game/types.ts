export type Language = 'ar' | 'en';

export type GameScreenState = 'title' | 'tutorial' | 'playing' | 'paused' | 'gameover';

export type CameraMode = 'third_person' | 'first_person' | 'free_look';

export type GraphicsPreset = 'low' | 'medium' | 'high';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type DrinkId =
  | 'black_tea'
  | 'strong_tea'
  | 'medium_tea'
  | 'mint_tea'
  | 'black_coffee'
  | 'medium_coffee'
  | 'strong_coffee'
  | 'anise'
  | 'hibiscus'
  | 'sahlab';

export type IngredientId =
  | 'tea'
  | 'coffee'
  | 'sugar'
  | 'mint'
  | 'milk'
  | 'water'
  | 'cups'
  | 'herbs'
  | 'cleaning';

export type CustomerArchetype =
  | 'uncle_hosny'
  | 'el_moallem'
  | 'talkative'
  | 'impatient'
  | 'football_fan'
  | 'philosopher'
  | 'new_customer'
  | 'regular';

export type NPCState =
  | 'entering'
  | 'looking_for_seat'
  | 'walking_to_table'
  | 'sitting'
  | 'ordering'
  | 'waiting'
  | 'talking'
  | 'drinking'
  | 'complaining'
  | 'paying'
  | 'leaving';

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type EmployeeRole = 'waiter' | 'barista' | 'cleaner' | 'cashier';

export type MissionCategory = 'main' | 'daily' | 'achievement';

export type UpgradeId =
  | 'table_5'
  | 'table_6'
  | 'wood_chairs'
  | 'brass_kettle'
  | 'storage_rack'
  | 'wall_decor'
  | 'big_tv'
  | 'brass_lanterns';

export type RandomEventId =
  | 'table_argument'
  | 'football_match'
  | 'power_outage'
  | 'strange_order'
  | 'forgotten_wallet'
  | 'master_arrives'
  | 'missing_ingredients'
  | 'unexpected_crowds';

export interface DrinkRecipe {
  id: DrinkId;
  nameAr: string;
  nameEn: string;
  price: number;
  unlockLevel: number;
  brewDuration: number; // seconds target
  liquidColor: string;
  cupType: 'glass' | 'finjan' | 'mug';
  ingredients: Partial<Record<IngredientId, number>>;
  sugarLevel: 0 | 1 | 2 | 3; // 0=sada, 1=ariha, 2=mazbout, 3=ziada
  descriptionAr: string;
  descriptionEn: string;
}

export interface InventoryState {
  tea: number;
  coffee: number;
  sugar: number;
  mint: number;
  milk: number;
  water: number;
  cups: number;
  herbs: number;
  cleaning: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerNameAr: string;
  customerNameEn: string;
  tableId: number;
  drinkId: DrinkId;
  quantity: number;
  price: number;
  status: OrderStatus;
  createdAt: number; // sim seconds
  readyQuality?: number; // 0..100
  isStrange?: boolean;
}

export interface CarriedDrink {
  orderId: string;
  drinkId: DrinkId;
  tableId: number;
  customerId: string;
  quality: number;
}

export interface CustomerPersonality {
  patience: number; // 0.5..1.5 multiplier
  friendliness: number; // 0..1
  talkativeness: number; // 0..1
  angerTendency: number; // 0..1
  tipMultiplier: number; // 0.5..2.0
  favoriteDrinks: DrinkId[];
  preferredTableIds: number[];
}

export type CustomerActivity =
  | 'none'
  | 'tawla'
  | 'shisha'
  | 'watching_tv'
  | 'ahly_zamalek_argument';

export type BodyBuild = 'slim' | 'average' | 'belly' | 'broad';
export type MustacheStyle = 'none' | 'thin' | 'bushy' | 'handlebar';
export type HeadwearType = 'none' | 'cap' | 'turban' | 'fez' | 'taqiya';
export type OutfitStyleType = 'shirt' | 'galabeya' | 'vest_galabeya';

export interface CustomerData {
  id: string;
  archetype: CustomerArchetype;
  nameAr: string;
  nameEn: string;
  state: NPCState;
  activity: CustomerActivity;
  teamBias?: 'ahly' | 'zamalek' | 'neutral';
  tableId: number | null;
  seatIndex: number | null;
  patienceLeft: number; // 0..100
  maxPatience: number;
  personality: CustomerPersonality;
  orderedDrink: DrinkId | null;
  orderId: string | null;
  bubbleText: string;
  bubbleTimer: number;
  shirtColor: string;
  skinColor: string;
  hasFez: boolean;
  hasMustache: boolean;
  hasGlasses: boolean;
  glassesStyle?: 'round' | 'dark';
  headwear?: HeadwearType;
  outfitStyle?: OutfitStyleType;
  bodyBuild?: BodyBuild;
  mustacheStyle?: MustacheStyle;
  hasBeard?: boolean;
}

export interface Employee {
  id: string;
  role: EmployeeRole;
  nameAr: string;
  nameEn: string;
  salaryPerDay: number;
  speed: number; // 1.0..2.2
  skill: number; // 1..5
  level: number;
  assigned: boolean;
  hired: boolean;
  currentTaskAr: string;
  currentTaskEn: string;
  shirtColor: string;
}

export interface Mission {
  id: string;
  category: MissionCategory;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  target: number;
  progress: number;
  rewardEgp: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
  metric:
    | 'customers_served'
    | 'total_earned'
    | 'tables_bought'
    | 'employees_hired'
    | 'reputation_level'
    | 'equipment_upgraded'
    | 'tea_prepared'
    | 'regulars_served'
    | 'tables_cleaned'
    | 'orders_completed'
    | 'first_tip'
    | 'perfect_drinks'
    | 'no_complaints_day';
}

export interface SaleRecord {
  id: string;
  drinkId: DrinkId;
  customerNameAr: string;
  amount: number;
  tip: number;
  quality: number;
  day: number;
  timeLabel: string;
}

export interface EconomyState {
  balance: number;
  totalEarned: number;
  dailyRevenue: number;
  dailyExpenses: number;
  dailyTips: number;
  salesHistory: SaleRecord[];
}

export interface AudioSettings {
  muted: boolean;
  music: number; // 0..1
  sfx: number;
  voices: number;
  ambience: number;
}

export interface GameSettings {
  language: Language;
  graphics: GraphicsPreset;
  cameraSensitivity: number; // 0.4..2.0
  audio: AudioSettings;
}

export interface EventEffectChip {
  kind: 'money' | 'rep' | 'xp' | 'stock';
  delta: number;
  labelAr: string;
  labelEn: string;
}

export interface ActiveEventChoice {
  id: string;
  labelAr: string;
  labelEn: string;
  effectTextAr: string;
  effectTextEn: string;
  effects?: EventEffectChip[];
}

export interface ActiveRandomEvent {
  id: RandomEventId;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  dialogueAr: string;
  choices: ActiveEventChoice[];
}

export interface StatsTracker {
  customersServed: number;
  teaPrepared: number;
  coffeePrepared: number;
  regularsServed: number;
  tablesCleaned: number;
  ordersCompleted: number;
  perfectDrinks: number;
  tipsReceived: number;
  complaintsToday: number;
  eventsHandled: number;
}

export interface GameState {
  version: number;
  day: number;
  clockMinutes: number; // 360 (6:00 AM) to 1440 (12:00 AM)
  xp: number;
  level: number;
  reputation: number; // 0..100
  satisfaction: number; // 0..100
  storageCapacity: number;
  upgrades: Record<UpgradeId, boolean>;
  inventory: InventoryState;
  economy: EconomyState;
  employees: Employee[];
  missions: Mission[];
  stats: StatsTracker;
  settings: GameSettings;
}

export type InteractionType =
  | 'prep_counter'
  | 'cashier'
  | 'storage'
  | 'tv'
  | 'door'
  | 'clean_table'
  | 'serve_customer'
  | 'talk_customer'
  | 'sit_chair'
  | 'stand_up';

export interface InteractionPrompt {
  type: InteractionType;
  targetId?: string | number;
  labelAr: string;
  labelEn: string;
  subLabelAr?: string;
}

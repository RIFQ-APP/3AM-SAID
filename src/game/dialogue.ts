import {
  ActiveRandomEvent,
  BodyBuild,
  CustomerArchetype,
  DrinkId,
  HeadwearType,
  MustacheStyle,
  OutfitStyleType,
  RandomEventId,
} from './types';

export interface CharacterBlueprint {
  archetype: CustomerArchetype;
  nameAr: string;
  nameEn: string;
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
  teamBias?: 'ahly' | 'zamalek' | 'neutral';
  hairColor?: string;
  patience: number;
  friendliness: number;
  talkativeness: number;
  angerTendency: number;
  tipMultiplier: number;
  favoriteDrinks: DrinkId[];
}

export const NAMED_CHARACTERS: CharacterBlueprint[] = [
  {
    archetype: 'uncle_hosny',
    nameAr: 'عم حسني',
    nameEn: 'Uncle Hosny',
    shirtColor: '#8d7b68',
    skinColor: '#d99e6e',
    hasFez: true,
    hasMustache: true,
    hasGlasses: true,
    glassesStyle: 'round',
    headwear: 'fez',
    outfitStyle: 'vest_galabeya',
    bodyBuild: 'belly',
    mustacheStyle: 'handlebar',
    hasBeard: true,
    hairColor: '#9ca3af',
    patience: 1.15,
    friendliness: 0.85,
    talkativeness: 0.95,
    angerTendency: 0.25,
    tipMultiplier: 1.1,
    favoriteDrinks: ['black_tea', 'medium_tea', 'anise'],
  },
  {
    archetype: 'el_moallem',
    nameAr: 'المعلم عتريس',
    nameEn: 'El-Moallem Atris',
    shirtColor: '#d6b684',
    skinColor: '#cc8d5b',
    hasFez: false,
    hasMustache: true,
    hasGlasses: false,
    headwear: 'turban',
    outfitStyle: 'vest_galabeya',
    bodyBuild: 'belly',
    mustacheStyle: 'bushy',
    hairColor: '#1f1916',
    patience: 0.9,
    friendliness: 0.7,
    talkativeness: 0.65,
    angerTendency: 0.45,
    tipMultiplier: 1.85,
    favoriteDrinks: ['black_coffee', 'strong_coffee', 'strong_tea'],
  },
  {
    archetype: 'talkative',
    nameAr: 'سمير الرغّاي',
    nameEn: 'Samir the Talkative',
    shirtColor: '#0284c7',
    skinColor: '#e2ad7d',
    hasFez: false,
    hasMustache: true,
    hasGlasses: false,
    headwear: 'none',
    outfitStyle: 'shirt',
    bodyBuild: 'slim',
    mustacheStyle: 'thin',
    hairColor: '#1c1917',
    patience: 1.25,
    friendliness: 0.95,
    talkativeness: 1.0,
    angerTendency: 0.15,
    tipMultiplier: 1.0,
    favoriteDrinks: ['mint_tea', 'medium_tea', 'hibiscus'],
  },
  {
    archetype: 'impatient',
    nameAr: 'أستاذ مدحت',
    nameEn: 'Medhat',
    shirtColor: '#7f1d1d',
    skinColor: '#d9a173',
    hasFez: false,
    hasMustache: true,
    hasGlasses: true,
    glassesStyle: 'dark',
    headwear: 'none',
    outfitStyle: 'shirt',
    bodyBuild: 'average',
    mustacheStyle: 'thin',
    hairColor: '#292524',
    patience: 0.65,
    friendliness: 0.4,
    talkativeness: 0.35,
    angerTendency: 0.85,
    tipMultiplier: 0.9,
    favoriteDrinks: ['black_coffee', 'strong_tea'],
  },
  {
    archetype: 'football_fan',
    nameAr: 'حودة الكورجي',
    nameEn: 'Houda the Fan',
    shirtColor: '#dc2626',
    skinColor: '#d69968',
    hasFez: false,
    hasMustache: false,
    hasGlasses: false,
    headwear: 'cap',
    outfitStyle: 'shirt',
    bodyBuild: 'broad',
    mustacheStyle: 'none',
    teamBias: 'ahly',
    hairColor: '#18181b',
    patience: 1.0,
    friendliness: 0.8,
    talkativeness: 0.85,
    angerTendency: 0.5,
    tipMultiplier: 1.25,
    favoriteDrinks: ['medium_tea', 'mint_tea', 'hibiscus'],
  },
  {
    archetype: 'philosopher',
    nameAr: 'الفيلسوف زكي',
    nameEn: 'Zaki the Philosopher',
    shirtColor: '#4c1d95',
    skinColor: '#deb088',
    hasFez: true,
    hasMustache: true,
    hasGlasses: true,
    glassesStyle: 'round',
    headwear: 'fez',
    outfitStyle: 'shirt',
    bodyBuild: 'slim',
    mustacheStyle: 'handlebar',
    hasBeard: true,
    hairColor: '#52525b',
    patience: 1.4,
    friendliness: 0.75,
    talkativeness: 0.9,
    angerTendency: 0.1,
    tipMultiplier: 1.15,
    favoriteDrinks: ['anise', 'medium_coffee', 'sahlab'],
  },
  {
    archetype: 'new_customer',
    nameAr: 'سيف الزملكاوي',
    nameEn: 'Seif the Fan',
    shirtColor: '#f1f5f9',
    skinColor: '#e2b28a',
    hasFez: false,
    hasMustache: false,
    hasGlasses: false,
    headwear: 'none',
    outfitStyle: 'shirt',
    bodyBuild: 'average',
    mustacheStyle: 'thin',
    teamBias: 'zamalek',
    hairColor: '#1c1917',
    patience: 1.1,
    friendliness: 0.8,
    talkativeness: 0.65,
    angerTendency: 0.4,
    tipMultiplier: 1.15,
    favoriteDrinks: ['medium_tea', 'mint_tea', 'sahlab'],
  },
];

export const RANDOM_REGULAR_NAMES: Array<{
  ar: string;
  en: string;
  color: string;
  skinColor?: string;
  headwear?: HeadwearType;
  outfitStyle?: OutfitStyleType;
  bodyBuild?: BodyBuild;
  mustacheStyle?: MustacheStyle;
  hasGlasses?: boolean;
  hasBeard?: boolean;
  teamBias?: 'ahly' | 'zamalek' | 'neutral';
}> = [
  {
    ar: 'عم شحتة',
    en: 'Uncle Shehta',
    color: '#d4b483',
    skinColor: '#c98a5b',
    headwear: 'turban',
    outfitStyle: 'galabeya',
    bodyBuild: 'belly',
    mustacheStyle: 'bushy',
    hasBeard: true,
  },
  {
    ar: 'الأسطى فرج',
    en: 'Farag',
    color: '#0f766e',
    skinColor: '#d99e6c',
    headwear: 'taqiya',
    outfitStyle: 'galabeya',
    bodyBuild: 'broad',
    mustacheStyle: 'bushy',
  },
  {
    ar: 'كريم أفندي',
    en: 'Karim',
    color: '#3730a3',
    skinColor: '#e4b38b',
    headwear: 'fez',
    outfitStyle: 'shirt',
    bodyBuild: 'slim',
    mustacheStyle: 'thin',
    hasGlasses: true,
  },
  {
    ar: 'سيد بوجي',
    en: 'Sayed Boggy',
    color: '#c2a375',
    skinColor: '#b97848',
    headwear: 'turban',
    outfitStyle: 'vest_galabeya',
    bodyBuild: 'belly',
    mustacheStyle: 'handlebar',
  },
  {
    ar: 'طارق الميكانيكي',
    en: 'Tarek',
    color: '#334155',
    skinColor: '#cf9160',
    headwear: 'cap',
    outfitStyle: 'shirt',
    bodyBuild: 'broad',
    mustacheStyle: 'bushy',
    teamBias: 'ahly',
  },
  {
    ar: 'هاني السمسار',
    en: 'Hany',
    color: '#e2e8f0',
    skinColor: '#dfb086',
    headwear: 'none',
    outfitStyle: 'shirt',
    bodyBuild: 'average',
    mustacheStyle: 'thin',
    hasGlasses: true,
    teamBias: 'zamalek',
  },
];

export const DIALOGUE_BANK: Record<
  CustomerArchetype,
  {
    greeting: string[];
    ordering: string[];
    waiting: string[];
    complaining: string[];
    happyDrink: string[];
    badDrink: string[];
    chatting: string[];
    paying: string[];
  }
> = {
  uncle_hosny: {
    greeting: ['يا فتّاح يا عليم.. صباح الفل!', 'القهوة دي ريحتها ترد الروح!'],
    ordering: ['شاي كشري تقيل يا بني، اوعى تنساني!', 'نزلنا يانسون يدفّي العضم.'],
    waiting: ['أيام زمان كان الشاي ينزل قبل ما أقعد!', 'قاعدين ومستنيينك يا معلم.'],
    complaining: ['انت بتزرع الشاي الأول ولا إيه؟!', 'ركبي وجعتني والطلب مجاش!'],
    happyDrink: ['الله ينور! الشاي ده يتوزن بالدهب.', 'تسلم إيدك يا معلم!'],
    badDrink: ['ده شاي ده ولا مية؟ المرة الجاية تظبطه!', 'السكر ناقص شوية يا بني.'],
    chatting: [
      'عندي اجتماع مهم بعد الشاي.. اجتماع مع النوم!',
      'القهوة دي أحلى من بيوتنا والله.',
    ],
    paying: ['خد حسابك وربنا يوسع رزقك.', 'اتفضل يا ريس، خلي الباقي.'],
  },
  el_moallem: {
    greeting: ['السلام عليكم.. المعلم وصل.', 'مساء الخير يا ريس، القهوة منوّرة.'],
    ordering: ['قهوة ع الفحم وشّها تقيل.. شغل معلمين.', 'قهوة محوجة تظبط الطاسة.'],
    waiting: ['المعلم ما بيحبش يستنى كتير.', 'سمعنا صوت الكنكة ع السبرتاية!'],
    complaining: ['عيب في حق المعلم! فين القهوة؟!', 'هروح القهوة اللي قصادكم ولا إيه؟'],
    happyDrink: ['عظيمة يا فنان! وشها يشرف.', 'أيوه كده.. شغل معلمين بجد!'],
    badDrink: ['الوش ساقط ليه؟ شد حيلك يا معلم.', 'ماشي الحال المرة دي.'],
    chatting: [
      'كنا نخلص الصفقات كلها ع الترابيزة دي.',
      'إنت شاب مجتهد وهتكبر القهوة.',
    ],
    paying: ['امسك يا بني.. المعلم ما بياخدش باقي!', 'حسابك وزيادة يا ريس.'],
  },
  talkative: {
    greeting: ['إزيك يا معلم! وحشتني من امبارح!', 'حد شاف الماتش امبارح؟'],
    ordering: ['شاي بالنعناع واستنى أحكيلك حكاية الميكروباص!', 'شاي مظبوط ع السريع!'],
    waiting: ['بقولك خالي عنده براد شبه ده!', 'النعناع ليه 17 فائدة، هحكيلك!'],
    complaining: ['نسيتني من كتر الرغي ولا إيه؟!', 'ريقي نشف ولسه الشاي مجاش!'],
    happyDrink: ['طعم النعناع يخليني أتكلم ساعتين كمان!', 'مية مية يا ريس!'],
    badDrink: ['طعمه خفيف بس كمل أقولك باقي الحكاية!'],
    chatting: [
      'لو فتحت فرع في المريخ هجيلك برضه!',
      'كل مشاكل الدنيا تتحل بكوباية شاي.',
    ],
    paying: ['اتفضل.. هعدي بليل أحكيلك الجزء التاني!'],
  },
  impatient: {
    greeting: ['بسرعة يا معلم، ورايا مشوار!', 'مفيش كرسي أقرب للباب؟'],
    ordering: ['قهوة سادة في السريع لو سمحت!', 'شاي تقيل حالا بالله عليك.'],
    waiting: ['لسه؟ ده أنا كنت شربتها ومشيت!', 'يا عم أنجز.. الساعة بتجري!'],
    complaining: ['إيه البطء ده؟! أنا ماشي!', 'بقالي قرن قاعد ومحدش عبرني!'],
    happyDrink: ['أخيراً.. بس طعمها ممتاز، تسلم.', 'سريعة ومظبوطة، تمام!'],
    badDrink: ['اتأخرت وكمان مش مظبوطة؟!'],
    chatting: ['ما عنديش وقت للرغي يا معلم!'],
    paying: ['اتفضل الفلوس بالتمام، سلام!'],
  },
  football_fan: {
    greeting: ['التلفزيون شغال يا معلم؟', 'النهاردة يوم كورة عالمي!'],
    ordering: ['شاي مظبوط، الماتش شغال!', 'عناب ساقع أو شاي بالنعناع بسرعة!'],
    waiting: ['يا حكم ده فاول واضح!! فين الشاي؟', 'يا رب نجيب جون قبل ما الشاي يبرد!'],
    complaining: ['الشوط الأول هيخلص والطلب مجاش!', 'ركز معانا زي المهاجم يا كابتن!'],
    happyDrink: ['جووووون!! الشاي ده جاب وش السعد!', 'انت أحسن صانع ألعاب في القهوة!'],
    badDrink: ['التمريرة دي وحشة.. الشاي خفيف!'],
    chatting: [
      'الأهلي نادي القرن وأجمد فرقة!',
      'القهوة دي فيها روح المدرجات!',
    ],
    paying: ['خد الحساب يا كابتن.. نتقابل الماتش الجاي!'],
  },
  philosopher: {
    greeting: ['مساء التأمل.. جئت أبحث عن معنى الحياة في فنجان.'],
    ordering: ['قهوة مظبوطة.. توازن بين السكر والمرارة.', 'اسقني يانسون أو سحلب.'],
    waiting: ['الانتظار جزء من لذة الوصول.', 'معدتي تشعر بالوهم دلوقتي!'],
    complaining: ['حتى الصبر له حدود فلسفية.. أين طلبي؟'],
    happyDrink: ['يا للروعة! هذا الفنجان يختصر الحضارة.', 'أنت حكيم القهوة!'],
    badDrink: ['المرارة تذكرنا بأن الكمال صعب المنال.'],
    chatting: ['السعادة هي كرسي خشب ونسيم مروحة سقف.'],
    paying: ['تفضل ثمن المتعة، فالعملة مجرد رمز.'],
  },
  new_customer: {
    greeting: ['السلام عليكم، القعدة هنا شكلها أصيل!', 'أهلاً! القهوة بلدي وجميلة أوي.'],
    ordering: ['شاي مظبوط لو سمحت، سمعت إنه حكاية.', 'هاتلي شاي بالنعناع.'],
    waiting: ['المكان دافي ولذيذ أوي.', 'مستني الطلب، براحتك خالص.'],
    complaining: ['معلش بس دي أول مرة أجي والطلب اتأخر!'],
    happyDrink: ['واو! أحلى كوباية شاي شربتها!', 'هاجي تاني مع صحابي!'],
    badDrink: ['طعمها مختلف شوية بس شكراً.'],
    chatting: ['الزمالك مدرسة الفن والهندسة يا معلم!'],
    paying: ['اتفضل الحساب.. القعدة طلعت تحفة!'],
  },
  regular: {
    greeting: ['السلام عليكم يا معلم! القعدة ترد الروح.', 'صباح الفل يا ريس!'],
    ordering: ['نزلنا واحد على مزاجك يا معلم.', 'شاي مظبوط ع السريع.'],
    waiting: ['ع نار هادية بس اوعى تنساني.'],
    complaining: ['الناس جت بعدي وشربت وأنا لسه!'],
    happyDrink: ['تسلم إيدك يا كبير، مية مية!'],
    badDrink: ['محتاجة تظبيطة المرة الجاية يا ريس.'],
    chatting: ['الجو في القهوة النهاردة عسل والله.'],
    paying: ['أحلى مسا عليك يا معلم، اتفضل حسابك.'],
  },
};

export function createRandomEvent(id: RandomEventId): ActiveRandomEvent {
  switch (id) {
    case 'table_argument':
      return {
        id,
        titleAr: 'خناقة على الترابيزة!',
        titleEn: 'Table Argument',
        descriptionAr: 'اتنين زباين بيتخانقوا على أولوية القعدة، وصوتهم علي في القهوة.',
        descriptionEn: 'Two customers are arguing over the best table.',
        dialogueAr: 'عم حسني: "الترابيزة دي بتاعتي من سنة 98!"',
        choices: [
          {
            id: 'mediate',
            labelAr: 'صالحهم بكوباية شاي ضيافة',
            labelEn: 'Offer complimentary tea',
            effectTextAr: '+10 سمعة · +25 خبرة · -15ج',
            effectTextEn: '+10 Rep · +25 XP · -15 EGP',
            effects: [
              { kind: 'money', delta: -15, labelAr: '-15 ج', labelEn: '-15 EGP' },
              { kind: 'rep', delta: 10, labelAr: '+10 سمعة', labelEn: '+10 Rep' },
              { kind: 'xp', delta: 25, labelAr: '+25 خبرة', labelEn: '+25 XP' },
            ],
          },
          {
            id: 'strict',
            labelAr: 'احكم بالعدل: اللي قعد الأول يقعد',
            labelEn: 'First-come, first-served',
            effectTextAr: '+3 سمعة · +15 خبرة',
            effectTextEn: '+3 Rep · +15 XP',
            effects: [
              { kind: 'rep', delta: 3, labelAr: '+3 سمعة', labelEn: '+3 Rep' },
              { kind: 'xp', delta: 15, labelAr: '+15 خبرة', labelEn: '+15 XP' },
            ],
          },
        ],
      };
    case 'football_match':
      return {
        id,
        titleAr: 'ليلة ماتش القمة!',
        titleEn: 'Big Football Match',
        descriptionAr: 'الماتش بدأ ع التلفزيون والمشجعين مالوا القهوة!',
        descriptionEn: 'The big match started on TV and fans packed the cafe!',
        dialogueAr: 'حودة الكورجي: "علّي الصوت يا معلم!"',
        choices: [
          {
            id: 'hype',
            labelAr: 'شجّع معاهم وعلّي صوت الماتش',
            labelEn: 'Turn up TV & hype the crowd',
            effectTextAr: '+80ج · +8 سمعة · +30 خبرة',
            effectTextEn: '+80 EGP · +8 Rep · +30 XP',
            effects: [
              { kind: 'money', delta: 80, labelAr: '+80 ج', labelEn: '+80 EGP' },
              { kind: 'rep', delta: 8, labelAr: '+8 سمعة', labelEn: '+8 Rep' },
              { kind: 'xp', delta: 30, labelAr: '+30 خبرة', labelEn: '+30 XP' },
            ],
          },
          {
            id: 'calm',
            labelAr: 'وطّي الصوت شوية عشان الهدوء',
            labelEn: 'Keep volume moderate',
            effectTextAr: '+40ج · +4 سمعة · +15 خبرة',
            effectTextEn: '+40 EGP · +4 Rep · +15 XP',
            effects: [
              { kind: 'money', delta: 40, labelAr: '+40 ج', labelEn: '+40 EGP' },
              { kind: 'rep', delta: 4, labelAr: '+4 سمعة', labelEn: '+4 Rep' },
              { kind: 'xp', delta: 15, labelAr: '+15 خبرة', labelEn: '+15 XP' },
            ],
          },
        ],
      };
    case 'power_outage':
      return {
        id,
        titleAr: 'النور قطع فجأة!',
        titleEn: 'Power Outage!',
        descriptionAr: 'الكهربا قطعت في الشارع والتلفزيون فصل.',
        descriptionEn: 'Neighborhood power went out and lights dimmed.',
        dialogueAr: 'سمير: "حد معاه ولاعة ينورلنا بس!"',
        choices: [
          {
            id: 'candles',
            labelAr: 'ولّع فوانيس القهوة واحكي نكتة',
            labelEn: 'Light lanterns & keep spirits up',
            effectTextAr: '+7 سمعة · +25 خبرة',
            effectTextEn: '+7 Rep · +25 XP',
            effects: [
              { kind: 'rep', delta: 7, labelAr: '+7 سمعة', labelEn: '+7 Rep' },
              { kind: 'xp', delta: 25, labelAr: '+25 خبرة', labelEn: '+25 XP' },
            ],
          },
          {
            id: 'generator',
            labelAr: 'شغّل المولد الاحتياطي فوراً',
            labelEn: 'Start backup generator',
            effectTextAr: '-35ج · +10 سمعة',
            effectTextEn: '-35 EGP · +10 Rep',
            effects: [
              { kind: 'money', delta: -35, labelAr: '-35 ج', labelEn: '-35 EGP' },
              { kind: 'rep', delta: 10, labelAr: '+10 سمعة', labelEn: '+10 Rep' },
            ],
          },
        ],
      };
    case 'strange_order':
      return {
        id,
        titleAr: 'طلب غريب عجيب!',
        titleEn: 'Strange Drink Request',
        descriptionAr: 'زكي عايز "كركديه سخن بالنعناع وزيادة سكر في فنجان قهوة"!',
        descriptionEn: 'Zaki wants "Hot Hibiscus Mint Extra Sugar in a Coffee Cup"!',
        dialogueAr: 'الفيلسوف زكي: "عايز أختبر حدود المذاق!"',
        choices: [
          {
            id: 'accept_strange',
            labelAr: 'اقبل التحدي واعمّله الاختراع',
            labelEn: 'Make the custom concoction',
            effectTextAr: '+65ج · +6 سمعة · +30 خبرة',
            effectTextEn: '+65 EGP · +6 Rep · +30 XP',
            effects: [
              { kind: 'money', delta: 65, labelAr: '+65 ج', labelEn: '+65 EGP' },
              { kind: 'rep', delta: 6, labelAr: '+6 سمعة', labelEn: '+6 Rep' },
              { kind: 'xp', delta: 30, labelAr: '+30 خبرة', labelEn: '+30 XP' },
            ],
          },
          {
            id: 'suggest_normal',
            labelAr: 'اقنعه بشاي بالنعناع عادي',
            labelEn: 'Suggest regular Mint Tea',
            effectTextAr: '+22ج · +2 سمعة · +10 خبرة',
            effectTextEn: '+22 EGP · +2 Rep · +10 XP',
            effects: [
              { kind: 'money', delta: 22, labelAr: '+22 ج', labelEn: '+22 EGP' },
              { kind: 'rep', delta: 2, labelAr: '+2 سمعة', labelEn: '+2 Rep' },
              { kind: 'xp', delta: 10, labelAr: '+10 خبرة', labelEn: '+10 XP' },
            ],
          },
        ],
      };
    case 'forgotten_wallet':
      return {
        id,
        titleAr: 'نسي المحفظة في البيت!',
        titleEn: 'Forgotten Wallet',
        descriptionAr: 'زبون خلص مشروبه واكتشف إنه نسي محفظته!',
        descriptionEn: 'A guest finished his drink and realized he forgot his wallet!',
        dialogueAr: 'الزبون: "المحفظة في البنطلون التاني يا معلم!"',
        choices: [
          {
            id: 'forgive',
            labelAr: 'مشروبه ضيافة وحاسبه بكرة',
            labelEn: 'On the house today',
            effectTextAr: '+12 سمعة · +30 خبرة',
            effectTextEn: '+12 Rep · +30 XP',
            effects: [
              { kind: 'rep', delta: 12, labelAr: '+12 سمعة', labelEn: '+12 Rep' },
              { kind: 'xp', delta: 30, labelAr: '+30 خبرة', labelEn: '+30 XP' },
            ],
          },
          {
            id: 'wash_cups',
            labelAr: 'يمسح ترابيزة قصاد الحساب',
            labelEn: 'Wipe a table for the tab',
            effectTextAr: '+20ج · +2 سمعة · +15 خبرة',
            effectTextEn: '+20 EGP · +2 Rep · +15 XP',
            effects: [
              { kind: 'money', delta: 20, labelAr: '+20 ج', labelEn: '+20 EGP' },
              { kind: 'rep', delta: 2, labelAr: '+2 سمعة', labelEn: '+2 Rep' },
              { kind: 'xp', delta: 15, labelAr: '+15 خبرة', labelEn: '+15 XP' },
            ],
          },
        ],
      };
    case 'master_arrives':
      return {
        id,
        titleAr: 'المعلم الكبير شرفنا!',
        titleEn: 'The Master Arrives!',
        descriptionAr: 'كبير المنطقة دخل القهوة بنفسه وبيجرّب الضيافة.',
        descriptionEn: 'The neighborhood Master arrived to test your coffeehouse.',
        dialogueAr: 'المعلم: "ورّيني شطارتك يا ابني!"',
        choices: [
          {
            id: 'vip_service',
            labelAr: 'قدّمله قهوة محوجة وسحلب VIP',
            labelEn: 'Serve VIP spiced coffee',
            effectTextAr: '+120ج · -20ج خامات · +12 سمعة',
            effectTextEn: '+120 EGP · -20 EGP · +12 Rep',
            effects: [
              { kind: 'money', delta: 120, labelAr: '+120 ج', labelEn: '+120 EGP' },
              { kind: 'money', delta: -20, labelAr: '-20 ج خامات', labelEn: '-20 EGP' },
              { kind: 'rep', delta: 12, labelAr: '+12 سمعة', labelEn: '+12 Rep' },
            ],
          },
          {
            id: 'normal_service',
            labelAr: 'عامله زي أي زبون باحترام',
            labelEn: 'Standard respectful service',
            effectTextAr: '+45ج · +4 سمعة · +20 خبرة',
            effectTextEn: '+45 EGP · +4 Rep · +20 XP',
            effects: [
              { kind: 'money', delta: 45, labelAr: '+45 ج', labelEn: '+45 EGP' },
              { kind: 'rep', delta: 4, labelAr: '+4 سمعة', labelEn: '+4 Rep' },
              { kind: 'xp', delta: 20, labelAr: '+20 خبرة', labelEn: '+20 XP' },
            ],
          },
        ],
      };
    case 'missing_ingredients':
      return {
        id,
        titleAr: 'نقص مفاجئ في المخزن!',
        titleEn: 'Emergency Supply Shortage',
        descriptionAr: 'علبة السكر والشاي قربت تخلص وسط الزحمة!',
        descriptionEn: 'Tea and sugar are running low during the rush!',
        dialogueAr: 'عم رمضان: "الحق يا معلم! السكر بيخلص!"',
        choices: [
          {
            id: 'buy_rush',
            labelAr: 'اشتري طوارئ من البقالة اللي جنبنا',
            labelEn: 'Buy emergency pack next door',
            effectTextAr: '+10 شاي · +15 سكر · -45ج',
            effectTextEn: '+10 Tea · +15 Sugar · -45 EGP',
            effects: [
              { kind: 'stock', delta: 25, labelAr: '+10 شاي / +15 سكر', labelEn: '+10 Tea / +15 Sugar' },
              { kind: 'money', delta: -45, labelAr: '-45 ج', labelEn: '-45 EGP' },
            ],
          },
          {
            id: 'stretch',
            labelAr: 'مشّي الحال بالموجود حالياً',
            labelEn: 'Manage with current stock',
            effectTextAr: '+10 خبرة',
            effectTextEn: '+10 XP',
            effects: [{ kind: 'xp', delta: 10, labelAr: '+10 خبرة', labelEn: '+10 XP' }],
          },
        ],
      };
    case 'unexpected_crowds':
    default:
      return {
        id: 'unexpected_crowds',
        titleAr: 'هجمة زباين مفاجئة!',
        titleEn: 'Unexpected Crowd Rush!',
        descriptionAr: 'معازيم فرح وقفوا قدام القهوة ودخلوا يشربوا شاي!',
        descriptionEn: 'A cheerful wedding convoy just poured into the cafe!',
        dialogueAr: 'الكل: "يا معلم، لفة شاي بالنعناع لكل الترابيزات!"',
        choices: [
          {
            id: 'rally',
            labelAr: 'استقبلهم كلهم وجهّز البراد الكبير',
            labelEn: 'Welcome everyone & brew fast',
            effectTextAr: '+100ج · +10 سمعة · +35 خبرة',
            effectTextEn: '+100 EGP · +10 Rep · +35 XP',
            effects: [
              { kind: 'money', delta: 100, labelAr: '+100 ج', labelEn: '+100 EGP' },
              { kind: 'rep', delta: 10, labelAr: '+10 سمعة', labelEn: '+10 Rep' },
              { kind: 'xp', delta: 35, labelAr: '+35 خبرة', labelEn: '+35 XP' },
            ],
          },
          {
            id: 'limit',
            labelAr: 'اقعد على قد الكراسي الفاضية بس',
            labelEn: 'Seat available tables calmly',
            effectTextAr: '+45ج · +4 سمعة · +15 خبرة',
            effectTextEn: '+45 EGP · +4 Rep · +15 XP',
            effects: [
              { kind: 'money', delta: 45, labelAr: '+45 ج', labelEn: '+45 EGP' },
              { kind: 'rep', delta: 4, labelAr: '+4 سمعة', labelEn: '+4 Rep' },
              { kind: 'xp', delta: 15, labelAr: '+15 خبرة', labelEn: '+15 XP' },
            ],
          },
        ],
      };
  }
}


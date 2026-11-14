import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DRINKS } from '../game/catalog';
import {
  DIALOGUE_BANK,
  NAMED_CHARACTERS,
  RANDOM_REGULAR_NAMES,
} from '../game/dialogue';
import { getTimeOfDayInfo } from '../game/economy';
import {
  CustomerActivity,
  CameraMode,
  CarriedDrink,
  CustomerArchetype,
  CustomerData,
  DrinkId,
  EmployeeRole,
  GameScreenState,
  GameState,
  GraphicsPreset,
  HeadwearType,
  InteractionPrompt,
  Order,
  OutfitStyleType,
  TimeOfDay,
  BodyBuild,
  MustacheStyle,
} from '../game/types';
import {
  segmentIntersectsAABB,
  solveThirdPersonCamera,
} from './cameraMath';
import {
  CharacterRig,
  createBaladiChair,
  createBaladiTable,
  createBrassLantern,
  createCashierDesk,
  createCeilingFan,
  createCharacterRig,
  createFramedPortrait,
  createNewspaperStack,
  createPrepCounter,
  createShishaCorner,
  createShishaProp,
  createStorageRack,
  createTawlaBoard,
  createVintageRadio,
} from './models';
import {
  createContactShadowTexture,
  createLightShaftTexture,
  createNewspaperTexture,
  createPosterTexture,
  createRadioDialTexture,
  createSignTexture,
  createTawlaBoardTexture,
  createTileFloorTextures,
  createUmmKulthumPosterTexture,
  createWoodTexture,
  createWovenCaneTexture,
  drawTVMatchFrame,
} from './textures';

export interface ProjectedBubble {
  id: string;
  nameAr: string;
  text: string;
  state: CustomerData['state'];
  activity: CustomerActivity;
  orderDrinkId: DrinkId | null;
  patiencePct: number;
  x: number; // viewport px
  y: number;
  visible: boolean;
}

export interface EngineCallbacks {
  onOrderCreated: (order: Order) => void;
  onOrderDelivered: (
    orderId: string,
    customer: CustomerData,
    quality: number,
    tableDirty: boolean
  ) => void;
  onCustomerComplaint: (customer: CustomerData) => void;
  onTableCleaned: (tableId: number, byEmployee: boolean) => void;
  onPromptChanged: (prompt: InteractionPrompt | null) => void;
  onBubblesUpdated: (bubbles: ProjectedBubble[]) => void;
  onCarriedChanged: (carried: CarriedDrink | null) => void;
  onClockTick: (deltaMinutes: number) => void;
  onBaristaCompleteOrder: (orderId: string, drinkId: DrinkId, quality: number) => void;
  onSoundEvent: (event: 'door' | 'clink' | 'voice' | 'clean') => void;
  onInteractTrigger: (prompt: InteractionPrompt) => void;
  onCameraModeChanged: (mode: CameraMode) => void;
}

interface TableNode {
  id: number;
  pos: THREE.Vector3;
  unlocked: boolean;
  isDirty: boolean;
  seats: Array<{
    pos: THREE.Vector3;
    rotY: number;
    occupiedBy: string | null;
  }>;
  tableMesh: ReturnType<typeof createBaladiTable>;
  chairMeshes: THREE.Group[];
  shishaProp: THREE.Group;
}

interface ActiveNPC {
  data: CustomerData;
  rig: CharacterRig;
  pos: THREE.Vector3;
  rotY: number;
  targetPos: THREE.Vector3;
  waypoints: THREE.Vector3[];
  stateTimer: number;
  walkPhase: number;
  activityPhase: number;
}

interface ActiveEmployeeNPC {
  role: EmployeeRole;
  rig: CharacterRig;
  pos: THREE.Vector3;
  rotY: number;
  targetPos: THREE.Vector3;
  carryingOrder: Order | null;
  taskTimer: number;
  walkPhase: number;
}

interface ObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface ObstacleCircle {
  x: number;
  z: number;
  r: number;
}

interface OccludableWall {
  materials: THREE.MeshStandardMaterial[];
  box: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
}

interface SmokePuff {
  mesh: THREE.Mesh;
  age: number;
  maxAge: number;
  origin: THREE.Vector3;
  active: boolean;
}

const _vec3 = new THREE.Vector3();
const _proj = new THREE.Vector3();
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _camRaycaster = new THREE.Raycaster();
const _camHits: THREE.Intersection[] = [];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class CoffeehouseEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private frameId = 0;
  private disposed = false;
  private loopRunning = false;
  private pageHidden = typeof document !== 'undefined' && document.hidden;

  // Lighting & Atmosphere
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private lanternLights: THREE.PointLight[] = [];
  private lanternGlowMats: THREE.MeshStandardMaterial[] = [];
  private windowBackdropMats: THREE.MeshBasicMaterial[] = [];
  private lightShaftMats: THREE.MeshBasicMaterial[] = [];
  private smokePuffs: SmokePuff[] = [];
  private smokeEmitTimer = 0;

  // Textures & Shared Materials
  private shadowTex!: THREE.Texture;
  private woodTex!: THREE.Texture;
  private caneTexWorn!: THREE.Texture;
  private caneTexUpgraded!: THREE.Texture;
  private newsTex!: THREE.Texture;
  private tawlaTex!: THREE.Texture;
  private tvCanvas!: HTMLCanvasElement;
  private tvCtx!: CanvasRenderingContext2D;
  private tvTexture!: THREE.CanvasTexture;
  private tvDrawAccumulator = 0;

  // Dynamic Upgradeable Scene Props & Camera Occludables
  private prepCounterGroup: THREE.Group | null = null;
  private storageGroup: THREE.Group | null = null;
  private tvGroup: THREE.Group | null = null;
  private decorGroup: THREE.Group | null = null;
  private lanternsGroup: THREE.Group | null = null;
  private ceilingFans: Array<{ group: THREE.Group; blades: THREE.Group }> = [];
  private doorLeftPivot!: THREE.Group;
  private doorRightPivot!: THREE.Group;
  private doorOpenAmount = 0;
  private doorManualOpen = false;
  private wallClockMinuteHand!: THREE.Mesh;
  private raycastWalls: THREE.Object3D[] = [];
  private occludables: OccludableWall[] = [];

  // Tables & Collisions
  private tables: TableNode[] = [];
  private staticBoxes: ObstacleBox[] = [];
  private tableCircles: ObstacleCircle[] = [];

  // Player
  private playerRig!: CharacterRig;
  private playerPos = new THREE.Vector3(0, 0, 0.9);
  private playerRotY = Math.PI; // facing -Z into the coffeehouse
  private playerWalkPhase = 0;
  private playerSittingTableId: number | null = null;
  private playerSeatIndex: number | null = null;
  private carriedDrink: CarriedDrink | null = null;

  // Input State
  private keys = new Set<string>();
  private joystick = { x: 0, y: 0 };
  private runToggle = false;
  private camMode: CameraMode = 'third_person';
  private camYaw = 0;
  private camPitch = 0.56;
  private camDist = 5.6;
  private camSensitivity = 1.0;
  private freeLookTarget = new THREE.Vector3(0, 1.15, 0.2);
  private currentLookAt = new THREE.Vector3(0, 1.1, 0.9);

  // Simulation State synced from React
  private screenState: GameScreenState = 'title';
  private gameStateSnapshot: GameState;
  private activeOrders: Order[] = [];
  private powerOutageActive = false;

  // NPCs & Employees
  private npcs: ActiveNPC[] = [];
  private employeeNPCs: ActiveEmployeeNPC[] = [];
  private npcSpawnTimer = 1.5;
  private npcCounter = 1;
  private orderCounter = 1;

  // Throttling UI projections
  private lastBubbleEmit = 0;
  private lastPromptKey = '';
  private clockAccumulator = 0;
  private simElapsed = 0;
  private lastTickMs = 0;
  private lastRenderMs = 0;

  constructor(
    container: HTMLElement,
    initialState: GameState,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.gameStateSnapshot = initialState;
    this.camSensitivity = initialState.settings.cameraSensitivity;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const initialGraphics = initialState.settings.graphics;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && initialGraphics !== 'low',
      powerPreference: initialGraphics === 'low' ? 'low-power' : 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl
        ? 1
        : Math.min(
            window.devicePixelRatio || 1,
            initialGraphics === 'low' ? 0.85 : initialGraphics === 'medium' ? 1.2 : 1.6
          )
    );
    this.renderer.shadowMap.enabled =
      !this.isSoftwareGl && initialGraphics !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const w = Math.max(320, container.clientWidth || window.innerWidth);
    const h = Math.max(240, container.clientHeight || window.innerHeight);
    this.renderer.setSize(w, h);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1d130c');
    this.scene.fog = new THREE.FogExp2('#1d130c', 0.022);

    this.camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 60);
    this.camera.position.set(0, 3.85, 5.45);

    // Skip expensive image-based reflections on Low to reduce startup time and GPU memory.
    if (initialGraphics !== 'low') {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      this.scene.environmentIntensity = initialGraphics === 'medium' ? 0.22 : 0.36;
      pmrem.dispose();
    }

    this.initTextures();
    this.initLighting();
    this.buildArchitecture();
    this.buildDynamicZones();
    this.buildTables();
    this.initPlayer();
    this.syncEmployees();

    // Seed 2 initial lively customers seated at tables so the cafe feels alive from second 1!
    this.spawnCustomer('uncle_hosny', true);
    this.spawnCustomer('el_moallem', true);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.lastTickMs = performance.now();
    this.startLoop();
  }

  private initTextures(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.shadowTex = createContactShadowTexture();
    this.woodTex = createWoodTexture('#5e3419', maxAniso);
    this.caneTexWorn = createWovenCaneTexture(false);
    this.caneTexUpgraded = createWovenCaneTexture(true);
    this.newsTex = createNewspaperTexture();
    this.tawlaTex = createTawlaBoardTexture();

    this.tvCanvas = document.createElement('canvas');
    this.tvCanvas.width = 256;
    this.tvCanvas.height = 160;
    this.tvCtx = this.tvCanvas.getContext('2d')!;
    drawTVMatchFrame(this.tvCtx, 0, false);
    this.tvTexture = new THREE.CanvasTexture(this.tvCanvas);
    this.tvTexture.colorSpace = THREE.SRGBColorSpace;
  }

  private initLighting(): void {
    this.hemiLight = new THREE.HemisphereLight('#ffe7c2', '#3a2214', 0.56);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight('#ffddb0', 1.65);
    this.keyLight.position.set(-5.8, 7.2, 4.2);
    this.keyLight.castShadow =
      !this.isSoftwareGl && this.gameStateSnapshot.settings.graphics !== 'low';
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 24;
    this.keyLight.shadow.camera.left = -9.5;
    this.keyLight.shadow.camera.right = 9.5;
    this.keyLight.shadow.camera.top = 9.5;
    this.keyLight.shadow.camera.bottom = -9.5;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.keyLight.shadow.radius = 4;
    this.scene.add(this.keyLight);

    // Warm interior lantern & window pools (unshadowed point lights for rich warmth)
    const warm1 = new THREE.PointLight('#ffad42', 3.6, 13, 1.45);
    warm1.position.set(-2.5, 3.35, -1.8);
    this.scene.add(warm1);
    this.lanternLights.push(warm1);

    const warm2 = new THREE.PointLight('#ffad42', 3.6, 13, 1.45);
    warm2.position.set(2.4, 3.35, 1.8);
    this.scene.add(warm2);
    this.lanternLights.push(warm2);

    // Pre-allocate 12 shisha smoke puff meshes so zero allocations happen during update
    const puffGeo = new THREE.SphereGeometry(0.06, 8, 8);
    for (let i = 0; i < 12; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: '#f5f5f4',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(puffGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.smokePuffs.push({
        mesh,
        age: 0,
        maxAge: 2.2,
        origin: new THREE.Vector3(),
        active: false,
      });
    }
  }

  private buildArchitecture(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const { map: floorMap, bumpMap: floorBump } = createTileFloorTextures(maxAniso);

    // Patterned Ceramic Tile Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 13),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: floorMap,
        bumpMap: floorBump,
        bumpScale: 0.015,
        roughness: 0.42,
        metalness: 0.04,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Traditional central woven rug (offset Y >= 0.02 so zero Z-fighting)
    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.02, 2.5),
      new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.92 })
    );
    rug.position.set(0, 0.02, 0.2);
    rug.receiveShadow = true;
    this.scene.add(rug);

    const rugBorder = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.024, 2.1),
      new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.88 })
    );
    rugBorder.position.set(0, 0.022, 0.2);
    this.scene.add(rugBorder);

    // Walls (Each slab owns its material pair so blocking walls can fade semi-transparent)
    const addWall = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const upperMat = new THREE.MeshStandardMaterial({
        color: '#e6d3b3',
        roughness: 0.85,
        metalness: 0.02,
      });
      const lowerMat = new THREE.MeshStandardMaterial({
        map: this.woodTex,
        roughness: 0.65,
      });

      const upper = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), upperMat);
      upper.position.set(x, y, z);
      upper.receiveShadow = true;
      this.scene.add(upper);

      const lower = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 1.2, d + 0.02), lowerMat);
      lower.position.set(x, 0.6, z);
      lower.receiveShadow = true;
      this.scene.add(lower);

      this.raycastWalls.push(upper, lower);
      this.occludables.push({
        materials: [upperMat, lowerMat],
        box: {
          minX: x - w / 2 - 0.15,
          maxX: x + w / 2 + 0.15,
          minY: 0,
          maxY: 4.6,
          minZ: z - d / 2 - 0.15,
          maxZ: z + d / 2 + 0.15,
        },
      });
    };

    // North wall (z = -6.5), West (x = -7.5), East (x = 7.5)
    addWall(15.2, 4.6, 0.3, 0, 2.3, -6.5);
    addWall(0.3, 4.6, 13.2, -7.5, 2.3, 0);
    addWall(0.3, 4.6, 13.2, 7.5, 2.3, 0);

    // South wall split around solid doorway jambs (door width 2.2m centered at x=0)
    addWall(6.4, 4.6, 0.3, -4.3, 2.3, 6.5);
    addWall(6.4, 4.6, 0.3, 4.3, 2.3, 6.5);
    // Door lintel above doorway
    const lintelMat = new THREE.MeshStandardMaterial({
      color: '#e6d3b3',
      roughness: 0.85,
      metalness: 0.02,
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.9, 0.32), lintelMat);
    lintel.position.set(0, 3.65, 6.5);
    this.scene.add(lintel);
    this.raycastWalls.push(lintel);
    this.occludables.push({
      materials: [lintelMat],
      box: { minX: -1.3, maxX: 1.3, minY: 2.6, maxY: 4.6, minZ: 6.25, maxZ: 6.75 },
    });

    // Double-leaf Wooden Entrance Door
    const jambMat = new THREE.MeshStandardMaterial({ color: '#3b2110', roughness: 0.6 });
    [-1.12, 1.12].forEach((jx) => {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.75, 0.38), jambMat);
      jamb.position.set(jx, 1.375, 6.5);
      this.scene.add(jamb);
    });

    const createDoorLeaf = (side: -1 | 1) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 1.05, 0, 6.45);
      const leafMat = new THREE.MeshStandardMaterial({
        map: this.woodTex,
        roughness: 0.65,
      });
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.02, 2.65, 0.08), leafMat);
      leaf.position.set(-side * 0.51, 1.325, 0);
      leaf.castShadow = true;
      pivot.add(leaf);

      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 1.25, 0.095),
        new THREE.MeshStandardMaterial({
          color: '#fef3c7',
          emissive: '#f59e0b',
          emissiveIntensity: 0.22,
          transparent: true,
          opacity: 0.55,
          roughness: 0.15,
        })
      );
      glass.position.set(-side * 0.51, 1.75, 0);
      pivot.add(glass);

      const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 8),
        new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.85, roughness: 0.2 })
      );
      handle.position.set(-side * 0.9, 1.1, -0.07);
      pivot.add(handle);
      this.scene.add(pivot);

      this.occludables.push({
        materials: [leafMat],
        box: {
          minX: side < 0 ? -1.15 : -0.05,
          maxX: side < 0 ? 0.05 : 1.15,
          minY: 0,
          maxY: 2.7,
          minZ: 6.1,
          maxZ: 6.8,
        },
      });
      return pivot;
    };

    this.doorLeftPivot = createDoorLeaf(-1);
    this.doorRightPivot = createDoorLeaf(1);

    // Ceiling & Exposed Dark Wood Beams
    const ceilingMat = new THREE.MeshStandardMaterial({ color: '#422817', roughness: 0.85 });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 13.2), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4.6;
    this.scene.add(ceiling);

    const beamMat = new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.68 });
    for (let z = -4.5; z <= 4.5; z += 3.0) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(15, 0.22, 0.26), beamMat);
      beam.position.set(0, 4.49, z);
      this.scene.add(beam);
    }

    // 2 Rotating Ceiling Fans
    [-2.5, 2.5].forEach((fx) => {
      const fan = createCeilingFan();
      fan.group.position.set(fx, 4.4, 0.2);
      this.scene.add(fan.group);
      this.ceilingFans.push(fan);
    });

    // 2 Mashrabiya Windows on West Wall + Warm Golden Light Shafts
    const shaftTex = createLightShaftTexture();
    [-0.5, 2.9].forEach((wz) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.9, 1.6), jambMat);
      frame.position.set(-7.36, 2.45, wz);
      this.scene.add(frame);

      const skyMat = new THREE.MeshBasicMaterial({ color: '#fbbf24' });
      this.windowBackdropMats.push(skyMat);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.7), skyMat);
      pane.rotation.y = Math.PI / 2;
      pane.position.set(-7.32, 2.45, wz);
      this.scene.add(pane);

      // Lattice bars
      for (let i = -2; i <= 2; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.7, 0.05), jambMat);
        bar.position.set(-7.28, 2.45, wz + i * 0.28);
        this.scene.add(bar);
      }

      // Soft golden sun/lamp beam angled from the window onto the cafe floor
      const shaftMat = new THREE.MeshBasicMaterial({
        map: shaftTex,
        color: '#ffe29c',
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      this.lightShaftMats.push(shaftMat);
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.6), shaftMat);
      shaft.position.set(-5.85, 1.65, wz);
      shaft.rotation.y = Math.PI / 2;
      shaft.rotation.x = -0.68;
      this.scene.add(shaft);
    });

    // Warm Entrance Door Light Shaft
    const doorShaftMat = new THREE.MeshBasicMaterial({
      map: shaftTex,
      color: '#ffd98c',
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.lightShaftMats.push(doorShaftMat);
    const doorShaft = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 3.2), doorShaftMat);
    doorShaft.position.set(0, 1.35, 5.15);
    doorShaft.rotation.x = 0.66;
    this.scene.add(doorShaft);

    // Main Hanging Sign above Prep Counter
    const signTex = createSignTexture('القهوة البلدي', 'أصل الضيافة والمزاج المصري');
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.25, 0.08),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45 })
    );
    signBoard.position.set(-1.5, 3.25, -6.32);
    this.scene.add(signBoard);

    // Wall Clock on North Wall
    const clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.06, 20),
      new THREE.MeshStandardMaterial({ color: '#fef9c3', roughness: 0.4 })
    );
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(3.8, 3.2, -6.32);
    this.scene.add(clockFace);

    const clockRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.04, 8, 24),
      new THREE.MeshStandardMaterial({ color: '#d4a04a', metalness: 0.85, roughness: 0.25 })
    );
    clockRim.position.set(3.8, 3.2, -6.3);
    this.scene.add(clockRim);

    this.wallClockMinuteHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.24, 0.02),
      new THREE.MeshBasicMaterial({ color: '#1c1917' })
    );
    this.wallClockMinuteHand.position.set(3.8, 3.2, -6.27);
    this.scene.add(this.wallClockMinuteHand);

    // Cashier Desk + Vintage Tube Radio ("راديو قديم")
    const cashier = createCashierDesk(this.woodTex);
    cashier.position.set(4.1, 0, -5.55);
    this.scene.add(cashier);

    const radio = createVintageRadio(createRadioDialTexture());
    radio.position.set(4.8, 1.0, -5.65);
    radio.rotation.y = -0.35;
    this.scene.add(radio);

    // Shisha Corner with Coiled Pipes on Floor ("أنابيب شيشة على الأرض")
    const shishaCorner = createShishaCorner(this.woodTex);
    shishaCorner.position.set(6.2, 0, -3.2);
    shishaCorner.rotation.y = -0.6;
    this.scene.add(shishaCorner);

    // Static collision boxes (Counter, Cashier, Storage, Shisha Corner)
    this.staticBoxes.push(
      { minX: -4.1, maxX: 0.2, minZ: -6.3, maxZ: -4.7 }, // Prep counter
      { minX: 3.1, maxX: 5.1, minZ: -6.2, maxZ: -4.8 }, // Cashier
      { minX: -7.4, maxX: -5.3, minZ: -5.6, maxZ: -3.2 }, // Storage rack
      { minX: 5.5, maxX: 7.0, minZ: -3.8, maxZ: -2.6 } // Shisha corner
    );
  }

  private buildDynamicZones(): void {
    const upg = this.gameStateSnapshot.upgrades;

    // 1. Prep Counter (with Brass Tea Machine)
    if (this.prepCounterGroup) this.scene.remove(this.prepCounterGroup);
    this.prepCounterGroup = createPrepCounter(this.woodTex, upg.brass_kettle);
    this.prepCounterGroup.position.set(-2.0, 0, -5.5);
    this.scene.add(this.prepCounterGroup);

    // 2. Storage Corner
    if (this.storageGroup) this.scene.remove(this.storageGroup);
    this.storageGroup = createStorageRack(this.woodTex, upg.storage_rack);
    this.storageGroup.position.set(-6.45, 0, -4.4);
    this.storageGroup.rotation.y = Math.PI / 2;
    this.scene.add(this.storageGroup);

    // 3. TV Area on North-East Wall (clearly visible from main coffeehouse view)
    if (this.tvGroup) this.scene.remove(this.tvGroup);
    this.tvGroup = new THREE.Group();
    this.tvGroup.position.set(5.95, 2.75, -6.18);
    this.tvGroup.rotation.y = -0.22;

    const tvW = upg.big_tv ? 2.5 : 1.45;
    const tvH = upg.big_tv ? 1.45 : 0.98;
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(tvW + 0.18, tvH + 0.18, upg.big_tv ? 0.12 : 0.45),
      new THREE.MeshStandardMaterial({
        color: upg.big_tv ? '#111827' : '#4a2c18',
        roughness: 0.45,
      })
    );
    this.tvGroup.add(bezel);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(tvW, tvH),
      new THREE.MeshBasicMaterial({ map: this.tvTexture })
    );
    screen.position.z = upg.big_tv ? 0.07 : 0.235;
    this.tvGroup.add(screen);
    this.scene.add(this.tvGroup);

    // 4. Wall Decor (Umm Kulthum Portrait always hung + Classic Posters + Bunting)
    if (this.decorGroup) this.scene.remove(this.decorGroup);
    this.decorGroup = new THREE.Group();

    const ummKulthum = createFramedPortrait(createUmmKulthumPosterTexture(), 0.98, 1.32);
    ummKulthum.position.set(1.3, 2.65, -6.31);
    this.decorGroup.add(ummKulthum);

    const cinemaFrame = createFramedPortrait(
      createPosterTexture('كلاسيكيات السينما', '#7c2d12', 'cinema'),
      0.85,
      1.18
    );
    cinemaFrame.position.set(-4.9, 2.65, -6.31);
    this.decorGroup.add(cinemaFrame);

    if (upg.wall_decor) {
      const poster2 = createFramedPortrait(
        createPosterTexture('شاي المعلم', '#166534', 'tea'),
        0.92,
        1.25
      );
      poster2.position.set(7.32, 2.5, 2.0);
      poster2.rotation.y = -Math.PI / 2;
      this.decorGroup.add(poster2);

      const poster3 = createFramedPortrait(
        createPosterTexture('نهائي الكأس', '#991b1b', 'football'),
        0.95,
        1.25
      );
      poster3.position.set(7.32, 2.5, -3.9);
      poster3.rotation.y = -Math.PI / 2;
      this.decorGroup.add(poster3);

      // Colorful overhead bunting flags
      const colors = ['#dc2626', '#facc15', '#16a34a', '#2563eb'];
      for (let i = 0; i < 10; i++) {
        const flag = new THREE.Mesh(
          new THREE.ConeGeometry(0.14, 0.24, 3),
          new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.7 })
        );
        flag.rotation.x = Math.PI;
        flag.position.set(-4.5 + i * 1.0, 4.1, -3.5 + Math.sin(i * 0.6) * 0.2);
        this.decorGroup.add(flag);
      }
    }
    this.scene.add(this.decorGroup);

    // 5. Brass Lanterns ("فوانيس")
    if (this.lanternsGroup) this.scene.remove(this.lanternsGroup);
    this.lanternsGroup = new THREE.Group();
    this.lanternGlowMats = [];
    const lanternPositions: Array<[number, number]> = upg.brass_lanterns
      ? [
          [-2.5, -1.6],
          [2.2, -1.6],
          [-2.5, 2.0],
          [2.2, 2.0],
          [0, -4.0],
          [0, 3.8],
        ]
      : [
          [-2.5, -1.6],
          [2.2, -1.6],
          [0, 1.8],
        ];
    lanternPositions.forEach(([lx, lz]) => {
      const l = createBrassLantern();
      l.group.position.set(lx, 4.55, lz);
      this.lanternsGroup!.add(l.group);
      this.lanternGlowMats.push(l.glowMat);
    });
    this.scene.add(this.lanternsGroup);
  }

  private buildTables(): void {
    // Clear previous meshes if rebuilding on upgrade
    this.tables.forEach((t) => {
      this.scene.remove(t.tableMesh.group);
      this.scene.remove(t.shishaProp);
      t.chairMeshes.forEach((c) => this.scene.remove(c));
    });
    this.tables = [];
    this.tableCircles = [];

    const upg = this.gameStateSnapshot.upgrades;
    const caneTex = upg.wood_chairs ? this.caneTexUpgraded : this.caneTexWorn;
    const layout: Array<{ id: number; x: number; z: number; unlocked: boolean }> = [
      { id: 1, x: -2.4, z: -1.6, unlocked: true },
      { id: 2, x: 2.3, z: -1.6, unlocked: true },
      { id: 3, x: -2.4, z: 2.0, unlocked: true },
      { id: 4, x: 2.3, z: 2.0, unlocked: true },
      { id: 5, x: -4.9, z: 0.2, unlocked: upg.table_5 },
      { id: 6, x: 4.9, z: 1.8, unlocked: upg.table_6 },
    ];

    layout.forEach((cfg) => {
      const tableMesh = createBaladiTable(this.woodTex, upg.wood_chairs);
      tableMesh.group.position.set(cfg.x, 0, cfg.z);
      tableMesh.group.visible = cfg.unlocked;
      this.scene.add(tableMesh.group);

      // Authentic tabletop details: Tawla boards on tables 2 & 3, Newspapers on 1 & 4
      if (cfg.id === 2 || cfg.id === 3) {
        const tawla = createTawlaBoard(this.tawlaTex);
        tawla.position.set(0, 0.805, 0);
        tawla.rotation.y = cfg.id === 2 ? 0.14 : -0.18;
        tableMesh.group.add(tawla);
      } else if (cfg.id === 1 || cfg.id === 4) {
        const news = createNewspaperStack(this.newsTex);
        news.position.set(0.06, 0.79, -0.15);
        news.rotation.y = cfg.id === 1 ? 0.35 : -0.28;
        tableMesh.group.add(news);
      }

      // Resting floor shisha beside tables 1 & 4 (visible when a shisha smoker sits here)
      const shishaProp = createShishaProp(false);
      shishaProp.position.set(cfg.x + 0.56, 0, cfg.z + 0.52);
      shishaProp.visible = cfg.unlocked && (cfg.id === 1 || cfg.id === 4);
      this.scene.add(shishaProp);

      const seatConfigs: Array<{ dx: number; dz: number; rotY: number }> = [
        { dx: -1.02, dz: 0, rotY: Math.PI / 2 },
        { dx: 1.02, dz: 0, rotY: -Math.PI / 2 },
      ];

      const chairMeshes: THREE.Group[] = [];
      const seats = seatConfigs.map((sc, idx) => {
        const chair = createBaladiChair(this.woodTex, upg.wood_chairs, caneTex);
        chair.position.set(cfg.x + sc.dx, 0, cfg.z + sc.dz);
        // Subtle natural angle jitter on worn chairs so the cafe feels lived-in
        const jitter = upg.wood_chairs ? 0 : (idx === 0 ? 0.08 : -0.07);
        chair.rotation.y = sc.rotY + jitter;
        chair.visible = cfg.unlocked;
        this.scene.add(chair);
        chairMeshes.push(chair);

        return {
          pos: new THREE.Vector3(cfg.x + sc.dx, 0, cfg.z + sc.dz),
          rotY: sc.rotY,
          occupiedBy: null as string | null,
        };
      });

      if (cfg.unlocked) {
        this.tableCircles.push({ x: cfg.x, z: cfg.z, r: 0.85 });
      }

      this.tables.push({
        id: cfg.id,
        pos: new THREE.Vector3(cfg.x, 0, cfg.z),
        unlocked: cfg.unlocked,
        isDirty: false,
        seats,
        tableMesh,
        chairMeshes,
        shishaProp,
      });
    });
  }

  private initPlayer(): void {
    this.playerRig = createCharacterRig(
      {
        shirtColor: '#f8fafc',
        pantsColor: '#1e293b',
        skinColor: '#d99b6a',
        hairColor: '#1a1513',
        apronColor: '#1d4ed8',
        headwear: 'cap',
        outfitStyle: 'shirt',
        hasMustache: true,
        isOwner: true,
      },
      this.shadowTex
    );
    this.playerRig.group.position.copy(this.playerPos);
    this.playerRig.group.rotation.y = this.playerRotY;
    this.scene.add(this.playerRig.group);
  }

  public syncState(
    nextState: GameState,
    orders: Order[],
    screenState: GameScreenState,
    powerOutage: boolean
  ): void {
    const prevUpgrades = this.gameStateSnapshot.upgrades;
    const prevGraphics = this.gameStateSnapshot.settings.graphics;
    const prevEmpSig = this.gameStateSnapshot.employees
      .map((e) => `${e.id}:${e.hired}:${e.assigned}`)
      .join('|');

    this.gameStateSnapshot = nextState;
    this.activeOrders = orders;
    this.screenState = screenState;
    this.powerOutageActive = powerOutage;
    this.camSensitivity = nextState.settings.cameraSensitivity;

    if (prevGraphics !== nextState.settings.graphics) {
      this.applyGraphicsPreset(nextState.settings.graphics);
    }

    const upgradesChanged = (Object.keys(prevUpgrades) as Array<keyof typeof prevUpgrades>).some(
      (k) => prevUpgrades[k] !== nextState.upgrades[k]
    );
    if (upgradesChanged) {
      this.buildDynamicZones();
      this.buildTables();
    }

    const nextEmpSig = nextState.employees
      .map((e) => `${e.id}:${e.hired}:${e.assigned}`)
      .join('|');
    if (prevEmpSig !== nextEmpSig) {
      this.syncEmployees();
    }
  }

  private applyGraphicsPreset(preset: GraphicsPreset): void {
    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      return;
    }
    if (preset === 'low') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.85));
      this.renderer.shadowMap.enabled = false;
      this.keyLight.castShadow = false;
    } else if (preset === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.2));
      this.renderer.shadowMap.enabled = true;
      this.keyLight.castShadow = true;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      this.renderer.shadowMap.enabled = true;
      this.keyLight.castShadow = true;
    }
  }

  private syncEmployees(): void {
    // Remove un-hired or disabled employees, spawn newly hired ones
    const activeRoles = new Set(
      this.gameStateSnapshot.employees
        .filter((e) => e.hired && e.assigned)
        .map((e) => e.role)
    );

    this.employeeNPCs = this.employeeNPCs.filter((emp) => {
      if (!activeRoles.has(emp.role)) {
        this.scene.remove(emp.rig.group);
        return false;
      }
      return true;
    });

    for (const empDef of this.gameStateSnapshot.employees) {
      if (!empDef.hired || !empDef.assigned) continue;
      if (this.employeeNPCs.some((e) => e.role === empDef.role)) continue;

      const rig = createCharacterRig(
        {
          shirtColor: empDef.role === 'barista' ? '#f8fafc' : empDef.shirtColor,
          pantsColor: '#1f2937',
          skinColor: empDef.role === 'barista' ? '#d99c6c' : '#d29362',
          apronColor: empDef.role === 'barista' ? '#1d4ed8' : '#78350f',
          hasApron: empDef.role === 'barista' || empDef.role === 'waiter',
          hasMustache: empDef.role === 'barista' || empDef.role === 'cashier',
          headwear: empDef.role === 'barista' ? 'cap' : 'none',
          outfitStyle: 'shirt',
        },
        this.shadowTex
      );

      const startPos =
        empDef.role === 'barista'
          ? new THREE.Vector3(-2.1, 0, -4.4)
          : empDef.role === 'cashier'
            ? new THREE.Vector3(4.1, 0, -4.4)
            : empDef.role === 'cleaner'
              ? new THREE.Vector3(-5.0, 0, -2.5)
              : new THREE.Vector3(0.4, 0, -4.2);

      rig.group.position.copy(startPos);
      this.scene.add(rig.group);

      this.employeeNPCs.push({
        role: empDef.role,
        rig,
        pos: startPos.clone(),
        rotY: 0,
        targetPos: startPos.clone(),
        carryingOrder: null,
        taskTimer: 0,
        walkPhase: 0,
      });
    }
  }

  public setJoystick(x: number, y: number): void {
    this.joystick.x = x;
    this.joystick.y = y;
  }

  public setRunToggle(running: boolean): void {
    this.runToggle = running;
  }

  public cycleCameraMode(): CameraMode {
    const order: CameraMode[] = ['third_person', 'first_person', 'free_look'];
    const next = order[(order.indexOf(this.camMode) + 1) % order.length];
    this.camMode = next;
    if (next === 'first_person') {
      this.playerRig.group.visible = false;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch, -0.25, 0.2);
      this.camera.position.set(this.playerPos.x, this.playerPos.y + 1.66, this.playerPos.z);
    } else if (next === 'free_look') {
      this.playerRig.group.visible = true;
      this.freeLookTarget.copy(this.playerPos).setY(1.2);
    } else {
      this.playerRig.group.visible = true;
    }
    this.callbacks.onCameraModeChanged(next);
    return next;
  }

  public resetCamera(): void {
    this.camYaw = this.playerRotY + Math.PI;
    this.camPitch = 0.56;
    this.camDist = 5.6;
    this.freeLookTarget.copy(this.playerPos).setY(1.15);
  }

  public addCameraLookDelta(dx: number, dy: number): void {
    this.camYaw -= dx * 0.0055 * this.camSensitivity;
    this.camPitch = THREE.MathUtils.clamp(
      this.camPitch + dy * 0.0045 * this.camSensitivity,
      -0.35,
      1.15
    );
  }

  public addCameraZoom(delta: number): void {
    this.camDist = THREE.MathUtils.clamp(this.camDist + delta, 2.8, 8.8);
  }

  public setCarriedDrink(drink: CarriedDrink | null): void {
    this.carriedDrink = drink;
    this.playerRig.trayGroup.visible = Boolean(drink);
    if (drink) {
      const mat = this.playerRig.trayLiquid.material as THREE.MeshStandardMaterial;
      mat.color.set(DRINKS[drink.drinkId].liquidColor);
    }
    this.callbacks.onCarriedChanged(drink);
  }

  public toggleDoor(): void {
    this.doorManualOpen = !this.doorManualOpen;
    this.callbacks.onSoundEvent('door');
  }

  public cleanTable(tableId: number, byEmployee = false): boolean {
    const t = this.tables.find((tb) => tb.id === tableId);
    if (!t || !t.isDirty) return false;
    t.isDirty = false;
    t.tableMesh.dirtyOverlay.visible = false;
    this.callbacks.onTableCleaned(tableId, byEmployee);
    this.callbacks.onSoundEvent('clean');
    return true;
  }

  public sitOrStand(tableId?: number): void {
    if (this.playerSittingTableId !== null) {
      const prevTable = this.tables.find((t) => t.id === this.playerSittingTableId);
      if (prevTable && this.playerSeatIndex !== null) {
        if (prevTable.seats[this.playerSeatIndex]?.occupiedBy === 'player') {
          prevTable.seats[this.playerSeatIndex].occupiedBy = null;
        }
      }
      this.playerSittingTableId = null;
      this.playerSeatIndex = null;
      this.playerPos.x += this.playerPos.x < 0 ? 0.45 : -0.45;
      this.resolveCollisions(this.playerPos, 0.36);
      return;
    }
    const table = this.tables.find((t) => t.id === tableId && t.unlocked);
    const freeIdx = table?.seats.findIndex((s) => !s.occupiedBy) ?? -1;
    if (table && freeIdx >= 0) {
      const freeSeat = table.seats[freeIdx];
      freeSeat.occupiedBy = 'player';
      this.playerSittingTableId = table.id;
      this.playerSeatIndex = freeIdx;
      this.playerPos.copy(freeSeat.pos);
      this.playerRotY = freeSeat.rotY;
    }
  }

  public spawnCrowdBurst(count = 2): void {
    for (let i = 0; i < count; i++) {
      this.spawnCustomer();
    }
  }

  public triggerCustomerTalk(customerId: string): string {
    const npc = this.npcs.find((n) => n.data.id === customerId);
    if (!npc) return '';
    const bank = DIALOGUE_BANK[npc.data.archetype];
    const line = pickRandom(bank.chatting);
    npc.data.bubbleText = line;
    npc.data.bubbleTimer = 5.5;
    this.callbacks.onSoundEvent('voice');
    return line;
  }

  public deliverCarriedToCustomer(customerId: string): boolean {
    if (!this.carriedDrink) return false;
    const npc = this.npcs.find((n) => n.data.id === customerId);
    if (!npc || !npc.data.orderId) return false;

    const table = this.tables.find((t) => t.id === npc.data.tableId);
    const tableDirty = table?.isDirty ?? false;
    const quality = this.carriedDrink.quality;
    const orderId = npc.data.orderId;

    const bank = DIALOGUE_BANK[npc.data.archetype];
    npc.data.bubbleText =
      quality >= 65 ? pickRandom(bank.happyDrink) : pickRandom(bank.badDrink);
    npc.data.bubbleTimer = 5.0;
    npc.data.state = 'drinking';
    npc.stateTimer = 4.2;

    this.setCarriedDrink(null);
    this.callbacks.onOrderDelivered(orderId, { ...npc.data }, quality, tableDirty);
    this.callbacks.onSoundEvent('clink');
    return true;
  }

  public isTableDirty(tableId: number): boolean {
    return this.tables.find((t) => t.id === tableId)?.isDirty ?? false;
  }

  public triggerInteraction(): void {
    const prompt = this.computeNearestPrompt();
    if (!prompt) return;

    if (prompt.type === 'door') {
      this.toggleDoor();
    } else if (prompt.type === 'clean_table' && typeof prompt.targetId === 'number') {
      this.cleanTable(prompt.targetId, false);
    } else if (prompt.type === 'serve_customer' && typeof prompt.targetId === 'string') {
      this.deliverCarriedToCustomer(prompt.targetId);
    } else if (prompt.type === 'talk_customer' && typeof prompt.targetId === 'string') {
      this.triggerCustomerTalk(prompt.targetId);
    } else if (prompt.type === 'sit_chair' && typeof prompt.targetId === 'number') {
      this.sitOrStand(prompt.targetId);
    } else if (prompt.type === 'stand_up') {
      this.sitOrStand();
    } else {
      this.callbacks.onInteractTrigger(prompt);
    }
  }

  private buildEntryWaypoints(seatPos: THREE.Vector3): THREE.Vector3[] {
    const aisleZ = seatPos.z < 0 ? 0.2 : 3.45;
    return [
      new THREE.Vector3(0, 0, 5.25),
      new THREE.Vector3(0, 0, aisleZ),
      new THREE.Vector3(seatPos.x, 0, aisleZ),
      seatPos.clone(),
    ];
  }

  private buildExitWaypoints(startPos: THREE.Vector3): THREE.Vector3[] {
    const aisleZ = startPos.z < 0 ? 0.2 : 3.45;
    return [
      new THREE.Vector3(startPos.x, 0, aisleZ),
      new THREE.Vector3(0, 0, aisleZ),
      new THREE.Vector3(0, 0, 5.25),
      new THREE.Vector3(0, 0, 7.65),
    ];
  }

  private spawnCustomer(forcedArchetype?: CustomerArchetype, startSeated = false): void {
    const unlockedTables = this.tables.filter((t) => t.unlocked);
    const availableSeats: Array<{ table: TableNode; seatIdx: number }> = [];
    for (const t of unlockedTables) {
      t.seats.forEach((s, idx) => {
        if (!s.occupiedBy) availableSeats.push({ table: t, seatIdx: idx });
      });
    }
    if (availableSeats.length === 0 || this.npcs.length >= 9) return;

    const pick = pickRandom(availableSeats);
    const id = `cust_${this.npcCounter++}`;
    pick.table.seats[pick.seatIdx].occupiedBy = id;

    let blueprint = forcedArchetype
      ? NAMED_CHARACTERS.find((c) => c.archetype === forcedArchetype)
      : Math.random() < 0.65
        ? pickRandom(NAMED_CHARACTERS)
        : undefined;

    let nameAr = blueprint?.nameAr ?? '';
    let nameEn = blueprint?.nameEn ?? '';
    let shirtColor = blueprint?.shirtColor ?? '#0369a1';
    let skinColor = blueprint?.skinColor ?? '#d99e6c';
    let headwear: HeadwearType = blueprint?.headwear ?? 'none';
    let outfitStyle: OutfitStyleType = blueprint?.outfitStyle ?? 'shirt';
    let bodyBuild: BodyBuild = blueprint?.bodyBuild ?? 'average';
    let mustacheStyle: MustacheStyle = blueprint?.mustacheStyle ?? 'none';
    let hasBeard = blueprint?.hasBeard ?? false;
    let hasGlasses = blueprint?.hasGlasses ?? false;
    let glassesStyle = blueprint?.glassesStyle ?? 'round';
    let teamBias = blueprint?.teamBias ?? 'neutral';
    const archetype: CustomerArchetype = blueprint?.archetype ?? 'regular';

    if (!blueprint) {
      const reg = pickRandom(RANDOM_REGULAR_NAMES);
      nameAr = reg.ar;
      nameEn = reg.en;
      shirtColor = reg.color;
      skinColor = reg.skinColor ?? '#d99e6c';
      headwear = reg.headwear ?? 'none';
      outfitStyle = reg.outfitStyle ?? 'shirt';
      bodyBuild = reg.bodyBuild ?? 'average';
      mustacheStyle = reg.mustacheStyle ?? 'none';
      hasBeard = reg.hasBeard ?? false;
      hasGlasses = reg.hasGlasses ?? false;
      teamBias = reg.teamBias ?? 'neutral';
    }

    const level = this.gameStateSnapshot.level;
    const unlockedDrinks = Object.values(DRINKS).filter((d) => d.unlockLevel <= level);
    const favs = blueprint?.favoriteDrinks.filter((d) => DRINKS[d].unlockLevel <= level) ?? [];
    const chosenDrink =
      favs.length > 0 && Math.random() < 0.72
        ? pickRandom(favs)
        : pickRandom(unlockedDrinks).id;

    // Assign rich Baladi activity based on archetype, team bias & table props
    let activity: CustomerActivity = 'none';
    if (teamBias === 'ahly' || teamBias === 'zamalek') {
      activity = Math.random() < 0.55 ? 'ahly_zamalek_argument' : 'watching_tv';
    } else if (pick.table.id === 2 || pick.table.id === 3) {
      activity = Math.random() < 0.68 ? 'tawla' : 'watching_tv';
    } else if (pick.table.id === 1 || pick.table.id === 4) {
      activity = Math.random() < 0.65 ? 'shisha' : 'watching_tv';
    } else {
      activity = pickRandom(['tawla', 'shisha', 'watching_tv']);
    }

    const customerData: CustomerData = {
      id,
      archetype,
      nameAr,
      nameEn,
      state: 'entering',
      activity,
      teamBias,
      tableId: pick.table.id,
      seatIndex: pick.seatIdx,
      patienceLeft: 100,
      maxPatience: 100,
      personality: {
        patience: blueprint?.patience ?? 1.0,
        friendliness: blueprint?.friendliness ?? 0.75,
        talkativeness: blueprint?.talkativeness ?? 0.6,
        angerTendency: blueprint?.angerTendency ?? 0.35,
        tipMultiplier: blueprint?.tipMultiplier ?? 1.0,
        favoriteDrinks: blueprint?.favoriteDrinks ?? ['medium_tea'],
        preferredTableIds: [pick.table.id],
      },
      orderedDrink: chosenDrink,
      orderId: null,
      bubbleText: pickRandom(DIALOGUE_BANK[archetype].greeting),
      bubbleTimer: 4.5,
      shirtColor,
      skinColor,
      hasFez: headwear === 'fez',
      hasMustache: mustacheStyle !== 'none',
      hasGlasses,
      glassesStyle,
      headwear,
      outfitStyle,
      bodyBuild,
      mustacheStyle,
      hasBeard,
    };

    const rig = createCharacterRig(
      {
        shirtColor,
        skinColor,
        hairColor: blueprint?.hairColor,
        hasFez: customerData.hasFez,
        hasMustache: customerData.hasMustache,
        mustacheStyle,
        hasBeard,
        hasGlasses,
        glassesStyle,
        headwear,
        outfitStyle,
        bodyBuild,
        teamBias,
      },
      this.shadowTex
    );
    const seat = pick.table.seats[pick.seatIdx];
    if (startSeated) {
      customerData.state = 'sitting';
      const spawnPos = seat.pos.clone();
      rig.group.position.copy(spawnPos);
      rig.group.rotation.y = seat.rotY;
      this.scene.add(rig.group);

      this.npcs.push({
        data: customerData,
        rig,
        pos: spawnPos,
        rotY: seat.rotY,
        targetPos: seat.pos.clone(),
        waypoints: [],
        stateTimer: 0.6,
        walkPhase: 0,
        activityPhase: Math.random() * 6.28,
      });
    } else {
      // Spawn outside entrance doorway and walk through the double doors via clean aisle waypoints
      const spawnPos = new THREE.Vector3(0, 0, 7.25);
      rig.group.position.copy(spawnPos);
      rig.group.rotation.y = Math.PI;
      this.scene.add(rig.group);

      const waypoints = this.buildEntryWaypoints(seat.pos);
      this.npcs.push({
        data: customerData,
        rig,
        pos: spawnPos,
        rotY: Math.PI,
        targetPos: waypoints[0].clone(),
        waypoints,
        stateTimer: 0.12,
        walkPhase: 0,
        activityPhase: Math.random() * 6.28,
      });
    }
  }

  private bindEvents(): void {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const code = e.code;
      this.keys.add(code);
      if (this.screenState === 'playing') {
        if (code === 'KeyE' || code === 'Space') {
          this.triggerInteraction();
        } else if (code === 'KeyC') {
          this.cycleCameraMode();
        } else if (code === 'KeyR') {
          this.resetCamera();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const onBlur = () => {
      this.keys.clear();
      this.joystick.x = 0;
      this.joystick.y = 0;
    };
    const onResize = () => {
      if (this.disposed) return;
      const w = Math.max(320, this.container.clientWidth || window.innerWidth);
      const h = Math.max(240, this.container.clientHeight || window.innerHeight);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    const onVisibilityChange = () => {
      this.pageHidden = document.hidden;
      if (this.pageHidden) {
        this.loopRunning = false;
        cancelAnimationFrame(this.frameId);
        window.clearTimeout(this.frameId);
        this.keys.clear();
        this.joystick.x = 0;
        this.joystick.y = 0;
      } else {
        this.lastTickMs = performance.now();
        this.startLoop();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Store cleanup on instance
    this.cleanupListeners = () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }

  private cleanupListeners: () => void = () => {};

  private startLoop(): void {
    if (this.disposed || this.pageHidden || this.loopRunning) return;
    this.loopRunning = true;
    const tick = () => {
      if (this.disposed || this.pageHidden) {
        this.loopRunning = false;
        return;
      }
      const now = performance.now();
      const rawDt = (now - this.lastTickMs) / 1000;
      this.lastTickMs = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      this.update(dt, now);
      // Low preset caps expensive WebGL drawing at 30 FPS while keeping simulation timing.
      if (
        this.gameStateSnapshot.settings.graphics !== 'low' ||
        now - this.lastRenderMs >= 1000 / 30
      ) {
        this.renderer.render(this.scene, this.camera);
        this.lastRenderMs = now;
      }

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = window.setTimeout(tick, 16);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private update(dt: number, nowMs: number): void {
    this.simElapsed += dt;

    // Spin ceiling fans & tick wall clock
    for (const fan of this.ceilingFans) {
      fan.blades.rotation.y += dt * (this.powerOutageActive ? 0.3 : 3.8);
    }
    this.wallClockMinuteHand.rotation.z = -this.simElapsed * 0.25;

    // Update live TV football canvas at ~10 Hz
    this.tvDrawAccumulator += dt;
    if (this.tvDrawAccumulator >= 0.1) {
      this.tvDrawAccumulator = 0;
      drawTVMatchFrame(this.tvCtx, this.simElapsed, this.powerOutageActive);
      this.tvTexture.needsUpdate = true;
    }

    // Update Time-of-Day lighting, light shafts, & Shisha smoke puffs
    this.updateLighting();
    this.updateSmokePuffs(dt);

    // Door animation (opens cleanly when player or entering/leaving NPCs approach doorway)
    const someoneNearDoor =
      this.doorManualOpen ||
      this.npcs.some((n) => Math.abs(n.pos.x) < 1.8 && n.pos.z > 4.6) ||
      (Math.abs(this.playerPos.x) < 1.8 && this.playerPos.z > 4.8);
    this.doorOpenAmount = THREE.MathUtils.damp(
      this.doorOpenAmount,
      someoneNearDoor ? 1.25 : 0,
      7,
      dt
    );
    this.doorLeftPivot.rotation.y = this.doorOpenAmount;
    this.doorRightPivot.rotation.y = -this.doorOpenAmount;

    if (this.screenState === 'title') {
      this.updateTitleTour(dt);
      this.updateNPCs(dt * 0.65);
      return;
    }

    if (this.screenState !== 'playing') {
      return;
    }

    // In-game clock advances (1 real sec = 1.8 in-game minutes)
    this.clockAccumulator += dt * 1.8;
    if (this.clockAccumulator >= 1) {
      const whole = Math.floor(this.clockAccumulator);
      this.clockAccumulator -= whole;
      this.callbacks.onClockTick(whole);
    }

    // Customer spawning based on time of day & reputation
    const timeInfo = getTimeOfDayInfo(this.gameStateSnapshot.clockMinutes);
    const repBonus = 1 - Math.min(0.4, this.gameStateSnapshot.reputation / 250);
    this.npcSpawnTimer -= dt;
    if (this.npcSpawnTimer <= 0) {
      this.npcSpawnTimer = timeInfo.spawnIntervalSec * repBonus;
      this.spawnCustomer();
    }

    this.updatePlayer(dt);
    this.updateCamera(dt);
    this.updateNPCs(dt);
    this.updateEmployees(dt);

    // Emit context prompt & projected speech bubbles at ~12Hz
    if (nowMs - this.lastBubbleEmit > 85) {
      this.lastBubbleEmit = nowMs;
      const prompt = this.computeNearestPrompt();
      const key = prompt ? `${prompt.type}:${prompt.targetId ?? ''}` : '';
      if (key !== this.lastPromptKey) {
        this.lastPromptKey = key;
        this.callbacks.onPromptChanged(prompt);
      }
      this.emitProjectedBubbles();
    }
  }

  private updateLighting(): void {
    const phase: TimeOfDay = getTimeOfDayInfo(this.gameStateSnapshot.clockMinutes).phase;
    if (this.powerOutageActive) {
      this.keyLight.intensity = 0.22;
      this.hemiLight.intensity = 0.28;
      this.lanternLights.forEach((l) => (l.intensity = 1.5));
      this.lanternGlowMats.forEach((m) => (m.emissiveIntensity = 0.5));
      this.windowBackdropMats.forEach((m) => m.color.set('#0f172a'));
      this.lightShaftMats.forEach((m) => (m.opacity = 0.04));
      return;
    }

    if (phase === 'morning') {
      this.keyLight.color.set('#fff1d0');
      this.keyLight.intensity = 1.7;
      this.hemiLight.color.set('#fef3c7');
      this.hemiLight.intensity = 0.6;
      this.lanternLights.forEach((l) => (l.intensity = 2.0));
      this.windowBackdropMats.forEach((m) => m.color.set('#fde68a'));
      this.lightShaftMats.forEach((m) => {
        m.color.set('#ffe4a0');
        m.opacity = 0.28;
      });
    } else if (phase === 'afternoon') {
      this.keyLight.color.set('#ffe4b5');
      this.keyLight.intensity = 1.65;
      this.hemiLight.color.set('#e0f2fe');
      this.hemiLight.intensity = 0.56;
      this.lanternLights.forEach((l) => (l.intensity = 2.6));
      this.windowBackdropMats.forEach((m) => m.color.set('#93c5fd'));
      this.lightShaftMats.forEach((m) => {
        m.color.set('#fff0cc');
        m.opacity = 0.24;
      });
    } else if (phase === 'evening') {
      this.keyLight.color.set('#fb923c');
      this.keyLight.intensity = 1.25;
      this.hemiLight.color.set('#fed7aa');
      this.hemiLight.intensity = 0.48;
      this.lanternLights.forEach((l) => (l.intensity = 4.0));
      this.windowBackdropMats.forEach((m) => m.color.set('#ea580c'));
      this.lightShaftMats.forEach((m) => {
        m.color.set('#fb923c');
        m.opacity = 0.18;
      });
    } else {
      this.keyLight.color.set('#93c5fd');
      this.keyLight.intensity = 0.65;
      this.hemiLight.color.set('#312e81');
      this.hemiLight.intensity = 0.42;
      this.lanternLights.forEach((l) => (l.intensity = 4.8));
      this.windowBackdropMats.forEach((m) => m.color.set('#1e1b4b'));
      this.lightShaftMats.forEach((m) => {
        m.color.set('#60a5fa');
        m.opacity = 0.08;
      });
    }
    this.lanternGlowMats.forEach((m) => (m.emissiveIntensity = phase === 'night' ? 2.2 : 1.45));
  }

  private updateSmokePuffs(dt: number): void {
    this.smokeEmitTimer -= dt;
    if (this.smokeEmitTimer <= 0) {
      this.smokeEmitTimer = 0.55;
      const shishaNpc = this.npcs.find(
        (n) =>
          n.data.activity === 'shisha' &&
          (n.data.state === 'sitting' ||
            n.data.state === 'waiting' ||
            n.data.state === 'ordering' ||
            n.data.state === 'drinking')
      );
      if (shishaNpc) {
        const slot = this.smokePuffs.find((p) => !p.active);
        if (slot) {
          slot.active = true;
          slot.age = 0;
          slot.origin.set(shishaNpc.pos.x, 1.48, shishaNpc.pos.z);
          slot.mesh.position.copy(slot.origin);
          slot.mesh.scale.setScalar(0.6);
          slot.mesh.visible = true;
        }
      }
    }

    for (const p of this.smokePuffs) {
      if (!p.active) continue;
      p.age += dt;
      if (p.age >= p.maxAge) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      const t = p.age / p.maxAge;
      p.mesh.position.set(
        p.origin.x + Math.sin(p.age * 3.1) * 0.14,
        p.origin.y + t * 0.95,
        p.origin.z + Math.cos(p.age * 2.4) * 0.1
      );
      p.mesh.scale.setScalar(0.6 + t * 1.9);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.34;
    }
  }

  private updateTitleTour(dt: number): void {
    const t = this.simElapsed * 0.16;
    _camGoal.set(Math.sin(t) * 4.8, 3.65 + Math.sin(t * 1.4) * 0.3, 3.9 + Math.cos(t) * 1.3);
    this.camera.position.lerp(_camGoal, 1 - Math.exp(-3 * dt));
    _lookGoal.set(0, 1.3, -1.6);
    this.currentLookAt.lerp(_lookGoal, 1 - Math.exp(-3 * dt));
    this.camera.lookAt(this.currentLookAt);
    this.playerRig.group.visible = true;
  }

  private updatePlayer(dt: number): void {
    // Combine keyboard + mobile virtual joystick
    let moveX = this.joystick.x;
    let moveZ = this.joystick.y;

    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveZ -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveZ += 1;

    const len = Math.hypot(moveX, moveZ);
    if (len > 0.05) {
      if (this.playerSittingTableId !== null) {
        const prevTable = this.tables.find((t) => t.id === this.playerSittingTableId);
        if (prevTable && this.playerSeatIndex !== null) {
          if (prevTable.seats[this.playerSeatIndex]?.occupiedBy === 'player') {
            prevTable.seats[this.playerSeatIndex].occupiedBy = null;
          }
        }
        this.playerSittingTableId = null;
        this.playerSeatIndex = null;
      }

      const normX = moveX / Math.max(1, len);
      const normZ = moveZ / Math.max(1, len);
      const running =
        this.runToggle || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
      const speed = running ? 5.2 : 3.2;

      // Move relative to camera yaw in third/first person
      const yaw = this.camMode === 'free_look' ? 0 : this.camYaw;
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      const worldDx = normX * cos + normZ * sin;
      const worldDz = -normX * sin + normZ * cos;

      this.playerPos.x += worldDx * speed * dt;
      this.playerPos.z += worldDz * speed * dt;
      this.resolveCollisions(this.playerPos, 0.36);

      const targetYaw = Math.atan2(worldDx, worldDz);
      let diff = targetYaw - this.playerRotY;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerRotY += diff * (1 - Math.exp(-12 * dt));

      this.playerWalkPhase += dt * (running ? 14 : 9);
      const swing = Math.sin(this.playerWalkPhase) * 0.52;
      this.playerRig.leftLeg.rotation.x = swing;
      this.playerRig.rightLeg.rotation.x = -swing;
      this.playerRig.leftKnee.rotation.x = Math.max(0, -swing * 0.85) + 0.14;
      this.playerRig.rightKnee.rotation.x = Math.max(0, swing * 0.85) + 0.14;
      if (!this.carriedDrink) {
        this.playerRig.leftArm.rotation.x = -swing * 0.75;
        this.playerRig.rightArm.rotation.x = swing * 0.75;
        this.playerRig.leftForearm.rotation.x = -0.25 - Math.max(0, -swing) * 0.35;
        this.playerRig.rightForearm.rotation.x = -0.25 - Math.max(0, swing) * 0.35;
      } else {
        this.playerRig.leftArm.rotation.x = -0.5;
        this.playerRig.rightArm.rotation.x = -0.5;
        this.playerRig.leftForearm.rotation.x = -1.05;
        this.playerRig.rightForearm.rotation.x = -1.05;
      }
      this.playerRig.bodyPivot.position.y = Math.abs(Math.sin(this.playerWalkPhase)) * 0.035;
    } else if (this.playerSittingTableId !== null) {
      // Natural seated pose (hips on seat, knees bent 90 deg, feet resting on floor)
      this.playerRig.leftLeg.rotation.x = -1.46;
      this.playerRig.rightLeg.rotation.x = -1.46;
      this.playerRig.leftKnee.rotation.x = 1.46;
      this.playerRig.rightKnee.rotation.x = 1.46;
      this.playerRig.leftArm.rotation.x = -0.45;
      this.playerRig.rightArm.rotation.x = -0.45;
      this.playerRig.leftForearm.rotation.x = -0.82;
      this.playerRig.rightForearm.rotation.x = -0.82;
      this.playerRig.bodyPivot.position.y = -0.31;
    } else {
      // Idle pose
      this.playerRig.leftLeg.rotation.x = THREE.MathUtils.damp(this.playerRig.leftLeg.rotation.x, 0, 10, dt);
      this.playerRig.rightLeg.rotation.x = THREE.MathUtils.damp(this.playerRig.rightLeg.rotation.x, 0, 10, dt);
      this.playerRig.leftKnee.rotation.x = THREE.MathUtils.damp(this.playerRig.leftKnee.rotation.x, 0, 10, dt);
      this.playerRig.rightKnee.rotation.x = THREE.MathUtils.damp(this.playerRig.rightKnee.rotation.x, 0, 10, dt);
      this.playerRig.bodyPivot.position.y = THREE.MathUtils.damp(this.playerRig.bodyPivot.position.y, 0, 10, dt);
      if (this.carriedDrink) {
        this.playerRig.leftArm.rotation.x = -0.5;
        this.playerRig.rightArm.rotation.x = -0.5;
        this.playerRig.leftForearm.rotation.x = -1.05;
        this.playerRig.rightForearm.rotation.x = -1.05;
      } else {
        this.playerRig.leftArm.rotation.x = THREE.MathUtils.damp(this.playerRig.leftArm.rotation.x, 0, 10, dt);
        this.playerRig.rightArm.rotation.x = THREE.MathUtils.damp(this.playerRig.rightArm.rotation.x, 0, 10, dt);
        this.playerRig.leftForearm.rotation.x = THREE.MathUtils.damp(this.playerRig.leftForearm.rotation.x, -0.15, 10, dt);
        this.playerRig.rightForearm.rotation.x = THREE.MathUtils.damp(this.playerRig.rightForearm.rotation.x, -0.15, 10, dt);
      }
    }

    this.playerRig.group.position.copy(this.playerPos);
    this.playerRig.group.rotation.y = this.playerRotY;
  }

  private resolveCollisions(pos: THREE.Vector3, radius: number): void {
    // Room inner bounds
    pos.x = THREE.MathUtils.clamp(pos.x, -7.1 + radius, 7.1 - radius);
    pos.z = THREE.MathUtils.clamp(pos.z, -6.1 + radius, 6.1 - radius);

    // Static AABB obstacles (Counters, Storage)
    for (const box of this.staticBoxes) {
      const closestX = THREE.MathUtils.clamp(pos.x, box.minX, box.maxX);
      const closestZ = THREE.MathUtils.clamp(pos.z, box.minZ, box.maxZ);
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;
      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq) || 0.001;
        const push = radius - dist;
        pos.x += (dx / dist) * push;
        pos.z += (dz / dist) * push;
      }
    }

    // Tables (Circle obstacles)
    for (const c of this.tableCircles) {
      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const minR = c.r + radius;
      const distSq = dx * dx + dz * dz;
      if (distSq < minR * minR) {
        const dist = Math.sqrt(distSq) || 0.001;
        const push = minR - dist;
        pos.x += (dx / dist) * push;
        pos.z += (dz / dist) * push;
      }
    }
  }

  private setPlayerOpacity(opacity: number): void {
    const isTransparent = opacity < 0.99;
    for (const mat of this.playerRig.fadeMaterials) {
      if ('opacity' in mat) {
        const m = mat as THREE.MeshStandardMaterial;
        m.transparent = isTransparent;
        m.opacity = opacity;
        m.depthWrite = !isTransparent;
      }
    }
  }

  private updateCamera(dt: number): void {
    const smooth = 1 - Math.exp(-10 * dt);

    if (this.camMode === 'first_person') {
      this.playerRig.group.visible = false;
      this.setPlayerOpacity(1);
      for (const occ of this.occludables) {
        for (const mat of occ.materials) {
          mat.transparent = false;
          mat.opacity = 1;
          mat.depthWrite = true;
        }
      }
      _camGoal.set(this.playerPos.x, this.playerPos.y + 1.66, this.playerPos.z);
      this.camera.position.lerp(_camGoal, smooth);

      const lookDist = 3.0;
      _lookGoal.set(
        this.playerPos.x - Math.sin(this.camYaw) * Math.cos(this.camPitch) * lookDist,
        this.playerPos.y + 1.66 - Math.sin(this.camPitch) * lookDist,
        this.playerPos.z - Math.cos(this.camYaw) * Math.cos(this.camPitch) * lookDist
      );
      this.currentLookAt.lerp(_lookGoal, smooth);
      this.camera.lookAt(this.currentLookAt);
      return;
    }

    this.playerRig.group.visible = true;

    const anchor =
      this.camMode === 'free_look' ? this.freeLookTarget : _vec3.copy(this.playerPos).setY(1.18);

    // Raycast from anchor toward desired camera direction against room walls
    const cosPitch = Math.cos(this.camPitch);
    _camDir
      .set(
        Math.sin(this.camYaw) * cosPitch,
        Math.sin(this.camPitch),
        Math.cos(this.camYaw) * cosPitch
      )
      .normalize();

    _camRaycaster.set(anchor, _camDir);
    _camRaycaster.near = 0.2;
    _camRaycaster.far = this.camDist;
    _camHits.length = 0;
    _camRaycaster.intersectObjects(this.raycastWalls, false, _camHits);
    const rayHitDist = _camHits.length > 0 ? _camHits[0].distance : null;

    const sol = solveThirdPersonCamera({
      anchor: { x: anchor.x, y: anchor.y, z: anchor.z },
      camYaw: this.camYaw,
      camPitch: this.camPitch,
      camDist: this.camDist,
      rayHitDist,
    });

    _camGoal.set(sol.position.x, sol.position.y, sol.position.z);
    _lookGoal.set(sol.lookAt.x, sol.lookAt.y, sol.lookAt.z);

    this.camera.position.lerp(_camGoal, smooth);
    this.currentLookAt.lerp(_lookGoal, smooth);
    this.camera.lookAt(this.currentLookAt);
    this.setPlayerOpacity(sol.playerOpacity);

    // Fade any wall/door leaf blocking the line of sight between camera & player anchor
    for (const occ of this.occludables) {
      const blocking = segmentIntersectsAABB(
        { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
        { x: anchor.x, y: anchor.y, z: anchor.z },
        occ.box
      );
      const targetOp = blocking ? 0.22 : 1;
      for (const mat of occ.materials) {
        const nextOp = THREE.MathUtils.damp(mat.opacity, targetOp, 12, dt);
        mat.opacity = nextOp;
        const trans = nextOp < 0.99;
        if (mat.transparent !== trans) {
          mat.transparent = trans;
          mat.depthWrite = !trans;
          mat.needsUpdate = true;
        }
      }
    }
  }

  private applySeatedActivityAnimation(npc: ActiveNPC, dt: number): void {
    const rig = npc.rig;
    npc.activityPhase += dt;
    const t = npc.activityPhase;
    const act = npc.data.activity;

    // Base natural seated leg pose
    rig.leftLeg.rotation.x = -1.46;
    rig.rightLeg.rotation.x = -1.46;
    rig.leftKnee.rotation.x = 1.46;
    rig.rightKnee.rotation.x = 1.46;
    rig.bodyPivot.position.y = -0.31;

    if (act === 'tawla') {
      // Lean slightly toward table & alternating hand throws on the Tawla board
      rig.leftArm.rotation.x = -0.58 + Math.sin(t * 2.2) * 0.14;
      rig.leftForearm.rotation.x = -0.92;
      rig.rightArm.rotation.x = -0.62 + Math.cos(t * 2.6) * 0.28;
      rig.rightForearm.rotation.x = -0.98 + Math.sin(t * 5.2) * 0.18;
      rig.headGroup.rotation.x = 0.16;
      rig.headGroup.rotation.y = Math.sin(t * 0.9) * 0.14;
    } else if (act === 'shisha') {
      // Slow relaxed puff cycle: right arm lifts shisha mouthpiece toward lips & tilts head
      const puff = Math.max(0, Math.sin(t * 1.1));
      rig.leftArm.rotation.x = -0.4;
      rig.leftForearm.rotation.x = -0.78;
      rig.rightArm.rotation.x = -0.55 - puff * 0.55;
      rig.rightForearm.rotation.x = -0.82 - puff * 0.65;
      rig.headGroup.rotation.x = -0.05 - puff * 0.14;
      rig.headGroup.rotation.y = Math.sin(t * 0.5) * 0.1;
    } else if (act === 'watching_tv') {
      // Look toward NE TV (+X, -Z) & pump arms excitedly during close plays
      rig.headGroup.rotation.y = 0.35 + Math.sin(t * 1.6) * 0.12;
      rig.headGroup.rotation.x = -0.14;
      const cheer = Math.max(0, Math.sin(t * 2.4));
      rig.leftArm.rotation.x = -0.45 - cheer * 0.52;
      rig.rightArm.rotation.x = -0.45 - cheer * 0.62;
      rig.leftForearm.rotation.x = -0.82 - cheer * 0.4;
      rig.rightForearm.rotation.x = -0.82 - cheer * 0.45;
    } else if (act === 'ahly_zamalek_argument') {
      // Expressive double-hand debating & animated head shakes
      rig.leftArm.rotation.x = -0.75 + Math.sin(t * 4.5) * 0.25;
      rig.rightArm.rotation.x = -0.75 - Math.sin(t * 4.5) * 0.25;
      rig.leftForearm.rotation.x = -0.95 + Math.cos(t * 6.0) * 0.28;
      rig.rightForearm.rotation.x = -0.95 - Math.cos(t * 6.0) * 0.28;
      rig.headGroup.rotation.y = Math.sin(t * 3.8) * 0.28;
      rig.headGroup.rotation.x = Math.sin(t * 5.0) * 0.08;
    } else {
      rig.leftArm.rotation.x = -0.45;
      rig.rightArm.rotation.x = -0.45;
      rig.leftForearm.rotation.x = -0.82;
      rig.rightForearm.rotation.x = -0.82;
      rig.headGroup.rotation.x = 0;
      rig.headGroup.rotation.y = Math.sin(t * 0.8) * 0.1;
    }
  }

  private steerNPC(npc: ActiveNPC, step: number): void {
    const dx = npc.targetPos.x - npc.pos.x;
    const dz = npc.targetPos.z - npc.pos.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    let nx = npc.pos.x + (dx / dist) * step;
    let nz = npc.pos.z + (dz / dist) * step;

    // Gentle table-circle repulsion so walking NPCs never clip through tables
    for (const c of this.tableCircles) {
      const tx = nx - c.x;
      const tz = nz - c.z;
      const d = Math.hypot(tx, tz);
      const minR = c.r + 0.34;
      if (d < minR) {
        const inv = 1 / (d || 0.001);
        nx = c.x + tx * inv * minR;
        nz = c.z + tz * inv * minR;
      }
    }
    npc.pos.x = nx;
    npc.pos.z = nz;
    npc.rotY = Math.atan2(dx, dz);
  }

  private updateNPCs(dt: number): void {
    const toRemove: string[] = [];

    for (const npc of this.npcs) {
      const d = npc.data;
      if (d.bubbleTimer > 0) {
        d.bubbleTimer = Math.max(0, d.bubbleTimer - dt);
        if (d.bubbleTimer === 0) d.bubbleText = '';
      }

      const table = this.tables.find((t) => t.id === d.tableId);
      const bank = DIALOGUE_BANK[d.archetype];

      if (d.state === 'entering') {
        npc.stateTimer -= dt;
        if (npc.stateTimer <= 0) {
          d.state = 'walking_to_table';
          if (npc.waypoints.length > 0) {
            npc.targetPos.copy(npc.waypoints[0]);
          } else if (table && d.seatIndex !== null) {
            npc.targetPos.copy(table.seats[d.seatIndex].pos);
          }
        }
      } else if (d.state === 'walking_to_table' || d.state === 'leaving') {
        const dx = npc.targetPos.x - npc.pos.x;
        const dz = npc.targetPos.z - npc.pos.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.25) {
          if (npc.waypoints.length > 1) {
            npc.waypoints.shift();
            npc.targetPos.copy(npc.waypoints[0]);
          } else if (d.state === 'walking_to_table') {
            npc.waypoints = [];
            d.state = 'sitting';
            npc.stateTimer = 1.6;
            if (table && d.seatIndex !== null) {
              npc.pos.copy(table.seats[d.seatIndex].pos);
              npc.rotY = table.seats[d.seatIndex].rotY;
            }
          } else {
            toRemove.push(d.id);
          }
        } else {
          this.steerNPC(npc, 1.95 * dt);
          npc.walkPhase += dt * 8.5;
          const swing = Math.sin(npc.walkPhase) * 0.45;
          npc.rig.leftLeg.rotation.x = swing;
          npc.rig.rightLeg.rotation.x = -swing;
          npc.rig.leftKnee.rotation.x = Math.max(0, -swing * 0.85) + 0.14;
          npc.rig.rightKnee.rotation.x = Math.max(0, swing * 0.85) + 0.14;
          npc.rig.leftArm.rotation.x = -swing * 0.6;
          npc.rig.rightArm.rotation.x = swing * 0.6;
          npc.rig.leftForearm.rotation.x = -0.22;
          npc.rig.rightForearm.rotation.x = -0.22;
          npc.rig.headGroup.rotation.set(0, 0, 0);
          npc.rig.bodyPivot.position.y = Math.abs(Math.sin(npc.walkPhase)) * 0.03;
        }
      } else if (d.state === 'sitting') {
        this.applySeatedActivityAnimation(npc, dt);
        npc.stateTimer -= dt;
        if (npc.stateTimer <= 0) {
          d.state = 'ordering';
          const drinkId = d.orderedDrink ?? 'medium_tea';
          const orderId = `ord_${this.orderCounter++}`;
          d.orderId = orderId;
          d.bubbleText = pickRandom(bank.ordering);
          d.bubbleTimer = 5.5;
          this.callbacks.onOrderCreated({
            id: orderId,
            customerId: d.id,
            customerNameAr: d.nameAr,
            customerNameEn: d.nameEn,
            tableId: d.tableId ?? 1,
            drinkId,
            quantity: 1,
            price: DRINKS[drinkId].price,
            status: 'new',
            createdAt: this.simElapsed,
          });
          d.state = 'waiting';
        }
      } else if (d.state === 'waiting' || d.state === 'complaining') {
        this.applySeatedActivityAnimation(npc, dt);

        // Patience ticks down slowly based on personality
        const decayRate = (1.55 / d.personality.patience) * (1 + d.personality.angerTendency * 0.45);
        d.patienceLeft = Math.max(0, d.patienceLeft - decayRate * dt);

        if (d.patienceLeft < 30 && d.state !== 'complaining') {
          d.state = 'complaining';
          d.bubbleText = pickRandom(bank.complaining);
          d.bubbleTimer = 5.0;
          // Angry eyebrows!
          npc.rig.browLeft.rotation.z = -0.35;
          npc.rig.browRight.rotation.z = 0.35;
        } else if (Math.random() < dt * 0.09 * d.personality.talkativeness && !d.bubbleText) {
          if (d.activity === 'ahly_zamalek_argument') {
            d.bubbleText =
              d.teamBias === 'zamalek'
                ? 'الزمالك مدرسة الفن والهندسة يا كابتن!'
                : 'الأهلي نادي القرن وهيكسب الماتش!';
          } else {
            d.bubbleText = pickRandom(bank.waiting);
          }
          d.bubbleTimer = 4.0;
        }

        if (d.patienceLeft <= 0) {
          // Leave angrily through the front door
          d.bubbleText = pickRandom(bank.complaining);
          d.bubbleTimer = 3.5;
          this.callbacks.onCustomerComplaint({ ...d });
          if (table && d.seatIndex !== null) {
            table.seats[d.seatIndex].occupiedBy = null;
          }
          d.state = 'leaving';
          npc.waypoints = this.buildExitWaypoints(npc.pos);
          npc.targetPos.copy(npc.waypoints[0]);
        }
      } else if (d.state === 'drinking') {
        npc.rig.leftLeg.rotation.x = -1.46;
        npc.rig.rightLeg.rotation.x = -1.46;
        npc.rig.leftKnee.rotation.x = 1.46;
        npc.rig.rightKnee.rotation.x = 1.46;
        npc.rig.bodyPivot.position.y = -0.31;
        npc.rig.browLeft.rotation.z = 0.1;
        npc.rig.browRight.rotation.z = -0.1;
        npc.rig.leftArm.rotation.x = -0.45;
        npc.rig.leftForearm.rotation.x = -0.82;
        npc.rig.rightArm.rotation.x = -0.62;
        npc.rig.rightForearm.rotation.x = -1.12 + Math.sin(this.simElapsed * 3) * 0.22;
        npc.rig.headGroup.rotation.set(0, 0, 0);

        npc.stateTimer -= dt;
        if (npc.stateTimer <= 0) {
          d.state = 'paying';
          d.bubbleText = pickRandom(bank.paying);
          d.bubbleTimer = 3.5;
          npc.stateTimer = 1.4;
        }
      } else if (d.state === 'paying') {
        npc.stateTimer -= dt;
        if (npc.stateTimer <= 0) {
          if (table && d.seatIndex !== null) {
            table.seats[d.seatIndex].occupiedBy = null;
            table.isDirty = true;
            table.tableMesh.dirtyOverlay.visible = true;
          }
          d.state = 'leaving';
          npc.waypoints = this.buildExitWaypoints(npc.pos);
          npc.targetPos.copy(npc.waypoints[0]);
        }
      }

      npc.rig.group.position.copy(npc.pos);
      npc.rig.group.rotation.y = npc.rotY;
    }

    if (toRemove.length > 0) {
      this.npcs = this.npcs.filter((n) => {
        if (toRemove.includes(n.data.id)) {
          this.scene.remove(n.rig.group);
          return false;
        }
        return true;
      });
    }
  }

  private updateEmployees(dt: number): void {
    for (const emp of this.employeeNPCs) {
      const def = this.gameStateSnapshot.employees.find((e) => e.role === emp.role);
      const speedMul = def?.speed ?? 1.1;

      if (emp.role === 'barista') {
        // Automatically brews 'new' or 'accepted' orders at the counter!
        const pending = this.activeOrders.find(
          (o) => o.status === 'new' || o.status === 'accepted'
        );
        if (pending) {
          emp.taskTimer += dt * speedMul;
          emp.rig.rightArm.rotation.x = -0.45;
          emp.rig.rightForearm.rotation.x = -0.95 + Math.sin(this.simElapsed * 6) * 0.25;
          emp.rig.leftArm.rotation.x = -0.4;
          emp.rig.leftForearm.rotation.x = -0.85;
          if (emp.taskTimer >= 4.5) {
            emp.taskTimer = 0;
            const quality = Math.min(95, 76 + (def?.skill ?? 1) * 4);
            this.callbacks.onBaristaCompleteOrder(pending.id, pending.drinkId, quality);
          }
        } else {
          emp.rig.rightArm.rotation.x = 0;
          emp.rig.rightForearm.rotation.x = -0.15;
          emp.rig.leftArm.rotation.x = 0;
          emp.rig.leftForearm.rotation.x = -0.15;
        }
      } else if (emp.role === 'waiter') {
        if (!emp.carryingOrder) {
          const readyOrder = this.activeOrders.find((o) => o.status === 'ready');
          if (readyOrder) {
            // Walk to prep counter pickup spot
            emp.targetPos.set(0.4, 0, -4.3);
            const dist = emp.pos.distanceTo(emp.targetPos);
            if (dist < 0.45) {
              emp.carryingOrder = readyOrder;
              emp.rig.trayGroup.visible = true;
            } else {
              this.moveEmployeeToward(emp, 2.3 * speedMul, dt);
            }
          }
        } else {
          const targetNPC = this.npcs.find((n) => n.data.orderId === emp.carryingOrder?.id);
          if (!targetNPC || targetNPC.data.state === 'leaving') {
            emp.carryingOrder = null;
            emp.rig.trayGroup.visible = false;
          } else {
            emp.targetPos.copy(targetNPC.pos).add(new THREE.Vector3(0, 0, 0.7));
            const dist = emp.pos.distanceTo(emp.targetPos);
            if (dist < 1.1) {
              const ord = emp.carryingOrder;
              const q = ord.readyQuality ?? 80;
              const tableDirty = this.isTableDirty(ord.tableId);
              const bank = DIALOGUE_BANK[targetNPC.data.archetype];
              targetNPC.data.bubbleText = pickRandom(bank.happyDrink);
              targetNPC.data.bubbleTimer = 4.0;
              targetNPC.data.state = 'drinking';
              targetNPC.stateTimer = 4.0;
              this.callbacks.onOrderDelivered(ord.id, { ...targetNPC.data }, q, tableDirty);
              emp.carryingOrder = null;
              emp.rig.trayGroup.visible = false;
            } else {
              this.moveEmployeeToward(emp, 2.4 * speedMul, dt);
            }
          }
        }
      } else if (emp.role === 'cleaner') {
        const dirty = this.tables.find((t) => t.unlocked && t.isDirty);
        if (dirty) {
          emp.targetPos.copy(dirty.pos).add(new THREE.Vector3(0, 0, 1.0));
          const dist = emp.pos.distanceTo(emp.targetPos);
          if (dist < 0.7) {
            emp.taskTimer += dt * speedMul;
            emp.rig.rightArm.rotation.x = -0.55;
            emp.rig.rightForearm.rotation.x = -0.8 + Math.sin(this.simElapsed * 8) * 0.3;
            if (emp.taskTimer >= 2.0) {
              emp.taskTimer = 0;
              this.cleanTable(dirty.id, true);
              emp.rig.rightArm.rotation.x = 0;
              emp.rig.rightForearm.rotation.x = -0.15;
            }
          } else {
            this.moveEmployeeToward(emp, 2.2 * speedMul, dt);
          }
        }
      }

      emp.rig.group.position.copy(emp.pos);
      emp.rig.group.rotation.y = emp.rotY;
    }
  }

  private moveEmployeeToward(emp: ActiveEmployeeNPC, speed: number, dt: number): void {
    const dx = emp.targetPos.x - emp.pos.x;
    const dz = emp.targetPos.z - emp.pos.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    emp.pos.x += (dx / dist) * speed * dt;
    emp.pos.z += (dz / dist) * speed * dt;
    emp.rotY = Math.atan2(dx, dz);
    emp.walkPhase += dt * 8;
    const swing = Math.sin(emp.walkPhase) * 0.45;
    emp.rig.leftLeg.rotation.x = swing;
    emp.rig.rightLeg.rotation.x = -swing;
    emp.rig.leftKnee.rotation.x = Math.max(0, -swing * 0.85) + 0.14;
    emp.rig.rightKnee.rotation.x = Math.max(0, swing * 0.85) + 0.14;
    if (emp.carryingOrder) {
      emp.rig.leftArm.rotation.x = -0.5;
      emp.rig.rightArm.rotation.x = -0.5;
      emp.rig.leftForearm.rotation.x = -1.05;
      emp.rig.rightForearm.rotation.x = -1.05;
    } else {
      emp.rig.leftArm.rotation.x = -swing * 0.6;
      emp.rig.rightArm.rotation.x = swing * 0.6;
      emp.rig.leftForearm.rotation.x = -0.22;
      emp.rig.rightForearm.rotation.x = -0.22;
    }
  }

  private computeNearestPrompt(): InteractionPrompt | null {
    if (this.playerSittingTableId !== null) {
      return {
        type: 'stand_up',
        labelAr: 'قوم من على الكرسي',
        labelEn: 'Stand Up',
      };
    }

    // 1. Check customer to serve if carrying a drink
    if (this.carriedDrink) {
      const targetNPC = this.npcs.find((n) => n.data.id === this.carriedDrink!.customerId);
      if (targetNPC && this.playerPos.distanceTo(targetNPC.pos) < 2.2) {
        return {
          type: 'serve_customer',
          targetId: targetNPC.data.id,
          labelAr: `قدّم الطلب لـ ${targetNPC.data.nameAr}`,
          labelEn: `Serve ${targetNPC.data.nameEn}`,
        };
      }
    }

    // 2. Prep counter
    if (this.playerPos.x > -4.3 && this.playerPos.x < 0.5 && this.playerPos.z < -3.6) {
      return {
        type: 'prep_counter',
        labelAr: 'جهّز المشاريب',
        labelEn: 'Prepare Drinks',
      };
    }

    // 3. Cashier desk
    if (this.playerPos.x > 2.6 && this.playerPos.x < 5.5 && this.playerPos.z < -3.6) {
      return {
        type: 'cashier',
        labelAr: 'افتح الخزنة',
        labelEn: 'Open Cashier',
      };
    }

    // 4. Storage rack
    if (this.playerPos.x < -4.2 && this.playerPos.z < -2.4) {
      return {
        type: 'storage',
        labelAr: 'افتح المخزن',
        labelEn: 'Manage Inventory',
      };
    }

    // 5. Dirty table cleaning
    for (const t of this.tables) {
      if (t.unlocked && t.isDirty && this.playerPos.distanceTo(t.pos) < 1.95) {
        return {
          type: 'clean_table',
          targetId: t.id,
          labelAr: `امسح ترابيزة ${t.id}`,
          labelEn: `Clean Table ${t.id}`,
        };
      }
    }

    // 6. Talk to seated customer
    for (const npc of this.npcs) {
      if (
        (npc.data.state === 'waiting' ||
          npc.data.state === 'drinking' ||
          npc.data.state === 'complaining') &&
        this.playerPos.distanceTo(npc.pos) < 2.0
      ) {
        return {
          type: 'talk_customer',
          targetId: npc.data.id,
          labelAr: `كلّم ${npc.data.nameAr}`,
          labelEn: `Talk to ${npc.data.nameEn}`,
        };
      }
    }

    // 7. Entrance door
    if (Math.abs(this.playerPos.x) < 1.6 && this.playerPos.z > 4.8) {
      return {
        type: 'door',
        labelAr: this.doorManualOpen ? 'اقفل الباب' : 'افتح الباب',
        labelEn: this.doorManualOpen ? 'Close Door' : 'Open Door',
      };
    }

    // 8. Sit on an empty chair
    for (const t of this.tables) {
      if (!t.unlocked) continue;
      if (t.seats.some((s) => !s.occupiedBy) && this.playerPos.distanceTo(t.pos) < 1.85) {
        return {
          type: 'sit_chair',
          targetId: t.id,
          labelAr: `اقعد ع الترابيزة ${t.id}`,
          labelEn: `Sit at Table ${t.id}`,
        };
      }
    }

    return null;
  }

  private emitProjectedBubbles(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const list: ProjectedBubble[] = [];

    for (const npc of this.npcs) {
      const showState =
        npc.data.state === 'waiting' ||
        npc.data.state === 'complaining' ||
        npc.data.activity !== 'none';
      if (!npc.data.bubbleText && !showState) {
        continue;
      }
      _proj.copy(npc.pos).add(new THREE.Vector3(0, 2.08, 0));
      _proj.project(this.camera);
      const visible = _proj.z >= -1 && _proj.z <= 1;
      const sx = (_proj.x * 0.5 + 0.5) * w;
      const sy = (-_proj.y * 0.5 + 0.5) * h;

      if (visible && sx > 24 && sx < w - 24 && sy > 88 && sy < h - 80) {
        list.push({
          id: npc.data.id,
          nameAr: npc.data.nameAr,
          text: npc.data.bubbleText,
          state: npc.data.state,
          activity: npc.data.activity,
          orderDrinkId: npc.data.orderedDrink,
          patiencePct: Math.round(npc.data.patienceLeft),
          x: Math.round(sx),
          y: Math.round(sy),
          visible: true,
        });
      }
    }

    this.callbacks.onBubblesUpdated(list);
  }

  public dispose(): void {
    this.disposed = true;
    this.loopRunning = false;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.cleanupListeners();

    const disposedTextures = new Set<THREE.Texture>();
    const disposeMaterial = (material: THREE.Material) => {
      // Materials may share canvas/generated textures, so dispose each texture once.
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture && !disposedTextures.has(value)) {
          disposedTextures.add(value);
          value.dispose();
        }
      }
      material.dispose();
    };

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(disposeMaterial);
        } else if (mesh.material) {
          disposeMaterial(mesh.material);
        }
      }
    });
    if (this.scene.environment && !disposedTextures.has(this.scene.environment)) {
      this.scene.environment.dispose();
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

import * as THREE from 'three';
import {
  BodyBuild,
  HeadwearType,
  MustacheStyle,
  OutfitStyleType,
} from '../game/types';
import {
  createCharacterFaceTexture,
  createFabricTexture,
  createWovenCaneTexture,
} from './textures';

export interface CharacterRig {
  group: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
  trayGroup: THREE.Group;
  trayLiquid: THREE.Mesh;
  browLeft: THREE.Object3D;
  browRight: THREE.Object3D;
  mouth: THREE.Object3D;
  fadeMaterials: THREE.Material[];
}

export interface CharacterVisualSpec {
  shirtColor: string;
  pantsColor?: string;
  skinColor?: string;
  hairColor?: string;
  apronColor?: string;
  hasFez?: boolean;
  hasMustache?: boolean;
  mustacheStyle?: MustacheStyle;
  hasBeard?: boolean;
  hasGlasses?: boolean;
  glassesStyle?: 'round' | 'dark';
  hasApron?: boolean;
  isOwner?: boolean;
  headwear?: HeadwearType;
  outfitStyle?: OutfitStyleType;
  bodyBuild?: BodyBuild;
  teamBias?: 'ahly' | 'zamalek' | 'neutral';
}

function makeLatheProfile(
  pts: Array<[number, number]>,
  segments = 16
): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(r, y)),
    segments
  );
}

/**
 * Stylized Pixar-inspired realistic-proportioned Egyptian character (~1.76m tall)
 * with articulated shoulders, elbows, hands, hips, knees, sculpted shoes,
 * contoured torso/clothing, and expressive facial anatomy.
 * Bottom-center pivot at y = 0 (shoe soles).
 */
export function createCharacterRig(
  spec: CharacterVisualSpec,
  shadowTex: THREE.Texture
): CharacterRig {
  const group = new THREE.Group();

  // Contact shadow disc grounded at y = 0.015
  const shadowGeo = new THREE.CircleGeometry(0.46, 20);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.015;
  group.add(shadowDisc);

  const bodyPivot = new THREE.Group();
  group.add(bodyPivot);

  const skinHex = spec.skinColor ?? '#d99c6c';
  const hairHex = spec.hairColor ?? '#1b1614';
  const headwear: HeadwearType =
    spec.headwear ?? (spec.hasFez ? 'fez' : spec.isOwner ? 'cap' : 'none');
  const outfitStyle: OutfitStyleType = spec.outfitStyle ?? 'shirt';
  const isGalabeya = outfitStyle === 'galabeya' || outfitStyle === 'vest_galabeya';
  const hasVest = outfitStyle === 'vest_galabeya';
  const bodyBuild: BodyBuild = spec.bodyBuild ?? 'average';
  const widthScale =
    bodyBuild === 'belly'
      ? 1.15
      : bodyBuild === 'broad'
        ? 1.18
        : bodyBuild === 'slim'
          ? 0.91
          : 1.0;
  const depthScale = bodyBuild === 'belly' ? 1.24 : bodyBuild === 'slim' ? 0.92 : 1.0;
  const mustacheStyle: MustacheStyle =
    spec.mustacheStyle ?? (spec.hasMustache ? 'handlebar' : 'none');

  const faceTex = createCharacterFaceTexture(skinHex, spec.hasMustache !== false);
  const faceMat = new THREE.MeshPhysicalMaterial({
    map: faceTex,
    roughness: 0.62,
    metalness: 0.0,
    sheen: 0.22,
    sheenRoughness: 0.75,
    sheenColor: new THREE.Color('#ffcdb2'),
  });

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: skinHex,
    roughness: 0.64,
    metalness: 0.0,
    sheen: 0.18,
    sheenRoughness: 0.75,
    sheenColor: new THREE.Color('#ffcdb2'),
  });

  const shirtTex = createFabricTexture(
    spec.shirtColor,
    isGalabeya ? 'galabeya' : 'shirt'
  );
  const shirtMat = new THREE.MeshPhysicalMaterial({
    map: shirtTex,
    roughness: 0.82,
    metalness: 0.02,
    sheen: 0.25,
    sheenRoughness: 0.85,
  });

  const pantsColor = isGalabeya ? spec.shirtColor : (spec.pantsColor ?? '#242a34');
  const pantsTex = createFabricTexture(pantsColor, 'pants');
  const pantsMat = new THREE.MeshStandardMaterial({
    map: pantsTex,
    roughness: 0.86,
    metalness: 0.03,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: hairHex,
    roughness: 0.88,
    metalness: 0.04,
  });

  const shoeUpperMat = new THREE.MeshStandardMaterial({
    color: isGalabeya ? '#4a2c18' : '#1e1b18',
    roughness: 0.36,
    metalness: 0.12,
  });
  const shoeSoleMat = new THREE.MeshStandardMaterial({
    color: '#0f0e0d',
    roughness: 0.85,
  });

  // ==========================================================
  // 1. ARTICULATED LEGS (Hip -> Thigh -> Knee -> Calf -> Shoe)
  // ==========================================================
  const makeLeg = (xOffset: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOffset, 0.84, 0);

    // Hip joint cap
    const hipBall = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), pantsMat);
    hipBall.scale.set(0.95, 1.0, 1.02);
    legPivot.add(hipBall);

    // Tapered thigh (0 down to -0.39)
    const thighGeo = makeLatheProfile(
      [
        [0.062, -0.39],
        [0.072, -0.26],
        [0.084, -0.12],
        [0.088, 0.0],
      ],
      14
    );
    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    thigh.scale.set(0.96, 1, 1.06);
    thigh.castShadow = true;
    legPivot.add(thigh);

    // Knee Pivot at y = -0.39
    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.39, 0);
    legPivot.add(kneePivot);

    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), pantsMat);
    kneePivot.add(kneeCap);

    // Sculpted calf / lower pant leg (0 down to -0.39)
    const calfGeo = makeLatheProfile(
      [
        [0.044, -0.39],
        [0.052, -0.28],
        [0.066, -0.14],
        [0.062, 0.0],
      ],
      14
    );
    const calf = new THREE.Mesh(calfGeo, pantsMat);
    calf.scale.set(0.96, 1, 1.05);
    calf.castShadow = true;
    kneePivot.add(calf);

    // Sculpted Shoe at y = -0.45 (sole touches y = 0 when standing)
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.42, 0.03);
    kneePivot.add(shoeGroup);

    const sole = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.13, 6, 12), shoeSoleMat);
    sole.rotation.x = Math.PI / 2;
    sole.scale.set(1.06, 1.0, 0.44);
    sole.position.set(0, -0.008, 0.015);
    shoeGroup.add(sole);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.115, 6, 12), shoeUpperMat);
    upper.rotation.x = Math.PI / 2;
    upper.scale.set(1.0, 1.0, 0.72);
    upper.position.set(0, 0.015, 0.012);
    upper.castShadow = true;
    shoeGroup.add(upper);

    const ankleCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.046, 0.05, 12), shoeUpperMat);
    ankleCollar.position.set(0, 0.035, -0.028);
    shoeGroup.add(ankleCollar);

    bodyPivot.add(legPivot);
    return { legPivot, kneePivot };
  };

  const leftLegData = makeLeg(-0.105);
  const rightLegData = makeLeg(0.105);
  const leftLeg = leftLegData.legPivot;
  const rightLeg = rightLegData.legPivot;
  const leftKnee = leftLegData.kneePivot;
  const rightKnee = rightLegData.kneePivot;

  // ==========================================================
  // 2. PELVIS, TAILORED TORSO & EGYPTIAN OUTFIT LAYERS
  // ==========================================================
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.188, 16, 12), pantsMat);
  pelvis.position.set(0, 0.85, 0);
  pelvis.scale.set(1.08 * widthScale, 0.56, 0.74 * depthScale);
  pelvis.castShadow = true;
  bodyPivot.add(pelvis);

  // Contoured human torso (waist -> ribcage -> broad shoulders -> neck base)
  const torsoProfile = isGalabeya
    ? makeLatheProfile(
        [
          [0.225, -0.32], // Long traditional galabeya drape
          [0.215, -0.14],
          [0.20, 0.04], // Waist
          [0.218, 0.22], // Ribcage
          [0.232, 0.38], // Chest
          [0.185, 0.49], // Collarbone
          [0.088, 0.53], // Neck opening
        ],
        18
      )
    : makeLatheProfile(
        [
          [0.188, 0.0], // Waist
          [0.194, 0.12],
          [0.218, 0.28], // Ribcage
          [0.236, 0.42], // Broad chest
          [0.186, 0.51], // Shoulders slope
          [0.088, 0.55], // Neck opening
        ],
        18
      );

  const torso = new THREE.Mesh(torsoProfile, shirtMat);
  torso.position.set(0, 0.86, 0);
  torso.scale.set(1.12 * widthScale, 1.0, 0.71 * depthScale);
  torso.castShadow = true;
  bodyPivot.add(torso);

  // Distinct sculpted belly ("كرش") for stout / older Egyptian characters
  if (bodyBuild === 'belly') {
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), shirtMat);
    belly.position.set(0, 0.99, 0.085);
    belly.scale.set(1.12, 0.92, 0.88);
    belly.castShadow = true;
    bodyPivot.add(belly);
  }

  // Football team jersey stripes (Zamalek twin red bands / Ahly chest trim)
  if (!isGalabeya && spec.teamBias === 'zamalek') {
    const stripeMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.75 });
    [1.14, 1.07].forEach((sy) => {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.223, 0.22, 0.032, 16),
        stripeMat
      );
      band.position.set(0, sy, 0);
      band.scale.set(1.13 * widthScale, 1.0, 0.725 * depthScale);
      bodyPivot.add(band);
    });
  } else if (!isGalabeya && spec.teamBias === 'ahly') {
    const trimMat = new THREE.MeshStandardMaterial({ color: '#fef2f2', roughness: 0.7 });
    const vNeck = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 0.03), trimMat);
    vNeck.position.set(0, 1.355, 0.14 * depthScale);
    bodyPivot.add(vNeck);
  }

  // Traditional Baladi Sedairi Vest over Galabeya
  if (hasVest) {
    const vestMat = new THREE.MeshStandardMaterial({
      color: '#2c1e16',
      roughness: 0.78,
    });
    const vestLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.242, 0.214, 0.42, 14, 1, false, 0.18, 2.5),
      vestMat
    );
    vestLeft.position.set(0, 1.15, 0);
    vestLeft.scale.set(1.14 * widthScale, 1.0, 0.73 * depthScale);
    vestLeft.castShadow = true;
    bodyPivot.add(vestLeft);

    const vestRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.242, 0.214, 0.42, 14, 1, false, -2.68, 2.5),
      vestMat
    );
    vestRight.position.set(0, 1.15, 0);
    vestRight.scale.set(1.14 * widthScale, 1.0, 0.73 * depthScale);
    vestRight.castShadow = true;
    bodyPivot.add(vestRight);

    // Gold pocket-watch chain across vest
    const chainMat = new THREE.MeshStandardMaterial({
      color: '#eab308',
      metalness: 0.85,
      roughness: 0.25,
    });
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.006, 6, 12, Math.PI),
      chainMat
    );
    chain.position.set(-0.07, 1.03, 0.175 * depthScale);
    chain.rotation.z = Math.PI;
    bodyPivot.add(chain);
  }

  if (!isGalabeya) {
    // Leather Belt + Brass Buckle
    const belt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.195, 0.195, 0.048, 18),
      new THREE.MeshStandardMaterial({ color: '#291a10', roughness: 0.45 })
    );
    belt.position.set(0, 0.865, 0);
    belt.scale.set(1.13 * widthScale, 1.0, 0.73 * depthScale);
    bodyPivot.add(belt);

    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.046, 0.025),
      new THREE.MeshStandardMaterial({ color: '#d4a04a', metalness: 0.85, roughness: 0.25 })
    );
    buckle.position.set(0, 0.865, 0.145 * depthScale);
    bodyPivot.add(buckle);
  }

  // Shirt / Galabeya Collar Lapels & Button Placket
  const collarFlapMat = new THREE.MeshStandardMaterial({
    color: spec.shirtColor,
    roughness: 0.78,
  });
  [-1, 1].forEach((side) => {
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.055, 0.025), collarFlapMat);
    lapel.position.set(side * 0.052, 1.375, 0.095 * depthScale);
    lapel.rotation.set(-0.35, side * 0.35, -side * 0.28);
    bodyPivot.add(lapel);
  });

  // Placket + buttons
  const placket = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.26, 0.015),
    new THREE.MeshStandardMaterial({ color: spec.shirtColor, roughness: 0.75 })
  );
  placket.position.set(0, 1.21, 0.155 * depthScale);
  bodyPivot.add(placket);

  const btnMat = new THREE.MeshStandardMaterial({ color: '#f5efe6', roughness: 0.35 });
  for (let b = 0; b < 3; b++) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), btnMat);
    btn.position.set(0, 1.29 - b * 0.075, 0.163);
    bodyPivot.add(btn);
  }

  // Barista / Owner / Waiter Tailored Bib Apron (like the blue apron in the reference image!)
  if (spec.isOwner || spec.hasApron) {
    const apronHex = spec.apronColor ?? (spec.isOwner ? '#1d4ed8' : '#2563eb');
    const apronTex = createFabricTexture(apronHex, 'apron');
    const apronMat = new THREE.MeshPhysicalMaterial({
      map: apronTex,
      roughness: 0.84,
      sheen: 0.2,
      sheenRoughness: 0.85,
    });

    // Curved front chest bib
    const bib = new THREE.Mesh(
      new THREE.CylinderGeometry(0.242, 0.212, 0.34, 16, 1, false, -0.58, 1.16),
      apronMat
    );
    bib.position.set(0, 1.14, 0.015);
    bib.scale.set(1.11, 1.0, 0.71);
    bib.castShadow = true;
    bodyPivot.add(bib);

    // Lower apron skirt
    const apronSkirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.205, 0.228, 0.34, 16, 1, false, -0.9, 1.8),
      apronMat
    );
    apronSkirt.position.set(0, 0.81, 0.015);
    apronSkirt.scale.set(1.11, 1.0, 0.72);
    apronSkirt.castShadow = true;
    bodyPivot.add(apronSkirt);

    // Two shoulder straps curving cleanly over shoulders and down the back
    [-0.105, 0.105].forEach((sx) => {
      const strapCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx, 1.29, 0.145),
        new THREE.Vector3(sx * 1.15, 1.40, 0.02),
        new THREE.Vector3(sx * 1.12, 1.28, -0.172),
        new THREE.Vector3(sx * 0.72, 0.90, -0.148),
      ]);
      const strap = new THREE.Mesh(
        new THREE.TubeGeometry(strapCurve, 14, 0.017, 6, false),
        apronMat
      );
      bodyPivot.add(strap);
    });

    // Waist apron tie wrapping behind waist
    const waistTie = new THREE.Mesh(
      new THREE.CylinderGeometry(0.198, 0.198, 0.036, 16, 1, false, Math.PI * 0.45, Math.PI * 1.1),
      apronMat
    );
    waistTie.position.set(0, 0.89, 0.01);
    waistTie.scale.set(1.12, 1.0, 0.73);
    bodyPivot.add(waistTie);

    // Subtle brass chest badge & front pocket
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.02), apronMat);
    pocket.position.set(0, 0.88, 0.165);
    bodyPivot.add(pocket);

    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.032, 0.01),
      new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.6, roughness: 0.35 })
    );
    badge.position.set(0, 1.15, 0.172);
    bodyPivot.add(badge);
  }

  // Tailored collar seam adds a more dimensional, finished look to the new cast.
  const collarSeamMat = new THREE.MeshStandardMaterial({
    color: '#f3dfbd',
    roughness: 0.78,
    transparent: true,
    opacity: 0.72,
  });
  const collarSeam = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.008, 5, 18, Math.PI),
    collarSeamMat
  );
  collarSeam.position.set(0, 1.39, 0.02);
  collarSeam.rotation.x = Math.PI / 2;
  bodyPivot.add(collarSeam);

  // ==========================================================
  // 3. ARTICULATED ARMS (Shoulder -> Sleeve -> Elbow -> Forearm -> Hand)
  // ==========================================================
  const makeArm = (side: -1 | 1) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * (0.242 * widthScale), 1.31, 0);

    // Rounded deltoid shoulder cap + short rolled sleeve
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.074, 12, 10), shirtMat);
    shoulder.scale.set(1.05, 0.95, 0.94);
    shoulder.castShadow = true;
    armPivot.add(shoulder);

    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.056, 0.16, 12),
      shirtMat
    );
    sleeve.position.set(side * 0.008, -0.075, 0);
    sleeve.rotation.z = side * 0.06;
    sleeve.castShadow = true;
    armPivot.add(sleeve);

    // Rolled sleeve cuff ring
    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.056, 0.011, 8, 14),
      shirtMat
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(side * 0.012, -0.15, 0);
    armPivot.add(cuff);

    // Upper bare arm (or long sleeve for galabeya)
    const upperArmMat = isGalabeya ? shirtMat : skinMat;
    const upperArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.12, 6, 12),
      upperArmMat
    );
    upperArm.position.set(side * 0.014, -0.175, 0);
    upperArm.castShadow = true;
    armPivot.add(upperArm);

    // Elbow Pivot at y = -0.255
    const forearmPivot = new THREE.Group();
    forearmPivot.position.set(side * 0.016, -0.255, 0);
    armPivot.add(forearmPivot);

    const elbowBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.043, 10, 10),
      isGalabeya ? shirtMat : skinMat
    );
    forearmPivot.add(elbowBall);

    const forearmGeo = makeLatheProfile(
      [
        [0.031, -0.21],
        [0.041, -0.11],
        [0.044, 0.0],
      ],
      12
    );
    const forearm = new THREE.Mesh(forearmGeo, isGalabeya ? shirtMat : skinMat);
    forearm.castShadow = true;
    forearmPivot.add(forearm);

    if (isGalabeya) {
      const wristCuff = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.008, 6, 12), shirtMat);
      wristCuff.rotation.x = Math.PI / 2;
      wristCuff.position.y = -0.205;
      forearmPivot.add(wristCuff);
    }

    // Sculpted Pixar Hand at y = -0.225
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.23, 0.005);
    forearmPivot.add(handGroup);

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), skinMat);
    palm.scale.set(0.65, 1.05, 0.95);
    handGroup.add(palm);

    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.024, 4, 8), skinMat);
    thumb.position.set(-side * 0.012, -0.01, 0.032);
    thumb.rotation.set(-0.55, 0, -side * 0.35);
    handGroup.add(thumb);

    const fingers = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.028, 4, 10), skinMat);
    fingers.position.set(0, -0.044, 0.004);
    fingers.scale.set(0.62, 1.0, 1.15);
    fingers.rotation.x = 0.18;
    handGroup.add(fingers);

    bodyPivot.add(armPivot);
    return { armPivot, forearmPivot };
  };

  const leftArmData = makeArm(-1);
  const rightArmData = makeArm(1);
  const leftArm = leftArmData.armPivot;
  const rightArm = rightArmData.armPivot;
  const leftForearm = leftArmData.forearmPivot;
  const rightForearm = rightArmData.forearmPivot;

  // ==========================================================
  // 4. NECK, SCULPTED HEAD & PIXAR FACIAL ANATOMY
  // ==========================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.40, 0.01);
  bodyPivot.add(headGroup);

  // Tapered human neck
  const neckGeo = makeLatheProfile(
    [
      [0.072, -0.02],
      [0.064, 0.05],
      [0.068, 0.12],
    ],
    14
  );
  const neck = new THREE.Mesh(neckGeo, skinMat);
  headGroup.add(neck);

  // Cranium (aligned with phiStart = -PI/2 so UV center u=0.5 faces +Z!)
  const craniumGeo = new THREE.SphereGeometry(0.162, 22, 18, -Math.PI / 2, Math.PI * 2);
  const cranium = new THREE.Mesh(craniumGeo, faceMat);
  cranium.position.set(0, 0.242, -0.005);
  cranium.scale.set(1.02, 1.12, 1.06);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Lower jaw & cheekbones (smooth skinMat so cheek blush stays on cranium only)
  const jawGeo = new THREE.SphereGeometry(0.132, 18, 14);
  const jaw = new THREE.Mesh(jawGeo, skinMat);
  jaw.position.set(0, 0.168, 0.014);
  jaw.scale.set(0.98, 0.94, 1.02);
  jaw.castShadow = true;
  headGroup.add(jaw);

  // Subtle sculpted chin
  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.054, 12, 10), skinMat);
  chin.position.set(0, 0.11, 0.088);
  chin.scale.set(1.08, 0.82, 0.88);
  headGroup.add(chin);

  // Ears
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), skinMat);
    ear.position.set(side * 0.148, 0.215, -0.008);
    ear.scale.set(0.58, 1.28, 0.9);
    ear.rotation.y = side * 0.2;
    headGroup.add(ear);
  });

  // Prominent Characterful Egyptian Nose (bridge + rounded tip + nostrils)
  const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.044, 4, 8), skinMat);
  noseBridge.position.set(0, 0.232, 0.152);
  noseBridge.rotation.x = -0.38;
  headGroup.add(noseBridge);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), skinMat);
  noseTip.position.set(0, 0.205, 0.168);
  noseTip.scale.set(0.95, 0.86, 1.15);
  headGroup.add(noseTip);

  [-0.017, 0.017].forEach((nx) => {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), skinMat);
    nostril.position.set(nx, 0.197, 0.156);
    headGroup.add(nostril);
  });

  // Soulful Pixar Eyes (eyelids + white sclera + warm brown iris + pupil + catchlight glint)
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18 });
  const irisMat = new THREE.MeshStandardMaterial({ color: '#3b2112', roughness: 0.22 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lidMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.65 });

  [-0.054, 0.054].forEach((ex) => {
    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(ex, 0.248, 0.132);
    eyeSocket.rotation.y = ex < 0 ? -0.18 : 0.18;
    headGroup.add(eyeSocket);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.029, 16, 14), eyeWhiteMat);
    sclera.scale.set(1.06, 0.9, 0.56);
    eyeSocket.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0175, 14, 12), irisMat);
    iris.scale.set(1.0, 1.0, 0.45);
    iris.position.set(0, -0.001, 0.011);
    eyeSocket.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), pupilMat);
    pupil.scale.set(1.0, 1.0, 0.45);
    pupil.position.set(0, -0.001, 0.015);
    eyeSocket.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 8, 8), glintMat);
    glint.position.set(0.005, 0.006, 0.018);
    eyeSocket.add(glint);

    const upperLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.031, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
      lidMat
    );
    upperLid.scale.set(1.08, 0.92, 0.62);
    upperLid.rotation.x = -0.35;
    eyeSocket.add(upperLid);
  });

  // Curved Arched Eyebrows (TubeGeometry)
  const makeBrow = (side: -1 | 1) => {
    const browGroup = new THREE.Group();
    browGroup.position.set(side * 0.056, 0.288, 0.145);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-side * 0.032, -0.005, 0.004),
      new THREE.Vector3(0, 0.01, 0.008),
      new THREE.Vector3(side * 0.034, -0.008, -0.006),
    ]);
    const browMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 10, 0.0095, 6, false),
      hairMat
    );
    browGroup.add(browMesh);
    headGroup.add(browGroup);
    return browGroup;
  };

  const browLeft = makeBrow(-1);
  const browRight = makeBrow(1);

  // Expressive Smiling Mouth (curved TubeGeometry lip line)
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, 0.135, 0.151);
  const mouthCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.038, 0.006, -0.008),
    new THREE.Vector3(0, -0.006, 0.006),
    new THREE.Vector3(0.038, 0.006, -0.008),
  ]);
  const mouthMesh = new THREE.Mesh(
    new THREE.TubeGeometry(mouthCurve, 14, 0.009, 7, false),
    new THREE.MeshStandardMaterial({ color: '#6b201c', roughness: 0.5 })
  );
  mouthGroup.add(mouthMesh);
  headGroup.add(mouthGroup);

  // Diverse Egyptian Mustaches ('thin' | 'bushy' | 'handlebar')
  if (mustacheStyle === 'handlebar') {
    const stacheCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.064, -0.014, -0.012),
      new THREE.Vector3(-0.026, 0.008, 0.01),
      new THREE.Vector3(0, 0.01, 0.014),
      new THREE.Vector3(0.026, 0.008, 0.01),
      new THREE.Vector3(0.064, -0.014, -0.012),
    ]);
    const stache = new THREE.Mesh(
      new THREE.TubeGeometry(stacheCurve, 14, 0.015, 7, false),
      hairMat
    );
    stache.position.set(0, 0.172, 0.148);
    headGroup.add(stache);
  } else if (mustacheStyle === 'bushy') {
    const bushy = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.021, 0.072, 5, 10),
      hairMat
    );
    bushy.rotation.z = Math.PI / 2;
    bushy.position.set(0, 0.172, 0.154);
    bushy.scale.set(0.85, 1.0, 0.72);
    headGroup.add(bushy);
  } else if (mustacheStyle === 'thin') {
    const thinStache = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.008, 0.068, 4, 8),
      hairMat
    );
    thinStache.rotation.z = Math.PI / 2;
    thinStache.position.set(0, 0.171, 0.156);
    headGroup.add(thinStache);
  }

  // Optional neat Egyptian Beard
  if (spec.hasBeard) {
    const beard = new THREE.Mesh(
      new THREE.SphereGeometry(0.118, 14, 10, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.48, Math.PI * 0.46),
      hairMat
    );
    beard.position.set(0, 0.158, 0.024);
    beard.scale.set(0.95, 0.98, 1.02);
    headGroup.add(beard);
  }

  // Round Gold Glasses or Dark Frames
  if (spec.hasGlasses) {
    const isDark = spec.glassesStyle === 'dark';
    const frameMat = new THREE.MeshStandardMaterial({
      color: isDark ? '#111827' : '#d4a04a',
      metalness: isDark ? 0.3 : 0.85,
      roughness: isDark ? 0.35 : 0.2,
    });
    const lensMat = new THREE.MeshStandardMaterial({
      color: '#09090b',
      transparent: true,
      opacity: isDark ? 0.82 : 0.18,
      roughness: 0.1,
    });
    [-0.054, 0.054].forEach((gx) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.033, isDark ? 0.006 : 0.0045, 6, 16), frameMat);
      rim.position.set(gx, 0.248, 0.156);
      rim.rotation.y = gx < 0 ? -0.15 : 0.15;
      headGroup.add(rim);

      if (isDark) {
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 14), lensMat);
        lens.position.set(gx, 0.248, 0.157);
        lens.rotation.y = gx < 0 ? -0.15 : 0.15;
        headGroup.add(lens);
      }
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.007, 0.006), frameMat);
    bridge.position.set(0, 0.252, 0.158);
    headGroup.add(bridge);
  }

  // Sideburns + Back Hairline (gives every character a natural haircut around the temples & ears)
  [-1, 1].forEach((side) => {
    const sideburn = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.065, 4, 8), hairMat);
    sideburn.position.set(side * 0.142, 0.255, 0.032);
    sideburn.rotation.z = side * -0.08;
    headGroup.add(sideburn);
  });
  const backHair = new THREE.Mesh(
    new THREE.SphereGeometry(0.165, 16, 12, Math.PI * 0.65, Math.PI * 1.7, 0.35, Math.PI * 0.5),
    hairMat
  );
  backHair.position.set(0, 0.248, -0.014);
  backHair.scale.set(0.95, 1.04, 1.02);
  headGroup.add(backHair);

  // Authentic Hair & Headwear (matching the reference photo!)
  const clothWhiteMat = new THREE.MeshPhysicalMaterial({
    color: '#f3efe6',
    roughness: 0.85,
    sheen: 0.35,
    sheenRoughness: 0.85,
  });

  if (headwear === 'cap') {
    // Neat dark hair peeking at front + Crisp White Qahwagi / Barista Cap
    const hairFringe = new THREE.Mesh(
      new THREE.SphereGeometry(0.164, 16, 10, -Math.PI / 2, Math.PI * 2, 0, Math.PI * 0.44),
      hairMat
    );
    hairFringe.position.set(0, 0.258, 0.002);
    hairFringe.scale.set(0.94, 1.02, 1.02);
    headGroup.add(hairFringe);

    const capGroup = new THREE.Group();
    capGroup.position.set(0, 0.365, -0.01);
    capGroup.rotation.x = -0.14;

    const capBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.148, 0.155, 0.085, 18),
      clothWhiteMat
    );
    capBand.scale.set(0.95, 1.0, 1.04);
    capBand.castShadow = true;
    capGroup.add(capBand);

    const capCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.142, 0.148, 0.035, 18),
      clothWhiteMat
    );
    capCrown.position.y = 0.055;
    capCrown.scale.set(0.95, 1.0, 1.04);
    capGroup.add(capCrown);

    headGroup.add(capGroup);
  } else if (headwear === 'turban') {
    // Traditional Wrapped White Egyptian Emama / Turban (عمامة بلدي)
    const turbanGroup = new THREE.Group();
    turbanGroup.position.set(0, 0.34, -0.01);
    turbanGroup.rotation.x = -0.12;

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.165, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
      clothWhiteMat
    );
    core.scale.set(0.98, 0.92, 1.06);
    core.castShadow = true;
    turbanGroup.add(core);

    const wraps: Array<{ y: number; rx: number; rz: number; r: number; tube: number }> = [
      { y: 0.015, rx: Math.PI / 2 + 0.08, rz: 0.12, r: 0.155, tube: 0.044 },
      { y: 0.048, rx: Math.PI / 2 - 0.1, rz: -0.14, r: 0.152, tube: 0.042 },
      { y: 0.082, rx: Math.PI / 2 + 0.14, rz: 0.18, r: 0.136, tube: 0.038 },
      { y: 0.11, rx: Math.PI / 2 - 0.06, rz: -0.08, r: 0.112, tube: 0.032 },
    ];
    wraps.forEach((w) => {
      const fold = new THREE.Mesh(
        new THREE.TorusGeometry(w.r, w.tube, 10, 22),
        clothWhiteMat
      );
      fold.position.y = w.y;
      fold.rotation.set(w.rx, 0, w.rz);
      fold.castShadow = true;
      turbanGroup.add(fold);
    });

    headGroup.add(turbanGroup);
  } else if (headwear === 'fez') {
    // Classic Red Tarboosh with black tassel
    const hairRim = new THREE.Mesh(
      new THREE.SphereGeometry(0.162, 14, 10, 0, Math.PI * 2, 0.18, Math.PI * 0.35),
      hairMat
    );
    hairRim.position.set(0, 0.252, -0.005);
    hairRim.scale.set(0.95, 1.0, 1.02);
    headGroup.add(hairRim);

    const fezMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.72 });
    const fez = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.145, 0.16, 16), fezMat);
    fez.position.set(0, 0.425, -0.01);
    fez.rotation.x = -0.08;
    fez.castShadow = true;
    headGroup.add(fez);

    const tassel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.022, 0.11, 8),
      new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.8 })
    );
    tassel.position.set(0.125, 0.40, -0.01);
    tassel.rotation.z = -0.26;
    headGroup.add(tassel);
  } else if (headwear === 'taqiya') {
    // Traditional knitted white/ivory Baladi Taqiya skullcap
    const taqiyaMat = new THREE.MeshStandardMaterial({ color: '#ebe4d4', roughness: 0.9 });
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.168, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
      taqiyaMat
    );
    dome.position.set(0, 0.252, -0.01);
    dome.scale.set(0.95, 1.06, 1.04);
    dome.castShadow = true;
    headGroup.add(dome);
  } else {
    // Full Sculpted Pixar Hair + Front Wave (or subtle receding hairline for older regulars)
    const isSilverHair = hairHex.toLowerCase() === '#9ca3af';
    if (!isSilverHair) {
      const crownHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.168, 18, 14, -Math.PI / 2, Math.PI * 2, 0, Math.PI * 0.52),
        hairMat
      );
      crownHair.position.set(0, 0.258, -0.006);
      crownHair.scale.set(0.96, 1.06, 1.04);
      crownHair.castShadow = true;
      headGroup.add(crownHair);

      const frontWave = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.042, 0.12, 6, 10),
        hairMat
      );
      frontWave.rotation.z = Math.PI / 2 - 0.15;
      frontWave.position.set(0.01, 0.355, 0.112);
      frontWave.scale.set(0.9, 1.0, 0.75);
      headGroup.add(frontWave);
    }
  }

  // ==========================================================
  // 5. CARRIED BRASS TRAY + TEA GLASS (visible when serving)
  // ==========================================================
  const trayGroup = new THREE.Group();
  trayGroup.position.set(0, 1.02, 0.42);
  trayGroup.visible = false;
  bodyPivot.add(trayGroup);

  const brassMat = new THREE.MeshStandardMaterial({
    color: '#e5b94c',
    metalness: 0.85,
    roughness: 0.22,
  });
  const trayPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.21, 0.025, 18), brassMat);
  trayPlate.castShadow = true;
  trayGroup.add(trayPlate);

  const cupGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.042, 0.13, 12),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
    })
  );
  cupGlass.position.y = 0.08;
  trayGroup.add(cupGlass);

  const trayLiquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.038, 0.095, 12),
    new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.2 })
  );
  trayLiquid.position.y = 0.065;
  trayGroup.add(trayLiquid);

  const fadeSet = new Set<THREE.Material>();
  bodyPivot.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => fadeSet.add(m));
      } else {
        fadeSet.add(mesh.material);
      }
    }
  });

  return {
    group,
    bodyPivot,
    headGroup,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftLeg,
    rightLeg,
    leftKnee,
    rightKnee,
    trayGroup,
    trayLiquid,
    browLeft,
    browRight,
    mouth: mouthGroup,
    fadeMaterials: Array.from(fadeSet),
  };
}

export function createBaladiTable(
  woodTex: THREE.Texture,
  upgradedChairs: boolean
): {
  group: THREE.Group;
  dirtyOverlay: THREE.Group;
  tableTop: THREE.Mesh;
} {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.58,
    metalness: 0.06,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#d4a04a',
    metalness: 0.82,
    roughness: 0.25,
  });

  // Octagonal / beveled tabletop
  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.65, 0.06, 8),
    upgradedChairs ? brassMat : woodMat
  );
  tableTop.position.y = 0.76;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);

  // Inner wood inlay when brass rim
  if (upgradedChairs) {
    const inlay = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.064, 8), woodMat);
    inlay.position.y = 0.76;
    group.add(inlay);
  }

  // 4 turned legs
  [
    [-0.36, -0.36],
    [0.36, -0.36],
    [0.36, 0.36],
    [-0.36, 0.36],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.75, 8), woodMat);
    leg.position.set(lx, 0.375, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  // Table props: tissue box + brass ashtray
  const tissueBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.07, 0.1),
    new THREE.MeshStandardMaterial({ color: '#f5efe6', roughness: 0.7 })
  );
  tissueBox.position.set(-0.18, 0.825, -0.1);
  group.add(tissueBox);

  const ashtray = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.025, 12), brassMat);
  ashtray.position.set(0.2, 0.805, 0.14);
  group.add(ashtray);

  // Dirty cups overlay (toggled when customer leaves dirty table!)
  const dirtyOverlay = new THREE.Group();
  dirtyOverlay.visible = false;
  group.add(dirtyOverlay);

  const dirtyGlassMat = new THREE.MeshStandardMaterial({
    color: '#d6d3d1',
    transparent: true,
    opacity: 0.65,
    roughness: 0.4,
  });
  const dGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.038, 0.12, 10), dirtyGlassMat);
  dGlass.position.set(0.06, 0.85, -0.05);
  dGlass.rotation.z = 0.15;
  dirtyOverlay.add(dGlass);

  const dStain = new THREE.Mesh(
    new THREE.CircleGeometry(0.11, 12),
    new THREE.MeshBasicMaterial({ color: '#451a03', transparent: true, opacity: 0.55 })
  );
  dStain.rotation.x = -Math.PI / 2;
  dStain.position.set(-0.05, 0.796, 0.18);
  dirtyOverlay.add(dStain);

  return { group, dirtyOverlay, tableTop };
}

export function createBaladiChair(
  woodTex: THREE.Texture,
  upgraded: boolean,
  caneTex?: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: upgraded ? '#ffffff' : '#c9b199',
    roughness: upgraded ? 0.56 : 0.82,
    metalness: 0.04,
  });
  const seatTex = caneTex ?? createWovenCaneTexture(upgraded);
  const seatMat = new THREE.MeshStandardMaterial({
    map: seatTex,
    color: '#ffffff',
    roughness: upgraded ? 0.58 : 0.92,
  });

  // Woven cane / velvet seat frame
  const seatFrame = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.045, 0.45), woodMat);
  seatFrame.position.y = 0.45;
  seatFrame.castShadow = true;
  group.add(seatFrame);

  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.025, 0.39), seatMat);
  seatCushion.position.y = 0.476;
  seatCushion.castShadow = true;
  group.add(seatCushion);

  // 4 Tapered wooden legs + lower rung stretchers (classic worn qahwa chair)
  [
    [-0.18, -0.18],
    [0.18, -0.18],
    [0.18, 0.18],
    [-0.18, 0.18],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.019, 0.45, 6), woodMat);
    leg.position.set(x, 0.225, z);
    leg.castShadow = true;
    group.add(leg);
  });

  // Side & front rungs
  const frontRung = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), woodMat);
  frontRung.rotation.z = Math.PI / 2;
  frontRung.position.set(0, 0.16, 0.18);
  group.add(frontRung);

  [-0.18, 0.18].forEach((sx) => {
    const sideRung = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), woodMat);
    sideRung.rotation.x = Math.PI / 2;
    sideRung.position.set(sx, 0.19, 0);
    group.add(sideRung);
  });

  // Backrest posts + curved slats
  [-0.18, 0.18].forEach((x) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.48, 6), woodMat);
    post.position.set(x, 0.7, -0.19);
    post.rotation.x = -0.06;
    group.add(post);
  });

  const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.085, 0.042), woodMat);
  topRail.position.set(0, 0.9, -0.205);
  group.add(topRail);

  const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.048, 0.03), woodMat);
  midRail.position.set(0, 0.72, -0.195);
  group.add(midRail);

  return group;
}

export function createPrepCounter(woodTex: THREE.Texture, upgraded: boolean): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6 });
  const marbleMat = new THREE.MeshStandardMaterial({ color: '#ede4d3', roughness: 0.28 });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#e5b94c',
    metalness: 0.88,
    roughness: 0.18,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: '#c26d3a',
    metalness: 0.84,
    roughness: 0.24,
  });

  // Main counter body
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.96, 1.0), woodMat);
  base.position.y = 0.48;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Marble countertop
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.92, 0.08, 1.12), marbleMat);
  top.position.y = 1.0;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Ornate Egyptian Brass Tea Machine / Samovar ("ماكينة شاي نحاس")
  const boilerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.12, 14), brassMat);
  boilerBase.position.set(-1.15, 1.1, 0.05);
  group.add(boilerBase);

  const boiler = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.26, 0.54, 16),
    upgraded ? brassMat : copperMat
  );
  boiler.position.set(-1.15, 1.42, 0.05);
  boiler.castShadow = true;
  group.add(boiler);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    brassMat
  );
  dome.position.set(-1.15, 1.69, 0.05);
  group.add(dome);

  // Pressure gauge + brass spire + twin pouring spouts
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 10), brassMat);
  spire.position.set(-1.15, 1.94, 0.05);
  group.add(spire);

  const gauge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.03, 12),
    new THREE.MeshStandardMaterial({ color: '#fefce8', roughness: 0.3 })
  );
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(-1.15, 1.52, 0.28);
  group.add(gauge);

  [-0.08, 0.08].forEach((sx) => {
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.14, 8), brassMat);
    spout.rotation.x = Math.PI / 3;
    spout.position.set(-1.15 + sx, 1.28, 0.3);
    group.add(spout);
  });

  // Glowing coal stove under kanaka
  const ember = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.12, 12),
    new THREE.MeshStandardMaterial({
      color: '#7c2d12',
      emissive: '#ea580c',
      emissiveIntensity: upgraded ? 1.4 : 0.8,
      roughness: 0.5,
    })
  );
  ember.position.set(-0.3, 1.1, 0.05);
  group.add(ember);

  // Copper Kanaka coffee pots
  [-0.36, -0.2].forEach((kx, idx) => {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 0.16, 10), copperMat);
    pot.position.set(kx, 1.24, idx === 0 ? 0.02 : 0.14);
    group.add(pot);
  });

  // Jars for Tea, Sugar, Mint + Stacked Glass Cups
  const jarColors = ['#451a03', '#f8fafc', '#15803d', '#991b1b'];
  jarColors.forEach((col, i) => {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.2, 10),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 })
    );
    jar.position.set(0.35 + i * 0.21, 1.14, -0.22);
    group.add(jar);
  });

  // Stacked tea glasses rack
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#e0f2fe',
    transparent: true,
    opacity: 0.55,
    roughness: 0.12,
  });
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.028, 0.1, 8), glassMat);
      gl.position.set(0.45 + col * 0.11, 1.09 + row * 0.1, 0.16);
      group.add(gl);
    }
  }

  // Tray pickup plate
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.03, 16), brassMat);
  tray.position.set(1.45, 1.06, 0.12);
  group.add(tray);

  return group;
}

export function createCashierDesk(woodTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55 });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#d4a04a',
    metalness: 0.82,
    roughness: 0.25,
  });

  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 0.9), woodMat);
  desk.position.y = 0.5;
  desk.castShadow = true;
  desk.receiveShadow = true;
  group.add(desk);

  // Brass Vintage Cash Register
  const regBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 0.38), brassMat);
  regBase.position.set(0.15, 1.13, 0);
  regBase.castShadow = true;
  group.add(regBase);

  const regTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.22), brassMat);
  regTop.position.set(0.15, 1.32, -0.05);
  group.add(regTop);

  // Ledger book
  const ledger = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.04, 0.28),
    new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.8 })
  );
  ledger.position.set(-0.42, 1.02, 0.08);
  ledger.rotation.y = 0.18;
  group.add(ledger);

  return group;
}

export function createStorageRack(woodTex: THREE.Texture, expanded: boolean): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.72 });
  const sackMat = new THREE.MeshStandardMaterial({ color: '#a17c50', roughness: 0.92 });

  const shelvesCount = expanded ? 4 : 3;
  const width = expanded ? 2.4 : 1.7;

  // 4 corner posts
  [-width / 2, width / 2].forEach((px) => {
    [-0.35, 0.35].forEach((pz) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.08), woodMat);
      post.position.set(px, 1.1, pz);
      post.castShadow = true;
      group.add(post);
    });
  });

  for (let s = 0; s < shelvesCount; s++) {
    const sy = 0.35 + s * 0.55;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.05, 0.76), woodMat);
    plank.position.y = sy;
    plank.receiveShadow = true;
    group.add(plank);

    // Supply sacks & crates
    const sack = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.34, 10), sackMat);
    sack.position.set(-width * 0.26, sy + 0.19, 0);
    group.add(sack);

    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.28, 0.38),
      new THREE.MeshStandardMaterial({ color: s % 2 === 0 ? '#78350f' : '#166534', roughness: 0.78 })
    );
    crate.position.set(width * 0.22, sy + 0.16, 0);
    group.add(crate);
  }

  return group;
}

export function createCeilingFan(): { group: THREE.Group; blades: THREE.Group } {
  const group = new THREE.Group();
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#d4a04a',
    metalness: 0.8,
    roughness: 0.25,
  });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#4a2a14', roughness: 0.6 });

  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), brassMat);
  rod.position.y = -0.3;
  group.add(rod);

  const blades = new THREE.Group();
  blades.position.y = -0.6;
  group.add(blades);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12), brassMat);
  blades.add(hub);

  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.025, 0.18), woodMat);
    const angle = (i * Math.PI) / 2;
    blade.position.set(Math.cos(angle) * 0.56, 0, Math.sin(angle) * 0.56);
    blade.rotation.y = -angle;
    blades.add(blade);
  }

  return { group, blades };
}

export function createBrassLantern(): { group: THREE.Group; glowMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#d4a04a',
    metalness: 0.85,
    roughness: 0.2,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: '#fde68a',
    emissive: '#f59e0b',
    emissiveIntensity: 1.6,
    roughness: 0.28,
  });

  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 6), brassMat);
  chain.position.y = -0.325;
  group.add(chain);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 12), brassMat);
  ring.position.y = -0.66;
  group.add(ring);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.24, 6), brassMat);
  cap.position.y = -0.82;
  group.add(cap);

  // Stained glass body + brass vertical ribs
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.15, 0.36, 6), glowMat);
  body.position.y = -1.08;
  group.add(body);

  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.37, 0.02), brassMat);
    rib.position.set(Math.cos(ang) * 0.19, -1.08, Math.sin(ang) * 0.19);
    group.add(rib);
  }

  const bottom = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.18, 6), brassMat);
  bottom.rotation.x = Math.PI;
  bottom.position.y = -1.34;
  group.add(bottom);

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), brassMat);
  finial.position.y = -1.45;
  group.add(finial);

  return { group, glowMat };
}

export function createShishaProp(withFloorCoil = false): THREE.Group {
  const group = new THREE.Group();
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#d4a04a',
    metalness: 0.85,
    roughness: 0.22,
  });
  const glassBaseMat = new THREE.MeshPhysicalMaterial({
    color: '#065f46',
    transparent: true,
    opacity: 0.78,
    roughness: 0.15,
  });
  const hoseMat = new THREE.MeshStandardMaterial({
    color: '#991b1b',
    roughness: 0.72,
  });

  // Glass bottle base
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.125, 0.24, 14), glassBaseMat);
  bottle.position.y = 0.12;
  bottle.castShadow = true;
  group.add(bottle);

  // Brass stem & decorative bulb
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 0.42, 10), brassMat);
  stem.position.y = 0.43;
  stem.castShadow = true;
  group.add(stem);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), brassMat);
  bulb.position.y = 0.37;
  group.add(bulb);

  // Charcoal tray + clay bowl + glowing ember
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.015, 14), brassMat);
  tray.position.y = 0.62;
  group.add(tray);

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.024, 0.07, 10),
    new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.85 })
  );
  bowl.position.y = 0.665;
  group.add(bowl);

  const ember = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 8, 8),
    new THREE.MeshStandardMaterial({
      color: '#f97316',
      emissive: '#ea580c',
      emissiveIntensity: 1.5,
    })
  );
  ember.position.y = 0.705;
  group.add(ember);

  // Flexible coiled shisha hose reaching floor or smoker hand
  const hosePts = withFloorCoil
    ? [
        new THREE.Vector3(0.04, 0.32, 0.02),
        new THREE.Vector3(0.22, 0.24, 0.18),
        new THREE.Vector3(0.32, 0.04, 0.34),
        new THREE.Vector3(0.12, 0.03, 0.48),
        new THREE.Vector3(-0.08, 0.03, 0.38),
      ]
    : [
        new THREE.Vector3(0.04, 0.32, 0.02),
        new THREE.Vector3(0.24, 0.22, 0.12),
        new THREE.Vector3(0.32, 0.45, 0.22),
      ];
  const hoseCurve = new THREE.CatmullRomCurve3(hosePts);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 18, 0.014, 7, false), hoseMat);
  hose.castShadow = true;
  group.add(hose);

  return group;
}

export function createShishaCorner(woodTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.72 });

  // Low wooden stand
  const stand = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.56), woodMat);
  stand.position.y = 0.04;
  stand.receiveShadow = true;
  group.add(stand);

  // 2 floor-standing shishas + coiled hoses resting on floor
  const s1 = createShishaProp(true);
  s1.position.set(-0.32, 0.08, -0.05);
  group.add(s1);

  const s2 = createShishaProp(true);
  s2.position.set(0.28, 0.08, 0.02);
  s2.rotation.y = 0.65;
  group.add(s2);

  // Extra coiled spare shisha pipe on the floor beside the stand
  const spareCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.55, 0.02, 0.18),
    new THREE.Vector3(0.82, 0.025, 0.28),
    new THREE.Vector3(0.92, 0.025, 0.02),
    new THREE.Vector3(0.72, 0.025, -0.14),
    new THREE.Vector3(0.58, 0.03, 0.04),
  ]);
  const spareHose = new THREE.Mesh(
    new THREE.TubeGeometry(spareCurve, 22, 0.016, 7, false),
    new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.68 })
  );
  group.add(spareHose);

  return group;
}

export function createTawlaBoard(tawlaTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.028, 0.34),
    new THREE.MeshStandardMaterial({ map: tawlaTex, roughness: 0.55 })
  );
  board.castShadow = true;
  group.add(board);

  // Checkers & dice
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.35 });
  [
    [-0.14, -0.09, true],
    [-0.08, 0.07, false],
    [0.09, -0.08, true],
    [0.14, 0.09, false],
  ].forEach(([px, pz, isW]) => {
    const piece = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.01, 10),
      isW ? whiteMat : darkMat
    );
    piece.position.set(px as number, 0.019, pz as number);
    group.add(piece);
  });

  const dice = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.018), whiteMat);
  dice.position.set(0.03, 0.023, 0.02);
  dice.rotation.y = 0.5;
  group.add(dice);

  return group;
}

export function createVintageRadio(dialTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const cabinetMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.45 });
  const clothMat = new THREE.MeshStandardMaterial({ color: '#b48a54', roughness: 0.9 });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#d4a04a',
    metalness: 0.85,
    roughness: 0.25,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.24), cabinetMat);
  body.position.y = 0.16;
  body.castShadow = true;
  group.add(body);

  const speaker = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.02), clothMat);
  speaker.position.set(-0.08, 0.18, 0.122);
  group.add(speaker);

  const dial = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.095),
    new THREE.MeshBasicMaterial({ map: dialTex })
  );
  dial.position.set(0.02, 0.08, 0.123);
  group.add(dial);

  [0.12, 0.19].forEach((kx) => {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.024, 12), brassMat);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(kx, 0.19, 0.125);
    group.add(knob);
  });

  return group;
}

export function createNewspaperStack(newsTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: newsTex, roughness: 0.88 });
  for (let i = 0; i < 3; i++) {
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.008, 0.21), mat);
    sheet.position.set((i - 1) * 0.01, 0.004 + i * 0.009, (i - 1) * 0.006);
    sheet.rotation.y = (i - 1) * 0.12;
    group.add(sheet);
  }
  return group;
}

export function createFramedPortrait(
  tex: THREE.Texture,
  w = 0.95,
  h = 1.28
): THREE.Group {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({
    color: '#b47d2a',
    metalness: 0.65,
    roughness: 0.35,
  });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.045), frameMat);
  group.add(frame);

  const canvas = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })
  );
  canvas.position.z = 0.025;
  group.add(canvas);
  return group;
}


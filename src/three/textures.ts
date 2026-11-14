import * as THREE from 'three';

export function createTileFloorTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm Cairo mosaic ceramic base
  ctx.fillStyle = '#e7dcc8';
  ctx.fillRect(0, 0, size, size);

  const tiles = 4;
  const step = size / tiles;

  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const px = x * step;
      const py = y * step;
      const alt = (x + y) % 2 === 0;

      // Subtle tile tone
      ctx.fillStyle = alt ? '#e9dec9' : '#dfd0b6';
      ctx.fillRect(px + 3, py + 3, step - 6, step - 6);

      // Traditional geometric star / diamond motif
      const cx = px + step / 2;
      const cy = py + step / 2;
      ctx.save();
      ctx.translate(cx, cy);

      ctx.strokeStyle = alt ? '#8c3b23' : '#1e4e5f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -step * 0.34);
      ctx.lineTo(step * 0.34, 0);
      ctx.lineTo(0, step * 0.34);
      ctx.lineTo(-step * 0.34, 0);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = alt ? '#b4532a' : '#255c6e';
      ctx.beginPath();
      ctx.arc(0, 0, step * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Corner accents
      ctx.fillStyle = '#c58b3c';
      const cOff = step * 0.38;
      [
        [-cOff, -cOff],
        [cOff, -cOff],
        [cOff, cOff],
        [-cOff, cOff],
      ].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // Grout lines
      ctx.strokeStyle = '#9c8c75';
      ctx.lineWidth = 5;
      ctx.strokeRect(px, py, step, step);
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 4.5);
  map.anisotropy = maxAnisotropy;

  // Bump map for tile grout
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#d8d8d8';
  bCtx.fillRect(0, 0, size, size);
  bCtx.strokeStyle = '#404040';
  bCtx.lineWidth = 7;
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      bCtx.strokeRect(x * step, y * step, step, step);
    }
  }
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(5, 4.5);

  return { map, bumpMap };
}

export function createWoodTexture(baseHex = '#6b3e21', maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 65; i++) {
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(30, 14, 4, 0.2)' : 'rgba(210, 150, 90, 0.12)';
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    const y = (i / 65) * 256;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(85, y + Math.sin(i) * 5, 170, y - Math.cos(i) * 5, 256, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createSignTexture(titleAr: string, subtitleAr: string, bg = '#23150d'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  // Brass double border
  ctx.strokeStyle = '#d4a04a';
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 488, 232);
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 464, 208);

  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 58px Cairo, Amiri, sans-serif';
  ctx.fillText(titleAr, 256, 102);

  ctx.fillStyle = '#e7c27d';
  ctx.font = '600 28px Cairo, sans-serif';
  ctx.fillText(subtitleAr, 256, 174);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPosterTexture(
  title: string,
  accent: string,
  motif: 'cinema' | 'football' | 'tea'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f5ead6';
  ctx.fillRect(0, 0, 256, 360);

  ctx.strokeStyle = '#3e2718';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 244, 348);

  ctx.fillStyle = accent;
  ctx.fillRect(22, 22, 212, 210);

  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  if (motif === 'football') {
    ctx.arc(128, 127, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (motif === 'tea') {
    ctx.fillRect(92, 85, 72, 90);
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(98, 110, 60, 58);
  } else {
    ctx.arc(128, 115, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(88, 165, 80, 55);
  }

  ctx.fillStyle = '#29170b';
  ctx.font = 'bold 28px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 128, 286);

  ctx.fillStyle = '#78350f';
  ctx.font = '600 18px Cairo, sans-serif';
  ctx.fillText('من تراث الحتة', 128, 322);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(12, 7, 4, 0.58)');
  grad.addColorStop(0.55, 'rgba(12, 7, 4, 0.24)');
  grad.addColorStop(1, 'rgba(12, 7, 4, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function drawTVMatchFrame(
  ctx: CanvasRenderingContext2D,
  time: number,
  powerOutage: boolean
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  if (powerOutage) {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? '#6b7280' : '#1f2937';
      ctx.fillRect(x, y, 6, 2);
    }
    return;
  }

  // Green football pitch
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, w, h);

  // Pitch stripes
  ctx.fillStyle = '#166534';
  for (let i = 0; i < 6; i += 2) {
    ctx.fillRect((i * w) / 6, 0, w / 6, h);
  }

  // Pitch lines
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.beginPath();
  ctx.moveTo(w / 2, 10);
  ctx.lineTo(w / 2, h - 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 26, 0, Math.PI * 2);
  ctx.stroke();

  // Animated players
  for (let i = 0; i < 6; i++) {
    const teamA = i < 3;
    const px =
      w * 0.25 +
      (teamA ? 0 : w * 0.35) +
      Math.sin(time * 1.8 + i * 1.7) * 32;
    const py = h * 0.25 + ((i % 3) * h * 0.25) + Math.cos(time * 2.2 + i) * 14;
    ctx.fillStyle = teamA ? '#ef4444' : '#f8fafc';
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ball
  const bx = w / 2 + Math.sin(time * 2.7) * (w * 0.32);
  const by = h / 2 + Math.cos(time * 3.4) * (h * 0.26);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(bx, by, 5, 0, Math.PI * 2);
  ctx.fill();

  // Score bug
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(14, 14, 92, 24);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('CAI 2 - 1 ALX', 20, 31);
}

/**
 * Generates a subtle Pixar-style warm skin texture with rosy cheeks,
 * soft under-eye warmth, and optional 5-o'clock jaw stubble.
 * Aligned so UV u = 0.5 corresponds to the front (+Z) of the head sphere.
 */
export function createCharacterFaceTexture(
  baseSkinHex: string,
  hasStubble = true
): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseSkinHex;
  ctx.fillRect(0, 0, w, h);

  // Warm forehead & nose bridge radiance
  const noseGlow = ctx.createRadialGradient(w * 0.5, h * 0.52, 4, w * 0.5, h * 0.52, 34);
  noseGlow.addColorStop(0, 'rgba(255, 218, 185, 0.25)');
  noseGlow.addColorStop(1, 'rgba(255, 218, 185, 0)');
  ctx.fillStyle = noseGlow;
  ctx.fillRect(0, 0, w, h);

  // Subtle rosy cheeks on left & right face (u ~ 0.42 and 0.58)
  [0.42, 0.58].forEach((cx) => {
    const blush = ctx.createRadialGradient(w * cx, h * 0.57, 2, w * cx, h * 0.57, 22);
    blush.addColorStop(0, 'rgba(218, 98, 78, 0.26)');
    blush.addColorStop(1, 'rgba(218, 98, 78, 0)');
    ctx.fillStyle = blush;
    ctx.fillRect(0, 0, w, h);
  });

  // Subtle jaw / chin 5-o'clock stubble shadow
  if (hasStubble) {
    const jawGrad = ctx.createRadialGradient(w * 0.5, h * 0.72, 10, w * 0.5, h * 0.69, 44);
    jawGrad.addColorStop(0, 'rgba(42, 30, 24, 0.24)');
    jawGrad.addColorStop(0.65, 'rgba(42, 30, 24, 0.14)');
    jawGrad.addColorStop(1, 'rgba(42, 30, 24, 0)');
    ctx.fillStyle = jawGrad;
    ctx.fillRect(w * 0.34, h * 0.55, w * 0.32, h * 0.32);

    // Fine speckled pores/stubble dots around jaw
    ctx.fillStyle = 'rgba(36, 24, 18, 0.15)';
    for (let i = 0; i < 160; i++) {
      const rx = w * (0.4 + ((i * 73) % 100) / 500);
      const ry = h * (0.61 + ((i * 37) % 100) / 520);
      ctx.fillRect(rx, ry, 1.3, 1.3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates subtle woven cotton / linen / galabeya fabric grain.
 */
export function createFabricTexture(
  baseHex: string,
  style: 'shirt' | 'apron' | 'galabeya' | 'pants' = 'shirt'
): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  const step = style === 'apron' ? 4 : 3;
  for (let y = 0; y < size; y += step) {
    ctx.fillStyle = y % (step * 2) === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, y, size, 1);
  }
  for (let x = 0; x < size; x += step) {
    ctx.fillStyle = x % (step * 2) === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(x, 0, 1, size);
  }

  if (style === 'galabeya') {
    // Soft vertical weave highlight
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < size; x += 16) {
      ctx.fillRect(x, 0, 2, size);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createUmmKulthumPosterTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 340;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Vintage sepia-gold backdrop
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 16, w * 0.5, h * 0.45, 190);
  bg.addColorStop(0, '#f3dfb6');
  bg.addColorStop(0.65, '#cfa66c');
  bg.addColorStop(1, '#5b391e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Ornate inner frame
  ctx.strokeStyle = '#3b210e';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  // Classic updo silhouette + head
  ctx.fillStyle = '#1f140e';
  ctx.beginPath();
  ctx.arc(w / 2, 106, 46, 0, Math.PI * 2);
  ctx.fill();
  // Classic bun on top
  ctx.beginPath();
  ctx.ellipse(w / 2, 66, 28, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Warm face oval
  ctx.fillStyle = '#e6bd92';
  ctx.beginPath();
  ctx.ellipse(w / 2, 126, 36, 44, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair sweep across forehead
  ctx.fillStyle = '#1f140e';
  ctx.beginPath();
  ctx.arc(w / 2, 105, 38, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();

  // Iconic dark vintage cat-eye sunglasses
  ctx.fillStyle = '#111827';
  ctx.fillRect(w / 2 - 31, 114, 26, 15);
  ctx.fillRect(w / 2 + 5, 114, 26, 15);
  ctx.fillRect(w / 2 - 5, 118, 10, 4);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.strokeRect(w / 2 - 31, 114, 26, 15);
  ctx.strokeRect(w / 2 + 5, 114, 26, 15);

  // Gentle dignified smile
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(w / 2, 146, 11, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Evening gown shoulders & flowing silk handkerchief (mandil)
  ctx.fillStyle = '#29150b';
  ctx.beginPath();
  ctx.moveTo(46, 250);
  ctx.quadraticCurveTo(w / 2, 170, w - 46, 250);
  ctx.lineTo(w - 46, 274);
  ctx.lineTo(46, 274);
  ctx.closePath();
  ctx.fill();

  // Pearl necklace
  ctx.fillStyle = '#fefce8';
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(w / 2 + i * 7, 186 + Math.abs(i) * 1.2, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flowing white handkerchief accent
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(w / 2 + 34, 212);
  ctx.quadraticCurveTo(w / 2 + 65, 232, w / 2 + 52, 270);
  ctx.lineTo(w / 2 + 28, 252);
  ctx.closePath();
  ctx.fill();

  // Banner title
  ctx.fillStyle = '#2b160a';
  ctx.fillRect(24, 264, w - 48, 52);
  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 26px Amiri, Cairo, sans-serif';
  ctx.fillText('كوكب الشرق', w / 2, 286);
  ctx.fillStyle = '#f59e0b';
  ctx.font = '600 13px Cairo, sans-serif';
  ctx.fillText('أم كلثوم · ركن الطرب الأصيل', w / 2, 306);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createNewspaperTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eadfc7';
  ctx.fillRect(0, 0, w, h);

  // Masthead
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(10, 10, w - 20, 30);
  ctx.fillStyle = '#fef3c7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px Cairo, sans-serif';
  ctx.fillText('أخبار الحتة والقهوة', w / 2, 25);

  // Headline & photo block
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 14px Cairo, sans-serif';
  ctx.fillText('ماتش القمة يشعل المدرجات!', w / 2, 54);

  ctx.fillStyle = '#475569';
  ctx.fillRect(18, 68, 92, 62);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(26, 76, 76, 46);

  // Text columns
  ctx.fillStyle = '#334155';
  for (let row = 0; row < 7; row++) {
    ctx.fillRect(124, 72 + row * 12, 114, 5);
  }
  for (let row = 0; row < 3; row++) {
    ctx.fillRect(18, 144 + row * 11, 220, 5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRadioDialTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 96;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, '#78350f');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(1, '#78350f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  // Frequency ticks
  ctx.fillStyle = '#1c1008';
  for (let x = 22; x < w - 20; x += 12) {
    const tall = x % 36 === 22;
    ctx.fillRect(x, tall ? 22 : 30, 2, tall ? 24 : 14);
  }

  // Tuning needle
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(w * 0.62, 12, 4, h - 24);

  ctx.fillStyle = '#1c1008';
  ctx.font = 'bold 14px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('إذاعة القاهرة  ·  صوت الطرب', w / 2, 74);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWovenCaneTexture(upgraded = false): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = upgraded ? '#7f1d1d' : '#c69f62';
  ctx.fillRect(0, 0, size, size);

  if (upgraded) {
    // Velvet cushion diamond stitching
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.16)';
    ctx.lineWidth = 2;
    for (let i = -size; i < size * 2; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.moveTo(i + size, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
    }
  } else {
    // Weathered straw/cane crisscross pattern with worn patches
    for (let y = 0; y < size; y += 8) {
      ctx.fillStyle = y % 16 === 0 ? 'rgba(92, 58, 24, 0.28)' : 'rgba(245, 222, 179, 0.24)';
      ctx.fillRect(0, y, size, 3);
    }
    for (let x = 0; x < size; x += 8) {
      ctx.fillStyle = x % 16 === 0 ? 'rgba(72, 44, 16, 0.25)' : 'rgba(250, 232, 190, 0.22)';
      ctx.fillRect(x, 0, 3, size);
    }
    // Subtle aged center scuff
    const wear = ctx.createRadialGradient(64, 64, 6, 64, 64, 48);
    wear.addColorStop(0, 'rgba(78, 52, 26, 0.26)');
    wear.addColorStop(1, 'rgba(78, 52, 26, 0)');
    ctx.fillStyle = wear;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLightShaftTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const vert = ctx.createLinearGradient(0, 0, 0, h);
  vert.addColorStop(0, 'rgba(255, 226, 158, 0.42)');
  vert.addColorStop(0.55, 'rgba(255, 214, 130, 0.16)');
  vert.addColorStop(1, 'rgba(255, 214, 130, 0)');
  ctx.fillStyle = vert;
  ctx.fillRect(0, 0, w, h);

  // Soft horizontal edge feathering
  ctx.globalCompositeOperation = 'destination-in';
  const horiz = ctx.createLinearGradient(0, 0, w, 0);
  horiz.addColorStop(0, 'rgba(0,0,0,0)');
  horiz.addColorStop(0.25, 'rgba(0,0,0,1)');
  horiz.addColorStop(0.75, 'rgba(0,0,0,1)');
  horiz.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = horiz;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTawlaBoardTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a2511';
  ctx.fillRect(0, 0, w, h);

  // Two inner playing trays
  ctx.fillStyle = '#e7d3ad';
  ctx.fillRect(14, 14, 108, h - 28);
  ctx.fillRect(134, 14, 108, h - 28);

  // Alternating backgammon points
  const drawPoints = (startX: number) => {
    const pw = 18;
    for (let i = 0; i < 6; i++) {
      const px = startX + i * pw;
      ctx.fillStyle = i % 2 === 0 ? '#7f1d1d' : '#1f2937';
      // Top triangles
      ctx.beginPath();
      ctx.moveTo(px, 14);
      ctx.lineTo(px + pw, 14);
      ctx.lineTo(px + pw / 2, 74);
      ctx.closePath();
      ctx.fill();
      // Bottom triangles
      ctx.fillStyle = i % 2 === 0 ? '#1f2937' : '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(px, h - 14);
      ctx.lineTo(px + pw, h - 14);
      ctx.lineTo(px + pw / 2, h - 74);
      ctx.closePath();
      ctx.fill();
    }
  };
  drawPoints(14);
  drawPoints(134);

  // Brass hinges
  ctx.fillStyle = '#d4a04a';
  ctx.fillRect(123, 30, 10, 18);
  ctx.fillRect(123, h - 48, 10, 18);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}



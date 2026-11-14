export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export interface RoomCameraBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
}

export const DEFAULT_CAFE_CAMERA_BOUNDS: RoomCameraBounds = {
  minX: -7.1,
  maxX: 7.1,
  minZ: -6.1,
  maxZ: 6.1,
  minY: 1.05,
  maxY: 4.32,
};

export interface CameraRigSolution {
  position: Vec3Like;
  lookAt: Vec3Like;
  playerOpacity: number;
  effectiveDist: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Computes a collision-aware, wall-avoiding third-person management camera position.
 * - Pulls camera inward along the view ray if an obstacle/wall was hit.
 * - Automatically raises camera height if clamped close to a wall so the player
 *   body never fills half the screen.
 * - Computes subtle player fade if camera is forced very close.
 */
export function solveThirdPersonCamera(params: {
  anchor: Vec3Like;
  camYaw: number;
  camPitch: number;
  camDist: number;
  rayHitDist: number | null;
  bounds?: RoomCameraBounds;
}): CameraRigSolution {
  const bounds = params.bounds ?? DEFAULT_CAFE_CAMERA_BOUNDS;
  const { anchor, camYaw, camPitch, camDist, rayHitDist } = params;

  const minSafeDist = 1.9;
  const desiredDist =
    rayHitDist !== null
      ? Math.max(minSafeDist, Math.min(camDist, rayHitDist - 0.35))
      : camDist;

  const cosPitch = Math.cos(camPitch);
  const sinPitch = Math.sin(camPitch);
  const dirX = Math.sin(camYaw) * cosPitch;
  const dirY = sinPitch;
  const dirZ = Math.cos(camYaw) * cosPitch;

  let cx = anchor.x + dirX * desiredDist;
  let cy = anchor.y + dirY * desiredDist + 0.25;
  let cz = anchor.z + dirZ * desiredDist;

  // Clamp within interior room volume
  cx = clamp(cx, bounds.minX, bounds.maxX);
  cz = clamp(cz, bounds.minZ, bounds.maxZ);
  cy = clamp(cy, bounds.minY, bounds.maxY);

  // If clamping pushed the camera horizontally close to the player, elevate camera
  // overhead so it looks down over the cafe rather than getting jammed in the player's back.
  const horizDist = Math.hypot(cx - anchor.x, cz - anchor.z);
  if (horizDist < 2.6) {
    const squeeze = (2.6 - horizDist) / 2.6;
    cy = clamp(cy + squeeze * 1.45, bounds.minY, bounds.maxY);
  }

  const totalDist = Math.hypot(cx - anchor.x, cy - anchor.y, cz - anchor.z);
  const playerOpacity =
    totalDist < 1.65 ? clamp(0.28 + ((totalDist - 0.9) / 0.75) * 0.72, 0.28, 1) : 1;

  // Look slightly ahead of anchor into the cafe room
  const lookAt: Vec3Like = {
    x: anchor.x - Math.sin(camYaw) * 0.35,
    y: anchor.y - 0.12,
    z: anchor.z - Math.cos(camYaw) * 0.35,
  };

  return {
    position: { x: cx, y: cy, z: cz },
    lookAt,
    playerOpacity,
    effectiveDist: totalDist,
  };
}

/**
 * Checks if a segment from camPos to playerPos intersects an axis-aligned wall slab
 * (used to fade foreground walls/door leaves when they obstruct the camera view).
 */
export function segmentIntersectsAABB(
  p0: Vec3Like,
  p1: Vec3Like,
  box: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }
): boolean {
  let tmin = 0;
  let tmax = 1;

  const axes: Array<['x' | 'y' | 'z', 'minX' | 'minY' | 'minZ', 'maxX' | 'maxY' | 'maxZ']> = [
    ['x', 'minX', 'maxX'],
    ['y', 'minY', 'maxY'],
    ['z', 'minZ', 'maxZ'],
  ];

  for (const [axis, minKey, maxKey] of axes) {
    const start = p0[axis];
    const delta = p1[axis] - start;
    const bmin = box[minKey];
    const bmax = box[maxKey];

    if (Math.abs(delta) < 1e-6) {
      if (start < bmin || start > bmax) return false;
    } else {
      let t1 = (bmin - start) / delta;
      let t2 = (bmax - start) / delta;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }

  return tmax >= 0 && tmin <= 1;
}

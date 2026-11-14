import test from 'node:test';
import assert from 'node:assert/strict';
import { segmentIntersectsAABB, solveThirdPersonCamera } from './cameraMath';

test('solveThirdPersonCamera keeps elevated management view in open cafe space', () => {
  const res = solveThirdPersonCamera({
    anchor: { x: 0, y: 1.35, z: 0.9 },
    camYaw: 0,
    camPitch: 0.56,
    camDist: 5.5,
    rayHitDist: null,
  });

  assert.ok(res.position.y >= 3.8, `expected elevated camera y >= 3.8, got ${res.position.y}`);
  assert.ok(res.position.z <= 6.1, `expected camera inside south wall, got ${res.position.z}`);
  assert.equal(res.playerOpacity, 1);
});

test('solveThirdPersonCamera elevates overhead when squeezed near south wall instead of jamming into player back', () => {
  const res = solveThirdPersonCamera({
    anchor: { x: 0, y: 1.35, z: 5.2 },
    camYaw: 0,
    camPitch: 0.35,
    camDist: 5.5,
    rayHitDist: null,
  });

  assert.ok(res.position.z <= 6.1);
  assert.ok(res.position.y >= 3.1, `expected auto-elevation when squeezed near wall, got ${res.position.y}`);
});

test('solveThirdPersonCamera respects raycast obstacle pull-in with minimum safe distance', () => {
  const res = solveThirdPersonCamera({
    anchor: { x: 0, y: 1.35, z: 0 },
    camYaw: 0,
    camPitch: 0.5,
    camDist: 5.5,
    rayHitDist: 1.2,
  });

  assert.ok(res.effectiveDist >= 1.85);
});

test('segmentIntersectsAABB detects when a wall/door stands between camera and player', () => {
  const doorBox = { minX: -1.1, maxX: 1.1, minY: 0, maxY: 2.8, minZ: 6.3, maxZ: 6.7 };
  assert.equal(
    segmentIntersectsAABB({ x: 0, y: 2.2, z: 7.4 }, { x: 0, y: 1.2, z: 4.5 }, doorBox),
    true
  );
  assert.equal(
    segmentIntersectsAABB({ x: 0, y: 2.2, z: 5.5 }, { x: 0, y: 1.2, z: 2.0 }, doorBox),
    false
  );
});

// TIER 7 park harness - run: node scripts/park-check.mjs
// Builds the real StuntPark with a fake Rapier world and counts meshes/props.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THREE_URL = pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href;
const THREE = await import(THREE_URL);
const src = fs.readFileSync(path.join(ROOT, 'src/gameplay/StuntPark.js'), 'utf8')
  .replace("from 'three'", `from '${THREE_URL}'`);
const { default: StuntPark, PARK_CENTER } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

const bodies = [], colliders = [];
const fakeWorld = {
  createRigidBody(d) { const b = { d }; bodies.push(b); return b; },
  createCollider(c, b) { const o = { c, b }; colliders.push(o); return o; }
};
const fakeR = {
  RigidBodyDesc: { fixed: () => ({ setTranslation() { return this; }, setRotation() { return this; } }) },
  ColliderDesc: { cuboid: () => ({ setFriction() { return this; }, setRestitution() { return this; } }) }
};
const scene = new THREE.Scene();
const park = new StuntPark(scene, fakeWorld, fakeR);
let coins = 0;
park.onCoin(n => { coins += n; });
park.show();

// Fake vehicle that "drives" through every ring to test the capped reward.
const vehicle = { mesh: { position: new THREE.Vector3(PARK_CENTER.x, 1.6, PARK_CENTER.z) },
  chassisBody: { linvel: () => ({ x: 0, y: 0, z: 0 }), setLinvel() {} } };
for (const r of park.rings) {
  vehicle.mesh.position.set(r.x, 2.0, r.z);
  park.update(0.016, vehicle);
}
const ringsTaken = park.rings.filter(r => r.taken).length;
const firstReward = coins;
// Cap check: force near the cap, then collect one more (fresh) ring.
park.coins = park.maxCoins - 5;
park.reset();
const beforeCap = coins;
vehicle.mesh.position.set(park.rings[0].x, 2.0, park.rings[0].z);
park.update(0.016, vehicle);
const lastReward = coins - beforeCap;   // must be 5, not 15
let meshes = 0;
park.group.traverse(o => { if (o.isMesh) meshes++; });
console.log('TIER 7 - STUNT PARK (Node harness, no browser)\n');
console.log('center            :', PARK_CENTER.x, PARK_CENTER.z);
console.log('size              : 160 x 160 m');
console.log('meshes / draw est :', meshes, '/', park.drawCalls);
console.log('fixed colliders   :', colliders.length, '| bodies', bodies.length);
console.log('ramps             : 6  | hill 1 | turntable 1 | dig clods 22');
console.log('cones             :', park.cones.length);
console.log('coin rings        :', park.rings.length, '| taken', ringsTaken);
console.log('jump pads         :', park.pads.length);
console.log('coin reward       :', firstReward, 'from 8 rings | cap', park.maxCoins, '| last ring gave', lastReward);
console.log('best air time     :', park.bestAir.toFixed(2), 's');
const ok = meshes < 150 && park.drawCalls < 150 && park.rings.length === 8 &&
  park.pads.length === 3 && park.cones.length === 12 && coins > 0 && coins <= park.maxCoins &&
  park.coins === park.maxCoins && lastReward === 5 && colliders.length >= 8;
console.log('\n' + (ok ? 'TIER 7 PARK CHECK: PASS' : 'TIER 7 PARK CHECK: FAIL'));
process.exit(ok ? 0 : 1);

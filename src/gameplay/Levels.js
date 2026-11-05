// TerraForm 3D - 15 levels, 3 chapters, 8 different kinds of work.
// One engine builds the goal objects and decides when a goal is reached.
// main.js still owns physics, the dig animation, coins and the result window.
// All art is made in code (no outside images, fonts or sounds).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const CHAPTERS = [
  { id: 1, name: 'Rookie Yard', from: 1, to: 5 },
  { id: 2, name: 'Contractor', from: 6, to: 10 },
  { id: 3, name: 'Site Boss', from: 11, to: 15 }
];

const E = (id, sun, hemi, fog, fogColor, lights, rain) => (
  { id, sun, hemi, fog, fogColor, lights: !!lights, rain: !!rain }
);
const MORNING = E('morning', 1.0, 1.0, 0.0011, 0xcfe2f3);
const DAY = E('day', 1.05, 1.0, 0.0011, 0xd8e7f5);
const DUSK = E('dusk', 0.70, 0.80, 0.0015, 0xe8c9a8);
const NIGHT = E('night', 0.16, 0.32, 0.0024, 0x0a1020, true);
const STORM = E('storm', 0.45, 0.70, 0.0055, 0x8e9aa6, true, true);
const DAWN = E('dawn', 0.85, 0.90, 0.0016, 0xf0d9bd);
const GOLDEN = E('golden', 0.95, 0.90, 0.0013, 0xffd9a0);

// A9: 3 short coaching lines per level. No generic repeated sentences.
// Each line is at most 8 words, so it fits one line on a phone.
export const COACH = {
  1:  ['Drive to the dirt pile', 'Hold SCOOP for 1.6 seconds', 'Hold DUMP over the blue truck'],
  2:  ['Follow the amber gate ring', 'Keep the bucket low', 'Pass every gate in order'],
  3:  ['Scoop the near dirt pile', 'Aim for the amber ring', 'Dump inside the marked hole'],
  4:  ['Drive the long park road', 'Watch the trees on both sides', 'Line up with the truck bed'],
  5:  ['Find the glowing pile', 'Scoop before the ring fades', 'Load the waiting blue truck'],
  6:  ['Stop on the trench plate', 'Hold SCOOP to dig', 'Dump spoil, then find the next'],
  7:  ['Pick up the pipe rack', 'Carry it slowly', 'Place it on the amber pad'],
  8:  ['Use your work lights', 'Follow the map arrow', 'Drive slowly in the dark'],
  9:  ['Scoop, then cross the barrier', 'Keep the load level', 'Dump on the bridge deck'],
  10: ['Watch the crossing car', 'Scoop at the night pile', 'Load the glowing night truck'],
  11: ['Find the glowing debris', 'Scoop it cleanly', 'Dump, then find the next pile'],
  12: ['Dig boxes in arrow order', 'Six boxes, one by one', 'Dump, then move to the next'],
  13: ['Pick up the crate stack', 'Grip it with the bucket', 'Place it on the amber pad'],
  14: ['Lower the bucket with E', 'Pass under the low beam', 'Only the amber gate counts'],
  15: ['Three phases, watch the card', 'Haul, checkpoints, then deck fills', 'Finish all goals before time']
};
const H = (scoop, dump) => ({ scoop, dump });
const S = (bearing, dist, spread, gap) => ({ bearing, dist, spread, gap });

// steps = the ordered goals. Each goal is ONE load in JobSystem.
// kinds: haul | fill | move | gate | trench | debris | rush
// 'move' means: pick up a pipe / crate, then place it on the marked pad.
// 'trench' and 'debris' count on the SCOOP (the following dump is just clearing the bucket).
// 'gate' counts when the machine drives through the amber gate in order.
// One explicit, safe start pose per level. Positions are relative to the
// actual free site found by JobSystem, so no machine can spawn inside a prop.
// 'face' points the machine at its first task; 'cam' is the chase distance.
export function levelStartPose(job, site, firstGoal) {
  const s = job && job.start ? job.start : { back: 20, side: 8, face: 'pile', cam: 12 };
  const dx = site.truck.x - site.pile.x, dz = site.truck.z - site.pile.z;
  const L = Math.hypot(dx, dz) || 1;
  const ux = dx / L, uz = dz / L, vx = -uz, vz = ux;
  const x = site.pile.x - ux * s.back + vx * s.side;
  const z = site.pile.z - uz * s.back + vz * s.side;
  let tx = site.pile.x, tz = site.pile.z;
  if (s.face === 'truck') { tx = site.truck.x; tz = site.truck.z; }
  else if (s.face === 'first' && firstGoal) { tx = firstGoal.x; tz = firstGoal.z; }
  const yaw = Math.atan2(tx - x, tz - z);
  return {
    x: x, y: 1.2, z: z, yaw: yaw, cam: s.cam,
    quat: { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) }
  };
}

export const LEVELS = [
  {
    id: 1, name: 'First Scoop', chapter: 1, type: 'HAUL', theme: 'Rookie Yard',
    story: 'A storm dumped dirt across the highway. Clear it before rush hour.',
    steps: [{ kind: 'haul', n: 3 }], loads: 3, time: 180, reward: 150, tutorial: true,
    start: { back: 18, side: 7, face: 'pile', cam: 12 },
    needs: {}, bonus: { text: 'No missed dumps', coins: 40 }, env: MORNING,
    site: { keep: true }, dressing: 'yard',
    scoopText: 'Scoop dirt from the pile', dumpText: 'Dump it in the blue truck',
    hints: H('Drive to the dirt pile, then press F to scoop.', 'Now drive to the blue truck and press F to dump.'),
    rule: 'Learn the machine: scoop, drive, dump.'
  },
  {
    id: 2, name: 'Cone School', chapter: 1, type: 'CONE', theme: 'Training course',
    story: 'No digging today. Thread the backhoe through five cone gates without knocking them over.',
    steps: [{ kind: 'gate', n: 5 }], loads: 5, time: 190, reward: 220,
    start: { back: 14, side: -12, face: 'first', cam: 13 },
    needs: { job: 1 }, bonus: { text: 'No cones knocked over', coins: 50 }, env: DAY,
    site: S(90, 150, 60, 24), dressing: 'course', gates: { width: 4.6, slalom: 7 },
    scoopText: 'Drive through the amber gates', dumpText: 'Drive through the amber gates',
    hints: H('Follow the glowing arrow. Drive between each pair of cones.', 'Gates must be passed in order. The active gate glows amber.'),
    rule: 'Drive through 5 gates in order. Do not hit the cones.'
  },
  {
    id: 3, name: 'Fill the Pothole', chapter: 1, type: 'FILL', theme: 'Road repair',
    story: 'Rain broke the road. Fill the pothole with three loads of soil - no truck this time.',
    steps: [{ kind: 'fill', n: 3 }], loads: 3, time: 200, reward: 260,
    start: { back: 22, side: 9, face: 'pile', cam: 12 },
    needs: { job: 2 }, bonus: { text: 'Every load landed in the hole', coins: 50 }, env: MORNING,
    site: S(270, 185, 55, 20), dressing: 'road',
    scoopText: 'Scoop soil from the pile', dumpText: 'Tip it into the marked pothole',
    hints: H('Scoop at the dirt pile, same as before.', 'The blue truck is away. Dump inside the amber ring on the road.'),
    rule: 'Dump into the hole. The mound grows with every load.'
  },
  {
    id: 4, name: 'Park Clean-up', chapter: 1, type: 'HAUL', theme: 'Landslide',
    story: 'A landslide buried the park paths. Move the dirt out, load by load.',
    steps: [{ kind: 'haul', n: 4 }], loads: 4, time: 230, reward: 300,
    start: { back: 26, side: -8, face: 'pile', cam: 14 },
    needs: { job: 3 }, bonus: { text: 'No missed dumps', coins: 60 }, env: DAY,
    site: S(45, 205, 50, 26), dressing: 'park',
    scoopText: 'Scoop the landslide dirt', dumpText: 'Dump it in the park truck',
    hints: H('A longer drive through the park. Watch the trees.', 'Line up with the truck bed and press F.'),
    rule: 'Four loads, narrow park paths.'
  },
  {
    id: 5, name: 'Rush Hour Lite', chapter: 1, type: 'RUSH', theme: 'Chapter boss',
    story: 'Three trucks are queued in the loading lanes. Load each one before its waiting timer runs out.',
    steps: [{ kind: 'rush', n: 3 }], loads: 3, time: 240, reward: 380,
    start: { back: 16, side: 11, face: 'truck', cam: 13 },
    needs: { job: 4 }, bonus: { text: 'No missed truck', coins: 90 }, env: DUSK,
    site: S(180, 165, 55, 26), dressing: 'city', rush: true, trucks: 3, truckWait: 48,
    scoopText: 'Scoop dirt from the pile', dumpText: 'Dump in the waiting truck',
    hints: H('Drive to the highlighted dirt pile and scoop.', 'Load the glowing truck before its timer ring runs out.'),
    rule: 'Three trucks wait in three lanes. A truck drives away if its timer expires.'
  },
  {
    id: 6, name: 'Dig the Trench', chapter: 2, type: 'TRENCH', theme: 'Utility work',
    story: 'Four trench sections must be opened before the pipes arrive. Dig each marked section in order.',
    steps: [{ kind: 'trench', n: 4 }], loads: 4, time: 260, reward: 450,
    start: { back: 20, side: -13, face: 'first', cam: 12 },
    needs: { job: 5 }, bonus: { text: 'Every trench dug on the first pass', coins: 70 }, env: DUSK,
    site: S(0, 215, 50, 26), dressing: 'trench',
    scoopText: 'Dig the marked trench', dumpText: 'Empty the bucket in the truck',
    hints: H('Drive to the glowing trench plate and press F there.', 'Dump the spoil, then go to the next trench plate.'),
    rule: 'Dig 4 marked trench sections in order.'
  },
  {
    id: 7, name: 'Pipe Layer', chapter: 2, type: 'MOVE', theme: 'Pipe yard',
    story: 'Carry three steel pipes from the rack to the marked pad. They ride in the bucket.',
    steps: [{ kind: 'move', n: 3 }], loads: 3, time: 270, reward: 500,
    start: { back: 18, side: 12, face: 'pile', cam: 12 },
    needs: { job: 6 }, bonus: { text: 'No pipe dropped', coins: 80 }, env: DAY,
    site: S(135, 190, 55, 24), dressing: 'pipes',
    scoopText: 'Pick up a pipe from the rack', dumpText: 'Place the pipe on the pad',
    hints: H('Press F at the pipe rack. The pipe snaps into the bucket.', 'Drive to the amber pad and press F to place it.'),
    rule: 'Carry 3 pipes. No real physics: they snap into the bucket.'
  },
  {
    id: 8, name: 'Night Shift', chapter: 2, type: 'HAUL', theme: 'Dark city',
    story: 'The city sleeps. Work lights on, five loads to move before dawn.',
    steps: [{ kind: 'haul', n: 5 }], loads: 5, time: 250, reward: 560,
    start: { back: 24, side: -10, face: 'pile', cam: 14 },
    needs: { job: 7 }, bonus: { text: 'No missed dumps', coins: 90 }, env: NIGHT,
    site: S(225, 160, 55, 24), dressing: 'night',
    scoopText: 'Scoop dirt in the dark', dumpText: 'Dump it in the truck',
    hints: H('Use the map arrow and the work light to find the pile.', 'The truck has lights. Drive slowly in the dark.'),
    rule: 'Five loads at night, with work lights.'
  },
  {
    id: 9, name: 'Bridge Repair', chapter: 2, type: 'FILL', theme: 'Bridge deck',
    story: 'The bridge approach is cracked. Fill five deck holes with fresh soil.',
    steps: [{ kind: 'fill', n: 5 }], loads: 5, time: 300, reward: 620,
    start: { back: 21, side: 8, face: 'pile', cam: 12 },
    needs: { job: 8 }, bonus: { text: 'Every load landed in a hole', coins: 100 }, env: DAWN,
    site: S(315, 200, 55, 26), dressing: 'bridge',
    scoopText: 'Scoop soil for the deck', dumpText: 'Tip it into the deck hole',
    hints: H('Scoop at the pile, then cross the barrier line.', 'Dump inside the amber ring on the bridge deck.'),
    rule: 'Five deck holes, one mound per hole.'
  },
  {
    id: 10, name: 'Night Rush', chapter: 2, type: 'RUSH', theme: 'Chapter boss',
    story: 'Midnight shift. Five trucks, five loads, and crossing traffic on the night lane.',
    steps: [{ kind: 'rush', n: 5 }], loads: 5, time: 300, reward: 700,
    start: { back: 17, side: -11, face: 'truck', cam: 13 },
    needs: { job: 9 }, bonus: { text: 'No missed truck', coins: 120 }, env: NIGHT,
    site: S(90, 230, 50, 28), dressing: 'night', rush: true, trucks: 5, truckWait: 42,
    crossTraffic: true,
    scoopText: 'Scoop dirt from the pile', dumpText: 'Dump in the waiting truck',
    hints: H('Scoop at the pile, then watch the crossing car.', 'Load the glowing night truck before its ring runs out.'),
    rule: 'Five night trucks, crossing traffic and a red danger strip. A missed truck drives away.'
  },
  {
    id: 11, name: 'Storm Clean-up', chapter: 3, type: 'CLEAR', theme: 'Storm damage',
    story: 'Six debris piles block the rescue route. Clear them all in the rain.',
    steps: [{ kind: 'debris', n: 6 }], loads: 6, time: 320, reward: 780,
    start: { back: 25, side: 13, face: 'first', cam: 14 },
    needs: { job: 10 }, bonus: { text: 'Every pile cleared on the first pass', coins: 130 }, env: STORM,
    site: S(270, 240, 50, 28), dressing: 'storm',
    scoopText: 'Clear the marked debris pile', dumpText: 'Empty the bucket in the truck',
    hints: H('Drive to the glowing debris pile and press F.', 'Dump the debris, then find the next pile.'),
    rule: 'Clear 6 debris piles in heavy rain.'
  },
  {
    id: 12, name: 'Foundation Dig', chapter: 3, type: 'TRENCH', theme: 'Deep foundation',
    story: 'A tower starts here. Open six foundation boxes in the soft morning light.',
    steps: [{ kind: 'trench', n: 6 }], loads: 6, time: 340, reward: 860,
    start: { back: 19, side: -9, face: 'first', cam: 12 },
    needs: { job: 11 }, bonus: { text: 'Every box dug on the first pass', coins: 140 }, env: DAWN,
    site: S(0, 250, 50, 28), dressing: 'trench',
    scoopText: 'Dig the marked foundation box', dumpText: 'Empty the bucket in the truck',
    hints: H('Six boxes. Dig them in the order shown by the arrow.', 'Dump, then move to the next glowing box.'),
    rule: 'Six deep foundation boxes in order.'
  },
  {
    id: 13, name: 'Crane Support', chapter: 3, type: 'MOVE', theme: 'Heavy lift',
    story: 'Four crates must reach the crane pad. Carry them one at a time in the bucket.',
    steps: [{ kind: 'move', n: 4 }], loads: 4, time: 350, reward: 940,
    start: { back: 23, side: 10, face: 'pile', cam: 13 },
    needs: { job: 12 }, bonus: { text: 'No crate dropped', coins: 150 }, env: DAY,
    site: S(45, 245, 50, 28), dressing: 'crane',
    scoopText: 'Pick up a crate', dumpText: 'Stack the crate on the crane pad',
    hints: H('Press F at the crate stack.', 'Carry it to the amber pad and press F.'),
    rule: 'Carry 4 crates to the crane pad.'
  },
  {
    id: 14, name: 'Skill Course', chapter: 3, type: 'CONE', theme: 'Precision test',
    story: 'Eight gates, one low beam. Lower the bucket to pass under it. Precision, not speed.',
    steps: [{ kind: 'gate', n: 8 }], loads: 8, time: 300, reward: 1000,
    start: { back: 15, side: -12, face: 'first', cam: 12 },
    needs: { job: 13 }, bonus: { text: 'No cones knocked over', coins: 160 }, env: DAY,
    site: S(180, 200, 50, 30), dressing: 'course', gates: { width: 4.2, slalom: 10 }, beam: 3,
    scoopText: 'Drive through the gates', dumpText: 'Drive through the gates',
    hints: H('Lower the bucket before the low beam (press E).', 'Only the amber gate counts. Follow the arrow.'),
    rule: '8 gates. Gate 3 has a low beam: keep the bucket down.'
  },
  {
    id: 15, name: 'Mega Project', chapter: 3, type: 'MIX', theme: 'Final boss',
    story: 'The whole city is watching: three haul loads, three checkpoints, two deck fills. Finish the job.',
    steps: [
      { kind: 'haul', n: 3 }, { kind: 'gate', n: 3 }, { kind: 'fill', n: 2 }
    ], loads: 8, time: 420, reward: 1400,
    start: { back: 27, side: 8, face: 'pile', cam: 15 },
    needs: { job: 14 }, bonus: { text: 'Full combo, no misses', coins: 250 }, env: GOLDEN,
    site: S(0, 260, 45, 30), dressing: 'mega', gates: { width: 5.0, slalom: 8 }, rush: true,
    scoopText: 'Scoop for the final project', dumpText: 'Dump where the arrow points',
    hints: H('Three phases: haul, checkpoints, deck fills.', 'Watch the mission card. The goal changes after each phase.'),
    rule: 'Three phases in one job: haul, checkpoints, fill.'
  }
];

export function chapterOf(id) { return CHAPTERS.find(c => id >= c.from && id <= c.to) || CHAPTERS[0]; }

// ---------------------------------------------------------------------------
// LevelEngine: builds the goal objects and decides when a goal is reached.
// ---------------------------------------------------------------------------
const COL = {
  amber: 0xfbbf24, amberDark: 0x92400e, green: 0x34d399, blue: 0x2f6fdb,
  steel: 0x8a93a1, dark: 0x334155, soil: 0x7a5233, cone: 0xff6a1a,
  white: 0xf1f5f9, road: 0x3a3f47, pad: 0x223047, rust: 0xb45309
};

export class LevelEngine {
  constructor(scene, worldBuilder, siteNow, hooks) {
    this.scene = scene;
    this.world = worldBuilder;
    this.siteNow = siteNow || { pile: { x: 0, z: -120 }, truck: { x: 15, z: -120 } };
    this.hooks = hooks || {};
    this.job = null;
    this.group = null;
    this.goals = [];
    this.index = -1;
    this.done = 0;
    this.misses = 0;
    this.coneHits = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTime = 0;
    this.finished = false;
    this.carry = null;
    this.carryOn = false;
    this.marker = null;
    this.hole = null;
    this.pipesOnPad = [];
    this.rack = [];
    this.rushTarget = null;      // active waiting truck (RUSH levels)
    this.crossCar = null;        // night crossing traffic (L10, visual)
    this._mats = new Map();
    this._t = 0;
    this._prevSide = new Map();
  }

  // ---- small geometry helpers (all code-made) ----
  _mat(color, extra) {
    const k = color + '|' + JSON.stringify(extra || {});
    if (!this._mats.has(k)) {
      this._mats.set(k, new THREE.MeshStandardMaterial(Object.assign(
        { color, roughness: 0.82, metalness: 0.05 }, extra || {})));
    }
    return this._mats.get(k);
  }
  _mesh(geo, mat, x, y, z, ry) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    m.castShadow = true;
    m.receiveShadow = true;
    this.group.add(m);
    return m;
  }
  _box(w, h, d, color, x, y, z, ry, extra) {
    return this._mesh(new THREE.BoxGeometry(w, h, d), this._mat(color, extra), x, y, z, ry);
  }
  _cyl(rt, rb, h, color, x, y, z, extra) {
    return this._mesh(new THREE.CylinderGeometry(rt, rb, h, 14), this._mat(color, extra), x, y, z, 0);
  }
  _pad(x, z, r, color, y) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40),
      new THREE.MeshStandardMaterial({ color, roughness: 1, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y === undefined ? 0.11 : y, z);
    m.receiveShadow = true;
    this.group.add(m);
    return m;
  }
  _ring(x, z, r, color, y, tube) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube || 0.18, 8, 40),
      this._mat(color, { emissive: color, emissiveIntensity: 0.7, roughness: 0.5 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y === undefined ? 0.3 : y, z);
    this.group.add(m);
    return m;
  }

  // ---- start / stop -------------------------------------------------------
  start(job, site) {
    this.dispose();
    this.job = job;
    this.site = {
      pile: { x: site.pile.x, z: site.pile.z },
      truck: { x: site.truck.x, z: site.truck.z }
    };
    this.group = new THREE.Group();
    this.group.name = 'level' + job.id;
    this.scene.add(this.group);
    this.index = -1;
    this.done = 0;
    this.misses = 0;
    this.coneHits = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTime = 0;
    this.finished = false;
    this._t = 0;
    this._prevSide.clear();
    this._rushLeave = [];
    this.rushTarget = null;
    this.crossCar = null;
    this._buildGoals();
    // B2: every goal object exists from the FIRST frame. No lazy creation.
    // B6: the old floating orange cone marker is gone; guidance uses the
    // painted ground ring + chevrons in Guidance.js.
    this.marker = null;
    this._setup(0);
    return this.goals.length;
  }

  dispose() {
    if (this.carry && this.carry.parent) this.carry.parent.remove(this.carry);
    this.carry = null;
    this.carryOn = false;
    if (this.group) {
      this.scene.remove(this.group);
      this.group.traverse(o => {
        if (o.geometry) o.geometry.dispose();
      });
      this.group = null;
    }
    // Free the small code-made countdown / lane textures before the goals are cleared.
    for (const q of this.goals) {
      const ud = q.mesh && q.mesh.userData;
      if (ud && ud.count && ud.count.tex) { try { ud.count.tex.dispose(); } catch (e) {} }
    }
    if (this.world && this.world.truckGroup) this.world.truckGroup.visible = true;
    if (this.world && this.world.dirtPileGroup) this.world.dirtPileGroup.visible = true;
    if (this.hooks.truckSolid) this.hooks.truckSolid(false);
    this.hole = null;
    this.pipesOnPad = [];
    this.rack = [];
    this.rushTarget = null;
    this.crossCar = null;
    this._rushLeave = [];
    this.goals = [];
    this.marker = null;
  }

  // ---- plan ---------------------------------------------------------------
  _dir() {
    const dx = this.site.truck.x - this.site.pile.x, dz = this.site.truck.z - this.site.pile.z;
    const l = Math.hypot(dx, dz) || 1;
    return { ux: dx / l, uz: dz / l, vx: -dz / l, vz: dx / l, len: l };
  }
  _at(a, b) {
    const d = this._dir();
    return {
      x: this.site.pile.x + d.ux * a + d.vx * b,
      z: this.site.pile.z + d.uz * a + d.vz * b
    };
  }
  _buildGoals() {
    const job = this.job, d = this._dir();
    let gateN = 0, spotN = 0, fillN = 0, moveN = 0, haulN = 0, rushN = 0;
    const gateCount = job.steps.filter(s => s.kind === 'gate').reduce((a, s) => a + s.n, 0);
    const rushCount = job.steps.filter(s => s.kind === 'rush').reduce((a, s) => a + s.n, 0);
    const spotCount = job.steps.filter(s => s.kind === 'trench' || s.kind === 'debris').reduce((a, s) => a + s.n, 0);
    const gw = (job.gates && job.gates.width) || 4.8;
    const slalom = (job.gates && job.gates.slalom) || 8;

    for (const step of job.steps) {
      for (let k = 0; k < step.n; k++) {
        const g = { kind: step.kind, done: false, mesh: null };
        if (step.kind === 'gate') {
          const i = gateN++;
          const a = -14 + (d.len + 30) * (i + 0.6) / (gateCount + 0.4);
          const b = Math.sin(i * 1.35 + job.id * 0.4) * slalom;
          const p = this._at(a, b);
          g.x = p.x; g.z = p.z;
          g.nx = d.ux; g.nz = d.uz;
          g.width = gw;
          g.beam = !!(job.beam && i === job.beam - 1);
          g.mesh = this._buildGate(g, i + 1, gateCount);
        } else if (step.kind === 'trench' || step.kind === 'debris') {
          const i = spotN++;
          const side = (i % 2 === 0 ? 1 : -1);
          const p = this._at(-10 + (i % 3) * 12, side * (10 + (i % 3) * 7));
          g.x = p.x; g.z = p.z;
          g.mesh = step.kind === 'trench' ? this._buildTrench(g, i + 1, spotCount) : this._buildDebris(g, i + 1, spotCount);
        } else if (step.kind === 'fill') {
          fillN++;
          g.x = this.site.truck.x; g.z = this.site.truck.z;
          g.fillIndex = fillN;
          if (!this.hole) this.hole = this._buildHole(g.x, g.z);
          g.mesh = this.hole;
        } else if (step.kind === 'move') {
          moveN++;
          g.x = this.site.truck.x; g.z = this.site.truck.z;
          if (this.pipesOnPad.length === 0 && this.rack.length === 0) this._buildMoveProps(job);
        } else if (step.kind === 'rush') {
          const i = rushN++;
          const p = this._at(d.len + 7, (i - (rushCount - 1) / 2) * 9.5);
          g.x = p.x; g.z = p.z;
          g.lane = i + 1;
          g.waitMax = job.truckWait || 45;
          g.wait = g.waitMax;
          g.mesh = this._buildRushTruck(g, i + 1, rushCount);
        } else {
          haulN++;
          g.x = this.site.truck.x; g.z = this.site.truck.z;
        }
        this.goals.push(g);
      }
    }
  }


  // ---- RUSH: three (or five) waiting trucks, each with a countdown ring ----
  _textCanvas(text, w, h, bg, fg) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect ? g.roundRect(2, 2, w - 4, h - 4, 14) : g.fillRect(2, 2, w - 4, h - 4);
    g.fill();
    g.fillStyle = fg;
    g.font = 'bold ' + Math.round(h * 0.56) + 'px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    return { canvas: c, ctx: g, tex: t };
  }

  _buildRushTruck(g, num, total) {
    const d = this._dir();
    const grp = new THREE.Group();
    grp.position.set(g.x, 0, g.z);
    grp.rotation.y = Math.atan2(d.ux, d.uz);
    this.group.add(grp);
    const add = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true;
      grp.add(m);
      return m;
    };
    const boss = num === total;   // TIER 5: the last RUSH truck is the boss truck.
    const cabMat = this._mat(boss ? COL.amberDark : COL.blue, { roughness: 0.55 });
    const bedMat = this._mat(0x3b4554, { roughness: 0.8 });
    const tyreMat = this._mat(0x15181e, { roughness: 0.95 });
    add(new THREE.BoxGeometry(2.4, 2.0, 2.2), cabMat, 0, 1.55, 2.5);
    add(new THREE.BoxGeometry(2.5, 0.9, 0.25), this._mat(0x9ad0ff, { emissive: 0x2b6ea8, emissiveIntensity: 0.55 }), 0, 1.9, 3.62);
    add(new THREE.BoxGeometry(2.7, 1.2, 5.0), bedMat, 0, 1.35, -0.6);
    add(new THREE.BoxGeometry(2.72, 0.16, 5.0), this._mat(COL.amberDark), 0, 1.98, -0.6);
    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.34, 14);
    for (const sx of [-1, 1]) for (const sz of [-2.3, 0.6, 2.4]) {
      const w = add(wheelGeo, tyreMat, sx * 1.28, 0.55, sz);
      w.rotation.z = Math.PI / 2;
    }
    if (boss) {
      // Gold light bar + slightly larger body: the boss truck reads at a glance.
      add(new THREE.BoxGeometry(2.5, 0.34, 0.5), this._mat(COL.amber, { emissive: COL.amberDark, emissiveIntensity: 0.6 }), 0, 2.75, 2.5);
      grp.scale.setScalar(1.22);
      g.boss = true;
    }
    // Painted lane number on the ground (one code-made texture, no thin geometry).
    const lane = this._textCanvas('LANE ' + num, 256, 96, '#101a2b', '#fbbf24');
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.6),
      new THREE.MeshBasicMaterial({ map: lane.tex, transparent: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, 0.1, 4.6);
    grp.add(pad);

    // 12-segment ring: one InstancedMesh, per-instance colours, one draw call.
    const N = 12;
    const ring = new THREE.InstancedMesh(new THREE.BoxGeometry(0.44, 0.18, 0.95),
      new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      dummy.position.set(Math.sin(a) * 2.5, 3.35, Math.cos(a) * 2.5);
      dummy.rotation.set(0, a, 0);
      dummy.updateMatrix();
      ring.setMatrixAt(i, dummy.matrix);
      ring.setColorAt(i, new THREE.Color(0x34d399));
    }
    ring.instanceMatrix.needsUpdate = true;
    grp.add(ring);

    // Floating countdown number above the truck.
    const count = this._textCanvas(String(Math.ceil(g.waitMax)), 128, 128, '#101a2b', '#fbbf24');
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: count.tex, transparent: true, depthWrite: false }));
    sprite.scale.set(2.0, 2.0, 1);
    sprite.position.set(0, 4.9, 0);
    grp.add(sprite);

    grp.userData = { ring: ring, count: count, sprite: sprite, segs: N, active: false, leave: 0 };
    return grp;
  }

  _buildCrossTraffic() {
    const d = this._dir();
    const grp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.1, 2.0), this._mat(0xb45309, { emissive: 0x351500, emissiveIntensity: 0.4 }));
    body.position.y = 0.85; body.castShadow = true;
    grp.add(body);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), this._mat(0xffe9b0, { emissive: 0xffcc66, emissiveIntensity: 1.4 }));
    lamp.position.set(2.2, 1.1, 0); grp.add(lamp);
    grp.rotation.y = Math.atan2(d.vx, d.vz);
    this.group.add(grp);
    this.crossCar = grp;
    // Red danger strip: painted into a canvas texture, no flickering thin strips.
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#ef4444'; g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#fee2e2';
    for (let i = -64; i < 256; i += 40) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 20, 0); g.lineTo(i + 38, 0); g.lineTo(i + 18, 64); g.fill(); }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 1);
    t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8;
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(44, 2.4),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.85, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }));
    strip.rotation.x = -Math.PI / 2;
    const p = this._at(d.len + 1, 0);
    strip.position.set(p.x, 0.11, p.z);
    strip.rotation.z = Math.atan2(d.vx, d.vz);
    this.group.add(strip);
  }

  _updateRushRing(g) {
    const ud = g.mesh && g.mesh.userData;
    if (!ud || !ud.ring) return;
    const f = Math.max(0, Math.min(1, g.wait / g.waitMax));
    const on = Math.ceil(ud.segs * f);
    const col = f > 0.55 ? 0x34d399 : (f > 0.25 ? 0xfbbf24 : 0xef4444);
    const a = new THREE.Color(col), b = new THREE.Color(0x1b2535);
    for (let i = 0; i < ud.segs; i++) ud.ring.setColorAt(i, i < on ? a : b);
    if (ud.ring.instanceColor) ud.ring.instanceColor.needsUpdate = true;
    const txt = String(Math.ceil(Math.max(0, g.wait)));
    if (txt !== ud.lastTxt) {
      ud.lastTxt = txt;
      const c = ud.count;
      c.ctx.clearRect(0, 0, c.canvas.width, c.canvas.height);
      c.ctx.fillStyle = f > 0.25 ? '#101a2b' : '#3b0d0d';
      c.ctx.fillRect(2, 2, c.canvas.width - 4, c.canvas.height - 4);
      c.ctx.fillStyle = f > 0.25 ? '#fbbf24' : '#fca5a5';
      c.ctx.font = 'bold 78px system-ui, sans-serif';
      c.ctx.textAlign = 'center'; c.ctx.textBaseline = 'middle';
      c.ctx.fillText(txt, c.canvas.width / 2, c.canvas.height / 2 + 3);
      c.tex.needsUpdate = true;
    }
  }

  _rushExpire(g) {
    // B1: an EXPIRED truck is a miss, not free progress. The job only
    // completes when the player has actually served every truck.
    this.misses++;
    this.combo = 0; this.comboTime = 0;
    if (this.hooks.onToast) this.hooks.onToast('Truck ' + g.lane + ' left the queue!', 'warn');
    g.done = true;
    g.mesh.userData.active = false;
    g.mesh.userData.leave = 2.0;
    if (!this._rushLeave.includes(g.mesh)) this._rushLeave.push(g.mesh);
    // B1 fix: a miss NEVER advances the goal chain and NEVER finishes the job.
    // Highlight the next truck that is still waiting; if none are left the job
    // simply times out (the player failed), it does not complete itself.
    const next = this.goals.findIndex(q => !q.done);
    this._setup(next >= 0 ? next : this.index);
  }

  _buildGate(g, num, total) {
    const grp = new THREE.Group();
    grp.position.set(g.x, 0, g.z);
    grp.rotation.y = Math.atan2(g.nx, g.nz);
    this.group.add(grp);
    const half = g.width;
    const stripe = this._mesh(new THREE.BoxGeometry(half * 2, 0.34, 0.5),
      this._mat(COL.amber, { emissive: COL.amberDark, emissiveIntensity: 0.35 }), 0, 0.18, 0);
    // _mesh adds to this.group, so reparent it into the gate group
    this.group.remove(stripe); grp.add(stripe);
    const cones = [];
    // ONE rigid compound: square base + cone in a single geometry. It tips
    // over as one object, so the cone can never float away from its base.
    const bGeo = new THREE.BoxGeometry(0.78, 0.14, 0.78);
    bGeo.translate(0, 0.07, 0);
    const cGeo = new THREE.ConeGeometry(0.38, 1.25, 12);
    cGeo.translate(0, 0.14 + 1.25 / 2, 0);
    const compound = mergeGeometries([bGeo, cGeo], true);
    const cMats = [this._mat(COL.dark), this._mat(COL.cone)];
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(compound, cMats);
      post.position.set(side * half, 0.02, 0);
      post.castShadow = true;
      post.userData.tumble = null;
      grp.add(post);
      cones.push(post);
    }
    let arch = null;
    if (g.beam) {
      arch = new THREE.Mesh(new THREE.BoxGeometry(half * 2, 0.45, 0.5),
        this._mat(COL.white, { emissive: 0xffefb0, emissiveIntensity: 0.5 }));
      arch.position.set(0, 4.1, 0);
      grp.add(arch);
      for (const s of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.1, 0.4), this._mat(COL.steel));
        leg.position.set(s * half, 2.05, 0);
        grp.add(leg);
      }
    }
    const halo = new THREE.Mesh(new THREE.TorusGeometry(half * 0.55, 0.14, 8, 32),
      this._mat(COL.amber, { emissive: COL.amber, emissiveIntensity: 0.9 }));
    halo.position.set(0, 2.4, 0);
    halo.rotation.x = Math.PI / 2;
    grp.add(halo);
    grp.userData = { stripe, cones, halo, arch, num, total };
    return grp;
  }

  _buildTrench(g, num, total) {
    const grp = new THREE.Group();
    grp.position.set(g.x, 0, g.z);
    const d = this._dir();
    grp.rotation.y = Math.atan2(d.ux, d.uz);
    this.group.add(grp);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(5, 0.34, 10), this._mat(COL.dark));
    floor.position.y = 0.12;
    grp.add(floor);
    for (const s of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 10), this._mat(COL.amber, { emissive: COL.amberDark, emissiveIntensity: 0.25 }));
      edge.position.set(s * 2.6, 0.25, 0);
      grp.add(edge);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 0.45), this._mat(COL.steel));
      cap.position.set(0, 0.25, s * 5);
      grp.add(cap);
    }
    const lid = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.32, 9.4), this._mat(COL.soil));
    lid.position.y = 0.34;
    grp.add(lid);
    grp.userData = { lid, floor, num, total };
    return grp;
  }

  _buildDebris(g, num, total) {
    const grp = new THREE.Group();
    grp.position.set(g.x, 0, g.z);
    this.group.add(grp);
    const colors = [0x7a6a55, 0x6b7280, 0x8a5a2b, 0x5b6677];
    for (let i = 0; i < 7; i++) {
      const a = i * 2.399, r = 1 + (i % 3) * 1.1;
      const s = 0.9 + (i % 4) * 0.28;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), this._mat(colors[i % colors.length]));
      m.position.set(Math.cos(a) * r, 0.5 + (i % 2) * 0.45, Math.sin(a) * r);
      m.rotation.set(0.4 * i, 0.7 * i, 0);
      m.castShadow = true;
      grp.add(m);
    }
    this._pad(g.x, g.z, 5.5, 0x4a4036, 0.1);
    grp.userData = { num, total };
    return grp;
  }

  _buildHole(x, z) {
    const grp = new THREE.Group();
    grp.position.set(x, 0, z);
    this.group.add(grp);
    const dark = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.3, 0.36, 32), this._mat(0x1c120b));
    dark.position.y = 0.1;
    grp.add(dark);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.3, 8, 40),
      this._mat(COL.amber, { emissive: COL.amberDark, emissiveIntensity: 0.5 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.32;
    grp.add(ring);
    const mound = new THREE.Mesh(new THREE.ConeGeometry(3.4, 0.6, 24), this._mat(COL.soil));
    mound.position.y = 0.3;
    mound.scale.setScalar(0.02);
    grp.add(mound);
    grp.userData = { mound, ring };
    return grp;
  }

  _buildMoveProps(job) {
    const crate = job.id === 13;
    const px = this.site.pile.x, pz = this.site.pile.z;
    const tx = this.site.truck.x, tz = this.site.truck.z;
    this._pad(px, pz, 8, 0x4b5563, 0.1);
    this._pad(tx, tz, 8, COL.pad, 0.11);
    this._ring(tx, tz, 6, COL.amber, 0.3, 0.22);
    for (let i = 0; i < 5; i++) {
      const a = -0.7 + i * 0.35;
      let m;
      if (crate) {
        m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 1.8), this._mat(0xb7791f));
        m.position.set(px + Math.cos(a) * 4, 0.85, pz + Math.sin(a) * 4);
      } else {
        m = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 6, 14), this._mat(COL.steel, { metalness: 0.5 }));
        m.rotation.z = Math.PI / 2;
        m.position.set(px + Math.cos(a) * 3, 0.6 + (i % 2) * 0.5, pz + Math.sin(a) * 3);
      }
      m.castShadow = true;
      this.group.add(m);
      this.rack.push(m);
    }
    const sign = this._box(4.2, 1.2, 0.4, COL.amber, tx, 3.2, tz - 6, 0,
      { emissive: COL.amberDark, emissiveIntensity: 0.35 });
    sign.castShadow = false;
  }

  // ---- active goal --------------------------------------------------------
  _setup(i) {
    this.index = i;
    const g = this.goals[i];
    if (!g) { this.finished = true; return; }
    // B2: the pile and the truck are visible for EVERY kind of goal from frame
    // one. Hiding them was the reason objects "appeared after pressing F".
    const showTruck = true;
    // RUSH levels use their own waiting trucks; the blue truck is hidden but moved
    // to the active lane so main.js's dump proximity check still works.
    const showPile = true;
    this.rushTarget = (g.kind === 'rush') ? { x: g.x, z: g.z } : null;
    const pile = (g.kind === 'trench' || g.kind === 'debris') ? { x: g.x, z: g.z } : this.site.pile;
    // B3: restore the FULL pile after every goal, so load 3 always has dirt.
    if (this.world && this.world.resetDirtPile) this.world.resetDirtPile();
    this._place('dirtPileGroup', pile.x, pile.z, showPile);
    if (this.world && this.world.jobSiteBase) this.world.jobSiteBase.visible = true;
    const tz = this.rushTarget || this.site.truck;
    this._place('truckGroup', tz.x, tz.z, showTruck);
    if (this.hooks.truckSolid) this.hooks.truckSolid(showTruck, tz.x, tz.z);
    if (g.kind === 'rush') {
      for (const q of this.goals) {
        if (q.kind !== 'rush' || !q.mesh) continue;
        q.mesh.userData.active = (q === g && !q.done);
        if (q.mesh.userData.active) { q.wait = q.waitMax; this._updateRushRing(q); }
      }
    }
    if (this.hole) this.hole.visible = (g.kind === 'fill');
    if (this.group) {
      for (const q of this.goals) {
        if (q.mesh && q.mesh.userData) {
          const ud = q.mesh.userData;
          if (ud.stripe) {
            const on = (q === g && !q.done);
            ud.stripe.material = this._mat(on ? COL.amber : 0x46536a,
              on ? { emissive: COL.amberDark, emissiveIntensity: 0.5 } : {});
            ud.halo.visible = on;
          }
        }
      }
    }
    this._setTarget(g, pile);
    if (this.hooks.onChange) this.hooks.onChange();
  }

  _place(name, x, z, visible) {
    const o = this.world && this.world[name];
    if (!o) return;
    o.position.x = x;
    o.position.z = z;
    o.visible = visible;
    o.updateMatrixWorld && o.updateMatrixWorld(true);
  }

  _setTarget(g, pile) {
    if (g.kind === 'gate') {
      // On gate levels BOTH minimap dots point at the active gate, whichever
      // branch of the guidance code runs. No truck or pile to distract the player.
      this.siteNow.pile.x = g.x; this.siteNow.pile.z = g.z;
      this.siteNow.truck.x = g.x; this.siteNow.truck.z = g.z;
    } else if (g.kind === 'rush') {
      this.siteNow.pile.x = pile.x; this.siteNow.pile.z = pile.z;
      this.siteNow.truck.x = g.x; this.siteNow.truck.z = g.z;
    } else {
      this.siteNow.pile.x = pile.x; this.siteNow.pile.z = pile.z;
      this.siteNow.truck.x = this.site.truck.x; this.siteNow.truck.z = this.site.truck.z;
    }
  }

  _advance() {
    const g = this.goals[this.index];
    if (g) {
      g.done = true;
      if (g.mesh) {
        if (g.mesh.userData && g.mesh.userData.stripe) {
          g.mesh.userData.stripe.material = this._mat(COL.green, { emissive: 0x065f46, emissiveIntensity: 0.6 });
          g.mesh.userData.halo.visible = false;
          g.mesh.userData.cones.forEach((c, i) => {
            if (!c.userData.tumble) c.userData.tumble = { t: 0, dir: i ? 1 : -1, done: false };
          });
        } else if (g.mesh.userData && g.mesh.userData.lid) {
          g.mesh.userData.lid.visible = false;
          g.mesh.userData.floor.material = this._mat(COL.green);
        } else if (g.kind === 'debris') {
          g.mesh.visible = false;
        }
      }
    }
    this.done++;
    if (g && g.kind === 'rush' && g.mesh && !g.mesh.userData.leave) {
      g.mesh.userData.leave = 2.0;
      g.mesh.userData.active = false;
      this._rushLeave.push(g.mesh);
    }
    if (this.job.rush) {
      this.combo = Math.min(3, this.combo + 1);
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.comboTime = 22;
      if (this.hooks.onCombo) this.hooks.onCombo(this.combo);
    }
    if (this.done >= this.goals.length) this.finished = true;
    this._setup(this.index + 1);
  }

  // ---- public text for the HUD -------------------------------------------
  active() { return this.goals[this.index] || null; }
  activeKind() { const g = this.active(); return g ? g.kind : 'haul'; }
  objective(hasDirt) {
    const g = this.active();
    if (!g) return 'Job complete';
    const j = this.job;
    switch (g.kind) {
      case 'gate': return g.beam ? 'Lower bucket - drive under beam' : 'Drive through the amber gate';
      case 'rush': return hasDirt ? ('Dump in truck ' + g.lane) : ('Scoop for truck ' + g.lane);
      case 'trench': return hasDirt ? 'Dump the spoil in the ring' : 'Dig the marked trench';
      case 'debris': return hasDirt ? 'Dump debris in the ring' : 'Scoop the marked debris';
      case 'fill': return hasDirt ? j.dumpText : j.scoopText;
      case 'move': return hasDirt ? j.dumpText : j.scoopText;
      default: return hasDirt ? j.dumpText : j.scoopText;
    }
  }
  stepText() {
    const g = this.active();
    if (!g) return 'Complete ' + this.done + '/' + this.goals.length;
    const labels = { haul: 'Haul loads', fill: 'Hole fills', move: 'Pipes placed', gate: 'Gates', trench: 'Trenches', debris: 'Piles cleared', rush: 'Trucks loaded' };
    return labels[g.kind] + ' ' + this.done + '/' + this.goals.length;
  }
  hint(dirty) {
    // A9: three SHORT lines per level, shown one at a time. No repeats.
    const lines = COACH[this.job && this.job.id] || COACH[1];
    const phase = dirty ? 2 : (this.done > 0 ? 1 : 0);
    return lines[Math.min(2, phase)];
  }
  wantsDump() { const k = this.activeKind(); return k === 'haul' || k === 'fill' || k === 'move' || k === 'rush' || k === 'trench' || k === 'debris'; }
  isFinished() { return this.finished; }

  // ---- called by main.js --------------------------------------------------
  onMiss() { this.misses++; if (this.job.rush) { this.combo = 0; this.comboTime = 0; } }

  onScoop(bucketPos, vehicle) {
    const g = this.active();
    if (!g) return { ok: true, count: false, msg: '' };
    if (g.kind === 'trench' || g.kind === 'debris') {
      // B1: a scoop NEVER completes a goal by itself. The player must still
      // drive to the marked spot and dump (the dump grants the progress).
      const near = Math.hypot(bucketPos.x - g.x, bucketPos.z - g.z) < 13;
      if (!near) return { ok: false, count: false, msg: 'Wrong spot - drive to the glowing marker' };
      g.dugAt = { x: g.x, z: g.z };
      return { ok: true, count: false, msg: g.kind === 'trench' ? 'Trench spoil loaded - go dump it' : 'Debris loaded - go dump it' };
    }
    if (g.kind === 'move') {
      this._attachCarry(vehicle);
      if (this.rack.length) {
        const m = this.rack.pop();
        m.visible = false;
      }
      return { ok: true, count: false, msg: 'Pipe secured in the bucket' };
    }
    return { ok: true, count: false, msg: '' };
  }

  onDump(bucketPos, vehicle) {
    const g = this.active();
    if (!g) return { ok: true, count: false, msg: '' };
    if (g.kind === 'move') this._detachCarry();
    // B1: trench / debris / gate goals are only granted when the player DUMPS.
    // Gate goals are still granted by driving through them (see update()).
    const target = this.rushTarget || this.site.truck;
    const near = Math.hypot(bucketPos.x - target.x, bucketPos.z - target.z) < 12;
    if (g.kind === 'trench' || g.kind === 'debris') {
      if (!g.dugAt) return { ok: false, count: false, msg: 'Dig the marked spot first' };
      if (!near) { this.onMiss(); return { ok: false, count: false, msg: 'Dump inside the marked ring' }; }
      g.dugAt = null;
      // TIER 5: every verb has its OWN visible result.
      if (g.kind === 'trench') this._digTrench(g);
      else this._clearDebris(g);
      this._advance();
      return { ok: true, count: true, msg: g.kind === 'trench' ? 'Trench dug!' : 'Pile cleared!' };
    }
    if (!this.wantsDump()) return { ok: true, count: false, msg: '' };
    if (!near) { this.onMiss(); return { ok: false, count: false, msg: 'Missed the target - scoop again' }; }
    if (g.kind === 'fill' && this.hole) {
      const mound = this.hole.userData.mound;
      const k = Math.min(1, g.fillIndex / 3);
      mound.scale.setScalar(0.35 + 0.65 * k);
      mound.position.y = 0.3 + 0.5 * k;
      this._spoilAt(target.x + 4, target.z + 2, 0.8);   // TIER 5: FILL mound grows
    }
    if (g.kind === 'move') {
      const crate = this.job.id === 13;
      const m = new THREE.Mesh(crate ? new THREE.BoxGeometry(1.8, 1.5, 1.8) : new THREE.CylinderGeometry(0.42, 0.42, 6, 14),
        this._mat(crate ? 0xb7791f : COL.steel, { metalness: 0.4 }));
      if (!crate) m.rotation.z = Math.PI / 2;
      m.position.set(this.site.truck.x + (this.pipesOnPad.length % 2 ? 2 : -2), 0.8 + Math.floor(this.pipesOnPad.length / 2) * 1.6, this.site.truck.z);
      m.castShadow = true;
      this.group.add(m);
      this.pipesOnPad.push(m);
    }
    const msg = (g.kind === 'rush') ? ('Truck ' + g.lane + ' loaded!') : '';
    this._advance();
    return { ok: true, count: true, msg: msg };
  }

  // TIER 5 verbs: TRENCH gets deeper + a spoil heap; CLEAR pushes debris into a bin.
  _spoilAt(x, z, r) {
    if (!this.group) return;
    const m = new THREE.Mesh(new THREE.ConeGeometry(r * 1.6, r * 1.1, 9),
      this._mat(COL.soil, { roughness: 1 }));
    m.position.set(x, r * 0.55, z);
    m.castShadow = true;
    this.group.add(m);
  }
  _digTrench(g) {
    const ud = g.mesh && g.mesh.userData;
    if (ud && ud.lid) { ud.lid.position.y = -0.55; ud.lid.scale.setScalar(0.94); }
    if (ud && ud.floor) ud.floor.position.y = -0.28;
    this._spoilAt(g.x + 3.4, g.z + 1.2, 0.9);
  }
  _clearDebris(g) {
    if (g.mesh) {
      g.mesh.children.forEach(c => {
        if (c.isMesh && c.geometry && c.geometry.type === 'DodecahedronGeometry') {
          c.position.y -= 0.55; c.scale.setScalar(0.35);
        }
      });
    }
    const t = this.rushTarget || this.site.truck;
    // A small steel bin beside the truck: debris is pushed INTO it.
    const bin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 2.4),
      this._mat(COL.steel, { metalness: 0.35 }));
    bin.position.set(t.x + 6, 0.8, t.z + 3);
    bin.castShadow = true;
    if (this.group) this.group.add(bin);
    this._spoilAt(t.x + 6, t.z + 3, 0.7);
  }

  _attachCarry(vehicle) {
    this._detachCarry();
    if (!vehicle || !vehicle.bucketPivot) return;
    const crate = this.job.id === 13;
    const m = new THREE.Mesh(crate ? new THREE.BoxGeometry(1.7, 1.4, 1.7) : new THREE.CylinderGeometry(0.4, 0.4, 5.5, 12),
      this._mat(crate ? 0xb7791f : COL.steel, { metalness: 0.45 }));
    if (!crate) m.rotation.z = Math.PI / 2;
    m.position.set(0, 0.9, 0.8);
    m.castShadow = true;
    vehicle.bucketPivot.add(m);
    this.carry = m;
    this.carryOn = true;
  }
  _detachCarry() {
    if (this.carry && this.carry.parent) this.carry.parent.remove(this.carry);
    this.carry = null;
    this.carryOn = false;
  }

  update(dt, vehicle) {
    if (!this.job || !this.group) return;
    this._t += dt;
    // A4: a knocked cone wobbles to rest in <=1.5 s and then stays perfectly still.
    if (this.group) this.group.traverse(o => {
      const t = o.userData && o.userData.tumble;
      if (!t || t.done) return;
      t.t += dt;
      const k = Math.min(1, t.t / 1.5);
      const damp = Math.exp(-k * 5);
      o.rotation.z = t.dir * (1.42 * (1 - damp) + Math.sin(t.t * 13) * 0.16 * damp);
      o.position.y = 0.02 + Math.abs(Math.sin(t.t * 9)) * 0.12 * damp;
      if (k >= 1) { o.rotation.z = t.dir * 1.42; o.position.y = 0.02; t.done = true; }
    });
    if (this.comboTime > 0) {
      this.comboTime -= dt;
      if (this.comboTime <= 0) this.combo = 0;
    }
    // Served / expired trucks drive away instead of vanishing.
    if (this._rushLeave && this._rushLeave.length) {
      for (let i = this._rushLeave.length - 1; i >= 0; i--) {
        const m = this._rushLeave[i], ud = m.userData;
        if (ud.leave > 0) {
          ud.leave -= dt;
          m.position.z -= dt * 8;
          if (ud.leave <= 0) m.visible = false;
        } else this._rushLeave.splice(i, 1);
      }
    }
    // Night crossing traffic (visual; the red strip marks the danger lane).
    if (this.job && this.job.crossTraffic) {
      if (!this.crossCar) this._buildCrossTraffic();
      if (this.crossCar) {
        const d = this._dir();
        const t = Math.sin(this._t * 0.55) * 26;
        const p = this._at(d.len + 1, t);
        this.crossCar.position.set(p.x, 0, p.z);
      }
    }
    const g = this.active();
    if (g && g.kind === 'rush' && !g.done && g.mesh) {
      g.wait -= dt;
      this._updateRushRing(g);
      if (g.wait <= 0) { this._rushExpire(g); return; }
    }
    if (!g || g.kind !== 'gate' || !vehicle || !vehicle.mesh) return;
    const p = vehicle.mesh.position;
    const side = (p.x - g.x) * g.nx + (p.z - g.z) * g.nz;
    const lateral = Math.abs((p.x - g.x) * -g.nz + (p.z - g.z) * g.nx);
    const prev = this._prevSide.get(g);
    this._prevSide.set(g, side);
    if (prev === undefined) return;
    // The player can arrive from either side of the gate, and a very close pass
    // still counts (physics interpolation can skip a thin plane on a fast frame).
    const crossed = (prev < 0 && side >= 0) || (prev > 0 && side <= 0);
    const nearCentre = Math.hypot(p.x - g.x, p.z - g.z) < 2.6;
    if (!crossed && !nearCentre) return;
    if (crossed && lateral > g.width + 1.6 && lateral < g.width + 4.5) {
      this.coneHits++;
      if (this.hooks.onDing) this.hooks.onDing();
      if (this.hooks.addTime) this.hooks.addTime(2);
      if (this.hooks.onToast) this.hooks.onToast('Cone down  +2s', 'success');
      if (g.mesh && g.mesh.userData && g.mesh.userData.cones) {
        g.mesh.userData.cones.forEach((c, i) => {
          if (!c.userData.tumble) c.userData.tumble = { t: 0, dir: i ? 1 : -1, done: false };
        });
      }
    }
    if (lateral > g.width && !nearCentre) return;
    if (g.beam && vehicle.bucketPivot) {
      const bp = new THREE.Vector3();
      vehicle.bucketPivot.getWorldPosition(bp);
      if (bp.y > 4.0) {
        if (this.hooks.onToast) this.hooks.onToast('Lower the bucket to pass under the beam (E)', 'warn');
        return;
      }
    }
    this._advance();
    if (this.hooks.onCount) this.hooks.onCount(0);
  }

  bonus() {
    const b = this.job && this.job.bonus ? this.job.bonus : { text: '', coins: 0 };
    let got = false;
    switch (this.job && this.job.type) {
      case 'CONE': got = this.coneHits === 0; break;
      case 'HAUL': case 'FILL': case 'MOVE': got = this.misses === 0; break;
      case 'TRENCH': case 'CLEAR': got = this.misses === 0; break;
      case 'RUSH': got = this.misses === 0; break;   // no missed truck
      case 'MIX': got = this.maxCombo >= 3 && this.misses === 0; break;
      default: got = false;
    }
    return { text: b.text, coins: got ? b.coins : 0, max: b.coins, got };
  }

  info() {
    return {
      id: this.job ? this.job.id : 0, type: this.job ? this.job.type : '',
      goal: this.activeKind(), done: this.done, total: this.goals.length,
      combo: this.combo, maxCombo: this.maxCombo, coneHits: this.coneHits, misses: this.misses,
      rushWait: this.active() && this.active().kind === 'rush' ? Math.ceil(Math.max(0, this.active().wait)) : null
    };
  }
}

export default LevelEngine;

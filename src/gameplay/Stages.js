// TerraForm 3D - TIER C: 15 STAGES that actually look different.
// One active stage at a time. Each stage owns its ground, props, landmark,
// skyline, sky, fog, start yaw, sound bed and 3 short coaching lines.
// All geometry / textures / colours are code-made. Nothing is loaded lazily
// when a goal appears: the whole stage exists before the first frame.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------------------
// Exact stage table. verbs: SCOOP DUMP DIG GRAB PLACE PUSH PARK DRIVE TIME TRIAL
// ---------------------------------------------------------------------------
export const STAGE_TABLE = [
  { id: 1, name: 'First Scoop', verbs: ['SCOOP', 'DUMP'], chapter: 'Rookie Yard',
    ground: 0x6fa85a, ground2: 0x4f8240, pattern: 'grass', skyline: 'suburb', landmark: 'shed',
    props: 'fence', sky: 0xcfe2f3, fog: 0.0034, sun: 1.00, hemi: 1.00, accent: 0xfbbf24,
    sound: 'birds', yaw: -0.18, soundBed: 'YARD',
    coach: ['Drive to the dirt pile', 'Hold SCOOP for 1.6 seconds', 'Hold DUMP over the blue truck'] },
  { id: 2, name: 'Cone School', verbs: ['DRIVE', 'PARK'], chapter: 'Rookie Yard',
    ground: 0x2d5a8c, ground2: 0x21436b, pattern: 'lanes', skyline: 'grandstand', landmark: 'scoreboard',
    props: 'cones', sky: 0xd8e7f5, fog: 0.0030, sun: 1.05, hemi: 1.00, accent: 0xff6a1a,
    sound: 'traffic', yaw: 0.12, soundBed: 'COURSE',
    coach: ['Six gates make an S', 'Keep the bucket low', 'Stop inside PARK for one second'] },
  { id: 3, name: 'Fill the Pothole', verbs: ['DIG', 'PLACE'], chapter: 'Rookie Yard',
    ground: 0x5b6068, ground2: 0x3f444b, pattern: 'cracks', skyline: 'roadworks', landmark: 'roadroller',
    props: 'barriers', sky: 0xcfe2f3, fog: 0.0036, sun: 1.00, hemi: 1.00, accent: 0xfbbf24,
    sound: 'traffic', yaw: 0.35, soundBed: 'ROAD',
    coach: ['Three holes need one load each', 'Watch the crossing traffic', 'Fill the amber hole, then the next'] },
  { id: 4, name: 'Material Match', verbs: ['SCOOP', 'DUMP'], chapter: 'Rookie Yard',
    ground: 0xb7a084, ground2: 0x857c6b, pattern: 'concrete', skyline: 'industrial', landmark: 'weighbridge',
    props: 'trees', sky: 0xd8e7f5, fog: 0.0042, sun: 1.05, hemi: 1.00, accent: 0x34d399,
    sound: 'birds', yaw: -0.42, soundBed: 'PARK',
    coach: ['SAND to amber, GRAVEL to blue', 'Read the material above each truck', 'Wrong truck keeps your bucket full'] },
  { id: 5, name: 'Rush Hour Lite', verbs: ['SCOOP', 'DUMP'], chapter: 'Rookie Yard',
    ground: 0x3a3f47, ground2: 0x272c33, pattern: 'asphalt', skyline: 'city', landmark: 'trafficlight',
    props: 'cars', sky: 0xe8c9a8, fog: 0.0048, sun: 0.70, hemi: 0.80, accent: 0xef4444,
    sound: 'traffic', yaw: 0.55, soundBed: 'CITY',
    coach: ['Find the glowing pile', 'Scoop before the ring fades', 'Load the waiting blue truck'] },
  { id: 6, name: 'Dig the Trench', verbs: ['DIG', 'DUMP'], chapter: 'Contractor',
    ground: 0x8b6a48, ground2: 0x63492f, pattern: 'soil', skyline: 'industrial', landmark: 'excavator',
    props: 'pipes', sky: 0xe8c9a8, fog: 0.0046, sun: 0.70, hemi: 0.80, accent: 0xfbbf24,
    sound: 'site', yaw: -0.60, soundBed: 'TRENCH',
    coach: ['Stop on the trench plate', 'Hold SCOOP to dig', 'Dump spoil, then find the next'] },
  { id: 7, name: 'Pipe Layer', verbs: ['GRAB', 'PLACE'], chapter: 'Contractor',
    ground: 0x7f8c8d, ground2: 0x64727e, pattern: 'concrete', skyline: 'industrial', landmark: 'crane',
    props: 'piperack', sky: 0xd8e7f5, fog: 0.0032, sun: 1.05, hemi: 1.00, accent: 0x22d3ee,
    sound: 'site', yaw: 0.22, soundBed: 'PIPE YARD',
    coach: ['Grab one pipe from the rack', 'Stay below 12 km/h or it drops', 'Recover dropped pipes before placing'] },
  { id: 8, name: 'Night Shift', verbs: ['SCOOP', 'DUMP'], chapter: 'Contractor',
    ground: 0x1b2530, ground2: 0x111a25, pattern: 'soil', skyline: 'night', landmark: 'floodlight',
    props: 'lamps', sky: 0x0a1020, fog: 0.0070, sun: 0.16, hemi: 0.32, accent: 0xfbbf24,
    sound: 'night', yaw: -0.30, soundBed: 'NIGHT', night: true,
    coach: ['Use your work lights', 'Follow the map arrow', 'Drive slowly in the dark'] },
  { id: 9, name: 'Bridge Repair', verbs: ['SCOOP', 'FILL'], chapter: 'Contractor',
    ground: 0x3878a8, ground2: 0x24567a, pattern: 'water', skyline: 'bridge', landmark: 'bridge',
    props: 'barriers', sky: 0xf0d9bd, fog: 0.0040, sun: 0.85, hemi: 0.90, accent: 0x22d3ee,
    sound: 'wind', yaw: 0.48, soundBed: 'BRIDGE',
    coach: ['Five holes along the narrow bridge', 'Stay inside the steel rails', 'Falling resets you and costs ten seconds'] },
  { id: 10, name: 'Night Rush', verbs: ['SCOOP', 'DUMP'], chapter: 'Contractor',
    ground: 0x232a33, ground2: 0x151c24, pattern: 'asphalt', skyline: 'neon', landmark: 'neonarch',
    props: 'cars', sky: 0x090d1c, fog: 0.0068, sun: 0.16, hemi: 0.32, accent: 0xef4444,
    sound: 'night', yaw: -0.52, soundBed: 'NIGHT CITY', night: true,
    coach: ['Watch the crossing car', 'Scoop at the night pile', 'Load the glowing night truck'] },
  { id: 11, name: 'Storm Clean-up', verbs: ['GRAB', 'DUMP'], chapter: 'Site Boss',
    ground: 0x5a5f55, ground2: 0x3e433c, pattern: 'soil', skyline: 'storm', landmark: 'fallentree',
    props: 'debris', sky: 0x8e9aa6, fog: 0.0085, sun: 0.45, hemi: 0.70, accent: 0xfbbf24,
    sound: 'rain', yaw: 0.68, soundBed: 'STORM',
    coach: ['Find the glowing debris', 'Scoop it cleanly', 'Dump, then find the next pile'] },
  { id: 12, name: 'Foundation Dig', verbs: ['DIG', 'PLACE'], chapter: 'Site Boss',
    ground: 0x6f5a3c, ground2: 0x4d3d28, pattern: 'grid', skyline: 'foundation', landmark: 'rebar',
    props: 'rebar', sky: 0xf0d9bd, fog: 0.0040, sun: 0.85, hemi: 0.90, accent: 0xfbbf24,
    sound: 'site', yaw: -0.72, soundBed: 'FOUNDATION',
    coach: ['Dig boxes in arrow order', 'Six boxes, one by one', 'Dump, then move to the next'] },
  { id: 13, name: 'Crane Support', verbs: ['GRAB', 'PLACE'], chapter: 'Site Boss',
    ground: 0xa0a8b0, ground2: 0x727a82, pattern: 'concrete', skyline: 'industrial', landmark: 'towercrane',
    props: 'crates', sky: 0xd8e7f5, fog: 0.0032, sun: 1.05, hemi: 1.00, accent: 0x22d3ee,
    sound: 'site', yaw: 0.30, soundBed: 'CRANE',
    coach: ['Pick up the crate stack', 'Grip it with the bucket', 'Place it on the amber pad'] },
  { id: 14, name: 'Skill Course', verbs: ['PARK', 'DRIVE'], chapter: 'Site Boss',
    ground: 0x1c2333, ground2: 0x111726, pattern: 'hazard', skyline: 'grandstand', landmark: 'lowbeam',
    props: 'tires', sky: 0xd8e7f5, fog: 0.0030, sun: 1.05, hemi: 1.00, accent: 0xfbbf24,
    sound: 'traffic', yaw: -0.38, soundBed: 'SKILL',
    coach: ['Lower the bucket with E', 'Pass under the low beam', 'Only the amber gate counts'] },
  { id: 15, name: 'Mega Project', verbs: ['TIME TRIAL', 'PLACE'], chapter: 'Site Boss',
    ground: 0xc2a878, ground2: 0x8c7850, pattern: 'grid', skyline: 'stadium', landmark: 'stadium',
    props: 'mix', sky: 0xffd9a0, fog: 0.0038, sun: 0.95, hemi: 0.90, accent: 0xfbbf24,
    sound: 'site', yaw: 0.80, soundBed: 'MEGA SITE',
    coach: ['Three phases, watch the card', 'Haul, checkpoints, then deck fills', 'Finish all goals before time'] }
];

export const STAGE_BY_ID = Object.fromEntries(STAGE_TABLE.map(s => [s.id, s]));
export function stageCoach(id) { return (STAGE_BY_ID[id] || STAGE_TABLE[0]).coach; }
export function stageVerbs(id) { return (STAGE_BY_ID[id] || STAGE_TABLE[0]).verbs; }

// ---------------------------------------------------------------------------
// Code-made ground textures. One canvas per stage, disposed on leave.
// ---------------------------------------------------------------------------
function groundTexture(s) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const a = '#' + s.ground.toString(16).padStart(6, '0');
  const b = '#' + s.ground2.toString(16).padStart(6, '0');
  g.fillStyle = a; g.fillRect(0, 0, 256, 256);
  let seed = s.id * 7919;
  const R = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  if (s.pattern === 'asphalt' || s.pattern === 'concrete') {
    for (let i = 0; i < 900; i++) {
      g.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.055)';
      g.fillRect(R() * 256, R() * 256, 2 + R() * 4, 2 + R() * 4);
    }
    if (s.pattern === 'concrete') {
      g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = 2;
      for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    }
  } else if (s.pattern === 'grid') {
    g.strokeStyle = 'rgba(70,55,30,.35)'; g.lineWidth = 3;
    for (let i = 0; i <= 256; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
  } else if (s.pattern === 'hazard') {
    for (let i = -256; i < 512; i += 56) {
      g.save(); g.translate(i, 0); g.rotate(0.42);
      g.fillStyle = '#' + s.accent.toString(16).padStart(6, '0'); g.fillRect(0, -256, 28, 800);
      g.restore();
    }
  } else if (s.pattern === 'lanes') {
    g.fillStyle = 'rgba(255,255,255,.7)';
    for (let x = 16; x < 256; x += 64) for (let y = 0; y < 256; y += 48) g.fillRect(x, y, 5, 26);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3;
    for (let x = 0; x <= 256; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  } else if (s.pattern === 'water') {
    g.strokeStyle = 'rgba(220,245,255,.35)'; g.lineWidth = 3;
    for (let y = 8; y < 256; y += 22) { g.beginPath();
      for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin((x / 256) * 12 + y) * 4);
      g.stroke(); }
  } else if (s.pattern === 'stripes') {
    g.strokeStyle = '#' + s.accent.toString(16).padStart(6, '0'); g.lineWidth = 12;
    for (let i = -256; i < 512; i += 48) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); }
  } else if (s.pattern === 'cracks') {
    g.strokeStyle = 'rgba(10,10,12,.5)'; g.lineWidth = 2;
    for (let i = 0; i < 12; i++) { g.beginPath(); let x = R() * 256, y = R() * 256; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - .5) * 50; y += (R() - .5) * 50; g.lineTo(x, y); } g.stroke(); }
  } else {
    // grass / leaves / soil: dappled blobs
    for (let i = 0; i < 1100; i++) {
      g.fillStyle = R() > 0.5 ? 'rgba(0,0,0,.07)' : (s.pattern === 'leaves' ? 'rgba(200,90,20,.22)' : 'rgba(255,255,255,.05)');
      g.beginPath(); g.arc(R() * 256, R() * 256, 1 + R() * 5, 0, 6.284); g.fill();
    }
    g.fillStyle = b;
    for (let i = 0; i < 60; i++) { g.globalAlpha = .12; g.fillRect(R() * 256, R() * 256, 14 + R() * 30, 8 + R() * 18); }
    g.globalAlpha = 1;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(28, 28);
  t.anisotropy = 8;
  return t;
}

function signTexture(s) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#101823'; g.fillRect(0, 0, 512, 160);
  g.fillStyle = '#' + s.accent.toString(16).padStart(6, '0');
  g.fillRect(0, 0, 512, 12); g.fillRect(0, 148, 512, 12);
  g.fillStyle = '#f1f5f9'; g.font = 'bold 30px Arial'; g.textAlign = 'center';
  g.fillText('LEVEL ' + s.id + ' · ' + s.name.toUpperCase(), 256, 76);
  g.fillStyle = '#' + s.accent.toString(16).padStart(6, '0');
  g.font = 'bold 22px Arial'; g.fillText(s.verbs.join('  /  '), 256, 118);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class StageManager {
  constructor(scene, worldBuilder) {
    this.scene = scene;
    this.world = worldBuilder;
    this.group = null;
    this.current = null;
    this._owned = [];
    this._cityHidden = false;
    this._base = new THREE.Vector3(0, 0, -120);   // the shared job-site centre
    // Everything the shared city added to the scene before a stage exists.
    // Gameplay objects created later (vehicle, guidance, job dressing, gates)
    // are deliberately NOT in this list, so they stay visible.
    this._cityRoots = scene.children.slice();
    this._cityPrev = new Map();
  }
  _own(x) { this._owned.push(x); return x; }
  _mat(color, opts = {}) {
    return this._own(new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.9, metalness: 0.02 }, opts)));
  }
  _mesh(geo, mat, x, y, z) {
    const m = new THREE.Mesh(this._own(geo), mat);
    m.position.set(x, y, z);
    m.castShadow = false; m.receiveShadow = false;
    this.group.add(m);
    return m;
  }

  // Hide the shared city so a stage cannot look like "one yard" again.
  _hideCity() {
    if (this._cityHidden) return;
    this._cityHidden = true;
    this.world.setCityPhysicsEnabled(false);
    const keep = new Set([
      this.world.jobSiteBase, this.world.dirtPileGroup, this.world.truckGroup
    ]);
    for (const root of this._cityRoots) {
      if (!root || root.isLight || keep.has(root)) continue;
      this._cityPrev.set(root, root.visible);
      root.visible = false;                 // city ground, buildings, skyline, props, sky dome
    }
    // Night cones belong to the old city street lamps: they become ugly
    // full-screen pyramids when the camera drives through them.
    try { if (this.world.nightLampCones) this.world.nightLampCones.visible = false; } catch (e) {}
  }
  _showCity() {
    if (!this._cityHidden) return;
    this._cityHidden = false;
    this.world.setCityPhysicsEnabled(true);
    for (const [root, wasVisible] of this._cityPrev) {
      try { root.visible = wasVisible; } catch (e) {}
    }
    this._cityPrev.clear();
    if (this.world.nightLampCones) this.world.nightLampCones.visible = false;
  }

  dispose() {
    if (this.group) { this.scene.remove(this.group); this.group = null; }
    for (const o of this._owned) { try { o.dispose && o.dispose(); } catch (e) {} }
    this._owned.length = 0;
  }
  leave() { this.dispose(); this._showCity(); this.current = null; }

  enter(id, center) {
    const s = STAGE_BY_ID[id] || STAGE_TABLE[0];
    if (center && Number.isFinite(center.x) && Number.isFinite(center.z))
      this._base.set(center.x, 0, center.z);
    if (this.current === id && this.group) { this.group.position.copy(this._base); return s; }
    this.dispose();
    this._hideCity();
    this.current = id;
    const g = new THREE.Group();
    g.name = 'stage-' + id;
    g.position.copy(this._base);
    this.group = g;
    this.scene.add(g);

    // ---- 1. own ground (covers the shared city ground) -----------------
    const tex = this._own(groundTexture(s));
    const ground = new THREE.Mesh(this._own(new THREE.PlaneGeometry(520, 520)),
      this._own(new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 1,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    ground.rotation.x = -Math.PI / 2; ground.position.y = id===9 ? -0.7 : 0.10;
    g.add(ground);
    if(id<=5) {
      // Large coherent surfaces, not a road texture tiled over an entire world.
      if(id===2||id===3||id===5)ground.material.map=null;
      if(id===2)ground.material.color.setHex(0x456443);
      if(id===3)ground.material.color.setHex(0x6b7858);
      if(id===5)ground.material.color.setHex(0x26333f);
      const slab=(w,d,color,x,z)=>{const m=this._mesh(new THREE.PlaneGeometry(w,d),this._mat(color,{polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),x,.12,z);m.rotation.x=-Math.PI/2;return m;};
      if(id===1){slab(72,48,0x8d7453,0,0);for(let z=-36;z<=36;z+=12){this._mesh(new THREE.BoxGeometry(.5,2,.5),this._mat(0xc4a272),-50,1,z);}}
      if(id===2){slab(138,44,0x283746,12,0);slab(135,.35,0xe8edf2,12,-21);slab(135,.35,0xe8edf2,12,21);for(let x=-48;x<80;x+=12)slab(4,.35,0xe8edf2,x,0);}
      if(id===3){slab(26,160,0x414b58,8,0);for(let z=-75;z<80;z+=12)slab(.35,5,0xf6df91,8,z);slab(.35,158,0xf4f4f2,-4,0);slab(.35,158,0xf4f4f2,20,0);}
      if(id===4){slab(90,70,0x857d67,0,0);for(const z of [-30,30])this._mesh(new THREE.BoxGeometry(65,2,.5),this._mat(0x475569),8,1,z);}
      if(id===5){slab(110,70,0x384454,0,0);for(let z=-23;z<24;z+=9.5)slab(48,.35,0xfbbf24,25,z);for(let i=0;i<3;i++)this._mesh(new THREE.BoxGeometry(8,4,5),this._mat([0x9c6045,0x385a80,0x566b48][i]),52,2,-24+i*12);}
    }

    // ---- 2. skyline ring (one InstancedMesh = one draw call) ------------
    const sk = this._skyline(s);
    g.add(sk);

    // ---- 3. unique landmark --------------------------------------------
    this._landmark(s);

    // ---- 4. props --------------------------------------------------------
    this._props(s);

    // ---- 5. stage sign: guarantees two stages never look identical -----
    const st = this._own(signTexture(s));
    const signMat = this._own(new THREE.MeshBasicMaterial({ map: st, side: THREE.FrontSide }));
    const sign = this._mesh(new THREE.PlaneGeometry(2.5, 1.2), signMat, -30, 2.8, -34);
    sign.lookAt(0, 2.8, 0);
    const postMat = this._mat(0x2a3444);
    this._mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), postMat, -30, 1.1, -34);


    // ---- 6. fog + sky handled by main.js via envFor(id) -----------------
    if (this.scene.fog) { this.scene.fog.density = s.fog; this.scene.fog.color.setHex(s.sky); }
    if (this.scene.background && this.scene.background.isColor) this.scene.background.setHex(s.sky);
    return s;
  }

  _skyline(s) {
    const n = 30;
    const dark = s.sky === 0x0a1020 || s.sky === 0x090d1c;
    const palette = {
      suburb: [0xd8c3a0, 0xb98c62, 0xe3d6bb, 0x8a9a6a],
      city: [0x46566c, 0x63748c, 0x35435a, 0x7d8a9c],
      industrial: [0x8a765c, 0x6d6250, 0x9c8b70, 0x59636a],
      night: [0x182338, 0x22304a, 0x111a2b, 0x2b3b55],
      neon: [0x231a35, 0x3a2348, 0x18243b, 0x4a2c55],
      storm: [0x59636a, 0x474f55, 0x6b7378, 0x3c4348],
      forest: [0x2f6b32, 0x3f7d3c, 0x275a2b, 0x4c8b43],
      bridge: [0x88929b, 0x6d7882, 0xa0a9b1, 0x59636d],
      grandstand: [0x8b949f, 0x6a7480, 0xa5aeb8, 0x4d5864],
      stadium: [0xb9a274, 0x94835c, 0xd0bb8d, 0x7c6b4a],
      foundation: [0x9a8a6c, 0x7e7157, 0xb0a080, 0x625940],
      roadworks: [0x6b7076, 0x545b62, 0x848b91, 0x43494f]
    }[s.skyline] || [0x556272, 0x6b7b8c, 0x3f4c5c, 0x8492a2];
    const geo = this._own(new THREE.BoxGeometry(1, 1, 1));
    const mat = this._own(new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 }));
    const im = new THREE.InstancedMesh(geo, mat, n);
    const dummy = new THREE.Object3D();
    let seed = s.id * 104729;
    const R = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const tall = s.skyline === 'city' || s.skyline === 'night' || s.skyline === 'neon' || s.skyline === 'stadium';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + s.yaw * 0.2;
      const r = 145 + R() * 45;
      const h = tall ? 26 + R() * 62 : (s.skyline === 'forest' ? 12 + R() * 16 : 9 + R() * 24);
      const w = 12 + R() * 20, d = 12 + R() * 18;
      dummy.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      dummy.scale.set(w, h, d);
      dummy.rotation.y = a;
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
      im.setColorAt(i, new THREE.Color(palette[i % palette.length]));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    if (dark) mat.emissive = new THREE.Color(0x0a1020);
    im.name = 'stage-skyline';
    return im;
  }

  _landmark(s) {
    const steel = this._mat(0x35404f), amber = this._mat(s.accent, { emissive: s.accent, emissiveIntensity: 0.22 });
    const light = this._mat(0xe8e2cf), dark = this._mat(0x20262f);
    const put = (geo, mat, x, y, z, rx, ry, rz) => {
      const m = this._mesh(geo, mat, x, y, z);
      if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
      return m;
    };
    const P = new THREE.Vector3(s.id===2?105:s.id<=5?60:48, 0, s.id===2?-30:s.id<=5?-8:-38); // landmark position, unique silhouette
    const X = P.x, Z = P.z;
    switch (s.landmark) {
      case 'shed':
        put(new THREE.BoxGeometry(18, 9, 12), light, X, 4.5, Z);
        put(new THREE.BoxGeometry(19, 1.4, 13), amber, X, 9.6, Z, 0, 0, 0.18);
        put(new THREE.BoxGeometry(4, 5, 0.3), dark, X, 2.5, Z + 6.1);
        break;
      case 'scoreboard':
        put(new THREE.BoxGeometry(2, 13, 26), dark, X, 12, Z);
        put(new THREE.BoxGeometry(0.3, 9, 23), amber, X-1.2, 12, Z);
        put(new THREE.BoxGeometry(1.4, 10, 1.4), steel, X, 5, Z-10);
        put(new THREE.BoxGeometry(1.4, 10, 1.4), steel, X, 5, Z+10);
        { const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
          ctx.fillStyle='#182638';ctx.fillRect(0,0,512,256);ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.font='bold 52px sans-serif';ctx.fillText('CONE SCHOOL',256,90);ctx.fillStyle='#ffffff';ctx.font='bold 40px sans-serif';ctx.fillText('6 GATES + PARK',256,168);
          const t=this._own(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;
          const m=this._mesh(new THREE.PlaneGeometry(23,9),this._own(new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide})),X-1.4,12,Z);m.rotation.y=-Math.PI/2;
        }
        break;
      case 'roadroller':
        put(new THREE.BoxGeometry(16, 6, 8), amber, X, 4, Z);
        put(new THREE.CylinderGeometry(3.2, 3.2, 9, 16), dark, X - 9, 3.2, Z, Math.PI / 2, 0, 0);
        put(new THREE.CylinderGeometry(2.6, 2.6, 8, 16), dark, X + 8, 2.6, Z, Math.PI / 2, 0, 0);
        break;
      case 'weighbridge':
        put(new THREE.BoxGeometry(26,.8,13),steel,X,.4,Z);
        for(const z of [-8,8]) {put(new THREE.BoxGeometry(2,8,2),amber,X,4,Z+z);put(new THREE.BoxGeometry(6,4,6),light,X+20,2,Z+z);}
        put(new THREE.BoxGeometry(3,1,18),steel,X,8,Z);
        break;
      case 'gazebo':
        put(new THREE.CylinderGeometry(9, 9, 0.8, 12), light, X, 0.4, Z);
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; put(new THREE.CylinderGeometry(0.5, 0.5, 8, 8), steel, X + Math.cos(a) * 8, 4, Z + Math.sin(a) * 8); }
        put(new THREE.ConeGeometry(10, 5, 12), amber, X, 10, Z);
        break;
      case 'trafficlight':
        put(new THREE.CylinderGeometry(0.7, 0.9, 18, 10), steel, X, 9, Z);
        put(new THREE.BoxGeometry(2.4, 7, 2.4), dark, X, 18, Z);
        put(new THREE.SphereGeometry(0.8, 10, 8), this._mat(0xef4444, { emissive: 0xef4444, emissiveIntensity: .8 }), X, 20, Z);
        put(new THREE.BoxGeometry(9, 0.8, 0.8), steel, X + 4, 17, Z);
        break;
      case 'excavator':
        put(new THREE.BoxGeometry(14, 6, 9), amber, X, 3, Z);
        put(new THREE.BoxGeometry(3, 16, 3), steel, X, 11, Z - 3);
        put(new THREE.BoxGeometry(18, 1.3, 1.3), steel, X + 7, 17, Z - 3, 0, 0, -0.42);
        put(new THREE.ConeGeometry(3, 5, 8), dark, X + 15, 12, Z - 3, Math.PI, 0, 0);
        break;
      case 'crane': case 'towercrane':
        put(new THREE.BoxGeometry(3, 34, 3), steel, X, 17, Z);
        put(new THREE.BoxGeometry(38, 1.4, 1.4), amber, X + 6, 34, Z);
        put(new THREE.BoxGeometry(1, 12, 1), steel, X + 22, 28, Z);
        put(new THREE.BoxGeometry(6, 4, 6), dark, X + 22, 21, Z);
        break;
      case 'floodlight':
        for (let i = -1; i <= 1; i++) {
          put(new THREE.CylinderGeometry(0.4, 0.6, 20, 8), steel, X + i * 9, 10, Z);
          put(new THREE.BoxGeometry(6, 2, 1), this._mat(0xfff2c0, { emissive: 0xffe28a, emissiveIntensity: .7 }), X + i * 9, 20, Z);
        }
        break;
      case 'bridge':
        put(new THREE.BoxGeometry(80, 2, 14), light, X, 9, Z);
        for (const dx of [-30, 0, 30]) { put(new THREE.BoxGeometry(3, 18, 3), steel, X + dx, 0, Z - 5); put(new THREE.BoxGeometry(3, 18, 3), steel, X + dx, 0, Z + 5); }
        put(new THREE.PlaneGeometry(90, 70), this._mat(0x1d5e8a), X, 0.2, Z + 40, -Math.PI / 2, 0, 0);
        break;
      case 'neonarch':
        put(new THREE.BoxGeometry(2, 22, 2), dark, X - 12, 11, Z);
        put(new THREE.BoxGeometry(2, 22, 2), dark, X + 12, 11, Z);
        put(new THREE.BoxGeometry(26, 2, 2), this._mat(0xef4444, { emissive: 0xef4444, emissiveIntensity: 1.0 }), X, 22, Z);
        put(new THREE.BoxGeometry(20, 1, 1), this._mat(0x22d3ee, { emissive: 0x22d3ee, emissiveIntensity: 1.0 }), X, 18, Z);
        break;
      case 'fallentree':
        put(new THREE.CylinderGeometry(2.2, 2.8, 30, 10), this._mat(0x5b4128), X, 3, Z, 0, 0, Math.PI / 2);
        for (let i = 0; i < 5; i++) put(new THREE.IcosahedronGeometry(5 + i, 0), this._mat(0x35562c), X - 10 + i * 5, 5 + (i % 2) * 3, Z + (i % 3) * 4);
        break;
      case 'rebar':
        for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++)
          put(new THREE.CylinderGeometry(0.16, 0.16, 9, 6), this._mat(0x8a4b2a), X - 14 + i * 4, 4.5, Z - 8 + j * 5);
        put(new THREE.BoxGeometry(36, 0.6, 22), light, X, 0.4, Z);
        break;
      case 'lowbeam':
        for (const dx of [-11, 11]) { put(new THREE.BoxGeometry(1.5, 7, 1.5), steel, X + dx, 3.5, Z); put(new THREE.BoxGeometry(4, 0.6, 4), amber, X + dx, 0.3, Z); }
        put(new THREE.BoxGeometry(24, 1.2, 2), amber, X, 7, Z);
        break;
      case 'stadium':
        put(new THREE.TorusGeometry(24, 4, 8, 28), light, X, 12, Z, Math.PI / 2, 0, 0);
        put(new THREE.CylinderGeometry(24, 26, 10, 24), steel, X, 5, Z);
        put(new THREE.CylinderGeometry(0.7, 0.7, 30, 8), amber, X + 26, 15, Z);
        break;
      default:
        put(new THREE.BoxGeometry(14, 18, 14), steel, X, 9, Z);
        put(new THREE.ConeGeometry(10, 8, 8), amber, X, 22, Z);
    }
  }

  _props(s) {
    const n = 26;
    const shapes = {
      fence: () => new THREE.BoxGeometry(3, 1.4, 0.3),
      cones: () => new THREE.ConeGeometry(0.6, 1.7, 8),
      barriers: () => new THREE.BoxGeometry(3, 1.1, 0.6),
      trees: () => new THREE.IcosahedronGeometry(3.2, 0),
      cars: () => new THREE.BoxGeometry(4.2, 1.7, 2.1),
      pipes: () => new THREE.CylinderGeometry(0.7, 0.7, 5, 10),
      piperack: () => new THREE.BoxGeometry(6, 0.5, 2.4),
      lamps: () => new THREE.CylinderGeometry(0.25, 0.35, 7, 8),
      debris: () => new THREE.DodecahedronGeometry(1.6, 0),
      crates: () => new THREE.BoxGeometry(2.4, 2.4, 2.4),
      tires: () => new THREE.TorusGeometry(1.1, 0.45, 8, 12),
      rebar: () => new THREE.CylinderGeometry(0.18, 0.18, 5, 6),
      mix: () => new THREE.BoxGeometry(2.6, 1.8, 2.6)
    };
    const geo = this._own((shapes[s.props] || shapes.barriers)());
    const colour = {
      fence: 0xe6dcc2, cones: 0xff6a1a, barriers: s.accent, trees: 0x3f7d3c,
      cars: 0x9aa5b4, pipes: 0x7b8b99, piperack: 0x5b6677, lamps: 0xffe6a8,
      debris: 0x6b5a45, crates: 0xb98a4a, tires: 0x22262c, rebar: 0x8a4b2a,
      mix: 0x8b949f
    }[s.props] || s.accent;
    const mat = this._mat(colour, s.props === 'lamps' ? { emissive: 0xffd277, emissiveIntensity: 0.25 } : {});
    const im = new THREE.InstancedMesh(geo, mat, n);
    const dummy = new THREE.Object3D();
    let seed = s.id * 15485863;
    const R = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, r = 42 + R() * 66;   // keep a clear 40 m around the machine
      const h = s.props === 'trees' ? 4 : s.props === 'lamps' ? 3.5 : s.props === 'cones' ? 0.9 : 0.8;
      if (s.props === 'cars') {
        // TIER D: a real traffic LINEUP across the road, not random scatter.
        const lane = i % 2, k = Math.floor(i / 2);
        dummy.position.set(-34 + k * 9.5, 0.9, -30 + lane * 7);
        dummy.rotation.set(0, lane ? Math.PI : 0, 0);
        dummy.scale.setScalar(1);
      } else {
        dummy.position.set(Math.cos(a) * r, h, Math.sin(a) * r);
        dummy.rotation.set(0, R() * 6.284, s.props === 'pipes' ? Math.PI / 2 : 0);
        dummy.scale.setScalar(0.8 + R() * 0.7);
      }
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
    im.name = 'stage-props';
    this.group.add(im);
  }

  envFor(id) {
    const s = STAGE_BY_ID[id] || STAGE_TABLE[0];
    return { id: 'stage' + id, sun: s.sun, hemi: s.hemi, fog: s.fog, fogColor: s.sky,
      lights: !!s.night, rain: s.sound === 'rain' };
  }
  soundBed(id) { return (STAGE_BY_ID[id] || STAGE_TABLE[0]).sound; }
  name(id) { return (STAGE_BY_ID[id] || STAGE_TABLE[0]).name; }
  stage(id) { return STAGE_BY_ID[id] || STAGE_TABLE[0]; }
}

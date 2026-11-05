import * as THREE from 'three';

// TIER 7 - FREE PLAY "STUNT PARK". 160 x 160 m, no timer, no fail.
// All art is code-made. One shared material set, instanced repeating props.
// Park sits outside the city so it never overlaps a job site or a building.
export const PARK_CENTER = { x: 0, z: 620 };
const HALF = 80;

export default class StuntPark {
  constructor(scene, world, RAPIER) {
    this.scene = scene;
    this.world = world;
    this.R = RAPIER;
    this.group = new THREE.Group();
    this.group.name = 'stuntPark';
    this.group.position.set(PARK_CENTER.x, 0, PARK_CENTER.z);
    this.group.visible = false;
    scene.add(this.group);
    this.bodies = [];
    this.colliders = [];
    this.rings = [];
    this.pads = [];
    this.cones = [];
    this.turntable = null;
    this.coins = 0;
    this.maxCoins = 300;        // capped session reward
    this.bestAir = 0;
    this._airT = 0;
    this._lastJump = 0;
    this._t = 0;
    this._built = false;
    this._onCoin = null;
    this.drawCalls = 0;
  }
  onCoin(fn) { this._onCoin = fn; }

  mat(color, extra) {
    if (!this._mats) this._mats = new Map();
    const k = color + JSON.stringify(extra || {});
    if (!this._mats.has(k)) this._mats.set(k, new THREE.MeshStandardMaterial(
      Object.assign({ color, roughness: 0.8, metalness: 0.05 }, extra || {})));
    return this._mats.get(k);
  }
  add(geo, mat, x, y, z, rx, ry) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true;
    this.group.add(m);
    this.drawCalls++;
    return m;
  }
  fixedBox(x, y, z, hx, hy, hz, quat) {
    if (!this.world || !this.R) return;
    const desc = this.R.RigidBodyDesc.fixed().setTranslation(
      PARK_CENTER.x + x, y, PARK_CENTER.z + z);
    if (quat) desc.setRotation(quat);
    const body = this.world.createRigidBody(desc);
    const col = this.world.createCollider(
      this.R.ColliderDesc.cuboid(hx, hy, hz).setFriction(1.2).setRestitution(0), body);
    this.bodies.push(body); this.colliders.push(col);
  }

  build() {
    if (this._built) return;
    const M = (c, e) => this.mat(c, e);
    // One painted pad (no thin geometry, polygonOffset avoids z-fighting).
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({ color: 0x4c6b3c, roughness: 1,
        polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    pad.rotation.x = -Math.PI / 2; pad.position.y = 0.04; pad.receiveShadow = true;
    this.group.add(pad); this.drawCalls++;

    // 6 ramps: one geometry, six rotations. Each has a fixed angled collider.
    const rampGeo = new THREE.BoxGeometry(12, 0.42, 18);
    const rampMat = M(0xaab0b8, { metalness: 0.25, roughness: 0.6 });
    const rampSpots = [[-52, -46], [-18, -52], [20, -50], [52, -40], [-40, 26], [36, 28]];
    for (const [x, z] of rampSpots) {
      const a = -0.30;
      const m = this.add(rampGeo, rampMat, x, 2.75, z, a, 0);
      m.userData.ramp = true;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(a, 0, 0));
      this.fixedBox(x, 2.75, z, 6, 0.21, 9, { x: q.x, y: q.y, z: q.z, w: q.w });
      // Two solid legs so the ramp does not look like a floating thin sheet.
      this.add(new THREE.BoxGeometry(11, 2.4, 1.2), M(0x3a3f47), x, 1.2, z - 8.4);
    }

    // Hill (big rounded mound, visual + flat collider cap).
    const hill = this.add(new THREE.SphereGeometry(22, 20, 12), M(0x7a6a48), -8, -8, 44, 0, 0);
    hill.scale.set(1.5, 0.42, 1.1);
    this.fixedBox(-8, 4.2, 44, 16, 4.2, 12);

    // 360 turntable: rotating disc, flat collider.
    this.turntable = this.add(new THREE.CylinderGeometry(9, 9, 0.6, 32),
      M(0x34445f, { metalness: 0.4 }), 44, 0.32, -18, 0, 0);
    this.add(new THREE.TorusGeometry(8.6, 0.35, 8, 32),
      M(0xfbbf24, { emissive: 0x92400e, emissiveIntensity: 0.4 }), 44, 0.7, -18, -Math.PI / 2, 0);
    this.fixedBox(44, 0.2, -18, 9, 0.3, 9);

    // Soft dig field: 22 clods, ONE InstancedMesh = 1 draw call.
    const clod = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.9, 0), M(0x8b5a2b), 22);
    const d = new THREE.Object3D();
    for (let i = 0; i < 22; i++) {
      const a = i * 2.399, r = 3 + (i % 6) * 2.1;
      d.position.set(-58 + Math.cos(a) * r, 0.7, 46 + Math.sin(a) * r);
      d.rotation.set(i * 0.3, i * 0.7, 0);
      d.scale.setScalar(0.7 + (i % 3) * 0.25);
      d.updateMatrix(); clod.setMatrixAt(i, d.matrix);
    }
    clod.castShadow = true; this.group.add(clod); this.drawCalls++;

    // Cone slalom: 12 cones in ONE InstancedMesh, plus 12 bases in another.
    const coneGeo = new THREE.ConeGeometry(0.5, 1.6, 9);
    const coneMesh = new THREE.InstancedMesh(coneGeo, M(0xff6a1a), 12);
    const baseMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.32, 1.1), M(0x2b3240), 12);
    for (let i = 0; i < 12; i++) {
      const x = -32 + i * 5.6, z = 8 + (i % 2 ? 4 : -4);
      this.cones.push({ x: PARK_CENTER.x + x, z: PARK_CENTER.z + z });
      d.position.set(x, 1.05, z); d.rotation.set(0, 0, 0); d.scale.setScalar(1); d.updateMatrix();
      coneMesh.setMatrixAt(i, d.matrix);
      d.position.set(x, 0.16, z); d.updateMatrix();
      baseMesh.setMatrixAt(i, d.matrix);
    }
    this.group.add(coneMesh); this.group.add(baseMesh); this.drawCalls += 2;

    // 8 floating coin rings: amber tori, bob + spin, collect by driving through.
    const ringGeo = new THREE.TorusGeometry(2.2, 0.38, 8, 20);
    const ringMat = M(0xfbbf24, { emissive: 0xb45309, emissiveIntensity: 0.55, metalness: 0.5 });
    const ringSpots = [[-56, -18], [-30, -22], [-4, -20], [22, -20], [52, 6],
      [16, 46], [-22, 58], [58, 52]];
    for (const [x, z] of ringSpots) {
      const m = this.add(ringGeo, ringMat, x, 3.4, z, 0, 0);
      this.rings.push({ mesh: m, x: PARK_CENTER.x + x, z: PARK_CENTER.z + z, taken: false });
    }

    // Pond: one flat circle, slightly raised and polygon-offset.
    const pond = new THREE.Mesh(new THREE.CircleGeometry(14, 40),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.25, metalness: 0.2,
        transparent: true, opacity: 0.78, polygonOffset: true,
        polygonOffsetFactor: -5, polygonOffsetUnits: -5 }));
    pond.rotation.x = -Math.PI / 2; pond.position.set(-56, 0.07, 52);
    this.group.add(pond); this.drawCalls++;

    // 3 jump pads: amber discs that give a real upward impulse.
    for (const [x, z] of [[0, 6], [-48, 8], [50, -8]]) {
      const jp = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.34, 20),
        M(0x34d399, { emissive: 0x059669, emissiveIntensity: 0.5 }));
      jp.position.set(x, 0.2, z); this.group.add(jp); this.drawCalls++;
      this.pads.push({ x: PARK_CENTER.x + x, z: PARK_CENTER.z + z });
    }

    // Fence: 4 sides in ONE InstancedMesh (posts are 0.34, never thinner than 0.3).
    const fence = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 2.2, 0.34), M(0xe5e7eb), 64);
    let n = 0;
    for (let i = 0; i < 16; i++) {
      const t = -HALF + 5 + i * 10;
      for (const [x, z] of [[-HALF, t], [HALF, t], [t, -HALF], [t, HALF]]) {
        d.position.set(x, 1.1, z); d.rotation.set(0, 0, 0); d.scale.setScalar(1); d.updateMatrix();
        if (n < 64) fence.setMatrixAt(n++, d.matrix);
      }
    }
    fence.count = n; this.group.add(fence); this.drawCalls++;

    this._built = true;
  }

  show() { this.build(); this.group.visible = true; }
  hide() { this.group.visible = false; }
  reset() { for (const r of this.rings) { r.taken = false; r.mesh.visible = true; } }

  update(dt, vehicle) {
    if (!this.group.visible || !vehicle) return null;
    this._t += dt;
    if (this.turntable) this.turntable.rotation.y += dt * 0.55;
    const p = vehicle.mesh.position;

    // Coin rings: capped at maxCoins, one reward per ring per visit.
    for (const r of this.rings) {
      if (!r.taken) {
        r.mesh.rotation.y += dt * 1.1;
        r.mesh.position.y = 3.4 + Math.sin(this._t * 2 + r.x) * 0.35;
        if (Math.hypot(p.x - r.x, p.z - r.z) < 3.4 && Math.abs(p.y - 1.2) < 4) {
          r.taken = true; r.mesh.visible = false;
          if (this.coins < this.maxCoins) {
            const give = Math.min(15, this.maxCoins - this.coins);
            this.coins += give;
            if (this._onCoin) this._onCoin(give);
          }
        }
      }
    }

    // Jump pads: real vertical impulse, short cooldown.
    if (this._t - this._lastJump > 1.2 && vehicle.chassisBody && this.world) {
      for (const j of this.pads) {
        if (Math.hypot(p.x - j.x, p.z - j.z) < 4) {
          try {
            const v = vehicle.chassisBody.linvel();
            vehicle.chassisBody.setLinvel({ x: v.x, y: 8.5, z: v.z }, true);
            this._lastJump = this._t;
          } catch (e) {}
          break;
        }
      }
    }

    // Best air time: seconds spent clearly above the ground.
    if (p.y > 2.4) { this._airT += dt; this.bestAir = Math.max(this.bestAir, this._airT); }
    else this._airT = 0;

    return { coins: this.coins, bestAir: this.bestAir, rings: this.rings.filter(r => r.taken).length };
  }

  dispose() {
    for (const c of this.colliders) { try { this.world.removeCollider(c, true); } catch (e) {} }
    for (const b of this.bodies) { try { this.world.removeRigidBody(b); } catch (e) {} }
    this.colliders = []; this.bodies = [];
    this.scene.remove(this.group);
  }
}

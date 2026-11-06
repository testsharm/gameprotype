import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export class Vehicle {
    constructor(scene, world, RAPIER) {
        this.scene = scene; this.world = world; this.RAPIER = RAPIER;
        this.mode = 'backhoe'; this.hasDirt = false;

        this.armIsDown = false; this.bucketIsCurled = false;
        this.targetBoomAngle = -0.2; this.targetBucketAngle = 0.2;
        this.engineMultiplier = 1.0; this.hydraulicMultiplier = 1.0;
        this.tyreGrip = 1.0; this.paintMats = null;

        this.particles = []; this.particlePool = []; this.particleGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        // soft round smoke / dust puffs (sprites with a painted radial gradient)
        this.puffTex = this._makePuffTexture(); this.puffPool = []; this.puffs = []; this._smokeAcc = 0; this._dustAcc = 0;

        this.chassisBody = this.createChassis();
        this.vehicleController = this.createVehicleController();
        this.mesh = this.createMesh(); this.scene.add(this.mesh);

        // Combined steering + spin requires intrinsic Y-X order on the wheel groups
        for (const w of this.wheelMeshes) { w.group.rotation.order = 'YXZ'; }

        // Physics state
        this.throttleState = 0;
        this.currentSteerAngle = 0;
        this.smoothedSpeed = 0;
        this.currentSpeed = 0;
        this.signedSpeedKmh = 0;
        this.tipTimer = 0;
        this.lastSafePosition = { x: 0, y: 1.2, z: 0 };
        this.lastSafeQuaternion = { x: 0, y: 0, z: 0, w: 1 };

        // Scratch vectors (avoid per-frame allocations)
        this._tempVel = new THREE.Vector3();
        this._tempForward = new THREE.Vector3();
        this._tempQuat = new THREE.Quaternion();
        this._tempUp = new THREE.Vector3();

        // Spawn inside the new central garage hub
        this.chassisBody.setTranslation({ x: 0, y: 1.2, z: 0 }, true);
        this.chassisBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    }

    setUpgrades(saveData) {
        if(saveData) {
            this.engineMultiplier = 1 + (Math.max(1, saveData.engineLevel || 1) - 1) * 0.5;
            this.hydraulicMultiplier = 1 + (Math.max(1, saveData.hydraulicLevel || 1) - 1) * 0.6;
            this.tyreGrip = 1 + (Math.max(1, saveData.tyreLevel || 1) - 1) * 0.12;
            if (this.beaconMesh) this.beaconMesh.visible = true;
        }
    }

    // TIER 6: six paint colours really change the machine (code-made material).
    setPaint(hex) {
        if (!this.paintMats) return;
        const c = new THREE.Color(hex);
        this.paintMats[0].color.copy(c);
        this.paintMats[1].color.copy(c).multiplyScalar(0.78);
        this.paintMats[0].needsUpdate = this.paintMats[1].needsUpdate = true;
    }

    createChassis() {
        const R = this.RAPIER;
        const chassisDesc = R.RigidBodyDesc.dynamic()
            .setTranslation(0, 1.2, 0)
            .setLinearDamping(0.15)
            .setAngularDamping(2.5)
            .setCcdEnabled(true);

        const chassisBody = this.world.createRigidBody(chassisDesc);

        // Light collider shell; the bulk of the mass is added below at a low offset.
        const colliderDesc = R.ColliderDesc.cuboid(0.9, 0.3, 1.5)
            .setMass(500)
            .setFriction(1.0)
            .setRestitution(0.0)
            .setTranslation(0, -0.3, 0);
        this.world.createCollider(colliderDesc, chassisBody);

        // Additional 6500kg at y=-0.5 => total 7000kg, COM ~ -0.48 from body origin.
        // Higher principal inertia on X/Y resists tipping and spinout.
        chassisBody.setAdditionalMassProperties(
            6500,
            { x: 0, y: -0.5, z: 0 },
            { x: 5000, y: 6600, z: 2000 },
            { x: 0, y: 0, z: 0, w: 1 }
        );

        return chassisBody;
    }

    createVehicleController() {
        const R = this.RAPIER; const controller = this.world.createVehicleController(this.chassisBody);
        const wheelPositions = [
            { x: -0.9, y: -0.2, z: 1.2, r: 0.6 }, { x: 0.9, y: -0.2, z: 1.2, r: 0.6 },
            { x: -1.0, y: -0.1, z: -1.1, r: 0.88 }, { x: 1.0, y: -0.1, z: -1.1, r: 0.88 }
        ];
        const direction = { x: 0, y: -1, z: 0 }; const axle = { x: -1, y: 0, z: 0 };

        for (let pos of wheelPositions) controller.addWheel({x: pos.x, y: pos.y, z: pos.z}, direction, axle, 0.4, pos.r);

        for (let i = 0; i < 4; i++) {
            // Stiff springs tuned for a ~7-ton body
            controller.setWheelSuspensionStiffness(i, 150.0);
            controller.setWheelSuspensionCompression(i, 3.5);
            controller.setWheelSuspensionRelaxation(i, 3.0);
            controller.setWheelMaxSuspensionTravel(i, 0.25);
            controller.setWheelMaxSuspensionForce(i, 200000.0);
            // Realistic tire grip (2000 was ice-skating); tires should bite and rotate the vehicle
            controller.setWheelFrictionSlip(i, 1.5);
            controller.setWheelSideFrictionStiffness(i, 1.0);
        }
        return controller;
    }

    toggleArm() {
        this.armIsDown = !this.armIsDown;
        if (!this.armIsDown) { this.targetBoomAngle = -0.2; this.bucketIsCurled = false; this.targetBucketAngle = 0.2; }
        else { this.targetBoomAngle = 0.8; }
    }

    _hint(msg) {
        const n = performance.now();
        if (this._lastHint && n - this._lastHint < 1500) return;
        this._lastHint = n;
        window.dispatchEvent(new CustomEvent('bh-hint', { detail: msg }));
    }

    // A7/A8: two explicit verbs. autoAction() kept for old QA hooks.
    scoop() {
        if (this._auto || window.__digBusy) return false;
        if (this.hasDirt) { this._hint('Bucket full. Dump it first.'); return false; }
        const bp = new THREE.Vector3(); this.bucketPivot.getWorldPosition(bp);
        if (!this.pilePos || bp.distanceTo(this.pilePos) > 9) { this._hint('Drive to the dirt pile'); return false; }
        this.scoopDirt(); this.spawnDirtBurst();
        return true;
    }
    dump() {
        if (this._auto || window.__digBusy) return false;
        if (!this.hasDirt) { this._hint('SCOOP FIRST'); return false; }
        const bp = new THREE.Vector3(); this.bucketPivot.getWorldPosition(bp);
        if (!this.truckPos || bp.distanceTo(this.truckPos) > 8) { this._hint('Drive to the blue truck'); return false; }
        this.dropDirt(); this.spawnDirtBurst();
        return true;
    }
    autoAction() { return this.hasDirt ? this.dump() : this.scoop(); }

    _autoStep(dt) {
        const a = this._auto; if (!a) return;
        a.t += dt;
        if (a.type === 'scoop') {
            if (a.step === 0) { this.armIsDown = true; this.targetBoomAngle = 0.8; this.targetBucketAngle = -0.5; a.step = 1; a.t = 0; }
            else if (a.step === 1 && a.t > 0.44) { this.targetBucketAngle = 1.2; this.bucketIsCurled = true; a.step = 2; a.t = 0; }
            else if (a.step === 2 && a.t > 0.40) { this.scoopDirt(); this.spawnDirtBurst(); a.step = 3; a.t = 0; }
            else if (a.step === 3 && a.t > 0.26) { this.targetBoomAngle = -0.2; this.armIsDown = false; a.step = 4; a.t = 0; }
            else if (a.step === 4 && a.t > 0.50) { this._auto = null; }
        } else {
            if (a.step === 0) { this.targetBoomAngle = -0.2; this.targetBucketAngle = -0.9; a.step = 1; a.t = 0; }
            else if (a.step === 1 && a.t > 0.45) { if (this.hasDirt) { this.spawnDirtBurst(); this.dropDirt(); } a.step = 2; a.t = 0; }
            else if (a.step === 2 && a.t > 0.40) { this.targetBucketAngle = 0.2; this.targetBoomAngle = -0.2; this.bucketIsCurled = false; this.armIsDown = false; a.step = 3; a.t = 0; }
            else if (a.step === 3 && a.t > 0.35) { this._auto = null; }
        }
    }

    _tryScoop() {
        if (this.hasDirt || !this.pilePos) return;
        const p = new THREE.Vector3(); this.bucketPivot.getWorldPosition(p);
        if (p.distanceTo(this.pilePos) < 14) this.scoopDirt();
    }

    toggleBucket() {
        this.bucketIsCurled = !this.bucketIsCurled;
        if (this.bucketIsCurled) { this.targetBucketAngle = 1.2; this._tryScoop(); }
        else { this.targetBucketAngle = -0.5; if (this.hasDirt) { this.spawnDirtBurst(); this.dropDirt(); } }
    }

    createMesh() {
        const group = new THREE.Group();

        // ---------- materials (plain standard materials: cheap and stable) ----------
        const paint = new THREE.MeshStandardMaterial({ color: 0xf5b700, roughness: 0.42, metalness: 0.1 });
        const paintDark = new THREE.MeshStandardMaterial({ color: 0xf5b700, roughness: 0.5, metalness: 0.1 });
        this.paintMats = [paint, paintDark];
        const blackPlastic = new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.7, metalness: 0.2 });
        const darkSteel = new THREE.MeshStandardMaterial({ color: 0x3a3e45, roughness: 0.55, metalness: 0.35 });
        const steel = new THREE.MeshStandardMaterial({ color: 0xb4b9bf, roughness: 0.35, metalness: 0.3 });
        const wornSteel = new THREE.MeshStandardMaterial({ color: 0x8d9298, roughness: 0.6, metalness: 0.3 });
        const glass = new THREE.MeshStandardMaterial({ color: 0x9fd0e8, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.55, depthWrite: false });
        const tireRubber = new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 1.0 });
        const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffaa, emissiveIntensity: 2.0 });
        const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 1.6 });
        const hazardYellow = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.55 });
        const hazardBlack = new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.55 });
        const beaconMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0 });

        // ---------- small helpers ----------
        const put = (parent, mesh, x, y, z) => {
            mesh.position.set(x, y, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            parent.add(mesh);
            return mesh;
        };
        const box = (parent, w, h, d, mat, x, y, z) =>
            put(parent, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z);
        const rbox = (parent, w, h, d, r, mat, x, y, z) => {
            const rad = Math.max(0.02, Math.min(r, Math.min(w, h, d) / 2 - 0.01));
            return put(parent, new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, rad), mat), x, y, z);
        };
        const cyl = (parent, r, len, axis, mat, x, y, z, seg) => {
            const g = new THREE.CylinderGeometry(r, r, len, seg || 16);
            if (axis === 'x') g.rotateZ(Math.PI / 2);
            else if (axis === 'z') g.rotateX(Math.PI / 2);
            return put(parent, new THREE.Mesh(g, mat), x, y, z);
        };

        const visualGroup = new THREE.Group(); visualGroup.position.y = -0.1; group.add(visualGroup);
        const backhoeGroup = new THREE.Group(); visualGroup.add(backhoeGroup);
        // TIER 8: visual-only suspension. The physics body never changes.
        this.bodyGroup = backhoeGroup; this._bodyRoll = 0; this._bodyPitch = 0;

        // ---------- main body ----------
        rbox(backhoeGroup, 2.2, 0.8, 4.0, 0.2, paint, 0, 0.6, 0);
        box(backhoeGroup, 1.7, 0.3, 3.6, blackPlastic, 0, 0.1, 0);

        // ---------- hood (rounded) + sloped top ----------
        rbox(backhoeGroup, 2.0, 0.8, 2.3, 0.28, paint, 0, 1.0, 0.85);
        const hoodTop = rbox(backhoeGroup, 1.8, 0.5, 1.2, 0.22, paint, 0, 1.42, 1.45);
        hoodTop.rotation.x = 0.18;

        // front: grille, bumper, headlights
        box(backhoeGroup, 1.3, 0.6, 0.3, darkSteel, 0, 0.85, 2.0);
        rbox(backhoeGroup, 2.4, 0.4, 0.5, 0.15, darkSteel, 0, 0.35, 2.15);
        [-1, 1].forEach((s) => {
            box(backhoeGroup, 0.3, 0.35, 0.3, headlightMat, s * 1.02, 1.15, 2.0);
        });

        // ---------- side tool boxes, fenders, mudguards, steps ----------
        [-1, 1].forEach((s) => {
            rbox(backhoeGroup, 0.3, 0.6, 1.2, 0.1, darkSteel, s * 1.15, 0.55, 1.0);
            rbox(backhoeGroup, 0.8, 0.3, 1.5, 0.12, paint, s * 1.0, 0.55, -1.1);
            rbox(backhoeGroup, 0.5, 0.3, 0.9, 0.1, paintDark, s * 0.95, 0.2, 1.2);
            rbox(backhoeGroup, 0.5, 0.3, 0.9, 0.1, darkSteel, s * 1.2, 0.85, -0.7);
        });

        // ---------- cab ----------
        rbox(backhoeGroup, 1.9, 0.44, 2.0, 0.1, paintDark, 0, 1.2, -0.65);
        const glassBox = box(backhoeGroup, 1.5, 1.4, 1.5, glass, 0, 2.1, -0.65);
        glassBox.castShadow = false;
        glassBox.userData.cabHide = true;
        [-1, 1].forEach((s) => {
            rbox(backhoeGroup, 0.3, 1.5, 0.3, 0.1, paint, s * 0.77, 2.1, 0.15);
            rbox(backhoeGroup, 0.3, 1.5, 0.3, 0.1, paint, s * 0.77, 2.1, -1.45);
        });
        rbox(backhoeGroup, 2.1, 0.3, 2.2, 0.12, paint, 0, 2.95, -0.65).userData.cabHide = true;
        // interior
        rbox(backhoeGroup, 0.8, 0.9, 0.8, 0.15, blackPlastic, 0, 1.95, -1.0);
        rbox(backhoeGroup, 1.0, 0.5, 0.4, 0.1, blackPlastic, 0, 1.75, -0.1);
        const steeringWheel = cyl(backhoeGroup, 0.25, 0.3, 'y', blackPlastic, 0, 2.1, -0.35);
        steeringWheel.rotation.x = -1.0;
        // roof gear
        rbox(backhoeGroup, 0.9, 0.3, 0.6, 0.1, darkSteel, 0, 3.2, -1.15).userData.cabHide = true;
        [-1, 1].forEach((s) => {
            box(backhoeGroup, 0.45, 0.3, 0.3, headlightMat, s * 0.7, 3.2, 0.3).userData.cabHide = true;
        });

        // amber beacon (blinking)
        cyl(backhoeGroup, 0.2, 0.3, 'y', darkSteel, -0.6, 3.25, -1.3, 12);
        const beaconMesh = cyl(backhoeGroup, 0.18, 0.3, 'y', beaconMat, -0.6, 3.55, -1.3, 12);
        this.beaconMesh = beaconMesh;
        beaconMesh.castShadow = false;
        this.beaconMesh = beaconMesh;
        beaconMesh.material.transparent=true;beaconMesh.material.opacity=.65;beaconMesh.material.depthWrite=false;
        this.beaconRotor=new THREE.Group();this.beaconRotor.position.copy(beaconMesh.position);backhoeGroup.add(this.beaconRotor);
        const reflector=new THREE.Mesh(new THREE.BoxGeometry(.4,.26,.12),steel);this.beaconRotor.add(reflector);
        for(const side of [-1,1]){const hose=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.65,1.2,.5),new THREE.Vector3(side*.95,1.7,1.3),new THREE.Vector3(side*.85,1.3,2),new THREE.Vector3(side*.65,1,2.6)]);const tube=new THREE.Mesh(new THREE.TubeGeometry(hose,12,.07,6,false),blackPlastic);backhoeGroup.add(tube);}

        // A2: unmistakable folded rear excavator assembly and outriggers.
        const rear=new THREE.Group();rear.name='folded-rear-backhoe';backhoeGroup.add(rear);
        const beam=(a,b,w,d,material)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const m=box(rear,w,v.length(),d,material,...av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;};
        box(rear,.9,.7,.8,paint,0,.8,-2.05);
        beam([0,1,-2.15],[-.35,3.5,-2.9],.48,.55,paint);
        beam([-.35,3.5,-2.9],[.35,1.7,-3.4],.36,.45,paint);
        beam([.16,1.1,-2.3],[-.35,2.9,-2.85],.15,.15,steel);
        for(const [x,y,z] of [[0,1,-2.15],[-.35,3.5,-2.9],[.35,1.7,-3.4]])cyl(rear,.2,.65,'x',darkSteel,x,y,z);
        box(rear,.85,.3,.85,darkSteel,.35,1.25,-3.25);box(rear,.85,.7,.3,darkSteel,.35,1.55,-3.6);
        for(const x of [0,.35,.7])box(rear,.14,.3,.36,steel,x,1.1,-3);
        for(const side of [-1,1]){beam([side*.8,.7,-1.9],[side*1.65,-.55,-2.35],.28,.3,paint);box(rear,.65,.22,.7,darkSteel,side*1.65,-.55,-2.35);box(backhoeGroup,.2,.2,.6,darkSteel,side*1.1,2.7,0);box(backhoeGroup,.35,.4,.16,steel,side*1.2,2.7,.22);}
        // ---------- exhaust ----------
        this.exhaustTip = new THREE.Object3D(); this.exhaustTip.position.set(0.9, 3.55, 1.15); backhoeGroup.add(this.exhaustTip);
        cyl(backhoeGroup, 0.15, 1.8, 'y', darkSteel, 0.9, 2.3, 1.15, 12).userData.cabHide = true;
        cyl(backhoeGroup, 0.2, 0.3, 'y', steel, 0.9, 3.3, 1.15, 12).userData.cabHide = true;

        // ---------- mirrors ----------
        [-1, 1].forEach((s) => {
            box(backhoeGroup, 0.5, 0.3, 0.3, blackPlastic, s * 1.15, 2.5, 0.15);
            rbox(backhoeGroup, 0.3, 0.6, 0.35, 0.1, blackPlastic, s * 1.35, 2.4, 0.2);
        });

        // ---------- rear: counterweight, hazard band, tail lights ----------
        rbox(backhoeGroup, 2.3, 0.9, 0.9, 0.2, darkSteel, 0, 0.5, -2.1);
        for (let i = 0; i < 6; i++) {
            box(backhoeGroup, 0.34, 0.3, 0.3, i % 2 === 0 ? hazardYellow : hazardBlack, -0.85 + i * 0.34, 0.3, -2.6);
        }
        [-1, 1].forEach((s) => {
            box(backhoeGroup, 0.3, 0.4, 0.3, taillightMat, s * 0.9, 0.75, -2.55);
            // rear stabiliser legs
            box(backhoeGroup, 0.4, 1.0, 0.4, steel, s * 1.35, 0.15, -1.95);
            rbox(backhoeGroup, 0.8, 0.3, 0.8, 0.1, darkSteel, s * 1.35, -0.45, -1.95);
        });

        // ---------- boom (two thick beams, pins, cross tube, hydraulics) ----------
        this.boomPivot = new THREE.Group(); this.boomPivot.position.set(0, 1.0, 2.0); this.boomPivot.rotation.x = this.targetBoomAngle; backhoeGroup.add(this.boomPivot);
        [-1, 1].forEach((s) => {
            rbox(this.boomPivot, 0.4, 0.55, 3.3, 0.15, paint, s * 0.75, 0, 1.25);
            cyl(this.boomPivot, 0.2, 1.1, 'z', paintDark, s * 0.75, 0.5, 0.7, 14);   // cylinder barrel
            cyl(this.boomPivot, 0.15, 1.1, 'z', steel, s * 0.75, 0.5, 1.7, 12);      // cylinder rod
        });
        cyl(this.boomPivot, 0.2, 2.3, 'x', steel, 0, 0, 0, 14);                        // boom pivot pin
        cyl(this.boomPivot, 0.2, 1.1, 'x', darkSteel, 0, 0, 1.6, 14);                  // cross tube

        // ---------- bucket (thick walls, edge, teeth) ----------
        this.bucketPivot = new THREE.Group(); this.bucketPivot.position.set(0, -0.2, 2.8); this.bucketPivot.rotation.x = this.targetBucketAngle; this.boomPivot.add(this.bucketPivot);
        cyl(this.bucketPivot, 0.22, 2.2, 'x', steel, 0, 0, 0, 14);                     // bucket pivot pin
        rbox(this.bucketPivot, 1.8, 0.4, 0.4, 0.1, darkSteel, 0, 0.7, -0.65);          // top bracket
        rbox(this.bucketPivot, 2.6, 0.3, 1.5, 0.1, darkSteel, 0, -0.25, 0.05);         // floor
        const backPlate = rbox(this.bucketPivot, 2.6, 1.2, 0.3, 0.1, darkSteel, 0, 0.25, -0.6);
        backPlate.rotation.x = -0.25;
        [-1, 1].forEach((s) => {
            rbox(this.bucketPivot, 0.3, 1.1, 1.5, 0.1, darkSteel, s * 1.15, 0.2, 0.05);
        });
        rbox(this.bucketPivot, 2.7, 0.3, 0.4, 0.05, wornSteel, 0, -0.3, 0.85);         // cutting edge
        const toothGeo = new THREE.ConeGeometry(0.15, 0.4, 5); toothGeo.rotateX(Math.PI / 2);
        for (let i = 0; i < 6; i++) {
            put(this.bucketPivot, new THREE.Mesh(toothGeo, wornSteel), -1.1 + i * 0.44, -0.3, 1.15);
        }

        // Bucket dirt (hidden until scooped)
        this.bucketDirtGroup = new THREE.Group(); this.bucketDirtGroup.position.set(0, 0.2, 0);
        const clodGeo = new THREE.DodecahedronGeometry(0.1, 1); const clodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 1.0 });
        for(let i = 0; i < 8; i++) { const clod = new THREE.Mesh(clodGeo, clodMat); clod.position.set((Math.random()-0.5)*2.0, (Math.random()-0.5)*0.4, (Math.random()-0.5)*1.0); clod.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0); clod.visible = false; this.bucketDirtGroup.add(clod); }
        this.bucketPivot.add(this.bucketDirtGroup);

        // ---------- wheels: tyre, tread blocks, rim, hub ----------
        this.wheelMeshes = [];
        const wheelData = [{ x: -0.9, y: -0.2, z: 1.2, r: 0.6, w: 0.3 }, { x: 0.9, y: -0.2, z: 1.2, r: 0.6, w: 0.3 }, { x: -1.0, y: -0.1, z: -1.1, r: 0.88, w: 0.5 }, { x: 1.0, y: -0.1, z: -1.1, r: 0.88, w: 0.5 }];
        wheelData.forEach((pos) => {
            const wheelGroup = new THREE.Group();
            const tire = new THREE.Mesh(new THREE.CylinderGeometry(pos.r, pos.r, pos.w, 24).rotateZ(Math.PI / 2), tireRubber);
            tire.castShadow = true; wheelGroup.add(tire);
            // tread blocks around the tyre
            const lugCount = pos.r > 0.4 ? 16 : 12;
            const lugGeo = new THREE.BoxGeometry(pos.w * 0.9, 0.16, 0.22);
            for (let i = 0; i < lugCount; i++) {
                const a = (i / lugCount) * Math.PI * 2;
                const lug = new THREE.Mesh(lugGeo, tireRubber);
                lug.position.set(0, Math.cos(a) * pos.r, Math.sin(a) * pos.r);
                lug.rotation.x = a;
                wheelGroup.add(lug);
            }
            cyl(wheelGroup, pos.r * 0.58, pos.w + 0.16, 'x', paintDark, 0, 0, 0, 20);   // rim sticks out 0.08 each side
            cyl(wheelGroup, 0.15, pos.w + 0.3, 'x', steel, 0, 0, 0, 10);                // hub nut
            wheelGroup.position.set(pos.x, pos.y, pos.z); visualGroup.add(wheelGroup); this.wheelMeshes.push({ group: wheelGroup, baseY: pos.y });
        });

        return group;
    }

    spawnParticle(pos, velocity, color, life, scale) {
        let particle;
        if (this.particlePool.length > 0) { particle = this.particlePool.pop(); particle.mesh.visible = true; }
        else { const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8 }); const mesh = new THREE.Mesh(this.particleGeo, mat); this.scene.add(mesh); particle = { mesh: mesh, velocity: new THREE.Vector3(), life: 0, maxLife: 0, scale: 1 }; }
        particle.mesh.position.copy(pos); particle.mesh.material.color.setHex(color); particle.mesh.scale.set(scale, scale, scale);
        particle.velocity.copy(velocity); particle.life = life; particle.maxLife = life; particle.scale = scale;
        this.particles.push(particle);
    }

    // B8: max 12 small grey-white puffs, 0.6 s life, only while the throttle is held.
    spawnExhaust() {
        if (this.puffs.length >= 12) return;
        const pos = new THREE.Vector3(); this.exhaustTip.getWorldPosition(pos);
        const vel = new THREE.Vector3((Math.random() - 0.5) * 0.7, 0.7 + Math.random() * 0.5, (Math.random() - 0.5) * 0.7);
        this.spawnPuff(pos, vel, 0xc9ced6, 0.55 + Math.random() * 0.15, 0.20, 0.55, 0.26);
    }
    spawnTireDust(wheelIndex) { const pos = new THREE.Vector3(); this.wheelMeshes[wheelIndex].group.getWorldPosition(pos); pos.y = 0.2; const vel = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2); this.spawnPuff(pos, vel.multiplyScalar(0.4), 0xb5a58a, 0.8 + Math.random() * 0.5, 0.4, 1.8, 0.32); }
    spawnDirtBurst() { if (!this.hasDirt) return; const pos = new THREE.Vector3(); this.bucketPivot.getWorldPosition(pos); for (let i = 0; i < 15; i++) { const vel = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6); this.spawnParticle(pos, vel, 0x5c3a21, 0.8 + Math.random() * 0.4, 0.5); } }

    _makePuffTexture() {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.45, 'rgba(255,255,255,0.55)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    spawnPuff(pos, vel, color, life, startScale, endScale, opacity) {
        let p = this.puffPool.pop();
        if (!p) {
            const mat = new THREE.SpriteMaterial({ map: this.puffTex, color: color, transparent: true, depthWrite: false, opacity: 0 });
            const sprite = new THREE.Sprite(mat);
            sprite.renderOrder = 5;
            this.scene.add(sprite);
            p = { sprite: sprite, velocity: new THREE.Vector3(), life: 0, maxLife: 1, s0: 1, s1: 1, op: 1, spin: 0 };
        }
        p.sprite.visible = true;
        p.sprite.position.copy(pos);
        p.sprite.material.color.setHex(color);
        p.sprite.material.rotation = Math.random() * 6.28;
        p.sprite.scale.set(startScale, startScale, 1);
        p.velocity.copy(vel);
        p.life = life; p.maxLife = life;
        p.s0 = startScale; p.s1 = endScale; p.op = opacity;
        p.spin = (Math.random() - 0.5) * 0.8;
        this.puffs.push(p);
        if (this.puffs.length > 160) {
            const old = this.puffs.shift();
            old.sprite.visible = false;
            this.puffPool.push(old);
        }
    }

    updatePuffs(dt) {
        const drag = Math.exp(-1.6 * dt);
        for (let i = this.puffs.length - 1; i >= 0; i--) {
            const p = this.puffs[i];
            p.life -= dt;
            if (p.life <= 0) {
                p.sprite.visible = false;
                this.puffPool.push(p);
                this.puffs.splice(i, 1);
                continue;
            }
            const age = 1 - p.life / p.maxLife;           // 0 -> 1
            p.velocity.multiplyScalar(drag);
            p.velocity.y += 0.9 * dt;                      // warm air carries it up
            p.sprite.position.addScaledVector(p.velocity, dt);
            const s = p.s0 + (p.s1 - p.s0) * Math.sqrt(age);
            p.sprite.scale.set(s, s, 1);
            p.sprite.material.rotation += p.spin * dt;
            p.sprite.material.opacity = p.op * Math.min(1, age * 6) * (1 - age);
        }
    }

    updateParticles(dt) {
        this.updatePuffs(dt);
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]; p.life -= dt;
            if (p.life <= 0) { p.mesh.visible = false; this.particlePool.push(p); this.particles.splice(i, 1); continue; }
            p.velocity.y -= 9.81 * dt * 0.5; p.mesh.position.addScaledVector(p.velocity, dt);
            const progress = p.life / p.maxLife; const currentScale = p.scale * progress;
            p.mesh.scale.set(currentScale, currentScale, currentScale); p.mesh.material.opacity = progress;
        }
    }

    scoopDirt() { if (!this.hasDirt) { this.hasDirt = true; this.bucketDirtGroup.children.forEach(c => c.visible = true); return true; } return false; }
    dropDirt() { if (this.hasDirt) { this.hasDirt = false; this.bucketDirtGroup.children.forEach(c => c.visible = false); return true; } return false; }

    capturePhysicsState() {
        const t = this.chassisBody.translation(), r = this.chassisBody.rotation();
        if (!this._currPos) {
            this._prevPos = new THREE.Vector3(t.x, t.y, t.z);
            this._currPos = new THREE.Vector3(t.x, t.y, t.z);
            this._prevQuat = new THREE.Quaternion(r.x, r.y, r.z, r.w);
            this._currQuat = new THREE.Quaternion(r.x, r.y, r.z, r.w);
            this._interpQuat = new THREE.Quaternion();
        } else {
            this._prevPos.copy(this._currPos); this._prevQuat.copy(this._currQuat);
            this._currPos.set(t.x, t.y, t.z); this._currQuat.set(r.x, r.y, r.z, r.w);
        }
    }

    resetInterpolation() { this._currPos = null; }

    getForwardSpeedMps() {
        const vel = this.chassisBody.linvel();
        const rot = this.chassisBody.rotation();
        this._tempQuat.set(rot.x, rot.y, rot.z, rot.w);
        this._tempForward.set(0, 0, 1).applyQuaternion(this._tempQuat);
        return vel.x * this._tempForward.x + vel.z * this._tempForward.z;
    }

    getSpeedKmh() {
        return this.smoothedSpeed;
    }

    resetToSafe() {
        if (!this.lastSafePosition || !this.lastSafeQuaternion) return;
        this.chassisBody.setTranslation(this.lastSafePosition, true);
        this.resetInterpolation();
        this.chassisBody.setRotation(this.lastSafeQuaternion, true);
        this.chassisBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        this.chassisBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        this.tipTimer = 0;
        this.throttleState = 0;
        this.smoothedSpeed = 0;
        this.currentSpeed = 0;
        this.signedSpeedKmh = 0;
    }

    updateController(input, deltaTime) {
        if (input.forward || input.backward || input.left || input.right || input.brake) this.chassisBody.wakeUp();

        // === Throttle ramp ===
        const throttleRampRate = 1 / 0.35; // 0 -> full in 0.6s
        const targetThrottle = input.brake ? 0 : (input.forward ? 1 : (input.backward ? -1 : 0));

        if (targetThrottle !== 0) {
            if (this.throttleState * targetThrottle < 0) this.throttleState = 0;
            const sign = Math.sign(targetThrottle - this.throttleState);
            this.throttleState += sign * throttleRampRate * deltaTime;
            if (Math.abs(this.throttleState) > 1) this.throttleState = Math.sign(this.throttleState);
        } else {
            this.throttleState = 0;
        }

        // === Governor (top speed caps) ===
        const maxForwardSpeed = Math.min(32 + (this.engineMultiplier - 1) * 10, 60) / 3.6;
        const maxReverseSpeed = 14 / 3.6;

        const currentFwdSpeed = this.getForwardSpeedMps();

        const baseEngineForce = 6500 * this.engineMultiplier;
        let forceMultiplier = 1;

        if (this.throttleState > 0.01) {
            if (currentFwdSpeed > maxForwardSpeed) forceMultiplier = 0;
        } else if (this.throttleState < -0.01) {
            if (currentFwdSpeed < -maxReverseSpeed) forceMultiplier = 0;
        }

        const appliedForce = baseEngineForce * this.throttleState * forceMultiplier;

        // === RWD: rear wheels are 2,3 ===
        this.vehicleController.setWheelEngineForce(0, 0);
        this.vehicleController.setWheelEngineForce(1, 0);
        this.vehicleController.setWheelEngineForce(2, appliedForce);
        this.vehicleController.setWheelEngineForce(3, appliedForce);

        // === Brakes: strong user brake, light engine braking when coasting ===
        if (input.brake) {
            for (let i = 0; i < 4; i++) this.vehicleController.setWheelBrake(i, 100.0);
        } else if (targetThrottle === 0 && Math.abs(currentFwdSpeed) > 0.3) {
            for (let i = 0; i < 4; i++) this.vehicleController.setWheelBrake(i, 2.0);
        } else {
            for (let i = 0; i < 4; i++) this.vehicleController.setWheelBrake(i, 0);
        }

        // === Speed-sensitive steering ===
        const speedAbs = Math.abs(currentFwdSpeed);
        const speedFactor = Math.max(0.25, 1 - speedAbs / 12);
        // TIER 6: Tyres upgrade gives a little more grip at speed.
        const maxSteerAngle = 0.55 * speedFactor * Math.min(1.35, this.tyreGrip || 1);
        let steerInput = 0;
        if (input.left) steerInput = 1;
        else if (input.right) steerInput = -1;

        this.currentSteerAngle = steerInput * maxSteerAngle;

        this.vehicleController.setWheelSteering(0, this.currentSteerAngle);
        this.vehicleController.setWheelSteering(1, this.currentSteerAngle);
        this.vehicleController.setWheelSteering(2, 0);
        this.vehicleController.setWheelSteering(3, 0);

        this.vehicleController.updateVehicle(deltaTime);
    }

    // Apply AFTER the solver: otherwise suspension/tyre impulses reintroduce
    // a small creep immediately after the assist zeroes the chassis velocity.
    applyStopAssist(input, dt) {
        const v = this.chassisBody.linvel();
        const speed = Math.hypot(v.x, v.z);
        let grounded = false;
        for (let i = 0; i < 4; i++) grounded ||= this.vehicleController.wheelIsInContact(i);
        if (!grounded) return;
        if (input.brake || (!input.forward && !input.backward)) {
            const next = Math.max(0, speed - (input.brake ? 7.5 : 5.5) * dt);
            const k = next < 2 / 3.6 ? 0 : next / Math.max(speed, 0.001);
            this.chassisBody.setLinvel({ x: v.x * k, y: v.y, z: v.z * k }, true);
            if (k === 0) {
                this.smoothedSpeed = 0;
                this.currentSpeed = 0;
            }
        } else {
            const forward = this._tempForward.set(0, 0, 1);
            const q = this.chassisBody.rotation();
            this._tempQuat.set(q.x, q.y, q.z, q.w);
            forward.applyQuaternion(this._tempQuat); forward.y = 0; forward.normalize();
            const signed = v.x * forward.x + v.z * forward.z;
            const capped = Math.max(-14 / 3.6, Math.min((32 + (this.engineMultiplier - 1) * 10) / 3.6, signed));
            if (capped !== signed) this.chassisBody.setLinvel({
                x: v.x + forward.x * (capped - signed), y: v.y,
                z: v.z + forward.z * (capped - signed)
            }, true);
        }
    }

    updateVisuals(audio, dt) {
        if(this.beaconRotor){this.beaconRotor.rotation.y+=dt*7;this.beaconMesh.material.emissiveIntensity=.8+1.5*Math.max(0,Math.cos(this.beaconRotor.rotation.y));}
        // === Safety check (before sync, so a reset is reflected this frame) ===
        const rotPre = this.chassisBody.rotation();
        const transPre = this.chassisBody.translation();

        if (transPre.y < -5) {
            this.resetToSafe();
        } else {
            this._tempQuat.set(rotPre.x, rotPre.y, rotPre.z, rotPre.w);
            this._tempUp.set(0, 1, 0).applyQuaternion(this._tempQuat);
            const upDot = this._tempUp.y;

            if (upDot < Math.cos(70 * Math.PI / 180)) {
                this.tipTimer += dt;
                if (this.tipTimer > 2.0) this.resetToSafe();
            } else {
                this.tipTimer = 0;
                if (upDot > Math.cos(25 * Math.PI / 180) && transPre.y > 0.1 && transPre.y < 3.0) {
                    this.lastSafePosition = { x: transPre.x, y: transPre.y, z: transPre.z };
                    this.lastSafeQuaternion = { x: rotPre.x, y: rotPre.y, z: rotPre.z, w: rotPre.w };
                }
            }
        }

        // === Sync mesh from physics ===
        const translation = this.chassisBody.translation(); const rotation = this.chassisBody.rotation();
        if (this._currPos) {
            const al = Math.max(0, Math.min(1, this.renderAlpha === undefined ? 1 : this.renderAlpha));
            this.mesh.position.lerpVectors(this._prevPos, this._currPos, al);
            this._interpQuat.copy(this._prevQuat).slerp(this._currQuat, al);
            this.mesh.quaternion.copy(this._interpQuat);
        } else {
            this.mesh.position.set(translation.x, translation.y, translation.z);
            this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }

        // === Wheels: suspension + spin + (front) steer ===
        for (let i = 0; i < this.wheelMeshes.length; i++) {
            const wheelData = this.wheelMeshes[i];
            const suspensionLength = this.vehicleController.wheelSuspensionLength(i);
            wheelData.group.position.y = wheelData.baseY - suspensionLength;
            wheelData.group.rotation.x = this.vehicleController.wheelRotation(i);
            if (i < 2) wheelData.group.rotation.y = this.currentSteerAngle;
        }

        // === Hydraulics ===
        if (this.mode === 'backhoe') {
            const hydraulicSpeed = 1 - Math.pow(1 - Math.min(0.25, 0.09 * this.hydraulicMultiplier), Math.min(dt, 0.05) * 60); this._autoStep(dt);
            this.boomPivot.rotation.x = THREE.MathUtils.lerp(this.boomPivot.rotation.x, this.targetBoomAngle, hydraulicSpeed);
            this.bucketPivot.rotation.x = THREE.MathUtils.lerp(this.bucketPivot.rotation.x, this.targetBucketAngle, hydraulicSpeed);
        }

        // === Smoothed speed (km/h) ===
        // Base cap: 32 km/h forward, 14 km/h reverse. Only Engine Power changes it.
        // The dial uses the SIGNED forward speed (lateral sliding must not inflate it)
        // and is clamped to the current cap, so a physics overshoot cannot show 35 at level 1.
        const capFwd = Math.min(32 + (this.engineMultiplier - 1) * 10, 60);
        const capRev = 14;
        const fwdKmh = this.getForwardSpeedMps() * 3.6;
        const shown = Math.min(Math.abs(fwdKmh), fwdKmh >= 0 ? capFwd : capRev);
        this.smoothedSpeed = this.smoothedSpeed * 0.85 + shown * 0.15;
        this.currentSpeed = Math.round(this.smoothedSpeed);
        // Signed value for the reverse beeper / engine sound (Audio.js uses Math.abs for rpm).
        this.signedSpeedKmh = fwdKmh;

        // exhaust smoke is counted by time (same at 60 and 144 fps): a little at idle, more when working
        // B8: light exhaust only while the throttle is actually held.
        this._smokePower = Math.min(1, Math.abs(this.throttleState));
        if (this._smokePower > 0.08) {
            this._smokeAcc += Math.min(dt, 0.05) * (2.5 + this._smokePower * 5);
            while (this._smokeAcc >= 1) { this._smokeAcc -= 1; this.spawnExhaust(); }
        } else this._smokeAcc = 0;
        if (this.currentSpeed > 18 && this.puffs.length < 12) {
            this._dustAcc += Math.min(dt, 0.05) * 2.5;
            while (this._dustAcc >= 1 && this.puffs.length < 12) { this._dustAcc -= 1; this.spawnTireDust(2); }
        } else this._dustAcc = 0;
        // TIER 8: body leans into a turn and squats under throttle. Wheels
        // stay on the ground (they are outside bodyGroup), no physics change.
        if (this.bodyGroup) {
            const k = 1 - Math.exp(-dt * 6);
            const rollTarget = -this.currentSteerAngle * Math.min(1, this.currentSpeed / 26) * 0.13;
            const pitchTarget = this.throttleState * 0.035;
            this._bodyRoll += (rollTarget - this._bodyRoll) * k;
            this._bodyPitch += (pitchTarget - this._bodyPitch) * k;
            this.bodyGroup.rotation.z = this._bodyRoll;
            this.bodyGroup.rotation.x = this._bodyPitch;
        }
        this.updateParticles(dt);
    }
}

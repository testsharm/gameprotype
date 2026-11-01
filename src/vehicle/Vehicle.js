import * as THREE from 'three';

export class Vehicle {
    constructor(scene, world, RAPIER) {
        this.scene = scene; this.world = world; this.RAPIER = RAPIER;
        this.mode = 'jcb'; this.hasDirt = false;
        
        this.armIsDown = false; this.bucketIsCurled = false;
        this.targetBoomAngle = -0.2; this.targetBucketAngle = 0.2;
        this.engineMultiplier = 1.0; this.hydraulicMultiplier = 1.0;

        this.particles = []; this.particlePool = []; this.particleGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        
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
            this.engineMultiplier = 1 + (saveData.engineLevel - 1) * 0.5;
            this.hydraulicMultiplier = 1 + (saveData.hydraulicLevel - 1) * 0.6;
        }
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
            { x: -0.9, y: -0.2, z: 1.2, r: 0.35 }, { x: 0.9, y: -0.2, z: 1.2, r: 0.35 }, 
            { x: -1.0, y: -0.1, z: -1.1, r: 0.55 }, { x: 1.0, y: -0.1, z: -1.1, r: 0.55 }  
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
        window.dispatchEvent(new CustomEvent('jcb-hint', { detail: msg }));
    }

    autoAction() {
        if (this._auto || window.__digBusy) return;
        const bp = new THREE.Vector3(); this.bucketPivot.getWorldPosition(bp);
        if (!this.hasDirt) {
            if (!this.pilePos || bp.distanceTo(this.pilePos) > 9) { this._hint('Drive the bucket over the dirt pile'); return; }
            window.dispatchEvent(new CustomEvent('jcb-dig', { detail: 'scoop' }));
        } else {
            if (!this.truckPos || bp.distanceTo(this.truckPos) > 8) { this._hint('Drive closer: bucket over the truck bed'); return; }
            window.dispatchEvent(new CustomEvent('jcb-dig', { detail: 'dump' }));
        }
    }

    _autoStep(dt) {
        const a = this._auto; if (!a) return;
        a.t += dt;
        if (a.type === 'scoop') {
            if (a.step === 0) { this.armIsDown = true; this.targetBoomAngle = 0.8; this.targetBucketAngle = -0.5; a.step = 1; a.t = 0; }
            else if (a.step === 1 && a.t > 0.55) { this.targetBucketAngle = 1.2; this.bucketIsCurled = true; a.step = 2; a.t = 0; }
            else if (a.step === 2 && a.t > 0.5) { this.scoopDirt(); this.spawnDirtBurst(); a.step = 3; a.t = 0; }
            else if (a.step === 3 && a.t > 0.3) { this.targetBoomAngle = -0.2; this.armIsDown = false; a.step = 4; a.t = 0; }
            else if (a.step === 4 && a.t > 0.6) { this._auto = null; }
        } else {
            if (a.step === 0) { this.targetBoomAngle = -0.2; this.targetBucketAngle = -0.9; a.step = 1; a.t = 0; }
            else if (a.step === 1 && a.t > 0.6) { if (this.hasDirt) { this.spawnDirtBurst(); this.dropDirt(); } a.step = 2; a.t = 0; }
            else if (a.step === 2 && a.t > 0.5) { this.targetBucketAngle = 0.2; this.targetBoomAngle = -0.2; this.bucketIsCurled = false; this.armIsDown = false; a.step = 3; a.t = 0; }
            else if (a.step === 3 && a.t > 0.5) { this._auto = null; }
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
        
        // Materials
        const catYellow = new THREE.MeshPhysicalMaterial({ color: 0xffb700, roughness: 0.22, metalness: 0.15, clearcoat: 1.0, clearcoatRoughness: 0.08 });
        const catYellowDark = new THREE.MeshPhysicalMaterial({ color: 0xb38200, roughness: 0.4, metalness: 0.15, clearcoat: 0.7 });
        const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8, metalness: 0.9 });
        const steel = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.95 });
        const brushedSteel = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.45, metalness: 1.0 });
        const wornSteel = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.7, metalness: 0.85 });
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x88ccff, transmission: 0.85, opacity: 0.95, transparent: true, roughness: 0.08, ior: 1.5, metalness: 0 });
        const tireRubber = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1.0 });
        const hoseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
        const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffaa, emissiveIntensity: 2.2 });
        const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 1.6 });
        const hazardYellow = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.55 });
        const hazardBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.55 });
        const beaconMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0 });

        const visualGroup = new THREE.Group(); visualGroup.position.y = -0.1; group.add(visualGroup);
        const jcbGroup = new THREE.Group(); visualGroup.add(jcbGroup);

        // Main chassis + darker panel edge
        const mainChassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 4.0), catYellow); mainChassis.position.y = 0.6; mainChassis.castShadow = true; mainChassis.receiveShadow = true; jcbGroup.add(mainChassis);
        const edgeGeo = new THREE.BoxGeometry(0.04, 0.7, 4.0);
        const edgeL = new THREE.Mesh(edgeGeo, catYellowDark); edgeL.position.set(-1.1, 0.6, 0); jcbGroup.add(edgeL);
        const edgeR = edgeL.clone(); edgeR.position.set(1.1, 0.6, 0); jcbGroup.add(edgeR);

        // Rounded hood: base + slope + bevel boxes
        const hoodBase = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 2.0), catYellow); hoodBase.position.set(0, 1.0, 1.0); hoodBase.castShadow = true; jcbGroup.add(hoodBase);
        const hoodSlope = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 1.2), catYellow); hoodSlope.position.set(0, 1.2, 1.8); hoodSlope.rotation.x = -0.3; hoodSlope.castShadow = true; jcbGroup.add(hoodSlope);
        const bevel1 = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.16, 0.42), catYellow); bevel1.position.set(0, 1.44, 1.35); bevel1.rotation.x = -0.15; jcbGroup.add(bevel1);
        const bevel2 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.5), catYellow); bevel2.position.set(0, 1.56, 1.85); bevel2.rotation.x = -0.3; jcbGroup.add(bevel2);

        const grille = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.1), darkMetal); grille.position.set(0, 0.8, 2.4); jcbGroup.add(grille);
        const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.4), darkMetal); bumper.position.set(0, 0.4, 2.5); jcbGroup.add(bumper);

        // Working headlights (emissive)
        const hlGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
        const hlL = new THREE.Mesh(hlGeo, headlightMat); hlL.position.set(-0.7, 1.1, 2.43); jcbGroup.add(hlL);
        const hlR = hlL.clone(); hlR.position.set(0.7, 1.1, 2.43); jcbGroup.add(hlR);

        // Counterweight + hazard stripes
        const counterweight = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.6), darkMetal); counterweight.position.set(0, 0.5, -2.1); counterweight.castShadow = true; jcbGroup.add(counterweight);
        for (let i = 0; i < 6; i++) {
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.02), i % 2 === 0 ? hazardYellow : hazardBlack);
            stripe.position.set(-0.92 + i * 0.36, 0.5, -2.42);
            stripe.rotation.z = 0.55;
            jcbGroup.add(stripe);
        }

        const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.1), taillightMat); tailL.position.set(-0.9, 0.6, -2.41); jcbGroup.add(tailL);
        const tailR = tailL.clone(); tailR.position.set(0.9, 0.6, -2.41); jcbGroup.add(tailR);

        // Rear fenders (larger wheels)
        const fenderGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.62, 16, 1, false, 0, Math.PI);
        const fenderL = new THREE.Mesh(fenderGeo, catYellow); fenderL.rotation.z = Math.PI / 2; fenderL.rotation.y = Math.PI / 2; fenderL.position.set(-1.0, 0.2, -1.1); fenderL.castShadow = true; jcbGroup.add(fenderL);
        const fenderR = fenderL.clone(); fenderR.position.set(1.0, 0.2, -1.1); jcbGroup.add(fenderR);

        // Front mudguards (smaller wheels)
        const frontMudGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.34, 12, 1, false, 0, Math.PI);
        const frontMudL = new THREE.Mesh(frontMudGeo, catYellowDark); frontMudL.rotation.z = Math.PI / 2; frontMudL.rotation.y = Math.PI / 2; frontMudL.position.set(-0.9, 0.15, 1.2); jcbGroup.add(frontMudL);
        const frontMudR = frontMudL.clone(); frontMudR.position.set(0.9, 0.15, 1.2); jcbGroup.add(frontMudR);

        // Cab + trim
        const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), catYellow); cab.position.set(0, 1.9, -0.6); cab.castShadow = true; jcbGroup.add(cab);
        const cabTrim = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.1, 1.62), catYellowDark); cabTrim.position.set(0, 1.12, -0.6); jcbGroup.add(cabTrim);

        // Glass
        const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 0.05), glassMat); frontGlass.position.set(0, 2.0, 0.21); jcbGroup.add(frontGlass);
        const sideGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 1.4), glassMat); sideGlassL.position.set(-0.81, 2.0, -0.6); jcbGroup.add(sideGlassL);
        const sideGlassR = sideGlassL.clone(); sideGlassR.position.set(0.81, 2.0, -0.6); jcbGroup.add(sideGlassR);

        // Interior
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), darkMetal); seat.position.set(0, 1.6, -0.8); jcbGroup.add(seat);
        const steering = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 16), darkMetal); steering.rotation.x = Math.PI / 3; steering.position.set(0, 2.0, 0.0); jcbGroup.add(steering);

        // ROPS
        const ropsGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8);
        const ropsL = new THREE.Mesh(ropsGeo, catYellow); ropsL.position.set(-0.8, 2.8, -1.3); jcbGroup.add(ropsL);
        const ropsR = ropsL.clone(); ropsR.position.set(0.8, 2.8, -1.3); jcbGroup.add(ropsR);
        const ropsTop = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6), catYellow); ropsTop.rotation.z = Math.PI/2; ropsTop.position.set(0, 3.6, -1.3); jcbGroup.add(ropsTop);
        const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.6), catYellow); cabRoof.position.set(0, 3.4, -0.6); jcbGroup.add(cabRoof);

        // Amber beacon on cab roof (blinking)
        const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 8), darkMetal); beaconBase.position.set(0, 3.49, -0.6); jcbGroup.add(beaconBase);
        const beaconMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 10), beaconMat); beaconMesh.position.set(0, 3.63, -0.6); jcbGroup.add(beaconMesh);
        this.beaconMesh = beaconMesh;
        const blinkLoop = () => {
            if (!this.beaconMesh) return;
            const t = performance.now() * 0.004;
            this.beaconMesh.material.emissiveIntensity = (Math.sin(t) > 0.3) ? 2.6 : 0.15;
            requestAnimationFrame(blinkLoop);
        };
        requestAnimationFrame(blinkLoop);

        // Exhaust + cap
        this.exhaustTip = new THREE.Object3D(); this.exhaustTip.position.set(0.8, 2.4, 0.6); jcbGroup.add(this.exhaustTip);
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4), darkMetal); pipe.position.set(0.8, 1.7, 0.6); jcbGroup.add(pipe);
        const exhaustCap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 10), steel); exhaustCap.position.set(0.8, 2.44, 0.6); jcbGroup.add(exhaustCap);

        // Mirrors
        const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.05), brushedSteel); mirrorL.position.set(-0.9, 2.4, 0.1); jcbGroup.add(mirrorL);
        const mirrorR = mirrorL.clone(); mirrorR.position.set(0.9, 2.4, 0.1); jcbGroup.add(mirrorR);

        // Steps + handrail
        const stepL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.25), steel); stepL.position.set(-0.85, 0.75, -0.6); jcbGroup.add(stepL);
        const stepR = stepL.clone(); stepR.position.set(0.85, 0.75, -0.6); jcbGroup.add(stepR);
        const railGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2);
        const railL = new THREE.Mesh(railGeo, steel); railL.position.set(-0.85, 1.8, 0.15); railL.rotation.z = 0.1; jcbGroup.add(railL);
        const railR = railL.clone(); railR.position.set(0.85, 1.8, 0.15); railR.rotation.z = -0.1; jcbGroup.add(railR);

        // Rear stabilizer legs
        const stabGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const stabL = new THREE.Mesh(stabGeo, steel); stabL.position.set(-0.9, 0.2, -1.8); stabL.rotation.x = 0.1; jcbGroup.add(stabL);
        const stabR = stabL.clone(); stabR.position.set(0.9, 0.2, -1.8); jcbGroup.add(stabR);
        const stabFootL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.35), darkMetal); stabFootL.position.set(-0.9, -0.2, -1.8); jcbGroup.add(stabFootL);
        const stabFootR = stabFootL.clone(); stabFootR.position.set(0.9, -0.2, -1.8); jcbGroup.add(stabFootR);

        // Boom pivot + arms
        this.boomPivot = new THREE.Group(); this.boomPivot.position.set(0, 1.0, 2.0); this.boomPivot.rotation.x = this.targetBoomAngle; jcbGroup.add(this.boomPivot);
        const armGeo = new THREE.BoxGeometry(0.25, 0.35, 3.0);
        const armL = new THREE.Mesh(armGeo, catYellow); armL.position.set(-0.8, 0, 1.2); armL.castShadow = true; this.boomPivot.add(armL);
        const armR = armL.clone(); armR.position.set(0.8, 0, 1.2); this.boomPivot.add(armR);

        // Brushed steel pistons
        const cylGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.8);
        const cylL = new THREE.Mesh(cylGeo, brushedSteel); cylL.rotation.x = Math.PI / 2; cylL.position.set(-0.8, 0.3, 1.0); this.boomPivot.add(cylL);
        const cylR = cylL.clone(); cylR.position.set(0.8, 0.3, 1.0); this.boomPivot.add(cylR);

        // Hydraulic hoses (thin dark cylinders along arm)
        const hoseGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5);
        const hoseL = new THREE.Mesh(hoseGeo, hoseMat); hoseL.rotation.x = Math.PI / 2; hoseL.position.set(-0.55, 0.15, 1.2); this.boomPivot.add(hoseL);
        const hoseR = hoseL.clone(); hoseR.position.set(0.55, 0.15, 1.2); this.boomPivot.add(hoseR);

        // Bucket pivot
        this.bucketPivot = new THREE.Group(); this.bucketPivot.position.set(0, -0.2, 2.8); this.bucketPivot.rotation.x = this.targetBucketAngle; this.boomPivot.add(this.bucketPivot);
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 0.4), brushedSteel); bracket.position.set(0, 0.4, -0.6); this.bucketPivot.add(bracket);
        const bBack1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 0.1), darkMetal); bBack1.position.set(0, 0.2, -0.6); bBack1.rotation.x = -0.3; this.bucketPivot.add(bBack1);
        const bBack2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 0.1), darkMetal); bBack2.position.set(0, 0.7, -0.4); bBack2.rotation.x = -0.8; this.bucketPivot.add(bBack2);
        const bFloor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.4), darkMetal); bFloor.position.set(0, -0.2, 0); this.bucketPivot.add(bFloor);
        const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.4), darkMetal); bLeft.position.set(-1.3, 0.2, 0); this.bucketPivot.add(bLeft);
        const bRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.4), darkMetal); bRight.position.set(1.3, 0.2, 0); this.bucketPivot.add(bRight);

        // Worn cutting edge + teeth
        const cuttingEdge = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.15, 0.2), wornSteel); cuttingEdge.position.set(0, -0.25, 0.7); this.bucketPivot.add(cuttingEdge);
        const toothGeo = new THREE.ConeGeometry(0.1, 0.4, 4); toothGeo.rotateX(Math.PI / 2);
        for(let i = 0; i < 6; i++) { const tooth = new THREE.Mesh(toothGeo, wornSteel); tooth.position.set(-1.1 + i * 0.44, -0.2, 0.85); this.bucketPivot.add(tooth); }

        // Bucket dirt (hidden until scooped)
        this.bucketDirtGroup = new THREE.Group(); this.bucketDirtGroup.position.set(0, 0.2, 0);
        const clodGeo = new THREE.DodecahedronGeometry(0.35, 0); const clodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 1.0 });
        for(let i = 0; i < 8; i++) { const clod = new THREE.Mesh(clodGeo, clodMat); clod.position.set((Math.random()-0.5)*2.0, (Math.random()-0.5)*0.4, (Math.random()-0.5)*1.0); clod.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0); clod.visible = false; this.bucketDirtGroup.add(clod); }
        this.bucketPivot.add(this.bucketDirtGroup);

        // Wheels with deep tread blocks
        this.wheelMeshes = [];
        const wheelData = [{ x: -0.9, y: -0.2, z: 1.2, r: 0.35, w: 0.3 }, { x: 0.9, y: -0.2, z: 1.2, r: 0.35, w: 0.3 }, { x: -1.0, y: -0.1, z: -1.1, r: 0.55, w: 0.5 }, { x: 1.0, y: -0.1, z: -1.1, r: 0.55, w: 0.5 }];
        wheelData.forEach((pos) => {
            const wheelGroup = new THREE.Group();
            const tire = new THREE.Mesh(new THREE.CylinderGeometry(pos.r, pos.r, pos.w, 24).rotateZ(Math.PI / 2), tireRubber); tire.castShadow = true; wheelGroup.add(tire);
            // Deep tread blocks: chunky torus rings around the tire
            const ringCount = pos.r > 0.4 ? 4 : 3;
            const ringTube = 0.09;
            const ringGeo = new THREE.TorusGeometry(pos.r - 0.02, ringTube, 5, 18);
            ringGeo.rotateY(Math.PI / 2);
            for (let i = 0; i < ringCount; i++) {
                const ring = new THREE.Mesh(ringGeo, tireRubber);
                ring.position.x = (i - (ringCount - 1) / 2) * (pos.w / ringCount);
                wheelGroup.add(ring);
            }
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(pos.r * 0.55, pos.r * 0.55, pos.w + 0.02, 10).rotateZ(Math.PI / 2), brushedSteel); wheelGroup.add(rim);
            // Hub cap
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, pos.w + 0.06, 8).rotateZ(Math.PI / 2), darkMetal);
            wheelGroup.add(hub);
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

    spawnExhaust() { const pos = new THREE.Vector3(); this.exhaustTip.getWorldPosition(pos); const vel = new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 2 + 1, (Math.random() - 0.5) * 1.5); this.spawnParticle(pos, vel, 0x333333, 0.6 + Math.random() * 0.4, 1.0); }
    spawnTireDust(wheelIndex) { const pos = new THREE.Vector3(); this.wheelMeshes[wheelIndex].group.getWorldPosition(pos); pos.y = 0.2; const vel = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2); this.spawnParticle(pos, vel, 0x8c7053, 0.5 + Math.random() * 0.5, 1.5); }
    spawnDirtBurst() { if (!this.hasDirt) return; const pos = new THREE.Vector3(); this.bucketPivot.getWorldPosition(pos); for (let i = 0; i < 15; i++) { const vel = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6); this.spawnParticle(pos, vel, 0x5c3a21, 0.8 + Math.random() * 0.4, 2.0); } }

    updateParticles(dt) {
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
        this.chassisBody.setRotation(this.lastSafeQuaternion, true);
        this.chassisBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        this.chassisBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        this.tipTimer = 0;
        this.throttleState = 0;
        this.smoothedSpeed = 0;
        this.currentSpeed = 0;
    }

    updateController(input, deltaTime) {
        if (input.forward || input.backward || input.left || input.right || input.brake) this.chassisBody.wakeUp();
        
        // === Throttle ramp ===
        const throttleRampRate = 1 / 0.35; // 0 -> full in 0.6s
        const targetThrottle = input.forward ? 1 : (input.backward ? -1 : 0);
        
        if (targetThrottle !== 0) {
            if (this.throttleState * targetThrottle < 0) this.throttleState = 0;
            const sign = Math.sign(targetThrottle - this.throttleState);
            this.throttleState += sign * throttleRampRate * deltaTime;
            if (Math.abs(this.throttleState) > 1) this.throttleState = Math.sign(this.throttleState);
        } else {
            const decay = 2.5 * deltaTime;
            if (Math.abs(this.throttleState) <= decay) this.throttleState = 0;
            else this.throttleState -= Math.sign(this.throttleState) * decay;
        }
        
        // === Governor (top speed caps) ===
        const maxForwardSpeed = Math.min(40 + (this.engineMultiplier - 1) * 10, 60) / 3.6;
        const maxReverseSpeed = Math.min(18 + (this.engineMultiplier - 1) * 5.0, 28) / 3.6;
        
        const currentFwdSpeed = this.getForwardSpeedMps();
        
        const baseEngineForce = 6500 * this.engineMultiplier;
        let forceMultiplier = 1;
        
        if (this.throttleState > 0.01) {
            if (currentFwdSpeed > maxForwardSpeed * 0.95) forceMultiplier = 0;
            else if (currentFwdSpeed > maxForwardSpeed * 0.85) forceMultiplier = 0.4;
        } else if (this.throttleState < -0.01) {
            if (currentFwdSpeed < -maxReverseSpeed * 0.95) forceMultiplier = 0;
            else if (currentFwdSpeed < -maxReverseSpeed * 0.85) forceMultiplier = 0.4;
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
        const maxSteerAngle = 0.55 * speedFactor;
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

    updateVisuals(audio, dt) {
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
        this.mesh.position.set(translation.x, translation.y, translation.z); this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        
        // === Wheels: suspension + spin + (front) steer ===
        for (let i = 0; i < this.wheelMeshes.length; i++) {
            const wheelData = this.wheelMeshes[i]; 
            const suspensionLength = this.vehicleController.wheelSuspensionLength(i);
            wheelData.group.position.y = wheelData.baseY - suspensionLength; 
            wheelData.group.rotation.x = this.vehicleController.wheelRotation(i);
            if (i < 2) wheelData.group.rotation.y = this.currentSteerAngle;
        }
        
        // === Hydraulics ===
        if (this.mode === 'jcb') {
            const hydraulicSpeed = Math.min(0.25, 0.09 * this.hydraulicMultiplier); this._autoStep(dt);
            this.boomPivot.rotation.x = THREE.MathUtils.lerp(this.boomPivot.rotation.x, this.targetBoomAngle, hydraulicSpeed);
            this.bucketPivot.rotation.x = THREE.MathUtils.lerp(this.bucketPivot.rotation.x, this.targetBucketAngle, hydraulicSpeed);
        }
        
        // === Smoothed speed (km/h) ===
        const vel = this.chassisBody.linvel();
        const speedKmh = Math.sqrt(vel.x * vel.x + vel.z * vel.z) * 3.6;
        this.smoothedSpeed = this.smoothedSpeed * 0.85 + speedKmh * 0.15;
        this.currentSpeed = Math.round(this.smoothedSpeed);
        
        if (this.currentSpeed > 5) {
            if (Math.random() < 0.3) this.spawnExhaust();
            if (Math.random() < 0.5) this.spawnTireDust(2); if (Math.random() < 0.5) this.spawnTireDust(3);
        }
        this.updateParticles(dt);
    }
}

import * as THREE from 'three';

// Cab camera settings (positions are local to the vehicle)
// B7: sit ABOVE and BEHIND the cab roof. Inside the cab the roof, seat and
// the yellow hood filled the screen with a black block. From up here the road,
// the arms and the bucket are all visible.
const CAB_EYE = new THREE.Vector3(0, 3.45, -3.25);
const CAB_LOOK = new THREE.Vector3(0, 1.25, 20);
const CAB_NEAR = 0.3;

export const CAMERA_MODES = ['chase', 'orbit', 'cab', 'bucket'];
export const CAMERA_LABELS = { chase: 'Chase', orbit: 'Orbit', cab: 'Cab', bucket: 'Bucket' };

// Third-person cameras stay BEHIND the machine (the loader arms are at local +Z).
// Portrait phones need a longer distance: their horizontal field of view is narrow.
const CHASE_OFFSET = new THREE.Vector3(0, 4.4, -11);
const BUCKET_FOCUS = new THREE.Vector3(0, 1.1, 2.0);
const BUCKET_OFFSET = new THREE.Vector3(0, 3.6, -17);
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 1.65;
const ZOOM_STEP = 0.12;

export class CameraManager {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.currentMode = 'orbit';
        this.onChange = null;          // set by main.js -> updates the HUD labels
        this.showcase = false;         // slow hero view for the start screen
        this._showT = 0;
        this._zoom = 1;
        this._distFactor = 1;

        this.spherical = new THREE.Spherical();
        this.spherical.radius = 18;
        this.spherical.phi = Math.PI / 2.35;
        this.spherical.theta = Math.PI;

        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };

        this.raycaster = new THREE.Raycaster();
        this.collidableMeshes = [];
        this.minDistance = 3.0;

        this.currentLookAt = new THREE.Vector3();

        // cab view helpers
        this._vehicle = null;
        this._hidden = [];
        this._cabReady = false;
        this._baseNear = 0.5;

        // reusable vectors (no new objects every frame)
        this._headPos = new THREE.Vector3();
        this._idealPos = new THREE.Vector3();
        this._offset = new THREE.Vector3();
        this._focus = new THREE.Vector3();
        this._rayDir = new THREE.Vector3();

        this.setupInputs();
        this.setMode('chase');
    }

    setCollidables(meshes) {
        this.collidableMeshes = meshes || [];
    }

    // TIER C/D: after a level teleport the chase camera used to spend ~4 s
    // flying across the map, showing an empty brown screen. Place it NOW.
    snapTo(vehicleMesh, pos) {
        if (!vehicleMesh) return;
        const p = pos || vehicleMesh.position;
        const zoom = this._zoom * this._distFactor;
        const offset = this._offset.copy(CHASE_OFFSET).multiplyScalar(zoom)
            .applyQuaternion(vehicleMesh.quaternion);
        this.camera.position.set(p.x, p.y, p.z).add(offset);
        this.currentLookAt.set(p.x, p.y + 2, p.z);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.currentLookAt);
    }

    setupInputs() {
        this.domElement.addEventListener('pointerdown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging || this.currentMode !== 'orbit' || this.showcase) return;
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;
            this.spherical.theta -= deltaX * 0.005;
            this.spherical.phi -= deltaY * 0.005;
            this.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 + 0.3, this.spherical.phi));
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        const stopDrag = () => { this.isDragging = false; };
        window.addEventListener('pointerup', stopDrag);
        window.addEventListener('pointercancel', stopDrag);
        window.addEventListener('blur', stopDrag);

        // The mouse wheel and the two visible Zoom buttons share ONE zoom value.
        this.domElement.addEventListener('wheel', (e) => {
            if (!this.canZoom()) return;
            e.preventDefault();
            this.zoomBy(e.deltaY < 0 ? -ZOOM_STEP : ZOOM_STEP);
        }, { passive: false });
    }

    // ---- zoom ---------------------------------------------------------------
    get zoom() { return this._zoom; }
    canZoom() { return this.currentMode !== 'cab' && !this.showcase; }
    setZoom(z) {
        if (!this.canZoom()) return;   // Cab view / menu showcase: buttons show disabled
        const n = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +z || 1));
        if (Math.abs(n - this._zoom) < 0.001) return;
        this._zoom = n;
        this._notify();
    }
    zoomBy(delta) { this.setZoom(this._zoom + delta); }
    zoomIn() { this.zoomBy(-ZOOM_STEP); }
    zoomOut() { this.zoomBy(ZOOM_STEP); }

    _notify() { try { if (this.onChange) this.onChange(this.currentMode, this._zoom, this.canZoom()); } catch (e) {} }

    // ---- mode ---------------------------------------------------------------
    setMode(mode) {
        if (CAMERA_MODES.indexOf(mode) < 0) return;
        if (this.currentMode === mode && this._modeSet) return;
        if (mode === 'orbit') {
            this.spherical.theta = Math.PI;
            this.spherical.phi = Math.PI / 2.35;
            this.spherical.radius = 18;
        }
        this.currentMode = mode;
        this._modeSet = true;
        this._notify();
    }
    cycleMode() {
        const i = CAMERA_MODES.indexOf(this.currentMode);
        this.setMode(CAMERA_MODES[(i + 1) % CAMERA_MODES.length]);
        return this.currentMode;
    }
    setShowcase(on) {
        this.showcase = !!on;
        if (on) this._showT = 0;
        this._notify();
    }

    // ---- Cab view: hide only the parts that Vehicle.js marked with userData.cabHide ----
    _prepareCab(root) {
        this._restoreCab();
        root.traverse((o) => {
            if (o.userData && o.userData.cabHide && o.visible) {
                o.visible = false;
                this._hidden.push(o);
            }
        });
        this._cabReady = true;
    }

    _restoreCab() {
        for (let i = 0; i < this._hidden.length; i++) this._hidden[i].visible = true;
        this._hidden.length = 0;
        this._cabReady = false;
    }

    update(vehicleMesh, deltaTime, currentSpeed) {
        if (!vehicleMesh) return;

        const dt = Math.min(Math.max(deltaTime || 0.016, 0.001), 0.1);
        const k = (rate) => 1 - Math.exp(-rate * dt);

        if (this._vehicle !== vehicleMesh) {
            this._restoreCab();
            this._vehicle = vehicleMesh;
        }

        const inCab = this.currentMode === 'cab' && !this.showcase;
        if (inCab && !this._cabReady) this._prepareCab(vehicleMesh);
        else if (!inCab && this._cabReady) this._restoreCab();

        if (!inCab && this.camera.near !== CAB_NEAR) this._baseNear = this.camera.near;
        const wantNear = inCab ? CAB_NEAR : this._baseNear;
        if (this.camera.near !== wantNear) {
            this.camera.near = wantNear;
            this.camera.updateProjectionMatrix();
        }

        const vehiclePos = vehicleMesh.position;
        const headPos = this._headPos.copy(vehiclePos);
        headPos.y += 2;

        // Portrait / narrow windows get a wider camera distance so the machine
        // and the road ahead stay visible instead of the bucket filling the screen.
        const aspect = Math.max(0.35, this.camera.aspect || 1.7);
        this._distFactor = Math.min(1.85, Math.max(1, 0.95 / aspect));
        const zoom = this._zoom * this._distFactor;

        // A little FOV widening at speed, but never so wide that a phone loses the road.
        const baseFov = aspect < 0.85 ? 65 : 70;
        const speedRatio = Math.min(Math.abs(currentSpeed || 0) / 40, 1);
        const targetFov = baseFov + speedRatio * 12;
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, k(3));
        this.camera.updateProjectionMatrix();

        const idealPos = this._idealPos;
        const offset = this._offset;

        if (this.showcase) {
            // A2: REAL 3D backhoe on a slow turntable, 12 s per turn.
            this._showT += dt * (Math.PI * 2 / 12);
            const r = 16 * this._distFactor;
            idealPos.set(
                vehiclePos.x + Math.sin(this._showT) * r,
                vehiclePos.y + 7.0,
                vehiclePos.z + Math.cos(this._showT) * r
            );
            this.camera.position.lerp(idealPos, k(2.6));
            // Shift the look-at sideways in CAMERA space so the machine sits
            // beside the centred 440 px card instead of hiding behind it.
            const dir = new THREE.Vector3().subVectors(this.camera.position, headPos).normalize();
            const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
            const look = headPos.clone().addScaledVector(right, 5.2);
            this.currentLookAt.lerp(look, k(3.2));
            this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.currentLookAt);
            return;
        }

        if (this.currentMode === 'orbit') {
            offset.setFromSpherical(this.spherical).multiplyScalar(zoom);
            idealPos.copy(headPos).add(offset);
            this.camera.position.lerp(idealPos, k(10));
            this.currentLookAt.lerp(headPos, k(13));
            this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.currentLookAt);

        } else if (this.currentMode === 'chase') {
            // Behind + above: see the whole machine and the area ahead of it.
            offset.copy(CHASE_OFFSET).multiplyScalar(zoom).applyQuaternion(vehicleMesh.quaternion);
            idealPos.copy(vehiclePos).add(offset);
            this.camera.position.lerp(idealPos, k(6.5));
            this.currentLookAt.lerp(headPos, k(10));
            this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.currentLookAt);

        } else if (this.currentMode === 'cab') {
            offset.copy(CAB_EYE).applyQuaternion(vehicleMesh.quaternion);
            this.camera.position.copy(vehiclePos).add(offset);
            const look = this._focus.copy(CAB_LOOK).applyQuaternion(vehicleMesh.quaternion).add(vehiclePos);
            this.camera.lookAt(look);
            this.currentLookAt.copy(look);

        } else if (this.currentMode === 'bucket') {
            // Lower and further back than before: the arms no longer cover a tall phone.
            const focus = this._focus.copy(BUCKET_FOCUS).applyQuaternion(vehicleMesh.quaternion).add(vehiclePos);
            offset.copy(BUCKET_OFFSET).multiplyScalar(zoom).applyQuaternion(vehicleMesh.quaternion);
            idealPos.copy(focus).add(offset);
            this.camera.position.lerp(idealPos, k(6.5));
            this.currentLookAt.lerp(focus, k(13));
            this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.currentLookAt);
        }

        // building / tree collision (works only if meshes were given with setCollidables)
        if (!inCab && this.collidableMeshes.length > 0) {
            const rayDir = this._rayDir.copy(this.camera.position).sub(headPos);
            const distance = rayDir.length();
            if (distance > 0.001) {
                rayDir.normalize();
                this.raycaster.set(headPos, rayDir);
                this.raycaster.far = distance;
                const intersects = this.raycaster.intersectObjects(this.collidableMeshes, true);
                if (intersects.length > 0) {
                    const hitDist = intersects[0].distance;
                    if (hitDist < distance) {
                        const safeDist = Math.max(0.5, hitDist - 0.8);
                        this.camera.position.copy(headPos).add(rayDir.multiplyScalar(safeDist));
                    }
                }
            }
        }
    }
}

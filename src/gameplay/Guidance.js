import * as THREE from 'three';

// Guidance = ONE ground target ring + a painted chevron path on the first
// tutorial load. The weak floating screen-space arrow was removed: it hid the
// road and never pointed at anything useful on a tall phone.
// All markings are painted into a canvas texture (no flickering thin geometry).

function chevronTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 128, 128);
    g.lineWidth = 15;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(251,191,36,0.92)';
    g.beginPath();
    g.moveTo(20, 86); g.lineTo(64, 42); g.lineTo(108, 86);
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    return t;
}

export default class Guidance {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this._target = null;
        this._visible = true;
        this._ringGeo = new THREE.RingGeometry(0.55, 0.85, 40);
        this._ringMat = new THREE.MeshBasicMaterial({
            color: 0xffb84a, transparent: true, opacity: 0.75,
            blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
        });
        this._ring = new THREE.Mesh(this._ringGeo, this._ringMat);
        this._ring.rotation.x = -Math.PI / 2;
        this._ring.visible = false;
        this.scene.add(this._ring);

        // TIER 5: a soft bobbing chevron above the glowing ground ring.
        this._float = new THREE.Group();
        this._floatMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true,
            opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, fog: false });
        const shape = new THREE.Shape();
        shape.moveTo(-1, 0.22); shape.lineTo(0, -0.22); shape.lineTo(1, 0.22);
        shape.lineTo(1, 0.02); shape.lineTo(0, -0.42); shape.lineTo(-1, 0.02); shape.closePath();
        const v = new THREE.Mesh(new THREE.ShapeGeometry(shape), this._floatMat);
        v.rotation.x = -0.35;
        this._float.add(v);
        this._float.visible = false;
        this.scene.add(this._float);
        this._nearFade = 0;

        this._pulseTime = 0;
        this._chevrons = null;
        this._chevMat = null;
        this._chevFade = -1;

        this._steps = [
            'Drive to the highlighted dirt pile',
            'Lower the arm and press F to scoop',
            'Drive to the blue truck and press F to dump'
        ];
        this._stepIndex = -1;
        this._cardActive = false;
        this._tutKey = 'jobguidance_tutorial_done';
    }

    setTarget(target) {
        if (target) {
            this._target = target.clone();
            this._ring.position.copy(this._target);
            this._ring.position.y += 0.06;
            this._ring.visible = this._visible;
        } else {
            this._target = null;
            this._ring.visible = false;
            this._float.visible = false;
        }
    }

    // Settings -> Guide arrows. Hides the ring and the painted chevrons.
    setVisible(on) {
        this._visible = on !== false;
        if (this._ring) this._ring.visible = this._visible && !!this._target;
        if (this._chevrons) this._chevrons.group.visible = this._visible;
        if (!this._visible && this._float) this._float.visible = false;
        return this._visible;
    }
    isVisible() { return this._visible; }

    // Painted ground chevrons from the start pose to the first pile (Level 1 only).
    setChevrons(from, to) {
        this._clearChevrons();
        if (!from || !to) return;
        const dx = to.x - from.x, dz = to.z - from.z;
        const len = Math.hypot(dx, dz);
        if (len < 4 || len > 90) return;
        const tex = chevronTexture();
        tex.repeat.set(1, Math.max(2, Math.round(len / 3.2)));
        this._chevMat = new THREE.MeshBasicMaterial({
            map: tex, transparent: true, opacity: 0.85, depthWrite: false,
            side: THREE.DoubleSide, polygonOffset: true,
            polygonOffsetFactor: -5, polygonOffsetUnits: -5
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(5, len), this._chevMat);
        plane.rotation.x = -Math.PI / 2;
        plane.renderOrder = 3;
        const group = new THREE.Group();
        // local -Z (the chevron tip) must point from the machine towards the pile
        group.rotation.y = Math.atan2(-dx, -dz);
        group.position.set((from.x + to.x) / 2, 0.09, (from.z + to.z) / 2);
        group.add(plane);
        this.scene.add(group);
        this._chevrons = { group: group, geometry: plane.geometry, material: this._chevMat, map: tex };
        this._chevFade = -1;
    }

    onFirstLoad() {
        if (this._chevrons) this._chevFade = 1;
    }

    _clearChevrons() {
        if (this._chevrons) {
            this.scene.remove(this._chevrons.group);
            this._chevrons.geometry.dispose();
            if (this._chevrons.map) this._chevrons.map.dispose();
            this._chevrons.material.dispose();
        }
        this._chevrons = null;
        this._chevMat = null;
        this._chevFade = -1;
    }

    // Tutorial steps go through the HUD hint + toast system (GameUI listens for 'tf-tutorial').
    startTutorial() {
        let done = false;
        try { done = localStorage.getItem(this._tutKey) === '1'; } catch (e) { done = false; }
        if (done) return;
        this._stepIndex = 0;
        this._cardActive = true;
        this._emitStep();
    }

    _emitStep() {
        if (this._stepIndex < 0 || this._stepIndex >= this._steps.length) { this._endTutorial(); return; }
        try {
            window.dispatchEvent(new CustomEvent('tf-tutorial', {
                detail: { text: this._steps[this._stepIndex], step: this._stepIndex + 1, total: this._steps.length }
            }));
        } catch (e) { /* browser restriction */ }
    }

    nextTutorialStep() {
        if (!this._cardActive) return;
        this._stepIndex++;
        if (this._stepIndex >= this._steps.length) this._endTutorial();
        else this._emitStep();
    }

    _endTutorial() {
        this._cardActive = false;
        this._stepIndex = -1;
        try { localStorage.setItem(this._tutKey, '1'); } catch (e) { /* ignore */ }
    }

    // playerPos lets the ring / beam / chevron fade out near the goal.
    update(dt, playerPos) {
        if (dt <= 0) return;
        if (this._target && this._ring.visible) {
            this._pulseTime += dt;
            const pulse = 0.5 + 0.5 * Math.sin(this._pulseTime * 3.2);
            const s = 1 + pulse * 0.18;
            this._ring.scale.set(s, s, s);
            this._ringMat.opacity = 0.35 + pulse * 0.5;
            const d = playerPos ? Math.hypot(playerPos.x - this._target.x, playerPos.z - this._target.z) : 40;
            this._nearFade = Math.max(0, Math.min(1, (d - 7) / 24));
            this._float.visible = this._visible && this._nearFade > 0.03;
            this._float.position.set(this._target.x, 3.1 + Math.sin(this._pulseTime * 2.4) * 0.35, this._target.z);
            this._floatMat.opacity = 0.9 * this._nearFade;
        } else { this._float.visible = false; this._nearFade = 0; }
        if (this._chevrons && this._chevFade >= 0) {
            this._chevFade = Math.max(0, this._chevFade - dt / 1.4);
            this._chevMat.opacity = 0.85 * this._chevFade;
            if (this._chevFade <= 0) this._clearChevrons();
        }
    }
    nearFade() { return this._nearFade; }

    reset() {
        this._target = null;
        if (this._ring) this._ring.visible = false;
        if (this._float) this._float.visible = false;
        this._nearFade = 0;
        this._pulseTime = 0;
        this._clearChevrons();
        this._cardActive = false;
        this._stepIndex = -1;
    }
}

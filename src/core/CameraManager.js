import * as THREE from 'three';

export class CameraManager {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.currentMode = 'orbit';

        this.spherical = new THREE.Spherical();
        this.spherical.radius = 14;
        this.spherical.phi = Math.PI / 2.2; 
        this.spherical.theta = Math.PI;    

        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };

        this.raycaster = new THREE.Raycaster();
        this.collidableMeshes = [];
        this.minDistance = 3.0; 

        this.currentLookAt = new THREE.Vector3();

        this.setupInputs();
    }

    setCollidables(meshes) {
        this.collidableMeshes = meshes;
    }

    setupInputs() {
        this.domElement.addEventListener('pointerdown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging || this.currentMode !== 'orbit') return;
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            this.spherical.theta -= deltaX * 0.005;
            this.spherical.phi -= deltaY * 0.005;

            this.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 + 0.3, this.spherical.phi));
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('pointerup', () => {
            this.isDragging = false;
        });

        this.domElement.addEventListener('wheel', (e) => {
            if (this.currentMode !== 'orbit') return;
            this.spherical.radius += e.deltaY * 0.02;
            this.spherical.radius = Math.max(8, Math.min(60, this.spherical.radius));
        }, { passive: true });
        
        document.querySelectorAll('.cam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.setMode(mode);
                document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    setMode(mode) {
        if (this.currentMode === mode) return;
        
        if (mode === 'orbit') {
            this.spherical.theta = Math.PI;
            this.spherical.phi = Math.PI / 2.2;
            this.spherical.radius = 14;
        }
        this.currentMode = mode;
    }

    update(vehicleMesh, deltaTime, currentSpeed) {
        if (!vehicleMesh) return;
        const vehiclePos = vehicleMesh.position;
        const headPos = vehiclePos.clone().add(new THREE.Vector3(0, 2, 0)); 

        const baseFov = 70;
        const maxFovBonus = 15;
        const speedRatio = Math.min(currentSpeed / 100, 1); 
        const targetFov = baseFov + (speedRatio * maxFovBonus);
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.05);
        this.camera.updateProjectionMatrix();

        let idealPos = new THREE.Vector3();

        if (this.currentMode === 'orbit') {
            const idealOffset = new THREE.Vector3().setFromSpherical(this.spherical);
            idealPos = headPos.clone().add(idealOffset);
            
            this.camera.position.lerp(idealPos, 0.15);
            this.currentLookAt.lerp(headPos, 0.2);
            this.camera.lookAt(this.currentLookAt);

        } else if (this.currentMode === 'chase') {
            const idealOffset = new THREE.Vector3(0, 4, 9);
            idealOffset.applyQuaternion(vehicleMesh.quaternion);
            idealPos = vehiclePos.clone().add(idealOffset);
            
            this.camera.position.lerp(idealPos, 0.1);
            this.currentLookAt.lerp(headPos, 0.15);
            this.camera.lookAt(this.currentLookAt);

        } else if (this.currentMode === 'cab') {
            // FIX: Raised and pushed back to see over the hood and bucket
            const idealOffset = new THREE.Vector3(0, 2.4, -0.2);
            idealOffset.applyQuaternion(vehicleMesh.quaternion);
            idealPos = vehiclePos.clone().add(idealOffset);
            this.camera.position.copy(idealPos);
            
            // Look further down the road
            const lookAtPos = new THREE.Vector3(0, 1.5, 20);
            lookAtPos.applyQuaternion(vehicleMesh.quaternion);
            this.camera.lookAt(lookAtPos.add(vehiclePos));

        } else if (this.currentMode === 'bucket') {
            const bucketOffset = new THREE.Vector3(0, 1, 4);
            bucketOffset.applyQuaternion(vehicleMesh.quaternion);
            const bucketFocus = vehiclePos.clone().add(bucketOffset);

            const idealOffset = new THREE.Vector3(0, 5, -12); 
            idealOffset.applyQuaternion(vehicleMesh.quaternion);
            idealPos = bucketFocus.clone().add(idealOffset);
            
            this.camera.position.lerp(idealPos, 0.1);
            this.currentLookAt.lerp(bucketFocus, 0.2);
            this.camera.lookAt(this.currentLookAt);
        }

        if (this.currentMode !== 'cab') {
            const rayDir = this.camera.position.clone().sub(headPos);
            const distance = rayDir.length();
            rayDir.normalize();

            this.raycaster.set(headPos, rayDir);
            this.raycaster.far = distance; 
            
            const intersects = this.raycaster.intersectObjects(this.collidableMeshes, false);

            if (intersects.length > 0) {
                const hitDist = intersects[0].distance;
                if (hitDist < distance) {
                    const safeDist = Math.max(this.minDistance, hitDist - 0.5);
                    this.camera.position.copy(headPos).add(rayDir.multiplyScalar(safeDist));
                }
            }
        }
    }
}

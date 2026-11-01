import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.buildingData = []; 
        this.buildingMeshes = []; 
        this.treeMeshes = []; 
        this.dirtPileGroup = null; 
        this.allDirtClods = [];
        this.trafficCars = [];
        this.truckDirtLevel = 0;
        this.truckDirtMeshes = [];
        
        this.createLighting();
        this.createTerrain();
        this.generateCityGrid();
        this.createCentralGarageHub();
        this.createJobSite();
        this.createOptimizedTraffic();
        this.createProps();
        this.startTrafficAI(); 
    }

    createLighting() {
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
        this.sunLight.position.set(100, 200, 100);
        this.sunLight.castShadow = true;
        
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -150;
        this.sunLight.shadow.camera.right = 150;
        this.sunLight.shadow.camera.top = 150;
        this.sunLight.shadow.camera.bottom = -150;
        this.sunLight.shadow.bias = -0.0005;
        this.scene.add(this.sunLight);

        const skyGeo = new THREE.SphereGeometry(1500, 32, 16);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x4a80b8) },
                bottomColor: { value: new THREE.Color(0xdfe9f3) },
                sunColor: { value: new THREE.Color(0xfff2cc) },
                sunDirection: { value: new THREE.Vector3(100, 200, 100).normalize() },
                exponent: { value: 0.7 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform vec3 sunColor;
                uniform vec3 sunDirection;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    vec3 dir = normalize(vWorldPosition);
                    float h = max(dir.y, 0.0);
                    vec3 sky = mix(bottomColor, topColor, pow(h, exponent));
                    float sunDot = max(dot(dir, normalize(sunDirection)), 0.0);
                    float disc = smoothstep(0.9992, 0.9997, sunDot);
                    float glow = pow(sunDot, 120.0) * 0.5;
                    sky += sunColor * (disc * 3.0 + glow);
                    gl_FragColor = vec4(sky, 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false,
            fog: false
        });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        sky.frustumCulled = false;
        this.scene.add(sky);

        this.scene.fog = new THREE.Fog(0xdfe9f3, 200, 1200);
    }

    createTerrain() {
        // Subtle canvas noise texture
        const noiseCanvas = document.createElement('canvas');
        noiseCanvas.width = 256;
        noiseCanvas.height = 256;
        const nctx = noiseCanvas.getContext('2d');
        const nimg = nctx.createImageData(256, 256);
        for (let i = 0; i < nimg.data.length; i += 4) {
            const v = 200 + Math.floor(Math.random() * 55);
            nimg.data[i] = v;
            nimg.data[i + 1] = v;
            nimg.data[i + 2] = v;
            nimg.data[i + 3] = 255;
        }
        nctx.putImageData(nimg, 0, 0);
        const noiseTex = new THREE.CanvasTexture(noiseCanvas);
        noiseTex.wrapS = THREE.RepeatWrapping;
        noiseTex.wrapT = THREE.RepeatWrapping;
        noiseTex.repeat.set(120, 120);
        noiseTex.anisotropy = 4;

        const groundGeo = new THREE.PlaneGeometry(2000, 2000, 128, 128);
        const pos = groundGeo.attributes.position;
        const colors = [];
        const c = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const n = Math.sin(x * 0.03) * Math.cos(y * 0.04)
                    + Math.sin(x * 0.11 + y * 0.07) * 0.5
                    + Math.sin(x * 0.21) * 0.25;
            const t = THREE.MathUtils.clamp((n + 1.75) / 3.5, 0, 1);
            // Natural dark green and olive tones, varied by position
            c.setHSL(0.24 + t * 0.06, 0.35 + t * 0.15, 0.12 + t * 0.08);
            colors.push(c.r, c.g, c.b);
        }
        groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1.0, map: noiseTex });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createRoads() {
        const roadWidth = 24;
        const roadLength = 2000;
        const roadPositions = [-240, -160, -80, 80, 160, 240];

        const roadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        const roadVGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
        const roadHGeo = new THREE.PlaneGeometry(roadLength, roadWidth);

        roadPositions.forEach(offset => {
            const roadV = new THREE.Mesh(roadVGeo, roadMat);
            roadV.rotation.x = -Math.PI / 2;
            roadV.position.set(offset, 0.020, 0);
            roadV.receiveShadow = true;
            this.scene.add(roadV);

            const roadH = new THREE.Mesh(roadHGeo, roadMat);
            roadH.rotation.x = -Math.PI / 2;
            roadH.position.set(0, 0.021, offset);
            roadH.receiveShadow = true;
            this.scene.add(roadH);
        });

        const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const edgeGeoV = new THREE.PlaneGeometry(0.35, roadLength);
        const edgeGeoH = new THREE.PlaneGeometry(roadLength, 0.35);
        roadPositions.forEach(offset => {
            const e1 = new THREE.Mesh(edgeGeoV, edgeMat);
            e1.rotation.x = -Math.PI / 2;
            e1.position.set(offset - roadWidth / 2 + 1, 0.030, 0);
            this.scene.add(e1);

            const e2 = new THREE.Mesh(edgeGeoV, edgeMat);
            e2.rotation.x = -Math.PI / 2;
            e2.position.set(offset + roadWidth / 2 - 1, 0.030, 0);
            this.scene.add(e2);

            const e3 = new THREE.Mesh(edgeGeoH, edgeMat);
            e3.rotation.x = -Math.PI / 2;
            e3.position.set(0, 0.031, offset - roadWidth / 2 + 1);
            this.scene.add(e3);

            const e4 = new THREE.Mesh(edgeGeoH, edgeMat);
            e4.rotation.x = -Math.PI / 2;
            e4.position.set(0, 0.031, offset + roadWidth / 2 - 1);
            this.scene.add(e4);
        });

        const dashMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const dashPosV = [];
        const dashPosH = [];
        roadPositions.forEach(offset => {
            for (let j = -990; j <= 990; j += 12) {
                if (roadPositions.some(p => Math.abs(j - p) < 18)) continue;
                dashPosV.push({ x: offset, z: j });
                dashPosH.push({ x: j, z: offset });
            }
        });

        const dummy = new THREE.Object3D();

        const dashGeoV = new THREE.PlaneGeometry(0.4, 5);
        const dashMeshV = new THREE.InstancedMesh(dashGeoV, dashMat, dashPosV.length);
        dashPosV.forEach((d, i) => {
            dummy.position.set(d.x, 0.035, d.z);
            dummy.rotation.set(-Math.PI / 2, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            dashMeshV.setMatrixAt(i, dummy.matrix);
        });
        this.scene.add(dashMeshV);

        const dashGeoH = new THREE.PlaneGeometry(5, 0.4);
        const dashMeshH = new THREE.InstancedMesh(dashGeoH, dashMat, dashPosH.length);
        dashPosH.forEach((d, i) => {
            dummy.position.set(d.x, 0.035, d.z);
            dummy.rotation.set(-Math.PI / 2, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            dashMeshH.setMatrixAt(i, dummy.matrix);
        });
        this.scene.add(dashMeshH);

        const cwX = [];
        const cwZ = [];
        roadPositions.forEach(ix => {
            roadPositions.forEach(iz => {
                for (let k = 0; k < 4; k++) {
                    cwX.push({ x: ix, z: iz + 13 + k * 0.9 });
                    cwX.push({ x: ix, z: iz - 13 - k * 0.9 });
                    cwZ.push({ x: ix + 13 + k * 0.9, z: iz });
                    cwZ.push({ x: ix - 13 - k * 0.9, z: iz });
                }
            });
        });

        const cwMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const cwGeoX = new THREE.PlaneGeometry(24, 0.5);
        const cwMeshX = new THREE.InstancedMesh(cwGeoX, cwMat, cwX.length);
        cwX.forEach((d, i) => {
            dummy.position.set(d.x, 0.040, d.z);
            dummy.rotation.set(-Math.PI / 2, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            cwMeshX.setMatrixAt(i, dummy.matrix);
        });
        this.scene.add(cwMeshX);

        const cwGeoZ = new THREE.PlaneGeometry(0.5, 24);
        const cwMeshZ = new THREE.InstancedMesh(cwGeoZ, cwMat, cwZ.length);
        cwZ.forEach((d, i) => {
            dummy.position.set(d.x, 0.040, d.z);
            dummy.rotation.set(-Math.PI / 2, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            cwMeshZ.setMatrixAt(i, dummy.matrix);
        });
        this.scene.add(cwMeshZ);

        const barrierMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8 });
        const barrierSpecs = [
            { x: 0, z: -998, w: 2000, d: 2 },
            { x: 0, z: 998, w: 2000, d: 2 },
            { x: -998, z: 0, w: 2, d: 2000 },
            { x: 998, z: 0, w: 2, d: 2000 }
        ];
        barrierSpecs.forEach(s => {
            const b = new THREE.Mesh(new THREE.BoxGeometry(s.w, 1.0, s.d), barrierMat);
            b.position.set(s.x, 0.5, s.z);
            b.castShadow = true;
            b.receiveShadow = true;
            this.scene.add(b);
        });
    }

    generateCityGrid() {
        this.createRoads();

        const roadCenters = [-240, -160, -80, 80, 160, 240];
        const roadHalf = 12;
        const intervals = [];
        for (let i = 0; i < roadCenters.length - 1; i++) {
            const left = roadCenters[i] + roadHalf;
            const right = roadCenters[i + 1] - roadHalf;
            intervals.push({ min: left, max: right, center: (left + right) / 2, size: right - left });
        }

        const blocks = [];
        intervals.forEach(xInt => {
            intervals.forEach(zInt => {
                if (Math.abs(xInt.center) < 1 && Math.abs(zInt.center) < 1) return;
                if (Math.abs(xInt.center) < 1 && Math.abs(zInt.center + 120) < 1) return;
                blocks.push({
                    x: xInt.center,
                    z: zInt.center,
                    w: xInt.size,
                    d: zInt.size
                });
            });
        });

        const sidewalkGeo = new THREE.BoxGeometry(1, 1, 1);
        const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
        const sidewalkMesh = new THREE.InstancedMesh(sidewalkGeo, sidewalkMat, blocks.length);
        const dummy = new THREE.Object3D();
        blocks.forEach((block, i) => {
            dummy.position.set(block.x, 0.1, block.z);
            dummy.scale.set(block.w, 0.2, block.d);
            dummy.updateMatrix();
            sidewalkMesh.setMatrixAt(i, dummy.matrix);
        });
        sidewalkMesh.receiveShadow = true;
        this.scene.add(sidewalkMesh);

        const palettes = [0x8a7a6a, 0x7a8a7a, 0x6a7a8a, 0x8a6a7a, 0x7a7a6a, 0x6a6a7a];
        const awningColors = [0xb33a3a, 0x3a7ab3, 0x3ab36a, 0xb3a03a, 0x7a3ab3, 0xb36a3a];

        const textureCache = {};
        const getTexture = (variant, density) => {
            const key = `${variant}_${density}`;
            if (!textureCache[key]) {
                textureCache[key] = this.createWindowTexture(variant, density);
            }
            return textureCache[key];
        };

        const instancedData = {};
        const addInstance = (key, matrix, color) => {
            if (!instancedData[key]) instancedData[key] = { matrices: [], colors: [] };
            instancedData[key].matrices.push(matrix);
            instancedData[key].colors.push(color);
        };

        const acMatrices = [];
        const tankMatrices = [];
        const antennaMatrices = [];
        const awningData = { matrices: [], colors: [] };

        const addBoxInstance = (key, x, y, z, w, h, d, color) => {
            dummy.position.set(x, y, z);
            dummy.scale.set(w, h, d);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            addInstance(key, dummy.matrix.clone(), color);
        };

        blocks.forEach(block => {
            const lotsX = 2;
            const lotsZ = 2;
            const margin = 4;
            const innerW = block.w - margin * 2;
            const innerD = block.d - margin * 2;
            const lotW = innerW / lotsX;
            const lotD = innerD / lotsZ;

            for (let ix = 0; ix < lotsX; ix++) {
                for (let iz = 0; iz < lotsZ; iz++) {
                    if (Math.random() < 0.2) continue;

                    const lotCenterX = block.x - innerW / 2 + lotW * (ix + 0.5);
                    const lotCenterZ = block.z - innerD / 2 + lotD * (iz + 0.5);

                    const maxFootprint = Math.min(lotW, lotD) - 4;
                    const w = maxFootprint * (0.7 + Math.random() * 0.3);
                    const d = maxFootprint * (0.7 + Math.random() * 0.3);
                    const bx = lotCenterX + (Math.random() - 0.5) * (lotW - w - 2);
                    const bz = lotCenterZ + (Math.random() - 0.5) * (lotD - d - 2);

                    const typeRoll = Math.random();
                    let type, totalH, baseH, upperH = 0, upperW = 0, upperD = 0;
                    let density, variant;
                    const palette = palettes[Math.floor(Math.random() * palettes.length)];

                    if (typeRoll < 0.4) {
                        type = 'shop';
                        totalH = 8 + Math.random() * 7;
                        baseH = totalH;
                        density = 4;
                        variant = Math.floor(Math.random() * 4);
                    } else if (typeRoll < 0.85) {
                        type = 'mid';
                        totalH = 25 + Math.random() * 25;
                        baseH = totalH * 0.6;
                        upperH = totalH * 0.4;
                        upperW = w * 0.7;
                        upperD = d * 0.7;
                        density = 8;
                        variant = Math.floor(Math.random() * 4);
                    } else {
                        type = 'tower';
                        totalH = 60 + Math.random() * 30;
                        baseH = totalH * 0.55;
                        upperH = totalH * 0.45;
                        upperW = w * 0.65;
                        upperD = d * 0.65;
                        density = 12;
                        variant = Math.floor(Math.random() * 4);
                    }

                    const key = `${variant}_${density}`;
                    const baseY = 0.2 + baseH / 2;
                    addBoxInstance(key, bx, baseY, bz, w, baseH, d, new THREE.Color(palette));

                    this.buildingData.push({ x: bx, y: baseY, z: bz, w: w, h: baseH, d: d });

                    if (upperH > 0) {
                        const upperY = 0.2 + baseH + upperH / 2;
                        addBoxInstance(key, bx, upperY, bz, upperW, upperH, upperD, new THREE.Color(palette));
                        this.buildingData.push({ x: bx, y: upperY, z: bz, w: upperW, h: upperH, d: upperD });
                    }

                    const topY = 0.2 + totalH;

                    const acCount = 1 + Math.floor(Math.random() * 3);
                    for (let a = 0; a < acCount; a++) {
                        const acW = 1.5 + Math.random() * 1.5;
                        const acH = 0.8 + Math.random() * 0.8;
                        const acD = 1.5 + Math.random() * 1.5;
                        const acX = bx + (Math.random() - 0.5) * (w * 0.6);
                        const acZ = bz + (Math.random() - 0.5) * (d * 0.6);
                        const acY = topY + acH / 2;
                        dummy.position.set(acX, acY, acZ);
                        dummy.scale.set(acW, acH, acD);
                        dummy.rotation.set(0, 0, 0);
                        dummy.updateMatrix();
                        acMatrices.push(dummy.matrix.clone());
                    }

                    if (Math.random() < 0.3) {
                        const tankR = 1.2 + Math.random() * 0.8;
                        const tankH = 1.5 + Math.random() * 1.0;
                        const tankX = bx + (Math.random() - 0.5) * (w * 0.4);
                        const tankZ = bz + (Math.random() - 0.5) * (d * 0.4);
                        const tankY = topY + tankH / 2;
                        dummy.position.set(tankX, tankY, tankZ);
                        dummy.scale.set(tankR, tankH, tankR);
                        dummy.rotation.set(0, 0, 0);
                        dummy.updateMatrix();
                        tankMatrices.push(dummy.matrix.clone());
                    }

                    if (Math.random() < 0.2) {
                        const antH = 2 + Math.random() * 3;
                        const antX = bx + (Math.random() - 0.5) * (w * 0.3);
                        const antZ = bz + (Math.random() - 0.5) * (d * 0.3);
                        const antY = topY + antH / 2;
                        dummy.position.set(antX, antY, antZ);
                        dummy.scale.set(0.15, antH, 0.15);
                        dummy.rotation.set(0, 0, 0);
                        dummy.updateMatrix();
                        antennaMatrices.push(dummy.matrix.clone());
                    }

                    if (type === 'shop') {
                        const side = Math.floor(Math.random() * 4);
                        let ax = bx, az = bz, aw = 0, ad = 0;
                        const awningY = 0.2 + 3;
                        if (side === 0) {
                            ax = bx + w / 2 + 0.75;
                            az = bz;
                            aw = 1.5;
                            ad = d * 0.8;
                        } else if (side === 1) {
                            ax = bx - w / 2 - 0.75;
                            az = bz;
                            aw = 1.5;
                            ad = d * 0.8;
                        } else if (side === 2) {
                            ax = bx;
                            az = bz + d / 2 + 0.75;
                            aw = w * 0.8;
                            ad = 1.5;
                        } else {
                            ax = bx;
                            az = bz - d / 2 - 0.75;
                            aw = w * 0.8;
                            ad = 1.5;
                        }
                        dummy.position.set(ax, awningY, az);
                        dummy.scale.set(aw, 0.2, ad);
                        dummy.rotation.set(0, 0, 0);
                        dummy.updateMatrix();
                        const color = new THREE.Color(awningColors[Math.floor(Math.random() * awningColors.length)]);
                        awningData.matrices.push(dummy.matrix.clone());
                        awningData.colors.push(color);
                    }
                }
            }
        });

        for (const key in instancedData) {
            const data = instancedData[key];
            const [variant, density] = key.split('_').map(Number);
            const texture = getTexture(variant, density);
            const mat = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.8,
                metalness: 0.1,
                color: 0xffffff
            });
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mesh = new THREE.InstancedMesh(geo, mat, data.matrices.length);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            for (let i = 0; i < data.matrices.length; i++) {
                mesh.setMatrixAt(i, data.matrices[i]);
                mesh.setColorAt(i, data.colors[i]);
            }
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
            this.scene.add(mesh);
        }

        if (acMatrices.length > 0) {
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8 });
            const mesh = new THREE.InstancedMesh(geo, mat, acMatrices.length);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            acMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
            mesh.instanceMatrix.needsUpdate = true;
            this.scene.add(mesh);
        }

        if (tankMatrices.length > 0) {
            const geo = new THREE.CylinderGeometry(1, 1, 1, 8);
            const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.6, metalness: 0.4 });
            const mesh = new THREE.InstancedMesh(geo, mat, tankMatrices.length);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            tankMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
            mesh.instanceMatrix.needsUpdate = true;
            this.scene.add(mesh);
        }

        if (antennaMatrices.length > 0) {
            const geo = new THREE.CylinderGeometry(1, 1, 1, 6);
            const mat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
            const mesh = new THREE.InstancedMesh(geo, mat, antennaMatrices.length);
            mesh.castShadow = true;
            antennaMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
            mesh.instanceMatrix.needsUpdate = true;
            this.scene.add(mesh);
        }

        if (awningData.matrices.length > 0) {
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.1 });
            const mesh = new THREE.InstancedMesh(geo, mat, awningData.matrices.length);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            for (let i = 0; i < awningData.matrices.length; i++) {
                mesh.setMatrixAt(i, awningData.matrices[i]);
                mesh.setColorAt(i, awningData.colors[i]);
            }
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
            this.scene.add(mesh);
        }
    }

    createWindowTexture(variant, density) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#c8c8c8';
        ctx.fillRect(0, 0, 256, 256);

        const margin = 8;
        const cellW = (256 - margin * 2) / density;
        const cellH = (256 - margin * 2) / density;
        const winW = cellW * 0.6;
        const winH = cellH * 0.6;

        const litProb = [0.7, 0.4, 0.2, 0.05][variant] || 0.1;

        for (let i = 0; i < density; i++) {
            for (let j = 0; j < density; j++) {
                const x = margin + j * cellW + (cellW - winW) / 2;
                const y = margin + i * cellH + (cellH - winH) / 2;
                const lit = Math.random() < litProb;
                if (lit) {
                    const r = 255;
                    const g = 200 + Math.floor(Math.random() * 55);
                    const b = 100 + Math.floor(Math.random() * 80);
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                } else {
                    const v = 40 + Math.floor(Math.random() * 30);
                    ctx.fillStyle = `rgb(${v},${v+10},${v+20})`;
                }
                ctx.fillRect(x, y, winW, winH);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.anisotropy = 4;
        return texture;
    }

    createCentralGarageHub() {
        const hubGroup = new THREE.Group();
        hubGroup.position.set(0, 0, 0);
        
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.8 });
        const darkMetal = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.7 });
        const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5 });
        
        const floor = new THREE.Mesh(new THREE.BoxGeometry(100, 0.2, 100), concreteMat);
        floor.position.set(0, 0.1, 0); floor.receiveShadow = true; hubGroup.add(floor);

        const driveway = new THREE.Mesh(new THREE.PlaneGeometry(24, 60), concreteMat);
        driveway.rotation.x = -Math.PI / 2;
        driveway.position.set(0, 0.11, -80);
        driveway.receiveShadow = true; hubGroup.add(driveway);

        const garage = new THREE.Group();
        garage.position.set(0, 0, 0);

        const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, 15, 1), wallMat);
        backWall.position.set(0, 7.5, 20); backWall.castShadow = true; backWall.receiveShadow = true; garage.add(backWall);
        this.buildingData.push({ x: 0, y: 7.5, z: 20, w: 40, h: 15, d: 1 });

        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 15, 40), wallMat);
        leftWall.position.set(-20, 7.5, 0); leftWall.castShadow = true; leftWall.receiveShadow = true; garage.add(leftWall);
        this.buildingData.push({ x: -20, y: 7.5, z: 0, w: 1, h: 15, d: 40 });

        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 15, 40), wallMat);
        rightWall.position.set(20, 7.5, 0); rightWall.castShadow = true; rightWall.receiveShadow = true; garage.add(rightWall);
        this.buildingData.push({ x: 20, y: 7.5, z: 0, w: 1, h: 15, d: 40 });

        // Open-front garage: thin roof canopy only over the back half
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(40, 0.3, 20), darkMetal);
        canopy.position.set(0, 15, 10); canopy.castShadow = true; garage.add(canopy);

        // Front gate frame
        const gatePostGeo = new THREE.BoxGeometry(0.6, 15, 0.6);
        const gatePostL = new THREE.Mesh(gatePostGeo, yellowMat); gatePostL.position.set(-19, 7.5, -20); gatePostL.castShadow = true; garage.add(gatePostL);
        const gatePostR = gatePostL.clone(); gatePostR.position.set(19, 7.5, -20); garage.add(gatePostR);
        const gateBeam = new THREE.Mesh(new THREE.BoxGeometry(38.6, 0.6, 0.6), yellowMat);
        gateBeam.position.set(0, 15, -20); gateBeam.castShadow = true; garage.add(gateBeam);
        this.buildingData.push({ x: -19, y: 7.5, z: -20, w: 0.6, h: 15, d: 0.6 });
        this.buildingData.push({ x: 19, y: 7.5, z: -20, w: 0.6, h: 15, d: 0.6 });

        // Yellow GARAGE sign
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 512; signCanvas.height = 128;
        const sctx = signCanvas.getContext('2d');
        sctx.fillStyle = '#ffcc00'; sctx.fillRect(0, 0, 512, 128);
        sctx.fillStyle = '#111111'; sctx.font = 'bold 84px Arial'; sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
        sctx.fillText('GARAGE', 256, 64);
        const signTex = new THREE.CanvasTexture(signCanvas);
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(30, 7.5), signMat);
        sign.position.set(0, 13.5, -20.4); sign.rotation.y = Math.PI; garage.add(sign);

        // Workshop props
        // Tool rack against back wall
        const rack = new THREE.Mesh(new THREE.BoxGeometry(12, 2.5, 0.5), darkMetal);
        rack.position.set(-8, 1.25, 18.5); rack.castShadow = true; garage.add(rack);
        for (let i = 0; i < 6; i++) {
            const tool = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.2 + Math.random() * 0.6, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.4 }));
            tool.position.set(-13 + i * 1.8, 2.4, 18.2); garage.add(tool);
        }
        // Barrels
        const barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.4, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x2a5a8a, roughness: 0.7, metalness: 0.3 });
        const barrelPos = [[8, 0.7, 16], [10, 0.7, 15], [9, 0.7, 17.5], [12, 0.7, 17]];
        barrelPos.forEach(p => { const b = new THREE.Mesh(barrelGeo, barrelMat); b.position.set(p[0], p[1], p[2]); b.castShadow = true; garage.add(b); });
        // Tire stacks
        const tireGeo = new THREE.TorusGeometry(0.5, 0.2, 8, 16);
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
        const tireStacks = [[14, 0, 12], [14, 0, 13.2], [15.5, 0, 12.5]];
        tireStacks.forEach(s => {
            for (let i = 0; i < 4; i++) {
                const t = new THREE.Mesh(tireGeo, tireMat);
                t.rotation.x = Math.PI / 2;
                t.position.set(s[0], 0.2 + i * 0.35, s[2]);
                t.castShadow = true; garage.add(t);
            }
        });
        // Fuel pump
        const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.8), yellowMat);
        pumpBody.position.set(-14, 1.1, -12); pumpBody.castShadow = true; garage.add(pumpBody);
        const pumpScreen = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x223344, emissive: 0x224466, emissiveIntensity: 0.6 }));
        pumpScreen.position.set(-14, 1.6, -11.58); garage.add(pumpScreen);
        const hoseGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5);
        const hose = new THREE.Mesh(hoseGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
        hose.position.set(-13.2, 1.2, -12); hose.rotation.z = 0.4; garage.add(hose);

        hubGroup.add(garage);
        this.scene.add(hubGroup);
    }

    createJobSite() {
        const jobX = 0;
        const jobZ = -120;

        this.dirtPileGroup = new THREE.Group();
        this.dirtPileGroup.position.set(jobX, 0, jobZ);
        this.allDirtClods = [];
        const clodGeo = new THREE.DodecahedronGeometry(1.2, 0);
        const clodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 1.0 });
        
        for(let i = 0; i < 45; i++) {
            const clod = new THREE.Mesh(clodGeo, clodMat);
            const r = Math.random() * 6;
            const theta = Math.random() * Math.PI * 2;
            clod.position.set(Math.cos(theta) * r, Math.random() * 3, Math.sin(theta) * r);
            clod.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            clod.castShadow = true;
            this.dirtPileGroup.add(clod);
            this.allDirtClods.push(clod);
        }
        this.scene.add(this.dirtPileGroup);

        this.truckGroup = new THREE.Group();
        this.truckGroup.position.set(jobX + 15, 0, jobZ);
        const blueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.5 }); const bedMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.8 });
        const cab = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), blueMat); cab.position.set(0, 3, 4); cab.castShadow = true; this.truckGroup.add(cab);
        [[4.2,0.4,6,0,1.4,-1],[0.3,1.6,6,-2.05,2.2,-1],[0.3,1.6,6,2.05,2.2,-1],[4.2,1.6,0.3,0,2.2,-4],[4.2,1.6,0.3,0,2.2,2]].forEach(b => { const w = new THREE.Mesh(new THREE.BoxGeometry(b[0], b[1], b[2]), bedMat); w.position.set(b[3], b[4], b[5]); w.castShadow = true; w.receiveShadow = true; this.truckGroup.add(w); });
        this.scene.add(this.truckGroup);
        
        this.buildingData.push({ x: jobX + 15, y: 3, z: jobZ + 4, w: 4, h: 4, d: 4 }); 
        this.buildingData.push({ x: jobX + 15, y: 2, z: jobZ - 1, w: 4.2, h: 2, d: 6 }); 

        const coneMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.8 });
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const radius = 12;
            const cx = jobX + Math.cos(angle) * radius;
            const cz = jobZ + Math.sin(angle) * radius;
            const coneGroup = new THREE.Group();
            const base = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), baseMat); base.position.y = 0.05; coneGroup.add(base);
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.5, 8), coneMat); cone.position.y = 0.8; cone.castShadow = true; coneGroup.add(cone);
            coneGroup.position.set(cx, 0, cz); this.scene.add(coneGroup);
        }
    }

    createOptimizedTraffic() {
        const carColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xffffff, 0xaaaaaa];
        const roadPositions = [-240, -160, -80, 80, 160, 240];

        for (let i = 0; i < 40; i++) {
            const color = carColors[Math.floor(Math.random() * carColors.length)];
            const carGroup = new THREE.Group();
            
            const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 4.5), new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.6 })); body.position.y = 0.6; body.castShadow = true; carGroup.add(body);
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2.2), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 })); cabin.position.set(0, 1.4, -0.2); cabin.castShadow = true; carGroup.add(cabin);
            
            const wheels = []; const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16); wheelGeo.rotateZ(Math.PI / 2); const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
            [{ x: -1.0, y: 0.4, z: 1.4 }, { x: 1.0, y: 0.4, z: 1.4 }, { x: -1.0, y: 0.4, z: -1.4 }, { x: 1.0, y: 0.4, z: -1.4 }].forEach(pos => { const wheel = new THREE.Mesh(wheelGeo, wheelMat); wheel.position.set(pos.x, pos.y, pos.z); wheel.castShadow = true; carGroup.add(wheel); wheels.push(wheel); });

            const isXAxis = Math.random() > 0.5;
            const isPositiveDir = Math.random() > 0.5;
            const laneOffset = isPositiveDir ? 6 : -6; 
            
            const roadPos = roadPositions[Math.floor(Math.random() * roadPositions.length)];
            let startPos = -290 + Math.random() * 580;

            if (isXAxis) {
                carGroup.position.set(startPos, 0, roadPos + laneOffset);
                carGroup.rotation.y = isPositiveDir ? Math.PI / 2 : -Math.PI / 2;
            } else {
                carGroup.position.set(roadPos + laneOffset, 0, startPos);
                carGroup.rotation.y = isPositiveDir ? Math.PI : 0;
            }

            this.scene.add(carGroup);
            const baseSpeed = 20 + Math.random() * 15;
            this.trafficCars.push({ 
                mesh: carGroup, 
                wheels: wheels, 
                isXAxis: isXAxis,
                dir: isPositiveDir ? 1 : -1,
                speed: baseSpeed,
                baseSpeed: baseSpeed,
                roadPos: roadPos,
                laneOffset: laneOffset
            });
        }
    }

    startTrafficAI() {
        const clock = new THREE.Clock();
        const animateTraffic = () => {
            requestAnimationFrame(animateTraffic);
            const dt = Math.min(clock.getDelta(), 0.1);
            const cars = this.trafficCars;
            const n = cars.length;

            for (let i = 0; i < n; i++) {
                const car = cars[i];

                let minGap = Infinity;
                for (let j = 0; j < n; j++) {
                    if (i === j) continue;
                    const other = cars[j];
                    if (other.roadPos !== car.roadPos) continue;
                    if (other.isXAxis !== car.isXAxis) continue;
                    if (other.dir !== car.dir) continue;
                    if (other.laneOffset !== car.laneOffset) continue;
                    let gap;
                    if (car.isXAxis) {
                        gap = (other.mesh.position.x - car.mesh.position.x) * car.dir;
                    } else {
                        gap = (other.mesh.position.z - car.mesh.position.z) * car.dir;
                    }
                    if (gap > 0 && gap < minGap) minGap = gap;
                }

                let targetSpeed = car.baseSpeed;
                const safeGap = 9;
                if (minGap < safeGap) {
                    targetSpeed = Math.max(0, car.baseSpeed * (minGap / safeGap));
                } else if (minGap < 22) {
                    targetSpeed = car.baseSpeed * 0.6;
                }

                car.speed += (targetSpeed - car.speed) * Math.min(1, dt * 4);
                if (car.speed < 0) car.speed = 0;

                const move = car.speed * car.dir * dt;
                if (car.isXAxis) {
                    car.mesh.position.x += move;
                    if (car.dir === 1 && car.mesh.position.x > 300) car.mesh.position.x = -300;
                    if (car.dir === -1 && car.mesh.position.x < -300) car.mesh.position.x = 300;
                } else {
                    car.mesh.position.z += move;
                    if (car.dir === 1 && car.mesh.position.z > 300) car.mesh.position.z = -300;
                    if (car.dir === -1 && car.mesh.position.z < -300) car.mesh.position.z = 300;
                }

                const wheelRotationSpeed = (car.speed * dt) / 0.4;
                for (let w = 0; w < car.wheels.length; w++) {
                    car.wheels[w].rotation.x -= wheelRotationSpeed;
                }
            }
        };
        animateTraffic();
    }

    createProps() {
        const dummy = new THREE.Object3D();
        const roadPositions = [-240, -160, -80, 80, 160, 240];

        // --- Streetlights ---
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 8, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.5 });
        const lampGeo = new THREE.BoxGeometry(1.4, 0.25, 0.6);
        const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffee88, emissiveIntensity: 0.5 });
        const polePositions = [];
        const lampPositions = [];
        roadPositions.forEach(rp => {
            for (let t = -280; t <= 280; t += 40) {
                if (roadPositions.some(p => Math.abs(t - p) < 18)) continue;
                [-13, 13].forEach(off => {
                    polePositions.push({ x: rp + off, y: 4, z: t });
                    lampPositions.push({ x: rp + off + (off > 0 ? 0.9 : -0.9), y: 8, z: t });
                    polePositions.push({ x: t, y: 4, z: rp + off });
                    lampPositions.push({ x: t, y: 8, z: rp + off + (off > 0 ? 0.9 : -0.9) });
                });
            }
        });
        const poleMesh = new THREE.InstancedMesh(poleGeo, poleMat, polePositions.length);
        polePositions.forEach((p, i) => {
            dummy.position.set(p.x, p.y, p.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            poleMesh.setMatrixAt(i, dummy.matrix);
        });
        poleMesh.castShadow = true;
        this.scene.add(poleMesh);
        const lampMesh = new THREE.InstancedMesh(lampGeo, lampMat, lampPositions.length);
        lampPositions.forEach((p, i) => {
            dummy.position.set(p.x, p.y, p.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            lampMesh.setMatrixAt(i, dummy.matrix);
        });
        this.scene.add(lampMesh);

        // --- Traffic light poles ---
        const tlPoleGeo = new THREE.CylinderGeometry(0.1, 0.12, 5, 6);
        const tlPoleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
        const tlHeadGeo = new THREE.BoxGeometry(0.4, 1.0, 0.3);
        const tlHeadMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x330000, emissiveIntensity: 0.3 });
        const tlPos = [];
        roadPositions.forEach(ix => {
            roadPositions.forEach(iz => {
                [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(s => {
                    tlPos.push({ x: ix + s[0] * 13.5, z: iz + s[1] * 13.5 });
                });
            });
        });
        const tlMesh = new THREE.InstancedMesh(tlPoleGeo, tlPoleMat, tlPos.length);
        tlPos.forEach((p, i) => {
            dummy.position.set(p.x, 2.5, p.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            tlMesh.setMatrixAt(i, dummy.matrix);
        });
        tlMesh.castShadow = true;
        this.scene.add(tlMesh);
        const tlHeadMesh = new THREE.InstancedMesh(tlHeadGeo, tlHeadMat, tlPos.length);
        tlPos.forEach((p, i) => {
            dummy.position.set(p.x, 5, p.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            tlHeadMesh.setMatrixAt(i, dummy.matrix);
        });
        this.scene.add(tlHeadMesh);

        // --- Benches / bins / hydrants ---
        const benchSeatGeo = new THREE.BoxGeometry(1.8, 0.15, 0.6);
        const benchLegGeo = new THREE.BoxGeometry(0.15, 0.4, 0.6);
        const benchMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
        const binGeo = new THREE.CylinderGeometry(0.3, 0.25, 0.9, 8);
        const binMat = new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 0.7 });
        const hydrantGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.9, 8);
        const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });

        const benchPos = [];
        const binPos = [];
        const hydrantPos = [];
        for (let i = 0; i < 260; i++) {
            const onX = Math.random() < 0.5;
            const rp = roadPositions[Math.floor(Math.random() * roadPositions.length)];
            const side = Math.random() < 0.5 ? -1 : 1;
            const along = -260 + Math.random() * 520;
            if (roadPositions.some(p => Math.abs(along - p) < 20)) continue;
            let x, z;
            if (onX) {
                x = along;
                z = rp + side * 14;
            } else {
                x = rp + side * 14;
                z = along;
            }
            const r = Math.random();
            if (r < 0.4) benchPos.push({ x, z, rot: onX ? Math.PI / 2 : 0 });
            else if (r < 0.7) binPos.push({ x, z });
            else hydrantPos.push({ x, z });
        }

        const benchSeatMesh = new THREE.InstancedMesh(benchSeatGeo, benchMat, benchPos.length);
        benchPos.forEach((p, i) => {
            dummy.position.set(p.x, 0.55, p.z);
            dummy.rotation.set(0, p.rot, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            benchSeatMesh.setMatrixAt(i, dummy.matrix);
        });
        benchSeatMesh.castShadow = true;
        this.scene.add(benchSeatMesh);

        const benchLegMesh = new THREE.InstancedMesh(benchLegGeo, benchMat, benchPos.length * 2);
        let legIdx = 0;
        benchPos.forEach(p => {
            for (const off of [-0.7, 0.7]) {
                const ox = Math.cos(p.rot) * off;
                const oz = -Math.sin(p.rot) * off;
                dummy.position.set(p.x + ox, 0.3, p.z + oz);
                dummy.rotation.set(0, p.rot, 0);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                benchLegMesh.setMatrixAt(legIdx++, dummy.matrix);
            }
        });
        this.scene.add(benchLegMesh);

        const binMesh = new THREE.InstancedMesh(binGeo, binMat, binPos.length);
        binPos.forEach((p, i) => {
            dummy.position.set(p.x, 0.45, p.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            binMesh.setMatrixAt(i, dummy.matrix);
        });
        binMesh.castShadow = true;
        this.scene.add(binMesh);

        const hydrantMesh = new THREE.InstancedMesh(hydrantGeo, hydrantMat, hydrantPos.length);
        hydrantPos.forEach((p, i) => {
            dummy.position.set(p.x, 0.45, p.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            hydrantMesh.setMatrixAt(i, dummy.matrix);
        });
        hydrantMesh.castShadow = true;
        this.scene.add(hydrantMesh);

        // --- Parks with trees ---
        const roadHalf = 12;
        const intervals = [];
        for (let i = 0; i < roadPositions.length - 1; i++) {
            const left = roadPositions[i] + roadHalf;
            const right = roadPositions[i + 1] - roadHalf;
            intervals.push({ center: (left + right) / 2, size: right - left });
        }
        const parkBlocks = [];
        intervals.forEach(xInt => {
            intervals.forEach(zInt => {
                if (Math.abs(xInt.center) < 1 && Math.abs(zInt.center) < 1) return;
                if (Math.abs(xInt.center) < 1 && Math.abs(zInt.center + 120) < 1) return;
                if (Math.random() < 0.18) parkBlocks.push({ x: xInt.center, z: zInt.center, w: xInt.size, d: zInt.size });
            });
        });

        const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 3, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 1.0 });
        const canopy1Geo = new THREE.IcosahedronGeometry(2.2, 0);
        const canopy2Geo = new THREE.IcosahedronGeometry(1.5, 0);
        const canopyMat = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0.0 });
        const greens = [0x2d5a1e, 0x3e7a2a, 0x4e8a3a];

        const trunkPositions = [];
        const canopy1Data = [];
        const canopy2Data = [];

        parkBlocks.forEach(block => {
            const count = 10 + Math.floor(Math.random() * 10);
            for (let i = 0; i < count; i++) {
                const x = block.x + (Math.random() - 0.5) * (block.w - 6);
                const z = block.z + (Math.random() - 0.5) * (block.d - 6);
                const s = 0.8 + Math.random() * 0.8;
                trunkPositions.push({ x, y: 1.5 * s, z, s });
                const c1 = new THREE.Color(greens[Math.floor(Math.random() * greens.length)]);
                const c2 = new THREE.Color(greens[Math.floor(Math.random() * greens.length)]);
                canopy1Data.push({ x, y: 4 * s, z, s, color: c1 });
                canopy2Data.push({ x, y: 5.4 * s, z, s: s * 0.9, color: c2 });
            }
        });

        if (trunkPositions.length > 0) {
            const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, trunkPositions.length);
            trunkPositions.forEach((p, i) => {
                dummy.position.set(p.x, p.y, p.z);
                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(p.s, p.s, p.s);
                dummy.updateMatrix();
                trunkMesh.setMatrixAt(i, dummy.matrix);
            });
            trunkMesh.castShadow = true;
            this.scene.add(trunkMesh);

            const canopy1Mesh = new THREE.InstancedMesh(canopy1Geo, canopyMat, canopy1Data.length);
            canopy1Data.forEach((p, i) => {
                dummy.position.set(p.x, p.y, p.z);
                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(p.s, p.s, p.s);
                dummy.updateMatrix();
                canopy1Mesh.setMatrixAt(i, dummy.matrix);
                canopy1Mesh.setColorAt(i, p.color);
            });
            canopy1Mesh.castShadow = true;
            canopy1Mesh.instanceMatrix.needsUpdate = true;
            if (canopy1Mesh.instanceColor) canopy1Mesh.instanceColor.needsUpdate = true;
            this.scene.add(canopy1Mesh);

            const canopy2Mesh = new THREE.InstancedMesh(canopy2Geo, canopyMat, canopy2Data.length);
            canopy2Data.forEach((p, i) => {
                dummy.position.set(p.x, p.y, p.z);
                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(p.s, p.s, p.s);
                dummy.updateMatrix();
                canopy2Mesh.setMatrixAt(i, dummy.matrix);
                canopy2Mesh.setColorAt(i, p.color);
            });
            canopy2Mesh.castShadow = true;
            canopy2Mesh.instanceMatrix.needsUpdate = true;
            if (canopy2Mesh.instanceColor) canopy2Mesh.instanceColor.needsUpdate = true;
            this.scene.add(canopy2Mesh);
        }

        // --- Parked cars along curbs ---
        const parkedBodyGeo = new THREE.BoxGeometry(2, 0.8, 4.5);
        const parkedCabinGeo = new THREE.BoxGeometry(1.8, 0.8, 2.2);
        const parkedMat = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.6 });
        const carPalette = [0xff0000, 0x00cc00, 0x0000ff, 0xffff00, 0xffffff, 0xaaaaaa, 0x333333, 0xcc6600];
        const parked = [];
        for (let i = 0; i < 70; i++) {
            const onX = Math.random() < 0.5;
            const rp = roadPositions[Math.floor(Math.random() * roadPositions.length)];
            const side = Math.random() < 0.5 ? -1 : 1;
            const along = -260 + Math.random() * 520;
            if (roadPositions.some(p => Math.abs(along - p) < 20)) continue;
            let x, z, rot;
            if (onX) {
                x = along;
                z = rp + side * 9;
                rot = Math.PI / 2;
            } else {
                x = rp + side * 9;
                z = along;
                rot = 0;
            }
            parked.push({ x, z, rot, color: new THREE.Color(carPalette[Math.floor(Math.random() * carPalette.length)]) });
        }
        if (parked.length > 0) {
            const bodyMesh = new THREE.InstancedMesh(parkedBodyGeo, parkedMat, parked.length);
            const cabinMesh = new THREE.InstancedMesh(parkedCabinGeo, parkedMat.clone(), parked.length);
            parked.forEach((p, i) => {
                dummy.position.set(p.x, 0.6, p.z);
                dummy.rotation.set(0, p.rot, 0);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                bodyMesh.setMatrixAt(i, dummy.matrix);
                bodyMesh.setColorAt(i, p.color);

                const cx = p.x + (p.rot === 0 ? 0 : Math.cos(p.rot) * 0);
                dummy.position.set(p.x, 1.4, p.z);
                dummy.updateMatrix();
                cabinMesh.setMatrixAt(i, dummy.matrix);
                cabinMesh.setColorAt(i, new THREE.Color(0x111111));
            });
            bodyMesh.castShadow = true;
            cabinMesh.castShadow = true;
            bodyMesh.instanceMatrix.needsUpdate = true;
            cabinMesh.instanceMatrix.needsUpdate = true;
            if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = true;
            if (cabinMesh.instanceColor) cabinMesh.instanceColor.needsUpdate = true;
            this.scene.add(bodyMesh);
            this.scene.add(cabinMesh);
        }

        // --- Far skyline ring ---
        const skylineGeo = new THREE.BoxGeometry(1, 1, 1);
        const skylineMat = new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.9, metalness: 0.1 });
        const skylineCount = 220;
        const skylineMesh = new THREE.InstancedMesh(skylineGeo, skylineMat, skylineCount);
        for (let i = 0; i < skylineCount; i++) {
            const angle = (i / skylineCount) * Math.PI * 2 + Math.random() * 0.1;
            const radius = 900 + Math.random() * 300;
            const w = 20 + Math.random() * 40;
            const h = 60 + Math.random() * 140;
            const d = 20 + Math.random() * 40;
            dummy.position.set(Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius);
            dummy.rotation.set(0, Math.random() * Math.PI, 0);
            dummy.scale.set(w, h, d);
            dummy.updateMatrix();
            skylineMesh.setMatrixAt(i, dummy.matrix);
        }
        skylineMesh.instanceMatrix.needsUpdate = true;
        this.scene.add(skylineMesh);
    }

    shrinkDirtPile() {
        for(let i = 0; i < 15; i++) { 
            if(this.allDirtClods.length > 0) {
                this.dirtPileGroup.remove(this.allDirtClods.pop());
            }
        }
    }

    resetDirtPile() {
        this.dirtPileGroup.clear();
        this.allDirtClods.forEach(clod => this.dirtPileGroup.add(clod));
        this.dirtPileGroup.visible = true;
    }

    addDirtToTruck() {
        this.truckDirtLevel++;
        const dirtMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 1.0 });
        const dirtGeo = new THREE.DodecahedronGeometry(1.5, 0);
        const dirtMesh = new THREE.Mesh(dirtGeo, dirtMat);
        dirtMesh.position.set((Math.random() - 0.5) * 1.5, 1.9 + (this.truckDirtLevel * 0.45), -1 + (Math.random() - 0.5) * 2);
        dirtMesh.scale.set(1.5, 1, 1.5); dirtMesh.castShadow = true;
        this.truckGroup.add(dirtMesh); this.truckDirtMeshes.push(dirtMesh);
    }

    createPhysicsColliders(world, RAPIER) {
        const groundBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0); 
        const groundBody = world.createRigidBody(groundBodyDesc);
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(1000, 0.1, 1000); 
        world.createCollider(groundColliderDesc, groundBody);

        this.buildingData.forEach(data => {
            const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(data.x, data.y, data.z); 
            const body = world.createRigidBody(bodyDesc);
            const colliderDesc = RAPIER.ColliderDesc.cuboid(data.w/2, data.h/2, data.d/2); 
            world.createCollider(colliderDesc, body);
        });
    }
}

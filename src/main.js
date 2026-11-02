import * as THREE from 'three';
import { Vehicle } from './vehicle/Vehicle.js';
import { AudioManager } from './audio/AudioManager.js';
import { CameraManager } from './core/CameraManager.js';
import { World } from './core/World.js';
import { QAManager } from './core/QAManager.js';
import JobEffects from './gameplay/JobEffects.js';
import Guidance from './gameplay/Guidance.js';
import SoundFX from './audio/SoundFX.js';
import Sfx2 from './audio/Sfx2.js';
import DigAnimator from './vehicle/DigAnimator.js';
import DigSound from './audio/DigSound.js';
import GameUI from './ui/GameUI.js';
import Music from './audio/Music.js';
import TrafficPhysics from './core/TrafficPhysics.js';
import JobManager from './gameplay/JobManager.js';

let fx = null, guide = null, sfx = null, tutStep = 0, lastTarget = 'none';
function safe(f) { try { return f(); } catch (e) { console.warn('[fx]', e); } }
let ui = null, music = null, trafficPhys = null, jm = null, currentJob = 1, lastLoads = 0, lastCoinsShown = -1;
const JOB_TITLE = 'Clear the Highway', JOB_OBJ = 'Load the blue truck with dirt';
let dig = null, digSound = null;
const dm = { fill: 1, drop: -1, b: 0, k: 0, was: false };
function updateDig(dt) {
    safe(() => {
        if (!dig && vehicle) {
            dig = new DigAnimator(vehicle, THREE); digSound = new DigSound();
            window.addEventListener('bh-dig', e => { if (!dig.busy) { dig.start(e.detail); if (e.detail === 'scoop') digSound.scoop(); else digSound.dump(); } });
            dig.onEvent = (n) => {
                if (n === 'dig') { cameraShake = 0.06; const p = new THREE.Vector3(); vehicle.bucketPivot.getWorldPosition(p); if (fx) fx.onScoop(p); }
                if (n === 'fill') { vehicle.scoopDirt(); vehicle.spawnDirtBurst(); cameraShake = 0.1; vehicle.bucketDirtGroup.scale.setScalar(0.15); dm.fill = 0; }
                if (n === 'drop') { vehicle.spawnDirtBurst(); dm.drop = 0; }
                if (n === 'thud') cameraShake = 0.2;
            };
        }
        if (dig) {
            const bp = vehicle.boomPivot, kp = vehicle.bucketPivot;
            if (!dm.was && dig.busy) { dm.b = bp.rotation.x; dm.k = kp.rotation.x; }
            dig.update(dt);
            if (dig.busy) {
                const f = 1 - Math.exp(-16 * dt);
                dm.b += (bp.rotation.x - dm.b) * f; dm.k += (kp.rotation.x - dm.k) * f;
                bp.rotation.x = dm.b; kp.rotation.x = dm.k;
            }
            dm.was = dig.busy;
            const g = vehicle.bucketDirtGroup;
            if (dm.fill < 1) { dm.fill = Math.min(1, dm.fill + dt / 0.6); const e = 1 - Math.pow(1 - dm.fill, 3); g.scale.setScalar(0.15 + 0.85 * e); }
            if (dm.drop >= 0) {
                dm.drop += dt / 0.8; g.scale.setScalar(Math.max(0.05, 1 - dm.drop));
                if (dm.drop >= 1) { vehicle.dropDirt(); g.scale.setScalar(1); dm.drop = -1; }
            }
        }
    });
}
function initUi() {
    safe(() => {
        ui = new GameUI();
        music = new Music();
        jm = new JobManager();
        jm.onTick = (t) => { if (ui) ui.setTimer(Math.ceil(t)); };
        jm.onFail = () => { if (ui) ui.toast('Time is up! Try again', 'warn'); window.restartJob(); };
        jm.start(currentJob);
        ui.setJob(JOB_TITLE, JOB_OBJ, 'Scoop dirt 0/3');
        ui.setCoins(saveData.coins);
        music.start(); music.startAmbience();
        window.addEventListener('bh-hint', e => { if (ui) ui.toast(e.detail, 'warn'); });
    });
}
function updateUi(dt) {
    if (!ui) initUi();
    safe(() => {
        if (!trafficPhys && world && RAPIER) { trafficPhys = new TrafficPhysics(world, RAPIER, worldBuilder.trafficCars); trafficPhys.init(); }
        if (trafficPhys) trafficPhys.update();
        if (ui) {
            ui.setSpeed(vehicle.currentSpeed);
            if (saveData.coins !== lastCoinsShown) { lastCoinsShown = saveData.coins; ui.setCoins(saveData.coins); }
            const lv = worldBuilder.truckDirtLevel;
            if (lv !== lastLoads) {
                if (lv > lastLoads && jm) jm.addLoad();
                lastLoads = lv;
                ui.setJob(JOB_TITLE, JOB_OBJ, 'Scoop dirt ' + lv + '/3');
                if (lv > 0 && lv < 3) ui.toast('Nice! Load ' + lv + ' of 3 delivered', 'success');
            }
        }
        if (jm && !jobCompleted) jm.update(dt);
        if (music) music.setIntensity(Math.min(1, vehicle.currentSpeed / 40));
    });
}
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const SAVE_KEY = 'terraform_city_save_v6';
let saveData = { coins: 0, engineLevel: 1, hydraulicLevel: 1 };

const canvas = document.getElementById('game-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe9f3);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 900);
const cameraManager = new CameraManager(camera, canvas);
const worldBuilder = new World(scene);
cameraManager.setCollidables([...worldBuilder.buildingMeshes, ...worldBuilder.treeMeshes]);

cameraManager.setMode('bucket');
document.querySelectorAll('.cam-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'bucket'));

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ---- Balanced lighting + fog (overrides World's defaults) ----
if (worldBuilder.sunLight) {
    worldBuilder.sunLight.intensity = 2.2;
    const sc = worldBuilder.sunLight.shadow.camera;
    sc.left = -40;
    sc.right = 40;
    sc.top = 40;
    sc.bottom = -40;
    sc.near = 1;
    sc.far = 400;
    sc.updateProjectionMatrix();
    worldBuilder.sunLight.shadow.mapSize.width = 2048;
    worldBuilder.sunLight.shadow.mapSize.height = 2048;
    scene.add(worldBuilder.sunLight.target);
}
if (worldBuilder.hemiLight) {
    worldBuilder.hemiLight.intensity = 0.55;
    worldBuilder.hemiLight.color.set(0xbfd4ff);
    worldBuilder.hemiLight.groundColor.set(0x445544);
}
scene.fog = new THREE.FogExp2(0xdfe9f3, 0.0016);
scene.background = new THREE.Color(0xdfe9f3);

// ---- Quality system ----
const QUALITY_PRESETS = {
    low:    { shadowMapSize: 0,    pixelRatio: 1,   bloom: false },
    medium: { shadowMapSize: 1024, pixelRatio: 1.5, bloom: true  },
    high:   { shadowMapSize: 2048, pixelRatio: 2,   bloom: true  }
};
let currentQuality = 'high';
let composer = null;
let bloomPass = null;
let vignettePass = null;
let firstFrameRendered = false;

function applyQualitySettings(q) {
    const preset = QUALITY_PRESETS[q];
    if (!preset) return;
    currentQuality = q;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));

    if (preset.shadowMapSize === 0) {
        renderer.shadowMap.enabled = false;
    } else {
        renderer.shadowMap.enabled = true;
        if (worldBuilder.sunLight) {
            worldBuilder.sunLight.shadow.mapSize.width = preset.shadowMapSize;
            worldBuilder.sunLight.shadow.mapSize.height = preset.shadowMapSize;
            if (worldBuilder.sunLight.shadow.map) {
                worldBuilder.sunLight.shadow.map.dispose();
                worldBuilder.sunLight.shadow.map = null;
            }
        }
    }

    if (bloomPass) bloomPass.enabled = preset.bloom;
    if (composer) {
        composer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));
        composer.setSize(window.innerWidth, window.innerHeight);
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function stepDownQuality() {
    if (currentQuality === 'high') applyQualitySettings('medium');
    else if (currentQuality === 'medium') applyQualitySettings('low');
}

function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY_PRESETS[currentQuality].pixelRatio));
    composer.setSize(window.innerWidth, window.innerHeight);

    composer.addPass(new RenderPass(scene, camera));

    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.22,  // strength (subtle)
        0.45,  // radius
        0.85   // threshold
    );
    bloomPass.enabled = QUALITY_PRESETS[currentQuality].bloom;
    composer.addPass(bloomPass);
    if (currentQuality !== 'low') { composer.renderTarget1.samples = 4; composer.renderTarget2.samples = 4; }

    vignettePass = new ShaderPass({
        uniforms: {
            tDiffuse: { value: null },
            strength: { value: 0.32 },
            offset: { value: 0.85 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float strength;
            uniform float offset;
            varying vec2 vUv;
            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                vec2 uv = vUv - 0.5;
                float d = length(uv) * offset * 2.0;
                float v = smoothstep(1.0, 0.35, d);
                color.rgb *= mix(1.0, v, strength);
                gl_FragColor = color;
            }
        `
    });
    composer.addPass(vignettePass);

    composer.addPass(new OutputPass());
}

function renderFrame() {
    if (!firstFrameRendered) {
        firstFrameRendered = true;
        setupPostProcessing();
        startFpsTest();
    }
    if (composer) composer.render();
    else renderer.render(scene, camera);
}

window.setQuality = (q) => {
    if (QUALITY_PRESETS[q]) applyQualitySettings(q);
};

// Initial quick hardware-based quality detection
(function quickQualityDetect() {
    let level = 'high';
    const cores = navigator.hardwareConcurrency || 4;
    const pxr = window.devicePixelRatio || 1;
    if (cores <= 4 || pxr >= 2.5) level = 'medium';
    if (cores <= 2) level = 'low';
    applyQualitySettings(level);
})();

// ---- Shadow-camera follow + texel snapping ----
const _sunOffset = new THREE.Vector3(80, 150, 80);
function updateSunShadow() {
    const sun = worldBuilder.sunLight;
    if (!sun || !vehicle) return;
    const vx = vehicle.mesh.position.x;
    const vz = vehicle.mesh.position.z;
    const texel = 80 / (sun.shadow.mapSize.width || 2048);
    const sx = Math.round(vx / texel) * texel;
    const sz = Math.round(vz / texel) * texel;
    sun.target.position.set(sx, 0, sz);
    sun.target.updateMatrixWorld();
    sun.position.set(sx + _sunOffset.x, _sunOffset.y, sz + _sunOffset.z);
    sun.updateMatrixWorld();
}

// ---- Sustained FPS monitor (step down if <40fps for 3s) ----
let fpsCheckAccum = 0;
let fpsFrameCount = 0;
let lowFpsAccum = 0;
function trackFPS(dt) {
    fpsCheckAccum += dt;
    fpsFrameCount++;
    if (fpsCheckAccum >= 1.0) {
        const fps = fpsFrameCount / fpsCheckAccum;
        if (fps < 40) lowFpsAccum += fpsCheckAccum;
        else lowFpsAccum = 0;
        if (lowFpsAccum >= 3.0 && currentQuality !== 'low') {
            stepDownQuality();
            lowFpsAccum = 0;
        }
        fpsCheckAccum = 0;
        fpsFrameCount = 0;
    }
}

function startFpsTest() {
    let frames = 0;
    const start = performance.now();
    function test() {
        frames++;
        const elapsed = performance.now() - start;
        if (elapsed < 2000) {
            requestAnimationFrame(test);
        } else {
            const fps = frames / (elapsed / 1000);
            if (fps < 40 && currentQuality !== 'low') stepDownQuality();
        }
    }
    requestAnimationFrame(test);
}

const miniCanvas = document.getElementById('minimap-canvas');
const miniCtx = miniCanvas.getContext('2d');

let world, vehicle, RAPIER;
let physReady = false;
let isGameRunning = true;
let hasScoopedDirt = false;
let jobCompleted = false;
let cameraShake = 0; 
const MAX_LOADS = 3;
const audio = new AudioManager();
const sfx2 = new Sfx2();
audio.playDirtCrunch = () => {};
audio.playScoop = () => {};
audio.playDumpThud = () => {};
audio.playSuccess = () => sfx2.complete();
let qaManager = null;

function loadSave() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) saveData = JSON.parse(raw); } catch(e) {} }
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); } catch(e) {} }
loadSave();
document.getElementById('coin-count').textContent = saveData.coins;

function updateShopUI() {
    const engBtn = document.getElementById('buy-engine-btn');
    if(engBtn) { engBtn.textContent = saveData.engineLevel >= 3 ? 'MAX' : `Upgrade (${saveData.engineLevel * 100} Coins)`; engBtn.disabled = saveData.coins < saveData.engineLevel * 100 || saveData.engineLevel >= 3; }
    const hydBtn = document.getElementById('buy-hydraulic-btn');
    if(hydBtn) { hydBtn.textContent = saveData.hydraulicLevel >= 3 ? 'MAX' : `Upgrade (${saveData.hydraulicLevel * 100} Coins)`; hydBtn.disabled = saveData.coins < saveData.hydraulicLevel * 100 || saveData.hydraulicLevel >= 3; }
}

const shopBtn = document.getElementById('shop-btn'); if(shopBtn) shopBtn.addEventListener('click', () => { document.getElementById('shop-overlay').classList.add('active'); isGameRunning = false; updateShopUI(); });
const closeShopBtn = document.getElementById('close-shop-btn'); if(closeShopBtn) closeShopBtn.addEventListener('click', () => { document.getElementById('shop-overlay').classList.remove('active'); isGameRunning = true; });

const buyEngBtn = document.getElementById('buy-engine-btn'); if(buyEngBtn) buyEngBtn.addEventListener('click', () => { const cost = saveData.engineLevel * 100; if (saveData.coins >= cost && saveData.engineLevel < 3) { saveData.coins -= cost; saveData.engineLevel++; writeSave(); document.getElementById('coin-count').textContent = saveData.coins; if (vehicle) vehicle.setUpgrades(saveData); updateShopUI(); } });
const buyHydBtn = document.getElementById('buy-hydraulic-btn'); if(buyHydBtn) buyHydBtn.addEventListener('click', () => { const cost = saveData.hydraulicLevel * 100; if (saveData.coins >= cost && saveData.hydraulicLevel < 3) { saveData.coins -= cost; saveData.hydraulicLevel++; writeSave(); document.getElementById('coin-count').textContent = saveData.coins; if (vehicle) vehicle.setUpgrades(saveData); updateShopUI(); } });

const input = { forward: false, backward: false, left: false, right: false, brake: false };

// ---- Keys by physical position (event.code), so AZERTY and other layouts work ----
const CODE_TO_KEY = {
    KeyW: 'w', ArrowUp: 'arrowup', KeyS: 's', ArrowDown: 'arrowdown',
    KeyA: 'a', ArrowLeft: 'arrowleft', KeyD: 'd', ArrowRight: 'arrowright',
    Space: ' ', KeyE: 'e', KeyF: 'f', KeyC: 'c', KeyR: 'r'
};
function normKey(ev) {
    let k = CODE_TO_KEY[ev.code];
    if (k === undefined) k = (!ev.code || ev.code === 'Unidentified') ? (ev.key || '').toLowerCase() : '';
    return { key: k, repeat: ev.repeat };
}
// Release all driving keys if the window loses focus (prevents a stuck key)
window.addEventListener('blur', () => {
    input.forward = false; input.backward = false; input.left = false; input.right = false; input.brake = false;
});
const keyMap = { 'w': 'btn-w', 'arrowup': 'btn-w', 'a': 'btn-a', 'arrowleft': 'btn-a', 's': 'btn-s', 'arrowdown': 'btn-s', 'd': 'btn-d', 'arrowright': 'btn-d', 'e': 'btn-e', 'f': 'btn-f' };

window.addEventListener('keydown', (ev) => {
    if (ev.code === 'Backquote') { toggleDebugOverlay(); return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (isGameRunning && (ev.code === 'Space' || ev.code.startsWith('Arrow'))) ev.preventDefault();
    const e = normKey(ev);
    audio.init();
    const key = e.key.toLowerCase();
    if (e.repeat) return;
    if (key === 'w' || key === 'arrowup') input.forward = true;
    if (key === 's' || key === 'arrowdown') input.backward = true;
    if (key === 'a' || key === 'arrowleft') input.left = true;
    if (key === 'd' || key === 'arrowright') input.right = true;
    if (e.key === ' ') input.brake = true;
    if (key === 'r') window.restartJob();
    if (key === 'e' && vehicle) vehicle.toggleArm();
    if (key === 'f' && vehicle) vehicle.autoAction();
    if (key === 'c') {
        const modes = ['chase', 'orbit', 'cab', 'bucket'];
        let nextIndex = (modes.indexOf(cameraManager.currentMode) + 1) % modes.length;
        cameraManager.setMode(modes[nextIndex]);
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === modes[nextIndex]));
    }
    if (keyMap[key]) { const btn = document.querySelector(`.key[data-mobile="${keyMap[key]}"]`); if (btn) btn.classList.add('active-key'); }
});

window.addEventListener('keyup', (ev) => {
    const e = normKey(ev);
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') input.forward = false;
    if (key === 's' || key === 'arrowdown') input.backward = false;
    if (key === 'a' || key === 'arrowleft') input.left = false;
    if (key === 'd' || key === 'arrowright') input.right = false;
    if (e.key === ' ') input.brake = false;
    if (keyMap[key]) { const btn = document.querySelector(`.key[data-mobile="${keyMap[key]}"]`); if (btn) btn.classList.remove('active-key'); }
});

document.querySelectorAll('.key').forEach(btn => {
    const action = btn.dataset.mobile;
    if(!action) return;
    btn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); audio.init(); btn.classList.add('active-key');
        if (action === 'forward') input.forward = true;
        if (action === 'backward') input.backward = true;
        if (action === 'left') input.left = true;
        if (action === 'right') input.right = true;
        if (action === 'toggleArm' && vehicle) vehicle.toggleArm();
        if (action === 'toggleBucket' && vehicle) vehicle.autoAction();
    });
    const releaseBtn = (e) => {
        if(e) e.preventDefault(); btn.classList.remove('active-key');
        if (action === 'forward') input.forward = false;
        if (action === 'backward') input.backward = false;
        if (action === 'left') input.left = false;
        if (action === 'right') input.right = false;
    };
    btn.addEventListener('pointerup', releaseBtn);
    btn.addEventListener('pointerleave', releaseBtn);
});

document.querySelectorAll('.cam-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        cameraManager.setMode(e.target.dataset.mode);
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
    });
});

window.restartJob = () => {
    hasScoopedDirt = false; jobCompleted = false;
    const overlay = document.getElementById('victory-overlay'); if(overlay) overlay.classList.remove('active');
    const statusVal = document.getElementById('job-status-val'); if(statusVal) statusVal.textContent = 'SCOOP DIRT (0/3)';
    const missionDesc = document.getElementById('mission-desc'); if(missionDesc) missionDesc.textContent = 'Clear the rubble from the highway and load it into the blue truck.';
    
    worldBuilder.resetDirtPile();
    safe(() => { if (fx) fx.reset(); lastTarget = 'none'; });
    safe(() => { lastLoads = 0; if (jm) jm.start(currentJob); if (ui) ui.setJob(JOB_TITLE, JOB_OBJ, 'Scoop dirt 0/3'); });
    
    if (vehicle && physReady) {
        vehicle.chassisBody.setTranslation({ x: -35, y: 1.2, z: 10 }, true);
        vehicle.chassisBody.setRotation({ x: 0, y: 1, z: 0, w: 0 }, true); 
        vehicle.chassisBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        vehicle.chassisBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        vehicle.resetInterpolation();
        vehicle.hasDirt = false; 
        vehicle.bucketDirtGroup.children.forEach(c => c.visible = false);
        
        worldBuilder.truckDirtMeshes.forEach(mesh => worldBuilder.truckGroup.remove(mesh));
        worldBuilder.truckDirtMeshes = [];
        worldBuilder.truckDirtLevel = 0;
    }
};

const restartBtn = document.getElementById('restart-btn'); if(restartBtn) restartBtn.addEventListener('click', window.restartJob);
const victoryReplayBtn = document.getElementById('victory-replay-btn'); if(victoryReplayBtn) victoryReplayBtn.addEventListener('click', window.restartJob);

async function initPhysics() {
    try {
        const RAPIER_MODULE = await import('@dimforge/rapier3d-compat');
        RAPIER = RAPIER_MODULE.default; await RAPIER.init();
        world = new RAPIER.World({ x: 0, y: -9.81, z: 0 }); world.timestep = 1/60;
        worldBuilder.createPhysicsColliders(world, RAPIER);
        vehicle = new Vehicle(scene, world, RAPIER); vehicle.setUpgrades(saveData);
        physReady = true; window.restartJob();
        
        qaManager = new QAManager(scene, camera, renderer, vehicle, worldBuilder);
        
        document.getElementById('loading-screen').classList.add('hidden');
    } catch (e) { console.error(e); document.getElementById('loading-screen').classList.add('hidden'); }
}
initPhysics();

// ==========================================
// ADVANCED GPS MINIMAP DRAWING
// ==========================================
function drawMinimap() {
    if (!vehicle) return;
    
    miniCtx.clearRect(0, 0, 180, 180);
    const cx = 90, cy = 90, scale = 0.4;
    const vx = vehicle.mesh.position.x, vz = vehicle.mesh.position.z;
    
    miniCtx.strokeStyle = "rgba(77, 225, 193, 0.15)"; 
    miniCtx.lineWidth = 1;
    miniCtx.beginPath();
    miniCtx.arc(cx, cy, 40, 0, Math.PI * 2); miniCtx.stroke();
    miniCtx.beginPath();
    miniCtx.moveTo(cx, 0); miniCtx.lineTo(cx, 180);
    miniCtx.moveTo(0, cy); miniCtx.lineTo(180, cy);
    miniCtx.stroke();

    let targetX, targetZ;
    if (vehicle.hasDirt) {
        targetX = 18; targetZ = -100;
    } else {
        targetX = 0; targetZ = -100;
    }

    const mx = cx + (targetX - vx) * scale;
    const my = cy + (targetZ - vz) * scale;
    
    miniCtx.strokeStyle = "#4de1c1";
    miniCtx.lineWidth = 2;
    miniCtx.setLineDash([6, 6]);
    miniCtx.lineDashOffset = -Date.now() / 50;
    miniCtx.beginPath();
    miniCtx.moveTo(cx, cy);
    
    const distToCenter = Math.hypot(mx - cx, my - cy);
    const maxRadius = 85;
    
    let drawMx = mx;
    let drawMy = my;
    
    if (distToCenter > maxRadius) {
        const angle = Math.atan2(my - cy, mx - cx);
        drawMx = cx + Math.cos(angle) * maxRadius;
        drawMy = cy + Math.sin(angle) * maxRadius;
    }
    
    miniCtx.lineTo(drawMx, drawMy);
    miniCtx.stroke();
    miniCtx.setLineDash([]);

    if (distToCenter <= maxRadius) {
        miniCtx.fillStyle = vehicle.hasDirt ? "#2563eb" : "#ff3333";
        miniCtx.beginPath();
        miniCtx.arc(mx, my, 5, 0, Math.PI * 2);
        miniCtx.fill();
    } else {
        miniCtx.fillStyle = vehicle.hasDirt ? "#2563eb" : "#ff3333";
        miniCtx.beginPath();
        miniCtx.arc(drawMx, drawMy, 4, 0, Math.PI * 2);
        miniCtx.fill();
    }

    miniCtx.save(); 
    miniCtx.translate(cx, cy);
    const euler = new THREE.Euler().setFromQuaternion(vehicle.mesh.quaternion, 'YXZ'); 
    miniCtx.rotate(-euler.y);
    
    miniCtx.fillStyle = "#ffffff"; 
    miniCtx.shadowColor = "#4de1c1";
    miniCtx.shadowBlur = 10;
    miniCtx.beginPath(); 
    miniCtx.moveTo(0, -8); 
    miniCtx.lineTo(6, 8); 
    miniCtx.lineTo(0, 4);
    miniCtx.lineTo(-6, 8); 
    miniCtx.closePath();
    miniCtx.fill(); 
    miniCtx.restore();
}

const clock = new THREE.Clock();

// ---- Fixed 60 Hz physics (same speed on 30, 60, 144, 165, 240 Hz screens) ----
const FIXED_DT = 1 / 60, MAX_STEPS = 6;
let physAcc = 0;
function advanceAccumulator(acc, frameDt) {
    acc += Math.min(frameDt, 0.1);
    let steps = 0;
    while (acc >= FIXED_DT - 1e-9 && steps < MAX_STEPS) { acc -= FIXED_DT; steps++; }
    if (steps === MAX_STEPS && acc >= FIXED_DT) acc = 0;
    return { acc, steps };
}

// Console test: type __testTimestep() in the F12 console. Every row must show 60.0
window.__testTimestep = function () {
    const rates = [30, 60, 75, 120, 144, 165, 240];
    const seconds = 10;
    const rows = rates.map((hz) => {
        let acc = 0, total = 0;
        const frames = hz * seconds;
        for (let i = 0; i < frames; i++) { const r = advanceAccumulator(acc, 1 / hz); acc = r.acc; total += r.steps; }
        return { refreshHz: hz, stepsPerSecond: (total / seconds).toFixed(1) };
    });
    console.table(rows);
    return rows;
};

// Debug overlay: press the Backquote key (`). Only in dev mode or with ?debug in the URL
const DEBUG_ENABLED = !!import.meta.env.DEV || new URLSearchParams(location.search).has('debug');
let dbgEl = null, dbgSteps = 0, dbgFrames = 0, dbgTime = 0;
function toggleDebugOverlay() {
    if (!DEBUG_ENABLED) return;
    if (!dbgEl) {
        dbgEl = document.createElement('div');
        dbgEl.style.cssText = 'position:fixed;left:8px;top:64px;z-index:2000;padding:4px 8px;background:rgba(0,0,0,0.65);color:#7cfc9a;font:12px/1.4 monospace;pointer-events:none;border-radius:4px;';
        dbgEl.textContent = 'physics -- steps/s | render -- fps';
        document.body.appendChild(dbgEl);
    } else {
        dbgEl.style.display = dbgEl.style.display === 'none' ? 'block' : 'none';
    }
}
function debugTick(frameDt, stepsThisFrame) {
    dbgSteps += stepsThisFrame; dbgFrames++; dbgTime += frameDt;
    if (dbgTime >= 1) {
        if (dbgEl && dbgEl.style.display !== 'none') {
            dbgEl.textContent = 'physics ' + (dbgSteps / dbgTime).toFixed(1) + ' steps/s | render ' + (dbgFrames / dbgTime).toFixed(0) + ' fps';
        }
        dbgSteps = 0; dbgFrames = 0; dbgTime = 0;
    }
}

function initFx() {
    safe(() => {
        fx = new JobEffects(scene, camera, worldBuilder, vehicle);
        guide = new Guidance(scene, camera, renderer);
        sfx = new SoundFX(); sfx.scoop = () => {}; sfx.complete = () => {}; sfx.coin = () => sfx2.coin();
        guide.startTutorial(); tutStep = 1;
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 60, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        beam.visible = false; scene.add(beam); scene.userData.beam = beam;
        const maxA = renderer.capabilities.getMaxAnisotropy();
        scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { if (m.map) { m.map.anisotropy = maxA; m.map.needsUpdate = true; } }); });
    });
}
function updateFx(dt) {
    if (!fx && !guide) initFx();
    safe(() => {
        if (fx) fx.update(dt);
        if (guide) {
            let key = 'none', pos = null;
            if (!jobCompleted) {
                if (vehicle.hasDirt) { key = 'truck'; pos = worldBuilder.truckGroup.position.clone(); }
                else { key = 'pile'; pos = worldBuilder.dirtPileGroup.position.clone(); }
            }
            if (key !== lastTarget) { lastTarget = key; guide.setTarget(pos); }
            const bm = scene.userData.beam;
            if (bm) { bm.visible = false; if (pos) { bm.position.set(pos.x, 30, pos.z); bm.material.opacity = 0.16 + 0.08 * Math.sin(performance.now() / 300); } }
            if (tutStep === 1 && pos && vehicle.mesh.position.distanceTo(worldBuilder.dirtPileGroup.position) < 25) { guide.nextTutorialStep(); tutStep = 2; }
            guide.update(dt);
        }
    });
}
function animate() {
    requestAnimationFrame(animate);
    const frameDt = clock.getDelta();
    if (isGameRunning && physReady && world && vehicle) {
        const dt = Math.min(frameDt, 0.05);
        const adv = advanceAccumulator(physAcc, frameDt);
        physAcc = adv.acc;
        for (let s = 0; s < adv.steps; s++) {
            vehicle.updateController(input, FIXED_DT);
            world.step();
            vehicle.capturePhysicsState();
        }
        vehicle.renderAlpha = Math.max(0, Math.min(1, physAcc / FIXED_DT));
        debugTick(frameDt, adv.steps);
        // physics now runs in the fixed-step loop above
        // physics step moved to the fixed-step loop above
        vehicle.updateVisuals(audio, dt);
        cameraManager.update(vehicle.mesh, dt, vehicle.currentSpeed);
        drawMinimap();

        const speedValEl = document.getElementById('speed-val');
        if (speedValEl) speedValEl.textContent = vehicle.currentSpeed;
        
        const speedBarEl = document.getElementById('speed-bar');
        if (speedBarEl) {
            const percentage = Math.min(100, (vehicle.currentSpeed / 120) * 100);
            speedBarEl.style.width = `${percentage}%`;
        }

        if (cameraShake > 0) {
            camera.position.x += (Math.random() - 0.5) * cameraShake;
            camera.position.y += (Math.random() - 0.5) * cameraShake;
            camera.position.z += (Math.random() - 0.5) * cameraShake;
            cameraShake -= dt * 2; 
        }

        if (input.forward || input.backward) audio.playEngine(1.0);
        else audio.playEngine(0.0);

        if (!jobCompleted) {
            const bucketPos = new THREE.Vector3(); vehicle.bucketPivot.getWorldPosition(bucketPos);
            
            if (!hasScoopedDirt && vehicle.hasDirt) {
                hasScoopedDirt = true;
                const statusVal = document.getElementById('job-status-val'); if(statusVal) statusVal.textContent = 'DUMP IN TRUCK';
                worldBuilder.shrinkDirtPile();
                safe(() => { if (fx) fx.onScoop(bucketPos.clone()); if (sfx) sfx.scoop(); if (guide && tutStep === 2) { guide.nextTutorialStep(); tutStep = 3; } }); 
                audio.playDirtCrunch(); 
            }

            if (hasScoopedDirt && !vehicle.hasDirt) {
                const truckBedPos = worldBuilder.truckGroup.position.clone().add(new THREE.Vector3(0, 2, -1));
                if (hasScoopedDirt && !vehicle.hasDirt && bucketPos.distanceTo(truckBedPos) >= 10) { hasScoopedDirt = false; safe(() => { if (ui) ui.toast('Missed the truck - scoop again', 'warn'); }); }
                if (bucketPos.distanceTo(truckBedPos) < 10) {
                    hasScoopedDirt = false;
                    worldBuilder.addDirtToTruck();
                    audio.playDumpThud();
                    safe(() => { if (fx) fx.onDump(worldBuilder.truckGroup.position.clone(), bucketPos.clone()); if (sfx) sfx.coin(); if (guide && tutStep === 3) { guide.nextTutorialStep(); tutStep = 4; } });
                    cameraShake = 0.5;
                    
                    if (worldBuilder.truckDirtLevel < MAX_LOADS) {
                        const statusVal = document.getElementById('job-status-val'); 
                        if(statusVal) statusVal.textContent = `SCOOP DIRT (${worldBuilder.truckDirtLevel}/3)`;
                        audio.playScoop();
                    } else {
                        jobCompleted = true; 
                        saveData.coins += 150;
                        safe(() => { if (ui) { const r = jm ? jm.complete() : null; ui.setTimer(null); ui.toast('Job complete! +150 coins' + (r && r.stars ? '  ' + r.stars + ' star(s)' : ''), 'success'); } }); 
                        writeSave();
                        const coinCount = document.getElementById('coin-count'); if(coinCount) coinCount.textContent = saveData.coins;
                        const statusVal = document.getElementById('job-status-val'); if(statusVal) statusVal.textContent = 'COMPLETE!';
                        const overlay = document.getElementById('victory-overlay'); if(overlay && !fx) overlay.classList.add('active');
                        audio.playSuccess();
                        safe(() => { if (fx) fx.showJobComplete(saveData.coins, () => window.restartJob()); if (sfx) sfx.complete(); });
                        try { window.CrazyGames.SDK.game.happytime(); } catch(e) {}
                    }
                }
            }
        }
        updateSunShadow();
        trackFPS(dt);
        updateFx(dt);
        vehicle.pilePos = worldBuilder.dirtPileGroup.position;
        if (!vehicle.truckPos) vehicle.truckPos = worldBuilder.truckGroup.position.clone().add(new THREE.Vector3(0, 2, -1));
        updateUi(dt);
        updateDig(dt);
        renderFrame();
    }
}
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
});
animate();



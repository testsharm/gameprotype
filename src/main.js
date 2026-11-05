import * as THREE from 'three';
import { Vehicle } from './vehicle/Vehicle.js';
import { AudioHub } from './core/Audio.js';
import { CameraManager } from './core/CameraManager.js';
import { World } from './core/World.js';
import { QAManager } from './core/QAManager.js';
import JobEffects from './gameplay/JobEffects.js';
import Guidance from './gameplay/Guidance.js';
// (SoundFX removed in M2: all sound is in core/Audio.js)
// (Sfx2 removed in M2)
import DigAnimator from './vehicle/DigAnimator.js';
// (DigSound removed in M2)
import GameUI from './ui/GameUI.js';
// (Music removed in M2)
import TrafficPhysics from './core/TrafficPhysics.js';
import { JobSystem, JobPanels, buildSiteDressing, upgradeCost } from './gameplay/Jobs.js';

let fx = null, guide = null, sfx = null, tutStep = 0, lastTarget = 'none';
function safe(f) { try { return f(); } catch (e) { console.warn('[fx]', e); } }
let ui = null, music = null, trafficPhys = null, jm = null, currentJob = 1, lastLoads = 0, lastCoinsShown = -1;
const JOB_TITLE = 'Clear the Highway', JOB_OBJ = 'Load the blue truck with dirt';
let dig = null, digSound = null;
const dm = { fill: 1, drop: -1, b: 0, k: 0, was: false };
function updateDig(dt) {
    safe(() => {
        if (!dig && vehicle) {
            dig = new DigAnimator(vehicle, THREE);
            window.addEventListener('bh-dig', e => { if (!dig.busy) { dig.start(e.detail); } });
            dig.onEvent = (n) => {
                hub.dig(dig._type, n);
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
        music = hub;
        ensureJobs();
        jm.onTick = (t) => { if (ui) ui.setTimer(Math.ceil(t)); };
        jm.onFail = onJobFail;
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
            const lv = lastLoads;
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

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.5, 1400);
const cameraManager = new CameraManager(camera, canvas);
const worldBuilder = new World(scene);
cameraManager.setCollidables([...worldBuilder.buildingMeshes, ...worldBuilder.treeMeshes]);

cameraManager.setMode('bucket');
document.querySelectorAll('.cam-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'bucket'));

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: false });
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
    worldBuilder.hemiLight.intensity = 0.8;
    worldBuilder.hemiLight.color.set(0xbfd4ff);
    worldBuilder.hemiLight.groundColor.set(0x7a8a66);
}
scene.fog = new THREE.FogExp2(0xdfe9f3, 0.0020);
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
const hub = new AudioHub();
const audio = hub; // old name kept: Vehicle.updateVisuals(audio, dt) still receives it
function toggleMute() {
    const m = hub.toggleMute();
    window.dispatchEvent(new CustomEvent('bh-mute', { detail: !!m }));
    safe(() => { if (ui) ui.toast(m ? 'Sound off (press M to turn on)' : 'Sound on', m ? 'warn' : 'success'); });
}
// (Sfx2 removed in M2)
audio.playDirtCrunch = () => {};
audio.playScoop = () => {};
audio.playDumpThud = () => {};
audio.playSuccess = () => hub.complete();
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

const shopBtn = document.getElementById('shop-btn'); if(shopBtn) shopBtn.addEventListener('click', () => { openShop(); });
const closeShopBtn = document.getElementById('close-shop-btn'); if(closeShopBtn) closeShopBtn.addEventListener('click', () => { document.getElementById('shop-overlay').classList.remove('active'); isGameRunning = true; });

const buyEngBtn = document.getElementById('buy-engine-btn'); if(buyEngBtn) buyEngBtn.addEventListener('click', () => { const cost = saveData.engineLevel * 100; if (saveData.coins >= cost && saveData.engineLevel < 3) { saveData.coins -= cost; saveData.engineLevel++; writeSave(); document.getElementById('coin-count').textContent = saveData.coins; if (vehicle) vehicle.setUpgrades(saveData); updateShopUI(); } });
const buyHydBtn = document.getElementById('buy-hydraulic-btn'); if(buyHydBtn) buyHydBtn.addEventListener('click', () => { const cost = saveData.hydraulicLevel * 100; if (saveData.coins >= cost && saveData.hydraulicLevel < 3) { saveData.coins -= cost; saveData.hydraulicLevel++; writeSave(); document.getElementById('coin-count').textContent = saveData.coins; if (vehicle) vehicle.setUpgrades(saveData); updateShopUI(); } });

const input = { forward: false, backward: false, left: false, right: false, brake: false };

// ---- Pause (P key and the Pause / Resume buttons). The shop has its own pause. ----
let paused = false;
function togglePause() {
    const shop = document.getElementById('shop-overlay');
    if ((shop && shop.classList.contains('active')) || modalOpen) return;
    paused = !paused;
    isGameRunning = !paused;
    const ov = document.getElementById('pause-overlay');
    if (ov) ov.classList.toggle('active', paused);
    if (paused) {
        input.forward = false; input.backward = false; input.left = false; input.right = false; input.brake = false;
        safe(() => hub.setEngine(0, 0));
    }
}
// tell the Sound button the saved mute state at start
safe(() => window.dispatchEvent(new CustomEvent('bh-mute', { detail: !!hub.isMuted() })));

// ---- Keys by physical position (event.code), so AZERTY and other layouts work ----
const CODE_TO_KEY = {
    KeyW: 'w', ArrowUp: 'arrowup', KeyS: 's', ArrowDown: 'arrowdown',
    KeyA: 'a', ArrowLeft: 'arrowleft', KeyD: 'd', ArrowRight: 'arrowright',
    Space: ' ', KeyE: 'e', KeyF: 'f', KeyC: 'c', KeyR: 'r', KeyM: 'm', KeyP: 'p', KeyJ: 'j', KeyU: 'u'
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
    if (key === 'm') toggleMute();
    if (key === 'j') openPicker();
    if (key === 'u') openShop();
    if (key === 'p') {
      const wasPaused = paused;
      togglePause();
      if (paused !== wasPaused) {
        try {
          if (paused) { window.__muteBeforePause = hub.isMuted(); hub.setMuted(true); }
          else { hub.setMuted(!!window.__muteBeforePause); }
        } catch (e) { /* audio not ready */ }
      }
    }
    if (key === 'e' && vehicle && isGameRunning) vehicle.toggleArm();
    if (key === 'f' && vehicle && isGameRunning) vehicle.autoAction();
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
    hasScoopedDirt = false; jobCompleted = false; closeJobModal();
    const overlay = document.getElementById('victory-overlay'); if(overlay) overlay.classList.remove('active');
    const statusVal = document.getElementById('job-status-val'); if(statusVal) statusVal.textContent = 'SCOOP DIRT (0/3)';
    const missionDesc = document.getElementById('mission-desc'); if(missionDesc) missionDesc.textContent = 'Clear the rubble from the highway and load it into the blue truck.';
    
    ensureJobs(); worldBuilder.resetDirtPile(); placeSite(currentJob);
    safe(() => { if (fx) fx.reset(); lastTarget = 'none'; });
    lastLoads = 0; startJobNow();
    
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
        targetX = siteNow.truck.x; targetZ = siteNow.truck.z;
    } else {
        targetX = siteNow.pile.x; targetZ = siteNow.pile.z;
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

// ---- Keep the camera in front of buildings (no more wall blocking the view) ----
const _camFocus = new THREE.Vector3();
const _camDir = new THREE.Vector3();
let camClearT = 1;
function keepCameraClear(dt) {
    if (!vehicle || !worldBuilder || !worldBuilder.buildingData) return;
    if (cameraManager.currentMode === 'cab') { camClearT = 1; return; }
    _camFocus.copy(vehicle.mesh.position);
    _camFocus.y += 2.2;
    _camDir.copy(camera.position).sub(_camFocus);
    const len = _camDir.length();
    if (len < 0.5) return;
    const o = [_camFocus.x, _camFocus.y, _camFocus.z];
    const d = [_camDir.x, _camDir.y, _camDir.z];
    const margin = 0.6;
    let tHit = 1;
    const boxes = worldBuilder.buildingData;
    for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        const c = [b.x, b.y, b.z];
        const h = [b.w / 2 + margin, b.h / 2 + margin, b.d / 2 + margin];
        let tmin = 0, tmax = 1, ok = true, inside = true;
        for (let a = 0; a < 3; a++) {
            const lo = c[a] - h[a], hi = c[a] + h[a];
            if (o[a] < lo || o[a] > hi) inside = false;
            if (Math.abs(d[a]) < 1e-8) {
                if (o[a] < lo || o[a] > hi) { ok = false; break; }
            } else {
                let t1 = (lo - o[a]) / d[a], t2 = (hi - o[a]) / d[a];
                if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
                if (t1 > tmin) tmin = t1;
                if (t2 < tmax) tmax = t2;
                if (tmin > tmax) { ok = false; break; }
            }
        }
        if (!ok || inside) continue;
        if (tmin > 0 && tmin < tHit) tHit = tmin;
    }
    const want = tHit < 1 ? Math.max(0.12, tHit - 0.04) : 1;
    if (want < camClearT) camClearT = want;
    else camClearT += (want - camClearT) * Math.min(1, dt * 4);
    if (camClearT < 0.999) {
        camera.position.copy(_camFocus).addScaledVector(_camDir, camClearT);
    }
}

// ======================================================================
// M7a part 2: real jobs, sites per job, weather, shop, result windows
// ======================================================================
let panels = null;
let modalOpen = false;
const _truckOff = new THREE.Vector3(0, 2, -1);
const _tmpC = new THREE.Color();
const siteNow = { pile: { x: 0, z: -120 }, truck: { x: 15, z: -120 } };
let siteBase = null;
let truckBody = null;
const siteGroups = new Map();

function ensureJobs() {
    if (!jm) {
        jm = new JobSystem();
        panels = new JobPanels();
        jm.layout(worldBuilder.buildingData, worldBuilder.propColliders);
    }
    return jm;
}
function jobCtx() { return { engineLevel: saveData.engineLevel || 1, bucketLevel: saveData.bucketLevel || 1 }; }
function syncCoins() {
    safe(() => {
        if (ui) { ui.setCoins(saveData.coins); lastCoinsShown = saveData.coins; }
        else { const c = document.getElementById('coin-count'); if (c) c.textContent = saveData.coins; }
    });
}
function refreshCard() {
    safe(() => { if (ui && jm) ui.setJob(jm.current.name, jm.objective(), jm.stepText()); });
}
function openModalState() {
    modalOpen = true;
    isGameRunning = false;
    input.forward = false; input.backward = false; input.left = false; input.right = false; input.brake = false;
    safe(() => hub.setEngine(0, 0));
}
function closeJobModal() {
    if (panels) panels.hide();
    modalOpen = false;
    if (!paused) isGameRunning = true;
}

// ---- where the pile and the truck stand for each job ----
function captureBase() {
    if (siteBase) return;
    const pg = worldBuilder.dirtPileGroup, tg = worldBuilder.truckGroup;
    if (!pg || !tg) return;
    pg.updateMatrixWorld(true); tg.updateMatrixWorld(true);
    const pb = new THREE.Box3().setFromObject(pg), tb = new THREE.Box3().setFromObject(tg);
    const pc = pb.isEmpty() ? pg.getWorldPosition(new THREE.Vector3()) : pb.getCenter(new THREE.Vector3());
    const tc = tb.isEmpty() ? tg.getWorldPosition(new THREE.Vector3()) : tb.getCenter(new THREE.Vector3());
    const th = tb.isEmpty() ? new THREE.Vector3(0, 0, 0) : tb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    siteBase = { pPos: pg.position.clone(), tPos: tg.position.clone(), pc, tc, th };
    siteNow.pile.x = pc.x; siteNow.pile.z = pc.z; siteNow.truck.x = tc.x; siteNow.truck.z = tc.z;
}
function syncTruckCollider(moved, tx, tz) {
    if (!world || !RAPIER || !siteBase) return;
    const h = siteBase.th;
    if (!(h.x > 0.5 && h.x < 7 && h.z > 0.5 && h.z < 10 && h.y > 0.5)) return;
    const y = siteBase.tc.y;
    const pos = moved ? { x: tx, y: y, z: tz } : { x: 0, y: -80, z: 0 };
    if (!truckBody) {
        truckBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z));
        world.createCollider(RAPIER.ColliderDesc.cuboid(h.x * 0.9, h.y * 0.95, h.z * 0.9), truckBody);
    } else {
        truckBody.setTranslation(pos, true);
    }
}
function placeSite(id) {
    safe(() => {
        const job = jm.get(id) || jm.get(1);
        setEnv(job.env, !envGoal);
        captureBase();
        if (!siteBase) return;
        const lay = jm.siteFor(id);
        const moved = !!(lay && lay.ok && !lay.keep);
        const pg = worldBuilder.dirtPileGroup, tg = worldBuilder.truckGroup;
        const px = moved ? lay.pile.x : siteBase.pc.x, pz = moved ? lay.pile.z : siteBase.pc.z;
        const tx = moved ? lay.truck.x : siteBase.tc.x, tz = moved ? lay.truck.z : siteBase.tc.z;
        pg.position.set(siteBase.pPos.x + (px - siteBase.pc.x), siteBase.pPos.y, siteBase.pPos.z + (pz - siteBase.pc.z));
        tg.position.set(siteBase.tPos.x + (tx - siteBase.tc.x), siteBase.tPos.y, siteBase.tPos.z + (tz - siteBase.tc.z));
        pg.updateMatrixWorld(true); tg.updateMatrixWorld(true);
        siteNow.pile.x = px; siteNow.pile.z = pz; siteNow.truck.x = tx; siteNow.truck.z = tz;
        syncTruckCollider(moved, tx, tz);
        siteGroups.forEach((g, k) => { g.visible = (k === id); });
        if (moved && !siteGroups.has(id)) {
            const g = buildSiteDressing(THREE, id, lay.pile, lay.truck);
            scene.add(g);
            siteGroups.set(id, g);
        }
    });
}

// ---- sky, light, fog and rain for each job ----
const ENV_EXPO = { day: 1.0, dusk: 0.92, night: 0.62, storm: 0.8, dawn: 0.97 };
const ENV_TINT = { day: 0, dusk: 0.35, night: 0.5, storm: 0.6, dawn: 0.3 };
const envCur = { sun: 2.2, hemi: 0.8, fog: 0.0011, r: 0.62, g: 0.76, b: 0.9, expo: 1, tint: 0, bright: 1, light: 0 };
let envGoal = null;
let skyU = null;
let workLight = null;
function setEnv(e, instant) {
    const c = new THREE.Color(e.fogColor);
    envGoal = {
        sun: 2.2 * e.sun, hemi: 0.8 * e.hemi, fog: e.fog, r: c.r, g: c.g, b: c.b,
        expo: ENV_EXPO[e.id] || 1, tint: ENV_TINT[e.id] || 0, bright: 0.5 + 0.5 * e.sun,
        light: e.lights ? 230 : (e.id === 'storm' ? 70 : 0), rain: e.id === 'storm'
    };
    if (instant) Object.assign(envCur, envGoal);
}
function updateEnv(dt) {
    if (!envGoal) return;
    if (vehicle && !workLight) {
        workLight = new THREE.PointLight(0xfff1cf, 0, 42, 2);
        workLight.position.set(0, 4.2, 0);
        vehicle.mesh.add(workLight);
    }
    const k = 1 - Math.exp(-dt * 2.2);
    const names = ['sun', 'hemi', 'fog', 'r', 'g', 'b', 'expo', 'tint', 'bright', 'light'];
    for (let i = 0; i < names.length; i++) envCur[names[i]] += (envGoal[names[i]] - envCur[names[i]]) * k;
    if (worldBuilder.sunLight) worldBuilder.sunLight.intensity = envCur.sun;
    if (worldBuilder.hemiLight) worldBuilder.hemiLight.intensity = envCur.hemi;
    if (scene.fog) {
        if ('density' in scene.fog) scene.fog.density = envCur.fog;
        scene.fog.color.setRGB(envCur.r, envCur.g, envCur.b);
    }
    if (scene.background && scene.background.isColor) scene.background.setRGB(envCur.r, envCur.g, envCur.b);
    renderer.toneMappingExposure = envCur.expo;
    if (workLight) workLight.intensity = envCur.light;
    const sky = worldBuilder.sky;
    if (sky && sky.material && sky.material.uniforms) {
        if (!skyU) {
            skyU = [];
            for (const key in sky.material.uniforms) {
                const v = sky.material.uniforms[key] && sky.material.uniforms[key].value;
                if (v && v.isColor) skyU.push({ v, o: v.clone() });
            }
        }
        _tmpC.setRGB(envCur.r, envCur.g, envCur.b);
        for (let i = 0; i < skyU.length; i++) skyU[i].v.copy(skyU[i].o).multiplyScalar(envCur.bright).lerp(_tmpC, envCur.tint);
    }
}
const RAIN_N = 650;
let rain = null, rainDrop = null;
function updateRain(dt) {
    const on = !!(envGoal && envGoal.rain);
    if (!rain) {
        if (!on) return;
        rainDrop = new Float32Array(RAIN_N * 3);
        const geo = new THREE.BufferGeometry();
        const attr = new THREE.BufferAttribute(new Float32Array(RAIN_N * 6), 3);
        attr.setUsage(THREE.DynamicDrawUsage);
        geo.setAttribute('position', attr);
        rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xbcd0e2, transparent: true, opacity: 0.4, depthWrite: false, fog: false }));
        rain.frustumCulled = false;
        rain.renderOrder = 5;
        scene.add(rain);
        for (let i = 0; i < RAIN_N; i++) {
            rainDrop[i * 3] = camera.position.x + (Math.random() - 0.5) * 60;
            rainDrop[i * 3 + 1] = camera.position.y - 8 + Math.random() * 30;
            rainDrop[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 60;
        }
    }
    rain.visible = on;
    if (!on) return;
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    const p = rain.geometry.attributes.position.array;
    for (let i = 0; i < RAIN_N; i++) {
        let x = rainDrop[i * 3], y = rainDrop[i * 3 + 1], z = rainDrop[i * 3 + 2];
        y -= 26 * dt; x -= 2.5 * dt;
        if (y < cy - 8) y += 30; else if (y > cy + 22) y -= 30;
        const ddx = x - cx; if (ddx > 30) x -= 60; else if (ddx < -30) x += 60;
        const ddz = z - cz; if (ddz > 30) z -= 60; else if (ddz < -30) z += 60;
        rainDrop[i * 3] = x; rainDrop[i * 3 + 1] = y; rainDrop[i * 3 + 2] = z;
        p[i * 6] = x; p[i * 6 + 1] = y; p[i * 6 + 2] = z;
        p[i * 6 + 3] = x + 0.08; p[i * 6 + 4] = y + 1.3; p[i * 6 + 5] = z;
    }
    rain.geometry.attributes.position.needsUpdate = true;
}

// ---- job flow ----
function startJobNow() {
    ensureJobs();
    jm.start(currentJob);
    const j = jm.current;
    refreshCard();
    safe(() => { if (ui) ui.setHint(jm.hint()); });
    safe(() => { if (ui) ui.announce(j); });
}
function goJob(id) {
    ensureJobs();
    if (jm.lockReason(id, jobCtx())) return;
    currentJob = id;
    window.restartJob();
}
function onScooped() {
    if (!jm) return;
    jm.setPhase('dump');
    refreshCard();
    if (ui) ui.setHint(jm.hint());
}
function deliverLoad() {
    ensureJobs();
    const r = jm.addLoad(jobCtx());
    if (!r) return false;
    saveData.coins += r.tip;
    writeSave();
    safe(() => {
        if (ui) {
            if (!r.complete) ui.toast('Load ' + r.loads + ' of ' + r.total + ' delivered  +' + r.tip + ' coins', 'success');
            ui.setCoins(saveData.coins); lastCoinsShown = saveData.coins;
        }
        refreshCard();
        if (!r.complete && ui) ui.setHint(jm.hint());
    });
    if (!r.complete && r.loads % 3 === 0) {
        setTimeout(() => safe(() => {
            if (!jm || !jm.state.running) return;
            worldBuilder.truckDirtMeshes.forEach(m => worldBuilder.truckGroup.remove(m));
            worldBuilder.truckDirtMeshes = [];
            worldBuilder.truckDirtLevel = 0;
            if (ui) ui.toast('Truck is full. A new truck is here.', 'info');
        }), 1500);
    }
    return r.complete;
}
function finishJob() {
    ensureJobs();
    const r = jm.complete(jobCtx());
    saveData.coins += r.coins;
    writeSave();
    setTimeout(() => safe(() => {
        if (!jobCompleted) return;
        openModalState();
        syncCoins();
        panels.showResult(r, {
            onNext: (id) => goJob(id),
            onReplay: () => window.restartJob(),
            onJobs: () => openPicker()
        });
    }), 1700);
}
function onJobFail() {
    safe(() => {
        openModalState();
        panels.showFail(jm.current, jm.state.loads, {
            onRetry: () => window.restartJob(),
            onJobs: () => openPicker()
        });
    });
}
function openPicker() {
    safe(() => {
        ensureJobs();
        openModalState();
        panels.showPicker(jm, jobCtx(), {
            onPick: (id) => goJob(id),
            onClose: () => closeJobModal(),
            onCoins: (amt) => {
                saveData.coins += amt; writeSave(); syncCoins();
                if (ui) { ui.toast('Daily bonus +' + amt + ' coins', 'success'); ui.setMenuDot(false); }
                safe(() => hub.coin());
            }
        });
    });
}
function buyUpgrade(kind) {
    const key = kind === 'engine' ? 'engineLevel' : kind === 'hydraulic' ? 'hydraulicLevel' : 'bucketLevel';
    const lv = saveData[key] || 1;
    const cost = upgradeCost(kind, lv, 0);
    if (cost === null || saveData.coins < cost) return false;
    saveData.coins -= cost;
    saveData[key] = lv + 1;
    writeSave();
    if (vehicle) vehicle.setUpgrades(saveData);
    syncCoins();
    safe(() => hub.coin());
    return true;
}
function openShop() {
    safe(() => {
        ensureJobs();
        openModalState();
        panels.showShop(
            () => ({ coins: saveData.coins, levels: { engine: saveData.engineLevel || 1, hydraulic: saveData.hydraulicLevel || 1, bucket: saveData.bucketLevel || 1 } }),
            { onBuy: (k) => buyUpgrade(k), onClose: () => closeJobModal() }
        );
    });
}

// Jobs button next to the Upgrades button (key J does the same)
safe(() => {
    const sb = document.getElementById('shop-btn');
    if (sb && !document.getElementById('jobs-btn')) {
        const b = document.createElement('button');
        b.id = 'jobs-btn';
        b.type = 'button';
        b.className = sb.className;
        b.textContent = 'Jobs';
        b.addEventListener('click', () => { b.blur(); openPicker(); });
        sb.insertAdjacentElement('afterend', b);
    }
});
safe(() => { if (import.meta.env.DEV && /[?&]rich/.test(location.search)) saveData.coins = Math.max(saveData.coins, 3000); });
setTimeout(() => safe(() => {
    ensureJobs();
    if (ui && jm.dailyStatus().canClaim) { ui.setMenuDot(true); ui.toast('Daily bonus ready!', 'success'); }
}), 3000);

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
            dbgEl.textContent = 'physics ' + (dbgSteps / dbgTime).toFixed(1) + ' steps/s | render ' + (dbgFrames / dbgTime).toFixed(0) + ' fps | ' + hub.debugText();
        }
        dbgSteps = 0; dbgFrames = 0; dbgTime = 0;
    }
}

function initFx() {
    safe(() => {
        fx = new JobEffects(scene, camera, worldBuilder, vehicle);
        guide = new Guidance(scene, camera, renderer);
        sfx = { scoop() {}, complete() {}, coin() { hub.coin(); } };
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
                if (vehicle.hasDirt) { key = 'truck'; pos = new THREE.Vector3(siteNow.truck.x, 0, siteNow.truck.z); }
                else { key = 'pile'; pos = new THREE.Vector3(siteNow.pile.x, 0, siteNow.pile.z); }
            }
            if (key !== lastTarget) { lastTarget = key; guide.setTarget(pos); }
            const bm = scene.userData.beam;
            if (bm) { bm.visible = false; if (pos) { bm.position.set(pos.x, 30, pos.z); bm.material.opacity = 0.16 + 0.08 * Math.sin(performance.now() / 300); } }
            if (tutStep === 1 && pos && vehicle.mesh.position.distanceTo(pos) < 25) { guide.nextTutorialStep(); tutStep = 2; }
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
        keepCameraClear(dt);
        if (worldBuilder.sky) worldBuilder.sky.position.copy(camera.position);
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

        if (input.forward || input.backward) hub.setEngine(vehicle.currentSpeed, 1);
        else hub.setEngine(vehicle.currentSpeed, 0);

        if (!jobCompleted) {
            const bucketPos = new THREE.Vector3(); vehicle.bucketPivot.getWorldPosition(bucketPos);
            
            if (!hasScoopedDirt && vehicle.hasDirt) {
                hasScoopedDirt = true;
                const statusVal = document.getElementById('job-status-val'); if(statusVal) statusVal.textContent = 'DUMP IN TRUCK';
                worldBuilder.shrinkDirtPile(); safe(onScooped);
                safe(() => { if (fx) fx.onScoop(bucketPos.clone()); if (sfx) sfx.scoop(); if (guide && tutStep === 2) { guide.nextTutorialStep(); tutStep = 3; } }); 
                audio.playDirtCrunch(); 
            }

            if (hasScoopedDirt && !vehicle.hasDirt) {
                const truckBedPos = worldBuilder.truckGroup.position.clone().add(new THREE.Vector3(0, 2, -1));
                if (hasScoopedDirt && !vehicle.hasDirt && bucketPos.distanceTo(truckBedPos) >= 10) { hasScoopedDirt = false; safe(() => { if (ui) { ui.toast('Missed the truck - scoop again', 'warn'); if (jm) jm.setPhase('scoop'); refreshCard(); } }); }
                if (bucketPos.distanceTo(truckBedPos) < 10) {
                    hasScoopedDirt = false;
                    worldBuilder.addDirtToTruck();
                    audio.playDumpThud();
                    safe(() => { if (fx) fx.onDump(worldBuilder.truckGroup.position.clone(), bucketPos.clone()); if (sfx) sfx.coin(); if (guide && tutStep === 3) { guide.nextTutorialStep(); tutStep = 4; } });
                    cameraShake = 0.5;
                    
                    if (!deliverLoad()) {
                        const statusVal = document.getElementById('job-status-val'); 
                        if(statusVal) statusVal.textContent = `SCOOP DIRT (${worldBuilder.truckDirtLevel}/3)`;
                        audio.playScoop();
                    } else {
                        jobCompleted = true; 
                        finishJob();
                        safe(() => { if (ui) { const r = null; ui.setTimer(null); ui.toast('Job complete!' + (r && r.stars ? '  ' + r.stars + ' star(s)' : ''), 'success'); } }); 
                        writeSave();
                        const coinCount = document.getElementById('coin-count'); if(coinCount) coinCount.textContent = saveData.coins;
                        const statusVal = document.getElementById('job-status-val'); if(statusVal) statusVal.textContent = 'COMPLETE!';
                        const overlay = document.getElementById('victory-overlay'); /* old victory overlay is off: Jobs.js shows the result window */
                        audio.playSuccess();
                        safe(() => { if (fx) void 0; if (sfx) sfx.complete(); });
                        try { window.CrazyGames.SDK.game.happytime(); } catch(e) {}
                    }
                }
            }
        }
        updateSunShadow();
        trackFPS(dt);
        updateFx(dt);
        vehicle.pilePos = worldBuilder.dirtPileGroup.position;
        if (!vehicle.truckPos) vehicle.truckPos = new THREE.Vector3();
        vehicle.truckPos.copy(worldBuilder.truckGroup.position).add(_truckOff);
        safe(() => { updateEnv(dt); updateRain(dt); });
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



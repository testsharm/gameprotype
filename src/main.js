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
import { JobSystem, buildSiteDressing, rankInfo, JOBS as LEVEL_LIST } from './gameplay/Jobs.js';
import { LevelEngine, levelStartPose, CHAPTERS } from './gameplay/Levels.js';
import { CAMERA_LABELS } from './core/CameraManager.js';
import { Portal } from './core/Portal.js';
import Ads from './core/Ads.js';

let fx = null, guide = null, sfx = null, tutStep = 0, lastTarget = 'none';
function safe(f) { try { return f(); } catch (e) { console.warn('[fx]', e); } }
let lastHasDirt = false;
const START_LEVEL = (() => {
    try { const n = parseInt(new URLSearchParams(location.search).get('job'), 10); return n >= 1 && n <= 15 ? n : readLastJob(); }
    catch (e) { return readLastJob(); }
})();
let ui = null, music = null, trafficPhys = null, jm = null, currentJob = START_LEVEL, lastLoads = 0, lastCoinsShown = -1;
// UX milestone: the timer only exists while the player is actually playing.
const LAST_JOB_KEY = 'terraform_last_job_v1';
const QUALITY_KEY = 'terraform_quality_v1';
let gameState = 'menu';            // 'menu' | 'playing'
let uiPaused = false;              // drawer / window / pause open
let audioStarted = false;
let rawSite = null;                // unmodified site used for per-level start poses
let currentStartPose = null;
const portal = new Portal();
const UI_KEY = 'terraform_ui_v1';
// TIER 6: six real upgrades, four paid steps (100 / 250 / 500 / 900).
const GARAGE = [
  { key: 'engine', name: 'ENGINE', icon: 'gear', save: 'engineLevel', stat: 'TOP SPEED', lines: ['32 km/h', '37 km/h', '42 km/h', '47 km/h', '52 km/h'] },
  { key: 'hydraulic', name: 'HYDRAULICS', icon: 'dig', save: 'hydraulicLevel', stat: 'ARM SPEED', lines: ['100%', '160%', '220%', '280%', '340%'] },
  { key: 'bucket', name: 'BIG BUCKET', icon: 'dig', save: 'bucketLevel', stat: 'TIP / LOAD', lines: ['10 coins', '16 coins', '24 coins', '34 coins', '44 coins'] },
  { key: 'tyres', name: 'TYRES', icon: 'wheel', save: 'tyreLevel', stat: 'GRIP', lines: ['100%', '115%', '130%', '145%', '160%'] },
  { key: 'light', name: 'WORK LIGHT', icon: 'spark', save: 'lightLevel', stat: 'NIGHT LIGHT', lines: ['100%', '125%', '150%', '175%', '200%'] },
  { key: 'beacon', name: 'BEACON', icon: 'star', save: 'beaconLevel', stat: 'COIN BONUS', lines: ['+0%', '+3%', '+6%', '+10%', '+15%'] }
];
const GARAGE_PRICES = [100, 250, 500, 900];
const PAINTS = [0xffb400, 0x2f6fdb, 0x34d399, 0xef4444, 0xe5e7eb, 0x7c3aed];
const GARAGE_MAX = GARAGE_PRICES.length + 1;
let uiSettings = { big: false, lefty: false, guide: true };
try { const raw = localStorage.getItem(UI_KEY); if (raw) Object.assign(uiSettings, JSON.parse(raw)); } catch (e) {}
function writeUiSettings() { try { localStorage.setItem(UI_KEY, JSON.stringify(uiSettings)); } catch (e) {} }
const ads = new Ads({
  onPause: (on) => { if (on) { pauseForMenu(); } else { resumeGame(); } },
  onMute: (on) => { safe(() => hub.setAdMuted(on)); }
});
let lastResult = null, lastFail = null, freePlay = false;
function readLastJob() {
    try { const n = parseInt(localStorage.getItem(LAST_JOB_KEY), 10); return (n >= 1 && n <= 15) ? n : 1; }
    catch (e) { return 1; }
}
function writeLastJob(id) { try { localStorage.setItem(LAST_JOB_KEY, String(id)); } catch (e) {} }
function readQuality() { try { return localStorage.getItem(QUALITY_KEY); } catch (e) { return null; } }
function writeQuality(q) { try { localStorage.setItem(QUALITY_KEY, q); } catch (e) {} }
let level = null;
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
    if (ui) return;
    safe(() => {
        ui = new GameUI({
            action: (name, payload) => handleUiAction(name, payload),
            hold: (code, on) => actionHold(code, on),
            tap: (code) => actionTap(code),
            unlock: () => unlockAudio(),
            state: () => uiState(),
            data: () => uiData()
        });
        music = hub;
        ensureJobs();
        jm.onTick = (t) => { if (ui && gameState === 'playing' && !uiPaused) ui.setTimer(Math.ceil(t)); };
        jm.onFail = onJobFail;
        ui.setCoins(saveData.coins);
        ui.setTimer(null);
        window.addEventListener('bh-hint', e => { if (ui) ui.toast(e.detail, 'warn'); });
        refreshCard();
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
            if (level && level.job) {
                const hd = !!vehicle.hasDirt;
                if (hd !== lastHasDirt) { lastHasDirt = hd; refreshCard(); }
            }
        }
        // THE JOB CLOCK NEVER RUNS behind the start screen or any menu.
        if (jm && !freePlay && !jobCompleted && gameState === 'playing' && !uiPaused && !modalOpen && !paused) jm.update(dt);
        if (music) music.setIntensity(Math.min(1, vehicle.currentSpeed / 40));
    });
}
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const SAVE_KEY = 'terraform_city_save_v6';
let saveData = { coins: 0, engineLevel: 1, hydraulicLevel: 1, bucketLevel: 1, tyreLevel: 1, lightLevel: 1, beaconLevel: 1, paint: 0 };

const canvas = document.getElementById('game-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe9f3);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.5, 1400);
const cameraManager = new CameraManager(camera, canvas);
const worldBuilder = new World(scene);
cameraManager.setCollidables([...worldBuilder.buildingMeshes, ...worldBuilder.treeMeshes]);

cameraManager.onChange = () => safe(() => { if (ui) ui.refresh(); });
// Chase is the default for a new job and for phone play (never Bucket).
cameraManager.setMode('chase');

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
    if (!QUALITY_PRESETS[q]) return;
    applyQualitySettings(q);
    writeQuality(q);
    safe(() => { if (ui) ui.refresh(); });
};

// Initial quick hardware-based quality detection (a saved setting wins).
(function quickQualityDetect() {
    let level = readQuality();
    if (!QUALITY_PRESETS[level]) {
        level = 'high';
        const cores = navigator.hardwareConcurrency || 4;
        const pxr = window.devicePixelRatio || 1;
        if (cores <= 4 || pxr >= 2.5) level = 'medium';
        if (cores <= 2) level = 'low';
    }
    applyQualitySettings(level);
})();

// ---------------------------------------------------------------- start flow, menus, real input API
function canPlay() {
    return gameState === 'playing' && isGameRunning && !uiPaused && !modalOpen && !paused && physReady;
}
function clearInput() {
    input.forward = false; input.backward = false; input.left = false; input.right = false; input.brake = false;
    safe(() => hub.setEngine(0, 0));
}
function unlockAudio() {
    // One AudioContext, created only inside a real click / touch / key gesture.
    safe(() => hub.unlock());
    if (!audioStarted) { audioStarted = true; safe(() => hub.start()); }
}
function uiState() {
    ensureJobs();
    const job = jm.current || jm.get(currentJob) || {};
    const sv = jm.save || {};
    let rank = 'ROOKIE';
    try { rank = jm.rankInfo().name; } catch (e) {}
    return {
        level: currentJob,
        jobName: job.name || 'First Scoop',
        chapter: ['', 'ROOKIE YARD', 'CONTRACTOR', 'SITE BOSS'][job.chapter] || 'ROOKIE YARD',
        coins: saveData.coins,
        rank: rank,
        hasProgress: !!((sv.stats && sv.stats.jobs > 0) || (sv.jobs && Object.keys(sv.jobs).length > 0) || (sv.last > 1)),
        muted: !!hub.isMuted(),
        cameraMode: cameraManager.currentMode,
        cameraLabel: CAMERA_LABELS[cameraManager.currentMode] || 'Chase',
        zoomable: cameraManager.canZoom(),
        zoom: cameraManager.zoom,
        quality: currentQuality
    };
}
// All data Menus needs. Safe while GameUI is still being constructed (ui === null).
function uiData() {
  ensureJobs();
  const ctx = jobCtx();
  const jobs = (LEVEL_LIST || []).map(j => ({
    id: j.id, name: j.name, chapter: j.chapter, type: j.type, rule: j.rule || '',
    stars: jm.record(j.id).stars || 0, locked: !!jm.lockReason(j.id, ctx),
    reason: jm.lockReason(j.id, ctx) || ''
  }));
  return {
    coins: saveData.coins,
    volumes: hub.getVolumes ? hub.getVolumes() : { master: 1, music: 1, effects: 1 },
    muted: !!hub.isMuted(), quality: currentQuality,
    big: !!uiSettings.big, lefty: !!uiSettings.lefty, guide: uiSettings.guide !== false,
    jobs, chapters: (CHAPTERS || []).map(c => ({ id: c.id, name: c.name.toUpperCase() })),
    currentJob,
    upgrades: GARAGE.map(g => {
      const lv = Math.max(1, Math.min(GARAGE_MAX, saveData[g.save] || 1));
      return { key: g.key, name: g.name, icon: g.icon, level: lv, maxPips: GARAGE_MAX,
        line: g.stat + ' · ' + g.lines[lv - 1], price: lv >= GARAGE_MAX ? null : GARAGE_PRICES[lv - 1] };
    }),
    paints: PAINTS.map(c => '#' + c.toString(16).padStart(6, '0')), paint: saveData.paint || 0,
    ads: ads.rewardedAvailable(),
    map: mapData()
  };
}
function mapData() {
  const blocks = (worldBuilder && worldBuilder.blocks ? worldBuilder.blocks : [])
    .filter((_, i) => i % 3 === 0).slice(0, 420)
    .map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, park: !!b.park }));
  const goals = [];
  if (siteNow) {
    goals.push({ x: siteNow.pile.x, z: siteNow.pile.z, color: '#fbbf24' });
    goals.push({ x: siteNow.truck.x, z: siteNow.truck.z, color: '#34d399' });
  }
  return {
    blocks, goals,
    player: vehicle && vehicle.mesh ? { x: vehicle.mesh.position.x, z: vehicle.mesh.position.z, yaw: 0 } : { x: 0, z: 0, yaw: 0 },
    landmark: siteNow ? { x: siteNow.truck.x, z: siteNow.truck.z } : null
  };
}
// TIER 1: scoop and dump are ALWAYS a 3-second hold, on keys and on screen.
let actHolding = false, actT = 0, actFired = false;
function actionProgress(p) { safe(() => { if (ui && ui.setActionProgress) ui.setActionProgress(p); }); }
function updateActionHold(dt) {
    if (actHolding && canPlay()) {
        actT += dt;
        actionProgress(Math.min(1, actT / 3));
        if (actT >= 3) {
            actHolding = false; actFired = true; actT = 0;
            actionProgress(0);
            if (vehicle) vehicle.autoAction();
        }
    } else if (!actHolding && actT > 0) { actT = 0; actionProgress(0); }
}
function actionHold(code, on) {
    const live = canPlay();
    if (code === 'KeyF') {
        if (on) { actHolding = !!live; actT = 0; actFired = false; actionProgress(0); }
        else { actHolding = false; actT = 0; actFired = false; actionProgress(0); }
    }
    else if (code === 'KeyW') input.forward = on && live;
    else if (code === 'KeyS') input.backward = on && live;
    else if (code === 'KeyA') input.left = on && live;
    else if (code === 'KeyD') input.right = on && live;
    else if (code === 'Space') input.brake = on && live;
}
function actionTap(code) {
    unlockAudio();
    switch (code) {
        case 'KeyF': if (canPlay() && vehicle) vehicle.autoAction(); break;
        case 'KeyE': if (canPlay() && vehicle) vehicle.toggleArm(); break;
        case 'KeyC': cameraManager.cycleMode(); safe(() => { if (ui) ui.refresh(); }); break;
        case 'KeyR': if (gameState === 'playing') window.restartJob(); break;
        case 'KeyM': toggleMute(); break;
        case 'KeyJ': if (gameState === 'playing') openPicker(); break;
        case 'KeyU': if (gameState === 'playing') openShop(); break;
        case 'KeyP': if (gameState === 'playing') togglePause(); break;
    }
}
function pauseForMenu() {
    uiPaused = true;
    clearInput();
    safe(() => portal.gameplayStop());
}
function resumeGame() {
    uiPaused = false;
    modalOpen = false;
    paused = false;
    isGameRunning = true;
    const ov = document.getElementById('pause-overlay');
    if (ov) ov.classList.remove('active');
    if (gameState === 'playing') safe(() => portal.gameplayStart());
    safe(() => { if (ui) ui.refresh(); });
}
function pauseWindow() { pauseForMenu(); }
function startGame() {
    unlockAudio();
    freePlay = false;
    gameState = 'playing';
    uiPaused = false;
    cameraManager.setShowcase(false);
    cameraManager.setMode('chase');
    safe(() => { if (ui) { ui.hideModal(); ui.setScreen('play'); ui.reset(); } });
    window.restartJob();
    resumeGame();
}
function returnToMenu() {
    closeJobModal();
    gameState = 'menu';
    uiPaused = false;
    paused = false;
    isGameRunning = true;
    clearInput();
    menuPose();
    cameraManager.setShowcase(true);
    safe(() => { if (ui) { ui.reset(); ui.setScreen('menu'); ui.setTimer(null); ui.refresh(); } });
    safe(() => portal.gameplayStop());
}
function handleUiAction(name, payload) {
    switch (name) {
        case 'play': startGame(); break;
        case 'contracts': openPicker(); break;
        case 'garage': openShop(); break;
        case 'settings': pauseWindow(); safe(() => { if (ui) ui.showModal('settings'); }); break;
        case 'controls': pauseWindow(); safe(() => { if (ui) ui.showModal('controls'); }); break;
        case 'resume': safe(() => { if (ui) ui.hideModal(); }); resumeGame(); break;
        case 'restart':
            pauseWindow();
            safe(() => { if (ui) ui.confirm({ title: 'Restart this job?', text: 'Your progress in this job will be lost.', yes: 'Restart job', onYes: () => { window.restartJob(); resumeGame(); } }); });
            break;
        case 'mainmenu': case 'home':
            pauseWindow();
            safe(() => { if (ui) ui.confirm({ title: 'Main menu?', text: 'This job will stop. Progress stays.', yes: 'Main menu', onYes: () => returnToMenu() }); });
            break;
        case 'camera': actionTap('KeyC'); break;
        case 'sound': toggleMute(); break;
        case 'pause': togglePause(); break;
        case 'map': pauseWindow(); safe(() => { if (ui) ui.showMap(); }); break;
        case 'levels': case 'picker': openPicker(); break;
        case 'shop': openShop(); break;
        case 'help': pauseWindow(); safe(() => { if (ui) ui.showModal('help'); }); break;
        case 'freeplay': startFreePlay(); break;
        case 'start': if (typeof payload === 'number' && payload >= 1) goJob(payload); break;
        case 'next': nextFromResult(); break;
        case 'retry': window.restartJob(); resumeGame(); break;
        case 'reward-coins': rewardCoins(); break;
        case 'reward-time': rewardTime(); break;
        case 'setting': setUiSetting(payload); break;
        case 'buy': buyUpgrade(payload); safe(() => { if (ui) ui.refresh(); }); break;
        case 'paint': setPaint(+payload); safe(() => { if (ui) ui.refresh(); }); break;
        case 'window-open': pauseForMenu(); break;
        case 'window-close': windowClosed(payload); break;
        case 'zoomIn': cameraManager.zoomIn(); safe(() => { if (ui) ui.refresh(); }); break;
        case 'zoomOut': cameraManager.zoomOut(); safe(() => { if (ui) ui.refresh(); }); break;
        case 'quality': window.setQuality(payload); break;
        case 'menu-open': pauseForMenu(); break;
        case 'menu-close': resumeGame(); break;
        case 'modal-closed-play': resumeGame(); break;
        case 'modal-closed-menu': clearInput(); break;
    }
}
// TIER 3/4: one settings funnel. Every control really changes the game.
function setUiSetting(p) {
  if (!p || !p.key) return;
  const k = p.key, v = p.value;
  if (k === 'master' || k === 'music' || k === 'effects') {
    const vols = hub.getVolumes();
    vols[k] = Math.max(0, Math.min(1, +v || 0));
    hub.setVolumes(vols.master, vols.music, vols.effects);
  } else if (k === 'mute') { hub.setMuted(+v === 1); safe(() => { if (ui) ui.toast('Sound ' + (+v === 1 ? 'off' : 'on'), 'info'); }); }
  else if (k === 'quality') { window.setQuality(String(v)); }
  else if (k === 'big') { uiSettings.big = +v === 1; safe(() => { if (ui) ui.setBig(uiSettings.big); }); }
  else if (k === 'lefty') { uiSettings.lefty = +v === 1; safe(() => { if (ui) ui.setLefty(uiSettings.lefty); }); }
  else if (k === 'guide') { uiSettings.guide = +v === 1; safe(() => { if (guide) guide.setVisible(uiSettings.guide); }); }
  writeUiSettings();
  safe(() => { if (ui) ui.refresh(); });
}
function windowClosed(kind) {
  // One path for every window: resumeGame() clears modalOpen/uiPaused/paused
  // and restores gameplayStart. void kind keeps this safe for all windows.
  void kind;
  resumeGame();
}
function nextFromResult() {
  const id = lastResult && lastResult.nextId ? lastResult.nextId : (ensureJobs().nextId(jobCtx()) || currentJob);
  goJob(id);
  safe(() => { if (ui) ui.hideModal(); });
  // TIER 9: midgame ad ONLY on NEXT, never on start, never during driving.
  if (ads.canMidgame()) ads.request('midgame');
}
function rewardCoins() {
  if (!lastResult) return;
  const extra = lastResult.coins || 0;
  ads.request('rewarded', () => {
    saveData.coins += extra; writeSave(); syncCoins();
    safe(() => { if (ui) ui.toast('Coins doubled! +' + extra, 'success'); });
  });
}
function rewardTime() {
  ads.request('rewarded', () => {
    ensureJobs().addTime(60);
    safe(() => { if (ui) { ui.hideModal(); ui.toast('+60 seconds', 'success'); } });
    resumeGame();
  });
}
function setPaint(i) {
  if (!(i >= 0 && i < PAINTS.length)) return;
  saveData.paint = i; writeSave();
  safe(() => { if (vehicle && vehicle.setPaint) vehicle.setPaint(PAINTS[i]); });
}
function startFreePlay() {
  // TIER 7 (compact): no timer, no fail, same controls, free roam in the yard.
  freePlay = true;
  gameState = 'playing';
  unlockAudio();
  cameraManager.setShowcase(false);
  cameraManager.setMode('chase');
  safe(() => { if (ui) { ui.hideModal(); ui.setScreen('play'); ui.reset(); ui.setTimer(null); ui.setJob('Free Play', 'Drive, dig, explore', 'No timer · no fail'); ui.setHint('Free Play: drive anywhere. P opens the menu.'); } });
  if (jm) { jm.state.running = false; }
  clearInput();
  resumeGame();
}
function menuPose() {
    if (!vehicle || !physReady) return;
    setVehiclePose(-8, 1.2, -6, { x: 0, y: 1, z: 0, w: 0 });
}
function setVehiclePose(x, y, z, q) {
    if (!vehicle || !physReady) return;
    try {
        vehicle.chassisBody.setTranslation({ x: x, y: y, z: z }, true);
        vehicle.chassisBody.setRotation(q, true);
        vehicle.chassisBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        vehicle.chassisBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        if (vehicle.resetInterpolation) vehicle.resetInterpolation();
        vehicle.hasDirt = false;
        if (vehicle.bucketDirtGroup) vehicle.bucketDirtGroup.children.forEach(c => { c.visible = false; });
        if (worldBuilder.truckDirtMeshes) {
            worldBuilder.truckDirtMeshes.forEach(m => worldBuilder.truckGroup.remove(m));
            worldBuilder.truckDirtMeshes = [];
            worldBuilder.truckDirtLevel = 0;
        }
    } catch (e) { console.warn('[pose]', e); }
}
function prepareMenu() {
    ensureJobs();
    jm.prepare(currentJob);
    placeSite(currentJob);
    menuPose();
    cameraManager.setMode('chase');
    cameraManager.setShowcase(true);
    safe(() => { if (ui) { ui.setScreen('menu'); ui.setTimer(null); ui.refresh(); } });
    safe(() => portal.gameplayStop());
}

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
    safe(() => { if (ui) { ui.toast(m ? 'Sound off (press M to turn on)' : 'Sound on', m ? 'warn' : 'success'); ui.refresh(); } });
}
// (Sfx2 removed in M2)
audio.playDirtCrunch = () => {};
audio.playScoop = () => {};
audio.playDumpThud = () => {};
audio.playSuccess = () => hub.complete();
let qaManager = null;

function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) Object.assign(saveData, JSON.parse(raw)); } catch(e) {}
  // TIER 6 migration: old saves only had 3 upgrades. Never break progress.
  for (const g of GARAGE) if (!(typeof saveData[g.save] === 'number')) saveData[g.save] = 1;
  if (!(typeof saveData.paint === 'number')) saveData.paint = 0;
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); } catch(e) {} }
loadSave();
document.getElementById('coin-count').textContent = saveData.coins;

// The old index.html shop is gone. The Garage window is built by Jobs.js (key U / menu).

const input = { forward: false, backward: false, left: false, right: false, brake: false };
const ZERO_INPUT = { forward: false, backward: false, left: false, right: false, brake: false };

// ---- Pause (P key and the Pause / Resume buttons). The shop has its own pause. ----
let paused = false;
function togglePause() {
    if (gameState !== 'playing' || !ui) return;
    ui.toggleMenu();
    paused = false;
    isGameRunning = true;
    clearInput();
}
// tell the Sound button the saved mute state at start
safe(() => window.dispatchEvent(new CustomEvent('bh-mute', { detail: !!hub.isMuted() })));
// The v3 SDK must be initialised before use. Everything below is optional:
// the game and all menus work without it.
safe(() => {
    portal.init().then(() => {
        try {
            const settings = portal.SDK && portal.SDK.game && portal.SDK.game.settings;
            if (settings && settings.muteAudio) hub.setMuted(true);
            if (portal.SDK && portal.SDK.game && typeof portal.SDK.game.addSettingsChangeListener === 'function') {
                portal.SDK.game.addSettingsChangeListener((s) => { if (s && s.muteAudio) hub.setMuted(true); });
            }
        } catch (e) {}
        safe(() => { if (ui) ui.refresh(); });
    });
});

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

// Physical keys use event.code (AZERTY-safe). Both the keyboard and the
// on-screen buttons end up in actionHold()/actionTap() - the same real input API.
window.addEventListener('keydown', (ev) => {
    if (ev.code === 'Backquote') { toggleDebugOverlay(); return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    // TIER 4: real key presses light the matching on-screen key, even on the menu.
    const lit = ev.code;
    if (ui && ui.setKey) ui.setKey(lit, true);
    if (lit === 'Equal' || lit === 'NumpadAdd') { cameraManager.zoomIn(); safe(() => { if (ui) ui.refresh(); }); return; }
    if (lit === 'Minus' || lit === 'NumpadSubtract') { cameraManager.zoomOut(); safe(() => { if (ui) ui.refresh(); }); return; }
    if (gameState !== 'playing') return;          // no driving keys on the start screen
    if (canPlay() && (ev.code === 'Space' || ev.code.startsWith('Arrow'))) ev.preventDefault();
    const e = normKey(ev);
    unlockAudio();
    const key = e.key.toLowerCase();
    if (e.repeat) return;
    if (key === 'w' || key === 'arrowup') actionHold('KeyW', true);
    if (key === 's' || key === 'arrowdown') actionHold('KeyS', true);
    if (key === 'a' || key === 'arrowleft') actionHold('KeyA', true);
    if (key === 'd' || key === 'arrowright') actionHold('KeyD', true);
    if (e.key === ' ') actionHold('Space', true);
    if (key === 'r') actionTap('KeyR');
    if (key === 'm') actionTap('KeyM');
    if (key === 'j') actionTap('KeyJ');
    if (key === 'u') actionTap('KeyU');
    if (key === 'p') actionTap('KeyP');
    if (key === 'e') actionTap('KeyE');
    if (key === 'f') actionHold('KeyF', true);
    if (key === 'c') actionTap('KeyC');
});

window.addEventListener('keyup', (ev) => {
    if (ui && ui.setKey) ui.setKey(ev.code, false);
    const e = normKey(ev);
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') actionHold('KeyW', false);
    if (key === 's' || key === 'arrowdown') actionHold('KeyS', false);
    if (key === 'a' || key === 'arrowleft') actionHold('KeyA', false);
    if (key === 'd' || key === 'arrowright') actionHold('KeyD', false);
    if (e.key === ' ') actionHold('Space', false);
    if (key === 'f') actionHold('KeyF', false);
});

// Pointer buttons call the same API directly (see GameUI.js). No fake key events.

window.restartJob = () => {
    hasScoopedDirt = false; jobCompleted = false; closeJobModal();
    const overlay = document.getElementById('victory-overlay'); if (overlay) overlay.classList.remove('active');

    ensureJobs(); worldBuilder.resetDirtPile(); placeSite(currentJob);
    safe(() => { if (fx) fx.reset(); lastTarget = 'none'; if (guide) guide.reset(); });
    lastLoads = 0; startJobNow();

    // Every level has its own safe staging pose facing its first task.
    if (vehicle && physReady) {
        const job = jm.current || jm.get(currentJob);
        const site = rawSite || siteNow;
        const first = (level && level.active && level.active()) ? level.active() : null;
        const pose = levelStartPose(job, site, first);
        currentStartPose = pose;
        setVehiclePose(pose.x, pose.y, pose.z, pose.quat);
        cameraManager.setMode('chase');
        cameraManager.setZoom(Math.max(0.75, Math.min(1.5, pose.cam / 12)));
        safe(() => {
            if (guide && job.tutorial) guide.setChevrons({ x: pose.x, z: pose.z }, { x: site.pile.x, z: site.pile.z });
        });
    }
    safe(() => { if (ui) ui.refresh(); });
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
        safe(() => { if (vehicle.setPaint) vehicle.setPaint(PAINTS[saveData.paint || 0]); });
        physReady = true;
        initUi();
        safe(() => { if (ui) { ui.setBig(uiSettings.big); ui.setLefty(uiSettings.lefty); ui.setStartInfo(uiState()); } });
        hub.setVolumes(hub.getVolumes().master, hub.getVolumes().music, hub.getVolumes().effects);
        prepareMenu();
        
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
// TIER 3: all windows now belong to GameUI/Menus. JobPanels is no longer used.
const panels = {
  hide: () => safe(() => { if (ui) ui.hideModal(); }),
  briefing: () => {},
  showResult: (r) => safe(() => { lastResult = r; if (ui) ui.showResult({ stars: r.stars, coins: r.coins + (r.bonus ? r.bonus.coins : 0), bonusGot: !!(r.bonus && r.bonus.got), ads: ads.rewardedAvailable() }); }),
  showFail: (job, loads) => safe(() => { lastFail = { loads, total: job ? job.loads : 3 }; if (ui) ui.showFail({ loads, total: job ? job.loads : 3, ads: ads.rewardedAvailable() }); }),
  showPicker: () => safe(() => { if (ui) ui.showPicker(); }),
  showShop: () => safe(() => { if (ui) ui.showGarage(); })
};
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
        jm.layout(worldBuilder.buildingData, worldBuilder.propColliders);
        level = new LevelEngine(scene, worldBuilder, siteNow, {
            onCount: (tip) => engineProgress(tip),
            onToast: (msg, kind) => safe(() => { if (ui) ui.toast(msg, kind || 'info'); }),
            onCombo: (n) => safe(() => { if (ui && n > 1) ui.toast('Combo x' + n + '!', 'success'); hub.coin(); }),
            onChange: () => refreshCard(),
            truckSolid: (on, x, z) => syncTruckCollider(!!on, x || siteNow.truck.x, z || siteNow.truck.z)
        });
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
    safe(() => {
        if (!ui || !jm) return;
        const job = jm.current || jm.get(currentJob);
        if (!job) return;
        if (level && level.job) ui.setJob(job.name, level.objective(vehicle && vehicle.hasDirt), level.stepText());
        else ui.setJob(job.name, job.objective || '', (jm.stepText ? jm.stepText() : ''));
    });
}
function openModalState() {
    modalOpen = true;
    uiPaused = true;
    isGameRunning = false;
    clearInput();
    safe(() => portal.gameplayStop());
}
function closeJobModal() {
    if (panels) panels.hide();
    modalOpen = false;
    uiPaused = false;
    paused = false;
    isGameRunning = true;
    if (gameState === 'playing') safe(() => portal.gameplayStart());
    safe(() => { if (ui) ui.refresh(); });
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
    ensureJobs();
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
        rawSite = { pile: { x: px, z: pz }, truck: { x: tx, z: tz } };
        syncTruckCollider(moved, tx, tz);
        if (worldBuilder.jobSiteBase) worldBuilder.jobSiteBase.position.set(px, 0, pz);
        siteGroups.forEach((g, k) => { g.visible = (k === id); });
        if (!job.site.keep && !siteGroups.has(id)) {
            const g = buildSiteDressing(THREE, id, { x: px, z: pz }, { x: tx, z: tz });
            scene.add(g);
            siteGroups.set(id, g);
        }
        if (level) level.start(job, { pile: { x: px, z: pz }, truck: { x: tx, z: tz } });
    });
}

// ---- sky, light, fog and rain for each job ----
const ENV_EXPO = { morning: 1.0, day: 1.0, dusk: 0.92, night: 0.62, storm: 0.8, dawn: 0.97, golden: 0.95 };
const ENV_TINT = { morning: 0, day: 0, dusk: 0.35, night: 0.5, storm: 0.6, dawn: 0.3, golden: 0.25 };
const envCur = { sun: 2.2, hemi: 0.8, fog: 0.0011, r: 0.62, g: 0.76, b: 0.9, expo: 1, tint: 0, bright: 1, light: 0 };
let envGoal = null;
let skyU = null;
let workLight = null;
function setEnv(e, instant) {
    const c = new THREE.Color(e.fogColor);
    envGoal = {
        sun: 2.2 * e.sun, hemi: 0.8 * e.hemi, fog: e.fog, r: c.r, g: c.g, b: c.b,
        expo: ENV_EXPO[e.id] || 1, tint: ENV_TINT[e.id] || 0, bright: 0.5 + 0.5 * e.sun,
        light: (e.lights ? 230 : (e.rain ? 70 : 0)) * (0.8 + 0.2 * (saveData.lightLevel || 1)), rain: !!e.rain
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
    writeLastJob(currentJob);
    jm.start(currentJob);
    const j = jm.current;
    refreshCard();
    safe(() => { if (ui) ui.setHint(level && level.job ? level.hint() : jm.hint()); });
    safe(() => { if (ui) ui.announce(j); });
    refreshCard();
}
function goJob(id) {
    ensureJobs();
    const why = jm.lockReason(id, jobCtx());
    if (why) { safe(() => { if (ui) ui.showLocked(why); }); return; }
    currentJob = id;
    freePlay = false;
    writeLastJob(id);
    gameState = 'playing';
    cameraManager.setShowcase(false);
    cameraManager.setMode('chase');
    safe(() => { if (ui) { ui.hideModal(); ui.setScreen('play'); ui.reset(); } });
    window.restartJob();
    resumeGame();
}
// A gate / trench / debris goal counts as one load, without a dump.
function engineProgress(tip) {
    if (jobCompleted || !jm || !jm.state.running) return;
    const done = deliverLoad(tip);
    if (done) {
        jobCompleted = true;
        finishJob();
        safe(() => { if (ui) { ui.setTimer(null); ui.toast('Job complete!', 'success'); } });
        writeSave();
        audio.playSuccess();
        safe(() => portal.happytime());
    }
}
function onScooped() {
    if (!jm) return;
    jm.setPhase('dump');
    refreshCard();
    safe(() => {
        if (level && level.job && vehicle) {
            const bp = new THREE.Vector3(); vehicle.bucketPivot.getWorldPosition(bp);
            const r = level.onScoop(bp, vehicle);
            if (r.msg && ui) ui.toast(r.msg, r.ok ? 'success' : 'warn');
            if (r.count) engineProgress(0);
        }
    });
    if (ui) ui.setHint(level && level.job ? level.hint() : jm.hint());
}
function deliverLoad(tipOverride) {
    ensureJobs();
    const r = jm.addLoad(jobCtx());
    if (!r) return false;
    const tip = (typeof tipOverride === 'number') ? tipOverride : r.tip;
    saveData.coins += tip;
    writeSave();
    safe(() => {
        if (ui) {
            if (!r.complete) ui.toast('Goal ' + r.loads + ' of ' + r.total + ' complete' + (tip ? '  +' + tip + ' coins' : ''), 'success');
            ui.setCoins(saveData.coins); lastCoinsShown = saveData.coins;
        }
        refreshCard();
        if (!r.complete && ui) ui.setHint(jm.hint());
    });
    if (r.loads === 1) safe(() => { if (guide) guide.onFirstLoad(); });
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
    if (level && level.job) {
        const b = level.bonus();
        r.bonus = b;
        r.coins += b.coins;
    }
    r.coins += Math.round(r.coins * 0.03 * Math.max(0, (saveData.beaconLevel || 1) - 1));
    saveData.coins += r.coins;
    writeSave();
    setTimeout(() => safe(() => {
        if (!jobCompleted) return;
        openModalState();
        syncCoins();
        panels.showResult(r);
    }), 1700);
}
function onJobFail() {
    safe(() => {
        openModalState();
        panels.showFail(jm.current, jm.state.loads);
    });
}
function openPicker() {
    safe(() => {
        ensureJobs();
        openModalState();
        panels.showPicker();
        safe(() => { if (ui) ui.refresh(); });
    });
}
function buyUpgrade(kind) {
    const g = GARAGE.find(x => x.key === kind);
    if (!g) return false;
    const lv = Math.max(1, Math.min(GARAGE_MAX, saveData[g.save] || 1));
    if (lv >= GARAGE_MAX) return false;
    const cost = GARAGE_PRICES[lv - 1];
    if (saveData.coins < cost) return false;
    saveData.coins -= cost;
    saveData[g.save] = lv + 1;
    writeSave();
    safe(() => { if (vehicle) vehicle.setUpgrades(saveData); });
    syncCoins();
    safe(() => hub.coin());
    safe(() => { if (ui) ui.toast(g.name + ' upgraded', 'success'); });
    return true;
}
function openShop() {
    safe(() => {
        ensureJobs();
        openModalState();
        panels.showShop();
        safe(() => { if (ui) ui.refresh(); });
    });
}

// Contracts open with key J or the HUD menu drawer.

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

// QA helper: type __levelInfo() in the F12 console to see the current level, goal and site finder results.
window.__levelInfo = function () {
    const sites = jm ? [...jm.layout(worldBuilder.buildingData, worldBuilder.propColliders).entries()]
        .map(([id, v]) => ({ id, ok: !!v.ok, keep: !!v.keep })) : [];
    return { current: currentJob, job: jm && jm.current ? jm.current.name : null,
        level: level ? level.info() : null, sitesOk: sites.filter(x => x.ok).length, sites };
};
// Headless QA only (?qadebug): walk a level through every goal without driving.
if (new URLSearchParams(location.search).has('qadebug')) {
    window.__qaLevel = {
        info: () => (level ? level.info() : null),
        objects: () => {
            if (!level || !level.group) return 0;
            let n = 0; level.group.traverse(o => { if (o.isMesh) n++; }); return n;
        },
        dbg: () => {
            if (!level || !level.active()) return null;
            const g = level.active(), m = vehicle.mesh.position;
            const bp = new THREE.Vector3(); vehicle.bucketPivot.getWorldPosition(bp);
            return { kind: g.kind, x: g.x, z: g.z, nx: g.nx, nz: g.nz, width: g.width,
                prev: level._prevSide.get(g), mx: m.x, mz: m.z, bpy: bp.y,
                side: (m.x - g.x) * g.nx + (m.z - g.z) * g.nz,
                lat: Math.abs((m.x - g.x) * -g.nz + (m.z - g.z) * g.nx) };
        },
        objective: () => (level ? level.objective(vehicle.hasDirt) : ''),
        gateTest: (x, z, bpy) => {
            if (!level || !level.active() || level.active().kind !== 'gate') return null;
            const fake = { mesh: { position: new THREE.Vector3(x, 0, z) },
                bucketPivot: { getWorldPosition: (v) => { v.set(0, bpy === undefined ? 2 : bpy, 0); return v; } } };
            level.update(0.016, fake);
            return level.info();
        },
        site: () => (level ? { pile: { x: level.site.pile.x, z: level.site.pile.z },
            truck: { x: level.site.truck.x, z: level.site.truck.z },
            goal: level.active() ? { x: level.active().x, z: level.active().z, kind: level.active().kind } : null } : null),
        teleport: (x, z) => {
            try {
                const t = vehicle.chassisBody.translation();
                vehicle.chassisBody.setTranslation({ x, y: t.y, z }, true);
                vehicle.chassisBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
                vehicle.chassisBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
                if (vehicle.resetInterpolation) vehicle.resetInterpolation();
                return true;
            } catch (e) { return String(e.message); }
        },
        step: () => {
            if (!level || !level.job) return null;
            const g = level.active();
            if (!g) return level.info();
            if (g.kind === 'gate') { level._advance(); level.hooks.onCount(0); }
            else if (g.kind === 'trench' || g.kind === 'debris') {
                level.onScoop(new THREE.Vector3(g.x, 2, g.z), vehicle);
                const tgt = level.rushTarget || level.site.truck;
                const r = level.onDump(new THREE.Vector3(tgt.x, 2, tgt.z), vehicle);
                if (r.count) engineProgress(0);
            } else {
                const tgt = level.rushTarget || level.site.truck;
                const r = level.onDump(new THREE.Vector3(tgt.x, 2, tgt.z), vehicle);
                if (r.count) engineProgress();
            }
            return level.info();
        }
    };
}
// Console test: type __testTimestep() in the F12 console. Every row must show 60.0
// QA shortcut only: ?qadebug lets a headless test trigger one instant action.
window.__qaAct = function () { actionTap('KeyF'); return true; };
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
// B5: the debug box must NEVER appear in a normal dev-server run.
// It is created only by the backquote key, or by ?debug at boot.
const DEBUG_ENABLED = new URLSearchParams(location.search).has('debug');
let dbgEl = null, dbgSteps = 0, dbgFrames = 0, dbgTime = 0;
function toggleDebugOverlay() {
    if (!dbgEl) {
        dbgEl = document.createElement('div');
        dbgEl.style.cssText = 'position:fixed;left:8px;top:64px;z-index:2000;padding:4px 8px;background:rgba(0,0,0,0.65);color:#7cfc9a;font:12px/1.4 monospace;pointer-events:none;border-radius:4px;';
        dbgEl.textContent = 'physics -- steps/s | render -- fps';
        document.body.appendChild(dbgEl);
    } else {
        dbgEl.style.display = dbgEl.style.display === 'none' ? 'block' : 'none';
    }
}
if (DEBUG_ENABLED) setTimeout(() => { if (!dbgEl) toggleDebugOverlay(); }, 400);
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
        // Tutorial belongs to Level 1 only; other levels have their own hints.
        if (jm && jm.current && jm.current.tutorial) { guide.startTutorial(); tutStep = 1; }
        if (guide && guide.setVisible) guide.setVisible(uiSettings.guide !== false);
        if (guide && jm && jm.current && jm.current.tutorial && currentStartPose && rawSite) {
            guide.setChevrons({ x: currentStartPose.x, z: currentStartPose.z }, { x: rawSite.pile.x, z: rawSite.pile.z });
        }
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 60, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        beam.visible = false; scene.add(beam); scene.userData.beam = beam;
        const maxA = renderer.capabilities.getMaxAnisotropy();
        scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { if (m.map) { m.map.anisotropy = maxA; m.map.needsUpdate = true; } }); });
    });
}
function updateFx(dt) {
    // No tutorial toasts, target rings or FX on the start screen / behind menus.
    if (gameState !== 'playing' || uiPaused || modalOpen) return;
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
        updateActionHold(dt);
        const adv = advanceAccumulator(physAcc, frameDt);
        physAcc = adv.acc;
        const driveInput = (gameState === 'playing' && !uiPaused && !modalOpen && !paused) ? input : ZERO_INPUT;
        for (let s = 0; s < adv.steps; s++) {
            vehicle.updateController(driveInput, FIXED_DT);
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

        // Signed speed keeps the reverse beeper working; Audio.js uses Math.abs for rpm.
        if (gameState === 'playing' && !uiPaused && !modalOpen) {
            const signed = (vehicle.signedSpeedKmh !== undefined) ? vehicle.signedSpeedKmh : vehicle.getForwardSpeedMps() * 3.6;
            hub.setEngine(signed, (input.forward || input.backward) ? 1 : 0);
        } else hub.setEngine(0, 0);

        if (!jobCompleted && !freePlay && gameState === 'playing' && !uiPaused && !modalOpen) {
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
                const near = bucketPos.distanceTo(truckBedPos) < 10;
                if (!near) {
                    hasScoopedDirt = false;
                    safe(() => { if (level) level.onMiss(); if (ui) { ui.toast('Missed the target - scoop again', 'warn'); if (jm) jm.setPhase('scoop'); refreshCard(); } });
                } else {
                    hasScoopedDirt = false;
                    worldBuilder.addDirtToTruck();
                    audio.playDumpThud();
                    safe(() => { if (fx) fx.onDump(worldBuilder.truckGroup.position.clone(), bucketPos.clone()); if (sfx) sfx.coin(); if (guide && tutStep === 3) { guide.nextTutorialStep(); tutStep = 4; } });
                    cameraShake = 0.5;
                    const lv = (level && level.job) ? level.onDump(bucketPos, vehicle) : { ok: true, count: true, msg: '' };
                    if (lv.msg && ui) ui.toast(lv.msg, lv.ok ? 'success' : 'warn');
                    if (!lv.ok) {
                        refreshCard();
                        audio.playScoop();
                    } else if (!lv.count) {
                        // Trench / debris goals already counted on the scoop; this dump just clears the bucket.
                        refreshCard();
                        audio.playScoop();
                    } else if (!deliverLoad()) {
                        audio.playScoop();
                    } else {
                        jobCompleted = true;
                        finishJob();
                        safe(() => { if (ui) { ui.setTimer(null); ui.toast('Job complete!', 'success'); } });
                        writeSave();
                        audio.playSuccess();
                        safe(() => { if (sfx) sfx.complete(); });
                        safe(() => portal.happytime());
                    }
                }
            }
        }
        updateSunShadow();
        trackFPS(dt);
        updateFx(dt);
        safe(() => { if (level && level.job && !freePlay && gameState === 'playing' && !uiPaused && !modalOpen) level.update(dt, vehicle); });
        vehicle.pilePos = worldBuilder.dirtPileGroup.position;
        if (!vehicle.truckPos) vehicle.truckPos = new THREE.Vector3();
        vehicle.truckPos.copy(worldBuilder.truckGroup.position).add(_truckOff);
        safe(() => { updateEnv(dt); updateRain(dt); });
        updateUi(dt);
        updateDig(dt);
        renderFrame();
    }
}
function onViewportChange() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) composer.setSize(w, h);
    safe(() => { if (ui) ui.refresh(); });
}
window.addEventListener('resize', onViewportChange);
window.addEventListener('orientationchange', () => setTimeout(onViewportChange, 120));
if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewportChange);

// QA helpers (F12 console). __speedInfo() shows the real cap for the current save.
window.__speedInfo = function () {
    const mult = vehicle ? vehicle.engineMultiplier : 1;
    return { engineLevel: saveData.engineLevel || 1, multiplier: mult,
        forwardCapKmh: Math.min(32 + (mult - 1) * 10, 60),
        reverseCapKmh: Math.min(14 + (mult - 1) * 2, 28),
        shownKmh: vehicle ? vehicle.currentSpeed : 0,
        signedKmh: vehicle ? vehicle.signedSpeedKmh : 0 };
};
window.__tfState = function () {
    return { gameState: gameState, uiPaused: uiPaused, modalOpen: modalOpen,
        job: currentJob, timerRunning: !!(jm && jm.state && jm.state.running),
        camera: cameraManager.currentMode, zoom: cameraManager.zoom,
        startPose: currentStartPose, site: rawSite };
};
animate();



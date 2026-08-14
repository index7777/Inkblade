(() => {
  // src/geom.js
  function truncatePath(pts, maxLen) {
    if (maxLen <= 0 || pts.length < 2) return null;
    const out = [pts[0]];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y, d = Math.hypot(dx, dy);
      if (acc + d <= maxLen) {
        out.push(pts[i]);
        acc += d;
      } else {
        const t = (maxLen - acc) / (d || 1);
        if (t > 0.03) out.push({ x: pts[i - 1].x + dx * t, y: pts[i - 1].y + dy * t });
        break;
      }
    }
    return out.length >= 2 ? out : null;
  }
  function segCircleDist(ax, ay, bx, by, px, py) {
    if (ax == null) return Math.hypot(px - bx, py - by);
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    if (L2 < 1e-6) return Math.hypot(px - bx, py - by);
    let t = ((px - ax) * dx + (py - ay) * dy) / L2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  // src/core.js
  var G = {
    running: false,
    paused: false,
    t: 0,
    player: null,
    enemies: [],
    bossShots: [],
    swords: [],
    particles: [],
    inks: [],
    texts: [],
    stains: [],
    splashes: [],
    mists: [],
    commands: [],
    drops: [],
    lingers: [],
    edgeT: 0,
    edgeReady: false,
    focus: 0,
    focusIdle: 0,
    focusReady: false,
    summonT: 0,
    kills: 0,
    wave: 1,
    waveTimer: 0,
    spawnAcc: 0,
    eliteSpawned: {},
    webT: 0,
    xp: 0,
    xpNeed: 6,
    level: 1,
    pendingLevels: 0,
    shake: 0,
    hitstop: 0,
    flash: 0,
    flashC: "255,255,255",
    banner: null,
    aim: 0.85,
    facing: 1,
    intent: 0,
    streaks: [],
    cuts: [],
    anchors: [],
    anchorLinks: [],
    firstStrikeDone: false,
    respecWave: 0,
    hurtT: 0,
    castT: 0,
    deathT: 0,
    deathMax: 56,
    heroPhase: 0
  };
  var stat = {
    count: 1,
    // 同時飛出的劍數
    formation: "fan",
    // 陣型:fan 扇形 / parallel 平行 / inline 連珠
    damage: 24,
    // 單劍傷害
    size: 9,
    // 劍氣寬度
    speed: 11,
    // 飛行速度
    pierce: 1,
    // 可貫穿敵人數
    homing: 0,
    // 追蹤強度
    explode: 0,
    // 爆裂範圍
    element: "none",
    // 劍的元素:none/fire/ice
    ember: 0,
    // 業火:灼燒層數
    ice: 0,
    // 寒霜:冰緩層數
    ret: 0,
    // 迴劍
    crit: 0.05,
    // 暴擊率
    regen: 0,
    // 每斬回靈
    cap: 6,
    // 同屏飛劍數上限
    manaMax: 100,
    // 劍意上限
    manaRegen: 0.34,
    // 每幀劍意回復
    costBase: 6,
    // 出劍基礎劍意(開局值由 config.baseRunState.stats.manaCostBase 決定)
    costPerPx: 0.13
    // 每單位劍痕長度的劍意(同上 manaCostPerPixel;滿劍意約可畫 700px)
  };

  // src/constants.js
  var HERO_VISUAL_SCALE = 0.85;
  var HERO_BODY_SCALE = HERO_VISUAL_SCALE * 0.72 * 1.3;
  var FAN_PHI = 0.52;
  var BASE_SPEED = 14;
  var MERGE_SPEED_K = 0.18;
  var MERGE_WIDTH_K = 0.14;
  var SOLO_TURN = 0.075;
  var HOMING_RANGE = 520;

  // src/viewport.js
  var cv = document.getElementById("game");
  var ctx = cv.getContext("2d");
  var W = 0;
  var H = 0;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var PLAY_TOP = 0;
  var MASTER_W = 640;
  var MASTER_H = 1138;
  function fitMasterStage() {
    const wrap = document.getElementById("wrap");
    if (!wrap) return 1;
    const viewport = window.visualViewport;
    const bodyStyle = getComputedStyle(document.body);
    const safeX = (parseFloat(bodyStyle.paddingLeft) || 0) + (parseFloat(bodyStyle.paddingRight) || 0);
    const safeY = (parseFloat(bodyStyle.paddingTop) || 0) + (parseFloat(bodyStyle.paddingBottom) || 0);
    const availableW = Math.max(1, (viewport?.width || window.innerWidth) - safeX);
    const availableH = Math.max(1, (viewport?.height || window.innerHeight) - safeY);
    const scale = Math.min(availableW / MASTER_W, availableH / MASTER_H);
    wrap.style.setProperty("--stage-scale", String(scale));
    return scale;
  }
  var QUALITY = {
    low: { dpr: 1, fx: { bg: true, vig: false, trail: false, ink: false, part: false, glow: false }, ink: 0, part: 0 },
    med: { dpr: 1.5, fx: { bg: true, vig: true, trail: true, ink: true, part: true, glow: false }, ink: 90, part: 120 },
    high: { dpr: 2, fx: { bg: true, vig: true, trail: true, ink: true, part: true, glow: true }, ink: 220, part: 300 }
  };
  var hooks = {};
  function configureViewport(nextHooks) {
    hooks = nextHooks || {};
  }
  function qual() {
    try {
      return QUALITY[hooks.getQuality()] || QUALITY.high;
    } catch (_) {
      return QUALITY.high;
    }
  }
  function setDPR(value) {
    DPR = value;
  }
  function computePlayTop() {
    if (!cv) return;
    try {
      const cr = cv.getBoundingClientRect();
      const logicalScale = cr.height > 0 ? cv.clientHeight / cr.height : 1;
      let bottom = 0;
      for (const id of ["barwrap", "realmHUD", "ctrls", "scorewrap"]) {
        const el = document.getElementById(id);
        if (!el) continue;
        const st = getComputedStyle(el);
        if (st.display === "none" || st.visibility === "hidden" || +st.opacity === 0) continue;
        const r = el.getBoundingClientRect();
        if (!r.height) continue;
        bottom = Math.max(bottom, (r.bottom - cr.top) * logicalScale);
      }
      PLAY_TOP = bottom > 0 ? bottom + 6 : Math.min(H * 0.14, 90);
    } catch (_) {
      PLAY_TOP = Math.min(H * 0.14, 90);
    }
  }
  function applyQuality() {
    const q = qual();
    const fx = hooks.getFX && hooks.getFX();
    if (fx) Object.assign(fx, q.fx);
    DPR = Math.min(window.devicePixelRatio || 1, q.dpr);
    if (cv && W && H) {
      cv.width = W * DPR;
      cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (hooks.invalidateSprite) hooks.invalidateSprite();
    }
    if (hooks.invalidatePaper) hooks.invalidatePaper();
  }
  function resize() {
    fitMasterStage();
    W = Math.max(1, cv.clientWidth || MASTER_W);
    H = Math.max(1, cv.clientHeight || MASTER_H);
    DPR = Math.min(window.devicePixelRatio || 1, qual().dpr, DPR || 2);
    cv.width = W * DPR;
    cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (hooks.invalidateSprite) hooks.invalidateSprite();
    if (hooks.isBooted && hooks.isBooted() && G.player) {
      G.player.x = W / 2;
      G.player.y = H / 2;
    }
    computePlayTop();
    if (hooks.alignHud) requestAnimationFrame(hooks.alignHud);
  }
  function startViewport() {
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", () => setTimeout(resize, 150));
    if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);
    window.addEventListener("load", () => setTimeout(resize, 60));
    resize();
  }

  // src/enemy.js
  var hooks2 = {};
  function configureEnemy(nextHooks) {
    hooks2 = nextHooks || {};
  }
  function onScreen(en) {
    return en.x >= -en.r && en.x <= W + en.r && en.y >= -en.r && en.y <= H + en.r;
  }
  var ENEMY_KINDS2 = [
    {
      id: "wisp",
      name: "游墨",
      unlock: 1,
      type: "inkling",
      tier: 0,
      hp: 13,
      r: 14,
      sp: 0.88,
      dmg: 6,
      xp: 1,
      c: "#51433f",
      ai: "seek",
      visualHeight: 44,
      animRate: 0.075,
      weight: (w) => Math.max(10, 62 - w * 0.85)
    },
    {
      id: "weaver",
      name: "織影",
      unlock: 5,
      type: "inkling",
      tier: 0,
      hp: 10,
      r: 12,
      sp: 1.22,
      dmg: 6,
      xp: 1,
      c: "#3f4b50",
      ai: "weave",
      visualHeight: 44,
      animRate: 0.105,
      weight: (w) => 18 + Math.min(18, (w - 5) * 0.55)
    },
    {
      id: "bulwark",
      name: "墨甲",
      unlock: 10,
      type: "blade",
      tier: 1,
      hp: 46,
      r: 23,
      sp: 0.57,
      dmg: 12,
      xp: 2,
      c: "#352f43",
      ai: "seek",
      visualScale: 1.42,
      visualHeight: 72,
      animRate: 0.055,
      weight: (w) => 12 + Math.min(22, (w - 10) * 0.58)
    },
    {
      id: "orbiter",
      name: "環煞",
      unlock: 17,
      type: "inkling",
      tier: 1,
      hp: 27,
      r: 17,
      sp: 0.96,
      dmg: 10,
      xp: 2,
      c: "#334842",
      ai: "orbit",
      visualHeight: 44,
      animRate: 0.085,
      weight: (w) => 11 + Math.min(20, (w - 17) * 0.62)
    },
    {
      id: "raven",
      name: "墨羽妖",
      unlock: 22,
      type: "raven",
      tier: 1,
      hp: 24,
      r: 16,
      sp: 1.02,
      dmg: 11,
      xp: 2,
      c: "#3f2828",
      ai: "swoop",
      visualScale: 1,
      visualHeight: 58,
      animRate: 0.08,
      weight: (w) => 9 + Math.min(20, (w - 22) * 0.68)
    },
    {
      id: "charger",
      name: "破陣",
      unlock: 27,
      type: "blade",
      tier: 1,
      hp: 35,
      r: 19,
      sp: 0.72,
      dmg: 15,
      xp: 3,
      c: "#533633",
      ai: "charge",
      visualScale: 1.38,
      visualHeight: 72,
      animRate: 0.07,
      weight: (w) => 9 + Math.min(22, (w - 27) * 0.72)
    },
    {
      id: "fang",
      name: "墨牙獸",
      unlock: 34,
      type: "fang",
      tier: 2,
      hp: 76,
      r: 27,
      sp: 0.76,
      dmg: 19,
      xp: 4,
      c: "#40372a",
      ai: "pounce",
      visualScale: 1,
      visualHeight: 62,
      animRate: 0.06,
      weight: (w) => 8 + Math.min(22, (w - 34) * 0.88)
    },
    {
      id: "reaver",
      name: "劫墨",
      unlock: 41,
      type: "blade",
      tier: 2,
      hp: 105,
      r: 29,
      sp: 0.68,
      dmg: 20,
      xp: 5,
      c: "#292f35",
      ai: "reaver",
      visualScale: 1.48,
      visualHeight: 72,
      animRate: 0.065,
      weight: (w) => 8 + Math.min(28, (w - 41) * 1.35)
    }
  ];
  function waveEnemyKind(w) {
    const pool = ENEMY_KINDS2.filter((k) => w >= k.unlock);
    const decade = w % 10 === 0, surge = w % 5 === 0;
    let total = 0, weights = pool.map((k) => {
      let n = k.weight(w);
      if (decade && (k.id === "bulwark" || k.id === "fang" || k.id === "reaver")) n *= 1.85;
      if (surge && (k.id === "weaver" || k.id === "raven" || k.id === "charger")) n *= 1.55;
      total += n;
      return n;
    });
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return pool[i];
    }
    return pool[0];
  }
  function waveDifficulty(w) {
    const x = Math.max(0, w - 1);
    return {
      hp: 1 + x * 0.065 + x * x * 165e-5,
      speed: 1 + Math.min(0.34, x * 6e-3),
      damage: 1 + Math.min(0.72, x * 0.012),
      spawn: 0.58 + w * 0.082 + Math.floor(w / 10) * 0.16 + (w % 5 === 0 ? 0.55 : 0),
      cap: Math.min(66, 18 + Math.floor(w * 0.78))
    };
  }
  function spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    const M = 8, top = Math.max(M, PLAY_TOP);
    if (edge === 0) {
      x = Math.random() * W;
      y = top;
    } else if (edge === 1) {
      x = W - M;
      y = top + Math.random() * Math.max(1, H - top - M);
    } else if (edge === 2) {
      x = Math.random() * W;
      y = H - M;
    } else {
      x = M;
      y = top + Math.random() * Math.max(1, H - top - M);
    }
    const kind = waveEnemyKind(G.wave), q = waveDifficulty(G.wave), hp = kind.hp * q.hp;
    G.enemies.push({
      x,
      y,
      r: kind.r,
      hp,
      max: hp,
      sp: kind.sp * q.speed,
      c: kind.c,
      tier: kind.tier,
      type: kind.type,
      species: kind.id,
      speciesName: kind.name,
      ai: kind.ai,
      contactDamage: Math.round(kind.dmg * q.damage),
      xpValue: kind.xp,
      visualScale: kind.visualScale,
      visualHeight: kind.visualHeight,
      animRate: kind.animRate,
      aiT: Math.random() * 120 | 0,
      aiSeed: Math.random() * 6.283,
      orbitDir: Math.random() < 0.5 ? -1 : 1,
      chargeX: 0,
      chargeY: 0,
      anim: Math.random() * 1e3,
      ember: 0,
      emberT: 0,
      chill: 0,
      hit: 0,
      broken: 0,
      wob: Math.random() * 7,
      st: {}
    });
  }
  function eliteSpiderCountForWave(w) {
    return w === 30 ? 1 : w === 40 ? 2 : w === 55 ? 3 : 0;
  }
  function spawnNetherSpider(w = 30, count = 1) {
    const q = waveDifficulty(w), hp = 850 * q.hp;
    for (let i = 0; i < count; i++) {
      const x = count === 1 ? W * 0.5 : W * (0.28 + 0.44 * (i / (count - 1)));
      G.enemies.push({
        x,
        y: Math.max(18, PLAY_TOP + 42 + i % 2 * 18),
        r: 42,
        hp,
        max: hp,
        sp: 0.78 * q.speed,
        c: "#173e31",
        tier: 2,
        type: "spider",
        species: "netherSpider",
        speciesName: "幽冥墨蛛",
        ai: "spider",
        isElite: true,
        contactDamage: Math.round(24 * q.damage),
        xpValue: 12,
        aiT: i * 17,
        aiSeed: Math.random() * 6.283,
        orbitDir: i % 2 ? -1 : 1,
        chargeX: 0,
        chargeY: 1,
        anim: i * 41,
        ember: 0,
        emberT: 0,
        chill: 0,
        hit: 0,
        broken: 0,
        wob: Math.random() * 7,
        st: {}
      });
    }
    G.banner = { txt: "第 " + w + " 境 · 幽冥墨蛛 ×" + count, life: 1 };
    if (hooks2.floatText) hooks2.floatText(W * 0.5, H * 0.22, "小精英現形", "#25684f");
    if (hooks2.playWave) hooks2.playWave();
    if (hooks2.flash) hooks2.flash(0.12, "190,225,205");
  }
  var XUANMING_HP = 6e5;
  var XUANMING_CONFIG = {
    baseHP: XUANMING_HP,
    phaseThresholds: [0.7, 0.35, 0.1],
    moveBounds: { xMin: 0.16, xMax: 0.84, yMin: 0.2, yMax: 0.4 },
    evade: { charges: 2, rechargeFrames: 240, cooldownFrames: 72, submergeMaxFrames: 120 },
    defense: { rollingWindowFrames: 72, triggerRatio: 0.07, cooldownFrames: 300, coilFrames: 90, coilDamageReduction: 0.6 },
    phase3: { bodyDamageMultiplier: 0.2, headDamageMultiplier: 1 },
    attacks: {
      headLunge: { telegraph: 33, active: 15, recovery: 51 },
      inkBreath: { telegraph: 48, active: 90, recovery: 45 },
      tailSlash: { telegraph: 27, active: 21, recovery: 42 },
      inkOrbs: { telegraph: 21, shots: 3, recovery: 33 },
      breakInk: { telegraph: 36, active: 12, recovery: 45 },
      doubleShadow: { telegraph: 54, recovery: 48 },
      coilSky: { telegraph: 42, loops: 2, recovery: 60 },
      inkTide: { telegraph: 48, active: 72, recovery: 54 },
      xuanmingPierce: { telegraph: 18, passes: 3, recovery: 48 },
      xuanmingBreath: { telegraph: 72, active: 144, recovery: 72 },
      myriadHeads: { telegraph: 54, headsMin: 3, headsMax: 5, recovery: 54 },
      coilField: { telegraph: 54, loops: 3, recovery: 72 }
    },
    assets: {
      idle: "boss_xuanming_idle",
      aim: "boss_xuanming_aim",
      lunge: "boss_xuanming_lunge",
      breathCharge: "boss_xuanming_breath_charge",
      twist: "boss_xuanming_twist",
      fastSwim: "boss_xuanming_fast_swim",
      coilGuard: "boss_xuanming_coil_guard",
      halfDissolve: "boss_xuanming_half_dissolve",
      phase3Head: "boss_xuanming_head_phase3",
      dying: "boss_xuanming_dying"
    }
  };
  var BOSS_PLAYER_Y_RATIO = 0.64;
  function spawnXuanmingBoss(testMode) {
    const hp = XUANMING_HP;
    const en = {
      x: W * 0.5,
      y: H * 0.19,
      r: 72,
      hp,
      max: hp,
      sp: 0,
      c: "#211f1d",
      tier: 2,
      type: "boss",
      isBoss: true,
      bossState: testMode ? "manifest" : "telegraph",
      bossT: testMode ? 28 : 0,
      bossSide: 0,
      bossAngle: -Math.PI / 2,
      bossHit: false,
      alpha: testMode ? 0.72 : 0.05,
      attackSeq: 0,
      attackKind: "triple",
      phaseSeen: 1,
      pendingPhase: 0,
      evadeCharges: XUANMING_CONFIG.evade.charges,
      evadeCooldown: 0,
      defenseCooldown: 0,
      rollingDamage: 0,
      anim: 0,
      ember: 0,
      emberT: 0,
      chill: 0,
      hit: 0,
      broken: 0,
      wob: Math.random() * 7,
      st: {}
    };
    G.enemies.push(en);
    return en;
  }
  function beginXuanmingWave() {
    for (const en of G.enemies) {
      if (!en.isBoss && hooks2.mistDissolve) hooks2.mistDissolve(en.x, en.y, 0.72, "58,54,49");
    }
    G.enemies.length = 0;
    G.bossShots.length = 0;
    G.spawnAcc = 0;
    G.waveTimer = 0;
    G.wave = 60;
    G.waveKills = 0;
    G.bossEntered = true;
    G.chapterComplete = false;
    if (G.player) G.player.y = H * BOSS_PLAYER_Y_RATIO;
    const boss = spawnXuanmingBoss(false);
    G.banner = null;
    if (hooks2.playWave) hooks2.playWave();
    if (hooks2.setIntensity) hooks2.setIntensity(60);
    if (hooks2.flash) hooks2.flash(0.18, "250,244,226");
    if (hooks2.updateHUD) hooks2.updateHUD();
    return boss;
  }
  function completeXuanmingWave(en) {
    if (!en || !en.isBoss || G.chapterComplete) return false;
    G.bossShots.length = 0;
    G.wave = 61;
    G.waveTimer = 0;
    G.chapterComplete = true;
    if (G.bossTest && G.bossPreset60) G.bossKillSecs = (G.bossFightFrames || 0) / 60;
    G.banner = { txt: G.bossKillSecs != null ? "基準擊破 · " + G.bossKillSecs.toFixed(1) + "秒" : "玄冥墨蛟 · 墨散卷復", life: 1 };
    if (hooks2.stopMusic) hooks2.stopMusic(1.2);
    if (hooks2.updateHUD) hooks2.updateHUD();
    return true;
  }
  function bossPhase(en) {
    const r = en ? en.hp / en.max : 1;
    return r > 0.7 ? 1 : r > 0.35 ? 2 : 3;
  }
  function bossVisualLift(side) {
    return side === 0 ? -24 : side === 2 ? -42 : 0;
  }
  function bossOrbitRadius(side) {
    const visualR = Math.max(210, Math.min(300, W * 0.48, Math.min(W, H) * 0.46));
    if (side === 0) return visualR + bossVisualLift(0);
    if (side === 2) return visualR - bossVisualLift(2);
    return visualR;
  }
  function placeBoss(en, ang, r) {
    en.bossSide = 0;
    en.bossAngle = -Math.PI / 2;
    en.x = W * 0.5;
    en.y = H * 0.38 - bossVisualLift(0);
  }
  function bossSafeSide(en) {
    return 0;
  }
  function bossMoveToSide(en, side, state) {
    en.bossSide = 0;
    en.bossAngle = -Math.PI / 2;
    placeBoss(en, en.bossAngle, bossOrbitRadius(0));
    en.bossState = state;
    en.bossT = 0;
    en.bossHit = false;
  }
  function nextBossManifest(en) {
    bossMoveToSide(en, bossSafeSide(en), "telegraph");
    en.alpha = 0.06;
    en.attackSeq = (en.attackSeq || 0) + 1;
    const ratio = en.hp / en.max;
    en.attackKind = ratio > 0.7 ? "triple" : ratio > 0.4 ? "ring" : en.attackSeq & 1 ? "ring" : "triple";
    placeBoss(en, en.bossAngle, bossOrbitRadius(en.bossSide));
  }
  function updateBossP1(en) {
    const entering = bossPhase(en);
    if (entering > (en.phaseSeen || 1)) en.pendingPhase = Math.max(en.pendingPhase || 0, entering);
    en.bossT++;
    const R = bossOrbitRadius(en.bossSide);
    let state = en.bossState;
    if (en.pendingPhase > (en.phaseSeen || 1) && (state === "orbit" || state === "telegraph")) {
      en.phaseSeen = en.pendingPhase;
      en.pendingPhase = 0;
      en.bossState = "phase";
      state = "phase";
      en.bossT = 0;
      en.bossHit = false;
      G.bossShots.length = 0;
      if (hooks2.shake) hooks2.shake(7);
      if (hooks2.flash) hooks2.flash(0.16, "238,226,204");
    }
    const telegraphFrames = G.bossTest ? 34 : 72;
    const manifestFrames = G.bossTest ? 28 : 42;
    const orbitFrames = G.bossTest ? 54 : 100;
    if (state === "phase") {
      placeBoss(en, en.bossAngle, R);
      en.alpha = 1;
      if (en.bossT % 3 === 0) bossDissolveMist(en);
      if (en.bossT >= 90) nextBossManifest(en);
    } else if (state === "telegraph") {
      placeBoss(en, en.bossAngle, R);
      en.alpha = 1;
      if (en.bossT >= telegraphFrames) {
        en.bossState = "manifest";
        en.bossT = 0;
      }
    } else if (state === "manifest") {
      placeBoss(en, en.bossAngle, R);
      en.alpha = 1;
      if (en.bossT >= manifestFrames) {
        en.bossState = "orbit";
        en.bossT = 0;
        en.alpha = 1;
      }
    } else if (state === "orbit") {
      placeBoss(en, en.bossAngle, R);
      en.alpha = 1;
      if (en.bossT >= orbitFrames) {
        placeBoss(en, en.bossAngle, R);
        en.bossState = "lunge";
        en.bossT = 0;
        en.bossHit = false;
      }
    } else if (state === "lunge") {
      const t = Math.min(1, en.bossT / 58);
      placeBoss(en, en.bossAngle, R);
      en.alpha = 1;
      if (!en.bossHit && t >= 0.68) {
        en.bossHit = true;
        spawnBossAttack(en);
      }
      if (en.bossT >= 58) {
        en.bossState = "dissolve";
        en.bossT = 0;
      }
    } else if (state === "dissolve") {
      en.alpha = 1;
      if (en.bossT >= 46) nextBossManifest(en);
    }
    en.depth = Math.max(0, Math.min(1, (en.y - (G.player.y - R)) / (R * 2)));
    en.visualScale = 2.12;
    en.lean = Math.max(-0.16, Math.min(0.16, (en.x - (en.px == null ? en.x : en.px)) * 0.025));
    en.face = Math.atan2(G.player.y - en.y, G.player.x - en.x);
    en.px = en.x;
    en.py = en.y;
    if (state === "dissolve" && en.bossT % 4 === 0) bossDissolveMist(en);
    if (en.hit > 0) en.hit--;
  }
  function bossDissolveMist(en) {
    const f = en.face || 0, progress = Math.min(1, en.bossT / 46);
    for (let k = 0; k < (progress < 0.68 ? 3 : 1); k++) {
      const local = -en.r * 0.85 + en.r * 1.55 * Math.min(1, progress + Math.random() * 0.22);
      const side = (Math.random() - 0.5) * en.r * 0.75;
      const x = en.x + Math.cos(f) * local - Math.sin(f) * side;
      const y = en.y + Math.sin(f) * local + Math.cos(f) * side;
      G.mists.push({
        x,
        y,
        vx: -Math.sin(f) * (0.35 + Math.random() * 0.45) * (k % 2 ? 1 : -1),
        vy: Math.cos(f) * (0.2 + Math.random() * 0.35) * (k % 2 ? 1 : -1) - 0.28,
        r: 18 + Math.random() * 24,
        age: 0,
        dur: 32 + (Math.random() * 18 | 0),
        color: "38,35,32",
        squash: 0.32 + Math.random() * 0.3,
        rot: f + (Math.random() - 0.5) * 0.8
      });
    }
    const sides = [-Math.PI / 2, 0, Math.PI / 2, Math.PI], next = sides[(en.bossSide + 1) % 4];
    const R = bossOrbitRadius((en.bossSide + 1) % 4);
    if (progress >= 0.38) {
      const mx = G.player.x + Math.cos(next) * R;
      const my = G.player.y + Math.sin(next) * R + bossVisualLift((en.bossSide + 1) % 4);
      const gather = Math.min(1, (progress - 0.38) / 0.62);
      G.mists.push({
        x: mx + (Math.random() - 0.5) * (1 - gather) * 42,
        y: my + (Math.random() - 0.5) * (1 - gather) * 34,
        vx: (mx - en.x) * 15e-4 * (1 - gather) - Math.sin(next) * 0.18,
        vy: (my - en.y) * 15e-4 * (1 - gather) + Math.cos(next) * 0.18 - 0.08,
        r: 18 + Math.random() * 14,
        age: 0,
        dur: 22 + (Math.random() * 9 | 0),
        color: "40,37,33",
        squash: 0.28 + Math.random() * 0.14,
        rot: next + Math.PI / 2
      });
    }
  }
  function killEnemy(idx) {
    const en = G.enemies[idx];
    const runState = hooks2.getRunState ? hooks2.getRunState() : null;
    hooks2.mistDissolve(en.x, en.y, 1 + en.tier * 0.22, "45,42,38");
    hooks2.playKill(en.tier);
    hooks2.shake(2 + en.tier * 2.6);
    if (en.tier === 2) {
      hooks2.hitstop(4);
      hooks2.flash(0.1, "220,210,190");
    }
    if (stat.splashOnKill) {
      const R = 54 + (stat.explode || 0) * 0.35;
      const sd = stat.damage * 0.28 * (stat.splashDamage || 1);
      hooks2.mistDissolve(en.x, en.y, 1.18, "54,49,43");
      for (const e2 of G.enemies) {
        if (e2 !== en && Math.hypot(e2.x - en.x, e2.y - en.y) < R) {
          hooks2.dmgTo(e2, sd);
          e2.hit = 6;
        }
      }
    }
    if (en.eroV && en.st && en.st.erosion && en.st.erosion.stk >= 4) {
      hooks2.mistDissolve(en.x, en.y, 1.45, "28,25,22");
    }
    if ((stat.tierFlags || {}).dotBurst && en.st && en.st.erosion && en.st.erosion.t > 0) {
      const e = en.st.erosion, left = e.stk * 4 * (e.t / 60);
      if (left > 0) {
        hooks2.splash(en.x, en.y, "#5a4a3a", 1.8);
        for (const e2 of G.enemies) if (e2 !== en && Math.hypot(e2.x - en.x, e2.y - en.y) < 86) {
          hooks2.dmgTo(e2, left);
          e2.hit = 6;
        }
        hooks2.floatText(en.x, en.y - en.r - 30, "蝕爆", "#7a6a58");
      }
    }
    G.kills++;
    G.waveKills = (G.waveKills || 0) + 1;
    hooks2.dpsAdd("k", 1);
    G.mana = Math.min(stat.manaMax, G.mana + (stat.regen || 0));
    if (runState) {
      const gained = INK_CONFIG.runtime.noteKill(runState, 1);
      if (gained.length) {
        hooks2.syncStat();
        G.tierToast = (G.tierToast || []).concat(gained.map((g) => g.name + " · " + g.tier));
        G.banner = { txt: gained[0].name + " · " + gained[0].tier, life: 1 };
        hooks2.playLevel();
      }
    }
    hooks2.gainXP(en.xpValue || (en.tier === 2 ? 4 : en.tier === 1 ? 2 : 1));
    G.enemies.splice(idx, 1);
    hooks2.updateHUD();
    if (en.isBoss) {
      completeXuanmingWave(en);
    }
  }
  function updateEnemies() {
    const P = G.player;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const en = G.enemies[i];
      if (en.broken > 0) en.broken--;
      if (en.hp <= 0) {
        killEnemy(i);
        continue;
      }
      if (en.isBoss) {
        if (!G.bossShowcase) updateBossP1(en);
        continue;
      }
      if (en.actorPoc) {
        en.actorPocTick = (en.actorPocTick || 0) + 1;
        const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        const dir = dirs[Math.floor(en.actorPocTick / 90) % dirs.length];
        const vectors = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1] };
        const v = vectors[dir];
        en.moveDir = Math.atan2(v[1], v[0]);
        en.hit = 0;
        continue;
      }
      const dx = P.x - en.x, dy = P.y - en.y, d = Math.hypot(dx, dy) || 1;
      let sp = en.sp;
      if (en.chill > 0) {
        en.chill--;
        sp *= 0.45;
      }
      if (en.st) {
        let slow = 0, dead = false;
        for (const key in en.st) {
          const e = en.st[key];
          if (!e || e.t <= 0) continue;
          const cfg = stat.statuses && stat.statuses[key];
          if (!cfg) {
            e.t = 0;
            e.stk = 0;
            continue;
          }
          e.t--;
          if (cfg.slow) slow = Math.max(slow, cfg.slow * e.stk + (key === "suppression" ? stat.slowBonus || 0 : 0));
          if (cfg.damagePerSecond) {
            e.acc += cfg.damagePerSecond * e.stk / 60;
            if (e.acc >= 1) {
              const hurt = Math.floor(e.acc);
              e.acc -= hurt;
              hooks2.dmgTo(en, hurt);
              if (key === "erosion") {
                const EV = hooks2.ensureEroV(en);
                EV.flash = 12;
                if (e.stk >= 3) EV.suck = 10;
                const a = Math.random() * 6.283, rr = en.r * 0.7;
                hooks2.ink(en.x + Math.cos(a) * rr, en.y + Math.sin(a) * rr, Math.cos(a) * 0.5, Math.sin(a) * 0.5 + 0.4, 3 + Math.random() * 4);
              }
              if (G.t % 20 === 0) hooks2.floatText(
                en.x,
                en.y - en.r,
                key === "erosion" ? "蝕" : "鎮",
                key === "erosion" ? "#7a6a58" : "#5a6a80"
              );
              if (key === "erosion" && (stat.tierFlags || {}).dotSpread && Math.random() < 0.34) {
                for (const e2 of G.enemies) {
                  if (e2 === en || Math.hypot(e2.x - en.x, e2.y - en.y) > 92) continue;
                  if (!e2.st) e2.st = {};
                  const c2 = e2.st.erosion || (e2.st.erosion = { stk: 0, t: 0, acc: 0 });
                  if (c2.stk < 6) {
                    c2.stk++;
                    c2.t = Math.max(c2.t, 90);
                  }
                  break;
                }
              }
              if (en.hp <= 0) {
                dead = true;
                break;
              }
            }
          }
          if (e.t <= 0) e.stk = 0;
        }
        if (dead) {
          killEnemy(i);
          continue;
        }
        if (en.rootT > 0) {
          en.rootT--;
          sp = 0;
          if (en.rootT === 0 && en.rootWC) {
            hooks2.whiteCut(en.x, en.y, Math.random() * 6.283);
            hooks2.dmgTo(en, stat.damage * 0.9);
            en.hit = 6;
            hooks2.splash(en.x, en.y, "#efe4cc", 1.4);
          }
        }
        if (slow > 0) sp *= 1 - Math.min(0.7, slow);
        const sup = en.st.suppression;
        if (sup && sup.t > 0) {
          const V = hooks2.ensureSupV(en);
          V.lx += (en.x - V.lx) * 0.16;
          V.ly += (en.y - V.ly) * 0.16;
          if (V.press > 0) V.press--;
          if (V.sink > 0) V.sink--;
          if (++V.t >= 90) {
            V.t = 0;
            V.cyc++;
          }
        } else if (en.supV) en.supV = null;
        const ero = en.st.erosion;
        if (ero && ero.t > 0) {
          const EV = hooks2.ensureEroV(en);
          if (EV.flash > 0) EV.flash--;
          if (EV.suck > 0) EV.suck--;
          if (++EV.t >= 42) {
            EV.t = 0;
            EV.cracks = null;
          }
        } else if (en.eroV) en.eroV = null;
      }
      if (G.anchors.length && (stat.tierFlags || {}).anchorField) {
        for (const A of G.anchors) {
          if ((en.x - A.x) ** 2 + (en.y - A.y) ** 2 < (A.r + en.r) ** 2) {
            sp *= 0.82;
            break;
          }
        }
      }
      en.aiT = (en.aiT || 0) + 1;
      let mx = dx / d, my = dy / d;
      if (en.ai === "weave") {
        const sway = Math.sin(en.aiT * 0.095 + en.aiSeed) * 0.82;
        mx = dx / d + -dy / d * sway;
        my = dy / d + dx / d * sway;
        const ml = Math.hypot(mx, my) || 1;
        mx /= ml;
        my /= ml;
      } else if (en.ai === "orbit") {
        const side = (en.orbitDir || 1) * (d > 150 ? 0.78 : 0.98), inward = d > 135 ? 0.7 : 0.18;
        mx = dx / d * inward + -dy / d * side;
        my = dy / d * inward + dx / d * side;
        const ml = Math.hypot(mx, my) || 1;
        mx /= ml;
        my /= ml;
      } else if (en.ai === "swoop") {
        const t = en.aiT % 170;
        if (t < 84) {
          const inward = d > 210 ? 0.72 : d < 165 ? -0.38 : 0.05, side = (en.orbitDir || 1) * 0.92;
          mx = dx / d * inward + -dy / d * side;
          my = dy / d * inward + dx / d * side;
        } else if (t < 104) {
          if (t === 84) {
            en.chargeX = dx / d;
            en.chargeY = dy / d;
          }
          mx = en.chargeX;
          my = en.chargeY;
          sp *= 0.18;
        } else if (t < 132) {
          mx = en.chargeX;
          my = en.chargeY;
          sp *= 3.15;
        } else {
          mx = -dx / d * 0.74 + -dy / d * (en.orbitDir || 1) * 0.26;
          my = -dy / d * 0.74 + dx / d * (en.orbitDir || 1) * 0.26;
        }
        const ml = Math.hypot(mx, my) || 1;
        mx /= ml;
        my /= ml;
      } else if (en.ai === "charge" || en.ai === "reaver") {
        const cycle = en.ai === "reaver" ? 125 : 155, t = en.aiT % cycle;
        if (t === 1) {
          en.chargeX = dx / d;
          en.chargeY = dy / d;
        }
        if (t < 26) {
          sp *= 0.22;
        } else if (t < 48) {
          mx = en.chargeX;
          my = en.chargeY;
          sp *= en.ai === "reaver" ? 3.05 : 2.65;
        } else if (en.ai === "reaver") {
          mx = dx / d * 0.45 + -dy / d * (en.orbitDir || 1) * 0.72;
          my = dy / d * 0.45 + dx / d * (en.orbitDir || 1) * 0.72;
        }
      } else if (en.ai === "pounce") {
        const t = en.aiT % 138;
        if (t < 38) {
          sp *= 0.82;
        } else if (t < 56) {
          if (t === 38) {
            en.chargeX = dx / d;
            en.chargeY = dy / d;
          }
          mx = en.chargeX;
          my = en.chargeY;
          sp *= 0.12;
        } else if (t < 76) {
          mx = en.chargeX;
          my = en.chargeY;
          sp *= 3.35;
        } else if (t < 98) {
          sp *= 0.34;
        }
      } else if (en.ai === "spider") {
        const t = en.aiT % 180;
        if (t < 54) {
          sp *= 0.08;
          mx = dx / d;
          my = dy / d;
          if (t === 38) spawnSpiderWebShot(en);
        } else if (t < 126) {
          const inward = d > 185 ? 0.58 : d < 145 ? -0.35 : 0.08, side = (en.orbitDir || 1) * 0.92;
          mx = dx / d * inward + -dy / d * side;
          my = dy / d * inward + dx / d * side;
        } else if (t < 152) {
          if (t === 126) {
            en.chargeX = dx / d;
            en.chargeY = dy / d;
          }
          mx = en.chargeX;
          my = en.chargeY;
          sp *= 2.8;
        } else {
          mx = -dx / d * 0.32 + -dy / d * (en.orbitDir || 1) * 0.55;
          my = -dy / d * 0.32 + dx / d * (en.orbitDir || 1) * 0.55;
        }
        const ml = Math.hypot(mx, my) || 1;
        mx /= ml;
        my /= ml;
      }
      if (en.type === "blade" || en.type === "spider" || en.type === "raven" || en.type === "fang") {
        if (Math.abs(mx) > 0.045) en.facing = mx >= 0 ? -1 : 1;
        else if (en.facing == null) en.facing = dx >= 0 ? -1 : 1;
        en.moveDir = Math.atan2(my, mx);
      }
      en.x += mx * sp;
      en.y += my * sp;
      if (!en.isBoss && PLAY_TOP > 0 && en.y < PLAY_TOP + en.r) en.y = PLAY_TOP + en.r;
      en.wob += 0.1;
      if (en.hit > 0) en.hit--;
      if (en.ember > 0) {
        en.emberT++;
        if (en.emberT % 18 === 0) {
          hooks2.dmgTo(en, 2 * en.ember);
          hooks2.floatText(en.x, en.y - en.r, "焱", "#c0662e");
          if (en.hp <= 0) {
            killEnemy(i);
            continue;
          }
        }
      }
      if (en.chill > 0) {
        if (en.chill % 22 === 0) {
          hooks2.dmgTo(en, 1.5 * stat.ice);
          hooks2.floatText(en.x, en.y - en.r, "凍", "#5a9cc0");
          if (en.hp <= 0) {
            killEnemy(i);
            continue;
          }
        }
      }
      if (d < en.r + P.r) {
        if (!G.hpLocked) P.hp -= en.contactDamage || (en.tier === 2 ? 18 : en.tier === 1 ? 11 : 7);
        else P.hp = P.max;
        P.pulse = 1;
        G.hurtT = 20;
        hooks2.splash(en.x, en.y, en.c, 1);
        G.enemies.splice(i, 1);
        hooks2.updateHUD();
        hooks2.playHurt();
        hooks2.shake(9 + en.tier * 3);
        hooks2.flash(0.22, "176,64,48");
        hooks2.hitstop(4);
        if (P.hp <= 0) {
          hooks2.beginDeath();
          return;
        }
      }
    }
  }
  function spawnBossAttack(en) {
    if (en.attackKind === "ring") {
      spawnBossRing(en);
      return;
    }
    const P = G.player, mouth = [{ x: 0, y: 0.52 }, { x: -0.52, y: -0.08 }, { x: 0, y: -0.52 }, { x: 0.52, y: -0.08 }][en.bossSide];
    const ox = en.x + mouth.x * en.r, oy = en.y + mouth.y * en.r + bossVisualLift(en.bossSide);
    const dx = P.x - ox, dy = P.y - oy, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    for (const lane of [-34, 0, 34]) {
      const x = ox + nx * lane, y = oy + ny * lane, tx = P.x + nx * lane * 0.22, ty = P.y + ny * lane * 0.22;
      const vx = tx - x, vy = ty - y, L = Math.hypot(vx, vy) || 1, heavy = lane === 0;
      G.bossShots.push({
        x,
        y,
        px: x,
        py: y,
        vx: vx / L * (heavy ? 1.12 : 1.38),
        vy: vy / L * (heavy ? 1.12 : 1.38),
        r: heavy ? 15 : 11,
        hp: heavy ? 2 : 1,
        max: heavy ? 2 : 1,
        dmg: heavy ? 18 : 11,
        age: 0,
        seed: Math.random() * 100
      });
    }
  }
  function spawnBossRing(en) {
    const P = G.player, N = en.hp / en.max <= 0.4 ? 14 : 11, R = Math.max(170, Math.min(W, H) * 0.4);
    const gap = en.bossSide / N * Math.PI * 2;
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2;
      let da = a - gap;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      if (Math.abs(da) < Math.PI / N * 1.3) continue;
      const x = P.x + Math.cos(a) * R, y = P.y + Math.sin(a) * R, spd = en.hp / en.max <= 0.4 ? 1.18 : 1.02;
      G.bossShots.push({
        x,
        y,
        px: x,
        py: y,
        vx: -Math.cos(a) * spd,
        vy: -Math.sin(a) * spd,
        r: 10,
        hp: 1,
        max: 1,
        dmg: 9,
        ring: true,
        age: 0,
        seed: Math.random() * 100
      });
    }
  }
  function spawnSpiderWebShot(en) {
    const P = G.player, dir = en.facing || 1;
    const ox = en.x + dir * en.r * 0.62, oy = en.y - en.r * 0.18;
    const dx = P.x - ox, dy = P.y - oy, L = Math.hypot(dx, dy) || 1, spd = 2.05;
    G.bossShots.push({
      x: ox,
      y: oy,
      px: ox,
      py: oy,
      vx: dx / L * spd,
      vy: dy / L * spd,
      r: 13,
      hp: 1,
      max: 1,
      dmg: 0,
      web: true,
      age: 0,
      seed: Math.random() * 100
    });
  }
  function updateBossShots() {
    const P = G.player;
    for (let i = G.bossShots.length - 1; i >= 0; i--) {
      const q = G.bossShots[i];
      q.age++;
      q.px = q.x;
      q.py = q.y;
      q.x += q.vx;
      q.y += q.vy;
      if (Math.hypot(q.x - P.x, q.y - P.y) < q.r + P.r) {
        if (q.web) {
          G.webT = Math.max(G.webT, 105);
          if (hooks2.floatText) hooks2.floatText(P.x, P.y - P.r - 24, "蛛網封脈", "#397b62");
          if (hooks2.ink) for (let n = 0; n < 8; n++) {
            const a = n * 0.785;
            hooks2.ink(P.x + Math.cos(a) * 54, P.y + Math.sin(a) * 54, 0, 0, 4);
          }
          if (hooks2.playHit) hooks2.playHit();
          if (hooks2.shake) hooks2.shake(4);
          if (hooks2.flash) hooks2.flash(0.1, "190,225,205");
        } else {
          if (!G.hpLocked) P.hp = Math.max(0, P.hp - (q.dmg || 18));
          else P.hp = P.max;
          P.pulse = 1;
          G.hurtT = 20;
          if (hooks2.playHurt) hooks2.playHurt();
          if (hooks2.shake) hooks2.shake(8);
          if (hooks2.flash) hooks2.flash(0.18, "176,64,48");
        }
        inkCoreDissolve(q, Math.atan2(q.vy, q.vx));
        G.bossShots.splice(i, 1);
        if (hooks2.updateHUD) hooks2.updateHUD();
        if (P.hp <= 0) {
          if (hooks2.beginDeath) hooks2.beginDeath();
          return;
        }
      } else if (q.age > 360) G.bossShots.splice(i, 1);
    }
  }
  function inkCoreDissolve(q, ang) {
    for (let k = 0; k < 6; k++) {
      const side = (k - 2.5) * 3.5, a = ang + (k % 2 ? 1 : -1) * (0.12 + 0.08 * k);
      G.mists.push({
        x: q.x - Math.sin(ang) * side,
        y: q.y + Math.cos(ang) * side,
        vx: Math.cos(a) * (0.25 + 0.12 * k),
        vy: Math.sin(a) * (0.25 + 0.12 * k) - 0.08,
        r: 9 + Math.random() * 9,
        age: 0,
        dur: 18 + (Math.random() * 9 | 0),
        color: "39,35,31",
        squash: 0.16 + Math.random() * 0.14,
        rot: a
      });
    }
  }

  // src/combat.js
  var hooks3 = {};
  var cmdSeq = 0;
  function configureCombat(nextHooks) {
    hooks3 = nextHooks || {};
  }
  function pathLen(path) {
    let L = 0;
    for (let i = 1; i < path.length; i++) L += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    return L;
  }
  function leadInLen(path) {
    const P = G.player, s = path && path[0];
    return P && s ? Math.hypot(s.x - P.x, s.y - P.y) : 0;
  }
  function bladeLength() {
    return 44 + stat.size * 0.9;
  }
  function inlineGap() {
    return bladeLength() + 28;
  }
  function inlineTipLead() {
    return bladeLength() * 0.8;
  }
  function autoCommandEndpoint(player, target, maxStroke = 220, contactReach = 0) {
    if (!player || !target) return null;
    const dx = target.x - player.x, dy = target.y - player.y, distance = Math.hypot(dx, dy);
    if (distance <= 0) return { x: player.x, y: player.y, length: 0 };
    const length = Math.min(maxStroke, Math.max(0, distance - Math.max(0, contactReach)));
    return { x: player.x + dx / distance * length, y: player.y + dy / distance * length, length };
  }
  function selectAutoTarget(enemies, player, maxStroke = 220, contactReach = 0, isVisible = () => true) {
    if (!player) return null;
    let best = null, bestDistance = Infinity;
    for (const enemy of enemies || []) {
      if (!enemy || !isVisible(enemy)) continue;
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      const reach = maxStroke + Math.max(0, contactReach) + (enemy.r || 0);
      if (distance <= reach && distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    }
    return best;
  }
  function fanPose(c, a) {
    const dx = c.x - c.ox, dy = c.y - c.oy, ca = Math.cos(a), sa = Math.sin(a);
    let x = c.ox + dx * ca - dy * sa, y = c.oy + dx * sa + dy * ca;
    const CAP = Math.min(300, W * 0.28);
    const ox = x - c.x, oy = y - c.y, m = Math.hypot(ox, oy);
    if (m > CAP) {
      const k = CAP / m;
      x = c.x + ox * k;
      y = c.y + oy * k;
    }
    return { x, y, ang: c.ang + a };
  }
  function formationOffset(formation, i, n, spacing, spread) {
    if (n <= 1) return { along: 0, side: 0 };
    const mid = (n - 1) / 2, t = (i - mid) / Math.max(1, mid);
    if (formation === "merge") return { along: 0, side: 0 };
    if (formation === "parallel") return { along: 0, side: t * spacing };
    if (formation === "inline") return { along: -inlineTipLead() - i * inlineGap(), side: 0 };
    return { along: 0, side: 0, ang: t * FAN_PHI, fan: true };
  }
  function sampleTrailPoint(points, distance) {
    if (!points?.length) return null;
    let remain = Math.max(0, distance || 0);
    for (let i = points.length - 1; i > 0; i--) {
      const a2 = points[i - 1], b2 = points[i], dx = b2.x - a2.x, dy = b2.y - a2.y, len = Math.hypot(dx, dy);
      if (len < 1e-4) continue;
      if (remain <= len) {
        const t = 1 - remain / len;
        return { x: a2.x + dx * t, y: a2.y + dy * t, ang: Math.atan2(dy, dx) };
      }
      remain -= len;
    }
    const a = points[0], b = points[Math.min(1, points.length - 1)];
    return { x: a.x, y: a.y, ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }
  function seedInlineTrail(c) {
    const need = inlineTipLead() + Math.max(0, c.slots - 1) * inlineGap() + 40;
    const ux = Math.cos(c.ang), uy = Math.sin(c.ang), points = [];
    for (let d = need; d > 0; d -= 20) points.push({ x: c.x - ux * d, y: c.y - uy * d });
    points.push({ x: c.x, y: c.y });
    c.inlineTrail = points;
    c.inlineTrailMax = need + 80;
  }
  function appendInlineTrail(c) {
    if (c.formation !== "inline") return;
    if (!c.inlineTrail) seedInlineTrail(c);
    const last = c.inlineTrail[c.inlineTrail.length - 1], dx = c.x - last.x, dy = c.y - last.y;
    if (Math.hypot(dx, dy) > 0.25) c.inlineTrail.push({ x: c.x, y: c.y });
    let total = 0, cut = 0;
    for (let i = c.inlineTrail.length - 1; i > 0; i--) {
      total += Math.hypot(c.inlineTrail[i].x - c.inlineTrail[i - 1].x, c.inlineTrail[i].y - c.inlineTrail[i - 1].y);
      if (total > c.inlineTrailMax) {
        cut = i - 1;
        break;
      }
    }
    if (cut > 0) c.inlineTrail.splice(0, cut);
  }
  function turnToward(from, to, limit = 0.24) {
    let d = to - from;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return from + Math.max(-limit, Math.min(limit, d));
  }
  function cmdLife(len) {
    const LM = window.INK_CONFIG && INK_CONFIG.lifeModel || { pixelsPerLife: 120, maxBonus: 12 };
    const bonus = Math.min(LM.maxBonus, Math.floor(Math.max(0, len) / LM.pixelsPerLife));
    return Math.max(1, 1 + bonus);
  }
  function speedMul(c) {
    const sp = (stat.speed || BASE_SPEED) * (c && c.speedMul || 1);
    return 1 + Math.max(-0.4, sp / BASE_SPEED - 1) * 0.6;
  }
  function durCost(dmg) {
    const base = Math.max(1, stat.damage || 1);
    const AM = window.INK_CONFIG && INK_CONFIG.armorModel || { perPoint: 0.1 };
    const soak = Math.max(0.5, 1 + (stat.armor || 0) * AM.perPoint);
    return Math.max(0.05, dmg / base / soak);
  }
  function swordDissolve(sw) {
    hooks3.mistDissolve?.(sw.x, sw.y, 1.15, "46,42,38");
    hooks3.splash?.(sw.x, sw.y, "#2b2620", 1);
    for (let k = 0; k < 5; k++) hooks3.ink?.(sw.x, sw.y, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 7 + Math.random() * 9);
  }
  function spawnAnchor(sw) {
    const baseDur = 300, t = Math.round(baseDur * (1 + (stat.anchorDur || 0)));
    const dmg = stat.damage * (1 + (stat.anchorDmgMul || 0));
    const visual = { x: sw.x, y: sw.y - 11, ang: Math.PI / 2, vx: 0, vy: 0, age: 30, seed: sw.seed || 0, trail: [] };
    G.anchors.push({ x: sw.x, y: sw.y, ang: sw.ang, r: 44, sr: 26, t, tMax: t, dmg, hitSet: /* @__PURE__ */ new Set(), visual });
    if (G.anchors.length > 40) G.anchors.shift();
    hooks3.splash?.(sw.x, sw.y, "#2b2620", 1.1);
    for (let k = 0; k < 6; k++) hooks3.ink?.(sw.x, sw.y, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2.2, 6 + Math.random() * 7);
  }
  function detonateAnchor(A) {
    const R = 88, dmg = A.dmg * 1.4;
    hooks3.splash?.(A.x, A.y, "#c0662e", 2.4);
    hooks3.playBoom?.();
    hooks3.shake?.(7);
    for (let k = 0; k < 10; k++) hooks3.ink?.(A.x, A.y, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 10 + Math.random() * 14);
    for (const en of G.enemies) {
      if (en.isBoss && en.bossState !== "orbit" && en.bossState !== "lunge") continue;
      if ((en.x - A.x) ** 2 + (en.y - A.y) ** 2 < R * R) {
        hooks3.dmgTo?.(en, dmg);
        en.hit = 6;
      }
    }
    const TF = stat.tierFlags || {};
    if (TF.inkDropOnSplash) {
      for (let k = 0; k < 3; k++) {
        const a = Math.random() * 6.283, r = 20 + Math.random() * 30;
        G.drops.push({ x: A.x + Math.cos(a) * r, y: A.y + Math.sin(a) * r, r: 14, t: 300, dmg: stat.damage * 0.35, boom: !!TF.inkDropExplode });
      }
      if (G.drops.length > 24) G.drops.splice(0, G.drops.length - 24);
    }
    hooks3.floatText?.(A.x, A.y - A.r - 10, "鋒碎", "#c0662e");
  }
  function spawnCmdSword(c, slot, delay) {
    const _o = formationOffset(c.formation, slot, c.slots, c.spacing, c.age * (stat.flySpeed || stat.speed || 14));
    let _x, _y;
    if (_o.fan && c.ox != null) {
      const q = fanPose(c, _o.ang);
      _x = q.x;
      _y = q.y;
    } else {
      const _ca = Math.cos(c.ang), _sa = Math.sin(c.ang);
      _x = c.x + _ca * _o.along - _sa * _o.side;
      _y = c.y + _sa * _o.along + _ca * _o.side;
    }
    const sw = {
      cmd: c,
      slot,
      x: _x,
      y: _y,
      px: _x,
      py: _y,
      ang: c.ang + (_o.ang || 0),
      vx: 0,
      vy: 0,
      trail: [],
      age: 0,
      // 聚形要看起來是一把劍,連貼圖動畫幀都得對齊,所以整道劍令共用一個 seed
      seed: c.formation === "merge" && c.seed != null ? c.seed : Math.random() * 8,
      delay: delay || 0,
      // 聚鋒(A):錯開耐久 —— 第 k 把多 k 份耐久,讓重疊的劍一把一把剝落(平滑「破掉變小」),
      // 而非同幀同耗、一次全消。其餘陣型維持原耐久。
      pierceLeft: (c.life || 1) + (c.formation === "merge" ? slot : 0),
      hitSet: /* @__PURE__ */ new Set(),
      hitPass: /* @__PURE__ */ new Map(),
      shotPass: /* @__PURE__ */ new Map(),
      passId: 0,
      runDir: null,
      runTravel: 0,
      returned: false,
      echo: false
    };
    c.swords[slot] = sw;
    G.swords.push(sw);
    return sw;
  }
  function nearestEnemy(x, y, maxD) {
    let best = null, bd = (maxD || 1e9) ** 2;
    for (const en of G.enemies) {
      if (!onScreen(en)) continue;
      const d = (en.x - x) ** 2 + (en.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = en;
      }
    }
    return best;
  }
  function extendCommand(c, tx, ty) {
    const last = c.pts[c.pts.length - 1];
    const d = Math.hypot(tx - last.x, ty - last.y);
    if (d < 1) return false;
    const steps = Math.max(2, Math.round(d / 18));
    for (let i = 1; i <= steps; i++)
      c.pts.push({ x: last.x + (tx - last.x) * i / steps, y: last.y + (ty - last.y) * i / steps });
    c.len += d;
    if (c.step < 0) {
      c.step = 1;
    }
    c.seg = Math.max(1, Math.min(c.seg, c.pts.length - 1));
    c.alive = true;
    return true;
  }
  function spawnAutoCommand(x0, y0, x1, y1, opts) {
    if (G.commands.length >= 28) return null;
    opts = opts || {};
    const _len = Math.hypot(x1 - x0, y1 - y0);
    const c = {
      id: ++cmdSeq,
      pts: [{ x: x0, y: y0 }, { x: x1, y: y1 }],
      len: _len,
      life: cmdLife(_len),
      ox: x0,
      oy: y0,
      seg: 1,
      step: 1,
      x: x0,
      y: y0,
      ang: Math.atan2(y1 - y0, x1 - x0),
      formation: "single",
      spacing: 0,
      swords: [null],
      slots: 1,
      returnsLeft: opts.returns || 0,
      alive: true,
      age: 0,
      // 這幾個欄位主劍令有、自動劍令也必須有 —— 命中處理是共用的,
      // 少一個 hitOrder 就會在第一次命中丟例外,把後面的破甲/齊斬/歸鋒整串打斷。
      hitOrder: [],
      volley: 0,
      frameHit: null,
      extended: 0,
      anyHit: false,
      free: false,
      freeBack: false,
      passAt: [0, 0],
      auto: true,
      dmgMul: opts.dmgMul || 1,
      noIntent: !opts.intent
    };
    G.commands.push(c);
    const sw = spawnCmdSword(c, 0, 0);
    sw.echo = true;
    if (opts.skip) {
      sw.hitSet.add(opts.skip);
      sw.hitPass.set(opts.skip, sw.passId);
    }
    return c;
  }
  function buildStrokePasses(pts) {
    const out = new Array(pts.length).fill(0);
    let pass = 0, run = null;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y, L = Math.hypot(dx, dy);
      if (L < 0.5) {
        out[i] = pass;
        continue;
      }
      const dir = { x: dx / L, y: dy / L };
      if (!run) run = dir;
      else if (dir.x * run.x + dir.y * run.y < -0.35) {
        let travel = 0;
        for (let j = i; j < pts.length && travel < 24; j++) {
          const ux = pts[j].x - pts[j - 1].x, uy = pts[j].y - pts[j - 1].y, ul = Math.hypot(ux, uy);
          if (ul < 0.5) continue;
          if (ux / ul * dir.x + uy / ul * dir.y < 0.35) break;
          travel += ul;
        }
        if (travel >= 24) {
          pass++;
          run = dir;
        }
      }
      out[i] = pass;
    }
    return out;
  }
  function netManaSpend(gross, refund = 0) {
    return Math.max(0, gross * (1 - Math.max(0, Math.min(1, refund || 0))));
  }
  function launchCommand(path) {
    if (!path || path.length < 2) return;
    const s0 = path[0];
    const perPx = Math.max(1e-3, stat.costPerPx);
    let budget = Math.max(0, G.mana - stat.costBase);
    const freeCast = budget <= 0 && G.reserve > 0;
    if (freeCast) budget = Math.max(0, stat.manaMax - stat.costBase);
    if (budget <= 0) {
      hooks3.floatText?.(s0.x, s0.y - 14, "劍意不足", "#c08a2e");
      hooks3.burst?.(s0.x, s0.y, "#8a7a5a", 5);
      hooks3.playNoMana?.();
      return;
    }
    const leadLen = leadInLen(path), strokeBudget = budget / perPx - leadLen;
    if (strokeBudget <= 0) {
      hooks3.floatText?.(s0.x, s0.y - 14, "落筆太遠", "#c08a2e");
      hooks3.burst?.(s0.x, s0.y, "#8a7a5a", 5);
      hooks3.playNoMana?.();
      return;
    }
    const cut = truncatePath(path, strokeBudget);
    if (!cut) {
      hooks3.floatText?.(s0.x, s0.y - 14, "劍意不足", "#c08a2e");
      hooks3.burst?.(s0.x, s0.y, "#8a7a5a", 5);
      hooks3.playNoMana?.();
      return;
    }
    const len = pathLen(cut), paidLen = leadLen + len;
    G.strokeN++;
    G.strokeAvg = G.strokeAvg ? G.strokeAvg * 0.75 + paidLen * 0.25 : paidLen;
    const TFc = stat.tierFlags || {};
    if (TFc.strokeLingers) {
      G.lingers.push({ pts: cut.slice(), t: 36, dmg: stat.damage * 0.5, hit: /* @__PURE__ */ new Set() });
      if (G.lingers.length > 6) G.lingers.shift();
    }
    const fullFree = TFc.freeCastAtFull && G.mana >= stat.manaMax - 0.01;
    if (fullFree) {
      hooks3.floatText?.(s0.x, s0.y - 14, "定息", "#4aa0b8");
    } else if (freeCast) {
      G.reserve--;
      G.reserveFlash = 1;
      hooks3.floatText?.(s0.x, s0.y - 14, "劍匣", "#c08a2e");
    } else {
      const gross = Math.min(G.mana, stat.costBase + paidLen * perPx);
      const spend = netManaSpend(gross, stat.manaRefund);
      G.mana = Math.max(0, G.mana - spend);
      hooks3.dpsAdd?.("m", spend);
    }
    hooks3.playCast?.(len);
    G.castT = 24;
    G.intent = 1;
    {
      const P = G.player, p1 = cut[Math.min(3, cut.length - 1)];
      G.aim = Math.atan2(p1.y - P.y, p1.x - P.x);
    }
    const n = Math.max(1, stat.count | 0);
    const c = {
      id: ++cmdSeq,
      pts: cut,
      len,
      ox: cut[0].x,
      oy: cut[0].y,
      // 出鞘點:散鋒的旋轉中心
      life: cmdLife(len),
      // 這道劍令買到的「命」(每把劍能斬幾隻)
      seg: 1,
      step: 1,
      // step 1=順走,-1=倒走(歸鋒)
      x: cut[0].x,
      y: cut[0].y,
      ang: Math.atan2(cut[1].y - cut[0].y, cut[1].x - cut[0].x),
      formation: stat.formation,
      seed: Math.random() * 8,
      // 聚形共用:讓 N 把劍的動畫幀完全一致
      // 齊鋒式·小成「飛劍間距收窄,自動集火」
      spacing: (stat.size * 2.2 + 10) * ((stat.tierFlags || {}).volleyTighten ? 0.6 : 1),
      swords: new Array(n).fill(null),
      slots: n,
      // 連珠逐把從同一落點接出：指令走完一個劍距時，才生成下一把。
      inlineSpawnEvery: stat.formation === "inline" ? Math.max(2, Math.ceil(inlineGap() / Math.max(1, stat.flySpeed || stat.speed || 14))) : 0,
      // 折返只有「畫面上讀成一把劍」的劍式能用:單式與聚形。
      // 齊鋒/散鋒/連珠折返時整列會前後對調,那一幀讀起來是瞬移不是掉頭 —— 演出不成立。
      returnsLeft: canReturn(stat.formation) && stat.ret ? Math.max(1, stat.returnHits || 1) : 0,
      alive: true,
      age: 0,
      hitOrder: [],
      volley: 0,
      frameHit: null,
      extended: 0,
      dmgMul: 1,
      anyHit: false,
      free: false,
      freeBack: false,
      passAt: buildStrokePasses(cut)
    };
    if (c.formation === "inline") seedInlineTrail(c);
    G.commands.push(c);
    if (c.formation === "inline") spawnCmdSword(c, 0, 0);
    else for (let i = 0; i < n; i++) spawnCmdSword(c, i, 0);
  }
  function canReturn(f) {
    return f === "single" || f === "merge";
  }
  function launchSword(path) {
    return launchCommand(path);
  }
  function updateCombat() {
    for (let ci = G.commands.length - 1; ci >= 0; ci--) {
      const c = G.commands[ci];
      c.age++;
      const TF = stat.tierFlags || {};
      c.frameHit = null;
      c.mergeIntentFrame = null;
      const mLive = c.formation === "merge" ? Math.max(1, c.swords.reduce((a, s) => a + (s && !s.dead ? 1 : 0), 0)) : 1;
      c.mLive = mLive;
      const goingBack = c.free ? c.freeBack : c.step < 0;
      let budget = (stat.flySpeed || stat.speed) * (goingBack && TF.returnFaster ? 1.3 : 1) * (c.speedMul || 1) * (stat.beadSlow && c.formation === "inline" ? 0.92 : 1) * (c.formation === "merge" ? 1 / (1 + MERGE_SPEED_K * (mLive - 1)) : 1);
      if (c.free) {
        if (stat.homing > 0 && !c.auto && c.formation === "parallel") {
          const tg = nearestEnemy(c.x, c.y, HOMING_RANGE);
          if (tg) {
            let dd = Math.atan2(tg.y - c.y, tg.x - c.x) - c.ang;
            while (dd > Math.PI) dd -= 6.283185;
            while (dd < -Math.PI) dd += 6.283185;
            const turn = Math.max(-stat.homing, Math.min(stat.homing, dd));
            if (Math.abs(turn) > 1e-4) {
              c.ang += turn;
              c.homed = true;
            }
          }
        }
        c.x += Math.cos(c.ang) * budget;
        c.y += Math.sin(c.ang) * budget;
        const EDGE = 16;
        const atEdge = c.x < EDGE || c.x > W - EDGE || c.y < EDGE || c.y > H - EDGE;
        if (atEdge && c.returnsLeft > 0) {
          c.x = Math.max(EDGE, Math.min(W - EDGE, c.x));
          c.y = Math.max(EDGE, Math.min(H - EDGE, c.y));
          doReturn(c);
        } else {
          const OUT = 60;
          if (c.x < -OUT || c.x > W + OUT || c.y < -OUT || c.y > H + OUT) {
            cmdFinish(c);
            c.alive = false;
          }
        }
        budget = 0;
      }
      while (budget > 0 && c.alive) {
        const tgt = c.pts[c.seg];
        if (!tgt) {
          cmdReachedEnd(c);
          break;
        }
        const dx = tgt.x - c.x, dy = tgt.y - c.y, d = Math.hypot(dx, dy) || 1e-4;
        if (d <= budget) {
          c.x = tgt.x;
          c.y = tgt.y;
          c.ang = Math.atan2(dy, dx);
          budget -= d;
          c.seg += c.step;
          if (c.seg >= c.pts.length || c.seg < 0) {
            cmdReachedEnd(c);
            break;
          }
        } else {
          c.x += dx / d * budget;
          c.y += dy / d * budget;
          c.ang = Math.atan2(dy, dx);
          budget = 0;
        }
      }
      if (!c.alive) {
        for (const sw of c.swords) if (sw && !sw.solo) sw.dead = true;
        G.commands.splice(ci, 1);
        continue;
      }
      appendInlineTrail(c);
      const ca = Math.cos(c.ang), sa = Math.sin(c.ang);
      for (let k = 0; k < c.slots; k++) {
        let sw = c.swords[k];
        if (sw && (sw.dead || sw.solo)) continue;
        if (!sw) {
          if (c.formation === "inline" && k > 0 && c.age < k * c.inlineSpawnEvery) continue;
          sw = spawnCmdSword(c, k, 0);
        }
        if (sw.delay > 0) {
          sw.delay--;
          sw.trail.length = 0;
          continue;
        }
        const off = formationOffset(c.formation, k, c.slots, c.spacing, c.age * (stat.flySpeed || stat.speed || 14));
        if (off.fan && c.ox != null) {
          const q = fanPose(c, off.ang);
          if (sw.snap) {
            sw.px = q.x;
            sw.py = q.y;
            sw.snap = false;
          } else {
            sw.px = sw.x;
            sw.py = sw.y;
          }
          sw.vx = q.x - sw.x;
          sw.vy = q.y - sw.y;
          sw.x = q.x;
          sw.y = q.y;
          sw.ang = q.ang;
          sw.age++;
          sw.trail.push({ x: sw.x, y: sw.y, ang: sw.ang, age: sw.age });
          if (sw.trail.length > 18) sw.trail.shift();
          continue;
        }
        let oa = off.along, os = off.side;
        const follow = c.formation === "inline" ? sampleTrailPoint(c.inlineTrail, inlineTipLead() + k * inlineGap()) : null;
        const nx = follow ? follow.x : c.x + ca * oa - sa * os;
        const ny = follow ? follow.y : c.y + sa * oa + ca * os;
        if (sw.snap) {
          sw.px = nx;
          sw.py = ny;
          sw.snap = false;
        } else {
          sw.px = sw.x;
          sw.py = sw.y;
        }
        sw.vx = nx - sw.x;
        sw.vy = ny - sw.y;
        sw.x = nx;
        sw.y = ny;
        sw.ang = follow ? turnToward(sw.ang, follow.ang) : c.ang + (off.ang || 0);
        sw.age++;
        if (!c.free && c.passAt) sw.passId = c.passAt[Math.max(0, Math.min(c.passAt.length - 1, c.seg))] || 0;
        if (hooks3.getFX?.()?.trail) {
          sw.trail.push({ x: sw.x, y: sw.y, ang: sw.ang, age: sw.age });
          if (sw.trail.length > 18) sw.trail.shift();
        } else if (sw.trail.length) sw.trail.length = 0;
      }
      if (c.formation === "merge") {
        let lead = -1;
        for (let k = 0; k < c.swords.length; k++) {
          const sw = c.swords[k];
          if (sw && !sw.dead) {
            lead = k;
            break;
          }
        }
        const wScale = 1 + MERGE_WIDTH_K * (c.mLive - 1);
        for (let k = 0; k < c.swords.length; k++) {
          const sw = c.swords[k];
          if (!sw) continue;
          sw.mergeHidden = k !== lead;
          sw.mergeScale = k === lead ? wScale : 1;
        }
      }
    }
    function doReturn(c) {
      if (c.returnsLeft <= 0) return false;
      const TF = stat.tierFlags || {};
      c.returnsLeft--;
      c.ang += Math.PI;
      c.freeBack = !c.freeBack;
      c.returnsDone = (c.returnsDone || 0) + 1;
      if (TF.returnHaste) c.speedMul = Math.min(2.6, (c.speedMul || 1) * 1.35);
      if (TF.returnSeek && !c.auto) {
        const en = nearestEnemy(c.x, c.y, 1e9);
        if (en) c.ang = Math.atan2(en.y - c.y, en.x - c.x);
      }
      for (const sw of c.swords) if (sw && !sw.dead) {
        sw.hitSet.clear();
        sw.hitPass.clear();
        sw.shotPass.clear();
        sw.passId++;
        sw.runDir = null;
        sw.runTravel = 0;
        sw.returned = true;
        sw.snap = true;
        if (TF.returnKeep) sw.pierceLeft = Math.min(c.life || 1, sw.pierceLeft + (c.life || 1) * 0.3);
      }
      if (stat.returnDry) hooks3.whiteCut?.(c.x, c.y, c.ang);
      return true;
    }
    function cmdFinish(c) {
      const TF = stat.tierFlags || {};
      if (!c.auto && TF.pierceRecoil && c.hitOrder.length) {
        const first = c.hitOrder.find((en) => G.enemies.includes(en));
        if (first) spawnAutoCommand(c.x, c.y, first.x, first.y, { dmgMul: 0.8, intent: true });
      }
    }
    function cmdReachedEnd(c) {
      const TF = stat.tierFlags || {};
      if (!c.auto && c.step > 0 && c.extended < 6 && c.formation === "parallel") {
        const R = TF.guideExtend ? 260 : 150;
        const seek = TF.guideNeverMiss && !c.anyHit;
        if (TF.guideExtend || seek) {
          const en = nearestEnemy(c.x, c.y, seek ? 1e9 : R);
          if (en && extendCommand(c, en.x, en.y)) {
            c.extended++;
            return;
          }
        }
      }
      c.free = true;
      c.ang = Math.atan2(c.y - (c.py != null ? c.py : c.y), c.x - (c.px != null ? c.px : c.x)) || c.ang;
      {
        const a = c.pts[Math.max(0, c.pts.length - 2)], b = c.pts[c.pts.length - 1];
        if (a && b && a !== b) c.ang = c.step > 0 ? Math.atan2(b.y - a.y, b.x - a.x) : Math.atan2(c.pts[0].y - c.pts[1].y, c.pts[0].x - c.pts[1].x);
      }
    }
    for (let i = G.swords.length - 1; i >= 0; i--) {
      const s = G.swords[i];
      if (s.dead) {
        G.swords.splice(i, 1);
        continue;
      }
      if (s.delay > 0) continue;
      if (s.anchorAfter && !s.solo) {
        const en = s.anchorAfter, dx = s.x - en.x, dy = s.y - en.y;
        const forward = dx * Math.cos(s.ang) + dy * Math.sin(s.ang);
        if (forward > en.r + Math.max(24, stat.size * 2.2)) {
          spawnAnchor(s);
          s.dead = true;
          G.swords.splice(i, 1);
          continue;
        }
      }
      if (s.solo) {
        const sp = stat.flySpeed || stat.speed || 14;
        const tg = nearestEnemy(s.x, s.y, 1e9);
        if (tg) {
          let d = Math.atan2(tg.y - s.y, tg.x - s.x) - s.ang;
          while (d > Math.PI) d -= 6.283185;
          while (d < -Math.PI) d += 6.283185;
          const lim = SOLO_TURN + (stat.homing || 0);
          s.ang += Math.max(-lim, Math.min(lim, d));
        }
        s.px = s.x;
        s.py = s.y;
        s.vx = Math.cos(s.ang) * sp;
        s.vy = Math.sin(s.ang) * sp;
        s.x += s.vx;
        s.y += s.vy;
        s.age++;
        if (hooks3.getFX?.()?.trail) {
          s.trail.push({ x: s.x, y: s.y, ang: s.ang, age: s.age });
          if (s.trail.length > 18) s.trail.shift();
        } else if (s.trail.length) s.trail.length = 0;
        if (s.x < -60 || s.x > W + 60 || s.y < -60 || s.y > H + 60) {
          s.dead = true;
          G.swords.splice(i, 1);
          continue;
        }
      }
      if (!s.hitPass) s.hitPass = /* @__PURE__ */ new Map();
      if (!s.shotPass) s.shotPass = /* @__PURE__ */ new Map();
      for (let qj = G.bossShots.length - 1; qj >= 0; qj--) {
        const q = G.bossShots[qj], pass = s.passId || 0;
        if (s.shotPass.get(q) === pass) continue;
        if (segCircleDist(s.px, s.py, s.x, s.y, q.x, q.y) < q.r + stat.size + (stat.hitPadding || 0)) {
          s.shotPass.set(q, pass);
          q.hp--;
          hooks3.splash?.(q.x, q.y, "#3c3630", 1.15);
          hooks3.playHit?.();
          hooks3.shake?.(1.8);
          hooks3.floatText?.(q.x, q.y - 22, "破墨", "#efe4cc");
          if (q.hp <= 0) {
            inkCoreDissolve(q, s.ang);
            G.bossShots.splice(qj, 1);
          }
        }
      }
      for (let j = G.enemies.length - 1; j >= 0; j--) {
        const en = G.enemies[j];
        if (en.showcaseGhost) continue;
        if (en.isBoss && en.bossState !== "orbit" && en.bossState !== "lunge") continue;
        if (s.hitPass.get(en) === (s.passId || 0)) continue;
        if (segCircleDist(s.px, s.py, s.x, s.y, en.x, en.y) < en.r + stat.size + (stat.hitPadding || 0)) {
          const TF = stat.tierFlags || {}, C = s.cmd;
          if (s.pierceLeft <= 0) continue;
          let dmg = stat.damage;
          let isCrit = Math.random() < stat.crit;
          if (stat.firstStrike && !G.firstStrikeDone) {
            isCrit = true;
            G.firstStrikeDone = true;
          }
          if (!stat.homingCanCrit && C && C.homed) isCrit = false;
          if (G.edgeReady) {
            isCrit = true;
            G.edgeReady = false;
            hooks3.whiteCut?.(en.x, en.y, s.ang);
          }
          if (TF.focusStrike && G.focusReady) {
            G.focusReady = false;
            G.focus = 0;
            dmg *= 2.2;
            hooks3.splash?.(en.x, en.y, "#c08a2e", 2.4);
            hooks3.floatText?.(en.x, en.y - en.r - 40, "凝神一劍", "#c08a2e");
          }
          if (isCrit) dmg *= stat.critMul || 2;
          if (s.returned) dmg *= stat.returnDmgMul || 1;
          if (s.echo) dmg *= 0.5;
          if (C && C.dmgMul) dmg *= C.dmgMul;
          if (en.broken > 0) dmg *= 1.35;
          if (TF.mergeHeavy && C && C.formation === "merge" && C.returnsDone)
            dmg *= 1 + 0.3 * C.returnsDone;
          const dmgForDur = dmg;
          dmg *= speedMul(C);
          if (TF.pierceRamp) {
            dmg *= 1 + 0.05 * s.hitSet.size;
          }
          if (TF.anchorLink && C && C.formation === "inline" && G.anchorLinks.length) {
            for (const Lk of G.anchorLinks) {
              if (segCircleDist(Lk.ax, Lk.ay, Lk.bx, Lk.by, s.x, s.y) < stat.size + 6) {
                dmg *= 1.22;
                hooks3.splash?.(s.x, s.y, "#5a5148", 1.1);
                break;
              }
            }
          }
          let volley = false;
          if (TF.volleyStrike && C && !C.auto && C.slots > 1) {
            if (!C.frameHit) C.frameHit = /* @__PURE__ */ new Map();
            const nHit = (C.frameHit.get(en) || 0) + 1;
            C.frameHit.set(en, nHit);
            if (nHit >= 2) {
              volley = true;
              dmg *= 1.6;
            }
          }
          hooks3.dmgTo?.(en, dmg);
          en.hit = 6;
          s.hitSet.add(en);
          s.hitPass.set(en, s.passId || 0);
          if (G.bossTest && en.isBoss) en.testHits = (en.testHits || 0) + 1;
          if (C) {
            C.anyHit = true;
            if (!C.hitOrder.includes(en)) C.hitOrder.push(en);
          }
          if (TF.fullPierce && C && C.slots > 1 && C.formation === "inline") {
            if (!C.mgHit) C.mgHit = /* @__PURE__ */ new Map();
            let mset = C.mgHit.get(en);
            if (!mset) {
              mset = /* @__PURE__ */ new Set();
              C.mgHit.set(en, mset);
            }
            mset.add(s.slot);
            if (mset.size >= C.slots) {
              mset.clear();
              const bonus = 0.5 * dmgForDur * C.slots;
              hooks3.dmgTo?.(en, bonus);
              en.hit = 6;
              hooks3.splash?.(en.x, en.y, "#c08a2e", 2);
              hooks3.floatText?.(en.x, en.y - en.r - 30, "滿貫", "#c08a2e");
              hooks3.floatText?.(en.x, en.y - en.r - 12, "-" + Math.round(bonus), "#f1d18a");
            }
          }
          if (!(C && C.noIntent) || TF.scatterEchoIntent) {
            if (C && C.formation === "merge") {
              if (!C.mergeIntentFrame) C.mergeIntentFrame = /* @__PURE__ */ new Set();
              if (!C.mergeIntentFrame.has(en)) {
                C.mergeIntentFrame.add(en);
                hooks3.applyIntent?.(en);
              }
            } else hooks3.applyIntent?.(en);
          }
          if (TF.pierceBreak && C && !C.auto) en.broken = 90;
          if (volley && C) {
            C.volley = (C.volley || 0) + 1;
            if (TF.volleyHeavy && C.volley % 4 === 0) {
              hooks3.splash?.(en.x, en.y, "#2b2620", 3.2);
              hooks3.shake?.(8);
              hooks3.hitstop?.(4);
              hooks3.playBoom?.();
              for (const e2 of G.enemies) if (Math.hypot(e2.x - en.x, e2.y - en.y) < 110) {
                hooks3.dmgTo?.(e2, stat.damage * 1.2);
                e2.hit = 6;
              }
              hooks3.floatText?.(en.x, en.y - en.r - 26, "重斬", "#8a2b2b");
            } else hooks3.floatText?.(en.x, en.y - en.r - 26, "齊斬", "#5a4e3c");
          }
          if (TF.scatterEcho && C && !C.auto && !s.echo) {
            const L = 60 + stat.size * 1.6;
            const dirs = TF.scatterQuad ? [-1, 1, -2.2, 2.2] : [-1, 1];
            for (const sgn of dirs) {
              const ea = s.ang + sgn * (0.7 + Math.random() * 0.35);
              spawnAutoCommand(
                s.x,
                s.y,
                s.x + Math.cos(ea) * L,
                s.y + Math.sin(ea) * L,
                {
                  dmgMul: 0.2,
                  skip: en,
                  intent: !!TF.scatterEchoIntent,
                  returns: 0
                }
              );
            }
          }
          if (TF.guideRetarget && C && !C.auto && C.formation === "parallel" && en.hp <= 0 && C.extended < 6) {
            const nx = nearestEnemy(en.x, en.y, 300);
            if (nx && nx !== en && extendCommand(C, nx.x, nx.y)) C.extended++;
          }
          if (stat.ember > 0) {
            en.ember = Math.max(en.ember, stat.ember);
          }
          if (stat.ice > 0) {
            en.chill = 100;
          }
          if (TF.focusStacks) {
            G.focusIdle = 0;
            if (!G.focusReady && ++G.focus >= 8) {
              G.focus = 8;
              G.focusReady = true;
              hooks3.floatText?.(G.player.x, G.player.y - 52, "凝神", "#c08a2e");
            }
          }
          if (TF.inkDropOnSplash && stat.explode > 0 && Math.random() < 0.5) {
            const a = Math.random() * 6.283, r = 18 + Math.random() * 24;
            G.drops.push({
              x: en.x + Math.cos(a) * r,
              y: en.y + Math.sin(a) * r,
              r: 14,
              t: 300,
              dmg: stat.damage * 0.35,
              boom: !!TF.inkDropExplode
            });
            if (G.drops.length > 24) G.drops.shift();
          }
          if (TF.afterimageHits && s.trail && s.trail.length > 4) {
            const g = s.trail[Math.max(0, s.trail.length - 5)];
            if (TF.afterimageSolid) {
              for (const e2 of G.enemies)
                if (e2 !== en && Math.hypot(e2.x - g.x, e2.y - g.y) < e2.r + stat.size) {
                  hooks3.dmgTo?.(e2, dmg * 0.25);
                  hooks3.pendDamage?.(e2, dmg * 0.25, false);
                  e2.hit = 6;
                  break;
                }
            } else {
              hooks3.dmgTo?.(en, dmg * 0.25);
              hooks3.pendDamage?.(en, dmg * 0.25, false);
            }
          }
          hooks3.pendDamage?.(en, dmg, isCrit);
          hooks3.splash?.(s.x, s.y, hooks3.getElementHitColor?.(stat.element), 1);
          if (isCrit) {
            hooks3.playCrit?.();
            hooks3.shake?.(4);
            hooks3.hitstop?.(3);
            hooks3.flash?.(0.12, "240,220,160");
            if (stat.whiteCut) {
              hooks3.whiteCut?.(s.x, s.y, s.ang);
              if (TF.whiteCutTwin) hooks3.whiteCut?.(s.x + (Math.random() - 0.5) * 18, s.y + (Math.random() - 0.5) * 18, s.ang + 1.1);
            }
            if (stat.criticalEcho && !s.echo) {
              const ea = s.ang + (Math.random() - 0.5) * 0.9, L = 70 + stat.size * 2;
              spawnAutoCommand(
                s.x,
                s.y,
                s.x + Math.cos(ea) * L,
                s.y + Math.sin(ea) * L,
                { dmgMul: 0.5, skip: en, intent: true }
              );
            }
          } else {
            hooks3.playHit?.();
            hooks3.shake?.(1.1);
          }
          if (stat.explode > 0) {
            hooks3.splash?.(s.x, s.y, "#c0662e", 2.2);
            hooks3.playBoom?.();
            hooks3.shake?.(7);
            for (const e2 of G.enemies) {
              if (e2 !== en && Math.hypot(e2.x - s.x, e2.y - s.y) < stat.explode) {
                hooks3.dmgTo?.(e2, stat.damage * 0.6);
                e2.hit = 6;
              }
            }
            for (let k = 0; k < 8; k++) hooks3.ink?.(s.x, s.y, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 10 + Math.random() * 14);
          }
          if (en.hp <= 0) {
            killEnemy(j);
          }
          s.pierceLeft -= durCost(dmgForDur);
          if (C && C.formation === "inline" && stat.beadSlow && s.pierceLeft > 0 && !s.anchorAfter) s.anchorAfter = en;
          if (s.pierceLeft <= 0) {
            s.dead = true;
            swordDissolve(s);
            break;
          }
        }
      }
      if (s.dead) {
        G.swords.splice(i, 1);
      }
    }
    {
      const TFa2 = stat.tierFlags || {};
      let anchorHitSound = false;
      for (let ai = G.anchors.length - 1; ai >= 0; ai--) {
        const A = G.anchors[ai];
        A.t--;
        if (A.t <= 0) {
          if (TFa2.anchorDetonate) detonateAnchor(A);
          G.anchors.splice(ai, 1);
          continue;
        }
        if (TFa2.anchorDetonate) {
          let boom = false;
          for (const c of G.commands) {
            if (c.free || c.auto) continue;
            if ((c.x - A.x) ** 2 + (c.y - A.y) ** 2 < (A.r * 0.7) ** 2) {
              boom = true;
              break;
            }
          }
          if (boom) {
            detonateAnchor(A);
            G.anchors.splice(ai, 1);
            continue;
          }
        }
        if (G.t % 18 === 0) {
          A.hitSet.clear();
          const sr = A.sr || 26;
          for (const en of G.enemies) {
            if (en.isBoss && en.bossState !== "orbit" && en.bossState !== "lunge") continue;
            if (A.hitSet.has(en)) continue;
            if ((en.x - A.x) ** 2 + (en.y - A.y) ** 2 < (sr + en.r) ** 2) {
              hooks3.dmgTo?.(en, A.dmg * 0.5);
              en.hit = 6;
              A.hitSet.add(en);
              anchorHitSound = true;
              hooks3.splash?.(en.x, en.y, "#3a332a", 0.8);
            }
          }
        }
        if (TFa2.anchorField) for (const sw of G.swords) {
          if (sw.dead || !sw.cmd || sw.cmd.formation !== "inline") continue;
          if (!sw.anchorFed) sw.anchorFed = /* @__PURE__ */ new Set();
          if (sw.anchorFed.has(A)) continue;
          if ((sw.x - A.x) ** 2 + (sw.y - A.y) ** 2 < (A.r + stat.size) ** 2) {
            sw.anchorFed.add(A);
            sw.pierceLeft = Math.min(sw.cmd.life || 1, sw.pierceLeft + 1);
          }
        }
      }
      if (anchorHitSound) hooks3.playHit?.();
      if (TFa2.anchorLink && G.anchors.length > 1) {
        G.anchorLinks.length = 0;
        const LINK = 170, MAXL = 24;
        for (let a = 0; a < G.anchors.length && G.anchorLinks.length < MAXL; a++) {
          for (let b = a + 1; b < G.anchors.length && G.anchorLinks.length < MAXL; b++) {
            const A = G.anchors[a], B = G.anchors[b];
            if ((A.x - B.x) ** 2 + (A.y - B.y) ** 2 < LINK * LINK)
              G.anchorLinks.push({ ax: A.x, ay: A.y, bx: B.x, by: B.y });
          }
        }
        if (G.t % 18 === 9) {
          const cut = stat.damage * 0.4 * (1 + (stat.anchorDmgMul || 0));
          for (const Lk of G.anchorLinks) {
            for (const en of G.enemies) {
              if (en.isBoss && en.bossState !== "orbit" && en.bossState !== "lunge") continue;
              if (segCircleDist(Lk.ax, Lk.ay, Lk.bx, Lk.by, en.x, en.y) < en.r + 6) {
                hooks3.dmgTo?.(en, cut);
                en.hit = 6;
              }
            }
          }
        }
      } else if (G.anchorLinks.length) {
        G.anchorLinks.length = 0;
      }
    }
  }

  // src/animation/direction.js
  var DIRECTIONS = Object.freeze(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);
  var MIRRORS = Object.freeze({
    NW: { source: "NE", flipX: true },
    W: { source: "E", flipX: true },
    SW: { source: "SE", flipX: true }
  });
  function resolveDirection(x, y, last = "S", deadZone = 0.045) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.hypot(x, y) < deadZone) return DIRECTIONS.includes(last) ? last : "S";
    const angle = Math.atan2(x, -y);
    const index = (Math.round(angle / (Math.PI / 4)) + 8) % 8;
    return DIRECTIONS[index];
  }
  var VECTOR = Object.freeze({
    N: [0, -1],
    NE: [1, -1],
    E: [1, 0],
    SE: [1, 1],
    S: [0, 1],
    SW: [-1, 1],
    W: [-1, 0],
    NW: [-1, -1]
  });
  var HORIZONTAL_MIRROR = Object.freeze({ N: "N", NE: "NW", E: "W", SE: "SW", S: "S", SW: "SE", W: "E", NW: "NE" });
  function resolveAvailableDirection(direction, authoredDirections, options = {}) {
    const wanted = DIRECTIONS.includes(direction) ? direction : "S";
    const authored = [...new Set((authoredDirections || []).filter((d) => DIRECTIONS.includes(d)))];
    if (!authored.length) return null;
    const allowFlip = options.allowFlipX !== false, candidates = [];
    for (const source of authored) {
      candidates.push({ direction: source, source, flipX: false });
      const mirrored = HORIZONTAL_MIRROR[source];
      if (allowFlip && mirrored !== source) candidates.push({ direction: mirrored, source, flipX: true });
    }
    const [wx, wy] = VECTOR[wanted];
    candidates.sort((a, b) => {
      const [ax, ay] = VECTOR[a.direction], [bx, by] = VECTOR[b.direction];
      const da = (wx * ax + wy * ay) / (Math.hypot(wx, wy) * Math.hypot(ax, ay));
      const db = (wx * bx + wy * by) / (Math.hypot(wx, wy) * Math.hypot(bx, by));
      const verticalAffinity = ([x, y]) => wx !== 0 && wy !== 0 && x === 0 && Math.sign(y) === Math.sign(wy) ? 1 : 0;
      return db - da || verticalAffinity([bx, by]) - verticalAffinity([ax, ay]) || Number(a.flipX) - Number(b.flipX) || DIRECTIONS.indexOf(a.direction) - DIRECTIONS.indexOf(b.direction);
    });
    const best = candidates[0];
    return { direction: best.source, flipX: best.flipX, resolvedDirection: best.direction };
  }

  // src/animation/animation-controller.js
  var AnimationController = class {
    constructor(manifest, seed = 0) {
      this.manifest = manifest;
      this.action = "walk";
      this.direction = "S";
      this.lastDirection = "S";
      this.elapsed = Math.max(0, Number(seed) || 0);
      this.frameIndex = 0;
    }
    setMotion(x, y) {
      this.direction = resolveDirection(x, y, this.lastDirection);
      this.lastDirection = this.direction;
    }
    play(action, { restart = false } = {}) {
      if (!this.manifest.animations[action]) action = this.manifest.fallbacks?.[action] || "walk";
      if (action !== this.action || restart) {
        this.action = action;
        this.elapsed = 0;
        this.frameIndex = 0;
      }
    }
    update(deltaFrames = 1) {
      const clip = this.manifest.animations[this.action] || this.manifest.animations.walk;
      const count = Math.max(1, clip?.frameCount || 1), fps = Math.max(0.01, clip?.fps || 6);
      this.elapsed += Math.max(0, deltaFrames) / 60;
      let index = Math.floor(this.elapsed * fps);
      if (clip?.loop !== false) index %= count;
      else index = Math.min(count - 1, index);
      this.frameIndex = index;
      return index;
    }
  };

  // src/render/layered-character-renderer.js
  var LAYERS = ["weaponBack", "body", "weaponFront"];
  var controllers = /* @__PURE__ */ new WeakMap();
  function controllerFor(entity, manifest, Controller) {
    let controller = controllers.get(entity);
    if (!controller) {
      controller = new Controller(manifest, entity.anim || 0);
      controllers.set(entity, controller);
    }
    return controller;
  }
  function drawLayeredCharacter(ctx2, registry, actorId, controller, entity, deltaFrames = 1) {
    const actor = registry.getActor(actorId);
    if (!actor || !controller) return false;
    const clip = actor.manifest.animations[controller.action] || actor.manifest.animations.walk;
    const index = controller.update(deltaFrames);
    const canvas = actor.manifest.canvas, height = entity.visualHeight || entity.r * 2.1;
    const width = height * (canvas.width / canvas.height), pivot = canvas.footPivot;
    let drew = false, resolved = null;
    ctx2.save();
    ctx2.translate(entity.x, entity.y);
    for (const layer of LAYERS) {
      const frame = registry.getFrame(actorId, controller.action, controller.direction, layer, index);
      if (!frame) continue;
      resolved = resolved || registry.resolveFrameDirection(actorId, controller.direction);
      ctx2.save();
      if (frame.flipX) ctx2.scale(-1, 1);
      ctx2.globalAlpha = (entity.hit > 0 ? 0.9 : 1) * (entity.alpha == null ? 1 : entity.alpha);
      ctx2.drawImage(frame.image, -width * pivot.x, -height * pivot.y, width, height);
      ctx2.restore();
      drew = true;
    }
    ctx2.restore();
    ctx2.globalAlpha = 1;
    return drew ? { actorId, source: actor.manifest.assetSource || "legacy", renderer: "manifest", logicalDirection: controller.direction, resolvedAssetDirection: resolved?.direction || null, flipX: !!resolved?.flipX, action: controller.action, frameIndex: index } : false;
  }

  // src/render.js
  var hooks4 = {};
  var paperDone = false;
  function configureRender(nextHooks) {
    hooks4 = nextHooks || {};
  }
  function invalidatePaper() {
    paperDone = false;
  }
  function drawSplash(target, sp) {
    const t = sp.age / sp.dur;
    const grow = t < 0.15 ? t / 0.15 : 1;
    const a = t < 0.6 ? 1 : Math.max(0, 1 - (t - 0.6) / 0.4);
    const R = sp.r * (0.6 + grow * 0.4);
    target.save();
    target.translate(sp.x, sp.y);
    target.rotate(sp.rot);
    target.globalAlpha = a * 0.85;
    target.fillStyle = sp.c;
    const nC = sp.corners.length;
    target.beginPath();
    for (let i = 0; i < nC; i++) {
      const th = i / nC * 6.283, r = R * 0.5 * sp.corners[i];
      const px = Math.cos(th) * r, py = Math.sin(th) * r;
      i === 0 ? target.moveTo(px, py) : target.lineTo(px, py);
    }
    target.closePath();
    target.fill();
    for (const s of sp.spikes) {
      const len = R * s.len, midR = s.broken ? len * 0.6 : len;
      target.beginPath();
      target.moveTo(Math.cos(s.ang - s.w) * R * 0.4, Math.sin(s.ang - s.w) * R * 0.4);
      target.lineTo(Math.cos(s.ang) * midR, Math.sin(s.ang) * midR);
      target.lineTo(Math.cos(s.ang + s.w) * R * 0.4, Math.sin(s.ang + s.w) * R * 0.4);
      target.closePath();
      target.fill();
    }
    target.restore();
    target.globalAlpha = 1;
  }
  function drawMistDissolve(target, m) {
    const t = m.age / m.dur, ease = 1 - Math.pow(1 - t, 2), r = m.r * (0.72 + ease * 0.78), a = Math.pow(1 - t, 1.7);
    target.save();
    target.translate(m.x + m.vx * m.age, m.y + m.vy * m.age);
    target.rotate(m.rot || 0);
    target.scale(1, m.squash);
    const fog = target.createRadialGradient(-r * 0.16, -r * 0.12, r * 0.05, 0, 0, r);
    fog.addColorStop(0, "rgba(" + m.color + "," + a * 0.3 + ")");
    fog.addColorStop(0.42, "rgba(" + m.color + "," + a * 0.16 + ")");
    fog.addColorStop(1, "rgba(" + m.color + ",0)");
    target.fillStyle = fog;
    target.beginPath();
    target.arc(0, 0, r, 0, 6.283);
    target.fill();
    if (m.rot != null) {
      target.strokeStyle = "rgba(" + m.color + "," + a * 0.22 + ")";
      target.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        const yy = (k - 1) * r * 0.24, reach = r * (0.65 + k * 0.17);
        target.lineWidth = Math.max(0.7, r * (0.055 - k * 0.012));
        target.beginPath();
        target.moveTo(-reach * 0.6, yy);
        target.bezierCurveTo(-reach * 0.15, yy - r * 0.12, reach * 0.35, yy + r * 0.14, reach, yy - r * 0.08);
        target.stroke();
      }
    }
    target.restore();
  }
  function swordFxTrail(target, tr, size, rgb) {
    const n = tr.length;
    if (n < 2) return;
    const trailFx = hooks4.getTrailFx?.(), pale = rgb === "196,186,168";
    if (trailFx?.ok) {
      const col = pale ? "rgba(238,232,217,1)" : "rgba(" + rgb + ",1)";
      const im = hooks4.tintFrame?.(trailFx.image, col);
      for (const t of [0.42, 0.68]) {
        const i = Math.max(1, Math.min(n - 1, Math.round((n - 1) * t))), p = tr[i], q = tr[i - 1];
        const w = Math.max(8, size * (pale ? 2.8 : 3.3)), h = w / trailFx.aspect;
        target.save();
        target.translate(p.x, p.y);
        target.rotate(Math.atan2(p.y - q.y, p.x - q.x));
        target.globalAlpha *= pale ? 0.16 : 0.12;
        target.drawImage(im, -w, -h * 0.5, w, h);
        target.restore();
      }
    }
    target.save();
    target.lineCap = "round";
    for (let i = 1; i < n; i++) {
      if (i % 4 === 1 && i < n - 1) continue;
      const p = tr[i], q = tr[i - 1], t = i / (n - 1), nx = -(p.y - q.y), ny = p.x - q.x, d = Math.hypot(nx, ny) || 1;
      const j = Math.sin(i * 17.17) * size * 0.08;
      target.strokeStyle = "rgba(" + rgb + "," + ((pale ? 0.11 : 0.16) + t * (pale ? 0.16 : 0.22)) + ")";
      target.lineWidth = Math.max(0.55, size * (0.1 + t * 0.22));
      target.beginPath();
      target.moveTo(q.x + nx / d * j, q.y + ny / d * j);
      target.lineTo(p.x + nx / d * j, p.y + ny / d * j);
      target.stroke();
    }
    target.restore();
  }
  function enemyVariantFrame(en, img) {
    const tone = hooks4.getEnemyTone?.(en.species);
    return tone ? hooks4.tintFrame?.(img, tone) : img;
  }
  function drawBossShots() {
    const fx = hooks4.getBossFx?.();
    for (const q of G.bossShots) {
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(G.t * 0.025 + q.seed);
      if (q.web) {
        const pulse = 1 + Math.sin(G.t * 0.18 + q.seed) * 0.08;
        ctx.scale(pulse, pulse);
        ctx.fillStyle = "rgba(232,238,220,.9)";
        ctx.strokeStyle = "rgba(48,74,61,.78)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, q.r * 0.72, 0, 6.283);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "rgba(72,102,84,.7)";
        ctx.lineWidth = 1;
        for (let k = 0; k < 4; k++) {
          const a = k * 1.571;
          ctx.beginPath();
          ctx.arc(0, 0, q.r * (0.38 + k * 0.12), a, a + 2.35);
          ctx.stroke();
        }
        ctx.restore();
        continue;
      }
      const frames = q.ring ? fx?.ringWave : fx?.heavyCore;
      if (frames?.length === 4) {
        const fi = q.ring ? Math.min(3, Math.floor(Math.min(1, q.age / 42) * 4)) : q.hp >= 2 ? 1 : q.hp === 1 ? 2 : 3;
        const img = frames[fi] || frames[0], size = q.ring ? q.r * 5.6 : q.r * 3.25;
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
        continue;
      }
      const tail = Math.min(42, 8 + q.age * 0.6), v = Math.hypot(q.vx, q.vy) || 1, ux = q.vx / v, uy = q.vy / v;
      ctx.rotate(-(G.t * 0.025 + q.seed));
      const grd = ctx.createLinearGradient(-ux * tail, -uy * tail, 0, 0);
      grd.addColorStop(0, "rgba(45,40,35,0)");
      grd.addColorStop(1, "rgba(38,33,29,.42)");
      ctx.strokeStyle = grd;
      ctx.lineWidth = q.r * 1.25;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-ux * tail, -uy * tail);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.rotate(G.t * 0.025 + q.seed);
      ctx.fillStyle = "rgba(24,22,20,.9)";
      ctx.beginPath();
      for (let k = 0; k < 14; k++) {
        const a = k / 14 * 6.283, rr = q.r * (0.75 + 0.22 * Math.sin(k * 4.17 + q.seed));
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(133,47,39,.78)";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      for (let k = 0; k < q.hp; k++) {
        const a = -0.7 + k * 1.35;
        ctx.beginPath();
        ctx.moveTo(-2, 1);
        ctx.lineTo(Math.cos(a) * q.r * 0.48, Math.sin(a) * q.r * 0.48);
        ctx.lineTo(Math.cos(a + 0.18) * q.r * 0.72, Math.sin(a + 0.18) * q.r * 0.72);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(31,28,25,.46)";
      ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        const a = k * 2.094 + G.t * 0.018;
        ctx.beginPath();
        ctx.arc(0, 0, q.r + 4 + k * 2, a, a + 1.05);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drawInkFlyingSword(ctx2, s) {
    const speed = Math.hypot(s.vx || 0, s.vy || 0), k = stat.size * swMul(s).size;
    const BL = (38 + k * 1.8 + Math.min(12, speed * 0.7)) * 1.3, bw = (2.8 + k * 0.22) * 1.3;
    const EL = hooks4.getElement?.(stat.element) || hooks4.getElement?.("none"), phase = (G.t + s.age * 3) * 0.08;
    ctx2.save();
    ctx2.translate(s.x, s.y);
    ctx2.rotate(s.ang);
    ctx2.lineCap = "round";
    ctx2.lineJoin = "round";
    for (let i = 0; i < 4; i++) {
      const y = (i - 1.5) * bw * 0.75, sway = Math.sin(phase + i * 1.7) * bw * 0.9;
      ctx2.strokeStyle = "rgba(24,21,18," + (0.48 - i * 0.07) + ")";
      ctx2.lineWidth = Math.max(0.55, bw * (0.54 - i * 0.08));
      ctx2.beginPath();
      ctx2.moveTo(-8, y * 0.45);
      ctx2.quadraticCurveTo(-20 - i * 3, y + sway, -30 - i * 5, y * 0.5 + sway * 1.35);
      ctx2.stroke();
    }
    ctx2.fillStyle = "rgba(30,27,23,.16)";
    ctx2.beginPath();
    ctx2.moveTo(-BL * 0.82, -bw * 1.7);
    ctx2.lineTo(BL * 0.72, -bw * 0.58);
    ctx2.lineTo(BL * 0.92, 0);
    ctx2.lineTo(-BL * 0.9, bw * 1.3);
    ctx2.closePath();
    ctx2.fill();
    const blade = ctx2.createLinearGradient(-3, 0, BL, 0);
    blade.addColorStop(0, "rgba(18,16,14,.98)");
    blade.addColorStop(0.58, "rgba(38,35,31,.96)");
    blade.addColorStop(1, "rgba(13,12,10,.92)");
    ctx2.fillStyle = blade;
    ctx2.strokeStyle = "rgba(8,7,6,.92)";
    ctx2.lineWidth = 1.1;
    ctx2.beginPath();
    ctx2.moveTo(-3, -bw * 0.92);
    ctx2.quadraticCurveTo(BL * 0.48, -bw * 1.08, BL, 0);
    ctx2.quadraticCurveTo(BL * 0.45, bw * 0.92, -3, bw * 0.78);
    ctx2.lineTo(-7, bw * 0.28);
    ctx2.lineTo(-4, -bw * 0.2);
    ctx2.closePath();
    ctx2.fill();
    ctx2.stroke();
    ctx2.strokeStyle = stat.element === "none" ? "rgba(205,198,181,.38)" : EL.spine;
    ctx2.lineWidth = 0.9;
    ctx2.beginPath();
    ctx2.moveTo(2, 0);
    ctx2.lineTo(BL * 0.9, 0);
    ctx2.stroke();
    ctx2.strokeStyle = "rgba(241,235,221,.42)";
    ctx2.lineWidth = 0.75;
    ctx2.beginPath();
    ctx2.moveTo(BL * 0.22, -bw * 0.18);
    ctx2.lineTo(BL * 0.43, -bw * 0.1);
    ctx2.moveTo(BL * 0.52, bw * 0.12);
    ctx2.lineTo(BL * 0.68, bw * 0.04);
    ctx2.stroke();
    ctx2.fillStyle = "#171411";
    ctx2.beginPath();
    ctx2.moveTo(-4, -bw * 2.15);
    ctx2.quadraticCurveTo(1, -bw * 1.25, 1, 0);
    ctx2.quadraticCurveTo(1, bw * 1.25, -4, bw * 2.15);
    ctx2.lineTo(-7, bw * 1.25);
    ctx2.lineTo(-7, -bw * 1.25);
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = "#2c2721";
    ctx2.fillRect(-17, -bw * 0.62, 11, bw * 1.24);
    ctx2.strokeStyle = "rgba(8,7,6,.75)";
    ctx2.lineWidth = 0.8;
    for (let x = -16; x < -7; x += 2.7) {
      ctx2.beginPath();
      ctx2.moveTo(x, -bw * 0.6);
      ctx2.lineTo(x + 1.4, bw * 0.6);
      ctx2.stroke();
    }
    ctx2.fillStyle = "#15120f";
    ctx2.beginPath();
    ctx2.arc(-18, 0, bw * 0.72, 0, 6.283);
    ctx2.fill();
    ctx2.restore();
  }
  var SW_FULL = { size: 1, alpha: 1 };
  function swMul(s) {
    return s && s.mergeScale && s.mergeScale !== 1 ? { size: s.mergeScale, alpha: 1 } : SW_FULL;
  }
  function trailPose(point, fallbackAngle = 0) {
    return { x: point?.x || 0, y: point?.y || 0, ang: Number.isFinite(point?.ang) ? point.ang : fallbackAngle };
  }
  function drawJian(ctx2, s) {
    const FLYSWORD = hooks4.getFlyingSword?.();
    if (FLYSWORD.ok) {
      const speed = Math.hypot(s.vx || 0, s.vy || 0);
      const M = swMul(s);
      const TFd = stat.tierFlags || {};
      if (TFd.afterimage && s.trail && s.trail.length > 3) {
        ctx2.save();
        for (let g = 1; g <= 2; g++) {
          const q = s.trail[Math.max(0, s.trail.length - 1 - g * 3)];
          if (!q) continue;
          const pose = trailPose(q, s.ang);
          ctx2.globalAlpha = 0.2 / g;
          const gw = (44 + stat.size * 0.9) * M.size * (1 - g * 0.08), gh = gw / FLYSWORD.aspect;
          ctx2.save();
          ctx2.translate(pose.x, pose.y);
          ctx2.rotate(pose.ang);
          ctx2.drawImage(FLYSWORD.image, -gw * FLYSWORD.grip, -gh / 2, gw, gh);
          ctx2.restore();
        }
        ctx2.restore();
      }
      const longK = TFd.longBlade ? 1.28 : 1;
      const w = (44 + stat.size * 0.9 + Math.min(5, speed * 0.22)) * (s.echo ? 0.88 : 1) * M.size * longK;
      const h = w / FLYSWORD.aspect * 2.2;
      ctx2.save();
      ctx2.translate(s.x, s.y);
      ctx2.rotate(s.ang);
      ctx2.globalAlpha *= (s.echo ? 0.72 : 0.94) * M.alpha;
      ctx2.drawImage(hooks4.tintFrame?.(FLYSWORD.image, "#181512"), -w * FLYSWORD.grip, -h / 2, w, h);
      ctx2.restore();
      return;
    }
    drawInkFlyingSword(ctx2, s);
  }
  function drawEnemies() {
    const enemySprites = hooks4.getEnemySprites?.() || {};
    for (const en of G.enemies) {
      const grp = enemySprites[en.type];
      const registry = hooks4.getAssetRegistry?.();
      const inkBlade = en.type === "blade" ? registry?.getActor("enemy.ink_blade") : null;
      let renderedByManifest = false;
      if (inkBlade) {
        const controller = controllerFor(en, inkBlade.manifest, AnimationController);
        const angle = Number.isFinite(en.moveDir) ? en.moveDir : 0;
        controller.setMotion(Math.cos(angle), Math.sin(angle));
        controller.play("walk");
        renderedByManifest = drawLayeredCharacter(ctx, registry, "enemy.ink_blade", controller, en);
        if (en.actorPoc) {
          en.actorPocRender = renderedByManifest || { renderer: "fallback", logicalDirection: controller.direction, action: controller.action, frameIndex: controller.frameIndex };
          hooks4.onActorPocFrame?.(en.actorPocRender);
        }
      }
      if (!renderedByManifest && grp && grp.ok) {
        if (en.isBoss && grp.p1?.ok) {
          const p1 = grp.p1;
          let frames = p1.manifest, fi = 3;
          if (en.hit > 0 && p1.hurt.length === 4) {
            frames = p1.hurt;
            fi = Math.min(3, Math.floor((12 - en.hit) / 3));
          } else if (en.bossState === "manifest" || en.bossState === "telegraph") fi = Math.min(3, Math.floor(en.bossT / Math.max(1, (en.bossState === "manifest" ? 42 : 72) / 4)));
          else if (en.bossState === "lunge" && p1.skill.length === 3) {
            frames = p1.skill;
            fi = Math.min(2, Math.floor(en.bossT / 58 * 3));
          }
          const img = frames[Math.max(0, fi)] || p1.manifest[3], size = Math.min(W * 0.7, H * 0.39), x = en.x - size * 0.5, y = en.y - size * 0.54;
          ctx.save();
          ctx.globalAlpha = en.alpha == null ? 1 : en.alpha;
          ctx.drawImage(img, x, y, size, size);
          ctx.restore();
          en.bossHeadX = x + size * 0.31;
          en.bossHeadY = y + size * 0.34;
          en.bossHudAnchorX = x + size * 0.5;
          en.bossHudAnchorY = y + size * 0.045;
          continue;
        }
        const dirGrp = en.isBoss && en.bossSide === 0 ? grp.top : en.isBoss && en.bossSide === 2 ? grp.bottom : null;
        const bossIdle = en.isBoss ? grp.frames[0] : dirGrp && dirGrp.idle ? dirGrp.idle : null;
        const atkSrc = dirGrp ? dirGrp.attack : grp.attack;
        const bossAtk = en.isBoss && en.bossState === "lunge" && atkSrc && atkSrc.filter(Boolean).length === 6 ? atkSrc.filter(Boolean) : null;
        const bossDis = en.isBoss && (en.bossSide === 1 || en.bossSide === 3) && en.bossState === "dissolve" && grp.dissolve && grp.dissolve.filter(Boolean).length === 6 ? grp.dissolve.filter(Boolean) : null;
        const spiderAtk = en.type === "spider" && en.aiT % 180 < 54 && grp.attack && grp.attack.filter(Boolean).length === 6 ? grp.attack.filter(Boolean) : null;
        const ravenT = en.type === "raven" ? en.aiT % 170 : -1, fangT = en.type === "fang" ? en.aiT % 138 : -1;
        const expectedAtk = en.type === "fang" ? 6 : 4;
        const creatureAtk = (en.type === "raven" && ravenT >= 84 && ravenT < 132 || en.type === "fang" && fangT >= 38 && fangT < 98) && grp.attack && grp.attack.filter(Boolean).length === expectedAtk ? grp.attack.filter(Boolean) : null;
        const fr = bossAtk || bossDis || spiderAtk || creatureAtk || (bossIdle ? [bossIdle] : grp.frames.filter(Boolean)), n = fr.length, scale = en.visualScale || 1, baseHH = en.visualHeight || (en.isBoss && (en.bossSide === 1 || en.bossSide === 3) ? Math.min(en.r * 2.1 * scale, W * 0.58) : en.r * 2.1 * scale), hh = creatureAtk && en.type === "fang" ? baseHH * (265 / 201) : baseHH, base = (en.hit > 0 ? 0.9 : 1) * (en.alpha == null ? 1 : en.alpha);
        const visualLift = en.isBoss ? bossVisualLift(en.bossSide) : 0;
        const fangGroundFix = creatureAtk && en.type === "fang" ? -0.42 * (hh - baseHH) : 0;
        const put = (img, al) => {
          const src = en.isBoss ? img : enemyVariantFrame(en, img);
          const iw = src.naturalWidth || src.width || 1, ih = src.naturalHeight || src.height || 1, b = img._inkBounds;
          ctx.globalAlpha = al;
          if (en.isBoss && b && img !== bossIdle && (en.bossSide === 0 || en.bossSide === 2)) {
            const bodyH = en.r * 1.85 * scale, bodyW = bodyH * (b[2] / b[3]);
            const cy = Math.max(16 + bodyH / 2, Math.min(H - 18 - bodyH / 2, en.y + visualLift));
            const drawY = cy - bodyH / 2;
            ctx.drawImage(src, b[0], b[1], b[2], b[3], en.x - bodyW / 2, drawY, bodyW, bodyH);
            en.bossHudAnchorX = en.x;
            en.bossHudAnchorY = drawY - 10;
          } else {
            const ww = hh * (iw / ih), y = Math.max(12, Math.min(H - hh - 18, en.y - hh * 0.58 + visualLift + fangGroundFix));
            ctx.drawImage(src, en.x - ww / 2, y, ww, hh);
            if (en.isBoss) {
              en.bossHudAnchorX = en.x;
              en.bossHudAnchorY = y - 10;
            }
          }
        };
        ctx.save();
        if (en.isBoss) {
          ctx.translate(en.x, en.y);
          if (en.bossSide === 3) ctx.scale(-1, 1);
          ctx.translate(-en.x, -en.y - en.r * (scale - 1) * 0.18);
        } else if (en.type === "blade" || en.type === "spider" || en.type === "raven" || en.type === "fang") {
          ctx.translate(en.x, 0);
          ctx.scale(en.facing || 1, 1);
          ctx.translate(-en.x, 0);
          if (en.type === "raven") ctx.translate(0, Math.sin(en.aiT * 0.14 + en.aiSeed) * 2.2);
        }
        if (bossAtk) {
          if (bossIdle) put(bossIdle, base);
          const fi = Math.max(0, Math.min(5, Math.floor(en.bossT / 58 * 6)));
          put(fr[fi], base * 0.92);
        } else if (bossDis) {
          const fi = Math.max(0, Math.min(5, Math.floor(en.bossT / 46 * 6)));
          if (en.bossT < 8 && bossIdle) put(bossIdle, base * (1 - en.bossT / 8));
          put(fr[fi], base * Math.min(1, en.bossT / 8));
        } else if (spiderAtk) {
          put(fr[Math.max(0, Math.min(5, Math.floor(en.aiT % 180 / 9)))], base);
        } else if (creatureAtk) {
          const p = en.type === "raven" ? (ravenT - 84) / 48 : (fangT - 38) / 60;
          put(fr[Math.max(0, Math.min(n - 1, Math.floor(p * n)))], base);
        } else if (n <= 1) {
          put(fr[0], base);
        } else {
          const rate = en.animRate || 0.07;
          put(fr[Math.floor(G.t * rate + en.anim) % n], base);
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      } else if (!renderedByManifest) {
        ctx.save();
        ctx.translate(en.x, en.y);
        const wob = Math.sin(en.wob) * 2;
        ctx.fillStyle = en.hit > 0 ? "#d8cdb0" : en.c;
        ctx.beginPath();
        for (let a = 0; a < 6.28; a += 0.5) {
          const rr = en.r + Math.sin(a * 3 + en.wob) * 2.5 + wob;
          const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e9e0cc";
        ctx.beginPath();
        ctx.arc(-en.r * 0.3, -2, 2.4, 0, 6.28);
        ctx.arc(en.r * 0.3, -2, 2.4, 0, 6.28);
        ctx.fill();
        ctx.restore();
      }
      const stEro = en.st && en.st.erosion && en.st.erosion.t > 0 ? en.st.erosion : null;
      const stSup = en.st && en.st.suppression && en.st.suppression.t > 0 ? en.st.suppression : null;
      if (en.ember > 0 || en.chill > 0 || stEro || stSup) {
        ctx.save();
        ctx.translate(en.x, en.y);
        if (en.ember > 0) {
          ctx.strokeStyle = "rgba(200,102,46,.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, en.r + 3, 0, 6.28);
          ctx.stroke();
        }
        if (en.chill > 0) {
          ctx.strokeStyle = "rgba(120,180,220,.85)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, en.r + 3, 0, 6.28);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (stEro) hooks4.drawErosion?.(en, stEro);
      if (stSup) hooks4.drawSuppression?.(en, stSup);
      if (!en.isBoss && (en.isElite || en.hp < en.max)) {
        const manifestHeight = en.visualHeight || en.r * 2.1;
        const manifestTop = inkBlade && renderedByManifest ? en.y - manifestHeight * (inkBlade.manifest.canvas?.footPivot?.y ?? 1) : null;
        const w = Math.max(30, Math.min(62, en.r * 2.45)), h = 4, x = en.x - w / 2, y = manifestTop == null ? en.y - en.r - 12 : manifestTop - 9;
        ctx.fillStyle = "rgba(20,17,14,.88)";
        ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
        ctx.fillStyle = "rgba(76,66,55,.72)";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#a22f2b";
        ctx.fillRect(x, y, Math.max(0, w * Math.min(1, en.hp / en.max)), h);
        ctx.fillStyle = "rgba(235,218,188,.28)";
        ctx.fillRect(x, y, w, 1);
        if (en.isElite) {
          ctx.fillStyle = "#173e31";
          ctx.font = '600 11px "Noto Serif TC",serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(en.speciesName, en.x, y - 4);
        }
      }
    }
  }
  function drawPlayer() {
    const drawLevel = hooks4.getDrawLevel?.() || 0;
    const fx = hooks4.getFX?.() || {};
    const { ART: art } = hooks4.getHeroAssets();
    const swordSprite = hooks4.getSwordSprite?.();
    const P = G.player;
    if (drawLevel >= 3) {
      ctx.save();
      const feet = P.y + P.r * 1.05;
      const hpr = Math.max(0, P.hp / P.max), urg = 1 + (1 - hpr) * 2, low = hpr < 0.4;
      if (fx.glow) {
        const glow = ctx.createRadialGradient(P.x, feet, 4, P.x, feet, P.r + 30 + P.pulse * 26);
        const gc = low ? "176,64,48" : "40,34,28";
        glow.addColorStop(0, "rgba(" + gc + ",.26)");
        glow.addColorStop(1, "rgba(" + gc + ",0)");
        ctx.save();
        ctx.translate(P.x, feet);
        ctx.scale(1, 0.4);
        ctx.translate(-P.x, -feet);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(P.x, feet, P.r + 30 + P.pulse * 26, 0, 6.28);
        ctx.fill();
        ctx.restore();
      }
      if (swordSprite.ok && fx.glow) {
        const N = 6, spin = G.t * 6e-3 * urg;
        const rx = P.r + 26 + G.intent * 8, ry = rx * 0.42;
        ctx.save();
        ctx.translate(P.x, feet);
        const order = [];
        for (let i = 0; i < N; i++) order.push(i);
        order.sort((p, q) => Math.sin(spin + p / N * 6.283) - Math.sin(spin + q / N * 6.283));
        for (const i of order) {
          const a = spin + i / N * 6.283, px = Math.cos(a) * rx, py = Math.sin(a) * ry;
          const depth = (Math.sin(a) + 1) / 2;
          const im = swordSprite.idle[(i * 2 + Math.floor(G.t * 0.04)) % swordSprite.idle.length];
          if (!im || !im.complete || !im.naturalWidth) continue;
          const L = P.r * (0.95 + depth * 0.5) * 1.15;
          const w = L / swordSprite.blade, hh = w / swordSprite.aspect;
          const dir = Math.atan2(py, px);
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(dir);
          ctx.globalAlpha = 0.24 + depth * 0.5;
          ctx.drawImage(low ? tintFrame(im, "#a2422b") : im, -w * swordSprite.grip, -hh / 2, w, hh);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      ctx.restore();
      if (G.webT > 0 && drawLevel >= 4) {
        const a = Math.min(0.42, G.webT / 70 * 0.42), rr = 52 + Math.sin(G.t * 0.08) * 3;
        ctx.save();
        ctx.translate(P.x, P.y);
        ctx.strokeStyle = "rgba(35,92,70," + a + ")";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (let n = 0; n < 8; n++) {
          const th = n * Math.PI / 4;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(th) * rr, Math.sin(th) * rr);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, rr * 0.55, 0, 6.283);
        ctx.arc(0, 0, rr, 0, 6.283);
        ctx.stroke();
        ctx.restore();
      }
      if (art.ok || heroSet().ok) drawHero(P);
      else {
        ctx.fillStyle = P.pulse > 0.3 ? "#b04030" : "#4a5a3a";
        ctx.beginPath();
        ctx.arc(P.x, P.y, P.r, 0, 6.28);
        ctx.fill();
        ctx.strokeStyle = "#2b2620";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#e9e0cc";
        ctx.font = "22px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("靈", P.x, P.y + 1);
      }
      ctx.restore();
    }
  }
  function draw() {
    const FX = hooks4.getFX?.() || {};
    const DRAWLV = hooks4.getDrawLevel?.() || 0;
    const { drawing, path, curLen, meta, ELEM } = hooks4.getDrawState();
    const allowedLen = hooks4.allowedLen;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildPaper();
    ctx.clearRect(0, 0, W, H);
    if (G.shake > 0 && !G.paused) {
      const a = Math.random() * 6.283, m = G.shake * 0.55;
      ctx.translate(Math.cos(a) * m, Math.sin(a) * m);
    }
    if (FX.ink && DRAWLV >= 2) for (const p of G.inks) {
      ctx.globalAlpha = Math.max(0, p.a);
      ctx.fillStyle = "#2b2620";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawPlayer();
    drawBossShots();
    if (DRAWLV >= 4) drawEnemies();
    if (DRAWLV >= 5) for (const k of G.streaks) {
      ctx.strokeStyle = "rgba(40,34,28," + k.life * 0.34 + ")";
      ctx.lineWidth = 1.6 * k.life + 0.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(k.x1, k.y1);
      ctx.lineTo(k.x2, k.y2);
      ctx.stroke();
    }
    if (DRAWLV >= 4) for (const c of G.cuts) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.ang);
      ctx.lineCap = "round";
      const L = c.len * (1.15 - c.life * 0.15);
      ctx.strokeStyle = "rgba(250,247,238," + c.life * 0.85 + ")";
      ctx.lineWidth = 2.6 * c.life + 0.6;
      ctx.beginPath();
      ctx.moveTo(-L * 0.5, 0);
      ctx.lineTo(L * 0.5, 0);
      ctx.stroke();
      ctx.strokeStyle = "rgba(250,247,238," + c.life * 0.32 + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-L * 0.34, -3.2);
      ctx.lineTo(L * 0.42, -3.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-L * 0.42, 3);
      ctx.lineTo(L * 0.3, 3);
      ctx.stroke();
      ctx.restore();
    }
    if (G.anchorLinks.length) {
      ctx.save();
      ctx.strokeStyle = "rgba(26,23,19,0.32)";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      for (const Lk of G.anchorLinks) {
        ctx.beginPath();
        ctx.moveTo(Lk.ax, Lk.ay);
        ctx.lineTo(Lk.bx, Lk.by);
        ctx.stroke();
      }
      ctx.restore();
    }
    const anchorFieldOn = (stat.tierFlags || {}).anchorField;
    for (const A of G.anchors) {
      const fade = Math.min(1, A.t / 30);
      if (anchorFieldOn && DRAWLV >= 4) {
        const pulse = 0.5 + 0.5 * Math.sin(G.t * 0.05 + A.x * 0.01);
        ctx.save();
        ctx.globalAlpha = 0.1 * fade * (0.7 + 0.3 * pulse);
        ctx.fillStyle = "#4a453d";
        ctx.beginPath();
        ctx.arc(A.x, A.y, A.r * (0.92 + 0.08 * pulse), 0, 6.283);
        ctx.fill();
        ctx.globalAlpha = 0.16 * fade;
        ctx.strokeStyle = "#3a352d";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(A.x, A.y, A.r, 0, 6.283);
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha *= fade;
      const groundY = A.y + 7;
      if (!A.visual) A.visual = { x: A.x, y: groundY - 18, ang: Math.PI / 2, vx: 0, vy: 0, age: 30, seed: A.x + A.y, trail: [] };
      A.visual.x = A.x;
      A.visual.y = groundY - 18;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, groundY);
      ctx.clip();
      drawJian(ctx, A.visual);
      ctx.restore();
      ctx.fillStyle = "rgba(28,25,21,.58)";
      ctx.beginPath();
      ctx.ellipse(A.x, groundY, 11, 2.7, 0, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = "rgba(45,40,34,.38)";
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(A.x - 7, groundY + 1);
      ctx.lineTo(A.x - 15, groundY + 5);
      ctx.moveTo(A.x + 6, groundY + 1);
      ctx.lineTo(A.x + 14, groundY + 4);
      ctx.moveTo(A.x - 3, groundY + 2);
      ctx.lineTo(A.x - 7, groundY + 7);
      ctx.stroke();
      ctx.restore();
    }
    if (DRAWLV >= 5) for (const s of G.swords) {
      if (s.mergeHidden) continue;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      let rgb = (ELEM[stat.element] || ELEM.none).trail;
      if (stat.element === "none" && meta.skin === "gold") rgb = "198,150,60";
      if (s.returned && stat.returnDry) rgb = "196,186,168";
      if ((stat.tierFlags || {}).dryBrushTrail) rgb = "206,196,178";
      if (FX.trail) {
        const inline = s.cmd && s.cmd.formation === "inline";
        const keep = inline ? 2 : 7;
        const shortTrail = s.trail.length > keep ? s.trail.slice(-keep) : s.trail;
        const TM = swMul(s);
        ctx.save();
        ctx.globalAlpha = (s.echo ? 0.35 : inline ? 0.18 : 0.58) * TM.alpha;
        swordFxTrail(ctx, shortTrail, Math.max(1.1, stat.size * (inline ? 0.18 : 0.42)) * (s.echo ? 0.7 : 1) * TM.size, rgb);
        ctx.restore();
      }
      drawJian(ctx, s);
    }
    if (DRAWLV >= 4) for (const d of G.drops) {
      const k = Math.min(1, d.t / 40);
      ctx.globalAlpha = 0.34 * k + 0.12;
      ctx.fillStyle = "#2b2620";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * (0.8 + 0.2 * Math.sin(G.t * 0.09 + d.x)), 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (DRAWLV >= 6) for (const L of G.lingers) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, L.t / 36 * 0.5);
      ctx.strokeStyle = "rgba(43,38,32,.8)";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2 + stat.size * 0.35;
      ctx.beginPath();
      ctx.moveTo(L.pts[0].x, L.pts[0].y);
      for (let k = 1; k < L.pts.length; k++) ctx.lineTo(L.pts[k].x, L.pts[k].y);
      ctx.stroke();
      ctx.restore();
    }
    if (DRAWLV >= 6 && drawing && path.length > 1) {
      const totalBudget = allowedLen(), lead = leadInLen(path), budget = Math.max(0, totalBudget - lead);
      drawLiveCommandInk(path, budget);
      const a = path[Math.max(0, path.length - 4)], b = path[path.length - 1];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      ctx.fillStyle = "#7a2b2b";
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(2, 7);
      ctx.lineTo(2, -7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const strokeCharged = Math.min(curLen, budget);
      drawStrokeCost(b.x, b.y, lead + strokeCharged, strokeCharged);
    }
    if (DRAWLV >= 3) for (const m of G.mists) drawMistDissolve(ctx, m);
    if (DRAWLV >= 4) for (const sp of G.splashes) drawSplash(ctx, sp);
    if (FX.part && DRAWLV >= 7) for (const p of G.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5 * p.life + 0.5, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (DRAWLV >= 7) for (const t of G.texts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, t.life * 1.45));
      if (t.damage) {
        const pop = t.age < 6 ? 0.72 + t.age * 0.055 : 1, size = t.crit ? 26 : 22;
        ctx.translate(t.x, t.y);
        ctx.scale(pop, pop);
        ctx.font = (t.crit ? "700 " : "600 ") + size + 'px "Noto Serif TC","STKaiti","KaiTi",serif';
        ctx.shadowColor = "rgba(250,246,238,.9)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = t.c;
        ctx.fillText(t.txt, 0, 0);
        ctx.shadowColor = "transparent";
      } else {
        ctx.font = "bold 16px serif";
        ctx.fillStyle = t.c;
        ctx.fillText(t.txt, t.x, t.y);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (G.reserve > 0) drawReserve();
    if (DRAWLV >= 8 && G.banner) {
      const L = G.banner.life, al = Math.min(1, L * 2.4) * Math.min(1, (1 - L) * 6 + 0.2);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, al)) * 0.82;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#2b2620";
      ctx.font = '700 46px "Noto Serif TC",serif';
      ctx.letterSpacing && (ctx.letterSpacing = "10px");
      ctx.fillText(G.banner.txt, W / 2, H * 0.22 + (1 - L) * 10);
      ctx.strokeStyle = "rgba(122,43,43,.75)";
      ctx.lineWidth = 1.4;
      const bw = 120;
      ctx.beginPath();
      ctx.moveTo(W / 2 - bw, H * 0.22 + 34);
      ctx.lineTo(W / 2 + bw, H * 0.22 + 34);
      ctx.stroke();
      ctx.restore();
    }
    if (DRAWLV >= 8 && G.flash > 0 && !G.paused) {
      ctx.fillStyle = "rgba(" + G.flashC + "," + Math.max(0, G.flash) + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }
  function drawStrokeCost(x, y, chargedLen, lifeLen) {
    const free = G.mana - stat.costBase <= 0 && G.reserve > 0;
    const cost = stat.costBase + chargedLen * Math.max(1e-3, stat.costPerPx);
    const life = cmdLife(lifeLen == null ? chargedLen : lifeLen);
    const txt = (free ? "劍匣 · 免費" : "-" + Math.round(cost) + " 劍意") + "　耐久 " + life;
    const up = y > 96;
    const dx = x > W - 96 ? -1 : 1;
    const tx = x + dx * 26, ty = y + (up ? -34 : 34);
    ctx.save();
    ctx.textAlign = dx > 0 ? "left" : "right";
    ctx.textBaseline = "middle";
    ctx.font = '700 17px "Noto Serif TC","STKaiti","KaiTi",serif';
    ctx.shadowColor = "rgba(250,246,238,.95)";
    ctx.shadowBlur = 7;
    ctx.fillStyle = free ? "#c08a2e" : cost >= G.mana - 0.5 ? "#7a2b2b" : "rgba(43,38,32,.92)";
    ctx.fillText(txt, tx, ty);
    ctx.shadowColor = "transparent";
    ctx.restore();
  }
  function drawLiveCommandInk(pts, budget) {
    let run = 0;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k], seg = Math.hypot(b.x - a.x, b.y - a.y);
      run += seg;
      const over = run > budget, t = k / Math.max(1, pts.length - 1), base = 5.8 + stat.size * 0.48 + t * 3.8, ink = over ? "192,138,46" : "30,28,25";
      ctx.strokeStyle = "rgba(" + ink + ",.18)";
      ctx.lineWidth = base * 1.75;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(" + ink + "," + (over ? 0.82 : 0.9) + ")";
      ctx.lineWidth = base * (0.82 + 0.13 * Math.sin(k * 1.73));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (k % 3 !== 0 && seg > 1) {
        const nx = -(b.y - a.y) / seg, ny = (b.x - a.x) / seg;
        for (let j = -1; j <= 1; j += 2) {
          const off = j * base * (0.31 + 0.08 * Math.sin(k * 2.31 + j));
          ctx.strokeStyle = "rgba(" + ink + "," + (over ? 0.35 : 0.43) + ")";
          ctx.lineWidth = Math.max(0.7, base * 0.105);
          ctx.beginPath();
          ctx.moveTo(a.x + nx * off, a.y + ny * off);
          ctx.lineTo(b.x + nx * off * 0.72, b.y + ny * off * 0.72);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  function drawReserve() {
    const SWDSPR = hooks4.getSwordSprite?.();
    const n = G.reserve, show = Math.min(n, 3);
    const BL = 34, gap = BL * 0.62;
    const y = H - 30, flash = Math.max(0, G.reserveFlash);
    ctx.save();
    ctx.globalAlpha = 0.86 + flash * 0.14;
    const im = SWDSPR.ok && SWDSPR.idle[0] && SWDSPR.idle[0].complete && SWDSPR.idle[0].naturalWidth ? SWDSPR.idle[0] : null;
    const totalW = (show - 1) * gap;
    for (let i = 0; i < show; i++) {
      const x = W / 2 - totalW / 2 + i * gap;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 2);
      if (im) {
        const w = BL / SWDSPR.blade, h = w / SWDSPR.aspect;
        ctx.drawImage(im, -w * SWDSPR.grip, -h / 2, w, h);
      } else {
        ctx.strokeStyle = "rgba(43,38,32,.86)";
        ctx.lineCap = "round";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-BL * 0.28, 0);
        ctx.lineTo(BL * 0.72, 0);
        ctx.stroke();
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(-BL * 0.3, -4);
        ctx.lineTo(-BL * 0.3, 4);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (n > 3) {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = '700 15px "Noto Serif TC",serif';
      ctx.fillStyle = "rgba(43,38,32,.9)";
      ctx.shadowColor = "rgba(250,246,238,.9)";
      ctx.shadowBlur = 5;
      ctx.fillText("×" + n, W / 2 + totalW / 2 + BL * 0.42, y - BL * 0.42);
      ctx.shadowColor = "transparent";
    }
    if (flash > 0) {
      ctx.globalAlpha = flash * 0.45;
      ctx.fillStyle = "rgba(246,240,226,1)";
      ctx.beginPath();
      ctx.ellipse(W / 2, y - BL * 0.35, totalW / 2 + BL * 0.7, BL * 0.75, 0, 0, 6.283);
      ctx.fill();
    }
    ctx.restore();
  }
  function buildPaper() {
    if (paperDone) return;
    const paper = document.getElementById("paper");
    for (const el of [paper]) {
      el.style.backgroundColor = "#e9e0cc";
      el.style.backgroundImage = "radial-gradient(circle at 50% 45%, rgba(20,18,14,0), rgba(20,18,14,.035) 82%),url('assets/scenes/pomo-valley-restored-v2.png')";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center center";
      el.style.backgroundRepeat = "no-repeat";
    }
    document.getElementById("paperlight").style.backgroundImage = "url('assets/scenes/pomo-valley-cleansing-v2.png')";
    document.getElementById("papermid").style.backgroundImage = "url('assets/scenes/pomo-valley-recovering-v2.png')";
    document.getElementById("paperheavy").style.backgroundImage = "url('assets/scenes/pomo-valley-corrupted-v2.png')";
    updatePaperPhase();
    paperDone = true;
  }
  function updatePaperPhase() {
    const heavy = document.getElementById("paperheavy"), mid = document.getElementById("papermid"), light = document.getElementById("paperlight");
    if (!heavy || !mid || !light) return;
    const w = Math.max(1, G.wave || 1);
    let oh = 0, om = 0, ol = 0;
    if (w <= 20) {
      const t = (w - 1) / 19;
      oh = 1 - t;
      om = t;
    } else if (w <= 40) {
      const t = (w - 21) / 19;
      om = 1 - t;
      ol = t;
    } else if (w <= 60) {
      const t = (w - 41) / 19;
      ol = 1 - t * 0.22;
    }
    heavy.style.opacity = oh.toFixed(3);
    mid.style.opacity = om.toFixed(3);
    light.style.opacity = ol.toFixed(3);
  }
  function ensureSupV(en) {
    if (!en.supV) en.supV = {
      seed: Math.floor(Math.random() * 9999),
      t: 0,
      cyc: 0,
      lx: en.x,
      ly: en.y,
      press: 0,
      sink: 0,
      maxS: 4
    };
    return en.supV;
  }
  function ensureEroV(en) {
    if (!en.eroV) en.eroV = { seed: Math.floor(Math.random() * 9999), t: 0, flash: 0, suck: 0, stk: 0, cracks: null };
    return en.eroV;
  }
  function bakeHero(h) {
    const { HERO, ART } = hooks4.getHeroAssets();
    if (heroCv && heroH === h) return;
    heroH = h;
    heroW = Math.round(h * HERO.aspect);
    const mk = (tint) => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, heroW * DPR);
      c.height = Math.max(1, h * DPR);
      const g = c.getContext("2d");
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.drawImage(ART.body, 0, 0, heroW, h);
      if (tint) {
        g.globalCompositeOperation = "source-atop";
        g.fillStyle = tint;
        g.fillRect(0, 0, heroW, h);
      }
      return c;
    };
    heroCv = mk(null);
    heroHurtCv = mk("rgba(176,56,40,0.85)");
  }
  function heroSet() {
    const { meta, HEROX, HEROF, HEROSPR } = hooks4.getHeroAssets();
    if (meta.heroSkin === "x" && HEROX.ok) return HEROX;
    if (meta.heroSkin === "f" && HEROF.ok) return HEROF;
    return HEROSPR;
  }
  function drawHero(P) {
    const { HEROF } = hooks4.getHeroAssets();
    const S = heroSet();
    if (S === HEROF && HEROF.proc) {
      drawHeroF(P);
      return;
    }
    if (S.ok) {
      drawHeroSprite(P);
      return;
    }
    drawHeroProc(P);
  }
  var _tintCache = /* @__PURE__ */ new WeakMap();
  function tintFrame(im, col) {
    let byCol = _tintCache.get(im);
    if (!byCol) {
      byCol = /* @__PURE__ */ new Map();
      _tintCache.set(im, byCol);
    }
    let cv2 = byCol.get(col);
    if (cv2) return cv2;
    const W2 = im.naturalWidth, H2 = im.naturalHeight;
    cv2 = document.createElement("canvas");
    cv2.width = W2;
    cv2.height = H2;
    const g = cv2.getContext("2d");
    g.drawImage(im, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = col;
    g.fillRect(0, 0, W2, H2);
    g.globalCompositeOperation = "source-over";
    byCol.set(col, cv2);
    return cv2;
  }
  function drawHeroSprite(P) {
    const S = heroSet();
    const h = P.r * 5 * HERO_BODY_SCALE, w = h * S.aspect, feet = P.y + P.r * 1.18;
    const dying = G.deathT > 0;
    const hasDeath = !!(S.death && S.death.length), hasHurt = !!(S.hurt && S.hurt.length);
    const br = dying ? 0 : Math.sin(G.t * 0.042);
    const fade = dying && !hasDeath ? Math.max(0, G.deathT / G.deathMax) : 1;
    const glow = !hasHurt ? Math.min(1, P.pulse || 0) : 0;
    ctx.save();
    ctx.translate(P.x, feet + br * 1.1);
    ctx.scale(dying ? 1 : G.facing, 1 + br * 0.013);
    const put = (im, a) => {
      if (!im || !im.complete || !im.naturalWidth) return;
      ctx.globalAlpha = a * fade;
      ctx.drawImage(im, -w / 2, -h * S.foot, w, h);
      if (glow > 0) {
        ctx.globalAlpha = a * fade * glow * 0.72;
        ctx.drawImage(tintFrame(im, "#c83828"), -w / 2, -h * S.foot, w, h);
        ctx.globalAlpha = a;
      }
    };
    if (dying && hasDeath) {
      const k = Math.min(6, 6 - Math.floor(G.deathT / 9));
      put(S.death[Math.min(S.death.length - 1, Math.max(0, k))], 1);
    } else if (G.hurtT > 0 && hasHurt) {
      const k = Math.min(3, 3 - Math.floor(G.hurtT / 5));
      put(S.hurt[Math.min(S.hurt.length - 1, Math.max(0, k))], 1);
    } else {
      const sp = 42e-4 * (1 + G.intent * 0.6), t = G.t * sp + G.heroPhase;
      const n = S.idle.length, f = (t % n + n) % n, i0 = Math.floor(f);
      put(S.idle[i0], 1);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  var hfCv = null;
  var hfRed = null;
  var hfH = 0;
  var hfW = 0;
  function bakeHeroF(h, w) {
    const { HEROF } = hooks4.getHeroAssets();
    if (hfCv && hfH === h) return;
    hfH = h;
    hfW = w;
    const mk = (tint) => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w * DPR));
      c.height = Math.max(1, Math.round(h * DPR));
      const g = c.getContext("2d");
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.drawImage(HEROF.body, 0, 0, w, h);
      if (tint) {
        g.globalCompositeOperation = "source-atop";
        g.fillStyle = tint;
        g.fillRect(0, 0, w, h);
      }
      return c;
    };
    hfCv = mk(null);
    hfRed = mk("rgba(200,56,40,0.9)");
  }
  function hfOrbit(P) {
    const { HEROF } = hooks4.getHeroAssets();
    const h = P.r * 5 * HERO_VISUAL_SCALE, w = h * HEROF.aspect, feet = P.y + P.r * 1.18;
    return { cx: P.x, cy: feet - h * 0.2, rx: w * 0.62, ry: h * 0.088, h, w };
  }
  function drawHeroFBody(P, alpha) {
    const { HEROF } = hooks4.getHeroAssets();
    const h = P.r * 5 * HERO_BODY_SCALE, w = h * HEROF.aspect, feet = P.y + P.r * 1.18;
    bakeHeroF(h, w);
    const dying = G.deathT > 0;
    const br = dying ? 0 : Math.sin(G.t * 0.042);
    const glow = Math.min(1, P.pulse || 0);
    ctx.save();
    ctx.translate(P.x, feet + br * 1.1);
    ctx.scale(dying ? 1 : G.facing, 1 + br * 0.013);
    const top = -h * HEROF.foot;
    const put = (im, a) => {
      if (!im || !im.complete || !im.naturalWidth) return;
      ctx.globalAlpha = alpha * a;
      ctx.drawImage(im, -w / 2, top, w, h);
      if (glow > 0.02) {
        ctx.globalAlpha = alpha * a * glow * 0.7;
        ctx.drawImage(tintFrame(im, "#c83828"), -w / 2, top, w, h);
      }
    };
    if (HEROF.framesReady && G.castT > 0) {
      const k = Math.min(5, Math.max(0, 5 - Math.floor(G.castT / 4)));
      put(HEROF.cast[k], 1);
    } else if (HEROF.framesReady) {
      const t = G.t * 0.02 + G.heroPhase, f = (t % 6 + 6) % 6, i0 = Math.floor(f);
      put(HEROF.idle[i0], 1);
    } else {
      ctx.globalAlpha = alpha;
      ctx.drawImage(hfCv, -w / 2, top, w, h);
      if (glow > 0.02) {
        ctx.globalAlpha = alpha * glow * 0.7;
        ctx.drawImage(hfRed, -w / 2, top, w, h);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  function drawHeroFSword(P, front, fade) {
    const { HEROF } = hooks4.getHeroAssets();
    const S = HEROF.sword;
    if (!S || !S.complete || !S.naturalWidth) return;
    const o = hfOrbit(P);
    const th = G.t * (0.0155 * (1 + G.intent * 1.2)) + G.heroPhase * 2;
    const sn = Math.sin(th);
    if (sn > 0 !== front) return;
    const dep = sn * 0.5 + 0.5;
    const x = o.cx + Math.cos(th) * o.rx, y = o.cy + sn * o.ry;
    const ang = Math.atan2(Math.cos(th) * o.ry, -Math.sin(th) * o.rx);
    if (hooks4.getFX?.()?.trail) {
      const tr = [];
      for (let i = 9; i >= 1; i--) {
        const a = th - i * 0.072;
        tr.push({ x: o.cx + Math.cos(a) * o.rx, y: o.cy + Math.sin(a) * o.ry });
      }
      tr.push({ x, y });
      ctx.globalAlpha = (0.16 + dep * 0.3) * fade;
      hooks4.inkTrail?.(ctx, tr, 2.6 + dep * 2.4, "46,40,34");
    }
    const BL = o.w * (0.46 + dep * 0.14), hq = BL / HEROF.swAspect;
    ctx.save();
    ctx.globalAlpha = (0.46 + dep * 0.5) * fade;
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.drawImage(S, -BL * HEROF.swGrip, -hq / 2, BL, hq);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  function drawHeroFInk(P, front, fade) {
    if (!hooks4.getFX?.()?.trail) return;
    const o = hfOrbit(P);
    for (let k = 0; k < 3; k++) {
      const th = G.t * (0.0102 + k * 26e-4) + k * 2.094 + G.heroPhase;
      const sn = Math.sin(th);
      if (sn > 0 !== front) continue;
      const rx = o.rx * (0.8 + k * 0.13), ry = o.ry * (0.72 + k * 0.34), yo = -o.h * (0.02 + k * 0.085);
      const tr = [];
      for (let i = 11; i >= 0; i--) {
        const a = th - i * 0.108;
        tr.push({
          x: o.cx + Math.cos(a) * rx,
          y: o.cy + yo + Math.sin(a) * ry + Math.sin(a * 3 + G.t * 0.03) * o.h * 0.014
        });
      }
      ctx.globalAlpha = (0.2 + (sn * 0.5 + 0.5) * 0.26) * fade;
      hooks4.inkTrail?.(ctx, tr, 2.1 + k * 0.8, "56,48,40");
    }
    ctx.globalAlpha = 1;
  }
  function drawHeroF(P) {
    const dying = G.deathT > 0;
    const fade = dying ? Math.max(0, G.deathT / G.deathMax) : 1;
    const fx = (hooks4.getDrawLevel?.() || 0) >= 4;
    if (fx) {
      drawHeroFInk(P, false, fade);
      drawHeroFSword(P, false, fade);
    }
    drawHeroFBody(P, fade);
    if (fx) {
      drawHeroFSword(P, true, fade);
      drawHeroFInk(P, true, fade);
    }
  }
  function drawHeroProc(P) {
    const { HERO } = hooks4.getHeroAssets();
    const h = P.r * 4.7 * HERO_BODY_SCALE;
    bakeHero(h);
    const w = heroW, feet = P.y + P.r * 1.05;
    const br = Math.sin(G.t * 0.042);
    const src = P.pulse > 0.15 ? heroHurtCv : heroCv;
    ctx.save();
    ctx.translate(P.x, feet + br * 1.1);
    ctx.scale(G.facing, 1 + br * 0.014);
    const N = 28, sh = h / N, sDPR = src.height / h;
    for (let i = 0; i < N; i++) {
      const y0 = i * sh, ry = (y0 + sh * 0.5) / h;
      const robe = Math.max(0, Math.min(1, (ry - 0.3) / 0.42)) * (1 - Math.max(0, Math.min(1, (ry - 0.87) / 0.13)));
      const hair = Math.max(0, 1 - Math.abs(ry - 0.14) / 0.17);
      const amp = (robe * 0.085 + hair * 0.05) * w * (1 + G.intent * 0.18);
      const dx = Math.sin(ry * 7.4 - G.t * 0.052) * amp + Math.sin(ry * 3 - G.t * 0.029) * amp * 0.45;
      ctx.drawImage(
        src,
        0,
        y0 * sDPR,
        src.width,
        sh * sDPR + 1,
        -w / 2 + dx,
        -h + y0,
        w,
        sh + 0.7
      );
    }
    ctx.restore();
  }

  // src/ui.js
  var hooks5 = {};
  function configureUI(nextHooks) {
    hooks5 = nextHooks || {};
  }
  var pausedByUser = false;
  var previewTimer = null;
  var VOLUME_CONTROLS = [["volMaster", "master"], ["volMusic", "music"], ["volSfx", "sfx"]];
  var REBIRTH_BRANCH_HEAD = { foundation: "築基 · 永久數值", mind: "心法 · 改變節奏", inheritance: "傳承 · 開啟悟道池" };
  var respecArmed = false;
  var hudCache = {};
  var CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  var CN_TENS = { 2: "廿", 3: "卅" };
  function num2cn(n) {
    n = Math.max(0, Math.round(n));
    if (n <= 10) return CN[n];
    if (n < 100) {
      const t = Math.floor(n / 10), o = n % 10;
      const head = t === 1 ? "十" : CN_TENS[t] || CN[t] + "十";
      return head + (o ? CN[o] : "");
    }
    if (n < 1e4) {
      const units = ["", "十", "百", "千"], d = String(n).split("").map(Number);
      let out = "", zero = false;
      for (let i = 0; i < d.length; i++) {
        const v = d[i], u = units[d.length - 1 - i];
        if (v === 0) {
          zero = true;
          continue;
        }
        if (zero && out) out += "零";
        zero = false;
        out += v === 1 && u === "十" && i === 0 ? "十" : CN[v] + u;
      }
      return out;
    }
    return String(n);
  }
  function setTxt(id, v) {
    if (hudCache[id] !== v) {
      const e = document.getElementById(id);
      if (!e) return;
      hudCache[id] = v;
      e.textContent = v;
    }
  }
  function setW(id, v) {
    if (hudCache["w" + id] !== v) {
      const e = document.getElementById(id);
      if (!e) return;
      hudCache["w" + id] = v;
      e.style.width = v;
      const bar = e.parentElement;
      if (bar) bar.style.setProperty("--p", parseFloat(v) || 0);
    }
  }
  function renderManaBill() {
    const el = document.getElementById("manabill");
    if (!el) return;
    const perPx = Math.max(1e-3, stat.costPerPx);
    const DEFAULT_STROKE = 300;
    const ref = G.strokeN > 0 ? G.strokeAvg : DEFAULT_STROKE;
    const oneCost = stat.costBase + ref * perPx;
    const casts = oneCost > 0 ? stat.manaMax / oneCost : 0;
    const rows = [
      // 只點一下不拉線的最低出手成本。升階不會動到它 ——
      // 這正是玩家要知道的事:劍訣升上去不會讓你出不了手,只會讓你畫不長。
      ["最省一劍", Math.round(stat.costBase) + " 劍意", 0],
      ["你的一劍", Math.round(oneCost) + " 劍意", 0],
      ["滿劍意可出", casts.toFixed(1) + " 劍", 1]
    ];
    el.innerHTML = rows.map((r) => '<span class="' + (r[2] ? "key" : "") + '">' + r[0] + "<b>" + r[1] + "</b></span>").join("") + '<span class="note">' + (G.strokeN > 0 ? "依你近期出手 " + Math.round(ref) + " 寸估" : "依 " + DEFAULT_STROKE + " 寸估(還沒出過劍)") + "</span>";
  }
  function resetHudCache() {
    Object.keys(hudCache).forEach((key) => delete hudCache[key]);
  }
  function updateHUD() {
    const P = G.player;
    updatePaperPhase();
    setW("hpfill", Math.max(0, P.hp / P.max * 100).toFixed(1) + "%");
    setTxt("hptxt", Math.max(0, Math.round(P.hp)) + " / " + P.max);
    const mpr = G.mana / stat.manaMax;
    setW("mpfill", Math.max(0, mpr * 100).toFixed(1) + "%");
    const mpEl = document.getElementById("mpfill");
    if (mpEl) mpEl.classList.toggle("low", mpr < 0.25);
    setTxt("mptxt", Math.round(G.mana) + " / " + stat.manaMax);
    setW("xpfill", Math.max(0, Math.min(100, G.xp / G.xpNeed * 100)).toFixed(1) + "%");
    setTxt("lvtxt", num2cn(G.level));
    const realmTarget = hooks5.realmKillTarget?.(G.wave), realmKills = G.waveKills || 0;
    setTxt("killtxt", String(realmKills) + " / " + realmTarget);
    setTxt("remainkilltxt", Math.max(0, realmTarget - realmKills) + " 妖");
    setTxt("scoreclocktxt", hooks5.realmClockText?.());
    setTxt("wavetxt", "第 " + num2cn(G.wave) + " 境");
    setTxt("realmclock", hooks5.realmClockText?.());
    {
      const clock = document.getElementById("realmclock");
      if (clock) clock.classList.toggle("danger", hooks5.realmTimeFrames?.(G.wave) - G.waveTimer <= 600);
    }
    if (G.bossTest) {
      const boss = G.enemies.find((en) => en.isBoss && !en.showcaseGhost), out = document.getElementById("bosstestreadout");
      const dist = boss && G.player ? Math.round(Math.hypot(boss.x - G.player.x, boss.y - G.player.y)) : 0;
      if (out) out.textContent = "每令 " + Math.max(1, stat.count | 0) + "　在場 " + G.swords.length + "　命中 " + (boss ? boss.testHits || 0 : 0) + "\nHP " + (boss ? Math.max(0, Math.round(boss.hp)) : 0) + "　距 " + dist + "　位 " + (boss ? boss.bossSide : "-") + "　墨核 " + G.bossShots.length + "\n" + (boss ? hooks5.getBossStateLabel?.(boss.bossState) || boss.bossState : "已擊破") + "　下擊 " + hooks5.bossTestAttackCountdown?.(boss).toFixed(1) + "秒" + (G.bossPreset60 ? "\n六十境基準　" + ((G.bossFightFrames || 0) / 60).toFixed(1) + "秒" : "");
    }
    {
      const boss = G.enemies.find((en) => en.isBoss && !en.showcaseGhost), ui = document.getElementById("bossui");
      ui.classList.toggle("show", !!boss);
      ui.classList.toggle("phase", !!boss && boss.bossState === "phase");
      if (boss) {
        const placement = hooks5.getBossHudPlacement?.(boss);
        if (placement) {
          ui.style.setProperty("--boss-hud-x", placement.x + "px");
          ui.style.setProperty("--boss-hud-y", placement.y + "px");
          ui.style.setProperty("--boss-hud-width", placement.width + "px");
        }
        document.getElementById("bossfill").style.width = Math.max(0, boss.hp / boss.max * 100).toFixed(2) + "%";
        document.getElementById("bossphase").textContent = "墨軀盤卷";
      }
    }
    if (hooks5.isDpsOpen?.()) hooks5.renderDps?.();
  }
  var levelChoiceLocked = false;
  var levelRerolls = 2;
  var startingFormationOpen = false;
  var truthSelectionOpen = false;
  var CARD_CATEGORY_NAME = { form: "陣", momentum: "行", intent: "痕", cultivation: "稟", blade: "型", truth: "意" };
  var CARD_RANK_CN = ["", "一", "二", "三", "四", "五"];
  function levelChoiceOpen() {
    return document.getElementById("overlay").classList.contains("show");
  }
  function resetLevelChoice() {
    levelChoiceLocked = false;
    startingFormationOpen = false;
    document.getElementById("cardbox")?.classList.remove("formation-draft", "compact-draft", "truth-draft");
    document.getElementById("overlay")?.classList.remove("show");
  }
  function renderReroll() {
    const button = document.getElementById("rerollbtn");
    button.disabled = levelRerolls <= 0 || levelChoiceLocked;
    document.getElementById("rerollleft").textContent = "剩餘次數：" + num2cn(levelRerolls);
  }
  function cardBody(item) {
    if (hooks5.getMeta?.().cardText !== "effect") return '<div class="cdesc">' + item.description + "</div>";
    const lines = hooks5.getRuntime?.().effectLines(item.id);
    if (!lines.length) return '<div class="cdesc">' + item.description + "</div>";
    return '<div class="cfx n' + lines.length + '">' + lines.map((text) => "<span>" + text + "</span>").join("") + "</div>";
  }
  function cardOfferedRank(item) {
    const runState = hooks5.getRunState?.();
    const current = Math.max(0, Math.min(5, runState.ranks[item.id] || 0));
    return CARD_RANK_CN[Math.min(item.maxRank || 1, current + 1)] + "階";
  }
  function cardDisplayName(item) {
    const name = String(item.name || "劍訣");
    return item.category === "form" ? name.replace(/式$/, "陣") : name;
  }
  function drawCards(isReroll = false) {
    if (!G.running) return;
    if (!isReroll) levelRerolls = 2;
    levelChoiceLocked = false;
    hooks5.resetSwordDrawing?.();
    const runtime = hooks5.getRuntime?.(), runState = hooks5.getRunState?.();
    if (!runState.activeForm) {
      drawStartingFormations();
      return;
    }
    startingFormationOpen = false;
    document.getElementById("cardbox")?.classList.remove("formation-draft", "compact-draft", "truth-draft");
    document.querySelector("#cardbox h2").textContent = "悟 · 選一道劍訣";
    document.querySelector("#cardbox p.tip").textContent = "道行精進，天地賜法。點選一張以承其力。";
    document.getElementById("rerollbtn").hidden = false;
    document.getElementById("rerollleft").hidden = false;
    const choices = runtime.rollInsights(runState, 3);
    const box = document.getElementById("cards");
    box.innerHTML = "";
    if (!choices.length) {
      G.pendingLevels = 0;
      document.getElementById("overlay").classList.remove("show");
      levelChoiceLocked = false;
      G.paused = pausedByUser;
      return;
    }
    choices.forEach((item) => {
      const displayName = cardDisplayName(item);
      const displayRune = Array.from(displayName)[0] || "劍";
      const element = document.createElement("div");
      element.className = "card";
      const category = CARD_CATEGORY_NAME[item.category] || "訣";
      const offeredRank = cardOfferedRank(item);
      element.innerHTML = `<div class="cardcategory" aria-label="類別：${category}">${category}</div>
      <div class="cardrank" aria-label="選擇後為${offeredRank}">${offeredRank}</div>
      <div class="rune">${displayRune}</div>
      <div class="cname">${displayName}</div>
      ${cardBody(item)}`;
      element.onclick = () => selectInsightCard(item);
      box.appendChild(element);
    });
    const queue = document.getElementById("lvqueue");
    queue.textContent = G.pendingLevels > 1 ? "連升 " + num2cn(G.pendingLevels) + " 重 · 尚餘 " + num2cn(G.pendingLevels - 1) + " 次待選" : "";
    renderManaBill();
    renderReroll();
    document.getElementById("overlay").classList.add("show");
    applyBattleMode();
  }
  function drawTruthChoices() {
    const runtime = hooks5.getRuntime?.(), runState = hooks5.getRunState?.();
    if (!G.running || !runtime || !runState || runState.activeTruth) return false;
    const choices = runtime.getUnlockedTruths(runState);
    if (!choices.length) return false;
    truthSelectionOpen = true;
    levelChoiceLocked = false;
    hooks5.resetSwordDrawing?.();
    document.getElementById("cardbox")?.classList.remove("formation-draft");
    document.getElementById("cardbox")?.classList.add("compact-draft", "truth-draft");
    document.querySelector("#cardbox h2").textContent = "真意 · 選一式鎖定";
    document.querySelector("#cardbox p.tip").textContent = "劍陣五階，真意初成。本局選定後不可更換。";
    document.getElementById("rerollbtn").hidden = true;
    document.getElementById("rerollleft").hidden = true;
    document.getElementById("manabill").innerHTML = "<b>共通</b><span>消耗 200 劍意 · 冷卻 30 秒</span>";
    document.getElementById("lvqueue").textContent = "";
    const box = document.getElementById("cards");
    box.innerHTML = "";
    choices.forEach((item) => {
      const element = document.createElement("div");
      element.className = "card truth-card";
      element.innerHTML = `<div class="cardcategory">意</div>
      <div class="cname">${item.name}</div><div class="cdesc">${item.description}</div>
      <div class="ctrade">${item.active.duration ? "持續 " + item.active.duration + " 秒" : "瞬發"}</div>`;
      element.onclick = () => selectInsightCard(item);
      box.appendChild(element);
    });
    document.getElementById("overlay").classList.add("show");
    G.paused = true;
    return true;
  }
  function drawStartingFormations() {
    if (!G.running) return;
    const runtime = hooks5.getRuntime?.(), runState = hooks5.getRunState?.();
    if (!runtime || !runState || runState.activeForm) return;
    startingFormationOpen = true;
    levelChoiceLocked = false;
    levelRerolls = 0;
    hooks5.resetSwordDrawing?.();
    const cardbox = document.getElementById("cardbox");
    cardbox.classList.add("formation-draft", "compact-draft");
    cardbox.querySelector("h2").textContent = "定 · 選一座劍陣";
    cardbox.querySelector("p.tip").textContent = "此陣將鎖定本局，選定後不可更換。";
    const box = document.getElementById("cards");
    box.innerHTML = "";
    runtime.getStartingFormations().forEach((item) => {
      const displayName = cardDisplayName(item), displayRune = Array.from(displayName)[0] || "陣";
      const element = document.createElement("div");
      element.className = "card";
      element.innerHTML = `<div class="cardcategory" aria-label="類別：陣">陣</div>
      <div class="cardrank" aria-label="選擇後為一階">一階</div>
      <div class="rune">${displayRune}</div><div class="cname">${displayName}</div>${cardBody(item)}`;
      element.onclick = () => selectInsightCard(item);
      box.appendChild(element);
    });
    document.getElementById("lvqueue").textContent = "四陣擇一 · 必選";
    document.getElementById("manabill").innerHTML = "";
    renderReroll();
    document.getElementById("rerollbtn").hidden = true;
    document.getElementById("rerollleft").hidden = true;
    document.getElementById("overlay").classList.add("show");
    G.paused = true;
  }
  function selectInsightCard(item) {
    if (levelChoiceLocked || !G.running) return;
    levelChoiceLocked = true;
    hooks5.playPick?.();
    const runtime = hooks5.getRuntime?.(), runState = hooks5.getRunState?.();
    const rankBefore = runState.ranks[item.id] || 0;
    if (startingFormationOpen) runtime.chooseStartingFormation(runState, item.id);
    else if (truthSelectionOpen) runtime.chooseActiveTruth(runState, item.id);
    else runtime.applyInsight(runState, item.id);
    hooks5.syncStat?.();
    if (item.category === "form") {
      runtime.recomputeForFormation(runState);
      hooks5.syncStat?.();
    }
    if (item.effects.some((effect) => effect.op === "max" && effect.path === "stats.mana")) {
      G.mana = stat.manaMax;
      hooks5.floatText?.(G.player.x, G.player.y - 38, "劍意盈滿", "#4aa0b8");
    }
    if (item.maxRank > 1 && rankBefore + 1 >= item.maxRank && item.tiers && item.tiers.length) {
      G.banner = { txt: item.name + " 滿階", life: 1 };
      hooks5.floatText?.(G.player.x, G.player.y - 56, item.name + " 滿階", "#c08a2e");
    }
    if (truthSelectionOpen) {
      truthSelectionOpen = false;
      document.getElementById("overlay").classList.remove("show");
      levelChoiceLocked = false;
      G.banner = { txt: "真意 · " + item.name, life: 1 };
      hooks5.onTruthChosen?.(item);
      if (G.pendingLevels > 0 && G.running) drawCards();
      else G.paused = pausedByUser;
    } else if (startingFormationOpen) {
      startingFormationOpen = false;
      document.getElementById("cardbox").classList.remove("formation-draft", "compact-draft", "truth-draft");
      document.getElementById("overlay").classList.remove("show");
      levelChoiceLocked = false;
      hooks5.onFormationChosen?.(item);
    } else closeLevelUp();
  }
  function applyBattleMode() {
    if (!levelChoiceOpen()) return;
    G.paused = hooks5.getMeta?.().battleMode === "wait" || pausedByUser;
    if (G.paused) G.shake = 0;
  }
  function rerollCards() {
    if (!G.running || levelChoiceLocked || levelRerolls <= 0 || !levelChoiceOpen()) return;
    levelRerolls--;
    hooks5.playUI?.();
    drawCards(true);
  }
  function closeLevelUp() {
    if (G.pendingLevels > 0) G.pendingLevels--;
    if (drawTruthChoices()) return;
    if (G.pendingLevels > 0 && G.running) {
      drawCards();
      return;
    }
    document.getElementById("overlay").classList.remove("show");
    levelChoiceLocked = false;
    G.paused = pausedByUser;
  }
  function tryLevelUp() {
    if (!G.running || G.pendingLevels <= 0 || pausedByUser || levelChoiceOpen()) return;
    drawCards();
  }
  function isPausedByUser() {
    return pausedByUser;
  }
  function resetPauseState() {
    pausedByUser = false;
    document.getElementById("pause")?.classList.remove("show");
  }
  function togglePause(force) {
    if (!G.running || levelChoiceOpen()) return;
    const paused = typeof force === "boolean" ? force : !pausedByUser;
    pausedByUser = paused;
    G.paused = paused;
    hooks5.playUI?.();
    if (paused) {
      G.shake = 0;
      G.flash = 0;
      G.hitstop = 0;
      hooks5.stopMusic?.(0.25);
    } else hooks5.startMusic?.();
    document.getElementById("pause").classList.toggle("show", paused);
    if (paused) {
      renderVolumeSettings();
      renderSettingsSegments();
      hooks5.renderHeroChoices?.();
      hooks5.renderTierList?.();
      hooks5.resetRespec?.();
      hooks5.renderRespec?.();
    } else tryLevelUp();
  }
  function renderVolumeSettings() {
    const meta = hooks5.getMeta?.();
    for (const [id, key] of VOLUME_CONTROLS) {
      const input = document.getElementById(id);
      if (!input) continue;
      const value = Math.round(meta.vol[key] * 100);
      input.value = value;
      document.getElementById(id + "V").textContent = value;
      input.disabled = meta.mute;
    }
    const muteButton = document.getElementById("muteBtn");
    if (muteButton) {
      muteButton.textContent = "靜 音:" + (meta.mute ? "開" : "關");
      muteButton.classList.toggle("on", meta.mute);
    }
    const controls = document.getElementById("audioControls");
    if (controls) controls.style.opacity = meta.mute ? 0.55 : 1;
  }
  function previewMusic() {
    if (hooks5.getMeta?.().mute) return;
    hooks5.unlockAudio?.();
    hooks5.startMusic?.();
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      if (!G.running || G.paused) hooks5.stopMusic?.(0.6);
    }, 1600);
  }
  function bindVolumeSettings() {
    const meta = hooks5.getMeta?.();
    for (const [id, key] of VOLUME_CONTROLS) {
      const input = document.getElementById(id);
      if (!input) continue;
      input.addEventListener("input", () => {
        hooks5.unlockAudio?.();
        meta.vol[key] = Math.max(0, Math.min(1, (+input.value || 0) / 100));
        document.getElementById(id + "V").textContent = Math.round(meta.vol[key] * 100);
        hooks5.applyVolume?.();
        if (key !== "sfx") previewMusic();
      });
      input.addEventListener("change", () => {
        hooks5.saveMeta?.();
        if (key !== "music" && !meta.mute) hooks5.playUI?.();
      });
    }
    const muteButton = document.getElementById("muteBtn");
    if (muteButton) muteButton.onclick = toggleSound;
  }
  function toggleSound() {
    const meta = hooks5.getMeta?.();
    meta.mute = !meta.mute;
    hooks5.saveMeta?.();
    hooks5.setSoundEnabled?.(!meta.mute);
    if (!meta.mute) {
      hooks5.unlockAudio?.();
      if (G.running) hooks5.startMusic?.();
      hooks5.playUI?.();
    } else hooks5.applyVolume?.();
    renderSoundButton();
    renderVolumeSettings();
  }
  function renderSoundButton() {
    const button = document.getElementById("sndbtn");
    if (!button) return;
    const muted = hooks5.getMeta?.().mute;
    button.textContent = "♪ 音律:" + (muted ? "關" : "開");
    button.classList.toggle("off", muted);
  }
  function renderSettingsSegments() {
    const meta = hooks5.getMeta?.();
    const groups = [
      ["#shakerow .seg", "shake", meta.shake],
      ["#qualrow .seg", "qual", meta.quality],
      ["#fpsrow .seg", "fps", meta.fps | 0],
      ["#cardtextrow .seg", "cardtext", meta.cardText],
      ["#bmoderow .seg", "bmode", meta.battleMode]
    ];
    groups.forEach(([selector, key, value]) => document.querySelectorAll(selector).forEach((element) => element.classList.toggle("on", key === "fps" ? +element.dataset[key] === value : element.dataset[key] === value)));
    const hint = document.getElementById("bmodehint");
    if (hint) hint.textContent = meta.battleMode === "wait" ? "三選一時世界靜止,可以慢慢看。" : "三選一時墨獸照樣進逼,但你畫不了劍令。";
  }
  function bindSettingGroup(selector, onSelect) {
    document.querySelectorAll(selector).forEach((element) => {
      element.onclick = () => {
        onSelect(element);
        hooks5.saveMeta?.();
        renderSettingsSegments();
        if (!hooks5.getMeta?.().mute) hooks5.playUI?.();
      };
    });
  }
  function bindSettingsSegments() {
    const meta = hooks5.getMeta?.();
    bindSettingGroup("#shakerow .seg", (element) => {
      meta.shake = element.dataset.shake;
      if (meta.shake === "n") G.shake = 0;
    });
    bindSettingGroup("#qualrow .seg", (element) => {
      meta.quality = element.dataset.qual;
      hooks5.applyQuality?.();
    });
    bindSettingGroup("#fpsrow .seg", (element) => {
      meta.fps = +element.dataset.fps;
      hooks5.resetRenderAccumulator?.();
    });
    bindSettingGroup("#bmoderow .seg", (element) => {
      meta.battleMode = element.dataset.bmode;
      applyBattleMode();
    });
    bindSettingGroup("#cardtextrow .seg", (element) => {
      meta.cardText = element.dataset.cardtext;
      if (levelChoiceOpen() && !levelChoiceLocked) drawCards(true);
    });
    renderSettingsSegments();
  }
  function bindPauseTabs() {
    document.querySelectorAll("#pausetabs .tab").forEach((tab) => {
      tab.onclick = () => {
        const pane = tab.dataset.pane;
        document.querySelectorAll("#pausetabs .tab").forEach((item) => item.classList.toggle("on", item === tab));
        document.querySelectorAll("#pausepanel .pane").forEach((item) => item.classList.toggle("on", item.dataset.pane === pane));
        const panel = document.getElementById("pausepanel");
        if (panel) panel.scrollTop = 0;
        if (pane === "run") hooks5.renderTierList?.();
        if (!hooks5.getMeta?.().mute) hooks5.playUIMove?.();
      };
    });
  }
  function rebirthView() {
    return hooks5.getRebirthView?.() || [];
  }
  function rebirthRequirementText(node) {
    const byId = hooks5.getRebirthById?.() || {};
    return (node.requires || []).map((requirement) => {
      const [id, rankText] = String(requirement).split(":"), definition = byId[id];
      const rank = Number(rankText || 1);
      return (definition ? definition.name : id) + (rank > 1 ? " " + rank + " 階" : "");
    }).join("、");
  }
  function metaBonusText() {
    const purchased = rebirthView().filter((item) => item.rank > 0).map((item) => item.maxRank > 1 ? item.name + " " + item.rank + "/" + item.maxRank : item.name.replace(/^.*·\s*/, ""));
    return purchased.length ? purchased.join("、") : "尚無 — 快去凝聚第一縷修為";
  }
  function createRebirthRow(item) {
    const maxed = item.rank >= item.maxRank;
    const cost = item.purchase.cost != null ? item.purchase.cost : item.costs[Math.min(item.rank, item.costs.length - 1)];
    const blocked = !maxed && item.purchase.reason === "requirements";
    const row = document.createElement("div");
    row.className = "mrow";
    row.innerHTML = '<div class="mi"><div class="mn">' + item.name + (item.maxRank > 1 ? '　<span class="ml">' + item.rank + "/" + item.maxRank + "</span>" : "") + '</div><div class="md">' + item.description + (blocked ? '<br><span style="color:#a2422b">需先:' + rebirthRequirementText(item) + "</span>" : "") + "</div></div>";
    const button = document.createElement("button");
    button.className = "mbuy";
    if (maxed) {
      button.textContent = item.maxRank > 1 ? "圓滿" : "已悟";
      button.classList.add("done");
      button.disabled = true;
    } else if (blocked) {
      button.textContent = "未達";
      button.disabled = true;
    } else {
      button.textContent = (item.rank > 0 ? "精進 · " : "參悟 · ") + cost;
      button.disabled = !item.purchase.ok;
      button.onclick = () => {
        if (hooks5.purchaseRebirth?.(item.id)) {
          hooks5.playUI?.();
          renderMeta();
        }
      };
    }
    row.appendChild(button);
    return row;
  }
  function renderMeta() {
    const meta = hooks5.getMeta?.();
    document.getElementById("metasouls").innerHTML = "墨魂　<b>" + meta.souls + "</b>" + ((meta.inkPills || 0) > 0 ? "　·　洗墨丹 <b>" + meta.inkPills + "</b>" : "");
    document.getElementById("metabonus").innerHTML = "承襲修為 · <b>" + metaBonusText() + "</b>";
    const offline = document.getElementById("metaoffline"), pending = hooks5.getOfflinePending?.() || 0, rate = hooks5.getOfflineRate?.() || 0;
    if (pending > 0) {
      offline.innerHTML = "閉關所得 " + pending + " 墨魂(每時 " + rate + "，封頂 " + meta.offCap + ' 時)<span class="claim" id="claimbtn">領取</span>';
      document.getElementById("claimbtn").onclick = () => {
        hooks5.claimOffline?.();
        renderMeta();
      };
    } else offline.innerHTML = '<span style="color:#8a7a5a">閉關修煉中 · 每時凝 ' + rate + " 墨魂(封頂 " + meta.offCap + " 時)</span>";
    const boxes = { foundation: document.getElementById("metalist"), mind: document.getElementById("metaunlock"), inheritance: document.getElementById("metainherit") };
    Object.values(boxes).forEach((box) => {
      if (box) box.innerHTML = "";
    });
    document.getElementById("mhead1").textContent = REBIRTH_BRANCH_HEAD.foundation;
    document.getElementById("mhead2").textContent = REBIRTH_BRANCH_HEAD.mind;
    document.getElementById("mhead3").textContent = REBIRTH_BRANCH_HEAD.inheritance;
    rebirthView().forEach((item) => (boxes[item.branch] || boxes.foundation).appendChild(createRebirthRow(item)));
  }
  function openMeta() {
    renderMeta();
    document.getElementById("meta").classList.add("show");
  }
  function closeMeta() {
    document.getElementById("meta").classList.remove("show");
  }
  function resetRespecConfirmation() {
    respecArmed = false;
  }
  function renderRespec() {
    const state = hooks5.getRespecInfo?.(), runState = hooks5.getRunState?.();
    const button = document.getElementById("respecbtn"), info = document.getElementById("respecinfo");
    const ranks = G.running && runState ? Object.keys(runState.ranks || {}).length : 0;
    info.innerHTML = "本局已重塑 <b>" + state.times + "</b> 次 · 現有劍意 <b>" + ranks + "</b> 項<br>重塑代價:<b>" + state.pay + "</b>" + (state.ok ? '<br><span style="color:#8a7a5a">卸下本局所有劍意/劍式/真意,道行與波次不變。</span>' : '<br><span class="warn">' + state.why + "</span>");
    button.classList.toggle("off", !state.ok);
    button.classList.toggle("armed", respecArmed && state.ok);
    button.textContent = respecArmed && state.ok ? "確認重塑(再按一次)" : "重 塑";
  }
  function requestRespec() {
    const state = hooks5.getRespecInfo?.();
    if (!state.ok) {
      hooks5.playNoMana?.();
      return;
    }
    if (!respecArmed) {
      respecArmed = true;
      hooks5.playUI?.();
      renderRespec();
      return;
    }
    hooks5.performRespec?.(state);
    respecArmed = false;
    renderRespec();
  }
  function renderHeroChoices() {
    const selected = hooks5.getMeta?.().heroSkin;
    document.querySelectorAll("#herochoices [data-hero]").forEach((button) => {
      const active = button.dataset.hero === selected;
      button.classList.toggle("on", active);
      button.setAttribute("aria-checked", String(active));
    });
  }
  function setHeroSkin(skin) {
    if (!["m", "f", "x"].includes(skin)) return;
    const meta = hooks5.getMeta?.();
    if (!meta) return;
    meta.heroSkin = skin;
    hooks5.saveMeta?.();
    hooks5.playUI?.();
    renderHeroChoices();
  }
  function bindHeroChoices() {
    document.querySelectorAll("#herochoices [data-hero]").forEach((button) => button.onclick = () => setHeroSkin(button.dataset.hero));
  }
  function renderShop() {
    const meta = hooks5.getMeta?.(), catalog = hooks5.getShopCatalog?.() || { iap: [], spend: [] };
    document.getElementById("shopgems").innerHTML = "靈石　<b>" + meta.gems + "</b>　·　墨魂 " + meta.souls + ((meta.inkPills || 0) > 0 ? "　·　洗墨丹 " + meta.inkPills : "");
    const iap = document.getElementById("shopiap");
    iap.innerHTML = "";
    catalog.iap.forEach((item) => iap.appendChild(createShopRow(item, "iap")));
    const spend = document.getElementById("shopspend");
    spend.innerHTML = "";
    catalog.spend.forEach((item) => spend.appendChild(createShopRow(item, "spend")));
  }
  function createShopRow(item, type) {
    const meta = hooks5.getMeta?.(), row = document.createElement("div");
    row.className = "mrow";
    const owned = type === "spend" && item.once && meta.skin === "gold" && item.id === "skin";
    const description = type === "iap" ? item.note || "獲得靈石 ×" + item.gems : item.capField ? "離線收益封頂提高(現 " + meta.offCap + " 時)" : item.pillField ? item.desc + "(存 " + (meta.inkPills || 0) + " 顆)" : item.desc;
    row.innerHTML = '<div class="mi"><div class="mn">' + item.name + (item.tag ? '<span class="mtag">' + item.tag + "</span>" : "") + '</div><div class="md">' + description + "</div></div>";
    const button = document.createElement("button");
    button.className = "mbuy";
    if (owned) {
      button.textContent = "已擁有";
      button.classList.add("done");
      button.disabled = true;
    } else {
      button.textContent = type === "iap" ? item.price + " · 購買" : "靈石 " + item.cost;
      button.disabled = type === "spend" && meta.gems < item.cost;
      button.onclick = () => {
        if (hooks5.purchaseShopItem?.(type, item)) renderShop();
      };
    }
    row.appendChild(button);
    return row;
  }
  function openShop() {
    renderShop();
    document.getElementById("shop").classList.add("show");
  }
  function closeShop() {
    document.getElementById("shop").classList.remove("show");
  }
  function renderTierList() {
    const box = document.getElementById("tierlist"), runState = hooks5.getRunState?.();
    if (!box) return;
    if (!runState) {
      box.innerHTML = "";
      return;
    }
    const runtime = hooks5.getRuntime?.(), view = runtime.getTierView(runState);
    if (!view.length) {
      box.innerHTML = '<div class="tempty">尚無滿階劍訣。<br>同一道劍訣領悟至滿階後,便開始累計本局斬妖數,<br>依序臻至 小成 · 大成 · 圓滿。</div>';
      return;
    }
    const names = ["小成", "大成", "圓滿"], escape = (text) => String(text).replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);
    box.innerHTML = view.map((item) => {
      const rows = names.map((name, index) => {
        const tier = item.tiers?.[index], lines = runtime.tierLines(item.id, index), reached = item.level > index;
        const text = lines.length ? lines.join("、") : (tier?.description || "").replace(/。$/, "");
        return '<div class="tline' + (reached ? " on" : "") + '"><b>' + name + "</b><span>" + escape(text) + "</span><em>" + (reached ? "已臻" : tier ? tier.kills + " 斬" : "") + "</em></div>";
      }).join("");
      if (!item.nextName) return '<div class="trow"><div class="tname">' + item.rune + " " + item.name + ' <i class="tdone">圓滿</i></div><div class="tsub">本局已斬 ' + item.kills + " 頭</div>" + rows + "</div>";
      const previous = item.level > 0 ? item.tiers[item.level - 1].kills : 0, percent = Math.max(0, Math.min(100, (item.kills - previous) / (item.nextAt - previous) * 100));
      return '<div class="trow"><div class="tname">' + item.rune + " " + item.name + " <i>" + (item.tierName ? "已臻 " + item.tierName : "累計中") + '</i></div><div class="tbar"><i style="width:' + percent.toFixed(1) + '%"></i></div><div class="tsub">' + item.kills + " / " + item.nextAt + " 斬 · 下一層 " + item.nextName + "</div>" + rows + "</div>";
    }).join("");
  }
  function enableDragScroll(id) {
    const panel = document.getElementById(id);
    if (!panel) return;
    const skip = "input,button,.setbtn,.seg,.btn,label,.mbuy,.tab,.card,.claim";
    let active = false, startY = 0, startTop = 0, moved = 0;
    panel.addEventListener("pointerdown", (event) => {
      if (event.target.closest?.(skip)) return;
      active = true;
      moved = 0;
      startY = event.clientY;
      startTop = panel.scrollTop;
      panel.setPointerCapture?.(event.pointerId);
    });
    window.addEventListener("pointermove", (event) => {
      if (!active) return;
      const delta = event.clientY - startY;
      moved = Math.max(moved, Math.abs(delta));
      panel.scrollTop = startTop - delta;
      if (moved > 4 && event.cancelable) event.preventDefault();
    }, { passive: false });
    const end = (event) => {
      if (!active) return;
      active = false;
      try {
        panel.releasePointerCapture?.(event.pointerId);
      } catch (_) {
      }
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  // src/boot.js
  var LOGIC_MS = 1e3 / 60;
  var hooks6 = {};
  var idleFrame = 0;
  var perfBuf = [];
  var perfBad = 0;
  var perfStart = 0;
  var logicAcc = 0;
  var renderAcc = 0;
  var lastFrameTs = 0;
  function configureBoot(nextHooks) {
    hooks6 = nextHooks || {};
  }
  function resetBootClock(now = performance.now()) {
    logicAcc = 0;
    renderAcc = 0;
    lastFrameTs = now;
  }
  function watchPerf(ts) {
    if (!perfStart) {
      perfStart = ts;
      return;
    }
    if (ts - perfStart < 2e3) return;
    perfBuf.push(ts);
    if (perfBuf.length < 91) return;
    const d = [];
    for (let i = 1; i < perfBuf.length; i++) d.push(perfBuf[i] - perfBuf[i - 1]);
    perfBuf.length = 0;
    d.sort((a, b) => a - b);
    const med = d[d.length >> 1];
    if (med > 22) {
      if (++perfBad >= 2) {
        if (DPR > 1) {
          setDPR(Math.max(1, +(DPR - 0.5).toFixed(2)));
          cv.width = W * DPR;
          cv.height = H * DPR;
          ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        } else {
          hooks6.degradeQuality?.();
        }
        perfBad = 0;
      }
    } else perfBad = 0;
  }
  function gameLoop(ts) {
    try {
      ts = ts || performance.now();
      hooks6.diagFrame?.(ts);
      const dt = Math.min(200, lastFrameTs ? ts - lastFrameTs : LOGIC_MS);
      lastFrameTs = ts;
      if (G.running) {
        watchPerf(ts);
        const diag = hooks6.getDiag?.();
        const measuring = diag?.on ? performance.now() : 0;
        if (!G.paused) {
          logicAcc += dt;
          let steps = 0;
          while (logicAcc >= LOGIC_MS && steps < 4) {
            if (G.hitstop > 0) G.hitstop--;
            else hooks6.update?.();
            logicAcc -= LOGIC_MS;
            steps++;
          }
          if (steps === 4 && logicAcc >= LOGIC_MS) logicAcc %= LOGIC_MS;
          const afterUpdate = diag?.on ? performance.now() : 0;
          let paint = true;
          const cap = (hooks6.getFps?.() || 0) | 0;
          if (cap > 0) {
            const iv = 1e3 / cap;
            renderAcc += dt;
            if (renderAcc >= iv) renderAcc %= iv;
            else paint = false;
          }
          if (paint && !hooks6.isNoDraw?.()) hooks6.draw?.();
          if (diag?.on) {
            diag.upd = diag.upd * 0.9 + (afterUpdate - measuring) * 0.1;
            diag.drw = diag.drw * 0.9 + (performance.now() - afterUpdate) * 0.1;
          }
        } else if ((idleFrame++ & 3) === 0 && !hooks6.isNoDraw?.()) hooks6.draw?.();
      }
    } catch (error) {
      hooks6.onLoopError?.(error);
    } finally {
      requestAnimationFrame(gameLoop);
    }
  }
  function bindClick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.onclick = handler;
  }
  function bindBootEvents(actions) {
    document.addEventListener("pointerdown", (e) => {
      const b = e.target.closest && e.target.closest(".btn");
      if (b) actions.inkSplashAt?.(e.clientX, e.clientY);
    }, true);
    for (const [id, handler] of Object.entries(actions.clicks || {})) bindClick(id, handler);
    if (actions.stamp) {
      window.addEventListener("beforeunload", actions.stamp);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) actions.stamp();
      });
    }
    if (actions.canvas) {
      const { down, move, up, cancel } = actions.canvas;
      const finish = (event, commit) => {
        (commit ? up : cancel)?.(event);
        try {
          if (cv.hasPointerCapture?.(event.pointerId)) cv.releasePointerCapture(event.pointerId);
        } catch (_) {
        }
      };
      cv.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        try {
          cv.setPointerCapture?.(event.pointerId);
        } catch (_) {
        }
        down(event);
      }, { passive: false });
      cv.addEventListener("pointermove", move, { passive: false });
      cv.addEventListener("pointerup", (event) => finish(event, true), { passive: false });
      cv.addEventListener("pointercancel", (event) => finish(event, false), { passive: false });
      cv.addEventListener("lostpointercapture", cancel, { passive: false });
      window.addEventListener("blur", cancel);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) cancel?.();
      });
    }
    if (actions.menuGesture) {
      const events = ["pointerdown", "keydown", "touchstart"];
      const onGesture = () => {
        if (actions.menuGesture()) events.forEach((ev) => window.removeEventListener(ev, onGesture));
      };
      events.forEach((ev) => window.addEventListener(ev, onGesture, { passive: true }));
    }
    window.addEventListener("keydown", (e) => actions.keydown?.(e));
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      return false;
    });
    document.addEventListener("dragstart", (e) => e.preventDefault());
    document.addEventListener("selectstart", (e) => {
      if (!/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) e.preventDefault();
    });
  }
  function startBoot() {
    requestAnimationFrame(gameLoop);
  }

  // src/assets/asset-loader.js
  var AssetLoader = class {
    constructor() {
      this.images = /* @__PURE__ */ new Map();
    }
    loadImage(url) {
      if (this.images.has(url)) return this.images.get(url);
      const record = { url, image: null, ready: false, error: null, promise: null };
      record.promise = new Promise((resolve) => {
        const image = new Image();
        record.image = image;
        image.onload = () => {
          record.ready = true;
          resolve(record);
        };
        image.onerror = () => {
          record.error = new Error("Unable to load " + url);
          resolve(record);
        };
        image.src = url;
      });
      this.images.set(url, record);
      return record;
    }
  };

  // src/assets/asset-registry.js
  var AssetRegistry = class {
    constructor(loader = new AssetLoader()) {
      this.loader = loader;
      this.actors = /* @__PURE__ */ new Map();
    }
    async loadActorManifest(url) {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) throw new Error("Unable to load actor manifest " + url + " (" + response.status + ")");
      return this.registerActor(await response.json());
    }
    registerActor(manifest) {
      const errors = validateActorManifest(manifest);
      if (errors.length) throw new Error("Invalid actor manifest: " + errors.join("; "));
      const runtime = { manifest, clips: {}, ready: false };
      for (const [action, clip] of Object.entries(manifest.animations)) {
        runtime.clips[action] = {};
        for (const [direction, layers] of Object.entries(clip.directions || {})) {
          runtime.clips[action][direction] = {};
          for (const [layer, desc] of Object.entries(layers)) {
            runtime.clips[action][direction][layer] = desc.files.map((file) => this.loader.loadImage(file));
          }
        }
      }
      runtime.ready = true;
      this.actors.set(manifest.actorId, runtime);
      return runtime;
    }
    getActor(id) {
      return this.actors.get(id) || null;
    }
    resolveFrameDirection(id, direction) {
      const actor = this.getActor(id);
      if (!actor) return null;
      return resolveAvailableDirection(direction, actor.manifest.authoredDirections, { allowFlipX: actor.manifest.mirrorX !== false });
    }
    getFrame(id, action, direction, layer, index) {
      const actor = this.getActor(id);
      if (!actor) return null;
      const mapped = this.resolveFrameDirection(id, direction);
      if (!mapped) return null;
      const clip = actor.clips[action] || actor.clips[actor.manifest.fallbacks?.[action]] || actor.clips.walk;
      const records = clip?.[mapped.direction]?.[layer];
      if (!records?.length) return null;
      const rec = records[index % records.length];
      return rec?.ready ? { image: rec.image, flipX: mapped.flipX } : null;
    }
  };
  function validateActorManifest(m) {
    const e = [];
    if (!m || m.schemaVersion !== 1) e.push("schemaVersion must be 1");
    if (!m?.actorId) e.push("actorId is required");
    const authored = m?.authoredDirections || [];
    if (!authored.length) e.push("authoredDirections requires at least one direction");
    for (const d of authored) if (!DIRECTIONS.includes(d)) e.push("invalid authored direction " + d);
    if (!m?.canvas?.width || !m?.canvas?.height || !m?.canvas?.footPivot) e.push("canvas and footPivot are required");
    if (!m?.animations?.walk) e.push("walk animation is required");
    for (const [action, clip] of Object.entries(m?.animations || {})) {
      for (const direction of Object.keys(clip.directions || {})) {
        if (!authored.includes(direction)) e.push(action + " contains undeclared direction " + direction);
      }
      for (const direction of authored) {
        if (!clip.directions?.[direction]) e.push(action + " missing authored direction " + direction);
      }
    }
    return e;
  }

  // src/main.js
  (function() {
    "use strict";
    let booted = false;
    let pendingFormationStart = null;
    const ACTOR_POC = new URLSearchParams(location.search).has("actorpoc");
    const TRUTH_POC = new URLSearchParams(location.search).get("truthpoc");
    const BLADE_POC = new URLSearchParams(location.search).get("bladepoc");
    const WAVE_POC = Number(new URLSearchParams(location.search).get("wavepoc")) || 0;
    let actorPocDiag = null;
    const assetRegistry = new AssetRegistry();
    assetRegistry.loadActorManifest("assets/actors/enemies/ink_blade/actor.manifest.json").then(() => {
      document.documentElement.dataset.inkBladeRenderer = "manifest";
    }).catch((error) => {
      document.documentElement.dataset.inkBladeRenderer = "fallback";
      console.warn("[Inkblade] ink blade manifest fallback:", error);
    });
    configureViewport({
      getQuality: () => meta.quality,
      getFX: () => FX,
      invalidatePaper: () => invalidatePaper(),
      isBooted: () => booted,
      alignHud: () => alignHud()
    });
    startViewport();
    configureUI({
      realmKillTarget: (wave) => realmKillTarget(wave),
      realmClockText: () => realmClockText(),
      realmTimeFrames: (wave) => realmTimeFrames(wave),
      bossTestAttackCountdown: (boss) => bossTestAttackCountdown(boss),
      getBossHudPlacement: (boss) => ({
        x: Math.max(W * 0.29, Math.min(W * 0.71, boss.bossHudAnchorX ?? boss.x)),
        y: Math.max(PLAY_TOP + 18, Math.min(H * 0.42, (boss.bossHudAnchorY ?? boss.y) - 64)),
        width: Math.min(330, W * 0.48)
      }),
      getBossStateLabel: (state) => BOSS_STATE_CN[state],
      isDpsOpen: () => DPS.open,
      renderDps: () => renderDps(),
      getMeta: () => meta,
      getRuntime: () => INK_CONFIG.runtime,
      getRunState: () => runState,
      resetSwordDrawing: () => {
        drawing = false;
        path = [];
        curLen = 0;
        maxed = false;
      },
      playPick: () => SND.pick(),
      playUI: () => SND.ui(),
      playUIMove: () => SND.uiMove(),
      syncStat: () => syncStat(),
      floatText: (...args) => floatText(...args),
      saveMeta: () => saveMeta(),
      unlockAudio: () => SND.unlock(),
      startMusic: () => SND.startMusic(),
      stopMusic: (fade) => SND.stopMusic(fade),
      applyVolume: () => SND.applyVol(),
      setSoundEnabled: (on) => SND.setOn(on),
      applyQuality: () => applyQuality(),
      resetRenderAccumulator: () => resetBootClock(),
      renderHeroChoices: () => renderHeroChoices(),
      renderTierList: () => renderTierList(),
      resetRespec: () => resetRespecConfirmation(),
      renderRespec: () => renderRespec(),
      getRebirthView: () => INK_CONFIG.runtime.getRebirthView(buildPermanentSave()),
      getRebirthById: () => INK_CONFIG.rebirthById,
      purchaseRebirth: (id) => {
        const result = INK_CONFIG.runtime.purchaseRebirth(buildPermanentSave(), id);
        if (!result.ok) return false;
        storePermanentSave(result.state);
        return true;
      },
      getOfflinePending: () => offlinePending(),
      getOfflineRate: () => offlineRate(),
      claimOffline: () => claimOffline(),
      getRespecInfo: () => respecInfo(),
      playNoMana: () => SND.nomana(),
      performRespec: (state) => doRespec(state),
      getShopCatalog: () => ({ iap: SHOP_IAP, spend: SHOP_SPEND }),
      purchaseShopItem: (type, item) => {
        if (type === "iap") {
          meta.gems += item.gems;
          if (item.id === "pass") meta.souls += 120;
          saveMeta();
          return true;
        }
        if (meta.gems < item.cost) return false;
        meta.gems -= item.cost;
        item.grant();
        saveMeta();
        return true;
      },
      onFormationChosen: () => {
        const resume = pendingFormationStart;
        pendingFormationStart = null;
        resume?.();
      },
      onTruthChosen: () => refreshTruthButton()
    });
    configureRender({
      getHeroAssets: () => ({ meta, HEROX, HEROF, HEROSPR, HERO, ART }),
      getFX: () => FX,
      getDrawLevel: () => DRAWLV,
      getEnemySprites: () => ENESPR,
      getBossFx: () => ENESPR.boss.p1.projectiles,
      getAssetRegistry: () => assetRegistry,
      onActorPocFrame: (info) => {
        actorPocDiag = info;
      },
      getDrawState: () => ({ drawing, path, curLen, meta, ELEM }),
      allowedLen: () => allowedLen(),
      getSwordSprite: () => SWDSPR,
      getBladeSword: () => BLADE_SWORDS[runState?.activeBlade] || null,
      getFlyingSword: () => FLYSWORD,
      getElement: (element) => ELEM[element] || ELEM.none,
      getTrailFx: () => TRAILFX,
      getEnemyTone: (species) => ENEMY_TONE[species],
      tintFrame: (...args) => tintFrame(...args)
    });
    configureCombat({
      floatText: (...args) => floatText(...args),
      burst: (...args) => burst(...args),
      playNoMana: () => SND.nomana(),
      playCast: (length) => SND.cast(length),
      dpsAdd: (...args) => dpsAdd(...args),
      getFX: () => FX,
      getElementHitColor: (element) => (ELEM[element] || ELEM.none).hit,
      mistDissolve: (...args) => mistDissolve(...args),
      whiteCut: (...args) => whiteCut(...args),
      splash: (...args) => splash(...args),
      shake: (...args) => shake(...args),
      hitstop: (frames) => hitstop(frames),
      dmgTo: (...args) => dmgTo(...args),
      applyIntent: (enemy) => applyIntent(enemy),
      pendDamage: (...args) => pendDamage(...args),
      ink: (...args) => ink(...args),
      playHit: () => SND.hit(),
      playBoom: () => SND.boom(),
      playCrit: () => SND.crit()
    });
    configureEnemy({
      floatText: (...args) => floatText(...args),
      playWave: () => SND.wave(),
      flash: (...args) => flash(...args),
      shake: (...args) => shake(...args),
      ink: (...args) => ink(...args),
      playHit: () => SND.hit(),
      playHurt: () => SND.hurt(),
      mistDissolve: (...args) => mistDissolve(...args),
      setIntensity: (value) => SND.intensity(value),
      stopMusic: (seconds) => SND.stopMusic(seconds),
      dmgTo: (...args) => dmgTo(...args),
      ensureEroV: (en) => ensureEroV(en),
      ensureSupV: (en) => ensureSupV(en),
      whiteCut: (...args) => whiteCut(...args),
      splash: (...args) => splash(...args),
      hitstop: (frames) => hitstop(frames),
      playKill: (tier) => SND.kill(tier),
      playLevel: () => SND.level(),
      dpsAdd: (...args) => dpsAdd(...args),
      getRunState: () => runState,
      syncStat: () => syncStat(),
      gainXP: (value) => gainXP(value),
      updateHUD: () => updateHUD(),
      beginDeath: () => beginDeath(),
      onFormationChosen: () => {
        const resume = pendingFormationStart;
        pendingFormationStart = null;
        resume?.();
      }
    });
    const ART = { body: new Image(), sword: new Image(), n: 0, ok: false };
    ["body", "sword"].forEach((k) => {
      ART[k].onload = () => {
        if (++ART.n === 2) ART.ok = true;
      };
      ART[k].onerror = () => {
        ART.ok = false;
      };
    });
    ART.body.src = "assets/art/hero-body.png";
    ART.sword.src = "assets/art/mo-jian.png";
    const HEROSPR = { idle: [], hurt: [], cast: [], death: [], ok: false, aspect: 0.9917, foot: 0.9906, n: 0, need: 26 };
    (function loadHero() {
      const add = (arr, src) => {
        const im = new Image();
        im.onload = () => {
          HEROSPR.aspect = im.naturalWidth / im.naturalHeight;
          if (++HEROSPR.n >= HEROSPR.need) HEROSPR.ok = true;
        };
        im.onerror = () => {
          HEROSPR.ok = false;
        };
        im.src = src;
        arr.push(im);
      };
      const pad = (i) => String(i).padStart(2, "0");
      for (let i = 1; i <= 9; i++) add(HEROSPR.idle, "assets/hero/HERO_idle_" + pad(i) + ".png");
      for (let i = 1; i <= 4; i++) add(HEROSPR.hurt, "assets/hero/HERO_hurt_" + pad(i) + ".png");
      for (let i = 1; i <= 6; i++) add(HEROSPR.cast, "assets/hero/HERO_cast_" + pad(i) + ".png");
      for (let i = 1; i <= 7; i++) add(HEROSPR.death, "assets/hero/HERO_death_" + pad(i) + ".png");
    })();
    const HEROF = {
      idle: [],
      cast: [],
      ok: false,
      proc: false,
      framesReady: false,
      aspect: 304 / 419,
      foot: 410 / 419,
      n: 0,
      need: 12,
      body: null,
      sword: null,
      swGrip: 0.2013,
      swAspect: 5.2
    };
    (function loadHeroF() {
      const body = new Image();
      body.onload = () => {
        HEROF.body = body;
        HEROF.aspect = body.naturalWidth / body.naturalHeight;
        HEROF.proc = true;
        HEROF.ok = true;
      };
      body.src = "assets/hero-f/HEROF_body.png";
      const sw = new Image();
      sw.onload = () => {
        HEROF.sword = sw;
        HEROF.swAspect = sw.naturalWidth / sw.naturalHeight;
      };
      sw.src = "assets/hero-f/HEROF_sword.png";
      const add = (arr, kind, i) => {
        const im = new Image();
        im.onload = () => {
          HEROF.aspect = im.naturalWidth / im.naturalHeight;
          if (++HEROF.n >= HEROF.need) HEROF.framesReady = true;
        };
        im.src = "assets/hero-f/generated/HEROF_GEN_" + kind + "_" + String(i).padStart(2, "0") + ".png";
        arr.push(im);
      };
      for (let i = 1; i <= 6; i++) add(HEROF.idle, "idle", i);
      for (let i = 1; i <= 6; i++) add(HEROF.cast, "cast", i);
    })();
    const HEROX = { idle: [], hurt: [], cast: [], death: [], ok: false, aspect: 0.586, foot: 0.982 };
    (function loadHeroX() {
      const im = new Image();
      im.onload = () => {
        HEROX.aspect = im.naturalWidth / im.naturalHeight;
        HEROX.ok = true;
      };
      im.onerror = () => {
        HEROX.ok = false;
      };
      im.src = "assets/references/female-cultivator-master-v2.png";
      HEROX.idle.push(im);
    })();
    const FLYSWORD = { image: new Image(), ok: false, aspect: 5.2, grip: 0.2013 };
    FLYSWORD.image.onload = () => {
      FLYSWORD.aspect = FLYSWORD.image.naturalWidth / FLYSWORD.image.naturalHeight;
      FLYSWORD.ok = true;
    };
    FLYSWORD.image.onerror = () => {
      FLYSWORD.ok = false;
    };
    FLYSWORD.image.src = "assets/sword/FLYING_SWORD_MASTER_v2.png";
    const BLADE_SWORDS = {
      cultivate_breadth: loadBladeSword("assets/sword/blade-types/FLYING_SWORD_WIDE_MASTER.png", 0.215, 1),
      cultivate_temper: loadBladeSword("assets/sword/blade-types/FLYING_SWORD_SHORT_MASTER.png", 0.39, 0.76),
      cultivate_edge: loadBladeSword("assets/sword/blade-types/FLYING_SWORD_LONG_MASTER.png", 0.23, 1.22)
    };
    function loadBladeSword(src, grip, lengthScale) {
      const sword = { image: new Image(), ok: false, aspect: 5, grip, lengthScale };
      sword.image.onload = () => {
        sword.aspect = sword.image.naturalWidth / sword.image.naturalHeight;
        sword.ok = true;
      };
      sword.image.onerror = () => {
        sword.ok = false;
      };
      sword.image.src = src;
      return sword;
    }
    const TRAILFX = { image: new Image(), ok: false, aspect: 2.15 };
    TRAILFX.image.onload = () => {
      TRAILFX.aspect = TRAILFX.image.naturalWidth / TRAILFX.image.naturalHeight;
      TRAILFX.ok = true;
    };
    TRAILFX.image.onerror = () => {
      TRAILFX.ok = false;
    };
    TRAILFX.image.src = "assets/vendor/opengameart/slash-effect/slash-desaturated.png";
    const SWDSPR = { idle: [], atk: [], ok: false, aspect: 2.504, grip: 0.22, blade: 0.645, n: 0, need: 14 };
    (function loadSword() {
      const add = (arr, src) => {
        const im = new Image();
        im.onload = () => {
          SWDSPR.aspect = im.naturalWidth / im.naturalHeight;
          if (im.decode) im.decode().catch(() => {
          });
          if (++SWDSPR.n >= SWDSPR.need) {
            SWDSPR.ok = true;
            warmSwordTint();
          }
        };
        im.onerror = () => {
          SWDSPR.ok = false;
        };
        im.src = src;
        arr.push(im);
      };
      const pad = (i) => String(i).padStart(2, "0");
      for (let i = 1; i <= 8; i++) add(SWDSPR.idle, "assets/sword/SWORD_idle_" + pad(i) + ".png");
      for (let i = 1; i <= 6; i++) add(SWDSPR.atk, "assets/sword/SWORD_atk_" + pad(i) + ".png");
    })();
    function warmSwordTint() {
      const run = () => {
        try {
          for (const im of SWDSPR.idle)
            if (im && im.complete && im.naturalWidth) tintFrame(im, "#a2422b");
        } catch (_) {
        }
      };
      if (typeof requestIdleCallback === "function") requestIdleCallback(run, { timeout: 3e3 });
      else setTimeout(run, 600);
    }
    const ENESPR = {
      inkling: { frames: [], ok: false },
      blade: { frames: [], ok: false },
      raven: { frames: [], attack: [], ok: false },
      fang: { frames: [], attack: [], ok: false },
      spider: { frames: [], attack: [], ok: false },
      boss: { frames: [], attack: [], dissolve: [], p1: { manifest: [], skill: [], hurt: [], projectiles: { heavyCore: [], ringWave: [] }, ok: false }, top: { idle: null, attack: [] }, bottom: { idle: null, attack: [] }, ok: false }
    };
    (function() {
      const srcs = {
        inkling: [
          "assets/enemies/ENE_INKLING_move_01.png",
          "assets/enemies/ENE_INKLING_move_02.png",
          "assets/enemies/ENE_INKLING_move_03.png",
          "assets/enemies/ENE_INKLING_move_04.png"
        ],
        blade: [
          "assets/enemies/ENE_BLADE_walk_01.png",
          "assets/enemies/ENE_BLADE_walk_02.png",
          "assets/enemies/ENE_BLADE_walk_03.png",
          "assets/enemies/ENE_BLADE_walk_04.png",
          "assets/enemies/ENE_BLADE_walk_05.png",
          "assets/enemies/ENE_BLADE_walk_06.png",
          "assets/enemies/ENE_BLADE_walk_07.png",
          "assets/enemies/ENE_BLADE_walk_08.png",
          "assets/enemies/ENE_BLADE_walk_09.png"
        ],
        raven: [
          "assets/enemies/generated/raven/ENE_INK_RAVEN_move_01.png",
          "assets/enemies/generated/raven/ENE_INK_RAVEN_move_02.png",
          "assets/enemies/generated/raven/ENE_INK_RAVEN_move_03.png",
          "assets/enemies/generated/raven/ENE_INK_RAVEN_move_04.png",
          "assets/enemies/generated/raven/ENE_INK_RAVEN_move_05.png",
          "assets/enemies/generated/raven/ENE_INK_RAVEN_move_06.png"
        ],
        fang: [
          "assets/enemies/generated/fang/ENE_INK_FANG_move_01.png",
          "assets/enemies/generated/fang/ENE_INK_FANG_move_02.png",
          "assets/enemies/generated/fang/ENE_INK_FANG_move_03.png",
          "assets/enemies/generated/fang/ENE_INK_FANG_move_04.png",
          "assets/enemies/generated/fang/ENE_INK_FANG_move_05.png",
          "assets/enemies/generated/fang/ENE_INK_FANG_move_06.png"
        ],
        spider: [
          "assets/enemies/elite/ENE_NETHER_SPIDER_walk_01.png",
          "assets/enemies/elite/ENE_NETHER_SPIDER_walk_02.png",
          "assets/enemies/elite/ENE_NETHER_SPIDER_walk_03.png",
          "assets/enemies/elite/ENE_NETHER_SPIDER_walk_04.png",
          "assets/enemies/elite/ENE_NETHER_SPIDER_walk_05.png",
          "assets/enemies/elite/ENE_NETHER_SPIDER_walk_06.png",
          "assets/enemies/elite/ENE_NETHER_SPIDER_walk_07.png",
          "assets/enemies/elite/ENE_NETHER_SPIDER_walk_08.png"
        ],
        // 第一章正式 Boss 母版：玄冥墨蛟。戰鬥動作與攻擊節奏見
        // docs/ch1-boss-xuanming-master.md；缺圖時仍回退程序化墨團。
        boss: ["assets/boss/BOSS_XUANMING_idle_01.png"]
      };
      for (const k in ENESPR) {
        const grp = ENESPR[k];
        srcs[k].forEach((s, i) => {
          const img = new Image();
          img.onload = () => {
            grp.frames[i] = img;
            grp.ok = grp.frames.filter(Boolean).length > 0;
          };
          img.onerror = () => {
          };
          img.src = s;
        });
      }
      for (let i = 1; i <= 6; i++) {
        const img = new Image();
        img.onload = () => {
          ENESPR.boss.attack[i - 1] = img;
        };
        img.src = "assets/boss/BOSS_XUANMING_lunge_" + String(i).padStart(2, "0") + ".png";
        const dis = new Image();
        dis.onload = () => {
          ENESPR.boss.dissolve[i - 1] = dis;
        };
        dis.src = "assets/boss/BOSS_XUANMING_dissolve_" + String(i).padStart(2, "0") + ".png";
      }
      for (let i = 1; i <= 6; i++) {
        const img = new Image();
        img.onload = () => {
          ENESPR.spider.attack[i - 1] = img;
        };
        img.src = "assets/enemies/elite/ENE_NETHER_SPIDER_attack_" + String(i).padStart(2, "0") + ".png";
      }
      for (let i = 1; i <= 4; i++) {
        const img = new Image();
        img.onload = () => {
          ENESPR.raven.attack[i - 1] = img;
        };
        img.src = "assets/enemies/generated/raven/ENE_INK_RAVEN_attack_" + String(i).padStart(2, "0") + ".png";
      }
      for (let i = 1; i <= 6; i++) {
        const img = new Image();
        img.onload = () => {
          ENESPR.fang.attack[i - 1] = img;
        };
        img.src = "assets/enemies/generated/fang/ENE_INK_FANG_attack_" + String(i).padStart(2, "0") + ".png";
      }
      for (const dir of ["top", "bottom"]) {
        const bounds = dir === "top" ? [[158, 90, 258, 330], [122, 101, 249, 338], [121, 99, 285, 315], [112, 85, 231, 343], [141, 85, 232, 325], [103, 89, 249, 339], [141, 94, 231, 316]] : [[107, 72, 297, 400], [82, 72, 347, 400], [89, 72, 334, 400], [92, 72, 327, 400], [74, 72, 364, 400], [98, 72, 315, 400], [82, 72, 347, 400]];
        const idle = new Image();
        idle.onload = () => {
          ENESPR.boss[dir].idle = idle;
        };
        idle._inkBounds = bounds[0];
        idle.src = dir === "bottom" ? "assets/boss/BOSS_XUANMING_bottom_idle_v2.png" : "assets/boss/BOSS_XUANMING_top_idle_01.png";
        for (let i = 1; i <= 6; i++) {
          const img = new Image();
          img.onload = () => {
            ENESPR.boss[dir].attack[i - 1] = img;
          };
          img._inkBounds = bounds[i];
          img.src = dir === "bottom" ? "assets/boss/BOSS_XUANMING_bottom_lunge_v2_" + String(i).padStart(2, "0") + ".png" : "assets/boss/BOSS_XUANMING_top_lunge_" + String(i).padStart(2, "0") + ".png";
        }
      }
    })();
    const HERO = {
      handX: 0.9652,
      handY: 0.5097,
      gripX: 0.279,
      gripY: 0.5,
      aspect: 417 / 620,
      swAspect: 45 / 520
    };
    booted = true;
    let meta = {
      souls: 0,
      best: { kills: 0, wave: 1, level: 1 },
      up: {},
      unlock: {},
      lastSeen: Date.now(),
      gems: 0,
      offCap: 8,
      skin: "none",
      mute: false,
      inkPills: 0,
      vol: { master: 0.85, music: 0.62, sfx: 0.75 }
    };
    window.getInkAudioSettings = () => meta.vol;
    function loadMeta() {
      try {
        const s = localStorage.getItem("inkjian_meta");
        if (s) {
          meta = Object.assign(meta, JSON.parse(s));
        }
      } catch (e) {
      }
      meta.up = meta.up || {};
      meta.unlock = meta.unlock || {};
      meta.best = meta.best || { kills: 0, wave: 1, level: 1 };
      meta.gems = meta.gems || 0;
      meta.offCap = meta.offCap || 8;
      meta.skin = meta.skin || "none";
      meta.mute = !!meta.mute;
      meta.heroSkin = ["m", "f", "x"].includes(meta.heroSkin) ? meta.heroSkin : "f";
      if (!["n", "s", "m", "l"].includes(meta.shake)) meta.shake = "m";
      if (!["low", "med", "high"].includes(meta.quality)) meta.quality = "high";
      if (![30, 60, 120, 0].includes(meta.fps)) meta.fps = 60;
      if (!["text", "effect"].includes(meta.cardText)) meta.cardText = "text";
      if (!["wait", "live"].includes(meta.battleMode)) meta.battleMode = "wait";
      meta.vol = Object.assign({ master: 0.85, music: 0.62, sfx: 0.75 }, meta.vol || {});
      for (const k of ["master", "music", "sfx"])
        meta.vol[k] = Math.max(0, Math.min(1, isFinite(meta.vol[k]) ? meta.vol[k] : 0.7));
      migrateMetaToRuntime();
    }
    function saveMeta() {
      try {
        localStorage.setItem("inkjian_meta", JSON.stringify(meta));
      } catch (e) {
      }
    }
    loadMeta();
    SND.setOn(!meta.mute);
    function stamp() {
      meta.lastSeen = Date.now();
      saveMeta();
    }
    function offlineRate() {
      return 5 + meta.best.wave * 2;
    }
    function offlinePending() {
      const hrs = Math.min(meta.offCap, Math.max(0, (Date.now() - (meta.lastSeen || Date.now())) / 36e5));
      return Math.floor(hrs * offlineRate());
    }
    function claimOffline() {
      const g = offlinePending();
      if (g > 0) {
        meta.souls += g;
      }
      meta.lastSeen = Date.now();
      saveMeta();
      return g;
    }
    const SHOP_IAP = [
      { id: "g100", name: "靈石 ×100", price: "NT$ 60", gems: 100 },
      { id: "g600", name: "靈石 ×600", price: "NT$ 330", gems: 600, tag: "超值" },
      { id: "pass", name: "修行月卡", price: "NT$ 170", gems: 300, note: "每日登入贈墨魂(示範:此處直接給等值靈石)" }
    ];
    const SHOP_SPEND = [
      { id: "souls", name: "墨魂補給 ×200", desc: "靈石兌換墨魂,加速轉世修為", cost: 50, repeat: true, grant: () => {
        meta.souls += 200;
      } },
      { id: "offcap", name: "閉關上限 +4 時", desc: "離線收益封頂提高(現 ", cost: 80, grant: () => {
        meta.offCap += 4;
      }, capField: true },
      { id: "skin", name: "外觀 · 墨金劍痕", desc: "預設墨痕染金芒(純外觀,不影響數值)", cost: 120, once: true, grant: () => {
        meta.skin = "gold";
      } },
      { id: "pill", name: "洗墨丹 ×1", desc: "重塑劍意時抵免墨魂耗費(局內暫停可用)", cost: 40, repeat: true, pillField: true, grant: () => {
        meta.inkPills = (meta.inkPills || 0) + 1;
      } }
    ];
    function Player() {
      const hp = stat && stat.hpMax || 100;
      this.x = W / 2;
      this.y = H / 2;
      this.r = 26;
      this.hp = hp;
      this.max = hp;
      this.pulse = 0;
    }
    function beginBossWave() {
      return beginXuanmingWave();
    }
    const BOSS_STATE_CN = { telegraph: "墨氣湧動", manifest: "墨形凝聚", orbit: "伏環蓄勢", guard: "盤鱗架劍", lunge: "近環吐核", evade: "游墨換位", dissolve: "墨散如煙", phase: "墨相蛻變", stagger: "破甲失衡" };
    function bossTestAttackCountdown(en) {
      if (!en) return 0;
      const left = {
        telegraph: Math.max(0, 34 - en.bossT) + 28 + 54 + 40,
        manifest: Math.max(0, 28 - en.bossT) + 54 + 40,
        orbit: Math.max(0, 54 - en.bossT) + 40,
        lunge: Math.max(0, 40 - en.bossT),
        dissolve: Math.max(0, 46 - en.bossT) + 34 + 28 + 54 + 40,
        phase: Math.max(0, 90 - en.bossT) + 34 + 28 + 54 + 40
      }[en.bossState] || 0;
      return Math.max(0, left / 60);
    }
    function ink(x, y, vx, vy, r) {
      const cap = qual().ink;
      if (cap <= 0) return;
      if (G.inks.length >= cap) G.inks.shift();
      G.inks.push({ x, y, vx, vy, r, a: 0.5, life: 1 });
    }
    function burst(x, y, c, n) {
      const cap = qual().part;
      if (cap <= 0) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28, s = 1 + Math.random() * 4;
        if (G.particles.length >= cap) G.particles.shift();
        G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c });
      }
    }
    function splash(x, y, c, power) {
      power = power || 1;
      const spikes = [], nSp = 5 + (Math.random() * 6 | 0);
      for (let i = 0; i < nSp; i++) spikes.push({ ang: Math.random() * 6.283, len: 0.8 + Math.random() * 1, w: 0.05 + Math.random() * 0.11, broken: Math.random() < 0.4 });
      const corners = [], nC = 12 + (Math.random() * 10 | 0);
      for (let i = 0; i < nC; i++) corners.push(0.6 + Math.random() * 0.55);
      G.splashes.push({ x, y, r: 16 + power * 10, dur: 28, age: 0, c, spikes, corners, rot: Math.random() * 6.283 });
      if (G.splashes.length > 16) G.splashes.shift();
      burst(x, y, c, 4 + (power * 3 | 0));
    }
    function mistDissolve(x, y, power, color) {
      power = power || 1;
      color = color || "48,45,41";
      const n = 4 + Math.min(4, Math.round(power * 2));
      for (let i = 0; i < n; i++) G.mists.push({
        x: x + (Math.random() - 0.5) * 18 * power,
        y: y + (Math.random() - 0.5) * 22 * power,
        vx: (Math.random() - 0.5) * 0.42,
        vy: -0.18 - Math.random() * 0.42,
        r: (12 + Math.random() * 18) * power,
        age: 0,
        dur: 30 + (Math.random() * 18 | 0),
        color,
        squash: 0.62 + Math.random() * 0.42
      });
      if (G.mists.length > 48) G.mists.splice(0, G.mists.length - 48);
    }
    const dmgAcc = /* @__PURE__ */ new Map();
    function pendDamage(en, dmg, crit) {
      const e = dmgAcc.get(en);
      if (e) {
        e.sum += dmg;
        e.crit = e.crit || crit;
      } else dmgAcc.set(en, { sum: dmg, crit: !!crit, x: en.x, y: en.y - en.r - 10 });
    }
    function flushDamage() {
      if (!dmgAcc.size) return;
      for (const [en, e] of dmgAcc)
        floatText(e.x, e.y, "-" + Math.round(e.sum), e.crit ? "#9f3028" : "#fffaf0", e.crit);
      dmgAcc.clear();
    }
    function floatText(x, y, txt, c, critFlag) {
      const raw = String(txt);
      const damage = /^-?\d/.test(raw) || /^-\d/.test(raw) || /^[-]?\d+!?$/.test(raw);
      const crit = damage && (critFlag === true || raw.includes("!"));
      let show = raw;
      if (damage) {
        const m = raw.match(/^(-?)(\d+)(!?)$/);
        if (m) show = num2cn(+m[2]) + (m[3] || "");
      }
      G.texts.push({
        x,
        y,
        txt: show,
        c,
        life: 1,
        age: 0,
        vy: damage ? -1.45 : -0.75,
        dx: damage ? (Math.random() - 0.5) * 0.32 : 0,
        damage,
        crit
      });
    }
    const SHAKE_MUL = { n: 0, s: 0.45, m: 1, l: 1.7 };
    function shakeMul() {
      return SHAKE_MUL[meta.shake] != null ? SHAKE_MUL[meta.shake] : 1;
    }
    function shake(v) {
      const k = shakeMul();
      if (k <= 0) {
        G.shake = 0;
        return;
      }
      G.shake = Math.min(22, G.shake + v * k);
    }
    function hitstop(f) {
      G.hitstop = Math.max(G.hitstop, f);
    }
    function flash(a, c) {
      G.flash = Math.max(G.flash, a);
      G.flashC = c || "255,255,255";
    }
    function stain(x, y, r, c) {
      if (!blots) buildBlots();
      if (G.stains.length > 70) G.stains.shift();
      G.stains.push({
        x,
        y,
        r: r * 1.6,
        rot: Math.random() * 6.283,
        im: blots[Math.random() * blots.length | 0],
        a: 0.2
      });
    }
    const RARW = window.INK_CONFIG.rarity.weight;
    const RARNAME = window.INK_CONFIG.rarity.name;
    let runState = null;
    function buildPermanentSave() {
      const unlocks = meta.unlock ? Object.keys(meta.unlock).filter((k) => meta.unlock[k]) : [];
      return INK_CONFIG.runtime.migratePermanentSave({
        insight: meta.souls || 0,
        ranks: Object.assign({}, meta.up || {}),
        permanentUnlocks: unlocks
      });
    }
    function storePermanentSave(p) {
      meta.souls = Math.max(0, Math.round(p.insight || 0));
      meta.up = Object.assign({}, p.ranks || {});
      meta.unlock = {};
      (p.permanentUnlocks || []).forEach((id) => {
        meta.unlock[id] = true;
      });
      saveMeta();
    }
    function migrateMetaToRuntime() {
      const RB = INK_CONFIG.rebirthById;
      const up2 = meta.up || {}, un = meta.unlock || {};
      Object.keys(un).forEach((id) => {
        if (un[id] && RB[id] && !up2[id]) up2[id] = 1;
      });
      const derived = {};
      Object.keys(up2).forEach((id) => {
        const node = RB[id];
        if (!node || !up2[id]) return;
        node.effects.forEach((e) => {
          if (e.op === "unlock" && e.path === "permanentUnlocks") derived[e.value] = true;
        });
      });
      meta.up = up2;
      meta.unlock = derived;
      if (typeof meta.inkPills !== "number") meta.inkPills = 0;
    }
    function syncStat() {
      if (!runState) return;
      const s = runState.stats, m = runState.mechanics;
      stat.count = s.swordCount;
      stat.damage = s.damage;
      stat.size = s.swordWidth;
      stat.speed = s.swordSpeed;
      stat.crit = s.critChance;
      stat.critMul = s.critMultiplier;
      stat.homing = m.homingStrength;
      stat.homingCanCrit = m.homingCanCrit !== false;
      stat.explode = m.splashRadius;
      stat.splashDamage = m.splashDamage;
      stat.ret = m.returnEnabled ? 1 : 0;
      stat.returnHits = m.returnHits;
      stat.slowBonus = m.slowBonus || 0;
      stat.anchorDur = m.anchorDuration || 0;
      stat.anchorDmgMul = m.anchorDamageMult || 0;
      const GW = INK_CONFIG.growth || { hpPerLevel: 0, manaPerLevel: 0 }, lvUp = Math.max(0, (G.level || 1) - 1);
      stat.hpMax = s.hpMax + lvUp * GW.hpPerLevel;
      stat.cap = s.swordCap;
      stat.manaMax = s.manaMax + lvUp * GW.manaPerLevel;
      stat.manaRegen = s.manaRegen;
      stat.regen = s.manaOnKill;
      stat.damage = s.damage + lvUp * (GW.damagePerLevel || 0);
      stat.armor = (s.swordArmor || 0) + lvUp * (GW.armorPerLevel || 0);
      const WM = INK_CONFIG.widthModel || { baseWidth: 18, armorPerWidth: 0, speedPerWidth: 0, minFlySpeed: 5 };
      const dW = (s.swordWidth || WM.baseWidth) - WM.baseWidth;
      stat.armor += dW > 0 ? dW * WM.armorPerWidth : dW * (WM.armorPerWidthThin != null ? WM.armorPerWidthThin : WM.armorPerWidth);
      stat.flySpeed = Math.max(WM.minFlySpeed, stat.speed - dW * WM.speedPerWidth);
      stat.formation = runState.formation && runState.formation !== "single" ? runState.formation : "fan";
      stat.element = "none";
      stat.ember = 0;
      stat.ice = 0;
      stat.costBase = s.manaCostBase;
      stat.costPerPx = s.manaCostPerPixel;
      const snap = INK_CONFIG.runtime.getCombatSnapshot(runState);
      stat.statuses = runState.statuses || {};
      stat.statusScale = snap.statusTimeScale || 1;
      stat.firstStrike = !!snap.crit.firstStrikeGuaranteed;
      stat.criticalEcho = !!snap.crit.criticalEcho;
      stat.whiteCut = !!snap.crit.whiteCutOnCrit;
      stat.splashOnKill = !!snap.globalFlags.splashOnKill;
      stat.returnDry = !!snap.returnBlade.leaveDryBrush;
      stat.returnDmgMul = snap.returnBlade.damageMultiplier || 1;
      stat.costPerPx = snap.mana.costPerPixelEffective || s.manaCostPerPixel;
      stat.hitPadding = m.hitPadding || 0;
      stat.manaRefund = m.manaRefund || 0;
      stat.splashChain = m.splashChain || 0;
      stat.tierFlags = runState.flags || {};
      stat.beadSlow = !!(runState.flags || {}).beadSlow;
    }
    function applyIntent(en) {
      const defs = stat.statuses;
      if (!defs) return;
      if (!en.st) en.st = {};
      for (const key in defs) {
        const cfg = defs[key];
        if (!cfg) continue;
        const rank = cfg.rank || 1;
        const maxS = cfg.maxStacks || 6;
        const cur = en.st[key] || (en.st[key] = { stk: 0, t: 0, acc: 0 });
        const before = cur.stk;
        cur.stk = Math.min(maxS, cur.stk + (cfg.stacks || 1) * rank);
        const full = Math.round((cfg.duration || 3) * 60 * (stat.statusScale || 1));
        const TFa = stat.tierFlags || {};
        if (key !== "erosion" || TFa.dotRefresh || cur.t <= 0) cur.t = full;
        else cur.t = Math.max(cur.t, Math.round(full * 0.35));
        if (key === "suppression") {
          if ((stat.tierFlags || {}).rootOnSuppress && cur.stk >= maxS && !(en.rootT > 0)) {
            en.rootT = 20;
            en.rootWC = !!(stat.tierFlags || {}).rootWhiteCut;
          }
          const V = ensureSupV(en);
          V.press = 14;
          V.maxS = maxS;
          if (before < maxS && cur.stk >= maxS) V.sink = 18;
        }
      }
    }
    function whiteCut(x, y, ang) {
      G.cuts.push({ x, y, ang, life: 1, len: 26 + Math.random() * 22 });
    }
    function gainXP(n) {
      G.xp += n;
      let gained = 0;
      while (G.xp >= G.xpNeed) {
        G.xp -= G.xpNeed;
        G.level++;
        G.xpNeed = Math.round(G.xpNeed * 1.16 + 4);
        G.pendingLevels++;
        gained++;
      }
      if (gained) {
        const GW = INK_CONFIG.growth || { hpPerLevel: 0, manaPerLevel: 0 };
        syncStat();
        if (G.player) {
          G.player.max = stat.hpMax;
          G.player.hp = Math.min(stat.hpMax, G.player.hp + gained * GW.hpPerLevel);
        }
        G.mana = Math.min(stat.manaMax, G.mana + gained * GW.manaPerLevel);
        updateHUD();
        SND.level();
        flash(0.2, "246,240,214");
        for (let k = 0; k < 14; k++) {
          const a = Math.random() * 6.283;
          ink(G.player.x, G.player.y, Math.cos(a) * 3.4, Math.sin(a) * 3.4, 10 + Math.random() * 12);
        }
        tryLevelUp();
      }
      updateHUD();
    }
    let drawing = false, path = [], curLen = 0, maxed = false;
    function pos(e) {
      const r = cv.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return {
        x: (p.clientX - r.left) * (cv.clientWidth / Math.max(1, r.width)),
        y: (p.clientY - r.top) * (cv.clientHeight / Math.max(1, r.height))
      };
    }
    function allowedLen() {
      let b = Math.max(0, G.mana - stat.costBase);
      if (b <= 0 && G.reserve > 0) b = Math.max(0, stat.manaMax - stat.costBase);
      return b / stat.costPerPx;
    }
    function down(e) {
      if (!G.running || G.paused || levelChoiceOpen()) return;
      e.preventDefault();
      drawing = true;
      path = [pos(e)];
      curLen = 0;
      maxed = false;
    }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      const p = pos(e);
      const last = path[path.length - 1];
      const seg = Math.hypot(p.x - last.x, p.y - last.y);
      if (seg > 4) {
        path.push(p);
        curLen += seg;
        maxed = leadInLen(path) + curLen > allowedLen();
      }
    }
    function up(e) {
      if (!drawing) return;
      e.preventDefault();
      drawing = false;
      launchCommand(path);
      path = [];
      curLen = 0;
      maxed = false;
    }
    function cancelDraw(e) {
      if (!drawing) return;
      if (e?.cancelable) e.preventDefault();
      drawing = false;
      path = [];
      curLen = 0;
      maxed = false;
    }
    const DPS = { win: 10, f: 0, cur: { d: 0, m: 0, k: 0 }, buckets: [], totD: 0, totM: 0, totK: 0, secs: 0, open: false };
    function dpsReset() {
      DPS.f = 0;
      DPS.cur = { d: 0, m: 0, k: 0 };
      DPS.buckets.length = 0;
      DPS.totD = 0;
      DPS.totM = 0;
      DPS.totK = 0;
      DPS.secs = 0;
    }
    function dpsAdd(k, v) {
      if (!(v > 0)) return;
      DPS.cur[k] += v;
      if (k === "d") DPS.totD += v;
      else if (k === "m") DPS.totM += v;
      else DPS.totK += v;
    }
    function dpsTick() {
      if (++DPS.f < 60) return;
      DPS.f = 0;
      DPS.secs++;
      DPS.buckets.push(DPS.cur);
      DPS.cur = { d: 0, m: 0, k: 0 };
      if (DPS.buckets.length > DPS.win) DPS.buckets.shift();
    }
    function dpsRate(k) {
      const n = DPS.buckets.length;
      if (!n) return null;
      let sum = 0;
      for (const b of DPS.buckets) sum += b[k];
      return sum / n;
    }
    function dpsAvg(k) {
      return DPS.secs > 0 ? (k === "d" ? DPS.totD : k === "m" ? DPS.totM : DPS.totK) / DPS.secs : 0;
    }
    function dmgTo(en, v) {
      if (v > 0) {
        const wc = en.st && en.st.whitecut;
        if (wc && wc.t > 0 && wc.stk > 0) {
          const cfg = stat.statuses && stat.statuses.whitecut;
          if (cfg && cfg.vuln) v *= 1 + cfg.vuln * wc.stk;
        }
        en.hp -= v;
        dpsAdd("d", v);
      }
    }
    let truthCooldown = 0, truthFx = null;
    function refreshTruthButton() {
      const b = document.getElementById("truthbtn");
      if (!b) return;
      const item = runState && runState.activeTruth && INK_CONFIG.insightById[runState.activeTruth];
      b.hidden = !item || !G.running;
      if (!item) return;
      const sec = Math.ceil(truthCooldown / 60);
      b.classList.toggle("cooling", truthCooldown > 0);
      b.querySelector("span").textContent = item.name;
      b.querySelector("small").textContent = truthCooldown > 0 ? sec + " 息" : "200 劍意";
    }
    function castActiveTruth() {
      if (!G.running || G.paused || !runState?.activeTruth || truthCooldown > 0) return;
      const item = INK_CONFIG.insightById[runState.activeTruth], cost = item.active.manaCost;
      if (G.mana < cost) {
        SND.nomana();
        return;
      }
      if (!TRUTH_POC) G.mana -= cost;
      truthCooldown = TRUTH_POC ? 0 : Math.round(item.active.cooldown * 60);
      const swordCount = Math.max(1, (stat.count | 0) + (G.reserve | 0));
      const authoredDuration = item.id === "truth_ten_thousand" ? 240 : item.id === "truth_single_stroke" ? 210 : Math.round((item.active.duration || 0.9) * 60);
      truthFx = { id: item.id, t: 0, dur: Math.max(54, authoredDuration), hits: /* @__PURE__ */ new WeakMap(), swordCount };
      SND.cast(Math.max(W, H));
      G.banner = { txt: "真意 · " + item.name, life: 1 };
      refreshTruthButton();
      updateHUD();
    }
    function updateActiveTruth() {
      if (truthCooldown > 0) truthCooldown--;
      if (!truthFx) {
        if (G.t % 30 === 0) refreshTruthButton();
        return;
      }
      const F = truthFx, P = G.player;
      F.t++;
      const progress = Math.min(1, F.t / F.dur), swords = F.swordCount || Math.max(1, stat.count | 0), base = stat.damage;
      const diagonal = Math.hypot(W, H), edgeRadius = diagonal * 0.56;
      for (const en of G.enemies) {
        if (en.dead || en.showcaseGhost) continue;
        let hit = false, dmg = base;
        if (F.id === "truth_ten_thousand") {
          const ring = Math.min(5, Math.floor(progress * 6)), ringRadius = ring / 5 * edgeRadius;
          hit = Math.abs(Math.hypot(en.x - P.x, en.y - P.y) - ringRadius) < 82;
        } else if (F.id === "truth_single_stroke") {
          const y = H + 260 - (H + 520) * progress;
          const passed = en.y >= y - 36, qiSpread = Math.min(W * 0.5, Math.max(0, F.t - 8) * 18);
          hit = Math.abs(en.x - W * 0.5) < 86 && Math.abs(en.y - y) < 190 || passed && Math.abs(en.x - W * 0.5) <= qiSpread;
          dmg = base * swords;
        } else if (F.id === "truth_return_hidden") {
          const phase = F.t % 120 / 120, radius = (phase < 0.5 ? phase * 2 : (1 - phase) * 2) * edgeRadius;
          const a = Math.atan2(en.y - P.y, en.x - P.x), slot = Math.round(a / (Math.PI * 2) * swords);
          const ray = slot * Math.PI * 2 / swords, lateral = Math.abs(Math.sin(a - ray) * Math.hypot(en.x - P.x, en.y - P.y));
          hit = Math.abs(Math.hypot(en.x - P.x, en.y - P.y) - radius) < 58 && lateral < 34;
        } else if (F.id === "truth_moon_return") {
          const radius = Math.min(W, H) * 0.27, bladeLength2 = 72;
          hit = Math.abs(Math.hypot(en.x - P.x, en.y - P.y) - (radius + bladeLength2 * 0.48)) < 52;
          dmg = base * Math.max(1, stat.flySpeed * swords / 14);
        }
        const last = F.hits.get(en) || -99;
        if (hit && F.t - last >= 10) {
          F.hits.set(en, F.t);
          dmgTo(en, dmg);
          applyIntent(en);
        }
      }
      if (F.t >= F.dur) {
        truthFx = null;
        if (TRUTH_POC) {
          truthCooldown = 0;
          G.mana = Math.max(G.mana, 400);
          refreshTruthButton();
        }
      }
      if (G.t % 15 === 0) refreshTruthButton();
    }
    function drawTruthFx() {
      if (!truthFx || !G.player || !FLYSWORD.image.complete) return;
      const F = truthFx, P = G.player, progress = Math.min(1, F.t / F.dur), im = FLYSWORD.image;
      const normalW = 44 + stat.size * 0.9, normalH = normalW / FLYSWORD.aspect * 2.2;
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      const sword = (x, y, a, scale = 1, alpha = 0.76) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.globalAlpha = alpha;
        ctx.drawImage(im, -normalW * FLYSWORD.grip * scale, -normalH * 0.5 * scale, normalW * scale, normalH * scale);
        ctx.restore();
      };
      if (F.id === "truth_ten_thousand") {
        const total = Math.max(72, (F.swordCount || stat.count) * 10), columns = 12;
        for (let i = 0; i < total; i++) {
          const row = Math.floor(i / columns), col = i % columns;
          const start2 = col % 3 * 0.018 + row * 0.052;
          const fall = Math.max(0, Math.min(1, (progress - start2) / 0.34));
          if (fall <= 0 || fall >= 1) continue;
          const lane = (col + 0.5) / columns, outerX = lane * W;
          const gather = 0.48 + 0.52 * (1 - fall);
          const x = P.x + (outerX - P.x) * gather + Math.sin(i * 2.17) * 10;
          const y = -normalW + (P.y + normalW * 1.2) * fall + row * 7;
          sword(x, y, Math.PI / 2, 1, 0.9);
        }
      } else if (F.id === "truth_single_stroke") {
        const pass = Math.max(0, Math.min(1, progress / 0.82));
        const x = P.x, y = H + normalH * 10 - (H + normalH * 20) * pass;
        const giantScale = Math.max(14, H / normalW * 0.72);
        sword(x, y, -Math.PI / 2, giantScale, 0.86);
      } else if (F.id === "truth_return_hidden") {
        const n = F.swordCount || Math.max(1, stat.count), phase = F.t % 120 / 120;
        const outward = phase < 0.5, r = (outward ? phase * 2 : (1 - phase) * 2) * Math.hypot(W, H) * 0.56;
        for (let i = 0; i < n; i++) {
          const a = i * Math.PI * 2 / n, facing = outward ? a : a + Math.PI;
          ctx.save();
          ctx.globalAlpha = 0.18;
          ctx.strokeStyle = "#211c17";
          ctx.lineWidth = Math.max(2, normalH * 0.45);
          ctx.beginPath();
          ctx.moveTo(P.x, P.y);
          ctx.lineTo(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r);
          ctx.stroke();
          ctx.restore();
          sword(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, facing, 1.15, 0.82);
        }
      } else if (F.id === "truth_moon_return") {
        const n = F.swordCount || Math.max(1, stat.count), r = Math.min(W, H) * 0.27;
        const spin = F.t * 0.012 * Math.max(1, stat.flySpeed * n / 14);
        ctx.save();
        ctx.strokeStyle = "rgba(31,27,23,.25)";
        ctx.lineWidth = Math.max(3, normalH * 0.55);
        ctx.beginPath();
        ctx.arc(P.x, P.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        for (let i = 0; i < n; i++) {
          const a = spin + i * Math.PI * 2 / n;
          sword(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, a, 1.15, 0.84);
        }
      }
      ctx.restore();
    }
    function update() {
      updateActiveTruth();
      G.t++;
      const P = G.player;
      const TF0 = stat.tierFlags || {};
      if (TF0.edgeMoment) {
        if (!G.edgeReady) {
          if (++G.edgeT >= 360) {
            G.edgeT = 0;
            G.edgeReady = true;
            floatText(P.x, P.y - 52, "鋒芒", "#c08a2e");
          }
        }
      } else {
        G.edgeReady = false;
        G.edgeT = 0;
      }
      if (!TF0.focusStacks) {
        G.focus = 0;
        G.focusReady = false;
      } else if (G.focusIdle != null && ++G.focusIdle > 180) {
        G.focus = 0;
        G.focusIdle = 0;
      }
      if (G.deathT > 0) {
        G.deathT--;
        if (G.shake > 0) G.shake *= 0.86;
        if (G.flash > 0) G.flash -= 0.035;
        for (let i = G.splashes.length - 1; i >= 0; i--) {
          const sp = G.splashes[i];
          sp.age++;
          if (sp.age >= sp.dur) G.splashes.splice(i, 1);
        }
        const hasDeath = (() => {
          const S = heroSet();
          return !!(S.death && S.death.length);
        })();
        if (!hasDeath) {
          const P2 = G.player;
          if (G.deathT > G.deathMax * 0.45 && G.t % 2 === 0)
            ink(
              P2.x + (Math.random() - 0.5) * 30,
              P2.y - P2.r * 1.4 + (Math.random() - 0.5) * 60,
              (Math.random() - 0.5) * 4.5,
              (Math.random() - 0.5) * 4.5 - 0.5,
              8 + Math.random() * 16
            );
          for (let i = G.inks.length - 1; i >= 0; i--) {
            const p = G.inks[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.9;
            p.vy *= 0.9;
            p.r *= 1.02;
            p.a -= 0.012;
            p.life -= 0.01;
            if (p.a <= 0) G.inks.splice(i, 1);
          }
          for (let i = G.texts.length - 1; i >= 0; i--) {
            const t = G.texts[i];
            t.age++;
            t.x += t.dx || 0;
            t.y += t.vy || -0.7;
            if (t.damage) t.vy *= 0.94;
            t.life -= t.damage ? 0.026 : 0.02;
            if (t.life <= 0) G.texts.splice(i, 1);
          }
        }
        if (G.deathT <= 0) gameOver();
        return;
      }
      if (G.bossTest && G.bossPreset60 && G.enemies.some((en) => en.isBoss && !en.showcaseGhost)) G.bossFightFrames++;
      if (G.webT > 0) G.webT--;
      if (G.mana < stat.manaMax) {
        const webMul = G.webT > 0 ? 0.45 : 1;
        G.mana = Math.min(stat.manaMax, G.mana + stat.manaRegen * webMul);
      } else {
        const TFm = stat.tierFlags || {};
        if (TFm.healOnFullMana && P.hp < P.max) {
          P.hp = Math.min(P.max, P.hp + stat.manaRegen * 0.35);
          if (G.t % 45 === 0) floatText(P.x, P.y - 46, "回元", "#4aa0b8");
        }
        if (TFm.summonOnFullMana && ++G.summonT >= 180) {
          G.summonT = 0;
          const tg = nearestEnemy(P.x, P.y, 1e9);
          if (tg) {
            spawnAutoCommand(P.x, P.y, tg.x, tg.y, { dmgMul: 0.7, intent: true });
            floatText(P.x, P.y - 58, "召劍", "#c08a2e");
          }
        }
      }
      if (G.auto) {
        G.autoTimer++;
        if (G.autoTimer >= 34) {
          const AUTO_STROKE_MAX = 220;
          const contactPadding = stat.size + (stat.hitPadding || 0);
          const best = selectAutoTarget(G.enemies, P, AUTO_STROKE_MAX, contactPadding, onScreen);
          if (best) {
            const aim = Math.atan2(best.y - P.y, best.x - P.x);
            let ang = aim;
            const n = stat.count;
            let shift = 0;
            if (n > 1 && stat.formation === "fan") {
              const spread = Math.min(0.55, 0.14 * (n - 1));
              let bo = 1e9;
              for (let i = 0; i < n; i++) {
                const o = (i / (n - 1) - 0.5) * spread * 2;
                if (Math.abs(o) < Math.abs(bo)) bo = o;
              }
              ang -= bo;
            } else if (n > 1 && stat.formation === "parallel") {
              const mid = (n - 1) / 2, gap = stat.size * 2.2 + 10;
              let bo = 1e9;
              for (let i = 0; i < n; i++) {
                const o = (i - mid) * gap;
                if (Math.abs(o) < Math.abs(bo)) bo = o;
              }
              shift = -bo;
            }
            const nx = -Math.sin(ang) * shift, ny = Math.cos(ang) * shift;
            const target = {
              x: stat.formation === "parallel" ? best.x + nx : P.x + Math.cos(ang) * Math.hypot(best.x - P.x, best.y - P.y),
              y: stat.formation === "parallel" ? best.y + ny : P.y + Math.sin(ang) * Math.hypot(best.x - P.x, best.y - P.y)
            };
            const endpoint = autoCommandEndpoint(P, target, AUTO_STROKE_MAX, (best.r || 0) + contactPadding);
            const tx = endpoint.x, ty = endpoint.y, want = endpoint.length;
            if (allowedLen() + 0.01 >= want) {
              const before = G.mana;
              launchSword([{ x: P.x, y: P.y }, { x: tx, y: ty }]);
              if (G.mana < before) {
                G.autoUsed = true;
                G.autoTimer = 0;
              } else {
                G.autoTimer = 28;
              }
            } else G.autoTimer = 28;
          }
        }
      }
      if (!G.bossTest && !ACTOR_POC && G.wave <= 60) {
        G.waveTimer++;
        if (G.waveKills >= realmKillTarget(G.wave)) {
          if (G.wave === 59) beginBossWave();
          else advanceRealm();
        } else if (G.waveTimer >= realmTimeFrames(G.wave)) {
          G.banner = { txt: "時限已盡", life: 1 };
          gameOver();
        }
      }
      if (!G.bossTest && (!ACTOR_POC || WAVE_POC) && G.wave < 60) {
        const eliteCount = eliteSpiderCountForWave(G.wave);
        if (eliteCount && !G.eliteSpawned[G.wave]) {
          G.eliteSpawned[G.wave] = true;
          spawnNetherSpider(G.wave, eliteCount);
        }
        const q = waveDifficulty(G.wave);
        G.spawnAcc += q.spawn;
        while (G.spawnAcc >= 60) {
          G.spawnAcc -= 60;
          if (G.enemies.length < q.cap) spawnEnemy();
        }
      }
      updateBossShots();
      updateEnemies();
      updateCombat();
      for (let i = G.particles.length - 1; i >= 0; i--) {
        const p = G.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.life -= 0.03;
        if (p.life <= 0) G.particles.splice(i, 1);
      }
      for (let i = G.splashes.length - 1; i >= 0; i--) {
        const sp = G.splashes[i];
        sp.age++;
        if (sp.age >= sp.dur) G.splashes.splice(i, 1);
      }
      for (let i = G.mists.length - 1; i >= 0; i--) {
        const m = G.mists[i];
        m.age++;
        if (m.age >= m.dur) G.mists.splice(i, 1);
      }
      for (let i = G.inks.length - 1; i >= 0; i--) {
        const p = G.inks[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.r *= 1.02;
        p.a -= 0.012;
        p.life -= 0.01;
        if (p.a <= 0) G.inks.splice(i, 1);
      }
      for (let i = G.texts.length - 1; i >= 0; i--) {
        const t = G.texts[i];
        t.age++;
        t.x += t.dx || 0;
        t.y += t.vy || -0.7;
        if (t.damage) t.vy *= 0.94;
        t.life -= t.damage ? 0.026 : 0.02;
        if (t.life <= 0) G.texts.splice(i, 1);
      }
      for (let i = G.stains.length - 1; i >= 0; i--) {
        const st = G.stains[i];
        st.a -= 35e-5;
        if (st.a <= 0) G.stains.splice(i, 1);
      }
      {
        const TFw = stat.tierFlags || {};
        const decay = TFw.whiteCutLingers ? 0.03 : 0.09;
        const cutMul = TFw.whiteCutSlash ? 0.7 : 0.3;
        for (let i = G.cuts.length - 1; i >= 0; i--) {
          const c = G.cuts[i];
          c.life -= decay;
          if (!c.slashed && c.life < 0.86) {
            c.slashed = true;
            for (const en of G.enemies)
              if (Math.hypot(en.x - c.x, en.y - c.y) < en.r + c.len * 0.8) {
                dmgTo(en, stat.damage * cutMul);
                pendDamage(en, stat.damage * cutMul, false);
                en.hit = 6;
              }
          }
          if (c.life <= 0) G.cuts.splice(i, 1);
        }
      }
      if (G.shake > 0) G.shake *= 0.86;
      if (G.shake < 0.2) G.shake = 0;
      if (G.flash > 0) G.flash -= 0.035;
      if (G.banner) {
        G.banner.life -= 85e-4;
        if (G.banner.life <= 0) G.banner = null;
      }
      {
        let best = null, bd = 1e9;
        for (const en of G.enemies) {
          if (!onScreen(en)) continue;
          const dd = (en.x - P.x) ** 2 + (en.y - P.y) ** 2;
          if (dd < bd) {
            bd = dd;
            best = en;
          }
        }
        const want = best ? Math.atan2(best.y - P.y, best.x - P.x) : G.facing > 0 ? 0.8 : Math.PI - 0.8;
        let da = want - G.aim;
        while (da > Math.PI) da -= 6.283;
        while (da < -Math.PI) da += 6.283;
        G.aim += da * 0.09;
        G.facing = Math.cos(G.aim) >= 0 ? 1 : -1;
      }
      if (G.intent > 0) G.intent = Math.max(0, G.intent - 0.045);
      for (let i = G.streaks.length - 1; i >= 0; i--) {
        const k = G.streaks[i];
        k.life -= 0.085;
        if (k.life <= 0) G.streaks.splice(i, 1);
      }
      if (P.pulse > 0) P.pulse -= 0.05;
      if (G.hurtT > 0) G.hurtT--;
      if (G.castT > 0) G.castT--;
      if (stat.tierFlags && stat.tierFlags.autoRefill) {
        const cap = Math.max(1, stat.count | 0);
        if (++G.reserveT >= 480) {
          G.reserveT = 0;
          if (G.reserve < cap) {
            G.reserve++;
            G.reserveFlash = 1;
          }
        }
        if (G.reserve > cap) G.reserve = cap;
      } else {
        G.reserve = 0;
        G.reserveT = 0;
      }
      if (G.reserveFlash > 0) G.reserveFlash -= 0.02;
      for (let i = G.drops.length - 1; i >= 0; i--) {
        const d = G.drops[i];
        d.t--;
        if (d.t <= 0) {
          G.drops.splice(i, 1);
          continue;
        }
        for (const en of G.enemies) {
          if (Math.hypot(en.x - d.x, en.y - d.y) < en.r + d.r) {
            dmgTo(en, d.dmg);
            en.hit = 6;
            splash(d.x, d.y, "#3a332a", 0.9);
            if (d.boom) {
              for (const e2 of G.enemies)
                if (e2 !== en && Math.hypot(e2.x - d.x, e2.y - d.y) < 70) {
                  dmgTo(e2, d.dmg * 0.6);
                  e2.hit = 6;
                }
            }
            G.drops.splice(i, 1);
            break;
          }
        }
      }
      for (let i = G.lingers.length - 1; i >= 0; i--) {
        const L = G.lingers[i];
        L.t--;
        if (L.t <= 0) {
          G.lingers.splice(i, 1);
          continue;
        }
        if (G.t % 4) continue;
        for (const en of G.enemies) {
          if (L.hit.has(en)) continue;
          for (let k = 1; k < L.pts.length; k++)
            if (segCircleDist(L.pts[k - 1].x, L.pts[k - 1].y, L.pts[k].x, L.pts[k].y, en.x, en.y) < en.r + stat.size) {
              dmgTo(en, L.dmg);
              en.hit = 6;
              L.hit.add(en);
              break;
            }
        }
      }
      flushDamage();
      dpsTick();
      if (G.t % 5 === 0) updateHUD();
    }
    const ELEM = {
      none: {
        halo0: "rgba(70,64,56,0)",
        halo1: "rgba(70,64,56,0.26)",
        halo2: "rgba(120,110,96,0)",
        spine: "rgba(60,52,44,0.6)",
        trail: "40,34,28",
        hit: "#3a332a"
      },
      fire: {
        halo0: "rgba(200,80,36,0)",
        halo1: "rgba(214,96,42,0.40)",
        halo2: "rgba(244,182,88,0)",
        spine: "rgba(198,72,28,0.9)",
        trail: "206,92,40",
        hit: "#c0532e"
      },
      ice: {
        halo0: "rgba(120,178,218,0)",
        halo1: "rgba(150,200,235,0.40)",
        halo2: "rgba(224,242,255,0)",
        spine: "rgba(84,150,200,0.9)",
        trail: "150,196,230",
        hit: "#5a9cc0"
      }
    };
    let blots = null;
    function buildBlots() {
      blots = [];
      for (let b = 0; b < 6; b++) {
        const S = 128, c = document.createElement("canvas");
        c.width = c.height = S;
        const g = c.getContext("2d");
        const m = 7 + (Math.random() * 3 | 0), pts = [];
        for (let i = 0; i < m; i++) pts.push({
          a: i / m * 6.283,
          r: S * 0.5 * (0.55 + Math.random() * 0.42),
          ox: (Math.random() - 0.5) * S * 0.12,
          oy: (Math.random() - 0.5) * S * 0.12
        });
        g.fillStyle = "#000";
        g.beginPath();
        for (let i = 0; i < m; i++) {
          const q = pts[i], n = pts[(i + 1) % m];
          const ax = S / 2 + Math.cos(q.a) * q.r + q.ox, ay = S / 2 + Math.sin(q.a) * q.r + q.oy;
          const bx = S / 2 + Math.cos(n.a) * n.r + n.ox, by = S / 2 + Math.sin(n.a) * n.r + n.oy;
          if (i === 0) g.moveTo(ax, ay);
          g.quadraticCurveTo(
            ax + (bx - ax) * 0.5 + Math.cos(q.a) * q.r * 0.18,
            ay + (by - ay) * 0.5 + Math.sin(q.a) * q.r * 0.18,
            bx,
            by
          );
        }
        g.closePath();
        g.fill();
        blots.push(c);
      }
    }
    const ENEMY_TONE = {
      weaver: "rgba(72,92,101,.38)",
      orbiter: "rgba(43,96,72,.38)",
      bulwark: "rgba(50,40,58,.24)",
      charger: "rgba(133,48,39,.38)",
      reaver: "rgba(34,48,68,.40)"
    };
    function realmKillTarget(w) {
      return w >= 60 ? 1 : Math.min(60, 10 + Math.floor((w - 1) * 0.72) + (w % 10 === 0 ? 5 : 0));
    }
    function realmTimeFrames(w) {
      return (w >= 60 ? 360 : 45) * 60;
    }
    function realmClockText() {
      const left = Math.max(0, Math.ceil((realmTimeFrames(G.wave) - G.waveTimer) / 60));
      return String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");
    }
    function advanceRealm() {
      G.waveTimer = 0;
      G.waveKills = 0;
      G.wave++;
      SND.wave();
      SND.intensity(G.wave);
      flash(0.14, "250,244,226");
      G.banner = { txt: "第 " + num2cn(G.wave) + " 境", life: 1 };
      updateHUD();
    }
    function renderDps() {
      const rd = dpsRate("d"), rm = dpsRate("m"), rk = dpsRate("k");
      const one = (v) => v.toFixed(1), two = (v) => v.toFixed(2);
      setTxt("dps_d", rd == null ? "—" : one(rd));
      setTxt("dps_m", rm == null ? "—" : one(rm));
      setTxt("dps_k", rk == null ? "—" : two(rk));
      setTxt("dps_f", DPS.secs < 1 ? "尚未成局" : "近" + Math.min(DPS.win, DPS.buckets.length) + "息 · 回氣 " + one(stat.manaRegen * 60) + "/秒");
    }
    const FX = { bg: true, vig: true, trail: true, ink: true, part: true, glow: true };
    const FXKEY = {
      "1": ["bg", "背景層"],
      "2": ["vig", "暈影"],
      "3": ["trail", "拖尾"],
      "4": ["ink", "墨暈"],
      "5": ["part", "粒子"],
      "6": ["glow", "靈石光暈"]
    };
    let NODRAW = false, NOAUDIO = false;
    let DRAWLV = 9;
    const LVNAME = [
      "0 什麼都不畫",
      "1 背景圖層",
      "2 墨暈",
      "3 靈石法陣",
      "4 敵人",
      "5 劍(拖尾+劍身)",
      "6 畫痕",
      "7 粒子+浮字",
      "8 題字+閃光",
      "9 暈影圖層"
    ];
    let GPU = "(未偵測)";
    function detectGPU() {
      try {
        const c = document.createElement("canvas");
        const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
        if (!gl) {
          GPU = "WebGL 不可用 → 硬體加速應已關閉";
          return;
        }
        const e = gl.getExtension("WEBGL_debug_renderer_info");
        let r = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        r = String(r).replace(/ANGLE \(|\)$/g, "").slice(0, 46);
        const soft = /swiftshader|software|llvmpipe|basic render/i.test(r);
        GPU = (soft ? "⚠ 軟體算圖 " : "") + r;
      } catch (err) {
        GPU = "偵測失敗";
      }
    }
    detectGPU();
    const DIAG = { on: false, hist: [], upd: 0, drw: 0, last: 0, tAcc: 0, tN: 0, minD: 1e9, el: null, next: 0 };
    function diagFrame(ts) {
      if (DIAG.last) {
        const d = ts - DIAG.last;
        if (d > 0.5 && d < 500) {
          DIAG.hist.push(d);
          if (DIAG.hist.length > 180) DIAG.hist.shift();
          if (d < DIAG.minD) DIAG.minD = d;
        }
      }
      DIAG.last = ts;
      if (!DIAG.on || ts < DIAG.next) return;
      DIAG.next = ts + 250;
      const f = DIAG.hist.slice().sort((a, b) => a - b);
      if (!f.length) return;
      const q = (x) => f[Math.min(f.length - 1, Math.floor(f.length * x))];
      const p50 = q(0.5), p95 = q(0.95), mx = f[f.length - 1];
      const fps = 1e3 / p50;
      const hz = DIAG.minD < 1e9 ? Math.round(1e3 / DIAG.minD) : 0;
      const cls = (v) => v > 1e3 / 50 ? "bad" : v > 1e3 / 58 ? "warn" : "";
      const nz = (n) => String(n).padStart(4);
      DIAG.el.innerHTML = "<b>" + fps.toFixed(0) + ' fps</b>  <span class="' + cls(p50) + '">p50 ' + p50.toFixed(1) + "ms</span>\np95 " + p95.toFixed(1) + "ms   max " + mx.toFixed(1) + "ms\n螢幕上限 ≈ " + hz + " Hz" + (hz > 70 ? '  <span class="warn">(60fps=掉一半)</span>' : "") + "\nupdate " + DIAG.upd.toFixed(2) + "ms  draw " + DIAG.drw.toFixed(2) + "ms\n" + (hz && p50 > 1e3 / hz + 3 ? '<span class="bad">瀏覽器 ' + Math.max(0, p50 - DIAG.upd - DIAG.drw).toFixed(1) + "ms</span> ← 合成/點陣化\n" : "其餘 " + Math.max(0, p50 - DIAG.upd - DIAG.drw).toFixed(1) + "ms(等 vsync,正常)\n") + "DPR " + DPR + "  畫布 " + (W * DPR | 0) + "×" + (H * DPR | 0) + '\n<span class="' + (/⚠/.test(GPU) ? "bad" : "") + '">' + GPU + "</span>\n1背景" + (FX.bg ? "✓" : "✗") + " 2暈影" + (FX.vig ? "✓" : "✗") + " 3拖尾" + (FX.trail ? "✓" : "✗") + "\n4墨暈" + (FX.ink ? "✓" : "✗") + " 5粒子" + (FX.part ? "✓" : "✗") + " 6光暈" + (FX.glow ? "✓" : "✗") + "\n7音訊" + (NOAUDIO ? "停" : "開") + "　9繪圖" + (NODRAW ? "停" : "開") + "　0全部特效\n妖" + nz(G.enemies.length) + " 劍" + nz(G.swords.length) + " 粒" + nz(G.particles.length) + "\n墨" + nz(G.inks.length) + " 字" + nz(G.texts.length) + " 波" + nz(G.wave) + (ACTOR_POC ? "\n\n<b>Actor POC</b>\n" + (actorPocDiag ? "actorId " + actorPocDiag.actorId + "\nsource = " + actorPocDiag.source + "\nlogicalDirection " + actorPocDiag.logicalDirection + "\nresolvedAssetDirection " + actorPocDiag.resolvedAssetDirection + "\nflipX " + actorPocDiag.flipX + "\naction " + actorPocDiag.action + "\nframeIndex " + actorPocDiag.frameIndex + "\nrenderer = " + actorPocDiag.renderer : "renderer = waiting") : "");
    }
    let bisecting = false;
    async function bisect() {
      if (bisecting) return;
      bisecting = true;
      const el = DIAG.el = DIAG.el || document.getElementById("diag");
      el.classList.add("show");
      DIAG.on = false;
      const saveDPR = DPR, saveFX = Object.assign({}, FX);
      const setTestDPR = (v) => {
        setDPR(v);
        cv.width = W * DPR;
        cv.height = H * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      };
      const styleOff = document.createElement("style");
      const CASES = [
        ["1 現狀(全開)", () => {
        }],
        ["2 不畫任何東西", () => {
          NODRAW = true;
        }],
        ["3 音訊全停", () => {
          NODRAW = false;
          SND.hardMute(true);
        }],
        ["4 不畫 + 無音訊", () => {
          NODRAW = true;
        }],
        ["5 DPR 降到 1", () => {
          NODRAW = false;
          SND.hardMute(false);
          setTestDPR(1);
        }],
        ["6 移除毛玻璃", () => {
          setTestDPR(saveDPR);
          styleOff.textContent = "*{backdrop-filter:none !important}";
          document.head.appendChild(styleOff);
        }]
      ];
      const rows = [];
      for (const [name, setup] of CASES) {
        setup();
        await new Promise((r) => setTimeout(r, 400));
        const gaps = [];
        let last = 0;
        await new Promise((res) => {
          const t0 = performance.now();
          (function f(ts) {
            if (last) gaps.push(ts - last);
            last = ts;
            if (performance.now() - t0 < 3e3) requestAnimationFrame(f);
            else res();
          })(performance.now());
        });
        gaps.sort((a, b) => a - b);
        const p50 = gaps[gaps.length >> 1] || 0;
        rows.push([name, (1e3 / p50).toFixed(0), p50.toFixed(1)]);
        el.textContent = "二分中… " + name + "  →  " + (1e3 / p50).toFixed(0) + " fps";
      }
      NODRAW = false;
      SND.hardMute(false);
      setTestDPR(saveDPR);
      Object.assign(FX, saveFX);
      if (styleOff.parentNode) styleOff.parentNode.removeChild(styleOff);
      const txt = "== 自動二分結果 ==\n" + rows.map((r) => r[0].padEnd(16) + String(r[1]).padStart(4) + " fps  " + r[2] + "ms").join("\n") + "\n螢幕上限 ≈ " + (DIAG.minD < 1e9 ? Math.round(1e3 / DIAG.minD) : "?") + " Hz\nDPR " + DPR + "  畫布 " + (W * DPR | 0) + "×" + (H * DPR | 0) + "\n" + GPU;
      el.textContent = txt + "\n\n(已複製到剪貼簿,按 F 收起)";
      try {
        navigator.clipboard.writeText(txt);
      } catch (e) {
      }
      bisecting = false;
    }
    async function bisectDraw() {
      if (bisecting) return;
      bisecting = true;
      const el = DIAG.el = DIAG.el || document.getElementById("diag");
      el.classList.add("show");
      DIAG.on = false;
      const rows = [];
      let prev = null, culprit = null;
      for (let lv = 0; lv <= 9; lv++) {
        DRAWLV = lv;
        NODRAW = lv === 0;
        await new Promise((r) => setTimeout(r, 300));
        const gaps = [];
        let last = 0;
        await new Promise((res) => {
          const t0 = performance.now();
          (function f(ts) {
            if (last) gaps.push(ts - last);
            last = ts;
            if (performance.now() - t0 < 2200) requestAnimationFrame(f);
            else res();
          })(performance.now());
        });
        gaps.sort((a, b) => a - b);
        const p50 = gaps[gaps.length >> 1] || 0, fps = 1e3 / p50;
        rows.push(LVNAME[lv].padEnd(15) + String(fps.toFixed(0)).padStart(3) + " fps " + p50.toFixed(1) + "ms");
        if (prev !== null && !culprit && prev >= 45 && fps < 45) culprit = LVNAME[lv];
        prev = fps;
        el.textContent = "逐段二分中… " + LVNAME[lv] + " → " + fps.toFixed(0) + " fps";
      }
      DRAWLV = 9;
      NODRAW = false;
      bisecting = false;
      const txt = "== 逐段疊加二分 ==\n" + rows.join("\n") + (culprit ? "\n\n➜ 元凶:" + culprit : "\n\n➜ 沒有單一段落造成落差") + "\nDPR " + DPR + "  畫布 " + (W * DPR | 0) + "×" + (H * DPR | 0);
      el.textContent = txt + "\n\n(已複製到剪貼簿,按 F 收起)";
      try {
        navigator.clipboard.writeText(txt);
      } catch (e) {
      }
    }
    async function bisectMicro() {
      if (bisecting) return;
      bisecting = true;
      const el = DIAG.el = DIAG.el || document.getElementById("diag");
      el.classList.add("show");
      DIAG.on = false;
      const saveNo = NODRAW;
      NODRAW = true;
      const hud = document.getElementById("hud");
      let alt = null, altx = null;
      function mkAlt(opts) {
        alt = document.createElement("canvas");
        alt.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:1";
        alt.width = W * DPR;
        alt.height = H * DPR;
        document.getElementById("wrap").appendChild(alt);
        altx = alt.getContext("2d", opts);
        altx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
      function rmAlt() {
        if (alt) {
          alt.remove();
          alt = null;
          altx = null;
        }
      }
      let off = null;
      const CASES = [
        ["A 完全不畫", null, null],
        ["B 主畫布 clear 1×1", null, () => ctx.clearRect(0, 0, 1, 1)],
        ["C 主畫布 塗 4×4", null, () => {
          ctx.fillStyle = "#e9e0cc";
          ctx.fillRect(0, 0, 4, 4);
        }],
        ["D 主畫布 滿版塗色", null, () => {
          ctx.fillStyle = "#e9e0cc";
          ctx.fillRect(0, 0, W, H);
        }],
        ["E 主畫布 滿版貼圖", null, () => {
          if (!off) {
            off = document.createElement("canvas");
            off.width = W * DPR;
            off.height = H * DPR;
            const g = off.getContext("2d");
            g.fillStyle = "#e9e0cc";
            g.fillRect(0, 0, off.width, off.height);
          }
          ctx.drawImage(off, 0, 0, W, H);
        }],
        [
          "F 塗 4×4 + 隱藏 HUD",
          () => {
            hud.style.display = "none";
          },
          () => {
            ctx.fillStyle = "#e9e0cc";
            ctx.fillRect(0, 0, 4, 4);
          }
        ],
        [
          "G 新畫布 alpha:false",
          () => {
            hud.style.display = "";
            rmAlt();
            mkAlt({ alpha: false });
          },
          () => {
            altx.fillStyle = "#e9e0cc";
            altx.fillRect(0, 0, W, H);
          }
        ],
        [
          "H 新畫布 +低延遲",
          () => {
            rmAlt();
            mkAlt({ alpha: false, desynchronized: true });
          },
          () => {
            altx.fillStyle = "#e9e0cc";
            altx.fillRect(0, 0, W, H);
          }
        ]
      ];
      const rows = [];
      for (const [name, pre, paint] of CASES) {
        if (pre) pre();
        await new Promise((r) => setTimeout(r, 300));
        const gaps = [];
        let last = 0;
        await new Promise((res) => {
          const t0 = performance.now();
          (function f(ts) {
            if (last) gaps.push(ts - last);
            last = ts;
            if (paint) paint();
            if (performance.now() - t0 < 2200) requestAnimationFrame(f);
            else res();
          })(performance.now());
        });
        gaps.sort((a, b) => a - b);
        const p50 = gaps[gaps.length >> 1] || 0;
        rows.push(name.padEnd(20) + String((1e3 / p50).toFixed(0)).padStart(3) + " fps " + p50.toFixed(1) + "ms");
        el.textContent = "微觀二分中… " + name + " → " + (1e3 / p50).toFixed(0) + " fps";
      }
      rmAlt();
      hud.style.display = "";
      NODRAW = saveNo;
      bisecting = false;
      const txt = "== 微觀二分 ==\n" + rows.join("\n") + "\nDPR " + DPR + "  畫布 " + (W * DPR | 0) + "×" + (H * DPR | 0) + "\n" + GPU;
      el.textContent = txt + "\n\n(已複製到剪貼簿,按 F 收起)";
      try {
        navigator.clipboard.writeText(txt);
      } catch (e) {
      }
    }
    async function bisectPage() {
      if (bisecting) return;
      bisecting = true;
      const el = DIAG.el = DIAG.el || document.getElementById("diag");
      el.classList.add("show");
      DIAG.on = false;
      const saveNo = NODRAW, savePause = G.paused;
      NODRAW = true;
      G.paused = true;
      const wrap = document.getElementById("wrap");
      const stash = [];
      const auEls = [];
      const saveW = cv.width, saveH = cv.height, saveCss = cv.style.cssText;
      const measure = async (name) => {
        await new Promise((r) => setTimeout(r, 300));
        const gaps = [];
        let last = 0;
        await new Promise((res) => {
          const t0 = performance.now();
          (function f(ts) {
            if (last) gaps.push(ts - last);
            last = ts;
            ctx.clearRect(0, 0, 2, 2);
            if (performance.now() - t0 < 2e3) requestAnimationFrame(f);
            else res();
          })(performance.now());
        });
        gaps.sort((a, b) => a - b);
        const p50 = gaps[gaps.length >> 1] || 0;
        el.textContent = "頁面二分中… " + name + " → " + (1e3 / p50).toFixed(0) + " fps";
        return name.padEnd(24) + String((1e3 / p50).toFixed(0)).padStart(3) + " fps " + p50.toFixed(1) + "ms";
      };
      const rows = [];
      {
        const gaps = [];
        let last = 0;
        await new Promise((res) => {
          const t0 = performance.now();
          (function f(ts) {
            if (last) gaps.push(ts - last);
            last = ts;
            if (performance.now() - t0 < 2e3) requestAnimationFrame(f);
            else res();
          })(performance.now());
        });
        gaps.sort((a, b) => a - b);
        const p50 = gaps[gaps.length >> 1] || 0;
        rows.push("0 完全不碰畫布(對照)".padEnd(24) + String((1e3 / p50).toFixed(0)).padStart(3) + " fps " + p50.toFixed(1) + "ms");
      }
      rows.push(await measure("1 現狀"));
      blots = null;
      G.stains.length = 0;
      rows.push(await measure("2 釋放離屏畫布"));
      document.querySelectorAll("audio").forEach((a) => {
        try {
          a.pause();
        } catch (e) {
        }
        a.removeAttribute("src");
        a.load();
        auEls.push(a);
      });
      rows.push(await measure("3 移除音訊元素"));
      [...wrap.children].forEach((c) => {
        if (c !== cv && c.id !== "diag") {
          stash.push([c, c.nextSibling]);
          c.remove();
        }
      });
      rows.push(await measure("4 移除畫布以外的 DOM"));
      cv.style.cssText = "position:absolute;left:0;top:0;width:640px;height:400px;z-index:1";
      cv.width = 640;
      cv.height = 400;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      rows.push(await measure("5 畫布縮到 640×400"));
      cv.style.cssText = "position:absolute;left:0;top:0;width:320px;height:200px;z-index:1";
      cv.width = 320;
      cv.height = 200;
      rows.push(await measure("6 畫布縮到 320×200"));
      cv.style.cssText = "position:absolute;left:0;top:0;width:64px;height:40px;z-index:1";
      cv.width = 64;
      cv.height = 40;
      rows.push(await measure("7 畫布縮到 64×40"));
      try {
        const fr = document.createElement("iframe");
        fr.style.cssText = "position:absolute;left:0;top:0;width:320px;height:200px;border:0;z-index:1";
        document.body.appendChild(fr);
        const d = fr.contentDocument, w2 = fr.contentWindow;
        const c2 = d.createElement("canvas");
        c2.width = 320;
        c2.height = 200;
        c2.style.cssText = "width:320px;height:200px;display:block";
        d.body.style.margin = "0";
        d.body.appendChild(c2);
        const x2 = c2.getContext("2d");
        const gaps = [];
        let last = 0;
        await new Promise((res) => {
          const t0 = performance.now();
          (function f(ts) {
            if (last) gaps.push(ts - last);
            last = ts;
            x2.clearRect(0, 0, 2, 2);
            if (performance.now() - t0 < 2e3) w2.requestAnimationFrame(f);
            else res();
          })(performance.now());
        });
        gaps.sort((a, b) => a - b);
        const p50 = gaps[gaps.length >> 1] || 0;
        rows.push("8 空白 iframe 內畫布".padEnd(24) + String((1e3 / p50).toFixed(0)).padStart(3) + " fps " + p50.toFixed(1) + "ms");
        fr.remove();
      } catch (err) {
        rows.push("8 空白 iframe 內畫布      (失敗)");
      }
      cv.style.cssText = saveCss;
      cv.width = saveW;
      cv.height = saveH;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      stash.reverse().forEach(([c, ref]) => wrap.insertBefore(c, ref));
      NODRAW = saveNo;
      G.paused = savePause;
      bisecting = false;
      invalidatePaper();
      resetHudCache();
      const txt = "== 頁面級二分(每幀只 clearRect 2×2)==\n" + rows.join("\n") + "\n原畫布 " + saveW + "×" + saveH + "\n" + GPU + "\n※ 音訊已停,重新整理即恢復";
      el.textContent = txt + "\n\n(已複製到剪貼簿,按 F 收起)";
      try {
        navigator.clipboard.writeText(txt);
      } catch (e) {
      }
    }
    function toggleDiag() {
      DIAG.on = !DIAG.on;
      DIAG.hist.length = 0;
      DIAG.minD = 1e9;
      DIAG.el = DIAG.el || document.getElementById("diag");
      DIAG.el.classList.toggle("show", DIAG.on);
    }
    if (location.search.indexOf("debug") >= 0 || ACTOR_POC) setTimeout(toggleDiag, 0);
    let openingSeen = false;
    const DESK_IMG = { w: 941, h: 1672 };
    const SCROLL_UV = { x0: 0.1, x1: 0.88, y0: 0.47, y1: 0.5165, seam: 0.4935 };
    function measureScroll() {
      const wrap = document.getElementById("wrap");
      const vw = wrap.clientWidth, vh = wrap.clientHeight;
      const s = Math.max(vw / DESK_IMG.w, vh / DESK_IMG.h);
      const dw = DESK_IMG.w * s, dh = DESK_IMG.h * s;
      const ox = (vw - dw) / 2, oy = (vh - dh) / 2;
      const x0 = ox + SCROLL_UV.x0 * dw, x1 = ox + SCROLL_UV.x1 * dw;
      const y0 = oy + SCROLL_UV.y0 * dh, y1 = oy + SCROLL_UV.y1 * dh;
      const seam = oy + SCROLL_UV.seam * dh;
      return {
        vw,
        vh,
        x0,
        x1,
        y0,
        y1,
        seam,
        cx: (x0 + x1) / 2,
        cy: (y0 + y1) / 2,
        // 推到「畫軸略寬於畫面」,鏡頭感才夠、捲桿也能橫貫整個邊緣
        zoom: Math.max(1, vw / Math.max(1, x1 - x0) * 2.2)
      };
    }
    function applyOpeningVars() {
      const wrap = document.getElementById("wrap"), m = measureScroll(), st = wrap.style;
      const Z = m.zoom, OY = m.cy;
      const zy = (y) => OY + (y - OY) * Z;
      const EDGE = Math.round(Math.min(46, m.vh * 0.055));
      st.setProperty("--ox", m.cx.toFixed(1) + "px");
      st.setProperty("--oy", m.cy.toFixed(1) + "px");
      st.setProperty("--zoom", Z.toFixed(4));
      st.setProperty("--sx0", m.x0.toFixed(1) + "px");
      st.setProperty("--sx1", m.x1.toFixed(1) + "px");
      st.setProperty("--sy0", m.y0.toFixed(1) + "px");
      st.setProperty("--sy1", m.y1.toFixed(1) + "px");
      st.setProperty("--seam", m.seam.toFixed(1) + "px");
      st.setProperty("--tTop", (-(zy(m.seam) - EDGE)).toFixed(1) + "px");
      st.setProperty("--tBot", (m.vh - zy(m.seam) - EDGE).toFixed(1) + "px");
      return m;
    }
    function playOpening(done) {
      const wrap = document.getElementById("wrap"), opening = document.getElementById("opening"), splash2 = document.getElementById("splash"), hud = document.getElementById("hud");
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let finished = false, safetyTimer = 0;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(safetyTimer);
        wrap.classList.remove("op");
        wrap.style.setProperty("--z", "0");
        wrap.style.setProperty("--uf", "1");
        if (opening) {
          opening.classList.remove("show");
          opening.style.opacity = "";
        }
        splash2.classList.remove("zooming");
        splash2.style.display = "none";
        splash2.style.opacity = "";
        if (hud) hud.style.opacity = "";
        done && done();
      };
      if (meta.quality === "low" || reduce || openingSeen) {
        finish();
        return;
      }
      openingSeen = true;
      applyOpeningVars();
      splash2.classList.add("zooming");
      opening.classList.add("show");
      opening.style.opacity = "1";
      wrap.classList.add("op");
      wrap.style.setProperty("--z", "0");
      wrap.style.setProperty("--uf", "0");
      wrap.style.setProperty("--uiFade", "1");
      if (hud) hud.style.opacity = "0";
      const ease = (t) => 1 - Math.pow(1 - t, 3), easeIO = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const t0 = performance.now(), HOLD = 0, ZOOM = 1100, UNFURL = 1400, HUDF = 520;
      safetyTimer = setTimeout(finish, HOLD + ZOOM + UNFURL + HUDF + 700);
      function frame(now) {
        if (finished) return;
        const t = now - t0;
        const z = t <= HOLD ? 0 : ease(Math.min(1, (t - HOLD) / ZOOM));
        const uf = t <= HOLD + ZOOM ? 0 : easeIO(Math.min(1, (t - HOLD - ZOOM) / UNFURL));
        wrap.style.setProperty("--z", z.toFixed(4));
        wrap.style.setProperty("--uf", uf.toFixed(4));
        wrap.style.setProperty("--uiFade", Math.max(0, 1 - Math.max(0, (z - 0.42) / 0.46)).toFixed(3));
        splash2.style.opacity = uf > 0 ? Math.max(0, 1 - uf / 0.3).toFixed(3) : "1";
        opening.style.opacity = uf > 0.72 ? Math.max(0, 1 - (uf - 0.72) / 0.28).toFixed(3) : "1";
        if (hud) hud.style.opacity = Math.max(0, Math.min(1, (t - HOLD - ZOOM - UNFURL * 0.5) / HUDF)).toFixed(3);
        if (t < HOLD + ZOOM + UNFURL + HUDF) requestAnimationFrame(frame);
        else finish();
      }
      requestAnimationFrame(frame);
    }
    function start(mode) {
      NODRAW = false;
      DRAWLV = 9;
      const bossTest = mode === "boss" || mode === "boss-fast";
      const fastRestart = mode === "boss-fast";
      dpsReset();
      resetBootClock();
      Object.assign(G, {
        running: true,
        paused: false,
        t: 0,
        enemies: [],
        bossShots: [],
        swords: [],
        particles: [],
        inks: [],
        texts: [],
        stains: [],
        splashes: [],
        mists: [],
        commands: [],
        kills: 0,
        waveKills: 0,
        wave: bossTest ? 60 : 1,
        waveTimer: 0,
        spawnAcc: 0,
        eliteSpawned: {},
        webT: 0,
        bossTest,
        bossShowcase: false,
        bossEntered: bossTest,
        chapterComplete: false,
        bossPreset60: false,
        bossFightFrames: 0,
        bossKillSecs: null,
        hpLocked: false,
        xp: 0,
        xpNeed: 6,
        level: 1,
        pendingLevels: 0,
        mana: 100,
        reserve: 0,
        reserveT: 0,
        reserveFlash: 0,
        strokeAvg: 0,
        strokeN: 0,
        drops: [],
        lingers: [],
        edgeT: 0,
        edgeReady: false,
        focus: 0,
        focusIdle: 0,
        focusReady: false,
        summonT: 0,
        auto: false,
        autoUsed: false,
        autoTimer: 0,
        shake: 0,
        hitstop: 0,
        flash: 0,
        flashC: "255,255,255",
        banner: null,
        aim: 0.85,
        facing: 1,
        intent: 0,
        streaks: [],
        cuts: [],
        anchors: [],
        anchorLinks: [],
        firstStrikeDone: false,
        respecWave: 0,
        hurtT: 0,
        castT: 0,
        deathT: 0,
        deathMax: 56,
        heroPhase: Math.random() * 9
      });
      renderAutoBtn();
      SND.unlock();
      SND.intensity(bossTest ? 60 : 1);
      SND.duck(false);
      runState = INK_CONFIG.runtime.createRunState(buildPermanentSave(), 1);
      truthCooldown = 0;
      truthFx = null;
      refreshTruthButton();
      syncStat();
      G.mana = stat.manaMax;
      G.player = new Player();
      if (ACTOR_POC) G.hpLocked = true;
      if (bossTest) {
        G.player.y = H * BOSS_PLAYER_Y_RATIO;
        spawnXuanmingBoss(true);
        G.banner = null;
      }
      resetPauseState();
      resetLevelChoice();
      drawing = false;
      path = [];
      curLen = 0;
      maxed = false;
      document.getElementById("overlay").classList.remove("show");
      document.getElementById("gameover").style.display = "none";
      document.getElementById("meta").classList.remove("show");
      document.getElementById("pause").classList.remove("show");
      document.getElementById("bosstesttools").classList.toggle("show", bossTest);
      renderBossTestTools();
      updateHUD();
      computePlayTop();
      requestAnimationFrame(computePlayTop);
      G.paused = true;
      pendingFormationStart = () => continueAfterFormation(fastRestart);
      if (fastRestart) drawStartingFormations();
      else playOpening(() => {
        if (meta.quality === "low") SND.stopMenu(0);
        drawStartingFormations();
      });
    }
    function continueAfterFormation(fastRestart) {
      if (BLADE_POC && INK_CONFIG.insightById[BLADE_POC]) {
        INK_CONFIG.runtime.applyInsight(runState, BLADE_POC);
        syncStat();
      }
      G.paused = false;
      if (WAVE_POC === 40 || WAVE_POC === 55) {
        G.wave = WAVE_POC;
        G.waveTimer = 0;
        G.waveKills = 0;
        G.spawnAcc = 0;
      }
      const p1 = ENESPR.boss.p1, base = "assets/boss/xuanming-p1/";
      const loadP1 = (bucket, index, path2) => {
        const img = new Image();
        img.onload = () => {
          bucket[index] = img;
          p1.ok = p1.manifest.filter(Boolean).length === 4;
        };
        img.src = base + path2;
      };
      for (let i = 1; i <= 4; i++) loadP1(p1.manifest, i - 1, "BOSS_XUANMING_P1_manifest_" + String(i).padStart(2, "0") + ".png");
      for (let i = 1; i <= 3; i++) loadP1(p1.skill, i - 1, "BOSS_XUANMING_P1_skill_" + String(i).padStart(2, "0") + ".png");
      for (let i = 1; i <= 4; i++) loadP1(p1.hurt, i - 1, "BOSS_XUANMING_P1_hurt_" + String(i).padStart(2, "0") + ".png");
      for (let i = 1; i <= 4; i++) {
        loadP1(p1.projectiles.heavyCore, i - 1, "projectiles/BOSS_XUANMING_HEAVY_CORE_" + String(i).padStart(2, "0") + ".png");
        loadP1(p1.projectiles.ringWave, i - 1, "projectiles/BOSS_XUANMING_RING_WAVE_" + String(i).padStart(2, "0") + ".png");
      }
      SND.startMusic();
      if (ACTOR_POC) spawnActorPocBlade();
    }
    function startTruthPoc(id) {
      if (!INK_CONFIG.insightById[id]) return;
      start("boss-fast");
      const formation = INK_CONFIG.insights.find((item) => item.category === "formation");
      if (formation) INK_CONFIG.runtime.chooseStartingFormation(runState, formation.id);
      pendingFormationStart = null;
      resetLevelChoice();
      G.paused = false;
      runState.activeTruth = id;
      stat.count = 8;
      G.reserve = 2;
      G.mana = Math.max(stat.manaMax, 400);
      G.hpLocked = true;
      document.getElementById("splash").style.display = "none";
      document.getElementById("overlay")?.classList.remove("show");
      const testTools = document.getElementById("bosstesttools");
      testTools.classList.add("show");
      testTools.style.display = "";
      truthCooldown = 0;
      truthFx = null;
      refreshTruthButton();
      updateHUD();
    }
    function spawnActorPocBlade() {
      if (!ACTOR_POC || !G.player) return;
      G.enemies = G.enemies.filter((en) => !en.actorPoc);
      const hp = 999999;
      G.enemies.push({
        x: W * 0.5,
        y: Math.max(PLAY_TOP + 115, H * 0.3),
        r: 23,
        hp,
        max: hp,
        sp: 0,
        c: "#352f43",
        tier: 1,
        type: "blade",
        species: "actorPocBlade",
        speciesName: "墨刃兵 POC",
        ai: "seek",
        actorPoc: true,
        actorPocTick: 0,
        contactDamage: 0,
        xpValue: 0,
        visualScale: 1.42,
        visualHeight: 72,
        animRate: 0.055,
        aiT: 0,
        aiSeed: 0,
        orbitDir: 1,
        chargeX: 0,
        chargeY: 0,
        anim: 0,
        ember: 0,
        emberT: 0,
        chill: 0,
        hit: 0,
        broken: 0,
        wob: 0,
        st: {}
      });
    }
    function renderBossTestTools() {
      const lock = document.getElementById("bosstestlock");
      if (!lock) return;
      lock.classList.toggle("on", !!G.hpLocked);
      lock.setAttribute("aria-pressed", G.hpLocked ? "true" : "false");
      lock.textContent = G.hpLocked ? "鎖血中" : "鎖血";
      const preset = document.getElementById("bosstestpreset");
      if (preset) preset.classList.toggle("on", !!G.bossPreset60);
    }
    function bossTestWave60Preset() {
      if (!G.bossTest || !G.player) return;
      const plan = {
        form_chain: 5,
        momentum_swift: 5,
        momentum_return: 5,
        intent_erosion: 5,
        intent_sever: 5,
        cultivate_edge: 5,
        cultivate_breath: 5,
        cultivate_temper: 5,
        cultivate_focus: 5,
        cultivate_breadth: 5,
        intent_restore: 5,
        momentum_break: 4
      };
      runState = INK_CONFIG.runtime.createRunState({}, 1);
      for (const id in plan) for (let i = 0; i < plan[id]; i++) INK_CONFIG.runtime.applyInsight(runState, id);
      G.level = 60;
      G.xp = 0;
      G.xpNeed = 6;
      for (let lv = 1; lv < 60; lv++) G.xpNeed = Math.round(G.xpNeed * 1.16 + 4);
      G.pendingLevels = 0;
      G.bossPreset60 = true;
      G.bossFightFrames = 0;
      G.bossKillSecs = null;
      syncStat();
      G.player.max = stat.hpMax;
      G.player.hp = G.player.max;
      G.mana = stat.manaMax;
      G.hpLocked = false;
      G.auto = false;
      G.autoUsed = false;
      G.autoTimer = 0;
      G.commands.length = 0;
      G.swords.length = 0;
      G.bossShots.length = 0;
      dpsReset();
      const boss = G.enemies.find((en) => en.isBoss && !en.showcaseGhost);
      if (boss) {
        boss.hp = boss.max;
        boss.phaseSeen = 1;
        boss.bossState = "manifest";
        boss.bossT = 0;
        boss.bossSide = 0;
        boss.bossAngle = -Math.PI / 2;
        boss.attackSeq = 0;
        boss.attackKind = "triple";
        boss.alpha = 0.08;
        placeBoss(boss, boss.bossAngle, bossOrbitRadius(boss.bossSide));
      }
      document.getElementById("overlay").classList.remove("show");
      renderAutoBtn();
      renderBossTestTools();
      updateHUD();
    }
    function bossTestLevel(delta) {
      if (!G.bossTest || !G.player) return;
      if (delta > 0) {
        gainXP(Math.max(1, G.xpNeed - G.xp));
        return;
      }
      if (levelChoiceOpen()) return;
      const oldMax = G.player.max || 1, ratio = Math.max(0, G.player.hp) / oldMax;
      G.level = Math.max(1, G.level - 1);
      G.xp = 0;
      G.xpNeed = Math.max(6, Math.round((G.xpNeed - 4) / 1.16));
      syncStat();
      G.player.max = stat.hpMax;
      G.player.hp = G.hpLocked ? G.player.max : Math.max(1, Math.min(G.player.max, G.player.max * ratio));
      G.mana = Math.min(stat.manaMax, G.mana);
      G.banner = { txt: "測試降級 · " + G.level, life: 1 };
      updateHUD();
    }
    function toggleBossTestHpLock() {
      if (!G.bossTest || !G.player) return;
      G.hpLocked = !G.hpLocked;
      if (G.hpLocked) G.player.hp = G.player.max;
      renderBossTestTools();
      updateHUD();
    }
    function bossTestSwordCount(delta) {
      if (!G.bossTest || !runState) return;
      runState.stats.swordCount = Math.max(1, Math.min(12, (runState.stats.swordCount | 0) + delta));
      syncStat();
      G.banner = { txt: "測試飛劍 · " + stat.count, life: 1 };
      updateHUD();
    }
    function bossTestNextPhase() {
      if (!G.bossTest) return;
      const en = G.enemies.find((x) => x.isBoss);
      if (!en) return;
      const p = bossPhase(en), ratio = p === 1 ? 0.69 : p === 2 ? 0.39 : 0.99;
      en.hp = Math.max(1, en.max * ratio);
      en.attackKind = p === 1 ? "ring" : "triple";
      en.attackSeq = (en.attackSeq || 0) + 1;
      updateHUD();
    }
    function bossTestFourDirections() {
      if (!G.bossTest) return;
      const real = G.enemies.find((en) => en.isBoss && !en.showcaseGhost);
      if (!real) return;
      G.enemies = G.enemies.filter((en) => !en.showcaseGhost);
      G.bossShowcase = ((G.bossShowcase || 0) + 1) % 3;
      const btn = document.getElementById("bosstestfour");
      if (btn) {
        btn.classList.toggle("on", !!G.bossShowcase);
        btn.textContent = G.bossShowcase === 1 ? "四向·待機" : G.bossShowcase === 2 ? "四向·攻擊" : "四向";
      }
      if (!G.bossShowcase) {
        nextBossManifest(real);
        return;
      }
      G.bossShots.length = 0;
      real.bossState = G.bossShowcase === 2 ? "lunge" : "orbit";
      real.bossT = G.bossShowcase === 2 ? 32 : 0;
      real.alpha = 1;
      for (let side = 0; side < 4; side++) {
        const en = side === 0 ? real : Object.assign({}, real, { showcaseGhost: true, st: {} });
        en.bossSide = side;
        en.bossAngle = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][side];
        placeBoss(en, en.bossAngle, bossOrbitRadius(side));
        en.face = Math.atan2(G.player.y - en.y, G.player.x - en.x);
        if (side > 0) G.enemies.push(en);
      }
      G.banner = { txt: "四向比例檢視", life: 1 };
      updateHUD();
    }
    function bossTestFang() {
      if (!G.bossTest || !G.player) return;
      const kind = ENEMY_KINDS.find((k) => k.id === "fang");
      if (!kind) return;
      G.enemies.length = 0;
      G.bossShots.length = 0;
      G.commands.length = 0;
      G.swords.length = 0;
      G.anchors.length = 0;
      G.anchorLinks.length = 0;
      G.wave = 34;
      G.waveTimer = 0;
      G.spawnAcc = 0;
      G.hpLocked = true;
      G.player.hp = G.player.max;
      const hp = 999999;
      G.enemies.push({
        x: W * 0.82,
        y: H * 0.34,
        r: kind.r,
        hp,
        max: hp,
        sp: kind.sp,
        c: kind.c,
        tier: kind.tier,
        type: kind.type,
        species: kind.id,
        speciesName: kind.name,
        ai: kind.ai,
        contactDamage: 0,
        xpValue: 0,
        visualScale: kind.visualScale,
        visualHeight: kind.visualHeight,
        animRate: kind.animRate,
        aiT: 0,
        aiSeed: 0,
        orbitDir: 1,
        chargeX: 0,
        chargeY: 0,
        anim: 0,
        ember: 0,
        emberT: 0,
        chill: 0,
        hit: 0,
        broken: 0,
        wob: 0,
        st: {},
        facing: 1
      });
      G.banner = null;
      renderBossTestTools();
      updateHUD();
    }
    function beginDeath() {
      if (G.deathT > 0) return;
      drawing = false;
      path = [];
      G.hurtT = 0;
      G.castT = 0;
      G.commands.length = 0;
      G.swords.length = 0;
      G.anchors.length = 0;
      G.anchorLinks.length = 0;
      const S = heroSet();
      if (!S.ok) {
        gameOver();
        return;
      }
      const hasDeath = !!(S.death && S.death.length);
      G.deathMax = hasDeath ? 63 : 56;
      G.deathT = G.deathMax;
      if (!hasDeath) {
        const P = G.player;
        splash(P.x, P.y - P.r * 1.4, "#2b2620", 2.8);
        for (let k = 0; k < 30; k++) ink(
          P.x + (Math.random() - 0.5) * 34,
          P.y - P.r * 1.6 + (Math.random() - 0.5) * 70,
          (Math.random() - 0.5) * 5.5,
          (Math.random() - 0.5) * 5.5 - 0.8,
          10 + Math.random() * 20
        );
        stain(P.x, P.y + P.r * 0.6, P.r * 1.6, "44,38,32");
        shake(10);
        flash(0.14, "40,34,28");
      }
      SND.over();
    }
    function gameOver() {
      G.running = false;
      G.pendingLevels = 0;
      if (!heroSet().ok) SND.over();
      document.getElementById("bosstesttools").classList.remove("show");
      resetLevelChoice();
      drawing = false;
      path = [];
      curLen = 0;
      maxed = false;
      document.getElementById("overlay").classList.remove("show");
      let earned = G.kills + G.wave * 5 + G.level * 3;
      const autoed = G.autoUsed;
      if (autoed) earned = Math.floor(earned * 0.5);
      meta.souls += earned;
      let nb = false;
      if (!autoed) {
        nb = G.kills > meta.best.kills;
        if (G.kills > meta.best.kills) meta.best.kills = G.kills;
        if (G.wave > meta.best.wave) meta.best.wave = G.wave;
        if (G.level > meta.best.level) meta.best.level = G.level;
      }
      saveMeta();
      let hint = "";
      const nxt = nextGoal();
      if (nxt) {
        const need = Math.max(0, nxt.cost - meta.souls);
        hint = need > 0 ? '再積 <b style="color:#c08a2e">' + need + "</b> 墨魂可習得〈" + nxt.name + "〉" : "墨魂已足以習得〈" + nxt.name + "〉，速入轉世閣";
      }
      const line = (k, l, w) => "斬妖 " + k + " · 道行 " + num2cn(l) + " 重 · 第 " + num2cn(w) + " 境";
      document.getElementById("finaltxt").innerHTML = '<div class="fsec"><div class="fh">此 世</div><div class="fl">' + line(G.kills, G.level, G.wave) + (nb ? ' <span style="color:#c08a2e">✦ 新猷</span>' : "") + '</div></div><div class="fsec"><div class="fh">歷 史 最 佳</div><div class="fl">' + line(meta.best.kills, meta.best.level, meta.best.wave) + '</div></div><div class="fsec"><div class="fl">獲得墨魂 <b>+' + earned + '</b></div><div class="fl">現有墨魂 <b>' + meta.souls + "</b></div>" + (autoed ? '<div class="fnote">自動御劍 · 收益減半且不計紀錄</div>' : "") + (hint ? '<div class="fnote">' + hint + "</div>" : "") + "</div>";
      document.getElementById("gameover").style.display = "flex";
    }
    function nextGoal() {
      let best = null;
      for (const v of rebirthView2()) {
        if (v.rank >= v.maxRank || v.purchase.reason === "requirements") continue;
        const c = v.purchase.cost != null ? v.purchase.cost : v.costs[v.rank];
        if (c != null && (!best || c < best.cost)) best = { name: v.name, cost: c };
      }
      return best;
    }
    function rebirthView2() {
      return INK_CONFIG.runtime.getRebirthView(buildPermanentSave());
    }
    function respecInfo() {
      const inRun = !!(G.running && runState);
      const times = inRun ? runState.resetInsightTimes || 0 : 0;
      const cost = INK_CONFIG.runtime.calcResetCost(times);
      const pills = meta.inkPills || 0;
      const usedThisWave = inRun && G.respecWave === G.wave;
      let pay = "免費", usePill = false, ok = true, why = "";
      if (cost > 0) {
        if (pills > 0) {
          pay = "洗墨丹 ×1(存 " + pills + ")";
          usePill = true;
        } else {
          pay = cost + " 墨魂(存 " + meta.souls + ")";
          if (meta.souls < cost) {
            ok = false;
            why = "墨魂不足";
          }
        }
      }
      if (!inRun) {
        ok = false;
        why = "未在局中";
      } else if (usedThisWave) {
        ok = false;
        why = "本波已重塑 · 下一波再凝神";
      }
      return { inRun, times, cost, pills, pay, usePill, ok, why };
    }
    function doRespec(state) {
      if (state.usePill) meta.inkPills = Math.max(0, (meta.inkPills || 0) - 1);
      else if (state.cost > 0) meta.souls -= state.cost;
      saveMeta();
      runState.resetInsightTimes = (runState.resetInsightTimes || 0) + 1;
      G.respecWave = G.wave;
      INK_CONFIG.runtime.resetAllInsights(runState);
      syncStat();
      G.mana = Math.min(G.mana, stat.manaMax);
      G.enemies.forEach((enemy) => {
        enemy.st = {};
      });
      floatText(G.player.x, G.player.y - 40, "劍意重塑", "#7a5a2b");
      SND.pick();
      flash(0.16, "240,232,210");
      updateHUD();
    }
    function renderAutoBtn() {
      const b = document.getElementById("autobtn");
      b.innerHTML = '<span class="vt"><b>御</b><b>劍</b></span>';
      b.classList.toggle("on", !!G.auto);
      b.setAttribute("aria-pressed", String(!!G.auto));
      b.title = G.auto ? "自動御劍：開" : "自動御劍：關";
    }
    function toggleAuto() {
      if (!G.running) return;
      G.auto = !G.auto;
      SND.ui();
      renderAutoBtn();
    }
    function inkSplashAt(x, y) {
      let layer = document.getElementById("inkfx");
      if (!layer) {
        layer = document.createElement("div");
        layer.id = "inkfx";
        document.body.appendChild(layer);
      }
      const wrap = document.createElement("div");
      wrap.style.position = "absolute";
      wrap.style.left = x + "px";
      wrap.style.top = y + "px";
      const ring = document.createElement("div");
      ring.className = "ink-splat";
      ring.style.left = "0";
      ring.style.top = "0";
      ring.style.width = "64px";
      ring.style.height = "64px";
      ring.style.background = "radial-gradient(rgba(232,222,198,.30),rgba(232,222,198,0) 70%)";
      ring.style.animation = "inkRing .5s ease-out forwards";
      wrap.appendChild(ring);
      for (let i = 0; i < 4; i++) {
        const c = document.createElement("div");
        c.className = "ink-splat";
        const s = 18 + Math.random() * 22;
        c.style.left = (Math.random() - 0.5) * 16 + "px";
        c.style.top = (Math.random() - 0.5) * 16 + "px";
        c.style.width = s + "px";
        c.style.height = s + "px";
        c.style.animation = "inkCore .5s ease-out forwards";
        wrap.appendChild(c);
      }
      const n = 9 + (Math.random() * 5 | 0);
      for (let i = 0; i < n; i++) {
        const d = document.createElement("div");
        d.className = "ink-splat";
        const ang = Math.random() * 6.283, dist = 30 + Math.random() * 70, s = 3 + Math.random() * 8;
        d.style.left = "0";
        d.style.top = "0";
        d.style.width = s + "px";
        d.style.height = s + "px";
        d.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
        d.style.setProperty("--dy", (Math.sin(ang) * dist).toFixed(1) + "px");
        d.style.animation = "inkOut " + (0.45 + Math.random() * 0.25).toFixed(2) + "s ease-out forwards";
        wrap.appendChild(d);
      }
      layer.appendChild(wrap);
      setTimeout(() => wrap.remove(), 850);
    }
    const ART_CATEGORY_NAME = { form: "劍陣", momentum: "劍行", intent: "劍痕", cultivation: "劍稟", blade: "劍型", truth: "真意" };
    const ART_RANK_NAME = ["零階", "一階", "二階", "三階", "四階", "五階"];
    function artTierName(rank) {
      return ART_RANK_NAME[Math.max(0, Math.min(5, Number(rank) || 0))];
    }
    function renderSwordArts() {
      const list = document.getElementById("artslist");
      if (!list) return;
      const learned = INK_CONFIG.insights.filter((a) => runState && Number(runState.ranks[a.id] || 0) > 0);
      if (!learned.length) {
        list.innerHTML = '<div class="artempty">尚未習得劍訣</div>';
        return;
      }
      const groups = {};
      for (const a of learned) (groups[a.category] || (groups[a.category] = [])).push(a);
      list.innerHTML = Object.keys(groups).map((cat) => '<section class="artgroup"><h3>' + ART_CATEGORY_NAME[cat] + "</h3>" + groups[cat].map((a) => {
        const rank = Number(runState.ranks[a.id] || 0);
        const totals = INK_CONFIG.runtime.cumulativeEffectLines(a, rank);
        const tier = runState.tierLevel?.[a.id] || 0, kills = runState.tierKills?.[a.id];
        const mastery = tier > 0 ? ["", "小成", "大成", "圓滿"][tier] : kills == null ? "" : "精進中";
        const killText = kills == null ? "" : " · " + kills + " 斬";
        return '<div class="artrow"><div class="arttitle"><b>' + a.name + "</b><span>" + artTierName(rank) + (mastery ? " · " + mastery : "") + killText + '</span></div><ul class="arttotals">' + totals.map((line) => "<li>" + line + "</li>").join("") + "</ul></div>";
      }).join("") + "</section>").join("");
    }
    function toggleSwordArts(force) {
      const panel = document.getElementById("artsPanel"), open = force == null ? !panel.classList.contains("show") : !!force;
      if (open) renderSwordArts();
      panel.classList.toggle("show", open);
      panel.setAttribute("aria-hidden", String(!open));
      if (G.running) G.paused = open || isPausedByUser();
      if (!meta.mute) SND.ui();
    }
    renderSoundButton();
    bindVolumeSettings();
    renderVolumeSettings();
    function startMenuFromGesture() {
      SND.unlock();
      if (G.running || meta.mute) return false;
      SND.startMenu();
      return SND.menuPlaying();
    }
    bindHeroChoices();
    function alignHud() {
      computePlayTop();
    }
    bindSettingsSegments();
    applyQuality();
    alignHud();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(alignHud));
    setTimeout(alignHud, 600);
    bindPauseTabs();
    enableDragScroll("pausepanel");
    enableDragScroll("metabox");
    enableDragScroll("shopbox");
    function handleGlobalKeydown(e) {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        togglePause();
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        toggleAuto();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleSound();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleDiag();
      } else if (FXKEY[e.key]) {
        e.preventDefault();
        const k = FXKEY[e.key][0];
        FX[k] = !FX[k];
        DIAG.hist.length = 0;
        if (!DIAG.on) toggleDiag();
      } else if (e.key === "7") {
        e.preventDefault();
        NOAUDIO = !NOAUDIO;
        SND.hardMute(NOAUDIO);
        DIAG.hist.length = 0;
        if (!DIAG.on) toggleDiag();
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        if (!G.running) {
          const b = document.getElementById("bosstestbtn");
          b.classList.toggle("show");
          if (b.classList.contains("show")) b.focus();
        }
      } else if ((e.key === "v" || e.key === "V") && !G.running) {
        e.preventDefault();
        bisectDraw();
      } else if ((e.key === "n" || e.key === "N") && !G.running) {
        e.preventDefault();
        bisectMicro();
      } else if ((e.key === "k" || e.key === "K") && !G.running) {
        e.preventDefault();
        bisectPage();
      } else if (e.key === "9" && !G.running) {
        e.preventDefault();
        NODRAW = !NODRAW;
        DIAG.hist.length = 0;
        if (!DIAG.on) toggleDiag();
      } else if (e.key === "0" && !G.running) {
        e.preventDefault();
        const off = Object.keys(FX).some((k) => FX[k]);
        Object.keys(FX).forEach((k) => FX[k] = !off);
        DIAG.hist.length = 0;
        if (!DIAG.on) toggleDiag();
      }
    }
    let lastLoopErrorAt = 0;
    configureBoot({
      diagFrame: (ts) => diagFrame(ts),
      getDiag: () => DIAG,
      getFps: () => meta.fps,
      isNoDraw: () => NODRAW,
      update: () => update(),
      draw: () => {
        draw();
        drawTruthFx();
      },
      degradeQuality: () => {
        if (meta.quality === "low" && !FX.vig && !FX.trail && !FX.ink && !FX.part && !FX.glow) return;
        meta.quality = "low";
        applyQuality();
        saveMeta();
      },
      onLoopError: (error) => {
        resetBootClock();
        const now = performance.now();
        if (!lastLoopErrorAt || now - lastLoopErrorAt > 1e3) {
          lastLoopErrorAt = now;
          console.error("[Inkblade] recovered frame error", error);
        }
      }
    });
    bindBootEvents({
      inkSplashAt,
      stamp,
      canvas: { down, move, up, cancel: cancelDraw },
      menuGesture: startMenuFromGesture,
      keydown: handleGlobalKeydown,
      clicks: {
        startbtn: start,
        bosstestbtn: () => start("boss"),
        bosstestswordup: () => bossTestSwordCount(1),
        bosstestsworddown: () => bossTestSwordCount(-1),
        bosstestpreset: bossTestWave60Preset,
        bosstestup: () => bossTestLevel(1),
        bosstestdown: () => bossTestLevel(-1),
        bosstestphase: bossTestNextPhase,
        bosstestfour: bossTestFourDirections,
        bosstestfang: bossTestFang,
        bosstestlock: toggleBossTestHpLock,
        bosstestretry: () => start("boss-fast"),
        againbtn: start,
        metabtn: openMeta,
        splashmetabtn: openMeta,
        metaplaybtn: start,
        metaclosebtn: closeMeta,
        swordartsbtn: () => toggleSwordArts(true),
        artsclose: () => toggleSwordArts(false),
        artsPanel: (e) => {
          if (e.target.id === "artsPanel") toggleSwordArts(false);
        },
        pausebtn: () => togglePause(),
        autobtn: toggleAuto,
        truthbtn: castActiveTruth,
        rerollbtn: rerollCards,
        sndbtn: toggleSound,
        resumebtn: () => togglePause(false),
        respecbtn: requestRespec,
        pausequitbtn: () => {
          togglePause(false);
          gameOver();
        },
        splashshopbtn: openShop,
        metashopbtn: openShop,
        shopclosebtn: closeShop
      }
    });
    startBoot();
    if (TRUTH_POC) setTimeout(() => startTruthPoc(TRUTH_POC), 1400);
  })();
})();

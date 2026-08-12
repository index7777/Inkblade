/* 墨劍訣 · CC0 sample-based sound system
 * 以 HTMLAudioElement 音池播放，支援 file:// 雙擊與行動瀏覽器。
 * 授權與來源見 assets/audio/SOURCES.md。
 */
(function installInkSound(global) {
  'use strict';

  const ROOT = 'assets/audio/sfx/';
  // 戰鬥樂依波次分段:1–20 → battle01,21–40 → battle02,41–60 → battle03。
  const TRACKS = ['assets/audio/bgm/battle01.mp3','assets/audio/bgm/battle02.mp3','assets/audio/bgm/battle03.mp3'];
  const TRACK = TRACKS[0];
  function bandOf(wave){ return wave>=41 ? 2 : wave>=21 ? 1 : 0; }   // 回傳 TRACKS 索引
  let curBand = 0;
  const BANK = Object.freeze({
    cast:       { files:['cast_01.ogg','cast_02.ogg','cast_03.ogg','cast_04.ogg'], volume:0.42, rate:[0.92,1.08], voices:5, cooldown:22 },
    hit:        { files:['hit_01.ogg','hit_02.ogg','hit_03.ogg'], volume:0.28, rate:[0.96,1.08], voices:6, cooldown:30 },
    kill:       { files:['kill_01.ogg','kill_02.ogg'], volume:0.38, rate:[0.88,1.04], voices:4, cooldown:45 },
    killElite:  { files:['kill_elite.ogg'], volume:0.52, rate:[0.86,0.96], voices:3, cooldown:80 },
    splash:     { files:['ink_splash_01.ogg','ink_splash_02.ogg'], volume:0.43, rate:[0.88,1.02], voices:4, cooldown:65 },
    hurt:       { files:['hurt.ogg'], volume:0.48, rate:[0.94,1.02], voices:2, cooldown:120 },
    noMana:     { files:['no_mana.ogg'], volume:0.34, rate:[0.92,1.0], voices:2, cooldown:180 },
    level:      { files:['level_up.ogg'], volume:0.48, rate:[0.98,1.02], voices:2, cooldown:220 },
    pick:       { files:['pick.ogg'], volume:0.38, rate:[0.98,1.05], voices:3, cooldown:90 },
    wave:       { files:['wave.ogg'], volume:0.45, rate:[0.96,1.01], voices:2, cooldown:500 },
    over:       { files:['game_over.ogg'], volume:0.52, rate:[0.78,0.84], voices:1, cooldown:800 },
    ui:         { files:['ui_confirm.ogg'], volume:0.25, rate:[0.98,1.06], voices:4, cooldown:45 },
    uiMove:     { files:['ui_move.ogg'], volume:0.16, rate:[1.08,1.18], voices:3, cooldown:55 },
    uiBack:     { files:['ui_back.ogg'], volume:0.22, rate:[0.96,1.02], voices:3, cooldown:80 }
  });

  const pools = new Map();
  const lastPlayed = new Map();

  // ── WebAudio 音效層 ────────────────────────────────────────────
  // 原本音效走 HTMLAudioElement,每次播放要 pause() → currentTime=0 → play()。
  // 那組操作會在主執行緒上同步重置一條壓縮音訊串流 —— 實測(6 倍 CPU 節流)
  // 每次呼叫 1.8~6.5ms,而它剛好只發生在「出劍」與「受擊」,就是手機卡幀的來源。
  // 改為預先解碼成 AudioBuffer,播放時只建一個 BufferSource(微秒等級,不阻塞)。
  // file:// 直接雙擊開啟時 fetch 會被擋,那時自動退回原本的 HTMLAudio 音池。
  let actx = null, wa = false;
  const buffers = new Map();          // 檔名 → AudioBuffer
  const liveSources = new Set();
  function ensureCtx() {
    if (actx) return actx;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try { actx = new AC(); } catch (_) { actx = null; }
    return actx;
  }
  function loadBuffers() {
    const ctx = ensureCtx();
    if (!ctx) return;
    const names = new Set();
    for (const k in BANK) BANK[k].files.forEach(f => names.add(f));
    let okCount = 0, done = 0, total = names.size;
    names.forEach(file => {
      fetch(ROOT + file)
        .then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('http')))
        .then(buf => new Promise((res, rej) => {
          // 舊版 Safari 只支援 callback 形式的 decodeAudioData
          const pr = ctx.decodeAudioData(buf, res, rej);
          if (pr && pr.then) pr.then(res, rej);
        }))
        .then(b => { buffers.set(file, b); okCount += 1; })
        .catch(() => {})
        .then(() => { done += 1; if (done === total) wa = okCount > 0; });
    });
  }
  function playBuffer(spec, file, pitch, volumeScale) {
    const ctx = actx, buf = buffers.get(file);
    if (!ctx || !buf) return false;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (_) {} }
    const v = settings();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.max(0.5, Math.min(2, pitch));
    const g = ctx.createGain();
    g.gain.value = Math.max(0, Math.min(1, spec.volume * volumeScale * v.master * v.sfx));
    src.connect(g); g.connect(ctx.destination);
    src.onended = () => { liveSources.delete(src); try { g.disconnect(); } catch (_) {} };
    liveSources.add(src);
    try { src.start(0); } catch (_) { liveSources.delete(src); return false; }
    return true;
  }
  let enabled = true;
  let musicEnabled = true;
  let hardMuted = false;
  let music = null;
  let coreSfxWarmed = false;

  function settings() {
    const fallback = { master:0.85, music:0.62, sfx:0.75 };
    const supplied = typeof global.getInkAudioSettings === 'function' ? global.getInkAudioSettings() : null;
    const data = supplied || fallback;
    return {
      master: Number.isFinite(data.master) ? data.master : fallback.master,
      music: Number.isFinite(data.music) ? data.music : fallback.music,
      sfx: Number.isFinite(data.sfx) ? data.sfx : fallback.sfx
    };
  }

  function makeAudio(src) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.playsInline = true;
    return audio;
  }

  function ensurePool(name) {
    if (pools.has(name)) return pools.get(name);
    const spec = BANK[name];
    const pool = [];
    // voices 是「這個音效可同時播放的總數」，不是每個變體各建 voices 份。
    // 舊寫法會建立 files × voices 個 Audio：cast 20 個、hit 18 個；手機首次播放時
    // 同時預載/解碼大量播放器，會在出劍或受擊音效觸發時卡住主執行緒。
    for (let i=0; i<spec.voices; i+=1)
      pool.push(makeAudio(ROOT + spec.files[i % spec.files.length]));
    pools.set(name, pool);
    return pool;
  }

  function chooseVoice(name) {
    const pool = ensurePool(name);
    const idle = pool.find((audio) => audio.paused || audio.ended);
    return idle || pool.reduce((oldest, audio) =>
      (audio.currentTime || 0) > (oldest.currentTime || 0) ? audio : oldest, pool[0]);
  }

  function play(name, options = {}) {
    if (!enabled || hardMuted) return null;
    const spec = BANK[name];
    if (!spec) return null;
    const time = performance.now();
    if (time - (lastPlayed.get(name) || 0) < spec.cooldown) return null;
    lastPlayed.set(name, time);
    const [minRate,maxRate] = spec.rate;
    const volumeScale = Number.isFinite(options.volume) ? options.volume : 1;
    const pitch = Number.isFinite(options.rate) ? options.rate : minRate + Math.random()*(maxRate-minRate);
    // WebAudio 路徑:不碰 HTMLAudioElement,不會有同步重置串流的成本
    if (wa) {
      const file = spec.files[(Math.random()*spec.files.length)|0];
      if (playBuffer(spec, file, pitch, volumeScale)) return null;
    }
    const audio = chooseVoice(name);
    const v = settings();
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = Math.max(0.5, Math.min(2, pitch));
      audio.volume = Math.max(0, Math.min(1, spec.volume * volumeScale * v.master * v.sfx));
      const promise = audio.play();
      if (promise && promise.catch) promise.catch(() => {});
    } catch (_) {}
    return audio;
  }

  function ensureMusic() {
    if (music) return music;
    music = makeAudio(TRACKS[curBand]);
    music.loop = true;
    music.addEventListener('error', () => { musicEnabled = false; }, { once:true });
    return music;
  }
  // 依波次切換戰鬥樂:換段時淡出舊曲、換源、淡入新曲(同一 <audio> 物件換 src)。
  function setBand(band){
    band = Math.max(0, Math.min(TRACKS.length-1, band|0));
    if (band === curBand && music) return;
    curBand = band;
    if (!music) { if (enabled && musicEnabled && !hardMuted) startMusic(); return; }
    const v = settings(), target = enabled && musicEnabled && !hardMuted ? Math.min(1,v.master*v.music) : 0;
    const swap = () => { try { music.src = TRACKS[curBand]; music.loop = true; music.currentTime = 0;
        if (enabled && musicEnabled && !hardMuted) { const pr=music.play(); if(pr&&pr.catch)pr.catch(()=>{}); } } catch(_){} };
    // 0.5s 淡出 → 換源 → 0.8s 淡入
    let t0=null; const dur=500; const from=music.volume;
    function fade(ts){ if(t0==null)t0=ts; const k=Math.min(1,(ts-t0)/dur); music.volume=from*(1-k);
      if(k<1){ requestAnimationFrame(fade); } else { swap();
        let s0=null; function fin(ts2){ if(s0==null)s0=ts2; const j=Math.min(1,(ts2-s0)/800); music.volume=target*j; if(j<1)requestAnimationFrame(fin);} requestAnimationFrame(fin);
      } }
    requestAnimationFrame(fade);
  }

  // ── 首頁 BGM(game_op):淡入淡出、Loop,與戰鬥樂各自獨立 ──
  const MENU_TRACK = 'assets/audio/bgm/game_op_loop.mp3';
  let menu = null, menuRAF = 0;
  function ensureMenu() {
    if (menu) return menu;
    menu = makeAudio(MENU_TRACK); menu.loop = true;
    menu.addEventListener('error', () => {}, { once:true });
    return menu;
  }
  function fadeVol(audio, to, ms, then) {
    if (!audio) return;
    if (menuRAF) cancelAnimationFrame(menuRAF);
    const from = audio.volume, t0Ref = {}; let t0 = null;
    function step(ts){ if(t0==null)t0=ts; const k=ms<=0?1:Math.min(1,(ts-t0)/ms);
      audio.volume = Math.max(0, Math.min(1, from + (to-from)*k));
      if(k<1){ menuRAF=requestAnimationFrame(step); } else { menuRAF=0; then&&then(); } }
    menuRAF = requestAnimationFrame(step);
  }
  function startMenu() {
    if (!enabled || !musicEnabled || hardMuted) return;
    const a = ensureMenu(); const v = settings();
    const tgt = Math.min(1, v.master*v.music);
    a.volume = 0; const pr = a.play(); if (pr && pr.catch) pr.catch(()=>{});
    fadeVol(a, tgt, 1200);
  }
  function stopMenu(fadeMs) {
    if (!menu) return;
    if (fadeMs === 0) {
      if (menuRAF) { cancelAnimationFrame(menuRAF); menuRAF = 0; }
      menu.volume = 0;
      try { menu.pause(); menu.currentTime = 0; } catch (_) {}
      return;
    }
    if (menu.paused) { menu.volume = 0; return; }
    fadeVol(menu, 0, fadeMs==null?600:fadeMs, () => { try { menu.pause(); } catch(_){} });
  }

  function applyVolume() {
    const v = settings();
    if (menu && !menu.paused) menu.volume = enabled && musicEnabled && !hardMuted ? Math.min(1,v.master*v.music) : 0;
    if (music) music.volume = enabled && musicEnabled && !hardMuted ? Math.min(1,v.master*v.music) : 0;
    for (const [name,pool] of pools) {
      const spec = BANK[name];
      for (const audio of pool) audio.volume = enabled && !hardMuted ? Math.min(1,spec.volume*v.master*v.sfx) : 0;
    }
  }

  function startMusic() {
    if (!enabled || !musicEnabled || hardMuted) return;
    stopMenu(400);                       // 進戰鬥即淡出首頁樂,兩者不重疊
    const audio = ensureMusic();
    applyVolume();
    const promise = audio.play();
    if (promise && promise.catch) promise.catch(() => {});
  }

  function stopMusic() { if (music) music.pause(); }

  // 先建立音池即可；真正播放仍由使用者手勢觸發。
  function unlock() {
    // HTMLAudio 不需要像 WebAudio 一樣預建所有音效節點；用到時再建立小型音效池。
    // 只在使用者手勢中啟動音樂，避免首頁一次配置數十個 Audio 元素。
    ensureMusic();
    applyVolume();
    if (!coreSfxWarmed) {
      coreSfxWarmed = true;
      ensureCtx();
      loadBuffers();                       // 預先解碼成 AudioBuffer(成功就走 WebAudio)
      // 音池仍然建立,當作 file:// 或解碼失敗時的退路
      const warm = () => ['cast','hit','hurt'].forEach(ensurePool);
      if (typeof requestIdleCallback === 'function') requestIdleCallback(warm,{ timeout:1200 });
      else setTimeout(warm,0);
    }
  }

  const api = {
    get on() { return enabled; },
    setOn(value) { enabled = Boolean(value); if (!enabled) { stopMusic(); stopMenu(0); api.stopAll(); } applyVolume(); },
    unlock,
    applyVol: applyVolume,
    startMusic,
    stopMusic,
    music(value) { musicEnabled = Boolean(value); musicEnabled ? startMusic() : stopMusic(); },
    hardMute(value) { hardMuted = Boolean(value); if (hardMuted) { stopMusic(); stopMenu(0); api.stopAll(); } else { applyVolume(); } },
    duck() {},
    // 首頁 BGM(game_op)
    startMenu, stopMenu,
    menuPlaying() { return !!(menu && !menu.paused); },
    // 依波次切換戰鬥樂段(1–20 / 21–40 / 41–60)
    intensity(wave) { setBand(bandOf(Number(wave)||1)); },
    stopAll() {
      for (const pool of pools.values()) for (const audio of pool) { try { audio.pause(); audio.currentTime=0; } catch (_) {} }
      for (const src of liveSources) { try { src.stop(0); } catch (_) {} }
      liveSources.clear();
    },

    cast(length) { play('cast',{ rate:0.92 + Math.min(0.14,Number(length||0)/5000) }); },
    hit() { play('hit'); },
    crit() { play('hit',{ volume:1.35, rate:1.16 }); setTimeout(()=>play('pick',{ volume:0.5, rate:1.16 }),18); },
    kill(tier=0) { play(tier>=2 ? 'killElite' : 'kill',{ rate:tier>=2?0.9:undefined }); },
    boom() { play('splash'); setTimeout(()=>play('killElite',{ volume:0.42, rate:0.76 }),20); },
    hurt() { play('hurt'); },
    nomana() { play('noMana'); },
    level() { play('level'); },
    pick() { play('pick'); },
    wave() { play('wave'); },
    over() { stopMusic(); play('over'); },
    ui() { play('ui'); },
    uiMove() { play('uiMove'); },
    uiBack() { play('uiBack'); }
  };

  global.SND = api;

  // 選單完整覆蓋：既有程式不必逐顆按鈕補 SND.ui()。
  // 滑過去的 uiMove 音效已移除 —— 桌面上滑鼠只是經過就叫,很吵,
  // 而且觸控裝置的 pointerover 會在點擊前一瞬間補發,等於每次點擊都響兩聲。
  document.addEventListener('click', (event) => {
    const control = event.target && event.target.closest ? event.target.closest('button,.btn,.tab,[role="button"]') : null;
    if (!control || control.classList.contains('card')) return;
    const label = String(control.textContent || control.getAttribute('aria-label') || '');
    if (/返回|關閉|取消|離開/.test(label)) play('uiBack');
    else play('ui');
  }, true);
})(typeof window !== 'undefined' ? window : globalThis);

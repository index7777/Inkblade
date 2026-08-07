/* 墨劍訣 · CC0 sample-based sound system
 * 以 HTMLAudioElement 音池播放，支援 file:// 雙擊與行動瀏覽器。
 * 授權與來源見 assets/audio/SOURCES.md。
 */
(function installInkSound(global) {
  'use strict';

  const ROOT = 'assets/audio/sfx/';
  const TRACK = 'assets/audio/bgm/battle01.mp3';
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
  let enabled = true;
  let musicEnabled = true;
  let hardMuted = false;
  let music = null;

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
    for (const file of spec.files) {
      for (let i=0; i<spec.voices; i+=1) pool.push(makeAudio(ROOT + file));
    }
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
    const audio = chooseVoice(name);
    const [minRate,maxRate] = spec.rate;
    const volumeScale = Number.isFinite(options.volume) ? options.volume : 1;
    const pitch = Number.isFinite(options.rate) ? options.rate : minRate + Math.random()*(maxRate-minRate);
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
    music = makeAudio(TRACK);
    music.loop = true;
    music.addEventListener('error', () => { musicEnabled = false; }, { once:true });
    return music;
  }

  function applyVolume() {
    const v = settings();
    if (music) music.volume = enabled && musicEnabled && !hardMuted ? Math.min(1,v.master*v.music) : 0;
    for (const [name,pool] of pools) {
      const spec = BANK[name];
      for (const audio of pool) audio.volume = enabled && !hardMuted ? Math.min(1,spec.volume*v.master*v.sfx) : 0;
    }
  }

  function startMusic() {
    if (!enabled || !musicEnabled || hardMuted) return;
    const audio = ensureMusic();
    applyVolume();
    const promise = audio.play();
    if (promise && promise.catch) promise.catch(() => {});
  }

  function stopMusic() { if (music) music.pause(); }

  // 先建立音池即可；真正播放仍由使用者手勢觸發。
  function unlock() {
    ['ui','cast','hit','kill','splash','pick','wave'].forEach(ensurePool);
    ensureMusic();
    applyVolume();
  }

  const api = {
    get on() { return enabled; },
    setOn(value) { enabled = Boolean(value); if (!enabled) { stopMusic(); api.stopAll(); } applyVolume(); },
    unlock,
    applyVol: applyVolume,
    startMusic,
    stopMusic,
    music(value) { musicEnabled = Boolean(value); musicEnabled ? startMusic() : stopMusic(); },
    hardMute(value) { hardMuted = Boolean(value); if (hardMuted) { stopMusic(); api.stopAll(); } else { applyVolume(); } },
    duck() {},
    intensity() {},
    stopAll() { for (const pool of pools.values()) for (const audio of pool) { try { audio.pause(); audio.currentTime=0; } catch (_) {} } },

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
  let lastHover = null;
  document.addEventListener('pointerover', (event) => {
    const control = event.target && event.target.closest ? event.target.closest('button,.btn,.tab,.card,[role="button"]') : null;
    if (!control || control === lastHover) return;
    lastHover = control;
    play('uiMove');
  }, { passive:true });
  document.addEventListener('pointerout', (event) => {
    if (lastHover && !lastHover.contains(event.relatedTarget)) lastHover = null;
  }, { passive:true });
  document.addEventListener('click', (event) => {
    const control = event.target && event.target.closest ? event.target.closest('button,.btn,.tab,[role="button"]') : null;
    if (!control || control.classList.contains('card')) return;
    const label = String(control.textContent || control.getAttribute('aria-label') || '');
    if (/返回|關閉|取消|離開/.test(label)) play('uiBack');
    else play('ui');
  }, true);
})(typeof window !== 'undefined' ? window : globalThis);

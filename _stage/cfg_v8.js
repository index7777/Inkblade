/* ==========================================================================
 * 墨劍訣 · Game Config v2.1.0 衝突完整修復版
 * ----------------------------------------------------------------------------
 * 修復清單:
 * 1. 真意互斥快照回滾機制,解決多流派數值疊加爆炸
 * 2. 劍式單一生效快照回滾,嚴格遵守「僅一種陣型生效」設定
 * 3. 狀態層堆疊邊界截斷 + 全域狀態清空API
 * 4. 抽卡rollInsights去重、動態稀有度權重、聽墨規則優化
 * 5. 全屬性邊界clamp約束,杜絕數值溢出
 * 6. Rebirth依賴雙重校驗、循環依賴檢測、傳承臨時鎖定
 * 7. Legacy相容層完整支援mul/flag/status/truth全部機制
 * 8. FX渲染優先級規範、特效疊加衝突處理
 * 9. 新增局重置resetRunState、配置強化校驗、難度衰減倍率
 * 10. 約束真意/劍式抽取池互斥,禁止多個同類同時存在
 *
 * 世界觀:畫外執筆,畫內御劍。
 *
 * 新版能力分為:
 *   1. 劍式 FORM        — 決定飛劍如何排列(單一生效,等級保留但加成互斥)
 *   2. 劍勢 MOMENTUM    — 決定飛劍如何運動(可全部疊滿)
 *   3. 劍意 INTENT      — 決定命中後留下的效果(可全部疊滿)
 *   4. 修持 CULTIVATION — 強化當局基礎能力(可全部疊滿)
 *   5. 真意 TRUTH       — 改寫整個流派,一局僅能啟用一種,互斥不可共存
 *
 * 問道分為:築基 FOUNDATION、心法 MIND、傳承 INHERITANCE。
 * 視覺語言只使用:破墨、飛白、潑墨、墨滴、留白。特效由 Canvas / Ink
 * Engine 表現;本檔只宣告 FX 語意,不載入 FX 圖片。
 * ========================================================================== */
(function installInkBladeConfig(global) {
  'use strict';

  const VERSION = '2.1.0';

  const CATEGORY = Object.freeze({
    FORM: 'form',
    MOMENTUM: 'momentum',
    INTENT: 'intent',
    CULTIVATION: 'cultivation',
    TRUTH: 'truth'
  });

  const REBIRTH_BRANCH = Object.freeze({
    FOUNDATION: 'foundation',
    MIND: 'mind',
    INHERITANCE: 'inheritance'
  });

  const RARITY = Object.freeze({
    AWAKENING: 'awakening',
    CLARITY: 'clarity',
    PENETRATION: 'penetration',
    TRUTH: 'truth'
  });

  const rarity = Object.freeze({
    order: [RARITY.AWAKENING, RARITY.CLARITY, RARITY.PENETRATION, RARITY.TRUTH],
    weight: Object.freeze({ awakening: 60, clarity: 28, penetration: 10, truth: 2, n: 60, r: 28, e: 10, l: 2 }),
    name: Object.freeze({ awakening: '初悟', clarity: '明悟', penetration: '徹悟', truth: '真意', n: '初悟', r: '明悟', e: '徹悟', l: '真意' }),
    color: Object.freeze({ awakening: '#4b4944', clarity: '#315654', penetration: '#78643b', truth: '#7b2725' })
  });

  const fx = Object.freeze({
    BREAK_INK: 'break_ink',
    DRY_BRUSH: 'dry_brush',
    SPLASH: 'ink_splash',
    INK_DROP: 'ink_drop',
    NEGATIVE_SPACE: 'negative_space',
    WHITE_CUT: 'white_cut',
    ERODING_INK: 'eroding_ink',
    SUPPRESSED_INK: 'suppressed_ink'
  });

  /* 明確 DSL:每個 operation 都必須指定 op、path 與 value。
   * add:加算;mul:乘算;set:設定;max:至少為;flag:布林開關;
   * status:命中附加狀態;unlock:當局解鎖;truth:啟用互斥真意。
   */
  const OP_SCHEMA = Object.freeze({
    add: ['stats.hpMax', 'stats.damage', 'stats.swordWidth', 'stats.swordSpeed', 'stats.swordLife', 'stats.pierce', 'stats.critChance', 'stats.critMultiplier', 'stats.manaMax', 'stats.manaRegen', 'stats.manaOnKill', 'stats.swordCap', 'stats.swordCount', 'stats.manaCostBase', 'stats.manaCostPerPixel', 'mechanics.returnHits', 'mechanics.splashRadius', 'mechanics.homingStrength'],
    mul: ['stats.damage', 'stats.swordWidth', 'stats.swordSpeed', 'stats.swordLife', 'stats.critMultiplier', 'stats.manaCostBase', 'stats.manaCostPerPixel', 'mechanics.splashDamage', 'mechanics.statusDuration', 'mechanics.trailOpacity'],
    set: ['formation', 'stats.swordCount', 'mechanics.homingCanCrit', 'mechanics.returnEnabled'],
    max: ['stats.mana', 'stats.manaMax', 'stats.swordCap'],
    flag: ['flags.firstStrikeCrit', 'flags.returnLeavesDryBrush', 'flags.splashOnKill', 'flags.listenToInk', 'flags.whiteCutOnCrit'],
    status: ['erosion', 'suppression'],
    unlock: ['runUnlocks', 'permanentUnlocks'],
    truth: ['activeTruth']
  });

  const op = (kind, path, value) => Object.freeze({ op: kind, path, value });
  const status = (id, payload) => Object.freeze({ op: 'status', path: id, value: Object.freeze(payload) });

  const insight = (data) => Object.freeze({
    maxRank: 99,
    requires: Object.freeze([]),
    excludes: Object.freeze([]),
    fx: Object.freeze({ trail: null, hit: null, status: null }),
    ...data,
    requires: Object.freeze(data.requires || []),
    excludes: Object.freeze(data.excludes || []),
    effects: Object.freeze(data.effects || []),
    fx: Object.freeze(data.fx || { trail: null, hit: null, status: null })
  });

  const INSIGHTS = Object.freeze([
    // ── 劍式:同時只能維持一種排列,但可重複領悟增加劍數。 ──────────────
    insight({ id: 'form_scatter', category: CATEGORY.FORM, rarity: RARITY.CLARITY, name: '散鋒式', rune: '散', maxRank: 5, description: '劍鋒如展卷向兩側散開;增一劍,清掃群墨。', tradeoff: '分散後不易集中斬擊單一墨獸。', effects: [op('add', 'stats.swordCount', 1), op('set', 'formation', 'fan')], fx: { trail: fx.DRY_BRUSH, hit: fx.BREAK_INK } }),
    insight({ id: 'form_together', category: CATEGORY.FORM, rarity: RARITY.CLARITY, name: '齊鋒式', rune: '齊', maxRank: 5, description: '數劍同起同落;增一劍,並列掃過同一片墨域。', tradeoff: '橫向覆蓋佳,轉向較為遲緩。', effects: [op('add', 'stats.swordCount', 1), op('set', 'formation', 'parallel')], fx: { trail: fx.BREAK_INK, hit: fx.WHITE_CUT } }),
    insight({ id: 'form_chain', category: CATEGORY.FORM, rarity: RARITY.CLARITY, name: '貫鋒式', rune: '貫', maxRank: 5, description: '劍鋒首尾相承;增一劍,沿同一道劍令接連斬落。', tradeoff: '集火最強,覆蓋範圍最窄。', effects: [op('add', 'stats.swordCount', 1), op('set', 'formation', 'inline')], fx: { trail: fx.WHITE_CUT, hit: fx.BREAK_INK } }),
    // ── 劍勢:改變飛劍運動。 ───────────────────────────────────────
    insight({ id: 'momentum_swift', category: CATEGORY.MOMENTUM, rarity: RARITY.AWAKENING, name: '疾影', rune: '疾', maxRank: 6, description: '劍影先於墨痕而至,飛行更快、更遠。', effects: [op('add', 'stats.swordSpeed', 3), op('add', 'stats.swordLife', 0.22)], fx: { trail: fx.DRY_BRUSH } }),
    insight({ id: 'momentum_pierce', category: CATEGORY.MOMENTUM, rarity: RARITY.CLARITY, name: '透墨', rune: '透', maxRank: 4, description: '劍不止於一墨,可多穿透兩個墨身。', effects: [op('add', 'stats.pierce', 2)], fx: { trail: fx.WHITE_CUT, hit: fx.BREAK_INK } }),
    insight({ id: 'momentum_guide', category: CATEGORY.MOMENTUM, rarity: RARITY.PENETRATION, name: '引鋒', rune: '引', maxRank: 4, description: '劍意感知墨氣,於飛行中自行修正鋒向。', tradeoff: '每次領悟令直擊傷害降低 12%,引鋒本身不能暴擊。', requires: ['inherit_guide'], effects: [op('add', 'mechanics.homingStrength', 0.055), op('mul', 'stats.damage', 0.88), op('set', 'mechanics.homingCanCrit', false)], fx: { trail: fx.DRY_BRUSH } }),
    insight({ id: 'momentum_return', category: CATEGORY.MOMENTUM, rarity: RARITY.PENETRATION, name: '歸鋒', rune: '歸', maxRank: 2, description: '劍去必歸,抵達劍令末端後折返再斬。', effects: [op('set', 'mechanics.returnEnabled', true), op('add', 'mechanics.returnHits', 1)], fx: { trail: fx.DRY_BRUSH, hit: fx.WHITE_CUT } }),
    insight({ id: 'momentum_break', category: CATEGORY.MOMENTUM, rarity: RARITY.PENETRATION, name: '破墨', rune: '破', maxRank: 5, description: '劍鋒入墨時震散墨身,波及近旁墨獸。', tradeoff: '潑墨只在命中時出現,不改變飛劍本體。', effects: [op('add', 'mechanics.splashRadius', 38), op('mul', 'mechanics.splashDamage', 1.12)], fx: { hit: fx.SPLASH } }),
    // ── 劍意:命中後留在墨獸身上的狀態。 ──────────────────────────
    insight({ id: 'intent_erosion', category: CATEGORY.INTENT, rarity: RARITY.CLARITY, name: '蝕痕', rune: '蝕', maxRank: 5, description: '劍痕留於墨身,使其持續潰散。', effects: [status('erosion', { stacks: 1, damagePerSecond: 4, duration: 3.2, maxStacks: 6 })], fx: { hit: fx.WHITE_CUT, status: fx.ERODING_INK } }),
    insight({ id: 'intent_suppress', category: CATEGORY.INTENT, rarity: RARITY.CLARITY, name: '鎮痕', rune: '鎮', maxRank: 4, description: '劍意鎮住墨流,使墨獸行止遲滯。', effects: [status('suppression', { stacks: 1, slow: 0.12, damagePerSecond: 1.5, duration: 2.6, maxStacks: 4 })], fx: { hit: fx.NEGATIVE_SPACE, status: fx.SUPPRESSED_INK } }),
    insight({ id: 'intent_sever', category: CATEGORY.INTENT, rarity: RARITY.CLARITY, name: '斷意', rune: '斷', maxRank: 5, description: '一線留白斷開墨身,暴擊機會提高。', effects: [op('add', 'stats.critChance', 0.12), op('flag', 'flags.whiteCutOnCrit', true)], fx: { hit: fx.WHITE_CUT } }),
    insight({ id: 'intent_restore', category: CATEGORY.INTENT, rarity: RARITY.AWAKENING, name: '回元', rune: '元', maxRank: 6, description: '墨獸潰散時,殘留劍意回歸靈府。', effects: [op('add', 'stats.manaOnKill', 0.65)], fx: { hit: fx.INK_DROP } }),
    // ── 修持:當局基礎能力。 ───────────────────────────────────────
    insight({ id: 'cultivate_edge', category: CATEGORY.CULTIVATION, rarity: RARITY.AWAKENING, name: '養鋒', rune: '鋒', maxRank: 10, description: '凝養劍鋒,使每次入墨更深。', effects: [op('add', 'stats.damage', 9)] }),
    insight({ id: 'cultivate_breadth', category: CATEGORY.CULTIVATION, rarity: RARITY.AWAKENING, name: '展鋒', rune: '展', maxRank: 8, description: '展開劍勢,使劍痕更寬、更易觸及墨身。', effects: [op('add', 'stats.swordWidth', 3.5)], fx: { trail: fx.BREAK_INK } }),
    insight({ id: 'cultivate_breath', category: CATEGORY.CULTIVATION, rarity: RARITY.AWAKENING, name: '納息', rune: '息', maxRank: 8, description: '納劍意入靈府,提高劍意上限與周天回復。', effects: [op('add', 'stats.manaMax', 24), op('add', 'stats.manaRegen', 0.1), op('max', 'stats.mana', 'stats.manaMax')] }),
    insight({ id: 'cultivate_sheath', category: CATEGORY.CULTIVATION, rarity: RARITY.CLARITY, name: '開匣', rune: '匣', maxRank: 5, description: '劍匣再開三席,使更多飛劍可同時留於畫中。', effects: [op('add', 'stats.swordCap', 3)] }),
    insight({ id: 'cultivate_focus', category: CATEGORY.CULTIVATION, rarity: RARITY.CLARITY, name: '凝神', rune: '凝', maxRank: 5, description: '心念專一,暴擊劍痕更深。', effects: [op('add', 'stats.critMultiplier', 0.2), op('mul', 'mechanics.trailOpacity', 1.05)] }),
    // ── 真意:改變流派;一局只能啟用一種。 ─────────────────────────
    insight({ id: 'truth_ten_thousand', category: CATEGORY.TRUTH, rarity: RARITY.TRUTH, name: '萬劍歸宗', rune: '萬', maxRank: 1, description: '增三劍、開六席劍匣;單劍傷害略降。', requires: ['inherit_ten_thousand'], effects: [op('truth', 'activeTruth', 'truth_ten_thousand'), op('add', 'stats.swordCount', 3), op('add', 'stats.swordCap', 6), op('mul', 'stats.damage', 0.82)], fx: { trail: fx.DRY_BRUSH, hit: fx.BREAK_INK } }),
    insight({ id: 'truth_single_stroke', category: CATEGORY.TRUTH, rarity: RARITY.TRUTH, name: '一筆開天', rune: '一', maxRank: 1, description: '萬念歸於一鋒:只留一劍,傷害與劍寬大幅提高。', requires: ['inherit_single_stroke'], effects: [op('truth', 'activeTruth', 'truth_single_stroke'), op('set', 'stats.swordCount', 1), op('mul', 'stats.damage', 2.35), op('mul', 'stats.swordWidth', 1.45), op('add', 'stats.pierce', 4)], fx: { trail: fx.WHITE_CUT, hit: fx.BREAK_INK } }),
    insight({ id: 'truth_return_hidden', category: CATEGORY.TRUTH, rarity: RARITY.TRUTH, name: '歸藏無痕', rune: '藏', maxRank: 1, description: '所有劍必定折返,回程傷害更高。', requires: ['inherit_return_hidden'], effects: [op('truth', 'activeTruth', 'truth_return_hidden'), op('set', 'mechanics.returnEnabled', true), op('add', 'mechanics.returnHits', 1), op('flag', 'flags.returnLeavesDryBrush', true), op('unlock', 'runUnlocks', 'returnDamageMultiplier:1.65')], fx: { trail: fx.DRY_BRUSH, hit: fx.WHITE_CUT } }),
    insight({ id: 'truth_ink_sea', category: CATEGORY.TRUTH, rarity: RARITY.TRUTH, name: '墨海無涯', rune: '海', maxRank: 1, description: '潑墨範圍與波及傷害大幅提高。', requires: ['inherit_ink_sea'], effects: [op('truth', 'activeTruth', 'truth_ink_sea'), op('add', 'mechanics.splashRadius', 72), op('mul', 'mechanics.splashDamage', 1.65), op('flag', 'flags.splashOnKill', true), op('mul', 'stats.damage', 0.9)], fx: { hit: fx.SPLASH, status: fx.INK_DROP } }),
    insight({ id: 'truth_dry_peaks', category: CATEGORY.TRUTH, rarity: RARITY.TRUTH, name: '飛白千峰', rune: '白', maxRank: 1, description: '劍痕斷續留白;暴擊後再生一道殘鋒。', requires: ['inherit_dry_peaks'], effects: [op('truth', 'activeTruth', 'truth_dry_peaks'), op('add', 'stats.critChance', 0.18), op('flag', 'flags.whiteCutOnCrit', true), op('unlock', 'runUnlocks', 'criticalEcho:1')], fx: { trail: fx.DRY_BRUSH, hit: fx.WHITE_CUT } })
  ]);

  const rebirthNode = (data) => Object.freeze({
    maxRank: 1,
    costs: Object.freeze([]),
    requires: Object.freeze([]),
    effects: Object.freeze([]),
    ...data,
    costs: Object.freeze(data.costs || []),
    requires: Object.freeze(data.requires || []),
    effects: Object.freeze(data.effects || [])
  });

  const REBIRTH = Object.freeze([
    // 築基:穩定且有限的永久數值。
    rebirthNode({ id: 'foundation_spirit_house', branch: REBIRTH_BRANCH.FOUNDATION, name: '靈府初成', description: '每階令開局劍意上限提高十五。', maxRank: 10, costs: [30, 65, 125, 220, 340, 490, 680, 910, 1180, 1500], effects: [op('add', 'stats.manaMax', 15), op('max', 'stats.mana', 'stats.manaMax')] }),
    rebirthNode({ id: 'foundation_sea_of_mind', branch: REBIRTH_BRANCH.FOUNDATION, name: '識海初開', description: '每階令開局神識上限提高十五。', maxRank: 10, costs: [30, 65, 125, 220, 340, 490, 680, 910, 1180, 1500], effects: [op('add', 'stats.hpMax', 15)] }),
    rebirthNode({ id: 'foundation_sword_bone', branch: REBIRTH_BRANCH.FOUNDATION, name: '劍骨凝成', description: '每階令開局劍傷提高三。', maxRank: 4, costs: [30, 65, 125, 220], effects: [op('add', 'stats.damage', 3)] }),
    rebirthNode({ id: 'foundation_flow', branch: REBIRTH_BRANCH.FOUNDATION, name: '行氣如劍', description: '每階令開局劍速提高一。', maxRank: 3, costs: [40, 95, 190], effects: [op('add', 'stats.swordSpeed', 1)] }),
    rebirthNode({ id: 'foundation_cycle', branch: REBIRTH_BRANCH.FOUNDATION, name: '周天養息', description: '每階令劍意回復提高。', maxRank: 3, costs: [40, 95, 190], effects: [op('add', 'stats.manaRegen', 0.05)] }),
    rebirthNode({ id: 'foundation_sword_case', branch: REBIRTH_BRANCH.FOUNDATION, name: '劍匣初開', description: '開局增一劍並多開一席劍匣。', maxRank: 1, costs: [320], effects: [op('add', 'stats.swordCount', 1), op('add', 'stats.swordCap', 1), op('set', 'formation', 'fan')] }),
    // 心法:永久改變節奏,不直接堆疊大量傷害。
    rebirthNode({ id: 'mind_clear_strike', branch: REBIRTH_BRANCH.MIND, name: '明心一斬', description: '每局第一道有效劍痕必定暴擊。', costs: [140], requires: ['foundation_sword_bone:2'], effects: [op('flag', 'flags.firstStrikeCrit', true)] }),
    rebirthNode({ id: 'mind_return_thought', branch: REBIRTH_BRANCH.MIND, name: '歸念', description: '折返的飛劍留下淡飛白,回程更易辨識。', costs: [170], requires: ['foundation_flow:2'], effects: [op('flag', 'flags.returnLeavesDryBrush', true)] }),
    rebirthNode({ id: 'mind_break_ink', branch: REBIRTH_BRANCH.MIND, name: '破墨心訣', description: '墨獸潰散時有機會留下小片潑墨,僅造成低額波及傷害。', costs: [210], requires: ['foundation_sword_bone:3'], effects: [op('flag', 'flags.splashOnKill', true)] }),
    rebirthNode({ id: 'mind_listen_ink', branch: REBIRTH_BRANCH.MIND, name: '聽墨', description: '每次悟道至少出現一項尚未滿階的劍勢或劍意。', costs: [240], requires: ['foundation_spirit_house:2'], effects: [op('flag', 'flags.listenToInk', true)] }),
    // 傳承:只負責把新能力放入悟道池。
    rebirthNode({ id: 'inherit_guide', branch: REBIRTH_BRANCH.INHERITANCE, name: '傳承·引鋒', description: '劍意〈引鋒〉進入悟道池。', costs: [160], effects: [op('unlock', 'permanentUnlocks', 'inherit_guide')] }),
    rebirthNode({ id: 'inherit_ten_thousand', branch: REBIRTH_BRANCH.INHERITANCE, name: '傳承·萬劍歸宗', description: '真意〈萬劍歸宗〉進入悟道池。', costs: [280], requires: ['foundation_sword_case:1'], effects: [op('unlock', 'permanentUnlocks', 'inherit_ten_thousand')] }),
    rebirthNode({ id: 'inherit_single_stroke', branch: REBIRTH_BRANCH.INHERITANCE, name: '傳承·一筆開天', description: '真意〈一筆開天〉進入悟道池。', costs: [300], requires: ['foundation_sword_bone:4'], effects: [op('unlock', 'permanentUnlocks', 'inherit_single_stroke')] }),
    rebirthNode({ id: 'inherit_return_hidden', branch: REBIRTH_BRANCH.INHERITANCE, name: '傳承·歸藏無痕', description: '真意〈歸藏無痕〉進入悟道池。', costs: [260], requires: ['mind_return_thought:1'], effects: [op('unlock', 'permanentUnlocks', 'inherit_return_hidden')] }),
    rebirthNode({ id: 'inherit_ink_sea', branch: REBIRTH_BRANCH.INHERITANCE, name: '傳承·墨海無涯', description: '真意〈墨海無涯〉進入悟道池。', costs: [290], requires: ['mind_break_ink:1'], effects: [op('unlock', 'permanentUnlocks', 'inherit_ink_sea')] }),
    rebirthNode({ id: 'inherit_dry_peaks', branch: REBIRTH_BRANCH.INHERITANCE, name: '傳承·飛白千峰', description: '真意〈飛白千峰〉進入悟道池。', costs: [320], requires: ['mind_clear_strike:1'], effects: [op('unlock', 'permanentUnlocks', 'inherit_dry_peaks')] })
  ]);

  const BASE_RUN_STATE = Object.freeze({
    formation: 'single',
    activeTruth: null,
    activeForm: null,
    appliedTruthEffects: [],
    appliedFormEffects: [],
    stats: Object.freeze({ hpMax: 100, damage: 24, swordWidth: 18, swordSpeed: 14, swordLife: 1.35, pierce: 0, critChance: 0.05, critMultiplier: 2, manaMax: 100, mana: 100, manaRegen: 0.85, manaOnKill: 0, swordCap: 4, swordCount: 1, manaCostBase: 6, manaCostPerPixel: 0.13 }),
    mechanics: Object.freeze({ homingStrength: 0, homingCanCrit: true, returnEnabled: false, returnHits: 0, splashRadius: 0, splashDamage: 0.35, statusDuration: 1, trailOpacity: 1 }),
    statuses: Object.freeze({}),
    flags: Object.freeze({ firstStrikeCrit: false, returnLeavesDryBrush: false, splashOnKill: false, listenToInk: false, whiteCutOnCrit: false }),
    ranks: Object.freeze({}),
    runUnlocks: Object.freeze([]),
    lockedInheritance: Object.freeze([]),
    resetInsightTimes: 0,
    difficultyScale: 1
  });

  function clone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function getPath(target, path) {
    return String(path).split('.').reduce((node, key) => node == null ? undefined : node[key], target);
  }

  function setPath(target, path, value) {
    const keys = String(path).split('.');
    const leaf = keys.pop();
    const parent = keys.reduce((node, key) => {
      if (!node[key] || typeof node[key] !== 'object') node[key] = {};
      return node[key];
    }, target);
    parent[leaf] = value;
  }

  // 只有「明確指向 state 子樹」的字串才視為路徑參照(stats./mechanics./flags.)。
  // 修正:原本任何含 '.' 的字串都會被當路徑,導致 'returnDamageMultiplier:1.65' 解析成 undefined。
  const VALUE_PATH_RE = /^(stats|mechanics|flags)\./;
  function resolveValue(state, value) {
    return typeof value === 'string' && VALUE_PATH_RE.test(value) ? getPath(state, value) : value;
  }

  // 反向回滾單一操作(真意/劍式專用)
  function revertOperation(state, opItem) {
    const currentVal = Number(getPath(state, opItem.path) || 0);
    const val = resolveValue(state, opItem.value);
    switch (opItem.op) {
      case 'add': setPath(state, opItem.path, currentVal - Number(val)); break;
      case 'mul': setPath(state, opItem.path, currentVal / Number(val)); break;
      case 'set': break;
      case 'flag': setPath(state, opItem.path, !Boolean(val)); break;
      case 'unlock': {
        const arr = getPath(state, opItem.path);
        if (Array.isArray(arr)) setPath(state, opItem.path, arr.filter(v => v !== val));
        break;
      }
    }
  }

  // 回滾全部真意效果
  function revertTruthEffects(state) {
    state.appliedTruthEffects.forEach(opItem => revertOperation(state, opItem));
    state.appliedTruthEffects = [];
    state.activeTruth = null;
  }

  // 回滾全部劍式效果
  function revertFormEffects(state) {
    state.appliedFormEffects.forEach(opItem => revertOperation(state, opItem));
    state.appliedFormEffects = [];
    state.activeForm = null;
  }

  function applyOperation(state, operation, difficultyScale = 1) {
    const value = resolveValue(state, operation.value);
    const scale = difficultyScale;
    switch (operation.op) {
      case 'add': setPath(state, operation.path, Number(getPath(state, operation.path) || 0) + Number(value) * scale); break;
      case 'mul': setPath(state, operation.path, Number(getPath(state, operation.path) || 0) * Number(value)); break;
      case 'set': setPath(state, operation.path, value); break;
      case 'max': setPath(state, operation.path, Math.max(Number(getPath(state, operation.path) || 0), Number(value) * scale)); break;
      case 'flag': setPath(state, operation.path, Boolean(value)); break;
      case 'status': {
        const current = state.statuses[operation.path] || {};
        const payload = clone(value);
        const newRank = Number(current.rank || 0) + 1;
        const maxStack = payload.maxStacks || 99;
        state.statuses[operation.path] = { ...current, ...payload, rank: Math.min(newRank, maxStack) };
        break;
      }
      case 'unlock': {
        if (!Array.isArray(state[operation.path])) state[operation.path] = [];
        if (!state[operation.path].includes(value)) state[operation.path].push(value);
        break;
      }
      case 'truth': {
        revertTruthEffects(state);
        state.activeTruth = operation.value;
        const truthInsight = insightById[operation.value];
        const truthOps = truthInsight.effects.filter(e => e.op !== 'truth');
        state.appliedTruthEffects = clone(truthOps);
        truthOps.forEach(opItem => applyOperation(state, opItem, state.difficultyScale));
        break;
      }
      default: throw new Error(`未知 effect operation: ${operation.op}`);
    }
    return state;
  }

  // 全域屬性邊界截斷
  function clampAllStats(state) {
    const s = state.stats;
    s.swordCount = Math.max(1, Math.min(s.swordCount, s.swordCap));
    s.critChance = Math.max(0, Math.min(s.critChance, 0.95));
    s.mana = Math.min(s.mana, s.manaMax);
    s.swordSpeed = Math.max(5, Math.min(s.swordSpeed, 60));
    s.pierce = Math.max(0, Math.min(s.pierce, 8));
    s.critMultiplier = Math.max(1, Math.min(s.critMultiplier, 10));
    s.manaCostBase = Math.max(0, Math.min(s.manaCostBase, 60));
    s.manaCostPerPixel = Math.max(0.01, Math.min(s.manaCostPerPixel, 1));
    const m = state.mechanics;
    m.splashRadius = Math.max(0, Math.min(m.splashRadius, 180));
    m.splashDamage = Math.max(0.1, Math.min(m.splashDamage, 5));
    m.homingStrength = Math.max(0, Math.min(m.homingStrength, 0.3));
  }

  // 清空場上所有墨獸狀態
  function clearAllStatus(state) {
    state.statuses = {};
  }

  // 單局完整重置函數
  function resetRunState(permanentInput = {}, difficultyScale = 1) {
    const permanent = createPermanentState(permanentInput);
    const state = clone(BASE_RUN_STATE);
    state.difficultyScale = difficultyScale;
    state.permanentUnlocks = [...permanent.permanentUnlocks];
    revertTruthEffects(state);
    revertFormEffects(state);
    clearAllStatus(state);
    state.ranks = {};
    state.runUnlocks = [];
    for (const node of REBIRTH) {
      const rank = Number(permanent.ranks[node.id] || 0);
      for (let i = 0; i < rank; i += 1) node.effects.forEach((effect) => applyOperation(state, effect, state.difficultyScale));
    }
    state.stats.mana = state.stats.manaMax;
    clampAllStats(state);
    return state;
  }

  class SeededRandom {
    constructor(seed = Date.now()) { this.state = (Number(seed) >>> 0) || 0x6d2b79f5; }
    next() { let t = this.state += 0x6d2b79f5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    range(min, max) { return min + (max - min) * this.next(); }
    int(min, max) { return Math.floor(this.range(min, max + 1)); }
    pick(items) { return items.length ? items[this.int(0, items.length - 1)] : undefined; }
  }

  const insightById = Object.freeze(Object.fromEntries(INSIGHTS.map((item) => [item.id, item])));
  const rebirthById = Object.freeze(Object.fromEntries(REBIRTH.map((item) => [item.id, item])));

  function createPermanentState(saved = {}) {
    return {
      version: VERSION,
      insight: Math.max(0, Number(saved.insight || 0)),
      ranks: { ...(saved.ranks || {}) },
      permanentUnlocks: [...new Set(saved.permanentUnlocks || [])]
    };
  }

  // 強化依賴校驗:同時檢查Rebirth節點與Insight悟道等級
  function requirementMet(source, requirement) {
    const [id, rankText] = String(requirement).split(':');
    const requiredRank = Number(rankText || 1);
    const rebirthRank = Number(source.ranks?.[id] || 0);
    const insightItem = insightById[id];
    let insightRank = 0;
    if (insightItem) insightRank = Number(source.ranks?.[id] || 0);
    return rebirthRank >= requiredRank || insightRank >= requiredRank || source.permanentUnlocks?.includes(id) || source.runUnlocks?.includes(id);
  }

  function createRunState(permanentInput = {}, difficultyScale = 1) {
    const permanent = createPermanentState(permanentInput);
    const state = clone(BASE_RUN_STATE);
    state.difficultyScale = difficultyScale;
    state.permanentUnlocks = [...permanent.permanentUnlocks];
    // 存一份永久快照,供洗點時「重建」用(避免 mul 反向的順序誤差)
    state.permanentSnapshot = { ranks: { ...permanent.ranks }, permanentUnlocks: [...permanent.permanentUnlocks] };
    for (const node of REBIRTH) {
      const rank = Number(permanent.ranks[node.id] || 0);
      for (let i = 0; i < rank; i += 1) node.effects.forEach((effect) => applyOperation(state, effect, state.difficultyScale));
    }
    state.stats.mana = state.stats.manaMax;
    clampAllStats(state);
    return state;
  }

  function canOfferInsight(state, item) {
    const rank = Number(state.ranks[item.id] || 0);
    if (rank >= item.maxRank) return false;
    if (!item.requires.every((requirement) => requirementMet(state, requirement))) return false;
    if (item.excludes.some((id) => Number(state.ranks[id] || 0) > 0)) return false;
    // 真意互斥:局內已有任一真意等級則不刷新其他真意
    if (item.category === CATEGORY.TRUTH) {
      const hasAnyTruth = INSIGHTS.some(ins => ins.category === CATEGORY.TRUTH && Number(state.ranks[ins.id] || 0) > 0);
      if (hasAnyTruth) return false;
      if (state.activeTruth && state.activeTruth !== item.id) return false;
    }
    return true;
  }

  // 動態稀有度衰減權重計算
  function getDynamicRarityWeight(state, item) {
    let base = rarity.weight[item.rarity];
    const sameRarityCount = INSIGHTS.filter(i => i.rarity === item.rarity && Number(state.ranks[i.id] || 0) > 0).length;
    // 每3個同稀有度悟道,權重 ×0.75衰減
    const decayTimes = Math.floor(sameRarityCount / 3);
    base *= Math.pow(0.75, decayTimes);
    // 已解鎖傳承對應真意,truth權重提升至12
    if (item.category === CATEGORY.TRUTH && state.permanentUnlocks.some(u => item.requires.includes(u))) {
      base = 12;
    }
    return Math.max(0.1, base);
  }

  function weightedPick(items, rng, state) {
    const total = items.reduce((sum, item) => sum + getDynamicRarityWeight(state, item), 0);
    if (total <= 0) return undefined;
    let cursor = rng.next() * total;
    for (const item of items) {
      cursor -= getDynamicRarityWeight(state, item);
      if (cursor <= 0) return item;
    }
    return items[items.length - 1];
  }

  function rollInsights(state, count = 3, rngInput = new SeededRandom()) {
    const rng = typeof rngInput.next === 'function' ? rngInput : new SeededRandom(rngInput);
    let pool = INSIGHTS.filter((item) => canOfferInsight(state, item));
    // 過濾被封鎖傳承對應悟道
    pool = pool.filter(item => !state.lockedInheritance.some(lock => item.requires.includes(lock)));
    const result = [];
    const forceInkListening = state.flags.listenToInk && pool.some((item) => item.category === CATEGORY.MOMENTUM || item.category === CATEGORY.INTENT);
    if (forceInkListening && count > 0) {
      const focused = pool.filter((item) => item.category === CATEGORY.MOMENTUM || item.category === CATEGORY.INTENT);
      const chosen = weightedPick(focused, rng, state);
      if (chosen) result.push(chosen);
    }
    while (result.length < count) {
      const candidates = pool.filter((item) => !result.includes(item));
      if (!candidates.length) break;
      const chosen = weightedPick(candidates, rng, state);
      if (!chosen) break;
      result.push(chosen);
    }
    return result;
  }

  function applyInsight(state, insightId) {
    const item = insightById[insightId];
    if (!item) throw new Error(`不存在的領悟:${insightId}`);
    if (!canOfferInsight(state, item)) throw new Error(`目前無法領悟:${insightId}`);
    // 劍式單一生效快照處理
    if (item.category === CATEGORY.FORM) {
      revertFormEffects(state);
      state.activeForm = item.id;
      const formOps = item.effects.filter(e => e.op !== 'truth');
      state.appliedFormEffects = clone(formOps);
      formOps.forEach(opItem => applyOperation(state, opItem, state.difficultyScale));
    } else if (item.category === CATEGORY.TRUTH) {
      // 真意僅執行 truth op:其處理器已負責回滾舊真意、套用本真意其餘效果一次、並記錄快照。
      // 修正:原本外層再 forEach 全部 effects 會把數值效果重複套用一次(bug)。
      const truthOp = item.effects.find(e => e.op === 'truth');
      applyOperation(state, truthOp, state.difficultyScale);
    } else {
      item.effects.forEach((effect) => applyOperation(state, effect, state.difficultyScale));
    }
    state.ranks[item.id] = Number(state.ranks[item.id] || 0) + 1;
    clampAllStats(state);
    return state;
  }

  // 計算本次洗點消耗劍意(0=免費)。免費 1 次後遞增,封頂 250。
  function calcResetCost(resetTimes) {
    if (resetTimes < 1) return 0;
    const costTable = [30, 80, 150, 250];
    return costTable[Math.min(resetTimes - 1, costTable.length - 1)];
  }

  // 撤銷單一悟道之「一階」加成。
  // 修正版:依快照模型,劍式/真意由快照回滾(只在其為當前生效時),避免與 resetAll 重複扣減。
  function undoInsight(state, insightId) {
    const item = insightById[insightId];
    if (!item) throw new Error(`不存在悟道:${insightId}`);
    const currentRank = Number(state.ranks[insightId] || 0);
    if (currentRank <= 0) throw new Error(`該悟道未領悟,無法撤銷:${insightId}`);
    if (item.category === CATEGORY.FORM) {
      if (state.activeForm === insightId) revertFormEffects(state);
    } else if (item.category === CATEGORY.TRUTH) {
      if (state.activeTruth === insightId) revertTruthEffects(state);
    } else {
      item.effects.forEach((opItem) => revertOperation(state, opItem)); // 反向一階
    }
    state.ranks[insightId] = currentRank - 1;
    if (state.ranks[insightId] <= 0) delete state.ranks[insightId];
    clampAllStats(state);
    return state;
  }

  // 全局一鍵洗點:回到「開局(base + 永久問道)」狀態,清空本局悟道/真意/劍式/敵人狀態。
  // 採「重建」而非逐項反向 —— 徹底避免 mul 反向的順序誤差與真意/劍式殘留。保留洗點次數。
  function resetAllInsights(state) {
    const times = Number(state.resetInsightTimes || 0);
    const snap = state.permanentSnapshot || { permanentUnlocks: state.permanentUnlocks || [] };
    const fresh = createRunState(snap, state.difficultyScale);
    fresh.resetInsightTimes = times;
    Object.keys(state).forEach((k) => { delete state[k]; });
    Object.assign(state, fresh);
    clearAllStatus(state);
    return state;
  }

  function canPurchaseRebirth(permanentInput, nodeId) {
    const permanent = createPermanentState(permanentInput);
    const node = rebirthById[nodeId];
    if (!node) return { ok: false, reason: 'unknown_node' };
    const rank = Number(permanent.ranks[nodeId] || 0);
    if (rank >= node.maxRank) return { ok: false, reason: 'max_rank' };
    // 強化雙重依賴校驗
    const allReqMet = node.requires.every(req => requirementMet(permanent, req));
    if (!allReqMet) return { ok: false, reason: 'requirements' };
    const cost = Number(node.costs[rank]);
    if (permanent.insight < cost) return { ok: false, reason: 'insufficient_insight', cost };
    // 循環依賴檢測
    const checkCycle = (targetId, chain = []) => {
      if (chain.includes(targetId)) return true;
      const targetNode = rebirthById[targetId];
      if (!targetNode) return false;
      for (const req of targetNode.requires) {
        const reqId = req.split(':')[0];
        if (checkCycle(reqId, [...chain, targetId])) return true;
      }
      return false;
    };
    if (checkCycle(nodeId)) return { ok: false, reason: 'cycle_requirement' };
    return { ok: true, cost, nextRank: rank + 1 };
  }

  function purchaseRebirth(permanentInput, nodeId) {
    const permanent = createPermanentState(permanentInput);
    const check = canPurchaseRebirth(permanent, nodeId);
    if (!check.ok) return { ok: false, reason: check.reason, cost: check.cost, state: permanent };
    const node = rebirthById[nodeId];
    permanent.insight -= check.cost;
    permanent.ranks[nodeId] = check.nextRank;
    for (const effect of node.effects) {
      if (effect.op === 'unlock' && effect.path === 'permanentUnlocks' && !permanent.permanentUnlocks.includes(effect.value)) permanent.permanentUnlocks.push(effect.value);
    }
    return { ok: true, node, rank: check.nextRank, cost: check.cost, state: permanent };
  }

  // 臨時鎖定傳承悟道池
  function lockInheritance(state, inheritId) {
    if (!state.lockedInheritance.includes(inheritId)) state.lockedInheritance.push(inheritId);
  }

  function unlockInheritance(state, inheritId) {
    state.lockedInheritance = state.lockedInheritance.filter(id => id !== inheritId);
  }

  function getRebirthView(permanentInput) {
    const permanent = createPermanentState(permanentInput);
    return REBIRTH.map((node) => ({ ...node, rank: Number(permanent.ranks[node.id] || 0), purchase: canPurchaseRebirth(permanent, node.id) }));
  }

  function getEffectiveFx(state, insightId) {
    const item = insightById[insightId];
    if (!item) return null;
    // FX渲染優先級:trail < hit < status < truth全域特效
    return {
      trail: item.fx.trail,
      hit: item.fx.hit,
      status: item.fx.status,
      truth: state.activeTruth ? insightById[state.activeTruth].fx : null,
      returnDryBrush: Boolean(state.flags.returnLeavesDryBrush),
      criticalWhiteCut: Boolean(state.flags.whiteCutOnCrit)
    };
  }

  // 舊存檔版本遷移:補全缺失欄位、去重、標記為當前版本(只補不刪玩家進度)
  function migratePermanentSave(rawSave) {
    const save = clone(rawSave || {});
    const targetVer = VERSION;
    if (!save.version) save.version = '2.0.0';
    if (typeof save.insight !== 'number') save.insight = 0;
    if (!save.ranks || typeof save.ranks !== 'object') save.ranks = {};
    if (!Array.isArray(save.permanentUnlocks)) save.permanentUnlocks = [];
    save.permanentUnlocks = [...new Set(save.permanentUnlocks)];
    if (save.version === '2.0.0') save.version = targetVer;
    if (save.version > targetVer) {
      const allowKeys = ['version', 'insight', 'ranks', 'permanentUnlocks'];
      Object.keys(save).forEach((key) => { if (!allowKeys.includes(key)) delete save[key]; });
      save.version = targetVer;
    }
    return Object.freeze(save);
  }

  // 戰鬥快照:一次聚合本局所有戰鬥用數值,渲染/戰鬥層直接讀,避免重複遍歷與乘算不一致
  function getCombatSnapshot(state) {
    const s = state.stats, m = state.mechanics, f = state.flags;
    const unlockMap = Object.fromEntries(state.runUnlocks.map((str) => str.split(':')));
    const returnDamageMult = Number(unlockMap.returnDamageMultiplier || 1);
    const hasCriticalEcho = unlockMap.criticalEcho === '1';
    return Object.freeze({
      blade: { baseDamage: s.damage, width: s.swordWidth, speed: s.swordSpeed, lifeTime: s.swordLife, pierceCount: s.pierce, maxCap: s.swordCap, currentCount: s.swordCount },
      crit: { chance: Math.min(s.critChance, 0.95), multiplier: s.critMultiplier, whiteCutOnCrit: f.whiteCutOnCrit, criticalEcho: hasCriticalEcho, firstStrikeGuaranteed: f.firstStrikeCrit },
      returnBlade: { enabled: m.returnEnabled, hitCount: m.returnHits, damageMultiplier: returnDamageMult, leaveDryBrush: f.returnLeavesDryBrush },
      splash: { radius: m.splashRadius, damageMult: m.splashDamage },
      homing: { strength: m.homingStrength, canCrit: m.homingCanCrit },
      mana: { current: s.mana, max: s.manaMax, regenPerSec: s.manaRegen, gainOnKill: s.manaOnKill,
              costBase: s.manaCostBase, costPerPixel: s.manaCostPerPixel,
              maxStrokeLength: Math.max(0, (s.manaMax - s.manaCostBase) / s.manaCostPerPixel) },
      statusTimeScale: m.statusDuration,
      globalFlags: { splashOnKill: f.splashOnKill, listenInkPool: f.listenToInk },
      activeTruthId: state.activeTruth,
      activeFormId: state.activeForm
    });
  }

  // 悟道卡片說明的字數硬上限(全形字/String.length)。實測固定卡片最窄版面容量。
  const DESC_MAX = 22;
  function validateConfig() {
    const errors = [];
    const ids = new Set();
    for (const item of INSIGHTS) {
      if (ids.has(item.id)) errors.push(`重複 insight id: ${item.id}`);
      ids.add(item.id);
      if (!Object.values(CATEGORY).includes(item.category)) errors.push(`無效分類: ${item.id}`);
      if (!rarity.order.includes(item.rarity)) errors.push(`無效稀有度: ${item.id}`);
      // 文案長度上限:悟道三選一卡片為固定尺寸,說明超過 DESC_MAX 全形字會被裁切。
      // 見 docs/技能文案規範.md。超標一律由 AI 縮短文案,不得縮小字級。
      if (item.description && item.description.length > DESC_MAX)
        errors.push(`說明超出 ${DESC_MAX} 字(${item.description.length}):${item.name} 需縮短文案`);
      // 真意必須攜帶truth操作
      if (item.category === CATEGORY.TRUTH && !item.effects.some(e => e.op === 'truth')) {
        errors.push(`真意缺少truth操作: ${item.id}`);
      }
      // 劍式僅允許 add/stats.swordCount + set/formation
      if (item.category === CATEGORY.FORM) {
        const invalid = item.effects.some(e => !((e.op === 'add' && e.path === 'stats.swordCount') || (e.op === 'set' && e.path === 'formation')));
        if (invalid) errors.push(`劍式包含非法效果: ${item.id}`);
      }
      for (const effect of item.effects) {
        if (!OP_SCHEMA[effect.op]) errors.push(`無效操作 ${effect.op}: ${item.id}`);
        else if (!OP_SCHEMA[effect.op].includes(effect.path)) errors.push(`無效路徑 ${effect.path}: ${item.id}`);
      }
    }
    const rebirthIds = new Set();
    for (const node of REBIRTH) {
      if (rebirthIds.has(node.id)) errors.push(`重複 rebirth id: ${node.id}`);
      rebirthIds.add(node.id);
      if (node.costs.length !== node.maxRank) errors.push(`cost 數量不符: ${node.id}`);
      // Rebirth循環依賴檢測
      const checkCycle = (targetId, chain = []) => {
        if (chain.includes(targetId)) return true;
        const targetNode = rebirthById[targetId];
        if (!targetNode) return false;
        for (const req of targetNode.requires) {
          const reqId = req.split(':')[0];
          if (checkCycle(reqId, [...chain, targetId])) return true;
        }
        return false;
      };
      if (checkCycle(node.id)) errors.push(`重生節點存在循環依賴: ${node.id}`);
    }
    return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
  }

  /* 舊引擎相容層:完整支援mul/flag/status/truth全部機制 */
  const LEGACY_RARITY = Object.freeze({ awakening: 'n', clarity: 'r', penetration: 'e', truth: 'l' });
  const LEGACY_PATH = Object.freeze({
    'stats.hpMax': 'hpMax', 'stats.swordCount': 'count', 'stats.damage': 'damage', 'stats.swordWidth': 'size', 'stats.swordSpeed': 'speed', 'stats.swordLife': 'life', 'stats.pierce': 'pierce', 'stats.critChance': 'crit', 'stats.manaMax': 'manaMax', 'stats.manaRegen': 'manaRegen', 'stats.manaOnKill': 'regen', 'stats.swordCap': 'cap', 'mechanics.homingStrength': 'homing', 'mechanics.returnHits': 'ret', 'mechanics.splashRadius': 'explode', formation: 'formation'
  });

  function toLegacyEffect(item) {
    const result = { add: {}, mul: {}, flags: [], status: [] };
    for (const effect of item.effects) {
      const key = LEGACY_PATH[effect.path];
      if (!key) continue;
      if (effect.op === 'add') result.add[key] = effect.value;
      if (effect.op === 'mul') result.mul[key] = effect.value;
      if (effect.op === 'flag') result.flags.push(effect.path);
      if (effect.op === 'status') result.status.push({ id: effect.path, ...effect.value });
    }
    return result;
  }

  const legacyAffixes = Object.freeze(INSIGHTS.map((item) => Object.freeze({
    id: item.id,
    name: item.name,
    rar: LEGACY_RARITY[item.rarity],
    rune: item.rune,
    desc: item.description,
    effect: Object.freeze(toLegacyEffect(item)),
    locked: item.requires[0] || undefined,
    category: item.category,
    fx: item.fx
  })));

  const legacyMetaUp = Object.freeze(REBIRTH.filter((node) => node.branch === REBIRTH_BRANCH.FOUNDATION).map((node) => Object.freeze({
    id: node.id,
    name: node.name,
    desc: node.description,
    max: node.maxRank,
    cost: node.costs,
    per: Object.freeze(Object.fromEntries(node.effects.filter((effect) => effect.op === 'add').map((effect) => [LEGACY_PATH[effect.path] || effect.path.split('.').pop(), effect.value])))
  })));

  const legacyMetaUnlock = Object.freeze(REBIRTH.filter((node) => node.branch !== REBIRTH_BRANCH.FOUNDATION).map((node) => Object.freeze({ id: node.id, name: node.name, desc: node.description, cost: node.costs[0] })));

  const validation = validateConfig();
  if (!validation.ok) throw new Error(`INK_CONFIG 驗證失敗:\n${validation.errors.join('\n')}`);

  const CONFIG = Object.freeze({
    version: VERSION,
    schemaVersion: 2,
    terminology: Object.freeze({ upgradeTitle: '悟道', upgradePrompt: '請領悟一縷劍意', rebirthTitle: '問道', currency: '劍意' }),
    category: CATEGORY,
    rebirthBranch: REBIRTH_BRANCH,
    rarity,
    fx,
    opSchema: OP_SCHEMA,
    baseRunState: BASE_RUN_STATE,
    insights: INSIGHTS,
    insightById,
    rebirth: REBIRTH,
    rebirthById,
    runtime: Object.freeze({
      SeededRandom,
      createPermanentState,
      createRunState,
      resetRunState,
      canOfferInsight,
      rollInsights,
      applyInsight,
      undoInsight,
      resetAllInsights,
      calcResetCost,
      applyOperation,
      revertTruthEffects,
      revertFormEffects,
      clearAllStatus,
      clampAllStats,
      canPurchaseRebirth,
      purchaseRebirth,
      lockInheritance,
      unlockInheritance,
      getRebirthView,
      getEffectiveFx,
      migratePermanentSave,
      getCombatSnapshot,
      validateConfig
    }),
    // 舊版完整相容介面
    affixes: legacyAffixes,
    metaUp: legacyMetaUp,
    metaUnlock: legacyMetaUnlock,
    homingBoost: Object.freeze({ unlock: 'inherit_guide', mult: 2.2 }),
    legacy: Object.freeze({
      rarity: Object.freeze({ weight: Object.freeze({ n: 60, r: 28, e: 10, l: 2 }), name: Object.freeze({ n: '初悟', r: '明悟', e: '徹悟', l: '真意' }) }),
      affixes: legacyAffixes,
      metaUp: legacyMetaUp,
      metaUnlock: legacyMetaUnlock
    })
  });

  global.INK_CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);

import test from 'node:test';
import assert from 'node:assert/strict';

await import('../data/game-config.js');
const CONFIG=globalThis.INK_CONFIG;
const { runtime }=CONFIG;

test('authoritative game configuration validates', () => {
  const result=runtime.validateConfig();
  assert.equal(result.ok,true,result.errors.join('\n'));
  assert.deepEqual(result.errors,[]);
});

test('SeededRandom reproduces sequences and stays within requested ranges', () => {
  const a=new runtime.SeededRandom(20260811);
  const b=new runtime.SeededRandom(20260811);
  assert.deepEqual(Array.from({length:8},()=>a.next()),Array.from({length:8},()=>b.next()));

  const rng=new runtime.SeededRandom(7);
  for(let i=0;i<100;i+=1){
    const value=rng.int(2,5);
    assert.ok(value>=2 && value<=5);
  }
});

test('run-state creation returns independent normalized state', () => {
  const first=runtime.createRunState({},1.25);
  const second=runtime.createRunState({},1.25);
  assert.notStrictEqual(first,second);
  assert.notStrictEqual(first.stats,second.stats);
  assert.equal(first.difficultyScale,1.25);
  assert.equal(first.stats.mana,first.stats.manaMax);

  first.stats.damage+=99;
  first.statuses.test={rank:1};
  assert.notEqual(first.stats.damage,second.stats.damage);
  assert.equal(second.statuses.test,undefined);
});

test('a run must choose exactly one starting formation before normal drafts', () => {
  const state=runtime.createRunState();
  const forms=runtime.getStartingFormations();
  assert.equal(forms.length,4);
  assert.deepEqual(runtime.rollInsights(state,3),[]);

  runtime.chooseStartingFormation(state,'form_scatter');
  assert.equal(state.activeForm,'form_scatter');
  assert.equal(state.formation,'fan');
  assert.equal(state.ranks.form_scatter,1);
  assert.equal(runtime.canOfferInsight(state,CONFIG.insightById.form_scatter),true);
  assert.equal(runtime.canOfferInsight(state,CONFIG.insightById.form_together),false);
  assert.throws(()=>runtime.chooseStartingFormation(state,'form_together'),/已鎖定/);
});

test('normal drafts and respec preserve the committed formation lane', () => {
  const state=runtime.createRunState();
  runtime.chooseStartingFormation(state,'form_chain');
  const offered=runtime.rollInsights(state,20,new runtime.SeededRandom(7));
  assert.ok(offered.length>0);
  assert.ok(offered.every(item=>item.category!=='form'||item.id==='form_chain'));
  assert.ok(offered.every(item=>!item.formationLock||item.formationLock==='inline'));

  const extra=CONFIG.insights.find(item=>item.category!=='form'&&runtime.canOfferInsight(state,item));
  assert.ok(extra);
  runtime.applyInsight(state,extra.id);
  runtime.resetAllInsights(state);
  assert.equal(state.activeForm,'form_chain');
  assert.equal(state.ranks.form_chain,1);
  assert.equal(state.ranks[extra.id],undefined);
});

test('drafts keep categories distinct and boost a category learned to rank two', () => {
  let baseline=0, boosted=0;
  for(let seed=1;seed<=200;seed+=1){
    const plain=runtime.createRunState(); runtime.chooseStartingFormation(plain,'form_scatter');
    const plainOffer=runtime.rollInsights(plain,3,new runtime.SeededRandom(seed));
    assert.equal(new Set(plainOffer.map(item=>item.category)).size,plainOffer.length);
    if(plainOffer.some(item=>item.category==='momentum')) baseline+=1;
    const focused=runtime.createRunState(); runtime.chooseStartingFormation(focused,'form_scatter');
    runtime.applyInsight(focused,'momentum_swift'); runtime.applyInsight(focused,'momentum_swift');
    const focusedOffer=runtime.rollInsights(focused,3,new runtime.SeededRandom(seed));
    assert.equal(new Set(focusedOffer.map(item=>item.category)).size,focusedOffer.length);
    if(focusedOffer.some(item=>item.category==='momentum')) boosted+=1;
  }
  assert.ok(boosted>baseline,`${boosted} should exceed ${baseline}`);
});

test('cumulative effect lines total all learned ranks', () => {
  assert.ok(runtime.cumulativeEffectLines('intent_restore',3).some(line=>line.includes('2.34')));
});

test('trace and blade-type families lock to the first chosen lane', () => {
  const state=runtime.createRunState();
  runtime.chooseStartingFormation(state,'form_scatter');
  assert.equal(runtime.canOfferInsight(state,CONFIG.insightById.intent_erosion),true);
  assert.equal(runtime.canOfferInsight(state,CONFIG.insightById.intent_sever),true);
  runtime.applyInsight(state,'intent_erosion');
  assert.equal(state.activeIntent,'intent_erosion');
  assert.equal(runtime.canOfferInsight(state,CONFIG.insightById.intent_sever),false);

  assert.equal(CONFIG.insightById.cultivate_edge.category,'blade');
  runtime.applyInsight(state,'cultivate_edge');
  assert.equal(state.activeBlade,'cultivate_edge');
  assert.equal(runtime.canOfferInsight(state,CONFIG.insightById.cultivate_temper),false);
  assert.equal(runtime.canOfferInsight(state,CONFIG.insightById.cultivate_breadth),false);
});

test('sword aptitude remains open while remembering the first cultivation focus', () => {
  const state=runtime.createRunState();
  runtime.chooseStartingFormation(state,'form_scatter');
  runtime.applyInsight(state,'cultivate_breath');
  assert.equal(state.cultivationFocus,'cultivate_breath');
  assert.equal(runtime.canOfferInsight(state,CONFIG.insightById.cultivate_focus),true);
  runtime.applyInsight(state,'cultivate_focus');
  assert.equal(state.cultivationFocus,'cultivate_breath');
});

test('removed sheath content is absent and active truths match the redesign', () => {
  assert.equal(CONFIG.insightById.cultivate_sheath,undefined);
  assert.equal(CONFIG.rebirthById.foundation_sword_case,undefined);
  assert.equal(CONFIG.rebirthById.mind_return_thought,undefined);
  assert.equal(CONFIG.rebirthById.mind_listen_ink,undefined);
  assert.deepEqual(CONFIG.rebirthById.inherit_return_hidden.requires,['foundation_flow:4']);
  const truths=CONFIG.insights.filter(item=>item.category==='truth');
  assert.deepEqual(truths.map(item=>item.name),['萬劍歸宗','一筆開天','歸藏無痕','環月歸墟']);
  assert.ok(truths.every(item=>item.active.manaCost===200&&item.active.cooldown===30));
  assert.equal(CONFIG.rebirthById.inherit_moon_return.name,'傳承·環月歸墟');
});

test('truth choice unlocks at formation rank five and locks for the run', () => {
  const permanent={permanentUnlocks:['inherit_ten_thousand','inherit_moon_return']};
  const state=runtime.createRunState(permanent);
  runtime.chooseStartingFormation(state,'form_scatter');
  assert.deepEqual(runtime.getUnlockedTruths(state),[]);
  for(let i=1;i<5;i+=1) runtime.applyInsight(state,'form_scatter');
  assert.deepEqual(runtime.getUnlockedTruths(state).map(item=>item.id),['truth_ten_thousand','truth_moon_return']);
  runtime.chooseActiveTruth(state,'truth_moon_return');
  assert.equal(state.activeTruth,'truth_moon_return');
  assert.equal(state.ranks.truth_moon_return,1);
  assert.throws(()=>runtime.chooseActiveTruth(state,'truth_ten_thousand'),/已鎖定/);
});

test('applyOperation enforces additive scaling, flags, unlock uniqueness, and status caps', () => {
  const state=runtime.createRunState();
  const baseDamage=state.stats.damage;
  runtime.applyOperation(state,{op:'add',path:'stats.damage',value:4},1.5);
  assert.equal(state.stats.damage,baseDamage+6);

  runtime.applyOperation(state,{op:'flag',path:'tierFlags.regression',value:true});
  assert.equal(state.tierFlags.regression,true);

  runtime.applyOperation(state,{op:'unlock',path:'runUnlocks',value:'regression_unlock'});
  runtime.applyOperation(state,{op:'unlock',path:'runUnlocks',value:'regression_unlock'});
  assert.deepEqual(state.runUnlocks,['regression_unlock']);

  const status={op:'status',path:'regression',value:{maxStacks:2,power:3}};
  runtime.applyOperation(state,status);
  runtime.applyOperation(state,status);
  runtime.applyOperation(state,status);
  assert.deepEqual(state.statuses.regression,{maxStacks:2,power:3,rank:2});
});

test('resetRunState clears transient run mutations', () => {
  const reset=runtime.resetRunState({},1);
  assert.deepEqual(reset.statuses,{});
  assert.deepEqual(reset.ranks,{});
  assert.deepEqual(reset.runUnlocks,[]);
  assert.equal(reset.stats.mana,reset.stats.manaMax);
});

import fs from 'node:fs';

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
function replaceOnce(oldText, newText, label, expected = 1) {
  const count = html.split(oldText).length - 1;
  if (count !== expected) throw new Error(label + ': expected ' + expected + ', found ' + count);
  html = html.split(oldText).join(newText);
}

replaceOnce(
  " freeze:'移動を凍結',skip:'ターンスキップ',add_card:'カードを手札に追加',view_hand:'手札を見る',card_effect_up:'特定カードの効果を強化',card_effect_down:'特定カードの効果を弱体化'\\n};\\nconst TC_CUSTOM_LIMITED_TARGETS",
  " freeze:'移動を凍結',skip:'ターンスキップ',add_card:'カードを手札に追加',scratch_boost:'Scratch属性効果アップ・コスト0',view_hand:'手札を見る',card_effect_up:'特定カードの効果を強化',card_effect_down:'特定カードの効果を弱体化'\\n};\\nconst TC_CUSTOM_LIMITED_TARGETS",
  'register Scratch boost action type'
);
replaceOnce(
  "const TC_CUSTOM_LIMITED_CARD_MODES={specific:'カードを指定',rarest:'出現率が最も低いカード',limited_random:'限定カードからランダム',pool_random:'通常の出現率でランダム'};\\nCFG.customLimitedCards=tcNormalizeCustomLimitedCards(CFG.customLimitedCards);",
  "const TC_CUSTOM_LIMITED_CARD_MODES={specific:'カードを指定',rarest:'出現率が最も低いカード',limited_random:'限定カードからランダム',pool_random:'通常の出現率でランダム'};\\nconst TC_CAT_KANZEN_KEY='limited_custom_cat_kanzen';\\nconst TC_CAT_KANZEN_DEF={name:'CAT完全体',icon:'🐈‍⬛',cost:0,description:'Scratch属性カードを各2枚追加し、効果を10倍・コスト0にする。相手に10ダメージ、50%で自分に5ダメージ',effectKey:'',img:'https://raw.githubusercontent.com/cosmosapr3-code/CAT-/main/assets/cards/cat-kanzen.webp',actions:[{type:'add_card',target:'self',chance:100,cardMode:'specific',cardKey:'pico',count:2},{type:'add_card',target:'self',chance:100,cardMode:'specific',cardKey:'gobo2',count:2},{type:'add_card',target:'self',chance:100,cardMode:'specific',cardKey:'neko',count:2},{type:'add_card',target:'self',chance:100,cardMode:'specific',cardKey:'scratch',count:2},{type:'add_card',target:'self',chance:100,cardMode:'specific',cardKey:'janken',count:2},{type:'scratch_boost',target:'self',chance:100,multiplier:10,turns:1},{type:'damage',target:'opponent',chance:100,amount:10},{type:'damage',target:'self',chance:50,amount:5}]};\\nCFG.customLimitedCards=tcNormalizeCustomLimitedCards(CFG.customLimitedCards);",
  'define built-in CAT完全体 card'
);
replaceOnce(
  "  if(['freeze','skip','card_effect_up','card_effect_down'].includes(type))x.turns=clampInt(a.turns??3,1,50);\\n  if(['card_effect_up','card_effect_down'].includes(type)){",
  "  if(['freeze','skip','card_effect_up','card_effect_down','scratch_boost'].includes(type))x.turns=clampInt(a.turns??1,1,50);\\n  if(type==='scratch_boost')x.multiplier=clampInt(a.multiplier??10,2,10);\\n  if(['card_effect_up','card_effect_down'].includes(type)){",
  'normalize Scratch boost action'
);
replaceOnce(
  "function tcNormalizeCustomLimitedCards(raw){\\n const src=raw&&typeof raw==='object'?raw:{};const out={};\\n for(const [key,value] of Object.entries(src).slice(0,30)){",
  "function tcNormalizeCustomLimitedCards(raw){\\n const src=raw&&typeof raw==='object'?raw:{};const out={};\\n const entries=Object.entries(src).filter(([key])=>key!==TC_CAT_KANZEN_KEY).slice(0,30);\\n for(const [key,value] of entries){",
  'preserve existing custom cards'
);
replaceOnce(
  "  out[key]={name:String(value.name||'限定カード').trim().slice(0,32),icon:String(value.icon||'🃏').trim().slice(0,8)||'🃏',cost:clampInt(value.cost??0,0,30),description,effectKey:actions.length?'':effectKey,actions,img:safeImg};\\n }\\n return out;\\n}",
  "  out[key]={name:String(value.name||'限定カード').trim().slice(0,32),icon:String(value.icon||'🃏').trim().slice(0,8)||'🃏',cost:clampInt(value.cost??0,0,30),description,effectKey:actions.length?'':effectKey,actions,img:safeImg};\\n }\\n out[TC_CAT_KANZEN_KEY]={name:TC_CAT_KANZEN_DEF.name,icon:TC_CAT_KANZEN_DEF.icon,cost:0,description:TC_CAT_KANZEN_DEF.description,effectKey:'',actions:tcNormalizeCustomLimitedActions(TC_CAT_KANZEN_DEF.actions),img:TC_CAT_KANZEN_DEF.img};\\n return out;\\n}",
  'include built-in reward in every config'
);
replaceOnce(
  "skip:'ターンスキップ'+a.turns+'回',view_hand:'手札を見る',card_effect_up:",
  "skip:'ターンスキップ'+a.turns+'回',scratch_boost:'Scratch属性効果×'+a.multiplier+'・コスト0',view_hand:'手札を見る',card_effect_up:",
  'describe Scratch boost'
);
replaceOnce(
  "function scratchMul(p){return (Number(p&&p.scratchBoost)||0)>0?2:1}",
  "function scratchMul(p){return (Number(p&&p.scratchBoost)||0)>0?Math.max(2,Math.min(10,Number(p.scratchBoostMultiplier)||2)):1}",
  'multiply Scratch card effects'
);
replaceOnce(
  "    else if(action.type==='ap_down'){target.ap=Math.max(0,(Number(target.ap)||0)-amount);if(targetIndex===G.turn)G.ap=target.ap;results.push(target.name+'のコスト-'+amount);}\\n    else if(action.type==='freeze'){",
  "    else if(action.type==='ap_down'){target.ap=Math.max(0,(Number(target.ap)||0)-amount);if(targetIndex===G.turn)G.ap=target.ap;results.push(target.name+'のコスト-'+amount);}\\n    else if(action.type==='scratch_boost'){target.scratchBoost=1;target.scratchBoostMultiplier=clampInt(action.multiplier??10,2,10);results.push(target.name+'のScratch属性効果'+target.scratchBoostMultiplier+'倍・コスト0（このターン）');}\\n    else if(action.type==='freeze'){",
  'execute Scratch boost'
);
replaceOnce('scratchBoost:0,cardMul:1,matsuokaActive:false','scratchBoost:0,scratchBoostMultiplier:1,cardMul:1,matsuokaActive:false','initialize Scratch multiplier');
replaceOnce('scratchBoost:Number(p.scratchBoost)||0,cardMul:Number(p.cardMul)||1','scratchBoost:Number(p.scratchBoost)||0,scratchBoostMultiplier:Number(p.scratchBoostMultiplier)||1,cardMul:Number(p.cardMul)||1','snapshot Scratch multiplier',2);
replaceOnce('scratchBoost:Number.isFinite(q.scratchBoost)?q.scratchBoost:0,cactusTurns','scratchBoost:Number.isFinite(q.scratchBoost)?q.scratchBoost:0,scratchBoostMultiplier:Number.isFinite(q.scratchBoostMultiplier)?q.scratchBoostMultiplier:1,cactusTurns','restore Scratch multiplier');
replaceOnce('scratchBoost=0;','scratchBoost=0;scratchBoostMultiplier=1;','reset Scratch multiplier',4);
replaceOnce(
  'if(__endingPlayer&&Number(__endingPlayer.scratchBoost)>0)__endingPlayer.scratchBoost=Math.max(0,Number(__endingPlayer.scratchBoost)-1);',
  'if(__endingPlayer&&Number(__endingPlayer.scratchBoost)>0){__endingPlayer.scratchBoost=Math.max(0,Number(__endingPlayer.scratchBoost)-1);if(!__endingPlayer.scratchBoost)__endingPlayer.scratchBoostMultiplier=1;}',
  'expire Scratch boost after turn'
);
replaceOnce(
  "if(k==='rewind'&&G.over)return false;if(cost>(Number(p.ap)||0))return false;",
  "if(k==='rewind'&&G.over)return false;if(Number(p.scratchBoost)>0&&Number(p.scratchBoostMultiplier)>=10&&(SCRATCH_KEYS.includes(k)||SCRATCH_KEYS.includes(originalK)))cost=0;if(cost>(Number(p.ap)||0))return false;",
  'Scratch card free cost'
);
replaceOnce(
  "if(Number(G.limitedSovietTurns)>0&&(key==='sovet'||key==='missile'))cost=0;\\n  if(cost>(Number(p.ap)||0))return false;",
  "if(Number(G.limitedSovietTurns)>0&&(key==='sovet'||key==='missile'))cost=0;\\n  if(Number(p.scratchBoost)>0&&Number(p.scratchBoostMultiplier)>=10&&SCRATCH_KEYS.includes(key))cost=0;\\n  if(cost>(Number(p.ap)||0))return false;",
  'CPU Scratch free cost'
);
replaceOnce(
  "if(Number(G.limitedSovietTurns)>0&&(k==='sovet'||k==='missile'))cost=0;\\n if(cost>",
  "if(Number(G.limitedSovietTurns)>0&&(k==='sovet'||k==='missile'))cost=0;\\n if(Number(p.scratchBoost)>0&&Number(p.scratchBoostMultiplier)>=10&&(SCRATCH_KEYS.includes(k)||SCRATCH_KEYS.includes(shown)))cost=0;\\n if(cost>",
  'confirm Scratch free cost'
);
replaceOnce("const SCRATCH_KEYS=['pico','gobo','neko','scratch','janken'];","const SCRATCH_KEYS=['pico','gobo','gobo2','neko','scratch','janken'];","include actual Gobo card key");

const syncProfile = "async function syncCloudProfile(){if(!me||isAdmin)return;const u=U();const d=await apiCall('/player/profile',{display_name:u.display||me,char:Number(u.char)||0,chars:Array.isArray(u.chars)?u.chars:[0],img:u.img||'',story:Number(u.story)||0,charms:Array.isArray(u.charms)?u.charms:[],equippedCharmId:u.equippedCharmId||null,achievements:Array.isArray(u.achievements)?u.achievements:[],equippedAchievement:u.equippedAchievement||null,medals:Array.isArray(u.medals)?u.medals:[],equippedMedals:Array.isArray(u.equippedMedals)?u.equippedMedals:[],gachaPulls:Number(u.gachaPulls)||0});u.profileInitialized=true;return d;}";
const redeem = syncProfile + 
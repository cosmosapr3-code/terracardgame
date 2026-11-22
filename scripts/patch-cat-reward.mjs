import fs from 'node:fs';
const file='index.html';
let html=fs.readFileSync(file,'utf8');
if(html.includes('async function redeemCatRewardFromUrl')&&html.includes('limited_custom_cat_kanzen')){
 const fixes=[
  ['q.scratchBoost=0;scratchBoostMultiplier=1;','q.scratchBoost=0;q.scratchBoostMultiplier=1;',3],
  ['p.scratchBoost=0;scratchBoostMultiplier=1;','p.scratchBoost=0;p.scratchBoostMultiplier=1;',1]
 ];
 let changed=false;
 const oldCatApi='https://cat.cosmos-apr-3.workers.dev',newCatApi='https://cat.cat-b7c.workers.dev';
 if(html.includes(oldCatApi)){html=html.split(oldCatApi).join(newCatApi);changed=true;}
 if(!html.includes(newCatApi))throw new Error('CAT大戦争Workerの公開URLを確認できません。');
 for(const [before,after,expected] of fixes){
  const count=html.split(before).length-1;
  const afterCount=html.split(after).length-1;
  if(count===expected){html=html.split(before).join(after);changed=true;}
  else if(count===0&&afterCount>=expected){/* already repaired */}
  else throw new Error('Scratch multiplier reset repair: expected '+expected+' old or repaired matches, found old='+count+', repaired='+afterCount);
 }
 if(!html.includes('async function redeemCatRewardAutomatically')){
  replaceOnce(
   "async function redeemCatRewardFromUrl(){",
   "async function redeemCatRewardFromUrl(claimUrlOverride=''){",
   'allow direct reward URL input'
  );
  replaceOnce(
   "const claimUrlText=page.searchParams.get('cat_reward');if(!claimUrlText)return '';",
   "const claimUrlText=claimUrlOverride||page.searchParams.get('cat_reward');if(!claimUrlText)return '';",
   'support automatic reward claim'
  );
  replaceOnce(
   "page.searchParams.delete('cat_reward');history.replaceState(null,'',page.pathname+page.search+page.hash);",
   "if(!claimUrlOverride){page.searchParams.delete('cat_reward');history.replaceState(null,'',page.pathname+page.search+page.hash);}",
   'only clear explicit reward URL'
  );
  replaceOnce(
   "return 'CAT完全体を受け取りました！カード一覧・限定カード欄を確認してね。';\n }catch(error){console.warn('CAT大戦争報酬の受取に失敗しました',error);return 'CAT完全体の受取に失敗しました：'+String(error?.message||error);}\n}",
   "return 'CAT完全体を受け取りました！カード一覧・限定カード欄を確認してね。';\n }catch(error){console.warn('CAT大戦争報酬の受取に失敗しました',error);return 'CAT完全体の受取に失敗しました：'+String(error?.message||error);}\n}\nasync function redeemCatRewardAutomatically(){\n if(!me||isAdmin||!TERRACARD_TOKEN)return '';\n try{\n  const response=await fetch('https://cat.cosmos-apr-3.workers.dev/api/terra-reward/pending',{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({terraToken:TERRACARD_TOKEN})});\n  const data=await response.json().catch(()=>({}));\n  if(!response.ok||data.ok!==true)throw new Error(data.error||'CAT大戦争の報酬一覧を取得できませんでした');\n  const deliveries=Array.isArray(data.deliveries)?data.deliveries:[];let received=0;let firstError='';\n  for(const item of deliveries){if(!item||typeof item.claimUrl!=='string')continue;const result=await redeemCatRewardFromUrl(item.claimUrl);if(result.includes('受け取りました'))received++;else if(result&&!firstError)firstError=result;}\n  if(received)return 'CAT大戦争の報酬を'+received+'件受け取りました！カード一覧の限定カード欄を確認してね。';\n  return firstError;\n }catch(error){console.warn('CAT大戦争の自動報酬確認に失敗しました',error);return 'CAT大戦争の報酬確認に失敗しました：'+String(error?.message||error);}\n}",
   'add automatic pending reward redemption'
  );
  replaceOnce(
   "const rewardNotice=await redeemCatRewardFromUrl();go('home',rewardNotice);",
   "const urlRewardNotice=await redeemCatRewardFromUrl();const autoRewardNotice=await redeemCatRewardAutomatically();go('home',urlRewardNotice||autoRewardNotice);",
   'check CAT rewards after login'
  );
  replaceOnce(
   "const rewardNotice=await redeemCatRewardFromUrl();if(rewardNotice){msg=rewardNotice;render();}",
   "const urlRewardNotice=await redeemCatRewardFromUrl();const autoRewardNotice=await redeemCatRewardAutomatically();const rewardNotice=urlRewardNotice||autoRewardNotice;if(rewardNotice){msg=rewardNotice;render();}",
   'check CAT rewards after session restore'
  );
  changed=true;
 }
 if(!html.includes("cardKeys=Object.keys(CARDS).filter(k=>k!==TC_CAT_KANZEN_KEY)")){
  replaceOnce(
   "function cardListHtml(){\n const cardKeys=Object.keys(CARDS),cardCount=cardKeys.length;",
   "function cardListHtml(){\n const cardKeys=Object.keys(CARDS).filter(k=>k!==TC_CAT_KANZEN_KEY),cardCount=cardKeys.length;",
   'hide CAT完全体 from main card catalog'
  );changed=true;
 }
 if(!html.includes("const limitedOwned=tcOwnedLimitedCardKeys(u).filter(key=>key!==TC_CAT_KANZEN_KEY)")){
  replaceOnce(
   "const limitedOwned=tcOwnedLimitedCardKeys(u);const all=sortCharmsByRarity(u.charms)",
   "const limitedOwned=tcOwnedLimitedCardKeys(u).filter(key=>key!==TC_CAT_KANZEN_KEY);const all=sortCharmsByRarity(u.charms)",
   'hide CAT完全体 from limited collection'
  );changed=true;
  replaceOnce(
   "limitedOwned.length}/\u0024{tcAllLimitedCardKeys().length}",
   "limitedOwned.length}/\u0024{Math.max(0,tcAllLimitedCardKeys().length-1)}",
   'correct hidden limited collection count'
  );
 }
 if(!html.includes("tcAllLimitedCardKeys().filter(key=>key!==TC_CAT_KANZEN_KEY).map(key=>{const c=CARDS[key]")){
  replaceOnce(
   "tcAllLimitedCardKeys().map(key=>{const c=CARDS[key];return ",
   "tcAllLimitedCardKeys().filter(key=>key!==TC_CAT_KANZEN_KEY).map(key=>{const c=CARDS[key];return ",
   'hide CAT完全体 from admin drop list'
  );changed=true;
 }
 if(!html.includes("key!==TC_CAT_KANZEN_KEY&&drops[key]===chapter")){
  replaceOnce(
   "const candidates=tcAllLimitedCardKeys().filter(key=>drops[key]===chapter&&!tcOwnedLimitedCardKeys(user).includes(key));",
   "const candidates=tcAllLimitedCardKeys().filter(key=>key!==TC_CAT_KANZEN_KEY&&drops[key]===chapter&&!tcOwnedLimitedCardKeys(user).includes(key));",
   'exclude CAT完全体 from random story drops'
  );changed=true;
 }
 if(!html.includes("async function loadCatBridgeMissions()")){
  replaceOnce(
   "let __tcGlobalMissionLoad = null;\\nasync function loadGlobalMissions(force=false){",
   "let __tcGlobalMissionLoad = null;\\nasync function loadCatBridgeMissions(){\\n if(!me||!TERRACARD_TOKEN||isAdmin){MS.catBridge=[];return [];}\\n try{\\n  const response=await fetch('https://cat.cat-b7c.workers.dev/api/terra-reward/pending',{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({terraToken:TERRACARD_TOKEN})});\\n  const data=await response.json().catch(()=>({}));\\n  if(!response.ok||data.ok!==true)throw new Error(data.error||'CAT大戦争連動ミッションを取得できませんでした');\\n  MS.catBridge=Array.isArray(data.missions)?data.missions:[];\\n }catch(error){console.warn('CAT大戦争連動ミッション取得失敗:',error);MS.catBridge=[];}\\n saveMs();return MS.catBridge;\\n}\\nasync function loadGlobalMissions(force=false){",
   'add CAT-linked mission lookup to TERRACARD'
  );changed=true;
 }
 if(!html.includes("await loadCatBridgeMissions();")){
  replaceOnce(
   "  }));\\n  saveMs();\\n  if(screen==='missions')render();\\n  return MS.custom;",
   "  }));\\n  await loadCatBridgeMissions();\\n  saveMs();\\n  if(screen==='missions')render();\\n  return MS.custom;",
   'refresh CAT-linked missions when loading mission screen'
  );changed=true;
 }
 if(!html.includes("const catBridgeHtml=")){
  replaceOnce(
   "  const creator=isAdmin?",
   "  const catBridge=(Array.isArray(MS.catBridge)?MS.catBridge:[]).map(m=>{const linked=m.linked!==false,done=!!m.done,status=done?'✔ 達成済み':(!linked?'同じユーザー名のCAT大戦争アカウントがありません':'未達成');const rewardStatus=m.rewardStatus==='delivered'?'TERRACARDに受取済み':(m.rewardStatus==='claimable'?'TERRACARDで受取可能':(done?'ログイン時に受取確認':'クリア後に自動配布'));return '<div class=\\'panel\\'><div class=\\'row\\'><b>'+esc(m.title||'CAT大戦争：TERRA CARDに勝利')+'</b><span style=\\'flex:1\\'></span><span>'+status+'</span></div><p>'+esc(m.description||'CAT大戦争の第3章でTERRA CARDステージに勝利')+'</p><small>報酬：'+esc(m.rewardName||'CAT完全体')+' / '+rewardStatus+'</small></div>';}).join('')||'<p class=\\'sm\\'>CAT大戦争の連動ミッションを確認できませんでした。TERRACARDとCAT大戦争で同じユーザー名を使ってください。</p>';\\n  const catBridgeHtml='<div class=\\'panel\\'><h3>🐈 CAT大戦争連動ミッション</h3>'+catBridge+'</div>';\\n  const creator=isAdmin?",
   'show CAT mission inside TERRACARD missions'
  );changed=true;
 }
 if(!html.includes("'+catBridgeHtml+creator+")){
  replaceOnce(
   "'+custom+'</div>'+creator+'<div class=\\'panel\\'><h3>📖 チュートリアル",
   "'+custom+'</div>'+catBridgeHtml+creator+'<div class=\\'panel\\'><h3>📖 チュートリアル",
   'insert CAT mission panel into mission page'
  );changed=true;
 }
 const blocks=[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(x=>x.trim());
 for(const script of blocks)new Function(script);
 if(changed){fs.writeFileSync(file,html,'utf8');console.log('Added automatic CAT reward collection on TERRA CARD login; parsed inline scripts:',blocks.length);}
 else console.log('Automatic CAT reward collection already exists; Scratch multiplier repair is also current.');
 process.exit(0);
}
function replaceOnce(oldText,newText,label,expected=1){
 const count=html.split(oldText).length-1;
 if(count!==expected)throw new Error(label+': expected '+expected+', found '+count);
 html=html.split(oldText).join(newText);
}
replaceOnce(
 " freeze:'移動を凍結',skip:'ターンスキップ',add_card:'カードを手札に追加',view_hand:'手札を見る',card_effect_up:'特定カードの効果を強化',card_effect_down:'特定カードの効果を弱体化'\n};\nconst TC_CUSTOM_LIMITED_TARGETS",
 " freeze:'移動を凍結',skip:'ターンスキップ',add_card:'カードを手札に追加',scratch_boost:'Scratch属性効果アップ・コスト0',view_hand:'手札を見る',card_effect_up:'特定カードの効果を強化',card_effect_down:'特定カードの効果を弱体化'\n};\nconst TC_CUSTOM_LIMITED_TARGETS",
 'register Scratch boost action type'
);
replaceOnce(
 "const TC_CUSTOM_LIMITED_CARD_MODES={specific:'カードを指定',rarest:'出現率が最も低いカード',limited_random:'限定カードからランダム',pool_random:'通常の出現率でランダム'};\nCFG.customLimitedCards=tcNormalizeCustomLimitedCards(CFG.customLimitedCards);",
 "const TC_CUSTOM_LIMITED_CARD_MODES={specific:'カードを指定',rarest:'出現率が最も低いカード',limited_random:'限定カードからランダム',pool_random:'通常の出現率でランダム'};\nconst TC_CAT_KANZEN_KEY='limited_custom_cat_kanzen';\nconst TC_CAT_KANZEN_DEF={name:'CAT完全体',icon:'🐈‍⬛',cost:0,description:'Scratch属性カードを各2枚追加し、効果を10倍・コスト0にする。相手に10ダメージ、50%で自分に5ダメージ',effectKey:'',img:'https://cat.cat-b7c.workers.dev/assets/cards/cat-kanzen-hd.webp',actions:[{type:'add_card',target:'self',chance:100,cardMode:'specific',cardKey:'pico',count:2},{type:'add_card',target:'self',chance:100,cardMode:'specific',cardKey:'gobo2',count:2},{type:'add_card',target:'self',chance:100,cardMode:'specific',cardKey:'neko',count:2},{type:'add_card',target:'self',chance:100,cardMode:'specific',cardKey:'scratch',count:2},{type:'add_card',target:'self',chance:100,cardMode:'specific',cardKey:'janken',count:2},{type:'scratch_boost',target:'self',chance:100,multiplier:10,turns:1},{type:'damage',target:'opponent',chance:100,amount:10},{type:'damage',target:'self',chance:50,amount:5}]};\nCFG.customLimitedCards=tcNormalizeCustomLimitedCards(CFG.customLimitedCards);",
 'define built-in CAT完全体 card'
);
replaceOnce(
 "  if(['freeze','skip','card_effect_up','card_effect_down'].includes(type))x.turns=clampInt(a.turns??3,1,50);\n  if(['card_effect_up','card_effect_down'].includes(type)){",
 "  if(['freeze','skip','card_effect_up','card_effect_down','scratch_boost'].includes(type))x.turns=clampInt(a.turns??1,1,50);\n  if(type==='scratch_boost')x.multiplier=clampInt(a.multiplier??10,2,10);\n  if(['card_effect_up','card_effect_down'].includes(type)){",
 'normalize Scratch boost action'
);
replaceOnce(
 "function tcNormalizeCustomLimitedCards(raw){\n const src=raw&&typeof raw==='object'?raw:{};const out={};\n for(const [key,value] of Object.entries(src).slice(0,30)){",
 "function tcNormalizeCustomLimitedCards(raw){\n const src=raw&&typeof raw==='object'?raw:{};const out={};\n const entries=Object.entries(src).filter(([key])=>key!==TC_CAT_KANZEN_KEY).slice(0,30);\n for(const [key,value] of entries){",
 'preserve existing custom cards'
);
replaceOnce(
 "  out[key]={name:String(value.name||'限定カード').trim().slice(0,32),icon:String(value.icon||'🃏').trim().slice(0,8)||'🃏',cost:clampInt(value.cost??0,0,30),description,effectKey:actions.length?'':effectKey,actions,img:safeImg};\n }\n return out;\n}",
 "  out[key]={name:String(value.name||'限定カード').trim().slice(0,32),icon:String(value.icon||'🃏').trim().slice(0,8)||'🃏',cost:clampInt(value.cost??0,0,30),description,effectKey:actions.length?'':effectKey,actions,img:safeImg};\n }\n out[TC_CAT_KANZEN_KEY]={name:TC_CAT_KANZEN_DEF.name,icon:TC_CAT_KANZEN_DEF.icon,cost:0,description:TC_CAT_KANZEN_DEF.description,effectKey:'',actions:tcNormalizeCustomLimitedActions(TC_CAT_KANZEN_DEF.actions),img:TC_CAT_KANZEN_DEF.img};\n return out;\n}",
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
 "    else if(action.type==='ap_down'){target.ap=Math.max(0,(Number(target.ap)||0)-amount);if(targetIndex===G.turn)G.ap=target.ap;results.push(target.name+'のコスト-'+amount);}\n    else if(action.type==='freeze'){",
 "    else if(action.type==='ap_down'){target.ap=Math.max(0,(Number(target.ap)||0)-amount);if(targetIndex===G.turn)G.ap=target.ap;results.push(target.name+'のコスト-'+amount);}\n    else if(action.type==='scratch_boost'){target.scratchBoost=1;target.scratchBoostMultiplier=clampInt(action.multiplier??10,2,10);results.push(target.name+'のScratch属性効果'+target.scratchBoostMultiplier+'倍・コスト0（このターン）');}\n    else if(action.type==='freeze'){",
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
 "if(Number(G.limitedSovietTurns)>0&&(key==='sovet'||key==='missile'))cost=0;\n  if(cost>(Number(p.ap)||0))return false;",
 "if(Number(G.limitedSovietTurns)>0&&(key==='sovet'||key==='missile'))cost=0;\n  if(Number(p.scratchBoost)>0&&Number(p.scratchBoostMultiplier)>=10&&SCRATCH_KEYS.includes(key))cost=0;\n  if(cost>(Number(p.ap)||0))return false;",
 'CPU Scratch free cost'
);
replaceOnce(
 "if(Number(G.limitedSovietTurns)>0&&(k==='sovet'||k==='missile'))cost=0;\n if(cost>",
 "if(Number(G.limitedSovietTurns)>0&&(k==='sovet'||k==='missile'))cost=0;\n if(Number(p.scratchBoost)>0&&Number(p.scratchBoostMultiplier)>=10&&(SCRATCH_KEYS.includes(k)||SCRATCH_KEYS.includes(shown)))cost=0;\n if(cost>",
 'card confirm Scratch free cost'
);
replaceOnce("const SCRATCH_KEYS=['pico','gobo','neko','scratch','janken'];","const SCRATCH_KEYS=['pico','gobo','gobo2','neko','scratch','janken'];","include real Gobo key");

const syncProfile = "async function syncCloudProfile(){if(!me||isAdmin)return;const u=U();const d=await apiCall('/player/profile',{display_name:u.display||me,char:Number(u.char)||0,chars:Array.isArray(u.chars)?u.chars:[0],img:u.img||'',story:Number(u.story)||0,charms:Array.isArray(u.charms)?u.charms:[],equippedCharmId:u.equippedCharmId||null,achievements:Array.isArray(u.achievements)?u.achievements:[],equippedAchievement:u.equippedAchievement||null,medals:Array.isArray(u.medals)?u.medals:[],equippedMedals:Array.isArray(u.equippedMedals)?u.equippedMedals:[],gachaPulls:Number(u.gachaPulls)||0});u.profileInitialized=true;return d;}";
const redeemLines = [
"async function redeemCatRewardFromUrl(){",
" if(!me||isAdmin||!TERRACARD_TOKEN)return '';",
" let page;try{page=new URL(location.href)}catch{return ''}",
" const claimUrlText=page.searchParams.get('cat_reward');if(!claimUrlText)return '';",
" try{",
"  const claimUrl=new URL(claimUrlText),token=claimUrl.searchParams.get('token')||'';",
"  if(claimUrl.protocol!=='https:'||claimUrl.pathname!=='/api/terra-reward/claim'||! /^[a-f0-9]{64}$/.test(token))throw new Error('受取リンクが正しくありません');",
"  if(!(claimUrl.hostname.endsWith('.pages.dev')||claimUrl.hostname.endsWith('.workers.dev')||claimUrl.hostname==='cosmosapr3-code.github.io'))throw new Error('受取リンクの送信元を確認できません');",
"  const response=await fetch(claimUrl.toString(),{method:'GET',mode:'cors',cache:'no-store',credentials:'omit'});",
"  const data=await response.json().catch(()=>({}));",
"  if(!response.ok||data.ok!==true||!data.payload)throw new Error(data.error||'CAT大戦争から報酬情報を取得できませんでした');",
"  const payload=data.payload,username=String(payload.username||'').trim();",
"  if(payload.sourceGame!=='CAT大戦争'||payload.reward?.id!=='external-reward-cat-kanzen')throw new Error('未対応の報酬です');",
"  if(!username||username.toLowerCase()!==String(me).trim().toLowerCase())throw new Error('CAT大戦争とTERRACARDのプレイヤー名が一致しません');",
"  const key=TC_CAT_KANZEN_KEY,user=U();",
"  if(!tcOwnedLimitedCardKeys(user).includes(key))tcGiveLimitedCard(user,key);",
"  await syncCloudProfile();await refreshCloudInbox();",
"  const ackResponse=await fetch(new URL('/api/terra-reward/ack',claimUrl.origin).toString(),{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,username:me,terraToken:TERRACARD_TOKEN})});",
"  const ack=await ackResponse.json().catch(()=>({}));",
"  if(!ackResponse.ok||ack.ok!==true)throw new Error(ack.error||'カード保存後の受取確認に失敗しました');",
"  page.searchParams.delete('cat_reward');history.replaceState(null,'',page.pathname+page.search+page.hash);",
"  return 'CAT完全体を受け取りました！カード一覧・限定カード欄を確認してね。';",
" }catch(error){console.warn('CAT大戦争報酬の受取に失敗しました',error);return 'CAT完全体の受取に失敗しました：'+String(error?.message||error);}",
"}"
];
replaceOnce(syncProfile,syncProfile+'\n'+redeemLines.join('\n'),'add player-side reward redemption');
replaceOnce(
 "if(!U().profileInitialized){await syncCloudProfile();await refreshCloudInbox()}go('home');setTimeout(()=>pollCardIdeaNotifications(),500);",
 "if(!U().profileInitialized){await syncCloudProfile();await refreshCloudInbox()}const rewardNotice=await redeemCatRewardFromUrl();go('home',rewardNotice);setTimeout(()=>pollCardIdeaNotifications(),500);",
 'redeem after player login'
);
replaceOnce(
 "(async()=>{await loadGlobalGameConfig();render();if(me){setTimeout(()=>pollCardIdeaNotifications(),700);setTimeout(()=>pollGlobalUpdateNotice(),900);if(!isAdmin)setTimeout(()=>refreshPlayerNotifications(true),1100)}})();",
 "(async()=>{await loadGlobalGameConfig();render();if(me){setTimeout(()=>pollCardIdeaNotifications(),700);setTimeout(()=>pollGlobalUpdateNotice(),900);if(!isAdmin){setTimeout(()=>refreshPlayerNotifications(true),1100);setTimeout(async()=>{try{await refreshCloudInbox();const rewardNotice=await redeemCatRewardFromUrl();if(rewardNotice){msg=rewardNotice;render();}}catch(e){console.warn('ログイン維持中のCAT報酬確認失敗',e)}},1200);}}})();",
 'redeem after restored session'
);

const blocks=[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(x=>x.trim());
for(const script of blocks)new Function(script);
fs.writeFileSync(file,html,'utf8');
console.log('patched index.html; parsed inline scripts:',blocks.length);

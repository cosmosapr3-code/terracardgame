import fs from 'node:fs';

const file = 'index.html';
const snippetFile = 'scripts/external-game-links-ui.txt';
let html = fs.readFileSync(file, 'utf8');
const helpers = fs.readFileSync(snippetFile, 'utf8').trim();

if (!html.includes("const TERRACARD_API='https://terracard-api.cosmos-apr-3.workers.dev'")) {
  throw new Error('TERRACARD_API endpoint was not found; refusing to patch a different frontend.');
}
if (!helpers.includes('function tcNormalizeExternalGames(') ||
    !helpers.includes('function tcAdminExternalGamesHtml(') ||
    !helpers.includes('function tcExternalGamesHtml(')) {
  throw new Error('External-games helper source is incomplete.');
}

function replaceOnce(oldText, newText, label, expected = 1) {
  const count = html.split(oldText).length - 1;
  if (count !== expected) throw new Error(label + ': expected ' + expected + ' match(es), found ' + count);
  html = html.split(oldText).join(newText);
}

// Preserve the list in the existing D1-backed shared game-config object.
if (!html.includes('CFG.externalGames=tcNormalizeExternalGames(CFG.externalGames)')) {
  replaceOnce(
    "CFG.updateNotice=CFG.updateNotice&&typeof CFG.updateNotice==='object'?CFG.updateNotice:null;CFG.storyChapterUnlocks=",
    "CFG.updateNotice=CFG.updateNotice&&typeof CFG.updateNotice==='object'?CFG.updateNotice:null;CFG.externalGames=tcNormalizeExternalGames(CFG.externalGames);CFG.storyChapterUnlocks=",
    'initialize external games in local config'
  );
}
if (!html.includes('externalGames:tcNormalizeExternalGames(c.externalGames)')) {
  replaceOnce(
    "updateNotice:c.updateNotice&&typeof c.updateNotice==='object'?c.updateNotice:null};localStorage.cgc_cfg=",
    "updateNotice:c.updateNotice&&typeof c.updateNotice==='object'?c.updateNotice:null,externalGames:tcNormalizeExternalGames(c.externalGames)};localStorage.cgc_cfg=",
    'load external games from shared config'
  );
}
if (!html.includes('function tcNormalizeExternalGames(')) {
  replaceOnce('function applyCfg(){', helpers + '\nfunction applyCfg(){', 'add external-games UI and handlers');
}

// Add the operator editor near the top of the existing operator panel.
const adminPanelCall = '$' + '{tcAdminExternalGamesHtml()}';
if (!html.includes(adminPanelCall)) {
  replaceOnce(
    '<h2>運営パネル</h2>',
    '<h2>運営パネル</h2>__ADMIN_GAMES_PANEL__',
    'insert external-games manager in admin panel'
  );
  html = html.replace('__ADMIN_GAMES_PANEL__', adminPanelCall);
}

// Add the public entry in the existing Other menu.
if (!html.includes('🎮 別ゲーム</button>')) {
  replaceOnce(
    '<button onclick="go(\'post\')">📮 ポスト ',
    '<button type="button" onclick="go(\'externalGames\')">🎮 別ゲーム</button>\n <button onclick="go(\'post\')">📮 ポスト ',
    'add public Other-menu entry'
  );
}

// Add the public page renderer.
if (!html.includes("if(screen==='externalGames')h=nav+tcExternalGamesHtml();")) {
  replaceOnce(
    "if(screen==='battleMenu')h=nav+",
    "if(screen==='externalGames')h=nav+tcExternalGamesHtml();\n if(screen==='battleMenu')h=nav+",
    'add external-games page'
  );
}

// Refresh the shared list whenever a player opens the page.
if (!html.includes("if(s==='externalGames'&&me&&!isAdmin)")) {
  replaceOnce(
    "if(s==='notifications'&&me&&!isAdmin)openPlayerNotifications()}",
    "if(s==='notifications'&&me&&!isAdmin)openPlayerNotifications();if(s==='externalGames'&&me&&!isAdmin){loadGlobalGameConfig().then(()=>{if(screen==='externalGames')render()}).catch(()=>{});}}",
    'refresh external games when page opens'
  );
}

const blocks = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());
for (const source of blocks) new Function(source);

if (!html.includes("onclick=\"go('externalGames')\"") ||
    !html.includes("if(screen==='externalGames')h=nav+tcExternalGamesHtml();") ||
    !html.includes('externalGames:tcNormalizeExternalGames(c.externalGames)') ||
    !html.includes(adminPanelCall)) {
  throw new Error('Post-patch verification failed: one or more external-games UI/config hooks are missing.');
}

fs.writeFileSync(file, html, 'utf8');
console.log('External-games portal patched and inline scripts parsed:', blocks.length);

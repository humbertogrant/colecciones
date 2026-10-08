const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const base=path.resolve(__dirname,'..'),url='file://'+base+'/index.html',key='canto.colecciones.personal.v1';
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
const ctx=await b.newContext({acceptDownloads:true});let p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
const id=await p.locator('[data-punch]').first().getAttribute('data-punch');await p.locator('[data-punch]').first().click();await p.locator('[data-open]').first().click();await p.locator('[data-note]').fill('Recuerdo persistente <script>');await p.locator('[data-date]').fill('2026-10-07');await p.locator('[data-save-note]').click();
await p.locator('[data-new]').click();await p.locator('[name=listTitle]').fill('Mi lista persistente');await p.locator('[name=kind]').selectOption('book');await p.locator('[name=entries]').fill('Mi libro | Yo | 2026');await p.locator('[data-import-form] button[type=submit]').click();await p.locator('[data-confirm-import]').click();await p.locator('[data-punch]').click();
await p.close();p=await ctx.newPage();await p.goto(url);assert.equal(await p.locator('[data-list-count]').textContent(),'18');assert.equal(await p.locator('[data-count]').textContent(),'1');await p.locator('[data-open="'+id+'"]').click();assert.equal(await p.locator('[data-note]').inputValue(),'Recuerdo persistente <script>');assert.equal(await p.locator('[data-date]').inputValue(),'2026-10-07');await p.locator('[data-list^="custom-"]').click();assert.equal(await p.locator('[data-count]').textContent(),'1');
await p.locator('.cr-storage summary').click();const download=p.waitForEvent('download');await p.locator('[data-export]').click();const d=await download;const backup=JSON.parse(fs.readFileSync(await d.path(),'utf8'));assert.equal(backup.lists.length,1);assert.equal(backup.works.filter(w=>w.status==='done').length,2);assert.ok(!JSON.stringify(backup).includes('base64'));
const before=await p.evaluate(k=>localStorage.getItem(k),key);
const rejectBackup=async text=>{
  // Start from a completed valid review so a previous error cannot satisfy this check.
  await p.locator('[data-backup-file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await p.locator('[data-restore-review]').waitFor({state:'visible'});
  await p.locator('[data-backup-file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(text)});await p.locator('[data-backup-error]').waitFor({state:'visible'});
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),before);
};
await rejectBackup('{oops');const malicious=structuredClone(backup);malicious.lists[0].id='x" onclick="alert(1)';await rejectBackup(JSON.stringify(malicious));
// Recover only repeated item references; duplicate entities and missing works stay invalid.
for(const mutate of [value=>value.works.push({...value.works[0]}),value=>value.lists.push({...value.lists[0]}),value=>value.lists[0].items.push('missing-work')]){
  const invalid=structuredClone(backup);mutate(invalid);
  await rejectBackup(JSON.stringify(invalid));
}
const ctx2=await b.newContext();const q=await ctx2.newPage();await q.goto(url);await q.locator('.cr-storage summary').click();await q.locator('[data-backup-file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});assert.equal(await q.locator('[data-list-count]').textContent(),'17');await q.locator('[data-restore]').click();assert.equal(await q.locator('[data-list-count]').textContent(),'18');await q.reload();assert.equal(await q.locator('[data-count]').textContent(),'1');await q.locator('.cr-storage summary').click();await q.locator('[data-undo-restore]').click();assert.equal(await q.locator('[data-count]').textContent(),'0');assert.equal(await q.locator('[data-list-count]').textContent(),'17');
// Quota failures preserve the prior saved value and announce the unsaved state.
await q.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}});await q.locator('[data-punch]').first().click();assert.match(await q.locator('[data-storage-status]').textContent(),/No se pudo guardar/);await q.reload();assert.equal(await q.locator('[data-count]').textContent(),'0');
// Corrupt/future saves stay untouched until the user explicitly restores a backup.
for(const raw of ['{oops','{"version":99}']){
  await q.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});await q.reload();await q.locator('[data-punch]').first().click();
  assert.equal(await q.evaluate(k=>localStorage.getItem(k),key),raw);assert.match(await q.locator('[data-storage-status]').textContent(),/No lo sobrescribiremos/);
  await q.locator('[data-backup-file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await q.locator('[data-restore]').click();
  assert.match(await q.locator('[data-storage-status]').textContent(),/Respaldo restaurado y guardado/);await q.reload();assert.equal(await q.locator('[data-count]').textContent(),'1');assert.equal(await q.locator('[data-list-count]').textContent(),'18');
}
// A real storage event must not disable the restore conflict check or replace its undo copy.
const stale=await ctx2.newPage();stale.on('pageerror',e=>errors.push(e.message));await stale.goto(url);await stale.locator('.cr-storage summary').click();
await stale.locator('[data-backup-file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
const undoBeforeConflict=await q.evaluate(k=>localStorage.getItem(k+'.before-restore'),key);assert.ok(undoBeforeConflict);
await q.locator('[data-punch]').nth(1).click();const latestSave=await q.evaluate(k=>localStorage.getItem(k),key);
await stale.waitForFunction(()=>document.querySelector('[data-storage-status]').textContent.includes('otra pestaña'));
await stale.locator('[data-restore]').click();assert.match(await stale.locator('[data-backup-error]').textContent(),/otra pestaña/);
assert.equal(await q.evaluate(k=>localStorage.getItem(k),key),latestSave);assert.equal(await q.evaluate(k=>localStorage.getItem(k+'.before-restore'),key),undoBeforeConflict);
await q.reload();assert.equal(await q.locator('[data-count]').textContent(),'2');await stale.close();
// Old imports with repeated references recover their marks, notes and original item order.
const legacy=structuredClone(backup),first=legacy.lists[0].items[0];legacy.lists[0].items=[first,id,first,id];
const recoveryContext=await b.newContext(),recovered=await recoveryContext.newPage();recovered.on('pageerror',e=>errors.push(e.message));await recovered.goto(url);
await recovered.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:legacy});await recovered.reload();
assert.match(await recovered.locator('[data-storage-status]').textContent(),/Datos recuperados/);assert.equal(await recovered.locator('[data-count]').textContent(),'1');
await recovered.locator('[data-open="'+id+'"]').click();assert.equal(await recovered.locator('[data-note]').inputValue(),'Recuerdo persistente <script>');assert.equal(await recovered.locator('[data-date]').inputValue(),'2026-10-07');
await recovered.locator('[data-list^="custom-"]').click();assert.deepEqual(await recovered.locator('[data-punch]').evaluateAll(nodes=>nodes.map(node=>node.dataset.punch)),[first,id]);
await recovered.locator('.cr-storage summary').click();await recovered.locator('[data-backup-file]').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});await recovered.locator('[data-restore]').click();
assert.match(await recovered.locator('[data-storage-status]').textContent(),/Respaldo restaurado y guardado/);
const repaired=await recovered.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.deepEqual(repaired.lists[0].items,[first,id]);assert.equal(repaired.works.filter(w=>w.status==='done').length,2);
await recovered.reload();await recovered.locator('[data-list^="custom-"]').click();assert.equal(await recovered.locator('[data-count]').textContent(),'2');await recoveryContext.close();
// Optimistic conflict detection, even without a storage event.
await p.evaluate(k=>localStorage.setItem(k,'{"changed":true}'),key);await p.locator('[data-punch]').first().click();assert.match(await p.locator('[data-storage-status]').textContent(),/otra pestaña/);assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),'{"changed":true}');
assert.deepEqual(errors,[]);console.log('PASS: reload/reopen, custom lists, notes/dates, backup download/restore/undo, malformed and hostile input, quota, corrupt-save recovery, duplicate-reference recovery, conflicting writes and two-tab restore protection.');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});

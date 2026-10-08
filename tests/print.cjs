const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=path.resolve(__dirname,'..'),output=path.join(base,'test-results');
const key='canto.colecciones.personal.v1';
async function screenState(page){
  return page.evaluate(key=>({title:document.title,list:document.querySelector('[data-list][aria-current=true]').dataset.list,page:document.querySelector('[data-page-picker]').value,grid:document.querySelector('[data-grid]').innerHTML,detailHidden:document.querySelector('[data-detail]').hidden,note:document.querySelector('[data-note]').value,date:document.querySelector('[data-date]').value,status:document.querySelector('[data-status]').value,saved:localStorage.getItem(key)}),key);
}
async function capturePrint(page){
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  const result=await page.locator('[data-print-view]').evaluate(el=>({text:el.textContent,rows:[...el.querySelectorAll('[data-print-row]')].map(row=>({id:row.dataset.printRow,marker:row.cells[0].textContent,work:row.cells[1].textContent,state:row.cells[2].textContent,date:row.cells[3].textContent})),images:el.querySelectorAll('img').length,unsafeNodes:el.querySelectorAll('script,img,svg,iframe').length}));
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  return result;
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  try{
    fs.mkdirSync(output,{recursive:true});
    const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.join(base,'index.html')).href);await page.evaluate(()=>document.fonts.ready);
    const catalog=await page.locator('[data-catalog]').evaluate(el=>JSON.parse(el.textContent)),hundred=catalog.lists.find(l=>l.id==='4chan-lit-2025')||catalog.lists.find(l=>l.ranked&&l.items.length===100);
    assert.ok(hundred,'A ranked 100-work collection is available');await page.locator('[data-list="'+hundred.id+'"]').click();
    await page.locator('[data-punch]').first().click();await page.locator('[data-open]').nth(1).click();await page.locator('[data-status]').selectOption('skipped');await page.locator('[data-save-note]').click();
    await page.locator('[data-page-next]').click();await page.locator('[data-open]').first().click();await page.locator('[data-status]').selectOption('doing');await page.locator('[data-date]').fill('2026-10-08');await page.locator('[data-save-note]').click();await page.locator('[data-note]').fill('Private unsaved note must stay on screen only');
    const before=await screenState(page),printed=await capturePrint(page);
    assert.equal(printed.rows.length,100);assert.deepEqual(printed.rows.map(r=>r.id),hundred.items);assert.equal(printed.rows.at(-1).marker,'100');
    const firstWork=catalog.works.find(w=>w.id===hundred.items[0]);assert.match(printed.rows[0].state,/✓/);assert.ok(printed.rows[0].state.includes(firstWork.kind==='book'?'Leído':'Vista'));
    assert.match(printed.rows[1].state,/La dejo pasar/);assert.match(printed.rows[12].state,/En curso/);assert.equal(printed.rows[12].date,'2026-10-08');assert.match(printed.rows[99].state,/Pendiente/);
    assert.ok(printed.text.includes(hundred.source));assert.ok(printed.text.includes('1 / 100'));assert.ok(!printed.text.includes('Private unsaved note'));assert.equal(printed.images,0);assert.deepEqual(await screenState(page),before);
    // The button invokes browser print; beforeprint also supports Ctrl+P and produces fresh data.
    await page.evaluate(()=>{window.__nativePrint=window.print;window.__printCalls=0;window.print=()=>{window.__printCalls++;window.dispatchEvent(new Event('beforeprint'));window.dispatchEvent(new Event('afterprint'));};});
    await page.locator('[data-print]').click();assert.equal(await page.evaluate(()=>window.__printCalls),1);assert.deepEqual(await screenState(page),before);await page.evaluate(()=>{window.print=window.__nativePrint;});
    await page.pdf({path:path.join(output,'print-100.pdf'),preferCSSPageSize:true,printBackground:false});assert.deepEqual(await screenState(page),before);
    // A later change is reflected without printing an old snapshot.
    await page.locator('[data-punch]').nth(1).click();const refreshed=await capturePrint(page);assert.match(refreshed.rows[13].state,/✓/);assert.ok(refreshed.text.includes('2 / 100'));
    // Preserve collection-specific translated titles and award years.
    const aliases=catalog.lists.find(l=>l.displayItems&&Object.entries(l.displayItems).some(([id,v])=>v.title!==catalog.works.find(w=>w.id===id).title));assert.ok(aliases);
    if(aliases.group==='Descubrimiento de países')await page.locator('[data-country-group] summary').click();
    await page.locator('[data-list="'+aliases.id+'"]').click();const translated=await capturePrint(page);
    for(const [id,alias] of Object.entries(aliases.displayItems)){const row=translated.rows.find(r=>r.id===id);assert.ok(row.work.includes(alias.fullTitle||alias.title));}
    const awards=catalog.lists.find(l=>l.itemMeta&&Object.values(l.itemMeta).some(m=>m.awardYear||m.laureateYear));await page.locator('[data-list="'+awards.id+'"]').click();const awarded=await capturePrint(page);
    for(const row of awarded.rows){const meta=awards.itemMeta[row.id];if(meta)assert.equal(row.marker,String(meta.laureateYear||meta.awardYear));}
    assert.ok(awarded.text.includes('Año del premio'));
    // Custom text must remain text, including markup-like titles and sources.
    const customTitle='Mi lista <script>alert(1)</script> & cine',customSource='Edición <b>personal</b> & 2026';
    await page.locator('[data-new]').click();await page.locator('[name=listTitle]').fill(customTitle);await page.locator('[name=source]').fill(customSource);await page.locator('[name=kind]').selectOption('book');
    await page.locator('[name=entries]').fill('<img src=x onerror=alert(1)> & una obra | Autora <b>literal</b> | 2026\nUna segunda obra con un título largo que debe ajustarse al ancho de la página sin cortar sus palabras ni ocultar la autoría | Un nombre de autor suficientemente largo para comprobar el salto de línea | 2025');
    await page.locator('[data-import-form] button[type=submit]').click();await page.locator('[data-confirm-import]').click();await page.locator('[data-punch]').first().click();
    await page.locator('[data-open]').first().click();await page.locator('[data-date]').fill('2026-10-08');await page.locator('[data-note]').fill('Private saved note must not print');await page.locator('[data-save-note]').click();
    const customBefore=await screenState(page),custom=await capturePrint(page);assert.equal(custom.rows.length,2);assert.ok(custom.text.includes(customTitle));assert.ok(custom.text.includes(customSource));assert.ok(custom.rows[0].work.includes('<img src=x onerror=alert(1)>'));assert.equal(custom.unsafeNodes,0);assert.ok(!custom.text.includes('Private saved note'));assert.equal(custom.rows[0].date,'2026-10-08');
    await page.pdf({path:path.join(output,'print-custom.pdf'),preferCSSPageSize:true,printBackground:false});assert.deepEqual(await screenState(page),customBefore);
    await page.emulateMedia({media:'print'});await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    assert.equal(await page.locator('.cr-workspace').isVisible(),false);assert.equal(await page.locator('[data-print-view]').isVisible(),true);
    const style=await page.locator('[data-print-row]').first().evaluate(el=>({font:getComputedStyle(el).fontSize,rootBackground:getComputedStyle(document.getElementById('canto-colecciones')).backgroundColor}));assert.ok(parseFloat(style.font)>=13.3);assert.equal(style.rootBackground,'rgb(255, 255, 255)');
    await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));assert.deepEqual(await screenState(page),customBefore);assert.deepEqual(errors,[]);
    console.log('PASS: complete ordered print/PDF, states/dates, fresh Ctrl+P data, native print button, custom/translated/award lists, escaping and unchanged screen/storage. Samples: test-results/print-100.pdf and print-custom.pdf.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

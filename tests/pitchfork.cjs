const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'..'),key='canto.colecciones.personal.v1';
const catalog=JSON.parse(fs.readFileSync(path.join(base,'data/catalog.json'),'utf8'));
const works=new Map(catalog.works.map(work=>[work.id,work]));
const list=catalog.lists.find(list=>list.id==='pitchfork-readers-1996-2021');
const display=id=>({...works.get(id),...list.displayItems?.[id]});
const oldListIds=new Set([
  'nyt-books-critics-2024','nyt-books-readers-2024','nyt-films-2025','nyt-series-2026',
  'hugo-best-novel-1953-2026','pulitzer-fiction-1953-2026',
  'nobel-literature-2000-2026','nobel-economics-2000-2025',
  'countries-japan','countries-china','countries-india','countries-mexico',
  'countries-russia','countries-germany','countries-brazil','countries-turkey','countries-iran',
  '4chan-lit-2025','time-novels-2005','time-fantasy-2020','sight-and-sound-critics-2022',
]);

(async()=>{
  assert.ok(list,'the Pitchfork readers selection is available');
  assert.equal(list.kind,'music');assert.equal(list.ranked,true);
  assert.equal(list.items.length,200);assert.equal(new Set(list.items).size,200);
  assert.match(new URL(list.sourceUrl).hostname,/(^|\.)pitchfork\.com$/);
  assert.match(list.source+' '+list.note,/lectores|readers/i);
  assert.ok(list.items.every(id=>works.get(id)?.kind==='music'&&works.get(id).coverFile));
  assert.ok(list.items.every(id=>Number(display(id).year)>=1996&&Number(display(id).year)<=2021));
  const first=list.items[0],beyondLimit=list.items[150],last=list.items[199];
  // Anchors from Pitchfork's 25th anniversary poll, including the first album
  // beyond the personal-list limit and the final album that must still print.
  assert.deepEqual([display(first).title,display(first).creator],['Kid A','Radiohead']);
  assert.deepEqual([display(beyondLimit).title,display(beyondLimit).creator],['LP1','FKA twigs']);
  assert.deepEqual([display(last).title,display(last).creator],["Mama's Gun",'Erykah Badu']);

  const oldLists=catalog.lists.filter(collection=>oldListIds.has(collection.id));
  assert.equal(oldLists.length,21);
  const oldIds=new Set(oldLists.flatMap(collection=>collection.items));
  assert.equal(oldIds.size,978,'the pre-Pitchfork catalog remains available');
  assert.ok(list.items.every(id=>!oldIds.has(id)),'the earlier Dylan albums are outside the 1996–2021 selection');
  const dylan='music-a9ef71248353',parasite='film-5051a884b137';
  const memories={
    [dylan]:{status:'done',note:'El disco de Dylan ya estaba escuchado.',date:'2026-10-05'},
    [parasite]:{status:'doing',note:'Mi recuerdo anterior de cine.',date:'2026-10-06'},
  };
  const personalWork={id:'u4000',kind:'music',title:'Mi grabación personal',creator:'Yo',year:'2026',status:'done',note:'Mi audio y su recuerdo permanecen.',date:'2026-10-04'};
  const personalList={id:'custom-4001',title:'Mi música antes de Pitchfork',kind:'music',source:'Colección propia',items:[dylan,personalWork.id]};
  const previous={format:'canto-colecciones',version:1,works:[...catalog.works.filter(work=>oldIds.has(work.id)).map(({id,kind,title,creator,year})=>({id,kind,title,creator,year,status:'pending',note:'',date:'',...memories[id]})),personalWork],lists:[personalList]};
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  try{
    const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage({viewport:{width:1100,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const url=pathToFileURL(path.join(base,'index.html')).href;
    await page.goto(url);
    const embedded=await page.locator('[data-catalog]').evaluate(el=>JSON.parse(el.textContent));
    assert.ok(list.items.every(id=>embedded.works.find(work=>work.id===id).cover?.startsWith('data:image/webp;base64,')),'all 200 covers are available offline');
    const raw=JSON.stringify(previous);
    await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});await page.reload();
    assert.match(await page.locator('[data-storage-status]').textContent(),/Datos recuperados/);
    assert.equal(await page.locator('[data-list-count]').textContent(),String(catalog.lists.length+1));
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),raw,'loading the larger catalog does not rewrite the old save');
    async function visit(collection,id){
      await page.locator('[data-list="'+collection.id+'"]').click();
      if(collection.items.length>12)await page.locator('[data-page-picker]').selectOption(String(Math.floor(collection.items.indexOf(id)/12)));
      await page.locator('[data-open="'+id+'"]').click();
    }
    async function memory(expected){
      assert.equal(await page.locator('[data-status]').inputValue(),expected.status);
      assert.equal(await page.locator('[data-note]').inputValue(),expected.note);
      assert.equal(await page.locator('[data-date]').inputValue(),expected.date);
    }
    await visit(personalList,personalWork.id);await memory(personalWork);
    await visit(personalList,dylan);await memory(memories[dylan]);
    await page.locator('[data-list="'+list.id+'"]').click();
    assert.equal(await page.locator('[data-count-label]').textContent(),'escuchados');
    assert.equal(await page.locator('[data-total]').textContent(),'/ 200');
    assert.equal(await page.locator('[data-page-picker] option').count(),17);
    const seen=[];
    for(let p=0;p<17;p++){
      await page.locator('[data-page-picker]').selectOption(String(p));
      seen.push(...await page.locator('[data-work]').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.work,marker:node.querySelector('.cr-work-num').textContent}))));
    }
    assert.deepEqual(seen,list.items.map((id,i)=>({id,marker:String(i+1)})));
    assert.equal(await page.locator('[data-range-bottom]').textContent(),'193–200 de 200');
    assert.equal(await page.locator('[data-work]').count(),8);assert.equal(await page.locator('[data-page-next]').isDisabled(),true);

    const firstMemory={status:'done',note:'Mi recuerdo musical compartido.',date:'2026-10-08'};
    const lastMemory={status:'done',note:'El puesto 200 también se conserva.',date:'2026-10-07'};
    for(const [id,expected] of [[first,firstMemory],[last,lastMemory]]){
      await visit(list,id);await page.locator('[data-punch="'+id+'"]').click();
      assert.equal(await page.locator('[data-work="'+id+'"] .cr-work-state').textContent(),'Escuchado');
      await page.locator('[data-note]').fill(expected.note);await page.locator('[data-date]').fill(expected.date);await page.locator('[data-save-note]').click();
    }
    await visit(list,beyondLimit);await page.locator('[data-status]').selectOption('doing');await page.locator('[data-save-note]').click();
    assert.equal(await page.locator('[data-count]').textContent(),'2');
    const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    for(const old of previous.works){
      const current=saved.works.find(work=>work.id===old.id);assert.ok(current);
      assert.deepEqual({status:current.status,note:current.note,date:current.date},{status:old.status,note:old.note,date:old.date});
    }
    assert.deepEqual(saved.lists,[personalList]);assert.equal(saved.works.length,catalog.works.length+1);
    await page.reload();await visit(list,last);await memory(lastMemory);

    // The included 200-album list must coexist with the 150-entry limit for
    // user-created lists. Importing albums reuses their listening memories.
    const lines=list.items.slice(0,151).map(id=>{const w=display(id);return [w.title,w.creator,w.year].join(' | ');});
    await page.locator('[data-new]').click();await page.locator('[name=listTitle]').fill('Mis 150 álbumes');await page.locator('[name=kind]').selectOption('music');
    const beforeRejected=await page.evaluate(key=>localStorage.getItem(key),key);
    await page.locator('[name=entries]').fill(lines.join('\n'));await page.locator('[data-import-form] button[type=submit]').click();
    assert.match(await page.locator('[data-import-error]').textContent(),/150/);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),beforeRejected);
    await page.locator('[name=entries]').fill(lines.slice(0,150).join('\n'));await page.locator('[data-import-form] button[type=submit]').click();
    assert.match(await page.locator('[data-review-summary]').textContent(),/150 títulos · 150 coincidencias/);
    await page.locator('[data-confirm-import]').click();
    assert.equal(await page.locator('[data-count]').textContent(),'1');assert.equal(await page.locator('[data-total]').textContent(),'/ 150');
    await page.locator('[data-open="'+first+'"]').click();await memory(firstMemory);
    const imported=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    assert.equal(imported.works.length,catalog.works.length+1,'imported album matches do not duplicate works');
    assert.deepEqual(imported.lists.find(collection=>collection.id!==personalList.id).items,list.items.slice(0,150));

    // A normal export/restore includes all 200 album states, while serializing
    // only personal lists so its validator never treats Pitchfork as a 200-item import.
    await page.locator('.cr-storage summary').click();
    const downloading=page.waitForEvent('download');await page.locator('[data-export]').click();
    const download=await downloading,backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(backup.lists.length,2);assert.ok(!backup.lists.some(collection=>collection.id===list.id));
    assert.equal(backup.works.length,catalog.works.length+1);assert.ok(!JSON.stringify(backup).includes('base64'));
    const restoredContext=await browser.newContext(),restored=await restoredContext.newPage();
    restored.on('pageerror',error=>errors.push(error.message));await restored.goto(url);
    await restored.locator('.cr-storage summary').click();
    await restored.locator('[data-backup-file]').setInputFiles({name:'pitchfork.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await restored.locator('[data-restore]').click();await restored.reload();
    assert.match(await restored.locator('[data-storage-status]').textContent(),/Datos recuperados/);
    await restored.locator('[data-list="'+list.id+'"]').click();await restored.locator('[data-page-picker]').selectOption('16');await restored.locator('[data-open="'+last+'"]').click();
    assert.equal(await restored.locator('[data-status]').inputValue(),'done');assert.equal(await restored.locator('[data-note]').inputValue(),lastMemory.note);assert.equal(await restored.locator('[data-date]').inputValue(),lastMemory.date);
    assert.equal(await restored.locator('[data-count]').textContent(),'2');await restoredContext.close();

    await visit(list,last);
    const screen=()=>page.evaluate(key=>({saved:localStorage.getItem(key),title:document.title,page:document.querySelector('[data-page-picker]').value}),key);
    const beforePrint=await screen();await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    const printed=await page.locator('[data-print-view]').evaluate(el=>({text:el.textContent,head:el.querySelector('thead tr:last-child th').textContent,rows:[...el.querySelectorAll('[data-print-row]')].map(row=>({id:row.dataset.printRow,marker:row.cells[0].textContent,state:row.cells[2].textContent,date:row.cells[3].textContent}))}));
    await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
    assert.equal(printed.head,'Puesto');assert.equal(printed.rows.length,200);
    assert.deepEqual(printed.rows.map(row=>row.id),list.items);assert.deepEqual(printed.rows.map(row=>row.marker),list.items.map((_,i)=>String(i+1)));
    assert.match(printed.rows[150].state,/En curso/);assert.match(printed.rows[199].state,/✓.*Escuchado/);assert.equal(printed.rows[199].date,lastMemory.date);
    assert.equal(printed.rows.filter(row=>/✓/.test(row.state)).length,2);assert.ok(printed.text.includes('2 / 200 escuchados'));
    assert.ok(!printed.text.includes(lastMemory.note));assert.deepEqual(await screen(),beforePrint);
    fs.mkdirSync(path.join(base,'test-results'),{recursive:true});
    await page.pdf({path:path.join(base,'test-results/print-pitchfork-200.pdf'),preferCSSPageSize:true,printBackground:false});
    assert.deepEqual(await screen(),beforePrint);assert.deepEqual(errors,[]);
    console.log('PASS: Pitchfork 200 albums/covers, all 17 pages and 200 print rows, 978-work v1 migration, listening states, 150-item music imports, shared memories and complete backup/restore.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});

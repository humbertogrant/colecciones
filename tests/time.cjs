const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'..'),key='canto.colecciones.personal.v1';
const source=JSON.parse(fs.readFileSync(path.join(base,'data/catalog.json'),'utf8'));
const byId=new Map(source.works.map(work=>[work.id,work]));
const novels=source.lists.find(list=>list.id==='time-novels-2005');
const fantasy=source.lists.find(list=>list.id==='time-fantasy-2020');
const display=(list,id)=>({...byId.get(id),...list.displayItems?.[id]});
const find=(list,title)=>list.items.find(id=>display(list,id).title===title);
// These are the collections present in 0.11.1. The historic 726-work save is
// independent of new collections, including later additions beyond TIME.
const oldListIds=new Set([
  'nyt-books-critics-2024','nyt-books-readers-2024','nyt-films-2025','nyt-series-2026',
  'hugo-best-novel-1953-2026','pulitzer-fiction-1953-2026',
  'nobel-literature-2000-2026','nobel-economics-2000-2025',
  'countries-japan','countries-china','countries-india','countries-mexico',
  'countries-russia','countries-germany','countries-brazil','countries-turkey','countries-iran','4chan-lit-2025',
]);

(async()=>{
  assert.ok(novels&&fantasy,'both TIME selections are available');
  for(const list of [novels,fantasy]){
    assert.equal(list.items.length,100);
    assert.equal(new Set(list.items).size,100,'one entry per selected work');
    assert.equal(list.ranked,false,'TIME selections are not quality rankings');
    assert.match(new URL(list.sourceUrl).hostname,/(^|\.)time\.com$/);
    assert.ok(list.items.every(id=>byId.get(id)?.kind==='book'&&byId.get(id).coverFile),'all 100 entries are books with local covers');
  }
  assert.match(novels.source+' '+novels.note,/1923[\s\S]*2005/,'the novel selection states its publication period');
  assert.match(novels.orderLabel,/alfab[ée]tico/i);
  assert.match(fantasy.orderLabel,/cronol[óo]gico/i);
  for(const id of novels.items){
    const years=String(display(novels,id).year).match(/\d{4}/g)?.map(Number);
    assert.ok(years?.length&&years.every(year=>year>=1923&&year<=2005),'novel publication dates fall within 1923–2005: '+id);
  }
  assert.equal(display(novels,novels.items[0]).title,'The Adventures of Augie March');
  assert.equal(display(novels,novels.items.at(-1)).title,'Wide Sargasso Sea');
  assert.equal(display(fantasy,fantasy.items[0]).title,'The Arabian Nights');
  assert.match(String(display(fantasy,fantasy.items[0]).year),/IX|9|800|850|900/);
  assert.equal(display(fantasy,fantasy.items.at(-1)).title,'Woven in Moonlight');
  assert.equal(String(display(fantasy,fantasy.items.at(-1)).year),'2020');
  // Keep TIME's published sequence, including its Outlander/Tigana inversion;
  // do not silently turn the selection into a newly sorted or ranked list.
  assert.equal(display(fantasy,fantasy.items[40]).title,'Outlander');
  assert.equal(display(fantasy,fantasy.items[41]).title,'Tigana');

  const alice='book-55091c4dda8e',orwell='book-ac93b15852bb',cycle='book-1a817b6c9822';
  assert.equal(fantasy.items[2],alice,'the longer Alice title reuses the existing work');
  assert.ok(novels.items.includes(orwell),'1984 reuses the existing /lit/ work');
  assert.equal(find(novels,'The Lord of the Rings'),cycle,'the complete Tolkien novel reuses its existing ID');
  const fellowship=find(fantasy,'The Fellowship of the Ring'),towers=find(fantasy,'The Two Towers'),returnOfKing=find(fantasy,'The Return of the King');
  assert.ok(fellowship&&towers&&returnOfKing);
  assert.equal(new Set([cycle,fellowship,towers,returnOfKing,'film-27b3230b3260']).size,5,'three Tolkien volumes, the whole novel and its film remain separate');
  assert.ok(!fantasy.items.includes(cycle),'fantasy selects individual Tolkien volumes, not the complete cycle');
  const lion=find(novels,'The Lion, the Witch and the Wardrobe');
  assert.ok(lion);
  assert.equal(find(fantasy,'The Lion, the Witch and the Wardrobe'),lion,'a work newly added to both TIME lists has a single ID');
  const watchmen=find(novels,'Watchmen');assert.ok(watchmen);assert.notEqual(watchmen,'series-d4182b77fad6','the graphic novel is separate from the television series');

  const oldIds=new Set(source.lists.filter(list=>oldListIds.has(list.id)).flatMap(list=>list.items));
  assert.equal(oldIds.size,726,'the pre-TIME catalog remains intact');
  const memories={
    [alice]:{status:'done',note:'Alicia ya estaba leída antes de añadir TIME.',date:'2026-10-07'},
    [orwell]:{status:'doing',note:'Mi recuerdo anterior de 1984.',date:'2026-10-06'},
    [cycle]:{status:'done',note:'Terminé los tres volúmenes del ciclo.',date:'2026-09-30'},
  };
  const personalWork={id:'u2000',kind:'book',title:'Un libro de mi biblioteca',creator:'Yo',year:'2026',status:'done',note:'Mi recuerdo personal también se conserva.',date:'2026-10-05'};
  const personalList={id:'custom-2001',title:'Mi colección antes de TIME',kind:'book',source:'Colección propia',items:[alice,personalWork.id]};
  const previous={format:'canto-colecciones',version:1,works:[...source.works.filter(work=>oldIds.has(work.id)).map(({id,kind,title,creator,year})=>({id,kind,title,creator,year,status:'pending',note:'',date:'',...memories[id]})),personalWork],lists:[personalList]};
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1024,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(path.join(base,'index.html')).href);
    const embedded=await page.locator('[data-catalog]').evaluate(el=>JSON.parse(el.textContent));
    for(const list of [novels,fantasy])assert.ok(list.items.every(id=>embedded.works.find(work=>work.id===id).cover?.startsWith('data:image/webp;base64,')),'TIME covers are embedded for offline use');
    // The withdrawn novels selection needs its archive link; it must not
    // linger when opening a collection whose primary list is still available.
    await page.locator('[data-list="'+novels.id+'"]').click();
    assert.equal(await page.locator('[data-source-link]').textContent(),'Sobre la selección de TIME');
    assert.equal(await page.locator('[data-source-link]').getAttribute('href'),novels.sourceUrl);
    assert.equal(await page.locator('[data-source-archive-link]').isVisible(),true);
    assert.equal(await page.locator('[data-source-archive-link]').textContent(),'Ver lista archivada');
    assert.equal(await page.locator('[data-source-archive-link]').getAttribute('href'),novels.sourceArchiveUrl);
    for(const list of [fantasy,source.lists.find(list=>list.id==='4chan-lit-2025')]){
      await page.locator('[data-list="'+list.id+'"]').click();
      assert.equal(await page.locator('[data-source-link]').textContent(),'Ver lista original');
      assert.equal(await page.locator('[data-source-link]').getAttribute('href'),list.sourceUrl);
      assert.equal(await page.locator('[data-source-archive-link]').isVisible(),false);
    }
    const oldRaw=JSON.stringify(previous);
    await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:oldRaw});await page.reload();
    assert.match(await page.locator('[data-storage-status]').textContent(),/Datos recuperados/);
    assert.equal(await page.locator('[data-list-count]').textContent(),String(source.lists.length+1));
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),oldRaw,'adding TIME does not overwrite the existing save on load');
    async function visit(list,id){
      await page.locator('[data-list="'+list.id+'"]').click();
      if(list.items.length>12)await page.locator('[data-page-picker]').selectOption(String(Math.floor(list.items.indexOf(id)/12)));
      await page.locator('[data-open="'+id+'"]').click();
    }
    async function memory(expected){
      assert.equal(await page.locator('[data-status]').inputValue(),expected.status);
      assert.equal(await page.locator('[data-note]').inputValue(),expected.note);
      assert.equal(await page.locator('[data-date]').inputValue(),expected.date);
    }
    await visit(fantasy,alice);await memory(memories[alice]);
    assert.equal(await page.locator('[data-detail-title]').textContent(),display(fantasy,alice).title);
    await visit(novels,orwell);await memory(memories[orwell]);
    await visit(novels,cycle);await memory(memories[cycle]);
    for(const id of [fellowship,towers,returnOfKing]){await visit(fantasy,id);await memory({status:'pending',note:'',date:''});}
    await visit(personalList,personalWork.id);await memory(personalWork);

    // Newly shared entries also propagate memories between both TIME lists.
    const lionMemory={status:'done',note:'Un solo recuerdo para las dos listas TIME.',date:'2026-10-08'};
    await visit(novels,lion);await page.locator('[data-status]').selectOption(lionMemory.status);await page.locator('[data-note]').fill(lionMemory.note);await page.locator('[data-date]').fill(lionMemory.date);await page.locator('[data-save-note]').click();
    await visit(fantasy,lion);await memory(lionMemory);
    // Completing one volume cannot complete its siblings or change the whole-cycle memory.
    await visit(fantasy,fellowship);await page.locator('[data-punch="'+fellowship+'"]').click();
    for(const id of [towers,returnOfKing]){await visit(fantasy,id);assert.equal(await page.locator('[data-status]').inputValue(),'pending');}
    await visit(novels,cycle);await memory(memories[cycle]);

    // Importing TIME's displayed alias and year must match the existing Alice
    // entry, not create another personal work with a disconnected reading mark.
    await page.locator('[data-new]').click();await page.locator('[name=listTitle]').fill('Alicia desde TIME');await page.locator('[name=kind]').selectOption('book');
    await page.locator('[name=entries]').fill(display(fantasy,alice).title+' | Lewis Carroll | '+display(fantasy,alice).year+'\nAlice in Wonderland | Lewis Carroll');
    await page.locator('[data-import-form] button[type=submit]').click();assert.match(await page.locator('[data-review-summary]').textContent(),/1 títulos · 1 coincidencia.*1 repetido/);await page.locator('[data-confirm-import]').click();
    assert.equal(await page.locator('[data-work]').count(),1);assert.equal(await page.locator('[data-work]').getAttribute('data-work'),alice);assert.equal(await page.locator('[data-count]').textContent(),'1');
    const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    for(const old of previous.works){const current=saved.works.find(work=>work.id===old.id);assert.ok(current);assert.deepEqual({status:current.status,note:current.note,date:current.date},{status:old.status,note:old.note,date:old.date});}
    assert.deepEqual(saved.lists.find(list=>list.id===personalList.id),personalList);assert.equal(saved.works.length,source.works.length+1,'the Alice alias does not add a duplicate work');
    await page.reload();await visit(fantasy,lion);await memory(lionMemory);await visit(novels,orwell);await memory(memories[orwell]);

    // TIME prints preserve the complete selected order and collection aliases
    // while showing reading marks without claiming numerical quality ranks.
    for(const list of [novels,fantasy]){
      await page.locator('[data-list="'+list.id+'"]').click();
      assert.ok((await page.locator('.cr-work-num').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')))).every(label=>/^Obra /.test(label)));
      const before=await page.evaluate(key=>localStorage.getItem(key),key);
      await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
      const printed=await page.locator('[data-print-view]').evaluate(el=>({text:el.textContent,head:el.querySelector('thead tr:last-child th').textContent,rows:[...el.querySelectorAll('[data-print-row]')].map(row=>({id:row.dataset.printRow,work:row.cells[1].textContent,state:row.cells[2].textContent,date:row.cells[3].textContent}))}));
      await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
      assert.equal(printed.head,'N.º');assert.equal(printed.rows.length,100);assert.deepEqual(printed.rows.map(row=>row.id),list.items);assert.ok(printed.text.includes(list.orderLabel));
      const sharedRow=printed.rows.find(row=>row.id===lion);assert.match(sharedRow.state,/✓.*Leído/);assert.equal(sharedRow.date,lionMemory.date);assert.ok(!printed.text.includes(lionMemory.note));
      if(list===fantasy){const row=printed.rows.find(row=>row.id===alice);assert.ok(row.work.includes(display(fantasy,alice).title));assert.match(row.state,/✓.*Leído/);assert.equal(row.date,memories[alice].date);assert.match(printed.rows.find(row=>row.id===towers).state,/Pendiente/);}
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before);
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: TIME 100 novels + 100 fantasy books, complete offline covers, original unranked order, 726-work v1 save, shared memories/aliases, separate Tolkien volumes and complete marked prints.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});

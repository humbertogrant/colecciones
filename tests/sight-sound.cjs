const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'..'),key='canto.colecciones.personal.v1';
const catalog=JSON.parse(fs.readFileSync(path.join(base,'data/catalog.json'),'utf8'));
const works=new Map(catalog.works.map(work=>[work.id,work]));
const list=catalog.lists.find(list=>list.id==='sight-and-sound-critics-2022');
const nyt=catalog.lists.find(list=>list.id==='nyt-films-2025');
const display=(collection,id)=>({...works.get(id),...collection.displayItems?.[id]});
// Published BFI critics' 2022 ranks: 100 films, ending with six films tied at
// 95. This fixed sequence catches accidental sequential numbering or truncation.
const ranks=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,21,23,24,25,25,27,28,29,30,31,31,31,34,35,36,36,38,38,38,41,41,43,43,45,45,45,48,48,50,50,52,52,54,54,54,54,54,59,60,60,60,63,63,63,66,67,67,67,67,67,72,72,72,75,75,75,78,78,78,78,78,78,78,85,85,85,88,88,90,90,90,90,90,95,95,95,95,95,95];
const markers=ranks.map(rank=>(ranks.indexOf(rank)!==ranks.lastIndexOf(rank)?'=':'')+rank);
const oldListIds=new Set([
  'nyt-books-critics-2024','nyt-books-readers-2024','nyt-films-2025','nyt-series-2026',
  'hugo-best-novel-1953-2026','pulitzer-fiction-1953-2026',
  'nobel-literature-2000-2026','nobel-economics-2000-2025',
  'countries-japan','countries-china','countries-india','countries-mexico',
  'countries-russia','countries-germany','countries-brazil','countries-turkey','countries-iran',
  '4chan-lit-2025','time-novels-2005','time-fantasy-2020',
]);

(async()=>{
  assert.ok(list,'the Sight and Sound critics selection is available');
  assert.equal(list.ranked,true);assert.equal(list.items.length,100);assert.equal(new Set(list.items).size,100);
  assert.match(new URL(list.sourceUrl).hostname,/(^|\.)bfi\.org\.uk$/);
  assert.deepEqual(list.items.map(id=>list.itemRanks[id]),ranks,'the original tied ranks remain intact');
  assert.ok(list.items.every(id=>works.get(id)?.kind==='film'&&works.get(id).coverFile));
  assert.equal(display(list,list.items[0]).title,'Jeanne Dielman, 23 Quai du Commerce, 1080 Bruxelles');
  assert.deepEqual(list.items.slice(-6).map(id=>display(list,id).title),[
    'Get Out','Tropical Malady','Black Girl','The General','A Man Escaped','Once upon a Time in the West',
  ],'preserve the BFI order within the final tie');
  const parasite='film-5051a884b137',mulholland='film-fe60cc96e61f',mood='film-31913b6344c9',spirited='film-bcac8848d317';
  for(const [id,rank] of [[parasite,90],[mulholland,8],[mood,5],[spirited,75]]){
    assert.ok(nyt.items.includes(id)&&list.items.includes(id),'shared films reuse established IDs');
    assert.equal(list.itemRanks[id],rank);
  }
  assert.equal(display(list,mulholland).title,'Mulholland Dr.');
  assert.equal(display(nyt,mulholland).title,'Mulholland Drive');
  assert.equal(String(display(list,mood).year),'2000');assert.equal(String(display(nyt,mood).year),'2001');
  assert.equal(String(display(list,spirited).year),'2001');assert.equal(String(display(nyt,spirited).year),'2002');

  const oldLists=catalog.lists.filter(collection=>oldListIds.has(collection.id));
  assert.equal(oldLists.length,20);
  const oldIds=new Set(oldLists.flatMap(collection=>collection.items));
  assert.equal(oldIds.size,890,'the 0.12.1 catalog survives the addition');
  const memories={
    [parasite]:{status:'done',note:'Mi recuerdo anterior de Parasite.',date:'2026-10-07'},
    [mulholland]:{status:'doing',note:'Todavía sigo en Mulholland Drive.',date:'2026-10-06'},
    [mood]:{status:'done',note:'Una película compartida aunque cambie el año de estreno.',date:'2026-10-05'},
  };
  const personalWork={id:'u3000',kind:'film',title:'Una película de mi archivo',creator:'Yo',year:'2026',status:'done',note:'Mi ficha personal permanece.',date:'2026-10-04'};
  const personalList={id:'custom-3001',title:'Mi cine antes de Sight and Sound',kind:'film',source:'Colección propia',items:[parasite,personalWork.id]};
  const previous={format:'canto-colecciones',version:1,works:[...catalog.works.filter(work=>oldIds.has(work.id)).map(({id,kind,title,creator,year})=>({id,kind,title,creator,year,status:'pending',note:'',date:'',...memories[id]})),personalWork],lists:[personalList]};
  const fresh=list.items[0],tiedNew=list.items.filter(id=>list.itemRanks[id]===95&&!oldIds.has(id)).slice(0,2);
  assert.ok(!oldIds.has(fresh));assert.equal(tiedNew.length,2);
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(path.join(base,'index.html')).href);
    const raw=JSON.stringify(previous);
    await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});await page.reload();
    assert.match(await page.locator('[data-storage-status]').textContent(),/Datos recuperados/);
    assert.equal(await page.locator('[data-list-count]').textContent(),String(catalog.lists.length+1));
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),raw,'loading does not rewrite the previous save');
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
    for(const id of [parasite,mulholland,mood]){
      await visit(list,id);await memory(memories[id]);
      assert.equal(await page.locator('[data-detail-title]').textContent(),display(list,id).title);
    }
    await visit(personalList,personalWork.id);await memory(personalWork);
    await page.locator('[data-list="'+list.id+'"]').click();
    assert.equal(await page.locator('[data-count]').textContent(),'2');assert.equal(await page.locator('[data-total]').textContent(),'/ 100');
    assert.equal(await page.locator('[data-source-link]').getAttribute('href'),list.sourceUrl);
    const seen=[];
    for(let p=0;p<9;p++){
      await page.locator('[data-page-picker]').selectOption(String(p));
      seen.push(...await page.locator('[data-work]').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.work,marker:node.querySelector('.cr-work-num').textContent}))));
    }
    assert.deepEqual(seen,list.items.map((id,i)=>({id,marker:markers[i]})),'all pages show ranks rather than row numbers');

    // Two films at the same rank each count as one completed film, and neither
    // completing new films nor opening the new list changes old memories.
    for(const [i,id] of [fresh,...tiedNew].entries()){
      await visit(list,id);await memory({status:'pending',note:'',date:''});
      assert.equal(await page.locator('[data-recognition]').isVisible(),false,'a tied poll rank is not a shared award');
      await page.locator('[data-punch="'+id+'"]').click();
      assert.equal(await page.locator('[data-count]').textContent(),String(3+i));
    }
    const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    for(const old of previous.works){
      const current=saved.works.find(work=>work.id===old.id);assert.ok(current);
      assert.deepEqual({status:current.status,note:current.note,date:current.date},{status:old.status,note:old.note,date:old.date});
    }
    assert.deepEqual(saved.lists,[personalList]);assert.equal(saved.works.length,catalog.works.length+1);
    const updated={status:'done',note:'La terminé desde Sight and Sound.',date:'2026-10-08'};
    await visit(list,mulholland);await page.locator('[data-status]').selectOption(updated.status);await page.locator('[data-note]').fill(updated.note);await page.locator('[data-date]').fill(updated.date);await page.locator('[data-save-note]').click();
    await visit(nyt,mulholland);await memory(updated);
    await page.reload();await visit(list,mulholland);await memory(updated);
    for(const id of tiedNew){await visit(list,id);assert.equal(await page.locator('[data-status]').inputValue(),'done');}
    await visit(list,parasite);await memory(memories[parasite]);
    assert.equal(await page.locator('[data-count]').textContent(),'6');

    const before=await page.evaluate(key=>({saved:localStorage.getItem(key),page:document.querySelector('[data-page-picker]').value}),key);
    await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    const printed=await page.locator('[data-print-view]').evaluate(el=>({text:el.textContent,head:el.querySelector('thead tr:last-child th').textContent,rows:[...el.querySelectorAll('[data-print-row]')].map(row=>({id:row.dataset.printRow,marker:row.cells[0].textContent,state:row.cells[2].textContent,date:row.cells[3].textContent}))}));
    await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
    assert.equal(printed.head,'Puesto');assert.equal(printed.rows.length,100);
    assert.deepEqual(printed.rows.map(row=>row.id),list.items);assert.deepEqual(printed.rows.map(row=>row.marker),markers);
    assert.equal(printed.rows.filter(row=>/✓/.test(row.state)).length,6);assert.ok(printed.text.includes('6 / 100'));
    assert.equal(printed.rows.find(row=>row.id===mulholland).date,updated.date);
    assert.equal(printed.rows.find(row=>row.id===parasite).date,memories[parasite].date);
    assert.ok(!printed.text.includes(updated.note));assert.ok(!printed.text.includes('Premio compartido'));
    assert.deepEqual(await page.evaluate(key=>({saved:localStorage.getItem(key),page:document.querySelector('[data-page-picker]').value}),key),before);
    assert.deepEqual(errors,[]);
    console.log('PASS: Sight and Sound 100 films, original tied ranks, 890-work v1 migration, shared NYT aliases/years/memories, independent completion of ties and complete marked print.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});

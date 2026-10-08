const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'..'),key='canto.colecciones.personal.v1';

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1024,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(path.join(base,'index.html')).href);
    const catalog=await page.locator('[data-catalog]').evaluate(el=>JSON.parse(el.textContent));
    const findWork=title=>catalog.works.find(work=>work.title===title);
    async function visit(workId,listId){
      const collection=catalog.lists.find(list=>list.id===listId)||catalog.lists.find(list=>list.items.includes(workId));
      await page.locator('[data-list="'+collection.id+'"]').click();
      if(collection.items.length>12)await page.locator('[data-page-picker]').selectOption(String(Math.floor(collection.items.indexOf(workId)/12)));
    }
    async function saveMemory(workId,note,date){
      await page.locator('[data-open="'+workId+'"]').click();
      await page.locator('[data-status]').selectOption('done');
      await page.locator('[data-note]').fill(note);
      await page.locator('[data-date]').fill(date);
      await page.locator('[data-save-note]').click();
    }
    async function review(title,kind,entries){
      await page.locator('[data-new]').click();
      await page.locator('[name=listTitle]').fill(title);
      await page.locator('[name=kind]').selectOption(kind);
      await page.locator('[name=entries]').fill(entries);
      await page.locator('[data-import-form] button[type=submit]').click();
      return page.locator('[data-review-summary]').textContent();
    }
    async function create(){
      await page.locator('[data-confirm-import]').click();
      return page.locator('[data-list][aria-current="true"]').getAttribute('data-list');
    }
    async function saved(){return page.evaluate(storageKey=>JSON.parse(localStorage.getItem(storageKey)),key);}

    // A repeated match with an optional year must not poison the entire saved document.
    const gone=findWork('Gone Girl');
    await visit(gone.id);
    await saveMemory(gone.id,'El recuerdo anterior sigue aquí.','2026-10-07');
    await review('Mi colección anterior','book','Un libro mío | Yo | 2026');
    const previousListId=await create(),personalId=await page.locator('[data-work]').getAttribute('data-work');
    await saveMemory(personalId,'También conservo mi lista propia.','2026-10-06');
    assert.match(await review('Coincidencias repetidas','book','Gone Girl | Gillian Flynn\nGone Girl | Gillian Flynn | 2012'),/1 títulos · 1 coincidencia.*1 repetido/);
    const duplicateListId=await create();
    assert.equal(await page.locator('[data-work]').count(),1);
    assert.equal(await page.locator('[data-count]').textContent(),'1');
    assert.deepEqual((await saved()).lists.find(list=>list.id===duplicateListId).items,[gone.id]);
    await page.reload();
    assert.match(await page.locator('[data-storage-status]').textContent(),/Datos recuperados/);
    await visit(gone.id);
    await page.locator('[data-open="'+gone.id+'"]').click();
    assert.equal(await page.locator('[data-status]').inputValue(),'done');
    assert.equal(await page.locator('[data-note]').inputValue(),'El recuerdo anterior sigue aquí.');
    assert.equal(await page.locator('[data-date]').inputValue(),'2026-10-07');
    await page.locator('[data-list="'+previousListId+'"]').click();
    await page.locator('[data-open="'+personalId+'"]').click();
    assert.equal(await page.locator('[data-status]').inputValue(),'done');
    assert.equal(await page.locator('[data-note]').inputValue(),'También conservo mi lista propia.');
    assert.equal(await page.locator('[data-date]').inputValue(),'2026-10-06');
    await page.locator('[data-list="'+duplicateListId+'"]').click();
    assert.equal(await page.locator('[data-count]').textContent(),'1');

    // Displayed translations resolve to the established ID, including a repeated canonical title.
    const years=findWork('The Years'),septology=findWork('Septology'),vegetarian=findWork('The Vegetarian');
    await visit(years.id,'nobel-literature-2000-2026');
    await saveMemory(years.id,'Un recuerdo compartido entre idiomas.','2026-10-08');
    assert.match(await review('Títulos traducidos','book','Los años | Annie Ernaux\nThe Years | Annie Ernaux\nSeptología | Jon Fosse\nLa vegetariana | Han Kang'),/3 títulos · 3 coincidencias.*1 repetido/);
    const aliasListId=await create();
    assert.deepEqual((await saved()).lists.find(list=>list.id===aliasListId).items,[years.id,septology.id,vegetarian.id]);
    assert.equal(await page.locator('[data-work="'+years.id+'"] .cr-work-state').textContent(),'Leído');
    await page.reload();
    await page.locator('[data-list="'+aliasListId+'"]').click();
    await page.locator('[data-open="'+years.id+'"]').click();
    assert.equal(await page.locator('[data-note]').inputValue(),'Un recuerdo compartido entre idiomas.');
    assert.equal(await page.locator('[data-status]').inputValue(),'done');

    // An alias can carry its own release year; an unrelated year or medium must remain separate.
    const film=findWork('The Lives of Others'),director=film.creator;
    assert.match(await review('Años de estreno','film','La vida de los otros | '+director+' | 2006\nThe Lives of Others | '+director+' | 2007\nLa vida de los otros | '+director+' | 2008'),/2 títulos · 1 coincidencia.*1 repetido/);
    const filmListId=await create(),filmItems=(await saved()).lists.find(list=>list.id===filmListId).items;
    assert.equal(filmItems[0],film.id);
    assert.notEqual(filmItems[1],film.id);
    assert.equal((await saved()).works.find(work=>work.id===filmItems[1]).year,'2008');
    assert.match(await review('Otro medio','book','The Lives of Others | '+director+' | 2007'),/1 títulos · 0 coincidencias/);
    const otherMediumListId=await create(),otherMediumId=(await saved()).lists.find(list=>list.id===otherMediumListId).items[0];
    assert.notEqual(otherMediumId,film.id);
    assert.equal((await saved()).works.find(work=>work.id===otherMediumId).kind,'book');

    // Omitting the year must not choose between two otherwise identical existing candidates.
    assert.match(await review('Ediciones distintas','book','Edición de prueba | Autora | 2001\nEdición de prueba | Autora | 2002'),/2 títulos · 0 coincidencias/);
    const editionsListId=await create(),editionIds=(await saved()).lists.find(list=>list.id===editionsListId).items;
    assert.match(await review('Coincidencia ambigua','book','Edición de prueba | Autora'),/1 títulos · 0 coincidencias/);
    const ambiguousListId=await create(),ambiguousId=(await saved()).lists.find(list=>list.id===ambiguousListId).items[0];
    assert.ok(!editionIds.includes(ambiguousId));
    await page.reload();
    assert.match(await page.locator('[data-storage-status]').textContent(),/Datos recuperados/);
    assert.deepEqual(errors,[]);
    console.log('PASS: resolved-ID deduplication, saved notes/dates/lists after reload, translated aliases, release-year variants, medium/year safeguards, ambiguous matches.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});

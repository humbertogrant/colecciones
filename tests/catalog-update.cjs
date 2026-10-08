const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'..'),key='canto.colecciones.personal.v1';
const catalog=JSON.parse(fs.readFileSync(path.join(base,'data/catalog.json'),'utf8'));
// Frozen from the 632-work catalog at 772e7fb, before /lit/ was added. This is a
// real v1 save shape: built-in lists are not serialized, personal lists are.
const previous=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/personal-v1-before-lit.json'),'utf8'));

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1024,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const personalId='u900',sharedId='book-2741d808c2f4';
    const previousBuiltIns=previous.works.filter(work=>work.id!==personalId);
    assert.equal(previousBuiltIns.length,632,'historical fixture remains fixed');
    assert.ok(previousBuiltIns.every(work=>catalog.works.some(current=>current.id===work.id)),'existing work IDs survive the catalog update');
    const added=catalog.lists.find(list=>list.id==='4chan-lit-2025');
    assert.ok(added,'the latest /lit/ list is included');
    assert.equal(added.items.length,100);
    assert.equal(new Set(added.items).size,100);
    assert.equal(added.items[34],sharedId,'2666 reuses its established ID at rank 35');
    const previousIds=new Set(previous.works.map(work=>work.id));
    const newId=added.items.find(id=>!previousIds.has(id));
    assert.ok(newId,'the new list adds previously unavailable works');

    await page.goto(pathToFileURL(path.join(base,'index.html')).href);
    const oldRaw=JSON.stringify(previous);
    await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:oldRaw});
    await page.reload();
    assert.match(await page.locator('[data-storage-status]').textContent(),/Datos recuperados/);
    assert.equal(await page.locator('[data-list-count]').textContent(),String(catalog.lists.length+previous.lists.length));
    assert.equal(await page.evaluate(storageKey=>localStorage.getItem(storageKey),key),oldRaw,'loading an updated catalog does not overwrite the old save');

    async function visit(list,id){
      await page.locator('[data-list="'+list.id+'"]').click();
      if(list.items.length>12)await page.locator('[data-page-picker]').selectOption(String(Math.floor(list.items.indexOf(id)/12)));
      await page.locator('[data-open="'+id+'"]').click();
    }
    async function assertMemory(expected){
      assert.equal(await page.locator('[data-status]').inputValue(),expected.status);
      assert.equal(await page.locator('[data-note]').inputValue(),expected.note);
      assert.equal(await page.locator('[data-date]').inputValue(),expected.date);
    }
    const shared=previous.works.find(work=>work.id===sharedId);
    await visit(added,sharedId);
    await assertMemory(shared);
    assert.equal(await page.locator('[data-count]').textContent(),String(added.items.filter(id=>previous.works.some(work=>work.id===id&&work.status==='done')).length));
    const personal=previous.lists[0];
    await visit(personal,personalId);
    await assertMemory(previous.works.find(work=>work.id===personalId));
    assert.equal(await page.locator('[data-count]').textContent(),'2');
    assert.deepEqual(await page.locator('[data-work]').evaluateAll(nodes=>nodes.map(node=>node.dataset.work)),personal.items);

    // A save after the upgrade must retain every old state, note, date and
    // personal work while also serializing the newly available works.
    await visit(added,newId);
    assert.equal(await page.locator('[data-status]').inputValue(),'pending');
    await page.locator('[data-punch="'+newId+'"]').click();
    const upgraded=await page.evaluate(storageKey=>JSON.parse(localStorage.getItem(storageKey)),key);
    for(const oldWork of previous.works){
      const current=upgraded.works.find(work=>work.id===oldWork.id);
      assert.ok(current,'saved work retained: '+oldWork.id);
      assert.deepEqual({status:current.status,note:current.note,date:current.date},{status:oldWork.status,note:oldWork.note,date:oldWork.date},'personal data retained: '+oldWork.id);
    }
    assert.deepEqual(upgraded.works.find(work=>work.id===personalId),previous.works.find(work=>work.id===personalId));
    assert.deepEqual(upgraded.lists,previous.lists);
    assert.equal(upgraded.works.length,catalog.works.length+1);
    assert.equal(upgraded.works.find(work=>work.id===newId).status,'done');
    await page.reload();
    await visit(added,sharedId);await assertMemory(shared);
    await visit(added,newId);assert.equal(await page.locator('[data-status]').inputValue(),'done');
    await visit(personal,personalId);await assertMemory(previous.works.find(work=>work.id===personalId));
    assert.deepEqual(errors,[]);
    console.log('PASS: previous 632-work v1 save loads /lit/ 2025, reuses shared marks, preserves all personal states/notes/dates/lists and saves new work after reload.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});

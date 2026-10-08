const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),path=require('node:path');
const base=path.resolve(__dirname,'..');

(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  try{
    const p=await b.newPage({viewport:{width:1024,height:1000}});
    await p.goto('file://'+base+'/index.html');
    const c=await p.locator('[data-catalog]').evaluate(el=>JSON.parse(el.textContent));
    const countries=c.lists.filter(l=>l.group==='Descubrimiento de países');
    assert.equal(countries.length,9);
    assert.equal(countries.reduce((n,l)=>n+l.items.length,0),56);
    assert.equal(countries.find(l=>l.title==='México').items.length,8);
    assert.ok(countries.every(l=>l.kind==='mixed'&&l.items.filter(id=>c.works.find(w=>w.id===id).kind==='film').length===1));

    // The compact group starts closed and supports native keyboard controls.
    const group=p.locator('[data-country-group]'),summary=group.locator('summary');
    assert.equal(await group.count(),1);
    assert.equal(await group.evaluate(el=>el.open),false);
    assert.equal(await group.locator('[data-list]').count(),9);
    assert.match(await summary.textContent(),/Descubrimiento de países/);
    assert.match(await summary.textContent(),/9 países/);
    assert.equal(await p.locator('[data-list="countries-germany"]').isVisible(),false);
    const beforeToggle=await p.evaluate(()=>localStorage.getItem('canto.colecciones.personal.v1'));
    await summary.scrollIntoViewIfNeeded();
    await p.screenshot({path:base+'/test-results/countries-collapsed.png'});
    await summary.focus();await summary.press('Enter');
    assert.equal(await group.evaluate(el=>el.open),true);
    assert.equal(await p.evaluate(()=>localStorage.getItem('canto.colecciones.personal.v1')),beforeToggle,'expanding the group does not alter personal data');
    await p.screenshot({path:base+'/test-results/countries-expanded.png'});

    const germany=countries.find(l=>l.title==='Alemania'),film=germany.items.at(-1);
    await p.locator('[data-list="'+germany.id+'"]').click();
    assert.match(await p.locator('[data-work="'+film+'"] .cr-work-author').textContent(),/2006/);
    assert.equal(await p.locator('[data-count-label]').textContent(),'completadas');
    await p.locator('[data-punch="'+film+'"]').click();
    assert.equal(await p.locator('[data-work="'+film+'"] .cr-work-state').textContent(),'Vista');
    assert.equal(await group.evaluate(el=>el.open),true,'marking a work keeps the group open');
    await p.locator('[data-open="'+film+'"]').click();
    assert.equal(await p.locator('[data-detail-title]').textContent(),'La vida de los otros');
    await summary.focus();await summary.press('Space');
    assert.equal(await group.evaluate(el=>el.open),false);
    await p.locator('[data-punch="'+germany.items[0]+'"]').click();
    assert.equal(await p.locator('[data-work="'+germany.items[0]+'"] .cr-work-state').textContent(),'Leído');
    assert.equal(await group.evaluate(el=>el.open),false,'marking in the active country keeps the chosen closed state');
    await p.locator('[data-note]').fill('Una marca compartida entre recorridos');
    await p.locator('[data-save-note]').click();
    assert.equal(await group.evaluate(el=>el.open),false,'saving the active country keeps the chosen closed state');
    assert.equal(await p.locator('[data-title]').textContent(),'Alemania');

    const nyt=c.lists.find(l=>l.id==='nyt-films-2025');
    await p.locator('[data-list="'+nyt.id+'"]').click();
    await p.locator('[data-page-picker]').selectOption(String(Math.floor(nyt.items.indexOf(film)/12)));
    await p.locator('[data-open="'+film+'"]').click();
    assert.equal(await p.locator('[data-detail-title]').textContent(),'The Lives of Others');
    assert.match(await p.locator('[data-detail-author]').textContent(),/2007/);
    assert.equal(await p.locator('[data-note]').inputValue(),'Una marca compartida entre recorridos');

    // A pre-country v1 backup remains compatible and adds the built-in lists.
    const old={format:'canto-colecciones',version:1,works:c.works.slice(0,486).map(w=>({id:w.id,kind:w.kind,title:w.title,creator:w.creator,year:w.year,status:w.id===film?'done':'pending',date:'',note:w.id===film?'Recuerdo anterior':''})),lists:[]};
    await p.evaluate(({key,old})=>localStorage.setItem(key,JSON.stringify(old)),{key:'canto.colecciones.personal.v1',old});
    await p.reload();
    assert.equal(await p.locator('[data-list-count]').textContent(),String(c.lists.length));
    assert.equal(await group.evaluate(el=>el.open),false);
    await p.setViewportSize({width:390,height:1000});
    await p.locator('[data-mobile-picker]').selectOption('countries-germany');
    assert.equal(await p.locator('[data-count]').textContent(),'1');
    await p.locator('[data-open="'+film+'"]').click();
    assert.equal(await p.locator('[data-note]').inputValue(),'Recuerdo anterior');
    await p.locator('[data-mobile-picker]').selectOption('countries-japan');
    await p.screenshot({path:base+'/test-results/countries-mobile.png'});
    await p.setViewportSize({width:1024,height:1000});
    assert.equal(await group.evaluate(el=>el.open),true,'a country selected on mobile is revealed on desktop');
    assert.equal(await p.locator('[data-list="countries-japan"]').isVisible(),true);
    assert.equal(await p.locator('[data-list="countries-japan"]').getAttribute('aria-current'),'true');
    await p.locator('[data-list="countries-mexico"]').click();
    await p.screenshot({path:base+'/test-results/countries-desktop.png'});
    console.log('PASS: collapsed country group, keyboard open/close, state retained while saving, mobile reveal, 9 countries / 56 entries, shared marks/notes and v1 migration.');
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});

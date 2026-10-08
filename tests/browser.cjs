const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = path.resolve(__dirname, '..');
async function audit(page, label) {
  const result = await page.evaluate(() => {
    const root = document.getElementById('canto-colecciones');
    const rgb = s => (s.match(/[\d.]+/g)||[]).map(Number);
    const luminance = c => c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
    const failures=[], text=[];
    for(const el of root.querySelectorAll('*')) {
      if(!el.getClientRects().length || el.closest('[hidden]') || el.matches('script,style,option,img,.cr-live')) continue;
      const hasText = Array.from(el.childNodes).some(n=>n.nodeType===3 && n.textContent.trim()) || el.matches('input,select,textarea');
      if(!hasText) continue;
      const cs = getComputedStyle(el), foreground = rgb(cs.webkitTextFillColor || cs.color);
      let ancestor=el, bg=null;
      while(ancestor){const color=rgb(getComputedStyle(ancestor).backgroundColor);if(color.length===3||color[3]===1){bg=color;break;}ancestor=ancestor.parentElement;}
      if(!bg) bg=[255,255,255];
      const a=luminance(foreground), b=luminance(bg), ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      const sample={tag:el.tagName,cls:el.className,text:el.textContent.trim().slice(0,60),color:cs.color,fill:cs.webkitTextFillColor,bg,ratio:Number(ratio.toFixed(2))};
      text.push(sample);if(ratio<4.5)failures.push(sample);
    }
    const overflow=Array.from(root.querySelectorAll('*')).filter(el=>el.getClientRects().length&&!el.closest('[hidden]')&&!el.matches('.cr-live')).filter(el=>{const b=el.getBoundingClientRect();return b.right>innerWidth+1||b.left< -1}).map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width}));
    return {failures,overflow,minContrast:Math.min(...text.map(t=>t.ratio)),counter:text.find(t=>t.tag==='STRONG'&&t.cls===''),text};
  });
  assert.deepEqual(result.failures,[],label+' contrast');
  assert.deepEqual(result.overflow,[],label+' overflow');
  return {label,minContrast:result.minContrast,textElements:result.text.length};
}
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],headless:true});
 const page=await browser.newPage({viewport:{width:1024,height:1100}});
 const errors=[],requests=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto('file://'+base+'/index.html');await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.title(),'Colecciones');
 assert.equal(await page.locator('.cr-signature strong').textContent(),'Colecciones');
 assert.equal(await page.locator('[data-list-count]').textContent(),'15');
 const data=await page.locator('[data-catalog]').evaluate(el=>JSON.parse(el.textContent));
 assert.equal(data.lists.length,15);assert.equal(data.works.length,538);
 const ids=new Set(data.works.map(w=>w.id));assert.equal(ids.size,538);
 assert.ok(data.lists.every(l=>new Set(l.items).size===l.items.length&&l.items.every(id=>ids.has(id))));
 const shared=data.lists[0].items.filter(id=>data.lists[1].items.includes(id));assert.equal(shared.length,39);
 assert.ok(data.works.filter(w=>w.cover).every(w=>w.cover.startsWith('data:image/webp;base64,')&&w.editionUrl));
 assert.ok(data.lists.slice(0,4).every(l=>l.sourceUrl.startsWith('https://www.nytimes.com/')));
 for(const l of data.lists){
  await page.locator('[data-list="'+l.id+'"]').click();
  assert.equal(await page.locator('[data-count]').textContent(),'0');
  const seen=[];
  for(let p=0;p<Math.ceil(l.items.length/12);p++){
   if(l.items.length>12)await page.locator('[data-page-picker]').selectOption(String(p));
   await page.locator('[data-grid] img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   assert.ok((await page.locator('[data-grid] img').evaluateAll(imgs=>imgs.map(i=>i.complete&&i.naturalWidth>30&&i.naturalHeight>50))).every(Boolean));
   seen.push(...await page.locator('.cr-work-num').allTextContents());
  }
  assert.deepEqual(seen,l.items.map((id,i)=>String(l.itemMeta?.[id]?.awardYear||i+1)));
  assert.ok(await page.locator('[data-page-next]').isDisabled());
  if(l.items.length>12)await page.locator('[data-page-picker]').selectOption('0');checks.push(await audit(page,l.id+' desktop'));
  for(const width of [320,390,736]){await page.setViewportSize({width,height:1100});checks.push(await audit(page,l.id+' '+width));}
  await page.setViewportSize({width:1024,height:1100});
 }
 async function visit(l,id){await page.locator('[data-list="'+l.id+'"]').click();if(l.items.length>12)await page.locator('[data-page-picker]').selectOption(String(Math.floor(l.items.indexOf(id)/12)));}
 const hugo=data.lists[4],pulitzer=data.lists[5];
 assert.equal(hugo.items.length,75);assert.equal(pulitzer.items.length,68);
 for(const [l,missing] of [[hugo,[1954,1957]],[pulitzer,[1954,1957,1964,1971,1974,1977,2012]]]){
  const years=l.items.map(id=>l.itemMeta[id].awardYear);
  assert.equal(years[0],2026);assert.equal(years.at(-1),1953);
  assert.deepEqual(Array.from({length:74},(_,i)=>1953+i).filter(y=>!years.includes(y)),missing);
  assert.deepEqual(years,[...years].sort((a,b)=>b-a));
 }
 for(const [l,y,n] of [[hugo,1966,2],[hugo,1993,2],[hugo,2010,2],[pulitzer,2023,2]])assert.equal(l.items.filter(id=>l.itemMeta[id].awardYear===y&&l.itemMeta[id].shared).length,n);
 const blackout=data.works.find(w=>w.title==='Blackout/All Clear');
 await visit(hugo,blackout.id);await page.locator('[data-open="'+blackout.id+'"]').click();assert.match(await page.locator('[data-reading-note]').textContent(),/dos volúmenes/);
 for(const title of ['Demon Copperhead','The Fifth Season']){
  const w=data.works.find(w=>w.title===title),members=data.lists.filter(l=>l.items.includes(w.id));assert.ok(members.length>=2);
  await visit(members[0],w.id);await page.locator('[data-punch="'+w.id+'"]').click();
  for(const l of members){await visit(l,w.id);assert.equal(await page.locator('[data-work="'+w.id+'"]').getAttribute('data-state'),'done');await page.locator('[data-open="'+w.id+'"]').click();assert.ok(await page.locator('[data-recognition]').isVisible());}
  await page.locator('[data-punch="'+w.id+'"]').click();
 }
 const id=shared[0];
 await visit(data.lists[0],id);await page.locator('[data-punch="'+id+'"]').click();
 assert.equal(await page.locator('[data-count]').textContent(),'1');
 await page.locator('[data-open="'+id+'"]').click();await page.locator('[data-note]').fill('Un recuerdo compartido.');await page.locator('[data-date]').fill('2026-10-07');await page.locator('[data-save-note]').click();
 await visit(data.lists[1],id);assert.equal(await page.locator('[data-count]').textContent(),'1');
 await page.locator('[data-open="'+id+'"]').click();assert.equal(await page.locator('[data-note]').inputValue(),'Un recuerdo compartido.');assert.equal(await page.locator('[data-date]').inputValue(),'2026-10-07');
 await page.locator('[data-punch="'+id+'"]').click();await visit(data.lists[0],id);assert.equal(await page.locator('[data-count]').textContent(),'0');
 const gone=data.works.filter(w=>w.title==='Gone Girl');assert.equal(gone.length,2);assert.notEqual(gone[0].id,gone[1].id);
 const book=gone.find(w=>w.kind==='book'),film=gone.find(w=>w.kind==='film');
 await visit(data.lists[1],book.id);await page.locator('[data-punch="'+book.id+'"]').click();await visit(data.lists[2],film.id);assert.equal(await page.locator('[data-work="'+film.id+'"]').getAttribute('data-state'),'pending');
 assert.equal(data.works.filter(w=>/^The Office/.test(w.title)).length,2);
 assert.ok(data.works.some(w=>w.title==='Beef (Season 1)'));assert.ok(data.works.some(w=>w.title==='True Detective (Season 1)'));
 await page.locator('[data-new]').click();await page.locator('[name=listTitle]').fill('Una colección propia');await page.locator('[name=kind]').selectOption('book');await page.locator('[name=entries]').fill('Gone Girl | Gillian Flynn\nGone Girl | Gillian Flynn\n<img src=x onerror=alert(1)>');
 await page.locator('[data-import-form] button[type=submit]').click();assert.match(await page.locator('[data-review-summary]').textContent(),/2 títulos · 1 coincidencia/);assert.equal(await page.locator('[data-review-items] img').count(),0);
 await page.locator('[data-confirm-import]').click();assert.equal(await page.locator('[data-count]').textContent(),'1');assert.equal(await page.locator('[data-total]').textContent(),'/ 2');assert.equal(await page.locator('[data-grid] img').count(),1);
 await page.addStyleTag({content:'strong,span,p,h2,h3,label,button{color:white;-webkit-text-fill-color:white}body{background:#181818;color:white}'});
 checks.push(await audit(page,'white host styles and imported titles'));assert.equal(await page.locator('[data-count]').evaluate(el=>getComputedStyle(el).webkitTextFillColor),'rgb(33, 102, 175)');
 await page.locator('[data-open="'+book.id+'"]').click();checks.push(await audit(page,'detail'));await page.locator('[data-new]').click();checks.push(await audit(page,'import form'));
 await page.reload();assert.equal(await page.locator('[data-list-count]').textContent(),'16');await page.locator('.cr-storage summary').click();checks.push(await audit(page,'storage controls'));for(const width of [320,390]){await page.setViewportSize({width,height:1100});checks.push(await audit(page,'storage controls '+width));}
 await page.locator('[data-grid] img').first().evaluate(el=>el.dispatchEvent(new Event('error')));assert.ok(await page.locator('.cr-cover-fallback').first().isVisible());
 assert.deepEqual(requests,[],'offline: no remote requests');assert.deepEqual(errors,[],'no browser errors');
 const report={passed:true,collections:15,memberships:599,works:538,sharedBooks:39,images:data.works.filter(w=>w.cover).length,minTextContrast:Math.min(...checks.map(c=>c.minContrast)),checks};
 fs.mkdirSync(base+'/test-results',{recursive:true});fs.writeFileSync(base+'/test-results/browser-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

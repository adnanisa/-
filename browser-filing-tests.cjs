'use strict';
const {chromium,expect}=require('playwright/test');
const path=require('node:path');
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4173';
const qa=process.env.QA_DIR||process.cwd();
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 let passed=0;
 const act=(p,n)=>p.locator('[data-action="'+n+'"]').first();
 const field=(p,n)=>p.locator('[data-bind="'+n+'"]');
 async function fresh(hash=''){
  const c=await browser.newContext({viewport:{width:1440,height:1050}}),p=await c.newPage();p.errors=[];
  p.on('pageerror',e=>p.errors.push(e.message));p.on('dialog',d=>d.accept());
  await p.goto(base+hash);await expect(p.locator('#main .page-head')).toBeVisible();return p;
 }
 async function fill(p){await act(p,'demo').click();await act(p,'fill-demo').click();}
 async function scenario(p,changes){
  await act(p,'demo').click();
  for(const [k,v] of Object.entries(changes)){const el=p.locator('#modal [data-bind="demo.'+k+'"]');if(k==='asOfDate')await el.fill(v);else await el.selectOption(v);}
  await act(p,'apply-demo').click();
 }
 async function next(p,title){await act(p,'next').click();await expect(p.locator('#step-heading')).toHaveText(title);await expect(p.locator('#main')).not.toHaveAttribute('aria-busy','true');}
 async function audit(p,name){
  const result=await p.evaluate(()=>{
   const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
   return {duplicate:ids.filter((id,i)=>ids.indexOf(id)!==i),overflow:document.documentElement.scrollWidth>innerWidth+2};
  });
  expect(result.duplicate,name).toEqual([]);expect(result.overflow,name).toBe(false);expect(p.errors,name).toEqual([]);
 }
 async function run(name,fn){if(process.env.TEST_FILTER&&!name.includes(process.env.TEST_FILTER))return;await fn();console.log('PASS '+name);passed++;}
 try{
  await run('dashboard notifications show eligible and expired cases at all widths',async()=>{
   const p=await fresh();await expect(p.locator('.filing-notification')).toHaveCount(6);
   await expect(p.locator('.filing-notification').first()).toContainText('2 أيام');
   await expect(p.locator('.filing-notification').filter({hasText:'انتهت المدة'})).toContainText('انتهت المدة');
   await expect(p.locator('.filing-notification').filter({hasText:'انتهت المدة'}).locator('a')).toHaveCount(0);
   for(const width of [320,768,1024,1440]){await p.setViewportSize({width,height:1050});await audit(p,'inbox '+width);}
   await p.screenshot({path:path.join(qa,'dashboard-v2.png'),fullPage:true});
   await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(qa,'dashboard-mobile-v2.png'),fullPage:true});
  });
  await run('notification prefill persists and edited reference clears stale result without swallowing lookup',async()=>{
   const p=await fresh();await p.locator('.filing-notification').first().getByRole('link').click();
   await expect(field(p,'reference.number')).toHaveValue('01/2026/01001/1');
   await expect(field(p,'reference.judgment')).toHaveValue('J-02');
   await expect(p.locator('.filing-availability')).toContainText('2 أيام');
   await expect(p.locator('#main')).not.toHaveAttribute('aria-busy','true');
   await act(p,'save-exit').click();await expect(p.getByRole('heading',{name:'ملفاتي القضائية',level:1,exact:true})).toBeVisible();await p.reload();await act(p,'resume').click();
   await expect(field(p,'reference.judgment')).toHaveValue('J-02');
   await field(p,'reference.number').fill('02/2026/02001/1');
   await expect(p.locator('.filing-availability')).toHaveCount(0);
   await act(p,'lookup').click();await expect(p.locator('.notice.error')).toContainText('01/2026/01001/1');
   await audit(p,'edited reference');
  });
  await run('case details distinguish expired, ineligible and unknown deadlines and start cassation',async()=>{
   const p=await fresh();await p.locator('.linked-cases [data-action="view-case"][data-number="02/2026/02001/1"]').click();
   await expect(p.getByRole('heading',{name:'تفاصيل القضية والأحكام'})).toBeVisible();
   await expect(p.locator('.judgment-card')).toHaveCount(4);
   await expect(p.locator('.judgment-card').nth(1)).toContainText('انتهت مدة التقديم');
   await expect(p.locator('.judgment-card').nth(2)).toContainText('حالة الحكم المحدد');
   await expect(p.locator('.judgment-card').nth(3)).toContainText('بيانات المدة غير مكتملة');
   await expect(p.locator('.judgment-card a')).toHaveCount(1);
   await p.screenshot({path:path.join(qa,'case-v2.png'),fullPage:true});
   for(const width of [320,768,1024,1440]){await p.setViewportSize({width,height:1050});await audit(p,'case '+width);}
   await p.locator('.judgment-card a').click();
   await expect(field(p,'reference.number')).toHaveValue('02/2026/02001/1');
   await expect(field(p,'reference.judgment')).toHaveValue('J-01');
  });
  await run('last-day and expiry validation survive save and resume',async()=>{
   const p=await fresh('#file?route=appeal&case=01/2026/01001/1&judgment=J-02');
   await expect(field(p,'reference.judgment')).toHaveValue('J-02');await fill(p);
   await field(p,'reference.judgment').selectOption('J-02');
   await scenario(p,{asOfDate:'2026-11-14'});await expect(p.locator('.filing-availability')).toContainText('ينتهي التقديم اليوم');
   await next(p,'موضوع الدعوى والمحكمة');await act(p,'back').click();
   await scenario(p,{asOfDate:'2026-11-15'});await expect(p.locator('.filing-availability')).toContainText('انتهت مدة التقديم');
   await act(p,'next').click();await expect(p.locator('#step-heading')).toHaveText('بيانات مقدم الطلب');
   await expect(p.locator('#error-summary')).toContainText('انتهت');
   await act(p,'save-exit').click();await expect(p.getByRole('heading',{name:'ملفاتي القضائية',level:1,exact:true})).toBeVisible();await p.reload();await act(p,'resume').click();
   await expect(p.locator('.filing-availability')).toContainText('انتهت');
   await field(p,'reference.judgment').selectOption('J-01');await expect(p.locator('.filing-availability')).toContainText('5 أيام');
   await p.screenshot({path:path.join(qa,'appeal-v2.png'),fullPage:true});await audit(p,'appeal');
  });
  await run('required subrequests block progress, support editing and removal, while optional cases advance',async()=>{
   const p=await fresh();await act(p,'new').click();await p.locator('[data-route="initial"]').click();await fill(p);
   await next(p,'موضوع الدعوى والمحكمة');await field(p,'topic.main').selectOption('civil');await act(p,'save-topic').click();
   await expect(p.locator('.request-rule')).toContainText('مطلوب طلب فرعي واحد');
   await act(p,'next').click();await expect(p.locator('#error-summary')).toContainText('أضف طلبًا فرعيًا');
   await act(p,'save-exit').click();await expect(p.getByRole('heading',{name:'ملفاتي القضائية',level:1,exact:true})).toBeVisible();await p.reload();await act(p,'resume').click();
   await expect(p.locator('#step-heading')).toHaveText('موضوع الدعوى والمحكمة');
   await field(p,'subEditor.name').selectOption('مطالبة مالية');await field(p,'subEditor.amount').fill('1200.125');await act(p,'add-subtopic').click();
   await act(p,'edit-subtopic').click();await field(p,'subEditor.amount').fill('1000.750');await act(p,'add-subtopic').click();
   await expect(p.locator('#field-subtopics')).toContainText('1,000.750');
   await act(p,'delete-subtopic').click();await act(p,'confirm-action').click();
   await expect(p.locator('.subrequest-empty')).toBeVisible();
   await act(p,'save-topic').click();await act(p,'next').click();await expect(p.locator('#error-summary')).toContainText('أضف طلبًا فرعيًا');
   await fill(p);await act(p,'save-topic').click();await p.screenshot({path:path.join(qa,'topic-v2.png'),fullPage:true});
   for(const width of [320,768,1024,1440]){await p.setViewportSize({width,height:1050});await audit(p,'requests '+width);}
   await next(p,'أطراف الدعوى');
   const q=await fresh();await act(q,'new').click();await q.locator('[data-route="initial"]').click();await fill(q);
   await field(q,'caseType').fill('شرعية');await next(q,'موضوع الدعوى والمحكمة');
   await field(q,'topic.main').selectOption('interference');await expect(q.locator('.request-rule')).toContainText('اختيارية');
   await act(q,'save-topic').click();await next(q,'أطراف الدعوى');
  });
  await run('review preserves hierarchy and selected judgment and expiry blocks final confirmation',async()=>{
   const p=await fresh('#file?route=appeal&case=01/2026/01001/1&judgment=J-01');await expect(field(p,'reference.judgment')).toHaveValue('J-01');
   await fill(p);await next(p,'موضوع الدعوى والمحكمة');
   await expect(p.locator('#field-subtopics')).toContainText('مطالبة مالية');
   await expect(p.locator('[data-action="add-subtopic"]')).toHaveCount(0);
   await act(p,'save-topic').click();await next(p,'أطراف الدعوى');await fill(p);
   await next(p,'المرفقات وطريقة الجلسة');await fill(p);await next(p,'راجع طلبك قبل التأكيد');
   const ref=p.locator('.review-section').filter({has:p.getByRole('heading',{name:'القضية والحكم محل الطعن',exact:true})});
   await expect(ref).toContainText('01/2026/01001/1');await expect(ref).toContainText('الحكم التجريبي الأول');
   await expect(p.locator('.request-hierarchy')).toContainText('إجمالي مبالغ الطلبات الفرعية');
   await expect(p.locator('.total-amount')).toHaveText('1,450.000');
   await p.screenshot({path:path.join(qa,'review-v2.png'),fullPage:true});
   await p.setViewportSize({width:390,height:844});await audit(p,'review mobile');await p.screenshot({path:path.join(qa,'review-mobile-v2.png'),fullPage:true});
   await scenario(p,{asOfDate:'2026-11-21'});await field(p,'ack').check();
   await expect(act(p,'final')).toBeDisabled();await expect(p.locator('.filing-availability')).toContainText('انتهت مدة التقديم');
   await act(p,'save-exit').click();await expect(p.getByRole('heading',{name:'ملفاتي القضائية',level:1,exact:true})).toBeVisible();await p.reload();await act(p,'resume').click();
   await expect(p.locator('#step-heading')).toHaveText('بيانات مقدم الطلب');
   await expect(field(p,'reference.judgment')).toHaveValue('J-01');
  });
  await run('malformed, mismatched and expired direct links never create a filing',async()=>{
   for(const hash of ['#file?route=appeal&case=01/2026/01001/1','#file?route=appeal&case=02/2026/02001/1&judgment=J-01','#file?route=cassation&case=02/2026/02001/1&judgment=J-02']){
    const p=await fresh(hash);await expect(p.locator('#modal-title')).toHaveText('تعذر بدء طلب الطعن');
    await expect(p.getByRole('heading',{name:'ملفاتي القضائية',level:1,exact:true})).toBeVisible();
    await act(p,'close-modal').click();await expect(p.locator('[data-action="resume"]')).toHaveCount(0);await audit(p,'bad link');
   }
  });
  console.log(JSON.stringify({passed}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});

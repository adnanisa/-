'use strict';
const {chromium,expect}=require('playwright/test');
const path=require('node:path');
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4188';
const qa=process.env.QA_DIR||process.cwd();
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 const act=(p,n)=>p.locator('[data-action="'+n+'"]').first();
 const field=(p,n)=>p.locator('[data-bind="'+n+'"]');
 const errors=[];
 let passed=0;
 async function fresh(route='appeal'){
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  await p.goto(base+'/#file?route='+route+'&case='+(route==='appeal'?'01/2026/01001/1':'02/2026/02001/1')+'&judgment=J-01');
  await expect(field(p,'reference.judgment')).toHaveValue('J-01');
  await expect(p.locator('#main')).not.toHaveAttribute('aria-busy','true');
  return p;
 }
 async function fill(p){await act(p,'demo').click();await act(p,'fill-demo').click();}
 async function mapping(p,value){await act(p,'demo').click();await p.locator('#modal [data-bind="demo.mapping"]').selectOption(value);await act(p,'apply-demo').click();}
 async function next(p){await act(p,'next').click();await expect(p.locator('#main')).not.toHaveAttribute('aria-busy','true');}
 async function run(name,fn){await fn();console.log('PASS '+name);passed++;}
 try{
  await run('appeal shows only mapped options and requires selection before advancing',async()=>{
   const p=await fresh();
   await expect(field(p,'caseType').locator('option')).toHaveText(['اختر من القائمة','استئناف مدني']);
   await expect(field(p,'caseType')).toHaveValue('');
   await expect(p.locator('#reference-result')).toContainText('الاختصاص');
   await expect(p.locator('#reference-result')).toContainText('مطالبات أو تعويضات مدنية');
   await next(p);await expect(p.locator('#error-summary')).toContainText('اختر نوع طعن');
   await fill(p);await expect(field(p,'caseType')).toHaveValue('استئناف مدني');
   await p.screenshot({path:path.join(qa,'mapping-appeal.png'),fullPage:true});
   await next(p);await expect(p.locator('#step-heading')).toHaveText('موضوع الدعوى والمحكمة');
   await expect(p.locator('#main')).toContainText('1,200.000');
   await p.context().close();
  });
  await run('cassation displays original and appeal links and only its allowed type',async()=>{
   const p=await fresh('cassation');
   await expect(field(p,'caseType').locator('option')).toHaveText(['اختر من القائمة','تمييز مدني']);
   await expect(p.locator('#reference-result')).toContainText('01/2026/01001/1');
   await expect(p.locator('#reference-result')).toContainText('02/2026/02001/1');
   await expect(p.locator('#reference-result')).toContainText('استئناف مدني');
   await fill(p);await expect(field(p,'caseType')).toHaveValue('تمييز مدني');
   await p.screenshot({path:path.join(qa,'mapping-cassation.png'),fullPage:true});
   await act(p,'save-exit').click();await expect(act(p,'resume')).toBeVisible();await p.reload();await act(p,'resume').click();
   await expect(field(p,'caseType')).toHaveValue('تمييز مدني');
   await expect(p.locator('#reference-result')).toContainText('01/2026/01001/1');
   await p.context().close();
  });
  await run('editing reference immediately clears selection, options and stale source data',async()=>{
   const p=await fresh();await field(p,'caseType').selectOption('استئناف مدني');
   await field(p,'reference.number').fill('02/2026/02001/1');
   await expect(field(p,'caseType')).toBeDisabled();await expect(field(p,'caseType').locator('option')).toHaveCount(1);
   await expect(p.locator('#reference-result')).toBeEmpty();
   await act(p,'lookup').click();await expect(p.locator('#reference-result')).toContainText('01/2026/01001/1');
   await field(p,'reference.number').fill('01/2026/01001/1');await act(p,'lookup').click();
   await expect(field(p,'caseType')).toBeEnabled();await expect(field(p,'caseType')).toHaveValue('');
   await p.context().close();
  });
  await run('missing mapping blocks progress but saves and restores data for both routes',async()=>{
   for(const route of ['appeal','cassation']){
    const p=await fresh(route);await fill(p);await mapping(p,'missing');
    await expect(field(p,'caseType')).toBeDisabled();
    await expect(p.locator('#case-type-section')).toContainText('إدارة المحاكم');
    await expect(p.locator('.filing-availability')).toContainText('التقديم غير متاح');
    await expect(field(p,'caseType').locator('option')).toHaveCount(1);
    await next(p);await expect(p.locator('#error-summary')).toContainText('لا يوجد نوع');
    await act(p,'save-exit').click();await expect(act(p,'resume')).toBeVisible();await p.reload();await act(p,'resume').click();
    await expect(field(p,'caseType')).toBeDisabled();await expect(field(p,'applicant.mobile')).toHaveValue('+973 30000000');
    for(const width of [320,768,1440]){
     await p.setViewportSize({width,height:1050});
     expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
    }
    await p.setViewportSize({width:390,height:844});
    await p.screenshot({path:path.join(qa,'mapping-missing-'+route+'.png'),fullPage:true});
    await mapping(p,'configured');await expect(field(p,'caseType')).toBeEnabled();await expect(field(p,'caseType')).toHaveValue('');
    await field(p,'caseType').selectOption(route==='appeal'?'استئناف مدني':'تمييز مدني');
    await next(p);await expect(p.locator('#step-heading')).toHaveText('موضوع الدعوى والمحكمة');
    await p.context().close();
   }
  });
  await run('legacy saved drafts recheck current case types without losing applicant data',async()=>{
   const context=await browser.newContext({viewport:{width:1440,height:1050}}),p=await context.newPage();
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base);await expect(act(p,'new')).toBeVisible();
   await p.evaluate(async()=>{
    const d=LawsuitDomain.createLinkedDraft('appeal','01/2026/01001/1','J-01');
    d.caseType='مدنية';d.step=4;d.maxStep=4;d.applicant.mobile='12345678';
    delete d.reference.data.originalType;delete d.reference.data.jurisdiction;
    await LawsuitStore.save(d);
   });
   await p.reload();await act(p,'resume').click();
   await expect(p.locator('#step-heading')).toHaveText('بيانات مقدم الطلب');
   await expect(field(p,'caseType')).toHaveValue('');
   await expect(field(p,'caseType').locator('option')).toHaveText(['اختر من القائمة','استئناف مدني']);
   await expect(field(p,'applicant.mobile')).toHaveValue('12345678');
   await expect(p.locator('#reference-result')).toContainText('الاختصاص');
   await context.close();
  });
  expect(errors).toEqual([]);console.log('Completed '+passed+' mapping browser scenarios without page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});


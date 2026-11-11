'use strict';
const {chromium,expect}=require('playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4173';
const qa=process.env.QA_DIR||process.cwd();
let passed=0;
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 const contexts=[];
 async function fresh(){
  const context=await browser.newContext({viewport:{width:1440,height:1050}});
  contexts.push(context);const page=await context.newPage();page.errors=[];
  page.on('pageerror',e=>page.errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto(base);await page.getByRole('heading',{name:'طلباتي القضائية'}).waitFor();
  return page;
 }
 const act=(p,n)=>p.locator('[data-action="'+n+'"]').first();
 const field=(p,n)=>p.locator('[data-bind="'+n+'"]');
 async function create(p,route='initial'){await act(p,'new').click();await p.locator('[data-route="'+route+'"]').click();}
 async function fill(p){await act(p,'demo').click();await act(p,'fill-demo').click();}
 async function scenario(p,changes){
  await act(p,'demo').click();
  for(const [k,v] of Object.entries(changes))await p.locator('#modal [data-bind="demo.'+k+'"]').selectOption(v);
  await act(p,'apply-demo').click();
 }
 async function next(p,title){await act(p,'next').click();await expect(p.locator('#step-heading')).toHaveText(title);await expect(p.locator('#main')).not.toHaveAttribute('aria-busy','true');}
 async function audit(p,label){
  const report=await p.evaluate(()=>{
   const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
   return {duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),overflow:document.documentElement.scrollWidth>innerWidth+2};
  });
  expect(report.duplicates,label+' duplicate IDs').toEqual([]);
  expect(report.overflow,label+' horizontal overflow').toBe(false);
  expect(p.errors,label+' page errors').toEqual([]);
 }
 async function ready(p,route='initial',opts={}){
  await create(p,route);await scenario(p,opts);await fill(p);
  await next(p,'موضوع الدعوى والمحكمة');await fill(p);await act(p,'save-topic').click();
  await expect(p.locator('.court-single')).toBeVisible();
  await next(p,'أطراف الدعوى');await fill(p);
  await next(p,'المرفقات وطريقة الجلسة');await fill(p);
  await next(p,'راجع طلبك قبل التأكيد');
  await expect(p.locator('.fee-total')).toBeVisible();
 }
 async function run(name,fn){await fn();passed++;console.log('PASS '+name);}
 try{
  await run('conditional applicant, incomplete save and cross-reload resume',async()=>{
   const p=await fresh();await create(p);
   await field(p,'applicant.role').selectOption('agency');await expect(field(p,'applicant.agency')).toBeVisible();
   await field(p,'applicant.agency').fill('DEMO-POA');
   await field(p,'applicant.role').selectOption('government');await expect(field(p,'applicant.government')).toBeVisible();
   await expect(field(p,'applicant.agency')).toHaveCount(0);
   await field(p,'applicant.government').fill('أمانة العاصمة');
   await p.locator('[data-bind="applicant.address.location"][value="foreign"]').check();
   await field(p,'applicant.address.country').fill('دولة تجريبية');
   await act(p,'save-exit').click();await expect(p.getByRole('heading',{name:'طلباتي القضائية'})).toBeVisible();
   await p.reload();await act(p,'resume').click();
   await expect(field(p,'applicant.government')).toHaveValue('أمانة العاصمة');
   await expect(field(p,'applicant.address.country')).toHaveValue('دولة تجريبية');
   await act(p,'next').click();await expect(p.locator('#error-summary')).toBeVisible();
   await audit(p,'applicant');
  });
  await run('one main topic, multiple subtopics, multiple court choices and invalidation',async()=>{
   const p=await fresh();await create(p);await fill(p);await next(p,'موضوع الدعوى والمحكمة');
   await expect(p.locator('.court-box')).toHaveCount(0);
   await scenario(p,{court:'multiple'});
   await field(p,'topic.main').selectOption('civil');
   await field(p,'topic.relatedCase').fill('RELATED-DEMO');
   await field(p,'subEditor.name').selectOption('مطالبة مالية');await field(p,'subEditor.amount').fill('1200.125');await act(p,'add-subtopic').click();
   await field(p,'subEditor.name').selectOption('تعويض عن ضرر مادي');await field(p,'subEditor.amount').fill('25.875');await act(p,'add-subtopic').click();
   await act(p,'save-topic').click();await expect(field(p,'topic.courtId')).toHaveValue('');
   await act(p,'next').click();await expect(p.locator('#error-summary')).toBeVisible();
   await field(p,'topic.courtId').selectOption('initial-court-1');
   await audit(p,'multiple-court');
   await p.screenshot({path:path.join(qa,'topic.png'),fullPage:true});
   await next(p,'أطراف الدعوى');
   await act(p,'back').click();await act(p,'edit-topic').click();
   await expect(p.locator('.court-box')).toHaveCount(0);
   await expect(field(p,'topic.relatedCase')).toHaveValue('RELATED-DEMO');
   await expect(p.locator('tbody tr')).toHaveCount(2);
  });
  await run('full initial path, attachment persistence and simulated payment receipt',async()=>{
   const p=await fresh();await ready(p);
   await audit(p,'review');await p.screenshot({path:path.join(qa,'review.png'),fullPage:true});
   await act(p,'save-exit').click();await p.reload();await act(p,'resume').click();
   await expect(p.locator('.fee-total')).toBeVisible();await expect(p.locator('.review-section').filter({hasText:'المرفقات وطريقة الجلسة'})).toContainText('demo-identity.pdf');
   await field(p,'ack').check();await expect(act(p,'final')).toHaveText('دفع');
   await act(p,'final').click();await expect(p.locator('#modal-title')).toHaveText('محاكاة الدفع');
   await act(p,'confirm-payment').click();await expect(p.getByRole('heading',{name:'اكتملت التجربة بنجاح'})).toBeVisible();
   await audit(p,'receipt');await p.screenshot({path:path.join(qa,'receipt.png'),fullPage:true});
  });
  await run('appeal reference validation and fee-free registration',async()=>{
   const p=await fresh();await create(p,'appeal');
   await field(p,'reference.number').fill('APP-2026-2001');await act(p,'lookup').click();
   await expect(p.locator('.notice.error')).toContainText('CASE-2026-1001');
   await fill(p);await scenario(p,{fee:'zero'});
   await next(p,'موضوع الدعوى والمحكمة');await act(p,'save-topic').click();await expect(p.locator('.court-single')).toBeVisible();
   await next(p,'أطراف الدعوى');await fill(p);
   await expect(p.locator('tbody')).toContainText('المستأنف ضده');
   await next(p,'المرفقات وطريقة الجلسة');await fill(p);
   await next(p,'راجع طلبك قبل التأكيد');await expect(act(p,'final')).toHaveText('تسجيل');
   await field(p,'ack').check();await act(p,'final').click();await expect(p.getByRole('heading',{name:'اكتملت التجربة بنجاح'})).toBeVisible();
  });
  await run('cassation reference and pending payment reconciliation uses one transaction',async()=>{
   const p=await fresh();await ready(p,'cassation',{payment:'pending'});
   await field(p,'ack').check();await act(p,'final').click();await act(p,'confirm-payment').click();
   await expect(p.getByRole('heading',{name:'عملية الدفع التجريبية معلقة'})).toBeVisible();
   const reference=await p.locator('.receipt-reference strong').innerText();
   await act(p,'home').click();await p.reload();await act(p,'resume').click();
   await expect(p.locator('.receipt-reference strong')).toHaveText(reference);
   await expect(act(p,'confirm-payment')).toHaveCount(0);
   await act(p,'check-payment').click();await expect(p.getByRole('heading',{name:'اكتملت التجربة بنجاح'})).toBeVisible();
  });
  await run('fee errors, paid-registration failure and recovery',async()=>{
   const p=await fresh();await ready(p,'initial',{payment:'registration'});
   await scenario(p,{fee:'error'});await expect(p.locator('.notice.error')).toContainText('لم يتم تأكيد الرسوم');
   await field(p,'ack').check();await expect(act(p,'final')).toBeDisabled();
   await scenario(p,{fee:'payable'});
   await expect(p.locator('.fee-total')).toBeVisible();await field(p,'ack').check();
   await act(p,'final').click();await act(p,'confirm-payment').click();
   await expect(p.getByRole('heading',{name:'تم الدفع التجريبي، والتسجيل لم يكتمل'})).toBeVisible();
   await act(p,'retry-registration').click();await expect(p.getByRole('heading',{name:'اكتملت التجربة بنجاح'})).toBeVisible();
  });
  await run('responsive layout and keyboard interaction',async()=>{
   const p=await fresh();await create(p);
   for(const width of [320,768,1024,1440]){
    await p.setViewportSize({width,height:1000});await audit(p,'width '+width);
   }
   await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(qa,'mobile.png'),fullPage:true});
   await field(p,'caseType').focus();await p.keyboard.press('Tab');
   expect(await p.evaluate(()=>document.activeElement.tagName)).not.toBe('BODY');
  });

  await run('manual party add/edit/remove, upload, resume, and delete',async()=>{
   const p=await fresh();await create(p);await fill(p);await next(p,'موضوع الدعوى والمحكمة');await fill(p);
   await act(p,'save-topic').click();await next(p,'أطراف الدعوى');
   await field(p,'partyEditor.identity').fill('TEST-PERSON-01');
   await field(p,'partyEditor.gender').selectOption('ذكر');
   await field(p,'partyEditor.nationality').fill('بحريني');
   await field(p,'partyEditor.role').selectOption('المدعي');
   await field(p,'partyEditor.name').fill('<مستخدم تجريبي>');
   await field(p,'partyEditor.address.building').fill('10');
   await field(p,'partyEditor.address.road').fill('20');
   await field(p,'partyEditor.address.block').fill('30');
   await act(p,'add-party').click();await expect(p.locator('tbody')).toContainText('<مستخدم تجريبي>');
   await act(p,'edit-party').click();await field(p,'partyEditor.name').fill('اسم معدل تجريبي');await act(p,'add-party').click();
   await expect(p.locator('tbody tr')).toHaveCount(1);
   await field(p,'partyEditor.identityType').selectOption('company');
   await expect(field(p,'partyEditor.gender')).toHaveCount(0);
   await field(p,'partyEditor.identity').fill('TEST-CR-01');await field(p,'partyEditor.role').selectOption('المدعى عليه');
   await field(p,'partyEditor.name').fill('شركة اختبار');
   await field(p,'partyEditor.address.building').fill('10');await field(p,'partyEditor.address.road').fill('20');await field(p,'partyEditor.address.block').fill('30');
   await act(p,'add-party').click();await expect(p.locator('tbody tr')).toHaveCount(2);
   await p.screenshot({path:path.join(qa,'parties.png'),fullPage:true});
   await next(p,'المرفقات وطريقة الجلسة');
   await p.locator('#upload-identity').setInputFiles({name:'invalid.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a PDF')});
   await expect(p.locator('#toast')).toContainText('لا يطابق صيغته');
   await expect(p.locator('.file-row')).toHaveCount(0);
   const pdf=Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
   await p.locator('#upload-identity').setInputFiles({name:'test-identity.pdf',mimeType:'application/pdf',buffer:pdf});
   await expect(p.locator('.file-row')).toHaveCount(1);
   await act(p,'save-exit').click();await p.reload();await act(p,'resume').click();
   await expect(p.locator('.file-row')).toContainText('test-identity.pdf');
   await act(p,'delete-file').click();await act(p,'confirm-action').click();await expect(p.locator('.file-row')).toHaveCount(0);
   await act(p,'save-exit').click();await act(p,'delete-draft').click();await act(p,'confirm-action').click();
   await expect(p.getByRole('heading',{name:'كل طلب يبدأ بخطوة'})).toBeVisible();
  });
  await run('empty/error court results and failed payment remain recoverable',async()=>{
   const p=await fresh();await create(p);await fill(p);await next(p,'موضوع الدعوى والمحكمة');
   await field(p,'topic.main').selectOption('civil');await scenario(p,{court:'empty'});
   await act(p,'save-topic').click();await expect(p.locator('#court-result')).toContainText('لا توجد محكمة');
   await act(p,'next').click();await expect(p.locator('#error-summary')).toBeVisible();
   await scenario(p,{court:'error'});await act(p,'save-topic').click();await expect(p.locator('#court-result')).toContainText('تعذر جلب');
   await scenario(p,{court:'single',payment:'failure'});await act(p,'save-topic').click();
   await next(p,'أطراف الدعوى');await fill(p);await next(p,'المرفقات وطريقة الجلسة');await fill(p);
   await next(p,'راجع طلبك قبل التأكيد');await field(p,'ack').check();await act(p,'final').click();await act(p,'confirm-payment').click();
   await expect(p.locator('#step-heading')).toHaveText('راجع طلبك قبل التأكيد');
   await expect(p.locator('#toast')).toContainText('لم تنجح محاكاة الدفع');
   await expect(field(p,'ack')).not.toBeChecked();await expect(p.locator('[data-action="final"]')).toHaveText('دفع');
  });
  await run('file entry point works without a build or external resources',async()=>{
   const context=await browser.newContext();contexts.push(context);const p=await context.newPage();
   await p.goto(require('node:url').pathToFileURL(path.join(__dirname,'index.html')).href);
   await expect(p.getByRole('heading',{name:'طلباتي القضائية'})).toBeVisible();
   await create(p);await fill(p);await act(p,'save-exit').click();await p.reload();await act(p,'resume').click();
   await expect(field(p,'applicant.email')).toHaveValue('demo@example.com');
  });

  console.log(JSON.stringify({passed}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

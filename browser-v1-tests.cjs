'use strict';
const {chromium,expect}=require('playwright/test');
const path=require('node:path');
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4173',qa=process.env.QA_DIR||process.cwd();
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 let passed=0;const errors=[];
 const act=(p,a)=>p.locator('[data-action="'+a+'"]').first(),field=(p,n)=>p.locator('[data-bind="'+n+'"]');
 async function fresh(){const c=await browser.newContext({viewport:{width:1440,height:1050}}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await p.goto(base);await expect(p.getByRole('heading',{level:1,name:'ملفاتي القضائية'})).toBeVisible();return p;}
 async function fill(p){await act(p,'demo').click();await act(p,'fill-demo').click();}
 async function next(p,title){await act(p,'next').click();await expect(p.locator('#step-heading')).toHaveText(title);await expect(p.locator('#main')).not.toHaveAttribute('aria-busy','true');}
 async function startTopic(p){await act(p,'new').click();await p.locator('[data-route="initial"]').click();await fill(p);await next(p,'موضوع الدعوى والمحكمة');}
 async function startParties(p){await startTopic(p);await fill(p);await act(p,'save-topic').click();await next(p,'أطراف الدعوى');}
 async function audit(p){for(const width of [320,768,1024,1440]){await p.setViewportSize({width,height:1050});const r=await p.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return {overflow:document.documentElement.scrollWidth>innerWidth+2,duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i)};});expect(r.overflow,'overflow '+width).toBe(false);expect(r.duplicates).toEqual([]);}}
 async function run(name,fn){const p=await fresh();try{await fn(p);passed++;console.log('PASS '+name);}finally{await p.context().close();}}
 try{
  await run('dashboard labels, combined filters, deadline sorting, and details',async p=>{
   await expect(p.locator('nav [data-action="home"]')).toHaveText('ملفاتي');await expect(p.locator('.stat')).toHaveCount(2);
   await expect(p.locator('.filing-notification').nth(0)).toContainText('2 أيام');await expect(p.locator('.filing-notification').nth(1)).toContainText('6 أيام');await expect(p.locator('.filing-notification').nth(2)).toContainText('8 أيام');
   await p.locator('#filing-route').selectOption('cassation');await p.locator('#filing-remaining').selectOption('7');await expect(p.locator('.filing-notification')).toHaveCount(1);
   await p.locator('#filing-search').fill('NO-MATCH');await expect(p.getByText('لا توجد إشعارات مطابقة',{exact:true})).toBeVisible();await p.locator('#filing-search').fill('');
   await p.locator('#filing-remaining').selectOption('expired');await expect(p.locator('.filing-notification')).toHaveCount(1);await expect(p.locator('.filing-notification a')).toHaveCount(0);
   await p.locator('#filing-route').selectOption('all');await p.locator('#filing-remaining').selectOption('all');
   await p.locator('#draft-search').fill('٠٢/٢٠٢٦/٠٢٠٠١/١');await expect(p.locator('#draft-rows tr')).toHaveCount(1);await p.locator('#draft-rows [data-action="view-case"]').click();await expect(p.locator('.case-overview')).toContainText('02/2026/02001/1');await act(p,'home').click();
   await p.locator('#case-type-filter').selectOption('تجارية');await expect(p.getByText('لا توجد ملفات مطابقة',{exact:true})).toBeVisible();await p.locator('#case-type-filter').selectOption('all');
   await audit(p);await p.screenshot({path:path.join(qa,'v1-files-desktop.png'),fullPage:true});await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(qa,'v1-files-mobile.png'),fullPage:true});
  });
  await run('topic save comes after subtopics and cannot save incomplete work',async p=>{
   await startTopic(p);await field(p,'topic.main').selectOption('civil');await act(p,'save-topic').click();await expect(p.locator('#error-summary')).toContainText('أضف طلبًا فرعيًا');await expect(p.locator('#court-result')).toHaveCount(0);
   await field(p,'subEditor.name').selectOption('مطالبة مالية');await field(p,'subEditor.amount').fill('100');await act(p,'save-topic').click();await expect(p.locator('#error-summary')).toContainText('أضف الطلب الفرعي الجاري');
   await act(p,'add-subtopic').click();const order=await p.evaluate(()=>{const main=document.querySelector('[data-bind="topic.main"]'),sub=document.querySelector('.request-children'),save=document.querySelector('[data-action="save-topic"]');return !!(main.compareDocumentPosition(sub)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(sub.compareDocumentPosition(save)&Node.DOCUMENT_POSITION_FOLLOWING)});expect(order).toBe(true);
   await act(p,'save-topic').click();await expect(p.locator('#court-result')).toContainText('الصغرى المدنية');await audit(p);await p.screenshot({path:path.join(qa,'v1-topic.png'),fullPage:true});
   await act(p,'edit-subtopic').click();await field(p,'subEditor.amount').fill('200');await act(p,'add-subtopic').click();await expect(p.locator('#court-result')).toHaveCount(0);await act(p,'save-topic').click();await next(p,'أطراف الدعوى');
  });
  await run('identity sources, stale data clearing, government selection, and save/resume',async p=>{
   await startParties(p);await expect(field(p,'partyEditor.identityType').locator('option')).toHaveCount(4);
   await field(p,'partyEditor.identity').fill('DEMO-ID-001');await act(p,'lookup-party').click();await expect(field(p,'partyEditor.name')).toHaveValue('طرف تجريبي أول');await expect(p.locator('#identity-result')).toContainText('الإحصاء');
   await field(p,'partyEditor.identity').fill('UNKNOWN');await expect(field(p,'partyEditor.name')).toHaveValue('');await act(p,'lookup-party').click();await expect(p.locator('#identity-result')).toContainText('لم يعثر');
   await field(p,'partyEditor.identityType').selectOption('company');await expect(field(p,'partyEditor.identity')).toHaveValue('');await expect(field(p,'partyEditor.gender')).toHaveCount(0);
   await field(p,'partyEditor.identity').fill('DEMO-CR-001');await act(p,'lookup-party').click();await expect(field(p,'partyEditor.name')).toHaveValue('شركة المثال التجريبية');await expect(p.locator('#identity-result')).toContainText('السجلات التجارية');await p.screenshot({path:path.join(qa,'v1-commercial.png'),fullPage:true});
   await field(p,'partyEditor.identityType').selectOption('government');await expect(act(p,'lookup-party')).toHaveCount(0);await field(p,'partyEditor.identity').selectOption('GOV-01');await expect(field(p,'partyEditor.name')).toHaveValue('أمانة العاصمة');
   await field(p,'partyEditor.role').selectOption('المدعى عليه');for(const key of ['building','road','block'])await field(p,'partyEditor.address.'+key).fill('1');
   await audit(p);await p.screenshot({path:path.join(qa,'v1-government.png'),fullPage:true});await act(p,'add-party').click();await expect(p.locator('tbody')).toContainText('هيئة حكومية');await act(p,'save-exit').click();
   const number=await p.locator('#draft-rows tr').last().locator('td strong').first().textContent();expect(number).toMatch(/^3\d{9}$/);await p.locator('[data-action="view-file"]').click();await expect(p.locator('.case-overview').first()).toContainText(number);await expect(p.locator('#field-parties tbody')).toContainText('أمانة العاصمة');
   await act(p,'home').click();await p.reload();await p.locator('#draft-search').fill(number);await expect(p.locator('#draft-rows tr')).toHaveCount(1);await act(p,'resume').click();await expect(p.locator('.draft-info strong')).toHaveText(number);await expect(p.locator('#field-parties tbody')).toContainText('أمانة العاصمة');
  });
  await run('lookup service error retries without retaining a stale name',async p=>{
   await startParties(p);await field(p,'partyEditor.identity').fill('DEMO-ID-001');await act(p,'demo').click();await p.locator('#modal [data-bind="demo.identity"]').selectOption('error');await act(p,'apply-demo').click();await act(p,'lookup-party').click();await expect(p.locator('#identity-result')).toContainText('تعذر');await expect(field(p,'partyEditor.name')).toHaveValue('');
   await act(p,'demo').click();await p.locator('#modal [data-bind="demo.identity"]').selectOption('valid');await act(p,'apply-demo').click();await act(p,'lookup-party').click();await expect(field(p,'partyEditor.name')).toHaveValue('طرف تجريبي أول');
   await field(p,'partyEditor.identityType').selectOption('');await expect(field(p,'partyEditor.name')).toHaveValue('');
  });
  expect(errors).toEqual([]);console.log(JSON.stringify({passed,pageErrors:errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

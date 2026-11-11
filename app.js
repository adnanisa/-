(function(){
'use strict';
const C=window.LawsuitData,D=window.LawsuitDomain,U=window.LawsuitUI,Store=window.LawsuitStore;
const main=document.getElementById('main'),modal=document.getElementById('modal');
const state={draft:null,items:[],screen:'dashboard',errors:[],dirty:false,busy:false,version:0,storageError:'',demoDefaults:{court:'single',fee:'payable',reference:'valid',payment:'success'}};
let toastTimer,confirmCallback,lastFocus;
function toast(message,error=false){
 const el=document.getElementById('toast');el.textContent=message;el.className='toast visible'+(error?' error':'');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4500);
}
function render(focus=false){
 if(state.screen==='dashboard')main.innerHTML=U.dashboard(state.items,state.storageError);
 else if(state.screen==='result')main.innerHTML=U.result(state.draft);
 else main.innerHTML=U.wizard(state.draft,state.errors,state.busy);
 if(focus){document.getElementById('step-heading')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function changed(){state.dirty=true;state.version++;if(state.draft)state.draft.ack=false;}
function showErrors(errors){state.errors=errors;render();document.getElementById('error-summary')?.focus();}
function openDialog(html){lastFocus=document.activeElement;document.getElementById('modal-content').innerHTML=html;if(!modal.open)modal.showModal();}
function closeDialog(){modal.close();if(lastFocus?.isConnected)lastFocus.focus();}
function confirmDialog(title,message,callback,label='تأكيد'){
 confirmCallback=callback;
 openDialog(U.modal(title,'<p>'+D.escape(message)+'</p>',U.btn('إلغاء','close-modal','secondary')+U.btn(label,'confirm-action','primary')));
}
async function busyWork(fn){
 if(state.busy)return;
 state.busy=true;main.inert=true;main.setAttribute('aria-busy','true');
 try{await fn();}catch(e){toast(e.message||'تعذر تنفيذ العملية. أعد المحاولة.',true);}
 finally{state.busy=false;main.inert=false;main.removeAttribute('aria-busy');render();}
}
async function persist(silent=false){
 const d=state.draft;if(!d)return false;
 const version=state.version;
 try{
  const saved=await Store.save(d);Object.assign(d,saved);if(version===state.version)state.dirty=false;
  if(!silent)toast('تم حفظ المسودة على هذا المتصفح.');
  return true;
 }catch(e){
  if(e.message.includes('نافذة أخرى'))openDialog(U.modal('تعارض بين نسختين','<p>'+D.escape(e.message)+'</p>',U.btn('الاحتفاظ بهذه الصفحة','close-modal','secondary')+U.btn('حفظ نسخة جديدة','save-copy','primary')));
  else toast(e.message,true);
  return false;
 }
}
async function home(){
 state.screen='dashboard';state.errors=[];
 try{state.items=await Store.list();state.storageError='';}catch(e){state.storageError=e.message;}
 render(true);
}
function goHome(){
 if(state.dirty&&state.draft&&state.draft.status!=='registered'){
  openDialog(U.modal('لديك تغييرات غير محفوظة','<p>احفظ تقدمك قبل العودة إلى طلباتك، أو اخرج دون حفظ التغييرات الأخيرة.</p>',U.btn('البقاء هنا','close-modal','secondary')+U.btn('خروج دون حفظ','discard-home','secondary')+U.btn('حفظ والخروج','save-exit','primary')));
 }else home();
}
function setPath(object,path,value){
 const parts=path.split('.');let target=object;
 for(const part of parts.slice(0,-1))target=target[part];
 target[parts.at(-1)]=value;
}
function boundChange(el,refresh=false){
 const path=el.dataset.bind;if(!path||path.startsWith('demo.')||!state.draft||state.busy)return;
 const d=state.draft;if(d.status==='registered'||['paid','pending'].includes(d.payment.status))return;
 const parts=path.split('.');const old=parts.reduce((o,k)=>o?.[k],d);
 const value=el.type==='checkbox'?el.checked:el.value;
 if(old===value)return;
 if(path==='ack'){d.ack=value;state.dirty=true;state.version++;const b=main.querySelector('[data-action="final"]');if(b)b.disabled=!value||D.finalAction(d.fee)==='unavailable';return;}
 setPath(d,path,value);changed();state.errors=state.errors.filter(x=>x.field!==path);
 if(path==='reference.number'){d.reference.status='idle';d.reference.data=null;d.reference.judgment='';d.reference.message='';D.invalidate(d,'court');}
 else if(path==='caseType'||path==='topic.main'||path==='topic.relatedCase'||path==='reference.judgment')D.invalidate(d,'court');
 else if(path==='topic.courtId'){d.session='';D.invalidate(d);}
 else if(!path.startsWith('subEditor.')&&!path.startsWith('partyEditor.'))D.invalidate(d);
 if(refresh)render();
}
document.addEventListener('input',event=>{
 const el=event.target;
 if(el.matches('[data-bind]')&&!el.matches('select,[type=radio],[type=checkbox]'))boundChange(el);
 if(el.id==='draft-search')filterDrafts();
});
document.addEventListener('change',event=>{
 const el=event.target;
 if(el.dataset.category&&el.type==='file'){uploadFiles(el);return;}
 if(el.id==='draft-filter'){filterDrafts();return;}
 if(el.matches('[data-bind]')){
  const path=el.dataset.bind;
  boundChange(el,['applicant.role','applicant.address.location','partyEditor.identityType','partyEditor.address.location','topic.main','topic.courtId','reference.judgment'].includes(path));
  // Text fields have already updated on input; refresh conditional address controls on radio change.
 }
});
function filterDrafts(){
 const q=(document.getElementById('draft-search')?.value||'').toLowerCase();
 const filter=document.getElementById('draft-filter')?.value||'all';
 const items=state.items.filter(d=>(filter==='all'||(filter==='draft'?d.status!=='registered':d.status==='registered'))&&(d.id+' '+U.topicLabel(d)+' '+d.caseType).toLowerCase().includes(q));
 document.getElementById('draft-rows').innerHTML=U.draftRows(items);
}
async function create(route){
 const d=D.createDraft(route);d.demo={...state.demoDefaults};state.draft=d;state.screen='wizard';state.dirty=true;state.errors=[];state.version++;
 closeDialog();render(true);
}
async function resume(id){
 const d=await Store.get(id);if(!d){toast('هذه المسودة لم تعد متاحة.',true);await home();return;}
 state.draft=d;state.dirty=false;state.errors=[];state.version++;
 if(d.status==='registered'||['pending','paid'].includes(d.payment.status)){state.screen='result';render(true);return;}
 // Retain entries, but recheck simulated references/court and fees instead of trusting stale results.
 if(d.route!=='initial'&&d.reference.status==='verified'){
  const r=D.lookupReference(d.route,d.reference.number,d.demo.reference);
  d.reference={...d.reference,...r};if(r.status!=='verified'){D.invalidate(d,'court');d.step=0;}
 }
 if(d.topic.saved){
  try{d.topic.courts=D.courtsFor(d);const r=D.resolveCourts(d.topic.courts);d.topic.courtStatus=r.status;
   if(!d.topic.courts.some(c=>c.id===d.topic.courtId)){d.topic.courtId=r.courtId;d.session='';d.step=Math.min(d.step,1);}
  }catch(e){d.topic.courtStatus='error';d.topic.courtId='';d.step=Math.min(d.step,1);}
 }
 d.ack=false;d.fee={status:'idle',items:[]};state.screen='wizard';render(true);
 if(d.step===4)await calculateFees();
}
function delay(ms=350){return new Promise(resolve=>setTimeout(resolve,ms));}
async function lookup(){
 const d=state.draft;
 if(!d.reference.number.trim()){showErrors([{field:'reference.number',message:'أدخل الرقم التجريبي للمرجع.',step:0}]);return;}
 await busyWork(async()=>{
  d.reference.status='loading';d.reference.message='';render();await delay();
  const result=D.lookupReference(d.route,d.reference.number,d.demo.reference);
  d.reference={...d.reference,...result,judgment:''};
  D.invalidate(d,'court');
  if(result.status==='verified'){d.caseType=result.data.type;d.topic.main=result.data.topic;}
  changed();render();
 });
}
async function fetchCourts(){
 const d=state.draft;d.topic.courtStatus='loading';render();await delay();
 try{
  d.topic.courts=D.courtsFor(d);const result=D.resolveCourts(d.topic.courts);
  d.topic.courtId=result.courtId;d.topic.courtStatus=result.status;
 }catch(e){d.topic.courtStatus='error';d.topic.courts=[];d.topic.courtId='';}
 changed();await persist(true);render();
}
async function saveTopic(){
 const d=state.draft;
 if(!C.topics.some(t=>t.id===d.topic.main)){showErrors([{field:'topic.main',message:'اختر الموضوع الرئيسي.',step:1}]);return;}
 await busyWork(async()=>{
  D.invalidate(d);d.topic.saved=true;d.topic.courtStatus='loading';state.errors=[];
  if(!(await persist(true))){d.topic.saved=false;d.topic.courtStatus='idle';render();return;}
  await fetchCourts();toast('حُفظ الموضوع الرئيسي وتم تحديث نتيجة المحكمة.');
 });
}
function addSubtopic(){
 const d=state.draft,s=d.subEditor,t=C.topics.find(t=>t.id===d.topic.main),errors=[];
 if(!t?.sub.includes(s.name))errors.push({field:'subEditor.name',message:'اختر موضوعًا فرعيًا تابعًا للموضوع الرئيسي.',step:1});
 if(D.toFils(s.amount)===null)errors.push({field:'subEditor.amount',message:'أدخل مبلغًا غير سالب حتى 3 منازل عشرية وفق إعدادات التجربة.',step:1});
 if(d.subtopics.some(x=>x.id!==s.id&&x.name===s.name))errors.push({field:'subEditor.name',message:'هذا الموضوع الفرعي مضاف بالفعل في التجربة.',step:1});
 if(errors.length){showErrors(errors);return;}
 const item={id:s.id||D.uid('SUB'),name:s.name,amount:D.normalizeDigits(s.amount)};
 const i=d.subtopics.findIndex(x=>x.id===s.id);if(i>=0)d.subtopics[i]=item;else d.subtopics.push(item);
 d.subEditor={id:'',name:'',amount:''};D.invalidate(d,'court');changed();state.errors=[];render();toast('أضيف الموضوع الفرعي. احفظ الموضوع الرئيسي لتحديث المحكمة.');
}
function addParty(){
 const d=state.draft,errors=D.validateParty(d.partyEditor,d);
 if(errors.length){showErrors(errors);return;}
 const item=structuredClone(d.partyEditor);item.id=item.id||D.uid('PARTY');
 const i=d.parties.findIndex(p=>p.id===item.id);if(i>=0)d.parties[i]=item;else d.parties.push(item);
 d.partyEditor=D.party();D.invalidate(d);changed();state.errors=[];render();toast('تمت إضافة الطرف إلى الجدول.');
}
async function uploadFiles(input){
 const files=[...input.files],category=input.dataset.category,d=state.draft;
 if(!d||state.busy||!files.length)return;
 if(d.files.filter(f=>f.category===category).length+files.length>C.demoRules.maxFilesPerCategory){toast('الحد التجريبي 3 ملفات لكل فئة.',true);input.value='';return;}
 await busyWork(async()=>{
  const accepted=[];
  for(const file of files){
   const ext=file.name.split('.').at(-1).toLowerCase();
   if(!C.demoRules.extensions.includes(ext)||file.size>C.demoRules.maxFileBytes||file.size===0)throw new Error('راجع الملف «'+file.name+'»: الصيغ PDF / JPG / PNG، والحجم حتى 10 ميغابايت.');
   const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());
   const valid=ext==='pdf'?String.fromCharCode(...bytes.slice(0,5))==='%PDF-':ext==='png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:bytes[0]===255&&bytes[1]===216;
   if(!valid)throw new Error('محتوى الملف لا يطابق صيغته: '+file.name);
   accepted.push({id:D.uid('FILE'),category,name:file.name,size:file.size,type:file.type,blob:file});
  }
  d.files.push(...accepted);D.invalidate(d);changed();
  if(await persist(true))toast('تم إرفاق الملفات وحفظها مع المسودة.');
  render();
 });input.value='';
}
async function calculateFees(){
 const d=state.draft;d.fee={status:'loading',items:[]};render();await delay();d.fee=D.feesFor(d);d.ack=false;render();
}
async function next(){
 const d=state.draft;const errors=D.validateStep(d,d.step);
 if(errors.length){showErrors(errors);return;}
 await busyWork(async()=>{
  d.step=Math.min(d.step+1,4);d.maxStep=Math.max(d.maxStep,d.step);state.errors=[];changed();
  await persist(true);render(true);if(d.step===4)await calculateFees();
 });
}
async function gotoStep(step){
 const d=state.draft;if(step>d.step){for(let i=0;i<step;i++){const e=D.validateStep(d,i);if(e.length){d.step=i;showErrors(e);return;}}}
 d.step=step;state.errors=[];changed();render(true);if(step===4)await calculateFees();
}
function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function registerPersisted(){
 const d=state.draft,previous={status:d.status,registration:d.registration};
 D.completeRegistration(d);changed();
 if(await persist(true)){state.dirty=false;return true;}
 d.status=previous.status;d.registration=previous.registration;return false;
}
function paymentDialog(){
 const d=state.draft,total=d.fee.items.reduce((s,i)=>s+i.fils,0);
 openDialog(U.modal('محاكاة الدفع',U.notice('لا توجد عملية دفع فعلية، ولن تُطلب منك أي بيانات بطاقة.','warn')+'<div class="fee-total"><span>المبلغ التجريبي</span><strong><bdi>'+D.money(total)+'</bdi> <small>د.ب</small></strong></div><p class="help-text">يمكن تغيير نتيجة العملية من إعدادات التجربة.</p>',U.btn('إلغاء الدفع','cancel-payment','secondary')+U.btn('تنفيذ الدفع التجريبي','confirm-payment','primary','card')));
}
async function finalAction(){
 const d=state.draft,errors=D.validateFinal(d);
 if(errors.length){const first=errors[0];d.step=first.step;showErrors(errors);return;}
 if(D.finalAction(d.fee)==='pay'){if(D.canStartPayment(d))paymentDialog();else{state.screen='result';render(true);}return;}
 await busyWork(async()=>{
  if(!(await persist(true)))return;
  if(!(await registerPersisted())){render();return;}
  state.screen='result';state.dirty=false;render(true);
 });
}
async function pay(){
 const d=state.draft;
 if(!D.canStartPayment(d))return;
 // Persist a pending attempt before simulating the external service.
 await busyWork(async()=>{
  d.payment={status:'pending',id:D.uid('SIM-PAY')};
  if(!(await persist(true))){d.payment={status:'none',id:''};closeDialog();return;}
  closeDialog();state.screen='result';render(true);await delay(650);
  if(d.demo.payment==='failure'){
   d.payment.status='failed';d.step=4;d.ack=false;state.screen='wizard';changed();await persist(true);render(true);toast('لم تنجح محاكاة الدفع. يمكنك المحاولة مجددًا.',true);return;
  }
  if(d.demo.payment==='pending'){await persist(true);render();return;}
  d.payment.status='paid';
  if(!(await persist(true))){render();return;}
  if(d.demo.payment!=='registration')await registerPersisted();
  render(true);
 });
}
async function checkPayment(){
 await busyWork(async()=>{
  await delay(450);const d=state.draft;
  // Reconciliation acts on the same payment id, never creates a new charge.
  d.payment.status='paid';
  if(await persist(true)){
   if(d.demo.payment!=='registration')await registerPersisted();
   render(true);toast('تم تحديث حالة العملية التجريبية نفسها.');
  }
 });
}
async function retryRegistration(){
 await busyWork(async()=>{
  const d=state.draft;await delay(350);
  if(await registerPersisted())render(true);
 });
}
function demoPdf(){
 const stream='BT /F1 18 Tf 50 740 Td (DEMO DOCUMENT - NOT FOR LEGAL USE) Tj ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream'];
 let text='%PDF-1.4\n',offsets=[0];
 objects.forEach((o,i)=>{offsets.push(text.length);text+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});
 const start=text.length;text+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF';
 return new Blob([text],{type:'application/pdf'});
}
async function fillDemo(){
 const d=state.draft;if(!d)return;
 closeDialog();
 if(d.step===0){
  d.caseType='مدنية';d.applicant.mobile='+973 30000000';d.applicant.email='demo@example.com';d.applicant.confirmEmail='demo@example.com';
  d.applicant.agency='DEMO-AGENCY-01';d.applicant.government=C.governments[0];
  d.applicant.address={...D.address(),flat:'12',building:'100',road:'200',block:'300'};
  if(d.route!=='initial'){
   d.reference.number=d.route==='appeal'?'CASE-2026-1001':'APP-2026-2001';
   const r=D.lookupReference(d.route,d.reference.number,d.demo.reference);d.reference={...d.reference,...r,judgment:r.status==='verified'?'J-01':''};
   if(r.status==='verified')d.topic.main='civil';
  }
 }else if(d.step===1){
  d.topic.main='civil';
  if(d.route==='initial')d.subtopics=[{id:D.uid('SUB'),name:'مطالبة مالية',amount:'1200.000'},{id:D.uid('SUB'),name:'تعويض عن ضرر مادي',amount:'250.000'}];
  D.invalidate(d,'court');
 }else if(d.step===2){
  d.parties=C.routes[d.route].roles.map((role,i)=>({...D.party(),id:D.uid('PARTY'),identity:'DEMO-ID-00'+(i+1),name:i?'شركة المثال التجريبية':'طرف تجريبي أول',identityType:i?'company':'personal',gender:i?'':'ذكر',nationality:i?'':'بحريني',role,mobile:'+973 30000000',email:'party'+i+'@example.com',address:{...D.address(),building:'100',road:'200',block:'300'}}));
  d.partyEditor=D.party();
 }else if(d.step===3){
  const blob=demoPdf();
  for(const doc of D.docsFor(d).filter(x=>x.required))if(!d.files.some(f=>f.category===doc.id))d.files.push({id:D.uid('FILE'),category:doc.id,name:'demo-'+doc.id+'.pdf',size:blob.size,type:'application/pdf',blob});
  d.session='onsite';
 }
 changed();state.errors=[];render();toast('أضيفت بيانات تجريبية للخطوة الحالية.');
}
async function applyDemo(){
 const values={};modal.querySelectorAll('[data-bind^="demo."]').forEach(el=>{values[el.dataset.bind.split('.')[1]]=el.value;});
 const d=state.draft;state.demoDefaults={...values};closeDialog();
 if(d&&state.screen==='wizard'){
  const previous=d.demo;d.demo=values;
  if(previous.court!==values.court)D.invalidate(d,'court');
  if(previous.reference!==values.reference&&d.route!=='initial'){d.reference.status='idle';d.reference.data=null;d.reference.judgment='';D.invalidate(d,'court');}
  if(previous.fee!==values.fee)D.invalidate(d);
  changed();render();if(d.step===4)await calculateFees();
 }
 toast('تم تطبيق إعدادات التجربة.');
}
const handlers={
 'new':()=>openDialog(U.routeModal()),
 'choose-route':el=>create(el.dataset.route),
 'home':goHome,'reload-home':home,
 'resume':el=>resume(el.dataset.id),
 'close-modal':closeDialog,
 'confirm-action':()=>{const f=confirmCallback;confirmCallback=null;closeDialog();f?.();},
 'guide':()=>openDialog(U.guideModal()),
 'demo':()=>openDialog(U.demoModal(state.screen==='wizard'?state.draft:null)),
 'apply-demo':applyDemo,'fill-demo':fillDemo,
 'discard-home':()=>{state.dirty=false;closeDialog();home();},
 'delete-draft':el=>confirmDialog('حذف المسودة','سيتم حذف المسودة ومرفقاتها من هذا المتصفح. لا يمكن التراجع عن الحذف.',async()=>{await Store.remove(el.dataset.id);await home();toast('حُذفت المسودة.');},'حذف المسودة'),
 'save':()=>busyWork(async()=>{if(await persist())render();}),
 'save-exit':()=>busyWork(async()=>{if(await persist()){closeDialog();await home();}}),
 'save-copy':()=>busyWork(async()=>{state.draft.id=D.uid('DRAFT');state.draft.revision=0;state.draft.updatedAt=null;closeDialog();if(await persist())render();}),
 'lookup':lookup,'save-topic':saveTopic,
 'retry-courts':()=>busyWork(fetchCourts),
 'edit-topic':()=>{D.invalidate(state.draft,'court');changed();render();},
 'add-subtopic':addSubtopic,
 'cancel-subtopic':()=>{state.draft.subEditor={id:'',name:'',amount:''};changed();state.errors=[];render();},
 'edit-subtopic':el=>{state.draft.subEditor={...state.draft.subtopics.find(x=>x.id===el.dataset.id)};render();},
 'delete-subtopic':el=>confirmDialog('حذف الموضوع الفرعي','سيعاد تحديد المحكمة والرسوم بعد حذف هذا الموضوع.',()=>{state.draft.subtopics=state.draft.subtopics.filter(x=>x.id!==el.dataset.id);D.invalidate(state.draft,'court');changed();render();},'حذف الموضوع'),
 'add-party':addParty,
 'cancel-party':()=>{state.draft.partyEditor=D.party();state.errors=[];changed();render();},
 'edit-party':el=>{state.draft.partyEditor=structuredClone(state.draft.parties.find(p=>p.id===el.dataset.id));state.errors=[];render();document.getElementById(U.fieldId('partyEditor.name'))?.focus();},
 'delete-party':el=>confirmDialog('حذف الطرف','هل تريد إزالة هذا الطرف من الطلب؟',()=>{state.draft.parties=state.draft.parties.filter(p=>p.id!==el.dataset.id);D.invalidate(state.draft);changed();render();},'حذف الطرف'),
 'applicant-party':()=>{const d=state.draft,a=d.applicant;d.partyEditor={...D.party(),name:a.name,identity:a.personalId,mobile:a.mobile,email:a.email,address:structuredClone(a.address)};changed();render();},
 'upload':el=>document.getElementById('upload-'+el.dataset.category)?.click(),
 'download-file':el=>{const f=state.draft.files.find(f=>f.id===el.dataset.id);if(f)download(f.blob,f.name);},
 'delete-file':el=>confirmDialog('حذف المرفق','هل تريد حذف هذا الملف من الطلب؟',()=>{state.draft.files=state.draft.files.filter(f=>f.id!==el.dataset.id);D.invalidate(state.draft);changed();render();},'حذف المرفق'),
 'next':next,
 'back':()=>state.draft.step===0?goHome():gotoStep(state.draft.step-1),
 'step':el=>gotoStep(Number(el.dataset.step)),
 'edit-step':el=>gotoStep(Number(el.dataset.step)),
 'calculate-fees':()=>busyWork(calculateFees),
 'final':finalAction,
 'cancel-payment':()=>{closeDialog();toast('أُلغيت محاكاة الدفع. طلبك محفوظ.');},
 'confirm-payment':pay,'check-payment':checkPayment,'retry-registration':retryRegistration,
 'print':()=>window.print(),
 'receipt':()=>{const d=state.draft;const text=['إيصال تجريبي — ليس مستندًا رسميًا','رقم القيد: '+d.registration.number,'رقم الطلب: '+d.id,'المسار: '+C.routes[d.route].label,'التاريخ: '+d.registration.date,'المبلغ التجريبي: '+D.money(d.fee.items.reduce((s,x)=>s+x.fils,0))+' د.ب','لم يتم تقديم دعوى أو سداد رسوم فعلية.'].join('\n');download(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}),'demo-receipt.txt');},
 'focus-error':async el=>{const step=el.dataset.step;if(step!==''&&Number(step)!==state.draft.step){state.draft.step=Number(step);render(true);}const target=document.getElementById(U.fieldId(el.dataset.field))||(el.dataset.field==='topic.courtId'?document.getElementById('court-result'):null);target?.focus();target?.scrollIntoView({block:'center',behavior:'smooth'});}
};
document.addEventListener('click',async event=>{
 const el=event.target.closest('[data-action]');if(!el)return;
 if(state.busy&&el.dataset.action!=='close-modal')return;
 const handler=handlers[el.dataset.action];if(!handler)return;
 try{await handler(el);}catch(e){toast(e.message||'حدث خطأ في التجربة. يرجى إعادة المحاولة.',true);console.error(e);}
});
window.addEventListener('beforeunload',event=>{if(state.dirty){event.preventDefault();event.returnValue='';}});
modal.addEventListener('click',event=>{if(event.target===modal)closeDialog();});
home();
})();

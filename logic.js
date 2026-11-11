(function(root){
 'use strict';
 const C=typeof module!=='undefined'&&module.exports?require('./data.js'):root.LawsuitData;
 const uid=prefix=>prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 const address=()=>({location:'local',flat:'',building:'',alpha:'',road:'',block:'',country:'',city:'',detail:''});
 function party(){return {id:'',identityType:'personal',identity:'',name:'',gender:'',nationality:'',role:'',mobile:'',email:'',address:address()};}
 function createDraft(route='initial'){
  return {id:uid('DRAFT'),revision:0,route,step:0,maxStep:0,status:'draft',updatedAt:null,
   applicant:{name:'مستخدم تجريبي',personalId:'DEMO-USER-01',role:'self',agency:'',government:'',mobile:'',email:'',confirmEmail:'',address:address()},
   caseType:'',reference:{number:'',status:'idle',judgment:'',data:null},
   topic:{main:'',relatedCase:'',saved:false,courts:[],courtId:'',courtStatus:'idle'},
   subtopics:[],subEditor:{id:'',name:'',amount:''},parties:[],partyEditor:party(),
   files:[],session:'',ack:false,fee:{status:'idle',items:[]},payment:{status:'none',id:''},registration:null,
   demo:{court:'single',fee:'payable',reference:'valid',payment:'success'}};
 }
 function resolveCourts(courts){return {status:courts.length===1?'ready':courts.length>1?'choose':'empty',courtId:courts.length===1?courts[0].id:''};}
 function courtsFor(d){
  if(d.demo.court==='error') throw new Error('تعذر الاتصال بخدمة تحديد المحكمة. أعد المحاولة.');
  if(d.demo.court==='empty') return [];
  const names=d.route==='initial'?['الصغرى المدنية','الكبرى المدنية']:d.route==='appeal'?['محكمة الاستئناف العليا المدنية','المحكمة الكبرى بصفتها الاستئنافية']:['محكمة التمييز','محكمة التمييز - دائرة تجريبية ثانية'];
  return (d.demo.court==='multiple'?names:[names[0]]).map((name,i)=>({id:d.route+'-court-'+i,name,remote:true}));
 }
 function normalizeDigits(s){return String(s).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace('٫','.').trim();}
 function toFils(value){
  const s=normalizeDigits(value); if(!/^\d+(\.\d{1,3})?$/.test(s))return null;
  const [whole,frac='']=s.split('.'); const n=Number(whole)*1000+Number(frac.padEnd(3,'0'));
  return Number.isSafeInteger(n)?n:null;
 }
 function money(fils){return new Intl.NumberFormat('en-BH',{minimumFractionDigits:3,maximumFractionDigits:3}).format(fils/1000);}
 function feesFor(d){
  if(d.demo.fee==='error')return {status:'error',items:[]};
  if(d.demo.fee==='zero')return {status:'ready',items:[]};
  return {status:'ready',items:[{label:'الرسوم المطلوبة',fils:76500},{label:'رسوم اللائحة',fils:1000},{label:'رسوم الإحضاريات',fils:1000}]};
 }
 function finalAction(fee){
  if(fee.status!=='ready')return 'unavailable';
  return fee.items.reduce((s,i)=>s+i.fils,0)>0?'pay':'register';
 }
 function invalidate(d,scope='fee'){
  d.ack=false;d.fee={status:'idle',items:[]};
  if(scope==='court'){d.topic.saved=false;d.topic.courts=[];d.topic.courtId='';d.topic.courtStatus='idle';d.session='';}
 }
 function lookupReference(route,number,mode){
  if(mode==='error')return {status:'error',message:'تعذر الاتصال بخدمة التحقق. يمكنك حفظ المسودة وإعادة المحاولة.'};
  if(mode==='missing')return {status:'missing',message:'لم نعثر على سجل تجريبي متاح بهذا الرقم.'};
  if(mode==='ineligible')return {status:'ineligible',message:'هذا الحكم غير متاح للطعن ضمن سيناريو التجربة المحدد.'};
  const expected=route==='appeal'?'CASE-2026-1001':'APP-2026-2001';
  if(String(number).trim().toUpperCase()!==expected)return {status:'invalid',message:'استخدم الرقم التجريبي '+expected+' لهذا المسار.'};
  return {status:'verified',data:{number:expected,type:'مدنية',court:route==='appeal'?'الصغرى المدنية':'محكمة الاستئناف العليا المدنية',state:'محسومة - بيانات تجريبية',original:'CASE-2026-1001',judgments:[{id:'J-01',label:'الحكم التجريبي الأول · 01/10/2026'},{id:'J-02',label:'الحكم التجريبي الثاني · 15/10/2026'}],topic:'civil'}};
 }
 function docsFor(d){
  if(d.route==='initial')return C.attachments;
  return [
   {id:'identity',name:'مستند هوية مقدم الطعن — مثال تجريبي',required:true},
   {id:'statement',name:d.route==='appeal'?'لائحة الاستئناف — مثال تجريبي':'لائحة الطعن بالتمييز — مثال تجريبي',required:true},
   {id:'judgment',name:'صورة الحكم المطعون فيه — مثال تجريبي',required:true},
   ...C.attachments.filter(x=>['agency','other','translation'].includes(x.id))
  ];
 }
 const present=v=>String(v??'').trim().length>0;
 const email=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
 function addressErrors(a,prefix){
  const required=a.location==='local'?['building','road','block']:['country','city','detail'];
  const labels={building:'المبنى',road:'الطريق',block:'المجمع',country:'الدولة',city:'المدينة',detail:'العنوان التفصيلي'};
  return required.filter(k=>!present(a[k])).map(k=>({field:prefix+'.'+k,message:'أدخل '+labels[k]+' في العنوان.'}));
 }
 function validateParty(p,d){
  const e=[];const add=(f,m)=>e.push({field:'partyEditor.'+f,message:m});
  if(!present(p.identity))add('identity','أدخل رقم هوية الطرف.');
  if(!present(p.name))add('name','أدخل اسم الطرف.');
  if(!C.routes[d.route].roles.includes(p.role))add('role','اختر صفة الطرف.');
  if(p.identityType==='personal'){
   if(!p.gender)add('gender','اختر الجنس.'); if(!C.nationalities.includes(p.nationality))add('nationality','اختر الجنسية من القائمة.');
  }
  if(p.email&&!email(p.email))add('email','أدخل بريدًا إلكترونيًا صحيحًا للطرف.');
  if(d.parties.some(x=>x.id!==p.id&&x.identityType===p.identityType&&x.identity.trim()===p.identity.trim()&&x.role===p.role))add('identity','هذا الطرف مضاف بالفعل بالهوية والصفة نفسيهما.');
  return e.concat(addressErrors(p.address,'partyEditor.address'));
 }
 function validateStep(d,step){
  const e=[]; const add=(field,message)=>e.push({field,message});
  if(step===0){
   if(!C.caseTypes.includes(d.caseType))add('caseType','اختر نوع دعوى من قائمة التجربة.');
   if(d.route!=='initial'){
    if(d.reference.status!=='verified')add('reference.number','تحقق من مرجع الدعوى أو الاستئناف قبل المواصلة.');
    if(!d.reference.judgment)add('reference.judgment','اختر الحكم محل الطعن.');
   }
   const a=d.applicant;
   if(!a.role)add('applicant.role','اختر صفة مقدم الطلب.');
   if(a.role==='agency'&&!present(a.agency))add('applicant.agency','أدخل رقم الوكالة لاستكمال التجربة.');
   if(a.role==='government'&&!C.governments.includes(a.government))add('applicant.government','اختر الجهة الحكومية.');
   if(!present(a.mobile))add('applicant.mobile','أدخل رقم الهاتف النقال.');
   if(!email(a.email))add('applicant.email','أدخل بريدًا إلكترونيًا صحيحًا.');
   if(!present(a.confirmEmail)||a.email!==a.confirmEmail)add('applicant.confirmEmail','يجب أن يطابق تأكيد البريد البريد الإلكتروني.');
   e.push(...addressErrors(a.address,'applicant.address'));
  }
  if(step===1){
   if(!C.topics.some(t=>t.id===d.topic.main))add('topic.main','اختر الموضوع الرئيسي.');
   if(d.route!=='initial'&&d.topic.main!==d.reference.data?.topic)add('topic.main','يجب أن يطابق الموضوع مرجع الطعن في هذا النموذج.');
   const allowed=C.topics.find(t=>t.id===d.topic.main)?.sub||[];
   if(d.subtopics.some(s=>!allowed.includes(s.name)))add('subtopics','راجع الموضوعات الفرعية بعد تغيير الموضوع الرئيسي.');
   if(!d.topic.saved)add('topic.main','احفظ الموضوع الرئيسي لتحديد المحكمة.');
   if(!d.topic.courtId||!d.topic.courts.some(c=>c.id===d.topic.courtId))add('topic.courtId','حدد المحكمة المختصة بعد حفظ الموضوع.');
   if(d.subEditor.name||d.subEditor.amount)add('subEditor.name','أضف الموضوع الفرعي الجاري إدخاله أو ألغِ إدخاله قبل المواصلة.');
   if(d.subtopics.some(x=>toFils(x.amount)===null))add('subtopics','راجع مبالغ الموضوعات الفرعية.');
  }
  if(step===2){
   if(!d.parties.length)add('parties','أضف أطراف الطلب قبل المواصلة.');
   else for(const role of C.routes[d.route].roles)if(!d.parties.some(p=>p.role===role))add('parties','أضف طرفًا بصفة «'+role+'» لاستكمال السيناريو التجريبي.');
   if(d.partyEditor.name||d.partyEditor.identity)add('partyEditor.name','أضف الطرف الجاري إدخاله أو ألغِ إدخاله قبل المواصلة.');
  }
  if(step===3){
   for(const doc of docsFor(d))if(doc.required&&!d.files.some(f=>f.category===doc.id&&f.blob instanceof Blob))add('files.'+doc.id,'أرفق: '+doc.name);
   if(!d.session)add('session','اختر طريقة حضور الجلسة.');
  }
  if(step===4){
   if(d.fee.status!=='ready')add('fees','انتظر تأكيد الرسوم أو أعد المحاولة.');
   if(!d.ack)add('ack','يرجى الموافقة على الإقرار.');
  }
  return e.map(x=>({...x,step}));
 }
 function validateFinal(d){return [0,1,2,3,4].flatMap(i=>validateStep(d,i));}
 function canStartPayment(d){return !['pending','paid'].includes(d.payment.status)&&d.status!=='registered';}
 function completeRegistration(d){
  if(d.registration)return d;
  d.status='registered';d.registration={number:uid('SIM-CASE'),date:new Date().toISOString()};return d;
 }
 function escape(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 const api={uid,address,party,createDraft,resolveCourts,courtsFor,normalizeDigits,toFils,money,feesFor,finalAction,invalidate,lookupReference,docsFor,validateParty,validateStep,validateFinal,canStartPayment,completeRegistration,escape};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LawsuitDomain=api;
})(typeof window==='undefined'?globalThis:window);

(function(root){
'use strict';
const C=root.LawsuitData,D=root.LawsuitDomain,esc=D.escape;
const paths={
 plus:'M12 5v14M5 12h14',chevron:'m14 6-6 6 6 6',left:'M19 12H5m6-6-6 6 6 6',right:'M5 12h14m-6-6 6 6-6 6',check:'m5 12 4 4L19 6',
 file:'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8M8 17h5',
 layers:'m12 3 10 5-10 5L2 8Zm-9 9 9 5 9-5M3 17l9 5 9-5',
 scale:'M12 3v18M7 21h10M3 7h18M6 7l-4 8h8L6 7Zm12 0-4 8h8l-4-8Z',
 save:'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2ZM7 3v6h10V3M7 21v-8h10v8',
 search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 clock:'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 folder:'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
 edit:'m16 3 5 5-12 12H4v-5ZM14 5l5 5',
 trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
 info:'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 user:'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 users:'M16 21v-2a5 5 0 0 0-5-5H7a5 5 0 0 0-5 5v2M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17 3a4 4 0 0 1 0 8M22 21v-2a5 5 0 0 0-3-4.6',
 upload:'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',
 close:'m6 6 12 12M6 18 18 6',
 card:'M2 8h20M2 5h20v14H2ZM6 14h3',
 building:'M3 21h18M5 21V9h14v12M3 9l9-6 9 6ZM9 12v6M15 12v6',
 download:'M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4',
 print:'M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6Z',
 shield:'M12 3 3 7v5c0 5 9 10 9 10s9-5 9-10V7Zm-5 9 3 3 7-7',
 refresh:'M20 7V3l-3 3A8 8 0 0 0 4 10M4 17v4l3-3a8 8 0 0 0 13-4'
};
function icon(name){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+(paths[name]||paths.file)+'"/></svg>';}
function btn(label,action,style='secondary',ico='',attrs=''){return '<button type="button" class="btn '+style+'" data-action="'+action+'" '+attrs+'>'+ (ico?icon(ico):'')+label+'</button>';}
const fieldId=path=>'field-'+path.replaceAll('.','-');
let errors=[];
function input(label,path,value,options={}){
 const id=fieldId(path),err=errors.find(e=>e.field===path);
 return '<div class="field '+(options.full?'full':'')+'"><label for="'+id+'">'+label+(options.required?'<span class="req" aria-hidden="true">*</span>':'')+'</label><input id="'+id+'" data-bind="'+path+'" type="'+(options.type||'text')+'" value="'+esc(value)+'" '+(options.required?'aria-required="true" ':'')+(options.readonly?'readonly ':'')+(options.ltr?'dir="ltr" ':'')+(options.list?'list="list-'+id+'" ':'')+(options.placeholder?'placeholder="'+esc(options.placeholder)+'" ':'')+(options.inputmode?'inputmode="'+options.inputmode+'" ':'')+'class="'+(err?'invalid':'')+'" '+(err?'aria-invalid="true" aria-describedby="error-'+id+'"':'')+' autocomplete="'+(options.autocomplete||'off')+'">'+(options.list?'<datalist id="list-'+id+'">'+options.list.map(x=>'<option value="'+esc(x)+'"></option>').join('')+'</datalist>':'')+(options.help?'<small>'+options.help+'</small>':'')+(err?'<p class="field-error" id="error-'+id+'">'+esc(err.message)+'</p>':'')+'</div>';
}
function select(label,path,value,options,required=false,full=false,disabled=false){
 const id=fieldId(path),err=errors.find(e=>e.field===path);
 return '<div class="field '+(full?'full':'')+'"><label for="'+id+'">'+label+(required?'<span class="req" aria-hidden="true">*</span>':'')+'</label><select id="'+id+'" data-bind="'+path+'" '+(disabled?'disabled ':'')+(required?'aria-required="true" ':'')+(err?'class="invalid" aria-invalid="true" aria-describedby="error-'+id+'"':'')+'><option value="">اختر من القائمة</option>'+options.map(x=>{const v=typeof x==='string'?x:x.id,l=typeof x==='string'?x:x.label;return '<option value="'+esc(v)+'" '+(v===value?'selected':'')+'>'+esc(l)+'</option>';}).join('')+'</select>'+(err?'<p class="field-error" id="error-'+id+'">'+esc(err.message)+'</p>':'')+'</div>';
}
function radio(label,path,value,options,required=false){
 return '<fieldset class="radio-group full" id="'+fieldId(path)+'"><legend class="field-label">'+label+(required?'<span class="req">*</span>':'')+'</legend>'+options.map(x=>'<label class="radio-option"><input type="radio" name="'+path+'" data-bind="'+path+'" value="'+x.id+'" '+(value===x.id?'checked':'')+'>'+x.label+'</label>').join('')+'</fieldset>';
}
function notice(text,type='info'){return '<div class="notice '+type+'">'+icon(type==='success'?'check':'info')+'<div>'+text+'</div></div>';}
function address(a,prefix){
 const local=a.location==='local';
 return radio('العنوان',prefix+'.location',a.location,[{id:'local',label:'داخل البحرين'},{id:'foreign',label:'خارج البحرين'}],true)+'<div class="address-grid '+(!local?'foreign':'')+'">'+(local?
 input('شقة',prefix+'.flat',a.flat)+input('مبنى',prefix+'.building',a.building,{required:true})+select('ألفا',prefix+'.alpha',a.alpha,['A','B','C','N'])+input('طريق',prefix+'.road',a.road,{required:true})+input('مجمع',prefix+'.block',a.block,{required:true}):
 input('الدولة',prefix+'.country',a.country,{required:true})+input('المدينة',prefix+'.city',a.city,{required:true})+input('العنوان التفصيلي',prefix+'.detail',a.detail,{required:true,full:true}))+'</div>';
}
function addr(a){return a.location==='local'?[a.flat&&'شقة '+a.flat,a.building&&'مبنى '+a.building,a.alpha,a.road&&'طريق '+a.road,a.block&&'مجمع '+a.block].filter(Boolean).join('، '):[a.country,a.city,a.detail].filter(Boolean).join('، ');}
const topicLabel=d=>C.topics.find(t=>t.id===d.topic.main)?.label||'لم يحدد الموضوع بعد';
const date=s=>s?new Intl.DateTimeFormat('ar-BH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(s)):'لم تحفظ بعد';
function listData(items){return '<dl class="data-list">'+items.map(([k,v])=>'<div><dt>'+k+'</dt><dd><bdi dir="'+(/^[+\dA-Za-z]/.test(String(v))?'ltr':'auto')+'">'+esc(v||'—')+'</bdi></dd></div>').join('')+'</dl>';}
function errorSummary(list){return list.length?'<div class="error-summary" role="alert" tabindex="-1" id="error-summary"><strong>يرجى مراجعة البيانات التالية</strong><ul>'+list.map(e=>'<li><button data-action="focus-error" data-field="'+e.field+'" data-step="'+(e.step??'')+'">'+esc(e.message)+'</button></li>').join('')+'</ul></div>':'';}
function breadcrumb(current){return '<div class="breadcrumb"><button data-action="home">الخدمات العدلية</button>'+icon('chevron')+'<button data-action="home">طلباتي</button>'+(current?icon('chevron')+'<span>'+current+'</span>':'')+'</div>';}
function draftRows(items){
 return items.map(d=>'<tr><td><strong class="ltr">'+esc(d.id)+'</strong><small>'+date(d.updatedAt)+'</small></td><td><strong>'+C.routes[d.route].label+'</strong><small>'+esc(d.caseType||'نوع الدعوى غير محدد')+'</small></td><td>'+esc(topicLabel(d))+'</td><td><span class="badge '+(d.status==='registered'?'green':d.payment.status==='pending'?'amber':'rose')+'">'+(d.status==='registered'?'مسجل تجريبيًا':d.payment.status==='pending'?'الدفع معلق':d.payment.status==='paid'?'بانتظار التسجيل':'مسودة')+'</span></td><td><div class="actions">'+btn(d.status==='registered'?'عرض':d.payment.status==='pending'||d.payment.status==='paid'?'متابعة':'استكمال','resume','soft small','', 'data-id="'+d.id+'"')+(d.status==='draft'&&!['pending','paid'].includes(d.payment.status)?'<button class="icon-button" data-action="delete-draft" data-id="'+d.id+'" aria-label="حذف المسودة '+esc(d.id)+'">'+icon('trash')+'</button>':'')+'</div></td></tr>').join('')||'<tr><td colspan="5"><div class="empty"><div class="empty-icon">'+icon('folder')+'</div><h3>لا توجد طلبات مطابقة</h3><p>يمكنك بدء طلب جديد أو تغيير عبارة البحث.</p></div></td></tr>';
}

function dayLabel(value){return D.validDemoDate(value)?new Intl.DateTimeFormat('ar-BH',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z')):'غير متاح';}
function availabilityPanel(d){
 const a=D.appealAvailability(d),tone=a.allowed?(a.status==='open'?'success':'warn'):a.status==='unselected'?'info':'error';
 const count=a.remainingDays===null?'—':a.remainingDays<0?'انتهت':a.remainingDays===0?'اليوم':a.remainingDays+' أيام';
 return '<div class="filing-availability '+tone+'" aria-live="polite"><div class="availability-heading">'+icon('clock')+'<strong>'+(a.allowed?'التقديم متاح':a.status==='unselected'?'اختر الحكم محل الطعن':'التقديم غير متاح')+'</strong><span class="badge">محاكاة</span></div><p>'+esc(a.reason)+'</p>'+(a.judgment?'<div class="deadline-data"><div><small>المدة المتبقية</small><strong>'+count+'</strong></div><div><small>آخر يوم للتقديم</small><strong>'+dayLabel(a.deadline)+'</strong></div></div>':'')+'<small class="simulation-note">الاحتساب بتاريخ '+dayLabel(a.asOf)+' في المحاكاة. المواعيد أمثلة وليست مددًا قانونية معتمدة.</small></div>';
}
function referenceDraft(record,judgment,demo){return {route:record.route,reference:{status:'verified',data:record,judgment},demo};}
function filingLink(record,judgment,label){
 const href='#file?route='+record.route+'&case='+encodeURIComponent(record.number)+'&judgment='+encodeURIComponent(judgment);
 return '<a class="btn primary small" href="'+esc(href)+'">'+label+icon('left')+'</a>';
}
function filingInbox(demo){
 const notifications=[[C.cases[0],'J-02'],[C.cases[1],'J-01'],[C.cases[1],'J-02']];
 return '<section class="panel filing-panel" aria-labelledby="filing-inbox-title"><div class="panel-head"><div><h2 id="filing-inbox-title">إشعارات التقديم والقضايا المرتبطة</h2><p class="help-text">ابدأ الطعن من القضية أو الإشعار، وستنتقل بيانات المرجع والحكم إلى طلبك.</p></div><span class="badge amber">قضايا تجريبية</span></div><div class="filing-inbox-grid"><div class="filing-notifications">'+notifications.map(([record,id])=>{
 const a=D.appealAvailability(referenceDraft(record,id,demo)),label=C.routes[record.route].label;
 return '<article class="filing-notification" data-case="'+record.number+'" data-judgment="'+id+'"><div class="notification-icon">'+icon('clock')+'</div><div class="notification-copy"><h3>'+(a.allowed?(a.status==='today'?'آخر يوم للتقديم':label+' متاح · متبقي '+a.remainingDays+' أيام'):'التقديم غير متاح')+'</h3><p><bdi>'+record.number+'</bdi> · '+esc(a.judgment.label)+'</p><small>'+esc(a.reason)+'</small></div><div class="notification-actions">'+(a.allowed?filingLink(record,id,'بدء '+label):'<span class="badge rose">'+(a.status==='expired'?'انتهت المدة':'غير متاح')+'</span>')+'</div></article>';
 }).join('')+'</div><div class="linked-cases"><h3>القضايا المرتبطة</h3>'+C.cases.map(c=>'<article><strong><bdi>'+c.number+'</bdi></strong><p>'+esc(c.court)+'</p><small>'+esc(c.state)+'</small>'+btn('عرض القضية والأحكام','view-case','secondary small','file','data-number="'+c.number+'"')+'</article>').join('')+'</div></div><p class="inbox-footnote">تاريخ المحاكاة: '+dayLabel(demo.asOfDate||C.demoRules.asOfDate)+' · لتجربة مرور الوقت غيّر التاريخ من إعدادات التجربة.</p></section>';
}
function casePage(record,demo){
 return breadcrumb('تفاصيل القضية')+'<div class="page-head"><div><p class="eyebrow">قضية مرتبطة · بيانات تجريبية</p><h1 id="step-heading" tabindex="-1">تفاصيل القضية والأحكام</h1><p>اختر الحكم المتاح لبدء '+C.routes[record.route].label+' مرتبط بهذه القضية.</p></div>'+btn('العودة إلى طلباتي','home','secondary','right')+'</div><section class="panel case-overview">'+listData([['رقم القضية',record.number],['نوع الدعوى',record.type],['المحكمة',record.court],['حالة القضية',record.state],['الدعوى الأصلية',record.original],['موضوع الطلب الرئيسي',topicLabel({topic:{main:record.topic}})]])+'</section><h2 class="case-judgments-title">الأحكام والإجراءات المتاحة</h2><div class="case-judgments">'+record.judgments.map(j=>{
 const d=referenceDraft(record,j.id,demo),a=D.appealAvailability(d);
 return '<article class="panel judgment-card"><h3>'+esc(j.label)+'</h3><p class="help-text">رقم الحكم: <bdi>'+j.id+'</bdi> · تاريخ الحكم: '+dayLabel(j.date)+'</p>'+availabilityPanel(d)+(a.allowed?filingLink(record,j.id,'بدء طلب '+C.routes[record.route].label):'<p class="help-text">يمكنك استعراض الحكم؛ بدء الطعن غير متاح لهذا السيناريو.</p>')+'</article>';
 }).join('')+'</div>';
}

function dashboard(items,storageError='',demo={}){
 const pending=items.filter(d=>d.status!=='registered').length,done=items.length-pending;
 return breadcrumb('')+'<div class="page-head"><div><p class="eyebrow">خدمات المحاكم والقضايا</p><h1>طلباتي القضائية</h1><p>ابدأ طلبًا جديدًا، أو استكمل مسودة محفوظة من حيث توقفت.</p></div>'+btn('رفع دعوى جديدة','new','primary','plus')+'</div>'+
 (storageError?notice(esc(storageError)+' '+btn('إعادة المحاولة','reload-home','secondary small','refresh'),'error'):'')+
 '<div class="stats">'+[['folder',pending,'طلبات غير مستكملة'],['check',done,'طلبات مسجلة تجريبيًا'],['layers',3,'مسارات قضائية']].map(([i,n,l])=>'<div class="stat"><div class="stat-icon">'+icon(i)+'</div><div><strong>'+n+'</strong><span>'+l+'</span></div></div>').join('')+'</div>'+filingInbox(demo)+'<div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>طلباتك <span class="count">'+items.length+'</span></h2><span class="badge">محفوظة على هذا المتصفح</span></div>'+
 (items.length?'<div class="filters"><div class="search-wrap">'+icon('search')+'<input id="draft-search" type="search" aria-label="البحث في الطلبات" placeholder="ابحث برقم المسودة أو الموضوع…"></div><select id="draft-filter" aria-label="تصفية الطلبات"><option value="all">جميع الطلبات</option><option value="draft">غير المستكملة</option><option value="registered">المسجلة تجريبيًا</option></select></div><div class="table-wrap"><table><thead><tr><th>رقم الطلب / آخر حفظ</th><th>المسار</th><th>الموضوع الرئيسي</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody id="draft-rows">'+draftRows(items)+'</tbody></table></div>':
 '<div class="empty"><div class="empty-icon">'+icon('folder')+'</div><h3>كل طلب يبدأ بخطوة</h3><p>جهّز بياناتك ومستنداتك، ثم ابدأ طلبك. يمكنك حفظ تقدمك والعودة إليه في أي وقت.</p>'+btn('ابدأ طلبك الأول','new','primary','plus')+'</div>')+'</section><aside class="dashboard-side"><div class="panel aside-box"><h2>قبل أن تبدأ</h2><ol class="guide-list"><li><strong>حدد مسار الطلب</strong>دعوى ابتدائية، استئناف أو تمييز.</li><li><strong>جهّز بيانات الأطراف</strong>الهوية والصفة وبيانات التواصل.</li><li><strong>أرفق المستندات</strong>راجع المستندات المطلوبة قبل التأكيد.</li></ol><div class="aside-note">'+icon('save')+' تستطيع حفظ طلبك في كل خطوة واستكماله لاحقًا.</div>'+btn('دليل الخدمة','guide','secondary small','info')+'</div><div class="service-note">هذه نسخة تجريبية. استخدم بيانات ومستندات تجريبية فقط؛ لا يتم إرسالها إلى أي جهة.</div></aside></div>';
}
function applicant(d){
 const a=d.applicant;
 let ref='';
 if(d.route!=='initial'){
  const isAppeal=d.route==='appeal',code=isAppeal?'CASE-2026-1001':'APP-2026-2001';
  ref='<section class="form-section"><h3 class="subheading">'+(isAppeal?'الدعوى محل الاستئناف':'الاستئناف محل التمييز')+'</h3><div class="lookup-row">'+input(isAppeal?'رقم الدعوى المحسومة المراد استئنافها':'رقم الاستئناف المراد الطعن عليه بالتمييز','reference.number',d.reference.number,{required:true,ltr:true,help:'للتجربة: <bdi>'+code+'</bdi>'})+btn(d.reference.status==='loading'?'جارٍ التحقق…':'التحقق من المرجع','lookup','secondary','search',d.reference.status==='loading'?'disabled':'')+'</div>';
  ref+='<div id="reference-result">';
  if(d.entry==='linked')ref+=notice('تم تجهيز الطلب من القضية المرتبطة. راجع بيانات المرجع والحكم، ثم أكمل بيانات مقدم الطلب.','success');
  if(d.reference.status==='verified')ref+='<div class="court-box">'+notice('تم استرجاع سجل تجريبي. بيانات الأهلية والحكم محاكاة.','success')+listData([['نوع الدعوى',d.reference.data.type],['المحكمة',d.reference.data.court],['حالة الدعوى',d.reference.data.state],['الدعوى الأصلية',d.reference.data.original]])+'<div style="margin-top:18px">'+select('الحكم محل الطعن','reference.judgment',d.reference.judgment,d.reference.data.judgments,true)+'</div>'+availabilityPanel(d)+'</div>';
  else if(d.reference.message)ref+=notice(esc(d.reference.message),'error');
  ref+='</div></section>';
 }
 return '<section class="form-section"><div class="form-grid">'+input('نوع الدعوى','caseType',d.caseType,{required:true,list:C.caseTypes,full:true,placeholder:'ابحث واختر نوع الدعوى'})+'</div></section>'+ref+
 '<section class="form-section"><h3 class="subheading">بيانات مقدم الطلب</h3><div class="identity-card"><div class="avatar">ت</div><div><strong>'+esc(a.name)+'</strong><span>هوية العرض: <bdi>'+esc(a.personalId)+'</bdi></span></div><span class="badge">هوية تجريبية</span></div><div class="form-grid">'+
 select('صفة مقدم الطلب','applicant.role',a.role,C.applicantRoles,true,true)+
 (a.role==='agency'?input('رقم الوكالة','applicant.agency',a.agency,{required:true,full:true,help:'قيمة تجريبية؛ لا يتم التحقق من وكالة فعلية.'}):'')+
 (a.role==='government'?input('الجهة الحكومية','applicant.government',a.government,{required:true,list:C.governments,full:true,placeholder:'ابحث عن الجهة الحكومية'}):'')+
 (a.role==='lawfirm'?'<div class="full">'+notice('تعرض هذه التجربة صفة ممثل مكتب محاماة. اعتماد المكتب والتفويض يحتاجان تكاملًا فعليًا.')+'</div>':'')+
 input('رقم الهاتف النقال','applicant.mobile',a.mobile,{required:true,type:'tel',ltr:true,placeholder:'+973 …'})+
 '<div></div>'+input('البريد الإلكتروني','applicant.email',a.email,{required:true,type:'email',ltr:true,placeholder:'name@example.com'})+
 input('تأكيد البريد الإلكتروني','applicant.confirmEmail',a.confirmEmail,{required:true,type:'email',ltr:true})+'</div></section><section class="form-section">'+address(a.address,'applicant.address')+'</section>';
}
function subtopicTable(d,editable=true){
 const body=d.subtopics.length?'<div class="table-wrap"><table><caption class="request-caption">طلبات فرعية تابعة لـ «'+esc(topicLabel(d))+'»</caption><thead><tr><th>الطلب الفرعي</th><th>مبلغ المطالبة (د.ب)</th>'+(editable?'<th>الإجراء</th>':'')+'</tr></thead><tbody>'+d.subtopics.map((s,i)=>'<tr><td><span class="request-index">'+(i+1)+'</span>'+esc(s.name)+'</td><td><bdi>'+D.money(D.toFils(s.amount)||0)+'</bdi></td>'+(editable?'<td><button class="icon-button" data-action="edit-subtopic" data-id="'+s.id+'" aria-label="تعديل '+esc(s.name)+'">'+icon('edit')+'</button><button class="icon-button" data-action="delete-subtopic" data-id="'+s.id+'" aria-label="حذف '+esc(s.name)+'">'+icon('trash')+'</button></td>':'')+'</tr>').join('')+'</tbody></table></div><div class="subtotal"><span>إجمالي مبالغ الطلبات الفرعية</span><span><bdi class="total-amount">'+D.money(d.subtopics.reduce((s,t)=>s+(D.toFils(t.amount)||0),0))+'</bdi> د.ب</span></div>':'<p class="subrequest-empty">لم تُضف طلبات فرعية بعد.</p>';
 return '<div id="'+fieldId('subtopics')+'" tabindex="-1">'+body+'</div>';
}

function topic(d){
 const t=C.topics.find(x=>x.id===d.topic.main);let court='';
 if(d.topic.saved){
  if(d.topic.courtStatus==='loading')court=notice('<span class="spinner"></span> جارٍ تحديد المحكمة المختصة…');
  else if(d.topic.courtStatus==='error')court=notice('تعذر جلب المحكمة المختصة. '+btn('إعادة المحاولة','retry-courts','secondary small','refresh'),'error');
  else if(d.topic.courtStatus==='empty')court=notice('لا توجد محكمة مطابقة في هذا السيناريو. راجع إعدادات التجربة أو بيانات الموضوع.','warn');
  else if(d.topic.courts.length===1)court='<div class="court-single">'+icon('building')+'<div><small>المحكمة المختصة</small><strong>'+esc(d.topic.courts[0].name)+'</strong><small>تم تحديدها تلقائيًا لوجود محكمة واحدة.</small></div><span class="badge green">محددة</span></div>';
  else court=select('المحكمة المختصة','topic.courtId',d.topic.courtId,d.topic.courts.map(x=>({id:x.id,label:x.name})),true,true);
  court='<div class="court-box" id="court-result" tabindex="-1">'+court+'</div>';
 }
 return '<div class="request-hierarchy"><div class="request-main-heading"><span class="request-index">1</span><div><h3>الطلب الرئيسي</h3><p>موضوع رئيسي واحد تتبعه الطلبات الفرعية ومبالغها.</p></div></div>'+
 (d.route!=='initial'?notice('موضوع الطلب الرئيسي والطلبات الفرعية مسترجعة من القضية المرتبطة، ومعروضة للمراجعة في مسار الطعن.','info'):'')+
 (d.topic.saved?'<div class="saved-topic">'+icon('check')+'<div><small>موضوع الطلب الرئيسي المحفوظ</small><strong>'+esc(topicLabel(d))+'</strong><small>رقم الدعوى المقابلة/رقم دعوى الضمان الأصلية: '+esc(d.topic.relatedCase||'غير مدخل')+'</small></div>'+btn('تعديل الموضوع','edit-topic','secondary small','edit')+'</div>':
 '<div class="form-grid">'+select('موضوع الطلب الرئيسي','topic.main',d.topic.main,C.topics.map(x=>({id:x.id,label:x.label})),true,true,d.route!=='initial')+input('رقم الدعوى المقابلة/رقم دعوى الضمان الأصلية (إن وجدت)','topic.relatedCase',d.topic.relatedCase,{full:true,ltr:true,help:'يُدخل مرة واحدة على مستوى الطلب الرئيسي.'})+'</div><div class="topic-save-actions">'+btn('حفظ الموضوع الرئيسي','save-topic','primary','save')+'</div>')+court+
 '<div class="request-children"><div class="review-title"><h3>الطلبات الفرعية</h3><span class="badge">'+d.subtopics.length+' طلب</span></div><p class="request-rule">'+(d.route!=='initial'?'طلبات مسترجعة من القضية الأصلية؛ إضافة طلبات جديدة في الطعن تحتاج قواعد معتمدة.':D.minimumSubrequests(d)?'مطلوب طلب فرعي واحد على الأقل لنوع «'+esc(d.caseType)+'» وفق سياسة التجربة.':'الطلبات الفرعية اختيارية لهذا النوع في سياسة التجربة.')+'</p>'+
 (!d.topic.main?notice('اختر موضوع الطلب الرئيسي أولًا لإضافة طلبات فرعية.'):d.route!=='initial'?'':
 '<div class="subtopic-form"><div class="form-grid">'+select('الطلب الفرعي','subEditor.name',d.subEditor.name,t?.sub||[],true)+input('مبلغ المطالبة (د.ب)','subEditor.amount',d.subEditor.amount,{required:true,inputmode:'decimal',ltr:true,placeholder:'0.000'})+'</div><div class="actions">'+btn(d.subEditor.id?'حفظ تعديل الطلب':'إضافة طلب فرعي','add-subtopic','secondary small','plus')+btn('إلغاء الإدخال','cancel-subtopic','secondary small')+'</div></div>')+
 subtopicTable(d,d.route==='initial')+'</div></div><p class="step-footnote">كل مبلغ يخص طلبه الفرعي. الإجمالي للعرض فقط، والمحكمة والرسوم نتائج تجريبية.</p>';
}

function partyTable(d,editable=true){
 return '<div class="table-wrap" id="'+fieldId('parties')+'"><table><thead><tr><th>الطرف / الهوية</th><th>الصفة</th><th>التواصل والعنوان</th>'+(editable?'<th>الإجراء</th>':'')+'</tr></thead><tbody>'+d.parties.map(p=>'<tr><td><strong>'+esc(p.name)+'</strong><small>'+(p.identityType==='personal'?'رقم شخصي':'سجل تجاري')+' · <bdi>'+esc(p.identity)+'</bdi></small></td><td>'+esc(p.role)+'</td><td><small><bdi>'+esc(p.mobile||'—')+'</bdi></small><small>'+esc(addr(p.address))+'</small></td>'+(editable?'<td><button class="icon-button" data-action="edit-party" data-id="'+p.id+'" aria-label="تعديل '+esc(p.name)+'">'+icon('edit')+'</button><button class="icon-button" data-action="delete-party" data-id="'+p.id+'" aria-label="حذف '+esc(p.name)+'">'+icon('trash')+'</button></td>':'')+'</tr>').join('')+'</tbody></table></div>';
}
function parties(d){
 const p=d.partyEditor;
 return '<div class="review-title"><h3>'+(p.id?'تعديل بيانات الطرف':'إضافة طرف')+'</h3>'+btn('استخدام بيانات مقدم الطلب','applicant-party','secondary small','user')+'</div><div class="form-grid">'+
 select('نوع الهوية','partyEditor.identityType',p.identityType,[{id:'personal',label:'الرقم الشخصي'},{id:'company',label:'سجل تجاري'}],true)+
 input(p.identityType==='personal'?'الرقم الشخصي':'رقم السجل التجاري','partyEditor.identity',p.identity,{required:true,ltr:true})+
 (p.identityType==='personal'?select('الجنس','partyEditor.gender',p.gender,['ذكر','أنثى'],true)+input('الجنسية','partyEditor.nationality',p.nationality,{required:true,list:C.nationalities}):'')+
 select('صفة الطرف','partyEditor.role',p.role,C.routes[d.route].roles,true)+input(p.identityType==='personal'?'الاسم':'اسم الجهة / الشركة','partyEditor.name',p.name,{required:true})+
 input('رقم الهاتف النقال','partyEditor.mobile',p.mobile,{type:'tel',ltr:true})+input('البريد الإلكتروني','partyEditor.email',p.email,{type:'email',ltr:true})+'</div><hr class="divider">'+address(p.address,'partyEditor.address')+
 '<div class="actions" style="margin-top:22px">'+btn(p.id?'حفظ تعديل الطرف':'إضافة الطرف','add-party','primary','plus')+btn('إلغاء الإدخال','cancel-party','secondary')+'</div><hr class="divider"><div class="review-title"><h3>الأطراف المضافة</h3><span class="badge">'+d.parties.length+' طرف</span></div>'+
 (d.parties.length?partyTable(d):'<div class="empty" id="'+fieldId('parties')+'"><div class="empty-icon">'+icon('users')+'</div><h3>أضف أطراف الطلب</h3><p>سيظهر كل طرف هنا بعد إضافته. صفة مقدم الطلب مستقلة عن صفة الطرف.</p></div>');
}
function attachments(d){
 return notice('للتجربة: PDF أو JPG أو PNG، حتى 10 ميغابايت للملف و3 ملفات لكل فئة. هذه حدود عرض وليست سياسة الخدمة الفعلية.')+
 (d.route!=='initial'?notice('قائمة مستندات الطعن هنا مثال لتجربة الواجهة، وتحتاج اعتماد مالك الخدمة قبل الاستخدام الفعلي.','warn'):'')+
 '<div class="attachments">'+D.docsFor(d).map(doc=>{
 const files=d.files.filter(f=>f.category===doc.id);
 return '<div class="attachment-row" id="'+fieldId('files.'+doc.id)+'"><div class="attachment-top"><div class="attachment-icon">'+icon('file')+'</div><div class="attachment-name">'+esc(doc.name)+'<small>'+(doc.required?'مستند مطلوب':'مستند اختياري')+'</small></div><span class="badge '+(files.length?'green':doc.required?'rose':'')+'">'+(files.length?'مرفق':doc.required?'مطلوب':'اختياري')+'</span><input id="upload-'+doc.id+'" type="file" accept=".pdf,.png,.jpg,.jpeg" multiple data-category="'+doc.id+'">'+btn('إرفاق','upload','secondary small','upload','data-category="'+doc.id+'"')+'</div>'+
 files.map(f=>'<div class="file-row">'+icon('check')+'<span class="file-name">'+esc(f.name)+' <small>'+Math.max(1,Math.round(f.size/1024))+' كيلوبايت · مرفق محليًا</small></span><button class="icon-button" data-action="download-file" data-id="'+f.id+'" aria-label="تنزيل '+esc(f.name)+'">'+icon('download')+'</button><button class="icon-button" data-action="delete-file" data-id="'+f.id+'" aria-label="حذف '+esc(f.name)+'">'+icon('trash')+'</button></div>').join('')+'</div>';
 }).join('')+'</div><hr class="divider"><h3 class="subheading">طريقة حضور الجلسة</h3>'+radio('اختر طريقة الحضور','session',d.session,[{id:'onsite',label:'جلسة حضورية'},{id:'remote',label:'جلسة عن بعد'}],true)+'<p class="step-footnote">خيارات الحضور المعروضة تجريبية، وتتحدد فعليًا حسب المحكمة والقواعد المعتمدة.</p>';
}
function reviewSection(title,step,content){return '<section class="review-section"><div class="review-title"><h3>'+title+'</h3><button class="text-button" data-action="edit-step" data-step="'+step+'">'+icon('edit')+' تعديل</button></div>'+content+'</section>';}
function feeView(d){
 if(d.fee.status==='loading')return notice('<span class="spinner"></span> جارٍ احتساب الرسوم التجريبية…');
 if(d.fee.status!=='ready')return '<div id="'+fieldId('fees')+'">'+notice('لم يتم تأكيد الرسوم. لا يمكن الدفع أو التسجيل حتى تكتمل النتيجة. '+btn('إعادة المحاولة','calculate-fees','secondary small','refresh'),'error')+'</div>';
 const total=d.fee.items.reduce((s,i)=>s+i.fils,0);
 return (total?'<div class="table-wrap"><table><thead><tr><th>نوع الرسم</th><th>الرسوم (د.ب)</th></tr></thead><tbody>'+d.fee.items.map(i=>'<tr><td>'+i.label+'</td><td><bdi>'+D.money(i.fils)+'</bdi></td></tr>').join('')+'</tbody></table></div>':notice('لا توجد رسوم مستحقة وفق نتيجة السيناريو التجريبي.','success'))+
 '<div class="fee-total"><span>مجموع الرسوم</span><span><strong><bdi>'+D.money(total)+'</bdi></strong> <small>د.ب</small></span></div><p class="step-footnote">قيم تجريبية لعرض رحلة الخدمة، وليست تعرفة قضائية.</p>';
}
function review(d){
 const a=d.applicant,court=d.topic.courts.find(c=>c.id===d.topic.courtId)?.name;
 return '<div class="print-only"><h1>ملخص طلب تجريبي — رفع دعوى قضائية</h1></div>'+
 reviewSection('مقدم الطلب وبيانات الدعوى',0,listData([['المسار',C.routes[d.route].label],['نوع الدعوى',d.caseType],['مقدم الطلب',a.name],['الصفة',C.applicantRoles.find(r=>r.id===a.role)?.label],['الهاتف النقال',a.mobile],['البريد الإلكتروني',a.email],['العنوان',addr(a.address)],...(a.role==='agency'?[['رقم الوكالة',a.agency]]:[]),...(a.role==='government'?[['الجهة الحكومية',a.government]]:[])]))+
 (d.route!=='initial'?reviewSection('القضية والحكم محل الطعن',0,listData([['مسار الطعن',C.routes[d.route].label],['رقم القضية المرتبطة',d.reference.number],['الدعوى الأصلية',d.reference.data?.original],['المحكمة مصدرة الحكم',d.reference.data?.court],['حالة القضية',d.reference.data?.state],['الحكم محل الطعن',d.reference.data?.judgments.find(j=>j.id===d.reference.judgment)?.label],['تاريخ الحكم',dayLabel(d.reference.data?.judgments.find(j=>j.id===d.reference.judgment)?.date)]])+availabilityPanel(d)):'')+
 reviewSection('الطلب الرئيسي والطلبات الفرعية والمحكمة',1,'<div class="request-hierarchy"><div class="review-main-topic"><span class="badge">الطلب الرئيسي</span><h4>'+esc(topicLabel(d))+'</h4>'+listData([['المحكمة المختصة',court],['رقم الدعوى المقابلة/رقم دعوى الضمان الأصلية (إن وجدت)',d.topic.relatedCase]])+'</div><div class="request-children"><h4>الطلبات الفرعية التابعة <span class="count">'+d.subtopics.length+'</span></h4>'+subtopicTable(d,false)+'</div></div>')+
 reviewSection('الأطراف',2,partyTable(d,false))+
 reviewSection('المرفقات وطريقة الجلسة',3,'<div class="table-wrap"><table><thead><tr><th>المستند</th><th>اسم الملف</th></tr></thead><tbody>'+d.files.map(f=>'<tr><td>'+esc(D.docsFor(d).find(x=>x.id===f.category)?.name||f.category)+'</td><td>'+esc(f.name)+'</td></tr>').join('')+'</tbody></table></div><p class="help-text">طريقة حضور الجلسة: <strong>'+(d.session==='remote'?'جلسة عن بعد':'جلسة حضورية')+'</strong></p>')+
 '<section class="review-section"><div class="review-title"><h3>بيانات الرسوم</h3><span class="badge amber">محاكاة</span></div>'+feeView(d)+'</section>'+
 '<label class="ack-box" id="'+fieldId('ack')+'"><input type="checkbox" data-bind="ack" '+(d.ack?'checked':'')+'><span>أقر أن جميع المعلومات والمرفقات المقدمة صحيحة، وأتحمل كامل المسؤولية القانونية إن ثبت غير ذلك.<span class="req">*</span><small class="help-text">الموافقة هنا جزء من تجربة النموذج، ولا تقدم طلبًا فعليًا.</small></span></label>';
}
function wizard(d,errorList=[],busy=false){
 errors=errorList;
 const titles=['بيانات مقدم الطلب','موضوع الدعوى والمحكمة','أطراف الدعوى','المرفقات وطريقة الجلسة','راجع طلبك قبل التأكيد'];
 const subtitles=['أدخل بيانات التواصل وحدد صفتك في تقديم الطلب.','حدد موضوع الطلب الرئيسي، ثم أضف الطلبات الفرعية ومبلغ كل منها.','أضف بيانات كل طرف وصفته في الدعوى.','أرفق المستندات المطلوبة واختر طريقة حضور الجلسة.','تحقق من البيانات والمستندات والرسوم قبل إتمام الإجراء.'];
 const icons=['user','file','users','upload','check'];
 const action=D.finalAction(d.fee),finalDisabled=!d.ack||action==='unavailable'||busy||!D.appealAvailability(d).allowed;
 const content=[applicant,topic,parties,attachments,review][d.step](d);
 return breadcrumb('رفع دعوى قضائية')+'<div class="page-head"><div><p class="eyebrow">'+C.routes[d.route].label+'</p><h1>رفع دعوى قضائية</h1><p>أكمل بيانات طلبك خطوة بخطوة. يمكنك الحفظ والعودة لاحقًا.</p></div><div class="actions">'+btn('حفظ المسودة','save','secondary','save',busy?'disabled':'')+btn('حفظ والخروج','save-exit','secondary','',busy?'disabled':'')+'</div></div><div class="wizard-layout"><aside class="wizard-side"><div class="panel"><ol class="step-list">'+C.stepLabels.map((l,i)=>'<li><button class="step-link '+(i===d.step?'active':i<d.step?'done':'')+'" data-action="step" data-step="'+i+'" '+(i>d.maxStep?'disabled':'')+' '+(i===d.step?'aria-current="step"':'')+'><span class="step-number">'+(i<d.step?icon('check'):i+1)+'</span><span><strong>'+l+'</strong><small>'+(i===d.step?'الخطوة الحالية':i<d.step?'يمكنك العودة للتعديل':'')+'</small></span></button></li>').join('')+'</ol><div class="draft-info">رقم المسودة<strong class="ltr">'+esc(d.id)+'</strong><span id="last-saved">'+date(d.updatedAt)+'</span></div></div><div class="side-help">'+icon('shield')+'<strong>مسودتك تحتفظ بتقدمك</strong>البيانات والملفات تبقى في هذا المتصفح. لا يتم إرسالها إلى وزارة العدل.</div></aside><div><section class="panel form-card"><div class="section-heading"><div class="number-box">'+icon(icons[d.step])+'</div><div><h2 id="step-heading" tabindex="-1">'+titles[d.step]+'</h2><p>'+subtitles[d.step]+'</p></div><span class="required-note"><span class="req">*</span> حقول مطلوبة</span></div>'+errorSummary(errorList)+content+
 '<div class="bottom-actions">'+btn('رجوع','back','secondary','right',busy?'disabled':'')+btn('حفظ المسودة','save','secondary','save',busy?'disabled':'')+'<span class="spacer"></span>'+(d.step===4?btn(action==='pay'?'دفع':action==='register'?'تسجيل':'بانتظار الرسوم','final','primary',action==='pay'?'card':'check',finalDisabled?'disabled':''):btn('مواصلة','next','primary','left',busy?'disabled':''))+'</div><div class="save-status">آخر حفظ: '+date(d.updatedAt)+'</div></section></div></div>';
}
function modal(title,body,actions=''){return '<div class="modal-head"><h2 id="modal-title">'+title+'</h2><button class="icon-button" data-action="close-modal" aria-label="إغلاق">'+icon('close')+'</button></div><div class="modal-body">'+body+'</div>'+(actions?'<div class="modal-actions">'+actions+'</div>':'');}
function routeModal(){return modal('ما نوع الطلب الذي ترغب بتقديمه؟','<p>اختر المسار المناسب للبدء بإعداد طلبك.</p><div class="route-options">'+Object.entries(C.routes).map(([id,r])=>'<button class="route-card" data-action="choose-route" data-route="'+id+'"><span class="route-icon">'+icon(r.icon)+'</span><span><strong>'+r.label+'</strong><small>'+r.description+'</small></span><span class="arrow">'+icon('chevron')+'</span></button>').join('')+'</div>');}
function demoModal(d,defaults={}){
 const demo={asOfDate:C.demoRules.asOfDate,court:'single',fee:'payable',reference:'valid',payment:'success',...defaults,...d?.demo};
 return modal('إعدادات التجربة','<p>هذه الخيارات مخصصة لاستعراض الحالات المختلفة. لا تمثل قواعد أو نتائج قضائية فعلية.</p><div class="demo-grid">'+
 input('تاريخ اليوم في المحاكاة','demo.asOfDate',demo.asOfDate,{type:'date',required:true,full:true,help:'غيّر التاريخ لتجربة اقتراب المدة أو انتهائها، دون تغيير الموعد النهائي للحكم.'})+
 select('نتيجة المحكمة','demo.court',demo.court,[{id:'single',label:'محكمة واحدة'},{id:'multiple',label:'عدة محاكم'},{id:'empty',label:'لا توجد محكمة'},{id:'error',label:'تعذر الاتصال'}])+
 select('نتيجة الرسوم','demo.fee',demo.fee,[{id:'payable',label:'رسوم مستحقة (78.500 د.ب)'},{id:'zero',label:'بدون رسوم'},{id:'error',label:'تعذر احتساب الرسوم'}])+
 select('التحقق من مرجع الطعن','demo.reference',demo.reference,[{id:'valid',label:'مرجع متاح ومؤهل تجريبيًا'},{id:'missing',label:'السجل غير متاح'},{id:'ineligible',label:'غير مؤهل للطعن'},{id:'error',label:'تعطل خدمة التحقق'}])+
 select('نتيجة الدفع والتسجيل','demo.payment',demo.payment,[{id:'success',label:'دفع وتسجيل ناجحان'},{id:'failure',label:'فشل الدفع'},{id:'pending',label:'الدفع معلق'},{id:'registration',label:'نجاح الدفع وتعذر التسجيل'}])+'</div><div class="demo-rules"><strong>افتراضات النموذج، تحتاج اعتمادًا قبل التنفيذ الفعلي:</strong><ul><li>الملف حتى 10 ميغابايت، و3 ملفات لكل فئة؛ PDF / JPG / PNG.</li><li>المبالغ غير سالبة، وحتى 3 منازل عشرية؛ طلب فرعي مطلوب للدعاوى المدنية والتجارية والصغيرة والفواتير في سياسة العرض؛ اختياري لبقية الأنواع.</li><li>طرف واحد على الأقل لكل صفة في هذا السيناريو.</li><li>الوكالة مطلوبة للدور الخاص بها؛ المبنى والطريق والمجمع مطلوبة للعنوان المحلي.</li><li>الجنسيات والجهات وأنواع الدعاوى أمثلة جزئية. مستندات الطعون أمثلة مقترحة.</li></ul></div>',(d&&d.status!=='registered'&&!['pending','paid'].includes(d.payment.status)?btn('ملء الخطوة ببيانات تجريبية','fill-demo','secondary','plus'):'')+btn('تطبيق الإعدادات','apply-demo','primary'));
}
function guideModal(){return modal('دليل الخدمة','<p>نموذج تفاعلي لرحلة رفع الدعوى. جميع الإجراءات محاكاة؛ الحفظ على هذا المتصفح فقط.</p><details open><summary>كيف أبدأ؟</summary><p>اختر «رفع دعوى جديدة» ثم المسار. أكمل الخطوات الخمس، ويمكنك حفظ طلبك في أي وقت.</p></details><details><summary>كيف أجرب الاستئناف والتمييز؟</summary><p>للاستئناف استخدم CASE-2026-1001. للتمييز استخدم APP-2026-2001. اضغط التحقق ثم اختر الحكم التجريبي، أو ابدأ مباشرة من إشعارات التقديم والقضايا المرتبطة. تظهر المدة بحسب تاريخ المحاكاة الذي يمكن تغييره من إعدادات التجربة.</p></details><details><summary>متى تظهر المحكمة؟</summary><p>بعد حفظ الموضوع الرئيسي. تظهر المحكمة مباشرة إذا كانت واحدة، وتختار من القائمة إذا تعددت. يمكنك استعراض الحالات من إعدادات التجربة.</p></details><details><summary>أين تحفظ البيانات والمستندات؟</summary><p>في مساحة هذا المتصفح على جهازك. لا تنتقل إلى جهاز آخر أو إلى GitHub. مسح بيانات الموقع يحذف المسودات. استخدم مستندات تجريبية فقط.</p></details><details><summary>هل الدفع أو التسجيل حقيقي؟</summary><p>لا. زر الدفع يفتح محاكاة دون بيانات بطاقة أو خصم مالي. الأرقام والإيصالات تجريبية.</p></details><details><summary>كيف أجرب بسرعة؟</summary><p>من «إعدادات التجربة»، استخدم «ملء الخطوة ببيانات تجريبية» لتجهيز بيانات افتراضية للخطوة الحالية.</p></details>',btn('فهمت','close-modal','primary'));}
function result(d,pending=false){
 const paid=d.payment.status==='paid',registered=d.status==='registered';
 const title=registered?'اكتملت التجربة بنجاح':paid?'تم الدفع التجريبي، والتسجيل لم يكتمل':'عملية الدفع التجريبية معلقة';
 return breadcrumb('حالة الطلب')+'<div class="success-page panel"><div class="success-heading"><div class="success-symbol">'+icon(registered?'check':paid?'card':'clock')+'</div><p class="eyebrow">خدمة رفع دعوى قضائية · محاكاة</p><h1>'+title+'</h1><p>'+(registered?'تم إنشاء سجل تجريبي على هذا المتصفح. لم تُسجَّل دعوى فعلية.':paid?'لن يُطلب منك الدفع مجددًا. أعد محاولة التسجيل من العملية نفسها.':'تحقق من حالة العملية القائمة قبل محاولة الدفع مجددًا.')+'</p></div><div class="success-content"><div class="receipt-reference"><small>'+(registered?'رقم القيد التجريبي':'مرجع عملية الدفع التجريبية')+'</small><strong>'+esc(registered?d.registration.number:d.payment.id)+'</strong></div>'+listData([['مسار الطلب',C.routes[d.route].label],['الموضوع الرئيسي',topicLabel(d)],['المحكمة',d.topic.courts.find(c=>c.id===d.topic.courtId)?.name],['حالة الدفع',d.payment.status==='paid'?'مدفوع تجريبيًا':d.payment.status==='pending'?'معلق':'لا توجد رسوم'],['رقم المسودة',d.id],['الرسوم (د.ب)',D.money(d.fee.items.reduce((s,x)=>s+x.fils,0))]])+'<hr class="divider"><div class="actions">'+(registered?btn('تنزيل الإيصال التجريبي','receipt','secondary','download')+btn('طباعة','print','secondary','print'):paid?btn('إعادة محاولة التسجيل','retry-registration','primary','refresh'):btn('التحقق من حالة الدفع','check-payment','primary','refresh'))+btn('العودة إلى طلباتي','home','secondary','right')+'</div><div class="service-note">هذه النتيجة للتجربة فقط، ولا تثبت تقديم دعوى أو سداد رسوم فعلية.</div></div></div>';
}
root.LawsuitUI={icon,btn,input,select,notice,addr,date,listData,errorSummary,dashboard,casePage,draftRows,wizard,modal,routeModal,demoModal,guideModal,result,fieldId,topicLabel};
})(window);

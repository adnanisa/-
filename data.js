/* All catalogues and service responses below are illustrative, not judicial rules. */
(function (root) {
 'use strict';
 const data = {
  routes: {
   initial: {label:'دعوى ابتدائية',short:'ابتدائي',description:'تقديم دعوى جديدة أمام محاكم الدرجة الأولى.',roles:['المدعي','المدعى عليه'],icon:'file'},
   appeal: {label:'استئناف',short:'استئناف',description:'الطعن على حكم في دعوى محسومة.',roles:['المستأنف','المستأنف ضده'],icon:'layers'},
   cassation: {label:'تمييز',short:'تمييز',description:'تقديم طعن بالتمييز على حكم استئنافي.',roles:['الطاعن','المطعون ضده'],icon:'scale'}
  },
  caseTypes: ['مدنية','مدنية مستعجلة','دعاوى المطالبات الصغيرة - مدني','دعاوى الفواتير - مدني','تجارية','عمالية - من العامل','شرعية'],
  // Illustrative mapping only; Courts Administration must approve the production catalogue.
  challengeMappings:[
   {initialType:'مدنية',appealType:'استئناف مدني',cassationTypes:['تمييز مدني']},
   {initialType:'تجارية',appealType:'استئناف تجاري',cassationTypes:['تمييز تجاري']}
  ],
  applicantRoles: [{id:'self',label:'مقدم الطلب لشخصه'},{id:'agency',label:'وكيل بوكالة'},{id:'lawfirm',label:'ممثل قانوني عن مكتب محاماة'},{id:'government',label:'ممثل قانوني لجهة حكومية'}],
  governments:['أمانة العاصمة','وزارة العدل والشؤون الإسلامية والأوقاف','إدارة الإصلاح والتأهيل','إدارة الاستملاك والتعويض'],
  identityTypes:[{id:'personal',label:'الرقم الشخصي'},{id:'company',label:'سجل تجاري'},{id:'government',label:'هيئة حكومية'}],
  governmentEntities:[{id:'GOV-01',label:'أمانة العاصمة'},{id:'GOV-02',label:'وزارة العدل والشؤون الإسلامية والأوقاف'},{id:'GOV-03',label:'إدارة الإصلاح والتأهيل'},{id:'GOV-04',label:'إدارة الاستملاك والتعويض'}],
  identityRecords:{
   personal:[{identity:'DEMO-ID-001',name:'طرف تجريبي أول',gender:'ذكر',nationality:'بحريني'},{identity:'DEMO-ID-002',name:'طرف تجريبي ثانٍ',gender:'أنثى',nationality:'بحريني'},{identity:'DEMO-USER-01',name:'مستخدم تجريبي',gender:'ذكر',nationality:'بحريني'}],
   company:[{identity:'DEMO-CR-001',name:'شركة المثال التجريبية'},{identity:'DEMO-CR-002',name:'مؤسسة العرض التجريبية'}]
  },
  nationalities:['بحريني','سعودي','إماراتي','كويتي','عماني','قطري','مصري','أردني','هندي','باكستاني','أخرى'],
  topics: [
   {id:'civil',label:'مطالبات أو تعويضات مدنية',sub:['مطالبة مالية','تعويض عن ضرر مادي','تعويض عن ضرر معنوي']},
   {id:'contract',label:'مطالبات عقود المقاولات',sub:['مستحقات عقد','تعويض عن تأخير','تكلفة إصلاح']},
   {id:'interference',label:'منع التعرض',sub:['طلب منع التعرض','تعويض مرتبط بالطلب']},
   {id:'property',label:'وضع اليد على العقار',sub:['طلب متعلق بالعقار','تعويض مرتبط بالعقار']},
   {id:'foreign',label:'وضع صيغة تنفيذية على حكم من دولة أجنبية',sub:['مبلغ محكوم به','مصروفات']},
   {id:'gcc',label:'وضع صيغة تنفيذية على حكم من مجلس التعاون',sub:['مبلغ محكوم به','مصروفات']}
  ],
  // Fixed sample dates use the visible simulation clock, never an asserted legal time limit.
  cases:[
   {route:'appeal',number:'01/2026/01001/1',type:'مدنية',originalType:'مدنية',jurisdiction:'مدني',court:'الصغرى المدنية',state:'محسومة — تجريبية',original:'01/2026/01001/1',topic:'civil',
    requests:[{name:'مطالبة مالية',amount:'1200.000'},{name:'تعويض عن ضرر مادي',amount:'250.000'}],
    judgments:[{id:'J-01',label:'الحكم التجريبي الأول · 01/10/2026',date:'2026-10-01',deadline:'2026-11-20',eligible:true},
     {id:'J-02',label:'الحكم التجريبي الثاني · 15/10/2026',date:'2026-10-15',deadline:'2026-11-14',eligible:true}]},
   {route:'cassation',number:'02/2026/02001/1',type:'استئناف مدني',originalType:'مدنية',jurisdiction:'مدني',court:'محكمة الاستئناف العليا المدنية',state:'محسومة — تجريبية',original:'01/2026/01001/1',topic:'civil',
    requests:[{name:'مطالبة مالية',amount:'1200.000'}],
    judgments:[{id:'J-01',label:'الحكم الاستئنافي التجريبي الأول · 01/10/2026',date:'2026-10-01',deadline:'2026-11-18',eligible:true},
     {id:'J-02',label:'الحكم الاستئنافي التجريبي الثاني · 15/10/2026',date:'2026-10-15',deadline:'2026-11-10',eligible:true},
     {id:'J-03',label:'حكم غير متاح للتمييز — مثال تجريبي',date:'2026-10-20',deadline:'2026-11-20',eligible:false,reason:'حالة الحكم المحدد لا تتيح التمييز في هذا السيناريو.'},
     {id:'J-04',label:'حكم بانتظار بيانات المدة — مثال تجريبي',date:'2026-10-21',deadline:null,eligible:true}]}
  ],
  attachments:[
   {id:'identity',name:'نسخة من بطاقة الهوية أو مستخرج السجل التجاري للمدعي',required:true},
   {id:'statement',name:'بيان موضوع الدعوى ووقائعها وطلبات المدعي',required:true},
   {id:'agency',name:'نسخة من التوكيل الصادر للمدعي',required:false},
   {id:'defendant',name:'نسخة من بطاقة الهوية أو مستخرج السجل التجاري للمدعى عليه',required:false},
   {id:'claim',name:'سند المطالبة',required:false},
   {id:'other',name:'مستندات أخرى',required:false},
   {id:'translation',name:'الترجمة المعتمدة للمستندات المقدمة',required:false},
   {id:'expert',name:'تقارير الخبراء - إن وجدت',required:false},
   {id:'criminal',name:'الحكم الجنائي مع ما يفيد إعلانه وعدم استئنافه',required:false}
  ],
  requestPolicy:{requiredCaseTypes:['مدنية','تجارية','دعاوى المطالبات الصغيرة - مدني','دعاوى الفواتير - مدني']},
  demoRules:{asOfDate:'2026-11-12',maxFileBytes:10*1024*1024,maxFilesPerCategory:3,extensions:['pdf','png','jpg','jpeg'],amountDecimals:3},
  stepLabels:['مقدم الطلب','موضوع الدعوى','الأطراف','المرفقات والجلسة','المراجعة والتأكيد']
 };
 if(typeof module!=='undefined' && module.exports) module.exports=data;
 else root.LawsuitData=data;
})(typeof window==='undefined'?globalThis:window);

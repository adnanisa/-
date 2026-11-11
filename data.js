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
  applicantRoles: [{id:'self',label:'مقدم الطلب لشخصه'},{id:'agency',label:'موكل بوكالة'},{id:'lawfirm',label:'ممثل قانوني عن مكتب محاماة'},{id:'government',label:'ممثل قانوني لجهة حكومية'}],
  governments:['أمانة العاصمة','وزارة العدل والشؤون الإسلامية والأوقاف','إدارة الإصلاح والتأهيل','إدارة الاستملاك والتعويض'],
  nationalities:['بحريني','سعودي','إماراتي','كويتي','عماني','قطري','مصري','أردني','هندي','باكستاني','أخرى'],
  topics: [
   {id:'civil',label:'مطالبات أو تعويضات مدنية',sub:['مطالبة مالية','تعويض عن ضرر مادي','تعويض عن ضرر معنوي']},
   {id:'contract',label:'مطالبات عقود المقاولات',sub:['مستحقات عقد','تعويض عن تأخير','تكلفة إصلاح']},
   {id:'interference',label:'منع التعرض',sub:['طلب منع التعرض','تعويض مرتبط بالطلب']},
   {id:'property',label:'وضع اليد على العقار',sub:['طلب متعلق بالعقار','تعويض مرتبط بالعقار']},
   {id:'foreign',label:'وضع صيغة تنفيذية على حكم من دولة أجنبية',sub:['مبلغ محكوم به','مصروفات']},
   {id:'gcc',label:'وضع صيغة تنفيذية على حكم من مجلس التعاون',sub:['مبلغ محكوم به','مصروفات']}
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
  demoRules:{maxFileBytes:10*1024*1024,maxFilesPerCategory:3,extensions:['pdf','png','jpg','jpeg'],amountDecimals:3},
  stepLabels:['مقدم الطلب','موضوع الدعوى','الأطراف','المرفقات والجلسة','المراجعة والتأكيد']
 };
 if(typeof module!=='undefined' && module.exports) module.exports=data;
 else root.LawsuitData=data;
})(typeof window==='undefined'?globalThis:window);

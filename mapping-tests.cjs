'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('./logic.js');
const C=require('./data.js');

test('appeal types are limited to the selected initial case and require an explicit choice',()=>{
 const d=D.createLinkedDraft('appeal','01/2026/01001/1','J-01');
 assert.equal(d.caseType,'');
 assert.deepEqual(D.caseTypeOptions(d),['استئناف مدني']);
 assert.equal(d.reference.data.original,d.reference.number);
 assert.equal(d.reference.data.jurisdiction,'مدني');
 assert.equal(d.topic.main,'civil');
 assert.equal(d.subtopics[0].amount,'1200.000');
 d.caseType='استئناف تجاري';
 assert.ok(D.validateStep(d,0).some(e=>e.field==='caseType'));
 d.caseType='استئناف مدني';
 assert.ok(!D.validateStep(d,0).some(e=>e.field==='caseType'));
 assert.deepEqual(D.caseTypeOptions(D.createDraft()),C.caseTypes);
});

test('cassation requires the exact initial to appeal to cassation mapping',()=>{
 const d=D.createLinkedDraft('cassation','02/2026/02001/1','J-01');
 assert.equal(d.reference.number,'02/2026/02001/1');
 assert.equal(d.reference.data.original,'01/2026/01001/1');
 assert.equal(d.reference.data.originalType,'مدنية');
 assert.equal(d.reference.data.type,'استئناف مدني');
 assert.deepEqual(D.caseTypeOptions(d),['تمييز مدني']);
 d.caseType='تمييز تجاري';
 assert.ok(D.validateFinal(d).some(e=>e.field==='caseType'));
 d.reference.data.originalType='تجارية';
 assert.deepEqual(D.caseTypeOptions(d),[]);
 assert.equal(D.challengeMapping(d).status,'missing');
});

test('unknown, unavailable and incomplete mappings never expose a general list',()=>{
 const d=D.createDraft('appeal');
 assert.deepEqual(D.caseTypeOptions(d),[]);
 Object.assign(d,D.createLinkedDraft('appeal','01/2026/01001/1','J-01'));
 d.reference.data.type='نوع غير مهيأ';
 assert.deepEqual(D.caseTypeOptions(d),[]);
 assert.match(D.challengeMapping(d).message,/إدارة المحاكم/);
 d.reference.data.type='مدنية';d.demo.mapping='missing';
 assert.deepEqual(D.caseTypeOptions(d),[]);
 assert.ok(D.validateFinal(d).some(e=>e.field==='caseType'));
 d.demo.mapping='configured';delete d.reference.data.originalType;
 assert.equal(D.challengeMapping(d).status,'incomplete');
 assert.deepEqual(D.caseTypeOptions(d),[]);
});

test('changing a reference clears stale types and retrieved data but preserves user entries',()=>{
 const d=D.createLinkedDraft('appeal','01/2026/01001/1','J-01');
 d.caseType='استئناف مدني';d.applicant.mobile='12345678';d.topic.relatedCase='separate-link';
 d.parties=[{id:'p1'}];d.files=[{id:'f1'}];d.topic.saved=true;d.topic.courtId='old';
 D.clearReference(d);
 assert.equal(d.caseType,'');assert.equal(d.reference.data,null);assert.equal(d.reference.judgment,'');
 assert.equal(d.topic.main,'');assert.deepEqual(d.subtopics,[]);assert.equal(d.topic.courtId,'');
 assert.equal(d.applicant.mobile,'12345678');assert.equal(d.topic.relatedCase,'separate-link');
 assert.deepEqual(d.parties,[{id:'p1'}]);assert.deepEqual(d.files,[{id:'f1'}]);
});

test('a previously selected type is rechecked against current mappings at final submission',()=>{
 const d=D.createLinkedDraft('appeal','01/2026/01001/1','J-01');d.caseType='استئناف مدني';
 assert.ok(!D.validateFinal(d).some(e=>e.field==='caseType'));
 d.demo.mapping='missing';
 assert.ok(D.validateFinal(d).some(e=>e.field==='caseType'&&e.message.includes('إدارة المحاكم')));
});


test('mapping supports multiple allowed types and does not mix unrelated chains',t=>{
 const row={initialType:'مدنية',appealType:'استئناف مدني آخر تجريبي',cassationTypes:['تمييز مدني آخر تجريبي','تمييز مدني إضافي تجريبي']};
 C.challengeMappings.push(row);t.after(()=>C.challengeMappings.pop());
 const appeal=D.createLinkedDraft('appeal','01/2026/01001/1','J-01');
 assert.deepEqual(D.caseTypeOptions(appeal),['استئناف مدني','استئناف مدني آخر تجريبي']);
 const cassation=D.createLinkedDraft('cassation','02/2026/02001/1','J-01');
 assert.deepEqual(D.caseTypeOptions(cassation),['تمييز مدني']);
 cassation.reference.data.type=row.appealType;
 assert.deepEqual(D.caseTypeOptions(cassation),row.cassationTypes);
 cassation.reference.data.originalType='تجارية';
 assert.deepEqual(D.caseTypeOptions(cassation),[]);
});


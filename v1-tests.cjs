'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('./logic.js'),C=require('./data.js');
test('case numbers use the requested format without changing legacy storage keys',()=>{
 const d=D.createDraft();assert.match(D.caseNumber(d),/^3\d{9}$/);
 const old={id:'DRAFT-MWJ3L42C-4RDG',route:'initial'};
 assert.equal(D.caseNumber(old),D.caseNumber({...old}));
 assert.match(D.caseNumber(old),/^3\d{9}$/);assert.equal(old.id,'DRAFT-MWJ3L42C-4RDG');
});
test('notifications combine search, type and remaining-time filters and sort nearest first',()=>{
 const demo={asOfDate:'2026-11-12'},all=D.filingNotifications(demo);
 assert.deepEqual(all.filter(x=>x.availability.allowed).map(x=>x.availability.remainingDays),[2,6,8]);
 assert.equal(D.filingNotifications(demo,{route:'appeal',remaining:'3'}).length,1);
 assert.ok(D.filingNotifications(demo,{remaining:'expired'}).every(x=>x.availability.status==='expired'));
 assert.equal(D.filingNotifications(demo,{query:'NO-MATCH'}).length,0);
 assert.equal(D.filingNotifications(demo,{query:C.cases[0].number}).length,2);
 assert.equal(D.filingNotifications(demo,{query:'٠١/٢٠٢٦/٠١٠٠١/١'}).length,2);
 assert.equal(D.filingNotifications(demo,{query:'01001'}).length,2);
 for(const query of [C.cases[0].court,C.cases[0].type,C.cases[0].judgments[0].label,C.routes[C.cases[0].route].label])assert.equal(D.filingNotifications(demo,{query}).length,0);
 assert.equal(D.filingNotifications(demo,{query:C.cases[0].number,route:'appeal',remaining:'3'}).length,1);
});
test('identity lookup separates sources and reports missing records and service failure',()=>{
 assert.equal(D.lookupPartyIdentity('personal','DEMO-ID-001').data.name,'طرف تجريبي أول');
 assert.equal(D.lookupPartyIdentity('company','DEMO-CR-001').data.name,'شركة المثال التجريبية');
 assert.equal(D.lookupPartyIdentity('company','DEMO-ID-001').status,'missing');
 assert.equal(D.lookupPartyIdentity('personal','UNKNOWN').status,'missing');
 assert.equal(D.lookupPartyIdentity('personal','DEMO-ID-001','error').status,'error');
});
test('government parties require an available entity and identity types are validated',()=>{
 const d=D.createDraft(),p={...D.party(),identityType:'government',identity:'BAD',name:'Unknown',role:'المدعي',address:{...D.address(),building:'1',road:'2',block:'3'}};
 assert.ok(D.validateParty(p,d).some(e=>e.field==='partyEditor.identity'));
 const entity=C.governmentEntities[0];p.identity=entity.id;p.name=entity.label;assert.deepEqual(D.validateParty(p,d),[]);
 p.identityType='bad';assert.ok(D.validateParty(p,d).some(e=>e.field==='partyEditor.identityType'));
});

test('legacy filing links resolve to canonical case numbers and registration uses the display number',()=>{
 const d=D.createLinkedDraft('appeal','CASE-2026-1001','J-01');assert.equal(d.reference.number,'01/2026/01001/1');
 assert.equal(D.lookupReference('cassation','APP-2026-2001','valid').data.number,'02/2026/02001/1');
 D.completeRegistration(d);assert.equal(d.registration.number,D.caseNumber(d));
});

test('existing drafts migrate to stable ten-digit numbers while case registration keeps its format',()=>{
 const old={id:'DRAFT-MWJ3L42C-4RDG',status:'draft',route:'appeal',caseNumber:'02/2026/12345/6',updatedAt:'2026-11-16'};
 const number=D.caseNumber(old);assert.match(number,/^3\d{9}$/);
 assert.equal(D.caseNumber({...old,updatedAt:'2027-01-01',route:'initial'}),number);
 assert.equal(D.caseNumber({...old,caseNumber:'3000221551'}),'3000221551');
 assert.equal(D.caseNumber({...old,status:'registered',registration:{number:'02/2026/12345/6'}}),'02/2026/12345/6');
 const fresh=D.createDraft();const draftNumber=D.caseNumber(fresh);D.completeRegistration(fresh);
 assert.match(fresh.registration.number,/^\d{2}\/\d{4}\/\d{5}\/\d$/);assert.notEqual(fresh.registration.number,draftNumber);
});

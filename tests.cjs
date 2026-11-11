'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('./logic.js');

test('a new draft has separate case links and starts without a court', () => {
 const d = D.createDraft('initial');
 assert.equal(d.route, 'initial');
 assert.equal(d.topic.saved, false);
 assert.equal(d.topic.courtId, '');
 assert.equal(d.reference.number, '');
 assert.equal(d.topic.relatedCase, '');
});
test('court result never selects arbitrarily from multiple options', () => {
 assert.deepEqual(D.resolveCourts([{id:'one'}]), {status:'ready',courtId:'one'});
 assert.deepEqual(D.resolveCourts([{id:'a'},{id:'b'}]), {status:'choose',courtId:''});
 assert.deepEqual(D.resolveCourts([]), {status:'empty',courtId:''});
});
test('fees unavailable are not treated as a zero fee registration', () => {
 assert.equal(D.finalAction({status:'error',items:[]}), 'unavailable');
 assert.equal(D.finalAction({status:'loading',items:[]}), 'unavailable');
 assert.equal(D.finalAction({status:'ready',items:[]}), 'register');
 assert.equal(D.finalAction({status:'ready',items:[{fils:1000}]}), 'pay');
});
test('claim amounts use integer fils and reject invalid precision and negatives', () => {
 assert.equal(D.toFils('١٢.٣٥٠'), 12350);
 assert.equal(D.toFils('0'), 0);
 assert.equal(D.toFils('1.0001'), null);
 assert.equal(D.toFils('-1'), null);
 assert.equal(D.toFils(''), null);
 assert.equal(D.toFils('12abc'), null);
});
test('changing material information invalidates court, fees and acknowledgement', () => {
 const d=D.createDraft('initial');
 d.topic.saved=true; d.topic.courtId='one'; d.topic.courts=[{id:'one'}]; d.ack=true;
 d.fee={status:'ready',items:[{fils:1000}]};
 D.invalidate(d,'court');
 assert.equal(d.topic.saved,false); assert.equal(d.topic.courtId,'');
 assert.equal(d.fee.status,'idle'); assert.equal(d.ack,false);
});
test('appeal and cassation references require distinct demo identifiers', () => {
 assert.equal(D.lookupReference('appeal','CASE-2026-1001','valid').status,'verified');
 assert.equal(D.lookupReference('cassation','CASE-2026-1001','valid').status,'invalid');
 assert.equal(D.lookupReference('cassation','APP-2026-2001','valid').status,'verified');
 assert.equal(D.lookupReference('appeal','CASE-2026-1001','ineligible').status,'ineligible');
});
test('final validation cannot bypass earlier steps or reference verification', () => {
 const d=D.createDraft('appeal');
 const errors=D.validateFinal(d);
 assert.ok(errors.some(e=>e.field==='reference.number'));
 assert.ok(errors.some(e=>e.field==='applicant.email'));
 assert.ok(errors.some(e=>e.field==='topic.courtId'));
 assert.ok(errors.some(e=>e.field==='parties'));
 assert.ok(errors.some(e=>e.field==='session'));
 assert.ok(errors.some(e=>e.field==='ack'));
});
test('pending payments cannot be started again and confirmed payment registers once', () => {
 const d=D.createDraft('initial');
 d.payment={status:'pending',id:'SIM-PAY-1'};
 assert.equal(D.canStartPayment(d),false);
 d.payment.status='failed'; assert.equal(D.canStartPayment(d),true);
 const r=D.completeRegistration(d);
 assert.equal(r.status,'registered');
 const id=r.registration.number;
 D.completeRegistration(d);
 assert.equal(d.registration.number,id);
});
test('HTML-sensitive user text is escaped', () => {
 assert.equal(D.escape('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
});


test('catalogue values are checked instead of accepting arbitrary text', () => {
 const d=D.createDraft('initial');d.caseType='arbitrary';d.applicant.role='government';d.applicant.government='unlisted';
 const errors=D.validateStep(d,0);
 assert.ok(errors.some(e=>e.field==='caseType'));
 assert.ok(errors.some(e=>e.field==='applicant.government'));
});
test('old subtopics need review after switching the main topic', () => {
 const d=D.createDraft('initial');d.topic.main='contract';d.topic.saved=true;
 d.topic.courtId='one';d.topic.courts=[{id:'one'}];
 d.subtopics=[{id:'s',name:'تعويض عن ضرر مادي',amount:'10'}];
 assert.ok(D.validateStep(d,1).some(e=>e.field==='subtopics'));
});
test('appeal topic is tied to its retrieved reference in this demo policy', () => {
 const d=D.createDraft('appeal');d.reference.status='verified';d.reference.data={topic:'civil'};
 d.topic.main='contract';d.topic.saved=true;d.topic.courtId='one';d.topic.courts=[{id:'one'}];
 assert.ok(D.validateStep(d,1).some(e=>e.field==='topic.main'));
});

/* Browser-local storage only. Blobs and the draft are committed in one transaction. */
(function(root){
 'use strict';
 let dbPromise;
 function database(){
  if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
   if(!root.indexedDB){reject(new Error('هذا المتصفح لا يدعم الحفظ المحلي. افتح النموذج في متصفح حديث.'));return;}
   const r=indexedDB.open('bahrain-lawsuit-prototype-v1',1);
   r.onupgradeneeded=()=>r.result.createObjectStore('drafts',{keyPath:'id'});
   r.onsuccess=()=>resolve(r.result);
   r.onerror=()=>{dbPromise=null;reject(new Error('تعذر فتح مساحة الحفظ المحلية. تحقق من إعدادات المتصفح.'));};
   r.onblocked=()=>reject(new Error('أغلق النسخ الأخرى من النموذج ثم أعد المحاولة.'));
  });
  return dbPromise;
 }
 async function list(){
  const db=await database();return new Promise((resolve,reject)=>{
   const tx=db.transaction('drafts','readonly');const r=tx.objectStore('drafts').getAll();
   r.onsuccess=()=>resolve(r.result.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))));
   r.onerror=()=>reject(r.error);
  });
 }
 async function get(id){
  const db=await database();return new Promise((resolve,reject)=>{
   const r=db.transaction('drafts','readonly').objectStore('drafts').get(id);
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
 }
 async function save(draft){
  const snapshot=structuredClone(draft);const db=await database();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts');let conflict=false;
   const r=store.get(snapshot.id);
   r.onsuccess=()=>{
    if(r.result&&r.result.revision!==snapshot.revision){conflict=true;tx.abort();return;}
    snapshot.updatedAt=new Date().toISOString();snapshot.revision+=1;store.put(snapshot);
   };
   tx.oncomplete=()=>resolve({updatedAt:snapshot.updatedAt,revision:snapshot.revision});
   tx.onabort=()=>reject(new Error(conflict?'تغيرت هذه المسودة في نافذة أخرى. احفظ نسخة جديدة أو أعد فتح آخر نسخة محفوظة.':'لم يتم الحفظ. قد تكون مساحة المتصفح ممتلئة؛ احتفظ بهذه الصفحة مفتوحة وأعد المحاولة.'));
   tx.onerror=()=>{};
  });
 }
 async function remove(id){
  const db=await database();return new Promise((resolve,reject)=>{
   const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').delete(id);
   tx.oncomplete=()=>resolve();tx.onabort=()=>reject(new Error('تعذر حذف المسودة.'));
  });
 }
 root.LawsuitStore={list,get,save,remove};
})(window);

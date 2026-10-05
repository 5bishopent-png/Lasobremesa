import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/availability.js';
function response(){return {code:0,data:null,setHeader(){},status(n){this.code=n;return this},json(d){this.data=d;return this}}}
test('Chefy checks calendar conflicts without exposing event details and fails closed',async()=>{
 const keys=['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN','GOOGLE_CALENDAR_ID'];const prior=Object.fromEntries(keys.map(k=>[k,process.env[k]]));const originalFetch=globalThis.fetch;
 try{
  for(const k of keys)process.env[k]='test';
  const date=new Date(Date.now()+3*86400000).toISOString().slice(0,10);const request={method:'POST',headers:{origin:'https://www.lasobremesa.vip','x-forwarded-for':'test-calendar'},body:{date,time:'12:00',timezone:'America/New_York'}};
  for(const busy of [[],[{start:'private',end:'private'}]]){
   globalThis.fetch=async url=>String(url).includes('oauth2')?{ok:true,json:async()=>({access_token:'test'})}:{ok:true,json:async()=>({calendars:{test:{busy}}})};
   const res=response();await handler(request,res);assert.equal(res.code,200);assert.equal(res.data.available,busy.length===0);assert.equal(res.data.confirmationRequired,true);assert.equal(JSON.stringify(res.data).includes('private'),false);
  }
  globalThis.fetch=async()=>{throw Error('private provider error')};const failed=response();await handler(request,failed);assert.equal(failed.code,503);assert.equal(JSON.stringify(failed.data).includes('private provider'),false);
  delete process.env.GOOGLE_REFRESH_TOKEN;const missing=response();await handler(request,missing);assert.equal(missing.code,503);
 }finally{globalThis.fetch=originalFetch;for(const k of keys){if(prior[k]===undefined)delete process.env[k];else process.env[k]=prior[k]}}
});

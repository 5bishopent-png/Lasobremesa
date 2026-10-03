import test from 'node:test';
import assert from 'node:assert/strict';
import {aiFailure} from '../lib/ai-health.js';
test('gateway diagnostics distinguish plan restrictions without exposing provider content',()=>{
 const secret='private-token-must-not-leak';
 const result=aiFailure({name:'GatewayInternalServerError',statusCode:403,cause:{responseBody:JSON.stringify({error:{message:`Free tier users do not have access to this model ${secret}`}})}});
 assert.equal(result.reason,'model_plan_restricted');
 assert.ok(!JSON.stringify(result).includes(secret));
 assert.equal(aiFailure({statusCode:403,message:'access_denied'}).reason,'gateway_access_denied');
 assert.equal(aiFailure({statusCode:401,message:'Invalid OIDC token'}).reason,'gateway_authentication');
});

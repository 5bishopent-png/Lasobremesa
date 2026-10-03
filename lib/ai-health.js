// Only fixed categories leave the server; never return provider bodies or credentials.
export function aiFailure(error){
 const messages=[];let current=error;
 for(let i=0;current&&i<4;i++,current=current.cause){
  for(const value of [current.message,current.responseBody])if(typeof value==='string')messages.push(value.slice(0,12000));
 }
 const detail=messages.join(' ').toLowerCase();
 const status=Number(error?.statusCode)||null;
 let reason='upstream_unavailable';
 if(/credit card|payment method|billing.{0,20}(setup|information|details)/.test(detail))reason='gateway_billing_setup_required';
 else if(/free.{0,30}tier|model_not_available_on_plan/.test(detail))reason='model_plan_restricted';
 else if(/allowlist|allow list|policy|rule_id/.test(detail))reason='model_policy_restricted';
 else if(/credit|balance|payment|budget/.test(detail)||status===402)reason='gateway_credits_required';
 else if(/oidc|authentication|invalid.{0,20}token|unauthorized|no authentication/.test(detail)||status===401)reason='gateway_authentication';
 else if(/access_denied|access denied|forbidden/.test(detail)||status===403)reason='gateway_access_denied';
 else if(/model.{0,20}not.{0,10}found/.test(detail))reason='model_not_found';
 else if(status===429)reason='rate_limited';
 else if(/timeout|abort/.test(detail))reason='timeout';
 return {type:String(error?.name||'Unavailable').replace(/[^a-zA-Z0-9_]/g,'').slice(0,40),status,reason};
}

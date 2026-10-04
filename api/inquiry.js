import {checkOrigin,json,limited,sendMail} from '../lib/services.js';

const clean=(v,n=500)=>String(v||'').trim().slice(0,n);
const esc=s=>String(s||'').replace(/[<>]/g,'');
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!checkOrigin(req))return json(res,403,{error:'Please use the inquiry form on our website.'});
 try{
  if(await limited(req,'event-inquiry',4,86400))return json(res,429,{error:'Please contact Chef Adam directly for another request.'});
  const b=req.body||{};
  if(b.website)return json(res,400,{error:'Unable to accept this request.'});
  const d={name:clean(b.name,120),email:clean(b.email,254).toLowerCase(),phone:clean(b.phone,40),date:clean(b.date,10),type:clean(b.type,80),guests:clean(b.guests,10),location:clean(b.location,200),budget:clean(b.budget,80),details:clean(b.details,2000)};
  if(!d.name||!/^\S+@\S+\.\S+$/.test(d.email))return json(res,400,{error:'Please provide your name and a valid email.'});
  if(d.guests&&(!/^\d+$/.test(d.guests)||+d.guests<1||+d.guests>10000))return json(res,400,{error:'Please check the guest count.'});
  const id='inq-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  const summary=[['Name',d.name],['Email',d.email],['Phone',d.phone],['Event date',d.date],['Event type',d.type],['Guest count',d.guests],['Location / venue',d.location],['Estimated budget',d.budget],['Details',d.details]].map(([k,v])=>`${k}: ${esc(v)||'Not provided'}`).join('\n');
  const owner=await sendMail({to:process.env.CONCIERGE_OWNER_EMAIL,subject:`New Sobre Mesa event inquiry — ${d.type||'Private event'}`,text:`New website inquiry\nReference: ${id}\n\n${summary}\n\nReply directly to: ${d.email}`,id:`${id}-owner`});
  let client=null; try{client=await sendMail({to:d.email,subject:'We received your Sobre Mesa inquiry',text:`Hello ${d.name},\n\nThank you for considering Sobre Mesa. Your event inquiry has been received and Chef Adam will personally review the details before following up. This message confirms receipt only; it does not confirm availability or a booking.\n\nReference: ${id}\nEvent date: ${d.date||'To be discussed'}\nEvent type: ${d.type||'To be discussed'}\n\nFor updates, reply to this email or contact chef@lasobremesa.vip.\n\nSobre Mesa\nThe art of gathering`,id:`${id}-client`})}catch{}
  return json(res,201,{ok:true,id,ownerNotified:!!owner,confirmationSent:!!client});
 }catch(e){console.warn('Inquiry delivery failed:',e?.name||'Unknown');return json(res,503,{error:'We could not verify delivery. Please email chef@lasobremesa.vip or call 804-866-7307.'})}
}
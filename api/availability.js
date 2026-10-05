import {capabilities,checkOrigin,json,limited,googleToken} from '../lib/services.js';
import {localToUTC} from '../lib/calendar.js';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!checkOrigin(req))return json(res,403,{error:'Please use Chefy on our website.'});
 if(!capabilities().calendar)return json(res,503,{error:'Chef Adam will confirm your preferred time personally.'});
 try{
  if(await limited(req,'availability',30))return json(res,429,{error:'Please contact Chef Adam to discuss a time.'});
  const {date,time,timezone='America/New_York'}=req.body||{};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||''))return json(res,400,{error:'Choose a valid date and time.'});
  const start=new Date(localToUTC(date,time,timezone)),end=new Date(start.getTime()+20*60000);
  if(start.getTime()<Date.now()+30*60000||start.getTime()>Date.now()+365*86400000)return json(res,400,{error:'Choose a time at least 30 minutes ahead and within one year.'});
  const calendarId=String(process.env.GOOGLE_CALENDAR_ID),token=await googleToken();
  const r=await fetch('https://www.googleapis.com/calendar/v3/freeBusy',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({timeMin:start.toISOString(),timeMax:end.toISOString(),items:[{id:calendarId}]}),signal:AbortSignal.timeout(8000)});
  const d=await r.json(),calendar=d.calendars?.[calendarId];
  if(!r.ok||!calendar||calendar.errors||!Array.isArray(calendar.busy))throw Error('calendar_unavailable');
  return json(res,200,{available:calendar.busy.length===0,durationMinutes:20,confirmationRequired:true});
 }catch{return json(res,503,{error:'Calendar availability could not be verified. Chef Adam will confirm personally.'})}
}

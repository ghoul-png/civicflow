import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = Number(process.env.PORT || 8787);
const DEMO = !(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = DEMO ? null : createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const supabaseAuth = DEMO ? null : createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const stages = [
  { key: 'submitted', name: 'Application Submitted', department: 'Citizen Services', targetHours: 4 },
  { key: 'revenue_review', name: 'Revenue Department', department: 'Revenue Department', targetHours: 48 },
  { key: 'municipal_verification', name: 'Municipal Verification', department: 'Municipal Corporation', targetHours: 48 },
  { key: 'police_verification', name: 'Police Verification', department: 'Police Department', targetHours: 72 },
  { key: 'final_approval', name: 'Final Approval', department: 'District Administration', targetHours: 24 },
];

const now = Date.now();
const demoApplications = new Map([
  ['APP-10482', {
    id: 'APP-10482', title: 'Property Registration Application', applicant: 'Priya Nair', status: 'delayed', current_stage: 'municipal_verification', created_at: new Date(now - 5*86400000).toISOString(), updated_at: new Date(now - 18*60000).toISOString(),
    events: [
      { stage: 'submitted', status: 'completed', at: new Date(now - 5*86400000).toISOString(), note: 'Application received successfully.' },
      { stage: 'revenue_review', status: 'completed', at: new Date(now - 4*86400000).toISOString(), note: 'Revenue documents verified.' },
      { stage: 'municipal_verification', status: 'pending', at: new Date(now - 3*86400000).toISOString(), note: 'Field inspection is pending.' }
    ]
  }],
  ['APP-10491', { id:'APP-10491', title:'Building Plan Approval', applicant:'Rahul Menon', status:'delayed', current_stage:'revenue_review', created_at:new Date(now-4*86400000).toISOString(), updated_at:new Date(now-2*3600000).toISOString(), events:[{stage:'submitted',status:'completed',at:new Date(now-4*86400000).toISOString()},{stage:'revenue_review',status:'pending',at:new Date(now-2*86400000).toISOString(),note:'Document scrutiny pending.'}] }],
  ['APP-10502', { id:'APP-10502', title:'Trade Licence Renewal', applicant:'Ananya Rao', status:'at_risk', current_stage:'police_verification', created_at:new Date(now-3*86400000).toISOString(), updated_at:new Date(now-3600000).toISOString(), events:[{stage:'submitted',status:'completed',at:new Date(now-3*86400000).toISOString()},{stage:'revenue_review',status:'completed',at:new Date(now-2*86400000).toISOString()},{stage:'municipal_verification',status:'completed',at:new Date(now-86400000).toISOString()},{stage:'police_verification',status:'pending',at:new Date(now-86400000).toISOString(),note:'Verification queue is nearing SLA.'}] }]
]);

function hoursBetween(a,b=new Date()){ return Math.max(0,(new Date(b)-new Date(a))/36e5); }
function stageInfo(key){ return stages.find(s=>s.key===key) || stages[0]; }
function derive(app) {
  const current = stageInfo(app.current_stage);
  const ev = [...app.events].reverse().find(e=>e.stage===app.current_stage);
  const actualHours = ev ? hoursBetween(ev.at) : 0;
  const targetHours = current.targetHours;
  const delayHours = Math.max(0, actualHours-targetHours);
  const status = delayHours > 24 ? 'delayed' : delayHours > 0 ? 'at_risk' : 'on_time';
  const days = Math.max(0, Math.round((actualHours/24)*10)/10);
  const targetDays = Math.max(0, Math.round((targetHours/24)*10)/10);
  return { ...app, current_stage_info: current, actual_hours: actualHours, target_hours: targetHours, delay_hours: delayHours, computed_status: status, actual_days: days, target_days: targetDays };
}
function timeline(app){
  return stages.map((s,i)=>{
    const ev=app.events.find(e=>e.stage===s.key);
    const currentIndex=stages.findIndex(x=>x.key===app.current_stage);
    const state = i < currentIndex ? 'done' : i===currentIndex ? 'current' : 'wait';
    return { ...s, state, event: ev || null };
  });
}
function serialize(app){ const d=derive(app); return {...d, timeline:timeline(app)}; }

async function authUser(req,res,next){
  if(DEMO){
    if(req.headers.authorization==='Bearer demo-token'){req.user={id:'demo-officer',name:'Hriday Biswas',role:'GOVT. OFFICER',isOfficer:true};return next();}
    return res.status(401).json({error:'Authentication required'});
  }
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
  if(!token)return res.status(401).json({error:'Authentication required'});
  const {data,error}=await supabaseAuth.auth.getUser(token);
  if(error||!data.user)return res.status(401).json({error:'Invalid or expired session'});
  const {data:profile}=await supabase.from('profiles').select('display_name,role').eq('id',data.user.id).maybeSingle();
  req.user={id:data.user.id,name:profile?.display_name||data.user.email,role:profile?.role||'CITIZEN',isOfficer:profile?.role==='GOVT. OFFICER'};
  next();
}


async function dbGetApplication(id){
  if(DEMO) return demoApplications.get(id.toUpperCase()) || null;
  const { data, error } = await supabase.from('applications').select('*, application_events(*)').eq('id',id.toUpperCase()).maybeSingle();
  if(error) throw error;
  if(!data) return null;
  return {...data, events:data.application_events || []};
}
async function dbListApplications(){
  if(DEMO) return [...demoApplications.values()];
  const {data,error}=await supabase.from('applications').select('*, application_events(*)').order('updated_at',{ascending:false});
  if(error) throw error; return (data||[]).map(x=>({...x,events:x.application_events||[]}));
}
async function dbAdvance(id, actor='demo-officer', note='Stage completed by officer.'){
  const app=await dbGetApplication(id); if(!app) return null;
  const currentIndex=stages.findIndex(s=>s.key===app.current_stage);
  if(currentIndex<0) return app;
  const next=stages[currentIndex+1];
  const event={stage:app.current_stage,status:'completed',at:new Date().toISOString(),note,actor};
  const nextEvent=next?{stage:next.key,status:'pending',at:new Date().toISOString(),note:'Stage entered.' ,actor}:null;
  if(DEMO){
    app.events=[...app.events.filter(e=>!(e.stage===app.current_stage&&e.status==='pending')),event,...(nextEvent?[nextEvent]:[])];
    app.current_stage=next?.key || app.current_stage;
    app.status=next?'in_progress':'completed'; app.updated_at=new Date().toISOString(); demoApplications.set(app.id,app); return app;
  }
  const {error:e1}=await supabase.from('application_events').insert(event); if(e1) throw e1;
  if(next){ const {error:e2}=await supabase.from('application_events').insert(nextEvent); if(e2) throw e2; }
  const {data,error}=await supabase.from('applications').update({current_stage:next?.key||app.current_stage,status:next?'in_progress':'completed',updated_at:new Date().toISOString()}).eq('id',id).select('*, application_events(*)').single();
  if(error) throw error; return {...data,events:data.application_events||[]};
}

app.get('/api/health', (_req,res)=>res.json({ok:true,mode:DEMO?'demo':'supabase',time:new Date().toISOString()}));
app.post('/api/auth/demo', (_req,res)=>res.json({user:{id:'demo-officer',name:'Hriday Biswas',role:'GOVT. OFFICER'},token:'demo-token',mode:'demo'}));
app.get('/api/me', authUser, (req,res)=>res.json({user:req.user}));
app.get('/api/applications', authUser, async (_req,res)=>{ try { const list=await dbListApplications(); res.json({applications:list.map(serialize)}); } catch(e){res.status(500).json({error:e.message});} });
app.get('/api/public/applications/:id', async (req,res)=>{ try { const a=await dbGetApplication(req.params.id); if(!a)return res.status(404).json({error:'Application not found'}); res.json({application:serialize(a)}); } catch(e){res.status(500).json({error:e.message});} });
app.post('/api/applications/:id/advance', authUser, async (req,res)=>{ try { if(!req.user.isOfficer)return res.status(403).json({error:'Officer role required for workflow actions'});  const a=await dbAdvance(req.params.id,req.user.id,req.body?.note); if(!a)return res.status(404).json({error:'Application not found'}); res.json({application:serialize(a)}); } catch(e){res.status(500).json({error:e.message});} });
app.get('/api/analytics', async (_req,res)=>{ try { const list=(await dbListApplications()).map(serialize); const counts={on_time:0,at_risk:0,delayed:0}; list.forEach(a=>counts[a.computed_status]++); const bars=stages.slice(1).map(s=>{const xs=list.filter(a=>a.current_stage===s.key);const avg=xs.length?xs.reduce((n,a)=>n+a.actual_days,0)/xs.length:({revenue_review:1.5,municipal_verification:5.2,police_verification:2.1,final_approval:.8}[s.key]||0);return {name:s.name.replace(' Department',''),value:Number(avg.toFixed(1)),stage:s.key};}); const attention=list.filter(a=>a.computed_status!=='on_time').map(a=>({id:a.id,stage:a.current_stage_info.name,days_overdue:Number((a.delay_hours/24).toFixed(1)),priority:a.computed_status==='delayed'?'CRITICAL':'AT RISK'})); res.json({counts,bars,attention}); }catch(e){res.status(500).json({error:e.message});} });

export default app;
if (!process.env.VERCEL) app.listen(PORT,()=>console.log(`CIVICFLOW API running on http://localhost:${PORT} (${DEMO?'DEMO mode — configure Supabase for persistence':'SUPABASE mode'})`));

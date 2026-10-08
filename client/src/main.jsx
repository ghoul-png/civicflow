import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Search, Bell, ChevronRight, ArrowUpRight, ShieldCheck, Activity, Building2, BarChart3, AlertTriangle, Check, Circle, Command, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';
import './styles.css';

const API='/api';
const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=SUPABASE_URL&&SUPABASE_ANON_KEY?createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
const fmtDate=(iso)=>new Date(iso).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
const fmtTime=(iso)=>new Date(iso).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
const fmtEventDate=(iso)=>`${fmtDate(iso)} • ${fmtTime(iso)}`;

function useParticles(canvas, active){
  useEffect(()=>{
    if(!active) return; const c=canvas.current,ctx=c.getContext('2d'); let raf,w,h; const pts=[];
    const resize=()=>{w=c.width=innerWidth*devicePixelRatio;h=c.height=innerHeight*devicePixelRatio;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)};
    resize();addEventListener('resize',resize);for(let i=0;i<230;i++)pts.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,z:Math.random(),a:.12+Math.random()*.55,s:.15+Math.random()*1.15});let t=0;
    const draw=()=>{t+=.006;ctx.clearRect(0,0,innerWidth,innerHeight);const cx=innerWidth/2,cy=innerHeight*.49;pts.forEach(p=>{p.y-=p.s*.25;if(p.y<-5)p.y=innerHeight+5;const d=Math.hypot(p.x-cx,p.y-cy),pulse=Math.sin(t*2+d*.008)*.5+.5;ctx.beginPath();ctx.arc(p.x,p.y,p.z*1.6,0,Math.PI*2);ctx.fillStyle=`rgba(74,244,214,${p.a*(.45+pulse*.55)})`;ctx.fill();if(d<420&&Math.random()<.004){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(cx+(p.x-cx)*.55,cy+(p.y-cy)*.55);ctx.strokeStyle='rgba(57,220,195,.07)';ctx.stroke()}});raf=requestAnimationFrame(draw)};draw();return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize)};
  },[active]);
}
function Intro({onEnter}){
  const canvas=useRef(null);const [boot,setBoot]=useState(0);const [armed,setArmed]=useState(false);const [leaving,setLeaving]=useState(false);useParticles(canvas,true);
  useEffect(()=>{const timer=setInterval(()=>setBoot(v=>Math.min(100,v+Math.ceil(Math.random()*8+3))),120);return()=>clearInterval(timer)},[]);
  useEffect(()=>{if(boot<100)return;const t=setTimeout(()=>setArmed(true),450);return()=>clearTimeout(t)},[boot]);
  useEffect(()=>{if(!armed)return;const enter=()=>{setLeaving(true);setTimeout(onEnter,950)};addEventListener('keydown',enter);addEventListener('click',enter);return()=>{removeEventListener('keydown',enter);removeEventListener('click',enter)}},[armed,onEnter]);
  return <div className={'intro '+(leaving?'intro-leaving':'')}><canvas ref={canvas}/><div className="noise"/><div className="vignette"/><div className="intro-top"><div className="brand"><span className="brand-mark">C</span><span>CIVICFLOW</span></div><span>DIGITAL GOVERNANCE PLATFORM</span></div><div className="intro-side left">YOUR<br/>APPLICATIONS<br/><b>HAVE A HOME</b></div><div className="intro-side right">FROM<br/><b>CITIZENS</b><br/>TO<br/><b>GOVERNMENT</b></div><div className="core-wrap"><div className="beam"/><div className="core-glow"/><div className="core"><div className="core-grid"/><div className="core-dot"/></div><div className="ring r1"/><div className="ring r2"/><div className="ring r3"/><div className="scan"/></div><div className="intro-copy"><div className="eyebrow">TRACK / TRANSPARENCY / TRUST</div><h1>CIVIC<span>FLOW</span></h1><div className="tagline">REAL APPLICATIONS. REAL PROGRESS.</div><p>Because your application isn't just a file.<br/>It's your future.</p></div><div className="boot"><span>SYSTEM STATUS</span><div className="bootline"><i style={{width:`${boot}%`}}/></div><b>{boot}%</b></div>{armed?<button className="enter"><span>PRESS ANY KEY TO ENTER</span><kbd>↵</kbd></button>:<div className="initializing">INITIALIZING CIVICFLOW <span>{boot}%</span></div>}<div className="intro-bottom"><div>— TRACK</div><div>— DEPARTMENTS</div><div>— ANALYTICS</div><div>— NOTIFICATIONS</div><div className="tomorrow">A MORE TRANSPARENT<br/>TOMORROW —</div></div></div>
}
function Nav({active,setActive,user,onLogout}){return <header className="nav"><div className="nav-brand"><span className="mini-mark">C</span>CIVICFLOW</div><nav>{[['Applications',Activity],['Departments',Building2],['Analytics',BarChart3],['Notifications',Bell]].map(([x,I])=><button className={active===x?'nav-active':''} onClick={()=>setActive(x)} key={x}><I size={15}/>{x}</button>)}</nav><div className="profile"><div className="avatar">HB</div><div><b>Hriday Biswas</b><small>{user.role||'CITIZEN'}</small></div><button className="icon-btn" onClick={onLogout} title="Sign out"><LogOut size={14}/></button></div></header>}
function Login({onLogin}){const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const submit=async(e)=>{e.preventDefault();setBusy(true);setError('');try{const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;const r=await fetch(`${API}/me`,{headers:{Authorization:`Bearer ${data.session.access_token}`}});const j=await r.json();if(!r.ok)throw new Error(j.error);onLogin({user:j.user,token:data.session.access_token,session:data.session})}catch(e){setError(e.message)}finally{setBusy(false)}};return <div className="auth-screen"><div className="auth-card glass"><div className="brand"><span className="brand-mark">C</span><span>CIVICFLOW</span></div><span className="auth-kicker">SECURE OFFICER ACCESS</span><h2>Enter the operations layer.</h2><p>Authorized officers can inspect application queues and advance workflow stages.</p><form onSubmit={submit}><input type="email" placeholder="Officer email" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/><button disabled={busy}>{busy?'AUTHENTICATING…':'SIGN IN'} <ArrowUpRight size={15}/></button></form>{error&&<div className="auth-error">{error}</div>}<small>Supabase Auth · server-verified role</small></div></div>}

function TrackerGate({query,setQuery,loading,onTrack}){return <div className="tracker-gate"><div className="tracker-bg"/><div className="tracker-shell"><div className="tracker-brand"><span className="mini-mark">C</span><span>CIVICFLOW</span><small>PUBLIC APPLICATION TRACKING</small></div><div className="tracker-kicker">APPLICATION / STATUS / TRANSPARENCY</div><h1>Enter your application<br/><em>number.</em></h1><p>See exactly where your application is, which department has it, and whether anything is holding it up.</p><div className="tracker-form"><Search size={20}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&onTrack()} placeholder="e.g. APP-10482"/><button onClick={onTrack} disabled={loading}>{loading?'FINDING…':'TRACK APPLICATION'} <ArrowUpRight size={16}/></button></div><div className="tracker-meta"><span><ShieldCheck size={13}/> Secure application lookup</span><span>Try <b>APP-10482</b></span></div></div><div className="tracker-footer"><span>CIVICFLOW / DIGITAL GOVERNANCE</span><span>ONE ID. COMPLETE TRANSPARENCY.</span></div></div>}

function App(){
  const [entered,setEntered]=useState(false);
  const [tracking,setTracking]=useState(false);
  const [active,setActive]=useState('Applications');
  const [query,setQuery]=useState('');
  const [app,setApp]=useState(null);
  const [analytics,setAnalytics]=useState(null);
  const [toast,setToast]=useState('');
  const [loading,setLoading]=useState(false);
  const [auth,setAuth]=useState(null);

  const authHeaders=()=>auth?.token?{Authorization:`Bearer ${auth.token}`}:{};

  const load=async(id=query)=>{
    setLoading(true);
    try{
      const r=await fetch(`${API}/public/applications/${encodeURIComponent(id)}`,{headers:authHeaders()});
      if(!r.ok) throw new Error('Application not found');
      const j=await r.json();
      setApp(j.application);
      setToast(`Tracking ${j.application.id}`);
    }catch(e){
      setToast(e.message);
    }finally{
      setLoading(false);
    }
  };

  const loadAnalytics=async()=>{
    const r=await fetch(`${API}/analytics`,{headers:authHeaders()});
    if(r.ok) setAnalytics(await r.json());
  };

  useEffect(()=>{
    if(!entered) return;
    if(!supabase){
      fetch(`${API}/auth/demo`,{method:'POST'})
        .then(r=>r.json())
        .then(j=>setAuth(j));
    }
  },[entered]);

  useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getSession().then(({data})=>{
      if(data.session){
        fetch(`${API}/me`,{headers:{Authorization:`Bearer ${data.session.access_token}`}})
          .then(r=>r.json())
          .then(j=>{
            if(j.user) setAuth({user:j.user,token:data.session.access_token,session:data.session});
          });
      }
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(session){
        fetch(`${API}/me`,{headers:{Authorization:`Bearer ${session.access_token}`}})
          .then(r=>r.json())
          .then(j=>j.user&&setAuth({user:j.user,token:session.access_token,session}));
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!auth) return;
    loadAnalytics();
  },[auth]);

  useEffect(()=>{
    if(!tracking) return;
    const t=setInterval(()=>{
      load(query);
      if(auth) loadAnalytics();
    },30000);
    return()=>clearInterval(t);
  },[tracking,query,auth]);

  useEffect(()=>{
    if(!toast) return;
    const t=setTimeout(()=>setToast(''),2800);
    return()=>clearTimeout(t);
  },[toast]);

  if(!entered) return <Intro onEnter={()=>setEntered(true)}/>;

  if(!tracking){
    return (
      <TrackerGate
        query={query}
        setQuery={setQuery}
        loading={loading}
        onTrack={async()=>{
          if(!query.trim()){
            setToast('Enter an application number');
            return;
          }
          setLoading(true);
          try{
            const id=query.trim().toUpperCase();
            const r=await fetch(`${API}/public/applications/${encodeURIComponent(id)}`);
            const j=await r.json();
            if(!r.ok) throw new Error(j.error||'Application not found');
            setApp(j.application);
            setTracking(true);
            setToast(`Tracking ${j.application.id}`);
            if(!auth&&!supabase){
              const d=await fetch(`${API}/auth/demo`,{method:'POST'}).then(r=>r.json());
              setAuth(d);
            }
          }catch(e){
            setToast(e.message);
          }finally{
            setLoading(false);
          }
        }}
      />
    );
  }

  if(!auth&&!supabase) return <div className="loading-screen">CONNECTING CIVICFLOW <span/></div>;

  const user=auth?.user||{id:'citizen-viewer',name:'Hriday Biswas',role:'CITIZEN'};

  const advance=async()=>{
    setLoading(true);
    try{
      const r=await fetch(`${API}/applications/${app.id}/advance`,{
        method:'POST',
        headers:{'Content-Type':'application/json',...authHeaders()},
        body:JSON.stringify({actor:user.id,note:'Municipal field inspection completed.'})
      });
      const j=await r.json();
      if(!r.ok) throw new Error(j.error);
      setApp(j.application);
      loadAnalytics();
      setToast('Workflow advanced — next department notified.');
    }catch(e){
      setToast(e.message);
    }finally{
      setLoading(false);
    }
  };

  const a=app;
  const bars=analytics?.bars||[];
  const counts=analytics?.counts||{on_time:0,at_risk:0,delayed:0};
  const maxBar=Math.max(...bars.map(x=>x.value),1);

  return (
    <div className="app-shell">
      <Nav
        active={active}
        setActive={setActive}
        user={user}
        onLogout={async()=>{
          if(supabase) await supabase.auth.signOut();
          setEntered(false);
          setTracking(false);
          setAuth(null);
          setApp(null);
        }}
      />

      <main className="dashboard">
        <button className="change-app" onClick={()=>{setTracking(false);setApp(null);setQuery('')}}>
          ← TRACK ANOTHER APPLICATION
        </button>

        <section className="progress-hero">
          <div>
            <div className="crumb">
              CIVICFLOW <span>///</span> APPLICATION PROGRESS
            </div>
            <h2>Here’s what’s happening<br/><em>with your application.</em></h2>
            <p>Every stage. Every department. Nothing hidden.</p>
          </div>
          <div className="tracked-id">
            <span>TRACKING</span>
            <strong>{a?.id||query}</strong>
            <small>LIVE STATUS</small>
          </div>
        </section>

        {a && (
          <>
            <section className="status-grid">
              <div className="application-panel glass">
                <div className="panel-head">
                  <div>
                    <span className="mono-id">{a.id} <span>↗</span></span>
                    <h3>{a.title} · {a.applicant}</h3>
                  </div>
                  <span className={'badge '+(a.computed_status==='delayed'?'delayed':'risk')}>
                    <i/> {a.computed_status.replace('_',' ').toUpperCase()}
                  </span>
                </div>

                <div className="timeline">
                  {a.timeline.map((s)=>(
                    <div className={'stage '+s.state} key={s.key}>
                      <div className="stage-line">
                        <span className="stage-dot">
                          {s.state==='done' ? <Check size={12}/> : s.state==='current' ? <AlertTriangle size={12}/> : <Circle size={8}/>} 
                        </span>
                      </div>
                      <div className="stage-copy">
                        <b>{s.name}</b>
                        <small>
                          {s.event?.status==='completed'
                            ? `Completed • ${fmtDate(s.event.at)}`
                            : s.state==='current'
                              ? `${s.actual_days||0} days in stage · SLA ${s.target_days} days`
                              : 'Waiting'}
                        </small>
                      </div>
                      {s.state==='current' && <ChevronRight className="stage-arrow" size={18}/>} 
                    </div>
                  ))}
                </div>
              </div>

              <div className="delay-panel glass">
                <div className="alert-orb"><AlertTriangle size={18}/></div>
                <div className="delay-title">
                  <span>WHY IS THIS DELAYED?</span>
                  <h3>{a.current_stage_info.name} is {a.computed_status==='delayed'?'over SLA.':'being monitored.'}</h3>
                </div>
                <div className="metrics">
                  <div><small>TARGET TIME</small><b>{a.target_days} days</b></div>
                  <div><small>ACTUAL TIME</small><b>{a.actual_days} days</b></div>
                  <div className="bad"><small>DELAY</small><b>{a.delay_hours>0?`+${Math.round(a.delay_hours/24*10)/10} days`:'On track'}</b></div>
                </div>
                <div className="plain">
                  <span>i</span>
                  <p>{a.events?.find(e=>e.stage===a.current_stage)?.note||`Your application is currently with ${a.current_stage_info.department}. The stage is monitored against its SLA.`}</p>
                </div>
                <div className="confidence">
                  <span><ShieldCheck size={14}/> Server-calculated SLA</span>
                  <span>Updated {fmtDate(a.updated_at)} • {fmtTime(a.updated_at)}</span>
                </div>
                {user.role==='GOVT. OFFICER' && (
                  <button className="advance-btn" onClick={advance} disabled={loading || a.current_stage==='final_approval'}>
                    <CheckCircle2 size={15}/>
                    {a.current_stage==='final_approval'?'FINAL STAGE':'MARK STAGE COMPLETE'}
                  </button>
                )}
              </div>
            </section>

            <section className="lower-grid">
              <div className="left-lower">
                <div className="section-title">
                  <div><span>LIVE OPERATIONS</span><h3>Where applications get stuck</h3></div>
                  <button onClick={loadAnalytics}><RefreshCw size={14}/> REFRESH</button>
                </div>
                <div className="chart glass">
                  {bars.map(b=>(
                    <div className={'bar-row '+(b.value===maxBar?'hot':'')} key={b.stage}>
                      <label>{b.name}</label>
                      <div className="track">
                        <i style={{width:`${Math.min(100,(b.value/maxBar)*100)}%`}}/>
                        <span>{b.value} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="section-title">
                  <div><span>PORTFOLIO STATUS</span><h3>Application health</h3></div>
                </div>
                <div className="stat-grid">
                  <div className="stat glass on"><i/><small>ON TIME</small><strong>{counts.on_time}</strong><span>WITHIN SLA</span></div>
                  <div className="stat glass risk"><i/><small>AT RISK</small><strong>{counts.at_risk}</strong><span>WATCH CLOSELY</span></div>
                  <div className="stat glass late"><i/><small>DELAYED</small><strong>{counts.delayed}</strong><span>OVER SLA</span></div>
                </div>
              </div>
            </section>

            <section className="attention glass">
              <div className="attention-head">
                <div><span className="live"><i/> LIVE QUEUE</span><h3>Applications requiring attention</h3></div>
                <span className="live">SERVER-SIDE SLA</span>
              </div>
              <div className="table-head">
                <span>APPLICATION ID</span><span>STAGE</span><span>DAYS OVERDUE</span><span>PRIORITY</span><span/>
              </div>
              {(analytics?.attention||[]).map(x=>(
                <div className="table-row" key={x.id}>
                  <b>{x.id}</b>
                  <span>{x.stage}</span>
                  <span className="red">{x.days_overdue} days</span>
                  <em className={x.priority==='CRITICAL'?'critical':'high'}>{x.priority}</em>
                  <ChevronRight size={15}/>
                </div>
              ))}
            </section>
          </>
        )}

        <footer>
          <span>CIVICFLOW / APPLICATION INTELLIGENCE</span>
          <span>DATA STATUS: <b style={{color:'#4be5ae'}}>LIVE</b> · API {location.host}</span>
        </footer>
      </main>

      {toast && (
        <div className="toast">
          <ShieldCheck size={15}/>{toast}<button onClick={()=>setToast('')}>×</button>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App/>);

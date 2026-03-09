import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── THEME ───────────────────────────────────────────────────────
const B = "#507c80";
const BD = "#3a5f62";
const BL = "#e8f4f5";

// ─── SEED DATA ────────────────────────────────────────────────────
const today = new Date();
const fmt = (d) => (d instanceof Date ? d : new Date(d)).toISOString().split("T")[0];
const shift = (n) => fmt(new Date(today.getTime() + n * 86400000));

const SEED_USERS = [
  { id: "u1", name: "Ngozi Adeyemi",  email: "admin@prowess.com",  password: "admin123", role: "admin",  avatar: "NA", title: "Business Director"   },
  { id: "u2", name: "Chidi Okafor",   email: "chidi@prowess.com",  password: "pass123",  role: "member", avatar: "CO", title: "Business Analyst"    },
  { id: "u3", name: "Amaka Eze",      email: "amaka@prowess.com",  password: "pass123",  role: "member", avatar: "AE", title: "Strategy Consultant" },
  { id: "u4", name: "Emeka Nwosu",    email: "emeka@prowess.com",  password: "pass123",  role: "member", avatar: "EN", title: "Digital Strategist"  },
  { id: "u5", name: "Fatima Bello",   email: "fatima@prowess.com", password: "pass123",  role: "member", avatar: "FB", title: "Client Relations"    },
];

const SEED_TASKS = [
  { id:"t1",  title:"Develop client onboarding process",   description:"Create a streamlined onboarding flow for new consulting clients.",          assignedTo:"u2", priority:"high",   project:"Operations",   deadline:shift(5),   status:"in-progress", createdAt:shift(-7),  completedAt:null        },
  { id:"t2",  title:"Prepare Q2 strategy presentation",    description:"Build a comprehensive Q2 business strategy deck for leadership review.",     assignedTo:"u3", priority:"high",   project:"Strategy",     deadline:shift(2),   status:"completed",   createdAt:shift(-10), completedAt:shift(-1)   },
  { id:"t3",  title:"Update business tools documentation", description:"Revise the tools page with updated descriptions and pricing.",              assignedTo:"u4", priority:"medium", project:"Content",      deadline:shift(8),   status:"pending",     createdAt:shift(-3),  completedAt:null        },
  { id:"t4",  title:"Client audit report — Lagos SME",     description:"Complete the full business audit report for the Lagos client.",             assignedTo:"u2", priority:"high",   project:"Client Work",  deadline:shift(-2),  status:"completed",   createdAt:shift(-14), completedAt:shift(-3)   },
  { id:"t5",  title:"Social media content calendar",       description:"Plan and schedule 4 weeks of social media content.",                       assignedTo:"u5", priority:"medium", project:"Marketing",    deadline:shift(6),   status:"in-progress", createdAt:shift(-5),  completedAt:null        },
  { id:"t6",  title:"Review new client proposals",         description:"Assess and respond to 3 incoming consultation requests.",                  assignedTo:"u3", priority:"high",   project:"Business Dev", deadline:shift(1),   status:"pending",     createdAt:shift(-2),  completedAt:null        },
  { id:"t7",  title:"Build email newsletter template",     description:"Design a branded email template for monthly updates.",                     assignedTo:"u4", priority:"low",    project:"Marketing",    deadline:shift(12),  status:"pending",     createdAt:shift(-1),  completedAt:null        },
  { id:"t8",  title:"Team performance review prep",        description:"Gather data and prepare notes for the monthly performance review meeting.", assignedTo:"u5", priority:"medium", project:"Operations",   deadline:shift(-1),  status:"completed",   createdAt:shift(-8),  completedAt:shift(-2)   },
  { id:"t9",  title:"Case study: Retail client success",   description:"Write and format a case study from the recent retail business turnaround.", assignedTo:"u2", priority:"low",    project:"Content",      deadline:shift(15),  status:"pending",     createdAt:shift(0),   completedAt:null        },
  { id:"t10", title:"Update pricing strategy",             description:"Revisit service pricing in line with market research findings.",           assignedTo:"u3", priority:"medium", project:"Strategy",     deadline:shift(-3),  status:"in-progress", createdAt:shift(-12), completedAt:null        },
];

const SEED_LOGS = [
  { id:"l1",  userId:"u2", taskTitle:"Client onboarding process",     description:"Mapped out 5 onboarding stages and created initial template.",         project:"Operations",   timeSpent:3,   date:shift(0)  },
  { id:"l2",  userId:"u3", taskTitle:"Q2 strategy presentation",      description:"Completed slides 1–15, added market analysis charts.",                 project:"Strategy",     timeSpent:4,   date:shift(0)  },
  { id:"l3",  userId:"u4", taskTitle:"Business tools documentation",  description:"Reviewed existing docs and outlined key updates needed.",               project:"Content",      timeSpent:2,   date:shift(-1) },
  { id:"l4",  userId:"u5", taskTitle:"Social media content calendar", description:"Drafted content ideas for week 1 and 2 of the calendar.",               project:"Marketing",    timeSpent:2.5, date:shift(0)  },
  { id:"l5",  userId:"u2", taskTitle:"Lagos SME audit report",        description:"Completed the financial section of the audit report.",                  project:"Client Work",  timeSpent:5,   date:shift(-2) },
  { id:"l6",  userId:"u3", taskTitle:"New client proposals",          description:"Responded to 2 of 3 incoming consultation requests.",                   project:"Business Dev", timeSpent:2,   date:shift(-1) },
  { id:"l7",  userId:"u4", taskTitle:"Email newsletter template",     description:"Created wireframe layout and colour palette for the template.",          project:"Marketing",    timeSpent:1.5, date:shift(0)  },
  { id:"l8",  userId:"u5", taskTitle:"Performance review prep",       description:"Collected productivity data from the past 4 weeks.",                    project:"Operations",   timeSpent:3,   date:shift(-3) },
  { id:"l9",  userId:"u2", taskTitle:"Retail client case study",      description:"Began research and gathered testimonial quotes from the client.",        project:"Content",      timeSpent:2,   date:shift(-1) },
  { id:"l10", userId:"u3", taskTitle:"Pricing strategy",              description:"Completed competitor pricing analysis for 3 key markets.",               project:"Strategy",     timeSpent:3.5, date:shift(-2) },
];

const AV_BG = { u1:"#507c80", u2:"#6366f1", u3:"#ec4899", u4:"#f59e0b", u5:"#10b981" };

const PRI = {
  high:   { label:"High",        color:"#ef4444", bg:"#fef2f2" },
  medium: { label:"Medium",      color:"#f59e0b", bg:"#fffbeb" },
  low:    { label:"Low",         color:"#22c55e", bg:"#f0fdf4" },
};

const STA = {
  pending:     { label:"Pending",     color:"#64748b", bg:"#f1f5f9", dot:"#94a3b8" },
  "in-progress":{ label:"In Progress", color:"#3b82f6", bg:"#eff6ff", dot:"#3b82f6" },
  completed:   { label:"Completed",   color:"#22c55e", bg:"#f0fdf4", dot:"#22c55e" },
};

function computeScores(tasks, logs, users) {
  return users
    .filter(u => u.role === "member")
    .map(u => {
      let pts = 0;
      const ut = tasks.filter(t => t.assignedTo === u.id);
      ut.forEach(t => {
        if (t.status === "completed") {
          pts += 10;
          if (t.completedAt && t.deadline && t.completedAt <= t.deadline) pts += 5;
        } else if (t.deadline && t.deadline < fmt(today)) {
          pts -= 3;
        }
      });
      const ul = logs.filter(l => l.userId === u.id);
      pts += ul.length * 2;
      return {
        userId: u.id, name: u.name, avatar: u.avatar, title: u.title,
        score: Math.max(0, pts),
        tasksCompleted: ut.filter(t => t.status === "completed").length,
        tasksTotal: ut.length,
        logsCount: ul.length,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── ATOMS ────────────────────────────────────────────────────────
function Av({ user, size = 36 }) {
  if (!user) return null;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background: AV_BG[user.id] || B,
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"white", fontSize:size*0.35, fontWeight:700, flexShrink:0 }}>
      {user.avatar}
    </div>
  );
}

function Pill({ type, value }) {
  const cfg = type === "priority" ? PRI[value] : STA[value];
  if (!cfg) return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:20, background:cfg.bg, color:cfg.color,
      fontSize:12, fontWeight:600, flexShrink:0 }}>
      {type === "status" && <span style={{ width:6,height:6,borderRadius:"50%",background:cfg.dot||cfg.color }}/>}
      {cfg.label}
    </span>
  );
}

function Card({ children, style={} }) {
  return <div style={{ background:"white", borderRadius:16, border:"1px solid #e2e8f0",
    boxShadow:"0 1px 3px rgba(0,0,0,0.04)", ...style }}>{children}</div>;
}

function Stat({ icon, label, value, sub, color=B, trend }) {
  return (
    <Card style={{ padding:24, flex:1, minWidth:150 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ width:44, height:44, borderRadius:12, background:color+"18",
          display:"flex", alignItems:"center", justifyContent:"center", color, fontSize:20 }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{ fontSize:12, color:trend>=0?"#22c55e":"#ef4444", fontWeight:600 }}>
            {trend>=0?"↑":"↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:28, fontWeight:800, color:"#0f172a", lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{sub}</div>}
      </div>
    </Card>
  );
}

const SEL = { padding:"9px 14px", borderRadius:10, border:"1px solid #e2e8f0",
  fontSize:13, color:"#374151", background:"white", cursor:"pointer", outline:"none" };
const sBtn = (c) => ({ padding:"6px 12px", borderRadius:8, background:c+"18",
  border:`1px solid ${c}30`, color:c, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" });

// ─── SIDEBAR ──────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",   label:"Dashboard",   icon:"⊞" },
  { id:"tasks",       label:"Tasks",       icon:"✓" },
  { id:"activity",    label:"Activity Log",icon:"⏱" },
  { id:"leaderboard", label:"Leaderboard", icon:"🏆" },
  { id:"reports",     label:"Reports",     icon:"📊" },
  { id:"team",        label:"Team",        icon:"👥", admin:true },
  { id:"settings",    label:"Settings",    icon:"⚙" },
];

function Sidebar({ user, page, setPage, onLogout }) {
  return (
    <div style={{ width:228, background:"#111827", height:"100vh", display:"flex",
      flexDirection:"column", flexShrink:0, position:"sticky", top:0 }}>
      <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid #1f2937" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:B, display:"flex",
            alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontSize:18, fontWeight:800 }}>P</span>
          </div>
          <div>
            <div style={{ color:"white", fontWeight:700, fontSize:13, lineHeight:1.3 }}>Prowess</div>
            <div style={{ color:"#4b5563", fontSize:10 }}>Digital Solutions</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto" }}>
        {NAV.filter(n => !n.admin || user.role==="admin").map(n => {
          const on = page===n.id;
          return (
            <button key={n.id} onClick={()=>setPage(n.id)} style={{
              display:"flex", alignItems:"center", gap:11, width:"100%", padding:"10px 12px",
              borderRadius:10, background:on?B+"22":"transparent", border:"none", cursor:"pointer",
              color:on?"#7ecfd4":"#9ca3af", fontSize:14, fontWeight:on?600:400,
              marginBottom:2, textAlign:"left" }}>
              <span style={{ fontSize:15 }}>{n.icon}</span>
              {n.label}
              {on&&<div style={{ marginLeft:"auto", width:5, height:5, borderRadius:"50%", background:B }}/>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:14, borderTop:"1px solid #1f2937" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <Av user={user} size={32}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:"white", fontSize:13, fontWeight:600, overflow:"hidden",
              textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
            <div style={{ color:"#6b7280", fontSize:11 }}>{user.role==="admin"?"Administrator":user.title}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:8,
          width:"100%", padding:"8px 12px", borderRadius:8, background:"#1f2937",
          border:"none", cursor:"pointer", color:"#9ca3af", fontSize:13 }}>
          ← Sign Out
        </button>
      </div>
    </div>
  );
}

function TopBar({ user, page }) {
  const T = { dashboard:"Dashboard", tasks:"Tasks", activity:"Activity Log",
    leaderboard:"Leaderboard", reports:"Reports", team:"Team", settings:"Settings" };
  return (
    <div style={{ background:"white", borderBottom:"1px solid #e2e8f0", padding:"0 28px",
      height:58, display:"flex", alignItems:"center", justifyContent:"space-between",
      position:"sticky", top:0, zIndex:10 }}>
      <h1 style={{ fontSize:17, fontWeight:700, color:"#0f172a", margin:0 }}>{T[page]}</h1>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ fontSize:12, color:"#94a3b8" }}>
          {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
        </div>
        <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e" }}/>
        <span style={{ fontSize:13, color:"#475569", fontWeight:500 }}>{user.name}</span>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────
function AdminDashboard({ tasks, logs, users, setPage }) {
  const scores = useMemo(()=>computeScores(tasks,logs,users),[tasks,logs,users]);
  const total     = tasks.length;
  const completed = tasks.filter(t=>t.status==="completed").length;
  const inProg    = tasks.filter(t=>t.status==="in-progress").length;
  const overdue   = tasks.filter(t=>t.deadline<fmt(today)&&t.status!=="completed").length;

  const weekBar = [
    {day:"Mon",tasks:3},{day:"Tue",tasks:5},{day:"Wed",tasks:4},
    {day:"Thu",tasks:7},{day:"Fri",tasks:6},{day:"Sat",tasks:2},{day:"Sun",tasks:1},
  ];
  const pie = [
    {name:"Completed",   value:completed,              color:"#22c55e"},
    {name:"In Progress", value:inProg,                 color:"#3b82f6"},
    {name:"Pending",     value:total-completed-inProg, color:"#cbd5e1"},
  ];
  const recent = [...logs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        <Stat icon="📋" label="Total Tasks"  value={total}     sub="This month"                     color="#6366f1" trend={12}/>
        <Stat icon="✅" label="Completed"    value={completed} sub={`${Math.round(completed/total*100)}% rate`} color="#22c55e" trend={8}/>
        <Stat icon="🔄" label="In Progress"  value={inProg}    sub="Active now"                     color="#3b82f6"/>
        <Stat icon="⚠️" label="Overdue"      value={overdue}   sub="Need attention"                 color="#ef4444" trend={-5}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }}>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:18 }}>Weekly Task Completion</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weekBar} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}/>
              <Bar dataKey="tasks" fill={B} radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Task Status Split</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pie} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={3}>
                {pie.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
            {pie.map((d,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:d.color }}/>
                <span style={{ color:"#64748b", flex:1 }}>{d.name}</span>
                <span style={{ fontWeight:700, color:"#0f172a" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }}>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Recent Team Activity</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {recent.map(log=>{
              const u=users.find(u=>u.id===log.userId);
              return (
                <div key={log.id} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <Av user={u} size={32}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{u?.name}</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>{log.taskTitle} · {log.timeSpent}h · {log.project}</div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>{log.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:16 }}>🏆 Top Performers</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {scores.slice(0,4).map((s,i)=>{
              const u=users.find(u=>u.id===s.userId);
              return (
                <div key={s.userId} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:i===0?"#f59e0b":"#94a3b8", width:18 }}>#{i+1}</div>
                  <Av user={u} size={28}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{s.tasksCompleted} tasks done</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:800, color:B }}>{s.score}pt</div>
                </div>
              );
            })}
          </div>
          <button onClick={()=>setPage("leaderboard")} style={{ marginTop:16, width:"100%", padding:"10px",
            borderRadius:10, background:B+"12", border:`1px solid ${B}30`, color:B,
            fontSize:13, fontWeight:600, cursor:"pointer" }}>
            View Full Leaderboard →
          </button>
        </Card>
      </div>
    </div>
  );
}

// ─── MEMBER DASHBOARD ────────────────────────────────────────────
function MemberDashboard({ user, tasks, logs }) {
  const myT = tasks.filter(t=>t.assignedTo===user.id);
  const myL = logs.filter(l=>l.userId===user.id);
  const done = myT.filter(t=>t.status==="completed").length;
  const ip   = myT.filter(t=>t.status==="in-progress").length;
  const od   = myT.filter(t=>t.deadline<fmt(today)&&t.status!=="completed").length;

  let pts=0;
  myT.forEach(t=>{
    if(t.status==="completed"){ pts+=10; if(t.completedAt<=t.deadline) pts+=5; }
    else if(t.deadline<fmt(today)) pts-=3;
  });
  pts=Math.max(0,pts+myL.length*2);
  const prog=myT.length?Math.round(done/myT.length*100):0;

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        <Stat icon="📋" label="Assigned Tasks" value={myT.length} color="#6366f1"/>
        <Stat icon="✅" label="Completed"      value={done}       color="#22c55e"/>
        <Stat icon="⚡" label="My Score"       value={`${pts}pt`} sub="Productivity" color={B}/>
        <Stat icon="⚠️" label="Overdue"        value={od}         color="#ef4444"/>
      </div>

      <Card style={{ padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>Weekly Progress</div>
          <div style={{ fontSize:14, color:B, fontWeight:800 }}>{prog}%</div>
        </div>
        <div style={{ height:10, background:"#f1f5f9", borderRadius:10, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${prog}%`, background:`linear-gradient(90deg,${B},#7dd3d8)`,
            borderRadius:10, transition:"width 0.6s ease" }}/>
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:8 }}>{done} of {myT.length} tasks completed this week</div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:14 }}>My Tasks</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {myT.filter(t=>t.status!=="completed").sort((a,b)=>a.deadline.localeCompare(b.deadline)).slice(0,5).map(task=>{
              const od = task.deadline<fmt(today);
              return (
                <div key={task.id} style={{ padding:"12px 14px", borderRadius:12,
                  border:"1px solid #f1f5f9", background:"#fafafa" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:8, marginBottom:6 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", lineHeight:1.3 }}>{task.title}</div>
                    <Pill type="priority" value={task.priority}/>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <Pill type="status" value={task.status}/>
                    <span style={{ fontSize:11, color:od?"#ef4444":"#94a3b8" }}>📅 {task.deadline}</span>
                  </div>
                </div>
              );
            })}
            {myT.filter(t=>t.status!=="completed").length===0&&(
              <div style={{ color:"#94a3b8", fontSize:13, textAlign:"center", padding:"16px 0" }}>All caught up! 🎉</div>
            )}
          </div>
        </Card>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:14 }}>Recent Activity</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[...myL].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(log=>(
              <div key={log.id} style={{ paddingBottom:10, borderBottom:"1px solid #f8fafc" }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{log.taskTitle}</div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>{log.timeSpent}h</div>
                </div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{log.description}</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{log.project} · {log.date}</div>
              </div>
            ))}
            {myL.length===0&&<div style={{ color:"#94a3b8", fontSize:13 }}>No activity logged yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── TASKS ───────────────────────────────────────────────────────
function TasksPage({ user, tasks, setTasks, users }) {
  const [modal, setModal] = useState(false);
  const [fStat, setFStat] = useState("all");
  const [fPri,  setFPri]  = useState("all");
  const [form,  setForm]  = useState({ title:"", description:"", assignedTo:"", priority:"medium", project:"", deadline:"" });

  const base     = user.role==="admin" ? tasks : tasks.filter(t=>t.assignedTo===user.id);
  const filtered = base.filter(t=>(fStat==="all"||t.status===fStat)&&(fPri==="all"||t.priority===fPri));

  const upd = (id, s) => setTasks(p=>p.map(t=>t.id===id?{...t,status:s,completedAt:s==="completed"?fmt(today):t.completedAt}:t));
  const del = (id)    => setTasks(p=>p.filter(t=>t.id!==id));
  const create = () => {
    if(!form.title||!form.assignedTo) return;
    setTasks(p=>[...p,{id:"t"+Date.now(),...form,status:"pending",createdAt:fmt(today),completedAt:null}]);
    setForm({title:"",description:"",assignedTo:"",priority:"medium",project:"",deadline:""});
    setModal(false);
  };

  return (
    <div style={{ padding:"24px 28px" }}>
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        {user.role==="admin"&&(
          <button onClick={()=>setModal(true)} style={{ padding:"10px 18px", borderRadius:10, background:B,
            color:"white", border:"none", cursor:"pointer", fontSize:13, fontWeight:600 }}>+ New Task</button>
        )}
        <select value={fStat} onChange={e=>setFStat(e.target.value)} style={SEL}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={fPri} onChange={e=>setFPri(e.target.value)} style={SEL}>
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span style={{ fontSize:13, color:"#94a3b8", marginLeft:"auto" }}>{filtered.length} task{filtered.length!==1?"s":""}</span>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.length===0&&(
          <Card style={{ padding:40, textAlign:"center" }}>
            <div style={{ fontSize:30, marginBottom:8 }}>📭</div>
            <div style={{ color:"#94a3b8" }}>No tasks match your filters</div>
          </Card>
        )}
        {filtered.map(task=>{
          const asgn = users.find(u=>u.id===task.assignedTo);
          const late = task.deadline<fmt(today)&&task.status!=="completed";
          return (
            <Card key={task.id} style={{ padding:"16px 20px" }}>
              <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{task.title}</div>
                    {late&&<span style={{ fontSize:11, color:"#ef4444", fontWeight:600, background:"#fef2f2", padding:"2px 8px", borderRadius:20 }}>Overdue</span>}
                  </div>
                  <div style={{ fontSize:13, color:"#64748b", marginBottom:10, lineHeight:1.5 }}>{task.description}</div>
                  <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    <Pill type="priority" value={task.priority}/>
                    <Pill type="status" value={task.status}/>
                    <span style={{ fontSize:12, color:"#94a3b8" }}>📁 {task.project}</span>
                    <span style={{ fontSize:12, color:late?"#ef4444":"#94a3b8" }}>📅 {task.deadline}</span>
                    {asgn&&<div style={{ display:"flex", alignItems:"center", gap:6 }}><Av user={asgn} size={18}/><span style={{ fontSize:12, color:"#64748b" }}>{asgn.name}</span></div>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                  {task.status==="pending"&&<button onClick={()=>upd(task.id,"in-progress")} style={sBtn("#3b82f6")}>Start</button>}
                  {task.status==="in-progress"&&<button onClick={()=>upd(task.id,"completed")} style={sBtn("#22c55e")}>Complete</button>}
                  {task.status==="pending"&&<button onClick={()=>upd(task.id,"completed")} style={sBtn(B)}>Done</button>}
                  {user.role==="admin"&&<button onClick={()=>del(task.id)} style={sBtn("#ef4444")}>Delete</button>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {modal&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <Card style={{ padding:32, width:480, maxWidth:"100%" }}>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:20 }}>Create New Task</div>
            {[["Title","title","text"],["Description","description","text"],["Project","project","text"],["Deadline","deadline","date"]].map(([l,k,t])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{l}</label>
                <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:14, boxSizing:"border-box", outline:"none" }}/>
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Assign To</label>
              <select value={form.assignedTo} onChange={e=>setForm(f=>({...f,assignedTo:e.target.value}))} style={{...SEL,width:"100%"}}>
                <option value="">Select team member…</option>
                {users.filter(u=>u.role==="member").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:22 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Priority</label>
              <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{...SEL,width:"100%"}}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={create} style={{ flex:1, padding:"12px", borderRadius:10, background:B, color:"white", border:"none", cursor:"pointer", fontSize:14, fontWeight:600 }}>Create Task</button>
              <button onClick={()=>setModal(false)} style={{ flex:1, padding:"12px", borderRadius:10, background:"#f1f5f9", color:"#374151", border:"none", cursor:"pointer", fontSize:14, fontWeight:600 }}>Cancel</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── ACTIVITY LOG ────────────────────────────────────────────────
function ActivityLogPage({ user, users, logs, setLogs }) {
  const [form, setForm] = useState({ taskTitle:"", description:"", project:"", timeSpent:"" });
  const visible = user.role==="admin" ? logs : logs.filter(l=>l.userId===user.id);
  const sorted  = [...visible].sort((a,b)=>b.date.localeCompare(a.date));

  const add = () => {
    if(!form.taskTitle||!form.description) return;
    setLogs(p=>[...p,{id:"l"+Date.now(),userId:user.id,...form,timeSpent:parseFloat(form.timeSpent)||0,date:fmt(today)}]);
    setForm({taskTitle:"",description:"",project:"",timeSpent:""});
  };

  const grp = {};
  sorted.forEach(l=>{ (grp[l.date]=grp[l.date]||[]).push(l); });

  return (
    <div style={{ padding:"24px 28px", display:"flex", gap:22 }}>
      {user.role==="member"&&(
        <div style={{ width:320, flexShrink:0 }}>
          <Card style={{ padding:24, position:"sticky", top:82 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:20 }}>Log Today's Work</div>
            {[["Task / Work Title","taskTitle","text"],["What did you do?","description","textarea"],["Project","project","text"],["Time Spent (hrs)","timeSpent","number"]].map(([l,k,t])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{l}</label>
                {t==="textarea"
                  ? <textarea value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} rows={3}
                      style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:13, resize:"vertical", boxSizing:"border-box", outline:"none", fontFamily:"inherit" }}/>
                  : <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                      style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" }}/>
                }
              </div>
            ))}
            <button onClick={add} style={{ width:"100%", padding:"12px", borderRadius:10, background:B,
              color:"white", border:"none", cursor:"pointer", fontSize:14, fontWeight:600 }}>+ Log Activity</button>
          </Card>
        </div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        {Object.keys(grp).length===0&&(
          <Card style={{ padding:40, textAlign:"center" }}>
            <div style={{ fontSize:30, marginBottom:8 }}>📝</div>
            <div style={{ color:"#94a3b8" }}>No activity logged yet</div>
          </Card>
        )}
        {Object.entries(grp).map(([date, dl])=>(
          <div key={date} style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
              letterSpacing:"0.8px", marginBottom:10 }}>
              {date===fmt(today)?"Today":date===shift(-1)?"Yesterday":date}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {dl.map(log=>{
                const lu=users.find(u=>u.id===log.userId);
                return (
                  <Card key={log.id} style={{ padding:"16px 18px" }}>
                    <div style={{ display:"flex", gap:12 }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                        <Av user={lu} size={32}/>
                        <div style={{ width:2, flex:1, background:"#f1f5f9", borderRadius:2, minHeight:16, marginTop:4 }}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{log.taskTitle}</div>
                          <div style={{ fontSize:12, color:"#94a3b8", fontWeight:500 }}>{log.timeSpent}h</div>
                        </div>
                        {user.role==="admin"&&lu&&(
                          <div style={{ fontSize:12, color:B, fontWeight:600, marginBottom:3 }}>{lu.name}</div>
                        )}
                        <div style={{ fontSize:13, color:"#64748b", lineHeight:1.5 }}>{log.description}</div>
                        <div style={{ fontSize:11, color:"#94a3b8", marginTop:5 }}>📁 {log.project}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LEADERBOARD ─────────────────────────────────────────────────
function LeaderboardPage({ tasks, logs, users }) {
  const sc = useMemo(()=>computeScores(tasks,logs,users),[tasks,logs,users]);
  const [top, ...rest] = sc;
  const medals = ["🥇","🥈","🥉"];

  return (
    <div style={{ padding:"24px 28px" }}>
      {top&&(
        <Card style={{ padding:32, background:`linear-gradient(135deg,${B}12,#e8f4f5)`,
          borderColor:B+"30", marginBottom:22, textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:6 }}>🏆</div>
          <div style={{ fontSize:11, fontWeight:700, color:B, textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:14 }}>
            Team Member of the Week
          </div>
          <Av user={users.find(u=>u.id===top.userId)} size={64}/>
          <div style={{ fontSize:22, fontWeight:800, color:"#0f172a", marginTop:12 }}>{top.name}</div>
          <div style={{ fontSize:13, color:"#64748b", marginTop:3 }}>{top.title}</div>
          <div style={{ display:"flex", gap:28, justifyContent:"center", marginTop:18 }}>
            {[["Points", top.score, B],["Tasks", top.tasksCompleted,"#22c55e"],["Logs", top.logsCount,"#6366f1"]].map(([l,v,c])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:26, fontWeight:800, color:c }}>{v}</div>
                <div style={{ fontSize:12, color:"#94a3b8" }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ padding:24 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:18 }}>Full Rankings</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {sc.map((s,i)=>{
            const u=users.find(u=>u.id===s.userId);
            const max=sc[0]?.score||1;
            return (
              <div key={s.userId} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                borderRadius:14, background:i===0?"#fffbeb":"#fafafa",
                border:i===0?"1px solid #fde68a":"1px solid #f1f5f9" }}>
                <div style={{ fontSize:i<3?22:16, fontWeight:700, width:32, textAlign:"center",
                  color:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#cd7c2f":"#cbd5e1" }}>
                  {i<3?medals[i]:`#${i+1}`}
                </div>
                <Av user={u} size={40}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{s.name}</div>
                  <div style={{ height:6, background:"#e2e8f0", borderRadius:6, marginTop:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(s.score/max)*100}%`,
                      background:i===0?"#f59e0b":B, borderRadius:6, transition:"width 0.5s" }}/>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:17, fontWeight:800, color:"#0f172a" }}>{s.score}<span style={{ fontSize:11, color:"#94a3b8", fontWeight:400 }}>pt</span></div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{s.tasksCompleted}✓ · {s.logsCount}📝</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:18, padding:"12px 16px", background:"#f8fafc", borderRadius:12, fontSize:12, color:"#64748b" }}>
          <strong style={{ color:"#0f172a" }}>Scoring:</strong>&nbsp;
          +10 completed task · +5 early bonus · −3 overdue · +2 per activity log
        </div>
      </Card>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────
function ReportsPage({ tasks, logs, users }) {
  const sc = useMemo(()=>computeScores(tasks,logs,users),[tasks,logs,users]);
  const members = users.filter(u=>u.role==="member");

  const byMember = members.map(u=>({
    name: u.name.split(" ")[0],
    completed: tasks.filter(t=>t.assignedTo===u.id&&t.status==="completed").length,
    total: tasks.filter(t=>t.assignedTo===u.id).length,
  }));

  const trend = [
    {week:"W1",score:38},{week:"W2",score:52},{week:"W3",score:47},
    {week:"W4",score:63},{week:"W5",score:70},{week:"W6",score:78},
  ];

  const compl  = tasks.filter(t=>t.status==="completed").length;
  const totHrs = logs.reduce((s,l)=>s+(l.timeSpent||0),0);

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        <Stat icon="📈" label="Total Points"      value={sc.reduce((s,u)=>s+u.score,0)} color={B}/>
        <Stat icon="✅" label="Completion Rate"    value={`${Math.round(compl/tasks.length*100)}%`} color="#22c55e"/>
        <Stat icon="📝" label="Activity Entries"   value={logs.length} color="#6366f1"/>
        <Stat icon="⏱" label="Hours Logged"        value={`${totHrs.toFixed(1)}h`} color="#f59e0b"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:18 }}>Tasks Completed per Member</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={byMember} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0"}}/>
              <Bar dataKey="completed" name="Completed" fill={B} radius={[6,6,0,0]}/>
              <Bar dataKey="total" name="Total" fill="#e2e8f0" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:18 }}>Productivity Trend (6 Weeks)</div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="week" tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0"}}/>
              <Line type="monotone" dataKey="score" stroke={B} strokeWidth={3} dot={{fill:B,r:4}} activeDot={{r:6}}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{ padding:24 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Weekly Report Summary</div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"2px solid #f1f5f9" }}>
              {["Team Member","Role","Tasks Done","Logs","Score","Rank"].map(h=>(
                <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700,
                  color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sc.map((s,i)=>{
              const u=users.find(u=>u.id===s.userId);
              return (
                <tr key={s.userId} style={{ borderBottom:"1px solid #f8fafc" }}>
                  <td style={{ padding:"12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Av user={u} size={26}/><span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:"12px", fontSize:13, color:"#64748b" }}>{u?.title}</td>
                  <td style={{ padding:"12px", fontSize:13, fontWeight:700, color:"#22c55e" }}>{s.tasksCompleted}</td>
                  <td style={{ padding:"12px", fontSize:13, color:"#64748b" }}>{s.logsCount}</td>
                  <td style={{ padding:"12px", fontSize:14, fontWeight:800, color:B }}>{s.score}pt</td>
                  <td style={{ padding:"12px" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#cd7c2f":"#94a3b8" }}>
                      {["🥇 #1","🥈 #2","🥉 #3"][i]||`#${i+1}`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── TEAM ────────────────────────────────────────────────────────
function TeamPage({ users, setUsers }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", password:"pass123", role:"member", title:"" });

  const add = () => {
    if(!form.name||!form.email) return;
    const av = form.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
    setUsers(p=>[...p,{id:"u"+Date.now(),...form,avatar:av}]);
    setForm({name:"",email:"",password:"pass123",role:"member",title:""});
    setModal(false);
  };

  return (
    <div style={{ padding:"24px 28px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <div style={{ fontSize:13, color:"#64748b" }}>{users.length} members total</div>
        <button onClick={()=>setModal(true)} style={{ padding:"10px 18px", borderRadius:10, background:B,
          color:"white", border:"none", cursor:"pointer", fontSize:13, fontWeight:600 }}>+ Add Member</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:14 }}>
        {users.map(u=>(
          <Card key={u.id} style={{ padding:24, textAlign:"center" }}>
            <Av user={u} size={54}/>
            <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginTop:12 }}>{u.name}</div>
            <div style={{ fontSize:13, color:"#64748b" }}>{u.title||(u.role==="admin"?"Administrator":"Team Member")}</div>
            <span style={{ display:"inline-block", marginTop:8, fontSize:11, fontWeight:600,
              padding:"3px 12px", borderRadius:20,
              background:u.role==="admin"?B+"18":"#f1f5f9", color:u.role==="admin"?B:"#64748b" }}>
              {u.role==="admin"?"Admin":"Member"}
            </span>
            <div style={{ fontSize:12, color:"#94a3b8", marginTop:8 }}>{u.email}</div>
          </Card>
        ))}
      </div>

      {modal&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <Card style={{ padding:32, width:440, maxWidth:"100%" }}>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:20 }}>Add Team Member</div>
            {[["Full Name","name"],["Email","email"],["Job Title","title"],["Password","password"]].map(([l,k])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{l}</label>
                <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:14, boxSizing:"border-box", outline:"none" }}/>
              </div>
            ))}
            <div style={{ marginBottom:22 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Role</label>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{...SEL,width:"100%"}}>
                <option value="member">Team Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={add} style={{ flex:1, padding:"12px", borderRadius:10, background:B, color:"white", border:"none", cursor:"pointer", fontSize:14, fontWeight:600 }}>Add Member</button>
              <button onClick={()=>setModal(false)} style={{ flex:1, padding:"12px", borderRadius:10, background:"#f1f5f9", color:"#374151", border:"none", cursor:"pointer", fontSize:14, fontWeight:600 }}>Cancel</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────
function SettingsPage({ user }) {
  return (
    <div style={{ padding:"24px 28px", maxWidth:580 }}>
      <Card style={{ padding:32, marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:22 }}>Account Settings</div>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:26,
          padding:20, background:"#f8fafc", borderRadius:14 }}>
          <Av user={user} size={54}/>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:"#0f172a" }}>{user.name}</div>
            <div style={{ fontSize:13, color:"#64748b" }}>{user.email}</div>
            <span style={{ marginTop:6, display:"inline-block", fontSize:11, fontWeight:600,
              padding:"3px 12px", borderRadius:20, background:B+"18", color:B }}>
              {user.role==="admin"?"Administrator":user.title}
            </span>
          </div>
        </div>
        {["Full Name","Email Address","Job Title"].map((f,i)=>(
          <div key={f} style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{f}</label>
            <input defaultValue={[user.name, user.email, user.title][i]}
              style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #e2e8f0",
                fontSize:14, boxSizing:"border-box", outline:"none", background:"#fafafa" }}/>
          </div>
        ))}
        <button style={{ marginTop:8, padding:"12px 24px", borderRadius:10, background:B,
          color:"white", border:"none", cursor:"pointer", fontSize:14, fontWeight:600 }}>
          Save Changes
        </button>
      </Card>
      <Card style={{ padding:32 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Scoring Rules</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[["✅ Task Completed","+10 points","#22c55e"],["⚡ Early Completion","+5 bonus","#22c55e"],["⚠️ Overdue Task","−3 points","#ef4444"],["📝 Activity Log Entry","+2 points","#22c55e"]].map(([l,v,c])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px",
              background:"#f8fafc", borderRadius:10 }}>
              <span style={{ fontSize:13, color:"#374151" }}>{l}</span>
              <span style={{ fontSize:13, fontWeight:700, color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────
function Login({ users, onLogin }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");

  const go = () => {
    const u = users.find(u=>u.email===email&&u.password===pass);
    if(u) onLogin(u); else setErr("Invalid email or password.");
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a1628 0%,#0f2832 50%,#0a1628 100%)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:400, maxWidth:"100%" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:58, height:58, borderRadius:18, background:B, display:"flex",
            alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <span style={{ color:"white", fontSize:28, fontWeight:800 }}>P</span>
          </div>
          <div style={{ color:"white", fontSize:21, fontWeight:800 }}>Prowess Digital Solutions</div>
          <div style={{ color:"#4b6470", fontSize:14, marginTop:4 }}>Internal Team Dashboard</div>
        </div>
        <Card style={{ padding:34 }}>
          <div style={{ fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:4 }}>Sign in</div>
          <div style={{ fontSize:14, color:"#64748b", marginBottom:26 }}>Access your workspace</div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="you@prowess.com" onKeyDown={e=>e.key==="Enter"&&go()}
              style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1px solid #e2e8f0",
                fontSize:14, boxSizing:"border-box", outline:"none" }}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Password</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
              placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&go()}
              style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1px solid #e2e8f0",
                fontSize:14, boxSizing:"border-box", outline:"none" }}/>
          </div>
          {err&&<div style={{ fontSize:13, color:"#ef4444", marginBottom:14, padding:"10px 14px",
            background:"#fef2f2", borderRadius:8 }}>{err}</div>}
          <button onClick={go} style={{ width:"100%", padding:"13px", borderRadius:10, background:B,
            color:"white", border:"none", cursor:"pointer", fontSize:15, fontWeight:700 }}>Sign In →</button>
          <div style={{ marginTop:22, padding:16, background:"#f8fafc", borderRadius:10,
            fontSize:12, color:"#64748b", lineHeight:1.7 }}>
            <div style={{ fontWeight:700, color:"#374151", marginBottom:6 }}>Demo Accounts</div>
            <div><strong>Admin:</strong> admin@prowess.com / admin123</div>
            <div><strong>Member:</strong> chidi@prowess.com / pass123</div>
            <div style={{ color:"#94a3b8" }}>amaka@ · emeka@ · fatima@ — all use pass123</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────
export default function App() {
  const [user,  setUser]  = useState(null);
  const [page,  setPage]  = useState("dashboard");
  const [users, setUsers] = useState(SEED_USERS);
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [logs,  setLogs]  = useState(SEED_LOGS);

  useEffect(()=>{ if(user) setPage("dashboard"); },[user?.id]);

  if(!user) return <Login users={users} onLogin={setUser}/>;

  const content = () => {
    switch(page){
      case "dashboard":   return user.role==="admin"
        ? <AdminDashboard tasks={tasks} logs={logs} users={users} setPage={setPage}/>
        : <MemberDashboard user={user} tasks={tasks} logs={logs}/>;
      case "tasks":       return <TasksPage user={user} tasks={tasks} setTasks={setTasks} users={users}/>;
      case "activity":    return <ActivityLogPage user={user} users={users} logs={logs} setLogs={setLogs}/>;
      case "leaderboard": return <LeaderboardPage tasks={tasks} logs={logs} users={users}/>;
      case "reports":     return <ReportsPage tasks={tasks} logs={logs} users={users}/>;
      case "team":        return user.role==="admin"?<TeamPage users={users} setUsers={setUsers}/>:null;
      case "settings":    return <SettingsPage user={user}/>;
      default:            return null;
    }
  };

  return (
    <div style={{ display:"flex", height:"100vh", background:"#f0f4f5",
      fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <Sidebar user={user} page={page} setPage={setPage} onLogout={()=>setUser(null)}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <TopBar user={user} page={page}/>
        <div style={{ flex:1, overflowY:"auto" }}>{content()}</div>
      </div>
    </div>
  );
}

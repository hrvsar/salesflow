import { useState, useRef, useEffect } from "react";

// ─── Supabase client (no npm needed — using REST API directly) ────────────────
const SUPA_URL = "https://ptlfwojszcnfzsijkutg.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bGZ3b2pzemNuZnpzaWprdXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1Nzg3MTQsImV4cCI6MjA4NzE1NDcxNH0.vPybKL7VPCBe1rBErmLpsQq3IvUoUnn2wLsVMqon7dc";

// Auth helpers
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  "apikey": SUPA_KEY,
  "Authorization": `Bearer ${token || SUPA_KEY}`,
});

async function sbAuth(action, body) {
  const res = await fetch(`${SUPA_URL}/auth/v1/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPA_KEY },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sbSelect(table, token, filter = "") {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${filter}&order=created_at.asc`, {
    headers: authHeaders(token),
  });
  return res.json();
}

async function sbInsert(table, token, data) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...authHeaders(token), "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function sbUpdate(table, token, id, data) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function sbDelete(table, token, id) {
  await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}


// ─── Team helpers ─────────────────────────────────────────────────────────────
async function sbGetTeam(token) {
  const res = await fetch(`${SUPA_URL}/rest/v1/team_members?select=*&order=created_at.asc`, {
    headers: authHeaders(token),
  });
  return res.json();
}

async function sbInviteMember(token, ownerId, email, role, marketIds) {
  const res = await fetch(`${SUPA_URL}/rest/v1/team_members`, {
    method: "POST",
    headers: { ...authHeaders(token), "Prefer": "return=representation", "Content-Type": "application/json" },
    body: JSON.stringify({ owner_id: ownerId, email: email.toLowerCase().trim(), role, market_ids: marketIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.hint || JSON.stringify(data));
  return Array.isArray(data) ? data : [data];
}

async function sbUpdateMember(token, id, role, marketIds) {
  const res = await fetch(`${SUPA_URL}/rest/v1/team_members?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Prefer": "return=representation" },
    body: JSON.stringify({ role, market_ids: marketIds }),
  });
  return res.json();
}

async function sbDeleteMember(token, id) {
  await fetch(`${SUPA_URL}/rest/v1/team_members?id=eq.${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// ─── Products helpers ────────────────────────────────────────────────────────
async function sbGetProducts(token) {
  const res = await fetch(`${SUPA_URL}/rest/v1/products?select=*&order=name.asc`, {
    headers: authHeaders(token),
  });
  return res.json();
}

async function sbInsertProduct(token, ownerId, name, sku) {
  const res = await fetch(`${SUPA_URL}/rest/v1/products`, {
    method: "POST",
    headers: { ...authHeaders(token), "Prefer": "return=representation" },
    body: JSON.stringify({ owner_id: ownerId, name: name.trim(), sku: sku||"" }),
  });
  return res.json();
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = [
  { id:"todo",       label:"To Do",       color:"#64748B" },
  { id:"inprogress", label:"In Progress", color:"#2563EB" },
  { id:"done",       label:"Done",        color:"#16A34A" },
];
const PRIORITIES = {
  high:   { label:"High",   color:"#DC2626" },
  medium: { label:"Medium", color:"#D97706" },
  low:    { label:"Low",    color:"#16A34A" },
};
const RETAILER_TYPES = ["Department Store","Specialty","Online","Boutique","Outlet"];
const MKT_COLORS = ["#2563EB","#DC2626","#D97706","#7C3AED","#DB2777","#0D9488","#059669","#EA580C"];
const MKT_FLAGS  = ["🇬🇧","🇫🇷","🇩🇪","🇮🇹","🇪🇸","🇺🇸","🇯🇵","🇨🇳","🇦🇺","🇧🇷","🇨🇦","🇰🇷","🇳🇱","🇧🇪","🇨🇭","🇦🇹","🇸🇪","🇳🇴","🇩🇰","🇵🇱","🌍","🌎","🌏"];

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputSt  = { background:"#F8FAFC", border:"1px solid #E2E8F0", color:"#0F172A", borderRadius:8, padding:"8px 11px", fontFamily:"inherit", fontSize:13, outline:"none" };
const labelSt  = { fontSize:10, color:"#94A3B8", fontWeight:800, textTransform:"uppercase", letterSpacing:1.1, display:"block", marginBottom:4 };
const btnPri   = (c) => ({ background:c, border:"none", color:"#fff", borderRadius:9, padding:"9px 18px", cursor:"pointer", fontWeight:800, fontSize:13, fontFamily:"inherit" });
const btnGhost = { background:"#F1F5F9", border:"none", color:"#64748B", borderRadius:9, padding:"9px 14px", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" };

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const s = STATUSES.find(x=>x.id===status)||STATUSES[0];
  return <span style={{ background:s.color+"22", color:s.color, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{s.label}</span>;
}
function PriorityDot({ priority }) {
  const p = PRIORITIES[priority]||PRIORITIES.low;
  return <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:7, height:7, borderRadius:"50%", background:p.color, display:"inline-block", flexShrink:0 }}/><span style={{ fontSize:11, color:p.color, fontWeight:600 }}>{p.label}</span></span>;
}
function ProgressBar({ value, color }) {
  return <div style={{ height:4, background:"#E2E8F0", borderRadius:4, overflow:"hidden", width:"100%" }}><div style={{ height:"100%", width:`${value}%`, background:color, borderRadius:4, transition:"width 0.4s" }}/></div>;
}
function Chevron({ open }) {
  return <span style={{ color:"#CBD5E1", fontSize:11, display:"inline-block", transition:"transform 0.2s", transform:open?"rotate(90deg)":"rotate(0deg)" }}>▶</span>;
}
function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
      <div style={{ width:32, height:32, border:"3px solid #E2E8F0", borderTop:"3px solid #2563EB", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Login / Signup Screen ────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode,     setMode]     = useState("login"); // login | signup
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const submit = async () => {
    if (!email.trim() || !password.trim()) { setError("Please enter email and password."); return; }
    setLoading(true); setError(""); setSuccess("");
    const action = mode === "login" ? "token?grant_type=password" : "signup";
    const data = await sbAuth(action, { email: email.trim(), password });
    setLoading(false);
    if (data.error || data.msg) {
      setError(data.error_description || data.msg || "Something went wrong.");
    } else if (data.access_token) {
      // Signed up or logged in successfully — go straight in
      onLogin({ token: data.access_token, email: data.user?.email, id: data.user?.id });
    } else if (mode === "signup") {
      setSuccess("Account created! Check your email to confirm, then log in.");
      setMode("login");
    } else {
      setError("Unexpected response. Please try again.");
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0F172A 0%,#1E3A5F 60%,#0D9488 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 36px", width:380, boxShadow:"0 40px 100px rgba(0,0,0,0.35)" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#2563EB,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>💼</div>
          <div>
            <div style={{ fontWeight:900, fontSize:20, color:"#0F172A", letterSpacing:-0.5 }}>SalesFlow</div>
            <div style={{ fontSize:11, color:"#94A3B8", letterSpacing:0.3 }}>Sales Task Manager</div>
          </div>
        </div>

        <div style={{ fontWeight:800, fontSize:18, color:"#0F172A", marginBottom:4 }}>
          {mode === "login" ? "Welcome back" : "Create account"}
        </div>
        <div style={{ fontSize:13, color:"#94A3B8", marginBottom:24 }}>
          {mode === "login" ? "Sign in to your workspace" : "Set up your SalesFlow workspace"}
        </div>

        {error   && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:16 }}>{error}</div>}
        {success && <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", color:"#16A34A", borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:16 }}>{success}</div>}

        <div style={{ marginBottom:14 }}>
          <label style={labelSt}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="you@company.com" style={{...inputSt, width:"100%", boxSizing:"border-box"}} />
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={labelSt}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="••••••••" style={{...inputSt, width:"100%", boxSizing:"border-box"}} />
        </div>

        <button onClick={submit} disabled={loading} style={{ ...btnPri("#2563EB"), width:"100%", padding:"13px", fontSize:15, opacity:loading?0.7:1 }}>
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div style={{ textAlign:"center", marginTop:18, fontSize:13, color:"#64748B" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setSuccess("");}}
            style={{ color:"#2563EB", fontWeight:700, cursor:"pointer" }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ photos, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx(i=>(i-1+photos.length)%photos.length);
  const next = () => setIdx(i=>(i+1)%photos.length);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:4000 }}>
      <div onClick={e=>e.stopPropagation()} style={{ position:"relative", maxWidth:"90vw", maxHeight:"90vh", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <img src={photos[idx].url} alt={photos[idx].caption||"Photo"} style={{ maxWidth:"88vw", maxHeight:"78vh", borderRadius:12, objectFit:"contain", boxShadow:"0 24px 60px rgba(0,0,0,0.6)" }} />
        {photos[idx].caption && <div style={{ color:"rgba(255,255,255,0.7)", fontSize:13 }}>{photos[idx].caption}</div>}
        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>{idx+1} / {photos.length}</div>
        {photos.length > 1 && <>
          <button onClick={prev} style={{ position:"absolute", left:-52, top:"40%", background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:"50%", width:40, height:40, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <button onClick={next} style={{ position:"absolute", right:-52, top:"40%", background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:"50%", width:40, height:40, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
        </>}
        <button onClick={onClose} style={{ position:"absolute", top:-16, right:-16, background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
      </div>
    </div>
  );
}

// ─── Photo Section ────────────────────────────────────────────────────────────
function PhotoSection({ photos, setPhotos, color }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const fileRef = useRef(null);
  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => setPhotos(prev=>[...prev,{ id: Math.random().toString(36).slice(2), url:e.target.result, caption:"", uploadedAt:new Date().toLocaleDateString() }]);
      reader.readAsDataURL(file);
    });
  };
  const onDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{...labelSt, marginBottom:10}}>Photos ({photos.length})</label>
      <div onDrop={onDrop} onDragOver={e=>e.preventDefault()} onClick={()=>fileRef.current.click()}
        style={{ border:"2px dashed #E2E8F0", borderRadius:10, padding:"16px", textAlign:"center", cursor:"pointer", marginBottom:10, background:"#FAFBFC" }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=color;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#E2E8F0";}}>
        <div style={{ fontSize:22, marginBottom:3 }}>📷</div>
        <div style={{ fontSize:12, fontWeight:700, color:"#64748B" }}>Click or drag & drop photos</div>
        <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>Shelf shots, planograms, in-store photos</div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={e=>handleFiles(e.target.files)} style={{ display:"none" }} />
      </div>
      {photos.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {photos.map((photo,i) => (
            <div key={photo.id} style={{ position:"relative", borderRadius:9, overflow:"hidden", border:"1px solid #E2E8F0" }}>
              <img src={photo.url} alt="task" onClick={()=>setLightboxIdx(i)} style={{ width:"100%", aspectRatio:"4/3", objectFit:"cover", cursor:"pointer", display:"block" }} />
              <input value={photo.caption} onChange={e=>setPhotos(prev=>prev.map(p=>p.id===photo.id?{...p,caption:e.target.value}:p))}
                placeholder="Caption…" style={{ width:"100%", boxSizing:"border-box", border:"none", borderTop:"1px solid #E2E8F0", padding:"4px 8px", fontSize:11, color:"#374151", background:"#fff", outline:"none", fontFamily:"inherit" }} />
              <button onClick={()=>setPhotos(prev=>prev.filter(p=>p.id!==photo.id))} style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,0.55)", border:"none", color:"#fff", borderRadius:"50%", width:20, height:20, cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              <div style={{ position:"absolute", top:4, left:4, background:"rgba(0,0,0,0.45)", color:"#fff", fontSize:9, borderRadius:4, padding:"2px 5px", fontWeight:600 }}>{photo.uploadedAt}</div>
            </div>
          ))}
        </div>
      )}
      {lightboxIdx !== null && <Lightbox photos={photos} startIdx={lightboxIdx} onClose={()=>setLightboxIdx(null)} />}
    </div>
  );
}

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({ task, store, retailer, market, onClose, onSave, onDelete }) {
  const [t, setT]         = useState({ ...task, photos: task.photos || [], comments: task.comments || [] });
  const [comment, setComment] = useState("");
  const [saving,  setSaving]  = useState(false);
  const addComment = () => { if (!comment.trim()) return; setT(p=>({...p,comments:[...p.comments,comment.trim()]})); setComment(""); };
  const setPhotos  = (fn) => setT(p=>({...p,photos:typeof fn==="function"?fn(p.photos):fn}));
  const handleSave = async () => { setSaving(true); await onSave(t); setSaving(false); onClose(); };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:18, width:560, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ background:market.color, padding:"22px 26px 18px", borderRadius:"18px 18px 0 0", position:"sticky", top:0, zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ color:"rgba(255,255,255,0.75)", fontSize:11, fontWeight:700, marginBottom:6 }}>
                {market.flag} {market.name} › {retailer.name}{store?` › ${store.name}`:" · Account-level"}
              </div>
              <input value={t.title} onChange={e=>setT({...t,title:e.target.value})}
                style={{ background:"transparent", border:"none", outline:"none", fontSize:19, fontWeight:800, color:"#fff", fontFamily:"inherit", width:"100%" }} />
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginLeft:12 }}>✕</button>
          </div>
        </div>
        <div style={{ padding:"22px 26px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:18 }}>
            <div><label style={labelSt}>Status</label>
              <select value={t.status} onChange={e=>setT({...t,status:e.target.value})} style={{...inputSt,width:"100%"}}>
                {STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div><label style={labelSt}>Priority</label>
              <select value={t.priority} onChange={e=>setT({...t,priority:e.target.value})} style={{...inputSt,width:"100%"}}>
                {Object.entries(PRIORITIES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div><label style={labelSt}>Due Date</label>
              <input type="date" value={t.due||""} onChange={e=>setT({...t,due:e.target.value})} style={{...inputSt,width:"100%",boxSizing:"border-box"}} />
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={labelSt}>Notes</label>
            <textarea value={t.description||""} onChange={e=>setT({...t,description:e.target.value})} rows={3}
              style={{...inputSt,width:"100%",boxSizing:"border-box",resize:"vertical",lineHeight:1.6}} />
          </div>
          <PhotoSection photos={t.photos} setPhotos={setPhotos} color={market.color} />
          <div style={{ marginBottom:18 }}>
            <label style={{...labelSt,marginBottom:10}}>Comments ({t.comments.length})</label>
            {t.comments.map((c,i)=>(
              <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:market.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, flexShrink:0 }}>U</div>
                <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"7px 11px", fontSize:13, color:"#374151", flex:1 }}>{c}</div>
              </div>
            ))}
            <div style={{ display:"flex", gap:8, marginTop:6 }}>
              <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()}
                placeholder="Write a comment…" style={{...inputSt,flex:1}} />
              <button onClick={addComment} style={btnPri(market.color)}>Post</button>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <button onClick={()=>{onDelete(task.id);onClose();}} style={{...btnGhost,color:"#DC2626",background:"#FEF2F2"}}>Delete</button>
            <button onClick={handleSave} disabled={saving} style={{...btnPri(market.color),opacity:saving?0.7:1}}>
              {saving?"Saving…":"Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Task Inline ──────────────────────────────────────────────────────────
function AddTaskInline({ storeId, retailerId, color, onAdd }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title:"", status:"todo", priority:"medium", due:"" });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!f.title.trim()) return;
    setSaving(true);
    await onAdd({ ...f, storeId, retailerId, description:"", comments:[], photos:[] });
    setF({ title:"", status:"todo", priority:"medium", due:"" });
    setSaving(false); setOpen(false);
  };
  if (!open) return (
    <div onClick={()=>setOpen(true)} style={{ padding:"9px 16px", fontSize:12, color:"#94A3B8", cursor:"pointer", borderTop:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:6 }}
      onMouseEnter={e=>e.currentTarget.style.color=color} onMouseLeave={e=>e.currentTarget.style.color="#94A3B8"}>
      <span style={{ fontWeight:700, fontSize:15 }}>+</span> Add task
    </div>
  );
  return (
    <div style={{ padding:"10px 14px", borderTop:"1px solid #E2E8F0", background:"#F8FAFC", display:"flex", flexWrap:"wrap", gap:6, alignItems:"flex-end" }}>
      <input value={f.title} onChange={e=>setF({...f,title:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()}
        placeholder="Task title…" autoFocus style={{...inputSt,flex:"1 1 150px"}} />
      <select value={f.status} onChange={e=>setF({...f,status:e.target.value})} style={inputSt}>
        {STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <select value={f.priority} onChange={e=>setF({...f,priority:e.target.value})} style={inputSt}>
        {Object.entries(PRIORITIES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
      </select>
      <input type="date" value={f.due} onChange={e=>setF({...f,due:e.target.value})} style={inputSt}/>
      <button onClick={submit} disabled={saving} style={{...btnPri(color),opacity:saving?0.7:1}}>{saving?"Adding…":"Add"}</button>
      <button onClick={()=>setOpen(false)} style={btnGhost}>✕</button>
    </div>
  );
}

// ─── Account Task List (retailer-level tasks) ─────────────────────────────────
function AccountTaskList({ tasks, market, retailer, onTaskClick, onAddTask }) {
  const [open,   setOpen]   = useState(true);
  const [adding, setAdding] = useState(false);
  const [f,      setF]      = useState({ title:"", status:"todo", priority:"medium", due:"" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!f.title.trim()) return;
    setSaving(true);
    await onAddTask({ ...f, retailerId:retailer.id, storeId:null, description:"", comments:[], photos:[] });
    setF({ title:"", status:"todo", priority:"medium", due:"" });
    setSaving(false); setAdding(false);
  };

  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 2px 6px" }}>
        <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", flex:1 }}>
          <Chevron open={open} />
          <span style={{ fontSize:11, fontWeight:800, color:"#64748B", textTransform:"uppercase", letterSpacing:0.8 }}>Account Tasks</span>
          <span style={{ fontSize:10, color:"#94A3B8", background:"#E2E8F0", borderRadius:20, padding:"0 7px" }}>{tasks.length}</span>
        </div>
        <button onClick={()=>setAdding(a=>!a)} style={{ fontSize:11, color:market.color, background:market.color+"12", border:`1px solid ${market.color}33`, borderRadius:7, padding:"3px 10px", cursor:"pointer", fontWeight:700, fontFamily:"inherit" }}>+ Task</button>
      </div>
      {open && (
        <div style={{ border:"1px solid #E2E8F0", borderRadius:10, overflow:"hidden", background:"#fff" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 90px 100px 60px", padding:"6px 14px", background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
            {["Task","Status","Priority","Due","",""].map(h=><span key={h} style={{ fontSize:9, color:"#94A3B8", fontWeight:800, textTransform:"uppercase", letterSpacing:1 }}>{h}</span>)}
          </div>
          {tasks.length===0&&!adding&&<div style={{ padding:"12px 16px", color:"#CBD5E1", fontSize:12, textAlign:"center" }}>No account-level tasks yet</div>}
          {tasks.map((task,i)=>(
            <div key={task.id}
              style={{ display:"grid", gridTemplateColumns:"1fr 110px 90px 100px 60px 32px", padding:"10px 14px", borderBottom:i===tasks.length-1&&!adding?"none":"1px solid #F1F5F9", transition:"background 0.12s", alignItems:"center" }}
              onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <span onClick={()=>onTaskClick(task)} style={{ fontWeight:600, fontSize:13, color:task.status==="done"?"#CBD5E1":"#1E293B", textDecoration:task.status==="done"?"line-through":"none", cursor:"pointer" }}>{task.title}</span>
              <StatusPill status={task.status} />
              <PriorityDot priority={task.priority} />
              <span style={{ fontSize:12, color:"#94A3B8" }}>{task.due||"—"}</span>
              <span style={{ fontSize:11, color:"#94A3B8" }}>{(task.photos||[]).length>0&&`📷${task.photos.length}`}</span>
              <button onClick={async(e)=>{e.stopPropagation();if(!window.confirm("Delete this task?"))return;onDeleteTask&&onDeleteTask(task.id);}} style={{ background:"none", border:"none", color:"#DC2626", cursor:"pointer", fontSize:13, padding:"2px 4px", opacity:0.5, fontFamily:"inherit" }} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.5"}>🗑</button>
            </div>
          ))}
          {adding && (
            <div style={{ padding:"10px 14px", borderTop:"1px solid #E2E8F0", background:"#F8FAFC", display:"flex", flexWrap:"wrap", gap:6, alignItems:"flex-end" }}>
              <input value={f.title} onChange={e=>setF({...f,title:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()}
                placeholder="Task title…" autoFocus style={{...inputSt,flex:"1 1 150px"}}/>
              <select value={f.status} onChange={e=>setF({...f,status:e.target.value})} style={inputSt}>
                {STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <select value={f.priority} onChange={e=>setF({...f,priority:e.target.value})} style={inputSt}>
                {Object.entries(PRIORITIES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              <input type="date" value={f.due} onChange={e=>setF({...f,due:e.target.value})} style={inputSt}/>
              <button onClick={submit} disabled={saving} style={{...btnPri(market.color),opacity:saving?0.7:1}}>{saving?"…":"Add"}</button>
              <button onClick={()=>setAdding(false)} style={btnGhost}>✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─── Week helpers ─────────────────────────────────────────────────────────────
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay()||7));
  const yearStart = new Date(d.getFullYear(),0,1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
function getWeekBounds(weekNum, year) {
  // Find Monday of that ISO week
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay()||7) + 1);
  const monday = new Date(startOfWeek1);
  monday.setDate(startOfWeek1.getDate() + (weekNum - 1) * 7);
  const wednesday = new Date(monday); wednesday.setDate(monday.getDate() + 2);
  const sunday    = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString("en-GB",{day:"numeric",month:"short"});
  return { monday, wednesday, sunday, label: `${fmt(monday)} – ${fmt(sunday)}`, due: wednesday.toISOString().slice(0,10) };
}
function isWeekComplete(w) {
  return w.wtd !== null && w.wtd !== "" &&
         w.lywtd !== null && w.lywtd !== "" &&
         w.best_product_name && w.best_product_name.trim() !== "" &&
         w.best_product_revenue !== null && w.best_product_revenue !== "" &&
         w.had_promotion !== null &&
         w.had_ba !== null;
}

// ─── Weekly Updates Section ───────────────────────────────────────────────────
function WeeklyUpdatesSection({ store, token, color, products }) {
  const [updates,   setUpdates]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAll,   setShowAll]   = useState(false);
  const [expanded,  setExpanded]  = useState({});
  const [saving,    setSaving]    = useState({});

  const now  = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  // Generate all weeks from week 1 to current week
  const allWeeks = [];
  for (let w = 1; w <= currentWeek; w++) {
    allWeeks.push({ weekNum: w, year: currentYear });
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(
        `${SUPA_URL}/rest/v1/weekly_updates?store_id=eq.${store.id}&select=*&order=week_number.desc`,
        { headers: { "Content-Type":"application/json", "apikey": SUPA_KEY, "Authorization": `Bearer ${token}` } }
      );
      const data = await res.json();
      setUpdates(Array.isArray(data) ? data : []);
      // Auto-expand current week
      setExpanded({ [`${currentYear}-${currentWeek}`]: true });
      setLoading(false);
    }
    load();
  }, [store.id]);

  const getUpdate = (weekNum, year) => updates.find(u => u.week_number === weekNum && u.year === year);

  const saveUpdate = async (weekNum, year, fields) => {
    const key = `${year}-${weekNum}`;
    setSaving(p => ({...p, [key]: true}));
    const bounds = getWeekBounds(weekNum, year);
    const existing = getUpdate(weekNum, year);
    if (existing) {
      const res = await fetch(`${SUPA_URL}/rest/v1/weekly_updates?id=eq.${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json", "apikey":SUPA_KEY, "Authorization":`Bearer ${token}`, "Prefer":"return=representation" },
        body: JSON.stringify(fields),
      });
      const [row] = await res.json();
      if (row) setUpdates(p => p.map(u => u.id === row.id ? row : u));
    } else {
      const res = await fetch(`${SUPA_URL}/rest/v1/weekly_updates`, {
        method: "POST",
        headers: { "Content-Type":"application/json", "apikey":SUPA_KEY, "Authorization":`Bearer ${token}`, "Prefer":"return=representation" },
        body: JSON.stringify({ store_id: store.id, week_number: weekNum, year, week_start: bounds.monday.toISOString().slice(0,10), week_end: bounds.sunday.toISOString().slice(0,10), ...fields }),
      });
      const [row] = await res.json();
      if (row) setUpdates(p => [...p, row]);
    }
    setSaving(p => ({...p, [key]: false}));
  };

  const toggleExpand = (key) => setExpanded(p => ({...p, [key]: !p[key]}));

  const visibleWeeks = showAll
    ? [...allWeeks].reverse()
    : [...allWeeks].reverse().filter(({weekNum, year}) => {
        const u = getUpdate(weekNum, year);
        return !u || u.status !== "closed";
      });

  const openCount   = allWeeks.filter(({weekNum,year}) => { const u = getUpdate(weekNum,year); return !u || u.status !== "closed"; }).length;
  const closedCount = allWeeks.filter(({weekNum,year}) => { const u = getUpdate(weekNum,year); return u && u.status === "closed"; }).length;

  return (
    <div style={{ borderTop:"2px solid #F1F5F9", padding:"14px 16px", background:"#FAFBFC" }}>
      {/* Section header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <span style={{ fontSize:11, fontWeight:800, color:"#64748B", textTransform:"uppercase", letterSpacing:0.8 }}>📅 Weekly Updates</span>
        <span style={{ fontSize:10, background:"#FEE2E2", color:"#DC2626", borderRadius:20, padding:"0 8px", fontWeight:700 }}>{openCount} open</span>
        <span style={{ fontSize:10, background:"#DCFCE7", color:"#16A34A", borderRadius:20, padding:"0 8px", fontWeight:700 }}>{closedCount} closed</span>
        <button onClick={()=>setShowAll(s=>!s)} style={{ marginLeft:"auto", fontSize:11, color:"#64748B", background:"none", border:"1px solid #E2E8F0", borderRadius:7, padding:"3px 10px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
          {showAll ? "Show less ▲" : "Show all ▼"}
        </button>
      </div>

      {loading && <div style={{ color:"#94A3B8", fontSize:12, textAlign:"center", padding:10 }}>Loading…</div>}

      {!loading && visibleWeeks.map(({weekNum, year}) => {
        const key     = `${year}-${weekNum}`;
        const bounds  = getWeekBounds(weekNum, year);
        const update  = getUpdate(weekNum, year) || {};
        const closed  = update.status === "closed";
        const complete = isWeekComplete(update);
        const isCurrentWeek = weekNum === currentWeek && year === currentYear;
        const isOpen  = expanded[key];

        const statusColor = closed ? "#16A34A" : "#DC2626";
        const statusBg    = closed ? "#DCFCE7"  : "#FEE2E2";
        const statusLabel = closed ? "✓ Closed"  : isCurrentWeek ? "⚠ Due Wed" : "Open";

        return (
          <div key={key} style={{ border:`1.5px solid ${closed?"#BBF7D0":"#FECACA"}`, borderRadius:10, marginBottom:8, overflow:"hidden", background:"#fff" }}>
            {/* Week header row */}
            <div onClick={()=>toggleExpand(key)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", background: closed?"#F0FDF4": isCurrentWeek?"#FFF7ED":"#fff" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:statusBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:900, color:statusColor }}>W{weekNum}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color: closed?"#16A34A":"#DC2626" }}>
                  Week {weekNum} {isCurrentWeek && <span style={{ fontSize:10, background:"#F59E0B22", color:"#D97706", borderRadius:20, padding:"1px 8px", fontWeight:700, marginLeft:4 }}>Current</span>}
                </div>
                <div style={{ fontSize:11, color:"#94A3B8" }}>{bounds.label} · Due {bounds.due}</div>
              </div>
              <span style={{ fontSize:10, background:statusBg, color:statusColor, borderRadius:20, padding:"2px 10px", fontWeight:700 }}>{statusLabel}</span>
              <button onClick={async(e)=>{e.stopPropagation();if(!window.confirm("Delete Week "+weekNum+" data?"))return; const u=getUpdate(weekNum,year); if(u&&u.id){const delUrl=SUPA_URL+"/rest/v1/weekly_updates?id=eq."+u.id;await fetch(delUrl,{method:"DELETE",headers:authHeaders(token)});setUpdates(p=>p.filter(x=>x.id!==u.id));} }} style={{ background:"none", border:"none", color:"#DC2626", cursor:"pointer", fontSize:12, padding:"2px 6px", opacity:0.5 }} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.5"}>🗑</button>
              <Chevron open={isOpen}/>
            </div>

            {/* Expanded form */}
            {isOpen && !closed && (
              <WeekForm weekNum={weekNum} year={year} update={update} color={color}
                saving={!!saving[key]} onSave={(fields)=>saveUpdate(weekNum,year,fields)} products={products}/>
            )}
            {isOpen && closed && (
              <WeekSummary update={update} color={color}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Week Form (editable) ─────────────────────────────────────────────────────
function WeekForm({ weekNum, year, update, color, saving, onSave, products }) {
  const [f, setF] = useState({
    wtd:                update.wtd ?? "",
    lywtd:              update.lywtd ?? "",
    best_product_name:  update.best_product_name ?? "",
    best_product_revenue: update.best_product_revenue ?? "",
    had_promotion:      update.had_promotion ?? null,
    had_ba:             update.had_ba ?? null,
  });
  const [lastSaved, setLastSaved] = useState(null);

  const complete = isWeekComplete(f);

  const save = async (extra = {}) => {
    await onSave({...f, ...extra});
    setLastSaved(new Date().toLocaleTimeString());
  };
  const close = async () => {
    if (!complete) return;
    await onSave({...f, status:"closed"});
  };

  const numFld = (key, label, placeholder) => (
    <div>
      <label style={labelSt}>{label}</label>
      <input type="number" value={f[key]} onChange={e=>setF(p=>({...p,[key]:e.target.value}))}
        onBlur={()=>save()} placeholder={placeholder}
        style={{...inputSt, width:"100%", boxSizing:"border-box"}}/>
    </div>
  );

  const yesNo = (key, label) => (
    <div>
      <label style={labelSt}>{label}</label>
      <div style={{ display:"flex", gap:6 }}>
        {[true, false].map(val => (
          <button key={String(val)} onClick={()=>{ setF(p=>({...p,[key]:val})); setTimeout(()=>save({[key]:val}),0); }}
            style={{ flex:1, padding:"7px", border:`2px solid ${f[key]===val?color:"#E2E8F0"}`, background:f[key]===val?color+"15":"#fff", color:f[key]===val?color:"#64748B", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" }}>
            {val?"Yes":"No"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding:"14px 16px", borderTop:"1px solid #E2E8F0", background:"#FEFEFE" }}>

      {/* ── Manual fields ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        {numFld("wtd",   "WTD Sales (£)",  "e.g. 12500")}
        {numFld("lywtd", "LYWTD Sales (£)","e.g. 11800")}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div>
          <label style={labelSt}>Best Selling Product</label>
          {products && products.length > 0 ? (
            <select value={f.best_product_name} onChange={e=>{setF(p=>({...p,best_product_name:e.target.value}));setTimeout(()=>save(),100);}}
              style={{...inputSt, width:"100%", boxSizing:"border-box"}}>
              <option value="">— Select product —</option>
              {products.map(p=><option key={p.id} value={p.name}>{p.name}{p.sku?" ("+p.sku+")":""}</option>)}
            </select>
          ) : (
            <input value={f.best_product_name} onChange={e=>setF(p=>({...p,best_product_name:e.target.value}))}
              onBlur={()=>save()} placeholder="Product name… (import products CSV to get dropdown)"
              style={{...inputSt, width:"100%", boxSizing:"border-box"}}/>
          )}
        </div>
        <div>
          <label style={labelSt}>Product Revenue (£)</label>
          <input type="number" value={f.best_product_revenue} onChange={e=>setF(p=>({...p,best_product_revenue:e.target.value}))}
            onBlur={()=>save()} placeholder="e.g. 3200"
            style={{...inputSt, width:"100%", boxSizing:"border-box"}}/>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
        {yesNo("had_promotion", "Promotions this week?")}
        {yesNo("had_ba",        "BA in store this week?")}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#94A3B8" }}>{lastSaved ? `Auto-saved ${lastSaved}` : "Fields save automatically on blur"}</span>
        <button onClick={close} disabled={!complete || saving}
          style={{ background:complete?"#16A34A":"#E2E8F0", border:"none", color:complete?"#fff":"#94A3B8", borderRadius:9, padding:"8px 20px", cursor:complete?"pointer":"not-allowed", fontWeight:800, fontSize:13, fontFamily:"inherit", transition:"all 0.2s" }}>
          {saving ? "Saving…" : complete ? "✓ Close Week" : "Fill all fields to close"}
        </button>
      </div>
    </div>
  );
}

// ─── Week Summary (read-only closed view) ────────────────────────────────────
function WeekSummary({ update, color }) {
  const fmt = (n) => n!=null ? `£${Number(n).toLocaleString()}` : "—";
  const vs = update.lywtd && update.wtd ? ((update.wtd - update.lywtd) / update.lywtd * 100).toFixed(1) : null;
  return (
    <div style={{ padding:"14px 16px", borderTop:"1px solid #BBF7D0", background:"#F0FDF4" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:10 }}>
        {[
          ["WTD", fmt(update.wtd)],
          ["LYWTD", fmt(update.lywtd)],
          ["vs LY", vs ? `${vs>0?"+":""}${vs}%` : "—"],
          ["Best Product Revenue", fmt(update.best_product_revenue)],
        ].map(([l,v])=>(
          <div key={l} style={{ background:"#fff", borderRadius:8, padding:"8px 10px", border:"1px solid #BBF7D0" }}>
            <div style={{ fontSize:10, color:"#64748B", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, marginBottom:2 }}>{l}</div>
            <div style={{ fontSize:14, fontWeight:900, color: l==="vs LY"?(vs>0?"#16A34A":"#DC2626"):"#0F172A" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, fontSize:12, color:"#374151" }}>
        <span>🏆 <strong>{update.best_product_name||"—"}</strong></span>
        <span style={{ color:"#94A3B8" }}>·</span>
        <span>Promo: <strong>{update.had_promotion?"Yes":"No"}</strong></span>
        <span style={{ color:"#94A3B8" }}>·</span>
        <span>BA: <strong>{update.had_ba?"Yes":"No"}</strong></span>
      </div>
    </div>
  );
}

// ─── Store Block ──────────────────────────────────────────────────────────────
function StoreBlock({ store, retailer, market, tasks, view, onTaskClick, onAddTask, onDeleteStore, token, isAdmin, products }) {
  const [open, setOpen] = useState(true);
  const myTasks = tasks.filter(t=>t.store_id===store.id||t.storeId===store.id);
  const done = myTasks.filter(t=>t.status==="done").length;
  const pct  = myTasks.length?Math.round(done/myTasks.length*100):0;
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", background:"#fff", border:"1px solid #E2E8F0", borderRadius:open?"10px 10px 0 0":"10px", userSelect:"none", borderLeft:`3px solid ${market.color}88` }}>
        <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, flex:1, cursor:"pointer", minWidth:0 }}>
          <span style={{ fontSize:13 }}>🏬</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:13, color:"#0F172A", marginBottom:2 }}>{store.name}</div>
            {store.address&&<div style={{ fontSize:11, color:"#94A3B8" }}>{store.address}</div>}
          </div>
          <span style={{ fontSize:11, color:"#94A3B8", marginRight:6 }}>{done}/{myTasks.length} done</span>
          <div style={{ width:50 }}><ProgressBar value={pct} color={market.color}/></div>
          <Chevron open={open}/>
        </div>
        {isAdmin && <button onClick={async(e)=>{ e.stopPropagation(); if(!window.confirm("Delete "+store.name+" and all its data?")) return; await sbDelete("stores",token,store.id); onDeleteStore&&onDeleteStore(store.id); }} style={{ ...btnGhost, fontSize:11, padding:"4px 9px", color:"#DC2626", background:"#FEF2F2", flexShrink:0, marginLeft:4 }}>🗑</button>}
      </div>
      {open && (
        <div style={{ border:"1px solid #E2E8F0", borderTop:"none", borderRadius:"0 0 10px 10px", overflow:"hidden", background:"#fff" }}>
          {view==="list" ? (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 90px 100px 60px", padding:"6px 14px", background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
                {["Task","Status","Priority","Due","",""].map(h=><span key={h} style={{ fontSize:9, color:"#94A3B8", fontWeight:800, textTransform:"uppercase", letterSpacing:1 }}>{h}</span>)}
              </div>
              {myTasks.length===0&&<div style={{ padding:"14px 16px", color:"#CBD5E1", fontSize:12, textAlign:"center" }}>No tasks yet</div>}
              {myTasks.map((task,i)=>(
                <div key={task.id}
                  style={{ display:"grid", gridTemplateColumns:"1fr 110px 90px 100px 60px 32px", padding:"10px 14px", borderBottom:i===myTasks.length-1?"none":"1px solid #F1F5F9", transition:"background 0.12s", alignItems:"center" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <span onClick={()=>onTaskClick(task)} style={{ fontWeight:600, fontSize:13, color:task.status==="done"?"#CBD5E1":"#1E293B", textDecoration:task.status==="done"?"line-through":"none", cursor:"pointer" }}>{task.title}</span>
                  <StatusPill status={task.status}/>
                  <PriorityDot priority={task.priority}/>
                  <span style={{ fontSize:12, color:"#94A3B8" }}>{task.due||"—"}</span>
                  <span style={{ fontSize:11, color:"#94A3B8" }}>{(task.photos||[]).length>0&&`📷${task.photos.length}`}</span>
                  <button onClick={async(e)=>{e.stopPropagation();if(!window.confirm("Delete this task?"))return;onDeleteTask&&onDeleteTask(task.id);}} style={{ background:"none", border:"none", color:"#DC2626", cursor:"pointer", fontSize:13, padding:"2px 4px", opacity:0.5, fontFamily:"inherit" }} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.5"}>🗑</button>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding:12, background:"#FAFBFC" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {STATUSES.map(status=>{
                  const col = myTasks.filter(t=>t.status===status.id);
                  return (
                    <div key={status.id}>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:7 }}>
                        <span style={{ width:7, height:7, borderRadius:"50%", background:status.color, display:"inline-block" }}/>
                        <span style={{ fontSize:10, fontWeight:800, color:"#64748B", textTransform:"uppercase", letterSpacing:0.8 }}>{status.label}</span>
                        <span style={{ marginLeft:"auto", fontSize:10, color:"#94A3B8", background:"#E2E8F0", borderRadius:20, padding:"0 6px" }}>{col.length}</span>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        {col.map(task=>(
                          <div key={task.id} onClick={()=>onTaskClick(task)}
                            style={{ background:"#fff", borderRadius:8, padding:"9px 11px", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.07)", borderTop:`2px solid ${market.color}`, transition:"box-shadow 0.15s" }}
                            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.12)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.07)"}>
                            <div style={{ fontWeight:700, fontSize:12, color:task.status==="done"?"#CBD5E1":"#1E293B", marginBottom:5, textDecoration:task.status==="done"?"line-through":"none" }}>{task.title}</div>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <PriorityDot priority={task.priority}/>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                {(task.photos||[]).length>0&&<span style={{ fontSize:10, color:"#94A3B8" }}>📷{task.photos.length}</span>}
                                {task.due&&<span style={{ fontSize:10, color:"#94A3B8" }}>{task.due}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                        {col.length===0&&<div style={{ border:"2px dashed #E2E8F0", borderRadius:7, padding:8, textAlign:"center", color:"#CBD5E1", fontSize:11 }}>Empty</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <AddTaskInline storeId={store.id} retailerId={retailer.id} color={market.color} onAdd={onAddTask}/>
          {(retailer.type?.toLowerCase()==="department store") && (
            <WeeklyUpdatesSection store={store} token={token} color={market.color} products={products||[]}/>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Retailer Block ───────────────────────────────────────────────────────────
function RetailerBlock({ retailer, market, stores, tasks, view, onTaskClick, onAddTask, onAddStore, onDeleteRetailer, onDeleteStore, onDeleteTask, token, isAdmin, products }) {
  const [open,         setOpen]         = useState(true);
  const [addingStore,  setAddingStore]  = useState(false);
  const [storeForm,    setStoreForm]    = useState({ name:"", address:"" });
  const [savingStore,  setSavingStore]  = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [editForm,     setEditForm]     = useState({ name: retailer.name, type: retailer.type });
  const [savingEdit,   setSavingEdit]   = useState(false);

  const saveEdit = async () => {
    if (!editForm.name.trim()) return;
    setSavingEdit(true);
    await sbUpdate("retailers", token, retailer.id, { name: editForm.name.trim(), type: editForm.type });
    retailer.name = editForm.name.trim();
    retailer.type = editForm.type;
    setSavingEdit(false);
    setEditing(false);
  };

  const myStores     = stores.filter(s=>(s.retailer_id||s.retailerId)===retailer.id);
  const allMyTasks   = tasks.filter(t=>(t.retailer_id||t.retailerId)===retailer.id);
  const accountTasks = allMyTasks.filter(t=>!t.store_id&&!t.storeId);
  const storeTasks   = allMyTasks.filter(t=>!!(t.store_id||t.storeId));
  const done = allMyTasks.filter(t=>t.status==="done").length;
  const pct  = allMyTasks.length?Math.round(done/allMyTasks.length*100):0;

  const submitStore = async () => {
    if (!storeForm.name.trim()) return;
    setSavingStore(true);
    await onAddStore({ ...storeForm, retailerId:retailer.id });
    setStoreForm({ name:"", address:"" }); setSavingStore(false); setAddingStore(false);
  };

  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", background:"#fff", border:"1px solid #E2E8F0", borderRadius:open?"12px 12px 0 0":"12px", borderLeft:`3px solid ${market.color}`, userSelect:"none" }}>
        <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, flex:1, cursor:"pointer" }}>
          <Chevron open={open}/>
          <span style={{ fontSize:16 }}>🏢</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:14, color:"#0F172A" }}>{retailer.name}</div>
            <div style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>{myStores.length} store{myStores.length!==1?"s":""} · {allMyTasks.length} tasks</div>
          </div>
          <span style={{ fontSize:11, background:"#F1F5F9", color:"#64748B", borderRadius:6, padding:"1px 8px", fontWeight:600, marginRight:6 }}>{retailer.type}</span>
          <span style={{ fontSize:11, color:"#94A3B8", marginRight:8 }}>{done}/{allMyTasks.length} done</span>
          <div style={{ width:60 }}><ProgressBar value={pct} color={market.color}/></div>
        </div>
        {isAdmin && <button onClick={()=>{ setEditForm({name:retailer.name,type:retailer.type}); setEditing(true); }} style={{ ...btnGhost, fontSize:11, padding:"5px 11px", flexShrink:0 }}>✏️ Edit</button>}
        {isAdmin && <button onClick={()=>setAddingStore(true)} style={{ ...btnGhost, fontSize:11, padding:"5px 11px", color:market.color, background:market.color+"12", border:`1px solid ${market.color}33`, flexShrink:0 }}>+ Store</button>}
        {isAdmin && <button onClick={async()=>{ if(!window.confirm("Delete "+retailer.name+" and all its data?")) return; await sbDelete("retailers",token,retailer.id); onDeleteRetailer&&onDeleteRetailer(retailer.id); }} style={{ ...btnGhost, fontSize:11, padding:"5px 11px", color:"#DC2626", background:"#FEF2F2", flexShrink:0 }}>🗑 Delete</button>}
      </div>
      {open && (
        <div style={{ border:"1px solid #E2E8F0", borderTop:"none", borderRadius:"0 0 12px 12px", padding:"12px", background:"#F8FAFC" }}>
          {editing && (
            <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:10, padding:"14px 16px", marginBottom:12, display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-end" }}>
              <div style={{ flex:"1 1 160px" }}>
                <label style={labelSt}>Retailer Name</label>
                <input value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))}
                  onKeyDown={e=>e.key==="Enter"&&saveEdit()} autoFocus
                  style={{...inputSt, width:"100%", boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={labelSt}>Type</label>
                <select value={editForm.type} onChange={e=>setEditForm(p=>({...p,type:e.target.value}))} style={inputSt}>
                  {RETAILER_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={saveEdit} disabled={savingEdit} style={{...btnPri(market.color), opacity:savingEdit?0.7:1}}>{savingEdit?"Saving…":"Save"}</button>
              <button onClick={()=>setEditing(false)} style={btnGhost}>Cancel</button>
            </div>
          )}
          <AccountTaskList tasks={accountTasks} market={market} retailer={retailer} onTaskClick={onTaskClick} onAddTask={onAddTask}/>
          {addingStore && (
            <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:10, padding:"13px 14px", marginBottom:10, marginTop:4, display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-end" }}>
              <div style={{ flex:"1 1 160px" }}>
                <label style={labelSt}>Store Name *</label>
                <input value={storeForm.name} onChange={e=>setStoreForm({...storeForm,name:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submitStore()}
                  placeholder="e.g. Harrods Knightsbridge" autoFocus style={{...inputSt,width:"100%",boxSizing:"border-box"}}/>
              </div>
              <div style={{ flex:"1 1 160px" }}>
                <label style={labelSt}>Address (optional)</label>
                <input value={storeForm.address} onChange={e=>setStoreForm({...storeForm,address:e.target.value})}
                  placeholder="e.g. 87 Brompton Rd" style={{...inputSt,width:"100%",boxSizing:"border-box"}}/>
              </div>
              <button onClick={submitStore} disabled={savingStore} style={{...btnPri(market.color),opacity:savingStore?0.7:1}}>{savingStore?"Saving…":"Add Store"}</button>
              <button onClick={()=>setAddingStore(false)} style={btnGhost}>✕</button>
            </div>
          )}
          {myStores.length===0&&!addingStore&&(
            <div style={{ border:"2px dashed #E2E8F0", borderRadius:10, padding:"14px", textAlign:"center", color:"#CBD5E1", fontSize:12, marginTop:4 }}>
              No stores yet — click <strong style={{ color:market.color }}>+ Store</strong> to add one
            </div>
          )}
          {myStores.map(store=>(
            <div key={store.id} style={{ marginTop:8 }}>
              <StoreBlock store={store} retailer={retailer} market={market} tasks={storeTasks} view={view} onTaskClick={onTaskClick} onAddTask={onAddTask} onDeleteStore={onDeleteStore} onDeleteTask={onDeleteTask} token={token} isAdmin={isAdmin} products={products}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Market Section ───────────────────────────────────────────────────────────
function MarketSection({ market, retailers, stores, tasks, view, onTaskClick, onAddTask, onAddStore, onAddRetailer, onDeleteRetailer, onDeleteStore, onDeleteTask, onDeleteMarket, token, isAdmin, products }) {
  const [open,       setOpen]       = useState(true);
  const [addingRet,  setAddingRet]  = useState(false);
  const [retForm,    setRetForm]    = useState({ name:"", type:"Department Store" });
  const [savingRet,  setSavingRet]  = useState(false);
  const [editingMkt, setEditingMkt] = useState(false);
  const [mktName,    setMktName]    = useState(market.name);
  const [savingMkt,  setSavingMkt]  = useState(false);

  const saveMktName = async () => {
    if (!mktName.trim() || mktName.trim()===market.name) { setEditingMkt(false); return; }
    setSavingMkt(true);
    await sbUpdate("markets", token, market.id, { name: mktName.trim() });
    market.name = mktName.trim();
    setSavingMkt(false);
    setEditingMkt(false);
  };

  const myRets   = retailers.filter(r=>(r.market_id||r.marketId)===market.id);
  const myStores = stores.filter(s=>myRets.some(r=>r.id===(s.retailer_id||s.retailerId)));
  const myTasks  = tasks.filter(t=>myRets.some(r=>r.id===(t.retailer_id||t.retailerId)));
  const done     = myTasks.filter(t=>t.status==="done").length;

  const submitRet = async () => {
    if (!retForm.name.trim()) return;
    setSavingRet(true);
    await onAddRetailer({ ...retForm, marketId:market.id });
    setRetForm({ name:"", type:"Department Store" }); setSavingRet(false); setAddingRet(false);
  };

  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", flex:1 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:market.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, boxShadow:`0 4px 10px ${market.color}44` }}>{market.flag}</div>
          <div>
            <div style={{ fontWeight:900, fontSize:17, color:"#0F172A", letterSpacing:-0.3 }}>{market.name}</div>
            <div style={{ fontSize:11, color:"#94A3B8" }}>{myRets.length} retailers · {myStores.length} stores · {myTasks.length} tasks · {done} done</div>
          </div>
          <span style={{ color:"#CBD5E1", fontSize:12, marginLeft:4, display:"inline-block", transition:"transform 0.2s", transform:open?"rotate(180deg)":"rotate(0deg)" }}>▼</span>
        </div>
        {isAdmin && !editingMkt && <>
          <button onClick={e=>{e.stopPropagation();setEditingMkt(true);setMktName(market.name);}} style={{ ...btnGhost, fontSize:11, padding:"4px 10px" }}>✏️</button>
          <button onClick={async e=>{e.stopPropagation();if(!window.confirm("Delete market '"+market.name+"' and ALL its data?"))return;await sbDelete("markets",token,market.id);onDeleteMarket&&onDeleteMarket(market.id);}} style={{ ...btnGhost, fontSize:11, padding:"4px 10px", color:"#DC2626", background:"#FEF2F2" }}>🗑</button>
        </>}
        {isAdmin && <button onClick={e=>{e.stopPropagation();setAddingRet(true);}} style={{ ...btnGhost, fontSize:12, color:market.color, background:market.color+"12", border:`1px solid ${market.color}33` }}>+ Retailer</button>}
      </div>
      {editingMkt && (
        <div style={{ display:"flex", gap:8, padding:"10px 14px", background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:10, marginBottom:8, alignItems:"center" }}>
          <input value={mktName} onChange={e=>setMktName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveMktName();if(e.key==="Escape")setEditingMkt(false);}} autoFocus style={{...inputSt, flex:1}}/>
          <button onClick={saveMktName} disabled={savingMkt} style={{...btnPri(market.color), opacity:savingMkt?0.7:1}}>{savingMkt?"Saving…":"Save"}</button>
          <button onClick={()=>setEditingMkt(false)} style={btnGhost}>Cancel</button>
        </div>
      )}
      {open && (
        <div style={{ paddingLeft:48 }}>
          {addingRet && (
            <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"13px 16px", marginBottom:10, display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-end" }}>
              <div style={{ flex:"1 1 160px" }}>
                <label style={labelSt}>Retailer Name</label>
                <input value={retForm.name} onChange={e=>setRetForm({...retForm,name:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submitRet()}
                  placeholder="e.g. Harrods" autoFocus style={{...inputSt,width:"100%",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={labelSt}>Type</label>
                <select value={retForm.type} onChange={e=>setRetForm({...retForm,type:e.target.value})} style={inputSt}>
                  {RETAILER_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={submitRet} disabled={savingRet} style={{...btnPri(market.color),opacity:savingRet?0.7:1}}>{savingRet?"Saving…":"Add"}</button>
              <button onClick={()=>setAddingRet(false)} style={btnGhost}>✕</button>
            </div>
          )}
          {myRets.length===0&&!addingRet&&(
            <div style={{ border:"2px dashed #E2E8F0", borderRadius:12, padding:20, textAlign:"center", color:"#CBD5E1", fontSize:13 }}>
              No retailers yet — click "+ Retailer" to add one
            </div>
          )}
          {myRets.map(ret=>(
            <RetailerBlock key={ret.id} retailer={ret} market={market} stores={stores} tasks={tasks}
              view={view} onTaskClick={onTaskClick} onAddTask={onAddTask} onAddStore={onAddStore} onAddRetailer={onAddRetailer} onDeleteRetailer={onDeleteRetailer} onDeleteStore={onDeleteStore} onDeleteTask={onDeleteTask} token={token} isAdmin={isAdmin} products={products}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Market Modal ─────────────────────────────────────────────────────────
function AddMarketModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [flag, setFlag] = useState("🇬🇧");
  const [color,setColor]= useState(MKT_COLORS[0]);
  const [saving,setSaving]=useState(false);
  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onAdd({ name:name.trim(), flag, color });
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:18, padding:28, width:400, boxShadow:"0 32px 80px rgba(0,0,0,0.18)" }}>
        <div style={{ fontWeight:900, fontSize:18, color:"#0F172A", marginBottom:18 }}>Add Market</div>
        <div style={{ marginBottom:14 }}>
          <label style={labelSt}>Market Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="e.g. Italy" autoFocus style={{...inputSt,width:"100%",boxSizing:"border-box"}}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelSt}>Flag</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {MKT_FLAGS.map(f=>(
              <button key={f} onClick={()=>setFlag(f)} style={{ background:flag===f?"#EFF6FF":"#F8FAFC", border:`2px solid ${flag===f?"#2563EB":"#E2E8F0"}`, borderRadius:7, padding:"5px 7px", cursor:"pointer", fontSize:17 }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:22 }}>
          <label style={labelSt}>Colour</label>
          <div style={{ display:"flex", gap:8 }}>
            {MKT_COLORS.map(c=>(
              <button key={c} onClick={()=>setColor(c)} style={{ width:28, height:28, borderRadius:"50%", background:c, border:`3px solid ${color===c?"#0F172A":"transparent"}`, cursor:"pointer" }}/>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:9 }}>
          <button onClick={onClose} style={{...btnGhost,flex:1}}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{...btnPri("#0F172A"),flex:2,fontSize:14,opacity:saving?0.7:1}}>{saving?"Adding…":"Add Market"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ markets, retailers, stores, tasks, selected, onSelect, onAddMarket, userEmail, onLogout, isAdmin, onTeam, onImportCSV, onImportProducts }) {
  return (
    <div style={{ width:210, minWidth:210, flexShrink:0, background:"#0F172A", display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>
      <div style={{ padding:"18px 16px 16px", borderBottom:"1px solid #1E293B", display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#2563EB,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>💼</div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:900, fontSize:14, color:"#F8FAFC", letterSpacing:-0.3 }}>SalesFlow</div>
          <div style={{ fontSize:9, color:"#475569", letterSpacing:0.5, textTransform:"uppercase", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userEmail}</div>
        </div>
      </div>
      <div style={{ padding:"14px 16px 6px", fontSize:9, color:"#334155", letterSpacing:2, fontWeight:800, textTransform:"uppercase" }}>Markets</div>
      <NavItem label="All Markets" icon="🌐" count={tasks.length} active={!selected} color="#2563EB" onClick={()=>onSelect(null)}/>
      {markets.map(m=>{
        const myRets   = retailers.filter(r=>(r.market_id||r.marketId)===m.id);
        const myStores = stores.filter(s=>myRets.some(r=>r.id===(s.retailer_id||s.retailerId)));
        const cnt      = tasks.filter(t=>myRets.some(r=>r.id===(t.retailer_id||t.retailerId))).length;
        return <NavItem key={m.id} label={m.name} icon={m.flag} count={cnt} active={selected===m.id} color={m.color} onClick={()=>onSelect(m.id)}/>;
      })}
      <div style={{ marginTop:"auto", padding:"12px 10px", borderTop:"1px solid #1E293B", display:"flex", flexDirection:"column", gap:6 }}>
        {isAdmin && onTeam && (
          <button onClick={onTeam} style={{ width:"100%", background:"none", border:"1px solid #1E293B", color:"#475569", borderRadius:9, padding:"8px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#7C3AED";e.currentTarget.style.color="#7C3AED";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#1E293B";e.currentTarget.style.color="#475569";}}>
            👥 Manage Team
          </button>
        )}
        {isAdmin && onAddMarket && (
          <button onClick={onAddMarket} style={{ width:"100%", background:"none", border:"2px dashed #1E293B", color:"#475569", borderRadius:9, padding:"8px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563EB";e.currentTarget.style.color="#2563EB";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#1E293B";e.currentTarget.style.color="#475569";}}>
            + Add Market
          </button>
        )}
        {isAdmin && onImportCSV && (
          <button onClick={onImportCSV} style={{ width:"100%", background:"none", border:"1px solid #1E293B", color:"#475569", borderRadius:9, padding:"8px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#16A34A";e.currentTarget.style.color="#16A34A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#1E293B";e.currentTarget.style.color="#475569";}}>
            📥 Import Stores
          </button>
        )}
        {isAdmin && onImportProducts && (
          <button onClick={onImportProducts} style={{ width:"100%", background:"none", border:"1px solid #1E293B", color:"#475569", borderRadius:9, padding:"8px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#7C3AED";e.currentTarget.style.color="#7C3AED";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#1E293B";e.currentTarget.style.color="#475569";}}>
            🛍️ Import Products
          </button>
        )}
        <button onClick={onLogout} style={{ width:"100%", background:"none", border:"none", color:"#475569", borderRadius:9, padding:"7px", cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function NavItem({ label, icon, count, active, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", cursor:"pointer", margin:"1px 6px", borderRadius:8,
        background:active?"#1E293B":hov?"#172033":"transparent",
        borderLeft:`3px solid ${active?color:"transparent"}`, transition:"all 0.12s" }}>
      <span style={{ fontSize:15 }}>{icon}</span>
      <span style={{ fontSize:12, fontWeight:active?800:500, color:active?"#F8FAFC":"#94A3B8", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</span>
      <span style={{ fontSize:10, color:"#475569", background:"#1E293B", borderRadius:20, padding:"0 7px", flexShrink:0 }}>{count}</span>
    </div>
  );
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────
function StatsStrip({ tasks }) {
  const total  = tasks.length;
  const done   = tasks.filter(t=>t.status==="done").length;
  const inprog = tasks.filter(t=>t.status==="inprogress").length;
  const high   = tasks.filter(t=>t.priority==="high"&&t.status!=="done").length;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
      {[
        { l:"Total Tasks",   v:total,               c:"#0F172A" },
        { l:"In Progress",   v:inprog,              c:"#2563EB" },
        { l:"Completed",     v:`${done} / ${total}`, c:"#16A34A" },
        { l:"High Priority", v:high,                c:"#DC2626" },
      ].map(s=>(
        <div key={s.l} style={{ background:"#fff", borderRadius:10, padding:"11px 14px", border:"1px solid #E2E8F0", borderTop:`3px solid ${s.c}` }}>
          <div style={{ fontSize:20, fontWeight:900, color:s.c, letterSpacing:-0.5 }}>{s.v}</div>
          <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, marginTop:1 }}>{s.l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Weekly Report Modal ──────────────────────────────────────────────────────
function WeeklyReportModal({ markets, retailers, stores, tasks, onClose }) {
  const [loading, setLoading] = useState(false);
  const [report,  setReport]  = useState(null);
  const [error,   setError]   = useState(null);
  const [copied,  setCopied]  = useState(false);

  const buildPrompt = () => {
    const week = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
    const marketSummaries = markets.map(market => {
      const myRets   = retailers.filter(r=>(r.market_id||r.marketId)===market.id);
      const myStores = stores.filter(s=>myRets.some(r=>r.id===(s.retailer_id||s.retailerId)));
      const myTasks  = tasks.filter(t=>myRets.some(r=>r.id===(t.retailer_id||t.retailerId)));
      const total=myTasks.length, done=myTasks.filter(t=>t.status==="done").length;
      const inprogress=myTasks.filter(t=>t.status==="inprogress").length;
      const todo=myTasks.filter(t=>t.status==="todo").length;
      const highPri=myTasks.filter(t=>t.priority==="high"&&t.status!=="done").length;
      const overdue=myTasks.filter(t=>t.due&&new Date(t.due)<new Date()&&t.status!=="done").length;
      const retailerDetails = myRets.map(ret => {
        const retTasks  = myTasks.filter(t=>(t.retailer_id||t.retailerId)===ret.id);
        const retStores = myStores.filter(s=>(s.retailer_id||s.retailerId)===ret.id);
        const taskLines = retTasks.map(t=>{
          const store = retStores.find(s=>s.id===(t.store_id||t.storeId));
          const loc   = store?` [${store.name}]`:" [Account-level]";
          const cmt   = (t.comments||[]).length>0?` — "${t.comments.slice(-1)[0]}"` :"";
          return `    • ${t.title}${loc} | ${t.status} | ${t.priority} | Due:${t.due||"none"}${cmt}`;
        }).join("\n");
        return `  ${ret.name} (${ret.type}) — ${retStores.length} stores, ${retTasks.length} tasks:\n${taskLines||"    No tasks yet."}`;
      }).join("\n\n");
      return `MARKET: ${market.flag} ${market.name}\nStats: ${total} total | ${done} done | ${inprogress} in progress | ${todo} to do | ${highPri} high priority open | ${overdue} overdue\n${retailerDetails}`;
    }).join("\n\n---\n");
    return `You are a senior sales analyst. Today is ${week}.\n\nSales task data:\n\n${marketSummaries}\n\nWrite a professional WEEKLY SALES REPORT with these sections:\n1. **Executive Summary**\n2. **Market-by-Market Breakdown**\n3. **Key Actions Required** (top 5, prioritised)\n4. **Risks & Watch Items**\n5. **Week Ahead Outlook**\n\nBe specific — use real retailer names, task names, deadlines. Professional tone.`;
  };

  const generate = async () => {
    setLoading(true); setError(null); setReport(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1500, messages:[{ role:"user", content:buildPrompt() }] })
      });
      if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e?.error?.message||"HTTP "+res.status); }
      const data = await res.json();
      const text = data.content.map(b=>b.text||"").join("");
      if (!text) throw new Error("Empty response");
      setReport(text);
    } catch(e) { setError("Failed: "+e.message); }
    finally { setLoading(false); }
  };

  const renderReport = (text) => text.split("\n").map((line,i)=>{
    if (/^\*\*(.+)\*\*/.test(line)) return <div key={i} style={{ marginTop:i===0?0:20, marginBottom:7, fontWeight:900, fontSize:15, color:"#0F172A", borderBottom:"2px solid #E2E8F0", paddingBottom:5 }}>{line.replace(/\*\*/g,"").replace(/^\d+\.\s*/,"")}</div>;
    if (/^[-•]\s/.test(line)||/^\d+\.\s/.test(line)) return <div key={i} style={{ display:"flex", gap:8, marginBottom:5, paddingLeft:4 }}><span style={{ color:"#94A3B8", flexShrink:0, fontSize:13 }}>•</span><span style={{ fontSize:13, color:"#374151", lineHeight:1.65 }}>{line.replace(/^[-•\d+.]\s+/,"").replace(/\*\*/g,"")}</span></div>;
    if (!line.trim()) return <div key={i} style={{ height:6 }}/>;
    return <p key={i} style={{ fontSize:13, color:"#374151", lineHeight:1.7, margin:"0 0 6px" }}>{line.replace(/\*\*/g,"")}</p>;
  });

  const week = new Date().toLocaleDateString("en-GB",{ day:"numeric", month:"long", year:"numeric" });
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:3000, backdropFilter:"blur(6px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:20, width:680, maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 40px 100px rgba(0,0,0,0.25)", overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%)", padding:"24px 28px 20px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:5 }}>AI Generated</div>
              <div style={{ fontWeight:900, fontSize:20, color:"#fff", letterSpacing:-0.4 }}>📊 Weekly Sales Report</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:3 }}>Week of {week}</div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", color:"#fff", borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {[["Markets",markets.length],["Total Tasks",tasks.length],["Completed",`${tasks.filter(t=>t.status==="done").length}/${tasks.length}`],["High Pri. Open",tasks.filter(t=>t.priority==="high"&&t.status!=="done").length]].map(([l,v])=>(
              <div key={l} style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 13px" }}>
                <div style={{ fontWeight:900, fontSize:18, color:"#fff" }}>{v}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginTop:1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          {!report&&!loading&&!error&&(
            <div style={{ textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:48, marginBottom:14 }}>🤖</div>
              <div style={{ fontWeight:800, fontSize:17, color:"#0F172A", marginBottom:8 }}>Generate your weekly report</div>
              <div style={{ fontSize:13, color:"#64748B", lineHeight:1.6, maxWidth:400, margin:"0 auto 24px" }}>Claude will analyse all your tasks across every market, retailer and store and write a professional report with key actions and risks.</div>
              <button onClick={generate} style={{ background:"linear-gradient(135deg,#0F172A,#1E3A5F)", border:"none", color:"#fff", borderRadius:12, padding:"14px 32px", cursor:"pointer", fontSize:15, fontWeight:800 }}>✨ Generate Report</button>
            </div>
          )}
          {loading&&<div style={{ textAlign:"center", padding:"40px 20px" }}><Spinner/><div style={{ fontWeight:700, fontSize:14, color:"#0F172A", marginTop:12 }}>Analysing your sales data…</div></div>}
          {error&&<div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"16px 20px", color:"#DC2626", fontSize:13 }}>{error}</div>}
          {report&&<div><div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:18 }}>{markets.map(m=><span key={m.id} style={{ background:m.color+"18", color:m.color, borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:700 }}>{m.flag} {m.name}</span>)}</div>{renderReport(report)}</div>}
        </div>
        <div style={{ padding:"14px 28px", borderTop:"1px solid #E2E8F0", display:"flex", gap:10, justifyContent:"space-between", flexShrink:0, background:"#F8FAFC" }}>
          <button onClick={generate} style={{...btnGhost,fontSize:13}}>{report?"🔄 Regenerate":"✨ Generate"}</button>
          <div style={{ display:"flex", gap:8 }}>
            {report&&<button onClick={()=>{navigator.clipboard.writeText(report);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{...btnGhost,fontSize:13,color:copied?"#16A34A":"#64748B"}}>{copied?"✓ Copied!":"📋 Copy"}</button>}
            <button onClick={onClose} style={{ background:"#0F172A", border:"none", color:"#fff", borderRadius:9, padding:"9px 20px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Products CSV Upload Modal ────────────────────────────────────────────────
function ProductsCSVModal({ onClose, onImport }) {
  const [step,     setStep]     = useState("upload");
  const [rows,     setRows]     = useState([]);
  const [errors,   setErrors]   = useState([]);
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);
  const fileRef = useRef();

  const parseCSV = (text) => {
    const lines = text.trim().split(/[\r\n]+/).filter(l=>l.trim());
    const rawHeaders = lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""));
    const headers = rawHeaders.map(h=>h.toLowerCase().replace(/ +/g,"_").replace(/[^a-z0-9_]/g,""));
    if (!headers.includes("name") && !headers.includes("product_name")) {
      setErrors([`Missing 'name' column. Your columns: ${rawHeaders.join(", ")}`]); return;
    }
    const nameCol = headers.includes("name") ? "name" : "product_name";
    const parsed = lines.slice(1).map((line,i) => {
      const vals = line.split(",").map(v=>v.trim().replace(/^"|"$/g,"").replace(/\r/g,""));
      const row = {};
      headers.forEach((h,j) => row[h] = vals[j]||"");
      return { name: row[nameCol]||row.name, sku: row.sku||row.product_code||"", _line: i+2 };
    }).filter(r=>r.name);
    setRows(parsed);
    setErrors([]);
    setStep("preview");
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target.result);
    reader.readAsText(file);
  };

  const importAll = async () => {
    setStep("importing");
    let count = 0;
    for (const row of rows) {
      await onImport(row.name, row.sku);
      count++;
      setProgress(Math.round(count/rows.length*100));
      setImported(count);
    }
    setStep("done");
  };

  const downloadTemplate = () => {
    const csv = "name,sku\nAGE Eye Cream,AGE-001\nUFO 2,UFO-002\nMOONMUSK,MM-003";
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "products_template.csv"; a.click();
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:3000, backdropFilter:"blur(6px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:20, width:580, maxHeight:"85vh", display:"flex", flexDirection:"column", boxShadow:"0 40px 100px rgba(0,0,0,0.25)", overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,#0F172A,#1E3A5F)", padding:"22px 28px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:900, fontSize:19, color:"#fff" }}>🛍️ Import Products</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginTop:3 }}>Bulk upload products for weekly update dropdowns</div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", color:"#fff", borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:16 }}>✕</button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          {step==="upload" && (
            <>
              <div onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()}
                onClick={()=>fileRef.current.click()}
                style={{ border:"2px dashed #CBD5E1", borderRadius:14, padding:"36px 20px", textAlign:"center", cursor:"pointer", marginBottom:20 }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#2563EB"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#CBD5E1"}>
                <div style={{ fontSize:40, marginBottom:12 }}>🛍️</div>
                <div style={{ fontWeight:800, fontSize:15, color:"#0F172A", marginBottom:6 }}>Drop your products CSV here</div>
                <div style={{ fontSize:12, color:"#94A3B8" }}>or click to browse</div>
                <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])}/>
              </div>
              {errors.length>0 && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 16px", color:"#DC2626", fontSize:13, marginBottom:16 }}>{errors.join("\n")}</div>}
              <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:12, padding:"16px 18px" }}>
                <div style={{ fontWeight:800, fontSize:13, color:"#0F172A", marginBottom:8 }}>Required CSV format</div>
                <div style={{ fontFamily:"monospace", fontSize:11, color:"#475569", background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, padding:"10px 12px", marginBottom:12, overflowX:"auto" }}>
                  name, sku<br/>AGE Eye Cream, AGE-001<br/>UFO 2, UFO-002
                </div>
                <div style={{ fontSize:11, color:"#64748B", marginBottom:10 }}>
                  <strong>name</strong> is required · <strong>sku</strong> is optional
                </div>
                <button onClick={downloadTemplate} style={{...btnGhost, fontSize:12}}>⬇️ Download Template</button>
              </div>
            </>
          )}

          {step==="preview" && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontWeight:800, fontSize:14, color:"#0F172A" }}>{rows.length} products to import</div>
                <button onClick={()=>setStep("upload")} style={{...btnGhost, fontSize:12}}>← Back</button>
              </div>
              <div style={{ border:"1px solid #E2E8F0", borderRadius:10, overflow:"hidden", marginBottom:20 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 120px", padding:"8px 14px", background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
                  {["Product Name","SKU"].map(h=><span key={h} style={{ fontSize:10, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:1 }}>{h}</span>)}
                </div>
                {rows.slice(0,20).map((row,i)=>(
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 120px", padding:"9px 14px", borderBottom:i===Math.min(rows.length,20)-1?"none":"1px solid #F1F5F9" }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>{row.name}</span>
                    <span style={{ fontSize:12, color:"#94A3B8" }}>{row.sku||"—"}</span>
                  </div>
                ))}
                {rows.length>20&&<div style={{ padding:"8px 14px", fontSize:11, color:"#94A3B8", textAlign:"center" }}>…and {rows.length-20} more</div>}
              </div>
              <button onClick={importAll} style={{...btnPri("#0F172A"), width:"100%", justifyContent:"center", padding:"12px"}}>
                Import {rows.length} products →
              </button>
            </>
          )}

          {step==="importing" && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <Spinner/>
              <div style={{ fontWeight:800, fontSize:16, color:"#0F172A", marginTop:16, marginBottom:8 }}>Importing…</div>
              <div style={{ fontSize:13, color:"#64748B", marginBottom:20 }}>{imported} of {rows.length} done</div>
              <div style={{ background:"#F1F5F9", borderRadius:99, height:8, overflow:"hidden" }}>
                <div style={{ background:"#0F172A", height:"100%", width:`${progress}%`, transition:"width 0.3s", borderRadius:99 }}/>
              </div>
            </div>
          )}

          {step==="done" && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
              <div style={{ fontWeight:900, fontSize:20, color:"#0F172A", marginBottom:8 }}>Products imported!</div>
              <div style={{ fontSize:13, color:"#64748B", marginBottom:24 }}>{imported} products added to your dropdown.</div>
              <button onClick={onClose} style={btnPri("#0F172A")}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CSV Upload Modal ──────────────────────────────────────────────────────────
function CSVUploadModal({ markets, onClose, onImport }) {
  const [step,     setStep]     = useState("upload"); // upload | preview | importing | done
  const [rows,     setRows]     = useState([]);
  const [errors,   setErrors]   = useState([]);
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);
  const fileRef = useRef();

  const REQUIRED_COLS = ["market","retailer","type","store_name"];

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/).filter(l=>l.trim());
    const rawHeaders = lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""));
    // Normalize headers: lowercase, spaces to underscores
    const headers = rawHeaders.map(h=>h.toLowerCase().replace(/ +/g,"_").replace(/[^a-z0-9_]/g,""));
    const missing = REQUIRED_COLS.filter(c=>!headers.includes(c));
    if (missing.length) { setErrors([`Missing columns: ${missing.join(", ")}. Your columns: ${rawHeaders.join(", ")}`]); return; }
    const parsed = lines.slice(1).map((line,i) => {
      const vals = line.split(",").map(v=>v.trim().replace(/^"|"$/g,"").replace(/\r/g,""));
      const row = {};
      headers.forEach((h,j) => row[h] = vals[j]||"");
      // Normalize type casing for matching
      if (row.type) row.type = RETAILER_TYPES.find(t=>t.toLowerCase()===row.type.toLowerCase()) || row.type;
      return { ...row, _line: i+2 };
    }).filter(r=>r.market&&r.retailer&&r.store_name);
    setRows(parsed);
    setErrors([]);
    setStep("preview");
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target.result);
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const importAll = async () => {
    setStep("importing");
    let count = 0;
    for (const row of rows) {
      await onImport(row);
      count++;
      setProgress(Math.round(count/rows.length*100));
      setImported(count);
    }
    setStep("done");
  };

  const downloadTemplate = () => {
    const csv = "market,retailer,type,store_name,address\nUK,Harrods,Department Store,Harrods Knightsbridge,87 Brompton Rd\nFrance,Galeries Lafayette,Department Store,Galeries Haussmann,40 Bd Haussmann";
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "salesflow_template.csv"; a.click();
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:3000, backdropFilter:"blur(6px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:20, width:640, maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 40px 100px rgba(0,0,0,0.25)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0F172A,#1E3A5F)", padding:"22px 28px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:900, fontSize:19, color:"#fff" }}>📥 Import from CSV</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginTop:3 }}>Bulk create retailers and stores from a spreadsheet</div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", color:"#fff", borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:16 }}>✕</button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>

          {step === "upload" && (
            <>
              {/* Drop zone */}
              <div onDrop={handleDrop} onDragOver={e=>e.preventDefault()}
                onClick={()=>fileRef.current.click()}
                style={{ border:"2px dashed #CBD5E1", borderRadius:14, padding:"40px 20px", textAlign:"center", cursor:"pointer", marginBottom:20, transition:"all 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#2563EB"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#CBD5E1"}>
                <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
                <div style={{ fontWeight:800, fontSize:15, color:"#0F172A", marginBottom:6 }}>Drop your CSV file here</div>
                <div style={{ fontSize:12, color:"#94A3B8" }}>or click to browse · CSV files only</div>
                <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])}/>
              </div>

              {errors.length>0 && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 16px", color:"#DC2626", fontSize:13, marginBottom:16 }}>{errors.join("\n")}</div>}

              {/* Template */}
              <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:12, padding:"16px 18px" }}>
                <div style={{ fontWeight:800, fontSize:13, color:"#0F172A", marginBottom:8 }}>Required CSV format</div>
                <div style={{ fontFamily:"monospace", fontSize:11, color:"#475569", background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, padding:"10px 12px", marginBottom:12, overflowX:"auto", whiteSpace:"nowrap" }}>
                  market, retailer, type, store_name, address<br/>
                  UK, Harrods, Department Store, Knightsbridge, 87 Brompton Rd<br/>
                  France, Galeries Lafayette, Department Store, Haussmann, 40 Bd Haussmann
                </div>
                <div style={{ fontSize:11, color:"#64748B", marginBottom:10 }}>
                  <strong>market</strong> must match an existing market name exactly · <strong>type</strong> can be: {RETAILER_TYPES.join(", ")}
                </div>
                <button onClick={downloadTemplate} style={{...btnGhost, fontSize:12}}>⬇️ Download Template</button>
              </div>
            </>
          )}

          {step === "preview" && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontWeight:800, fontSize:14, color:"#0F172A" }}>Preview — {rows.length} rows to import</div>
                <button onClick={()=>setStep("upload")} style={{...btnGhost, fontSize:12}}>← Back</button>
              </div>
              <div style={{ border:"1px solid #E2E8F0", borderRadius:10, overflow:"hidden", marginBottom:20 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", padding:"8px 14px", background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
                  {["Market","Retailer","Type","Store"].map(h=><span key={h} style={{ fontSize:10, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:1 }}>{h}</span>)}
                </div>
                {rows.slice(0,20).map((row,i)=>{
                  const mkt = markets.find(m=>m.name.toLowerCase()===row.market.toLowerCase());
                  return (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", padding:"9px 14px", borderBottom:i===Math.min(rows.length,20)-1?"none":"1px solid #F1F5F9", background:mkt?"#fff":"#FEF9F9" }}>
                      <span style={{ fontSize:12, color:mkt?"#0F172A":"#DC2626", fontWeight:600 }}>{row.market}{!mkt&&" ⚠"}</span>
                      <span style={{ fontSize:12, color:"#374151" }}>{row.retailer}</span>
                      <span style={{ fontSize:12, color:"#374151" }}>{row.type}</span>
                      <span style={{ fontSize:12, color:"#374151" }}>{row.store_name}</span>
                    </div>
                  );
                })}
                {rows.length>20&&<div style={{ padding:"8px 14px", fontSize:11, color:"#94A3B8", textAlign:"center" }}>…and {rows.length-20} more rows</div>}
              </div>
              {rows.some(r=>!markets.find(m=>m.name.toLowerCase()===r.market.toLowerCase())) && (
                <div style={{ background:"#FEF9C3", border:"1px solid #FDE047", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#854D0E", marginBottom:16 }}>
                  ⚠ Rows with red market names will be skipped — market must exist in SalesFlow first.
                </div>
              )}
              <button onClick={importAll} style={{...btnPri("#0F172A"), width:"100%", justifyContent:"center", padding:"12px"}}>
                Import {rows.length} rows →
              </button>
            </>
          )}

          {step === "importing" && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <Spinner/>
              <div style={{ fontWeight:800, fontSize:16, color:"#0F172A", marginTop:16, marginBottom:8 }}>Importing…</div>
              <div style={{ fontSize:13, color:"#64748B", marginBottom:20 }}>{imported} of {rows.length} rows done</div>
              <div style={{ background:"#F1F5F9", borderRadius:99, height:8, overflow:"hidden" }}>
                <div style={{ background:"#0F172A", height:"100%", width:`${progress}%`, transition:"width 0.3s", borderRadius:99 }}/>
              </div>
            </div>
          )}

          {step === "done" && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
              <div style={{ fontWeight:900, fontSize:20, color:"#0F172A", marginBottom:8 }}>Import complete!</div>
              <div style={{ fontSize:13, color:"#64748B", marginBottom:24 }}>{imported} retailers and stores created successfully.</div>
              <button onClick={onClose} style={btnPri("#0F172A")}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ─── Team Management Modal ────────────────────────────────────────────────────
function TeamModal({ user, markets, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState("manager");
  const [selMkts, setSelMkts] = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(null); // member id being edited

  useEffect(() => {
    sbGetTeam(user.token).then(data => {
      setMembers(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const toggleMarket = (id) => setSelMkts(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  const [inviteError, setInviteError] = useState("");
  const invite = async () => {
    if (!email.trim()) return;
    if (role === "manager" && selMkts.length === 0) { alert("Please select at least one market for this manager."); return; }
    setSaving(true); setInviteError("");
    try {
      const rows = await sbInviteMember(user.token, user.id, email.trim(), role, role==="admin"?[]:selMkts);
      const row = rows[0];
      if (row?.id) setMembers(p=>[...p, row]);
      setEmail(""); setRole("manager"); setSelMkts([]);
    } catch(e) {
      setInviteError(e.message || "Failed to invite. Try again.");
    }
    setSaving(false);
  };

  const updateMember = async (member) => {
    await sbUpdateMember(user.token, member.id, member.role, member.role==="admin"?[]:member.market_ids||[]);
    setMembers(p=>p.map(m=>m.id===member.id?member:m));
    setEditing(null);
  };

  const removeMember = async (id) => {
    await sbDeleteMember(user.token, id);
    setMembers(p=>p.filter(m=>m.id!==id));
  };

  const roleColor = (r) => r==="admin"?"#7C3AED":"#2563EB";
  const roleBg    = (r) => r==="admin"?"#F5F3FF":"#EFF6FF";

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:3000, backdropFilter:"blur(6px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:20, width:620, maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 40px 100px rgba(0,0,0,0.25)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0F172A,#1E3A5F)", padding:"22px 28px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:900, fontSize:19, color:"#fff", letterSpacing:-0.4 }}>👥 Team Management</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginTop:3 }}>Invite team members and control their access</div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", color:"#fff", borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>

          {/* Invite form */}
          <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:14, padding:"18px 20px", marginBottom:24 }}>
            <div style={{ fontWeight:800, fontSize:14, color:"#0F172A", marginBottom:14 }}>Invite a team member</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              <div style={{ flex:"1 1 200px" }}>
                <label style={labelSt}>Email address</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&invite()}
                  placeholder="colleague@company.com" style={{...inputSt, width:"100%", boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={labelSt}>Role</label>
                <select value={role} onChange={e=>setRole(e.target.value)} style={inputSt}>
                  <option value="admin">Admin — all markets</option>
                  <option value="manager">Manager — specific markets</option>
                </select>
              </div>
            </div>

            {role==="manager" && (
              <div style={{ marginBottom:14 }}>
                <label style={labelSt}>Assign markets</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {markets.map(m=>(
                    <button key={m.id} onClick={()=>toggleMarket(m.id)}
                      style={{ background:selMkts.includes(m.id)?m.color:"#fff", color:selMkts.includes(m.id)?"#fff":"#374151", border:`2px solid ${selMkts.includes(m.id)?m.color:"#E2E8F0"}`, borderRadius:20, padding:"5px 14px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", transition:"all 0.15s" }}>
                      {m.flag} {m.name}
                    </button>
                  ))}
                  {markets.length===0&&<span style={{ fontSize:12, color:"#94A3B8" }}>No markets created yet</span>}
                </div>
              </div>
            )}

            <button onClick={invite} disabled={saving} style={{...btnPri("#0F172A"), opacity:saving?0.7:1}}>
              {saving?"Inviting…":"Send Invite"}
            </button>
            {inviteError && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", borderRadius:8, padding:"8px 12px", fontSize:12, marginTop:8 }}>{inviteError}</div>}
            <div style={{ fontSize:11, color:"#94A3B8", marginTop:8 }}>
              The team member signs up at your app URL using this email. Their access is applied automatically.
            </div>
          </div>

          {/* Member list */}
          <div style={{ fontWeight:800, fontSize:14, color:"#0F172A", marginBottom:12 }}>Team members ({members.length})</div>
          {loading && <Spinner/>}
          {!loading && members.length===0 && (
            <div style={{ textAlign:"center", padding:"24px", color:"#CBD5E1", fontSize:13 }}>No team members yet — invite someone above</div>
          )}
          {members.map(member=>{
            const isEditing = editing===member.id;
            const memberMarkets = markets.filter(m=>(member.market_ids||[]).includes(m.id));
            return (
              <div key={member.id} style={{ border:"1px solid #E2E8F0", borderRadius:12, padding:"14px 16px", marginBottom:8, background:"#fff" }}>
                {isEditing ? (
                  <EditMemberRow member={member} markets={markets} onSave={updateMember} onCancel={()=>setEditing(null)}/>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#64748B", flexShrink:0 }}>
                      {member.email[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{member.email}</div>
                      <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                        <span style={{ background:roleBg(member.role), color:roleColor(member.role), borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:0.5 }}>
                          {member.role==="admin"?"Admin":"Manager"}
                        </span>
                        {member.role==="manager" && memberMarkets.map(m=>(
                          <span key={m.id} style={{ background:m.color+"15", color:m.color, borderRadius:20, padding:"2px 9px", fontSize:10, fontWeight:700 }}>{m.flag} {m.name}</span>
                        ))}
                        {member.role==="manager" && memberMarkets.length===0 && (
                          <span style={{ fontSize:10, color:"#F59E0B", fontWeight:600 }}>⚠ No markets assigned</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <button onClick={()=>setEditing(member.id)} style={{...btnGhost, fontSize:11, padding:"5px 11px"}}>Edit</button>
                      <button onClick={()=>removeMember(member.id)} style={{...btnGhost, fontSize:11, padding:"5px 11px", color:"#DC2626", background:"#FEF2F2"}}>Remove</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EditMemberRow({ member, markets, onSave, onCancel }) {
  const [role,    setRole]    = useState(member.role);
  const [selMkts, setSelMkts] = useState(member.market_ids||[]);
  const toggleMarket = (id) => setSelMkts(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"center" }}>
        <span style={{ fontWeight:700, fontSize:13, color:"#0F172A", flex:1 }}>{member.email}</span>
        <select value={role} onChange={e=>setRole(e.target.value)} style={{...inputSt, fontSize:12}}>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
        </select>
      </div>
      {role==="manager" && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
          {markets.map(m=>(
            <button key={m.id} onClick={()=>toggleMarket(m.id)}
              style={{ background:selMkts.includes(m.id)?m.color:"#fff", color:selMkts.includes(m.id)?"#fff":"#374151", border:`2px solid ${selMkts.includes(m.id)?m.color:"#E2E8F0"}`, borderRadius:20, padding:"4px 12px", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit" }}>
              {m.flag} {m.name}
            </button>
          ))}
        </div>
      )}
      <div style={{ display:"flex", gap:7 }}>
        <button onClick={()=>onSave({...member, role, market_ids:role==="admin"?[]:selMkts})} style={btnPri("#0F172A")}>Save</button>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
      </div>
    </div>
  );
}


// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user,       setUser]       = useState(null);
  const [myRole,     setMyRole]     = useState("admin"); // "admin" | "manager"
  const [myMarkets,  setMyMarkets]  = useState(null);    // null = all, array = restricted
  const [markets,    setMarkets]    = useState([]);
  const [retailers,  setRetailers]  = useState([]);
  const [stores,     setStores]     = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [selMarket,  setSelMarket]  = useState(null);
  const [view,       setView]       = useState("list");
  const [selTask,    setSelTask]     = useState(null);
  const [addingMkt,  setAddingMkt]  = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showTeam,   setShowTeam]   = useState(false);
  const [showCSV,    setShowCSV]    = useState(false);
  const [showProductsCSV, setShowProductsCSV] = useState(false);
  const [products,   setProducts]   = useState([]);

  const isAdmin = myRole === "admin";

  // ── Load all data from Supabase ──
  const loadData = async (token, userId, email) => {
    setLoading(true);
    // Fetch team entry for this specific email using anon key (bypasses RLS owner check)
    const myEntryRes = await fetch(
      `${SUPA_URL}/rest/v1/team_members?email=eq.${encodeURIComponent(email)}&select=*&limit=1`,
      { headers: { "Content-Type":"application/json", "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` } }
    );
    const myEntryData = await myEntryRes.json();
    const myTeamEntry = Array.isArray(myEntryData) && myEntryData.length > 0 ? myEntryData[0] : null;

    // Set role BEFORE loading data so filters apply correctly
    if (myTeamEntry && myTeamEntry.role === "manager") {
      setMyRole("manager");
      setMyMarkets(myTeamEntry.market_ids || []);
    } else if (myTeamEntry && myTeamEntry.role === "admin") {
      setMyRole("admin");
      setMyMarkets(null);
    } else {
      setMyRole("admin");
      setMyMarkets(null);
    }

    // Fetch all data - managers use anon key to bypass owner RLS
    // Market/retailer/store/task data is filtered in app by assigned market_ids
    const fetchKey = myTeamEntry?.role === "manager" ? SUPA_KEY : token;

    const [m, r, s, t, team, prods] = await Promise.all([
      sbSelect("markets",   fetchKey, "select=*"),
      sbSelect("retailers", fetchKey, "select=*"),
      sbSelect("stores",    fetchKey, "select=*"),
      sbSelect("tasks",     fetchKey, "select=*"),
      sbGetTeam(token),
      sbGetProducts(token),
    ]);

    const allMarkets   = Array.isArray(m) ? m : [];
    const allRetailers = Array.isArray(r) ? r : [];
    const allStores    = Array.isArray(s) ? s : [];
    const allTasks     = Array.isArray(t) ? t.map(task=>({...task, photos:[], comments:task.comments||[]})) : [];
    const teamList     = Array.isArray(team) ? team : [];

    // Role already set above from direct email lookup

    setMarkets(allMarkets);
    setRetailers(allRetailers);
    setStores(allStores);
    setTasks(allTasks);
    setProducts(Array.isArray(prods) ? prods : []);
    setLoading(false);
  };

  const handleLogin = async (userData) => {
    setUser(userData);
    await loadData(userData.token, userData.id, userData.email);
  };

  const handleImportProduct = async (name, sku) => {
    const exists = products.find(p=>p.name.toLowerCase()===name.toLowerCase());
    if (exists) return;
    const result = await sbInsertProduct(user.token, user.id, name, sku);
    const row = Array.isArray(result) ? result[0] : result;
    if (row?.id) setProducts(p=>[...p, row]);
  };

  const handleImportRow = async (row) => {
    const market = markets.find(m=>m.name.toLowerCase()===row.market.toLowerCase());
    if (!market) return;
    // Find or create retailer
    const normalizedType = RETAILER_TYPES.find(t=>t.toLowerCase()===(row.type||"").toLowerCase()) || row.type || "Other";
    let retailer = retailers.find(r=>r.name.toLowerCase()===row.retailer.toLowerCase()&&r.market_id===market.id);
    if (!retailer) {
      const [newRet] = await sbInsert("retailers", user.token, { name:row.retailer, type:normalizedType, market_id:market.id });
      if (newRet?.id) { retailer = newRet; setRetailers(p=>[...p, newRet]); }
    }
    if (!retailer) return;
    // Create store
    const exists = stores.find(s=>s.name.toLowerCase()===row.store_name.toLowerCase()&&s.retailer_id===retailer.id);
    if (!exists) {
      const [newStore] = await sbInsert("stores", user.token, { name:row.store_name, address:row.address||"", retailer_id:retailer.id });
      if (newStore?.id) setStores(p=>[...p, newStore]);
    }
  };

  const handleLogout = () => {
    setUser(null); setMarkets([]); setRetailers([]); setStores([]); setTasks([]);
    setMyRole("admin"); setMyMarkets(null);
  };

  if (!user) return <AuthScreen onLogin={handleLogin}/>;

  // ── Filter markets by role ──
  const allowedMarkets = myMarkets===null ? markets : markets.filter(m=>myMarkets.includes(m.id));

  // ── CRUD operations ──
  const addMarket = async ({ name, flag, color }) => {
    const [row] = await sbInsert("markets", user.token, { name, flag, color, user_id: user.id });
    if (row?.id) setMarkets(p=>[...p, row]);
  };

  const addRetailer = async ({ name, type, marketId }) => {
    const [row] = await sbInsert("retailers", user.token, { name, type, market_id: marketId });
    if (row?.id) setRetailers(p=>[...p, row]);
  };

  const addStore = async ({ name, address, retailerId }) => {
    const [row] = await sbInsert("stores", user.token, { name, address, retailer_id: retailerId });
    if (row?.id) setStores(p=>[...p, row]);
  };

  const addTask = async ({ title, status, priority, due, description, comments, photos, retailerId, storeId }) => {
    const [row] = await sbInsert("tasks", user.token, {
      title, status, priority,
      due: due||null,
      description: description||"",
      comments: comments||[],
      retailer_id: retailerId,
      store_id: storeId||null,
    });
    if (row?.id) setTasks(p=>[...p,{...row, photos:[], comments:row.comments||[]}]);
  };

  const saveTask = async (updated) => {
    await sbUpdate("tasks", user.token, updated.id, {
      title:       updated.title,
      status:      updated.status,
      priority:    updated.priority,
      due:         updated.due||null,
      description: updated.description||"",
      comments:    updated.comments||[],
    });
    setTasks(p=>p.map(t=>t.id===updated.id?{...t,...updated}:t));
  };

  const deleteTask = async (id) => {
    await sbDelete("tasks", user.token, id);
    setTasks(p=>p.filter(t=>t.id!==id));
  };

  const deleteMarket = async (id) => {
    await sbDelete("markets", user.token, id);
    setMarkets(p=>p.filter(m=>m.id!==id));
    const retIds = retailers.filter(r=>r.market_id===id).map(r=>r.id);
    setRetailers(p=>p.filter(r=>r.market_id!==id));
    setStores(p=>p.filter(s=>!retIds.includes(s.retailer_id)));
    setTasks(p=>p.filter(t=>!retIds.includes(t.retailer_id)));
  };

  const deleteRetailer = async (id) => {
    await sbDelete("retailers", user.token, id);
    setRetailers(p=>p.filter(r=>r.id!==id));
    setStores(p=>p.filter(s=>s.retailer_id!==id));
    setTasks(p=>p.filter(t=>t.retailer_id!==id));
  };

  const deleteStore = async (id) => {
    await sbDelete("stores", user.token, id);
    setStores(p=>p.filter(s=>s.id!==id));
    setTasks(p=>p.filter(t=>t.store_id!==id));
  };
  const visibleMarkets = selMarket ? allowedMarkets.filter(m=>m.id===selMarket) : allowedMarkets;
  const visibleTasks   = tasks.filter(t => {
    const ret = retailers.find(r=>r.id===t.retailer_id);
    return ret && allowedMarkets.some(m=>m.id===ret.market_id);
  });

  const taskStore    = selTask?.store_id ? stores.find(s=>s.id===selTask.store_id) : null;
  const taskRetailer = selTask ? retailers.find(r=>r.id===selTask.retailer_id) : null;
  const taskMarket   = taskRetailer ? markets.find(m=>m.id===taskRetailer.market_id) : null;

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"#F1F5F9", overflow:"hidden" }}>
      <Sidebar markets={allowedMarkets} retailers={retailers} stores={stores} tasks={visibleTasks}
        selected={selMarket} onSelect={setSelMarket}
        onAddMarket={isAdmin?()=>setAddingMkt(true):null}
        userEmail={user.email} onLogout={handleLogout}
        isAdmin={isAdmin} onTeam={()=>setShowTeam(true)} onImportCSV={isAdmin?()=>setShowCSV(true):null} onImportProducts={isAdmin?()=>setShowProductsCSV(true):null}/>

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Top bar */}
        <div style={{ background:"#fff", borderBottom:"1px solid #E2E8F0", padding:"13px 24px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:18, color:"#0F172A", letterSpacing:-0.4 }}>
              {selMarket?(allowedMarkets.find(m=>m.id===selMarket)?.flag+" "+allowedMarkets.find(m=>m.id===selMarket)?.name):"🌐 All Markets"}
            </div>
            <div style={{ fontSize:11, color:"#94A3B8", display:"flex", alignItems:"center", gap:6 }}>
              Market → Retailer → Store → Task
              {!isAdmin && <span style={{ background:"#EFF6FF", color:"#2563EB", borderRadius:20, padding:"1px 8px", fontSize:10, fontWeight:700 }}>Manager View</span>}
            </div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            {isAdmin && (
              <button onClick={()=>setShowReport(true)} style={{ background:"linear-gradient(135deg,#0F172A,#1E3A5F)", border:"none", color:"#fff", borderRadius:9, padding:"8px 16px", cursor:"pointer", fontSize:12, fontWeight:800, fontFamily:"inherit", display:"flex", alignItems:"center", gap:6, boxShadow:"0 2px 10px rgba(15,23,42,0.25)" }}>
                📊 Weekly Report
              </button>
            )}
            <div style={{ display:"flex", background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:9, overflow:"hidden" }}>
              {[["list","☰ List"],["kanban","⬛ Board"]].map(([v,label])=>(
                <button key={v} onClick={()=>setView(v)} style={{ background:view===v?"#0F172A":"transparent", color:view===v?"#fff":"#64748B", border:"none", padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:view===v?700:500, fontFamily:"inherit" }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          {loading ? <Spinner/> : (
            <>
              <StatsStrip tasks={visibleTasks}/>
              {allowedMarkets.length===0&&!loading&&(
                <div style={{ textAlign:"center", padding:"60px 20px", color:"#CBD5E1" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🌍</div>
                  <div style={{ fontWeight:800, fontSize:18, color:"#94A3B8", marginBottom:8 }}>
                    {isAdmin?"No markets yet":"No markets assigned"}
                  </div>
                  <div style={{ fontSize:13 }}>
                    {isAdmin?"Click \"+ Add Market\" in the sidebar to get started":"Ask your admin to assign you to a market"}
                  </div>
                </div>
              )}
              {visibleMarkets.map(market=>(
                <MarketSection key={market.id} market={market} retailers={retailers} stores={stores} tasks={tasks}
                  view={view} onTaskClick={setSelTask} onAddTask={addTask} onAddStore={addStore} onAddRetailer={addRetailer} onDeleteRetailer={deleteRetailer} onDeleteStore={deleteStore} onDeleteTask={deleteTask} onDeleteMarket={deleteMarket} token={user.token} isAdmin={isAdmin} products={products}/>
              ))}
            </>
          )}
        </div>

      </div>

      {selTask && taskMarket && taskRetailer && (
        <TaskModal task={selTask} store={taskStore} retailer={taskRetailer} market={taskMarket}
          onClose={()=>setSelTask(null)} onSave={saveTask} onDelete={deleteTask}/>
      )}
      {addingMkt && <AddMarketModal onClose={()=>setAddingMkt(false)} onAdd={addMarket}/>}
      {showReport && <WeeklyReportModal markets={allowedMarkets} retailers={retailers} stores={stores} tasks={visibleTasks} onClose={()=>setShowReport(false)}/>}
      {showTeam   && <TeamModal user={user} markets={markets} onClose={()=>setShowTeam(false)}/>}
      {showCSV    && <CSVUploadModal markets={markets} onClose={()=>setShowCSV(false)} onImport={handleImportRow}/>}
      {showProductsCSV && <ProductsCSVModal onClose={()=>setShowProductsCSV(false)} onImport={handleImportProduct}/>}
    </div>
  );
}

const $=i=>document.getElementById(i),esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])),clone=o=>JSON.parse(JSON.stringify(o));
const g=(o,p)=>p.split(".").reduce((a,k)=>a==null?a:a[k],o),sp=(o,p,v)=>{const k=p.split("."),l=k.pop();g(o,k.join("."))[l]=v};
let ME=null,S=null,LIVE=null,tab="hero",mode="in",PEND=[],ALL=[],OPEN={},DM="",STAT={needsOwner:false},sv,fr;
async function api(p,o={}){const r=await fetch(p,{credentials:"same-origin",...o,method:o.method||(o.json?"POST":"GET"),headers:{"X-DCRS":"1",...(o.json?{"Content-Type":"application/json"}:{}),...(o.headers||{})},body:o.json?JSON.stringify(o.json):o.body});
 let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw Object.assign(new Error(j.error||"Request failed ("+r.status+")"),{status:r.status});return j}
const post=()=>{if(fr&&fr.contentWindow&&S)fr.contentWindow.postMessage({type:"preview",content:S},location.origin)};
function dash(){if(!$("dash")||!ME)return;const d=JSON.stringify(S)!=JSON.stringify(LIVE),ow=ME.role=="owner";
 $("dash").innerHTML=`<div class="dh"><div><h3 style="font-size:26px">Dashboard</h3><small>Signed in as ${esc(ME.u)} (${ow?"main admin":"admin"})</small></div><div class="bar"><a class="sm" href="/" target="_blank" rel="noopener">View site</a><button class="sm" data-a="out">Sign out</button></div></div>
${ow&&PEND.length?`<div class="nt" data-t="appr">🔔 ${PEND.length} account${PEND.length>1?"s":""} waiting for your approval. Review now</div>`:""}
<div class="st"><div><b>${S.sections.length}</b><small>Sections</small></div><div><b>${S.slides.length}</b><small>Slides</small></div><div><b>${S.mem.length}</b><small>Members</small></div>${ow?`<div><b>${PEND.length}</b><small>Pending</small></div>`:""}<div><b>${d?"Draft":"Live"}</b><small>${d?"Unpublished changes":"Matches website"}</small></div></div>
<div class="pb"><button class="btn" data-a="pub">Apply &amp; publish</button><button class="sm" data-a="disc">Discard changes</button><span id="pm">${esc(DM)}</span></div>`}
function tabs(){if(!$("tbs"))return;const T=[["hero","Hero & site"],["slides","Slider"],["sections","Sections"],["mem","Committee"]];if(ME.role=="owner")T.push(["appr","Approvals"]);
 $("tbs").innerHTML=T.map(t=>`<button data-t="${t[0]}" class="${tab==t[0]?"on":""}">${t[1]}</button>`).join("");$("tc").innerHTML=tc()}
const F=(p,l,ta)=>`<label>${l}</label>`+(ta?`<textarea data-p="${p}">${esc(g(S,p))}</textarea>`:`<input data-p="${p}" value="${esc(g(S,p))}">`);
function secEd(x,i){const p=`sections.${i}.`;let h=F(p+"nav","Menu label (leave empty to hide from the menu)")+F(p+"title","Title");if(x.type!="contact")h+=F(p+"body","Text",1);
 if(x.type=="cards")h+=x.items.map((c,j)=>`<div class="row"><input data-p="${p}items.${j}.t" value="${esc(c.t)}" placeholder="Heading"><input data-p="${p}items.${j}.p" value="${esc(c.p)}" placeholder="Text"><button class="sm" data-a="ix" data-i="${i}" data-j="${j}" aria-label="Delete card">✕</button></div>`).join("")+`<button class="sm" data-a="ia" data-i="${i}">Add a card</button>`;
 if(x.type=="image")h+=`<label>Image</label><input type="file" accept="image/*" data-up="${i}"><button class="sm" data-a="logo" data-i="${i}" style="margin-top:8px">Use the logo instead</button>`;
 if(x.type=="cta")h+=F(p+"btn","Button text")+F(p+"link","Button link");if(x.type=="contact")h+=F(p+"email","Email")+F(p+"addr","Address",1);return h}
function tc(){let h="";
 if(tab=="hero")h=F("hero.eb","Small label above headline")+F("hero.h1","Headline")+F("hero.tag","Tagline")+F("hero.b1","Join button text")+F("hero.l1","Join button link (membership form)")+F("hero.b2","Second button text")+F("site.name","Name in the menu")+F("site.footer","Footer text");
 if(tab=="slides")h=S.slides.map((s,i)=>`<div class="row"><img src="${s.img}" alt=""><input data-p="slides.${i}.cap" value="${esc(s.cap)}" aria-label="Caption"><button class="sm" data-a="su" data-i="${i}">↑</button><button class="sm" data-a="sd" data-i="${i}">↓</button><button class="sm" data-a="sx" data-i="${i}">Delete</button></div>`).join("")+`<label>Add photos</label><input type="file" id="up" accept="image/*" multiple>`;
 if(tab=="sections")h=`<div class="add"><button class="sm" data-a="add" data-ty="text">+ Text</button><button class="sm" data-a="add" data-ty="cards">+ Cards</button><button class="sm" data-a="add" data-ty="image">+ Image and text</button><button class="sm" data-a="add" data-ty="cta">+ Button banner</button></div>`+S.sections.map((x,i)=>`<details class="glass sc" data-d="${x.id}" ${OPEN[x.id]?"open":""}><summary><b>${esc(x.title)}</b> <small>${x.type}${x.hidden?" · hidden":""}</small></summary><div class="bar"><button class="sm" data-a="mu" data-i="${i}">↑ Up</button><button class="sm" data-a="md" data-i="${i}">↓ Down</button><button class="sm" data-a="mh" data-i="${i}">${x.hidden?"Show":"Hide"}</button><button class="sm" data-a="mx" data-i="${i}">Delete</button></div>${secEd(x,i)}</details>`).join("");
 if(tab=="mem")h=S.mem.map((m,i)=>`<div class="row" style="flex-wrap:wrap"><input data-p="mem.${i}.0" value="${esc(m[0])}" placeholder="Council"><input data-p="mem.${i}.1" value="${esc(m[1])}" placeholder="Role"><input data-p="mem.${i}.2" value="${esc(m[2])}" placeholder="Name"><button class="sm" data-a="meX" data-i="${i}">Delete</button></div>`).join("")+`<button class="sm" data-a="meA">Add a member</button><p style="color:var(--mu);font-size:14px">Use the council name "Chief Trio" for the three top cards. The Committee section must exist in Sections to show this list.</p>`;
 if(tab=="appr")h=(ALL.length?ALL.map(a=>`<div class="row"><b style="flex:1">${esc(a.u||a.id)}</b><small>${a.role=="owner"?"main admin":a.status}</small>${a.role=="owner"?"":(a.status!="approved"?`<button class="sm" data-a="ap" data-id="${esc(a.id)}">Approve</button>`:"")+(a.status=="pending"?`<button class="sm" data-a="rj" data-id="${esc(a.id)}">Decline</button>`:`<button class="sm" data-a="rm" data-id="${esc(a.id)}">Remove</button>`)}</div>`).join(""):"<p>No accounts yet.</p>")+`<button class="sm" data-a="rl">Refresh</button>`;
 return h}
/* ---------- state, saving, publishing ---------- */
async function saveDraft(){DM="Saving...";dash();try{await api("/api/draft",{method:"PUT",json:{content:S}});DM="Draft saved."}catch(e){DM="Could not save: "+e.message}dash()}
function changed(s){post();clearTimeout(sv);sv=setTimeout(saveDraft,800);dash();if(s)tabs()}
async function pub(){clearTimeout(sv);DM="Publishing...";dash();try{await api("/api/draft",{method:"PUT",json:{content:S}});await api("/api/publish",{method:"POST",json:{}});LIVE=clone(S);DM="Published. The live website now shows these changes."}catch(e){DM="Publish failed: "+e.message}dash()}
async function disc(){if(!confirm("Discard all unpublished changes?"))return;try{clearTimeout(sv);await api("/api/draft",{method:"DELETE"});S=clone(LIVE);DM="Draft discarded.";post();dash();tabs()}catch(e){DM=e.message;dash()}}
const mv=(a,i,n)=>{const k=i+n;if(k<0||k>=a.length)return;[a[i],a[k]]=[a[k],a[i]];changed(1)};
const comp=f=>createImageBitmap(f).then(im=>{const r=Math.min(1,1600/im.width),c=document.createElement("canvas");c.width=im.width*r;c.height=im.height*r;c.getContext("2d").drawImage(im,0,0,c.width,c.height);return new Promise(ok=>c.toBlob(ok,"image/jpeg",.78))});
async function up(f){DM="Uploading photo...";dash();const b=await comp(f),r=await api("/api/upload?name="+encodeURIComponent((f.name||"photo").replace(/\.\w+$/,"")+".jpg"),{method:"POST",body:b,headers:{"Content-Type":"image/jpeg"}});DM="";return r.url}
const NEW={text:{},cards:{items:[{t:"First card",p:"Describe it here."},{t:"Second card",p:"Describe it here."},{t:"Third card",p:"Describe it here."}]},image:{img:"@logo"},cta:{btn:"Join now",link:"#"}};
async function loadPend(){if(!ME||ME.role!="owner")return;try{ALL=(await api("/api/users")).users;PEND=ALL.filter(a=>a.status=="pending")}catch(e){}dash();if(tab=="appr")tabs()}
async function usr(action,id){try{await api("/api/users",{json:{action,id}})}catch(e){DM=e.message}await loadPend()}
async function act(a,t){const i=+t.dataset.i,j=+t.dataset.j,id=t.dataset.id;
 switch(a){case"out":try{await api("/api/auth",{json:{action:"logout"}})}catch(e){}ME=null;mode="in";auth();break;
 case"pub":pub();break;case"disc":disc();break;
 case"su":mv(S.slides,i,-1);break;case"sd":mv(S.slides,i,1);break;case"sx":S.slides.splice(i,1);changed(1);break;
 case"mu":mv(S.sections,i,-1);break;case"md":mv(S.sections,i,1);break;case"mh":S.sections[i].hidden=!S.sections[i].hidden;changed(1);break;
 case"mx":if(confirm("Delete this section?")){S.sections.splice(i,1);changed(1)}break;
 case"ia":S.sections[i].items.push({t:"New card",p:"Describe it here."});changed(1);break;case"ix":S.sections[i].items.splice(j,1);changed(1);break;
 case"logo":S.sections[i].img="@logo";changed(1);break;
 case"add":{const n="n"+Date.now().toString(36);S.sections.push({id:n,type:t.dataset.ty,nav:"New section",title:"New section",body:"Write something here.",...clone(NEW[t.dataset.ty])});OPEN[n]=1;changed(1);const d=$("tc").querySelector(`[data-d="${n}"]`);if(d)d.scrollIntoView({block:"center"});break}
 case"meA":S.mem.push(["New Council","Role","Name"]);changed(1);break;case"meX":S.mem.splice(i,1);changed(1);break;
 case"ap":usr("approve",id);break;case"rj":usr("decline",id);break;case"rm":if(confirm("Remove this account?"))usr("remove",id);break;case"rl":loadPend();break}}
/* ---------- sign in / create account ---------- */
function auth(){const upm=mode=="up",nd=upm&&STAT.needsOwner;$("ws").hidden=true;$("gate").hidden=false;
 $("gate").innerHTML=`<div class="lg glass"><h3 style="font-size:26px;margin-bottom:12px">DCRS admin</h3><div class="tb"><button data-m="in" class="${upm?"":"on"}">Sign in</button><button data-m="up" class="${upm?"on":""}">Create account</button></div>
<p style="color:var(--mu);margin:0">${upm?(nd?"No main admin exists yet. Create it with the setup code from your Vercel environment variables.":"Request an admin account. The main admin must approve it before you can sign in."):"Sign in to manage the website."}</p>
<label>Username</label><input id="u" autocomplete="username"><label>Password</label><input id="p" type="password" autocomplete="${upm?"new-password":"current-password"}">${upm?'<label>Confirm password</label><input id="p2" type="password" autocomplete="new-password">':""}${nd?'<label>Setup code</label><input id="sc" type="password">':""}
<div class="er" id="er">${esc(STAT.err||"")}</div><button class="btn" id="go" style="width:100%">${upm?(nd?"Create main admin":"Request account"):"Sign in"}</button></div>`}
async function submit(){const er=$("er"),u=$("u").value.trim().toLowerCase(),p=$("p").value;er.textContent="";
 if(u.length<3)return er.textContent="Use a username of 3+ letters, numbers or underscores.";if(p.length<8)return er.textContent="Password needs 8+ characters.";
 try{if(mode=="in"){await api("/api/auth",{json:{action:"login",u,p}});await boot()}
 else{if(p!=$("p2").value)return er.textContent="Passwords do not match.";const r=await api("/api/auth",{json:{action:"register",u,p,code:STAT.needsOwner?$("sc").value:""}});
  if(r.role=="owner")await boot();else{mode="in";auth();$("er").innerHTML='<span class="ok">Request sent. You can sign in after the main admin approves it.</span>'}}}
 catch(e){er.textContent=e.message}}
async function boot(){try{ME=(await api("/api/auth?action=me")).user}catch(e){ME=null}
 if(!ME){try{STAT=await api("/api/auth?action=status")}catch(e){STAT={needsOwner:false,err:e.message}}return auth()}
 try{const[d,c]=await Promise.all([api("/api/draft"),api("/api/content")]);LIVE=c;S=d.draft||clone(c)}catch(e){STAT={err:e.message};ME=null;return auth()}
 $("gate").hidden=true;$("ws").hidden=false;fr=$("fr");dash();tabs();post();loadPend()}
/* ---------- events ---------- */
document.addEventListener("click",e=>{const t=e.target.closest("[data-m],[data-t],[data-a],#go");if(!t)return;if(t.dataset.m){mode=t.dataset.m;auth()}else if(t.id=="go")submit();else if(t.dataset.t){tab=t.dataset.t;tabs()}else act(t.dataset.a,t)});
document.addEventListener("input",e=>{const p=e.target.dataset&&e.target.dataset.p;if(p&&S){sp(S,p,e.target.value);changed()}});
document.addEventListener("change",async e=>{const t=e.target;try{if(t.id=="up"){for(const f of t.files)S.slides.push({img:await up(f),cap:"New photo"});changed(1)}else if(t.dataset.up!=null&&t.files[0]){S.sections[+t.dataset.up].img=await up(t.files[0]);changed(1)}}catch(x){DM="Upload failed: "+x.message;dash()}});
document.addEventListener("keydown",e=>{if(e.key=="Enter"&&["u","p","p2","sc"].includes(e.target.id))submit()});
document.addEventListener("toggle",e=>{const d=e.target.dataset&&e.target.dataset.d;if(d)OPEN[d]=e.target.open},true);
window.addEventListener("message",e=>{if(e.origin==location.origin&&e.data&&e.data.type=="ready")post()});
setInterval(()=>{if(ME&&ME.role=="owner")loadPend()},15000);
window.addEventListener("beforeunload",()=>{});boot();

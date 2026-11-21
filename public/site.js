const $=i=>document.getElementById(i),esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])),nl=s=>esc(s).replace(/\n/g,"<br>"),url=x=>/^(https?:|mailto:|#|\/)/.test(x||"")?x:"#";
let S=null,first=true,cur=0,tm;
const PREVIEW=new URLSearchParams(location.search).has("preview");
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("in")),{threshold:.15});
/* ---------- site ---------- */
function sx(x){const t=`<h2>${esc(x.title)}</h2>`,b=x.body?`<p class="lead">${nl(x.body)}</p>`:"",o=`<section id="s-${x.id}"><div class="w rv">`;
 if(x.type=="image"){const L=x.img=="@logo";return `<section id="s-${x.id}"><div class="w two rv"><div>${t}${b}</div><div class="sh glass ${L?"":"ph"}"><img src="${esc(L?S.logo:x.img)}" alt=""></div></div></section>`}
 if(x.type=="cards"){const q=x.items.length==4;return o+t+b+`<div class="${q?"q":"gc"}">${x.items.map(i=>`<div class="${q?"":"glass"}"><h3>${esc(i.t)}</h3><p>${nl(i.p)}</p></div>`).join("")}</div></div></section>`}
 if(x.type=="committee"){const m=S.mem.filter(r=>r[0]=="Chief Trio"),gr={};S.mem.filter(r=>r[0]!="Chief Trio").forEach(r=>(gr[r[0]]=gr[r[0]]||[]).push(r));
  return o+t+b+`<div class="trio">${m.map(r=>`<div class="glass"><small>${esc(r[1])}</small><h3>${esc(r[2])}</h3></div>`).join("")}</div><div class="cg">${Object.keys(gr).map(k=>`<div class="glass"><h3>${esc(k)}</h3>${gr[k].map(r=>`<div class="m"><b>${esc(r[2])}</b><span>${esc(r[1])}</span></div>`).join("")}</div>`).join("")}</div></div></section>`}
 if(x.type=="cta")return `<section id="s-${x.id}"><div class="w"><div class="jn glass rv">${t}${b}<a class="btn" href="${esc(url(x.link))}" target="_blank" rel="noopener">${esc(x.btn)}</a></div></div></section>`;
 if(x.type=="contact")return o+t+`<div class="ct"><div class="glass"><small>Email</small><p><a href="mailto:${esc(x.email)}">${esc(x.email)}</a></p></div><div class="glass"><small>Address</small><p>${nl(x.addr)}</p></div></div></div></section>`;
 return o+t+b+`</div></section>`}
function render(){const H=S.hero,sec=S.sections.filter(x=>!x.hidden),f=first;
 const nav=sec.filter(x=>x.nav).map(x=>`<a href="#s-${x.id}">${esc(x.nav)}</a>`).join("");
 $("app").className=f?"":"nf";
 $("app").innerHTML=`<nav><div class="in glass"><img src="${esc(S.logo)}" alt=""><b>${esc(S.site.name)}</b><div class="l">${nav}<a class="btn" href="${esc(url(H.l1))}" target="_blank" rel="noopener">${esc(H.b1)}</a></div></div></nav>
<header id="hero"><div class="sl" id="sl">${S.slides.map(s=>`<i style="background-image:url('${esc(s.img)}')"></i>`).join("")}</div><div class="w hc"><div class="eb">${esc(H.eb)}</div><h1>${esc(H.h1).split(" ").map((w,i)=>`<span class="wd" style="animation-delay:${.15+i*.18}s">${w}</span>`).join(" ")}</h1><p>${esc(H.tag)}</p><div class="bt"><a class="btn" href="${esc(url(H.l1))}" target="_blank" rel="noopener">${esc(H.b1)}</a><a class="btn o" href="#s-${sec[0]?sec[0].id:""}">${esc(H.b2)}</a></div></div><div class="cap" id="cp"></div><div class="ctl glass"><button id="pv" aria-label="Previous slide">&#8249;</button><div class="dots" id="dt">${S.slides.map((s,i)=>`<span data-i="${i}"></span>`).join("")}</div><button id="nx" aria-label="Next slide">&#8250;</button></div></header>
${sec.map(sx).join("")}<footer><div class="w"><span>${esc(S.site.footer)}</span><a href="/admin">Admin</a></div></footer>`;
 document.querySelectorAll(".rv").forEach(e=>f?io.observe(e):e.classList.add("in"));first=false;show(Math.min(cur,Math.max(S.slides.length-1,0)))}
function show(i){const a=[...document.querySelectorAll("#sl i")],d=[...document.querySelectorAll("#dt span")];cur=i;a.forEach((e,j)=>e.classList.toggle("on",j==i));d.forEach((e,j)=>e.classList.toggle("on",j==i));if($("cp"))$("cp").textContent=(S.slides[i]||{}).cap||"";clearInterval(tm);tm=setInterval(()=>go(1),6500)}
function go(n){const L=S.slides.length;if(L)show((cur+n+L)%L)}
document.addEventListener("click",e=>{if(e.target.closest("#pv"))go(-1);else if(e.target.closest("#nx"))go(1);else{const d=e.target.closest("#dt span");if(d)show(+d.dataset.i)}});
async function load(){try{const r=await fetch("/api/content");if(!r.ok)throw 0;S=await r.json()}catch(e){S=await (await fetch("/default-content.json")).json()}
 if(PREVIEW)first=false;render();if(PREVIEW&&parent!==window)parent.postMessage({type:"ready"},location.origin)}
window.addEventListener("message",e=>{if(!PREVIEW||e.origin!==location.origin||!e.data||e.data.type!=="preview")return;S=e.data.content;render()});
load();

/* EVERTOOL company landing page — interactive 3D tools + book catalogue */

/* ---------- 3D TOOLS IN ACTION ---------- */
const motionScenes = [
  {type:"HAND TOOL", title:"Screwdriver", desc:"Controlled rotation drives a screw into the work surface."},
  {type:"POWER TOOL", title:"Electric Drill", desc:"A rotating drill bit moves into a work surface with realistic tool motion."},
  {type:"POWER TOOL", title:"Angle Grinder", desc:"A high-speed abrasive disc works across a metal edge with flying sparks."},
  {type:"HAND TOOL", title:"Combination Pliers", desc:"The jaws open, grip a wire and close around the workpiece."},
  {type:"HAND TOOL", title:"Spanner", desc:"Torque is applied around the nut for a tightening operation."}
];
let activeScene=0, sceneTimer, sceneStart, progressFrame;
const sceneCount=document.getElementById('sceneCount');
const sceneType=document.getElementById('sceneType');
const sceneTitle=document.getElementById('sceneTitle');
const sceneDesc=document.getElementById('sceneDesc');
const sceneProgress=document.getElementById('sceneProgress');
const viewport=document.getElementById('tool3DViewport');
let renderer, camera, threeScene, toolGroup, clock;
let drag=false, px=0, py=0, rotY=.35, rotX=.08;

function mat(color, metal=.0, rough=.4){
  return new THREE.MeshStandardMaterial({color, metalness:metal, roughness:rough});
}
const red=mat(0xd91f26,.65,.28), dark=mat(0x242629,.9,.24), steel=mat(0xb7bcc0,1,.2), black=mat(0x111315,.8,.3), rubber=mat(0x191b1d,.15,.62), wood=mat(0x5c3925,.05,.58), silver=mat(0xd4d7d8,1,.16);
function box(w,h,d,material){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)}
function cyl(r,h,material,segments=32){return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material)}
function torus(r,t,material,arc=Math.PI*2){return new THREE.Mesh(new THREE.TorusGeometry(r,t,16,64,arc),material)}
function group(){return new THREE.Group()}

function addFloor(g){
  const floor=box(12,.12,7,mat(0x303234,.35,.5)); floor.position.y=-2.65; g.add(floor);
  for(let x=-5;x<=5;x+=1){const line=box(.012,.008,7,mat(0x55585a,.1,.8));line.position.set(x,-2.58,0);g.add(line)}
  for(let z=-3;z<=3;z+=1){const line=box(12,.008,.012,mat(0x55585a,.1,.8));line.position.set(0,-2.57,z);g.add(line)}
}

function createScrewdriver(){
  const g=group(); addFloor(g);
  const board=box(5.2,.55,2.9,wood); board.position.set(0,-2.15,0); board.rotation.z=-.03; g.add(board);
  const screw=group(); screw.position.set(.4,-1.82,0);
  const head=cyl(.42,.16,silver); head.rotation.x=Math.PI/2; screw.add(head);
  const slot1=box(.55,.04,.07,black); slot1.position.z=.09; screw.add(slot1);
  const slot2=box(.07,.04,.55,black); slot2.position.z=.1; screw.add(slot2); g.add(screw);
  const tool=group();
  const handle=cyl(.58,1.65,red,48); handle.position.y=1.0; tool.add(handle);
  const grip1=torus(.5,.055,silver); grip1.rotation.x=Math.PI/2; grip1.position.y=1.67; tool.add(grip1);
  const shaft=cyl(.095,2.55,silver,24); shaft.position.y=-1.05; tool.add(shaft);
  const tip=cyl(.12,.32,steel,6); tip.position.y=-2.48; tool.add(tip);
  tool.position.set(.4,0,.05); g.add(tool); g.userData={tool,screw};
  return g;
}

function createDrill(){
  const g=group(); addFloor(g);
  const surface=box(5.5,.45,3.2,wood); surface.position.set(0,-2.18,0); g.add(surface);
  const body=group();
  const main=box(2.55,1.25,1.25,red); main.position.set(-.25,1.1,0); main.rotation.z=-.1; body.add(main);
  const top=box(1.45,.34,1.1,dark); top.position.set(-.1,1.85,0); top.rotation.z=-.1; body.add(top);
  const handle=box(.65,2.05,.82,red); handle.position.set(.45,-.25,0); handle.rotation.z=-.12; body.add(handle);
  const trigger=box(.2,.65,.9,black); trigger.position.set(.15,.55,.44); trigger.rotation.z=-.1; body.add(trigger);
  const chuck=cyl(.42,.75,steel,32); chuck.rotation.z=Math.PI/2; chuck.position.set(1.42,.95,0); body.add(chuck);
  const bit=cyl(.08,2.6,silver,20); bit.rotation.z=Math.PI/2; bit.position.set(2.65,.95,0); body.add(bit);
  const bitTip=cyl(.12,.22,black,16); bitTip.rotation.z=Math.PI/2; bitTip.position.set(3.95,.95,0); body.add(bitTip);
  body.position.y=.05; g.add(body);
  const dust=[]; for(let i=0;i<26;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.025+Math.random()*.035,8,8),mat(0xc0a27b,.05,.9));p.position.set(3.9,-1.9,0);g.add(p);dust.push(p)}
  g.userData={body,bit,dust}; return g;
}

function createGrinder(){
  const g=group(); addFloor(g);
  const metal=box(5.5,.38,1.7,steel); metal.position.set(.8,-1.95,0); metal.rotation.z=-.05; g.add(metal);
  const body=group();
  const main=box(2.45,1.05,1.15,red); main.position.set(-.25,1.0,0); main.rotation.z=.18; body.add(main);
  const grip=cyl(.34,1.65,black,32); grip.rotation.z=.2; grip.position.set(.15,-.05,0); body.add(grip);
  const guard=torus(.92,.08,dark,Math.PI*1.65); guard.rotation.y=Math.PI/2; guard.position.set(1.25,.35,0); body.add(guard);
  const disc=cyl(.78,.16,steel,64); disc.rotation.x=Math.PI/2; disc.position.set(1.65,.35,0); body.add(disc);
  const discRing=torus(.63,.035,black); discRing.rotation.x=Math.PI/2; discRing.position.set(1.65,.35,.09); body.add(discRing);
  g.add(body);
  const sparks=[]; for(let i=0;i<40;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.025+Math.random()*.035,6,6),mat(0xffa42b,.2,.2));p.userData={seed:Math.random(),speed:.5+Math.random()*1.4};g.add(p);sparks.push(p)}
  g.userData={body,disc,sparks}; return g;
}

function createPliers(){
  const g=group(); addFloor(g);
  const wire=cyl(.075,2.8,steel,16); wire.rotation.z=Math.PI/2; wire.position.set(0,-1.05,0); g.add(wire);
  const left=group(), right=group();
  const lhandle=box(.55,2.55,.65,red); lhandle.position.y=-.7; left.add(lhandle);
  const ljaw=box(.42,1.75,.52,steel); ljaw.position.y=1.25; ljaw.rotation.z=-.15; left.add(ljaw);
  const rhandle=box(.55,2.55,.65,red); rhandle.position.y=-.7; right.add(rhandle);
  const rjaw=box(.42,1.75,.52,steel); rjaw.position.y=1.25; rjaw.rotation.z=.15; right.add(rjaw);
  left.position.x=-.25; right.position.x=.25; left.rotation.z=.15; right.rotation.z=-.15;
  g.add(left,right);
  const joint=cyl(.27,.45,silver,32); joint.rotation.x=Math.PI/2; joint.position.set(0,.65,.34);g.add(joint);
  g.userData={left,right,wire};return g;
}

function createWrench(){
  const g=group(); addFloor(g);
  const nut=group();
  const n=cyl(.65,.42,steel,6); n.rotation.x=Math.PI/2; nut.add(n);
  const hole=cyl(.34,.5,black,6); hole.rotation.x=Math.PI/2; nut.add(hole); nut.position.set(1.15,-1.75,0); g.add(nut);
  const wrench=group();
  const handle=box(4.2,.48,.48,silver); handle.position.x=-.1; wrench.add(handle);
  const head=torus(.72,.24,silver,Math.PI*1.42); head.rotation.y=Math.PI/2; head.position.x=1.85; wrench.add(head);
  const jaw1=box(.7,.22,.5,silver); jaw1.position.set(1.58,.45,0); jaw1.rotation.z=-.3; wrench.add(jaw1);
  const jaw2=box(.7,.22,.5,silver); jaw2.position.set(1.58,-.45,0); jaw2.rotation.z=.3; wrench.add(jaw2);
  const grip=torus(.24,.035,dark); grip.rotation.y=Math.PI/2; grip.position.x=-1.7; wrench.add(grip);
  wrench.position.set(-.55,-.1,0); g.add(wrench);
  g.userData={wrench,nut};return g;
}

/* ---------- VIDEO TOOLS: HTML5 video handles playback ---------- */

/* ---------- 3D-STYLE CATALOGUE BOOK ---------- */
const totalPages=16;
let currentBookPage=1;
const leftPage=document.getElementById('leftPage');
const rightPage=document.getElementById('rightPage');
const turnForward=document.getElementById('turnForward');
const turnBack=document.getElementById('turnBack');
const turnForwardImg=document.getElementById('turnForwardImg');
const turnBackImg=document.getElementById('turnBackImg');
const bookLabel=document.getElementById('bookPageLabel');
const bookTabs=document.getElementById('bookTabs');
let turning=false;

function pageSrc(n){return `assets/catalogue-page-${n}.jpg`}
function renderBook(){
  leftPage.src=pageSrc(currentBookPage);leftPage.alt=`EVERTOOL catalogue page ${currentBookPage}`;
  const right=currentBookPage<totalPages?currentBookPage+1:null;
  rightPage.src=right?pageSrc(right):pageSrc(totalPages);rightPage.alt=right?`EVERTOOL catalogue page ${right}`:'EVERTOOL catalogue final page';
  bookLabel.textContent=currentBookPage===1?`Cover • 1 / ${totalPages}`:`Pages ${currentBookPage}–${Math.min(currentBookPage+1,totalPages)} / ${totalPages}`;
  [...bookTabs.children].forEach((b,i)=>b.classList.toggle('active',i+1===currentBookPage));
}
function turnBook(direction){
  if(turning)return;
  const next=direction>0?Math.min(totalPages,currentBookPage+2):Math.max(1,currentBookPage-2);
  if(next===currentBookPage)return;
  turning=true;
  if(direction>0){
    turnForwardImg.src=pageSrc(currentBookPage+1<=totalPages?currentBookPage+1:currentBookPage);
    turnForward.classList.remove('turning');void turnForward.offsetWidth;turnForward.classList.add('turning');
  }else{
    turnBackImg.src=pageSrc(currentBookPage-1>=1?currentBookPage-1:currentBookPage);
    turnBack.classList.remove('turning');void turnBack.offsetWidth;turnBack.classList.add('turning');
  }
  setTimeout(()=>{currentBookPage=next;renderBook();turning=false;},720);
}
function openPage(page){
  page=Math.max(1,Math.min(totalPages,page));
  if(page===currentBookPage)return;
  const direction=page>currentBookPage?1:-1;
  currentBookPage=direction>0?Math.max(1,page-((page-1)%2)):page;
  renderBook();
  const wrap=document.getElementById('bookWrap');wrap?.scrollIntoView({behavior:'smooth',block:'center'});
}
window.openPage=openPage;
for(let i=1;i<=totalPages;i++){
  const b=document.createElement('button');b.textContent=i;b.setAttribute('aria-label',`Open catalogue page ${i}`);b.addEventListener('click',()=>openPage(i));bookTabs.appendChild(b);
}
document.getElementById('bookNext')?.addEventListener('click',()=>turnBook(1));
document.getElementById('bookPrev')?.addEventListener('click',()=>turnBook(-1));
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')turnBook(1);if(e.key==='ArrowLeft')turnBook(-1)});
renderBook();

/* ---------- NAV / REVEAL ---------- */
document.querySelector('.menu-btn')?.addEventListener('click',()=>{
  const nav=document.querySelector('.nav nav');nav.style.display=nav.style.display==='flex'?'':'flex';nav.style.position='absolute';nav.style.top='70px';nav.style.left='0';nav.style.right='0';nav.style.background='#f7f7f4';nav.style.padding='20px 5vw';nav.style.flexDirection='column';
});
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
document.getElementById('year').textContent=new Date().getFullYear();

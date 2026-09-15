import * as THREE from './vendor/three.module.min.js';
const canvas = document.getElementById('food-canvas');
const holder = canvas.parentElement;
const story = document.querySelector('.story');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true}); } catch { holder.classList.remove('webgl-ready'); }
if (renderer) {
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,6.8,9.6);camera.lookAt(0,.4,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x84947b,3));const light=new THREE.DirectionalLight(0xfff5df,4);light.position.set(-3,7,5);scene.add(light);const fill=new THREE.DirectionalLight(0xffffff,2);fill.position.set(4,3,-4);scene.add(fill);
const dish=new THREE.Group();scene.add(dish);
const ceramic=new THREE.MeshStandardMaterial({color:0xf9faf4,roughness:.22,metalness:.04});
const profile=[[0,0],[.5,0],[1.45,.015],[1.7,.065],[1.96,.2],[2.27,.28],[2.4,.3],[2.42,.34],[2.38,.37],[2.25,.35],[1.94,.27],[1.68,.14],[1.45,.11],[0,.11]].map(p=>new THREE.Vector2(...p));
const plate=new THREE.Mesh(new THREE.LatheGeometry(profile,100),ceramic);dish.add(plate);
const rim=new THREE.Mesh(new THREE.TorusGeometry(2.29,.014,8,100),new THREE.MeshStandardMaterial({color:0x214a34,roughness:.4}));rim.rotation.x=Math.PI/2;rim.position.y=.36;plate.add(rim);
// Deterministic ingredient placement, rendered in a handful of draw calls.
let seed=82;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const dummy=new THREE.Object3D();
const rice=new THREE.Group();dish.add(rice);
const riceBase=new THREE.Mesh(new THREE.SphereGeometry(1,48,24),new THREE.MeshStandardMaterial({color:0xe9d9a7,roughness:.85}));riceBase.scale.set(1.48,.65,1.48);riceBase.position.y=.22;rice.add(riceBase);
const grains=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),new THREE.MeshStandardMaterial({color:0xfff0c8,roughness:.65}),2500);
for(let i=0;i<2500;i++){const r=Math.sqrt(random())*1.49,a=random()*Math.PI*2;const h=.2+.65*Math.sqrt(Math.max(0,1-r*r/2.25));dummy.position.set(Math.cos(a)*r,h+random()*.06,Math.sin(a)*r);dummy.rotation.set(random()*2,random()*6,random()*2);dummy.scale.set(.023+random()*.008,.026,.067+random()*.021);dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);grains.setColorAt(i,new THREE.Color().setHSL(.12,.27+random()*.15,.76+random()*.17));}rice.add(grains);
const chicken=new THREE.Group();dish.add(chicken);
const shreds=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshStandardMaterial({color:0xf2d9ac,roughness:.78}),420);
for(let i=0;i<420;i++){const r=Math.sqrt(random())*1.17,a=random()*Math.PI*2;dummy.position.set(Math.cos(a)*r,.75+.36*(1-r/1.3)+random()*.1,Math.sin(a)*r);dummy.rotation.set(random()*.5,random()*Math.PI,random()*.55);dummy.scale.set(.026+random()*.027,.023+random()*.025,.12+random()*.15);dummy.updateMatrix();shreds.setMatrixAt(i,dummy.matrix);shreds.setColorAt(i,new THREE.Color().setHSL(.095,.27+random()*.25,.57+random()*.22));}chicken.add(shreds);
const seasoning=new THREE.Group();dish.add(seasoning);
const herbs=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,3),new THREE.MeshStandardMaterial({color:0x345d28,roughness:1}),180);
for(let i=0;i<180;i++){const r=Math.sqrt(random())*1.4,a=random()*6.28;dummy.position.set(Math.cos(a)*r,r<1.18?1.25-.28*r:.63,Math.sin(a)*r);dummy.rotation.set(random()*3,random()*3,random()*3);dummy.scale.set(.016+random()*.017,.008,.027);dummy.updateMatrix();herbs.setMatrixAt(i,dummy.matrix);herbs.setColorAt(i,new THREE.Color(i%4===0?0x63361f:0x355428));}seasoning.add(herbs);
// Soft ground shadow and transparent steam, without external textures.
const textureCanvas=document.createElement('canvas');textureCanvas.width=128;textureCanvas.height=128;const ctx=textureCanvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,2,64,64,64);gradient.addColorStop(0,'rgba(38,61,39,.24)');gradient.addColorStop(1,'rgba(38,61,39,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(textureCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.12;scene.add(shadow);
const steamCanvas=document.createElement('canvas');steamCanvas.width=64;steamCanvas.height=64;const sc=steamCanvas.getContext('2d');const sg=sc.createRadialGradient(32,32,0,32,32,32);sg.addColorStop(0,'rgba(188,196,185,.24)');sg.addColorStop(1,'rgba(188,196,185,0)');sc.fillStyle=sg;sc.fillRect(0,0,64,64);const steamTexture=new THREE.CanvasTexture(steamCanvas);const steam=[];
for(let i=0;i<12;i++){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:steamTexture,transparent:true,depthWrite:false,opacity:0}));scene.add(sprite);steam.push(sprite);}
const titles=['Her şey bir tabakla başlar.','Tane tane, tam kıvamında.','Üzerine bolca tavuk.','Son dokunuş. Afiyet olsun.'];const descriptions=['Gerisi Halil Usta’da.','Sıcak pilav tabaktaki yerini alır.','Didik didik tavuk, pilavla buluşur.','Bir tutam baharat, üstünde dumanı.'];
let target=0,progress=0,paused=false,visible=true,frame=0,lastChapter=-1;
const clamp=x=>Math.max(0,Math.min(1,x));const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
function measure(){const rect=holder.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();updateScroll();}
function updateScroll(){target=clamp(-story.getBoundingClientRect().top/Math.max(1,story.offsetHeight-innerHeight));requestFrame();}
function requestFrame(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
function render(time){frame=0;progress=reduce.matches?1:paused?progress:progress+(target-progress)*.09;const p=progress;
plate.position.y=-.5*(1-smooth(p*5));plate.rotation.y=p*.18;
rice.position.y=(1-smooth((p-.12)/.27))*3.4;rice.scale.setScalar(.82+.18*smooth((p-.12)/.27));rice.visible=p>.08;
chicken.position.y=(1-smooth((p-.39)/.27))*3.6;chicken.rotation.y=(1-smooth((p-.39)/.27))*.4;chicken.visible=p>.35;
seasoning.position.y=(1-smooth((p-.68)/.22))*3;seasoning.visible=p>.65;
dish.rotation.y=-.22+p*.45;dish.rotation.z=(1-smooth(p/.2))*.07;
steam.forEach((s,i)=>{const phase=((paused||reduce.matches?i*340:time)+i*340)%3600/3600;s.position.set(Math.sin(i*2+phase*3)*(.35+phase*.25),1.1+phase*2.1,Math.cos(i*2)*.4);s.scale.set(.3+phase*.9,.5+phase*1.2,1);s.material.opacity=p>.86?Math.sin(phase*Math.PI)*.52*smooth((p-.86)/.14):0;});
const chapter=Math.min(3,Math.floor(p*4));if(chapter!==lastChapter){lastChapter=chapter;document.getElementById('chapter-number').textContent=`0${chapter+1} / 04`;document.getElementById('chapter-title').textContent=titles[chapter];document.getElementById('chapter-desc').textContent=descriptions[chapter];document.querySelectorAll('.steps li').forEach((li,i)=>li.classList.toggle('active',i<=chapter));}
renderer.render(scene,camera);holder.classList.add('webgl-ready');if(!paused&&!reduce.matches&&(Math.abs(target-progress)>.0001||p>.86))requestFrame();}
const toggle=document.querySelector('.motion-toggle');toggle.addEventListener('click',()=>{paused=!paused;toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Animasyonu devam ettir':'Animasyonu duraklat');toggle.innerHTML=`<i data-lucide="${paused?'play':'pause'}"></i>`;window.lucide?.createIcons();requestFrame();});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestFrame();}).observe(story);
window.addEventListener('scroll',updateScroll,{passive:true});new ResizeObserver(measure).observe(holder);document.addEventListener('visibilitychange',requestFrame);reduce.addEventListener('change',()=>{measure();requestFrame();});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();visible=false;holder.classList.remove('webgl-ready');});canvas.addEventListener('webglcontextrestored',()=>{visible=true;requestFrame();});measure();requestFrame();
}



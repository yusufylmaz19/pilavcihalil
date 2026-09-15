import * as THREE from './vendor/three.module.min.js';
const canvas = document.getElementById('food-canvas');
const holder = canvas.parentElement;
const story = document.querySelector('.story');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true}); } catch { holder.classList.add('webgl-failed'); }
if (renderer) {
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,6.8,9.6);camera.lookAt(0,.4,0);
scene.add(new THREE.HemisphereLight(0xfffaf0,0x8b8271,1.55));const light=new THREE.DirectionalLight(0xfff3df,3.2);light.position.set(-3,7,5);scene.add(light);const fill=new THREE.DirectionalLight(0xeef3ff,.7);fill.position.set(4,3,-4);scene.add(fill);
light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-3.5,right:3.5,top:3.5,bottom:-3.5,near:.5,far:20});light.shadow.bias=-.0002;light.shadow.normalBias=.012;light.shadow.radius=2;
const dish=new THREE.Group();scene.add(dish);
const ceramic=new THREE.MeshStandardMaterial({color:0xf9faf4,roughness:.22,metalness:.04});
const profile=[[0,0],[.5,0],[1.45,.015],[1.7,.065],[1.96,.2],[2.27,.28],[2.4,.3],[2.42,.34],[2.38,.37],[2.25,.35],[1.94,.27],[1.68,.14],[1.45,.11],[0,.11]].map(p=>new THREE.Vector2(...p));
const plate=new THREE.Mesh(new THREE.LatheGeometry(profile,100),ceramic);plate.receiveShadow=true;dish.add(plate);
const rim=new THREE.Mesh(new THREE.TorusGeometry(2.29,.014,8,100),new THREE.MeshStandardMaterial({color:0x214a34,roughness:.4}));rim.rotation.x=Math.PI/2;rim.position.y=.36;plate.add(rim);
// Deterministic ingredient placement, rendered in a handful of draw calls.
let seed=82;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const dummy=new THREE.Object3D();
const rice=new THREE.Group();dish.add(rice);
// A loose mound, with grains covering its sides and a few spilled on the rim.
const moundHeight=(r,a)=>.19+.73*Math.pow(Math.max(0,1-Math.pow(r/1.53,3.2)),.72)+.025*Math.sin(a*5+r*8);
const moundProfile=[];
for(let i=0;i<=32;i++){const r=i/32*1.49;moundProfile.push(new THREE.Vector2(r,moundHeight(r,0)-.065));}
moundProfile.push(new THREE.Vector2(1.49,.17),new THREE.Vector2(0,.17));
const mound=new THREE.Mesh(new THREE.LatheGeometry(moundProfile,64),new THREE.MeshStandardMaterial({color:0xe2d4b6,roughness:.8,side:THREE.DoubleSide}));mound.receiveShadow=true;rice.add(mound);
const grainGeometry=new THREE.SphereGeometry(1,10,7);
const gp=grainGeometry.attributes.position;
for(let i=0;i<gp.count;i++){const z=gp.getZ(i);gp.setX(i,gp.getX(i)+.14*(1-z*z));}grainGeometry.computeVertexNormals();
const grains=new THREE.InstancedMesh(grainGeometry,new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.38,clearcoat:.12,clearcoatRoughness:.35}),6500);
for(let i=0;i<6500;i++){
 const a=random()*Math.PI*2;let r,y;
 if(i<5000){r=Math.sqrt(random())*1.52;y=moundHeight(r,a)+(random()-.5)*.075;}
 else if(i<6300){r=1.43+random()*.12;y=.2+random()*Math.max(.03,moundHeight(r,a)-.2);}
 else{r=1.55+random()*.36;y=.18+Math.max(0,r-1.65)*.23;}
 dummy.position.set(Math.cos(a)*r,y,Math.sin(a)*r);dummy.rotation.set((random()-.5)*.8,random()*Math.PI*2,(random()-.5)*.8);
 const size=.85+random()*.35;dummy.scale.set(.027*size,.024*size,.072*size);dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);
 grains.setColorAt(i,new THREE.Color().setHSL(.115,.16+random()*.17,.76+random()*.17));
}grains.castShadow=true;grains.receiveShadow=true;rice.add(grains);
const chicken=new THREE.Group();dish.add(chicken);
// Torn chicken breast: irregular tapered pieces, ridged along the muscle fibres.
const meatGeometry=new THREE.SphereGeometry(1,20,24);meatGeometry.rotateX(Math.PI/2);
const mp=meatGeometry.attributes.position;
for(let i=0;i<mp.count;i++){
 const x=mp.getX(i),y=mp.getY(i),z=mp.getZ(i);const angle=Math.atan2(y,x);
 const ridges=1+.085*Math.cos(angle*13+z*.65)+.035*Math.sin(z*19+angle*3);
 mp.setXYZ(i,x*ridges*(.88+.12*Math.sin(z*5))+.14*Math.sin(z*2.5),y*ridges+.07*Math.sin(z*4),z);
}meatGeometry.computeVertexNormals();
const shreds=new THREE.InstancedMesh(meatGeometry,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.62}),100);
const fibreGeometry=new THREE.CylinderGeometry(.7,1,1,5,5);fibreGeometry.rotateX(Math.PI/2);
const fibres=new THREE.InstancedMesh(fibreGeometry,new THREE.MeshStandardMaterial({color:0xf4dfc4,roughness:.8}),1600);
const pieces=[];const local=new THREE.Vector3();const rotation=new THREE.Quaternion();
for(let i=0;i<100;i++){
 const r=Math.sqrt(random())*1.12,a=random()*Math.PI*2;
 const center=new THREE.Vector3(Math.cos(a)*r,moundHeight(r,a)+.075+random()*.12,Math.sin(a)*r);
 dummy.position.copy(center);dummy.rotation.set((random()-.5)*.55,random()*Math.PI*2,(random()-.5)*.45);
 const width=.045+random()*.065,height=.025+random()*.035,length=.14+random()*.2;
 dummy.scale.set(width,height,length);dummy.updateMatrix();shreds.setMatrixAt(i,dummy.matrix);
 shreds.setColorAt(i,new THREE.Color().setHSL(.095,.2+random()*.15,.67+random()*.18));
 rotation.copy(dummy.quaternion);pieces.push({center:center.clone(),width,length,height,rotation:rotation.clone()});
 for(let j=0;j<16;j++){
  const across=(j/15-.5)*1.6,z=(random()-.5)*length*.55;
  local.set(across*width,height*Math.sqrt(Math.max(0,1-across*across))+.003,z).applyQuaternion(rotation);
  dummy.position.copy(center).add(local);dummy.quaternion.copy(rotation);dummy.rotateY((random()-.5)*.12);
  dummy.scale.set(.0025+random()*.002,.0025,length*(1.35+random()*.55));dummy.updateMatrix();fibres.setMatrixAt(i*16+j,dummy.matrix);
 }
}shreds.castShadow=true;shreds.receiveShadow=true;chicken.add(shreds,fibres);
const seasoning=new THREE.Group();dish.add(seasoning);
const herbs=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,3),new THREE.MeshStandardMaterial({color:0x345d28,roughness:1}),180);
for(let i=0;i<180;i++){
 if(i<140){const piece=pieces[Math.floor(random()*pieces.length)];local.set((random()-.5)*piece.width,piece.height+.012,(random()-.5)*piece.length).applyQuaternion(piece.rotation);dummy.position.copy(piece.center).add(local);}
 else{const r=1.2+random()*.3,a=random()*Math.PI*2;dummy.position.set(Math.cos(a)*r,moundHeight(r,a)+.055,Math.sin(a)*r);}
 dummy.rotation.set(random()*3,random()*3,random()*3);const pepper=i%3!==0;dummy.scale.set(pepper?.008:.02,.006,pepper?.009:.028);dummy.updateMatrix();herbs.setMatrixAt(i,dummy.matrix);herbs.setColorAt(i,new THREE.Color(pepper?0x49372a:0x426337));
}herbs.castShadow=true;seasoning.add(herbs);
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
renderer.render(scene,camera);holder.classList.add('webgl-ready');holder.classList.remove('webgl-failed');if(!paused&&!reduce.matches&&(Math.abs(target-progress)>.0001||p>.86))requestFrame();}
const toggle=document.querySelector('.motion-toggle');toggle.addEventListener('click',()=>{paused=!paused;toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Animasyonu devam ettir':'Animasyonu duraklat');toggle.innerHTML=`<i data-lucide="${paused?'play':'pause'}"></i>`;window.lucide?.createIcons();requestFrame();});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestFrame();}).observe(story);
window.addEventListener('scroll',updateScroll,{passive:true});new ResizeObserver(measure).observe(holder);document.addEventListener('visibilitychange',requestFrame);reduce.addEventListener('change',()=>{measure();requestFrame();});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();visible=false;holder.classList.remove('webgl-ready');holder.classList.add('webgl-failed');});canvas.addEventListener('webglcontextrestored',()=>{visible=true;holder.classList.remove('webgl-failed');requestFrame();});measure();requestFrame();
}



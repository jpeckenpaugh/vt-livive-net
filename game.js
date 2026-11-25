'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s);
const WORLD=1800,ROUND=120;
let width,height,dpr,objects=[],particles=[],state='ready',score=0,remaining=ROUND,eaten=0,last=0;
let hole={x:920,y:960,r:22},camera={x:900,y:900},keys=new Set(),pointer=null;
let best=0;try{best=Number(localStorage.getItem('vacuum-town-best'))||0}catch{}
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=items=>items[Math.floor(Math.random()*items.length)];
let level='city',mouth='classic';
const levelNotes={city:'Parks, colorful homes, and a little everyday chaos.',beach:'Swallow shells, beach balls, umbrellas, palms, and beach huts.',downtown:'Busy blocks, taxis, plazas, and towering glass skyscrapers.'};
try{const savedLevel=localStorage.getItem('vacuum-town-level'),savedMouth=localStorage.getItem('vacuum-town-mouth');if(savedLevel in levelNotes)level=savedLevel;if(['classic','cosmic','shark','monster'].includes(savedMouth))mouth=savedMouth}catch{}
$('#level').value=level;$('#mouth').value=mouth;$('#level-note').textContent=levelNotes[level];
$('#level').addEventListener('change',()=>{level=$('#level').value;$('#level-note').textContent=levelNotes[level];populate();try{localStorage.setItem('vacuum-town-level',level)}catch{}});
$('#mouth').addEventListener('change',()=>{mouth=$('#mouth').value;try{localStorage.setItem('vacuum-town-mouth',mouth)}catch{}});
$('#new-round').addEventListener('click',finish);

let animationTime=0,audioContext,masterGain,lastEatSound=-1,muted=false;
try{muted=localStorage.getItem('vacuum-town-muted')==='true'}catch{}
function unlockAudio(){
 try{if(!audioContext){audioContext=new (window.AudioContext||window.webkitAudioContext)();masterGain=audioContext.createGain();masterGain.gain.value=muted?0:.22;masterGain.connect(audioContext.destination)}if(audioContext.state==='suspended')audioContext.resume().catch(()=>{})}catch{}
}
function tone(freq,endFreq,duration,delay=0,type='sine',volume=.3){
 if(!audioContext||muted||audioContext.state!=='running')return;
 const now=audioContext.currentTime+delay,osc=audioContext.createOscillator(),gain=audioContext.createGain();
 osc.type=type;osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),now+duration);
 gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
 osc.connect(gain);gain.connect(masterGain);osc.start(now);osc.stop(now+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect()};
}
function sound(kind,size=6){
 if(kind==='eat'){if(!audioContext||audioContext.currentTime-lastEatSound<.065)return;lastEatSound=audioContext.currentTime;const pitch=rand(300,440)/(1+size/35);tone(pitch,pitch*.22,.22,0,'sine',.55);tone(pitch*2,pitch*.8,.08,.02,'triangle',.16)}
 if(kind==='start'){tone(330,440,.12,0,'triangle');tone(440,660,.18,.1,'triangle')}
 if(kind==='pause')tone(280,180,.1,0,'triangle',.15);
 if(kind==='end'){[523,659,784,1047].forEach((f,i)=>tone(f,f,.23,i*.12,'triangle',.23))}
}
function updateSoundButton(){const b=$('#sound');b.textContent=muted?'♪ Off':'♪ On';b.setAttribute('aria-label',muted?'Unmute sound effects':'Mute sound effects');b.setAttribute('aria-pressed',String(!muted))}
$('#sound').addEventListener('click',()=>{unlockAudio();muted=!muted;if(masterGain)masterGain.gain.setTargetAtTime(muted?0:.22,audioContext.currentTime,.02);try{localStorage.setItem('vacuum-town-muted',String(muted))}catch{}updateSoundButton();if(!muted)tone(520,660,.1)});updateSoundButton();
function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function populate(){objects=[];particles=[];
 const add=(x,y,r,type,color,extra={})=>objects.push({x,y,r,type,color,...extra});
 for(let row=0;row<6;row++)for(let col=0;col<6;col++){
 const x=col*300,y=row*300;
 if(level==='beach'){
 for(let i=0;i<9;i++)add(x+rand(28,270),y+rand(25,270),rand(4,8),'shell',pick(['#ffe7cb','#efa995','#fff7df']));
 for(let i=0;i<3;i++)add(x+rand(30,250),y+rand(35,255),rand(9,14),'ball',pick(['#ed7466','#5caacb','#f2bc57']));
 for(let i=0;i<2;i++)add(x+rand(45,245),y+rand(40,240),rand(16,23),'umbrella',pick(['#e87969','#579fba','#e9b94f']));
 add(x+rand(40,100),y+rand(60,160),rand(15,21),'palm','#488f69');
 if((row+col)%2===0)add(x+165,y+145,rand(23,34),'building',pick(['#e99d83','#85c5c1','#e8c977']),{height:rand(28,45),left:pick(['#e6ad91','#b7d4c5']),right:'#b38976',roof:'pitched'});
 }else{
 for(let i=0;i<7;i++)add(x+rand(24,233),y+rand(24,225),rand(5,12),'bush',pick(['#659660','#91b866','#649d8b']));
 for(let i=0;i<(level==='city'?4:2);i++)add(x+rand(30,230),y+rand(30,220),rand(11,23),'tree',pick(['#63865a','#87a568','#47785c','#b7ac64','#b37f53']),{variant:Math.random()<.3?'pine':'round'});
 const count=level==='downtown'?3:((row+col)%3===0?2:1);
 const palettes=level==='downtown'?[['#b4d4df','#789fae','#486a83'],['#d1dce0','#92adb9','#657f99'],['#b7b8d1','#8587a6','#5a627e']]:[['#edbe94','#d99c78','#aa715f'],['#e9d4a0','#c5ba89','#a09170'],['#aacdc0','#8db4a2','#668d85'],['#d2bcd4','#b29bb8','#8c7f9d'],['#d7dce0','#b6bcc3','#909eac']];
 for(let i=0;i<count;i++){const palette=pick(palettes),r=rand(level==='city'?22:29,level==='city'?40:44);add(x+65+(i%2)*100,y+70+Math.floor(i/2)*100,r,'building',palette[0],{height:level==='downtown'?rand(100,230):rand(28,90),left:palette[1],right:palette[2],roof:level==='city'&&Math.random()<.4?'pitched':'flat',glass:level==='downtown'})}
 for(let i=0;i<(level==='downtown'?3:1);i++)add(x+270,y+40+i*70+rand(0,25),rand(16,22),'car',pick(level==='downtown'?['#ecc44f','#e6b942','#729cbd','#d7dbd5']:['#d8a45f','#d58170','#8da9b8','#96b2a1']));
 for(let i=0;i<5;i++)add(x+rand(35,240),y+244,rand(5,8),'cone','#db905f');
 }
 }
 objects=objects.filter(o=>Math.hypot(o.x-hole.x,o.y-hole.y)>o.r+32);
 // A clear starting area and nearby small snacks in every map.
 for(let i=0;i<8;i++){const angle=i*Math.PI/4;add(hole.x+Math.cos(angle)*65,hole.y+Math.sin(angle)*65,7,level==='beach'?'shell':'cone','#efb07b')}
}
function roundRect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
// Orthographic oblique camera: ground axes recede diagonally; height stays vertical.
const ISO_X=.86,ISO_Y=.48;
function project(x,y,z=0){return {x:(x-y)*ISO_X,y:(x+y)*ISO_Y-z}}
function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill()}
function groundRect(x,y,w,d,color,z=0){polygon([project(x,y,z),project(x+w,y,z),project(x+w,y+d,z),project(x,y+d,z)],color)}
function box(x,y,w,d,h,top,left,right,z=0){const a=project(x,y,z),b=project(x+w,y,z),c=project(x+w,y+d,z),e=project(x,y+d,z),at=project(x,y,z+h),bt=project(x+w,y,z+h),ct=project(x+w,y+d,z+h),et=project(x,y+d,z+h);polygon([e,c,ct,et],left);polygon([b,c,ct,bt],right);polygon([at,bt,ct,et],top)}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function drawShadow(o){const p=project(o.x,o.y);ctx.save();ctx.translate(p.x,p.y);ctx.transform(1,0,-.7,1,0,0);ellipse(15,8,o.r*1.15,o.r*.5,'#193b4326');ctx.restore()}
function drawObject(o){const r=o.r;ctx.save();if(o.sinking){const t=Math.min(1,1-o.sinking/o.sinkDuration),ease=t*t*(3-2*t),p=project(o.x,o.y),h=project(hole.x,hole.y),arc=Math.sin(t*Math.PI);ctx.translate(p.x+(h.x-p.x)*ease+Math.sin(t*Math.PI*2)*o.sway*arc,p.y+(h.y-p.y)*ease-arc*o.lift+t*t*hole.r*.24);ctx.rotate(o.spin*t*t);const scale=1-Math.pow(t,2.4);ctx.scale(scale*(1+Math.sin(t*o.wobble)*.15),scale*Math.cos(t*o.tilt));ctx.translate(-p.x,-p.y);ctx.globalAlpha=1-Math.pow(t,4)}
 if(o.type==='building'){
 const h=o.height||r*1.7;
 const base=project(o.x,o.y),player=project(hole.x,hole.y);if(state==='playing'&&Math.abs(player.x-base.x)<r*1.85&&player.y>base.y-h-r*.7&&player.y<base.y+r*.96)ctx.globalAlpha*=.25;
 box(o.x-r-3,o.y-r-3,r*2+6,r*2+6,4,'#cbd1d0','#a9b5b8','#98a9af');
 box(o.x-r,o.y-r,r*2,r*2,h,o.color,o.left||'#d7c4a9',o.right||'#a69987',4);
 // Recessed flat roof, parapet, and rooftop air conditioner.
 groundRect(o.x-r+4,o.y-r+4,r*2-8,r*2-8,'#e9ddc6',h+5);
 box(o.x-10,o.y-10,20,17,9,'#c4d1ce','#93a6a6','#71898f',h+5);
 for(let k=0;k<3;k++)groundRect(o.x-7+k*4,o.y-8,1,12,'#7d9294',h+14);
 for(let z=17;z<h-7;z+=20)for(let k=-r+9;k<r-5;k+=17){
 const x=o.x+k,y=o.y+r+.2;
 polygon([project(x,y,z),project(x+9,y,z),project(x+9,y,z+11),project(x,y,z+11)],'#547c89');
 polygon([project(o.x+r+.2,o.y+k,z),project(o.x+r+.2,o.y+k+9,z),project(o.x+r+.2,o.y+k+9,z+11),project(o.x+r+.2,o.y+k,z+11)],'#385e70');
 }
 if(o.roof==='pitched'){
 const peak=project(o.x,o.y,h+26);polygon([project(o.x-r-3,o.y+r+3,h+5),project(o.x+r+3,o.y+r+3,h+5),peak],'#a96554');polygon([project(o.x+r+3,o.y-r-3,h+5),project(o.x+r+3,o.y+r+3,h+5),peak],'#7d514b');
 }else if(o.glass){box(o.x-8,o.y-8,16,16,17,'#b7ccd5','#7595a8','#4c6e87',h+5);const antenna=project(o.x,o.y,h+45),base=project(o.x,o.y,h+20);ctx.strokeStyle='#6a8797';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(antenna.x,antenna.y);ctx.stroke()}
 const doorY=o.y+r+.5;polygon([project(o.x-5,doorY,4),project(o.x+5,doorY,4),project(o.x+5,doorY,23),project(o.x-5,doorY,23)],'#385762');
 }else if(o.type==='tree'){
 const base=project(o.x,o.y);ctx.translate(base.x,base.y);ctx.scale(r/16,r/16);ctx.translate(-base.x,-base.y);
 box(o.x-3,o.y-3,6,6,29,'#a68964','#8c704f','#665741');
 const p=project(o.x,o.y,39);
 const g=ctx.createRadialGradient(p.x-9,p.y-14,2,p.x,p.y,28);g.addColorStop(0,'#a6cf7c');g.addColorStop(.5,o.color);g.addColorStop(1,'#356b58');
 if(o.variant==='pine'){polygon([{x:p.x-23,y:p.y+19},{x:p.x+23,y:p.y+19},{x:p.x,y:p.y-38}],o.color);polygon([{x:p.x-18,y:p.y+1},{x:p.x+18,y:p.y+1},{x:p.x,y:p.y-38}],'#9cb679');ctx.restore();return}ellipse(p.x,p.y,24,29,g);ellipse(p.x-13,p.y+4,12,17,o.color);ellipse(p.x+11,p.y+8,14,17,'#52865d');ellipse(p.x-7,p.y-12,10,9,'#afd58a66');
 }else if(o.type==='car'){
 const base=project(o.x,o.y);ctx.translate(base.x,base.y);ctx.scale(r/19,r/19);ctx.translate(-base.x,-base.y);
 box(o.x-11,o.y-21,22,42,9,o.color,'#af6559','#7e5960',5);
 box(o.x-9,o.y-9,18,21,10,'#a8d7dc','#476c7d','#355262',14);
 groundRect(o.x-8,o.y-5,16,13,o.color,25);
 for(const y of [-13,13]){const p=project(o.x+12,o.y+y,6);ellipse(p.x,p.y,4,6,'#293e48');ellipse(p.x,p.y,2,3,'#93a9ab')}
 box(o.x-9,o.y-22,5,2,3,'#fff3c5','#fff3c5','#eedba3',9);box(o.x+4,o.y-22,5,2,3,'#fff3c5','#fff3c5','#eedba3',9);
  }else if(o.type==='palm'){
 const p=project(o.x,o.y,65);ctx.strokeStyle='#a88b58';ctx.lineWidth=7;const b=project(o.x,o.y);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.quadraticCurveTo(p.x+12,p.y+30,p.x,p.y);ctx.stroke();
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;polygon([p,{x:p.x+Math.cos(a-.3)*20,y:p.y+Math.sin(a-.3)*12},{x:p.x+Math.cos(a)*43,y:p.y+Math.sin(a)*24+8},{x:p.x+Math.cos(a+.3)*16,y:p.y+Math.sin(a+.3)*12}],i%2?'#4d9a6d':'#77b876')}
 }else if(o.type==='umbrella'){
 const p=project(o.x,o.y,33);box(o.x-1,o.y-1,2,2,33,'#e9dac4','#bfa586','#ae9277');for(let i=0;i<8;i++){const a=i*Math.PI/4,b=a+Math.PI/4;polygon([{x:p.x,y:p.y-9},{x:p.x+Math.cos(a)*r*1.5,y:p.y+Math.sin(a)*r*.7},{x:p.x+Math.cos(b)*r*1.5,y:p.y+Math.sin(b)*r*.7}],i%2?'#fff1cf':o.color)}
 }else if(o.type==='ball'){const p=project(o.x,o.y,r);ellipse(p.x,p.y,r,r,o.color);ellipse(p.x-r*.3,p.y-r*.3,r*.5,r*.55,'#ffffff88');ctx.strokeStyle='#fff4dd';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,r*.7,-1,2);ctx.stroke();
 }else if(o.type==='shell'){const p=project(o.x,o.y,3);ellipse(p.x,p.y,r,r*.6,o.color);ctx.strokeStyle='#be917e';ctx.lineWidth=1;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(p.x,p.y+3);ctx.lineTo(p.x+i*r*.6,p.y-r*.45);ctx.stroke()}
 }else if(o.type==='cone'){
 groundRect(o.x-6,o.y-6,12,12,'#eee8d5',1);const p=project(o.x,o.y);polygon([{x:p.x-5,y:p.y},{x:p.x+5,y:p.y},{x:p.x,y:p.y-15}],'#eb975d');ctx.fillStyle='#fff0ce';ctx.fillRect(p.x-2,p.y-8,4,3);
 }else{const p=project(o.x,o.y,5);ellipse(p.x,p.y,r*1.2,r,'#4f8864');ellipse(p.x-3,p.y-4,r*.8,r*.7,'#8cba70');ellipse(p.x-5,p.y-7,r*.4,r*.3,'#b3d58a')}
 ctx.restore()}
function draw(){ctx.clearRect(0,0,width,height);const bg=ctx.createLinearGradient(0,0,0,height);bg.addColorStop(0,'#b5d8d7');bg.addColorStop(1,'#deead4');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
 ctx.save();const cam=project(camera.x,camera.y);ctx.translate(width/2-cam.x,height/2-cam.y);
 groundRect(-1200,-1200,WORLD+2400,WORLD+2400,level==='beach'?'#53b8c8':'#7da6a0',-10);groundRect(0,0,WORLD,WORLD,level==='beach'?'#efd5a0':level==='downtown'?'#657b8e':'#7c9298');
 if(level==='beach'){for(let i=0;i<36;i++){const x=(i*137)%WORLD,y=(i*251)%WORLD;groundRect(x,y,35,2,'#dfbf87');}for(let i=0;i<10;i++)groundRect(-20-i*18,0,4,WORLD,'#c6f2e299');}else{
 for(let i=0;i<6;i++)for(let j=0;j<6;j++){
 const x=i*300,y=j*300;
 box(x+10,y+10,238,230,5,'#d8dfd8','#b4c3c0','#a0b6b5');groundRect(x+23,y+23,212,204,level==='downtown'?'#b4c3c9':'#9ebe8a',5);
 // Paving seams and small park paths.
 for(let k=35;k<235;k+=25){groundRect(x+k,y+11,1,11,'#bdccc5',5);groundRect(x+11,y+k,11,1,'#bdccc5',5)}
 groundRect(x+112,y+24,13,202,'#c6d0ae',5);
 for(let k=0;k<300;k+=38){groundRect(x+271,y+k,2,17,'#d9e4db');groundRect(x+k,y+267,17,2,'#d9e4db')}
 // Zebra crossings at every intersection.
 for(let k=0;k<5;k++){groundRect(x+252+k*9,y+231,5,14,'#e8ede1');groundRect(x+232,y+250+k*9,14,5,'#e8ede1')}
 }
 }
 objects.filter(o=>!o.sinking).forEach(drawShadow);
 const hp=project(hole.x,hole.y);ellipse(hp.x,hp.y+3,hole.r*1.24+7,hole.r*.68+5,'#203e4933');ellipse(hp.x,hp.y,hole.r*1.24+3,hole.r*.68+3,mouth==='cosmic'?'#d2a5ff':mouth==='shark'?'#8ed5ed':mouth==='monster'?'#aedf6b':'#b7f2cf');ellipse(hp.x,hp.y,hole.r*1.24,hole.r*.68,'#355b62');
 const pit=ctx.createLinearGradient(0,hp.y-hole.r*.68,0,hp.y+hole.r*.68);pit.addColorStop(0,'#020f20');pit.addColorStop(1,'#1a3746');ellipse(hp.x,hp.y,hole.r*1.18,hole.r*.6,pit);
 // Nested ellipses continuously collapse toward the dark center.
 ctx.save();ctx.beginPath();ctx.ellipse(hp.x,hp.y,hole.r*1.16,hole.r*.59,0,0,Math.PI*2);ctx.clip();
 for(let i=0;i<6;i++){const phase=(i/6+animationTime*.58)%1,radius=1-phase,alpha=Math.sin(phase*Math.PI)*.55;ctx.strokeStyle=mouth==='cosmic'?`rgba(201,141,255,${alpha})`:`rgba(133,225,214,${alpha})`;ctx.lineWidth=1.2+radius;ctx.beginPath();ctx.ellipse(hp.x,hp.y+phase*hole.r*.14,hole.r*1.18*radius,hole.r*.6*radius,0,0,Math.PI*2);ctx.stroke()}
 for(let i=0;i<5;i++){const angle=animationTime*1.3+i*Math.PI*2/5,radius=hole.r*(.85+.08*Math.sin(animationTime*2+i));ellipse(hp.x+Math.cos(angle)*radius*1.2,hp.y+Math.sin(angle)*radius*.6,1.5,1,'#c3f9df99')}
 ctx.restore();
 if(mouth==='shark'||mouth==='monster'){
 const r=hole.r,bite=1+Math.sin(animationTime*6)*.06;
 ctx.strokeStyle=mouth==='shark'?'#69a9c1':'#81b64e';ctx.lineWidth=Math.max(4,r*.15);ctx.beginPath();ctx.ellipse(hp.x,hp.y,r*1.23,r*.65*bite,0,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<9;i++){const a=i*Math.PI/8;for(const sign of [-1,1]){const x=hp.x+Math.cos(a)*r*1.1,y=hp.y+Math.sin(a)*r*.53*sign;polygon([{x:x-r*.1,y},{x:x+r*.1,y},{x,y:y-sign*r*.24}],'#fff3db')}}
 if(mouth==='monster'){for(const sign of [-1,1]){ellipse(hp.x+sign*r*.65,hp.y-r*.7,r*.22,r*.23,'#b8e779');ellipse(hp.x+sign*r*.65,hp.y-r*.73,r*.13,r*.14,'#fff9db');ellipse(hp.x+sign*r*.65,hp.y-r*.71,r*.065,r*.09,'#213d35')}}
 else{polygon([{x:hp.x+r*.65,y:hp.y-r*.47},{x:hp.x+r*.95,y:hp.y-r*1.15},{x:hp.x+r*1.25,y:hp.y-r*.1}],'#69a9c1')}
 }
 objects.sort((a,b)=>(a.x+a.y)-(b.x+b.y));objects.forEach(drawObject);
 particles.forEach(p=>{const q=project(p.x,p.y,32);ctx.globalAlpha=p.life;ctx.fillStyle='#fff6d8';ctx.strokeStyle='#284e51';ctx.lineWidth=3;ctx.font='bold 17px sans-serif';ctx.textAlign='center';ctx.strokeText('+'+p.points,q.x,q.y);ctx.fillText('+'+p.points,q.x,q.y)});ctx.globalAlpha=1;
 if(state==='playing'){ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('YOU',hp.x,hp.y-hole.r*.68-15)}ctx.restore()}
function updateHUD(){$('#score').textContent=score;$('#time').textContent=Math.floor(Math.ceil(remaining)/60)+':'+String(Math.ceil(remaining)%60).padStart(2,'0');$('#size').innerHTML=(hole.r/22).toFixed(1)+'<span>×</span>';$('#progress').style.width=Math.min(100,(hole.r-22)/80*100)+'%'}
function frame(t){const dt=Math.min((t-last)/1000,.04)||0;last=t;if(state==='playing'||state==='ready')animationTime+=dt;
 if(state==='playing'){
 remaining=Math.max(0,remaining-dt);let dx=0,dy=0;if(keys.has('arrowleft')||keys.has('a'))dx--;if(keys.has('arrowright')||keys.has('d'))dx++;if(keys.has('arrowup')||keys.has('w'))dy--;if(keys.has('arrowdown')||keys.has('s'))dy++;
 if(!dx&&!dy&&pointer){dx=pointer.x-width/2;dy=pointer.y-height/2;if(Math.hypot(dx,dy)<7){dx=0;dy=0}}
 // Convert screen direction back to the ground plane for intuitive controls.
 const screenX=dx,screenY=dy;dx=screenX/(2*ISO_X)+screenY/(2*ISO_Y);dy=-screenX/(2*ISO_X)+screenY/(2*ISO_Y);
 const length=Math.hypot(dx,dy);if(length){const speed=210+hole.r*.45;hole.x=Math.max(hole.r,Math.min(WORLD-hole.r,hole.x+dx/length*speed*dt));hole.y=Math.max(hole.r,Math.min(WORLD-hole.r,hole.y+dy/length*speed*dt))}
 for(const o of objects){if(o.sinking){o.sinking-=dt;if(o.sinking<=0)o.gone=true}else if(o.r<hole.r*.78&&Math.hypot(o.x-hole.x,o.y-hole.y)<hole.r-o.r*.25){o.sinkDuration=rand(.5,.85);o.sinking=o.sinkDuration;o.spin=rand(-2.8,2.8);o.sway=rand(-16,16);o.lift=rand(9,30);o.wobble=rand(5,10);o.tilt=rand(-1.15,1.15);sound('eat',o.r);const points=o.type==='building'?100:o.type==='car'?30:['tree','palm','umbrella'].includes(o.type)?15:5;score+=points;eaten++;hole.r=Math.min(125,Math.sqrt(hole.r*hole.r+o.r*o.r*.23));particles.push({x:o.x,y:o.y-15,points,life:1})}}
 objects=objects.filter(o=>!o.gone);particles.forEach(p=>{p.life-=dt;p.y-=dt*30});particles=particles.filter(p=>p.life>0);updateHUD();if(!remaining||!objects.length)finish();
 }
 const offset=state==='ready'?140:0;const targetX=hole.x-offset,targetY=hole.y+offset;camera.x+=(targetX-camera.x)*Math.min(1,dt*7);camera.y+=(targetY-camera.y)*Math.min(1,dt*7);draw();requestAnimationFrame(frame)}
function start(){$('#setup').hidden=true;$('#new-round').hidden=true;unlockAudio();sound('start');hole={x:920,y:960,r:22};score=0;eaten=0;remaining=ROUND;populate();state='playing';pointer=null;keys.clear();$('#overlay').hidden=true;$('#hud').hidden=false;$('#pause').hidden=false;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game');document.body.classList.add('playing');$('#hint').textContent='Eat objects smaller than your hole. Keep moving to grow.';updateHUD()}
function finish(){$('#hud').hidden=true;$('#setup').hidden=false;$('#new-round').hidden=true;state='ended';sound('end');best=Math.max(best,score);try{localStorage.setItem('vacuum-town-best',best)}catch{}$('#overlay').hidden=false;$('#pause').hidden=true;$('#eyebrow').textContent='THAT WAS A TASTY LITTLE TOWN.';$('#title').innerHTML=score.toLocaleString()+' points.<br><em>Still hungry?</em>';$('#description').textContent=`You swallowed ${eaten} objects and grew to ${(hole.r/22).toFixed(1)}× your starting size.`;$('#start').innerHTML='Play again <span>◉</span>';$('#best').textContent='PERSONAL BEST · '+best.toLocaleString()+' POINTS'}
function pause(){unlockAudio();sound('pause');if(state==='playing'){$('#setup').hidden=true;$('#new-round').hidden=false;state='paused';$('#overlay').hidden=false;$('#eyebrow').textContent='TAKE A BREATHER.';$('#title').innerHTML='A little<br><em>intermission.</em>';$('#description').textContent='Your appetite can wait. The town will still be here.';$('#start').innerHTML='Keep eating <span>◉</span>';$('#pause').textContent='▶';$('#pause').setAttribute('aria-label','Resume game')}else if(state==='paused'){state='playing';$('#new-round').hidden=true;$('#overlay').hidden=true;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game')}}
$('#start').addEventListener('click',()=>state==='paused'?pause():start());$('#pause').addEventListener('click',pause);
addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();keys.add(key);if(key==='escape')pause()});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)pointer={x:e.clientX,y:e.clientY}});canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')pointer=null});canvas.addEventListener('pointerleave',()=>pointer=null);addEventListener('blur',()=>{keys.clear();pointer=null;if(state==='playing')pause()});
if(best)$('#best').textContent='PERSONAL BEST · '+best.toLocaleString()+' POINTS';populate();requestAnimationFrame(frame);

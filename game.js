'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s);
const WORLD=1800,ROUND=120;
let width,height,dpr,objects=[],particles=[],blocks=[],state='ready',score=0,remaining=ROUND,eaten=0,last=0;
let hole={x:920,y:960,r:22},camera={x:900,y:900},keys=new Set(),pointer=null;
let best=0;try{best=Number(localStorage.getItem('vacuum-town-best'))||0}catch{}
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=items=>items[Math.floor(Math.random()*items.length)];
let level='city',mouth='classic';
const levelNotes={city:'Leafy parks, parking lots, fountain plazas, and colorful homes.',beach:'Swallow shells, beach balls, umbrellas, palms, and beach huts.',downtown:'Busy blocks, taxis, plazas, and towering glass skyscrapers.'};
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
function populate(){objects=[];particles=[];blocks=[];
 const districtTypes=level==='downtown'?[...Array(20).fill('buildings'),...Array(5).fill('park'),...Array(6).fill('parking'),...Array(5).fill('plaza')]:[...Array(16).fill('buildings'),...Array(8).fill('park'),...Array(7).fill('parking'),...Array(5).fill('plaza')];
 for(let i=districtTypes.length-1;i>0;i--){const j=Math.floor(rand(0,i+1));[districtTypes[i],districtTypes[j]]=[districtTypes[j],districtTypes[i]]}

 const add=(x,y,r,type,color,extra={})=>objects.push({x,y,r,type,color,...extra});
 for(let row=0;row<6;row++)for(let col=0;col<6;col++){
 const x=col*300,y=row*300,kind=districtTypes[row*6+col];blocks.push({x,y,kind});
 if(level==='beach'){
 for(let i=0;i<9;i++)add(x+rand(28,270),y+rand(25,270),rand(4,8),'shell',pick(['#ffe7cb','#efa995','#fff7df']));
 for(let i=0;i<3;i++)add(x+rand(30,250),y+rand(35,255),rand(9,14),'ball',pick(['#ed7466','#5caacb','#f2bc57']));
 for(let i=0;i<2;i++)add(x+rand(45,245),y+rand(40,240),rand(16,23),'umbrella',pick(['#e87969','#579fba','#e9b94f']));
 add(x+rand(40,100),y+rand(60,160),rand(15,21),'palm','#488f69');
 if((row+col)%2===0)add(x+165,y+145,rand(23,34),'building',pick(['#e99d83','#85c5c1','#e8c977']),{height:rand(28,45),left:pick(['#e6ad91','#b7d4c5']),right:'#b38976',roof:'pitched'});
 }else{
 if(kind==='buildings'){
 for(let i=0;i<5;i++)add(x+rand(24,233),y+rand(24,225),rand(5,12),'bush',pick(['#659660','#91b866','#649d8b']));
 for(let i=0;i<(level==='city'?3:1);i++)add(x+rand(30,230),y+rand(30,220),rand(11,23),'tree',pick(['#63865a','#87a568','#b7ac64']),{variant:Math.random()<.3?'pine':'round'});
 const count=level==='downtown'?3:((row+col)%3===0?2:1);
 const palettes=level==='downtown'?[['#b4d4df','#789fae','#486a83'],['#d1dce0','#92adb9','#657f99'],['#b7b8d1','#8587a6','#5a627e']]:[['#edbe94','#d99c78','#aa715f'],['#e9d4a0','#c5ba89','#a09170'],['#aacdc0','#8db4a2','#668d85'],['#d2bcd4','#b29bb8','#8c7f9d'],['#d7dce0','#b6bcc3','#909eac']];
 for(let i=0;i<count;i++){
 const palette=pick(palettes),shape=pick(['wide','compact','tower','deep']);
 const w=shape==='wide'?rand(78,96):shape==='tower'?rand(34,46):rand(44,68);
 const d=shape==='deep'?rand(76,94):shape==='tower'?rand(34,48):rand(42,64);
 const height=shape==='wide'?rand(25,level==='downtown'?70:42):shape==='tower'?rand(level==='downtown'?165:80,level==='downtown'?245:125):rand(40,level==='downtown'?145:75);
 add(x+65+(i%2)*110,y+70+Math.floor(i/2)*110,Math.max(w,d)/2,'building',palette[0],{width:w,depth:d,height,left:palette[1],right:palette[2],roof:level==='city'&&shape!=='tower'&&Math.random()<.4?'pitched':'flat',glass:level==='downtown'});
 }

 }else if(kind==='park'){
 for(const [dx,dy] of [[48,48],[195,48],[48,185],[195,185],[55,115],[190,115]])add(x+dx+rand(-9,9),y+dy+rand(-9,9),rand(13,23),'tree',pick(['#63865a','#87a568','#b7ac64']),{variant:Math.random()<.3?'pine':'round'});
 for(let i=0;i<8;i++)add(x+rand(35,220),y+rand(35,215),rand(5,9),'flowers',pick(['#ed9a9a','#f2d276','#c7a8e5']));
 add(x+85,y+95,15,'bench','#ae8058');add(x+160,y+160,15,'bench','#ae8058');
 }else if(kind==='parking'){
 for(let row=0;row<2;row++)for(let bay=0;bay<5;bay++)if(Math.random()<.7){
 const px=x+47+bay*38,py=y+60+row*115;
 add(px,py,rand(16,20),'car',pick(['#d58170','#8da9b8','#96b2a1','#e9c56a']),{parked:true,heading:row?Math.PI/2:-Math.PI/2,speed:48,route:[{x:px,y:y+38},{x:px,y:y+198}],target:row?0:1});
 }
 for(const dx of [40,215])add(x+dx,y+218,9,'bush','#789b60');
 }else{
 add(x+130,y+120,25,'fountain','#88bdc9');
 for(const [dx,dy] of [[60,55],[190,55],[60,190],[190,190]]){add(x+dx,y+dy,12,'planter','#9faeb0');add(x+dx+22,y+dy,15,'bench','#ae8058')}
 }
 // Parked roadside cars have a lane available if they need to escape.
 if(kind==='buildings'||kind==='plaza')for(let i=0;i<(level==='downtown'?2:1);i++)add(x+270,y+55+i*80,18,'car',pick(['#ecc44f','#729cbd','#d7dbd5']),{parked:true,speed:50,heading:-Math.PI/2,route:[{x:x+270,y:25},{x:x+270,y:WORLD-25}],target:0});
 for(let i=0;i<3;i++)add(x+rand(35,240),y+244,rand(5,8),'cone','#db905f');
 // Clockwise sidewalk circuits stay clear of the building footprints.
 const walkRoute=[{x:x+18,y:y+18},{x:x+240,y:y+18},{x:x+240,y:y+232},{x:x+18,y:y+232}];
 for(let i=0;i<(level==='downtown'?5:3);i++){
 const edge=Math.floor(rand(0,4)),a=walkRoute[edge],b=walkRoute[(edge+1)%4],t=Math.random();
 add(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,6,'person',pick(['#df795e','#638cba','#d6b258','#ad80b5','#5f9c8b']),{route:walkRoute,target:(edge+1)%4,speed:rand(15,26),stride:rand(0,6.28),skin:pick(['#e9b995','#bc8864','#865c46']),heading:Math.atan2(b.y-a.y,b.x-a.x)});
 }
 // A moving car follows a closed road circuit around a neighboring block.
 if(row<5&&col<5){
 const route=[{x:x+280,y:y+280},{x:x+558,y:y+280},{x:x+558,y:y+554},{x:x+280,y:y+554}];
 const edge=(row+col)%4,a=route[edge],b=route[(edge+1)%4],t=rand(.1,.8);
 add(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,18,'car',pick(['#e8be4f','#d57765','#6998b8','#94b79d']),{route,target:(edge+1)%4,speed:rand(42,67),heading:Math.atan2(b.y-a.y,b.x-a.x)});
 }

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
 const h=o.height||r*1.7,rx=(o.width||r*2)/2,ry=(o.depth||r*2)/2;
 const base=project(o.x,o.y),player=project(hole.x,hole.y),halfWidth=(rx+ry)*ISO_X;
 if(state==='playing'&&Math.abs(player.x-base.x)<halfWidth+8&&player.y>base.y-h-(rx+ry)*ISO_Y&&player.y<base.y+(rx+ry)*ISO_Y)ctx.globalAlpha*=.25;
 box(o.x-rx-3,o.y-ry-3,rx*2+6,ry*2+6,4,'#cbd1d0','#a9b5b8','#98a9af');
 box(o.x-rx,o.y-ry,rx*2,ry*2,h,o.color,o.left||'#d7c4a9',o.right||'#a69987',4);
 groundRect(o.x-rx+4,o.y-ry+4,rx*2-8,ry*2-8,'#e9ddc6',h+5);
 if(o.roof!=='pitched'){
 box(o.x-8,o.y-8,16,16,9,'#c4d1ce','#93a6a6','#71898f',h+5);
 for(let k=0;k<3;k++)groundRect(o.x-5+k*4,o.y-6,1,12,'#7d9294',h+14);
 }
 for(let z=17;z<h-7;z+=20){
 for(let k=-rx+8;k<rx-9;k+=16){const x=o.x+k,y=o.y+ry+.2;polygon([project(x,y,z),project(x+8,y,z),project(x+8,y,z+11),project(x,y,z+11)],'#547c89')}
 for(let k=-ry+8;k<ry-9;k+=16){const x=o.x+rx+.2,y=o.y+k;polygon([project(x,y,z),project(x,y+8,z),project(x,y+8,z+11),project(x,y,z+11)],'#385e70')}
 }
 if(o.roof==='pitched'){
 const peak=project(o.x,o.y,h+26);polygon([project(o.x-rx-3,o.y+ry+3,h+5),project(o.x+rx+3,o.y+ry+3,h+5),peak],'#a96554');polygon([project(o.x+rx+3,o.y-ry-3,h+5),project(o.x+rx+3,o.y+ry+3,h+5),peak],'#7d514b');
 }else if(o.glass){box(o.x-6,o.y-6,12,12,17,'#b7ccd5','#7595a8','#4c6e87',h+5);const antenna=project(o.x,o.y,h+45),base=project(o.x,o.y,h+20);ctx.strokeStyle='#6a8797';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(antenna.x,antenna.y);ctx.stroke()}
 const doorY=o.y+ry+.5;polygon([project(o.x-5,doorY,4),project(o.x+5,doorY,4),project(o.x+5,doorY,23),project(o.x-5,doorY,23)],'#385762');
 }else if(o.type==='bench'){
 for(const dx of [-10,10])box(o.x+dx-2,o.y-4,4,10,9,'#526865','#415c59','#3a4c48');
 box(o.x-17,o.y-7,34,14,3,'#c7996a','#9b704e','#7e6048',9);box(o.x-17,o.y+5,34,3,11,'#c7996a','#9b704e','#7e6048',12);
 }else if(o.type==='planter'){
 box(o.x-10,o.y-10,20,20,13,'#aab8b0','#889e95','#718b83');const p=project(o.x,o.y,17);ellipse(p.x,p.y,13,9,'#759d61');ellipse(p.x-3,p.y-4,8,6,'#aac77b');
 }else if(o.type==='flowers'){
 const p=project(o.x,o.y,3);ellipse(p.x,p.y,r*1.4,r*.7,'#759c61');for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(p.x+Math.cos(a)*r*.8,p.y-3+Math.sin(a)*r*.4,2.5,2,o.color)}
 }else if(o.type==='fountain'){
 const p=project(o.x,o.y,5);ellipse(p.x,p.y+4,33,19,'#8da8ac');ellipse(p.x,p.y,33,18,'#d2e0d6');ellipse(p.x,p.y,27,14,'#6cb8c6');
 for(let i=0;i<3;i++){const phase=(animationTime*.7+i/3)%1;ctx.strokeStyle=`rgba(228,255,248,${1-phase})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,phase*25,phase*12,0,0,Math.PI*2);ctx.stroke()}
 box(o.x-3,o.y-3,6,6,16,'#e7eee0','#a7c3bf','#87aaa8',6);ctx.strokeStyle='#d7faf2';ctx.lineWidth=2;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(p.x,p.y-24);ctx.quadraticCurveTo(p.x+i*12,p.y-39+Math.sin(animationTime*3+i)*2,p.x+i*18,p.y-3);ctx.stroke()}
 }else if(o.type==='tree'){
 const base=project(o.x,o.y);ctx.translate(base.x,base.y);ctx.scale(r/16,r/16);ctx.translate(-base.x,-base.y);
 box(o.x-3,o.y-3,6,6,29,'#a68964','#8c704f','#665741');
 const p=project(o.x,o.y,39);
 const g=ctx.createRadialGradient(p.x-9,p.y-14,2,p.x,p.y,28);g.addColorStop(0,'#a6cf7c');g.addColorStop(.5,o.color);g.addColorStop(1,'#356b58');
 if(o.variant==='pine'){polygon([{x:p.x-23,y:p.y+19},{x:p.x+23,y:p.y+19},{x:p.x,y:p.y-38}],o.color);polygon([{x:p.x-18,y:p.y+1},{x:p.x+18,y:p.y+1},{x:p.x,y:p.y-38}],'#9cb679');ctx.restore();return}ellipse(p.x,p.y,24,29,g);ellipse(p.x-13,p.y+4,12,17,o.color);ellipse(p.x+11,p.y+8,14,17,'#52865d');ellipse(p.x-7,p.y-12,10,9,'#afd58a66');
 }else if(o.type==='car'){
 const heading=o.heading??-Math.PI/2,scale=r/19;
 const P=(x,y,z=0)=>project(o.x+(x*Math.cos(heading)-y*Math.sin(heading))*scale,o.y+(x*Math.sin(heading)+y*Math.cos(heading))*scale,z*scale);
 const face=(points,color)=>polygon(points.map(p=>P(...p)),color);
 const body=(x,y,w,d,z,h,top,side,end)=>{
 const nearY=Math.cos(heading)-Math.sin(heading)>0?y+d:y,nearX=Math.cos(heading)+Math.sin(heading)>0?x+w:x;
 face([[x,nearY,z],[x+w,nearY,z],[x+w,nearY,z+h],[x,nearY,z+h]],side);
 face([[nearX,y,z],[nearX,y+d,z],[nearX,y+d,z+h],[nearX,y,z+h]],end);
 face([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],top);
 };
 // Wheels on both sides keep the silhouette readable in all four directions.
 for(const side of [-1,1])for(const x of [-12,12]){const p=P(x,side*11,6);ellipse(p.x,p.y,4*scale,5*scale,'#293e48');ellipse(p.x,p.y,2*scale,3*scale,'#93a9ab')}
 body(-21,-10,42,20,6,9,o.color,'#977c75','#836c69');body(-10,-9,21,18,15,10,'#a8d7dc','#476c7d','#355262');
 face([[-6,-8,26],[7,-8,26],[7,8,26],[-6,8,26]],o.color);
 for(const side of [-1,1]){const p=P(22,side*6,12);ellipse(p.x,p.y,2.4,2,'#fff3c5');const back=P(-22,side*6,12);ellipse(back.x,back.y,2,1.8,'#d65e52')}
 }else if(o.type==='person'){
 const p=project(o.x,o.y),step=Math.sin(o.stride)*3.5,bob=Math.abs(Math.sin(o.stride))*.8;
 const facing=project(Math.cos(o.heading),Math.sin(o.heading)),length=Math.hypot(facing.x,facing.y),dx=facing.x/length,dy=facing.y/length;
 ctx.lineCap='round';ctx.lineWidth=3;ctx.strokeStyle='#344853';
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(p.x+side*2,p.y-8-bob);ctx.lineTo(p.x+side*2+dx*step*side,p.y+dy*step*side);ctx.stroke()}
 ctx.strokeStyle=o.color;ctx.lineWidth=3;
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(p.x+side*4,p.y-17-bob);ctx.lineTo(p.x+side*5-dx*step*side*.8,p.y-10-bob-dy*step*side);ctx.stroke()}
 roundRect(p.x-4,p.y-20-bob,8,13,3,o.color);ellipse(p.x,p.y-24-bob,4.5,5,o.skin);ellipse(p.x-1,p.y-27-bob,4.3,2.5,'#4e403b');
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
 for(const {x,y,kind} of blocks){
 box(x+10,y+10,238,230,5,'#d8dfd8','#b4c3c0','#a0b6b5');
 groundRect(x+23,y+23,212,204,kind==='parking'?'#778991':kind==='plaza'?'#c5c7ba':kind==='park'?'#8fb77e':level==='downtown'?'#b4c3c9':'#9ebe8a',5);
 for(let k=35;k<235;k+=25){groundRect(x+k,y+11,1,11,'#bdccc5',5);groundRect(x+11,y+k,11,1,'#bdccc5',5)}
 if(kind==='park'){
 groundRect(x+111,y+24,18,203,'#d5c9a7',5);groundRect(x+24,y+103,211,18,'#d5c9a7',5);
 }else if(kind==='parking'){
 for(let bay=0;bay<=5;bay++){groundRect(x+28+bay*38,y+30,2,65,'#e8e8cd',5);groundRect(x+28+bay*38,y+145,2,65,'#e8e8cd',5)}
 groundRect(x+28,y+30,192,2,'#e8e8cd',5);groundRect(x+28,y+209,192,2,'#e8e8cd',5);
 for(let k=45;k<215;k+=32)groundRect(x+k,y+121,15,2,'#e7d69e',5);
 }else if(kind==='plaza'){
 for(let k=35;k<230;k+=24){groundRect(x+k,y+24,1,202,'#aeb8af',5);groundRect(x+24,y+k,210,1,'#aeb8af',5)}
 }else groundRect(x+112,y+24,13,202,'#c6d0ae',5);
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
// Sample a route in either direction; used both for movement and escape decisions.
function routeStep(o,travel,reverse=false){
 const route=o.route,n=route.length,dir=reverse?-(o.routeDir||1):(o.routeDir||1);
 let target=reverse?(o.target-(o.routeDir||1)+n)%n:o.target,x=o.x,y=o.y;
 for(let i=0;i<n+2;i++){
 const goal=route[target],dx=goal.x-x,dy=goal.y-y,distance=Math.hypot(dx,dy);
 if(distance>travel){x+=dx/distance*travel;y+=dy/distance*travel;return {x,y,target,dir}}
 x=goal.x;y=goal.y;travel-=distance;target=(target+dir+n)%n;if(travel<=.001)break;
 }
 return {x,y,target,dir};
}
function updateResidents(dt){
 for(const o of objects){if(!o.route||o.sinking)continue;
 const distance=Math.hypot(o.x-hole.x,o.y-hole.y),alert=hole.r+(o.type==='person'?105:130);
 o.fleeing=distance<alert||(o.fleeing&&distance<alert+45);
 if(o.parked&&!o.fleeing)continue;
 let reverse=false,speed=o.speed;
 if(o.fleeing){
 const ahead=routeStep(o,30),back=routeStep(o,30,true),forwardSafety=Math.hypot(ahead.x-hole.x,ahead.y-hole.y),backSafety=Math.hypot(back.x-hole.x,back.y-hole.y);
 // Choose the safer direction along the street/sidewalk instead of cutting through buildings.
 reverse=backSafety>forwardSafety+1;
 if(Math.max(forwardSafety,backSafety)<distance-2)continue;
 speed*=o.type==='person'?1.9:1.55;
 }
 const next=routeStep(o,speed*dt,reverse),dx=next.x-o.x,dy=next.y-o.y;
 o.x=next.x;o.y=next.y;o.target=next.target;o.routeDir=next.dir;
 if(Math.hypot(dx,dy)>.001)o.heading=Math.atan2(dy,dx);
 if(o.type==='person')o.stride+=dt*speed*.3;
 }
}
function frame(t){const dt=Math.min((t-last)/1000,.04)||0;last=t;if(state==='playing'||state==='ready')animationTime+=dt;
 if(state==='playing'){
 remaining=Math.max(0,remaining-dt);updateResidents(dt);let dx=0,dy=0;if(keys.has('arrowleft')||keys.has('a'))dx--;if(keys.has('arrowright')||keys.has('d'))dx++;if(keys.has('arrowup')||keys.has('w'))dy--;if(keys.has('arrowdown')||keys.has('s'))dy++;
 if(!dx&&!dy&&pointer){dx=pointer.x-width/2;dy=pointer.y-height/2;if(Math.hypot(dx,dy)<7){dx=0;dy=0}}
 // Convert screen direction back to the ground plane for intuitive controls.
 const screenX=dx,screenY=dy;dx=screenX/(2*ISO_X)+screenY/(2*ISO_Y);dy=-screenX/(2*ISO_X)+screenY/(2*ISO_Y);
 const length=Math.hypot(dx,dy);if(length){const speed=210+hole.r*.45;hole.x=Math.max(hole.r,Math.min(WORLD-hole.r,hole.x+dx/length*speed*dt));hole.y=Math.max(hole.r,Math.min(WORLD-hole.r,hole.y+dy/length*speed*dt))}
 for(const o of objects){if(o.sinking){o.sinking-=dt;if(o.sinking<=0)o.gone=true}else if(o.r<hole.r*.78&&Math.hypot(o.x-hole.x,o.y-hole.y)<hole.r-o.r*.25){o.sinkDuration=rand(.5,.85);o.sinking=o.sinkDuration;o.spin=rand(-2.8,2.8);o.sway=rand(-16,16);o.lift=rand(9,30);o.wobble=rand(5,10);o.tilt=rand(-1.15,1.15);sound('eat',o.r);const points=o.type==='building'?100:o.type==='car'?30:o.type==='fountain'?50:['tree','palm','umbrella','bench','planter'].includes(o.type)?15:5;score+=points;eaten++;hole.r=Math.min(125,Math.sqrt(hole.r*hole.r+o.r*o.r*.23));particles.push({x:o.x,y:o.y-15,points,life:1})}}
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

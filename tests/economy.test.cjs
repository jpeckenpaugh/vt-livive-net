const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
function loadGame(saved=new Map(),blocked=false){
 const noop=()=>{},drawing=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(target,key)=>target[key]??noop});
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,{value:'',hidden:false,style:{},options:[],setAttribute:noop,addEventListener:noop,getContext:()=>drawing});return elements.get(id)};
 const context=vm.createContext({localStorage:{getItem:key=>{if(blocked)throw Error('Unavailable');return saved.get(key)??null},setItem:(key,value)=>{if(blocked)throw Error('Unavailable');saved.set(key,value)}},document:{querySelector:get,body:{classList:{add:noop}}},innerWidth:1000,innerHeight:800,devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:noop,console});
 vm.runInContext(source('economy.js'),context);vm.runInContext(source('game.js'),context);
 return {run:code=>vm.runInContext(code,context),saved};
}
test('welcome grant is issued once and wallet survives reload',()=>{
 const {run,saved}=loadGame();assert.equal(run('Economy.coins'),100);run('Economy.earn(50)');assert.equal(loadGame(saved).run('Economy.coins'),150);
});
test('purchases cannot overspend or charge twice',()=>{
 const {run}=loadGame();assert.equal(run("Economy.buy('beach')"),false);assert.equal(run('Economy.coins'),100);
 assert.equal(run("Economy.buy('cosmic')"),true);assert.equal(run('Economy.coins'),20);assert.equal(run("Economy.buy('cosmic')"),false);assert.equal(run('Economy.coins'),20);assert.equal(run("Economy.buy('invalid')"),false);
});
test('maps, mouths, and equipped extras persist after purchase',()=>{
 const {run,saved}=loadGame();run("Economy.earn(1000);Economy.buy('beach');Economy.buy('shark');Economy.buy('goldtrail');Economy.equip('goldtrail')");
 const reload=loadGame(saved);assert.equal(reload.run("Economy.owns('beach')&&Economy.owns('shark')"),true);assert.equal(reload.run('Economy.extra'),'goldtrail');assert.equal(reload.run("Economy.equip('amber')"),false);assert.equal(reload.run("Economy.equip('none')"),true);
});
test('invalid awards are ignored and damaged saves recover',()=>{
 const {run}=loadGame();run('Economy.earn(-10);Economy.earn(NaN);Economy.earn(.5)');assert.equal(run('Economy.coins'),100);
 const saved=new Map([['vacuum-town-economy-v1','{bad JSON']]);assert.equal(loadGame(saved).run('Economy.coins'),100);
});
test('game remains playable when browser storage is blocked',()=>{
 const {run}=loadGame(new Map(),true);assert.equal(run('Economy.storageAvailable'),false);run('start()');assert.equal(run('state'),'playing');run('Economy.earn(10)');assert.equal(run('Economy.coins'),110);
});
test('swallowing pays once and round completion cannot be collected twice',()=>{
 const {run}=loadGame();run("start();objects=[{x:hole.x,y:hole.y,r:7,type:'bush',color:'#789'}];last=1000;frame(1020)");assert.equal(run('Economy.coins'),101);run('frame(1040)');assert.equal(run('Economy.coins'),101);
 run('remaining=0;finish()');assert.equal(run('Economy.coins'),126);run('finish()');assert.equal(run('Economy.coins'),126);
});
test('growth milestones award once and abandoning a round preserves earned coins',()=>{
 const {run}=loadGame();run("start();hole.r=43.9;objects=[{x:hole.x,y:hole.y,r:7,type:'bush',color:'#789'}];last=1000;frame(1020)");assert.equal(run('roundCoins'),26);run('pause();finish();finish()');assert.equal(run('Economy.coins'),126);run('start()');assert.equal(run('roundCoins'),0);assert.equal(run('Economy.coins'),126);
});
test('locked map selection cannot start a round',()=>{
 const {run}=loadGame();run("level='downtown';start()");assert.equal(run('state'),'ready');
});

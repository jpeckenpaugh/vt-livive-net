'use strict';
// All currency is earned in-game and stored only in this browser.
const Economy=(()=>{
 const key='vacuum-town-economy-v1';
 const catalog=[
  {id:'cosmic',kind:'mouth',name:'Cosmic Purple',icon:'✦',price:80,description:'A violet vortex with glowing rings.'},
  {id:'shark',kind:'mouth',name:'Shark Bite',icon:'🦈',price:160,description:'A toothy grin and a little dorsal fin.'},
  {id:'monster',kind:'mouth',name:'Green Monster',icon:'👾',price:240,description:'Big eyes. Bigger appetite.'},
  {id:'beach',kind:'level',name:'Beach',icon:'☀',price:200,description:'Palms, umbrellas, beach huts, and sunshine.'},
  {id:'downtown',kind:'level',name:'Downtown',icon:'▥',price:450,description:'Skyscrapers, plazas, and busy streets.'},
  {id:'goldtrail',kind:'extra',name:'Golden Wake',icon:'✧',price:120,description:'Leave a sparkling golden trail behind you.'},
  {id:'amber',kind:'extra',name:'Amber Aura',icon:'◎',price:180,description:'Wrap your mouth in a pulsing amber halo.'}
 ];
 const defaults=()=>({coins:100,earned:0,owned:['city','classic'],extra:'none'});
 let data=defaults(),storageAvailable=true;
 try{const raw=localStorage.getItem(key);if(raw){const saved=JSON.parse(raw);if(!saved||!Number.isSafeInteger(saved.coins)||saved.coins<0||!Array.isArray(saved.owned))throw Error('Invalid save');data={coins:saved.coins,earned:Number.isSafeInteger(saved.earned)&&saved.earned>=0?saved.earned:0,owned:[...new Set(['city','classic',...saved.owned.filter(id=>catalog.some(item=>item.id===id))])],extra:'none'};if(saved.extra==='none'||catalog.some(item=>item.kind==='extra'&&item.id===saved.extra&&data.owned.includes(item.id)))data.extra=saved.extra}}
 catch{data=defaults()}
 function save(){try{localStorage.setItem(key,JSON.stringify(data));storageAvailable=true}catch{storageAvailable=false}}
 function owns(id){return id==='none'||data.owned.includes(id)}
 function earn(amount){if(!Number.isSafeInteger(amount)||amount<=0)return;data.coins+=amount;data.earned+=amount;save()}
 function buy(id){const item=catalog.find(item=>item.id===id);if(!item||owns(id))return false;if(data.coins<item.price)return false;data.coins-=item.price;data.owned.push(id);save();return true}
 function equip(id){if(id!=='none'&&!catalog.some(item=>item.kind==='extra'&&item.id===id))return false;if(!owns(id))return false;data.extra=id;save();return true}
 save();
 return {catalog,owns,earn,buy,equip,get coins(){return data.coins},get extra(){return data.extra},get storageAvailable(){return storageAvailable}};
})();

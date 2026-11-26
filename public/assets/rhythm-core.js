/* Shared pure rhythm functions: browser + Node, with no DOM or device access. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.DrumCore=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const partNames={kick:'Kick',sn:'Snare',hh:'Hi-hat',tom:'High tom',floor:'Floor tom',ride:'Ride',crash:'Crash'};
function events(p,i){
 const out=[];
 for(const k of Object.keys(partNames))if((p[k]||[]).includes(i))out.push([k,p.velocities?.[k+':'+i]??((p.accent||[]).includes(i)?1:.72)]);
 if((p.soft||[]).includes(i))out.push(['sn',.18]);
 return out;
}
function safeText(s,max=100){return String(s??'').replace(/[\u0000-\u001f]/g,' ').slice(0,max);}

function countLabel(i,q){const b=Math.floor(i/q)%4+1,j=i%q;return j===0?String(b):q===2?'&':q===4?['','e','&','a'][j]:q===3?['','trip','let'][j]:String(j+1);}

function cleanPattern(data){
 if(!data||typeof data!=='object'||data.meter!=='4/4'||![2,3,4,6].includes(data.perBeat)||!Number.isInteger(data.steps)||data.steps<8||data.steps>96||data.steps%(data.perBeat*4)!==0||data.steps/(data.perBeat*4)>4)throw Error('Pola harus 4/4, 1–4 bar, dengan grid 1/8, 1/16, triplet, atau sextuplet.');
 const p={name:safeText(data.name)||'Pola tanpa judul',meter:'4/4',steps:data.steps,perBeat:data.perBeat,barSteps:data.perBeat*4,labels:[],velocities:{},info:safeText(data.info||'Pola buatanmu. Dengarkan dan periksa notasinya.',400),tip:'Draf dan rekaman dapat dikoreksi di editor sebelum disimpan.',source:safeText(data.source||'Editor',160)};
 for(let i=0;i<p.steps;i++)p.labels.push(countLabel(i,p.perBeat));
 for(const k of Object.keys(partNames)){
  p[k]=[];
  if(data[k]!==undefined&&!Array.isArray(data[k]))throw Error('Daftar pukulan tidak valid.');
  for(const i of new Set(data[k]||[])){if(!Number.isInteger(i)||i<0||i>=p.steps)throw Error('Posisi pukulan di luar grid.');p[k].push(i);const raw=Number(data.velocities?.[k+':'+i]);p.velocities[k+':'+i]=Number.isFinite(raw)?Math.max(.08,Math.min(1,raw)):.75;}
  p[k].sort((a,b)=>a-b);
 }
 return p;
}

function parseMidiMessage(data){if(!data||data.length<3||(data[0]&0xf0)!==0x90||data[2]===0)return null;return {note:data[1],velocity:data[2]/127,channel:(data[0]&15)+1};}

function quantizeHits(hits,tempo,q,bars,name,source){const p=cleanPattern({name,meter:'4/4',steps:q*4*bars,perBeat:q,source});const secondsPerSlot=60/tempo/q;let dropped=0;for(const h of hits){const i=Math.round(h.t/secondsPerSlot);if(!partNames[h.inst]||i<0||i>=p.steps||!Number.isFinite(h.t)){dropped++;continue;}if(!p[h.inst].includes(i))p[h.inst].push(i);p.velocities[h.inst+':'+i]=Math.max(p.velocities[h.inst+':'+i]||0,Math.max(.08,Math.min(1,h.v??.75)));}for(const k of Object.keys(partNames))p[k].sort((a,b)=>a-b);return {pattern:p,dropped};}

function variableLength(n){const out=[n&127];while((n>>=7)>0)out.unshift((n&127)|128);return out;}

function createMidi(p,tempo){const ticks=480,tempoUs=Math.round(60000000/tempo),notes={kick:36,sn:38,hh:42,tom:50,floor:41,ride:51,crash:49},all=[];for(let i=0;i<p.steps;i++)for(const [k,v]of events(p,i)){const t=Math.round(i*ticks/p.perBeat);all.push({t,data:[0x99,notes[k],Math.max(1,Math.round(v*127))],off:1});all.push({t:t+Math.max(1,Math.round(ticks/p.perBeat*.45)),data:[0x89,notes[k],0],off:0});}all.sort((a,b)=>a.t-b.t||a.off-b.off);let track=[0,0xff,0x51,3,(tempoUs>>16)&255,(tempoUs>>8)&255,tempoUs&255,0,0xff,0x58,4,4,2,24,8],last=0;for(const e of all){track.push(...variableLength(e.t-last),...e.data);last=e.t;}track.push(...variableLength(Math.max(0,Math.round(p.steps*ticks/p.perBeat)-last)),0xff,0x2f,0);const n=track.length;return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255,...track]);}

function youtubeId(value){try{const u=new URL(value.trim());if(!['https:','http:'].includes(u.protocol))return null;const host=u.hostname.toLowerCase().replace(/^www\./,'');let id;if(host==='youtu.be')id=u.pathname.split('/')[1];else if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host))id=u.pathname==='/watch'?u.searchParams.get('v'):['embed','shorts','live'].includes(u.pathname.split('/')[1])?u.pathname.split('/')[2]:null;return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:null;}catch{return null;}}

function estimateTap(times){if(times.length<3)return null;const gaps=times.slice(1).map((t,i)=>t-times[i]).filter(n=>n>=200&&n<=2500).sort((a,b)=>a-b);if(gaps.length<2)return null;const mid=Math.floor(gaps.length/2),ms=gaps.length%2?gaps[mid]:(gaps[mid-1]+gaps[mid])/2;return Math.round(60000/ms);}

function detectOnsets(samples,sampleRate,sensitivity=3,mode='sn'){
 const hop=Math.max(1,Math.round(sampleRate*.01)),aLow=1-Math.exp(-2*Math.PI*180/sampleRate),aMid=1-Math.exp(-2*Math.PI*3500/sampleRate);let low=0,mid=0;const frames=[];
 for(let at=0;at<samples.length;at+=hop){const energy=[0,0,0];for(let j=at;j<Math.min(samples.length,at+hop);j++){const v=samples[j];low+=aLow*(v-low);mid+=aMid*(v-mid);energy[0]+=low*low;energy[1]+=(mid-low)**2;energy[2]+=(v-mid)**2;}frames.push(energy.map(e=>Math.sqrt(e/hop)));}
 if(frames.length<3)return [];
 const flux=frames.map((e,i)=>e.map((v,k)=>i?Math.max(0,v-frames[i-1][k]):v));
 const means=[0,1,2].map(k=>flux.reduce((n,f)=>n+f[k],0)/flux.length),last={kick:-1,sn:-1,hh:-1},hits=[];
 for(let i=1;i<frames.length-1;i++){
  const candidates=[];for(let k=0;k<3;k++){const start=Math.max(0,i-20),window=flux.slice(start,i),local=window.reduce((n,f)=>n+f[k],0)/Math.max(1,window.length),threshold=Math.max(.0015,means[k]*sensitivity,local*sensitivity);if(flux[i][k]>threshold&&flux[i][k]>=flux[i-1][k]&&flux[i][k]>flux[i+1][k])candidates.push({k,strength:flux[i][k]/threshold,energy:frames[i][k]});}
  if(!candidates.length)continue;const t=i*hop/sampleRate;const ranked=candidates.sort((a,b)=>b.strength-a.strength),best=ranked[0];const inst=mode==='sn'?'sn':best.k===0?'kick':best.k===2?'hh':'sn';if(t-last[inst]<.07)continue;last[inst]=t;hits.push({t,inst,v:Math.max(.2,Math.min(1,best.energy*5))});
 }
 return hits;
}
return Object.freeze({safeText,countLabel,cleanPattern,parseMidiMessage,quantizeHits,variableLength,createMidi,youtubeId,estimateTap,detectOnsets,patternEvents:events});
});

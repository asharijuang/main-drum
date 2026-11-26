/* SFZ drum subset + Web Audio sampler. No application or DOM dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DrumSamples=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const NOTES={35:'kick',36:'kick',38:'sn',40:'sn',42:'hh',44:'hh',46:'hh',48:'tom',50:'tom',45:'floor',47:'tom',41:'floor',43:'floor',51:'ride',53:'ride',59:'ride',49:'crash',52:'crash',55:'crash',57:'crash'};
const PARTS=['kick','sn','hh','tom','floor','ride','crash'];
const SUPPORTED=new Set(['sample','key','lokey','hikey','lovel','hivel','volume','pan','seq_length','seq_position','group','off_by','off_mode','loop_mode','pitch_keytrack','amp_veltrack','default_path']);
function safePath(value){
 const s=String(value).replace(/\\/g,'/');
 if(!s||s.startsWith('/')||/^[a-z][a-z0-9+.-]*:/i.test(s)||s.includes('\0')||/[?#]/.test(s)||/%(?:2e|2f|5c)/i.test(s))throw Error('Gunakan path sample relatif, bukan URL atau drive absolut: '+s);
 const parts=[];for(const p of s.split('/')){if(!p||p==='.')continue;if(p==='..'){if(!parts.length)throw Error('Path sample keluar dari folder kit: '+s);parts.pop();}else parts.push(p);}return parts.join('/');
}
function midiKey(value){if(/^\d+$/.test(String(value))){const n=+value;if(n>=0&&n<=127)return n;}const m=/^([a-g])([#b]?)(-?\d+)$/i.exec(String(value));if(m){const n=(+m[3]+1)*12+{c:0,d:2,e:4,f:5,g:7,a:9,b:11}[m[1].toLowerCase()]+(m[2]==='#'?1:m[2]==='b'?-1:0);if(n>=0&&n<=127)return n;}throw Error('Key SFZ tidak valid: '+value);}
function numeric(value,fallback,min,max,label){if(value===undefined)return fallback;const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error('Nilai SFZ '+label+' di luar rentang.');return n;}
function parseSFZ(input){
 if(typeof input!=='string'||input.length>2_000_000)throw Error('File SFZ tidak valid atau terlalu besar.');
 const clean=input.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
 if(/^\s*#/m.test(clean))throw Error('SFZ ini memakai #include/#define. Versi app mendukung SFZ drum sederhana; gabungkan mapping ke satu file dahulu.');
 let global={},master={},group={},control={},current=null,kind='',raw=[],warnings=new Set();
 const chunks=clean.split(/(<[a-z_]+>)/i);
 for(const chunk of chunks){const header=/^<([a-z_]+)>$/i.exec(chunk);if(header){if(kind==='region'&&current)raw.push(current);kind=header[1].toLowerCase();if(kind==='control')current=control;else if(kind==='global'){global={};master={};group={};current=global;}else if(kind==='master'){master={};group={};current=master;}else if(kind==='group'){group={};current=group;}else if(kind==='region')current={...global,...master,...group};else throw Error('Header SFZ belum didukung: '+kind);continue;}
  if(!chunk.trim())continue;if(!current)throw Error('SFZ harus memiliki header seperti <region>.');
  const re=/([a-z_][a-z0-9_]*)\s*=\s*([\s\S]*?)(?=\s+[a-z_][a-z0-9_]*\s*=|$)/gi;let m;
  while((m=re.exec(chunk))){const key=m[1].toLowerCase();let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);current[key]=v;if(!SUPPORTED.has(key))warnings.add('Opcode diabaikan: '+key);}
 }
 if(kind==='region'&&current)raw.push(current);
 const regions=[];
 for(const r of raw){if(!r.sample)throw Error('Region SFZ tidak memiliki sample.');const lo=midiKey(r.key??r.lokey??''),hi=midiKey(r.key??r.hikey??r.lokey??'');if(lo!==hi)throw Error('App membutuhkan satu key MIDI per region drum, bukan rentang nada.');const inst=NOTES[lo];if(!inst){warnings.add('Key MIDI '+lo+' dilewati: tidak ada pad yang cocok.');continue;}
  if(r.loop_mode&&r.loop_mode!=='one_shot')throw Error('Hanya loop_mode=one_shot yang didukung.');
  if(r.pitch_keytrack!==undefined&&Number(r.pitch_keytrack)!==0)throw Error('Pitch tracking belum didukung untuk kit drum ini.');
  const lovel=numeric(r.lovel,1,0,127,'lovel'),hivel=numeric(r.hivel,127,0,127,'hivel');if(lovel>hivel)throw Error('lovel melebihi hivel.');
  const length=numeric(r.seq_length,1,1,64,'seq_length'),position=numeric(r.seq_position,1,1,length,'seq_position');if(!Number.isInteger(length)||!Number.isInteger(position))throw Error('Round-robin harus bilangan bulat.');
  regions.push({inst,key:lo,sample:safePath((control.default_path||'')+r.sample),lovel,hivel,sequenceLength:length,sequencePosition:position,volume:numeric(r.volume,0,-96,12,'volume'),pan:numeric(r.pan,0,-100,100,'pan')/100,group:numeric(r.group,0,0,65535,'group'),offBy:numeric(r.off_by,0,0,65535,'off_by'),velocityTrack:numeric(r.amp_veltrack,100,0,100,'amp_veltrack')/100});
 }
 if(!regions.length)throw Error('Tidak ada region drum yang dapat dimainkan.');if(regions.length>1024)throw Error('Kit terlalu besar (maksimum 1024 region).');
 const sequences=new Map();for(const r of regions){const key=[r.inst,r.lovel,r.hivel,r.sequenceLength].join(':');if(!sequences.has(key))sequences.set(key,{length:r.sequenceLength,positions:new Set()});sequences.get(key).positions.add(r.sequencePosition);}for(const sequence of sequences.values())for(let i=1;i<=sequence.length;i++)if(!sequence.positions.has(i))throw Error('Round-robin tidak lengkap: seq_position='+i+' tidak ditemukan.');
 return {regions,warnings:[...warnings],missing:PARTS.filter(k=>!regions.some(r=>r.inst===k))};
}
function selectRegions(regions,inst,velocity,count=0){const v=Math.max(1,Math.min(127,Math.round(velocity*127)));return regions.filter(r=>r.inst===inst&&v>=r.lovel&&v<=r.hivel&&count%r.sequenceLength===r.sequencePosition-1);}
class Engine {
 constructor(context,output){this.context=context;this.output=output;this.regions=[];this.buffers=new Map();this.counters={};this.voices=new Set();this.name='';this.version=0;}
 async load(text,readSample,name='SFZ kit'){
  const version=++this.version,parsed=parseSFZ(text),buffers=new Map();let total=0,decodedBytes=0;
  const paths=[...new Set(parsed.regions.map(r=>r.sample))];if(paths.length>128)throw Error('Kit terlalu besar (maksimum 128 sample unik).');
  // Sequential decoding bounds memory while importing larger sample folders.
  for(const path of paths){const data=await readSample(path);if(!(data instanceof ArrayBuffer))throw Error('Sample tidak valid: '+path);total+=data.byteLength;if(total>100*1024*1024)throw Error('Ukuran kit melebihi 100 MB.');let b;try{b=await this.context.decodeAudioData(data.slice(0));}catch{throw Error('Audio gagal dibaca: '+path+'. Coba WAV PCM 16/24-bit.');}if(b.duration>30)throw Error('Sample lebih dari 30 detik: '+path);decodedBytes+=b.length*b.numberOfChannels*4;if(decodedBytes>200*1024*1024)throw Error('Audio terdekode melebihi 200 MB.');buffers.set(path,b);}
  if(version!==this.version)return null;
  this.stop();this.regions=parsed.regions;this.buffers=buffers;this.counters={};this.name=name;return parsed;
 }
 play(inst,time,velocity=1){
  const count=this.counters[inst]||0,regions=selectRegions(this.regions,inst,velocity,count);if(!regions.length)return false;
  this.counters[inst]=count+1;const ctx=this.context,t=Math.max(time,ctx.currentTime);
  for(const r of regions){for(const voice of this.voices){if(voice.offBy&&voice.offBy===r.group&&voice.time<=t){try{voice.gain.gain.cancelScheduledValues(t);voice.gain.gain.setValueAtTime(voice.level,t);voice.gain.gain.linearRampToValueAtTime(0,t+.005);voice.source.stop(t+.006);}catch{}}}
   const source=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner();source.buffer=this.buffers.get(r.sample);source.connect(gain);gain.connect(pan);pan.connect(this.output);
   const level=10**(r.volume/20)*(r.velocityTrack?Math.max(.001,velocity)**(r.velocityTrack*1.4):1);gain.gain.setValueAtTime(level,t);pan.pan.setValueAtTime(r.pan,t);const voice={source,gain,level,offBy:r.offBy,time:t};this.voices.add(voice);source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect();pan.disconnect();};source.start(t);
  }return true;
 }
 stop(){for(const v of this.voices){try{v.source.stop();}catch{}}this.voices.clear();}
}
return {safePath,midiKey,parseSFZ,selectRegions,Engine,PARTS};
});

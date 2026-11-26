'use strict';
const fs=require('node:fs'),path=require('node:path');
const {readWav}=require('./benchmark.cjs');
const core=require('../public/assets/rhythm-core.js');
function createExample(){
  const rate=48000,bpm=120,bars=32,duration=64,samples=new Float32Array(rate*duration),truth=[];
  const folder=path.resolve(__dirname,'../public/sounds/rusty-starter/samples');
  const files={kick:'kick-rr2.wav',sn:'snare-rr2.wav',hh:'hihat-rr2.wav'},audio=Object.fromEntries(Object.entries(files).map(([part,file])=>[part,readWav(path.join(folder,file)).samples]));
  for(let bar=0;bar<bars;bar++){
    const sixteenths=bar>=16&&bar<24,subdivision=sixteenths?4:2;
    for(let i=0;i<4*subdivision;i++)truth.push({t:bar*2+i*.5/subdivision,inst:'hh',v:.55});
    for(const beat of [0,2])truth.push({t:bar*2+beat*.5,inst:'kick',v:.8});
    if(bar>=8&&bar<16)truth.push({t:bar*2+1.25,inst:'kick',v:.8});
    for(const beat of [1,3])truth.push({t:bar*2+beat*.5,inst:'sn',v:.8});
  }
  truth.sort((a,b)=>a.t-b.t);
  for(const hit of truth){const source=audio[hit.inst],at=Math.round(hit.t*rate),gain=hit.inst==='hh'?.24:.6;for(let i=0;i<source.length&&at+i<samples.length;i++)samples[at+i]+=source[i]*gain;}
  let peak=0;for(const v of samples)peak=Math.max(peak,Math.abs(v));const gain=peak>.9?.9/peak:1;
  const bytes=Buffer.alloc(44+samples.length*2);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(samples.length*2,40);for(let i=0;i<samples.length;i++)bytes.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]*gain))*32767),44+i*2);
  const out=path.resolve(__dirname,'../public/examples');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(out+'/drum-test-120bpm-64s.wav',bytes);
  const metadata={name:'Drum Companion comparison track',bpm,meter:'4/4',durationSeconds:duration,bars,sampleRate:rate,channels:1,format:'WAV PCM16',sampleSource:'Big Rusty Drums / Karoryfer Samples, CC0-1.0',purpose:'Controlled reference assembled from real samples, not a commercial song or proof of accuracy on other music.',sections:[{start:0,end:16,bars:'1–8',description:'Basic: hi-hat eighths; kick on 1/3; snare on 2/4'},{start:16,end:32,bars:'9–16',description:'Add kick on & after 3'},{start:32,end:48,bars:'17–24',description:'Hi-hat sixteenths; kick on 1/3; snare on 2/4'},{start:48,end:64,bars:'25–32',description:'Back to basic eighth-note rock groove'}],recommendedTest:{bpm:120,start:0,analysisBars:8,grid:4,outputBars:4},truth};
  fs.writeFileSync(out+'/drum-test-120bpm-64s.json',JSON.stringify(metadata,null,2)+'\n');
  const pattern={steps:bars*16,perBeat:4,velocities:{},kick:[],sn:[],hh:[]};for(const hit of truth){const step=Math.round(hit.t*8);pattern[hit.inst].push(step);pattern.velocities[hit.inst+':'+step]=hit.v;}
  fs.writeFileSync(out+'/drum-test-120bpm-64s.mid',core.createMidi(pattern,bpm));
  return metadata;
}
if(require.main===module){const result=createExample();console.log('Created '+result.durationSeconds+'s WAV, expected events JSON and MIDI at '+result.bpm+' BPM.');}
module.exports={createExample};

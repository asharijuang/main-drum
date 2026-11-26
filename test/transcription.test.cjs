const test=require('node:test'),assert=require('node:assert/strict');
const {captureConfig,makeDraft}=require('../public/assets/transcription-core.js');
test('capture limits reject invalid BPM/grid and captures beyond 30 seconds',()=>{
 assert.equal(captureConfig({bpm:120,bars:2}).duration,4);
 for(const options of [{bpm:0},{bpm:181},{grid:5},{bars:3},{bpm:30,bars:4},{mode:'magic'}])assert.throws(()=>captureConfig(options));
});
test('silent or malformed captured audio cannot create a fake pattern',()=>{
 assert.throws(()=>makeDraft(new Float32Array(48000),48000,{bpm:120,bars:1}),/diam/);
 assert.throws(()=>makeDraft(new Float32Array(100),48000,{bpm:120,bars:1}),/pendek/);
 const bad=new Float32Array(48000);bad[30]=NaN;assert.throws(()=>makeDraft(bad,48000,{bpm:120,bars:1}),/rusak/);
});
test('actual PCM attacks generate a quantized draft without touching any editor state',()=>{
 const rate=48000,samples=new Float32Array(rate*2);
 for(const onset of [.1,.6,1.1,1.6])for(let i=0;i<rate*.07;i++)samples[Math.floor(onset*rate)+i]=Math.sin(i/rate*220*Math.PI*2)*Math.exp(-i/rate*90)*.8;
 const result=makeDraft(samples,rate,{bpm:120,bars:1,grid:4,mode:'sn',align:true},'Draft','Test capture');
 assert.equal(result.pattern.source,'Test capture');assert.equal(result.pattern.steps,16);assert.ok(result.notes>=3);assert.equal(result.pattern.sn[0],0);assert.ok(result.offset>0);assert.equal(result.config.bpm,120);
});
test('band mode distinguishes isolated low, middle and high attacks in a clean fixture',()=>{
 const rate=48000,samples=new Float32Array(rate*2);
 for(const [onset,freq] of [[.1,65],[.6,1200],[1.1,8000],[1.6,65]])for(let i=0;i<rate*.07;i++)samples[Math.floor(onset*rate)+i]=Math.sin(i/rate*freq*Math.PI*2)*Math.exp(-i/rate*90)*.8;
 const result=makeDraft(samples,rate,{bpm:120,bars:1,mode:'bands'});
 assert.ok(result.counts.kick>0);assert.ok(result.counts.sn>0);assert.ok(result.counts.hh>0);
});

const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createLoader}=require('../public/assets/analysis-references.js');
const manifest={name:'Test analysis',samples:[{inst:'kick',file:'kit/kick.wav'},{inst:'sn',file:'kit/snare.wav'},{inst:'hh',file:'kit/hat.wav'}]};
function context(){return {closed:false,decodeAudioData:async()=>({length:100,sampleRate:22050,numberOfChannels:1,getChannelData:()=>new Float32Array(100).fill(.4)}),async close(){this.closed=true;}};}
test('analysis references load without a playback engine, cache, and release decoding context',async()=>{
 let requests=0;const decoder=context();const loader=createLoader({baseUrl:'http://localhost:8765/',createContext:()=>decoder,fetcher:async url=>{requests++;return String(url).endsWith('.json')?{ok:true,json:async()=>manifest}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}});
 const result=await loader.load();assert.deepEqual(result.references.map(r=>r.inst),['kick','sn','hh']);assert.equal(decoder.closed,true);assert.equal(await loader.load(),result);assert.equal(requests,4);
});
test('failed sample fetch has a concrete error, closes context, and can retry',async()=>{
 let fail=true;const decoders=[];const loader=createLoader({baseUrl:'http://localhost/',createContext:()=>{const c=context();decoders.push(c);return c;},fetcher:async url=>String(url).endsWith('.json')?{ok:true,json:async()=>manifest}:fail?{ok:false,status:404}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}});
 await assert.rejects(loader.load(),/kick.*HTTP 404/);assert.equal(decoders[0].closed,true);fail=false;assert.equal((await loader.load()).references.length,3);assert.equal(decoders[1].closed,true);
});
test('bundled analysis manifest points to three actual WAV recordings',()=>{
 const root=path.resolve(__dirname,'../public/sounds'),data=JSON.parse(fs.readFileSync(path.join(root,'analysis-reference.json'),'utf8'));
 assert.deepEqual(data.samples.map(s=>s.inst),['kick','sn','hh']);for(const s of data.samples)assert.equal(fs.readFileSync(path.join(root,s.file)).toString('ascii',0,4),'RIFF');
});
test('file URLs give a startup instruction rather than a playback-kit error',async()=>{
 const loader=createLoader({baseUrl:'file:///C:/app/index.html'});await assert.rejects(loader.load(),/npm start/);
});

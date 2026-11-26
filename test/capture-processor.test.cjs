const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function processor(){let Type;const sandbox={Float32Array,Math,sampleRate:48000,AudioWorkletProcessor:class{constructor(){this.messages=[];this.port={postMessage:m=>this.messages.push(m)};}},registerProcessor:(name,t)=>{assert.equal(name,'drum-tab-capture');Type=t;}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/assets/capture-processor.js'),'utf8'),sandbox);return new Type();}
test('worklet captures exact frames across variable render blocks and never echoes audio',()=>{
 const p=processor(),output=[new Float32Array(128).fill(1)];p.port.onmessage({data:{type:'start',frames:300}});
 for(const size of [64,128,256])p.process([[new Float32Array(size).fill(.8),new Float32Array(size).fill(.4)]],[output]);
 const chunks=p.messages.filter(m=>m.type==='chunk').map(m=>new Float32Array(m.samples));assert.equal(chunks.reduce((n,c)=>n+c.length,0),300);assert.ok(Math.abs(chunks[0][0]-.6)<.0001);assert.equal(p.messages.at(-1).type,'done');assert.equal(p.messages.at(-1).frames,300);assert(output[0].every(v=>v===0));
});
test('manual worklet stop flushes a partial capture exactly once',()=>{
 const p=processor();p.port.onmessage({data:{type:'start',frames:48000}});p.process([[new Float32Array(128).fill(.2)]],[[]]);p.port.onmessage({data:{type:'stop'}});p.port.onmessage({data:{type:'stop'}});
 assert.equal(p.messages.filter(m=>m.type==='done').length,1);assert.equal(p.messages.at(-1).frames,128);
});

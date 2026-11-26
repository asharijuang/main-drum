const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {readWav}=require('../scripts/benchmark.cjs');
test('comparison WAV has a full 64-second known arrangement and ground-truth MIDI',()=>{
 const root=path.resolve(__dirname,'../public/examples'),data=readWav(path.join(root,'drum-test-120bpm-64s.wav')),meta=JSON.parse(fs.readFileSync(path.join(root,'drum-test-120bpm-64s.json'),'utf8'));
 assert.equal(data.rate,48000);assert.equal(data.samples.length/data.rate,64);assert.equal(meta.bpm,120);assert.equal(meta.bars,32);assert.equal(meta.truth.length,456);
 assert.equal(meta.truth.filter(h=>h.t<16&&h.inst==='hh').length,64);assert.equal(meta.truth.filter(h=>h.t<16&&h.inst==='kick').length,16);assert.equal(meta.truth.filter(h=>h.t<16&&h.inst==='sn').length,16);
 assert.equal(fs.readFileSync(path.join(root,'drum-test-120bpm-64s.mid')).toString('ascii',0,4),'MThd');
});

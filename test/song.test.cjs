const test=require('node:test'),assert=require('node:assert/strict');
const song=require('../public/assets/song-core.js'),core=require('../public/assets/rhythm-core.js');
test('tempo candidates retain half-time ambiguity instead of claiming a certain downbeat',()=>{
 const rate=8000,a=new Float32Array(rate*20);for(let t=.12;t<20;t+=.5)for(let i=0;i<rate*.04;i++)a[Math.floor(t*rate)+i]=Math.sin(i/rate*120*Math.PI*2)*Math.exp(-i/rate*100);
 const result=song.estimateTempo(a,rate);assert.ok(result.candidates.some(c=>Math.abs(c.bpm-120)<2));assert.ok(result.candidates.some(c=>Math.abs(c.bpm-60)<2));assert.match(result.warning,/bukan kepastian/);
 assert.throws(()=>song.estimateTempo(new Float32Array(rate*2),rate),/minimal/);
});
test('groove medoid chooses a repeated bar rather than a one-off tom fill',()=>{
 const hits=[];for(let bar=0;bar<4;bar++){if(bar===3){for(let i=0;i<8;i++)hits.push({t:bar*2+i*.25,inst:'tom2',v:.8});continue;}for(let i=0;i<8;i++)hits.push({t:bar*2+i*.25,inst:'hh',v:.6});for(const beat of [0,2])hits.push({t:bar*2+beat*.5,inst:'kick',v:.8});for(const beat of [1,3])hits.push({t:bar*2+beat*.5,inst:'sn',v:.8});}
 const r=song.summarizeGroove(hits,{bpm:120,start:0,end:8,grid:4});assert(r.representativeBar<=3);assert.deepEqual(r.pattern.kick,[0,8]);assert.deepEqual(r.pattern.tom2,[]);
 const levels=song.lessonLevels(r.pattern);assert.equal(levels.length,5);assert.equal(levels[0].hh.length,4);assert.equal(levels[1].hh.length,0);assert.equal(levels[2].hh.length,8);assert.match(levels[0].info,/Aransemen/);for(const p of levels)assert.doesNotThrow(()=>core.cleanPattern(p));
});
test('triplet level simplification does not invent uneven half-triplet spacing',()=>{
 const p=core.cleanPattern({meter:'4/4',steps:12,perBeat:3,sn:[3,9],kick:[0,6]});const levels=song.lessonLevels(p);assert.deepEqual(levels[2].hh,[0,3,6,9]);
});
test('scoring enforces instrument and timing matches without counting one truth twice',()=>{
 const r=song.scoreEvents([{t:1,inst:'sn'},{t:1.01,inst:'sn'},{t:2,inst:'kick'}],[{t:1,inst:'sn'},{t:2,inst:'hh'}]);assert.equal(r.tp,1);assert.equal(r.fp,2);assert.equal(r.fn,1);
});
test('template spectral model beats old detector on held-out real drum takes in the controlled fixture',()=>{
 const result=require('../scripts/benchmark.cjs').run();assert(result.spectral.f1>result.baseline.f1);assert(result.spectral.recall>.9);assert.match(result.description,/not a benchmark on real songs/);
});

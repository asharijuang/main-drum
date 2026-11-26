const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parseSFZ,selectRegions,safePath,midiKey}=require('../public/assets/sample-kit.js');
const kitRoot=path.resolve(__dirname,'../public/sounds/rusty-starter');
test('bundled SFZ maps all eight drum parts to existing PCM WAV recordings',()=>{
 const kit=parseSFZ(fs.readFileSync(path.join(kitRoot,'kit.sfz'),'utf8'));
 assert.deepEqual(kit.missing,[]);assert.deepEqual(kit.warnings,[]);assert.equal(kit.regions.length,13);
 for(const r of kit.regions){const b=fs.readFileSync(path.join(kitRoot,r.sample));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');assert.equal(b.readUInt16LE(20),1);assert.equal(b.readUInt16LE(34),16);assert.equal(b.readUInt32LE(24),48000);}
});
test('SFZ velocity layers and round-robin pick different acoustic takes',()=>{
 const kit=parseSFZ(fs.readFileSync(path.join(kitRoot,'kit.sfz'),'utf8'));
 const soft=selectRegions(kit.regions,'sn',.18,0),hard=selectRegions(kit.regions,'sn',.8,0),next=selectRegions(kit.regions,'sn',.8,1);
 assert.match(soft[0].sample,/snare-soft-rr1/);assert.match(hard[0].sample,/snare-rr1/);assert.match(next[0].sample,/snare-rr2/);
 assert.equal(soft.length,1);assert.equal(hard.length,1);
});
test('global, group and region inheritance work with quoted filenames and Windows separators',()=>{
 const kit=parseSFZ('<control> default_path=Samples\\\n<global> loop_mode=one_shot volume=-3\n<group> key=36 volume=-6\n<region> sample="Kick Big.wav"\n<region> sample=kick2.wav volume=-9');
 assert.equal(kit.regions[0].sample,'Samples/Kick Big.wav');assert.equal(kit.regions[0].volume,-6);assert.equal(kit.regions[1].volume,-9);assert.equal(midiKey('C2'),36);
});
test('unsupported complex mappings and unsafe paths fail with actionable errors',()=>{
 for(const p of ['../secret.wav','https://example.com/x.wav','C:\\x.wav','/abs.wav','samples/%2e%2e/x.wav'])assert.throws(()=>safePath(p));
 assert.throws(()=>parseSFZ('#include "other.sfz"'),/#include/);
 assert.throws(()=>parseSFZ('<region> key=36 sample=x.wav loop_mode=loop_continuous'),/one_shot/);
 assert.throws(()=>parseSFZ('<region> key=36 sample=x.wav lovel=90 hivel=30'),/lovel/);
 assert.throws(()=>parseSFZ('<region> key=36 sample=x.wav seq_length=2 seq_position=1'),/Round-robin/);
});
test('unknown pad notes are skipped and noncritical unsupported opcodes are visible warnings',()=>{
 const kit=parseSFZ('<region> key=36 sample=kick.wav cutoff=4000\n<region> key=1 sample=other.wav');
 assert.equal(kit.regions.length,1);assert.equal(kit.warnings.length,2);assert(kit.missing.includes('sn'));
});

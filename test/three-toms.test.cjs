const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../public/assets/rhythm-core.js'),samples=require('../public/assets/sample-kit.js');
const fs=require('node:fs'),path=require('node:path');
test('Roland and Yamaha default head notes remain three separate toms',()=>{
 for(const input of [[48,45,43],[48,47,43]])assert.deepEqual(input.map(note=>core.MIDI_DRUM_MAP[note]),['tom','tom2','floor']);
 assert.equal(core.MIDI_DRUM_MAP[50],'tom');assert.equal(core.MIDI_DRUM_MAP[41],'floor');
});
test('recording, validation and MIDI export retain all three tom tracks',()=>{
 const {pattern}=core.quantizeHits([{t:0,inst:'tom',v:.8},{t:.25,inst:'tom2',v:.7},{t:.5,inst:'floor',v:.6}],60,4,1,'Three toms','MIDI');
 assert.deepEqual(pattern.tom,[0]);assert.deepEqual(pattern.tom2,[1]);assert.deepEqual(pattern.floor,[2]);
 const checked=core.cleanPattern(JSON.parse(JSON.stringify(pattern))),midi=Buffer.from(core.createMidi(checked,60));
 for(const key of [48,45,43])assert.notEqual(midi.indexOf(Buffer.from([0x99,key])),-1);
 assert.equal(checked.velocities['tom2:1'],.7);
});
test('legacy saved high/floor tom patterns keep their notes and dynamics',()=>{
 const p=core.cleanPattern({meter:'4/4',perBeat:4,steps:16,tom:[3],floor:[9],velocities:{'floor:9':.2}});
 assert.deepEqual(p.tom,[3]);assert.deepEqual(p.floor,[9]);assert.deepEqual(p.tom2,[]);assert.equal(p.velocities['floor:9'],.2);
});
test('the acoustic SFZ has three distinct tom recordings and descending staff positions',()=>{
 const kit=samples.parseSFZ(fs.readFileSync(path.join(__dirname,'../public/sounds/rusty-starter/kit.sfz'),'utf8'));
 const regions=['tom','tom2','floor'].map(inst=>samples.selectRegions(kit.regions,inst,.8)[0]);
 assert(regions.every(Boolean));assert.equal(new Set(regions.map(r=>r.sample)).size,3);
 assert(core.STAFF_POSITIONS.tom<core.STAFF_POSITIONS.tom2&&core.STAFF_POSITIONS.tom2<core.STAFF_POSITIONS.floor);
 assert.equal(core.STAFF_POSITIONS.sn,84,'Snare stays in third space from bottom in the current staff layout');
});

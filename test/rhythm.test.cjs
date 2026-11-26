const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../public/assets/rhythm-core.js');

test('quantization retains dynamics, merges duplicate strokes and drops out-of-bar hits', () => {
  const { pattern, dropped } = core.quantizeHits([
    { t: 0, inst: 'kick', v: .8 }, { t: .25, inst: 'sn', v: .2 },
    { t: .251, inst: 'sn', v: .9 }, { t: 4.1, inst: 'sn', v: .7 }
  ], 60, 4, 1, 'My groove', 'MIDI');
  assert.deepEqual(pattern.kick, [0]);
  assert.deepEqual(pattern.sn, [1]);
  assert.equal(pattern.velocities['sn:1'], .9);
  assert.equal(dropped, 1);
});

test('MIDI parser ignores note-off and zero-velocity note-on', () => {
  assert.equal(core.parseMidiMessage([0x89, 38, 100]), null);
  assert.equal(core.parseMidiMessage([0x99, 38, 0]), null);
  assert.equal(core.parseMidiMessage([0x99, 38]), null);
  assert.deepEqual(core.parseMidiMessage([0x99, 38, 127]), { note: 38, velocity: 1, channel: 10 });
});

test('pattern validation rejects malformed files and rebuilds trusted fields', () => {
  assert.throws(() => core.cleanPattern({ meter: '4/4', perBeat: 4, steps: 999 }));
  assert.throws(() => core.cleanPattern({ meter: '4/4', perBeat: 4, steps: 16, sn: [16] }));
  const p = core.cleanPattern({ name: 'Safe', meter: '4/4', perBeat: 4, steps: 16, sn: [1, 1], velocities: { 'sn:1': 3 }, unwanted: true });
  assert.deepEqual(p.sn, [1]); assert.equal(p.velocities['sn:1'], 1);
  assert.equal(p.unwanted, undefined);
});

test('sextuplet kick is in slot four of each beat', () => {
  const { pattern } = core.quantizeHits([{ t: .5, inst: 'kick', v: .8 }], 60, 6, 1, 'Sextuplet', 'test');
  assert.deepEqual(pattern.kick, [3]); assert.equal(pattern.steps, 24);
});

test('MIDI export contains real notes, tempo and a complete SMF track', () => {
  const p = core.cleanPattern({ meter: '4/4', perBeat: 4, steps: 16, sn: [0] });
  const b = Buffer.from(core.createMidi(p, 120));
  assert.equal(b.toString('ascii', 0, 4), 'MThd'); assert.equal(b.readUInt16BE(12), 480);
  assert.equal(b.toString('ascii', 14, 18), 'MTrk'); assert.equal(b.readUInt32BE(18), b.length - 22);
  assert.notEqual(b.indexOf(Buffer.from([0xff, 0x51, 3, 7, 161, 32])), -1);
  assert.notEqual(b.indexOf(Buffer.from([0x99, 38])), -1);
  assert.deepEqual(Array.from(b.subarray(-3)), [255, 47, 0]);
});

test('YouTube parsing accepts supported hosts and rejects lookalikes and script URLs', () => {
  assert.equal(core.youtubeId('https://youtu.be/M7lc1UVf-VE?t=10'), 'M7lc1UVf-VE');
  assert.equal(core.youtubeId('https://www.youtube.com/watch?v=M7lc1UVf-VE'), 'M7lc1UVf-VE');
  assert.equal(core.youtubeId('https://youtube.com.evil.test/watch?v=M7lc1UVf-VE'), null);
  assert.equal(core.youtubeId('javascript:alert(1)'), null);
});

test('tap tempo is stable against one outlier and silence produces no onsets', () => {
  assert.equal(core.estimateTap([0, 500, 1000, 1500, 2200, 2700]), 120);
  assert.equal(core.estimateTap([0, 500]), null);
  assert.deepEqual(core.detectOnsets(new Float32Array(44100), 44100), []);
});

test('drum attacks in clean synthetic audio produce draft onsets', () => {
  const rate = 22050, data = new Float32Array(rate * 2);
  for (const onset of [.1, .6, 1.1, 1.6]) {
    for (let n = 0; n < rate * .08; n++) data[Math.floor(onset * rate) + n] += Math.sin(n / rate * 220 * 2 * Math.PI) * Math.exp(-n / rate * 80) * .8;
  }
  assert.ok(core.detectOnsets(data, rate).length >= 3);
});

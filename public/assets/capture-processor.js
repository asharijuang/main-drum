/* AudioWorklet: mono PCM capture only; all output channels remain silent. */
'use strict';
class DrumCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.armed = false;
    this.buffer = new Float32Array(4096);
    this.offset = 0;
    this.frames = 0;
    this.limit = 0;
    this.port.onmessage = ({ data }) => {
      if (data.type === 'start') {
        this.offset = 0;
        this.frames = 0;
        this.limit = Math.max(1, Math.min(sampleRate * 30, Math.round(data.frames)));
        this.armed = true;
      } else if (data.type === 'stop' && this.armed) this.finish();
    };
  }
  flush() {
    if (!this.offset) return;
    const chunk = this.buffer.slice(0, this.offset);
    this.port.postMessage({ type: 'chunk', samples: chunk.buffer }, [chunk.buffer]);
    this.offset = 0;
  }
  finish() {
    this.armed = false;
    this.flush();
    this.port.postMessage({ type: 'done', frames: this.frames });
  }
  process(inputs, outputs) {
    for (const channel of outputs[0] || []) channel.fill(0);
    const channels = inputs[0];
    if (!this.armed || !channels?.length) return true;
    for (let i = 0; i < channels[0].length; i++) {
      let value = 0;
      for (const channel of channels) value += channel[i] || 0;
      this.buffer[this.offset++] = value / channels.length;
      this.frames++;
      if (this.offset === this.buffer.length) this.flush();
      if (this.frames >= this.limit) { this.finish(); break; }
    }
    return true;
  }
}
registerProcessor('drum-tab-capture', DrumCaptureProcessor);

/* Reproducible benchmark: mixtures of real CC0 takes held out from templates. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const core=require('../public/assets/rhythm-core.js'),song=require('../public/assets/song-core.js'),spectral=require('../public/assets/spectral-model.js');
function readWav(filename){const b=fs.readFileSync(filename);let channels=1,rate=48000,bits=16,format=1,data=null;for(let at=12;at+8<=b.length;){const tag=b.toString('ascii',at,at+4),size=b.readUInt32LE(at+4);if(tag==='fmt '){format=b.readUInt16LE(at+8);channels=b.readUInt16LE(at+10);rate=b.readUInt32LE(at+12);bits=b.readUInt16LE(at+22);}if(tag==='data'){data=b.subarray(at+8,at+8+size);break;}at+=8+size+(size%2);}if(format!==1||bits!==16||!data)throw Error('Expected PCM16 WAV');const samples=new Float32Array(data.length/2/channels);for(let i=0;i<samples.length;i++)for(let c=0;c<channels;c++)samples[i]+=data.readInt16LE((i*channels+c)*2)/32768/channels;return {samples,rate};}
function fixture(){
 const folder=path.resolve(__dirname,'../public/sounds/rusty-starter/samples'),rate=48000,duration=12,samples=new Float32Array(rate*duration),truth=[];
 const files={kick:'kick-rr2.wav',sn:'snare-rr2.wav',hh:'hihat-rr2.wav'},refs=[];
 for(const [inst,file]of Object.entries(files))refs.push({inst,...readWav(path.join(folder,file.replace('rr2','rr1')))});
 for(let step=0;step<48;step++){const t=step*.25;truth.push({t,inst:'hh',v:.6});if(step%8===0||step%8===4||step===29)truth.push({t,inst:'kick',v:.8});if(step%8===2||step%8===6)truth.push({t,inst:'sn',v:.8});}
 for(const hit of truth){const audio=readWav(path.join(folder,files[hit.inst])).samples,gain=hit.inst==='hh'?.3:.75;for(let i=0;i<audio.length&&i+Math.round(hit.t*rate)<samples.length;i++)samples[i+Math.round(hit.t*rate)]+=audio[i]*gain;}
 for(let i=0;i<samples.length;i++){const t=i/rate;samples[i]+=.02*Math.sin(2*Math.PI*55*t)+.008*Math.sin(2*Math.PI*330*t)*Math.exp(-(t%.5)*8);}
 return {samples,rate,truth,refs};
}
function run(){const f=fixture(),model=spectral.train(f.refs),timing=Date.now(),pred=spectral.transcribe(f.samples,f.rate,model),elapsed=Date.now()-timing;
 const old=core.detectOnsets(f.samples,f.rate,3,'bands'),bands=song.bandHits(f.samples,f.rate,3);
 const fullRefs=[...f.refs];for(const [inst,file]of [['sn','snare-soft-rr1.wav'],['tom','tom-rr1.wav'],['tom2','tom2-rr1.wav'],['floor','floor-rr1.wav'],['ride','ride-rr1.wav'],['crash','crash-rr1.wav']])fullRefs.push({inst,...readWav(path.resolve(__dirname,'../public/sounds/rusty-starter/samples',file))});
 const fullPrediction=spectral.transcribe(f.samples,f.rate,spectral.train(fullRefs));
 const result={description:'12-second synthetic music mixture of real acoustic kick/snare/hi-hat recordings; rr2 takes held out from rr1 templates. Bass tone and harmonic distractor added. This is not a benchmark on real songs.',toleranceSeconds:.05,truthEvents:f.truth.length,baseline:song.scoreEvents(old,f.truth),multiBand:song.scoreEvents(bands,f.truth),spectral:song.scoreEvents(pred,f.truth),fullKitDiagnostic:song.scoreEvents(fullPrediction,f.truth),fullKitNote:'Eight-class template expansion adds many false positives on this fixture; it is not the default UI model.',spectralMilliseconds:elapsed,tempo:song.estimateTempo(song.downsample(f.samples,f.rate),8000)};
 delete result.tempo.envelope;return result;
}
if(require.main===module){const result=run();console.log(JSON.stringify(result,null,2));const flag=process.argv.indexOf('--output');if(flag>=0&&process.argv[flag+1])fs.writeFileSync(process.argv[flag+1],JSON.stringify(result,null,2)+'\n');}
module.exports={run,fixture,readWav};

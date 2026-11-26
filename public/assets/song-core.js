/* Pure song-learning functions shared by the browser worker and Node tests. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./rhythm-core.js'));else root.DrumSong=factory(root.DrumCore);})(globalThis,function(core){
  'use strict';
  const PARTS=Object.keys(core.DRUM_PARTS);
  function downsample(input,rate,target=8000){
    if(!(input instanceof Float32Array)||!Number.isFinite(rate)||rate<target)throw Error('Sample rate tidak valid.');
    const ratio=rate/target,out=new Float32Array(Math.floor(input.length/ratio));
    for(let i=0;i<out.length;i++){const a=Math.floor(i*ratio),b=Math.max(a+1,Math.floor((i+1)*ratio));let sum=0;for(let j=a;j<b;j++)sum+=input[j];out[i]=sum/(b-a);}
    return out;
  }
  function onsetEnvelope(input,rate){
    const hop=Math.max(1,Math.round(rate*.01)),n=Math.floor(input.length/hop),values=new Float32Array(n),lowValues=new Float32Array(n);
    let low=0,mid=0,previous=[0,0,0];const al=1-Math.exp(-2*Math.PI*180/rate),am=1-Math.exp(-2*Math.PI*Math.min(3000,rate*.4)/rate);
    for(let i=0;i<n;i++){let a=0,b=0,c=0;for(let j=i*hop;j<(i+1)*hop;j++){const v=input[j];low+=al*(v-low);mid+=am*(v-mid);a+=low*low;b+=(mid-low)**2;c+=(v-mid)**2;}const energy=[Math.sqrt(a/hop),Math.sqrt(b/hop),Math.sqrt(c/hop)];values[i]=Math.max(0,energy[0]-previous[0])+Math.max(0,energy[1]-previous[1])+Math.max(0,energy[2]-previous[2]);lowValues[i]=Math.max(0,energy[0]-previous[0]);previous=energy;}
    return {values,low:lowValues,frameRate:rate/hop};
  }
  function estimateTempo(input,rate){
    if(input.length/rate<6)throw Error('Untuk tempo otomatis, gunakan minimal 6 detik audio. Kamu tetap bisa mengisi BPM manual.');
    const {values,frameRate}=onsetEnvelope(input,rate);let energy=0;for(const x of values)energy+=x*x;if(energy<1e-8)throw Error('Audio terlalu pelan untuk memperkirakan tempo.');
    const minLag=Math.floor(frameRate*60/220),maxLag=Math.ceil(frameRate*60/40),corr=new Float64Array(maxLag*4+2);
    for(let lag=minLag;lag<corr.length&&lag<values.length/2;lag++){let sum=0,a=0,b=0;for(let i=lag;i<values.length;i++){sum+=values[i]*values[i-lag];a+=values[i]**2;b+=values[i-lag]**2;}corr[lag]=sum/Math.sqrt(Math.max(1e-20,a*b));}
    const candidates=[];
    for(let lag=minLag+1;lag<maxLag;lag++)if(corr[lag]>=corr[lag-1]&&corr[lag]>corr[lag+1]){
      const delta=.5*(corr[lag-1]-corr[lag+1])/(corr[lag-1]-2*corr[lag]+corr[lag+1]||1),period=lag+Math.max(-.5,Math.min(.5,delta)),bpm=60*frameRate/period;
      const prior=Math.exp(-.5*(Math.log2(bpm/110)/.8)**2),score=(corr[lag]+.25*(corr[lag*2]||0)+.10*(corr[lag*4]||0))*(.65+.35*prior);
      candidates.push({bpm:Math.round(bpm*10)/10,score,correlation:corr[lag],period});
    }
    candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)throw Error('Belum menemukan tempo yang stabil. Coba bagian drum yang lebih jelas.');
    const best=candidates[0],chosen=[];
    for(const c of candidates)if(!chosen.some(p=>Math.abs(c.bpm-p.bpm)<3)){chosen.push(c);if(chosen.length===4)break;}
    for(const factor of [.5,2]){const bpm=Math.round(best.bpm*factor*10)/10;if(bpm>=40&&bpm<=220&&!chosen.some(c=>Math.abs(c.bpm-bpm)<3))chosen.push({bpm,score:0,correlation:0});}
    let phase=0,phaseScore=-1;for(let p=0;p<best.period;p++){let sum=0;for(let i=p;i<values.length;i+=best.period){const at=Math.round(i);sum+=(values[at]||0)+.5*(values[at-1]||0)+.5*(values[at+1]||0);}if(sum>phaseScore){phaseScore=sum;phase=p;}}
    const windows=[];for(let at=0;at<values.length;at+=Math.round(frameRate*10)){const end=Math.min(values.length,at+Math.round(frameRate*10));if(end-at<frameRate*5)break;let score=0,denom=0;const lag=Math.round(best.period);for(let i=at+lag;i<end;i++){score+=values[i]*values[i-lag];denom+=values[i]**2;}windows.push(score/(denom||1));}
    return {bpm:best.bpm,candidates:chosen.slice(0,6).map(({bpm,correlation})=>({bpm,strength:Math.round(correlation*100)/100})),firstBeat:phase/frameRate,period:60/best.bpm,strength:Math.round(best.correlation*100)/100,variable:windows.length>1&&Math.min(...windows)<.2,envelope:Array.from(values),frameRate,warning:'Saran beat, bukan kepastian hitungan 1. Periksa tempo setengah/dobel dan awal bar.'};
  }
  function bandHits(input,rate,sensitivity=3){
    const hop=Math.max(1,Math.round(rate*.01)),frames=[],al=1-Math.exp(-2*Math.PI*180/rate),am=1-Math.exp(-2*Math.PI*3500/rate);let low=0,mid=0;
    for(let at=0;at<input.length;at+=hop){const e=[0,0,0];for(let j=at;j<Math.min(input.length,at+hop);j++){const v=input[j];low+=al*(v-low);mid+=am*(v-mid);e[0]+=low*low;e[1]+=(mid-low)**2;e[2]+=(v-mid)**2;}frames.push(e.map(v=>Math.sqrt(v/hop)));}
    const flux=frames.map((e,i)=>e.map((v,k)=>i?Math.max(0,v-frames[i-1][k]):v)),means=[0,1,2].map(k=>flux.reduce((s,f)=>s+f[k],0)/Math.max(1,flux.length)),last=[-1,-1,-1],hits=[];
    for(let i=1;i<frames.length-1;i++)for(let k=0;k<3;k++){
      let local=0;for(let j=Math.max(0,i-20);j<i;j++)local+=flux[j][k];local/=Math.min(i,20);
      const threshold=Math.max(.001,means[k]*sensitivity,local*sensitivity),fraction=frames[i][k]/Math.max(1e-8,frames[i][0]+frames[i][1]+frames[i][2]),t=i*hop/rate;
      if(flux[i][k]>threshold&&flux[i][k]>=flux[i-1][k]&&flux[i][k]>flux[i+1][k]&&fraction>(k===0?.12:k===1?.18:.10)&&t-last[k]>=.035){last[k]=t;hits.push({t,inst:['kick','sn','hh'][k],v:Math.min(1,Math.max(.15,frames[i][k]*5)),confidence:Math.min(.95,flux[i][k]/threshold/4)});}
    }
    return hits.sort((a,b)=>a.t-b.t);
  }
  function summarizeGroove(hits,{bpm=120,grid=4,start=0,end=8,source='Song study'}={}){
    if(!Number.isFinite(bpm)||bpm<30||bpm>180||![2,3,4,6].includes(grid)||!(end>start))throw Error('BPM, grid, atau bagian tidak valid.');
    const barSeconds=240/bpm,barSteps=4*grid,barCount=Math.max(1,Math.ceil((end-start)/barSeconds-.02)),bars=[];
    for(let b=0;b<barCount;b++)bars.push(core.cleanPattern({name:'Bar '+(b+1),meter:'4/4',steps:barSteps,perBeat:grid,source}));
    let dropped=0;
    for(const h of hits){const local=h.t-start;if(local<-.025||h.t>=end||!PARTS.includes(h.inst))continue;const step=Math.round(local/(60/bpm/grid)),bar=Math.floor(step/barSteps),at=step%barSteps;if(bar<0||bar>=bars.length){dropped++;continue;}const p=bars[bar];if(!p[h.inst].includes(at))p[h.inst].push(at);p.velocities[h.inst+':'+at]=Math.max(p.velocities[h.inst+':'+at]||0,h.v||.7);}
    const signatures=bars.map(p=>new Set(PARTS.flatMap(k=>p[k].map(i=>k+':'+i)))),eligible=signatures.map((s,i)=>({s,i})).filter(({s})=>s.size>=3);
    if(!eligible.length)throw Error('Belum ada groove yang cukup jelas. Periksa bagian, tempo, atau mode analisis.');
    function similarity(a,b){let inter=0;for(const key of a)if(b.has(key))inter++;return inter/Math.max(1,a.size+b.size-inter);}
    let representative=eligible[0].i,best=-1;
    for(const item of eligible){let score=0;for(const other of eligible)score+=similarity(item.s,other.s);score/=eligible.length;if(score>best){best=score;representative=item.i;}}
    const pattern=core.cleanPattern(bars[representative]);pattern.name='Groove bagian · bar '+(representative+1);
    return {pattern,representativeBar:representative+1,analyzedBars:bars.length,repeatSimilarity:Math.round(best*100)/100,dropped,bars};
  }
  function lessonLevels(source){
    const p=core.cleanPattern(source),q=p.perBeat,steps=p.barSteps,part=(p.ride.length>p.hh.length)?'ride':'hh';
    const blank=(name,description)=>core.cleanPattern({name,meter:'4/4',steps,perBeat:q,source:p.source,info:description});
    function put(out,k,positions){out[k]=[...new Set(positions)].sort((a,b)=>a-b);for(const i of out[k])out.velocities[k+':'+i]=p.velocities[k+':'+i]??.7;}
    const descriptions=['Ikuti empat beat utama. Aransemen latihan, bukan transkripsi asli.','Fondasi kick dan snare dari groove, diringkas.','Tambah pola cymbal sederhana untuk koordinasi.','Variasi kick/snare dari draf, cymbal diringkas.','Draf groove lengkap hasil analisis. Tetap perlu koreksi.'];
    const names=['1 · Rasakan beat','2 · Fondasi kick + snare','3 · Groove dasar','4 · Variasi groove','5 · Draf groove lengkap'];
    const levels=names.map((n,i)=>blank(n,descriptions[i]));
    put(levels[0],part,[0,q,2*q,3*q]);
    for(let l=1;l<4;l++)for(const k of ['kick','sn']){
      const positions=p[k].filter(i=>i<steps),onBeat=positions.filter(i=>i%q===0);
      put(levels[l],k,l<3?(onBeat.length?onBeat.slice(0,2):positions.slice(0,2)):positions);
    }
    const cymbal=p[part].filter(i=>i<steps),eighth=q%2===0?Array.from({length:8},(_,i)=>i*q/2):Array.from({length:4},(_,i)=>i*q);
    put(levels[2],part,cymbal.length?cymbal.filter(i=>eighth.includes(i)):eighth);
    put(levels[3],part,cymbal.length?cymbal.filter(i=>eighth.includes(i)):eighth);
    for(const k of PARTS)put(levels[4],k,p[k].filter(i=>i<steps));
    return levels;
  }
  function scoreEvents(predicted,truth,tolerance=.05){
    const used=new Set();let tp=0;for(const p of predicted){let best=-1,delta=tolerance+1;for(let i=0;i<truth.length;i++)if(!used.has(i)&&truth[i].inst===p.inst){const d=Math.abs(truth[i].t-p.t);if(d<=tolerance&&d<delta){delta=d;best=i;}}if(best>=0){tp++;used.add(best);}}
    const precision=tp/Math.max(1,predicted.length),recall=tp/Math.max(1,truth.length);return {tp,fp:predicted.length-tp,fn:truth.length-tp,precision,recall,f1:2*precision*recall/Math.max(1e-12,precision+recall)};
  }
  return {downsample,onsetEnvelope,estimateTempo,bandHits,summarizeGroove,lessonLevels,scoreEvents};
});

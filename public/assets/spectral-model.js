/* Fixed-template nonnegative spectral fitting. Experimental, not a neural model. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DrumSpectral=factory();})(globalThis,function(){
  'use strict';
  const N=1024,HOP=220,RATE=22050,BINS=N/2;
  const hann=Float32Array.from({length:N},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/(N-1)));
  function spectrum(input,at=0){
    const re=new Float64Array(N),im=new Float64Array(N);for(let i=0;i<N;i++)re[i]=(input[at+i]||0)*hann[i];
    for(let i=1,j=0;i<N;i++){let bit=N>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){const temp=re[i];re[i]=re[j];re[j]=temp;}}
    for(let length=2;length<=N;length<<=1){const half=length>>1,angle=-2*Math.PI/length,wr0=Math.cos(angle),wi0=Math.sin(angle);for(let base=0;base<N;base+=length){let wr=1,wi=0;for(let j=0;j<half;j++){const a=base+j,b=a+half,tr=wr*re[b]-wi*im[b],ti=wr*im[b]+wi*re[b];re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;const next=wr*wr0-wi*wi0;wi=wr*wi0+wi*wr0;wr=next;}}}
    const out=new Float32Array(BINS);for(let i=1;i<BINS;i++)out[i]=Math.hypot(re[i],im[i])/N;return out;
  }
  function resample(input,rate){if(rate===RATE)return input;const ratio=rate/RATE,out=new Float32Array(Math.floor(input.length/ratio));for(let i=0;i<out.length;i++){const at=i*ratio,j=Math.floor(at),f=at-j;out[i]=(input[j]||0)*(1-f)+(input[j+1]||0)*f;}return out;}
  function train(references){
    if(!Array.isArray(references)||!references.length)throw Error('Referensi sound kit belum siap.');
    const templates=[];
    for(const ref of references){const data=resample(ref.samples,ref.rate);let peak=0;for(const v of data)peak=Math.max(peak,Math.abs(v));if(peak<.0001)continue;let onset=0;while(onset<data.length&&Math.abs(data[onset])<peak*.05)onset++;
      const v=new Float32Array(BINS);for(let f=0;f<5;f++){const s=spectrum(data,Math.max(0,onset-N/4)+f*HOP);for(let k=1;k<BINS;k++)v[k]+=s[k]/5;}templates.push({inst:ref.inst,spectrum:v});
    }
    if(!templates.length)throw Error('Sample referensi tidak berisi audio yang jelas.');
    const weights=new Float32Array(BINS);for(let k=1;k<BINS;k++){let sum=0;for(const t of templates)sum+=t.spectrum[k];weights[k]=1/Math.sqrt(Math.max(.00001,sum/templates.length));}
    for(const t of templates){let norm=0;for(let k=1;k<BINS;k++){t.spectrum[k]*=weights[k];norm+=t.spectrum[k]**2;}norm=Math.sqrt(norm)||1;for(let k=1;k<BINS;k++)t.spectrum[k]/=norm;}
    const gram=templates.map(a=>templates.map(b=>{let sum=0;for(let k=1;k<BINS;k++)sum+=a.spectrum[k]*b.spectrum[k];return sum;}));
    return {templates,weights,gram,rate:RATE};
  }
  function transcribe(samples,rate,model,{sensitivity=3}={}){
    const input=resample(samples,rate),parts=[...new Set(model.templates.map(t=>t.inst))],frames=Math.max(0,Math.floor((input.length-N)/HOP)+1),activations=Object.fromEntries(parts.map(p=>[p,new Float32Array(frames)])),rms=new Float32Array(frames),m=model.templates.length;
    for(let i=0;i<frames;i++){
      const s=spectrum(input,i*HOP);let norm=0,energy=0;for(let k=1;k<BINS;k++){energy+=s[k]**2;s[k]*=model.weights[k];norm+=s[k]**2;}rms[i]=Math.sqrt(energy);norm=Math.sqrt(norm)||1;for(let k=1;k<BINS;k++)s[k]/=norm;
      const dots=new Float64Array(m),a=new Float64Array(m);for(let j=0;j<m;j++)for(let k=1;k<BINS;k++)dots[j]+=model.templates[j].spectrum[k]*s[k];
      for(let iteration=0;iteration<10;iteration++)for(let j=0;j<m;j++){let fit=0;for(let k=0;k<m;k++)fit+=model.gram[j][k]*a[k];a[j]=Math.max(0,a[j]+(dots[j]-fit-.015)/(model.gram[j][j]+.02));}
      for(let j=0;j<m;j++)activations[model.templates[j].inst][i]=Math.max(activations[model.templates[j].inst][i],a[j]);
    }
    const hits=[];
    for(const inst of parts){const activation=activations[inst],novelty=new Float32Array(frames);let max=0,mean=0;
      for(let i=0;i<frames;i++){novelty[i]=Math.max(0,activation[i]-(activation[Math.max(0,i-3)]||0))*Math.sqrt(rms[i]);max=Math.max(max,novelty[i]);mean+=novelty[i];}mean/=Math.max(1,frames);
      const threshold=Math.max(.0005,max*(sensitivity===2?.12:sensitivity===4.5?.28:.19),mean*3),gap=inst==='hh'||inst==='ride'? .045:.035;let last=-1;
      for(let i=1;i<frames-1;i++){if(novelty[i]>=threshold&&novelty[i]>=novelty[i-1]&&novelty[i]>novelty[i+1]&&activation[i]>.12){const t=(i*HOP+N/2)/RATE;if(t-last<gap)continue;last=t;hits.push({t,inst,v:Math.max(.15,Math.min(1,Math.sqrt(rms[i])*3)),confidence:Math.min(.95,activation[i])});}}
    }
    return hits.sort((a,b)=>a.t-b.t);
  }
  return {spectrum,train,transcribe,resample,RATE};
});

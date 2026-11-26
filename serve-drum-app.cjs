// Local-only static host. No uploads, external requests, or data collection.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const port=Number(process.argv[2])||8765;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 if(!['/','/buku-drum-interaktif.html'].includes(url.pathname)){res.writeHead(404);res.end('Tidak ditemukan');return;}
 fs.readFile(path.join(__dirname,'buku-drum-interaktif.html'),(err,body)=>{
  if(err){res.writeHead(500);res.end('File app tidak ditemukan. Letakkan server dan HTML di folder yang sama.');return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'midi=(self)'});
  res.end(req.method==='HEAD'?undefined:body);
 });
});
server.on('error',e=>{if(e.code==='EADDRINUSE')console.error('Port '+port+' sedang dipakai. Tutup app sebelumnya, atau buka http://127.0.0.1:'+port);else console.error(e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('Drum Companion: http://127.0.0.1:'+port+' (Ctrl+C untuk berhenti)'));

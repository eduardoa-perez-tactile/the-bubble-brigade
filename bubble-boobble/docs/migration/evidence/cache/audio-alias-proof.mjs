import{spawn}from'node:child_process';import{resolve}from'node:path';import{createRequire}from'node:module';import{setTimeout as delay}from'node:timers/promises';import{writeFileSync}from'node:fs';
const{GameEngineClient}=createRequire(import.meta.url)(resolve('.cache/desktop/protocol-client.cjs'));
const host=spawn(resolve('.gameengine/engine/target/release/gameengine-host'),['--mode','headless','--project',resolve('.cache/audio-alias-probe'),'--bundle',resolve('.cache/audio-alias-probe/.gameengine/bundle.js'),'--serve','127.0.0.1:0','--paused','--no-gpu','--audio',...(process.argv.includes('--cooked')?['--cooked',resolve('.cache/audio-alias-probe/.gameengine/cooked/desktop')]:[])],{stdio:['ignore','pipe','pipe']});
let address,log='',client;host.stdout.on('data',d=>{log+=d;for(const l of log.split('\n'))try{const j=JSON.parse(l);if(j.ws&&j.token)address=j;}catch{}});host.stderr.on('data',d=>log+=d);
const report=[];
try{
 for(let i=0;i<200&&!address;i++)await delay(25);if(!address)throw new Error(log);
 client=await GameEngineClient.connect(address,{client:'isolated-audio-alias-proof'});
 for(const track of ['reference/audio/bubble-2','dd8115d4-c0a8-4b59-94bf-ff0961704151','reference/audio/music-unique']){
  const start=log.length;
  await client.api.input.push({events:[{type:'event',name:'StopMusic',data:JSON.stringify({fade:0})}]});await client.api.engine.step({n:2,frames:true});
  await client.api.input.push({events:[{type:'event',name:'PlayMusic',data:JSON.stringify({track,volume:1,crossfade:0})}]});
  await client.api.engine.step({n:120,frames:true});await delay(100);
  report.push({track,status:await client.api.audio.status({}),log:log.slice(start)});
 }
 console.log(JSON.stringify(report,null,2));writeFileSync(process.argv.includes('--cooked')?'artifacts/audio-alias-proof-cooked.json':'artifacts/audio-alias-proof.json',JSON.stringify(report,null,2)+'\n');
}catch(e){console.error(e);process.exitCode=1;}finally{client?.close();host.kill('SIGTERM');writeFileSync(process.argv.includes('--cooked')?'artifacts/audio-alias-proof-cooked.log':'artifacts/audio-alias-proof.log',log);}

"""Capture a reviewed style-pass candidate inside the actual Game Engine.

Run only after the candidate has passed independent image review and has been
integrated by the coordinator. Never copies artwork or updates render goldens.
Records the viewport before stepping: screenshot dimensions alone do not update
native WorldViewFollow bounds. Starts/stops only the session it owns.
"""
from pathlib import Path
import argparse,json,subprocess,time
ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('--district',type=int,default=1);parser.add_argument('--out',default='.gameengine/style-pass');args=parser.parse_args()
out=ROOT/args.out;out.mkdir(parents=True,exist_ok=True)
def command(*parts):
 result=subprocess.run(['gameengine',*map(str,parts),'--json'],cwd=ROOT,capture_output=True,text=True,check=True)
 return json.loads(result.stdout)
pid=None
try:
 session=command('run','--headless','--paused','--tier','mobile','--scene','scenes/cartoon.scene.json');pid=session['pid']
 def call(method,params=None):
  values=['call',method,'--session',pid]
  if params is not None:values+=['--params',json.dumps(params)]
  return command(*values)
 def step(count):return command('step',count,'--session',pid)
 results={'sessionHost':session.get('host'),'district':args.district,'captures':[]}
 for label,width,height,insets in [('landscape',1280,720,[0,0,0,0]),('slim',360,880,[0,34,0,24])]:
  view={'type':'view','width':width,'height':height,'scale':1,'insets':insets}
  call('input.push',{'events':[view]});step(30)
  command('cheat','run','overworld.map-preview',f'district={args.district}','facing=1','--session',pid)
  settled=False
  for attempt in range(60):
   time.sleep(.2)
   step(120);render=call('render.stats',{'render':True,'width':width,'height':height});assets=call('assets.status');stack=call('ui.stack')
   if assets.get('pending',0)==0 and not any(v.get('layer')=='loading' for v in stack.get('views',[])):
    settled=True;break
  if not settled:
   (out/'loading-failure.json').write_text(json.dumps({'assets':assets,'stack':stack},indent=2)+'\n')
   raise RuntimeError('Asset/loading cover did not settle; refuse misleading screenshot')
  camera=command('camera','list','--size',f'{width}x{height}','--session',pid)
  shot=command('screenshot',out/f'map-{args.district}-{label}.png','--width',width,'--height',height,'--session',pid)
  results['captures'].append({'recordedViewport':view,'assets':assets,'camera':camera,'shot':shot})
 (out/f'map-{args.district}-capture.json').write_text(json.dumps(results,indent=2)+'\n')
 print(json.dumps({'ok':True,'output':str(out),'captures':results['captures']},indent=2))
finally:
 if pid is not None:command('session','stop','--session',pid)

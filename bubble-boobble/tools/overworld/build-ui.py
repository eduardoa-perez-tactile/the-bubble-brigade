"""Author overworld UI through the editor's transactional document CLI only."""
import subprocess

def cmd(*args):
 r=subprocess.run(['gameengine','ui','doc',*args],capture_output=True,text=True)
 if r.returncode: raise RuntimeError(r.stdout+r.stderr)

def prop(doc,key,kind='text',default=''):
 cmd('prop','add',doc,key,'--type',kind,'--default',default)
def add(doc,kind,id,parent='root',text=None,**styles):
 args=['add',doc,kind,'--parent',parent,'--id',id]
 if text is not None: args+=['--text',text]
 for k,v in styles.items():args+=['--set',f'{k}={v}']
 cmd(*args)
def set_(doc,id,**styles):cmd('set',doc,id,*[f'{k}={v}' for k,v in styles.items()])

# One reusable button, a compact cream ticket with an ink pressed state.
cmd('new','overworld-button')
cmd('settings','overworld-button','behaviour=button')
prop('overworld-button','label',default='CONTINUE')
prop('overworld-button','selected','yesno','no')
set_('overworld-button','root',w=280,h=46,pad=0,align='center',justify='center',bg='#ead9ad',radius=4)
add('overworld-button','label','owb_label',text='{label}',w='96%',h=36,fontSize=22,fitMin=12,color='#382d25',textAlign='center')
cmd('set','overworld-button','root','bg=#c6984b','--state','pressed')
cmd('set','overworld-button','root','bg=#b8a989','opacity=0.6','--state','disabled')
cmd('set','overworld-button','root','bg=#c6984b','--pose','selected=yes')

cmd('new','overworld-hud','--kind','view')
for key in ['district','progress','coins','prompt','help']:prop('overworld-hud',key)
set_('overworld-hud','root',bg='',pad=22,dir='column',justify='space-between')
add('overworld-hud','element','owh_top',dir='row',justify='space-between',pad=0,w='100%',h=76)
add('overworld-hud','element','owh_place',parent='owh_top',dir='column',pad='8 16',bg='#eee0bcf5',radius=5,w=300,h=76)
add('overworld-hud','label','owh_district',parent='owh_place',text='{district}',fontSize=25,fitMin=15,w='100%',h=32,color='#382d25')
add('overworld-hud','label','owh_progress',parent='owh_place',text='{progress}',fontSize=17,fitMin=12,w='100%',h=24,color='#715c40')
add('overworld-hud','element','owh_right',parent='owh_top',dir='column',align='end',pad=0,gap=6,w=170,h=92)
add('overworld-hud','label','owh_coins',parent='owh_right',text='{coins}',fontSize=24,w=170,h=34,color='#fff0c6',textAlign='right',shadowX=1,shadowY=2,shadowColor='#342a20')
cmd('add','overworld-hud','use','--parent','owh_right','--id','owh_menu','--doc','overworld-button','--key','menu')
set_('overworld-hud','owh_menu',label='MENU · ESC',w=160,h=38)
add('overworld-hud','element','owh_bottom',dir='column',align='center',gap=6,pad=0,h=76)
add('overworld-hud','label','owh_prompt',parent='owh_bottom',text='{prompt}',fontSize=23,fitMin=15,w='90%',h=32,color='#fff2cd',textAlign='center',shadowX=1,shadowY=2,shadowColor='#30271e')
add('overworld-hud','label','owh_help',parent='owh_bottom',text='{help}',fontSize=16,fitMin=11,w='96%',h=24,color='#fff2cd',textAlign='center',shadowX=1,shadowY=2,shadowColor='#30271e')

for name in ['overworld-encounter','overworld-dialogue']:
 cmd('new',name,'--kind','view')
 cmd('settings',name,'behaviour=dialog','dims=yes')
 set_(name,'root',bg='',pad=24,align='center',justify='center')
 add(name,'element','ow_panel',dir='column',align='center',pad=24,gap=10,w=520,h='auto',bg='#eee0bc',radius=8)
 add(name,'element','ow_rule',parent='ow_panel',w='100%',h=3,bg='#8c5a35',pad=0)
 if name=='overworld-encounter':
  for key in ['title','subtitle','description','status','reward','playLabel']:prop(name,key)
  prop(name,'locked','yesno','no')
  for key,size,height,color in [('subtitle',17,26,'#8c5a35'),('title',34,80,'#382d25'),('description',20,70,'#5a4936'),('status',18,45,'#88603b'),('reward',19,28,'#5a4936')]:
   add(name,'label','owe_'+key,parent='ow_panel',text='{'+key+'}',fontSize=size,fitMin=14,w='100%',h=height,color=color,textAlign='center')
  cmd('add',name,'use','--parent','ow_panel','--id','owe_play','--doc','overworld-button','--key','play')
  set_(name,'owe_play',label='@playLabel',w='100%')
  cmd('set',name,'owe_play','hide=true','--pose','locked=yes')
  cmd('add',name,'use','--parent','ow_panel','--id','owe_back','--doc','overworld-button','--key','back')
  set_(name,'owe_back',label='BACK TO MAP',w='100%')
 else:
  for key in ['speaker','message','detail']:prop(name,key)
  prop(name,'buttons','list','[]') if False else cmd('prop','add',name,'buttons','--type','list','--of','overworld-button')
  for key,size,height,color in [('speaker',30,48,'#382d25'),('message',21,150,'#5a4936'),('detail',17,60,'#88603b')]:
   add(name,'label','owd_'+key,parent='ow_panel',text='{'+key+'}',fontSize=size,fitMin=13,w='100%',h=height,color=color,textAlign='center')
  cmd('add',name,'repeat','--parent','ow_panel','--doc','overworld-button','--property','buttons','--id','owd_buttons')
  set_(name,'owd_buttons',gap=6,w='100%')
  cmd('add',name,'use','--parent','ow_panel','--id','owd_back','--doc','overworld-button','--key','back')
  set_(name,'owd_back',label='BACK',w='100%')

"""Author stamp-book documents through the Game Engine's validated editor API."""
import json
import subprocess

INK='#285b59'
PAPER='#f5e9cd'
GOLD='#b88a40'

def cli(*args):
    result=subprocess.run(['gameengine','ui','doc',*args,'--json'],capture_output=True,text=True)
    if result.returncode:
        raise RuntimeError(result.stdout+result.stderr)
    return json.loads(result.stdout)

def element(children,**style):
    return dict(type='element',children=children,style=dict(pad=0,**style))

def label(text,size=18,height=24,**style):
    return dict(type='label',text=text,style=dict(w='100%',h=height,fontSize=size,fitMin=size-2,color=INK,**style))

def icon(prop,image,w,h,**style):
    return dict(type='icon',property=prop,image=image,style=dict(w=w,h=h,**style))

def prop(kind='text',default='',**extra):
    return dict(type=kind,default=default,**extra)

def yes(changes,default=False):
    return prop('yesno',default,poses={'yes':{'set':changes}})

def save(name,nodes,properties,kind='widget',**extra):
    known=cli('list')['documents']
    if not any(d['name']==name for d in known):
        cli('new',name,'--kind',kind)
    inspected=cli('inspect',name)
    doc=inspected['document']
    doc.update(nodes=nodes,properties=properties,root='root',title=name.replace('-',' ').title(),**extra)
    cli('save','--params',json.dumps(dict(doc=name,document=doc,baseHash=inspected['baseHash'])))
    print('Authored',name)

def use(doc,key,**props):
    return dict(type='use',doc=doc,key=key,props={k:{'property':v} for k,v in props.items()})

save('journal-tab',{
 'root':element(['label','lock'],dir='column',w=164,h=46,align='center',justify='center',radius=5,bg='#e7d9b8'),
 'label':label('{label}',14,22,textAlign='center'),
 'lock':dict(type='label',text='UNDISCOVERED',show='locked',style=dict(w='100%',h=13,fontSize=10,color='#756a55',textAlign='center')),
},dict(label=prop(),active=yes({'root':{'bg':INK},'label':{'color':PAPER}}),selected=yes({'root':{'bg':GOLD},'label':{'color':'#28291e'}}),locked=prop('yesno',False)),behaviour='button',transition={'type':'easeOut','ms':100},states={'pressed':{'set':{'root':{'scale':.98}}}})

save('journal-stamp',{
 'root':element(['picture','name','status'],dir='column',align='center',w=158,h=100,gap=2,bg='#fbf2de',radius=5),
 'picture':element(['art','crest'],w='100%',h=54),
 'art':icon('art','adventure/lighthouse','100%','100%',fit='cover'),
 'crest':icon('crest','overworld-living/common/markers/available',34,34,position='anchored',anchor=[1,1],pivot=[1,1],offset=[-4,4],attach=True),
 'name':label('{label}',16,24,textAlign='center'),
 'status':label('{status}',12,16,textAlign='center'),
},dict(label=prop(),art=prop('image','adventure/lighthouse'),crest=prop('image','overworld-living/common/markers/available'),status=prop(),active=yes({'root':{'bg':'#dfd4b3'}}),locked=yes({'art':{'saturation':0,'imageAlpha':.4},'status':{'color':'#847359'}}),selected=yes({'root':{'bg':'#dfc790'},'name':{'color':'#193e3c'}})),behaviour='button',transition={'type':'easeOut','ms':120},states={'pressed':{'set':{'root':{'scale':.97}}}})

save('journal-keepsake',{
 'root':element(['art','name','status','owned'],dir='column',align='center',w=102,h=112,gap=4),
 'art':icon('art','cartoon/frames/badge/green',50,54,opacity=.25,saturation=0),
 'name':label('{label}',13,22,textAlign='center'),
 'status':label('NOT FOUND',11,18,textAlign='center'),
 'owned':dict(type='label',text='COLLECTED',show='owned',style=dict(w='100%',h=18,fontSize=11,color=INK,textAlign='center',position='anchored',anchor=[.5,1],pivot=[.5,1],offset=[0,0])),
},dict(label=prop(),art=prop('image','cartoon/frames/badge/green'),owned=yes({'art':{'opacity':1,'saturation':1},'status':{'opacity':0}})),behaviour='none')
save('journal-action',{
 'root':element(['label'],dir='row',w='100%',h=44,align='center',justify='center',bg=INK,radius=5),
 'label':dict(type='label',text='{label}',style=dict(w='94%',h=32,fontSize=18,fitMin=14,color=PAPER,textAlign='center')),
},dict(label=prop(),selected=yes({'root':{'bg':'#a8742f'}})),behaviour='button',transition={'type':'easeOut','ms':100},states={'pressed':{'set':{'root':{'scale':.98}}}})

nodes={
 'root':element(['book'],w='100%',h='100%',align='center',justify='center'),
 'book':element(['header','tabs','spread','detail','footer','utilities'],dir='column',w=940,h=668,gap=8,bg=PAPER,radius=16),
 'header':element(['heading','coins'],dir='row',w='100%',h=44,align='center',justify='space-between'),
 'heading':label('ADVENTURE JOURNAL',30,44),
 'coins':label('{coins}',18,30,textAlign='right'),
 'tabs':dict(type='repeat',doc='journal-tab',property='pages',style=dict(w='100%',dir='row',gap=8)),
 'spread':element(['missionsPage','fold','collectionPage'],dir='row',w='100%',h=286,gap=24),
 'missionsPage':element(['chapterRow','district','missionGrid'],dir='column',w=530,gap=5),
 'chapterRow':element(['chapter','localProgress'],dir='row',w='100%',h=23),
 'chapter':label('{chapter}',13,22),
 'localProgress':label('{localProgress}',13,22,textAlign='right'),
 'district':label('{district}',24,34),
 'missionGrid':dict(type='repeat',doc='journal-stamp',property='missions',style=dict(w='100%',dir='row',gap=10)),
 'fold':element([],w=1,h='100%',bg='#c2aa7e'),
 'collectionPage':element(['trialHeading','trialRow','trialStatus','shelfHeading','shelf','keepsakeHint'],dir='column',w=260,gap=5),
 'trialHeading':label('OPTIONAL MASTERY TRIAL',13,22),
 'trialRow':element(['trialArt','trialButton'],dir='row',w='100%',h=48,gap=8,align='center'),
 'trialArt':icon('trialArt','overworld-living/common/markers/available',44,44),
 'trialButton':use('journal-action','trial',label='trialName',selected='trialSelected'),
 'trialStatus':label('{trialStatus}',12,24),
 'shelfHeading':label('KEEPSAKE SHELF',16,28),
 'shelf':dict(type='repeat',doc='journal-keepsake',property='keepsakes',style=dict(w='100%',dir='row',gap=12)),
 'keepsakeHint':label('{keepsakeHint}',13,28),
 'detail':element(['detailTitle','detailText'],dir='column',w='100%',h=46,gap=0,bg='#eaddbf',radius=5),
 'detailTitle':label('{detailTitle}',15,23),
 'detailText':label('{detail}',14,23),
 'footer':element(['next','primarySlot'],dir='row',w='100%',h=44,gap=20,align='center'),
 'next':element(['nextHeading','nextLabel'],dir='column',w=400,gap=3),
 'nextHeading':label('UP NEXT',12,18),
 'nextLabel':label('{nextLabel}',17,28),
 'primary':use('journal-action','primary',label='primaryLabel',selected='primarySelected'),
 'utilities':element(['totalProgress','claim','back'],dir='row',w='100%',h=44,gap=14,align='center'),
 'totalProgress':label('{totalProgress}',13,26),
 'claim':dict(**use('journal-action','overworld-guide-claim',selected='claimSelected'),show='claimable'),
 'back':dict(**use('journal-action','overworld-back',selected='backSelected'),show='showBack'),
}
# Repeats stamp directly into their parent; explicit containers own row/wrap layout.
for key in ['tabs','missionGrid','shelf']:
    repeat=nodes[key]
    nodes[key]=element([key+'Items'],**repeat.pop('style'))
    nodes[key+'Items']=repeat
nodes['book']['style']['pad']=18
nodes['heading']['style'].update(w=0,grow=1)
nodes['coins']['style']['w']=155
nodes['chapter']['style'].update(w=0,grow=1)
nodes['localProgress']['style']['w']=140
nodes['trialButton']['style']=dict(w=0,grow=1)
nodes['detail']['style']['pad']=[3,12,3,12]
nodes['primarySlot']=element(['primary'],w=0,grow=1)
nodes['primary']['style']=dict(w='100%')
nodes['totalProgress']['style'].update(w=0,grow=1)
nodes['claim'].update(props=dict(label='CLAIM 15 COINS',selected={'property':'claimSelected'}),style=dict(w=220))
nodes['back'].update(props=dict(label='BACK TO MAP',selected={'property':'backSelected'}),style=dict(w=180))
properties={k:prop() for k in ['coins','district','chapter','localProgress','totalProgress','trialName','trialStatus','keepsakeHint','detailTitle','detail','nextLabel','primaryLabel']}
properties.update({k:prop('yesno',False) for k in ['trialSelected','primarySelected','backSelected','claimSelected','claimable','showBack']})
properties.update(trialArt=prop('image','overworld-living/common/markers/available'),pages=prop('list',[],of='journal-tab'),missions=prop('list',[],of='journal-stamp'),keepsakes=prop('list',[],of='journal-keepsake'))
save('adventure-stamp-book',nodes,properties,'view',view=dict(behaviour='dialog',dims=True,safe=True,enter=dict(set={'book':dict(opacity=0,ty=12,scale=.98)}),exit=dict(set={'book':dict(opacity=0,ty=8)})),transition=dict(type='easeOut',ms=180))

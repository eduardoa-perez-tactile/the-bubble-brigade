import { defineView, Screen, Widget, Sprite, Particles } from '@gameengine/ui';
import { desktopModel, type DesktopModel } from '../desktop/model';
import { initialDesktopState } from '../desktop/state';
import { initialAdventure } from '../overworld/progression';
import { initialDesktopSave } from '../desktop/save';

/** The existing title/menu flow with cartoon branding and the same navigation keys. */
export const CartoonMenuView = defineView<DesktopModel>({
  name: 'CartoonMenu',
  samples: {
    title: desktopModel(initialDesktopState, initialDesktopSave),
    main: desktopModel({ ...initialDesktopState, screen: 'menu',cartoon:true }, initialDesktopSave),
    approved: desktopModel({...initialDesktopState,screen:'menu',cartoon:true},{...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:{...initialAdventure(),cleared:{'encounter-1':{bestScore:100,clears:1},'encounter-2':{bestScore:100,clears:1}}}}]}),
    mainNarrow: desktopModel({ ...initialDesktopState, screen:'menu',cartoon:true },initialDesktopSave,0,false,true),
    titleHidden: desktopModel(initialDesktopState, initialDesktopSave, 66),
  },
  render: (model, { intent }) => <Screen safeArea class="desktop-screen cartoon-menu-screen">
    <Widget class={() => model().reducedEffects ? "cartoon-menu menu-calm" : "cartoon-menu"} doc="cartoon-menu" id="cartoon-main" props={{
      firstUseArt:()=>model().buttons.find(button=>button.key==='adventure-continue')?.label==='CONTINUE ADVENTURE',thirdUseArt:()=>!model().buttons.some(button=>button.key==='help'),firstArt:()=>model().buttons[0]?.label==='CONTINUE ADVENTURE'?'cartoon/menu/type/continue':'cartoon/menu/type/continue',thirdArt:()=>model().buttons[3]?.key==='help'?'cartoon/menu/type/quit':'cartoon/menu/type/quit',progress:()=>model().menuProgress,narrow:()=>model().menuNarrow,titleNarrow:()=>model().menuNarrow&&model().page==='title',firstLabel:()=>model().buttons.find(button=>button.key==='adventure-continue')?.label??'BEGIN ADVENTURE',arcadeSelected:()=>model().buttons[model().selected]?.key==='adventure-arcade',restartSelected:()=>model().buttons[model().selected]?.key==='adventure-new',thirdLabel: () => model().buttons.find(button=>button.key==='quit'||button.key==='help')?.label ?? 'QUIT',titleMode: () => model().page === 'title', closedPrompt:()=>model().page==='title', promptVisible: () => model().frame % 90 < 65,
      status: () => model().status, showStatus: () => !!model().status,
      startSelected: () => model().buttons[model().selected]?.key==='adventure-continue',
      settingsSelected: () => model().buttons[model().selected]?.key==='settings',
      quitSelected: () => ['quit','help'].includes(model().buttons[model().selected]?.key??''),
    }} codeAreas={{greeter:()=> Sprite({class:'menu-greeter',src:'cartoon/menu/greeting/04'}),atmosphere:()=> Particles({class:'menu-atmosphere',effect:'cartoon/menu/atmosphere.vfx.json',emitting:()=>model().page!=='title'&&!model().reducedEffects,unit:100,seed:29})}} onIntent={(_, event) => { const key=event.path.at(-1)!; intent(key==='choose-mode'?'adventure-continue':key==='quit'?(model().buttons.find(button=>button.key==='quit'||button.key==='help')?.key??key):key); }} />
  </Screen>,
});

/** Only the closed cloth lifts; branding and the planted actor belong to the menu behind it. */
export interface TitleCurtainModel {progress:number;narrow:boolean}
export const CartoonTitleCurtainView=defineView<TitleCurtainModel>({
 name:'CartoonTitleCurtain',layer:'overlay',blockInput:true,
 samples:{start:{progress:0,narrow:false},middle:{progress:.5,narrow:false},end:{progress:1,narrow:false}},
 render:model=><Screen safeArea class="desktop-screen title-curtain-screen"><Widget doc="cartoon-menu" id="title-curtain" class="cartoon-menu title-curtain-sheet" style={()=>({transform:`translateY(${-104*model().progress}%)`})} props={{titleMode:true,titleNarrow:()=>model().narrow,narrow:()=>model().narrow,promptVisible:false,closedPrompt:false}}/></Screen>,
});

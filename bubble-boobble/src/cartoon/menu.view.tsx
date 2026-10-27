import { defineView, Screen, Widget, Flipbook, Particles } from '@gameengine/ui';
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
      firstUseArt:()=>model().buttons[0]?.label==='CONTINUE ADVENTURE',thirdUseArt:()=>model().buttons[3]?.key!=='help',firstArt:()=>model().buttons[0]?.label==='CONTINUE ADVENTURE'?'cartoon/menu/type/continue':'cartoon/menu/type/continue',thirdArt:()=>model().buttons[3]?.key==='help'?'cartoon/menu/type/quit':'cartoon/menu/type/quit',progress:()=>model().menuProgress,narrow:()=>model().menuNarrow,titleNarrow:()=>model().menuNarrow&&model().page==='title',firstLabel:()=>model().buttons[0]?.label??'BEGIN ADVENTURE',arcadeSelected:()=>model().selected===1,thirdLabel: () => model().buttons[3]?.label ?? 'QUIT',titleMode: () => model().page === 'title', promptVisible: () => model().frame % 90 < 65,
      status: () => model().status, showStatus: () => !!model().status,
      startSelected: () => model().selected === 0,
      settingsSelected: () => model().selected === 2,
      quitSelected: () => model().selected === 3,
    }} codeAreas={{greeter:()=> Flipbook({class:'menu-greeter',clip:'cartoon/menu/greeting.clip2d.json',playing:()=>!model().reducedEffects}),atmosphere:()=> Particles({class:'menu-atmosphere',effect:'cartoon/menu/atmosphere.vfx.json',emitting:()=>!model().reducedEffects,unit:100,seed:29})}} onIntent={(_, event) => { const key=event.path.at(-1)!; intent(key==='choose-mode'?'adventure-continue':key==='quit'?(model().buttons[3]?.key??key):key); }} />
  </Screen>,
});

import { defineView, Screen, Widget } from '@gameengine/ui';
import { desktopModel, type DesktopModel } from '../desktop/model';
import { initialDesktopState } from '../desktop/state';
import { initialDesktopSave } from '../desktop/save';

/** The existing title/menu flow with cartoon branding and the same navigation keys. */
export const CartoonMenuView = defineView<DesktopModel>({
  name: 'CartoonMenu',
  samples: {
    title: desktopModel(initialDesktopState, initialDesktopSave),
    main: desktopModel({ ...initialDesktopState, screen: 'menu',cartoon:true }, initialDesktopSave),
    titleHidden: desktopModel(initialDesktopState, initialDesktopSave, 66),
  },
  render: (model, { intent }) => <Screen safeArea class="desktop-screen cartoon-menu-screen">
    <Widget class="cartoon-menu" doc="cartoon-menu" id="cartoon-main" props={{
      firstLabel:()=>model().buttons[0]?.label??'BEGIN ADVENTURE',arcadeSelected:()=>model().selected===1,thirdLabel: () => model().buttons[3]?.label ?? 'QUIT',titleMode: () => model().page === 'title', promptVisible: () => model().frame % 90 < 65,
      status: () => model().status, showStatus: () => !!model().status,
      startSelected: () => model().selected === 0,
      settingsSelected: () => model().selected === 2,
      quitSelected: () => model().selected === 3,
    }} onIntent={(_, event) => { const key=event.path.at(-1)!; intent(key==='choose-mode'?'adventure-continue':key==='quit'?(model().buttons[3]?.key??key):key); }} />
  </Screen>,
});

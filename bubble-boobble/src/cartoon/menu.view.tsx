import { defineView, Screen, Widget } from '@gameengine/ui';
import { desktopModel, type DesktopModel } from '../desktop/model';
import { initialDesktopState } from '../desktop/state';
import { initialDesktopSave } from '../desktop/save';

/** The existing title/menu flow with cartoon branding and the same navigation keys. */
export const CartoonMenuView = defineView<DesktopModel>({
  name: 'CartoonMenu',
  samples: {
    title: desktopModel(initialDesktopState, initialDesktopSave),
    main: desktopModel({ ...initialDesktopState, screen: 'menu' }, initialDesktopSave),
    titleHidden: desktopModel(initialDesktopState, initialDesktopSave, 66),
  },
  render: (model, { intent }) => <Screen safeArea class="desktop-screen">
    <Widget class="cartoon-menu" doc="cartoon-menu" id="cartoon-main" props={{
      thirdLabel: () => model().buttons[2]?.label ?? 'QUIT',titleMode: () => model().page === 'title', promptVisible: () => model().frame % 90 < 65,
      status: () => model().status, showStatus: () => !!model().status,
      startSelected: () => model().selected === 0,
      settingsSelected: () => model().selected === 1,
      quitSelected: () => model().selected === 2,
    }} onIntent={(_, event) => { const key=event.path.at(-1)!; intent(key==='quit'?(model().buttons[2]?.key??key):key); }} />
  </Screen>,
});

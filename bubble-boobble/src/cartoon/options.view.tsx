import { defineView, Widget } from '@gameengine/ui';
import { desktopModel, type DesktopModel } from '../desktop/model';
import { initialDesktopState } from '../desktop/state';
import { initialDesktopSave } from '../desktop/save';

/** Caller-aware settings keep their existing intents inside the Adventure dialog shell. */
export const CartoonOptionsView = defineView<DesktopModel>({
 name: 'CartoonOptions', dims: true, blockInput: true,
 samples: {
  menu: desktopModel({...initialDesktopState, screen:'settings', cartoon:true}, initialDesktopSave),
  paused: desktopModel({...initialDesktopState, screen:'settings', cartoon:true, settingsReturn:'pause'}, initialDesktopSave),
 },
 render: (model, {intent}) => <Widget id="desktop-account" doc="adventure-options" class="adventure-menu cartoon-options" props={{
  rows: () => model().buttons.map(button => {
   const split=button.label.indexOf(':');
   return {...button, key:button.key==='menu'?'settings-back':button.key,
    label:split<0?button.label:button.label.slice(0,split),
    value:split<0?'':button.label.slice(split+1).trim(), adjustable:split>=0};
  }),
  profile: () => model().statsName,
  status: () => model().status,
  showStatus: () => !!model().status,
 }} onIntent={(_,event)=>{
  const key=event.item??event.path.at(-1)!;
  intent(key==='settings-back'?'menu':key);
 }}/>,
});

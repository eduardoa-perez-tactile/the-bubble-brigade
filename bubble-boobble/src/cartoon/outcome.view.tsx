import {defineView,Screen,Widget} from '@gameengine/ui';
import type {DesktopModel} from '../desktop/model';
import {desktopModel} from '../desktop/model';
import {initialDesktopState} from '../desktop/state';
import {initialDesktopSave} from '../desktop/save';
export const CartoonOutcomeView=defineView<DesktopModel>({
 name:'CartoonOutcome',blockInput:true,
 samples:{defeat:desktopModel({...initialDesktopState,won:false},initialDesktopSave),victory:desktopModel({...initialDesktopState,won:true},initialDesktopSave)},
 render:model=><Screen safeArea class="desktop-screen cartoon-outcome-screen"><Widget id="cartoon-outcome" doc="cartoon-outcome" class="cartoon-outcome" props={{art:()=>model().resultWon?'cartoon/ui/cues/bravo':'cartoon/ui/cues/brigade-down'}}/></Screen>,
});

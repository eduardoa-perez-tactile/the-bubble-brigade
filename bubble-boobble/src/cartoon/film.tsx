import { assets, loading, MaterialGlobals, quality, read } from '@gameengine/runtime';
import { defineUI, onCleanup, onUiFrame, useDoc, useResource, views, type ViewHandle } from '@gameengine/ui';
import { session } from '../arcade/session';
import { desktopState } from '../desktop/state';
import { desktopSaveState } from '../desktop/save';
import { CartoonFilmView, type CartoonFilmModel } from './film.view';

/** Tune the complete treatment here; 0 removes it, 1 is the full baked print. */
export const CARTOON_FILM_STRENGTH = .45;

const filmUI = defineUI({name:'CartoonFilmUI',root(){
  const materials=useResource(MaterialGlobals),state=useDoc(desktopState),save=useDoc(desktopSaveState),arcade=useDoc(session);
  let handle:ViewHandle<CartoonFilmModel>|undefined,previousImage='',previousScratch='clear',loaded=false;
  onCleanup(onUiFrame(()=>{
    const s=state();
    // Reduced effects also supplies a direct A/B switch in the existing settings.
    const visible=materials()?.v1[0]===1&&!save().settings.reducedEffects&&CARTOON_FILM_STRENGTH>0&&!loading.active()&&!s.transitionAction&&!s.titleRevealActive;
    if(!visible){handle?.close({immediate:true});handle=undefined;previousImage='';return;}
    if(!loaded){assets.load('film-presentation');loaded=true;}
    const game=arcade().game,device=quality.device();
    // Only the drawings change at 12 fps. Simulation and responsive motion retain
    // their original rates. Menus, pause and phone-low keep a single still print.
    const moving=s.screen==='play'&&game&&!game.Paused&&device.memoryClass!=='phone-low'&&device.tier!=='compat';
    const frame=moving?Math.floor(game.Tick/5)%4:0,image=`cartoon/film/print-${frame}`;
    // A damaged print occasionally catches the projector light. Brief edge
    // scratches leave the center clear and disappear immediately on pause.
    const phase=moving?game.Tick%300:-1;
    const scratch=phase>=80&&phase<85?'left':phase>=230&&phase<235?'right':'clear';
    // Other overlays may be opened after this one (HUD/outcome). Reattach only
    // on that structural change, so the patina consistently includes their art.
    const stack=views.stack(),last=stack[stack.length-1];
    if(handle&&(!handle.open()||last?.id!==handle.id)){handle.close({immediate:true});handle=undefined;}
    if(!handle||image!==previousImage||scratch!==previousScratch){
      const model={image,strength:CARTOON_FILM_STRENGTH,scratch} as CartoonFilmModel;
      if(!handle)handle=views.push(CartoonFilmView,model);else handle.update(model);
      previousImage=image;previousScratch=scratch;
    }
  }));
  onCleanup(()=>{handle?.close({immediate:true});if(loaded)assets.release('film-presentation');});
  return null;
}});

export const CartoonFilmUI={...filmUI,after:['DesktopUI'],resources:[read(MaterialGlobals)]};

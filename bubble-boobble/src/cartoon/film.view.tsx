import { defineView, Screen, Widget } from '@gameengine/ui';

export interface CartoonFilmModel { image: string; strength: number; scratch?: 'clear'|'left'|'right' }

/** One non-interactive layer over the world and UI; loading/black covers stay clean. */
export const CartoonFilmView = defineView<CartoonFilmModel>({
  name: 'CartoonFilm', layer: 'overlay', blockInput: false, enter: null, exit: null,
  samples: {
    print: { image: 'cartoon/film/print-0', strength: .45 },
    scratched: { image: 'cartoon/film/print-0', strength: .45, scratch:'left' },
  },
  render: model => <Screen id="cartoon-film-screen" style={{'pointer-events':'none'}}>
    <Widget doc="cartoon-film" style={{width:'100%',height:'100%','pointer-events':'none'}}
      props={{image:()=>model().image,strength:()=>model().strength,scratch:()=>model().scratch??'clear'}} />
  </Screen>,
});

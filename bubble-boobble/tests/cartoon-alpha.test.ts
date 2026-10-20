import {expect,renderTest} from '@gameengine/test';
import {MeshRenderer,WorldView} from '@gameengine/runtime';

renderTest('cartoon native GPU alpha keeps bubble centers clear and stencil clips rims',async({input,world,step,render})=>{
  input.view(768,720,1);await step(2);
  for(const row of world.all(MeshRenderer))world.despawn(row.entity);
  world.spawn({LocalTransform:{position:[384,360,0]},Sprite:{image:'cartoon/white',size:[768,720],color:'#204060',order:0,unlit:true}});
  world.spawn({LocalTransform:{position:[250,360,0]},Sprite:{image:'cartoon/frames/bubble',size:[128,128],order:10,unlit:true}});
  world.spawn({LocalTransform:{position:[500,360,0]},SpriteMask:{size:[64,128]}});
  world.spawn({LocalTransform:{position:[500,360,0]},Sprite:{image:'cartoon/frames/bubble',size:[128,128],order:20,maskInteraction:'VisibleInside',unlit:true}});
  await step(2);
  world.setResource(WorldView,{center:[384,360],orthoSize:360,designAspect:768/720,fit:'Contain'});
  const probe=render.probe({width:768,height:720,points:[[250,360],[500,360],[440,360],[560,360],[192,360]]});
  for(let i=0;i<4;i++)expect(probe.points[i]!.rgba.slice(0,3)).toEqual([32,64,96]);
  // The unmasked rim exists, while both masked outer edges are absent. A blank
  // scene, opaque bubble, unbound texture, or missing stencil fails this check.
  const rim=probe.points[4]!.rgba;
  expect(Math.abs(rim[0]!-32)+Math.abs(rim[1]!-64)+Math.abs(rim[2]!-96)>20).toBe(true);
  render.expectDrawCalls('<=',8,{width:768,height:720});
},{scene:'scenes/pixel-prototype.scene.json'});

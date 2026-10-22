import { expect, worldTest } from '@gameengine/test';
import campaign from '../data/levels.json';
import { createPartyGame } from '../src/arcade/party';
import { cartoonRescueLabels } from '../src/cartoon/labels';
import { cartoonHudBounds } from '../src/cartoon/hud-layout';
import { partyNames } from '../src/arcade/party-config';
import { cartoonHelpAnchors,cartoonHelpEnvelope } from '../src/cartoon/help-layout';
import { cartoonBadgeAnchor } from '../src/cartoon/actor-layout';
import { arenaLayout } from '../src/arcade/arena-layout';
import { cartoonProjection } from '../src/cartoon/projection';

worldTest('cartoon feedback preparation names separate in projected space and combat keeps numbered badges',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human'),10,'cartoon');
 for(const p of g.Players)Object.assign(p,{X:800,Y:250,Invincible:0});
 const before=JSON.stringify(g);
 for(const [width,height] of [[768,720],[640,960],[1680,720],[2520,1080]]){
  const view={width:width!,height:height!,safeArea:[0,0,0,0]},hud=cartoonHudBounds(view);
  const labels=cartoonRescueLabels(g,view),names=labels.filter(l=>'playerName' in l);
  expect(names.length).toBe(10);expect(labels.filter(l=>l.worldNumber).length).toBe(10);
  expect(labels.length).toBeLessThanOrEqual(36);
  expect(names.map(l=>l.text)).toEqual([...partyNames]);
  for(let index=0;index<names.length;index++){
   const a=names[index]!;
   expect(a.y-a.h/2>=hud.top&&a.y+a.h/2<=hud.bottom).toBe(true);
   for(const b of names.slice(index+1))expect(Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.y-b.y)<(a.h+b.h)/2).toBe(false);
  }
 }
 expect(JSON.stringify(g)).toBe(before);
 g.Party!.Phase='combat';
 const labels=cartoonRescueLabels(g,{width:768,height:720,safeArea:[0,0,0,0]});
 expect(labels.filter(l=>'playerName' in l).length).toBe(0);expect(labels.length).toBe(10);
});

worldTest('cartoon feedback help uses distinct dark character inks and preparation identifies AI',()=>{
 const g=createPartyGame(campaign,42,undefined,10,'cartoon');
 for(const p of g.Players)p.Invincible=0;
 g.Players[0]!.Downed=true;g.Players[1]!.Downed=true;
 const labels=cartoonRescueLabels(g,{width:768,height:720,safeArea:[0,0,0,0]});
 const calls=labels.filter(l=>l.text==='HELP!');
 expect(calls.length).toBe(2);expect(calls[0]!.color).not.toEqual(calls[1]!.color);
 expect(calls.every(l=>l.color.every(channel=>channel<100))).toBe(true);
 expect(labels.some(l=>l.text==='EMBER AI')).toBe(true);
 expect(labels.length).toBeLessThanOrEqual(36);
});


worldTest('cartoon feedback ten stacked rescue plaques numbers and star envelopes fit crown and floor across aspects',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human'),10,'cartoon');
 for(const [width,height,safeArea] of [[768,720,[0,0,0,0]],[640,960,[0,0,0,0]],[1680,720,[0,0,0,0]],[1179,2556,[0,177,0,102]]] as const){
  const view={width,height,safeArea},base=arenaLayout(g.Level,view),projection=cartoonProjection(g,base),hud=cartoonHudBounds(view);
  const layout={...base,...projection,footerTop:hud.bottom};
  for(const y of [-100,250,508]){
   for(const p of g.Players)Object.assign(p,{Downed:true,Lives:0,X:800,Y:y,Invincible:0});
   const before=JSON.stringify(g),anchors=cartoonHelpAnchors(g,layout),boxes=[...anchors.values()].map(a=>cartoonHelpEnvelope(a,layout));
   expect(anchors.size).toBe(10);expect(JSON.stringify(g)).toBe(before);
   expect([...cartoonHelpAnchors(g,layout)]).toEqual([...anchors]);
   for(let index=0;index<boxes.length;index++){
    const a=boxes[index]!;
    expect(a.y>=hud.top&&a.y+a.h<=hud.bottom).toBe(true);
    expect(a.x>=projection.projectX(18)&&a.x+a.w<=projection.projectX(1710)).toBe(true);
    for(const b of boxes.slice(index+1))expect(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y).toBe(false);
   }
   const labels=cartoonRescueLabels(g,view),helps=labels.filter(l=>l.text==='HELP!'),numbers=labels.filter(l=>l.worldNumber);
   expect(helps.length).toBe(10);expect(numbers.length).toBe(10);expect(labels.length).toBeLessThanOrEqual(36);
   for(let slot=0;slot<10;slot++){
    const anchor=anchors.get(slot)!,badge=cartoonBadgeAnchor(g.Players[slot]!,layout,anchor);
    expect(helps[slot]!.x).toBe(projection.projectX(anchor.x+8));
    expect(helps[slot]!.size>=8).toBe(true);
    expect(helps[slot]!.y).toBe(projection.projectY(anchor.y)+12*projection.scale);
    expect(numbers[slot]!.x).toBe(projection.projectX(badge.x+badge.size/2));
   }
  }
 }
});

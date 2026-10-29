import {expect,worldTest} from '@gameengine/test';
import {adventureActSummary,encounterActSummary} from '../src/adventure/act-summary';
import {createAdventureLevel} from '../src/adventure/episodes';

worldTest('Adventure act summary includes every authored group before play',()=>{
 for(let number=1;number<=25;number++){
  const level=createAdventureLevel(number),summary=encounterActSummary(number);
  const groups=[level.enemies,...(level.episode?.waves??[])];
  expect(summary.actCount).toBe(groups.length);
  expect(summary.enemyCount).toBe(groups.flat().length);
  expect(summary.actCounts).toEqual(groups.map(group=>group.length));
 }
 expect(encounterActSummary(1).actSummary).toBe('1 ACT · 3 ENEMIES');
 expect(encounterActSummary(5).actSummary).toBe('2 ACTS · 6 ENEMIES');
 expect(encounterActSummary(5).actBreakdown).toBe('Act 1: 3 · Act 2: 3');
},{scene:'scenes/cartoon.scene.json'});

worldTest('Adventure act summary follows future third acts and trial enemy caps',()=>{
 const level=createAdventureLevel(5);
 level.episode={...level.episode!,waves:[level.enemies.slice(0,2),level.enemies.slice(0,1)]};
 expect(adventureActSummary(level).actSummary).toBe('3 ACTS · 6 ENEMIES');
 expect(adventureActSummary(level).actBreakdown).toBe('Act 1: 3 · Act 2: 2 · Act 3: 1');
 expect(encounterActSummary(6,true).actSummary).toBe('1 ACT · 3 ENEMIES');
 expect(encounterActSummary(6).enemyCount).toBe(4);
},{scene:'scenes/cartoon.scene.json'});

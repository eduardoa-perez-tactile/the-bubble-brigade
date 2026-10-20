---
name: story-dialogue
version: 1.0.1
tier: optional
description: Branching dialogue, quests told as text and story flags in Game Engine — *.story files (one construct per line), @gameengine/story, StoryRun in the game, `gameengine story check|play` before running, and tests. Use for any conversation, narration, tutorial text, NPC chat or branching narrative.
---

# Story and dialogue

A story is **data**, not code: a `*.story` text file the game imports. Keep game rules in
systems; keep words, branches and story flags in the story.

## Format (one construct per line)

```
VAR gold = 10                       // flags: number, true/false, "string" — declare all of them
=== gate                            // a knot (section); the first one is where a run starts
Guard: Halt, {name}! #angry         // line; `Speaker:` optional; {flag} interpolates; #tags end it
\Note: not a speaker                // leading \ = narration that looks like `Word: …`
{? gold >= 5} You jingle your purse. // conditional line
~ gold -= 5                         // set a flag (=, +=, -=)
>> open_gate "north" 2              // event for the game, with arguments
* [Pay the toll.] -> road           // once-only choice; `+` = sticky (stays offered)
* {? has_pass} [Show the pass.]     // conditional choice with an indented body
  Guard: Go on then.
  -> road
{? gold < 1} -> broke               // conditional divert
-> END                              // finish
```

`//` starts a comment after whitespace, outside "quotes" (`>> open "a // b"` keeps it). Tags are
only the `#word`s ending a line (`Press #1 now. #hint` keeps `#1`). A choice with `-> knot`
cannot also have an indented body (`story check` reports it).

Expressions: numbers, "strings", true/false, flags, `visited(knot)`, `+ - * /`,
`== != < <= > >=`, `not and or`, parentheses.

## Check and play before running the game

```bash
gameengine story check                      # every .story in the project: unknown flags/knots,
                                      # unreachable knots, fall-offs, loops that never end
gameengine story play src/intro.story --choose 0,1 --flags '{"gold":2}'   # transcript for a path
```

Run `check` after every edit; add `play` transcripts for important paths to your tests.

## In the game

```ts
import { parseStory } from '@gameengine/story';
import { storyRun } from '@gameengine/story/world';
import introText from './intro.story';            // inlined as text by the bundler

const intro = parseStory(introText, 'intro.story'); // module level: parsed once

export const Talk = defineSystem({
  name: 'Talk',
  events: [Tap],
  run(ctx) {
    if (!ctx.events.read(Tap).length) return;
    const { run, save } = storyRun(intro);          // state lives in a world document
    const step = run.next();                        // line | choices | event | end
    if (step.kind === 'event' && step.name === 'open_gate') { /* spawn, move, … */ }
    if (step.kind === 'choices') run.choose(0);     // or from UI input; never loop on next()
                                                    // while choices are offered: it repeats them
    save();                                         // hashed, replayed, saved with the world
    dialogueDoc.set({ line: step.kind === 'line' ? step.text : '' });
  },
});
```

- Advance the story **in a sim system** (it writes a world document). Show it from a
  `LateUpdate` system or a view that reads a document (`defineDoc`), never the other way.
- Events (`>>`) are how the story asks the game to act; flags are how the game informs the
  story (`run` exposes `flags`; set them from the story or start a run with `flags`).
- One run per conversation or quest: `storyRun(program, { doc: 'story:blacksmith' })`.
- Saves: the run is in a world document, so `SaveSlots` and replays carry it. A save made
  mid-knot resumes there while that knot is unchanged; an edited knot restarts from its top.
  Once-only choices are remembered by knot and text: adding choices keeps them, rewording one
  makes it new.
- A loop that reads ahead (`for (s = run.next(); …)`) must stop at `choices` and cap its
  iterations, or a story that loops without a pause hangs the step (see `untilPause` in the sample).

## Test

```ts
worldTest('the guard lets you through after paying', async ({ step, tap }) => {
  await tap([0, 0]); await step(1);
  expect(dialogueDoc.get().line).toBe('Thank you kindly.');
});
```

Sample: `samples/tile-maze` (`src/maze.story`, `Storyteller` and `ShowCaption` in `src/main.ts`).

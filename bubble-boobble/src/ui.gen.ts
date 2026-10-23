// @generated — do not edit. Regenerate with `pnpm gen` (tools/bindgen).
// This project's UI documents (ui/**/*.ui.json, ADR 0122) as types: `<Widget doc="…">` checks its
// props, codeAreas and refs against them. Types only: nothing imports this file at run time.
// Events are the names `onIntent` hears: `<id>` is the placing `<Widget>`'s `id` or `eventKey` (else a slug of
// its first text property's value, else the document's name), or in a document the use's key; `<item>` is a
// Repeat item's key.
import type { LocText } from '@gameengine/ui';

declare module '@gameengine/ui' {
  interface UiDocumentTypes {
    /**
     * Cartoon Account: a view, screen (ui/docs/cartoon-account.ui.json)
     *
     * Properties:
     *   - `page`: enum profiles | scores | new-profile | settings, default "profiles"
     *   - `title`: text, default ""
     *   - `subtitle`: text, default ""
     *   - `name`: text, default ""
     *   - `status`: text, default ""
     *   - `statsName`: text, default ""
     *   - `stats`: text, default ""
     *   - `backSelected`: yesno, default false
     *   - `newSelected`: yesno, default false
     *   - `spaceSelected`: yesno, default false
     *   - `deleteSelected`: yesno, default false
     *   - `createSelected`: yesno, default false
     *   - `cancelSelected`: yesno, default false
     *   - `showStatus`: yesno, default false
     *   - `profiles`: list of cartoon-profile-row
     *   - `scores`: list of cartoon-score-row
     *   - `keyRows`: list of cartoon-key-row
     *   - `optionRows`: list of cartoon-option-row
     * Events: `pick (<item>)`, `new-profile`, `menu`, `press (<item>) (<item>)`, `space`, `delete-char`, `create-profile`, `profiles`, `press (<item>)`
     * Code areas: `settingsAvatar`
     * Refs: `heading`, `new-profile`, `menu`, `menu`, `space`, `delete-char`, `create-profile`, `profiles`
     */
    'cartoon-account': {
      props: { page: 'profiles' | 'scores' | 'new-profile' | 'settings'; title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; name: string | { loc: string } | LocText; status: string | { loc: string } | LocText; statsName: string | { loc: string } | LocText; stats: string | { loc: string } | LocText; backSelected: boolean; newSelected: boolean; spaceSelected: boolean; deleteSelected: boolean; createSelected: boolean; cancelSelected: boolean; showStatus: boolean; profiles: readonly { key: string; label?: string | { loc: string } | LocText; avatar?: string; selected?: boolean }[]; scores: readonly { key: string; name?: string | { loc: string } | LocText; score?: string | { loc: string } | LocText; round?: string | { loc: string } | LocText; record?: string | { loc: string } | LocText }[]; keyRows: readonly { key: string; keys?: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[] }[]; optionRows: readonly { key: string; label?: string | { loc: string } | LocText; value?: string | { loc: string } | LocText; selected?: boolean; adjustable?: boolean }[] };
      areas: 'settingsAvatar';
      refs: 'heading' | 'new-profile' | 'menu' | 'space' | 'delete-char' | 'create-profile' | 'profiles';
    };
    /**
     * Cartoon Action: a widget, button (ui/docs/cartoon-action.ui.json)
     *
     * Properties:
     *   - `label`: text, default "BACK"
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'cartoon-action': {
      props: { label: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon arrival: a view, screen (ui/docs/cartoon-arrival.ui.json)
     *
     * Properties:
     *   - `mode`: text, default "BUBBLE MADNESS"
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'cartoon-arrival': {
      props: { mode: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon button: a widget, button (ui/docs/cartoon-button.ui.json)
     *
     * Properties:
     *   - `label`: text, default "START GAME"
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'cartoon-button': {
      props: { label: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Cell: a widget, button (ui/docs/cartoon-cell.ui.json)
     *
     * Properties:
     *   - `image`: image, default "ui/sprites/star"
     *   - `label`: text, default ""
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'cartoon-cell': {
      props: { image: string; label: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon defeat: a view, screen (ui/docs/cartoon-defeat.ui.json)
     *
     * Properties:
     *   - `progressLabel`: text, default "WAVE 01 / 10 REACHED"
     *   - `score`: text, default "SCORE 0000000"
     *   - `hint`: text, default "ENTER / PAD A TO CONFIRM"
     *   - `context`: text, default "ONE MORE RUN. ONE MORE CHANCE."
     *   - `detailLabel`: text, default "TEAM DETAILS"
     *   - `portrait`: image, default "cartoon/frames/dragon/green/idle-0"
     *   - `details`: yesno, default false
     *   - `ready`: yesno, default false
     *   - `retrySelected`: yesno, default false
     *   - `leaveSelected`: yesno, default false
     *   - `detailsSelected`: yesno, default false
     *   - `progress`: number, default 0
     *   - `ranking`: list of cartoon-defeat-row
     * Events: `restart`, `leave`, `result-details`
     * Code areas: none
     * Refs: `restart`, `leave`, `result-details`
     * Samples (`view render doc:cartoon-defeat --sample …`): `settled`, `gated`, `details`
     */
    'cartoon-defeat': {
      props: { progressLabel: string | { loc: string } | LocText; score: string | { loc: string } | LocText; hint: string | { loc: string } | LocText; context: string | { loc: string } | LocText; detailLabel: string | { loc: string } | LocText; portrait: string; details: boolean; ready: boolean; retrySelected: boolean; leaveSelected: boolean; detailsSelected: boolean; progress: number; ranking: readonly { key: string; rank?: string | { loc: string } | LocText; name?: string | { loc: string } | LocText; kills?: string | { loc: string } | LocText }[] };
      areas: never;
      refs: 'restart' | 'leave' | 'result-details';
    };
    /**
     * Cartoon defeat action: a widget, button (ui/docs/cartoon-defeat-action.ui.json)
     *
     * Properties:
     *   - `label`: text, default "RETRY RUN"
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'cartoon-defeat-action': {
      props: { label: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon defeat row: a widget (ui/docs/cartoon-defeat-row.ui.json)
     *
     * Properties:
     *   - `rank`: text, default ""
     *   - `name`: text, default ""
     *   - `kills`: text, default ""
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'cartoon-defeat-row': {
      props: { rank: string | { loc: string } | LocText; name: string | { loc: string } | LocText; kills: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Dragon Card: a widget, button (ui/docs/cartoon-dragon-card.ui.json)
     *
     * Properties:
     *   - `modeLabel`: text, default "HUMAN / PAD 1"
     *   - `selected`: yesno, default false
     *   - `color`: enum green | blue | red | yellow | purple | orange | cyan | pink | ivory | slate, default "green"
     *   - `label`: text, default "BUB"
     *   - `portrait`: image, default "cartoon/frames/dragon/green/idle-0"
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'cartoon-dragon-card': {
      props: { modeLabel: string | { loc: string } | LocText; selected: boolean; color: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate'; label: string | { loc: string } | LocText; portrait: string };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Editor: a view, screen (ui/docs/cartoon-editor.ui.json)
     *
     * Properties:
     *   - `subtitle`: text, default ""
     *   - `status`: text, default ""
     *   - `tools`: list of cartoon-editor-action
     *   - `copyLabel`: text, default ""
     *   - `elementLabel`: text, default ""
     *   - `themeLabel`: text, default ""
     *   - `sel0`: yesno, default false
     *   - `sel1`: yesno, default false
     *   - `sel2`: yesno, default false
     *   - `sel3`: yesno, default false
     *   - `sel4`: yesno, default false
     *   - `sel16`: yesno, default false
     *   - `sel17`: yesno, default false
     *   - `sel18`: yesno, default false
     *   - `sel19`: yesno, default false
     *   - `sel20`: yesno, default false
     *   - `sel21`: yesno, default false
     *   - `enemyCount`: text, default ""
     * Events: `press (<item>)`, `template-prev`, `template`, `template-next`, `new`, `undo`, `save-level`, `load-level`, `test-level`, `menu`, `element`, `theme`
     * Code areas: none
     * Refs: `template-prev`, `template`, `template-next`, `new`, `undo`, `save-level`, `load-level`, `test-level`, `menu`, `element`, `theme`
     */
    'cartoon-editor': {
      props: { subtitle: string | { loc: string } | LocText; status: string | { loc: string } | LocText; tools: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; copyLabel: string | { loc: string } | LocText; elementLabel: string | { loc: string } | LocText; themeLabel: string | { loc: string } | LocText; sel0: boolean; sel1: boolean; sel2: boolean; sel3: boolean; sel4: boolean; sel16: boolean; sel17: boolean; sel18: boolean; sel19: boolean; sel20: boolean; sel21: boolean; enemyCount: string | { loc: string } | LocText };
      areas: never;
      refs: 'template-prev' | 'template' | 'template-next' | 'new' | 'undo' | 'save-level' | 'load-level' | 'test-level' | 'menu' | 'element' | 'theme';
    };
    /**
     * Cartoon Editor Action: a widget, button (ui/docs/cartoon-editor-action.ui.json)
     *
     * Properties:
     *   - `label`: text, default ""
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'cartoon-editor-action': {
      props: { label: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Grid Row: a widget (ui/docs/cartoon-grid-row.ui.json)
     *
     * Properties:
     *   - `cells`: list of cartoon-cell
     * Events: `<id>: press (<item>)`
     * Code areas: none
     * Refs: none
     */
    'cartoon-grid-row': {
      props: { cells: readonly { key: string; image?: string; label?: string | { loc: string } | LocText }[] };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Heading: a widget (ui/docs/cartoon-heading.ui.json)
     *
     * Properties:
     *   - `title`: text, default ""
     *   - `subtitle`: text, default ""
     *   - `brand`: text, default "THE BUBBLE BRIGADE"
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'cartoon-heading': {
      props: { title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; brand: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon hud: a view, screen (ui/docs/cartoon-hud.ui.json)
     *
     * Properties:
     *   - `name`: text, default ""
     *   - `score`: text, default ""
     *   - `round`: text, default ""
     *   - `high`: text, default ""
     *   - `highTitle`: text, default ""
     *   - `lives`: text, default ""
     *   - `enemies`: text, default ""
     *   - `banner`: text, default ""
     *   - `hint`: text, default ""
     *   - `detail`: text, default ""
     *   - `freeze`: text, default ""
     *   - `startCue`: text, default ""
     *   - `startHint`: text, default ""
     *   - `showBanner`: yesno, default false
     *   - `showStartCue`: yesno, default false
     *   - `party`: yesno, default false
     *   - `shade`: enum normal | pause | result, default "normal"
     *   - `rosterTop`: list of cartoon-roster-slot
     *   - `rosterBottom`: list of cartoon-roster-slot
     *   - `rosterTopPortraits`: list of cartoon-roster-portrait
     *   - `rosterBottomPortraits`: list of cartoon-roster-portrait
     *   - `classicPortrait`: image, default "cartoon/frames/dragon/green/idle-0"
     *   - `waveLabel`: text, default "WAVE 01"
     *   - `rosterTopFrames`: list of cartoon-roster-frame
     *   - `rosterBottomFrames`: list of cartoon-roster-frame
     *   - `rosterWideFrames`: list of cartoon-roster-frame
     *   - `rosterWidePortraits`: list of cartoon-roster-portrait
     *   - `rosterWide`: list of cartoon-roster-slot
     *   - `showStatus`: yesno, default false
     *   - `rosterTopBadges`: list of cartoon-roster-badge
     *   - `rosterBottomBadges`: list of cartoon-roster-badge
     *   - `rosterWideBadges`: list of cartoon-roster-badge
     *   - `cueStage`: enum off | ready-ink | ready-hold | ready-out | action-smear | action-hold | action-out, default "off"
     *   - `cueFade`: enum zero | eighth | quarter | three-eighths | half | five-eighths | three-quarters | seven-eighths | full, default "full"
     *   - `showReadyArt`: yesno, default false
     *   - `showActionArt`: yesno, default false
     * Events: none
     * Code areas: none
     * Refs: `header`, `score-card`, `wave-plaque`, `round-card`, `brand`, `footer`, `footer-architecture`, `footer-paper`, `footer-panel`, `roster-top`, `roster-bottom`, `roster-wide`, `banner`, `start-cue`, `cue-art`, `cue-action`
     * Samples (`view render doc:cartoon-hud --sample …`): `playing`, `ready`, `action`, `smear`
     */
    'cartoon-hud': {
      props: { name: string | { loc: string } | LocText; score: string | { loc: string } | LocText; round: string | { loc: string } | LocText; high: string | { loc: string } | LocText; highTitle: string | { loc: string } | LocText; lives: string | { loc: string } | LocText; enemies: string | { loc: string } | LocText; banner: string | { loc: string } | LocText; hint: string | { loc: string } | LocText; detail: string | { loc: string } | LocText; freeze: string | { loc: string } | LocText; startCue: string | { loc: string } | LocText; startHint: string | { loc: string } | LocText; showBanner: boolean; showStartCue: boolean; party: boolean; shade: 'normal' | 'pause' | 'result'; rosterTop: readonly { key: string; name?: string | { loc: string } | LocText; status?: string | { loc: string } | LocText; active?: boolean; down?: boolean; number?: string | { loc: string } | LocText; condition?: 'ready' | 'rescue' | 'returning' | 'out' | 'open' }[]; rosterBottom: readonly { key: string; name?: string | { loc: string } | LocText; status?: string | { loc: string } | LocText; active?: boolean; down?: boolean; number?: string | { loc: string } | LocText; condition?: 'ready' | 'rescue' | 'returning' | 'out' | 'open' }[]; rosterTopPortraits: readonly { key: string; portrait?: string; active?: boolean }[]; rosterBottomPortraits: readonly { key: string; portrait?: string; active?: boolean }[]; classicPortrait: string; waveLabel: string | { loc: string } | LocText; rosterTopFrames: readonly { key: string; active?: boolean; down?: boolean; color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate'; condition?: 'ready' | 'rescue' | 'returning' | 'out' | 'open' }[]; rosterBottomFrames: readonly { key: string; active?: boolean; down?: boolean; color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate'; condition?: 'ready' | 'rescue' | 'returning' | 'out' | 'open' }[]; rosterWideFrames: readonly { key: string; active?: boolean; down?: boolean; color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate'; condition?: 'ready' | 'rescue' | 'returning' | 'out' | 'open' }[]; rosterWidePortraits: readonly { key: string; portrait?: string; active?: boolean }[]; rosterWide: readonly { key: string; name?: string | { loc: string } | LocText; status?: string | { loc: string } | LocText; active?: boolean; down?: boolean; number?: string | { loc: string } | LocText; condition?: 'ready' | 'rescue' | 'returning' | 'out' | 'open' }[]; showStatus: boolean; rosterTopBadges: readonly { key: string; color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate' }[]; rosterBottomBadges: readonly { key: string; color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate' }[]; rosterWideBadges: readonly { key: string; color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate' }[]; cueStage: 'off' | 'ready-ink' | 'ready-hold' | 'ready-out' | 'action-smear' | 'action-hold' | 'action-out'; cueFade: 'zero' | 'eighth' | 'quarter' | 'three-eighths' | 'half' | 'five-eighths' | 'three-quarters' | 'seven-eighths' | 'full'; showReadyArt: boolean; showActionArt: boolean };
      areas: never;
      refs: 'header' | 'score-card' | 'wave-plaque' | 'round-card' | 'brand' | 'footer' | 'footer-architecture' | 'footer-paper' | 'footer-panel' | 'roster-top' | 'roster-bottom' | 'roster-wide' | 'banner' | 'start-cue' | 'cue-art' | 'cue-action';
    };
    /**
     * Cartoon Key Button: a widget, button (ui/docs/cartoon-key-button.ui.json)
     *
     * Properties:
     *   - `label`: text, default ""
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'cartoon-key-button': {
      props: { label: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Key Row: a widget (ui/docs/cartoon-key-row.ui.json)
     *
     * Properties:
     *   - `keys`: list of cartoon-key-button
     * Events: `<id>: press (<item>)`
     * Code areas: none
     * Refs: none
     */
    'cartoon-key-row': {
      props: { keys: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[] };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon menu: a view, screen (ui/docs/cartoon-menu.ui.json)
     *
     * Properties:
     *   - `startSelected`: yesno, default false
     *   - `settingsSelected`: yesno, default false
     *   - `quitSelected`: yesno, default false
     *   - `titleMode`: yesno, default false
     *   - `promptVisible`: yesno, default false
     *   - `showStatus`: yesno, default false
     *   - `status`: text, default ""
     *   - `thirdLabel`: text, default "QUIT"
     * Events: `choose-mode`, `settings`, `quit`, `menu`
     * Code areas: none
     * Refs: `title-card`, `choose-mode`, `settings`, `quit`, `menu`
     * Samples (`view render doc:cartoon-menu --sample …`): `title`, `menu`
     */
    'cartoon-menu': {
      props: { startSelected: boolean; settingsSelected: boolean; quitSelected: boolean; titleMode: boolean; promptVisible: boolean; showStatus: boolean; status: string | { loc: string } | LocText; thirdLabel: string | { loc: string } | LocText };
      areas: never;
      refs: 'title-card' | 'choose-mode' | 'settings' | 'quit' | 'menu';
    };
    /**
     * Cartoon Mode Card: a widget, button (ui/docs/cartoon-mode-card.ui.json)
     *
     * Properties:
     *   - `label`: text, default "CLASSIC"
     *   - `description`: text, default "25 ROUNDS / ARCADE CAMPAIGN"
     *   - `players`: text, default "1-2 DRAGONS"
     *   - `selected`: yesno, default false
     *   - `hero`: image, default "cartoon/frames/dragon/green/idle-0"
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'cartoon-mode-card': {
      props: { label: string | { loc: string } | LocText; description: string | { loc: string } | LocText; players: string | { loc: string } | LocText; selected: boolean; hero: string };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Modes: a view, screen (ui/docs/cartoon-modes.ui.json)
     *
     * Properties:
     *   - `classicSelected`: yesno, default false
     *   - `madnessSelected`: yesno, default false
     *   - `backSelected`: yesno, default false
     * Events: `mode-back`, `classic-mode`, `madness-mode`
     * Code areas: none
     * Refs: `mode-back`, `classic-mode`, `madness-mode`
     */
    'cartoon-modes': {
      props: { classicSelected: boolean; madnessSelected: boolean; backSelected: boolean };
      areas: never;
      refs: 'mode-back' | 'classic-mode' | 'madness-mode';
    };
    /**
     * Cartoon option row: a widget, button (ui/docs/cartoon-option-row.ui.json)
     *
     * Properties:
     *   - `label`: text, default ""
     *   - `value`: text, default ""
     *   - `selected`: yesno, default false
     *   - `adjustable`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'cartoon-option-row': {
      props: { label: string | { loc: string } | LocText; value: string | { loc: string } | LocText; selected: boolean; adjustable: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon outcome: a view, screen (ui/docs/cartoon-outcome.ui.json)
     *
     * Properties:
     *   - `art`: image, default "cartoon/ui/cues/brigade-down"
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'cartoon-outcome': {
      props: { art: string };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Party: a view, screen (ui/docs/cartoon-party.ui.json)
     *
     * Properties:
     *   - `status`: text, default ""
     *   - `heading`: text, default "CHOOSE YOUR DRAGONS"
     *   - `mode0`: text, default "AI TEAMMATE"
     *   - `sel0`: yesno, default false
     *   - `mode1`: text, default "AI TEAMMATE"
     *   - `sel1`: yesno, default false
     *   - `mode2`: text, default "AI TEAMMATE"
     *   - `sel2`: yesno, default false
     *   - `mode3`: text, default "AI TEAMMATE"
     *   - `sel3`: yesno, default false
     *   - `mode4`: text, default "AI TEAMMATE"
     *   - `sel4`: yesno, default false
     *   - `mode5`: text, default "AI TEAMMATE"
     *   - `sel5`: yesno, default false
     *   - `startSelected`: yesno, default false
     *   - `backSelected`: yesno, default false
     *   - `startLabel`: text, default "START SURVIVAL"
     *   - `mode6`: text, default "AI TEAMMATE"
     *   - `sel6`: yesno, default false
     *   - `mode7`: text, default "AI TEAMMATE"
     *   - `sel7`: yesno, default false
     *   - `mode8`: text, default "AI TEAMMATE"
     *   - `sel8`: yesno, default false
     *   - `mode9`: text, default "AI TEAMMATE"
     *   - `sel9`: yesno, default false
     * Events: `dragon-0`, `dragon-1`, `dragon-2`, `dragon-3`, `dragon-4`, `dragon-5`, `start-party`, `menu`, `dragon-6`, `dragon-7`, `dragon-8`, `dragon-9`
     * Code areas: none
     * Refs: `dragon-0`, `dragon-1`, `dragon-2`, `dragon-3`, `dragon-4`, `dragon-5`, `start-party`, `menu`, `dragon-6`, `dragon-7`, `dragon-8`, `dragon-9`
     */
    'cartoon-party': {
      props: { status: string | { loc: string } | LocText; heading: string | { loc: string } | LocText; mode0: string | { loc: string } | LocText; sel0: boolean; mode1: string | { loc: string } | LocText; sel1: boolean; mode2: string | { loc: string } | LocText; sel2: boolean; mode3: string | { loc: string } | LocText; sel3: boolean; mode4: string | { loc: string } | LocText; sel4: boolean; mode5: string | { loc: string } | LocText; sel5: boolean; startSelected: boolean; backSelected: boolean; startLabel: string | { loc: string } | LocText; mode6: string | { loc: string } | LocText; sel6: boolean; mode7: string | { loc: string } | LocText; sel7: boolean; mode8: string | { loc: string } | LocText; sel8: boolean; mode9: string | { loc: string } | LocText; sel9: boolean };
      areas: never;
      refs: 'dragon-0' | 'dragon-1' | 'dragon-2' | 'dragon-3' | 'dragon-4' | 'dragon-5' | 'start-party' | 'menu' | 'dragon-6' | 'dragon-7' | 'dragon-8' | 'dragon-9';
    };
    /**
     * Cartoon pause: a view, dialog (ui/docs/cartoon-pause.ui.json)
     *
     * Properties:
     *   - `title`: text, default "PAUSED"
     *   - `subtitle`: text, default "THE BUBBLE BRIGADE"
     *   - `actions`: list of cartoon-defeat-action
     * Events: `press (<item>)`
     * Code areas: none
     * Refs: none
     */
    'cartoon-pause': {
      props: { title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; actions: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[] };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Podium: a widget (ui/docs/cartoon-podium.ui.json)
     *
     * Properties:
     *   - `rank`: text, default ""
     *   - `name`: text, default ""
     *   - `mode`: text, default ""
     *   - `image`: image, default "ui/sprites/star"
     *   - `place`: enum gold | silver | bronze, default "gold"
     *   - `occupied`: yesno, default true
     *   - `killLabel`: text, default ""
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'cartoon-podium': {
      props: { rank: string | { loc: string } | LocText; name: string | { loc: string } | LocText; mode: string | { loc: string } | LocText; image: string; place: 'gold' | 'silver' | 'bronze'; occupied: boolean; killLabel: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Profile Row: a widget (ui/docs/cartoon-profile-row.ui.json)
     *
     * Properties:
     *   - `label`: text, default ""
     *   - `avatar`: image, default "ui/sprites/star"
     *   - `selected`: yesno, default false
     * Events: `<id>: pick`
     * Code areas: none
     * Refs: `pick`
     */
    'cartoon-profile-row': {
      props: { label: string | { loc: string } | LocText; avatar: string; selected: boolean };
      areas: never;
      refs: 'pick';
    };
    /**
     * Cartoon Result Row: a widget (ui/docs/cartoon-result-row.ui.json)
     *
     * Properties:
     *   - `rank`: text, default ""
     *   - `name`: text, default ""
     *   - `mode`: text, default ""
     *   - `kills`: text, default ""
     *   - `leader`: yesno, default false
     *   - `color`: enum green | blue | red | yellow | purple | orange | cyan | pink | ivory | slate, default "green"
     *   - `image`: image, default "ui/sprites/star"
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'cartoon-result-row': {
      props: { rank: string | { loc: string } | LocText; name: string | { loc: string } | LocText; mode: string | { loc: string } | LocText; kills: string | { loc: string } | LocText; leader: boolean; color: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate'; image: string };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Results: a view, screen (ui/docs/cartoon-results.ui.json)
     *
     * Properties:
     *   - `eyebrow`: text, default ""
     *   - `title`: text, default ""
     *   - `subtitle`: text, default ""
     *   - `score`: text, default ""
     *   - `champion`: text, default ""
     *   - `stats`: text, default ""
     *   - `hint`: text, default ""
     *   - `won`: yesno, default false
     *   - `party`: yesno, default false
     *   - `ready`: yesno, default false
     *   - `showStats`: yesno, default false
     *   - `ranking`: list of cartoon-result-row
     *   - `buttons`: list of cartoon-action
     *   - `podium`: list of cartoon-podium
     *   - `moreRanks`: yesno, default false
     * Events: `press (<item>)`
     * Code areas: `confetti`
     * Refs: `result-score`, `result-stats`
     */
    'cartoon-results': {
      props: { eyebrow: string | { loc: string } | LocText; title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; score: string | { loc: string } | LocText; champion: string | { loc: string } | LocText; stats: string | { loc: string } | LocText; hint: string | { loc: string } | LocText; won: boolean; party: boolean; ready: boolean; showStats: boolean; ranking: readonly { key: string; rank?: string | { loc: string } | LocText; name?: string | { loc: string } | LocText; mode?: string | { loc: string } | LocText; kills?: string | { loc: string } | LocText; leader?: boolean; color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate'; image?: string }[]; buttons: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; podium: readonly { key: string; rank?: string | { loc: string } | LocText; name?: string | { loc: string } | LocText; mode?: string | { loc: string } | LocText; image?: string; place?: 'gold' | 'silver' | 'bronze'; occupied?: boolean; killLabel?: string | { loc: string } | LocText }[]; moreRanks: boolean };
      areas: 'confetti';
      refs: 'result-score' | 'result-stats';
    };
    /**
     * Cartoon roster badge: a widget (ui/docs/cartoon-roster-badge.ui.json)
     *
     * Properties:
     *   - `color`: enum green | blue | red | yellow | purple | orange | cyan | pink | ivory | slate, default "green"
     * Events: none
     * Code areas: none
     * Refs: `identity-diamond`
     */
    'cartoon-roster-badge': {
      props: { color: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate' };
      areas: never;
      refs: 'identity-diamond';
    };
    /**
     * Cartoon roster frame: a widget (ui/docs/cartoon-roster-frame.ui.json)
     *
     * Properties:
     *   - `active`: yesno, default true
     *   - `down`: yesno, default false
     *   - `color`: enum green | blue | red | yellow | purple | orange | cyan | pink | ivory | slate, default "green"
     *   - `condition`: enum ready | rescue | returning | out | open, default "ready"
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'cartoon-roster-frame': {
      props: { active: boolean; down: boolean; color: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate'; condition: 'ready' | 'rescue' | 'returning' | 'out' | 'open' };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon roster portrait: a widget (ui/docs/cartoon-roster-portrait.ui.json)
     *
     * Properties:
     *   - `portrait`: image, default "cartoon/frames/dragon/green/idle-0"
     *   - `active`: yesno, default true
     * Events: none
     * Code areas: none
     * Refs: `portrait-crop`
     */
    'cartoon-roster-portrait': {
      props: { portrait: string; active: boolean };
      areas: never;
      refs: 'portrait-crop';
    };
    /**
     * Cartoon roster slot: a widget (ui/docs/cartoon-roster-slot.ui.json)
     *
     * Properties:
     *   - `name`: text, default ""
     *   - `status`: text, default ""
     *   - `active`: yesno, default true
     *   - `down`: yesno, default false
     *   - `number`: text, default "1"
     *   - `condition`: enum ready | rescue | returning | out | open, default "ready"
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'cartoon-roster-slot': {
      props: { name: string | { loc: string } | LocText; status: string | { loc: string } | LocText; active: boolean; down: boolean; number: string | { loc: string } | LocText; condition: 'ready' | 'rescue' | 'returning' | 'out' | 'open' };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Score Row: a widget (ui/docs/cartoon-score-row.ui.json)
     *
     * Properties:
     *   - `name`: text, default ""
     *   - `score`: text, default ""
     *   - `round`: text, default ""
     *   - `record`: text, default ""
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'cartoon-score-row': {
      props: { name: string | { loc: string } | LocText; score: string | { loc: string } | LocText; round: string | { loc: string } | LocText; record: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon Shell: a view, screen (ui/docs/cartoon-shell.ui.json)
     *
     * Properties:
     *   - `title`: text, default "BUBBLE BOBBLE"
     *   - `subtitle`: text, default ""
     *   - `body`: text, default ""
     *   - `status`: text, default ""
     *   - `buttons`: list of cartoon-action
     *   - `rows`: list of cartoon-grid-row
     *   - `logo`: yesno, default false
     *   - `keys`: list of cartoon-key-button
     *   - `page`: enum title | menu | profiles | new-profile | settings | scores | help | credits | play | pause | result | editor, default "title"
     *   - `resultScore`: text, default ""
     *   - `resultStats`: text, default ""
     *   - `showResultStats`: yesno, default false
     *   - `celebration`: trigger (a counter: each change fires it)
     *   - `resultReady`: yesno, default true
     *   - `resultHint`: text, default ""
     * Events: `press (<item>)`, `press (<item>) (<item>)`
     * Code areas: `confetti`
     * Refs: `pause-panel`, `title`, `result-score`, `result-stats`
     */
    'cartoon-shell': {
      props: { title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; body: string | { loc: string } | LocText; status: string | { loc: string } | LocText; buttons: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; rows: readonly { key: string; cells?: readonly { key: string; image?: string; label?: string | { loc: string } | LocText }[] }[]; logo: boolean; keys: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; page: 'title' | 'menu' | 'profiles' | 'new-profile' | 'settings' | 'scores' | 'help' | 'credits' | 'play' | 'pause' | 'result' | 'editor'; resultScore: string | { loc: string } | LocText; resultStats: string | { loc: string } | LocText; showResultStats: boolean; celebration: number; resultReady: boolean; resultHint: string | { loc: string } | LocText };
      areas: 'confetti';
      refs: 'pause-panel' | 'title' | 'result-score' | 'result-stats';
    };
    /**
     * Cartoon Small Action: a widget, button (ui/docs/cartoon-small-action.ui.json)
     *
     * Properties:
     *   - `label`: text, default ""
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'cartoon-small-action': {
      props: { label: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Cartoon transition: a view, screen (ui/docs/cartoon-transition.ui.json)
     *
     * Properties: none
     * Events: none
     * Code areas: `aperture`
     * Refs: none
     */
    'cartoon-transition': {
      props: {};
      areas: 'aperture';
      refs: never;
    };
    /**
     * Desktop account: a view, screen (ui/docs/desktop-account.ui.json)
     *
     * Properties:
     *   - `page`: enum profiles | scores | new-profile | settings, default "profiles"
     *   - `title`: text, default ""
     *   - `subtitle`: text, default ""
     *   - `name`: text, default ""
     *   - `status`: text, default ""
     *   - `statsName`: text, default ""
     *   - `stats`: text, default ""
     *   - `avatarName`: text, default ""
     *   - `backSelected`: yesno, default false
     *   - `newSelected`: yesno, default false
     *   - `spaceSelected`: yesno, default false
     *   - `deleteSelected`: yesno, default false
     *   - `createSelected`: yesno, default false
     *   - `cancelSelected`: yesno, default false
     *   - `showStatus`: yesno, default false
     *   - `profiles`: list of desktop-profile-row
     *   - `scores`: list of desktop-score-row
     *   - `keyRows`: list of desktop-key-row
     *   - `settings`: list of desktop-button
     * Events: `pick (<item>)`, `new-profile`, `menu`, `press (<item>) (<item>)`, `space`, `delete-char`, `create-profile`, `profiles`, `press (<item>)`
     * Code areas: `settingsAvatar`
     * Refs: `heading`, `new-profile`, `menu`, `menu`, `space`, `delete-char`, `create-profile`, `profiles`
     */
    'desktop-account': {
      props: { page: 'profiles' | 'scores' | 'new-profile' | 'settings'; title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; name: string | { loc: string } | LocText; status: string | { loc: string } | LocText; statsName: string | { loc: string } | LocText; stats: string | { loc: string } | LocText; avatarName: string | { loc: string } | LocText; backSelected: boolean; newSelected: boolean; spaceSelected: boolean; deleteSelected: boolean; createSelected: boolean; cancelSelected: boolean; showStatus: boolean; profiles: readonly { key: string; label?: string | { loc: string } | LocText; avatar?: string; selected?: boolean }[]; scores: readonly { key: string; name?: string | { loc: string } | LocText; score?: string | { loc: string } | LocText; round?: string | { loc: string } | LocText; record?: string | { loc: string } | LocText }[]; keyRows: readonly { key: string; keys?: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[] }[]; settings: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[] };
      areas: 'settingsAvatar';
      refs: 'heading' | 'new-profile' | 'menu' | 'space' | 'delete-char' | 'create-profile' | 'profiles';
    };
    /**
     * Desktop button: a widget, button (ui/docs/desktop-button.ui.json)
     *
     * Properties:
     *   - `label`: text, default "BACK"
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'desktop-button': {
      props: { label: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Desktop cell: a widget, button (ui/docs/desktop-cell.ui.json)
     *
     * Properties:
     *   - `image`: image, default "ui/sprites/star"
     *   - `label`: text, default ""
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'desktop-cell': {
      props: { image: string; label: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Desktop editor: a view, screen (ui/docs/desktop-editor.ui.json)
     *
     * Properties:
     *   - `subtitle`: text, default ""
     *   - `status`: text, default ""
     *   - `rows`: list of desktop-grid-row
     *   - `toolbar`: list of desktop-small-button
     *   - `tools`: list of desktop-editor-button
     *   - `buttons`: list of desktop-small-button
     *   - `footer`: list of desktop-editor-button
     *   - `copyLabel`: text, default ""
     *   - `elementLabel`: text, default ""
     *   - `themeLabel`: text, default ""
     *   - `sel0`: yesno, default false
     *   - `sel1`: yesno, default false
     *   - `sel2`: yesno, default false
     *   - `sel3`: yesno, default false
     *   - `sel4`: yesno, default false
     *   - `sel16`: yesno, default false
     *   - `sel17`: yesno, default false
     *   - `sel18`: yesno, default false
     *   - `sel19`: yesno, default false
     *   - `sel20`: yesno, default false
     *   - `sel21`: yesno, default false
     *   - `enemyCount`: text, default ""
     *   - `brand`: text, default "BUBBLE MADNESS"
     * Events: `press (<item>)`, `template-prev`, `template`, `template-next`, `new`, `undo`, `save-level`, `load-level`, `test-level`, `menu`, `element`, `theme`
     * Code areas: none
     * Refs: `template-prev`, `template`, `template-next`, `new`, `undo`, `save-level`, `load-level`, `test-level`, `menu`, `element`, `theme`
     */
    'desktop-editor': {
      props: { subtitle: string | { loc: string } | LocText; status: string | { loc: string } | LocText; rows: readonly { key: string; cells?: readonly { key: string; image?: string; label?: string | { loc: string } | LocText }[] }[]; toolbar: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; tools: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; buttons: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; footer: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; copyLabel: string | { loc: string } | LocText; elementLabel: string | { loc: string } | LocText; themeLabel: string | { loc: string } | LocText; sel0: boolean; sel1: boolean; sel2: boolean; sel3: boolean; sel4: boolean; sel16: boolean; sel17: boolean; sel18: boolean; sel19: boolean; sel20: boolean; sel21: boolean; enemyCount: string | { loc: string } | LocText; brand: string | { loc: string } | LocText };
      areas: never;
      refs: 'template-prev' | 'template' | 'template-next' | 'new' | 'undo' | 'save-level' | 'load-level' | 'test-level' | 'menu' | 'element' | 'theme';
    };
    /**
     * Desktop editor button: a widget, button (ui/docs/desktop-editor-button.ui.json)
     *
     * Properties:
     *   - `label`: text, default ""
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'desktop-editor-button': {
      props: { label: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Desktop grid row: a widget (ui/docs/desktop-grid-row.ui.json)
     *
     * Properties:
     *   - `cells`: list of desktop-cell
     * Events: `<id>: press (<item>)`
     * Code areas: none
     * Refs: none
     */
    'desktop-grid-row': {
      props: { cells: readonly { key: string; image?: string; label?: string | { loc: string } | LocText }[] };
      areas: never;
      refs: never;
    };
    /**
     * Desktop heading: a widget (ui/docs/desktop-heading.ui.json)
     *
     * Properties:
     *   - `title`: text, default ""
     *   - `subtitle`: text, default ""
     *   - `brand`: text, default "BUBBLE MADNESS"
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'desktop-heading': {
      props: { title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; brand: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Desktop hud: a view, screen (ui/docs/desktop-hud.ui.json)
     *
     * Properties:
     *   - `name`: text, default ""
     *   - `score`: text, default ""
     *   - `round`: text, default ""
     *   - `high`: text, default ""
     *   - `lives`: text, default ""
     *   - `enemies`: text, default ""
     *   - `banner`: text, default ""
     *   - `hint`: text, default ""
     *   - `showBanner`: yesno, default false
     *   - `clear`: yesno, default false
     *   - `freeze`: text, default ""
     *   - `shade`: enum normal | pause | result, default "normal"
     *   - `party`: yesno, default false
     *   - `highTitle`: text, default "HIGH SCORE"
     *   - `detail`: text, default ""
     *   - `startCue`: text, default ""
     *   - `startHint`: text, default ""
     *   - `showStartCue`: yesno, default false
     *   - `startGo`: yesno, default false
     *   - `celebrationColor`: enum none | green | blue | red | yellow | purple | orange | cyan | pink | ivory | slate, default "none"
     * Events: none
     * Code areas: none
     * Refs: `banner`, `banner-title`, `banner-hint`, `party-detail`, `start-cue`
     */
    'desktop-hud': {
      props: { name: string | { loc: string } | LocText; score: string | { loc: string } | LocText; round: string | { loc: string } | LocText; high: string | { loc: string } | LocText; lives: string | { loc: string } | LocText; enemies: string | { loc: string } | LocText; banner: string | { loc: string } | LocText; hint: string | { loc: string } | LocText; showBanner: boolean; clear: boolean; freeze: string | { loc: string } | LocText; shade: 'normal' | 'pause' | 'result'; party: boolean; highTitle: string | { loc: string } | LocText; detail: string | { loc: string } | LocText; startCue: string | { loc: string } | LocText; startHint: string | { loc: string } | LocText; showStartCue: boolean; startGo: boolean; celebrationColor: 'none' | 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate' };
      areas: never;
      refs: 'banner' | 'banner-title' | 'banner-hint' | 'party-detail' | 'start-cue';
    };
    /**
     * Desktop key button: a widget, button (ui/docs/desktop-key-button.ui.json)
     *
     * Properties:
     *   - `label`: text, default ""
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'desktop-key-button': {
      props: { label: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Desktop key row: a widget (ui/docs/desktop-key-row.ui.json)
     *
     * Properties:
     *   - `keys`: list of desktop-key-button
     * Events: `<id>: press (<item>)`
     * Code areas: none
     * Refs: none
     */
    'desktop-key-row': {
      props: { keys: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[] };
      areas: never;
      refs: never;
    };
    /**
     * Desktop menu: a view, screen (ui/docs/desktop-menu.ui.json)
     *
     * Properties:
     *   - `startSelected`: yesno, default false
     *   - `settingsSelected`: yesno, default false
     *   - `quitSelected`: yesno, default false
     *   - `titleMode`: yesno, default false
     *   - `promptVisible`: yesno, default true
     *   - `status`: text, default ""
     *   - `showStatus`: yesno, default false
     * Events: `settings`, `quit`, `choose-mode`
     * Code areas: `bubbles`, `dragons`
     * Refs: `settings`, `quit`, `choose-mode`
     */
    'desktop-menu': {
      props: { startSelected: boolean; settingsSelected: boolean; quitSelected: boolean; titleMode: boolean; promptVisible: boolean; status: string | { loc: string } | LocText; showStatus: boolean };
      areas: 'bubbles' | 'dragons';
      refs: 'settings' | 'quit' | 'choose-mode';
    };
    /**
     * Desktop profile row: a widget (ui/docs/desktop-profile-row.ui.json)
     *
     * Properties:
     *   - `label`: text, default ""
     *   - `avatar`: image, default "ui/sprites/star"
     *   - `selected`: yesno, default false
     * Events: `<id>: pick`
     * Code areas: none
     * Refs: `pick`
     */
    'desktop-profile-row': {
      props: { label: string | { loc: string } | LocText; avatar: string; selected: boolean };
      areas: never;
      refs: 'pick';
    };
    /**
     * Desktop score row: a widget (ui/docs/desktop-score-row.ui.json)
     *
     * Properties:
     *   - `name`: text, default ""
     *   - `score`: text, default ""
     *   - `round`: text, default ""
     *   - `record`: text, default ""
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'desktop-score-row': {
      props: { name: string | { loc: string } | LocText; score: string | { loc: string } | LocText; round: string | { loc: string } | LocText; record: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Desktop shell: a view, screen (ui/docs/desktop-shell.ui.json)
     *
     * Properties:
     *   - `title`: text, default "BUBBLE BOBBLE"
     *   - `subtitle`: text, default ""
     *   - `body`: text, default ""
     *   - `status`: text, default ""
     *   - `buttons`: list of desktop-button
     *   - `rows`: list of desktop-grid-row
     *   - `logo`: yesno, default false
     *   - `keys`: list of desktop-key-button
     *   - `page`: enum title | menu | profiles | new-profile | settings | scores | help | credits | play | pause | result | editor, default "title"
     *   - `resultScore`: text, default ""
     *   - `resultStats`: text, default ""
     *   - `showResultStats`: yesno, default false
     *   - `brand`: text, default "BUBBLE MADNESS"
     *   - `celebration`: trigger (a counter: each change fires it)
     *   - `resultReady`: yesno, default true
     *   - `resultHint`: text, default ""
     * Events: `press (<item>)`, `press (<item>) (<item>)`
     * Code areas: `confetti`
     * Refs: `pause-panel`, `title`, `result-score`, `result-stats`
     */
    'desktop-shell': {
      props: { title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; body: string | { loc: string } | LocText; status: string | { loc: string } | LocText; buttons: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; rows: readonly { key: string; cells?: readonly { key: string; image?: string; label?: string | { loc: string } | LocText }[] }[]; logo: boolean; keys: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; page: 'title' | 'menu' | 'profiles' | 'new-profile' | 'settings' | 'scores' | 'help' | 'credits' | 'play' | 'pause' | 'result' | 'editor'; resultScore: string | { loc: string } | LocText; resultStats: string | { loc: string } | LocText; showResultStats: boolean; brand: string | { loc: string } | LocText; celebration: number; resultReady: boolean; resultHint: string | { loc: string } | LocText };
      areas: 'confetti';
      refs: 'pause-panel' | 'title' | 'result-score' | 'result-stats';
    };
    /**
     * Desktop small button: a widget, button (ui/docs/desktop-small-button.ui.json)
     *
     * Properties:
     *   - `label`: text, default ""
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'desktop-small-button': {
      props: { label: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Dragon podium place: a widget (ui/docs/dragon-podium-place.ui.json)
     *
     * Properties:
     *   - `rank`: text, default ""
     *   - `name`: text, default ""
     *   - `mode`: text, default ""
     *   - `image`: image, default "ui/sprites/star"
     *   - `place`: enum gold | silver | bronze, default "gold"
     *   - `occupied`: yesno, default true
     *   - `killLabel`: text, default ""
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'dragon-podium-place': {
      props: { rank: string | { loc: string } | LocText; name: string | { loc: string } | LocText; mode: string | { loc: string } | LocText; image: string; place: 'gold' | 'silver' | 'bronze'; occupied: boolean; killLabel: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Dragon result row: a widget (ui/docs/dragon-result-row.ui.json)
     *
     * Properties:
     *   - `rank`: text, default ""
     *   - `name`: text, default ""
     *   - `mode`: text, default ""
     *   - `kills`: text, default ""
     *   - `leader`: yesno, default false
     *   - `color`: enum green | blue | red | yellow | purple | orange | cyan | pink | ivory | slate, default "green"
     *   - `image`: image, default "ui/sprites/star"
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'dragon-result-row': {
      props: { rank: string | { loc: string } | LocText; name: string | { loc: string } | LocText; mode: string | { loc: string } | LocText; kills: string | { loc: string } | LocText; leader: boolean; color: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate'; image: string };
      areas: never;
      refs: never;
    };
    /**
     * Game mode card: a widget, button (ui/docs/game-mode-card.ui.json)
     *
     * Properties:
     *   - `label`: text, default "CLASSIC"
     *   - `description`: text, default "25 ROUNDS / ARCADE CAMPAIGN"
     *   - `players`: text, default "1-2 DRAGONS"
     *   - `selected`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'game-mode-card': {
      props: { label: string | { loc: string } | LocText; description: string | { loc: string } | LocText; players: string | { loc: string } | LocText; selected: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Game mode select: a view, screen (ui/docs/mode-select.ui.json)
     *
     * Properties:
     *   - `classicSelected`: yesno, default false
     *   - `madnessSelected`: yesno, default false
     *   - `backSelected`: yesno, default false
     * Events: `classic-mode`, `madness-mode`, `mode-back`
     * Code areas: none
     * Refs: `classic-mode`, `madness-mode`, `mode-back`
     */
    'mode-select': {
      props: { classicSelected: boolean; madnessSelected: boolean; backSelected: boolean };
      areas: never;
      refs: 'classic-mode' | 'madness-mode' | 'mode-back';
    };
    /**
     * Party dragon card: a widget, button (ui/docs/party-dragon-card.ui.json)
     *
     * Properties:
     *   - `modeLabel`: text, default "HUMAN / PAD 1"
     *   - `selected`: yesno, default false
     *   - `color`: enum green | blue | red | yellow | purple | orange | cyan | pink | ivory | slate, default "green"
     *   - `label`: text, default "BUB"
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'party-dragon-card': {
      props: { modeLabel: string | { loc: string } | LocText; selected: boolean; color: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate'; label: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Wave survival team: a view, screen (ui/docs/party-lobby.ui.json)
     *
     * Properties:
     *   - `status`: text, default ""
     *   - `heading`: text, default "CHOOSE YOUR DRAGONS"
     *   - `mode0`: text, default "AI TEAMMATE"
     *   - `sel0`: yesno, default false
     *   - `mode1`: text, default "AI TEAMMATE"
     *   - `sel1`: yesno, default false
     *   - `mode2`: text, default "AI TEAMMATE"
     *   - `sel2`: yesno, default false
     *   - `mode3`: text, default "AI TEAMMATE"
     *   - `sel3`: yesno, default false
     *   - `mode4`: text, default "AI TEAMMATE"
     *   - `sel4`: yesno, default false
     *   - `mode5`: text, default "AI TEAMMATE"
     *   - `sel5`: yesno, default false
     *   - `startSelected`: yesno, default false
     *   - `backSelected`: yesno, default false
     *   - `startLabel`: text, default "START SURVIVAL"
     *   - `mode6`: text, default "AI TEAMMATE"
     *   - `sel6`: yesno, default false
     *   - `mode7`: text, default "AI TEAMMATE"
     *   - `sel7`: yesno, default false
     *   - `mode8`: text, default "AI TEAMMATE"
     *   - `sel8`: yesno, default false
     *   - `mode9`: text, default "AI TEAMMATE"
     *   - `sel9`: yesno, default false
     * Events: `dragon-0`, `dragon-1`, `dragon-2`, `dragon-3`, `dragon-4`, `dragon-5`, `start-party`, `menu`, `dragon-6`, `dragon-7`, `dragon-8`, `dragon-9`
     * Code areas: none
     * Refs: `dragon-0`, `dragon-1`, `dragon-2`, `dragon-3`, `dragon-4`, `dragon-5`, `start-party`, `menu`, `dragon-6`, `dragon-7`, `dragon-8`, `dragon-9`
     * Samples (`view render doc:party-lobby --sample …`): `tenDragons`
     */
    'party-lobby': {
      props: { status: string | { loc: string } | LocText; heading: string | { loc: string } | LocText; mode0: string | { loc: string } | LocText; sel0: boolean; mode1: string | { loc: string } | LocText; sel1: boolean; mode2: string | { loc: string } | LocText; sel2: boolean; mode3: string | { loc: string } | LocText; sel3: boolean; mode4: string | { loc: string } | LocText; sel4: boolean; mode5: string | { loc: string } | LocText; sel5: boolean; startSelected: boolean; backSelected: boolean; startLabel: string | { loc: string } | LocText; mode6: string | { loc: string } | LocText; sel6: boolean; mode7: string | { loc: string } | LocText; sel7: boolean; mode8: string | { loc: string } | LocText; sel8: boolean; mode9: string | { loc: string } | LocText; sel9: boolean };
      areas: never;
      refs: 'dragon-0' | 'dragon-1' | 'dragon-2' | 'dragon-3' | 'dragon-4' | 'dragon-5' | 'start-party' | 'menu' | 'dragon-6' | 'dragon-7' | 'dragon-8' | 'dragon-9';
    };
    /**
     * Run results: a view, screen (ui/docs/run-results.ui.json)
     *
     * Properties:
     *   - `eyebrow`: text, default ""
     *   - `title`: text, default ""
     *   - `subtitle`: text, default ""
     *   - `score`: text, default ""
     *   - `champion`: text, default ""
     *   - `stats`: text, default ""
     *   - `hint`: text, default ""
     *   - `won`: yesno, default false
     *   - `party`: yesno, default false
     *   - `ready`: yesno, default false
     *   - `showStats`: yesno, default false
     *   - `ranking`: list of dragon-result-row
     *   - `buttons`: list of desktop-button
     *   - `podium`: list of dragon-podium-place
     *   - `moreRanks`: yesno, default false
     * Events: `press (<item>)`
     * Code areas: `confetti`
     * Refs: `result-score`, `result-stats`
     */
    'run-results': {
      props: { eyebrow: string | { loc: string } | LocText; title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; score: string | { loc: string } | LocText; champion: string | { loc: string } | LocText; stats: string | { loc: string } | LocText; hint: string | { loc: string } | LocText; won: boolean; party: boolean; ready: boolean; showStats: boolean; ranking: readonly { key: string; rank?: string | { loc: string } | LocText; name?: string | { loc: string } | LocText; mode?: string | { loc: string } | LocText; kills?: string | { loc: string } | LocText; leader?: boolean; color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink' | 'ivory' | 'slate'; image?: string }[]; buttons: readonly { key: string; label?: string | { loc: string } | LocText; selected?: boolean }[]; podium: readonly { key: string; rank?: string | { loc: string } | LocText; name?: string | { loc: string } | LocText; mode?: string | { loc: string } | LocText; image?: string; place?: 'gold' | 'silver' | 'bronze'; occupied?: boolean; killLabel?: string | { loc: string } | LocText }[]; moreRanks: boolean };
      areas: 'confetti';
      refs: 'result-score' | 'result-stats';
    };
  }
}

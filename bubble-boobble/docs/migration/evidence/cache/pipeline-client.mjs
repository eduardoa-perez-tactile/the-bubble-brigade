// ../../../../../../Applications/Tactile Game Engine.app/Contents/Resources/engine/packages/protocol-client/src/gen/protocol.gen.ts
function createApi(call) {
  return {
    anim: {
      /** Editor clip preview: renders the entity posed in a state at a time without running the sim (the world is untouched). */
      preview: (params) => call("anim.preview", params)
    },
    anim3d: {
      /** Animation 3D mode's live preview, in the editor's preview engine only (--mode=editor-preview: no game code, scene or UI): a keyed 3D clip on its rig's model, drawn in its viewports from an orbit camera, posed at a time or playing; framed over the whole clip and the model's bounds. Fields left out keep their values. */
      stage: (params) => call("anim3d.stage", params)
    },
    assets: {
      /** Pushes an asset bundle (probe/dev). */
      pushBundle: (params) => call("assets.pushBundle", params),
      /** Reloads one asset (or all) from source. */
      reload: (params) => call("assets.reload", params),
      /** Asset loading status. */
      status: (params) => call("assets.status", params)
    },
    audio: {
      /** Sets a mixer bus volume and filters (editor mute/solo, agent checks). Game code uses the SetBusVolume event instead. */
      setBus: (params) => call("audio.setBus", params),
      /** Audio engine state: device or offline, live voices, loaded sounds, effective bus volumes, current music track, sound banks. */
      status: (params) => call("audio.status", params)
    },
    camera: {
      /** The camera pose that keeps the entities' bounds whole, with a small margin, on every given target size. */
      frame: (params) => call("camera.frame", params),
      /** The world's cameras with their kind, which one is the primary 3D camera and which follows WorldView, which authored fields WorldView, CameraFollow or a VirtualCamera override, and the values each renders with (camera skill). No renderer needed. */
      list: (params) => call("camera.list", params),
      /** Where entities land on a width×height target through a camera, and whether each is whole, clipped or off: an entity's bounds are its meshes', sprites' and shapes' (children included), else its position. */
      visible: (params) => call("camera.visible", params)
    },
    cheat: {
      /** The game's cheats in console order (groups sorted, cheats in declaration order). */
      list: (params) => call("cheat.list", params),
      /** Runs a cheat the way the console does. E_PARAMS for an unknown cheat or a bad argument. */
      run: (params) => call("cheat.run", params)
    },
    cmd: {
      /** Starts a transaction: following commands form one undo step. */
      begin: (params) => call("cmd.begin", params),
      /** All commands and queries with JSON Schemas. */
      catalog: (params) => call("cmd.catalog", params),
      /** Commits the open transaction. */
      commit: (params) => call("cmd.commit", params),
      /** Runs one command through the bus (validated, journaled, undoable). */
      execute: (params) => call("cmd.execute", params),
      /** Runs one read-only query (never journaled). */
      query: (params) => call("cmd.query", params),
      /** Redoes the last undone step. */
      redo: (params) => call("cmd.redo", params),
      /** Undoes and discards the open transaction. */
      rollback: (params) => call("cmd.rollback", params),
      /** Undoes the last step. */
      undo: (params) => call("cmd.undo", params)
    },
    editor: {
      /** Align View to Selected (Alt/Opt+Shift+F): the scene camera looks through the selected Camera or VirtualCamera as the game draws it (orthographic ones orthographically), or from the selected object's pose; the 2D view centres on it. */
      alignViewToSelected: (params) => call("editor.alignViewToSelected", params),
      /** Align With View (Ctrl/⌘+Shift+F): moves the selected objects to the scene camera's position and rotation through their LocalTransform (composed with their parents; 2D: to the view's centre). Refuses a flat 2D camera, whose view WorldView drives. */
      alignWithView: (params) => call("editor.alignWithView", params),
      /** Moves or resets the scene-view camera (independent of the game camera): 2D pans and zooms; 3D orbits (Alt+left drag), looks and flies (right drag, WASD/QE), pans (middle drag) and dollies (Alt+right drag, wheel). */
      camera: (params) => call("editor.camera", params),
      /** Where a point of the scene view lands in the world (dropping, creating and pasting there). */
      screenToWorld: (params) => call("editor.screenToWorld", params),
      /** Selects entities in the scene view (the gizmo moves all of them, about the primary). */
      select: (params) => call("editor.select", params),
      /** Sets the gizmo tool (W/E/R/T in the viewport; rect is 2D), space and pivot, snapping (step in world units, angle in degrees; Ctrl/⌘ while dragging snaps too), the grid and the 2D/3D toggle. */
      setTool: (params) => call("editor.setTool", params),
      /** Selection, tool, space, pivot, snapping, camera, view options, hidden entities and layers of the scene view; `selectedCamera` names the selected Camera or VirtualCamera (guid, kind, virtual) and where its preview inset sits (`rect`: view fractions, top-left origin; null with gizmos off). */
      state: (params) => call("editor.state", params),
      /** What the scene view draws (never saved in the scene): draw mode, effects, gizmos, and layers hidden or locked. */
      viewOptions: (params) => call("editor.viewOptions", params),
      /** Hides or isolates entities in the scene view only: the scene file and the game are unchanged. */
      visibility: (params) => call("editor.visibility", params)
    },
    engine: {
      /** Authenticates the connection. Must be the first call. */
      hello: (params) => call("engine.hello", params),
      /** Build id, GPU backend and tier, JS engine, mode and run state. */
      info: (params) => call("engine.info", params),
      /** Starts over in a fresh world and script context from the scene (and bundle) given, at step 0: how a warm editor-game host takes the next Play (design.md § 9.6). */
      loadWorld: (params) => call("engine.loadWorld", params),
      /** What frames show: full, sim (no viewport or stream frames), ui (the game UI alone), sprite or particles (one entity alone, framed; particles loop), physics (collider outlines). The sim is never changed. */
      mode: (params) => call("engine.mode", params),
      /** Pauses the fixed-step simulation (rendering continues). */
      pause: (params) => call("engine.pause", params),
      /** Stops the engine process. */
      quit: (params) => call("engine.quit", params),
      /** Resumes the simulation. */
      resume: (params) => call("engine.resume", params),
      /** Scales wall time fed to the fixed-step accumulator (non-sim; dt is unchanged). */
      setTimeScale: (params) => call("engine.setTimeScale", params),
      /** Runs n fixed steps immediately (paused or headless sessions). */
      step: (params) => call("engine.step", params)
    },
    input: {
      /** Queues input for the next step through the real input path: pointers are hit-tested by the UI first, and everything the sim gets is recorded like a player's input (gameengine ui press, gameengine emit). Events with delaySteps wait in the session and enter that path just before their step, so a gesture timed in sim steps (a flick) is the same on a paused or a running session and in its replay; at most 4096 events wait, at most 216000 steps ahead. */
      push: (params) => call("input.push", params)
    },
    log: {
      /** Streams log.entry notifications. */
      subscribe: (params) => call("log.subscribe", params),
      /** Last n log entries. */
      tail: (params) => call("log.tail", params)
    },
    perf: {
      /** The performance widget: its numbers, a recording in progress and the last report. Turn it on and record with the engine.perf cheat; `gameengine cheat perf --record` records and prints the report. */
      hud: (params) => call("perf.hud", params),
      /** Starts a perf capture: per-frame CPU time, script time and GC pauses, GPU time (timestamp queries), memory high-water marks. */
      start: (params) => call("perf.start", params),
      /** Percentiles (p50/p95/p99/max/mean) of the capture so far; `stop` ends it. */
      stats: (params) => call("perf.stats", params)
    },
    pool: {
      /** Every object pool's size, idle (free) instances, most in use at once (peak), misses and instances grown on a miss. */
      stats: (params) => call("pool.stats", params)
    },
    profile: {
      /** The last frame's markers: system CPU times, job times and GPU pass times (while profiling), and the frame's CPU time. */
      markers: (params) => call("profile.markers", params),
      /** Memory by category: resident bytes, JS heap used and total, ECS storage, decoded audio, estimated GPU textures, render targets and buffers (bytes), and the entity count. */
      memory: (params) => call("profile.memory", params),
      /** Starts recording frames: CPU time, each system of the frame's last step, job-system spans and GPU pass times. */
      start: (params) => call("profile.start", params),
      /** Stops recording and returns the frames (the last 3600). */
      stop: (params) => call("profile.stop", params)
    },
    quality: {
      /** Starts device-profile quality management: profile, dynamic resolution and thermal policy (design.md § 6.9). */
      enable: (params) => call("quality.enable", params),
      /** Sets the thermal state (tests and devices without a platform feed); ends a thermal simulation. */
      setThermal: (params) => call("quality.setThermal", params),
      /** The device profile in use, the current quality level and settings, the thermal state and the level history. */
      status: (params) => call("quality.status", params)
    },
    release: {
      /** Applies a release of the running game live, between frames (ADR 0122): content only. E_NOT_LIVE for one that changes code, settings or types; what is already drawn reloads as it is drawn again. */
      apply: (params) => call("release.apply", params)
    },
    render: {
      /** Renders the current state offscreen and explains its 2D draw calls: every batch and why it did not merge with the one before, and sprite images far larger than they are drawn (design.md § 6.3). */
      batches: (params) => call("render.batches", params),
      /** Captures one frame's render-graph passes and timings. */
      captureFrame: (params) => call("render.captureFrame", params),
      /** Switches the debug visualisation. */
      debugView: (params) => call("render.debugView", params),
      /** GPU device state; forceLoss tests device-loss recovery (design.md § 6.1). */
      device: (params) => call("render.device", params),
      /** The visual features this device runs (ADR 0271), on or off; with set, switches them first. device perf --feature-sweep measures each feature on and off with it. */
      features: (params) => call("render.features", params),
      /** Renders a material on a built-in shape (or a project mesh) in its own preview scene, through the game's asset and render path (design.md § 6.6). An orbit camera, the material time, the background and the lights (`studio`: key and rim; `flat`: ambient only) are options; `device` shows textures as a device platform samples them and `testTexture` swaps in the UV checker (ADR 0107). The Materials mode drives it frame by frame. */
      materialPreview: (params) => call("render.materialPreview", params),
      /** Where a material is drawn (MeshRenderers in scenes and prefabs, mesh/material pairs in data assets, through its instances for a *.material.ts) and which models it fits, best first, with whether each carries the vertex data it reads (ADR 0107). The Materials mode picks its preview mesh from here. */
      materialUses: (params) => call("render.materialUses", params),
      /** The sub-materials of an imported model (skin, eyes, hair, …) with each one's program, import settings and the values it draws with (ADR 0127). The Materials mode lists and edits them; edits save to `[settings.materials.<name>]` in the model's .gmeta. */
      modelMaterials: (params) => call("render.modelMaterials", params),
      /** Every pipeline built so far, as warm-up records for pipelines.json (design.md § 6.1), and the pipeline cache counters. */
      pipelines: (params) => call("render.pipelines", params),
      /** Draws the current state now (nothing saved) and reads RGBA8 pixels and region means, darkest and brightest colours: checks that something is visible where it should be without saving and diffing an image. */
      probe: (params) => call("render.probe", params),
      /** Renders the current state offscreen; the image arrives on the binary side-channel, or in a file with `path`. */
      screenshot: (params) => call("render.screenshot", params),
      /** Last frame's structural stats; `render: true` draws one first. */
      stats: (params) => call("render.stats", params)
    },
    replay: {
      /** Hash stream recorded so far. */
      hashStream: (params) => call("replay.hashStream", params),
      /** Loads a replay and resets to its start, paused: engine.step advances it with the recorded input (screenshots at exact steps). */
      load: (params) => call("replay.load", params),
      /** Plays the loaded replay from the start in real time (perf capture); divergences are notified. */
      play: (params) => call("replay.play", params),
      /** Restarts the game from a freshly built world and records input frames and the hash stream from step 0 (a replay started mid-game could not verify). */
      recordStart: (params) => call("replay.record.start", params),
      /** Stops recording and writes the .greplay. */
      recordStop: (params) => call("replay.record.stop", params),
      /** Playback progress and the first hash divergence, if any. */
      status: (params) => call("replay.status", params),
      /** Re-runs a replay and compares hash streams. */
      verify: (params) => call("replay.verify", params)
    },
    scene: {
      /** Component-level differences between two scene documents or world dumps. */
      diff: (params) => call("scene.diff", params),
      /** Replaces the world with a scene. */
      load: (params) => call("scene.load", params),
      /** Writes the world back to its scene file (canonical JSON). */
      save: (params) => call("scene.save", params),
      /** Returns the world as a scene document without writing it. */
      serialize: (params) => call("scene.serialize", params)
    },
    script: {
      /** Evaluates JS in the game context (dev only, never probe). */
      eval: (params) => call("script.eval", params),
      /** Starts Chrome DevTools for the game scripts on loopback (keeps the world). Once running it is returned as is: later port and sourceMap are ignored (design.md § 5.4). */
      inspect: (params) => call("script.inspect", params),
      /** Hot reload: new bundle, same world. */
      reloadBundle: (params) => call("script.reloadBundle", params),
      /** Registered systems in execution order with last timings. */
      systems: (params) => call("script.systems", params)
    },
    services: {
      /** Calls a service method as game code would, e.g. haptics.play to feel an entry on the running game or device (the editor Haptics mode). Its outcome reaches no game code; services.calls shows it. */
      call: (params) => call("services.call", params),
      /** Recent service calls with their params and outcome. */
      calls: (params) => call("services.calls", params),
      /** Raises a service event as if the platform had (a push opened, a deep link, a deferred purchase). */
      emit: (params) => call("services.emit", params),
      /** Restores every mocked method to its schema default and clears the call history. */
      mockReset: (params) => call("services.mockReset", params),
      /** Scripts what a mocked service method does (null restores the schema default). */
      mockSet: (params) => call("services.mockSet", params)
    },
    stream: {
      /** Serves the game view over HTTP for software outside the engine (design.md § 9.8). Frames render only while someone watches; viewer input reaches the game. */
      start: (params) => call("stream.start", params),
      /** The game view stream: URLs, viewers and frames sent. */
      status: (params) => call("stream.status", params),
      /** Stops the game view stream. */
      stop: (params) => call("stream.stop", params)
    },
    ui: {
      /** Controls UI time for previews (ADR 0060): pause, seek and replay the UI's animations. Presentation only; the sim is untouched. */
      clock: (params) => call("ui.clock", params),
      /** Every shown UI element that takes presses, hit-tested and topmost first, for agents that drive the UI (gameengine ui interactables). */
      interactables: (params) => call("ui.interactables", params),
      /** The UI tree with its computed layout boxes (border and content box) and what each node draws (screen bounds after transforms, scroll and clip; visibility and opacity; a style summary; text size, lines and overflow; scroll offsets) for the layout debugger; with width and height, laid out for that target first. */
      layout: (params) => call("ui.layout", params),
      /** Renders one view alone from a sample or given model: the UI only, over the clear colour, at any device size. The session UI is untouched unless sticky. */
      preview: (params) => call("ui.preview", params),
      /** Intents the previewed view raised since the preview began (the last 100): a sticky preview pressed in a viewport or through the game view stream. */
      previewIntents: (params) => call("ui.previewIntents", params),
      /** The view stack with each view's element tree, for the editor's Views hierarchy: views bottom first with their layer and state (a covered view's nodes are listed though it is out of the tree), plus roots no view owns (defineUI roots). */
      stack: (params) => call("ui.stack", params),
      /** The project's views (defineView in src/views/*.view.tsx) with their sample models (design.md § 7.5 Views). */
      views: (params) => call("ui.views", params)
    },
    vfx: {
      /** VFX mode's 3D view, in the editor's preview engine only (--mode=editor-preview: no game code, scene or UI): one effect alone, drawn by the engine's particle path on a ground grid, from an orbit camera that is perspective or orthographic. Fields left out keep their values. */
      stage: (params) => call("vfx.stage", params)
    },
    viewport: {
      /** Creates a viewport render target ring (editor modes only). */
      create: (params) => call("viewport.create", params),
      /** Destroys a viewport. */
      destroy: (params) => call("viewport.destroy", params),
      /** Releases a ring slot back to the engine. */
      frameConsumed: (params) => call("viewport.frameConsumed", params),
      /** Pointer, wheel and keyboard input from the viewport element. */
      input: (params) => call("viewport.input", params),
      /** Moves a native-window viewport (Mode B) over the editor's viewport panel, or hides it. */
      place: (params) => call("viewport.place", params),
      /** Resizes a viewport (reallocates the ring; a native-window viewport only resizes its surface). */
      resize: (params) => call("viewport.resize", params)
    },
    world: {
      /** Despawns an entity and its children. */
      despawn: (params) => call("world.despawn", params),
      /** One entity with all its components. */
      get: (params) => call("world.get", params),
      /** Current sim state hash (or a recorded step's). */
      hash: (params) => call("world.hash", params),
      /** Entities having all listed components, with those components, optionally filtered by field values. */
      query: (params) => call("world.query", params),
      /** All resources as JSON. */
      resources: (params) => call("world.resources", params),
      /** Writes (or adds) a component. Direct mutation for debugging; editor scene edits go through cmd.execute. */
      set: (params) => call("world.set", params),
      /** Spawns an entity with components. */
      spawn: (params) => call("world.spawn", params)
    }
  };
}

// ../../../../../../Applications/Tactile Game Engine.app/Contents/Resources/engine/packages/protocol-client/src/client.ts
var ProtocolError = class extends Error {
  code;
  data;
  constructor(message, code, data) {
    super(message);
    this.code = code;
    this.data = data;
  }
};
var ProtocolTimeoutError = class extends ProtocolError {
  method;
  timeoutMs;
  constructor(method, timeoutMs) {
    super(`${method} timed out after ${timeoutMs} ms`, "E_TIMEOUT");
    this.method = method;
    this.timeoutMs = timeoutMs;
  }
};
var checkTimeout = (name, ms) => {
  if (ms !== void 0 && (!Number.isInteger(ms) || ms < 1)) throw new Error(`${name} must be a positive integer`);
};
var LOCAL_FRAME_MAX_BYTES = 512 * 1024 * 1024;
var LocalFrameDecoder = class {
  chunks = [];
  size = 0;
  /** Bytes the next frame needs buffered; a big frame's chunks are joined once, not on every chunk. */
  need = 4;
  /** The frames `chunk` completes, in order; throws on a length no frame can have. */
  push(chunk) {
    const frames = [];
    this.chunks.push(chunk);
    this.size += chunk.length;
    if (this.size < this.need) return frames;
    const buf = this.chunks.length === 1 ? this.chunks[0] : new Uint8Array(this.size);
    if (this.chunks.length > 1) {
      let o = 0;
      for (const c of this.chunks) {
        buf.set(c, o);
        o += c.length;
      }
    }
    let at = 0;
    this.need = 4;
    while (buf.length - at >= 4) {
      const n = new DataView(buf.buffer, buf.byteOffset + at, 4).getUint32(0, true);
      if (n < 1) throw new Error("local socket frame without a type byte");
      if (n > LOCAL_FRAME_MAX_BYTES) throw new Error(`local socket frame of ${n} bytes is over the ${LOCAL_FRAME_MAX_BYTES}-byte limit`);
      if (buf.length - at < 4 + n) {
        this.need = 4 + n;
        break;
      }
      frames.push({ kind: buf[at + 4], payload: buf.slice(at + 5, at + 4 + n) });
      at += 4 + n;
    }
    const rest = buf.slice(at);
    this.chunks = rest.length > 0 ? [rest] : [];
    this.size = rest.length;
    return frames;
  }
};
function encodeLocalFrame(text) {
  const body = new TextEncoder().encode(text);
  const frame = new Uint8Array(5 + body.length);
  new DataView(frame.buffer).setUint32(0, body.length + 1, true);
  frame[4] = 0;
  frame.set(body, 5);
  return frame;
}
var GameEngineClient = class _GameEngineClient {
  next = 1;
  pending = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Map();
  anyListeners = /* @__PURE__ */ new Set();
  binaryListeners = /* @__PURE__ */ new Set();
  frames = /* @__PURE__ */ new Map();
  transport;
  requestTimeoutMs;
  /** `engine.hello` result: build, backend, tier, js engine, mode. */
  hello = {};
  api = createApi((m, p) => this.call(m, p));
  constructor() {
  }
  /** Connects and authenticates (`engine.hello` with the session token). */
  static async connect(addr, opts = {}) {
    const c = new _GameEngineClient();
    checkTimeout("requestTimeoutMs", opts.requestTimeoutMs);
    c.requestTimeoutMs = opts.requestTimeoutMs;
    const timeout = opts.timeoutMs ?? 1e4;
    if (addr.local && typeof process !== "undefined" && process.versions?.node) {
      c.transport = await c.openLocal(addr.local, timeout);
    } else if (addr.ws) {
      c.transport = await c.openWs(addr.ws, timeout);
    } else {
      throw new Error("session address has neither ws nor local");
    }
    try {
      c.hello = await c.call("engine.hello", {
        token: addr.token,
        client: opts.client ?? "gameengine-protocol-client",
        ...addr.pairing ? { pairing: addr.pairing } : {}
      });
    } catch (error) {
      c.close();
      throw error;
    }
    return c;
  }
  openWs(url, timeout) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      const timer = setTimeout(() => reject(new Error(`timed out connecting to ${url}`)), timeout);
      ws.onopen = () => {
        clearTimeout(timer);
        resolve({ send: (t) => ws.send(t), close: () => ws.close() });
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error(`cannot connect to ${url}`));
      };
      ws.onclose = () => this.failAll("connection closed");
      ws.onmessage = (m) => typeof m.data === "string" ? this.onText(m.data) : this.onBinary(new Uint8Array(m.data));
    });
  }
  async openLocal(path, timeout) {
    const net = await import("node:net");
    return new Promise((resolve, reject) => {
      const s = net.connect(path);
      const decoder = new LocalFrameDecoder();
      const timer = setTimeout(() => {
        s.destroy();
        reject(new Error(`timed out connecting to ${path}`));
      }, timeout);
      s.once("connect", () => {
        clearTimeout(timer);
        resolve({ send: (t) => s.write(encodeLocalFrame(t)), close: () => s.destroy() });
      });
      s.on("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
      s.on("close", () => this.failAll("connection closed"));
      s.on("data", (d) => {
        let frames;
        try {
          frames = decoder.push(d);
        } catch {
          s.destroy();
          return;
        }
        for (const f of frames)
          if (f.kind === 1) this.onBinary(f.payload);
          else this.onText(new TextDecoder().decode(f.payload));
      });
    });
  }
  failAll(why) {
    for (const p of this.pending.values()) p.reject(new Error(why));
    this.pending.clear();
  }
  onText(text) {
    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      return;
    }
    if (typeof msg.id === "number") {
      const p = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (!p) return;
      if (msg.error) p.reject(new ProtocolError(msg.error.message, msg.error.data?.code ?? "E_INTERNAL", msg.error.data));
      else p.resolve(msg.result);
    } else if (msg.method) {
      for (const f of this.listeners.get(msg.method) ?? []) f(msg.params);
      for (const f of this.anyListeners) f(msg.method, msg.params);
    }
  }
  onBinary(b) {
    if (b.byteLength < 12) return;
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const metaLen = dv.getUint32(8, true);
    let meta;
    try {
      meta = JSON.parse(new TextDecoder().decode(b.subarray(12, 12 + metaLen)));
    } catch {
      return;
    }
    const frame = { id: dv.getUint32(0, true), kind: dv.getUint32(4, true), meta, payload: b.subarray(12 + metaLen) };
    this.frames.set(frame.id, frame);
    if (this.frames.size > 16) this.frames.delete(this.frames.keys().next().value);
    for (const f of this.binaryListeners) f(frame);
  }
  call(method, params = {}, opts = {}) {
    try {
      checkTimeout("timeoutMs", opts.timeoutMs);
    } catch (error) {
      return Promise.reject(error);
    }
    const timeoutMs = opts.timeoutMs ?? this.requestTimeoutMs;
    const id = this.next++;
    return new Promise((resolve, reject) => {
      const timer = timeoutMs === void 0 ? void 0 : setTimeout(() => {
        this.pending.delete(id);
        reject(new ProtocolTimeoutError(method, timeoutMs));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        }
      });
      try {
        this.transport.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
      } catch (error) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(error);
      }
    });
  }
  /** A binary frame by id (frames arrive before the response that names them). */
  frame(id) {
    return this.frames.get(id);
  }
  on(notification, f) {
    if (!this.listeners.has(notification)) this.listeners.set(notification, /* @__PURE__ */ new Set());
    this.listeners.get(notification).add(f);
    return () => this.listeners.get(notification)?.delete(f);
  }
  /** Every notification, whatever its method (the editor forwards them all). */
  onNotification(f) {
    this.anyListeners.add(f);
    return () => this.anyListeners.delete(f);
  }
  onFrame(f) {
    this.binaryListeners.add(f);
    return () => this.binaryListeners.delete(f);
  }
  close() {
    this.transport?.close();
    this.failAll("client closed");
  }
};
export {
  GameEngineClient
};

---
name: c3-addon-runtime
description: >
  Implement Runtime-side (not editor-side) behaviour for Construct 3 addons on the Addon SDK v2,
  via the CAW workflow. Use this skill whenever the task involves runtime instance lifecycle
  (constructor / onCreate / ticking / release), the runtime API (`this.runtime`, `this.instance`),
  per-instance delta time, ACE runtime handlers, triggers, save/load, the debugger, world-instance
  manipulation, reading sibling behaviours, cross-instance shared state, or DOM-side messaging.
  Covers the plugin-vs-behavior runtime boundaries. Pairs with the c3-addon-editor-features and
  c3-addon-spec skills.
---

# C3 Addon Runtime Skill

Operational guide for the **Runtime-side** of Construct 3 addons on the **Addon SDK v2**, using the
CAW workflow. Runtime code runs in the game engine (often a Web Worker), not in the editor.

> **Scope & verification.** The runtime APIs are the same as Construct's scripting feature; the
> authoritative source is the **Runtime API Reference** (a *separate* manual from the editor-side
> Addon SDK reference). The API surface here is drawn from field-verified addon work. Where an exact
> name is build-sensitive, confirm it from the browser console (see [Discovering IDs & APIs](#discovering-ids--apis)).

> **Naming note — `onCreate()` vs `_onCreate()`.** This file uses **`onCreate()`** for the runtime
> creation hook, matching the detailed runtime reference these conventions come from. Be aware that
> (a) every *other* lifecycle hook is underscore-prefixed (`_tick`, `_release`, `_postCreate`,
> `_saveToJson`…), and (b) the SDK v1→v2 migration guide currently writes `_onCreate()`. These two
> spellings should be **reconciled against the Runtime API Reference** and standardised across your
> skill set; pick one once confirmed.

---

## Table of Contents

- [Runtime vs Editor: The Core Rule](#runtime-vs-editor-the-core-rule)
- [File Map: Raw SDK vs CAW](#file-map-raw-sdk-vs-caw)
- [Runtime Base Classes](#runtime-base-classes)
- [Lifecycle](#lifecycle)
- [The Constructor Rule (init data here)](#the-constructor-rule-init-data-here)
- [Plugin vs Behavior at Runtime](#plugin-vs-behavior-at-runtime)
- [The Runtime API (`this.runtime`)](#the-runtime-api-thisruntime)
- [Per-Instance Delta Time](#per-instance-delta-time)
- [World Instance Manipulation](#world-instance-manipulation)
- [Reading Sibling Behaviours](#reading-sibling-behaviours)
- [ACE Runtime Handlers](#ace-runtime-handlers)
- [Triggers](#triggers)
- [Ticking](#ticking)
- [Save / Load](#save--load)
- [Debugger Support](#debugger-support)
- [Cross-Instance Shared State](#cross-instance-shared-state)
- [DOM-Side Messaging](#dom-side-messaging)
- [Migrating World Info (SDK v1 → v2)](#migrating-world-info-sdk-v1--v2)
- [Discovering IDs & APIs](#discovering-ids--apis)
- [Gotchas](#gotchas)
- [Templates](#templates)
- [Pre-Commit Checklist](#pre-commit-checklist)

---

## Runtime vs Editor: The Core Rule

- Runtime classes derive from `globalThis.ISDK…` base classes; editor classes derive from `SDK.I…`. **Never mix them.**
- Runtime code lives in `c3runtime/` (raw SDK) / `src/runtime/` (CAW). Editor code never goes here.
- Runtime often executes in a **Web Worker** — no DOM access. DOM work goes through DOM-side scripts (see below).
- Only **plugins and behaviors** have runtime scripts. Effects are shader code; themes are CSS.

---

## File Map: Raw SDK vs CAW

`addon.json` lists runtime scripts in `file-list` under `c3runtime/`:

```jsonc
{
  "sdk-version": 2,
  "file-list": [
    "c3runtime/main.js",        // module entry (if using modules)
    "c3runtime/plugin.js",      // or behavior.js — registration
    "c3runtime/type.js",        // type-level
    "c3runtime/instance.js",    // ← the per-instance class: lifecycle, runtime logic
    "c3runtime/actions.js", "c3runtime/conditions.js", "c3runtime/expressions.js"
  ]
}
```

**CAW mapping.** Runtime work lives in `src/runtime/instance.js` (the primary anchor), with
`src/runtime/plugin.js` / `type.js` for plugin/type-level concerns, and ACEs in `src/aces/<Category>/`
(`a.*.js`, `c.*.js`, `e.*.js`). CAW compiles these to the `c3runtime/` files. Keep editor code in
`src/editor/`, DOM code in `src/domside/index.js`. Never edit `build/` or `template/`.

---

## Runtime Base Classes

| Addon kind | Runtime instance base class | Type base | Addon base |
|---|---|---|---|
| Object plugin | `ISDKInstanceBase` | `ISDKObjectTypeBase` | `ISDKPluginBase` |
| World plugin | `ISDKWorldInstanceBase` | `ISDKObjectTypeBase` | `ISDKPluginBase` |
| DOM plugin | `ISDKDOMInstanceBase` | `ISDKObjectTypeBase` | `ISDKDOMPluginBase` |
| Behavior | `ISDKBehaviorInstanceBase` | `ISDKBehaviorTypeBase` | `ISDKBehaviorBase` |

All are on `globalThis` (e.g. `globalThis.ISDKInstanceBase`). SDK v2 constructors take **no
parameters**; read initial properties via `this._getInitProperties()`. (In CAW, the factory supplies
the correct base class through the generated inheritance chain — you write method bodies, not the
`extends` clause.) `ISDKInstanceBase` inherits the scripting `IInstance`, which is why `this.runtime`
is available (not a separate `this._runtime`).

---

## Lifecycle

Order C3 calls them (all defined on the instance class):

1. **`constructor()`** — runs very early. **`this.runtime` is NOT available** (and for behaviors, **`this.instance` is null**). Initialise data only; read properties via `this._getInitProperties()`; enable ticking here.
2. **`onCreate()`** — instance fully created; `this.runtime` is available. Resolve layers/layout refs and runtime-dependent setup here. *(Plugins. See naming note above.)*
3. **`_postCreate()`** — **behaviors only**; called after the attached object instance is fully constructed (the place to inspect `this.instance` once it's ready). Plugins use `onCreate()` instead.
4. **`_tick()`** — per-frame, before events (enable with `this._setTicking(true)`). No `dt` parameter — read it per-instance (see [Per-Instance Delta Time](#per-instance-delta-time)).
5. **`_tick2()`** — per-frame, just **after** events run (enable with `this._setTicking2(true)`).
6. **`_postTick()`** — **behavior-only**; after **all** behaviours' `_tick()` (enable with `this._setPostTicking(true)`). Ordering between behaviours is unreliable — prefer `_tick()`.
7. **`_release()`** — instance destroyed; clean up listeners and always call `super._release()`.

`_saveToJson()` / `_loadFromJson(o)` are called for savegames and persistence (see [Save / Load](#save--load)).

---

## The Constructor Rule (init data here)

**C3 can call ACE actions before `onCreate()` runs** (e.g. an action on Start of Layout). Any data
structure an ACE reads or writes must already exist. Therefore:

- **Initialise every data structure (Maps, Sets, arrays, counters, flags) in `constructor()`** — never defer them to `onCreate()`.
- Reserve `onCreate()` strictly for things that genuinely need `this.runtime` (layout/layer resolution) — and for behaviours, `_postCreate()` for things needing `this.instance`.

```js
constructor() {
  super();
  this._items = [];          // safe at any point — ACEs may fire before onCreate()
  this._active = false;
  this._setTicking(true);    // enable _tick()
  const props = this._getInitProperties();   // index = config.caw.js declaration order
  this._speed = props[0];
}

onCreate() {
  this._layer = this.runtime.layout.getLayer(this._getProperty("uiLayer")) ?? null;
}
```

> Save/load needs **no `_restoredFromSave` guard**: `constructor()` sets editor-property defaults, then `_loadFromJson(o)` overwrites them. Just persist each field in both methods.

---

## Plugin vs Behavior at Runtime

| Concern | Plugin instance | Behavior instance |
|---|---|---|
| `this` is | the object instance | the **behaviour** (not the host object) |
| Host object | `this` itself (world props on `this`) | **`this.instance`** (the `IWorldInstance` it's attached to) |
| Runtime | `this.runtime` | `this.runtime` (or `this.instance.runtime`) |
| Setup hook needing host | `onCreate()` | `_postCreate()` (or first-tick guard) |
| `_postTick()` | not available | available |
| `this.instance` in `constructor()` | n/a | **null — never touch it** |

For behaviours, never access `this.instance` in the constructor (it's null). Use `_postCreate()`,
or a one-time init guard inside `_tick()`:

```js
_tick() {
  if (!this._initialized) { this._initialized = true; this._setup(); /* this.instance ready */ }
}
```

---

## The Runtime API (`this.runtime`)

Available from `onCreate()` onwards.

```js
// Layout
this.runtime.layout                       // ILayout (current)
this.runtime.layout.name / .width / .height
this.runtime.layout.getLayer("LayerName") // ILayer | null  — always null-check

// Objects / instances
this.runtime.objects                      // iterable of IObjectType
this.runtime.objects.Sprite               // a specific IObjectType
for (const objType of this.runtime.objects)
  for (const instance of objType.getAllInstances()) { instance.x; instance.layer; }

// Timing
this.runtime.dt                           // global delta-time (seconds) — but prefer per-instance dt below

// Layout-transition events (NOT per-frame)
this.runtime.addEventListener("beforelayout", () => {});
this.runtime.addEventListener("afterlayout",  () => {});
```

> Do **not** use `addEventListener("tick", …)` for per-frame logic — use `_setTicking(true)` + `_tick()`.

---

## Per-Instance Delta Time

Prefer per-instance `dt`, which respects each object's/layer's timescale, over the global `this.runtime.dt`:

```js
// Addon SDK form (inside src/runtime/instance.js):
const dt = this.runtime.GetDt(this.instance);  // behavior — pass the host instance
const dt = this.runtime.GetDt(this);           // plugin   — pass the plugin instance

// Scripting-interface form (when this.instance IS the IInstance):
const dt = this.instance.dt;                    // behavior — per-instance dt property
```

`this.runtime.dt` ignores per-object/layer timescale and time-scaling — fine for global timers,
wrong for object motion. Also available: `instance.timeScale = n` / `instance.restoreTimeScale()`.

---

## World Instance Manipulation

Read/write the host's world properties through the instance (`this` for plugins, `this.instance` for
behaviours):

```js
inst.x; inst.y;                 // position
inst.width; inst.height;        // size
inst.angle;                     // radians  (inst.angleDegrees for degrees)
inst.opacity;                   // 0–1
inst.isVisible;
inst.layer; inst.layout;
inst.colorRgb = [r, g, b];      // 0–1 floats — the stable colour surface (prefer over guessed setColor())
```

Setting a property invalidates the bounding box automatically — there is **no** `SetBboxChanged()` to
call (that was SDK v1). See [Migrating World Info](#migrating-world-info-sdk-v1--v2).

---

## Reading Sibling Behaviours

`this.instance.behaviors` is usually keyed by behaviour name, but on some runtime surfaces is
iterable. Use a tolerant lookup that also checks enabled state, rather than assuming a shape:

```js
function getEnabledBehaviorByType(inst, typeName) {
  const bag = inst?.behaviors; if (!bag) return null;
  const norm = s => String(s||"").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const target = norm(typeName);
  const direct = bag[typeName] || bag[target];
  const enabled = b => !!b && b.isEnabled !== false && b.enabled !== false;
  if (enabled(direct)) return direct;
  let found = null;
  const entries = Array.isArray(bag) ? bag.map((b,i)=>[i,b])
               : typeof bag[Symbol.iterator]==="function" ? [...bag]
               : Object.entries(bag);
  for (const [k, b] of entries) {
    if (found || !enabled(b)) continue;
    if (norm(k) === target || norm(b?.behaviorType?.name) === target) found = b;
  }
  return found;
}
// Built-in type names: "Platform", "Solid", "Jumpthru", "Physics", "Bullet", "Pathfinding"
const plat = getEnabledBehaviorByType(this.instance, "Platform");
if (plat) { plat.vectorX = 200; const onFloor = plat.isOnFloor; }
```

---

## ACE Runtime Handlers

ACE handlers live in `src/aces/<Category>/` and are invoked with `this` bound to the runtime instance.

- **Always use `function`, never arrow functions** for the default export — arrows lose the `this` binding.
- **`export const expose = true`** copies the handler onto the instance prototype (callable from other ACEs, `instance.js`, and C3 Script). The prototype name is the PascalCase ACE ID from the filename (`a.SetActive.js` → `this.SetActive()`). Use `expose: false` for event-sheet-only handlers.
- **Conditions return a boolean.** Expressions return their `returnType` (`"string"` | `"number"` | `"any"`).
- **Expression params must NOT have `initialValue`** (action/condition params may).
- **Combo params arrive as 0-based indices at runtime**, not the key string — map them first.

```js
// a.SetSpeed.js
export const config = { listName: "Set speed", displayText: "Set speed to {0}",
  description: "Sets movement speed.", isAsync: false,
  params: [{ id: "speed", name: "Speed", desc: "px/s", type: "number", initialValue: "200" }] };
export const expose = true;
export default function (speed) { this._speed = speed; }   // `this` = runtime instance

// combo index → key
_combo(value, keys) { return keys[value] ?? keys[0]; }
// const mode = this._combo(strategy, ["balanced","shortest","safest"]);
```

> Combo item keys must use underscores, not hyphens (`one_way`, not `one-way`) — hyphen keys fail
> comparison at runtime. Conditions and expressions share one ACE-ID namespace — keep IDs distinct.

---

## Triggers

Set the "current value" into instance variables **before** firing, so condition filter functions can
read it when C3 evaluates listeners.

```js
this._lastChangedLayer = layerName;     // state first
this._trigger("OnLayerChanged");        // then fire (CAW helper wraps super._trigger with the namespace)

// trigger condition (c.OnLayerChanged.js): isTrigger:true, returns a filter
export default function (layerName) { return this._lastChangedLayer === layerName; }
```

Raw SDK form: `super._trigger(self.C3.Behaviors["addon_id"].Cnds["OnLayerChanged"])`. Async variant:
`await this._triggerAsync(...)`.

---

## Ticking

Enable hooks in the constructor; redundant calls are safe (they don't stack). **Stop ticking when
idle** to cut per-frame overhead, and re-enable on demand.

```js
constructor() {
  super();
  this._setTicking(true);       // _tick()      — before events
  this._setTicking2(true);      // _tick2()     — after events
  this._setPostTicking(true);   // _postTick()  — after all behaviours tick (behavior-only)
}
// queries: this._isTicking() / this._isTicking2() / this._isPostTicking()
// disable: this._setTicking(false)
```

---

## Save / Load

Return a plain serialisable object from `_saveToJson()`; restore in `_loadFromJson(o)`. Used for
savegames and `persistAcrossLayouts`.

```js
_saveToJson() { return { items: [...this._items.entries()], active: this._active }; }
_loadFromJson(o) { this._items = new Map(o.items ?? []); this._active = !!o.active; }
```

No guard flag needed — `_loadFromJson` runs after the constructor and overwrites its values.

---

## Debugger Support

Surface live state in C3's debugger via `_getDebuggerProperties()`. Prefix debugger labels with `$`.
Route debugger reads/writes through the same instance methods your ACEs use, so event sheets,
scripting, and the debugger stay consistent.

---

## Cross-Instance Shared State

For state shared across instances of one addon, or across addons in a suite:

- **Module-scope `Map`/`WeakMap`** in the runtime module for per-behaviour shared stores (a true "SPOT" — single point of truth). Use only when genuinely shared; per-instance state belongs on `this`.
- **`globalThis` registries** for cross-addon coordination (a hub plugin publishes a registry other addons read). Namespace the key, version the contract, and fail gracefully when absent.
- Prefer a **hub-and-spoke** shape: one manager owns shared state; element addons read through a documented interface rather than reaching into each other.

Keep these stores keyed so they survive instance churn predictably, and clear/rebuild them on
`beforelayout`/`afterlayout` if they cache layout-scoped data.

---

## DOM-Side Messaging

For DOM/wrapper plugins (runtime is sandboxed / in a worker), communicate with `src/domside/index.js`:

```js
this._sendToDOM("message-id", data);
const reply = await this._sendToDOMAsync("message-id", data);
this._addDOMMessageHandler("reply-id", (data) => { /* ... */ });
```

The DOM-component ID is passed to the base constructor as `super({ domComponentId: DOM_COMPONENT_ID })`
(SDK v2), not via a legacy setter.

---

## Migrating World Info (SDK v1 → v2)

`getWorldInfo()` and `_sdkInst` are **removed** in SDK v2 — any reference is a hard runtime error.
Replace with direct properties on the instance:

| SDK v1 (`getWorldInfo()`) | SDK v2 (instance property) |
|---|---|
| `GetX()`/`SetX()`, `GetY()`/`SetY()` | `x`, `y` |
| `GetWidth()`/`GetHeight()` | `width`, `height` |
| `GetAngle()`/`SetAngle()` | `angle` (radians) / `angleDegrees` |
| `GetOpacity()`/`SetOpacity()` | `opacity` |
| `GetZElevation()`/`SetZElevation()` | `z` *(confirm vs `zElevation` in the Runtime API Reference)* |
| `GetTotalZElevation()` | `totalZ` *(confirm vs `totalZElevation`)* |
| `IsVisible()`/`SetVisible()` | `isVisible` |
| `SetBboxChanged()` | not needed — property setters invalidate automatically |

> The exact Z-property names are runtime-scripting facts not covered by the editor manual — verify
> against the Runtime API Reference.

---

## Discovering IDs & APIs

From the Construct browser console (F12), to confirm IDs and which member names your build exposes:

- `C3SDK_ListAddonIDs("plugin" | "behavior")` — installed addon IDs (and editor names).
- `C3SDK_ListACEIDs(addonType, addonId, "actions" | "conditions" | "expressions")` — ACE IDs.

Use these to confirm a real ACE/plugin ID before referencing another addon, and to settle any
name that differs between this skill, the migration guide, and your build.

---

## Gotchas

1. `this.runtime` is undefined in `constructor()`; for behaviours `this.instance` is null there too.
2. ACEs can fire before `onCreate()` — initialise all data structures in the constructor (see [The Constructor Rule](#the-constructor-rule-init-data-here)).
3. `_getInitProperties()` returns values by **position** — keep index↔property mapping documented; reordering `config.caw.js` breaks it.
4. Combo params/properties are 0-based **indices** at runtime — map to keys before comparing; underscore keys only.
5. Expression params must not carry `initialValue`.
6. ACE default exports must be `function` (not arrow) for correct `this`.
7. Single-global plugins: `onCreate()` runs **once** — never cache layer/layout refs across layouts; resolve fresh each action.
8. Null-check layer refs; feature-detect build-sensitive methods (`moveLayerToIndex`, `subLayers()`/`layers()`).
9. Prefer per-instance `dt` (`GetDt(this.instance)`) over `this.runtime.dt`.
10. Use `colorRgb` for runtime tint; don't build around guessed `setColor()`.
11. `_postTick()` and `_postCreate()` are behavior-only; ordering between behaviours' post-ticks is unreliable.
12. An ACE calling `this.aceXxx()` with no matching method fails **silently** — cross-check ACE files against `instance.js`.

---

## Templates

### Behavior runtime instance

```js
// src/runtime/instance.js (CAW factory body shown; raw SDK extends ISDKBehaviorInstanceBase)
constructor() {
  super();
  this._initialized = false;
  this._speed = 0;
  this._setTicking(true);
  const props = this._getInitProperties();
  this._speed = props[0];
}
_postCreate() { /* this.instance is ready */ }
_tick() {
  const dt = this.runtime.GetDt(this.instance);
  this.instance.x += this._speed * dt;
}
_release() { super._release(); }
_saveToJson() { return { speed: this._speed }; }
_loadFromJson(o) { this._speed = o.speed ?? 0; }
```

### Object / world plugin runtime instance

```js
constructor() {
  super();
  this._data = new Map();
  this._setTicking(true);
  const props = this._getInitProperties();
  this._mode = ["a","b","c"][props[0]];   // combo property → key
}
onCreate() { this._layer = this.runtime.layout.getLayer("UI") ?? null; }
_tick() { const dt = this.runtime.GetDt(this); /* ... */ }
_release() { super._release(); }
```

---

## Pre-Commit Checklist

- [ ] Correct runtime base class for the addon kind (object/world/DOM plugin, behavior).
- [ ] All data structures initialised in `constructor()`; runtime refs resolved in `onCreate()` (behaviours: host access in `_postCreate()` or first-tick guard).
- [ ] No `this.runtime` use in the constructor; no `this.instance` use in a behaviour constructor.
- [ ] Ticking enabled in the constructor; disabled when idle.
- [ ] `_getInitProperties()` index↔property mapping documented; combos mapped index→key (underscore keys).
- [ ] Expression params have no `initialValue`; ACE exports are `function` (not arrow).
- [ ] Triggers set state before `_trigger()`; condition/expression IDs distinct.
- [ ] `_saveToJson()`/`_loadFromJson()` cover every persisted field.
- [ ] Per-instance `dt` via `GetDt(...)`; `colorRgb` for tint; no `getWorldInfo()`/`_sdkInst`/`SetBboxChanged()`.
- [ ] Single-global: no cross-layout cached refs.
- [ ] DOM work isolated to `src/domside/index.js`; component ID passed via `super({ domComponentId })`.
- [ ] Every `this.aceXxx()` has a matching method; editor logic kept out of runtime files.
- [ ] Runtime creation hook name (`onCreate` vs `_onCreate`) reconciled against the Runtime API Reference and consistent with sibling skills.

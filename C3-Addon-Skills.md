# Construct 3 Addon Development — Skills Reference

Practical knowledge for building C3 plugins and behaviors with the **CAW (Construct Addon Wizard)** framework. Covers the C3 SDK runtime API, CAW patterns, ACE authoring, and common gotchas drawn directly from real addon development.

---

## Manual Reconciliation (provenance & scope)

This revision was reconciled against the **Construct 3 Official Manual — C3 Addon SDK
Documentation** (158-page PDF export of `construct.net/.../manuals/addon-sdk`).

**Scope of this manual.** The PDF is the **editor-side Addon SDK reference and authoring
guide**: addon structure & metadata (`addon.json`), `IPluginInfo` / `IBehaviorInfo`,
ACE/`aces.json` schema, the language file, effects/shaders, wrapper extensions & messaging,
the SDK v1→v2 porting guide, and the **Editor API Reference** (base classes; graphics, model,
object, and UI interfaces; `PluginProperty`). Its final page redirects to a **separate** Runtime
API Reference, so this manual does **not** document the runtime scripting interfaces.

**What that means for this file.** Sections covering the **editor SDK and authoring guide** were
verified and corrected against this manual. Sections covering the **runtime scripting reference**
(e.g. `ISDKInstanceBase`/`ISDKBehaviorInstanceBase` runtime members, `IRuntime`,
`ICollisionEngine`, `IStorage`, `IAssetManager`, `IRenderer`, and the runtime `IInstance` /
`IWorldInstance` / `IObjectType` / `IAnimation*` script interfaces) are **outside this manual's
scope** and were left intact — verify those against the Runtime API Reference separately.

**Corrections applied from the manual (editor side):**
- `IWorldInstanceBase`: original size is now `IsOriginalSizeKnown()` + **`GetOriginalSize()` →
  `[width, height, depth]`** (replacing the SDK v1-era `GetOriginalWidth()`/`GetOriginalHeight()`).
- `IWorldInstanceBase.OnPlacedInLayout(iLayoutView)` now documents its `ILayoutView` parameter.
- Added `IWorldInstanceBase.RendersToOwnZPlane()` (default `true`; return `false` for 3D content
  not on its own Z plane — Z-fighting mitigation).
- Added an **SDK v1 → v2 Porting Guide** appendix (base-class mapping, constructor changes,
  removal of separate script interface, method renames).

Items already matching the manual and left as-is include `OnAddedInEditor`, `GetExternalSdkInstance`,
`SetMustPreDraw`, `CreateWebGLText`, `SDK.UI.Util.AddDragDropFileHandler`, `ILang`, `IZipFile`,
and `IZipFileEntry`.

---

## Table of Contents

1. [Project Structure (CAW)](#1-project-structure-caw)
2. [config.caw.js — Addon Configuration](#2-configcawjs--addon-configuration)
3. [Instance Lifecycle](#3-instance-lifecycle)
4. [The Runtime API (`this.runtime`)](#4-the-runtime-api-thisruntime)
5. [Layer API](#5-layer-api)
6. [Instance API (`this`)](#6-instance-api-this)
7. [ACE Authoring](#7-ace-authoring)
8. [Parameter Types Reference](#8-parameter-types-reference)
9. [Property Types Reference](#9-property-types-reference)
10. [Triggers and Conditions](#10-triggers-and-conditions)
11. [The C3 Global (`self.C3`)](#11-the-c3-global-selfc3)
12. [C3 Debugger Support](#12-c3-debugger-support)
13. [Editor Instance (IInstanceBase / IWorldInstanceBase / IBehaviorInstanceBase)](#13-editor-instance)
14. [CAW Build & Dev Workflow](#14-caw-build--dev-workflow)
15. [Gotchas and Patterns](#15-gotchas-and-patterns)
16. [Behavior-Specific Patterns](#16-behavior-specific-patterns)
17. [Advanced Runtime Scripting API](#17-advanced-runtime-scripting-api)
18. [Index-Based Collection Iteration Pattern](#18-index-based-collection-iteration-pattern)
19. [SPOT Pattern — Shared State Across Behavior Instances](#19-spot-pattern--shared-state-across-behavior-instances)
20. [Object Interfaces (IAnimation / IAnimationFrame / IBehaviorInstance / IBehaviorType / ICollisionPoly / IContainer / IFamily / IImagePoint / IObjectClass / IObjectInstance / IObjectType / IWorldInstance)](#20-object-interfaces)
21. [Model Interfaces (IEventBlock / IEventParentRow / IEventSheet / ILayer / ILayout / IProject / IProjectFile)](#21-model-interfaces)
22. [Geometry Primitives (SDK.Rect / SDK.Quad / SDK.Color)](#22-geometry-primitives)
23. [Graphics Interfaces (IDrawParams / IWebGLRenderer / IWebGLText / IWebGLTexture)](#23-graphics-interfaces)
24. [Remaining Object Interfaces (IImagePoint / IContainer / IFamily)](#24-remaining-object-interfaces)
25. [Physics Behavior API (IPhysicsBehavior / IPhysicsBehaviorInstance)](#25-physics-behavior-api-iphysicsbehavior--iphysicsbehaviorinstance)
26. [ISDKBehaviorInstanceBase — Runtime Behavior API](#26-isdkbehaviorinstancebase--runtime-behavior-api)
27. [ISDKInstanceBase — Runtime Plugin Instance API](#27-isdkinstancebase--runtime-plugin-instance-api)
28. [ISDKUtils — Runtime Utilities (`runtime.sdk`)](#28-isdkutils--runtime-utilities-runtimesdk)
29. [Physics Platformer — Scripting API Reference](#29-physics-platformer--scripting-api-reference)
30. [IRenderer — Runtime Rendering API](#30-irenderer--runtime-rendering-api)
31. [IMeshData — GPU Mesh Buffers](#31-imeshdata--gpu-mesh-buffers)
32. [ICollisionEngine Script Interface](#32-icollisionengine-script-interface)
33. [IStorage Script Interface](#33-istorage-script-interface)
34. [IAssetManager Script Interface](#34-iassetmanager-script-interface)
35. [IAABB3D Script Interface](#35-iaabb3d-script-interface)
36. [Instance & Behavior Instance Event Properties](#36-instance--behavior-instance-event-properties)
37. [ILoopingConditionContext — Looping Conditions](#37-iloopingconditioncontext--looping-conditions)
38. [IWorldInstance Script Interface](#38-iworldinstance-script-interface)
39. [IPlugin Script Interface](#39-iplugin-script-interface)
40. [IObjectClass Script Interface](#40-iobjectclass-script-interface)
41. [IObjectType Script Interface](#41-iobjecttype-script-interface)
42. [IFamily Script Interface](#42-ifamily-script-interface)
43. [IInstance Script Interface](#43-iinstance-script-interface)
44. [IDOMInstance Script Interface](#44-idominstance-script-interface)
45. [IBehaviorInstance Script Interface (Runtime)](#45-ibehaviorinstance-script-interface-runtime)
46. [IAnimationFrame Script Interface (Runtime)](#46-ianimationframe-script-interface-runtime)
47. [IAnimation Script Interface (Runtime)](#47-ianimation-script-interface-runtime)
48. [IRuntime Script Interface](#48-iruntime-script-interface)
49. [ILOSBehaviorInstance Script Interface](#49-ilosbehaviorinstance-script-interface)
50. [ISineBehaviorInstance Script Interface](#50-isinebehaviorinstance-script-interface)
[Plugin Interfaces Category](#plugin-interfaces-category)
51. [IAdvancedRandomObjectType Script Interface](#51-iadvancedrandomobjecttype-script-interface)
52. [I9PatchInstance Script Interface](#52-i9patchinstance-script-interface)
53. [I3DCameraObjectType Script Interface](#53-i3dcameraobjecttype-script-interface)
54. [IFileSystemObjectType Script Interface](#54-ifilesystemobjecttype-script-interface)
55. [IFileChooserInstance Script Interface](#55-ifilechooserinstance-script-interface)
56. [IDrawingCanvasInstance Script Interface](#56-idrawingcanvasinstance-script-interface)
57. [ISpriteInstance Script Interface](#57-ispriteinstance-script-interface)
58. [ITilemapInstance Script Interface](#58-itilemapinstance-script-interface)
59. [ITiledBackgroundInstance Script Interface](#59-itiledbackgroundinstance-script-interface)
60. [IPlatformInfo Script Interface](#60-iplatforminfo-script-interface)
61. [ITimelineStateBase Script Interface](#61-itimelinestatebase-script-interface)
62. [ITimelineState Script Interface](#62-itimelinestate-script-interface)
63. [ITweenState Script Interface](#63-itweenstate-script-interface)
64. [I3DShapeInstance Script Interface](#64-i3dshapeinstance-script-interface)
65. [I3DModelInstance Script Interface](#65-i3dmodelinstance-script-interface)
66. [IArrayInstance Script Interface](#66-iarrayinstance-script-interface)
67. [IDictionaryInstance Script Interface](#67-idictionaryinstance-script-interface)
68. [IJSONInstance Script Interface](#68-ijsoninstance-script-interface)
69. [IKeyboardObjectType Script Interface](#69-ikeyboardobjecttype-script-interface)
70. [ITouchObjectType Script Interface](#70-itouchobjecttype-script-interface)
71. [IInternationalizationObjectType Script Interface](#71-iinternationalizationobjecttype-script-interface)
72. [Behavior Interfaces Category](#72-behavior-interfaces-category)
73. [ITweenBehaviorInstance Script Interface](#73-itweenbehaviorinstance-script-interface)
74. [ITileMovementBehaviorInstance Script Interface](#74-itilemovementbehaviorinstance-script-interface)
75. [ISolidBehaviorInstance Script Interface](#75-isolidbehaviorinstance-script-interface)
76. [IPlatformBehaviorInstance Script Interface](#76-iplatformbehaviorinstance-script-interface)
77. [IPathfindingBehaviorInstance Script Interface](#77-ipathfindingbehaviorinstance-script-interface)
78. [IPathfindingMap Script Interface](#78-ipathfindingmap-script-interface)
79. [IOrbitBehaviorInstance Script Interface](#79-iorbitbehaviorinstance-script-interface)
80. [IMoveToBehaviorInstance Script Interface](#80-imovetobehaviorinstance-script-interface)
81. [IJumpthruBehaviorInstance Script Interface](#81-ijumpthrubehaviorinstance-script-interface)
82. [IFollowBehaviorInstance Script Interface](#82-ifollowbehaviorinstance-script-interface)
83. [IDragDropBehaviorInstance Script Interface](#83-idragdropbehaviorinstance-script-interface)
84. [IBulletBehaviorInstance Script Interface](#84-ibulletbehaviorinstance-script-interface)
85. [IAnchorBehaviorInstance Script Interface](#85-ianchorbehaviorinstance-script-interface)
86. [I8DirectionBehaviorInstance Script Interface](#86-i8directionbehaviorinstance-script-interface)
87. [ICarBehaviorInstance Script Interface](#87-icarbehaviorinstance-script-interface)
88. [Editor Scripts — Scope and Restrictions](#88-editor-scripts--scope-and-restrictions)
89. [Runtime Scripts and Modules](#89-runtime-scripts-and-modules)
90. [DOM Calls in the C3 Runtime (Worker Architecture)](#90-dom-calls-in-the-c3-runtime-worker-architecture)
91. [Timeline Integration](#91-timeline-integration)
92. [Wrapper Extensions](#92-wrapper-extensions)
93. [Porting Construct 2 Plugins / Behaviors](#93-porting-construct-2-plugins--behaviors)
94. [SDK v2 Instance Handling (CAW Compliance)](#94-sdk-v2-instance-handling-caw-compliance)
95. [ISDKWorldInstanceBase — World Plugin Instance API](#95-isdkworldinstancebase--world-plugin-instance-api)
96. [ISDKPluginBase — Runtime Plugin Base](#96-isdkpluginbase--runtime-plugin-base)
97. [ISDKObjectTypeBase — Runtime Type Base](#97-isdkobjecttypebase--runtime-type-base)
98. [ISDKBehaviorBase — Runtime Behavior Plugin Base](#98-isdkbehaviorbase--runtime-behavior-plugin-base)
99. [ISDKBehaviorTypeBase — Runtime Behavior Type Base](#99-isdkbehaviortypebase--runtime-behavior-type-base)
100. [ISDKDOMInstanceBase — DOM Plugin Instance API](#100-isdkdominstancebase--dom-plugin-instance-api)
101. [ISDKDOMPluginBase — DOM Plugin Base](#101-isdkdompluginbase--dom-plugin-base)

---

## Category Guide

Runtime API and C3 scripting content is preserved in:

- Sections 3-12
- Sections 14-19
- Sections 25-87

Separate category skill files:

- C3-Plugin-Addon-Skills.md
- C3-Behavior-Addon-Skills.md

Plugin interfaces are grouped in one category at:

- [Plugin Interfaces Category](#plugin-interfaces-category)

Editor API reference content is in:

- Section 13
- Sections 20-24

All newly provided editor-side documentation has been placed under the Editor API area (Sections 20-24), and no runtime/C3 scripting sections were removed.

---

## 1. Project Structure (CAW)

```
config.caw.js       ← Addon identity, properties, plugin type flags
version.js          ← Version string only
buildconfig.js      ← Build system options (cleanup, terser, warnings)
devConfig.js        ← Dev server port

src/
├── runtime/
│   ├── instance.js ← Main runtime class (all logic lives here)
│   ├── plugin.js   ← Runtime plugin class (rarely touched)
│   └── type.js     ← Runtime type class (rarely touched)
├── editor/
│   ├── instance.js ← Editor-side instance (property change handlers)
│   └── type.js     ← Editor type class
├── aces/
│   └── CategoryName/
│       ├── a.ActionName.js      ← Action   (prefix: a. or act.)
│       ├── c.ConditionName.js   ← Condition (prefix: c. or cnd.)
│       └── e.ExpressionName.js  ← Expression (prefix: e. or exp.)
└── domside/
    └── index.js    ← DOM-side script (only if hasDomside: true)

template/           ← DO NOT MODIFY — CAW internals
build/              ← DO NOT MODIFY — Build system
```

**ACE category folders** — folder name becomes the category ID. Use underscores (`Focus_Stack`), not spaces. Override display names in `config.caw.js` via `aceCategories`.

**Three ACE organization methods** — file-per-ACE in category folders (recommended), subfolders (`actions/`, `conditions/`, `expressions/`), or a single `src/aces.js` file.

---

## 2. config.caw.js — Addon Configuration

### Addon identity

```js
export const addonType = ADDON_TYPE.PLUGIN;   // or BEHAVIOR
export const type      = PLUGIN_TYPE.OBJECT;  // OBJECT, WORLD, or DOM
export const id        = "author_addonname";  // lowercase + underscores, globally unique
export const name      = "Display Name";
export const author    = "AuthorName";
export const version   = _version;            // from version.js
```

### Plugin type flags (`info.Set`)

```js
export const info = {
  Set: {
    IsSingleGlobal:    true,   // Only one instance allowed (global plugins)
    CanBeBundled:      true,
    IsDeprecated:      false,

    // World plugins only:
    IsResizable:       false,
    IsRotatable:       false,
    HasImage:          false,
    SupportsZElevation: false,
    SupportsColor:     false,
    SupportsEffects:   false,

    // Behavior only:
    IsOnlyOneAllowed:  false,
  },
  AddCommonACEs: {
    Position:   false,  // Adds standard x/y/z ACEs
    Size:       false,
    Angle:      false,
    Appearance: false,
    ZOrder:     false,
  },
};
```

> **`AddCommonACEs` must always be an object — never a boolean.**
> The CAW build schema validates `info.AddCommonACEs` as `Joi.object(...).required()`. Setting it to `false` (or any other primitive) produces the error `"info.AddCommonACEs" must be of type object`. Always provide the full object with boolean flags, even if every flag is `false`. An empty object `{}` is also valid since all flags default to `false`.

### ACE category display names

```js
export const aceCategories = {
  MyCategory:     "My Category",
  Focus_Stack:    "Focus Stack",
  Layer_State:    "Layer State",
};
```

### File dependencies

```js
export const files = {
  fileDependencies:       [],          // Local files bundled into the addon
  remoteFileDependencies: [],          // External scripts (must be https://)
  cordovaPluginReferences:[],
  cordovaResourceFiles:   [],
  extensionScript: { enabled: false }, // Native wrapper extension (.dll)
};
```

---

## 3. Instance Lifecycle

Methods called by C3 in order. All are defined on the class returned by `instance.js`.

### `constructor()`

Called very early. **`this.runtime` is NOT available yet.** Only use for pure data initialization (Maps, arrays, primitives). Never call `this.runtime`, `this._getProperty()`, or any layer API here.

```js
constructor() {
  super();
  this._myData = new Map();

  // Enable the _tick(dt) callback every frame
  this._setTicking(true);

  // Read initial properties — safe here
  const props = this._getInitProperties();
  this._props = {
    myProp: props[0],  // index matches declaration order in config.caw.js
  };
}
```

### `onCreate()`

Called after the instance is fully created. **`this.runtime` is available.** Use for everything that needs the runtime: resolving layers, restoring saved state.

```js
onCreate() {
  this._debug = this._getProperty("debugMode");

  // Access layout/layers
  const layer = this.runtime.layout.getLayer("MyLayer");
}
```

### `_tick()`

Called every frame when ticking is enabled. Enable it once in `constructor()` with `this._setTicking(true)`. This is the correct C3 SDK way to run per-frame logic — do not use `this.runtime.addEventListener("tick", ...)`.

Delta time is **not** passed as a parameter — read it from `this.runtime.dt` (seconds) inside the method.

```js
constructor() {
  super();
  this._setTicking(true);  // must be called in constructor to enable _tick
}

_tick() {
  const dt = this.runtime.dt;        // seconds since last frame
  this._myTimer += dt;
  this._tickAnimations(dt * 1000);   // convert to ms if your logic needs it
}
```

### `_postCreate()` — behaviors only

Optional override called **after** the associated object instance has finished being created. The behavior constructor fires during instance creation, so the final state of `this.instance` is not yet ready. Use `_postCreate()` when you need to inspect or configure `this.instance` as soon as construction is complete — earlier than `_tick()` but later than `constructor()`.

```js
_postCreate() {
  // this.instance is fully ready here
  this._phys = this.instance.behaviors["Physics"] ?? null;
}
```

> **Behavior-only.** Plugins do not have `_postCreate()` — use `onCreate()` instead.

### `_tick2()` and `_postTick()`

Two additional per-frame hooks available alongside `_tick()`:

- **`_tick2()`** — called every tick **just after events are run** (after `_tick()`). Enable with `this._setTicking2(true)` in the constructor.
- **`_postTick()`** — called every tick **after all other behaviors have had their `_tick()` called**. Lets one behavior observe the state applied by other behaviors. Enable with `this._setPostTicking(true)` in the constructor.

> Prefer `_tick()` over `_postTick()` wherever possible. The post-ticking order between different behaviors is not reliable.

```js
constructor() {
  super();
  this._setTicking(true);      // enable _tick()  — runs before events
  this._setTicking2(true);     // enable _tick2() — runs after events
  this._setPostTicking(true);  // enable _postTick() — runs after all _tick() calls
}

_tick() {
  // Main per-frame update — use this for physics, movement, input
  const dt = this.runtime.dt;
}

_tick2() {
  // Secondary tick — runs after the event sheet for this frame
  // Good for reacting to event-sheet-driven state changes
}

_postTick() {
  // Post-tick — runs after all behaviors have ticked
  // Good for observing the final state of sibling behaviors
}
```

### Ticking utility methods

```js
// Start/stop ticking (call in constructor)
this._setTicking(true)       // enable _tick()
this._setTicking(false)      // disable _tick()  — stop ticking when no longer needed
this._setTicking2(true)      // enable _tick2()
this._setTicking2(false)
this._setPostTicking(true)   // enable _postTick()
this._setPostTicking(false)

// Query ticking state
this._isTicking()            // boolean — is _tick() currently enabled?
this._isTicking2()           // boolean — is _tick2() currently enabled?
this._isPostTicking()        // boolean — is _postTick() currently enabled?
```

> **Redundant calls are safe and ignored.** If you call `_setTicking(true)` three times then `_setTicking(false)` once, ticking is stopped — calls do **not** stack.

> **Stop ticking when idle** to reduce per-frame overhead. Re-enable when needed (e.g. enable on an event, disable after animation finishes).

### `_release()`

Called when the instance is destroyed. Clean up event listeners. Always call `super._release()`.

```js
_release() {
  super._release();
  // cleanup...
}
```

### `_saveToJson()` / `_loadFromJson(o)`

Called by C3 for savegames and `persistAcrossLayouts`. Return a plain serializable object. Restore from `o` in `_loadFromJson`.

```js
_saveToJson() {
  return { myData: [...this._myData.entries()] };
}

_loadFromJson(o) {
  this._myData = new Map(o.myData ?? []);
}
```

> **No `_restoredFromSave` guard needed.** C3's save/load flow is simply: `constructor()` runs first (initializing from editor properties), then `_loadFromJson(o)` runs and overwrites with the saved values. Every property you want persisted just needs to be in both methods. There is no need for a boolean flag to suppress `_getInitProperties()` on load — `_loadFromJson` overwrites the constructor values automatically.

---

## 4. The Runtime API (`this.runtime`)

Available from `onCreate()` onwards.

### Layout

```js
this.runtime.layout          // ILayout — the current layout
this.runtime.layout.name     // string — layout name
this.runtime.layout.width    // number — layout width in px
this.runtime.layout.height   // number
this.runtime.layout.getLayer("LayerName")         // ILayer | null
this.runtime.layout.moveLayerToIndex(ref, index)  // reorder layers (may not exist on older builds)
```

### Objects / Instances

```js
this.runtime.objects         // iterable of all IObjectType
this.runtime.objects.Sprite  // IObjectType for a specific object

// Addon SDK v2 naming: use 'instance' as the loop variable, not 'inst' or '_inst'
for (const objType of this.runtime.objects) {
  for (const instance of objType.getAllInstances()) {
    instance.x; instance.y; instance.layer; // IWorldInstance properties
    instance.timeScale = 1;                  // per-object timescale override
    instance.restoreTimeScale();             // revert to following global timescale
  }
}
```

### Timing

```js
this.runtime.dt         // Delta time in seconds (time since last frame) — read this inside _tick()
this.runtime.dt * 1000  // Delta time in milliseconds
```

### Events

```js
// Layout change events — use these when you need to react to layout transitions
this.runtime.addEventListener("beforelayout", () => {});  // layout about to change
this.runtime.addEventListener("afterlayout",  () => {});  // new layout started
```

> **Do not use `addEventListener("tick", ...)`** for per-frame logic. Use `_setTicking(true)` in `constructor()` and implement `_tick(dt)` instead — this is the correct C3 SDK approach.

---

## 5. Layer API

A layer reference (`ILayer`) returned by `runtime.layout.getLayer()`.

### Identity

```js
layer.name    // string — layer name (read-only)
layer.index   // number — zero-based Z-order index on its layout (bottom = 0, read-only)
layer.runtime // IRuntime — reference back to the runtime
layer.layout  // ILayout — the layout this layer belongs to
```

### Visibility

```js
layer.isVisible              // boolean — get/set: this layer's own visibility
layer.isSelfAndParentsVisible // boolean — read-only: true only if this layer AND all parents are visible
```

> Use `isSelfAndParentsVisible` when you need to know if the layer is actually drawn. A layer can have `isVisible = true` but still be hidden because a parent group is hidden.

### Interactivity

```js
layer.isInteractive              // boolean — get/set: this layer's own interactive state
layer.isSelfAndParentsInteractive // boolean — read-only: true only if this layer AND all parents are interactive
```

> Same caveat as visibility — a layer can be `isInteractive = true` but blocked by a non-interactive parent.

### Appearance

```js
layer.opacity         // number 0–1 — get/set (layer transparency)
layer.isTransparent   // boolean — get/set: if true, background color is ignored
layer.backgroundColor // [r, g, b] array (0–1 each) — get/set background color (ignored when transparent)
```

> `opacity` and `scrollX`/`scrollY` are not part of the scripting API spec but are valid layer properties in the addon SDK runtime context.

### Scroll position (used for slide animations)

```js
layer.scrollX  // number — horizontal scroll offset in px
layer.scrollY  // number — vertical scroll offset in px
```

### Hierarchy

```js
layer.parentLayer   // ILayer | null — direct parent layer, null if top-level

// Iterators
layer.subLayers()    // Iterator<ILayer> — direct sub-layers in Z order (direct children only)
layer.allSubLayers() // Iterator<ILayer> — ALL descendants recursively in Z order
layer.parentLayers() // Iterator<ILayer> — walks up the parent chain toward the root
```

> `allSubLayers()` is the preferred way to find a layer anywhere in a group hierarchy. Use `subLayers()` only when you specifically need direct children.

### Events

```js
layer.addEventListener("eventName", callback)
layer.removeEventListener("eventName", callback)
```

### Layer search scope — critical difference

```js
// Searches ALL layers in the current layout by name, any depth — always works
this.runtime.layout.getLayer("MyLayer")

// Searches only DIRECT children of a group layer — misses nested layers
groupLayerRef.getLayer("MyLayer")  // ✗ returns null if layer is more than 1 level deep
```

When resolving layers inside a container group, **never rely on `groupRef.getLayer()` alone**. It only searches direct children. Fall through to `allSubLayers()` (or a recursive search) for deeper nesting:

```js
_resolveLayer(name) {
  const containerRef = this.runtime.layout.getLayer(this._getProperty("uiContainerLayer"));
  if (!containerRef) return null;
  // Option A: fast path, but only works for direct children
  if (typeof containerRef.getLayer === "function") {
    const ref = containerRef.getLayer(name);
    if (ref) return ref;   // only accept non-null — fall through if null
  }
  // Option B: allSubLayers() iterates all descendants recursively
  if (typeof containerRef.allSubLayers === "function") {
    for (const layer of containerRef.allSubLayers()) {
      if (layer.name === name) return layer;
    }
    return null;
  }
  // Option C: manual recursive fallback for older C3 builds
  return this._resolveLayerInGroup(name, containerRef);
}
```

### Moving layers (Z-order)

```js
// Try runtime-level first, fallback to container-level
this.runtime.layout.moveLayerToIndex(layerRef, index);
containerRef.moveLayerToIndex(layerRef, index);
```

> **Note:** `moveLayerToIndex` may not exist on older C3 builds. Always feature-detect with `typeof ... === "function"` before calling.

---

## 6. Instance API (`this`)

Methods available on the runtime instance (inherited from the SDK base class).

### Property access

```js
this._getInitProperties()  // returns array of initial property values (constructor only)
// Index corresponds to declaration order in config.caw.js properties array
```

**Usage pattern in `constructor()`:**

```js
const properties = this._getInitProperties();
this._maxHealth      = properties[0];
this._invulnerable   = properties[1];
this._destroyOnDeath = properties[2];
```

> `_getInitProperties()` always returns the full array when called in `constructor()`. Direct index access is safe — no null check or ternary fallback needed.

### Triggering conditions

```js
// Fire a trigger condition — synchronous
// Plugins:
super._trigger(self.C3.Plugins["addon_id"].Cnds["ConditionMethodName"]);
// Behaviors:
super._trigger(self.C3.Behaviors["addon_id"].Cnds["ConditionMethodName"]);

// Fire a trigger — async (returns Promise, useful with C3 debugger breakpoints)
await this._triggerAsync(self.C3.Behaviors["addon_id"].Cnds["ConditionMethodName"]);
```

> In CAW, the framework `_trigger(method)` helper (Section 10) wraps `super._trigger` for you using the correct namespace automatically. Call `this._trigger("MethodName")` in instance code rather than `super._trigger(...)` directly.

### DOM-side communication (DOM plugins only)

```js
this._sendToDOM("message-id", data);
this._sendToDOMAsync("message-id", data);  // returns Promise
this._addDOMMessageHandler("reply-id", (data) => {});
```

---

## 7. ACE Authoring

### Action file (`a.ActionName.js`)

```js
export const config = {
  listName:    "Do something",          // shown in the action picker
  displayText: "Do {0} with {1}",       // shown in event sheet ({0} = first param)
  description: "What it does. Use for X.", // shown in tooltip — keep beginner-friendly
  isAsync:     false,
  highlight:   false,
  deprecated:  false,
  params: [
    {
      id:           "target",
      name:         "Target",
      desc:         "Param description.",
      type:         "string",          // see §8 for all types
      initialValue: '""',
    },
  ],
};

export const expose = true;  // true = method is copied onto the instance prototype

export default function (target) {
  // `this` is the runtime instance
  this._actDoSomething(target);
}
```

### Condition file (`c.ConditionName.js`)

```js
export const config = {
  listName:    "Is something true",
  displayText: "Is {0} true",
  description: "True when X. Use for Y.",
  isTrigger:   false,   // true = this is a trigger, not a polled condition
  isInvertible: true,   // false for triggers
  highlight:   false,
  deprecated:  false,
  params: [],
};

export const expose = false;

export default function () {
  return true; // must return boolean
}
```

### Trigger condition (conditions with `isTrigger: true`)

```js
export const config = {
  listName:    "On something happened",
  displayText: "On something happened",
  description: "Triggers when X. Use for Y.",
  isTrigger:   true,
  highlight:   false,
  deprecated:  false,
  params: [
    { id: "layerName", name: "Layer", desc: "The layer to watch.", type: "string", initialValue: '""' },
  ],
};

export default function (layerName) {
  return this._lastChangedLayer === layerName; // filter: only fire for the named layer
}

// To fire the trigger from instance.js:
// this._trigger("OnSomethingHappened");
```

### Expression file (`e.ExpressionName.js`)

```js
export const config = {
  returnType:  "string",  // "string", "number", or "any"
  description: "Returns X. Use for Y.",
  highlight:   false,
  deprecated:  false,
  params: [
    {
      id:   "layerName",
      name: "Layer name",
      desc: "The layer to query.",
      type: "string",
      // ⚠ DO NOT add initialValue to expression params — it is not supported
    },
  ],
};

export const expose = false;

export default function (layerName) {
  return this._layers.get(layerName)?.state ?? "";
}
```

### `expose` flag

- `true` — the default export function is **copied onto the instance prototype** under the PascalCase ACE ID (derived from the filename). The logic can live directly in the ACE — no separate private helper needed. Any other ACE can then call `this.AceName()` to invoke it.
- `false` — the function exists only as the ACE handler; not accessible as a method.

#### Prefer logic-in-ACE over delegation

When `expose: true`, write the logic directly in the default export instead of delegating to a private `_method`:

```js
// ✓ Preferred — logic lives in the ACE, exposed as this.SetBuffActive()
export const expose = true;
export default function (buffId, active) {
  const buff = this._buffMap.get(buffId);
  if (buff) buff.active = active;
}

// ✗ Unnecessary indirection — expose: true makes the private helper redundant
export const expose = true;
export default function (buffId, active) {
  this._setBuffActive(buffId, active);  // just calls a private copy of the same logic
}
```

Other ACEs call the exposed method by its PascalCase name (matching the filename):

```js
// In EnableDisableBuffsByTag, instead of calling a private _setBuffActive helper:
export default function (tag, active) {
  const matching = [];
  for (const [buffId, buff] of this._buffMap) {
    if (buff.tags.has(tag)) matching.push(buffId);
  }
  for (const buffId of matching) this.SetBuffActive(buffId, active); // calls the exposed ACE method
}
```

#### Identifying an addon's public scripting API

To enumerate everything callable from C3 Script or external JS:
- **PascalCase callable actions** — any ACE with `expose: true`. The method name matches the filename (`a.RemoveBuff.js` → `RemoveBuff()`).
- **Public getter/query methods** — any method on `src/runtime/instance.js` whose name does **not** start with `_`. These are camelCase helpers added directly to the class (not ACEs), used to expose read-only state that expressions cannot provide from script.

### Construct ACE JSON Model and CAW Mapping

Construct defines ACEs in `aces.json` as categories containing `conditions`, `actions`, and `expressions` arrays:

```json
{
  "category1": {
    "conditions": [
      { "id": "my-condition", "scriptName": "MyCondition" }
    ],
    "actions": [
      { "id": "my-action", "scriptName": "MyAction" }
    ],
    "expressions": [
      { "id": "my-expression", "expressionName": "MyExpression", "returnType": "number" }
    ]
  }
}
```

Construct 3 uses **string ACE IDs** (not Construct 2 numeric IDs), and those IDs are tied to language keys.

In CAW projects (like this repo), you usually author ACEs in `src/aces/` files and the build system generates `aces.json` for you.

### JSON schema

Construct ignores a top-level `$schema` property in `aces.json`, so schema validation/autocomplete can be used safely in editors that support JSON schema.

### Never delete released ACEs

After release, do not delete actions/conditions/expressions that shipped publicly. Existing projects reference ACE IDs, and deleting them can break project loading/event resolution.

Deprecate instead:

- Keep the ACE ID and runtime handler intact.
- Mark it deprecated.
- Point the description to replacement ACEs.

In both raw Construct ACE JSON and in this CAW workflow, the correct flag is `isDeprecated: true`. Use it directly in the ACE `config` object — no mapping or transformation is needed.

### Category rules

- Category key is the category ID.
- Display text comes from language strings, not the raw category ID.
- Behaviors may use an empty-string default category (`""`) which uses the behavior name; additional categories appear as `BehaviorName: Category Name`.

### Shared ACE fields

Common fields across conditions/actions/expressions:

- `id`: unique ACE ID string (recommended lowercase-with-dashes).
- `c2id`: optional Construct 2 numeric mapping for import compatibility.
- `scriptName` (conditions/actions) or `expressionName` (expressions).
- `isDeprecated` (use directly in CAW ACE config — passed through as-is to the generated JSON).
- `highlight`.
- `params`.

Required minimums:

- Conditions/actions: `id` + `scriptName`.
- Expressions: `id` + `expressionName` + `returnType`.

### Condition-specific fields

- `isTrigger`
- `isFakeTrigger`
- `isStatic`
- `isLooping`
- `isInvertible`
- `isCompatibleWithTriggers`

### Action-specific field

- `isAsync`

### Expression-specific fields

- `returnType`: `number`, `string`, `any`
- `isVariadicParameters`

### Parameter model (full reference)

Each ACE `params` entry can include:

- `id`
- `c2id` (optional)
- `type`
- `initialValue`
- `items` (for `combo`)
- `itemGroups` (for `combo-grouped`)
- `allowedPluginIds` (for `object`)
- `filter` (for `projectfile`)
- `autocompleteId` (for string constants autocomplete)

Condition/action parameter types:

- `number`
- `string`
- `any`
- `boolean`
- `combo`
- `combo-grouped`
- `cmp`
- `object`
- `objectname`
- `projectfile`
- `layer`
- `layout`
- `keyb`
- `instancevar`
- `instancevarbool`
- `eventvar`
- `eventvarbool`
- `animation`
- `objinstancevar`

Expression parameter types are limited to:

- `number`
- `string`
- `any`

### Language strings are separate from ACE JSON

`aces.json` identifies ACEs and parameter structure, but editor UI text is provided by language files. Always keep IDs stable and update language entries when ACE IDs/params change.

### CAW workflow checklist for deprecation-safe releases

1. Add new ACEs under new IDs/categories.
2. Keep old ACE IDs intact for compatibility.
3. Mark old ACEs as deprecated and document replacements.
4. Never recycle old IDs with new behavior.
5. Verify generated ACE output and event-sheet behavior in a test project.

---

## 8. Parameter Types Reference

Used in ACE `params[].type`.

| Type | Description | Extra fields |
|---|---|---|
| `"string"` | Text input | `initialValue: '""'` |
| `"number"` | Numeric input | `initialValue: "0"` |
| `"any"` | Any expression (string or number) | `initialValue: '""'` |
| `"boolean"` | Checkbox | `initialValue: "false"` |
| `"combo"` | Dropdown | `initialValue: "key"`, `items: [{ key: "Label" }]` |
| `"object"` | Object picker | — |
| `"layer"` | Layer picker | — |
| `"layout"` | Layout picker | — |
| `"keyb"` | Keyboard key picker | — |

### Combo parameter example

```js
{
  id:           "animType",
  name:         "Animation",
  desc:         "The animation to play.",
  type:         "combo",
  initialValue: "fade",
  items: [
    { fade:       "Fade" },
    { slideLeft:  "Slide Left" },
    { slideRight: "Slide Right" },
    { none:       "None (instant)" },
  ],
}
```

> **Important:** `initialValue` for combo must match one of the item **keys** (not the display label).
> **Important:** Expression params do **not** support `initialValue` — omit it.

---

## 9. Property Types Reference

Used in `config.caw.js` `properties[]`. Each entry must have `type`, `id`, `name`, `desc`, and `options`.

| Type | Description | Key options |
|---|---|---|
| `PROPERTY_TYPE.TEXT` | Single-line text input | `initialValue: ""` |
| `PROPERTY_TYPE.LONGTEXT` | Multi-line text input | `initialValue: ""` |
| `PROPERTY_TYPE.INTEGER` | Whole number | `initialValue: 0`, `minValue`, `maxValue` |
| `PROPERTY_TYPE.FLOAT` | Decimal number | `initialValue: 0.0` |
| `PROPERTY_TYPE.PERCENT` | 0–1 stored, shown as 0–100% | `initialValue: 0.5` |
| `PROPERTY_TYPE.CHECK` | Boolean checkbox | `initialValue: false` |
| `PROPERTY_TYPE.COMBO` | Dropdown | `initialValue: "key"`, `items: [{ key: "Label" }]` |
| `PROPERTY_TYPE.COLOR` | Color picker | `initialValue: [r, g, b]` (0–1 each) |
| `PROPERTY_TYPE.OBJECT` | Object reference picker | — |
| `PROPERTY_TYPE.GROUP` | Group header (no value) | — |
| `PROPERTY_TYPE.FONT` | Font picker | — |
| `PROPERTY_TYPE.LINK` | Clickable link | `linkCallback`, `callbackType` |
| `PROPERTY_TYPE.INFO` | Read-only info text | — |

### Property declaration order is critical

`_getInitProperties()` returns properties as a plain array. Index 0 is the first declared property, index 1 is the second, and so on. Document the index mapping in a comment.

```js
// 0: myText  1: myNumber  2: myCheck
export const properties = [
  { type: PROPERTY_TYPE.TEXT,    id: "myText",   ... },
  { type: PROPERTY_TYPE.INTEGER, id: "myNumber", ... },
  { type: PROPERTY_TYPE.CHECK,   id: "myCheck",  ... },
];
```

---

## 10. Triggers and Conditions

### Firing a trigger from instance code

Use the CAW framework `_trigger()` helper (wraps `dispatch` + `super._trigger`):

```js
// In instance.js — after some event happens:
this._trigger("OnLayerStateChanged");
```

The string must exactly match the ACE method name (the function name used in the condition file's default export, or the generated method name from the file name).

### How C3 maps condition file names to method names

CAW generates a method name from the file name:
- `c.LayerIsAnimating.js` → method `LayerIsAnimating`
- `cnd.OnScreenShown.js` → method `OnScreenShown`

The method name passed to `_trigger()` or `super._trigger()` must match this exactly (case-sensitive).

### Trigger with a filter parameter

When a trigger has a param (e.g. a layer name), the condition function's return value acts as a filter — C3 only fires the event for listeners where the function returns `true`:

```js
export default function (layerName) {
  return this._lastChangedLayer === layerName;
}
```

Store the "current" value (`_lastChangedLayer`) before calling `_trigger()`.

### CAW Trigger Workflow (Enforced)

Use this exact workflow for all trigger conditions in CAW addons.

1. In runtime instance code, set a dedicated event-state field first (for example `_lastChangedLayer`, `_lastStartedSpringId`, `_lastCompletedSpringId`).
2. Immediately call `this._trigger("TriggerMethodName")`.
3. In the trigger condition ACE (`isTrigger: true`), only filter against that event-state field.

Mandatory rules:

- MUST set event-state before calling `_trigger()`.
- MUST use a dedicated field per trigger event when events differ (for example started vs stopped vs reached).
- MUST keep trigger conditions as pure filters (`return !value || this._lastEventField === value;`).
- MUST ensure `_trigger("...")` method names exactly match CAW-generated condition method names.
- NEVER compute trigger state lazily inside the condition ACE.
- NEVER rely on unrelated or generic last-event fields when a specific event field exists.
- NEVER mutate runtime state from inside trigger condition ACEs.

Canonical pattern:

```js
// runtime/instance.js
this._lastStartedSpringId = springId;
this._trigger("OnSpringStarted");

// aces/.../c.OnSpringStarted.js
export default function (springId) {
  const value = String(springId ?? "").trim();
  return !value || this._lastStartedSpringId === value;
}
```

Anti-pattern (do not do this):

```js
// ❌ Wrong: trigger fired before writing event state
this._trigger("OnSpringStarted");
this._lastStartedSpringId = springId;

// ❌ Wrong: using a generic event field for a specific trigger
return !value || this._lastSpringId === value;
```

### CAW _trigger helper (framework-specific)

```js
_trigger(method) {
  this.dispatch(method);                                         // CAW event system
  super._trigger(self.C3.Plugins[id].Cnds[method]);             // C3 native trigger
}
```

---

## 11. The C3 Global (`self.C3`)

At runtime everything lives under `self.C3`:

```js
self.C3.Plugins["addon_id"]          // plugin namespace
self.C3.Plugins["addon_id"].Cnds     // all condition functions (for triggers)
self.C3.Plugins["addon_id"].Acts     // all action functions
self.C3.Plugins["addon_id"].Exps     // all expression functions

self.C3.Behaviors["addon_id"]        // same but for behaviors
```

Use `AddonTypeMap[addonType]` (imported from `template/addonTypeMap.js`) to get the right key (`"Plugins"` or `"Behaviors"`) without hardcoding it.

---

## 12. C3 Debugger Support

Implement `_getDebuggerProperties()` on the instance class to expose live state in the C3 Debugger panel (F12 during preview).

```js
_getDebuggerProperties() {
  const sections = [];

  // Each section = one collapsible group in the panel
  sections.push({
    title: `$${this.type.name} — Summary`,   // plugins: this.type.name
    properties: [
      { name: "$Active item",  value: this._activeItem ?? "(none)" },
      { name: "$Total items",  value: this._items.size },
      { name: "$Debug mode",   value: this._debug,  onedit: v => { this._debug = !!v; } },
      { name: "$Max speed",    value: this._maxSpeed, onedit: v => { this._maxSpeed = +v; } },
    ],
  });

  // Per-item section
  for (const item of this._items.values()) {
    sections.push({
      title: `$Item: ${item.id}`,
      properties: [
        { name: "$State", value: item.state },
        { name: "$Value", value: item.value },
      ],
    });
  }

  return sections; // return the array of section objects
}
```

### Rules

- `title` — string shown as the section header
- `properties` — array of `{ name: string, value: any }`
- `value` can be a string, number, or boolean — C3 renders it automatically
- The method is called every frame by the debugger; keep it fast (no heavy computation)
- No setup needed in `config.caw.js` — C3 calls it automatically if it exists

### Making properties editable

Add an `onedit` callback to any property entry to make it editable in the debugger panel. The user can click the value to change it live without restarting the layout:

```js
// Read-only (no onedit)
{ name: "$Jumps remaining", value: this._jumpsRemaining }

// Editable number
{ name: "$Max speed", value: this._maxSpeed, onedit: v => { this._maxSpeed = +v; } }

// Editable number with clamping
{ name: "$Max jumps", value: this._maxJumps, onedit: v => { this._maxJumps = Math.max(0, Math.floor(+v)); } }

// Editable boolean — renders as a toggle
{ name: "$Variable jump", value: this._variableJump, onedit: v => { this._variableJump = !!v; } }

// Editable boolean that calls a method (preferred when setX() has side-effect cleanup)
{ name: "$Enabled", value: this._enabled, onedit: v => { this.setEnabled(!!v); } }
```

**Key name:** `onedit` — not `callback`. Using `callback` silently does nothing.

**Value is always a string** when `onedit` is called, even for numeric properties. Always coerce: `+v` for numbers, `!!v` for booleans.

**Booleans render as a toggle** (checkbox) when the current `value` is `true` or `false`. The `onedit` callback receives the new boolean value as a string `"true"` / `"false"` — use `!!v` or `v === "true"` to coerce correctly.

### Translation strings — IMPORTANT

C3 treats every `title` and `name` string as a **translation key** and looks it up in the addon's translation file. If the key is missing, C3 logs an error every frame.

**Prefix all `title` and `name` strings with `$`** to mark them as literal strings that skip translation lookup:

```js
{ name: "$Active screen", value: ... }   // ✓ — literal string, no lookup, no error
{ name: "Active screen",  value: ... }   // ✗ — treated as a translation key, logs error if missing
```

**Do not add debugger strings to the translation file manually.** CAW regenerates the translation file on every build and will overwrite manual additions. The `$` prefix is the correct and only approach.

### Section title best practice

Use the addon's type name so the section title is always correct, regardless of how the user renames the object:

```js
// Plugins:
title: `$${this.type.name} — Summary`

// Behaviors:
title: `$${this.behaviorType.name} — Summary`
```

---

## 13. Editor Instance

`src/editor/instance.js` — runs in the **editor** (not at game runtime). There are three base classes depending on the plugin type. All live in the editor module; none of this code runs at runtime.

### Class hierarchy

```
IInstanceBase
  └── IWorldInstanceBase     (world-type plugins only — has a canvas presence)
IBehaviorInstanceBase        (behaviors — separate hierarchy)
```

---

### IInstanceBase — plugins (Object and World types)

Base class for all editor-side plugin instances. Cannot be directly constructed; only used as a base class.

#### Properties

```js
this._sdkType  // Reference to the associated SDK type class
this._inst     // IObjectInstance (or IWorldInstance for world plugins) — editor interface
```

#### Methods

```js
// Lifecycle — all optional overrides
Release()                          // Called when the instance is released (deleted from editor)
OnCreate()                         // Called when the instance is created in the editor
OnPropertyChanged(id, value)       // Called when a property with the given ID is changed

// Construct 2 compatibility — optional override
LoadC2Property(name, valueString)  // Custom logic for importing a property from a C2 project

// Project model accessors
GetProject()      // Returns IProject — the instance's associated project
GetObjectType()   // Returns IObjectType — convenience accessor for the object type class
GetInstance()     // Returns IObjectInstance — the editor interface for this instance
```

#### Minimal plugin editor instance

```js
export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
    }

    OnCreate() {}

    OnPropertyChanged(id, value) {
      if (id === "myProperty") {
        // React to the property change in the editor
      }
    }

    Release() {}
  };
}
```

---

### IWorldInstanceBase — world-type plugins only

Derives from `IInstanceBase`. Cannot be directly constructed; only used as a base class. Add these overrides when your plugin has a visible canvas presence (sprites, tiles, custom draw).

#### Methods

```js
// Called when the user explicitly places the instance in the layout.
// Right place to set additional defaults such as initial size or origin.
// A reference to the ILayoutView the instance was placed in is provided.
OnPlacedInLayout(iLayoutView) {}

// Called when Construct wants the instance to draw itself in the Layout View.
// iRenderer  — IWebGLRenderer, used for issuing draw commands
// iDrawParams — IDrawParams, provides additional draw context
Draw(iRenderer, iDrawParams) {}

// Load a texture from an IAnimationFrame. Async — returns null while loading,
// then IWebGLTexture once ready. Construct auto-refreshes the Layout View when ready.
// Render a semitransparent placeholder while null.
GetTexture(animationFrame) {}

// When a texture has successfully loaded, returns an SDK.Rect of the image region
// in texture co-ordinates. Due to Construct's spritesheeting, this is usually a
// subset of the full texture — always use this, never assume 0,0,1,1.
GetTexRect() {}

// Returns true if the most recent texture load failed.
// Plugins typically switch the placeholder to a red color in this case.
HadTextureError() {}

// Optional: enables percentage-size options in the Properties Bar.
// Override IsOriginalSizeKnown() to return true, and GetOriginalSize() to
// return the original size as an array [width, height, depth]. For 2D
// content return zero for depth. Default: IsOriginalSizeKnown() returns
// false (feature disabled).
// NOTE (SDK v2): the current manual documents the size as a single
// GetOriginalSize() -> [w, h, depth] method, NOT separate
// GetOriginalWidth()/GetOriginalHeight() getters (the SDK v1-era form).
IsOriginalSizeKnown() { return false; }
GetOriginalSize()     { return [0, 0, 0]; }   // [width, height, depth]

// Optional: enables double-click / double-tap interaction in the Layout View.
// Also adds an "Edit" option to the context menu.
// Typical use: open the image editor for image-based plugins.
// Default: HasDoubleTapHandler() returns false (feature disabled).
// To enable: return true from HasDoubleTapHandler() and override OnDoubleTap().
HasDoubleTapHandler() { return false; }
OnDoubleTap()         {}

// Optional: indicates whether the instance renders to its own Z plane (the
// base of the object for 3D objects with depth). Default true (the value
// when not overridden) — correct for 2D content. Return false for 3D content
// that does not render to its own Z plane (e.g. a 3D model). Used to help
// mitigate Z-fighting.
RendersToOwnZPlane()  { return true; }
```

#### Texture loading pattern

```js
Draw(iRenderer, iDrawParams) {
  const texture = this.GetTexture(this._inst.GetFirstAnimationFrame());

  if (texture === null) {
    if (this.HadTextureError()) {
      // Draw a red error placeholder
      iRenderer.SetColorFillMode();
      iRenderer.SetColor(1, 0, 0, 0.5);
      iRenderer.Rect(iDrawParams.GetLayoutRect());
    } else {
      // Draw a neutral loading placeholder
      iRenderer.SetColorFillMode();
      iRenderer.SetColor(0.5, 0.5, 0.5, 0.3);
      iRenderer.Rect(iDrawParams.GetLayoutRect());
    }
    return;
  }

  // Texture is ready — use GetTexRect() for the correct UV region
  const texRect = this.GetTexRect();
  iRenderer.SetTexture(texture);
  iRenderer.TexturedRect(iDrawParams.GetLayoutRect(), texRect);
}
```

> **⚠ `iDrawParams.GetLayoutRect()` does not exist on the current `IDrawParams` — field-verified gotcha.** Per §23, `IDrawParams` exposes only `GetDt()` and `GetLayoutView()`. The snippet above is legacy; on current SDK v2 it returns `undefined`, and any preview built from it collapses to layout origin **(0, 0)** instead of the instance. To draw a world-plugin preview **at the instance** (and have it honour rotation, size, and scene-graph parent transform), get the instance geometry from `this._inst`, not from draw params:
> ```js
> Draw(iRenderer, iDrawParams) {
>   const quad = this._inst.GetQuad();          // SDK.Quad in final layout coords (incl. parent hierarchy)
>   // or: const rect = this._inst.GetBoundingBox();  // SDK.Rect (axis-aligned, no rotation)
>   const tex = this.GetTexture(this._inst.GetFirstAnimationFrame());
>   if (tex) iRenderer.Quad3(quad, this.GetTexRect());
> }
> ```
> `GetQuad()` already includes the scene-graph parent transform, so a parented instance previews in the correct place automatically. `GetBoundingBox()` is the axis-aligned fallback when you don't need rotation.

#### Original size example

```js
// Enables "100%" / "50%" size shortcuts in the Properties Bar
IsOriginalSizeKnown() { return true; }
GetOriginalSize()     { return [this._originalWidth, this._originalHeight, 0]; }
```

---

### IBehaviorInstanceBase — behaviors

Separate hierarchy from `IInstanceBase`. Cannot be directly constructed; only used as a base class. The editor-side behavior instance has its own set of properties and methods.

#### Properties

```js
this._sdkBehaviorType   // Reference to the associated SDK behavior type class
this._behaviorInstance  // IBehaviorInstance — the editor interface for this behavior instance
```

#### Methods

```js
// Lifecycle — all optional overrides
OnPropertyChanged(id, value)  // Called when a property with the given ID is changed
OnAddedInEditor()             // Called when the behavior is created due to the user adding
                              // a new behavior in the editor. Good for setting initial defaults.

// Accessors
GetBehaviorInstance()   // Returns IBehaviorInstance — the editor interface for this behavior
GetSdkBehaviorType()    // Returns the associated SDK behavior type class
```

> **`SetPropertyEnabled` does not exist on `IBehaviorInstanceBase`.** It is a plugin-only API. Attempting to call it on a behavior instance will throw `TypeError: SetPropertyEnabled is not a function`. To conditionally control property visibility for behaviors, the only option is informational (e.g. property descriptions) — there is no editor-side way to gray out or hide behavior properties dynamically.

#### Minimal behavior editor instance

```js
export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
    }

    OnAddedInEditor() {
      // Set initial property defaults when the behavior is first added
    }

    OnPropertyChanged(id, value) {
      if (id === "myProp") {
        // React to property changes
      }
    }
  };
}
```

> **`OnAddedInEditor()` vs `OnCreate()`** — `OnAddedInEditor()` fires only when the user actively adds the behavior from the editor UI (a one-time setup opportunity). `OnCreate()` (on `IInstanceBase`) fires every time an instance is created in the editor, including on project load.

---

## 14. CAW Build & Dev Workflow

### Commands

```bash
npm run dev    # Start dev server with hot reload. URL shown in terminal.
npm run build  # Production build → {id}-{version}.c3addon in project root
```

### Dev server

- When `.dev-server-running` exists in the project root, the server is already running
- The dev server rebuilds on every file save — do **not** run `npm run build` to check for errors; just save and watch the terminal
- Use the localhost URL in Construct 3 (File → New tab, paste the URL) to test live

### Build output

```
{id}-{version}.c3addon   ← final file to distribute
dist/                    ← intermediate build artifacts (auto-cleaned)
generated/               ← generated ACE files (auto-cleaned)
```

### buildconfig.js options

```js
export const cleanup = {
  keepExport:     false,  // Keep dist/export folder after build
  keepExportStep: false,  // Keep intermediate export step files
  keepGenerated:  false,  // Keep generated/ folder
};
export const terserValidation = "error";  // "error" | "warning" | "skip"
export const disableTips      = false;
export const disableWarnings  = false;
```

---

## 15. Gotchas and Patterns

### `this.runtime` is unavailable in `constructor()`

Use `onCreate()` for anything that needs the runtime, layout, or layers.

### C3 can call ACE actions before `onCreate()` fires

**All data structures (Maps, Sets, arrays) must be initialized in `constructor()`, not `onCreate()`.**

C3's lifecycle does not guarantee that `onCreate()` runs before event sheet actions. If the user places an action early in the event sheet (e.g. on Start of Layout), C3 may call it before `onCreate()` completes. Any property accessed before initialization will throw.

```js
// ✗ WRONG — _layers is undefined if an action fires before onCreate()
onCreate() {
  this._layers = new Map();
}

// ✓ CORRECT — always safe to access from any ACE
constructor() {
  super();
  this._layers    = new Map();
  this._focusStack = [];
  this._popupStack = [];
}
onCreate() {
  // Only things that genuinely require this.runtime go here
  this._containerRef = this.runtime.layout.getLayer(this._getProperty("uiContainerLayer"));
}
```

Rule of thumb: initialize data in `constructor()`, resolve runtime/layout refs in `onCreate()`.

### Property index order is fixed

`_getInitProperties()` returns values by **position**, not by name. If you reorder properties in `config.caw.js`, update all index references in `constructor()`. Always document the mapping with a comment.

### Expression params do not support `initialValue`

Unlike action/condition params, expression params must **not** have `initialValue`. Including it causes a build warning or error.

### Combo `initialValue` must be the key, not the label

```js
items: [{ fade: "Fade" }, { slideLeft: "Slide Left" }]
initialValue: "fade"  // ✓ correct — the key
initialValue: "Fade"  // ✗ wrong — the display label
```

### Do not call C3 layer APIs on untrusted layer refs

Always null-check layer refs before reading `visible`, `interactive`, etc. Layer refs can be null if the named layer doesn't exist or hasn't been resolved yet.

```js
if (entry?.ref) {
  entry.ref.visible = false;
}
```

### `moveLayerToIndex` feature detection

Not all C3 builds expose this method. Always guard:

```js
if (typeof this.runtime.layout.moveLayerToIndex === "function") {
  this.runtime.layout.moveLayerToIndex(ref, index);
} else if (typeof this._containerRef.moveLayerToIndex === "function") {
  this._containerRef.moveLayerToIndex(ref, index);
}
```

### Triggers must set state before firing

Store the "current value" in an instance variable first, then call `_trigger()`. Condition filter functions read those variables when C3 evaluates listeners.

```js
this._lastChangedLayer = layerName;
this._lastChangedState = newState;
this._trigger("OnLayerStateChanged");
```

### `IsSingleGlobal: true` — one instance, global scope

When set, only one instance of the plugin can exist. There are no per-object instances. The plugin object is shared across the whole project. This is the right choice for manager-type plugins (UI systems, audio managers, save systems).

### `IsSingleGlobal` — cached layer refs go stale on layout change

`onCreate()` is called **only once** for a `IsSingleGlobal` plugin (on first layout). If the user navigates to a different layout, any layer ref cached in `onCreate()` now points to a **destroyed layer from the previous layout**.

**Never cache a layer ref across layouts.** Always resolve fresh from the current layout inside the action or helper method:

```js
// ✗ WRONG — stale after layout change
onCreate() {
  this._containerRef = this.runtime.layout.getLayer("UI Container");
}
_resolveLayer(name) {
  return this._containerRef?.getLayer(name) ?? null;  // null after layout change
}

// ✓ CORRECT — resolves against the current live layout every time
_getContainerRef() {
  return this.runtime.layout.getLayer(this._getProperty("uiContainerLayer")) ?? null;
}
_resolveLayer(name) {
  const container = this._getContainerRef();
  if (!container) return null;
  if (typeof container.getLayer === "function") {
    const ref = container.getLayer(name);
    if (ref) return ref;
  }
  return this._resolveLayerInGroup(name, container);
}
```

It is fine to cache the ref for the **duration of a single action** (local variable). The problem is storing it as `this._containerRef` and reusing it across actions/ticks/layouts.

### `expose: true` copies the ACE function onto the instance prototype

The method name on the prototype is the **PascalCase ACE ID** derived from the filename (`a.SetBuffActive.js` → `this.SetBuffActive()`). Write the logic directly in the ACE's default export — no private `_helper` method needed. Any ACE with `expose: true` is automatically callable from other ACEs, from `instance.js`, and from C3 Script.

Use `expose: false` for ACEs that only need to run as event sheet actions and don't need to be called from anywhere else.

### Async actions

```js
export const config = { isAsync: true, ... };

export default async function () {
  await someAsyncOperation();
}
```

C3 will `await` the returned Promise before continuing to the next action in the event sheet.

### DOM-side plugins

When `hasDomside: true`, `src/domside/index.js` runs in the DOM context (separate from the C3 runtime sandbox). Use `this._sendToDOM()` / `this._addDOMMessageHandler()` to communicate between the two sides.

### Group layer iteration compatibility

Different C3 builds expose either `subLayers()` or `layers()` on group layer refs. Check for both:

```js
const iter = typeof layerRef.subLayers === "function"
  ? layerRef.subLayers()
  : typeof layerRef.layers === "function"
    ? layerRef.layers()
    : null;
```

### `this` context in ACE default exports

The `export default function` is called with `this` bound to the runtime instance. Arrow functions would lose this binding — always use `function` keyword:

```js
export default function (param) {  // ✓
  this._doSomething(param);
}

export default (param) => {        // ✗ — `this` is undefined
  this._doSomething(param);
}
```

### Runtime colour filtering: prefer `colorRgb`

For `IWorldInstance` runtime colour changes, use `instance.colorRgb = [r, g, b]` with 0-1 floats.

```js
this.instance.colorRgb = [1, 1, 1];
this.instance.colorRgb = [0.5, 0.8, 1.0];
```

Do not build your main runtime path around guessed method names like `setColor()` or `getColorRgb()` when targeting standard Construct instances. The documented `colorRgb` property is the stable surface.

---

## 16. Behavior-Specific Patterns

Behaviors differ from plugins in important ways. `this` in a behavior runtime instance is **the behavior**, not the C3 object it is attached to.

### `this` vs `this.instance`

```js
this           // the behavior runtime instance (ACE methods, _tick, _trigger, etc.)
this.instance  // the IWorldInstance the behavior is attached to (x, y, behaviors, width, height, etc.)
this.instance.runtime  // the IRuntime — same as C3's scripting runtime (available from onCreate() onwards)
```

### `this.instance` is NULL in the behavior `constructor()`

The attached instance is not wired up yet when the constructor runs. Accessing it will throw.

```js
constructor() {
  super();
  this._setTicking(true);
  // ✗ DO NOT: this.instance.x — throws, instance is null
  // ✗ DO NOT: this.instance.behaviors — throws
  // ✓ Safe: primitives, Maps, Arrays, _getInitProperties()
}

_tick() {
  if (!this._initialized) {
    this._initialized = true;
    // ✓ Safe to access this.instance here
    this._setup();
  }
}
```

### Robust behavior instance retrieval (Platform, Solid, Jumpthru, etc.)

`this.instance.behaviors` is usually object-like, but can also be iterable on some runtime surfaces. Use a helper that supports both and always checks enabled state.

```js
function normalizeTypeName(v) {
  return String(v || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function isBehaviorEnabled(b) {
  return !!b && b.isEnabled !== false && b.enabled !== false;
}

function forEachBehaviorEntry(inst, callback) {
  const bag = inst?.behaviors;
  if (!bag) return;

  if (Array.isArray(bag)) {
    for (let i = 0; i < bag.length; i++) callback(String(i), bag[i]);
    return;
  }

  if (typeof bag[Symbol.iterator] === "function") {
    for (const item of bag) {
      if (Array.isArray(item) && item.length >= 2) callback(String(item[0]), item[1]);
      else callback("", item);
    }
    return;
  }

  for (const [key, value] of Object.entries(bag)) callback(key, value);
}

function getEnabledBehaviorByType(inst, typeName) {
  const bag = inst?.behaviors;
  if (!bag) return null;

  const target = normalizeTypeName(typeName);

  // Fast path: direct key lookup (works in most projects)
  const direct = bag[typeName] || bag[target];
  if (isBehaviorEnabled(direct)) return direct;

  // Fallback: iterate entries and match key or behaviorType.name
  let found = null;
  forEachBehaviorEntry(inst, (key, behavior) => {
    if (found || !isBehaviorEnabled(behavior)) return;

    const keyName = normalizeTypeName(key);
    const behaviorTypeName = normalizeTypeName(behavior?.behaviorType?.name);
    if (keyName === target || behaviorTypeName === target) {
      found = behavior;
    }
  });

  return found;
}

function findPlatformBehavior(inst) {
  return getEnabledBehaviorByType(inst, "Platform");
}

function findSolidBehavior(inst) {
  return getEnabledBehaviorByType(inst, "Solid");
}
```

Known built-in behavior type names include:

```js
// "Platform", "Solid", "Jumpthru", "Physics", "Bullet", "Pathfinding"
```

Example usage:

```js
const plat = findPlatformBehavior(this.instance);
if (plat) {
  const maxSpeed = plat.maxSpeed;       // px/s
  const jumpStrength = plat.jumpStrength; // px/s
  const gravity = plat.gravity;         // px/s²
  const isOnFloor = plat.isOnFloor;
  const isJumping = plat.isJumping;
  const isFalling = plat.isFalling;
  plat.vectorX = 200;
  plat.vectorY = -400;
}
```

### Combo ACE parameters are numeric indices at runtime

C3 passes combo parameters as a **0-based index number**, not the key string. The same applies whether the combo is in an action, condition, or expression.

```js
// In aces.js:
items: [{ balanced: "Balanced" }, { shortest: "Shortest" }, { safest: "Safest" }]
initialValue: "balanced"

// At runtime, the ACE function receives:  0  (not "balanced")

// ✗ WRONG — always false, value is a number
export default function (strategy) {
  if (strategy === "balanced") { ... }
}

// ✓ CORRECT — map index → key first
export default function (strategy) {
  const s = this._combo(strategy, ["balanced", "shortest", "safest"]);
  if (s === "balanced") { ... }
}
```

Add this helper to `instance.js`:

```js
_combo(value, keys) {
  return keys[value] ?? keys[0];
}
```

> **Note:** Property combos from `_getInitProperties()` also arrive as 0-based indices. Use the same mapping pattern: `const strategyMap = ["balanced", "shortest", "safest"]; const s = strategyMap[properties[6]];`

### Combo item keys must not contain hyphens

```js
// ✗ WRONG — value will NOT equal "one-way" at runtime (comparison always fails)
items: [{ "one-way": "One-way" }, { "two-way": "Two-way" }]

// ✓ CORRECT — underscore keys work correctly
items: [{ one_way: "One-way" }, { two_way: "Two-way" }]
```

### Conditions and expressions share the same ACE ID namespace

In CAW, condition and expression ACE IDs must be globally unique across both types. A condition named `IsAtPortal` blocks an expression also named `IsAtPortal` — one silently wins.

```js
// ✗ WRONG — namespace collision, one will override the other
condition("Portals", "IsAtPortal", { ... }, function() { return ...; });
expression("Portals", "IsAtPortal", { ... }, function() { return ...; });

// ✓ CORRECT — use distinct names
condition("Portals", "IsAtPortal",       { ... }, function() { return ...; });  // condition
expression("Portals", "PortalIsActive",  { ... }, function() { return ...; });  // expression
```

### Every `this.aceXxx()` call must have a matching method

If an ACE calls `this.aceDoSomething(x, y)` but `aceDoSomething` is not defined on the instance, it fails silently at runtime with no error. Always cross-check after editing `aces.js` and `instance.js` separately.

---

## 17. Advanced Runtime Scripting API

These APIs are accessible from within behavior/plugin code via `this.instance.runtime` (behaviors) or `this.runtime` (plugins). They match C3's scripting API (`IRuntime`).

### Spatial collision queries

```js
// Efficient broadphase query — returns instances overlapping a rect
// Much faster than getAllInstances() + manual distance checks
const candidates = this.instance.runtime.collisions.getCollisionCandidates(
  [objectTypeA, objectTypeB],   // array of IObjectType references
  { left: x, top: y, right: x + w, bottom: y + h }  // plain rect object or DOMRect
);

// May return duplicates — always deduplicate
const unique = new Set(candidates);
for (const inst of unique) {
  // inst is an IWorldInstance
}
```

### Detecting object capabilities at runtime

```js
// Is an instance a Tilemap? (tilemaps have getTileAt, regular sprites don't)
if (typeof inst.getTileAt === "function") {
  const tileId = inst.getTileAt(gx, gy);  // returns tile ID, -1 if empty
}

// Does an instance have a specific behavior enabled?
for (const b of Object.values(inst.behaviors)) {
  if (b.behaviorType?.name === "Solid" && b.isEnabled) {
    // this is an active solid object
  }
  if (b.behaviorType?.name === "Jumpthru" && b.isEnabled) {
    // this is an active one-way platform
  }
}
```

### Collision polygon vertices

```js
// Get the collision polygon for the current animation frame (normalized 0–1 coords)
const frame = inst.animation.currentFrame;
const count = frame.getPolyPointCount();

for (let i = 0; i < count; i++) {
  // Normalized → world space
  const wx = inst.x + (frame.getPolyPointX(i) - 0.5) * inst.width;
  const wy = inst.y + (frame.getPolyPointY(i) - 0.5) * inst.height;
}
```

> Polygon points are normalized to 0–1 relative to the sprite's bounding box. Multiply by `inst.width`/`inst.height` and offset by `inst.x`/`inst.y` (the instance origin, typically center) to get world-space coordinates. Useful for accurate obstacle rasterization instead of bounding-box fill.

### Getting an instance by UID

```js
const inst = this.instance.runtime.getInstanceByUid(uid);
if (inst === null) {
  // Instance was destroyed — remove from any tracking structures
}
```

### Layout and grid access

```js
this.instance.runtime.layout.width   // total layout pixel width
this.instance.runtime.layout.height  // total layout pixel height

// Iterating all instances of a known object type
for (const inst of this.instance.runtime.objects.MyObjectName.getAllInstances()) {
  inst.x; inst.y;
}
```

---

## 18. Index-Based Collection Iteration Pattern

When an addon exposes a variable-length list of items (abilities, tags, waypoints, etc.), the idiomatic C3 event sheet iteration is **Count + Index** — not a comma-separated string with `tokencount`/`tokenat`.

### The pattern

Expose two ACEs:

```js
// Expression: count
expression("MyCategory", "CountItems", {
  returnType: "number",
  description: "Number of items in the list.",
  params: [],
}, function () {
  return this._items.size;
});

// Expression: item by index
expression("MyCategory", "GetItemByIndex", {
  returnType: "string",
  description: "Get the item ID at the given 0-based index. Returns empty string if out of bounds.",
  params: [
    { id: "index", name: "Index", desc: "0-based position.", type: "number" },
  ],
}, function (index) {
  return Array.from(this._items.keys())[index] ?? "";
});
```

In the event sheet the user then writes a standard `Repeat` loop:

```
Repeat MyBehavior.CountItems() times
  Local: item = MyBehavior.GetItemByIndex(loopindex)
  → actions using item
```

`loopindex` is a built-in C3 expression that equals the current iteration (0, 1, 2, …).

### Variant: filtered list by tag

When the list is filtered by a runtime value (e.g. abilities with a specific tag), the index expression accepts the filter as a parameter:

```js
// Expression: count with filter
expression("Tags", "CountAbilitiesByTag", {
  returnType: "number",
  params: [{ id: "tag", name: "Tag", type: "string" }],
}, function (tag) {
  return this._abilitiesWithTag(tag).length;
});

// Expression: item by index with filter
expression("Tags", "GetAbilityByTagIndex", {
  returnType: "string",
  params: [
    { id: "tag",   name: "Tag",   type: "string" },
    { id: "index", name: "Index", type: "number" },
  ],
}, function (tag, index) {
  return this._abilitiesWithTag(tag)[index] ?? "";
});
```

Event sheet usage:

```
Repeat Player.SimpleAbilities.CountAbilitiesByTag("offensive") times
  Local: abilityID = Player.SimpleAbilities.GetAbilityByTagIndex("offensive", loopindex)
  → Condition: Is ability ready abilityID
  → Action: Activate ability abilityID
```

### Why not a comma-separated string?

| Approach | Pros | Cons |
|---|---|---|
| `tokencount`/`tokenat` on a string | No extra expression needed | Non-idiomatic; string parsing is fragile; `tokenat` is O(n²) on large lists |
| **Count + Index** (this pattern) | C3-native `Repeat` loop; clean `loopindex`; O(1) per access | Requires two expressions instead of one |

The Count + Index pattern also avoids edge cases with ability IDs that contain commas.

### Internal helper

The internal JS helper that both expressions share can be any function returning an ordered array:

```js
_abilitiesWithTag(tag) {
  const result = [];
  for (const [id, ability] of this._abilities) {
    if (ability.tags && ability.tags.has(tag)) result.push(id);
  }
  return result;
}
```

For very large collections, cache this result per-frame and invalidate when the collection changes.

---

## 19. SPOT Pattern — Shared State Across Behavior Instances

> **This is a last-resort workaround, not a general pattern.** Before using it, ask whether a separate plugin with `IsSingleGlobal: true` would serve instead — that is the clean C3-native answer for singletons and avoids all of the complexity below.

Behaviors don't have true static class members in C3's module system. The **Shared Per-Object-Type (SPOT)** pattern uses a module-scope `Map` to simulate a singleton shared between all instances of the same behavior.

### When you actually need this

You only need SPOT when you simultaneously require **both** of the following:

1. **Per-instance behavior** — each object needs its own `_tick`, its own ACE context, its own runtime state (e.g. current path, movement phase, waypoints)
2. **Cross-instance shared data** — some expensive structure (a navigation graph, a physics world, a shared connection pool) that all instances of the same type should read from one copy rather than rebuild independently

If you only need a singleton and don't need per-instance `_tick` or per-instance ACE context, use `IsSingleGlobal: true` on a separate plugin. That gives you a proper C3-visible singleton with no workarounds, no stale-key handling, and no restart edge cases — at the cost of a second addon dependency for users.

The navigation graph in this addon is the archetypal SPOT use case: each character needs independent path and movement state, but rebuilding the entire walkability graph once per character would be wasteful. The graph is shared; the path is not.

### Basic structure

```js
// At the TOP of instance.js — module scope, outside the class
const _sharedManagers = new Map();  // keyed by layoutUID or objectTypeUID

export default function (parentClass) {
  return class extends parentClass {

    _getOrCreateManager() {
      const key = this.instance.runtime.layout.uid ?? "global";
      if (!_sharedManagers.has(key)) {
        _sharedManagers.set(key, {
          graph: null,
          nodes: [],
          initialized: false,
        });
      }
      return _sharedManagers.get(key);
    }

    _tick() {
      if (!this._initialized) {
        this._initialized = true;
        this._manager = this._getOrCreateManager();
        // First instance creates the shared data; later instances reuse it
        if (!this._manager.initialized) {
          this._manager.initialized = true;
          this._buildSharedGraph();
        }
      }
    }
  };
}
```

### Layout restart / scene reload

On layout restart, C3 destroys and recreates all instances. The module-scope `Map` persists (JS module is not reloaded). Stale keys must be detected and cleared:

```js
_getOrCreateManager() {
  const key = this.instance.runtime.layout.uid;
  const existing = _sharedManagers.get(key);
  if (existing && existing.layoutUID !== key) {
    // Stale entry from a previous run — purge it
    _sharedManagers.delete(key);
  }
  if (!_sharedManagers.has(key)) {
    _sharedManagers.set(key, { layoutUID: key, graph: null, initialized: false });
  }
  return _sharedManagers.get(key);
}
```

### When to use SPOT vs per-instance state

| Data | Where to store |
|---|---|
| Navigation graph, obstacle map, shared pathfinding data | Module-scope Map (SPOT) |
| Per-character path, current waypoint, movement state | Instance properties (`this._path`, etc.) |
| Debug settings that apply to all agents | Module-scope Map (SPOT) |
| Character-specific properties (speed overrides, target) | Instance properties |

### Prefer `IsSingleGlobal: true` when possible

For most shared-state needs (audio managers, save systems, UI controllers, game state), a separate plugin with `IsSingleGlobal: true` is the correct answer. It gives a proper C3-native singleton: one object on the layout, globally accessible ACEs, no module-scope Map, no stale-key detection, no restart edge cases.

```js
// config.caw.js of a manager plugin
export const info = {
  Set: { IsSingleGlobal: true }
};
```

Use SPOT only when you've ruled this out — typically because splitting into two addons would mean the behavior needs to reach back into the plugin for data on every tick, and the inter-addon lookup cost or coupling becomes its own problem.

---

## Editor API Reference

Editor-side interfaces and tooling used in the Construct editor context.

---

### CAW Workflow — Editor Code

This section explains how the Editor API interfaces map to the files you edit when working with the **CAW (Construct Addon Wizard)** framework.

#### File locations

```
src/editor/instance.js   ← Editor-side instance class (property handlers, lifecycle hooks)
src/editor/type.js       ← Editor-side type class (rarely needed; global editor setup)
```

#### Export pattern

Every CAW editor file exports a factory function. The CAW build system calls it with the appropriate base class and uses the returned class:

```js
// src/editor/instance.js
export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
    }

    OnCreate() { /* fires every time an instance exists in the editor, including project load */ }
    OnPropertyChanged(id, value) { /* id matches the property id string in config.caw.js */ }
    Release() { /* cleanup when the instance is deleted from the editor */ }
  };
}
```

The `instanceClass` argument is the base class provided by the C3 editor SDK. You **do not** import or reference it directly — CAW injects it at build time. Simply extend it.

#### Base class by addon type

| Addon type | Base class injected | Key `this` properties |
|---|---|---|
| Object plugin (`PLUGIN_TYPE.OBJECT`) | `IInstanceBase` | `this._inst` → `IObjectInstance` |
| World plugin (`PLUGIN_TYPE.WORLD`) | `IWorldInstanceBase` | `this._inst` → `IWorldInstance` |
| Behavior (`ADDON_TYPE.BEHAVIOR`) | `IBehaviorInstanceBase` | `this._behaviorInstance` → `IBehaviorInstance` |

#### `this._inst` vs `this._behaviorInstance`

- **Plugins** — use `this._inst` to access the `IObjectInstance` or `IWorldInstance` editor interface.
- **Behaviors** — use `this._behaviorInstance` to access the `IBehaviorInstance` editor interface. There is **no** `this._inst` on behavior instances.

```js
// Plugin editor instance
OnPropertyChanged(id, value) {
  const objInst = this._inst;  // IObjectInstance
  objInst.SetPropertyValue("someOtherProp", value);
}

// Behavior editor instance
OnPropertyChanged(id, value) {
  const behInst = this._behaviorInstance;  // IBehaviorInstance
  behInst.SetPropertyValue("someOtherProp", value);
}
```

#### `OnPropertyChanged` — property IDs

The `id` argument is the exact string from the `id` field of the matching entry in `config.caw.js` `properties[]`:

```js
// config.caw.js
export const properties = [
  { type: PROPERTY_TYPE.COMBO, id: "obstacleMode",  name: "Obstacle mode",  ... },
  { type: PROPERTY_TYPE.TEXT,  id: "obstacleTag",   name: "Obstacle tag",   ... },
];

// src/editor/instance.js
OnPropertyChanged(id, value) {
  if (id === "obstacleMode") {  // matches the "id" field above
    // value is the current combo key string (e.g. "none", "tags")
  }
}
```

#### Lifecycle hooks — when they fire

| Hook | Plugin | Behavior | When it fires |
|---|---|---|---|
| `constructor()` | ✓ | ✓ | Every editor session, before any other hook |
| `OnCreate()` | ✓ | — | Every time the instance exists in the editor (project load, paste, etc.) |
| `OnAddedInEditor()` | — | ✓ | Only when the user actively adds the behavior from the Add Behavior dialog — one-time setup |
| `OnPropertyChanged(id, value)` | ✓ | ✓ | Whenever the user edits a property in the Properties panel |
| `Release()` | ✓ | ✓ | When the instance is deleted from the editor |
| `OnPlacedInLayout(iLayoutView)` | world only | — | When the user drops an instance onto the layout |
| `Draw(iRenderer, iDrawParams)` | world only | — | Every Layout View repaint |

#### `SetPropertyEnabled` — behavior limitation

`SetPropertyEnabled` exists on `IInstanceBase` (plugins only). **It does not exist on `IBehaviorInstanceBase`.**

Calling it on a behavior instance throws:
```
TypeError: n.SetPropertyEnabled is not a function
```

There is no equivalent for behaviors. You cannot programmatically gray out or hide behavior properties based on other property values. Workarounds:
- Use descriptive property names/descriptions to imply dependency
- Use a single `PROPERTY_TYPE.COMBO` that encodes multiple options instead of separate dependent properties

#### Minimal behavior editor instance (CAW pattern)

```js
// src/editor/instance.js — behavior addon
export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
    }

    OnAddedInEditor() {
      // One-time initialization when the user adds this behavior
      // e.g. set sensible initial property defaults based on the object's current state
    }

    OnPropertyChanged(id, value) {
      // React to property changes in the editor (logging, cross-property sync)
      // Cannot call SetPropertyEnabled here — use descriptive names instead
    }
  };
}
```

#### Minimal plugin editor instance (CAW pattern)

```js
// src/editor/instance.js — object/world plugin addon
export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
    }

    OnCreate() {
      // Runs on every editor load — keep lightweight
    }

    OnPropertyChanged(id, value) {
      if (id === "mode") {
        // Enable/disable other properties conditionally (plugins only)
        this._inst.SetPropertyEnabled("dependentProp", value !== "none");
      }
    }

    Release() {}
  };
}
```

---

## 20. Object Interfaces

The interfaces in this section are part of the Editor API reference.

---

### IAnimation interface

The IAnimation interface represents an animation within an animated object type. This is only applicable to animated plugins such as Sprite.

#### Methods

```js
GetName()
// Return animation name string.

GetObjectType()
// Return owning IObjectType.

GetFrames()
// Return IAnimationFrame[] for this animation.

AddFrame(blob, width, height)
// Add a frame. Returns Promise<IAnimationFrame>.
// Overloads:
// - no parameters: add empty frame with default size
// - blob only: decode blob to determine size
// - blob + size: use provided size (must be correct), skip decode-size pass
// - no blob + size: add empty frame with specified size

SetSpeed(s)
GetSpeed()
// Set/get animation speed in frames per second.

SetLooping(l)
IsLooping()
// Set/get looping flag.

SetPingPong(p)
IsPingPong()
// Set/get ping-pong flag (alternating forward/backward).

SetRepeatCount(r)
GetRepeatCount()
// Set/get repeat count.

SetRepeatTo(f)
GetRepeatTo()
// Set/get frame index to return to on repeat. Must be valid index.

Delete()
// Delete animation immediately without confirmation. Cannot be undone.
```

---

### IAnimationFrame interface

The IAnimationFrame interface represents an image for an object type. Despite the name, it is also used for single-image plugins (e.g. Tiled Background).

IAnimationFrame cannot be directly rendered. You must first create a texture from it.

You usually do not need to call the texture-loading methods directly; pass IAnimationFrame to IWorldInstanceBase.GetTexture().

#### Methods

```js
GetObjectType()
// Return associated IObjectType.

GetWidth()
GetHeight()
// Return image size in pixels.

GetCachedWebGLTexture()
// Return IWebGLTexture if already loaded, else null.

GetTexRect()
// Return SDK.Rect texture coordinates for this image on loaded texture.
// Valid only if GetCachedWebGLTexture() returned a texture.

async LoadWebGLTexture()
// Start async texture load for this image.
// Use only if GetCachedWebGLTexture() returned null.
// Returns Promise<IWebGLTexture>.

GetBlob()
// Return Blob of current image content (PNG/WebP/AVIF compressed image).

ReplaceBlobAndDecode(blob)
// Replace frame image content with decoded blob image.
// May change frame size.
// Returns Promise resolved when update is complete.

SetDuration(d)
GetDuration()
// Set/get frame duration multiplier (1 = normal speed, 2 = twice as long).

SetOriginX(x)
SetOriginY(y)
GetOriginX()
GetOriginY()
// Set/get origin in texture coordinates [0..1], default 0.5.

GetImagePoints()
// Return IImagePoint[] for this image.

AddImagePoint(name, x, y)
// Add image point at texture coordinates [0..1].
// Returns IImagePoint.

GetCollisionPoly()
// Return ICollisionPoly for this image.

Delete()
// Delete frame immediately without confirmation. Cannot be undone.
```

---

### IBehaviorInstance interface

The IBehaviorInstance interface represents a behavior instance in Construct.

#### Methods

```js
GetProject()
// Return associated IProject.

GetObjectInstance()
// Return associated IObjectInstance or IWorldInstance.

GetPropertyValue(id)
// Get behavior property value by property ID.

SetPropertyValue(id, value)
// Set behavior property value by property ID.

GetExternalSdkInstance()
// Return custom behavior SDK editor instance class (derivative of IBehaviorInstanceBase)
// for installed addons. Returns null for built-in behaviors.
```

Be careful taking dependencies on behavior classes from other developers. Use only documented/supported methods. Breaking changes in third-party addons can crash the editor.

---

### IBehaviorType interface

The IBehaviorType interface represents a behavior type in Construct.

A behavior type is the behavior equivalent of an object type: one behavior type per object type, and one behavior instance per object instance.

#### Methods

```js
GetProject()
// Return associated IProject.

GetName()
// Return behavior type name string.
```

---

### ICollisionPoly interface

The ICollisionPoly interface represents the collision polygon for an IAnimationFrame.

Points are stored as an array of alternating X/Y numbers in texture coordinates [0..1], connected in a loop.

#### Methods

```js
Reset()
// Reset polygon to default bounding-box shape.

IsDefault()
// Return true if polygon matches default bounding-box shape.

GetPoints()
// Return number[] alternating X,Y components.
// Array length is always even, with at least 3 points.

SetPoints(arr)
// Set polygon points from alternating X,Y number array.
// Array length must be even and at least 6 (3 points).
```

---

### IContainer interface

The IContainer interface represents a Construct container: a group of object types always created, destroyed, and picked together.

#### Methods

```js
GetMembers()
// Return IObjectType[] members. Containers always have at least two members while active.

SetSelectMode(m)
GetSelectMode()
// Set/get select mode: "normal" | "all" | "wrap".

RemoveObjectType(objectType)
// Remove a member object type.

IsActive()
// Return active state.
// If members fall below two, container becomes inactive and effectively deleted.
```

---

### IFamily interface

The IFamily interface represents a family: a group of object types treated as one.

All family members must use the same plugin. IFamily derives from IObjectClass. Families can be created with IProject.CreateFamily().

#### Methods

```js
GetMembers()
// Return IObjectType[] family members.

SetMembers(objectTypes)
// Replace members from IObjectType[].
// Members must be compatible: same plugin and no naming conflicts
// across instance variables, behaviors, and effects.
```

---

### IImagePoint interface

The IImagePoint interface represents an image point on an IAnimationFrame.

#### Methods

```js
GetAnimationFrame()
// Return associated IAnimationFrame.

SetName(name)
GetName()
// Set/get image point name.

SetX(x)
SetY(y)
GetX()
GetY()
// Set/get position in texture coordinates [0..1].
```

---

### IObjectClass interface

IObjectClass is the base class of IObjectType and IFamily.

IObjectClass cannot be created directly. Any parameter accepting IObjectClass can accept IObjectType or IFamily.

#### Methods

```js
GetName()
// Return object class name.

GetProject()
// Return associated IProject.

Delete()
// Delete object class immediately with no confirmation.
// Removes all events referencing it. Cannot be undone.
```

Use with care.

---

### IObjectInstance interface

The IObjectInstance interface represents an instance in Construct.

#### Methods

```js
GetProject()
// Return associated IProject.

GetObjectType()
// Return associated IObjectType.

GetUID()
// Return editor-assigned unique UID.

GetPropertyValue(id)
// Get plugin property by ID.
// Color properties return SDK.Color.

SetPropertyValue(id, value)
// Set plugin property by ID.
// Color properties require SDK.Color value.

GetExternalSdkInstance()
// Return custom plugin SDK editor instance class (derivative of IInstanceBase)
// for installed addons. Returns null for built-in plugins.
```

Be careful taking dependencies on classes from other developers. Use only documented/supported methods. Breaking changes in third-party addons can crash the editor.

---

### IObjectType interface

The IObjectType interface represents an object type in Construct. It derives from IObjectClass.

#### Methods

```js
GetImage()
// Return IAnimationFrame for object image.
// Plugin must specify SetHasImage(true) in IPluginInfo.

EditImage()
// Open Animations Editor for object image.
// Plugin must specify SetHasImage(true).

GetAnimations()
// Return IAnimation[] for object type.
// Only applies to animated plugin types.

AddAnimation(animName, frameBlob, frameWidth, frameHeight)
// Add animation (and required first frame).
// Frame args are optional and follow IAnimation.AddFrame() behavior.
// Returns Promise<IAnimation>.

GetAllInstances()
// Return all IObjectInstance/IWorldInstance of this type across project layouts.

CreateWorldInstance(layer)
// Create new instance on given ILayer. Returns IWorldInstance.
// Applies only to world-type plugins.

IsInContainer()
// Return true if object type belongs to a container.

GetContainer()
// Return IContainer or null.

CreateContainer(initialObjectTypes)
// Create container from IObjectType[] members.
// Array must include this type, contain at least two members,
// and this type must not already be in a container.
// Returns IContainer.
```

---

### IWorldInstance interface

The IWorldInstance interface represents an instance of a world-type plugin in Construct. It derives from IObjectInstance.

#### Methods

```js
GetLayer()
// Return owning ILayer.

GetLayout()
// Return owning ILayout.

GetBoundingBox()
// Return SDK.Rect bounding box in layout coordinates.

GetQuad()
// Return SDK.Quad bounding quad in layout coordinates.

GetColor()
// Return premultiplied SDK.Color combining tint + opacity in alpha.

SetOpacity(o)
GetOpacity()
// Set/get opacity (alpha) in range [0..1].

SetX(x)
SetY(y)
SetXY(x, y)
GetX()
GetY()
GetXY()
// Set/get X and Y coordinates.

SetZ(z)
GetZ()
// Set/get Z position relative to layer Z elevation.

SetXYZ(x, y, z)
GetXYZ()
// Set/get X,Y,Z coordinates.

GetTotalZ()
// Get total Z = instance Z + layer Z elevation.

SetAngle(a)
GetAngle()
// Set/get angle in radians.

SetWidth(w)
SetHeight(h)
SetSize(w, h)
GetWidth()
GetHeight()
// Set/get size in pixels.

SetDepth(d)
GetDepth()
// Set/get Z-axis size in pixels (for 3D objects; 2D depth is zero).

SetOriginX(x)
SetOriginY(y)
SetOrigin(x, y)
GetOriginX()
GetOriginY()
// Set/get origin normalized to [0..1].

ApplyBlendMode(iRenderer)
// Apply this instance's Construct blend mode to IWebGLRenderer.
// Relevant when plugin supports effects.

SetSampling(sampling)
GetSampling()
// Set/get sampling mode string:
// "auto" | "nearest" | "bilinear" | "trilinear".

GetActiveSampling()
// Get active sampling mode.
// Differs from GetSampling() only when mode is "auto".
```

---

## 21. Model Interfaces

The model interfaces represent project structure in the editor: event sheets, parent rows, event blocks, layouts, layers, project roots, and project files.

---

### IEventBlock interface

The IEventBlock interface represents an event block in an event sheet. Event blocks contain conditions, actions, and optionally nested sub-events. It derives from IEventParentRow.

#### Creating an event block

The following example adds an On start of layout event to the event sheet associated with a given ILayoutView.

```js
// Note: this code is assumed to be in an async function
// First get the associated event sheet for the layout view
const eventSheet = layoutView.GetLayout().GetEventSheet();
if (eventSheet) // note the layout may not have an event sheet
{
  // Get the IObjectType for the System plugin
  const systemType = eventSheet.GetProject().GetSystemType();

  // Create an empty event block at the root level of the event sheet
  const eventBlock = await eventSheet.GetRoot().AddEventBlock();

  // Add an "On start of layout" condition
  eventBlock.AddCondition(systemType, null, "on-start-of-layout");

  // Example code for adding a "Set position" action
  // eventBlock.AddAction(iObjectType, null, "set-position", [100, 200]);
}
```

#### Finding condition and action IDs

Use the developer methods described in Finding addon IDs to discover valid condition/action IDs.

#### Methods

```js
AddCondition(iObjectClass, reserved, cndId, params)
AddAction(iObjectClass, reserved, actId, params)
```

These methods are documented together because they work the same way:

- iObjectClass: IObjectClass (IObjectType or IFamily)
- reserved: pass null (reserved for future use)
- cndId / actId: string ID, for example "on-start-of-layout"
- params: array with one element per parameter

Parameter values can be string, number, boolean, or IObjectType. Expression parameters use strings (any valid expression), and numbers are converted to strings. Object parameters can use IObjectClass.

---

### IEventParentRow interface

IEventParentRow is the base class for event-sheet rows that can contain nested events.

Examples:

- Event groups are parent rows.
- Event comments are not parent rows.
- The event sheet root is a parent row.

#### Methods

```js
async AddEventBlock()
// Add an empty child event block with no conditions/actions.
// Returns Promise<IEventBlock>.
```

---

### IEventSheet interface

IEventSheet represents an event sheet in the project model.

Since events can be nested, they are represented as a tree. GetRoot() returns the tree root.

#### Methods

```js
GetProject()
// Return associated IProject.

GetName()
// Return event sheet name.

GetRoot()
// Return root node as IEventParentRow.
```

---

### ILayer interface

ILayer represents a layer in the project model.

#### Methods

```js
GetName()
// Return layer name.

GetLayout()
// Return ILayout this layer belongs to.
```

---

### ILayout interface

ILayout represents a layout in the project model.

Note: ILayoutView is the editor view, while ILayout is the project data model.

#### Methods

```js
GetProject()
// Return associated IProject.

GetName()
// Return layout name.

GetAllLayers()
// Return ILayer[] for all layers on this layout.

GetEventSheet()
// Return IEventSheet assigned to this layout, or null.
```

---

### IProject interface

IProject provides top-level project access from the SDK.

#### Methods

```js
GetName()
// Return project name.

GetObjectTypeByName(name)
GetFamilyByName(name)
GetObjectClassByName(name)
// Look up by case-insensitive name.
// Return IObjectType / IFamily / either respectively, or null.

GetObjectClassBySID(sid)
// Look up by SID.
// Return IObjectType or IFamily, or null.
```

---

### IProjectFile interface

IProjectFile represents a project file added in Construct's Project Bar.

#### Methods

```js
GetName()
// Return filename.

GetPath()
// Return full export path using forward slashes.
// Path reflects exported project structure and may differ from Project Bar layout.
// Example: Music folder file "music.webm" => "media/music.webm".
// Files in the general Files folder are always root-relative.

GetProject()
// Return owning IProject.

GetBlob()
// Return Blob file contents.
```

---

### Misc Interfaces (ILang, IZipFile, IZipFileEntry)

These utility interfaces cover language string lookup and ZIP archive access in editor-side addon tooling.

---

### ILang — language string lookup

Use this interface to resolve strings from the addon language file.

Only look up strings from your own addon. Other language-file entries are not stable and may change at any time.

```js
// Context stack
PushContext(prefix)
// Pushes a context prefix.
// Example: PushContext("foo") then Get(".bar") == Get("foo.bar")
// If prefix starts with ".", it appends to current prefix.
// If prefix does not start with ".", it resets the current prefix.

PopContext()
// Pops a previously pushed context prefix.
// Always pair PushContext() with PopContext().

// Lookup
Get(context)
// Returns the translated string.
// If context starts with ".", it is relative to current context prefix.
// Otherwise it is treated as an absolute context.
```

For convenience, Construct also exposes this as a global function: `self.lang()`.

---

### IZipFile — zip archive access

Represents a ZIP file and provides file list/query and read helpers.

```js
PathExists(path)
// boolean — true if a path exists in the zip

GetFileList()
// string[] — all file paths in the zip

GetFirstEntryWithExtension(ext)
// IZipFileEntry | null — first matching entry for extension

GetEntry(path)
// IZipFileEntry | null — entry by exact path

ReadText(entry)
// Promise<string> — reads entry as plain text

ReadJson(entry)
// Promise<any> — reads text then parses JSON

ReadBlob(entry)
// Promise<Blob> — reads raw binary as Blob
```

---

### IZipFileEntry — opaque zip entry handle

Represents a single entry in an `IZipFile`.

This is an opaque reference and has no methods. Pass it to `IZipFile` read methods such as `ReadText()`, `ReadJson()`, and `ReadBlob()`.

---

## 22. Geometry Primitives

`SDK.Rect`, `SDK.Quad`, and `SDK.Color` are standalone geometry classes used throughout the editor SDK. They appear as return types from `IWorldInstance`, `IAnimationFrame`, and `IWebGLRenderer` methods, and can be constructed independently for general use.

---

### SDK.Rect — axis-aligned rectangle

```js
// Construction
new SDK.Rect()                           // all sides = 0
new SDK.Rect(left, top, right, bottom)

// Set
rect.set(left, top, right, bottom)      // set all sides in one call
rect.copy(otherRect)                     // copy from another SDK.Rect
rect.clone()                             // returns new SDK.Rect with same values

// Individual sides (get/set)
rect.setLeft(v)   / rect.getLeft()
rect.setTop(v)    / rect.getTop()
rect.setRight(v)  / rect.getRight()
rect.setBottom(v) / rect.getBottom()

// Dimensions
rect.width()       // right - left  (can be negative if right < left)
rect.height()      // bottom - top  (can be negative if bottom < top)
rect.midX()        // (left + right) / 2
rect.midY()        // (top + bottom) / 2

// Transform
rect.offset(x, y)          // add x to left+right, y to top+bottom (shifts entire rect)
rect.inflate(x, y)         // grow:  left-=x, top-=y, right+=x, bottom+=y
rect.deflate(x, y)         // shrink (opposite of inflate)
rect.multiply(x, y)        // multiply each side by the given factor on each axis
rect.divide(x, y)          // divide each side by the given factor on each axis
rect.clamp(l, t, r, b)     // clamp each side — rect cannot extend beyond the given bounds
rect.normalize()           // if right < left, swap them; if bottom < top, swap them
                           // ensures width() and height() are always positive

// Tests
rect.intersectsRect(other)  // boolean — true if this rect overlaps another SDK.Rect
rect.containsPoint(x, y)    // boolean — true if the point is inside this rect
```

> **`width()` and `height()` can return negative values** if `right < left` or `bottom < top`. Call `normalize()` first when this is possible.

> **Use explicit getter/setter methods** (`getLeft()` / `setLeft()`), not `.left` / `.right` property access. The geometry classes use methods throughout.

---

### SDK.Quad — four-point (possibly rotated) quad

The main primitive for rendering and rotated bounding boxes. Used by `IWorldInstance.GetQuad()`, renderer draw calls, and `setFromRotatedRect()`.

The four points are named by their default position in an unrotated rectangle: `tl` (top-left), `tr` (top-right), `br` (bottom-right), `bl` (bottom-left). For rotated quads the actual positions change, but the naming stays the same.

```js
// Construction
new SDK.Quad()
new SDK.Quad(tlx, tly, trx, try_, brx, bry, blx, bly)
// ⚠ Third parameter is try_ (underscore) — "try" is a reserved JS keyword

// Set
quad.set(tlx, tly, trx, try_, brx, bry, blx, bly)  // set all four points
quad.setRect(left, top, right, bottom)               // set as axis-aligned rect (useful before further modification)
quad.setFromRect(rect)                               // set from SDK.Rect (same as setRect but from object)
quad.setFromRotatedRect(rect, angleRadians)          // set as rect rotated about the origin
quad.copy(otherQuad)                                 // copy from another SDK.Quad

// Individual point getters/setters
quad.setTlx(n) / quad.getTlx()    // top-left x
quad.setTly(n) / quad.getTly()    // top-left y
quad.setTrx(n) / quad.getTrx()    // top-right x
quad.setTry(n) / quad.getTry()    // top-right y  (method is getTry / setTry, no underscore)
quad.setBrx(n) / quad.getBrx()    // bottom-right x
quad.setBry(n) / quad.getBry()    // bottom-right y
quad.setBlx(n) / quad.getBlx()    // bottom-left x
quad.setBly(n) / quad.getBly()    // bottom-left y

// Dimensions
quad.midX()                        // average of all four x components
quad.midY()                        // average of all four y components
quad.getBoundingBox(rect)          // writes AABB into a given SDK.Rect — avoids allocation

// Tests
quad.intersectsSegment(x1, y1, x2, y2)   // boolean — does the line segment intersect this quad?
quad.intersectsQuad(other)               // boolean — does another SDK.Quad intersect this quad?
quad.containsPoint(x, y)                 // boolean — is the point inside this quad?
```

> **`try_` in the constructor, `getTry()` in the getter.** The constructor parameter uses an underscore to avoid the `try` keyword. The getter/setter methods omit it: `getTry()` / `setTry()`.

> **`getBoundingBox(rect)` writes into a passed rect** — pass a pre-allocated `SDK.Rect` to avoid garbage: `const bb = new SDK.Rect(); quad.getBoundingBox(bb);`

> **`setRect()` and `setFromRect()` are only useful if you plan further modifications.** If you just need a rectangle, use `SDK.Rect` directly.

---

### SDK.Color — floating-point RGBA color

All components are in the `[0, 1]` range. The WebGL renderer uses **premultiplied alpha** — RGB components are multiplied by A before passing to the GPU. Some APIs return premultiplied colors, others return straight alpha; check the docs for each API.

```js
// Construction
new SDK.Color()                    // all components = 0
new SDK.Color(r, g, b, a)         // RGBA, each in [0, 1]

// Set
color.setRgb(r, g, b)             // set RGB only, alpha unchanged
color.setRgba(r, g, b, a)         // set all four components
color.copy(other)                  // copy RGBA from another SDK.Color
color.copyRgb(other)               // copy RGB only, alpha unchanged
color.clone()                      // returns a new SDK.Color with identical values

// Individual components
color.setR(v) / color.getR()
color.setG(v) / color.getG()
color.setB(v) / color.getB()
color.setA(v) / color.getA()
// Note: all floats in [0, 1]

// Comparison
color.equals(other)                // boolean — exact RGBA match with another SDK.Color
color.equalsIgnoringAlpha(other)   // boolean — RGB match only, alpha ignored
color.equalsRgb(r, g, b)          // boolean — exact RGB match against given components
color.equalsRgba(r, g, b, a)      // boolean — exact RGBA match against given components

// Alpha premultiplication
color.premultiply()                // multiply RGB by A — required before passing to renderer
color.unpremultiply()              // divide RGB by A — ⚠ LOSSY, avoid when possible
```

> **Premultiplied alpha is required for the renderer.** `IWorldInstance.GetColor()` already returns premultiplied. If you construct a color manually, call `color.premultiply()` before rendering.

> **`unpremultiply()` is lossy.** Dividing back loses precision when A < 1. Only use it when you genuinely need straight-alpha values (e.g. writing back to raw image data).

---

## 23. Graphics Interfaces

These interfaces are available in editor draw pipelines.

---

### IDrawParams interface

The IDrawParams interface provides additional parameters to a Draw() call in the SDK.

This interface cannot be directly constructed. It is only available in the Draw() call.

#### Methods

```js
GetDt()
// Return delta-time, the time since the last frame, in seconds.
// Typically around 1/60 (0.01666...).
// This is only valid when the Layout View is continually scrolling,
// such as dragging an instance to the edge of the Layout View.
// Otherwise it is a dummy non-zero value.

GetLayoutView()
// Return an ILayoutView interface representing the current Layout View being drawn.
```

---

### IWebGLRenderer interface

The IWebGLRenderer interface provides high-level draw commands for the Layout View canvas.

Despite the name, the renderer may be backed by WebGPU. This does not affect the API.
This interface cannot be directly constructed. It is only available as a Draw() parameter.

#### Renderer state

IWebGLRenderer uses persistent state, so a Draw() call should explicitly set intended state before drawing:

- Blend mode
- Fill mode (color fill, texture fill, smooth line fill)
- Color (SetColor/SetColorRgba). Alpha controls opacity in texture fill mode
- Texture (SetTexture), used only in texture fill mode

The renderer discards redundant state calls efficiently.

#### Methods

```js
SetAlphaBlendMode()
// Set premultiplied alpha blending mode.

SetBlendMode(blendMode)
// "normal" | "additive" | "copy" | "destination-over" | "source-in" |
// "destination-in" | "source-out" | "destination-out" | "source-atop" |
// "destination-atop" | "lighten" | "darken" | "multiply" | "screen"
// "normal" is equivalent to SetAlphaBlendMode().

SetColorFillMode()
// Solid color fill using current color.

SetTextureFillMode()
// Texture fill using current texture and current color alpha as opacity.

SetSmoothLineFillMode()
// Smooth line fill using current color.

SetColor(color)
// Set current color with SDK.Color.

SetColorRgba(r, g, b, a)
// Set current color from RGBA components.

SetOpacity(o)
// Set only alpha component of current color.

SetCurrentZ(z)
GetCurrentZ()
// Set/get current Z used by 2D draw calls without explicit Z.

ResetColor()
// Set current color to (1, 1, 1, 1).

Rect(rect)
Rect2(left, top, right, bottom)
// Draw rect from SDK.Rect or direct edges.

Quad(quad)
Quad2(tlx, tly, trx, try_, brx, bry, blx, bly)
// Draw quad from SDK.Quad or direct points.

Quad3(quad, rect)
// Draw SDK.Quad using source UV from SDK.Rect.

Quad4(quad, texQuad)
// Draw SDK.Quad using source UV from SDK.Quad.

Quad3D(tlx, tly, tlz, trx, try_, trz, brx, bry, brz, blx, bly, blz, rect)
Quad3D2(tlx, tly, tlz, trx, try_, trz, brx, bry, brz, blx, bly, blz, texQuad)
// Draw 3D quad using SDK.Rect or SDK.Quad UV source.

DrawMesh(posArr, uvArr, indexArr, colorArr)
// Draw textured triangles from position, UV, index, and optional per-vertex color arrays.

ConvexPoly(pointsArray)
// Draw convex polygon from alternating X,Y array.
// Array length must be even and at least 6 (3 points).

Line(x1, y1, x2, y2)
// Draw quad-line with current line width.

TexturedLine(x1, y1, x2, y2, u, v)
// Draw textured quad-line with (u,0) start and (v,0) end UVs.

LineRect(left, top, right, bottom)
LineRect2(rect)
LineQuad(quad)
// Draw line outlines for rect/SDK.Rect/SDK.Quad.

PushLineWidth(w)
PopLineWidth()
// Set and restore current line width.

PushLineCap(lineCap)
PopLineCap()
// Set and restore current line cap. lineCap: "butt" or "square".

SetTexture(texture, sampling = "auto")
// Set current IWebGLTexture. sampling: "auto" | "nearest" | "bilinear" | "trilinear".
// "auto" uses texture defaultSampling.

CreateWebGLText()
// Return IWebGLText helper for wrapped text rendering to texture.

CreateDynamicTexture(width, height, opts)
// Create empty IWebGLTexture for dynamic updates.
// width/height must be positive integers.
// opts:
// - wrapX: "clamp-to-edge" | "repeat" | "mirror-repeat"
// - wrapY: "clamp-to-edge" | "repeat" | "mirror-repeat"
// - defaultSampling: "nearest" | "bilinear" | "trilinear" (default)
//   (legacy "sampling" also accepted if defaultSampling omitted)
// - pixelFormat: "rgba8" (default) | "rgb8" | "rgba4" | "rgb5_a1" | "rgb565"
// - mipMap: boolean (default true)
// - mipMapQuality: "default" (default) | "low" | "high"

UpdateTexture(data, texture, opts)
// Upload new contents to an addon-managed dynamic texture.
// data: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement |
//       ImageBitmap | OffscreenCanvas | ImageData
// In worker mode, DOM types cannot be used.
// Data dimensions must match texture creation size (cannot resize texture).
// opts:
// - premultiplyAlpha: boolean (default true)

DeleteTexture(texture)
// Delete addon-managed dynamic texture.
// Do not delete textures managed by Construct.
```

---

### IWebGLText interface

The IWebGLText interface manages wrapping, canvas text drawing, and upload to WebGL texture.
Create it with IWebGLRenderer.CreateWebGLText().

#### Methods

```js
Release()
// Destroy and free resources.
// Must be called when no longer needed.

SetFontName(name)
SetFontSize(ptSize)
SetLineHeight(px)
SetBold(b)
SetItalic(i)
// Configure text style.

SetColor(color)
// Set text color with SDK.Color or CSS color string (e.g. "red", "#00ffee", "rgb(0, 128, 192)").

SetColorRgb(r, g, b)
// Set text color from RGB components.

SetHorizontalAlignment(h)
// "left" | "center" | "right"

SetVerticalAlignment(v)
// "top" | "center" | "bottom"

SetWordWrapMode(m)
// "word" or "character"

SetText(text)
// Set text content.

SetSize(width, height, zoomScale)
// Set draw box in CSS pixels.
// zoomScale can increase render resolution for zoomed Layout View.

GetTexture()
// Return IWebGLTexture for rendered text.
// Generated asynchronously; can return null initially.

GetTexRect()
// Return SDK.Rect content area to render from text texture.
// Valid only when GetTexture() is non-null.

SetTextureUpdateCallback(callback)
// Set callback for async text texture updates.

ReleaseTexture()
// Release underlying texture to save memory.
// It will be recreated on next GetTexture().

GetTextWidth()
GetTextHeight()
// Return wrapped text bounding size.
```

---

### IWebGLTexture interface

The IWebGLTexture interface represents a texture in the renderer.

This interface cannot be directly constructed. It is only available from other APIs.

#### Methods

```js
GetWidth()
GetHeight()
// Return source texture width/height.
// Due to in-editor spritesheeting, the texture may be larger than the image region you render.

GetDefaultSampling()
// Return default sampling mode used by SetTexture(..., "auto").
```

---

### UI Interfaces (ILayoutView, Utilities)

#### ILayoutView interface

The ILayoutView interface provides access to a Layout View from the SDK.
This represents the editor view; ILayout represents layout data in the project model.

```js
GetProject()
// Return IProject associated with this Layout View.

GetLayout()
// Return ILayout shown by this Layout View.

GetActiveLayer()
// Return currently active ILayer in this Layout View.

GetZoomFactor()
// Return zoom factor (1 = 100%, 0.5 = 50%, etc.).

LayoutToClientDeviceX(x)
LayoutToClientDeviceY(y)
// Convert layout coordinates to device pixel coordinates in the Layout View canvas.
// Useful for device-pixel rendering after SetDeviceTransform().

SetDeviceTransform(iRenderer)
// Set IWebGLRenderer transform to device-pixel coordinates relative to the view canvas.

SetDefaultTransform(iRenderer)
// Restore IWebGLRenderer transform to layout coordinates (default).

Refresh()
// Schedule redraw on next animation frame.
// Avoid unnecessary refreshes (e.g. timers) to reduce battery/CPU usage.
```

#### Util interface

The SDK.UI.Util interface provides access to user interface utilities in the SDK.

```js
AddDragDropFileHandler(callback, opts)
// Register custom file drag-drop handler (Custom Importer API).
// Callback must return Promise<boolean>:
// - true: drop recognised/imported
// - false: not recognised, continue other handlers
// Signature: async function(filename, file, opts)
// file is IZipFile or Blob depending on opts.isZipFormat.

// AddDragDropFileHandler options:
// - isZipFormat: boolean
//   true  => handle dropped ZIP files only; callback file param is IZipFile
//   false => handle non-ZIP files; callback file param is Blob
// - toLayoutView: boolean
//   true  => only when a Layout View is open, and callback opts includes layout/drop info
//   false => run regardless of Layout View availability, no extra callback options

// Callback opts fields when toLayoutView=true:
// - layoutView: ILayoutView for the view where drop occurred
// - clientX, clientY: drop position in window client coordinates
// - layoutX, layoutY: drop position in layout coordinates

static ShowLongTextPropertyDialog(text, caption)
// Show longtext property editor dialog.
// Returns Promise<null|string>:
// - null if cancelled
// - edited text string otherwise
```

#### Finding addon IDs

Some Editor API calls use special IDs, such as plugin IDs, behavior IDs, and ACE IDs.
Construct provides browser-console helper methods to inspect available IDs.

##### Listing addon IDs

Use C3SDK_ListAddonIDs(addonType) to list installed addon IDs.

- addonType: "plugin" or "behavior"

Example:

```js
C3SDK_ListAddonIDs("plugin")
```

This may take a moment to load, then logs each installed plugin ID and editor display name.

##### Listing ACE IDs

Use C3SDK_ListACEIDs(addonType, addonId, aceType) to list an addon's action/condition/expression IDs.

- addonType: "plugin" or "behavior"
- addonId: addon ID (found with C3SDK_ListAddonIDs)
- aceType: "actions", "conditions", or "expressions"

Example:

```js
C3SDK_ListACEIDs("plugin", "Sprite", "actions")
```

This logs the Sprite plugin action IDs and the parameters each action takes.

#### Addon Info Interfaces and Dependencies

This section covers IBehaviorInfo, IPluginInfo, PluginProperty, and dependency configuration.

##### IBehaviorInfo interface

IBehaviorInfo defines behavior configuration. It is typically accessed in the behavior constructor via this._info.

Methods:

```js
SetName(name)
SetDescription(description)
SetVersion(version)
SetCategory(category)
SetAuthor(author)
SetHelpUrl(url)
SetIcon(url, type)
SetIsOnlyOneAllowed(isOnlyOneAllowed)
SetIsDeprecated(isDeprecated)
SetCanBeBundled(canBeBundled)
SetProperties(propertiesArray)
AddCordovaPluginReference(opts)
AddFileDependency(opts)
AddRemoteScriptDependency(url) // Not recommended
SetC3RuntimeScripts(arr)
AddC3RuntimeScript(path)
SetRuntimeModuleMainScript(path)
SetScriptInterfaceNames(opts)
SetTypeScriptDefinitionFiles(arr)
```

Notes:

- SetCategory must be one of: "attributes", "general", "movements", "other".
- SetIcon defaults to icon.svg with MIME image/svg+xml.
- SetC3RuntimeScripts replaces the full runtime script list.
- Default behavior runtime script list:
  - c3runtime/behavior.js
  - c3runtime/type.js
  - c3runtime/instance.js
  - c3runtime/conditions.js
  - c3runtime/actions.js
  - c3runtime/expressions.js
- SetRuntimeModuleMainScript(path): when used, only that module entry script is loaded and it should import all other scripts.
- SetScriptInterfaceNames(opts): required for correct TypeScript definition generation when exposing script interfaces.

Example:

```js
this._info.SetScriptInterfaceNames({
  instance: "IBulletBehaviorInstance"
});

this._info.SetTypeScriptDefinitionFiles([
  "c3runtime/IBulletBehaviorInstance.d.ts"
]);
```

##### IPluginInfo interface

IPluginInfo defines plugin configuration. It is typically accessed in the plugin constructor via this._info.

Methods:

```js
SetName(name)
SetDescription(description)
SetVersion(version)
SetCategory(category)
SetAuthor(author)
SetHelpUrl(url)
SetPluginType(type)
SetIcon(url, type)
SetIsResizable(isResizable)
SetIsRotatable(isRotatable)
SetIs3D(is3d)
SetHasImage(hasImage)
SetDefaultImageURL(url)
SetIsTiled(isTiled)
SetIsDeprecated(isDeprecated)
SetIsSingleGlobal(isSingleGlobal)
SetSupportsZElevation(supportsZElevation)
SetSupportsColor(supportsColor)
SetSupportsEffects(supportsEffects)
SetMustPreDraw(mustPreDraw)
SetCanBeBundled(canBeBundled)
AddCommonPositionACEs()
AddCommonSceneGraphACEs()
AddCommonSizeACEs()
AddCommonAngleACEs()
AddCommonAppearanceACEs()
AddCommonZOrderACEs()
SetProperties(propertiesArray)
AddCordovaPluginReference(opts)
AddCordovaResourceFile(opts)
AddFileDependency(opts)
AddRemoteScriptDependency(url, type)
SetGooglePlayServicesEnabled(enabled)
SetC3RuntimeScripts(arr)
AddC3RuntimeScript(path)
SetRuntimeModuleMainScript(path)
SetDOMSideScripts(arr)
SetScriptInterfaceNames(opts)
SetTypeScriptDefinitionFiles(arr)
SetWrapperExportProperties(componentId, propertyIds)
```

Notes:

- SetCategory must be one of: "data-and-storage", "form-controls", "general", "input", "media", "monetisation", "platform-specific", "web", "other".
- SetPluginType(type): "object" or "world".
- World-type plugins derive from SDK.IWorldInstanceBase and implement Draw().
- SetIsSingleGlobal(true) requires object plugin type.
- SetSupportsZElevation/SetSupportsColor/SetSupportsEffects apply to world-type plugins.
- If using effects and drawing is not equivalent to Sprite, use SetMustPreDraw(true).
- SetC3RuntimeScripts replaces the full runtime script list.
- Default plugin runtime script list:
  - c3runtime/plugin.js
  - c3runtime/type.js
  - c3runtime/instance.js
  - c3runtime/conditions.js
  - c3runtime/actions.js
  - c3runtime/expressions.js
- SetWrapperExportProperties is for single-global plugins using wrapper extensions.

Example:

```js
this._info.SetScriptInterfaceNames({
  instance: "ISpriteInstance"
});

this._info.SetTypeScriptDefinitionFiles([
  "c3runtime/ISpriteInstance.d.ts"
]);
```

Wrapper export example:

```js
this._info.SetWrapperExportProperties("my-component-id", ["first-property", "second-property"]);
```

This adds exported-properties in package.json for wrapper-side initialization.

##### PluginProperty

PluginProperty values are used with SetProperties(propertiesArray) in IPluginInfo and IBehaviorInfo.

Example:

```js
const property = new SDK.PluginProperty("integer", "test-property", 0);

this._info.SetProperties([
  property
]);
```

PluginProperty instances are also used to bind Cordova plugin variables when specifying Cordova dependencies.

##### Specifying dependencies

Plugins and behaviors can add dependencies via:

- AddFileDependency(opts)
- AddCordovaPluginReference(opts)
- AddCordovaResourceFile(opts) (plugins)
- AddRemoteScriptDependency(...) (supported, but not recommended)

###### File dependencies

File dependencies reference files bundled with the addon.

Types (opts.type):

- copy-to-output
  - Copy file to export output and preview output.
- external-dom-script
  - Inject extra script tag in HTML export.
  - scriptType may be "module".
  - In worker mode, script runs in DOM context, not worker runtime.
- external-runtime-script
  - Loaded as script tag in HTML or importScripts in worker mode.
  - Must be worker-compatible.
- external-css
  - Inject stylesheet link in HTML export.
- wrapper-extension
  - Bundle wrapper extension DLL.

Example:

```js
this._info.AddFileDependency({
  filename: "mydependency.js",
  type: "external-dom-script"
});
```

File dependency options:

- filename: dependency file path relative to addon root (location of addon.json)
- type: dependency type
- fileType: required MIME type when type is "copy-to-output"
- scriptType: for external-dom-script; "module" supported
- platform: required for wrapper-extension; supported values include:
  - windows-x86
  - windows-x64
  - windows-arm64
  - xbox-uwp-x64
  - macos-universal
  - linux-x64
  - linux-arm
  - linux-arm64

Developer mode note: include dependency files in addon.json file-list.

###### Cordova plugin dependencies

Use AddCordovaPluginReference to include Cordova plugin dependencies in Cordova exports.

Example:

```js
this._info.AddCordovaPluginReference({
  id: "cordova-plugin-inappbrowser"
});
```

Example with variables:

```js
const property = new SDK.PluginProperty("integer", "test-property", 0);

this._info.SetProperties([
  property
]);

this._info.AddCordovaPluginReference({
  id: "cordova-plugin-inappbrowser",
  plugin: this,
  variables: [
    ["MY_VAR", property]
  ]
});
```

Cordova plugin opts:

- id: Cordova plugin ID
- version (optional): plugin version spec
- platform (optional): "all" (default), "android", or "ios"
- variables (optional): array of [variableName, pluginProperty]
- plugin (optional): plugin object, usually this, required when variables are used

Build service note: Construct mobile build service uses an allowlist of Cordova plugins.

###### Cordova resource file dependencies

Use AddCordovaResourceFile(opts) to add resource-file tags to exported config.xml.

Example:

```js
this._info.AddCordovaResourceFile({
  src: "myfile.txt"
});
```

Resource opts:

- src: source path relative to config.xml
- target (optional): destination path
- platform (optional): "all" (default), "android", or "ios"

###### Remote script dependencies

Remote scripts are supported but discouraged.

Drawbacks:

- no offline support
- network/service failures can break loading
- native platforms may block non-allowlisted origins

Prefer bundling scripts with file dependencies.

Examples:

```js
// Classic script
this._info.AddRemoteScriptDependency("https://example.com/api.js");

// Module script
this._info.AddRemoteScriptDependency("https://example.com/api-module.js", "module");
```

Use HTTPS or same-protocol URLs (for example //example.com/api.js). Avoid http.

---

## 24. Remaining Object Interfaces

These fill out the object interface set introduced in Section 20.

---

### IImagePoint — a named point on an animation frame

Returned by `IAnimationFrame.GetImagePoints()` or `IAnimationFrame.AddImagePoint()`. Positions are in **texture co-ordinates (0–1)**, same as origin and collision polygon points.

```js
GetAnimationFrame()      // IAnimationFrame — the frame this point belongs to

GetName()  / SetName(n)  // string — name of this image point (e.g. "gun_barrel")
GetX()     / SetX(x)     // number 0–1 — horizontal position in texture coords
GetY()     / SetY(y)     // number 0–1 — vertical position in texture coords
```

#### Converting texture coords to pixels

```js
const pt = frame.GetImagePoints()[0];
const px = pt.GetX() * frame.GetWidth();
const py = pt.GetY() * frame.GetHeight();
```

#### Adding a named image point

```js
// Add a point at the top-centre of the image
frame.AddImagePoint("tip", 0.5, 0.0);
```

---

### IContainer — a group of object types always linked together

Returned by `IObjectType.GetContainer()` or `IObjectType.CreateContainer()`.

```js
GetMembers()                    // IObjectType[] — always ≥2 members while active

GetSelectMode()                 // "normal" | "all" | "wrap"
SetSelectMode(mode)             // sets the "Select mode" property visible in Construct

RemoveObjectType(objectType)    // removes one member
                                // ⚠ Removing the second-to-last member deactivates
                                // the container — it becomes inactive with one member left

IsActive()                      // boolean — false if fewer than 2 members remain
                                // An inactive container is effectively deleted
```

> **Container minimum:** two members are required to stay active. After `RemoveObjectType()` leaves only one member, `IsActive()` returns `false` and that last object type behaves as if it was never in a container.

---

### IFamily — a group of same-plugin object types

Returned by `IProject.GetFamilyByName()` or `IProject.CreateFamily()`. Derives from `IObjectClass` (so `GetName()`, `GetProject()`, `Delete()` all apply).

```js
GetMembers()                    // IObjectType[] — all object types in the family

SetMembers(objectTypesArray)    // Replace the entire member list.
                                // ⚠ All new members must:
                                //   - use the same plugin as the existing members
                                //   - not have naming conflicts in instance vars,
                                //     behaviors, or effects
```

> **Families must be homogeneous** — all members must use the same plugin (e.g. all Sprites, all Tiled Backgrounds). `SetMembers()` enforces this.

> **`IFamily` inherits `Delete()` from `IObjectClass`** — calling it removes the family from the project, removes all events referencing it, and cannot be undone. Use with care.

---

## Runtime API Reference (C3 Scripting / Runtime-side)

Runtime-side APIs and scripting interfaces that run during gameplay/preview.

---

## 25. Physics Behavior API (IPhysicsBehavior / IPhysicsBehaviorInstance)

The Physics behavior exposes two interfaces: `IPhysicsBehavior` for global world settings, and `IPhysicsBehaviorInstance` for per-object physics control. Access the behavior instance through `inst.behaviors.Physics` on any `IWorldInstance` that has the Physics behavior attached.

### Accessing the Physics interfaces

```js
// From a plugin — inst is an IWorldInstance
const physInst = inst.behaviors.Physics;          // IPhysicsBehaviorInstance
const physWorld = physInst.behavior;              // IPhysicsBehavior (world settings)

// From a behavior — this.instance is the attached IWorldInstance
const physInst = this.instance.behaviors.Physics;
const physWorld = physInst.behavior;

// Change world gravity
physWorld.worldGravity = 0;  // zero-G
```

---

### IPhysicsBehavior — world settings

Accessed via `behaviorInstance.behavior`. Controls the global physics simulation.

```js
behavior.worldGravity          // number — get/set gravity force (default 10, downward)
behavior.steppingMode          // string — get/set: "fixed" or "variable"
                               //   "variable": uses delta-time, framerate independent but non-deterministic
                               //   "fixed": same step every frame, deterministic but may run
                               //   too fast/slow on different refresh rates
behavior.velocityIterations    // number — get/set (default 8). Higher = more accurate, slower
behavior.positionIterations    // number — get/set (default 3). Higher = more accurate, slower
```

#### Collision filtering between object types

```js
behavior.setCollisionsEnabled(iObjectClassA, iObjectClassB, state)
// iObjectClassA, iObjectClassB: IObjectClass references (from runtime.objects.MyType)
// state: boolean — true to enable collisions, false to disable
// Affects ALL instances of the given types
```

---

### IPhysicsBehaviorInstance — per-object physics

Accessed via `inst.behaviors.Physics`.

#### Enable / disable

```js
physInst.isEnabled             // boolean — get/set. When false, the physics body is destroyed
                               // and the behavior has no effect
```

#### Forces

Applying a force causes continuous acceleration in the direction of the force.

```js
physInst.applyForce(fx, fy, imgPt?)                  // custom X/Y components
physInst.applyForceTowardPosition(f, px, py, imgPt?) // toward layout position
physInst.applyForceAtAngle(f, a, imgPt?)             // at angle (radians)
```

> **`imgPt` parameter (all force/impulse/torque methods):**
> - `0` (default) — center of mass (no rotation)
> - `-1` — object origin (may differ from center of mass, causes rotation)
> - `"pointName"` — named image point (causes rotation)

#### Impulses

Applying an impulse simulates a sudden strike (e.g. hit by a bat).

```js
physInst.applyImpulse(ix, iy, imgPt?)
physInst.applyImpulseTowardPosition(i, px, py, imgPt?)
physInst.applyImpulseAtAngle(i, a, imgPt?)
```

#### Torque

```js
physInst.applyTorque(m)                // direct rotational acceleration (radians)
physInst.applyTorqueToAngle(m, a)      // toward angle (radians)
physInst.applyTorqueToPosition(m, px, py)  // toward layout position
```

#### Velocity

```js
physInst.setVelocity(vx, vy)           // set velocity (px/s for X and Y)
physInst.getVelocityX()                // number — current X velocity (px/s)
physInst.getVelocityY()                // number — current Y velocity (px/s)
physInst.getVelocity()                 // [x, y] — both components
physInst.angularVelocity               // number — get/set angular velocity (radians/s)
```

#### Teleport

```js
physInst.teleport(x, y)
// Repositions the object WITHOUT altering its Physics velocity.
// Normal position changes (inst.x = ...) reposition but also alter velocity
// to keep the simulation realistic. Use teleport() for portals, respawns, etc.
```

#### Physics properties

All are getters and setters.

```js
physInst.isImmovable           // boolean — if true, object is static (infinite mass)
physInst.isPreventRotation     // boolean — locks rotation
physInst.density               // number — affects mass calculation
physInst.friction              // number — surface friction
physInst.elasticity            // number — bounciness (0 = no bounce, 1 = full)
physInst.linearDamping         // number — slows linear movement over time
physInst.angularDamping        // number — slows rotation over time
physInst.isBullet              // boolean — enables continuous collision detection
                               //   (prevents fast objects tunneling through thin walls)
```

#### Mass and center of mass (read-only)

```js
physInst.mass                  // number — area of collision mask × density (read-only)
physInst.getCenterOfMassX()    // number — X position of center of mass
physInst.getCenterOfMassY()    // number — Y position of center of mass
physInst.getCenterOfMass()     // [x, y]
```

#### Sleep / wake state

```js
physInst.isAwake               // boolean — get/set. Sleeping objects skip simulation to save CPU.
                               //   Set to true to force a sleeping object to resume simulation
                               //   (e.g. after repositioning an adjacent object).
physInst.isSleeping            // DEPRECATED — returns true when isAwake is false. Use isAwake.
```

#### Joints

All joint methods require `iOtherInst` to be an `IWorldInstance` with the Physics behavior.

```js
// Distance joint — fixed distance, like a rigid pole
physInst.createDistanceJoint(imgPt, iOtherInst, otherImgPt, damping, freq)
// damping: 0–1 damping ratio, freq: mass-spring-damper frequency in Hz

// Revolute joint — free rotation like a pin/hinge
physInst.createRevoluteJoint(imgPt, iOtherInst)
physInst.createLimitedRevoluteJoint(imgPt, iOtherInst, lower, upper)
// lower/upper: rotation limits in radians (like a bell clapper)

// Prismatic joint — movement restricted to one axis
physInst.createPrismaticJoint(
  imgPt, iOtherInst, axisAngle,        // axisAngle in radians
  enableLimit, lowerTranslation, upperTranslation,  // translation limits in px
  enableMotor, motorSpeed, maxMotorForce            // motor in radians/s
)

// Remove all joints (affects connected objects too)
physInst.removeAllJoints()
```

> **After `removeAllJoints()`**, some joints auto-disable collisions between connected objects. You may need to manually disable collisions again to prevent overlapping objects from "teleporting" apart.

> **Image point 0 = center of mass** for all joint methods. Use `-1` for the object origin.

#### Contacts

```js
physInst.getContactCount()             // number — how many contact points exist
physInst.getContactX(index)            // number — X position of contact (layout coords)
physInst.getContactY(index)            // number — Y position of contact (layout coords)
physInst.getContact(index)             // [x, y]
```

#### Collision filter

```js
physInst.setCollisionFilter(isInclusive, tags)
// isInclusive: boolean — true = inclusive mode, false = exclusive mode
// tags: string (space-separated) or iterable of strings (array, Set)
```

---

### Physics usage patterns

#### Accessing Physics from another behavior

```js
// In a behavior's _tick() or ACE method:
const phys = this.instance.behaviors.Physics;
if (phys) {
  phys.setVelocity(200, -300);
  phys.applyForceAtAngle(500, Math.PI / 4);  // 45° force
}
```

#### Zero-gravity space game

```js
// Set once, affects all Physics objects
const phys = spriteInst.behaviors.Physics;
phys.behavior.worldGravity = 0;

// Thrust forward at the ship's current angle
phys.applyForceAtAngle(thrustPower, spriteInst.angle);
```

#### Teleport through a portal

```js
// Preserve velocity when repositioning
const phys = playerInst.behaviors.Physics;
phys.teleport(portalExitX, portalExitY);
```

#### Waking a sleeping object

```js
// After repositioning a platform, wake nearby physics objects
for (const inst of runtime.objects.Crate.getAllInstances()) {
  const phys = inst.behaviors.Physics;
  if (phys && !phys.isAwake) {
    phys.isAwake = true;
  }
}
```

---

## 26. ISDKBehaviorInstanceBase — Runtime Behavior API

`ISDKBehaviorInstanceBase` is the runtime base class for behavior instances in the addon SDK. It derives from the C3 internal `IBehaviorInstance`. All methods below are available on `this` inside `src/runtime/instance.js` for behavior addons.

---

### Lifecycle overrides

All are optional. Define them as methods on the class returned by `instance.js`.

```js
// Called during instance construction. Called before the associated object instance
// is fully ready. Only use for pure data initialization.
constructor() { super(); }

// Called after the associated object instance has fully finished being created.
// this.instance is valid here. Use for sibling behavior lookup, first-time setup.
_postCreate() {}

// Called each tick just BEFORE events are run (when _setTicking(true) is active).
_tick() {}

// Called each tick just AFTER events are run (when _setTicking2(true) is active).
_tick2() {}

// Called after ALL other behaviors have had their _tick() called.
// Use for observing final state of sibling behaviors.
// Prefer _tick() when possible — post-tick order is not guaranteed.
_postTick() {}

// Called when the instance is destroyed. Must call super._release().
_release() { super._release(); }

// Return a plain JSON object for savegames.
_saveToJson() { return {}; }

// Restore state from a prior _saveToJson() result.
_loadFromJson(o) {}

// Return debugger sections. See Section 12 for format.
_getDebuggerProperties() { return []; }
```

---

### Property initialization

```js
this._getInitProperties()
// Call in constructor. Returns flat array of initial property values.
// Index order matches config.caw.js properties[] declaration order.
```

---

### Ticking utilities

| Method | Description |
|---|---|
| `this._setTicking(bool)` | Enable/disable `_tick()` (before events) |
| `this._setTicking2(bool)` | Enable/disable `_tick2()` (after events) |
| `this._setPostTicking(bool)` | Enable/disable `_postTick()` (after all ticks) |
| `this._isTicking()` | Returns whether `_tick()` is currently active |
| `this._isTicking2()` | Returns whether `_tick2()` is currently active |
| `this._isPostTicking()` | Returns whether `_postTick()` is currently active |

> **Calls do not stack.** Three calls to `_setTicking(true)` + one to `_setTicking(false)` = ticking is off. Redundant calls are safely ignored.

> **Stop ticking when idle** to minimize per-frame overhead. Re-enable on demand.

---

### Triggering conditions

```js
// Synchronous fire — most common
this._trigger(C3.Behaviors["addon_id"].Cnds.MyTrigger);

// Async fire — returns Promise that resolves when the trigger finishes executing.
// Useful for C3 debugger support (breakpoints inside triggers wait for resolution).
await this._triggerAsync(C3.Behaviors["addon_id"].Cnds.MyTrigger);
```

In CAW, the generated `_trigger(methodName)` helper (see §10) wraps the above automatically — prefer `this._trigger("MethodName")` over calling `super._trigger(...)` directly.

---

### Full behavior instance template

```js
export default function (parentClass) {
  return class extends parentClass {

    constructor() {
      super();
      // ✓ Safe: primitives, Maps, arrays, _getInitProperties()
      // ✗ Never access this.instance here — it is null
      this._setTicking(true);
      const props = this._getInitProperties();
      // props[0], props[1], ... match config.caw.js properties[] order
    }

    _postCreate() {
      // this.instance is fully available here
      // Good for sibling behavior lookup
      this._phys = this.instance.behaviors["Physics"] ?? null;
    }

    _tick() {
      const dt = this.instance.runtime.dt;  // seconds
      // main per-frame logic
    }

    _tick2() {
      // runs after the event sheet — react to event-driven state changes
    }

    _postTick() {
      // runs after all _tick() calls — observe other behaviors' final state
    }

    _release() {
      super._release();  // always required
    }

    _saveToJson() {
      return { myValue: this._myValue };
    }

    _loadFromJson(o) {
      this._myValue = o.myValue ?? 0;
    }

    _getDebuggerProperties() {
      return [{
        title: `$${this.behaviorType.name}`,
        properties: [
          { name: "$State", value: this._myValue },
        ],
      }];
    }
  };
}
```

---

### Lifecycle call order summary

| Order | Method | `this.instance` ready | When |
|---|---|---|---|
| 1 | `constructor()` | ✗ no | Instance being built |
| 2 | `_postCreate()` | ✓ yes | Immediately after instance is fully created |
| 3 | `_tick()` | ✓ yes | Every frame, before events |
| 4 | `_tick2()` | ✓ yes | Every frame, after events |
| 5 | `_postTick()` | ✓ yes | Every frame, after all `_tick()` calls |
| — | `_release()` | ✓ yes | Instance being destroyed |

---

### Gotchas

- **`this.instance` is `null` in `constructor()`** — never read `.x`, `.behaviors`, or any instance property there. Use `_postCreate()` or a lazy-init guard in `_tick()`.
- **Prefer `_postCreate()` over a lazy-init flag in `_tick()`** when you only need to run setup once right after creation — it is cleaner and runs exactly once.
- **`_tick2()` and `_postTick()` are disabled by default** — you must call `_setTicking2(true)` / `_setPostTicking(true)` in the constructor to activate them.
- **`_triggerAsync()` is for debugger-aware triggers.** For normal triggers, `_trigger()` (synchronous) is always sufficient and simpler.
- **`_release()` must call `super._release()`** or engine resources will not be cleaned up.

### The `expose` flag — what it does

When an ACE file has `export const expose = true`, CAW copies the ACE's default export function onto the **runtime instance prototype** under the ACE method name. This is the mechanism that makes methods callable from C3 scripts.

```js
// a.SetMaxSpeed.js
export const expose = true;

export default function (speed) {
  this.setMaxSpeed(speed);   // delegates to public method
}
```

With `expose: true` the user can call:

```js
// In a C3 Script event:
const beh = playerInst.behaviors.PlatformerPhysics;
beh.setMaxSpeed(300);   // ✓ — works because expose: true and method exists on prototype
```

With `expose: false`, the function exists only as the ACE handler and is not accessible from script.

---

### Design pattern — public methods as the single source of truth

The recommended pattern is to extract all logic into **named public methods** on the instance, then have every ACE's default export call the corresponding method. This means:

- Event sheet actions and script calls share exactly the same code path
- The public method IS the scripting API
- Behavior logic is testable without the C3 event sheet

```js
// ✗ WRONG — inline logic not reachable from scripts unless ACE expose:true is enough
export default function (speed) {
  this._maxSpeed = Math.max(0, speed);  // logic lives only in the ACE
}

// ✓ CORRECT — logic in public method, ACE just delegates
// In instance.js:
setMaxSpeed(speed) {
  this._maxSpeed = Math.max(0, speed);
}

// In a.SetMaxSpeed.js:
export const expose = true;
export default function (speed) { this.setMaxSpeed(speed); }
```

---

### Naming conventions

| Method type | Convention | Example |
|---|---|---|
| Public scripting API | no prefix, camelCase | `setMaxSpeed`, `applyImpulse`, `resetJumps` |
| Private helpers | underscore prefix | `_tick`, `_trigger`, `_findPhysicsBehavior` |
| ACE delegate export | always `function` keyword, never arrow | `export default function(v) { this.setX(v); }` |

Public methods must not start with `_`. The underscore prefix is a signal to consumers that the method is internal and may change without notice.

---

### JSDoc for IDE autocomplete

Add JSDoc comments to public methods. C3's script editor (and VS Code via `.d.ts` or inline JSDoc) will surface these as autocomplete hints.

```js
/**
 * Set the maximum horizontal running speed.
 * @param {number} speed - Top speed in px/s.
 */
setMaxSpeed(speed) { this._maxSpeed = speed; }

/**
 * Apply an instantaneous velocity impulse.
 * Deceleration will naturally taper the extra velocity off.
 * @param {number} vx - Horizontal impulse in px/s (positive = right)
 * @param {number} vy - Vertical impulse in px/s (positive = down)
 */
applyImpulse(vx, vy) {
  if (this._phys) {
    this._phys.setVelocity(
      this._phys.getVelocityX() + vx,
      this._phys.getVelocityY() + vy
    );
  }
}
```

---

### Combo parameters in scripting calls

ACE combo parameters are numeric indices at runtime (see §16). When users call methods **directly from script** (bypassing the ACE), they pass the numeric index — not the string key. Document the index mapping:

```js
/**
 * Freeze or unfreeze a movement axis.
 * @param {number} axis - 0 = Horizontal, 1 = Vertical, 2 = Both
 * @param {boolean} freeze - true to freeze, false to unfreeze
 */
setFreezeAxis(axis, freeze) {
  const keys = ["horizontal", "vertical", "both"];
  const key = keys[axis] ?? keys[2];
  const val = !!freeze;
  if (key === "horizontal" || key === "both") this._freezeX = val;
  if (key === "vertical"   || key === "both") this._freezeY = val;
}
```

Script call:
```js
beh.setFreezeAxis(0, true);   // freeze horizontal
beh.setFreezeAxis(1, false);  // unfreeze vertical
beh.setFreezeAxis(2, true);   // freeze both
```

---

### Full example — behavior script API

This is the full scripting surface for a platformer physics behavior as seen from a C3 Script event:

```js
// Resolve the behavior instance
const beh = playerInst.behaviors.PlatformerPhysics;

// ── Configuration ──────────────────────────────────────────────────────────
beh.setMaxSpeed(300);           // top running speed (px/s)
beh.setAcceleration(2000);      // acceleration (px/s²)
beh.setDeceleration(2000);      // deceleration (px/s²)
beh.setJumpStrength(700);       // jump impulse (px/s)
beh.setGravity(1200);           // extra downward gravity (px/s²)
beh.setMaxFallSpeed(1200);      // terminal falling speed (px/s)

// ── Jumping ────────────────────────────────────────────────────────────────
beh.resetJumps();               // restore all jumps as if just landed
beh.setMaxJumps(2);             // double jump
beh.setJumpReleaseDamping(30);  // 30% of upward velocity kept on early release
beh.setWallJump(true);          // enable wall jumping
beh.setWallSlide(true);         // enable wall sliding

// ── Movement ───────────────────────────────────────────────────────────────
beh.setEnabled(false);          // disable the whole behavior
beh.setDefaultControls(false);  // stop reading keyboard
beh.setIgnoreInput(true);       // suppress SimulateControl and keyboard input
beh.setFreezeAxis(0, true);     // freeze horizontal axis (0=H, 1=V, 2=Both)
beh.setVector(150, 0);          // directly set Physics velocity
beh.setVectorX(150);            // set X only, Y unchanged
beh.setVectorY(-500);           // set Y only, X unchanged (negative = up)
beh.stop();                     // zero both velocity components

// ── Simulate controls ──────────────────────────────────────────────────────
// Call each tick for held controls; auto-release fires when you stop calling
beh.simulateControl(0);  // 0=left, 1=right, 2=jump, 3=jump_release, 4=stop

// ── Knockback ──────────────────────────────────────────────────────────────
beh.applyImpulse(-300, 0);           // additive impulse, decelerates naturally
beh.knockback(-400, -150, 0.4);      // set velocity + suppress input for 0.4s
```

---

### Accessing read-only state from script

Expressions with `expose: false` are NOT accessible from script. Read-only state should either be:

1. **Exposed via a getter method** added to the instance (preferred for frequently-read values)
2. **Read directly from the Physics behavior** via `inst.behaviors.Physics.getVelocityX()`

```js
// ✓ Option A: getter on the behavior instance
// In instance.js:
getSpeed() {
  if (!this._phys) return 0;
  const vx = this._phys.getVelocityX();
  const vy = this._phys.getVelocityY();
  return Math.sqrt(vx * vx + vy * vy);
}
isOnFloor()      { return this._onFloor; }
isJumping()      { return !this._onFloor && this._phys?.getVelocityY() < 0; }
isFalling()      { return !this._onFloor && this._phys?.getVelocityY() > 0; }
isWallSliding()  { return this._isWallSliding; }
isFacingRight()  { return this._facing === 1; }
getAirTime()     { return this._airTime; }
getJumpsRemaining() { return this._jumpsRemaining; }

// Script usage:
if (beh.isOnFloor()) { ... }
const spd = beh.getSpeed();
```

Add `expose: true` to the corresponding expression ACE (or create a new zero-param expression ACE for each getter) so the same code path is used from both event sheets and script.

---

### Registering a scripting interface (advanced)

For addons that want richer IDE support, C3 allows registering a **scripting interface class** via `plugin.js` or `type.js`. This exposes the interface to C3's TypeScript declaration generator. However, for most addons the JSDoc + `expose: true` pattern above is sufficient and simpler.

If you need the full scripting class registration, it looks like this in `src/runtime/plugin.js`:

```js
export default function (parentClass) {
  return class extends parentClass {
    // Override Script() to return your scripting interface
    // (only needed when C3 calls GetScriptInterface() on the type)
    // Most addons do NOT need this — expose: true on ACEs is enough.
  };
}
```

> For behavior addons, the C3 runtime automatically wraps the behavior instance in a scripting proxy that exposes all methods where `expose: true`. No additional registration is required unless you need a separate companion scripting class.

---

### Gotchas

**`this._phys` may be null before `_initialized`** — public methods called from script in the very first tick (before `_tick` has run its init guard) will find `_phys` as `null`. All public methods that touch `_phys` must guard with `if (this._phys)`.

**State mutation methods must be idempotent** — `setEnabled(false)` called twice must not corrupt state. Defensive `!!` coercion (`this._enabled = !!enabled`) prevents accidental truthy/falsy surprises.

**Methods called from script bypass `_ignoreInput`** — `simulateControl()` respects `_ignoreInput`, but `setVectorX()` or `knockback()` do not. This is intentional: the event sheet flag controls automated input, not explicit code-driven overrides.

---

## 27. ISDKInstanceBase — Runtime Plugin Instance API

`ISDKInstanceBase` is the runtime base class for **plugin** instances (not behaviors) in the addon SDK. It derives from the C3 internal `IInstance`. All methods below are available on `this` inside `src/runtime/instance.js` for plugin addons.

> **Behavior vs Plugin:** `ISDKBehaviorInstanceBase` (§26) is for behavior addons. `ISDKInstanceBase` is for object/world/DOM plugin addons. The lifecycle and ticking APIs are nearly identical; the key difference is `this.instance` does not exist — the instance *is* the plugin object, not a wrapper around one.

---

### Lifecycle overrides

```js
// Called when the instance is destroyed. Must call super._release().
_release() { super._release(); }

// Return a plain JSON object for savegames.
_saveToJson() { return {}; }

// Restore state from a prior _saveToJson() result.
_loadFromJson(o) {}

// Return debugger sections. See §12 for format.
_getDebuggerProperties() { return []; }
```

> Plugin instances do **not** have `_postCreate()`. Use `onCreate()` for post-construction setup (see §3).

---

### Property initialization

```js
this._getInitProperties()
// Call in constructor. Returns flat array of initial property values.
// Index order matches config.caw.js properties[] declaration order.
```

---

### Ticking utilities

| Method | Description |
|---|---|
| `this._setTicking(bool)` | Enable/disable `_tick()` (runs before events) |
| `this._setTicking2(bool)` | Enable/disable `_tick2()` (runs after events) |
| `this._isTicking()` | Whether `_tick()` is currently active |
| `this._isTicking2()` | Whether `_tick2()` is currently active |

```js
_tick()  {}  // every frame, before events — enable with _setTicking(true)
_tick2() {}  // every frame, after events  — enable with _setTicking2(true)
```

> Plugin instances have no `_postTick()` or `_setPostTicking()` — those are behavior-only (see §26).

> Calls do not stack. Three `_setTicking(true)` + one `_setTicking(false)` = ticking is off.

---

### Triggering conditions

```js
// Synchronous
this._trigger(C3.Plugins["addon_id"].Cnds.MyTrigger);

// Async — returns Promise; use when debugging breakpoints inside triggers matter
await this._triggerAsync(C3.Plugins["addon_id"].Cnds.MyTrigger);
```

In CAW, `this._trigger("MethodName")` wraps the above automatically (see §10).

---

### DOM-side communication

Only available when `hasDomside: true` in the plugin config.

```js
// Add handlers for messages sent from the DOM-side script
this._addDOMMessageHandler("my-reply", (data) => {});
this._addDOMMessageHandlers([
  ["reply-a", (data) => {}],
  ["reply-b", (data) => {}],
]);

// Send a message to the DOM-side script
this._postToDOM("my-msg", data);                  // fire-and-forget
const result = await this._postToDOMAsync("my-msg", data);  // await return value
this._postToDOMMaybeSync("my-msg", data);
// In DOM mode: calls the handler synchronously inside this call.
// In worker mode: posts the message (async, handled later).
// Use this when working around user-input restrictions in DOM mode.
```

---

### Wrapper extension methods

Only relevant if your plugin ships with a native wrapper extension (`.dll`/`.so`).

```js
// Check if the wrapper extension loaded successfully
this._isWrapperExtensionAvailable()              // boolean

// Receive messages from the wrapper extension
this._addWrapperExtensionMessageHandler(messageId, callback)
this._addWrapperMessageHandlers([[msgId, callback], ...])

// Send a message to the wrapper extension
// params: array of boolean | number | string values only
this._sendWrapperExtensionMessage(messageId, params)
await this._sendWrapperExtensionMessageAsync(messageId, params)
// Async variant resolves with the JSON data the wrapper extension responds with
```

> If `_isWrapperExtensionAvailable()` returns `false`, all sent messages are silently dropped and async messages return promises that never resolve. Always guard with an availability check.

---

### Minimal plugin runtime instance template

```js
export default function (parentClass) {
  return class extends parentClass {

    constructor() {
      super();
      // ✓ Safe: primitives, Maps, arrays, _getInitProperties()
      // ✓ this.runtime is NOT available here — use onCreate() for runtime access
      this._setTicking(true);
      const props = this._getInitProperties();
      // props[0], props[1], ... match config.caw.js properties[] order
    }

    onCreate() {
      // this.runtime is available here
      // Access layouts, layers, sibling objects, etc.
    }

    _tick() {
      const dt = this.runtime.dt;  // seconds
    }

    _tick2() {
      // after events
    }

    _release() {
      super._release();  // always required
    }

    _saveToJson() {
      return { myValue: this._myValue };
    }

    _loadFromJson(o) {
      this._myValue = o.myValue ?? 0;
    }

    _getDebuggerProperties() {
      return [{
        title: `$${this.type.name}`,
        properties: [
          { name: "$State", value: this._myValue },
        ],
      }];
    }
  };
}
```

---

## 28. ISDKUtils — Runtime Utilities (`runtime.sdk`)

`ISDKUtils` provides general-purpose APIs for addon SDK code. Access it via `this.runtime.sdk` from any plugin or behavior runtime instance.

```js
const sdk = this.runtime.sdk;  // ISDKUtils
```

---

### Loading

```js
sdk.addLoadPromise(promise)
// Add a Promise that the runtime waits to resolve before starting the first layout.
// Only valid while the project is still loading.
//
// IsSingleGlobal plugins: can be called in the constructor.
// All other plugins/behaviors: can only be called in the plugin/behavior constructor
// (src/runtime/plugin.js or the behavior type constructor), not the instance constructor.
//
// Use for: loading async resources (audio, WASM, remote config) before the game starts.
```

### Rendering

```js
sdk.updateRender()
// Signal Construct to draw a new frame.
// C3 skips rendering when nothing has visually changed.
// Call this whenever an internal state change would affect how something draws.
// ⚠ Do NOT call if the value is being set to the same thing — only on actual changes.
```

### Wrapper extension (cross-addon)

These are the cross-addon variants of the per-instance wrapper extension methods. Prefer the instance-specific methods (§27) in most cases — use these only when you need to message a *different* addon's wrapper extension.

```js
sdk.isWrapperExtensionAvailable(wrapperComponentId)   // boolean
sdk.sendWrapperExtensionMessage(wrapperComponentId, messageId, params)
await sdk.sendWrapperExtensionMessageAsync(wrapperComponentId, messageId, params)
```

### Object lookup

```js
sdk.getObjectClassBySid(sid)
// Returns IObjectClass with the given SID, or null.
// Use to resolve plugin "object" type properties, which provide a SID at runtime.
// (Also available as IProject.GetObjectClassBySID() on the editor side.)
```

### Suspend / resume

```js
sdk.isAutoSuspendEnabled          // boolean — get/set
// When true (default), runtime auto-suspends when the page/app goes to background.
// Set to false to take manual control via setSuspended().
// ⚠ Even with auto-suspend disabled, browsers may throttle background pages anyway.
// This API exists primarily for platforms that provide their own suspend/resume events.

sdk.setSuspended(isSuspended)     // true = pause runtime, false = resume
// Stops all ticking and drawing when suspended.
// Must be called in paired suspend/resume calls — do not suspend once but resume twice.
// Read current state via: this.runtime.isSuspended
```

### Version

```js
sdk.constructVersionCode          // number (read-only)
// Construct release number encoded as: (releaseNumber * 100) + patchNumber
// e.g. r123.4 → 12304
// Use for compatibility checks when feature detection alone is insufficient.
```

### Looping conditions

Used to implement looping conditions (ACEs with `"isLooping": true`). Looping conditions repeatedly retrigger the event — each retrigger runs all subsequent conditions, actions, and sub-events once.

```js
const ctx = sdk.createLoopingConditionContext(loopName?)
// loopName is optional. When provided, the System "loopindex" expression returns
// the current iteration index for this named loop (supports nested loops).
// Returns ILoopingConditionContext.
```

#### ILoopingConditionContext

```js
ctx.retrigger()   // Execute one iteration — runs all subsequent conditions/actions/sub-events
ctx.isStopped     // boolean (read-only) — true when the user called the System "Stop loop" action
ctx.release()     // MUST be called after the loop ends to clean up state
```

#### Example: looping condition implementation

```js
// ACE file: c.RepeatTimes.js
export const config = {
  listName: "Repeat N times",
  displayText: "Repeat {0} times",
  isTrigger: false,
  isLooping: true,    // ← marks this as a looping condition
  params: [{ id: "count", name: "Count", type: "number", initialValue: "3" }],
};

export default function (count) {
  const ctx = this.runtime.sdk.createLoopingConditionContext("MyLoopName");

  for (let i = 0; i < count; i++) {
    ctx.retrigger();
    if (ctx.isStopped) break;  // respect the System "Stop loop" action
  }

  ctx.release();  // always required after the loop finishes
}
```

> **`ctx.release()` is mandatory.** Omitting it leaks internal state and breaks subsequent loops.

> **Nested loops** — pass distinct names to `createLoopingConditionContext()` so `loopindex("MyLoopName")` returns the correct index for each nesting level.

---

## 29. Physics Platformer — Scripting API Reference

All public methods and getters are available from JavaScript via the behavior instance. Access the behavior from a runtime object instance:

```js
const plat = sprite.behaviors.PhysicsPlatformer;
```

Replace `PhysicsPlatformer` with whatever name the user gave the behavior in the editor.

---

### Configuration

```js
plat.setMaxSpeed(speed)         // Maximum horizontal speed (px/s)
plat.setAcceleration(accel)     // Rate of acceleration toward max speed (px/s²)
plat.setDeceleration(decel)     // Rate of deceleration to zero when no input (px/s²)
plat.setJumpStrength(strength)  // Upward impulse on jump (px/s)
plat.setGravity(gravity)        // Extra downward acceleration per tick (px/s²). 0 = Physics gravity only.
plat.setMaxFallSpeed(speed)     // Terminal fall velocity clamp (px/s)
```

---

### Jumping

```js
plat.resetJumps()                    // Restore all jumps as if just landed
plat.setMaxJumps(count)              // Total jumps before landing (1 = normal, 2 = double jump)
plat.setJumpReleaseDamping(percent)  // 0–100. How much upward velocity is kept on early release.
                                     // 0 = instant cut, 100 = no variable height. Default 50.
plat.setWallSlide(enabled)           // boolean — enable/disable wall sliding
plat.setWallJump(enabled)            // boolean — enable/disable wall jumping
```

---

### Movement & Input

```js
plat.setEnabled(enabled)             // boolean — disable to freeze all behavior logic
plat.setIgnoreInput(ignore)          // boolean — suppress all input (simulateControl included)
plat.setFreezeAxis(axis, freeze)     // axis: 0=Horizontal, 1=Vertical, 2=Both. freeze: boolean.

plat.setVector(vx, vy)               // Set both velocity components (px/s)
plat.setVectorX(vx)                  // Set horizontal velocity, preserve vertical (px/s)
plat.setVectorY(vy)                  // Set vertical velocity, preserve horizontal (px/s, negative = up)
plat.stop()                          // Zero both velocity components immediately

// Simulate a control input for this tick. Respects ignoreInput.
// Strings are case-insensitive; spaces, underscores, and hyphens are ignored.
plat.simulateControl("left")         // Move left
plat.simulateControl("right")        // Move right
plat.simulateControl("jump")         // Press jump (auto-releases the tick after you stop calling it)
plat.simulateControl("jumprelease")  // Manually release jump (for variable height cut)
plat.simulateControl("stop")         // Zero velocity and clear all input this tick

// Numeric index equivalents: 0=left, 1=right, 2=jump, 3=jumprelease, 4=stop
plat.simulateControl(0);
```

> **Tip:** Call `simulateControl("jump")` every tick the jump button is held. The behavior automatically fires the jump-release the first tick you stop calling it, giving correct variable jump height without manual tracking.

---

### Knockback & Impulse

```js
// Add a one-time velocity kick. Deceleration naturally tapers it off.
plat.applyImpulse(vx, vy)            // px/s added to current Physics velocity

// Set velocity and block all input for a fixed duration.
// Gravity, wall slide, and max fall speed still apply.
plat.knockback(vx, vy, duration)     // vx/vy in px/s, duration in seconds
```

---

### Ability State Getters

Read-only `get` properties — no `()` needed.

```js
plat.isCoyoteTimeEnabled    // true when coyoteTime property > 0
plat.isWallSlidingEnabled   // true when wall sliding is on
plat.isWallJumpEnabled      // true when wall jumping is on
plat.isVariableJumpEnabled  // true when variable jump height is on
```

---

### Example: AI-controlled character

```js
// In a runtime script or behavior tick:
const plat = this.behaviors.PhysicsPlatformer;

if (targetX > this.x) {
  plat.simulateControl("right");
} else {
  plat.simulateControl("left");
}

if (shouldJump && plat.isCoyoteTimeEnabled) {
  plat.simulateControl("jump");
}
```

### Example: Knockback on hit

```js
function onHit(attacker) {
  const plat = this.behaviors.PhysicsPlatformer;
  const dir = this.x < attacker.x ? -1 : 1;   // push away from attacker
  plat.knockback(dir * 400, -300, 0.4);         // 400 px/s sideways, 300 px/s up, 0.4 s
}
```

---

## 30. IRenderer — Runtime Rendering API

`IRenderer` is available in addon SDK Draw() methods and via layer "beforedraw"/"afterdraw" events. It abstracts WebGL/WebGPU behind high-level drawing commands.

> **⚠ Renderer method casing differs by side — field-verified gotcha (C3 + CAW).** The **runtime** `IRenderer` (in `src/runtime/instance.js` `_draw(renderer)`) uses **camelCase**: `setAlphaBlendMode()`, `setBlendMode()`, `setColorFillMode()`, `setTextureFillMode()`, `setColor()/setColorRgba()`, `resetColor()`, `setTexture()`, `drawMesh()`, `rect()/rect2()`, `quad3()`, `line()`. The **editor** `IWebGLRenderer` (§23, in `src/editor/instance.js` `Draw(iRenderer)`) uses **PascalCase**: `SetAlphaBlendMode()`, `SetTexture()`, `DrawMesh()`, `Rect2()`, `Line()`, `Quad3()`. They are otherwise analogous. Calling the wrong casing **silently no-ops** (the method is simply `undefined`), so nothing renders and no error is thrown — easy to miss if you copy editor draw code into the runtime or vice-versa. Symptom: a world plugin that draws correctly in the Layout View but is invisible at runtime (or the reverse) almost always has a casing mismatch in its draw path.

> **`drawMesh()` array formats (runtime), restated because they bite:** positions are **3 components per vertex** `[x, y, z, ...]` (use `z = 0` for 2D — passing 2-component `[x, y]` produces garbage geometry); indices are **`Uint16Array`** (≤ 64k vertices — `createMeshData()` for more); optional per-vertex colors are **premultiplied** RGBA `[r·a, g·a, b·a, a]`. The editor `IWebGLRenderer.DrawMesh()` (§23) takes the same layout — standardise your mesh builder on 3-component positions + `Uint16Array` indices so the one buffer feeds both sides.

### Renderer State

Every draw call uses the current persistent state. Always set all relevant state before drawing:

1. **Blend mode** — how pixels are composited
2. **Fill mode** — color fill, texture fill, or smooth line fill
3. **Color** — RGBA in [0, 1]; alpha = opacity in texture mode
4. **Texture** — only used in texture fill mode

```js
renderer.setAlphaBlendMode();        // premultiplied alpha blend (most common)
renderer.setBlendMode("normal");     // same as above; also: "additive", "multiply", "screen", etc.

renderer.setColorFillMode();         // draw solid color
renderer.setTextureFillMode();       // draw texture (alpha = opacity)
renderer.setSmoothLineFillMode();    // draw smooth lines

renderer.setColor([r, g, b, a]);     // array, values 0–1
renderer.setColorRgba(r, g, b, a);   // direct params, values 0–1
renderer.setOpacity(o);              // set alpha only, 0–1
renderer.resetColor();               // opaque white (1, 1, 1, 1)

renderer.setTexture(texture);                    // set texture; sampling defaults to "auto"
renderer.setTexture(texture, "nearest");         // or "bilinear" / "trilinear"
```

> **State is persistent** — the renderer does NOT reset between calls. Always specify full state for each new draw sequence.

### Drawing Primitives

```js
// Rectangles
renderer.rect(domRect);
renderer.rect2(left, top, right, bottom);

// Quads (DOMQuad)
renderer.quad(quad);
renderer.quad2(tlx, tly, trx, try_, brx, bry, blx, bly);  // 8 floats
renderer.quad3(quad, rcTex);            // quad + DOMRect for UV source
renderer.quad4(quad, texQuad);          // quad + DOMQuad for UV source
renderer.quad5(quad, texQuad, colorArr); // + Float32Array[16] per-vertex RGBA

// 3D quads (each point has X, Y, Z)
renderer.quad3D(tlx, tly, tlz, trx, try_, trz, brx, bry, brz, blx, bly, blz, rcTex);
renderer.quad3D2(..., texQuad);
renderer.quad3D3(..., texQuad, colorArr);

// Lines
renderer.line(x1, y1, x2, y2);
renderer.texturedLine(x1, y1, x2, y2, u, v);
renderer.lineRect(left, top, right, bottom);
renderer.lineRect2(rect);
renderer.lineQuad(quad);

// Line width / cap
renderer.pushLineWidth(w);
renderer.popLineWidth();
renderer.pushLineCap("butt");   // or "square"
renderer.popLineCap();

// Convex polygon
renderer.convexPoly(pointsArray);  // [x0,y0, x1,y1, ...] — min 6 elements (3 points)
```

> **`quad3()` is the key draw call for deformed sprites.** It takes a `DOMQuad` for world-space vertex positions and a `DOMRect` for the UV source rectangle.

### Drawing Raw Meshes — `drawMesh()`

Draw an array of textured triangles in a single call. All triangles share the same renderer state.

```js
renderer.drawMesh(posArr, uvArr, indexArr, colorArr?)
// posArr    — Float32Array  [x, y, z, x, y, z, ...]       (multiple of 3)
// uvArr     — Float32Array  [u, v, u, v, ...]              (multiple of 2)
// indexArr  — Uint16Array   [i, j, k, i, j, k, ...]       (multiple of 3, triangles)
// colorArr  — Float32Array  [r, g, b, a, ...]  (optional, multiple of 4, per-vertex)
```

> **`drawMesh()` uploads all data to the GPU on every call.** Fine for small meshes; inefficient for large ones. For large/stable meshes use `createMeshData()` + `drawMeshData()` instead (data stays on the GPU).

> **Max 64k vertices** (16-bit indices). For larger meshes use `createMeshData()`.

> **Layer Z elevation is NOT applied automatically.** If you need it, offset all Z components yourself.

#### Example — two quads in one call

```js
// quad = DOMQuad of first quad; rcTex = DOMRect of UV source
const posArr = new Float32Array([
  quad.p1.x, quad.p1.y, 0,  quad.p2.x, quad.p2.y, 0,
  quad.p3.x, quad.p3.y, 0,  quad.p4.x, quad.p4.y, 0,
  quad.p1.x + 200, quad.p1.y, 0,  quad.p2.x + 200, quad.p2.y, 0,
  quad.p3.x + 200, quad.p3.y, 0,  quad.p4.x + 200, quad.p4.y, 0,
]);

const uvArr = new Float32Array([
  rcTex.left, rcTex.top,    rcTex.right, rcTex.top,
  rcTex.right, rcTex.bottom, rcTex.left, rcTex.bottom,
  rcTex.left, rcTex.top,    rcTex.right, rcTex.top,
  rcTex.right, rcTex.bottom, rcTex.left, rcTex.bottom,
]);

const indexArr = new Uint16Array([0,1,2, 0,2,3, 4,5,6, 4,6,7]);

renderer.setAlphaBlendMode();
renderer.setTextureFillMode();
renderer.resetColor();
renderer.setTexture(myTexture);
renderer.drawMesh(posArr, uvArr, indexArr);
```

### GPU-Resident Meshes — `createMeshData()` / `drawMeshData()`

For large or frequently-drawn meshes, keep data on the GPU:

```js
// Create once
const meshData = renderer.createMeshData(vertexCount, indexCount, { debugLabel: "water" });

// Fill buffers (details via IMeshData interface — get positions/UVs/indices typed arrays)
// Mark changed ranges, then draw
renderer.drawMeshData(meshData);                       // draw all
renderer.drawMeshData(meshData, indexOffset, indexCount); // draw a range (indexCount % 3 === 0)
```

> `createMeshData()` supports more than 64k vertices (unlike `drawMesh()`).

### Texture Management

```js
// Load texture for an IImageInfo (addon SDK — e.g. from GetCurrentImageInfo())
const tex = await renderer.loadTextureForImageInfo(imageInfo, opts);
renderer.getTextureForImageInfo(imageInfo);   // returns ITexture | null (sync, after load)
renderer.releaseTextureForImageInfo(imageInfo);

// Create textures from image data
const tex = await renderer.createStaticTexture(imageElement, opts);   // immutable
const tex = renderer.createDynamicTexture(width, height, opts);       // updatable
renderer.updateTexture(data, tex, opts);      // replace content (must match size)
renderer.deleteTexture(tex);                  // release; only for textures you created

// Texture opts: { wrapX, wrapY, defaultSampling, mipMap }
// wrapX/wrapY: "clamp-to-edge" | "repeat" | "mirror-repeat"
// defaultSampling: "nearest" | "bilinear" | "trilinear"  (default "trilinear")
// mipMap: boolean (default true)
```

### Coordinate Transforms

```js
renderer.setLayerTransform(layer);   // default — co-ordinates match the given ILayer
renderer.setDeviceTransform();       // device pixels relative to screen (pixel-perfect)
```

### Z and Culling (3D content)

```js
renderer.setCurrentZ(z);            // Z for all 2D draw calls that don't specify Z
renderer.getCurrentZ();

renderer.setCullFaceMode("none");    // "none" | "back" | "front"
renderer.getCullFaceMode();

renderer.setFrontFaceWinding("cw"); // "cw" (default) | "ccw"
renderer.getFrontFaceWinding();
```

> Default cull mode is **"none"** because mirrored/flipped sprites show a back face. Default winding is **"cw"** matching Construct's own rendering.

---

## 31. IMeshData — GPU Mesh Buffers

`IMeshData` represents a set of long-lived vertex buffers that live persistently on the GPU. It is the efficient alternative to the renderer `drawMesh()` method, which uploads all vertex data on every call. Once an `IMeshData` is created its vertex and index counts are fixed — they cannot be resized.

**Create via:** `renderer.createMeshData(vertexCount, indexCount, options?)`  
**Draw via:** `renderer.drawMeshData(meshData, primitive?, ...)`  
**Key requirement:** After writing data to the arrays, call `markDataChanged()` (or `markAllVertexDataChanged()` + `markIndexDataChanged()`) at least once before drawing, otherwise the GPU buffers remain empty.

---

### IMeshData Properties

```js
meshData.vertexCount   // number (read-only) — vertex count fixed at creation
meshData.indexCount    // number (read-only) — index count fixed at creation
meshData.debugLabel    // string (read-only) — label set in createMeshData() options
```

### Data Arrays

```js
meshData.positions   // Float32Array  — length = 3 * vertexCount  (x, y, z per vertex)
meshData.texCoords   // Float32Array  — length = 2 * vertexCount  (u, v per vertex)
meshData.colors      // Float16Array | Float32Array — length = 4 * vertexCount  (r, g, b, a per vertex)
                     // Float16Array requires hardware support; type may vary between devices
meshData.indices     // Uint16Array | Uint32Array — length = indexCount
                     // Uint16Array used when vertexCount fits in 16 bits, else Uint32Array
```

> **`indices` are vertex indices, not element indices.** A `positions` array with 6 elements defines 2 vertices — index `1` refers to the second vertex (`x2, y2, z2`), not element `[1]`.

> **Index buffer specifies triangles** — `indexCount` should be a multiple of 3. If you are not using indexed rendering, fill `indices` with `0, 1, 2, 3, 4, 5, ...` to render vertices in order.

> **Premultiply colors before writing.** Like all C3 WebGL colors, `colors` expects premultiplied RGBA. Use `fillColor()` for solid uniform colors.

---

### Marking Data Changed

Data is not uploaded to the GPU until the relevant buffer is marked changed. Only mark the buffers and ranges you actually modified to minimize GPU upload cost.

```js
// Mark a specific buffer changed
meshData.markDataChanged(bufferType)                  // mark entire buffer
meshData.markDataChanged(bufferType, start)           // from start to end of buffer
meshData.markDataChanged(bufferType, start, end)      // from start up to (not including) end
// bufferType: "positions" | "texCoords" | "colors" | "indices"
// start/end are in vertices (for vertex buffers) or indices (for the index buffer)

// Shorthand: mark all three vertex buffers (positions + texCoords + colors)
meshData.markAllVertexDataChanged()                   // mark all vertex buffers entirely
meshData.markAllVertexDataChanged(start)
meshData.markAllVertexDataChanged(start, end)

// Shorthand: mark the index buffer
meshData.markIndexDataChanged()                       // mark entire index buffer
meshData.markIndexDataChanged(start)
meshData.markIndexDataChanged(start, end)
```

> **Always call `markIndexDataChanged()` at least once** after first-time setup, otherwise the GPU index buffer stays empty and nothing will render.

---

### Helper Methods

```js
// Fill the entire color buffer with a single color (premultiplied RGBA, 0–1).
// Useful when mesh has no per-vertex color — fill with opaque white (1,1,1,1)
// to keep original texture colors.
// ⚠ Does NOT mark the buffer changed — call markDataChanged("colors") or
//   markAllVertexDataChanged() afterwards.
meshData.fillColor(r, g, b, a)

// Free all CPU and GPU memory. The mesh data cannot be used after this.
meshData.release()
```

---

### Typical Setup Pattern

```js
// 1. Create (once, e.g. in onCreate())
const COLS = 10;
const ROWS = 5;
const vertexCount = (COLS + 1) * (ROWS + 1);
const indexCount  = COLS * ROWS * 6;   // 2 triangles × 3 indices per quad
this._meshData = renderer.createMeshData(vertexCount, indexCount);

// 2. Fill vertex arrays
const pos = this._meshData.positions;
const uv  = this._meshData.texCoords;
for (let r = 0; r <= ROWS; r++) {
  for (let c = 0; c <= COLS; c++) {
    const v = r * (COLS + 1) + c;
    const nx = c / COLS;   // normalized 0–1
    const ny = r / ROWS;
    pos[v * 3]     = nx;   // x
    pos[v * 3 + 1] = ny;   // y
    pos[v * 3 + 2] = 0;    // z
    uv[v * 2]     = nx;    // u
    uv[v * 2 + 1] = ny;    // v
  }
}

// 3. Fill index buffer
const idx = this._meshData.indices;
let i = 0;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const tl = r * (COLS + 1) + c;
    const tr = tl + 1;
    const bl = tl + (COLS + 1);
    const br = bl + 1;
    idx[i++] = tl;  idx[i++] = tr;  idx[i++] = bl;
    idx[i++] = tr;  idx[i++] = br;  idx[i++] = bl;
  }
}

// 4. Fill colors (white = preserve texture color)
this._meshData.fillColor(1, 1, 1, 1);

// 5. Mark everything changed for first upload
this._meshData.markAllVertexDataChanged();
this._meshData.markIndexDataChanged();
```

### Per-Frame Update Pattern

```js
// In _tick() or draw callback — only update what changed
const pos = this._meshData.positions;
for (let v = 0; v < vertexCount; v++) {
  pos[v * 3 + 1] = computeY(v);  // update Y only
}
// Mark only positions changed
this._meshData.markDataChanged("positions");
// Then draw:
renderer.drawMeshData(this._meshData);
```

---

### Gotchas

- **Vertex count and index count are fixed at creation.** If the mesh topology changes, release and recreate.
- **`fillColor()` does not mark the buffer changed.** Always follow it with `markDataChanged("colors")` or `markAllVertexDataChanged()`.
- **`colors` element type varies.** Both `Float16Array` and `Float32Array` accept the same `0–1` float inputs — write values normally, C3 handles the type internally.
- **`indices` element type also varies** (Uint16 vs Uint32) based on vertex count. Assign values normally — JS typed arrays handle the range automatically.
- **Release in `_release()`.** Always call `meshData.release()` when the instance is destroyed to free GPU memory.

> Default cull mode is **"none"** because mirrored/flipped sprites show a back face. Default winding is **"cw"** matching Construct's own rendering.

---

## 32. ICollisionEngine Script Interface

`ICollisionEngine` provides access to Construct's collision engine. Access it via `runtime.collisions`.

```js
const col = runtime.collisions;  // ICollisionEngine
```

### General

```js
col.runtime   // IRuntime — reference back to the runtime
```

### Collision Tests

```js
// Test if two IWorldInstances are overlapping at their current positions
col.testOverlap(instA, instB)
// → boolean

if (runtime.collisions.testOverlap(instA, instB)) {
  console.log("Collision found!");
}

// Test if an IWorldInstance overlaps any instance from an iterable
// Returns the first overlapping IWorldInstance, or null
col.testOverlapAny(inst, iterable)
// → IWorldInstance | null  (truthy/falsey safe)

// Test if an IWorldInstance overlaps any instance with the Solid behavior
// Returns the first overlapping solid IWorldInstance, or null
col.testOverlapSolid(inst)
// → IWorldInstance | null  (truthy/falsey safe)
```

### Collision Cell Tuning

Construct sorts all objects into spatial "cells" to accelerate broadphase collision queries. The default cell size is the viewport size. Smaller cells help "bullet hell" style games with many objects in a small area; larger cells reduce overhead when objects are spread out.

```js
col.setCollisionCellSize(width, height)   // set cell size in pixels
col.getCollisionCellSize()                // → [width, height]
```

> **Use performance measurements to find the optimal cell size.** The setting also affects how many instances `getCollisionCandidates()` returns.

### Broadphase Candidate Query

```js
col.getCollisionCandidates(iObjectClasses, domRect)
// iObjectClasses — IObjectClass or IObjectClass[] (includes families)
// domRect        — DOMRect specifying the area of interest in layout co-ordinates
// → IWorldInstance[]
```

Returns instances near `domRect`. All instances **inside** the rect are returned; some near-but-outside instances may also appear (snapped to cell resolution). Instances far away are excluded.

> **The returned array may contain duplicates.** Use `new Set(candidates)` to deduplicate when the algorithm requires unique results (e.g. scoring). Skip deduplication when a repeated check is harmless (e.g. destroy-on-first-hit).

This is the same method described in §17 but documented here with its full interface.

---

## 33. IStorage Script Interface

`IStorage` wraps IndexedDB-based key-value storage. Accessed via `runtime.storage`. Shares the same storage as the Local Storage plugin — data written from script is readable in event sheets (for string/number values), and vice versa. Storage is scoped to the specific project.

```js
const storage = runtime.storage;
```

### APIs

```js
// Read a value. Resolves to the value, or null if the key doesn't exist.
// Also resolves to null on read errors (does not throw).
await storage.getItem(key)
// → any | null

// Write a value. Resolves when the write completes.
// Rejects if the write fails (e.g. storage quota exceeded) — use try/catch.
await storage.setItem(key, value)

// Delete a key. Resolves when the removal completes.
await storage.removeItem(key)

// Delete all items. Resolves when the clear completes.
await storage.clear()

// Get all key names. Resolves to an array of strings.
await storage.keys()
// → string[]
```

### Notes

- Any value that can be stored in IndexedDB is supported: numbers, strings, Blobs, ArrayBuffers, plain objects, etc.
- The event sheet can only read/write strings and numbers. If script stores another type, it won't be usable from event-sheet expressions.
- Wrap `setItem` calls in `try/catch` — storage-full errors reject the promise and will crash if unhandled.

```js
try {
  await runtime.storage.setItem("highScore", score);
} catch (e) {
  console.warn("Storage write failed:", e);
}
```

---

## 34. IAssetManager Script Interface

`IAssetManager` provides access to project assets (audio, project files, scripts, WASM). Accessed via `runtime.assets`.

On modern platforms, standard `fetch()` works directly. Use `IAssetManager` when targeting environments where direct fetch is blocked (e.g. Playable Ads, legacy export options).

```js
const assets = runtime.assets;  // IAssetManager
```

### General

```js
assets.runtime          // IRuntime — reference back to the runtime
assets.mediaFolder      // string — subfolder for audio/video files
                        //   empty string in preview; "media/" after export
assets.projectFileList  // read-only array — list of project files at preview/export time
                        //   each entry: { name: string, size: number }
                        //   name is the relative path, e.g. "subfolder/mydata.json"
```

> **`projectFileList` is a snapshot.** It reflects the state at preview/export time, not post-export file changes.

### Fetching

```js
await assets.fetchText(url)          // → string
await assets.fetchJson(url)          // → any (parsed JSON)
await assets.fetchBlob(url)          // → Blob
await assets.fetchArrayBuffer(url)   // → ArrayBuffer

// Resolve a URL for direct use (e.g. as <video src>)
// May return the original URL or a blob: URL depending on export platform
await assets.getProjectFileUrl(url)  // → string (URL safe for direct fetch/assignment)
await assets.getMediaFileUrl(url)    // → string (same, but for audio/video in the media folder)
```

### Loading Scripts

```js
// Fetch and execute JS files from the project Files folder.
// Scripts run in order when multiple are specified.
// Load all needed scripts in one call for best efficiency.
await assets.loadScripts("lib1.js", "lib2.js")
```

### WebAssembly

```js
// Fetch and compile a .wasm file using streaming compilation where supported.
// Returns a WebAssembly.Module — must be instantiated before use.
const module = await assets.compileWebAssembly("game.wasm");
const instance = await WebAssembly.instantiate(module, imports);
```

### Stylesheets

```js
// Fetch and apply a CSS stylesheet to the document.
await assets.loadStyleSheet("styles.css")
```

---

## 35. IAABB3D Script Interface

`IAABB3D` represents an axis-aligned bounding box in 3D space, with minimum and maximum extents on the X, Y, and Z axes. Returned by `IWorldInstance.getBoundingBox3d()`.

```js
const bb = inst.getBoundingBox3d();  // IAABB3D
```

### Constructor

```js
new IAABB3D(left, top, back, right, bottom, front)
// All parameters optional — default to 0
```

### Properties

```js
bb.left    // minimum X
bb.top     // minimum Y
bb.back    // minimum Z
bb.right   // maximum X
bb.bottom  // maximum Y
bb.front   // maximum Z
```

### Methods

```js
bb.clone()                                        // → new IAABB3D (copy)
bb.copy(other)                                    // set this from another IAABB3D
bb.set(left, top, back, right, bottom, front)    // set all properties at once
```

---

## 36. Instance & Behavior Instance Event Properties

Events fired on `IInstance` or `IBehaviorInstance` pass an event object to the handler. The standard properties are listed below; each specific event type may add additional properties.

### Instance events (fired on `IInstance` and derivatives)

```js
inst.addEventListener("someevent", (e) => {
  e.instance   // IInstance (or derivative) that fired the event
});
```

Standard instance event properties:

- `instance`: reference to the `IInstance` (or derivative) which fired the event.

### Behavior instance events (fired on `IBehaviorInstance` and derivatives)

```js
behaviorInst.addEventListener("someevent", (e) => {
  e.instance          // IInstance (or derivative) associated with the behavior
  e.behaviorInstance  // IBehaviorInstance that fired the event
});
```

Standard behavior instance event properties:

- `instance`: reference to the `IInstance` (or derivative) associated with the behavior instance which fired the event.
- `behaviorInstance`: reference to the `IBehaviorInstance` which fired the event.

### World instance "hierarchyready" event

A special event fired on the **root** `IWorldInstance` of a scene graph hierarchy after all instances in the hierarchy have finished creating (including triggering "On created" in event sheets). Use it to safely initialize logic that depends on child instances existing.

```js
rootInst.addEventListener("hierarchyready", () => {
  // All children of rootInst are guaranteed to exist here
  for (const child of rootInst.allChildren()) {
    // configure child ...
  }
});
```

> **Only fires for the root instance.** Children do not receive this event. Iterate children from the root using `allChildren()`.

World-instance events are subscribed with `addEventListener` and include the standard instance-event properties. Addons may fire additional plugin-specific events.

---

## 37. ILoopingConditionContext — Looping Conditions

`ILoopingConditionContext` drives looping ACE conditions. It is created by `runtime.sdk.createLoopingConditionContext()` (see §28 for the creation call). This section documents the interface itself.

```js
const ctx = this.runtime.sdk.createLoopingConditionContext("MyLoop");
```

### APIs

```js
ctx.retrigger()   // Execute one iteration — runs all subsequent conditions, actions,
                  // and sub-events within this looping condition call

ctx.isStopped     // boolean (read-only) — true when the user invoked "Stop loop"
                  // Check this after each retrigger() and break if true

ctx.release()     // MUST be called after the loop ends — cleans up internal state
```

### Pattern

```js
export default function (count) {
  const ctx = this.runtime.sdk.createLoopingConditionContext("MyLoop");

  for (let i = 0; i < count; i++) {
    ctx.retrigger();
    if (ctx.isStopped) break;
  }

  ctx.release();  // mandatory — always in a finally block for safety
}
```

> **`ctx.release()` is mandatory.** Omitting it leaks state and breaks subsequent loops. Use a `try/finally` block if the loop body can throw.

> **Nested loops** require distinct loop names so `loopindex("name")` resolves to the correct iteration for each level.

---

## 38. IWorldInstance Script Interface

`IWorldInstance` represents a single instance of an object type that appears in a layout. It derives from `IInstance`. Access instances via `IObjectClass` methods like `runtime.objects.Sprite.getFirstInstance()`.

Many objects expose a more specific interface derived from `IInstance`/`IWorldInstance` with plugin-specific APIs. See plugin-interface docs for plugin-specific additions.

> Do not confuse `runtime.objects.Sprite` (`IObjectClass`) with an instance — the class has no position. Get an instance first: `runtime.objects.Sprite.getFirstInstance().x`.

### Getting an IWorldInstance

```js
const firstSprite = runtime.objects.Sprite.getFirstInstance();
const player = runtime.objects.Player.getFirstInstance();
```

> A common mistake is trying `runtime.objects.Sprite.x`. `runtime.objects.Sprite` is an `IObjectClass`, not an instance.

### General

```js
inst.layout   // ILayout — the layout the instance is on
inst.layer    // ILayer  — the layer the instance is on
```

### Position

```js
inst.x
inst.y
inst.setPosition(x, y)
inst.getPosition()           // → [x, y]
inst.offsetPosition(dx, dy)  // adds dx/dy to x/y

inst.z                       // Z co-ordinate relative to its layer
inst.totalZ                  // read-only: Z + layer's Z elevation (absolute scene Z)

inst.setPosition3d(x, y, z)
inst.offsetPosition3d(dx, dy, dz)
inst.getPosition3d()         // → [x, y, z]
```

Recommended runtime pattern for addon compatibility:

1. Prefer `setPosition3d()` and `getPosition3d()` when handling XYZ data.
2. Use `setPosition(x, y)` and `getPosition()` as the 2D fallback when 3D position APIs are unavailable.

```js
const p3 = inst.getPosition3d ? inst.getPosition3d() : null;
if (p3) {
  inst.setPosition3d(p3[0] + 10, p3[1], p3[2]);
} else {
  const p2 = inst.getPosition();
  inst.setPosition(p2[0] + 10, p2[1]);
}
```

### Origin

```js
inst.originX                    // normalized 0–1: 0=left, 0.5=centre, 1=right
inst.originY                    // normalized 0–1: 0=top, 0.5=centre, 1=bottom
inst.setOrigin(originX, originY)
inst.getOrigin()                // → [originX, originY]
```

> With Sprite objects, changing the animation frame updates the origin according to the Animations Editor origin placement.

### Size

```js
inst.width
inst.height
inst.depth          // 0 for 2D objects; relevant for 3D only
inst.setSize(width, height)
inst.setSize3d(width, height, depth)
inst.getSize()      // → [width, height]
inst.getSize3d()    // → [width, height, depth]
```

### Angle

```js
inst.angle         // radians — changing this updates angleDegrees
inst.angleDegrees  // degrees — changing this updates angle
```

### Bounding Box / Quad

```js
inst.getBoundingBox(ignoreMesh = false)    // → DOMRect (layout co-ords, copy)
inst.getBoundingBox3d(ignoreMesh = false)  // → IAABB3D  (layout co-ords, copy)
inst.getBoundingQuad(ignoreMesh = false)   // → DOMQuad  (layout co-ords, copy, includes rotation)
```

> Returns a **copy** — changes to the returned value do not affect the instance, and the value does not update if the instance moves.

> `ignoreMesh = false` (default) accounts for mesh distortion. Pass `true` to get the undeformed bounds.

### Appearance

```js
inst.isVisible         // boolean — get/set
inst.isOnScreen()      // → boolean — true if any part of bounding box is in screen area
                       //   not affected by isVisible or opacity

inst.opacity           // number 0–1: 0=transparent, 1=opaque
inst.colorRgb          // [r, g, b] array (0–1 each) — color filter
inst.blendMode         // string — "normal", "additive", "multiply", "screen", etc.
inst.sampling          // "auto" | "nearest" | "bilinear" | "trilinear"
inst.activeSampling    // read-only — resolved sampling mode (differs from sampling when "auto")
inst.effects           // IEffectInstance[] — per-effect parameter access
```

### Colour Filter Learnings (C3 + CAW)

These were verified while implementing colour spring support against live Construct runtime instances.

1. Use `inst.colorRgb` as the primary runtime colour API:
`colorRgb` is the reliable scripting surface on `IWorldInstance`, with three float components in the 0-1 range.

```js
inst.colorRgb = [1, 0.5, 0.5];   // light red tint
const [r, g, b] = inst.colorRgb; // values are 0-1 floats
```

2. Inheritance matters:
Specific world-instance types such as `ISpriteInstance` inherit `IWorldInstance`, so `colorRgb` is available there as well. Do not assume a sprite needs a separate sprite-only colour API.

3. Runtime colour and editor colour are different surfaces:
At runtime, use `colorRgb` with `[r, g, b]` floats. In the editor SDK, plugin property colours use `SDK.Color`. Do not mix the two APIs.

4. Do not rely on method-name fallbacks for standard colour filtering:
For normal Construct runtime instances, prefer the documented property surface over probing for `setColor`, `getColorRgb`, or similar variants. Those may exist on some internal surfaces, but `colorRgb` is the documented and stable path.

5. Convert spring/internal colour channels before applying:
If your addon stores colour channels as 0-255 values internally, convert to 0-1 before assigning to `colorRgb`.

```js
inst.colorRgb = [r255 / 255, g255 / 255, b255 / 255];
```

6. For constant colour systems, treat the live instance colour as the source of truth:
If other actions or event-sheet logic can also tint the object, read `inst.colorRgb` before retargeting the constant colour spring. Otherwise stale internal spring state can override the instance's actual current colour.

### IEffectInstance Script Interface (via `effects`)

`IEffectInstance` represents parameters for a single effect on an `IWorldInstance`, `ILayer`, or `ILayout`.

```js
effect.index                 // number (read-only) — zero-based index in the effects array
effect.name                  // string (read-only) — effect name
effect.isActive              // boolean get/set — disables/enables this effect

effect.setParameter(index, value)
effect.getParameter(index)
// index: zero-based parameter index
// value: usually number; color params use [r, g, b] with values in 0-1
```

> Inactive effects behave as if removed from rendering, but can be re-enabled later. Disabling unused effects can improve performance.

### Z Order

```js
inst.moveToTop()                          // move to top of current layer
inst.moveToBottom()                       // move to bottom of current layer
inst.moveToLayer(layer)                   // move to top of a different ILayer
inst.moveAdjacentToInstance(other, isAfter)
  // isAfter=true → just above other; false → just below. Also moves to same layer if needed.
inst.zIndex                               // read-only integer — current Z index on the layer (0=back)
```

### Collision

```js
inst.isCollisionEnabled           // boolean get/set — false = always fails overlap checks
inst.containsPoint(x, y)          // → boolean — point-in-collision-polygon test
inst.testOverlap(wi)              // → boolean — overlap check against another IWorldInstance
inst.testOverlapSolid()           // → IWorldInstance | null — first overlapping Solid instance
                                  //   truthy/falsey safe; respects solid collision filtering
```

### Mesh Distortion

```js
inst.createMesh(hsize, vsize)     // create mesh (minimum 2×2)
inst.releaseMesh()                // revert to default rendering, no mesh
inst.setMeshPoint(col, row, opts) // opts: { mode, x, y, z, u, v }
                                  //   mode: "absolute" (default) or "relative"
                                  //   x, y: position offset in normalized [0,1] co-ords
                                  //   z: absolute Z offset (3D distortion)
                                  //   u, v: texture co-ords in [0,1]; omit / set to -1 to leave unchanged
inst.getMeshPoint(col, row)       // → opts object (always absolute values)
inst.getMeshSize()                // → [hsize, vsize], or [0, 0] if no mesh
```

### Mesh Distortion Learnings (C3 + CAW)

These were validated while building and debugging a mesh-driven LOS behavior.

1. Mesh API surface varies across runtime paths:
Use a fallback chain: direct instance methods first, then world-info variants (`setMeshPoint`/`SetMeshPoint`, `setMeshSize`/`SetMeshSize`, `createMesh`/`CreateMesh`). Do not assume one naming surface is always present.

2. Mesh grid existence is not guaranteed:
Creating or resizing the mesh may not expose readable size fields immediately in all builds. Keep a probe/adopt fallback so writes can still succeed even when dimensions are not directly queryable.

3. Full-circle seams need explicit closure:
For 360-degree polygons, force the final boundary sample to match the first vertex. Relying on interpolation alone can leave a visible gap at the seam.

4. Event-sheet timing matters for visual responsiveness:
If angle/range are changed by events, update LOS in `_tick2()` (post-events) instead of `_tick()` so mesh deformation reflects the same frame.

5. Rotated obstacle fidelity requires polygon/quad sampling:
AABB-only fallback produces wrong blocking for rotated objects. Prefer collision-poly points when available; otherwise use oriented quad fallback before rectangular bounds.

6. Keep editor preview expectations realistic:
Construct editor mode can provide a visual helper (for example range/cone proxy via behavior editor hooks), but full runtime mesh distortion/occlusion logic should still be treated as runtime-only.

### Mesh Update Pattern For Ribbon/Trail Behaviors

For mesh-driven trail effects (for example style ribbons), the most reliable SDK v2 update pattern is:

1. Build all ribbon edge points in world space first.
2. Compute dynamic bounds from those points (`minX`, `minY`, `maxX`, `maxY`).
3. Reposition and resize the host instance to those bounds.
4. Normalize each mesh point to `[0,1]` using that same bounds box.
5. Write mesh points in a consistent orientation matching `createMesh()`.

```js
// Suggested orientation for trail ribbons:
// columns = points along trail length, rows = ribbon sides (0=left, 1=right)
inst.createMesh(totalRows, 2);

for (let col = 0; col < totalRows; col++) {
  inst.setMeshPoint(col, 0, { mode: "absolute", x: leftXNorm,  y: leftYNorm,  u, v });
  inst.setMeshPoint(col, 1, { mode: "absolute", x: rightXNorm, y: rightYNorm, u, v });
}
```

Important details:

- `setMeshPoint(col, row, ...)` uses **column first**, **row second**.
- `x`/`y` are normalized coordinates in `[0,1]`.
- For passthrough UV behavior, set `u`/`v` to `-1`.
- Prefer `_tick2()` for mesh writes when event-sheet actions can change inputs on the same frame.
- If the host instance is rotated/scaled externally, trail meshes can visually drift unless hierarchy transform settings are controlled.

### Scene Graph

```js
inst.getParent()           // → IWorldInstance | null
inst.getTopParent()        // → IWorldInstance | null
inst.parents()             // generator — walks up parent chain
inst.getChildCount()       // → number
inst.getChildAt(index)     // → IWorldInstance | null
inst.children()            // generator — direct children
inst.allChildren()         // generator — all descendants recursively

inst.addChild(wi, opts)
// opts boolean properties (all default false):
//   transformX, transformY, transformZ
//   transformWidth, transformHeight
//   transformAngle, transformOpacity, transformVisibility
//   destroyWithParent

inst.getHierarchyOpts()    // → opts object matching addChild() format (current child settings)
inst.removeChild(wi)       // detach a previously added child
inst.removeFromParent()    // shorthand: removes this instance from its parent
```

> `addChild()` has no effect if `wi` already has a parent. Remove it from the existing parent first.

> `getHierarchyOpts()` returns the opts object as-is — can be passed directly to a new `addChild()` call to re-use the same options.

### Hierarchy Settings For Mesh Behaviors

Mesh behaviors that manually set mesh points (trail ribbons, water surfaces, cloth strips) usually should not inherit parent angle/scale transforms. If they do, the parent transform can rotate/scale the already-deformed mesh and break expected rendering.

Recommended options when binding a mesh child to a parent:

```js
const opts = {
  transformX: true,
  transformY: true,
  transformWidth: false,
  transformHeight: false,
  transformAngle: false,
  transformZ: true,
  transformZElevation: true,
  destroyWithParent: true,
};

// Rebind to apply new settings if the relationship already exists.
parent.removeChild(child);
parent.addChild(child, opts);
```

Practical rule for trail behaviors:

- Keep `transformX`/`transformY` enabled.
- Disable `transformAngle` for the trail host object.
- Disable size syncing unless the effect explicitly expects parent scaling.
- Rebind (`removeChild` + `addChild`) when changing options at runtime.

### "hierarchyready" Event

```js
rootInst.addEventListener("hierarchyready", () => {
  // All instances in the hierarchy have been created.
  // Safe to inspect/configure the full hierarchy here.
  for (const child of rootInst.allChildren()) { /* ... */ }
});
```

> Only fires on the **root** instance (the one with no parent). Children do not receive this event.

---

## 39. IPlugin Script Interface

`IPlugin` represents a plugin (e.g. the Sprite plugin). A plugin exists once in the project; multiple Sprite *object types* each have their own `IObjectClass`, but they all share one `IPlugin`.

### Properties

```js
plugin.runtime                  // IRuntime — reference back to the runtime
plugin.id                       // string (read-only) — unique plugin identifier set by the developer
plugin.isSingleGlobal           // boolean (read-only) — true when only one global instance exists (e.g. Mouse)
plugin.isWorldType              // boolean (read-only) — true when the plugin appears in layouts
plugin.isHTMLElementType        // boolean (read-only) — true when the plugin creates an HTML element
plugin.isRotatable              // boolean (read-only) — true when instances may be rotated
plugin.hasEffects               // boolean (read-only) — true when the plugin may use effects
plugin.is3d                     // boolean (read-only) — true when the plugin has Z-axis depth
plugin.supportsHierarchies      // boolean (read-only) — true when instances may be used in hierarchies
plugin.supportsMesh             // boolean (read-only) — true when instances may use mesh distortion
```

### Single-global accessors

Only valid when `isSingleGlobal` is `true`:

```js
plugin.getSingleGlobalObjectType()   // → IObjectClass — the sole object class for this plugin
plugin.getSingleGlobalInstance()     // → IInstance    — the sole instance for this plugin
```

### Static lookup

```js
IPlugin.getByConstructor(C3.Plugins.Audio)
// → IPlugin | null — returns the IPlugin for a given constructor in the C3.Plugins namespace.
// Returns null if the plugin is not used in the project.
```

---

## 40. IObjectClass Script Interface

`IObjectClass` is the base class shared by `IObjectType` and `IFamily`. Most APIs for working with instances live here.

### Object class events

```js
objectClass.addEventListener("instancecreate", (e) => {
  e.instance   // IInstance (or derivative) — the newly created instance
});

objectClass.addEventListener("hierarchyready", (e) => {
  e.instance   // IWorldInstance (or derivative) — the root of the completed hierarchy
});

objectClass.addEventListener("instancedestroy", (e) => {
  e.instance         // IInstance (or derivative) — the destroyed instance (now invalid)
  e.isEndingLayout   // boolean — true if destroyed because the layout is ending
  // Clear any references to e.instance here — accessing it afterwards throws
});
```

### APIs

```js
objectClass.runtime   // IRuntime
objectClass.plugin    // IPlugin (or derivative)
objectClass.name      // string (read-only) — the object class name

objectClass.addEventListener(eventName, callback)
objectClass.removeEventListener(eventName, callback)

// Instance access
objectClass.getAllInstances()         // → IInstance[] (or derivatives)
objectClass.getFirstInstance()        // → IInstance | null
objectClass.*instances()              // generator — iterates all instances

// Event-sheet picked instances (only useful in script-in-event-sheet context)
objectClass.getPickedInstances()      // → IInstance[]
objectClass.getFirstPickedInstance()  // → IInstance | null
objectClass.*pickedInstances()        // generator

// Pairing (matches IID-based pairing logic used by the event system)
objectClass.getPairedInstance(inst)
// Returns the instance of this object class at the same IID as inst.
// Wraps around if this class has fewer instances than inst's class.

// Custom actions (call event-sheet custom actions from script)
objectClass.callCustomAction(name, instances, ...params)
// name      — case-insensitive string of the custom action name
// instances — iterable of IInstance belonging to this class (picks them for the action)
// params    — values passed to the custom action parameters
// More efficient to call once with multiple instances than repeatedly with one each time.
```

---

## 41. IObjectType Script Interface

`IObjectType` derives from `IObjectClass` and represents one specific object type (e.g. one Sprite object). It adds instance-creation and family-membership APIs not available on the base class.

### APIs

```js
// Instance subclassing
objectType.setInstanceClass(Class)
// Set a custom script class for this object type. Must derive from the default class.
// Call only in runOnStartup(), before any instances are created.

// Instance creation
objectType.createInstance(layerNameOrIndex, x, y, createHierarchy?, template?)
// layerNameOrIndex — case-insensitive layer name string, or zero-based layer index
// x, y             — position in layout co-ordinates
// createHierarchy  — if true, also creates all scene-graph children with connections in place
// template         — optional template name to base the new instance on
// → IInstance (or derivative)

// Family membership
objectType.getAllFamilies()         // → IFamily[]
objectType.*families()             // generator — all families this type belongs to
objectType.isInFamily(family)      // → boolean
```

> `createInstance()` returns the script interface for the new instance. If `createHierarchy` is `true` and the object type has children configured in the Layout View, those children are also created and linked automatically.

---

## 42. IFamily Script Interface

`IFamily` derives from `IObjectClass` and represents a family of object types. All `IObjectClass` methods (instance iteration, events, etc.) work on families and cover all member object types.

### APIs

```js
family.getAllObjectTypes()         // → IObjectType[] — all member object types
family.*objectTypes()             // generator — iterates all member object types
family.hasObjectType(objectType)  // → boolean — true if objectType is a member
```

### Access pattern

```js
// Access via runtime.objects (same as object types)
const family = runtime.objects.EnemyFamily;  // IFamily
for (const inst of family.instances()) {
  // inst is any instance of any member type
}
```

---

## 43. IInstance Script Interface

`IInstance` represents a single instance of an object type. Instances that appear in layouts use `IWorldInstance` (which derives from `IInstance`), so all properties below are available on world instances too.

### Instance events

```js
inst.addEventListener("destroy", (e) => {
  e.isEndingLayout  // boolean — true if destroyed at end of layout
  // Clear all references to this instance here — it is invalid after this event
});
```

### APIs

```js
inst.addEventListener(type, func, capture?)
inst.removeEventListener(type, func, capture?)
inst.dispatchEvent(e)    // fire a custom event; create with: new C3.Event("name", isCancellable)

inst.runtime             // IRuntime
inst.objectType          // IObjectType — the instance's object type
inst.plugin              // IPlugin (or derivative) — the instance's plugin
inst.uid                 // number (read-only) — unique ID; use runtime.getInstanceByUid(uid) to look up
inst.iid                 // number (read-only) — index ID within the object type
inst.templateName        // string (read-only) — template name used to create this instance, or ""

// Instance variables (if any)
inst.instVars.health     // named access
inst.instVars["health"]  // string-key access (for non-identifier names)

// Behaviors (if any)
inst.behaviors.Bullet                 // named access
inst.behaviors["8Direction"]          // string-key access

inst.destroy()           // destroy this instance; do not use it after calling this
// For destroying many instances efficiently, use runtime.destroyMultiple() instead

// Container
inst.getOtherContainerInstances()     // → IInstance[] — other instances in the same container
inst.*otherContainerInstances()       // generator

// Time scale
inst.dt                  // delta-time using the instance's own time scale
inst.timeScale           // get/set instance-specific time scale (e.g. 1.0=normal, 0=paused)
inst.restoreTimeScale()  // revert to following the runtime time scale

// Signals (co-routine / async coordination)
inst.signal(tag)         // trigger "On signal" for this instance; resolves waitForSignal()
await inst.waitForSignal(tag)  // returns a Promise that resolves when tag is signalled

// Tags
inst.hasTag(tag)         // → boolean — check a single tag (more efficient than hasTags for one tag)
inst.hasTags(...tags)    // → boolean — check multiple tags (all must be present)
inst.setAllTags(tags)    // set all tags from any iterable of strings (replaces existing)
inst.getAllTags()         // → Set<string> — all current tags

// Custom actions (shorthand for single-instance calls)
inst.callCustomAction(name, ...params)
// Equivalent to: inst.objectType.callCustomAction(name, [inst], ...params)
// Prefer objectType.callCustomAction() when acting on multiple instances at once
```

---

## 44. IDOMInstance Script Interface

`IDOMInstance` represents an instance that renders a DOM element (e.g. Button, TextBox). It derives from `IWorldInstance`.

```js
domInst.focus()                   // focus the DOM element
domInst.blur()                    // remove focus from the DOM element
domInst.setCssStyle(prop, val)    // apply a CSS style (CSS property name + value strings)
                                  // e.g. domInst.setCssStyle("background-color", "red")
domInst.getElement()              // → HTMLElement — direct DOM element access
                                  // ⚠ Throws in worker mode — only call on the main thread
```

> `setCssStyle()` works in worker mode. `getElement()` does not — gate it with a thread check if needed.

---

## 45. IBehaviorInstance Script Interface (Runtime)

This section also includes the base `IBehavior` and `IBehaviorType` scripting references used by `IBehaviorInstance`.

### IBehavior Script Interface

`IBehavior` represents a behavior kind (for example Solid, Physics, Pin). It is usually accessed from `IBehaviorInstance.behavior`.

```js
behavior.runtime             // IRuntime — reference back to runtime
behavior.id                  // string (read-only) — unique behavior identifier

behavior.getAllInstances()   // → IBehaviorInstance[] — all instances using this behavior

IBehavior.getByConstructor(ctor)
// → IBehavior | null
// Example: IBehavior.getByConstructor(C3.Behaviors.Bullet)
```

### IBehaviorType Script Interface

`IBehaviorType` represents a behavior added to one object class. If two object types both have Bullet, there are two behavior types.

```js
behaviorType.runtime         // IRuntime
behaviorType.behavior        // IBehavior
behaviorType.name            // string (read-only)
```

### IBehaviorInstance Script Interface

`IBehaviorInstance` represents one behavior attached to an `IInstance`. Access it via `inst.behaviors.BehaviorName`.

```js
// Events
behaviorInst.addEventListener(type, func, capture?)
behaviorInst.removeEventListener(type, func, capture?)
behaviorInst.dispatchEvent(e)    // e.g. new C3.Event("arrived", true)

// References
behaviorInst.instance       // IInstance — object instance this behavior affects
behaviorInst.behavior       // IBehavior — behavior kind
behaviorInst.behaviorType   // IBehaviorType — behavior type on this object class
behaviorInst.runtime        // IRuntime
```

### Access pattern

```js
const mySpriteInst = runtime.objects.Sprite.getFirstInstance();
const myBehaviorInst = mySpriteInst.behaviors.Platform;
// ... do something with myBehaviorInst ...
```

### Dispatching custom events from addon SDK

```js
const e = new C3.Event("arrived", true);
this.GetScriptInterface().dispatchEvent(e);
```

---

## 46. IAnimationFrame Script Interface (Runtime)

`IAnimationFrame` represents one frame within an `IAnimation` at runtime. It derives from `IImageInfo`. Positions (origin, image points, collision polygon) are **normalized** (0–1 relative to the frame), not layout co-ordinates.

> This is the **runtime** interface. The **editor-side** `IAnimationFrame` (§20) has a different API set.

### IImageInfo Script Interface (base class)

`IImageInfo` is the base interface for image metadata and is the parent of `IAnimationFrame`.

```js
imageInfo.width       // number (read-only) — width in pixels
imageInfo.height      // number (read-only) — height in pixels
imageInfo.getSize()   // → [width, height]
```

```js
frame.duration          // number (read-only) — relative duration; 1=normal, 2=twice as long
frame.tag               // string — tag assigned to this frame in the Animation Editor

// Origin
frame.originX           // number (read-only) — normalized 0–1
frame.originY           // number (read-only) — normalized 0–1
frame.getOrigin()       // → [originX, originY]

// Image points
frame.getImagePointCount()          // → number
frame.getImagePointX(nameOrIndex)   // → number (normalized 0–1); returns origin if not found
frame.getImagePointY(nameOrIndex)   // → number (normalized 0–1); returns origin if not found
frame.getImagePoint(nameOrIndex)    // → [x, y] (normalized 0–1)

// Collision polygon
frame.getPolyPointCount()           // → number
frame.getPolyPointX(index)          // → number — normalized, relative to origin
frame.getPolyPointY(index)          // → number — normalized, relative to origin
frame.getPolyPoint(index)           // → [x, y] — normalized, relative to origin
```

### Coordinate system for poly points

Collision polygon points are **normalized and relative to the origin**. When the origin is at `(0.5, 0.5)`, the top-left corner has coordinates `(-0.5, -0.5)`.

To convert to world-space (see also §17):

```js
const wx = inst.x + frame.getPolyPointX(i) * inst.width;
const wy = inst.y + frame.getPolyPointY(i) * inst.height;
```

> **Runtime vs editor poly point APIs differ.** The editor `ICollisionPoly` (§20) returns absolute texture-coord points via `GetPoints()`. The runtime `IAnimationFrame` returns origin-relative normalized points via `getPolyPointX/Y()`.

---

## 47. IAnimation Script Interface (Runtime)

`IAnimation` represents one named animation of a Sprite-like plugin. Frames are accessed via `IAnimationFrame` (§46).

```js
anim.name           // string (read-only) — animation name
anim.speed          // number (read-only) — playback speed in frames per second
anim.isLooping      // boolean (read-only) — true if animation repeats at the end
anim.repeatCount    // number (read-only) — how many times to repeat
anim.repeatTo       // number (read-only) — zero-based frame index to jump back to on repeat
anim.isPingPong     // boolean (read-only) — true if animation reverses at the start/end
anim.frameCount     // number (read-only) — total number of frames

anim.getFrames()    // → IAnimationFrame[] — all frames in sequence
anim.*frames()      // generator — iterates all IAnimationFrame in sequence
```

### Access pattern

```js
// Typically accessed via a Sprite instance's ISpriteInstance API
const sprite = runtime.objects.Sprite.getFirstInstance();
const anim = sprite.animation;       // IAnimation — current animation
const frame = anim.getFrames()[0];   // IAnimationFrame — first frame
```

> All properties on `IAnimation` are **read-only** — use the Sprite behavior's animation actions from the event sheet to change animation state at runtime.

---

## 48. IRuntime Script Interface

`IRuntime` is the main scripting interface to the Construct engine. Accessed as `runtime` in event-sheet scripts (passed as a parameter) and via `runOnStartup()` in script files.

### Runtime Events

Listen with `runtime.addEventListener(eventName, callback)`.

| Event | Description |
|---|---|
| `"resize"` | Display size changed. Event has `cssWidth`, `cssHeight`, `deviceWidth`, `deviceHeight`. |
| `"window-maximized"` / `"window-minimized"` | App window state; desktop exports only. |
| `"pretick"` / `"tick"` / `"tick2"` | Per-tick hooks. Order: pretick → behaviors tick → tick → event sheets run → tick2. |
| `"beforeprojectstart"` / `"afterprojectstart"` | Fires once on first layout start (before/after On start of layout). Supports async handlers. |
| `"beforeanylayoutstart"` / `"afteranylayoutstart"` | Fires on every layout start. Event has `layout` property. Supports async handlers. |
| `"beforeanylayoutend"` / `"afteranylayoutend"` | Fires on every layout end. Event has `layout` property. Supports async handlers. |
| `"keydown"` / `"keyup"` | Keyboard input (copies of `KeyboardEvent`). |
| `"mousedown"` / `"mousemove"` / `"mouseup"` / `"dblclick"` | Mouse input (copies of `MouseEvent`). Use pointer events to cover both mouse and touch. |
| `"wheel"` | Mouse wheel (`WheelEvent`). |
| `"pointerdown"` / `"pointermove"` / `"pointerup"` / `"pointercancel"` | Pointer input (mouse, pen, touch). Copies of `PointerEvent`. Mouse-type pointers have an extra `lastButtons` property. |
| `"deviceorientation"` / `"devicemotion"` | Orientation/motion sensor. Requires permission via `touch.requestPermission()`. |
| `"suspend"` / `"resume"` | App going to background / returning to foreground. |
| `"save"` / `"load"` | Savegame system. Event has `saveData` (plain JSON). Supports async handlers. |
| `"instancecreate"` | Any instance created. Event has `instance` property. |
| `"hierarchyready"` | Root instance of a hierarchy fully created. Event has `instance` property. |
| `"instancedestroy"` | Any instance destroyed. Event has `instance` and `isEndingLayout`. Do not use the instance after this. |
| `"loadingprogress"` | Fires when `loadingProgress` changes on a loader layout. |
| `"afterload"` (SDK) | Fired after `_loadFromJson()` when restoring saved state — use `getInstanceByUid()` here. |

### Runtime APIs

```js
// Event listeners
runtime.addEventListener(eventName, callback)
runtime.removeEventListener(eventName, callback)

// Object access
runtime.objects                        // object with a property per object class (IObjectClass)
runtime.objects.Sprite                 // IObjectClass for Sprite
runtime.objects["Sprite"]              // string-key access for non-identifier names
runtime.getInstanceByUid(uid)          // IInstance | null

// Global variables (event sheet)
runtime.globalVars.Score               // direct property access
runtime.globalVars["Score"]            // string-key access

// Shorthand plugin refs (only set if the plugin is added to the project)
runtime.mouse                          // Mouse script interface
runtime.keyboard                       // Keyboard script interface
runtime.touch                          // Touch script interface
runtime.timelineController             // Timeline Controller script interface
runtime.platformInfo                   // IPlatformInfo (always available)
runtime.collisions                     // ICollisionEngine
runtime.renderer                       // IRenderer — use only in draw events (or for texture loading)
runtime.assets                         // IAssetManager
runtime.storage                        // IStorage

// Layout
runtime.layout                         // ILayout — current layout
runtime.getLayout(nameOrIndex)          // ILayout — by name (case-insensitive) or zero-based index
runtime.getAllLayouts()                 // ILayout[] — all layouts in project order
runtime.goToLayout(nameOrIndex)         // end current layout and switch (takes effect end of tick)

// Project metadata
runtime.projectId                      // string
runtime.projectName                    // string
runtime.projectUniqueId                // string
runtime.projectVersion                 // string

// Viewport
runtime.viewportWidth                  // number (read-only)
runtime.viewportHeight                 // number (read-only)
runtime.getViewportSize()              // [width, height]

// Loading
runtime.loadingProgress                // 0-1 (loader layout)
runtime.imageLoadingProgress           // 0-1 (memory management Load actions)

// Rendering
runtime.sampling                       // "nearest" | "bilinear" | "trilinear"
runtime.isPixelRoundingEnabled         // boolean
runtime.anisotropicFiltering           // "auto" | "off" | "2x" | "4x" | "8x" | "16x"

// Timing
runtime.gameTime                       // number — in-game seconds (affected by timeScale)
runtime.wallTime                       // number — wall-clock seconds (unaffected by timeScale)
runtime.tickCount                      // number (read-only) — ticks since project started
runtime.timeScale                      // get/set — 1.0=normal, 0=paused
runtime.dt                             // delta-time in seconds
runtime.dtRaw                          // wall-clock delta-time (unaffected by timeScale or clamping)
runtime.minDt                          // min clamping for dt
runtime.maxDt                          // max clamping for dt (default 1/30)
runtime.framerateMode                  // "vsync" | "fixed" | "unlimited-tick" | "unlimited-frame"
runtime.fixedFramerate                 // target FPS when framerateMode is "fixed"
runtime.framesPerSecond                // number (read-only)
runtime.ticksPerSecond                 // number (read-only)
runtime.cpuUtilisation                 // 0-1 estimate
runtime.gpuUtilisation                 // 0-1 estimate (NaN if unsupported)
runtime.isSuspended                    // boolean (read-only)
runtime.exportDate                     // Date object — when the project was exported

// Control flow
runtime.callFunction(name, ...params)  // call event sheet function; returns return value or null
runtime.setReturnValue(value)          // set return value inside an event-sheet function script
runtime.signal(tag)                    // trigger On signal / resolve waitForSignal()
await runtime.waitForSignal(tag)       // Promise resolving when tag is signalled
runtime.random()                       // random [0,1) — deterministic if Advanced Random overrides it

// Destroying / sorting instances
runtime.destroyMultiple(iterable)      // efficiently destroy many instances at once
runtime.sortZOrder(iterable, callback) // custom Z-sort; callback receives (a, b) IWorldInstance
// example: runtime.sortZOrder(runtime.objects.Sprite.instances(), (a, b) => a.instVars.z - b.instVars.z)

// Screenshot
runtime.saveCanvasImage(format?, quality?, areaRect?)  // → Promise<Blob>

// Download
runtime.invokeDownload(url, filename)

// DOM / HTML
runtime.isInWorker                     // boolean — true when running in a Web Worker
runtime.getHTMLLayer(index)            // HTMLElement — DOM mode only, throws in worker mode
await runtime.alert(message)          // async alert (forwards to DOM in worker mode)

// SDK only
runtime.sdk                            // ISDKUtils
```

### Key patterns

```js
// Listening for layout changes
runtime.addEventListener("beforeanylayoutstart", (e) => {
  console.log("Starting layout:", e.layout.name);
});

// Custom save data
runtime.addEventListener("save", (e) => { e.saveData = { score: myScore }; });
runtime.addEventListener("load", (e) => { myScore = e.saveData?.score ?? 0; });

// Sorting Z order
runtime.sortZOrder(
  runtime.objects.Sprite.instances(),
  (a, b) => a.instVars.myZOrder - b.instVars.myZOrder
);
```

---

## 49. ILOSBehaviorInstance Script Interface

`ILOSBehaviorInstance` derives from `IBehaviorInstance`. Access via `inst.behaviors.LineOfSight` (or whatever the behavior is named).

### APIs

```js
losInst.range            // get/set — maximum distance in pixels for LOS detection
losInst.coneOfView       // get/set — cone angle in radians (relative to object angle)

losInst.addObstacle(iObjectClass)    // add an IObjectClass as a LOS obstacle (Custom obstacles mode only)
                                     // Note: affects the entire behavior, not just this instance
losInst.clearObstacles()             // clear all added obstacles (Custom obstacles mode only)
                                     // Note: affects the entire behavior, not just this instance

losInst.hasLOStoPosition(x, y)       // → boolean — respects range and cone of view
losInst.hasLOSBetweenPositions(fromX, fromY, fromAngle, toX, toY)
                                     // → boolean — LOS between two arbitrary positions
                                     //   fromAngle in radians, respects range and cone

losInst.castRay(fromX, fromY, toX, toY, useCollisionCells = true)
                                     // → ILOSBehaviorRay — ignores range and cone of view
losInst.ray                          // ILOSBehaviorRay — result of the last castRay() call
```

### ILOSBehaviorRay Interface

Returned by `castRay()`. All properties are read-only.

```js
ray.didCollide           // boolean — true if an obstacle was hit

// Only valid if didCollide is true:
ray.hitX                 // number — hit position X in layout co-ordinates
ray.hitY                 // number — hit position Y in layout co-ordinates
ray.getHitPosition()     // → [hitX, hitY]
ray.hitDistance          // number — distance from ray start to hit
ray.hitUid               // number — UID of the obstacle instance that was hit

ray.getNormalX(length)   // position along surface normal at given distance
ray.getNormalY(length)
ray.getNormal(length)    // → [x, y]
ray.normalAngle          // radians — surface normal angle at hit point

ray.getReflectionX(length)  // position along reflection vector at given distance
ray.getReflectionY(length)
ray.getReflection(length)   // → [x, y]
ray.reflectionAngle          // radians — reflection angle at hit point
```

### Example

```js
const los = sprite.behaviors.LineOfSight;
const result = los.castRay(sprite.x, sprite.y, targetX, targetY);
if (result.didCollide) {
  console.log(`Hit at (${result.hitX}, ${result.hitY}), distance ${result.hitDistance}`);
  console.log(`Reflected at angle ${result.reflectionAngle} rad`);
}
```

---

## 50. ISineBehaviorInstance Script Interface

`ISineBehaviorInstance` derives from `IBehaviorInstance`. Access via `inst.behaviors.Sine`.

### APIs

```js
sineInst.movement    // get/set — string: "horizontal" | "vertical" | "forwards-backwards"
                     //           "size" | "width" | "height" | "angle" | "opacity"
                     //           "z-elevation" | "value-only"

sineInst.wave        // get/set — string: "sine" | "triangle" | "sawtooth"
                     //           "reverse-sawtooth" | "square"

sineInst.period      // get/set — duration in seconds for one complete cycle
sineInst.magnitude   // get/set — max change in position/size (px) or angle (radians)
sineInst.phase       // get/set — progress through cycle [0, 2π]

sineInst.value       // number (read-only) — current offset value; useful in "value-only" mode

sineInst.updateInitialState()
// Resets the behavior's recorded initial state to the object's current state.
// Use this after moving/resizing the object so the sine oscillates relative to the new state.

sineInst.isEnabled   // boolean — get/set; when false the behavior has no effect
```

---

## Plugin Interfaces Category

The following sections are grouped under plugin interfaces:

- [IAdvancedRandomObjectType Script Interface](#51-iadvancedrandomobjecttype-script-interface)
- [I9PatchInstance Script Interface](#52-i9patchinstance-script-interface)
- [I3DCameraObjectType Script Interface](#53-i3dcameraobjecttype-script-interface)
- [IFileSystemObjectType Script Interface](#54-ifilesystemobjecttype-script-interface)
- [IFileChooserInstance Script Interface](#55-ifilechooserinstance-script-interface)
- [IDrawingCanvasInstance Script Interface](#56-idrawingcanvasinstance-script-interface)
- [ISpriteInstance Script Interface](#57-ispriteinstance-script-interface)
- [ITilemapInstance Script Interface](#58-itilemapinstance-script-interface)
- [ITiledBackgroundInstance Script Interface](#59-itiledbackgroundinstance-script-interface)
- [I3DShapeInstance Script Interface](#64-i3dshapeinstance-script-interface)
- [I3DModelInstance Script Interface](#65-i3dmodelinstance-script-interface)
- [IArrayInstance Script Interface](#66-iarrayinstance-script-interface)
- [IDictionaryInstance Script Interface](#67-idictionaryinstance-script-interface)
- [IJSONInstance Script Interface](#68-ijsoninstance-script-interface)
- [IKeyboardObjectType Script Interface](#69-ikeyboardobjecttype-script-interface)
- [ITouchObjectType Script Interface](#70-itouchobjecttype-script-interface)
- [IInternationalizationObjectType Script Interface](#71-iinternationalizationobjecttype-script-interface)

Additional plugin interfaces documented below this category:

- IAudioObjectType Script Interface
- IBinaryDataInstance Script Interface
- IGamepadObjectType Script Interface
- ITextInstance Script Interface
- ISpriteFontInstance Script Interface
- IMultiplayerObjectType Script Interface

---

## 51. IAdvancedRandomObjectType Script Interface

`IAdvancedRandomObjectType` derives from `IObjectClass` (not an instance interface). Access via `runtime.objects.AdvancedRandom`.

### APIs

```js
// Seed
advRand.seed         // get/set string — same seed → same random sequence

// Coherent noise
advRand.octaves      // get/set number [1-16] — detail layers for Billow, Classic, Ridged noise

advRand.billow2d(x, y)           // → number [0-1]
advRand.billow3d(x, y, z)        // → number [0-1]
advRand.cellular2d(x, y)         // → number [0-1]
advRand.cellular3d(x, y, z)      // → number [0-1]
advRand.classic2d(x, y)          // → number [0-1] (Perlin noise)
advRand.classic3d(x, y, z)       // → number [0-1]
advRand.ridged2d(x, y)           // → number [0-1]
advRand.ridged3d(x, y, z)        // → number [0-1]
advRand.voronoi2d(x, y)          // → number [0-1]
advRand.voronoi3d(x, y, z)       // → number [0-1]

// Seeded random
advRand.random()                 // → number [0, 1) — uses current seed (deterministic)

// Gradient APIs
advRand.createGradient(name, mode)      // mode: "float" | "rgb"
advRand.setCurrentGradient(name)
advRand.addGradientStop(position, value)
advRand.sampleGradient(name, position)  // name: string or null (uses current gradient)

// Probability table APIs
advRand.createProbabilityTable(name)
advRand.createProbabilityTableFromJSON(name, jsonStr)
advRand.getProbabilityTableAsJSON()      // → string — serialize current table
advRand.setCurrentProbabilityTable(name)
advRand.addProbabilityTableEntry(weight, value)
advRand.removeProbabilityTableEntry(weight, value)  // weight=0 removes first match by value
advRand.sampleProbabilityTable(name)    // name: string or null (uses current table)

// Permutation table APIs
advRand.createPermutationTable(length, offset)  // randomly ordered sequence of numbers
advRand.shufflePermutationTable()               // re-shuffle existing table
advRand.getPermutation(index)                   // → number at zero-based index
```

---

## 52. I9PatchInstance Script Interface

`I9PatchInstance` derives from `IWorldInstance`. Access via instances of the 9-Patch object.

### APIs

```js
// Margins (apply to the source image, ignoring imageScale; affect all instances by default)
inst9.leftMargin    // get/set — left margin in pixels
inst9.rightMargin   // get/set — right margin in pixels
inst9.topMargin     // get/set — top margin in pixels
inst9.bottomMargin  // get/set — bottom margin in pixels

// After replaceImage() the instance uses its own unique patch images and margins can be
// changed independently without affecting other instances.

inst9.edges         // get/set — "tile" | "stretch"
inst9.fill          // get/set — "tile" | "stretch" | "transparent"
inst9.seams         // get/set — "exact" | "overlap"
inst9.imageScaleX   // get/set — scale factor (1 = 100%)
inst9.imageScaleY   // get/set — scale factor (1 = 100%)

await inst9.replaceImage(blob)
// Replace image from a Blob (e.g. fetched from a URL).
// After this resolves, margin changes only affect this specific instance.
// Example:
//   const resp = await fetch(url);
//   const blob = await resp.blob();
//   await inst9.replaceImage(blob);
//   inst9.leftMargin = 20;  // now safe to modify independently
```

---

## 53. I3DCameraObjectType Script Interface

`I3DCameraObjectType` derives from `IObjectClass` (not an instance interface). Access via `runtime.objects["3DCamera"]` (starts with a digit — not a valid JS identifier). Rename the object to e.g. `Camera3D` for convenience.

### APIs

```js
cam.lookAtPosition(camX, camY, camZ, lookX, lookY, lookZ, upX, upY, upZ)
// Set camera position, look-at point, and up vector.
// Default up vector: (0, 1, 0) for top-down view.

cam.lookParallelToLayout(camX, camY, camZ, lookAngle)
// Set camera position and angle (radians) looking along the layout floor.
// Equivalent to lookAtPosition with up vector (0, 0, 1).

cam.restore2DCamera()
// Restore standard 2D scrolling behavior.

cam.moveAlongLayoutAxis(distance, axis, which)
// Move along a layout-relative axis. distance can be negative.
// axis: "x" | "y" | "z"   which: "camera" | "look" | "both"

cam.moveAlongCameraAxis(distance, axis, which)
// Move along a camera-relative axis. distance can be negative.
// axis: "forward" | "up" | "right"   which: "camera" | "look" | "both"

cam.rotateCamera(rotateX, rotateY, minPolar, maxPolar)
// Rotate camera look-at position (all values in radians).
// Requires lookAtPosition() or lookParallelToLayout() to have been called first.
// min/maxPolar limits vertical rotation.

cam.getCameraPosition()  // → [x, y, z]
cam.getLookPosition()    // → [x, y, z]
cam.getLookVector()      // → [x, y, z] — direction camera points (includes rotation)
cam.getForwardVector()   // → [x, y, z] — camera forward unit vector (no rotation)
cam.getRightVector()     // → [x, y, z] — camera right unit vector (perpendicular to forward)
cam.getUpVector()        // → [x, y, z] — camera up vector (recomputed from position/look)

cam.zScale               // number (read-only) — pixels per unit on the Z axis
cam.fieldOfView          // get/set — angle in radians (only affects "Regular" Z axis scale mode)
```

---

## 54. IFileSystemObjectType Script Interface

`IFileSystemObjectType` derives from `IObjectClass`. Access via `runtime.objects.FileSystem`.

### Accept Types Format

```js
// Used in showSaveFilePicker / showOpenFilePicker
{
  description: "Images",
  accept: {
    "image/*": [".png", ".jpg", ".webp", ".avif"]
  }
}
```

### Start In Locations

String values: `"default"` | `"desktop"` | `"documents"` | `"downloads"` | `"music"` | `"pictures"` | `"videos"`

### File System Event

```js
fs.addEventListener("drop", (e) => {
  // e.files — array of File objects dropped into the window
});
```

### APIs

```js
fs.isSupported                   // boolean (read-only) — File System Access API available
fs.desktopFeaturesSupported      // boolean (read-only) — desktop-specific features available

fs.hasPickerTag(pickerTag)       // boolean — tag remembered or known folder available

// File/folder pickers (all async, resolve with array of selected path strings)
await fs.showSaveFilePicker(opts)
await fs.showOpenFilePicker(opts)
await fs.showFolderPicker(opts)
// opts properties:
//   pickerTag (required): string identifier for this picker session
//   acceptTypes: array of Accept type objects
//   showAcceptAll: boolean
//   suggestedName: string (save picker only)
//   multiple: boolean (open picker only)
//   id: string (remembers last folder)
//   startIn: Start in location string
//   mode: "read" | "readwrite" (folder picker only)

// File I/O (all async)
await fs.writeFile({ pickerTag, data, folderPath?, mode?, fileTag? })
// data: string (UTF-8) or ArrayBuffer
// mode: "overwrite" (default) | "append" (text only)

await fs.readFile({ pickerTag, mode, folderPath?, fileTag? })
// mode: "text" → resolves with string | "binary" → resolves with ArrayBuffer

await fs.createFolder(pickerTag, folderPath, fileTag?)
await fs.copyFile(pickerTag, srcFolderPath, destFolderPath, fileTag?)
await fs.moveFile(pickerTag, srcFolderPath, destFolderPath, fileTag?)
await fs.delete(pickerTag, folderPath, isRecursive, fileTag?)

await fs.listContent(pickerTag, folderPath, isRecursive, fileTag?)
// Resolves with { files: string[], folders: string[] }
// Recursive names may include forward-slash separators

// Desktop-only (requires desktopFeaturesSupported === true)
await fs.shellOpen(pickerTag, filePath, fileTag?)
await fs.runFile(pickerTag, filePath, args?, fileTag?)
// pickerTag can be "" to run system executables directly (e.g. "cmd.exe")
```

---

## 55. IFileChooserInstance Script Interface

`IFileChooserInstance` derives from `IDOMInstance`.

### Events

```js
inst.addEventListener("change", () => {
  // Files have been chosen — call getFiles() here
});
```

### APIs

```js
inst.click()     // Programmatically open the system file picker (requires user gesture)
inst.clear()     // Reset to initial state, clearing any selection
inst.getFiles()  // → File[] — currently chosen files
```

---

## 56. IDrawingCanvasInstance Script Interface

`IDrawingCanvasInstance` derives from `IWorldInstance`.

### Colors

Pass colors as `[r, g, b]` (opaque) or `[r, g, b, a]` (with alpha). Each component is `0–1`.

### Events

```js
inst.addEventListener("resolutionchange", () => {
  // Canvas resolution changed (same as On resolution changed trigger)
});
```

### APIs

```js
// Clear
inst.clearCanvas(color)
inst.clearRect(left, top, right, bottom, color)

// Fill shapes
inst.fillRect(left, top, right, bottom, color)
inst.outlineRect(left, top, right, bottom, color, thickness)
inst.fillLinearGradient(left, top, right, bottom, color1, color2, direction = "horizontal")
// direction: "horizontal" | "vertical"

inst.fillEllipse(x, y, radiusX, radiusY, color, isSmooth = true)
inst.outlineEllipse(x, y, radiusX, radiusY, color, thickness, isSmooth = true)

// Lines
inst.line(x1, y1, x2, y2, color, thickness, lineCap = "butt")
inst.lineDashed(x1, y1, x2, y2, color, thickness, dashLength, lineCap = "butt")
// lineCap: "butt" | "square"

// Polygons — polyPoints is [[x1,y1], [x2,y2], ...]
inst.fillPoly(polyPoints, color, isConvex = false)
inst.linePoly(polyPoints, color, thickness, lineCap = "butt")
inst.lineDashedPoly(polyPoints, color, thickness, dashLength, lineCap = "butt")
// isConvex: skip concave decomposition (faster, but only correct for convex shapes)
// Note: self-intersecting polygons not supported by fillPoly

// Blend mode
inst.setDrawBlend(blendMode)
// blendMode: "normal" | "additive" | "copy" | "destination-over" | "source-in"
//            "destination-in" | "source-out" | "destination-out" | "source-atop" | "destination-atop"

// Paste instances onto canvas
await inst.pasteInstances(instancesArr, includeEffects = true)
// Paste happens at end of tick — await to ensure completion before using result

// Resolution mode
inst.setFixedResolutionMode(fixedWidth, fixedHeight)
inst.setAutoResolutionMode()

// Surface info (read-only)
inst.surfaceDeviceWidth    // number — rendering surface width in device pixels
inst.surfaceDeviceHeight   // number — rendering surface height in device pixels
inst.getSurfaceDeviceSize() // → [width, height]
inst.pixelScale            // number — size of one canvas pixel in object co-ordinates

// Pixel data
await inst.getImagePixelData()  // → ImageData (unpremultiplied alpha)
inst.loadImagePixelData(imageData, premultiplyAlpha = false)
// imageData must be exactly surfaceDeviceWidth × surfaceDeviceHeight
// premultiplyAlpha: set true if source data is not already premultiplied

// Save canvas
inst.saveImage(format?, quality?, areaRect?)  // → Promise<Blob>
// format: MIME type e.g. "image/png" | "image/jpeg"
// quality: 0-1 (lossy formats only)
// areaRect: DOMRect in device pixels (subset of canvas)
```

---

## 57. ISpriteInstance Script Interface

`ISpriteInstance` derives from `IWorldInstance`. `ISpriteObjectType` derives from `IObjectClass` and provides object-type-level animation APIs.

### Sprite Instance Events

```js
inst.addEventListener("framechange", (e) => {
  e.animationName   // string — currently playing animation
  e.animationFrame  // number — zero-based new frame index
});

inst.addEventListener("animationend", (e) => {
  e.animationName   // string — animation that finished
});
```

### Sprite Instance APIs

```js
// Animation state
sprInst.animation              // IAnimation — current animation (read-only object)
sprInst.animationName          // string (read-only) — use setAnimation() to change

sprInst.setAnimation(name, from = "beginning")
// name is case-insensitive; throws if not found
// from: "beginning" | "current-frame"
// Note: does nothing if animation is already playing; use startAnimation("beginning") to restart

sprInst.getAnimation(name)     // → IAnimation | null — by case-insensitive name

sprInst.startAnimation(from = "current-frame")  // start/restart playback
// from: "beginning" | "current-frame"
sprInst.stopAnimation()        // stop playback

sprInst.animationFrame         // get/set — zero-based current frame index
sprInst.animationFrameTag      // get/set — tag string of current frame ("" if not set)
                               // Setting a tag jumps to the first matching frame

sprInst.animationSpeed         // get/set — playback speed in frames per second
sprInst.animationRepeatToFrame // get/set — frame index to rewind to on repeat

// Image info
sprInst.imageWidth             // number (read-only)
sprInst.imageHeight            // number (read-only)
sprInst.getImageSize()         // → [width, height]

// Image points (index 0 = origin; first user point = index 1)
sprInst.getImagePointCount()   // → number
sprInst.getImagePointX(nameOrIndex)   // → layout X co-ordinate
sprInst.getImagePointY(nameOrIndex)   // → layout Y co-ordinate
sprInst.getImagePointZ(nameOrIndex)   // → layout Z co-ordinate (useful with mesh distortion)
sprInst.getImagePoint(nameOrIndex)    // → [x, y, z]
// Returns origin position if not found

// Collision polygon (layout co-ordinates)
sprInst.getPolyPointCount()    // → number
sprInst.getPolyPointX(index)   // → layout X
sprInst.getPolyPointY(index)   // → layout Y
sprInst.getPolyPoint(index)    // → [x, y]
// Note: first poly point is repeated at index getPolyPointCount() for easy edge iteration

// Solid collision filter
sprInst.setSolidCollisionFilter(isInclusive, tags)
// isInclusive=true → only collide with solids matching tags (pass empty tags to collide with none)
// isInclusive=false → collide with all solids EXCEPT those matching tags (default: all solids)
// tags: space-separated string or any iterable of strings

// Replace current frame image
await sprInst.replaceCurrentAnimationFrame(blob)
// blob can be locally generated or fetched from a URL
```

### Sprite Object Type APIs

These live on the object type (e.g. `runtime.objects.MySprite`), not on instances. Changes affect **all instances**.

```js
const sprObjType = runtime.objects.MySprite;  // ISpriteObjectType

sprObjType.getAnimation(name)    // → IAnimation | null — case-insensitive name lookup
sprObjType.getAllAnimations()    // → IAnimation[] — all animations

sprObjType.addAnimation(animName)
// → IAnimation — adds new animation with single 100×100 transparent frame; name must be unique

sprObjType.removeAnimation(animName)
// Throws if name doesn't exist or it's the last animation

sprObjType.addAnimationFrame(animName, where)
// Inserts a 100×100 transparent frame at position where:
//   number → zero-based index (-1 = end)
//   string → animation frame tag (inserts before first matching tag)
// → IAnimationFrame

sprObjType.removeAnimationFrame(animName, where)
// where: number index (-1 = last) or tag string
// Cannot remove the last frame
```

---

## 58. ITilemapInstance Script Interface

`ITilemapInstance` derives from `IWorldInstance`.

### Tile Number Format

Tile numbers are 32-bit integers composed of a tile ID (lower 29 bits) and flags (upper 3 bits). `-1` is an empty tile.

```js
// Tile flag constants (access on the class or instance)
ITilemapInstance.TILE_FLIPPED_HORIZONTAL = -0x80000000
ITilemapInstance.TILE_FLIPPED_VERTICAL   =  0x40000000
ITilemapInstance.TILE_FLIPPED_DIAGONAL   =  0x20000000
ITilemapInstance.TILE_FLAGS_MASK         =  0xE0000000
ITilemapInstance.TILE_ID_MASK            =  0x1FFFFFFF

// Examples:
const flippedH = 2 | ITilemapInstance.TILE_FLIPPED_HORIZONTAL
const tileId   = tile & ITilemapInstance.TILE_ID_MASK
const isFlipH  = (tile & ITilemapInstance.TILE_FLIPPED_HORIZONTAL) !== 0
// Always check tile !== -1 before applying masks (empty tile is a special value)
```

### APIs

```js
// Map size in tiles
tmInst.mapWidth              // number (read-only)
tmInst.mapHeight             // number (read-only)
tmInst.getMapSize()          // → [mapWidth, mapHeight]

// Display size (may differ from map size if resized smaller at runtime)
tmInst.mapDisplayWidth       // number (read-only)
tmInst.mapDisplayHeight      // number (read-only)
tmInst.getMapDisplaySize()   // → [mapDisplayWidth, mapDisplayHeight]

// Tile dimensions in pixels
tmInst.tileWidth             // number (read-only)
tmInst.tileHeight            // number (read-only)
tmInst.getTileSize()         // → [tileWidth, tileHeight]

// Tile access (tile co-ords: 0,0 = top-left tile regardless of position/size)
tmInst.getTileAt(x, y)       // → number — tile number or -1 for empty/out-of-bounds
tmInst.setTileAt(x, y, tile) // set tile (-1 = empty; use bit operations for ID+flags)

// Replace tileset image
await tmInst.replaceImage(blob)
```

---

## 59. ITiledBackgroundInstance Script Interface

`ITiledBackgroundInstance` derives from `IWorldInstance`.

### APIs

```js
// Source image dimensions (not the tiled display size)
tbInst.imageWidth            // number (read-only)
tbInst.imageHeight           // number (read-only)
tbInst.getImageSize()        // → [imageWidth, imageHeight]

// Tile offset (in pixels)
tbInst.imageOffsetX          // get/set
tbInst.imageOffsetY          // get/set
tbInst.setImageOffset(x, y)
tbInst.getImageOffset()      // → [imageOffsetX, imageOffsetY]

// Tile scale (1 = original size)
tbInst.imageScaleX           // get/set
tbInst.imageScaleY           // get/set
tbInst.setImageScale(x, y)
tbInst.getImageScale()       // → [imageScaleX, imageScaleY]

// Tile angle
tbInst.imageAngle            // get/set — radians (updating this also updates imageAngleDegrees)
tbInst.imageAngleDegrees     // get/set — degrees (updating this also updates imageAngle)

// Tile randomization
tbInst.enableTileRandomization  // boolean get/set

tbInst.tileXRandom           // get/set — horizontal random offset, 0-1 percentage
tbInst.tileYRandom           // get/set — vertical random offset, 0-1 percentage
tbInst.setTileRandom(x, y)
tbInst.getTileRandom()       // → [tileXRandom, tileYRandom]

tbInst.tileAngleRandom       // get/set — random rotation amount, 0-1 percentage

// Blend margin
tbInst.tileBlendMarginX      // get/set — horizontal blend margin, 0-1 percentage
tbInst.tileBlendMarginY      // get/set — vertical blend margin, 0-1 percentage
tbInst.setTileBlendMargin(x, y)
tbInst.getTileBlendMargin()  // → [tileBlendMarginX, tileBlendMarginY]

// Replace image
await tbInst.replaceImage(blob)
```

---

## 60. IPlatformInfo Script Interface

`IPlatformInfo` provides Construct-detected platform details (browser, OS, renderer, export mode). It is available via `runtime.platformInfo` and does not require adding the Platform Info plugin to the project.

```js
runOnStartup(async runtime => {
  console.log("The detected OS is: " + runtime.platformInfo.os);
});
```

### APIs

```js
platformInfo.isMobile         // boolean (read-only) — heuristic mobile detection
platformInfo.os               // "windows" | "macos" | "linux" | "chrome-os" | "android" | "ios" | "unknown"
platformInfo.osVersion        // string (read-only) — OS version or "(unknown)"
platformInfo.browser          // "chrome" | "chromium" | "edge" | "opera" | "firefox" | "safari" | "unknown"
platformInfo.browserVersion   // string (read-only) — browser version or "(unknown)"
platformInfo.browserEngine    // "chromium" | "gecko" | "webkit" | "unknown"

platformInfo.exportType       // "preview" | "html5" | "scirra-arcade" | "cordova-android" | "cordova-ios"
                              // | "windows-webview2" | "macos-wkwebview" | "linux-cef"
                              // | "xbox-uwp-webview2" | "instant-games" | "playable-ad"

platformInfo.renderer         // "webgl1" | "webgl2" | "webgpu", optional "-software" suffix
platformInfo.rendererDetail   // string (read-only) — GPU/system renderer detail

platformInfo.canvasClientX    // number (read-only) — canvas top-left X in CSS px
platformInfo.canvasClientY    // number (read-only) — canvas top-left Y in CSS px
platformInfo.canvasCssWidth   // number (read-only) — canvas width in CSS px
platformInfo.canvasCssHeight  // number (read-only) — canvas height in CSS px
platformInfo.canvasDeviceWidth   // number (read-only) — canvas width in device px
platformInfo.canvasDeviceHeight  // number (read-only) — canvas height in device px

platformInfo.devicePixelRatio // number (read-only)
```

> Prefer feature detection over browser-name checks where possible. `isMobile` is a heuristic and may be unreliable in some environments.

---

## 61. ITimelineStateBase Script Interface

`ITimelineStateBase` is the shared base for `ITimelineState` and `ITweenState`.

Once released, the interface is invalid: accessing any property other than `isReleased` throws.

### APIs

```js
timeline.finished       // Promise — resolves when playback finishes

timeline.pause()
timeline.resume()

timeline.isPlaying      // boolean (read-only)
timeline.isPaused       // boolean (read-only)

timeline.time           // number get/set — current playback time in seconds
timeline.totalTime      // number get/set — duration in seconds
timeline.progress       // number (read-only) — 0 to 1

timeline.isLooping      // boolean get/set
timeline.isPingPong     // boolean get/set
timeline.playbackRate   // number get/set — speed multiplier

timeline.tags           // string[] (read-only)
timeline.hasTags(tags)  // boolean — tags: space-separated string, must match all

timeline.isReleased     // boolean (read-only) — true when state is released/invalid
```

---

## 62. ITimelineState Script Interface

`ITimelineState` represents an actively running timeline and derives from `ITimelineStateBase`.

Timelines are created via `play()` on the Timeline Controller script interface.

### APIs

```js
timeline.name           // string (read-only) — timeline name
```

---

## 63. ITweenState Script Interface

`ITweenState` represents an actively running tween and derives from `ITimelineStateBase`.

Tweens are created via `startTween()` on the Tween behavior script interface.

### APIs

```js
tween.stop()                 // stop and release immediately

tween.instance               // IWorldInstance (read-only) — instance being tweened
tween.isDestroyOnComplete    // boolean get/set
tween.value                  // number (read-only) — current value tween value

tween.setEase(easeName)      // set built-in or custom ease by name

tween.released               // Promise — resolves when tween is released
```

> After a tween is released, only `isReleased` (from `ITimelineStateBase`) is safe to read.

---

## 64. I3DShapeInstance Script Interface

`I3DShapeInstance` derives from `IWorldInstance` and provides APIs specific to the 3D Shape plugin.

### APIs

```js
shapeInst.shape
// get/set: "box" | "prism" | "wedge" | "pyramid" | "corner-out" | "corner-in"

shapeInst.setFaceVisible(face, visible)
shapeInst.isFaceVisible(face)
// face: "back" | "front" | "left" | "right" | "top" | "bottom"

shapeInst.setFaceImage(face, image)
// Re-map face image source to another face image.
// Also undoes setFaceObject() for that face.

shapeInst.setFaceObject(face, objectClass)
// Use a Sprite / Tiled Background / 9-Patch object's image for a face.
// Requires at least one instance of objectClass on the current layout.

shapeInst.isBackFaceCulling   // boolean get/set
shapeInst.zTilingFactor       // number get/set

shapeInst.getImagePointCount()
shapeInst.getImagePointX(nameOrIndex)
shapeInst.getImagePointY(nameOrIndex)
shapeInst.getImagePoint(nameOrIndex)
// Back face image points in layout co-ordinates

shapeInst.getFaceImagePointCount(face)
shapeInst.getFaceImagePointX(face, nameOrIndex)
shapeInst.getFaceImagePointY(face, nameOrIndex)
shapeInst.getFaceImagePointZ(face, nameOrIndex)
shapeInst.getFaceImagePoint(face, nameOrIndex)
// Face image points in 3D layout co-ordinates
```

---

## 65. I3DModelInstance Script Interface

`I3DModelInstance` derives from `IWorldInstance` and provides APIs for loading and controlling 3D model objects.

### APIs

```js
await modelInst.loadModel(model, mesh = "", animation = "", playing = false, progress = 0)
// model: string name of existing 3D Model object (required)
// mesh: optional mesh name (empty = all meshes)
// animation: optional animation name (empty = first animation)
// playing: optional boolean autoplay
// progress: optional 0-1 animation start progress

modelInst.onLoad   // optional callback invoked after successful model load
modelInst.onError  // optional callback invoked when load fails

modelInst.modelName         // string get/set (set acts like loadModel(modelName))
modelInst.meshNames         // string[] get/set enabled meshes
modelInst.animationName     // string get/set (set switches to start, not playing)
modelInst.animationProgress // number get/set (0-1)
modelInst.isPlaying         // boolean get/set
modelInst.meshRenderMode    // "hierarchy" | "isolate"

modelInst.offsetX
modelInst.offsetY
modelInst.offsetZ

modelInst.rotationX
modelInst.rotationY
modelInst.rotationZ

modelInst.scaleX
modelInst.scaleY
modelInst.scaleZ

modelInst.setTransform(x, y, z, type)
modelInst.addTransform(x, y, z, type)
modelInst.subTransform(x, y, z, type)
modelInst.mulTransform(x, y, z, type)
modelInst.divTransform(x, y, z, type)
// type: "offset" | "rotation" | "scale"

modelInst.animationDuration(animation)  // -> number seconds
modelInst.getAllMeshes()                // -> string[]
modelInst.getAllAnimations()            // -> string[]

modelInst.setMeshEnabled(mesh, enable)
modelInst.setAllMeshesEnabled(enable)
modelInst.isMeshEnabled(mesh)           // -> boolean
modelInst.areAllMeshesEnabled()         // -> boolean
modelInst.meshExists(mesh)              // -> boolean

modelInst.play(animationName = "", progress = 0)
modelInst.stop()     // stop and reset progress to 0
modelInst.pause()
modelInst.resume()
```

---

## 66. IArrayInstance Script Interface

`IArrayInstance` derives from `IInstance` and provides APIs for Construct Array objects.

### APIs

```js
arr.width    // number (read-only)
arr.height   // number (read-only)
arr.depth    // number (read-only)

arr.setSize(w, h = 1, d = 1)
// Resize up to 3D. New cells initialize to 0.

arr.getAt(x, y = 0, z = 0)
arr.setAt(val, x, y = 0, z = 0)
// val must be number or string
```

> Array plugin storage is limited to numbers/strings. Use native JavaScript arrays for richer value types.

---

## 67. IDictionaryInstance Script Interface

`IDictionaryInstance` derives from `IInstance` and provides APIs for Dictionary objects.

### APIs

```js
dict.getDataMap()   // -> Map
```

> Dictionary keys must remain strings and values must remain string/number primitives to stay compatible with Construct expressions and event actions.

---

## 68. IJSONInstance Script Interface

`IJSONInstance` derives from `IInstance` and provides APIs for exchanging JSON data between script and event sheets.

### APIs

```js
jsonInst.getJsonDataCopy()      // -> any (deep copy of stored JSON-compatible data)
jsonInst.setJsonDataCopy(o)     // validates JSON-compatible data; throws if invalid

jsonInst.setJsonString(str)     // parse+store JSON string; throws if invalid JSON

jsonInst.toCompactString()      // -> string
jsonInst.toBeautifiedString()   // -> string
```

---

## 69. IKeyboardObjectType Script Interface

`IKeyboardObjectType` derives from `IObjectClass`. It is typically accessed via `runtime.keyboard`.

Keyboard input events are handled from runtime events such as `"keydown"` and `"keyup"`.

### APIs

```js
runtime.keyboard.isKeyDown(keyStringOrWhich)
// keyStringOrWhich: KeyboardEvent.code string (recommended) or legacy numeric which code
```

---

## 70. ITouchObjectType Script Interface

`ITouchObjectType` derives from `IObjectClass`. It is typically accessed via `runtime.touch`.

Touch/pointer input is read from runtime events like `"pointerdown"`, plus `"deviceorientation"` and `"devicemotion"` for sensors.

### APIs

```js
await runtime.touch.requestPermission(type)
// type: "orientation" | "motion"
// resolves: "granted" | "denied"
```

> Sensor events do not fire until permission is granted on platforms that require it.

---

## 71. IInternationalizationObjectType Script Interface

`IInternationalizationObjectType` derives from `IObjectType` and provides translation-string lookup APIs.

Internationalization is often abbreviated as **i18n**: starts with `i`, ends with `n`, with 18 letters between.

### Supported Scope

Many locale features map directly to browser `Intl` APIs; this scripting reference focuses on translation-string storage and lookup.

### Internationalization APIs

```js
intl.locale                     // string get/set — BCP 47 tag (e.g. "en-US")

intl.addString(context, str)
intl.saveToJSONString()         // -> string
intl.loadFromJSONString(str)

intl.setContext(context)
intl.getContext()               // -> string

intl.pushContext(context)
intl.popContext()

intl.createContext(context)     // -> I18NLookupContext

intl.lookup(context, ...args)
intl.lookupPlural(context, count, ...args)
```

### I18NLookupContext

Created via `createContext()`. It supports relative lookups without manually balancing `pushContext()`/`popContext()`.

```js
const intl = runtime.objects.Internationalization;

const ctx = intl.createContext("forest-world.chapter-1.intro-text");
const title = ctx.lookup(".title");
const msg = ctx.lookup(".message");
const start = ctx.lookup(".start");
```

### I18NLookupContext APIs

```js
ctx.lookup(context, ...args)
ctx.lookupPlural(context, count, ...args)
ctx.createContext(context)   // context must be relative
```

---

### IAudioObjectType Script Interface

`IAudioObjectType` derives from `IObjectClass`. Use via `runtime.objects.Audio`.

This interface exposes Construct's internal Web Audio graph entry points. It is sufficient for custom node chains while still integrating with Construct features such as recording and mute/silent handling.

### APIs

```js
audio.audioContext     // AudioContext (read-only)
audio.destinationNode  // AudioNode destination for custom graph output

audio.isSilent         // boolean get/set
audio.masterVolume     // number get/set [0, 1]

audio.stopAll()        // stop all currently playing sounds
```

Notes:

- Prefer connecting custom nodes to `destinationNode` rather than `audioContext.destination`.
- Available only in DOM mode (not worker mode).

---

### IBinaryDataInstance Script Interface

`IBinaryDataInstance` derives from `IInstance` and provides efficient `ArrayBuffer` exchange APIs.

### APIs

```js
bin.setArrayBufferCopy(viewOrBuffer)
// Accepts ArrayBuffer or typed array; copies input data.

bin.setArrayBufferTransfer(arrayBuffer)
// Transfers ownership of ArrayBuffer with no copy.

bin.getArrayBufferCopy()      // -> ArrayBuffer copy
bin.getArrayBufferReadOnly()  // -> internal ArrayBuffer reference (read-only usage)
```

---

### IGamepadObjectType Script Interface

`IGamepadObjectType` derives from `IObjectClass`. Use via `runtime.objects.Gamepad`.

### Events

- `"gamepadconnected"`
- `"gamepaddisconnected"`
- `"gamepadinputupdate"`

For `gamepadinputupdate`, event data includes `gamepads[]` where each gamepad object provides:

- `index`
- `id`
- `axes` in range `[-1, 1]`
- `buttons[]` entries with `{ pressed, value }`

### APIs

```js
gp.deadZone   // number (read-only) in range [0, 1]
```

Notes:

- Input data is raw (before dead zone and mapping).
- Unlike browser Gamepad API, this interface also works in worker mode.

---

### ITextInstance Script Interface

`ITextInstance` derives from `IWorldInstance`.

### APIs

```js
txt.text
txt.typewriterText(str, duration)
txt.typewriterFinish()

txt.fontColor          // [r, g, b] floats in [0, 1]
txt.fontFace
txt.isBold
txt.isItalic
txt.sizePt
txt.lineHeight

txt.horizontalAlign    // "left" | "center" | "right"
txt.verticalAlign      // "top" | "center" | "bottom"
txt.readAloud
txt.textDirection      // "ltr" | "rtl"
txt.wordWrapMode       // "word" | "character" | "cjk"

txt.setFixedResolutionMode(scale)
txt.setAutoResolutionMode()

txt.textWidth
txt.textHeight
txt.getTextSize()

txt.hasTagAtPosition(tag, x, y)
txt.getTagAtPosition(x, y)
txt.getTagCount(tag)
txt.getTagPositionAndSize(tag, index)

txt.changeIconSet(objectClass)
await txt.getAsHtmlString()
```

---

### ISpriteFontInstance Script Interface

`ISpriteFontInstance` derives from `IWorldInstance`.

### APIs

```js
sf.text
sf.typewriterText(str, duration)
sf.typewriterFinish()

sf.characterScale
sf.characterSpacing
sf.lineHeight

sf.horizontalAlign     // "left" | "center" | "right"
sf.verticalAlign       // "top" | "center" | "bottom"
sf.wordWrapMode        // "word" | "character" | "cjk"

sf.textWidth
sf.textHeight
sf.getTextSize()

sf.hasTagAtPosition(tag, x, y)
sf.getTagAtPosition(x, y)
sf.getTagCount(tag)
sf.getTagPositionAndSize(tag, index)
```

---

### IMultiplayerObjectType Script Interface

`IMultiplayerObjectType` derives from `IObjectClass`. Use via `runtime.objects.Multiplayer`.

### Main APIs

```js
mp.signalling
mp.stats

mp.isHost
mp.myId
mp.myAlias
mp.hostId
mp.hostAlias
mp.currentGame
mp.currentGameInstance
mp.currentRoom
mp.peerCount

mp.getAllPeers()
mp.getPeerById(peerId)

mp.sendPeerMessage(peerId, message, transmissionMode = "o")
mp.hostBroadcastMessage(fromId, message, transmissionMode = "o")
mp.disconnectRoom()
mp.simulateLatency(latency, pdv, loss)
```

Main events:

- `"peerconnect"`
- `"peerdisconnect"`
- `"message"`
- `"kicked"`

### Signalling APIs (`mp.signalling`)

```js
sig.addEventListener(eventName, callback)
sig.removeEventListener(eventName, callback)

await sig.connect(url = "wss://multiplayer.construct.net")
sig.disconnect()
sig.isConnected

sig.addICEServer(url, username, credential)

await sig.login(alias)
sig.isLoggedIn

await sig.joinRoom(game, instance, room, maxPeers = 0)
await sig.autoJoinRoom(game, instance, room, maxPeers = 2, isLocking = true)
await sig.leaveRoom()

await sig.requestGameInstanceList(game)
await sig.requestRoomList(game, instance, type = "all")
```

Signalling events:

- `"connected"`
- `"login"`
- `"join"`
- `"leave"`
- `"disconnected"`
- `"kicked"`
- `"error"`

### Peer APIs (`IMultiplayerPeer`)

```js
peer.id
peer.alias
peer.isHost
peer.isMe
peer.latency
peer.pdv
peer.send(message, transmissionMode = "o")
```

### Stats APIs (`mp.stats`)

```js
stats.inboundBandwidth
stats.outboundBandwidth
stats.inboundDecompressedBandwidth
stats.outboundDecompressedBandwidth
stats.inboundCount
stats.outboundCount
```

Valid strings:

- `transmissionMode`: `"o"`, `"r"`, `"u"`
- `requestRoomList` type: `"all"`, `"unlocked"`, `"available"`

---

## 72. Behavior Interfaces Category

Behavior interfaces are grouped here in one place.

Already documented behavior scripting references:

- [IPhysicsBehavior and IPhysicsBehaviorInstance](#25-physics-behavior-api-iphysicsbehavior--iphysicsbehaviorinstance)
- [ILOSBehaviorInstance](#49-ilosbehaviorinstance-script-interface)
- [ISineBehaviorInstance](#50-isinebehaviorinstance-script-interface)

Additional behavior scripting references in this category:

- [ITweenBehaviorInstance](#73-itweenbehaviorinstance-script-interface)
- [ITileMovementBehaviorInstance](#74-itilemovementbehaviorinstance-script-interface)
- [ISolidBehaviorInstance](#75-isolidbehaviorinstance-script-interface)
- [IPlatformBehaviorInstance](#76-iplatformbehaviorinstance-script-interface)
- [IPathfindingBehaviorInstance](#77-ipathfindingbehaviorinstance-script-interface)
- [IPathfindingMap](#78-ipathfindingmap-script-interface)
- [IOrbitBehaviorInstance](#79-iorbitbehaviorinstance-script-interface)
- [IMoveToBehaviorInstance](#80-imovetobehaviorinstance-script-interface)
- [IJumpthruBehaviorInstance](#81-ijumpthrubehaviorinstance-script-interface)
- [IFollowBehaviorInstance](#82-ifollowbehaviorinstance-script-interface)
- [IDragDropBehaviorInstance](#83-idragdropbehaviorinstance-script-interface)
- [IBulletBehaviorInstance](#84-ibulletbehaviorinstance-script-interface)
- [IAnchorBehaviorInstance](#85-ianchorbehaviorinstance-script-interface)
- [I8DirectionBehaviorInstance](#86-i8directionbehaviorinstance-script-interface)
- [ICarBehaviorInstance](#87-icarbehaviorinstance-script-interface)

---

## 73. ITweenBehaviorInstance Script Interface

`ITweenBehaviorInstance` derives from `IBehaviorInstance` and provides APIs specific to the Tween behavior.

An actively running tween is represented by `ITweenState` (see [ITweenState](#63-itweenstate-script-interface)), which derives from `ITimelineStateBase`.

### Basic usage

```js
async function doTween(runtime) {
  const inst = runtime.objects.Sprite.getFirstInstance();
  const tween = inst.behaviors.Tween.startTween("position", [300, 300], 2, "in-out-sine");
  await tween.finished;
  console.log("Tween finished");
}
```

### Tween property strings

Valid `prop` values for `startTween`:

- x, y, z
- position
- width, height, size
- x-scale, y-scale, scale
- angle
- opacity
- color
- value

### Built-in ease names

- linear
- in-sine, out-sine, in-out-sine
- in-elastic, out-elastic, in-out-elastic
- in-back, out-back, in-out-back
- in-bounce, out-bounce, in-out-bounce
- in-cubic, out-cubic, in-out-cubic
- in-quadratic, out-quadratic, in-out-quadratic
- in-quartic, out-quartic, in-out-quartic
- in-quintic, out-quintic, in-out-quintic
- in-circular, out-circular, in-out-circular
- in-exponential, out-exponential, in-out-exponential

### APIs

```js
tweenBehavior.startTween(prop, endValue, time, ease, opts?)
// Returns ITweenState
// opts: tags, destroyOnComplete, loop, repeatCount, pingPong, startValue (value tweens)

tweenBehavior.allTweens()          // generator -> ITweenState
tweenBehavior.tweensByTags(tags)   // generator -> ITweenState

tweenBehavior.isEnabled            // boolean get/set
```

---

## 74. ITileMovementBehaviorInstance Script Interface

`ITileMovementBehaviorInstance` derives from `IBehaviorInstance` and provides Tile Movement APIs.

### APIs

```js
tileMove.isIgnoringInput      // boolean get/set
tileMove.isDefaultControls    // boolean get/set
tileMove.isEnabled            // boolean get/set

tileMove.simulateControl(control)
// control: "left" | "right" | "up" | "down"

tileMove.setSpeed(x, y)
tileMove.getSpeed()           // -> [x, y]

tileMove.setGridPosition(x, y, immediate)
tileMove.getGridPosition()    // -> [x, y]

tileMove.modifyGridDimensions(width, height, xOffset, yOffset)

tileMove.isMoving()                          // -> boolean
tileMove.isMovingDirection(direction)        // -> boolean

tileMove.canMoveto(x, y)                     // -> boolean
tileMove.canMoveDirection(direction, distance) // -> boolean

tileMove.getTargetPosition()       // -> [x, y] world space
tileMove.getGridTargetPosition()   // -> [x, y] grid space

tileMove.toGridSpace(x, y)         // -> [x, y]
tileMove.fromGridSpace(x, y)       // -> [x, y]
```

---

## 75. ISolidBehaviorInstance Script Interface

`ISolidBehaviorInstance` derives from `IBehaviorInstance` and provides Solid behavior APIs.

### APIs

```js
solid.isEnabled            // boolean get/set
solid.usesInstanceTags     // boolean (read-only)

// Deprecated (prefer instance tags when usesInstanceTags is true)
solid.tags                 // string get/set
solid.setAllTags(iterable)
solid.getAllTags()         // -> Set<string>
```

---

## 76. IPlatformBehaviorInstance Script Interface

`IPlatformBehaviorInstance` derives from `IBehaviorInstance` and provides Platform behavior APIs.

### APIs

```js
platform.fallThrough()
platform.resetDoubleJump(allow)
platform.simulateControl(control)    // "left" | "right" | "jump"

platform.speed             // number (read-only)
platform.maxSpeed          // number get/set
platform.acceleration      // number get/set
platform.deceleration      // number get/set

platform.vectorX           // number get/set
platform.vectorY           // number get/set
platform.setVector(x, y)
platform.getVector()       // -> [x, y]

platform.jumpStrength      // number get/set
platform.maxFallSpeed      // number get/set
platform.gravity           // number get/set
platform.gravityAngle      // number get/set (radians)
platform.isDoubleJumpEnabled // boolean get/set
platform.jumpSustain       // number get/set (seconds)

platform.isMoving          // boolean (read-only)
platform.isOnFloor         // boolean (read-only)
platform.isByWall(side)    // -> boolean, side: "left" | "right"
platform.isJumping         // boolean (read-only)
platform.isFalling         // boolean (read-only)

platform.ceilingCollisionMode // "stop" | "preserve-momentum"

platform.isDefaultControls // boolean get/set
platform.isIgnoringInput   // boolean get/set
platform.isEnabled         // boolean get/set
```

---

## 77. IPathfindingBehaviorInstance Script Interface

`IPathfindingBehaviorInstance` derives from `IBehaviorInstance` and provides pathfinding and movement APIs.

### Events

Standard behavior instance event properties apply.

- arrived: fired when movement reaches destination.

### APIs

```js
path.map                            // IPathfindingMap

await path.findPath(x, y)           // -> boolean
await path.calculatePath(fromX, fromY, toX, toY) // -> boolean

path.startMoving()
path.stop()

path.maxSpeed            // number get/set
path.speed               // number get/set
path.acceleration        // number get/set
path.deceleration        // number get/set
path.rotateSpeed         // number get/set

path.isCalculatingPath   // boolean (read-only)
path.isMoving            // boolean (read-only)
path.currentNode         // number (read-only)

path.getNodeCount()      // -> number
path.getNodeXAt(i)
path.getNodeYAt(i)
path.getNodeAt(i)        // -> [x, y]
path.nodes()             // generator -> [x, y]

path.directMovementMode  // "none" | "to-destination" | "anywhere-along-path"
path.isEnabled           // boolean get/set
```

---

## 78. IPathfindingMap Script Interface

`IPathfindingMap` is accessed through `IPathfindingBehaviorInstance.map` and represents a shared pathfinding grid.

### APIs

```js
map.cellSize            // number (read-only)
map.cellBorder          // number (read-only)
map.widthInCells        // number (read-only)
map.heightInCells       // number (read-only)

map.isCellObstacle(x, y)        // -> boolean

map.isDiagonalsEnabled          // boolean get/set
map.moveCost                    // number get/set

await map.regenerateMap()
await map.regenerateRegion(startX, startY, endX, endY)
await map.regenerateObjectRegion(objectClass)

map.startPathGroup(baseCost = 1, cellSpread = 1, maxWorkers = 1)
map.endPathGroup()
```

---

## 79. IOrbitBehaviorInstance Script Interface

`IOrbitBehaviorInstance` derives from `IBehaviorInstance` and provides orbit motion APIs.

### APIs

```js
orbit.setTargetPosition(x, y)
orbit.getTargetPosition()      // -> [x, y]
orbit.pin(iWorldInst)

orbit.speed                    // number get/set
orbit.acceleration             // number get/set
orbit.rotation                 // number get/set (radians)
orbit.offsetAngle              // number get/set (radians)

orbit.primaryRadius            // number get/set
orbit.secondaryRadius          // number get/set

orbit.isMatchRotation          // boolean get/set
orbit.totalRotation            // number get/set
orbit.totalAbsoluteRotation    // number get/set

orbit.getDistanceToTarget()    // -> number
orbit.isEnabled                // boolean get/set
```

---

## 80. IMoveToBehaviorInstance Script Interface

`IMoveToBehaviorInstance` derives from `IBehaviorInstance` and provides point-to-point movement APIs.

### Events

Standard behavior instance event properties apply.

- arrived: fired when destination is reached.
- hitsolid: fired when stop-on-solids is enabled and a solid is hit.

### APIs

```js
moveTo.moveToPosition(x, y, isDirect = true)

moveTo.getTargetX()
moveTo.getTargetY()
moveTo.getTargetPosition()     // -> [x, y]

moveTo.getWaypointCount()
moveTo.getWaypointX(index)
moveTo.getWaypointY(index)
moveTo.getWaypoint(index)      // -> [x, y]

moveTo.stop()
moveTo.isMoving                // boolean (read-only)

moveTo.speed                   // number get/set
moveTo.maxSpeed                // number get/set
moveTo.acceleration            // number get/set
moveTo.deceleration            // number get/set
moveTo.angleOfMotion           // number get/set (radians)
moveTo.rotateSpeed             // number get/set (radians/s)

moveTo.isStopOnSolids          // boolean get/set
moveTo.isEnabled               // boolean get/set
```

---

## 81. IJumpthruBehaviorInstance Script Interface

`IJumpthruBehaviorInstance` derives from `IBehaviorInstance`.

### APIs

```js
jumpthru.isEnabled   // boolean get/set
```

---

## 82. IFollowBehaviorInstance Script Interface

`IFollowBehaviorInstance` derives from `IBehaviorInstance` and provides delayed-follow/history APIs.

Built-in property strings include: x, y, z-elevation, width, height, angle, opacity, visibility, destroyed.

Interpolation strings include: step, linear, angular.

### APIs

```js
follow.startFollowing(inst, fromCurrentPosition = false)
follow.stopFollowing()

follow.followInstance      // IInstance | null (read-only)
follow.mode                // "time" | "distance"

follow.delay               // number get/set
follow.maxDelay            // number get/set
follow.historyRate         // number get/set

follow.clearHistory()
follow.rewindHistory(time)
follow.hasFollowData       // boolean (read-only)

follow.setFollowingProperty(prop, isEnabled)
follow.isFollowingProperty(prop)

follow.setPropertyInterpolation(prop, interpolation)
follow.getPropertyInterpolation(prop)

follow.startFollowingCustomProperty(customProperty, interpolation)
follow.stopFollowingCustomProperty(customProperty)
follow.isFollowingCustomProperty(customProperty)

follow.setCustomPropertyValue(customProperty, value)
follow.getDelayedCustomPropertyValue(customProperty)

follow.isPaused            // boolean get/set

follow.saveHistoryToJSON(maxDelay = 0)
follow.loadHistoryFromJSON(json)

follow.isEnabled           // boolean get/set
```

---

## 83. IDragDropBehaviorInstance Script Interface

`IDragDropBehaviorInstance` derives from `IBehaviorInstance`.

### Events

Standard behavior instance event properties apply.

- dragstart: fired when dragging begins.
- drop: fired when dragging ends.

### APIs

```js
dragDrop.axes         // "horizontal" | "vertical" | "both"
dragDrop.drop()
dragDrop.isDragging   // boolean (read-only)
dragDrop.isEnabled    // boolean get/set
```

---

## 84. IBulletBehaviorInstance Script Interface

`IBulletBehaviorInstance` derives from `IBehaviorInstance`.

### APIs

```js
bullet.speed                // number get/set
bullet.acceleration         // number get/set
bullet.gravity              // number get/set
bullet.angleOfMotion        // number get/set (radians)
bullet.bounceOffSolids      // boolean get/set
bullet.distanceTravelled    // number get/set
bullet.isEnabled            // boolean get/set
```

---

## 85. IAnchorBehaviorInstance Script Interface

`IAnchorBehaviorInstance` derives from `IBehaviorInstance`.

### APIs

```js
anchor.isEnabled   // boolean get/set
```

---

## 86. I8DirectionBehaviorInstance Script Interface

`I8DirectionBehaviorInstance` derives from `IBehaviorInstance`.

### APIs

```js
dir8.stop()
dir8.reverse()
dir8.simulateControl(control)   // "left" | "right" | "up" | "down"

dir8.speed            // number get/set
dir8.maxSpeed         // number get/set
dir8.acceleration     // number get/set
dir8.deceleration     // number get/set

dir8.vectorX          // number get/set
dir8.vectorY          // number get/set
dir8.setVector(x, y)
dir8.getVector()      // -> [x, y]

dir8.isAllowSliding   // boolean get/set
dir8.isDefaultControls // boolean get/set
dir8.isIgnoringInput   // boolean get/set
dir8.isEnabled         // boolean get/set
```

---

## 87. ICarBehaviorInstance Script Interface

`ICarBehaviorInstance` derives from `IBehaviorInstance`.

### APIs

```js
car.stop()
car.simulateControl(control)   // "left" | "right" | "up" | "down"

car.speed            // number get/set
car.maxSpeed         // number get/set
car.acceleration     // number get/set
car.deceleration     // number get/set

car.vectorX          // number (read-only)
car.vectorY          // number (read-only)
car.getVector()      // -> [x, y]
car.angleOfMotion    // number (read-only, radians)

car.steerSpeed       // number get/set
car.driftRecover     // number get/set
car.friction         // number get/set
car.turnWhileStopped // boolean get/set

car.isDefaultControls // boolean get/set
car.isIgnoringInput   // boolean get/set
car.isEnabled         // boolean get/set
```

---

## 88. Editor Scripts — Scope and Restrictions

Plugin and behavior addons have separate scripts that run in the context of the **editor** rather than the runtime (the Construct game engine).

Effects don't use editor scripts — they only provide shader code.

Most addons do not need complex editor scripts. However some editor features are available for things like specifying dependencies and importing assets. These are documented in the Editor API reference section of the Addon SDK manual.

### Do not access the DOM in editor scripts

The editor DOM, including all HTML, CSS styles, and event handlers, are considered **internal details**. Do not develop addons that access or modify these in any way.

Such addons risk breaking at any time, including permanently breaking with no workaround, and in this event Scirra will not provide support. In future, editor addons are likely to be sandboxed, in which case all unsupported features will become unavailable anyway.

---

## 89. Runtime Scripts and Modules

Plugin and behavior addons have separate scripts that run in the context of the **runtime** (the Construct game engine) rather than the editor.

Effects don't use runtime scripts — they only provide shader code.

### Runtime documentation

In Construct's addon SDK, runtime scripts are based on the same APIs used by Construct's scripting feature. The Addon SDK-specific interfaces are in the Addon SDK interfaces section of the scripting reference. All other scripting APIs in the Construct manual are also accessible to addons.

### Using modules

The Addon SDK has first-class support for ES modules, allowing `import` and `export` in addon runtime scripts.

#### Configuring use of modules

By default, CAW samples are already configured to use modules. For clarity, the requirements are:

1. The editor plugin calls `this._info.SetRuntimeModuleMainScript("c3runtime/main.js")` to set `main.js` as the single entry point Construct loads.
2. All other runtime scripts are imported in `main.js`, e.g. `import "./instance.js"`.
3. `main.js` is added to `file-list` in `addon.json` so it works in developer mode.

If an addon does **not** call `SetRuntimeModuleMainScript()`, Construct automatically generates a main script that imports every runtime file. However this is not the correct approach if you want to import a module in one of your existing runtime files.

#### Adding a module script

Assuming the addon is already configured to use modules (as all CAW samples are), to import a new module script named `mymodule.js`:

1. Create `c3runtime/mymodule.js` and write an export in it.
2. In the editor plugin/behavior script, call `this._info.AddC3RuntimeScript("c3runtime/mymodule.js")` to register it.
3. Add `c3runtime/mymodule.js` to `"file-list"` in `addon.json` so it is available in developer mode.
4. Import the module in an existing runtime script, e.g. at the top of `instance.js`:
   ```js
   import * as MyModule from "./mymodule.js";
   ```

In short: add the file as a runtime script, then import it somewhere.

---

## 90. DOM Calls in the C3 Runtime (Worker Architecture)

A major architectural feature of the runtime is the ability to host it in a **dedicated worker**, off the main thread. In this mode it renders using `OffscreenCanvas`. Many browser APIs are available in workers, but some are not.

If your addon's runtime code only uses worker-compatible APIs (e.g. `fetch()`, `IndexedDB`), no changes are needed.

### The split architecture

When DOM access is required, split the runtime scripts into two halves:

- **Runtime side** — runs in the worker.
- **DOM side** — runs on the main thread where the `document` is. Has full browser API access.

The DOM side can issue calls using a specially-designed messaging API built into the runtime. Instead of making a call directly, your addon posts a message to the DOM-side script, which makes the real API call and can send a message back with the result.

This is inherently asynchronous (messaging to/from a worker is async), so synchronous DOM calls become async.

> **This single approach covers both modes.** In non-Worker mode both scripts run in the same context and the messaging API forwards messages within it. Code works identically regardless of whether the runtime is hosted in the main thread or a worker.

### Using a DOM script

By default, Construct assumes no DOM scripts are used. To enable one:

```js
// In the editor plugin constructor:
this._info.SetDOMSideScripts(["c3runtime/domSide.js"]);
```

An array of script paths is used — split large DOM code across multiple files if needed. Add all DOM script files to `file-list` in `addon.json`.

### Relevant interfaces

- `DOMElementHandler` — used in `domSide.js`
- `ISDKDOMPluginBase` — used in `plugin.js`
- `ISDKDOMInstanceBase` — used in `instance.js`

See the `domElementPlugin` template in the C3 plugin SDK download for a complete working example: a `<button>` element with custom text and an On clicked trigger, with full Web Worker support.

---

## 91. Timeline Integration

Adding timeline support to a third-party plugin, behavior, or effect is straightforward but requires a small amount of extra work.

### Plugins

1. **Set `interpolatable: true`** in the plugin property options for each property that timelines should support.

2. **Implement `GetPropertyValueByIndex(index)`** on the plugin instance class.
   - `index` — refers to the property's position in the array passed to the constructor.
   - Returns the current value for that property index.
   - **Colors** — return as `[r, g, b]` (three values in whatever range the plugin uses).
   - **Angles** — return in the same format as shown in the editor (e.g. degrees, not radians) if the plugin converts internally.

3. **Implement `SetPropertyValueByIndex(index, value)`** on the plugin instance class.
   - `index` — the property's constructor position.
   - `value` — the new absolute value; apply directly with `=`.
   - **Colors** — received as `[r, g, b]`. Apply according to the plugin's internal representation.
   - **Angles** — convert incoming value to the internal format before assignment if the plugin converts.
   - If the plugin caches derived state from a property, update that cache here too.

#### Layout view preview updates

Some plugins need to update the layout view to preview timeline changes live. For those, implement two additional methods:

- **`OnTimelinePropertyChanged(id, value, detail)`**
  - `id` — property ID string.
  - `value` — value being applied by the timeline.
  - `detail` — object with `resultMode`: `"absolute"` or `"relative"`.
  - Update the corresponding internal state using `GetTimelinePropertyValue(id)` (gets the value with any timeline changes applied), then refresh the layout view.

- **`OnExitTimelineEditMode()`**
  - Called when timeline edit mode is turned off.
  - Reset internal state by reading back with `GetPropertyValue(id)` (without timeline changes) and refresh the layout view.

### Behaviors

All the same steps apply as for plugins.

### Effects

Edit the effect's `.json` file and add `"interpolatable": true` to each parameter definition that timelines should support. No additional code changes needed.

> **Not all properties need to be supported.** If a property does not make sense for dynamic updates, it is fine to leave it non-interpolatable.

---

## 92. Wrapper Extensions

Wrapper extensions allow bundling a native DLL/dylib/so alongside a plugin for deeper platform integration. Supported exporters:

- Windows WebView2
- Xbox UWP (WebView2)
- macOS WKWebView
- Linux (CEF)

The model is similar to Cordova plugins on mobile: the extension performs tasks for the plugin that are not achievable in JavaScript alone. It is specifically designed for integrating C/C++ SDKs such as Steamworks.

> The Construct Addon SDK includes the wrapper extension SDK under `plugin-sdk/wrapperExtensionPlugin`.

### How it works

1. A Visual Studio 2022 / Xcode / CMake solution in the `extension` subfolder builds a DLL that integrates custom features.
2. The DLL uses `.ext.dll` / `.ext.dylib` / `.ext.so` extension. The wrapper application loads all `.ext.*` files from the executable folder on startup.
3. The Construct plugin bundles the DLL by calling `AddFileDependency()` with `type: "wrapper-extension"`.
4. The plugin detects extension availability and sends messages to request tasks.

### Messaging

Both sides must set the same **component ID** to communicate:

```js
// C++ wrapper extension constructor
iApplication->RegisterComponentId("my-component-id");

// JavaScript plugin constructor
this.SetWrapperExtensionComponentId("my-component-id");
```

Check availability before sending messages:

```js
if (this._isWrapperExtensionAvailable()) {
  // safe to send messages
}
```

> If unavailable, one-off messages are dropped silently; async messages return promises that **never resolve** (possible hang). Always check first.

### One-off messages (fire and forget)

```js
// JavaScript → wrapper extension
this._sendWrapperExtensionMessage("message-id", [param1, param2]);
// params: array of boolean | number | string only

// Wrapper extension → JavaScript (C++)
SendWebMessage("message-id", {
  { "key1", "Hello world!" },
  { "key2", 42.0 },
});

// JavaScript: receive from wrapper extension
this._addWrapperExtensionMessageHandler("message-id", (data) => {
  console.log(data["key1"]);  // use string-key syntax (minifier-safe)
});
```

The wrapper extension receives all messages from JavaScript in `HandleWebMessage()`, examines the message ID, and dispatches to a dedicated handler.

### Async messages

JavaScript can send an async message and await a response:

```js
const result = await this._sendWrapperExtensionMessageAsync("message-id", [params]);
// result is the JSON data the wrapper responds with
```

The wrapper extension receives async messages the same way, but must call `SendAsyncResponse()` with the matching `asyncId`:

```cpp
// C++
SendAsyncResponse({
  { "result", "success" },
}, asyncId);
```

> The wrapper extension **must always respond** to async messages on all code paths, including errors. A missing response leaves the promise pending and may hang the project.

### Exporting properties to package.json

A single-global plugin with a wrapper extension can call `SetWrapperExportProperties()` to write selected property values into the exported `package.json`. The wrapper extension can read these before any web content loads — useful for SDK initialization with app IDs/API keys.

```js
this._info.SetWrapperExportProperties("my-component-id", ["appId", "apiKey"]);
```

### Recommended architecture

- Implement as much logic as possible in JavaScript.
- Only send messages to the wrapper extension for specific API calls not achievable from JavaScript.
- This minimizes platform-specific C++ code and keeps logic in one place.

### String encoding (Windows)

The wrapper extension SDK uses UTF-8 encoding for strings. Use the provided utility methods to convert:

```cpp
Utf8ToWide(str)   // std::string UTF-8 → std::wstring UTF-16 for Windows APIs
WideToUtf8(wstr)  // std::wstring UTF-16 → std::string UTF-8
```

> Recommendation: use UTF-8 everywhere; only convert to UTF-16 when calling Windows APIs that require it, then immediately convert results back.

### macOS architecture

Use Objective-C++ (`.cpp` files configured as Objective-C++ in Xcode) to mix C++ and Objective-C. Convert between `std::string` (UTF-8) and `NSString` at Apple API boundaries:

```objc
NSString* ns = [NSString stringWithUTF8String:str.c_str()];
std::string back = std::string([ns UTF8String]);
```

Xcode builds universal binaries (x64 + ARM64) by default.

### Platform preprocessor defines

```cpp
_WIN32      // Windows (Visual Studio)
__APPLE__   // macOS (Xcode)
__linux__   // Linux (gcc)
```

---

## 93. Porting Construct 2 Plugins / Behaviors

Use this checklist to port a Construct 2 addon to Construct 3.

1. **Copy the template SDK** to a new folder.

2. **Update addon metadata** in `addon.json`.

3. **Update the icon.** Use SVG (preferred) or PNG. C2's `.ico` files are not supported.
   ```js
   this._info.SetIcon("icon.png", "image/png");
   ```

4. **Update plugin/behavior constants and identifiers** in `plugin.js`/`behavior.js`, `type.js`, and `instance.js` as described in the configuring plugins/behaviors documentation.

5. **Match your C2 addon's configuration.** For example, if the C2 plugin was single-global:
   ```js
   this._info.SetIsSingleGlobal(true);
   ```

6. **Add equivalent properties.** Follow the same property declarations as the C2 addon.

7. **Create corresponding ACE definitions.** The key to enabling C2 project import:
   - Give every action, condition, and expression a new **string `id`**.
   - Set the `c2id` property to the corresponding **numeric ID** from the C2 addon.

8. **Update the language file** with UI strings for the addon, properties, and ACEs.

9. **Port the runtime script** to the C3 runtime — C3 introduced a fully rewritten engine.

10. **Package the addon.** Zip all addon files and rename the `.zip` to `.c3addon`. Install via the Addon Manager in Construct 3.

### CAW-specific notes

In a CAW project, `c2id` is set in the ACE config object:

```js
export const config = {
  listName: "My Action",
  displayText: "My action {0}",
  description: "...",
  c2id: 7,  // numeric ID from the original C2 addon
  params: [],
};
```

The CAW build system will include `c2id` in the generated `aces.json`, enabling Construct to map old C2 event blocks to the new C3 ACEs when importing a C2 project.

---

## 94. SDK v2 Instance Handling (CAW Compliance)

This section consolidates the rules for working with instances in a way that is correct for Construct Addon SDK v2 inside a CAW project. Follow all of these when writing or reviewing runtime instance code.

---

### What `this` means in each addon type

Understanding what `this` refers to is the starting point for all instance work.

| Context | `this` | `this.instance` |
|---|---|---|
| Plugin runtime class (`src/runtime/instance.js`) | The plugin instance — owns its own world state directly | Not applicable (plugin IS the instance) |
| Behavior runtime class (`src/runtime/instance.js`) | The behavior instance — owns behavior logic and properties | The `IWorldInstance` the behavior is attached to |

In a behavior, `this` and `this.instance` are two distinct objects. Position, size, angle, and layer all live on `this.instance`. Never confuse the two.

---

### World instance properties — use `this.instance` directly

SDK v1 and early SDK v2 draft code used `getWorldInfo()` and `_sdkInst` to read and write world state. Both are removed in current SDK v2. Do not use them.

All world properties are available directly on `this.instance` (behaviors) or `this` (plugin world instances):

| Property | Type | Notes |
|---|---|---|
| `x` | number (get/set) | Horizontal position in layout pixels |
| `y` | number (get/set) | Vertical position in layout pixels |
| `width` | number (get/set) | Width in pixels |
| `height` | number (get/set) | Height in pixels |
| `angle` | number (get/set) | Rotation in **radians**; changing updates `angleDegrees` |
| `angleDegrees` | number (get/set) | Rotation in degrees; changing updates `angle` |
| `opacity` | number 0–1 (get/set) | Transparency |
| `isVisible` | boolean (get/set) | Visibility flag |
| `z` | number (get/set) | Z co-ordinate relative to its layer |
| `totalZ` | number (read-only) | Z + layer's Z elevation (absolute scene Z) |
| `layer` | ILayer (read-only) | The layer the instance is on |
| `uid` | number (read-only) | Unique instance ID |
| `objectType` | IObjectType (read-only) | The object type this instance belongs to |
| `dt` | number (read-only) | Delta-time using the instance's own time scale — equivalent to `runtime.GetDt(inst)` |
| `timeScale` | number (get/set) | Per-instance time scale multiplier |
| `behaviors` | object | Map of behavior name → behavior instance |

**Behavior example:**

```js
// ✗ SDK v1 — do not carry forward
const wi = this._inst.getWorldInfo();
const x = wi.GetX();
wi.SetX(x + 10);
wi.SetBboxChanged();

// ✓ SDK v2 — use this.instance directly
const x = this.instance.x;
this.instance.x = x + 10;
// No SetBboxChanged() needed — property setters invalidate automatically
```

**Plugin world instance example:**

```js
// In a world plugin, this IS the instance — access properties directly
const x = this.x;
this.x = x + speed;
```

> Do not call `SetBboxChanged()` in SDK v2 code. Setting a world property through the SDK v2 API handles bbox invalidation automatically.

---

### Delta time — use `inst.dt` or `GetDt(inst)`

`this.runtime.dt` is a global shortcut that ignores `timeScale` set on individual instances. Use either of these per-instance forms instead:

| Call | Context | Notes |
|---|---|---|
| `this.instance.dt` | Behavior — scripting interface form | `IInstance.dt` property; simplest |
| `this.runtime.GetDt(this.instance)` | Behavior — addon SDK form | Equivalent to `this.instance.dt` |
| `this.runtime.GetDt(this)` | Plugin runtime | Pass the plugin instance itself |
| `this.runtime.dt` | Anywhere | Global only — ignores per-instance `timeScale` |

Canonical pattern in a behavior `_tick()`:

```js
_tick() {
  const dt = this.instance.dt;             // scripting interface form
  // const dt = this.runtime.GetDt(this.instance);  // addon SDK equivalent
  this.instance.x += this._speed * dt;
}
```

Canonical pattern in a plugin `_tick()`:

```js
_tick() {
  const dt = this.runtime.GetDt(this);
  this._timer += dt;
}
```

---

### Constructor vs `_onCreate()` — where to put what

This distinction is critical because ACEs can fire before `_onCreate()` runs (for example, an action placed at Start of Layout). Any data structure an ACE reads must exist the moment the constructor finishes.

| Initialize here | What belongs here |
|---|---|
| `constructor()` | All data structures (Maps, arrays, Sets, counters, flags, state objects), `_getInitProperties()`, ticking setup |
| `_onCreate()` | Anything that requires `this.runtime` or, for behaviors, `this.instance` — layer lookups, object lookups, initial runtime-dependent state |

```js
constructor() {
  super();
  this._setTicking(true);

  // ✓ Always safe — exists before any ACE can run
  this._items   = new Map();
  this._active  = false;
  this._count   = 0;

  const props = this._getInitProperties();
  this._speed = props[0];
  this._mode  = props[1];
}

_onCreate() {
  // ✓ this.runtime is available here
  this._targetLayer = this.runtime.layout.getLayer(this._targetLayerName);
}
```

```js
// ✗ Wrong — _items does not exist if an ACE fires at Start of Layout
_onCreate() {
  this._items = new Map();
}
```

For behaviors, apply the same rule plus the additional constraint that `this.instance` is also unavailable in the constructor. Move any `this.instance` access to `_onCreate()` or `_postCreate()`.

---

### `this.instance` access rules for behaviors

| Lifecycle method | `this.instance` available? |
|---|---|
| `constructor()` | No — accessing it throws |
| `_onCreate()` | Yes |
| `_postCreate()` | Yes — called after the attached object finishes creation |
| `_tick()` | Yes |
| `_release()` | Yes |

If you need to run one-time setup that requires `this.instance` but want it to happen as early as possible, use `_postCreate()`:

```js
_postCreate() {
  // this.instance is fully initialized here — earlier than the first _tick()
  this._startX = this.instance.x;
  this._startY = this.instance.y;
}
```

If your setup also depends on other behaviors being initialized (e.g. reading `this.instance.behaviors["Physics"]`), use a lazy-init guard in `_tick()` instead, since behavior initialization order is not guaranteed:

```js
constructor() {
  super();
  this._setTicking(true);
  this._ready = false;
}

_tick() {
  if (!this._ready) {
    this._ready = true;
    this._physBehavior = this.instance.behaviors["Physics"] ?? null;
  }
  // main tick logic below
}
```

---

### Accessing other instances from within an addon

Use `this.runtime.objects` to find instances of other object types. All lookups are available from `_onCreate()` onwards.

```js
// Get all instances of a type
for (const inst of this.runtime.objects.Player.getAllInstances()) {
  inst.x; inst.y;
}

// Get the first instance (single-instance objects)
const player = this.runtime.objects.Player.getFirstInstance();

// Get instances by UID
const inst = this.runtime.getInstanceByUID(uid);
```

> `getFirstInstance()` returns `null` if no instances exist. Always null-check before using.

To read another behavior instance on the same object (behaviors only):

```js
// Direct key access (fast path)
const physics = this.instance.behaviors["Physics"];

// Safe access with null check
const solid = this.instance.behaviors["Solid"] ?? null;
```

---

### Per-instance timescale

Individual instances can have their own timescale applied on top of the global timescale. This is the main reason `GetDt(inst)` must be used instead of `runtime.dt`.

```js
// Set an instance to run at half speed
this.instance.timeScale = 0.5;

// Restore to following the global timescale
this.instance.restoreTimeScale();

// Read the current per-instance scale
const scale = this.instance.timeScale;
```

When `timeScale` is set on an instance, `this.runtime.GetDt(this.instance)` returns the already-scaled delta time. No manual multiplication needed.

---

### SDK v2 instance compliance checklist

- [ ] No `getWorldInfo()` calls — use `this.instance.x`, `.y`, `.z`, `.width`, `.height`, `.angle` / `.angleDegrees` etc. directly
- [ ] No `_sdkInst` direct access
- [ ] No `SetBboxChanged()` calls — SDK v2 property setters handle this automatically
- [ ] `angle` treated as radians; `angleDegrees` used when degrees are needed
- [ ] `z` used for Z elevation (not `zElevation`); `totalZ` for read-only absolute Z (not `totalZElevation`)
- [ ] `_tick()` uses `this.instance.dt` or `this.runtime.GetDt(this.instance)` (behavior), or `this.runtime.GetDt(this)` (plugin)
- [ ] All data structures initialized in `constructor()`, not deferred to `_onCreate()`
- [ ] `this.instance` not accessed in behavior `constructor()`
- [ ] `this.runtime` not accessed in `constructor()`
- [ ] One-time behavior setup that needs `this.instance` goes in `_postCreate()` or behind a `_ready` guard in `_tick()`
- [ ] Other-behavior lookups (`this.instance.behaviors[...]`) are behind a lazy-init guard

---

## 95. ISDKWorldInstanceBase — World Plugin Instance API

`ISDKWorldInstanceBase` extends `ISDKInstanceBase` (§27) for plugins whose type is `PLUGIN_TYPE.WORLD` — instances that appear visually in layouts. It adds drawing and hit-testing lifecycle hooks that object/global plugins do not have.

In CAW, use this surface inside `src/runtime/instance.js` when `type = PLUGIN_TYPE.WORLD` is set in `config.caw.js`.

### Additional lifecycle override: `_draw(renderer)`

```js
_draw(renderer) {
  // renderer: IRenderer — see §30 for the full drawing API
  // Called every frame when the instance needs to be rendered.
  // Set blend mode, fill mode, color, and texture before every draw call.
  renderer.setAlphaBlendMode();
  renderer.setTextureFillMode();
  renderer.setOpacity(this.opacity);
  renderer.quad(this.getBoundingQuad());
}
```

> `_draw()` is only called when the instance is on-screen and visible. Do not call `runtime.sdk.updateRender()` unconditionally — only when internal state actually changes something visual.

### Additional lifecycle override: `_drawGL(renderer)` *(less common)*

A secondary draw pass called after `_draw()` in some rendering paths. Most world plugins only need `_draw()`.

### HasImage texture pipeline (runtime) — field-verified (C3 + CAW)

When a world plugin sets `HasImage: true` (editable object image, edited like a Sprite frame), the **runtime** loads/draws that image like this. None of these accessor names are spelled out elsewhere in this doc, so they are recorded here:

```js
// Construct calls these lifecycle hooks itself — do not call them yourself.
async _loadTextures(renderer) {
  const imageInfo = this._getImageInfo();
  if (!imageInfo) return;
  // sampling: "nearest" | "bilinear" | "trilinear" (omit for project default)
  this._texture = await renderer.loadTextureForImageInfo(imageInfo, { sampling });
}

_releaseTextures(renderer) {
  const imageInfo = this._getImageInfo();
  if (imageInfo) renderer.releaseTextureForImageInfo(imageInfo);
  this._texture = null;
}

_draw(renderer) {
  // Sync fetch of the already-loaded texture (null until _loadTextures resolves)
  const texture = this._texture ?? renderer.getTextureForImageInfo(this._getImageInfo());
  if (!texture) { /* fall back to color fill so the object is still visible */ }
  renderer.setTextureFillMode();
  renderer.setTexture(texture);
  renderer.drawMesh(positions, uvs, indices, colors);   // or quad3(this.getBoundingQuad(), texRect)
}

_getImageInfo() {
  // The accessor name is not documented; use a fallback chain.
  return this.objectType?.getImageInfo?.()        // most common
      ?? this.getCurrentImageInfo?.()
      ?? this.getImageInfo?.()
      ?? null;
}
```

Notes:

- `renderer.loadTextureForImageInfo(imageInfo, opts)` / `getTextureForImageInfo(imageInfo)` (sync, post-load) / `releaseTextureForImageInfo(imageInfo)` are the texture-management calls (§30). The `imageInfo` (`IImageInfo`) comes from the **object type**, not the renderer.
- **Tiling:** set `IsTiled: true`. Construct then gives the object its own **non-spritesheeted** texture with **repeat wrap**, so UVs may exceed `[0,1]` and tile on the GPU — do **not** manually wrap UVs with `frac()`/`Math.floor` (that breaks across triangle edges). The tex rect is effectively the full `[0,1]` image.
- **Effects on a non-Sprite mesh:** set `SupportsEffects: true` **and** `MustPreDraw: true`. With MustPreDraw, Construct pre-renders `_draw()` to an offscreen surface and composites it to screen using the instance's native `this.blendMode`, opacity, and effect chain. Therefore draw geometry in `_draw()` with **`setAlphaBlendMode()` only** — setting a non-normal blend mode there double-applies the blend. Drive the visible blend via the `blendMode` property/ACE (sets `this.blendMode`).
- **Blank default:** a `HasImage` plugin with no default image URL starts with a blank/transparent frame (the build framework here does not copy a `defaultImageUrl` file into the package, so wire any default image through `files.fileDependencies` instead). Keep a color-fill fallback in `_draw()` so the object is visible before the user paints/imports the image.

### Hit testing

```js
// Override to implement custom point-in-instance testing.
// Default: bounding-box test.
_containsPoint(x, y) {
  return this.getBoundingBox().contains(x, y);
}
```

Override `_containsPoint()` if the instance has a non-rectangular visual shape (e.g. circular, polygonal). Used by Construct's click, mouse-over, and event-system overlap detection.

### CAW notes

- World plugins inherit all `ISDKInstanceBase` APIs (§27).
- `_setTicking(true)` + `_tick()` still work for per-frame logic.
- Calling `runtime.sdk.updateRender()` is required when non-tick visual state changes (e.g. a property changes outside of `_tick()`).
- `_draw()` and ticking are independent — a world plugin can tick without drawing and vice versa.

---

## 96. ISDKPluginBase — Runtime Plugin Base

`ISDKPluginBase` is the base class for the runtime plugin object itself — `src/runtime/plugin.js` in CAW. It runs once per plugin, not per instance.

In most CAW addons this file is minimal. Touch it only when you need plugin-level (not instance-level) initialization.

### APIs available in `plugin.js`

```js
// Access the runtime inside plugin methods
this.runtime   // IRuntime

// For DOM plugins: register DOM-side message handlers at plugin level
// (Per-instance handlers use the instance methods in §27)
```

### When to use `plugin.js`

- Setting up shared module-scope state before any instance is created.
- Calling `runtime.sdk.addLoadPromise()` — only valid here and in `ISDKBehaviorBase`, not in instance constructors (unless `IsSingleGlobal`).
- Registering cross-addon wrapper extension message handlers (§28).

### CAW template

```js
export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
      // Plugin-level setup only.
      // this.runtime is available here.
    }
  };
}
```

> Do not add instance logic here. All per-instance behavior belongs in `src/runtime/instance.js`.

---

## 97. ISDKObjectTypeBase — Runtime Type Base

`ISDKObjectTypeBase` is the base class for the runtime object type — `src/runtime/type.js` in CAW. It represents the type shared by all instances of one object class.

In most CAW addons this file is minimal.

### APIs available in `type.js`

```js
this.runtime        // IRuntime
this.name           // string (read-only) — the object type name
```

### When to use `type.js`

- Maintaining type-level caches that are shared by all instances of the same object class.
- Implementing type-level lifecycle hooks when the SDK exposes them.

### CAW template

```js
export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
      // Type-level setup only.
    }
  };
}
```

> Do not add instance-specific logic here. All per-instance behavior belongs in `src/runtime/instance.js`.

---

## 98. ISDKBehaviorBase — Runtime Behavior Plugin Base

`ISDKBehaviorBase` is the base class for the behavior plugin object — `src/runtime/plugin.js` in a behavior CAW project. It is the behavior equivalent of `ISDKPluginBase` (§96).

In most behavior addons this file is minimal.

### APIs available in behavior `plugin.js`

```js
this.runtime   // IRuntime
```

### When to use behavior `plugin.js`

- Calling `runtime.sdk.addLoadPromise()` at behavior startup (before any instance is created).
- Plugin-level initialization that should only run once for the entire behavior.

### CAW template

```js
export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
    }
  };
}
```

---

## 99. ISDKBehaviorTypeBase — Runtime Behavior Type Base

`ISDKBehaviorTypeBase` is the base class for the behavior type — `src/runtime/type.js` in a behavior CAW project. It represents the behavior added to one specific object type.

### APIs available in behavior `type.js`

```js
this.runtime        // IRuntime
this.name           // string (read-only) — the behavior type name as it appears in the editor
```

### When to use behavior `type.js`

- Per-object-type caches that are shared across all behavior instances attached to the same object class.
- Behavior type lifecycle hooks.

### CAW template

```js
export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
    }
  };
}
```

> `this.name` is available here and also on the behavior instance via `this.behaviorType.name` (§26).

---

## 100. ISDKDOMInstanceBase — DOM Plugin Instance API

`ISDKDOMInstanceBase` extends `ISDKWorldInstanceBase` (§95) for plugins that render a DOM element (HTML element) in the layout. This is the runtime instance base when `type = PLUGIN_TYPE.DOM` is set in `config.caw.js` and `hasDomside: true` is configured.

DOM instance code runs in the main thread. Communication with runtime logic (which runs in a Web Worker) goes through `_postToDOM` / `_addDOMMessageHandler` (inherited from `ISDKInstanceBase`, §27).

### Additional surface

```js
// Override to create and return the DOM element for this instance.
// Called once when the instance is first created.
_createElement() {
  const el = document.createElement("button");
  el.textContent = "Click me";
  el.addEventListener("click", () => this._onClicked());
  return el;
}

// Called when the DOM element has been attached to the document.
// The element is available via this.getElement() from here on.
_onCreated() {
  this.setCssStyle("position", "absolute");
}

// CSS styling helper (inherited from ISDKWorldInstanceBase / IDOMInstance)
this.setCssStyle(prop, val)   // e.g. this.setCssStyle("background-color", "#fff")

// Direct element access
this.getElement()             // → HTMLElement
```

### CAW notes

- `_createElement()` must return the root HTML element for the instance.
- `_onCreated()` runs after the element is placed in the DOM — safe to read computed styles.
- DOM-side message handling for instance replies goes through the instance's `_addDOMMessageHandler()` (§27).
- Position, size, and visibility are driven by the instance's world properties — Construct handles CSS transforms automatically.

---

## 101. ISDKDOMPluginBase — DOM Plugin Base

`ISDKDOMPluginBase` extends `ISDKPluginBase` (§96) for DOM plugins. It is the plugin-level class in `src/runtime/plugin.js` when the addon is a DOM plugin.

In most CAW DOM addon projects this file is minimal.

### When to use DOM plugin `plugin.js`

- Registering any plugin-level DOM message handlers that are not tied to a specific instance.
- Plugin-level setup that must run before any DOM element is created.

### CAW template

```js
export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
    }
  };
}
```

### Interface inheritance summary

For reference, the full SDK class hierarchy for each addon type:

| Addon type | Instance base | Type base | Plugin base |
|---|---|---|---|
| Object plugin | `ISDKInstanceBase` | `ISDKObjectTypeBase` | `ISDKPluginBase` |
| World plugin | `ISDKWorldInstanceBase` | `ISDKObjectTypeBase` | `ISDKPluginBase` |
| DOM plugin | `ISDKDOMInstanceBase` | `ISDKObjectTypeBase` | `ISDKDOMPluginBase` |
| Behavior | `ISDKBehaviorInstanceBase` | `ISDKBehaviorTypeBase` | `ISDKBehaviorBase` |

---

## Appendix: SDK v1 → v2 Porting Guide

Source: Construct 3 Official Manual, Addon SDK "Porting guide". Follow these steps to update a
plugin or behavior from Addon SDK v1 to v2.

**Step 1 — Update SDK version.** In `addon.json`, set `"sdk-version"` to `2` (add the field if
missing). Increment `"version"` too. (Note: with SDK v2 the addon version comes from `addon.json`
only — the editor script's `SetVersion(PLUGIN_VERSION)` is ignored and triggers a deprecation
warning until removed.)

**Step 2 — Update base classes** (the class after `extends`).

Plugins:

| SDK v1 base class | SDK v2 base class |
|---|---|
| `C3.SDKPluginBase` | `globalThis.ISDKPluginBase` |
| `C3.SDKTypeBase` | `globalThis.ISDKObjectTypeBase` |
| `C3.SDKInstanceBase` | `globalThis.ISDKInstanceBase` |
| `C3.SDKWorldInstanceBase` | `globalThis.ISDKWorldInstanceBase` |
| `C3.SDKDOMPluginBase` | `globalThis.ISDKDOMPluginBase` |
| `C3.SDKDOMInstanceBase` | `globalThis.ISDKDOMInstanceBase` |

Behaviors:

| SDK v1 base class | SDK v2 base class |
|---|---|
| `C3.SDKBehaviorBase` | `globalThis.ISDKBehaviorBase` |
| `C3.SDKBehaviorTypeBase` | `globalThis.ISDKBehaviorTypeBase` |
| `C3.SDKBehaviorInstanceBase` | `globalThis.ISDKBehaviorInstanceBase` |

**Step 3 — Update class constructors.** SDK v2 base-class constructors take **no parameters**.
For instance classes, read properties via `this._getInitProperties()` instead of a constructor
parameter:

```js
// SDK v1
constructor(inst, properties) {
  super(inst);
  if (properties) { /* ... read properties ... */ }
}

// SDK v2
constructor() {
  super();
  const properties = this._getInitProperties();
  if (properties) { /* ... read properties ... */ }
}
```

For DOM / wrapper-extension plugins, the component/extension ID is now passed in an options
object to `super()` (instead of `SetWrapperExtensionComponentId()`):

```js
super({ domComponentId: DOM_COMPONENT_ID });     // ISDKDOMPluginBase / ISDKDOMInstanceBase
super({ wrapperComponentId: "my-extension" });   // wrapper extension
```

**Step 4 — Remove the separate script interface.** In SDK v2 the runtime script classes *are*
the script-interface classes (all public members are scripting-accessible). Delete
`GetScriptInterfaceClass()` and the separate script-interface class — but first ensure the main
class implements everything that class used to, for backwards compatibility.

**Step 5 — Update property and method names.** SDK v1 members still work but were renamed to the
scripting-API conventions. Examples: `GetDebuggerProperties()` → `_getDebuggerProperties()`,
`Trigger()` → `_trigger()`. Some members moved base classes — e.g. v1 `this._runtime` on
`SDKInstanceBase` is now `this.runtime`, inherited from `IInstance`. Use an underscore prefix for
methods that shouldn't be called from scripting but can't be private.

**Step 6 — Update remaining code.** Service-integration addons may need little more. Addons with
heavy SDK v1 runtime logic must rewrite against the new runtime APIs (the scripting-feature APIs);
see the Runtime API Reference — which, per the scope note at the top of this file, is **not** part
of the editor-SDK manual this revision was reconciled against.

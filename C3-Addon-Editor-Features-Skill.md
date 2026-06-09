---
name: c3-addon-editor-features
description: >
  Implement Editor-side (not runtime-side) features for Construct 3 addons using the
  Addon SDK v2, with explicit Plugin-vs-Behavior capability boundaries. Use this skill
  whenever the task involves editor lifecycle hooks, Layout View drawing (IWebGLRenderer,
  meshes, lines, text), the Properties Bar, editor texture/image preview, editor-integrated
  project modification (custom importers, setup tools), or deciding which editor APIs are
  available to a plugin vs a behavior. Aligned to the official SDK v2 editor API reference.
  Pairs with the c3-addon-spec skill.
---

# C3 Addon Editor Features Skill

Standalone guide for implementing **Editor-side** addon features in Construct 3 on the
**Addon SDK v2**, with explicit Plugin-vs-Behavior capability boundaries. API names follow
the **official editor API reference** (base classes, geometry, graphics, and UI interfaces).

> **SDK version note.** As of **Construct 3 r450+ (2025)** the editor supports **only SDK v2**;
> SDK v1 is retired. Set `"sdk-version": 2` and an appropriate `"min-construct-version"` in
> `addon.json`.

> **Reference vs samples.** Where Scirra's shipped SDK *samples* use a different method name
> than the *reference documentation*, this file follows the **reference** and flags the sample
> name. See [Sample-vs-Reference Naming Drift](#sample-vs-reference-naming-drift). When unsure
> which name your Construct build exposes, verify from the browser console (see
> [Console Debugging Helpers](#console-debugging-helpers)).

---

## Revision Notes

This file is reconciled against the official editor API reference. Corrections from earlier drafts:

| Point | Status | Resolution |
|---|---|---|
| `OnAddedInEditor()` | **Real, behavior-only** | Documented on `IBehaviorInstanceBase`. It is the behavior's "added by user" setup hook. (`IBehaviorInstanceBase` does **not** document `OnCreate()`.) |
| `OnCreate()` | **Plugin (IInstanceBase) hook** | Documented on `IInstanceBase` (object + world plugins). For behaviors, use `OnAddedInEditor()`. |
| `this._behaviorInstance` | **Real, behavior handle** | Documented property on `IBehaviorInstanceBase` (an `IBehaviorInstance`). Also reachable via `GetBehaviorInstance()`. |
| `this._inst` | **Real, plugin handle** | Documented property on `IInstanceBase` (an `IObjectInstance`, or `IWorldInstance` for world plugins). |
| `SetPropertyEnabled` | **Not in the documented surface** | No property enable/disable method exists on any documented editor base class — for plugins or behaviors. Build mode UX another way (see below). |
| `OnPlacedInLayout()` | **Takes a parameter** | Documented as `OnPlacedInLayout(iLayoutView)`. |
| `GetOriginalWidth()`/`GetOriginalHeight()` | **Reference uses `GetOriginalSize()`** | Reference pairs `IsOriginalSizeKnown()` with `GetOriginalSize()` returning `[width, height, depth]`. The shipped sample uses the separate `GetOriginalWidth/Height()` form. |
| `RendersToOwnZPlane()` | **Added** | World-plugin override to mitigate Z-fighting (default `true`, return `false` for 3D not on its own Z plane). |
| Property types `color`/`object`/`link`/`projectfile` | **Plugins only** | A real plugin-vs-behavior boundary, now in the matrix and the PluginProperty reference. |
| Editor object model, `_info` config, `GetExternalSdkInstance`, collision-poly access | **Added** | Expanded from the official Object/Model/Info interface reference. |
| Editor DOM access | **Prohibited** | Documented: never touch the editor's HTML/CSS/event handlers; unsupported and subject to future sandboxing. Effects have no editor scripts at all. |

---

## Table of Contents

- [Scope](#scope)
- [File Map: Raw SDK vs CAW](#file-map-raw-sdk-vs-caw)
- [Editor vs Runtime: The Core Rule](#editor-vs-runtime-the-core-rule)
- [Editor Base Classes (Reference)](#editor-base-classes-reference)
- [Capability Matrix](#capability-matrix)
- [Addon Configuration (IPluginInfo / IBehaviorInfo)](#addon-configuration-iplugininfo--ibehaviorinfo)
- [PluginProperty Types & Options](#pluginproperty-types--options)
- [Editor Lifecycle](#editor-lifecycle)
- [World Plugin Drawing & Textures](#world-plugin-drawing--textures)
- [IWebGLRenderer Reference](#iwebglrenderer-reference)
- [Geometry: Color, Quad, Rect](#geometry-color-quad-rect)
- [Editor Text Rendering (IWebGLText)](#editor-text-rendering-iwebgltext)
- [Layout View & IDrawParams](#layout-view--idrawparams)
- [Editor Object Model](#editor-object-model)
- [Cross-Addon Access (GetExternalSdkInstance)](#cross-addon-access-getexternalsdkinstance)
- [Behavior Editor Features](#behavior-editor-features)
- [No Dynamic Property Enable/Disable](#no-dynamic-property-enabledisable)
- [Property-Type Gotchas (SIDs)](#property-type-gotchas-sids)
- [Editor-Integrated Plugins & Custom Importers](#editor-integrated-plugins--custom-importers)
- [Console Debugging Helpers](#console-debugging-helpers)
- [Sample-vs-Reference Naming Drift](#sample-vs-reference-naming-drift)
- [Use Cases](#use-cases)
- [Common Mistakes](#common-mistakes)
- [Implementation Templates](#implementation-templates)
- [Pre-Commit Checklist](#pre-commit-checklist)

---

## Scope

Editor-side implementation patterns for plugins (object, single-global, world) and behaviors:
lifecycle hooks, Layout View rendering (textures, meshes, lines, text), property handling, and
editor-integrated project modification. Out of scope: runtime ACE logic and runtime rendering
(those live in `c3runtime/`, covered by the `c3-addon-spec` skill).

---

## File Map: Raw SDK vs CAW

Editor scripts run in the Construct editor; runtime scripts run in the game (often in a Web
Worker). `addon.json` declares which is which.

```jsonc
// addon.json
{
  "sdk-version": 2,
  "min-construct-version": "r469",
  "type": "plugin",                  // or "behavior"
  "editor-scripts": [                // ← run in the EDITOR
    "plugin.js",                     // or "behavior.js" — addon definition
    "type.js",                       // editor type class
    "instance.js"                    // editor instance class (hooks + drawing)
  ],
  "file-list": [
    "c3runtime/main.js", "c3runtime/instance.js", "c3runtime/type.js",
    "c3runtime/plugin.js", "c3runtime/actions.js", "c3runtime/conditions.js",
    "c3runtime/expressions.js",
    "aces.json", "addon.json", "icon.svg", "lang/en-US.json",
    "plugin.js", "type.js", "instance.js"
  ]
}
```

**CAW mapping.** Editor work lives in `src/editor/instance.js` and `src/editor/type.js`; property
and addon shape are declared in `config.caw.js`. CAW compiles these into the raw `editor-scripts`
files and may wrap the class in a factory
(`export default function (instanceClass) { return class extends instanceClass { … } }`). Either
way the overridable method names are the SDK base-class methods documented below. Never put editor
code in `c3runtime/`.

---

## Editor vs Runtime: The Core Rule

- Editor classes derive from `SDK.I…` base classes; runtime classes derive from
  `C3.…` / `globalThis.ISDK…`. **Never mix them.**
- No `this.runtime`, no gameplay state, no tick loop in editor code.
- Editor code is for properties, Layout View drawing, and editor tooling only.
- Only **plugins and behaviors** have editor scripts. **Effects have no editor scripts** — they provide shader code only.
- Most addons need little or no editor scripting; the main reasons to write it are dependencies, asset import, and (for world plugins) Layout View drawing.

### Never touch the editor DOM

**Do not access or modify the Construct editor's DOM from editor scripts.** The editor DOM — all
its HTML, CSS styles, and event handlers — is an internal implementation detail. Addons that read
or change it risk breaking at any time, possibly **permanently with no workaround**, and Scirra
will not provide support for such breakage. The editor is also expected to be **sandboxed** in
future, at which point any unsupported DOM access becomes unavailable entirely.

Everything an editor script legitimately needs is exposed through the documented `SDK.I…`
interfaces (properties, the renderer, the project/object model, `SDK.UI.Util`). If a feature seems
to require reaching into editor HTML/CSS, that is the signal to stop and find the documented API
(or accept the feature isn't supported) — not to query the DOM.

> This is distinct from using your own **offscreen** pixel sources: passing an `ImageBitmap`,
> `OffscreenCanvas`, or `ImageData` to `IWebGLRenderer.UpdateTexture()` is a documented texture-data
> path, not editor-DOM manipulation. The prohibition is on touching *Construct's own* UI.

---

## Editor Base Classes (Reference)

### `IInstanceBase` — plugins (object / single-global)

Properties:
- `this._sdkType` — the associated SDK type class.
- `this._inst` — the `IObjectInstance` (or `IWorldInstance` for world plugins) representing this instance in the editor.

Methods:
- `Release()` — instance released (cleanup).
- `OnCreate()` — instance created in the editor.
- `OnPropertyChanged(id, value)` — a property changed.
- `LoadC2Property(name, valueString)` — custom C2 import; return `false` if unhandled.
- `GetProject()` → `IProject`.
- `GetObjectType()` → `IObjectType`.
- `GetInstance()` → `IObjectInstance`.

### `IWorldInstanceBase` — world plugins (extends `IInstanceBase`)

Adds:
- `OnPlacedInLayout(iLayoutView)` — instance placed by the user; set defaults (size/origin) here. Receives the `ILayoutView`.
- `Draw(iRenderer, iDrawParams)` — render in Layout View. `iRenderer` is an `IWebGLRenderer`; `iDrawParams` is an `IDrawParams`.
- `GetTexture(animationFrame)` — load a texture from an `IAnimationFrame` (async; returns `null` while loading, then an `IWebGLTexture`).
- `GetTexRect()` → `SDK.Rect` of the image within the (spritesheeted) texture. Valid only when `GetTexture()` is non-null.
- `HadTextureError()` → `true` if texture load failed (render a red placeholder).
- `IsOriginalSizeKnown()` + `GetOriginalSize()` — return `true` and an array `[width, height, depth]` (depth `0` for 2D) to enable percentage size options in the Properties Bar. Default: `IsOriginalSizeKnown()` returns `false`.
- `HasDoubleTapHandler()` + `OnDoubleTap()` — return `true` to enable a double-click/Edit action; implement `OnDoubleTap()` (typically `this.GetObjectType().EditImage()`).
- `RendersToOwnZPlane()` — return `true` (default) for 2D content on its own Z plane, `false` for 3D content that does not, to help mitigate Z-fighting.

### `IBehaviorInstanceBase` — behaviors

Properties:
- `this._sdkBehaviorType` — the associated SDK type class.
- `this._behaviorInstance` — the `IBehaviorInstance` representing this instance in the editor.

Methods:
- `OnPropertyChanged(id, value)` — a property changed.
- `GetBehaviorInstance()` → `IBehaviorInstance`.
- `GetSdkBehaviorType()` → the SDK type class.
- `OnAddedInEditor()` — the behavior was added to an object by the user (the behavior's setup hook).

Behaviors have **no** `Draw`, no world instance handle, and no documented `OnCreate`. Use
`OnAddedInEditor()` for setup and `OnPropertyChanged()` for reactions.

---

## Capability Matrix

| Feature | Plugin (object) | Plugin (world) | Behavior |
|---|---|---|---|
| Editor handle | `this._inst` (`IObjectInstance`) | `this._inst` (`IWorldInstance`) | `this._behaviorInstance` (`IBehaviorInstance`) |
| Type handle | `this._sdkType` / `GetObjectType()` | same | `this._sdkBehaviorType` / `GetSdkBehaviorType()` |
| Setup hook | `OnCreate()` | `OnCreate()` | `OnAddedInEditor()` |
| `OnPropertyChanged(id, value)` | Yes | Yes | Yes |
| `Release()` | Yes | Yes | not documented |
| `LoadC2Property()` | Yes | Yes | not documented |
| `GetProject()` | Yes | Yes | via `this._behaviorInstance.GetProject()` |
| Property types `color` / `object` / `link` / `projectfile` | Yes | Yes | **No** (plugins only) |
| `OnPlacedInLayout(iLayoutView)` | No | Yes | No |
| `Draw(iRenderer, iDrawParams)` | No | Yes | No |
| `GetTexture` / `GetTexRect` / `HadTextureError` | No | Yes | No |
| `IsOriginalSizeKnown` / `GetOriginalSize` | No | Yes | No |
| `HasDoubleTapHandler` / `OnDoubleTap` | No | Yes | No |
| `RendersToOwnZPlane` | No | Yes | No |
| Dynamic property enable/disable | **No** | **No** | **No** |

---

## Addon Configuration (IPluginInfo / IBehaviorInfo)

The addon's shape is configured in `plugin.js` / `behavior.js` via `this._info` (an `IPluginInfo`
or `IBehaviorInfo`). This runs in the editor.

**Shared (both `IPluginInfo` and `IBehaviorInfo`):**
`SetName`, `SetDescription`, `SetVersion("A.B.C.D")`, `SetCategory`, `SetAuthor`, `SetHelpUrl`,
`SetIcon(url, type)`, `SetIsDeprecated(bool)` (hide from new projects, keep old ones working),
`SetCanBeBundled(bool)`, `SetProperties([...PluginProperty])`, dependency helpers
(`AddCordovaPluginReference`, `AddFileDependency`, `AddRemoteScriptDependency`), runtime-script
config (`SetC3RuntimeScripts(arr)` replaces the default list; `AddC3RuntimeScript(path)` appends;
`SetRuntimeModuleMainScript(path)` for module-based loading), and TypeScript helpers
(`SetScriptInterfaceNames({...})`, `SetTypeScriptDefinitionFiles([...])`).

**Categories differ by addon type:**
- Plugin: `"data-and-storage"`, `"form-controls"`, `"general"`, `"input"`, `"media"`, `"monetisation"`, `"platform-specific"`, `"web"`, `"other"`.
- Behavior: `"attributes"`, `"general"`, `"movements"`, `"other"`.

**Plugin-only (`IPluginInfo`):**
- `SetPluginType("object" | "world")` — world plugins appear in the Layout View, derive from `SDK.IWorldInstanceBase`, and must implement `Draw()`.
- `SetIsSingleGlobal(bool)` — single permanent global instance (type must be `"object"`), like Audio/Touch.
- World flags: `SetIsResizable`, `SetIsRotatable`, `SetIs3D`, `SetHasImage`, `SetDefaultImageURL(url)`, `SetIsTiled`, `SetSupportsZElevation`, `SetSupportsColor`, `SetSupportsEffects`, `SetMustPreDraw` (set `true` if you draw anything other than a Sprite-equivalent textured quad, or effects render wrong).
- Common ACE bundles (auto-add built-in actions/conditions/expressions): `AddCommonPositionACEs`, `AddCommonSceneGraphACEs`, `AddCommonSizeACEs`, `AddCommonAngleACEs`, `AddCommonAppearanceACEs`, `AddCommonZOrderACEs`. (Scene-graph ACEs require your plugin to support hierarchy-driven position/size/angle.)
- Platform: `SetDOMSideScripts(arr)`, `SetGooglePlayServicesEnabled(bool)`, `AddCordovaResourceFile`, `SetWrapperExportProperties(componentId, propertyIds)`.

**Behavior-only (`IBehaviorInfo`):**
- `SetIsOnlyOneAllowed(bool)` — default `false` (a behavior may be added multiple times to one object); set `true` to allow only one per object.
- No plugin type, no world/image flags, no common-ACE bundles.

---

## PluginProperty Types & Options

Properties are declared with `new SDK.PluginProperty(type, id, initialValue | optionsObject)` and
passed to `SetProperties([...])`. `PluginProperty` is used for **both** plugins and behaviors —
but several types are **plugins only**, which is a real capability boundary.

| Type | Value | Availability |
|---|---|---|
| `"integer"` | whole number | both |
| `"float"` | float | both |
| `"percent"` | float `[0,1]` shown as % | both |
| `"text"` | string | both |
| `"longtext"` | string + "…" dialog button | both |
| `"check"` | boolean | both |
| `"font"` | font name string | both |
| `"combo"` | zero-based index of chosen item (`items` required) | both |
| `"group"` | none (Properties Bar group header) | both |
| `"info"` | none (read-only computed string; `infoCallback` required) | both |
| `"color"` | normalised RGB array, e.g. `[1,0,0]` | **plugins only** |
| `"object"` | object picker → stores a **SID** (`-1` if none) | **plugins only** |
| `"projectfile"` | project-file dropdown → relative export path (r426+) | **plugins only** |
| `"link"` | none (clickable Properties Bar action; `linkCallback` required) | **plugins only** |

**Options object** (third constructor arg): `initialValue` (for `combo`, the initial item ID
string; for `color`, an RGB array), `minValue`/`maxValue`, `items` (combo), `dragSpeedMultiplier`,
`allowedPluginIds` (object picker; may include `"<world>"` for any world plugin), `filter`
(projectfile extension, e.g. `".txt"`), `interpolatable` (timeline support), and the callbacks below.

**The `link` property is the documented way to put an action button in the Properties Bar.** Its
`callbackType` controls the callback:
- `"for-each-instance"` (default) — runs once per selected instance; the parameter is your editor instance (`IWorldInstanceBase` derivative). Use for per-instance actions like "make original size".
- `"once-for-type"` — runs once; the parameter is your editor type (`ITypeBase` derivative). Use for per-type actions like "edit image".

**The `info` property** shows a read-only string from `infoCallback(inst)`, recomputed whenever any
property changes — useful for surfacing derived/validation state in the Properties Bar (a documented
alternative to the non-existent dynamic enable/disable).

> Property display strings (names, descriptions, combo items) live in the **language file**, keyed
> by property `id` — `PluginProperty` itself defines no UI strings.

---

## Editor Lifecycle

**World plugin:** `constructor(sdkType, inst)` → `OnCreate()` → `OnPlacedInLayout(iLayoutView)`
(on placement) → `Draw(iRenderer, iDrawParams)` (repeated) → `OnPropertyChanged(id, value)` (on edits)
→ `Release()`.

**Object/single-global plugin:** `constructor` → `OnCreate()` → `OnPropertyChanged` → `Release()`.

**Behavior:** `constructor(sdkBehType, behInst)` → `OnAddedInEditor()` → `OnPropertyChanged(id, value)`.

Keep `OnPropertyChanged` and `Draw` light and deterministic — both can fire frequently.

---

## World Plugin Drawing & Textures

Declare a world plugin with `this._info.SetPluginType("world")` in `plugin.js`. Relevant info
flags: `SetIsResizable`, `SetIsRotatable`, `SetHasImage`, `SetSupportsEffects`,
`SetSupportsChangingSampling`, `SetMustPreDraw`.

A `Draw()` call must establish full renderer state before issuing quads (the renderer is stateful;
redundant state calls are cheaply discarded). Two common paths:

**Textured path:**

```js
this._inst.ApplyBlendMode(iRenderer);
iRenderer.SetTexture(texture, this._inst.GetActiveSampling());
iRenderer.SetColor(this._inst.GetColor());            // premultiplied RGBA
iRenderer.Quad3(this._inst.GetQuad(), this.GetTexRect());
```

**Solid-fill / placeholder path** (no texture yet, or error):

```js
iRenderer.SetAlphaBlendMode();                         // sample uses SetAlphaBlend()
iRenderer.SetColorFillMode();
iRenderer.SetColorRgba(...(this.HadTextureError() ? [0.25, 0, 0, 0.25] : [0, 0, 0.1, 0.1]));
iRenderer.Quad(this._inst.GetQuad());
```

Notes:
- Use `GetActiveSampling()` so the preview honours project/layer sampling (differs from `GetSampling()` when sampling is `"auto"`).
- `SetColor`/`GetColor` use **premultiplied** RGBA in `[0, 1]`. Avoid `unpremultiply()` (lossy).
- Render a placeholder while `GetTexture()` is `null` (async load) and a red tint when `HadTextureError()` is `true`.

**Image-backed texture + original size + double-tap:**

```js
GetTexture(animationFrame) {
    return super.GetTexture(animationFrame ?? this.GetObjectType().GetImage());
}
IsOriginalSizeKnown() { return true; }
GetOriginalSize() {
    const img = this.GetObjectType().GetImage();
    return [img.GetWidth(), img.GetHeight(), 0];       // [width, height, depth]
}
HasDoubleTapHandler() { return true; }
OnDoubleTap()         { this.GetObjectType().EditImage(); }
RendersToOwnZPlane()  { return true; }                 // 2D default
```

---

## IWebGLRenderer Reference

`iRenderer` (passed to `Draw`) provides high-level drawing; it may be backed by WebGL or WebGPU.
It is stateful — set blend mode, fill mode, colour, and texture (if texturing) before drawing.
This is especially relevant to line-renderer, mesh-trail, navmesh, and procedural addons that
want a live editor preview.

**State:**
- `SetAlphaBlendMode()` — normal premultiplied alpha blend. *(Sample name: `SetAlphaBlend()`.)*
- `SetBlendMode(mode)` — `"normal"`, `"additive"`, `"copy"`, `"destination-over"`, `"source-in"`, `"destination-in"`, `"source-out"`, `"destination-out"`, `"source-atop"`, `"destination-atop"`, `"lighten"`, `"darken"`, `"multiply"`, `"screen"`.
- `SetColorFillMode()` / `SetTextureFillMode()` / `SetSmoothLineFillMode()` — fill mode (solid colour / texture / smooth lines).
- `SetColor(SDK.Color)` / `SetColorRgba(r, g, b, a)` / `SetOpacity(a)` / `ResetColor()`.
- `SetTexture(texture, sampling = "auto")` — `sampling` is `"nearest"` | `"bilinear"` | `"trilinear"` | `"auto"`.
- `SetCurrentZ(z)` / `GetCurrentZ()` — Z used by 2D calls that omit Z (e.g. `Quad3`).
- `SetCullFaceMode(mode)` (`"none"` | `"back"` | `"front"`) / `SetFrontFaceWinding(mode)` (`"cw"` | `"ccw"`) — 3D.

**Quads & rects:**
- `Rect(SDK.Rect)` / `Rect2(left, top, right, bottom)`.
- `Quad(SDK.Quad)` / `Quad2(tlx, tly, trx, try_, brx, bry, blx, bly)`.
- `Quad3(quad, rect)` — quad + source `SDK.Rect` tex-coords. `Quad4(quad, texQuad)` — quad + source `SDK.Quad` tex-coords.
- `Quad3D(...)` / `Quad3D2(...)` — full XYZ quads with rect or quad tex-coords.

**Lines & polygons** (great for navmesh / path / shape previews):
- `Line(x1, y1, x2, y2)` / `TexturedLine(x1, y1, x2, y2, u, v)`.
- `LineRect(l, t, r, b)` / `LineRect2(SDK.Rect)` / `LineQuad(SDK.Quad)`.
- `ConvexPoly(pointsArray)` — alternating X, Y; ≥ 3 points (≥ 6 numbers).
- `PushLineWidth(w)` / `PopLineWidth()` and `PushLineCap("butt"|"square")` / `PopLineCap()` — always pop to restore.

**Meshes** (for line-renderer / mesh-trail editor previews):
- `DrawMesh(posArr, uvArr, indexArr, colorArr)` — one-shot; uploads every call.
- `CreateMeshData(vertexCount, indexCount, opts)` → `IMeshData` — persistent GPU buffers; far more efficient across frames. `opts.debugLabel` optional.
- `DrawMeshData(meshData, indexOffset, indexCount)` — draw a persistent mesh; counts/offsets should be multiples of 3.

`IMeshData` exposes typed arrays `positions` (3/vertex), `texCoords` (2/vertex), `colors`
(4/vertex), `indices` (indexed rendering is mandatory). After writing, you **must** mark data
changed before it uploads: `MarkDataChanged(bufferType, start, end)`,
`MarkAllVertexDataChanged(start, end)`, `MarkIndexDataChanged(start, end)`. Helper `FillColor(r,g,b,a)`
fills the colour buffer (does not mark changed). `Release()` frees CPU+GPU memory. Mark the
minimal changed range for performance.

**Dynamic textures** (procedural preview):
- `CreateDynamicTexture(width, height, opts)` → `IWebGLTexture`. `opts`: `wrapX`/`wrapY` (`"clamp-to-edge"` | `"repeat"` | `"mirror-repeat"`), `defaultSampling`, `pixelFormat` (`"rgba8"` default…), `mipMap`, `mipMapQuality`.
- `UpdateTexture(data, texture, opts)` — `data` may be `ImageBitmap`/`OffscreenCanvas`/`ImageData` (DOM image/video/canvas types are unavailable in worker mode). `opts.premultiplyAlpha` defaults `true`. Cannot resize — recreate to change size.
- `DeleteTexture(texture)` — only for your own dynamic textures; never delete engine-managed textures.

`CreateWebGLText()` → `IWebGLText` — see the text section. *(Sample name: `CreateRendererText()`.)*

---

## Geometry: Color, Quad, Rect

All three are constructible (`new SDK.Color()`, `new SDK.Quad()`, `new SDK.Rect()`); keep temp
instances at module scope to avoid per-draw allocation.

**`SDK.Color`** — RGBA floats in `[0, 1]`; the renderer expects **premultiplied** alpha.
`setRgb/setRgba/copy/copyRgb/clone/setR…setA/getR…getA/equals/equalsIgnoringAlpha/equalsRgb/equalsRgba/premultiply/unpremultiply` (avoid `unpremultiply()` — lossy).

**`SDK.Quad`** — four points `tl/tr/br/bl` (names only literal when unrotated; `try` is spelled
`try_`). Useful: `set/setRect/copy/setFromRect/setFromRotatedRect(rect, angle)`,
`getTlx…getBly`, `getBoundingBox(rect)`, `midX/midY`, and the hit-tests
`intersectsSegment(x1,y1,x2,y2)`, `intersectsQuad(quad)`, `containsPoint(x, y)` — handy for
editor hit-testing in cursor/collision/navmesh previews.

**`SDK.Rect`** — axis-aligned. `set/copy/clone/setLeft…setBottom/getLeft…getBottom`,
`width/height` (can be negative), `midX/midY`, `offset(x,y)`, `inflate/deflate(x,y)`,
`multiply/divide(x,y)`, `clamp(...)`, `normalize()`, `intersectsRect(rect)`, `containsPoint(x, y)`.

---

## Editor Text Rendering (IWebGLText)

Create text via `iRenderer.CreateWebGLText()`, cache it on the instance, and release it in `Release()`.

```js
// lazy create once:
this._webglText = iRenderer.CreateWebGLText();
this._webglText.SetFontSize(12);                                   // points
this._webglText.SetTextureUpdateCallback(() => iLayoutView.Refresh());  // async texture → redraw
```

In `Draw()`:

```js
const iLayoutView = iDrawParams.GetLayoutView();
this._webglText.SetSize(this._inst.GetWidth(), this._inst.GetHeight(), iLayoutView.GetZoomFactor());
const font = this._inst.GetPropertyValue("font");
this.GetProject().EnsureFontLoaded(font);                          // before rendering a project webfont
this._webglText.SetFontName(font);
this._webglText.SetText(this._inst.GetPropertyValue("text"));
const texture = this._webglText.GetTexture();                      // null on first (async) call
if (!texture) { /* draw placeholder */ return; }
// ApplyBlendMode → SetTexture(texture) → SetColor → Quad3(quad, this._webglText.GetTexRect())
```

Other `IWebGLText` methods: `SetLineHeight(px)`, `SetBold(b)`, `SetItalic(i)`, `SetColor(color|cssString)`,
`SetColorRgb(r,g,b)`, `SetHorizontalAlignment("left"|"center"|"right")`,
`SetVerticalAlignment("top"|"center"|"bottom")`, `SetWordWrapMode("word"|"character")`,
`GetTextWidth()/GetTextHeight()` (visible text box after wrap), `ReleaseTexture()` (free memory; recreated on next `GetTexture()`), `Release()`.

Always `EnsureFontLoaded(font)` before text rendering, or the font may be missing on first draw.

---

## Layout View & IDrawParams

`Draw(iRenderer, iDrawParams)`:
- `iDrawParams.GetLayoutView()` → `ILayoutView`.
- `iDrawParams.GetDt()` — **unreliable**: only a real delta-time while the Layout View is continuously scrolling (e.g. edge-drag); otherwise a dummy non-zero value. Don't animate from it.

`ILayoutView`:
- `GetProject()` → `IProject`; `GetLayout()` → `ILayout` (project model); `GetActiveLayer()` → `ILayer`.
- `GetZoomFactor()` — `1` = 100%.
- `LayoutToClientDevice(x, y)` → `[x, y]` device-pixel coords. *(Sample uses separate `LayoutToClientDeviceX/Y()`.)*
- `SetDeviceTransform(iRenderer)` / `SetDefaultTransform(iRenderer)` — switch to device-pixel rendering (for crisp pixel-snapped text), then restore.
- `Refresh()` — schedule a redraw next frame (don't refresh on a timer — wastes battery).
- `GetViewMode()` → `"2d"` | `"3d"`.

---

## Editor Object Model

What editor code can read and manipulate, reached from `this._inst` / `this._behaviorInstance` /
`GetProject()` / `GetLayoutView()`.

**`IProject`** (`this.GetProject()` or `ILayoutView.GetProject()`):
`GetName()`; lookups `GetObjectTypeByName`/`GetFamilyByName`/`GetObjectClassByName`,
`GetObjectClassBySID(sid)` (resolve an `"object"` property), `GetInstanceByUID(uid)`,
`GetProjectFileByName`/`GetProjectFileByExportPath`/`GetProjectFileBySID(sid)` (resolve a
`"projectfile"` property), `GetSystemType()`, `GetSingleGlobalObjectType(pluginId)`; creation
`CreateObjectType(pluginId, name)` (async; name may be auto-adjusted — check `GetName()` on the
result), `CreateFamily(name, members)`, `AddOrReplaceProjectFile(blob, path, kind)`,
`ShowImportAudioDialog(fileList)`; plus `EnsureFontLoaded(font)` and
`UndoPointChangeObjectInstancesProperty(instances, propertyId)` (accepts one `IObjectInstance` or
an array — call **before** changing a property).

**`IObjectType`** (`this.GetObjectType()`): `GetImage()` → `IAnimationFrame` (needs `SetHasImage`),
`EditImage()`, `GetAnimations()`, `AddAnimation(...)` (async), `GetAllInstances()`,
`CreateWorldInstance(layer)`, container helpers (`IsInContainer`/`GetContainer`/`CreateContainer`).

**`IObjectInstance`** (base of `IWorldInstance`): `GetProject()`, `GetObjectType()`, `GetUID()`,
`GetPropertyValue(id)` / `SetPropertyValue(id, value)` (colour properties use `SDK.Color`),
`GetExternalSdkInstance()`.

**`IWorldInstance`** (`this._inst` for world plugins) — the full editor handle:
`GetLayer()`, `GetLayout()`, `GetBoundingBox()` → `SDK.Rect`, `GetQuad()` → `SDK.Quad`,
`GetColor()` → premultiplied `SDK.Color` (tint × opacity in alpha), `SetOpacity`/`GetOpacity`,
`SetX/SetY/SetXY/GetX/GetY/GetXY`, `SetZ/GetZ`, `SetXYZ/GetXYZ`, `GetTotalZ()`,
`SetAngle/GetAngle` (radians), `SetWidth/SetHeight/SetSize/GetWidth/GetHeight`, `SetDepth/GetDepth`
(3D), `SetOriginX/SetOriginY/SetOrigin/GetOriginX/GetOriginY` (normalised `[0,1]`),
`ApplyBlendMode(iRenderer)`, `SetSampling/GetSampling`, `GetActiveSampling()`,
`SetMustMitigateZFighting()`.

**`IAnimationFrame`** (from `GetImage()` / animation frames; also represents a single image):
`GetWidth()`/`GetHeight()`, `GetTexRect()`, `GetCachedWebGLTexture()`, `async LoadWebGLTexture()`,
`GetBlob()`, `ReplaceBlobAndDecode(blob)` (async), origin (`GetOriginX/Y`, `SetOriginX/Y`),
image points (`GetImagePoints()`, `AddImagePoint(name, x, y)`), and **`GetCollisionPoly()`** →
`ICollisionPoly`. The collision poly exposes `GetPoints()` / `SetPoints(arr)` (alternating X,Y in
texture coords `[0,1]`, ≥ 3 points / ≥ 6 numbers), `Reset()`, `IsDefault()` — useful for
collision-aware addons that want the authored shape in the editor. Pass an `IAnimationFrame`
straight to `IWorldInstanceBase.GetTexture(frame)` for the default texture-loading path.

**`IBehaviorInstance`** (`this._behaviorInstance`): `GetProject()`, `GetObjectInstance()` (the host
`IObjectInstance`/`IWorldInstance`), `GetPropertyValue(id)` / `SetPropertyValue(id, value)`,
`GetExternalSdkInstance()`. **`IBehaviorType`** (`GetSdkBehaviorType()`'s model side via the
instance): `GetProject()`, `GetName()`.

**Model interfaces** (project tree, distinct from editor `ILayoutView`): `ILayout`
(`GetName`, `GetAllLayers()`, `GetEventSheet()` — may be `null`, `GetProject()`), `ILayer`
(`GetName`, `GetLayout`), `IProjectFile` (`GetName`, `GetPath()` = export path, `GetBlob()`,
`GetProject`), `IObjectClass`/`IFamily`/`IContainer` for grouping. `ILayout.GetAllLayers()`
returns **editor-model** layers — not the same objects as runtime layers.

---

## Cross-Addon Access (GetExternalSdkInstance)

To read another installed addon's editor instance, call `GetExternalSdkInstance()` on an
`IObjectInstance` (→ that plugin's `IInstanceBase` derivative) or `IBehaviorInstance` (→ that
behavior's `IBehaviorInstanceBase` derivative). It returns `null` for built-in addons (only
installed third-party addons expose their class).

Documented-surface-safety applies doubly here: **only call documented, supported methods** of the
other addon's class. Scirra explicitly warns that depending on undocumented features of a
third-party class may crash the editor on a future addon update, and that they will not support
such crashes — they direct affected users to the addon developer. Treat any cross-addon coupling
as a stable-API contract, and fail gracefully if `GetExternalSdkInstance()` returns `null` (addon
not installed) or the expected method is absent.

---

## Behavior Editor Features

Behavior editor instances are minimal and have no Layout View visual:

```js
const SDK = globalThis.SDK;
const BEHAVIOR_CLASS = SDK.Behaviors.MyCompany_MyBehavior;

BEHAVIOR_CLASS.Instance = class extends SDK.IBehaviorInstanceBase {
    constructor(sdkBehType, behInst) { super(sdkBehType, behInst); }
    OnAddedInEditor()  { /* one-time setup when the user adds the behavior */ }
    OnPropertyChanged(id, value) { /* validate / normalise — no enable/disable */ }
    // handles: this._behaviorInstance (IBehaviorInstance) / GetBehaviorInstance()
    //          this._sdkBehaviorType / GetSdkBehaviorType()
};
```

Because behaviors can't draw or disable properties in the editor, convey modes through clear
property names/descriptions, a single combo (mode) property, and runtime debugger output
(`_getDebuggerProperties()` in the runtime class).

---

## No Dynamic Property Enable/Disable

No documented editor base class exposes any method to enable/disable, show/hide, or grey out
individual Properties Bar entries — for plugins **or** behaviors. The property set is declared
once via `SetProperties([...])`. Do not rely on an undocumented `SetPropertyEnabled`-style call.

Documented ways to get mode-dependent UX:
1. A **combo (mode) property** that selects a behaviour set, with descriptions explaining which companion properties apply per mode.
2. **Group properties** (`"group"` type) to cluster related options clearly.
3. **Ignore irrelevant properties at runtime** based on the mode; the property still shows but has no effect, documented in the ACEs.
4. **Validation in `OnPropertyChanged`** — clamp/normalise, and reset companion properties to defaults when the mode changes.
5. For long strings, offer `SDK.UI.Util.ShowLongTextPropertyDialog(text, caption)` (the same dialog as `longtext` properties).
6. An **`"info"` property** with an `infoCallback` to surface a live read-only readout (recomputed whenever any property changes), and a **`"link"` property** (plugins only) to add a clickable Properties Bar action — neither can grey out other fields, but together they cover most "communicate state / trigger an action" needs.

---

## Property-Type Gotchas (SIDs)

| Property type | Stored value | Resolve via |
|---|---|---|
| `Object` (object picker) | SID, not a name | `GetProject().GetObjectClassBySID(sid)` — **not** `GetObjectTypeByName()` |
| `Project File` | SID, not a filename | `GetProject().GetProjectFileBySID(sid)`; resolved `IProjectFile.GetPath()` gives the export path (e.g. `"media/music.webm"`), not the Project Bar display path |

Using the raw property value as a name/path silently fails. (These resolvers are for **editor**
code. Note an `"object"` property is a SID at runtime too, but a `"projectfile"` property is a
relative export path at runtime — only editor-side is it a SID.)

---

## Editor-Integrated Plugins & Custom Importers

Some plugins modify the project from the editor (importers, setup wizards).

- **Drag-and-drop import (Custom Importer API):** register with
  `SDK.UI.Util.AddDragDropFileHandler(callback, opts)`. *(Note: the official docs are themselves inconsistent — the UI Util reference calls it `AddDragDropFileHandler`, while the IEventBlock guide prose calls it `AddDragDropFileImportHandler`. Confirm against your build.)*
  - `opts.isZipFormat` — `true` → callback runs only for zip drops; `file` is an `IZipFile`. `false` → `file` is a `Blob`.
  - `opts.toLayoutView` — `true` → only when a Layout View is open; the callback's `opts` then includes `layoutView` (an `ILayoutView`), `clientX/clientY`, and `layoutX/layoutY` (where to create instances).
  - Callback signature: `async function(filename, file, opts)`; resolve `true` if you imported it, `false` to let other handlers try.
- **Project entry point:** `ILayoutView.GetProject()` (or `this.GetProject()` from a plugin editor instance) → `IProject`.
- **Async project ops must be awaited:** `await project.CreateObjectType("Sprite", name)`, `AddAnimation()`, `AddFrame()`, `await frame.ReplaceBlobAndDecode(blob)`; zip reads `await zipFile.ReadJson(entry)` / `ReadBlob(entry)`.
- **Undo is mandatory for property changes:** call `UndoPointChangeObjectInstancesProperty(instance, propertyId)` **before** modifying instance properties, or the change is irreversible.

**Programmatic event creation.** Importers/setup tools can build events on a layout's event sheet:

```js
const eventSheet = layoutView.GetLayout().GetEventSheet();   // may be null
if (eventSheet) {
    const systemType = eventSheet.GetProject().GetSystemType();
    const eventBlock = await eventSheet.GetRoot().AddEventBlock();
    eventBlock.AddCondition(systemType, null, "on-start-of-layout");
    // eventBlock.AddAction(iObjectType, null, "set-position", [100, 200]);
}
```

`AddCondition(iObjectClass, null, cndId, params)` / `AddAction(iObjectClass, null, actId, params)`:
the second arg is reserved (pass `null`); `params` is an array matching the ACE's parameters
(strings are treated as expressions, so `"1+1"` is valid for a number param). Use the
`C3SDK_ListACEIDs` console helper to find condition/action IDs.

---

## Console Debugging Helpers

From the Construct browser console (F12), to discover IDs when writing editor/cross-addon code:

- `C3SDK_ListAddonIDs("plugin")` or `C3SDK_ListAddonIDs("behavior")` — list installed addon IDs (and editor names, which can differ from IDs for legacy reasons).
- `C3SDK_ListACEIDs(addonType, addonId, aceType)` — list action/condition/expression IDs, e.g. `C3SDK_ListACEIDs("plugin", "Sprite", "actions")`. `aceType` is `"actions"` | `"conditions"` | `"expressions"`.

Use these to confirm a real plugin/ACE ID before referencing another addon, and to check which
renderer/text method names your Construct build actually exposes when the reference and samples differ.

---

## Sample-vs-Reference Naming Drift

Scirra's shipped SDK samples occasionally use a different method name than the reference docs
(likely aliases or version skew). Where they differ, prefer the **reference** name and verify
against your build via the console helpers above.

| Reference name | Sample name | Used in |
|---|---|---|
| `SetAlphaBlendMode()` | `SetAlphaBlend()` | renderer placeholder fill |
| `CreateWebGLText()` | `CreateRendererText()` | editor text |
| `IsOriginalSizeKnown()` + `GetOriginalSize()` → `[w, h, depth]` | `GetOriginalWidth()` + `GetOriginalHeight()` | world-plugin size |
| `LayoutToClientDevice(x, y)` → `[x, y]` | `LayoutToClientDeviceX(x)` / `LayoutToClientDeviceY(y)` | pixel snapping |
| `SDK.UI.Util.AddDragDropFileHandler(...)` | `AddDragDropFileImportHandler(...)` | custom importer (both names appear in official docs) |

---

## Use Cases

- **World preview in Layout View** (plugin only): draw procedural content, markers, or shapes in `Draw()` using quads/lines/meshes; use lightweight paths for responsiveness.
- **Texture-backed placeholder & error state** (plugin only): `GetTexture()`/`GetTexRect()` for the image; solid placeholder while `null`; red tint when `HadTextureError()`.
- **Double-tap to edit** (plugin only): `HasDoubleTapHandler()` → `true`, `OnDoubleTap()` → `EditImage()` or custom tooling.
- **One-time setup**: plugins `OnCreate()`; behaviors `OnAddedInEditor()`.
- **Validation / auto-correction**: clamp or normalise related values in `OnPropertyChanged`.
- **Mode UX without enable/disable**: combo property + descriptions; reset companions on mode change.
- **Custom importer**: `SDK.UI.Util.AddDragDropFileHandler` + async `IProject` ops with undo points.
- **Mesh/line preview** (line-renderer, mesh-trail, navmesh): `CreateMeshData`/`DrawMeshData`, `ConvexPoly`, `Line`/`LineQuad`, `PushLineWidth`.

---

## Common Mistakes

1. Calling world-plugin-only methods on object plugins or behaviors (`Draw`, texture hooks, `this._inst`).
2. **Accessing or modifying the editor DOM** (HTML/CSS/event handlers) — unsupported, may break permanently, and will be blocked by future editor sandboxing.
2. Using `OnCreate()` for behavior setup — behaviors use `OnAddedInEditor()`.
3. Relying on an undocumented dynamic property enable/disable API.
4. Mixing runtime base classes (`C3.…`/`ISDK…`) into editor classes (`SDK.I…`).
5. Reading `Object`/`Project File` property values as names/paths instead of resolving the SID.
6. Heavy work in `OnPropertyChanged` or `Draw`; per-draw allocation of `SDK.Quad`/`SDK.Rect`.
7. Forgetting `EnsureFontLoaded(font)` before editor text rendering.
8. Forgetting `UndoPointChangeObjectInstancesProperty(...)` before an editor-integrated property change.
9. Animating from `iDrawParams.GetDt()` (unreliable outside continuous scrolling).
10. Not releasing `IWebGLText` / `IMeshData` / dynamic textures in `Release()`.
11. Forgetting to mark `IMeshData` buffers changed (`MarkDataChanged`) — nothing uploads to the GPU.

---

## Implementation Templates

> Raw SDK v2 form. In CAW, place the same method bodies in `src/editor/instance.js`.

### World plugin editor instance

```js
const SDK = globalThis.SDK;
const PLUGIN_CLASS = SDK.Plugins.MyCompany_MyPlugin;

PLUGIN_CLASS.Instance = class extends SDK.IWorldInstanceBase {
    constructor(sdkType, inst) { super(sdkType, inst); this._webglText = null; }
    Release() { if (this._webglText) { this._webglText.Release(); this._webglText = null; } }
    OnCreate() { this._inst.SetOrigin(0, 0); }
    OnPlacedInLayout(iLayoutView) { this._inst.SetSize(64, 64); }
    Draw(iRenderer, iDrawParams) {
        const texture = this.GetTexture(this.GetObjectType().GetImage());
        if (texture) {
            this._inst.ApplyBlendMode(iRenderer);
            iRenderer.SetTexture(texture, this._inst.GetActiveSampling());
            iRenderer.SetColor(this._inst.GetColor());
            iRenderer.Quad3(this._inst.GetQuad(), this.GetTexRect());
        } else {
            iRenderer.SetAlphaBlendMode();
            iRenderer.SetColorFillMode();
            iRenderer.SetColorRgba(...(this.HadTextureError() ? [0.25, 0, 0, 0.25] : [0, 0, 0.1, 0.1]));
            iRenderer.Quad(this._inst.GetQuad());
        }
    }
    GetTexture(animationFrame) { return super.GetTexture(animationFrame ?? this.GetObjectType().GetImage()); }
    IsOriginalSizeKnown() { return true; }
    GetOriginalSize() { const i = this.GetObjectType().GetImage(); return [i.GetWidth(), i.GetHeight(), 0]; }
    HasDoubleTapHandler() { return true; }
    OnDoubleTap() { this.GetObjectType().EditImage(); }
    RendersToOwnZPlane() { return true; }
    OnPropertyChanged(id, value) { /* validate / react */ }
    LoadC2Property(name, valueString) { return false; }
};
```

### Object / single-global plugin editor instance

```js
const SDK = globalThis.SDK;
const PLUGIN_CLASS = SDK.Plugins.MyCompany_MyPlugin;

PLUGIN_CLASS.Instance = class extends SDK.IInstanceBase {
    constructor(sdkType, inst) { super(sdkType, inst); }
    Release() {}
    OnCreate() { /* editor-side setup */ }
    OnPropertyChanged(id, value) { /* validate / react */ }
    LoadC2Property(name, valueString) { return false; }
};
```

### Behavior editor instance

```js
const SDK = globalThis.SDK;
const BEHAVIOR_CLASS = SDK.Behaviors.MyCompany_MyBehavior;

BEHAVIOR_CLASS.Instance = class extends SDK.IBehaviorInstanceBase {
    constructor(sdkBehType, behInst) { super(sdkBehType, behInst); }
    OnAddedInEditor() { /* one-time setup when user adds the behavior */ }
    OnPropertyChanged(id, value) { /* validate / normalise — no enable/disable */ }
};
```

---

## Pre-Commit Checklist

- [ ] Correct editor base class: `IWorldInstanceBase` (world), `IInstanceBase` (object/single-global), `IBehaviorInstanceBase` (behavior).
- [ ] Behavior setup uses `OnAddedInEditor()`, not `OnCreate()`; behavior handle is `this._behaviorInstance`.
- [ ] No world-plugin-only API on object plugins or behaviors (`Draw`, texture hooks, `this._inst`).
- [ ] No reliance on undocumented capabilities (no dynamic property enable/disable).
- [ ] No runtime base classes or `this.runtime` in editor code.
- [ ] No access to or modification of the editor DOM (HTML/CSS/event handlers) anywhere in editor scripts.
- [ ] `Object`/`Project File` properties resolved via `GetObjectClassBySID`/`GetProjectFileBySID`.
- [ ] `OnPropertyChanged` and `Draw` are light; temp `SDK.Quad`/`SDK.Rect`/`SDK.Color` reused, not allocated per draw.
- [ ] `EnsureFontLoaded(font)` before editor text rendering.
- [ ] `IMeshData` buffers marked changed after writes; `IWebGLText`/`IMeshData`/dynamic textures released in `Release()`.
- [ ] Editor-integrated property changes preceded by `UndoPointChangeObjectInstancesProperty(...)`; async `IProject` ops awaited.
- [ ] Property IDs match `SetProperties([...])` / `config.caw.js` exactly.
- [ ] `addon.json`: `sdk-version: 2`, appropriate `min-construct-version`, editor scripts in `editor-scripts`.
- [ ] Verified ambiguous method names (see naming drift) against the target Construct build via `C3SDK_List*` console helpers.

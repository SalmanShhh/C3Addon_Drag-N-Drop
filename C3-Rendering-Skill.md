# Construct 3 Addon Development — Rendering Skill (Standalone)

Practical, field-verified guidance for drawing in Construct 3 addons with the CAW framework: the two renderers and their casing split, the persistent state model, primitives and meshes, textures, the `HasImage` pipeline, effects, coordinate transforms, and editor-vs-runtime draw correctness.

This skill is rendering-focused. For broader SDK lifecycle/ACE guidance see the main skills doc; for distortion math see the Mesh Distortion skill; for editor lifecycle see the Editor Features skill.

---

## Table of Contents

1. Purpose and Scope
2. The Two Renderers (the #1 gotcha)
3. Where Drawing Happens (lifecycle hooks)
4. Persistent Renderer State Model
5. Blend Modes
6. Fill Modes and Color
7. Premultiplied Alpha
8. Drawing Primitives
9. Drawing Meshes — `drawMesh()`
10. GPU-Resident Meshes — `createMeshData()` / `drawMeshData()`
11. Textures and the Texture Manager
12. The `HasImage` Texture Pipeline
13. Tiling
14. Effects and `MustPreDraw`
15. Coordinate Transforms, Z, and Culling
16. Editor-Side Drawing (Layout View)
17. Plugin Info Flags That Affect Rendering
18. Performance and Stability
19. Common Failure Modes and Fixes
20. Reference Patterns
21. Pre-Commit Checklist

---

## 1. Purpose and Scope

Use this skill when an addon draws anything: sprites, meshes, lines, custom shapes, textured strokes, procedural visuals, or editor previews.

Goals:
- Get pixels on screen at runtime **and** a correct preview in the Layout View.
- Use the right renderer surface and method casing for each side.
- Handle textures, tiling, color, opacity, blend modes, and effects correctly.
- Keep premultiplied-alpha math right so colors are not too bright/dark.

Non-goals:
- Writing raw WebGL/WebGPU (the renderer abstracts it).
- Custom shader authoring (that is the effects/addon-effect pipeline, separate).

---

## 2. The Two Renderers (the #1 gotcha)

There are **two different renderer interfaces**, and their method names use **different casing**. Mixing them up is the single most common rendering bug.

| | Runtime | Editor (Layout View) |
|---|---|---|
| Interface | `IRenderer` | `IWebGLRenderer` |
| Where | `src/runtime/instance.js` → `_draw(renderer)` | `src/editor/instance.js` → `Draw(iRenderer, iDrawParams)` |
| Casing | **camelCase** — `setTexture`, `drawMesh`, `setColorRgba`, `rect2` | **PascalCase** — `SetTexture`, `DrawMesh`, `SetColorRgba`, `Rect2` |
| Geometry types | `DOMRect`, `DOMQuad` | `SDK.Rect`, `SDK.Quad` |

> **⚠ Wrong casing silently no-ops.** A missing method is just `undefined`; calling `renderer.SetTexture?.(...)` in the runtime does nothing and throws no error. Classic symptom: the plugin previews correctly in the editor but is **invisible at runtime** (or vice-versa). When something won't draw, check casing first.

Otherwise the two APIs are analogous — once you know one, you know the other with the case flipped.

---

## 3. Where Drawing Happens (lifecycle hooks)

### Runtime — `ISDKWorldInstanceBase`

```js
_draw(renderer) {
  // renderer: IRenderer (camelCase). Called only when the instance is
  // on-screen and visible. Set ALL state you rely on before each draw.
}

_drawGL(renderer) {
  // Optional secondary pass after _draw() in some paths. Most plugins don't need it.
}
```

- `_draw()` and ticking are independent — a plugin can tick without drawing and vice-versa.
- When visual state changes **outside** a tick (e.g. a property/ACE changes appearance), call `this.runtime.sdk.updateRender()` so a redraw is scheduled. Do **not** call it unconditionally every frame.

### Editor — `IWorldInstanceBase` (world plugins only)

```js
Draw(iRenderer, iDrawParams) {
  // iRenderer: IWebGLRenderer (PascalCase)
  // iDrawParams: GetDt(), GetLayoutView()   ← that's all it has (see §16)
}
```

Behaviors and object/global plugins do **not** draw. Only world plugins.

---

## 4. Persistent Renderer State Model

Both renderers hold **persistent state**. They do not reset between calls. A draw uses whatever state is currently set, so set everything you depend on before each draw sequence:

1. **Blend mode**
2. **Fill mode** (color / texture / smooth-line)
3. **Color** (RGBA 0–1; alpha is opacity in texture fill mode)
4. **Texture** (only used in texture fill mode)

```js
// runtime
renderer.setAlphaBlendMode();
renderer.setTextureFillMode();
renderer.setTexture(myTexture);
renderer.resetColor();          // opaque white (1,1,1,1)
renderer.drawMesh(pos, uv, idx, col);
```

> Redundant state calls are cheap — the renderer discards no-op changes. Prefer explicit, complete state over assuming leftover state.

---

## 5. Blend Modes

```js
// runtime
renderer.setAlphaBlendMode();          // premultiplied alpha — the default/common choice
renderer.setBlendMode("additive");     // see list below
```

Valid `setBlendMode` strings: `"normal"` (== `setAlphaBlendMode()`), `"additive"`, `"copy"`, `"destination-over"`, `"source-in"`, `"destination-in"`, `"source-out"`, `"destination-out"`, `"source-atop"`, `"destination-atop"`, `"lighten"`, `"darken"`, `"multiply"`, `"screen"`.

Editor equivalent: `SetAlphaBlendMode()` / `SetBlendMode(mode)`.

> **Blend mode + effects/MustPreDraw:** when `MustPreDraw` is set, Construct composites your `_draw()` output to screen using the instance's native `this.blendMode`. In that case draw geometry with `setAlphaBlendMode()` **only** and let `this.blendMode` carry the user's blend choice — setting a non-normal blend inside `_draw()` double-applies it. See §14.

---

## 6. Fill Modes and Color

```js
// runtime
renderer.setColorFillMode();      // solid color (current color), no texture
renderer.setTextureFillMode();    // texture × current color; current alpha = opacity
renderer.setSmoothLineFillMode(); // anti-aliased lines

renderer.setColor([r, g, b, a]);  // array, 0–1
renderer.setColorRgba(r, g, b, a);// direct args, 0–1
renderer.setOpacity(o);           // set alpha only
renderer.resetColor();            // (1,1,1,1)
```

Editor: `SetColorFillMode()`, `SetTextureFillMode()`, `SetSmoothLineFillMode()`, `SetColor(SDK.Color)`, `SetColorRgba(...)`, `SetOpacity(o)`, `ResetColor()`.

Instance appearance you typically fold into the draw (runtime, from `ISDKInstanceBase`):

```js
this.opacity      // 0–1
this.colorRgb     // [r, g, b] 0–1 — color filter/tint
this.blendMode    // string
this.sampling     // "auto" | "nearest" | "bilinear" | "trilinear"
this.effects      // IEffectInstance[]
```

A clean model: apply **master opacity + color filter once** as the current color, and carry per-vertex/per-point color in the vertex color array (premultiplied):

```js
const op = clamp01(this.opacity ?? 1);
const [r, g, b] = this.colorRgb ?? [1, 1, 1];
renderer.setColorRgba(r * op, g * op, b * op, op);  // premultiplied current color
```

---

## 7. Premultiplied Alpha

The renderer uses **premultiplied alpha**. Two consequences that cause "too bright / too dark" bugs:

1. **Per-vertex color arrays must be premultiplied** — store `[r·a, g·a, b·a, a]`, not straight `[r, g, b, a]`.
2. **Some APIs return premultiplied, some straight** — e.g. `IWorldInstance.GetColor()` returns premultiplied (tint × opacity in alpha). Check per API.

Math that stays consistent (texture fill mode):

```
result = texture × currentColor × vertexColor
```

If `currentColor = (r·op, g·op, b·op, op)` and `vertexColor` is the premultiplied per-point color, opacity and tint apply exactly once and the premultiplied invariant is preserved.

---

## 8. Drawing Primitives

Runtime (camelCase) — editor names are the PascalCase equivalents:

```js
// Rectangles
renderer.rect(domRect);
renderer.rect2(left, top, right, bottom);

// Quads (DOMQuad runtime / SDK.Quad editor)
renderer.quad(quad);
renderer.quad2(tlx, tly, trx, try_, brx, bry, blx, bly);
renderer.quad3(quad, rcTex);             // quad + rect UV source  ← key call for textured quads
renderer.quad4(quad, texQuad);           // quad + quad UV source
renderer.quad5(quad, texQuad, colorArr); // + Float32Array[16] per-vertex RGBA (runtime)

// 3D quads (each point has X,Y,Z)
renderer.quad3D(...rcTex);
renderer.quad3D2(...texQuad);
renderer.quad3D3(...texQuad, colorArr);

// Lines
renderer.line(x1, y1, x2, y2);
renderer.texturedLine(x1, y1, x2, y2, u, v);
renderer.lineRect(left, top, right, bottom);
renderer.lineRect2(rect);
renderer.lineQuad(quad);
renderer.pushLineWidth(w);  renderer.popLineWidth();
renderer.pushLineCap("butt"); renderer.popLineCap();   // "butt" | "square"

// Convex polygon — [x0,y0, x1,y1, ...], length even & ≥ 6
renderer.convexPoly(pointsArray);
```

> `quad3()` is the standard call for a deformed/rotated textured quad: a `DOMQuad`/`SDK.Quad` for world-space corners + a `DOMRect`/`SDK.Rect` for the UV source. **Always use the real tex rect** (§11), never assume `0,0,1,1`.

---

## 9. Drawing Meshes — `drawMesh()`

Draw arbitrary textured triangles in one call. **Array formats are strict and bite often:**

```js
renderer.drawMesh(posArr, uvArr, indexArr, colorArr?)
// posArr   Float32Array  [x, y, z, x, y, z, ...]   ← 3 components/vertex (z = 0 for 2D)
// uvArr    Float32Array  [u, v, u, v, ...]         ← 2 components/vertex
// indexArr Uint16Array   [i, j, k, ...]            ← triangles, length % 3 === 0, ≤ 64k verts
// colorArr Float32Array  [r, g, b, a, ...]         ← optional, 4/vertex, PREMULTIPLIED
```

> **Passing 2-component positions `[x, y]` produces garbage geometry** — the runtime reads 3 floats per vertex. This and `Uint32Array` indices (must be `Uint16Array`) are the two most common "my mesh is wrong/invisible" causes.

> **Layer Z elevation is NOT applied automatically.** Offset Z yourself if you need it.

The editor `DrawMesh(posArr, uvArr, indexArr, colorArr)` takes the same layout. **Standardize your mesh builder on 3-component positions + `Uint16Array` indices** so one buffer feeds both the runtime and editor preview.

Minimal textured-mesh draw:

```js
renderer.setAlphaBlendMode();
renderer.setTextureFillMode();
renderer.resetColor();
renderer.setTexture(myTexture);
renderer.drawMesh(posArr, uvArr, indexArr);
```

---

## 10. GPU-Resident Meshes — `createMeshData()` / `drawMeshData()`

`drawMesh()` re-uploads all vertex data every call — fine for small/dynamic meshes, wasteful for large/stable ones. For those, keep buffers on the GPU with `IMeshData`:

```js
const meshData = renderer.createMeshData(vertexCount, indexCount, { debugLabel: "water" });

// Fill typed arrays:
meshData.positions   // Float32Array, 3 × vertexCount  (x, y, z)
meshData.texCoords   // Float32Array, 2 × vertexCount  (u, v)
meshData.colors      // Float16Array | Float32Array, 4 × vertexCount (premultiplied; type varies by device)

// MUST mark changed ranges before drawing, or the GPU buffers stay empty:
meshData.markDataChanged();                 // or markAllVertexDataChanged() + markIndexDataChanged()

renderer.drawMeshData(meshData);                          // draw all
renderer.drawMeshData(meshData, indexOffset, indexCount); // draw a range (indexCount % 3 === 0)
```

Notes:
- Vertex/index counts are **fixed at creation** — to resize, create a new `IMeshData`.
- Supports **> 64k vertices** (unlike `drawMesh()`).
- `colors` may be `Float16Array` on supporting hardware — write 0–1 floats regardless.
- Only edit the touched ranges and mark just those for best performance.

---

## 11. Textures and the Texture Manager

```js
// From an image's IImageInfo (object image, animation frame, etc.)
const tex = await renderer.loadTextureForImageInfo(imageInfo, opts);  // async load
renderer.getTextureForImageInfo(imageInfo);    // → ITexture | null (sync, after load)
renderer.releaseTextureForImageInfo(imageInfo);

// From raw image data
const tex = await renderer.createStaticTexture(imageElement, opts);   // immutable
const tex = renderer.createDynamicTexture(width, height, opts);       // updatable
renderer.updateTexture(data, tex, opts);   // replace content (must match size; can't resize)
renderer.deleteTexture(tex);               // ONLY for textures you created — never Construct's

// opts:
// wrapX / wrapY: "clamp-to-edge" | "repeat" | "mirror-repeat"
// defaultSampling: "nearest" | "bilinear" | "trilinear"  (default "trilinear")
// mipMap: boolean (default true)
// (createDynamicTexture also: pixelFormat "rgba8" | "rgb8" | ...)
```

> **`getTextureForImageInfo()` is sync and returns `null` until `loadTextureForImageInfo()` resolves.** Draw a placeholder (or color-fill fallback) while null.

> **Spritesheeting:** Construct packs images into atlases, so an image's texture coordinates are usually a **sub-rect**, not the full texture. Always sample using the image's tex rect — never assume `[0,1]`. Editor: `this.GetTexRect()`. Runtime: from the `IImageInfo` / your loaded source rect. Exception: `IsTiled` images are not sheeted (§13).

Editor side uses the world-instance helpers instead of the texture manager directly:

```js
const tex = this.GetTexture(this._inst.GetFirstAnimationFrame()); // async; null while loading
const texRect = this.GetTexRect();                                // SDK.Rect, valid once tex loaded
this.HadTextureError();                                           // true if last load failed
```

---

## 12. The `HasImage` Texture Pipeline

When a world plugin sets `HasImage: true`, it gets an **editable object image** (edited in the Animations Editor like a Sprite frame). Wiring it end-to-end:

### Editor (`src/editor/instance.js`)

```js
// Draw the image in the Layout View
Draw(iRenderer, iDrawParams) {
  const frame = this._inst.GetFirstAnimationFrame();
  const texture = frame ? this.GetTexture(frame) : null;
  if (!texture) {
    // placeholder while loading / on error
    iRenderer.SetColorFillMode();
    iRenderer.SetColorRgba(this.HadTextureError() ? 1 : 0.5, 0.5, 0.5, 0.4);
    iRenderer.Quad(this._inst.GetQuad());
    return;
  }
  iRenderer.SetTextureFillMode();
  iRenderer.SetTexture(texture);
  iRenderer.Quad3(this._inst.GetQuad(), this.GetTexRect());
}

// Double-click / "Edit" → open the image editor, like a Sprite
HasDoubleTapHandler() { return true; }
OnDoubleTap()         { this._inst.GetObjectType().EditImage(); }

// Percentage-size shortcuts in the Properties Bar
IsOriginalSizeKnown() { return !!this._inst.GetFirstAnimationFrame(); }
GetOriginalWidth()    { return this._inst.GetFirstAnimationFrame()?.GetWidth()  ?? 0; }
GetOriginalHeight()   { return this._inst.GetFirstAnimationFrame()?.GetHeight() ?? 0; }
```

### Runtime (`src/runtime/instance.js`)

```js
// Construct calls these lifecycle hooks itself — do not call them yourself.
async _loadTextures(renderer) {
  const imageInfo = this._getImageInfo();
  if (!imageInfo) return;
  this._texture = await renderer.loadTextureForImageInfo(imageInfo, { sampling });
}

_releaseTextures(renderer) {
  const imageInfo = this._getImageInfo();
  if (imageInfo) renderer.releaseTextureForImageInfo(imageInfo);
  this._texture = null;
}

_draw(renderer) {
  const texture = this._texture ?? renderer.getTextureForImageInfo(this._getImageInfo());
  if (texture) {
    renderer.setTextureFillMode();
    renderer.setTexture(texture);
  } else {
    renderer.setColorFillMode();   // visible fallback before the image loads/is painted
  }
  renderer.drawMesh(pos, uv, idx, col);   // or quad3(this.getBoundingQuad(), texRect)
}

_getImageInfo() {
  // The accessor name is not formally documented; use a fallback chain.
  return this.objectType?.getImageInfo?.()
      ?? this.getCurrentImageInfo?.()
      ?? this.getImageInfo?.()
      ?? null;
}
```

Notes:
- `IImageInfo` comes from the **object type**, not the renderer.
- A `HasImage` plugin with no default image URL starts with a **blank/transparent** frame — keep a color-fill fallback so it's visible before the user paints/imports content.
- This CAW build framework does not copy an `info.defaultImageUrl` file into the package automatically; ship a default image through `files.fileDependencies` if you need one.

---

## 13. Tiling

To repeat a texture across geometry (ropes, beams, scrolling backgrounds, conveyor belts):

1. Set `IsTiled: true` in the plugin info flags. Construct then gives the object its **own non-spritesheeted texture with repeat wrap**, and the tex rect is effectively the full `[0,1]` image.
2. Let **UVs exceed `[0,1]`** — e.g. `u = distanceAlongStroke / tileLength`. The GPU's repeat wrap tiles automatically.
3. **Do not manually wrap UVs** with `frac()` / `u - Math.floor(u)`. Manual wrapping breaks across triangle edges: a triangle spanning `u = 0.9 → 1.1` would get `0.9` and `0.1` and sample the texture backwards across that span.
4. Animate by adding a scrolling offset to `u` over time.

Without `IsTiled`, the image is sheeted into an atlas sub-rect and UVs outside that rect bleed into neighbouring atlas images — so repeat tiling only works with `IsTiled`.

---

## 14. Effects and `MustPreDraw`

To let users add effects (shaders) to a world plugin:

```js
// config / IPluginInfo
SupportsEffects: true,
MustPreDraw: true,   // REQUIRED when drawing is not equivalent to a Sprite quad (e.g. a mesh)
```

How it works with `MustPreDraw`:
- Construct pre-renders your `_draw()` output to an **offscreen surface** sized to the instance's bounds.
- It then composites that surface to screen applying the instance's **effect chain**, **`this.blendMode`**, and (depending on path) opacity.

Implications for `_draw()`:
- Draw geometry with **`setAlphaBlendMode()` only**. The visible blend is `this.blendMode`, applied at composite — setting a non-normal blend inside `_draw()` double-applies it.
- Per-instance effect parameters are reachable at runtime via `this.effects` (`IEffectInstance[]`): `effect.isActive`, `effect.setParameter(i, v)`, `effect.getParameter(i)`.

> Rule of thumb from the SDK: "If using effects and drawing is not equivalent to Sprite, `SetMustPreDraw(true)`." A custom mesh/stroke/shape is not Sprite-equivalent, so set it.

---

## 15. Coordinate Transforms, Z, and Culling

```js
// Coordinate space (runtime)
renderer.setLayerTransform(layer);   // default — draw in the given ILayer's coordinates
renderer.setDeviceTransform();       // device pixels relative to screen (pixel-perfect overlays)

// Z (for 2D draws without explicit Z)
renderer.setCurrentZ(z);
renderer.getCurrentZ();

// Backface culling / winding (3D and mirrored content)
renderer.setCullFaceMode("none");    // "none" (default) | "back" | "front"
renderer.setFrontFaceWinding("cw");  // "cw" (default, matches Construct) | "ccw"
```

- Default cull mode is **`"none"`** precisely because mirrored/flipped sprites otherwise show a back face. For 2D distorted/mirrored quads, keep it `"none"` unless you intentionally cull.
- If geometry vanishes only at certain bends/flips, suspect a **winding/cull mismatch** — disable culling or rebuild indices with consistent winding.
- Editor draws in layout coordinates by default; `ILayoutView.SetDeviceTransform(iRenderer)` / `SetDefaultTransform(iRenderer)` switch the editor renderer between device-pixel and layout space.

---

## 16. Editor-Side Drawing (Layout View)

Editor previews are world-plugin only. Key correctness points:

### Position from the instance, not from draw params

```js
Draw(iRenderer, iDrawParams) {
  const quad = this._inst.GetQuad();        // SDK.Quad, final layout coords incl. parent hierarchy
  // const rect = this._inst.GetBoundingBox(); // SDK.Rect, axis-aligned (no rotation)
}
```

> **⚠ `iDrawParams.GetLayoutRect()` does not exist** on the current `IDrawParams` (which has only `GetDt()` and `GetLayoutView()`). Old snippets use it; today it returns `undefined` and any preview built from it collapses to layout origin **(0, 0)** instead of the instance. Always position from `this._inst.GetQuad()` / `GetBoundingBox()`.

- `GetQuad()` already includes the **scene-graph parent transform**, so a parented instance previews in the right place automatically — no manual parent math needed.
- `IDrawParams.GetLayoutView()` → `ILayoutView` for refresh/zoom/transform: `Refresh()` (schedule redraw — avoid spamming), `GetZoomFactor()`, `SetDeviceTransform(iRenderer)` / `SetDefaultTransform(iRenderer)`.

### Animated previews

Advance your own phase each `Draw`, and only schedule another frame when allowed:

```js
const layoutView = iDrawParams.GetLayoutView();
if (layoutView?.IsAnimationEnabled?.() || this._inst.IsSelected?.()) {
  layoutView.Refresh();   // request next frame; don't refresh unconditionally (battery/CPU)
}
```

### Placeholders and errors

Render a neutral placeholder while a texture is `null`, and a red-tinted one when `HadTextureError()` is true. Use `GetTexRect()` for UVs once the texture loads.

---

## 17. Plugin Info Flags That Affect Rendering

Set in `config.caw.js` `info.Set` (CAW maps each key to `IPluginInfo.Set<Key>()`):

| Flag | Effect |
|---|---|
| `HasImage` | Object gets an editable image; enables `GetTexture`/`GetTexRect` and `_loadTextures` |
| `IsTiled` | Non-spritesheeted texture with repeat wrap — required for UV tiling (§13) |
| `SupportsColor` | Enables `this.colorRgb` tint + color in the Properties Bar |
| `SupportsEffects` | Lets users add effects; pair with `MustPreDraw` for non-Sprite draws (§14) |
| `MustPreDraw` | Pre-render `_draw()` to offscreen before the effect chain |
| `SupportsZElevation` | Honor layer/instance Z elevation |
| `Is3D` | Enables depth/3D-quad rendering paths |
| `IsRotatable` / `IsResizable` | Whether angle/size are user-editable (affects `GetQuad`) |

---

## 18. Performance and Stability

- **Stop ticking when idle** (`_setTicking(false)`); only rebuild meshes when dirty or time-driven.
- **Reuse arrays** — avoid allocating new typed arrays every frame. For large/stable meshes use `IMeshData` and update only changed ranges.
- **`drawMesh()` re-uploads everything each call** — prefer `drawMeshData()` for big persistent meshes.
- **Only redraw on visual change** — call `runtime.sdk.updateRender()` when non-tick state changes appearance; don't call it blindly.
- **Set complete state per draw** — never rely on leftover renderer state from a previous instance's draw.
- **Guard texture access** — `getTextureForImageInfo()` can be `null`; always have a fallback.
- Editor: avoid unnecessary `ILayoutView.Refresh()` (timers, every-frame refresh) — it burns battery/CPU.

---

## 19. Common Failure Modes and Fixes

1. **Invisible at runtime, fine in editor (or reverse)** → renderer method casing mismatch (`SetTexture` vs `setTexture`). Wrong casing silently no-ops. (§2)
2. **Garbage / collapsed mesh** → positions passed as 2-component `[x,y]` instead of 3-component `[x,y,z]`, or indices as `Uint32Array` instead of `Uint16Array`. (§9)
3. **Preview stuck at layout (0,0)** → built from `iDrawParams.GetLayoutRect()` (doesn't exist). Use `this._inst.GetQuad()`. (§16)
4. **Wrong texture region / atlas bleeding** → assumed UV `[0,1]` instead of the real tex rect; use `GetTexRect()` / the image's source rect. (§11)
5. **Tiling samples backwards at seams** → manual UV wrapping (`frac`). Use `IsTiled` + repeat wrap and let UVs exceed 1. (§13)
6. **Colors too bright/dark, halos** → per-vertex colors not premultiplied, or opacity/tint applied twice. Premultiply and apply master opacity/tint once. (§7)
7. **Blend mode wrong with effects** → set a non-normal blend in `_draw()` under `MustPreDraw`. Draw normal; drive blend via `this.blendMode`. (§14)
8. **Triangles flicker/disappear when bent** → winding flips with culling enabled. Set `setCullFaceMode("none")` or fix winding. (§15)
9. **Mesh draws empty after `createMeshData`** → forgot `markDataChanged()` before drawing. (§10)
10. **Texture null on first frames** → `getTextureForImageInfo()` is sync and returns null until the async load resolves; draw a placeholder. (§11)

---

## 20. Reference Patterns

### 20.1 Runtime textured stroke/mesh (`_draw`)

```js
_draw(renderer) {
  const mesh = this._meshData;
  if (!mesh?.vertexCount) return;

  renderer.setAlphaBlendMode();                 // MustPreDraw composites with this.blendMode

  const op = clamp01(this.opacity ?? 1);
  const [cr, cg, cb] = this.colorRgb ?? [1, 1, 1];

  const texture = this._texture ?? renderer.getTextureForImageInfo(this._getImageInfo());
  if (texture) {
    renderer.setTextureFillMode();
    renderer.setTexture(texture, this.sampling ?? "auto");
  } else {
    renderer.setColorFillMode();
  }
  renderer.setColorRgba(cr * op, cg * op, cb * op, op);   // premultiplied current color
  renderer.drawMesh(mesh.positions, mesh.uvs, mesh.indices, mesh.colors);
}
```

### 20.2 Editor preview positioned at the instance (`Draw`)

```js
Draw(iRenderer, iDrawParams) {
  const quad = this._inst.GetQuad();
  const tex = this.GetTexture(this._inst.GetFirstAnimationFrame());
  if (tex) {
    iRenderer.SetTextureFillMode();
    iRenderer.SetTexture(tex);
    iRenderer.Quad3(quad, this.GetTexRect());
  } else {
    iRenderer.SetColorFillMode();
    iRenderer.SetColorRgba(0.5, 0.5, 0.5, 0.4);
    iRenderer.Quad(quad);
  }
}
```

### 20.3 Per-draw setup checklist (mesh distortion style)

```js
renderer.setAlphaBlendMode();
renderer.setTextureFillMode();
renderer.resetColor();
renderer.setCullFaceMode("none");
renderer.setFrontFaceWinding("cw");
renderer.setTexture(texture, "auto");
renderer.drawMesh(pos, uv, idx, col);
```

---

## 21. Pre-Commit Checklist

- [ ] Runtime `_draw` uses **camelCase** `IRenderer`; editor `Draw` uses **PascalCase** `IWebGLRenderer`.
- [ ] `drawMesh` positions are **3-component** (`z=0` for 2D); indices are **`Uint16Array`**; per-vertex colors are **premultiplied**.
- [ ] Editor preview positions from `this._inst.GetQuad()` / `GetBoundingBox()`, never `iDrawParams.GetLayoutRect()`.
- [ ] Textures sampled with the real tex rect (`GetTexRect()` / source rect), not assumed `[0,1]`.
- [ ] Master opacity + color filter applied **once**; not double-counted in vertex colors.
- [ ] Tiling via `IsTiled` + UVs > 1 + repeat wrap; no manual UV wrapping.
- [ ] Effects: `SupportsEffects` + `MustPreDraw`; `_draw` uses `setAlphaBlendMode()`, blend driven by `this.blendMode`.
- [ ] `IMeshData` writes are followed by `markDataChanged()`.
- [ ] Full renderer state set before each draw sequence (blend, fill, color, texture).
- [ ] Texture-null fallback present; `updateRender()` only on real visual changes; no unconditional editor `Refresh()`.

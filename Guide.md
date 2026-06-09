# Drag N Drop Guide

Drag N Drop is a Construct 3 behaviour that is a drop-in replacement for the built-in Drag & Drop, rebuilt so that **you** decide when a drag starts and stops. The built-in behaviour is permanently wired to the mouse or touch. Drag N Drop is driven through events instead, so a controller button, a touch gesture, an AI routine, or a virtual cursor can all start and stop a drag through the same two actions. While an object is dragged it follows a **drag point** you update each tick (usually the cursor or touch position). The behaviour can constrain the object to a direction set, magnetise it toward snap targets, auto-drop it when it gets pulled too far, and it measures throw velocity for you so flick-to-throw needs no manual tracking. This guide explains how the behaviour works and how to wire every property, action, condition, expression, and debugger field into a real project.

## Table of Contents

1. [Scenarios Where This Addon Excels](#1-scenarios-where-this-addon-excels)
2. [Core Concepts](#2-core-concepts)
3. [Project Setup](#3-project-setup)
4. [Behaviour Properties](#4-behaviour-properties)
5. [Drag Lifecycle: Start Drag and Drop](#5-drag-lifecycle-start-drag-and-drop)
6. [The Drag Point](#6-the-drag-point)
7. [Grab Modes and Follow Speed](#7-grab-modes-and-follow-speed)
8. [Directions (Movement Lock)](#8-directions-movement-lock)
9. [Break Distance](#9-break-distance)
10. [Throw Velocity](#10-throw-velocity)
11. [Snapping, Magnetism, and Homing](#11-snapping-magnetism-and-homing)
12. [Actions Reference](#12-actions-reference)
13. [Conditions Reference](#13-conditions-reference)
14. [Triggers Reference](#14-triggers-reference)
15. [Expressions Reference](#15-expressions-reference)
16. [System Use Cases](#16-system-use-cases)
17. [Game Use Cases](#17-game-use-cases)
18. [C3 Debugger](#18-c3-debugger)
19. [Scripting](#19-scripting)
20. [Tips and Common Mistakes](#20-tips-and-common-mistakes)

## 1. Scenarios Where This Addon Excels

- **Gamepad and controller-driven UI**: Start and stop dragging from a controller button. The drag point comes from a virtual cursor or joystick, with no mouse anywhere in the chain.
- **Hold-to-grab interactions**: Adventure, puzzle, and VR-style interfaces where picking something up is a held gesture you control, not an instant click.
- **Physics-sandbox and throwing games**: Throw velocity is measured automatically, so flick-to-throw needs no per-frame accumulator.
- **Snap-to-grid and magnetic slots**: Inventory slots, jigsaw boards, and node editors where pieces pull toward and lock onto targets. Snapping and magnetism handle it with a radius and a strength.
- **Yank-to-release interactions**: Give the object a follow speed so it lags, then flick the cursor away and it auto-drops or cancels once the gap grows past a break distance, with no distance maths.
- **Puzzle games at scale**: Dozens of draggable pieces, each respecting direction locks, all sharing one behaviour configuration.
- **Accessibility-driven input**: Switch-access, eye-gaze, or dwell-click systems can start and stop drags from any event without touching the object's drag logic.

## 2. Core Concepts

### The problem this addon solves

The built-in Drag & Drop behaviour bakes the mouse and touch connection into its engine. The moment you need gamepad dragging, a hold-to-pick-up gesture, a custom drag handle, or a VR pointer, you fall back to hand-built logic: per-frame `Set X` and `Set Y` events, instance variables tracking velocity for a throw, and a per-object "is dragging" boolean copied across every draggable type. Stopping an object being dragged through a wall, snapping it to a grid, or tearing a stuck object free all mean writing distance and overlap maths by hand every frame.

Drag N Drop replaces that with two actions, **Start Drag** and **Drop**, that you fire from any event, plus a **Set Drag Point** action you call each tick to steer the object. Snapping to targets is a radius plus a list of snap points. Auto-dropping an object that gets yanked too far is one action with a distance and a choice. Throw velocity is measured for you and returned when the object drops.

### Key design decisions

- **You own the drag point, Drag N Drop reads it.** The behaviour never reads the mouse or any input device. You call Set Drag Point each tick. The object follows that point. If you never set it, the object does not move while dragged.
- **Start and stop are events, never automatic.** Start Drag begins a drag, Drop ends it. Hover detection, click radius, and hold gestures are your event-sheet conditions.
- **One action covers both ways to end a drag.** Drop takes a *How* choice. **Release** fires On Dropped and applies the measured throw. **Cancel** ends the drag silently with no throw and fires On Drag Cancelled.
- **Break distance auto-ends a yanked drag.** Set a break distance and, when the gap between the object and the drag point grows past it (because a slow follow speed left the object lagging behind a fast cursor), the object automatically drops or cancels.
- **Snapping is opt-in and target-driven.** Nothing snaps until you set a snap radius and register snap targets (positions or objects). With a magnet strength above zero, the object also homes toward in-range targets while dragging.
- **Throw is always measured, never auto-applied.** The behaviour hands the result to On Dropped as ThrowVelocityX, ThrowVelocityY, and ThrowSpeed. You read the values, scale them, and route them to Physics, Bullet, or your own system.
- **The behaviour does not check drop targets.** Whether the object landed somewhere valid is decided in your On Dropped handler, though snapping can place it on the nearest registered target for you.

### Key concepts at a glance

| Term | What it means |
| --- | --- |
| **Drag Point** | The world-space point the dragged object follows each tick. You set this every frame while dragging, usually the cursor or touch position. |
| **Grab Mode** | Chosen when the drag starts: keep the object's offset from the drag point, or centre the object on it. |
| **Follow Speed** | How quickly the object catches up to the drag point. 0 snaps instantly, higher values add a smooth lag. |
| **Directions** | A movement lock, 8Direction style: free, a single axis, or snapped to 4 or 8 directions. |
| **Break Distance** | The maximum gap allowed between the object and the drag point. Exceeding it auto-drops or auto-cancels the drag. |
| **Snap Target** | A registered position or object the dragged object can magnetise toward and snap onto. |
| **Throw Velocity** | The release velocity measured from recent drag-point movement, handed back on drop for you to apply. |

## 3. Project Setup

1. Add the **Drag N Drop** behaviour to any world object (a Sprite, 9-patch, Tiled Background, and so on).
2. In the Properties Panel, leave **Enabled** checked and set any of Follow Speed, Directions, or Break Distance you want as defaults. Everything has a working default, so you can leave them all alone.
3. Start a drag from any event with **Start Drag**, passing the world-space point you want the object to follow.
4. Each tick while dragging, call **Set Drag Point** with the current cursor or touch position.
5. End the drag with **Drop**, choosing Release (apply the throw) or Cancel (no throw).

A minimal mouse-driven setup looks like this:

```text
Event: On Left mouse button Clicked on Sprite
  Action: Sprite (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
  // begins the drag and records the grab offset under the cursor

Event: Sprite (DragNDrop) -> Is dragging
  Action: Sprite (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)
  // steer the object every tick while it is held

Event: On Left mouse button Released
  Action: Sprite (DragNDrop) -> Drop (Release)
  // ends the drag and reports the measured throw
```

That is the whole loop: one action to start, one to steer each tick, one to stop. Everything else (directions, break distance, snapping, throw scaling) is optional and layered on top.

## 4. Behaviour Properties

The panel keeps a small set of the most common defaults. Every one of them can also be changed at runtime through its matching action, so the panel value is just the starting point.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| **Follow Speed** | Number | 0 | Max speed in pixels per second the object catches up to the drag point. 0 is an instant snap. |
| **Directions** | Combo | Free (360) | Movement lock: Free, Up & Down, Left & Right, 4 Directions, or 8 Directions. |
| **Break Distance** | Number | 0 | Gap to the drag point that auto-ends the drag. 0 disables it. |
| **Enabled** | Boolean | true | Whether the behaviour is active when the layout starts. Kept last in the panel by convention. |

Snapping and magnetism are not on the panel because they need targets registered through events. They default to off (snap radius 0, magnet strength 0) and are turned on through their actions. See [Snapping, Magnetism, and Homing](#11-snapping-magnetism-and-homing).

## 5. Drag Lifecycle: Start Drag and Drop

A drag has exactly two ends of the lifecycle, both event-driven. **Start Drag** begins a drag and fires **On Drag Started**. **Drop** ends it. Drop is a single action with a *How* choice so you never have to remember a second action:

- **Release** applies the measured throw and fires **On Dropped**.
- **Cancel** ends silently with no throw and fires **On Drag Cancelled**.

Start Drag is ignored if the object is already being dragged, and Drop is ignored if it is not dragging, so the lifecycle is always unambiguous. To switch from one drag straight into another, call Drop first.

```text
Event: On Touch start on Piece
  Action: Piece (DragNDrop) -> Start drag at (Touch.X, Touch.Y) using Keep offset

Event: Piece (DragNDrop) -> On drag started
  Action: Piece -> Set animation to "Held"
  // visual feedback the moment the grab succeeds

Event: On Touch end
  Action: Piece (DragNDrop) -> Drop (Release)

Event: Piece (DragNDrop) -> On dropped
  Action: Piece -> Set animation to "Idle"
```

**Gotcha:** On Drag Started only fires when Start Drag actually succeeds. If the object is already being dragged, the second Start Drag is silently ignored and no trigger fires.

## 6. The Drag Point

The **drag point** is the world-space coordinate the object chases each tick. You are responsible for keeping it updated with **Set Drag Point**. The behaviour never reads an input device itself, so the drag point is the single bridge between your input and the object. Call it every tick while the object is dragging, typically with a cursor, touch, or virtual-cursor value.

```text
Event: Sprite (DragNDrop) -> Is dragging
  Action: Sprite (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)
  // for touch, use (Touch.X, Touch.Y); for a virtual cursor, use its CursorX/CursorY
```

To make a dragged object follow another object instead of a pointer, pass that object's position:

```text
Event: Magnet (DragNDrop) -> Is dragging
  Action: Magnet (DragNDrop) -> Set drag point to (Player.X, Player.Y)
```

**Gotcha:** If you never call Set Drag Point, the object stays where it was grabbed. The drag point starts at the value you passed to Start Drag and only moves when you move it.

## 7. Grab Modes and Follow Speed

### Grab mode

Grab mode is chosen at the instant the drag begins, as the third parameter of Start Drag, because it only matters at grab time:

- **Keep offset** records the object's offset from the drag point and re-adds it each tick. The object stays exactly where you grabbed it relative to the cursor. This is the natural choice for grabbing a handle or grabbing a piece anywhere on its body.
- **Center on point** drops the offset to zero so the object's origin snaps onto the drag point. Use this when the object should jump to and centre on the pointer.

```text
Event: On Left mouse button Clicked on Card
  Action: Card (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
  // grabbed where clicked, no jump

Event: On Right mouse button Clicked on Card
  Action: Card (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Center on point
  // card snaps so its origin sits under the cursor
```

### Follow speed

**Follow speed** is the maximum speed, in pixels per second, at which the object closes the gap to the drag point. The default of 0 snaps the object exactly onto its target every tick. A positive value caps how fast it can move, so when the drag point outruns it the object trails behind smoothly and catches up when the pointer slows.

```text
Event: On start of layout
  Action: HeavyCrate (DragNDrop) -> Set follow speed to 600
  // the crate can chase the cursor at up to 600 px/s and lags behind a fast flick
```

**Gotcha:** Follow speed is a speed cap, not a smoothing percentage. A high value (for example 2000) keeps up with almost any normal pointer motion and feels close to instant. A low value (for example 150) produces a heavy, draggy feel.

## 8. Directions (Movement Lock)

**Directions** constrains how the dragged object is allowed to move, in the same style as the 8Direction and VectorCursor behaviours. Each tick it rounds the object's **current movement** toward the drag point to the nearest allowed direction, so the object travels in clean axis or diagonal lines while still reaching the cursor.

| Option | Movement |
| --- | --- |
| **Free (360)** | No constraint. The object follows the drag point freely. This is the default. |
| **Up & Down** | Vertical only. The object moves up and down toward the drag point and its X is held. |
| **Left & Right** | Horizontal only. The object moves left and right toward the drag point and its Y is held. |
| **4 Directions** | Each tick's movement is rounded to the nearest cardinal direction (up, down, left, right), so the object steps toward the cursor along horizontal and vertical lines. |
| **8 Directions** | Each tick's movement is rounded to the nearest of eight compass directions (the cardinals plus the diagonals), so the object tracks the cursor along clean 45-degree lines. |

```text
Event: On start of layout
  Action: Knob (DragNDrop) -> Set directions to Left & Right
  // the knob can now only slide along its track

Event: On Left mouse button Clicked on Token
  Action: Token (DragNDrop) -> Set directions to 8 Directions
  Action: Token (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
  // the token chases the cursor but only ever moves along 8 compass directions
```

**Gotcha:** Because it is the movement that is rounded (not the absolute offset from where you grabbed), 4 and 8 Directions reach the cursor by stepping along their allowed lines rather than locking to a single ray. With a follow speed of 0 the object closes that gap almost instantly; raise follow speed for a visible, steady glide along the direction lines.

## 9. Break Distance

**Break distance** is the maximum gap allowed between the object and the drag point. The gap grows when the object cannot keep up with the drag point, which happens when you set a **follow speed** (so the object lags) and then move the cursor faster than the object can follow. Once the gap passes the break distance, the drag ends automatically.

The **Set break distance** action also chooses what "end" means (there is no panel row for it):

- **Drop** applies the throw and fires On Dropped with DropReason `"broke_distance"`.
- **Cancel** ends silently and fires On Drag Cancelled.

A break distance of 0 (the default) disables this, and the object simply lags indefinitely and snaps back when the cursor slows. The panel **Break Distance** value uses Drop; switch to Cancel through the action when you need it.

```text
Event: On start of layout
  Action: Crate (DragNDrop) -> Set follow speed to 300
  Action: Crate (DragNDrop) -> Set break distance to 120 (Drop)
  // the crate follows slowly; flick the cursor far past it and once the gap passes 120px it drops

Event: Crate (DragNDrop) -> On dropped
  Condition: Crate (DragNDrop) -> Compare two values: DropReason = "broke_distance"
  Action: Crate -> Set animation to "Dropped"
```

**Gotcha:** Break distance measures the gap to the drag point, not the distance the object has travelled. With a follow speed of 0 the object snaps onto the drag point every tick, so the gap stays near zero and the break never triggers. Break distance only does something once a follow speed lets the object fall behind a fast cursor.

## 10. Throw Velocity

Throw is **always measured, never applied**. Each tick the behaviour records how fast the drag point is moving into a small ring buffer. On any release (a Drop with Release, or a break-distance Drop), it averages those samples and hands the result to On Dropped as **ThrowVelocityX**, **ThrowVelocityY**, and **ThrowSpeed**, in pixels per second. The behaviour never pushes this into a movement system. You read the values, scale them as you like, and route them to Physics, Bullet, or your own system.

```text
Event: SandboxObject (DragNDrop) -> On dropped
  Action: SandboxObject (Physics) -> Set velocity to (Self.DragNDrop.ThrowVelocityX * 0.5, Self.DragNDrop.ThrowVelocityY * 0.5)
  // forward the measured flick to Physics, scaled to taste
```

To override or suppress the throw, call **Set Throw Velocity** before the release. Passing 0, 0 suppresses the throw entirely:

```text
Event: On Left mouse button Released
  Condition: System -> CardDroppedOutsidePlayArea = 1
  Action: Card (DragNDrop) -> Set throw velocity to (0, 0)
  Action: Card (DragNDrop) -> Drop (Release)
  // a release with no momentum
```

**Gotcha:** ThrowVelocityX, ThrowVelocityY, and ThrowSpeed are meaningful at drop time. Read them inside On Dropped. A Cancel never produces a throw, and a release that snaps to a target also reports a zero throw so the placed object does not fling off.

## 11. Snapping, Magnetism, and Homing

Snapping lets the object pull toward and lock onto **snap targets** you register. A target is either a fixed world position or an object's position. The feature is opt-in: nothing happens until you register at least one target and either set a **snap radius** or switch to overlap mode.

There are three things to set, controlled separately:

- **Snap on drop** (active once snapping is enabled): when a release ends on an active target, the object is placed exactly on it, the throw is suppressed, and **On Snapped** fires.
- **Snap mode** (how a target counts as active): **Radius** measures the object's distance to the target against the snap radius. **Overlap** is collision-based and uses the **drag position**. See below.
- **Magnetism / homing** (controlled by **magnet strength**): while dragging, the object is pulled toward the nearest in-range target. A strength of 0 means no live pull (snap only happens on drop). A strength up to 1 pulls harder, and the pull grows stronger as the object nears the target. The magnet is always distance-based, regardless of the snap mode.

### Registering targets the C3 way

Register fixed grid points with **Add snap position**, and register objects with **Add snap object**. Because Add snap object reads a single instance, use a **For each** loop to register every instance of a type at once. **Clear snap targets** wipes them all.

```text
Event: On start of layout
  For each Slot
  Action: Item (DragNDrop) -> Add snap object Slot
  // every Slot instance becomes a snap target

Event: On start of layout
  Action: Item (DragNDrop) -> Set snap radius to 48
  Action: Item (DragNDrop) -> Set magnet strength to 0.4
  // pieces magnetise toward a slot within 48px and lock on when released near one
```

### Snap mode: radius or collision

**Set snap mode** chooses how a target counts as active:

- **Radius (distance)** (the default): a target is active when the **object's** position is within the snap radius of it. Good for "drop near the slot and it locks on."
- **Overlap (collision)**: a target is active when the **drag position** collides with it, so snapping follows the cursor rather than the lagging object. For an **object** target, this means the drag point is inside the target's collision shape, or the dragged object overlaps the target. For a **position** target, it means the drag point is within the snap radius of the position, or the dragged object covers it. Overlap mode works even with a snap radius of 0 (the radius then only tunes the magnet and the position tolerance).

```text
Event: On start of layout
  For each Slot
  Action: Piece (DragNDrop) -> Add snap object Slot
  Action: Piece (DragNDrop) -> Set snap mode to Overlap (collision)
  // the piece snaps to whichever Slot the cursor is actually over,
  // even if a slow follow speed leaves the piece lagging behind

Event: On Left mouse button Clicked on Piece
  Action: Piece (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
Event: Piece (DragNDrop) -> Is dragging
  Action: Piece (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)
```

Overlap mode is the better fit when the dragged object is large, lags behind the drag point (a slow follow speed), or when you want "drop onto the thing under the cursor" rather than "drop near the thing."

### Reacting to a snap

On Snapped fires right after On Dropped when a release lands on a target, so you can run slot-fill logic without an overlap check. SnapTargetX, SnapTargetY, and SnappedObjectUID tell you where it landed.

```text
Event: Item (DragNDrop) -> On snapped
  Action: Item -> Set position to (Item.DragNDrop.SnapTargetX, Item.DragNDrop.SnapTargetY)
  Action: System -> Set InventoryFilled to Item.DragNDrop.SnappedObjectUID
  // the object is already placed; this also records which slot it filled
```

While dragging, **Is snapping** is true whenever the object is within range of a target, which is perfect for highlighting the slot it would drop into.

```text
Event: Item (DragNDrop) -> Is dragging
  Condition: Item (DragNDrop) -> Is snapping
  Action: HighlightSlot -> Set position to (Item.DragNDrop.SnapTargetX, Item.DragNDrop.SnapTargetY)
  Action: HighlightSlot -> Set visible
```

**Gotcha:** In Radius mode snapping is measured from the object's position; in Overlap mode it is measured from the drag position (the cursor). SnappedObjectUID is -1 when the snap was to a fixed position rather than an object, or when no snap occurred. A magnet strength above 0 with no in-range target does nothing, so it is safe to leave on.

## 12. Actions Reference

### Drag lifecycle

| Action | Description |
| --- | --- |
| **Start drag** | Begins dragging this object toward a drag point, using a grab mode of Keep offset or Center on point. Fires On Drag Started. Ignored if already dragging. |
| **Drop** | Ends the current drag. Release applies the measured throw and fires On Dropped. Cancel ends silently and fires On Drag Cancelled. Ignored if not dragging. |

### Drag point

| Action | Description |
| --- | --- |
| **Set drag point** | Updates the world-space point the object follows. Call every tick while dragging, typically with a cursor, touch, or virtual-cursor value. |

### Drag options

| Action | Description |
| --- | --- |
| **Set follow speed** | Sets the maximum speed in pixels per second at which the object catches up to the drag point. 0 is an instant snap. |
| **Set directions** | Constrains movement to Free, Up & Down, Left & Right, 4 Directions, or 8 Directions. |
| **Set break distance** | Sets the maximum gap to the drag point before the drag auto-ends, and whether that end is a Drop or a Cancel. 0 disables it. |

### Snapping and magnetism

| Action | Description |
| --- | --- |
| **Add snap position** | Registers a world-space position as a snap and magnet target. |
| **Add snap object** | Registers an object's position as a snap and magnet target. Use a For each loop to add many at once. |
| **Clear snap targets** | Removes all registered snap positions and snap objects. |
| **Set snap radius** | Sets the distance within which the object snaps on drop and magnetises while dragging. In Radius mode, 0 disables snapping. |
| **Set snap mode** | Chooses how a target is detected: Radius (object distance) or Overlap (collision at the drag position). |
| **Set magnet strength** | Sets the live homing pull from 0 (snap only on drop) to 1 (strong magnetism). |

### Throw and state

| Action | Description |
| --- | --- |
| **Set throw velocity** | Overrides the measured throw before a release. Pass 0, 0 to suppress the throw entirely. |
| **Set enabled** | Enables or disables the behaviour. Disabling cancels any in-progress drag. |

## 13. Conditions Reference

These are the non-trigger state checks. The trigger conditions are listed separately in the Triggers Reference.

| Condition | Description |
| --- | --- |
| **Is dragging** | True while the object is being dragged. |
| **Is enabled** | True if the behaviour is active. |
| **Is snapping** | True while the object is within snap radius of a target, so a drop would snap to it. |

## 14. Triggers Reference

| Trigger | Description |
| --- | --- |
| **On drag started** | Fires when Start Drag succeeds. Read DragPointX and DragPointY for the grab point. |
| **On dropped** | Fires when a drag ends via Drop (Release) or a break-distance Drop. Read ThrowVelocityX, ThrowVelocityY, ThrowSpeed, and DropReason. |
| **On drag cancelled** | Fires when a drag ends via Drop (Cancel) or a break-distance Cancel. No throw is applied. Read DropReason. |
| **On snapped** | Fires after a release that lands within snap radius of a target, alongside On Dropped. Read SnapTargetX, SnapTargetY, and SnappedObjectUID. |

## 15. Expressions Reference

| Expression | Returns | Description |
| --- | --- | --- |
| **DragPointX** | number | Current world-space X of the drag point. |
| **DragPointY** | number | Current world-space Y of the drag point. |
| **DistanceFromPoint** | number | Current gap in pixels between the object and the drag point. Grows while the object lags behind a fast cursor, and drives the break-distance check. |
| **SnapTargetX** | number | X of the nearest snap target. While dragging it tracks the nearest target, and after a snap it is the snapped position. |
| **SnapTargetY** | number | Y of the nearest snap target. While dragging it tracks the nearest target, and after a snap it is the snapped position. |
| **SnappedObjectUID** | number | UID of the object snapped to on the last drop, or -1 if the snap was a position or no snap occurred. |
| **ThrowVelocityX** | number | X component of the measured throw velocity. Meaningful at drop time, use inside On Dropped. |
| **ThrowVelocityY** | number | Y component of the measured throw velocity. Use inside On Dropped. |
| **ThrowSpeed** | number | Magnitude of the throw velocity. Use inside On Dropped. |
| **DropReason** | string | Why the drag ended: `"manual"` for a Drop action, `"broke_distance"` for an automatic break-distance end. Use inside On Dropped and On Drag Cancelled. |

## 16. System Use Cases

### System A. Drag lifecycle

Starts and stops a drag through events and reacts to the lifecycle triggers.

- Scenario: A piece should begin moving only after the player presses it, and stop when they release.

```text
Event: On Left mouse button Clicked on Piece
  Action: Piece (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: Piece (DragNDrop) -> Is dragging
  Action: Piece (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: On Left mouse button Released
  Action: Piece (DragNDrop) -> Drop (Release)
```

Tip: To swap which object is dragged, call Drop on the first object before Start Drag on the second, because Start Drag is ignored while another drag on the same instance is active.

### System B. Drag point steering

The drag point is the only bridge between input and motion, so the input source can be anything.

- Scenario: The same drag logic should work for mouse, touch, and a virtual cursor.

```text
Event: VectorCursor -> On Interact Pressed
  Action: Sprite (DragNDrop) -> Start drag at (VectorCursor.CursorX, VectorCursor.CursorY) using Keep offset

Event: Sprite (DragNDrop) -> Is dragging
  Action: Sprite (DragNDrop) -> Set drag point to (VectorCursor.CursorX, VectorCursor.CursorY)

Event: VectorCursor -> On Interact Released
  Action: Sprite (DragNDrop) -> Drop (Release)
```

Tip: There is no coupling code. Drag N Drop consumes the coordinates as plain numbers, so mouse, gamepad, and AI input are interchangeable.

### System C. Constraining movement with directions

Keeps movement predictable with a direction lock.

- Scenario: A rail piece should slide left and right only.

```text
Event: On start of layout
  Action: RailPiece (DragNDrop) -> Set directions to Left & Right

Event: On Left mouse button Clicked on RailPiece
  Action: RailPiece (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
Event: RailPiece (DragNDrop) -> Is dragging
  Action: RailPiece (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)
```

Tip: Left & Right holds the piece's Y, so it tracks the cursor only along its rail. Clamp the X yourself in On Dropped or each tick if the rail has end-stops.

### System D. Snapping and magnetism

Pulls the object toward registered targets and locks it on when released near one.

- Scenario: Inventory items should magnetise to nearby slots and snap into them.

```text
Event: On start of layout
  For each Slot
  Action: Item (DragNDrop) -> Add snap object Slot

Event: On start of layout
  Action: Item (DragNDrop) -> Set snap radius to 40
  Action: Item (DragNDrop) -> Set magnet strength to 0.5

Event: Item (DragNDrop) -> On snapped
  Action: Audio -> Play "click" not looping
```

Tip: Use a magnet strength of 0 if you want a clean snap on drop with no live pull, and raise it for a sticky, assisted feel.

### System E. Yank-to-release with break distance

Lets a lagging object drop free once the cursor outruns it past a limit.

- Scenario: A heavy object that follows slowly should drop where it fell behind when flicked away.

```text
Event: On start of layout
  Action: Anvil (DragNDrop) -> Set follow speed to 250
  Action: Anvil (DragNDrop) -> Set break distance to 100 (Drop)

Event: Anvil (DragNDrop) -> On dropped
  Condition: Anvil (DragNDrop) -> Compare two values: DropReason = "broke_distance"
  Action: Audio -> Play "thud" not looping
```

Tip: Break distance needs a follow speed to be meaningful. Without one the object snaps onto the cursor each tick and the gap never grows.

### System F. Throw measurement and routing

Reads the measured throw on release and forwards it to a movement system.

- Scenario: A flicked disc should keep sliding using the Bullet behaviour.

```text
Event: Disc (DragNDrop) -> On dropped
  Action: Disc (Bullet) -> Set speed to Disc.DragNDrop.ThrowSpeed
  Action: Disc (Bullet) -> Set angle of motion to angle(0, 0, Disc.DragNDrop.ThrowVelocityX, Disc.DragNDrop.ThrowVelocityY)
```

Tip: Scale ThrowSpeed if the raw drag-point speed feels too strong, and use Set throw velocity (0, 0) before Drop when a particular release should carry no momentum.

## 17. Game Use Cases

### 1. Simplest mouse drag

**Scenario:** A sprite should follow the mouse while held and stop on release.

```text
Event: On Left mouse button Clicked on Sprite
  Action: Sprite (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: Sprite (DragNDrop) -> Is dragging
  Action: Sprite (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: On Left mouse button Released
  Action: Sprite (DragNDrop) -> Drop (Release)
```

Note: This three-event loop is the foundation every other use case builds on.

### 2. Mobile jigsaw with multi-touch

**Scenario:** Several fingers each drag their own puzzle piece independently.

```text
Event: On Touch start on Piece
  Action: Piece (DragNDrop) -> Start drag at (Touch.XAt(Touch.TouchIndex), Touch.YAt(Touch.TouchIndex)) using Keep offset

Event: Piece (DragNDrop) -> Is dragging
  For each Piece
  Action: Piece (DragNDrop) -> Set drag point to (Touch.XAt(0), Touch.YAt(0))

Event: On Touch end
  Action: Piece (DragNDrop) -> Drop (Release)
```

Note: Each piece carries its own behaviour instance, so independent simultaneous drags need no shared state.

### 3. Snap-to-slot inventory with magnetism

**Scenario:** An item card magnetises to inventory slots and snaps into the nearest one on release.

```text
Event: On start of layout
  For each Slot
  Action: ItemCard (DragNDrop) -> Add snap object Slot
  Action: ItemCard (DragNDrop) -> Set snap radius to 44
  Action: ItemCard (DragNDrop) -> Set magnet strength to 0.5

Event: On Left mouse button Clicked on ItemCard
  Action: ItemCard (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: ItemCard (DragNDrop) -> On dropped
  Condition: ItemCard (DragNDrop) -> Is snapping (inverted)
  Action: ItemCard -> Set position to (ItemCard.HomeX, ItemCard.HomeY)
  // dropped away from any slot, so return home
```

Note: On Snapped places the card on the nearest slot for you; the inverted Is snapping check handles the "dropped in empty space" case.

### 4. Dock icon reorder

**Scenario:** A dock icon slides along the bar and snaps to the nearest slot when released.

```text
Event: On start of layout
  Action: Icon (DragNDrop) -> Set directions to Left & Right
  Repeat 6 times
  Action: Icon (DragNDrop) -> Add snap position (80 + loopindex * 64, 540)
  Action: Icon (DragNDrop) -> Set snap radius to 32

Event: On Left mouse button Clicked on Icon
  Action: Icon (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
Event: Icon (DragNDrop) -> Is dragging
  Action: Icon (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: Icon (DragNDrop) -> On snapped
  Action: System -> Reorder the dock by Icon.X
```

Note: Left & Right keeps the icon on the bar, and the row of snap positions locks it into the nearest slot on release.

### 5. Physics sandbox throw

**Scenario:** A sandbox object is dragged, swung, and released into the Physics simulation.

```text
Event: On Left mouse button Clicked on Crate
  Action: Crate (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: Crate (DragNDrop) -> Is dragging
  Action: Crate (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: Crate (DragNDrop) -> On dropped
  Action: Crate (Physics) -> Set velocity to (Self.DragNDrop.ThrowVelocityX, Self.DragNDrop.ThrowVelocityY)
```

Note: Natural flick-throws with no accumulator code, because the velocity was measured for you.

### 6. Yank a heavy object free

**Scenario:** A heavy crate that follows slowly should let go where it fell behind when the player flicks the cursor away.

```text
Event: On start of layout
  Action: Crate (DragNDrop) -> Set follow speed to 220
  Action: Crate (DragNDrop) -> Set break distance to 100 (Drop)

Event: On Left mouse button Clicked on Crate
  Action: Crate (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: Crate (DragNDrop) -> Is dragging
  Action: Crate (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)
```

Note: The slow follow speed lets the cursor outrun the crate; a hard flick grows the gap past 100px and drops it where it lagged, with no distance maths in your events.

### 7. Claw machine crane

**Scenario:** An arcade claw floats heavily over the cabinet, stays inside the glass, and drops to release a prize.

```text
Event: On start of layout
  Action: Claw (DragNDrop) -> Set follow speed to 220
  Action: Claw (DragNDrop) -> Start drag at (Claw.X, Claw.Y) using Center on point
  // the claw is always under control, drifting heavily as the joystick steers it

Event: Every tick
  Action: System -> Set ClawX to clamp(ClawX + Gamepad.Axis(0,0), CabinetLeft, CabinetRight)
  Action: System -> Set ClawY to clamp(ClawY + Gamepad.Axis(0,1), CabinetTop, CabinetBottom)
  Action: Claw (DragNDrop) -> Set drag point to (ClawX, ClawY)

Event: On "Drop" button pressed
  Action: Claw (DragNDrop) -> Drop (Release)
  // lower-and-grab logic runs from On dropped
```

Note: Follow speed gives the floaty crane feel; clamp the drag point to the cabinet bounds so the claw stays inside the glass, all without a single Set X / Set Y on the claw.

### 8. Pinball plunger

**Scenario:** Pulling the plunger straight down and releasing launches the ball, harder the further it was pulled.

```text
Event: On start of layout
  Action: Plunger (DragNDrop) -> Set directions to Up & Down

Event: On Left mouse button Clicked on Plunger
  Action: Plunger (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
Event: Plunger (DragNDrop) -> Is dragging
  Action: Plunger (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: On Left mouse button Released
  Action: Plunger (DragNDrop) -> Drop (Release)
Event: Plunger (DragNDrop) -> On dropped
  Action: Ball (Physics) -> Apply impulse (0, -(Plunger.Y - Plunger.RestY) * 4) at image point 0
  Action: Plunger -> Set position to (Plunger.X, Plunger.RestY)
```

Note: Up & Down keeps the plunger on its shaft, and the pulled distance (current Y minus rest Y) becomes the launch power, so no throw is needed.

### 9. Yank-to-cancel a card play

**Scenario:** A card dragged toward the board snaps back to hand if the player yanks it far too fast.

```text
Event: On start of layout
  Action: Card (DragNDrop) -> Set follow speed to 500
  Action: Card (DragNDrop) -> Set break distance to 160 (Cancel)

Event: On Left mouse button Clicked on Card
  Action: Card (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
Event: Card (DragNDrop) -> Is dragging
  Action: Card (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: Card (DragNDrop) -> On drag cancelled
  Action: Card -> Set position to (Card.HandX, Card.HandY)
```

Note: A break-distance Cancel ends silently and applies no throw, so a hard flick past 160px snaps the card back to hand instead of dropping it.

### 10. Circuit wiring puzzle

**Scenario:** A wire end is routed in neat 8-direction segments and snaps onto the nearest port to complete a connection.

```text
Event: On start of layout
  For each Port
  Action: WireEnd (DragNDrop) -> Add snap object Port
  Action: WireEnd (DragNDrop) -> Set snap radius to 30
  Action: WireEnd (DragNDrop) -> Set magnet strength to 0.6

Event: On Left mouse button Clicked on WireEnd
  Action: WireEnd (DragNDrop) -> Set directions to 8 Directions
  Action: WireEnd (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
Event: WireEnd (DragNDrop) -> Is dragging
  Action: WireEnd (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: WireEnd (DragNDrop) -> On snapped
  Action: System -> Connect WireEnd to object WireEnd.DragNDrop.SnappedObjectUID
```

Note: 8 Directions keeps the wire running along clean diagonals and cardinals, while snapping locks it onto a port and hands you the port UID.

### 11. Gamepad drag with a virtual cursor

**Scenario:** A controller drives the whole interaction with no mouse anywhere.

```text
Event: VectorCursor -> On Interact Pressed
  Action: Sprite (DragNDrop) -> Start drag at (VectorCursor.CursorX, VectorCursor.CursorY) using Keep offset

Event: Sprite (DragNDrop) -> Is dragging
  Action: Sprite (DragNDrop) -> Set drag point to (VectorCursor.CursorX, VectorCursor.CursorY)

Event: VectorCursor -> On Interact Released
  Action: Sprite (DragNDrop) -> Drop (Release)
```

Note: Swap the input source freely. Mouse and gamepad behave identically because the drag point is just two numbers.

### 12. Hold-to-grab pickup

**Scenario:** Picking something up is a held gesture, not an instant click.

```text
Event: Mouse -> Cursor is over Object
  Condition: Mouse -> Left button is down
  Condition: System -> HoldTimer >= 0.4
  Condition: Object (DragNDrop) -> Is dragging (inverted)
  Action: Object (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
```

Note: Because Start Drag is event-driven, the grab gesture is entirely yours to define.

### 13. Spaceship docking

**Scenario:** A drifting ship is nudged toward a station port, magnetises into the docking slot from a distance, and locks when released.

```text
Event: On start of layout
  Action: Ship (DragNDrop) -> Add snap position (Station.DockX, Station.DockY)
  Action: Ship (DragNDrop) -> Set snap radius to 120
  Action: Ship (DragNDrop) -> Set magnet strength to 1
  Action: Ship (DragNDrop) -> Set follow speed to 180
  // strong long-range pull plus a slow, weighty glide into the dock

Event: On Tractor button held
  Action: Ship (DragNDrop) -> Start drag at (Ship.X, Ship.Y) using Center on point
Event: Ship (DragNDrop) -> Is dragging
  Action: Ship (DragNDrop) -> Set drag point to (Reticle.X, Reticle.Y)

Event: On Tractor button released
  Action: Ship (DragNDrop) -> Drop (Release)
Event: Ship (DragNDrop) -> On snapped
  Action: System -> Set Docked to 1
```

Note: A wide radius with magnet strength 1 draws the ship into the dock as it nears, and follow speed gives the heavy, assisted glide.

### 14. Fishing reel-in

**Scenario:** The line chases a darting fish toward the boat, but a lunge faster than the line can take snaps it.

```text
Event: On start of layout
  Action: Line (DragNDrop) -> Set follow speed to 300
  Action: Line (DragNDrop) -> Set break distance to 160 (Cancel)
  Action: Line (DragNDrop) -> Add snap object Boat
  Action: Line (DragNDrop) -> Set snap radius to 70

Event: On Fish hooked
  Action: Line (DragNDrop) -> Start drag at (Fish.X, Fish.Y) using Center on point
Event: Line (DragNDrop) -> Is dragging
  Action: Line (DragNDrop) -> Set drag point to (Fish.X, Fish.Y)
  // the fish darts; the line, capped at 300 px/s, lags behind a hard lunge

Event: On "Net" button pressed
  Action: Line (DragNDrop) -> Drop (Release)
Event: Line (DragNDrop) -> On snapped
  Action: System -> Add 1 to FishCaught
Event: Line (DragNDrop) -> On drag cancelled
  Action: System -> Set Text to "The line snapped!"
```

Note: Follow speed caps the reel, so a hard lunge grows the gap past the break distance and snaps the line, while netting the fish within range of the boat counts as a catch.

### 15. Marionette puppet hand

**Scenario:** A puppet's hand hangs from a string and trails the control point with a soft, swinging lag.

```text
Event: On start of layout
  Action: PuppetHand (DragNDrop) -> Set follow speed to 400
  // a modest follow speed makes the string swing and settle instead of snapping rigidly

Event: On Left mouse button Clicked on Control
  Action: PuppetHand (DragNDrop) -> Start drag at (PuppetHand.X, PuppetHand.Y) using Center on point
Event: PuppetHand (DragNDrop) -> Is dragging
  Action: PuppetHand (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: On Left mouse button Released
  Action: PuppetHand (DragNDrop) -> Drop (Release)
```

Note: Follow speed alone turns a rigid drag into a trailing, marionette-like motion, with no physics behaviour required.

### 16. Scale a flick into a fast launch

**Scenario:** A slingshot projectile should launch faster than the raw drag speed.

```text
Event: Projectile (DragNDrop) -> On dropped
  Action: Projectile (Bullet) -> Set speed to (Projectile.DragNDrop.ThrowSpeed * 2.5)
  Action: Projectile (Bullet) -> Set angle of motion to angle(0, 0, Projectile.DragNDrop.ThrowVelocityX, Projectile.DragNDrop.ThrowVelocityY)
```

Note: ThrowSpeed gives magnitude, and the angle expression turns the velocity components into a launch direction.

### 17. Accessible switch-access drag

**Scenario:** One switch press starts a drag, a second press ends it, driven by a timed cursor.

```text
Event: On Switch pressed
  Condition: Highlighted (DragNDrop) -> Is dragging (inverted)
  Action: Highlighted (DragNDrop) -> Start drag at (DwellCursor.X, DwellCursor.Y) using Keep offset

Event: On Switch pressed
  Condition: Highlighted (DragNDrop) -> Is dragging
  Action: Highlighted (DragNDrop) -> Drop (Release)
```

Note: The same drag logic serves switch, dwell, and pointer input because nothing is hard-wired to a device.

### 18. Highlight the slot under the piece

**Scenario:** While dragging, the slot the piece would drop into should glow.

```text
Event: Piece (DragNDrop) -> Is dragging
  Condition: Piece (DragNDrop) -> Is snapping
  Action: Glow -> Set position to (Piece.DragNDrop.SnapTargetX, Piece.DragNDrop.SnapTargetY)
  Action: Glow -> Set visible

Event: Piece (DragNDrop) -> Is dragging
  Condition: Piece (DragNDrop) -> Is snapping (inverted)
  Action: Glow -> Set invisible
```

Note: Is snapping plus SnapTargetX/Y gives live snap feedback without your own distance loop.

### 19. Tug-of-war rope snap

**Scenario:** Pulling the rope handle works until you yank past the strain limit, when the rope snaps and flings the handle back.

```text
Event: On start of layout
  Action: Handle (DragNDrop) -> Set directions to Left & Right
  Action: Handle (DragNDrop) -> Set break distance to 180 (Drop)
  // pull horizontally; over-straining past 180px snaps the rope and applies the flick

Event: On Touch start on Handle
  Action: Handle (DragNDrop) -> Start drag at (Touch.X, Touch.Y) using Keep offset
Event: Handle (DragNDrop) -> Is dragging
  Action: Handle (DragNDrop) -> Set drag point to (Touch.X, Touch.Y)

Event: Handle (DragNDrop) -> On dropped
  Condition: Handle (DragNDrop) -> Compare two values: DropReason = "broke_distance"
  Action: Handle (Bullet) -> Set speed to Handle.DragNDrop.ThrowSpeed
  Action: Handle (Bullet) -> Set angle of motion to 180
```

Note: A break-distance Drop applies the measured throw, so the snapped rope launches the handle with whatever speed the player was pulling at. A normal release (DropReason "manual") just lets go.

### 20. Scrapyard magnet crane

**Scenario:** A scrap crane drags junk that is strongly pulled toward whichever recycling bin is nearest, dropping it in on release.

```text
Event: On start of layout
  For each Bin
  Action: Scrap (DragNDrop) -> Add snap object Bin
  Action: Scrap (DragNDrop) -> Set snap radius to 200
  Action: Scrap (DragNDrop) -> Set magnet strength to 0.9
  // a wide radius and strong pull make junk leap into a nearby bin

Event: On Magnet button held on Scrap
  Action: Scrap (DragNDrop) -> Start drag at (Scrap.X, Scrap.Y) using Center on point
Event: Scrap (DragNDrop) -> Is dragging
  Action: Scrap (DragNDrop) -> Set drag point to (Crane.X, Crane.Y)

Event: On Magnet button released
  Action: Scrap (DragNDrop) -> Drop (Release)
Event: Scrap (DragNDrop) -> On snapped
  Action: System -> Add 10 to Score
  Action: Scrap -> Destroy
```

Note: A high magnet strength over a large radius makes sorting feel assisted, and On Snapped both scores the drop and tells you which bin caught it via SnappedObjectUID.

### 21. Branch on why the drag ended

**Scenario:** A dropped piece should behave differently for a manual drop versus an automatic break.

```text
Event: Piece (DragNDrop) -> On dropped
  Condition: Piece (DragNDrop) -> Compare two values: DropReason = "manual"
  Action: Piece -> Set animation to "Placed"

Event: Piece (DragNDrop) -> On dropped
  Condition: Piece (DragNDrop) -> Compare two values: DropReason = "broke_distance"
  Action: Piece -> Set animation to "Snagged"
```

Note: DropReason is `"manual"` for a Drop action and `"broke_distance"` for a break-distance end.

### 22. Telekinesis gravity gun

**Scenario:** A psychic power grabs a distant object, hauls it in slowly, and hurls it exactly where the player aims on release.

```text
Event: On "Pull" key pressed
  Condition: TargetObject (DragNDrop) -> Is dragging (inverted)
  Action: TargetObject (DragNDrop) -> Set follow speed to 500
  Action: TargetObject (DragNDrop) -> Start drag at (TargetObject.X, TargetObject.Y) using Center on point
  // grab whatever the reticle is over and reel it toward the player

Event: TargetObject (DragNDrop) -> Is dragging
  Action: TargetObject (DragNDrop) -> Set drag point to (Player.X, Player.Y)

Event: On "Throw" key pressed
  Action: TargetObject (DragNDrop) -> Set throw velocity to (cos(Player.Angle) * 900, sin(Player.Angle) * 900)
  Action: TargetObject (DragNDrop) -> Drop (Release)
Event: TargetObject (DragNDrop) -> On dropped
  Action: TargetObject (Physics) -> Set velocity to (Self.DragNDrop.ThrowVelocityX, Self.DragNDrop.ThrowVelocityY)
```

Note: Set throw velocity overrides the measured flick, so the object launches along the player's aim rather than wherever the drag point happened to be moving.

### 23. Chess piece onto the square under the cursor

**Scenario:** A chess piece is larger than a board square, so it should land on whichever square the cursor is over, not the square nearest the piece's centre.

```text
Event: On start of layout
  For each BoardSquare
  Action: ChessPiece (DragNDrop) -> Add snap object BoardSquare
  Action: ChessPiece (DragNDrop) -> Set snap mode to Overlap (collision)
  // a piece overlaps several squares at once, so distance from the piece is ambiguous

Event: On Left mouse button Clicked on ChessPiece
  Action: ChessPiece (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
Event: ChessPiece (DragNDrop) -> Is dragging
  Action: ChessPiece (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: On Left mouse button Released
  Action: ChessPiece (DragNDrop) -> Drop (Release)
Event: ChessPiece (DragNDrop) -> On snapped
  Action: ChessPiece -> Set instance variable TargetSquare to ChessPiece.DragNDrop.SnappedObjectUID
  // the piece is already centred on the hovered square; validate the move from here
```

Note: Overlap mode hit-tests the cursor against each square, so the piece snaps to exactly the square under the pointer even though it covers several. No snap radius is needed in overlap mode, and On Snapped places the piece on that square and hands you its UID.

### 24. Trading card onto a play zone

**Scenario:** Drop a card onto whichever large play zone the cursor is inside, even when the card sits near two zones at once.

```text
Event: On start of layout
  For each DropZone
  Action: Card (DragNDrop) -> Add snap object DropZone
  Action: Card (DragNDrop) -> Set snap mode to Overlap (collision)
  // detection is by the cursor being inside a zone, never by the card's drifting centre

Event: On Left mouse button Clicked on Card
  Action: Card (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
Event: Card (DragNDrop) -> Is dragging
  Action: Card (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: Card (DragNDrop) -> Is dragging
  Condition: Card (DragNDrop) -> Is snapping
  Action: PlayHint -> Set visible
  // "valid drop" cue while the cursor is over any zone
Event: Card (DragNDrop) -> Is dragging
  Condition: Card (DragNDrop) -> Is snapping (inverted)
  Action: PlayHint -> Set invisible

Event: On Left mouse button Released
  Action: Card (DragNDrop) -> Drop (Release)
Event: Card (DragNDrop) -> On snapped
  Action: System -> Play card Card into zone Card.DragNDrop.SnappedObjectUID
Event: Card (DragNDrop) -> On dropped
  Condition: Card (DragNDrop) -> Is snapping (inverted)
  Action: Card -> Set position to (Card.HandX, Card.HandY)
  // released outside every zone, so return to hand
```

Note: Because a target is active only while the cursor is inside it, the card never snaps to the wrong zone just because its centre drifted toward a neighbour. Is snapping drives the live "valid drop" cue, and SnappedObjectUID names the zone that received the card.

### 25. Merge or craft by dragging one item onto another

**Scenario:** Dragging an item onto another item combines them, where the snap is the two objects overlapping.

```text
Event: On start of layout
  For each Item
  Action: Item (DragNDrop) -> Add snap object Item
  Action: Item (DragNDrop) -> Set snap mode to Overlap (collision)
  // every Item can snap onto any other Item it is dragged over (it never snaps to itself)

Event: On Left mouse button Clicked on Item
  Action: Item (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
Event: Item (DragNDrop) -> Is dragging
  Action: Item (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: On Left mouse button Released
  Action: Item (DragNDrop) -> Drop (Release)
Event: Item (DragNDrop) -> On snapped
  Action: System -> Combine Item with object Item.DragNDrop.SnappedObjectUID
```

Note: Registering the whole Item type is safe because a piece never snaps to its own instance. In overlap mode an item target counts when the dragged item overlaps it, so dropping one item on top of another fires On Snapped with the other item's UID, ready for a merge or craft.

### 26. Map marker onto an irregular territory

**Scenario:** Drop a marker onto an irregularly shaped territory and register the region the cursor is actually inside, which a circular radius cannot represent, without teleporting the marker to the region's origin.

```text
Event: On start of layout
  For each Territory
  Action: Marker (DragNDrop) -> Add snap object Territory
  Action: Marker (DragNDrop) -> Set snap mode to Overlap (collision)
  // territories are irregular collision polygons; a radius around their origin would be wrong

Event: On Left mouse button Clicked on Marker
  Action: Marker (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
Event: Marker (DragNDrop) -> Is dragging
  Action: Marker (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)

Event: On Left mouse button Released
  Action: Marker (DragNDrop) -> Drop (Release)
Event: Marker (DragNDrop) -> On snapped
  Action: System -> Assign marker to territory Marker.DragNDrop.SnappedObjectUID
  Action: Marker -> Set position to (Marker.DragNDrop.DragPointX, Marker.DragNDrop.DragPointY)
  // keep the marker where it was dropped; only record which territory it landed on
Event: Marker (DragNDrop) -> On dropped
  Condition: Marker (DragNDrop) -> Is snapping (inverted)
  Action: Marker -> Set position to (Marker.HomeX, Marker.HomeY)
  // dropped on the sea with no territory under the cursor, so snap back home
```

Note: Overlap mode tests the cursor against each territory's collision shape, so an irregular region is matched exactly where a radius cannot. A drop normally moves the object onto the target's origin, so here On Snapped repositions the marker to DragPointX/Y to leave it exactly where the player dropped it.

### Other game use cases

- **Puzzle games:** Drag pieces into place, lock them to directions, and snap them home on drop.
- **Match-three games:** Drag tiles with 4 Directions and a short break distance Cancel so an over-pull snaps back instead of misfiring a swap.
- **Tower defense games:** Drag a placement preview around the map, snapping to valid build nodes and validating the spot in On Dropped.
- **Platformers:** Use Up & Down or Left & Right for moving platforms, grappling anchors, and levers that must move on a single rail.
- **Roguelikes:** Drag relic cards and ability tokens with custom grab offsets, routing the measured throw into flick-to-equip gestures.
- **Card games:** Build hand management and table dragging, using throw velocity for flick-to-discard and break distance for snap-back.
- **Point-and-click adventures:** Grab scene objects, carry them to a hotspot, and snap them onto valid targets registered as snap objects.
- **Physics sandboxes:** Drag, swing, and fling objects into Physics with the auto-measured throw, no accumulator code anywhere.
- **HUD and menu design:** Move panels, windows, and toolbars with the same behaviour that powers gameplay objects, with follow speed for a soft feel.
- **Rhythm games:** Drag tempo sliders and note lanes with a single-axis direction lock so they only move along their intended direction.
- **Crafting games:** Drag ingredients into a recipe grid with snap positions, and confirm combinations on snap.
- **Management and strategy games:** Move units and build previews, snapping to grid cells and confirming the move in On Dropped.
- **VR-style and 3D-pointer interfaces:** Drive the drag point from a VR or ray pointer, with hold-to-grab gestures and no mouse coupling.
- **Board games:** Drag pieces with 8 Directions that snap to squares using overlap mode.
- **Tile and level editors:** Drag tiles that snap to a grid of positions for clean placement.
- **Tutorials and QA tools:** Replay recorded drags through the same actions so automated runs match real input exactly.
- **Accessibility-first games:** Start and stop drags from switch, dwell, or eye-gaze input without changing the object's drag logic.
- **Slingshot and launch games:** Pull back, release, and read ThrowSpeed and the throw components to launch a projectile.
- **Inventory-heavy RPGs:** Dozens of draggable items sharing one configuration, each magnetising to slots and respecting direction locks.
- **Sandbox toys and creativity apps:** Let players grab, arrange, and fling objects freely, with optional snapping to keep layouts tidy.

## 18. C3 Debugger

Drag N Drop exposes its live state in the Construct 3 debugger under a section named after the behaviour. Open the debugger from the Construct 3 menu (or run the preview with the debugger view) while a layout is active, then select an instance carrying the behaviour and read the values in real time as you drag. All fields are prefixed with `$` per convention. Inspection lives here, there is no debug-overlay property on the placed instance.

| Field | What it means |
| --- | --- |
| `$enabled` | Current enabled state of the behaviour. |
| `$dragging` | Whether a drag is in progress. |
| `$dragPointX` | Current drag point X. |
| `$dragPointY` | Current drag point Y. |
| `$distanceFromPoint` | Live gap in pixels between the object and the drag point. |
| `$directions` | Current direction lock mode. |
| `$followSpeed` | Current follow speed cap in pixels per second. |
| `$breakDistance` | Current break distance (0 means disabled). |
| `$snapRadius` | Current snap and magnet radius (0 means disabled in Radius mode). |
| `$snapMode` | How snapping detects a target: `"radius"` or `"overlap"`. |
| `$magnetStrength` | Current live homing pull (0 to 1). |
| `$isSnapping` | Whether the object is within snap range of a target right now. |
| `$throwVelocityX` | Measured throw velocity X (meaningful at drop time). |
| `$throwVelocityY` | Measured throw velocity Y (meaningful at drop time). |

The enabled, drag point, follow speed, break distance, snap radius, and magnet strength fields are editable in the debugger, so you can tune the feel of a drag while it is live without changing your events.

## 19. Scripting

Drag N Drop's actions are exposed to the Construct 3 scripting interface, and its triggers can be listened to from JavaScript. This lets you drive a drag entirely from script, which is handy for custom tools, AI agents, or integration code.

### Accessing the behaviour

Reach the behaviour through the object instance. The accessor name comes from the behaviour's name **in your project**, not the addon ID. If you keep the default name "Drag N Drop", use bracket notation because of the spaces, or rename the behaviour in the editor to a single word such as `DragNDrop` to allow dot notation.

```javascript
const inst = runtime.objects.Sprite.getFirstInstance();
const drag = inst.behaviors["Drag N Drop"]; // or inst.behaviors.DragNDrop if renamed
```

### Calling actions from script

Exposed actions are copied directly onto the behaviour instance, so calling one from script produces the same result as the event-sheet action. Method names are **PascalCase**, taken from the ACE name. **Combo parameters arrive as 0-based indices.**

```javascript
// grabMode: 0 = keep_offset, 1 = center_on_point
drag.StartDrag(inst.x, inst.y, 0);

// steer the object each tick
drag.SetDragPoint(pointerX, pointerY);

// options
drag.SetFollowSpeed(600);
drag.SetDirections(2);        // 0 = free, 1 = up_down, 2 = left_right, 3 = four_dir, 4 = eight_dir
drag.SetBreakDistance(80, 0); // action: 0 = drop, 1 = cancel

// snapping and magnetism
drag.AddSnapPosition(320, 240);
drag.AddSnapObject(slotInst);  // pass an object instance
drag.SetSnapRadius(48);
drag.SetSnapMode(1);           // 0 = radius (distance), 1 = overlap (collision)
drag.SetMagnetStrength(0.5);   // 0..1
drag.ClearSnapTargets();

// throw and state
drag.SetThrowVelocity(0, 0);  // suppress the next throw
drag.SetEnabled(true);

// how: 0 = release, 1 = cancel
drag.Drop(0);
```

Combo index maps for reference:

- StartDrag grab mode: `["keep_offset", "center_on_point"]`
- Drop how: `["release", "cancel"]`
- SetDirections directions: `["free", "up_down", "left_right", "four_dir", "eight_dir"]`
- SetBreakDistance action: `["drop", "cancel"]`
- SetSnapMode mode: `["radius", "overlap"]`

### Listening to events from script

Each trigger is dispatched by its condition name, so add a listener with that name.

```javascript
drag.addEventListener("OnDragStarted", () => console.log("drag started"));
drag.addEventListener("OnDropped", () => console.log("dropped"));
drag.addEventListener("OnDragCancelled", () => console.log("cancelled"));
drag.addEventListener("OnSnapped", () => console.log("snapped to a target"));
```

### A complete example

```javascript
function driveDrag(runtime) {
  const inst = runtime.objects.Sprite.getFirstInstance();
  const drag = inst.behaviors["Drag N Drop"];

  drag.SetFollowSpeed(800);
  drag.SetBreakDistance(120, 0); // auto-drop past 120px

  // register every slot as a magnet target
  for (const slot of runtime.objects.Slot.instances()) {
    drag.AddSnapObject(slot);
  }
  drag.SetSnapRadius(40);
  drag.SetMagnetStrength(0.5);

  drag.addEventListener("OnSnapped", () => console.log("placed in a slot"));

  // begin a drag centred on the object
  drag.StartDrag(inst.x, inst.y, 1);

  // in your own tick loop, steer it
  runtime.addEventListener("tick", () => {
    if (drag) drag.SetDragPoint(runtime.mouse.getMouseX(), runtime.mouse.getMouseY());
  });
}
```

Notes:

- Expressions (DragPointX, ThrowSpeed, SnapTargetX, and so on) are **not** callable from script. They are event-sheet expressions only. Read live state from the debugger or maintain your own values in script.
- The behaviour reads the drag point from whatever you pass to SetDragPoint, so any input source works the same from script as it does from events.

## 20. Tips and Common Mistakes

- **Call Set Drag Point every tick while dragging.** If you only call Start Drag, the object grabs but never moves, because nothing updates the point it follows.
- **Start Drag is ignored while already dragging.** To switch objects, call Drop on the current one first. There is no force-grab action by design.
- **Drop is ignored when not dragging.** Guard your drop logic with Is dragging if you fire Drop from a broad event such as a global mouse-up.
- **Follow speed is a pixels-per-second cap, not a percentage.** A value like 0.2 makes the object crawl. Use 0 for instant, or a value in the hundreds-to-thousands range for a responsive feel.
- **Directions round the movement, not the grab offset.** 4 Directions and 8 Directions snap each tick's movement toward the cursor, so the object steps toward the pointer along clean axis or diagonal lines and still reaches it, rather than locking to a single ray.
- **Snapping needs targets, plus a radius or overlap mode.** Register at least one Add snap position or Add snap object (a For each loop handles many at once). In Radius mode also set a snap radius above 0; Overlap mode works without one.
- **Use Overlap snap mode to snap by the cursor, not the object.** Radius mode measures from the object, which lags under a slow follow speed. Overlap mode hit-tests the drag position against the target, so the piece snaps to whatever is under the cursor.
- **Magnet strength is 0 to 1.** 0 snaps only on drop, 1 is a strong live pull. Values outside that range are clamped.
- **A snap suppresses the throw.** A release that lands on a target reports a zero throw, so do not expect momentum out of a snapped drop.
- **Break distance needs a follow speed.** It only fires once the object lags behind the drag point. With follow speed 0 the object snaps onto the cursor every tick, so the gap never grows.
- **Read throw values inside On Dropped.** ThrowVelocityX, ThrowVelocityY, and ThrowSpeed are meaningful at release time. A Cancel produces no throw.
- **Disabling the behaviour cancels the current drag.** Set enabled No ends an in-progress drag immediately, so re-enable and re-grab if you need to continue.
- **The dragging state is not saved.** If a save happens mid-drag, the object loads as not dragging, though your panel options and snap targets persist.

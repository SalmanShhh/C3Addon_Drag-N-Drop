# Drag N Drop Guide

Drag N Drop is a Construct 3 behaviour that is a drop-in replacement for the built-in Drag & Drop, rebuilt so that **you** decide when a drag starts and stops. The built-in behaviour is permanently wired to the mouse or touch. Drag N Drop is driven through events instead, so a controller button, a touch gesture, an AI routine, or a virtual cursor can all start and stop a drag through the same two actions. While an object is dragged it follows a **drag point** you update each tick (usually the cursor or touch position). The behaviour can push the object out of solids, constrain it to a direction set, magnetise it toward snap targets, auto-drop it when it gets pulled too far, and it measures throw velocity for you so flick-to-throw needs no manual tracking. This guide explains how the behaviour works and how to wire every property, action, condition, expression, and debugger field into a real project.

## Table of Contents

1. [Scenarios Where This Addon Excels](#1-scenarios-where-this-addon-excels)
2. [Core Concepts](#2-core-concepts)
3. [Project Setup](#3-project-setup)
4. [Behaviour Properties](#4-behaviour-properties)
5. [Drag Lifecycle: Start Drag and Drop](#5-drag-lifecycle-start-drag-and-drop)
6. [The Drag Point](#6-the-drag-point)
7. [Grab Modes and Follow Speed](#7-grab-modes-and-follow-speed)
8. [Directions (Movement Lock)](#8-directions-movement-lock)
9. [Solid Collision and Break Distance](#9-solid-collision-and-break-distance)
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
- **Drag-through-walls prevention**: Inventory grids, board games, and tile editors where pieces must respect solid panels or occupied cells. Solid push-out handles it with one toggle.
- **Snap-to-grid and magnetic slots**: Inventory slots, jigsaw boards, and node editors where pieces pull toward and lock onto targets. Snapping and magnetism handle it with a radius and a strength.
- **Tear-free interactions**: Drag a stuck or snagged object until the gap grows, then have it automatically drop free. Break distance gives this with no distance maths.
- **Puzzle games at scale**: Dozens of draggable pieces, each respecting direction locks and solids, all sharing one behaviour configuration.
- **Accessibility-driven input**: Switch-access, eye-gaze, or dwell-click systems can start and stop drags from any event without touching the object's drag logic.

## 2. Core Concepts

### The problem this addon solves

The built-in Drag & Drop behaviour bakes the mouse and touch connection into its engine. The moment you need gamepad dragging, a hold-to-pick-up gesture, a custom drag handle, or a VR pointer, you fall back to hand-built logic: per-frame `Set X` and `Set Y` events, instance variables tracking velocity for a throw, and a per-object "is dragging" boolean copied across every draggable type. Stopping an object being dragged through a wall, snapping it to a grid, or tearing a stuck object free all mean writing distance and overlap maths by hand every frame.

Drag N Drop replaces that with two actions, **Start Drag** and **Drop**, that you fire from any event, plus a **Set Drag Point** action you call each tick to steer the object. Pushing out of solids is one toggle. Snapping to targets is a radius plus a list of snap points. Auto-dropping a stuck object is one action with a distance and a choice. Throw velocity is measured for you and returned when the object drops.

### Key design decisions

- **You own the drag point, Drag N Drop reads it.** The behaviour never reads the mouse or any input device. You call Set Drag Point each tick. The object follows that point. If you never set it, the object does not move while dragged.
- **Start and stop are events, never automatic.** Start Drag begins a drag, Drop ends it. Hover detection, click radius, and hold gestures are your event-sheet conditions.
- **One action covers both ways to end a drag.** Drop takes a *How* choice. **Release** fires On Dropped and applies the measured throw. **Cancel** ends the drag silently with no throw and fires On Drag Cancelled.
- **Push-out and break distance work together.** Turn on solid collision and the dragged object cannot pass through solids. Set a break distance and, when the gap to the drag point grows past it, the object automatically drops or cancels.
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
| **Solid Collision** | When on, the dragged object is pushed out of solids each tick and cannot be dragged through them. |
| **Break Distance** | The maximum gap allowed between the object and the drag point. Exceeding it auto-drops or auto-cancels the drag. |
| **Snap Target** | A registered position or object the dragged object can magnetise toward and snap onto. |
| **Throw Velocity** | The release velocity measured from recent drag-point movement, handed back on drop for you to apply. |

## 3. Project Setup

1. Add the **Drag N Drop** behaviour to any world object (a Sprite, 9-patch, Tiled Background, and so on).
2. In the Properties Panel, leave **Enabled** checked and set any of Follow Speed, Directions, Solid Collision, or Break Distance you want as defaults. Everything has a working default, so you can leave them all alone.
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

That is the whole loop: one action to start, one to steer each tick, one to stop. Everything else (directions, solids, break distance, snapping, throw scaling) is optional and layered on top.

## 4. Behaviour Properties

The panel keeps a small set of the most common defaults. Every one of them can also be changed at runtime through its matching action, so the panel value is just the starting point.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| **Enabled** | Boolean | true | Whether the behaviour is active when the layout starts. |
| **Follow Speed** | Number | 0 | Max speed in pixels per second the object catches up to the drag point. 0 is an instant snap. |
| **Directions** | Combo | Free (360) | Movement lock: Free, Up & Down, Left & Right, 4 Directions, or 8 Directions. |
| **Solid Collision** | Boolean | false | When on, the object is pushed out of solids and cannot be dragged through them. |
| **Break Distance** | Number | 0 | Gap to the drag point that auto-ends the drag. 0 disables it. |
| **Break Action** | Combo | Drop | What a break-distance end does: Drop applies the throw, Cancel ends silently. |

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

**Directions** constrains how the dragged object is allowed to move, in the same style as the 8Direction and VectorCursor behaviours. The constraint is measured from the position where the drag began, so the object slides along allowed directions out of its grab point.

| Option | Movement |
| --- | --- |
| **Free (360)** | No constraint. The object follows the drag point freely. This is the default. |
| **Up & Down** | Vertical only. The object's X is held at its grab position. |
| **Left & Right** | Horizontal only. The object's Y is held at its grab position. |
| **4 Directions** | Movement snaps to the nearest cardinal direction (up, down, left, right) from the grab point. |
| **8 Directions** | Movement snaps to the nearest of eight compass directions (the cardinals plus the diagonals) from the grab point. |

```text
Event: On start of layout
  Action: Knob (DragNDrop) -> Set directions to Left & Right
  // the knob can now only slide along its track

Event: On Left mouse button Clicked on Token
  Action: Token (DragNDrop) -> Set directions to 8 Directions
  Action: Token (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
  // the token slides along the nearest of 8 rays from where it was grabbed
```

**Gotcha:** Setting directions while a drag is already in progress re-captures the object's current position as the new origin, so the lock takes effect from where the object is now. With 4 Directions and 8 Directions, the object commits to whichever ray the drag point leans toward, so the active direction can switch as the player swings the pointer around the grab point.

## 9. Solid Collision and Break Distance

These two options are designed to be used together to give a natural "drag until it snags, then tear it free" feel with no manual distance code.

### Solid collision

Turn on **solid collision** and the dragged object is pushed out of solids each tick and cannot be dragged through them. The behaviour finds objects that carry an enabled **Solid** behaviour, resolves the overlap with a minimum-translation push, and fires **On Hit Solid** the first tick a push-out happens. The object lags behind the drag point while a solid blocks it, sliding along free space instead of passing through.

```text
Event: On start of layout
  Action: Item (DragNDrop) -> Set solid collision On
  // occupied inventory cells carry the Solid behaviour; the item slides around them

Event: Item (DragNDrop) -> On hit solid
  Action: Audio -> Play "bump" not looping
  // optional feedback when the item is blocked
```

**Gotcha:** Push-out is a per-tick correction, not a predictive sweep. Very fast drags at low frame rates may briefly clip thin solids before being corrected. Keep solids reasonably thick relative to drag speed.

### Break distance

**Break distance** is the maximum gap allowed between the object and the drag point. When solid collision holds the object back (or the cursor simply outruns it), the gap grows. Once it passes the break distance, the drag ends automatically. You choose what "end" means with the Break Action property or the Set break distance action:

- **Drop** applies the throw and fires On Dropped with DropReason `"broke_distance"`.
- **Cancel** ends silently and fires On Drag Cancelled.

A break distance of 0 (the default) disables this, and the object simply lags indefinitely and snaps back when the cursor returns.

```text
Event: On start of layout
  Action: Crate (DragNDrop) -> Set solid collision On
  Action: Crate (DragNDrop) -> Set break distance to 80 (Drop)
  // wedge the crate against a wall, keep pulling, and once the gap passes 80px it drops where it stuck

Event: Crate (DragNDrop) -> On dropped
  Condition: Crate (DragNDrop) -> Compare two values: DropReason = "broke_distance"
  Action: Crate -> Set animation to "Wedged"
```

**Gotcha:** Break distance measures the gap to the drag point, not the distance the object has travelled. With solid collision off and no blocker, the object usually keeps up with the drag point and the break never triggers unless the pointer moves faster than the follow speed allows.

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

Snapping lets the object pull toward and lock onto **snap targets** you register. A target is either a fixed world position or an object's position. The whole feature is opt-in: nothing happens until you set a **snap radius** above zero and add at least one target.

There are two effects, controlled separately:

- **Snap on drop** (always on once a radius is set): when a release ends within the snap radius of a target, the object is placed exactly on the nearest target, the throw is suppressed, and **On Snapped** fires.
- **Magnetism / homing** (controlled by **magnet strength**): while dragging, the object is pulled toward the nearest in-range target. A strength of 0 means no live pull (snap only happens on drop). A strength up to 1 pulls harder, and the pull grows stronger as the object nears the target.

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

**Gotcha:** Snapping uses the object's position, not the drag point, to find the nearest target. SnappedObjectUID is -1 when the snap was to a fixed position rather than an object, or when no snap occurred. A magnet strength above 0 with no in-range target does nothing, so it is safe to leave on.

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
| **Set solid collision** | Turns solid push-out on or off. When on, the object is pushed out of solids each tick and fires On Hit Solid while blocked. |
| **Set break distance** | Sets the maximum gap to the drag point before the drag auto-ends, and whether that end is a Drop or a Cancel. 0 disables it. |

### Snapping and magnetism

| Action | Description |
| --- | --- |
| **Add snap position** | Registers a world-space position as a snap and magnet target. |
| **Add snap object** | Registers an object's position as a snap and magnet target. Use a For each loop to add many at once. |
| **Clear snap targets** | Removes all registered snap positions and snap objects. |
| **Set snap radius** | Sets the distance within which the object snaps on drop and magnetises while dragging. 0 disables snapping. |
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
| **On hit solid** | Fires the first tick the object is pushed out of a solid (solid collision must be on). Read DistanceFromPoint for the current gap. |
| **On snapped** | Fires after a release that lands within snap radius of a target, alongside On Dropped. Read SnapTargetX, SnapTargetY, and SnappedObjectUID. |

## 15. Expressions Reference

| Expression | Returns | Description |
| --- | --- | --- |
| **DragPointX** | number | Current world-space X of the drag point. |
| **DragPointY** | number | Current world-space Y of the drag point. |
| **DistanceFromPoint** | number | Current gap in pixels between the object and the drag point. Grows while the object is blocked by a solid, and drives the break-distance check. |
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

### System C. Constraints (directions and solids)

Keeps movement predictable with a direction lock and solid push-out.

- Scenario: A rail piece should slide left and right only, and stop at barriers.

```text
Event: On start of layout
  Action: RailPiece (DragNDrop) -> Set directions to Left & Right
  Action: RailPiece (DragNDrop) -> Set solid collision On

Event: RailPiece (DragNDrop) -> On hit solid
  Action: RailPiece -> Set animation frame to 1
```

Tip: Directions and solid collision combine cleanly. The object tracks only along its allowed directions and halts at solids in the way.

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

### System E. Tear-free release with break distance

Lets a snagged object drop free once the gap grows past a limit.

- Scenario: A heavy object dragged against a wall should drop where it got wedged.

```text
Event: On start of layout
  Action: Anvil (DragNDrop) -> Set solid collision On
  Action: Anvil (DragNDrop) -> Set break distance to 100 (Drop)

Event: Anvil (DragNDrop) -> On dropped
  Condition: Anvil (DragNDrop) -> Compare two values: DropReason = "broke_distance"
  Action: Audio -> Play "thud" not looping
```

Tip: Pair break distance with solid collision so the gap only grows when something physically blocks the object.

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

### 4. Inventory grid with solid cells

**Scenario:** Occupied inventory cells block a dragged item so it cannot be pushed into a filled slot.

```text
Event: On Left mouse button Clicked on Item
  Action: Item (DragNDrop) -> Set solid collision On
  Action: Item (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: Item (DragNDrop) -> Is dragging
  Action: Item (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)
```

Note: Give occupied cells the Solid behaviour. The item slides along free space instead of overlapping a filled cell.

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

### 6. Tear-free tool drag

**Scenario:** A heavy tool dragged against a wall should force-drop where it wedged once the player keeps pulling.

```text
Event: On start of layout
  Action: Tool (DragNDrop) -> Set solid collision On
  Action: Tool (DragNDrop) -> Set break distance to 90 (Drop)

Event: On Left mouse button Clicked on Tool
  Action: Tool (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: Tool (DragNDrop) -> Is dragging
  Action: Tool (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)
```

Note: The object drops exactly where the player tried to wedge it, with no distance maths in your events.

### 7. Card combat with auto-cancel

**Scenario:** A card yanked far past the play area should cancel and snap back to hand instead of dropping into nowhere.

```text
Event: On start of layout
  Action: Card (DragNDrop) -> Set break distance to 200 (Cancel)

Event: Card (DragNDrop) -> On drag cancelled
  Action: Card -> Set position to (Card.HandX, Card.HandY)
```

Note: A break-distance Cancel ends silently and applies no throw, which is exactly what a snap-back wants.

### 8. Horizontal slider knob

**Scenario:** A knob must move along a track in the X direction only and stop at end-stops.

```text
Event: On start of layout
  Action: Knob (DragNDrop) -> Set directions to Left & Right
  Action: Knob (DragNDrop) -> Set solid collision On

Event: On Left mouse button Clicked on Knob
  Action: Knob (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: Knob (DragNDrop) -> Is dragging
  Action: Knob (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)
```

Note: Left & Right holds the knob's Y so it never drifts off its track.

### 9. Vertical lever

**Scenario:** A lever should move up and down only.

```text
Event: On start of layout
  Action: Lever (DragNDrop) -> Set directions to Up & Down

Event: On Left mouse button Clicked on Lever
  Action: Lever (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
```

Note: Up & Down is ideal for lifts, sliders, and inventory drawers.

### 10. Eight-direction board piece

**Scenario:** A strategy piece should slide along the eight compass directions from its starting square.

```text
Event: On Left mouse button Clicked on Piece
  Action: Piece (DragNDrop) -> Set directions to 8 Directions
  Action: Piece (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: Piece (DragNDrop) -> Is dragging
  Action: Piece (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)
```

Note: 8 Directions snaps the drag to diagonal and cardinal rays, which suits grid and board movement.

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

### 13. Snap to a fixed grid

**Scenario:** A tile editor should snap dragged tiles to a 32px grid.

```text
Event: On start of layout
  Action: Tile (DragNDrop) -> Set snap radius to 24
  Repeat 10 times (X)
    Repeat 10 times (Y)
    Action: Tile (DragNDrop) -> Add snap position (loopindex("X") * 32, loopindex("Y") * 32)

Event: Tile (DragNDrop) -> On snapped
  Action: Tile -> Set animation to "Placed"
```

Note: Add snap position builds a grid of targets, and the drop snaps the tile to the nearest cell centre.

### 14. Heavy object with follow lag

**Scenario:** A large object should feel weighty and trail behind a fast pointer.

```text
Event: On start of layout
  Action: Boulder (DragNDrop) -> Set follow speed to 250

Event: On Left mouse button Clicked on Boulder
  Action: Boulder (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: Boulder (DragNDrop) -> Is dragging
  Action: Boulder (DragNDrop) -> Set drag point to (Mouse.X, Mouse.Y)
```

Note: Lower follow speed for heavier feel, raise it toward instant for light, responsive objects.

### 15. Suppress the throw on a precise drop

**Scenario:** A placement piece should drop dead with no momentum.

```text
Event: On Left mouse button Released
  Action: PlacementPiece (DragNDrop) -> Set throw velocity to (0, 0)
  Action: PlacementPiece (DragNDrop) -> Drop (Release)
```

Note: Set throw velocity (0, 0) before Drop reports a zero throw to On Dropped.

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

### 19. Pause dragging during a cutscene

**Scenario:** All dragging should stop cleanly when the game enters a cutscene.

```text
Event: System -> On "cutscene_start"
  Action: Draggable (DragNDrop) -> Set enabled No

Event: System -> On "cutscene_end"
  Action: Draggable (DragNDrop) -> Set enabled Yes
```

Note: Disabling cancels any in-progress drag immediately, so input states never get stuck mid-drag.

### 20. Swap the active drag object

**Scenario:** Clicking a new object should take over dragging from the current one.

```text
Event: On Left mouse button Clicked on NewObject
  Action: OldObject (DragNDrop) -> Drop (Release)
  Action: NewObject (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset
```

Note: Drop first, then Start Drag, because a Start Drag on an already-dragging instance is ignored.

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

### 22. Drag to a trash zone

**Scenario:** Dropping a file icon over a bin deletes it, otherwise it returns.

```text
Event: On Left mouse button Clicked on FileIcon
  Action: FileIcon (DragNDrop) -> Start drag at (Mouse.X, Mouse.Y) using Keep offset

Event: FileIcon (DragNDrop) -> On dropped
  Condition: FileIcon is overlapping Bin
  Action: FileIcon -> Destroy

Event: FileIcon (DragNDrop) -> On dropped
  Condition: FileIcon is NOT overlapping Bin
  Action: FileIcon -> Set position to (FileIcon.HomeX, FileIcon.HomeY)
```

Note: The drop target is decided in your On Dropped handler, never by the behaviour.

### Other game use cases

- **Puzzle games:** Drag pieces into place, lock them to directions or keep them out of occupied cells with solids, and snap them home on drop.
- **Match-three games:** Drag tiles with 4 Directions and a short break distance Cancel so an over-pull snaps back instead of misfiring a swap.
- **Tower defense games:** Drag a placement preview around the map with solid collision so it cannot overlap blocked terrain, snapping to valid build nodes.
- **Platformers:** Use Up & Down or Left & Right for moving platforms, grappling anchors, and levers that must move on a single rail.
- **Roguelikes:** Drag relic cards and ability tokens with custom grab offsets, routing the measured throw into flick-to-equip gestures.
- **Card games:** Build hand management and table dragging, using throw velocity for flick-to-discard and break distance for snap-back.
- **Point-and-click adventures:** Grab scene objects, carry them to a hotspot, and snap them onto valid targets registered as snap objects.
- **Physics sandboxes:** Drag, swing, and fling objects into Physics with the auto-measured throw, no accumulator code anywhere.
- **HUD and menu design:** Move panels, windows, and toolbars with the same behaviour that powers gameplay objects, with follow speed for a soft feel.
- **Rhythm games:** Drag tempo sliders and note lanes with a single-axis direction lock so they only move along their intended direction.
- **Crafting games:** Drag ingredients into a recipe grid with snap positions, and confirm combinations on snap.
- **Management and strategy games:** Move units and build previews with solid collision so they respect occupied tiles, snapping to grid cells.
- **VR-style and 3D-pointer interfaces:** Drive the drag point from a VR or ray pointer, with hold-to-grab gestures and no mouse coupling.
- **Board games:** Drag pieces with 8 Directions that snap to squares and respect solid panels.
- **Tile and level editors:** Drag tiles that snap to a grid of positions and refuse to overlap locked regions via solids.
- **Tutorials and QA tools:** Replay recorded drags through the same actions so automated runs match real input exactly.
- **Accessibility-first games:** Start and stop drags from switch, dwell, or eye-gaze input without changing the object's drag logic.
- **Slingshot and launch games:** Pull back, release, and read ThrowSpeed and the throw components to launch a projectile.
- **Inventory-heavy RPGs:** Dozens of draggable items sharing one configuration, each magnetising to slots and respecting solids and direction locks.
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
| `$solidCollision` | Whether solid push-out is on. |
| `$breakDistance` | Current break distance (0 means disabled). |
| `$snapRadius` | Current snap and magnet radius (0 means disabled). |
| `$magnetStrength` | Current live homing pull (0 to 1). |
| `$isSnapping` | Whether the object is within snap range of a target right now. |
| `$throwVelocityX` | Measured throw velocity X (meaningful at drop time). |
| `$throwVelocityY` | Measured throw velocity Y (meaningful at drop time). |

The enabled, drag point, follow speed, solid collision, break distance, snap radius, and magnet strength fields are editable in the debugger, so you can tune the feel of a drag while it is live without changing your events.

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
drag.SetSolidCollision(true);
drag.SetBreakDistance(80, 0); // action: 0 = drop, 1 = cancel

// snapping and magnetism
drag.AddSnapPosition(320, 240);
drag.AddSnapObject(slotInst);  // pass an object instance
drag.SetSnapRadius(48);
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

### Listening to events from script

Each trigger is dispatched by its condition name, so add a listener with that name.

```javascript
drag.addEventListener("OnDragStarted", () => console.log("drag started"));
drag.addEventListener("OnDropped", () => console.log("dropped"));
drag.addEventListener("OnDragCancelled", () => console.log("cancelled"));
drag.addEventListener("OnHitSolid", () => console.log("hit a solid"));
drag.addEventListener("OnSnapped", () => console.log("snapped to a target"));
```

### A complete example

```javascript
function driveDrag(runtime) {
  const inst = runtime.objects.Sprite.getFirstInstance();
  const drag = inst.behaviors["Drag N Drop"];

  drag.SetFollowSpeed(800);
  drag.SetSolidCollision(true);
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
- **Directions lock relative to the grab point.** 4 Directions and 8 Directions snap the displacement out of where the object was grabbed, so the active direction can change as you swing the pointer around that point.
- **Snapping needs both a radius and targets.** Set snap radius above 0 and register at least one Add snap position or Add snap object, or nothing snaps. Use a For each loop to register many objects at once.
- **Magnet strength is 0 to 1.** 0 snaps only on drop, 1 is a strong live pull. Values outside that range are clamped.
- **A snap suppresses the throw.** A release that lands on a target reports a zero throw, so do not expect momentum out of a snapped drop.
- **Solid collision needs the Solid behaviour on the blockers.** Walls and occupied cells must carry an enabled Solid behaviour, or there is nothing to push out of.
- **Read throw values inside On Dropped.** ThrowVelocityX, ThrowVelocityY, and ThrowSpeed are meaningful at release time. A Cancel produces no throw.
- **Disabling the behaviour cancels the current drag.** Set enabled No ends an in-progress drag immediately, so re-enable and re-grab if you need to continue.
- **The dragging state is not saved.** If a save happens mid-drag, the object loads as not dragging, though your panel options and snap targets persist.

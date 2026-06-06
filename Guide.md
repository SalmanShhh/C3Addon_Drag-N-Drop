# DragNDrop Guide

DragNDrop is a behavior for Construct 3 that gives you full control over object grabbing, dragging, release, and throw behavior without being tied to the built in drag logic. It is useful when you want a draggable object to follow a pointer, clamp to a radius, lock to one axis, or preserve a custom grab offset while still staying event sheet friendly.

This guide explains how the behavior works, how to wire it into a project, and how to use its actions, conditions, expressions, and debugger support in real examples.

## Table of Contents

1. [Scenarios Where This Addon Excels](#1-scenarios-where-this-addon-excels)
2. [Core Concepts](#2-core-concepts)
3. [Project Setup](#3-project-setup)
4. [Plugin Properties](#4-plugin-properties)
5. [Feature Sections](#5-feature-sections)
6. [Actions Reference](#6-actions-reference)
7. [Conditions Reference](#7-conditions-reference)
8. [Expressions Reference](#8-expressions-reference)
9. [System Use Cases](#9-system-use-cases)
10. [Game Use Cases](#10-game-use-cases)
11. [Other Game Use Cases](#11-other-game-use-cases)
12. [C3 Debugger](#12-c3-debugger)
13. [Scripting](#13-scripting)
14. [Tips and Common Mistakes](#14-tips-and-common-mistakes)

## 1. Scenarios Where This Addon Excels

- **Precise dragging for UI panels**: Use it when a menu, inventory card, or dialog window needs deliberate grab and release rather than default pointer behavior.
- **Puzzle pieces with custom handles**: Keep a piece offset from the pointer so the user grabs the visible handle instead of the object center.
- **Throw and fling objects**: Let a dragged object keep momentum after release for physics like slings, darts, or swipe gestures.
- **Clamped drag zones**: Limit how far an object can move from its anchor so it stays in a defined area.
- **One axis only**: Lock movement to horizontal or vertical rails for sliders, tracks, and platform edges.
- **Pause or disable dragging cleanly**: Use the Enabled property and Set enabled action to stop interaction without destroying the behavior.
- **Debug friendly behavior**: Inspect live state in the debugger while testing a drag loop or release path.

## 2. Core Concepts

### The problem this addon solves

Construct 3 already provides a built in drag and drop behavior, but it is tied to the default input path. This addon replaces that with a simple event controlled system. You decide when dragging starts, when it ends, how far the object can move, and whether the object should keep momentum after release.

### Key design decisions

- The behavior is event driven, so the object does not grab itself unless you call an action.
- The anchor is the point the object follows during a drag.
- The grab offset lets the object keep a visual relationship to the pointer instead of snapping to the center.
- Distance clamp and axis lock are optional constraints that keep movement predictable.
- Throw velocity is derived from recent drag movement so you can create responsive fling effects.

### Key concepts at a glance

| Term | Meaning |
| --- | --- |
| Anchor | The world position the object follows while grabbed. |
| Grab offset | The distance between the pointer and the object during the drag. |
| Axis lock | Restricts movement to horizontal or vertical only. |
| Distance clamp | Limits how far the object can move from its origin. |
| Throw velocity | Momentum kept after release for fling style motion. |

## 3. Project Setup

1. Add the behavior to an object in Construct 3.
2. Set the Enabled property to true if you want the behavior active from the start.
3. Use a trigger such as On grabbed to begin drag logic.
4. Use the Grab action to start dragging from a chosen anchor point.
5. Use Release or ForceGrab as needed to finish a drag.

Example event sheet flow:

```text
Event: On Left Mouse Down on Sprite
  Condition: DragNDrop is enabled
  Action: DragNDrop -> Grab at 100, 100 using Keep offset

Event: DragNDrop -> On grabbed
  Action: Set text to "Dragging"

Event: DragNDrop -> On released
  Action: Set text to "Released"
```

A minimal working setup is to place the behavior on a sprite, then trigger Grab from a pointer event and use the release condition to run follow up logic.

## 4. Plugin Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| Enabled | Boolean | true | Starts the behavior in an enabled state. |

## 5. Feature Sections

### Drag and release control

Use this when you want to decide exactly when an object enters and exits drag mode. The Grab action starts a drag session and the Release action ends it. ForceGrab is useful when you need to interrupt an existing drag and start a new one without waiting for the previous event to finish.

Example:

```text
Event: Left Mouse Down on Card
  Action: DragNDrop -> Grab at Mouse.X, Mouse.Y using Keep offset

Event: Left Mouse Up
  Action: DragNDrop -> Release
```

### Anchor and grab offset

Use SetAnchor and SetGrabOffset when the object should follow a custom point or keep a visual offset from the pointer. This is helpful for dragging from a handle or a thumb position rather than the object center.

Example:

```text
Event: On start of layout
  Action: DragNDrop -> SetAnchor to 320, 180
  Action: DragNDrop -> SetGrabOffset to 12, 24
```

### Axis lock and clamp radius

Use SetAxisLock to lock the object to a rail and SetDistanceClamp to stop it from going too far. A clamp radius of 0 disables the limit.

Example:

```text
Event: On start of layout
  Action: DragNDrop -> SetAxisLock to Horizontal
  Action: DragNDrop -> SetDistanceClamp to 120
```

### Follow speed and throw velocity

Use SetFollowSpeed to smooth the object as it moves to the grab target. Use SetThrowVelocity or ClearThrowVelocity to inject or reset fling momentum after release.

Example:

```text
Event: On start of layout
  Action: DragNDrop -> SetFollowSpeed to 0.12

Event: DragNDrop -> On released
  Action: DragNDrop -> SetThrowVelocity to 200, -40
```

## 6. Actions Reference

| Action | Description |
| --- | --- |
| Grab | Starts dragging from the provided anchor position and grab mode. |
| Release | Ends the current drag and computes a release result. |
| ForceGrab | Forces a new grab even if another drag is currently active. |
| CancelGrab | Cancels the current drag without a normal release path. |
| SetAnchor | Changes the anchor position used during the drag. |
| SetAnchorToObject | Uses an object center as the anchor position. |
| SetGrabOffset | Sets the offset between the object and the drag anchor. |
| SetAxisLock | Locks movement to none, horizontal, or vertical. |
| SetDistanceClamp | Limits the maximum distance from the grab origin. |
| SetFollowSpeed | Controls how quickly the object catches up to the target position. |
| SetThrowVelocity | Overrides the release momentum. |
| ClearThrowVelocity | Removes any manual throw override. |
| SetEnabled | Enables or disables the behavior at runtime. |

## 7. Conditions Reference

| Condition | Description |
| --- | --- |
| IsHeld | Returns true while the object is currently being dragged. |
| IsEnabled | Returns true when the behavior is enabled. |
| IsAtDistanceLimit | Returns true when the object has reached the clamp limit. |
| WasThrown | Returns true if the release produced noticeable throw momentum. |
| OnGrabbed | Triggered when a drag starts. |
| OnReleased | Triggered when a drag ends normally. |
| OnGrabCancelled | Triggered when a drag is cancelled. |
| OnDistanceLimitReached | Triggered when the clamp radius is reached. |

## 8. Expressions Reference

| Expression | Returns | Description |
| --- | --- | --- |
| AnchorX | number | Current anchor X position. |
| AnchorY | number | Current anchor Y position. |
| GrabOriginX | number | X position where the drag started. |
| GrabOriginY | number | Y position where the drag started. |
| GrabOffsetX | number | Horizontal grab offset. |
| GrabOffsetY | number | Vertical grab offset. |
| DistanceFromOrigin | number | Distance from the grab origin to the current position. |
| ClampRadius | number | Current clamp distance. |
| ThrowVelX | number | Horizontal throw velocity on release. |
| ThrowVelY | number | Vertical throw velocity on release. |
| ThrowSpeed | number | Overall throw speed magnitude. |
| IsHeldValue | number | Numeric held state for use in expressions. |

## 9. System Use Cases

### System 1. Grab and release cycle

This system handles the start and end of a drag session.

- Scenario: A card should start moving only after the player presses and holds it.

```text
Event: On Left Mouse Down on Card
  Action: DragNDrop -> Grab at Mouse.X, Mouse.Y using Keep offset

Event: DragNDrop -> On grabbed
  Action: Set text to "Grabbed"

Event: Left Mouse Up
  Action: DragNDrop -> Release

Event: DragNDrop -> On released
  Action: Set text to "Released"
```

Tip: Use ForceGrab when you want to interrupt one drag and immediately start another.

### System 2. Anchor and offset handling

This system lets the object keep a relative position to the pointer.

- Scenario: The player grabs a slider handle from its visible top edge.

```text
Event: On start of layout
  Action: DragNDrop -> SetAnchor to 180, 140
  Action: DragNDrop -> SetGrabOffset to 0, -18
```

Tip: The offset is what makes the handle feel natural instead of snapping to the center.

### System 3. Constraint systems

This system adds clamp and axis lock rules.

- Scenario: A token should move only inside a ring and never leave the allowed area.

```text
Event: On start of layout
  Action: DragNDrop -> SetDistanceClamp to 96
  Action: DragNDrop -> SetAxisLock to Horizontal
```

Tip: Set the clamp to 0 to disable the limit entirely.

### System 4. Throw and momentum

This system keeps movement after the player lets go.

- Scenario: A disc should keep sliding after a quick swipe.

```text
Event: DragNDrop -> On released
  Condition: DragNDrop -> WasThrown
  Action: Set text to "Fling active"
```

Tip: Use ClearThrowVelocity if you want the release to stop cleanly instead of carrying momentum.

## 10. Game Use Cases

### 1. Simple drag puzzle piece

**Scenario:** A puzzle tile should move with the mouse and stop when the player releases it.

```text
Event: On Left Mouse Down on Tile
  Action: DragNDrop -> Grab at Mouse.X, Mouse.Y using Keep offset

Event: Left Mouse Up
  Action: DragNDrop -> Release
```

Note: This is the simplest working setup and is ideal for drag and drop puzzle logic.

### 2. Inventory slot drag

**Scenario:** A player drags an item card from a backpack panel into a slot.

```text
Event: On Left Mouse Down on ItemCard
  Action: DragNDrop -> Grab at Mouse.X, Mouse.Y using Keep offset

Event: DragNDrop -> On released
  Condition: ItemCard is overlapping Slot
  Action: Move ItemCard to Slot.X, Slot.Y
```

Note: Keep the drag offset to make the card feel attached to the cursor.

### 3. Horizontal slider

**Scenario:** A knob must move along a track only in the X direction.

```text
Event: On start of layout
  Action: DragNDrop -> SetAxisLock to Horizontal

Event: On Left Mouse Down on Knob
  Action: DragNDrop -> Grab at Mouse.X, Mouse.Y using Snap to anchor
```

Note: Horizontal lock prevents accidental vertical drift.

### 4. Vertical ladder grab

**Scenario:** A rung should move only up and down.

```text
Event: On start of layout
  Action: DragNDrop -> SetAxisLock to Vertical
```

Note: This is useful for lifts, handles, or inventory drawers.

### 5. Clamped radial menu

**Scenario:** A radial menu item should never leave a ring around the center.

```text
Event: On start of layout
  Action: DragNDrop -> SetDistanceClamp to 120

Event: On Left Mouse Down on MenuItem
  Action: DragNDrop -> Grab at Mouse.X, Mouse.Y using Keep offset
```

Note: Clamp radius gives you a natural dead zone and a boundary.

### 6. Swipe to fling a token

**Scenario:** A token should keep moving after a quick flick.

```text
Event: DragNDrop -> On released
  Condition: DragNDrop -> WasThrown
  Action: Set speed to DragNDrop.ThrowSpeed
```

Note: This is useful for paper darts, cards, and quick fling interactions.

### 7. Grab handle with custom offset

**Scenario:** The player grabs the handle of a lever, not the center of the sprite.

```text
Event: On Left Mouse Down on Handle
  Action: DragNDrop -> SetGrabOffset to 0, -16
  Action: DragNDrop -> Grab at Mouse.X, Mouse.Y using Keep offset
```

Note: The offset makes the object feel anchored to the real handle point.

### 8. Pause drag mode during a cutscene

**Scenario:** Dragging should pause when the game enters a cutscene or menu state.

```text
Event: System -> On pause
  Action: DragNDrop -> SetEnabled to false

Event: System -> On resume
  Action: DragNDrop -> SetEnabled to true
```

Note: This avoids broken input states during transitions.

### 9. Force grab a new object

**Scenario:** A new object should take over dragging immediately, even if another object is already held.

```text
Event: On Left Mouse Down on NewObject
  Action: DragNDrop -> ForceGrab at Mouse.X, Mouse.Y using Keep offset
```

Note: ForceGrab is the safe way to swap the active drag target.

### 10. Distance limit trigger for a rope swing

**Scenario:** A rope or swing should trigger a warning when the user pulls too far.

```text
Event: DragNDrop -> OnDistanceLimitReached
  Action: Create object at Rope.X, Rope.Y
```

Note: This works well for tension, rope, and limit based interactions.

### 11. Save and restore drag state

**Scenario:** A draggable object should remember where it was after the player reloads the layout.

```text
Event: On start of layout
  Condition: Save data contains previous position
  Action: Set object position to saved anchor values
```

Note: The behavior already supports save and load data for its own state fields.

### 12. Multi object drag board

**Scenario:** Several cards on a board should be draggable, but only one should be active at a time.

```text
Event: On Left Mouse Down on CardA
  Action: DragNDrop -> ForceGrab at Mouse.X, Mouse.Y using Keep offset

Event: On Left Mouse Down on CardB
  Action: DragNDrop -> ForceGrab at Mouse.X, Mouse.Y using Keep offset
```

Note: ForceGrab makes it easy to switch the active card cleanly.

## 11. Other Game Use Cases

- **Puzzle games**: Drag pieces into place, clamp them to valid zones, and use release events to snap them into a solved position.
- **Match three games**: Use the grab and release flow to drag tiles, swap pieces, and allow fling style movement for quick gestures.
- **Tower defense games**: Drag a placement preview around a map and use clamp logic to keep it inside the arena.
- **Platformer games**: Use the one axis lock to make moving platforms, grappling hooks, or levers feel precise.
- **Roguelike games**: Use drag based inventory items, relic cards, and ability wheels with custom offsets and release momentum.
- **Card games**: Build hand management, table dragging, and flick to discard behavior with the throw system.
- **Point and click adventures**: Grab objects from the scene, move them to a hotspot, and release them only when the target is valid.
- **Physics sandbox games**: Let objects be dragged and flung with momentum for test chambers and toy interactions.
- **HUD and menu design**: Move panels, windows, and toolbars using the same behavior that powers gameplay objects.
- **Rhythm games**: Use grab based logic for beat markers, tempo sliders, or note lanes that need one axis control.
- **Crafting games**: Drag ingredients into a recipe area and use clamp and release conditions to confirm combinations.
- **Management games**: Move units, build previews, and selection cards with simple drag events and clear limits.
- **Puzzle platformers**: Combine axis locking, distance clamp, and follow speed to create polished moving blocks and controlled levers.
- **Story games**: Use drag interactions for inventory, dialogue options, and object inspection with a clean event sheet model.

## 12. C3 Debugger

The runtime includes debugger output for live inspection. Open the Construct 3 debugger while testing a layout to inspect values such as held, enabled, anchor, throw velocity, and distance from origin.

### What the debugger shows

- drag state such as held and enabled
- anchor coordinates and grab origin values
- throw velocity and throw speed
- distance from the origin and follow speed
- axis lock and clamp radius

| Field | What it means |
| --- | --- |
| $held | Whether the object is currently grabbed. |
| $enabled | Whether dragging is currently active. |
| $anchorX, $anchorY | The current anchor position. |
| $grabOriginX, $grabOriginY | The point where the drag started. |
| $throwVelX, $throwVelY | The current throw velocity. |
| $throwSpeed | The overall release speed magnitude. |
| $distanceFromOrigin | The current distance from the grab origin. |
| $axisLock | The current axis lock mode. |
| $distanceClamp | The clamp radius. |
| $followSpeed | The follow interpolation speed. |

To use the debugger, run the project in Construct 3 and open the debugger panel from the developer tools or the runtime debugger view while your layout is active.

## 13. Scripting

If you call actions from script, remember that the exposed ACE functions are available on the instance prototype. In Construct 3 script, you usually access the behavior through the object instance and its behavior reference.

Example:

```javascript
const inst = runtime.objects.MySprite.getFirstInstance();
const drag = inst.behaviors.DragNDrop;

if (drag) {
  drag.Grab(100, 100, 0);
  drag.SetFollowSpeed(0.18);
}
```

Notes:
- The behavior name in script comes from the project object name, not the addon id.
- Exposed actions are callable directly from script.
- Combo values arrive as 0 based indexes, so Keep offset is 0 and Snap to anchor is 1.
- Expressions are not the same as script getters; use runtime exposed values from the instance when available.

## 14. Tips and Common Mistakes

- Always call Grab before expecting On grabbed to fire.
- Use Keep offset when you want the sprite to stay visually attached to the pointer.
- Use Snap to anchor when the object should jump to the anchor point.
- Set the clamp radius to 0 when you want unlimited dragging.
- Use SetEnabled to pause the behavior instead of destroying it.
- If a fling feels too strong, lower follow speed or clear the manual throw override.
- Remember that combo parameters are 0 based indices in script.
- The anchor and grab origin are different values, so use the right one for the effect you want.

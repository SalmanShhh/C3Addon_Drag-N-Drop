<img src="./src/icon.svg" width="100" /><br>
# Drag N Drop
<i>Event-driven drag & drop: you decide when a drag starts and stops, and the object follows a drag point you update each tick. A drop-in replacement for Construct 3's built-in Drag & Drop, driven through Start Drag / Drop / Set Drag Point actions so a controller, touch gesture, AI routine, or virtual cursor can all drive it. Optional solid push-out, axis lock, break distance, and automatic throw-velocity measurement.</i> <br>
### Version 1.4.0.1

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/SalmanShhh/C3Addon_Drag-N-Drop/releases/download/salmanshh_dragndrop-1.4.0.1.c3addon/salmanshh_dragndrop-1.4.0.1.c3addon)
<br>
<sub> [See all releases](https://github.com/SalmanShhh/C3Addon_Drag-N-Drop/releases) </sub> <br>

---
<b><u>Author:</u></b> SalmanShh <br>
<sub>Made using [CAW](https://marketplace.visualstudio.com/items?itemName=skymen.caw) </sub><br>

## Table of Contents
- [Usage](#usage)
- [Examples Files](#examples-files)
- [Properties](#properties)
- [Actions](#actions)
- [Conditions](#conditions)
- [Expressions](#expressions)
---
## Usage
To build the addon, run the following commands:

```
npm i
npm run build
```

To run the dev server, run

```
npm i
npm run dev
```

## Examples Files
| Description | Download |
| --- | --- |
| Drag Example | [<img src="https://placehold.co/120x30/4493f8/FFF?text=Download&font=montserrat" width="120"/>](https://github.com/SalmanShhh/C3Addon_Drag-N-Drop/raw/refs/heads/main/examples/Drag%20Example.c3p) |

---
## Properties
| Property Name | Description | Type |
| --- | --- | --- |
| Follow Speed | Max speed in pixels per second the object catches up to the drag point. 0 = instant snap. | float |
| Directions | Constrains drag movement, 8Direction style: free, single-axis, or snapped to 4 / 8 directions. | combo |
| Break Distance | Gap to the drag point that auto-ends the drag. 0 disables it. | float |
| Follow Mode | How the object moves toward the drag point: Instant (snap), Constant Speed (uses Follow Speed), or Spring Physics (uses Spring Stiffness and Damping). | combo |
| Spring Stiffness | Spring acceleration coefficient (pixels/s^2 per pixel). 300 is a responsive, lively default. Only active when Follow Mode is Spring Physics. | float |
| Spring Damping | Velocity bleed-off per second that settles the bounce. 20 gives a gentle overshoot; ~2 * sqrt(stiffness) is critical damping (no overshoot). Only active when Follow Mode is Spring Physics. | float |
| Grid Cell Width | Tile width in pixels for the Grid follow mode. 0 leaves the X axis unsnapped. Override at runtime with Set grid. | float |
| Grid Cell Height | Tile height in pixels for the Grid follow mode. 0 leaves the Y axis unsnapped. Override at runtime with Set grid. | float |
| Grid Origin X | X offset of the grid origin in pixels. Shifts where cell boundaries fall. | float |
| Grid Origin Y | Y offset of the grid origin in pixels. Shifts where cell boundaries fall. | float |
| Enabled | Whether the behaviour is active when the layout starts. | check |


---
## Actions
| Action | Description | Params
| --- | --- | --- |
| Drop | Ends the current drag. Release applies the measured throw; Cancel ends silently. Ignored if not dragging. | How             *(combo)* <br> |
| Set drag point | Updates the world-space point the object follows. Call every tick while dragging. | X             *(number)* <br>Y             *(number)* <br> |
| Set drag point to object | Updates the world-space point the object follows to another object's position. Call every tick while dragging. | Object             *(object)* <br> |
| Set  enabled | Enables or disables the behaviour. Disabling cancels any in-progress drag. | Enabled             *(boolean)* <br> |
| Set throw velocity | Overrides the measured throw before a release. Pass 0, 0 to suppress the throw entirely. | Velocity X             *(number)* <br>Velocity Y             *(number)* <br> |
| Start drag | Begins dragging this object toward a drag point. Ignored if already dragging. | Drag point X             *(number)* <br>Drag point Y             *(number)* <br>Grab mode             *(combo)* <br> |
| Start drag at object | Begins dragging this object at the target's position and keeps the drag point glued to that object each tick, so it sticks to a moving target. Ignored if already dragging. | Object             *(object)* <br>Grab mode             *(combo)* <br> |
| Set break distance | If the gap to the drag point grows past the distance, the drag ends automatically. 0 disables this. | Distance             *(number)* <br>Action             *(combo)* <br> |
| Set directions | Constrains drag movement, 8Direction style: free, a single axis, or snapped to 4 / 8 directions. | Directions             *(combo)* <br> |
| Set follow mode | Switches how the object moves toward the drag point: Instant (snap each tick), Constant Speed (uses Follow Speed), Spring Physics (uses Spring Stiffness and Damping), or Grid (snaps to a tile grid set by the Set grid action). | Mode             *(combo)* <br> |
| Set follow speed | How fast the object catches up to the drag point, in pixels per second. 0 = instant snap. | Speed             *(number)* <br> |
| Set grid | Sets the tile grid used by the Grid follow mode: cell width and height plus an origin offset. While Follow Mode is Grid, the object snaps to the nearest cell. A width or height of 0 leaves that axis unsnapped. | Cell width             *(number)* <br>Cell height             *(number)* <br>Origin X             *(number)* <br>Origin Y             *(number)* <br> |
| Set spring | Sets the spring-physics parameters. Stiffness controls pull strength (pixels/s^2 per pixel of displacement); damping controls oscillation bleed-off (1/s). Does not switch the follow mode — use Set follow mode to Spring Physics first. | Stiffness             *(number)* <br>Damping             *(number)* <br> |
| Add snap object | Registers an object as a snap and magnet target by its position. Use a For each loop to add many. Needs a snap radius to take effect. | Object             *(object)* <br> |
| Add snap position | Registers a world-space position as a snap and magnet target. Needs a snap radius to take effect. | X             *(number)* <br>Y             *(number)* <br> |
| Clear snap targets | Removes all registered snap positions and snap objects. |  |
| Set magnet strength | How strongly the object is pulled toward an in-range snap target while dragging, from 0 (snap only on drop) to 1 (strong homing). | Strength             *(number)* <br> |
| Set snap mode | How snapping detects a target: Radius (object within snap radius) or Overlap (the drag position collides with a target object, or the dragged object overlaps it). | Mode             *(combo)* <br> |
| Set snap radius | Distance in pixels within which the object snaps to a target on drop and is magnetised while dragging. 0 disables snapping. | Radius             *(number)* <br> |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |
| Is dragging | True while the object is being dragged. |  |
| Is enabled | True if the behaviour is active. |  |
| On drag cancelled | Triggered when a drag ends via Drop (cancel) or a break-distance cancel. No throw is applied. |  |
| On drag started | Triggered when Start Drag succeeds. |  |
| On dropped | Triggered when a drag ends via Drop (release) or a break-distance drop. The throw is available. |  |
| Is snapping | True while the dragged object is within snap radius of a target (so a drop would snap to it). |  |
| On snapped | Triggered after a release that lands within snap radius of a target. Fires alongside On Dropped. Read SnapTargetX, SnapTargetY, and SnappedObjectUID. |  |


---
## Expressions
| Expression | Description | Return Type | Params
| --- | --- | --- | --- |
| DragPointObjectUID | UID of the object the drag point is glued to (set by Start drag at object), or -1 if the drag point is a free position. | number |  | 
| DragPointX | Current world-space X of the drag point. | number |  | 
| DragPointY | Current world-space Y of the drag point. | number |  | 
| DropReason | Why the drag ended: "manual" for a Drop action, "broke_distance" for a break-distance end. | string |  | 
| ThrowSpeed | Magnitude of the throw velocity. Use inside On Dropped. | number |  | 
| ThrowVelocityX | X component of the measured throw velocity. Use inside On Dropped. | number |  | 
| ThrowVelocityY | Y component of the measured throw velocity. Use inside On Dropped. | number |  | 
| DistanceFromPoint | Current gap in pixels between the object and the drag point. Grows while blocked by a solid. | number |  | 
| SpringVelocityX | X component of the object's current spring velocity in pixels per second. Valid while Follow Mode is Spring Physics. | number |  | 
| SpringVelocityY | Y component of the object's current spring velocity in pixels per second. Valid while Follow Mode is Spring Physics. | number |  | 
| SnappedObjectUID | UID of the object snapped to on the last drop, or -1 if the snap was a position or no snap occurred. | number |  | 
| SnapTargetX | X of the nearest snap target. While dragging it tracks the nearest target; after a snap it is the snapped position. | number |  | 
| SnapTargetY | Y of the nearest snap target. While dragging it tracks the nearest target; after a snap it is the snapped position. | number |  | 


---
## Changelog

**1.4.0.1**

**1.4.0.0**
- **Added:** - "Grid" Follow Mode: fourth Follow Mode option that snaps the dragged object to a tile grid, plus a Set grid action and 4 grid panel properties (Cell Width/Height, Origin X/Y).
- **Added:** - Spring Physics follow mode (earlier): Set spring action and SpringVelocityX/Y expressions.

**1.3.0.0**
- **Added:** - Follow Mode panel property (combo: Instant / Constant Speed / Spring Physics) that explicitly selects how the object chases the drag point
- **Added:** - Spring Stiffness and Spring Damping panel properties
- **Added:** - Set follow mode action to switch movement mode at runtime
- **Added:** - Set spring action to tune stiffness and damping at runtime
- **Added:** - SpringVelocityX and SpringVelocityY expressions for reading the object's live spring velocity
- **Added:** - Spring-physics movement in the runtime: Hooke's law restoring force plus viscous damping, integrated with semi-implicit Euler for frame-rate stability
- **Added:** - Save/load persistence for followMode
- **Added:** -
- **Added:** -
- **Added:** -
- **Added:** -
- **Added:** -
- **Changed:** - Throw measurement now samples the object's own spring velocity in spring mode instead of the drag-point delta, giving the physically correct release velocity

**1.2.1.0**
- **Added:** - Added "Set drag point to object" ACEs
- **Added:** - Shows icon in the Actions similar to the Built-in Addons now, to avoid confusion

**1.2.0.0**

**1.1.2.0**
- **Added:** Added a "Snap mode: radius or collision"

**1.1.1.0**
- **Changed:** clean up of ACEs & categorised.

**1.1.0.0**
- **Added:** - Snapping, Magnetism and Homing.
- **Changed:** - overhaul on the vocabulary for the ACEs.
- **Changed:** - Exposed a few simple properties
- **Changed:** - Reworked axis lock into 8Direction-style Directions

**1.0.0.0**

**0.0.0.0**
- **Added:** Initial release.

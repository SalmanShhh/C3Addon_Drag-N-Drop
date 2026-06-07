export const config = {
  listName: "Set snap radius",
  displayText: "Set snap radius to {0}",
  description:
    "Distance in pixels within which the object snaps to a target on drop and is magnetised while dragging. 0 disables snapping.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "radius",
      name: "Radius",
      desc: "Snap and magnet range in pixels. 0 disables snapping.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (radius) {
  this._setSnapRadius(radius);
}

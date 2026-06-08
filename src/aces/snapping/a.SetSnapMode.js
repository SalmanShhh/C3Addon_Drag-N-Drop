export const config = {
  listName: "Set snap mode",
  displayText: "Set snap mode to {0}",
  description:
    "How snapping detects a target: Radius (object within snap radius) or Overlap (the drag position collides with a target object, or the dragged object overlaps it).",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "mode",
      name: "Mode",
      desc: "Radius uses the snap radius; Overlap uses collision at the drag position.",
      type: "combo",
      initialValue: "radius",
      items: [{ radius: "Radius (distance)" }, { overlap: "Overlap (collision)" }],
    },
  ],
};

export const expose = true;

export default function (mode) {
  this._setSnapMode(mode);
}

export const config = {
  listName: "Set distance clamp",
  displayText: "Set distance clamp to {0}",
  description: "Limits how far the object can travel from its grab origin.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "radius",
      name: "Radius",
      desc: "Maximum travel distance in pixels. 0 disables the clamp.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (radius) {
  this._setDistanceClamp(radius);
}

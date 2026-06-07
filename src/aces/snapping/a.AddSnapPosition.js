export const config = {
  listName: "Add snap position",
  displayText: "Add snap position ({0}, {1})",
  description:
    "Registers a world-space position as a snap and magnet target. Needs a snap radius to take effect.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "x",
      name: "X",
      desc: "World-space X of the snap target.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "y",
      name: "Y",
      desc: "World-space Y of the snap target.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (x, y) {
  this._addSnapPosition(x, y);
}

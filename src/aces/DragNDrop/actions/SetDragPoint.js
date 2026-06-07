export const config = {
  listName: "Set drag point",
  displayText: "Set drag point to ({0}, {1})",
  description:
    "Updates the world-space point the object follows. Call every tick while dragging.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "x",
      name: "X",
      desc: "World-space X of the drag point (e.g. cursor or touch X).",
      type: "number",
      initialValue: "0",
    },
    {
      id: "y",
      name: "Y",
      desc: "World-space Y of the drag point (e.g. cursor or touch Y).",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (x, y) {
  this._setDragPoint(x, y);
}

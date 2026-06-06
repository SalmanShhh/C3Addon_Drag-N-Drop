export const config = {
  listName: "Set anchor",
  displayText: "Set anchor to {0}, {1}",
  description: "Updates the world-space anchor that the dragged object follows.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "x",
      name: "X",
      desc: "World-space X anchor position.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "y",
      name: "Y",
      desc: "World-space Y anchor position.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (x, y) {
  this._setAnchor(x, y);
}

export const config = {
  listName: "Set grab offset",
  displayText: "Set grab offset to {0}, {1}",
  description: "Overrides the offset used while the object is held.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "offsetX",
      name: "Offset X",
      desc: "Horizontal offset from the anchor.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "offsetY",
      name: "Offset Y",
      desc: "Vertical offset from the anchor.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (offsetX, offsetY) {
  this._setGrabOffset(offsetX, offsetY);
}

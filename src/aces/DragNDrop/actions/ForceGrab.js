export const config = {
  listName: "Force grab",
  displayText: "Force grab at {0}, {1} using {2}",
  description: "Cancels any current drag and starts a new one immediately.",
  isAsync: false,
  highlight: false,
  isDeprecated: false,
  params: [
    {
      id: "anchorX",
      name: "Anchor X",
      desc: "World-space X position of the anchor.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "anchorY",
      name: "Anchor Y",
      desc: "World-space Y position of the anchor.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "grabMode",
      name: "Grab mode",
      desc: "Keep the existing offset or snap to the anchor center.",
      type: "combo",
      initialValue: "0",
      items: [{ 0: "Keep offset" }, { 1: "Snap to anchor" }],
    },
  ],
};

export const expose = true;

export default function (anchorX, anchorY, grabMode) {
  this._forceGrab(anchorX, anchorY, grabMode);
}
